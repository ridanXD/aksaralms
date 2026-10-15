import {
  AIProvider,
  QuizGenerationContext,
  GeneratedQuiz,
  PerformanceAnalysisInput,
  PerformanceAnalysis,
  GeneratedQuestion,
  TrainingMaterial,
} from "./ai.provider"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

/**
 * GeminiProvider — Google AI Studio (Gemini 3.5 Flash Lite)
 * Optimized for ultra-low token consumption and minimal API calls via aggressive in-memory caching.
 */
export class GeminiProvider implements AIProvider {
  name = "gemini"
  private apiKey: string
  private model: string
  private cache = new Map<string, CacheEntry<unknown>>()
  private readonly CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

  constructor(apiKey: string, model: string = "gemini-3.5-flash-lite") {
    this.apiKey = apiKey
    this.model = model
  }

  private getCached<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (entry && Date.now() - entry.timestamp < this.CACHE_TTL_MS) {
      return entry.data as T
    }
    return null
  }

  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() })
    if (this.cache.size > 500) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
  }

  private async callGemini(
    prompt: string,
    systemInstruction?: string,
    options?: { temperature?: number; maxTokens?: number; jsonMode?: boolean }
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`

    const body: Record<string, unknown> = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1500,
        ...(options?.jsonMode ? { responseMimeType: "application/json" } : {}),
      },
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Gemini API error (${res.status}): ${errorText}`)
    }

    const data: any = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error("No content received from Gemini API")
    }

    return text.trim()
  }

  async generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const cacheKey = `text:${prompt.trim()}`
    const cached = this.getCached<string>(cacheKey)
    if (cached) return cached

    const result = await this.callGemini(prompt, "Jawablah dengan ringkas, padat, dan akurat.", {
      temperature: options?.temperature ?? 0.5,
      maxTokens: options?.maxTokens ?? 800,
    })

    this.setCache(cacheKey, result)
    return result
  }

  async generateStructured<T>(
    prompt: string,
    outputSchema: Record<string, unknown>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T> {
    const cacheKey = `struct:${prompt.trim()}:${JSON.stringify(outputSchema)}`
    const cached = this.getCached<T>(cacheKey)
    if (cached) return cached

    const systemInstruction = `Anda adalah asisten AI LMS Aksara. Output HANYA JSON valid sesuai skema berikut. Jangan ada markdown lain atau teks pengantar. Skema: ${JSON.stringify(outputSchema)}`

    const raw = await this.callGemini(prompt, systemInstruction, {
      temperature: options?.temperature ?? 0.2,
      maxTokens: options?.maxTokens ?? 1500,
      jsonMode: true,
    })

    try {
      const cleanJson = raw.replace(/^```json/i, "").replace(/^```/, "").replace(/```$/, "").trim()
      const parsed = JSON.parse(cleanJson) as T
      this.setCache(cacheKey, parsed)
      return parsed
    } catch (e) {
      console.error("[GeminiProvider] Failed to parse JSON:", raw)
      throw new Error(`Invalid JSON format from Gemini: ${e}`)
    }
  }

  async generateQuiz(context: QuizGenerationContext): Promise<GeneratedQuiz> {
    const typesKey = (context.questionTypes || []).sort().join(",")
    const cacheKey = `quiz:${context.course}:${context.topic}:${context.difficulty}:${context.count}:${typesKey}`
    const cached = this.getCached<GeneratedQuiz>(cacheKey)
    if (cached) return cached

    const requestedTypes =
      context.questionTypes && context.questionTypes.length > 0
        ? context.questionTypes
        : ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"]

    const prompt = `Buatkan ${context.count} butir soal asesmen akademik mengenai "${context.topic}" (Mata kuliah: ${context.course}) tingkat kesulitan ${context.difficulty}.
${context.material ? `Materi Pendukung: ${context.material}` : ""}

Tipe soal yang diminta: ${requestedTypes.join(", ")}.

Aturan per jenis tipe soal:
1. SINGLE_CHOICE (Pilihan Ganda 1 Jawaban): "options" harus berisi 4 pilihan opsi (string), "correctAnswer" adalah string salah satu opsi yang benar, "type": "SINGLE_CHOICE".
2. MULTIPLE_CHOICE (Multi Opsi / Lebih dari 1 Jawaban Benar): "options" harus berisi 4 pilihan opsi (string), memiliki 2 atau 3 jawaban yang benar, "correctAnswer" berisi teks opsi-opsi yang benar tersebut dipisahkan dengan koma (contoh: "Opsi A, Opsi C"), "type": "MULTIPLE_CHOICE".
3. ESSAY (Soal Esai / Uraian): "options" diisi array kosong [], "correctAnswer" berisi poin-poin kunci atau rubrik model jawaban esai, "type": "ESSAY".

Skema JSON:
{
  "questions": [
    {
      "question": "teks soal yang jelas dan terstruktur",
      "options": ["opsi A", "opsi B", "opsi C", "opsi D"], // kosong [] untuk ESSAY
      "correctAnswer": "kunci jawaban atau rubrik acuan",
      "explanation": "penjelasan konsep kunci secara ringkas",
      "difficulty": "${context.difficulty}",
      "topic": "${context.topic}",
      "type": "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
    }
  ]
}`

    const result = await this.generateStructured<GeneratedQuiz>(
      prompt,
      {
        questions: [
          {
            question: "string",
            options: ["string"],
            correctAnswer: "string",
            explanation: "string",
            difficulty: "easy | medium | hard",
            topic: "string",
            type: "SINGLE_CHOICE | MULTIPLE_CHOICE | ESSAY",
          },
        ],
      },
      { maxTokens: 2200, temperature: 0.3 }
    )

    this.setCache(cacheKey, result)
    return result
  }

  async analyzePerformance(data: PerformanceAnalysisInput): Promise<PerformanceAnalysis> {
    const cacheKey = `analysis:${JSON.stringify(data.topicTags)}:${JSON.stringify(data.quizResults)}`
    const cached = this.getCached<PerformanceAnalysis>(cacheKey)
    if (cached) return cached

    const prompt = `Analisis performa kuis mahasiswa ini secara ringkas:
Akurasi Topik: ${JSON.stringify(data.topicTags)}
Hasil Kuis: ${JSON.stringify(data.quizResults)}
Riwayat: ${JSON.stringify(data.historicalPerformance)}

Skema JSON:
{
  "strongTopics": ["topik kuat"],
  "weakTopics": ["topik lemah"],
  "recommendedTopics": ["topik latihan"],
  "recommendedDifficulty": "easy" | "medium" | "hard",
  "suggestedPractice": "Saran latihan singkat (maks 2 kalimat)"
}`

    const result = await this.generateStructured<PerformanceAnalysis>(
      prompt,
      {
        strongTopics: ["string"],
        weakTopics: ["string"],
        recommendedTopics: ["string"],
        recommendedDifficulty: "easy | medium | hard",
        suggestedPractice: "string",
      },
      { maxTokens: 600, temperature: 0.2 }
    )

    this.setCache(cacheKey, result)
    return result
  }

  async generateTrainingMaterial(
    topic: string,
    difficulty: string,
    questionCount: number = 5,
    questionTypes: string[] = ["SINGLE_CHOICE"]
  ): Promise<TrainingMaterial> {
    const typesKey = [...questionTypes].sort().join(",")
    const cacheKey = `training:${topic.toLowerCase()}:${difficulty}:${questionCount}:${typesKey}`
    const cached = this.getCached<TrainingMaterial>(cacheKey)
    if (cached) return cached

    const typesDesc = questionTypes.join(", ")
    const prompt = `Anda adalah tutor AI Aksara. Berikan materi remedial untuk topik "${topic}" (tingkat ${difficulty}) dengan ${questionCount} soal latihan.
Tipe soal yang diminta: ${typesDesc}.
Aturan format:
- SINGLE_CHOICE: 4 pilihan dalam array "options", "correctAnswer" adalah string jawaban yang benar, "type": "SINGLE_CHOICE".
- MULTIPLE_CHOICE: 4 pilihan dalam array "options", "correctAnswer" adalah string jawaban benar (dipisahkan koma jika lebih dari 1), "type": "MULTIPLE_CHOICE".
- ESSAY: "options" diisi array kosong [], "correctAnswer" adalah konsep kunci/kata kunci jawaban, "type": "ESSAY".

Penjelasan konsep dan contoh harus ringkas, jelas, dan hemat kata.

Skema JSON:
{
  "explanation": "Penjelasan konsep inti topik ini (2-3 paragraf ringkas)",
  "example": "Contoh kasus atau cuplikan kode singkat",
  "practiceQuestions": [
    {
      "question": "Teks soal",
      "options": ["opsi 1", "opsi 2", "opsi 3", "opsi 4"],
      "correctAnswer": "Jawaban benar",
      "explanation": "Penjelasan kunci",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "type": "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
    }
  ]
}`

    const result = await this.generateStructured<TrainingMaterial>(
      prompt,
      {
        explanation: "string",
        example: "string",
        practiceQuestions: [
          {
            question: "string",
            options: ["string"],
            correctAnswer: "string",
            explanation: "string",
            difficulty: "easy | medium | hard",
            topic: "string",
            type: "SINGLE_CHOICE | MULTIPLE_CHOICE | ESSAY",
          },
        ],
      },
      { maxTokens: 2048, temperature: 0.3 }
    )

    this.setCache(cacheKey, result)
    return result
  }
}
