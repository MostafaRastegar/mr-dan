---
name: mro-data-model
description: "Data model and query rules. Load when designing queries, mutations, or schema changes."
---

# Data Model

Authoritative source: `prisma/schema.prisma` (migrations in `prisma/migrations/`).
Read it before writing any query. Vector data lives in Chroma (text + embedding +
metadata), relational data in PostgreSQL.

## Entities

- `Document` — RAG corpus, admin-owned. `contentHash` unique (dedupe); no soft
  delete (hard delete, Chroma first then Postgres).
- `IngestionRun` — audit log, `status` started | succeeded | failed; nullable
  `documentId` (`onDelete: SetNull`).
- `Conversation` — chat thread, per-user. No soft delete; messages cascade.
- `Message` — belongs to `Conversation` (cascade); `role` user | assistant |
  system; `sources` JSON.
- `CacheEntry` — semantic/LLM cache keyed by `key`; TTL via `expiresAt`.
- `User` — advising account, self-owned; `role` student | counselor | admin
  (zod-validated string, not a PG enum); no soft delete.
- `Session` — login session; `tokenHash` unique (sha256); expires via
  `expiresAt`; cascades on user delete.
- `Group` — counselor-owned (`counselorId` cascade); students join via
  `User.groupId`.
- `WeeklySchedule` — student-owned, cascade; unique (student, day, startMinute).
- `Homework` — student-owned, cascade; `completedAt` null = pending;
  `priority` 3/2/1.
- `FreeTimeBudget` — student-owned per Iran day; unique (student, dayKey).
- `HomeworkPlanEntry` — belongs to a `FreeTimeBudget` (composite FK student+day)
  and a `Homework`; cascade.
- `MealPlan` — student-owned per Iran day; unique (student, dayKey).
- `WeeklyGoal` — student-owned per Iran week; unique (student, weekKey).
- `StudyPlan` — one per student (`studentId` unique), created by `counselorId`.
- `StudyPlanEntry` — belongs to `StudyPlan` via `studentId`; cascade.
- `SchoolProgramEntry` — student-owned; unique (student, day, subject).
- `StudentExamResult` — student-owned; unique (student, exam); cascade.
- `TestRecord` — student-owned test counts; unique (student, subject, weekKey).
- `SupplementaryCourse` — student-owned; cascade.
- `Need`, `Exam`, `Chapter` — reference catalogs, seeded; `active` flag = soft
  retirement (filter `active` in listing queries).
- `Chapter` — unique (subject, field, grade, number).

## Rules

- No soft-delete column anywhere: filter by `active` (catalogs), `status`
  (runs), `completedAt`, or `expiresAt` instead.
- Read the schema first; never invent a field or relation.
- Select only needed columns; batch or join to avoid N+1.
- Every mutation re-checks the session and ownership server-side (see
  `src/server/advising-guards.ts`).
- Day/week keys are Iran-local strings: `dayKey` = `YYYY-MM-DD` (UTC+03:30),
  `weekKey` = Saturday of the Iran week.
- Schema changes: add a migration; never edit an applied one. Do not touch
  `prisma/schema.prisma` before the UI gate is approved.
- Unknown behavior is a question for the human, not a guess.
