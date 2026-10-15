import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { env } from "../config/env"

import { prisma } from "../config/database"

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: string
    name?: string | null
    avatar?: string | null
    isVerified?: boolean
    phone?: string | null
    twoFactorEnabled?: boolean
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1]

  if (!token) {
    return res.status(401).json({ error: "Authentication required" })
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as {
      userId: number
      email: string
      role: string
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        avatar: true,
        isVerified: true,
        phone: true,
        twoFactorEnabled: true,
      },
    })

    if (!user) {
      return res.status(401).json({ error: "User not found or session invalid. Please log in again." })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      avatar: user.avatar,
      isVerified: user.isVerified,
      phone: user.phone,
      twoFactorEnabled: user.twoFactorEnabled,
    }
    next()
  } catch (err) {
    console.error("[AUTH_ERROR]", err)
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

export function requireRole(role: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" })
    }

    if (req.user.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }

    next()
  }
}
