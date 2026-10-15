import { prisma } from "../config/database"
import { MasteryTrend } from "@prisma/client"

export interface TopicPerformanceInput {
  topic: string
  correct: number
  total: number
  avgTimeMs?: number
}

/**
 * Deterministic, explainable Topic Mastery Engine.
 * Calculates rolling mastery score (0-100), confidence, and trend.
 */
export async function updateMasteryFromQuiz(
  userId: number,
  courseId: number,
  topicPerformances: TopicPerformanceInput[]
) {
  for (const perf of topicPerformances) {
    if (perf.total === 0) continue

    const sessionAccuracy = (perf.correct / perf.total) * 100
    const timeSpeedBonus = perf.avgTimeMs
      ? perf.avgTimeMs < 3000
        ? 5
        : perf.avgTimeMs > 10000
        ? -5
        : 0
      : 0
    const sessionScore = Math.max(0, Math.min(100, sessionAccuracy + timeSpeedBonus))

    const existing = await prisma.topicMastery.findFirst({
      where: {
        userId,
        courseId,
        topic: perf.topic,
      },
    })

    if (!existing) {
      const initialMastery = Math.round(sessionScore)
      const confidence = Math.min(1.0, 0.3 + perf.total * 0.05)

      await prisma.topicMastery.create({
        data: {
          userId,
          courseId,
          topic: perf.topic,
          masteryScore: initialMastery,
          confidence,
          attemptCount: perf.total,
          correctCount: perf.correct,
          accuracy: perf.correct / perf.total,
          recentAccuracy: perf.correct / perf.total,
          avgResponseMs: perf.avgTimeMs ?? 0,
          trend: MasteryTrend.STABLE,
          lastPracticedAt: new Date(),
        },
      })
    } else {
      const totalAttempts = existing.attemptCount + perf.total
      const totalCorrect = existing.correctCount + perf.correct
      const overallAccuracy = totalCorrect / totalAttempts
      const recentAccuracy = perf.correct / perf.total

      // Rolling alpha: newer attempts have 40% weight, history 60%
      const alpha = 0.4
      const newMasteryScore = Math.round(alpha * sessionScore + (1 - alpha) * existing.masteryScore)

      // Trend analysis
      const delta = newMasteryScore - existing.masteryScore
      let trend: MasteryTrend = MasteryTrend.STABLE
      if (delta >= 3) trend = MasteryTrend.IMPROVING
      else if (delta <= -3) trend = MasteryTrend.DECLINING

      const newAvgTime =
        perf.avgTimeMs && existing.avgResponseMs > 0
          ? Math.round((existing.avgResponseMs + perf.avgTimeMs) / 2)
          : perf.avgTimeMs || existing.avgResponseMs

      const confidence = Math.min(1.0, existing.confidence + 0.1)

      await prisma.topicMastery.update({
        where: { id: existing.id },
        data: {
          courseId: courseId || existing.courseId,
          masteryScore: newMasteryScore,
          confidence,
          attemptCount: totalAttempts,
          correctCount: totalCorrect,
          accuracy: overallAccuracy,
          recentAccuracy,
          avgResponseMs: newAvgTime,
          trend,
          lastPracticedAt: new Date(),
        },
      })
    }
  }
}

/**
 * Updates mastery after a student completes an AI training session.
 * Closes the AI remediation loop with pre/post evaluation.
 */
export async function updateMasteryFromTraining(
  userId: number,
  topic: string,
  totalCount: number,
  correctCount: number,
  courseId?: number
) {
  if (totalCount === 0) return null

  const trainingAccuracy = (correctCount / totalCount) * 100
  const existing = await prisma.topicMastery.findFirst({
    where: {
      userId,
      ...(courseId ? { courseId } : {}),
      topic,
    },
  })

  const preMastery = existing ? existing.masteryScore : 50.0

  if (!existing) {
    const initialMastery = Math.round(trainingAccuracy)
    const newRecord = await prisma.topicMastery.create({
      data: {
        userId,
        courseId,
        topic,
        masteryScore: initialMastery,
        confidence: 0.5,
        attemptCount: totalCount,
        correctCount,
        accuracy: correctCount / totalCount,
        recentAccuracy: correctCount / totalCount,
        avgResponseMs: 0,
        trend: initialMastery >= 60 ? MasteryTrend.IMPROVING : MasteryTrend.STABLE,
        lastPracticedAt: new Date(),
      },
    })
    return {
      preMastery: 50.0,
      postMastery: initialMastery,
      delta: initialMastery - 50.0,
      trend: newRecord.trend,
    }
  }

  // Weight training heavily (50%) for remedial impact
  const alpha = 0.5
  const postMastery = Math.round(alpha * trainingAccuracy + (1 - alpha) * existing.masteryScore)
  const delta = postMastery - existing.masteryScore

  let trend: MasteryTrend = existing.trend
  if (delta >= 2) trend = MasteryTrend.IMPROVING
  else if (delta <= -2) trend = MasteryTrend.DECLINING

  const totalAttempts = existing.attemptCount + totalCount
  const totalCorrect = existing.correctCount + correctCount

  await prisma.topicMastery.update({
    where: { id: existing.id },
    data: {
      masteryScore: postMastery,
      confidence: Math.min(1.0, existing.confidence + 0.15),
      attemptCount: totalAttempts,
      correctCount: totalCorrect,
      accuracy: totalCorrect / totalAttempts,
      recentAccuracy: correctCount / totalCount,
      trend,
      lastPracticedAt: new Date(),
    },
  })

  // Synchronize WeakTopic records: if mastery >= 70, resolve/update accuracy
  if (postMastery >= 70) {
    const userQuizResults = await prisma.quizResult.findMany({
      where: {
        userId,
        ...(courseId ? { quizSession: { courseId } } : {}),
      },
      select: { id: true },
    })
    const resultIds = userQuizResults.map((r) => r.id)
    if (resultIds.length > 0) {
      await prisma.weakTopic.updateMany({
        where: {
          quizResultId: { in: resultIds },
          topic: { equals: topic, mode: "insensitive" },
        },
        data: {
          accuracy: postMastery / 100,
        },
      })
    }
  }

  return {
    preMastery,
    postMastery,
    delta,
    trend,
    isResolved: postMastery >= 70,
  }
}

/**
 * Aggregates class-level mastery and identifies struggling topics for teachers.
 */
export async function getClassMasteryAnalytics(courseId: number) {
  const masteries = await prisma.topicMastery.findMany({
    where: { courseId },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  const topicMap: Record<
    string,
    { totalScore: number; count: number; studentScores: number[]; strugglingCount: number }
  > = {}

  for (const m of masteries) {
    if (!topicMap[m.topic]) {
      topicMap[m.topic] = { totalScore: 0, count: 0, studentScores: [], strugglingCount: 0 }
    }
    topicMap[m.topic].totalScore += m.masteryScore
    topicMap[m.topic].count += 1
    topicMap[m.topic].studentScores.push(m.masteryScore)
    if (m.masteryScore < 60) {
      topicMap[m.topic].strugglingCount += 1
    }
  }

  const topicSummary = Object.entries(topicMap).map(([topic, data]) => {
    const avgMastery = Math.round(data.totalScore / data.count)
    const strugglingPct = Math.round((data.strugglingCount / data.count) * 100)
    let difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
    if (avgMastery >= 75) difficulty = "EASY"
    else if (avgMastery < 55) difficulty = "HARD"

    return {
      topic,
      avgMastery,
      studentCount: data.count,
      strugglingPercentage: strugglingPct,
      difficulty,
      needsClassIntervention: strugglingPct >= 40,
    }
  })

  topicSummary.sort((a, b) => a.avgMastery - b.avgMastery)
  return topicSummary
}

/**
 * Detects at-risk students with transparent and explainable risk factors.
 */
export async function getAtRiskStudents(courseId: number) {
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          topicMasteries: { where: { courseId } },
          attendanceCheckins: { where: { attendanceSession: { courseId } } },
          submissions: { where: { assignment: { courseId } } },
          quizResults: { where: { quizSession: { courseId } } },
        },
      },
    },
  })

  const totalSessions = await prisma.attendanceSession.count({ where: { courseId } })
  const totalAssignments = await prisma.assignment.count({ where: { courseId } })

  const atRiskStudents = []

  for (const enrollment of enrollments) {
    const student = enrollment.user
    const riskFactors: string[] = []

    // 1. Attendance rate
    const checkinCount = student.attendanceCheckins.length
    const attendancePct = totalSessions > 0 ? (checkinCount / totalSessions) * 100 : 100
    if (totalSessions > 0 && attendancePct < 70) {
      riskFactors.push(`Kehadiran rendah (${Math.round(attendancePct)}%)`)
    }

    // 2. Assignment completion
    const submissionCount = student.submissions.length
    const assignmentPct = totalAssignments > 0 ? (submissionCount / totalAssignments) * 100 : 100
    if (totalAssignments > 0 && assignmentPct < 60) {
      riskFactors.push(`Pengumpulan tugas belum lengkap (${submissionCount}/${totalAssignments})`)
    }

    // 3. Quiz & Topic Mastery
    const masteries = student.topicMasteries
    const lowMasteries = masteries.filter((m) => m.masteryScore < 60)
    const decliningMasteries = masteries.filter((m) => m.trend === MasteryTrend.DECLINING)

    if (lowMasteries.length > 0) {
      riskFactors.push(
        `Topik kritis butuh remedial: ${lowMasteries.map((m) => m.topic).join(", ")}`
      )
    }
    if (decliningMasteries.length > 0) {
      riskFactors.push(
        `Tren penurunan performa pada: ${decliningMasteries.map((m) => m.topic).join(", ")}`
      )
    }

    const avgMastery =
      masteries.length > 0
        ? Math.round(masteries.reduce((acc, m) => acc + m.masteryScore, 0) / masteries.length)
        : 50

    if (riskFactors.length > 0) {
      const studentName = student.name || student.email
      const lowTopicNames = lowMasteries.map((m) => m.topic)
      const decliningTopicNames = decliningMasteries.map((m) => m.topic)

      // Generate context-aware AI pedagogical advice for teacher
      let rootCause = ""
      if (totalSessions > 0 && attendancePct < 70 && totalAssignments > 0 && assignmentPct < 60 && lowMasteries.length > 0) {
        rootCause = `${studentName} mengalami disengagement multi-faktor: ketidakhadiran (${Math.round(attendancePct)}%) memicu ketertinggalan pengumpulan tugas (${submissionCount}/${totalAssignments}) serta penurunan pemahaman konsep materi (${lowTopicNames.join(", ")}).`
      } else if (totalSessions > 0 && attendancePct < 70) {
        rootCause = `Faktor risiko utama adalah kehadiran rendah (${Math.round(attendancePct)}%). Mahasiswa berpotensi mengalami kendala non-akademis (jadwal/kesehatan/koneksi) yang menghambat partisipasi sesi tatap muka.`
      } else if (lowMasteries.length > 0) {
        rootCause = `Mahasiswa aktif hadir namun kesulitan memahami konsep ${lowTopicNames.join(", ")} (skor di bawah 60%). Ini mengindikasikan kesenjangan pemahaman dasar yang perlu diurai kembali.`
      } else if (decliningMasteries.length > 0) {
        rootCause = `Terdeteksi penurunan tren performa pada materi ${decliningTopicNames.join(", ")}. Mahasiswa mungkin kehilangan ritme belajar atau kewalahan menghadapi materi lanjutan.`
      } else {
        rootCause = `Performa belajar berada di bawah ambang rata-rata (${avgMastery}%). Memerlukan pendampingan belajar terstruktur sebelum evaluasi tengah/akhir semester.`
      }

      const primaryTopic = lowTopicNames[0] || decliningTopicNames[0] || "materi perkuliahan"
      const actionSteps = [
        {
          title: "1. Pendekatan Empatis & Sesi 1-on-1 Ringan",
          description: `Lakukan check-in personal 5-10 menit setelah kelas atau via chat. Tanyakan kendala spesifik tanpa memojokkan presensi atau tugas yang terlewat.`,
          priority: (totalSessions > 0 && attendancePct < 70 ? "URGENT" : "HIGH") as "URGENT" | "HIGH" | "MEDIUM",
        },
        {
          title: "2. Penugasan Remedial AI Adaptif Mandiri",
          description: lowTopicNames.length > 0
            ? `Arahkan mahasiswa menyelesaikan latihan adaptif AI khusus topik ${lowTopicNames[0]} tingkat kesulitan EASY untuk memulihkan pemahaman dasar dan rasa percaya diri.`
            : `Berikan latihan diagnostik singkat untuk memetakan bagian silabus yang belum dipahami secara optimal.`,
          priority: (lowTopicNames.length > 0 ? "HIGH" : "MEDIUM") as "URGENT" | "HIGH" | "MEDIUM",
        },
        {
          title: "3. Fleksibilitas Pengumpulan & Rekan Belajar (Peer Buddy)",
          description: totalAssignments > 0 && submissionCount < totalAssignments
            ? `Berikan kesempatan pengerjaan susulan untuk ${totalAssignments - submissionCount} tugas tertunda dengan tenggat realistis, atau pasangkan dengan rekan mahasiswa berperingkat atas untuk belajar bersama.`
            : `Pantau konsistensi pengerjaan tugas berikutnya dan beri umpan balik positif atas setiap perbaikan kecil.`,
          priority: "MEDIUM" as "URGENT" | "HIGH" | "MEDIUM",
        },
      ]

      const counselingDraft = `Halo ${studentName}, semoga kabarmu baik. Saya memperhatikan rekor perkuliahanmu baru-baru ini, khususnya pemahaman di topik ${primaryTopic}. Saya ingin memastikan kamu tidak mengalami kesulitan berlarut-larut. Jangan khawatir, kamu bisa mencoba latihan mandiri di menu AI Training Aksara, atau jika butuh diskusi langsung dengan saya atau asisten lab, pintu konsultasi selalu terbuka ya. Mari kita kejar ketertinggalan bersama!`

      const remedialStrategy = lowTopicNames.length > 0
        ? `Tugaskan micro-quiz adaptif 5 soal berjenjang (Easy -> Medium) pada topik ${lowTopicNames.join(", ")} di Aksara AI Training.`
        : `Dorong penyelesaian sisa materi modul silabus dan 1 sesi latihan mandiri berbasis AI.`

      atRiskStudents.push({
        id: student.id,
        name: studentName,
        email: student.email,
        avgMastery,
        attendancePercentage: Math.round(attendancePct),
        assignmentCompletion: `${submissionCount}/${totalAssignments}`,
        riskFactors,
        recommendedIntervention:
          lowMasteries.length > 0
            ? `Berikan tugas remedial atau AI adaptive practice pada topik ${lowMasteries[0].topic}`
            : "Review kehadiran dan dorong pengerjaan materi LMS yang tertunda",
        aiAdvice: {
          rootCause,
          actionSteps,
          counselingDraft,
          remedialStrategy,
          suggestedAction: `Jadwalkan konseling 1-on-1 dan tugaskan AI Remedial pada topik ${primaryTopic}`,
        },
      })
    }
  }

  return atRiskStudents
}
