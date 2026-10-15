import { PrismaClient } from "@prisma/client"

declare global {
  // Allow global Prisma client in development to prevent exhausting DB connections
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: ["query"],
  })

if (process.env.NODE_ENV !== "production") global.prisma = prisma
