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

# launchd는 셸의 PATH를 거의 전달하지 않으므로 설치 위치를 명시적으로 찾습니다.
for NODE_BIN in "${NODE_BIN:-}" "$HOME/.local/bin/node" /opt/homebrew/bin/node /usr/local/bin/node; do
  if [ -n "$NODE_BIN" ] && [ -x "$NODE_BIN" ]; then
    exec "$NODE_BIN" "$ROOT/scripts/admin-server.mjs"
  fi
done

echo "Node.js 실행 파일을 찾을 수 없습니다. node 설치 경로를 확인하세요." >&2
exit 1
