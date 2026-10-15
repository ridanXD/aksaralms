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
