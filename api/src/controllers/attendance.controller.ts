import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"
import { z } from "zod"
import {
  encryptAttendanceToken,
  decryptAttendanceToken,
  generateSecureAttendanceCode,
} from "../utils/crypto"

// ─── Student ─────────────────────────────────────────────

export async function getAttendanceStatus(req: AuthRequest, res: Response) {
  const courseId = parseInt(req.params.courseId)

  const enrolled = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user!.id, courseId } },
  })
  if (!enrolled) return res.status(403).json({ error: "Not enrolled" })

  // Get active sessions (not expired)
  const activeSessions = await prisma.attendanceSession.findMany({
    where: {
      courseId,
      expiresAt: { gte: new Date() },
    },
  })

  // Get past sessions with check-in status
  const pastSessions = await prisma.attendanceSession.findMany({
    where: {
      courseId,
      expiresAt: { lt: new Date() },
    },
    include: {
      checkins: {
        where: { userId: req.user!.id },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const history = pastSessions.map((s) => ({
    id: s.id,
    title: s.title,
    date: s.createdAt,
    present: s.checkins.length > 0,
  }))

  const isTeacher = req.user?.role === "TEACHER"

  res.json({
    activeSessions: activeSessions.map((s) => ({
      id: s.id,
      title: s.title,
      // Hide plaintext code from students so they cannot bypass scanning QR or being in class!
      code: isTeacher ? s.code : undefined,
      encryptedToken: isTeacher
        ? encryptAttendanceToken({
            code: s.code,
            sessionId: s.id,
            courseId: s.courseId,
            expiresAt: s.expiresAt.getTime(),
            issuedAt: s.createdAt.getTime(),
          })
        : undefined,
      expiresAt: s.expiresAt,
    })),
    history,
    totalSessions: pastSessions.length,
    attended: pastSessions.filter((s) => s.checkins.length > 0).length,
  })
}

const checkInSchema = z.object({
  code: z.string().min(1).optional(),
  token: z.string().min(1).optional(),
})

export async function checkIn(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = checkInSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: parsed.error.errors })

    const rawInput = (parsed.data.token || parsed.data.code || "").trim()
    if (!rawInput) {
      return res.status(400).json({ error: "Kode atau token presensi wajib diisi" })
    }

    let session: any = null

    // 1. Try decrypting as AES-256-GCM encrypted token
    const decryptedPayload = decryptAttendanceToken(rawInput)
    if (decryptedPayload) {
      // Check timestamp expiration
      if (decryptedPayload.expiresAt < Date.now()) {
        return res.status(410).json({ error: "Sesi presensi telah kadaluarsa" })
      }
      session = await prisma.attendanceSession.findUnique({
        where: { id: decryptedPayload.sessionId },
        include: { course: true },
      })
      if (!session || session.code !== decryptedPayload.code || session.courseId !== decryptedPayload.courseId) {
        return res.status(404).json({ error: "Sesi presensi tidak valid atau telah diganti" })
      }
    } else {
      // 2. Direct code lookup (6-character token)
      session = await prisma.attendanceSession.findUnique({
        where: { code: rawInput.toUpperCase() },
        include: { course: true },
      })
    }

    if (!session) return res.status(404).json({ error: "Sesi presensi tidak ditemukan" })

    // Verify enrollment
    const enrolled = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: req.user!.id,
          courseId: session.courseId,
        },
      },
    })
    if (!enrolled) return res.status(403).json({ error: "Bukan mahasiswa terdaftar di mata kuliah ini" })

    // Check expired
    if (session.expiresAt < new Date()) {
      return res.status(410).json({ error: "Sesi presensi telah kadaluarsa" })
    }

    // Duplicate check-in protection
    const existing = await prisma.attendanceCheckin.findUnique({
      where: {
        attendanceSessionId_userId: {
          attendanceSessionId: session.id,
          userId: req.user!.id,
        },
      },
    })
    if (existing) return res.json({ message: "Anda sudah melakukan presensi sebelumnya." })

    const checkin = await prisma.attendanceCheckin.create({
      data: {
        attendanceSessionId: session.id,
        userId: req.user!.id,
      },
    })

    res.status(201).json({ message: "Presensi berhasil dicatat!", checkin })
  } catch (err) {
    next(err)
  }
}

// ─── Teacher ─────────────────────────────────────────────

export async function getAttendanceRecords(req: AuthRequest, res: Response) {
  const courseId = parseInt(req.params.courseId)
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: "Course not found" })
  if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Not the teacher" })

  const sessions = await prisma.attendanceSession.findMany({
    where: { courseId },
    include: {
      checkins: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { checkins: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  res.json(
    sessions.map((s) => ({
      id: s.id,
      title: s.title,
      code: s.code,
      encryptedToken: encryptAttendanceToken({
        code: s.code,
        sessionId: s.id,
        courseId: s.courseId,
        expiresAt: s.expiresAt.getTime(),
        issuedAt: s.createdAt.getTime(),
      }),
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      checkinCount: s._count.checkins,
      checkins: s.checkins.map((c) => ({
        userId: c.user.id,
        name: c.user.name ?? c.user.email,
        checkedInAt: c.checkedInAt,
      })),
    }))
  )
}

const createAttendanceSessionSchema = z.object({
  courseId: z.coerce.number().int().optional(),
  title: z.string().min(1, "Judul sesi presensi wajib diisi"),
  description: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(10080).optional(),
  date: z.string().optional(), // YYYY-MM-DD
  startTime: z.string().optional(), // HH:mm
  endTime: z.string().optional(), // HH:mm
  code: z.string().min(3).max(12).optional(),
})

export async function createAttendanceSession(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const parsed = createAttendanceSessionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors[0]?.message || "Input tidak valid" })
    }

    const courseId = parseInt(req.params.courseId || String(parsed.data.courseId || ""))
    if (isNaN(courseId)) {
      return res.status(400).json({ error: "Kelas mata kuliah wajib dipilih" })
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return res.status(404).json({ error: "Mata kuliah tidak ditemukan" })
    if (course.teacherId !== req.user!.id) return res.status(403).json({ error: "Bukan pengampu kelas ini" })

    // Determine code (Cryptographically secure & unambiguous)
    let code = parsed.data.code?.trim().toUpperCase()
    if (code) {
      const existing = await prisma.attendanceSession.findUnique({ where: { code } })
      if (existing) {
        return res.status(400).json({ error: `Kode presensi '${code}' sudah digunakan. Silakan gunakan kode lain.` })
      }
    } else {
      let isUnique = false
      while (!isUnique) {
        code = generateSecureAttendanceCode()
        const check = await prisma.attendanceSession.findUnique({ where: { code } })
        if (!check) isUnique = true
      }
    }

    // Determine expiration date (default to 15 minutes!)
    let expiresAt: Date
    const { date, endTime, durationMinutes } = parsed.data

    if (date && endTime) {
      const datePart = date.trim()
      const timePart = endTime.trim()
      const candidateDate = new Date(`${datePart}T${timePart}:00`)
      if (!isNaN(candidateDate.getTime()) && candidateDate.getTime() > Date.now()) {
        expiresAt = candidateDate
      } else {
        const mins = durationMinutes || 15
        expiresAt = new Date(Date.now() + mins * 60 * 1000)
      }
    } else if (durationMinutes) {
      expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)
    } else {
      expiresAt = new Date(Date.now() + 15 * 60 * 1000) // Default 15 menit
    }

    const session = await prisma.attendanceSession.create({
      data: {
        courseId: course.id,
        title: parsed.data.title.trim(),
        description: parsed.data.description?.trim() || null,
        code,
        expiresAt,
      },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    })

    // Generate authenticated, tamper-proof AES-256-GCM encrypted token
    const encryptedToken = encryptAttendanceToken({
      code: session.code,
      sessionId: session.id,
      courseId: session.courseId,
      expiresAt: session.expiresAt.getTime(),
      issuedAt: session.createdAt.getTime(),
    })

    res.status(201).json({
      ...session,
      encryptedToken,
    })
  } catch (err) {
    next(err)
  }
}
