import { Router } from "express"
import {
  analyzePerformance,
  startTrainingSession,
  answerTrainingQuestion,
  getTrainingSession,
  generateAIContent,
} from "../controllers/ai-training.controller"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

router.post("/analyze/:quizResultId", analyzePerformance)
router.post("/train", startTrainingSession)
router.get("/train/:sessionId", getTrainingSession)
router.post("/questions/:questionId/answer", answerTrainingQuestion)
router.post("/generate-content", generateAIContent)

export default router
