# Plan — access-control-baseline

Supersedes `rag-login-gate.md` (history only).

## Goal

Introduce the `admin` role and make every non-operational surface login-only:
RAG/session surfaces for any session, `/admin/knowledge`, `/api/admin/**`,
`/api/openapi` and `/api-docs` for `admin` only (401 anonymous, 403 other roles).
No feature work, no retrieval change, no schema migration.

## Non-goals

- No admin UI / user-management screen; `user:manage` is declared but unused
  (approved for the role table). No per-user RAG ownership (any session sees all
  RAG data); no RAG deletion, middleware/proxy, new dependency or env var.
- Registration still offers only `student` / `counselor`; it can never mint admin.

## Role model facts (verified)

- `models.ts:9` → `Role = "student" | "counselor"`; `CAPABILITIES: Record<Role, …>`
  makes a missing `admin` row a compile error (good).
- `prisma/schema.prisma` → `role String`, no PG enum ⇒ **no migration**, but
  `prisma-user-repository.ts:67` `toRole()` maps anything ≠ `"counselor"` to
  `"student"` ⇒ it **must** learn `"admin"` or a promoted admin logs in as student.
- Registration cannot produce admin today: `schemas.ts:71` `roleField` refines to
  `student|counselor` and pipes `z.enum(["student","counselor"])`; the form options
  are hardcoded the same. Keep it that way and prove it with a unit test.

## Access matrix (target)

| Surface | anon | student | counselor | admin |
|---|---|---|---|---|
| `/api/health`, `/api/metrics` | 200 | 200 | 200 | 200 |
| `/`, `/login`, `/register` | 200 | 200 | 200 | 200 |
| `/chat` | → `/login` | 200 | 200 | 200 |
| `/profile` | → `/login` | 200 | 200 | 200 |
| `/counselor/students` (existing gate) | → `/login` | → `/profile` | 200 | 200 (admin carries counselor caps) |
| `/admin/knowledge` (page) | → `/login` | → `/profile` | → `/profile` | 200 |
| `/api-docs` (page) | → `/login` | → `/profile` | → `/profile` | 200 |
| 9 RAG data routes: `documents`, `documents/[id]`, `ingest`, `upload`, `conversations`, `conversations/[id]`, `search`, `chat`, `chat/stream` | 401 | 200 | 200 | 200 |
| `GET /api/openapi` | 401 | 403 | 403 | 200 |
| 5 admin routes: `admin/chunks`, `admin/chunks/[id]`, `admin/stats`, `admin/cache/clear`, `admin/retrieval/debug` | 401 | 403 | 403 | 200 |

Gated API files: **9 session-gated** + **6 admin-gated** (5 admin routes + openapi).
`health`/`metrics` stay public.

## Ordered steps

1. **`src/modules/advising/domain/models.ts`** — `Role =
   "student" | "counselor" | "admin"`; move role parsing here as pure
   `export function toRole(value: string): Role` (`"admin"→admin`,
   `"counselor"→counselor`, anything else → `"student"`, default deny).
2. **`src/modules/advising/domain/capabilities.ts`** — add `"rag:manage"` and
   `"user:manage"` to `Capability`; admin row, written out explicitly (no
   inheritance), with a one-line comment that it intentionally includes the
   counselor set:
   `admin: ["profile:read", "profile:write", "group:manage", "student:assign", "rag:manage", "user:manage"]`.
   When `counselor` grows a capability, admin must be updated by hand — the plain
   data table is the point.
3. **`prisma-user-repository.ts`** — import `toRole` from domain, delete the local
   one. **`prisma/schema.prisma`** — comment only:
   `// "student" | "counselor" | "admin"`. No migration file, no `prisma migrate`.
4. **`src/server/advising-guards.ts`** — add `requireApiSession()` →
   `throw new UnauthorizedError()` (401) and `requireApiCapability(c)` → session
   then `hasCapability`, else `throw new ForbiddenError()` (403). Import both from
   `@/modules/advising/domain/errors`; `toHttpError` already maps `code`/`status`,
   so no second mapper. Pages keep `requireCapability` (redirect `/profile`).
5. **9 session-gated route files** — import `requireApiSession`; call it as the
   **first statement inside `try`** (outside `try` it escapes as 500), one call per
   exported method. Line budget 40: +2 normally; `upload` (39→41) and
   `conversations/[id]` (37+1+3=41) put the call on the existing `try {` line
   (`try { await requireApiSession();`, +0) → 40/38. If a file still exceeds 40,
   extract that handler's body; never raise the limit.
6. **6 admin-gated route files** — `admin/chunks`, `admin/chunks/[id]`,
   `admin/stats`, `admin/cache/clear`, `admin/retrieval/debug`, `openapi`:
   `await requireApiCapability("rag:manage");` as first statement in `try`.
7. **Pages** — `src/app/chat/page.tsx`: `async`, `await requireSessionUser()`.
   `src/app/admin/knowledge/page.tsx` and split `src/app/api-docs/page.tsx`:
   `await requireCapability("rag:manage")` (non-admin → `/profile`). `api-docs` is
   `"use client"`: move its body verbatim to
   `src/components/api-docs/api-docs-panel.tsx` (`"use client"`), page becomes an
   async RSC rendering `<ApiDocsPanel />` (same-origin fetch still sends the cookie).
8. **`scripts/create-admin.ts`** (new; mirrors `seed-advising.ts`): username from
   `argv[2]` or `ADMIN_USERNAME`; refuses `NODE_ENV === "production"`; promotes an
   existing user (`updateMany` on `role` only — never touches `passwordHash`), else
   creates with `ScryptAuthCrypto.hashPassword(generatePassword())` and prints the
   generated password **once, only when it created the user**. Exported
   `ensureAdmin(username, deps)` with injected `{env, findUser, createUser,
   promote}` so tests use no DB. Idempotent. No credential literal, no default
   password, no `package.json` script — document
   `pnpm tsx scripts/create-admin.ts <username>`. Admin is reachable only here:
   no route/action assigns the role.
9. **`src/lib/openapi.ts`** — `components.securitySchemes.cookieAuth`
   (apiKey/cookie/`mrdan_session`), top-level `security: [{cookieAuth: []}]`,
   `security: []` on `/api/health` + `/api/metrics`; `401` on protected ops, `403`
   on `/api/admin/**`; add a `/api/openapi` path entry documenting the spec
   response plus `401` and `403` (it is admin-only like the rest).
10. **Tests** — `tests/e2e/access-control.spec.ts` (new); extend
    `test/architecture.test.ts`; new unit tests `domain/models.test.ts`,
    `domain/capabilities.test.ts`, `presentation/schemas.test.ts`,
    `scripts/create-admin.test.ts`, plus an admin case in
    `application/groups.test.ts`; update `tests/e2e/knowledge-flow.spec.ts` to
    register/login before its first `/admin/knowledge` navigation.
11. **Docs** + full gate (`pnpm typecheck && pnpm lint && pnpm build && pnpm test`,
    plus e2e with `E2E_ENABLED=true`).

## Contract summary (file: `docs/contracts/access-control-baseline.md`)

- `Role` gains `"admin"`; `Capability` gains `"rag:manage"`, `"user:manage"`.
  Signatures: `requireApiSession(): Promise<SessionContext>` → 401
  `UnauthorizedError`; `requireApiCapability(c)` → 403 `ForbiddenError` when the
  role lacks `c`. Bodies come from `toHttpError`:
  `{"error":{"code":"unauthorized"|"forbidden","message":…,"requestId":…}}`.
- Invariant: *a request without a live `mrdan_session` never reaches a feature
  surface, and no role other than `admin` can execute a `/api/admin/**` handler,
  `GET /api/openapi`, or `/api-docs`.*
- Contract edge cases (each maps to an AC): missing cookie → 401; expired token →
  401 not 500; counselor/student admin API → 403; admin → 200; `role:"admin"`
  registration → reject; production bootstrap → throw; unknown role string →
  `student`; duplicate bootstrap → no create, no hash rewrite.
- `review_level: full` — new privileged role, authorization boundary, and a
  credential-generating bootstrap script. Honest note: the source diff stays
  <200 lines, but a wrong default opens a privileged surface, so paired execution
  against the real Postgres/dev server is warranted.

## Test cases

- `tests/e2e/access-control.spec.ts` (`test.skip(!E2E_ENABLED)`), test titles must
  match AC greps (`anonymous GET`, `anonymous mutations`, `401 shape`,
  `pages redirect`, `expired`, `student allowed`, `public probes`,
  `counselor forbidden`, `student forbidden`, `counselor page redirect`,
  `admin allowed`, `admin counselor parity`). Admin case: register via UI, run
  `execFileSync("pnpm", ["tsx","scripts/create-admin.ts",username])`, re-login.
- `test/architecture.test.ts`: route ≤40 (existing) + static coverage with two
  exact lists — `expect(sessionGated).toHaveLength(9)`,
  `expect(adminGated).toHaveLength(6)` — so an empty match set fails.
- Unit: `models.test.ts` (toRole); `capabilities.test.ts` (admin ⊇ counselor set +
  `rag:manage`/`user:manage`; counselor/student lack them); `schemas.test.ts`
  (`registerSchema` rejects `role:"admin"`); `groups.test.ts` (admin can create a
  group, i.e. passes the counselor-gated check); `create-admin.test.ts`
  (production refusal; create prints one generated password; duplicate run creates
  nothing and preserves the hash).

## Documentation impact

- `README.md`: roles paragraph (`admin` added; register creates only
  student/counselor); «ساخت ادمین» — dev-only script, argv/env username, refuses
  production, idempotent, generated password printed once, never commit it;
  access matrix; API table `دسترسی` column (`عمومی` / `ورود` / `ادمین`), with
  `/api/openapi` and `/api-docs` under `ادمین`; limitations (no admin UI; any
  session sees all RAG data).
- `docs/behaviors/access-control-baseline.md` (new): `last_verified: 2026-11-23`,
  `source_files:` the 15 gated route files, `src/server/advising-guards.ts`,
  `src/modules/advising/domain/{models,capabilities}.ts`,
  `src/modules/advising/infrastructure/prisma-user-repository.ts`,
  `src/modules/advising/presentation/schemas.ts`, `src/app/chat/page.tsx`,
  `src/app/admin/knowledge/page.tsx`, `src/app/api-docs/page.tsx`,
  `src/components/api-docs/api-docs-panel.tsx`, `scripts/create-admin.ts`.
- `docs/contracts/access-control-baseline.md` (new). `docs/plan/architecture.md` §2:
  guards expose `requireApiSession` / `requireApiCapability`; roles table gains
  `admin` (counselor set + `rag:manage`, `user:manage`) and the bootstrap script.
- CHANGELOG after approval only: `Added admin role (system-created), gated every
  feature surface behind login, and made /admin/knowledge, /api/admin/**,
  /api/openapi and /api-docs admin-only.`

## Acceptance Criteria

- [ ] AC-1: When anonymous, GET on `documents`, `documents/[id]`, `conversations`, `conversations/[id]`, `openapi`, `admin/chunks`, `admin/stats` returns 401. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "anonymous GET"`
- [ ] AC-2: When anonymous, POST on `documents`, `conversations`, `ingest`, `upload`, `search`, `chat`, `chat/stream`, `admin/cache/clear`, `admin/retrieval/debug`, PUT on `conversations/[id]`, and DELETE on `documents/[id]`, `conversations/[id]`, `admin/chunks/[id]` returns 401. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "anonymous mutations"`
- [ ] AC-3: When a 401 is returned, the body is `{error:{code:"unauthorized",message,requestId}}` as JSON with no stack trace. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "401 shape"`
- [ ] AC-4: When anonymous, `/chat`, `/admin/knowledge`, `/api-docs` land on `/login` with no feature markup. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "pages redirect"`
- [ ] AC-5: When the cookie holds an unknown/expired token, a RAG route returns 401 (never 500/200). — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "expired"`
- [ ] AC-6: When a student is logged in, `/chat` renders and `GET /api/documents` is 200. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student allowed"`
- [ ] AC-7: When anonymous, `/api/health` and `/api/metrics` still return 200 with current shape. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "public probes"`
- [ ] AC-8: When a counselor calls each of the six admin-gated routes (5 `admin/**` + `openapi`), each returns 403 with code `forbidden` (never 401/redirect). — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "counselor forbidden"`
- [ ] AC-9: When a student calls `GET /api/admin/stats`, `POST /api/admin/cache/clear`, `GET /api/openapi` all return 403, and opening `/api-docs` lands on `/profile`. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student forbidden"`
- [ ] AC-10: When a counselor opens `/admin/knowledge` or `/api-docs`, the browser lands on `/profile` and no admin UI renders. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "counselor page redirect"`
- [ ] AC-11: When an admin is logged in, `/admin/knowledge` and `/api-docs` render and `GET /api/admin/stats` returns 200. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "admin allowed"`
- [ ] AC-12: When an admin acts as a counselor, creating a group succeeds and `/counselor/students` renders the roster. — verify: `pnpm vitest run src/modules/advising/application/groups.test.ts && E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "admin counselor parity"`
- [ ] AC-13: When `registerSchema` receives `role:"admin"`, parsing fails. — verify: `pnpm vitest run src/modules/advising/presentation/schemas.test.ts`
- [ ] AC-14: When capabilities are checked, admin holds all four counselor capabilities plus `rag:manage` and `user:manage`, and counselor/student hold neither admin capability. — verify: `pnpm vitest run src/modules/advising/domain/capabilities.test.ts`
- [ ] AC-15: When `toRole` receives `"admin"` it returns `"admin"`; an unknown string returns `"student"`. — verify: `pnpm vitest run src/modules/advising/domain/models.test.ts`
- [ ] AC-16: When `ensureAdmin` runs with `NODE_ENV=production`, it throws before any read/write. — verify: `pnpm vitest run scripts/create-admin.test.ts`
- [ ] AC-17: When the username is absent, `ensureAdmin` creates the user with role `admin` and returns a generated password exactly once. — verify: `pnpm vitest run scripts/create-admin.test.ts`
- [ ] AC-18: When `ensureAdmin` runs twice for the same username, the second run creates nothing and leaves the existing password hash untouched. — verify: `pnpm vitest run scripts/create-admin.test.ts`
- [ ] AC-19: When any non-test file under `src/` is searched for `role: "admin"` assignment, none exists (admin can only come from the script). — verify: `! grep -rEq 'role:[[:space:]]*"admin"' src --include=*.ts --include=*.tsx --exclude=*.test.ts`
- [ ] AC-20: When the bootstrap script is inspected, it exists and contains no credential literal. — verify: `[ -f scripts/create-admin.ts ] && ! grep -Eqi "password[A-Za-z]*[[:space:]]*[:=][[:space:]]*[\"'][^\"']" scripts/create-admin.ts`
- [ ] AC-21: When the schema is inspected, no migration file was added and `role` stays `String`. — verify: `! git status --porcelain prisma/migrations | grep -q . && grep -q 'role *String' prisma/schema.prisma`
- [ ] AC-22: When any route file is measured, every `src/app/api/**/route.ts` is ≤40 lines. — verify: `pnpm vitest run test/architecture.test.ts`
- [ ] AC-23: When a route loses its guard or a new route is added unguarded, the static coverage test fails (exact lists: 9 session + 6 admin). — verify: `pnpm vitest run test/architecture.test.ts`
- [ ] AC-24: When `tests/e2e/knowledge-flow.spec.ts` is read, it registers/logs in before the first `/admin/knowledge` navigation. — verify: `grep -B3 'page.goto("/admin/knowledge")' tests/e2e/knowledge-flow.spec.ts | grep -q 'login\|register'`
- [~] AC-25: When a live OpenRouter key is available, the updated knowledge-flow e2e (register→login→upload→chat→delete) passes. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/knowledge-flow.spec.ts` — reason: needs `OPENROUTER_API_KEY`, unavailable here; spec-level change covered by AC-24 and the guard matrix.
- [ ] AC-26: When the full gate runs, typecheck, lint, build and unit tests are green with at least 133 passing tests. — verify: `pnpm typecheck && pnpm lint && pnpm build && n=$(pnpm test 2>&1 | sed -n 's/.*Tests  *\([0-9][0-9]*\) passed.*/\1/p'); [ "${n:-0}" -ge 133 ]`
- [ ] AC-27: When docs are read, README documents bootstrap and the access matrix, and the contract, behavior doc and OpenAPI security scheme (incl. `/api/openapi` 401/403) exist. — verify: manual: read `README.md` + `docs/contracts/access-control-baseline.md` + `docs/behaviors/access-control-baseline.md` front matter + `src/lib/openapi.ts`

## Risks → catching test

| Risk | Test |
|---|---|
| `toRole` drops `admin` → admin treated as student | AC-11, AC-15 |
| Counselor/student reaches admin surface via default allow | AC-8, AC-9, AC-10 |
| A route missed / new route unguarded, or >40 lines | AC-22, AC-23 |
| Guard outside `try` → 500 not 401/403 | AC-3, AC-5 |
| Registration/form mints admin | AC-13 (+ AC-19 static) |
| Second admin path appears outside the script | AC-19 |
| Bootstrap runs in production, leaks a password, or resets a hash on re-run | AC-16, AC-17, AC-18, AC-20 |
| OpenAPI spec advertises admin routes without 401/403 | AC-27 |
| knowledge-flow e2e breaks on the new gate | AC-24 (AC-25 deferred) |
| Admin sees half-applicable UI on `/profile` | documented limitation; no credential issue |
| Session expiry mid-use (`api.ts` throws on 401) | documented; not solved here |

## Open Questions

1. **`/` home page** — default: stays public (login/register entry + links). Strict
   reading would gate it too; one-line guard, but the landing becomes unreachable
   before login.
2. **`user:manage`** — declared per decision 1/2 but no consumer this phase;
   default: keep it in the table and ship it unused.
3. **Production admin bootstrap** — default: out of scope; the script refuses
   production, so a real deployment needs a DBA-run equivalent later.
4. **Page rejection style** — default: pages redirect (`/login`, `/profile`), APIs
   always 401/403; no 403 HTML page this phase.
