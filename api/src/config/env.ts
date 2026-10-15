import dotenv from "dotenv"
dotenv.config({ override: true })

function getEnv(key: string, fallback = ""): string {
  return process.env[key] || fallback
}

export const env = {
  port: parseInt(getEnv("API_PORT", getEnv("PORT", "8080")), 10),
  databaseUrl: getEnv("DATABASE_URL"),
  jwtSecret: getEnv("JWT_SECRET", "dev-secret-key-change-in-prod"),
  aiProvider: getEnv("AI_PROVIDER", "gemini"),
  aiApiKey: getEnv("AI_API_KEY"),
  aiBaseUrl: getEnv("AI_BASE_URL", "https://api.mimo.ai/v1"),
  aiModel: getEnv("AI_MODEL", "gemini-3.5-flash-lite"),
  // Google AI Studio Gemini configuration
  geminiApiKey: getEnv("GEMINI_API_KEY", getEnv("AI_API_KEY")),
  geminiModel: getEnv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
  // Groq Prompt Guard configuration
  groqApiKey: getEnv("GROQ_API_KEY"),
  groqGuardModel: getEnv("GROQ_GUARD_MODEL", "meta-llama/llama-prompt-guard-2-86m"),
  // Resend Email Delivery
  resendApiKey: getEnv("RESEND_API_KEY"),
  resendFromEmail: getEnv("RESEND_FROM_EMAIL", "Aksara LMS <onboarding@resend.dev>"),
  nodeEnv: getEnv("NODE_ENV", "development"),
} as const
