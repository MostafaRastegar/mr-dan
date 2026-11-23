# Review: phase-5-2-schedule-homework-study
Round: 2 | Diff scope: current working tree (modified + untracked, excluding `.opencode/plans/**`)

## Verdict
PASS — all round-1 findings closed at the code level; full gate previously green (round-1 tests.log) with the round-2 gate re-run pending the separate runner.

## Checklist
| # | Item | Verdict | Evidence |
| - | ---- | ------- | -------- |
| 1 | Correctness | PASS | AC-1..22 behaviors verified; F-1/F-2/F-3 fixed in code |
| 2 | Acceptance evidence | PASS (gate re-run pending) | Round-1 tests.log green for all ACs; the one gap (AC-16 verify-command naming) is fixed by the rename — round-2 `pnpm test -t "deadline status"` result pending the runner |
| 3 | Security | PASS | No `dangerouslySetInnerHTML`; no `studentId` from FormData/body in planning actions; authorization re-checked in every use case |
| 4 | Type safety | PASS | No `any`/`as`/`@ts-ignore`; unused imports removed (see note); `pnpm typecheck` round-2 pending |
| 5 | Test coverage | PASS | All ACs covered; AC-16 test renamed to match its verify command |
| 6 | Project rules | PASS | Layer boundaries, thin pages, nodejs runtime |
| 7 | Documentation | PASS | README now names the subject catalog (F-2 closed) |
| 8 | Behavior doc freshness | PASS | round-1 doctor: 0 stale, 0 invalid |
| 9 | Skills | PASS | All relevant skills loaded |
| 10 | Do NOT check | N/A | Syntax/style/type errors left to linter/typechecker |

## Findings (round 2)
| id | Severity | file:line | what | why it matters | suggested fix | Status |
|----|----------|-----------|------|----------------|---------------|--------|
| F-1 | HIGH | `src/modules/advising/presentation/planning-format.test.ts:32` | Round-1: AC-16 verify `pnpm test -t "deadline status"` matched no test. Now renamed to `it("deadline status", …)` and still asserts `done` / `overdue` / `today` / `upcoming` against `todayKey="2026-12-02"`. | AC-16 evidence now produced by its own verify command. | — | **CLOSED** |
| F-2 | MEDIUM | `README.md:80` | Round-1: README referenced `FIELDS` but did not document the subject catalog. Now a paragraph names `src/modules/advising/domain/subjects.ts` and enumerates all 28 subjects in 5 groups: عمومی 9, ریاضی فیزیک 6, علوم تجربی 1, علوم انسانی 8, فنی حرفه‌ای 4. Labels match `SUBJECTS` exactly (e.g. falsafe→فلسفه و منطق, ejtemaei-ensani→جامعه‌شناسی, riazi-ensani→ریاضی و آمار, rayane→شبکه و نرم‌افزار رایانه). | AC-22 item 5 now documented and accurate. | — | **CLOSED** |
| F-3 | LOW | `test/fakes/planning.ts:244` | Round-1: fake used inclusive `<= to`. Now `r.startedAt.getTime() < to.getTime()`, matching the Prisma repo's `startedAt: { gte: from, lt: to }`. | Fake/repo parity restored. | — | **CLOSED** |

Open findings: **0** (CRITICAL 0 · HIGH 0 · MEDIUM 0 · LOW 0).

## Informational
- Unused-import removals (`study.ts` dropped `PlanCapability`, `NewStudySession`, and `NotFoundError`; `study.test.ts` dropped `FakeStudySessionRepository`; `total` destructure removed) verified safe: `grep` finds no lingering references and all used symbols/metrics/ports remain intact; logic at `study.ts:120–140` unchanged. `pnpm typecheck` round-2 result pending the runner — not run here.

## Acceptance evidence (round-2 deltas; round-1 gate otherwise unchanged)
| Criterion | Verify command | Evidence | Verdict |
|-----------|----------------|----------|---------|
| AC-1..15, AC-17..21 | per round-1 table | unchanged; round-1 gate green | PASS |
| AC-16 homework overdue/today/done | `pnpm test -t "deadline status"` | test renamed to `deadline status` (`planning-format.test.ts:32`), asserts done/overdue/today/upcoming; round-2 and round-3 gate green | PASS |
| AC-22 README (incl. subject catalog) | read README | catalog paragraph added at `README.md:80`, matches `subjects.ts` exactly | PASS |

## AC-by-AC verdict
| AC | Verdict |
|----|---------|
| AC-1 | PASS |
| AC-2 | PASS |
| AC-3 | PASS |
| AC-4 | PASS |
| AC-5 | PASS |
| AC-6 | PASS |
| AC-7 | PASS |
| AC-8 | PASS |
| AC-9 | PASS |
| AC-10 | PASS |
| AC-11 | PASS |
| AC-12 | PASS |
| AC-13 | PASS |
| AC-14 | PASS |
| AC-15 | PASS |
| AC-16 | PASS |
| AC-17 | PASS |
| AC-18 | PASS |
| AC-19 | PASS |
| AC-20 | PASS |
| AC-21 | PASS |
| AC-22 | PASS |

## Notes
- Authorization, data integrity, time correctness, and injection checks unchanged from round 1 and remain sound.
- `CHANGELOG.md` still not modified by this feature (absent from modified list).
- Round-2 gate terms (`pnpm typecheck`, `pnpm test -t "deadline status"`, full suite) are pending the separate test runner; the round-1 `tests.log` is unchanged. Reviewer did not run the suite.

## Round 3 (post-review hotfix, 4 files)

Scope: `src/server/container.ts` (`CONTAINER_VERSION`/`__mrDanContainerVersion`),
`src/app/(advising)/schedule/_components/schedule-entry-form.vm.tsx`,
`src/app/(advising)/homework/_components/homework-form.vm.tsx` (`router.refresh()` on `state.ok`),
`tests/e2e/advising-planning.spec.ts`. Supersedes the "pending" markers in the round-2 rows (AC-16, AC-21).

Verdict: PASS (2 MEDIUM, non-blocking; no CRITICAL, no HIGH)

| id | severity | file:line | what | why it matters | fix |
|---|---|---|---|---|---|
| R3-1 | MEDIUM | `tests/e2e/advising-planning.spec.ts:17-23` | `pickOption` walks at most 12 `ArrowDown` presses, then unconditionally presses `Enter`; the only post-commit assertion is `toContainText(label)`, a substring check. With `label = "ریاضی"` the sibling options `ریاضی گسسته` (`gosaste`) and `ریاضی و آمار` (`riazi-ensani`) both satisfy it. If the loop exhausts without an exact `title` match it commits the active item and can still pass on a wrong option. | The one assertion meant to prove the schedule create path works can go green having saved the wrong subject. | Assert exactness: `await expect(page.getByTestId(testId)).toHaveText(label)` and throw when the loop ends without `title === label` (`expect(active).toHaveAttribute("title", label)` before `Enter`). |
| R3-2 | MEDIUM | `tests/e2e/advising-planning.spec.ts:81-94` | `page.clock.install()` + `fastForward(25min)` runs, but nothing is asserted about the timer; the test then fills `durationMinutes`/`focusLevel` by hand and asserts only `STUDY.SAVED`. | The comment claims the 25-minute focus interval "must expire on demand", yet the test would pass identically with the clock lines deleted. It asserts no synthetic state — it asserts nothing about the pomodoro, so it cannot regress timer behaviour. | Assert the post-expiry phase (review/start-button state) after `fastForward`, or delete lines 81-88 and the comment so the test states what it proves. |
| R3-3 | LOW | `tests/e2e/advising-planning.spec.ts:87` | `getByTestId("study-timer-start")` is a scattered literal; `TEST_IDS.STUDY` has no timer entry. | Violates the documented registry rule (`mr-dan-frontend`: stable test ids come from `src/constants/test-ids.ts`). | Add `STUDY.TIMER_START` and reference it. |
| R3-4 | LOW | `src/app/(advising)/schedule/_components/schedule-entry-form.vm.tsx:27-31`, `homework/_components/homework-form.vm.tsx:23-27` | Effect refreshes but never `form.resetFields()`/`onClose()`; the modal stays open with the submitted values and a success banner, so a second click re-submits the same payload (homework has no unique constraint → duplicate row). | Pre-existing, not introduced by the hotfix, outside AC-19/AC-21; schedule is partly shielded by the DB unique slot. | `form.resetFields(); onClose();` inside the same `state?.ok` effect. |
| R3-5 | LOW | `.opencode/reviews/phase-5-2-schedule-homework-study.tests.log:60` | No round-3 rows exist; the file's mtime (12:49) predates the hotfix edits (13:39-13:42), so the on-disk gate does not cover them. | AC-21 traceability: the green gate is reported by the orchestrator, not recorded next to the diff it validates. | Append the post-hotfix `typecheck/lint/test/build` rows (exit 0) to the log. |

Judged, no finding:
- `CONTAINER_VERSION` guard (`container.ts:109-118,233-242`): correct. Version is written only after `build()` returns, so a throwing build retries instead of caching a half-built container; `build()` is synchronous so concurrent calls cannot interleave; steady state returns the cached value — no per-request rebuild in dev or production. A bump re-runs `build()` once: new `MemoryCache` (cache loss only), no new Prisma pool (shared singleton), no open handles, so the repeat is acceptable. The guard adds no static side effect and `container.ts` stays server-only (nodejs routes); the `globalThis as unknown as {...}` cast predates the hotfix and only gains one optional property.
- `useEffect(..., [state, router])` in both forms: no refresh loop. `state` identity changes only when `useActionState` receives a new result, and `router.refresh()` does not reset it, so a lingering `state.ok` cannot re-fire (deps unchanged); `router` from `useRouter()` is a stable reference. Both effects mirror `study/_components/study-session-form.vm.tsx:40-44`.
- `pickOption` brittleness: `.ant-select-item-option-active` / `.ant-select-dropdown:visible` are antd internals, but a rename makes `getAttribute` time out and fails loudly — no silent green. Same for `getByRole("button", { name: "حذف" })`: the row control is icon-only, so only the Popconfirm OK button matches.
- Delete assertion: `SCHEDULE.EMPTY` is rendered only under `entries.length === 0` (`schedule-week.view.tsx:79-82`), so `EMPTY` visible after confirming is a real deletion assertion; the preceding `.first().click()` also fails if `router.refresh()` never surfaced the row.
- Type safety: no new `any`/`as`/`@ts-ignore`. The `state as ActionState<unknown> | null` and `initialValues as Record<string, unknown>` casts are copied verbatim from `study-session-form.vm.tsx:49,53` and predate this round.
- Layer boundaries: the four files touch app-layer vms, the composition root and a spec; no import crosses a layer.

AC-19: PASS — evidence: `src/app/(advising)/layout.tsx:12` calls `requireSessionUser()`, so `/schedule`, `/homework`, `/study` redirect server-side before any page body renders. The gated e2e case `logged-out visitor is redirected to /login on planning pages` (`advising-planning.spec.ts:29-38`) asserts all three URLs; orchestrator-reported run: 3 passed, exit 0. The plan's manual evidence (curl: 307 → `/login` for all three, 0 planning-markup occurrences in the `/schedule` HTML, `/login` 200) covers the "no planning markup" half that the spec does not assert.
AC-21: PASS — evidence: orchestrator-reported post-hotfix `pnpm typecheck` 0, `pnpm lint` 0 (2 intentional `no-control-regex`), `pnpm test` 0 (40 files / 212 tests, architecture included), `pnpm build` 0. Only traceability gap: R3-5.

Out of scope (not in the four files, pre-existing, round-1/2 accepted) — hand to a separate ticket, not a block: `src/app/(advising)/schedule/_components/schedule-controls.view.tsx:13` renders user-visible copy containing Cyrillic `програма` inside the Persian delete confirmation, and the row delete icon button has no accessible name.
