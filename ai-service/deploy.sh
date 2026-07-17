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

echo "[deploy] 8090 포트를 쓰는 낡은 프로세스 정리..."
# launchd가 관리하지 않는 orphan 프로세스(예: 예전 nohup)가 남아있으면 launchd가
# 새 프로세스를 못 띄우고 계속 재시작을 반복하므로, kickstart 전에 항상 정리합니다.
OLD_PIDS=$(lsof -ti tcp:8090 || true)
if [ -n "$OLD_PIDS" ]; then
  echo "$OLD_PIDS" | xargs kill 2>/dev/null || true
  sleep 1
fi

echo "[deploy] 서비스 재시작..."
if launchctl list | grep -q kr.co.itsvc.ai-service; then
  launchctl kickstart -k "gui/$(id -u)/kr.co.itsvc.ai-service"
else
  nohup ./.venv/bin/uvicorn app:app --host 0.0.0.0 --port 8090 > /tmp/ai-service.log 2>&1 &
fi

echo "[deploy] 기동 대기 중 (의미 기반 검색이 켜져 있으면 임베딩 계산에 다소 걸릴 수 있음)..."
for i in $(seq 1 15); do
  if curl -s -o /dev/null http://localhost:8090/api/health; then
    break
  fi
  sleep 2
done

echo "[deploy] 상태 확인:"
curl -s http://localhost:8090/api/health
echo
lsof -i :8090 || true
echo "[deploy] 완료."
