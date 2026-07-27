#!/bin/bash

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW_PORT=8811
PREVIEW_URL="http://localhost:${PREVIEW_PORT}/"
PREVIEW_LOG="${TMPDIR:-/tmp}/itsvc-preview.log"
SSH_KEY="$HOME/.ssh/id_ed25519_codex"

cd "$ROOT" || exit 1

if [ -f "$SSH_KEY" ]; then
  export GIT_SSH_COMMAND="ssh -i $SSH_KEY -o IdentitiesOnly=yes"
fi

clear_screen() {
  printf '\033[2J\033[H'
}

pause() {
  printf '\nEnter 키를 누르면 메뉴로 돌아갑니다.'
  read -r _
}

header() {
  clear_screen
  printf '%s\n' '============================================'
  printf '%s\n' ' ITSVC 사이트 관리 - Mac 로컬 도구'
  printf '%s\n' '============================================'
  printf '저장소: %s\n\n' "$ROOT"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    printf '오류: %s 명령을 찾을 수 없습니다.\n' "$1"
    return 1
  fi
}

show_status() {
  header
  printf '%s\n' '[현재 상태]'
  printf '브랜치: %s\n' "$(git branch --show-current)"
  printf '최근 커밋: %s\n\n' "$(git log -1 --pretty=format:'%h %s')"

  if [ -n "$(git status --porcelain)" ]; then
    printf '%s\n' '아직 배포하지 않은 변경:'
    git status --short
  else
    printf '%s\n' '작업 파일: 변경 없음'
  fi

  printf '\n미리보기: '
  if lsof -nP -iTCP:"$PREVIEW_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    printf '실행 중 (%s)\n' "$PREVIEW_URL"
  else
    printf '중지됨\n'
  fi
}

start_preview() {
  header
  require_command node || return

  if lsof -nP -iTCP:"$PREVIEW_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    printf '%s\n' '미리보기 서버가 이미 실행 중입니다.'
  else
    nohup node "$ROOT/scripts/dev-server.mjs" >"$PREVIEW_LOG" 2>&1 &
    sleep 1
    if ! lsof -nP -iTCP:"$PREVIEW_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
      printf '미리보기를 시작하지 못했습니다. 로그: %s\n' "$PREVIEW_LOG"
      return
    fi
    printf '%s\n' '미리보기 서버를 시작했습니다.'
  fi

  open "$PREVIEW_URL"
  printf '브라우저에서 %s 을(를) 열었습니다.\n' "$PREVIEW_URL"
}

stop_preview() {
  header
  PREVIEW_PIDS="$(lsof -tiTCP:"$PREVIEW_PORT" -sTCP:LISTEN 2>/dev/null || true)"
  if [ -z "$PREVIEW_PIDS" ]; then
    printf '%s\n' '실행 중인 미리보기 서버가 없습니다.'
    return
  fi

  for pid in $PREVIEW_PIDS; do
    kill "$pid" 2>/dev/null || true
  done
  printf '%s\n' '미리보기 서버를 종료했습니다.'
}

run_checks() {
  header
  require_command node || return 1
  printf '%s\n' '[1/4] JavaScript 문법 검사'
  for file in app.js data.js games-data.js site.js search.js; do
    node --check "$file" || return 1
  done
  printf '%s\n\n' '통과'

  printf '%s\n' '[2/4] 내부 링크 검사'
  node scripts/check-links.mjs || return 1
  printf '\n'

  printf '%s\n' '[3/4] 필수 운영 파일 검사'
  for file in index.html diagnostic.html guides.html about.html contact.html privacy.html terms.html editorial-policy.html sitemap.xml robots.txt ads.txt CNAME; do
    if [ ! -s "$file" ]; then
      printf '누락 또는 빈 파일: %s\n' "$file"
      return 1
    fi
  done
  printf '%s\n\n' '통과'

  printf '%s\n' '[4/4] Git 변경 형식 검사'
  git diff --check || return 1
  printf '%s\n\n' '통과'
  printf '%s\n' '모든 기본 검사를 통과했습니다.'
}

sync_site() {
  header
  if [ -n "$(git status --porcelain)" ]; then
    printf '%s\n' '수정 중인 파일이 있어 동기화를 중단했습니다.'
    printf '%s\n' '먼저 배포하거나 변경 내용을 정리한 뒤 다시 실행하세요.'
    return 1
  fi

  printf '%s\n' 'GitHub의 최신 변경을 확인합니다...'
  git fetch origin main || return 1
  git rebase origin/main || return 1
  printf '%s\n' '로컬 저장소를 최신 상태로 맞췄습니다.'
}

prepare_remote() {
  printf '%s\n' 'GitHub 최신 상태 확인 중...'
  git fetch origin main || return 1

  BEHIND="$(git rev-list --count HEAD..origin/main)"
  if [ "$BEHIND" -gt 0 ]; then
    if [ -n "$(git status --porcelain)" ]; then
      printf '원격 저장소가 %s개 커밋 앞서 있고 로컬 파일도 수정되어 있습니다.\n' "$BEHIND"
      printf '%s\n' '안전을 위해 자동 병합하지 않습니다. 변경을 먼저 커밋하거나 정리하세요.'
      return 1
    fi
    git rebase origin/main || return 1
  fi
}

deploy_site() {
  header
  prepare_remote || return 1
  printf '\n'
  run_checks || return 1

  printf '\n[배포 대상]\n'
  git status --short

  if [ -n "$(git status --porcelain)" ]; then
    printf '\n커밋 설명을 입력하세요: '
    read -r COMMIT_MESSAGE
    if [ -z "$COMMIT_MESSAGE" ]; then
      printf '%s\n' '커밋 설명이 비어 있어 배포를 취소했습니다.'
      return 1
    fi

    git add -A
    printf '\n[커밋될 파일]\n'
    git diff --cached --stat
    printf '\n위 변경을 커밋하고 배포할까요? (y/N): '
    read -r CONFIRM
    case "$CONFIRM" in
      y|Y|yes|YES)
        git commit -m "$COMMIT_MESSAGE" || return 1
        ;;
      *)
        git restore --staged .
        printf '%s\n' '배포를 취소했습니다. 파일 수정 내용은 그대로 보관됩니다.'
        return 1
        ;;
    esac
  fi

  AHEAD="$(git rev-list --count origin/main..HEAD)"
  if [ "$AHEAD" -eq 0 ]; then
    printf '%s\n' '배포할 새 커밋이 없습니다.'
    return 0
  fi

  printf '\nGitHub Pages로 업로드합니다...\n'
  git push origin main || {
    printf '%s\n' '업로드에 실패했습니다. 강제 푸시는 하지 않았습니다.'
    return 1
  }

  printf '\n배포 요청 완료: %s\n' "$(git log -1 --pretty=format:'%h %s')"
  printf '%s\n' 'GitHub Pages 반영에는 보통 1~5분이 걸립니다.'
  printf '%s\n' '공개 주소: https://itsvc.co.kr/'
}

check_production() {
  header
  require_command curl || return
  printf '%s\n' '[공개 사이트 상태]'
  for url in \
    'https://itsvc.co.kr/' \
    'https://itsvc.co.kr/diagnostic.html' \
    'https://itsvc.co.kr/guides.html' \
    'https://itsvc.co.kr/sitemap.xml' \
    'https://itsvc.co.kr/ads.txt'; do
    STATUS="$(curl -L -sS -o /dev/null -w '%{http_code}' "$url" || printf '000')"
    printf '%-55s %s\n' "$url" "$STATUS"
  done
}

open_project() {
  header
  open "$ROOT"
  printf '%s\n' 'Finder에서 사이트 폴더를 열었습니다.'
}

while true; do
  header
  printf '%s\n' '1. 현재 변경 및 배포 상태 보기'
  printf '%s\n' '2. 로컬 미리보기 열기'
  printf '%s\n' '3. 로컬 미리보기 종료'
  printf '%s\n' '4. 사이트 품질 검사'
  printf '%s\n' '5. GitHub 최신 내용 받기'
  printf '%s\n' '6. 변경 내용 검사 후 배포'
  printf '%s\n' '7. 공개 사이트 상태 확인'
  printf '%s\n' '8. 사이트 폴더 열기'
  printf '%s\n' '0. 종료'
  printf '\n선택: '
  read -r MENU

  case "$MENU" in
    1) show_status; pause ;;
    2) start_preview; pause ;;
    3) stop_preview; pause ;;
    4) run_checks; pause ;;
    5) sync_site; pause ;;
    6) deploy_site; pause ;;
    7) check_production; pause ;;
    8) open_project; pause ;;
    0) clear_screen; exit 0 ;;
    *) printf '%s\n' '올바른 번호를 선택하세요.'; sleep 1 ;;
  esac
done
