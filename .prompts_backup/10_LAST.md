Lanjutkan langsung dari implementasi yang baru saja kamu kerjakan.

JANGAN membuat roadmap baru dan JANGAN membagi pekerjaan menjadi fase.

Anggap pekerjaan sebelumnya sebagai baseline baru Aksara.

Sekarang lakukan **deep verification + optimization + completion** terhadap seluruh sistem.

Tujuannya bukan sekadar memastikan file dan endpoint sudah dibuat, tetapi memastikan seluruh intelligence system benar-benar bekerja secara end-to-end dengan data nyata.

---

# 1. VERIFY TOPIC MASTERY END-TO-END

Audit implementasi `TopicMastery`.

Pastikan lifecycle-nya benar:

```text
Student
 ↓
Quiz
 ↓
QuizAnswer
 ↓
QuizResult
 ↓
Topic Performance
 ↓
TopicMastery
```

Kemudian:

```text
TopicMastery
 ↓
AI Analysis
 ↓
Training
 ↓
Post Training Evaluation
 ↓
TopicMastery Update
```

Pastikan tidak ada kondisi di mana:

* quiz selesai tetapi mastery tidak berubah
* training selesai tetapi mastery tidak berubah
* mastery berubah tetapi WeakTopic tidak ikut menyesuaikan
* mastery dibuat duplicate untuk topic yang sama
* mastery menggunakan data student lain
* mastery menggunakan data course yang salah

Pastikan uniqueness dan relation antar:

```text
student
course
topic
```

benar.

Jika schema saat ini memungkinkan duplicate TopicMastery untuk student + course + topic, perbaiki.

---

# 2. REVIEW MASTERY ALGORITHM

Review `mastery.service.ts` secara kritis.

Pastikan algoritmanya:

* deterministic
* explainable
* bounded 0–100
* tidak menghasilkan NaN
* tidak menghasilkan negative value
* tidak tiba-tiba melonjak ekstrem
* tidak terlalu bergantung pada satu quiz
* tetap memperhatikan recent performance

Review penggunaan:

```text
accuracy
recentAccuracy
speed factor
trend
confidence
```

Pastikan setiap variabel benar-benar memiliki fungsi.

Jangan mempertahankan metric hanya karena sudah dibuat.

Jika ada formula yang arbitrer atau tidak masuk akal, perbaiki.

Namun jangan membuat algoritma machine learning kompleks.

Aksara harus dapat menjelaskan algoritma mastery kepada juri secara sederhana.

---

# 3. MASTERy MUST BE MEANINGFUL

Pastikan contoh seperti ini masuk akal:

```text
Student:
SQL JOIN

Previous:
42%

After several correct attempts:
55%

After successful adaptive training:
74%

After repeated mastery:
86%
```

Dan jika performa memburuk:

```text
86%
↓
72%
```

harus mungkin terjadi.

Mastery bukan achievement permanen yang hanya bisa naik.

---

# 4. WEAKTOPIC SYNCHRONIZATION

Audit hubungan:

```text
TopicMastery
↔
WeakTopic
```

Pastikan WeakTopic tidak menjadi sumber kebenaran terpisah yang menghasilkan data contradictory.

Contoh:

```text
TopicMastery = 87
WeakTopic = active
```

harus memiliki alasan yang jelas atau tidak boleh terjadi.

Buat synchronization rule yang konsisten.

Jika mastery sudah melewati threshold tertentu:

```text
WeakTopic
→ resolved
```

Jika mastery kembali turun:

```text
WeakTopic
→ active
```

Jangan meninggalkan weak topic lama yang sudah tidak relevan.

---

# 5. CLOSED REMEDIATION LOOP

Ini harus menjadi salah satu fitur paling kuat Aksara.

Verifikasi alur:

```text
QUIZ
 ↓
WEAK TOPIC
 ↓
PRE TRAINING PERFORMANCE
 ↓
AI TRAINING
 ↓
POST TRAINING PERFORMANCE
 ↓
IMPROVEMENT DELTA
 ↓
TOPIC MASTERY UPDATE
 ↓
WEAK TOPIC UPDATE
 ↓
RECOMMENDATION UPDATE
```

Semua harus menggunakan database aktual.

Tidak boleh ada angka yang hanya dihitung frontend.

---

# 6. IMPROVEMENT DELTA

Review:

```text
preAccuracy
postAccuracy
improvementDelta
```

Pastikan definisinya konsisten.

Contoh:

```text
pre = 40
post = 75

delta = +35 percentage points
```

Jangan salah menginterpretasikan menjadi:

```text
87.5% improvement
```

kecuali memang metric yang dimaksud adalah relative improvement.

Gunakan terminology yang jelas agar mudah dijelaskan saat presentasi.

---

# 7. AI TRAINING QUALITY

Audit prompt AI.

AI harus mendapatkan context yang relevan:

```text
topic
mastery
weakness
previous performance
difficulty
previous questions
student mistakes
```

Jangan hanya mengirim:

```text
Generate 5 questions about SQL.
```

Jika context tersedia di database, gunakan.

---

# 8. ADAPTIVE DIFFICULTY

Pastikan difficulty benar-benar adaptive.

Contoh:

```text
Mastery < 40
→ foundational

40–60
→ basic application

60–80
→ intermediate

80+
→ advanced
```

Tidak harus memakai threshold persis seperti contoh.

Yang penting terdapat hubungan nyata:

```text
student performance
→ difficulty
```

Jika student gagal terus:

```text
difficulty ↓
```

Jika student konsisten berhasil:

```text
difficulty ↑
```

---

# 9. AI QUESTION VALIDATION

Review `ai.fallback.ts`.

Pastikan fallback:

* menghasilkan schema valid
* memiliki correct answer valid
* options valid
* explanation tersedia
* topic sesuai
* difficulty sesuai
* tidak menghasilkan duplicate obvious
* tidak menyebabkan training crash

Pastikan fallback bukan sekadar:

```text
Lorem ipsum question
```

atau soal placeholder.

Fallback harus tetap dapat digunakan sebagai latihan nyata.

---

# 10. AI FAILURE SCENARIOS

Test:

```text
AI timeout
AI returns malformed JSON
AI returns empty response
AI returns missing field
AI provider unavailable
AI rate limit
```

Expected:

```text
Application remains functional
```

bukan:

```text
502
blank page
uncaught exception
```

Jika provider abstraction mendukung fallback provider, pastikan mekanismenya benar.

---

# 11. NEXT BEST ACTION

Audit endpoint dan widget Next Best Action.

Recommendation harus benar-benar berubah berdasarkan kondisi student.

Contoh:

Student memiliki:

```text
Weakest Topic:
Normalization
Mastery:
38%
```

maka recommendation harus memprioritaskan:

```text
Normalization
```

Jika student memiliki assignment deadline besok dan topic mastery cukup baik, sistem boleh memprioritaskan assignment.

Recommendation harus berdasarkan data.

Bukan static text.

---

# 12. STUDENT PROFILE

Pastikan Student Profile bukan sekadar kumpulan statistik.

Profile harus memberikan gambaran:

```text
Strengths
Weaknesses
Improvement
Current Focus
Recent Performance
Recommended Action
```

Semua harus berasal dari data aktual.

---

# 13. TEACHER INTELLIGENCE

Audit endpoint Teacher Intelligence secara serius.

Teacher harus mendapatkan insight yang dapat ditindaklanjuti.

Minimal:

```text
Class Mastery
Hardest Topics
Weakest Topics
At-Risk Students
Improving Students
Declining Students
```

Jika data tersedia, tambahkan:

```text
Topic mastery distribution
Quiz performance
Training improvement
Assignment completion
Attendance
```

Jangan hanya mengembalikan raw database rows.

Lakukan aggregation yang bermakna.

---

# 14. AT-RISK DETECTION

Review formula.

Jangan membuat:

```text
atRisk = score < 50
```

saja.

Gunakan kombinasi signal jika tersedia:

```text
mastery
trend
quiz accuracy
assignment completion
attendance
recent performance
```

Dan simpan alasan.

Contoh:

```text
At Risk

Reasons:
- mastery declining
- low recent quiz accuracy
- incomplete assignments
```

Ini jauh lebih valuable untuk guru.

---

# 15. TEACHER RECOMMENDATION

Jangan hanya:

```text
Student X is at risk.
```

Berikan recommendation.

Contoh:

```text
Student:
Rizky

Main issue:
SQL JOIN mastery 41%

Recommended action:
Assign SQL JOIN Fundamentals
and start adaptive remediation.
```

Pastikan recommendation berasal dari data.

---

# 16. LEADERBOARD

Audit kembali leaderboard setelah fix.

Test:

```text
1 participant
2 participants
multiple participants
tie
same score
different response time
```

Pastikan:

```text
rank 1 ≠ everyone
```

dan ranking dihitung terhadap seluruh participant.

Pastikan query tetap performant.

---

# 17. SCORE INTEGRITY

Audit semua client → server flow.

Pastikan client tidak dapat mengirim:

```text
score = 1000
responseTime = 1
isCorrect = true
```

dan membuat backend mempercayainya.

Server harus menentukan:

```text
correctness
score
speed bonus
streak
final score
```

berdasarkan data yang authoritative.

---

# 18. GRADE INTEGRITY

Pastikan:

```text
quiz
assignment
grade
course grade
```

memiliki formula konsisten.

Cari kembali semua hardcoded:

```text
0
100
maxScore
quizResults
grades
```

yang seharusnya berasal dari database.

Jangan menghapus constant yang memang merupakan business rule.

Bedakan:

```text
business constant
```

dengan:

```text
fake data
```

---

# 19. DATABASE QUALITY

Review Prisma schema setelah perubahan.

Pastikan:

```text
TopicMastery
TrainingSession
WeakTopic
QuizResult
QuizAnswer
```

memiliki relation dan index yang masuk akal.

Pertimbangkan unique constraint:

```text
student + course + topic
```

jika sesuai dengan model data.

Pastikan migration bersih.

Jangan membuat duplicate migration yang tidak perlu.

---

# 20. TRANSACTION SAFETY

Untuk operasi penting, perhatikan atomicity.

Misalnya ketika training selesai:

```text
TrainingSession update
+
Mastery update
+
WeakTopic update
```

Jangan sampai hanya sebagian berhasil.

Jika memang satu logical operation, gunakan transaction jika sesuai dengan architecture.

Hal yang sama untuk operasi quiz/result yang mempengaruhi beberapa tabel.

---

# 21. CONCURRENCY

Pikirkan kemungkinan:

```text
double submit quiz
double training completion
duplicate answer
duplicate attendance
```

Pastikan backend tidak menghasilkan duplicate atau inconsistent state.

Jangan hanya mengandalkan tombol disable di frontend.

---

# 22. API CONTRACT

Pastikan endpoint baru:

```text
Next Best Action
Student Profile
Teacher Intelligence
```

memiliki response yang konsisten.

Handle:

```text
loading
empty
error
success
```

Frontend tidak boleh crash ketika:

```text
no course
no quiz
no mastery
no training
no recommendation
```

---

# 23. EMPTY DATA

Test student baru.

Student baru harus tetap dapat menggunakan aplikasi meskipun:

```text
0 quiz
0 training
0 mastery
0 assignment
0 attendance
```

Jangan menghasilkan:

```text
NaN
Infinity
undefined
negative score
```

---

# 24. SEED DATA

Review seed.

Pastikan seed dapat menghasilkan kondisi yang cukup kaya untuk demo.

Harus ada student dengan:

```text
strong performance
weak performance
improving performance
declining performance
```

Dan topic yang berbeda.

Tetapi analytics tetap harus dihitung dari data tersebut.

Jangan seed hasil analytics secara manual jika hasil tersebut seharusnya dihitung engine.

---

# 25. END-TO-END DEMO TEST

Simulasikan demo juri.

Gunakan satu student yang sengaja memiliki kelemahan.

Flow:

```text
LOGIN
 ↓
OPEN COURSE
 ↓
LEARN
 ↓
QUIZ
 ↓
WRONG ANSWERS
 ↓
WEAK TOPIC DETECTED
 ↓
MASTERY LOW
 ↓
AI ANALYSIS
 ↓
ADAPTIVE TRAINING
 ↓
TRAINING COMPLETE
 ↓
POST PERFORMANCE
 ↓
MASTERY IMPROVES
 ↓
RECOMMENDATION CHANGES
 ↓
TEACHER INSIGHT CHANGES
```

Pastikan tidak ada langkah yang membutuhkan manipulasi database manual.

Jika demo flow belum bisa berjalan, perbaiki sampai bisa.

---

# 26. COMPETITION "WOW MOMENT"

Setelah sistem stabil, pastikan satu flow paling kuat dapat menunjukkan:

```text
Before:
Database Normalization
Mastery 42%

↓ AI intervention

After:
Mastery 78%

Improvement:
+36 percentage points
```

Kemudian:

```text
Weak Topic:
resolved / improved
```

dan:

```text
Next Best Action:
moves to next priority
```

serta teacher analytics ikut berubah.

Ini harus menjadi bukti konkret bahwa Aksara bukan LMS biasa.

---

# 27. FIND MORE PROBLEMS

Jangan hanya mengikuti checklist ini.

Setelah selesai, lakukan codebase review sekali lagi.

Cari sendiri:

```text
TODO
FIXME
mock
dummy
hardcoded
console.log
unused endpoint
unused model
unused service
duplicated logic
dead code
unsafe query
missing authorization
missing validation
```

Jika menemukan masalah yang jelas dan masih dalam scope:

**langsung perbaiki.**

---

# 28. TEST EVERYTHING

Setelah semua implementasi:

jalankan:

```text
typecheck
lint
build
tests
Prisma validation
database migration validation
```

Jika test gagal:

**jangan hanya melaporkan failure.**

Trace penyebabnya dan perbaiki.

Jika build gagal:

perbaiki.

Jika type error:

perbaiki.

Jika integration error:

perbaiki.

Teruskan sampai stabil.

---

# 29. FINAL SELF-ASSESSMENT

Setelah semuanya selesai, evaluasi Aksara dari perspektif:

### Student

Apakah Aksara benar-benar membantu saya mengetahui apa yang harus saya pelajari?

### Teacher

Apakah Aksara membantu saya mengetahui siapa yang kesulitan dan apa yang harus dilakukan?

### Judge

Apakah saya dapat melihat inovasi teknologi yang jelas?

### Engineer

Apakah architecture-nya reliable dan maintainable?

### Product

Apakah semua fitur membentuk satu ecosystem?

---

# FINAL SUCCESS CRITERIA

Saya ingin codebase berakhir dalam kondisi:

```text
AUTH
✓ secure

LMS
✓ functional

QUIZ
✓ competitive
✓ server-side scoring

LEADERBOARD
✓ correct

GRADES
✓ consistent

TOPIC MASTERY
✓ persistent
✓ dynamic
✓ explainable

WEAK TOPICS
✓ synchronized

AI
✓ contextual
✓ adaptive
✓ resilient

TRAINING
✓ measurable

PRE/POST
✓ tracked

RECOMMENDATION
✓ personalized

STUDENT PROFILE
✓ actionable

TEACHER INTELLIGENCE
✓ actionable

AT-RISK
✓ explainable

DATABASE
✓ consistent

SECURITY
✓ hardened

PERFORMANCE
✓ reasonable

TESTING
✓ passing

DEMO
✓ end-to-end
```

# VERY IMPORTANT

**JANGAN BERHENTI DI LAPORAN.**

Kalau menemukan masalah → perbaiki.

Kalau menemukan missing integration → integrasikan.

Kalau menemukan bug → fix.

Kalau menemukan schema problem → migration.

Kalau menemukan test failure → debug.

Kalau menemukan endpoint belum digunakan → hubungkan.

Kalau menemukan hardcoded fake data → ganti dengan real data.

Kalau menemukan feature yang sudah dibuat tetapi belum memberikan value → sempurnakan.

Jangan menunggu instruksi tambahan dari saya selama solusinya jelas dan masih berada dalam scope Aksara.

**LANGSUNG EKSEKUSI SAMPAI SELESAI.**

Jangan redesign UI besar-besaran.

Fokus pada **functional excellence, intelligence, integration, reliability, dan measurable learning outcome**.

Setelah benar-benar selesai, berikan saya:

1. Ringkasan perubahan yang benar-benar dilakukan.
2. File yang diubah.
3. Database/schema changes.
4. Test yang dijalankan dan hasilnya.
5. Masalah yang ditemukan dan diperbaiki.
6. End-to-end flow yang berhasil diverifikasi.
7. Jika masih ada limitation, jelaskan secara jujur.

Jangan mengklaim fitur selesai jika hanya dibuat secara superficial.
