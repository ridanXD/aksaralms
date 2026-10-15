"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchLeaderboard, LeaderboardResponse } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"

interface LeaderboardModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: number
  quizTitle?: string
}

export function LeaderboardModal({
  isOpen,
  onClose,
  sessionId,
  quizTitle,
}: LeaderboardModalProps) {
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !sessionId) return
    setLoading(true)
    setError(null)

    fetchLeaderboard(sessionId)
      .then((res) => {
        setData(res)
      })
      .catch((err) => {
        console.error("Gagal memuat leaderboard:", err)
        setError("Gagal memuat papan peringkat. Pastikan kamu telah terdaftar di kelas ini.")
      })
      .finally(() => setLoading(false))
  }, [isOpen, sessionId])

  if (!isOpen) return null

  const king = data?.kingOfTheHill
  const totalQuestions = data?.totalQuestions || 10
  const title = quizTitle || data?.sessionTitle || "King of the Hill"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Modal Header ────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="space-y-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-wider text-amber-100">
              <span>👑</span>
              <span>King of the Hill Leaderboard</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight leading-snug text-white">
              {title}
            </h2>
            <p className="text-xs text-amber-100/90">
              Peringkat ditentukan oleh <strong>akurasi (paling benar)</strong> dan <strong>kecepatan respon (paling cepat)</strong>.
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center text-sm font-bold transition-colors shrink-0 relative z-10"
            aria-label="Tutup Modal"
          >
            ✕
          </button>
        </div>

        {/* ─── Modal Content ────────────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-14 space-y-3">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">Memuat papan peringkat realtime...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs text-center space-y-2">
              <p className="font-semibold">{error}</p>
            </div>
          ) : !data || data.entries.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-300 flex items-center justify-center text-3xl shadow-inner">
                👑
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                Takhta Masih Kosong!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-300 max-w-sm mx-auto leading-relaxed">
                Belum ada mahasiswa yang menyelesaikan kuis ini. Jadilah yang pertama menaklukkan 10 soal sangat sulit ini dan rebut takhta <strong>King of the Hill</strong>!
              </p>
              <div className="pt-2">
                <Link
                  href={`/quiz/${sessionId}`}
                  onClick={onClose}
                  className="btn-primary text-xs py-2.5 px-6 rounded-xl font-bold shadow-brand-down hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
                >
                  <span>Mulai Kuis & Rebut Takhta</span>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* ─── The Reigning King Highlight Card ──────────────────────── */}
              {king && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border-2 border-amber-400 dark:border-amber-500/60 shadow-[0_12px_30px_-8px_rgba(245,158,11,0.25)] relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md">
                          {king.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -top-2 -right-2 text-xl drop-shadow-md animate-bounce">
                          👑
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded-full">
                            The King of the Hill
                          </span>
                          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-300">Peringkat #1</span>
                        </div>
                        <h3 className="text-lg font-black text-zinc-900 dark:text-white font-heading mt-0.5">
                          {king.name}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">
                          Pemegang takhta skor tertinggi saat ini
                        </p>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-amber-200/60 dark:border-amber-800/60">
                      <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 font-heading">
                        {king.score} <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">pts</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md font-bold">
                          ✓ {king.correctCount}/{totalQuestions} Benar
                        </span>
                        <span className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 bg-sky-100/80 dark:bg-sky-950/50 px-2 py-0.5 rounded-md font-bold">
                          ⚡ {(king.avgResponseMs / 1000).toFixed(2)}s avg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── Top 3 Podium Cards ────────────────────────────────────── */}
              {data.entries.length >= 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {data.entries.slice(0, 3).map((entry, idx) => {
                    const isFirst = idx === 0
                    const isSecond = idx === 1
                    const isThird = idx === 2

                    const borderColor = isFirst
                      ? "border-amber-400 dark:border-amber-600 bg-amber-50/70 dark:bg-amber-950/40"
                      : isSecond
                      ? "border-zinc-300 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-800/60"
                      : "border-amber-700/30 dark:border-amber-700/60 bg-amber-900/5 dark:bg-amber-950/30"

                    const badgeColor = isFirst
                      ? "bg-amber-400 text-amber-950 font-black"
                      : isSecond
                      ? "bg-zinc-300 dark:bg-zinc-700 text-zinc-900 dark:text-white font-black"
                      : "bg-amber-700/20 dark:bg-amber-900/40 text-amber-900 dark:text-amber-300 font-black"

                    return (
                      <div
                        key={entry.userId}
                        className={`p-3.5 rounded-2xl border ${borderColor} text-center space-y-1.5 shadow-2xs`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${badgeColor}`}>
                            #{entry.rank}
                          </span>
                          <span className="text-base">{isFirst ? "👑" : isSecond ? "🥈" : "🥉"}</span>
                        </div>
                        <div className="font-extrabold text-xs text-zinc-900 dark:text-white font-heading truncate">
                          {entry.name}
                        </div>
                        <div className="text-sm font-black text-brand-600 dark:text-brand-300 font-heading">
                          {entry.score} pts
                        </div>
                        <div className="text-[10px] text-zinc-500 dark:text-zinc-300 flex items-center justify-center gap-2">
                          <span>{entry.correctCount}/{totalQuestions} Benar</span>
                          <span>•</span>
                          <span>{(entry.avgResponseMs / 1000).toFixed(2)}s</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ─── Full Ranking Table ────────────────────────────────────── */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-200 font-heading">
                    Semua Peringkat Peserta ({data.entries.length})
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300">
                    Diperbarui realtime
                  </span>
                </div>

                <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-2xs divide-y divide-zinc-100 dark:divide-zinc-800">
                  {data.entries.map((entry, idx) => {
                    const isKing = idx === 0
                    return (
                      <div
                        key={entry.userId}
                        className={`p-3.5 flex items-center justify-between text-xs transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                          isKing ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                              idx === 0
                                ? "bg-amber-400 text-amber-950 shadow-xs"
                                : idx === 1
                                ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-white"
                                : idx === 2
                                ? "bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 font-semibold"
                            }`}
                          >
                            {idx === 0 ? "👑" : `#${entry.rank}`}
                          </div>

                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 dark:text-white font-heading flex items-center gap-1.5 truncate">
                              <span>{entry.name}</span>
                              {isKing && (
                                <Badge variant="warning">The King</Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-300 flex items-center gap-2 mt-0.5">
                              <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                                ✓ {entry.correctCount}/{totalQuestions} Benar
                              </span>
                              <span>•</span>
                              <span className="text-sky-700 dark:text-sky-300 font-semibold">
                                ⏱️ {(entry.avgResponseMs / 1000).toFixed(2)}s avg
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-extrabold text-sm text-brand-600 dark:text-brand-300 font-heading">
                            {entry.score}
                          </div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-300">Total Poin</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* ─── Modal Footer CTA ────────────────────────────────────────────── */}
        <div className="p-4 sm:p-5 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2.5 px-4 rounded-xl font-bold"
          >
            Tutup
          </button>

          <Link
            href={`/quiz/${sessionId}`}
            onClick={onClose}
            className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold shadow-brand-down hover:-translate-y-0.5 transition-all flex items-center gap-1.5"
          >
            <span>Mulai Kuis King of the Hill</span>
            <span>&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
