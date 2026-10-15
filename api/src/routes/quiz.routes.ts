import { Router } from "express"
import {
  createQuizSession,
  getQuizSession,
  listQuizSessions,
  submitAnswer,
  getQuizResults,
  generateQuizWithAI,
} from "../controllers/quiz.controller"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

// Quiz session routes within a course
router.post("/courses/:courseId/sessions", createQuizSession)
router.get("/courses/:courseId/sessions", listQuizSessions)
router.post("/courses/:courseId/generate", generateQuizWithAI)

// Session-specific routes
router.get("/sessions/:sessionId", getQuizSession)
router.post("/sessions/:sessionId/answers", submitAnswer)
router.get("/sessions/:sessionId/results", getQuizResults)

export default router
