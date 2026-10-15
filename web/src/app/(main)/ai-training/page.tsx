"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { startTrainingSession, TrainingSessionResponse, answerTrainingQuestion } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"

type QuestionTypeOption = "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"

export default function AITrainingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [topic, setTopic] = useState("")
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium")
  const [questionCount, setQuestionCount] = useState<number>(5)
  const [selectedTypes, setSelectedTypes] = useState<QuestionTypeOption[]>([
    "SINGLE_CHOICE",
    "MULTIPLE_CHOICE",
  ])
  const [session, setSession] = useState<(TrainingSessionResponse & { preAccuracy?: number }) | null>(null)
  const [currentQ, setCurrentQ] = useState(0)
  const [selectedSingle, setSelectedSingle] = useState<string | null>(null)
  const [selectedMultiple, setSelectedMultiple] = useState<string[]>([])
  const [essayAnswer, setEssayAnswer] = useState<string>("")
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean
    correctAnswer: string
    explanation: string | null
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [finished, setFinished] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [masteryOutcome, setMasteryOutcome] = useState<{
    preMastery: number
    postMastery: number
    delta: number
    trend: string
    isResolved?: boolean
  } | null>(null)
  const [showConceptIntro, setShowConceptIntro] = useState(true)

  useEffect(() => {
    const topicParam = searchParams.get("topic")
    if (topicParam) {
      setTopic(topicParam)
    }
  }, [searchParams])

  const toggleType = (type: QuestionTypeOption) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return // Keep at least one type checked
      setSelectedTypes(selectedTypes.filter((t) => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  const handleStart = async () => {
    if (!topic.trim() || loading || selectedTypes.length === 0) return
    setError("")
    setLoading(true)
    try {
      const res = await startTrainingSession(topic, difficulty, questionCount, selectedTypes)
      setSession(res)
      setShowConceptIntro(true)
      setCurrentQ(0)
      setSelectedSingle(null)
      setSelectedMultiple([])
      setEssayAnswer("")
      setAnswerResult(null)
      setCorrectCount(0)
      setMasteryOutcome(null)
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || "Latihan adaptif tidak dapat dimulai saat ini.")
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerSubmit = async (customAnswer?: string) => {
    if (!session || answerResult) return
    const question = session.questions[currentQ]
    if (!question?.id) return

    const qType = question.type || (question.options && question.options.length > 0 ? "SINGLE_CHOICE" : "ESSAY")
    let finalAnswer = ""

    if (customAnswer !== undefined) {
      finalAnswer = customAnswer
    } else if (qType === "SINGLE_CHOICE") {
      if (!selectedSingle) return
      finalAnswer = selectedSingle
    } else if (qType === "MULTIPLE_CHOICE") {
      if (selectedMultiple.length === 0) return
      finalAnswer = selectedMultiple.join(", ")
    } else if (qType === "ESSAY") {
      if (!essayAnswer.trim()) return
      finalAnswer = essayAnswer.trim()
    }

    try {
      const result = await answerTrainingQuestion(question.id, finalAnswer)
      setAnswerResult(result)
      if (result.correct) setCorrectCount((c) => c + 1)
      if (result.masteryOutcome) {
        setMasteryOutcome(result.masteryOutcome)
      }
    } catch {
      setError("Gagal mengirim jawaban")
    }
  }

  const nextQuestion = () => {
    if (session && currentQ < session.questions.length - 1) {
      setCurrentQ((q) => q + 1)
      setSelectedSingle(null)
      setSelectedMultiple([])
      setEssayAnswer("")
      setAnswerResult(null)
    } else {
      setFinished(true)
    }
  }

  // ─── 1. Setup & Configuration Screen ────────────────────────────
  if (!session) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Banner Card with Downward Shadow */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-down">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-xs"></span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Closed-Loop Remediation Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-heading tracking-tight mt-1.5">
            Latihan Remedial Adaptif
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-200 mt-1.5 leading-relaxed max-w-2xl">
            Sistem menyusun materi konsep terarah dan latihan adaptif bertenaga AI berdasarkan titik kelemahan topik belajarmu.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-sm font-medium flex items-center gap-2.5 shadow-sm">
            <svg className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Main Configuration Card with Deep Downward Shadow */}
        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-6">
          
          {/* Topik Input */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800 dark:text-white block font-heading">
              Topik yang Ingin Diperkuat
            </label>
            <input
              type="text"
              placeholder="Contoh: Normalisasi Basis Data, SQL JOIN, Closures, Binary Search, Tree & Graph"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all"
            />
            <div className="pt-1 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-zinc-400 dark:text-zinc-300 font-medium">Pilihan cepat:</span>
              {["Stack", "Queue", "Complexity", "Binary Search", "Tree & Graph", "Normalisasi"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTopic(t)}
                  className={`text-xs px-3.5 py-1 rounded-lg border transition-all hover:-translate-y-0.5 ${
                    topic === t
                      ? "bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border-brand-300 dark:border-brand-700 font-bold ring-1 ring-brand-300 shadow-sm"
                      : "bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-750 shadow-xs"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Opsi Jumlah Soal */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800 dark:text-white block font-heading">
              Jumlah Soal Latihan
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-3.5 px-4 rounded-xl border text-center transition-all cursor-pointer hover:-translate-y-0.5 ${
                    questionCount === count
                      ? "border-brand-600 bg-brand-50/80 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 font-bold ring-2 ring-brand-600 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-800 shadow-sm"
                  }`}
                >
                  <div className="text-base sm:text-lg font-heading font-bold">{count} Soal</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5">Sesi Adaptif</div>
                </button>
              ))}
            </div>
          </div>

          {/* Opsi Jenis Soal (Checkbox Centang) */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800 dark:text-white block font-heading">
              Jenis Soal (Bisa Centang Lebih Dari Satu)
            </label>
            <p className="text-xs text-zinc-500 dark:text-zinc-300">
              Pilih variasi model pertanyaan yang ingin diujikan oleh AI:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                {
                  id: "SINGLE_CHOICE" as const,
                  title: "Pilihan Ganda",
                  desc: "1 Jawaban Benar",
                },
                {
                  id: "MULTIPLE_CHOICE" as const,
                  title: "Multi Option",
                  desc: "Pilih Lebih Dari 1 Opsi",
                },
                {
                  id: "ESSAY" as const,
                  title: "Uraian / Essay",
                  desc: "Penalaran Konsep",
                },
              ].map((item) => {
                const isChecked = selectedTypes.includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleType(item.id)}
                    className={`w-full text-left flex items-start gap-3.5 p-4 rounded-xl border transition-all cursor-pointer select-none hover:-translate-y-0.5 ${
                      isChecked
                        ? "border-brand-600 bg-brand-50/80 dark:bg-brand-950/50 text-zinc-900 dark:text-white ring-2 ring-brand-600 shadow-md"
                        : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-800 shadow-sm"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isChecked
                          ? "bg-brand-600 text-white shadow-xs"
                          : "border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isChecked && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold font-heading text-zinc-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-300 font-normal">
                        {item.desc}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tingkat Kesulitan */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-800 dark:text-white block font-heading">
              Tingkat Kesulitan Soal
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {[
                { value: "easy" as const, label: "Dasar (Easy)", desc: "Konsep & Definisi Teoretis" },
                { value: "medium" as const, label: "Menengah (Medium)", desc: "Aplikasi Kasus & Analisis" },
                { value: "hard" as const, label: "Tantangan (Hard)", desc: "Problem Solving Kompleks" },
              ].map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDifficulty(d.value)}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer hover:-translate-y-0.5 ${
                    difficulty === d.value
                      ? "border-brand-600 bg-brand-50/80 dark:bg-brand-950/50 text-brand-950 dark:text-brand-200 font-bold ring-2 ring-brand-600 shadow-md"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 bg-white dark:bg-zinc-800 shadow-sm"
                  }`}
                >
                  <div className="font-bold text-sm font-heading">{d.label}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-300 mt-1">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button with Brand Downward Shadow */}
          <button
            onClick={handleStart}
            disabled={loading || !topic.trim() || selectedTypes.length === 0}
            className="btn-primary text-sm sm:text-base w-full py-3.5 rounded-xl shadow-brand-down font-bold disabled:opacity-50 mt-4 transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? "Menyiapkan Materi & Soal Adaptif..." : `Mulai Sesi Remedial Adaptif (${questionCount} Soal) \u2192`}
          </button>
        </div>
      </div>
    )
  }

  // ─── 2. Concept Overview & Key Insights Screen ───────────────────
  if (showConceptIntro && session.explanation) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-down">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-600 shadow-xs"></span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">
              Panduan Konsep Kunci
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-heading tracking-tight mt-1.5">
            {session.topic}
          </h1>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-200 mt-1.5 leading-relaxed">
            Pelajari rangkuman materi terarah berikut sebelum menguji pemahaman Anda pada latihan praktik.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-5">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 font-heading mb-3 flex items-center gap-2">
              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>Penjelasan Konsep Inti</span>
            </h3>
            <div className="text-sm sm:text-base text-zinc-700 dark:text-zinc-100 leading-relaxed whitespace-pre-line bg-zinc-50/80 dark:bg-zinc-800/80 p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 shadow-2xs">
              {session.explanation}
            </div>
          </div>

          {session.example && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 font-heading mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Contoh Kasus & Ilustrasi</span>
              </h3>
              <div className="p-5 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed shadow-md overflow-x-auto">
                {session.example}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowConceptIntro(false)}
            className="btn-primary text-sm sm:text-base w-full py-3.5 rounded-xl shadow-brand-down font-bold mt-3 hover:-translate-y-0.5 transition-all"
          >
            Lanjut ke Latihan Praktik ({session.questions.length} Soal) &rarr;
          </button>
        </div>
      </div>
    )
  }

  // ─── 3. Final Completion & Evaluation Screen ─────────────────────
  if (finished) {
    const postPct = session.questions.length > 0 ? Math.round((correctCount / session.questions.length) * 100) : 0
    const prePct = session.preAccuracy ?? 50
    const delta = postPct - prePct

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-6 sm:p-8 shadow-down text-center space-y-2">
          <Badge variant="success">Sesi Remedial Selesai</Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-heading tracking-tight mt-2">
            Hasil Evaluasi Topik: {session.topic}
          </h1>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-300 max-w-xl mx-auto">
            Akurasi pre vs post training telah dihitung dan nilai rata-rata penguasaan topik telah diperbarui secara otomatis.
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-6">
          {/* Pre vs Post Comparison Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            <div className="p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
                Sebelum Latihan (Pre)
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-zinc-800 dark:text-white font-heading mt-2">
                {prePct}%
              </div>
              <div className="text-xs text-zinc-400 dark:text-zinc-300 mt-1">Baseline Akurasi Kuis</div>
            </div>

            <div className="p-5 sm:p-6 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-sm">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Sesudah Latihan (Post)
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 dark:text-emerald-400 font-heading mt-2">
                {postPct}%
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold mt-1">
                {delta >= 0 ? `+${delta}% Peningkatan Akurasi` : `${delta}% Penurunan`}
              </div>
            </div>
          </div>

          <div className="text-center py-2 border-y border-zinc-100 dark:border-zinc-800">
            <div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white font-heading">
              {correctCount} / {session.questions.length} Soal
            </div>
            <div className="text-sm text-zinc-500 dark:text-zinc-300 mt-1">Jawaban Terkonfirmasi Benar</div>
          </div>

          {masteryOutcome && (
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 space-y-2 shadow-2xs">
              <div className="font-bold flex items-center justify-between">
                <span>Nilai Rata-rata Topik Diperbarui:</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold text-base">
                  {masteryOutcome.preMastery} &rarr; {masteryOutcome.postMastery} (
                  {masteryOutcome.delta >= 0 ? `+${masteryOutcome.delta}` : masteryOutcome.delta} poin)
                </span>
              </div>
              {masteryOutcome.isResolved && (
                <div className="text-emerald-700 dark:text-emerald-300 font-semibold text-xs sm:text-sm pt-1">
                  ✓ Target nilai rata-rata topik telah tercapai (&ge; 70).
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                setSession(null)
                setFinished(false)
                setCurrentQ(0)
                setSelectedSingle(null)
                setSelectedMultiple([])
                setEssayAnswer("")
                setAnswerResult(null)
                setCorrectCount(0)
                setMasteryOutcome(null)
              }}
              className="btn-secondary text-sm py-3.5 rounded-xl font-semibold shadow-sm hover:-translate-y-0.5 transition-all"
            >
              Latih Topik Lain
            </button>
            <Link
              href="/dashboard"
              className="btn-primary text-sm py-3.5 rounded-xl text-center font-bold shadow-brand-down hover:-translate-y-0.5 transition-all"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── 4. Active Question View ─────────────────────────────────────
  const question = session.questions[currentQ]
  if (!question) return <div className="text-zinc-400 dark:text-zinc-300 text-sm text-center py-10">Soal tidak tersedia</div>

  const qType = question.type || (question.options && question.options.length > 0 ? "SINGLE_CHOICE" : "ESSAY")

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Progress header bar with Downward Shadow */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 p-5 sm:p-6 shadow-down space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <span className="text-xs sm:text-sm font-bold text-brand-700 dark:text-brand-300 uppercase tracking-wider font-heading">
              {session.topic}
            </span>
            <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mt-0.5">
              Soal {currentQ + 1} dari {session.questions.length}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 uppercase shadow-2xs">
              {qType === "SINGLE_CHOICE" ? "Pilihan Ganda" : qType === "MULTIPLE_CHOICE" ? "Multi Option" : "Essay / Uraian"}
            </span>
            <Badge variant="neutral">Tingkat {session.difficulty}</Badge>
          </div>
        </div>

        <ProgressBar value={((currentQ + 1) / session.questions.length) * 100} size="md" />
      </div>

      {/* Main Question Card with Deep Downward Shadow */}
      <div className="p-6 sm:p-8 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-6">
        <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white leading-snug font-heading">
          {question.question}
        </h2>

        {/* ─── Mode A: Single Choice (Pilihan Ganda) ─── */}
        {qType === "SINGLE_CHOICE" && (
          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              let optStyle = "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-700/80 shadow-sm hover:shadow-card hover:-translate-y-0.5"

              if (selectedSingle) {
                if (opt === answerResult?.correctAnswer) {
                  optStyle = "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md"
                } else if (selectedSingle === opt && !answerResult?.correct) {
                  optStyle = "border-rose-500 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 font-bold ring-2 ring-rose-500 dark:ring-rose-400 shadow-md"
                } else {
                  optStyle = "border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-400 opacity-50 shadow-none"
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={!!selectedSingle}
                  onClick={() => {
                    setSelectedSingle(opt)
                    handleAnswerSubmit(opt)
                  }}
                  className={`w-full text-left p-4 sm:p-4.5 rounded-xl border text-sm sm:text-base leading-relaxed transition-all cursor-pointer active:translate-y-0 ${optStyle}`}
                >
                  <div className="flex items-start gap-3.5">
                    <span className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-200 shrink-0 mt-0.5 shadow-2xs">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="pt-0.5">{opt}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* ─── Mode B: Multiple Choice (Multi Option) ─── */}
        {qType === "MULTIPLE_CHOICE" && (
          <div className="space-y-4">
            <div className="space-y-3">
              {question.options.map((opt, idx) => {
                const isSelected = selectedMultiple.includes(opt)
                const isAnswerSubmitted = !!answerResult

                let optStyle = "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-600 hover:bg-zinc-50/80 dark:hover:bg-zinc-700/80 shadow-sm hover:shadow-card hover:-translate-y-0.5"
                if (isSelected) {
                  optStyle = "border-brand-600 dark:border-brand-500 bg-brand-50/80 dark:bg-brand-950/60 text-brand-950 dark:text-white font-semibold ring-2 ring-brand-600 dark:ring-brand-400 shadow-md"
                }

                if (isAnswerSubmitted) {
                  const correctItems = (answerResult.correctAnswer || "").split(",").map((s) => s.trim().toLowerCase())
                  const optNormalized = opt.trim().toLowerCase()
                  if (correctItems.includes(optNormalized)) {
                    optStyle = "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 font-bold ring-2 ring-emerald-500 dark:ring-emerald-400 shadow-md"
                  } else if (isSelected && !correctItems.includes(optNormalized)) {
                    optStyle = "border-rose-500 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-100 font-bold ring-2 ring-rose-500 dark:ring-rose-400 shadow-md"
                  } else {
                    optStyle = "border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-400 opacity-50 shadow-none"
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={isAnswerSubmitted}
                    onClick={() => {
                      if (isAnswerSubmitted) return
                      if (isSelected) {
                        setSelectedMultiple(selectedMultiple.filter((item) => item !== opt))
                      } else {
                        setSelectedMultiple([...selectedMultiple, opt])
                      }
                    }}
                    className={`w-full text-left flex items-start gap-3.5 p-4 sm:p-4.5 rounded-xl border text-sm sm:text-base leading-relaxed cursor-pointer transition-all active:translate-y-0 ${optStyle}`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-brand-600 text-white shadow-xs"
                          : "border-2 border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-zinc-900 dark:text-zinc-100">{opt}</span>
                  </button>
                )
              })}
            </div>

            {!answerResult && (
              <button
                type="button"
                disabled={selectedMultiple.length === 0}
                onClick={() => handleAnswerSubmit()}
                className="btn-primary text-sm sm:text-base w-full py-3.5 rounded-xl shadow-brand-down font-bold disabled:opacity-50 hover:-translate-y-0.5 transition-all"
              >
                Kirim Jawaban Multi ({selectedMultiple.length} Opsi Dipilih)
              </button>
            )}
          </div>
        )}

        {/* ─── Mode C: Essay / Uraian ─── */}
        {qType === "ESSAY" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700 dark:text-zinc-200 block font-heading">
                Tuliskan Uraian Jawaban Anda:
              </label>
              <textarea
                rows={5}
                disabled={!!answerResult}
                value={essayAnswer}
                onChange={(e) => setEssayAnswer(e.target.value)}
                placeholder="Tuliskan analisis, definisi, atau langkah implementasi secara rinci (minimal 20 karakter)..."
                className="w-full px-4 py-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-transparent bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white disabled:bg-zinc-50 dark:disabled:bg-zinc-900/50 disabled:text-zinc-600 dark:disabled:text-zinc-400 shadow-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all"
              />
              <div className="text-xs text-zinc-400 dark:text-zinc-300 text-right font-medium">
                {essayAnswer.length} karakter
              </div>
            </div>

            {!answerResult && (
              <button
                type="button"
                disabled={essayAnswer.trim().length < 10}
                onClick={() => handleAnswerSubmit()}
                className="btn-primary text-sm sm:text-base w-full py-3.5 rounded-xl shadow-brand-down font-bold disabled:opacity-50 hover:-translate-y-0.5 transition-all"
              >
                Kirim Jawaban Essay
              </button>
            )}
          </div>
        )}

        {/* Immediate Pedagogical Feedback Box */}
        {answerResult && (
          <div
            className={`p-5 rounded-xl text-sm leading-relaxed border shadow-sm ${
              answerResult.correct
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800/60"
                : "bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 border-rose-200 dark:border-rose-800/60"
            }`}
          >
            <div className="font-bold font-heading text-base mb-1.5 flex items-center gap-2">
              <span>{answerResult.correct ? "✓ Jawaban Benar & Tepat" : "✕ Evaluasi Jawaban"}</span>
            </div>
            {answerResult.explanation && (
              <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed bg-white/80 dark:bg-zinc-900/80 p-3.5 rounded-lg border border-zinc-200/60 dark:border-zinc-800 mt-2 shadow-2xs">
                {answerResult.explanation}
              </p>
            )}
          </div>
        )}
      </div>

      {answerResult && (
        <button
          onClick={nextQuestion}
          className="btn-primary text-sm sm:text-base w-full py-3.5 rounded-xl shadow-brand-down font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          {currentQ < session.questions.length - 1 ? "Soal Berikutnya \u2192" : "Lihat Hasil Evaluasi Remedial \u2192"}
        </button>
      )}
    </div>
  )
}
