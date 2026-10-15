# DEVELOPMENT WORKFLOW

## CORE RULE

Build the project in small end-to-end vertical slices.

Do NOT build:

```text
All frontend → All backend → Integration at the end
```

Prefer:

```text
Feature UI → API → Database → Integration → Test
```

---

# PHASE 1 — FOUNDATION

Implement:

* Project structure
* Environment configuration
* Database connection
* Authentication
* User roles
* Base layout
* Responsive design system
* API structure

Do not over-engineer.

---

# PHASE 2 — LMS

Implement:

* Courses
* Modules
* Materials
* Progress
* Student learning view
* Teacher CRUD

Verify student and teacher flows.

---

# PHASE 3 — QUIZ

Implement:

* Quiz model
* Questions
* Options
* Quiz sessions
* Answer submission
* Server-side scoring
* Results

---

# PHASE 4 — KING OF THE HILL

Implement:

* Competitive quiz UI
* Score calculation
* Leaderboard
* Ranking
* Duplicate submission protection
* Post-quiz performance

---

# PHASE 5 — GRADES

Connect:

```text
Quiz
+
Assignments
↓
Grades
```

Students should see their real performance.

---

# PHASE 6 — ATTENDANCE

Implement:

* Attendance session
* QR/code
* Student check-in
* Attendance history
* Teacher summary

---

# PHASE 7 — ASSIGNMENTS

Implement:

* Assignment creation
* Deadline
* Submission
* Review
* Grading
* Feedback

---

# PHASE 8 — AI

Implement provider abstraction first.

Then:

1. AI Tutor
2. AI Quiz Generator
3. AI Performance Analysis
4. AI Training

---

# PHASE 9 — INTEGRATION

Connect:

```text
LMS
↓
Quiz
↓
Grades
↓
Performance Analysis
↓
AI Training
↓
Personalized Practice
```

---

# PHASE 10 — POLISH

Before competition demo:

* Test mobile
* Test desktop
* Fix loading states
* Fix empty states
* Fix error states
* Check security
* Check API keys
* Optimize slow requests
* Prepare realistic demo data
* Test the complete demo flow

---

# AGENT WORKFLOW

Before coding:

1. Inspect repository.
2. Understand architecture.
3. Find existing patterns.
4. Identify affected files.
5. Define implementation scope.

Then implement the smallest complete slice.

After coding:

1. Run relevant checks.
2. Fix errors.
3. Verify data flow.
4. Verify responsive behavior.
5. Report changed files.
6. Report remaining issues.

Never rewrite unrelated code.
