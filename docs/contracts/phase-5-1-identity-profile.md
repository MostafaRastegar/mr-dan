# Contract: phase 5.1 (identity, profile, groups)

`review_level: full`. Scope: the working tree of `phase-5-1-identity-profile`.
Everything below is read from the shipped code, not from the plan's intent. Where the
code moved relative to the plan, the real path wins and the drift is noted.

Drift from the plan (documented, not a defect):

- Server Actions live in `src/server/advising-actions.ts` (plan guessed
  `src/modules/advising/presentation/actions.ts`).
- Guards live in `src/server/advising-guards.ts` (plan guessed `presentation/guards.ts`).
- `logoutAction` returns `Promise<void>`, not `Promise<never>`.
- The layout guard helpers are `getSessionContext()`, `requireSessionUser()`,
  `requireCounselor()`; there is no `getOptionalSessionUser()`.

## Interfaces

### Application: `src/modules/advising/application/auth.ts`

```ts
export type RegisterInput = {
  username: string; password: string; role: Role; fullName: string;
  email?: string; grade?: string; fieldOfStudy?: string; schoolName?: string;
};

export class RegisterUserUseCase {
  constructor(users: UserRepositoryPort, sessions: SessionRepositoryPort, crypto: AuthCryptoPort);
  execute(input: RegisterInput): Promise<{ user: UserAccount; token: string }>;
}

export class LoginUserUseCase {
  constructor(users: UserRepositoryPort, sessions: SessionRepositoryPort, crypto: AuthCryptoPort);
  execute(input: { username: string; password: string }): Promise<{ user: UserAccount; token: string }>;
}

export class LogoutUserUseCase {
  constructor(sessions: SessionRepositoryPort, crypto: AuthCryptoPort);
  execute(input: { token: string }): Promise<void>;
}
```

Normalization: username `trim().toLowerCase()`; email `trim().toLowerCase()`, empty
becomes `null` (`src/modules/advising/application/auth.ts:33-36,48-49`). Login uses the
same `trim().toLowerCase()` on username (`auth.ts:94-96`).

### Application: `src/modules/advising/application/session.ts`

```ts
export const SESSION_TTL_MS: number; // 7 * 24 * 60 * 60 * 1000
export function sessionExpiry(now: number = Date.now()): Date;
export class ResolveSessionUseCase {
  constructor(sessions: SessionRepositoryPort, users: UserRepositoryPort, crypto: AuthCryptoPort);
  execute(input: { token: string }): Promise<{ user: UserAccount } | null>;
}
```

Empty/blank token short-circuits to `null` without a DB read (`session.ts:30-31`).

### Application: `src/modules/advising/application/profile.ts`

```ts
export class GetProfileUseCase {
  constructor(users: UserRepositoryPort);
  execute(input: { userId: string }): Promise<ProfileView | null>;
}

export type UpdateProfileInput = {
  userId: string; token: string; fullName: string; email?: string;
  grade?: string; fieldOfStudy?: string; schoolName?: string;
  currentPassword?: string; newPassword?: string;
};

export class UpdateProfileUseCase {
  constructor(users: UserRepositoryPort, sessions: SessionRepositoryPort, crypto: AuthCryptoPort);
  execute(input: UpdateProfileInput): Promise<UserAccount>;
}
```

Order of operations: load user (missing ⇒ `UnauthorizedError`), validate password change,
hash new password, write profile, then `updatePassword` plus
`deleteManyByUserId(userId, sha256(currentToken))` (`profile.ts:48-88`).

### Application: `src/modules/advising/application/groups.ts`

```ts
type Actor = { id: string; role: Role }; // local, not exported

export class CreateGroupUseCase {
  constructor(groups: GroupRepositoryPort);
  execute(input: { actor: Actor; name: string; description?: string;
    targetGrade?: string; targetField?: string; color?: string }): Promise<GroupSummary>;
}

export class AssignStudentToGroupUseCase {
  constructor(users: UserRepositoryPort, groups: GroupRepositoryPort);
  execute(input: { actor: Actor; studentId: string; groupId: string | null }): Promise<void>;
}

export class CounselorRosterUseCase {
  constructor(users: UserRepositoryPort, groups: GroupRepositoryPort);
  execute(input: { actor: Actor }): Promise<{ groups: GroupSummary[]; students: StudentSummary[] }>;
}
```

Every entry point calls `assertCounselor(actor)` first, independent of any UI guard
(`groups.ts:25-27,40,67,98`).

### Ports: `src/modules/advising/domain/ports.ts`

```ts
export interface UserRepositoryPort {
  findCredentialsByUsername(username: string): Promise<{ user: UserAccount; passwordHash: string } | null>;
  findByEmail(email: string): Promise<UserAccount | null>;
  findById(id: string): Promise<UserAccount | null>;
  findProfileById(id: string): Promise<ProfileView | null>;
  create(input: NewUser & { passwordHash: string }): Promise<UserAccount>;
  updateProfile(id: string, patch: ProfilePatch): Promise<UserAccount>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
  listAssignableStudents(counselorId: string): Promise<StudentSummary[]>;
  assignToGroup(input: { studentId: string; groupId: string | null; counselorId: string }): Promise<void>;
}

export interface SessionRepositoryPort {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void>;
  findByTokenHash(tokenHash: string): Promise<SessionRecord | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteManyByUserId(userId: string, exceptTokenHash?: string): Promise<void>;
}

export interface GroupRepositoryPort {
  create(input: NewGroup): Promise<GroupSummary>;
  findById(id: string): Promise<GroupSummary | null>;
  listByCounselor(counselorId: string): Promise<GroupSummary[]>;
}

export interface AuthCryptoPort {
  hashPassword(plain: string): Promise<string>;
  verifyPassword(plain: string, stored: string): Promise<boolean>;
  generateToken(): string;
  hashToken(token: string): string;
}
```

Adapters: `PrismaUserRepository`, `PrismaSessionRepository`, `PrismaGroupRepository`,
`ScryptAuthCrypto`, all under `src/modules/advising/infrastructure/`, wired only in
`buildAdvising()` inside `src/server/container.ts:160-177`.

### Server Actions: `src/server/advising-actions.ts`

```ts
"use server";

registerAction(
  previous: ActionResult<{ userId: string }> | null, formData: FormData,
): Promise<ActionResult<{ userId: string }>>;

loginAction(
  previous: ActionResult<{ userId: string }> | null, formData: FormData,
): Promise<ActionResult<{ userId: string }>>;

logoutAction(formData: FormData): Promise<void>;

updateProfileAction(
  previous: ActionResult<{ userId: string }> | null, formData: FormData,
): Promise<ActionResult<{ userId: string }>>;

createGroupAction(
  previous: ActionResult<{ groupId: string }> | null, formData: FormData,
): Promise<ActionResult<{ groupId: string }>>;

assignStudentAction(
  previous: ActionResult<{ studentId: string }> | null, formData: FormData,
): Promise<ActionResult<{ studentId: string }>>;
```

Rules that hold for all six:

- FormData is parsed by the zod schema for that action (`presentation/schemas.ts`).
  Extra FormData keys are dropped by zod's default object behaviour.
- The identity always comes from the session cookie, never from a hidden form field
  (`advising-actions.ts:82,100,117`).
- `redirect()` is called after `runAction` resolves, outside its `try/catch`
  (`advising-actions.ts:49-50,65-66,83,101,118`).
- `revalidatePath` is never imported or called (AC-26 greps the module).
- Success is detected only with `state?.ok === true` (`src/shared/action-result.ts`).

### Action result: `src/shared/action-result.ts`

```ts
export interface ActionError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };
```

`fieldErrors` maps one field name to one Persian message; the first issue per field wins
(`toFieldErrors`, `presentation/schemas.ts:152-163`). `username_taken` and `email_taken`
are additionally projected onto `fieldErrors.username` / `fieldErrors.email`
(`presentation/messages.ts:21-33`).

### Cookie contract: `presentation/cookie.ts`, `presentation/session-cookie.ts`

| Property | Value |
|---|---|
| name | `mrdan_session` (constant `SESSION_COOKIE_NAME`) |
| value | raw token, `randomBytes(32).toString("base64url")`, 43 chars |
| `httpOnly` | `true` |
| `sameSite` | `"lax"` |
| `path` | `"/"` |
| `secure` | `process.env.NODE_ENV === "production"` only |
| `expires` / `maxAge` | `sessionExpiry()` = now + 7 days; `maxAge` seconds derived from `expires` |
| DB row | `tokenHash = sha256(token)` lowercase hex, 64 chars |

`cookie.ts` imports no `next` module (unit-testable); `session-cookie.ts` is the only file
that touches `next/headers`.

### Password and token format: `infrastructure/auth-crypto.ts`

- Password hash format: `scrypt$16384$8$1$<saltB64url>$<hashB64url>`. 16-byte random salt,
  64-byte key, N=16384, r=8, p=1. Verify parses N/r/p/salt from the string (not hard-coded)
  and compares with `timingSafeEqual` on equal-length buffers; any parse error or garbage
  input returns `false`, never throws.
- Length bounds enforced by `schemas.ts`: password min 8, max 128; new password min 8,
  max 128; current password max 128.
- Raw token never appears in the DB, logs, or an `ActionError`.

## Error codes

Source of truth: `src/shared/errors.ts` plus `src/modules/advising/domain/errors.ts`;
messages and code-to-field projection in `presentation/messages.ts`.

| `code` | HTTP-ish status | Thrown by | Persian `message` |
|---|---|---|---|
| `invalid_input` | 400 | `ValidationError`, any `ZodError` in `runAction` | `اطلاعات وارد شده معتبر نیست` |
| `unauthorized` | 401 | `UnauthorizedError` (bad login, wrong current password, missing user on profile update) | `نام کاربری یا رمز عبور اشتباه است` |
| `forbidden` | 403 | `ForbiddenError` (non-counselor, foreign group) | `دسترسی به این عملیات مجاز نیست` |
| `not_found` | 404 | `NotFoundError` (missing group or student) | `موردی یافت نشد` |
| `username_taken` | 409 | `UsernameTakenError`, pre-check or P2002 remap | `این نام کاربری قبلاً ثبت شده است` + `fieldErrors.username` |
| `email_taken` | 409 | `EmailTakenError`, pre-check or P2002 remap | `این ایمیل قبلاً ثبت شده است` + `fieldErrors.email` |
| `internal_error` | 500 | any non-`AppError` throw in `runAction` | `خطای داخلی رخ داد. لطفاً دوباره تلاش کنید.` |

`ActionError` carries `code` and `message` only for the client; `AppError.status` is
server-side metadata and is not serialized.

## Invariants

Each invariant names the command that proves it.

1. **Password never stored in plaintext.** `User.passwordHash` always starts with
   `scrypt$` and never equals the submitted password.
   `pnpm test src/modules/advising/application/auth.test.ts -t "hashes password"`
   plus `pnpm test src/modules/advising/infrastructure/auth-crypto.test.ts -t "format"`.

2. **Session stores only the hash.** `Session.tokenHash` equals
   `sha256(rawToken)` and no row contains the raw cookie value.
   `pnpm test src/modules/advising/application/auth.test.ts -t "token hash"`
   plus `pnpm test src/modules/advising/infrastructure/auth-crypto.test.ts -t "64-character hex"`.

3. **One group and one counselor per student, written atomically.** `User.groupId` and
   `User.counselorId` are single columns; `assignToGroup` writes both in one `update`
   (`prisma-user-repository.ts:236-246`).
   `pnpm test src/modules/advising/application/groups.test.ts -t "assign"`.

4. **No unauthenticated render or mutation under `(advising)`.** `layout.tsx` calls
   `requireSessionUser()`; each mutating action re-resolves the cookie session
   (`advising-actions.ts:82,100,117`); `ResolveSessionUseCase` rejects an expired row.
   `E2E_ENABLED=true pnpm test:e2e -- tests/e2e/advising-auth.spec.ts -g "logged out"`
   plus `pnpm test src/modules/advising/application/session.test.ts -t "expired"`.

5. **Counselor authority is scoped.** A counselor mutates only groups they own
   (`groups.ts:69-73`) and only students who are `role = "student"`; the roster query
   returns only own or unassigned students (`prisma-user-repository.ts:206-223`).
   `pnpm test src/modules/advising/application/groups.test.ts -t "non-counselor"` and
   `pnpm test src/modules/advising/application/groups.test.ts -t "roster excludes"`.

6. **FK delete rules.** Deleting a `User` cascades their `Session` rows; deleting a
   `Group` sets members' `groupId` to `NULL`; `Group` cascades from its owner
   (`prisma/schema.prisma:80-118`).
   `pnpm test test/advising/integration.test.ts -t "cascades"` and
   `pnpm test test/advising/integration.test.ts -t "sets members"`.

7. **One result shape.** Every advising action returns `ActionResult`; no
   `{ status: ... }` form state and no `revalidatePath` exists in the module.
   `pnpm test src/modules/advising/presentation/run-action.test.ts -t "action result"`
   and `! grep -rnE 'status: "(idle|success)"|revalidatePath' src/modules/advising`.

8. **No internal leakage.** `ActionError` never contains stack traces, SQL, tokens, or raw
   provider errors; unknown throws become `internal_error` with the fixed Persian message
   (`presentation/messages.ts:26-35`, `run-action.ts:19-31`).
   `pnpm test src/modules/advising/presentation/run-action.test.ts -t "unknown thrown"`.

9. **Zod is the only form boundary.** Persian/Arabic digits are normalized on `username`
   and `email` only; the password is passed through untouched
   (`presentation/schemas.ts:47-69`).
   `pnpm test src/modules/advising/presentation/schemas.test.ts -t "Persian digits"`.

10. **Session TTL has one source.** `SESSION_TTL_MS` lives in `application/session.ts` and
    is re-exported by `presentation/cookie.ts`; there is no second 7-day literal.
    `pnpm test src/modules/advising/presentation/cookie.test.ts`.

## Edge cases

Commands are the real `verify:` commands from the plan where one exists; otherwise the
test title in the shipped suite. "read-only" means verified by reading the named lines,
with no dedicated test.

| Edge case | Expected result | Proof |
|---|---|---|
| Duplicate username | `username_taken` 409, one row | `pnpm test src/modules/advising/application/auth.test.ts -t "duplicate username"` |
| Duplicate email | `email_taken` 409, one row | `pnpm test src/modules/advising/application/auth.test.ts -t "duplicate email"` |
| Two users with `email = NULL` | both insert; Postgres unique allows multiple NULLs | `pnpm test test/advising/integration.test.ts -t "null email"` |
| Unique violation raised by the DB (race, two concurrent registrations) | P2002 remapped to `username_taken` / `email_taken` by target; never an `internal_error` | read-only: `prisma-user-repository.ts:71-104,173-175,192-195`; no dedicated unit test |
| Wrong password | `unauthorized` 401, same message as unknown user, zero sessions | `pnpm test src/modules/advising/application/auth.test.ts -t "wrong password"` |
| Unknown username | identical `unauthorized` 401, zero sessions | same command as above (test covers both) |
| Unknown session token | `null`, no user attached | `pnpm test src/modules/advising/application/session.test.ts -t "unknown token"` |
| Expired session token | `null` and the row is deleted lazily | `pnpm test src/modules/advising/application/session.test.ts -t "expired"` |
| Replay after logout | `null`; the row is gone | `pnpm test src/modules/advising/application/auth.test.ts -t "logout"` |
| `newPassword` without `currentPassword` | `invalid_input` 400, `fieldErrors.currentPassword` | `pnpm test src/modules/advising/application/profile.test.ts -t "without old password"` |
| Wrong `currentPassword` | `unauthorized` 401, stored hash unchanged | `pnpm test src/modules/advising/application/profile.test.ts -t "current password"` |
| Successful password change | re-hashed; all other sessions revoked; current token survives | `pnpm test src/modules/advising/application/profile.test.ts -t "revokes other sessions"` |
| New password of 7 chars | `invalid_input`; 8 chars accepted | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "password minimum"` |
| Assigning to another counselor's group | `forbidden` 403, nothing changes | `pnpm test src/modules/advising/application/groups.test.ts -t "another counselor"` |
| Assigning a counselor as a student | `invalid_input` 400 | `pnpm test src/modules/advising/application/groups.test.ts -t "counselor as a student"` |
| Missing group or student id | `not_found` 404 | `pnpm test src/modules/advising/application/groups.test.ts -t "missing group or student"` |
| `groupId` omitted or empty (clears group) | schema yields `null`; counselor kept on the student row | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "empty groupId"` |
| Empty group name | `invalid_input` 400 | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "empty group name"` |
| Group name over 100 chars | `invalid_input` 400 (`requiredText(100, ...)`) | read-only: `schemas.ts:122-124`; no dedicated test title |
| Username shorter than 3 chars | `invalid_input` 400 (`min(3, ...)`) | read-only: `schemas.ts:47-52`; covered only indirectly by `-t "empty username"` |
| Email submitted as `""` | treated as absent (`undefined`), stored as `null` | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "empty email"` |
| Username typed with Persian/Arabic digits | converted to ASCII, then lowercased, so lookup succeeds | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "normalizes Persian digits"` |
| Password containing Persian digits | unchanged by normalization | `pnpm test src/modules/advising/presentation/schemas.test.ts -t "leaves Persian digits"` |
| Non-`AppError` thrown in an action | `{ ok: false, error: { code: "internal_error" } }`, no internals | `pnpm test src/modules/advising/presentation/run-action.test.ts -t "unknown thrown"` |
| Zod failure in an action | `{ ok: false, error: { code: "invalid_input", fieldErrors } }` | `pnpm test src/modules/advising/presentation/run-action.test.ts -t "zod failure"` |
| Cookie outside production | `secure: false`, rest of the flags unchanged | `pnpm test src/modules/advising/presentation/cookie.test.ts` |
| Demo seed run twice | 1 counselor, 1 group, 1 student; assignment kept; hash not rewritten | `pnpm test test/advising/seed.test.ts -t "seed is idempotent" && pnpm tsx scripts/seed-advising.ts && pnpm tsx scripts/seed-advising.ts` |
| Demo seed in `NODE_ENV=production` | throws before any write | `pnpm test test/advising/seed.test.ts -t "seed refuses production"` |
| Unknown or garbage stored password hash | `verifyPassword` returns `false`, never throws | `pnpm test src/modules/advising/infrastructure/auth-crypto.test.ts -t "garbage"` |

## Layer boundaries

`domain/` has no external import; `application/` imports only `domain/`; adapters are
constructed only in `src/server/container.ts`; route/page code calls use cases through the
container. `pnpm test test/architecture.test.ts` enforces this for `modules/advising/**`.
