"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  fetchQuizSession,
  QuizSession,
  submitAnswer,
  QuizAnswerResult,
  fetchQuizResults,
  QuizResult,
  fetchLeaderboard,
  LeaderboardResponse,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { LeaderboardModal } from "@/components/quiz/LeaderboardModal"

export default function QuizPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQ, setCurrentQ] = useState(0)

  // Question Inputs
  const [selected, setSelected] = useState<number | null>(null)
  const [selectedMulti, setSelectedMulti] = useState<number[]>([])
  const [essayText, setEssayText] = useState("")

  const [answerResult, setAnswerResult] = useState<QuizAnswerResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [finished, setFinished] = useState(false)
  const [results, setResults] = useState<QuizResult | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse | null>(null)
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false)
  const [elapsedMs, setElapsedMs] = useState(0)
  const startTime = useRef(Date.now())

  useEffect(() => {
    fetchQuizSession(parseInt(sessionId))
      .then(setSession)
      .catch(() => router.push("/quiz"))
      .finally(() => setLoading(false))
  }, [sessionId, router])

  // Live timer tick for active question
  useEffect(() => {
    if (answerResult || submitting || finished) return
    setElapsedMs(0)
    startTime.current = Date.now()
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startTime.current)
    }, 100)
    return () => clearInterval(timer)
  }, [currentQ, answerResult, submitting, finished])

  const question = session?.quizQuestions?.[currentQ]
  const total = session?.quizQuestions?.length || 0
  const qType = question?.type || "SINGLE_CHOICE"

  // Single Choice Answer
  const handleSingleAnswer = async (optionId: number) => {
    if (!question || answerResult || submitting) return
    setSelected(optionId)
    setSubmitting(true)
    const elapsed = Date.now() - startTime.current
    try {
      const result = await submitAnswer({
        sessionId: session!.id,
        questionId: question.id,
        optionId,
        responseTimeMs: elapsed,
      })
      setAnswerResult(result)
    } catch {
      setAnswerResult({ correct: false, points: 0, speedBonus: 0, correctAnswer: "" })
    } finally {
      setSubmitting(false)
    }
  }

  // Multiple Choice Toggle
  const handleToggleMulti = (optId: number) => {
    if (answerResult || submitting) return
    setSelectedMulti((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    )
  }

  // Submit Multiple Choice
  const handleSubmitMulti = async () => {
    if (!question || answerResult || submitting || selectedMulti.length === 0) return
    setSubmitting(true)
    const elapsed = Date.now() - startTime.current
    try {
      const result = await submitAnswer({
        sessionId: session!.id,
        questionId: question.id,
        selectedOptionIds: selectedMulti,
        responseTimeMs: elapsed,
      })
      setAnswerResult(result)
    } catch {
      setAnswerResult({ correct: false, points: 0, speedBonus: 0, correctAnswer: "" })
    } finally {
      setSubmitting(false)
    }
  }

  // Submit Essay
  const handleSubmitEssay = async () => {
    if (!question || answerResult || submitting || !essayText.trim()) return
    setSubmitting(true)
    const elapsed = Date.now() - startTime.current
    try {
      const result = await submitAnswer({
        sessionId: session!.id,
        questionId: question.id,
        essayAnswer: essayText.trim(),
        responseTimeMs: elapsed,
      })
      setAnswerResult(result)
    } catch {
      setAnswerResult({
        correct: false,
        points: 0,
        speedBonus: 0,
        aiScore: 0,
        aiFeedback: "Gagal menghubungkan ke AI penilai. Coba kirim ulang.",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const nextQuestion = () => {
    if (currentQ < total - 1) {
      setCurrentQ((q) => q + 1)
      setSelected(null)
      setSelectedMulti([])
      setEssayText("")
      setAnswerResult(null)
      startTime.current = Date.now()
    } else {
      finishQuiz()
    }
  }

  const finishQuiz = async () => {
    setFinished(true)
    try {
      const [r, lb] = await Promise.all([
        fetchQuizResults(parseInt(sessionId)),
        fetchLeaderboard(parseInt(sessionId)),
      ])
      setResults(r)
      setLeaderboard(lb)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!session) return <div className="text-rose-600 text-xs font-semibold">Kuis tidak ditemukan</div>

  // ─── Quiz Results & AI Evaluation Screen ────────────────────────────
  if (finished && results && leaderboard) {
    return (
      <div className="max-w-xl mx-auto space-y-5">
        <div className="space-y-1">
          <Badge variant="success">Asesmen Kuis Selesai</Badge>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-1">{session.title}</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-300">
            Hasil evaluasi kuis telah diperiksa oleh sistem dan nilai rata-rata topik telah disinkronkan.
          </p>
        </div>

        {/* Total Score & Quick Metrics */}
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg text-center space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
            Total Skor Perolehan
          </div>
          <div className="text-4xl font-bold text-brand-600 dark:text-brand-400 font-heading tracking-tight">
            {results.totalScore}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                {results.correctCount}{" "}
                <span className="text-xs text-zinc-400 dark:text-zinc-300 font-normal">/ {results.totalQuestions}</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-300">Jawaban Benar</div>
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
                {results.avgResponseMs} <span className="text-xs text-zinc-400 dark:text-zinc-300 font-normal">ms</span>
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-300">Waktu Respon Rata-rata</div>
            </div>
          </div>
        </div>

        {/* ─── AI Evaluation & Summary Section ────────────────────────────── */}
        {(results.aiSummary || results.aiEvaluation || results.aiRecommendations) && (
          <div className="p-5 rounded-2xl border border-purple-200 dark:border-purple-800/60 bg-gradient-to-br from-purple-50/50 via-white to-brand-50/30 dark:from-purple-950/30 dark:via-zinc-900 dark:to-brand-950/20 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-sm">
                ✨
              </span>
              <div>
                <h3 className="text-xs font-bold text-purple-950 dark:text-purple-200 font-heading uppercase tracking-wider">
                  Rangkuman & Evaluasi AI
                </h3>
                <p className="text-[10px] text-purple-700 dark:text-purple-300">
                  Analisis pemahaman konsep & rekomendasi pembelajaran otomatis
                </p>
              </div>
            </div>

            {results.aiSummary && (
              <div className="p-3 bg-white/90 dark:bg-zinc-800/90 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs text-zinc-800 dark:text-zinc-100 space-y-1">
                <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 block font-heading">
                  📌 Rangkuman Hasil Asesmen:
                </span>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-200">{results.aiSummary}</p>
              </div>
            )}

            {results.aiEvaluation && (
              <div className="p-3 bg-white/90 dark:bg-zinc-800/90 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs text-zinc-800 dark:text-zinc-100 space-y-1">
                <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 block font-heading">
                  🔍 Evaluasi Pemahaman & Titik Kritis:
                </span>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-200">{results.aiEvaluation}</p>
              </div>
            )}

            {results.aiRecommendations && (
              <div className="p-3 bg-white/90 dark:bg-zinc-800/90 rounded-xl border border-purple-100 dark:border-purple-900/50 text-xs text-zinc-800 dark:text-zinc-100 space-y-1">
                <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 block font-heading">
                  💡 Rekomendasi Langkah Selanjutnya:
                </span>
                <p className="leading-relaxed text-zinc-700 dark:text-zinc-200">{results.aiRecommendations}</p>
              </div>
            )}
          </div>
        )}

        {/* King of the Hill Victory Banner if user is King */}
        {leaderboard.kingOfTheHill?.userId === user?.id && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white text-center space-y-2 shadow-[0_15px_35px_-5px_rgba(245,158,11,0.4)] animate-in zoom-in-95">
            <div className="text-4xl animate-bounce">👑</div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              SELAMAT! KAMU ADALAH THE NEW KING OF THE HILL!
            </h2>
            <p className="text-xs text-amber-100 leading-relaxed max-w-md mx-auto">
              Kamu berhasil menaklukkan soal sangat sulit dengan akurasi tertinggi dan waktu respon tercepat!
            </p>
          </div>
        )}

        {/* ─── King of the Hill Championship Leaderboard ─────────────────── */}
        <div className="p-5 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">👑</span>
              <div>
                <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white font-heading">
                  Papan Peringkat King of the Hill
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-300">
                  Diurutkan berdasarkan <strong>paling benar</strong> lalu <strong>paling cepat</strong>
                </p>
              </div>
            </div>
            <Badge variant="warning">Leaderboard Resmi</Badge>
          </div>

          {/* King Highlight Card */}
          {leaderboard.kingOfTheHill && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-amber-950/40 border border-amber-300 dark:border-amber-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-amber-950 font-black flex items-center justify-center text-lg shadow-xs">
                  👑
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-amber-300">
                    The Reigning King
                  </div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5">
                    <span>{leaderboard.kingOfTheHill.name}</span>
                    {leaderboard.kingOfTheHill.userId === user?.id && (
                      <span className="text-[10px] font-extrabold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
                        Kamu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200 dark:border-amber-800">
                <div className="font-black text-sm sm:text-base text-amber-900 dark:text-amber-300 font-heading">
                  {leaderboard.kingOfTheHill.score} pts
                </div>
                <div className="text-[10px] text-zinc-600 dark:text-zinc-300 flex items-center gap-2 mt-0.5 font-medium">
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">
                    ✓ {leaderboard.kingOfTheHill.correctCount}/{leaderboard.totalQuestions || total} Benar
                  </span>
                  <span>•</span>
                  <span className="text-sky-700 dark:text-sky-300 font-bold">
                    ⚡ {(leaderboard.kingOfTheHill.avgResponseMs / 1000).toFixed(2)}s avg
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard Table */}
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {leaderboard.entries.map((e, idx) => {
              const isCurrentUser = e.userId === user?.id
              const isKing = idx === 0
              return (
                <div
                  key={e.userId}
                  className={`py-2.5 px-3 flex items-center justify-between text-xs transition-colors ${
                    isCurrentUser
                      ? "bg-brand-50/70 dark:bg-brand-950/40 border-l-4 border-l-brand-600 font-medium"
                      : isKing
                      ? "bg-amber-50/40 dark:bg-amber-950/20"
                      : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                        isKing
                          ? "bg-amber-400 text-amber-950 shadow-xs"
                          : idx === 1
                          ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white"
                          : idx === 2
                          ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300"
                      }`}
                    >
                      {isKing ? "👑" : `#${e.rank}`}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{e.name}</span>
                        {isCurrentUser && (
                          <span className="text-[9px] bg-brand-600 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                            Kamu
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-300 flex items-center gap-1.5 mt-0.5">
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                          {e.correctCount}/{leaderboard.totalQuestions || total} Benar
                        </span>
                        <span>•</span>
                        <span className="text-sky-700 dark:text-sky-300 font-semibold">
                          ⏱️ {(e.avgResponseMs / 1000).toFixed(2)}s avg
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-brand-600 dark:text-brand-300 font-heading">
                      {e.score} pts
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Identified Weak Topics */}
        {results.weakTopics.length > 0 && (
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider font-heading">
                  Titik Lemah Terdeteksi (Weak Topics)
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-300">
                  Sistem merekomendasikan topik berikut untuk latihan remedial
                </p>
              </div>
              <Badge variant="danger">{results.weakTopics.length} Topik</Badge>
            </div>

            <div className="space-y-1.5">
              {results.weakTopics.map((wt) => (
                <div
                  key={wt.topic}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <span className="font-bold text-zinc-900 dark:text-white font-heading">{wt.topic}</span>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-0.5">
                      Akurasi: {wt.correct}/{wt.total} ({Math.round(wt.accuracy * 100)}%)
                    </div>
                  </div>
                  <Link
                    href={`/ai-training?topic=${encodeURIComponent(wt.topic)}`}
                    className="btn-primary text-xs py-1 px-3 rounded flex-shrink-0"
                  >
                    Latih Topik Ini &rarr;
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="btn-secondary text-xs py-2 w-full rounded-lg text-center font-medium">
            Kembali ke Dashboard
          </Link>
          <Link href="/courses" className="btn-primary text-xs py-2 w-full rounded-lg text-center font-medium">
            Pilih Mata Kuliah Lain
          </Link>
        </div>
      </div>
    )
  }

  // ─── Active Question Interface ──────────────────────────────────────
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider">
              {session.title}
            </span>
            {session.isKingOfTheHill && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                <span>👑</span>
                <span>King of the Hill</span>
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-300 mt-0.5">
            Soal {currentQ + 1} dari {total}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {question && (
            <div className="flex items-center gap-1.5 mr-1">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  qType === "ESSAY"
                    ? "bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : qType === "MULTIPLE_CHOICE"
                    ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-750"
                }`}
              >
                {qType === "ESSAY"
                  ? "Soal Esai"
                  : qType === "MULTIPLE_CHOICE"
                  ? "Multi Opsi"
                  : "Pilihan Tunggal"}
              </span>

              <Badge
                variant={
                  question.difficulty === "EASY"
                    ? "success"
                    : question.difficulty === "MEDIUM"
                    ? "warning"
                    : "danger"
                }
              >
                {question.difficulty === "EASY"
                  ? "Mudah"
                  : question.difficulty === "MEDIUM"
                  ? "Sedang"
                  : "Sulit"}
              </Badge>
            </div>
          )}

          {/* Live Stopwatch */}
          <div className="flex items-center gap-1.5 bg-zinc-900 text-white px-2.5 py-1 rounded-xl text-xs font-mono font-bold shadow-2xs">
            <span>⏱️</span>
            <span>{(elapsedMs / 1000).toFixed(1)}s</span>
          </div>

          {session.isKingOfTheHill && (
            <button
              type="button"
              onClick={() => setShowLeaderboardModal(true)}
              className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-700/60 px-2.5 py-1 rounded-xl transition-colors inline-flex items-center gap-1 shadow-2xs"
              title="Lihat Papan Skor"
            >
              <span>🏆</span>
              <span className="hidden sm:inline">Leaderboard</span>
            </button>
          )}
        </div>
      </div>

      <ProgressBar value={((currentQ + 1) / total) * 100} size="sm" />

      {question && (
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-4">
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
            Topik: {question.topic}
          </div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-white leading-snug font-heading">
            {question.question}
          </h2>

          {/* ─── Type 1: ESSAY QUESTION ──────────────────────────────────── */}
          {qType === "ESSAY" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                  Uraikan jawabanmu secara lengkap dan terstruktur:
                </label>
                <textarea
                  rows={5}
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                  disabled={!!answerResult || submitting}
                  placeholder="Tuliskan analisis, argumen, dan penjelasan konsep di sini..."
                  className="w-full text-xs p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed font-sans disabled:bg-zinc-50 dark:disabled:bg-zinc-800/50"
                />
                <div className="flex justify-between text-[11px] text-zinc-400 dark:text-zinc-300">
                  <span>{essayText.split(/\s+/).filter(Boolean).length} kata</span>
                  <span>Diperiksa otomatis oleh Asisten Dosen AI</span>
                </div>
              </div>

              {!answerResult && (
                <button
                  type="button"
                  onClick={handleSubmitEssay}
                  disabled={submitting || !essayText.trim()}
                  className="w-full text-xs py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      <span>🤖 AI Sedang Memeriksa Jawabanmu...</span>
                    </>
                  ) : (
                    <span>Periksa Jawaban dengan AI ✨</span>
                  )}
                </button>
              )}
            </div>
          )}

          {/* ─── Type 2: MULTIPLE_CHOICE (MULTI OPSI) ─────────────────────── */}
          {qType === "MULTIPLE_CHOICE" && (
            <div className="space-y-3">
              <div className="text-xs text-blue-800 dark:text-blue-200 bg-blue-50/80 dark:bg-blue-950/40 p-2.5 rounded-lg border border-blue-200 dark:border-blue-800 font-medium">
                Pilihlah <strong>satu atau lebih</strong> jawaban yang menurutmu benar:
              </div>

              <div className="space-y-2">
                {question.options?.map((opt, idx) => {
                  const isChecked = selectedMulti.includes(opt.id)
                  const isCorrectAnswer = answerResult?.correctAnswer?.includes(opt.text)

                  let optStyle =
                    "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"

                  if (answerResult) {
                    if (isCorrectAnswer) {
                      optStyle = "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold"
                    } else if (isChecked && !isCorrectAnswer) {
                      optStyle = "border-rose-500 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold"
                    } else {
                      optStyle = "border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-300 opacity-50"
                    }
                  } else if (isChecked) {
                    optStyle = "border-brand-600 bg-brand-50/80 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 font-bold"
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleToggleMulti(opt.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between gap-3 cursor-pointer ${optStyle}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          className="w-4 h-4 rounded text-brand-600 border-zinc-300 dark:border-zinc-600 pointer-events-none"
                        />
                        <span className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-600 dark:text-zinc-200 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="leading-relaxed truncate">{opt.text}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {!answerResult && (
                <button
                  type="button"
                  onClick={handleSubmitMulti}
                  disabled={submitting || selectedMulti.length === 0}
                  className="btn-primary text-xs w-full py-2.5 rounded-lg font-medium shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Memeriksa..." : `Kirim Jawaban (${selectedMulti.length} Dipilih)`}
                </button>
              )}
            </div>
          )}

          {/* ─── Type 3: SINGLE_CHOICE (DEFAULT) ─────────────────────────── */}
          {qType === "SINGLE_CHOICE" && (
            <div className="space-y-2">
              {question.options?.map((opt, idx) => {
                const isSelected = opt.id === selected
                const isCorrect = answerResult?.correctAnswer === opt.text
                const isWrong = isSelected && !answerResult?.correct

                let optStyle =
                  "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/60"

                if (answerResult) {
                  if (isCorrect) {
                    optStyle = "border-emerald-500 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 font-bold"
                  } else if (isWrong) {
                    optStyle = "border-rose-500 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 font-bold"
                  } else {
                    optStyle = "border-zinc-100 dark:border-zinc-800 text-zinc-400 dark:text-zinc-300 opacity-50"
                  }
                } else if (isSelected) {
                  optStyle = "border-brand-600 bg-brand-50 dark:bg-brand-950/50 text-brand-900 dark:text-brand-200 font-bold"
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSingleAnswer(opt.id)}
                    disabled={!!answerResult || submitting}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors ${optStyle}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px] text-zinc-600 dark:text-zinc-200 flex-shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {/* ─── Answer Feedback Card ────────────────────────────────────── */}
          {answerResult && (
            <div
              className={`p-4 rounded-xl text-xs border space-y-2 ${
                answerResult.correct
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm font-heading">
                  {answerResult.correct ? "✓ Jawaban Tepat!" : "✕ Jawaban Kurang Tepat"}
                </span>

                <span className="font-bold text-xs">
                  +{answerResult.points} poin
                  {answerResult.speedBonus > 0 && ` (Bonus Cepat +${answerResult.speedBonus})`}
                </span>
              </div>

              {answerResult.aiScore !== undefined && (
                <div className="font-semibold text-xs text-purple-950 dark:text-purple-200 bg-white/80 dark:bg-zinc-800/80 p-2 rounded-lg border border-purple-200/60 dark:border-purple-800/60">
                  Nilai Evaluasi AI: {answerResult.aiScore} / 100
                </div>
              )}

              {answerResult.aiFeedback && (
                <div className="p-3 bg-white/80 dark:bg-zinc-800/80 rounded-lg border border-zinc-200/80 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 space-y-1">
                  <span className="font-bold text-[11px] text-purple-900 dark:text-purple-200 block font-heading">
                    💡 Evaluasi & Umpan Balik AI:
                  </span>
                  <p className="leading-relaxed text-zinc-700 dark:text-zinc-200">{answerResult.aiFeedback}</p>
                </div>
              )}

              {answerResult.correctAnswer && qType !== "ESSAY" && !answerResult.correct && (
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300">
                  Kunci Jawaban yang Benar:{" "}
                  <span className="font-bold text-zinc-800 dark:text-white">{answerResult.correctAnswer}</span>
                </div>
              )}

              {answerResult.explanation && (
                <div className="text-[11px] text-zinc-600 dark:text-zinc-300 pt-1 border-t border-zinc-200/50 dark:border-zinc-800">
                  {answerResult.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {answerResult && (
        <button
          onClick={nextQuestion}
          className="btn-primary text-xs w-full py-2.5 rounded-lg shadow-xs font-medium"
        >
          {currentQ < total - 1 ? "Soal Berikutnya \u2192" : "Lihat Hasil Kuis & Rangkuman AI \u2192"}
        </button>
      )}

      {/* ─── Leaderboard Modal ─────────────────────────────────────── */}
      {showLeaderboardModal && session && (
        <LeaderboardModal
          isOpen={showLeaderboardModal}
          onClose={() => setShowLeaderboardModal(false)}
          sessionId={session.id}
          quizTitle={session.title}
        />
      )}
    </div>
  )
}
