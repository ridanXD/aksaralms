"use client"

import Link from "next/link"
import { InstitutionalFooter } from "@/components/layout/InstitutionalFooter"

export default function TermsAndConditionsPage() {
  const termsArticles = [
    {
      num: "1",
      title: "Ketentuan Umum & Dasar Perjanjian",
      content:
        "Syarat dan Ketentuan Penggunaan ini merupakan perjanjian hukum yang sah dan mengikat antara pengguna (Mahasiswa, Dosen, Tenaga Kependidikan, Administrator) dengan pengelola platform Aksara LMS.",
    },
    {
      num: "2",
      title: "Penerimaan & Persetujuan Ketentuan",
      content:
        "Dengan membuat akun, masuk ke portal, mengakses materi, atau menyelesaikan kuis, pengguna secara mutlak menyetujui seluruh klausul dalam syarat dan ketentuan ini tanpa pengecualian.",
    },
    {
      num: "3",
      title: "Kriteria Kelayakan Pengguna",
      content:
        "Pengguna Aksara LMS harus merupakan mahasiswa terdaftar aktif, dosen tetap/luar biasa, asisten laboratorium, atau staf akademik yang memiliki nomor registrasi resmi pada institusi yang terafiliasi.",
    },
    {
      num: "4",
      title: "Kewajiban Keaslian Data Pendaftaran",
      content:
        "Pengguna wajib mencantumkan data identitas diri yang valid dan dapat dipertanggungjawabkan secara hukum saat melakukan registrasi akun di portal Aksara LMS.",
    },
    {
      num: "5",
      title: "Kerahasiaan Kredensial & Kata Sandi",
      content:
        "Pengguna bertanggung jawab penuh secara mandiri atas keamanan username dan kata sandi masing-masing, serta dilarang membagikan detail login kepada rekan sejawat atau pihak ketiga.",
    },
    {
      num: "6",
      title: "Larangan Pengalihan & Peminjaman Akun",
      content:
        "Satu akun Aksara LMS hanya diperuntukkan bagi satu individu terdaftar. Dilarang meminjamkan, menyewakan, memperjualbelikan, atau menduplikasi akun kepada pihak mana pun.",
    },
    {
      num: "7",
      title: "Tanggung Jawab atas Setiap Aktivitas Akun",
      content:
        "Segala aktivitas akademik, pengumpulan tugas, penyerahan jawaban kuis, dan pengisian absensi yang terjadi melalui akun Anda dianggap sebagai perbuatan sah atas nama pemilik akun yang bersangkutan.",
    },
    {
      num: "8",
      title: "Kewajiban Pelaporan Kebocoran Akun",
      content:
        "Pengguna wajib segera melaporkan kepada IT Services Aksara apabila menemukan indikasi peretasan, pencurian sesi, atau penggunaan akun tanpa izin oleh pihak lain.",
    },
    {
      num: "9",
      title: "Hak Akses Berbasis Peran Mahasiswa (Student Role)",
      content:
        "Mahasiswa berhak mengakses materi kuliah terdaftar, mengunduh bahan ajar, mengisi presensi tepat waktu, mengerjakan kuis diagnostik, serta memanfaatkan modul AI Adaptive Practice.",
    },
    {
      num: "10",
      title: "Hak Akses Berbasis Peran Dosen (Teacher Role)",
      content:
        "Dosen berhak menyusun silabus mata kuliah, menerbitkan modul dan video perkuliahan, membuat bank soal evaluasi, membuka sesi token presensi, dan menilai tugas mahasiswa secara berkeadilan.",
    },
    {
      num: "11",
      title: "Kewajiban Menjunjung Tinggi Integritas Akademik",
      content:
        "Setiap pengguna wajib menegakkan nilai kejujuran intelektual, etika moral, dan sportivitas dalam seluruh proses pembelajaran dan asesmen di dalam platform Aksara LMS.",
    },
    {
      num: "12",
      title: "Larangan Keras Perjokian & Bantuan Pihak Ketiga",
      content:
        "Dilarang keras menyewa, menggunakan jasa joki, atau meminta bantuan pihak ketiga untuk mengerjakan kuis, ujian tengah semester, ujian akhir semester, maupun latihan mandiri.",
    },
    {
      num: "13",
      title: "Larangan Otomatisasi & Penggunaan Bot",
      content:
        "Dilarang menggunakan skrip otomatis, browser extension ilegal peretas jawaban, bot otomatisasi submit, atau alat scrapping untuk memanipulasi pengerjaan evaluasi kuis.",
    },
    {
      num: "14",
      title: "Sanksi Pembatalan Nilai atas Kecurangan",
      content:
        "Setiap kecurangan yang terbukti melalui analisis log audit atau rekaman sesi pengerjaan kuis akan mengakibatkan pembatalan nilai menjadi nol (0) dan penerusan sanksi ke Komite Etik Akademik.",
    },
    {
      num: "15",
      title: "Ketentuan Pengisian Presensi Perkuliahan",
      content:
        "Presensi kehadiran mahasiswa hanya sah apabila diisi dalam rentang waktu yang dibuka oleh dosen menggunakan kode token resmi yang valid dan sesuai dengan alamat IP kehadiran yang wajar.",
    },
    {
      num: "16",
      title: "Larangan Pembagian Token Presensi kepada Mahasiswa Absen",
      content:
        "Dilarang membagikan kode token presensi kepada mahasiswa yang tidak hadir di ruang kelas atau sesi perkuliahan daring. Pelanggaran dikenakan sanksi absensi alpa bagi kedua belah pihak.",
    },
    {
      num: "17",
      title: "Tujuan Penggunaan Modul Artificial Intelligence",
      content:
        "Modul AI Adaptive Practice disediakan khusus sebagai sarana bimbingan belajar mandiri, diagnosis kelemahan konsep, dan akselerasi perbaikan nilai topik mahasiswa (*remediation*).",
    },
    {
      num: "18",
      title: "Batasan Kewenangan Jawaban AI",
      content:
        "Penjelasan konsep atau latihan yang dihasilkan oleh AI bersifat suplemen belajar. Silabus, instruksi modul, dan rubrik penilaian resmi dosen pengampu tetap menjadi rujukan utama.",
    },
    {
      num: "19",
      title: "Larangan Serangan Prompt Injection & Jailbreak",
      content:
        "Dilarang keras memasukkan instruksi manipulatif, upaya ekstraksi system prompt, jailbreak, atau teknik adversial injection ke dalam antarmuka dialog AI Aksara LMS.",
    },
    {
      num: "20",
      title: "Pemantauan Keamanan dengan Groq Prompt Guard 2",
      content:
        "Setiap masukan teks ke modul AI secara otomatis disaring oleh model keamanan Groq Prompt Guard 2. Upaya serangan akan ditolak secara instan dan dicatat dalam audit keamanan sistem.",
    },
    {
      num: "21",
      title: "Larangan Input Konten Ilegal ke Model AI",
      content:
        "Dilarang memasukkan materi yang mengandung unsur SARA, pornografi, ujaran kebencian, malware, eksploitasi kode berbahaya, atau rahasia institusional ke dalam modul AI.",
    },
    {
      num: "22",
      title: "Hak Cipta Modul & Bahan Ajar Dosen",
      content:
        "Semua silabus, diktat ajar, presentasi, bank soal, dan rekaman perkuliahan yang diunggah oleh dosen merupakan hak kekayaan intelektual milik dosen pengampu dan institusi terkait.",
    },
    {
      num: "23",
      title: "Larangan Penggandaan & Distribusi Komersial Materi",
      content:
        "Dilarang mengunduh bahan ajar untuk diunggah ulang ke situs komersial eksternal (seperti CourseHero, Scribd, Brainly) atau diperjualbelikan tanpa izin tertulis dari institusi.",
    },
    {
      num: "24",
      title: "Hak Cipta Platform & Antarmuka Aksara LMS",
      content:
        "Desain antarmuka, arsitektur closed-loop learning, algoritma topic mastery matrix, logo resmi, dan kode sumber sistem adalah hak cipta yang dilindungi milik pengembang Aksara LMS.",
    },
    {
      num: "25",
      title: "Kepemilikan Karya & Tugas Mahasiswa",
      content:
        "Hak cipta atas karya orisinal tugas atau esai yang diunggah tetap menjadi milik mahasiswa, dengan pemberian lisensi non-eksklusif kepada institusi untuk evaluasi, arsip, dan akreditasi.",
    },
    {
      num: "26",
      title: "Ketersediaan Layanan (Service Availability 99.5%)",
      content:
        "Aksara LMS berkomitmen menyediakan ketersediaan akses sistem dengan target uptime 99.5%, di luar jadwal pemeliharaan terencana yang telah diumumkan sebelumnya.",
    },
    {
      num: "27",
      title: "Jadwal Pemeliharaan Rutin (Maintenance Window)",
      content:
        "Pemeliharaan sistem terjadwal akan dilakukan di luar jam sibuk perkuliahan (pukul 00.00 - 04.00 WIB) dengan pemberitahuan melalui pengumuman portal setidaknya 24 jam sebelumnya.",
    },
    {
      num: "28",
      title: "Batasan Tanggung Jawab atas Gangguan Internet Pengguna",
      content:
        "Pengelola tidak bertanggung jawab atas kegagalan submit tugas atau terputusnya sesi kuis yang disebabkan oleh gangguan penyedia jasa internet (ISP), kuota habis, atau pemadaman listrik lokal.",
    },
    {
      num: "29",
      title: "Ketentuan Format Berkas & Batasan Ukuran Unggahan",
      content:
        "Berkas tugas yang diunggah wajib mematuhi format yang ditentukan dosen (misal: PDF, ZIP) dan tidak melebihi batasan ukuran maksimal (maks. 25MB per berkas) guna menjaga stabilitas server.",
    },
    {
      num: "30",
      title: "Pemeriksaan Bebas Virus & Kode Berbahaya",
      content:
        "Setiap berkas lampiran yang diunggah ke portal akan dipindai secara otomatis. Berkas yang terdeteksi mengandung virus, trojan, atau skrip berbahaya akan dihapus seketika oleh server.",
    },
    {
      num: "31",
      title: "Larangan Rekayasa Balik (Reverse Engineering)",
      content:
        "Dilarang melakukan dekompilasi, reverse engineering, analisis paket terenkripsi, atau eksploitasi API backend Aksara LMS secara tidak sah di luar penggunaan antarmuka resmi.",
    },
    {
      num: "32",
      title: "Larangan Uji Penetrasi Tanpa Izin Tertulis",
      content:
        "Pengguna dilarang melakukan penetration testing, vulnerability scan, atau stress test (DoS/DDoS) terhadap server Aksara LMS tanpa izin otorisasi tertulis dari IT Services Aksara.",
    },
    {
      num: "33",
      title: "Hak Pengelola Melakukan Pembaruan Fitur",
      content:
        "Aksara LMS berhak melakukan peningkatan antarmuka, penambahan fitur adaptif baru, atau penghentian modul usang demi kenyamanan dan efektivitas pembelajaran mahasiswa.",
    },
    {
      num: "34",
      title: "Ketentuan Forum Diskusi & Etika Komunikasi",
      content:
        "Forum diskusi kelas dan kolom komentar materi harus digunakan secara santun, konstruktif, bebas dari perundungan (cyberbullying), ujaran kebencian, dan konten spam promosi.",
    },
    {
      num: "35",
      title: "Penghapusan Konten yang Melanggar Norma",
      content:
        "Dosen pengampu dan administrator berhak menghapus pesan, komentar, atau unggahan forum yang melanggar norma kesopanan dan etika kampus tanpa pemberitahuan sebelumnya.",
    },
    {
      num: "36",
      title: "Kewajiban Mengikuti Kalender & Jadwal Kuliah",
      content:
        "Mahasiswa wajib memantau kalender perkuliahan terpadu di Aksara LMS untuk mengetahui tenggat waktu pengumpulan tugas dan jadwal asesmen agar tidak kehilangan hak penilaian.",
    },
    {
      num: "37",
      title: "Ketentuan Remedial & Ujian Susulan",
      content:
        "Sesi ujian susulan atau remedial adaptif hanya dapat diberikan oleh dosen pengampu sesuai dengan regulasi akademik program studi dan bukti alasan ketidakhadiran yang sah.",
    },
    {
      num: "38",
      title: "Transparansi Kalkulasi Nilai & Bobot Evaluasi",
      content:
        "Dosen wajib mencantumkan komponen pembobotan evaluasi (tugas, kuis, kehadiran, remedial) secara transparan pada halaman ikhtisar nilai mata kuliah.",
    },
    {
      num: "39",
      title: "Prosedur Pengajuan Sanggah Nilai",
      content:
        "Mahasiswa berhak mengajukan sanggah atau klarifikasi nilai kuis kepada dosen pengampu paling lambat 7 (tujuh) hari kalender setelah nilai dipublikasikan di portal.",
    },
    {
      num: "40",
      title: "Penonaktifan Akun Sementara (Suspension)",
      content:
        "Pengelola dapat menonaktifkan akun sementara waktu jika ditemukan aktivitas anomali atau terindikasi pelanggaran etik selama proses investigasi berlangsung.",
    },
    {
      num: "41",
      title: "Pemutusan Akses Akun Permanen (Termination)",
      content:
        "Akun akan dinonaktifkan secara permanen apabila mahasiswa dinyatakan drop-out (DO), diberhentikan resmi oleh universitas, atau terbukti melakukan tindak pidana siber berat.",
    },
    {
      num: "42",
      title: "Keadaan Kahar (Force Majeure)",
      content:
        "Pengelola dibebaskan dari tanggung jawab atas kegagalan kinerja sistem akibat kejadian di luar kendali wajar (bencana alam, huru-hara, perang, kebakaran pusat data nasional, regulasi darurat pemerintah).",
    },
    {
      num: "43",
      title: "Ganti Rugi & Pembebasan Tanggung Jawab (Indemnification)",
      content:
        "Pengguna setuju untuk membebaskan pengelola Aksara LMS dari segala klaim, tuntutan hukum, atau kerugian yang timbul akibat penyalahgunaan akun atau pelanggaran hak cipta oleh pengguna.",
    },
    {
      num: "44",
      title: "Kepatuhan Regulasi Telekomunikasi & ITE",
      content:
        "Seluruh transaksi elektronik, transmisi pesan, dan penyimpanan dokumen di Aksara LMS tunduk pada Undang-Undang No. 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik beserta perubahannya.",
    },
    {
      num: "45",
      title: "Pemberitahuan Perubahan Syarat & Ketentuan",
      content:
        "Pembaruan terhadap syarat dan ketentuan ini akan diumumkan melalui banner notifikasi di aplikasi. Penggunaan berkelanjutan setelah tanggal pembaruan dianggap sebagai persetujuan penuh.",
    },
    {
      num: "46",
      title: "Bahasa Resmi Perjanjian",
      content:
        "Dokumen Syarat dan Ketentuan ini diterbitkan dan memiliki kekuatan hukum mengikat dalam Bahasa Indonesia sebagai bahasa resmi Republik Indonesia.",
    },
    {
      num: "47",
      title: "Keterpisahan Ketentuan (Severability Clause)",
      content:
        "Jika ada ketentuan dalam dokumen ini yang dinyatakan tidak sah oleh putusan pengadilan, pasal-pasal lainnya tetap berlaku penuh dan sah mengikat seluruh pihak.",
    },
    {
      num: "48",
      title: "Hukum yang Mengatur (Governing Law)",
      content:
        "Perjanjian ini diatur, ditafsirkan, dan dilaksanakan sepenuhnya berdasarkan hukum positif yang berlaku di Negara Kesatuan Republik Indonesia.",
    },
    {
      num: "49",
      title: "Penyelesaian Sengketa & Forum Pengadilan",
      content:
        "Setiap perselisihan yang timbul akan diselesaikan secara musyawarah mufakat. Apabila tidak tercapai mufakat, perselisihan akan diselesaikan melalui Pengadilan Negeri Bandung Kelas 1A Khusus.",
    },
    {
      num: "50",
      title: "Layanan Dukungan & Hubungi Kami",
      content:
        "Untuk informasi lebih lanjut, pertanyaan seputar regulasi perkuliahan, atau bantuan teknis sistem Aksara LMS, silakan hubungi tim resmi kami: IT Services Aksara LMS via email rizkyaramdancringe@gmail.com (Apartemen Buah Batu Park Tower D, Bandung - 40267).",
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
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-800 px-3.5 py-1 rounded-full text-xs font-bold font-heading mb-3 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand-600"></span>
            <span>Syarat, Ketentuan & Kode Etik Akademik (50 Pasal)</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-900 font-heading tracking-tight">
            Syarat & Ketentuan Penggunaan (Terms & Conditions)
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-2 max-w-3xl leading-relaxed">
            Terakhir diperbarui: 7 Oktober 2026 &middot; Dokumen ini memuat 50 pasal regulasi menyeluruh yang mengikat hak, kewajiban, tata tertib pengerjaan evaluasi, penggunaan modul AI, kepemilikan intelektual, dan etika akademik di Aksara LMS.
          </p>
        </div>

        {/* 50 Articles Container */}
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-6 sm:p-10 shadow-down-lg space-y-6 leading-relaxed text-sm sm:text-base text-zinc-700">
          <div className="border-b border-zinc-100 pb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 font-heading">
              Daftar Pasal Regulasi Syarat & Ketentuan (Pasal 1 &ndash; 50)
            </h2>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
              50 Klausul Aktif
            </span>
          </div>

          <div className="divide-y divide-zinc-100 space-y-6 pt-2">
            {termsArticles.map((art) => (
              <section key={art.num} className="pt-6 first:pt-0 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-brand-50 border border-brand-200 text-brand-700 font-bold text-xs font-mono shrink-0 shadow-2xs">
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
              Pusat Layanan & Konsultasi Regulasi Akademik Aksara LMS
            </div>
            <p className="text-xs text-zinc-600">
              Pertanyaan dan permohonan klarifikasi mengenai seluruh 50 pasal Syarat & Ketentuan di atas dapat diajukan kepada IT Services Aksara:
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
