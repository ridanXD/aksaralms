import express from "express"
import cors from "cors"
import helmet from "helmet"
import cookieParser from "cookie-parser"
import rateLimit from "express-rate-limit"
import dotenv from "dotenv"
import routes from "./routes"
import { errorHandler } from "./middleware/errorHandler"
import { env } from "./config/env"

dotenv.config()

const app = express()

// Middleware
app.use(helmet())
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json({ limit: "50mb" }))
app.use(express.urlencoded({ extended: true, limit: "50mb" }))
app.use(cookieParser())

// Rate limiting
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  })
)

// Routes
app.use("/api", routes)

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() })
})

// Error handler (must be last)
app.use(errorHandler)

app.listen(env.port, () => {
  console.log(`EdTech API server running on port ${env.port}`)
})
