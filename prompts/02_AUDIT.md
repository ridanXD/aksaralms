# AKSARA — FEATURE MAXIMIZATION & COMPETITION READINESS

Kamu bertindak sebagai **Senior Full-Stack Engineer, Product Architect, EdTech Product Strategist, dan Technical Lead untuk kompetisi teknologi**.

Saya sedang mengembangkan **Aksara**, sebuah platform EdTech terintegrasi untuk kompetisi bertema:

> **“Innovating Education Through Technology”**

Target utama kita bukan sekadar membuat LMS biasa, tetapi membuat sistem yang menunjukkan bahwa teknologi dapat membuat proses belajar menjadi **lebih personal, adaptif, kompetitif, terukur, dan actionable**.

## KONDISI PROJECT SAAT INI

Project sudah memiliki fondasi full-stack dan sebagian besar fitur P0/P1 sudah berjalan end-to-end.

### Tech Stack

Backend:

* Node.js
* Express
* TypeScript
* Modular architecture
* Controllers
* Routes
* Middleware
* Services
* JWT authentication
* bcrypt
* helmet
* cookie-parser
* rate limiting

Database:

* PostgreSQL
* Prisma ORM
* 20+ relational models
* Seeder
* Relasi antara User, Course, Module, Material, Progress, QuizSession, QuizResult, WeakTopic, Attendance, Assignment, Grade, AIPerformanceAnalysis, TrainingSession, dan model terkait lainnya.

Frontend:

* Next.js
* App Router
* TypeScript
* Tailwind CSS
* Mobile-first
* State handling untuk loading / empty / error

AI:

* Provider abstraction layer
* LongCat
* MiMo V2.5 Pro
* API key hanya berada di server
* AI dipanggil melalui backend service abstraction

---

# FITUR YANG SUDAH ADA

## 1. Authentication & Role

Sudah tersedia:

* Register
* Login
* bcrypt password hashing
* JWT
* STUDENT
* TEACHER
* Auth context
* Route protection

## 2. LMS

Student:

* melihat course
* melihat module
* membaca material
* material teks/video
* tracking progress
* continue learning
* persentase progress

Teacher:

* membuat course
* mengelola module
* mengelola material
* melihat student yang terdaftar

Route utama:

* `/courses`
* `/courses/[courseId]`

## 3. King of the Hill Competitive Quiz

Sudah tersedia:

* quiz session
* server-side scoring
* accuracy
* speed bonus
* response time
* streak
* leaderboard
* ranking
* King of the Hill
* quiz history
* weak topic detection
* answer history

Route:

* `/quiz`
* `/quiz/[sessionId]`

## 4. AI Performance Analysis & Adaptive Training

Ini adalah flagship feature.

Sudah tersedia:

* membaca hasil quiz
* mendeteksi weak topics
* AI performance analysis
* remedial plan
* personalized practice
* AI-generated adaptive questions
* explanation
* `/ai-training`

AI bukan chatbot biasa.

## 5. Attendance

Sudah tersedia:

Teacher:

* membuat attendance session
* unique code
* expiry

Student:

* check-in menggunakan code
* melihat attendance history

## 6. Assignment

Teacher:

* membuat assignment
* deadline
* instructions
* grading
* feedback

Student:

* submit text/link
* melihat submission status

## 7. Grades

Sudah tersedia:

* centralized grades
* quiz result
* assignment result
* database-driven grade
* course grade
* `/grades`
* `/grades/[courseId]`

---

# CORE LEARNING LOOP

Saat ini sistem sudah memiliki:

```text
LEARN
  ↓
ATTEND
  ↓
ASSIGNMENT
  ↓
QUIZ
  ↓
COMPETITION
  ↓
GRADE
  ↓
AI ANALYSIS
  ↓
WEAK TOPIC
  ↓
ADAPTIVE TRAINING
  ↓
IMPROVED PERFORMANCE
  ↓
QUIZ AGAIN
```

Ini harus menjadi fondasi utama pengembangan berikutnya.

---

# TUJUAN UTAMA

Saya tidak ingin kamu sekadar menambahkan banyak fitur.

Saya ingin kamu mencari cara agar Aksara terasa seperti **satu intelligent learning ecosystem**, bukan kumpulan fitur LMS yang ditempel menjadi satu.

Prioritas:

1. Memaksimalkan fitur yang sudah ada.
2. Memperdalam integrasi antar fitur.
3. Membuat AI benar-benar memiliki fungsi pedagogis.
4. Membuat data siswa menghasilkan keputusan.
5. Membuat competitive quiz menjadi meaningful.
6. Membuat siswa memiliki alasan untuk terus belajar.
7. Membuat guru mendapatkan insight yang berguna.
8. Membuat sistem terlihat technically impressive saat demo kompetisi.
9. Mengurangi fitur gimmick.
10. Jangan fokus pada visual/UI terlebih dahulu.

---

# ATURAN PENTING

## JANGAN

Jangan:

* redesign UI
* membuat landing page
* membuat visual baru
* menambahkan animasi hanya untuk terlihat keren
* membuat chatbot AI generik
* menambahkan fitur gimmick yang tidak berhubungan dengan learning loop
* membuat data dummy untuk menggantikan data nyata
* membuat architecture rewrite tanpa alasan kuat
* mengganti stack
* menambahkan dependency besar tanpa alasan
* membuat fitur yang tidak terintegrasi dengan database
* membuat fitur yang hanya bekerja di frontend
* mengorbankan reliability demi fitur baru

UI/UX akan dikerjakan pada fase terpisah.

---

# YANG HARUS KAMU LAKUKAN

Sebelum melakukan perubahan kode, lakukan audit menyeluruh terhadap repository.

Periksa:

```text
/api
/web
/prisma
```

Audit:

* database schema
* Prisma relations
* controllers
* routes
* services
* middleware
* authentication
* authorization
* API contracts
* frontend data fetching
* state management
* error handling
* validation
* AI service
* quiz scoring
* leaderboard
* weak topic detection
* grade calculation
* attendance
* assignment
* seed data

Jangan berasumsi implementasi saat ini benar hanya karena dokumentasi mengatakan fitur sudah ada.

**Baca kode aktual.**

---

# PHASE 1 — SYSTEM AUDIT

Cari:

### A. Broken / incomplete features

Temukan:

* endpoint yang belum digunakan frontend
* frontend feature yang belum terhubung backend
* database model yang belum digunakan
* API yang memiliki response tidak konsisten
* TODO
* FIXME
* placeholder
* hardcoded data
* mock data
* race condition
* missing validation
* authorization vulnerability
* inconsistent error handling
* duplicated business logic
* N+1 query
* unnecessary database query
* incorrect Prisma relation
* calculation yang salah
* state yang bisa stale

### B. Feature integration gaps

Cari fitur yang sudah ada tetapi belum benar-benar terhubung.

Contoh:

```text
quiz → weak topic
weak topic → AI analysis
AI analysis → training
training → performance
performance → next quiz
```

Pastikan setiap bagian benar-benar menggunakan data nyata dari database.

---

# PHASE 2 — MAKSIMALKAN AI ADAPTIVE LEARNING

AI adalah fitur pembeda utama Aksara.

Jangan jadikan AI hanya sebagai:

> "buatkan 10 soal"

AI harus memahami kondisi siswa.

Buat konsep:

## Student Learning Profile

Sistem harus dapat membangun profil belajar berdasarkan data:

* quiz accuracy
* response time
* streak
* attempts
* topic mastery
* weak topics
* assignment performance
* attendance
* training history
* improvement rate
* repeated mistakes

Contoh:

```text
Student
 ↓
Performance History
 ↓
Topic Mastery
 ↓
Weakness Pattern
 ↓
Learning Profile
 ↓
Adaptive Training
```

---

# PHASE 3 — TOPIC MASTERY ENGINE

Jangan hanya menentukan:

```text
weak topic = true
```

Buat sistem mastery yang lebih meaningful.

Misalnya setiap topic memiliki:

```text
mastery score
confidence
attempt count
recent performance
average response time
trend
```

Contoh:

```text
Algorithm
Mastery: 82
Trend: improving

Database Normalization
Mastery: 43
Trend: declining

OOP
Mastery: 67
Trend: stable
```

Gunakan pendekatan yang masuk akal dan explainable.

Tidak harus menggunakan machine learning kompleks.

Rule-based + weighted scoring sudah cukup jika implementasinya kuat.

---

# PHASE 4 — ADAPTIVE QUESTION ENGINE

AI question generation harus mempertimbangkan:

* topic weakness
* mastery level
* previous mistakes
* difficulty
* question type
* recent performance
* repetition avoidance
* learning objective

Jangan membuat soal random.

Contoh:

Jika student:

```text
Topic: SQL JOIN
Mastery: 35
Repeated mistake: LEFT JOIN vs INNER JOIN
```

maka training harus:

```text
1. konsep dasar
2. soal sederhana
3. soal dengan kasus
4. soal sedikit lebih kompleks
5. evaluasi ulang
```

Jika student sudah menguasai:

```text
Mastery: 90+
```

jangan terus diberikan soal mudah.

Naikkan difficulty.

---

# PHASE 5 — LEARNING FEEDBACK LOOP

Implementasikan feedback loop:

```text
QUIZ
 ↓
ANALYSIS
 ↓
WEAKNESS
 ↓
TRAINING
 ↓
POST-TRAINING ASSESSMENT
 ↓
COMPARE PERFORMANCE
 ↓
MASTERY UPDATE
```

Sistem harus dapat menjawab:

> "Apakah latihan AI benar-benar membuat siswa membaik?"

Contoh:

```text
Before training:
SQL JOIN = 42%

After training:
SQL JOIN = 78%

Improvement:
+36 percentage points
```

Ini sangat penting untuk demo kompetisi.

---

# PHASE 6 — COMPETITIVE LEARNING

King of the Hill jangan hanya leaderboard biasa.

Maksimalkan mekanismenya.

Pertimbangkan:

* streak
* speed bonus
* accuracy
* comeback
* improvement
* personal best
* topic mastery
* rank movement
* quiz consistency

Tetapi jangan membuat sistem terlalu game-like sampai menghilangkan aspek pendidikan.

Leaderboard harus tetap memiliki educational value.

Contoh:

```text
Rank
Score
Accuracy
Avg Response
Streak
Improvement
```

Buat sistem dapat menjelaskan kenapa seorang siswa berada di posisi tertentu.

---

# PHASE 7 — PERSONALIZED COMPETITION

Jangan hanya:

```text
Rank 1
Rank 2
Rank 3
```

Tambahkan konsep personal achievement.

Contoh:

```text
Personal Best
+18%

Fastest Answer
1.2s

Longest Streak
12

Biggest Improvement
+27%

Mastery Growth
+15%
```

Tujuannya agar siswa yang tidak menjadi #1 tetap memiliki motivasi.

---

# PHASE 8 — TEACHER INTELLIGENCE

Guru harus mendapatkan manfaat dari seluruh data yang dikumpulkan sistem.

Buat teacher insight yang actionable.

Contoh:

```text
Class Mastery

Database        78%
OOP             71%
Algorithms      54%
Normalization   42%
```

Kemudian:

```text
⚠ 63% students struggle with Normalization

Recommended action:
Assign remedial material
+ adaptive training
```

Sistem harus membantu guru mengetahui:

* topic paling lemah
* siswa yang tertinggal
* siswa yang meningkat
* siswa dengan performa menurun
* attendance correlation
* assignment performance
* quiz performance
* class mastery

Jangan hanya membuat dashboard angka.

Buat **actionable insights**.

---

# PHASE 9 — LEARNING INTERVENTION

Buat sistem mendeteksi siswa yang membutuhkan intervensi.

Contoh:

```text
Attendance ↓
Assignment ↓
Quiz ↓
Mastery ↓
```

Sistem dapat menandai:

```text
At Risk
```

Tetapi jangan menggunakan label secara sembarangan.

Gunakan kombinasi data yang jelas dan explainable.

Contoh:

```text
Risk factors:
- attendance < 70%
- assignment completion < 50%
- quiz mastery declining
```

Guru kemudian dapat melakukan tindakan.

---

# PHASE 10 — SMART RECOMMENDATION

Buat recommendation engine.

Ketika student membuka Aksara, sistem harus dapat menentukan:

> "Apa hal paling berguna yang harus dilakukan siswa sekarang?"

Contoh:

```text
Recommended for you

Continue:
Database Fundamentals

Priority:
SQL JOIN — mastery 42%

Practice:
5 adaptive questions

Upcoming:
Assignment deadline tomorrow
```

Jadi sistem bukan sekadar menampilkan semua fitur.

Sistem membantu menentukan **next best action**.

---

# PHASE 11 — DATA CONSISTENCY

Audit seluruh calculation.

Pastikan:

* quiz score konsisten
* grade konsisten
* leaderboard konsisten
* mastery konsisten
* assignment grade konsisten
* progress konsisten

Tidak boleh ada:

```text
frontend score != backend score
```

Business logic harus berada di server.

---

# PHASE 12 — SECURITY

Audit:

* JWT
* authorization
* role-based access
* IDOR
* input validation
* rate limiting
* API abuse
* quiz manipulation
* score manipulation
* leaderboard manipulation
* assignment submission manipulation
* teacher/student privilege escalation
* AI prompt injection melalui user-generated content

Terutama:

## QUIZ SECURITY

Student tidak boleh dapat memanipulasi:

```text
score
response time
streak
correct answer
leaderboard position
```

melalui frontend request.

---

# PHASE 13 — PERFORMANCE

Audit:

* Prisma queries
* N+1
* unnecessary joins
* repeated queries
* leaderboard queries
* quiz session queries
* AI requests
* caching opportunity
* pagination

Jangan melakukan premature optimization.

Optimalkan bagian yang benar-benar menjadi bottleneck.

---

# PHASE 14 — AI RELIABILITY

AI output tidak boleh dipercaya mentah-mentah.

Buat:

* schema validation
* structured output
* fallback
* timeout
* retry yang aman
* malformed response handling
* token limit
* provider abstraction
* logging

AI-generated question harus divalidasi sebelum disimpan atau diberikan kepada student.

Jika AI menghasilkan:

```text
invalid question
missing answer
invalid options
wrong schema
```

jangan biarkan sistem rusak.

---

# PHASE 15 — OBSERVABILITY

Tambahkan logging yang berguna.

Contoh:

```text
AI request
AI latency
AI provider
AI failure
quiz submission
score calculation
training completion
mastery update
```

Jangan log:

* password
* JWT
* API key
* sensitive information

---

# PHASE 16 — DEMO COMPETITION FLOW

Setelah sistem stabil, buat satu end-to-end scenario yang sangat kuat untuk demo.

Contoh:

```text
Student login
 ↓
Open course
 ↓
Study material
 ↓
Take quiz
 ↓
Make mistakes
 ↓
System detects weak topic
 ↓
AI analyzes performance
 ↓
AI creates personalized training
 ↓
Student completes training
 ↓
Mastery increases
 ↓
Student takes another assessment
 ↓
Performance improves
 ↓
Leaderboard changes
 ↓
Teacher sees class insight
```

Semua data harus berasal dari sistem nyata.

Tidak boleh fake demo logic.

---

# FITUR BARU YANG BOLEH DITAMBAHKAN

Hanya tambahkan fitur baru jika fitur tersebut memperkuat:

### 1. Adaptive Learning

### 2. Learning Analytics

### 3. Competition

### 4. Teacher Intelligence

### 5. Student Motivation

### 6. Learning Feedback Loop

### 7. AI Personalization

Prioritaskan fitur yang dapat menggunakan data yang sudah dimiliki sistem.

Jangan mengejar jumlah fitur.

---

# PRIORITY FRAMEWORK

Setiap kandidat improvement harus diberi:

```text
Impact
Competition Value
Educational Value
Technical Complexity
Risk
```

Gunakan:

```text
P0 = wajib
P1 = sangat disarankan
P2 = nice to have
DROP = jangan dibuat
```

Prioritaskan:

```text
High Impact
+
High Educational Value
+
Reasonable Complexity
```

---

# OUTPUT YANG SAYA INGINKAN DARI KAMU

## STEP 1

Jangan langsung coding.

Audit repository terlebih dahulu.

Kemudian berikan:

### A. Current Architecture Assessment

Apa yang sudah bagus dan apa yang bermasalah.

### B. Feature Gap Analysis

Tampilkan:

| Area | Current State | Problem | Improvement | Priority |
| ---- | ------------- | ------- | ----------- | -------- |

### C. Competition Differentiation

Jawab:

> Apa yang membuat Aksara berbeda dari LMS biasa?

> Apa yang menjadi "wow moment" saat demo?

> Apa fitur yang paling kuat untuk tema Innovating Education Through Technology?

### D. Feature Roadmap

Buat roadmap:

```text
P0 Critical
P1 High Value
P2 Optional
```

### E. Technical Debt

Identifikasi technical debt yang harus dibereskan sebelum menambah fitur.

---

# SETELAH AUDIT

Jangan mengimplementasikan semuanya sekaligus.

Kerjakan secara bertahap.

Untuk setiap fase:

1. Jelaskan tujuan.
2. Jelaskan file yang akan diubah.
3. Jelaskan database change jika ada.
4. Implementasikan backend.
5. Implementasikan frontend hanya jika diperlukan agar fitur dapat digunakan.
6. Jalankan typecheck.
7. Jalankan lint.
8. Jalankan test jika tersedia.
9. Verifikasi API.
10. Verifikasi database.
11. Pastikan tidak merusak fitur sebelumnya.
12. Berikan summary perubahan.

---

# PRINSIP DEVELOPMENT

Gunakan prinsip:

```text
REAL DATA
REAL BUSINESS LOGIC
REAL INTEGRATION
EXPLAINABLE AI
SECURE SERVER-SIDE LOGIC
MEASURABLE LEARNING OUTCOME
```

Hindari:

```text
FAKE DATA
DUMMY LOGIC
SUPERFICIAL AI
GIMMICK FEATURES
UNNECESSARY DEPENDENCIES
PREMATURE UI POLISH
```

---

# HASIL AKHIR YANG DIHARAPKAN

Saya ingin Aksara akhirnya bukan hanya:

> "LMS yang punya AI dan leaderboard."

Tetapi:

> **An intelligent learning ecosystem that continuously observes student performance, identifies learning gaps, provides personalized intervention, measures improvement, and turns learning progress into actionable insight for both students and teachers.**

Fokus sekarang adalah **maksimalisasi fungsi dan kualitas sistem**.

**Jangan mengerjakan redesign visual/UI terlebih dahulu.**

Mulai dari **audit repository aktual**, lalu berikan analisis dan roadmap sebelum melakukan perubahan kode.
