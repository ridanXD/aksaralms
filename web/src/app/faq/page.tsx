"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"

interface FAQItem {
  id: string
  category: "umum" | "mahasiswa" | "dosen" | "kuis" | "ai" | "teknis"
  question: string
  answer: string
  tags: string[]
}

const FAQ_DATA: FAQItem[] = [
  // ─── Umum ─────────────────────────────────────────────────────────────
  {
    id: "apa-itu-aksara",
    category: "umum",
    question: "Apa itu Aksara LMS?",
    answer:
      "Aksara LMS adalah platform manajemen pembelajaran terintegrasi yang menerapkan pendekatan Closed-Loop Remediation. Sistem tidak hanya mendistribusikan materi dan mencatat nilai, tetapi memetakan nilai rata-rata dan pemahaman konsep belajar setiap mahasiswa secara terukur.",
    tags: ["platform", "pengenalan", "lms", "fitur"],
  },
  {
    id: "siapa-pengguna-aksara",
    category: "umum",
    question: "Siapa saja pengguna yang didukung oleh sistem?",
    answer:
      "Aksara membedakan dua hak akses utama: Mahasiswa (mengakses silabus, modul materi, kuis berkala, presensi, dan latihan adaptif mandiri) dan Dosen/Pengajar (mengelola kelas perkuliahan, menyusun bank soal kuis, memonitor diagnostik pemahaman kelas, dan mengunduh rekapitulasi nilai).",
    tags: ["peran", "role", "dosen", "mahasiswa"],
  },
  {
    id: "keunggulan-aksara",
    category: "umum",
    question: "Apa perbedaan Aksara dengan LMS konvensional?",
    answer:
      "LMS konvensional umumnya berhenti pada pelaporan nilai akhir. Aksara menganalisis kesalahan jawaban untuk mengidentifikasi celah pemahaman spesifik (learning gap), kemudian secara otomatis menyusun materi dan latihan penguatan yang ditargetkan pada topik yang belum dikuasai.",
    tags: ["keunggulan", "closed-loop", "adaptif"],
  },

  // ─── AI & Latihan Adaptif ───────────────────────────────────────────
  {
    id: "cara-kerja-adaptive-practice",
    category: "ai",
    question: "Bagaimana cara kerja fitur Latihan Adaptif (Adaptive Practice)?",
    answer:
      "Sistem memantau riwayat pengerjaan kuis reguler. Topik dengan nilai rata-rata rendah (< 60) akan otomatis diprioritaskan dalam antrean latihan. Generator cerdas akan menghasilkan variasi soal baru dengan tingkat kesulitan bertahap (Basic, Intermediate, Advanced) untuk memantapkan pemahaman.",
    tags: ["adaptive practice", "latihan", "ai", "remediasi"],
  },
  {
    id: "apa-itu-topic-mastery-matrix",
    category: "ai",
    question: "Apa yang diukur dalam Matriks Nilai Rata-rata Topik?",
    answer:
      "Matriks Nilai Rata-rata Topik menyajikan skor capaian (skala 0–100) pada setiap pokok bahasan mata kuliah. Status dikelompokkan menjadi tiga tahap: Butuh Penguatan (<60), Berkembang (60–79), dan Mahir (≥80).",
    tags: ["nilai rata-rata", "kompetensi", "skor", "matriks"],
  },
  {
    id: "integritas-tutor-ai",
    category: "ai",
    question: "Bagaimana sistem menjaga integritas akademik saat memberikan bimbingan?",
    answer:
      "Asisten pembelajaran dipandu dengan metode bimbingan terarah (scaffolding). Sistem memberikan petunjuk metodologis, verifikasi konsep, dan penjelasan akar kekeliruan tanpa memberikan kunci jawaban instan pada asesmen aktif.",
    tags: ["ai", "tutor", "pedagogi", "integritas"],
  },

  // ─── Mahasiswa & Kuliah ─────────────────────────────────────────────
  {
    id: "cara-akses-materi",
    category: "mahasiswa",
    question: "Bagaimana alur mengakses materi dan silabus perkuliahan?",
    answer:
      "Setelah masuk ke portal, pilih menu Mata Kuliah untuk melihat daftar kelas yang terdaftar. Setiap halaman kelas memuat silabus pertemuan, dokumen materi pendukung, status presensi, dan kuis yang harus diselesaikan.",
    tags: ["materi", "silabus", "mata kuliah", "mahasiswa"],
  },
  {
    id: "mekanisme-presensi",
    category: "mahasiswa",
    question: "Bagaimana pencatatan presensi kehadiran dilakukan?",
    answer:
      "Presensi dibuka secara otomatis sesuai jadwal perkuliahan aktif. Mahasiswa dapat mengonfirmasi kehadiran melalui tombol Presensi pada modul pertemuan kelas terkait.",
    tags: ["presensi", "kehadiran", "attendance"],
  },
  {
    id: "rekap-transkrip-nilai",
    category: "mahasiswa",
    question: "Di mana mahasiswa dapat melihat rincian evaluasi dan nilai?",
    answer:
      "Rincian nilai per kuis, grafik perkembangan capaian per topik, dan rekapitulasi nilai akhir mata kuliah dapat diakses melalui menu Nilai & Transkrip (Grades).",
    tags: ["nilai", "grades", "transkrip", "evaluasi"],
  },

  // ─── Dosen & Pengelolaan ────────────────────────────────────────────
  {
    id: "dashboard-intelligence-kelas",
    category: "dosen",
    question: "Informasi apa saja yang disajikan pada Intelligence Kelas bagi Dosen?",
    answer:
      "Dashboard analitik dosen menampilkan kurva distribusi nilai kelas, daftar topik dengan tingkat kesalahan tertinggi, persentase partisipasi asesmen, serta identifikasi mahasiswa yang memerlukan pendampingan remedial.",
    tags: ["dosen", "intelligence", "analitik", "monitoring"],
  },
  {
    id: "pembuatan-kuis-dosen",
    category: "dosen",
    question: "Bagaimana proses pembuatan dan konfigurasi kuis oleh Dosen?",
    answer:
      "Dosen dapat mengakses menu Kuis & Asesmen, lalu memilih Buat Kuis. Form penyusunan memungkinkan penentuan durasi pengerjaan, batas kelulusan (passing grade), pembobotan soal, serta kunci jawaban dan pembahasan terstruktur.",
    tags: ["buat kuis", "asesmen", "soal", "dosen"],
  },
  {
    id: "ekspor-rekap-dosen",
    category: "dosen",
    question: "Apakah data penilaian dapat diekspor untuk kebutuhan akademik?",
    answer:
      "Ya. Dosen dapat melihat rekapitulasi penilaian per kelas dan mengunduh laporan nilai mahasiswa dalam format terstruktur untuk kebutuhan administrasi fakultas.",
    tags: ["ekspor", "rekap", "nilai", "dosen"],
  },

  // ─── Kuis & Asesmen ─────────────────────────────────────────────────
  {
    id: "durasi-dan-submit-kuis",
    category: "kuis",
    question: "Bagaimana ketentuan durasi dan pengumpulan jawaban kuis?",
    answer:
      "Setiap sesi kuis dilengkapi penanda waktu hitung mundur. Jawaban tersimpan secara berkala, dan bila waktu pengerjaan berakhir, seluruh jawaban yang telah dipilih akan otomatis dikumpulkan ke server.",
    tags: ["kuis", "timer", "durasi", "submit"],
  },
  {
    id: "kebijakan-retake-kuis",
    category: "kuis",
    question: "Apakah kuis dapat diulang bila nilai belum memenuhi standar?",
    answer:
      "Pengulangan kuis evaluasi resmi ditentukan oleh kebijakan dosen pengampu mata kuliah. Namun, mahasiswa dapat melakukan latihan soal mandiri pada topik terkait melalui fitur Latihan Adaptif tanpa batasan.",
    tags: ["retake", "ulang kuis", "kesempatan"],
  },

  // ─── Akun & Teknis ──────────────────────────────────────────────────
  {
    id: "kendala-login-dan-reset",
    category: "teknis",
    question: "Bagaimana mengatasi kendala akses masuk atau lupa sandi?",
    answer:
      "Untuk sesi evaluasi/demonstrasi, akun uji coba dapat diakses langsung melalui tombol cepat pada halaman login. Pengguna institusi yang mengalami kendala autentikasi dapat menghubungi administrator kampus atau IT Services Aksara.",
    tags: ["login", "password", "reset", "akun"],
  },
  {
    id: "standar-peramban",
    category: "teknis",
    question: "Peramban apa yang direkomendasikan untuk mengakses platform?",
    answer:
      "Aksara LMS mendukung peramban modern berbasis Chromium (Google Chrome, Microsoft Edge, Brave), Mozilla Firefox, dan Apple Safari versi mutakhir, baik pada perangkat komputer maupun seluler.",
    tags: ["browser", "chrome", "firefox", "kompatibilitas"],
  },
]

const CATEGORIES = [
  { id: "all", label: "Semua" },
  { id: "umum", label: "Umum" },
  { id: "ai", label: "Latihan Adaptif" },
  { id: "mahasiswa", label: "Mahasiswa" },
  { id: "dosen", label: "Dosen" },
  { id: "kuis", label: "Kuis & Asesmen" },
  { id: "teknis", label: "Akun & Teknis" },
]

export default function FAQPage() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({
    "apa-itu-aksara": true,
  })

  const toggleAccordion = (id: string) => {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {}
    FAQ_DATA.forEach((item) => {
      allOpen[item.id] = true
    })
    setOpenIds(allOpen)
  }

  const collapseAll = () => {
    setOpenIds({})
  }

  const filteredFAQs = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchCategory =
        selectedCategory === "all" || item.category === selectedCategory
      const query = searchQuery.toLowerCase().trim()
      if (!query) return matchCategory

      const matchQuestion = item.question.toLowerCase().includes(query)
      const matchAnswer = item.answer.toLowerCase().includes(query)
      const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(query))

      return matchCategory && (matchQuestion || matchAnswer || matchTags)
    })
  }, [selectedCategory, searchQuery])

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans flex flex-col antialiased">
      {/* ─── Top Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 h-16 sm:h-[68px] shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-3">
              <img src="/aksara-logo.svg" alt="Aksara Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain shrink-0" />
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-zinc-900 text-sm sm:text-base tracking-tight font-heading">
                  AKSARA <span className="text-brand-600">LMS</span>
                </span>
                <span className="text-zinc-300 text-xs select-none">/</span>
                <span className="text-xs text-zinc-500 font-medium">Pusat Bantuan</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded hover:bg-zinc-100 transition-colors"
              >
                &larr; Kembali ke Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="btn-primary text-xs py-1.5 px-3.5 rounded font-semibold"
              >
                Masuk ke Portal &rarr;
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ─── Header & Search ────────────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200 py-10 px-4 sm:px-6">
        <div className="max-w-[760px] mx-auto space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight font-heading">
              Pusat Informasi & FAQ Aksara
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
              Panduan penggunaan sistem perkuliahan, kuis evaluasi, mekanisme latihan adaptif, serta bantuan teknis akun.
            </p>
          </div>

          {/* Search Box */}
          <div className="pt-2 relative">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari topik atau pertanyaan (misal: remedi, kuis, nilai, presensi)..."
                className="w-full pl-9 pr-8 py-2.5 rounded-md border border-zinc-300 bg-zinc-50 text-xs text-zinc-900 placeholder:text-zinc-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-600 focus:border-brand-600 transition-colors"
              />
              <svg
                className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded"
                  title="Hapus pencarian"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-zinc-100">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id
              const count =
                cat.id === "all"
                  ? FAQ_DATA.length
                  : FAQ_DATA.filter((i) => i.category === cat.id).length

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-zinc-900 text-white font-semibold"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900"
                  }`}
                >
                  <span>{cat.label}</span>
                  <span className={`ml-1.5 text-[10px] ${isActive ? "text-zinc-300" : "text-zinc-400"}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── Main Accordion Content ──────────────────────────────────────── */}
      <main className="max-w-[760px] w-full mx-auto px-4 sm:px-6 py-8 flex-1 space-y-6">
        
        {/* Subheader summary */}
        <div className="flex items-center justify-between text-xs text-zinc-500 pb-2 border-b border-zinc-200">
          <span>
            Menampilkan <strong className="text-zinc-800 font-semibold">{filteredFAQs.length}</strong> pertanyaan
            {searchQuery && (
              <> untuk kata kunci <span className="text-zinc-800">"{searchQuery}"</span></>
            )}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="text-zinc-600 hover:text-zinc-900 hover:underline"
            >
              Buka Semua
            </button>
            <span className="text-zinc-300">·</span>
            <button
              onClick={collapseAll}
              className="text-zinc-600 hover:text-zinc-900 hover:underline"
            >
              Tutup Semua
            </button>
          </div>
        </div>

        {/* List */}
        {filteredFAQs.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-md p-8 text-center space-y-3">
            <p className="text-xs text-zinc-600">
              Tidak ditemukan pertanyaan yang cocok dengan <span className="font-semibold text-zinc-800">"{searchQuery}"</span>.
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              className="btn-secondary text-xs py-1.5 px-3 rounded"
            >
              Reset Pencarian
            </button>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-md divide-y divide-zinc-200">
            {filteredFAQs.map((faq) => {
              const isOpen = !!openIds[faq.id]

              return (
                <div key={faq.id} className="transition-colors">
                  <button
                    onClick={() => toggleAccordion(faq.id)}
                    className="w-full px-5 py-3.5 flex items-start justify-between gap-4 text-left hover:bg-zinc-50 transition-colors"
                    aria-expanded={isOpen}
                  >
                    <span className="text-xs sm:text-sm font-semibold text-zinc-900 font-heading leading-snug">
                      {faq.question}
                    </span>

                    <span className="text-zinc-400 mt-0.5 text-xs font-mono select-none">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs text-zinc-600 leading-relaxed bg-zinc-50/50">
                      <p className="whitespace-pre-line">{faq.answer}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Support note */}
        <div className="bg-white border border-zinc-200 rounded-md p-4 text-xs text-zinc-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-zinc-900 font-heading">
              Pertanyaan belum terjawab?
            </div>
            <div className="text-[11px] text-zinc-500 mt-0.5">
              IT Services Aksara &middot; Layanan Bantuan & Dukungan Teknis
            </div>
          </div>
          <a
            href="https://wa.me/6283836944001?text=Halo%20IT%20Services%20Aksara,%20saya%20membutuhkan%20bantuan%20terkait%20Aksara%20LMS"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-xs py-2 px-3.5 rounded font-semibold inline-flex items-center gap-1.5 shrink-0"
          >
            <span>Hubungi IT Services</span>
            <span>&rarr;</span>
          </a>
        </div>

      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-auto bg-white border-t border-zinc-200 py-4 text-xs text-zinc-500">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/aksara-logo.svg" alt="Aksara Logo" className="w-4 h-4 object-contain" />
            <span>
              <span className="font-semibold text-zinc-700 font-heading">Aksara LMS</span> &middot; Closed-Loop Educational Architecture
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">
            &copy; 2026 Aksara Platform
          </div>
        </div>
      </footer>
    </div>
  )
}
