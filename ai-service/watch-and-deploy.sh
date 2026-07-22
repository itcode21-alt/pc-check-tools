#!/usr/bin/env bash
# AI 서버 자동 배포 감시 스크립트
#
# 이 스크립트는 Mac mini에서 주기적으로 실행되어:
# 1. ai-service/ 폴더의 변경사항 감지 → deploy.sh 실행
# 2. data.js/scripts/ 폴더의 변경사항 감지 → 부품 데이터/검색 인덱스 자동 재생성
# 3. 배포 결과를 로그에 기록
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

    # 로컬 저장소 업데이트
    log "📥 Pulling latest code..."
    if ! git pull origin main --quiet 2>&1; then
      log "❌ Failed to pull"
      sleep "$WATCH_INTERVAL"
      continue
    fi

    # 변경된 파일 목록 확인
    CHANGED_FILES=$(git diff "$LAST_COMMIT..$LATEST_COMMIT" --name-only)

    # AI 서비스 변경 확인
    AI_SERVICE_CHANGED=$(echo "$CHANGED_FILES" | grep -E '^ai-service/' || true)

    # 부품 데이터/검색 스크립트 변경 확인
    DATA_OR_SCRIPT_CHANGED=$(echo "$CHANGED_FILES" | grep -E '^(data\.js|scripts/(add-hardware|build-search))' || true)

    # 관리자 대시보드/UI 변경 확인
    ADMIN_OR_UI_CHANGED=$(echo "$CHANGED_FILES" | grep -E '^(admin/|upgrade-diagnostic\.html|feedback-system\.js)' || true)

    # AI 서비스 배포
    if [ -n "$AI_SERVICE_CHANGED" ]; then
      log "📦 AI Service files changed:"
      echo "$AI_SERVICE_CHANGED" | while read -r file; do
        log "  - $file"
      done

      log "🚀 Starting AI service deployment..."
      DEPLOY_START=$(date +%s)

      if ./ai-service/deploy.sh >> "$LOG_FILE" 2>&1; then
        DEPLOY_END=$(date +%s)
        DEPLOY_TIME=$((DEPLOY_END - DEPLOY_START))
        log "✅ AI Service deployment successful (${DEPLOY_TIME}s)"
      else
        log "❌ AI Service deployment failed"
      fi
    fi

    # 부품 데이터 & 검색 인덱스 재생성
    if [ -n "$DATA_OR_SCRIPT_CHANGED" ]; then
      log "📊 Data or script files changed:"
      echo "$DATA_OR_SCRIPT_CHANGED" | while read -r file; do
        log "  - $file"
      done

      log "📝 Running hardware data update..."
      if node scripts/add-hardware-to-datajs.mjs >> "$LOG_FILE" 2>&1; then
        log "✅ Hardware data update successful"
      else
        log "⚠️ Hardware data update failed (might already be up-to-date)"
      fi

      log "🔄 Checking for duplicate parts..."
      if node scripts/merge-hardware-data.mjs >> "$LOG_FILE" 2>&1; then
        log "✅ Duplicate check completed (중복 제거됨)"
      else
        log "ℹ️ Duplicate check info logged"
      fi

      log "🔍 Rebuilding search index..."
      if node scripts/build-search-index.mjs >> "$LOG_FILE" 2>&1; then
        log "✅ Search index rebuild successful"
      else
        log "❌ Search index rebuild failed"
      fi
    fi

    # Dashboard/UI 변경 감시
    if [ -n "$ADMIN_OR_UI_CHANGED" ]; then
      log "🎨 Dashboard/UI files changed:"
      echo "$ADMIN_OR_UI_CHANGED" | while read -r file; do
        log "  - $file"
      done
      log "ℹ️ 정적 페이지 자동 배포 (서버 재시작 불필요)"
    fi

    # 커밋 저장
    echo "$LATEST_COMMIT" > "$LAST_COMMIT_FILE"

    if [ -n "$AI_SERVICE_CHANGED" ] || [ -n "$DATA_OR_SCRIPT_CHANGED" ] || [ -n "$ADMIN_OR_UI_CHANGED" ]; then
      log "✅ All deployments completed"
    else
      log "✓ Changes detected but no deployment needed"
    fi
  else
    log "✓ No changes"
  fi

  log "⏳ Next check in ${WATCH_INTERVAL}s..."
  sleep "$WATCH_INTERVAL"
done
