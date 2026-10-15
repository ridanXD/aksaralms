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
