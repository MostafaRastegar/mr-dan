---
name: mr-dan-persistence
description: Prisma 7 schema, repositories, transactions, and Postgres ownership rules for mr-dan
---

# mr-dan-persistence

## Usage

هنگام تغییر schema، نوشتن repository، migration، یا تصمیم دربارهٔ اینکه داده در Postgres بماند یا Chroma.

## Ownership

| داده | محل |
|---|---|
| chunk text + embedding + metadata | Chroma |
| document record | Postgres |
| conversation + messages | Postgres |
| ingestion run | Postgres |
| cache (اختیاری، پایدار) | Postgres |
| آمار | محاسبه |

## Schema (اولیه)

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

- `Document.ownerId` و `visibility` عمداً نیستند؛ فاز محصول با migration اضافه می‌کند.
- `contentHash` یکتاست؛ ingestion تکراری در سطح DB هم بسته می‌شود.

## Rules

1. `domain` هرگز `@prisma/client` را import نمی‌کند؛ repository خروجی را به model دامنه map می‌کند.
2. هر repository یک interface در `domain/ports.ts` دارد.
3. queryها در `infrastructure/prisma/` هستند، نه در use case.
4. عملیات چندجدولی در `prisma.$transaction`.
5. `select` صریح؛ `findMany()` بدون select ممنوع.
6. حذف سند: Chroma اول، Postgres دوم. اگر Postgres شکست خورد، ingestion دوباره سند را می‌سازد.
7. migrationها commit می‌شوند؛ `db push` در production ممنوع.
8. تاریخ‌ها `DateTime`؛ در API ISO string.
9. صفحه‌بندی با `take/skip` و `orderBy` صریح.

## Steps — افزودن repository

1. interface را در `domain/ports.ts`.
2. پیاده‌سازی در `infrastructure/prisma/`.
3. map کردن row → domain model (بدون return خام Prisma).
4. fake در `test/fakes/`.
5. integration test با Postgres واقعی برای کوئری‌های غیرساده.

## Checklist

- [ ] `pnpm prisma migrate dev` بدون drift.
- [ ] هیچ `any` از نوع Prisma به application نمی‌رسد.
- [ ] حذف conversation پیام‌ها را cascade می‌کند.
- [ ] `select` صریح است.
- [ ] query سنگین index دارد.
- [ ] testcontainers یا compose برای integration.

## Anti-patterns

- Prisma client در `application` یا `presentation`.
- `include` همه‌چیز به‌جای select.
- ذخیرهٔ embedding در Postgres در این فاز.
- migration دستی SQL بدون revisiting schema.
- `findFirst` بدون `orderBy` برای «آخرین».
