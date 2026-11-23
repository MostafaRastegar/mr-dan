# architecture-alignment — Contract

## Interface signature

vm components keep today's exact public props/type — no export rename;
only the module path gains `.vm`.

| Component | Signature |
|---|---|
| `KnowledgePage()` | `export function KnowledgePage(): React.ReactNode` |
| `ChatPage()` | `export function ChatPage(): React.ReactNode` |
| `ProfileForm({ profile })` | `export default function ProfileForm({ profile }: { profile: ProfileView })` |
| `RegisterForm()` | `export default function RegisterForm()` |
| `AssignStudentForm({ groups, students })` | `export default function AssignStudentForm({ groups, students }: { groups: GroupSummary[]; students: StudentSummary[] })` |
| `GroupCreateForm()` | `export default function GroupCreateForm()` |
| `CounselorRoster({ groups, students })` | `export default function CounselorRoster({ groups, students }: { groups: GroupSummary[]; students: StudentSummary[] })` |

## Invariant

A `"use client"` file under `src/components/` that exceeds 80 lines must be a
`*.vm.tsx` with a sibling `<base>.view.tsx`. The `*.vm.tsx` is the only one
that calls hooks (`useState`, `useEffect`, `useRef`, `useCallback`,
`Form.useForm`, `useFormAction`, `useServerFormErrors`, `Form.useWatch`).
The `*.view.tsx` receives everything as props and contains no hooks.

## Edge cases

- View with zero results → same empty text as today.
- `state === null` initial → no success banner, no error banner.
- Aborted stream → partial text kept, "stopped" path unchanged.

### verify

`E2E_ENABLED=true pnpm exec playwright test tests/e2e/advising-auth.spec.ts 2>&1 \| grep -E '^\s*2 passed'`

## review_level

reviewed — no auth/payments/migration/infra, no contract change; a multi-file
move of UI internals behind e2e-only coverage, so a human must review the four
splits rather than trust the suite alone.

## Source files

Created:
- `src/components/admin/knowledge-page.vm.tsx`
- `src/components/admin/knowledge-page.view.tsx`
- `src/components/chat/chat-page.vm.tsx`
- `src/components/chat/chat-page.view.tsx`
- `src/components/advising/profile-form.vm.tsx`
- `src/components/advising/profile-form.view.tsx`
- `src/components/auth/register-form.vm.tsx`
- `src/components/auth/register-form.view.tsx`
- `src/components/advising/assign-student-form.vm.tsx` + `.view.tsx`
- `src/components/advising/counselor-roster.vm.tsx` + `.view.tsx`
- `src/components/advising/group-create-form.vm.tsx` + `.view.tsx`
- `test/fakes/health-probe.ts` (moved from `src/test/health-probe.ts`)
- `docs/contracts/architecture-alignment.md`

Deleted:
- `src/components/admin/knowledge-page.tsx`
- `src/components/chat/chat-page.tsx`
- `src/components/advising/profile-form.tsx`
- `src/components/auth/register-form.tsx`
- `src/components/advising/assign-student-form.tsx`
- `src/components/advising/counselor-roster.tsx`
- `src/components/advising/group-create-form.tsx`
- `src/test/`

Edited:
- `test/architecture.test.ts` (two new assertions)
- `src/modules/rag/domain/ports.test.ts` (import path only)
- `src/app/admin/knowledge/page.tsx` (importer → `.vm`)
- `src/app/chat/page.tsx` (importer → `.vm`)
- `src/app/(advising)/profile/page.tsx` (importer → `.vm`)
- `src/app/(advising)/counselor/students/page.tsx` (importer → `.vm`)
- `src/app/(auth)/register/page.tsx` (importer → `.vm`)
- `docs/behaviors/phase-5-1-identity-profile.md` (source_files)
- `docs/plan/architecture.md` (§۹: D3/D4/D5)
- `README.md` (one line under `## وضعیت`)
