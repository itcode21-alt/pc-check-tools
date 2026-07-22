#!/usr/bin/env bash
# AI 서버 자동 배포 감시 스크립트
#
# 이 스크립트는 Mac mini에서 주기적으로 실행되어:
# 1. ai-service/ 폴더의 변경사항 감지
# 2. 변경 시 자동으로 deploy.sh 실행
# 3. 배포 결과를 로그에 기록
#
# 사용법:
#   1. 주기적 실행 (launchd):
#      cp ./ai-service/launchd/kr.co.itsvc.ai-service-watch.plist ~/Library/LaunchAgents/
#      launchctl load ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist
#
#   2. 또는 수동으로 백그라운드 실행:
#      ./ai-service/watch-and-deploy.sh &
#
set -euo pipefail

# 설정
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WATCH_INTERVAL=300  # 5분마다 체크
LOG_FILE="/tmp/ai-service-watch.log"
LAST_COMMIT_FILE="/tmp/ai-service-last-commit"

cd "$REPO_ROOT"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🚀 AI Service Watch & Deploy started"
log "Repository: $REPO_ROOT"
log "Watch interval: ${WATCH_INTERVAL}s"
log "Log file: $LOG_FILE"

# 초기 커밋 저장
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$LAST_COMMIT_FILE"
log "Initial commit: $CURRENT_COMMIT"

# 무한 루프로 변경사항 감시
while true; do
  # 로컬 저장소 업데이트
  log "📡 Fetching latest changes..."
  if ! git fetch origin main --quiet 2>&1; then
    log "⚠️ Failed to fetch (network error?)"
    sleep "$WATCH_INTERVAL"
    continue
  fi

  # 최신 커밋 확인
  LAST_COMMIT=$(cat "$LAST_COMMIT_FILE")
  LATEST_COMMIT=$(git rev-parse origin/main)

  if [ "$LAST_COMMIT" != "$LATEST_COMMIT" ]; then
    log "🔄 Changes detected!"
    log "Last: $LAST_COMMIT"
    log "Latest: $LATEST_COMMIT"

    # ai-service/ 폴더만 변경됐는지 확인
    AI_SERVICE_CHANGED=$(git diff "$LAST_COMMIT..$LATEST_COMMIT" --name-only | grep -E '^ai-service/' || true)

    if [ -n "$AI_SERVICE_CHANGED" ]; then
      log "📦 AI Service files changed:"
      echo "$AI_SERVICE_CHANGED" | while read -r file; do
        log "  - $file"
      done

      # 로컬 저장소 업데이트
      log "📥 Pulling latest code..."
      if ! git pull origin main --quiet 2>&1; then
        log "❌ Failed to pull"
        sleep "$WATCH_INTERVAL"
        continue
      fi

      # 배포 실행
      log "🚀 Starting deployment..."
      DEPLOY_START=$(date +%s)

      if ./ai-service/deploy.sh >> "$LOG_FILE" 2>&1; then
        DEPLOY_END=$(date +%s)
        DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
        log "✅ Deployment successful (${DEPLOY_TIME}s)"

        # 성공 시 커밋 저장
        echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
      else
        log "❌ Deployment failed"
        log "Check log file for details: $LOG_FILE"
        # 실패 시에도 커밋 저장 (다시 시도하려면 수동으로 git reset)
        echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
      fi
    else
      log "✓ Changes detected but not in ai-service/"
      log "  (Only static site changes)"
      echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
    fi
  else
    log "✓ No changes"
  fi

  log "⏳ Next check in ${WATCH_INTERVAL}s..."
  sleep "$WATCH_INTERVAL"
done
