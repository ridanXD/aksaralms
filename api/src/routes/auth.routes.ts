import { Router } from "express"
import {
  register,
  login,
  me,
  logout,
  updateProfile,
  googleAuth,
  verifyLogin2FA,
  setup2FA,
  verifySetup2FA,
  disable2FA,
  getBackupCodes2FA,
  regenerateBackupCodes2FA,
} from "../controllers/auth.controller"
import {
  sendVerificationCode,
  verifyAccount,
  resetPassword,
} from "../controllers/verification.controller"
import { requireAuth } from "../middleware/auth"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/google", googleAuth)
router.get("/me", requireAuth, me)
router.put("/profile", requireAuth, updateProfile)
router.post("/logout", logout)

// 2FA Google Authenticator Endpoints
router.post("/2fa/verify-login", verifyLogin2FA)
router.get("/2fa/setup", requireAuth, setup2FA)
router.post("/2fa/verify-setup", requireAuth, verifySetup2FA)
router.post("/2fa/disable", requireAuth, disable2FA)
router.get("/2fa/backup-codes", requireAuth, getBackupCodes2FA)
router.post("/2fa/regenerate-backup-codes", requireAuth, regenerateBackupCodes2FA)

// Verification & Reset Password (Resend OTP)
router.post("/send-verification", sendVerificationCode)
router.post("/verify-account", verifyAccount)
router.post("/reset-password", resetPassword)

export default router
