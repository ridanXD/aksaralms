import { Router } from "express"
import { getGrades, getOverallPerformance } from "../controllers/grade.controller"
import { requireAuth, requireRole } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

router.get("/courses/:courseId", getGrades)
router.get("/courses/:courseId/performance", requireRole("TEACHER"), getOverallPerformance)

export default router
