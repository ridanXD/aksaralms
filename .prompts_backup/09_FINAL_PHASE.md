# AKSARA — FULL SYSTEM MAXIMIZATION

Lanjutkan project Aksara dari kondisi codebase saat ini.

Kamu sudah melakukan system & codebase audit dan menemukan beberapa masalah penting, termasuk:

* disconnected mastery loop
* WeakTopic masih terlalu binary
* AI Training belum mengubah mastery
* belum ada pre/post training measurement
* bug individual leaderboard ranking
* kalkulasi maxScore grade yang arbitrer
* teacher intelligence masih dangkal
* belum ada student next-best-action
* AI question generation belum cukup fault-tolerant
* beberapa hardcoded data
* indexing dan query analytics masih dapat ditingkatkan

Sekarang **JANGAN hanya membuat roadmap lagi.**

## LANGSUNG IMPLEMENTASIKAN SEMUANYA.

Saya tidak ingin pengerjaan dibagi menjadi Phase 1, Phase 2, Phase 3, atau menunggu approval saya di antara fitur.

Kerjakan seluruh improvement yang masuk akal secara berurutan berdasarkan dependency dan stabilitas sistem, sampai Aksara berada pada kondisi **competition-ready secara fungsional**.

---

# CORE OBJECTIVE

Aksara bukan sekadar:

> LMS + Quiz + AI

Aksara harus menjadi:

> **intelligent adaptive learning ecosystem yang memahami performa siswa, menemukan learning gap, memberikan intervensi yang personal, mengukur dampaknya, dan mengubah hasil tersebut menjadi insight yang actionable bagi siswa maupun guru.**

Semua fitur harus saling terhubung.

Target learning loop:

```text
LEARN
  ↓
PRACTICE
  ↓
QUIZ
  ↓
PERFORMANCE DATA
  ↓
TOPIC MASTERY
  ↓
WEAKNESS DETECTION
  ↓
AI ANALYSIS
  ↓
PERSONALIZED TRAINING
  ↓
POST-TRAINING ASSESSMENT
  ↓
MASTERY UPDATE
  ↓
MEASURED IMPROVEMENT
  ↓
NEXT BEST ACTION
  ↓
BETTER PERFORMANCE
```

Jangan membuat fitur yang berdiri sendiri.

---

# IMPORTANT DEVELOPMENT RULE

## JANGAN FOKUS PADA DESIGN

Untuk pekerjaan ini:

* jangan redesign UI
* jangan membuat landing page baru
* jangan menghabiskan waktu pada warna
* jangan membuat animasi gimmick
* jangan mengejar visual AI-slop
* jangan melakukan visual polish besar

UI cukup diperbaiki **hanya jika diperlukan agar fitur baru dapat digunakan atau datanya dapat ditampilkan dengan jelas**.

Prioritas utama:

```text
BUSINESS LOGIC
DATABASE
BACKEND
AI
DATA PIPELINE
ANALYTICS
SECURITY
RELIABILITY
PERFORMANCE
INTEGRATION
```

---

# 1. PERBAIKI SEMUA BUG YANG DITEMUKAN AUDIT

Jangan hanya memperbaiki bug yang disebutkan di bawah.

Gunakan audit sebagai starting point, kemudian cari bug serupa di seluruh repository.

Perbaiki:

### Leaderboard

Pastikan ranking dihitung terhadap seluruh participant sebelum user difilter.

Harus benar untuk:

* rank 1
* rank tengah
* rank terakhir
* tied score
* user tanpa result
* quiz dengan participant berbeda

### Grades

Hilangkan arbitrary maxScore.

Pastikan:

```text
Quiz Score
↓
Quiz Result
↓
Grade
↓
Course Grade
```

menggunakan sumber data yang konsisten.

### Hardcoded Data

Cari dan hilangkan data seperti:

```text
quizResults: 0
grades: 0
```

dan seluruh hardcoded business data lain yang seharusnya berasal dari database.

Jangan mengganti hardcoded data dengan dummy data.

Hubungkan ke data sebenarnya.

---

# 2. BANGUN TOPIC MASTERY ENGINE

Ini adalah salah satu fitur terpenting Aksara.

Jangan hanya:

```text
weak = true / false
```

Bangun mastery score per student dan topic.

Minimal memiliki konsep:

```text
masteryScore
confidence
attemptCount
accuracy
recentAccuracy
averageResponseTime
trend
lastPracticedAt
```

Mastery harus dapat berubah berdasarkan performa terbaru.

Contoh:

```text
Algorithms
Mastery: 81
Trend: improving

SQL JOIN
Mastery: 43
Trend: declining

Normalization
Mastery: 67
Trend: stable
```

Gunakan algoritma yang:

* explainable
* deterministic
* mudah dipahami
* tidak membutuhkan ML berat
* konsisten
* dapat dihitung ulang

Jangan membuat algoritma yang terlihat canggih tetapi tidak dapat dijelaskan saat presentasi lomba.

---

# 3. MASTERy HARUS TERINTEGRASI DENGAN QUIZ

Setiap quiz result harus dapat memberikan kontribusi terhadap mastery topic.

Pertimbangkan:

* correctness
* recent performance
* response speed
* number of attempts
* consistency
* difficulty

Jangan biarkan satu jawaban menentukan mastery secara ekstrem.

Gunakan pendekatan weighted / rolling calculation yang stabil.

Pastikan mastery dapat:

```text
naik
turun
stabil
```

dan memiliki trend yang meaningful.

---

# 4. TUTUP AI REMEDIATION LOOP

Ini sangat penting.

Saat siswa menyelesaikan AI Training:

```text
TrainingSession
        ↓
Generated Questions
        ↓
Answers
        ↓
Training Result
        ↓
Performance Evaluation
        ↓
Mastery Update
        ↓
WeakTopic Update
```

Jangan berhenti setelah AI menghasilkan soal.

Sistem harus mengetahui apakah latihan tersebut berhasil.

Contoh:

```text
Before:
SQL JOIN = 42%

Training:
5 adaptive questions

After:
SQL JOIN = 80%

Improvement:
+38 points
```

Simpan data tersebut sehingga dapat ditampilkan dan dianalisis kembali.

---

# 5. PRE-TRAINING VS POST-TRAINING

Buat pengukuran yang jelas.

Minimal:

```text
preTrainingAccuracy
postTrainingAccuracy
improvement
```

Jika memungkinkan:

```text
preMastery
postMastery
masteryDelta
```

Sistem harus dapat menjawab:

> "Apakah intervensi AI berhasil?"

Jika tidak berhasil:

```text
Mastery tidak naik
```

maka sistem harus dapat mengidentifikasi bahwa student masih membutuhkan remedial.

---

# 6. ADAPTIVE QUESTION ENGINE

AI tidak boleh menghasilkan soal secara random.

Gunakan context:

```text
student
course
topic
mastery
weakness
previous mistakes
difficulty
previous questions
training history
```

Contoh:

Student:

```text
SQL JOIN
Mastery: 35
Repeated error:
confuses LEFT JOIN and INNER JOIN
```

Maka AI harus diarahkan untuk memberikan latihan yang relevan dengan kesalahan tersebut.

Training dapat bergerak:

```text
concept
↓
easy application
↓
normal problem
↓
scenario
↓
harder application
↓
assessment
```

Jika mastery sudah tinggi, tingkatkan difficulty.

Jika rendah, berikan remedial yang lebih fundamental.

---

# 7. PREVENT QUESTION REPETITION

AI jangan terus menghasilkan soal yang sama.

Simpan atau gunakan history untuk mencegah:

* duplicate questions
* duplicate answer pattern
* repeated scenario
* repeated wording

Jika database sudah menyimpan generated questions, manfaatkan data tersebut.

---

# 8. AI OUTPUT VALIDATION

Jangan percaya raw AI response.

Implementasikan structured validation.

Gunakan schema validation yang sesuai dengan architecture existing, misalnya Zod jika cocok dengan codebase.

Validasi:

* question
* options
* correct answer
* explanation
* topic
* difficulty
* metadata yang diperlukan

Jika AI:

```text
timeout
invalid JSON
missing field
wrong schema
empty response
```

jangan membuat aplikasi crash.

Buat fallback yang aman.

Fallback boleh deterministic/template-based selama tetap valid secara pedagogis.

---

# 9. AI PROVIDER RESILIENCE

Provider abstraction yang sudah ada harus benar-benar berguna.

Jika provider utama gagal:

```text
Provider A
↓
failure
↓
Provider B
```

jika architecture memungkinkan.

Pastikan:

* timeout
* retry terbatas
* error handling
* provider fallback
* logging
* API key tetap server-side

Jangan menyebabkan request menggantung tanpa batas.

---

# 10. STUDENT LEARNING PROFILE

Bangun learning profile berdasarkan data nyata.

Profile harus dapat mencerminkan:

```text
overall mastery
strong topics
weak topics
improving topics
declining topics
quiz performance
training performance
assignment performance
attendance
learning consistency
```

Jangan membuat personality profiling yang tidak memiliki dasar data.

Fokus pada learning performance.

---

# 11. NEXT BEST ACTION ENGINE

Ini salah satu fitur yang akan membuat Aksara terasa intelligent.

Sistem harus dapat menentukan:

> "Apa tindakan paling berguna yang harus dilakukan student sekarang?"

Contoh:

```text
Priority:
Practice SQL JOIN

Reason:
Mastery 42%

Recommended:
5 adaptive questions

Related material:
SQL JOIN Fundamentals

Deadline:
Assignment due tomorrow
```

Prioritas dapat mempertimbangkan:

```text
weakness
mastery
deadline
recent decline
unfinished material
training history
```

Jangan hanya menampilkan daftar menu.

Berikan rekomendasi yang benar-benar kontekstual.

---

# 12. STUDENT DASHBOARD DATA

Pastikan dashboard siswa dapat mengambil insight dari engine tadi.

Contoh data yang berguna:

```text
Overall Mastery
Weakest Topic
Improving Topic
Current Streak
Recent Performance
Recommended Action
Training Improvement
Upcoming Deadline
```

Tidak perlu redesign besar.

Yang penting data benar-benar berasal dari backend.

---

# 13. TEACHER INTELLIGENCE

Guru harus mendapatkan manfaat dari seluruh data yang dikumpulkan Aksara.

Bangun teacher analytics yang actionable.

Minimal:

```text
Class Mastery
Topic Difficulty
At-Risk Students
Improving Students
Declining Students
Quiz Performance
Assignment Performance
Attendance
```

Guru harus bisa mengetahui:

> "Topik apa yang paling sulit bagi kelas?"

dan:

> "Siswa mana yang membutuhkan intervensi?"

---

# 14. AT-RISK DETECTION

Buat detection yang explainable.

Jangan hanya:

```text
atRisk = true
```

Simpan alasan.

Contoh:

```text
AT RISK

Reasons:
- mastery declining
- quiz accuracy < threshold
- assignment completion low
- attendance declining
```

Gunakan beberapa sinyal, bukan satu angka saja.

---

# 15. TEACHER INTERVENTION RECOMMENDATION

Jangan berhenti pada:

```text
Student A is at risk.
```

Berikan:

```text
Recommended Intervention:

Student:
A

Problem:
SQL JOIN mastery 38%

Recommended:
Assign SQL JOIN Fundamentals
+ 5 adaptive practice questions
```

Dengan begitu Aksara membantu guru mengambil keputusan.

---

# 16. CLASS MASTERY

Guru harus dapat melihat distribusi mastery per topic.

Contoh:

```text
Topic              Mastery

Algorithms         78%
OOP                72%
Database           61%
Normalization      44%
SQL JOIN           39%
```

Gunakan data nyata.

Jika tidak ada cukup data, jangan membuat angka palsu.

---

# 17. COMPETITIVE QUIZ IMPROVEMENT

Pertahankan konsep:

```text
accuracy
speed bonus
streak
score
leaderboard
```

Tetapi tambahkan meaningful personal metrics.

Contoh:

```text
Personal Best
Best Streak
Fastest Response
Accuracy
Improvement
Rank Change
```

Tujuannya:

Siswa yang tidak menjadi rank #1 tetap memiliki motivasi.

---

# 18. LEADERBOARD ANALYTICS

Leaderboard jangan hanya:

```text
Rank
Name
Score
```

Jika data tersedia, tambahkan:

```text
Accuracy
Average Response
Streak
Rank Change
```

Tetap jaga leaderboard sebagai kompetisi edukatif, bukan perjudian/gambling mechanic.

Tidak perlu membuat currency, taruhan, atau mekanisme random reward.

---

# 19. LEARNING PROGRESS HISTORY

Pastikan sistem dapat melihat perkembangan siswa dari waktu ke waktu.

Minimal:

```text
Date
Quiz
Topic
Accuracy
Mastery
Training
Improvement
```

Tujuannya agar Aksara dapat membuktikan:

```text
student performance before
        ↓
intervention
        ↓
student performance after
```

---

# 20. CORRELATION / INSIGHT YANG MASUK AKAL

Jika datanya cukup, cari insight sederhana seperti:

```text
attendance
vs
performance
```

atau:

```text
training completion
vs
mastery improvement
```

Tetapi hati-hati.

Jangan menyatakan causal relationship hanya karena ada correlation.

Gunakan wording seperti:

```text
observed relationship
```

bukan:

```text
attendance caused higher scores
```

---

# 21. SECURITY AUDIT

Audit seluruh backend.

Terutama:

### Authentication

* JWT validation
* expiration
* password hashing

### Authorization

Pastikan:

```text
STUDENT
```

tidak dapat mengakses resource teacher.

Pastikan teacher hanya dapat mengakses course/data yang memang menjadi kewenangannya.

### IDOR

Test endpoint menggunakan ID milik user lain.

### Quiz Manipulation

Student tidak boleh memanipulasi:

```text
score
correct answer
response time
streak
rank
```

dari frontend.

### AI

Jangan expose:

```text
API KEY
system prompt sensitif
provider credentials
```

---

# 22. INPUT VALIDATION

Audit semua endpoint.

Pastikan request validation dilakukan server-side.

Handle:

* missing field
* invalid type
* invalid ID
* invalid enum
* invalid date
* negative score
* impossible values
* oversized input

Jangan percaya frontend validation.

---

# 23. DATABASE INTEGRITY

Audit Prisma schema.

Cari:

* missing indexes
* missing unique constraints
* unnecessary nullable fields
* relation inconsistency
* orphan records
* cascade issue

Tambahkan index hanya jika memang mendukung query nyata.

Prioritaskan query:

```text
QuizAnswer
QuizSession
QuizResult
WeakTopic
TrainingSession
GeneratedQuestion
Progress
Grade
```

---

# 24. PERFORMANCE

Cari:

* N+1 queries
* repeated queries
* unnecessary joins
* expensive leaderboard queries
* expensive teacher analytics
* unnecessary AI calls
* repeated Prisma calls

Gunakan:

* select
* include secara tepat
* aggregation
* pagination
* indexing
* caching jika memang diperlukan

Jangan melakukan optimization yang tidak memiliki alasan.

---

# 25. ERROR HANDLING

Semua critical flow harus memiliki error handling yang konsisten.

Terutama:

```text
quiz submission
grade calculation
AI training
AI generation
attendance
assignment submission
mastery calculation
leaderboard
teacher analytics
```

Frontend harus menerima error yang meaningful.

Backend jangan mengembalikan stack trace kepada user.

---

# 26. OBSERVABILITY

Tambahkan logging yang berguna untuk debugging.

Log event penting seperti:

```text
quiz submitted
score calculated
mastery updated
AI request
AI provider failure
training completed
recommendation generated
```

Jangan pernah log:

```text
password
JWT
API key
sensitive credentials
```

---

# 27. SEED DATA

Perbaiki seed agar demo dapat menunjukkan seluruh intelligence system.

Buat data yang realistis dan konsisten untuk:

* teacher
* multiple students
* courses
* modules
* materials
* quiz
* quiz questions
* quiz answers
* different performance levels
* weak topics
* training sessions
* assignments
* grades
* attendance

Seed harus dapat menghasilkan scenario seperti:

```text
Student A
strong

Student B
average

Student C
weak in Database

Student D
improving after AI training
```

Jangan hardcode hasil analytics.

Biarkan analytics engine menghitung data tersebut.

---

# 28. DEMO SCENARIO HARUS TERBENTUK SECARA NATURAL

Setelah seluruh implementation selesai, pastikan codebase dapat menghasilkan demo seperti ini:

```text
STUDENT
  ↓
belajar materi
  ↓
mengikuti quiz
  ↓
mendapat hasil buruk pada topic tertentu
  ↓
system mendeteksi weak topic
  ↓
mastery turun / tetap rendah
  ↓
AI menganalisis
  ↓
AI membuat personalized training
  ↓
student menyelesaikan training
  ↓
post-training evaluation
  ↓
mastery meningkat
  ↓
improvement tercatat
  ↓
recommendation berubah
  ↓
teacher analytics ikut berubah
```

Ini harus terjadi karena business logic nyata.

Bukan demo palsu.

---

# 29. DATA FLOW HARUS KONSISTEN

Audit seluruh hubungan:

```text
User
 ↓
Course
 ↓
Module
 ↓
Material
 ↓
Progress
 ↓
Quiz
 ↓
QuizSession
 ↓
QuizAnswer
 ↓
QuizResult
 ↓
WeakTopic
 ↓
AI Analysis
 ↓
TrainingSession
 ↓
GeneratedQuestion
 ↓
TrainingAnswer / Result
 ↓
Mastery
 ↓
Recommendation
 ↓
Teacher Analytics
```

Jika ada bagian yang belum terhubung, hubungkan.

---

# 30. JANGAN MEMBUAT REDUNDANT SYSTEM

Jika codebase sudah memiliki:

```text
WeakTopic
AIPerformanceAnalysis
TrainingSession
```

jangan otomatis membuat:

```text
WeakTopicV2
MasteryV2
AIAnalysisV2
```

Gunakan model existing jika dapat diperluas dengan aman.

Database migration harus tetap maintainable.

---

# 31. BACKWARD COMPATIBILITY

Pastikan perubahan tidak merusak:

* authentication
* course
* quiz
* attendance
* assignment
* grades
* teacher
* student
* existing API contract

Jika API perlu berubah, update seluruh consumer yang terdampak.

Jangan meninggalkan broken endpoint.

---

# 32. TESTING

Setelah implementasi:

jalankan seluruh validation yang tersedia.

Minimal:

```text
TypeScript typecheck
Lint
Build
Tests
Prisma validation
```

Jika test belum tersedia untuk critical business logic, buat test untuk:

```text
ranking
score calculation
mastery calculation
weak topic detection
training evaluation
grade calculation
recommendation
at-risk detection
authorization
```

Test edge cases.

---

# 33. SELF-REVIEW

Setelah semua perubahan selesai, jangan berhenti hanya karena build berhasil.

Review kembali:

### Functional

Apakah semua feature benar-benar bekerja?

### Data

Apakah data benar-benar berasal dari database?

### Integration

Apakah fitur saling terhubung?

### Security

Apakah student bisa memanipulasi data?

### AI

Apakah AI failure dapat ditangani?

### Performance

Apakah query masuk akal?

### Competition

Apakah ada sesuatu yang benar-benar membedakan Aksara dari LMS biasa?

---

# 34. COMPETITION VALUE

Saat membuat keputusan engineering, prioritaskan fitur yang memperkuat tiga hal:

## PERSONALIZATION

Sistem memahami siswa secara individual.

## ADAPTATION

Sistem menyesuaikan latihan berdasarkan performa.

## MEASUREMENT

Sistem membuktikan apakah intervensi berhasil.

Formula utama Aksara:

```text
UNDERSTAND
+
ADAPT
+
MEASURE
```

---

# 35. JANGAN OVERENGINEER

Jangan membuat:

* machine learning kompleks
* microservices
* event-driven architecture besar
* vector database hanya karena AI
* websocket jika polling cukup
* dependency besar tanpa alasan
* fitur sosial yang tidak relevan
* gamification berlebihan

Aksara harus tetap:

```text
simple
reliable
explainable
maintainable
demoable
```

---

# 36. AUTONOMOUS EXECUTION

Ini penting:

**Jangan berhenti setelah menemukan masalah.**

Jika kamu menemukan:

```text
bug
missing relation
missing endpoint
missing field
broken integration
poor validation
weak architecture
```

dan solusinya jelas serta berada dalam scope project:

**langsung perbaiki.**

Jika perubahan database diperlukan:

* update Prisma schema
* migration
* seed
* backend
* frontend consumer

secara konsisten.

Jika satu perubahan menyebabkan bagian lain rusak:

**trace dependency dan perbaiki juga.**

Jangan meninggalkan TODO hanya karena masalah tersebut ditemukan di tengah pengerjaan.

---

# 37. DEFINITION OF DONE

Pekerjaan dianggap selesai hanya jika:

```text
[✓] Existing features still work
[✓] Leaderboard ranking correct
[✓] Grade calculation correct
[✓] Topic mastery exists
[✓] Mastery updates from real performance
[✓] Weak topics are meaningful
[✓] AI training uses student context
[✓] AI training has measurable outcome
[✓] Pre/post performance can be compared
[✓] Mastery changes after training
[✓] Recommendations use real student data
[✓] Teacher gets actionable insights
[✓] At-risk detection has explainable reasons
[✓] AI failures are handled
[✓] Critical inputs are validated
[✓] Authorization is enforced
[✓] Quiz scoring cannot be manipulated client-side
[✓] Database queries are reasonable
[✓] Critical business logic is tested
[✓] Build succeeds
[✓] No obvious hardcoded business data remains
[✓] Seed data supports realistic demonstration
[✓] End-to-end learning loop works
```

---

# FINAL COMPETITION TARGET

Saya ingin hasil akhirnya membuat juri dapat melihat:

```text
Student fails
      ↓
Aksara understands WHY
      ↓
AI creates intervention
      ↓
Student trains
      ↓
Aksara measures improvement
      ↓
Mastery changes
      ↓
Recommendation changes
      ↓
Teacher receives insight
```

Itulah inti inovasi Aksara.

Bukan sekadar:

> "Kami menggunakan AI."

Tetapi:

> **"Aksara menggunakan AI dan data pembelajaran untuk mendeteksi kesenjangan pemahaman, memberikan intervensi adaptif, dan membuktikan dampaknya terhadap perkembangan siswa."**

---

# EXECUTION INSTRUCTION

**Mulai sekarang.**

Jangan membuat roadmap baru.

Jangan membagi pekerjaan menjadi fase yang membutuhkan approval.

Jangan meminta saya memilih fitur.

Jangan berhenti setelah satu bug diperbaiki.

Baca codebase aktual, implementasikan seluruh improvement yang relevan, test, debug, integrasikan, dan teruskan sampai seluruh sistem berada pada kondisi competition-ready secara fungsional.

**UI/design bukan prioritas sekarang.**

Fokus penuh pada:

```text
FUNCTIONALITY
+
INTELLIGENCE
+
INTEGRATION
+
RELIABILITY
+
SECURITY
+
MEASURABLE LEARNING OUTCOME
```

Jika ada keputusan teknis yang tidak eksplisit di prompt ini, pilih solusi yang paling sederhana, robust, maintainable, dan konsisten dengan architecture Aksara yang sudah ada.
