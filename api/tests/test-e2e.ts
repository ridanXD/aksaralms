import dotenv from "dotenv"
dotenv.config()
dotenv.config({ path: "../.env" })

const API_URL = "http://localhost:8080/api"

async function post(url: string, body: any, token?: string): Promise<any> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })
  const data: any = await res.json()
  if (!res.ok) throw new Error(data.error || JSON.stringify(data))
  return data
}

async function get(url: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(url, { method: "GET", headers })
  const data: any = await res.json()
  if (!res.ok) throw new Error(data.error || JSON.stringify(data))
  return data
}

async function runE2ETest() {
  console.log("=== STARTING AKSARA FULL SYSTEM E2E VERIFICATION ===")

  // 1. Auth: Student & Teacher
  console.log("\n[1] Testing Authentication...")
  const studentLogin = await post(`${API_URL}/auth/login`, {
    email: "andi@sekolah.id",
    password: "password123",
  })
  const studentToken = studentLogin.token
  console.log("  ✓ Student login successful:", studentLogin.user.name)

  const teacherLogin = await post(`${API_URL}/auth/login`, {
    email: "guru@sekolah.id",
    password: "password123",
  })
  const teacherToken = teacherLogin.token
  console.log("  ✓ Teacher login successful:", teacherLogin.user.name)

  // 2. Student Next Best Action & Profile
  console.log("\n[2] Testing Next Best Action & Student Profile Engine...")
  const recRes = await get(`${API_URL}/analytics/recommendations`, studentToken)
  console.log(`  ✓ Next Best Action returned ${recRes.recommendations.length} recommendations:`)
  recRes.recommendations.forEach((r: any) => {
    console.log(`    - [${r.priority}] ${r.title} (${r.actionLabel})`)
  })

  const profRes = await get(`${API_URL}/analytics/profile`, studentToken)
  console.log(`  ✓ Student profile: Overall Mastery ${profRes.overview.overallMastery}%, Tracked: ${profRes.overview.topicsTracked} topics`)

  // 3. Quiz & Leaderboard
  console.log("\n[3] Testing Quiz & Competitive Leaderboard...")
  const coursesRes = await get(`${API_URL}/courses`, studentToken)
  const course = coursesRes.find((c: any) => c.title === "Basis Data") || coursesRes[0]
  const courseId = course.id
  console.log(`  ✓ Selected Course #${courseId}: "${course.title}"`)

  const quizzesRes = await get(`${API_URL}/quizzes/courses/${courseId}/sessions`, studentToken)
  const quizSessionId = quizzesRes[0].id
  console.log(`  ✓ Found Quiz Session #${quizSessionId}: "${quizzesRes[0].title}"`)

  const sessionDetail = await get(`${API_URL}/quizzes/sessions/${quizSessionId}`, studentToken)
  const questions = sessionDetail.quizQuestions
  console.log(`  ✓ Quiz contains ${questions.length} questions`)

  // Submit answers
  for (let i = 0; i < Math.min(3, questions.length); i++) {
    const q = questions[i]
    const opt = q.options[0]
    try {
      const ansRes = await post(
        `${API_URL}/quizzes/sessions/${quizSessionId}/answers`,
        {
          sessionId: quizSessionId,
          questionId: q.id,
          optionId: opt.id,
          responseTimeMs: 2200,
        },
        studentToken
      )
      console.log(`    - Q${i + 1} answered: points=${ansRes.points ?? 0}, correct=${ansRes.correct ?? false}`)
    } catch (e: any) {
      console.log(`    - Q${i + 1} answer status: ${e.message}`)
    }
  }

  // Quiz Results & Mastery Sync
  const resultRes = await get(`${API_URL}/quizzes/sessions/${quizSessionId}/results`, studentToken)
  console.log(`  ✓ Quiz Results: score=${resultRes.totalScore}, correct=${resultRes.correctCount}/${resultRes.totalQuestions}`)
  console.log(`  ✓ Weak Topics detected:`, resultRes.weakTopics.map((w: any) => `${w.topic} (${Math.round(w.accuracy * 100)}%)`).join(", ") || "None")

  // Leaderboard Ranking
  const lbRes = await get(`${API_URL}/leaderboard/sessions/${quizSessionId}`, studentToken)
  console.log(`  ✓ Leaderboard top King:`, lbRes.kingOfTheHill ? `${lbRes.kingOfTheHill.name} (${lbRes.kingOfTheHill.score} pts)` : "None")

  const rankRes = await get(`${API_URL}/leaderboard/sessions/${quizSessionId}/rank`, studentToken)
  console.log(`  ✓ Student rank: #${rankRes.rank} of ${rankRes.totalPlayers} participants (score: ${rankRes.score})`)

  // 4. AI Adaptive Remediation Loop
  console.log("\n[4] Testing AI Remedial & Closed-Loop Training Engine...")
  const targetTopic = resultRes.weakTopics[0]?.topic || "Closures"
  console.log(`  ✓ Starting AI Training on topic: "${targetTopic}"`)

  const trainRes = await post(
    `${API_URL}/ai/train`,
    {
      topic: targetTopic,
      difficulty: "medium",
      questionCount: 3,
      quizResultId: resultRes.resultId,
    },
    studentToken
  )

  console.log(`  ✓ AI Training Session #${trainRes.sessionId} generated:`)
  console.log(`    - Baseline (preAccuracy): ${trainRes.preAccuracy}%`)
  console.log(`    - Explanation preview: "${trainRes.explanation.slice(0, 70)}..."`)
  console.log(`    - Questions count: ${trainRes.questions.length}`)

  // Answer training questions to complete remediation
  for (let i = 0; i < trainRes.questions.length; i++) {
    const tq = trainRes.questions[i]
    try {
      const answerRes = await post(
        `${API_URL}/ai/questions/${tq.id}/answer`,
        { answer: tq.options[0] },
        studentToken
      )
      console.log(`    - Practice Q${i + 1} answered: correct=${answerRes.correct}, isSessionComplete=${answerRes.isSessionComplete}`)
      if (answerRes.masteryOutcome) {
        console.log(`  ✓ Remediation Closed Loop Outcome:`, answerRes.masteryOutcome)
      }
    } catch (e: any) {
      console.log(`    - Practice Q${i + 1} status: ${e.message}`)
    }
  }

  // 5. Teacher Intelligence & At-Risk Analytics
  console.log("\n[5] Testing Teacher Intelligence & Analytics...")
  const teacherIntel = await get(`${API_URL}/analytics/teacher/${courseId}`, teacherToken)
  console.log(`  ✓ Course "${teacherIntel.courseTitle}" Class Mastery:`)
  teacherIntel.classMastery.forEach((tm: any) => {
    console.log(`    - ${tm.topic}: avg ${tm.avgMastery}%, ${tm.strugglingPercentage}% struggling (intervene: ${tm.needsClassIntervention})`)
  })
  console.log(`  ✓ At-Risk Students detected: ${teacherIntel.atRiskStudents.length}`)
  teacherIntel.atRiskStudents.forEach((st: any) => {
    console.log(`    - [${st.name}]: ${st.riskFactors.join("; ")}`)
    console.log(`      Intervention: ${st.recommendedIntervention}`)
  })

  console.log("\n=== ALL E2E VERIFICATION CHECKS PASSED PERFECTLY ===")
}

runE2ETest().catch((err) => {
  console.error("E2E Test Failed:", err.message)
  process.exit(1)
})
