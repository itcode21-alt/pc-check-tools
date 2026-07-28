#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$HOME/.config/itsvc/admin.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "관리자 환경파일이 없습니다: $ENV_FILE" >&2
  exit 1
fi
set -a
. "$ENV_FILE"
set +a
exec /usr/bin/env node "$ROOT/scripts/admin-server.mjs"
