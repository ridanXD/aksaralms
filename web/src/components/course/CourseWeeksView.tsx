"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Course,
  Assignment,
  QuizSession,
  Material,
  Submission,
  AssignmentSubmissionsResponse,
  User,
} from "@/lib/api"
import { AssignmentContentRenderer } from "./AssignmentContentRenderer"
import { LeaderboardModal } from "@/components/quiz/LeaderboardModal"

export interface WeekSyllabus {
  weekNumber: number
  title: string
  subCpmk: string
  description: string
  learningOutcomes: string[]
  topics: string[]
  sksHours: string
  isMidterm?: boolean
  isFinal?: boolean
}

export interface CourseWeeksViewProps {
  course: Course
  isTeacher: boolean
  isStudent: boolean
  assignments: Assignment[]
  quizzes: QuizSession[]
  user: User | null
  // Modal openers
  onOpenCreateMaterial: (defaultModuleId?: number, weekTitle?: string) => void
  onOpenCreateAssignment: (initialTitle?: string, initialDescription?: string) => void
  onOpenCreateQuiz: (initialTitle?: string) => void
  onOpenAttendanceModal: () => void
  // Material viewer
  onViewMaterial: (material: Material, moduleTitle?: string) => void
  // Student submission handlers
  submissionInputs: { [id: number]: string }
  setSubmissionInputs: React.Dispatch<React.SetStateAction<{ [id: number]: string }>>
  submissionFiles: { [id: number]: { dataUrl: string; name: string; size: string } }
  handleAssignmentFileSelect: (assignmentId: number, e: React.ChangeEvent<HTMLInputElement>) => void
  handleRemoveAssignmentFile: (assignmentId: number) => void
  handleStudentSubmit: (assignmentId: number) => Promise<void>
  submittingId: number | null
  submissionFeedback: { [id: number]: { error?: string; success?: boolean } }
  assignmentFileInputRefs: React.MutableRefObject<{ [id: number]: HTMLInputElement | null }>
  // Teacher grading & submissions handlers
  openTeacherSubmissionsId: number | null
  handleToggleTeacherSubmissions: (assignmentId: number) => Promise<void>
  teacherSubmissionsData: { [assignmentId: number]: AssignmentSubmissionsResponse }
  loadingTeacherSubmissions: { [assignmentId: number]: boolean }
  submissionFilter: { [assignmentId: number]: "all" | "unscored" | "graded" | "unsubmitted" }
  setSubmissionFilter: React.Dispatch<
    React.SetStateAction<{ [assignmentId: number]: "all" | "unscored" | "graded" | "unsubmitted" }>
  >
  submissionSearch: { [assignmentId: number]: string }
  setSubmissionSearch: React.Dispatch<React.SetStateAction<{ [assignmentId: number]: string }>>
  // Teacher grading action handlers
  gradingSubmissionId: number | null
  gradingScore: string
  setGradingScore: (v: string) => void
  gradingMaxScore: string
  setGradingMaxScore: (v: string) => void
  gradingFeedback: string
  setGradingFeedback: (v: string) => void
  isSavingGrade: boolean
  gradingError: string | null
  gradingSuccessId: number | null
  handleStartGrade: (sub: Submission) => void
  handleCancelGrade: () => void
  handleSubmitGrade: (assignmentId: number, submissionId: number) => Promise<void>
  // Safe file open & download
  safeOpenFile: (url: string) => void
  safeDownloadFile: (url: string, name: string) => void
  setPreviewFileModal: (modal: { url: string; title: string; studentName?: string } | null) => void
}

/**
 * Standard 16-week structured academic curriculum tailored to course code and title.
 */
function generate16WeeksCurriculum(course: Course): WeekSyllabus[] {
  const code = (course.code || "").toUpperCase()
  const title = course.title || ""

  if (code.includes("JS") || title.toLowerCase().includes("javascript")) {
    return [
      {
        weekNumber: 1,
        title: "Dasar JavaScript, Runtime & Arsitektur Mesin V8",
        subCpmk: "Sub-CPMK 1: Mahasiswa mampu mengonfigurasi tools pengembangan dan memahami arsitektur internal runtime V8 serta Call Stack.",
        description: "Mempelajari evolusi ECMAScript, cara kerja V8 engine (Ignition interpreter & TurboFan JIT compiler), memory heap, dan call stack execution context.",
        learningOutcomes: [
          "Menjelaskan perbedaan compilation model V8 (Just-In-Time) dibanding interpreter tradisional",
          "Menganalisis Call Stack overflow dan heap memory allocation",
          "Menyiapkan environment Node.js v20+ dan package manager modern",
        ],
        topics: ["ECMAScript Specs", "V8 Engine Internals", "Call Stack & Memory Heap", "Node.js Architecture"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 2,
        title: "Lexical Scope, Hoisting, Execution Context & Closures",
        subCpmk: "Sub-CPMK 2: Mahasiswa mampu mengimplementasikan closure dan lexical scoping untuk enkapsulasi state pada aplikasi modular.",
        description: "Fase Creation vs Execution context, variabel hoisting (var vs let/const), Temporal Dead Zone (TDZ), dan pemanfaatan closure dalam memori.",
        learningOutcomes: [
          "Menganalisis mekanisme scope chain dan lexical environment",
          "Mengimplementasikan fungsi factory dan data privacy menggunakan closure",
          "Menghindari memory leaks akibat closure yang tidak terbebaskan",
        ],
        topics: ["Creation vs Execution Phase", "Hoisting & TDZ", "Lexical Scoping", "Closures & Memory Retention"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 3,
        title: "Struktur Data Modern & Manipulasi Koleksi (Array, Map, Set, WeakMap)",
        subCpmk: "Sub-CPMK 3: Mahasiswa mampu memilih dan menerapkan struktur data koleksi yang efisien dengan kompleksitas Big-O optimal.",
        description: "Struktur data native ECMAScript modern: Array iterators, Map vs Object keying, Set untuk keunikan nilai, dan WeakMap/WeakSet ramah Garbage Collection.",
        learningOutcomes: [
          "Membandingkan efisiensi waktu pencarian antara Object, Map, dan Set",
          "Menerapkan TypedArray dan ArrayBuffer untuk manipulasi byte memori",
          "Mengoptimalkan operasi transformasi data kompleks menggunakan map, filter, reduce",
        ],
        topics: ["Array Methods & Functional Iterators", "Map vs Object Performance", "Set & WeakSet", "WeakMap & GC Lifecycle"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 4,
        title: "Functional Programming: HOF, Currying & Composition",
        subCpmk: "Sub-CPMK 4: Mahasiswa mampu merancang kode deklaratif tanpa efek samping (side-effects) menggunakan prinsip Functional Programming.",
        description: "Konsep Pure Functions, Immutability, Higher-Order Functions (HOF), Function Currying, Partial Application, dan Function Composition pipeline.",
        learningOutcomes: [
          "Membangun fungsi murni yang deterministik dan mudah diuji secara modular",
          "Mengimplementasikan currying dan partial application untuk reusabilitas kode",
          "Menyusun pipeline pemrosesan data dengan teknik function composition",
        ],
        topics: ["Pure Functions & Immutability", "Higher-Order Functions", "Currying & Partial Application", "Pipe & Compose Pipelines"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 5,
        title: "Prototypes, Prototypal Inheritance & ES6+ Classes",
        subCpmk: "Sub-CPMK 5: Mahasiswa mampu mengimplementasikan inheritance dan polimorfisme berbasis prototypal chain dan sintaks ES6 Class.",
        description: "Membedah prototype chain lookup, Object.create, class syntax, private fields (#), static members, dan komposisi objek dibanding inheritance.",
        learningOutcomes: [
          "Membongkar cara kerja syntactic sugar 'class' di atas prototype JavaScript",
          "Menggunakan private identifier '#' untuk enkapsulasi sejati pada runtime",
          "Menerapkan prinsip SOLID dan Composition over Inheritance",
        ],
        topics: ["Prototype Chain Mechanics", "Object.create & Constructor Functions", "ES6 Classes & Private Fields", "SOLID Principles"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 6,
        title: "Error Handling Terstruktur, Custom Exceptions & Defensive Programming",
        subCpmk: "Sub-CPMK 6: Mahasiswa mampu merancang strategi penanganan error yang kuat, aman, dan informatif pada level enterprise.",
        description: "Hierarki class Error di JavaScript, structured error handling dengan try/catch/finally, async error bubbling, custom domain exceptions, dan sanitasi pesan error produksi.",
        learningOutcomes: [
          "Membuat custom error class yang mewarisi Error dengan stack trace yang rapi",
          "Menangani synchronous dan asynchronous errors secara konsisten",
          "Mencegah unhandledRejection dan uncaughtException crash di server",
        ],
        topics: ["Error Hierarchy & Stack Traces", "Custom Domain Exceptions", "Async Error Boundaries", "Global Exception Handlers"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 7,
        title: "Asynchronous JavaScript: Microtasks, Macrotasks & libuv Event Loop",
        subCpmk: "Sub-CPMK 7: Mahasiswa mampu menganalisis urutan eksekusi asynchronous dan mencegah race condition pada sistem non-blocking I/O.",
        description: "Pembedahan mendalam libuv Event Loop (timers, poll, check, close), microtask queue (Promise, queueMicrotask, process.nextTick), dan async/await bytecode.",
        learningOutcomes: [
          "Mampu memprediksi secara akurat urutan eksekusi synchronous, microtask, dan macrotask",
          "Menggunakan Promise combinators sesuai kebutuhan (all, allSettled, race, any)",
          "Mencegah CPU starvation pada event loop dengan task scheduling yang tepat",
        ],
        topics: ["libuv Event Loop 6 Phases", "Microtask vs Macrotask Queue", "process.nextTick Priority", "Advanced Promise Combinators"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 8,
        title: "Evaluasi Tengah Semester (UTS): Teori Komprehensif & Live Coding",
        subCpmk: "Sub-CPMK 8: Mahasiswa mampu mengintegrasikan seluruh konsep pemrograman JavaScript (W01-W07) untuk menyelesaikan studi kasus komputasi nyata.",
        description: "Ujian Tengah Semester (UTS) mencakup evaluasi kompetensi teori arsitektur dan live implementation challenge berbatas waktu.",
        learningOutcomes: [
          "Membuktikan penguasaan fundamental JavaScript dan arsitektur runtime",
          "Menyelesaikan implementasi modul fungsional dalam batasan waktu",
          "Menerapkan best practices clean code, error handling, dan modularitas",
        ],
        topics: ["Review Materi W01-W07", "Live Coding Challenge", "Teori Komprehensif", "Evaluasi Tengah Semester"],
        sksHours: "3 SKS · Sesi evaluasi terjadwal",
        isMidterm: true,
      },
      {
        weekNumber: 9,
        title: "Concurrency, Multithreading & Worker Threads di Node.js",
        subCpmk: "Sub-CPMK 9: Mahasiswa mampu mengimplementasikan worker threads dan shared memory untuk tugas komputasi intensif (CPU-bound).",
        description: "Mengatasi keterbatasan single-thread JavaScript dengan modul worker_threads, SharedArrayBuffer, Atomics API untuk operasi thread-safe, dan arsitektur thread pool.",
        learningOutcomes: [
          "Menentukan kapan harus menggunakan async I/O vs worker threads",
          "Mengimplementasikan komunikasi pesan antar thread via MessageChannel dan SharedArrayBuffer",
          "Mencegah race condition multithreading menggunakan Atomics methods",
        ],
        topics: ["worker_threads Module", "SharedArrayBuffer & TypedArrays", "Atomics Synchronization", "Thread Pooling Architecture"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 10,
        title: "Arsitektur RESTful API, Schema Validation & Integrasi Basis Data",
        subCpmk: "Sub-CPMK 10: Mahasiswa mampu merancang API RESTful berstandar industri dengan validasi skema ketat (Zod) dan koneksi database relasional.",
        description: "Desain HTTP endpoints yang idempotent, status code semantik, middleware pipeline, validasi request runtime dengan Zod, dan integrasi PostgreSQL menggunakan ORM.",
        learningOutcomes: [
          "Membangun arsitektur controller-service-repository yang terpisah rapi",
          "Memvalidasi payload masukan secara deklaratif dan aman dari type injection",
          "Melakukan pagination, filtering, dan sorting data secara efisien di level query",
        ],
        topics: ["REST Principles & Idempotency", "Middleware Architecture", "Runtime Validation with Zod", "PostgreSQL & Prisma ORM"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 11,
        title: "Otentikasi, Otorisasi RBAC, JWT Security & Pertahanan Web",
        subCpmk: "Sub-CPMK 11: Mahasiswa mampu mengimplementasikan mekanisme otentikasi JWT dan pertahanan terhadap kerentanan web utama.",
        description: "Implementasi JWT sign/verify, refresh token rotation, HttpOnly SameSite cookie security, Role-Based Access Control (RBAC), serta mitigasi serangan web.",
        learningOutcomes: [
          "Merancang alur login, refresh token, dan logout yang tahan token revocation",
          "Menerapkan middleware autentikasi dan otorisasi berbasis peran (RBAC)",
          "Mengamankan API dari header spoofing, timing attacks, dan mass assignment",
        ],
        topics: ["JWT Claims & Cryptographic Signing", "Refresh Token Rotation", "RBAC Authorization Guards", "OWASP API Top 10 Mitigation"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 12,
        title: "Pengujian Perangkat Lunak: Unit Testing, Mocking & TDD (Jest / Vitest)",
        subCpmk: "Sub-CPMK 12: Mahasiswa mampu menulis test suite otomatis dengan coverage tinggi menggunakan prinsip Test-Driven Development (TDD).",
        description: "Prinsip pengujian piramida (Unit, Integration, E2E), assertion library, spy, stub, dan mock fungsi/database, serta siklus Red-Green-Refactor.",
        learningOutcomes: [
          "Menulis unit test komprehensif untuk fungsi bisnis kritis",
          "Melakukan mock pada network calls dan database dependencies secara terisolasi",
          "Menganalisis laporan code coverage dan mendeteksi edge case yang belum teruji",
        ],
        topics: ["Test Pyramid Philosophy", "Vitest / Jest Framework", "Spies, Mocks & Dependency Injection", "CI Test Automation"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 13,
        title: "Optimasi Kinerja, Profiling Memory Leak & Strategi Caching (Redis)",
        subCpmk: "Sub-CPMK 13: Mahasiswa mampu mendeteksi bottleneck performa sistem, memory leak, dan menerapkan multi-layer caching.",
        description: "Profiling Chrome DevTools Memory Inspector, deteksi memory leaks pada closure/listeners, implementasi Redis in-memory cache, dan strategi cache invalidation.",
        learningOutcomes: [
          "Membaca heap snapshot untuk melacak alokasi objek yang bocor",
          "Menerapkan caching pola Cache-Aside, Write-Through, dan TTL strategy",
          "Mengoptimalkan throughput response server",
        ],
        topics: ["Heap Snapshot Analysis", "Detecting Memory Leaks", "Redis In-Memory Caching", "Cache-Aside Pattern"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 14,
        title: "Containerization dengan Docker, Multi-stage Builds & CI/CD Pipelines",
        subCpmk: "Sub-CPMK 14: Mahasiswa mampu mengemas aplikasi ke dalam container Docker yang ramping dan menyusun pipeline CI/CD otomatis.",
        description: "Dasar container vs virtual machine, Dockerfile best practices, multi-stage build untuk meminimalkan image size (<150MB), dan GitHub Actions workflow.",
        learningOutcomes: [
          "Membuat Dockerfile multi-stage yang aman tanpa devDependencies di produksi",
          "Menjalankan lingkungan multi-service menggunakan Docker Compose",
          "Menyusun pipeline CI/CD untuk automated test dan build release",
        ],
        topics: ["Docker Engine Fundamentals", "Multi-Stage Dockerfile", "Docker Compose Orchestration", "GitHub Actions CI/CD"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 15,
        title: "Clean Architecture, Design Patterns & Peer Code Review",
        subCpmk: "Sub-CPMK 15: Mahasiswa mampu merefaktor aplikasi ke dalam arsitektur berlapis yang scalable serta melakukan code review profesional.",
        description: "Pola desain Gang of Four (Singleton, Factory, Observer, Strategy) di JavaScript, Hexagonal/Clean Architecture, dan simulasi Pull Request Code Review.",
        learningOutcomes: [
          "Menerapkan software design patterns yang lazim digunakan di sistem modern",
          "Memisahkan domain logic murni dari framework infrastructure dependencies",
          "Memberikan umpan balik code review yang konstruktif dan berbasis standar kualitas",
        ],
        topics: ["GoF Patterns in Modern JS", "Clean Architecture & Hexagonal", "OpenAPI Documentation", "Peer Code Review Protocol"],
        sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      },
      {
        weekNumber: 16,
        title: "Evaluasi Akhir Semester (UAS): Capstone Project Defense & Showcase",
        subCpmk: "Sub-CPMK 16: Mahasiswa mampu mempresentasikan dan mempertahankan aplikasi full-stack capstone project siap produksi di hadapan tim penguji.",
        description: "Ujian Akhir Semester (UAS): Presentasi arsitektur sistem, demonstrasi live aplikasi yang telah di-deploy, code walk-through, dan sesi tanya-jawab teknis.",
        learningOutcomes: [
          "Menunjukkan kompetensi menyeluruh dari 16 minggu perkuliahan",
          "Mempertahankan keputusan arsitektur dan mitigasi komputasi yang diambil",
          "Mendemonstrasikan aplikasi yang teruji, aman, dan siap digunakan pengguna",
        ],
        topics: ["Capstone Project Showcase", "Live Demo & Architecture Defense", "Evaluasi Portofolio", "Evaluasi Akhir Semester"],
        sksHours: "3 SKS · Sesi evaluasi capstone terjadwal",
        isFinal: true,
      },
    ]
  }

  // Fallback generic 16-week structured academic curriculum
  return Array.from({ length: 16 }, (_, idx) => {
    const week = idx + 1
    const isMidterm = week === 8
    const isFinal = week === 16

    let weekTitle = `Pertemuan Minggu ${week}: Pendalaman Konsep & Aplikasi Praktis Bagian ${week}`
    let subCpmk = `Sub-CPMK ${week}: Mahasiswa mampu memahami dan mengimplementasikan kompetensi minggu ke-${week} pada mata kuliah ${title}.`
    let desc = `Sesi perkuliahan minggu ke-${week} berfokus pada penguasaan teori fundamental, studi kasus implementasi, serta latihan mandiri terarah.`

    if (isMidterm) {
      weekTitle = `Evaluasi Tengah Semester (UTS): Ujian Teori & Praktik Komprehensif`
      subCpmk = `Sub-CPMK 8: Mahasiswa mampu mengintegrasikan seluruh materi perkuliahan minggu ke-1 sampai minggu ke-7.`
      desc = `Ujian Tengah Semester (UTS) untuk mengukur ketercapaian kompetensi pembelajaran paruh pertama semester.`
    } else if (isFinal) {
      weekTitle = `Evaluasi Akhir Semester (UAS): Presentasi Proyek Akhir & Ujian Capstone`
      subCpmk = `Sub-CPMK 16: Mahasiswa mampu memvalidasi capaian pembelajaran menyeluruh dari 16 minggu perkuliahan.`
      desc = `Ujian Akhir Semester (UAS) dan evaluasi capaian akhir portofolio mahasiswa.`
    }

    return {
      weekNumber: week,
      title: weekTitle,
      subCpmk,
      description: desc,
      learningOutcomes: [
        `Menguasai konsep kunci materi pada minggu ke-${week}`,
        `Mampu menyelesaikan tugas studi kasus terstruktur`,
        `Berpartisipasi aktif dalam sesi diskusi dan evaluasi pemahaman`,
      ],
      topics: [`Topik Utama Minggu ${week}`, `Studi Kasus & Analisis`, `Praktikum Mandiri`],
      sksHours: "3 SKS · 150 menit teori + 180 menit praktikum",
      isMidterm,
      isFinal,
    }
  })
}

export function CourseWeeksView({
  course,
  isTeacher,
  isStudent,
  assignments,
  quizzes,
  user,
  onOpenCreateMaterial,
  onOpenCreateAssignment,
  onOpenCreateQuiz,
  onOpenAttendanceModal,
  onViewMaterial,
  submissionInputs,
  setSubmissionInputs,
  submissionFiles,
  handleAssignmentFileSelect,
  handleRemoveAssignmentFile,
  handleStudentSubmit,
  submittingId,
  submissionFeedback,
  assignmentFileInputRefs,
  openTeacherSubmissionsId,
  handleToggleTeacherSubmissions,
  teacherSubmissionsData,
  loadingTeacherSubmissions,
  submissionFilter,
  setSubmissionFilter,
  submissionSearch,
  setSubmissionSearch,
  gradingSubmissionId,
  gradingScore,
  setGradingScore,
  gradingMaxScore,
  setGradingMaxScore,
  gradingFeedback,
  setGradingFeedback,
  isSavingGrade,
  gradingError,
  gradingSuccessId,
  handleStartGrade,
  handleCancelGrade,
  handleSubmitGrade,
  safeOpenFile,
  safeDownloadFile,
  setPreviewFileModal,
}: CourseWeeksViewProps) {
  // Navigation & Filter state
  const [activeFilter, setActiveFilter] = useState<"all" | "pre-midterm" | "midterm" | "post-midterm" | "final">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedWeeks, setExpandedWeeks] = useState<{ [weekNum: number]: boolean }>({
    1: true,
  })

  // Leaderboard modal state
  const [leaderboardSessionId, setLeaderboardSessionId] = useState<number | null>(null)
  const [leaderboardQuizTitle, setLeaderboardQuizTitle] = useState<string>("")

  // Curriculum data
  const curriculum = useMemo(() => generate16WeeksCurriculum(course), [course])

  // Map modules, assignments, and quizzes to weeks
  const weeksData = useMemo(() => {
    return curriculum.map((weekItem) => {
      const wNum = weekItem.weekNumber

      // Match modules
      const matchedModules = (course.modules || []).filter((m) => {
        if (m.order === wNum) return true
        const t = m.title.toLowerCase()
        return (
          t.includes(`minggu ${wNum}`) ||
          t.includes(`minggu 0${wNum}`) ||
          t.includes(`week ${wNum}`) ||
          t.includes(`week 0${wNum}`) ||
          t.includes(`pertemuan ${wNum}`)
        )
      })

      let materials: Material[] = []
      matchedModules.forEach((m) => {
        if (m.materials) materials.push(...m.materials)
      })

      if (materials.length === 0 && (course.modules || []).length > 0) {
        const directModule = (course.modules || [])[wNum - 1]
        if (directModule?.materials) {
          materials = directModule.materials
        }
      }

      // Match assignments
      const matchedAssignments = assignments.filter((a) => {
        const titleLower = a.title.toLowerCase()
        if (wNum === 8 && (titleLower.includes("uts") || titleLower.includes("tengah semester"))) return true
        if (wNum === 16 && (titleLower.includes("uas") || titleLower.includes("akhir semester") || titleLower.includes("capstone"))) return true

        if (
          titleLower.includes(`minggu ${wNum}`) ||
          titleLower.includes(`minggu 0${wNum}`) ||
          titleLower.includes(`week ${wNum}`) ||
          titleLower.includes(`week 0${wNum}`) ||
          titleLower.includes(`pertemuan ${wNum}`)
        ) {
          return true
        }

        const assignIndex = assignments.findIndex((item) => item.id === a.id)
        if (assignments.length === 1 && wNum === 3) return true
        if (assignments.length === 2) {
          if (assignIndex === 0 && wNum === 3) return true
          if (assignIndex === 1 && wNum === 10) return true
        }
        if (assignments.length >= 3) {
          if (assignIndex === 0 && wNum === 3) return true
          if (assignIndex === 1 && wNum === 6) return true
          if (assignIndex === 2 && wNum === 10) return true
          if (assignIndex === 3 && wNum === 13) return true
        }

        return false
      })

      // Match quizzes
      const matchedQuizzes = quizzes.filter((q) => {
        const qTitle = q.title.toLowerCase()
        if (wNum === 8 && (q.isKingOfTheHill || qTitle.includes("uts") || qTitle.includes("tengah semester"))) return true
        if (wNum === 16 && (qTitle.includes("uas") || qTitle.includes("akhir semester"))) return true
        if (
          qTitle.includes(`minggu ${wNum}`) ||
          qTitle.includes(`week ${wNum}`) ||
          qTitle.includes(`kuis ${wNum}`)
        ) {
          return true
        }
        if (quizzes.length === 1 && (wNum === 8 || wNum === 4)) return true
        return false
      })

      return {
        ...weekItem,
        matchedModules,
        materials,
        assignments: matchedAssignments,
        quizzes: matchedQuizzes,
      }
    })
  }, [curriculum, course.modules, assignments, quizzes])

  // Filtered weeks
  const filteredWeeks = useMemo(() => {
    return weeksData.filter((w) => {
      if (activeFilter === "pre-midterm" && (w.weekNumber < 1 || w.weekNumber > 7)) return false
      if (activeFilter === "midterm" && w.weekNumber !== 8) return false
      if (activeFilter === "post-midterm" && (w.weekNumber < 9 || w.weekNumber > 15)) return false
      if (activeFilter === "final" && w.weekNumber !== 16) return false

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchesTitle = w.title.toLowerCase().includes(q)
        const matchesSubCpmk = w.subCpmk.toLowerCase().includes(q)
        const matchesTopics = w.topics.some((t) => t.toLowerCase().includes(q))
        const matchesAssignments = w.assignments.some(
          (a) => a.title.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
        )
        const matchesMaterials = w.materials.some((m) => m.title.toLowerCase().includes(q))
        if (!matchesTitle && !matchesSubCpmk && !matchesTopics && !matchesAssignments && !matchesMaterials) {
          return false
        }
      }

      return true
    })
  }, [weeksData, activeFilter, searchQuery])

  const handleToggleWeek = (weekNum: number) => {
    setExpandedWeeks((prev) => ({
      ...prev,
      [weekNum]: !prev[weekNum],
    }))
  }

  const handleExpandAll = () => {
    const allExpanded: { [k: number]: boolean } = {}
    for (let i = 1; i <= 16; i++) allExpanded[i] = true
    setExpandedWeeks(allExpanded)
  }

  const handleCollapseAll = () => {
    setExpandedWeeks({})
  }

  return (
    <div className="space-y-6">
      {/* ─── Filter & Search Bar (Segmented & Search) ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Segmented Phase Control */}
        <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-200 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === "all" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-2xs" : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Semua (16 Minggu)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("pre-midterm")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === "pre-midterm" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-2xs" : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Pra-UTS (1–7)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("midterm")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === "midterm" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-2xs" : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            UTS (8)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("post-midterm")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === "post-midterm" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-2xs" : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Pasca-UTS (9–15)
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter("final")}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeFilter === "final" ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white font-bold shadow-2xs" : "hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            UAS (16)
          </button>
        </div>

        {/* Search Input & Expand/Collapse Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-200 shrink-0">
            <button
              type="button"
              onClick={handleExpandAll}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
            >
              Buka Semua
            </button>
            <span className="text-zinc-300 dark:text-zinc-400">·</span>
            <button
              type="button"
              onClick={handleCollapseAll}
              className="hover:text-zinc-900 dark:hover:text-white transition-colors font-medium"
            >
              Tutup Semua
            </button>
          </div>

          <div className="relative sm:w-64 flex-1 sm:flex-initial">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari topik atau tugas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-600"
            />
            <svg
              className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-300 absolute left-2.5 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-2 text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-white text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ─── 16 Weeks Accordion Cards List ─────────────────────────────────── */}
      <div className="space-y-3">
        {filteredWeeks.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-10 text-center space-y-2">
            <h4 className="text-xs font-bold text-zinc-800 dark:text-white">Tidak ada materi atau tugas yang cocok</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-200">
              Tidak ditemukan pertemuan perkuliahan yang sesuai dengan kueri pencarian.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter("all")
                setSearchQuery("")
              }}
              className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 pt-1"
            >
              Reset filter
            </button>
          </div>
        ) : (
          filteredWeeks.map((week) => {
            const isExpanded = !!expandedWeeks[week.weekNumber]
            const isMidterm = week.weekNumber === 8
            const isFinal = week.weekNumber === 16
            const cleanTitle = week.title
              .replace(/^Pertemuan Minggu \d+:\s*/i, "")
              .replace(/^Minggu \d+:\s*/i, "")
              .replace(/^Week \d+:\s*/i, "")
              .replace(/^Week \d+\s*-\s*/i, "")
              .trim()

            return (
              <div
                key={week.weekNumber}
                id={`week-card-${week.weekNumber}`}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 shadow-2xs overflow-hidden scroll-mt-24 transition-colors"
              >
                {/* ─── Dropdown Header ─── */}
                <button
                  type="button"
                  id={`week-header-${week.weekNumber}`}
                  onClick={() => handleToggleWeek(week.weekNumber)}
                  aria-expanded={isExpanded}
                  aria-controls={`week-content-${week.weekNumber}`}
                  className={`w-full text-left p-4 sm:p-5 flex items-start sm:items-center justify-between gap-4 transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-inset ${
                    isExpanded ? "bg-zinc-50/80 dark:bg-zinc-800/80 border-b border-zinc-200/70 dark:border-zinc-800" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    {/* Clean Week Tag */}
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center shrink-0 border text-xs font-bold font-mono transition-colors ${
                        isMidterm
                          ? "bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800"
                          : isFinal
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800"
                          : isExpanded
                          ? "bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-800"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      <span className="text-[10px] leading-none uppercase text-zinc-400 dark:text-zinc-300 font-semibold">Wk</span>
                      <span className="text-sm leading-none mt-0.5">
                        {week.weekNumber < 10 ? `0${week.weekNumber}` : week.weekNumber}
                      </span>
                    </div>

                    {/* Week Title & Typographic Metadata */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {isMidterm && (
                          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 rounded">
                            Evaluasi Tengah Semester (UTS)
                          </span>
                        )}
                        {isFinal && (
                          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                            Evaluasi Akhir Semester (UAS)
                          </span>
                        )}
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-200">
                          {week.sksHours}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white font-heading tracking-tight">
                        Week {week.weekNumber} - {cleanTitle}
                      </h3>

                      {/* Editorial Typographic Metadata */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-200">
                        <span className="font-medium text-zinc-700 dark:text-zinc-100">{week.materials.length} Bahan Ajar</span>
                        <span>·</span>
                        <span className={week.assignments.length > 0 ? "text-amber-800 dark:text-amber-300 font-semibold" : ""}>
                          {week.assignments.length > 0 ? `${week.assignments.length} Tugas Kuliah` : "Tanpa Tugas"}
                        </span>
                        {week.quizzes.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-purple-800 dark:text-purple-300 font-semibold">
                              {week.quizzes[0].isKingOfTheHill ? "King of the Hill" : `${week.quizzes.length} Kuis`}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>Presensi Pertemuan</span>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Chevron Logo & Label */}
                  <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                    <span className="hidden sm:inline-block text-xs font-medium text-zinc-400 dark:text-zinc-200">
                      {isExpanded ? "Tutup" : "Buka"}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200 ${
                        isExpanded
                          ? "bg-brand-50 dark:bg-brand-950/80 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 rotate-180 shadow-2xs"
                          : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-800 dark:hover:text-white"
                      }`}
                      title={isExpanded ? "Tutup rincian week" : "Buka materi, tugas, dan kuis minggu ini"}
                    >
                      <svg
                        className="w-4 h-4 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* ─── Card Body (Expanded Dropdown Content) ─── */}
                {isExpanded && (
                  <div
                    id={`week-content-${week.weekNumber}`}
                    role="region"
                    aria-labelledby={`week-header-${week.weekNumber}`}
                    className="p-4 sm:p-6 space-y-6"
                  >
                    {/* 1. Sub-CPMK & Learning Outcomes (Clean Editorial Callout) */}
                    <div className="border-l-2 border-brand-600 pl-4 space-y-2">
                      <div className="text-[11px] font-bold text-brand-700 dark:text-brand-400 uppercase tracking-wider">
                        Capaian Pembelajaran (Sub-CPMK)
                      </div>
                      <p className="text-xs sm:text-[13px] font-medium text-zinc-900 dark:text-white leading-relaxed">
                        {week.subCpmk}
                      </p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                        {week.description}
                      </p>

                      {/* Topic Tags (Clean text with middots) */}
                      <div className="text-xs text-zinc-500 dark:text-zinc-200 pt-1">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-100">Topik Bahasan: </span>
                        {week.topics.join(" · ")}
                      </div>
                    </div>

                    {/* 2. Bahan Ajar & Modul (Materials) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Bahan Ajar & Modul</span>
                          <span className="text-zinc-400 dark:text-zinc-200 font-normal">({week.materials.length})</span>
                        </div>
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => {
                              const modId = week.matchedModules[0]?.id
                              onOpenCreateMaterial(modId, week.title)
                            }}
                            className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
                          >
                            + Tambah Bahan Ajar
                          </button>
                        )}
                      </div>

                      {week.materials.length === 0 ? (
                        <p className="text-xs text-zinc-400 dark:text-zinc-200 py-1">
                          Belum ada bahan ajar yang diunggah untuk minggu ini.
                        </p>
                      ) : (
                        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
                          {week.materials.map((m) => (
                            <div
                              key={m.id}
                              className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-200">
                                  <span className="font-semibold text-zinc-600 dark:text-zinc-100 uppercase tracking-wider">
                                    {m.type}
                                  </span>
                                  <span>·</span>
                                  <span>Urutan #{m.order || 1}</span>
                                </div>
                                <h4 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white">
                                  {m.title}
                                </h4>
                                {m.content && (
                                  <p className="text-xs text-zinc-500 dark:text-zinc-200 line-clamp-1">
                                    {m.content}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => onViewMaterial(m, week.title)}
                                  className="btn-primary text-xs py-1.5 px-3 rounded-lg font-medium shadow-2xs"
                                >
                                  Buka Materi
                                </button>
                                {m.fileUrl && (
                                  <button
                                    type="button"
                                    onClick={() => safeOpenFile(m.fileUrl!)}
                                    className="text-xs text-zinc-500 dark:text-zinc-200 hover:text-zinc-800 dark:hover:text-white font-medium px-2 py-1.5"
                                  >
                                    Lampiran
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 3. Tugas Kuliah (Assignments) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                        <div className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                          <span>Tugas Kuliah</span>
                          <span className="text-zinc-400 dark:text-zinc-200 font-normal">({week.assignments.length})</span>
                        </div>
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenCreateAssignment(
                                `Tugas Minggu ${week.weekNumber}: ${week.title}`,
                                `Kerjakan tugas terstruktur minggu ke-${week.weekNumber} berdasarkan materi kuliah.`
                              )
                            }}
                            className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
                          >
                            + Buat Tugas Minggu Ini
                          </button>
                        )}
                      </div>

                      {week.assignments.length === 0 ? (
                        <p className="text-xs text-zinc-400 dark:text-zinc-200 py-1">
                          Tidak ada tugas kuliah yang dijadwalkan pada pertemuan minggu ini.
                        </p>
                      ) : (
                        <div className="space-y-3">
                          {week.assignments.map((assignment) => {
                            const deadlineDate = new Date(assignment.deadline)
                            const isPast = new Date() > deadlineDate
                            const file = submissionFiles[assignment.id]
                            const feedback = submissionFeedback[assignment.id]
                            const isSubmitting = submittingId === assignment.id
                            const isOpenGradingDrawer = openTeacherSubmissionsId === assignment.id

                            return (
                              <div
                                key={assignment.id}
                                className="border border-zinc-200/90 dark:border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4"
                              >
                                {/* Header metadata */}
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-200">
                                        Tenggat: {deadlineDate.toLocaleDateString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                          year: "numeric",
                                        })}
                                      </span>
                                      {isPast && (
                                        <span className="text-[10px] font-medium text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
                                          Lewat tenggat
                                        </span>
                                      )}
                                      {isStudent && (
                                        assignment.submitted ? (
                                          assignment.grade ? (
                                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">
                                              Dinilai: {assignment.grade.score}/{assignment.grade.maxScore}
                                            </span>
                                          ) : (
                                            <span className="text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded">
                                              Sudah dikumpulkan
                                            </span>
                                          )
                                        ) : (
                                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
                                            Belum dikumpulkan
                                          </span>
                                        )
                                      )}
                                    </div>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                                      {assignment.title}
                                    </h4>
                                  </div>

                                  {/* Teacher actions */}
                                  {isTeacher && (
                                    <button
                                      type="button"
                                      onClick={() => handleToggleTeacherSubmissions(assignment.id)}
                                      className={`text-xs py-1.5 px-3 rounded-lg font-medium border transition-colors ${
                                        isOpenGradingDrawer
                                          ? "bg-zinc-900 dark:bg-brand-600 text-white dark:text-white border-zinc-900 dark:border-brand-500"
                                          : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                                      }`}
                                    >
                                      {isOpenGradingDrawer
                                        ? "Tutup Pemeriksaan"
                                        : `Periksa & Nilai (${assignment.submissionsCount || assignment.submissions?.length || 0})`}
                                    </button>
                                  )}
                                </div>

                                {/* Content / Instructions */}
                                {assignment.description && (
                                  <div className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    <AssignmentContentRenderer content={assignment.description} />
                                  </div>
                                )}

                                {/* Student Submission Box */}
                                {isStudent && (
                                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                                    {assignment.submitted && assignment.submission ? (
                                      <div className="bg-zinc-50 dark:bg-zinc-800/80 rounded-xl p-3.5 space-y-2.5 text-xs">
                                        <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-200">
                                          <span className="font-semibold text-zinc-900 dark:text-white">Jawaban Terkirim</span>
                                          <span>
                                            {new Date(assignment.submission.submittedAt).toLocaleDateString("id-ID", {
                                              day: "numeric",
                                              month: "short",
                                              hour: "2-digit",
                                              minute: "2-digit",
                                            })}
                                          </span>
                                        </div>
                                        {assignment.submission.content && (
                                          <p className="text-zinc-700 dark:text-zinc-100 whitespace-pre-wrap">
                                            {assignment.submission.content}
                                          </p>
                                        )}
                                        {assignment.submission.fileUrl && (
                                          <div className="flex items-center gap-2 pt-1">
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setPreviewFileModal({
                                                  url: assignment.submission!.fileUrl!,
                                                  title: assignment.title,
                                                  studentName: user?.name || "Mahasiswa",
                                                })
                                              }
                                              className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold"
                                            >
                                              Lihat Berkas Terlampir
                                            </button>
                                            <span className="text-zinc-300 dark:text-zinc-400">·</span>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                safeDownloadFile(assignment.submission!.fileUrl!, `Tugas_${assignment.id}`)
                                              }
                                              className="text-xs text-zinc-500 dark:text-zinc-200 hover:text-zinc-800 dark:hover:text-white"
                                            >
                                              Unduh
                                            </button>
                                          </div>
                                        )}
                                        {assignment.grade && (
                                          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs space-y-1">
                                            <div className="flex items-center justify-between font-semibold text-emerald-800 dark:text-emerald-300">
                                              <span>Nilai Dosen</span>
                                              <span>{assignment.grade.score} / {assignment.grade.maxScore}</span>
                                            </div>
                                            {assignment.grade.feedback && (
                                              <p className="text-zinc-600 dark:text-zinc-200 italic">
                                                &quot;{assignment.grade.feedback}&quot;
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        <textarea
                                          value={submissionInputs[assignment.id] || ""}
                                          onChange={(e) =>
                                            setSubmissionInputs((prev) => ({
                                              ...prev,
                                              [assignment.id]: e.target.value,
                                            }))
                                          }
                                          rows={2}
                                          placeholder="Ketik jawaban tugas atau catatan di sini..."
                                          className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder-zinc-400 dark:placeholder-zinc-300 focus:outline-none focus:ring-1 focus:ring-brand-600"
                                        />

                                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="file"
                                              id={`file-input-${assignment.id}`}
                                              ref={(el) => {
                                                assignmentFileInputRefs.current[assignment.id] = el
                                              }}
                                              onChange={(e) => handleAssignmentFileSelect(assignment.id, e)}
                                              className="hidden"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const ref = assignmentFileInputRefs.current[assignment.id]
                                                if (ref) ref.click()
                                              }}
                                              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-700 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                            >
                                              {file ? "Ganti Berkas" : "Lampirkan Berkas (Maks. 25MB)"}
                                            </button>
                                            {file && (
                                              <span className="text-zinc-600 dark:text-zinc-200">
                                                {file.name} ({file.size})
                                              </span>
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            disabled={isSubmitting}
                                            onClick={() => handleStudentSubmit(assignment.id)}
                                            className="btn-primary text-xs py-1.5 px-4 rounded-xl font-semibold disabled:opacity-50"
                                          >
                                            {isSubmitting ? "Mengirim..." : "Kumpulkan Tugas"}
                                          </button>
                                        </div>

                                        {feedback?.error && (
                                          <p className="text-xs text-rose-600 dark:text-rose-300">{feedback.error}</p>
                                        )}
                                        {feedback?.success && (
                                          <p className="text-xs text-emerald-600 dark:text-emerald-300 font-semibold">
                                            Tugas berhasil dikirim ke dosen.
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Teacher Grading Drawer */}
                                {isTeacher && isOpenGradingDrawer && (
                                  <div className="border-t border-zinc-200 pt-3 space-y-3">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-bold text-zinc-900">
                                        Pengumpulan Mahasiswa
                                      </span>
                                      <select
                                        value={submissionFilter[assignment.id] || "all"}
                                        onChange={(e) =>
                                          setSubmissionFilter((prev) => ({
                                            ...prev,
                                            [assignment.id]: e.target.value as any,
                                          }))
                                        }
                                        className="text-xs px-2 py-1 rounded-lg border border-zinc-300 bg-white"
                                      >
                                        <option value="all">Semua Status</option>
                                        <option value="unscored">Belum Dinilai</option>
                                        <option value="graded">Sudah Dinilai</option>
                                        <option value="unsubmitted">Belum Mengumpulkan</option>
                                      </select>
                                    </div>

                                    {loadingTeacherSubmissions[assignment.id] ? (
                                      <p className="text-xs text-zinc-400 py-2">Memuat data pengumpulan...</p>
                                    ) : !teacherSubmissionsData[assignment.id] ? (
                                      <p className="text-xs text-zinc-400 py-2">Gagal memuat pengumpulan.</p>
                                    ) : (
                                      (() => {
                                        const subData = teacherSubmissionsData[assignment.id]
                                        const subs = subData.submissions || []
                                        const unsubmitted = subData.unsubmittedStudents || []
                                        const filter = submissionFilter[assignment.id] || "all"

                                        let displayList = subs
                                        if (filter === "unscored") displayList = subs.filter((s) => !s.grade)
                                        else if (filter === "graded") displayList = subs.filter((s) => !!s.grade)

                                        return (
                                          <div className="space-y-2.5">
                                            {displayList.length === 0 && filter !== "unsubmitted" ? (
                                              <p className="text-xs text-zinc-400 py-2">
                                                Tidak ada pengumpulan yang sesuai filter.
                                              </p>
                                            ) : (
                                              displayList.map((sub) => {
                                                const isGradingThis = gradingSubmissionId === sub.id
                                                const isSuccess = gradingSuccessId === sub.id

                                                return (
                                                  <div
                                                    key={sub.id}
                                                    className="p-3 bg-zinc-50 rounded-xl space-y-2 text-xs"
                                                  >
                                                    <div className="flex items-center justify-between">
                                                      <div>
                                                        <span className="font-semibold text-zinc-900">
                                                          {sub.user?.name || "Mahasiswa"}
                                                        </span>
                                                        <span className="text-zinc-400 text-[11px] ml-2">
                                                          {sub.user?.email}
                                                        </span>
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        {sub.grade ? (
                                                          <span className="text-emerald-700 font-semibold">
                                                            {sub.grade.score}/{sub.grade.maxScore}
                                                          </span>
                                                        ) : (
                                                          <span className="text-amber-700 font-semibold">
                                                            Belum dinilai
                                                          </span>
                                                        )}
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            isGradingThis ? handleCancelGrade() : handleStartGrade(sub)
                                                          }
                                                          className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                                                        >
                                                          {isGradingThis ? "Batal" : sub.grade ? "Edit Nilai" : "Beri Nilai"}
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {sub.content && (
                                                      <p className="text-zinc-700 bg-white p-2 rounded-lg border border-zinc-200">
                                                        {sub.content}
                                                      </p>
                                                    )}

                                                    {sub.fileUrl && (
                                                      <div className="flex items-center gap-2">
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            setPreviewFileModal({
                                                              url: sub.fileUrl!,
                                                              title: assignment.title,
                                                              studentName: sub.user?.name || undefined,
                                                            })
                                                          }
                                                          className="text-xs font-semibold text-brand-600 hover:text-brand-800"
                                                        >
                                                          Lihat Lampiran
                                                        </button>
                                                        <span className="text-zinc-300">·</span>
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            safeDownloadFile(sub.fileUrl!, `Tugas_${sub.user?.name || "mhs"}`)
                                                          }
                                                          className="text-xs text-zinc-500 hover:text-zinc-800"
                                                        >
                                                          Unduh
                                                        </button>
                                                      </div>
                                                    )}

                                                    {/* Form inline */}
                                                    {isGradingThis && (
                                                      <div className="bg-white p-3 rounded-lg border border-brand-200 space-y-2 mt-2">
                                                        <div className="flex items-center gap-3">
                                                          <label className="text-[11px] font-semibold text-zinc-700">
                                                            Skor:
                                                            <input
                                                              type="number"
                                                              value={gradingScore}
                                                              onChange={(e) => setGradingScore(e.target.value)}
                                                              className="ml-2 w-20 px-2 py-1 rounded border border-zinc-300 text-xs font-bold"
                                                            />
                                                          </label>
                                                          <label className="text-[11px] text-zinc-500">
                                                            Maks:
                                                            <input
                                                              type="number"
                                                              value={gradingMaxScore}
                                                              onChange={(e) => setGradingMaxScore(e.target.value)}
                                                              className="ml-2 w-16 px-2 py-1 rounded border border-zinc-300 text-xs"
                                                            />
                                                          </label>
                                                        </div>

                                                        <textarea
                                                          value={gradingFeedback}
                                                          onChange={(e) => setGradingFeedback(e.target.value)}
                                                          rows={2}
                                                          placeholder="Catatan atau umpan balik dosen..."
                                                          className="w-full px-2.5 py-1.5 rounded border border-zinc-300 text-xs text-zinc-900"
                                                        />

                                                        {gradingError && (
                                                          <p className="text-xs text-rose-600">{gradingError}</p>
                                                        )}

                                                        <div className="flex items-center justify-end gap-2 pt-1">
                                                          <button
                                                            type="button"
                                                            onClick={handleCancelGrade}
                                                            className="text-xs px-2.5 py-1 text-zinc-500"
                                                          >
                                                            Batal
                                                          </button>
                                                          <button
                                                            type="button"
                                                            disabled={isSavingGrade}
                                                            onClick={() => handleSubmitGrade(assignment.id, sub.id)}
                                                            className="btn-primary text-xs py-1 px-3 rounded-lg"
                                                          >
                                                            {isSavingGrade ? "Menyimpan..." : "Simpan Nilai"}
                                                          </button>
                                                        </div>
                                                      </div>
                                                    )}

                                                    {isSuccess && (
                                                      <p className="text-xs text-emerald-600 font-semibold">
                                                        Nilai berhasil disimpan.
                                                      </p>
                                                    )}
                                                  </div>
                                                )
                                              })
                                            )}

                                            {filter === "unsubmitted" && (
                                              <div className="text-xs text-zinc-600 space-y-1">
                                                <span className="font-semibold block">
                                                  Belum Mengumpulkan ({unsubmitted.length}):
                                                </span>
                                                {unsubmitted.map((u) => (
                                                  <div key={u.id} className="text-zinc-500">
                                                    {u.name} ({u.email})
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        )
                                      })()
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* 4. Sesi Kuis & Evaluasi */}
                    {week.quizzes.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between pb-1.5 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            Kuis & Evaluasi
                          </span>
                          {isTeacher && (
                            <button
                              type="button"
                              onClick={() => onOpenCreateQuiz(`Kuis Pertemuan Minggu ${week.weekNumber}`)}
                              className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 transition-colors"
                            >
                              + Buat Kuis Baru
                            </button>
                          )}
                        </div>

                        <div className="space-y-2">
                          {week.quizzes.map((quiz) => (
                            <div
                              key={quiz.id}
                              className="p-3.5 border border-zinc-200/80 dark:border-zinc-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-zinc-900 dark:text-white">{quiz.title}</span>
                                  {quiz.isKingOfTheHill && (
                                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                                      King of the Hill
                                    </span>
                                  )}
                                </div>
                                <p className="text-zinc-500 dark:text-zinc-200 line-clamp-1">
                                  {quiz.description || "10 butir soal evaluasi pemahaman materi."}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Link
                                  href={`/quiz/${quiz.id}`}
                                  className="btn-primary text-xs py-1.5 px-3 rounded-lg font-medium"
                                >
                                  {isStudent ? "Mulai Kuis" : "Pratinjau Kuis"}
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLeaderboardSessionId(quiz.id)
                                    setLeaderboardQuizTitle(quiz.title)
                                  }}
                                  className="text-xs py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-100 font-medium"
                                >
                                  Papan Peringkat
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 5. Presensi Kehadiran */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="text-zinc-500 dark:text-zinc-200">
                        <span className="font-semibold text-zinc-800 dark:text-white">Presensi Kehadiran W{week.weekNumber}: </span>
                        <span>Check-in token atau scan QR code dosen.</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {isTeacher && (
                          <button
                            type="button"
                            onClick={() => onOpenAttendanceModal()}
                            className="font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300"
                          >
                            Buka Presensi QR
                          </button>
                        )}
                        <Link
                          href={`/attendance/${course.id}`}
                          className="font-medium text-zinc-500 dark:text-zinc-200 hover:text-zinc-800 dark:hover:text-white"
                        >
                          Riwayat Kehadiran &rarr;
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Leaderboard Modal */}
      {leaderboardSessionId && (
        <LeaderboardModal
          isOpen={true}
          onClose={() => setLeaderboardSessionId(null)}
          sessionId={leaderboardSessionId}
          quizTitle={leaderboardQuizTitle}
        />
      )}
    </div>
  )
}
