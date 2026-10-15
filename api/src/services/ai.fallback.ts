import { PerformanceAnalysis, TrainingMaterial } from "./ai.provider"

/**
 * Deterministic fallback generator for AI failures (network timeout, malformed JSON, rate limit).
 * Provides high pedagogical quality backup questions and explanations.
 */

export function getFallbackPerformanceAnalysis(
  topicTags: Record<string, { correct: number; total: number }>,
  _historicalPerformance?: Record<string, number>
): PerformanceAnalysis {
  const strong: string[] = []
  const weak: string[] = []
  const recommended: string[] = []

  for (const [topic, stats] of Object.entries(topicTags)) {
    const acc = stats.total > 0 ? stats.correct / stats.total : 0
    if (acc >= 0.75) {
      strong.push(topic)
    } else {
      weak.push(topic)
      recommended.push(topic)
    }
  }

  if (weak.length === 0 && Object.keys(topicTags).length > 0) {
    strong.push(...Object.keys(topicTags))
  }

  const avgAccuracy =
    Object.values(topicTags).reduce((acc, curr) => acc + (curr.total > 0 ? curr.correct / curr.total : 0), 0) /
    (Object.keys(topicTags).length || 1)

  const recommendedDifficulty: "easy" | "medium" | "hard" =
    avgAccuracy >= 0.8 ? "hard" : avgAccuracy < 0.5 ? "easy" : "medium"

  const suggestedPractice =
    weak.length > 0
      ? `Fokus perkuat pemahaman pada topik ${weak.join(", ")} melalui latihan konsep dasar dan variasi soal.`
      : "Performa sudah sangat baik! Pertahankan dan coba tantangan soal dengan tingkat kesulitan lebih tinggi."

  return {
    strongTopics: strong.length > 0 ? strong : ["Dasar Pemrograman"],
    weakTopics: weak,
    recommendedTopics: recommended.length > 0 ? recommended : ["Lanjutan Pemrograman"],
    recommendedDifficulty,
    suggestedPractice,
  }
}

export function getFallbackTrainingMaterial(
  topic: string,
  difficulty: "easy" | "medium" | "hard",
  questionCount: number = 5,
  questionTypes: string[] = ["SINGLE_CHOICE"]
): TrainingMaterial {
  const singleChoiceBank = [
    {
      q: `Dalam topik ${topic}, manakah prinsip dasar yang paling tepat untuk diterapkan?`,
      opts: [
        `Memahami struktur dasar dan alur logika ${topic}`,
        `Menghafal sintaks tanpa memahami konsep`,
        `Menghindari pengujian kode`,
        `Mengabaikan penanganan kesalahan (error handling)`,
      ],
      ans: `Memahami struktur dasar dan alur logika ${topic}`,
      exp: `Pemahaman konseptual dan alur logika dasar merupakan fondasi utama sebelum menulis implementasi kompleks pada ${topic}.`,
      type: "SINGLE_CHOICE" as const,
    },
    {
      q: `Apa keuntungan utama dari penerapan best practice pada ${topic}?`,
      opts: [
        "Meningkatkan keterbacaan (readability) dan maintainability kode",
        "Membuat ukuran kode berlipat ganda",
        "Menonaktifkan debugger otomatis",
        "Menghilangkan kebutuhan dokumentasi",
      ],
      ans: "Meningkatkan keterbacaan (readability) dan maintainability kode",
      exp: "Penerapan best practice memastikan kode mudah dibaca, dirawat, dan meminimalkan resiko bug di masa mendatang.",
      type: "SINGLE_CHOICE" as const,
    },
    {
      q: `Kapan waktu yang paling tepat untuk melakukan validasi dalam alur kerja ${topic}?`,
      opts: [
        "Sedini mungkin sebelum data/kondisi diproses lebih lanjut",
        "Hanya setelah program mengalami crash",
        "Tidak perlu divalidasi jika sudah diuji sekali",
        "Hanya pada saat rilis ke production",
      ],
      ans: "Sedini mungkin sebelum data/kondisi diproses lebih lanjut",
      exp: "Validasi sedini mungkin (fail-fast principle) mencegah kesalahan menyebar ke seluruh sistem.",
      type: "SINGLE_CHOICE" as const,
    },
    {
      q: `Manakah pendekatan terbaik saat menghadapi bug atau error pada ${topic}?`,
      opts: [
        "Menganalisis stack trace dan mengisolasi akar masalah secara sistematis",
        "Menghapus seluruh modul dan menulis ulang dari awal",
        "Mengabaikan error jika program masih bisa berjalan sebagian",
        "Mengubah nilai variabel secara acak hingga error hilang",
      ],
      ans: "Menganalisis stack trace dan mengisolasi akar masalah secara sistematis",
      exp: "Analisis log dan reproduksi bug secara terisolasi adalah metode debugging yang paling efektif dan terukur.",
      type: "SINGLE_CHOICE" as const,
    },
    {
      q: `Bagaimana cara mengukur pemahaman yang baik terhadap materi ${topic}?`,
      opts: [
        "Mampu mengimplementasikan solusi pada studi kasus yang berbeda",
        "Hanya mampu menjawab soal pilihan ganda yang sama",
        "Menyalin kode orang lain tanpa modifikasi",
        "Menghafal nomor baris kode",
      ],
      ans: "Mampu mengimplementasikan solusi pada studi kasus yang berbeda",
      exp: "Kemampuan mentransfer konsep ke berbagai skenario kasus membuktikan penguasaan topik yang menyeluruh.",
      type: "SINGLE_CHOICE" as const,
    },
  ]

  const multiOptionBank = [
    {
      q: `Pilihlah semua karakteristik dan manfaat yang relevan dengan penerapan ${topic}:`,
      opts: [
        `Meningkatkan efisiensi pemrosesan data`,
        `Mengurangi redundansi dan inkonsistensi`,
        `Memperlambat eksekusi sistem secara sengaja`,
        `Memudahkan kolaborasi tim melalui struktur yang terstandarisasi`,
      ],
      ans: `Meningkatkan efisiensi pemrosesan data, Mengurangi redundansi dan inkonsistensi, Memudahkan kolaborasi tim melalui struktur yang terstandarisasi`,
      exp: `Penerapan ${topic} berfokus pada efisiensi, konsistensi data, dan standarisasi arsitektur sistem.`,
      type: "MULTIPLE_CHOICE" as const,
    },
    {
      q: `Manakah dari pernyataan berikut yang merupakan langkah validasi tepat pada ${topic}? (Pilih lebih dari satu)`,
      opts: [
        `Memeriksa tipe data input`,
        `Menangani potensi null atau undefined value`,
        `Mengabaikan pesan peringatan compiler`,
        `Menyediakan fallback saat terjadi kegagalan sistem`,
      ],
      ans: `Memeriksa tipe data input, Menangani potensi null atau undefined value, Menyediakan fallback saat terjadi kegagalan sistem`,
      exp: `Pemeriksaan tipe, sanitasi null-pointer, dan graceful error fallback adalah fondasi reliabilitas sistem.`,
      type: "MULTIPLE_CHOICE" as const,
    },
    {
      q: `Manakah faktor yang mempengaruhi performa dan skalabilitas pada ${topic}?`,
      opts: [
        `Kompleksitas algoritma (Time Complexity)`,
        `Penggunaan memori (Space Complexity)`,
        `Warna background tema editor kode`,
        `Struktur indeks dan strategi caching`,
      ],
      ans: `Kompleksitas algoritma (Time Complexity), Penggunaan memori (Space Complexity), Struktur indeks dan strategi caching`,
      exp: `Analisis kompleksitas waktu/ruang dan strategi caching adalah kunci utama performa sistem.`,
      type: "MULTIPLE_CHOICE" as const,
    },
  ]

  const essayBank = [
    {
      q: `Jelaskan konsep utama ${topic}, tujuan penerapannya, dan berikan satu contoh skenario nyata di mana konsep ini mutlak diperlukan!`,
      opts: [],
      ans: `Konsep inti ${topic}, tujuan efisiensi/konsistensi, dan contoh implementasi nyata.`,
      exp: `Jawaban dinilai berdasarkan ketepatan definisi, pemahaman manfaat arsitektural, dan relevansi contoh kasus yang diberikan.`,
      type: "ESSAY" as const,
    },
    {
      q: `Analisis apa yang akan terjadi pada integritas atau performa sistem jika prinsip ${topic} tidak diterapkan dengan benar!`,
      opts: [],
      ans: `Dampak kegagalan: inefisiensi, potensi bug/data corrupt, dan kerentanan sistem.`,
      exp: `Uraian harus mencakup dampak langsung pada efisiensi eksekusi serta risiko kesalahan logika jangka panjang.`,
      type: "ESSAY" as const,
    },
    {
      q: `Rancanglah langkah-langkah sistematis (best practice) untuk mengimplementasikan solusi berbasis ${topic} pada sistem produksi!`,
      opts: [],
      ans: `Tahapan analisis kebutuhan, perancangan modul, pengujian batas (edge cases), dan monitoring performa.`,
      exp: `Kriteria penilaian meliputi kejelasan alur logika, mitigasi risiko error, dan aspek maintainability.`,
      type: "ESSAY" as const,
    },
  ]

  const enabledTypes = questionTypes.length > 0 ? questionTypes : ["SINGLE_CHOICE"]
  const candidatePool: Array<{ q: string; opts: string[]; ans: string; exp: string; type: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY" }> = []

  if (enabledTypes.includes("SINGLE_CHOICE")) candidatePool.push(...singleChoiceBank)
  if (enabledTypes.includes("MULTIPLE_CHOICE")) candidatePool.push(...multiOptionBank)
  if (enabledTypes.includes("ESSAY")) candidatePool.push(...essayBank)

  // Fallback to single choice if empty
  if (candidatePool.length === 0) candidatePool.push(...singleChoiceBank)

  const selectedQuestions: typeof candidatePool = []
  for (let i = 0; i < questionCount; i++) {
    const item = candidatePool[i % candidatePool.length]
    selectedQuestions.push(item)
  }

  return {
    explanation: `Panduan Remedial Terstruktur: ${topic}. Materi ini berfokus pada penguatan konsep inti, logika alur pemrosesan, dan variasi jenis soal (${enabledTypes.join(", ")}).`,
    example: `Contoh Penerapan:\n1. Identifikasi input dan prasyarat konsep ${topic}.\n2. Terapkan logika secara terstruktur.\n3. Uji hasil dengan kasus batas (edge cases).`,
    practiceQuestions: selectedQuestions.map((item, index) => ({
      question: item.q,
      options: item.opts,
      correctAnswer: item.ans,
      explanation: item.exp,
      topic,
      difficulty,
      type: item.type,
      order: index,
    })),
  }
}
