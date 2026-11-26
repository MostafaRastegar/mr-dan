# Backup and Restore

This guide explains how to move a running **mr-dan** instance to a new
machine (or a fresh container) without losing data.

mr-dan stores data in two places:

- **Postgres** — users, counselors, groups, schedules, homework, study
  plans, catalogs, runs, caches.
- **Chroma** — RAG document chunks and their embeddings.

Both must be backed up if you want the new environment to behave exactly
like the old one. The Postgres dump is the essential part; the Chroma
backup is only needed if you use the RAG features.

## Prerequisites

On the **source** machine:

- Docker Compose services running (`docker compose up -d`).
- `pnpm` installed (the scripts call `pnpm prisma migrate deploy` and
  `pnpm tsx`).
- Enough disk space for the dump (a few MB for a dev DB).

On the **target** machine:

- Docker and Docker Compose.
- Node.js + pnpm.
- A copy of this repository.
- The backup files produced below.
- Your `.env` file (secrets are **not** in the dump — copy it
  separately, never commit it).

## 1. Back up the Postgres database

```bash
pnpm db:backup
```

This runs `pg_dump` against the compose `postgres` service and writes a
gzipped SQL file to `./backups/mr-dan-YYYYMMDD-HHMMSS.sql.gz`.

Options:

```bash
BACKUP_DIR=/mnt/backup pnpm db:backup        # change output directory
BACKUP_FILE=/mnt/backup/prod.sql.gz pnpm db:backup   # exact file name
```

If the compose service is not running, the script falls back to
`DATABASE_URL` (host-installed Postgres).

Verify the file is non-empty:

```bash
ls -lh backups/
```

## 2. (Optional) Back up Chroma

Only needed if you have ingested documents for RAG.

```bash
pnpm chroma:backup
```

Writes `./backups/chroma-YYYYMMDD-HHMMSS.tar.gz`.

## 3. Transfer the files

Copy to the target machine:

- `backups/mr-dan-*.sql.gz`
- `backups/chroma-*.tar.gz` (optional)
- your `.env` (secrets)
- the repository itself (or a fresh clone + your local changes)

Do **not** copy the `postgres-data` / `chroma-data` Docker volumes
directly — use the dump/restore flow below so the schema stays correct.

## 4. Start the infrastructure on the target

```bash
docker compose up -d
```

Wait for both healthchecks to pass:

```bash
docker compose ps
```

## 5. Restore the Postgres database

```bash
pnpm db:restore backups/mr-dan-YYYYMMDD-HHMMSS.sql.gz
```

The script:

1. Loads the dump into the `postgres` service (or `DATABASE_URL`).
2. Runs `pnpm prisma migrate deploy` so any pending migrations are
   applied (idempotent).
3. With `SEED=1`, also re-runs the idempotent catalog seed.

```bash
SEED=1 pnpm db:restore backups/mr-dan-YYYYMMDD-HHMMSS.sql.gz
```

## 6. (Optional) Restore Chroma

```bash
pnpm chroma:restore backups/chroma-YYYYMMDD-HHMMSS.tar.gz
```

This stops Chroma, clears its volume, extracts the archive, and starts
Chroma again.

## 7. Start the application

```bash
pnpm install
pnpm build
pnpm start
```

Or for development:

```bash
pnpm dev
```

## 8. Verify

- Open `http://localhost:3000` and log in with a user from the old DB.
- `/admin/catalog/subjects` should show the restored subjects.
- If you use RAG, run a query and confirm retrieved sources match.

## Notes and caveats

- The dump uses `--clean --if-exists`, so restoring into a database that
  already has data drops and recreates the tables. Restore only into a
  database you are willing to overwrite.
- Schema changes between versions: if the target code is newer than the
  source, `prisma migrate deploy` upgrades the schema; if older, restore
  into matching code first.
- The Chroma collection name and embedding model must match the source
  (`EMBEDDING_MODEL` in `.env`). Restoring chunks embedded with a
  different model produces wrong retrieval.
- Never commit `.env`, backup files, or the `backups/` directory. The
  repository's `.gitignore` should already exclude them; check before
  pushing.
- For scheduled backups, wrap `pnpm db:backup` (and optionally
  `pnpm chroma:backup`) in cron or your CI.

## Quick reference

| Task | Command |
|---|---|
| Back up Postgres | `pnpm db:backup` |
| Restore Postgres | `pnpm db:restore <file>` |
| Back up Chroma | `pnpm chroma:backup` |
| Restore Chroma | `pnpm chroma:restore <file>` |
EOF