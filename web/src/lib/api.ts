import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api",
  withCredentials: true,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window?.dispatchEvent(new CustomEvent("auth:unauthorized"))
    }
    return Promise.reject(err)
  }
)

// ─── Auth ───────────────────────

export interface User {
  id: number
  email: string
  name: string | null
  avatar?: string | null
  role: "STUDENT" | "TEACHER"
  isVerified?: boolean
  phone?: string | null
  twoFactorEnabled?: boolean
}

export interface LoginResponse {
  user?: User
  token?: string
  requiresTwoFactor?: boolean
  tempToken?: string
  email?: string
  message?: string
}

export interface TwoFASetupResponse {
  secret: string
  otpAuthUrl: string
  qrCode: string
  issuer: string
  account: string
}

export interface TwoFAVerifySetupResponse {
  success: boolean
  message: string
  backupCodes: string[]
  twoFactorEnabled: boolean
}

export async function login(email: string, password: string, code?: string): Promise<LoginResponse> {
  const res = await api.post("/auth/login", { email, password, code })
  return res.data
}

export async function verifyLogin2FA(tempToken: string, code: string): Promise<LoginResponse> {
  const res = await api.post("/auth/2fa/verify-login", { tempToken, code })
  return res.data
}

export async function fetch2FASetup(): Promise<TwoFASetupResponse> {
  const res = await api.get("/auth/2fa/setup")
  return res.data
}

export async function verify2FASetup(code: string): Promise<TwoFAVerifySetupResponse> {
  const res = await api.post("/auth/2fa/verify-setup", { code })
  return res.data
}

export async function disable2FA(payload: {
  code?: string
  password?: string
}): Promise<{ success: boolean; message: string; twoFactorEnabled: boolean }> {
  const res = await api.post("/auth/2fa/disable", payload)
  return res.data
}

export async function fetch2FABackupCodes(): Promise<{ backupCodes: string[] }> {
  const res = await api.get("/auth/2fa/backup-codes")
  return res.data
}

export async function regenerate2FABackupCodes(
  code: string
): Promise<{ success: boolean; backupCodes: string[]; message: string }> {
  const res = await api.post("/auth/2fa/regenerate-backup-codes", { code })
  return res.data
}

export async function register(
  email: string,
  password: string,
  name?: string,
  role?: "STUDENT" | "TEACHER"
): Promise<LoginResponse> {
  const res = await api.post("/auth/register", { email, password, name, role })
  return res.data
}

export interface GoogleAuthPayload {
  idToken?: string
  email: string
  name?: string
  avatar?: string | null
  role?: "STUDENT" | "TEACHER"
}

export async function googleLogin(data: GoogleAuthPayload): Promise<LoginResponse> {
  const res = await api.post("/auth/google", data)
  return res.data
}

export async function logout(): Promise<void> {
  await api.post("/auth/logout")
}

export async function getMe(): Promise<{ user: User }> {
  const res = await api.get("/auth/me")
  return res.data
}

export interface UpdateProfilePayload {
  name?: string
  avatar?: string
  email?: string
  phone?: string
  twoFactorEnabled?: boolean
}

export async function updateProfile(data: UpdateProfilePayload): Promise<{ user: User; message: string }> {
  const res = await api.put("/auth/profile", data)
  return res.data
}

export async function sendVerificationCode(
  email: string,
  type: "ACCOUNT_VERIFICATION" | "PASSWORD_RESET"
): Promise<{ message: string; expiresAt?: string }> {
  const res = await api.post("/auth/send-verification", { email, type })
  return res.data
}

export async function verifyAccount(
  email: string,
  code: string
): Promise<{ message: string }> {
  const res = await api.post("/auth/verify-account", { email, code })
  return res.data
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string
): Promise<{ message: string }> {
  const res = await api.post("/auth/reset-password", { email, code, newPassword })
  return res.data
}

// ─── Courses ───────────────────

export interface Course {
  id: number
  title: string
  description: string | null
  code: string
  teacherId: number
  createdAt: string
  updatedAt: string
  _count?: { modules: number; enrollments: number; assignments: number }
  progressPct?: number | null
  modules?: Module[]
  enrollments?: Enrollment[]
  assignments?: unknown[]
}

export interface Module {
  id: number
  courseId: number
  title: string
  description: string | null
  order: number
  materials?: Material[]
}

export interface Material {
  id: number
  moduleId: number
  title: string
  type: "TEXT" | "VIDEO" | "IMAGE" | "FILE"
  content: string | null
  fileUrl: string | null
  order: number
}

export interface Enrollment {
  id: number
  userId: number
  courseId: number
  joinedAt: string
  user?: { id: number; name: string | null; email: string }
}

export interface QuizSession {
  id: number
  courseId: number
  title: string
  description: string | null
  isKingOfTheHill: boolean
  createdAt: string
  updatedAt: string
  quizQuestions?: QuizQuestion[]
  _count?: { quizQuestions: number }
}

export interface QuizQuestion {
  id: number
  quizSessionId: number
  question: string
  topic: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
  explanation?: string | null
  rubric?: string | null
  order: number
  options?: QuizOption[]
}

export interface QuizOption {
  id: number
  quizQuestionId: number
  text: string
  isCorrect: boolean
  order: number
}

export interface QuizAnswerResult {
  correct: boolean
  points: number
  speedBonus: number
  correctAnswer?: string
  aiScore?: number
  aiFeedback?: string
  explanation?: string | null
}

export interface QuizResult {
  sessionId: number
  totalScore: number
  correctCount: number
  answeredCount: number
  totalQuestions: number
  avgResponseMs: number
  topicStats: Record<string, { correct: number; total: number }>
  weakTopics: WeakTopic[]
  resultId: number | null
  aiSummary?: string | null
  aiEvaluation?: string | null
  aiRecommendations?: string | null
}

export interface WeakTopic {
  topic: string
  accuracy: number
  correct: number
  total: number
}

export interface LeaderboardResponse {
  sessionId: number
  sessionTitle?: string
  totalQuestions?: number
  kingOfTheHill: {
    userId: number
    name: string
    score: number
    correctCount: number
    avgResponseMs: number
  } | null
  entries: LeaderboardEntry[]
}

export interface LeaderboardEntry {
  rank: number
  userId: number
  name: string
  score: number
  correctCount: number
  avgResponseMs: number
}

export interface GradeResponse {
  quizGrades: QuizGrade[]
  assignmentGrades: AssignmentGrade[]
  overallPercentage: number
  weakTopics?: WeakTopic[]
  topicMasteries?: Array<{
    topic: string
    masteryScore: number
    accuracy: number
    trend: "IMPROVING" | "DECLINING" | "STABLE"
    attempts: number
  }>
}

export interface QuizGrade {
  id: number
  type: string
  title: string
  score: number
  maxScore: number
  date: string
  correctCount: number
  totalCount: number
}

export interface AssignmentGrade {
  id: number
  type: string
  title: string
  score: number
  maxScore: number
  date: string
  feedback: string | null
}

export interface SubmissionUser {
  id: number
  name: string | null
  email: string
  avatar: string | null
}

export interface Submission {
  id: number
  assignmentId: number
  userId: number
  content: string | null
  fileUrl: string | null
  submittedAt: string
  user?: SubmissionUser
  grade?: AssignmentGrade | null
}

export interface Assignment {
  id: number
  courseId: number
  title: string
  description: string | null
  deadline: string
  createdAt: string
  submitted: boolean
  submission: Submission | null
  grade: AssignmentGrade | null
  isPastDeadline: boolean
  submissions?: Submission[]
  submissionsCount?: number
  totalEnrolled?: number
}

export interface TrainingSessionResponse {
  sessionId: number
  topic: string
  difficulty: string
  explanation: string
  example: string
  questions: TrainingQuestion[]
}

export interface TrainingQuestion {
  id: number | null
  question: string
  options: string[]
  explanation: string
  topic: string
  type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
}

export interface TrainingSessionDetail {
  sessionId: number
  topic: string
  difficulty: string
  status: string
  progress: {
    answered: number
    total: number
    correct: number
    accuracy: number
  }
  questions: GeneratedQuestion[]
}

export interface GeneratedQuestion {
  id: number
  trainingSessionId: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string | null
  topic: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
  userAnswer: string | null
  isCorrect: boolean | null
  answeredAt: string | null
  order: number
}

export interface UserRank {
  rank: number
  score: number
  correctCount: number
  avgResponseMs: number
  totalPlayers: number
}

export interface AttendanceStatus {
  activeSessions: ActiveSession[]
  history: AttendanceRecord[]
  totalSessions: number
  attended: number
}

export interface ActiveSession {
  id: number
  title: string
  code?: string
  encryptedToken?: string
  expiresAt: string
}

export interface AttendanceRecord {
  id: number
  title: string
  date: string
  present: boolean
}

export interface PerformanceAnalysisResponse {
  strongTopics: string[]
  weakTopics: string[]
  recommendedTopics: string[]
  recommendedDifficulty: "easy" | "medium" | "hard"
  suggestedPractice: string
}

// ─── API functions ─────────────

export async function fetchCourses(): Promise<Course[]> {
  const res = await api.get("/courses")
  return res.data
}

export async function fetchCourse(courseId: number): Promise<Course> {
  const res = await api.get(`/courses/${courseId}`)
  return res.data
}

export async function createCourse(
  input: string | { title: string; description?: string; code?: string },
  description?: string,
  code?: string
): Promise<Course> {
  const payload = typeof input === "string" ? { title: input, description, code } : input
  const res = await api.post("/courses", payload)
  return res.data
}

export async function checkCourseCode(
  code: string,
  excludeId?: number
): Promise<{ available: boolean; code: string; message: string }> {
  const params: Record<string, string> = { code }
  if (excludeId) params.excludeId = String(excludeId)
  const res = await api.get("/courses/check-code", { params })
  return res.data
}

export async function updateCourse(
  courseId: number,
  data: { title: string; description?: string; code?: string }
): Promise<Course> {
  const res = await api.put(`/courses/${courseId}`, data)
  return res.data
}

export async function createModule(
  courseId: number,
  data: { title: string; description?: string; order?: number }
): Promise<{ id: number; courseId: number; title: string; description: string | null }> {
  const res = await api.post(`/courses/${courseId}/modules`, data)
  return res.data
}

export interface CreateMaterialPayload {
  moduleId?: number
  title: string
  type: "TEXT" | "VIDEO" | "IMAGE" | "FILE"
  content?: string
  fileUrl?: string
  order?: number
}

export async function createMaterial(
  courseId: number,
  data: CreateMaterialPayload
): Promise<Material> {
  const res = await api.post(`/courses/${courseId}/materials`, data)
  return res.data
}

export async function markMaterialProgress(materialId: number): Promise<{ message: string }> {
  const res = await api.post(`/courses/progress/${materialId}`)
  return res.data
}

export interface CreateAssignmentPayload {
  title: string
  description?: string
  deadline?: string
}

export async function createAssignment(
  courseId: number,
  data: CreateAssignmentPayload
): Promise<Assignment> {
  const res = await api.post(`/assignments/courses/${courseId}`, data)
  return res.data
}

export interface CreateQuizQuestionPayload {
  question: string
  type?: "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "ESSAY"
  options?: string[]
  correctOptionIndex?: number
  correctOptionIndices?: number[]
  rubric?: string
  explanation?: string
  topic?: string
  difficulty?: string
  order?: number
}

export interface CreateQuizPayload {
  title: string
  description?: string
  isKingOfTheHill?: boolean
  questions?: CreateQuizQuestionPayload[]
}

export async function createQuizSession(
  courseId: number,
  data: CreateQuizPayload
): Promise<QuizSession> {
  const res = await api.post(`/quizzes/courses/${courseId}/sessions`, data)
  return res.data
}

export interface GenerateQuizPayload {
  title?: string
  topic: string
  difficulty?: "easy" | "medium" | "hard"
  count?: number
  questionTypes?: string[]
}

export async function generateQuizWithAI(
  courseId: number,
  data: GenerateQuizPayload
): Promise<QuizSession> {
  const res = await api.post(`/quizzes/courses/${courseId}/generate`, data)
  return res.data
}

export interface GenerateAIContentPayload {
  type: "MATERIAL" | "ASSIGNMENT"
  courseTitle?: string
  topic: string
  instructions?: string
}

export interface GenerateAIContentResponse {
  title: string
  content: string
  suggestedType?: string
}

export async function generateAIContent(
  data: GenerateAIContentPayload
): Promise<GenerateAIContentResponse> {
  const res = await api.post(`/ai/generate-content`, data)
  return res.data
}

export async function enrollCourse(courseCode: string): Promise<{ message: string }> {
  const res = await api.post(`/courses/${courseCode}/enroll`)
  return res.data
}

export async function fetchQuizSessions(courseId: number): Promise<QuizSession[]> {
  const res = await api.get(`/quizzes/courses/${courseId}/sessions`)
  return res.data
}

export async function fetchQuizSession(sessionId: number): Promise<QuizSession> {
  const res = await api.get(`/quizzes/sessions/${sessionId}`)
  return res.data
}

export interface SubmitAnswerPayload {
  sessionId: number
  questionId: number
  optionId?: number
  selectedOptionIds?: number[]
  essayAnswer?: string
  responseTimeMs: number
}

export async function submitAnswer(
  sessionIdOrPayload: number | SubmitAnswerPayload,
  questionId?: number,
  optionId?: number,
  responseTimeMs?: number
): Promise<QuizAnswerResult> {
  const payload =
    typeof sessionIdOrPayload === "object"
      ? sessionIdOrPayload
      : {
          sessionId: sessionIdOrPayload,
          questionId: questionId!,
          optionId,
          responseTimeMs: responseTimeMs || 0,
        }

  const res = await api.post(`/quizzes/sessions/${payload.sessionId}/answers`, payload)
  return res.data
}

export async function fetchQuizResults(sessionId: number): Promise<QuizResult> {
  const res = await api.get(`/quizzes/sessions/${sessionId}/results`)
  return res.data
}

export async function fetchLeaderboard(sessionId: number): Promise<LeaderboardResponse> {
  const res = await api.get(`/leaderboard/sessions/${sessionId}`)
  return res.data
}

export async function fetchUserRank(sessionId: number): Promise<UserRank> {
  const res = await api.get(`/leaderboard/sessions/${sessionId}/rank`)
  return res.data
}

export async function fetchGrades(courseId: number): Promise<GradeResponse> {
  const res = await api.get(`/grades/courses/${courseId}`)
  return res.data
}

export async function fetchAssignments(courseId: number): Promise<Assignment[]> {
  const res = await api.get(`/assignments/courses/${courseId}`)
  return res.data
}

export async function submitAssignment(
  assignmentId: number,
  content?: string,
  fileUrl?: string
): Promise<Submission> {
  const res = await api.post(`/assignments/${assignmentId}/submit`, { content, fileUrl })
  return res.data
}

export interface AssignmentSubmissionsResponse {
  assignment: {
    id: number
    courseId: number
    title: string
    description: string | null
    deadline: string
    createdAt: string
  }
  totalEnrolled: number
  submissionsCount: number
  unsubmittedCount: number
  submissions: Submission[]
  unsubmittedStudents: SubmissionUser[]
}

export async function fetchAssignmentSubmissions(
  assignmentId: number
): Promise<AssignmentSubmissionsResponse> {
  const res = await api.get(`/assignments/${assignmentId}/submissions`)
  return res.data
}

export async function gradeSubmission(
  submissionId: number,
  data: { score: number; maxScore: number; feedback?: string }
): Promise<AssignmentGrade> {
  const res = await api.post(`/assignments/submissions/${submissionId}/grade`, data)
  return res.data
}

export interface CreateAttendancePayload {
  courseId: number
  title: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  durationMinutes?: number
  code?: string
}

export interface AttendanceRecordItem {
  id: number
  title: string
  code: string
  encryptedToken?: string
  createdAt: string
  expiresAt: string
  checkinCount: number
  checkins: Array<{
    userId: number
    name: string
    checkedInAt: string
  }>
}

export async function createAttendanceSession(
  data: CreateAttendancePayload
): Promise<ActiveSession & { course?: { id: number; title: string; code: string } }> {
  const res = await api.post(`/attendance/sessions`, data)
  return res.data
}

export async function fetchAttendanceRecords(courseId: number): Promise<AttendanceRecordItem[]> {
  const res = await api.get(`/attendance/records/${courseId}`)
  return res.data
}

export async function fetchAttendanceStatus(courseId: number): Promise<AttendanceStatus> {
  const res = await api.get(`/attendance/status/${courseId}`)
  return res.data
}

export async function checkIn(codeOrToken: string): Promise<{ message: string }> {
  const res = await api.post(`/attendance/checkin`, { code: codeOrToken, token: codeOrToken })
  return res.data
}

export async function analyzePerformance(quizResultId: number): Promise<PerformanceAnalysisResponse> {
  const res = await api.post(`/ai/analyze/${quizResultId}`)
  return res.data
}

export async function startTrainingSession(
  topic: string,
  difficulty: "easy" | "medium" | "hard" = "medium",
  questionCount: number = 5,
  questionTypes: string[] = ["SINGLE_CHOICE"],
  quizResultId?: number
): Promise<TrainingSessionResponse> {
  const res = await api.post(`/ai/train`, {
    topic,
    difficulty,
    questionCount,
    questionTypes,
    quizResultId,
  })
  return res.data
}

export async function fetchTrainingSession(sessionId: number): Promise<TrainingSessionDetail> {
  const res = await api.get(`/ai/train/${sessionId}`)
  return res.data
}

export async function answerTrainingQuestion(
  questionId: number,
  answer: string
): Promise<{
  correct: boolean
  correctAnswer: string
  explanation: string | null
  isSessionComplete?: boolean
  progress?: { answered: number; total: number; correct: number }
  masteryOutcome?: {
    preMastery: number
    postMastery: number
    delta: number
    trend: string
  } | null
}> {
  const res = await api.post(`/ai/questions/${questionId}/answer`, { answer })
  return res.data
}

// ─── Analytics & Intelligence ──

export interface StudentRecommendation {
  type: "AI_TRAINING" | "ASSIGNMENT" | "LMS"
  priority: "HIGH" | "MEDIUM" | "LOW"
  title: string
  description: string
  actionUrl: string
  actionLabel: string
  metadata?: Record<string, unknown>
}

export interface StudentRecommendationResponse {
  recommendations: StudentRecommendation[]
  summary: {
    hasCriticalWeakness: boolean
    pendingAssignmentsCount: number
  }
}

export interface TopicMasteryItem {
  topic: string
  masteryScore: number
  confidence: number
  accuracy: number
  recentAccuracy: number
  trend: "IMPROVING" | "DECLINING" | "STABLE"
  attempts: number
  lastPracticedAt: string
}

export interface StudentProfileResponse {
  overview: {
    overallMastery: number
    topicsTracked: number
    improvingCount: number
    decliningCount: number
    trainingsCompleted: number
  }
  personalBests: {
    highestQuizScore: number
    fastestAnswerSec: number
    overallAccuracy: number
    totalQuestionsAnswered: number
  }
  topicMasteries: TopicMasteryItem[]
  remediationImpact: Array<{
    id: number
    topic: string
    difficulty: string
    preAccuracy: number
    postAccuracy: number
    improvementDelta: number
    completedAt: string
  }>
}

export interface TeacherIntelligenceResponse {
  courseId: number
  courseTitle: string
  classMastery: Array<{
    topic: string
    avgMastery: number
    studentCount: number
    strugglingPercentage: number
    difficulty: "EASY" | "MEDIUM" | "HARD"
    needsClassIntervention: boolean
  }>
  atRiskStudents: Array<{
    id: number
    name: string
    email: string
    avgMastery: number
    attendancePercentage: number
    assignmentCompletion: string
    riskFactors: string[]
    recommendedIntervention: string
    aiAdvice?: {
      rootCause: string
      actionSteps: Array<{
        title: string
        description: string
        priority: "URGENT" | "HIGH" | "MEDIUM"
      }>
      counselingDraft: string
      remedialStrategy: string
      suggestedAction: string
    }
  }>
  classRecommendations: Array<{
    type: string
    topic?: string
    title: string
    description: string
  }>
  aiClassStrategy?: {
    status: string
    headline: string
    overview: string
    recommendedActions: Array<{
      phase: string
      action: string
      badge: string
    }>
  }
}

export async function fetchStudentRecommendations(): Promise<StudentRecommendationResponse> {
  const res = await api.get("/analytics/recommendations")
  return res.data
}

export async function fetchStudentProfile(): Promise<StudentProfileResponse> {
  const res = await api.get("/analytics/profile")
  return res.data
}

export async function fetchTeacherIntelligence(courseId: number): Promise<TeacherIntelligenceResponse> {
  const res = await api.get(`/analytics/teacher/${courseId}`)
  return res.data
}

export interface TeacherAIConsultResponse {
  advice: string
  structuredAdvice?: {
    rootCause: string
    actionSteps: Array<{
      title: string
      description: string
      priority: "URGENT" | "HIGH" | "MEDIUM"
    }>
    counselingDraft: string
    remedialStrategy: string
  } | null
  provider: string
  model: string
  isLiveAI: boolean
  studentId: number
  studentName: string
}

export async function consultTeacherAITips(
  courseId: number,
  studentId: number,
  question?: string
): Promise<TeacherAIConsultResponse> {
  const res = await api.post(`/analytics/teacher/${courseId}/consult-ai`, { studentId, question })
  return res.data
}

// ─── Calendar ───────────────────

export interface CalendarEvent {
  id: string
  title: string
  description?: string | null
  courseId?: number
  courseName?: string
  courseCode?: string
  start: string
  end?: string
  type: "ASSIGNMENT" | "QUIZ" | "LECTURE" | "ATTENDANCE" | "REMEDIAL"
  status?: "PENDING" | "SUBMITTED" | "COMPLETED" | "MISSED" | "SCHEDULED"
  url?: string
  color?: string
  meta?: Record<string, unknown>
}

export interface CalendarEventsResponse {
  total: number
  events: CalendarEvent[]
}

export async function fetchCalendarEvents(): Promise<CalendarEventsResponse> {
  const res = await api.get("/calendar/events")
  return res.data
}

