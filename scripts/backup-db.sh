#!/usr/bin/env bash
# Backup the mr-dan Postgres database to a gzipped SQL dump.
#
# Usage:
#   pnpm db:backup                 # writes to ./backups/
#   BACKUP_DIR=/path pnpm db:backup
#   BACKUP_FILE=/path/out.sql.gz pnpm db:backup
#
# The dump is produced with pg_dump --clean --if-exists so it can be
# restored into an existing (or empty) database. It contains schema and
# data, including the seeded catalogs.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_FILE="${BACKUP_FILE:-$BACKUP_DIR/mr-dan-$TIMESTAMP.sql.gz}"

# Resolve connection: prefer the running compose service, fall back to
# DATABASE_URL for a host-installed Postgres.
if docker compose ps --services 2>/dev/null | grep -qx postgres; then
  echo "Backing up via docker compose (postgres service)..."
  docker compose exec -T postgres \
    pg_dump -U "${POSTGRES_USER:-mr_dan}" -d "${POSTGRES_DB:-mr_dan}" \
    --clean --if-exists --no-owner --no-privileges \
    | gzip -9 > "$BACKUP_FILE"
else
  if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "No running compose postgres and DATABASE_URL is unset." >&2
    exit 1
  fi
  echo "Backing up via DATABASE_URL..."
  pg_dump "$DATABASE_URL" --clean --if-exists --no-owner --no-privileges \
    | gzip -9 > "$BACKUP_FILE"
fi

SIZE="$(du -h "$BACKUP_FILE" | cut -f1)"
echo "Backup written: $BACKUP_FILE ($SIZE)"
echo "Keep this file plus your .env (secrets are NOT in the dump)."
