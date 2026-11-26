#!/usr/bin/env bash
# Restore a chroma tarball produced by backup-chroma.sh.
#
# Usage:
#   pnpm chroma:restore backups/chroma-YYYYMMDD-HHMMSS.tar.gz

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <chroma.tar.gz>" >&2
  exit 2
fi

ARCHIVE="$1"
if [[ ! -f "$ARCHIVE" ]]; then
  echo "File not found: $ARCHIVE" >&2
  exit 1
fi

VOLUME="$(docker volume ls --format '{{.Name}}' | grep -E 'chroma-data$' | head -n1)"
if [[ -z "$VOLUME" ]]; then
  echo "Could not find the chroma data volume (name ending in chroma-data)." >&2
  exit 1
fi
echo "Using volume: $VOLUME"

echo "Stopping chromadb..."
docker compose stop chromadb

echo "Clearing chroma data volume..."
docker run --rm -v "$VOLUME":/data alpine sh -c 'rm -rf /data/* /data/.[!.]* 2>/dev/null; true'

echo "Restoring archive..."
docker run --rm -v "$VOLUME":/data -v "$(pwd)/$(dirname "$ARCHIVE")":/backup alpine \
  sh -c "tar xzf /backup/$(basename "$ARCHIVE") -C /"

echo "Starting chromadb..."
docker compose up -d chromadb

echo "Chroma restore complete."
