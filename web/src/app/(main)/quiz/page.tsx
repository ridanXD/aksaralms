"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchCourses, fetchQuizSessions, Course, QuizSession } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { EmptyState } from "@/components/ui/EmptyState"

import { LeaderboardModal } from "@/components/quiz/LeaderboardModal"

export default function QuizListPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [allQuizzes, setAllQuizzes] = useState<(QuizSession & { courseTitle?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLeaderboardSession, setSelectedLeaderboardSession] = useState<{
    id: number
    title: string
  } | null>(null)

  useEffect(() => {
    fetchCourses()
      .then(async (courseList) => {
        setCourses(courseList)
        const quizPromises = courseList.map((c) =>
          fetchQuizSessions(c.id)
            .then((quizzes) => quizzes.map((q) => ({ ...q, courseTitle: c.title })))
            .catch(() => [])
        )
        const quizArrays = await Promise.all(quizPromises)
        setAllQuizzes(quizArrays.flat())
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
          Asesmen Adaptif & Asesmen Kompetitif
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-0.5 tracking-tight">
          Kuis & Evaluasi Pemahaman
        </h1>
      </div>

      {allQuizzes.length === 0 ? (
        <EmptyState
          title="Belum Ada Kuis Aktif"
          description="Dosen atau pengajar belum mempublikasikan sesi kuis untuk mata kuliah yang kamu ikuti."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className={`p-5 sm:p-6 rounded-xl border bg-white dark:bg-zinc-900 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between gap-3.5 group ${
                quiz.isKingOfTheHill
                  ? "border-amber-300 dark:border-amber-700/60 ring-1 ring-amber-200/50 dark:ring-amber-500/20 hover:border-amber-400 dark:hover:border-amber-600"
                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 px-2 py-0.5 rounded-md">
                    {quiz.courseTitle || "Mata Kuliah"}
                  </span>
                  {quiz.isKingOfTheHill && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      <span>👑</span>
                      <span>King of the Hill</span>
                    </span>
                  )}
                </div>

                <Link
                  href={`/quiz/${quiz.id}`}
                  className="block mt-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                >
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors font-heading leading-snug">
                    {quiz.title}
                  </h3>
                </Link>

                {quiz.description && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                    {quiz.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">
                  {quiz._count?.quizQuestions || 0} Soal Asesmen
                </span>

                <div className="flex items-center gap-2">
                  {quiz.isKingOfTheHill && (
                    <button
                      type="button"
                      onClick={() => setSelectedLeaderboardSession({ id: quiz.id, title: quiz.title })}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 transition-colors inline-flex items-center gap-1.5 shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                    >
                      <span>🏆</span>
                      <span>Leaderboard</span>
                    </button>
                  )}

                  <Link
                    href={`/quiz/${quiz.id}`}
                    className="btn-primary text-xs font-semibold py-1.5 px-3.5 rounded-lg shadow-2xs inline-flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                  >
                    <span>Mulai</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Leaderboard Modal ─────────────────────────────────────────── */}
      {selectedLeaderboardSession && (
        <LeaderboardModal
          isOpen={!!selectedLeaderboardSession}
          onClose={() => setSelectedLeaderboardSession(null)}
          sessionId={selectedLeaderboardSession.id}
          quizTitle={selectedLeaderboardSession.title}
        />
      )}
    </div>
  )
}
