#!/usr/bin/env bash
# AI 서버 자동 배포 감시 스크립트

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WATCH_INTERVAL=300
LOG_FILE="/tmp/ai-service-watch.log"
LAST_COMMIT_FILE="/tmp/ai-service-last-commit"

cd "$REPO_ROOT"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "🚀 AI Service Watch & Deploy started"
log "Repository: $REPO_ROOT"
log "Watch interval: ${WATCH_INTERVAL}s"

CURRENT_COMMIT=$(git rev-parse HEAD)
echo "$CURRENT_COMMIT" > "$LAST_COMMIT_FILE"
log "Initial commit: $CURRENT_COMMIT"

while true; do
  log "📡 Fetching latest changes..."
  if ! git fetch origin main --quiet 2>&1; then
    log "⚠️ Failed to fetch"
    sleep "$WATCH_INTERVAL"
    continue
  fi

  LAST_COMMIT=$(cat "$LAST_COMMIT_FILE")
  LATEST_COMMIT=$(git rev-parse origin/main)

  if [ "$LAST_COMMIT" != "$LATEST_COMMIT" ]; then
    log "🔄 Changes detected!"
    
    AI_SERVICE_CHANGED=$(git diff "$LAST_COMMIT..$LATEST_COMMIT" --name-only | grep -E '^ai-service/' || true)

    if [ -n "$AI_SERVICE_CHANGED" ]; then
      log "📦 AI Service files changed"
      log "📥 Pulling latest code..."
      if ! git pull origin main --quiet 2>&1; then
        log "❌ Failed to pull"
        sleep "$WATCH_INTERVAL"
        continue
      fi

      log "🚀 Starting deployment..."
      DEPLOY_START=$(date +%s)

      if ./ai-service/deploy.sh >> "$LOG_FILE" 2>&1; then
        DEPLOY_END=$(date +%s)
        DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
        log "✅ Deployment successful (${DEPLOY_TIME}s)"
        echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
      else
        log "❌ Deployment failed"
        echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
      fi
    else
      log "✓ Changes detected but not in ai-service/"
      echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"
    fi
  else
    log "✓ No changes"
  fi

  log "⏳ Next check in ${WATCH_INTERVAL}s..."
  sleep "$WATCH_INTERVAL"
done
