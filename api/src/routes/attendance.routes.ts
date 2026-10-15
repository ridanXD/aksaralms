import { Router } from "express"
import {
  getAttendanceStatus,
  checkIn,
  getAttendanceRecords,
  createAttendanceSession,
} from "../controllers/attendance.controller"
import { requireAuth } from "../middleware/auth"
import { requireRole } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

// Routes prefixed with /attendance
router.get("/status/:courseId", getAttendanceStatus)
router.post("/checkin", checkIn)
router.get("/records/:courseId", getAttendanceRecords)
router.post("/sessions", requireRole("TEACHER"), createAttendanceSession)
router.post("/sessions/:courseId", requireRole("TEACHER"), createAttendanceSession)

export default router
