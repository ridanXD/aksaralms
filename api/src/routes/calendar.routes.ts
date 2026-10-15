import { Router } from "express"
import { requireAuth } from "../middleware/auth"
import { getCalendarEvents } from "../controllers/calendar.controller"

const router = Router()

router.use(requireAuth)
router.get("/events", getCalendarEvents)

export default router
