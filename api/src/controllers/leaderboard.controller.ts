import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"

export async function getLeaderboard(req: AuthRequest, res: Response) {
  const sessionId = parseInt(req.params.sessionId)

  // Verify session exists
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
  })
  if (!session) return res.status(404).json({ error: "Quiz session not found" })

  // Verify user is enrolled
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId: session.courseId } },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled in this course" })
  }

  const totalQuestions = await prisma.quizQuestion.count({
    where: { quizSessionId: sessionId },
  })

  // Build leaderboard from quiz answers (computed server-side, not trusted from client)
  // Ranked by:
  // 1. Paling Bener (correctCount DESC)
  // 2. Paling Cepat (avgResponseMs ASC)
  // 3. Skor Tertinggi (points DESC)
  const entries = await prisma.$queryRaw<
    Array<{
      userId: number
      score: number
      correctCount: number
      avgResponseMs: number
      rank: number
      name: string | null
      email: string
    }>
  >`
    SELECT
      u.id as "userId",
      u."name" as "name",
      u."email" as "email",
      COALESCE(SUM(qa.points), 0) as "score",
      SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END) as "correctCount",
      COALESCE(AVG(qa."responseTimeMs"), 0) as "avgResponseMs",
      RANK() OVER (
        ORDER BY
          SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END) DESC,
          COALESCE(AVG(qa."responseTimeMs"), 999999) ASC,
          COALESCE(SUM(qa.points), 0) DESC
      ) as "rank"
    FROM "User" u
    LEFT JOIN "QuizAnswer" qa ON qa."userId" = u.id AND qa."quizSessionId" = ${sessionId}
    WHERE qa."userId" IS NOT NULL
    GROUP BY u.id, u."name", u."email"
    ORDER BY "correctCount" DESC, "avgResponseMs" ASC, "score" DESC
    LIMIT 50
  `

  const king = entries[0]
  const kingOfTheHill = king
    ? {
        userId: king.userId,
        name: king.name ?? king.email,
        score: Number(king.score),
        correctCount: Number(king.correctCount),
        avgResponseMs: Math.round(Number(king.avgResponseMs)),
      }
    : null

  res.json({
    sessionId,
    sessionTitle: session.title,
    totalQuestions,
    kingOfTheHill,
    entries: entries.map((e) => ({
      rank: Number(e.rank),
      userId: e.userId,
      name: e.name ?? e.email,
      score: Number(e.score),
      correctCount: Number(e.correctCount),
      avgResponseMs: Math.round(Number(e.avgResponseMs)),
    })),
  })
}

export async function getUserRank(req: AuthRequest, res: Response) {
  const sessionId = parseInt(req.params.sessionId)

  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
  })
  if (!session) return res.status(404).json({ error: "Quiz session not found" })

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId: session.courseId } },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled" })
  }

  // Get this user's rank using a CTE across all quiz participants
  const result = await prisma.$queryRaw<
    Array<{
      score: number
      correctCount: number
      avgResponseMs: number
      rank: number
      totalPlayers: number
    }>
  >`
    WITH RankedPlayers AS (
      SELECT
        qa."userId" as "userId",
        COALESCE(SUM(qa.points), 0) as "score",
        SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END) as "correctCount",
        COALESCE(AVG(qa."responseTimeMs"), 0) as "avgResponseMs",
        RANK() OVER (
          ORDER BY
            SUM(CASE WHEN qa."isCorrect" THEN 1 ELSE 0 END) DESC,
            COALESCE(AVG(qa."responseTimeMs"), 999999) ASC,
            COALESCE(SUM(qa.points), 0) DESC
        ) as "rank",
        COUNT(*) OVER () as "totalPlayers"
      FROM "QuizAnswer" qa
      WHERE qa."quizSessionId" = ${sessionId}
      GROUP BY qa."userId"
    )
    SELECT "score", "correctCount", "avgResponseMs", "rank", "totalPlayers"
    FROM RankedPlayers
    WHERE "userId" = ${req.user!.id}
  `

  if (result.length === 0) {
    const totalCount = await prisma.quizAnswer.groupBy({
      by: ["userId"],
      where: { quizSessionId: sessionId },
    })
    return res.json({ rank: null, score: 0, correctCount: 0, avgResponseMs: 0, totalPlayers: totalCount.length })
  }

  const r = result[0]
  res.json({
    rank: Number(r.rank),
    score: Number(r.score),
    correctCount: Number(r.correctCount),
    avgResponseMs: Math.round(Number(r.avgResponseMs)),
    totalPlayers: Number(r.totalPlayers),
  })
}
