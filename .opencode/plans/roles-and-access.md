# Plan — roles-and-access (close gaps, publish one guard contract)

Supersedes nothing; builds on `access-control-baseline.md` (done). Separate from the
admin-panel plan and RAG consolidation. **No schema change, no migration, no new
dependency, no new abstraction.**

## Goal

1. Close the remaining three-role gaps found by audit (below), by deletion not addition.
2. Publish one copy-pasteable Contract (`Role`/`Actor`/guards/action-rejection) the
   admin-panel plan imports as-is.
3. Make surface separation (student/counselor shell vs admin/operational) a static
   test invariant, not tribal knowledge.

## Verified current state (audited, not assumed)

- `Role = "student"|"counselor"|"admin"` — `src/modules/advising/domain/models.ts:20`;
  `toRole` default-lowest at `:23` (only caller: `prisma-user-repository.ts:122`).
- `CAPABILITIES` explicit admin row (counselor set + `rag:manage`,`user:manage`) —
  `src/modules/advising/domain/capabilities.ts:31-79`; `hasCapability` default deny `:82`.
- Guards — `src/server/advising-guards.ts`: `requireSessionUser`(→`/login`) `:41`,
  `requireCapability`(→`/profile`) `:48`, `requireApiSession`(401) `:57`,
  `requireApiCapability`(403) `:64`.
- Routes: 9 session-gated + 6 admin-gated, exact-list tested
  (`test/architecture.test.ts:178-219`); `health`/`metrics` public.
- Pages (15, all checked): `(auth)` login/register redirect-if-session
  (`(auth)/login/page.tsx:9`); `/chat` `requireSessionUser`; `(advising)/layout.tsx:23`
  session + nav filtered by roles ∧ capability `:84-89`; 5 area pages
  `requireCapability("<area>:read")`; `/profile` `requireSessionUser`;
  `dashboard/page.tsx:10` `role === "counselor" → /counselor/students` (admin sees the
  self/empty dashboard — documented in frontend-db-audit); `counselor/students/page.tsx:9`
  and `[studentId]/page.tsx:12` `requireCapability("group:manage")`, detail maps
  `ForbiddenError→/profile`, `NotFoundError→404` `:20-24`; `admin/knowledge` + `api-docs`
  `requireCapability("rag:manage")`; `/` public.
- Actions (all 10 `*.actions.ts` files): `getSessionContext()` +
  `if (!session) redirect("/login")` inline, then `runAction` → use case enforces
  capability+ownership (`schedule.ts:62`, `homework.ts:60`, `nutrition.ts:92`,
  `groups.ts:27`, `planning-access.ts:24,55`, `leisure.ts:49`). `toActionError` maps
  `forbidden` → «دسترسی به این عملیات مجاز نیست» (`presentation/messages.ts:14`).
- `Actor = { id, role }` — `application/planning-access.ts:15`; duplicated locally at
  `groups.ts:24`.
- Registration cannot mint admin — `presentation/schemas.ts:71-78,208`.
- Stale docs: `README.md:69` still says «دو نقش» (access table `:117` has admin);
  `docs/behaviors/access-control-baseline.md` lists the deleted `/study` page.

## Gaps

| # | Surface | Current | Target |
|---|---|---|---|
| G1 | `planning-access.ts:63-65` | redundant `actor.role !== "counselor" && !== "admin"` — duplicates the capability map (`plan:write` ⟺ counselor‖admin) | delete 3 lines; rule published in contract |
| G2 | 10 `*.actions.ts` (~30 sites) | inline 2-line session check | use existing `requireSessionUser()`; static test bans `getSessionContext` in actions files |
| G3 | `groups.ts:24` | local `Actor` duplicate | import from `planning-access.ts` |
| G4 | Page gates | implicit, no static coverage | exact page→gate matrix in `test/architecture.test.ts` |
| G5 | admin × counselor-of-record | admin passes `group:manage` but `assertCounselorOfStudent` still requires `counselorId === actor.id` → foreign student detail redirects `/profile` (implicit) | same behavior — publish rule + unit test + manual smoke |
| G6 | `README.md:69` | «دو نقش» stale | «سه نقش» + canonical-rule sentence |
| G7 | `docs/behaviors/access-control-baseline.md` | cites deleted `/study` page | prune stale rows + `source_files` |

Schema: `role String` + `toRole` (default-lowest) + zod at both write sites
(register, create-admin script) is sufficient. **No PG enum, no migration.**

## Files

Create:
- `src/modules/advising/application/planning-access.test.ts` — authorization unit tests.
- `docs/behaviors/roles-and-access.md` — behavior doc (front matter + matrix + rules).

Modify (all deletions or swaps; net line count goes down):
- `src/modules/advising/application/planning-access.ts` — delete `:63-65`.
- `src/modules/advising/application/groups.ts` — drop local `Actor`, import it.
- All 10 `(advising)` actions files (`advising`, `budget`, `dashboard`, `homework`,
  `nutrition`, `schedule`×2, `students`, `study-plan`, `study-profile` `.actions.ts`)
  — `getSessionContext` + `if (!session) redirect` →
  `const { user } = await requireSessionUser();` (identical semantics: redirect
  happens before `runAction`, so `NEXT_REDIRECT` is never swallowed).
- `test/architecture.test.ts` — **shared seam**: new page-gate matrix test + actions-import ban.
- `src/modules/advising/domain/capabilities.test.ts` — one assertion: only counselor+admin hold `plan:write`.
- `tests/e2e/access-control.spec.ts` — student direct-nav cases for counselor pages.
- `README.md`, `docs/behaviors/access-control-baseline.md`.

Delete: none.

## Contract: roles-and-access

The admin-panel plan imports exactly these; nothing else is public surface.

```ts
// src/modules/advising/domain/models.ts
export type Role = "student" | "counselor" | "admin";
export function toRole(value: string): Role;
// "admin"→admin, "counselor"→counselor, anything else→"student" (default-lowest, never escalates)
export interface UserAccount { id: string; username: string; role: Role; /* …rest */ }

// src/modules/advising/domain/capabilities.ts
export type Capability =
  | "profile:read" | "profile:write"
  | "group:manage" | "student:assign" | "plan:write"
  | "schedule:read" | "schedule:write" | "homework:read" | "homework:write"
  | "budget:read" | "budget:write" | "nutrition:read" | "nutrition:write"
  | "leisure:read" | "rag:manage" | "user:manage";
export const CAPABILITIES: Record<Role, readonly Capability[]>; // explicit rows, no inheritance
export function hasCapability(role: Role | undefined, capability: Capability): boolean; // default deny

// src/modules/advising/application/planning-access.ts  (single source of Actor)
export type Actor = { id: string; role: Role };

// src/server/advising-guards.ts
export interface SessionContext { user: UserAccount; token: string }
export function getSessionContext(): Promise<SessionContext | null>;
export function requireSessionUser(): Promise<SessionContext>;                    // pages + actions → redirect /login
export function requireCapability(c: Capability): Promise<SessionContext>;        // pages → redirect /profile
export function requireApiSession(): Promise<SessionContext>;                     // routes → throw UnauthorizedError (401)
export function requireApiCapability(c: Capability): Promise<SessionContext>;     // routes → 401 / ForbiddenError (403)
```

Canonical rules:
1. **Capabilities gate the verb; ownership gates the row.** Admin carries the full
   counselor capability set (explicit rows in `CAPABILITIES`) but NOT
   counselor-of-record relationships: `assertCounselorOfStudent` /
   `assertPlanRead` still require `student.counselorId === actor.id` for admin.
   Admin's extra reach lives in `rag:manage` + `user:manage` only.
2. **Rejection style.** Pages: no session → `/login`, wrong role → `/profile`.
   APIs: no session → `401 {error:{code:"unauthorized",…}}`, wrong role → `403
   {error:{code:"forbidden",…}}` (never a redirect). Server Actions: no session →
   `redirect("/login")` via `requireSessionUser()` before `runAction`; wrong role →
   use case throws `ForbiddenError` → `runAction` returns
   `{ ok:false, error:{ code:"forbidden", message:"دسترسی به این عملیات مجاز نیست" } }`.
3. **Surface separation.** Admin tools (`/admin/knowledge`, `/api-docs`, `/api/admin/**`,
   `/api/openapi`) live outside `(advising)` and are never in its nav; the page-gate
   matrix test makes an unguarded or mis-gated page fail CI.
4. Sanctioned exception: `dashboard/page.tsx:10` redirects `counselor` (not admin) to
   the roster — a UX split with no capability expression; the only permitted
   `role ===` check in `src/app/**`.

Invariants (each test-locked): every `src/app/**/page.tsx` is in the exact gate
matrix; every `(advising)` action resolves its session only via `requireSessionUser`;
no `src/**` file assigns `role:"admin"` (baseline AC-19); registration accepts only
student|counselor (baseline AC-13).

Edge cases: unknown/expired cookie → 401 API, `/login` page (baseline AC-4/5);
unknown role string in DB → degrades to `student`, never `counselor`/`admin`
(`models.test.ts`); admin visits foreign student detail → `/profile`, not 500;
`hasCapability(undefined, …)` → false.

review_level: reviewed — no auth semantics change (one redundant deny-line deleted,
behavior identical); human confirms.

## Ordered steps

1. Delete `planning-access.ts:63-65`; swap `groups.ts` to the shared `Actor`.
2. Swap the 10 actions files to `requireSessionUser` (mechanical).
3. `test/architecture.test.ts`: page-gate matrix (exact lists, union must cover every
   `page.tsx` walked) + assert no `*.actions.ts` imports `getSessionContext`.
4. `planning-access.test.ts` + `capabilities.test.ts` additions; e2e student-nav cases.
5. Docs (below) + full gate.

## Tests

- `planning-access.test.ts` (new, fake `UserRepositoryPort` from `test/fakes/`):
  counselor-of-record passes; admin not-counselor-of-record (incl. unknown studentId)
  → `ForbiddenError`; student role → `ForbiddenError`; `assertPlanWrite` wrong owner
  → `ForbiddenError`; `assertPlanRead` non-owner non-counselor → `ForbiddenError`.
- `capabilities.test.ts`: `plan:write` ∈ counselor,admin only.
- `test/architecture.test.ts`: matrix test (empty/misplaced entry fails; new page
  missing from the matrix fails).
- `tests/e2e/access-control.spec.ts` (reuse existing helpers): student direct-nav to
  the two counselor pages lands `/profile`.

## Manual Smoke Test Scenario

[manual] As admin (`pnpm tsx scripts/create-admin.ts <u>`), open
`/counselor/students`, pick a student whose counselor is someone else (or assign a
student to a counselor first, then log in as admin), open its detail page → the
browser lands on `/profile` with no error screen; the same page as that student's own
counselor renders the plan. — verify: manual: perform both navigations on `pnpm dev` and compare landing.

## Documentation impact

- `README.md:69` → three roles; §«دسترسی و نقش‌ها» gains the canonical-rule sentence
  (capabilities gate the verb, ownership gates the row; admin ≠ counselor-of-record)
  and links `docs/behaviors/roles-and-access.md`. No new env/config key.
- `docs/behaviors/roles-and-access.md` (new): `last_verified`, `source_files` =
  `src/server/advising-guards.ts`, `src/modules/advising/domain/{models,capabilities}.ts`,
  `src/modules/advising/application/planning-access.ts`,
  `src/app/(advising)/layout.tsx`, `dashboard/page.tsx`,
  `counselor/students/{page,[studentId]/page}.tsx`, `test/architecture.test.ts`.
- `docs/behaviors/access-control-baseline.md`: prune deleted `/study` rows + `source_files`.
- No `docs/contracts/` file (review_level `reviewed` — this Contract section is the review unit).
- CHANGELOG (after approval only): `Published the roles-and-access contract: single
  Actor type, one action-session helper, page-gate matrix test; removed a redundant
  role check; documented that admin carries counselor capabilities but not counselor-of-record rows.`

## Acceptance Criteria

- [x] AC-1: When `test/architecture.test.ts` runs, every `src/app/**/page.tsx` is classified by the exact page-gate matrix (public / auth-redirect / session / capability:<x>) and a new unguarded page fails. — verify: `pnpm vitest run test/architecture.test.ts` — evidence: exit 0, 12 tests passed (matrix union + per-page guard markers).
- [x] AC-2: When any `*.actions.ts` under `src/app` is inspected, none imports `getSessionContext` (all use `requireSessionUser`). — verify: `! grep -rl "getSessionContext" src/app --include=*.actions.ts` — evidence: exit 0 (no matches).
- [x] AC-3: When `assertCounselorOfStudent` is called by an admin who is not the student's counselor-of-record, it throws `ForbiddenError`; the student's own counselor passes; a student role throws. — verify: `pnpm vitest run src/modules/advising/application/planning-access.test.ts` — evidence: exit 0, 11 tests passed (incl. operator role rejection).
- [x] AC-4: When capabilities are inspected, `plan:write` is held only by `counselor` and `admin`. — verify: `pnpm vitest run src/modules/advising/domain/capabilities.test.ts` — evidence: exit 0 (plan:write holders assertion passes).
- [x] AC-5: When a logged-in student navigates directly to `/counselor/students` or `/counselor/students/<id>`, the browser lands on `/profile`. — verify: `E2E_ENABLED=true pnpm exec playwright test tests/e2e/access-control.spec.ts -g "student counselor pages"` — evidence: exit 0, 1 passed against `pnpm dev` on Postgres.
- [x] AC-6: When `groups.ts` is inspected, no local `Actor` type exists (single import from planning-access). — verify: `! grep -q "type Actor" src/modules/advising/application/groups.ts` — evidence: exit 0.
- [x] AC-7: When an admin opens a foreign student's plan page, they land on `/profile`, and the student's own counselor sees the plan. — verify: manual: Manual Smoke Test Scenario on `pnpm dev` — evidence: `human smoke 2026-11-26: admin opening a foreign student's plan lands on /profile; the student's own counselor sees the plan.`
- [x] AC-8: When docs are read, README states four roles + the canonical rule and `docs/behaviors/roles-and-access.md` exists with front matter; the stale `/study` references are gone. — verify: `test -f docs/behaviors/roles-and-access.md && ! grep -q "دو نقش" README.md && ! grep -q "advising/study" docs/behaviors/access-control-baseline.md` — evidence: exit 0 (four roles per delta).
- [x] AC-9: When the schema is inspected, `role` stays `String` and no migration was added. — verify: `! git status --porcelain prisma/migrations | grep -q . && grep -q 'role *String' prisma/schema.prisma` — evidence: exit 0.
- [x] AC-10: When the full gate runs, typecheck, lint, tests and build are green. — verify: `pnpm typecheck && pnpm lint && pnpm test && pnpm build` — evidence: all exit 0 (400 tests / 61 files passed).

## Open questions (for the human)

1. Admin oversight read: should admin eventually read ANY student's plan (one-line
   bypass in `assertCounselorOfStudent`)? Default here: no — admin panel plan can
   request it explicitly.
2. PG enum for `role`: default no (String + `toRole` + zod suffice); a migration would
   touch a shared seam for zero behavior gain.
3. `user:manage` stays declared but unused until the admin panel consumes it.

## Delta: operator role (human decision, 2026-11-26 — approved post-plan)

Fourth role `operator` as an **independent login role** (separate accounts, not an
admin mode). Scope = limited support only. Appends to every section above; where the
base plan says «سه نقش»/three roles, read **four**: student, counselor, admin, operator.

### Model changes (same files, additive)

- `src/modules/advising/domain/models.ts` — `Role` gains `"operator"`;
  `toRole` gains one line: `if (value === "operator") return "operator";` —
  unknown strings still degrade to `"student"` (default-lowest, never escalates).
- `src/modules/advising/domain/capabilities.ts` — `Capability` gains `"user:read"`,
  `"user:support"` (`"user:manage"` kept). New explicit row (plain data, no inheritance):
  `operator: ["profile:read", "profile:write", "user:read", "user:support"]`
  (`profile:*` = operator's own self-scoped account page, same as every login role).
  Admin row adds `user:read`, `user:support` to its existing set. Student/counselor
  rows unchanged. `user:manage` stays admin-only.
- Semantic split (published, consumed by the admin panel):
  - `user:read` — list/view users (read-only directory).
  - `user:support` — edit a user's profile/contact fields + reset their
    password/credentials.
  - `user:manage` — change a user's **role** (admin only). Operator MAY NOT: change
    roles, touch catalogs, touch RAG/admin-knowledge, or any destructive op.
- `prisma/schema.prisma` — untouched: `role String` still sufficient, **no migration**.
  `scripts/create-admin.ts` remains the only admin writer; an operator account is
  provisioned like admin (script path) — exact bootstrap mechanism is the admin
  panel's concern, flagged there, not here.
- Registration: `presentation/schemas.ts:71-78` already rejects anything but
  student|counselor — extend its test to prove `role:"operator"` is rejected too.
  Registration cannot mint operator or admin.

### Contract (amended block — replaces the base Contract's first two TS snippets)

```ts
// src/modules/advising/domain/models.ts
export type Role = "student" | "counselor" | "admin" | "operator";
export function toRole(value: string): Role;
// "admin"→admin, "operator"→operator, "counselor"→counselor, else→"student"

// src/modules/advising/domain/capabilities.ts
export type Capability =
  | "profile:read" | "profile:write"
  | "group:manage" | "student:assign" | "plan:write"
  | "schedule:read" | "schedule:write" | "homework:read" | "homework:write"
  | "budget:read" | "budget:write" | "nutrition:read" | "nutrition:write"
  | "leisure:read" | "rag:manage"
  | "user:read"    // list/view users
  | "user:support" // edit profile/contact fields, reset credentials
  | "user:manage"; // change a user's role — admin only
export const CAPABILITIES: Record<Role, readonly Capability[]>; // explicit rows; operator ⊂ admin
export function hasCapability(role: Role | undefined, capability: Capability): boolean;
```

Guard signatures are role-agnostic and unchanged (`requireSessionUser`,
`requireCapability`, `requireApiSession`, `requireApiCapability`, `SessionContext`,
`Actor`). Invariant 1 extends: admin carries operator capabilities too, but the
`user:read`/`user:support`/`user:manage` semantics above stay the published split.

### Coordination contract for the admin panel (consume verbatim)

- User-management pages gate: directory **view** with `requireCapability("user:read")`;
  support-edit/reset with `requireCapability("user:support")`; role change with
  `requireCapability("user:manage")` (operator UI simply never renders it —
  `hasCapability` denies at the use case regardless).
- Admin panel MUST extend the page-gate matrix in `test/architecture.test.ts` for its
  `/admin/**` pages — any new page missing from the matrix fails CI. This plan creates
  **no** operator/admin pages; the matrix stays green with zero operator pages today.
- Server Actions for support ops follow the base Contract rule 2 (session via
  `requireSessionUser`, `ForbiddenError` → `{ok:false, error:{code:"forbidden",…}}`).

### Docs impact (delta)

- `README.md`: «دو نقش» → **چهار نقش** with one line each (student / counselor /
  admin / operator-support); access matrix gains the operator column (`user:manage`
  and RAG rows stay admin-only). Base plan G6 target «سه نقش» and base AC-8's
  «three roles» wording are amended to **four roles**; AC-8's grep
  (`! grep -q "دو نقش"`) is unchanged and still valid.
- `docs/behaviors/roles-and-access.md`: matrix gains an operator row + role list;
  `source_files` gains `capabilities.ts` semantics for the two new capabilities.

### Additional acceptance criteria

- [x] AC-11: When capability checks run for operator, `hasCapability("operator","user:support")` is true, `hasCapability("operator","user:manage")` is false, `hasCapability("operator","rag:manage")` is false. — verify: `pnpm vitest run src/modules/advising/domain/capabilities.test.ts` — evidence: exit 0 (operator describe passes).
- [x] AC-12: When `toRole` receives `"operator"` it returns `"operator"`, and an unknown string still returns `"student"`. — verify: `pnpm vitest run src/modules/advising/domain/models.test.ts` — evidence: exit 0.
- [x] AC-13: When `registerSchema` receives `role:"operator"` or `role:"admin"`, parsing fails. — verify: `pnpm vitest run src/modules/advising/presentation/schemas.test.ts` — evidence: exit 0.
- [x] AC-14: When the page-gate matrix runs, it stays green with zero operator pages, and any future operator-support page must be classified under `capability:user:read` by the admin panel's matrix extension. — verify: `pnpm vitest run test/architecture.test.ts` — evidence: exit 0, 12 tests passed.

### review_level

Stays `reviewed`. Justification: no migration (`role String`), no guard signature
change, behavior change is additive and deny-tighter (operator holds neither
`user:manage` nor `rag:manage`; registration still mints only student|counselor);
human re-confirms at the plan gate.
