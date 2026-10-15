import { Router } from "express"
import {
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  checkCourseCode,
  enroll,
  createModule,
  createMaterial,
  markProgress,
  getProgress,
} from "../controllers/course.controller"
import { requireAuth, requireRole } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

// Course routes
router.get("/", listCourses)
router.get("/check-code", checkCourseCode)
router.post("/", requireRole("TEACHER"), createCourse)
router.put("/:courseId", requireRole("TEACHER"), updateCourse)

// Course-specific routes
router.get("/:courseId/enroll", enroll)
router.post("/:courseId/enroll", enroll)
router.get("/:courseId", getCourse)

// Module routes
router.post("/:courseId/modules", requireRole("TEACHER"), createModule)

// Material routes
router.post("/:courseId/materials", requireRole("TEACHER"), createMaterial)
router.post("/:courseId/modules/:moduleId/materials", requireRole("TEACHER"), createMaterial)

// Progress routes
router.get("/progress", getProgress)
router.post("/progress/:materialId", markProgress)

export default router
