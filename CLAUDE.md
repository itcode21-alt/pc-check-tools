# itsvc.co.kr 작업 규칙 (클로드용)

한국어 정적 사이트(Windows 진단 가이드, 오류 코드·이벤트 해설, 도구)입니다. 영문판은 `en/`에 일부만 있습니다.
CI는 PR에서 "Code Quality & Content Validation"을 돌리고, main에 올라가면 배포와 Health Check를 합니다.
사용자는 **맥북·데스크탑·웹 클로드**를 오가며 작업하므로, 아래 1~2를 먼저 지키면 모든 장치가 같은 맥락을 씁니다.

## 1. 세션 시작
1. `git pull --no-rebase origin main`
2. `docs/WORKLOG.md`를 읽습니다(현황, 색인 요청 기록, 남은 일, 작업 규칙, 파이프라인 상세).
3. 사용자가 "다른 PC에서 ~했다"고 하면 바로 WORKLOG에 기록합니다. 다른 장치의 작업은 푸시된 커밋으로만 보입니다.

## 2. 작업 단위가 끝날 때
- `docs/WORKLOG.md`를 **같은 커밋에** 갱신하고, 푸시 직전에 다시 `git pull --no-rebase origin main` 한 뒤 푸시합니다. 푸시하지 않은 내용은 다른 장치에 전달되지 않습니다.
- 남길 것: 한 일과 이유(작업 이력 최신순 한 줄) / 새 결정·사용자 지시("앞으로 ~하지 마/해") / 색인·수집 요청 내역(다른 장치 포함)과 남은 순서 / 남은 일·확인 일정·측정 수치 / 새로 안 함정·접근이 차단되는 사이트.
- 넣지 않을 것: 개인정보, 이메일, API 키·토큰·키 파일 경로, 계정 식별자, 내부 사업 사정. 저장소가 **공개(PUBLIC)**이므로 이런 메모는 각 장치의 로컬 메모리에만 둡니다. 로컬 메모리에 새 규칙을 저장했다면 공개 가능한 부분만 WORKLOG "작업 규칙"에 한 줄로 옮깁니다.
- 기록을 마치기 전에는 끝났다고 보고하지 않고, 보고에 "WORKLOG 갱신·푸시함"을 한 줄 덧붙입니다.
- 두 장치가 같은 파일을 동시에 고치면 충돌합니다. 충돌은 아래 "캐시 토큰" 규칙대로 풉니다.

## 3. 반드시 지킬 것
- 모든 답변, 커밋 메시지, 사용자에게 보이는 문구는 한국어로 씁니다.
- 정확성이 최우선입니다. 새 기술 주장은 공식 문서나 확인된 사례가 있을 때만 쓰고, 확인하지 못한 것은 그렇게 밝힙니다. 공식 문서에 없는 점검은 "문서 외 일반 점검"으로 구분합니다. 번역 작업은 한국어 원문을 충실히 옮기고 주장을 더하지 않습니다.
- 커밋 훅을 우회하지 않습니다(`--no-verify` 금지). 실행하지 않는 스크립트: `scripts/generate-sitemap.mjs`, `scripts/generate-game-pages.mjs`.
- 사용자 개인정보(이름, 이메일 등)는 외부 서비스 요청에 넣지 않습니다.
- Windows 명령·`.bat`·PowerShell은 이 환경에서 실행해 볼 수 없습니다. 실제 Windows에서 돌려 보지 못했다면 PR 본문과 답변에 그대로 적습니다.

## 4. 원본과 파생 파일
- `data.js`가 원본입니다. `data-*.js`, `kb/knowledge-base.json`, `search-index.js`, 상세 페이지의 `window.SITE_DATA`는 파생 파일이라 손으로 고치지 말고 생성 스크립트로 만듭니다.
  (`scripts/build-search-index.mjs`, `build-detail-bundles.mjs`, `build-kb.mjs` 등. 실행 순서는 WORKLOG의 "사이트 구조와 파이프라인")
- 영문 이벤트 해설은 `scripts/event-en-content*.mjs`가 원본이고 `scripts/generate-event-pages-en.mjs`가 만듭니다. `en/ssd-health-check.html`은 `scripts/generate-ssd-health-page-en.mjs`로 만듭니다.
- 생성기(`generate-event-pages*.mjs` 등)를 전체 실행하면 관계없는 페이지 수십 개의 날짜·순서가 바뀝니다. 실행 뒤 `git status`로 범위를 확인하고, 의도하지 않은 변경은 되돌린 뒤 필요한 부분만 고칩니다.
- 게임 허브는 `games-data.js`와 `game-*.html` 두 곳을 함께 고칩니다.

## 5. 캐시 토큰(`?v=`)
- 같은 자산(`app.js`, `site.js`, `search-index.js` 등)의 `?v=` 값은 모든 HTML에서 같아야 합니다(`check-asset-versions`). 자산 내용을 바꾸면 모든 HTML의 토큰을 새 값으로 함께 올립니다.
- 영문 페이지(`en/`)의 토큰은 한국어 페이지에서 읽어 오므로 생성기를 다시 실행해 맞춥니다.
- main이 자주 앞서가서 토큰 줄에서 충돌합니다. 충돌은 main의 토큰을 따르고, 내가 바꾼 자산의 토큰만 새 값으로 다시 올립니다. 충돌을 풀 때 파생 파일(`search-index.js`, KB)은 합치지 말고 다시 생성합니다.

## 6. 푸시 전 점검 (CI와 같은 것)
```
node scripts/check-links.mjs
node scripts/check-asset-versions.mjs --base=origin/main
node scripts/check-page-data-sources.mjs
node scripts/check-content-quality.mjs --base=origin/main
node scripts/check-rss-freshness.mjs --base=origin/main
node tests/ssd-health-tests.mjs        # SSD 건강 판정을 건드렸을 때
```
- `dateModified`가 바뀌는 페이지가 있으면 `node scripts/generate-rss.mjs`로 `rss.xml`을 다시 만들고, 사이트맵 날짜는 `node scripts/sync-sitemap-lastmod.mjs --write`로 맞춥니다.
- 페이지를 새로 만들거나 바꾸면 사이트맵·검색 색인 반영 여부와 링크를 확인합니다.

## 7. PR·배포 흐름 (웹 클로드·브랜치 작업 기준)
- PR은 요청이 있을 때만 만듭니다. 푸시는 지정된 작업 브랜치에만 합니다. (로컬 세션에서 사용자가 main 직접 푸시를 쓰는 경우는 WORKLOG의 작업 이력을 따릅니다.)
- PR을 올린 뒤에는 CI 결과를 확인하고, 머지 요청이 오면 상태(`mergeable_state`)와 CI를 다시 확인한 뒤 병합합니다.
- 병합 뒤에는 라이브 URL이 200인지, 새 캐시 토큰이 반영됐는지 확인합니다(Pages 반영에 2~3분 걸립니다).
- 새 페이지·수정 페이지를 알릴 때는 라이브 링크를 함께 줍니다. HTML 캐시가 약 4시간이므로 확인 시 Ctrl+F5를 안내합니다.

## 8. 여러 장치(맥북·윈도우 PC·맥미니)에서 번갈아 작업할 때
- **장치를 바꾸기 전에 반드시 커밋·푸시**하고(`git status`가 깨끗해야 함), 바꾼 뒤에는 첫 작업으로 `git pull --no-rebase origin main`을 합니다. 푸시하지 않은 내용은 다른 장치에 없습니다.
- **로컬 메모리(`~/.claude/projects/.../memory`)는 장치마다 따로**라 동기화되지 않습니다. 다른 장치에서도 알아야 하는 결정·규칙·함정은 `docs/WORKLOG.md`에 적습니다(위 2번). 진행 중인 큰 작업은 WORKLOG "남은 일"에 **현황·남은 일·시험 방법**을 한 덩어리로 유지합니다.
- **윈도우 PC 처음 설정**: Git Bash에서 `sh scripts/setup-hooks.sh`(커밋 전 검사 켜기), Node 18 이상, `ai-service`에서 `python -m venv .venv` → `.venv\Scripts\pip install -r requirements.txt`. 줄바꿈은 `.gitattributes`가 LF로 고정하므로 `core.autocrlf`를 따로 만지지 않습니다. 윈도우에서 `.sh`·`.githooks/pre-commit`이 안 돌면 줄바꿈이 CRLF가 된 것이니 `git add --renormalize .` 후 다시 체크아웃합니다.
- **장치별로 할 수 있는 일**: 맥미니 배포(`ai-service/deploy.sh`, launchd)는 맥미니에서만, WinDbg·실제 Windows 명령 확인은 윈도우 PC에서만 할 수 있습니다. 못 하는 확인은 "확인하지 못함"으로 적고 WORKLOG "남은 일"에 어느 장치에서 할지 남깁니다.
- **윈도우에서 해야 하는 작업은 윈도우 PC로 안내(사용자 지시 11/26)**: 지금 장치가 맥북인데 작업이 윈도우 PC에서만 가능하면(실제 `.dmp`·`.evtx`·HWiNFO CSV로 분석기 검증, WinDbg 대조, 윈도우 명령·`.bat`·PowerShell 실행 확인, 윈도우용 프로그램 빌드·실행 등), 맥북에서 추정으로 진행하지 말고 먼저 "이 작업은 윈도우 PC에서 하세요"라고 알립니다. 가능한 부분(문서·코드 초안)만 하고, 윈도우에서 이어갈 일을 WORKLOG "남은 일"에 적어 둡니다.
- **장치에 두는 것(저장소에 올리지 않음)**: `ai-service/.env`(비밀값, 맥미니에만), 실제 덤프·로그(개인정보), 모듈 이미지 캐시(`ai-service/data/`). 저장소는 공개입니다.
- 두 장치가 같은 파일을 동시에 고치면 충돌합니다. 한 장치에서 작업하는 동안 다른 장치에서는 같은 파일을 건드리지 않습니다.
