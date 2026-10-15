"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  fetchCourses,
  Course,
  enrollCourse,
  createCourse,
  updateCourse,
  checkCourseCode,
} from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { EmptyState } from "@/components/ui/EmptyState"
import { AttendanceModal } from "@/components/attendance/AttendanceModal"

type FilterTab = "all" | "inprogress" | "past"

export default function CoursesPage() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterTab>("all")
  const [search, setSearch] = useState("")
  
  // Student enrollment state
  const [enrollCode, setEnrollCode] = useState("")
  const [enrollMsg, setEnrollMsg] = useState("")
  const [enrolling, setEnrolling] = useState(false)

  // Teacher create / edit course state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [newCode, setNewCode] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [codeStatus, setCodeStatus] = useState<{
    checking: boolean
    available?: boolean
    message?: string
  } | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Teacher attendance modal state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [attendanceModalCourseId, setAttendanceModalCourseId] = useState<number | undefined>(undefined)

  const loadCourses = () => {
    fetchCourses()
      .then(setCourses)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCourses()
  }, [])

  // Live real-time check for course code availability
  useEffect(() => {
    const trimmed = newCode.trim().toUpperCase()
    if (!trimmed) {
      setCodeStatus(null)
      return
    }

    if (trimmed.length < 2) {
      setCodeStatus({ checking: false, available: false, message: "Kode kelas minimal 2 karakter" })
      return
    }

    // If editing and code hasn't changed, it's valid
    if (editingCourse && trimmed === editingCourse.code.toUpperCase()) {
      setCodeStatus({ checking: false, available: true, message: "Kode kelas saat ini (milik kelas ini)" })
      return
    }

    setCodeStatus({ checking: true })
    const timeout = setTimeout(async () => {
      try {
        const res = await checkCourseCode(trimmed, editingCourse?.id)
        setCodeStatus({
          checking: false,
          available: res.available,
          message: res.available
            ? `Kode kelas '${trimmed}' tersedia`
            : `Kode kelas '${trimmed}' sudah digunakan. Silakan ganti kode lain.`,
        })
      } catch {
        setCodeStatus(null)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [newCode, editingCourse])

  const generateRandomCode = () => {
    const random = "CRS" + Math.random().toString(36).substring(2, 8).toUpperCase()
    setNewCode(random)
  }

  const openCreateModal = () => {
    setEditingCourse(null)
    setNewTitle("")
    setNewCode("")
    setNewDescription("")
    setCreateError("")
    setCodeStatus(null)
    setShowCreateModal(true)
  }

  const openEditModal = (course: Course) => {
    setEditingCourse(course)
    setNewTitle(course.title)
    setNewCode(course.code)
    setNewDescription(course.description || "")
    setCreateError("")
    setCodeStatus({ checking: false, available: true, message: "Kode kelas saat ini" })
    setShowCreateModal(true)
  }

  const handleEnroll = async () => {
    if (!enrollCode.trim() || enrolling) return
    setEnrolling(true)
    setEnrollMsg("")
    try {
      const res = await enrollCourse(enrollCode.trim())
      setEnrollMsg(res.message)
      loadCourses()
      setEnrollCode("")
    } catch (err: any) {
      setEnrollMsg(err.response?.data?.error || "Gagal bergabung ke kelas.")
    } finally {
      setEnrolling(false)
    }
  }

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || creating) return

    if (codeStatus?.available === false) {
      setCreateError(codeStatus.message || "Kode kelas sudah digunakan. Silakan ganti kode lain.")
      return
    }

    setCreating(true)
    setCreateError("")
    try {
      if (editingCourse) {
        const updated = await updateCourse(editingCourse.id, {
          title: newTitle.trim(),
          code: newCode.trim() || undefined,
          description: newDescription.trim() || undefined,
        })
        setCourses((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
        setNotification({
          type: "success",
          message: `Kelas "${updated.title}" (Kode: ${updated.code}) berhasil diperbarui!`,
        })
      } else {
        const created = await createCourse({
          title: newTitle.trim(),
          code: newCode.trim() || undefined,
          description: newDescription.trim() || undefined,
        })
        setCourses((prev) => [created, ...prev])
        setNotification({
          type: "success",
          message: `Mata kuliah "${created.title}" (Kode: ${created.code}) berhasil ditambahkan!`,
        })
      }

      setNewTitle("")
      setNewCode("")
      setNewDescription("")
      setEditingCourse(null)
      setShowCreateModal(false)
      loadCourses()
    } catch (err: any) {
      setCreateError(err.response?.data?.error || "Gagal menyimpan kelas.")
      if (err.response?.data?.codeTaken) {
        setCodeStatus({
          checking: false,
          available: false,
          message: err.response?.data?.error,
        })
      }
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filtered = courses.filter((c) => {
    if (search) {
      const q = search.toLowerCase()
      if (!c.title.toLowerCase().includes(q) && !c.code.toLowerCase().includes(q)) return false
    }
    if (filter === "inprogress") return (c.progressPct ?? 0) < 100
    if (filter === "past") return (c.progressPct ?? 0) >= 100
    return true
  })

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-200 uppercase tracking-wider">
            Katalog Akademik · Semester Ganjil 2024/2025
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-0.5 tracking-tight">
            Mata Kuliah & Silabus Perkuliahan
          </h1>
        </div>

        {/* Action button based on role */}
        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          {user?.role === "TEACHER" ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAttendanceModalCourseId(undefined)
                  setShowAttendanceModal(true)
                }}
                className="text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold bg-zinc-900 dark:bg-zinc-800 text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 dark:border dark:border-zinc-700 transition-colors shadow-2xs whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Buka Presensi</span>
              </button>
              <button
                onClick={openCreateModal}
                className="btn-primary text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 font-semibold shadow-2xs whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Kelas Baru</span>
              </button>
            </div>
          ) : user?.role === "STUDENT" ? (
            <div className="flex items-center gap-2 max-w-sm w-full sm:w-auto">
              <input
                type="text"
                placeholder="Kode Kelas (cth: DB201)"
                value={enrollCode}
                onChange={(e) => setEnrollCode(e.target.value)}
                className="px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 w-full focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white dark:bg-zinc-800 shadow-2xs"
              />
              <button
                onClick={handleEnroll}
                disabled={enrolling || !enrollCode.trim()}
                className="btn-primary text-xs sm:text-sm py-2 px-4 rounded-lg flex-shrink-0 disabled:opacity-50"
              >
                {enrolling ? "..." : "Gabung"}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Global Notifications */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium flex items-center justify-between gap-2 animate-in fade-in ${
            notification.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white text-xs font-bold px-1.5 py-0.5 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50"
          >
            ✕
          </button>
        </div>
      )}

      {enrollMsg && (
        <div
          className={`p-3.5 rounded-lg text-xs font-medium ${
            enrollMsg.includes("berhasil") || enrollMsg.includes("Already")
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800"
          }`}
        >
          {enrollMsg}
        </div>
      )}

      {/* ─── Search & Filters ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex gap-1 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 bg-zinc-100/80 dark:bg-zinc-800 w-full sm:w-auto">
          {[
            { key: "all" as const, label: "Semua Kelas" },
            { key: "inprogress" as const, label: "Sedang Berjalan" },
            { key: "past" as const, label: "Selesai" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                filter === t.key
                  ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-bold"
                  : "text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari mata kuliah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 bg-white dark:bg-zinc-900 shadow-2xs transition-colors"
          />
          <svg className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* ─── Courses Grid ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3 shadow-down-container">
          <h3 className="font-semibold text-zinc-900 dark:text-white text-sm font-heading">
            {search ? "Tidak Ada Hasil Pencarian" : user?.role === "TEACHER" ? "Belum Ada Kelas yang Diampu" : "Tidak Ada Mata Kuliah"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-200 max-w-sm mx-auto leading-relaxed">
            {search
              ? "Tidak ada mata kuliah yang cocok dengan kata kunci pencarian Anda."
              : user?.role === "TEACHER"
              ? "Anda belum membuat kelas perkuliahan. Buat kelas pertama Anda sekarang untuk memulai pengajaran."
              : "Kamu belum terdaftar di kelas manapun."}
          </p>
          {user?.role === "TEACHER" && !search && (
            <button
              onClick={openCreateModal}
              className="btn-primary text-xs py-2 px-4 rounded-lg inline-flex items-center gap-1.5 font-semibold shadow-2xs mt-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Kelas Pertama</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <div
              key={course.id}
              className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-down-card shadow-down-hover transition-all flex flex-col justify-between gap-3.5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-2 py-0.5 rounded-md">
                      {course.code}
                    </span>
                    {user?.role === "TEACHER" && (
                      <button
                        type="button"
                        aria-label="Salin Kode Kelas"
                        title="Salin Kode Kelas"
                        onClick={() => handleCopyCode(course.code)}
                        className="text-zinc-400 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-300 transition-colors p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                      >
                        {copiedCode === course.code ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">Tersalin!</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                  <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">
                    {course._count?.modules || 0} Modul
                  </span>
                </div>

                <Link
                  href={`/courses/${course.id}`}
                  className="mt-2.5 block group/title focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                >
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover/title:text-brand-600 dark:group-hover/title:text-brand-300 transition-colors line-clamp-1 font-heading">
                    {course.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-200 line-clamp-2 mt-1 leading-relaxed">
                    {course.description || "Silabus materi perkuliahan semester aktif."}
                  </p>
                </Link>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                {user?.role === "STUDENT" && course.progressPct !== undefined && course.progressPct !== null ? (
                  <ProgressBar value={course.progressPct} size="sm" showLabel label="Penyelesaian" />
                ) : null}
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-200">
                  <span>{course._count?.enrollments || 0} Mahasiswa</span>
                  <div className="flex items-center gap-2">
                    {user?.role === "TEACHER" && (
                      <>
                        <button
                          type="button"
                          title="Edit Kelas ini"
                          onClick={() => openEditModal(course)}
                          className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          title="Buka Sesi Presensi untuk Kelas ini"
                          onClick={() => {
                            setAttendanceModalCourseId(course.id)
                            setShowAttendanceModal(true)
                          }}
                          className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                        >
                          Presensi
                        </button>
                      </>
                    )}
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
          ))}
        </div>
      )}

      {/* ─── Modal Tambah Kelas Baru (Khusus Dosen) ──────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-850">
              <div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {editingCourse ? "Edit Informasi Kelas" : "Tambah Kelas Baru"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
                  {editingCourse
                    ? "Perbarui judul, kode kelas, atau deskripsi mata kuliah ini."
                    : "Buat ruang kelas baru untuk membagikan materi, tugas, dan kuis."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false)
                  setEditingCourse(null)
                }}
                className="w-7 h-7 rounded-lg text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 flex items-center justify-center transition-colors shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCourse} className="p-5 space-y-4 text-xs">
              {createError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-lg text-xs font-medium">
                  {createError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block font-semibold text-zinc-700 dark:text-zinc-200 text-xs">
                  Nama Mata Kuliah / Kelas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pemrograman Web Lanjut"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 bg-white dark:bg-zinc-800"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-200 text-xs">
                    Kode Kelas
                  </label>
                  <div className="flex items-center gap-1.5">
                    {codeStatus?.checking ? (
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-300 flex items-center gap-1 font-medium">
                        <span className="w-2.5 h-2.5 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></span>
                        Memeriksa...
                      </span>
                    ) : codeStatus?.available === false ? (
                      <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        ✕ Sudah Dipakai
                      </span>
                    ) : codeStatus?.available === true && newCode.trim() ? (
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        ✓ Tersedia
                      </span>
                    ) : (
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-300">Opsional</span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Contoh: IF201 (Kosongkan untuk otomatis)"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    className={`w-full px-3 py-2 rounded-lg border text-xs text-zinc-900 dark:text-white uppercase focus:outline-none focus:ring-1 bg-white dark:bg-zinc-800 transition-colors ${
                      codeStatus?.available === false
                        ? "border-rose-400 focus:ring-rose-500 focus:border-rose-500 bg-rose-50/20"
                        : codeStatus?.available === true && newCode.trim()
                        ? "border-emerald-400 focus:ring-emerald-500 focus:border-emerald-500 bg-emerald-50/20"
                        : "border-zinc-300 dark:border-zinc-700 focus:ring-brand-600 focus:border-brand-600"
                    }`}
                  />
                  {codeStatus?.available === false && (
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      title="Ganti dengan kode acak baru"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-600 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-800 transition-colors"
                    >
                      Ganti Kode Acak
                    </button>
                  )}
                </div>

                {codeStatus?.available === false ? (
                  <div className="flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-300 font-medium pt-0.5">
                    <span>{codeStatus.message || "Kode kelas ini sudah dipakai. Anda harus mengganti dengan kode lain."}</span>
                    <button
                      type="button"
                      onClick={generateRandomCode}
                      className="underline font-bold hover:text-rose-800 dark:hover:text-rose-200 shrink-0 ml-2 cursor-pointer"
                    >
                      Buat Kode Baru
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                    Kode ini digunakan mahasiswa untuk bergabung ke kelas. Jika dikosongkan, kode unik akan dibuat otomatis (cth: CRS89AB).
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-zinc-700 dark:text-zinc-200 text-xs">
                    Deskripsi / Silabus Ringkas
                  </label>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300">Opsional</span>
                </div>
                <textarea
                  rows={3}
                  placeholder="Jelaskan ringkasan materi, capaian pembelajaran, atau pengantar perkuliahan..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 bg-white dark:bg-zinc-800 resize-none"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setEditingCourse(null)
                  }}
                  disabled={creating}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    creating ||
                    !newTitle.trim() ||
                    codeStatus?.available === false ||
                    codeStatus?.checking
                  }
                  className="btn-primary text-xs py-2 px-4 rounded-lg font-medium shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingCourse ? "Simpan Perubahan" : "Simpan & Buat Kelas"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Attendance Modal (QR & Code Generator) ──────────────────────── */}
      <AttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        courses={courses}
        initialCourseId={attendanceModalCourseId}
        onSessionCreated={(session) => {
          setNotification({
            type: "success",
            message: `Sesi presensi "${session.title}" (Kode: ${session.code}) aktif!`,
          })
        }}
      />
    </div>
  )
}

