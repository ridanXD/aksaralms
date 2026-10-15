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
