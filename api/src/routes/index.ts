import { Router } from "express"
import authRoutes from "./auth.routes"
import courseRoutes from "./course.routes"
import quizRoutes from "./quiz.routes"
import leaderboardRoutes from "./leaderboard.routes"
import gradeRoutes from "./grade.routes"
import attendanceRoutes from "./attendance.routes"
import assignmentRoutes from "./assignment.routes"
import aiTrainingRoutes from "./ai-training.routes"
import analyticsRoutes from "./analytics.routes"
import calendarRoutes from "./calendar.routes"

const router = Router()

router.use("/auth", authRoutes)
router.use("/courses", courseRoutes)
router.use("/quizzes", quizRoutes)
router.use("/leaderboard", leaderboardRoutes)
router.use("/grades", gradeRoutes)
router.use("/attendance", attendanceRoutes)
router.use("/assignments", assignmentRoutes)
router.use("/ai", aiTrainingRoutes)
router.use("/analytics", analyticsRoutes)
router.use("/calendar", calendarRoutes)

export default router
