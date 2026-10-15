import { env } from "../config/env"

interface SendEmailParams {
  to: string
  code: string
  type: "ACCOUNT_VERIFICATION" | "PASSWORD_RESET"
}

interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

/**
 * Send OTP Verification Email via Resend API
 */
export async function sendVerificationEmail({
  to,
  code,
  type,
}: SendEmailParams): Promise<SendEmailResult> {
  const isReset = type === "PASSWORD_RESET"
  const title = isReset ? "Reset Password Aksara LMS" : "Verifikasi Akun Aksara LMS"
  const subject = `${title}: ${code}`
  const description = isReset
    ? "Kami menerima permintaan pengaturan ulang kata sandi untuk akun Aksara LMS Anda. Gunakan kode verifikasi di bawah ini untuk melanjutkan:"
    : "Terima kasih telah bergabung di Aksara LMS. Masukkan kode verifikasi berikut untuk mengonfirmasi email dan mengaktifkan akun Anda secara penuh:"

  const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 24px; color: #18181b; }
    .container { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px 28px; border: 1px solid #e4e4e7; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); }
    .brand { font-size: 20px; font-weight: 800; color: #18181b; text-align: center; margin-bottom: 24px; letter-spacing: -0.5px; }
    .brand span { color: #2563eb; }
    .title { font-size: 16px; font-weight: 700; color: #09090b; margin-bottom: 12px; }
    .desc { font-size: 13px; line-height: 1.6; color: #52525b; margin-bottom: 24px; }
    .code-box { background: #f8fafc; border: 2px dashed #93c5fd; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
    .code { font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; }
    .meta { font-size: 11px; color: #71717a; text-align: center; margin-top: 8px; }
    .warning { font-size: 11px; color: #a1a1aa; line-height: 1.5; border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand">Aksara <span>LMS</span></div>
    <div class="title">${title}</div>
    <div class="desc">${description}</div>

    <div class="code-box">
      <div class="code">${code}</div>
      <div class="meta">Berlaku selama 15 menit</div>
    </div>

    <div class="warning">
      PENTING: Jangan berikan kode ini kepada siapa pun termasuk pihak yang mengatasnamakan Aksara LMS.<br>
      Jika Anda tidak melakukan permintaan ini, akun Anda tetap aman dan Anda dapat mengabaikan email ini.
    </div>
  </div>
</body>
</html>
`

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.resendApiKey}`,
      },
      body: JSON.stringify({
        from: env.resendFromEmail || "Aksara LMS <onboarding@resend.dev>",
        to: [to],
        subject,
        html: htmlContent,
      }),
    })

    const data: any = await res.json()

    if (!res.ok) {
      console.error(`[Resend Error ${res.status}]:`, data)
      return {
        success: false,
        error: data?.message || "Gagal mengirim email melalui Resend.",
      }
    }

    return {
      success: true,
      id: data?.id,
    }
  } catch (err: any) {
    console.error("[Resend Network Error]:", err)
    return {
      success: false,
      error: err.message || "Gagal menghubungi server Resend.",
    }
  }
}
