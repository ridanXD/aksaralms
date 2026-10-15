"use client"

import { useState, useRef } from "react"
import { createMaterial, createModule, generateAIContent, Material } from "@/lib/api"

interface CreateMaterialModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number
  courseTitle: string
  modules: { id: number; title: string }[]
  onMaterialCreated: (material: Material) => void
}

export function CreateMaterialModal({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  modules,
  onMaterialCreated,
}: CreateMaterialModalProps) {
  const [selectedModuleId, setSelectedModuleId] = useState<string>(
    modules.length > 0 ? String(modules[0].id) : "new"
  )
  const [newModuleTitle, setNewModuleTitle] = useState("")
  const [title, setTitle] = useState("")
  const [type, setType] = useState<"TEXT" | "IMAGE" | "FILE" | "VIDEO">("TEXT")
  const [content, setContent] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileSize, setFileSize] = useState("")
  
  // AI Generation State
  const [showAIGenerator, setShowAIGenerator] = useState(false)
  const [aiTopic, setAiTopic] = useState("")
  const [aiInstructions, setAiInstructions] = useState("")
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuccessMsg, setAiSuccessMsg] = useState("")

  // Form Submission State
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  // Handle File / Image Upload via FileReader
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 15MB for browser dataURL
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg("Ukuran file maksimal adalah 15MB.")
      return
    }

    setErrorMsg("")
    setFileName(file.name)
    const sizeInKb = (file.size / 1024).toFixed(1)
    const sizeStr = file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(2)} MB` : `${sizeInKb} KB`
    setFileSize(sizeStr)

    const reader = new FileReader()
    reader.onload = () => {
      setFileUrl(reader.result as string)
      if (!title) {
        // Auto-fill title from filename
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1))
      }
    }
    reader.onerror = () => {
      setErrorMsg("Gagal membaca berkas yang dipilih.")
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveUploadedFile = () => {
    setFileUrl("")
    setFileName("")
    setFileSize("")
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Handle AI Content Generation
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setErrorMsg("Masukkan topik materi untuk digenerate oleh AI.")
      return
    }

    setIsGeneratingAI(true)
    setErrorMsg("")
    setAiSuccessMsg("")

    try {
      const res = await generateAIContent({
        type: "MATERIAL",
        courseTitle,
        topic: aiTopic.trim(),
        instructions: aiInstructions.trim() || undefined,
      })

      if (res.title) setTitle(res.title)
      if (res.content) setContent(res.content)
      setAiSuccessMsg("Materi berhasil digenerate oleh AI!")
      setShowAIGenerator(false)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal meng-generate materi dengan AI.")
    } finally {
      setIsGeneratingAI(false)
    }
  }

  // Submit Material
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setErrorMsg("Judul materi wajib diisi.")
      return
    }

    setLoading(true)
    setErrorMsg("")

    try {
      let targetModuleId: number | undefined = undefined

      if (selectedModuleId === "new") {
        const modTitle = newModuleTitle.trim() || "Modul: Materi Perkuliahan"
        const createdMod = await createModule(courseId, { title: modTitle })
        targetModuleId = createdMod.id
      } else {
        targetModuleId = Number(selectedModuleId)
      }

      const created = await createMaterial(courseId, {
        moduleId: targetModuleId,
        title: title.trim(),
        type,
        content: content.trim() || undefined,
        fileUrl: fileUrl.trim() || undefined,
      })

      onMaterialCreated(created)
      onClose()
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Gagal menambahkan materi perkuliahan.")
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
                Manajemen Silabus &bull; {courseTitle}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white font-heading mt-0.5">
              Tambah Materi Perkuliahan Baru
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
              Tambahkan bahan ajar teks, gambar, berkas dokumen, atau buat materi otomatis dengan bantuan AI.
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

          {/* Module Selector */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
              Pilih Modul Pembelajaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedModuleId}
                onChange={(e) => setSelectedModuleId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-brand-600"
              >
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
                <option value="new">+ Buat Modul Baru...</option>
              </select>

              {selectedModuleId === "new" && (
                <input
                  type="text"
                  placeholder="Nama modul baru (cth: Modul 2: OOP)"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
                  required
                />
              )}
            </div>
          </div>

          {/* AI Generator Panel Toggle */}
          <div className="rounded-xl border border-brand-200 dark:border-brand-800/60 bg-gradient-to-r from-brand-50/70 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-brand-600 text-white flex items-center justify-center text-xs">
                  ✨
                </span>
                <div>
                  <span className="font-bold text-xs text-brand-900 dark:text-brand-200 font-heading">
                    Generate Materi dengan AI
                  </span>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                    Ketik topik materi, AI akan menyusun artikel, poin konsep, dan contoh materi secara otomatis.
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
                    Topik / Pembahasan Materi
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Binary Search Tree, Enkripsi Kriptografi, atau RESTful API"
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
                    placeholder="Contoh: Sertakan contoh kode Python dan 3 pertanyaan diskusi"
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
                      <span>Menyusun Materi dengan AI...</span>
                    </>
                  ) : (
                    <>
                      <span>✨ Susun Materi Secara Otomatis</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Material Title */}
          <div className="space-y-1">
            <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
              Judul Materi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Pengenalan Binary Search Tree & Kompleksitas Algoritma"
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
              required
            />
          </div>

          {/* Material Type Chips */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
              Tipe Konten Materi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "TEXT" as const, label: "Teks / Artikel", icon: "📄" },
                { key: "IMAGE" as const, label: "Gambar / Diagram", icon: "🖼️" },
                { key: "FILE" as const, label: "Berkas Dokumen", icon: "📎" },
                { key: "VIDEO" as const, label: "URL / Video", icon: "🔗" },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setType(t.key)}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    type === t.key
                      ? "bg-brand-50 dark:bg-brand-950/60 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300 font-bold shadow-2xs"
                      : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upload Gambar / File / URL based on Type */}
          {(type === "IMAGE" || type === "FILE") && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
                  {type === "IMAGE" ? "Upload Gambar / Diagram" : "Upload Dokumen (PDF, PPT, DOCX, ZIP)"}
                </span>
                {fileUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveUploadedFile}
                    className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                  >
                    Hapus File
                  </button>
                )}
              </div>

              {!fileUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-xl text-center cursor-pointer bg-white dark:bg-zinc-900 transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept={type === "IMAGE" ? "image/png,image/jpeg,image/webp,image/svg+xml" : ".pdf,.docx,.doc,.pptx,.ppt,.zip,.rar,.txt"}
                    className="hidden"
                  />
                  <div className="space-y-1">
                    <span className="text-2xl">{type === "IMAGE" ? "🖼️" : "📁"}</span>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      Klik untuk memilih berkas atau seret ke sini
                    </p>
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-300">
                      {type === "IMAGE" ? "PNG, JPG, WebP, SVG (Maks. 15MB)" : "PDF, Word, PPTX, ZIP (Maks. 15MB)"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    {type === "IMAGE" ? (
                      <img src={fileUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800 shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                        DOC
                      </span>
                    )}
                    <div className="truncate">
                      <p className="font-semibold text-zinc-800 dark:text-zinc-100 text-xs truncate">{fileName || "Berkas Terpilih"}</p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-300">{fileSize || "Siap diunggah"}</p>
                    </div>
                  </div>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">✓ Siap</span>
                </div>
              )}

              {/* Direct URL Fallback option */}
              <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-800 space-y-1">
                <span className="text-[11px] text-zinc-500 dark:text-zinc-200">Atau masukkan URL gambar/berkas langsung:</span>
                <input
                  type="text"
                  placeholder="https://example.com/file.pdf"
                  value={fileUrl.startsWith("data:") ? "" : fileUrl}
                  onChange={(e) => {
                    setFileUrl(e.target.value)
                    setFileName(e.target.value)
                  }}
                  className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
                />
              </div>
            </div>
          )}

          {/* URL / Video Input */}
          {type === "VIDEO" && (
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-850 space-y-2">
              <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
                Tautan / Link Materi Video atau Web <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... atau https://tautan-materi.com"
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600"
                required
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                Masukkan tautan YouTube, video Google Drive, atau referensi website luar.
              </p>
            </div>
          )}

          {/* Content / Markdown Textarea */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-zinc-800 dark:text-zinc-100 text-xs">
                Isi Penjelasan / Deskripsi Materi (Mendukung Markdown)
              </label>
              <span className="text-[11px] text-zinc-400 dark:text-zinc-300">{content.length} karakter</span>
            </div>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan rangkuman, pembahasan, penjelasan, atau gunakan tombol AI di atas untuk mengisi secara otomatis..."
              className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs text-zinc-900 dark:text-white font-mono bg-white dark:bg-zinc-800 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-brand-600 leading-relaxed"
            />
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
                  <span>Menyimpan Materi...</span>
                </>
              ) : (
                <>
                  <span>Simpan & Publikasikan Materi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
