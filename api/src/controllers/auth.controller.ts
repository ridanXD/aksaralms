import { Request, Response, NextFunction } from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { env } from "../config/env"
import { prisma } from "../config/database"
import { registerSchema, loginSchema } from "../utils/validation"
import { z } from "zod"
import { AuthRequest } from "../middleware/auth"
import {
  generateBase32Secret,
  getOtpAuthUrl,
  generateQRCode,
  verifyTOTP,
  generateBackupCodes,
} from "../utils/totp"

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (existing) {
      return res.status(409).json({ error: "Email already registered" })
    }

    const hashedPassword = await bcrypt.hash(parsed.password, 12)
    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        password: hashedPassword,
        name: parsed.name,
        role: parsed.role || "STUDENT",
        isVerified: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isVerified: true,
        phone: true,
        twoFactorEnabled: true,
      },
    })

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: "7d" }
    )

    res
      .status(201)
      .cookie("token", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ user, token })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    next(err)
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    })

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    const valid = await bcrypt.compare(parsed.password, user.password)
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Check if Google Authenticator 2FA is enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      const code = req.body.code as string | undefined
      if (code) {
        // Verify 2FA code or backup code
        const isTotpValid = verifyTOTP(code, user.twoFactorSecret)
        let usedBackupCode = false
        let remainingBackupCodes: string[] = []

        if (!isTotpValid && user.twoFactorBackupCodes) {
          try {
            const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
            const normalized = code.trim().toUpperCase()
            const idx = codes.findIndex((c) => c.toUpperCase() === normalized)
            if (idx !== -1) {
              usedBackupCode = true
              codes.splice(idx, 1)
              remainingBackupCodes = codes
            }
          } catch (_e) {}
        }

        if (!isTotpValid && !usedBackupCode) {
          return res.status(400).json({ error: "Kode verifikasi 2FA atau kode cadangan tidak valid." })
        }

        if (usedBackupCode) {
          await prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(remainingBackupCodes) },
          })
        }
      } else {
        // 2FA required - issue short-lived temporary token
        const tempToken = jwt.sign(
          { userId: user.id, email: user.email, purpose: "2fa_verification" },
          env.jwtSecret,
          { expiresIn: "5m" }
        )
        return res.json({
          requiresTwoFactor: true,
          tempToken,
          email: user.email,
          message: "Masukkan 6-digit kode dari Google Authenticator Anda.",
        })
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: "7d" }
    )

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          phone: user.phone,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token,
      })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    next(err)
  }
}

export async function me(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" })
  }
  res.json({ user: req.user })
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { name, avatar, email, phone, twoFactorEnabled } = req.body

    // Validate avatar size if provided (max 200KB = 204,800 bytes)
    if (avatar && typeof avatar === "string") {
      // In base64, each 4 characters represent 3 bytes
      // Strip metadata if present: data:image/...;base64,
      const base64Data = avatar.includes(",") ? avatar.split(",")[1] : avatar
      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4)
      if (sizeInBytes > 200 * 1024) {
        return res.status(400).json({ error: "Ukuran foto melebihi batas maksimal 200 KB." })
      }
    }

    if (email && typeof email === "string" && email !== req.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return res.status(400).json({ error: "Email sudah digunakan oleh akun lain." })
      }
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(avatar !== undefined ? { avatar } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(twoFactorEnabled !== undefined ? { twoFactorEnabled: Boolean(twoFactorEnabled) } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isVerified: true,
        phone: true,
        twoFactorEnabled: true,
      },
    })

    res.json({ user: updated, message: "Pengaturan profil berhasil diperbarui" })
  } catch (err) {
    next(err)
  }
}

export async function logout(_req: Request, res: Response) {
  res
    .clearCookie("token")
    .json({ message: "Logged out successfully" })
}

const googleAuthSchema = z.object({
  idToken: z.string().optional(),
  email: z.string().email("Format email tidak valid"),
  name: z.string().optional(),
  avatar: z.string().optional().nullable(),
  role: z.enum(["STUDENT", "TEACHER"]).optional().default("STUDENT"),
})

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = googleAuthSchema.parse(req.body)
    const email = parsed.email.toLowerCase().trim()

    let user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Generate a strong random password for Google-authenticated users
      const randomPassword =
        Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10)
      const hashedPassword = await bcrypt.hash(randomPassword, 12)
      const displayName = parsed.name?.trim() || email.split("@")[0]

      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: displayName,
          role: parsed.role || "STUDENT",
          avatar: parsed.avatar || null,
          isVerified: true,
        },
      })
    } else {
      // Update avatar if currently null and Google provides one
      if (!user.avatar && parsed.avatar) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: parsed.avatar },
        })
      }
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: "7d" }
    )

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          phone: user.phone,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token,
      })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors })
    }
    next(err)
  }
}

/**
 * ─── 2FA GOOGLE AUTHENTICATOR CONTROLLERS ──────────────────────────────────────
 */

/**
 * Complete login verification using 6-digit TOTP code or backup code
 */
export async function verifyLogin2FA(req: Request, res: Response, next: NextFunction) {
  try {
    const { tempToken, code } = req.body
    if (!tempToken || !code) {
      return res.status(400).json({ error: "Token sementara dan kode verifikasi 6-digit diperlukan." })
    }

    const decoded = jwt.verify(tempToken, env.jwtSecret) as {
      userId: number
      email: string
      purpose?: string
    }

    if (decoded.purpose !== "2fa_verification") {
      return res.status(401).json({ error: "Sesi verifikasi 2FA tidak valid." })
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: "Pengguna tidak mengaktifkan 2FA." })
    }

    // 1. Check TOTP Code
    const isTotpValid = verifyTOTP(code, user.twoFactorSecret)
    let usedBackupCode = false
    let remainingBackupCodes: string[] = []

    // 2. Check Backup Code if TOTP invalid
    if (!isTotpValid && user.twoFactorBackupCodes) {
      try {
        const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
        const normalized = code.trim().toUpperCase()
        const idx = codes.findIndex((c) => c.toUpperCase() === normalized)
        if (idx !== -1) {
          usedBackupCode = true
          codes.splice(idx, 1)
          remainingBackupCodes = codes
        }
      } catch (_e) {}
    }

    if (!isTotpValid && !usedBackupCode) {
      return res.status(400).json({
        error: "Kode Google Authenticator atau kode cadangan tidak valid / telah kedaluwarsa.",
      })
    }

    if (usedBackupCode) {
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorBackupCodes: JSON.stringify(remainingBackupCodes) },
      })
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.jwtSecret,
      { expiresIn: "7d" }
    )

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: env.nodeEnv === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
          isVerified: user.isVerified,
          phone: user.phone,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        token,
        usedBackupCode,
        backupCodesRemaining: usedBackupCode ? remainingBackupCodes.length : undefined,
      })
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        error: "Sesi verifikasi 2FA telah kedaluwarsa (maks 5 menit). Silakan ulangi login.",
      })
    }
    next(err)
  }
}

/**
 * Generate 2FA secret, otpauth URL, and QR Code for setup
 */
export async function setup2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Generate new base32 secret
    const secret = generateBase32Secret(20)
    const otpAuthUrl = getOtpAuthUrl(user.email, secret, "Aksara LMS")
    const qrCode = await generateQRCode(otpAuthUrl)

    // Store secret as pending (twoFactorEnabled remains false until verified)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    })

    res.json({
      secret,
      otpAuthUrl,
      qrCode,
      issuer: "Aksara LMS",
      account: user.email,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Confirm 2FA setup by verifying first 6-digit code from Google Authenticator
 */
export async function verifySetup2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { code } = req.body
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Kode verifikasi 6-digit diperlukan." })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user || !user.twoFactorSecret) {
      return res.status(400).json({
        error: "Sesi inisialisasi 2FA belum dimulai. Silakan muat ulang kode QR.",
      })
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret)
    if (!isValid) {
      return res.status(400).json({
        error: "Kode verifikasi salah atau telah kedaluwarsa. Pastikan jam pada perangkat Anda telah sinkron.",
      })
    }

    // Generate 8 backup recovery codes
    const backupCodes = generateBackupCodes(8)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: JSON.stringify(backupCodes),
      },
    })

    res.json({
      success: true,
      message: "Google Authenticator 2FA berhasil diaktifkan!",
      backupCodes,
      twoFactorEnabled: true,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * Disable 2FA with password or 6-digit code confirmation
 */
export async function disable2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { code, password } = req.body

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: "2FA belum diaktifkan pada akun ini." })
    }

    let isAuthorized = false

    // Option A: verify password
    if (password && typeof password === "string") {
      isAuthorized = await bcrypt.compare(password, user.password)
    }

    // Option B: verify 6-digit code or backup code
    if (!isAuthorized && code && user.twoFactorSecret) {
      isAuthorized = verifyTOTP(code, user.twoFactorSecret)
      if (!isAuthorized && user.twoFactorBackupCodes) {
        try {
          const codes: string[] = JSON.parse(user.twoFactorBackupCodes)
          const normalized = code.trim().toUpperCase()
          isAuthorized = codes.some((c) => c.toUpperCase() === normalized)
        } catch (_e) {}
      }
    }

    if (!isAuthorized) {
      return res.status(400).json({
        error: "Konfirmasi gagal. Masukkan password akun atau kode 6-digit Google Authenticator yang valid.",
      })
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: null,
      },
    })

    res.json({
      success: true,
      message: "2FA Google Authenticator berhasil dinonaktifkan.",
      twoFactorEnabled: false,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * View remaining backup recovery codes
 */
export async function getBackupCodes2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { twoFactorEnabled: true, twoFactorBackupCodes: true },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorBackupCodes) {
      return res.json({ backupCodes: [] })
    }

    try {
      const backupCodes: string[] = JSON.parse(user.twoFactorBackupCodes)
      return res.json({ backupCodes })
    } catch (_e) {
      return res.json({ backupCodes: [] })
    }
  } catch (err) {
    next(err)
  }
}

/**
 * Regenerate 8 new backup recovery codes
 */
export async function regenerateBackupCodes2FA(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" })
    }

    const { code } = req.body
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    })

    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ error: "2FA tidak aktif pada akun ini." })
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret)
    if (!isValid) {
      return res.status(400).json({
        error: "Kode verifikasi 6-digit salah atau kedaluwarsa.",
      })
    }

    const newCodes = generateBackupCodes(8)
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorBackupCodes: JSON.stringify(newCodes) },
    })

    res.json({
      success: true,
      message: "Kode cadangan baru berhasil dibuat.",
      backupCodes: newCodes,
    })
  } catch (err) {
    next(err)
  }
}

