import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { z } from "zod"

// ─── Teacher: Assignment CRUD ─────────────────────────────

const createAssignmentSchema = z.object({
  title: z.string().min(1, "Judul tugas wajib diisi"),
  description: z.string().optional(),
  deadline: z.string().optional(),
})

export async function createAssignment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createAssignmentSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    const courseId = parseInt(req.params.courseId)
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "ID kelas mata kuliah tidak valid" })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ error: "Mata kuliah tidak ditemukan" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Bukan pengampu kelas ini" })

    let deadlineDate: Date
    if (parsed.data.deadline) {
      const candidate = new Date(parsed.data.deadline)
      deadlineDate = !isNaN(candidate.getTime()) ? candidate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    } else {
      deadlineDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }

    const assignment = await prisma.assignment.create({
      data: {
        courseId: course.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        deadline: deadlineDate,
      },
    })

    res.status(201).json(assignment)
  } catch (err) {
    next(err)
  }
}

export async function listAssignments(req: AuthRequest, res: Response) {
  const courseId = parseInt(req.params.courseId)
  const isTeacher = req.user!.role === "TEACHER"

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId } },
  })
  if (!enrolled && !isTeacher) {
    return res.status(403).json({ error: "Not enrolled" })
  }

  if (isTeacher) {
    const totalEnrolled = await prisma.enrollment.count({
      where: { courseId },
    })

    const assignments = await prisma.assignment.findMany({
      where: { courseId },
      include: {
        submissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            grade: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return res.json(
      assignments.map((a) => ({
        ...a,
        submitted: false,
        submission: null,
        grade: null,
        isPastDeadline: new Date() > a.deadline,
        submissionsCount: a.submissions.length,
        totalEnrolled,
        submissions: a.submissions.map((s) => ({
          id: s.id,
          assignmentId: s.assignmentId,
          userId: s.userId,
          content: s.content,
          fileUrl: s.fileUrl,
          submittedAt: s.submittedAt,
          user: s.user,
          grade: s.grade
            ? {
                id: s.grade.id,
                type: "assignment",
                title: a.title,
                score: s.grade.score,
                maxScore: s.grade.maxScore,
                date: s.grade.gradedAt,
                feedback: s.grade.feedback,
              }
            : null,
        })),
      }))
    )
  }

  const assignments = await prisma.assignment.findMany({
    where: { courseId },
    include: {
      submissions: {
        where: { userId: req.user!.id },
      },
      grades: {
        where: { userId: req.user!.id },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(
    assignments.map((a) => ({
      ...a,
      submitted: a.submissions.length > 0,
      submission: a.submissions[0],
      grade: a.grades[0],
      isPastDeadline: new Date() > a.deadline,
    }))
  )
}

export async function getAssignmentSubmissions(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const assignmentId = parseInt(req.params.assignmentId)
    if (isNaN(assignmentId)) {
      return res.status(400).json({ error: "ID tugas tidak valid" })
    }

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
        submissions: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
            grade: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    })

    if (!assignment) {
      return res.status(404).json({ error: "Tugas tidak ditemukan" })
    }

    if (assignment.course.teacherId !== req.user!.id && req.user!.role !== "TEACHER") {
      return res.status(403).json({ error: "Bukan pengampu kelas ini" })
    }

    const enrolledStudents = assignment.course.enrollments.map((e) => e.user)
    const submittedUserIds = new Set(assignment.submissions.map((s) => s.userId))
    const unsubmittedStudents = enrolledStudents.filter((s) => !submittedUserIds.has(s.id))

    res.json({
      assignment: {
        id: assignment.id,
        courseId: assignment.courseId,
        title: assignment.title,
        description: assignment.description,
        deadline: assignment.deadline,
        createdAt: assignment.createdAt,
      },
      totalEnrolled: enrolledStudents.length,
      submissionsCount: assignment.submissions.length,
      unsubmittedCount: unsubmittedStudents.length,
      submissions: assignment.submissions.map((s) => ({
        id: s.id,
        assignmentId: s.assignmentId,
        userId: s.userId,
        content: s.content,
        fileUrl: s.fileUrl,
        submittedAt: s.submittedAt,
        user: s.user,
        grade: s.grade
          ? {
              id: s.grade.id,
              type: "assignment",
              title: assignment.title,
              score: s.grade.score,
              maxScore: s.grade.maxScore,
              date: s.grade.gradedAt,
              feedback: s.grade.feedback,
            }
          : null,
      })),
      unsubmittedStudents,
    })
  } catch (err) {
    next(err)
  }
}

// ─── Student: Submit ─────────────────────────────────────

const submitAssignmentSchema = z.object({
  content: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
})

export async function submitAssignment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = submitAssignmentSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const hasContent = Boolean(parsed.data.content && parsed.data.content.trim().length > 0)
    const hasFile = Boolean(parsed.data.fileUrl && parsed.data.fileUrl.trim().length > 0)
    if (!hasContent && !hasFile) {
      return res.status(400).json({ error: "Silakan masukkan teks jawaban atau unggah berkas tugas." })
    }

    const assignmentId = parseInt(req.params.assignmentId)
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { course: true },
    })
    if (!assignment) return res.status(404).json({ error: "Assignment not found" })

    const enrolled = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: assignment.courseId,
        },
      },
    })
    if (!enrolled) return res.status(403).json({ error: "Not enrolled" })

    if (new Date() > assignment.deadline) {
      return res.status(400).json({ error: "Assignment deadline has passed" })
    }

    const submission = await prisma.submission.upsert({
      where: {
        assignmentId_userId: {
          assignmentId: assignment.id,
          userId: req.user!.id,
        },
      },
      update: {
        content: parsed.data.content,
        fileUrl: parsed.data.fileUrl,
        submittedAt: new Date(),
      },
      create: {
        assignmentId: assignment.id,
        userId: req.user!.id,
        content: parsed.data.content,
        fileUrl: parsed.data.fileUrl,
        submittedAt: new Date(),
      },
    })

    res.status(201).json(submission)
  } catch (err) {
    next(err)
  }
}

// ─── Teacher: Review & Grade ─────────────────────────────

const gradeSubmissionSchema = z.object({
  score: z.number().min(0),
  maxScore: z.number().min(0),
  feedback: z.string().optional(),
})

export async function gradeSubmission(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = gradeSubmissionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const submissionId = parseInt(req.params.submissionId)
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: { include: { course: true } },
      },
    })
    if (!submission) return res.status(404).json({ error: "Submission not found" })
    if (submission.assignment.course.teacherId !== req.user!.id) {
      return res.status(403).json({ error: "Not the teacher" })
    }

    const grade = await prisma.grade.upsert({
      where: { submissionId: submission.id },
      update: {
        score: parsed.data.score,
        maxScore: parsed.data.maxScore,
        feedback: parsed.data.feedback,
        gradedAt: new Date(),
      },
      create: {
        submissionId: submission.id,
        assignmentId: submission.assignmentId,
        userId: submission.userId,
        courseId: submission.assignment.courseId,
        score: parsed.data.score,
        maxScore: parsed.data.maxScore,
        feedback: parsed.data.feedback,
      },
    })

    res.json(grade)
  } catch (err) {
    next(err)
  }
}
