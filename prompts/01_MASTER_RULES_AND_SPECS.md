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

---

# MVP SPECIFICATION

## PURPOSE

Build a functional MVP that demonstrates the complete learning ecosystem.

The MVP does not need every possible feature.

It must demonstrate a strong end-to-end learning flow.

---

# 1. LMS

## Student

Students can:

* View enrolled classes
* Open a class
* View learning modules
* Open learning materials
* Track learning progress
* Continue unfinished learning

## Teacher

Teachers can:

* Create modules
* Edit modules
* Publish modules
* Organize learning materials

---

# 2. ATTENDANCE

Students can:

* View attendance status
* Check in using QR/code
* View attendance history

Teachers can:

* Create attendance sessions
* View attendance records
* View attendance summary

Keep the MVP simple.

Do not implement biometric attendance.

---

# 3. ASSIGNMENTS

Students can:

* View assignments
* View deadlines
* Submit assignments
* View submission status
* View grade
* View teacher feedback

Teachers can:

* Create assignments
* Set deadlines
* View submissions
* Grade submissions
* Provide feedback

---

# 4. GRADES

Students can view:

* Assignment grades
* Quiz grades
* Overall progress
* Performance breakdown

Grades must come from actual stored assessment data.

Do not create fake grade values just for UI.

---

# 5. AI TRAINING

AI Training is one of the flagship features.

It should not behave like a generic chatbot.

The system should use the student's learning context and performance.

Example:

Student performs poorly on:

**JavaScript Functions**

The system identifies:

**Weak topic: Functions**

Then provides:

1. Explanation
2. Example
3. Practice question
4. Evaluation
5. Additional practice if needed

Core loop:

**ASSESS → EXPLAIN → PRACTICE → EVALUATE → ADAPT**

---

# 6. KING OF THE HILL QUIZ

The quiz is a competitive learning mode.

Students compete for the highest score.

Each question has:

* Question
* Answer options
* Timer
* Topic
* Difficulty

The system evaluates:

* Correctness
* Response time
* Streak

Correctness must have greater importance than speed.

---

# 7. LEADERBOARD

Leaderboard should display:

* Rank
* Username
* Score
* Correct answers
* Average response time

The current highest-ranked player can be displayed as:

**King of the Hill**

---

# 8. USER JOURNEY

The ideal competition demo should follow:

Login

↓

Home

↓

Continue LMS lesson

↓

Check attendance

↓

Submit assignment

↓

Enter quiz

↓

King of the Hill

↓

Receive score

↓

Leaderboard

↓

Performance analysis

↓

AI Training

↓

Personalized practice

↓

Improvement

---

# 9. PRIORITY

## P0

Implement completely:

* Authentication
* LMS
* Quiz
* King of the Hill
* Leaderboard
* Grades
* AI Training

## P1

Implement after P0:

* Attendance
* Assignments

## P2

Only after P0 and P1 are stable:

* Achievements
* Advanced analytics
* Additional competition modes

---

# AI SYSTEM RULES

## PURPOSE

AI exists to improve the student's learning process.

It must not be implemented as a generic chatbot merely because the project contains AI.

---

# 1. AI TUTOR

The AI Tutor should understand the current learning context.

Input may include:

* Course
* Module
* Topic
* Learning material
* Student question

The AI should provide:

* Clear explanation
* Relevant example
* Simple explanation when requested
* Deeper explanation when requested
* Optional follow-up practice

Prefer information from the current learning context.

---

# 2. AI QUIZ GENERATOR

The AI may generate practice questions based on:

* Course
* Topic
* Learning material
* Difficulty
* Number of questions

Expected structure:

```text
question
options
correctAnswer
explanation
difficulty
topic
```

The backend MUST validate generated data before saving or using it.

Do not blindly trust AI-generated JSON.

---

# 3. AI PERFORMANCE ANALYSIS

The system can provide the AI with:

* Quiz results
* Incorrect answers
* Topic tags
* Historical performance
* Response patterns

The AI should return:

* Strong topics
* Weak topics
* Recommended topics
* Recommended difficulty
* Suggested practice

Do not make unsupported claims about the student's personality, intelligence, mental state, or personal characteristics.

Focus on observable learning data.

---

# 4. AI TRAINING

AI Training follows:

**ASSESS**

Determine what the student needs to practice.

↓

**EXPLAIN**

Explain the relevant concept.

↓

**PRACTICE**

Give targeted questions.

↓

**EVALUATE**

Check the student's answer.

↓

**ADAPT**

Adjust the next exercise according to performance.

---

# 5. PROVIDER ABSTRACTION

Do not tightly couple application logic to a single AI provider.

Use a conceptual interface:

```text
AIProvider
├── LongCatProvider
└── MiMoProvider
```

Possible shared operations:

```text
generateText()
generateStructured()
generateQuiz()
analyzePerformance()
```

The rest of the application should not need to know which provider is being used.

---

# 6. SECURITY

AI API keys MUST remain on the backend.

Never expose them through:

* NEXT_PUBLIC_ variables
* Client components
* Browser requests
* HTML
* Git commits

Use environment variables.

---

# 7. COST CONTROL

AI requests should be controlled.

Use:

* Relevant context only
* Reasonable output limits
* Rate limiting
* Caching where safe
* Short prompts where possible

Do not send an entire database record or entire course to the AI when only one topic is needed.

---

# 8. AI UX

AI Training should feel like a learning activity.

Prefer:

* Training sessions
* Practice cards
* Topic indicators
* Progress
* Feedback
* Retry
* Continue training

Do not make the primary interface look like a generic ChatGPT clone.

---

# 9. FALLBACK

If the AI provider fails:

* Show a clear error.
* Allow retry.
* Do not break the entire LMS.
* Do not fabricate an AI response.

The application must remain usable even when the AI API is temporarily unavailable.

---

# KING OF THE HILL QUIZ

## CONCEPT

King of the Hill turns assessment into a competitive learning experience.

Students compete for the highest score within a class or topic.

The competition must still prioritize learning.

---

# 1. SCORING

Score should consider:

* Correctness
* Response speed
* Streak

Example starting formula:

```text
Correct answer = 100 base points
Speed bonus = 0–50
Streak bonus = 0–25
Wrong answer = 0
```

The exact formula may be adjusted during implementation.

IMPORTANT:

**Correctness must matter more than speed.**

A fast incorrect answer must not outperform a correct answer simply because it was submitted faster.

---

# 2. SERVER AUTHORITATIVE SCORING

The frontend must NOT determine the final score.

The backend calculates:

* Correctness
* Response time
* Bonus
* Final score

Never trust:

```text
clientScore
clientCorrect
clientTime
clientRank
```

as authoritative values.

---

# 3. QUIZ FLOW

```text
START QUIZ
↓
Create quiz session
↓
Show question
↓
Start timer
↓
Student selects answer
↓
Submit answer
↓
Server evaluates answer
↓
Server calculates score
↓
Return result
↓
Next question
↓
Finish quiz
↓
Calculate final result
↓
Update leaderboard
↓
Show performance
↓
Offer AI Training
```

---

# 4. LEADERBOARD

Leaderboard should contain:

* Rank
* Player
* Score
* Correct answers
* Average response time

Do not overwhelm the active quiz screen with leaderboard information.

Show competition information before and after gameplay.

---

# 5. ANTI-CHEAT BASICS

Implement basic protection:

* Server-authoritative scoring
* Quiz session IDs
* Attempt validation
* Duplicate submission protection
* Question/session validation
* Server-side answer validation

Do not rely on frontend timers for final scoring.

---

# 6. EDUCATIONAL CONNECTION

After the quiz, identify weak topics.

Example:

```text
Score: 720

Strong:
- Variables
- Arrays

Needs practice:
- Functions
- Async JavaScript
```

Then provide actions:

```text
Review Functions
Start AI Training
Retry Practice
```

The competition must lead back into learning.

---

# 7. FUTURE FEATURES

Do NOT implement these before the MVP is stable:

* Daily Hill
* Weekly Hill
* Tournament
* Class-vs-class
* Seasonal rankings
* Rewards
* Advanced anti-cheat

---

# UI/UX RULES

## PRIMARY TARGET

Mobile-first.

Test the interface around:

* 360px
* 375px
* 390px
* 412px
* 430px

Desktop is secondary but must remain fully functional.

---

# 1. MOBILE NAVIGATION

Recommended primary navigation:

```text
Home
Learn
Quiz
AI
Profile
```

Do not place every feature into the bottom navigation.

Attendance, assignments, and grades can be accessed through:

```text
Home
Class
Course
```

depending on context.

---

# 2. HOME

The home screen should prioritize useful learning information.

Possible sections:

* Continue learning
* Current class
* Upcoming assignment
* Attendance status
* Recent grade
* Current King of the Hill position
* AI Training recommendation

Avoid turning the dashboard into a wall of cards.

---

# 3. LMS

A student should be able to quickly understand:

* What course they are viewing
* Current module
* Progress
* What should be completed next

Use clear hierarchy.

---

# 4. CLASS PAGE

Suggested structure:

```text
Overview
Materials
Assignments
Quiz
Attendance
Grades
```

Keep navigation simple.

---

# 5. QUIZ UI

The quiz screen should prioritize:

1. Question
2. Timer
3. Answer options
4. Progress

Remove unnecessary navigation.

The student should be able to answer quickly without visual distraction.

---

# 6. AI TRAINING UI

AI Training should look like a training environment.

Useful elements:

* Current topic
* Difficulty
* Progress
* Question
* Explanation
* Feedback
* Retry
* Continue

Avoid building a generic messaging application.

---

# 7. DESKTOP

On desktop:

* Bottom navigation may become sidebar navigation.
* Dashboards may use multiple columns.
* Teacher interfaces may use tables.
* Learning material can use wider layouts.
* AI training may use side-by-side context.

Desktop should be an expanded version of the same product.

Do not build an unrelated desktop application.

---

# 8. VISUAL STYLE

Target:

**Clean + Professional + Educational + Modern**

Avoid excessive:

* Glassmorphism
* Neon
* Gradients
* Floating pills
* Huge rounded containers
* Decorative backgrounds
* Excessive animations
* AI visual clichés

The product should feel credible in a competition presentation.

---

# 9. ACCESSIBILITY

Include:

* Good contrast
* Semantic HTML
* Keyboard navigation
* Visible focus states
* Large touch targets
* Clear error messages
* Loading states
* Empty states

Never communicate important information only through color.

---

# 10. RESPONSIVENESS

Do not solve mobile layouts by:

* Shrinking desktop components
* Making tables overflow unnecessarily
* Adding horizontal scrolling everywhere
* Making text extremely small

Build responsive layouts intentionally.

---

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

---

# COMPETITION GOALS

## MAIN GOAL

Demonstrate how technology can create a connected, engaging, measurable, and personalized learning experience.

---

# GOAL 1 — CONNECT LEARNING

Connect:

* LMS
* Attendance
* Assignments
* Quiz
* Grades
* AI Training

The user should not feel like they are switching between unrelated systems.

---

# GOAL 2 — IMPROVE ENGAGEMENT

Use King of the Hill to make assessments more engaging.

The competition system should encourage:

* Participation
* Accuracy
* Practice
* Improvement

Competition should support learning rather than replace it.

---

# GOAL 3 — PERSONALIZE LEARNING

Use actual learning data to determine what the student should practice.

Example:

```text
Quiz Result
↓
Weak Topic
↓
AI Analysis
↓
Personalized Training
↓
Practice
↓
Reassessment
```

---

# GOAL 4 — MAKE AI USEFUL

AI should provide concrete educational value.

Examples:

* Explain concepts
* Generate questions
* Analyze mistakes
* Recommend topics
* Generate personalized exercises

Do not use AI merely as a marketing label.

---

# GOAL 5 — MOBILE ACCESSIBILITY

The primary learning experience should work well on smartphones.

A student should be able to:

* Learn
* Submit assignments
* Check attendance
* Take quizzes
* View grades
* Practice with AI

without needing a desktop.

---

# CORE PRODUCT LOOP

```text
LEARN
↓
PRACTICE
↓
COMPETE
↓
MEASURE
↓
ANALYZE
↓
ADAPT
↓
LEARN AGAIN
```

This loop is the heart of the product.

---

# COMPETITION DEMO

The ideal demonstration:

```text
Student Login
↓
Dashboard
↓
Continue LMS
↓
Attendance
↓
Assignment
↓
King of the Hill Quiz
↓
Score
↓
Leaderboard
↓
Weak Topic Detection
↓
AI Analysis
↓
AI Training
↓
Personalized Practice
↓
Improvement
```

The demo should clearly show the connection between features.

---

# SUCCESS CRITERIA

The product should make it easy to understand:

1. What problem it solves.
2. Who uses it.
3. How the features connect.
4. Why AI is useful.
5. How King of the Hill changes assessment.
6. Why mobile-first matters.
7. How learning performance drives personalization.

---

# CODING AGENT EXECUTION RULES

You are the implementation agent for this education technology competition project.

Before doing anything, read all files inside:

```text
prompts/
```

At minimum:

```text
00_MASTER_RULES.md
01_MVP.md
02_AI_RULES.md
03_KING_OF_THE_HILL.md
04_UI_UX.md
05_DEVELOPMENT_WORKFLOW.md
06_COMPETITION_GOALS.md
```

---

# FIRST ACTION — INSPECT

Do NOT immediately write code.

Inspect the existing repository.

Determine:

* Framework
* Package manager
* Frontend architecture
* Backend architecture
* Database
* ORM
* Authentication
* Authorization
* Existing routes
* Existing API
* Existing components
* Existing pages
* Existing design system
* Environment configuration
* Existing tests
* Deployment configuration

---

# FIRST REPORT

Before making changes, provide:

## Current Architecture

Describe the current project architecture.

## Existing Features

List features that already exist.

## Missing MVP

Compare the repository against the MVP prompt.

## Recommended Next Slice

Identify the smallest useful next implementation.

## Files Likely To Change

List files that will probably be modified.

## Risks

Mention technical risks or unknowns.

Then WAIT for implementation instructions unless autonomous implementation was explicitly requested.

---

# IMPLEMENTATION RULES

When asked to implement a feature:

1. Understand the requested scope.
2. Inspect relevant existing files.
3. Reuse existing patterns.
4. Identify affected files.
5. Implement the smallest complete solution.
6. Avoid unrelated refactoring.
7. Run relevant checks.

---

# DO NOT

Do not:

* Invent APIs that do not exist.
* Invent database fields without reason.
* Expose API keys.
* Put secrets in client code.
* Trust client-side scores.
* Trust client-side roles.
* Rewrite the whole project.
* Install unnecessary dependencies.
* Replace the framework without explicit instruction.
* Build P2 features before required MVP features.
* Add decorative UI that does not improve UX.
* Turn AI Training into a generic chatbot.
* Make the application desktop-first.
* Fake functionality with hardcoded data when real integration is expected.

---

# WHEN SOMETHING IS UNCLEAR

Do not silently guess when the decision affects architecture.

Instead:

1. Explain the ambiguity.
2. Show the relevant existing implementation.
3. State the smallest safe assumption.
4. Ask only when necessary.

For small implementation details, follow existing project conventions.

---

# AFTER IMPLEMENTATION

Report:

## Changed Files

List every changed file.

## What Changed

Explain the implementation briefly.

## Validation

List:

* Tests
* Type checks
* Lint
* Build
* Other relevant checks

## Remaining Issues

List anything that still needs attention.

---

# QUALITY STANDARD

The project should prioritize:

**Stable > Ambitious**

**Simple > Clever**

**Real functionality > Mock functionality**

**Educational value > Visual gimmicks**

**Mobile-first > Desktop-first**

**Connected features > Isolated features**

**Incremental development > Massive rewrites**
