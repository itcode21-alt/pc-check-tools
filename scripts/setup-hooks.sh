#!/bin/sh
# 새로 clone한 저장소에서 한 번 실행하면 커밋 전 검사(.githooks/pre-commit)가 적용됩니다.
# 훅이 .git/hooks 안에만 있으면 저장소에 올라가지 않아 다른 컴퓨터에서는 검사 없이
# 커밋되므로, 훅을 추적되는 .githooks/로 옮기고 git이 그 폴더를 쓰도록 설정한다.
cd "$(dirname "$0")/.." || exit 1
chmod +x .githooks/*
git config core.hooksPath .githooks
echo "✓ core.hooksPath = $(git config --get core.hooksPath)"
