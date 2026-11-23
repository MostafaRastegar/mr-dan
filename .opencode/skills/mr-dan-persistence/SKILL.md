---
name: mr-dan-persistence
description: Prisma 7 schema, repositories, transactions, and Postgres ownership rules for mr-dan
---

# mr-dan-persistence

## Usage

Use when changing the schema, writing a repository, creating a migration, or deciding whether data belongs in Postgres or Chroma.

## Ownership

| Data | Store |
|---|---|
| chunk text + embedding + metadata | Chroma |
| document record | Postgres |
| conversation + messages | Postgres |
| ingestion run | Postgres |
| cache (optional, durable) | Postgres |
| statistics | computed |

## Schema (initial)

```prisma
model Document {
  id               String   @id            // uuid
  filename         String
  originalFilename String
  sourcePath       String
  fileType         String                  // json | md | txt | pdf
  contentHash      String   @unique
  chunkCount       Int
  ingestedAt       DateTime @default(now())
  updatedAt        DateTime @updatedAt
  runs             IngestionRun[]
}

model IngestionRun {
  id          String   @id @default(uuid())
  documentId  String?
  document    Document? @relation(fields: [documentId], references: [id], onDelete: SetNull)
  status      String                      // started | succeeded | failed
  chunkCount  Int      @default(0)
  error       String?
  startedAt   DateTime @default(now())
  finishedAt  DateTime?
}

model Conversation {
  id        String    @id @default(uuid())
  title     String
  messages  Message[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  role           String   // user | assistant | system
  content        String
  sources        Json?
  createdAt      DateTime @default(now())
  @@index([conversationId, createdAt])
}

model CacheEntry {
  key       String   @id
  value     Json
  expiresAt DateTime
  createdAt DateTime @default(now())
  @@index([expiresAt])
}
```

- `Document.ownerId` and `visibility` are deliberately absent; the product phase adds them with a migration.
- `contentHash` is unique; duplicate ingestion is blocked at the DB level too.

## Rules

1. `domain` never imports `@prisma/client`; the repository maps rows to domain models.
2. Every repository has an interface in `domain/ports.ts`.
3. Queries live in `infrastructure/prisma/`, not in a use case.
4. Multi-table operations run in `prisma.$transaction`.
5. `select` is explicit; `findMany()` without a select is banned.
6. Deleting a document: Chroma first, Postgres second. If Postgres fails, ingestion rebuilds the document.
7. Migrations are committed; `db push` in production is banned.
8. Dates are `DateTime`; the API exposes ISO strings.
9. Pagination uses explicit `take`/`skip` and `orderBy`.

## Steps — adding a repository

1. Declare the interface in `domain/ports.ts`.
2. Implement it in `infrastructure/prisma/`.
3. Map rows → domain models (never return raw Prisma types).
4. Add a fake in `test/fakes/`.
5. Add an integration test against real Postgres for non-trivial queries.

## Prisma 7 adapter notes

- Unique violations surface at `meta.driverAdapterError.cause.constraint.index`, not `meta.target`. Map that field when translating to a domain error.
- Errors are wrapped in an adapter error; the original is kept as `cause`.
- `select` explicit, no `include` shortcuts.

## Checklist

- [ ] `pnpm prisma migrate dev` reports no drift.
- [ ] No Prisma type reaches `application` as `any`.
- [ ] Deleting a conversation cascades to its messages.
- [ ] `select` is explicit.
- [ ] Heavy queries have an index.
- [ ] Integration uses testcontainers or compose.

## Anti-patterns

- Prisma client in `application` or `presentation`.
- `include` of everything instead of `select`.
- Storing embeddings in Postgres in this phase.
- Hand-written SQL migration without revisiting the schema.
- `findFirst` without `orderBy` for "latest".
