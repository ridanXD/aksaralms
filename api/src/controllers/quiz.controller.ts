import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { z } from "zod"

// ─── Quiz Session ────────────────────────────────────────

const createQuizSessionSchema = z.object({
  title: z.string().min(1, "Judul kuis wajib diisi"),
  description: z.string().optional(),
  isKingOfTheHill: z.boolean().default(false),
  topic: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  questions: z
    .array(
      z.object({
        question: z.string().min(1, "Pertanyaan wajib diisi"),
        type: z
          .enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"])
          .optional()
          .default("SINGLE_CHOICE"),
        options: z.array(z.string()).optional().default([]),
        correctOptionIndex: z.number().optional().default(0),
        correctOptionIndices: z.array(z.number()).optional().default([]),
        rubric: z.string().optional(),
        explanation: z.string().optional(),
        topic: z.string().optional(),
        difficulty: z.string().optional(),
        order: z.number().optional().default(0),
      })
    )
    .optional(),
})

export async function createQuizSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createQuizSessionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const courseId = parseInt(req.params.courseId)
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ error: "Course not found" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

    const session = await prisma.quizSession.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        isKingOfTheHill: parsed.data.isKingOfTheHill,
        courseId: course.id,
        quizQuestions: parsed.data.questions
          ? {
              create: parsed.data.questions.map((q, qIdx) => {
                const qType = q.type || "SINGLE_CHOICE"
                const isEssay = qType === "ESSAY"
                const isMulti = qType === "MULTIPLE_CHOICE"

                let optionsData = undefined
                if (!isEssay && q.options && q.options.length > 0) {
                  optionsData = {
                    create: q.options.map((opt, idx) => ({
                      text: opt,
                      isCorrect: isMulti
                        ? (q.correctOptionIndices && q.correctOptionIndices.length > 0
                            ? q.correctOptionIndices.includes(idx)
                            : idx === (q.correctOptionIndex ?? 0))
                        : idx === (q.correctOptionIndex ?? 0),
                      order: idx,
                    })),
                  }
                }

                return {
                  question: q.question,
                  topic: q.topic ?? "General",
                  difficulty: (q.difficulty ?? "MEDIUM").toUpperCase() as
                    | "EASY"
                    | "MEDIUM"
                    | "HARD",
                  type: qType,
                  rubric: q.rubric || null,
                  explanation: q.explanation || null,
                  order: q.order ?? qIdx,
                  options: optionsData,
                }
              }),
            }
          : undefined,
      },
    })

    res.status(201).json(session)
  } catch (err) {
    next(err)
  }
}

export async function getQuizSession(req: AuthRequest, res: Response) {
  const session = await prisma.quizSession.findUnique({
    where: { id: parseInt(req.params.sessionId) },
    include: {
      quizQuestions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  })

  if (!session) return res.status(404).json({ error: "Quiz session not found" })

  // Verify user is enrolled in the course
  const enrolled = await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId: req.user!.id, courseId: session.courseId },
    },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled in this course" })
  }

  const isTeacher = req.user!.role === "TEACHER"

  // Strip isCorrect and rubric for students during quiz execution
  const sanitized = {
    ...session,
    quizQuestions: session.quizQuestions.map((q) => ({
      ...q,
      rubric: isTeacher ? q.rubric : undefined,
      options: q.options.map(({ isCorrect, ...rest }) => rest),
    })),
  }

  res.json(sanitized)
}

export async function listQuizSessions(req: AuthRequest, res: Response) {
  const courseId = parseInt(req.params.courseId)
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId } },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled in this course" })
  }

  const sessions = await prisma.quizSession.findMany({
    where: { courseId },
    include: { _count: { select: { quizQuestions: true } } },
    orderBy: { createdAt: "desc" },
  })

  res.json(sessions)
}

// ─── Answer Submission ────────────────────────────────────

const submitAnswerSchema = z.object({
  sessionId: z.number(),
  questionId: z.number(),
  optionId: z.number().optional(),
  selectedOptionIds: z.array(z.number()).optional(),
  essayAnswer: z.string().optional(),
  responseTimeMs: z.number().int().min(0),
})

export async function submitAnswer(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = submitAnswerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    // Verify the session exists
    const session = await prisma.quizSession.findUnique({
      where: { id: parsed.data.sessionId },
    })
    if (!session) return res.status(404).json({ error: "Quiz session not found" })

    // Verify the question belongs to this session
    const question = await prisma.quizQuestion.findUnique({
      where: { id: parsed.data.questionId },
      include: { options: true },
    })
    if (!question || question.quizSessionId !== session.id) {
      return res.status(404).json({ error: "Question not found in this session" })
    }

    // Duplicate submission protection
    const existing = await prisma.quizAnswer.findFirst({
      where: {
        quizSessionId: session.id,
        userId: req.user!.id,
        questionId: question.id,
      },
    })
    if (existing) return res.status(400).json({ error: "Already answered this question" })

    const qType = question.type || "SINGLE_CHOICE"

    // ─── Case 1: ESSAY QUESTION ────────────────────────────
    if (qType === "ESSAY") {
      const essayText = parsed.data.essayAnswer?.trim() || ""
      const { evaluateEssayAnswer } = await import("../services/ai-evaluator.service")
      const evalResult = await evaluateEssayAnswer({
        question: question.question,
        topic: question.topic,
        rubric: question.rubric,
        studentAnswer: essayText,
      })

      let speedBonus = 0
      if (evalResult.isCorrect) {
        const time = parsed.data.responseTimeMs
        if (time < 15000) speedBonus = 50
        else if (time < 30000) speedBonus = 25
      }

      const earnedPoints = (evalResult.isCorrect ? 1000 : Math.round(evalResult.score * 8)) + speedBonus

      await prisma.quizAnswer.create({
        data: {
          quizSessionId: session.id,
          userId: req.user!.id,
          questionId: question.id,
          essayAnswer: essayText,
          aiScore: evalResult.score,
          aiFeedback: evalResult.feedback,
          isCorrect: evalResult.isCorrect,
          responseTimeMs: parsed.data.responseTimeMs,
          points: earnedPoints,
        },
      })

      return res.json({
        correct: evalResult.isCorrect,
        points: earnedPoints,
        speedBonus,
        aiScore: evalResult.score,
        aiFeedback: evalResult.feedback,
        correctAnswer: question.rubric || "Sesuai kriteria rubrik dosen",
        explanation: question.explanation,
      })
    }

    // ─── Case 2: MULTIPLE_CHOICE QUESTION ──────────────────
    if (qType === "MULTIPLE_CHOICE") {
      const selected =
        parsed.data.selectedOptionIds || (parsed.data.optionId ? [parsed.data.optionId] : [])
      const correctOptions = question.options.filter((o) => o.isCorrect)
      const correctIds = correctOptions.map((o) => o.id).sort()
      const userIds = [...selected].sort()

      const isExactMatch =
        correctIds.length > 0 &&
        userIds.length === correctIds.length &&
        userIds.every((val, idx) => val === correctIds[idx])

      const selectedCorrectCount = userIds.filter((id) => correctIds.includes(id)).length
      const wrongCount = userIds.filter((id) => !correctIds.includes(id)).length

      let points = 0
      let speedBonus = 0

      if (isExactMatch) {
        points = 1000
        const time = parsed.data.responseTimeMs
        if (time < 4000) speedBonus = Math.round(50 * (1 - time / 4000))
        else if (time < 12000) speedBonus = Math.round(25 * (1 - (time - 4000) / 8000))
        points += speedBonus
      } else if (wrongCount === 0 && selectedCorrectCount > 0) {
        // Partial score if no incorrect options selected
        points = Math.round((selectedCorrectCount / Math.max(1, correctIds.length)) * 750)
      }

      const isCorrect = isExactMatch

      await prisma.quizAnswer.create({
        data: {
          quizSessionId: session.id,
          userId: req.user!.id,
          questionId: question.id,
          optionId: selected[0] || null,
          selectedOptionIds: selected,
          isCorrect,
          responseTimeMs: parsed.data.responseTimeMs,
          points,
        },
      })

      return res.json({
        correct: isCorrect,
        points,
        speedBonus,
        correctAnswer: correctOptions.map((o) => o.text).join(", "),
        explanation: question.explanation,
      })
    }

    // ─── Case 3: SINGLE_CHOICE QUESTION (Default) ───────────
    const option = question.options.find((o) => o.id === parsed.data.optionId)
    if (!option) return res.status(400).json({ error: "Invalid option" })

    const isCorrect = option.isCorrect
    let points = 0
    let speedBonus = 0

    if (isCorrect) {
      points = 1000
      const time = parsed.data.responseTimeMs
      if (time < 3000) {
        speedBonus = Math.round(50 * (1 - time / 3000))
      } else if (time < 10000) {
        speedBonus = Math.round(25 * (1 - (time - 3000) / 7000))
      }
      points += speedBonus
    }

    await prisma.quizAnswer.create({
      data: {
        quizSessionId: session.id,
        userId: req.user!.id,
        questionId: question.id,
        optionId: option.id,
        selectedOptionIds: [option.id],
        isCorrect,
        responseTimeMs: parsed.data.responseTimeMs,
        points,
      },
    })

    res.json({
      correct: isCorrect,
      points,
      speedBonus: isCorrect ? speedBonus : 0,
      correctAnswer: option.isCorrect
        ? option.text
        : question.options.find((o) => o.isCorrect)?.text,
      explanation: question.explanation,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Results ─────────────────────────────────────────────

export async function getQuizResults(req: AuthRequest, res: Response) {
  const sessionId = parseInt(req.params.sessionId)
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: { quizQuestions: true },
  })
  if (!session) return res.status(404).json({ error: "Session not found" })

  // Verify enrollment
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId: session.courseId } },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled" })
  }

  // Get all answers for this user in this session
  const answers = await prisma.quizAnswer.findMany({
    where: { quizSessionId: sessionId, userId: req.user!.id },
    include: {
      question: { include: { options: true } },
      option: true,
    },
  })

  const totalQuestions = session.quizQuestions.length
  const answeredCount = answers.length
  const correctCount = answers.filter((a) => a.isCorrect).length
  const totalScore = answers.reduce((sum, a) => sum + a.points, 0)
  const avgResponseMs =
    answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.responseTimeMs, 0) / answers.length)
      : 0

  // Build topic analysis
  const topicStats: Record<string, { correct: number; total: number }> = {}
  answers.forEach((a) => {
    const topic = a.question.topic
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 }
    topicStats[topic].total += 1
    if (a.isCorrect) topicStats[topic].correct += 1
  })

  // Save or update quiz result
  const existingResult = await prisma.quizResult.findFirst({
    where: { quizSessionId: sessionId, userId: req.user!.id },
  })

  let quizResult = existingResult
  if (!existingResult) {
    quizResult = await prisma.quizResult.create({
      data: {
        quizSessionId: sessionId,
        userId: req.user!.id,
        totalScore,
        correctCount,
        totalCount: totalQuestions,
        avgResponseMs,
      },
    })
  } else {
    quizResult = await prisma.quizResult.update({
      where: { id: existingResult.id },
      data: {
        totalScore,
        correctCount,
        totalCount: totalQuestions,
        avgResponseMs,
      },
    })
  }

  // Generate AI Summary & Evaluation if missing
  if (quizResult && (!quizResult.aiSummary || !quizResult.aiEvaluation)) {
    try {
      const { generateQuizEvaluationAndSummary } = await import(
        "../services/ai-evaluator.service"
      )
      const answersDetail = answers.map((a) => {
        let ansText = a.essayAnswer || ""
        if (!ansText) {
          if (a.option) {
            ansText = a.option.text
          } else if (a.selectedOptionIds && a.selectedOptionIds.length > 0) {
            ansText = a.question.options
              .filter((o) => a.selectedOptionIds.includes(o.id))
              .map((o) => o.text)
              .join(", ")
          }
        }

        return {
          question: a.question.question,
          type: a.question.type,
          studentAnswer: ansText,
          isCorrect: a.isCorrect,
          points: a.points,
          aiFeedback: a.aiFeedback,
        }
      })

      const aiEval = await generateQuizEvaluationAndSummary({
        quizTitle: session.title,
        totalScore,
        correctCount,
        totalQuestions,
        topicStats,
        answersDetail,
      })

      quizResult = await prisma.quizResult.update({
        where: { id: quizResult.id },
        data: {
          aiSummary: aiEval.summary,
          aiEvaluation: aiEval.evaluation,
          aiRecommendations: aiEval.recommendations,
        },
      })
    } catch (evalErr) {
      console.warn("Failed to generate AI evaluation for quiz:", evalErr)
    }
  }

  // Save weak topics and trigger Topic Mastery Engine
  const weakTopics = Object.entries(topicStats)
    .filter(([_, stats]) => stats.correct / stats.total < 0.7)
    .map(([topic, stats]) => ({
      topic,
      correctCount: stats.correct,
      totalCount: stats.total,
      accuracy: stats.correct / stats.total,
    }))

  if (quizResult) {
    // Clear existing weak topics and re-insert
    await prisma.weakTopic.deleteMany({ where: { quizResultId: quizResult.id } })
    if (weakTopics.length > 0) {
      await prisma.weakTopic.createMany({
        data: weakTopics.map((wt) => ({
          quizResultId: quizResult.id,
          ...wt,
        })),
      })
    }

    // Update Topic Mastery Engine in background
    try {
      const { updateMasteryFromQuiz } = await import("../services/mastery.service")
      const performances = Object.entries(topicStats).map(([topic, stats]) => {
        const topicAnswers = answers.filter((a) => a.question.topic === topic)
        const avgTime =
          topicAnswers.length > 0
            ? Math.round(
                topicAnswers.reduce((sum, a) => sum + a.responseTimeMs, 0) /
                  topicAnswers.length
              )
            : avgResponseMs
        return {
          topic,
          correct: stats.correct,
          total: stats.total,
          avgTimeMs: avgTime,
        }
      })
      await updateMasteryFromQuiz(req.user!.id, session.courseId, performances)
    } catch (masteryErr) {
      console.error("Failed to update topic mastery from quiz:", masteryErr)
    }
  }

  res.json({
    sessionId,
    totalScore,
    correctCount,
    answeredCount,
    totalQuestions,
    avgResponseMs,
    topicStats,
    weakTopics,
    resultId: quizResult?.id,
    aiSummary: quizResult?.aiSummary,
    aiEvaluation: quizResult?.aiEvaluation,
    aiRecommendations: quizResult?.aiRecommendations,
  })
}

// ─── AI-Generated Quiz ────────────────────────────────────

const aiGenerateQuizSchema = z.object({
  courseId: z.coerce.number().optional(),
  title: z.string().optional(),
  topic: z.string().min(1, "Topik kuis wajib diisi"),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  count: z.number().int().min(1).max(30).default(5),
  questionTypes: z.array(z.string()).optional(),
})

export async function generateQuizWithAI(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = aiGenerateQuizSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    const { checkPromptGuard } = await import("../services/prompt-guard.service")
    const guard = await checkPromptGuard(parsed.data.topic)
    if (!guard.isSafe) {
      return res.status(400).json({
        error: guard.blockedReason || "Prompt injection terdeteksi pada topik kuis.",
      })
    }

    const courseId = parsed.data.courseId || parseInt(req.params.courseId)
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "ID kelas mata kuliah tidak valid" })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ error: "Mata kuliah tidak ditemukan" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Bukan pengampu kelas ini" })

    try {
      const { getAIProvider } = await import("../services/ai.service")
      const provider = getAIProvider()
      const generated = await provider.generateQuiz({
        course: course.title,
        topic: parsed.data.topic,
        difficulty: parsed.data.difficulty,
        count: parsed.data.count,
        questionTypes: parsed.data.questionTypes as any,
      })

      const session = await prisma.quizSession.create({
        data: {
          title: parsed.data.title?.trim() || `Kuis: ${parsed.data.topic}`,
          description: `Kuis berbasis AI (${parsed.data.count} Soal - ${parsed.data.difficulty.toUpperCase()})`,
          isKingOfTheHill: true,
          courseId: course.id,
          quizQuestions: {
            create: generated.questions.map((q, idx) => {
              const qType =
                q.type || (q.options && q.options.length > 0 ? "SINGLE_CHOICE" : "ESSAY")
              const isEssay = qType === "ESSAY"
              const isMulti = qType === "MULTIPLE_CHOICE"

              let optionsData = undefined
              if (!isEssay && q.options && q.options.length > 0) {
                const correctArr = (q.correctAnswer || "")
                  .split(",")
                  .map((s) => s.trim().toLowerCase())
                  .filter(Boolean)

                optionsData = {
                  create: q.options.map((opt, optIdx) => {
                    const optLower = opt.trim().toLowerCase()
                    const isCorrect = isMulti
                      ? correctArr.some((c) => c === optLower || optLower.includes(c))
                      : optLower === q.correctAnswer?.trim().toLowerCase()

                    return {
                      text: opt,
                      isCorrect: isCorrect || (optIdx === 0 && correctArr.length === 0),
                      order: optIdx,
                    }
                  }),
                }
              }

              return {
                question: q.question,
                topic: q.topic || parsed.data.topic,
                difficulty: (q.difficulty || parsed.data.difficulty).toUpperCase() as
                  | "EASY"
                  | "MEDIUM"
                  | "HARD",
                type: qType,
                rubric: isEssay ? q.correctAnswer : null,
                explanation: q.explanation || null,
                order: idx,
                options: optionsData,
              }
            }),
          },
        },
      })

      res.status(201).json(session)
    } catch (aiErr) {
      res.status(502).json({
        error: "AI provider failed",
        message: aiErr instanceof Error ? aiErr.message : "Unknown AI error",
      })
    }
  } catch (err) {
    next(err)
  }
}
