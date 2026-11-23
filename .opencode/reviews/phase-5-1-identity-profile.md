# Review — phase-5-1-identity-profile — round 2
Verdict: APPROVE WITH FINDINGS

## Fix verification (HIGH finding from round 1)
Fixed | File:line | Summary
yes | src/modules/advising/application/groups.ts:81-83 | `if (student.counselorId && student.counselorId !== actor.id) throw new ForbiddenError()` throws before `assignToGroup` (line 85)
yes | src/modules/advising/application/groups.ts:90 | unassign (`groupId: null`) passes `counselorId: undefined`, so counselorId is preserved
yes | src/modules/advising/domain/ports.ts:33 | `assignToGroup.counselorId?: string` optional
yes | src/modules/advising/infrastructure/prisma-user-repository.ts:245-247 | `counselorId` included in `data` only when defined
yes | test/fakes/advising.ts:225 | same optional semantics (`if (input.counselorId !== undefined)`)
yes | src/modules/advising/application/groups.test.ts:99-118 | new test "counselor cannot assign another counselor's student and changes nothing"
yes | src/modules/advising/application/groups.test.ts:120-131 | new test "unassigning keeps the student's counselor id"

HIGH finding now resolved.

## Counts
CRITICAL 0 · HIGH 0 · MEDIUM 1

## Findings
| # | Severity | File:line | Finding | Fix |
| 1 | MEDIUM | AGENTS.md | AC-28: read-only frontend reference rule missing — file is locked (edit rejected); human must apply exact text | add bullet under "## ممنوعیت‌ها":

```
- `~/project/yaftar/an-front` فقط مرجع خواندنی است: هیچ import، dependency، submodule یا کپی از آن در این مخزن مجاز نیست (رکورد لایسنس: `aip-next ships no LICENSE` در `docs/plan/frontend-conventions.md`).
```

insert right after the "## ممنوعیت‌ها" heading, before the first existing bullet.

## Acceptance evidence (compact, AC-1..AC-31)
| AC | Verdict | Evidence |
| AC-16 (IDOR fix) | PASS | groups.ts:81-83 throw before assignToGroup; line 90 counselorId: undefined on unassign; groups.test.ts:99-131 |
| AC-18 | PASS | tests.log: typecheck 0 · lint 0 · test 0 · build 0; e2e 2 passed; behavior doc: 25f/133t pass |
| AC-22 | PASS | docs/contracts + docs/behaviors exist; last_verified + source_files present |
| AC-28 | FAIL | AGENTS.md lacks read-only rule; grep aip-next/yaftar/خواندنی → no matches; file locked (permission.rejected), human must apply |
| AC-30 | PASS (round 1, unchanged) | behavior doc line 89: skills installed, SKILL.md files present |
| AC-31 | PASS (round 1, unchanged) | behavior doc line 89: two SKILL.md installed + three append sections; skills-draft removed |

## Remaining for human
1. Apply the AGENTS.md bullet above (AC-28).
2. Confirm final approval → CHANGELOG.md.

## Blockers
- AGENTS.md is permission-locked; reviewer cannot apply the AC-28 bullet. Human application required before final approval.
