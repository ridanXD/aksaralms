"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import { fetchCalendarEvents, CalendarEvent, fetchCourses, Course } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"

type ViewMode = "MONTH" | "AGENDA"

export default function CalendarPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("MONTH")
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [selectedCourseId, setSelectedCourseId] = useState<string>("ALL")
  const [selectedType, setSelectedType] = useState<string>("ALL")
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<Date | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const [eventsRes, coursesRes] = await Promise.all([
          fetchCalendarEvents(),
          fetchCourses(),
        ])
        setEvents(eventsRes.events || [])
        setCourses(coursesRes || [])
      } catch (err) {
        console.error("Failed to load calendar data:", err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter events by course and type
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedCourseId !== "ALL" && ev.courseId !== parseInt(selectedCourseId)) {
        return false
      }
      if (selectedType !== "ALL" && ev.type !== selectedType) {
        return false
      }
      return true
    })
  }, [events, selectedCourseId, selectedType])

  // Month navigation handlers
  const handlePrev = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const handleNext = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Month Grid calculations
  const monthInfo = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun, 1 = Mon ...
    const adjustedFirstDay = (firstDayIndex + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; dateString: string }[] = []

    // Previous month padding days
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        dateString: formatDateKey(d),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: isSameDay(d, new Date()),
        dateString: formatDateKey(d),
      })
    }

    // Next month padding days to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        dateString: formatDateKey(d),
      })
    }

    return { year, month, days }
  }, [currentDate])

  // Group filtered events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    filteredEvents.forEach((ev) => {
      const d = new Date(ev.start)
      const key = formatDateKey(d)
      const list = map.get(key) || []
      list.push(ev)
      map.set(key, list)
    })
    return map
  }, [filteredEvents])

  // Quick stats - Real totals across user's courses
  const stats = useMemo(() => {
    const assignmentsCount = events.filter((e) => e.type === "ASSIGNMENT").length
    const quizzesCount = events.filter((e) => e.type === "QUIZ").length
    const lecturesCount = events.filter((e) => e.type === "LECTURE").length
    const attendanceCount = events.filter((e) => e.type === "ATTENDANCE").length
    return {
      assignmentsCount,
      quizzesCount,
      lecturesCount,
      attendanceCount,
      coursesCount: courses.length,
    }
  }, [events, courses])

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  const dayNames = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
  const dayNamesFull = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"]

  const hasActiveFilter = selectedCourseId !== "ALL" || selectedType !== "ALL"

  return (
    <div className="space-y-6">
      {/* ─── Page Header (Clean, Institutional) ────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 sm:p-7 shadow-down flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-xs"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 font-heading">
              Jadwal & Agenda Akademik
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-white font-heading tracking-tight mt-1">
            Kalender Perkuliahan
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-300 mt-0.5 font-normal">
            Pantau jadwal perkuliahan, batas pengumpulan tugas, kuis interaktif, dan presensi kelas secara terpadu.
          </p>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-200 self-start md:self-auto shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Semester Aktif 2026/2027</span>
        </div>
      </div>

      {/* ─── Metric Strip Cards (Refined with Red Brand SVGs & Balanced Layout) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Tugas & Praktikum */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down hover:shadow-down-lg hover:-translate-y-0.5 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading block">
              Tugas & Deadline
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading leading-tight">
              {stats.assignmentsCount}
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-300 font-medium">
              Batas Waktu Pengumpulan
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800/60 shadow-2xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Card 2: Kuis & Evaluasi */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down hover:shadow-down-lg hover:-translate-y-0.5 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading block">
              Kuis & Evaluasi
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading leading-tight">
              {stats.quizzesCount}
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-300 font-medium">
              Kuis Pemahaman Topik
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800/60 shadow-2xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        </div>

        {/* Card 3: Mata Kuliah Aktif */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down hover:shadow-down-lg hover:-translate-y-0.5 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading block">
              Mata Kuliah Aktif
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading leading-tight">
              {stats.coursesCount}
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-300 font-medium">
              Terdaftar Semester Ini
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800/60 shadow-2xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        {/* Card 4: Sesi Presensi Perkuliahan */}
        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down hover:shadow-down-lg hover:-translate-y-0.5 transition-all flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading block">
              Presensi Kelas
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading leading-tight">
              {stats.attendanceCount}
            </div>
            <div className="text-xs text-brand-600 dark:text-brand-300 font-medium">
              Sesi Presensi Terjadwal
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-300 flex items-center justify-center shrink-0 border border-brand-200/70 dark:border-brand-800/60 shadow-2xs">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

      </div>

      {/* ─── Refined Control Bar (Clear Separation of Date Navigation & Filters) ─── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down overflow-hidden">
        
        {/* Top Segment: Month Navigator (Left) + View Mode Tabs (Right - Bulan & Agenda) */}
        <div className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800">
          
          {/* Navigation Controls + Clear Month Label */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-zinc-100/80 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-700">
              <button
                onClick={handlePrev}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-700 text-zinc-700 dark:text-white hover:text-brand-600 dark:hover:text-brand-300 hover:bg-zinc-50 dark:hover:bg-zinc-600 border border-zinc-200/80 dark:border-zinc-600 shadow-xs transition-all cursor-pointer"
                title="Bulan Sebelumnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleToday}
                className="px-3 h-8 text-xs font-bold rounded-lg bg-white dark:bg-zinc-700 text-zinc-800 dark:text-white hover:text-brand-600 dark:hover:text-brand-300 hover:bg-zinc-50 dark:hover:bg-zinc-600 border border-zinc-200/80 dark:border-zinc-600 shadow-xs transition-all cursor-pointer"
              >
                Bulan Ini
              </button>

              <button
                onClick={handleNext}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-zinc-700 text-zinc-700 dark:text-white hover:text-brand-600 dark:hover:text-brand-300 hover:bg-zinc-50 dark:hover:bg-zinc-600 border border-zinc-200/80 dark:border-zinc-600 shadow-xs transition-all cursor-pointer"
                title="Bulan Selanjutnya"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 pl-1">
              <span className="text-lg sm:text-xl font-extrabold text-zinc-900 dark:text-white font-heading tracking-tight">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
            </div>
          </div>

          {/* View Mode Segmented Buttons: Bulan vs Agenda */}
          <div className="flex items-center bg-zinc-100/80 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200/70 dark:border-zinc-700 self-start md:self-auto">
            <button
              onClick={() => setViewMode("MONTH")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "MONTH"
                  ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-300 shadow-sm font-extrabold"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Bulan</span>
            </button>
            <button
              onClick={() => setViewMode("AGENDA")}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "AGENDA"
                  ? "bg-white dark:bg-zinc-700 text-brand-600 dark:text-brand-300 shadow-sm font-extrabold"
                  : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>Agenda</span>
            </button>
          </div>
        </div>

        {/* Bottom Segment: Dedicated Filter Row */}
        <div className="px-4 sm:px-5 py-3 bg-zinc-50/60 dark:bg-zinc-850 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300 font-heading">
              Filter Kalender:
            </span>

            {/* Course Selector */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="text-xs font-bold bg-transparent text-zinc-700 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Mata Kuliah</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.code} · {c.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Event Type Filter */}
            <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="text-xs font-bold bg-transparent text-zinc-700 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="ASSIGNMENT">Tugas & Deadline</option>
                <option value="QUIZ">Kuis & Evaluasi</option>
                <option value="LECTURE">Jadwal Kuliah</option>
                <option value="ATTENDANCE">Presensi Kelas</option>
              </select>
            </div>

            {/* Reset Filter Button */}
            {hasActiveFilter && (
              <button
                onClick={() => {
                  setSelectedCourseId("ALL")
                  setSelectedType("ALL")
                }}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-white text-[11px] font-bold transition-all"
              >
                ✕ Reset Filter
              </button>
            )}
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-300 font-medium">
            Menampilkan <span className="font-bold text-zinc-800 dark:text-white">{filteredEvents.length}</span> agenda
          </div>
        </div>

      </div>

      {/* ─── Category Legend Strip ─────────────────────────────────── */}
      <div className="flex items-center gap-3 text-xs text-zinc-600 dark:text-zinc-200 flex-wrap bg-white dark:bg-zinc-900 px-4 py-3 rounded-xl border border-zinc-200/90 dark:border-zinc-800 shadow-down">
        <span className="font-bold text-zinc-400 dark:text-zinc-300 text-[10px] uppercase tracking-wider font-heading">
          Kategori Acara:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-xs"></span>
          <span className="font-medium">Deadline Tugas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-xs"></span>
          <span className="font-medium">Kuis Interaktif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-600 shadow-xs"></span>
          <span className="font-medium">Jadwal Kuliah</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-xs"></span>
          <span className="font-medium">Presensi Kelas</span>
        </div>
      </div>

      {/* ─── Main View Switcher Render ───────────────────────────── */}
      {loading ? (
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-16 flex flex-col items-center justify-center gap-3 shadow-down">
          <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">Memuat jadwal kalender...</span>
        </div>
      ) : viewMode === "MONTH" ? (
        /* ─── Monthly Calendar Grid ─────────────────────────────── */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down overflow-hidden">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/80 text-center text-xs font-bold text-zinc-700 dark:text-zinc-200 py-3 font-heading">
            {dayNamesFull.map((name, i) => (
              <div key={name} className="truncate px-1">
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{dayNames[i]}</span>
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800">
            {monthInfo.days.map((dayObj, index) => {
              const dayEvents = eventsByDate.get(dayObj.dateString) || []
              return (
                <div
                  key={index}
                  onClick={() => setSelectedDayDate(dayObj.date)}
                  className={`min-h-[110px] sm:min-h-[130px] p-2 flex flex-col transition-all cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                    !dayObj.isCurrentMonth
                      ? "bg-zinc-50/50 dark:bg-zinc-950/40 text-zinc-400 dark:text-zinc-500"
                      : "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
                  }`}
                >
                  {/* Date Header Number */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        dayObj.isToday
                          ? "bg-brand-600 text-white shadow-brand-down"
                          : dayObj.isCurrentMonth
                          ? "text-zinc-800 dark:text-white"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {dayObj.date.getDate()}
                    </span>

                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-300">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Day Event Chips */}
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedEvent(ev)
                        }}
                        className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-lg truncate border transition-all hover:scale-[1.02] shadow-2xs ${getEventBadgeClass(
                          ev.type
                        )}`}
                        title={`${ev.title} (${ev.courseName || ""})`}
                      >
                        <span className="font-bold mr-1">
                          {formatShortTime(ev.start)}
                        </span>
                        <span>{ev.title}</span>
                      </div>
                    ))}

                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-300 font-bold px-1 pt-0.5">
                        +{dayEvents.length - 3} lainnya
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* ─── Agenda List View ──────────────────────────────────── */
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down divide-y divide-zinc-200 dark:divide-zinc-800 overflow-hidden">
          <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider font-heading">
              Daftar Semua Agenda & Deadline Terdekat
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-300 font-bold">
              {filteredEvents.length} Acara Terdaftar
            </span>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="p-16 text-center text-zinc-400 dark:text-zinc-300 text-xs">
              Tidak ada agenda atau jadwal yang sesuai dengan filter yang dipilih.
            </div>
          ) : (
            filteredEvents.map((ev) => {
              const d = new Date(ev.start)
              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEvent(ev)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    {/* Date Block */}
                    <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                      <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-300 uppercase font-heading">
                        {monthNames[d.getMonth()].slice(0, 3)}
                      </span>
                      <span className="text-lg font-black text-zinc-900 dark:text-white leading-tight">
                        {d.getDate()}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase ${getEventBadgeClass(
                            ev.type
                          )}`}
                        >
                          {ev.type}
                        </span>
                        {ev.courseName && (
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                            {ev.courseCode ? `[${ev.courseCode}] ` : ""}
                            {ev.courseName}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white mt-1 font-heading">
                        {ev.title}
                      </h3>

                      {ev.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5 line-clamp-2">
                          {ev.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                        {formatShortTime(ev.start)} WIB
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-300 capitalize">
                        Status: {ev.status?.toLowerCase() || "aktif"}
                      </div>
                    </div>

                    {ev.url && (
                      <Link
                        href={ev.url}
                        onClick={(e) => e.stopPropagation()}
                        className="px-3.5 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-brand-950/40 text-zinc-700 dark:text-zinc-200 hover:text-brand-700 dark:hover:text-brand-300 rounded-xl text-xs font-bold transition-all border border-zinc-200 dark:border-zinc-700 hover:border-brand-200 dark:hover:border-brand-800"
                      >
                        Buka →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ─── Day Events Popup Modal ───────────────────────────────── */}
      {selectedDayDate && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedDayDate(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300 font-heading">
                  Agenda Tanggal
                </span>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-heading">
                  {dayNamesFull[(selectedDayDate.getDay() + 6) % 7]}, {selectedDayDate.getDate()}{" "}
                  {monthNames[selectedDayDate.getMonth()]} {selectedDayDate.getFullYear()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDate(null)}
                className="p-1.5 rounded-xl text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(eventsByDate.get(formatDateKey(selectedDayDate)) || []).length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-400 dark:text-zinc-300 italic">
                  Tidak ada jadwal atau deadline pada tanggal ini.
                </div>
              ) : (
                (eventsByDate.get(formatDateKey(selectedDayDate)) || []).map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => {
                      setSelectedDayDate(null)
                      setSelectedEvent(ev)
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer hover:shadow-card transition-all ${getEventBadgeClass(
                      ev.type
                    )}`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-80">
                      <span>{formatShortTime(ev.start)} WIB</span>
                      <span className="uppercase">{ev.type}</span>
                    </div>
                    <div className="text-xs font-bold text-zinc-900 dark:text-white mt-0.5">{ev.title}</div>
                    {ev.courseName && (
                      <div className="text-[11px] text-zinc-600 dark:text-zinc-200 mt-1 truncate">
                        {ev.courseCode ? `${ev.courseCode} · ` : ""}
                        {ev.courseName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                onClick={() => setSelectedDayDate(null)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl text-xs font-bold transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Event Detail Modal ──────────────────────────────────── */}
      {selectedEvent && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setSelectedEvent(null)}
        >
          <div
            className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase ${getEventBadgeClass(
                    selectedEvent.type
                  )}`}
                >
                  {selectedEvent.type}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white mt-1.5 font-heading">
                  {selectedEvent.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded-xl text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-600 dark:text-zinc-200">
              {selectedEvent.courseName && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block font-heading">
                    Mata Kuliah
                  </span>
                  <span className="font-bold text-zinc-900 dark:text-white text-sm">
                    {selectedEvent.courseCode ? `[${selectedEvent.courseCode}] ` : ""}
                    {selectedEvent.courseName}
                  </span>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block font-heading">
                  Waktu & Tanggal
                </span>
                <span className="font-bold text-zinc-900 dark:text-white">
                  {formatFullDateTime(selectedEvent.start)} WIB
                </span>
              </div>

              {selectedEvent.description && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block font-heading">
                    Keterangan
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-200 leading-relaxed mt-1 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              {selectedEvent.status && (
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block font-heading">
                    Status Pengerjaan
                  </span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold mt-1 ${
                      selectedEvent.status === "COMPLETED" || selectedEvent.status === "SUBMITTED"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                        : selectedEvent.status === "MISSED"
                        ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
                        : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                    }`}
                  >
                    {selectedEvent.status}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white rounded-xl text-xs font-bold transition-all"
              >
                Tutup
              </button>

              {selectedEvent.url && (
                <Link
                  href={selectedEvent.url}
                  onClick={() => setSelectedEvent(null)}
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-brand-down transition-all"
                >
                  Menuju Halaman →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}

function formatDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function formatShortTime(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function formatFullDateTime(iso: string): string {
  const d = new Date(iso)
  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"]
  return `${dayNames[d.getDay()]}, ${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()} pukul ${formatShortTime(
    iso
  )}`
}

function getEventBadgeClass(type: CalendarEvent["type"]): string {
  switch (type) {
    case "ASSIGNMENT":
      return "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-700/60 hover:bg-amber-100 dark:hover:bg-amber-900/50"
    case "QUIZ":
      return "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700/60 hover:bg-blue-100 dark:hover:bg-blue-900/50"
    case "LECTURE":
      return "bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-700/60 hover:bg-sky-100 dark:hover:bg-sky-900/50"
    case "ATTENDANCE":
      return "bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-700/60 hover:bg-purple-100 dark:hover:bg-purple-900/50"
    case "REMEDIAL":
      return "bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-300 border-pink-200 dark:border-pink-700/60 hover:bg-pink-100 dark:hover:bg-pink-900/50"
    default:
      return "bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
  }
}
