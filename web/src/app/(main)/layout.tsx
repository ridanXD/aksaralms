"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useTheme } from "@/lib/theme-context"
import { fetchCourses, Course } from "@/lib/api"
import { InstitutionalFooter } from "@/components/layout/InstitutionalFooter"
import { QuickAttendanceModal } from "@/components/attendance/QuickAttendanceModal"

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth()
  const { theme, resolvedTheme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const [quickAttendanceOpen, setQuickAttendanceOpen] = useState(false)
  const [courses, setCourses] = useState<Course[]>([])

  useEffect(() => {
    if (!loading && !user) router.push("/login")
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchCourses().then(setCourses).catch(() => [])
    }
  }, [user])

  useEffect(() => {
    setDrawerOpen(false)
    setUserDropdownOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-2.5">
          <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-zinc-500 font-medium">Memuat Aksara LMS...</span>
        </div>
      </div>
    )
  }

  if (!user) return null

  const studentNav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/courses", label: "Mata Kuliah" },
    { href: "/ai-training", label: "Latihan Adaptif" },
    { href: "/quiz", label: "Kuis Interaktif" },
    { href: "/calendar", label: "Kalender Akademik" },
    { href: "/grades", label: "Nilai & Transkrip" },
  ]

  const teacherNav = [
    { href: "/dashboard", label: "Intelligence Kelas" },
    { href: "/courses", label: "Manajemen Kelas" },
    { href: "/quiz", label: "Kuis & Asesmen" },
    { href: "/calendar", label: "Kalender Akademik" },
    { href: "/grades", label: "Penilaian & Nilai" },
  ]

  const navItems = user.role === "TEACHER" ? teacherNav : studentNav

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col text-zinc-800 dark:text-zinc-100 font-sans transition-colors duration-150">
      {/* ─── Top Header (RemUI Aksara LMS Fixed Header) ───────── */}
      <header className="sticky top-0 z-40 bg-white dark:bg-zinc-900 border-b border-zinc-200/80 dark:border-zinc-800 h-16 sm:h-[68px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-3">
          
          {/* Left: Hamburger Drawer Toggle + Aksara Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
            <button
              onClick={() => setDrawerOpen(!drawerOpen)}
              className="p-1.5 sm:p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 shrink-0"
              aria-label="Buka Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 sm:gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 rounded-lg p-0.5 min-w-0 shrink"
            >
              <img
                src="/aksara-logo.svg"
                alt="Aksara Logo"
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain shrink-0"
              />
              <div className="flex flex-col min-w-0 justify-center">
                <span className="font-bold text-zinc-900 dark:text-white text-sm sm:text-base md:text-lg leading-tight font-heading tracking-tight whitespace-nowrap truncate">
                  AKSARA <span className="text-brand-600 dark:text-brand-400">LMS</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-200 font-medium whitespace-nowrap truncate max-w-[130px] sm:max-w-[180px] md:max-w-none hidden min-[440px]:block">
                  Learning Management System
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links (Underline Tab Bar) */}
            <nav className="hidden lg:flex items-center h-16 sm:h-[68px] ml-5 pl-5 border-l border-zinc-200 dark:border-zinc-800 space-x-1">
              {/* Dashboard Link */}
              <Link
                href="/dashboard"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname === "/dashboard"
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                Dashboard
              </Link>

              {/* My Courses Link */}
              <Link
                href="/courses"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname === "/courses" || (pathname.startsWith("/courses/") && !pathname.includes("/quiz"))
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                My courses
              </Link>

              {/* Adaptive Learning / Remediation */}
              <Link
                href="/ai-training"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname.startsWith("/ai-training")
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-brand-600"></span>
                <span>Adaptive Practice</span>
              </Link>

              {/* Quiz Interaktif */}
              <Link
                href="/quiz"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname.startsWith("/quiz")
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                Kuis
              </Link>

              {/* Kalender Perkuliahan */}
              <Link
                href="/calendar"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname.startsWith("/calendar")
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                Calendar
              </Link>

              {/* Grades & Transcript */}
              <Link
                href="/grades"
                className={`h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold transition-colors border-b-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                  pathname.startsWith("/grades")
                    ? "border-brand-600 text-brand-600 dark:text-brand-400 font-bold"
                    : "border-transparent text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                Grades
              </Link>

              {/* Help Center Dropdown */}
              <div className="relative group h-16 sm:h-[68px] flex items-center">
                <button className="h-16 sm:h-[68px] flex items-center px-3.5 text-xs font-semibold text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700 border-b-2 border-transparent transition-colors gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600">
                  <span>Help Center</span>
                  <svg className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className="absolute top-16 sm:top-[68px] left-0 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-b-lg shadow-md py-1.5 hidden group-hover:block z-50">
                  <Link
                    href="/faq"
                    className="block px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Panduan & FAQ Aksara
                  </Link>
                  <a
                    href="https://wa.me/6283836944001?text=Halo%20IT%20Services%20Aksara,%20saya%20membutuhkan%20bantuan%20terkait%20Aksara%20LMS"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-3 py-2 text-xs text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    IT Services Aksara
                  </a>
                </div>
              </div>
            </nav>
          </div>

          {/* Right: Search, Notifications Popover, User Profile Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 md:gap-3 shrink-0">
            
            {/* Quick Search Input */}
            <div className="hidden xl:flex items-center relative w-44 2xl:w-60">
              <input
                type="text"
                placeholder="Cari mata kuliah, topik..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-300 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition-colors shadow-2xs"
              />
              <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Shortcut Presensi: Kamera & Masukkan Kode */}
            <button
              type="button"
              onClick={() => setQuickAttendanceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 shadow-2xs transition-all active:scale-95 group shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-1"
              title="Buka Kamera atau Masukkan Kode Presensi"
            >
              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="hidden sm:inline font-heading font-bold">Presensi</span>
            </button>

            {/* Dark / Light Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
              title={resolvedTheme === "dark" ? "Ganti ke Mode Terang (Light Mode)" : "Ganti ke Mode Gelap (Dark Mode)"}
              aria-label="Toggle tema tampilan"
            >
              {resolvedTheme === "dark" ? (
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {/* RemUI Notifications Popover */}
            <div className="relative group">
              <button
                className="p-2 rounded-lg text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                title="Notifications"
                aria-label="Notifikasi"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-600"></span>
              </button>

              {/* Dropdown Notification Window */}
              <div className="absolute right-0 mt-1 w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-lg py-2 hidden group-hover:block z-50">
                <div className="px-3 pb-2 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-heading">Notifications</span>
                  <span className="text-[10px] text-brand-600 hover:underline cursor-pointer font-semibold">Mark all read</span>
                </div>
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 max-h-60 overflow-y-auto">
                  <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-bold text-brand-700 dark:text-brand-400">Kuis Evaluasi</span>
                      <span>1 jam yang lalu</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                      Kuis Struktur Data & Algoritma sedang berlangsung.
                    </p>
                  </div>
                  <div className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between text-[10px] text-zinc-400">
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">Adaptive Remediation</span>
                      <span>Kemarin</span>
                    </div>
                    <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                      Sesi latihan mandiri topik Array & Pointer siap diakses.
                    </p>
                  </div>
                </div>
                <div className="pt-2 px-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <Link href="/quiz" className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                    View all notifications
                  </Link>
                </div>
              </div>
            </div>

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
                aria-label="Menu Pengguna"
              >
                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 flex items-center justify-center shadow-2xs shrink-0 overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  )}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white leading-tight max-w-[120px] truncate">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-200 capitalize">
                    {user.role === "TEACHER" ? "Dosen" : "Mahasiswa"}
                  </span>
                </div>
                <svg className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-zinc-900 rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="text-xs font-bold text-zinc-900 dark:text-white truncate font-heading">{user.name || user.email}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-200 truncate">{user.email}</div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-brand-600 dark:text-brand-400 font-bold uppercase">
                        {user.role === "TEACHER" ? "Dosen Pengampu" : "Mahasiswa Aktif"}
                      </span>
                      {user.isVerified ? (
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                          ✓ Terverifikasi
                        </span>
                      ) : (
                        <Link
                          href={`/verify?email=${encodeURIComponent(user.email)}`}
                          className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-200"
                        >
                          ⚠ Belum Verifikasi
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="py-1">
                    {/* Settings Link */}
                    <Link
                      href="/settings"
                      className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold text-zinc-900 dark:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/70 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Pengaturan (Settings)</span>
                      </span>
                      <span className="text-[10px] font-normal text-zinc-400 dark:text-zinc-200">2FA / Tema</span>
                    </Link>

                    <Link
                      href="/profile"
                      className="block px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Profil & Statistik
                    </Link>
                    <Link
                      href="/grades"
                      className="block px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Grades
                    </Link>
                    {user.role === "STUDENT" && (
                      <Link
                        href="/ai-training"
                        className="block px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white transition-colors"
                      >
                        Adaptive Practice
                      </Link>
                    )}
                    <Link
                      href="/calendar"
                      className="block px-3.5 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                      Calendar
                    </Link>
                  </div>

                  <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ─── Side Navigation Drawer ─────────────────────────────────────── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-50 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 z-50 transform transition-transform duration-200 ease-in-out flex flex-col shadow-lg ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 px-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/aksara-logo.svg" alt="Aksara Logo" className="w-8 h-8 object-contain shrink-0" />
            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm font-heading">Aksara LMS</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            aria-label="Tutup Menu"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {/* Quick Attendance Mobile Button */}
          <div className="pb-1">
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false)
                setQuickAttendanceOpen(true)
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors shadow-2xs focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <svg className="w-4 h-4 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Presensi (Kamera / Kode)</span>
            </button>
          </div>

          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300">
              Navigasi
            </div>
            <div className="space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-3 py-2 rounded-lg text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border-l-2 border-brand-600"
                        : "text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-medium"
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {courses.length > 0 && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300 flex items-center justify-between">
                <span>Mata Kuliah</span>
                <span className="text-zinc-500 dark:text-zinc-300">{courses.length}</span>
              </div>
              <div className="space-y-0.5">
                {courses.map((c) => {
                  const isActive = pathname.startsWith(`/courses/${c.id}`)
                  return (
                    <Link
                      key={c.id}
                      href={`/courses/${c.id}`}
                      className={`block px-3 py-2 rounded-lg text-xs truncate transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ${
                        isActive
                          ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold"
                          : "text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-medium"
                      }`}
                    >
                      {c.code} · {c.title}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-300">
              Pengaturan & Akun
            </div>
            <div className="space-y-0.5">
              <Link
                href="/settings"
                className={`block px-3 py-2 rounded-lg text-xs transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 flex items-center justify-between ${
                  pathname === "/settings"
                    ? "bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-bold border-l-2 border-brand-600"
                    : "text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/60 font-semibold"
                }`}
              >
                <span>Pengaturan (Settings)</span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-300 font-normal">2FA / Tema</span>
              </Link>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 transition-colors"
              >
                Profil & Statistik
              </Link>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                <svg className="w-4 h-4 text-zinc-600 dark:text-zinc-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-zinc-900 dark:text-white truncate font-heading">{user.name || user.email}</div>
              <div className="text-[10px] text-zinc-500 dark:text-zinc-200 capitalize">{user.role.toLowerCase()}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar"
            className="px-2.5 py-1.5 rounded-lg text-zinc-500 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/60 dark:hover:bg-rose-950/40 transition-colors text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
          >
            Keluar
          </button>
        </div>
      </aside>

      {/* ─── Main Content Canvas ─────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        {user && user.isVerified === false && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-amber-900 font-heading">Akun Anda Belum Diverifikasi</h4>
                <p className="text-[11px] text-amber-700">
                  Verifikasi email Anda ({user.email}) untuk mengamankan akun dan mendapatkan perlindungan penuh.
                </p>
              </div>
            </div>
            <Link
              href={`/verify?email=${encodeURIComponent(user.email)}`}
              className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-center"
            >
              Verifikasi Sekarang
            </Link>
          </div>
        )}
        {children}
      </main>

      {/* ─── Institutional CeLOE Footer ───────────────────────────────── */}
      <InstitutionalFooter />

      {/* ─── Quick Attendance Modal (Camera / Code) ───────────────────── */}
      <QuickAttendanceModal
        isOpen={quickAttendanceOpen}
        onClose={() => setQuickAttendanceOpen(false)}
      />
    </div>
  )
}
