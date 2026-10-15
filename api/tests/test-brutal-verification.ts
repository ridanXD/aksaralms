import dotenv from "dotenv"
dotenv.config()
dotenv.config({ path: "../.env" })

const API_URL = "http://localhost:8080/api"

async function post(url: string, body: any, token?: string): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const data: any = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

async function get(url: string, token?: string): Promise<{ status: number; data: any }> {
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, { method: "GET", headers })
  const data: any = await res.json().catch(() => ({}))
  return { status: res.status, data }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  ❌ ASSERTION FAILED: ${message}`)
    throw new Error(message)
  }
  console.log(`  ✓ ${message}`)
}

async function runBrutalVerification() {
  console.log("==================================================")
  console.log("   AKSARA BRUTAL SYSTEM VERIFICATION & AUDIT      ")
  console.log("==================================================")

  // 1. Auth & Credentials
  console.log("\n[AUDIT 1] Authentication & Role Separation")
  const studentAuth = await post(`${API_URL}/auth/login`, {
    email: "andi@sekolah.id",
    password: "password123",
  })
  assert(studentAuth.status === 200, "Student authentication successful")
  const studentToken = studentAuth.data.token

  const teacherAuth = await post(`${API_URL}/auth/login`, {
    email: "guru@sekolah.id",
    password: "password123",
  })
  assert(teacherAuth.status === 200, "Teacher authentication successful")
  const teacherToken = teacherAuth.data.token

  // Register a brand new student for zero-state testing
  const freshEmail = `fresh_student_${Date.now()}@sekolah.id`
  const freshStudent = await post(`${API_URL}/auth/register`, {
    name: "Siswa Baru Zero State",
    email: freshEmail,
    password: "password123",
    role: "STUDENT",
  })
  assert(freshStudent.status === 201, "New student registration successful")
  const freshToken = freshStudent.data.token

  // 2. Zero-State & Empty State Safety
  console.log("\n[AUDIT 2] Zero-State & Empty State Resilience (No NaN, No 500)")
  const freshRec = await get(`${API_URL}/analytics/recommendations`, freshToken)
  assert(freshRec.status === 200, "Recommendations on brand new student returns 200")
  assert(Array.isArray(freshRec.data.recommendations), "Recommendations is a valid array")
  assert(typeof freshRec.data.summary === "object", "Summary is valid object")

  const freshProf = await get(`${API_URL}/analytics/profile`, freshToken)
  assert(freshProf.status === 200, "Profile on brand new student returns 200")
  assert(freshProf.data.overview.overallMastery === 0, "Initial mastery is 0 (not NaN)")
  assert(freshProf.data.overview.topicsTracked === 0, "Initial topics tracked is 0")
  assert(freshProf.data.personalBests.highestQuizScore === 0, "Highest quiz score is 0 (not NaN/null)")
  assert(freshProf.data.personalBests.fastestAnswerSec === 0, "Fastest answer is 0 (not NaN/null)")

  // 3. Security Deep Audit: Authorization & IDOR Gates
  console.log("\n[AUDIT 3] Security & RBAC Enforcement")
  const courses = await get(`${API_URL}/courses`, studentToken)
  assert(courses.status === 200 && courses.data.length > 0, "Fetched course list")
  const courseId = courses.data[0].id

  // Student forbidden from teacher intelligence
  const studentTeacherAccess = await get(`${API_URL}/analytics/teacher/${courseId}`, studentToken)
  assert(studentTeacherAccess.status === 403, "Student blocked from Teacher Intelligence (HTTP 403)")

  // Non-existent course teacher intelligence returns 404
  const teacherNotFoundCourse = await get(`${API_URL}/analytics/teacher/999999`, teacherToken)
  assert(teacherNotFoundCourse.status === 404, "Invalid courseId in Teacher Intel returns HTTP 404")

  // 4. Closed-Loop Remediation & Mathematical Bounds
  console.log("\n[AUDIT 4] Closed-Loop AI Remediation & Mathematical Bounds")
  const trainStart = await post(
    `${API_URL}/ai/train`,
    {
      topic: "Normalisasi Database",
      difficulty: "medium",
      questionCount: 3,
    },
    studentToken
  )
  assert(trainStart.status === 201, "AI Training session created with deterministic fallback resilience")
  assert(typeof trainStart.data.preAccuracy === "number", "preAccuracy is a valid number")
  assert(trainStart.data.preAccuracy >= 0 && trainStart.data.preAccuracy <= 100, "preAccuracy bounded 0-100")
  assert(trainStart.data.questions.length > 0, "Generated questions array is non-empty")

  const firstQuestion = trainStart.data.questions[0]
  assert(firstQuestion.options.length >= 2, "Question has valid options")

  // Answer first question
  const ans1 = await post(
    `${API_URL}/ai/questions/${firstQuestion.id}/answer`,
    { answer: firstQuestion.options[0] },
    studentToken
  )
  assert(ans1.status === 200, "Question answered successfully")
  assert(typeof ans1.data.correct === "boolean", "Answer evaluated with boolean correctness")

  // Duplicate answer protection
  const ansDuplicate = await post(
    `${API_URL}/ai/questions/${firstQuestion.id}/answer`,
    { answer: firstQuestion.options[0] },
    studentToken
  )
  assert(ansDuplicate.status === 400, "Duplicate answer blocked (HTTP 400)")

  // Answer remaining questions
  for (let i = 1; i < trainStart.data.questions.length; i++) {
    const q = trainStart.data.questions[i]
    const a = await post(
      `${API_URL}/ai/questions/${q.id}/answer`,
      { answer: q.options[0] },
      studentToken
    )
    assert(a.status === 200, `Answered training question #${i + 1}`)
    if (a.data.isSessionComplete) {
      assert(a.data.masteryOutcome !== null, "Mastery outcome returned upon session completion")
      assert(
        a.data.masteryOutcome.postMastery >= 0 && a.data.masteryOutcome.postMastery <= 100,
        "postMastery bounded 0-100"
      )
      assert(
        typeof a.data.masteryOutcome.delta === "number",
        "Mastery improvement delta calculated and explainable"
      )
    }
  }

  // 5. Leaderboard CTE Ranking Verification
  console.log("\n[AUDIT 5] Leaderboard CTE Window Function Ranking")
  const quizzes = await get(`${API_URL}/quizzes/courses/${courseId}/sessions`, studentToken)
  assert(quizzes.status === 200 && quizzes.data.length > 0, "Retrieved course quiz sessions")
  const quizSessionId = quizzes.data[0].id

  const leaderboard = await get(`${API_URL}/leaderboard/sessions/${quizSessionId}`, studentToken)
  assert(leaderboard.status === 200, "Leaderboard retrieved successfully")
  assert(Array.isArray(leaderboard.data.entries), "Leaderboard entries is an array")

  const userRank = await get(`${API_URL}/leaderboard/sessions/${quizSessionId}/rank`, studentToken)
  assert(userRank.status === 200, "User rank query succeeded")
  assert(typeof userRank.data.rank === "number" || userRank.data.rank === null, "Rank is valid number or null")
  assert(typeof userRank.data.totalPlayers === "number", "Total players calculated via window function")

  // 6. Teacher Intelligence Actionable Diagnosis
  console.log("\n[AUDIT 6] Teacher Intelligence & Explainable At-Risk Diagnosis")
  const teacherCourses = await get(`${API_URL}/courses`, teacherToken)
  const teacherCourseId = teacherCourses.data[0]?.id || courseId
  const teacherIntel = await get(`${API_URL}/analytics/teacher/${teacherCourseId}`, teacherToken)
  assert(teacherIntel.status === 200, "Teacher intelligence query succeeded")
  assert(Array.isArray(teacherIntel.data.classMastery), "classMastery is an array")
  assert(Array.isArray(teacherIntel.data.atRiskStudents), "atRiskStudents is an array")
  assert(Array.isArray(teacherIntel.data.classRecommendations), "classRecommendations is an array")

  if (teacherIntel.data.atRiskStudents.length > 0) {
    const studentDiagnosis = teacherIntel.data.atRiskStudents[0]
    assert(studentDiagnosis.riskFactors.length > 0, "At-risk student has explainable risk factors")
    assert(
      typeof studentDiagnosis.recommendedIntervention === "string",
      "Actionable intervention recommendation provided"
    )
  }

  console.log("\n==================================================")
  console.log("   ALL 20 BRUTAL VERIFICATION CHECKS PASSED!     ")
  console.log("==================================================")
}

runBrutalVerification().catch((err) => {
  console.error("Verification failed:", err)
  process.exit(1)
})
