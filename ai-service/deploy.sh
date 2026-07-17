#!/usr/bin/env bash
# Mac mini에서 ai-service를 최신 코드로 갱신하고 재시작합니다.
# Hermes(또는 사람)가 "새 수정사항 반영해줘" 요청을 받으면 이 스크립트만 실행하면 됩니다.
#
# 사용법: ./deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."   # 저장소 루트로 이동

echo "[deploy] git pull..."
git pull origin main

cd ai-service

echo "[deploy] 의존성 갱신..."
./.venv/bin/pip install -q -r requirements.txt

echo "[deploy] 기존 프로세스 종료 (launchd가 자동 재시작합니다)..."
if launchctl list | grep -q kr.co.itsvc.ai-service; then
  launchctl kickstart -k "gui/$(id -u)/kr.co.itsvc.ai-service"
else
  pkill -f "uvicorn app:app" 2>/dev/null || true
  nohup ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8090 > /tmp/ai-service.log 2>&1 &
fi

sleep 2
echo "[deploy] 상태 확인:"
curl -s http://localhost:8090/api/health
echo
echo "[deploy] 완료."
