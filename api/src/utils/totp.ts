import crypto from "crypto"
import QRCode from "qrcode"

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

/**
 * Generate a random base32 encoded secret for TOTP (Google Authenticator)
 */
export function generateBase32Secret(byteLength: number = 20): string {
  const bytes = crypto.randomBytes(byteLength)
  let bits = ""
  for (let i = 0; i < bytes.length; i++) {
    bits += bytes[i].toString(2).padStart(8, "0")
  }
  let secret = ""
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    const chunk = bits.substring(i, i + 5)
    secret += BASE32_ALPHABET[parseInt(chunk, 2)]
  }
  return secret
}

/**
 * Decode base32 string to Buffer
 */
export function decodeBase32(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/[^A-Z2-7]/g, "")
  let bits = ""
  for (const char of cleanStr) {
    const val = BASE32_ALPHABET.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, "0")
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

/**
 * Generate standard RFC 6238 TOTP 6-digit code
 */
export function generateTOTP(
  secretBase32: string,
  timeStepSeconds: number = 30,
  counterOffset: number = 0
): string {
  const epoch = Math.floor(Date.now() / 1000)
  const timeStep = Math.floor(epoch / timeStepSeconds) + counterOffset
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigUInt64BE(BigInt(timeStep))

  const key = decodeBase32(secretBase32)
  const hmac = crypto.createHmac("sha1", key as unknown as crypto.BinaryLike).update(timeBuffer as unknown as crypto.BinaryLike).digest()

  // Dynamic truncation (RFC 4226)
  const offset = hmac[hmac.length - 1] & 0x0f
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)

  const otp = binary % 1000000
  return otp.toString().padStart(6, "0")
}

/**
 * Verify a 6-digit TOTP code against the secret.
 * Allows window of +/- 1 time step (30 seconds) to tolerate small clock drift.
 */
export function verifyTOTP(token: string, secretBase32: string, window: number = 1): boolean {
  if (!token) return false
  const cleanToken = token.trim().replace(/\s+/g, "")
  if (cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return false
  }

  for (let offset = -window; offset <= window; offset++) {
    if (generateTOTP(secretBase32, 30, offset) === cleanToken) {
      return true
    }
  }
  return false
}

/**
 * Format otpauth:// URL for Google Authenticator / TOTP apps
 */
export function getOtpAuthUrl(email: string, secret: string, issuer: string = "Aksara LMS"): string {
  const encodedIssuer = encodeURIComponent(issuer)
  const encodedEmail = encodeURIComponent(email)
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`
}

/**
 * Generate base64 Data URL QR code
 */
export async function generateQRCode(otpAuthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpAuthUrl, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 256,
    color: {
      dark: "#18181B",
      light: "#FFFFFF",
    },
  })
}

/**
 * Generate 8 human-readable backup recovery codes (format: XXXX-XXXX)
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = []
  const charset = "0123456789ABCDEF"
  for (let i = 0; i < count; i++) {
    let part1 = ""
    let part2 = ""
    const bytes = crypto.randomBytes(8)
    for (let j = 0; j < 4; j++) {
      part1 += charset[bytes[j] % charset.length]
      part2 += charset[bytes[j + 4] % charset.length]
    }
    codes.push(`${part1}-${part2}`)
  }
  return codes
}
