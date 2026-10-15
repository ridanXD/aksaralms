Backend Aksara sudah FINAL, VERIFIED, dan LOCKED.

JANGAN mengubah backend, database schema, API contract, intelligence engine, mastery algorithm, quiz scoring, leaderboard logic, AI training logic, Teacher Intelligence, atau business logic yang sudah berjalan.

Sekarang fokus sepenuhnya pada FRONTEND UI/UX Aksara.

Tujuan utama:

Buat Aksara terlihat seperti produk EdTech modern yang benar-benar siap dipresentasikan dalam kompetisi teknologi, bukan template LMS biasa dan bukan dashboard yang terlihat seperti hasil generator AI.

Gunakan data dan endpoint yang SUDAH ADA.

Jangan membuat fake data hanya untuk mempercantik UI.

==================================================
PRODUCT IDENTITY
================

Nama produk:

AKSARA

Positioning:

Adaptive Learning Platform yang menghubungkan:

Learning
→ Assessment
→ Diagnosis
→ AI Remediation
→ Improvement
→ Mastery
→ Next Best Action

Aksara bukan sekadar LMS.

Jangan membuat UI yang hanya menonjolkan:

* daftar course
* daftar tugas
* daftar quiz
* tabel nilai

Hal tersebut tetap diperlukan, tetapi bukan selling point utama.

Selling point utama adalah:

"Aksara memahami di mana siswa kesulitan, memberikan latihan yang sesuai, mengukur perubahan kemampuan, lalu menyesuaikan pembelajaran berikutnya."

UI harus membuat konsep tersebut terlihat secara visual.

==================================================
DESIGN DIRECTION
================

Gunakan visual direction:

* modern
* professional
* academic
* clean
* confident
* human
* technology-driven
* premium tetapi tetap believable sebagai produk mahasiswa/kompetisi
* responsive
* mobile-first

HINDARI:

* tampilan AI-generated yang terlalu dekoratif
* glassmorphism berlebihan
* gradient berlebihan
* floating pill UI di mana-mana
* terlalu banyak card
* dashboard penuh angka tanpa hierarchy
* neon cyberpunk
* ilustrasi AI generik
* robot AI
* brain icon generik
* excessive shadows
* excessive rounded corners
* dashboard yang terlihat seperti template SaaS

Jangan membuat semua elemen menjadi card.

Gunakan whitespace, typography, hierarchy, sectioning, subtle borders, dan layout yang kuat.

Prioritaskan readability.

==================================================
DESIGN SYSTEM
=============

Buat satu design system konsisten untuk seluruh aplikasi.

Tentukan:

* typography hierarchy
* font sizes
* font weights
* spacing system
* border radius
* shadows
* button styles
* input styles
* navigation
* badges
* progress indicators
* charts
* tables
* empty states
* loading states
* error states

Gunakan font yang modern dan readable.

Pastikan typography terasa seperti produk pendidikan profesional, bukan landing page startup crypto.

Gunakan warna secara intentional.

Tetapkan:

* primary
* secondary
* background
* surface
* text
* muted
* success
* warning
* danger
* mastery/improvement states

Jangan menggunakan warna hanya sebagai dekorasi.

Warna harus memiliki semantic meaning.

==================================================
LAYOUT GLOBAL
=============

Buat application shell yang konsisten.

Desktop:

* sidebar/navigation yang clean
* content area yang luas
* header minimal
* responsive collapse

Mobile:

* jangan menggunakan desktop sidebar yang dipaksa mengecil
* gunakan mobile navigation yang proper
* touch target cukup besar
* hierarchy tetap jelas

Navigation harus membedakan:

STUDENT

* Dashboard
* Courses
* Quiz
* AI Training
* Grades
* Learning History
* Profile

TEACHER

* Dashboard
* Courses
* Attendance
* Assignments
* Grades
* Class Intelligence

Jangan menampilkan navigation yang tidak relevan terhadap role.

==================================================
STUDENT DASHBOARD
=================

Dashboard adalah halaman PALING PENTING.

Jangan membuat dashboard LMS generik.

Hero area harus langsung menjawab:

"Bagaimana kondisi belajar saya sekarang?"

Tampilkan:

* overall mastery
* improvement/trend
* current priority
* next best action

Contoh konsep:

YOUR LEARNING STATUS

Mastery
69%

Trend
Improving

Priority
Database

Reason:

"Your recent accuracy in Database is below your current mastery."

CTA utama:

"Practice Database"

Jangan mengarang angka.

Gunakan data API aktual.

==================================================
NEXT BEST ACTION
================

Next Best Action harus menjadi salah satu focal point dashboard.

Buat section yang terasa actionable.

Contoh hierarchy:

WHAT SHOULD YOU DO NEXT?

[ Practice Database ]

"Your weakest topic needs reinforcement."

[Start Training →]

Jika recommendation API memberikan assignment:

[ Complete Assignment ]

Jika recommendation:

continue learning:

[ Continue Learning ]

UI harus berubah berdasarkan response backend.

Jangan hardcode satu recommendation.

==================================================
MASTERY VISUALIZATION
=====================

Buat visualisasi mastery yang mudah dipahami.

Jangan membuat dashboard penuh chart.

Pilih visualisasi yang paling informatif.

Contoh:

Topic Mastery

Database       42%
Algorithms     76%
OOP            81%
Testing        64%

Gunakan progress visualization yang clean.

Tambahkan trend indicator:

↑ Improving
→ Stable
↓ Declining

Pastikan semantic color digunakan konsisten.

==================================================
WEAK TOPICS
===========

Buat section:

AREAS TO IMPROVE

Tampilkan weak topics dari data nyata.

Setiap topic harus menjawab:

* topic
* mastery
* accuracy
* trend
* recommended action

Jangan sekadar:

Database — 42%

Lebih berguna:

Database
42% mastery
Recent accuracy 35%
Declining

[Practice]

==================================================
THE WOW MOMENT
==============

Aksara memiliki fitur paling penting:

Closed-Loop Adaptive Remediation.

UI harus secara eksplisit memperlihatkan perjalanan:

WEAKNESS DETECTED
↓
AI TRAINING
↓
PRACTICE
↓
IMPROVEMENT
↓
MASTERY UPDATED

Buat halaman/section khusus yang memvisualisasikan learning journey.

Contoh:

DATABASE

Before Training
36%

Training
AI Remedial Session

After Training
68%

+32 percentage points

IMPROVING

Weak Topic
RESOLVED / STILL NEEDS PRACTICE

Jangan menggunakan data contoh jika data API tersedia.

Ini adalah salah satu visual utama yang harus bisa ditunjukkan ketika demo.

==================================================
AI TRAINING PAGE
================

AI Training bukan chatbot.

Jangan membuat UI seperti ChatGPT clone.

Struktur:

1. Training objective

"Improve your understanding of Database Normalization."

2. Why this training?

"Your recent quiz performance indicates difficulty with this topic."

3. Concept explanation

4. Adaptive practice

5. Progress

6. Result

7. Improvement

Tampilkan:

Baseline
→ Training
→ Post-training
→ Improvement

Jika training selesai:

"Your mastery improved from X to Y."

Jangan menggunakan wording berlebihan seperti:

"AI thinks you're amazing!"

Gunakan bahasa akademik dan credible.

==================================================
QUIZ EXPERIENCE
===============

Quiz harus terasa focused.

Jangan membuat layar seperti form biasa.

Tampilkan:

* question
* progress
* timer jika memang tersedia
* answer choices
* submit
* feedback sesuai API

Pastikan user tidak bisa salah memahami status:

Answered
Correct
Incorrect
Remaining

Jika scoring menggunakan speed/accuracy:

tampilkan secara understandable.

Jangan terlalu mengekspos formula teknis scoring.

==================================================
QUIZ RESULT
===========

Setelah quiz:

Tampilkan:

Score
Accuracy
Performance
Weak Topics
Rank
Improvement

Yang paling penting:

WHAT SHOULD YOU DO NEXT?

Hubungkan hasil quiz dengan Next Best Action.

Contoh:

"We identified Database as an area that needs reinforcement."

[Train This Topic]

Jadi quiz tidak menjadi dead-end.

==================================================
LEADERBOARD
===========

Leaderboard harus tetap competitive tetapi educational.

Tampilkan:

* rank
* score
* accuracy
* personal best
* improvement jika tersedia

Highlight user sendiri.

Jangan membuat leaderboard terasa seperti gambling atau casino.

Jangan menggunakan animasi berlebihan.

==================================================
COURSE PAGE
===========

Course page harus memiliki hierarchy:

Course overview
→ Progress
→ Modules
→ Materials
→ Assessment
→ Assignments

Tampilkan progress secara meaningful.

Contoh:

Course Progress
72%

Module 1
Completed

Module 2
In Progress

Module 3
Locked / Upcoming jika memang datanya demikian

Jangan membuat semua module menjadi card besar.

==================================================
LEARNING MATERIAL
=================

Prioritaskan reading experience.

Jangan membuat materi terlihat seperti dashboard.

Gunakan:

* readable line length
* typography hierarchy
* headings
* sections
* progress
* navigation

CTA:

Continue
Mark Complete
Next Material

==================================================
ASSIGNMENTS
===========

Student:

* upcoming
* due date
* submission status
* score
* feedback

Teacher:

* assignment overview
* submissions
* grading
* feedback

Gunakan status yang jelas.

==================================================
GRADES
======

Jangan hanya membuat tabel nilai.

Berikan context:

Course Performance
Quiz
Assignments
Overall

Jika backend menyediakan data:

tampilkan performance trend.

Pastikan angka berasal dari backend.

==================================================
LEARNING HISTORY
================

Buat halaman yang menunjukkan progression.

User harus bisa melihat:

* quiz attempts
* training sessions
* mastery changes
* weak topic resolution
* improvement

Tujuannya membuat Aksara terasa seperti sistem yang memahami perjalanan belajar siswa.

==================================================
TEACHER DASHBOARD
=================

Teacher Dashboard harus berbeda secara fundamental dari Student Dashboard.

Pertanyaan utama:

"Bagaimana kondisi kelas saya?"

Tampilkan:

Class Mastery

Top Difficult Topics

At-Risk Students

Improving Students

Declining Students

Recent Activity

Jangan hanya membuat KPI cards.

==================================================
TEACHER INTELLIGENCE
====================

Ini adalah halaman kedua PALING PENTING setelah Student Dashboard.

Buat section:

CLASS LEARNING HEALTH

Contoh:

Overall Mastery

Most Difficult Topic
Normalisasi

67% students struggling

Then:

AT-RISK STUDENTS

Untuk setiap siswa:

Name
Risk level
Reason
Recommended intervention

Contoh:

Low mastery
Declining accuracy
Repeated failures

Recommended:

"Assign targeted remediation on Normalisasi."

Pastikan seluruh data berasal dari Teacher Intelligence API.

==================================================
CLASS TOPIC ANALYTICS
=====================

Visualisasikan:

Topic
Class mastery
Struggling percentage
Trend

Tujuannya membantu guru memahami:

"Materi apa yang perlu saya ajarkan kembali?"

Bukan sekadar:

"Siapa yang nilainya jelek?"

==================================================
AT-RISK STUDENTS
================

Jangan menggunakan tabel kompleks sebagai satu-satunya UI.

Buat diagnosis mudah dibaca.

Contoh:

Rizky
At Risk

Why:

* Low mastery
* Declining quiz accuracy
* Missing assignment

Recommended:
Targeted Database remediation

CTA:

View Student

Pastikan diagnosis berasal dari backend.

==================================================
TEACHER STUDENT DETAIL
======================

Jika endpoint/data tersedia, buat detail siswa:

* mastery
* strongest topics
* weakest topics
* recent performance
* assignments
* attendance
* quiz performance
* training history
* intervention recommendation

Tujuan:

Guru dapat memahami siswa tanpa membuka banyak halaman.

==================================================
EMPTY / LOADING / ERROR STATES
==============================

Ini WAJIB.

Untuk semua halaman:

Loading
→ skeleton yang sesuai layout

Empty
→ informative empty state

Error
→ clear error message + retry

Jangan menampilkan:

NaN
undefined
null
0% jika sebenarnya belum ada data

Jika user baru:

"Your learning profile will appear as you complete your first activities."

Bukan fake data.

==================================================
RESPONSIVE QUALITY
==================

Test seluruh halaman:

320px
375px
390px
768px
1024px
1280px
1440px+

Pastikan:

* tidak horizontal overflow
* table dapat di-scroll jika diperlukan
* charts tidak rusak
* navigation tidak overlap
* modal tidak keluar viewport
* buttons tidak terlalu kecil
* typography tidak pecah
* cards tidak menjadi terlalu sempit

==================================================
ACCESSIBILITY
=============

Implementasikan:

* semantic HTML
* proper labels
* keyboard navigation
* focus states
* sufficient contrast
* aria-label bila diperlukan
* button bukan div clickable
* links bukan fake buttons

Jangan mengorbankan accessibility demi visual.

==================================================
MOTION
======

Gunakan animation hanya jika memberikan feedback.

Contoh:

* progress transition
* page transition ringan
* mastery improvement animation
* success state

Jangan menggunakan:

* excessive bouncing
* particle effects
* animated gradients
* gimmicky AI animations

Motion harus subtle dan professional.

==================================================
DATA INTEGRITY
==============

Ini sangat penting:

JANGAN membuat mock data untuk UI.

Gunakan API existing.

Jika API mengembalikan:

mastery = 68

UI harus menampilkan 68.

Jika weak topic resolved:

UI harus menunjukkan resolved.

Jika recommendation berubah:

UI harus berubah.

Jangan membuat frontend yang terlihat bagus tetapi tidak merepresentasikan backend.

==================================================
CODE QUALITY
============

Pertahankan:

Next.js App Router
TypeScript
Tailwind CSS

Gunakan reusable components.

Hindari duplicate UI logic.

Buat component yang reusable untuk:

* Button
* Badge
* Progress
* Stat
* Topic mastery
* Status
* Empty state
* Error state
* Skeleton
* Chart
* Data table

Tetapi jangan membuat component abstraction berlebihan.

==================================================
FINAL UI QUALITY CHECK
======================

Setelah implementasi:

Jalankan frontend production build.

Periksa seluruh route.

Periksa browser console.

Cari:

* hydration errors
* React warnings
* missing keys
* failed requests
* broken images
* undefined values
* layout overflow

Periksa semua role:

STUDENT
TEACHER

Pastikan route protection tetap berjalan.

==================================================
MOST IMPORTANT RULE
===================

JANGAN membuat Aksara terlihat seperti:

"Moodle dengan warna baru."

JANGAN membuat Aksara terlihat seperti:

"ChatGPT + LMS."

Buat Aksara terlihat seperti:

ADAPTIVE LEARNING SYSTEM

yang kebetulan memiliki LMS, quiz, AI training, grades, attendance, dan teacher analytics.

Visual hierarchy harus selalu mengarahkan user ke:

UNDERSTAND
→ PRACTICE
→ MEASURE
→ IMPROVE

Dan untuk guru:

OBSERVE
→ DIAGNOSE
→ INTERVENE
→ MEASURE

==================================================
FINAL DELIVERABLE
=================

Implementasikan seluruh UI/UX secara langsung di codebase.

Jangan hanya membuat mockup.

Jangan hanya membuat design proposal.

Jangan berhenti setelah satu halaman.

Implementasikan seluruh student dan teacher experience menggunakan API nyata yang sudah tersedia.

Setelah selesai:

* run build
* fix errors
* inspect all routes
* verify responsive behavior
* verify student flow
* verify teacher flow
* verify API integration
* verify empty/loading/error states

Kemudian berikan report:

1. halaman yang dibuat/diubah
2. reusable components yang dibuat
3. design system yang digunakan
4. API yang diintegrasikan
5. responsive verification
6. accessibility verification
7. build result
8. remaining issues jika ada

Jangan mengubah backend.

Jangan menambah business logic baru kecuali benar-benar diperlukan untuk presentation layer.

Fokus: membuat intelligence Aksara terlihat, terasa, dan mudah dipahami oleh user serta juri.
