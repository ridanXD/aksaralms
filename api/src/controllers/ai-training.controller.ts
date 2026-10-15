import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { getAIProvider } from "../services/ai.service"
import { getFallbackPerformanceAnalysis, getFallbackTrainingMaterial } from "../services/ai.fallback"
import { updateMasteryFromTraining } from "../services/mastery.service"
import { TrainingSessionStatus } from "@prisma/client"
import { checkPromptGuard } from "../services/prompt-guard.service"
import { z } from "zod"

// ─── AI Performance Analysis ────────────────────────────

export async function analyzePerformance(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const quizResultId = parseInt(req.params.quizResultId)

    // Verify the quiz result belongs to the student
    const quizResult = await prisma.quizResult.findUnique({
      where: { id: quizResultId },
      include: {
        quizSession: { include: { course: true } },
      },
    })
    if (!quizResult) return res.status(404).json({ error: "Quiz result not found" })

    const enrolled = await prisma.enrollment.findFirst({
      where: {
        userId: req.user!.id,
        courseId: quizResult.quizSession.courseId,
      },
    })
    if (!enrolled && req.user!.role !== "TEACHER") {
      return res.status(403).json({ error: "Not enrolled" })
    }

    // Gather quiz data for AI analysis
    const answers = await prisma.quizAnswer.findMany({
      where: {
        quizSessionId: quizResult.quizSessionId,
        userId: quizResult.userId,
      },
      include: { question: true },
    })

    // Build topic stats
    const topicStats: Record<string, { correct: number; total: number }> = {}
    const quizResultsData = answers.map((a) => {
      const topic = a.question.topic
      if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
      topicStats[topic].total += 1
      if (a.isCorrect) topicStats[topic].correct += 1

      return {
        topic,
        correct: a.isCorrect,
        responseTimeMs: a.responseTimeMs,
      }
    })

    // Historical performance (other quiz results by this user)
    const otherResults = await prisma.quizResult.findMany({
      where: {
        userId: quizResult.userId,
        quizSession: { courseId: quizResult.quizSession.courseId },
      },
    })

    const historicalPerformance: Record<string, number> = {}
    otherResults.forEach((r) => {
      historicalPerformance[`quiz_${r.id}`] = (r.correctCount / r.totalCount) * 100
    })

    // Call AI provider with fallback resilience
    let analysis
    try {
      const provider = getAIProvider()
      analysis = await provider.analyzePerformance({
        quizResults: quizResultsData,
        topicTags: topicStats,
        historicalPerformance,
      })
    } catch (aiErr) {
      console.warn("AI Provider analysis failed, using pedagogical fallback:", aiErr)
      analysis = getFallbackPerformanceAnalysis(topicStats, historicalPerformance)
    }

    // Save analysis
    const existingAnalysis = await prisma.aIPerformanceAnalysis.findFirst({
      where: { quizResultId },
    })

    const saved = existingAnalysis
      ? await prisma.aIPerformanceAnalysis.update({
          where: { id: existingAnalysis.id },
          data: {
            strongTopics: analysis.strongTopics.join(","),
            weakTopics: analysis.weakTopics.join(","),
            recommendedTopics: analysis.recommendedTopics.join(","),
            recommendedDifficulty: analysis.recommendedDifficulty,
            suggestedPractice: analysis.suggestedPractice,
          },
        })
      : await prisma.aIPerformanceAnalysis.create({
          data: {
            quizResultId,
            strongTopics: analysis.strongTopics.join(","),
            weakTopics: analysis.weakTopics.join(","),
            recommendedTopics: analysis.recommendedTopics.join(","),
            recommendedDifficulty: analysis.recommendedDifficulty,
            suggestedPractice: analysis.suggestedPractice,
          },
        })

    res.json({
      id: saved.id,
      strongTopics: analysis.strongTopics,
      weakTopics: analysis.weakTopics,
      recommendedTopics: analysis.recommendedTopics,
      recommendedDifficulty: analysis.recommendedDifficulty,
      suggestedPractice: analysis.suggestedPractice,
    })
  } catch (err) {
    next(err)
  }
}

// ─── AI Training Session ──────────────────────────────────

const startTrainingSchema = z.object({
  quizResultId: z.number().optional(),
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionCount: z.number().int().min(1).max(20).default(5),
  questionTypes: z.array(z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"])).default(["SINGLE_CHOICE"]),
})

export async function startTrainingSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = startTrainingSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    // Groq Prompt Guard: Verify topic for prompt injection
    const guard = await checkPromptGuard(parsed.data.topic)
    if (!guard.isSafe) {
      return res.status(400).json({
        error: guard.blockedReason || "Prompt injection terdeteksi pada topik latihan.",
      })
    }

    const reqQuestionCount = parsed.data.questionCount || 5
    const reqQuestionTypes = (parsed.data.questionTypes && parsed.data.questionTypes.length > 0)
      ? parsed.data.questionTypes
      : ["SINGLE_CHOICE"]

    let preAccuracy = 50.0
    let courseId: number | undefined

    // Verify quiz result ownership & calculate baseline accuracy
    if (parsed.data.quizResultId) {
      const quizResult = await prisma.quizResult.findUnique({
        where: { id: parsed.data.quizResultId },
        include: { quizSession: { include: { course: true } }, weakTopics: true },
      })
      if (!quizResult) return res.status(404).json({ error: "Quiz result not found" })
      courseId = quizResult.quizSession.courseId

      const enrolled = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: req.user!.id,
            courseId,
          },
        },
      })
      if (!enrolled && req.user!.role !== "TEACHER") return res.status(403).json({ error: "Not enrolled" })

      const specificWeak = quizResult.weakTopics.find(
        (wt) => wt.topic.toLowerCase() === parsed.data.topic.toLowerCase()
      )
      if (specificWeak) {
        preAccuracy = Math.round(specificWeak.accuracy * 100)
      } else if (quizResult.totalCount > 0) {
        preAccuracy = Math.round((quizResult.correctCount / quizResult.totalCount) * 100)
      }
    } else {
      const topicMastery = await prisma.topicMastery.findFirst({
        where: {
          userId: req.user!.id,
          topic: parsed.data.topic,
        },
      })
      if (topicMastery) {
        preAccuracy = Math.round(topicMastery.accuracy * 100)
        courseId = topicMastery.courseId ?? undefined
      }
    }

    // Generate training material via AI with fallback resilience
    let material
    try {
      const provider = getAIProvider()
      material = await provider.generateTrainingMaterial(
        parsed.data.topic,
        parsed.data.difficulty,
        reqQuestionCount,
        reqQuestionTypes
      )
    } catch (aiErr) {
      console.warn("AI Provider question generation failed, using pedagogical fallback:", aiErr)
      material = getFallbackTrainingMaterial(
        parsed.data.topic,
        parsed.data.difficulty,
        reqQuestionCount,
        reqQuestionTypes
      )
    }

    // Validate generated questions
    const validatedQuestions: {
      question: string
      options: string[]
      correctAnswer: string
      explanation: string
      difficulty: "EASY" | "MEDIUM" | "HARD"
      topic: string
      type: string
      order: number
    }[] = []

    for (const pq of material.practiceQuestions) {
      if (pq.question && pq.correctAnswer) {
        validatedQuestions.push({
          question: pq.question,
          options: Array.isArray(pq.options) ? pq.options : [],
          correctAnswer: pq.correctAnswer,
          explanation: pq.explanation ?? "",
          difficulty: (pq.difficulty ? pq.difficulty.toUpperCase() : "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
          topic: pq.topic ?? parsed.data.topic,
          type: pq.type || (pq.options && pq.options.length > 0 ? "SINGLE_CHOICE" : "ESSAY"),
          order: validatedQuestions.length,
        })
      }
    }

    // If all failed schema, load fallback
    if (validatedQuestions.length === 0) {
      const fallback = getFallbackTrainingMaterial(
        parsed.data.topic,
        parsed.data.difficulty,
        reqQuestionCount,
        reqQuestionTypes
      )
      for (const pq of fallback.practiceQuestions) {
        validatedQuestions.push({
          question: pq.question,
          options: pq.options,
          correctAnswer: pq.correctAnswer,
          explanation: pq.explanation ?? "",
          difficulty: (pq.difficulty.toUpperCase() as "EASY" | "MEDIUM" | "HARD"),
          topic: parsed.data.topic,
          type: pq.type || "SINGLE_CHOICE",
          order: validatedQuestions.length,
        })
      }
    }

    // Create training session with preAccuracy
    const difficultyMap = { easy: "EASY", medium: "MEDIUM", hard: "HARD" }
    const session = await prisma.trainingSession.create({
      data: {
        userId: req.user!.id,
        quizResultId: parsed.data.quizResultId,
        topic: parsed.data.topic,
        difficulty: difficultyMap[parsed.data.difficulty] as any,
        questionCount: validatedQuestions.length,
        preAccuracy,
        questions: {
          create: validatedQuestions,
        },
      },
      include: {
        questions: true,
      },
    })

    res.status(201).json({
      sessionId: session.id,
      topic: session.topic,
      difficulty: session.difficulty,
      preAccuracy,
      explanation: material.explanation,
      example: material.example,
      questions: validatedQuestions.map((q) => {
        const sq = session.questions.find((s) => s.order === q.order)
        return {
          id: sq?.id,
          question: q.question,
          options: q.options,
          explanation: q.explanation,
          topic: q.topic,
          type: q.type,
        }
      }),
    })
  } catch (err) {
    next(err)
  }
}

// ─── Answer Training Question & Close Remediation Loop ───

const answerTrainingSchema = z.object({
  answer: z.string().min(1),
})

export async function answerTrainingQuestion(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = answerTrainingSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const questionId = parseInt(req.params.questionId)
    const question = await prisma.generatedQuestion.findUnique({
      where: { id: questionId },
      include: {
        trainingSession: {
          include: {
            questions: true,
            quizResult: { include: { quizSession: true } },
          },
        },
      },
    })
    if (!question) return res.status(404).json({ error: "Question not found" })
    if (question.trainingSession.userId !== req.user!.id) {
      return res.status(403).json({ error: "Not your session" })
    }
    if (question.answeredAt !== null) {
      return res.status(400).json({ error: "Question already answered" })
    }

    let isCorrect = false
    const qType = (question as any).type || "SINGLE_CHOICE"

    if (qType === "SINGLE_CHOICE") {
      isCorrect = parsed.data.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    } else if (qType === "MULTIPLE_CHOICE") {
      // Compare comma separated selections
      const userSelected = parsed.data.answer
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .sort()
      const correctSelected = question.correctAnswer
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean)
        .sort()
      isCorrect =
        userSelected.length === correctSelected.length &&
        userSelected.every((val, idx) => val === correctSelected[idx])
    } else if (qType === "ESSAY") {
      // Essay evaluation: check for prompt injection first
      const guard = await checkPromptGuard(parsed.data.answer)
      if (!guard.isSafe) {
        isCorrect = false
      } else {
        // Substantive response length >= 20 characters
        isCorrect = parsed.data.answer.trim().length >= 20
      }
    } else {
      isCorrect = parsed.data.answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    }

    await prisma.generatedQuestion.update({
      where: { id: questionId },
      data: {
        userAnswer: parsed.data.answer,
        isCorrect,
        answeredAt: new Date(),
      },
    })

    // Check if entire training session is completed
    const session = question.trainingSession
    const allQuestions = await prisma.generatedQuestion.findMany({
      where: { trainingSessionId: session.id },
    })

    const answeredCount = allQuestions.filter((q) => q.answeredAt !== null).length
    const correctCount = allQuestions.filter((q) => q.isCorrect === true).length
    const isSessionComplete = answeredCount === allQuestions.length

    let masteryOutcome = null

    if (isSessionComplete && session.status !== TrainingSessionStatus.COMPLETED) {
      const postAccuracy = Math.round((correctCount / allQuestions.length) * 100)
      const preAccuracy = session.preAccuracy ?? 50.0
      const improvementDelta = postAccuracy - preAccuracy

      await prisma.trainingSession.update({
        where: { id: session.id },
        data: {
          status: TrainingSessionStatus.COMPLETED,
          postAccuracy,
          improvementDelta,
          completedAt: new Date(),
        },
      })

      const courseId = session.quizResult?.quizSession?.courseId
      masteryOutcome = await updateMasteryFromTraining(
        req.user!.id,
        session.topic,
        allQuestions.length,
        correctCount,
        courseId
      )
    }

    res.json({
      correct: isCorrect,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      isSessionComplete,
      progress: {
        answered: answeredCount,
        total: allQuestions.length,
        correct: correctCount,
      },
      masteryOutcome,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Get Training Session Results ────────────────────────

export async function getTrainingSession(req: AuthRequest, res: Response) {
  const sessionId = parseInt(req.params.sessionId)
  const session = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: {
      questions: { orderBy: { order: "asc" } },
    },
  })
  if (!session) return res.status(404).json({ error: "Session not found" })
  if (session.userId !== req.user!.id && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not your session" })
  }

  const answered = session.questions.filter((q) => q.answeredAt !== null)
  const correct = answered.filter((q) => q.isCorrect)
  const postAccuracy =
    session.postAccuracy ?? (answered.length > 0 ? Math.round((correct.length / answered.length) * 100) : null)

  res.json({
    sessionId: session.id,
    topic: session.topic,
    difficulty: session.difficulty,
    status: session.status,
    preAccuracy: session.preAccuracy,
    postAccuracy,
    improvementDelta: session.improvementDelta ?? (session.preAccuracy && postAccuracy !== null ? postAccuracy - session.preAccuracy : 0),
    progress: {
      answered: answered.length,
      total: session.questions.length,
      correct: correct.length,
      accuracy: answered.length > 0 ? correct.length / answered.length : 0,
    },
    questions: session.questions,
  })
}

// ─── AI Material & Assignment Content Generator ──────────

const generateContentSchema = z.object({
  type: z.enum(["MATERIAL", "ASSIGNMENT"]).default("MATERIAL"),
  courseTitle: z.string().optional(),
  topic: z.string().min(1, "Topik materi atau tugas wajib diisi"),
  instructions: z.string().optional(),
})

export async function generateAIContent(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = generateContentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    const { type, courseTitle, topic, instructions } = parsed.data

    const guard = await checkPromptGuard(topic + " " + (instructions || ""))
    if (!guard.isSafe) {
      return res.status(400).json({
        error: guard.blockedReason || "Prompt injection terdeteksi pada permintaan AI.",
      })
    }

    let result = {
      title: "",
      content: "",
      suggestedType: type === "MATERIAL" ? "TEXT" : undefined,
    }

    try {
      const provider = getAIProvider()

      let prompt = ""
      if (type === "MATERIAL") {
        prompt = `Anda adalah dosen ahli dalam bidang pendidikan tinggi. Buatlah modul bahan ajar / materi perkuliahan komprehensif, terstruktur, dan edukatif dalam bahasa Indonesia dengan format Markdown.
Mata Kuliah: ${courseTitle || "Perkuliahan"}
Topik Materi: ${topic}
${instructions ? `Instruksi Tambahan Dosen: ${instructions}` : ""}

Ketentuan Output:
Gunakan format Markdown yang rapi dan profesional dengan struktur:
1. # [Judul Materi yang Menarik]
2. ## Ringkasan & Capaian Pembelajaran
3. ## Konsep Inti & Pembahasan Mendalam (gunakan subbab ###, poin-poin jelas, dan analogi)
4. ## Contoh Praktis / Studi Kasus / Kode (jika relevan)
5. ## Rangkuman & Poin Penting
6. ## Pertanyaan Diskusi Reflektif

Tuliskan langsung isi materi lengkap tanpa komentar pembuka.`
      } else {
        prompt = `Anda adalah dosen universitas yang sedang merancang lembar instruksi tugas kuliah (assignment) untuk mahasiswa.
Mata Kuliah: ${courseTitle || "Perkuliahan"}
Topik / Judul Tugas: ${topic}
${instructions ? `Instruksi Khusus: ${instructions}` : ""}

Ketentuan Output:
Gunakan format Markdown profesional dengan struktur:
1. # [Judul Tugas Kuliah]
2. ## Deskripsi & Latar Belakang Masalah
3. ## Instruksi Pengerjaan (Langkah demi langkah)
4. ## Ketentuan Pengumpulan & Format Berkas
5. ## Rubrik / Kriteria Penilaian (Bobot Persentase)
6. ## Tips & Saran Pengerjaan

Tuliskan langsung lembar instruksi tugas lengkap tanpa basa-basi.`
      }

      const generated = await provider.generateText(prompt, { temperature: 0.7, maxTokens: 2048 })
      const lines = generated.trim().split("\n")
      let title = topic
      const firstLine = lines[0]?.trim()
      if (firstLine && firstLine.startsWith("# ")) {
        title = firstLine.replace(/^#\s+/, "").trim()
      }

      result = {
        title,
        content: generated.trim(),
        suggestedType: type === "MATERIAL" ? "TEXT" : undefined,
      }
    } catch (aiErr) {
      console.warn("AI generation failed, generating pedagogical template:", aiErr)
      if (type === "MATERIAL") {
        result = {
          title: `Materi Perkuliahan: ${topic}`,
          content: `# Materi Perkuliahan: ${topic}

## Capaian Pembelajaran
Mahasiswa diharapkan mampu memahami konsep fundamental dari **${topic}**, mengidentifikasi komponen-komponen utamanya, serta menerapkannya dalam pemecahan masalah praktis.

---

## 1. Pengenalan & Konsep Dasar
**${topic}** merupakan pilar esensial dalam mata kuliah ${courseTitle || "ini"}. Konsep ini berfokus pada:
- Memahami prinsip kerja dan mekanisme operasional.
- Menganalisis kelebihan serta batasan dalam penerapannya.
- Praktik terbaik (*best practices*) yang dianjurkan oleh standar industri.

---

## 2. Pembahasan Mendalam & Implementasi
Dalam praktiknya, terdapat beberapa aspek krusial:
1. **Definisi Formal**: Penjelasan spesifikasi teknis dan terminologi yang digunakan.
2. **Komponen Arsitektur**: Struktur data dan alur logika yang mendasari proses.
3. **Contoh Kasus**: Skenario dunia nyata di mana pendekatan ini memberikan solusi optimal.

\`\`\`
// Contoh skema alur implementasi
Input Data -> Pemrosesan Validasi -> Eksekusi Logika -> Luaran / Solusi
\`\`\`

---

## 3. Rangkuman & Poin Penting
- Kuasai fondasi dasar sebelum melangkah ke optimasi tingkat lanjut.
- Perhatikan faktor performa, keterbacaan, dan skalabilitas solusi.

---

## 4. Bahan Diskusi & Refleksi
1. Bagaimana perbandingan efisiensi pendekatan ini dibanding metode konvensional?
2. Kapan sebaiknya metode ini dihindari?`,
          suggestedType: "TEXT",
        }
      } else {
        result = {
          title: `Tugas Praktik: ${topic}`,
          content: `# Tugas Praktik: ${topic}

## Deskripsi Tugas
Tugas ini dirancang untuk menguji pemahaman teoritis dan keterampilan aplikatif mahasiswa mengenai materi **${topic}**.

---

## Instruksi Pengerjaan
1. Bacalah materi perkuliahan terkait topik **${topic}** sebelum memulai.
2. Buatlah solusi atau laporan komprehensif yang menjawab permasalahan yang diberikan.
3. Berikan analisis atau penjelasan terperinci mengenai metodologi dan langkah penyelesaian.
4. Sertakan referensi, cuplikan kode, atau diagram pendukung jika relevan.

---

## Format Pengumpulan
- Unggah berkas dokumen (PDF) atau tautan repositori/dokumen tugas.
- Format penamaan berkas: \`NIM_NamaLengkap_Tugas_${topic.replace(/\s+/g, "_")}.pdf\`.
- Pastikan pengumpulan dilakukan sebelum batas waktu yang telah ditentukan.

---

## Kriteria Penilaian
| Kriteria | Bobot |
|---|---|
| Kebenaran Konsep & Akurasi Solusi | 40% |
| Analisis & Kedalaman Pembahasan | 30% |
| Kerapian Laporan & Format Dokumentasi | 20% |
| Tepat Waktu Pengumpulan | 10% |`,
          suggestedType: undefined,
        }
      }
    }

    res.json(result)
  } catch (err) {
    next(err)
  }
}

