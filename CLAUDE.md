# itsvc.co.kr (pc-check-tools) 작업 규칙

한국어 정적 사이트(Windows 진단 가이드, 오류 코드·이벤트 해설, 도구)입니다. 영문판은 `en/`에 일부만 있습니다.
CI는 PR에서 "Code Quality & Content Validation"을 돌리고, main에 올라가면 배포와 Health Check를 합니다.

## 원본과 파생 파일
- `data.js`가 원본입니다. `data-*.js`, `kb/knowledge-base.json`, `search-index.js`, 상세 페이지의 `window.SITE_DATA`는 파생 파일이라 손으로 고치지 말고 생성 스크립트로 만듭니다.
  (`scripts/build-search-index.mjs`, `build-detail-bundles.mjs`, `build-kb.mjs` 등)
- 영문 이벤트 해설은 `scripts/event-en-content*.mjs`가 원본이고 `scripts/generate-event-pages-en.mjs`가 만듭니다. `en/ssd-health-check.html`은 `scripts/generate-ssd-health-page-en.mjs`로 만듭니다.
- 생성기(`generate-event-pages*.mjs` 등)를 전체 실행하면 관계없는 페이지 수십 개의 날짜·순서가 바뀝니다. 실행 뒤 `git status`로 범위를 확인하고, 의도하지 않은 변경은 되돌린 뒤 필요한 부분만 고칩니다.

## 캐시 토큰(`?v=`)
- 같은 자산(`app.js`, `site.js`, `search-index.js` 등)의 `?v=` 값은 모든 HTML에서 같아야 합니다(`check-asset-versions`). 자산 내용을 바꾸면 모든 HTML의 토큰을 새 값으로 함께 올립니다.
- 영문 페이지(`en/`)의 토큰은 한국어 페이지에서 읽어 오므로 생성기를 다시 실행해 맞춥니다.
- main이 자주 앞서가서 PR이 토큰 줄에서 충돌합니다. 충돌은 main의 토큰을 따르고, 내가 바꾼 자산의 토큰만 새 값으로 다시 올립니다. 충돌을 풀 때 파생 파일(`search-index.js`, KB)은 합치지 말고 다시 생성합니다.

## 푸시 전 점검 (CI와 같은 것)
```
node scripts/check-links.mjs
node scripts/check-asset-versions.mjs --base=origin/main
node scripts/check-page-data-sources.mjs
node scripts/check-content-quality.mjs --base=origin/main
node scripts/check-rss-freshness.mjs --base=origin/main
node tests/ssd-health-tests.mjs        # SSD 건강 판정을 건드렸을 때
```
- `dateModified`가 바뀌는 페이지가 있으면 `node scripts/generate-rss.mjs`로 `rss.xml`을 다시 만듭니다.
- 페이지를 새로 만들거나 바꾸면 사이트맵·검색 색인 반영 여부와 링크를 확인합니다.

## 내용 원칙
- 새 기술 주장은 공식 문서나 확인된 사례가 있을 때만 씁니다. 번역 작업은 한국어 원문을 충실히 옮기고 주장을 더하지 않습니다.
- Windows 명령·`.bat`·PowerShell은 이 환경에서 실행해 볼 수 없습니다. 실제 Windows에서 돌려 보지 못했다면 PR 본문과 답변에 그대로 적습니다.
- 사용자 개인정보(이름, 이메일 등)는 외부 서비스 요청에 넣지 않습니다.

## 작업 흐름
- PR은 요청이 있을 때만 만듭니다. 푸시는 지정된 작업 브랜치에만 합니다.
- PR을 올린 뒤에는 CI 결과를 확인하고, 머지 요청이 오면 상태(`mergeable_state`)와 CI를 다시 확인한 뒤 병합합니다.
- 병합 뒤에는 라이브 URL이 200인지, 새 캐시 토큰이 반영됐는지 확인합니다(Pages 반영에 2~3분 걸립니다).
- 새 페이지·수정 페이지를 알릴 때는 라이브 링크를 함께 줍니다. HTML 캐시가 약 4시간이므로 확인 시 Ctrl+F5를 안내합니다.
