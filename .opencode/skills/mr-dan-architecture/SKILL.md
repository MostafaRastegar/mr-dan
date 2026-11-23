---
name: mr-dan-architecture
description: Layer boundaries, composition root, domain ports, Server Actions, and error mapping for the mr-dan Next.js monolith
---

# mr-dan-architecture

## Usage

Use when adding a module, moving code between layers, defining a new port, or deciding where a file belongs.

## Rules

1. Dependency direction: `app → presentation → application → domain` and `infrastructure → domain`.
2. `domain` imports nothing external: no `zod`, `@prisma/client`, `next`, `langchain`.
3. `application` imports only ports and models; never a concrete adapter.
4. `presentation` imports only zod, domain types and application use cases.
5. `route.ts` stays thin and holds no domain logic.
6. The only composition root is `src/server/container.ts`.
7. Every port has at least one real adapter and one test fake; a port without either is a dead abstraction.
8. Domain errors use `AppError` and its subclasses; adapters wrap library errors and keep `cause`.

## Layer map

| Folder | Responsibility | May import |
|---|---|---|
| `modules/<name>/domain` | models, ports, errors, capabilities | TS stdlib only |
| `modules/<name>/application` | use cases | domain |
| `modules/<name>/infrastructure` | Chroma, OpenRouter, Prisma, loaders, cache | domain + libraries |
| `modules/<name>/presentation` | zod schemas, DTOs, error→HTTP/action mapping | domain, application, zod |
| `app/api/**` | HTTP wiring | presentation, server/container |
| `app/**/page.tsx`, `app/**/*.vm.tsx`, `app/**/*.view.tsx`, `app/**/_components/**` | RSC shell, client state, route-private kit | presentation, server/container, utils, domain models |
| `app/**/*.actions.ts` | Server Actions | application (via server/container), presentation/schemas, utils |
| `src/server` | guards, container | application, infrastructure |
| `utils` | the three choke points | react/antd types, presentation error mapping |
| `shared` | env, logger, prisma client | libraries |

## Steps — adding a feature

1. Add the model/contract in `domain` (if it is a domain concept).
2. If it needs the outside world, define a port in `domain/ports.ts`.
3. Write the use case in `application`, depending only on ports.
4. Implement the adapter in `infrastructure`.
5. Wire it in `container.ts`.
6. Put input/output schemas in `presentation/schemas.ts`.
7. Add the thin route handler (HTTP) or the Server Action (in-app mutation).
8. Tests: unit for the use case with a fake, integration for the adapter.

## Flow (one direction, no layer skips)

```text
view (RSC page / client form)
→ Server Action  ('use server', src/app/**/<area>.actions.ts)
→ Use case        (application/, authorize + validate)
→ Port            (domain/ports.ts)
→ Adapter         (infrastructure/, Prisma/crypto)
```

- A React component never imports Prisma, an adapter, or a use case directly; only a Server Action.
- A use case never receives `Request`/`FormData`/cookies; it takes typed input and makes the domain decision.
- The adapter is the only place where a library is called; it wraps the library error and preserves `cause`.

## The three choke points

| Choke point | Our file | Rule |
|---|---|---|
| Action result | `src/utils/app-error.ts` — `ActionError` + `ActionState<T>` (`{ok:true,data} \| {ok:false,error}`) | Success is `ok` only; never `data !== null`. Type-only module: import with `import type`, nothing ships to the client |
| Action execution | `src/utils/server-action.ts` — `runAction(fn)` | The only way to write an action; no revalidate parameter, and this file carries no `'use server'` (it is imported *by* a `'use server'` module) |
| Form bridge | `src/utils/use-form-action.ts` — `useFormAction` + `useServerFormErrors` | antd `Form onFinish` → `FormData` → `useActionState`; maps `fieldErrors` via `form.setFields` |

## Module triad

| Piece | Location |
|---|---|
| DTO / contract | `domain/models.ts` + `domain/ports.ts` |
| use case (server-only, returns domain errors) | `application/*.ts` |
| Server Action (`'use server'`) | `src/app/**/<area>.actions.ts`, colocated with the area; wraps the use case through `runAction` |

## Page triad

Every route folder that renders an interactive client component holds these files side by side
under `src/app/**`:

- `page.tsx` — async server component: guard + data from a use case + props. Never `"use client"`,
  ≤40 lines.
- `<x>.vm.tsx` — `'use client'`: hooks only (`Form.useForm`, `useFormAction`,
  `useServerFormErrors`, `useState`/`useEffect`). Exports `<Thing>Wrapper`.
- `<x>.view.tsx` — markup only, props in, no hooks, no fetching. Exports `<Thing>View`.
- `_components/` — components private to the route (sub-forms, modals), each keeping its own
  `.vm.tsx`/`.view.tsx` pair.
- `<area>.actions.ts` — `'use server'` mutations for the area.

The page body markup lives in the view; `page.tsx` stays guard + data + one wrapper. Success is
driven by `state?.ok`; never `router.push` inside a submit handler.

## Actions

- `src/app/(auth)/auth.actions.ts` — `registerAction`, `loginAction`.
- `src/app/(advising)/advising.actions.ts` — `logoutAction`, `updateProfileAction`.
- `src/app/(advising)/counselor/students/students.actions.ts` — `createGroupAction`, `assignStudentAction`.
- Signature `(previous: ActionState<T> | null, formData: FormData) => Promise<ActionState<T>>`,
  body `runAction(async () => …)`. `redirect()` outside `runAction`. A `'use server'` module exports
  async functions only.

## Where each piece lives

| Piece | Location |
|---|---|
| Server Action (`"use server"`) | `src/app/**/<area>.actions.ts`, colocated with the area |
| Session/role guard | `src/server/<name>-guards.ts` + server layout |
| capability map | `src/modules/<name>/domain/capabilities.ts` |
| `runAction` / error mapping | `src/utils/server-action.ts` + `src/modules/<name>/presentation/messages.ts` |
| Action result type | `src/utils/app-error.ts` |
| Cookie/session helper | `src/modules/<name>/presentation/{cookie,session-cookie}.ts` |
| Client form bridge | `src/utils/use-form-action.ts` |
| Route-private components | `src/app/**/_components/` |
| `data-testid` registry | `src/constants/test-ids.ts` |
| Shared React kit | `src/components/providers.tsx` only — no shared component kit; a fork of AntD is forbidden |

## Container rules

- Lazy: nothing is constructed until first use.
- Cached on `globalThis` in dev so HMR does not multiply connections.
- No factory inside a route.
- Adapters are singletons unless there is an explicit reason.

## Result contract and the revalidatePath rule

- Success is `state?.ok === true` only (initial state is `null`). No `{ status: ... }` shape exists.
- `revalidatePath`/`revalidateTag` inside a Server Action is banned: the page remounts inside the action response and `useActionState` resets (vercel/next.js#66426). Use `router.refresh()` after success instead.

## Persian / RTL

- `dir="rtl"` + `ConfigProvider direction="rtl"` + `locale={faIR}` are global; there is no locale route.
- Error messages are Persian and free of internal details; Persian digits are normalized to ASCII only for `username`/`email`.

## Checklist

- [ ] `pnpm lint` and `test/architecture.test.ts` report no layer violation.
- [ ] No circular imports.
- [ ] Routes stay under 40 lines.
- [ ] A new port has a test fake.
- [ ] Errors map to `AppError`; no internal detail leaks.

## Anti-patterns

- `BaseRepository<T>` or any generic layer nobody uses.
- Injecting the Prisma client into `application`.
- `container.ts` that constructs everything eagerly.
- Taking `Request` inside a use case.
- Repeating the same try/catch in every route.
