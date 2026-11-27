---
last_verified: 2026-11-27
source_files: src/server/advising-guards.ts, src/modules/advising/domain/models.ts, src/modules/advising/domain/capabilities.ts, scripts/create-user.ts, src/modules/advising/application/planning-access.ts, src/modules/advising/application/schedule.ts, src/app/(advising)/schedule/page.tsx, src/app/(advising)/homework/page.tsx, src/app/(advising)/nutrition/page.tsx, src/app/(advising)/leisure/page.tsx, src/app/(advising)/layout.tsx
---

# Behavior — access-control baseline

Every non-operational surface requires a live session. Operational probes
(`GET /api/health`, `GET /api/metrics`) are public. Anonymous callers get 401
on APIs and are redirected to `/login` on pages. Surfaces above
`student`/`counselor` return 403 to non-admin roles; `/admin/knowledge`,
`/api-docs`, `/api/openapi`, and `GET /api/admin/**` are admin-only.

Since 2026-11-26 the role model has four roles (`student`, `counselor`,
`admin`, `operator`). The operator capability split and the page-gate matrix
live in `docs/behaviors/roles-and-access.md`; this baseline keeps the surfaces
that predate that change.

## Access matrix

| Surface | anon | student | counselor | admin |
|---|---|---|---|---|
| `GET /api/health`, `GET /api/metrics` | 200 | 200 | 200 | 200 |
| `/`, `/login`, `/register` | 200 | 200 | 200 | 200 |
| `/chat`, `/profile` | → `/login` | 200 | 200 | 200 |
| `/counselor/students` | → `/login` | → `/profile` | 200 | 200 |
| `/schedule`, `/homework` | → `/login` | 200 | → `/profile` | → `/profile` |
| `/nutrition`, `/leisure` | → `/login` | 200 | → `/profile` | → `/profile` |
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

`/schedule` and `/homework` are readable by students; counselors and admins are
redirected to `/profile`. A student writes only their own planning rows
(`homework:write`, self-scoped); the weekly schedule has no student write at all
and is authored by the counselor-of-record.

### Nutrition and leisure pages

`/nutrition` and `/leisure` are readable by students; counselors and admins are
redirected to `/profile`. `nutrition:read` and `leisure:read` gate the pages;
`nutrition:write` gates the physical profile and the meal plan and is self-scoped only.
A counselor cannot write a student's physical profile or save a meal plan for them
(`ForbiddenError`, 403, zero writes). There is no `leisure:write`: the leisure page renders
a derived suggestion and mutates nothing.

## Creating an admin

Run `pnpm tsx scripts/create-user.ts <username> --role admin` (dev only). The
script refuses
`NODE_ENV=production`, promotes an existing user (role only, never touches
`passwordHash`), or creates a new admin with a generated scrypt-hashed password
printed once. Registration can never mint admin: `registerSchema` accepts only
`student` or `counselor`.

## Intentionally out of scope

- No admin UI / user-management screen; `user:manage` is declared but unused.
- No per-user RAG ownership: any session sees all RAG data.
- No RAG deletion, middleware/proxy, new dependency, or env var.
