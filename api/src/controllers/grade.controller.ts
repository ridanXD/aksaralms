import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"

export async function getGrades(req: AuthRequest, res: Response) {
  const courseId = parseInt(req.params.courseId)

  // Verify enrollment
  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId } },
  })
  if (!enrolled && req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Not enrolled in this course" })
  }

  // Get quiz grades
  const quizGrades = await prisma.quizResult.findMany({
    where: { userId: req.user!.id, quizSession: { courseId } },
    include: { quizSession: { select: { title: true } } },
    orderBy: { completedAt: "desc" },
  })

  // Get assignment grades
  const assignmentGrades = await prisma.grade.findMany({
    where: {
      userId: req.user!.id,
      courseId,
    },
    include: { assignment: { select: { title: true } } },
    orderBy: { gradedAt: "desc" },
  })

  // Max score per quiz = total questions * (100 base + 50 max speed bonus)
  const quizGradeList = quizGrades.map((r) => {
    const maxScore = r.totalCount > 0 ? r.totalCount * 150 : 100
    return {
      id: r.id,
      type: "quiz",
      title: r.quizSession.title,
      score: r.totalScore,
      maxScore,
      date: r.completedAt,
      correctCount: r.correctCount,
      totalCount: r.totalCount,
      percentage: Math.round((r.totalScore / maxScore) * 100),
    }
  })

  const assignmentGradeList = assignmentGrades.map((g) => ({
    id: g.id,
    type: "assignment",
    title: g.assignment?.title ?? "Assignment",
    score: g.score,
    maxScore: g.maxScore,
    date: g.gradedAt,
    feedback: g.feedback,
    percentage: g.maxScore > 0 ? Math.round((g.score / g.maxScore) * 100) : 0,
  }))

  // Topic masteries for this course
  const topicMasteries = await prisma.topicMastery.findMany({
    where: {
      userId: req.user!.id,
      courseId,
    },
    orderBy: { masteryScore: "asc" },
  })

  // Overall performance percentage
  const allPercentages = [
    ...quizGradeList.map((q) => q.percentage),
    ...assignmentGradeList.map((a) => a.percentage),
  ]

  // If quiz/assignments exist, use their average; otherwise fallback to topic mastery average
  let overallPct = 0
  if (allPercentages.length > 0) {
    overallPct = Math.round(allPercentages.reduce((sum, p) => sum + p, 0) / allPercentages.length)
  } else if (topicMasteries.length > 0) {
    overallPct = Math.round(topicMasteries.reduce((sum, tm) => sum + tm.masteryScore, 0) / topicMasteries.length)
  }

  res.json({
    quizGrades: quizGradeList,
    assignmentGrades: assignmentGradeList,
    overallPercentage: overallPct,
    topicMasteries: topicMasteries.map((tm) => ({
      topic: tm.topic,
      masteryScore: Math.round(tm.masteryScore),
      accuracy: Math.round(tm.accuracy * 100),
      trend: tm.trend,
      attempts: tm.attemptCount,
    })),
  })
}

export async function getOverallPerformance(req: AuthRequest, res: Response) {
  if (req.user!.role !== "TEACHER") {
    return res.status(403).json({ error: "Teachers only" })
  }

  const courseId = parseInt(req.params.courseId)
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: "Course not found" })
  if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          quizResults: { where: { quizSession: { courseId } } },
          grades: { where: { courseId } },
          topicMasteries: { where: { courseId } },
        },
      },
    },
  })

  const results = await prisma.quizResult.findMany({
    where: { quizSession: { courseId } },
    include: { user: { select: { id: true, name: true, email: true } }, quizSession: { select: { title: true } } },
    orderBy: { completedAt: "desc" },
  })

  res.json({
    enrollmentCount: enrollments.length,
    students: enrollments.map((e) => {
      const u = e.user
      const quizCount = u.quizResults.length
      const gradesCount = u.grades.length
      const avgMastery =
        u.topicMasteries.length > 0
          ? Math.round(
              u.topicMasteries.reduce((sum, tm) => sum + tm.masteryScore, 0) / u.topicMasteries.length
            )
          : null

      return {
        id: u.id,
        name: u.name ?? u.email,
        email: u.email,
        quizResultsCount: quizCount,
        gradesCount: gradesCount,
        averageMastery: avgMastery,
      }
    }),
    quizResults: results.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name ?? r.user.email,
      quizTitle: r.quizSession.title,
      score: r.totalScore,
      correctCount: r.correctCount,
      totalCount: r.totalCount,
      completedAt: r.completedAt,
    })),
  })
}
