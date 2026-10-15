import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/database"
import { sendVerificationEmail } from "../services/email.service"
import bcrypt from "bcryptjs"
import { z } from "zod"

// ─── 1. Send Verification Code ─────────────────────────────

const sendVerificationSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  type: z.enum(["ACCOUNT_VERIFICATION", "PASSWORD_RESET"]),
})

export async function sendVerificationCode(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = sendVerificationSchema.parse(req.body)
    const email = parsed.email.toLowerCase().trim()

    // If reset password, verify user exists
    const user = await prisma.user.findUnique({ where: { email } })
    if (parsed.type === "PASSWORD_RESET" && !user) {
      return res.status(404).json({ error: "Alamat email tidak terdaftar dalam sistem." })
    }

    // Rate limiting: 60-second cooldown between requests
    const recentCode = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: parsed.type,
        createdAt: { gte: new Date(Date.now() - 60 * 1000) },
      },
    })
    if (recentCode) {
      return res
        .status(429)
        .json({ error: "Mohon tunggu 60 detik sebelum meminta kode verifikasi baru." })
    }

    // Invalidate previous unused codes for this email and type
    await prisma.verificationCode.updateMany({
      where: { email, type: parsed.type, used: false },
      data: { used: true },
    })

    // Generate 6-digit numeric OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.verificationCode.create({
      data: {
        email,
        code,
        type: parsed.type,
        expiresAt,
        used: false,
        attempts: 0,
      },
    })

    // Send email via Resend
    const sendResult = await sendVerificationEmail({
      to: email,
      code,
      type: parsed.type,
    })

    if (!sendResult.success) {
      // Clean up code if email failed to deliver so user is not stuck
      await prisma.verificationCode.deleteMany({
        where: { email, code },
      })
      return res.status(400).json({
        error: sendResult.error || "Gagal mengirimkan email verifikasi.",
      })
    }

    res.json({
      message: "Kode verifikasi 6 digit telah dikirim ke alamat email Anda.",
      expiresAt,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Input tidak valid" })
    }
    next(err)
  }
}

// ─── 2. Verify Account ─────────────────────────────────────

const verifyAccountSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  code: z.string().length(6, "Kode verifikasi harus 6 digit"),
})

export async function verifyAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = verifyAccountSchema.parse(req.body)
    const email = parsed.email.toLowerCase().trim()
    const code = parsed.code.trim()

    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "ACCOUNT_VERIFICATION",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return res.status(400).json({
        error: "Kode verifikasi tidak ditemukan atau telah kedaluwarsa. Silakan minta kode baru.",
      })
    }

    if (record.attempts >= 5) {
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })
      return res.status(400).json({
        error: "Terlalu banyak percobaan yang salah. Silakan minta kode baru.",
      })
    }

    if (record.code !== code) {
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      })
      return res.status(400).json({ error: "Kode verifikasi salah. Silakan periksa kembali." })
    }

    // Mark code used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // Update user isVerified
    await prisma.user.updateMany({
      where: { email },
      data: { isVerified: true },
    })

    res.json({ message: "Akun dan email Anda berhasil diverifikasi." })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Input tidak valid" })
    }
    next(err)
  }
}

// ─── 3. Reset Password ─────────────────────────────────────

const resetPasswordSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  code: z.string().length(6, "Kode verifikasi harus 6 digit"),
  newPassword: z.string().min(6, "Password baru minimal 6 karakter"),
})

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = resetPasswordSchema.parse(req.body)
    const email = parsed.email.toLowerCase().trim()
    const code = parsed.code.trim()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." })
    }

    const record = await prisma.verificationCode.findFirst({
      where: {
        email,
        type: "PASSWORD_RESET",
        used: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })

    if (!record) {
      return res.status(400).json({
        error: "Kode verifikasi reset password tidak valid atau telah kedaluwarsa.",
      })
    }

    if (record.attempts >= 5) {
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { used: true },
      })
      return res.status(400).json({
        error: "Batas percobaan kode telah habis. Silakan minta kode verifikasi baru.",
      })
    }

    if (record.code !== code) {
      await prisma.verificationCode.update({
        where: { id: record.id },
        data: { attempts: { increment: 1 } },
      })
      return res.status(400).json({ error: "Kode verifikasi 6 digit tidak sesuai." })
    }

    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: record.id },
      data: { used: true },
    })

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(parsed.newPassword, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    })

    res.json({ message: "Kata sandi Anda berhasil diperbarui. Silakan masuk kembali." })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: err.errors[0]?.message || "Input tidak valid" })
    }
    next(err)
  }
}
