#!/usr/bin/env bash
# Backup the Chroma vector store (RAG chunks + embeddings) to a tarball.
#
# Usage:
#   pnpm chroma:backup
#   BACKUP_DIR=/path pnpm chroma:backup

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/chroma-$TIMESTAMP.tar.gz"

if ! docker compose ps --services 2>/dev/null | grep -qx chromadb; then
  echo "chromadb service is not running. Start it first: docker compose up -d chromadb" >&2
  exit 1
fi

echo "Backing up chroma volume..."
docker compose exec -T chromadb tar czf - /data > "$OUT"

SIZE="$(du -h "$OUT" | cut -f1)"
echo "Chroma backup written: $OUT ($SIZE)"
