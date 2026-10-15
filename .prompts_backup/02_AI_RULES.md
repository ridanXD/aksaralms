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
