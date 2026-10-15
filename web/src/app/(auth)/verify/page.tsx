"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"
import { sendVerificationCode, verifyAccount } from "@/lib/api"

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, refreshUser } = useAuth()

  const queryEmail = searchParams.get("email") || ""
  const [email, setEmail] = useState(queryEmail || user?.email || "")
  const [code, setCode] = useState("")
  const [codeSent, setCodeSent] = useState(false)
  const [isSuccess, setIsSuccess] = useState(user?.isVerified || false)

  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")

  // 60-second cooldown timer for resending OTP
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email)
    }
  }, [user, email])

  useEffect(() => {
    let timer: NodeJS.Timeout
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown((prev) => prev - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [cooldown])

  // Send verification code
  const handleSendCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!email.trim() || cooldown > 0) return

    setError("")
    setSuccessMsg("")
    setLoading(true)

    try {
      const res = await sendVerificationCode(email, "ACCOUNT_VERIFICATION")
      setSuccessMsg(res.message || "Kode verifikasi 6 digit telah dikirim ke email Anda.")
      setCodeSent(true)
      setCooldown(60)
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Gagal mengirim kode verifikasi. Pastikan email benar."
      )
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP code
  const handleResendCode = async () => {
    if (cooldown > 0 || resendLoading || !email.trim()) return
    setError("")
    setResendLoading(true)

    try {
      const res = await sendVerificationCode(email, "ACCOUNT_VERIFICATION")
      setSuccessMsg(res.message || "Kode verifikasi baru berhasil dikirim.")
      setCooldown(60)
    } catch (err: any) {
      setError(err.response?.data?.error || "Gagal mengirim ulang kode verifikasi.")
    } finally {
      setResendLoading(false)
    }
  }

  // Verify account with OTP
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (code.trim().length !== 6) {
      setError("Masukkan 6 digit kode verifikasi dengan benar.")
      return
    }

    setLoading(true)

    try {
      await verifyAccount(email.trim(), code.trim())
      setIsSuccess(true)
      await refreshUser()
    } catch (err: any) {
      setError(
        err.response?.data?.error || "Kode verifikasi salah atau telah kedaluwarsa. Silakan periksa kembali."
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
              <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">Verifikasi Akun</span>
            </div>
          </div>
          <h1 className="text-base font-bold text-zinc-900 dark:text-white font-heading pt-1">
            {isSuccess ? "Akun Terverifikasi" : "Verifikasi Email Akun"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-200">
            {isSuccess
              ? "Email dan akun Anda telah terverifikasi resmi di Aksara LMS."
              : "Amankan akun Anda dengan memverifikasi alamat email terdaftar."}
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

          {/* Success Message Banner */}
          {successMsg && !isSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium shadow-xs">
              {successMsg}
            </div>
          )}

          {/* ─── State: Already or Newly Verified ─── */}
          {isSuccess ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">Selamat! Akun Telah Aktif</h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200">
                  Email <strong>{email}</strong> telah berhasil diverifikasi. Anda sekarang dapat mengakses seluruh fitur pembelajaran.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(user ? "/dashboard" : "/login")}
                className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {user ? "Masuk ke Dashboard" : "Masuk ke Akun"}
              </button>
            </div>
          ) : (
            /* ─── State: Verification Form ─── */
            <form onSubmit={codeSent ? handleVerify : handleSendCode} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1.5 block uppercase tracking-wider font-heading">
                  Alamat Email
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
                    disabled={codeSent && cooldown > 0}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all disabled:bg-zinc-50 dark:disabled:bg-zinc-850 disabled:text-zinc-500 dark:disabled:text-zinc-400"
                    required
                  />
                </div>
              </div>

              {codeSent && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 uppercase tracking-wider font-heading">
                      Kode Verifikasi (6 Digit)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCodeSent(false)
                        setCode("")
                        setError("")
                      }}
                      className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold cursor-pointer"
                    >
                      Ubah Email
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
              )}

              {codeSent ? (
                <>
                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Memverifikasi...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Verifikasi Akun Sekarang</span>
                      </>
                    )}
                  </button>

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
                </>
              ) : (
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>Kirim Kode Verifikasi</span>
                    </>
                  )}
                </button>
              )}
            </form>
          )}

          {/* Navigation link */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-center flex items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-300 hover:text-zinc-800 dark:hover:text-white transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{user ? "Kembali ke Dashboard" : "Kembali ke Masuk"}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-200 animate-pulse">Memuat halaman verifikasi...</div>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
