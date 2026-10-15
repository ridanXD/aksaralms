import { getAIProvider } from "./ai.service"
import { checkPromptGuard } from "./prompt-guard.service"

export interface EssayEvaluationResult {
  score: number // 0 - 100
  isCorrect: boolean // score >= 60
  feedback: string
}

export interface QuizEvaluationResult {
  summary: string
  evaluation: string
  recommendations: string
}

/**
 * AI Essay Evaluator
 * Evaluates student essay answers against question context and grading rubric.
 */
export async function evaluateEssayAnswer(params: {
  question: string
  topic: string
  rubric?: string | null
  studentAnswer: string
}): Promise<EssayEvaluationResult> {
  const answer = params.studentAnswer.trim()
  if (!answer) {
    return {
      score: 0,
      isCorrect: false,
      feedback: "Jawaban kosong. Silakan tuliskan penjelasan atau uraian konsep jawabanmu.",
    }
  }

  // Guard against prompt injection
  const guard = await checkPromptGuard(answer)
  if (!guard.isSafe) {
    return {
      score: 10,
      isCorrect: false,
      feedback:
        guard.blockedReason ||
        "Jawaban terdeteksi tidak relevan atau mengandung manipulasi instruksi.",
    }
  }

  try {
    const provider = getAIProvider()
    const prompt = `Anda adalah dosen penilai akademik ahli. Periksa dan evaluasi jawaban esai mahasiswa berikut ini secara objektif, kritis, dan mendalam.

Konteks Soal:
- Topik: ${params.topic}
- Pertanyaan Esai: "${params.question}"
- Panduan/Rubrik Jawaban Acuan: "${params.rubric || "Nilai berdasarkan kelengkapan argumen, keakuratan istilah teknis, dan pemahaman konsep yang mendalam."}"

Jawaban Mahasiswa:
"${answer}"

Tugas Anda:
1. Berikan nilai (score) dari rentang 0 hingga 100.
2. Tentukan isCorrect: true jika score >= 60, false jika < 60.
3. Berikan feedback yang konstruktif dan padat (maksimal 3-4 kalimat): sebutkan apa yang sudah dipahami dengan baik, apa yang masih kurang/keliru, dan saran perbaikan.

Skema JSON yang harus dikembalikan:
{
  "score": 85,
  "isCorrect": true,
  "feedback": "Kelebihan dan evaluasi jawaban secara edukatif..."
}`

    const res = await provider.generateStructured<EssayEvaluationResult>(
      prompt,
      {
        score: 80,
        isCorrect: true,
        feedback: "string",
      },
      { temperature: 0.2, maxTokens: 400 }
    )

    const normalizedScore = Math.max(0, Math.min(100, Math.round(res.score || 0)))
    return {
      score: normalizedScore,
      isCorrect: normalizedScore >= 60,
      feedback: res.feedback || "Jawaban telah diperiksa oleh asisten AI.",
    }
  } catch (err) {
    console.warn("[AI Evaluator] Essay evaluation failed, using pedagogical fallback:", err)
    return getFallbackEssayEvaluation(params.question, params.rubric, answer)
  }
}

/**
 * Fallback heuristic essay evaluation
 */
function getFallbackEssayEvaluation(
  question: string,
  rubric: string | null | undefined,
  answer: string
): EssayEvaluationResult {
  const wordCount = answer.split(/\s+/).filter(Boolean).length

  let score = 50
  if (wordCount >= 25) score += 25
  else if (wordCount >= 10) score += 15

  // Keyword overlap with rubric or question
  const refText = `${question} ${rubric || ""}`.toLowerCase()
  const words = answer.toLowerCase().split(/\W+/).filter((w) => w.length > 3)
  const matches = words.filter((w) => refText.includes(w))

  if (matches.length >= 3) score += 15
  else if (matches.length >= 1) score += 5

  const finalScore = Math.min(95, Math.max(30, score))
  const isCorrect = finalScore >= 60

  return {
    score: finalScore,
    isCorrect,
    feedback: isCorrect
      ? `Jawabanmu menunjukkan pemahaman dasar yang baik terhadap topik ini (${wordCount} kata). Untuk meningkatkan kualitas, perjelas contoh aplikatif atau argumen teknis pendukung.`
      : `Jawabanmu masih terlalu singkat atau kurang menyentuh poin kunci esai (${wordCount} kata). Coba uraikan konsep secara lebih komprehensif dan sertakan alasan logis.`,
  }
}

/**
 * Overall Quiz Performance Evaluation & Summary
 * Summarizes performance and provides deep evaluation of strengths and weak spots.
 */
export async function generateQuizEvaluationAndSummary(params: {
  quizTitle: string
  totalScore: number
  correctCount: number
  totalQuestions: number
  topicStats: Record<string, { correct: number; total: number }>
  answersDetail: Array<{
    question: string
    type: string
    studentAnswer: string
    isCorrect: boolean
    points: number
    aiFeedback?: string | null
  }>
}): Promise<QuizEvaluationResult> {
  const accuracyPct = Math.round(
    (params.correctCount / Math.max(1, params.totalQuestions)) * 100
  )

  try {
    const provider = getAIProvider()
    const prompt = `Anda adalah penasihat akademik AI LMS Aksara. Berikan rangkuman evaluasi komprehensif atas hasil asesmen kuis mahasiswa berikut:

Kuis: "${params.quizTitle}"
Total Soal: ${params.totalQuestions}
Jawaban Benar: ${params.correctCount} (${accuracyPct}%)
Total Skor: ${params.totalScore} poin
Statistik Pemahaman Topik: ${JSON.stringify(params.topicStats)}

Detail Jawaban Siswa (Ringkas):
${params.answersDetail
  .slice(0, 10)
  .map(
    (a, idx) =>
      `${idx + 1}. [${a.type}] "${a.question}" -> Jawaban: "${a.studentAnswer}" (${
        a.isCorrect ? "BENAR" : "SALAH"
      }, ${a.points} pts) ${a.aiFeedback ? `| Feedback: ${a.aiFeedback}` : ""}`
  )
  .join("\n")}

Format output JSON:
{
  "summary": "Rangkuman 2-3 kalimat mengenai hasil keseluruhan kuis dan pencapaian mahasiswa.",
  "evaluation": "Evaluasi mendalam mengenai kekuatan pemahaman konsep, pola kesalahan, dan titik kritis yang perlu diwaspadai.",
  "recommendations": "Rekomendasi langkah belajar konkrit (maksimal 2 kalimat) untuk meningkatkan pemahaman ke depannya."
}`

    const res = await provider.generateStructured<QuizEvaluationResult>(
      prompt,
      {
        summary: "string",
        evaluation: "string",
        recommendations: "string",
      },
      { temperature: 0.3, maxTokens: 600 }
    )

    return {
      summary: res.summary || `Menyelesaikan kuis dengan akurasi ${accuracyPct}%.`,
      evaluation: res.evaluation || "Pemahaman materi secara umum memadai.",
      recommendations:
        res.recommendations || "Tinjau kembali materi dan pelajari topik yang belum dikuasai.",
    }
  } catch (err) {
    console.warn("[AI Evaluator] Summary generation failed, using fallback:", err)
    return getFallbackQuizEvaluation(params.quizTitle, accuracyPct, params.topicStats)
  }
}

/**
 * Fallback generator for quiz summary and evaluation
 */
function getFallbackQuizEvaluation(
  quizTitle: string,
  accuracyPct: number,
  topicStats: Record<string, { correct: number; total: number }>
): QuizEvaluationResult {
  const weakTopics = Object.entries(topicStats)
    .filter(([_, s]) => s.total > 0 && s.correct / s.total < 0.7)
    .map(([t]) => t)

  const strongTopics = Object.entries(topicStats)
    .filter(([_, s]) => s.total > 0 && s.correct / s.total >= 0.7)
    .map(([t]) => t)

  let summary = ""
  let evaluation = ""
  let recommendations = ""

  if (accuracyPct >= 80) {
    summary = `Hasil asesmen "${quizTitle}" sangat memuaskan dengan akurasi ${accuracyPct}%. Kamu berhasil menguasai sebagian besar indikator capaian pembelajaran pada sesi ini.`
    evaluation = `Kekuatan utamamu terlihat pada topik ${
      strongTopics.join(", ") || "konsep perkuliahan"
    }. Penalaran dan ketelitian dalam menjawab soal sudah sangat solid.`
    recommendations =
      "Pertahankan performa ini dan lanjutkan eksplorasi studi kasus lanjutan atau tantangan kuis dengan tingkat kesulitan lebih tinggi."
  } else if (accuracyPct >= 50) {
    summary = `Kamu telah menyelesaikan kuis "${quizTitle}" dengan akurasi ${accuracyPct}%. Terdapat pemahaman konsep dasar yang baik meskipun masih ada beberapa aspek yang perlu diasah.`
    evaluation = weakTopics.length > 0
      ? `Perlu perhatian lebih pada topik ${weakTopics.join(
          ", "
        )}, di mana akurasi jawaban masih di bawah ambang batas optimal.`
      : "Beberapa kesalahan minor terjadi pada variasi soal analisis mendalam atau soal esai.",
    recommendations =
      "Pelajari kembali bahan bacaan terkait dan gunakan sesi AI Training untuk memperkuat materi yang masih dirasa membingungkan."
  } else {
    summary = `Asesmen "${quizTitle}" selesai dengan tingkat ketepatan ${accuracyPct}%. Diperlukan pendalaman materi lebih lanjut untuk mencapai kompetensi minimum.`
    evaluation = `Sebagian besar topik seperti ${
      weakTopics.join(", ") || "materi utama"
    } membutuhkan pengulangan pemahaman dari konsep dasar.`
    recommendations =
      "Sangat direkomendasikan untuk membaca kembali silabus modul, berdiskusi dengan dosen pengampu, dan mengerjakan latihan terarah."
  }

  return { summary, evaluation, recommendations }
}
