# Plan — rag-login-gate

> Superseded by .opencode/plans/access-control-baseline.md (2026-11-23).

## Goal

Make every RAG surface reachable only with a live `mrdan_session`, using the
existing advising session guard. No retrieval, prompt, cache, schema, or UI
redesign.

## Non-goals

- No RAG role/capability model, no per-user RAG ownership (any logged-in user can
  still read all documents/conversations — documented limitation).
- No deletion of RAG code, no middleware/proxy (Next 16 proxy cannot hit the DB).
- No new env var, no new dependency, no rate limiting.

## Public/private matrix (decided)

| Path | Session | Why |
|---|---|---|
| `GET /api/health` | **no** | Ops/uptime probe; README documents `curl /api/health`; reads dependency status only. |
| `GET /api/metrics` | **no** | Prometheus scrape endpoint; counters only, no user data or chunk text. |
| `GET /api/openapi` | **yes** | Spec lists only RAG/admin paths; it is the discovery map for the surface we are closing. |
| `/api-docs` | **yes** | Swagger UI over the above spec; leaving it open advertises the closed surface. |
| `documents` (GET,POST), `documents/[id]` (GET,DELETE), `ingest` (POST), `upload` (POST), `conversations` (GET,POST), `conversations/[id]` (GET,PUT,DELETE), `search` (POST), `chat` (POST), `chat/stream` (POST), `admin/chunks` (GET), `admin/chunks/[id]` (DELETE), `admin/stats` (GET), `admin/cache/clear` (POST), `admin/retrieval/debug` (POST) | **yes** | Executes RAG use cases / mutates data / costs upstream tokens. |
| `/chat`, `/admin/knowledge` | **yes** → `/login` | RAG UI. Guard in the page entry, not by hiding links. |
| `/` links to the above | n/a | Unchanged: clicking anonymously lands on `/login`. Hiding a link is not a gate. |

## Ordered steps

1. **`src/server/advising-guards.ts`** — add `requireApiSession()` below
   `requireSessionUser`: `getSessionContext()`, and if null
   `throw new UnauthorizedError()` (import from
   `@/modules/advising/domain/errors`; it already carries
   `code:"unauthorized"`, `status:401`, so `toHttpError` maps it unchanged).
   Do not add a `rag-guards.ts`: session resolution already lives here.
2. **15 route files** get `import { requireApiSession } from "@/server/advising-guards";`
   plus `await requireApiSession();` as the **first statement inside `try`**
   (outside `try` the throw escapes as 500), one call per exported method:
   `documents`, `documents/[id]`, `ingest`, `upload`, `conversations`,
   `conversations/[id]`, `search`, `chat`, `chat/stream`, `admin/chunks`,
   `admin/chunks/[id]`, `admin/stats`, `admin/cache/clear`,
   `admin/retrieval/debug`, `openapi`.
3. **Line budget (40, hard):** normal insertion is +2 lines. `upload` (39→41) and
   `conversations/[id]` (37+1 import+3 calls=41) overflow, so there the guard goes
   on the existing `try {` line (`try { await requireApiSession();`, +0 lines),
   landing both at 40/38. If a file still exceeds 40, extract that handler's body;
   never raise the limit.
4. **Pages:** `src/app/chat/page.tsx` and `src/app/admin/knowledge/page.tsx` become
   `async` server components calling `await requireSessionUser();` before
   rendering the existing client component (reuse, no new guard).
5. **`src/app/api-docs/page.tsx`** is currently `"use client"`; move its body
   verbatim to new `src/components/api-docs/api-docs-panel.tsx` (`"use client"`)
   and make the page an async RSC that calls `await requireSessionUser()` and
   renders `<ApiDocsPanel />`. Same-origin fetch keeps sending the cookie, so the
   logged-in page still loads `/api/openapi`.
6. **`src/lib/openapi.ts`** (same-change rule): add `components.securitySchemes`
   (`cookieAuth`, apiKey in cookie `mrdan_session`) and top-level
   `security: [{ cookieAuth: [] }]`; add `security: []` to the `/api/health` and
   `/api/metrics` path objects; add `"401"` to protected operations.
7. **Tests** — see below. New `tests/e2e/rag-gate.spec.ts`; update
   `tests/e2e/knowledge-flow.spec.ts` so it registers/logs in **before** the first
   `/admin/knowledge` navigation; extend `test/architecture.test.ts` with a static
   "every protected route calls `requireApiSession`" assertion that asserts a
   positive match count (e.g. `expect(gated).toHaveLength(15)`) so an empty match
   set fails instead of passing vacuously.
8. **Docs** — README, contract, behavior doc, architecture note, CHANGELOG draft
   (see Documentation impact). Run the full gate.

## API contract

- Rejection: HTTP 401, `application/json`, body
  `{"error":{"code":"unauthorized","message":"Unauthorized","requestId":"<uuid>"}}`
  — produced by existing `toHttpError`, not a new mapper.
- `chat/stream` rejects **before** the stream starts, so the response is JSON 401,
  not an SSE `error` event.
- Pages: 307/302 to `/login` (Next `redirect`), no RAG markup rendered.
- No success-shape change for authenticated callers.

Contract file: **`docs/contracts/rag-login-gate.md`** — signatures
(`requireApiSession`, `requireSessionUser`), the invariant and one `verify:` per
item (see the summary below), `review_level: full`.

## Test cases to write

1. `tests/e2e/rag-gate.spec.ts` (new, `test.skip(!E2E_ENABLED)` like its siblings):
   anonymous GET/POST/PUT/DELETE matrix → 401 + `unauthorized` + `requestId`;
   `/chat`, `/admin/knowledge`, `/api-docs` → `/login`; expired cookie
   (`context.addCookies` token `"expired"`) → 401; register+login → pages render,
   `GET /api/documents` 200; `/api/health` + `/api/metrics` anonymous 200.
2. `tests/e2e/knowledge-flow.spec.ts`: register/login before `/admin/knowledge`.
3. `test/architecture.test.ts`: assert each of the 15 protected route paths
   contains `requireApiSession`, with `expect(gated).toHaveLength(15)` so an empty
   match set fails (fails on a missed or newly added route).

## Documentation impact

- `README.md`: pages list — mark `/chat`, `/admin/knowledge`, `/api-docs` as
  «نیازمند ورود»; new short «دسترسی به RAG» section (RAG endpoints need the
  `mrdan_session` cookie, 401 shape, `health`/`metrics` public, any logged-in user
  sees all RAG data — no per-user ownership); API table gains an `دسترسی` column
  (`عمومی` / `ورود`). No new env var or config key — extend the existing
  "no new env vars" sentence.
- `docs/behaviors/rag-login-gate.md` (new): `last_verified: 2026-11-23`,
  `source_files:` the 15 route files, `src/server/advising-guards.ts`,
  `src/app/chat/page.tsx`, `src/app/admin/knowledge/page.tsx`,
  `src/app/api-docs/page.tsx`, `src/components/api-docs/api-docs-panel.tsx`.
- `docs/plan/architecture.md` §2: advising guards now expose `requireApiSession`
  and are the entry guard for `app/api` RAG routes and the two RAG pages.
- `docs/contracts/rag-login-gate.md` (new).
- CHANGELOG after approval only, one line: `RAG routes and /chat,
  /admin/knowledge, /api-docs now require a session (401 / redirect); health and
  metrics stay public; retrieval unchanged.`

## Contract — summary (full text in `docs/contracts/rag-login-gate.md`)

- `requireApiSession(): Promise<SessionContext>` — throws
  `UnauthorizedError(401,"unauthorized")` when `getSessionContext()` is null.
- `requireSessionUser(): Promise<SessionContext>` — redirects `/login`.
- Invariant (single sentence, enforced by the static test + e2e): *no request to a
  RAG route or page may execute a use case or render RAG UI unless the
  `mrdan_session` cookie resolves to a live session row.*
- Edge cases with verify commands: missing cookie → 401 (`… -g "anonymous"`);
  expired token → 401 not 500 (`… -g "expired"`); stream pre-start JSON 401
  (`… -g "stream"`); health/metrics 200 anonymous (`… -g "public routes"`);
  logged-in student allowed (`… -g "logged-in"`).
- `review_level: full` — this is an authorization boundary on 15+ entry points;
  one missed route is a live public hole. Size is small (<80 changed lines), so
  the human may downgrade to `reviewed`; the compensating controls are the static
  guard-coverage test and the e2e matrix.

## Acceptance Criteria

- [ ] AC-1: When an anonymous client sends GET to `documents`, `documents/[id]`, `conversations`, `conversations/[id]`, `admin/chunks`, `admin/stats`, `openapi`, each returns 401. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "anonymous GET"`
- [ ] AC-2: When an anonymous client sends POST to `ingest`, `upload`, `search`, `chat`, `chat/stream`, `admin/cache/clear`, `admin/retrieval/debug` and DELETE to `documents/[id]`, `conversations/[id]`, `admin/chunks/[id]`, each returns 401. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "anonymous mutations"`
- [ ] AC-3: When the 401 body is inspected, it is exactly `{error:{code:"unauthorized",message,requestId}}` with content-type JSON and no stack trace. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "401 shape"`
- [ ] AC-4: When an anonymous client opens `/chat` or `/admin/knowledge` or `/api-docs`, the browser lands on `/login` and no RAG markup is rendered. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "pages redirect"`
- [ ] AC-5: When a cookie holds an unknown/expired token, a RAG route returns 401 (not 500/200). — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "expired"`
- [ ] AC-6: When a registered user is logged in, `/chat` and `/admin/knowledge` render and `GET /api/documents` returns 200. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "logged-in"`
- [ ] AC-7: When anonymous, `GET /api/health` and `GET /api/metrics` still return 200 with their current content type/shape. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/rag-gate.spec.ts -g "public routes"`
- [ ] AC-8: When any route file is measured, every `src/app/api/**/route.ts` is ≤40 lines. — verify: `pnpm vitest run test/architecture.test.ts`
- [ ] AC-9: When a protected route is missing the guard (or a new unguarded route is added), the static coverage test fails; the assertion must assert a positive count (`expect(gated).toHaveLength(15)`) so an empty match set cannot pass. — verify: `pnpm vitest run test/architecture.test.ts`
- [~] AC-10: When a live OpenRouter key is available, the updated knowledge-flow e2e (register→login→upload→chat→delete) passes. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/knowledge-flow.spec.ts` — reason: requires `OPENROUTER_API_KEY`, which this environment does not provide; the spec-level change is covered by AC-11 and the guard matrix in AC-1/AC-2.
- [ ] AC-11: When `tests/e2e/knowledge-flow.spec.ts` is read, it registers/logs in before the first `/admin/knowledge` navigation. — verify: `grep -B3 'page.goto("/admin/knowledge")' tests/e2e/knowledge-flow.spec.ts | grep -q 'login\|register'`
- [ ] AC-12: When the full gate runs, typecheck, lint, build and the unit suite are green and the suite has at least 133 passing tests. — verify: `pnpm typecheck && pnpm lint && pnpm build && n=$(pnpm test 2>&1 | sed -n 's/.*Tests  *\([0-9][0-9]*\) passed.*/\1/p'); [ "${n:-0}" -ge 133 ]`
- [ ] AC-13: When the docs are read, README marks the RAG surfaces as login-required, the contract and `docs/behaviors/rag-login-gate.md` exist, and the OpenAPI spec declares the cookie scheme plus 401. — verify: manual: read `README.md` API table + `docs/contracts/rag-login-gate.md` + `docs/behaviors/rag-login-gate.md` front matter + `src/lib/openapi.ts` security scheme

## Risks → catching test

| Risk | Test |
|---|---|
| A route is missed and stays public | AC-9 static coverage; AC-1/2 e2e |
| Guard outside `try` → 500 instead of 401 | AC-3/AC-5 |
| Line budget broken by +2 lines | AC-8 |
| `/api-docs` split leaves the page public | AC-4 |
| knowledge-flow e2e now bounces to `/login` | AC-11 (spec updated in step 7; AC-10 deferred until a live key exists) |
| Session expiry mid-use: `src/lib/api.ts` throws on 401, UI shows silent errors | not solved by design; documented limitation |
| Per-request session lookup adds one Postgres roundtrip | accepted, no cache |

## Open Questions (with recommended default)

1. **Student access to `/admin/knowledge`** — no RAG role exists. Default: any
   logged-in user (AC-6 expects a student). Alternative: `requireCapability("group:manage")`
   to make it counselor-only; needs human approval.
2. **`/api/openapi` + `/api-docs` visibility** — default: gate both (rationale
   above). If an external tool consumes the spec unauthenticated, keep the spec
   public and gate only the UI page; this changes step 6 and AC-1/AC-4.
3. **`/api/metrics` public** — default: public for Prometheus. If the app is
   internet-facing, a scrape token belongs to a later phase (out of scope).
4. **Home page still links to RAG pages for anonymous** — default: leave it;
   links redirect to `/login`, and hiding is UX only.
