#!/usr/bin/env bash
# Restore a mr-dan Postgres dump produced by backup-db.sh.
#
# Usage:
#   pnpm db:restore backups/mr-dan-YYYYMMDD-HHMMSS.sql.gz
#   SEED=1 pnpm db:restore <file>   # also re-run the idempotent catalog seed
#
# The target database must be reachable (compose up first). The dump uses
# --clean --if-exists, so existing rows/tables are dropped and replaced.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dump.sql.gz>" >&2
  exit 2
fi

DUMP="$1"
if [[ ! -f "$DUMP" ]]; then
  echo "File not found: $DUMP" >&2
  exit 1
fi

# Resolve target: prefer the running compose service.
if docker compose ps --services 2>/dev/null | grep -qx postgres; then
  echo "Restoring into docker compose postgres..."
  gunzip -c "$DUMP" | docker compose exec -T postgres \
    psql -U "${POSTGRES_USER:-mr_dan}" -d "${POSTGRES_DB:-mr_dan}" -v ON_ERROR_STOP=1
else
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "No running compose postgres and DATABASE_URL is unset." >&2
    exit 1
  fi
  echo "Restoring via DATABASE_URL..."
  gunzip -c "$DUMP" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1
fi

echo "Applying pending migrations (idempotent)..."
pnpm prisma migrate deploy

if [[ "${SEED:-0}" == "1" ]]; then
  echo "Re-running idempotent catalog seed..."
  pnpm tsx scripts/seed-advising.ts
fi

echo "Restore complete."
