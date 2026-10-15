# MASTER RULES — EDUCATION TECHNOLOGY COMPETITION

## 1. PROJECT CONTEXT

Build an original educational web application for a technology competition with the theme:

**“Innovating Education Through Technology”**

The application must demonstrate that technology can make learning:

* More connected
* More engaging
* More measurable
* More personalized
* More accessible

The application is primarily designed for students.

---

## 2. CORE FEATURES

The application must contain these core modules:

1. LMS
2. Attendance / Presensi
3. Grades / Nilai
4. Assignments / Tugas
5. AI Training
6. Competitive Quiz — King of the Hill

These features must NOT feel like separate applications.

They should form one connected learning ecosystem:

**LMS → Attendance → Assignment → Quiz → Grades → AI Analysis → AI Training → Improvement**

---

## 3. CORE LEARNING LOOP

The main product loop is:

**LEARN → PRACTICE → COMPETE → MEASURE → ANALYZE → ADAPT → LEARN AGAIN**

Every major feature should contribute to this loop.

Do not add features merely because they look impressive.

---

## 4. TECHNOLOGY

Preferred architecture:

### Frontend

* Next.js
* TypeScript
* Responsive web application
* Deployable to Vercel

### Backend

* Node.js
* REST API or existing project API architecture
* Deployable to Pterodactyl

### Database

* PostgreSQL
* Supabase may be used where appropriate

### AI

External AI API.

Possible providers:

* LongCat
* MiMo V2.5 Pro

The AI implementation must use a provider abstraction so the provider can be replaced later.

---

## 5. SECURITY

Never expose AI API keys to the frontend.

Never put secrets inside:

* React components
* Client-side JavaScript
* Git repository
* Public environment variables

Use server-side environment variables.

Never trust client-provided:

* Scores
* Grades
* Attendance status
* User roles
* Quiz completion status

Important competition logic must be validated server-side.

---

## 6. MOBILE-FIRST

The primary target is mobile.

Optimize first for:

* 360px
* 375px
* 390px
* 412px
* 430px

Then support tablet and desktop.

Do NOT design a desktop application and simply shrink it for mobile.

---

## 7. UI PRINCIPLES

The interface should be:

* Clean
* Professional
* Modern
* Educational
* Easy to understand
* Fast
* Responsive

Avoid excessive:

* Glassmorphism
* Gradients
* Floating containers
* Pills
* Decorative cards
* Neon effects
* Giant hero sections
* Unnecessary animations
* “AI-looking” visual gimmicks

The application should look like a serious education product, not an AI-generated template.

---

## 8. ENGINEERING PRINCIPLES

Prefer:

**Simple > Clever**

**Stable > Ambitious**

**Real integration > Fake functionality**

**Educational value > Visual gimmicks**

**Reusable components > Duplicate components**

**Incremental implementation > Massive rewrite**

Before changing code:

1. Inspect existing architecture.
2. Understand existing patterns.
3. Reuse existing components.
4. Identify affected files.
5. Implement only the required scope.

Never rewrite unrelated parts of the project.

---

## 9. STATES

Every user-facing feature should handle:

* Loading
* Empty
* Success
* Error
* Disabled
* Permission denied where relevant

Do not leave broken blank screens.

---

## 10. AI PRINCIPLE

AI must have an actual educational purpose.

Good uses:

* Explain a topic
* Generate practice questions
* Analyze quiz performance
* Identify weak topics
* Recommend learning material
* Generate personalized practice

Do NOT use AI for deterministic tasks such as:

* Basic arithmetic
* Quiz scoring
* Attendance recording
* Authentication
* Authorization
* Database operations

---

## 11. MVP PRIORITY

### P0 — Must Work

* Authentication
* LMS
* Quiz
* King of the Hill
* Server-side scoring
* Leaderboard
* Grades
* AI Training

### P1 — Should Work

* Attendance
* Assignments

### P2 — Optional

* Achievements
* Streak system
* Advanced analytics
* Teacher analytics
* Tournament mode
* Additional quiz modes

Never sacrifice P0 stability for P2 features.

---

## 12. DEFINITION OF DONE

A feature is considered complete when:

* It works end-to-end.
* It works on mobile.
* It has loading/error/empty states where needed.
* It uses real application data.
* It follows existing architecture.
* It does not expose secrets.
* Important validation occurs server-side.
* No obvious runtime errors remain.
* The implementation does not unnecessarily break existing features.
