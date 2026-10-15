import dotenv from "dotenv"
dotenv.config()
dotenv.config({ path: "../.env" })

import { PrismaClient, QuestionDifficulty } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  // Clean
  const tables = [
    "TopicMastery",
    "GeneratedQuestion", "TrainingSession", "AIPerformanceAnalysis",
    "Grade", "Submission", "Assignment", "AttendanceCheckin", "AttendanceSession",
    "LeaderboardEntry", "WeakTopic", "QuizResult", "QuizAnswer", "QuizOption",
    "QuizQuestion", "QuizSession", "Progress", "Material", "Module",
    "Enrollment", "Course", "User",
  ]
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${t}" CASCADE`)
  }

  const pw = await bcrypt.hash("password123", 12)

  // ─── Users ────────────────────────────────────────────
  const teacher1 = await prisma.user.create({ data: { email: "guru@sekolah.id", password: pw, name: "Pak Budi", role: "TEACHER" } })
  const teacher2 = await prisma.user.create({ data: { email: "guru2@sekolah.id", password: pw, name: "Bu Sari", role: "TEACHER" } })

  const students = await Promise.all([
    prisma.user.create({ data: { email: "andi@sekolah.id", password: pw, name: "Andi Pratama", role: "STUDENT" } }),
    prisma.user.create({ data: { email: "sari@sekolah.id", password: pw, name: "Sari Dewi", role: "STUDENT" } }),
    prisma.user.create({ data: { email: "rizki@sekolah.id", password: pw, name: "Rizki Ramadhan", role: "STUDENT" } }),
    prisma.user.create({ data: { email: "dina@sekolah.id", password: pw, name: "Dina Putri", role: "STUDENT" } }),
    prisma.user.create({ data: { email: "farhan@sekolah.id", password: pw, name: "Farhan Akbar", role: "STUDENT" } }),
  ])

  // ─── Courses Data ─────────────────────────────────────
  const coursesData = [
    {
      title: "Pemrograman JavaScript & Software Engineering",
      desc: "Belajar JavaScript modern, event loop, performa, dan arsitektur sistem tingkat lanjut",
      code: "JS101",
      teacher: teacher1,
      modules: [
        { title: "Minggu 01: Dasar JavaScript, Runtime & V8 Engine", desc: "Variabel, tipe data, dan engine internals", order: 1, materials: [
          { title: "Pengenalan V8 JavaScript Engine & JIT Compiler", content: "V8 mengompilasi kode JavaScript langsung ke native machine code menggunakan Ignition interpreter dan TurboFan optimizing compiler." },
          { title: "Call Stack Execution Context & Heap Memory Allocation", content: "Objek dan closure dialokasikan di V8 Heap, sedangkan eksekusi fungsi berada di Call Stack dengan pointer frame." },
        ]},
        { title: "Minggu 02: Lexical Scope, Hoisting & Closures Internals", desc: "Scope chain, TDZ, dan closure persistence", order: 2, materials: [
          { title: "Creation Phase vs Execution Phase & Scope Chain", content: "Fase pembuatan context menyiapkan environment record dan hoisting sebelum baris kode pertama dieksekusi." },
          { title: "Pemanfaatan Closure untuk Enkapsulasi Data & State Privacy", content: "Closure mempertahankan referensi ke lexical environment induk meskipun fungsi luar telah selesai dieksekusi." },
        ]},
        { title: "Minggu 03: Struktur Data Modern & Manipulasi Koleksi", desc: "Array, Map, Set, TypedArray dan efisiensi memori", order: 3, materials: [
          { title: "Array Iterators: map, filter, reduce & TypedArray", content: "Penggunaan higher order iterator untuk transformasi data deklaratif tanpa mutasi state asal." },
          { title: "Map vs Object & Set vs WeakSet Garbage Collection", content: "WeakMap dan WeakSet memegang referensi weakly sehingga memungkinkan Garbage Collection membersihkan objek yang tidak terpakai." },
        ]},
        { title: "Minggu 04: Functional Programming: HOF, Currying & Composition", desc: "Pure functions, currying, dan composability", order: 4, materials: [
          { title: "Pure Functions, Immutability & Side-Effects Mitigation", content: "Fungsi murni selalu menghasilkan output yang sama untuk input yang sama tanpa memodifikasi variabel luar." },
          { title: "Currying & Partial Application Pipelines (Pipe / Compose)", content: "Mengubah fungsi multi-argumen menjadi deretan fungsi berargumen tunggal untuk fleksibilitas komposisi." },
        ]},
        { title: "Minggu 05: Prototypes, Prototype Chain & ES6+ Classes", desc: "Inheritance prototypal, class syntax, dan private fields", order: 5, materials: [
          { title: "__proto__ vs prototype & Inheritance Chain Lookup", content: "Setiap objek memiliki internal link [[Prototype]] ke objek prototype yang dicari secara rekursif saat property access." },
          { title: "ES6 Classes, Private Identifiers (#) & SOLID Principles", content: "Sintaks class modern menyediakan enkapsulasi sejati di level runtime menggunakan hash prefix (#)." },
        ]},
        { title: "Minggu 06: Error Handling Terstruktur & Defensive Programming", desc: "Custom exceptions, boundaries, dan sanitasi error", order: 6, materials: [
          { title: "Class Error Hierarchy, Custom Exceptions & Stack Traces", content: "Membangun domain error yang mewarisi class Error dengan metadata kode HTTP dan timestamp." },
          { title: "Async Error Boundaries & Unhandled Rejection Safeguards", content: "Menangkap error pada asynchronous execution path agar proses Node.js tidak mengalami abrupt termination." },
        ]},
        { title: "Minggu 07: Asynchronous JavaScript & libuv Event Loop", desc: "Microtasks, macrotasks, timers, dan Promise internals", order: 7, materials: [
          { title: "6 Fase libuv Event Loop & Microtask vs Macrotask Queue", content: "Node.js memprioritaskan process.nextTick dan Promise microtask queue di antara setiap transisi fase libuv." },
          { title: "Promise Combinators: all, allSettled, race, any & Async/Await", content: "Menangani multiple concurrent operations dengan error handling granular dan timeout safeguards." },
        ]},
        { title: "Minggu 08: Evaluasi Tengah Semester (UTS): Teori & Live Coding", desc: "Evaluasi penguasaan arsitektur dan algoritma pemrograman", order: 8, materials: [
          { title: "Review Silabus W01-W07 & Petunjuk Teknis Pelaksanaan UTS", content: "Kisi-kisi evaluasi komprehensif konsep runtime, asynchronous, scoping, dan struktur data." },
          { title: "Rubrik Penilaian Kompetensi Tengah Semester", content: "Kriteria penilaian mencakup kebenaran fungsional, kompleksitas Big-O, dan clean code." },
        ]},
        { title: "Minggu 09: Concurrency, Multithreading & Worker Threads", desc: "Multi-threading CPU-bound dengan worker_threads", order: 9, materials: [
          { title: "Modul worker_threads & Multi-threading CPU-bound", content: "Memindahkan komputasi berat dari main event loop ke thread terisolasi untuk menjaga responsivitas server." },
          { title: "SharedArrayBuffer & Atomics Synchronization API", content: "Berbagi memori langsung antar thread dengan operasi atomik bebas race condition." },
        ]},
        { title: "Minggu 10: Arsitektur RESTful API & Integrasi Basis Data", desc: "Layered architecture, validation, dan database relations", order: 10, materials: [
          { title: "Prinsip Idempotency REST & Middleware Architecture", content: "Desain endpoint RESTful yang idempotent dan chaining middleware untuk autentikasi serta logging." },
          { title: "Schema Validation dengan Zod & PostgreSQL Prisma Integration", content: "Validasi runtime terhadap request body, query params, dan pemetaan relasi data dengan Prisma ORM." },
        ]},
        { title: "Minggu 11: Otentikasi JWT, RBAC & Mitigasi Keamanan Web", desc: "Token cryptographic signing, RBAC, dan web security", order: 11, materials: [
          { title: "JWT Cryptographic Signing & Refresh Token Rotation", content: "Implementasi autentikasi stateless dengan rotasi refresh token dan blacklist token pada Redis." },
          { title: "Pertahanan Terhadap Serangan CORS, CSRF, XSS & Mass Assignment", content: "Sanitasi input, HttpOnly cookies, CSP headers, dan proteksi integritas payload." },
        ]},
        { title: "Minggu 12: Pengujian Perangkat Lunak: Unit Testing & TDD", desc: "Vitest/Jest, mock, assertions, dan test coverage", order: 12, materials: [
          { title: "Test Pyramid Philosophy, Vitest / Jest Assertion Library", content: "Prinsip piramida pengujian dan penulisan test case yang terisolasi dan deterministik." },
          { title: "Mocking External Dependencies, Spies & Code Coverage Reports", content: "Mengisolasi database dan third-party API menggunakan dependency injection dan test doubles." },
        ]},
        { title: "Minggu 13: Optimasi Performa, Profiling & Strategi Caching", desc: "Memory snapshot, profiling, dan Redis cache", order: 13, materials: [
          { title: "Heap Snapshot Memory Profiling & Deteksi Memory Leaks", content: "Menganalisis snapshot memori untuk mendeteksi detached closures dan event listeners yang tidak dilepas." },
          { title: "Pola Caching Redis: Cache-Aside & Thundering Herd Protection", content: "Mengurangi beban database hingga 80% dengan distributed in-memory caching dan probabilistic expiration." },
        ]},
        { title: "Minggu 14: Containerization dengan Docker & CI/CD Pipeline", desc: "Multi-stage builds, orchestration, dan automated pipeline", order: 14, materials: [
          { title: "Multi-stage Dockerfile Best Practices untuk Node.js Production", content: "Mengurangi ukuran container image dari 1GB menjadi di bawah 150MB dengan distroless multi-stage build." },
          { title: "Automated Testing & Deployment dengan GitHub Actions Pipeline", content: "Automasi linting, testing, image building, dan security scanning pada setiap Pull Request." },
        ]},
        { title: "Minggu 15: Clean Architecture, Design Patterns & Peer Code Review", desc: "Gang of Four patterns, Hexagonal architecture, dan PR review", order: 15, materials: [
          { title: "Pola Desain Gang of Four & Clean Architecture Hexagonal", content: "Pemisahan domain business logic murni dari framework adapter dan database drivers." },
          { title: "Protokol Peer Code Review & Standard Kualitas Kode Industri", content: "Checklist code review mencakup keamanan, maintainability, testability, dan performa." },
        ]},
        { title: "Minggu 16: Evaluasi Akhir Semester (UAS): Capstone Project Defense", desc: "Showcase proyek akhir, live demo, dan arsitektur defense", order: 16, materials: [
          { title: "Petunjuk Presentasi, Live Demo & Kriteria Penilaian UAS", content: "Format penyampaian arsitektur sistem, pembuktian ketahanan sistem, dan evaluasi hasil akhir." },
          { title: "Rubrik Kelulusan dan Portofolio Capstone Project Rekayasa Perangkat Lunak", content: "Standar penilaian menyeluruh dari 16 minggu perkuliahan dan portofolio profesional." },
        ]},
      ],
      assignments: [
        {
          title: "Tugas Minggu 3: Implementasi Struktur Data Custom & Analisis Kompleksitas",
          description: "Buat implementasi custom Map dan WeakMap dengan strategi eviksi memori (LRU). Analisis kompleksitas Big-O waktu dan ruang setiap operasi serta sertakan berkas pengujian unit test pembuktian.",
          days: 5,
          submissions: [
            { studentIndex: 1, content: "Berikut implementasi class CustomMap dengan LRU cache eviction dan analisis memori heap V8.", fileUrl: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9G", score: 96, feedback: "Implementasi WeakMap dan memory cleanup sangat rapi! Analisis kompleksitas tepat." },
            { studentIndex: 2, content: "Tugas telah selesai dikerjakan sesuai spesifikasi dan lulus seluruh unit tests.", score: 88, feedback: "Bagus, perhatikan kompleksitas waktu pada lookup tabel berukuran besar." },
            { studentIndex: 3, content: "Menyerahkan tugas struktur data custom dan diagram alur implementasi.", fileUrl: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9G" },
          ],
        },
        {
          title: "Tugas Minggu 6: Defensive Programming & Custom Exception Hierarchy",
          description: "Rancang hierarki custom error class yang mewarisi class Error JavaScript standar. Terapkan penanganan asynchronous error boundaries pada operasi I/O dan cegah unhandledRejection crash di server.",
          days: 9,
          submissions: [
            { studentIndex: 1, content: "Hierarki class DomainError lengkap dengan HTTP status code dan metadata JSON format.", score: 94, feedback: "Penanganan async error boundaries sangat baik dan stack trace bersih." },
            { studentIndex: 0, content: "Pengumpulan tugas Minggu 6: Implementasi class DatabaseException dan ValidationError dengan middleware Express.", fileUrl: "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqMiAwIG9iajw8L1R5cGUvUGFnZXMvS2lkc1szIDAgUl0vQ291bnQgMT4+ZW5kb2JqMyAwIG9iajw8L1R5cGUvUGFnZS9NZWRpYUJveFswIDAgNjEyIDc5Ml0+PVuZG9iagp0cmFpbGVyPDwvUm9vdCAxIDAgUj4+CiUlRU9G" },
          ],
        },
        {
          title: "Tugas Proyek UTS Minggu 8: Live Coding & Desain Sistem Modular",
          description: "Kembangkan modul sistem manajemen transaksi in-memory dengan concurrency safety menggunakan prinsip SOLID dan microtask scheduling.",
          days: 14,
          submissions: [],
        },
        {
          title: "Tugas Minggu 10: Perancangan Arsitektur RESTful API & Schema Validation",
          description: "Implementasikan arsitektur Controller-Service-Repository pada endpoint RESTful API dengan validasi runtime skema Zod dan integrasi database PostgreSQL.",
          days: 21,
          submissions: [
            { studentIndex: 1, content: "Source code repository link dan dokumentasi OpenAPI spec terlampir.", score: 98, feedback: "Arsitektur bersih, pemisahan layer controller dan repository sangat baik!" },
            { studentIndex: 2, content: "Tugas RESTful API dengan validasi Zod dan Prisma ORM telah selesai diuji." },
          ],
        },
        {
          title: "Tugas Minggu 13: Memory Leak Detection & Caching Strategy (Redis)",
          description: "Lakukan profiling heap snapshot menggunakan Chrome DevTools untuk menemukan memory leak tersembunyi. Terapkan caching pola Cache-Aside dengan Redis.",
          days: 28,
          submissions: [],
        },
        {
          title: "Tugas Akhir UAS Minggu 16: Capstone Project Defense & Showcase",
          description: "Pengumpulan laporan akhir, source code repositori, tautan live deployment, dan dokumentasi arsitektur Capstone Project Rekayasa Perangkat Lunak.",
          days: 35,
          submissions: [],
        },
      ],
      quiz: {
        title: "King of the Hill: Pemrograman & Rekayasa Perangkat Lunak (10 Soal Sangat Sulit)",
        questions: [
          {
            q: "Perhatikan cuplikan kode Node.js berikut:\nconsole.log('A');\nsetTimeout(() => console.log('B'), 0);\nPromise.resolve().then(() => {\n  console.log('C');\n  process.nextTick(() => console.log('D'));\n}).then(() => console.log('E'));\nconsole.log('F');\nManakah urutan keluaran konsol yang paling tepat di Node.js v20+?",
            opts: ["A, F, C, E, D, B", "A, F, C, D, E, B", "A, C, F, D, E, B", "A, F, B, C, D, E"],
            ans: 1,
            topic: "Concurrency & Event Loop",
            diff: "HARD",
            explanation: "Call stack mencetak A dan F secara synchronous. Microtask pertama mencetak C dan mendaftarkan process.nextTick(D). Di Node.js, queue nextTick diprioritaskan sebelum Promise microtask kedua (E). Setelah microtask tuntas, barulah macrotask timer B dijalankan. Urutan tepat: A, F, C, D, E, B.",
          },
          {
            q: "Pada PostgreSQL dengan isolation level default READ COMMITTED, Transaksi A membaca balance = 1000 pada baris akun #1. Bersamaan, Transaksi B melakukan UPDATE accounts SET balance = balance - 200 WHERE id = 1 dan COMMIT. Jika Transaksi A kemudian menjalankan UPDATE accounts SET balance = balance - 300 WHERE id = 1, apa hasil akhir balance akun tersebut?",
            opts: [
              "Serialization failure (could not serialize access)",
              "Balance bernilai 700 karena Transaksi A menimpa perubahan Transaksi B (Lost Update)",
              "Balance bernilai 500 karena PostgreSQL mengevaluasi ulang klausul WHERE pada versi baris terbaru setelah lock diperoleh",
              "Transaksi A otomatis deadlock dan dihentikan DBMS",
            ],
            ans: 2,
            topic: "Database Concurrency",
            diff: "HARD",
            explanation: "Pada level READ COMMITTED PostgreSQL, operasi UPDATE yang menemukan baris yang sedang dikunci transaksi lain akan menunggu commit. Setelah Transaksi B commit, UPDATE Transaksi A mengevaluasi ulang versi tuple terbaru (800) dan menerapkan balance - 300 = 500.",
          },
          {
            q: "Diberikan array tak terurut berukuran N. Algoritma manakah yang mampu menemukan elemen terkecil ke-k (k-th smallest element) dengan kompleksitas waktu rata-rata O(N) dan memori tambahan O(1)?",
            opts: ["Heapsort dengan Min-Heap", "Quickselect (Hoare selection) in-place", "Merge Sort divide-and-conquer", "Counting Sort unbounded"],
            ans: 1,
            topic: "Algoritma Pemilihan",
            diff: "HARD",
            explanation: "Quickselect mempartisi array secara in-place (O(1) memory) dan hanya merekursi satu sisi partisi yang memuat indeks k. Rata-rata waktu eksekusinya adalah O(N) berkat deret konvergen N + N/2 + N/4 + ... = 2N.",
          },
          {
            q: "Dalam protokol TCP, apa fungsi dari mekanisme Persist Timer dan Zero-Window Probe (ZWP)?",
            opts: [
              "Mencegah Congestion Collapse saat buffer router penuh",
              "Mencegah deadlock permanen ketika receiver window bernilai 0 dan paket Window Update hilang di jaringan",
              "Mengatur ulang Slow Start Threshold setelah terjadi packet loss beruntun",
              "Memaksa receiver mengosongkan antrean soket UDP",
            ],
            ans: 1,
            topic: "Protokol Jaringan",
            diff: "HARD",
            explanation: "Jika receiver mengiklankan rwnd=0 dan paket pembuka window berikutnya hilang, sender dan receiver akan saling menunggu selamanya. TCP mencegah deadlock ini dengan Persist Timer yang mengirim ZWP (segmen 1-byte) secara periodik untuk memancing ACK window terbaru.",
          },
          {
            q: "Sebuah API memverifikasi JWT yang ditandatangani RS256 menggunakan RSA Public Key. Penyerang mengubah header token menjadi {\"alg\": \"HS256\"} dan menandatangani payload menggunakan string Public Key server. Mengapa serangan Key Confusion (Algorithm Confusion) ini bisa berhasil membobol otentikasi?",
            opts: [
              "Karena kunci privat RSA secara otomatis terdekripsi di sisi klien",
              "Karena pustaka JWT memperlakukan RSA Public Key publik sebagai simetris HMAC secret key",
              "Karena algoritma HS256 tidak memvalidasi tanda tangan kriptografi",
              "Karena hash SHA-256 mengalami collision attack secara instan",
            ],
            ans: 1,
            topic: "Keamanan Sistem",
            diff: "HARD",
            explanation: "Pada Algorithm Confusion Attack, pustaka verifikasi yang tidak memvalidasi whitelist algoritma akan beralih ke HS256 dan memperlakukan file RSA Public Key (yang dapat diakses publik) sebagai secret key bersama HMAC, sehingga signature yang dibuat penyerang dianggap valid.",
          },
          {
            q: "Berdasarkan teorema PACELC dalam sistem terdistribusi, bagaimana karakteristik sistem basis data terdistribusi yang diklasifikasikan sebagai PC/EC (seperti Google Spanner)?",
            opts: [
              "Saat partisi (P) memilih Availability; saat normal (E) memilih Latency",
              "Saat partisi (P) memilih Consistency; saat kondisi normal (E) tetap memprioritaskan Consistency di atas Latency",
              "Mengabaikan konsistensi ACID demi performa throughput maksimal di setiap node",
              "Menggunakan protokol Gossip tanpa mekanisme atomisitas terdistribusi",
            ],
            ans: 1,
            topic: "Sistem Terdistribusi",
            diff: "HARD",
            explanation: "Teorema PACELC: If Partition (P) choose Availability (A) or Consistency (C); Else (E) choose Latency (L) or Consistency (C). Sistem PC/EC konsisten memilih konsistensi data yang ketat (Consistency) baik saat terjadi partisi jaringan maupun pada saat operasi jaringan normal.",
          },
          {
            q: "Pada V8 JavaScript Engine, bagaimana siklus Scavenger Garbage Collection bekerja di New Space memory heap?",
            opts: [
              "Melakukan mark-sweep-compact di seluruh RAM yang dialokasikan sistem operasi",
              "Menggunakan algoritma Cheney semi-space copying untuk menyalin objek hidup dari From-Space ke To-Space dan mempromosikan survivor ke Old Space",
              "Menghitung reference counter setiap variabel dan langsung mendealokasikan saat counter 0",
              "Membekukan seluruh thread eksekusi browser selama lebih dari 500 milidetik",
            ],
            ans: 1,
            topic: "Engine Internals",
            diff: "HARD",
            explanation: "New Space V8 menggunakan algoritma Scavenger (semi-space Cheney). Ruang dibagi menjadi From Space dan To Space. Saat GC berjalan, objek yang masih aktif disalin ke To Space secara kontigu. Objek yang bertahan lebih dari dua siklus dipromosikan ke Old Space.",
          },
          {
            q: "Pada sebuah Merkle Tree biner yang memuat N transaksi, berapa kompleksitas komputasi hash yang diperlukan untuk memvalidasi dan memperbarui Merkle Root jika 1 transaksi pada leaf node berubah?",
            opts: ["O(N)", "O(N log N)", "O(log N)", "O(1)"],
            ans: 2,
            topic: "Struktur Data Mahir",
            diff: "HARD",
            explanation: "Setiap node internal dalam Merkle Tree adalah hash dari anak-anaknya. Jika satu daun berubah, hanya jalur (audit path) dari daun tersebut ke akar pohon yang perlu dihitung ulang. Dengan pohon biner seimbang, panjang jalur adalah ketinggian pohon yaitu O(log N).",
          },
          {
            q: "Dalam pemrograman multithreading lock-free pada prosesor multicore dengan Weak Memory Model, apa tujuan utama penyisipan instruksi Memory Barrier (Memory Fence)?",
            opts: [
              "Mencegah compiler dan CPU melakukan reordering instruksi baca/tulis memori yang melintasi batas barrier",
              "Mengunci akses seluruh core CPU terhadap memori utama secara eksklusif",
              "Menghapus cache L1 dan L2 prosesor setiap kali fungsi dipanggil",
              "Mematikan context switching sistem operasi pada thread saat ini",
            ],
            ans: 0,
            topic: "Concurrency & Multithreading",
            diff: "HARD",
            explanation: "CPU dan compiler sering melakukan out-of-order execution untuk efisiensi. Memory Barrier menjamin bahwa seluruh operasi memori sebelum barrier telah rampung dan visibel bagi thread lain sebelum operasi memori setelah barrier mulai dieksekusi.",
          },
          {
            q: "Dalam arsitektur backend berskala tinggi, pola manakah yang paling efektif mencegah insiden Cache Stampede (Thundering Herd) ketika key cache bernilai populer tiba-tiba expired dan diakses puluhan ribu request simultan?",
            opts: [
              "Menghapus parameter TTL agar cache tidak pernah kadaluwarsa",
              "Menggunakan Distributed Mutex Lock (Singleflight) atau algoritma Probabilistic Early Expiration (XFetch)",
              "Menurunkan TTL menjadi 100ms agar data sering di-refresh",
              "Mematikan cache Redis dan mengalihkan semua query langsung ke database master",
            ],
            ans: 1,
            topic: "Desain Sistem Terdistribusi",
            diff: "HARD",
            explanation: "Saat key expired diserbu ribuan request bersamaan, Mutex Lock menjamin hanya 1 request yang mengeksekusi query database dan mengisi ulang cache (lainnya menunggu/memakai stale data sesaat). Algoritma XFetch secara probabilistik memperbarui cache sebelum waktu kedaluwarsa tiba.",
          },
        ],
      },
    },
    {
      title: "Basis Data & SQL Mahir",
      desc: "Pengenalan database relasional, SQL tingkat lanjut, indexing, dan optimasi query",
      code: "DB201",
      teacher: teacher1,
      modules: [
        { title: "Pengenalan Database", desc: "Konsep dasar database relasional", order: 1, materials: [
          { title: "Tabel dan Relasi", content: "Database relasional menggunakan foreign key untuk integritas referensial antar entitas data." },
        ]},
      ],
      quiz: {
        title: "Kuis Basis Data",
        questions: [
          { q: "Apa itu primary key?", opts: ["Kunci rahasia", "Pengidentifikasi unik baris", "Password database", "Nama tabel"], ans: 1, topic: "Database", diff: "EASY" },
          { q: "SQL kepanjangan dari?", opts: ["Structured Query Language", "Simple Query Language", "Standard Question Language", "System Query Logic"], ans: 0, topic: "SQL", diff: "EASY" },
          { q: "JOIN apa yang mengembalikan semua baris dari tabel kiri?", opts: ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL JOIN"], ans: 1, topic: "JOIN", diff: "MEDIUM" },
          { q: "Normalisasi bertujuan untuk?", opts: ["Mempercepat query", "Menghilangkan redundansi", "Menambah data", "Menghapus tabel"], ans: 1, topic: "Normalisasi", diff: "MEDIUM" },
          { q: "Apa itu foreign key?", opts: ["Kunci utama", "Kunci asing yang menghubungkan tabel", "Password", "Nama kolom"], ans: 1, topic: "Database", diff: "EASY" },
        ],
      },
    },
    {
      title: "Desain UI/UX & Interaksi Pengguna",
      desc: "Prinsip desain antarmuka pengguna modern dan evaluasi ergonomis",
      code: "UX301",
      teacher: teacher2,
      modules: [
        { title: "Prinsip Desain", desc: "Dasar-dasar desain UI", order: 1, materials: [
          { title: "Hierarchy Visual", content: "Gunakan ukuran, warna, dan spasi untuk menunjukkan prioritas informasi." },
        ]},
      ],
      quiz: {
        title: "Kuis UI/UX",
        questions: [
          { q: "Apa tujuan utama dari UI/UX design?", opts: ["Membuat aplikasi cantik", "Membuat aplikasi mudah digunakan", "Menambah fitur", "Mengurangi kode"], ans: 1, topic: "UI/UX", diff: "EASY" },
          { q: "Apa itu wireframe?", opts: ["Kode HTML", "Sketsa layout halaman", "Database design", "API endpoint"], ans: 1, topic: "Design", diff: "EASY" },
          { q: "Mobile-first design artinya?", opts: ["Desain untuk mobile dulu", "Hanya untuk mobile", "Desktop dulu", "Tidak perlu responsive"], ans: 0, topic: "Responsive", diff: "EASY" },
          { q: "Color contrast penting untuk?", opts: ["Keindahan", "Accessibility", "Performa", "SEO"], ans: 1, topic: "Accessibility", diff: "MEDIUM" },
          { q: "Apa itu user persona?", opts: ["Username", "Profil pengguna fiktif", "Password", "Avatar"], ans: 1, topic: "Research", diff: "MEDIUM" },
        ],
      },
    },
    {
      title: "Jaringan Komputer & Keamanan Siber",
      desc: "Dasar jaringan, routing, subnetting, dan protokol komunikasi internet",
      code: "NET401",
      teacher: teacher2,
      modules: [
        { title: "Konsep Jaringan", desc: "Pengenalan jaringan komputer", order: 1, materials: [
          { title: "Topologi Jaringan", content: "Star, Bus, Ring, Mesh. Topologi Star paling umum digunakan di jaringan lokal modern." },
        ]},
      ],
      quiz: {
        title: "Kuis Jaringan",
        questions: [
          { q: "Apa kepanjangan dari IP?", opts: ["Internet Protocol", "Internal Process", "Input Port", "Information Path"], ans: 0, topic: "Protokol", diff: "EASY" },
          { q: "Port default HTTP adalah?", opts: ["443", "80", "8080", "22"], ans: 1, topic: "HTTP", diff: "EASY" },
          { q: "DNS berfungsi untuk?", opts: ["Mengenkripsi data", "Menerjemahkan domain ke IP", "Mengirim email", "Menyimpan file"], ans: 1, topic: "DNS", diff: "MEDIUM" },
          { q: "Topologi apa yang semua node terhubung ke satu pusat?", opts: ["Bus", "Star", "Ring", "Mesh"], ans: 1, topic: "Topologi", diff: "EASY" },
          { q: "HTTPS menggunakan port berapa?", opts: ["80", "443", "8080", "3000"], ans: 1, topic: "HTTP", diff: "EASY" },
        ],
      },
    },
    {
      title: "Algoritma dan Struktur Data Mahir",
      desc: "Analisis kompleksitas, graf, dynamic programming, dan pohon seimbang",
      code: "ALG501",
      teacher: teacher1,
      modules: [
        { title: "Analisis Algoritma", desc: "Big O, Omega, dan Theta", order: 1, materials: [
          { title: "Asymptotic Notation", content: "Big O menyatakan batas atas (upper bound) asimtotik dari waktu eksekusi terhadap ukuran masukan N." },
        ]},
      ],
      quiz: {
        title: "King of the Hill: Algoritma, Concurrency & Struktur Data (10 Soal Sangat Sulit)",
        questions: [
          {
            q: "Berapa batas bawah teoretis (theoretical lower bound) kompleksitas waktu untuk algoritma pengurutan berbasis perbandingan (comparison-based sorting) dalam kasus terburuk?",
            opts: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"],
            ans: 1,
            topic: "Kompleksitas Komputasi",
            diff: "HARD",
            explanation: "Setiap perbandingan menghasilkan 2 cabang pohon keputusan. Untuk mengurutkan N elemen, ada N! permutasi kemungkinan. Ketinggian pohon keputusan minimal adalah ceil(log2(N!)) yang menurut rumus Stirling bernilai Omega(N log N).",
          },
          {
            q: "Dalam struktur data Red-Black Tree, properti manakah yang menjamin bahwa tidak ada jalur dari root ke leaf yang lebih panjang dari dua kali jalur terpendek lainnya?",
            opts: [
              "Setiap node harus memiliki tepat 2 anak",
              "Setiap leaf (NIL) berwarna hitam dan jika sebuah node berwarna merah, kedua anaknya wajib berwarna hitam",
              "Root selalu berwarna merah terang",
              "Semua node hitam hanya boleh berada di sisi kiri pohon",
            ],
            ans: 1,
            topic: "Pohon Seimbang",
            diff: "HARD",
            explanation: "Properti Red-Black Tree: tidak boleh ada dua node merah berturut-turut (anak node merah harus hitam), dan jumlah node hitam dari root ke setiap leaf harus sama persis (Black Height). Hal ini membatasi jalur terpanjang (merah-hitam selang-seling) maksimal 2x jalur terpendek (seluruhnya hitam).",
          },
          {
            q: "Algoritma Floyd-Warshall untuk mencari shortest path antar semua pasangan simpul (All-Pairs Shortest Path) memiliki kompleksitas waktu dan ruang:",
            opts: ["O(V + E) waktu, O(V) ruang", "O(V^3) waktu, O(V^2) ruang", "O(E log V) waktu, O(V) ruang", "O(V^2 log V) waktu, O(E) ruang"],
            ans: 1,
            topic: "Graf & Dynamic Programming",
            diff: "HARD",
            explanation: "Floyd-Warshall mengevaluasi 3 nested loop untuk setiap simpul perantara k, asal i, dan tujuan j (V x V x V = O(V^3) waktu), menggunakan matriks jarak adjacency berukuran V x V = O(V^2) ruang.",
          },
          {
            q: "Masalah Knapsack 0/1 memiliki kompleksitas waktu Dynamic Programming sebesar O(N * W), di mana W adalah kapasitas bobot tas. Mengapa algoritma ini diklasifikasikan sebagai Pseudo-polynomial time dan BUKAN Polynomial time murni?",
            opts: [
              "Karena nilai N selalu bernilai prima",
              "Karena kompleksitasnya polinomial terhadap nilai numerik W, namun eksponensial terhadap panjang bit representasi masukan log(W)",
              "Karena hanya bisa dijalankan pada komputer kuantum",
              "Karena bobot W harus berupa bilangan pecahan",
            ],
            ans: 1,
            topic: "Teori Kompleksitas",
            diff: "HARD",
            explanation: "Dalam teori kompleksitas, ukuran input diukur dari panjang bit. Nilai numerik W dituliskan dalam b = log2(W) bit. Maka O(N * W) = O(N * 2^b), yang merupakan fungsi eksponensial terhadap ukuran panjang representasi bit input b.",
          },
          {
            q: "Pada struktur data Disjoint Set Union (Union-Find) yang dioptimasi dengan Path Compression dan Union by Rank, berapa rata-rata kompleksitas waktu teramortisasi per operasi?",
            opts: ["O(1)", "O(log N)", "O(alpha(N)) di mana alpha adalah fungsi invers Ackermann", "O(N)"],
            ans: 2,
            topic: "Struktur Data Tingkat Lanjut",
            diff: "HARD",
            explanation: "Kombinasi Path Compression dan Union by Rank menghasilkan kompleksitas O(alpha(N)), di mana alpha(N) adalah fungsi invers Ackermann yang tumbuh sangat lambat (bernilai kurang dari 5 untuk semua nilai N praktis di alam semesta).",
          },
          {
            q: "Dalam algoritma A* Search, kondisi apa yang WAJIB dipenuhi oleh fungsi heuristik h(n) agar dijamin menghasilkan jalur terpendek optimal pada pencarian berbasis graf (Graph Search)?",
            opts: [
              "Heuristik harus bernilai selalu 0",
              "Heuristik harus konsisten (monotonic), yaitu h(n) <= c(n, a, n') + h(n')",
              "Heuristik harus lebih besar dari biaya riil ke tujuan",
              "Heuristik harus menggunakan fungsi polinomial berderajat ganjil",
            ],
            ans: 1,
            topic: "Pencarian Graf Cerdas",
            diff: "HARD",
            explanation: "Pada Graph Search (di mana node yang telah dikunjungi tidak dievaluasi ulang), heuristik wajib konsisten/monotonik: h(n) <= cost(n, n') + h(n'). Konsistensi secara otomatis menjamin admissibility (h(n) <= h*(n)) dan menjamin jalur ke setiap node yang diekspansi adalah optimal.",
          },
          {
            q: "Diberikan string S dengan panjang N. Berapakah kompleksitas waktu optimal untuk membangun Suffix Automaton atau Suffix Tree (menggunakan algoritma Ukkonen) dari string tersebut?",
            opts: ["O(N^2)", "O(N log N)", "O(N)", "O(2^N)"],
            ans: 2,
            topic: "Algoritma String Mahir",
            diff: "HARD",
            explanation: "Algoritma Ukkonen untuk Suffix Tree dan konstruksi Suffix Automaton (SAM) secara online mampu membangun struktur data indeks teks lengkap dalam waktu linear O(N) dan memori O(N) untuk alfabet berukuran konstan.",
          },
          {
            q: "Pada algoritma Bellman-Ford, berapa jumlah iterasi relaksasi tepi (edge relaxation) yang dibutuhkan untuk mendeteksi siklus berbobot negatif (negative weight cycle) dalam graf dengan V simpul?",
            opts: [
              "V - 1 iterasi",
              "Iterasi ke-V jika masih terdapat tepi yang berhasil direlaksasi",
              "V^2 iterasi",
              "Tepat 1 iterasi saja",
            ],
            ans: 1,
            topic: "Graf Berbobot",
            diff: "HARD",
            explanation: "Shortest path sederhana maksimal memiliki V - 1 tepi. Pada iterasi ke-V, jika masih ada tepi yang nilainya dapat diperkecil (dapat direlaksasi), hal ini membuktikan adanya siklus berbobot negatif yang dapat dilalui tanpa henti.",
          },
          {
            q: "Dalam problem Concurrency Readers-Writers dengan pencegahan kelaparan penulis (Writer-Starvation Prevention), prinsip penjadwalan manakah yang harus diterapkan?",
            opts: [
              "Reader baru yang datang diizinkan membaca langsung meskipun ada Writer yang sedang antre menunggu lock",
              "Ketika ada Writer yang meminta akses, Reader baru ditunda hingga antrean Writer selesai menulis",
              "Menghapus mutex lock dan membiarkan pembacaan memori kotor (dirty reads)",
              "Menutup seluruh koneksi pembaca saat thread penulis diinisialisasi",
            ],
            ans: 1,
            topic: "Sistem Operasi & Sinkronisasi",
            diff: "HARD",
            explanation: "Jika Reader baru selalu diprioritaskan, aliran pembaca yang kontinu akan menyebabkan Writer mengalami kelaparan permanen (starvation). Solusi writer-preference memblokir reader baru segera setelah writer mengantre lock.",
          },
          {
            q: "Algoritma Tarjan untuk mencari Strongly Connected Components (SCC) pada graf berarah beroperasi dengan memanfaatkan:",
            opts: [
              "Dua kali penelusuran Breadth First Search (BFS)",
              "Satu kali Depth First Search (DFS) dengan pelacakan nomor penemuan (discovery index) dan low-link value serta pemanfaatan stack",
              "Minimum Spanning Tree Prim",
              "Topological Sort dua arah",
            ],
            ans: 1,
            topic: "Analisis Graf Kuat",
            diff: "HARD",
            explanation: "Algoritma Tarjan hanya membutuhkan 1 kali DFS linear O(V + E). Setiap simpul dicatat indeks penemuannya dan low-link value (indeks terkecil yang dapat dicapai dari subtree DFS-nya). Simpul disimpan di stack dan di-pop sebagai satu komponen SCC utuh ketika low-link sama dengan indeks penemuan.",
          },
        ],
      },
    },
  ]

  // ─── Seed Each Course ─────────────────────────────────
  for (const cd of coursesData) {
    const course = await prisma.course.create({
      data: { title: cd.title, description: cd.desc, code: cd.code, teacherId: cd.teacher.id },
    })

    // Enroll ALL students in ALL courses so all accounts can play immediately
    for (const s of students) {
      await prisma.enrollment.create({ data: { userId: s.id, courseId: course.id } }).catch(() => {})
    }

    // Modules + materials
    for (const md of cd.modules) {
      await prisma.module.create({
        data: {
          courseId: course.id,
          title: md.title,
          description: md.desc,
          order: md.order,
          materials: {
            create: md.materials.map((m, i) => ({
              title: m.title,
              type: "TEXT" as const,
              content: m.content,
              order: i + 1,
            })),
          },
        },
      })
    }

    // Create Quiz Session
    const quizSession = await prisma.quizSession.create({
      data: {
        courseId: course.id,
        title: cd.quiz.title,
        description: cd.quiz.questions.length === 10
          ? "Kuis kompetisi 10 soal sangat sulit. Peringkat dinilai dari akurasi (paling benar) dan kecepatan respon (paling cepat)!"
          : "Kuis evaluasi pemahaman materi perkuliahan.",
        isKingOfTheHill: true,
      },
    })

    const createdQuestions = []
    for (let i = 0; i < cd.quiz.questions.length; i++) {
      const q = cd.quiz.questions[i]
      const createdQ = await prisma.quizQuestion.create({
        data: {
          quizSessionId: quizSession.id,
          question: q.q,
          topic: q.topic,
          difficulty: q.diff as QuestionDifficulty,
          explanation: (q as any).explanation || null,
          order: i,
          options: {
            create: q.opts.map((text, idx) => ({
              text,
              isCorrect: idx === q.ans,
              order: idx,
            })),
          },
        },
        include: { options: true },
      })
      createdQuestions.push(createdQ)
    }

    // ─── Seed Pre-answered Competition for other students ──────────────────
    // If this is a 10-question King of the Hill Championship, seed competition:
    // Sari = 10/10 Benar (2.3s avg) -> REIGNING KING OF THE HILL 👑
    // Rizki = 9/10 Benar (2.7s avg) -> RANK #2 🥈
    // Dina  = 8/10 Benar (3.2s avg) -> RANK #3 🥉
    // Farhan = 7/10 Benar (3.8s avg) -> RANK #4
    // Andi (students[0]) is left UNSUBMITTED so user can compete and conquer!
    if (cd.quiz.questions.length === 10) {
      const competitorConfigs = [
        { student: students[1], correctTarget: 10, minTime: 1900, maxTime: 2600 }, // Sari: 10/10 Benar (Reigning King)
        { student: students[2], correctTarget: 9, minTime: 2400, maxTime: 3100 },  // Rizki: 9/10 Benar (#2)
        { student: students[3], correctTarget: 8, minTime: 2800, maxTime: 3600 },  // Dina: 8/10 Benar (#3)
        { student: students[4], correctTarget: 7, minTime: 3400, maxTime: 4300 },  // Farhan: 7/10 Benar (#4)
      ]

      for (const comp of competitorConfigs) {
        if (!comp.student) continue
        let totalScore = 0
        let correctCount = 0
        let totalTime = 0

        for (let i = 0; i < createdQuestions.length; i++) {
          const q = createdQuestions[i]
          const isCorrect = i < comp.correctTarget
          const responseTime = Math.floor(Math.random() * (comp.maxTime - comp.minTime)) + comp.minTime
          totalTime += responseTime

          let speedBonus = 0
          if (isCorrect) {
            correctCount++
            if (responseTime < 3000) {
              speedBonus = Math.round(50 * (1 - responseTime / 3000))
            } else if (responseTime < 10000) {
              speedBonus = Math.round(25 * (1 - (responseTime - 3000) / 7000))
            }
          }
          const points = isCorrect ? 1000 + speedBonus : 0
          totalScore += points

          const correctOption = q.options.find((o) => o.isCorrect)
          const wrongOption = q.options.find((o) => !o.isCorrect) || q.options[0]
          const chosenOption = isCorrect ? correctOption! : wrongOption

          await prisma.quizAnswer.create({
            data: {
              quizSessionId: quizSession.id,
              userId: comp.student.id,
              questionId: q.id,
              optionId: chosenOption.id,
              selectedOptionIds: [chosenOption.id],
              isCorrect,
              responseTimeMs: responseTime,
              points,
            },
          })
        }

        const avgMs = Math.round(totalTime / createdQuestions.length)
        await prisma.quizResult.create({
          data: {
            quizSessionId: quizSession.id,
            userId: comp.student.id,
            totalScore,
            correctCount,
            totalCount: createdQuestions.length,
            avgResponseMs: avgMs,
          },
        })
      }
    }

    // Attendance
    const att = await prisma.attendanceSession.create({
      data: {
        courseId: course.id,
        title: `Pertemuan 1 - ${cd.title}`,
        code: Math.random().toString(36).substring(2, 8).toUpperCase(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
    for (const s of students.slice(0, 4)) {
      await prisma.attendanceCheckin.create({
        data: { attendanceSessionId: att.id, userId: s.id },
      }).catch(() => {})
    }

    // Assignments & Submissions
    if ((cd as any).assignments && (cd as any).assignments.length > 0) {
      for (const aData of (cd as any).assignments) {
        const assign = await prisma.assignment.create({
          data: {
            courseId: course.id,
            title: aData.title,
            description: aData.description,
            deadline: new Date(Date.now() + aData.days * 24 * 60 * 60 * 1000),
          },
        })

        if (aData.submissions) {
          for (const sub of aData.submissions) {
            const studentUser = students[sub.studentIndex]
            if (studentUser) {
              const createdSub = await prisma.submission.create({
                data: {
                  assignmentId: assign.id,
                  userId: studentUser.id,
                  content: sub.content,
                  fileUrl: sub.fileUrl || null,
                },
              })

              if (sub.score !== undefined) {
                await prisma.grade.create({
                  data: {
                    submissionId: createdSub.id,
                    assignmentId: assign.id,
                    userId: studentUser.id,
                    courseId: course.id,
                    score: sub.score,
                    maxScore: 100,
                    feedback: sub.feedback || null,
                  },
                })
              }
            }
          }
        }
      }
    } else {
      const assign = await prisma.assignment.create({
        data: {
          courseId: course.id,
          title: `Tugas ${cd.title}`,
          description: `Kerjakan tugas studi kasus terstruktur untuk ${cd.title}`,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      })
      for (const s of students.slice(0, 3)) {
        await prisma.submission.create({
          data: {
            assignmentId: assign.id,
            userId: s.id,
            content: `Tugas ${cd.title} oleh ${s.name}`,
          },
        }).catch(() => {})
      }
    }

    // Seed Topic Masteries
    const uniqueTopics = Array.from(new Set(cd.quiz.questions.map((q) => q.topic)))
    for (const s of students) {
      for (const topic of uniqueTopics) {
        const isWeak = Math.random() < 0.3
        const score = isWeak ? Math.floor(Math.random() * 20) + 40 : Math.floor(Math.random() * 25) + 75
        await prisma.topicMastery.create({
          data: {
            userId: s.id,
            courseId: course.id,
            topic,
            masteryScore: score,
            confidence: 0.8,
            attemptCount: 10,
            correctCount: Math.round(10 * (score / 100)),
            accuracy: score / 100,
            recentAccuracy: score / 100,
            avgResponseMs: Math.floor(Math.random() * 3000) + 1800,
            trend: isWeak ? "DECLINING" : "IMPROVING",
            lastPracticedAt: new Date(),
          },
        }).catch(() => {})
      }
    }

    console.log(`  ✓ ${cd.title} (${cd.code}) — ${students.length} mahasiswa terdaftar, ${cd.quiz.questions.length} butir soal`)
  }

  console.log("\n========================================================")
  console.log("Seeding Database Selesai!")
  console.log("Akun Dosen   : guru@sekolah.id / password123")
  console.log("Akun Mahasiswa: andi@sekolah.id / password123 (Challenger)")
  console.log("Reigning King : sari@sekolah.id / password123 (10/10 Benar)")
  console.log("Competitor #2 : rizki@sekolah.id / password123 (9/10 Benar)")
  console.log("Competitor #3 : dina@sekolah.id / password123 (8/10 Benar)")
  console.log("Competitor #4 : farhan@sekolah.id / password123 (7/10 Benar)")
  console.log("========================================================")
}

main().catch(console.error).finally(() => prisma.$disconnect())
