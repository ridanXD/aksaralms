import { Router } from "express"
import { getLeaderboard, getUserRank } from "../controllers/leaderboard.controller"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

router.get("/sessions/:sessionId", getLeaderboard)
router.get("/sessions/:sessionId/rank", getUserRank)

export default router
