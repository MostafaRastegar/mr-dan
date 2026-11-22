# mr-dan

پلتفرم مشاورهٔ تحصیلی هوشمند.

- پلن معماری، فازها و اسکیل‌ها: [`docs/plan/`](./docs/plan/README.md)
- مخزن مرجع (oracle): [`mr-rag`](https://github.com/MostafaRastegar/mr-rag) — کلون محلی در `./mr-rag`، git-ignored

## اجرا

```bash
corepack enable pnpm
pnpm install
cp .env.example .env          # OPENROUTER_API_KEY را پر کن
docker compose up -d          # postgres + chroma
pnpm prisma generate && pnpm prisma migrate dev
pnpm dev                      # http://localhost:3000
```

بررسی سلامت:

```bash
curl localhost:3000/api/health
# {"status":"ok","dependencies":{"postgres":"ok","chroma":"ok"}, ...}
```

## دستورها

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

- lint با `oxlint` است؛ `typescript-eslint` هنوز از TypeScript 7 پشتیبانی نمی‌کند.
- تست معماری (`test/architecture.test.ts`) قواعد لایه‌ها را enforce می‌کند.

## پورت‌ها

| سرویس | پورت |
|---|---|
| app | 3000 |
| postgres | 5432 |
| chroma (این پروژه) | 8001 |
| chroma (oracle) | 8000 |

## وضعیت

فاز ۰ (اسکلت) کامل است. فاز بعد: ingestion + dense retrieval. جزئیات در [`docs/plan/phases.md`](./docs/plan/phases.md).
