import Link from "next/link"
import Image from "next/image"
import { InstitutionalFooter } from "@/components/layout/InstitutionalFooter"
import { RevealOnScroll } from "@/components/ui/RevealOnScroll"
import { AuthRedirectIfLoggedIn } from "@/components/auth/AuthRedirectIfLoggedIn"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans flex flex-col selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Background Auth Checker (Non-blocking) */}
      <AuthRedirectIfLoggedIn />

      {/* ─── Top Navbar (Aksara LMS Header) ─────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 h-16 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
        <div className="w-full px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink">
              <Image
                src="/aksara-logo.svg"
                alt="Aksara Logo"
                width={40}
                height={40}
                priority
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain shrink-0 transition-transform duration-300 group-hover:scale-105"
              />
              <div className="flex flex-col min-w-0 justify-center">
                <span className="font-extrabold text-zinc-900 text-sm sm:text-base md:text-lg leading-tight font-heading tracking-tight whitespace-nowrap truncate">
                  AKSARA <span className="text-brand-600">LMS</span>
                </span>
                <span className="text-[10px] sm:text-[11px] text-zinc-600 font-medium whitespace-nowrap truncate max-w-[140px] sm:max-w-[220px] md:max-w-none hidden min-[440px]:block">
                  Adaptive Learning Management System
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-zinc-700 hover:text-brand-600 px-3.5 py-2 rounded-xl transition-colors hover:bg-zinc-100/80"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="btn-primary text-xs sm:text-sm py-2 px-4 sm:px-5 rounded-xl font-bold shadow-brand-down flex items-center gap-1.5 hover:-translate-y-0.5 transition-transform"
            >
              <span>Daftar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── SECTION 1: HERO SECTION ─────────────────────────────────────── */}
      <section className="bg-white border-b border-zinc-200/80 pt-6 pb-12 sm:pt-8 sm:pb-16 lg:pt-10 lg:pb-20 px-4 sm:px-8 lg:px-12 relative overflow-hidden">
        {/* Animated Background Ambient Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
          
          {/* Left Text & CTA */}
          <div className="lg:col-span-6 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-zinc-900 font-heading tracking-tight leading-[1.12]">
              Belajar Lebih Cerdas, Terarah, & Menyenangkan Bersama <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-rose-600 to-amber-600">
                Aksara LMS
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl font-normal">
              Aksara mengintegrasikan kurikulum digital modern, asesmen kuis interaktif, 
              dan mesin evaluasi cerdas (<em>Closed-Loop Remediation</em>) untuk membantu setiap mahasiswa 
              mencapai penguasaan topik terbaik sesuai ritme belajarnya secara mandiri.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/login"
                className="btn-primary text-base sm:text-lg py-4 px-8 rounded-2xl font-bold shadow-brand-down hover:-translate-y-1 hover:shadow-[0_16px_30px_-4px_rgba(220,38,38,0.35)] transition-all inline-flex items-center gap-2.5"
              >
                <span>Mulai Belajar Sekarang</span>
                <span className="text-xl">&rarr;</span>
              </Link>
              <Link
                href="/register"
                className="btn-secondary text-base sm:text-lg py-4 px-7 rounded-2xl font-bold shadow-md hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Daftar Akun Baru
              </Link>
            </div>

            {/* Feature Highlight Strip */}
            <div className="pt-6 grid grid-cols-3 gap-4 border-t border-zinc-200/80">
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 shadow-xs hover:shadow-card transition-all hover:-translate-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-heading">100%</div>
                <div className="text-xs sm:text-sm text-zinc-600 font-medium mt-0.5">Materi Terstruktur</div>
              </div>
              <div className="p-3.5 rounded-xl bg-brand-50/60 border border-brand-200/80 shadow-xs hover:shadow-card transition-all hover:-translate-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 font-heading">Adaptive</div>
                <div className="text-xs sm:text-sm text-zinc-700 font-medium mt-0.5">Remediasi Cerdas</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-xs hover:shadow-card transition-all hover:-translate-y-0.5">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-heading">Real-time</div>
                <div className="text-xs sm:text-sm text-zinc-700 font-medium mt-0.5">Evaluasi & Nilai</div>
              </div>
            </div>
          </div>

          {/* Right Hero Image (Explicit static height wrapper preventing any CLS) */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-zinc-200/90 group w-full h-[320px] sm:h-[420px] lg:h-[500px]">
              <Image
                src="/hero-section.webp"
                alt="Aksara LMS Platform Belajar"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none"></div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── SECTION 2: ENJOY STUDY ───────────────────────────────────────── */}
      <section className="py-20 sm:py-28 lg:py-36 px-4 sm:px-8 lg:px-12 bg-gradient-to-b from-zinc-100/90 to-zinc-50 border-b border-zinc-200/80 relative">
        <RevealOnScroll direction="up" delay={0} duration={600}>
          <div className="max-w-[1440px] mx-auto bg-white rounded-3xl sm:rounded-[36px] border border-zinc-200/90 p-8 sm:p-14 lg:p-18 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.14),0_15px_30px_-10px_rgba(0,0,0,0.08)] relative overflow-hidden">
            
            {/* Subtle Ambient Light in Canvas */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-18 items-center relative z-10">
              
              {/* Left Image with Deep Downward Elevation Shadow */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <RevealOnScroll direction="left" delay={50} duration={600}>
                  <div className="relative rounded-3xl overflow-hidden shadow-[0_25px_50px_-10px_rgba(0,0,0,0.2)] border border-zinc-200/90 group w-full h-[320px] sm:h-[420px] lg:h-[480px]">
                    <Image
                      src="/enjoy-study.webp"
                      alt="Belajar Jadi Lebih Enjoy di Aksara LMS"
                      fill
                      loading="lazy"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-tr from-emerald-950/20 via-transparent to-transparent pointer-events-none"></div>
                  </div>
                </RevealOnScroll>
              </div>

              {/* Right Content */}
              <div className="lg:col-span-6 space-y-8 order-1 lg:order-2">
                <RevealOnScroll direction="right" delay={50} duration={600}>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 font-heading tracking-tight leading-tight">
                    Belajar Menjadi Jauh Lebih <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy decoration-2">Enjoy</span>, Santai, dan Terarah
                  </h2>
                </RevealOnScroll>

                <RevealOnScroll direction="right" delay={100} duration={600}>
                  <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                    Tinggalkan metode belajar yang kaku dan membosankan. Aksara LMS dirancang dengan antarmuka yang bersih, intuitif, dan responsif agar proses perkuliahan terasa ringan, memotivasi, dan tidak membebani pikiran.
                  </p>
                </RevealOnScroll>

                <div className="space-y-4 pt-2">
                  <RevealOnScroll direction="up" delay={150} duration={500}>
                    <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-2xs">
                        ✓
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 font-heading">Progres & Matriks Pembelajaran Jelas</h3>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                          Lihat perkembangan nilai rata-rata tiap topik secara instan tanpa perlu menunggu rekap manual di akhir semester.
                        </p>
                      </div>
                    </div>
                  </RevealOnScroll>

                  <RevealOnScroll direction="up" delay={200} duration={500}>
                    <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-2xs">
                        🎯
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 font-heading">Kuis Interaktif & Gamifikasi</h3>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                          Tantang pemahamanmu lewat kuis cepat dengan leaderboard kelas yang seru dan memicu semangat belajar.
                        </p>
                      </div>
                    </div>
                  </RevealOnScroll>

                  <RevealOnScroll direction="up" delay={250} duration={500}>
                    <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.07)] hover:shadow-[0_20px_35px_-6px_rgba(0,0,0,0.12)] hover:-translate-y-1 transition-all flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-2xs">
                        📱
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-zinc-900 font-heading">Akses Kapan Saja & Di Mana Saja</h3>
                        <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                          Buka modul, kerjakan tugas, dan ikuti latihan mandiri dari laptop, tablet, maupun smartphone dengan sangat lancar.
                        </p>
                      </div>
                    </div>
                  </RevealOnScroll>
                </div>
              </div>

            </div>
          </div>
        </RevealOnScroll>
      </section>

      {/* ─── SECTION 3: AI-POWERED LEARNING ───────────────────────────────── */}
      <section className="py-20 sm:py-28 lg:py-36 px-4 sm:px-8 lg:px-12 bg-white border-b border-zinc-200/80 relative overflow-hidden">
        {/* Glowing Background Orbs */}
        <div className="absolute top-1/3 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-18 items-center relative z-10">
          
          {/* Left Text */}
          <div className="lg:col-span-6 space-y-8">
            <RevealOnScroll direction="up" delay={50} duration={550}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 font-heading tracking-tight leading-tight">
                Didukung Penuh oleh <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600">
                  Teknologi Artificial Intelligence
                </span> Cerdas
              </h2>
            </RevealOnScroll>

            <RevealOnScroll direction="up" delay={100} duration={550}>
              <p className="text-base sm:text-lg text-zinc-600 leading-relaxed font-normal">
                Aksara memanfaatkan kecerdasan buatan terdepan (<strong>Gemini 3.5 Flash Lite</strong>) yang dioptimalkan untuk menyusun penjelasan konsep kilat, mendeteksi topik yang belum dikuasai, dan menghasilkan latihan remedial adaptif secara instan dan hemat sumber daya.
              </p>
            </RevealOnScroll>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <RevealOnScroll direction="up" delay={150} duration={500}>
                <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-down hover:shadow-down-lg hover:-translate-y-1 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-lg mb-3 shadow-2xs">
                    🤖
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">AI Adaptive Remediation</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    Soal remedial diproduksi secara otomatis khusus untuk memperbaiki titik lemah yang kamu miliki.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={200} duration={500}>
                <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-down hover:shadow-down-lg hover:-translate-y-1 transition-all h-full">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-lg mb-3 shadow-2xs">
                    ⚡
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 font-heading">Tipe Soal Bervariasi</h3>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                    Mendukung Pilihan Ganda, Multi Option, hingga Essay dengan evaluasi berbasis AI.
                  </p>
                </div>
              </RevealOnScroll>

              <RevealOnScroll direction="up" delay={250} duration={500} className="sm:col-span-2">
                <div className="p-5 rounded-2xl bg-zinc-50/90 border border-zinc-200/90 shadow-down hover:shadow-down-lg hover:-translate-y-1 transition-all flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
                    📈
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 font-heading">Evaluasi Pre vs Post</h3>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">
                      Buktikan kenaikan nilai rata-rata topikmu langsung setelah menyelesaikan sesi remedial.
                    </p>
                  </div>
                </div>
              </RevealOnScroll>
            </div>
          </div>

          {/* Right Image */}
          <div className="lg:col-span-6">
            <RevealOnScroll direction="scale" delay={100} duration={600}>
              <div className="relative rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] border border-zinc-200/90 group w-full h-[320px] sm:h-[420px] lg:h-[500px]">
                <Image
                  src="/ai.webp"
                  alt="Teknologi AI Aksara LMS"
                  fill
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 700px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </RevealOnScroll>
          </div>

        </div>
      </section>

      {/* ─── Institutional CeLOE Footer ───────────────────────────────── */}
      <InstitutionalFooter />
    </div>
  )
}