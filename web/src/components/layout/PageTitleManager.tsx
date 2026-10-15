"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

const ROUTE_TITLES: Record<string, string> = {
  "/": "Beranda | Aksara",
  "/login": "Masuk | Aksara",
  "/register": "Daftar Akun | Aksara",
  "/dashboard": "Dashboard | Aksara",
  "/courses": "Mata Kuliah | Aksara",
  "/ai-training": "Latihan Adaptif | Aksara",
  "/quiz": "Kuis & Asesmen | Aksara",
  "/grades": "Nilai & Transkrip | Aksara",
  "/profile": "Profil Pengguna | Aksara",
  "/faq": "Pusat Bantuan & FAQ | Aksara",
}

export function PageTitleManager() {
  const pathname = usePathname()

  useEffect(() => {
    if (!pathname) return

    let pageTitle = "Aksara"

    // Exact match
    if (ROUTE_TITLES[pathname]) {
      pageTitle = ROUTE_TITLES[pathname]
    } else if (pathname.startsWith("/courses/")) {
      pageTitle = "Detail Mata Kuliah | Aksara"
    } else if (pathname.startsWith("/quiz/")) {
      pageTitle = "Sesi Kuis | Aksara"
    } else if (pathname.startsWith("/grades/")) {
      pageTitle = "Rincian Nilai | Aksara"
    } else if (pathname.startsWith("/attendance/")) {
      pageTitle = "Presensi Kelas | Aksara"
    } else {
      const segment = pathname.split("/").filter(Boolean)[0]
      if (segment) {
        const formatted = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
        pageTitle = `${formatted} | Aksara`
      }
    }

    const applyTitle = () => {
      if (document.title !== pageTitle) {
        document.title = pageTitle
      }
    }

    applyTitle()

    // Enforce across hydration & async stream phases
    const timeouts = [10, 50, 150, 300, 600, 1000].map((delay) =>
      setTimeout(applyTitle, delay)
    )

    // Watch for external / framework overwrites on document title
    const titleEl = document.querySelector("title")
    let observer: MutationObserver | null = null
    if (titleEl) {
      observer = new MutationObserver(() => {
        if (document.title !== pageTitle) {
          document.title = pageTitle
        }
      })
      observer.observe(titleEl, { childList: true, characterData: true, subtree: true })
    }

    return () => {
      timeouts.forEach(clearTimeout)
      observer?.disconnect()
    }
  }, [pathname])

  return null
}
