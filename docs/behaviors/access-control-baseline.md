---
last_verified: 2026-11-23
source_files: src/server/advising-guards.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/capabilities.ts, scripts/create-admin.ts, src/modules/advising/domain/planning-access.ts, src/app/(advising)/schedule/page.tsx, src/app/(advising)/homework/page.tsx, src/app/(advising)/study/page.tsx, src/app/(advising)/layout.tsx
---

# Behavior — access-control baseline

Every non-operational surface requires a live session. Operational probes
(`GET /api/health`, `GET /api/metrics`) are public. Anonymous callers get 401
on APIs and are redirected to `/login` on pages. Surfaces above
`student`/`counselor` return 403 to non-admin roles; `/admin/knowledge`,
`/api-docs`, `/api/openapi`, and `GET /api/admin/**` are admin-only.

## Access matrix

| Surface | anon | student | counselor | admin |
|---|---|---|---|---|
| `GET /api/health`, `GET /api/metrics` | 200 | 200 | 200 | 200 |
| `/`, `/login`, `/register` | 200 | 200 | 200 | 200 |
| `/chat`, `/profile` | → `/login` | 200 | 200 | 200 |
| `/counselor/students` | → `/login` | → `/profile` | 200 | 200 |
| `/schedule`, `/homework`, `/study` | → `/login` | 200 | 200 | 200 |
| `/admin/knowledge`, `/api-docs` (pages) | → `/login` | → `/profile` | → `/profile` | 200 |
| 9 RAG data routes | 401 | 200 | 200 | 200 |
| `GET /api/openapi` | 401 | 403 | 403 | 200 |
| 5 admin API routes | 401 | 403 | 403 | 200 |

## What a caller observes

- APIs: `401 {error:{code:"unauthorized",message,requestId}}` or `403
  {error:{code:"forbidden",message,requestId}}` as JSON, never a stack trace.
- Pages: unauthenticated → redirect `/login`; session but insufficient role →
  redirect `/profile`. No feature markup renders.

### Planning pages

`/schedule`, `/homework` and `/study` are readable by students, counselors and admins
(200) and redirect anonymous users to `/login`. A counselor can write only their own
planning rows (`schedule:write`, `homework:write`, `study:write` — self-scoped); a
counselor cannot write any student's row, including their own students', and gets
`ForbiddenError` (403) with zero writes. Read of own students' rows is enforced at
the use-case layer with no UI until 5.4.

## Creating an admin

Run `pnpm tsx scripts/create-admin.ts <username>` (dev only). The script refuses
`NODE_ENV=production`, promotes an existing user (role only, never touches
`passwordHash`), or creates a new admin with a generated scrypt-hashed password
printed once. Registration can never mint admin: `registerSchema` accepts only
`student` or `counselor`.

## Intentionally out of scope

- No admin UI / user-management screen; `user:manage` is declared but unused.
- No per-user RAG ownership: any session sees all RAG data.
- No RAG deletion, middleware/proxy, new dependency, or env var.
