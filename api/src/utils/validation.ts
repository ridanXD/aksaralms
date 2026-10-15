import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
  role: z.enum(["STUDENT", "TEACHER"]).optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

export function validateBody<T extends z.ZodSchema>(schema: T) {
  return (req: { body: unknown }, _res: unknown, next: (err?: unknown) => void) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(result.error)
      return
    }
    req.body = result.data
    next()
  }
}
