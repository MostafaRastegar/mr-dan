# Oracle: mr-rag

کلون محلی سیستم قبلی، فقط برای مقایسهٔ رفتار و اعداد parity.

| | |
|---|---|
| مخزن | `https://github.com/MostafaRastegar/mr-rag` |
| commit | `e64febbeb17c016b638112e8c11ae980404be9ee` |
| تاریخ clone | 2026-11-22 |
| مسیر | `./mr-rag` |
| وضعیت git | در `.gitignore`؛ کامیت نمی‌شود |

## قواعد

- oracle هرگز از کد `mr-dan` import یا در runtime فراخوانی نمی‌شود.
- تنها مصرف‌کننده‌ها: `scripts/eval-retrieval.ts`, `scripts/compare-*.ts` و اجرای دستی.
- کلید OpenRouter در `mr-rag/.env` (git-ignored) نگه داشته می‌شود؛ کلید را در ریپوی اصلی نگذار.
- تغییر دادن کد oracle برای «هم‌راستا کردن» نتایج ممنوع است؛ اگر oracle باید تغییر کند، دلیلش باید در `docs/plan/parity.md` ثبت شود.

## اجرا

```bash
cd mr-rag
docker compose up -d chromadb
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8080

# ارزیابی پایه
python -m scripts.eval_retrieval --mode dense
python -m scripts.eval_retrieval --mode hybrid
```

اعداد پایه در `mr-rag/data/eval_retrieval_last.json` و خلاصهٔ آن در `docs/plan/parity.md` است.
