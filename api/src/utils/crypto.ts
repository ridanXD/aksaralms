import crypto from "crypto"
import { env } from "../config/env"

// Derive a 32-byte encryption key from the environment secret
const ENCRYPTION_KEY: Buffer = crypto
  .createHash("sha256")
  .update((env.jwtSecret || "aksara-super-secure-attendance-secret") + ":attendance-gcm-v1")
  .digest()

export interface AttendancePayload {
  code: string
  sessionId: number
  courseId: number
  expiresAt: number // epoch ms
  issuedAt: number // epoch ms
}

/**
 * Encrypts attendance session credentials using AES-256-GCM.
 * Produces an authenticated, tamper-proof, URL-safe base64url token.
 */
export function encryptAttendanceToken(payload: AttendancePayload): string {
  const iv = crypto.randomBytes(12) // 96-bit nonce for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY as any, iv as any)

  const jsonStr = JSON.stringify(payload)
  const part1 = cipher.update(jsonStr, "utf8")
  const part2 = cipher.final()
  const encrypted = Buffer.concat([part1 as any, part2 as any])
  const authTag = cipher.getAuthTag() // 128-bit authentication tag

  // Format: iv(12) + authTag(16) + ciphertext
  const combined = Buffer.concat([iv as any, authTag as any, encrypted as any])
  return combined.toString("base64url")
}

/**
 * Decrypts and validates an AES-256-GCM attendance token.
 * Returns null if the token has been altered, tampered with, or corrupted.
 */
export function decryptAttendanceToken(token: string): AttendancePayload | null {
  try {
    const buffer = Buffer.from(token.trim(), "base64url")
    if (buffer.length < 28) return null // 12 bytes IV + 16 bytes Tag = 28 bytes minimum

    const iv = buffer.subarray(0, 12)
    const authTag = buffer.subarray(12, 28)
    const ciphertext = buffer.subarray(28)

    const decipher = crypto.createDecipheriv("aes-256-gcm", ENCRYPTION_KEY as any, iv as any)
    decipher.setAuthTag(authTag as any)

    const part1 = decipher.update(ciphertext as any)
    const part2 = decipher.final()
    const decrypted = Buffer.concat([part1 as any, part2 as any])
    const payload = JSON.parse(decrypted.toString("utf8")) as AttendancePayload

    return payload
  } catch (_e) {
    return null
  }
}

/**
 * Generates a cryptographically strong 6-character attendance code.
 * Uses unambiguous characters (excluding easily confused characters like O, 0, I, 1).
 */
export function generateSecureAttendanceCode(): string {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.randomBytes(6)
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += charset[bytes[i] % charset.length]
  }
  return result
}
