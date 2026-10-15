import { Router } from "express"
import {
  createAssignment,
  listAssignments,
  submitAssignment,
  gradeSubmission,
  getAssignmentSubmissions,
} from "../controllers/assignment.controller"
import { requireAuth } from "../middleware/auth"
import { requireRole } from "../middleware/auth"

const router = Router()

router.use(requireAuth)

// Course-level
router.post("/courses/:courseId", requireRole("TEACHER"), createAssignment)
router.get("/courses/:courseId", listAssignments)

// Assignment-level
router.post("/:assignmentId/submit", submitAssignment)
router.get("/:assignmentId/submissions", requireRole("TEACHER"), getAssignmentSubmissions)
router.post("/submissions/:submissionId/grade", requireRole("TEACHER"), gradeSubmission)

export default router
