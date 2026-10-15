import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { PageTitleManager } from "@/components/layout/PageTitleManager"
import { Plus_Jakarta_Sans, Poppins } from "next/font/google"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
})

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
})

export const metadata = {
  title: "Aksara",
  description: "Platform Pembelajaran & Asesmen Adaptif dengan Closed-Loop Remediation dan Matriks Nilai Rata-rata Topik.",
  icons: {
    icon: "/aksara-logo.svg",
    shortcut: "/aksara-logo.svg",
    apple: "/aksara-logo.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`h-full ${plusJakartaSans.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/aksara-logo.svg" type="image/svg+xml" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var saved = localStorage.getItem('aksara_theme');
                var isDark = saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (isDark) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="bg-[#f4f6f9] dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 min-h-full font-sans antialiased selection:bg-brand-100 selection:text-brand-900 transition-colors duration-150">
        <PageTitleManager />
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
