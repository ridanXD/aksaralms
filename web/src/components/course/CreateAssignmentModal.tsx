"use client"

import { useState, useEffect } from "react"
import { createAssignment, generateAIContent, Assignment } from "@/lib/api"
import { AssignmentContentRenderer } from "./AssignmentContentRenderer"

interface CreateAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number
  courseTitle: string
  onAssignmentCreated: (assignment: Assignment) => void
  initialTitle?: string
  initialDescription?: string
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  onAssignmentCreated,
  initialTitle,
  initialDescription,
}: CreateAssignmentModalProps) {
  const [title, setTitle] = useState(initialTitle || "")
  const [description, setDescription] = useState(initialDescription || "")
  const [deadlineDate, setDeadlineDate] = useState("")
  const [deadlineTime, setDeadlineTime] = useState("23:59")
  const [descTab, setDescTab] = useState<"edit" | "preview">("edit")

  // AI Generator State
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuccessMsg, setAiSuccessMsg] = useState("")

  // Form State
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  // Default deadline: 7 days from now
  useEffect(() => {
    const d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    setDeadlineDate(`${yyyy}-${mm}-${dd}`)
  }, [])

  useEffect(() => {
    if (isOpen) {
      if (initialTitle !== undefined) setTitle(initialTitle)
      if (initialDescription !== undefined) setDescription(initialDescription)
    }
  }, [isOpen, initialTitle, initialDescription])

  if (!isOpen) return null

  const handleApplyPresetDeadline = (days: number) => {
    const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    setDeadlineDate(`${yyyy}-${mm}-${dd}`)
  }

  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setErrorMsg("Masukkan topik tugas untuk digenerate oleh AI.")
      return
    }

    setIsGeneratingAI(true)
    setErrorMsg("")
    setAiSuccessMsg("")

    try {
      const res = await generateAIContent({
        type: "ASSIGNMENT",
        courseTitle,
        topic: aiTopic.trim(),
        instructions: aiInstructions.trim() || undefined,
      })

      let finalTitle = res.title || ""
      let finalContent = res.content || ""

      // Extract leading # [Title] from content and strip it to avoid redundant format pagar
      const headingMatch = finalContent.match(/^\s*#\s+([^\n]+)/)
      if (headingMatch) {
        if (!finalTitle || finalTitle === aiTopic.trim()) {
          finalTitle = headingMatch[1].trim()
        }
        finalContent = finalContent.replace(/^\s*#\s+[^\n]+(\r?\n)*/, "").trim()
      }

      if (finalTitle) setTitle(finalTitle)
      if (finalContent) setDescription(finalContent)
      setAiSuccessMsg("Instruksi tugas berhasil disusun oleh AI dalam format terstruktur!")
      setShowAIGenerator(false)
      setDescTab("preview")
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal meng-generate tugas dengan AI.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg("Judul tugas wajib diisi.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      let deadlineIso: string | undefined = undefined
      if (deadlineDate) {
        deadlineIso = new Date(`${deadlineDate}T${deadlineTime || "23:59"}:00`).toISOString()
      }

      const created = await createAssignment(courseId, {
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadlineIso,
      })

      onAssignmentCreated(created)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal membuat tugas perkuliahan.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-4 bg-zinc-50/70 dark:bg-zinc-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-600"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300 font-heading">
                Penugasan Perkuliahan &bull; {courseTitle}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-heading mt-0.5">
              Buat Tugas Baru untuk Mahasiswa
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
              Tentukan instruksi pengerjaan, batas waktu pengumpulan, atau gunakan AI untuk menyusun rubrik tugas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 rounded-xl text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {aiSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>{aiSuccessMsg}</span>
            </div>
          )}

          {/* AI Generator Panel Toggle */}
          <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-gradient-to-r from-brand-50/70 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-xs">
                  ✨
                </span>
                <div>
                  <span className="font-bold text-xs text-brand-900 dark:text-brand-200 font-heading">
                    Generate Lembar Tugas dengan AI
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                    Ketik topik tugas, AI akan menyusun skenario, langkah pengerjaan, dan rubrik penilaian otomatis.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                className="px-3 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-zinc-700 text-[11px] font-semibold transition-colors shadow-2xs"
              >
                {showAIGenerator ? "Tutup AI" : "Buka AI Generator"}
              </button>
            </div>

            {showAIGenerator && (
              <div className="pt-2 border-t border-brand-200/60 dark:border-brand-800/60 space-y-2.5 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
                    Topik / Permasalahan Tugas
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Implementasi Database Relasional & Normalisasi 3NF"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-200">
                    Instruksi Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Format PDF, sertakan diagram ERD, bobot penilaian 40%"
                    value={aiInstructions}
                    onChange={(e) => setAiInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  />
                </div>
                <button
                  type="button"
                  disabled={isGeneratingAI || !aiTopic.trim()}
                  onClick={handleGenerateAI}
                  className="w-full py-2 px-3 rounded-lg bg-brand-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:bg-brand-700 disabled:opacity-50 transition-colors"
                >
                  {isGeneratingAI ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Menyusun Lembar Tugas dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Susun Lembar Tugas Secara Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
              Judul Tugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Tugas 1 - Analisis Algoritma Sorting & Kompleksitas Big-O"
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
              required
            />
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
              Batas Waktu Pengumpulan (Deadline) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="date"
                value={deadlineDate}
                onChange={(e) => setDeadlineDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                required
              />
              <input
                type="time"
                value={deadlineTime}
                onChange={(e) => setDeadlineTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
                required
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <span className="text-[11px] text-zinc-400 dark:text-zinc-300 font-medium mr-1">Preset Deadline:</span>
              {[
                { label: "+3 Hari", days: 3 },
                { label: "+7 Hari (1 Minggu)", days: 7 },
                { label: "+14 Hari (2 Minggu)", days: 14 },
              ].map((p) => (
                <button
                  key={p.days}
                  type="button"
                  onClick={() => handleApplyPresetDeadline(p.days)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-200 transition-colors"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
                Petunjuk Pengerjaan & Ketentuan
              </label>

              {/* Tab Selector: Edit vs Preview */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg self-start sm:self-auto border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  onClick={() => setDescTab("edit")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                    descTab === "edit"
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-2xs"
                      : "text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
                  }`}
                >
                  ✍️ Tulis / Edit
                </button>
                <button
                  type="button"
                  onClick={() => setDescTab("preview")}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                    descTab === "preview"
                      ? "bg-white dark:bg-zinc-700 text-brand-700 dark:text-brand-300 shadow-2xs font-bold"
                      : "text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white"
                  }`}
                >
                  <span>👁️ Pratinjau Tampilan Rapi</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
                </button>
              </div>
            </div>

            {descTab === "edit" ? (
              <div className="space-y-1">
                <textarea
                  rows={8}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan detail permasalahan, kriteria penilaian, dan format pengumpulan... (Atau klik tombol Buka AI Generator di atas)"
                  className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-mono bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600 leading-relaxed"
                />
                <div className="flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-300">
                  <span>Sistem otomatis menata rapi format tugas tanpa menampilkan format pagar (#).</span>
                  <span>{description.length} karakter</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-850 p-3.5 max-h-[380px] overflow-y-auto space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-200 font-heading">
                    Pratinjau Tampilan Mahasiswa (Format Native Rapi)
                  </span>
                  <button
                    type="button"
                    onClick={() => setDescTab("edit")}
                    className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold"
                  >
                    Edit Teks Kembali ✎
                  </button>
                </div>
                {description.trim() ? (
                  <AssignmentContentRenderer content={description} assignmentTitle={title} />
                ) : (
                  <div className="py-8 text-center text-zinc-400 dark:text-zinc-300 text-xs">
                    Belum ada petunjuk tugas. Tuliskan teks di tab <strong>Edit</strong> atau gunakan tombol <strong>Buka AI Generator</strong> di atas.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors shadow-2xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-xs py-2 px-5 rounded-xl font-medium shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Menyimpan Tugas...</span>
                </>
              ) : (
                <>
                  <span>Publikasikan Tugas</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
