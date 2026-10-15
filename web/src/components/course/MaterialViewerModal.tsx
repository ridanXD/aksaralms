"use client"

import { useState } from "react"
import { Material, markMaterialProgress } from "@/lib/api"

interface MaterialViewerModalProps {
  isOpen: boolean
  onClose: () => void
  material: Material | null
  moduleTitle?: string
  isStudent?: boolean
  onProgressMarked?: () => void
}

export function MaterialViewerModal({
  isOpen,
  onClose,
  material,
  moduleTitle,
  isStudent = false,
  onProgressMarked,
}: MaterialViewerModalProps) {
  const [marking, setMarking] = useState(false)
  const [markedSuccess, setMarkedSuccess] = useState(false)
  const [markError, setMarkError] = useState("")

  if (!isOpen || !material) return null

  const handleMarkCompleted = async () => {
    try {
      setMarking(true)
      setMarkError("")
      await markMaterialProgress(material.id)
      setMarkedSuccess(true)
      onProgressMarked?.()
      setTimeout(() => {
        setMarkedSuccess(false)
      }, 3000)
    } catch {
      setMarkError("Gagal memperbarui progress belajar.")
    } finally {
      setMarking(false)
    }
  }

  // Helper for Youtube embed
  const getEmbedUrl = (url: string) => {
    if (!url) return null
    if (url.includes("youtube.com/watch?v=")) {
      const videoId = url.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${videoId}`
    }
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0]
      return `https://player.vimeo.com/video/${videoId}`
    }
    return null
  }

  const isEmbeddableVideo = material.fileUrl ? getEmbedUrl(material.fileUrl) : null
  const isDirectVideo =
    material.fileUrl &&
    (material.fileUrl.endsWith(".mp4") ||
      material.fileUrl.endsWith(".webm") ||
      material.fileUrl.startsWith("data:video/"))

  const isImage =
    material.type === "IMAGE" ||
    (material.fileUrl &&
      (material.fileUrl.startsWith("data:image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(material.fileUrl)))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-3xl w-full max-h-[90vh] shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-850">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  material.type === "TEXT"
                    ? "bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                    : material.type === "IMAGE"
                    ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                    : material.type === "VIDEO"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    : "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                }`}
              >
                {material.type === "TEXT"
                  ? "Bahan Bacaan"
                  : material.type === "IMAGE"
                  ? "Gambar & Diagram"
                  : material.type === "VIDEO"
                  ? "Video Tutorial"
                  : "Dokumen & File"}
              </span>

              {moduleTitle && (
                <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">
                  Modul: {moduleTitle}
                </span>
              )}
            </div>

            <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-heading">
              {material.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Visual: Image Display */}
          {isImage && material.fileUrl && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-900/5 dark:bg-zinc-950/40 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={material.fileUrl}
                alt={material.title}
                className="max-h-[420px] w-auto max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
          )}

          {/* Visual: Video Display */}
          {material.type === "VIDEO" && material.fileUrl && (
            <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-black aspect-video flex items-center justify-center">
              {isEmbeddableVideo ? (
                <iframe
                  src={isEmbeddableVideo}
                  title={material.title}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideo ? (
                <video src={material.fileUrl} controls className="w-full h-full max-h-[420px]" />
              ) : (
                <div className="text-center p-6 text-white space-y-2">
                  <p className="text-sm text-zinc-300 dark:text-zinc-200">Tautan video eksternal:</p>
                  <a
                    href={material.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5"
                  >
                    Buka Video di Tab Baru &rarr;
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Document / File Preview & Download */}
          {material.type === "FILE" && material.fileUrl && (
            <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white font-heading">
                    Lampiran Dokumen Perkuliahan
                  </h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                    Unduh atau buka file untuk mempelajari materi selengkapnya.
                  </p>
                </div>
              </div>

              <a
                href={material.fileUrl}
                download={material.title}
                target="_blank"
                rel="noreferrer"
                className="text-xs py-2 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium inline-flex items-center justify-center gap-1.5 transition-colors shadow-2xs shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Unduh / Buka File</span>
              </a>
            </div>
          )}

          {/* External Link (if fileUrl is provided and not embedded) */}
          {material.fileUrl &&
            !isImage &&
            material.type !== "VIDEO" &&
            material.type !== "FILE" &&
            material.fileUrl.startsWith("http") && (
              <div className="p-3.5 rounded-xl border border-brand-200 dark:border-brand-800/60 bg-brand-50/40 dark:bg-brand-950/30 flex items-center justify-between gap-3 text-xs">
                <span className="text-brand-900 dark:text-brand-200 font-medium truncate">
                  Tautan Tambahan: {material.fileUrl}
                </span>
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 font-bold shrink-0 underline"
                >
                  Kunjungi Web &rarr;
                </a>
              </div>
            )}

          {/* Text Content */}
          {material.content ? (
            <div className="bg-zinc-50/80 dark:bg-zinc-850 rounded-xl p-5 border border-zinc-200/80 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider mb-2.5 font-heading">
                Isi / Catatan Materi
              </h3>
              <div className="text-sm text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap font-sans space-y-2">
                {material.content}
              </div>
            </div>
          ) : (
            !material.fileUrl && (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-300 text-xs">
                Tidak ada konten teks tambahan untuk materi ini.
              </div>
            )
          )}

          {markError && (
            <p className="text-xs text-rose-600 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-2.5 rounded-lg">
              {markError}
            </p>
          )}

          {markedSuccess && (
            <div className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg flex items-center gap-2 font-medium">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Selamat! Materi ini telah dicatat selesai ke progress belajarmu.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-zinc-50/40 dark:bg-zinc-850">
          <div className="text-xs text-zinc-500 dark:text-zinc-200">
            {isStudent
              ? "Selesaikan pembacaan materi untuk meningkatkan indikator progress mata kuliah."
              : "Mode Dosen: Memeriksa kelayakan dan tampilan bahan ajar mahasiswa."}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {isStudent && (
              <button
                type="button"
                onClick={handleMarkCompleted}
                disabled={marking || markedSuccess}
                className="btn-primary text-xs py-2 px-3.5 rounded-lg flex items-center gap-1.5 font-medium disabled:opacity-50"
              >
                {marking ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Menyimpan...</span>
                  </>
                ) : markedSuccess ? (
                  <span>Terselesaikan ✓</span>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tandai Selesai</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="text-xs py-2 px-3.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
