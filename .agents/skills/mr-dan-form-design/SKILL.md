---
name: mr-dan-form-design
description: Ant Design 6 form pattern for mr-dan: triad layout, Server Action bridge, zod validation, RTL layout, empty/loading/error states, and data-testid registry
---

# mr-dan-form-design

## Usage

Use when creating or repairing any form (profile, profile-related card, modal, or settings). This skill replaces ad-hoc form wiring with one repeatable template so forms never regress into the pattern that caused the `schoolMode`/`needId` write bug.

## Pinned stack

```text
next 16.4.6 · react 19.3.1 · typescript 7.0.2 · tailwindcss 4.3.5
antd 6.7.1 · @ant-design/nextjs-registry 1.3.0 · zod 4
```

## Required triad per form area

Every route folder that renders an interactive form holds these files side by side under `src/app/**`:

| File | Responsibility | Constraint |
|------|----------------|------------|
| `page.tsx` | async Server Component: guard + data from use case + props | Never `"use client"`; ≤40 lines; never imports Prisma or a repository |
| `<x>.vm.tsx` | `"use client"`: hooks only (`Form.useForm`, `useFormAction`, `useServerFormErrors`, `useState`/`useEffect`) | Exports `<Thing>Wrapper`; owns no markup logic |
| `<x>.view.tsx` | markup only, props in, no hooks, no fetching | Exports `<Thing>View` |
| `_components/` | route-private sub-forms/modals | each keeps its own `.vm.tsx`/`.view.tsx` pair |
| `<area>.actions.ts` | `"use server"` mutations for the area | Signature `(previous, formData)`; parses with zod inside |

A `"use client"` file over 80 lines must be a `.vm.tsx` with a sibling `.view.tsx`; the view owns no hooks. `test/architecture.test.ts` enforces this for `src/app/**` and `src/components/**`.

## The one client bridge

Import only from `src/utils/use-form-action.ts`:

```tsx
import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
```

- `useFormAction(action)` returns `{ state, submit, pending }`.
- `submit(values)` turns the `onFinish` values into `FormData` and dispatches to `useActionState` inside `startTransition`.
- `useServerFormErrors(state, form)` is called **unconditionally**, next to `Form.useForm`. It pushes `error.fieldErrors` onto fields via `form.setFields` and returns the global message. Never write manual field-error mapping in a component.
- `toFormData` drops `undefined`/`null` and coerces everything else to `String`. Select `allowClear` yields `undefined` → dropped. That is correct for optional fields.

### Template (copy exactly)

```tsx
// page.tsx  (server, ≤40 lines)
import { ProfileFormWrapper } from "./profile-form.vm";
import { getContainer } from "@/server/container";
import { requireSessionUser } from "@/server/advising-guards";
import { redirect } from "next/navigation";

export const metadata = { title: "پروفایل — mr-dan" };

export default async function ProfilePage() {
  const { user } = await requireSessionUser();
  const actor = { id: user.id, role: user.role };
  const [profile, studyProfile] = await Promise.all([
    getContainer().advising.getProfile.execute({ userId: user.id }),
    getContainer().advising.getStudyProfile.execute({ actor }),
  ]);
  if (!profile) redirect("/login");
  return <ProfileFormWrapper profile={profile} studyProfile={studyProfile} />;
}
```

```tsx
// <x>.vm.tsx  (client)
"use client";

import { useEffect } from "react";
import { Form } from "antd";
import { useRouter } from "next/navigation";

import { useFormAction, useServerFormErrors } from "@/utils/use-form-action";
import { updateStudyProfileAction } from "../study-profile.actions";
import { StudyProfileFormView } from "./study-profile-form.view";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";

function minutesToHHMM(minutes: number | null): string {
  if (minutes === null) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function StudyProfileFormWrapper({
  profile,
  studyProfile,
}: {
  profile: ProfileView;
  studyProfile: StudyProfileView;
}) {
  const [form] = Form.useForm();
  const router = useRouter();

  const initialValues = {
    fullName: profile.fullName,
    email: profile.email ?? undefined,
    grade: profile.grade ?? undefined,
    fieldOfStudy: profile.fieldOfStudy ?? undefined,
    schoolName: profile.schoolName ?? undefined,
    sleepTime: minutesToHHMM(profile.sleepMinutes),
    wakeTime: minutesToHHMM(profile.wakeMinutes),
    schoolMode: profile.schoolMode ?? undefined,
    needId: profile.needId ?? undefined,
  };

  const { state, submit, pending } = useFormAction(updateStudyProfileAction);
  const formError = useServerFormErrors(state, form);

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
  }, [state, router]);

  return (
    <StudyProfileFormView
      form={form}
      state={state}
      submit={submit}
      pending={pending}
      formError={formError}
      initialValues={initialValues as Record<string, unknown>}
      profile={profile}
      studyProfile={studyProfile}
    />
  );
}
```

**Critical:** every field that the Server Action reads must appear in `initialValues` even when the value is null/undefined. If `schoolMode` or `needId` is missing here, antd never includes them in `onFinish` values, the action receives `undefined`, and the database row stays null. This was the exact cause of the profile fields showing empty after refresh.

## View markup

```tsx
// <x>.view.tsx  (markup only)
import type { ReactNode } from "react";
import { Button, Form, Input, Select, type FormInstance } from "antd";

import type { ActionState } from "@/utils/app-error";
import type { FormValues } from "@/utils/use-form-action";
import { FIELDS, GRADES, type ProfileView } from "@/modules/advising/domain/models";
import { TEST_IDS } from "@/constants/test-ids";
import type { StudyProfileView } from "@/modules/advising/application/study-profile";

interface StudyProfileFormViewProps {
  form: FormInstance;
  state: ActionState<unknown> | null;
  submit: (values: FormValues) => void;
  pending: boolean;
  formError: string | null;
  initialValues: Record<string, unknown>;
  profile: ProfileView;
  studyProfile: StudyProfileView;
}

export function StudyProfileFormView(props: StudyProfileFormViewProps): ReactNode {
  const { form, state, submit, pending, formError, initialValues, profile, studyProfile } = props;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">پروفایل</h1>
        <p className="text-sm text-slate-600" dir="ltr">{profile.username}</p>
      </div>

      <Form
        form={form}
        layout="vertical"
        requiredMark={false}
        onFinish={submit}
        data-testid={TEST_IDS.PROFILE.FORM}
        initialValues={initialValues}
      >
        {/* all Form.Item/Field pairs below */}
        {formError ? <p role="alert">{formError}</p> : null}
        {state?.ok ? <p role="status">ذخیره شد.</p> : null}

        <Button type="primary" htmlType="submit" loading={pending}>
          ذخیره
        </Button>
      </Form>
    </div>
  );
}
```

Hard rules:

1. Submit only through `onFinish={submit}` and a `htmlType="submit"` button. Never `onClick` to submit, never a hand-written `<form action>` next to `Form`.
2. A `Select` inside `Form.Item` works because the value comes from form state; no `<input type="hidden">` is needed. A bare `Select` outside `Form.Item` is forbidden.
3. After success: `form.resetFields()` (or only sensitive fields such as passwords) and `router.refresh()` when a list/table must update. Do this in a `useEffect` on `state?.ok`, never inside `onFinish`.
4. Client `rules` are UX only; real validation and the final message come from the server-side zod schema. Client rules must not diverge semantically from the server schema.
5. The global form error uses `role="alert"`, the success message uses `role="status"`. Both are Persian and free of internal detail.
6. Every interactive element gets a stable `data-testid` from `src/constants/test-ids.ts`: `form-input-<name>`, `form-select-<name>`, `form-submit-<action>`, `form-item-<name>`. Add a new name to that registry; never use scattered strings.

## Server Action contract

File: `src/app/(advising)/profile/study-profile.actions.ts`

```ts
"use server";

import { redirect } from "next/navigation";
import { studyProfileSchema } from "@/modules/advising/presentation/advisor-schemas";
import { runAction } from "@/utils/server-action";
import type { ActionState } from "@/utils/app-error";
import { getSessionContext } from "@/server/advising-guards";
import { getContainer } from "@/server/container";

export async function updateStudyProfileAction(
  _previous: ActionState<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionState<{ userId: string }>> {
  const session = await getSessionContext();
  if (!session) redirect("/login");

  return runAction(async () => {
    const values = studyProfileSchema.parse(Object.fromEntries(formData));
    const actor = { id: session.user.id, role: session.user.role };

    await getContainer().advising.updateStudyProfile.execute({
      actor,
      schoolMode: values.schoolMode ?? undefined,
      needId: values.needId ?? undefined,
      takesMockExams: values.takesMockExams ?? undefined,
      otherOccupiedHours: [
        values.otherOccupied0 ?? 0,
        values.otherOccupied1 ?? 0,
        values.otherOccupied2 ?? 0,
        values.otherOccupied3 ?? 0,
        values.otherOccupied4 ?? 0,
        values.otherOccupied5 ?? 0,
        values.otherOccupied6 ?? 0,
      ],
      homeworkAverageHours: values.homeworkAverageHours ?? undefined,
    });

    return { userId: session.user.id };
  });
}
```

- `redirect()` is called outside `runAction`.
- The action parses with zod itself; the component never passes values to a use case.
- `revalidatePath`/`revalidateTag` inside a Server Action is banned. Use `router.refresh()` after success instead.

## Presentation schema

File: `src/modules/advising/presentation/advisor-schemas.ts`

Every optional field must be `.optional()` (not `.nullable()`) so `undefined` from `allowClear` does not fail validation. Every field used by the action must exist in the schema.

```ts
export const studyProfileSchema = z.object({
  schoolMode: schoolModeSchema.optional(),
  needId: z.string().trim().optional(),
  takesMockExams: z.string().optional().transform((value) => value === "true"),
  otherOccupied0: occupiedHourField(),
  // ... otherOccupied1..6
  homeworkAverageHours: z.coerce.number().optional().refine(...),
});
```

## Empty / loading / error states

Every list/table/card must have all three:
- Empty: `<Empty description="هیچ داده‌ای ثبت نشده است" />` or Persian text.
- Pending: `loading` on the submit button (`loading={pending}`).
- Error: `role="alert"` message from `useServerFormErrors`.

Missing empty/loading/error means the work is not done.

## RTL and digits

- `dir="rtl"` on `<html>` + `ConfigProvider direction="rtl"` + `locale={faIR}` are global; a new page must not override them.
- Latin inputs (`username`, `email`, passwords) carry `dir="ltr"`.
- All labels, errors, and success messages are Persian.

## Icons and testids

- Only `@tabler/icons-react`; importing `@ant-design/icons` is forbidden.
- `data-testid` from `src/constants/test-ids.ts` only. `input[name=…]` is not used.

## Checklist

- [ ] `page.tsx` ≤40 lines, server-only, guard + data + one wrapper.
- [ ] `.vm.tsx` owns hooks only; `.view.tsx` owns markup only.
- [ ] Every action-read field is present in `initialValues` (even null/undefined).
- [ ] `submit` is wired to `onFinish`; `useServerFormErrors` is unconditional.
- [ ] `pending` visible on submit button.
- [ ] Empty/loading/error exists for every card/list.
- [ ] `router.refresh()` on `state?.ok` in `useEffect`, never `router.push` in submit.
- [ ] Stable `data-testid` from the registry.
- [ ] No `revalidatePath`, no manual toast, no `fetch` in a component.
- [ ] `pnpm typecheck`, `pnpm lint`, and `pnpm test` all pass.

## Anti-patterns

- A native `<form action={…}>` next to antd `Form` (two submit paths, undefined behavior).
- Submitting with `onClick` or `router.push` inside `onFinish`.
- Manual `fieldErrors` mapping with a duplicated `useEffect` in every form instead of the bridge.
- `useEffect` for initial data; server state in the client; a store library.
- `disabled` instead of removing an unauthorized control; scattered role checks in components.
- Hard-coded `initialValues` omitting fields the action reads (the `schoolMode`/`needId` bug).
