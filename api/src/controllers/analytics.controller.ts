import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { getClassMasteryAnalytics, getAtRiskStudents } from "../services/mastery.service"
import { MasteryTrend } from "@prisma/client"
import { getAIProvider } from "../services/ai.service"

/**
 * Next Best Action Engine for Student.
 * Recommends contextual next steps based on weakness, upcoming deadlines, and unfinished materials.
 */
export async function getStudentRecommendations(req: AuthRequest, res: Response) {
  const userId = req.user!.id

  // 1. Weakest topic recommendation
  const lowestMastery = await prisma.topicMastery.findFirst({
    where: { userId },
    orderBy: { masteryScore: "asc" },
  })

  // 2. Upcoming assignment deadlines
  const enrolledCourses = await prisma.enrollment.findMany({
    where: { userId },
    select: { courseId: true },
  })
  const courseIds = enrolledCourses.map((e) => e.courseId)

  const upcomingAssignments = await prisma.assignment.findMany({
    where: {
      courseId: { in: courseIds },
      deadline: { gte: new Date() },
      submissions: { none: { userId } },
    },
    include: { course: { select: { title: true } } },
    orderBy: { deadline: "asc" },
    take: 2,
  })

  // 3. Unfinished learning materials
  const nextMaterial = await prisma.material.findFirst({
    where: {
      module: { courseId: { in: courseIds } },
      progress: { none: { userId, completed: true } },
    },
    include: { module: { include: { course: { select: { id: true, title: true } } } } },
    orderBy: { order: "asc" },
  })

  const recommendations = []

  // Priority 1: Critical weak topic
  if (lowestMastery && lowestMastery.masteryScore < 65) {
    recommendations.push({
      type: "AI_TRAINING",
      priority: "HIGH",
      title: `Perkuat Topik: ${lowestMastery.topic}`,
      description: `Nilai rata-rata saat ini ${Math.round(lowestMastery.masteryScore)}. AI siap menyusun latihan adaptif 5 soal.`,
      actionUrl: `/ai-training?topic=${encodeURIComponent(lowestMastery.topic)}`,
      actionLabel: "Mulai Latihan AI",
      metadata: {
        topic: lowestMastery.topic,
        masteryScore: lowestMastery.masteryScore,
        trend: lowestMastery.trend,
      },
    })
  }

  // Priority 2: Urgent assignment
  if (upcomingAssignments.length > 0) {
    const a = upcomingAssignments[0]
    recommendations.push({
      type: "ASSIGNMENT",
      priority: "HIGH",
      title: `Kumpulkan Tugas: ${a.title}`,
      description: `Mata kuliah: ${a.course.title}. Batas waktu: ${new Date(a.deadline).toLocaleDateString("id-ID")}`,
      actionUrl: `/courses/${a.courseId}`,
      actionLabel: "Lihat Tugas",
      metadata: { assignmentId: a.id, deadline: a.deadline },
    })
  }

  // Priority 3: Resume learning
  if (nextMaterial) {
    recommendations.push({
      type: "LMS",
      priority: "MEDIUM",
      title: `Lanjutkan Materi: ${nextMaterial.title}`,
      description: `Modul ${nextMaterial.module.title} (${nextMaterial.module.course.title})`,
      actionUrl: `/courses/${nextMaterial.module.course.id}`,
      actionLabel: "Buka Materi",
      metadata: { materialId: nextMaterial.id },
    })
  }

  res.json({
    recommendations,
    summary: {
      hasCriticalWeakness: !!(lowestMastery && lowestMastery.masteryScore < 65),
      pendingAssignmentsCount: upcomingAssignments.length,
    },
  })
}

/**
 * Student Learning Profile & Remediation History.
 * Returns overall mastery, trend breakdown, and pre vs post training improvements.
 */
export async function getStudentProfile(req: AuthRequest, res: Response) {
  const userId = req.user!.id

  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    orderBy: { masteryScore: "desc" },
  })

  const trainingHistory = await prisma.trainingSession.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
    take: 10,
  })

  const quizAnswers = await prisma.quizAnswer.findMany({
    where: { userId },
  })

  const quizResults = await prisma.quizResult.findMany({
    where: { userId },
  })

  // Personal Best Metrics
  const highestScore = quizResults.length > 0 ? Math.max(...quizResults.map((r) => r.totalScore)) : 0
  const fastestCorrectMs =
    quizAnswers.filter((a) => a.isCorrect).length > 0
      ? Math.min(...quizAnswers.filter((a) => a.isCorrect).map((a) => a.responseTimeMs))
      : 0
  const totalCorrectAnswers = quizAnswers.filter((a) => a.isCorrect).length
  const totalQuestionsAnswered = quizAnswers.length
  const overallQuizAccuracy =
    totalQuestionsAnswered > 0 ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100) : 0

  const avgMastery =
    masteries.length > 0
      ? Math.round(masteries.reduce((sum, m) => sum + m.masteryScore, 0) / masteries.length)
      : 0

  res.json({
    overview: {
      overallMastery: avgMastery,
      topicsTracked: masteries.length,
      improvingCount: masteries.filter((m) => m.trend === MasteryTrend.IMPROVING).length,
      decliningCount: masteries.filter((m) => m.trend === MasteryTrend.DECLINING).length,
      trainingsCompleted: trainingHistory.length,
    },
    personalBests: {
      highestQuizScore: highestScore,
      fastestAnswerSec: fastestCorrectMs > 0 ? Number((fastestCorrectMs / 1000).toFixed(1)) : 0,
      overallAccuracy: overallQuizAccuracy,
      totalQuestionsAnswered,
    },
    topicMasteries: masteries.map((m) => ({
      topic: m.topic,
      masteryScore: Math.round(m.masteryScore),
      confidence: Number(m.confidence.toFixed(2)),
      accuracy: Math.round(m.accuracy * 100),
      recentAccuracy: Math.round(m.recentAccuracy * 100),
      trend: m.trend,
      attempts: m.attemptCount,
      lastPracticedAt: m.lastPracticedAt,
    })),
    remediationImpact: trainingHistory.map((t) => ({
      id: t.id,
      topic: t.topic,
      difficulty: t.difficulty,
      preAccuracy: t.preAccuracy ?? 50,
      postAccuracy: t.postAccuracy ?? 50,
      improvementDelta: t.improvementDelta ?? 0,
      completedAt: t.completedAt,
    })),
  })
}

/**
 * Teacher Intelligence Dashboard.
 * Class topic mastery, at-risk diagnosis, and recommended pedagogical actions.
 */
export async function getTeacherCourseIntelligence(req: AuthRequest, res: Response) {
  if (req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Teachers only" })
  }

  const courseId = parseInt(req.params.courseId)
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: "Course not found" })
  if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

  const [classMastery, atRiskStudents] = await Promise.all([
    getClassMasteryAnalytics(courseId),
    getAtRiskStudents(courseId),
  ])

  // Recommended class-wide pedagogical actions
  const classRecommendations = []
  const hardestTopic = classMastery.find((tm) => tm.needsClassIntervention)
  if (hardestTopic) {
    classRecommendations.push({
      type: "REMEDIAL_CLASS",
      topic: hardestTopic.topic,
      title: `Intervensi Kelas Diperlukan: Topik ${hardestTopic.topic}`,
      description: `${hardestTopic.strugglingPercentage}% siswa di kelas ini memiliki pemahaman di bawah 60%. Disarankan untuk membahas kembali konsep ini pada sesi kuliah berikutnya atau membuat kuis review.`,
    })
  }

  if (atRiskStudents.length > 0) {
    classRecommendations.push({
      type: "STUDENT_INTERVENTION",
      title: `${atRiskStudents.length} Siswa Terdeteksi Memerlukan Bantuan`,
      description: `Daftar siswa memiliki indikator kehadiran rendah, tugas belum dikumpulkan, atau tren penurunan nilai kuis.`,
    })
  }

  const aiClassStrategy = {
    status: atRiskStudents.length > 0 ? "ATTENTION_NEEDED" : "OPTIMAL",
    headline: atRiskStudents.length > 0
      ? `Strategi Intervensi AI: ${atRiskStudents.length} Mahasiswa Memerlukan Pendampingan Terarah`
      : `Status Kelas Optimal: Pemahaman Materi Merata`,
    overview: atRiskStudents.length > 0
      ? `Berdasarkan analisis silang presensi, tugas, dan nilai kuis, ${atRiskStudents.length} mahasiswa berpotensi mengalami kesulitan jika tidak diberikan intervensi dini. Direkomendasikan melakukan pendekatan personal serta penugasan modul adaptif berbobot ringan.`
      : `Seluruh mahasiswa terdaftar menunjukkan performa stabil di atas ambang batas. Pengajar dapat melanjutkan ke materi lanjutan atau memberikan tantangan studi kasus aplikatif.`,
    recommendedActions: atRiskStudents.length > 0
      ? [
          {
            phase: "Minggu Ini",
            action: "Kirim pesan check-in personal 1-on-1 dan buka jadwal konsultasi santai 10 menit.",
            badge: "Prioritas Utama",
          },
          {
            phase: "Sesi Kuliah Berikutnya",
            action: "Alokasikan 15 menit awal untuk review miskonsepsi topik kritis dan demonstrasi studi kasus.",
            badge: "Pedagogis",
          },
          {
            phase: "Tindak Lanjut Evaluasi",
            action: "Tugaskan 1 modul latihan adaptif berjenjang (Easy -> Medium) di Aksara AI Training sebagai kompensasi.",
            badge: "Adaptif",
          },
        ]
      : [
          {
            phase: "Pengayaan",
            action: "Berikan soal studi kasus tingkat lanjut dan eksplorasi materi praktikum tambahan.",
            badge: "Optimal",
          },
        ],
  }

  res.json({
    courseId,
    courseTitle: course.title,
    classMastery,
    atRiskStudents,
    classRecommendations,
    aiClassStrategy,
  })
}

/**
 * AI Pedagogical Consultation for Teachers.
 * Generates tailored pedagogical tips and counseling templates for specific at-risk students.
 */
export async function consultAITeacherTips(req: AuthRequest, res: Response) {
  if (req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Teachers only" })
  }

  const courseId = parseInt(req.params.courseId)
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: "Course not found" })
  if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

  const { studentId, question } = req.body
  if (!studentId) return res.status(400).json({ error: "studentId is required" })

  const student = await prisma.user.findUnique({
    where: { id: parseInt(studentId) },
    include: {
      topicMasteries: { where: { courseId } },
      attendanceCheckins: { where: { attendanceSession: { courseId } } },
      submissions: { where: { assignment: { courseId } } },
    },
  })

  if (!student) return res.status(404).json({ error: "Student not found" })

  const totalSessions = await prisma.attendanceSession.count({ where: { courseId } })
  const totalAssignments = await prisma.assignment.count({ where: { courseId } })
  const attendancePct = totalSessions > 0 ? (student.attendanceCheckins.length / totalSessions) * 100 : 100
  const lowTopics = student.topicMasteries.filter((m) => m.masteryScore < 60).map((m) => m.topic)

  const studentName = student.name || student.email
  const studentContext = `
Nama Mahasiswa: ${studentName}
Mata Kuliah: ${course.title}
Tingkat Kehadiran: ${Math.round(attendancePct)}%
Pengumpulan Tugas: ${student.submissions.length}/${totalAssignments}
Topik Kritis: ${lowTopics.length > 0 ? lowTopics.join(", ") : "Tidak ada topik kritis"}
Pertanyaan / Kebutuhan Dosen: ${question || "Bagaimana langkah terbaik membimbing mahasiswa ini agar kembali aktif dan memahami materi?"}
`.trim()

  const prompt = question && question !== "__GENERATE_FULL_AI_ANALYSIS__"
    ? `Anda adalah Konselor Pedagogi & Asisten Pembelajaran AI untuk dosen di Aksara LMS.
Berikan saran praktis, terarah, dan solutif untuk membantu dosen menangani mahasiswa berikut:

${studentContext}

Format jawaban dalam Bahasa Indonesia yang ringkas, hangat, dan terstruktur:
1. Analisis Situasi Singkat (1-2 kalimat)
2. 3 Langkah Solusi Taktis (poin aksi yang jelas)
3. Contoh Pesan Pembuka Dialog Personal (ramah & memotivasi)`
    : `Anda adalah Pakar Pedagogi & Asisten Dosen AI di platform Aksara LMS.
Analisis data performa mahasiswa berikut secara mendalam:

${studentContext}

Kembalikan HANYA JSON MURNI yang valid dengan struktur berikut:
{
  "rootCause": "Diagnosis mendalam akar masalah akademik/non-akademik mahasiswa (1-2 kalimat)",
  "actionSteps": [
    { "title": "1. [Nama Langkah]", "description": "[Deskripsi aksi konkret yang harus dilakukan dosen]", "priority": "URGENT" },
    { "title": "2. [Nama Langkah]", "description": "[Deskripsi aksi konkret yang harus dilakukan dosen]", "priority": "HIGH" },
    { "title": "3. [Nama Langkah]", "description": "[Deskripsi aksi konkret yang harus dilakukan dosen]", "priority": "MEDIUM" }
  ],
  "counselingDraft": "Draft pesan WhatsApp/email yang hangat, suportif, dan bebas stigma dari dosen ke mahasiswa",
  "remedialStrategy": "Rekomendasi strategi kuis remedial adaptif berbasis AI untuk memulihkan pemahaman"
}`

  try {
    const ai = getAIProvider()
    const rawResult = await ai.generateText(prompt, { temperature: 0.5, maxTokens: 900 })

    let structuredAdvice = null
    if (!question || question === "__GENERATE_FULL_AI_ANALYSIS__") {
      try {
        const cleaned = rawResult.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
        structuredAdvice = JSON.parse(cleaned)
      } catch (_jsonErr) {
        // parsing fallback
      }
    }

    return res.json({
      advice: rawResult,
      structuredAdvice,
      provider: ai.name,
      model: "Google Gemini 3.5 Flash Lite",
      isLiveAI: true,
      studentId: student.id,
      studentName,
    })
  } catch (_err) {
    const fallbackAdvice = `**Rekomendasi Pedagogis AI untuk Membimbing ${studentName}:**

1. **Diagnosis Situasi**: Mahasiswa memiliki tingkat kehadiran ${Math.round(attendancePct)}% dan telah menyelesaikan ${student.submissions.length}/${totalAssignments} tugas${lowTopics.length > 0 ? `, dengan indikasi hambatan pemahaman pada topik ${lowTopics.join(", ")}` : ""}.

2. **Langkah Solusi Taktis**:
   - **Dialog Personal (Bukan Teguran)**: Ajak berbicara 10 menit secara santai. Tanyakan apakah ada kendala teknis atau materi yang membingungkan.
   - **Remedial Terfokus**: Berikan kesempatan menyelesaikan 1 modul latihan adaptif berbobot ringan di Aksara AI Training untuk memulihkan rasa percaya diri.
   - **Fleksibilitas Deadline Terukur**: Berikan kelonggaran batas pengumpulan tugas dengan batas waktu yang disepakati bersama.

3. **Contoh Pesan Pembuka**:
   *"Halo ${studentName}, semoga kabarmu baik. Saya memperhatikan rekor perkuliahanmu di ${course.title}. Jika ada bagian yang membuatmu bingung, pintu konsultasi selalu terbuka ya. Mari kita diskusikan solusinya bersama!"*`

    return res.json({
      advice: fallbackAdvice,
      structuredAdvice: null,
      provider: "heuristic-fallback",
      model: "Aksara Deterministic Pedagogical Rules",
      isLiveAI: false,
      studentId: student.id,
      studentName,
    })
  }
}
