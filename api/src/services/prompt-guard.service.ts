import { env } from "../config/env"

export interface GuardCheckResult {
  isSafe: boolean
  score: number // Injection probability: 0 (safe) to 1 (injected)
  blockedReason?: string
}

// In-memory micro-cache for guard checks to minimize external requests & token consumption
const guardCache = new Map<string, { isSafe: boolean; score: number; timestamp: number }>()
const CACHE_TTL_MS = 1000 * 60 * 30 // 30 minutes

/**
 * Checks user input for prompt injections / jailbreaks using Groq meta-llama/llama-prompt-guard-2-86m.
 * Ultra-fast inference (<50ms) with caching to keep requests and token footprint as minimal as possible.
 */
export async function checkPromptGuard(input: string): Promise<GuardCheckResult> {
  const text = input.trim()
  if (!text) {
    return { isSafe: true, score: 0 }
  }

  // Check cache first
  const cacheKey = text.toLowerCase()
  const cached = guardCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { isSafe: cached.isSafe, score: cached.score }
  }

  // If no Groq API Key configured, fallback to basic regex protection
  if (!env.groqApiKey) {
    const isSuspicious = /(ignore\s+all\s+previous|system\s+prompt|reveal\s+instructions|bypass\s+rules|you\s+are\s+now\s+dan|jailbreak)/i.test(text)
    return {
      isSafe: !isSuspicious,
      score: isSuspicious ? 0.9 : 0.0,
      blockedReason: isSuspicious ? "Pesan terdeteksi mengandung manipulasi instruksi (Prompt Injection)." : undefined,
    }
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.groqApiKey}`,
      },
      body: JSON.stringify({
        model: env.groqGuardModel || "meta-llama/llama-prompt-guard-2-86m",
        messages: [{ role: "user", content: text }],
        max_tokens: 5,
        temperature: 0,
      }),
    })

    if (!res.ok) {
      console.warn(`[Groq Guard] API returned status ${res.status}, continuing gracefully`)
      return { isSafe: true, score: 0 }
    }

    const data: any = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim() || ""
    const score = parseFloat(content) || 0

    // Score > 0.5 indicates prompt injection risk
    const isSafe = score < 0.5

    // Store in cache
    guardCache.set(cacheKey, { isSafe, score, timestamp: Date.now() })

    // Keep cache bounded
    if (guardCache.size > 2000) {
      const oldestKey = guardCache.keys().next().value
      if (oldestKey) guardCache.delete(oldestKey)
    }

    return {
      isSafe,
      score,
      blockedReason: isSafe ? undefined : "Pesan terdeteksi mengandung manipulasi instruksi (Prompt Injection) dan ditolak demi keamanan sistem.",
    }
  } catch (err) {
    console.warn("[Groq Guard] Connection error:", err)
    // Fail-open on network issues so learning flow isn't blocked, with safe fallback
    return { isSafe: true, score: 0 }
  }
}
