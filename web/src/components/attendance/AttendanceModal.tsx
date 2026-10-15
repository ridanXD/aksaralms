"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import QRCode from "qrcode"
import { Course, createAttendanceSession, fetchAttendanceRecords, AttendanceRecordItem } from "@/lib/api"

interface AttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  courses: Course[]
  initialCourseId?: number
  onSessionCreated?: (session: any) => void
}

export function AttendanceModal({
  isOpen,
  onClose,
  courses,
  initialCourseId,
  onSessionCreated,
}: AttendanceModalProps) {
  // Course selection
  const [selectedCourseId, setSelectedCourseId] = useState<number>(
    initialCourseId || (courses.length > 0 ? courses[0].id : 0)
  )

  // Calendar Date Picker State
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Time & Duration State
  const [startTime, setStartTime] = useState<string>("08:00")
  const [endTime, setEndTime] = useState<string>("08:15")
  const [durationMinutes, setDurationMinutes] = useState<number>(15)
  const [title, setTitle] = useState<string>("")
  const [customCode, setCustomCode] = useState<string>("")

  // Submission & Result State
  const [loading, setLoading] = useState<boolean>(false)
  const [errorMsg, setErrorMsg] = useState<string>("")
  const [generatedSession, setGeneratedSession] = useState<{
    id: number
    title: string
    code: string
    encryptedToken?: string
    expiresAt: string
    courseId: number
    courseTitle?: string
  } | null>(null)

  // QR Code Image Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [copiedCode, setCopiedCode] = useState<boolean>(false)
  const [copiedToken, setCopiedToken] = useState<boolean>(false)
  const [isFullscreenQR, setIsFullscreenQR] = useState<boolean>(false)
  const [showEncryptedDetails, setShowEncryptedDetails] = useState<boolean>(false)

  // Countdown Timer State
  const [timeLeft, setTimeLeft] = useState<string>("15:00")
  const [isExpired, setIsExpired] = useState<boolean>(false)

  // Live Checkins List
  const [liveCheckins, setLiveCheckins] = useState<AttendanceRecordItem["checkins"]>([])
  const [refreshingCheckins, setRefreshingCheckins] = useState<boolean>(false)

  // Sync initialCourseId if prop changes
  useEffect(() => {
    if (initialCourseId) {
      setSelectedCourseId(initialCourseId)
    } else if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id)
    }
  }, [initialCourseId, courses])

  // Set default current time on mount (15 minutes duration)
  useEffect(() => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, "0")
    const minutes = String(now.getMinutes()).padStart(2, "0")
    setStartTime(`${hours}:${minutes}`)

    const end = new Date(now.getTime() + 15 * 60 * 1000)
    const endH = String(end.getHours()).padStart(2, "0")
    const endM = String(end.getMinutes()).padStart(2, "0")
    setEndTime(`${endH}:${endM}`)
  }, [])

  // Live countdown timer for active session
  useEffect(() => {
    if (!generatedSession) {
      setTimeLeft("15:00")
      setIsExpired(false)
      return
    }

    const calculateTimer = () => {
      const expTime = new Date(generatedSession.expiresAt).getTime()
      const diff = expTime - Date.now()
      if (diff <= 0) {
        setTimeLeft("00:00 (Selesai)")
        setIsExpired(true)
        return
      }
      const m = Math.floor(diff / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`)
      setIsExpired(false)
    }

    calculateTimer()
    const timerInterval = setInterval(calculateTimer, 1000)
    return () => clearInterval(timerInterval)
  }, [generatedSession])

  // Auto-generate title when course or date changes if title is empty/default
  useEffect(() => {
    const course = courses.find((c) => c.id === selectedCourseId)
    const courseName = course ? course.title : "Perkuliahan"
    const dateStr = selectedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })
    setTitle(`Presensi Kelas - ${courseName} (${dateStr})`)
  }, [selectedCourseId, selectedDate, courses])

  // Handle Preset Duration Click
  const handleSelectPreset = (mins: number) => {
    setDurationMinutes(mins)
    // Update endTime relative to startTime
    const [h, m] = startTime.split(":").map(Number)
    if (!isNaN(h) && !isNaN(m)) {
      const d = new Date()
      d.setHours(h, m, 0, 0)
      const newEnd = new Date(d.getTime() + mins * 60 * 1000)
      setEndTime(
        `${String(newEnd.getHours()).padStart(2, "0")}:${String(newEnd.getMinutes()).padStart(2, "0")}`
      )
    }
  }

  // Generate QR Code whenever generatedSession changes (includes encrypted token payload)
  useEffect(() => {
    if (!generatedSession) {
      setQrDataUrl("")
      return
    }

    const origin = typeof window !== "undefined" ? window.location.origin : ""
    // Secure URL embedding the AES-256-GCM encrypted token
    const tokenParam = generatedSession.encryptedToken
      ? `token=${encodeURIComponent(generatedSession.encryptedToken)}`
      : `code=${encodeURIComponent(generatedSession.code)}`
    const checkInUrl = `${origin}/attendance/${generatedSession.courseId}?${tokenParam}`

    QRCode.toDataURL(checkInUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: "#18181b",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error("Error generating QR:", err))
  }, [generatedSession])

  // Live polling for student check-ins when session is active
  useEffect(() => {
    if (!generatedSession) return

    let isMounted = true
    const checkLiveRecords = async () => {
      try {
        const records = await fetchAttendanceRecords(generatedSession.courseId)
        const match = records.find((r) => r.code === generatedSession.code)
        if (match && isMounted) {
          setLiveCheckins(match.checkins || [])
        }
      } catch (_e) {
        // silent fallback
      }
    }

    checkLiveRecords()
    const timer = setInterval(checkLiveRecords, 5000)
    return () => {
      isMounted = false
      clearInterval(timer)
    }
  }, [generatedSession])

  // Calendar Grid Calculations
  const monthInfo = useMemo(() => {
    const year = currentCalendarDate.getFullYear()
    const month = currentCalendarDate.getMonth()
    const firstDayIndex = new Date(year, month, 1).getDay() // 0 = Sun
    const adjustedFirstDay = (firstDayIndex + 6) % 7 // Monday = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isSelected: boolean }[] = []

    // Previous month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: isSameDay(d, selectedDate),
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: isSameDay(d, new Date()),
        isSelected: isSameDay(d, selectedDate),
      })
    }

    // Next month padding
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: isSameDay(d, new Date()),
        isSelected: isSameDay(d, selectedDate),
      })
    }

    return { year, month, days }
  }, [currentCalendarDate, selectedDate])

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ]
  const dayLabels = ["Sn", "Sl", "Rb", "Km", "Jm", "Sb", "Mg"]

  // Form Submit Handler
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourseId) {
      setErrorMsg("Pilih mata kuliah terlebih dahulu.")
      return
    }

    setLoading(true)
    setErrorMsg("")
    try {
      const dateFormatted = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`

      const created = await createAttendanceSession({
        courseId: selectedCourseId,
        title: title.trim() || `Presensi Perkuliahan (${dateFormatted})`,
        date: dateFormatted,
        startTime,
        endTime,
        durationMinutes,
        code: customCode.trim() || undefined,
      })

      const courseObj = courses.find((c) => c.id === selectedCourseId)

      setGeneratedSession({
        id: created.id,
        title: created.title,
        code: created.code || "",
        encryptedToken: created.encryptedToken,
        expiresAt: created.expiresAt,
        courseId: selectedCourseId,
        courseTitle: courseObj?.title || created.course?.title,
      })

      if (onSessionCreated) {
        onSessionCreated(created)
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal membuat sesi presensi.")
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (!generatedSession) return
    navigator.clipboard.writeText(generatedSession.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  const handleCopyToken = () => {
    if (!generatedSession?.encryptedToken) return
    navigator.clipboard.writeText(generatedSession.encryptedToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl || !generatedSession) return
    const a = document.createElement("a")
    a.href = qrDataUrl
    a.download = `QR-Presensi-${generatedSession.code}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleManualRefreshCheckins = async () => {
    if (!generatedSession) return
    setRefreshingCheckins(true)
    try {
      const records = await fetchAttendanceRecords(generatedSession.courseId)
      const match = records.find((r) => r.code === generatedSession.code)
      if (match) {
        setLiveCheckins(match.checkins || [])
      }
    } catch (_e) {
      // silent
    } finally {
      setRefreshingCheckins(false)
    }
  }

  const handleResetModal = () => {
    setGeneratedSession(null)
    setLiveCheckins([])
    setIsFullscreenQR(false)
    setErrorMsg("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 font-heading">
                Sistem Presensi Digital &bull; QR Code
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-heading mt-0.5">
              {generatedSession ? "Sesi Presensi Aktif" : "Buka Sesi Presensi Baru"}
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
              {generatedSession
                ? "Tampilkan QR Code atau bagikan kode presensi kepada mahasiswa di kelas."
                : "Pilih tanggal perkuliahan pada kalender, tentukan kelas dan jam presensi."}
            </p>
          </div>
          <button
            onClick={handleResetModal}
            className="w-7 h-7 rounded-lg text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {!generatedSession ? (
            /* ─── Step 1: Form & Calendar Picker ─── */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* 1. Select Course */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                  Pilih Mata Kuliah / Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600"
                  required
                >
                  {courses.length === 0 ? (
                    <option value={0}>Tidak ada mata kuliah</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} &mdash; {c.title}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* 2. Interactive Calendar Picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    Pilih Tanggal Perkuliahan <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    {selectedDate.toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {/* Mini Calendar Container */}
                <div className="bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-900 dark:text-white text-xs">
                      {monthNames[monthInfo.month]} {monthInfo.year}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentCalendarDate(
                            new Date(monthInfo.year, monthInfo.month - 1, 1)
                          )
                        }
                        className="w-6 h-6 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-xs"
                      >
                        &lsaquo;
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date()
                          setCurrentCalendarDate(today)
                          setSelectedDate(today)
                        }}
                        className="px-2 h-6 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 font-medium text-[11px]"
                      >
                        Hari Ini
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentCalendarDate(
                            new Date(monthInfo.year, monthInfo.month + 1, 1)
                          )
                        }
                        className="w-6 h-6 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 flex items-center justify-center font-bold text-xs"
                      >
                        &rsaquo;
                      </button>
                    </div>
                  </div>

                  {/* Day Names */}
                  <div className="grid grid-cols-7 text-center font-semibold text-[10px] text-zinc-400 dark:text-zinc-300 py-1">
                    {dayLabels.map((lbl) => (
                      <div key={lbl}>{lbl}</div>
                    ))}
                  </div>

                  {/* Day Cells */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {monthInfo.days.map((dObj, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDate(dObj.date)}
                        className={`h-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                          dObj.isSelected
                            ? "bg-brand-600 text-white shadow-xs font-bold"
                            : dObj.isToday
                            ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 font-bold"
                            : dObj.isCurrentMonth
                            ? "text-zinc-800 dark:text-zinc-100 hover:bg-white dark:hover:bg-zinc-700"
                            : "text-zinc-300 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {dObj.date.getDate()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Time Window (Jam Mulai & Jam Selesai) */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Jam Mulai Kelas <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Jam Selesai Presensi <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                      required
                    />
                  </div>
                </div>

                {/* Duration Presets */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300 font-medium mr-1">
                    Preset Durasi:
                  </span>
                  {[15, 30, 45, 60, 90].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => handleSelectPreset(mins)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                        durationMinutes === mins
                          ? "bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-bold shadow-2xs"
                          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                      }`}
                    >
                      {mins === 15 ? "15 Menit (Default)" : mins < 60 ? `${mins} Menit` : `${mins / 60} Jam`}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Session Title & Custom Code */}
              <div className="space-y-3 pt-1">
                <div className="space-y-1">
                  <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                    Judul Pertemuan / Sesi Presensi
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Pertemuan 4 - Database Architecture"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
                      Kode Token Kustom (Opsional)
                    </label>
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-300">Opsional</span>
                  </div>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: HADIR1 (Kosongkan untuk kode otomatis)"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white uppercase font-mono bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                    Jika dikosongkan, kode unik 6 karakter (contoh: <code>A9B3E2</code>) akan dibuat otomatis.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading || courses.length === 0}
                  className="btn-primary text-xs py-2 px-4 rounded-xl font-medium shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Membuat Presensi...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                      <span>Generate QR & Kode Presensi</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* ─── Step 2: Generated QR & Token Display ─── */
            <div className="space-y-5 animate-in fade-in">
              {/* Session Meta Banner */}
              <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
                      {generatedSession.courseTitle}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                      <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                      <span>Terenkripsi AES-256-GCM</span>
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white mt-0.5">
                    {generatedSession.title}
                  </h3>
                  <div className="text-xs text-zinc-500 dark:text-zinc-200 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      Berakhir pada:{" "}
                      <strong className="text-zinc-800 dark:text-white">
                        {new Date(generatedSession.expiresAt).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        WIB
                      </strong>
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-500">&bull;</span>
                    <span className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      isExpired
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-brand-50 text-brand-700 border border-brand-200"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isExpired ? "bg-rose-500" : "bg-brand-600 animate-pulse"}`}></span>
                      <span>Sisa: {timeLeft}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setIsFullscreenQR(true)}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
                    title="Buka tampilan layar penuh untuk proyektor kelas"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    <span>Layar Penuh Proyektor</span>
                  </button>
                </div>
              </div>

              {/* Main Code & QR Showcase Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                {/* QR Code Container */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 flex flex-col items-center justify-between space-y-3 shadow-xs">
                  <div className="text-center space-y-0.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider block">
                      QR Code Mahasiswa
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Memuat Token Terenkripsi
                    </span>
                  </div>

                  <div className="relative p-2 bg-white keep-white rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-2xs">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt="QR Code Presensi"
                        className="w-48 h-48 object-contain rounded-lg"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                        Membuat QR...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center w-full">
                    <button
                      onClick={handleDownloadQR}
                      className="text-[11px] font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Unduh Gambar QR</span>
                    </button>
                  </div>
                </div>

                {/* Token Code Display Container */}
                <div className="bg-zinc-50/80 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
                      Kode Token Presensi
                    </span>
                    <p className="text-xs text-zinc-500 dark:text-zinc-200">
                      Mahasiswa dapat memasukkan kode 6 karakter ini secara manual di menu presensi.
                    </p>
                  </div>

                  {/* Huge Code Display */}
                  <div className="p-4 bg-white dark:bg-zinc-900 border-2 border-brand-200 dark:border-brand-800 rounded-xl text-center space-y-2 shadow-2xs">
                    <div className="text-3xl sm:text-4xl font-mono font-black text-brand-700 dark:text-brand-300 tracking-widest selection:bg-brand-100">
                      {generatedSession.code}
                    </div>
                    <button
                      onClick={handleCopyCode}
                      className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-brand-600 dark:hover:text-brand-300 inline-flex items-center gap-1 transition-colors"
                    >
                      {copiedCode ? (
                        <span className="text-emerald-600 dark:text-emerald-300 font-bold">✓ Berhasil Tersalin!</span>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          <span>Salin Kode Token</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Encrypted Token Details Toggle */}
                  {generatedSession.encryptedToken && (
                    <div className="space-y-1.5 pt-1 border-t border-zinc-200/70 dark:border-zinc-700">
                      <button
                        type="button"
                        onClick={() => setShowEncryptedDetails(!showEncryptedDetails)}
                        className="text-[11px] text-zinc-500 dark:text-zinc-300 hover:text-brand-700 dark:hover:text-brand-300 font-medium inline-flex items-center gap-1"
                      >
                        <span>{showEncryptedDetails ? "▾ Sembunyikan Payload Enkripsi" : "▸ Lihat Token Kriptografi Terenkripsi"}</span>
                      </button>

                      {showEncryptedDetails && (
                        <div className="p-2.5 bg-zinc-100/90 dark:bg-zinc-850 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-1.5 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-300">
                            <span>AES-256-GCM Token:</span>
                            <button
                              type="button"
                              onClick={handleCopyToken}
                              className="text-brand-600 dark:text-brand-300 hover:underline font-bold"
                            >
                              {copiedToken ? "Tersalin!" : "Salin Token"}
                            </button>
                          </div>
                          <p className="font-mono text-[10px] text-zinc-600 dark:text-zinc-200 break-all bg-white dark:bg-zinc-900 p-1.5 rounded border border-zinc-200 dark:border-zinc-700 select-all max-h-16 overflow-y-auto">
                            {generatedSession.encryptedToken}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-[11px] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                    <span>Sesi presensi aktif 15 menit & terenkripsi aman.</span>
                  </div>
                </div>
              </div>

              {/* Real-time Student Check-in Live Feed */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-white text-xs">
                      Mahasiswa Hadir ({liveCheckins.length})
                    </span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <button
                    onClick={handleManualRefreshCheckins}
                    disabled={refreshingCheckins}
                    className="text-[11px] text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white font-medium inline-flex items-center gap-1"
                  >
                    {refreshingCheckins ? "Memperbarui..." : "Perbarui Daftar"}
                  </button>
                </div>

                {liveCheckins.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-400 dark:text-zinc-300">
                    Belum ada mahasiswa yang melakukan check-in pada sesi ini.
                  </div>
                ) : (
                  <div className="max-h-48 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
                    {liveCheckins.map((chk, i) => (
                      <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                        <div className="font-medium text-zinc-800 dark:text-zinc-100">{chk.name}</div>
                        <div className="text-[11px] text-zinc-400 dark:text-zinc-300">
                          {new Date(chk.checkedInAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setGeneratedSession(null)}
                  className="text-xs font-medium text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white"
                >
                  &larr; Buat Sesi Presensi Lainnya
                </button>
                <button
                  type="button"
                  onClick={handleResetModal}
                  className="btn-primary text-xs py-2 px-4 rounded-xl font-medium shadow-2xs"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Fullscreen Projector Modal Mode ─── */}
      {isFullscreenQR && generatedSession && (
        <div
          className="fixed inset-0 z-60 bg-white dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200"
          onClick={() => setIsFullscreenQR(false)}
        >
          <button
            onClick={() => setIsFullscreenQR(false)}
            className="absolute top-6 right-6 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white rounded-xl text-xs font-bold transition-all"
          >
            ✕ Tutup Layar Penuh (ESC)
          </button>

          <div className="max-w-xl w-full space-y-5" onClick={(e) => e.stopPropagation()}>
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-brand-600 dark:text-brand-300">
                  {generatedSession.courseTitle}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                  AES-256-GCM Encrypted
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white font-heading">
                {generatedSession.title}
              </h1>
              <div className="flex items-center justify-center gap-3 pt-1">
                <span className={`inline-flex items-center gap-1.5 font-mono font-bold text-sm px-3 py-1 rounded-full ${
                  isExpired
                    ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs"
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isExpired ? "bg-rose-500" : "bg-brand-600 animate-pulse"}`}></span>
                  <span>Sisa Waktu: {timeLeft}</span>
                </span>
              </div>
            </div>

            {/* Giant QR */}
            <div className="flex justify-center">
              <div className="p-4 bg-white keep-white rounded-3xl border-2 border-zinc-200 dark:border-zinc-700 shadow-xl inline-block">
                {qrDataUrl && (
                  <img
                    src={qrDataUrl}
                    alt="QR Code Presensi"
                    className="w-64 h-64 sm:w-80 sm:h-80 object-contain"
                  />
                )}
              </div>
            </div>

            {/* Giant Code */}
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider">
                Kode Token Presensi
              </span>
              <div className="text-5xl sm:text-6xl font-mono font-black text-brand-700 dark:text-brand-300 tracking-widest">
                {generatedSession.code}
              </div>
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-200 flex items-center justify-center gap-4">
              <span>
                Total Mahasiswa Hadir:{" "}
                <strong className="text-zinc-900 dark:text-white font-bold">{liveCheckins.length} orang</strong>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  )
}
