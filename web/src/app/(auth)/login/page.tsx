"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

export default function LoginPage() {
  const { login, verify2FALogin, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // 2FA Google Authenticator state
  const [isTwoFactorStep, setIsTwoFactorStep] = useState(false)
  const [tempToken, setTempToken] = useState("")
  const [totpCode, setTotpCode] = useState("")
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [twoFactorLoading, setTwoFactorLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await login(email, password)
      if (res?.requiresTwoFactor && res?.tempToken) {
        setTempToken(res.tempToken)
        setIsTwoFactorStep(true)
        setTotpCode("")
      } else {
        router.push("/dashboard")
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Email atau password tidak sesuai")
    } finally {
      setLoading(false)
    }
  }

  const handleTwoFactorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setTwoFactorLoading(true)
    try {
      await verify2FALogin(tempToken, totpCode)
      router.push("/dashboard")
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          "Kode verifikasi salah atau telah kedaluwarsa. Silakan coba lagi."
      )
    } finally {
      setTwoFactorLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      await loginWithGoogle()
      router.push("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return
      }
      setError(
        err.response?.data?.error || err.message || "Gagal masuk menggunakan akun Google."
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  const fillCredential = (userEmail: string) => {
    setEmail(userEmail)
    setPassword("password123")
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-zinc-50 dark:bg-zinc-950 font-sans">
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
              <span className="text-xs text-zinc-500 dark:text-zinc-200 font-medium">Adaptive Learning Platform</span>
            </div>
          </div>
          <h1 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-heading pt-1">
            Masuk ke Portal Akademik
          </h1>
        </div>

        {/* Login Card */}
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-down-lg space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-medium shadow-xs">
              {error}
            </div>
          )}

          {isTwoFactorStep ? (
            <form onSubmit={handleTwoFactorSubmit} className="space-y-4">
              <div className="text-center space-y-1.5 pb-1">
                <div className="w-12 h-12 mx-auto rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-300 flex items-center justify-center shadow-xs">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                  Verifikasi Google Authenticator
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-200 leading-relaxed">
                  {useBackupCode
                    ? "Masukkan salah satu kode cadangan (backup code) Anda."
                    : "Buka aplikasi Google Authenticator di ponsel Anda dan masukkan 6 digit kode keamanan."}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1 block uppercase tracking-wider font-heading">
                  {useBackupCode ? "Kode Cadangan (Backup Code)" : "6-Digit Kode Keamanan"}
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder={useBackupCode ? "Contoh: A554-0FE6" : "000000"}
                  value={totpCode}
                  maxLength={useBackupCode ? 10 : 6}
                  onChange={(e) => setTotpCode(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-center font-mono font-bold text-lg sm:text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={twoFactorLoading || !totpCode.trim()}
                className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {twoFactorLoading ? "Memverifikasi..." : "Verifikasi & Masuk"}
              </button>

              <div className="pt-1 flex flex-col gap-2 text-center text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode)
                    setTotpCode("")
                    setError("")
                  }}
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-semibold hover:underline cursor-pointer"
                >
                  {useBackupCode
                    ? "Gunakan Kode Google Authenticator"
                    : "Kehilangan ponsel? Gunakan kode cadangan"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsTwoFactorStep(false)
                    setTotpCode("")
                    setError("")
                  }}
                  className="text-zinc-500 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white cursor-pointer"
                >
                  &larr; Kembali ke halaman login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 mb-1 block uppercase tracking-wider font-heading">
                Email Akun
              </label>
              <input
                type="email"
                placeholder="nama@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-200 block uppercase tracking-wider font-heading">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 hover:underline"
                >
                  Lupa Password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 dark:border-zinc-800 w-full"></div>
            <span className="bg-white dark:bg-zinc-900 px-3 text-[10px] font-bold text-zinc-400 dark:text-zinc-300 uppercase tracking-wider shrink-0">
              atau masuk dengan
            </span>
          </div>

          {/* Google Sign In Button (Placed below login button) */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-zinc-500 dark:text-zinc-300" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Menghubungkan Google...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Masuk dengan Google</span>
              </>
            )}
          </button>

          {/* Quick Demo Credentials */}
          <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-800 text-xs space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300 block font-heading">
              Akun Uji Coba Cepat:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillCredential("guru@sekolah.id")}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-750 text-left transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-card cursor-pointer"
              >
                <div className="font-bold text-zinc-800 dark:text-zinc-100 text-xs font-heading">Dosen</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-300 truncate">guru@sekolah.id</div>
              </button>
              <button
                type="button"
                onClick={() => fillCredential("andi@sekolah.id")}
                className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800 hover:bg-white dark:hover:bg-zinc-750 text-left transition-all hover:-translate-y-0.5 shadow-sm hover:shadow-card cursor-pointer"
              >
                <div className="font-bold text-zinc-800 dark:text-zinc-100 text-xs font-heading">Mahasiswa</div>
                <div className="text-[10px] text-zinc-500 dark:text-zinc-300 truncate">andi@sekolah.id</div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>

        <p className="text-center text-xs text-zinc-500 dark:text-zinc-200">
          Belum memiliki akun?{" "}
          <Link href="/register" className="text-brand-600 dark:text-brand-400 font-semibold hover:underline">
            Daftar Akun Baru
          </Link>
        </p>
      </div>
    </div>
  )
}
