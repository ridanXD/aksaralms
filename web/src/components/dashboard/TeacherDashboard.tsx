"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import {
  Course,
  fetchTeacherIntelligence,
  TeacherIntelligenceResponse,
  TeacherAIConsultResponse,
  consultTeacherAITips,
} from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { StatCard } from "@/components/ui/StatCard"
import { EmptyState } from "@/components/ui/EmptyState"

interface TeacherDashboardProps {
  userName: string
  courses: Course[]
  loading: boolean
}

export function TeacherDashboard({ userName, courses, loading }: TeacherDashboardProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [intel, setIntel] = useState<TeacherIntelligenceResponse | null>(null)
  const [loadingIntel, setLoadingIntel] = useState(false)

  // AI Pedagogical Tips & Consultation States
  const [selectedStudent, setSelectedStudent] = useState<
    TeacherIntelligenceResponse["atRiskStudents"][0] | null
  >(null)
  const [modalTab, setModalTab] = useState<"tips" | "counseling" | "ask_ai">("tips")
  const [showClassStrategy, setShowClassStrategy] = useState(true)
  const [consultQuestion, setConsultQuestion] = useState("")
  const [consultLoading, setConsultLoading] = useState(false)
  const [consultResponse, setConsultResponse] = useState<string | null>(null)
  const [copiedDraft, setCopiedDraft] = useState(false)
  const [liveStructuredAdvice, setLiveStructuredAdvice] = useState<
    TeacherAIConsultResponse["structuredAdvice"] | null
  >(null)
  const [isLiveGenerating, setIsLiveGenerating] = useState<boolean>(false)

  const handleCopyDraft = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedDraft(true)
    setTimeout(() => setCopiedDraft(false), 2000)
  }

  const handleGenerateFullLiveAI = async () => {
    if (!selectedCourseId || !selectedStudent) return
    setIsLiveGenerating(true)
    try {
      const res = await consultTeacherAITips(
        selectedCourseId,
        selectedStudent.id,
        "__GENERATE_FULL_AI_ANALYSIS__"
      )
      if (res.structuredAdvice) {
        setLiveStructuredAdvice(res.structuredAdvice)
      }
    } catch (_e) {
      // keep previous advice
    } finally {
      setIsLiveGenerating(false)
    }
  }

  const handleConsultAI = async (q?: string) => {
    if (!selectedCourseId || !selectedStudent) return
    const query = q || consultQuestion.trim()
    if (!query) return
    setConsultLoading(true)
    setConsultResponse(null)
    try {
      const res = await consultTeacherAITips(selectedCourseId, selectedStudent.id, query)
      setConsultResponse(res.advice)
    } catch (_err) {
      setConsultResponse(
        "Gagal menghubungi asisten AI saat ini. Silakan gunakan rekomendasi terstruktur di tab 'Rencana Aksi & Solusi AI'."
      )
    } finally {
      setConsultLoading(false)
    }
  }

  const openStudentModal = (student: TeacherIntelligenceResponse["atRiskStudents"][0]) => {
    setSelectedStudent(student)
    setModalTab("tips")
    setConsultQuestion("")
    setConsultResponse(null)
    setCopiedDraft(false)
    setLiveStructuredAdvice(null)
  }

  useEffect(() => {
    if (courses.length > 0 && !selectedCourseId) {
      setSelectedCourseId(courses[0].id)
    }
  }, [courses, selectedCourseId])

  useEffect(() => {
    if (!selectedCourseId) return
    setLoadingIntel(true)
    fetchTeacherIntelligence(selectedCourseId)
      .then(setIntel)
      .catch(() => setIntel(null))
      .finally(() => setLoadingIntel(false))
  }, [selectedCourseId])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-zinc-200 rounded-lg"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-zinc-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId)
  const totalStudents = courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0)
  const atRiskCount = intel?.atRiskStudents.length || 0
  const criticalTopics = intel?.classMastery.filter((m) => m.needsClassIntervention) || []

  return (
    <div className="space-y-6">
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300 uppercase tracking-wider">
            Portal Pengajar · Semester Ganjil 2024/2025
          </div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-heading mt-0.5 tracking-tight">
            Intelligence & Pemantauan Kelas, {userName}
          </h1>
        </div>

        <Link
          href="/courses"
          className="btn-primary text-xs py-2 px-4 rounded self-start sm:self-auto"
        >
          Kelola Silabus Kelas &rarr;
        </Link>
      </div>

      {/* ─── Top-Level Metric Summary Cards ──────────────────────────────── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          title="Total Mahasiswa"
          value={totalStudents}
          subtitle={`Di ${courses.length} kelas aktif`}
          accent="primary"
        />
        <StatCard
          title="Mata Kuliah Aktif"
          value={courses.length}
          subtitle="Semester berjalan"
          accent="primary"
        />
        <StatCard
          title="Topik Butuh Review"
          value={criticalTopics.length}
          subtitle="Intervensi materi kelas"
          accent={criticalTopics.length > 0 ? "rose" : "emerald"}
        />
        <StatCard
          title="Mahasiswa At-Risk"
          value={atRiskCount}
          subtitle="Butuh perhatian pengajar"
          accent={atRiskCount > 0 ? "amber" : "emerald"}
        />
      </section>

      {/* ─── Course Selector Tabs ────────────────────────────────────────── */}
      {courses.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 shadow-down-container space-y-2.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-300">
            Pilih Mata Kuliah untuk Analisis Detail:
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  selectedCourseId === c.id
                    ? "bg-brand-600 text-white font-bold shadow-down-card"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white"
                }`}
              >
                {c.code} - {c.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Intelligence Analysis Area ──────────────────────────────────── */}
      {loadingIntel ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-44 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
          <div className="h-64 bg-zinc-200 dark:bg-zinc-800 rounded-xl"></div>
        </div>
      ) : !intel ? (
        <EmptyState
          title="Pilih Mata Kuliah"
          description="Pilih salah satu kelas di atas untuk melihat analitik diagnostik penguasaan materi."
        />
      ) : (
        <div className="space-y-6">
          {/* Section 1: Class Mastery Distribution */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-5 sm:p-6 shadow-down-container space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                  Distribusi Nilai Rata-rata Topik ({selectedCourse?.title})
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Nilai rata-rata mahasiswa terdaftar berdasarkan evaluasi kuis & remedial
                </p>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">
                {intel.classMastery.length} Topik Terpetakan
              </span>
            </div>

            {intel.classMastery.length === 0 ? (
              <EmptyState
                title="Belum Ada Data Nilai Rata-rata"
                description="Mahasiswa di kelas ini belum menyelesaikan asesmen kuis untuk menghasilkan pemetaan topik."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {intel.classMastery.map((m) => (
                  <div
                    key={m.topic}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 shadow-down-card shadow-down-hover flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white truncate font-heading">{m.topic}</span>
                        {m.needsClassIntervention ? (
                          <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-1.5 py-0.5 rounded">Butuh Review</span>
                        ) : (
                          <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-1.5 py-0.5 rounded">Stabil</span>
                        )}
                      </div>

                      <div className="mt-2 flex items-baseline justify-between">
                        <span className="text-xl font-bold text-zinc-900 dark:text-white font-heading">{m.avgMastery}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-200">
                          {m.strugglingPercentage}% kesulitan
                        </span>
                      </div>

                      <ProgressBar
                        value={m.avgMastery}
                        size="sm"
                        variant={m.needsClassIntervention ? "danger" : "dynamic"}
                        className="mt-1.5"
                      />
                    </div>

                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-200 flex items-center justify-between">
                      <span>Peserta: {m.studentCount}</span>
                      {m.needsClassIntervention && (
                        <span className="text-rose-700 dark:text-rose-300 font-bold">Intervensi Diperlukan</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 2: At-Risk Students Table with AI Tips Integration */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-down-container space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight">
                    Peringatan Dini Akademik
                  </h2>
                  <span className="text-xs font-medium text-zinc-500 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                    {atRiskCount} mahasiswa
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-1">
                  Daftar mahasiswa dengan performa di bawah standar minimal beserta rekomendasi intervensi pedagogis.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {atRiskCount > 0 && (
                  <button
                    onClick={() => setShowClassStrategy(!showClassStrategy)}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                  >
                    {showClassStrategy ? "Sembunyikan Rekomendasi Kelas" : "Rekomendasi Strategi Kelas"}
                  </button>
                )}
                {atRiskCount > 0 ? (
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 px-2.5 py-1.5 rounded-lg">
                    Perlu Tindak Lanjut
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/60 px-2.5 py-1.5 rounded-lg">
                    Semua Memenuhi Standar
                  </span>
                )}
              </div>
            </div>

            {/* Class-wide AI Strategy Banner */}
            {showClassStrategy && intel.aiClassStrategy && atRiskCount > 0 && (
              <div className="bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80 rounded-xl p-4 sm:p-5 space-y-4 shadow-down-card">
                <div className="space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                    Strategi Pembelajaran Kolektif
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                    {intel.aiClassStrategy.headline}
                  </h3>
                  <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                    {intel.aiClassStrategy.overview}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  {intel.aiClassStrategy.recommendedActions.map((act, idx) => (
                    <div
                      key={idx}
                      className="bg-white dark:bg-zinc-900 p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-800 space-y-1.5 shadow-down-card shadow-down-hover transition-all"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-900 dark:text-white">
                          Fase {act.phase}
                        </span>
                        <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-300">
                          {act.badge}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                        {act.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {atRiskCount === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                Semua mahasiswa memenuhi kriteria standar nilai rata-rata.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-down-card">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 font-medium border-b border-zinc-200 dark:border-zinc-700 text-[11px]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Mahasiswa</th>
                      <th className="py-3 px-3 text-center font-semibold">Nilai</th>
                      <th className="py-3 px-4 font-semibold">Indikator Risiko</th>
                      <th className="py-3 px-4 font-semibold">Diagnosis & Rekomendasi</th>
                      <th className="py-3 px-4 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {intel.atRiskStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="py-3.5 px-4 align-top">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            {s.name || s.email}
                          </div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-0.5">{s.email}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-1.5 flex items-center gap-3">
                            <span>Kehadiran: <span className="font-medium text-zinc-700 dark:text-white">{s.attendancePercentage}%</span></span>
                            <span>Tugas: <span className="font-medium text-zinc-700 dark:text-white">{s.assignmentCompletion}</span></span>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 align-top text-center whitespace-nowrap">
                          <span
                            className={`inline-block font-semibold text-xs px-2 py-0.5 rounded ${
                              s.avgMastery < 60
                                ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900"
                                : s.avgMastery < 75
                                ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                            }`}
                          >
                            {s.avgMastery}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-xs">
                          {s.riskFactors && s.riskFactors.length > 0 ? (
                            <ul className="space-y-1">
                              {s.riskFactors.map((factor: string) => (
                                <li key={factor} className="text-[11px] text-zinc-600 dark:text-zinc-200 flex items-start gap-1.5">
                                  <span className="text-zinc-400 dark:text-zinc-400 mt-0.5">&bull;</span>
                                  <span>{factor}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-[11px] text-zinc-400 dark:text-zinc-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top max-w-sm space-y-1.5">
                          <p className="text-xs text-zinc-700 dark:text-zinc-100 leading-relaxed">
                            {s.aiAdvice?.rootCause || s.recommendedIntervention}
                          </p>
                          {s.aiAdvice?.suggestedAction && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-300 leading-relaxed">
                              <span className="font-medium text-zinc-700 dark:text-white">Tindakan:</span> {s.aiAdvice.suggestedAction}
                            </p>
                          )}
                        </td>
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <button
                            onClick={() => openStudentModal(s)}
                            className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            Panduan Intervensi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive AI Pedagogical Guidance Modal */}
          {selectedStudent && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Modal Header */}
                <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/60 dark:bg-zinc-850">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-700 dark:text-brand-300">
                      Panduan Intervensi Mahasiswa &bull; {intel.courseTitle}
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                      {selectedStudent.name || selectedStudent.email}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-300 pt-0.5 flex-wrap">
                      <span>{selectedStudent.email}</span>
                      <span>&bull;</span>
                      <span>Nilai: <strong className="font-medium text-zinc-800 dark:text-white">{selectedStudent.avgMastery}</strong></span>
                      <span>&bull;</span>
                      <span>Kehadiran: <strong className="font-medium text-zinc-800 dark:text-white">{selectedStudent.attendancePercentage}%</strong></span>
                      <span>&bull;</span>
                      <span>Tugas: <strong className="font-medium text-zinc-800 dark:text-white">{selectedStudent.assignmentCompletion}</strong></span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    aria-label="Tutup modal"
                    className="w-7 h-7 rounded-lg text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 flex items-center justify-center transition-colors shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Tab Switcher & Quick Actions */}
                <div className="px-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-4 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-6 overflow-x-auto">
                    <button
                      onClick={() => setModalTab("tips")}
                      className={`pb-2.5 pt-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                        modalTab === "tips"
                          ? "border-zinc-900 dark:border-brand-400 text-zinc-900 dark:text-white font-bold"
                          : "border-transparent text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      Rencana Aksi
                    </button>
                    <button
                      onClick={() => setModalTab("counseling")}
                      className={`pb-2.5 pt-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                        modalTab === "counseling"
                          ? "border-zinc-900 dark:border-brand-400 text-zinc-900 dark:text-white font-bold"
                          : "border-transparent text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      Draf Pesan Konseling
                    </button>
                    <button
                      onClick={() => setModalTab("ask_ai")}
                      className={`pb-2.5 pt-2.5 text-xs font-medium transition-colors border-b-2 whitespace-nowrap ${
                        modalTab === "ask_ai"
                          ? "border-zinc-900 dark:border-brand-400 text-zinc-900 dark:text-white font-bold"
                          : "border-transparent text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
                      }`}
                    >
                      Konsultasi Pedagogis
                    </button>
                  </div>
                  <button
                    onClick={handleGenerateFullLiveAI}
                    disabled={isLiveGenerating}
                    className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50 inline-flex items-center gap-1.5 shrink-0 shadow-2xs my-1.5"
                  >
                    {isLiveGenerating ? (
                      <>
                        <span className="w-3 h-3 border-2 border-zinc-400 border-t-zinc-800 dark:border-t-white rounded-full animate-spin"></span>
                        <span>Menganalisis...</span>
                      </>
                    ) : (
                      <span>Analisis Ulang AI</span>
                    )}
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
                  {modalTab === "tips" && (() => {
                    const activeAdvice = liveStructuredAdvice || selectedStudent.aiAdvice
                    return (
                      <div className="space-y-4">
                        {/* Root Cause Box */}
                        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200/90 dark:border-zinc-700 rounded-lg p-3.5 space-y-1">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            Akar Masalah Akademik
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                            {activeAdvice?.rootCause || "Mahasiswa mengalami kendala ketidakhadiran dan pemahaman konsep yang memerlukan pendampingan berkala."}
                          </p>
                        </div>

                        {/* Step-by-Step Action Plan */}
                        <div className="space-y-2.5">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            Rekomendasi Langkah Tindakan Pengajar
                          </div>
                          <div className="space-y-2">
                            {(activeAdvice?.actionSteps || [
                              {
                                title: "1. Pendekatan Empatis & Sesi 1-on-1 Ringan",
                                description: "Lakukan check-in personal 5-10 menit setelah kelas atau via pesan untuk menanyakan kendala spesifik tanpa memojokkan presensi.",
                                priority: "URGENT",
                              },
                              {
                                title: "2. Penugasan Remedial AI Adaptif Mandiri",
                                description: "Arahkan mahasiswa menyelesaikan latihan adaptif AI pada menu latihan mandiri untuk memulihkan pemahaman dasar.",
                                priority: "HIGH",
                              },
                              {
                                title: "3. Fleksibilitas Pengumpulan & Rekan Belajar",
                                description: "Beri kesempatan pengerjaan susulan untuk tugas tertunda dengan batas waktu realistis dan pasangkan dengan rekan mahasiswa.",
                                priority: "MEDIUM",
                              },
                            ]).map((step, idx) => (
                              <div
                                key={idx}
                                className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-850 space-y-1"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-zinc-900 dark:text-white text-xs">
                                    {step.title}
                                  </span>
                                  <span
                                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                                      String(step.priority).toUpperCase().includes("URGENT") ||
                                      String(step.priority).toUpperCase().includes("TINGGI")
                                        ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900"
                                        : String(step.priority).toUpperCase().includes("HIGH") ||
                                          String(step.priority).toUpperCase().includes("SEDANG")
                                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200"
                                    }`}
                                  >
                                    {step.priority}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                                  {step.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Remedial Strategy */}
                        <div className="p-3.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800 space-y-1">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            Strategi Remedial
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                            {activeAdvice?.remedialStrategy || selectedStudent.recommendedIntervention}
                          </p>
                        </div>
                      </div>
                    )
                  })()}

                  {modalTab === "counseling" && (() => {
                    const activeAdvice = liveStructuredAdvice || selectedStudent.aiAdvice
                    const draftText =
                      activeAdvice?.counselingDraft ||
                      `Halo ${selectedStudent.name}, semoga kabarmu baik. Saya memperhatikan ada beberapa materi di perkuliahan kita yang perlu perhatian tambahan. Jika ada kendala, pintu konsultasi selalu terbuka ya. Mari kita diskusikan solusinya bersama!`

                    return (
                      <div className="space-y-3.5">
                        <p className="text-xs text-zinc-500 dark:text-zinc-200 leading-relaxed">
                          Draf pesan komunikasi suportif untuk dikirimkan kepada <strong className="text-zinc-900 dark:text-white">{selectedStudent.name}</strong>:
                        </p>

                        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 font-sans text-xs text-zinc-800 dark:text-zinc-100 leading-relaxed">
                          <p className="whitespace-pre-wrap">
                            {draftText}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            onClick={() => handleCopyDraft(draftText)}
                            className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            {copiedDraft ? "Tersalin ke Clipboard" : "Salin Pesan"}
                          </button>
                          <a
                            href={`mailto:${selectedStudent.email}?subject=Pendampingan%20Perkuliahan%20${encodeURIComponent(
                              intel.courseTitle
                            )}&body=${encodeURIComponent(draftText)}`}
                            className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                          >
                            Buka di Email
                          </a>
                        </div>
                      </div>
                    )
                  })()}

                  {modalTab === "ask_ai" && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-500 dark:text-zinc-200 leading-relaxed">
                        Tanyakan skenario atau strategi pedagogis lanjutan untuk membimbing mahasiswa ini:
                      </p>

                      {/* Quick Question Chips */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-200">
                          Saran Topik Diskusi:
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            "Bagaimana jika mahasiswa tidak merespons pesan?",
                            "Metode belajar apa yang cocok untuk mahasiswa yang lambat memahami konsep materi?",
                            "Apakah sebaiknya diberikan perpanjangan deadline tugas atau tugas pengganti?",
                          ].map((q, i) => (
                            <button
                              key={i}
                              onClick={() => {
                                setConsultQuestion(q)
                                handleConsultAI(q)
                              }}
                              className="text-[11px] text-zinc-700 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md transition-colors text-left"
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Input custom question */}
                      <div className="space-y-2 pt-1">
                        <textarea
                          rows={2}
                          value={consultQuestion}
                          onChange={(e) => setConsultQuestion(e.target.value)}
                          placeholder="Tulis pertanyaan konsultasi pedagogis spesifik..."
                          className="w-full text-xs p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                        />
                        <button
                          onClick={() => handleConsultAI()}
                          disabled={consultLoading || !consultQuestion.trim()}
                          className="text-xs font-medium text-white bg-zinc-900 dark:bg-brand-600 hover:bg-zinc-800 dark:hover:bg-brand-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 px-3.5 py-1.5 rounded-lg transition-colors shadow-2xs inline-flex items-center gap-1.5"
                        >
                          {consultLoading ? (
                            <>
                              <span className="w-3 h-3 border-2 border-zinc-400 border-t-white rounded-full animate-spin"></span>
                              <span>Menganalisis...</span>
                            </>
                          ) : (
                            <span>Kirim Pertanyaan</span>
                          )}
                        </button>
                      </div>

                      {/* AI Response Display */}
                      {consultResponse && (
                        <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3.5 space-y-1.5">
                          <div className="font-semibold text-zinc-900 dark:text-white text-xs">
                            Tanggapan Konsultasi:
                          </div>
                          <div className="text-xs text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed">
                            {consultResponse}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-3.5 bg-zinc-50/60 dark:bg-zinc-850 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-300">
                  <span>Asisten Pedagogis AI &bull; Rekomendasi Terukur</span>
                  <button
                    onClick={() => setSelectedStudent(null)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors shadow-2xs"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
