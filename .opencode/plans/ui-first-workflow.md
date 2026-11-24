# UI-first workflow gate — policy patch

Status: **draft, awaiting human apply**. Owner: human (agent files are `edit: deny` for every agent).
Scope: `AGENTS.md` + `.opencode/agents/{mro-orchestrator,mro-architect,mro-implementer,mro-reviewer}.md`.

## Rule

Any feature that designs or changes the user interface runs in **two gates**, and gate 2 cannot start
without written human approval of gate 1:

1. **UI gate (mock data).** Build the whole UI — every screen, state (empty/loading/error/success),
   responsive and RTL — against mock data. No database writes, no real Server Action, no migration,
   no `prisma/schema.prisma` change.
2. **Demo + human approval.** `pnpm dev`, screenshots or a live demo, then an explicit human "yes" on
   look and flow.
3. **Backend gate.** Replace the mock with the real use case, port implementation, action and
   migration; then unit/integration/e2e tests and the full gate.

Forbidden: schema/migration before the UI gate is approved; deferring the mock wiring "for later";
shipping a control that does nothing.

## Mock mechanics (ponytail default)

The repo already has `test/fakes/*`. Do not invent a new mock layer: bind the existing fakes in
`src/server/container.ts` behind a single env flag (`UI_MOCK=1`), or pass plain constant fixtures to
the view layer when no use case exists yet. Types stay real (`domain/models.ts`); only the data
source is fake. Delete the flag's wiring when the backend gate lands.

## Patch 1 — `AGENTS.md`

Insert before `## تعریف «تمام شد»`:

```md
## گیت UI-first (اجباری برای هر فیچر دارای طراحی رابط)

هر فیچری که طراحی یا تغییر رابط کاربری دارد، دو گیت پشت سر هم دارد؛ گیت دوم تا تأیید کتبی انسان شروع نمی‌شود:

1. **گیت UI (دیتای ماک):** کل رابط — همهٔ صفحه‌ها و حالت‌ها (خالی، لودینگ، خطا، موفق)، ریسپانسیو و RTL — با دیتای ماک ساخته می‌شود. در این گیت: بدون نوشتن در دیتابیس، بدون Server Action واقعی، بدون migration و بدون تغییر `prisma/schema.prisma`. مرز لایه‌ها حفظ می‌شود: دیتای ماک از طریق همان port/type قرارداد می‌آید (فیک‌های `test/fakes/*` در `container.ts` پشت یک فلگ مثل `UI_MOCK=1`، یا fixture ثابت برای view). نوع‌ها واقعی‌اند؛ فقط منبع داده جعلی است.
2. **دمو و تأیید انسان:** `pnpm dev`، اسکرین‌شات یا دمو زنده، سپس تأیید صریح انسان روی ظاهر و جریان.
3. **گیت بک‌اند:** پس از تأیید، ماک با پیاده‌سازی واقعی (use case، adapter، action، migration) جایگزین می‌شود؛ سپس تست واحد/یکپارچه/e2e و گیت کامل.

ممنوع: migration یا تغییر schema پیش از تأیید گیت UI؛ «بعداً وصل می‌کنم»؛ تحویل دکمهٔ بی‌عمل.
```

## Patch 2 — `.opencode/agents/mro-implementer.md`

Insert after the front matter, before the existing body:

```md
## Two-gate rule for any UI feature

Read the plan's stage list first. If the plan contains a `Stage UI (mock)` stage, you are in the UI
gate and these are hard limits:

- Do NOT create or edit `prisma/schema.prisma`, `prisma/migrations/**`, or any Server Action that
  persists. Mock data comes from `test/fakes/*` bound in `src/server/container.ts` behind `UI_MOCK=1`,
  or from constant fixtures.
- Cover empty, loading, error and success states, RTL and mobile. No inert control.
- When the UI gate is done, run `pnpm typecheck && pnpm lint && pnpm build` and STOP. Report
  `UI READY FOR DEMO` with the routes to open and the command to start `pnpm dev`.
- Do NOT write backend, migrations, the changelog, or the behavior doc until the caller tells you the
  UI gate is approved (`ui-approved`). The caller owns that switch, not you.
```

## Patch 3 — `.opencode/agents/mro-architect.md`

Append to the plan-format requirements:

```md
## UI features: two-stage plans

If the request designs or changes the interface, the plan MUST have two top-level stages in this
order and nothing else before them:

- `## Stage UI (mock)` — screens, states, components, mock source, and `verify:` criteria that are
  observable in a browser without touching the database.
- `## Stage Backend` — schema, migration, ports, use cases, actions, tests.

Acceptance criteria are split the same way and labelled `[ui]` or `[backend]`. A plan that puts a
migration or schema change before the UI stage is invalid: return it, do not approve it.
State the human demo checkpoint explicitly between the two stages.
```

## Patch 4 — `.opencode/agents/mro-orchestrator.md`

Append a phase pair to the workflow section:

```md
### 2a. UI gate (mock) — only for features with UI work

Launch `mro-implementer` with the plan's `Stage UI (mock)` stage only. It runs typecheck/lint/build
and returns `UI READY FOR DEMO`. You then present: routes, screens, states, the `pnpm dev` command,
and screenshots/demo. STOP and ask the human for approval. Do not launch the backend stage, the
reviewer or the test-runner before that.

Record in the state file: `phase: "ui-mock"`, then `phase: "ui-approved"` with
`approvals.ui` = ISO timestamp. `approvals.ui` is a hard gate: `mro-reviewer` must reject any diff
whose plan has a `Stage UI (mock)` with no `approvals.ui`, and `phase: "blocked"` applies.
```

## Patch 5 — `.opencode/agents/mro-reviewer.md`

Append:

```md
## Two-gate rule

If the plan has a `Stage UI (mock)` stage, check `.opencode/plans/<slug>.orchestrator.json` for
`approvals.ui` before anything else. Missing or null → report CRITICAL "UI gate not approved".

During the UI gate, review UI only: states (empty/loading/error/success), RTL, responsive,
accessibility, no dead controls, no design-token drift, no persistence leaking into the UI stage.
Do not demand backend tests in the UI gate; do demand them once the backend stage is reviewed.
```

## Patch 6 — model pins (unrelated but blocking)

`mro-implementer.md`, `mro-reviewer.md`, `mro-test-runner.md` still pin `9router/nemo`, whose upstream
is in 429 cooldown: every dispatch dies with `all targets were skipped by pre-dispatch filters`.
Change all three to `9router/deep`, then restart the session so the agent configs reload.
