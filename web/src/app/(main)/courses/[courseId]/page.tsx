"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  fetchCourse,
  Course,
  fetchQuizSessions,
  QuizSession,
  fetchAssignments,
  Assignment,
  submitAssignment,
  Material,
  fetchAssignmentSubmissions,
  AssignmentSubmissionsResponse,
  gradeSubmission,
  Submission,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { EmptyState } from "@/components/ui/EmptyState"
import { AttendanceModal } from "@/components/attendance/AttendanceModal"
import { CreateMaterialModal } from "@/components/course/CreateMaterialModal"
import { CreateAssignmentModal } from "@/components/course/CreateAssignmentModal"
import { CreateQuizModal } from "@/components/course/CreateQuizModal"
import { MaterialViewerModal } from "@/components/course/MaterialViewerModal"
import { AssignmentContentRenderer } from "@/components/course/AssignmentContentRenderer"
import { CourseWeeksView } from "@/components/course/CourseWeeksView"

export default function CourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")
  const { user } = useAuth()
  const [course, setCourse] = useState<Course | null>(null)
  const [quizzes, setQuizzes] = useState<QuizSession[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<
    "weeks" | "materials" | "assignments" | "quiz" | "grades" | "attendance"
  >("weeks")

  useEffect(() => {
    if (tabParam && ["weeks", "materials", "assignments", "quiz", "grades", "attendance"].includes(tabParam)) {
      setActiveTab(tabParam as "weeks" | "materials" | "assignments" | "quiz" | "grades" | "attendance")
    }
  }, [tabParam])

  // Modals state
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [createAssignmentInitialTitle, setCreateAssignmentInitialTitle] = useState("")
  const [createAssignmentInitialDesc, setCreateAssignmentInitialDesc] = useState("")
  const [showQuizModal, setShowQuizModal] = useState(false)

  // Material Viewer state
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [selectedModuleTitle, setSelectedModuleTitle] = useState<string | undefined>()

  // Student Assignment Submission state
  const [submissionInputs, setSubmissionInputs] = useState<{ [id: number]: string }>({})
  const [submissionFiles, setSubmissionFiles] = useState<{
    [id: number]: { dataUrl: string; name: string; size: string }
  }>({})
  const assignmentFileInputRefs = useRef<{ [id: number]: HTMLInputElement | null }>({})
  const [submittingId, setSubmittingId] = useState<number | null>(null)
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    [id: number]: { error?: string; success?: boolean }
  }>({})
  const [openSubmitId, setOpenSubmitId] = useState<number | null>(null)

  // Teacher View & Grade Submissions state
  const [openTeacherSubmissionsId, setOpenTeacherSubmissionsId] = useState<number | null>(null)
  const [teacherSubmissionsData, setTeacherSubmissionsData] = useState<{
    [assignmentId: number]: AssignmentSubmissionsResponse
  }>({})
  const [loadingTeacherSubmissions, setLoadingTeacherSubmissions] = useState<{
    [assignmentId: number]: boolean
  }>({})
  const [submissionFilter, setSubmissionFilter] = useState<{
    [assignmentId: number]: "all" | "unscored" | "graded" | "unsubmitted"
  }>({})
  const [submissionSearch, setSubmissionSearch] = useState<{ [assignmentId: number]: string }>({})

  // Teacher Grading Form State
  const [gradingSubmissionId, setGradingSubmissionId] = useState<number | null>(null)
  const [gradingScore, setGradingScore] = useState<string>("")
  const [gradingMaxScore, setGradingMaxScore] = useState<string>("100")
  const [gradingFeedback, setGradingFeedback] = useState<string>("")
  const [isSavingGrade, setIsSavingGrade] = useState<boolean>(false)
  const [gradingError, setGradingError] = useState<string | null>(null)
  const [gradingSuccessId, setGradingSuccessId] = useState<number | null>(null)

  // File Preview Modal State (for both Student and Teacher)
  const [previewFileModal, setPreviewFileModal] = useState<{
    url: string
    title: string
    studentName?: string
  } | null>(null)

  const isTeacher = user?.role === "TEACHER"
  const isStudent = user?.role === "STUDENT"

  const loadData = useCallback(() => {
    const id = parseInt(courseId)
    if (isNaN(id)) return

    return Promise.all([
      fetchCourse(id),
      fetchQuizSessions(id).catch(() => []),
      fetchAssignments(id).catch(() => []),
    ])
      .then(([c, q, a]) => {
        setCourse(c)
        setQuizzes(q)
        setAssignments(a)
      })
      .catch(() => {})
  }, [courseId])

  useEffect(() => {
    setLoading(true)
    loadData()?.finally(() => setLoading(false))
  }, [loadData])

  // Handle student assignment file selection
  const handleAssignmentFileSelect = (assignmentId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 25MB
    if (file.size > 25 * 1024 * 1024) {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [assignmentId]: { error: "Ukuran berkas maksimal adalah 25MB." },
      }))
      return
    }

    const sizeInKb = (file.size / 1024).toFixed(1)
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`

    const reader = new FileReader()
    reader.onload = () => {
      setSubmissionFiles((prev) => ({
        ...prev,
        [assignmentId]: {
          dataUrl: reader.result as string,
          name: file.name,
          size: sizeStr,
        },
      }))
      setSubmissionFeedback((prev) => ({ ...prev, [assignmentId]: {} }))
    }
    reader.onerror = () => {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [assignmentId]: { error: "Gagal membaca berkas yang dipilih." },
      }))
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveAssignmentFile = (assignmentId: number) => {
    setSubmissionFiles((prev) => {
      const next = { ...prev }
      delete next[assignmentId]
      return next
    })
    const ref = assignmentFileInputRefs.current[assignmentId]
    if (ref) ref.value = ""
  }

  // Handle student assignment submit
  const handleStudentSubmit = async (assignmentId: number) => {
    const text = submissionInputs[assignmentId]?.trim() || ""
    const file = submissionFiles[assignmentId]

    if (!text && !file) {
      setSubmissionFeedback((prev) => ({
        ...prev,
        [assignmentId]: { error: "Silakan ketik jawaban atau lampirkan berkas tugas Anda." },
      }))
      return
    }

    try {
      setSubmittingId(assignmentId)
      setSubmissionFeedback((prev) => ({ ...prev, [assignmentId]: {} }))

      await submitAssignment(assignmentId, text, file?.dataUrl)

      setSubmissionFeedback((prev) => ({
        ...prev,
        [assignmentId]: { success: true },
      }))
      setOpenSubmitId(null)
      handleRemoveAssignmentFile(assignmentId)

      // Refresh data
      loadData()
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gagal mengirimkan tugas. Coba beberapa saat lagi."
      setSubmissionFeedback((prev) => ({
        ...prev,
        [assignmentId]: { error: msg },
      }))
    } finally {
      setSubmittingId(null)
    }
  }

  // Toggle submissions view for lecturer
  const handleToggleTeacherSubmissions = async (assignmentId: number) => {
    if (openTeacherSubmissionsId === assignmentId) {
      setOpenTeacherSubmissionsId(null)
      return
    }

    setOpenTeacherSubmissionsId(assignmentId)

    // Fetch detailed submissions if not loaded or to refresh
    try {
      setLoadingTeacherSubmissions((prev) => ({ ...prev, [assignmentId]: true }))
      const data = await fetchAssignmentSubmissions(assignmentId)
      setTeacherSubmissionsData((prev) => ({ ...prev, [assignmentId]: data }))
    } catch (err) {
      console.error("Gagal memuat pengumpulan tugas:", err)
    } finally {
      setLoadingTeacherSubmissions((prev) => ({ ...prev, [assignmentId]: false }))
    }
  }

  // Open grading form for a submission
  const handleStartGrade = (sub: Submission) => {
    setGradingSubmissionId(sub.id)
    setGradingScore(sub.grade ? String(sub.grade.score) : "")
    setGradingMaxScore(sub.grade ? String(sub.grade.maxScore) : "100")
    setGradingFeedback(sub.grade?.feedback || "")
    setGradingError(null)
  }

  // Cancel grading form
  const handleCancelGrade = () => {
    setGradingSubmissionId(null)
    setGradingError(null)
  }

  // Submit grade for a submission
  const handleSubmitGrade = async (assignmentId: number, submissionId: number) => {
    const scoreVal = parseFloat(gradingScore)
    const maxScoreVal = parseFloat(gradingMaxScore) || 100

    if (isNaN(scoreVal) || scoreVal < 0) {
      setGradingError("Nilai skor harus berupa angka minimal 0.")
      return
    }

    try {
      setIsSavingGrade(true)
      setGradingError(null)

      const updatedGrade = await gradeSubmission(submissionId, {
        score: scoreVal,
        maxScore: maxScoreVal,
        feedback: gradingFeedback.trim() || undefined,
      })

      // Update in teacherSubmissionsData state
      setTeacherSubmissionsData((prev) => {
        const current = prev[assignmentId]
        if (!current) return prev
        return {
          ...prev,
          [assignmentId]: {
            ...current,
            submissions: current.submissions.map((s) =>
              s.id === submissionId ? { ...s, grade: updatedGrade } : s
            ),
          },
        }
      })

      // Show temporary success indicator
      setGradingSuccessId(submissionId)
      setTimeout(() => setGradingSuccessId(null), 3000)

      setGradingSubmissionId(null)
      loadData()
    } catch (err: any) {
      setGradingError(err.response?.data?.error || "Gagal menyimpan nilai mahasiswa.")
    } finally {
      setIsSavingGrade(false)
    }
  }

  // Safe file open in new tab using Blob to avoid Chrome blocking top-level data: URLs
  const safeOpenFile = (fileUrl: string) => {
    try {
      if (fileUrl.startsWith("data:")) {
        const arr = fileUrl.split(",")
        const mimeMatch = arr[0].match(/:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream"
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        const url = URL.createObjectURL(blob)
        window.open(url, "_blank")
        return
      }
      window.open(fileUrl, "_blank")
    } catch (e) {
      window.open(fileUrl, "_blank")
    }
  }

  // Safe file download using Blob
  const safeDownloadFile = (fileUrl: string, fileName: string) => {
    try {
      if (fileUrl.startsWith("data:")) {
        const arr = fileUrl.split(",")
        const mimeMatch = arr[0].match(/:(.*?);/)
        const mime = mimeMatch ? mimeMatch[1] : "application/octet-stream"
        const bstr = atob(arr[1])
        let n = bstr.length
        const u8arr = new Uint8Array(n)
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n)
        }
        const blob = new Blob([u8arr], { type: mime })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setTimeout(() => URL.revokeObjectURL(url), 10000)
        return
      }

      const a = document.createElement("a")
      a.href = fileUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      window.open(fileUrl, "_blank")
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-zinc-200 rounded-md"></div>
        <div className="h-64 bg-zinc-200 rounded-md"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <EmptyState
        title="Mata Kuliah Tidak Ditemukan"
        description="Mata kuliah yang kamu cari tidak tersedia atau kamu belum terdaftar."
        actionLabel="Kembali ke Katalog"
        actionHref="/courses"
      />
    )
  }

  const tabs = [
    { key: "weeks" as const, label: "RPS & Silabus 16 Minggu" },
    { key: "materials" as const, label: "Modul & Bahan Ajar" },
    { key: "assignments" as const, label: `Tugas Kuliah (${assignments.length})` },
    { key: "quiz" as const, label: `Kuis & Evaluasi (${quizzes.length})` },
    { key: "grades" as const, label: "Rekap Nilai" },
    { key: "attendance" as const, label: "Presensi" },
  ]

  // Flatten module list for selector
  const moduleOptions = (course.modules || []).map((m) => ({
    id: m.id,
    title: m.title,
  }))

  return (
    <div className="space-y-6">
      {/* ─── Course Header ───────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-down space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-200">
              <span className="font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/80 dark:border-brand-800 px-2 py-0.5 rounded text-[11px]">
                {course.code}
              </span>
              <span>16 Pertemuan Semester</span>
              <span>·</span>
              <span>{course.modules?.length || 0} Modul</span>
              <span>·</span>
              <span>{assignments.length} Tugas</span>
              <span>·</span>
              <span>{quizzes.length} Kuis</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-heading tracking-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed max-w-3xl">
                {course.description}
              </p>
            )}
          </div>

          {/* Teacher Action Buttons */}
          {isTeacher && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowMaterialModal(true)}
                className="btn-primary text-xs py-2 px-3.5 rounded-xl flex items-center gap-1.5 font-medium shadow-2xs"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Tambah Materi</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateAssignmentInitialTitle("")
                  setCreateAssignmentInitialDesc("")
                  setShowAssignmentModal(true)
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Tambah Tugas</span>
              </button>

              <button
                type="button"
                onClick={() => setShowQuizModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Buat Kuis</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAttendanceModal(true)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-2xs flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Presensi QR</span>
              </button>
            </div>
          )}
        </div>

        {/* Student Progress Bar */}
        {isStudent && course.progressPct !== undefined && course.progressPct !== null && (
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <ProgressBar
              value={course.progressPct}
              size="sm"
              showLabel
              label="Progress Penyelesaian Belajar Mahasiswa"
            />
          </div>
        )}
      </div>

      {/* ─── Underline Tab Navigation ─────────────────────────────────────── */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto gap-4 bg-transparent px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2.5 text-xs font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                : "border-transparent text-zinc-500 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Tab 0: 16-Week Academic Semester Curriculum (RPS) ─────────────── */}
      {activeTab === "weeks" && (
        <CourseWeeksView
          course={course}
          isTeacher={isTeacher}
          isStudent={isStudent}
          assignments={assignments}
          quizzes={quizzes}
          user={user}
          onOpenCreateMaterial={(_defaultModuleId, _weekTitle) => {
            setShowMaterialModal(true)
          }}
          onOpenCreateAssignment={(initialTitle, initialDescription) => {
            setCreateAssignmentInitialTitle(initialTitle || "")
            setCreateAssignmentInitialDesc(initialDescription || "")
            setShowAssignmentModal(true)
          }}
          onOpenCreateQuiz={(_initialTitle) => {
            setShowQuizModal(true)
          }}
          onOpenAttendanceModal={() => setShowAttendanceModal(true)}
          onViewMaterial={(material, moduleTitle) => {
            setSelectedMaterial(material)
            setSelectedModuleTitle(moduleTitle)
          }}
          submissionInputs={submissionInputs}
          setSubmissionInputs={setSubmissionInputs}
          submissionFiles={submissionFiles}
          handleAssignmentFileSelect={handleAssignmentFileSelect}
          handleRemoveAssignmentFile={handleRemoveAssignmentFile}
          handleStudentSubmit={handleStudentSubmit}
          submittingId={submittingId}
          submissionFeedback={submissionFeedback}
          assignmentFileInputRefs={assignmentFileInputRefs}
          openTeacherSubmissionsId={openTeacherSubmissionsId}
          handleToggleTeacherSubmissions={handleToggleTeacherSubmissions}
          teacherSubmissionsData={teacherSubmissionsData}
          loadingTeacherSubmissions={loadingTeacherSubmissions}
          submissionFilter={submissionFilter}
          setSubmissionFilter={setSubmissionFilter}
          submissionSearch={submissionSearch}
          setSubmissionSearch={setSubmissionSearch}
          gradingSubmissionId={gradingSubmissionId}
          gradingScore={gradingScore}
          setGradingScore={setGradingScore}
          gradingMaxScore={gradingMaxScore}
          setGradingMaxScore={setGradingMaxScore}
          gradingFeedback={gradingFeedback}
          setGradingFeedback={setGradingFeedback}
          isSavingGrade={isSavingGrade}
          gradingError={gradingError}
          gradingSuccessId={gradingSuccessId}
          handleStartGrade={handleStartGrade}
          handleCancelGrade={handleCancelGrade}
          handleSubmitGrade={handleSubmitGrade}
          safeOpenFile={safeOpenFile}
          safeDownloadFile={safeDownloadFile}
          setPreviewFileModal={setPreviewFileModal}
        />
      )}

      {/* ─── Tab 1: Materials (Modul & Materi) ─────────────────────────────── */}
      {activeTab === "materials" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Silabus Modul & Bahan Ajar
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                {isTeacher
                  ? "Kelola materi kuliah berformat teks, gambar, video, atau berkas pendukung."
                  : "Pelajari bahan ajar di bawah ini dan tandai selesai untuk mencatat kemajuanmu."}
              </p>
            </div>

            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowMaterialModal(true)}
                className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-medium shadow-2xs shrink-0"
              >
                <span>+ Tambah Materi</span>
              </button>
            )}
          </div>

          {!course.modules || course.modules.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">Belum Ada Modul Materi</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-md mx-auto">
                {isTeacher
                  ? "Mulai susun perkuliahan dengan menambahkan materi pertama menggunakan teks, AI, unggah gambar/file, atau tautan video."
                  : "Dosen pengampu belum menambahkan materi kuliah pada kelas ini."}
              </p>
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setShowMaterialModal(true)}
                  className="btn-primary text-xs py-2 px-4 rounded-lg inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Tambah Materi Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            course.modules.map((mod, idx) => (
              <div
                key={mod.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/90 dark:border-zinc-800 p-5 shadow-xs space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-bold text-xs flex items-center justify-center font-heading border border-zinc-200 dark:border-zinc-700">
                      {idx + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-heading">{mod.title}</h3>
                      {mod.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5">{mod.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300 font-medium shrink-0">
                    {mod.materials?.length || 0} Materi
                  </span>
                </div>

                {mod.materials && mod.materials.length > 0 ? (
                  <div className="pl-9 space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    {mod.materials.map((mat) => {
                      const badgeColor =
                        mat.type === "IMAGE"
                          ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                          : mat.type === "VIDEO"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                          : mat.type === "FILE"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800"

                      const typeLabel =
                        mat.type === "IMAGE"
                          ? "Gambar"
                          : mat.type === "VIDEO"
                          ? "Video"
                          : mat.type === "FILE"
                          ? "Berkas"
                          : "Teks"

                      return (
                        <div
                          key={mat.id}
                          onClick={() => {
                            setSelectedMaterial(mat)
                            setSelectedModuleTitle(mod.title)
                          }}
                          className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-700 hover:border-brand-300 dark:hover:border-brand-500 hover:shadow-xs transition-all flex items-center justify-between gap-3 text-xs cursor-pointer group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`font-bold text-[10px] uppercase px-2 py-0.5 rounded border ${badgeColor}`}
                            >
                              {typeLabel}
                            </span>
                            <span className="font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                              {mat.title}
                            </span>
                            {mat.fileUrl && (
                              <span className="text-[10px] text-zinc-400 dark:text-zinc-400 font-mono hidden sm:inline">
                                [Media Terlampir]
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400 font-semibold group-hover:translate-x-0.5 transition-transform shrink-0">
                            <span>Buka Materi</span>
                            <span>&rarr;</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-400 dark:text-zinc-400 pl-9 italic">
                    Belum ada bahan ajar di dalam modul ini.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ─── Tab 2: Assignments (Tugas Kuliah) ────────────────────────────── */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Daftar Tugas & Evaluasi Mahasiswa
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                {isTeacher
                  ? "Tugas yang dibuat dapat digenerate otomatis menggunakan AI atau disusun manual."
                  : "Kerjakan dan kumpulkan tugas tepat waktu sebelum batas tenggat berakhir."}
              </p>
            </div>

            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowAssignmentModal(true)}
                className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-medium shadow-2xs shrink-0"
              >
                <span>+ Buat Tugas Baru</span>
              </button>
            )}
          </div>

          {assignments.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">Belum Ada Tugas Aktif</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-md mx-auto">
                {isTeacher
                  ? "Kamu bisa menggunakan generator AI untuk membuat instruksi studi kasus dan rubrik penilaian dalam 1 klik."
                  : "Saat ini belum ada tugas yang diberikan oleh dosen pengampu."}
              </p>
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setShowAssignmentModal(true)}
                  className="text-xs py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Buat Tugas dengan AI</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {assignments.map((assignment) => {
                const deadlineDate = new Date(assignment.deadline)
                const isOverdue = new Date() > deadlineDate
                const isSubmitted = assignment.submitted
                const isOpenSubmission = openSubmitId === assignment.id
                const feedback = submissionFeedback[assignment.id]

                return (
                  <div
                    key={assignment.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/90 dark:border-zinc-800 p-5 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {isTeacher ? (
                            <>
                              {isOverdue ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Tenggat Berakhir
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Tenggat Aktif
                                </span>
                              )}
                              <span className="text-[11px] text-zinc-500 dark:text-zinc-300">
                                Batas:{" "}
                                {deadlineDate.toLocaleDateString("id-ID", {
                                   weekday: "short",
                                   day: "numeric",
                                   month: "short",
                                   year: "numeric",
                                   hour: "2-digit",
                                   minute: "2-digit",
                                 })}
                              </span>
                              <span className="text-zinc-300 dark:text-zinc-600">•</span>
                              <span className="text-[11px] font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200/60 dark:border-brand-800 px-2 py-0.5 rounded-md">
                                📥 {assignment.submissionsCount ?? assignment.submissions?.length ?? 0} dari {assignment.totalEnrolled ?? course?.enrollments?.length ?? 0} Mahasiswa Mengumpulkan
                              </span>
                            </>
                          ) : (
                            <>
                              {isSubmitted ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  Sudah Dikumpulkan ✓
                                </span>
                              ) : isOverdue ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  Tenggat Berakhir
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                  Tenggat Aktif
                                </span>
                              )}

                              <span className="text-[11px] text-zinc-500 dark:text-zinc-300">
                                Batas:{" "}
                                {deadlineDate.toLocaleDateString("id-ID", {
                                   weekday: "short",
                                   day: "numeric",
                                   month: "short",
                                   year: "numeric",
                                   hour: "2-digit",
                                   minute: "2-digit",
                                 })}
                              </span>
                            </>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                          {assignment.title}
                        </h3>
                      </div>

                      {/* Action for lecturer / teacher */}
                      {isTeacher && (
                        <button
                          type="button"
                          onClick={() => handleToggleTeacherSubmissions(assignment.id)}
                          className={`text-xs py-1.5 px-3.5 rounded-lg font-medium transition-all flex items-center gap-1.5 shadow-2xs shrink-0 self-start sm:self-auto ${
                            openTeacherSubmissionsId === assignment.id
                              ? "bg-brand-600 text-white"
                              : "bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          <span>
                            {openTeacherSubmissionsId === assignment.id
                              ? "Tutup Pengumpulan"
                              : `Lihat Tugas Mahasiswa (${assignment.submissionsCount ?? assignment.submissions?.length ?? 0})`}
                          </span>
                          <span className="text-[10px]">
                            {openTeacherSubmissionsId === assignment.id ? "▲" : "▼"}
                          </span>
                        </button>
                      )}

                      {/* Action for student */}
                      {isStudent && !isSubmitted && !isOverdue && (
                        <button
                          type="button"
                          onClick={() => setOpenSubmitId(isOpenSubmission ? null : assignment.id)}
                          className="btn-primary text-xs py-1.5 px-3.5 rounded-lg shrink-0 self-start sm:self-auto"
                        >
                          {isOpenSubmission ? "Tutup Form" : "Kumpulkan Tugas"}
                        </button>
                      )}
                    </div>

                    {assignment.description && (
                      <AssignmentContentRenderer
                        content={assignment.description}
                        assignmentTitle={assignment.title}
                      />
                    )}

                    {/* Student Submission Detail */}
                    {isStudent && isSubmitted && assignment.submission && (
                      <div className="p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/20 text-xs space-y-2.5">
                        <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-300">
                          <span>Jawaban Terkirim:</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                            {new Date(assignment.submission.submittedAt).toLocaleString("id-ID")}
                          </span>
                        </div>

                        {assignment.submission.content && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                              Catatan / Teks Jawaban:
                            </span>
                            <p className="text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap font-sans bg-white/80 dark:bg-zinc-900/80 p-2.5 rounded border border-emerald-100 dark:border-emerald-800/60 leading-relaxed">
                              {assignment.submission.content}
                            </p>
                          </div>
                        )}

                        {assignment.submission.fileUrl && (() => {
                          const isImg =
                            assignment.submission.fileUrl.startsWith("data:image/") ||
                            /\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i.test(assignment.submission.fileUrl)
                          const isPdf =
                            assignment.submission.fileUrl.startsWith("data:application/pdf") ||
                            /\.pdf($|\?)/i.test(assignment.submission.fileUrl)
                          const safeFilename = `Tugas_${assignment.title.replace(/[^a-zA-Z0-9]/g, "_")}`

                          return (
                            <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs space-y-2.5">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <span className="text-xl shrink-0">{isImg ? "🖼️" : isPdf ? "📄" : "📎"}</span>
                                  <div className="min-w-0">
                                    <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                                      {isImg ? "Berkas Gambar Tugas Terkirim" : isPdf ? "Dokumen PDF Tugas Terkirim" : "Berkas Lampiran Tugas Terkirim"}
                                    </p>
                                    <p className="text-[10px] text-zinc-400 dark:text-zinc-300">File telah tersimpan di sistem</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPreviewFileModal({
                                        url: assignment.submission!.fileUrl!,
                                        title: assignment.title,
                                        studentName: user?.name || user?.email || "Saya",
                                      })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                  >
                                    <span>👁️</span>
                                    <span>Lihat Berkas</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => safeOpenFile(assignment.submission!.fileUrl!)}
                                    className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-zinc-50 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 text-xs font-medium transition-colors cursor-pointer"
                                    title="Buka di tab browser baru"
                                  >
                                    <span>↗</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => safeDownloadFile(assignment.submission!.fileUrl!, safeFilename)}
                                    className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                                  >
                                    <span>📥 Unduh</span>
                                  </button>
                                </div>
                              </div>

                              {/* Thumbnail preview for student */}
                              {isImg && (
                                <div
                                  onClick={() =>
                                    setPreviewFileModal({
                                      url: assignment.submission!.fileUrl!,
                                      title: assignment.title,
                                      studentName: user?.name || user?.email || "Saya",
                                    })
                                  }
                                  className="relative group rounded-lg overflow-hidden border border-emerald-100 dark:border-emerald-800/60 bg-zinc-900/5 dark:bg-zinc-800 max-w-xs cursor-pointer"
                                >
                                  <img
                                    src={assignment.submission.fileUrl}
                                    alt="Preview Berkas"
                                    className="max-h-40 w-auto object-contain mx-auto rounded-lg"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-semibold">
                                    🔍 Klik untuk memperbesar
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })()}

                        {assignment.grade && (
                          <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                            <span className="font-bold text-emerald-900 dark:text-emerald-300">Nilai Dosen:</span>
                            <span className="font-bold text-sm text-brand-700 dark:text-brand-300">
                              {assignment.grade.score} / {assignment.grade.maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Student Submission Form (Accordion) */}
                    {isStudent && !isSubmitted && isOpenSubmission && (
                      <div className="p-4 rounded-xl border border-brand-200 dark:border-brand-900/60 bg-brand-50/30 dark:bg-brand-950/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-brand-900 dark:text-brand-300 font-heading">
                            Formulir Pengumpulan Jawaban
                          </h4>
                          <span className="text-[10px] text-zinc-500 dark:text-zinc-300 font-medium">
                            Ketik jawaban teks, lampirkan berkas, atau keduanya
                          </span>
                        </div>

                        {/* Text Answer Input */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block">
                            Jawaban Teks / Tautan / Catatan:
                          </label>
                          <textarea
                            rows={4}
                            value={submissionInputs[assignment.id] || ""}
                            onChange={(e) =>
                              setSubmissionInputs((prev) => ({
                                ...prev,
                                [assignment.id]: e.target.value,
                              }))
                            }
                            placeholder="Tuliskan jawaban studi kasus, ringkasan solusi, atau tautan repositori/Google Drive tugasmu di sini..."
                            className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-sans leading-relaxed"
                          />
                        </div>

                        {/* File Upload Zone */}
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block">
                            Lampiran Berkas Tugas (Dokumen, PDF, ZIP, Gambar, dsb.):
                          </label>

                          {/* Hidden File Input */}
                          <input
                            type="file"
                            ref={(el) => {
                              assignmentFileInputRefs.current[assignment.id] = el
                            }}
                            onChange={(e) => handleAssignmentFileSelect(assignment.id, e)}
                            className="hidden"
                          />

                          {submissionFiles[assignment.id] ? (
                            <div className="flex items-center justify-between p-3 rounded-xl border border-brand-300 dark:border-brand-800 bg-white dark:bg-zinc-900 shadow-2xs">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0 text-sm">
                                  📄
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                    {submissionFiles[assignment.id].name}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 dark:text-zinc-300">
                                    Ukuran: {submissionFiles[assignment.id].size}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveAssignmentFile(assignment.id)}
                                className="p-1.5 text-zinc-400 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold"
                                title="Hapus berkas terpilih"
                              >
                                ✕ Hapus
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => assignmentFileInputRefs.current[assignment.id]?.click()}
                              className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 bg-white dark:bg-zinc-800/80 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
                            >
                              <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-700 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/60 text-zinc-500 dark:text-zinc-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 flex items-center justify-center transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                              </div>
                              <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200 group-hover:text-brand-700 dark:group-hover:text-brand-300">
                                Klik untuk memilih berkas tugas dari perangkat
                              </p>
                              <p className="text-[10px] text-zinc-400 dark:text-zinc-300">
                                Mendukung format PDF, ZIP, RAR, DOCX, Dokumen teks, Kode program (Maks. 25MB)
                              </p>
                            </button>
                          )}
                        </div>

                        {feedback?.error && (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{feedback.error}</p>
                        )}

                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setOpenSubmitId(null)}
                            className="text-xs py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStudentSubmit(assignment.id)}
                            disabled={submittingId === assignment.id}
                            className="btn-primary text-xs py-1.5 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {submittingId === assignment.id ? "Mengirim..." : "Kirimkan Jawaban"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ─── Teacher: Submissions List & Grading Panel ────────────────── */}
                    {isTeacher && openTeacherSubmissionsId === assignment.id && (
                      <div className="pt-2 border-t border-zinc-200/90 space-y-4">
                        {/* Loading state */}
                        {loadingTeacherSubmissions[assignment.id] && !teacherSubmissionsData[assignment.id] ? (
                          <div className="p-8 text-center bg-zinc-50/70 rounded-xl border border-zinc-200/80 space-y-2">
                            <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs text-zinc-500 font-medium">Memuat berkas dan pengumpulan tugas mahasiswa...</p>
                          </div>
                        ) : (() => {
                          const detail = teacherSubmissionsData[assignment.id]
                          const rawSubmissions: Submission[] = detail?.submissions || assignment.submissions || []
                          const unsubmittedList = detail?.unsubmittedStudents || []
                          const totalEnrolled = detail?.totalEnrolled ?? assignment.totalEnrolled ?? (rawSubmissions.length + unsubmittedList.length)

                          const activeFilter = submissionFilter[assignment.id] || "all"
                          const searchQuery = (submissionSearch[assignment.id] || "").toLowerCase().trim()

                          const unscoredCount = rawSubmissions.filter((s) => !s.grade).length
                          const gradedCount = rawSubmissions.filter((s) => !!s.grade).length

                          // Filtered submissions
                          let displaySubmissions = rawSubmissions
                          if (activeFilter === "unscored") {
                            displaySubmissions = displaySubmissions.filter((s) => !s.grade)
                          } else if (activeFilter === "graded") {
                            displaySubmissions = displaySubmissions.filter((s) => !!s.grade)
                          }

                          if (searchQuery) {
                            displaySubmissions = displaySubmissions.filter(
                              (s) =>
                                (s.user?.name && s.user.name.toLowerCase().includes(searchQuery)) ||
                                (s.user?.email && s.user.email.toLowerCase().includes(searchQuery)) ||
                                (s.content && s.content.toLowerCase().includes(searchQuery))
                            )
                          }

                          const filteredUnsubmitted = unsubmittedList.filter(
                            (u) =>
                              !searchQuery ||
                              (u.name && u.name.toLowerCase().includes(searchQuery)) ||
                              (u.email && u.email.toLowerCase().includes(searchQuery))
                          )

                          return (
                            <div className="bg-zinc-50/60 dark:bg-zinc-900/60 p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-4">
                              {/* Header Bar */}
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                                <div>
                                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-2">
                                    <span>Pengumpulan Tugas Mahasiswa</span>
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/60 text-brand-800 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
                                      {rawSubmissions.length} Terkumpul
                                    </span>
                                  </h4>
                                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5">
                                    Periksa berkas unggahan, jawaban teks, dan berikan penilaian langsung kepada mahasiswa.
                                  </p>
                                </div>

                                {/* Quick stats pills */}
                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                                    Total Mahasiswa: <strong className="text-zinc-900 dark:text-white">{totalEnrolled}</strong>
                                  </span>
                                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
                                    Sudah Dinilai: <strong>{gradedCount}</strong>
                                  </span>
                                  <span className={`px-2.5 py-1 rounded-lg font-medium ${
                                    unscoredCount > 0
                                      ? "bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 animate-pulse"
                                      : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                                  }`}>
                                    Perlu Dinilai: <strong>{unscoredCount}</strong>
                                  </span>
                                </div>
                              </div>

                              {/* Filter & Search Controls */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                {/* Filter Tabs */}
                                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                                  <button
                                    type="button"
                                    onClick={() => setSubmissionFilter((prev) => ({ ...prev, [assignment.id]: "all" }))}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                                      activeFilter === "all"
                                        ? "bg-zinc-900 dark:bg-brand-600 text-white shadow-2xs"
                                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    Semua ({rawSubmissions.length})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSubmissionFilter((prev) => ({ ...prev, [assignment.id]: "unscored" }))}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 flex items-center gap-1.5 ${
                                      activeFilter === "unscored"
                                        ? "bg-amber-600 text-white shadow-2xs"
                                        : "bg-white dark:bg-zinc-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-amber-200 dark:border-amber-800"
                                    }`}
                                  >
                                    {unscoredCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                                    <span>Perlu Dinilai ({unscoredCount})</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSubmissionFilter((prev) => ({ ...prev, [assignment.id]: "graded" }))}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                                      activeFilter === "graded"
                                        ? "bg-emerald-700 text-white shadow-2xs"
                                        : "bg-white dark:bg-zinc-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                                    }`}
                                  >
                                    Sudah Dinilai ({gradedCount})
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setSubmissionFilter((prev) => ({ ...prev, [assignment.id]: "unsubmitted" }))}
                                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${
                                      activeFilter === "unsubmitted"
                                        ? "bg-zinc-700 dark:bg-zinc-600 text-white shadow-2xs"
                                        : "bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    Belum Mengumpulkan ({unsubmittedList.length})
                                  </button>
                                </div>

                                {/* Search Input */}
                                <div className="relative sm:w-64">
                                  <input
                                    type="text"
                                    placeholder="Cari nama / email mahasiswa..."
                                    value={submissionSearch[assignment.id] || ""}
                                    onChange={(e) =>
                                      setSubmissionSearch((prev) => ({ ...prev, [assignment.id]: e.target.value }))
                                    }
                                    className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                  />
                                  <svg
                                    className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                  </svg>
                                </div>
                              </div>

                              {/* Submissions List */}
                              {activeFilter !== "unsubmitted" ? (
                                displaySubmissions.length === 0 ? (
                                  <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                                    <p className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                                      {rawSubmissions.length === 0
                                        ? "Belum ada mahasiswa yang mengumpulkan tugas ini."
                                        : "Tidak ada data pengumpulan yang cocok dengan filter atau pencarian."}
                                    </p>
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-300">
                                      {rawSubmissions.length === 0
                                        ? "Mahasiswa di kelas ini belum mengunggah berkas atau jawaban tugas."
                                        : "Coba ubah kata kunci pencarian atau pilih tab filter lain."}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {displaySubmissions.map((sub) => {
                                      const subDate = new Date(sub.submittedAt)
                                      const isLate = subDate > deadlineDate
                                      const isGradingThis = gradingSubmissionId === sub.id
                                      const isJustGraded = gradingSuccessId === sub.id

                                      return (
                                        <div
                                          key={sub.id}
                                          className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200/90 dark:border-zinc-800 p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all hover:border-zinc-300 dark:hover:border-zinc-700"
                                        >
                                          {/* Student Info & Meta Header */}
                                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                                            <div className="flex items-center gap-3">
                                              {sub.user?.avatar ? (
                                                <img
                                                  src={sub.user.avatar}
                                                  alt={sub.user.name || "Avatar"}
                                                  className="w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                                />
                                              ) : (
                                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shrink-0 uppercase shadow-2xs">
                                                  {(sub.user?.name || sub.user?.email || "M").slice(0, 2)}
                                                </div>
                                              )}

                                              <div className="min-w-0">
                                                <h5 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                  {sub.user?.name || "Mahasiswa"}
                                                </h5>
                                                <p className="text-[11px] text-zinc-500 dark:text-zinc-300 truncate">
                                                  {sub.user?.email}
                                                </p>
                                              </div>
                                            </div>

                                            {/* Status Badges */}
                                            <div className="flex flex-wrap items-center gap-2">
                                              <span className="text-[10px] text-zinc-400 dark:text-zinc-300">
                                                {subDate.toLocaleDateString("id-ID", {
                                                  day: "numeric",
                                                  month: "short",
                                                  year: "numeric",
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                                })}
                                              </span>

                                              {isLate ? (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                  Terlambat
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                  Tepat Waktu ✓
                                                </span>
                                              )}

                                              {sub.grade ? (
                                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                  Nilai: {sub.grade.score} / {sub.grade.maxScore}
                                                </span>
                                              ) : (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                  Belum Dinilai
                                                </span>
                                              )}
                                            </div>
                                          </div>

                                          {/* Student Submitted Answer / Text */}
                                          {sub.content && (
                                            <div className="space-y-1">
                                              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                                                Catatan / Jawaban Teks Mahasiswa:
                                              </span>
                                              <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap font-sans leading-relaxed">
                                                {sub.content}
                                              </div>
                                            </div>
                                          )}

                                          {/* Student Attached File */}
                                          {sub.fileUrl && (() => {
                                            const isImg =
                                              sub.fileUrl.startsWith("data:image/") ||
                                              /\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i.test(sub.fileUrl)
                                            const isPdf =
                                              sub.fileUrl.startsWith("data:application/pdf") ||
                                              /\.pdf($|\?)/i.test(sub.fileUrl)
                                            const studentDisplayName = sub.user?.name || sub.user?.email || "Mahasiswa"
                                            const defaultFileName = `Tugas_${assignment.title.replace(/[^a-zA-Z0-9]/g, "_")}_${studentDisplayName.replace(/[^a-zA-Z0-9]/g, "_")}`

                                            return (
                                              <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 p-3.5 space-y-3 shadow-2xs">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-base shrink-0">
                                                      {isImg ? "🖼️" : isPdf ? "📄" : "📎"}
                                                    </div>
                                                    <div className="min-w-0">
                                                      <h6 className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                        {isImg ? "Berkas Gambar Tugas Mahasiswa" : isPdf ? "Dokumen PDF Tugas Mahasiswa" : "Berkas Lampiran Tugas Mahasiswa"}
                                                      </h6>
                                                      <p className="text-[10px] text-zinc-500 dark:text-zinc-300">
                                                        {isImg ? "Gambar dapat diperiksa langsung di bawah" : isPdf ? "Dokumen PDF siap dipratinjau & diunduh" : "Berkas lampiran siap diunduh"}
                                                      </p>
                                                    </div>
                                                  </div>

                                                  {/* Action Buttons */}
                                                  <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        setPreviewFileModal({
                                                          url: sub.fileUrl!,
                                                          title: assignment.title,
                                                          studentName: studentDisplayName,
                                                        })
                                                      }
                                                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                      <span>👁️</span>
                                                      <span>Lihat Berkas</span>
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() => safeOpenFile(sub.fileUrl!)}
                                                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white text-xs font-medium transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                                                      title="Buka di Tab Baru"
                                                    >
                                                      <span>↗</span>
                                                    </button>

                                                    <button
                                                      type="button"
                                                      onClick={() => safeDownloadFile(sub.fileUrl!, defaultFileName)}
                                                      className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                      <span>📥</span>
                                                      <span>Unduh</span>
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Live Image Preview Thumbnail right on card */}
                                                {isImg && (
                                                  <div
                                                    onClick={() =>
                                                      setPreviewFileModal({
                                                        url: sub.fileUrl!,
                                                        title: assignment.title,
                                                        studentName: studentDisplayName,
                                                      })
                                                    }
                                                    className="relative group rounded-lg overflow-hidden border border-blue-200 dark:border-blue-900/60 bg-white dark:bg-zinc-800 max-w-sm cursor-pointer shadow-xs"
                                                  >
                                                    <img
                                                      src={sub.fileUrl}
                                                      alt="Preview Berkas Tugas Mahasiswa"
                                                      className="max-h-52 w-auto object-contain mx-auto rounded-lg"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-semibold text-xs">
                                                      <span>🔍 Klik untuk melihat layar penuh</span>
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            )
                                          })()}

                                          {/* Grading Status / Feedback */}
                                          {sub.grade && !isGradingThis && (
                                            <div className="p-3 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-1 text-xs">
                                              <div className="flex items-center justify-between">
                                                <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                                                  <span>✓ Telah Dinilai:</span>
                                                  <strong className="text-brand-700 dark:text-brand-300 text-sm">
                                                    {sub.grade.score} / {sub.grade.maxScore}
                                                  </strong>
                                                </span>
                                                {sub.grade.date && (
                                                  <span className="text-[10px] text-zinc-400 dark:text-zinc-300">
                                                    Dinilai: {new Date(sub.grade.date).toLocaleString("id-ID")}
                                                  </span>
                                                )}
                                              </div>
                                              {sub.grade.feedback && (
                                                <p className="text-zinc-700 dark:text-zinc-200 text-[11px] pt-1 italic">
                                                  Masukan Dosen: &ldquo;{sub.grade.feedback}&rdquo;
                                                </p>
                                              )}
                                            </div>
                                          )}

                                          {/* Success Alert */}
                                          {isJustGraded && (
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                                              <span>✓</span>
                                              <span>Nilai berhasil disimpan dan diperbarui!</span>
                                            </div>
                                          )}

                                          {/* Inline Grading Form */}
                                          {isGradingThis ? (
                                            <div className="p-4 rounded-xl border border-brand-300 dark:border-brand-900/60 bg-brand-50/30 dark:bg-brand-950/20 space-y-3">
                                              <div className="flex items-center justify-between">
                                                <h6 className="text-xs font-bold text-brand-900 dark:text-brand-300 font-heading">
                                                  Penilaian Tugas Mahasiswa: {sub.user?.name || sub.user?.email}
                                                </h6>
                                                <span className="text-[10px] text-zinc-500 dark:text-zinc-300 font-medium">
                                                  Input skor dan evaluasi
                                                </span>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block">
                                                    Nilai / Skor Mahasiswa:
                                                  </label>
                                                  <input
                                                    type="number"
                                                    min={0}
                                                    max={parseFloat(gradingMaxScore) || 100}
                                                    value={gradingScore}
                                                    onChange={(e) => setGradingScore(e.target.value)}
                                                    placeholder="Misal: 85"
                                                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500 font-bold"
                                                  />
                                                </div>
                                                <div className="space-y-1">
                                                  <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block">
                                                    Skor Maksimum:
                                                  </label>
                                                  <input
                                                    type="number"
                                                    min={1}
                                                    value={gradingMaxScore}
                                                    onChange={(e) => setGradingMaxScore(e.target.value)}
                                                    placeholder="100"
                                                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                                  />
                                                </div>
                                              </div>

                                              <div className="space-y-1">
                                                <label className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-200 block">
                                                  Catatan & Masukan Evaluasi Dosen (Opsional):
                                                </label>
                                                <textarea
                                                  rows={2}
                                                  value={gradingFeedback}
                                                  onChange={(e) => setGradingFeedback(e.target.value)}
                                                  placeholder="Berikan masukan konstruktif untuk mahasiswa..."
                                                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                                                />
                                              </div>

                                              {gradingError && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{gradingError}</p>
                                              )}

                                              <div className="flex justify-end gap-2 pt-1">
                                                <button
                                                  type="button"
                                                  onClick={handleCancelGrade}
                                                  className="text-xs py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                                                >
                                                  Batal
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSubmitGrade(assignment.id, sub.id)}
                                                  disabled={isSavingGrade}
                                                  className="btn-primary text-xs py-1.5 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center gap-1.5"
                                                >
                                                  {isSavingGrade ? "Menyimpan Nilai..." : "Simpan Nilai"}
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex justify-end pt-1">
                                              <button
                                                type="button"
                                                onClick={() => handleStartGrade(sub)}
                                                className="text-xs py-1.5 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-brand-300 dark:hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-950/60 text-brand-700 dark:text-brand-300 bg-white dark:bg-zinc-800 font-semibold transition-colors flex items-center gap-1.5"
                                              >
                                                <span>✏️</span>
                                                <span>{sub.grade ? "Ubah Nilai / Masukan" : "Beri Nilai & Masukan"}</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      )
                                    })}
                                  </div>
                                )
                              ) : (
                                /* Unsubmitted Students List */
                                filteredUnsubmitted.length === 0 ? (
                                  <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                                      🎉 Luar biasa! Semua mahasiswa telah mengumpulkan tugas ini.
                                    </p>
                                    <p className="text-[11px] text-zinc-400 dark:text-zinc-300">
                                      Tidak ada mahasiswa terdaftar yang belum mengumpulkan.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">
                                      Menampilkan {filteredUnsubmitted.length} mahasiswa yang belum mengumpulkan tugas:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                      {filteredUnsubmitted.map((student) => (
                                        <div
                                          key={student.id}
                                          className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xs"
                                        >
                                          <div className="flex items-center gap-2.5 min-w-0">
                                            {student.avatar ? (
                                              <img
                                                src={student.avatar}
                                                alt={student.name || "Avatar"}
                                                className="w-7 h-7 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shrink-0"
                                              />
                                            ) : (
                                              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-[10px] flex items-center justify-center shrink-0 uppercase">
                                                {(student.name || student.email || "M").slice(0, 2)}
                                              </div>
                                            )}
                                            <div className="min-w-0">
                                              <p className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                                                {student.name || "Mahasiswa"}
                                              </p>
                                              <p className="text-[10px] text-zinc-400 dark:text-zinc-300 truncate">
                                                {student.email}
                                              </p>
                                            </div>
                                          </div>

                                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 shrink-0">
                                            Belum Dikirim
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 3: Quiz (Kuis Asesmen) ──────────────────────────────────── */}
      {activeTab === "quiz" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Kuis & Uji Pemahaman Kelas
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                {isTeacher
                  ? "Buat sesi asesmen baru dengan soal pilihan ganda melalui bantuan AI atau ketik manual."
                  : "Uji pemahaman materi dan raih skor tertinggi di papan peringkat kelas."}
              </p>
            </div>

            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowQuizModal(true)}
                className="btn-primary text-xs py-1.5 px-3 rounded-lg flex items-center gap-1 font-medium shadow-2xs shrink-0"
              >
                <span>+ Buat Kuis Baru</span>
              </button>
            )}
          </div>

          {quizzes.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">Belum Ada Kuis Aktif</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-md mx-auto">
                {isTeacher
                  ? "Gunakan generator AI untuk membuat kuis berbobot sesuai topik mata kuliah secara instan."
                  : "Belum ada sesi kuis yang dijadwalkan untuk mata kuliah ini."}
              </p>
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => setShowQuizModal(true)}
                  className="text-xs py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Buat Kuis Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quizzes.map((quiz) => (
                <Link
                  key={quiz.id}
                  href={`/quiz/${quiz.id}`}
                  className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-down hover:shadow-down-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-3 group"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-400 dark:text-zinc-300">
                        {quiz._count?.quizQuestions || quiz.quizQuestions?.length || 0} Soal Pilihan
                      </span>
                      {quiz.isKingOfTheHill && <Badge variant="warning">King of the Hill</Badge>}
                    </div>
                    <h3 className="font-bold text-base text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors font-heading">
                      {quiz.title}
                    </h3>
                    {quiz.description && (
                      <p className="text-xs text-zinc-500 dark:text-zinc-300 line-clamp-2">{quiz.description}</p>
                    )}
                  </div>
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center justify-end gap-1">
                    <span>Mulai Kuis Sekarang</span>
                    <span>&rarr;</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 4: Grades ───────────────────────────────────────────────── */}
      {activeTab === "grades" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs text-center space-y-3">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
            Penilaian & Nilai Rata-rata Perkuliahan
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-sm mx-auto">
            Lihat rekapan nilai kuis, tugas, serta pemetaan nilai rata-rata topik mata kuliah ini
            secara lengkap.
          </p>
          <Link
            href={`/grades/${courseId}`}
            className="btn-primary text-xs py-2 px-4 rounded-lg inline-block"
          >
            Buka Halaman Nilai Rata-rata &rarr;
          </Link>
        </div>
      )}

      {/* ─── Tab 5: Attendance ───────────────────────────────────────────── */}
      {activeTab === "attendance" && (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Presensi & Kehadiran Perkuliahan
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5">
                {isTeacher
                  ? "Buka sesi presensi dengan QR Code atau kelola kehadiran mahasiswa kelas ini."
                  : "Check-in presensi menggunakan kode token atau scan QR code yang ditampilkan dosen."}
              </p>
            </div>
            {isTeacher && (
              <button
                type="button"
                onClick={() => setShowAttendanceModal(true)}
                className="btn-primary text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 font-medium shadow-2xs self-start sm:self-auto shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Buka Sesi Presensi (QR Code)</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 text-xs pt-1">
            <span className="text-zinc-500 dark:text-zinc-300">
              Lihat status presensi, riwayat pertemuan, dan catatan kehadiran mahasiswa.
            </span>
            <Link
              href={`/attendance/${courseId}`}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 inline-flex items-center gap-1"
            >
              <span>Halaman Presensi Lengkap</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      )}

      {/* ─── Modals ──────────────────────────────────────────────────────── */}

      {/* 1. Create Material Modal */}
      {isTeacher && (
        <CreateMaterialModal
          isOpen={showMaterialModal}
          onClose={() => setShowMaterialModal(false)}
          courseId={course.id}
          courseTitle={course.title}
          modules={moduleOptions}
          onMaterialCreated={() => {
            loadData()
          }}
        />
      )}

      {/* 2. Create Assignment Modal */}
      {isTeacher && (
        <CreateAssignmentModal
          isOpen={showAssignmentModal}
          onClose={() => {
            setShowAssignmentModal(false)
            setCreateAssignmentInitialTitle("")
            setCreateAssignmentInitialDesc("")
          }}
          courseId={course.id}
          courseTitle={course.title}
          initialTitle={createAssignmentInitialTitle}
          initialDescription={createAssignmentInitialDesc}
          onAssignmentCreated={() => {
            loadData()
          }}
        />
      )}

      {/* 3. Create Quiz Modal */}
      {isTeacher && (
        <CreateQuizModal
          isOpen={showQuizModal}
          onClose={() => setShowQuizModal(false)}
          courseId={course.id}
          courseTitle={course.title}
          onQuizCreated={() => {
            loadData()
          }}
        />
      )}

      {/* 4. Material Viewer Modal */}
      <MaterialViewerModal
        isOpen={Boolean(selectedMaterial)}
        onClose={() => setSelectedMaterial(null)}
        material={selectedMaterial}
        moduleTitle={selectedModuleTitle}
        isStudent={isStudent}
        onProgressMarked={() => {
          loadData()
        }}
      />

      {/* 5. Attendance Modal */}
      {course && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          courses={[course]}
          initialCourseId={course.id}
        />
      )}

      {/* 6. Assignment File Preview Modal (Image & PDF & File Viewer) */}
      {previewFileModal && (() => {
        const isImg =
          previewFileModal.url.startsWith("data:image/") ||
          /\.(jpeg|jpg|png|gif|webp|svg)($|\?)/i.test(previewFileModal.url)
        const isPdf =
          previewFileModal.url.startsWith("data:application/pdf") ||
          /\.pdf($|\?)/i.test(previewFileModal.url)
        const safeName = `Tugas_${previewFileModal.title.replace(/[^a-zA-Z0-9]/g, "_")}`

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
            onClick={() => setPreviewFileModal(null)}
          >
            <div
              className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-850">
                <div className="min-w-0 pr-3">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white font-heading truncate">
                    Pratinjau Berkas: {previewFileModal.title}
                  </h3>
                  {previewFileModal.studentName && (
                    <p className="text-xs text-zinc-500 dark:text-zinc-200 truncate">
                      Dikumpulkan oleh:{" "}
                      <span className="font-semibold text-brand-700 dark:text-brand-300">
                        {previewFileModal.studentName}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => safeOpenFile(previewFileModal.url)}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    title="Buka berkas di tab browser baru"
                  >
                    <span>Tab Baru</span>
                    <span>↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => safeDownloadFile(previewFileModal.url, safeName)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <span>📥 Unduh Berkas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPreviewFileModal(null)}
                    className="w-8 h-8 rounded-lg hover:bg-zinc-200/70 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white flex items-center justify-center transition-colors text-base font-bold ml-1 cursor-pointer"
                    aria-label="Tutup"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-75px)] flex items-center justify-center bg-zinc-900/5 dark:bg-zinc-950/40">
                {isImg ? (
                  <div className="text-center space-y-2 max-w-full">
                    <img
                      src={previewFileModal.url}
                      alt="Pratinjau Dokumen / Gambar Tugas"
                      className="max-h-[75vh] w-auto max-w-full mx-auto rounded-xl object-contain shadow-md border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                    />
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-300">
                      Klik kanan gambar atau gunakan tombol Unduh di atas untuk menyimpan berkas.
                    </p>
                  </div>
                ) : isPdf ? (
                  <iframe
                    src={previewFileModal.url}
                    title="Pratinjau Dokumen PDF"
                    className="w-full h-[72vh] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm bg-white dark:bg-zinc-900"
                  />
                ) : (
                  <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 max-w-md space-y-3 shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 flex items-center justify-center mx-auto text-2xl font-bold">
                      📎
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                      Format Berkas Lampiran
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-200">
                      Format berkas ini siap diunduh dan dibuka langsung menggunakan aplikasi di perangkat Anda (ZIP, DOCX, RAR, dsb.).
                    </p>
                    <button
                      type="button"
                      onClick={() => safeDownloadFile(previewFileModal.url, safeName)}
                      className="btn-primary text-xs py-2 px-5 rounded-lg font-bold inline-flex items-center gap-2 shadow-2xs cursor-pointer"
                    >
                      <span>📥 Unduh Berkas Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
