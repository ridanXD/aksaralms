import { AIProvider, QuizGenerationContext, GeneratedQuiz, PerformanceAnalysisInput, PerformanceAnalysis, GeneratedQuestion, TrainingMaterial } from "./ai.provider"

/**
 * MiMo V2.5 Pro provider — implements the AIProvider interface using
 * an OpenAI-compatible API.
 */
export class MimoProvider implements AIProvider {
  name = "mimo"
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor(apiKey: string, baseUrl: string, model?: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
    this.model = model ?? "laguna-s21"
  }

  private async fetch(path: string, body: unknown): Promise<unknown> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`AI API error (${res.status}): ${text}`)
    }

    return res.json() as unknown
  }

  async generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string> {
    const resp = await this.fetch("/chat/completions", {
      model: this.model,
      messages: [{ role: "user", content: prompt }],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1000,
    }) as { choices?: Array<{ message?: { content?: string } }> }

    const content = resp.choices?.[0]?.message?.content
    if (!content) throw new Error("No text content returned from AI")
    return content
  }

  async generateStructured<T>(
    prompt: string,
    outputSchema: Record<string, unknown>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T> {
    const systemPrompt =
      "Respond only with valid JSON. Do not include any text before or after the JSON."
    const schemaPrompt = `${prompt}\n\nJSON schema: ${JSON.stringify(outputSchema)}`

    const resp = await this.fetch("/chat/completions", {
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: schemaPrompt },
      ],
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      response_format: { type: "json_object" },
    }) as { choices?: Array<{ message?: { content?: string } }> }

    const content = resp.choices?.[0]?.message?.content
    if (!content) throw new Error("No JSON content returned from AI")

    const parsed = JSON.parse(content) as T
    return parsed
  }

  async generateQuiz(context: QuizGenerationContext): Promise<GeneratedQuiz> {
    const prompt = `Generate ${context.count} multiple-choice questions about ${context.topic} at ${context.difficulty} difficulty.
Course: ${context.course}
${context.material ? `Material: ${context.material}` : ""}

Each question must have exactly 4 options (A, B, C, D), one correct answer, an explanation, and a topic tag.

Return ONLY valid JSON matching this schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "string"
    }
  ]
}`

    return this.generateStructured<{ questions: GeneratedQuestion[] }>(prompt, {
      questions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4,
            },
            correctAnswer: { type: "string" },
            explanation: { type: "string" },
            difficulty: {
              type: "string",
              enum: ["easy", "medium", "hard"],
            },
            topic: { type: "string" },
          },
          required: [
            "question",
            "options",
            "correctAnswer",
            "explanation",
            "difficulty",
            "topic",
          ],
        },
      },
    })
  }

  async analyzePerformance(
    data: PerformanceAnalysisInput
  ): Promise<PerformanceAnalysis> {
    const prompt = `Analyze the following quiz performance data and return insights in JSON format.
Topic accuracy: ${JSON.stringify(data.topicTags)}
Quiz results: ${JSON.stringify(data.quizResults)}
Historical performance: ${JSON.stringify(data.historicalPerformance)}

Return ONLY valid JSON:
{
  "strongTopics": ["string"],
  "weakTopics": ["string"],
  "recommendedTopics": ["string"],
  "recommendedDifficulty": "easy" | "medium" | "hard",
  "suggestedPractice": "string"
}`

    return this.generateStructured<PerformanceAnalysis>(prompt, {
      strongTopics: { type: "array", items: { type: "string" } },
      weakTopics: { type: "array", items: { type: "string" } },
      recommendedTopics: { type: "array", items: { type: "string" } },
      recommendedDifficulty: {
        type: "string",
        enum: ["easy", "medium", "hard"],
      },
      suggestedPractice: { type: "string" },
    })
  }

  async generateTrainingMaterial(
    topic: string,
    difficulty: string,
    questionCount: number = 5,
    questionTypes: string[] = ["SINGLE_CHOICE"]
  ): Promise<TrainingMaterial> {
    const typesDesc = questionTypes.join(", ")
    const prompt = `You are an AI tutor. Provide a clear explanation, a relevant example, and ${questionCount} practice questions about ${topic} at ${difficulty} difficulty.
Supported question types to generate: ${typesDesc}.
For SINGLE_CHOICE: 4 options, 1 correctAnswer string. type="SINGLE_CHOICE".
For MULTIPLE_CHOICE: 4 options, correctAnswer is comma-separated correct options or multiple valid choices, type="MULTIPLE_CHOICE".
For ESSAY: options can be empty array [], correctAnswer is key concept or model answer keywords, explanation explains key grading points, type="ESSAY".

Return ONLY valid JSON in this exact structure:
{
  "explanation": "string",
  "example": "string",
  "practiceQuestions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctAnswer": "string",
      "explanation": "string",
      "difficulty": "easy" | "medium" | "hard",
      "topic": "string",
      "type": "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
    }
  ]
}`

    const result = await this.generateStructured<{
      explanation: string
      example: string
      practiceQuestions: GeneratedQuestion[]
    }>(prompt, {
      explanation: { type: "string" },
      example: { type: "string" },
      practiceQuestions: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
            },
            correctAnswer: { type: "string" },
            explanation: { type: "string" },
            difficulty: {
              type: "string",
              enum: ["easy", "medium", "hard"],
            },
            topic: { type: "string" },
            type: {
              type: "string",
              enum: ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "ESSAY"],
            },
          },
          required: [
            "question",
            "options",
            "correctAnswer",
            "explanation",
            "difficulty",
            "topic",
          ],
        },
      },
    })

    return result as TrainingMaterial
  }
}
