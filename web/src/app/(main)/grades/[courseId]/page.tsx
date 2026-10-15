"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { fetchGrades, GradeResponse } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { EmptyState } from "@/components/ui/EmptyState"

export default function CourseGradesPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const [grades, setGrades] = useState<GradeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGrades(parseInt(courseId))
      .then(setGrades)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [courseId])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        <div className="h-44 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl"></div>
      </div>
    )
  }

  if (!grades) {
    return (
      <EmptyState
        title="Belum Ada Nilai"
        description="Belum ada catatan nilai tugas atau kuis untuk mata kuliah ini."
        actionLabel="Kembali ke Kursus"
        actionHref="/courses"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
          <Link href="/courses" className="hover:text-zinc-800 dark:hover:text-white transition">
            Mata Kuliah
          </Link>
          <span>/</span>
          <Link href={`/courses/${courseId}`} className="hover:text-zinc-800 dark:hover:text-white transition">
            Detail Kelas
          </Link>
          <span>/</span>
          <span className="text-brand-600 dark:text-brand-300 font-bold">Rincian Nilai</span>
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-1 tracking-tight">
          Nilai Rata-rata Perkuliahan
        </h1>
      </div>

      {/* Overall Score Banner */}
      <div className="p-6 sm:p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-center space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading">
          Nilai Rata-rata Keseluruhan
        </div>
        <div className="text-5xl font-extrabold text-brand-600 dark:text-brand-400 tracking-tight font-heading">
          {grades.overallPercentage}
        </div>
        <ProgressBar value={grades.overallPercentage} size="md" className="max-w-md mx-auto" />
      </div>

      {/* Topic Mastery Engine Section */}
      {grades.topicMasteries && grades.topicMasteries.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading uppercase tracking-wider">
                Matriks Nilai Rata-rata Topik
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                Nilai rata-rata pada pokok materi mata kuliah ini
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {grades.topicMasteries.map((tm) => (
              <div
                key={tm.topic}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs space-y-2.5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white font-heading">{tm.topic}</span>
                  <Badge
                    variant={
                      tm.trend === "IMPROVING"
                        ? "success"
                        : tm.trend === "DECLINING"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {tm.trend === "IMPROVING"
                      ? "Naik"
                      : tm.trend === "DECLINING"
                      ? "Turun"
                      : "Stabil"}
                  </Badge>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold text-zinc-900 dark:text-white font-heading">
                    {tm.masteryScore}
                  </span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300 font-medium">Skor 0-100</span>
                </div>
                <ProgressBar value={tm.masteryScore} size="sm" />
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                  <Link
                    href={`/ai-training?topic=${encodeURIComponent(tm.topic)}`}
                    className="text-xs font-semibold text-brand-600 dark:text-brand-300 hover:text-brand-700 dark:hover:text-brand-200 flex items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded"
                  >
                    <span>Latihan Remedial</span>
                    <span>&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quiz Grades */}
      {grades.quizGrades.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading uppercase tracking-wider">
            Nilai Kuis & Asesmen
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
            {grades.quizGrades.map((g) => (
              <div key={g.id} className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div>
                  <div className="font-bold text-xs text-zinc-900 dark:text-white font-heading">{g.title}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-0.5">
                    {g.correctCount}/{g.totalCount} Soal Terjawab Benar
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold text-zinc-900 dark:text-white font-heading">{g.score}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-300">Maks: {g.maxScore}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Assignment Grades */}
      {grades.assignmentGrades.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading uppercase tracking-wider">
            Tugas & Praktikum
          </h2>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
            {grades.assignmentGrades.map((g) => (
              <div key={g.id} className="p-4 space-y-2 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-bold text-xs text-zinc-900 dark:text-white font-heading">{g.title}</span>
                  <span className="font-extrabold text-xs text-zinc-900 dark:text-white">
                    {g.score} / {g.maxScore}
                  </span>
                </div>
                {g.feedback && (
                  <div className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-200">
                    <span className="font-semibold text-zinc-700 dark:text-white">Catatan Pengajar:</span> {g.feedback}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
