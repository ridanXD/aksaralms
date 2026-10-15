import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import {
  getStudentRecommendations,
  getStudentProfile,
  getTeacherCourseIntelligence,
  consultAITeacherTips,
} from "../controllers/analytics.controller"

const router = Router()

// Student routes
router.get("/recommendations", requireAuth, getStudentRecommendations)
router.get("/profile", requireAuth, getStudentProfile)

// Teacher routes
router.get("/teacher/:courseId", requireAuth, getTeacherCourseIntelligence)
router.post("/teacher/:courseId/consult-ai", requireAuth, consultAITeacherTips)

export default router
