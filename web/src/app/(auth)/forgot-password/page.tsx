"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { sendVerificationCode, resetPassword } from "@/lib/api"

export default function ForgotPasswordPage() {
  const router = useRouter()

  // Steps: 1 = Email, 2 = Code & New Password, 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")

  // Resend cooldown timer (60 seconds)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  // Step 1: Send OTP
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await sendVerificationCode(email, "PASSWORD_RESET")
      setCooldown(60)
      setStep(2)
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Gagal mengirim kode verifikasi. Pastikan email terdaftar."
      )
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP in Step 2
  const handleResendCode = async () => {
    if (cooldown > 0 || resendLoading) return
    setError("")
    setResendLoading(true)

    try {
      await sendVerificationCode(email, "PASSWORD_RESET")
      setCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal mengirim ulang kode verifikasi.")
    } finally {
      setResendLoading(false)
    }
  }

  // Step 2: Submit Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (code.trim().length !== 6) {
      setError("Masukkan 6 digit kode verifikasi dengan benar.")
      return
    }

    if (newPassword.length < 6) {
      setError("Kata sandi baru minimal harus terdiri dari 6 karakter.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok.")
      return
    }

    setLoading(true)

    try {
      await resetPassword(email, code.trim(), newPassword)
      setStep(3)
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Gagal memperbarui kata sandi. Pastikan kode verifikasi sesuai."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-zinc-50 dark:bg-zinc-950 font-sans py-12">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3">
            <Image
              src="/aksara-logo.svg"
              alt="Aksara Logo"
              width={48}
              height={48}
              priority
              className="w-12 h-12 object-contain shrink-0"
            />
            <div className="text-left">
              <span className="font-bold text-zinc-900 dark:text-white text-lg leading-tight tracking-tight block font-heading">
                Aksara <span className="text-brand-600 dark:text-brand-400">LMS</span>
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">Pemulihan Akun</span>
            </div>
          </div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-white font-heading pt-1">
            {step === 1 && "Lupa Kata Sandi"}
            {step === 2 && "Verifikasi & Sandi Baru"}
            {step === 3 && "Berhasil Diperbarui"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-200">
            {step === 1 && "Masukkan email akun Anda untuk menerima kode verifikasi 6 digit."}
            {step === 2 && `Kode 6 digit telah dikirim ke ${email}.`}
            {step === 3 && "Kata sandi Anda siap digunakan untuk masuk."}
          </p>
        </div>

        {/* Card Box */}
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-5">
          {/* Error Notice */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium shadow-xs">
              {error}
            </div>
          )}

          {/* ─── STEP 1: Enter Email ─── */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5 block uppercase tracking-wider font-heading">
                  Email Akun
                </label>
                <div className="relative">
                  <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="email"
                    placeholder="nama@sekolah.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Mengirim Kode...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span>Kirim Kode Verifikasi</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ─── STEP 2: Enter OTP & New Password ─── */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider font-heading">
                    Kode Verifikasi (6 Digit)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1)
                      setError("")
                    }}
                    className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold cursor-pointer"
                  >
                    Ganti Email
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-center font-mono text-lg tracking-[0.4em] font-bold focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5 block uppercase tracking-wider font-heading">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Minimal 6 karakter"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5 block uppercase tracking-wider font-heading">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Ulangi kata sandi baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 pr-10 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-300 hover:text-zinc-600 dark:hover:text-white cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 6 || newPassword.length < 6}
                className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Memperbarui Sandi...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span>Simpan Kata Sandi Baru</span>
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={cooldown > 0 || resendLoading}
                  className="text-xs text-zinc-600 dark:text-zinc-200 hover:text-brand-600 dark:hover:text-brand-400 font-semibold disabled:text-zinc-400 dark:disabled:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendLoading
                    ? "Mengirim ulang..."
                    : cooldown > 0
                    ? `Kirim ulang kode dalam ${cooldown} detik`
                    : "Tidak menerima kode? Kirim Ulang"}
                </button>
              </div>
            </form>
          )}

          {/* ─── STEP 3: Success Screen ─── */}
          {step === 3 && (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">Kata Sandi Berhasil Diperbarui!</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Kata sandi baru Anda telah aktif. Anda dapat langsung masuk dengan sandi baru ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                Masuk Sekarang
              </button>
            </div>
          )}

          {/* Back to Login Link */}
          {step !== 3 && (
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Kembali ke Halaman Masuk</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
