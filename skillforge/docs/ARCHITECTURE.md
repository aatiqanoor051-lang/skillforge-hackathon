# SkillForge Architecture

## Service boundaries

| Service | Responsibility | Talks to |
|---|---|---|
| frontend | UI, client-side routing/UX guards | backend (REST) |
| backend | Auth, RBAC, persistence, AI orchestration | MongoDB, python-service, AI provider (optional) |
| python-service | Deterministic skill-gap/quiz scoring | (stateless, no DB access) |
| MongoDB | Persistence | backend only |

The Python service is intentionally stateless and has no direct database
access or authentication of its own — it's a pure computation service that
the backend calls internally over the Docker network (`python-service:5001`).
It should not be exposed publicly in production; only the backend needs it.

## End-to-end assessment flow

1. Student completes their `Profile` (target role, current skills, projects).
2. Student requests `GET /assessment/questions?role=<role>` → backend pulls a
   randomized subset of `QuizQuestion` documents tagged with that role.
3. Student submits answers → `POST /assessment/submit`:
   - Backend grades each answer server-side (never trusts a client-supplied
     "correct" flag).
   - Backend aggregates per-topic quiz totals and fetches the role's
     benchmark skills (`RoleRequirement`, falling back to the static
     `data/roleCatalog.js` if unseeded).
   - Backend calls `POST http://python-service/api/analyze` with the
     student's current skills, quiz scores, and benchmark skills.
   - `SkillAnalyzer` (Python, `python-service/analyzer.py`) normalizes skill
     names (case/punctuation-insensitive), computes weighted quiz
     percentages, and computes `missingSkills` via set subtraction between
     benchmark skill keys and the student's current skill keys, plus
     `proficiencyGaps` for skills present but below the required threshold.
   - Backend persists the result as an `Assessment` document and returns it.
4. Student (optionally) requests `POST /roadmap/generate`:
   - Backend summarizes the profile and assessment into plain-text context.
   - `generateRoadmap()` (`backend/ai-service/generator.js`) builds a
     strict system+user prompt, calls the configured OpenAI-compatible
     model requesting JSON, validates the response against a schema
     (`validateRoadmapShape`), retries once with a correction prompt on
     failure, and falls back to `buildDeterministicFallbackRoadmap()` if the
     AI is unconfigured or still invalid after retry.
   - Result is persisted as a `Roadmap` (exactly 4 weeks, each with
     objectives, topics, resources, a project, deliverables, and completion
     criteria).

## AI Coach (RAG + agentic tools)

`backend/ai-service/agent.js` implements `runCoachQuery(requestingUser, message)`:

1. **Retrieval**: `RagEngine` (`ragEngine.js`) loads all `.md` files under
   `ai-service/knowledge-base/`, splits them into heading-delimited passages,
   and scores passages against the query using deterministic keyword overlap
   (heading matches weighted 2x). No embeddings/vector DB — this keeps the
   service dependency-free and fully offline-capable. Top 4 passages are
   returned with their source file and heading, so citations stay verifiable.
2. **Tool calls**: the agent calls `getSkillGaps(requestingUser, {userId})`
   to pull the student's own latest missing-skills data. Both tools
   (`getUserSkills`, `getSkillGaps`) validate their arguments and call
   `assertAuthorizedSelfAccess()`, which throws `ToolAuthorizationError`
   unless the requesting user is acting on their own data or holds a
   `mentor`/`admin` role.
3. **Prompt construction**: retrieved passages and tool results are wrapped
   in a clearly labeled `RETRIEVED REFERENCE PASSAGES` / `STUDENT SKILL-GAP
   CONTEXT` block and explicitly marked as **untrusted, informational only**
   in the system prompt, with an explicit instruction never to follow
   instructions embedded in that data. This mitigates prompt injection from
   knowledge-base content or attacker-controlled profile fields.
4. **Fallback**: if `AI_API_KEY` is unset or the API call fails,
   `deterministicCoachFallback()` returns a rule-based answer built directly
   from the retrieved passages and skill-gap data — the Coach never goes
   silent just because no AI provider is configured.

## RBAC model

Three roles: `student`, `mentor`, `admin`.

- `requireAuth()` (backend/middleware/authMiddleware.js) verifies the JWT and
  attaches `req.user = { userId, role, email, name }`.
- `requireRole(...roles)` rejects with 403 if `req.user.role` isn't in the
  allow-list. Used for `/admin/*` (admin only) and `/mentor/*` (mentor+admin).
- `requireSelfOrRole(paramName, ...roles)` allows a route when the
  authenticated user's id matches `req.params[paramName]`, OR their role is
  privileged. Used conceptually by the agent's `assertAuthorizedSelfAccess`
  helper as well, so a student can never read another student's skill data
  through the AI Coach either.
- The frontend's `ProtectedRoute` component only hides navigation UI for
  disallowed roles — it is explicitly documented as **not** the real
  enforcement boundary, since the server always re-checks.

## Deterministic fallback strategy (design principle)

Both AI features (`generator.js`, `agent.js`) follow the same pattern:
attempt the AI call → validate/parse the result → on any failure (unconfigured
key, network error, invalid JSON, schema mismatch after one retry) → fall
back to a fully deterministic, still-useful result. This means:

- The app has zero hard dependency on an external AI provider to be useful.
- CI/tests never need a live AI key.
- A demo environment with `AI_API_KEY=""` is fully functional end-to-end.

## Data model summary

- **User**: auth identity + role (`student|mentor|admin`).
- **Profile**: 1:1 with User — education, bio, currentSkills[], projects[],
  targetRole, experienceLevel, optional assigned `mentor`.
- **QuizQuestion**: topic/difficulty-tagged bank, `applicableRoles[]`.
- **Assessment**: graded answers, per-topic scores, overall readiness,
  matched/missing skills — one per submission, queried by recency.
- **Roadmap**: exactly 4 `weeks[]`, linked to the `sourceAssessment`,
  `generationMethod` (`ai | ai_retry | deterministic_fallback`), per-week
  status and an aggregate `completionPercentage`.
- **Resource**: community-submitted learning links with a mentor/admin
  verification workflow (`pending|verified|rejected`).
- **RoleRequirement**: admin-editable benchmark skill catalog per target role
  (seed data mirrored in `backend/data/roleCatalog.js` as a fallback).
