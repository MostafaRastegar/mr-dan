---
name: mro-project-stack
description: "Project tech stack and conventions. Load before designing or implementing any feature."
---

# Project Stack

## Recorded facts

- Framework: Next.js 16.4.6 (App Router), React 19.3.1
- Language: TypeScript 7.0.2, strict (`tsc --noEmit`); no `any`
- Database / ORM: PostgreSQL 16 + Prisma 7.10.1 (`@prisma/adapter-pg`; client
  generated into `src/generated/prisma`); Chroma vector store on port 8001
- Styling / UI: Ant Design 6.7.1 + `@ant-design/nextjs-registry`, Tailwind CSS
  4.3.5; Persian RTL (`<html lang="fa" dir="rtl">`)
- Auth: custom session cookies. scrypt password hashes
  (`scrypt$N$r$p$salt$hash`, N=16384), sha256 token hash in `Session`, httpOnly
  cookie; guards in `src/server/advising-guards.ts`; roles `student` |
  `counselor` | `admin`
- Package manager: pnpm (`pnpm-lock.yaml`)

## Conventions

- Modules live in `src/modules/<module>/{domain,application,infrastructure,presentation}`
  (existing modules: `rag`, `advising`).
- Server code: composition root `src/server/container.ts` (only place that wires
  adapters to ports); thin `src/app/**/route.ts` handlers
  (`parse → use case → serialize`, max 40 lines); Server Actions in
  `src/app/**/<area>.actions.ts` with `'use server'`.
- Pages use the triad `page.tsx` + `<x>.vm.tsx` + `<x>.view.tsx` side by side;
  route-private components in `_components/`.
- Naming: English, domain-oriented (`ingestDocument`, not `processData`); one
  file = one responsibility; functions over 40 lines are a smell.
- Errors: `AppError` subclasses in `src/utils/app-error.ts`; adapters wrap
  library errors and keep `cause`.
- Action checkpoints: `src/utils/app-error.ts`, `src/utils/server-action.ts`,
  `src/utils/use-form-action.ts` are the only mutation path and form bridge.

## Forbidden

- `any`; domain importing anything external; `application` importing
  `infrastructure`; `infrastructure` importing `application`; domain logic inside
  `route.ts` or React components.
- Direct Prisma/Chroma calls from endpoints; DI frameworks; `BaseRepository`;
  speculative abstractions.
- pgvector, Redis, BullMQ, scheduler, scraper (this phase).
- `npm install prisma@latest`; unapproved dependency or version bumps.

## Deep skills

Architecture: `mr-dan-architecture` · API: `mr-dan-api` · UI: `mr-dan-frontend`
· frontend bugs: `mr-dan-frontend-debugging` · Prisma: `mr-dan-persistence` ·
ingestion: `mr-dan-ingestion` · retrieval: `mr-dan-rag` · tests/parity:
`mr-dan-testing-parity` · env/docker/CI: `mr-dan-devops` · new feature:
`mr-dan-feature-workflow`.
