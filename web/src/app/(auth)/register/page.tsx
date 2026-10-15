"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/lib/auth-context"

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await register(email, password, name, role)
      router.push(`/verify?email=${encodeURIComponent(email)}`)
    } catch (err: any) {
      setError(err.response?.data?.error || "Pendaftaran akun gagal")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setError("")
    setGoogleLoading(true)
    try {
      await loginWithGoogle(role)
      router.push("/dashboard")
    } catch (err: any) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        return
      }
      setError(
        err.response?.data?.error || err.message || "Gagal mendaftar menggunakan akun Google."
      )
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 bg-zinc-50 py-8 font-sans">
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
              <span className="font-bold text-zinc-900 text-lg leading-tight tracking-tight block font-heading">
                Aksara <span className="text-brand-600">LMS</span>
              </span>
              <span className="text-xs text-zinc-500 font-medium">Adaptive Learning Platform</span>
            </div>
          </div>
          <h1 className="text-sm font-bold text-zinc-800 font-heading pt-1">
            Pendaftaran Akun Baru
          </h1>
        </div>

        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-200/90 bg-white shadow-down-lg space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium shadow-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block uppercase tracking-wider font-heading">
                Nama Lengkap
              </label>
              <input
                type="text"
                placeholder="Nama lengkap"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white shadow-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block uppercase tracking-wider font-heading">
                Email
              </label>
              <input
                type="email"
                placeholder="nama@sekolah.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white shadow-sm transition-all"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1 block uppercase tracking-wider font-heading">
                Password
              </label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-600 bg-white shadow-sm transition-all"
                required
                minLength={6}
              />
            </div>

            {/* Peran Pengguna Selector */}
            <div>
              <label className="text-xs font-bold text-zinc-700 mb-1.5 block uppercase tracking-wider font-heading">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { value: "STUDENT" as const, label: "Mahasiswa" },
                  { value: "TEACHER" as const, label: "Dosen" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 cursor-pointer ${
                      role === r.value
                        ? "border-brand-600 bg-brand-50 text-brand-900 font-bold ring-2 ring-brand-600 shadow-sm"
                        : "border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50 bg-white shadow-xs"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary text-xs sm:text-sm w-full py-3 rounded-xl shadow-brand-down disabled:opacity-50 font-bold hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              {loading ? "Mendaftarkan..." : "Daftar Akun"}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-zinc-200 w-full"></div>
            <span className="bg-white px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-wider shrink-0">
              atau daftar dengan
            </span>
          </div>

          {/* Google Sign Up Button (Placed below register button) */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={googleLoading || loading}
            className="w-full py-2.5 px-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin text-zinc-500" viewBox="0 0 24 24" fill="none">
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
                <span>Daftar dengan Google ({role === "TEACHER" ? "Dosen" : "Mahasiswa"})</span>
              </>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-500">
          Sudah memiliki akun?{" "}
          <Link href="/login" className="text-brand-600 font-semibold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  )
}
