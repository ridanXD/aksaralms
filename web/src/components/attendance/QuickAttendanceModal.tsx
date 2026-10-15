"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import jsQR from "jsqr"
import { checkIn } from "@/lib/api"

interface QuickAttendanceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type Mode = "camera" | "manual"

function playSuccessBeep() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = "sine"
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.2)
  } catch {
    // AudioContext not allowed or not supported
  }
}

export function QuickAttendanceModal({ isOpen, onClose, onSuccess }: QuickAttendanceModalProps) {
  const [mode, setMode] = useState<Mode>("camera")
  const [code, setCode] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [cameraError, setCameraError] = useState("")
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const isScanningRef = useRef<boolean>(false)

  // Stop camera tracks cleanly
  const stopCamera = useCallback(() => {
    isScanningRef.current = false
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  // Parse QR code payload (either raw code, encrypted token, or URL with query params)
  const parseQRPayload = (raw: string): string => {
    const trimmed = raw.trim()
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        const url = new URL(trimmed)
        const tokenParam = url.searchParams.get("token")
        if (tokenParam) return tokenParam.trim()
        const codeParam = url.searchParams.get("code")
        if (codeParam) return codeParam.trim()
      }
    } catch {
      // not a valid URL, treat as raw string
    }
    return trimmed
  }

  // Handle submitting check-in
  const executeCheckIn = async (inputCodeOrToken: string) => {
    if (!inputCodeOrToken.trim() || submitting) return
    setSubmitting(true)
    setErrorMsg("")
    setSuccessMsg("")

    try {
      const res = await checkIn(inputCodeOrToken.trim())
      playSuccessBeep()
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      }
      setSuccessMsg(res.message || "Presensi berhasil dicatat!")
      stopCamera()
      if (onSuccess) onSuccess()
    } catch (err: any) {
      const serverErr =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Gagal mencatat presensi. Pastikan kode benar dan sesi masih aktif."
      setErrorMsg(typeof serverErr === "string" ? serverErr : JSON.stringify(serverErr))
      // Resume scanning if in camera mode after 2 seconds
      if (mode === "camera" && !successMsg) {
        setTimeout(() => {
          if (isOpen && isScanningRef.current === false && !successMsg) {
            startCamera()
          }
        }, 2000)
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Scanner loop
  const scanLoop = useCallback(() => {
    if (!isScanningRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const scanned = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        })

        if (scanned && scanned.data) {
          const parsed = parseQRPayload(scanned.data)
          if (parsed) {
            isScanningRef.current = false
            executeCheckIn(parsed)
            return
          }
        }
      }
    }

    if (isScanningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanLoop)
    }
  }, [submitting, successMsg])

  // Start Camera
  const startCamera = useCallback(async () => {
    stopCamera()
    setCameraError("")
    setErrorMsg("")

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Peramban Anda tidak mendukung akses kamera.")
      return
    }

    try {
      // Check multiple cameras
      const devices = await navigator.mediaDevices.enumerateDevices()
      const videoDevices = devices.filter((d) => d.kind === "videoinput")
      setHasMultipleCameras(videoDevices.length > 1)

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute("playsinline", "true")
        await videoRef.current.play()
        isScanningRef.current = true
        animFrameRef.current = requestAnimationFrame(scanLoop)
      }
    } catch (err: any) {
      console.warn("Camera access error:", err)
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Izin kamera ditolak. Silakan izinkan akses kamera di peramban Anda atau gunakan opsi Masukkan Kode.")
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("Kamera tidak ditemukan pada perangkat Anda.")
      } else {
        setCameraError("Tidak dapat mengakses kamera (" + (err.message || "Unknown error") + ").")
      }
    }
  }, [facingMode, scanLoop, stopCamera])

  // Manage camera lifecycle
  useEffect(() => {
    if (isOpen && mode === "camera" && !successMsg) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen, mode, facingMode, successMsg, startCamera, stopCamera])

  // Reset state on modal open/close
  useEffect(() => {
    if (isOpen) {
      setCode("")
      setErrorMsg("")
      setSuccessMsg("")
      setCameraError("")
      setMode("camera")
    } else {
      stopCamera()
    }
  }, [isOpen, stopCamera])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center border border-brand-200 dark:border-brand-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white font-heading">
                Presensi Kehadiran Kuliah
              </h2>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-200">Scan QR Code dosen atau masukkan kode presensi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 dark:text-zinc-300 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        {!successMsg && (
          <div className="p-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMode("camera")
                setErrorMsg("")
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === "camera"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Scan Kamera</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("manual")
                stopCamera()
                setErrorMsg("")
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === "manual"
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-200"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Masukkan Kode</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-200 flex items-start gap-2 animate-in fade-in">
              <span className="font-bold shrink-0">✕</span>
              <span className="leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {/* Success Screen */}
          {successMsg ? (
            <div className="py-6 px-4 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mx-auto text-2xl font-bold shadow-xs border border-emerald-200 dark:border-emerald-800">
                ✓
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white font-heading">
                  Presensi Berhasil Dicatat!
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-200">{successMsg}</p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Selesai & Tutup
                </button>
              </div>
            </div>
          ) : mode === "camera" ? (
            /* ─── Mode Kamera ─────────────────────────────────────── */
            <div className="space-y-3">
              {cameraError ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center mx-auto text-lg">
                    📷
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium">{cameraError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("manual")
                      stopCamera()
                    }}
                    className="px-3.5 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-brand-700 transition"
                  >
                    Beralih ke Input Kode
                  </button>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-zinc-950 aspect-4/3 flex items-center justify-center shadow-inner border border-zinc-200 dark:border-zinc-800">
                  <video
                    ref={videoRef}
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Hidden Canvas for QR Extraction */}
                  <canvas ref={canvasRef} className="hidden" />

                  {/* Scanning Overlay Viewfinder */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-brand-400 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                      {/* Viewfinder corner accents */}
                      <span className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-brand-500 rounded-tl-lg"></span>
                      <span className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-brand-500 rounded-tr-lg"></span>
                      <span className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-brand-500 rounded-bl-lg"></span>
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-brand-500 rounded-br-lg"></span>

                      {/* Moving laser scan line */}
                      <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent animate-pulse top-1/2 -translate-y-1/2"></div>
                    </div>
                  </div>

                  {/* Camera control buttons */}
                  {hasMultipleCameras && (
                    <button
                      type="button"
                      onClick={() => setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))}
                      className="absolute bottom-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full text-xs backdrop-blur-xs transition"
                      title="Putar Kamera"
                    >
                      🔄
                    </button>
                  )}

                  {submitting && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                      <div className="w-7 h-7 border-3 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Mencatat Presensi...</span>
                    </div>
                  )}
                </div>
              )}

              <p className="text-[11px] text-zinc-500 dark:text-zinc-200 text-center leading-relaxed">
                Arahkan kamera ke QR Code yang ditampilkan dosen di layar kelas atau proyektor.
              </p>
            </div>
          ) : (
            /* ─── Mode Manual Input Kode ───────────────────────────── */
            <form
              onSubmit={(e) => {
                e.preventDefault()
                executeCheckIn(code)
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5 text-center">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-200 block">
                  Kode Presensi 6 Karakter
                </label>
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    maxLength={10}
                    placeholder="Contoh: 2C2605"
                    autoFocus
                    className="w-full text-center tracking-[0.25em] font-mono text-xl font-bold py-3 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-600 focus:border-brand-600 uppercase bg-zinc-50/50 dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-300">
                  Dapatkan 6 karakter kode presensi dari dosen pengampu saat sesi kuliah dibuka.
                </p>
              </div>

              <button
                type="submit"
                disabled={!code.trim() || submitting}
                className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Kirim Presensi Sekarang</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
