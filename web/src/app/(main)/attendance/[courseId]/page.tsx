"use client"

import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  fetchAttendanceStatus,
  checkIn,
  AttendanceStatus,
  fetchCourse,
  Course,
  fetchAttendanceRecords,
  AttendanceRecordItem,
} from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { Badge } from "@/components/ui/Badge"
import { ProgressBar } from "@/components/ui/ProgressBar"
import { AttendanceModal } from "@/components/attendance/AttendanceModal"

export default function AttendancePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const searchParams = useSearchParams()
  const { user } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [status, setStatus] = useState<AttendanceStatus | null>(null)
  const [teacherRecords, setTeacherRecords] = useState<AttendanceRecordItem[]>([])
  const [code, setCode] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)

  const cId = parseInt(courseId)

  // Load data based on role
  const loadData = () => {
    if (isNaN(cId)) return

    fetchCourse(cId)
      .then(setCourse)
      .catch(() => {})

    fetchAttendanceStatus(cId)
      .then(setStatus)
      .catch(() => {})

    if (user?.role === "TEACHER") {
      fetchAttendanceRecords(cId)
        .then(setTeacherRecords)
        .catch(() => {})
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [cId, user?.role])

  // Read code or encrypted token from URL if passed (e.g. from QR scan)
  useEffect(() => {
    const qToken = searchParams.get("token")
    const qCode = searchParams.get("code")
    if (qToken) {
      setCode(qToken.trim())
    } else if (qCode) {
      setCode(qCode.trim().toUpperCase())
    }
  }, [searchParams])

  const handleCheckIn = async () => {
    if (!code.trim() || submitting) return
    setSubmitting(true)
    setMsg("")
    try {
      const res = await checkIn(code.trim())
      setMsg(res.message || "Presensi berhasil dicatat!")
      fetchAttendanceStatus(cId).then(setStatus)
      setCode("")
    } catch (err: any) {
      setMsg(err.response?.data?.error || "Check-in presensi gagal.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-32 bg-zinc-200 dark:bg-zinc-800 rounded-2xl"></div>
        <div className="h-44 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
      </div>
    )
  }

  const attendanceRate =
    status && status.totalSessions > 0 ? Math.round((status.attended / status.totalSessions) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-down-container flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 px-1.5 py-0.5 rounded">
              {course?.code || "PRESENSI"}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500">&bull;</span>
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
              {course?.title || "Mata Kuliah"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-heading mt-1">
            Presensi & Kehadiran Perkuliahan
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
            {user?.role === "TEACHER"
              ? "Buka sesi presensi dengan kalender, jam, dan QR Code untuk mahasiswa kelas ini."
              : "Masukkan kode token atau scan QR code yang diberikan dosen saat perkuliahan."}
          </p>
        </div>

        {user?.role === "TEACHER" ? (
          <button
            onClick={() => setShowAttendanceModal(true)}
            className="btn-primary text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 font-medium shadow-2xs shrink-0 self-start sm:self-auto"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            <span>Buka Presensi (QR & Kode)</span>
          </button>
        ) : (
          <Link
            href={`/courses/${cId}`}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:text-zinc-900 dark:hover:text-white bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-lg transition-colors shrink-0 self-start sm:self-auto"
          >
            &larr; Kembali ke Kelas
          </Link>
        )}
      </div>

      {/* ─── Active Session Alert ────────────────────────────────────── */}
      {status?.activeSessions && status.activeSessions.length > 0 && (
        <div className="p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider font-heading">
                Sesi Presensi Sedang Buka
              </span>
            </div>
            <Badge variant="success">Sedang Berlangsung</Badge>
          </div>

          <div className="space-y-2">
            {status.activeSessions.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white font-heading">{s.title}</h3>
                  <div className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
                    Berakhir pada:{" "}
                    <strong className="text-zinc-800 dark:text-white">
                      {new Date(s.expiresAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      WIB
                    </strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {s.code ? (
                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-300 font-heading">
                        Kode Token
                      </div>
                      <div className="text-lg font-mono font-black text-brand-700 dark:text-brand-300 tracking-wider">
                        {s.code}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                      <svg className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                      </svg>
                      <span>Terenkripsi AES-256</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Student Check-In Input Card ────────────────────────────── */}
      {user?.role === "STUDENT" && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading">
              Input Kode Token Presensi
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-200 mt-0.5">
              Masukkan kode 6 digit dari dosen atau hasil scan QR Code untuk mencatat kehadiran Anda.
            </p>
          </div>

          {code.length > 20 && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="font-medium">Token QR Terenkripsi (AES-256-GCM) terdeteksi dari pemindaian. Klik Check-in untuk konfirmasi kehadiran.</span>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Masukkan kode token (cth: A9B3E2) atau scan QR"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 font-mono font-bold text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-400 bg-white dark:bg-zinc-800"
            />
            <button
              onClick={handleCheckIn}
              disabled={submitting || !code.trim()}
              className="btn-primary text-xs py-2.5 px-5 rounded-xl font-bold flex-shrink-0 disabled:opacity-50"
            >
              {submitting ? "..." : "Check-in Sekarang"}
            </button>
          </div>

          {msg && (
            <p
              className={`text-xs p-3 rounded-lg font-medium ${
                msg.includes("berhasil") || msg.includes("Already") || msg.includes("successful")
                  ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              }`}
            >
              {msg}
            </p>
          )}
        </div>
      )}

      {/* ─── Student Attendance Stats ───────────────────────────────── */}
      {user?.role === "STUDENT" && status && (
        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading">
              Tingkat Kehadiran Kuliah
            </span>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {status.attended} dari {status.totalSessions} Sesi Terlaksana
            </span>
          </div>
          <div className="text-3xl font-black text-zinc-900 dark:text-white font-heading">{attendanceRate}%</div>
          <ProgressBar value={attendanceRate} size="sm" />
        </div>
      )}

      {/* ─── Student Attendance History ─────────────────────────────── */}
      {user?.role === "STUDENT" && status?.history && status.history.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-300 font-heading">
            Riwayat Pertemuan Kuliah
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
            {status.history.map((r) => (
              <div key={r.id} className="p-4 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-zinc-800 dark:text-white block">{r.title}</span>
                  <span className="text-[11px] text-zinc-400 dark:text-zinc-300">
                    {new Date(r.date).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <Badge variant={r.present ? "success" : "danger"}>
                  {r.present ? "Hadir" : "Tidak Hadir"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Teacher Attendance Management Records ─────────────────── */}
      {user?.role === "TEACHER" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-200 font-heading">
              Daftar Sesi Presensi & Rekap Mahasiswa
            </h3>
            <span className="text-xs text-zinc-500 dark:text-zinc-300 font-medium">
              {teacherRecords.length} Sesi Terjadwal
            </span>
          </div>

          {teacherRecords.length === 0 ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center space-y-3">
              <p className="text-xs text-zinc-500 dark:text-zinc-300">
                Belum ada sesi presensi yang dibuat untuk kelas ini.
              </p>
              <button
                onClick={() => setShowAttendanceModal(true)}
                className="btn-primary text-xs py-2 px-4 rounded-xl font-medium inline-flex items-center gap-1.5"
              >
                <span>Buka Sesi Presensi Pertama</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {teacherRecords.map((s) => {
                const isExpired = new Date(s.expiresAt) < new Date()
                return (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white font-heading">{s.title}</h4>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              !isExpired
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
                                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                            }`}
                          >
                            {!isExpired ? "Aktif" : "Selesai"}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-300 mt-0.5">
                          Dibuat pada:{" "}
                          {new Date(s.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          &bull; Berakhir:{" "}
                          {new Date(s.expiresAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-300 font-bold block uppercase">
                            Kode Token
                          </span>
                          <span className="text-base font-mono font-black text-brand-700 dark:text-brand-300">
                            {s.code}
                          </span>
                        </div>
                        <div className="text-right pl-3 border-l border-zinc-200 dark:border-zinc-800">
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-300 font-bold block uppercase">
                            Hadir
                          </span>
                          <span className="text-base font-bold text-zinc-900 dark:text-white">
                            {s.checkinCount} orang
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Checkins list summary */}
                    {s.checkins && s.checkins.length > 0 ? (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-300">
                          Mahasiswa yang Telah Hadir:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {s.checkins.map((chk, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-200"
                            >
                              {chk.name} ({new Date(chk.checkedInAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })})
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-zinc-400 dark:text-zinc-300 italic">
                        Belum ada mahasiswa yang check-in pada sesi ini.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Attendance Creation Modal */}
      {course && (
        <AttendanceModal
          isOpen={showAttendanceModal}
          onClose={() => setShowAttendanceModal(false)}
          courses={[course]}
          initialCourseId={course.id}
          onSessionCreated={() => {
            loadData()
          }}
        />
      )}
    </div>
  )
}
