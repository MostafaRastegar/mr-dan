# Contract — access-control baseline

## Guard functions

All guards live in `src/server/advising-guards.ts` and run in the route/page
entry, not in middleware (the Next 16 proxy cannot hit the DB).

- `requireSessionUser()` — pages. Resolves the `mrdan_session` cookie; throws a
  redirect to `/login` when absent (never a redirect loop).
- `requireApiSession()` — API routes. Throws `UnauthorizedError` (HTTP 401)
  when there is no live session. First statement inside each route `try`.
- `requireCapability(capability)` — pages. Session then capability; redirects
  to `/profile` when the role lacks it.
- `requireApiCapability(capability)` — API routes. Session then capability;
  throws `ForbiddenError` (HTTP 403) when the role lacks it.

## Error classes and HTTP mapping

Both extend `AppError` (`code`, `status`, `cause` preserved). Presentation maps
them through `toHttpError`; no stack trace reaches the client.

| Error | status | code | Body |
|---|---|---|---|
| `UnauthorizedError` | 401 | `unauthorized` | `{error:{code,message,requestId}}` |
| `ForbiddenError` | 403 | `forbidden` | `{error:{code,message,requestId}}` |

## Role model

- `Role = "student" | "counselor" | "admin"` (
  `src/modules/advising/domain/models.ts`).
- `toRole(value): Role` — `"admin"→admin`, `"counselor"→counselor`, anything
  else → `"student"` (default deny). Unknown role strings never produce admin.
- `CAPABILITIES: Record<Role, readonly Capability[]>` — admin holds the full
  counselor set plus `rag:manage` and `user:manage`, written out explicitly.

## Registration cannot mint admin

`registerSchema.roleField` refines to `student | counselor` and pipes
`z.enum(["student","counselor"])`; `ROLES = ["student","counselor"]`. The form
options are hardcoded the same. No route/action assigns the `admin` role; the
only admin path is `scripts/create-admin.ts`.

## Route coverage

**9 session-gated API routes** (401 anonymous, 200 authenticated):
`documents`, `documents/[id]`, `ingest`, `upload`, `conversations`,
`conversations/[id]`, `search`, `chat`, `chat/stream`.

**6 admin-gated API routes** (401 anonymous, 403 non-admin, 200 admin):
`admin/chunks`, `admin/chunks/[id]`, `admin/stats`, `admin/cache/clear`,
`admin/retrieval/debug`, `GET /api/openapi`.

Public (no session): `GET /api/health`, `GET /api/metrics`, `/`, `/login`,
`/register`.

## Edge cases

- Missing cookie → 401 (not 500).
- Expired/unknown token → 401.
- Counselor/student on an admin API → 403 (never 401/redirect).
- Admin page guard → `/api-docs`, `/admin/knowledge` render; non-admin →
  `/profile`.
- `role:"admin"` in registration → parse fails.
- `toRole("anything-else")` → `student`.
