"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  Course,
  StudentRecommendation,
  StudentProfileResponse,
  fetchCalendarEvents,
  CalendarEvent,
} from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { EmptyState } from "@/components/ui/EmptyState"

interface StudentDashboardProps {
  userName: string
  courses: Course[]
  recommendations: StudentRecommendation[]
  profile: StudentProfileResponse | null
  loading: boolean
}

type CourseTab = "all" | "inprogress" | "past" | "starred"
type DateFilterKey = "all" | "overdue" | "next7days" | "next30days" | "next3months" | "next6months"
type SortKey = "dates" | "courses"

export function StudentDashboard({
  userName,
  courses,
  recommendations,
  profile,
  loading,
}: StudentDashboardProps) {
  const [courseTab, setCourseTab] = useState<CourseTab>("all")
  const [searchCourse, setSearchCourse] = useState("")
  const [starredCourses, setStarredCourses] = useState<number[]>([1])
  const [sortBy, setSortBy] = useState<"name" | "recent">("recent")
  const [announcementDismissed, setAnnouncementDismissed] = useState(false)

  // RemUI Timeline State
  const [timelineDateFilter, setTimelineDateFilter] = useState<DateFilterKey>("next30days")
  const [timelineSort, setTimelineSort] = useState<SortKey>("dates")
  const [timelineSearch, setTimelineSearch] = useState("")
  const [dayDropdownOpen, setDayDropdownOpen] = useState(false)
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)

  useEffect(() => {
    const handleGlobalClick = () => {
      setDayDropdownOpen(false)
      setSortDropdownOpen(false)
    }
    if (dayDropdownOpen || sortDropdownOpen) {
      document.addEventListener("click", handleGlobalClick)
      return () => document.removeEventListener("click", handleGlobalClick)
    }
  }, [dayDropdownOpen, sortDropdownOpen])

  const toggleStar = (courseId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setStarredCourses((prev) =>
      prev.includes(courseId) ? prev.filter((id) => id !== courseId) : [...prev, courseId]
    )
  }

  const topRecommendation = recommendations[0]
  const weakTopics = profile?.topicMasteries.filter((m) => m.masteryScore < 60) || []
  const criticalTopic = weakTopics[0]

  const filteredCourses = courses
    .filter((c) => {
      if (searchCourse) {
        const q = searchCourse.toLowerCase()
        if (!c.title.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false
      }
      if (courseTab === "inprogress") return (c.progressPct ?? 0) < 100
      if (courseTab === "past") return (c.progressPct ?? 0) >= 100
      if (courseTab === "starred") return starredCourses.includes(c.id)
      return true
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title)
      return (b.progressPct ?? 0) - (a.progressPct ?? 0)
    })

  // Real Calendar & Timeline Events State
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    setTimelineLoading(true)
    fetchCalendarEvents()
      .then((res) => {
        if (isMounted) {
          setCalendarEvents(res.events || [])
        }
      })
      .catch((err) => {
        console.error("Failed to load timeline events:", err)
      })
      .finally(() => {
        if (isMounted) setTimelineLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const dateFilterLabels: Record<DateFilterKey, string> = {
    all: "All",
    overdue: "Overdue",
    next7days: "Next 7 days",
    next30days: "Next 30 days",
    next3months: "Next 3 months",
    next6months: "Next 6 months",
  }

  interface TimelineItem {
    id: string | number
    type: "quiz" | "assign" | "training" | "group"
    title: string
    course: string
    actionText: string
    time: string
    dateGroup: string
    courseGroup: string
    rawDate: Date
    btnLabel: string
    btnHref: string
    btnVariant: "primary" | "secondary"
    status: string
    isOverdue: boolean
  }

  // Map real calendar events + recommendations into unified timeline items
  const allTimelineActivities = useMemo<TimelineItem[]>(() => {
    const list: TimelineItem[] = []
    const now = new Date()

    // 1. Process Calendar Events from DB
    for (const ev of calendarEvents) {
      if (ev.type === "LECTURE" || ev.type === "ATTENDANCE") {
        // Timeline block focuses on assignments/tasks, quizzes, and adaptive training (presensi tersedia di shortcut navbar)
        continue
      }

      const rawDate = new Date(ev.start || ev.end || now)
      const timeStr = !isNaN(rawDate.getTime())
        ? rawDate.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false })
        : "23:59"

      const dateGroupStr = !isNaN(rawDate.getTime())
        ? rawDate.toLocaleDateString("id-ID", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : "Agenda Mendatang"

      const courseTitle = ev.courseName || "Umum"
      const courseCode = ev.courseCode ? ` [${ev.courseCode}]` : ""
      const courseLabel = `${courseTitle}${courseCode}`

      if (ev.type === "ASSIGNMENT") {
        const isPast = now > rawDate
        const isSubmitted = ev.status === "SUBMITTED" || Boolean(ev.meta?.submission)
        const isOverdue = !isSubmitted && isPast

        // Tugas yang sudah dikumpulkan/selesai langsung dihilangkan dari timeline siswa
        if (isSubmitted) {
          continue
        }

        list.push({
          id: ev.id,
          type: "assign",
          title: ev.title,
          course: courseLabel,
          actionText: isOverdue
            ? "Melewati batas waktu (Overdue)"
            : "Assignment is due",
          time: timeStr,
          dateGroup: dateGroupStr,
          courseGroup: courseLabel,
          rawDate,
          btnLabel: "Add submission",
          btnHref: ev.url || (ev.courseId ? `/courses/${ev.courseId}?tab=assignments` : "/courses"),
          btnVariant: "primary",
          status: ev.status || "PENDING",
          isOverdue,
        })
      } else if (ev.type === "QUIZ") {
        const isCompleted = ev.status === "COMPLETED" || Boolean(ev.meta?.score !== undefined && ev.meta?.score !== null)
        const isPast = now > rawDate
        const isOverdue = !isCompleted && isPast

        // Kuis yang sudah selesai dikerjakan juga dihilangkan dari agenda pending timeline
        if (isCompleted) {
          continue
        }

        list.push({
          id: ev.id,
          type: "quiz",
          title: ev.title,
          course: courseLabel,
          actionText: isOverdue
            ? "Kuis ditutup (Missed)"
            : "Quiz closes",
          time: timeStr,
          dateGroup: dateGroupStr,
          courseGroup: courseLabel,
          rawDate,
          btnLabel: "Attempt quiz now",
          btnHref: ev.url || "/quiz",
          btnVariant: "primary",
          status: ev.status || "PENDING",
          isOverdue,
        })
      } else if (ev.type === "REMEDIAL") {
        list.push({
          id: ev.id,
          type: "training",
          title: ev.title,
          course: courseLabel,
          actionText: "Adaptive practice recommended",
          time: timeStr,
          dateGroup: dateGroupStr,
          courseGroup: courseLabel,
          rawDate,
          btnLabel: "Start practice",
          btnHref: ev.url || "/ai-training",
          btnVariant: "primary",
          status: ev.status || "PENDING",
          isOverdue: false,
        })
      }
    }

    // 2. Synthesize AI Adaptive Recommendations
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((rec, idx) => {
        const recCourse = (rec.metadata?.courseTitle as string) || "AKSES ADAPTIF AKSARA"
        const recCode = (rec.metadata?.courseCode as string) ? ` [${rec.metadata?.courseCode}]` : ""
        const courseLabel = `${recCourse}${recCode}`

        const todayStr = now.toLocaleDateString("id-ID", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })

        list.push({
          id: `rec-adaptive-${idx}`,
          type: "training",
          title: rec.title,
          course: courseLabel,
          actionText: "Adaptive practice recommended",
          time: "23:59",
          dateGroup: todayStr,
          courseGroup: courseLabel,
          rawDate: now,
          btnLabel: rec.actionLabel || "Start practice",
          btnHref: rec.actionUrl || "/ai-training",
          btnVariant: "primary",
          status: "PENDING",
          isOverdue: false,
        })
      })
    }

    return list
  }, [calendarEvents, recommendations])

  // Filter and group timeline activities
  const filteredTimeline = useMemo(() => {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const in7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
    const in30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000)
    const in3Months = new Date(startOfToday.getTime() + 90 * 24 * 60 * 60 * 1000)
    const in6Months = new Date(startOfToday.getTime() + 180 * 24 * 60 * 60 * 1000)

    // 1. Date Filter
    let items = allTimelineActivities.filter((item) => {
      if (timelineDateFilter === "all") return true
      if (timelineDateFilter === "overdue") return item.isOverdue
      if (timelineDateFilter === "next7days") {
        return item.rawDate >= startOfToday && item.rawDate <= in7Days
      }
      if (timelineDateFilter === "next30days") {
        return item.rawDate >= startOfToday && item.rawDate <= in30Days
      }
      if (timelineDateFilter === "next3months") {
        return item.rawDate >= startOfToday && item.rawDate <= in3Months
      }
      if (timelineDateFilter === "next6months") {
        return item.rawDate >= startOfToday && item.rawDate <= in6Months
      }
      return true
    })

    // 2. Search Filter
    if (timelineSearch.trim()) {
      const q = timelineSearch.toLowerCase().trim()
      items = items.filter((item) => {
        return (
          item.title.toLowerCase().includes(q) ||
          item.course.toLowerCase().includes(q) ||
          item.actionText.toLowerCase().includes(q) ||
          (item.type === "assign" && (q.includes("tugas") || q.includes("assign"))) ||
          (item.type === "quiz" && (q.includes("kuis") || q.includes("quiz"))) ||
          (item.type === "training" && (q.includes("latihan") || q.includes("adaptif") || q.includes("train")))
        )
      })
    }

    // 3. Grouping & Sorting
    if (timelineSort === "dates") {
      items.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())

      const groupsMap = new Map<string, TimelineItem[]>()
      for (const item of items) {
        if (!groupsMap.has(item.dateGroup)) {
          groupsMap.set(item.dateGroup, [])
        }
        groupsMap.get(item.dateGroup)!.push(item)
      }

      return Array.from(groupsMap.entries()).map(([heading, events]) => ({
        groupHeading: heading,
        dateGroup: heading,
        events,
      }))
    } else {
      items.sort((a, b) => {
        const cComp = a.courseGroup.localeCompare(b.courseGroup)
        if (cComp !== 0) return cComp
        return a.rawDate.getTime() - b.rawDate.getTime()
      })

      const groupsMap = new Map<string, TimelineItem[]>()
      for (const item of items) {
        if (!groupsMap.has(item.courseGroup)) {
          groupsMap.set(item.courseGroup, [])
        }
        groupsMap.get(item.courseGroup)!.push(item)
      }

      return Array.from(groupsMap.entries()).map(([heading, events]) => ({
        groupHeading: heading,
        dateGroup: heading,
        events,
      }))
    }
  }, [allTimelineActivities, timelineDateFilter, timelineSearch, timelineSort])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 rounded-lg"></div>
        <div className="h-36 bg-zinc-200 rounded-lg"></div>
        <div className="h-64 bg-zinc-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-full">
      
      {/* ─── Breadcrumbs & Welcome Bar ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>Home</span>
            <span>/</span>
            <span className="text-zinc-800 dark:text-zinc-100">Dashboard</span>
            <span>/</span>
            <span className="text-brand-600 dark:text-brand-400 font-bold">Mahasiswa</span>
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-1 tracking-tight">
            Selamat Datang, {userName}
          </h1>
        </div>
      </div>

      {/* ─── Dashboard Announcements Banner ─────────────────────────── */}
      {!announcementDismissed && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-brand-200 dark:border-brand-900/60 border-l-4 border-l-brand-600 p-5 shadow-down-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-600 text-white px-1.5 py-0.5 rounded">
                PENGUMUMAN LMS
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">Semester Ganjil 2024/2025</span>
            </div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
              Sistem Pembelajaran & Asesmen Adaptif Aksara LMS Aktif
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
              Selesaikan latihan mandiri adaptif dan evaluasi kuis mingguan. 
              Sistem otomatis mendeteksi topik lemah (*Closed-Loop Remediation*) dan menyusun materi penguatan khusus.
            </p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
            <Link
              href="/ai-training"
              className="text-xs font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 hover:bg-brand-100 dark:hover:bg-brand-900/60 px-3 py-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 shadow-2xs"
            >
              Buka Latihan
            </Link>
            <button
              onClick={() => setAnnouncementDismissed(true)}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              title="Tutup Pengumuman"
              aria-label="Tutup Pengumuman"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── Main Content Flow ──────────────────────────────────────────── */}
      <div className="space-y-6">
        
        {/* 1. Aksara Adaptive Advisory (Next Best Action & Diagnostic) */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400">
                Rekomendasi Pembelajaran Adaptif
              </span>
              {topRecommendation?.priority === "HIGH" && (
                <Badge variant="warning">Prioritas Utama</Badge>
              )}
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
              {topRecommendation ? topRecommendation.title : "Lanjutkan Silabus Perkuliahan"}
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
              {topRecommendation
                ? topRecommendation.description
                : "Sistem belum mendeteksi kelemahan spesifik. Kamu dapat melanjutkan mempelajari materi modul berikutnya atau mengikuti asesmen berkala."}
            </p>
            {criticalTopic && (
              <div className="pt-1 text-xs text-zinc-700 dark:text-zinc-200">
                Diagnosis: Nilai rata-rata topik <strong className="font-bold text-brand-700 dark:text-brand-400">{criticalTopic.topic}</strong> berada di angka {criticalTopic.masteryScore}.
              </div>
            )}
          </div>

          <div className="flex-shrink-0">
            <Link
              href={topRecommendation ? topRecommendation.actionUrl : "/courses"}
              className="btn-primary text-xs py-2 px-4 rounded-lg font-bold flex items-center gap-1.5 shadow-down-card shadow-down-hover"
            >
              <span>{topRecommendation ? topRecommendation.actionLabel : "Buka Modul"}</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>

        {/* 2. Recently Accessed Courses */}
        {courses.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                  Recently Accessed Courses
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">Mata kuliah yang terakhir kamu akses</p>
              </div>
              <Link href="/courses" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                Semua Kelas &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {courses.slice(0, 3).map((c) => (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className="group block rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-down-card shadow-down-hover bg-white dark:bg-zinc-900 flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-200 mb-1.5">
                      <span className="font-bold text-brand-700 dark:text-brand-400 uppercase bg-brand-50 dark:bg-brand-950/50 border border-brand-200 dark:border-brand-900/60 px-1.5 py-0.5 rounded">
                        {c.code}
                      </span>
                      <span>Akses terakhir hari ini</span>
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition font-heading line-clamp-1">
                      {c.title}
                    </h3>
                  </div>
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <ProgressBar value={c.progressPct ?? 65} size="sm" showLabel label="Progress Belajar" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ─── 3. RemUI Moodle Timeline Block (Placed directly below Recently Accessed Courses) ─── */}
        <div id="block-timeline-aksara" className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-5" data-region="timeline">
          
          {/* Header Title */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                Timeline
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-200">Aktivitas kuis, tugas, dan agenda akademik terdekat</p>
            </div>
          </div>

          {/* Filters Bar: Day Filter Dropdown + View Selector Dropdown + Search Input */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filter 1: Day Filter Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setDayDropdownOpen(!dayDropdownOpen)
                  setSortDropdownOpen(false)
                }}
                className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2 shadow-2xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                aria-label="Filter timeline by date"
              >
                <span>{dateFilterLabels[timelineDateFilter]}</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {dayDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      setTimelineDateFilter("all")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "all" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => {
                      setTimelineDateFilter("overdue")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "overdue" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Overdue
                  </button>
                  <div className="my-1 border-t border-zinc-100 dark:border-zinc-700"></div>
                  <div className="px-3.5 py-1 text-[10px] font-bold text-zinc-400 dark:text-zinc-200 uppercase tracking-wider">
                    Due date
                  </div>
                  <button
                    onClick={() => {
                      setTimelineDateFilter("next7days")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "next7days" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Next 7 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineDateFilter("next30days")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "next30days" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Next 30 days
                  </button>
                  <button
                    onClick={() => {
                      setTimelineDateFilter("next3months")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "next3months" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Next 3 months
                  </button>
                  <button
                    onClick={() => {
                      setTimelineDateFilter("next6months")
                      setDayDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineDateFilter === "next6months" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Next 6 months
                  </button>
                </div>
              )}
            </div>

            {/* Filter 2: Sort Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setSortDropdownOpen(!sortDropdownOpen)
                  setDayDropdownOpen(false)
                }}
                className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-100 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-2 shadow-2xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                aria-label="Sort timeline items"
              >
                <span>{timelineSort === "dates" ? "Sort by dates" : "Sort by courses"}</span>
                <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {sortDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute left-0 mt-1 w-44 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-md py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
                >
                  <button
                    onClick={() => {
                      setTimelineSort("dates")
                      setSortDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineSort === "dates" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Sort by dates
                  </button>
                  <button
                    onClick={() => {
                      setTimelineSort("courses")
                      setSortDropdownOpen(false)
                    }}
                    className={`block w-full text-left px-3.5 py-2 transition-colors ${timelineSort === "courses" ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold" : "text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:hover:text-white"}`}
                  >
                    Sort by courses
                  </button>
                </div>
              )}
            </div>

            {/* Filter 3: Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <input
                type="text"
                placeholder="Search by activity type or name"
                value={timelineSearch}
                onChange={(e) => setTimelineSearch(e.target.value)}
                className="w-full pl-9 pr-7 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white dark:bg-zinc-800 shadow-2xs transition-colors"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {timelineSearch && (
                <button
                  onClick={() => setTimelineSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-200 hover:text-zinc-600 dark:hover:text-white text-xs p-1"
                  aria-label="Hapus Pencarian"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Timeline Event List Group (Organized by Date or Course) */}
          {timelineLoading ? (
            <div className="space-y-4 py-3 animate-pulse">
              <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"></div>
              <div className="h-4 w-52 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
              <div className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700"></div>
            </div>
          ) : filteredTimeline.length === 0 ? (
            <div className="py-8 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-50/50 dark:bg-zinc-800/40">
              <svg className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-100">No upcoming activities due</p>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-200">Tidak ada jadwal evaluasi atau tugas dengan filter saat ini.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredTimeline.slice(0, showAllActivities ? undefined : 3).map((group) => (
                <div key={group.groupHeading} className="space-y-2">
                  {/* Date / Course Heading */}
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-white font-heading tracking-wide">
                    {group.groupHeading}
                  </h3>

                  {/* Events in Group */}
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-down-card">
                    {group.events.map((event) => (
                      <div
                        key={event.id}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/60 transition-colors"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Activity Semantic Icon */}
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 border border-zinc-200 dark:border-zinc-700">
                            {event.type === "quiz" && (
                              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                            {event.type === "assign" && (
                              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                            {event.type === "training" && (
                              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            )}
                            {event.type === "group" && (
                              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            )}
                          </div>

                          <div className="space-y-0.5 min-w-0">
                            <Link
                              href={event.btnHref}
                              className="text-xs font-bold text-zinc-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors font-heading block truncate max-w-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                            >
                              {event.title}
                            </Link>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-200 truncate">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-100">
                                {timelineSort === "dates" ? event.course : event.dateGroup}
                              </span>{" "}
                              &middot;{" "}
                              <span className={event.isOverdue ? "text-amber-600 dark:text-amber-300 font-semibold" : ""}>
                                {event.actionText}
                              </span>
                            </div>
                            <div className="text-[10px] text-zinc-400 dark:text-zinc-200 font-medium pt-0.5">
                              Pukul {event.time} WIB
                            </div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="flex-shrink-0 self-end sm:self-center">
                          <Link
                            href={event.btnHref}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs whitespace-nowrap block text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                              event.btnVariant === "primary"
                                ? "bg-brand-600 hover:bg-brand-700 text-white"
                                : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700"
                            }`}
                          >
                            {event.btnLabel}
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Show more activities button */}
              {filteredTimeline.length > 3 && (
                <div className="pt-1 text-left">
                  <button
                    type="button"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="px-3.5 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-100 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
                  >
                    {showAllActivities ? "Show fewer activities" : "Show more activities"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. Course Overview (RemUI block_myoverview) */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                Course Overview
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-200">Daftar mata kuliah aktif semester berjalan</p>
            </div>

            {/* RemUI Filter Tabs (Underline with Pipe Dividers) */}
            <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 sm:border-b-0 pb-1 sm:pb-0">
              {[
                { key: "all" as const, label: "All" },
                { key: "inprogress" as const, label: "In progress" },
                { key: "past" as const, label: "Past" },
                { key: "starred" as const, label: "Starred" },
              ].map((tab, idx) => (
                <React.Fragment key={tab.key}>
                  {idx > 0 && <span className="text-zinc-200 dark:text-zinc-400 text-xs select-none">|</span>}
                  <button
                    onClick={() => setCourseTab(tab.key)}
                    className={`px-2.5 py-1 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      courseTab === tab.key
                        ? "border-brand-600 text-brand-600 dark:text-brand-300 dark:border-brand-400 font-bold"
                        : "border-transparent text-zinc-500 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-600"
                    }`}
                  >
                    {tab.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Filter, Search & Sort Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search by course name or code..."
                value={searchCourse}
                onChange={(e) => setSearchCourse(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white dark:bg-zinc-800 shadow-2xs"
              />
              <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "name" | "recent")}
                className="px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-100 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 shadow-2xs"
              >
                <option value="recent">Sort by last accessed</option>
                <option value="name">Sort by course name</option>
              </select>
              <span className="text-xs text-zinc-400 dark:text-zinc-200 whitespace-nowrap">
                {filteredCourses.length} courses
              </span>
            </div>
          </div>

          {/* Courses Grid */}
          {filteredCourses.length === 0 ? (
            <EmptyState
              title="No Courses Found"
              description={
                searchCourse
                  ? "Tidak ada mata kuliah yang cocok dengan kata kunci pencarian."
                  : "Belum ada mata kuliah pada kategori ini."
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => {
                const isStarred = starredCourses.includes(course.id)
                return (
                  <div
                    key={course.id}
                    className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-down-card shadow-down-hover flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-md uppercase">
                            {course.code}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => toggleStar(course.id, e)}
                            className={`p-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                              isStarred ? "text-amber-500 dark:text-amber-300 hover:text-amber-600" : "text-zinc-300 dark:text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-200"
                            }`}
                            title={isStarred ? "Hapus dari Berbintang" : "Tandai Berbintang"}
                            aria-label={isStarred ? "Hapus dari Berbintang" : "Tandai Berbintang"}
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                          </button>
                        </div>

                        <Link
                          href={`/courses/${course.id}`}
                          className="block mt-2.5 group/link focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                        >
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover/link:text-brand-600 dark:group-hover/link:text-brand-300 transition-colors line-clamp-1 font-heading">
                            {course.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-200 line-clamp-2 mt-1 leading-relaxed">
                            {course.description || "Silabus materi dan topik perkuliahan semester aktif."}
                          </p>
                        </Link>
                      </div>

                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                        <ProgressBar value={course.progressPct ?? 75} size="sm" showLabel label="Progress" />
                        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-200">
                          <span>{course._count?.modules || 0} Modul Silabus</span>
                          <Link
                            href={`/courses/${course.id}`}
                            className="text-brand-600 dark:text-brand-300 font-semibold hover:underline inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                          >
                            <span>Buka Kelas</span>
                            <span>&rarr;</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 5. Closed-Loop Learning Evidence (Proof of Improvement) */}
        {profile && profile.remediationImpact && profile.remediationImpact.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                  Bukti Peningkatan Belajar (Closed-Loop Evidence)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Perbandingan performa sebelum vs sesudah intervensi latihan adaptif
                </p>
              </div>
              <Badge variant="accent">Terukur</Badge>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 overflow-hidden shadow-down-card">
              {profile.remediationImpact.slice(0, 3).map((rem) => (
                <div key={rem.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white font-heading">{rem.topic}</span>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-200">Tingkat {rem.difficulty}</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 dark:text-zinc-200 mt-0.5">
                      {rem.completedAt
                        ? new Date(rem.completedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Selesai"}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium">
                    <div className="text-zinc-500 dark:text-zinc-200">
                      Baseline: <strong className="text-zinc-800 dark:text-white font-bold">{rem.preAccuracy}%</strong>
                    </div>
                    <span className="text-zinc-300 dark:text-zinc-400">&rarr;</span>
                    <div className="text-zinc-500 dark:text-zinc-200">
                      Hasil: <strong className="text-emerald-700 dark:text-emerald-300 font-bold">{rem.postAccuracy}%</strong>
                    </div>
                    <Badge variant="success">
                      {rem.improvementDelta >= 0 ? `+${rem.improvementDelta}` : rem.improvementDelta} poin
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Matriks Nilai Rata-rata Topik */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                Matriks Nilai Rata-rata Topik
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-200">
                Nilai rata-rata pemahaman materi dihitung berdasarkan asesmen dan akurasi
              </p>
            </div>
            <Link href="/profile" className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded">
              Lihat Semua &rarr;
            </Link>
          </div>

          {!profile || profile.topicMasteries.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Nilai Rata-rata"
              description="Ikuti kuis atau mulai latihan AI untuk membangun pemetaan nilai belajarmu."
              actionLabel="Mulai Latihan Adaptif"
              actionHref="/ai-training"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {profile.topicMasteries.slice(0, 6).map((m) => (
                <div
                  key={m.topic}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-down-card shadow-down-hover flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-xs text-zinc-900 dark:text-white truncate font-heading">{m.topic}</span>
                      <Badge
                        variant={
                          m.trend === "IMPROVING"
                            ? "success"
                            : m.trend === "DECLINING"
                            ? "danger"
                            : "neutral"
                        }
                      >
                        {m.trend === "IMPROVING"
                          ? "Naik"
                          : m.trend === "DECLINING"
                          ? "Turun"
                          : "Stabil"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-lg font-bold text-zinc-900 dark:text-white font-heading">{m.masteryScore}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-200">{m.attempts} attempt</span>
                    </div>
                    <ProgressBar value={m.masteryScore} size="sm" className="mt-1" />
                  </div>

                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-200">
                      Akurasi: {m.accuracy}
                    </span>
                    <Link
                      href={`/ai-training?topic=${encodeURIComponent(m.topic)}`}
                      className="font-semibold text-brand-600 dark:text-brand-300 hover:underline text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                    >
                      Latih &rarr;
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
