"use client"

import Link from "next/link"
import { InstitutionalFooter } from "@/components/layout/InstitutionalFooter"

export default function PrivacyPolicyPage() {
  const privacyArticles = [
    {
      num: "1",
      title: "Landasan Hukum & Kepatuhan Privasi",
      content:
        "Aksara LMS beroperasi sesuai dengan peraturan perundang-undangan perlindungan data pribadi yang berlaku di Republik Indonesia, termasuk Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), Peraturan Pemerintah No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik, serta standar keamanan ISO/IEC 27001 dan ISO/IEC 27701 untuk pengelolaan privasi informasi.",
    },
    {
      num: "2",
      title: "Ruang Lingkup & Pihak yang Terikat",
      content:
        "Kebijakan ini mengikat seluruh subjek data yang berinteraksi dengan sistem Aksara LMS, mencakup mahasiswa aktif, dosen pengampu mata kuliah, dekanat, staf akademik, pengawas ujian, mitra penyedia konten kurikulum, serta tamu pengguna yang mengakses portal publik.",
    },
    {
      num: "3",
      title: "Data Identitas Pribadi (PII)",
      content:
        "Kami mengumpulkan data identitas resmi seperti Nama Lengkap, Nomor Induk Mahasiswa (NIM), Nomor Induk Dosen Nasional (NIDN), Nomor Registrasi Pokok, tanggal lahir, jenis kelamin, serta program studi dan fakultas yang terdaftar.",
    },
    {
      num: "4",
      title: "Data Kredensial & Autentikasi",
      content:
        "Kata sandi pengguna disimpan menggunakan algoritma hashing satu arah bertingkat tinggi dengan cryptographic salt (bcrypt/argon2id). Sistem tidak pernah menyimpan atau melihat kata sandi dalam format teks polos (plaintext).",
    },
    {
      num: "5",
      title: "Data Kontak & Komunikasi Resmi",
      content:
        "Alamat email institusi (@student / @telkomuniversity / domain kampus), email pemulihan akun pribadi, nomor telepon/WhatsApp untuk verifikasi darurat, serta preferensi notifikasi pengumuman akademik.",
    },
    {
      num: "6",
      title: "Data Riwayat Kehadiran & Presensi",
      content:
        "Log kehadiran mahasiswa per sesi pertemuan kuliah, kode token presensi yang dimasukkan, waktu input hingga tingkat milidetik, alamat IP saat submit presensi, serta status verifikasi kehadiran oleh dosen pengampu.",
    },
    {
      num: "7",
      title: "Data Evaluasi & Jawaban Kuis",
      content:
        "Setiap lembar jawaban kuis diagnostik, kuis mingguan, ujian tengah semester, dan ujian akhir semester, termasuk pilihan opsi, esai terstruktur, draft jawaban otomatis yang tersimpan sementara, serta nilai akhir.",
    },
    {
      num: "8",
      title: "Data Metrik Penguasaan Topik (Topic Mastery Matrix)",
      content:
        "Analisis komputasi matematis yang memetakan persentase penguasaan kompetensi dasar pada setiap topik mata kuliah (misal: Struktur Data, Pointer, Array, Relational Database) untuk menentukan status penguasaan materi.",
    },
    {
      num: "9",
      title: "Data Closed-Loop Remedial Learning",
      content:
        "Riwayat rekomendasi belajar otomatis, sesi remedial mandiri yang diikuti, perbandingan skor diagnostik awal (pre-test) terhadap skor evaluasi akhir remedial (post-test), serta laju perbaikan pemahaman materi.",
    },
    {
      num: "10",
      title: "Data Interaksi & Prompt AI Generatif",
      content:
        "Teks topik yang diajukan ke modul latihan AI, pilihan tingkat kesulitan soal, jawaban esai yang dinilai oleh AI, serta respon pedagogis yang dihasilkan oleh model bahasa AI.",
    },
    {
      num: "11",
      title: "Anonimisasi Data pada Layanan AI Pihak Ketiga",
      content:
        "Saat berkomunikasi dengan API Google Gemini AI Studio, sistem secara otomatis menghapus seluruh metadata identitas pribadi (nama, NIM, email). Permintaan hanya berisi konten kurikulum murni untuk mengoptimalkan privasi.",
    },
    {
      num: "12",
      title: "Log Keamanan Filter Groq Prompt Guard",
      content:
        "Setiap input yang diarahkan ke modul AI melalui filter keamanan model Llama-Prompt-Guard-2 via Groq Cloud. Sistem mencatat skor probabilitas injeksi untuk mencegah eksfiltrasi data dan serangan manipulasi instruksi.",
    },
    {
      num: "13",
      title: "Data Perangkat Keras & Spesifikasi Sistem",
      content:
        "Tipe perangkat (desktop, laptop, tablet, smartphone), model perangkat keras, jenis dan versi peramban (browser), sistem operasi, resolusi layar, dan preferensi bahasa sistem.",
    },
    {
      num: "14",
      title: "Data Jaringan, Koneksi, & Alamat IP",
      content:
        "Alamat IP publik, Internet Service Provider (ISP), status proksi/VPN, zona waktu pengguna, dan header protokol HTTP/HTTPS guna mendeteksi aktivitas login yang mencurigakan dari lokasi yang tidak lazim.",
    },
    {
      num: "15",
      title: "Log Aktivitas Sesi (Audit Trail)",
      content:
        "Jejak rekam aktivitas mendalam mencakup waktu login/logout, modul kuliah yang diunduh, video pembelajaran yang ditonton beserta durasinya, navigasi antar halaman, dan submission kuis.",
    },
    {
      num: "16",
      title: "Penggunaan Cookies Esensial",
      content:
        "Cookies yang mutlak diperlukan untuk menjaga sesi login aktif, mengamankan CSRF token, dan memverifikasi integritas autentikasi sesi tanpa menyimpan data pelacak pihak ketiga.",
    },
    {
      num: "17",
      title: "Penggunaan Local Storage & Session Storage",
      content:
        "Penyimpanan lokal di browser digunakan untuk menyimpan draft jawaban kuis yang sedang berlangsung agar tidak hilang saat terjadi pemadaman listrik atau gangguan internet tiba-tiba, serta preferensi tata letak navigasi.",
    },
    {
      num: "18",
      title: "Tujuan Pengolahan: Otentikasi & Otorisasi RBAC",
      content:
        "Memastikan bahwa hak akses terhadap konten mata kuliah, bank soal dosen, dan rekapan transkrip nilai hanya dapat diakses oleh pihak yang berwenang sesuai peran Role-Based Access Control.",
    },
    {
      num: "19",
      title: "Tujuan Pengolahan: Analisis Mahasiswa Butuh Bimbingan (At-Risk Students)",
      content:
        "Algoritma prediktif menganalisis mahasiswa yang mengalami penurunan nilai topik beruntun guna memberi peringatan dini kepada dosen wali dan dosen pengampu untuk intervensi akademik yang tepat waktu.",
    },
    {
      num: "20",
      title: "Tujuan Pengolahan: Sinkronisasi Kalender Akademik",
      content:
        "Mengintegrasikan jadwal kuliah, tenggat waktu penyerahan tugas, jadwal ujian susulan, dan sesi remedial ke dalam kalender interaktif pengguna serta penyediaan berkas sinkronisasi iCalendar (.ics).",
    },
    {
      num: "21",
      title: "Tujuan Pengolahan: Akreditasi & Pelaporan Institusi",
      content:
        "Menyediakan data agregat ketercapaian Capaian Pembelajaran Lulusan (CPL) dan Capaian Pembelajaran Mata Kuliah (CPMK) untuk keperluan audit mutu internal dan akreditasi nasional/internasional.",
    },
    {
      num: "22",
      title: "Prinsip Minimalisasi Data (Data Minimization)",
      content:
        "Aksara LMS hanya mengumpulkan dan memproses data yang benar-benar esensial dan relevan secara langsung dengan kegiatan pembelajaran dan administrasi akademik yang sah.",
    },
    {
      num: "23",
      title: "Prinsip Batasan Penyimpanan (Storage Limitation)",
      content:
        "Data disimpan hanya selama periode yang diperlukan untuk memenuhi tujuan pengolahan akademik, atau sesuai dengan ketentuan retensi arsip pendidikan tinggi yang diwajibkan oleh kementerian terkait.",
    },
    {
      num: "24",
      title: "Enkripsi Data dalam Transit (Data in Transit)",
      content:
        "Seluruh pertukaran data antara browser pengguna dan server Aksara LMS diamankan menggunakan protokol enkripsi Transport Layer Security versi 1.3 (TLS 1.3) dengan cipher suite modern.",
    },
    {
      num: "25",
      title: "Enkripsi Data saat Disimpan (Data at Rest)",
      content:
        "Basis data relasional, cadangan arsip, dan berkas lampiran tugas mahasiswa disimpan pada media penyimpanan yang dilindungi enkripsi standar industri Advanced Encryption Standard 256-bit (AES-256).",
    },
    {
      num: "26",
      title: "Isolasi Lingkungan Basis Data & Multi-Tenancy",
      content:
        "Basis data dipisahkan dengan konfigurasi kontrol akses ketat, koneksi pool aman, dan sanitasi input guna mencegah kebocoran data lintas kelas atau eksploitasi injeksi SQL.",
    },
    {
      num: "27",
      title: "Pengelolaan Kunci Kriptografi & Secrets",
      content:
        "Kunci enkripsi, API key AI, dan sertifikat digital disimpan di dalam Key Management System (KMS) terenkripsi dan dirotasi secara berkala oleh tim teknis IT Services Aksara.",
    },
    {
      num: "28",
      title: "Pencegahan Serangan Siber & Firewall",
      content:
        "Sistem dilengkapi Web Application Firewall (WAF), perlindungan mitigasi DDoS, dan sistem deteksi intrusi untuk memblokir upaya eksploitasi keamanan secara otomatis.",
    },
    {
      num: "29",
      title: "Audit Keamanan & Vulnerability Assessment Berkala",
      content:
        "Platform Aksara LMS menjalani pengujian penetrasi keamanan (penetration testing) dan audit kepatuhan kode secara terjadwal untuk mengidentifikasi serta memperbaiki kerentanan sistem sebelum dieksploitasi.",
    },
    {
      num: "30",
      title: "Larangan Keras Komersialisasi & Penjualan Data",
      content:
        "Aksara LMS tidak akan pernah menjual, menyewakan, memperjualbelikan, atau mengomersialkan data pribadi, nomor kontak, riwayat belajar, maupun nilai akademik pengguna kepada pihak ketiga atau pengiklan mana pun.",
    },
    {
      num: "31",
      title: "Pembagian Data dengan Pihak Fakultas & Program Studi",
      content:
        "Data nilai, absensi, dan performa remedial dibagikan secara otomatis kepada Ketua Program Studi, Dosen Wali, dan Dekanat untuk kepentingan evaluasi akademik resmi mahasiswa.",
    },
    {
      num: "32",
      title: "Penyedia Infrastruktur Cloud & Perjanjian DPA",
      content:
        "Server komputasi dan basis data dihosting pada infrastruktur komputasi awan yang terikat perjanjian Data Processing Agreement (DPA) dengan jaminan kepatuhan privasi yang ketat.",
    },
    {
      num: "33",
      title: "Kepatuhan terhadap Permintaan Penegak Hukum",
      content:
        "Data hanya dapat diungkapkan kepada instansi penegak hukum yang berwenang apabila disertai surat perintah pengadilan resmi yang sah sesuai ketentuan hukum acara pidana Republik Indonesia.",
    },
    {
      num: "34",
      title: "Hak Subjek Data: Hak Akses Informasi",
      content:
        "Pengguna memiliki hak untuk meminta rincian lengkap mengenai jenis data pribadi yang disimpan oleh sistem dan bagaimana data tersebut digunakan dalam proses pembelajaran.",
    },
    {
      num: "35",
      title: "Hak Subjek Data: Hak Pembaruan & Koreksi (Rektifikasi)",
      content:
        "Pengguna berhak memperbarui informasi profil yang salah, tidak akurat, atau kedaluwarsa secara mandiri melalui pengaturan akun atau melalui bantuan staf administrasi akademik.",
    },
    {
      num: "36",
      title: "Hak Subjek Data: Hak Transparansi Algoritma Nilai",
      content:
        "Mahasiswa berhak mengetahui komponen pembobotan nilai, rincian skor kuis, dan formula kalkulasi rata-rata topik yang diterapkan oleh dosen pengampu pada setiap mata kuliah.",
    },
    {
      num: "37",
      title: "Hak Subjek Data: Hak Portabilitas Data",
      content:
        "Pengguna dapat mengunduh rekapan jadwal kalender akademik dalam format terbuka iCalendar (.ics) dan mengunduh rekapan transkrip nilai sementara dalam format digital standar.",
    },
    {
      num: "38",
      title: "Hak Subjek Data: Hak Penarikan Persetujuan (Withdrawal of Consent)",
      content:
        "Pengguna dapat menarik persetujuan pemrosesan fitur non-esensial (seperti pengingat email opsional), dengan pemahaman bahwa fitur esensial akademik tetap diproses selama masa perkuliahan aktif.",
    },
    {
      num: "39",
      title: "Hak Subjek Data: Hak Pengaduan Pelanggaran Privasi",
      content:
        "Pengguna memiliki hak untuk menyampaikan laporan atau komplain resmi jika menduga terjadi pelanggaran privasi langsung kepada kontak resmi IT Services Aksara LMS.",
    },
    {
      num: "40",
      title: "Kebijakan Data Pengguna di Bawah Umur (Anak)",
      content:
        "Layanan Aksara LMS ditujukan untuk mahasiswa dan civitas akademika jenjang pendidikan tinggi. Jika terdapat siswa program matrikulasi di bawah 18 tahun, pendaftaran wajib didampingi oleh institusi sekolah/wali.",
    },
    {
      num: "41",
      title: "Prosedur Penanganan Insiden Kebocoran Data (Data Breach)",
      content:
        "Jika terjadi insiden kebocoran data, pengelola Aksara LMS berkomitmen memberitahukan instansi pembina dan seluruh pengguna yang terdampak dalam waktu maksimal 3x24 jam beserta langkah mitigasinya.",
    },
    {
      num: "42",
      title: "Pencadangan Data Otomatis & Disaster Recovery",
      content:
        "Basis data dicadangkan secara terenkripsi setiap hari ke lokasi penyimpanan sekunder yang terpisah secara geografis untuk memastikan kelangsungan operasional sistem jika terjadi bencana fisik/server.",
    },
    {
      num: "43",
      title: "Retensi Data Setelah Kelulusan (Alumni)",
      content:
        "Setelah mahasiswa lulus atau menyelesaikan studi, data akun dipindahkan ke status arsip alumni non-aktif. Data transkrip nilai tetap diarsipkan secara permanen demi keperluan legalisir dan verifikasi ijazah.",
    },
    {
      num: "44",
      title: "Prosedur Penghapusan Akun Permanen (Right to Erasure)",
      content:
        "Permohonan penghapusan akun permanen dapat diajukan setelah mahasiswa menyelesaikan yudisium atau mengundurkan diri resmi, dengan verifikasi administrasi dari bagian registrasi akademik kampus.",
    },
    {
      num: "45",
      title: "Kebijakan Pelacakan Tanpa Pihak Ketiga (No Third-Party Trackers)",
      content:
        "Aksara LMS bebas dari skrip pelacak iklan pihak ketiga (seperti Facebook Pixel, Google AdSense, atau broker data). Semua analitik yang dijalankan adalah analitik internal murni demi kenyamanan belajar.",
    },
    {
      num: "46",
      title: "Pemberitahuan Pembaruan Dokumen Privasi",
      content:
        "Setiap revisi atau pembaruan pada dokumen Kebijakan Privasi ini akan diumumkan melalui banner pop-up pada saat login atau email notifikasi paling lambat 7 hari sebelum ketentuan baru diberlakukan.",
    },
    {
      num: "47",
      title: "Bahasa Resmi & Keabsahan Dokumen",
      content:
        "Dokumen Kebijakan Privasi ini disusun dalam Bahasa Indonesia sebagai bahasa hukum utama yang sah dan mengikat. Jika disediakan terjemahan bahasa lain, versi Bahasa Indonesia tetap menjadi acuan utama.",
    },
    {
      num: "48",
      title: "Keterpisahan Klausul (Severability)",
      content:
        "Apabila terdapat salah satu pasal dalam kebijakan ini yang dinyatakan tidak sah atau tidak dapat dilaksanakan oleh pengadilan, pasal-pasal lainnya akan tetap berlaku penuh dan memiliki kekuatan hukum mengikat.",
    },
    {
      num: "49",
      title: "Petugas Perlindungan Data (Data Protection Officer)",
      content:
        "Aksara LMS menunjuk tim Data Protection Officer di bawah naungan IT Services Aksara untuk mengawasi kepatuhan tata kelola data, meninjau alur pemrosesan AI, dan menindaklanjuti pertanyaan privasi dari pengguna.",
    },
    {
      num: "50",
      title: "Saluran Resmi Konsultasi & Pengaduan Privasi",
      content:
        "Untuk pertanyaan, klarifikasi, atau laporan mengenai kebijakan privasi dan keamanan data Anda, silakan hubungi tim kami secara tertulis melalui email resmi: rizkyaramdancringe@gmail.com (IT Services Aksara LMS, Apartemen Buah Batu Park Tower D, Bandung - 40267).",
    },
  ]

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-800 font-sans flex flex-col">
      {/* ─── Top Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200/80 h-16 sm:h-[68px] shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
            <img src="/aksara-logo.svg" alt="Aksara Logo" className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 object-contain shrink-0" />
            <div className="flex flex-col min-w-0 justify-center">
              <span className="font-bold text-zinc-900 text-sm sm:text-base md:text-lg leading-tight font-heading tracking-tight whitespace-nowrap truncate">
                AKSARA <span className="text-brand-600">LMS</span>
              </span>
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-medium whitespace-nowrap truncate max-w-[140px] sm:max-w-[200px] md:max-w-none hidden min-[440px]:block">
                Learning Management System
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-zinc-700 hover:text-brand-600 px-3.5 py-2 rounded-xl transition-colors hover:bg-zinc-50"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="btn-primary text-xs sm:text-sm py-2 px-4 sm:px-5 rounded-xl font-bold shadow-brand-down flex items-center gap-1.5 hover:-translate-y-0.5 transition-all"
            >
              <span>Daftar</span>
              <span>&rarr;</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Header Title Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 sm:p-10 shadow-down">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1 rounded-full text-xs font-bold font-heading mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Perlindungan Data Pribadi & Privasi Komprehensif (50 Pasal)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 font-heading tracking-tight">
            Kebijakan Privasi (Privacy Policy)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-3xl leading-relaxed">
            Terakhir diperbarui: 7 Oktober 2026 &middot; Dokumen resmi ini memuat 50 pasal regulasi menyeluruh yang mengatur bagaimana Aksara LMS mengumpulkan, memproses, mengamankan, mengarsip, dan melindungi data pribadi serta akademik Anda.
          </p>
        </div>

        {/* 50 Articles Container */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 sm:p-10 shadow-down-lg space-y-6 leading-relaxed text-sm sm:text-base text-zinc-700">
          <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 font-heading">
              Daftar Pasal Regulasi Perlindungan Data (Pasal 1 &ndash; 50)
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
              50 Klausul Aktif
            </span>
          </div>

          <div className="divide-y divide-zinc-100 space-y-6 pt-2">
            {privacyArticles.map((art) => (
              <section key={art.num} className="pt-6 first:pt-0 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs font-mono shrink-0 shadow-2xs">
                    {art.num}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 font-heading">
                      Pasal {art.num}: {art.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-600 mt-1 leading-relaxed">
                      {art.content}
                    </p>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Contact Box at End of 50 Articles */}
          <div className="mt-10 pt-6 border-t border-zinc-200 bg-zinc-50/80 p-6 rounded-xl border space-y-2">
            <div className="font-bold text-zinc-900 font-heading text-sm sm:text-base">
              Pusat Bantuan & Layanan Perlindungan Data Aksara LMS
            </div>
            <p className="text-xs text-zinc-600">
              Pertanyaan dan konsultasi mengenai seluruh 50 pasal Kebijakan Privasi di atas dapat dilayangkan melalui kontak resmi IT Services Aksara:
            </p>
            <div className="pt-2 text-xs text-zinc-700 space-y-1">
              <div><strong>Alamat:</strong> Apartemen Buah Batu Park Tower D, Bandung - 40267</div>
              <div>
                <strong>Email Resmi:</strong>{" "}
                <a href="mailto:rizkyaramdancringe@gmail.com" className="text-brand-600 font-bold hover:underline">
                  rizkyaramdancringe@gmail.com
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ─── Institutional CeLOE Footer ───────────────────────────────────────── */}
      <InstitutionalFooter />
    </div>
  )
}
