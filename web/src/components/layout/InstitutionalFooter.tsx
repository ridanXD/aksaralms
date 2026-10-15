import React from "react"
import Link from "next/link"

export function InstitutionalFooter() {
  return (
    <footer className="w-full bg-zinc-900 text-zinc-300 pt-12 pb-8 border-t border-zinc-800 text-xs font-sans mt-auto">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12 pb-10 border-b border-zinc-800">
          
          {/* Column 1: Logo & Aksara Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex flex-col items-start gap-3">
              <Link href="/" className="flex items-center gap-3">
                <img
                  src="/aksara-logo.svg"
                  alt="Aksara Logo"
                  className="w-10 h-10 object-contain shrink-0"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base font-heading tracking-tight">
                    AKSARA <span className="text-brand-500">LMS</span>
                  </span>
                  <span className="text-[10px] text-zinc-300 font-medium">
                    Learning Management System
                  </span>
                </div>
              </Link>
              <div>
                <h4 className="font-bold text-zinc-100 text-xs font-heading tracking-tight leading-snug">
                  Platform Pembelajaran Adaptif & Cerdas
                </h4>
                <p className="text-zinc-300 text-xs mt-1.5 leading-relaxed">
                  Mengembangkan ekosistem belajar adaptif dengan arsitektur <em>Closed-Loop Learning</em> dan integrasi AI cerdas yang efisien.
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Address & Contact */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-heading border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              Address & Contact
            </h4>
            <div className="text-zinc-300 space-y-2.5 leading-relaxed text-xs">
              <p>
                Apartemen Buah Batu Park Tower D,<br />
                Bandung - 40267
              </p>
              <p>
                <span className="text-zinc-400 font-medium">E-Mail:</span>{" "}
                <a
                  href="mailto:rizkyaramdancringe@gmail.com"
                  className="text-white hover:text-brand-400 hover:underline transition-colors font-medium"
                >
                  rizkyaramdancringe@gmail.com
                </a>
              </p>
              <div className="pt-1 text-[11px] space-y-1 text-zinc-300 border-t border-zinc-800/80">
                <a
                  href="https://wa.me/6283836944001?text=Halo%20IT%20Services%20Aksara,%20saya%20membutuhkan%20bantuan%20terkait%20Aksara%20LMS"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group/wa block transition-colors"
                >
                  <div className="flex items-center gap-2 text-white font-medium group-hover/wa:text-brand-400 transition-colors">
                    <span className="text-brand-400">●</span>
                    <span>IT Services Aksara</span>
                  </div>
                  <div className="text-zinc-300 pl-3 group-hover/wa:text-brand-300 group-hover/wa:underline transition-colors flex items-center gap-1 mt-0.5">
                    <span>Layanan Bantuan & Dukungan Teknis Platform</span>
                    <span className="text-[10px] text-zinc-400 group-hover/wa:text-brand-300">&rarr;</span>
                  </div>
                </a>
              </div>
            </div>
          </div>

          {/* Column 3: Social Media & Connect */}
          <div className="lg:col-span-4 space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider font-heading border-b border-zinc-800 pb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500"></span>
              Social Media & Connect
            </h4>
            
            {/* Custom Social Icons: LinkedIn, Instagram, TikTok, GitHub */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/in/rizkya-ramdan-116595310/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-[#0077B5] text-zinc-200 hover:text-white flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 border border-zinc-700/60 hover:border-[#0077B5]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/rrrijkiya"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888] text-zinc-200 hover:text-white flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 border border-zinc-700/60"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* TikTok */}
              <a
                href="https://www.tiktok.com/@rijkiyaa"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-black text-zinc-200 hover:text-white flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 border border-zinc-700/60 hover:border-zinc-500"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.75 1.55-.07 2.9-1.2 3.16-2.73.08-.47.09-.95.08-1.42V.02h-.42z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href="https://github.com/ridanXD"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="w-9 h-9 rounded-xl bg-zinc-800 hover:bg-[#24292e] text-zinc-200 hover:text-white flex items-center justify-center transition-all shadow-sm hover:-translate-y-0.5 border border-zinc-700/60 hover:border-zinc-500"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
            </div>

            <div className="pt-2 text-[11px] text-zinc-300">
              Dikembangkan oleh <strong className="text-white">Rizkya Ramdan</strong> untuk platform edukasi adaptif Aksara LMS.
            </div>

          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-200 text-[11px]">
          <p>© 2026 Aksara LMS. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-zinc-300 hover:text-white transition-colors">
              Privacy policy
            </Link>
            <Link href="/terms" className="text-zinc-300 hover:text-white transition-colors">
              Terms and conditions
            </Link>
            <Link href="/faq" className="text-zinc-300 hover:text-white transition-colors">
              Panduan & FAQ
            </Link>
          </div>
        </div>

      </div>
    </footer>
  )
}
