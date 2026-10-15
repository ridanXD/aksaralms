Aksara sudah dinyatakan selesai secara end-to-end berdasarkan test-e2e.ts.

Sekarang lakukan FINAL BRUTAL VERIFICATION terhadap seluruh implementasi yang baru saja dibuat.

Jangan membuat roadmap, jangan membagi pekerjaan menjadi fase, dan jangan berhenti untuk meminta approval. Langsung audit seluruh codebase dan perbaiki semua masalah yang ditemukan secara autonomous.

Fokus utama sekarang bukan menambah banyak fitur baru, tetapi memastikan semua fitur yang sudah ada benar-benar production/competition-ready, konsisten, aman, dan tidak hanya terlihat berhasil pada happy path.

HASIL E2E YANG SUDAH TERBUKTI:

* JWT STUDENT dan TEACHER valid.
* Next Best Action berhasil mendeteksi topik terlemah dan memberikan aksi latihan adaptif.
* Student Profile mencatat Mastery 69% dengan 26 topik.
* Server-side quiz scoring mencegah manipulasi skor.
* Duplicate answer ditolak.
* Leaderboard ranking menggunakan window function terhadap seluruh participant.
* Weak topic → AI remediation → training → post-training berhasil.
* Baseline 0% → Post-Training 100%.
* Mastery meningkat 24 → 62 (+38 poin).
* Trend berubah menjadi IMPROVING.
* Teacher Intelligence mengidentifikasi Normalisasi sebagai critical topic.
* 67% siswa struggling pada topik tersebut.
* At-Risk detection menemukan 3 siswa dengan diagnosis dan rekomendasi intervensi.

JANGAN HANYA PERCAYA HASIL TEST TERSEBUT.

==================================================

1. AUDIT TOPIC MASTERY SECARA MATEMATIS
   ==================================================

Periksa implementation mastery.service.ts dan seluruh caller-nya.

Pastikan:

* mastery selalu berada pada 0–100.
* tidak mungkin menghasilkan NaN, Infinity, null, atau angka di luar range.
* tidak terjadi lonjakan mastery yang tidak masuk akal dari satu aktivitas.
* mastery bisa meningkat ketika siswa membaik.
* mastery bisa turun ketika performa memburuk.
* mastery bisa stabil ketika performa konsisten.
* trend IMPROVING/STABLE/DECLINING benar-benar berasal dari data.
* accuracy dan recentAccuracy memiliki definisi yang jelas.
* confidence tidak hanya menjadi angka dekoratif.
* speed factor benar-benar masuk akal secara pedagogis.
* jumlah soal terlalu sedikit tidak menyebabkan mastery langsung melonjak ekstrem.
* data lama dan data terbaru memiliki pengaruh yang masuk akal.

Pastikan algoritma tetap deterministic dan explainable.

Jangan menggunakan ML kompleks hanya untuk membuat sistem terlihat pintar.

==================================================
2. AUDIT CLOSED-LOOP REMEDIATION
================================

Verifikasi alur lengkap:

QUIZ
→ WEAK TOPIC
→ BASELINE PERFORMANCE
→ AI TRAINING
→ POST-TRAINING PERFORMANCE
→ IMPROVEMENT DELTA
→ TOPIC MASTERY UPDATE
→ WEAK TOPIC UPDATE
→ NEXT BEST ACTION UPDATE

Pastikan tidak ada data yang hanya dihitung sementara tetapi tidak disimpan.

Pastikan:

* preAccuracy benar-benar berasal dari performa sebelum training.
* postAccuracy berasal dari performa setelah training.
* improvementDelta konsisten.
* percentage-point improvement tidak tertukar dengan relative percentage improvement.
* mastery update benar-benar menggunakan hasil training.
* weak topic dapat hilang ketika mastery membaik.
* weak topic tetap ada jika siswa masih membutuhkan remediation.
* recommendation berubah setelah mastery berubah.

Test juga skenario:

1. siswa gagal → training → membaik
2. siswa gagal → training → tetap gagal
3. siswa awalnya kuat → performa menurun
4. siswa belum punya histori
5. siswa hanya memiliki 1–2 attempt
6. siswa memiliki banyak attempt

Jangan hanya test happy path.

==================================================
3. AUDIT AI ENGINE
==================

Periksa seluruh AI prompt dan context yang dikirim ke provider.

Pastikan AI benar-benar menerima context seperti:

* topic
* mastery
* accuracy
* recent performance
* previous mistakes
* difficulty
* training history
* question history
* weak topics

Jangan sampai AI hanya menerima prompt generik seperti:

"buatkan soal Database."

Pastikan output AI divalidasi menggunakan schema yang ketat.

Jika output malformed:

AI
→ validation
→ deterministic fallback

bukan:

AI
→ malformed JSON
→ crash / 500

Test provider failure, timeout, malformed response, empty response, dan partial response.

Pastikan API key tidak pernah masuk ke frontend/browser response.

==================================================
4. ADAPTIVE QUESTION QUALITY
============================

Pastikan difficulty benar-benar adaptif.

Contoh:

mastery rendah
→ concept reinforcement
→ easy/medium

mastery sedang
→ medium

mastery tinggi
→ harder application/problem solving

Jangan hanya mengganti string "difficulty".

Question generation harus mempertimbangkan:

* weak concept
* previous mistakes
* mastery
* question history
* training history

Pastikan soal yang sama tidak terus muncul.

Tambahkan deterministic duplicate prevention apabila diperlukan.

==================================================
5. LEADERBOARD & COMPETITIVE SYSTEM
===================================

Audit kembali:

* ranking
* score
* accuracy
* speed bonus
* streak
* tie handling
* pagination
* user rank
* empty leaderboard
* concurrent submissions

Pastikan score hanya dapat dihitung server.

Client tidak boleh mengirim final score sebagai sumber kebenaran.

Test:

* submit jawaban dua kali secara bersamaan.
* request dimanipulasi.
* answer untuk session milik user lain.
* answer untuk question yang tidak termasuk session.
* session expired.
* session sudah completed.
* user mencoba mengubah score.

Semua harus ditolak dengan aman.

Competitive mechanics harus tetap educational.

==================================================
6. GRADE INTEGRITY
==================

Audit seluruh grade calculation.

Pastikan:

* quiz score berasal dari hasil quiz sebenarnya.
* assignment score berasal dari data assignment sebenarnya.
* maxScore tidak hardcoded/arbitrary.
* total grade konsisten.
* teacher hanya dapat mengubah data yang memang boleh diubah.
* student tidak dapat mengubah nilai dirinya sendiri.
* tidak ada IDOR melalui ID request.

Test juga empty grade data.

==================================================
7. TEACHER INTELLIGENCE
=======================

Jangan berhenti pada agregasi angka.

Pastikan Teacher Intelligence menghasilkan insight yang actionable.

Minimal mampu menjawab:

* topik mana yang paling sulit?
* berapa siswa yang struggling?
* siapa yang at-risk?
* kenapa mereka at-risk?
* apakah performa mereka membaik atau menurun?
* intervensi apa yang disarankan?

At-risk harus explainable.

Contoh diagnosis:

* low mastery
* declining recent accuracy
* repeated failure
* missing assignment
* low attendance
* weak topic persistence

Jangan membuat diagnosis berdasarkan satu threshold saja jika data memungkinkan multi-signal.

Pastikan rekomendasi intervensi masuk akal secara pedagogis.

==================================================
8. STUDENT PROFILE
==================

Audit Student Profile.

Pastikan semua data berasal dari database nyata.

Profile minimal harus mampu menunjukkan:

* overall mastery
* strongest topics
* weakest topics
* improvement
* declining areas
* recent performance
* recommended next action

Jangan tampilkan fake/demo values.

Jika user baru dan belum punya data:

gunakan empty state yang benar, bukan angka palsu.

==================================================
9. NEXT BEST ACTION
===================

Pastikan recommendation engine deterministic dan explainable.

Prioritas harus masuk akal.

Contoh:

weak topic + declining performance
→ remedial training

deadline assignment dekat
→ assignment

unfinished learning material
→ continue learning

mastery sudah tinggi
→ harder practice

Tidak boleh selalu mengembalikan recommendation yang sama tanpa mempertimbangkan kondisi user.

==================================================
10. SECURITY DEEP AUDIT
=======================

Audit seluruh API.

Periksa:

* authentication
* authorization
* role checks
* IDOR
* ownership validation
* JWT handling
* password hashing
* input validation
* SQL/Prisma injection risks
* mass assignment
* sensitive error messages
* rate limiting
* CORS
* security headers
* AI API key exposure

Pastikan:

STUDENT tidak bisa mengakses endpoint TEACHER.

STUDENT tidak bisa membaca data siswa lain.

TEACHER tidak bisa mengubah data di luar scope yang diizinkan.

User tidak bisa mengakses resource hanya dengan mengganti ID URL.

==================================================
11. DATABASE & CONCURRENCY
==========================

Audit Prisma schema.

Pastikan unique constraint dan index yang diperlukan benar-benar tersedia.

Periksa terutama:

* TopicMastery uniqueness student + course + topic.
* QuizAnswer lookup/index.
* WeakTopic lookup/index.
* foreign keys.
* cascading behavior.
* nullable fields.
* timestamp consistency.

Audit race condition.

Periksa:

* duplicate quiz submission
* duplicate answer
* simultaneous mastery update
* simultaneous training completion

Gunakan transaction/atomic operation jika memang diperlukan.

Jangan menambahkan transaction secara berlebihan jika tidak dibutuhkan.

==================================================
12. API CONTRACT
================

Audit seluruh endpoint frontend ↔ backend.

Pastikan:

* response shape konsisten.
* error shape konsisten.
* status code benar.
* loading/error/empty state ditangani frontend.
* frontend tidak mengasumsikan field yang sebenarnya optional.
* null/empty array aman.
* pagination konsisten.

Cari mismatch API yang hanya muncul pada edge case.

==================================================
13. PERFORMANCE
===============

Audit query yang berpotensi N+1.

Periksa:

* dashboard queries
* leaderboard
* teacher intelligence
* student profile
* mastery aggregation
* weak topic aggregation

Gunakan include/select/aggregation secara tepat.

Jangan melakukan query database berulang di dalam loop jika dapat dihindari.

Tambahkan index hanya jika memang justified.

Jangan overengineer.

==================================================
14. REALISTIC DATA TESTING
==========================

Pastikan seed/demo data mampu menghasilkan kondisi:

* strong student
* weak student
* improving student
* declining student
* student tanpa histori
* class dengan topic mastery tinggi
* class dengan topic mastery rendah
* assignment completed
* assignment overdue
* attendance rendah
* repeated quiz failure

Tujuannya agar intelligence engine benar-benar dapat diuji pada kondisi berbeda.

==================================================
15. FULL END-TO-END REGRESSION
==============================

Setelah semua audit selesai, jalankan kembali:

* typecheck
* lint
* build frontend
* build backend
* Prisma validation/generate
* seluruh tests
* test-e2e.ts

Jika ada error:

JANGAN hanya melaporkan error.

Cari root cause → perbaiki → jalankan ulang test.

Ulangi sampai sistem stabil.

==================================================
16. SEARCH FOR HIDDEN PROBLEMS
==============================

Cari seluruh repository untuk:

TODO
FIXME
HACK
mock
dummy
fake
hardcoded
placeholder
console.log
unsafe query
dead code
unused service
unused endpoint
broken import
temporary workaround

Periksa juga code yang secara teknis berjalan tetapi tidak benar secara logic.

Jangan menghapus sesuatu hanya karena terlihat tidak digunakan tanpa memahami dependency-nya.

==================================================
17. COMPETITION DEMO VERIFICATION
=================================

Simulasikan perjalanan user sebenarnya menggunakan database nyata:

STUDENT LOGIN
→ melihat dashboard
→ melihat recommendation
→ mengikuti learning material
→ mengikuti quiz
→ salah pada topic tertentu
→ topic masuk WeakTopic
→ sistem menghitung mastery
→ AI training muncul
→ student menjalankan training
→ baseline dicatat
→ adaptive questions diberikan
→ training selesai
→ post-training dihitung
→ improvementDelta dicatat
→ mastery berubah
→ recommendation berubah

Kemudian:

TEACHER LOGIN
→ melihat class intelligence
→ melihat difficult topic
→ melihat students at-risk
→ melihat alasan
→ melihat recommended intervention

Pastikan semua perubahan benar-benar berasal dari database dan dapat ditelusuri.

Ini harus menjadi demo utama Aksara.

==================================================
18. JANGAN MERUSAK YANG SUDAH BERHASIL
======================================

Hasil yang sudah terbukti harus tetap dipertahankan:

* Mastery 69% / 26 topics pada test student.
* Database terdeteksi sebagai weak topic.
* Baseline 0%.
* Post-training 100%.
* Mastery 24 → 62.
* Trend IMPROVING.
* Normalisasi sebagai critical class topic.
* 67% struggling.
* 3 at-risk students.
* leaderboard ranking valid.
* duplicate answer protection.

Jika perubahan code menyebabkan regression, perbaiki regression tersebut.

==================================================
19. SCOPE CONTROL
=================

JANGAN:

* redesign UI besar-besaran.
* membuat microservices.
* menambahkan vector database.
* menambahkan heavy ML.
* membuat websocket hanya demi terlihat canggih.
* menambahkan social features yang tidak relevan.
* menambahkan gimmick AI.
* menambahkan fitur yang tidak memperkuat learning loop.

Prioritas:

correctness
→ intelligence
→ integration
→ reliability
→ security
→ measurable learning outcome
→ performance

==================================================
20. FINAL DEFINITION OF DONE
============================

Aksara dianggap benar-benar selesai hanya jika:

[ ] Authentication aman
[ ] Authorization benar
[ ] LMS berjalan
[ ] Quiz berjalan
[ ] Server-side scoring aman
[ ] Leaderboard akurat
[ ] Grade calculation benar
[ ] TopicMastery dynamic
[ ] TopicMastery explainable
[ ] WeakTopic tersinkronisasi
[ ] Closed-loop remediation berjalan
[ ] Pre/post performance tersimpan
[ ] Improvement delta benar
[ ] AI context-aware
[ ] AI adaptive
[ ] AI output tervalidasi
[ ] AI fallback bekerja
[ ] Duplicate question prevention bekerja
[ ] Student Profile menggunakan real data
[ ] Next Best Action contextual
[ ] Teacher Intelligence actionable
[ ] At-risk detection explainable
[ ] Database integrity benar
[ ] Concurrency aman
[ ] API contract konsisten
[ ] Security audit selesai
[ ] Performance tidak memiliki obvious bottleneck
[ ] Empty/error states aman
[ ] Seed realistis
[ ] E2E regression passing
[ ] Frontend build passing
[ ] Backend build passing
[ ] Typecheck passing
[ ] Lint passing

SETELAH SELESAI:

Jangan hanya memberikan rekomendasi.

Implementasikan seluruh perbaikan yang jelas berada dalam scope.

Kemudian berikan final report yang ringkas tetapi konkret berisi:

1. masalah yang ditemukan
2. masalah yang diperbaiki
3. file yang berubah
4. schema/database changes
5. security fixes
6. intelligence/algorithm changes
7. test yang dijalankan
8. hasil test
9. hasil E2E
10. hal yang masih menjadi limitation jika memang ada

Jangan mengklaim "production ready" jika masih ada failure yang belum diselesaikan.

Setelah final verification ini benar-benar PASS, STOP menambah fitur backend baru.

Tahap berikutnya adalah UI/UX dan visual design Aksara.
