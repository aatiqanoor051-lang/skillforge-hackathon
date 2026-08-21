# SkillForge API Reference

Base URL (local): `http://localhost:5000/api`

All responses use a consistent envelope:

```json
{ "success": true, "data": { }, "error": null }
{ "success": false, "data": null, "error": "message", "details": [ ] }
```

Authenticated routes require a header: `Authorization: Bearer <jwt>`

---

## Auth

### POST /auth/register
Body: `{ name, email, password }` — creates a `student` account (mentor/admin
accounts are provisioned by an existing admin via `/admin/users/:id/role`).

### POST /auth/login
Body: `{ email, password }` → `{ token, user }`

### GET /auth/me
Requires auth. Returns the current user.

---

## Profile (student, own data only)

### GET /profile
### PUT /profile
Body (all optional): `{ education, bio, currentSkills: [{name, proficiency}], projects: [{title, description, technologies, url}], targetRole, experienceLevel }`

---

## Roles

### GET /roles
Returns the active target-role catalog with benchmark skill requirements.
Falls back to a static in-memory catalog if the database hasn't been seeded.

---

## Assessment (student)

### GET /assessment/questions?role=Full-Stack%20Developer
Returns up to 10 randomized questions for the role (no correct answers included).

### POST /assessment/submit
Body: `{ targetRole, answers: [{ questionId, selectedAnswer }] }`
Grades answers, calls the Python analysis service, stores and returns the
full analysis (`overallReadiness`, `topicScores`, `matchedSkills`,
`missingSkills`, `proficiencyGaps`).

### GET /assessment/history
Returns the student's past assessments, newest first.

---

## Roadmap (student)

### POST /roadmap/generate
Body: `{ assessmentId? }` — defaults to the latest assessment. Invokes the AI
roadmap generator (or deterministic fallback) and stores the result.

### GET /roadmap/latest

### PATCH /roadmap/:id/progress
Body: `{ weekNumber, status }` where status is one of
`not_started | in_progress | completed`.

---

## AI Coach

### POST /ai/chat
Body: `{ message }`. Returns `{ reply, grounded, sources, method }`. Uses a
local Markdown knowledge base (RAG) plus the student's own skill-gap data via
authorization-checked tools. `method` is `ai` or `deterministic_fallback`.

---

## Resources

### GET /resources?topic=React&difficulty=beginner
Students see verified resources plus their own submissions; mentors/admins
see everything.

### POST /resources
Body: `{ title, url, type?, topics?, difficulty?, description?, source? }`.
Mentor/admin submissions are auto-verified; student submissions start `pending`.

### PATCH /resources/:id/verify (mentor/admin)
Body: `{ status: 'verified' | 'rejected' }`

---

## Mentor (mentor/admin)

### GET /mentor/students?assignedOnly=true
### GET /mentor/students/:userId/dashboard
Returns `{ profile, latestAssessment, latestRoadmap }`. Mentors may only view
students assigned to them; admins may view any student.

---

## Admin (admin only)

### GET /admin/users
### PATCH /admin/users/:id/role — body: `{ role }`
### PATCH /admin/users/:id/status — body: `{ isActive }`
### PATCH /admin/users/:id/mentor-assignment — body: `{ mentorId }`

### GET /admin/quiz-questions
### POST /admin/quiz-questions — body: `{ topic, difficulty, question, options[], correctAnswer, explanation, applicableRoles[] }`
### PUT /admin/quiz-questions/:id
### DELETE /admin/quiz-questions/:id

### GET /admin/role-requirements
### POST /admin/role-requirements — body: `{ role, slug, description?, requiredSkills: [{skill, minProficiency}] }`
### PUT /admin/role-requirements/:id
### DELETE /admin/role-requirements/:id

### GET /admin/settings
Returns non-secret runtime configuration flags (whether AI is configured,
rate-limit settings, etc).

---

## Health

### GET /health (no auth)
Returns `{ status, dbConnected, timestamp }`.

---

## Python analysis microservice

Base URL (local): `http://localhost:5001`

### POST /api/analyze
Body:
```json
{
  "current_skills": [{"name": "Python", "proficiency": 70}],
  "target_role": "AI Engineer",
  "quiz_scores": [{"topic": "Python", "correct": 8, "total": 10}],
  "benchmark_skills": [{"skill": "Python", "minProficiency": 75}]
}
```
Returns `overallReadiness`, `topicScores`, `matchedSkills`, `missingSkills`,
`proficiencyGaps`, `weights`, `warnings`. Called internally by the backend's
`/api/assessment/submit` — not typically called directly by the frontend.

### GET /health
