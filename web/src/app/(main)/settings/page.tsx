"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import {
  fetch2FASetup,
  verify2FASetup,
  disable2FA,
  fetch2FABackupCodes,
  regenerate2FABackupCodes,
  TwoFASetupResponse,
} from "@/lib/api"

export default function SettingsPage() {
  const { user, updateUserProfile, refreshUser } = useAuth()
  const { theme, resolvedTheme, setTheme } = useTheme()

  // ─── Contact Info State ───────────────────────────────────────────
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [savingContact, setSavingContact] = useState(false)
  const [contactSuccess, setContactSuccess] = useState(false)
  const [contactError, setContactError] = useState<string | null>(null)

  // ─── 2FA Core State ──────────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [bannerFeedback, setBannerFeedback] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  // ─── 2FA Setup Modal State ───────────────────────────────────────
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [setupStep, setSetupStep] = useState<"scan" | "success">("scan")
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null)
  const [setupCode, setSetupCode] = useState("")
  const [setupVerifying, setSetupVerifying] = useState(false)
  const [setupError, setSetupError] = useState<string | null>(null)
  const [setupBackupCodes, setSetupBackupCodes] = useState<string[]>([])
  const [secretCopied, setSecretCopied] = useState(false)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)

  // ─── 2FA Backup Codes Modal State ────────────────────────────────
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [backupCodesList, setBackupCodesList] = useState<string[]>([])
  const [loadingBackupCodes, setLoadingBackupCodes] = useState(false)
  const [backupModalError, setBackupModalError] = useState<string | null>(null)
  const [regenerateMode, setRegenerateMode] = useState(false)
  const [regenerateCode, setRegenerateCode] = useState("")
  const [regenerating, setRegenerating] = useState(false)
  const [regenerateSuccess, setRegenerateSuccess] = useState<string | null>(null)

  // ─── 2FA Disable Modal State ─────────────────────────────────────
  const [showDisableModal, setShowDisableModal] = useState(false)
  const [disableMethod, setDisableMethod] = useState<"code" | "password">("code")
  const [disableCode, setDisableCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [disabling, setDisabling] = useState(false)
  const [disableError, setDisableError] = useState<string | null>(null)

  // Populate from user context
  useEffect(() => {
    if (user) {
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setTwoFactorEnabled(!!user.twoFactorEnabled)
    }
  }, [user])

  // Handle contact info submit
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault()
    setContactError(null)
    setContactSuccess(false)

    if (!email.trim()) {
      setContactError("Alamat email tidak boleh kosong.")
      return
    }

    try {
      setSavingContact(true)
      await updateUserProfile({
        email: email.trim(),
        phone: phone.trim() || undefined,
      })
      await refreshUser()
      setContactSuccess(true)
      setTimeout(() => setContactSuccess(false), 4000)
    } catch (err: any) {
      const errMsg =
        err.response?.data?.error ||
        "Gagal menyimpan perubahan kontak. Pastikan format email valid."
      setContactError(errMsg)
    } finally {
      setSavingContact(false)
    }
  }

  // ─── 2FA Setup Flow ──────────────────────────────────────────────
  const handleStartSetup = async () => {
    setShowSetupModal(true)
    setSetupStep("scan")
    setSetupCode("")
    setSetupError(null)
    setSetupLoading(true)
    setSecretCopied(false)
    setBackupCodesCopied(false)

    try {
      const data = await fetch2FASetup()
      setSetupData(data)
    } catch (err: any) {
      setSetupError(
        err.response?.data?.error ||
          "Gagal memuat kunci Google Authenticator. Coba beberapa saat lagi."
      )
    } finally {
      setSetupLoading(false)
    }
  }

  const handleVerifySetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupError(null)

    const cleanCode = setupCode.trim()
    if (cleanCode.length !== 6) {
      setSetupError("Masukkan 6 digit kode dari Google Authenticator.")
      return
    }

    try {
      setSetupVerifying(true)
      const res = await verify2FASetup(cleanCode)
      setSetupBackupCodes(res.backupCodes || [])
      setSetupStep("success")
      setTwoFactorEnabled(true)
      await refreshUser()
      setBannerFeedback({
        type: "success",
        text: "Google Authenticator berhasil diaktifkan untuk akun Anda.",
      })
      setTimeout(() => setBannerFeedback(null), 5000)
    } catch (err: any) {
      setSetupError(
        err.response?.data?.error ||
          "Kode verifikasi salah atau kedaluwarsa. Pastikan jam di ponsel Anda akurat."
      )
    } finally {
      setSetupVerifying(false)
    }
  }

  const copySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret)
      setSecretCopied(true)
      setTimeout(() => setSecretCopied(false), 2000)
    }
  }

  const copyCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join("\n"))
    setBackupCodesCopied(true)
    setTimeout(() => setBackupCodesCopied(false), 2000)
  }

  const downloadCodes = (codes: string[]) => {
    const text = [
      "=== KODE CADANGAN GOOGLE AUTHENTICATOR (AKSARA LMS) ===",
      `Akun: ${user?.email || ""}`,
      `Dibuat: ${new Date().toLocaleString("id-ID")}`,
      "",
      "PERHATIAN:",
      "- Setiap kode hanya berlaku SATU KALI untuk masuk ke akun Anda.",
      "- Simpan file ini di tempat yang aman dan rahasia.",
      "",
      "DAFTAR KODE CADANGAN:",
      ...codes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n")

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `aksara-lms-backup-codes-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ─── 2FA Backup Codes View & Regenerate ───────────────────────────
  const handleOpenBackupModal = async () => {
    setShowBackupModal(true)
    setBackupModalError(null)
    setRegenerateSuccess(null)
    setRegenerateMode(false)
    setRegenerateCode("")
    setLoadingBackupCodes(true)

    try {
      const res = await fetch2FABackupCodes()
      setBackupCodesList(res.backupCodes || [])
    } catch (err: any) {
      setBackupModalError(
        err.response?.data?.error || "Gagal mengambil kode cadangan akun."
      )
    } finally {
      setLoadingBackupCodes(false)
    }
  }

  const handleRegenerateBackup = async (e: React.FormEvent) => {
    e.preventDefault()
    setBackupModalError(null)
    setRegenerateSuccess(null)

    const cleanCode = regenerateCode.trim()
    if (cleanCode.length !== 6) {
      setBackupModalError("Masukkan 6 digit kode dari Google Authenticator.")
      return
    }

    try {
      setRegenerating(true)
      const res = await regenerate2FABackupCodes(cleanCode)
      setBackupCodesList(res.backupCodes || [])
      setRegenerateMode(false)
      setRegenerateCode("")
      setRegenerateSuccess(
        "8 kode cadangan baru berhasil dibuat! Kode lama sudah tidak berlaku."
      )
    } catch (err: any) {
      setBackupModalError(
        err.response?.data?.error ||
          "Kode keamanan salah. Masukkan 6 digit yang sedang aktif di aplikasi."
      )
    } finally {
      setRegenerating(false)
    }
  }

  // ─── 2FA Disable Flow ─────────────────────────────────────────────
  const handleOpenDisableModal = () => {
    setShowDisableModal(true)
    setDisableMethod("code")
    setDisableCode("")
    setDisablePassword("")
    setDisableError(null)
  }

  const handleConfirmDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setDisableError(null)

    const payload: { code?: string; password?: string } = {}
    if (disableMethod === "code") {
      if (!disableCode.trim()) {
        setDisableError("Masukkan 6 digit kode dari Google Authenticator.")
        return
      }
      payload.code = disableCode.trim()
    } else {
      if (!disablePassword) {
        setDisableError("Masukkan kata sandi akun Anda.")
        return
      }
      payload.password = disablePassword
    }

    try {
      setDisabling(true)
      await disable2FA(payload)
      setTwoFactorEnabled(false)
      setShowDisableModal(false)
      await refreshUser()
      setBannerFeedback({
        type: "success",
        text: "Google Authenticator (2FA) telah dinonaktifkan.",
      })
      setTimeout(() => setBannerFeedback(null), 5000)
    } catch (err: any) {
      setDisableError(
        err.response?.data?.error ||
          "Konfirmasi gagal. Periksa kembali kode atau password yang dimasukkan."
      )
    } finally {
      setDisabling(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* ─── Page Header ─────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-xs space-y-2 transition-colors">
        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-200">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-200">Pengaturan</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="page-title text-xl sm:text-2xl">Pengaturan Akun (Settings)</h1>
            <p className="page-subtitle text-xs sm:text-sm">
              Kelola informasi kontak, autentikasi 2FA Google Authenticator, dan preferensi tema tampilan.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              {user?.role === "TEACHER" ? "Dosen" : "Mahasiswa"}
            </span>
          </div>
        </div>
      </div>

      {/* Global Notification Banner */}
      {bannerFeedback && (
        <div
          className={`p-4 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-xs animate-in fade-in ${
            bannerFeedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {bannerFeedback.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{bannerFeedback.text}</span>
          </div>
          <button
            onClick={() => setBannerFeedback(null)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            &times;
          </button>
        </div>
      )}

      {/* ─── 1. Informasi Kontak (Email & No HP) ──────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
              Informasi Kontak
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-200">
              Email resmi dan nomor handphone untuk keperluan autentikasi dan notifikasi perkuliahan.
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <form onSubmit={handleSaveContact} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="settings-email" className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
                Alamat Email
              </label>
              {user?.isVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  Belum Verifikasi
                </span>
              )}
            </div>
            <div className="relative">
              <input
                id="settings-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@universitas.ac.id"
                required
                className="input pl-9"
              />
              <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-200 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
              Digunakan sebagai akun login utama dan menerima pemberitahuan pengumuman resmi.
            </p>
          </div>

          {/* No HP Field */}
          <div className="space-y-1.5">
            <label htmlFor="settings-phone" className="text-xs font-bold text-zinc-700 dark:text-zinc-200">
              Nomor Handphone (WhatsApp)
            </label>
            <div className="relative">
              <input
                id="settings-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Contoh: 081234567890 atau +628123456789"
                className="input pl-9"
              />
              <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-200 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
              Membantu pengiriman notifikasi pengingat tenggat tugas kuliah dan kuis melalui WhatsApp / SMS.
            </p>
          </div>

          {/* Feedback messages */}
          {contactSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Informasi kontak berhasil disimpan.</span>
            </div>
          )}

          {contactError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-medium flex items-center gap-2">
              <svg className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>{contactError}</span>
            </div>
          )}

          {/* Action button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingContact}
              className="btn-primary py-2 px-5 text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-2xs cursor-pointer"
            >
              {savingContact ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Perubahan Kontak</span>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ─── 2. Keamanan Akun & Google Authenticator (2FA) ───────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                Google Authenticator (2FA)
              </h2>
              {twoFactorEnabled ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Aktif & Terlindungi
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-200 bg-zinc-200/60 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full border border-zinc-300 dark:border-zinc-700">
                  Belum Aktif
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-200">
              Autentikasi dua langkah berbasis waktu (RFC 6238 TOTP) untuk mengamankan akun dari pembobolan.
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* Status Box & Actions */}
        {twoFactorEnabled ? (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Akun Anda Terproteksi Dua Langkah
                  </h3>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed max-w-xl">
                  Setiap kali login, sistem akan meminta 6 digit kode keamanan dari aplikasi Google Authenticator di smartphone Anda, atau kode cadangan darurat.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleOpenBackupModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700/60 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <span>Kode Cadangan</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenDisableModal}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Nonaktifkan 2FA</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-emerald-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Bekerja Offline</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-0.5 leading-relaxed">
                    Kode 6-digit berganti setiap 30 detik tanpa memerlukan internet atau pulsa SMS di smartphone.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex items-start gap-3">
                <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-brand-600 shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-zinc-900 dark:text-zinc-100">Kode Cadangan Tersedia</div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-0.5 leading-relaxed">
                    Jika ponsel tertinggal atau rusak, Anda dapat masuk menggunakan kode cadangan sekali pakai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  Aktifkan Verifikasi Dua Langkah (2FA)
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-200 leading-relaxed">
                  Tambahkan perlindungan ekstra pada akun Anda dengan memindai kode QR menggunakan aplikasi Google Authenticator, Microsoft Authenticator, atau Authy.
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartSetup}
                className="btn-primary py-2.5 px-4 rounded-xl text-xs font-bold shadow-brand-down flex items-center justify-center gap-2 shrink-0 cursor-pointer hover:-translate-y-0.5 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span>Aktifkan Google Authenticator</span>
              </button>
            </div>

            {/* Instruction Checklist */}
            <div className="p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/40 space-y-2.5 text-xs">
              <div className="font-bold text-zinc-800 dark:text-zinc-200">Langkah Mudah Pengaktifan:</div>
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-zinc-200">
                <li>Instal aplikasi <span className="font-semibold text-zinc-800 dark:text-zinc-200">Google Authenticator</span> dari Play Store atau App Store.</li>
                <li>Klik tombol <span className="font-semibold text-brand-600 dark:text-brand-400">Aktifkan Google Authenticator</span> di atas untuk memunculkan kode QR.</li>
                <li>Pindai QR dengan kamera smartphone Anda, lalu masukkan 6 digit kode yang muncul.</li>
                <li>Simpan 8 kode cadangan sekali pakai untuk situasi darurat.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* ─── 3. Tema Tampilan (Dark Mode / Light Mode) ────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 p-6 shadow-xs space-y-5 transition-colors">
        <div className="border-b border-zinc-100 dark:border-zinc-800/80 pb-4 flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
              Tema Tampilan (Dark Mode / Light Mode)
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-200">
              Pilih mode tampilan antarmuka yang paling nyaman untuk mata Anda saat belajar atau mengajar.
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </div>
        </div>

        {/* 3 Theme Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Light Mode Option */}
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer ${
              theme === "light"
                ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 text-brand-900 dark:text-brand-100 shadow-2xs font-semibold"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-amber-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              {theme === "light" && (
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Light Mode</div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-0.5 leading-snug">
                Latar belakang terang dengan kontras tajam untuk belajar di siang hari.
              </p>
            </div>
          </button>

          {/* Dark Mode Option */}
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer ${
              theme === "dark"
                ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 text-brand-900 dark:text-brand-100 shadow-2xs font-semibold"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              </div>
              {theme === "dark" && (
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white">Dark Mode</div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-0.5 leading-snug">
                Latar gelap yang meredam silau dan mengurangi kelelahan mata di malam hari.
              </p>
            </div>
          </button>

          {/* System Option */}
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 cursor-pointer ${
              theme === "system"
                ? "border-brand-600 bg-brand-50/50 dark:bg-brand-950/30 text-brand-900 dark:text-brand-100 shadow-2xs font-semibold"
                : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:bg-zinc-100/70 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {theme === "system" && (
                <span className="w-2 h-2 rounded-full bg-brand-600"></span>
              )}
            </div>
            <div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Sistem (Otomatis)</div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-0.5 leading-snug">
                Menyesuaikan secara dinamis mengikuti setelan tema perangkat Anda ({resolvedTheme}).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: SETUP GOOGLE AUTHENTICATOR                             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showSetupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-5 max-h-[92vh] overflow-y-auto">
            {setupStep === "scan" ? (
              <>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                      Konfigurasi Google Authenticator
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-200">
                      Pindai kode QR berikut menggunakan aplikasi Google Authenticator di ponsel Anda.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSetupModal(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none cursor-pointer p-1"
                  >
                    &times;
                  </button>
                </div>

                {setupLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-200">Menyiapkan kunci keamanan...</span>
                  </div>
                ) : setupError && !setupData ? (
                  <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                    {setupError}
                  </div>
                ) : (
                  setupData && (
                    <div className="space-y-4">
                      {/* QR Display */}
                      <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                        <div className="p-3 bg-white keep-white rounded-xl shadow-xs border border-zinc-200">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={setupData.qrCode}
                            alt="QR Code Google Authenticator"
                            className="w-44 h-44 object-contain block mx-auto"
                          />
                        </div>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-200 mt-2 font-medium">
                          {setupData.account}
                        </span>
                      </div>

                      {/* Manual Entry Key */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 dark:text-zinc-200">
                            Tidak dapat memindai? Masukkan kode rahasia ini:
                          </span>
                          <button
                            type="button"
                            onClick={copySecret}
                            className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>{secretCopied ? "Tersalin!" : "Salin Kunci"}</span>
                          </button>
                        </div>
                        <div className="px-3.5 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-center text-xs sm:text-sm font-bold tracking-widest text-zinc-800 dark:text-zinc-200 select-all">
                          {setupData.secret}
                        </div>
                      </div>

                      {/* 6 Digit Verification Form */}
                      <form onSubmit={handleVerifySetup} className="space-y-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <div>
                          <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200 block mb-1">
                            Masukkan 6 Digit Kode dari Google Authenticator:
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={6}
                            autoFocus
                            placeholder="000000"
                            value={setupCode}
                            onChange={(e) => setSetupCode(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold text-xl tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                            required
                          />
                        </div>

                        {setupError && (
                          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                            {setupError}
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={() => setShowSetupModal(false)}
                            className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            disabled={setupVerifying || setupCode.trim().length !== 6}
                            className="btn-primary py-2.5 px-5 rounded-xl text-xs font-bold shadow-brand-down disabled:opacity-50 cursor-pointer flex items-center gap-2"
                          >
                            {setupVerifying ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Memverifikasi...</span>
                              </>
                            ) : (
                              <span>Verifikasi & Aktifkan</span>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )
                )}
              </>
            ) : (
              /* Success Step: Show Backup Codes */
              <div className="space-y-4">
                <div className="text-center space-y-2 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                    Google Authenticator Berhasil Diaktifkan!
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-200 max-w-sm mx-auto">
                    Simpan kode cadangan (backup codes) berikut di tempat yang aman.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>PENTING: Jangan Hilangkan Kode Ini</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300/90">
                    Setiap kode hanya bisa digunakan 1 kali untuk login jika Anda kehilangan smartphone atau aplikasi Google Authenticator terhapus.
                  </p>
                </div>

                {/* Grid of 8 Backup Codes */}
                <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  {setupBackupCodes.map((code, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-xs"
                    >
                      {code}
                    </div>
                  ))}
                </div>

                {/* Actions: Copy & Download */}
                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyCodes(setupBackupCodes)}
                    className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{backupCodesCopied ? "Semua Kode Tersalin!" : "Salin Semua Kode"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadCodes(setupBackupCodes)}
                    className="w-full sm:w-1/2 py-2.5 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Unduh Kode (.txt)</span>
                  </button>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowSetupModal(false)}
                    className="btn-primary w-full py-2.5 rounded-xl text-xs font-bold shadow-brand-down cursor-pointer"
                  >
                    Saya Sudah Menyimpan Kode Cadangan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: VIEW / REGENERATE BACKUP CODES                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showBackupModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-lg w-full shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 font-heading">
                  Kode Cadangan Darurat (Backup Codes)
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Gunakan kode ini untuk masuk jika Anda tidak memiliki akses ke aplikasi Google Authenticator.
                </p>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            {loadingBackupCodes ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-zinc-500 dark:text-zinc-200">Memuat kode cadangan...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {regenerateSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{regenerateSuccess}</span>
                  </div>
                )}

                {backupModalError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                    {backupModalError}
                  </div>
                )}

                {backupCodesList.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 font-mono text-center text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      {backupCodesList.map((code, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-xs"
                        >
                          {code}
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <button
                        type="button"
                        onClick={() => copyCodes(backupCodesList)}
                        className="w-full sm:w-1/2 py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>{backupCodesCopied ? "Tersalin!" : "Salin Semua"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => downloadCodes(backupCodesList)}
                        className="w-full sm:w-1/2 py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Unduh File (.txt)</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-center text-xs text-zinc-500 dark:text-zinc-200">
                    Tidak ada kode cadangan yang tersisa. Silakan buat ulang kode baru di bawah.
                  </div>
                )}

                {/* Regenerate Section */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  {!regenerateMode ? (
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-zinc-500 dark:text-zinc-200">
                        Kode hampir habis atau bocor?
                      </div>
                      <button
                        type="button"
                        onClick={() => setRegenerateMode(true)}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 hover:underline cursor-pointer"
                      >
                        Buat Ulang 8 Kode Baru
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRegenerateBackup} className="space-y-3 p-3.5 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        Konfirmasi Pembuatan Ulang Kode
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-200">
                        Masukkan 6 digit kode dari Google Authenticator untuk mengonfirmasi pembuatan 8 kode cadangan baru:
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        placeholder="000000"
                        value={regenerateCode}
                        onChange={(e) => setRegenerateCode(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-center font-mono font-bold text-base tracking-widest text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-brand-600"
                        required
                      />
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRegenerateMode(false)
                            setRegenerateCode("")
                            setBackupModalError(null)
                          }}
                          className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={regenerating || regenerateCode.trim().length !== 6}
                          className="btn-primary py-1.5 px-4 rounded-lg text-xs font-bold disabled:opacity-50 cursor-pointer"
                        >
                          {regenerating ? "Memproses..." : "Konfirmasi Buat Baru"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowBackupModal(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: DISABLE 2FA CONFIRMATION                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full shadow-2xl p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 font-heading flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Nonaktifkan Google Authenticator?</span>
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Akun Anda tidak lagi dilindungi oleh verifikasi dua langkah. Anda hanya akan memerlukan email dan password untuk masuk.
                </p>
              </div>
              <button
                onClick={() => setShowDisableModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-lg leading-none cursor-pointer p-1"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmDisable} className="space-y-3.5 pt-2">
              <div className="flex items-center gap-3 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setDisableMethod("code")}
                  className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                    disableMethod === "code"
                      ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-200 dark:hover:text-white"
                  }`}
                >
                  Kode Google Auth
                </button>
                <button
                  type="button"
                  onClick={() => setDisableMethod("password")}
                  className={`flex-1 py-1.5 rounded-lg text-center cursor-pointer transition-all ${
                    disableMethod === "password"
                      ? "bg-white dark:bg-zinc-900 shadow-2xs text-zinc-900 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-200 dark:hover:text-white"
                  }`}
                >
                  Kata Sandi Akun
                </button>
              </div>

              {disableMethod === "code" ? (
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1 block">
                    6 Digit Kode dari Google Authenticator:
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center font-mono font-bold text-lg tracking-widest text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1 block">
                    Kata Sandi Akun Anda:
                  </label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="Masukkan kata sandi untuk verifikasi"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              {disableError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300">
                  {disableError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisableModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={disabling}
                  className="py-2.5 px-5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {disabling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Menonaktifkan...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Nonaktifkan</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
