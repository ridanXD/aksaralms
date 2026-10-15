import { Response, NextFunction } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../config/database"

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  courseId?: number
  courseName?: string
  courseCode?: string
  start: string // ISO string
  end?: string // ISO string
  type: "ASSIGNMENT" | "QUIZ" | "LECTURE" | "ATTENDANCE" | "REMEDIAL"
  status?: "PENDING" | "SUBMITTED" | "COMPLETED" | "MISSED" | "SCHEDULED"
  url?: string
  color?: string
  meta?: Record<string, unknown>
}

// Deterministic schedule slots for courses to provide realistic lecture calendars
const COURSE_SCHEDULE_MAP: Record<number, { dayOfWeek: number; startHour: number; startMin: number; durationMin: number; room: string }> = {
  1: { dayOfWeek: 1, startHour: 8, startMin: 0, durationMin: 150, room: "Lab Komputer 301" }, // Senin
  2: { dayOfWeek: 2, startHour: 10, startMin: 0, durationMin: 150, room: "Gedung B - Ruang 204" }, // Selasa
  3: { dayOfWeek: 3, startHour: 13, startMin: 30, durationMin: 150, room: "Lab Rekayasa Perangkat Lunak" }, // Rabu
  4: { dayOfWeek: 4, startHour: 9, startMin: 0, durationMin: 150, room: "Gedung Kuliah Bersama 102" }, // Kamis
  5: { dayOfWeek: 5, startHour: 8, startMin: 30, durationMin: 120, room: "Auditorium Utama" }, // Jumat
}

export async function getCalendarEvents(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id
    const userRole = req.user!.role

    // Fetch user courses (enrolled courses for student, taught courses for teacher)
    const courses = await prisma.course.findMany({
      where:
        userRole === "TEACHER"
          ? { teacherId: userId }
          : { enrollments: { some: { userId } } },
      include: {
        assignments: {
          include: {
            submissions: { where: { userId } },
            grades: { where: { userId } },
          },
        },
        quizSessions: {
          include: {
            quizResults: { where: { userId } },
          },
        },
        attendanceSessions: {
          include: {
            checkins: { where: { userId } },
          },
        },
      },
    })

    const events: CalendarEvent[] = []

    // 1. Assignments
    for (const course of courses) {
      for (const a of course.assignments) {
        const isSubmitted = a.submissions && a.submissions.length > 0
        const isPast = new Date() > new Date(a.deadline)
        let status: CalendarEvent["status"] = "PENDING"
        if (isSubmitted) status = "SUBMITTED"
        else if (isPast) status = "MISSED"

        events.push({
          id: `assignment-${a.id}`,
          title: a.title,
          description: a.description || `Pengumpulan tugas mata kuliah ${course.title}`,
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          start: a.deadline.toISOString(),
          type: "ASSIGNMENT",
          status,
          url: `/courses/${course.id}?tab=assignments`,
          color: isSubmitted ? "#10b981" : isPast ? "#ef4444" : "#f59e0b",
          meta: {
            assignmentId: a.id,
            deadline: a.deadline,
            submission: a.submissions?.[0],
            grade: a.grades?.[0],
          },
        })
      }

      // 2. Quizzes
      for (const q of course.quizSessions) {
        const hasResult = q.quizResults && q.quizResults.length > 0
        const result = q.quizResults?.[0]
        const closeDate = new Date(new Date(q.createdAt).getTime() + 14 * 24 * 60 * 60 * 1000)
        const isPast = new Date() > closeDate
        let status: CalendarEvent["status"] = "PENDING"
        if (hasResult) status = "COMPLETED"
        else if (isPast) status = "MISSED"

        events.push({
          id: `quiz-${q.id}`,
          title: q.title,
          description: q.description || `Kuis evaluasi ${course.title}`,
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          start: closeDate.toISOString(),
          end: closeDate.toISOString(),
          type: "QUIZ",
          status,
          url: `/quiz/${q.id}`,
          color: hasResult ? "#059669" : isPast ? "#ef4444" : "#3b82f6",
          meta: {
            quizSessionId: q.id,
            isKingOfTheHill: q.isKingOfTheHill,
            score: result?.totalScore,
            createdAt: q.createdAt.toISOString(),
            closeDate: closeDate.toISOString(),
          },
        })
      }

      // 3. Attendance Sessions
      for (const att of course.attendanceSessions) {
        const isCheckedIn = att.checkins && att.checkins.length > 0
        const isExpired = new Date() > new Date(att.expiresAt)
        let status: CalendarEvent["status"] = "PENDING"
        if (isCheckedIn) status = "COMPLETED"
        else if (isExpired) status = "MISSED"

        events.push({
          id: `attendance-${att.id}`,
          title: att.title.toLowerCase().startsWith("presensi") ? att.title : `Presensi: ${att.title}`,
          description: att.description || `Sesi presensi perkuliahan ${course.title}`,
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          start: att.createdAt.toISOString(),
          end: att.expiresAt.toISOString(),
          type: "ATTENDANCE",
          status,
          url: `/attendance/${course.id}`,
          color: isCheckedIn ? "#10b981" : isExpired ? "#ef4444" : "#8b5cf6",
          meta: {
            code: att.code,
            expiresAt: att.expiresAt,
            checkedIn: isCheckedIn,
          },
        })
      }

      // 4. Generate Recurring Weekly Lecture Schedule for past 4 weeks and next 8 weeks
      const slot = COURSE_SCHEDULE_MAP[course.id] || {
        dayOfWeek: (course.id % 5) + 1,
        startHour: 8 + (course.id % 3) * 2,
        startMin: 0,
        durationMin: 120,
        room: `Ruang Kuliah ${course.id + 100}`,
      }

      const now = new Date()
      // Generate for ±6 weeks
      for (let offset = -4; offset <= 8; offset++) {
        const d = new Date(now)
        const currentDay = d.getDay() // 0 = Sun, 1 = Mon ...
        const diffDays = slot.dayOfWeek - currentDay + offset * 7
        d.setDate(d.getDate() + diffDays)
        d.setHours(slot.startHour, slot.startMin, 0, 0)

        const startIso = d.toISOString()
        const endD = new Date(d.getTime() + slot.durationMin * 60 * 1000)

        events.push({
          id: `lecture-${course.id}-${offset}`,
          title: `Kuliah: ${course.title}`,
          description: `Jadwal tatap muka perkuliahan di ${slot.room}`,
          courseId: course.id,
          courseName: course.title,
          courseCode: course.code,
          start: startIso,
          end: endD.toISOString(),
          type: "LECTURE",
          status: "SCHEDULED",
          url: `/courses/${course.id}`,
          color: "#0284c7",
          meta: {
            room: slot.room,
          },
        })
      }
    }

    // 5. Adaptive Remedial Sessions (for Students)
    if (userRole === "STUDENT") {
      const trainingSessions = await prisma.trainingSession.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      for (const t of trainingSessions) {
        events.push({
          id: `remedial-${t.id}`,
          title: `Latihan Mandiri: ${t.topic}`,
          description: `Sesi latihan adaptif AI remedial topik ${t.topic} (${t.difficulty})`,
          start: t.createdAt.toISOString(),
          type: "REMEDIAL",
          status: t.status === "COMPLETED" ? "COMPLETED" : "PENDING",
          url: `/ai-training`,
          color: "#ec4899",
          meta: {
            sessionId: t.id,
            topic: t.topic,
            improvementDelta: t.improvementDelta,
          },
        })
      }
    }

    // Sort chronologically by start date
    events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())

    res.json({
      total: events.length,
      events,
    })
  } catch (err) {
    next(err)
  }
}
