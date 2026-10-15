/**
 * AI Provider Abstraction
 * The application uses a provider interface so the AI backend can be swapped
 * (LongCat, MiMo, etc.) without changing application logic.
 */

export interface AIProvider {
  name: string
  generateText(
    prompt: string,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<string>
  generateStructured<T>(
    prompt: string,
    outputSchema: Record<string, unknown>,
    options?: { temperature?: number; maxTokens?: number }
  ): Promise<T>
  generateQuiz(
    context: QuizGenerationContext
  ): Promise<GeneratedQuiz>
  analyzePerformance(
    data: PerformanceAnalysisInput
  ): Promise<PerformanceAnalysis>
  generateTrainingMaterial(
    topic: string,
    difficulty: string,
    questionCount?: number,
    questionTypes?: string[]
  ): Promise<TrainingMaterial>
}

export interface QuizGenerationContext {
  course: string
  topic: string
  material?: string
  difficulty: "easy" | "medium" | "hard"
  count: number
  questionTypes?: string[]
}

export interface GeneratedQuiz {
  questions: GeneratedQuestion[]
}

export interface GeneratedQuestion {
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  difficulty: "easy" | "medium" | "hard"
  topic: string
  type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
}

export interface PerformanceAnalysisInput {
  quizResults: {
    topic: string
    correct: boolean
    responseTimeMs: number
  }[]
  topicTags: Record<string, { correct: number; total: number }>
  historicalPerformance: Record<string, number>
}

export interface PerformanceAnalysis {
  strongTopics: string[]
  weakTopics: string[]
  recommendedTopics: string[]
  recommendedDifficulty: "easy" | "medium" | "hard"
  suggestedPractice: string
}

export interface TrainingMaterial {
  explanation: string
  example: string
  practiceQuestions: GeneratedQuestion[]
}
