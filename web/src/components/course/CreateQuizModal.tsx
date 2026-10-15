"use client"

import { useState } from "react"
import {
  createQuizSession,
  generateQuizWithAI,
  QuizSession,
  CreateQuizQuestionPayload,
} from "@/lib/api"

interface CreateQuizModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number
  courseTitle: string
  onQuizCreated: (quiz: QuizSession) => void
}

interface ManualQuestionItem {
  question: string
  type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
  options: string[]
  correctOptionIndex: number
  correctOptionIndices: number[]
  rubric: string
  topic: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
}

export function CreateQuizModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onQuizCreated,
}: CreateQuizModalProps) {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("ai")

  // AI Tab State
  const [aiTitle, setAiTitle] = useState("")
  const [aiTopic, setAiTopic] = useState("")
  const [aiDifficulty, setAiDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [aiCount, setAiCount] = useState<number>(5)
  const [aiQuestionTypeSelection, setAiQuestionTypeSelection] = useState<
    "MIXED" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
  >("MIXED")

  // Manual Tab State
  const [manualTitle, setManualTitle] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [isKingOfTheHill, setIsKingOfTheHill] = useState(false)
  const [questions, setQuestions] = useState<ManualQuestionItem[]>([
    {
      question: "",
      type: "SINGLE_CHOICE",
      options: ["", "", "", ""],
      correctOptionIndex: 0,
      correctOptionIndices: [0],
      rubric: "",
      topic: "Umum",
      difficulty: "MEDIUM",
    },
  ])

  // General State
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  if (!isOpen) return null

  // Manual Question Management
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "",
        type: "SINGLE_CHOICE",
        options: ["", "", "", ""],
        correctOptionIndex: 0,
        correctOptionIndices: [0],
        rubric: "",
        topic: "Umum",
        difficulty: "MEDIUM",
      },
    ])
  }

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((_, i) => i !== idx))
  }

  const handleQuestionChange = <K extends keyof ManualQuestionItem>(
    idx: number,
    field: K,
    value: ManualQuestionItem[K]
  ) => {
    const updated = [...questions]
    updated[idx][field] = value
    setQuestions(updated)
  }

  const handleOptionChange = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions]
    updated[qIdx].options[optIdx] = val
    setQuestions(updated)
  }

  const handleToggleMultiChoiceOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions]
    const current = updated[qIdx].correctOptionIndices || []
    if (current.includes(optIdx)) {
      if (current.length > 1) {
        updated[qIdx].correctOptionIndices = current.filter((i) => i !== optIdx)
      }
    } else {
      updated[qIdx].correctOptionIndices = [...current, optIdx].sort()
    }
    setQuestions(updated)
  }

  // Submit AI Quiz
  const handleSubmitAI = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aiTopic.trim()) {
      setErrorMsg("Topik kuis wajib diisi untuk dibuat oleh AI.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    const questionTypes =
      aiQuestionTypeSelection === "MIXED"
        ? ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"]
        : [aiQuestionTypeSelection]

    try {
      const created = await generateQuizWithAI(courseId, {
        title: aiTitle.trim() || undefined,
        topic: aiTopic.trim(),
        difficulty: aiDifficulty,
        count: aiCount,
        questionTypes,
      })

      onQuizCreated(created)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal meng-generate kuis dengan AI.")
    } finally {
      setLoading(false)
    }
  }

  // Submit Manual Quiz
  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualTitle.trim()) {
      setErrorMsg("Judul kuis wajib diisi.")
      return
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        setErrorMsg(`Teks soal #${i + 1} belum diisi.`)
        return
      }

      if (q.type !== "ESSAY") {
        for (let o = 0; o < q.options.length; o++) {
          if (!q.options[o].trim()) {
            setErrorMsg(
              `Pilihan jawaban ${String.fromCharCode(65 + o)} pada soal #${i + 1} belum diisi.`
            )
            return
          }
        }

        if (q.type === "MULTIPLE_CHOICE" && (!q.correctOptionIndices || q.correctOptionIndices.length === 0)) {
          setErrorMsg(`Pilih minimal 1 jawaban benar untuk soal multi-opsi #${i + 1}.`)
          return
        }
      }
    }

    setLoading(true)
    setErrorMsg("")

    try {
      const formattedQuestions: CreateQuizQuestionPayload[] = questions.map((q, idx) => ({
        question: q.question.trim(),
        type: q.type,
        options: q.type === "ESSAY" ? [] : q.options.map((opt) => opt.trim()),
        correctOptionIndex: q.correctOptionIndex,
        correctOptionIndices: q.correctOptionIndices,
        rubric: q.type === "ESSAY" ? q.rubric.trim() : undefined,
        topic: q.topic.trim() || "Umum",
        difficulty: q.difficulty,
        order: idx,
      }))

      const created = await createQuizSession(courseId, {
        title: manualTitle.trim(),
        description: manualDescription.trim() || undefined,
        isKingOfTheHill,
        questions: formattedQuestions,
      })

      onQuizCreated(created)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal membuat sesi kuis manual.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 font-heading">
              Buat Sesi Asesmen Kuis Baru
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Kelas: <span className="font-semibold text-zinc-700">{courseTitle}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="flex border-b border-zinc-200 bg-zinc-50/30 px-6 gap-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("ai")
              setErrorMsg("")
            }}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "ai"
                ? "border-brand-600 text-brand-700 font-black"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <span>✨ Buat Cepat dengan AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("manual")
              setErrorMsg("")
            }}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "manual"
                ? "border-brand-600 text-brand-700 font-black"
                : "border-transparent text-zinc-500 hover:text-zinc-800"
            }`}
          >
            <span>✏️ Susun Soal Manual (Single, Multi & Esai)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ─── TAB 1: AI GENERATOR ────────────────────────────────────────── */}
          {activeTab === "ai" && (
            <form onSubmit={handleSubmitAI} className="space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-brand-50/50 p-4 rounded-xl border border-purple-200/60 space-y-2">
                <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                  <span>🤖 Asisten Generator Soal Perkuliahan</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-relaxed">
                  Cukup tentukan topik perkuliahan dan distribusi jenis soal. AI akan menyusun soal pilihan tunggal, multi opsi, hingga esai yang diperiksa otomatis oleh sistem.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 font-heading">
                  Topik Spesifik Perkuliahan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Contoh: Normalisasi Basis Data, Polimorfisme OOP, Algoritma Dijkstra..."
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 font-heading">
                  Variasi Jenis Soal
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    {
                      key: "MIXED" as const,
                      label: "Campuran",
                      desc: "Single, Multi & Esai",
                    },
                    {
                      key: "SINGLE_CHOICE" as const,
                      label: "Pilihan Tunggal",
                      desc: "1 Jawaban Benar",
                    },
                    {
                      key: "MULTIPLE_CHOICE" as const,
                      label: "Multi Opsi",
                      desc: ">1 Jawaban Benar",
                    },
                    {
                      key: "ESSAY" as const,
                      label: "Esai / Uraian",
                      desc: "Diperiksa AI",
                    },
                  ].map((t) => (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setAiQuestionTypeSelection(t.key)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        aiQuestionTypeSelection === t.key
                          ? "border-brand-600 bg-brand-50/60 ring-1 ring-brand-600"
                          : "border-zinc-200 hover:border-zinc-300 bg-white"
                      }`}
                    >
                      <div className="text-xs font-bold text-zinc-900">{t.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 font-heading">
                  Judul Sesi Kuis (Opsional)
                </label>
                <input
                  type="text"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder="Kosongkan untuk penamaan otomatis berbasis topik"
                  className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 font-heading">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) =>
                      setAiDifficulty(e.target.value as "easy" | "medium" | "hard")
                    }
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="easy">Mudah (Dasar & Definisi)</option>
                    <option value="medium">Sedang (Pemahaman & Analisis)</option>
                    <option value="hard">Sulit (Kasus Kompleks & Evaluasi)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1.5 font-heading">
                    Jumlah Butir Soal
                  </label>
                  <div className="flex gap-2">
                    {[3, 5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setAiCount(cnt)}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${
                          aiCount === cnt
                            ? "bg-purple-600 text-white border-purple-600 shadow-2xs"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                        }`}
                      >
                        {cnt} Soal
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs py-2 px-4 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="text-xs py-2 px-5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-2xs flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Sedang Meng-generate Soal...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Generate Soal Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ─── TAB 2: MANUAL BUILDER ──────────────────────────────────────── */}
          {activeTab === "manual" && (
            <form onSubmit={handleSubmitManual} className="space-y-5">
              <div className="space-y-3 pb-3 border-b border-zinc-100">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1 font-heading">
                    Judul Sesi Kuis <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Contoh: Kuis Pertemuan 4: Algoritma Pencarian & Sorting"
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 uppercase tracking-wider mb-1 font-heading">
                    Deskripsi / Petunjuk Pengerjaan
                  </label>
                  <textarea
                    rows={2}
                    value={manualDescription}
                    onChange={(e) => setManualDescription(e.target.value)}
                    placeholder="Petunjuk khusus untuk mahasiswa sebelum memulai pengerjaan kuis..."
                    className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="kingOfTheHill"
                    checked={isKingOfTheHill}
                    onChange={(e) => setIsKingOfTheHill(e.target.checked)}
                    className="rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="kingOfTheHill" className="text-xs text-zinc-700 font-medium">
                    Aktifkan Gamifikasi <strong>King of the Hill</strong> (Papan Skor Peringkat Realtime)
                  </label>
                </div>
              </div>

              {/* Dynamic Question Builder */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-zinc-800 uppercase tracking-wider font-heading">
                    Daftar Butir Soal ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="text-xs py-1 px-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 font-medium transition-colors"
                  >
                    + Tambah Soal
                  </button>
                </div>

                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-zinc-200/80">
                      <span className="font-bold text-xs text-zinc-800 font-heading">
                        Soal #{qIdx + 1}
                      </span>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Question Type Selector */}
                        <select
                          value={q.type}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIdx,
                              "type",
                              e.target.value as "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
                            )
                          }
                          className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-zinc-200 bg-white text-brand-700"
                        >
                          <option value="SINGLE_CHOICE">Pilihan Tunggal (1 Benar)</option>
                          <option value="MULTIPLE_CHOICE">Multi Opsi (&gt;1 Benar)</option>
                          <option value="ESSAY">Esai (Diperiksa AI)</option>
                        </select>

                        <select
                          value={q.difficulty}
                          onChange={(e) =>
                            handleQuestionChange(
                              qIdx,
                              "difficulty",
                              e.target.value as "EASY" | "MEDIUM" | "HARD"
                            )
                          }
                          className="text-[11px] py-1 px-2 rounded-lg border border-zinc-200 bg-white"
                        >
                          <option value="EASY">Mudah</option>
                          <option value="MEDIUM">Sedang</option>
                          <option value="HARD">Sulit</option>
                        </select>

                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1"
                            title="Hapus soal ini"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        required
                        value={q.question}
                        onChange={(e) => handleQuestionChange(qIdx, "question", e.target.value)}
                        placeholder={`Tuliskan teks pertanyaan soal #${qIdx + 1}...`}
                        className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium"
                      />
                    </div>

                    {/* Render according to Question Type */}
                    {q.type === "ESSAY" ? (
                      <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/40 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span>Rubrik Penilaian & Model Jawaban Esai (Pemeriksaan AI)</span>
                        </div>
                        <p className="text-[11px] text-zinc-600">
                          Tuliskan kata kunci konsep, argumen utama, atau model jawaban yang diinginkan. AI akan menggunakan rubrik ini untuk menilai jawaban esai mahasiswa secara otomatis.
                        </p>
                        <textarea
                          rows={3}
                          value={q.rubric}
                          onChange={(e) => handleQuestionChange(qIdx, "rubric", e.target.value)}
                          placeholder="Contoh poin penilaian: Mahasiswa harus menyebutkan 3 tahap normalisasi (1NF, 2NF, 3NF), menjelaskan penghapusan redundansi data, dan memberikan contoh dependensi fungsional..."
                          className="w-full text-xs p-2.5 rounded-lg border border-purple-200 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                      </div>
                    ) : q.type === "MULTIPLE_CHOICE" ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                          <span>Centang kotak di samping opsi untuk menandai jawaban yang benar (bisa lebih dari satu):</span>
                        </div>

                        {q.options.map((opt, optIdx) => {
                          const isCorrect = (q.correctOptionIndices || []).includes(optIdx)
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isCorrect}
                                onChange={() => handleToggleMultiChoiceOption(qIdx, optIdx)}
                                className="w-4 h-4 rounded text-brand-600 border-zinc-300 focus:ring-brand-500 cursor-pointer"
                                title="Tandai sebagai salah satu jawaban benar"
                              />
                              <span className="w-6 h-6 rounded bg-zinc-200/80 font-bold text-xs text-zinc-700 flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Pilihan jawaban ${String.fromCharCode(65 + optIdx)}...`}
                                className={`flex-1 text-xs p-2 rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                  isCorrect ? "border-brand-500 font-bold text-brand-900" : "border-zinc-200 text-zinc-800"
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      /* SINGLE CHOICE */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
                          <span>Pilih radio button di samping opsi yang merupakan kunci jawaban benar:</span>
                        </div>

                        {q.options.map((opt, optIdx) => {
                          const isCorrect = q.correctOptionIndex === optIdx
                          return (
                            <div key={optIdx} className="flex items-center gap-2">
                              <input
                                type="radio"
                                name={`correct_opt_${qIdx}`}
                                checked={isCorrect}
                                onChange={() => handleQuestionChange(qIdx, "correctOptionIndex", optIdx)}
                                className="w-4 h-4 text-brand-600 border-zinc-300 focus:ring-brand-500 cursor-pointer"
                                title="Pilih sebagai kunci jawaban"
                              />
                              <span className="w-6 h-6 rounded bg-zinc-200/80 font-bold text-xs text-zinc-700 flex items-center justify-center shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <input
                                type="text"
                                required
                                value={opt}
                                onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                                placeholder={`Pilihan jawaban ${String.fromCharCode(65 + optIdx)}...`}
                                className={`flex-1 text-xs p-2 rounded-lg border bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 ${
                                  isCorrect ? "border-brand-500 font-bold text-brand-900" : "border-zinc-200 text-zinc-800"
                                }`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs py-2 px-4 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary text-xs py-2 px-5 rounded-lg font-medium shadow-2xs flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>Menyimpan Kuis...</span>
                    </>
                  ) : (
                    <span>Simpan Sesi Kuis</span>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
