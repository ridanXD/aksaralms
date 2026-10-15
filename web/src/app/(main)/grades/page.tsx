"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { fetchCourses, Course } from "@/lib/api"
import { EmptyState } from "@/components/ui/EmptyState"

export default function GradesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourses().then(setCourses).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-zinc-200 dark:bg-zinc-800 rounded-md"></div>
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
          Transkrip & Evaluasi Akademik
        </div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-0.5 tracking-tight">
          Nilai Rata-rata & Evaluasi Perkuliahan
        </h1>
      </div>

      {courses.length === 0 ? (
        <EmptyState
          title="Belum Ada Nilai"
          description="Kamu belum terdaftar di mata kuliah manapun."
          actionLabel="Lihat Katalog Kelas"
          actionHref="/courses"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/grades/${course.id}`}
              className="bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-sm transition-all flex flex-col justify-between gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60 px-2 py-0.5 rounded-md">
                  {course.code}
                </span>
                <h3 className="font-bold text-sm text-zinc-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors mt-2.5 font-heading">
                  {course.title}
                </h3>
              </div>
              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center justify-end gap-1 group-hover:underline">
                <span>Lihat Rincian Nilai Rata-rata</span>
                <span>&rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
