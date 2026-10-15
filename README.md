# Aksara — Next-Gen AI-Assisted Learning Management System

**Aksara** adalah platform *Learning Management System* (LMS) modern dan adaptif yang dirancang untuk mendukung ekosistem pembelajaran perkuliahan dengan integrasi *AI-Assisted Remedial & Training*, pemantauan presensi berbasis kode kedaluwarsa, evaluasi kuis gamifikasi (*King of the Hill*), dan analitik penguasaan topik (*Topic Mastery*).

---

## 🏛️ Arsitektur & Struktur Proyek

Repositori ini menggunakan struktur **Monorepo (Workspaces)** terpadu yang memisahkan layer backend API, frontend web SPA/SSR, skema basis data Prisma, dan dokumentasi kompetisi:

```
m-one/
├── api/                            # Backend REST API Service
│   ├── src/
│   │   ├── config/                 # Konfigurasi Database & Environment
│   │   ├── controllers/            # Route Controllers (Auth, Course, Quiz, AI, dll)
│   │   ├── middleware/             # Auth JWT, Role RBAC & Error Handling
│   │   ├── routes/                 # Express API Route Definitions
│   │   ├── services/               # Core Business Logic (AI Providers, Mastery Engine, dll)
│   │   ├── utils/                  # Skema Validasi Zod & Helpers
│   │   ├── seed.ts                 # Database Seeder Data
│   │   └── server.ts               # Server Entrypoint
│   ├── tests/                      # Script Verifikasi & E2E Testing
│   │   ├── test-brutal-verification.ts
│   │   └── test-e2e.ts
│   ├── Dockerfile                  # Container definition backend
│   ├── package.json
│   └── tsconfig.json
│
├── web/                            # Frontend Next.js 16 Web Application
│   ├── public/                     # Static Assets, Logo & Optimized WebP Images
│   ├── src/
│   │   ├── app/                    # Next.js App Router Pages & Layouts
│   │   │   ├── (auth)/             # Login & Register Pages
│   │   │   ├── (main)/             # Dashboard, Courses, Quiz, Calendar, Attendance, AI
│   │   │   ├── globals.css         # Tailwind & Typography Theme Setup
│   │   │   └── layout.tsx          # Root Application Layout
│   │   ├── components/             # Reusable UI Components
│   │   │   ├── auth/               # Auth Guards & State Handlers
│   │   │   ├── dashboard/          # Student & Teacher Dashboard Views
│   │   │   ├── layout/             # Header, Navigation & Institutional Footer
│   │   │   └── ui/                 # StatCard, ProgressBar, Badge, EmptyState
│   │   └── lib/                    # Axios API Client & Auth Context Provider
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── prisma/                         # Basis Data & ORM
│   ├── schema.prisma               # Prisma Data Model Definitions
│   └── seed.ts                     # Root Database Seeding Script
│
├── prompts/                        # Spesifikasi & Aturan Pengembangan Proyek
├── docker-compose.yml              # Multi-container PostgreSQL & API Deployment
├── package.json                    # Monorepo Workspace Configuration & Scripts
└── README.md                       # Dokumentasi Proyek
```

---

## 🚀 Tech Stack

- **Frontend**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS, Axios
- **Backend**: Node.js, Express, TypeScript, Zod, JWT, bcryptjs, Helmet, Rate Limiter
- **Database & ORM**: PostgreSQL 16, Prisma ORM 5
- **AI Integrasi**: Multi-provider AI Fallback (MIMO, Gemini, LongCat, Rule-based Engine)

---

## ⚡ Panduan Instalasi & Menjalankan Proyek

### 1. Prasyarat
- Node.js >= 20.x
- npm >= 10.x
- PostgreSQL >= 16 (atau Docker Desktop)

### 2. Konfigurasi Environment
Salin file `.env.example` menjadi `.env` di root project:
```bash
cp .env.example .env
```

Sesuaikan parameter database dan AI provider:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/edtech"
JWT_SECRET="aksara-super-secure-jwt-secret-key-2026"
AI_PROVIDER="mimo"
AI_API_KEY="your-api-key"
AI_BASE_URL="https://api.example.com/v1"
PORT=8080
NEXT_PUBLIC_API_URL="http://localhost:8080/api"
```

### 3. Setup Database & Seeding
```bash
# Generate Prisma Client
npm run prisma:generate

# Push Schema ke Database
npm run prisma:push

# Jalankan Seeding Data Dummy Lengkap (5 Mata Kuliah, Modul, Kuis, Presensi)
npm run seed
```

### 4. Menjalankan Server Development
Anda dapat menjalankan backend dan frontend secara bersamaan atau terpisah:

```bash
# Menjalankan Backend API (Port 8080)
npm run dev:api

# Menjalankan Frontend Next.js (Port 3000)
npm run dev:web
```

---

## 🔑 Akun Demo Bawaan (Seed Data)

| Peran | Email | Password | Keterangan |
| :--- | :--- | :--- | :--- |
| **Dosen / Pengajar** | `guru@sekolah.id` | `password123` | Akses manajemen kelas, input presensi, evaluasi nilai |
| **Mahasiswa 1** | `andi@sekolah.id` | `password123` | Akses materi, kuis, sesi remedial AI, presensi |
| **Mahasiswa 2** | `sari@sekolah.id` | `password123` | Data tracking progress & leaderboard aktif |
| **Mahasiswa 3** | `rizki@sekolah.id` | `password123` | Data tracking progress & leaderboard aktif |

---

## 🛠️ Daftar Command NPM (Root Workspace)

| Perintah | Deskripsi |
| :--- | :--- |
| `npm run dev:api` | Menjalankan backend Express server dengan auto-reload |
| `npm run dev:web` | Menjalankan frontend Next.js Turbopack dev server |
| `npm run build` | Melakukan kompilasi TypeScript backend dan Next.js production build |
| `npm run build:api` | Build backend ke folder `api/dist` |
| `npm run build:web` | Build frontend Next.js ke folder `web/.next` |
| `npm run seed` | Mengisi database dengan data demo perkuliahan lengkap |
| `npm run prisma:generate` | Memperbarui Prisma Client berdasarkan `schema.prisma` |
| `npm run prisma:push` | Menerapkan perubahan schema ke database tanpa migration file |
| `npm run prisma:studio` | Membuka antarmuka web Prisma Studio untuk eksplorasi data |
| `npm run test:api` | Menjalankan script E2E API testing |
| `npm run test:verify` | Menjalankan validasi menyeluruh flow & edge case backend |
| `npm run lint` | Menjalankan ESLint pada kode frontend |

---

## 🐳 Menjalankan dengan Docker Compose

Untuk menjalankan seluruh stack (PostgreSQL + API):
```bash
docker-compose up -d --build
```
Aplikasi backend akan tersedia di `http://localhost:8080`.
