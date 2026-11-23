# Review: access-control-baseline
Round: 1 of 3 | Diff scope: working tree vs HEAD incl. untracked files

## Verdict
PASS WITH GAPS — The access-control baseline is correctly implemented by construction: every gated route calls its guard as the first statement in the route `try`, the error mapper emits `{error:{code,message,requestId}}` with no stack trace, `toRole`/default-deny and the capability map are unit-tested, the static coverage test enforces the exact 9-session + 6-admin route lists, `create-admin` is idempotent with no credential literal and a production guard, and `role` stays `String` with no migration. The only gaps are empirical: three `test.fixme` e2e cases leave counselor/student 403 and admin 200 without live HTTP evidence, and the static coverage test enumerates fixed lists rather than all `app/api/**/route.ts` files, so a brand-new unguarded route would not be caught by it. No CRITICAL or HIGH failures.

## Findings
| Severity | file:line | Finding | Smallest fix |
| -------- | --------- | ------- | ------------ |
| MEDIUM | tests/e2e/access-control.spec.ts:29-39 | Three `test.fixme` cases (counselor → 403 on /api/admin/stats, admin → 200 on /api/admin/stats, student → /profile on /api-docs) make AC-8/AC-9/AC-11 reliant on unit + static evidence only; no live counselor/student/admin-session HTTP proof. | Seed counselor/student/admin users, enable `E2E_ENABLED`, replace the `test.fixme` blocks with live status/body assertions. This needs running services, not `OPENROUTER_API_KEY`. |
| LOW | test/architecture.test.ts:165-206 | Static coverage test asserts the fixed 9 session-gated + 6 admin-gated lists are guarded (`toHaveLength(9)`/`toHaveLength(6)`), but does not walk all `app/api/**/route.ts`, so a brand-new unguarded route added outside the lists would not fail this test (AC-23 partially overstated). | Add a test that walks every `app/api/**/route.ts` and asserts it imports `advising-guards` and calls `requireApiSession` or `requireApiCapability`. |

## Counts per severity
CRITICAL 0 · HIGH 0 · MEDIUM 1 · LOW 1

## Acceptance evidence
| AC | Verdict | Evidence note |
|----|---------|---------------|
| AC-1 anonymous GET → 401 (documents, documents/[id], conversations, conversations/[id], openapi, admin/chunks, admin/stats) | PASS | Code: every route calls `requireApiSession`/`requireApiCapability` first in try; static `test/architecture.test.ts` enforces 9+6; live e2e `tests/e2e/access-control.spec.ts:10-22` (anonymous GET /api/documents 401, anonymous GET /api/admin/stats 401). |
| AC-2 anonymous POST/PUT/DELETE write routes → 401 | PASS | Code inspection: all write routes (`documents`, `conversations`, `ingest`, `upload`, `search`, `chat`, `chat/stream`, `admin/cache/clear`, `admin/retrieval/debug`, `PUT conversations/[id]`, `DELETE documents/[id]`, `DELETE conversations/[id]`, `DELETE admin/chunks/[id]`) call guard as first statement in `try`; upload guard-before-write fix confirmed at `src/app/api/upload/route.ts:18` (before `formData` 19, `mkdir` 26, `writeFile` 28), file is 39 lines. |
| AC-3 401 body `{error:{code:"unauthorized",message,requestId}}` JSON, no stack | PASS | `src/modules/rag/presentation/http.ts:33-57` `toHttpError` returns exactly that shape; no `stack` field is serialized. |
| AC-4 anonymous /chat, /admin/knowledge, /api-docs → /login, no feature markup | PASS | Page guards: `src/app/chat/page.tsx:5` `requireSessionUser` → `/login`; `src/app/admin/knowledge/page.tsx:5` and `src/app/api-docs/page.tsx:5` `requireCapability("rag:manage")` → `/profile` for non-admin; no markup rendered before guard. |
| AC-5 unknown/expired cookie token → 401, never 500/200 | PASS | `getSessionContext` returns `null` when `resolveSession` yields no user → `requireApiSession` throws `UnauthorizedError` (401); 500 only for unexpected infra errors, not for an unknown/expired token. |
| AC-6 student logged in → /chat renders, GET /api/documents 200 | PASS | `/chat` page requires any session (student satisfies it); `GET /api/documents` `requireApiSession` → 200 for any live session (student included). |
| AC-7 anonymous /api/health and /api/metrics still 200, shape unchanged | PASS | OpenAPI spec assigns `security: []` to `/api/health` and `/api/metrics` (`src/lib/openapi.ts:653-685`); no guard on those routes. |
| AC-8 counselor → 403 on six admin routes (5 admin/** + openapi), never 401/redirect | PASS-with-gap | All six routes use `requireApiCapability("rag:manage")`; `src/modules/advising/domain/capabilities.test.ts:19-21` confirms counselor lacks `rag:manage`; static architecture test confirms guards. No live counselor-session HTTP evidence (3 `test.fixme` in e2e). |
| AC-9 student GET /api/admin/stats, POST /api/admin/cache/clear, GET /api/openapi → 403; /api-docs → /profile | PASS-with-gap | Student lacks `rag:manage` → 403 on admin APIs; `/api-docs` page `requireCapability("rag:manage")` → `/profile`. No live student-session HTTP evidence (fixme'd). |
| AC-10 counselor → /profile on /admin/knowledge or /api-docs, no admin UI | PASS | Counselor lacks `rag:manage` → both pages redirect `/profile` via `requireCapability`; guard runs before rendering any markup. |
| AC-11 admin → /admin/knowledge and /api-docs render, GET /api/admin/stats 200 | PASS-with-gap | Admin holds `rag:manage` (`capabilities.ts:24-31`) → 200 on admin APIs; pages render. Admin 200 e2e fixme'd. |
| AC-12 admin acts as counselor: create group succeeds, /counselor/students renders | PASS | Admin capability set includes `group:manage` and `student:assign` (`capabilities.ts:24-31`); `src/modules/advising/application/groups.test.ts` covers group creation. |
| AC-13 `registerSchema` with `role:"admin"` fails parsing | PASS | `src/modules/advising/presentation/schemas.ts:71-78` `roleField` refines to `student\|counselor` + `z.enum(["student","counselor"])`; `schemas.test.ts:44` asserts `role:"admin"` fails. |
| AC-14 admin holds four counselor capabilities + `rag:manage` and `user:manage`; counselor/student hold neither admin capability | PASS | `src/modules/advising/domain/capabilities.ts:21-32` explicit table; `capabilities.test.ts:5-15` and `:19-25` assertions. |
| AC-15 `toRole("admin")==="admin"`; unknown → "student" | PASS | `src/modules/advising/domain/models.ts:12-16`; `models.test.ts:6-22`. |
| AC-16 `ensureAdmin` under NODE_ENV=production throws before any read/write | PASS | `scripts/create-admin.ts:31-33` throws before `findUser`; `create-admin.test.ts:34-42` asserts `findUser` not called. |
| AC-17 `ensureAdmin` creates admin role user and returns generated password once | PASS | `scripts/create-admin.ts:43-46`; `create-admin.test.ts:44-56` "creates a new admin and returns a generated password once". |
| AC-18 `ensureAdmin` twice: second run creates nothing, hash untouched | PASS | `scripts/create-admin.ts:36-41`; `create-admin.test.ts:58-71` idempotency test (`promoteCalls()` 0, `createCalls` unchanged, hash unchanged). Promote path separately covered by "promotes an existing non-admin user to admin" test (73-83). |
| AC-19 no non-test file under src/ assigns `role:"admin"` | PASS | Grep over `src/` found `role:"admin"` only in `schemas.test.ts` (test); `scripts/create-admin.ts` is outside `src/`; registration/schema never admits admin. |
| AC-20 `scripts/create-admin.ts` exists, no credential literal | PASS | File exists; uses `randomBytes(24)`; `create-admin.test.ts:86-93` asserts no inline `password = "..."` literal. |
| AC-21 no migration added; role stays String | PASS | `prisma/schema.prisma:74` `role String // "student" \| "counselor" \| "admin"`; no `prisma/migrations` change in diff. |
| AC-22 every `src/app/api/**/route.ts` ≤ 40 lines | PASS | `test/architecture.test.ts:110-122` "keeps route handlers thin" asserts all routes ≤ 40 lines (passed this round); `upload/route.ts` is 39 lines. |
| AC-23 static coverage test fails if a guard is missing or an unguarded route is added (9 session + 6 admin) | PASS-with-gap | `test/architecture.test.ts:165-206` enforces exact lists (`toHaveLength(9)`/`toHaveLength(6)`), passes this round, but only checks the fixed lists (see LOW finding). |
| AC-24 `knowledge-flow.spec.ts` registers/logs in before first `/admin/knowledge` navigation | PASS | `tests/e2e/knowledge-flow.spec.ts:18-29` register + login, then line 32 `goto("/admin/knowledge")`. |
| AC-25 live knowledge-flow e2e needs OPENROUTER_API_KEY | DEFERRED | Per plan/deferral; requires live services + `OPENROUTER_API_KEY`; skipped unless `E2E_ENABLED=true`. |
| AC-26 typecheck, lint, build, unit tests green, ≥133 tests | PASS | Implementer `pnpm test`: exit 0, 150 passed (28 files) ≥ 133; `pnpm vitest run test/architecture.test.ts` green this round (7/7). typecheck/lint/build not re-run per instructions (rely on implementer's reported green gate). |
| AC-27 README documents bootstrap + access matrix; contract, behavior doc, OpenAPI cookie scheme (incl. /api/openapi 401/403) exist | PASS | README:55-81 access matrix + bootstrap `pnpm tsx scripts/create-admin.ts <username>` at line 74; `docs/contracts/access-control-baseline.md` and `docs/behaviors/access-control-baseline.md` exist (`node .opencode/scripts/mro-doctor.mjs --docs` exit 0); `openapi.ts:128` global `cookieAuth`, `:623` `/api/openapi` security, `:629-637` 401/403 responses, `:689` `cookieAuth` = `apiKey in cookie name mrdan_session`. |

## Security boundary sanity
- Gate before side effects everywhere: `requireApiSession`/`requireApiCapability` is the first statement inside each route `try` on all 15 gated routes (upload fix confirmed: guard at line 18 precedes `formData` 19, `mkdir` 26, `writeFile` 28). No write executes before the session/capability check.
- A student/counselor cannot reach an admin surface: all six admin routes + `/api/openapi` require `rag:manage`, which counselor/student lack → 403 (API) or `/profile` (pages). Admin pages (`/admin/knowledge`, `/api-docs`) also require `rag:manage`.
- An anonymous caller cannot write anything: every mutating route guards first; public surface is only `GET /api/health` and `GET /api/metrics` (OpenAPI `security: []`).
- A 401 does not leak internals: `toHttpError` emits `{error:{code,message,requestId}}` with no stack trace; production 500s are replaced with "Internal server error".

## Deferrals
- AC-25: live knowledge-flow e2e needs `OPENROUTER_API_KEY` plus running dev server/Postgres/Chroma; skipped unless `E2E_ENABLED=true`. Reason: external key and services not available in this review session.
- The MEDIUM finding above (live counselor/student/admin HTTP evidence for AC-8/AC-9/AC-11) is deferred to a run with seeded sessions and `E2E_ENABLED=true`; it is not a code defect — the behavior is proven by `capabilities.test.ts` + the static architecture test. Re-verify in round 2 if services become available.

Skills loaded: `mro-code-review-checklist` (applied for the mandatory checklist framing). No `mro-*` project skill conflicts with AGENTS.md were found; the reviewed files follow the project's guard/error/role conventions.
