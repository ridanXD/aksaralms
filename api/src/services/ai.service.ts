import { AIProvider } from "./ai.provider"
import { GeminiProvider } from "./gemini.provider"
import { MimoProvider } from "./mimo.provider"
import { LongCatProvider } from "./longcat.provider"
import { env } from "../config/env"

let provider: AIProvider | null = null

export function getAIProvider(): AIProvider {
  if (provider) return provider

  if (env.aiProvider === "gemini" || env.geminiApiKey) {
    provider = new GeminiProvider(env.geminiApiKey || env.aiApiKey, env.geminiModel || env.aiModel)
  } else if (env.aiProvider === "longcat") {
    provider = new LongCatProvider(env.aiApiKey, env.aiBaseUrl)
  } else {
    provider = new MimoProvider(env.aiApiKey, env.aiBaseUrl, env.aiModel)
  }

  return provider
}
