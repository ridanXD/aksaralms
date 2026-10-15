"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { fetchStudentProfile, StudentProfileResponse } from "@/lib/api"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { StatCard } from "@/components/ui/StatCard"
import { EmptyState } from "@/components/ui/EmptyState"

export default function ProfilePage() {
  const { user, logout, updateUserProfile } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoMsg, setPhotoMsg] = useState<{ text: string; isError: boolean } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user?.role === "STUDENT") {
      fetchStudentProfile()
        .then(setProfile)
        .catch(() => setProfile(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [user])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoMsg(null)

    // Check max file size: 200 KB = 200 * 1024 = 204,800 bytes
    const MAX_SIZE_BYTES = 200 * 1024
    if (file.size > MAX_SIZE_BYTES) {
      setPhotoMsg({
        text: `Ukuran foto melebihi batas (${(file.size / 1024).toFixed(1)} KB). Maksimal ukuran file adalah 200 KB.`,
        isError: true,
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (!file.type.startsWith("image/")) {
      setPhotoMsg({
        text: "File yang dipilih harus berformat gambar (PNG, JPG, JPEG, WEBP).",
        isError: true,
      })
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setUploadingPhoto(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          await updateUserProfile({ avatar: base64 })
          setPhotoMsg({ text: "Foto profil berhasil diperbarui.", isError: false })
        } catch (err: any) {
          setPhotoMsg({
            text: err.response?.data?.error || "Gagal mengunggah foto profil.",
            isError: true,
          })
        } finally {
          setUploadingPhoto(false)
        }
      }
      reader.onerror = () => {
        setPhotoMsg({ text: "Gagal membaca file gambar.", isError: true })
        setUploadingPhoto(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setPhotoMsg({ text: "Terjadi kesalahan saat memproses gambar.", isError: true })
      setUploadingPhoto(false)
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemovePhoto = async () => {
    if (uploadingPhoto) return
    setUploadingPhoto(true)
    setPhotoMsg(null)
    try {
      await updateUserProfile({ avatar: "" })
      setPhotoMsg({ text: "Foto profil telah dihapus.", isError: false })
    } catch {
      setPhotoMsg({ text: "Gagal menghapus foto profil.", isError: true })
    } finally {
      setUploadingPhoto(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handlePhotoSelect}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />

      {/* ─── Profile Header ──────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-down space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Round Avatar with Upload Badge */}
            <div className="relative group shrink-0">
              <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 flex items-center justify-center shadow-xs overflow-hidden">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name || "Foto Profil"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="w-8 h-8 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shadow-xs text-zinc-600 dark:text-zinc-300 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-400 dark:hover:border-brand-500 transition-colors disabled:opacity-50"
                title="Pilih foto baru (Maks. 200 KB)"
                aria-label="Ubah foto profil"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-900 dark:text-white font-heading">{user?.name || "Pengguna Aksara"}</h1>
                <Badge variant={user?.role === "TEACHER" ? "warning" : "primary"}>
                  {user?.role === "TEACHER" ? "Dosen Pengampu" : "Mahasiswa"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-300">{user?.email}</p>
              
              {/* Photo Actions */}
              <div className="flex items-center gap-2 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-semibold hover:underline disabled:opacity-50"
                >
                  {uploadingPhoto ? "Mengunggah..." : "Ubah Foto"}
                </button>
                <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                <span className="text-[11px] text-zinc-400 dark:text-zinc-300">Maks. 200 KB</span>
                {user?.avatar && (
                  <>
                    <span className="text-zinc-300 dark:text-zinc-600">&middot;</span>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-semibold hover:underline disabled:opacity-50"
                    >
                      Hapus
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              href="/settings"
              className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Pengaturan</span>
            </Link>
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs py-1.5 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {photoMsg && (
          <div
            className={`p-3 rounded border text-xs font-medium flex items-center justify-between gap-2 ${
              photoMsg.isError
                ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200"
                : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200"
            }`}
          >
            <span>{photoMsg.text}</span>
            <button
              onClick={() => setPhotoMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 p-0.5"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ─── Student Learning Analytics ──────────────────────────────────── */}
      {user?.role === "STUDENT" && profile && (
        <>
          {/* Key Metrics */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Nilai Rata-rata"
              value={profile.overview.overallMastery}
              trend={profile.overview.improvingCount > 0 ? "up" : "neutral"}
              trendLabel={`${profile.overview.improvingCount} topik naik`}
              accent="primary"
            />
            <StatCard
              title="Skor Kuis Tertinggi"
              value={profile.personalBests.highestQuizScore}
              subtitle="Personal Best"
              accent="emerald"
            />
            <StatCard
              title="Kecepatan Respon"
              value={`${profile.personalBests.fastestAnswerSec}s`}
              subtitle="Waktu tercepat"
              accent="primary"
            />
            <StatCard
              title="Skor Akurasi"
              value={profile.personalBests.overallAccuracy}
              subtitle={`${profile.personalBests.totalQuestionsAnswered} soal dijawab`}
              accent="amber"
            />
          </section>

          {/* Detailed Topic Masteries Table */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-down space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                  Matriks Nilai Rata-rata Topik
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-300">
                  Total {profile.topicMasteries.length} topik terpetakan dari riwayat kuis dan latihan adaptif
                </p>
              </div>
            </div>

            {profile.topicMasteries.length === 0 ? (
              <EmptyState
                title="Belum Ada Topik Terdata"
                description="Mulai ikuti kuis untuk membangun profil nilai topik materi."
                actionLabel="Jelajahi Kuis"
                actionHref="/quiz"
              />
            ) : (
              <div className="overflow-x-auto rounded border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Topik</th>
                      <th className="py-2.5 px-3">Nilai Rata-rata</th>
                      <th className="py-2.5 px-3">Tren</th>
                      <th className="py-2.5 px-3">Skor Akurasi</th>
                      <th className="py-2.5 px-3">Attempt</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {profile.topicMasteries.map((tm) => (
                      <tr key={tm.topic} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white font-heading">{tm.topic}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-zinc-900 dark:text-white w-8">{tm.masteryScore}</span>
                            <ProgressBar value={tm.masteryScore} size="sm" className="w-20" />
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <Badge
                            variant={
                              tm.trend === "IMPROVING"
                                ? "success"
                                : tm.trend === "DECLINING"
                                ? "danger"
                                : "neutral"
                            }
                          >
                            {tm.trend === "IMPROVING" ? "Naik" : tm.trend === "DECLINING" ? "Turun" : "Stabil"}
                          </Badge>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300">
                          {tm.accuracy} <span className="text-[10px] text-zinc-400">({tm.recentAccuracy} akhir)</span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300">{tm.attempts} kali</td>
                        <td className="py-2.5 px-3 text-right">
                          <Link
                            href={`/ai-training?topic=${encodeURIComponent(tm.topic)}`}
                            className="text-brand-600 dark:text-brand-400 hover:underline font-semibold"
                          >
                            Latihan AI &rarr;
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Remediation Impact History */}
          <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-down space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider font-heading">
                  Riwayat Remedial Adaptif
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-300">
                  Peningkatan terukur dari setiap sesi intervensi latihan AI
                </p>
              </div>
            </div>

            {profile.remediationImpact.length === 0 ? (
              <EmptyState
                title="Belum Ada Riwayat Remedial"
                description="Ketika kamu menyelesaikan sesi latihan AI, peningkatan kemampuanmu akan tercatat di sini."
                actionLabel="Mulai Latihan AI Sekarang"
                actionHref="/ai-training"
              />
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                {profile.remediationImpact.map((rem) => (
                  <div key={rem.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-zinc-900 dark:text-white font-heading">{rem.topic}</span>
                        <span className="text-[10px] text-zinc-500 dark:text-zinc-300">Level {rem.difficulty}</span>
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-300 mt-0.5">
                        {rem.completedAt
                          ? new Date(rem.completedAt).toLocaleString("id-ID", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })
                          : "Selesai"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-medium">
                      <div className="text-zinc-500 dark:text-zinc-300">
                        Baseline: <span className="font-bold text-zinc-800 dark:text-white">{rem.preAccuracy}</span>
                      </div>
                      <span className="text-zinc-300 dark:text-zinc-600">&rarr;</span>
                      <div className="text-zinc-500 dark:text-zinc-300">
                        Hasil: <span className="font-bold text-emerald-700 dark:text-emerald-400">{rem.postAccuracy}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/60">
                        {rem.improvementDelta >= 0 ? `+${rem.improvementDelta}` : rem.improvementDelta} poin delta
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
