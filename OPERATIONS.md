# 사이트 운영 메뉴얼

itsvc.co.kr(PC 윈도우 진단 센터) 운영자를 위한 실무 가이드입니다. `README.md`가 "이 패키지가 뭔지"를 설명한다면, 이 문서는 "실제로 뭘 어떻게 고치고 배포하는지"를 다룹니다.

---

## 1. 한눈에 보는 사이트 구조

- **정적 HTML/CSS/JS 사이트** — 빌드 도구, 프레임워크, 서버 없음. 파일을 고치고 커밋·푸시하면 그대로 배포됩니다.
- **배포**: GitHub 저장소 `itcode21-alt/pc-check-tools`의 `main` 브랜치 → GitHub Pages 자동 배포 → Cloudflare가 `itsvc.co.kr` 커스텀 도메인 앞단에서 DNS/캐싱을 담당(`CNAME` 파일에 도메인 지정됨).
- **수익화**: Google AdSense(`ca-pub-9907102461716567`), Coupang Partners 링크(하드웨어 관련 페이지 일부).
- **AI 기능**: 진단 도구의 "AI 진단"·"AI 요약"·"종합 분석"은 별도로 운영 중인 Mac mini 백엔드(`https://ai.itsvc.co.kr`, `ai-service/app.py`)에 fetch로 붙습니다. 이 서버가 꺼져 있으면 각 기능은 규칙 기반 폴백으로 자동 대체됩니다(사이트가 깨지지는 않음).
- **콘텐츠 규모**: HTML 페이지 약 206개, `data.js`(증상/오류코드/하드웨어 부품 데이터) 약 4,300줄, `games-data.js`(게임별 오류) 약 3,400줄, `app.js`(진단 도구 로직) 약 3,100줄, `style.css` 약 3,400줄.

### 핵심 파일

| 파일 | 역할 |
| --- | --- |
| `data.js` | `window.SITE_DATA` — 오류 코드(`errorCodes`), 증상(`symptoms`), 하드웨어 부품(`parts`) 등 진단 도구의 모든 콘텐츠 데이터 |
| `games-data.js` | 게임별 오류 데이터(`gameErrors`, `gameBrands`) |
| `app.js` | 진단 도구(진단.html)의 모든 인터랙션 — 탭 전환, 검색, AI 호출, 진단 카트(바구니), 결과 렌더링 |
| `style.css` | 전체 사이트 스타일. **주의사항은 4장 참고** |
| `search.js` / `search-index.js` | 헤더 검색창. `search-index.js`는 `data.js` + `games-data.js`에서 자동 생성되는 파일이라 **직접 수정 금지** |
| `error-codes-index.html` | 오류 코드 전체 목록(증상 그룹별로 정리) |
| `sitemap.xml` / `robots.txt` | SEO |
| `scripts/*.mjs` | 콘텐츠 생성·검증 스크립트 (2장 참고) |

---

## 2. 새 콘텐츠 추가하기

### 2-1. 오류 코드(블루스크린 코드 등) 추가

가장 흔한 작업입니다. 순서:

1. **`data.js`의 `errorCodes` 배열**에 새 항목을 추가합니다. 기존 항목을 하나 복사해서 아래 필드를 채우세요.

   ```js
   {
     code: "0x00000XXX",                    // 대문자, 0x + 8자리 16진수
     title: "BUG_CHECK_NAME",               // Microsoft 공식 명칭
     overview: "...",                        // 2~3문장, 상세 설명
     summary: "...",                         // overview의 축약형(카드 미리보기용)
     causes: ["...", "...", "..."],          // 4~5개, 구체적으로
     checks: ["...", "...", "..."],          // 4~5개, 실행 가능한 순서로
     link: "error-code-0x00000xxx.html",     // 소문자
     detailPage: "error-code-0x00000xxx.html",
     relatedSymptom: "hardware-xxx.html",    // symptoms 배열의 link 값과 일치해야 함
     aliases: ["xxx", "00000xxx", "0xxxx"],  // 검색용: 0없는 짧은 형태 / 0포함 8자리 / 0x+짧은형태
     officialSource: {"title":"Microsoft Learn: Bug Check 0xXXX BUG_CHECK_NAME","url":"https://learn.microsoft.com/..."}
   }
   ```

   **`relatedSymptom`은 반드시 실제로 존재하는 증상 페이지와 일치시키세요.** 어떤 증상 그룹이 있는지는 `data.js`의 `symptoms` 배열(각 항목의 `link` 필드)이나 `error-codes-index.html`의 `<h3 id="group-...">` 목록을 보면 됩니다.

   **정확성 확인**: 코드 이름과 원인을 확신할 수 없으면 `learn.microsoft.com`에서 `Bug Check 0xXXX` 검색으로 공식 문서를 직접 확인하세요. 외부에서 받은 리포트(예: 다른 AI가 만든 정리본)를 그대로 베끼지 말고 한 번은 검증할 것 — 과거에 실제로 리포트 하나가 코드명을 잘못 기재한 적이 있습니다.

2. **상세 페이지(HTML) 생성**: `scripts/generate-missing-error-pages.mjs`의 `missingCodes` 배열을 새 코드로 교체하고 실행합니다.

   ```bash
   node scripts/generate-missing-error-pages.mjs
   ```

   이 스크립트는 `data.js`에서 해당 코드를 찾아 정적 폴백 HTML을 만듭니다(실제 사용자에게는 `app.js`가 런타임에 `data.js`의 진짜 내용으로 덮어써서 보여주므로, 정적 폴백의 문구는 SEO/JS-미실행 시나리오용입니다). **이미 파일이 있으면 건너뜁니다** — 템플릿을 바꾼 뒤 기존 파일을 다시 만들고 싶으면 먼저 `rm`으로 지우고 실행하세요.

3. **`error-codes-index.html`에 링크 추가**: 해당 코드가 속할 `<h3 id="group-...">` 섹션의 `<ul class="mini-list code-index-list">` 안에 한 줄 추가합니다.

   ```html
   <li><a href="error-code-0x00000xxx.html">0x00000XXX</a> — BUG_CHECK_NAME</li>
   ```

4. **`sitemap.xml`에 새 URL 추가** — 잊기 쉬운 단계입니다. 파일 맨 아래에 한 줄 추가:

   ```xml
   <url><loc>https://itsvc.co.kr/error-code-0x00000xxx.html</loc></url>
   ```

5. **검색 인덱스 재생성**:

   ```bash
   node scripts/build-search-index.mjs
   ```

6. **`data.js`를 참조하는 캐시버스팅 버전 올리기** (5장 참고) — `data.js` 내용이 바뀌었으므로 필수입니다.

7. **검증**:

   ```bash
   node -e "new Function(require('fs').readFileSync('data.js','utf8'))"   # 문법 확인
   node scripts/check-links.mjs                                            # 깨진 링크 확인
   ```

   브라우저에서 새 상세 페이지를 열어 `app.js`가 실제 내용을 렌더링하는지, 헤더 검색창에 코드를 입력했을 때 자동완성에 뜨는지 확인하세요.

### 2-2. 증상(symptom) 추가

`data.js`의 `symptoms` 배열에 항목 추가(기존 항목 복사해서 `id`, `title`, `summary`, `causes`, `checks`, `link`, `codes`(관련 오류 코드 배열) 채우기). 증상 상세 페이지가 필요하면 기존 증상 페이지(`windows-*.html`, `hardware-*.html`) 중 하나를 복사해서 구조를 맞추는 게 가장 빠릅니다. `guides.html`과 `error-codes-index.html`에도 카드/링크 추가가 필요할 수 있습니다.

### 2-3. 게임 오류 추가

`games-data.js`의 `gameErrors`에 항목 추가. 신규 게임이면 `scripts/generate-game-pages.mjs`로 페이지를 생성할 수 있습니다(스크립트 상단의 게임 목록 배열을 확인하고 필요시 수정).

### 2-4. 이벤트 뷰어 코드 추가

`scripts/generate-event-pages.mjs` 참고 — 오류 코드와 비슷한 패턴입니다.

---

## 3. 스크립트 목록 (`scripts/`)

| 스크립트 | 용도 | 실행 시점 |
| --- | --- | --- |
| `check-links.mjs` | 모든 HTML의 내부 링크가 실제 파일을 가리키는지 검사 | **커밋 전 항상** |
| `build-search-index.mjs` | `data.js` + `games-data.js` → `search-index.js` 생성 | `data.js`/`games-data.js` 수정 후 |
| `build-kb.mjs` | (지식베이스 관련 빌드 — 필요 시 스크립트 상단 주석 확인) | 필요 시 |
| `generate-missing-error-pages.mjs` | 오류 코드 상세 HTML 생성 | 새 오류 코드 추가 시 |
| `generate-event-pages.mjs` | 이벤트 뷰어 코드 상세 HTML 생성 | 새 이벤트 코드 추가 시 |
| `generate-game-pages.mjs` | 게임 오류 상세 HTML 생성 | 새 게임 추가 시 |
| `generate-static-fallbacks.mjs` | 정적 폴백 콘텐츠 일괄 생성/보정 | 필요 시 |
| `add-official-sources.mjs`, `add-source-links-to-pages.mjs` | 공식 출처 링크 일괄 삽입 | 필요 시 |
| `add-update-issue.mjs` | `windows-update-tracker.html`에 새 KB 이슈 추가 | Windows 업데이트 이슈 발생 시 |
| `dev-server.mjs` | 로컬 개발 서버(포트 8811) | 로컬 미리보기 |
| `analyze-search-console.py` | 서치콘솔 데이터 분석(Python) | SEO 점검 시 |

새 콘텐츠 생성 스크립트(`generate-*.mjs`)를 쓸 때는 **템플릿이 최신 사이트 표준(헤더 검색창, `tools.html` 네비, `search-index.js`/`search.js` 스크립트 태그 포함)과 일치하는지 먼저 기존 페이지 하나(예: `error-code-0x0000005c.html`)와 `diff`로 비교**하세요. 스크립트 템플릿이 오래돼서 최신 페이지 구조와 어긋나 있던 적이 있습니다.

---

## 4. `style.css` 주의사항 (중요, 자주 실수하는 부분)

**이 사이트는 전체적으로 다크 테마가 아닙니다.** index.html, guides.html 등 대부분 페이지의 `<body>`는 **밝은 배경 + 어두운 네이비 글자(`#102a38`)**로 렌더링됩니다. `diagnostic.html`의 진단 도구 영역(`.diagnostic-shell` 등)만 자체적으로 어두운 박스를 씌워서 그 안에서만 다크 테마처럼 보입니다.

`style.css`에는 오래전 리디자인 시안에서 정리되지 않고 남은 **3개의 죽은/부분적으로 죽은 `:root`+`body` 재선언 블록**이 있습니다(파일 안에 각각 위치와 이유를 설명하는 주석이 달려 있으니 참고):

1. **"Editorial" 블록** — 대부분 죽은 코드지만 개별 클래스 선택자는 아직 쓰일 수 있음. 삭제 전 개별 확인 필요.
2. **"Minimal portfolio" 블록** — ⚠️ **함부로 지우지 말 것.** 여기 `--text: #111111` 값을 `guides.html`의 흰색 카드 등 다른 페이지가 실질적으로 물려받아 쓰고 있습니다. 지우면 흰 배경에 흰 글자가 되는 회귀가 발생합니다.
3. **"Studio" 블록** — ✅ **이게 죽은 코드가 아니라 사이트가 실제로 쓰는 진짜 라이트 테마**입니다. `body:has(.hero-home)` 등 페이지별 스코프 선택자를 씁니다.

**새 컴포넌트를 추가할 때 규칙**:
- `var(--text)`, `var(--accent)` 같은 전역 CSS 변수는 페이지 맥락에 따라 다르게 깨질 수 있으니 **쓰지 마세요.**
- 대신 직접 색상값을 `!important`와 함께 명시하세요: 배경 `#ffffff`, 제목 `#102a38`, 본문 `#5e7079`, 강조 `#087ea4`, 테두리 `#d9e5e8`.
- 클래스명은 페이지 전용으로 스코프하세요(예: `.home-entry-card`). `grep -l ".클래스명"`으로 다른 페이지에 안 쓰이는지 확인하면 안전합니다.

**모달/오버레이 만들 때**: `[hidden]` 속성으로 숨기는 요소에는 반드시 `.클래스[hidden] { display: none; }`을 명시하세요. 브라우저 기본 `[hidden]` 규칙은 author stylesheet의 동일 명시도 규칙에 항상 집니다(CSS cascade origin 규칙). 이걸 빠뜨려서 진단 페이지 전체가 빈 모달에 막혀 접근 불가능해진 적이 있습니다 — 배포 전 실제 클릭 테스트(스크린샷 좌표 클릭 말고 `read_page`의 ref 기반 클릭)로 열고 닫히는지 꼭 확인하세요.

---

## 5. 캐시버스팅(`?v=`) 규칙

`style.css`, `app.js`, `data.js`는 모든 HTML에서 `<link>`/`<script>` 태그에 `?v=버전문자열` 쿼리스트링을 붙여 로드합니다. **이 세 파일 중 하나라도 내용을 고치면, 그 파일을 참조하는 모든 HTML의 버전 문자열을 새로 바꿔야** 브라우저·Cloudflare 캐시가 새 내용을 내려줍니다.

```bash
# 예: style.css를 고친 뒤
grep -oh 'style\.css?v=[a-zA-Z0-9_-]*' *.html | sort -u   # 현재 버전 확인
find . -maxdepth 1 -name "*.html" -print0 | xargs -0 sed -i '' \
  's/style\.css?v=이전버전/style.css?v=새버전-YYYYMMDD/g'
```

버전 문자열은 의미 있는 이름 + 날짜로 짓는 관례입니다(예: `light-theme-fix-20260718`, `error-codes-20260718`). 세 파일 중 바뀌지 않은 것은 버전을 그대로 두세요(불필요한 캐시 무효화 방지).

`search-index.js`는 쿼리스트링 없이 로드되므로 버전 관리가 필요 없습니다 — `build-search-index.mjs`를 재실행하면 파일 내용 자체가 바뀌고 그걸로 끝입니다.

---

## 6. 배포 전 체크리스트

1. `node scripts/check-links.mjs` — 깨진 링크 0개 확인
2. `data.js`/`games-data.js`를 고쳤다면 `node scripts/build-search-index.mjs`
3. `style.css`/`app.js`/`data.js`를 고쳤다면 해당 파일의 `?v=` 버전을 전체 HTML에 반영했는지 확인
4. 새 페이지를 만들었다면 `sitemap.xml`에 추가했는지 확인
5. 로컬에서 실제로 열어서 확인(아래 "로컬 미리보기" 참고) — 특히 모달/폼처럼 상호작용이 있는 요소는 실제 클릭으로 테스트
6. `git status`로 의도한 파일만 변경됐는지 확인 후 커밋

### 로컬 미리보기

```bash
node scripts/dev-server.mjs   # http://localhost:8811
```

### git push가 거부될 때

`git push`가 "fetch first"로 거부되면 **강제 push 금지**. `git fetch origin` 후 `git log origin/main`으로 원격에 어떤 커밋이 있는지 먼저 확인하세요. 다른 세션(다른 AI 포함)이 같은 저장소를 건드리고 있을 수 있습니다. `git merge origin/main`으로 병합하고, 충돌이 나면 어느 쪽 변경이 더 최신/정확한지 내용을 직접 비교해서 수동으로 판단하세요(단순히 한쪽으로 덮어쓰지 말 것).

---

## 7. 수익화

- **AdSense**: 게시자 ID `ca-pub-9907102461716567`가 이미 모든 페이지 `<head>`에 들어가 있습니다. 계정/정책 관련 세부 사항은 `ADSENSE_SETUP.md` 참고.
- **Coupang Partners**: 하드웨어 관련 페이지 일부에 제휴 링크 존재. 새로 추가할 때는 기존 페이지의 링크 형식과 disclosure 문구를 그대로 따르세요(공정위 표시 의무).

---

## 8. AI 백엔드 (Mac mini)

`ai-service/app.py`가 Mac mini에서 실행되며 `https://ai.itsvc.co.kr`로 노출됩니다. 코드 수정 후 배포:

```bash
git pull && ./ai-service/deploy.sh   # Mac mini에서 직접 실행
```

`SYSTEM_PROMPT`와 `strip_hanja()` 후처리(정규식 `[一-鿿]+` 제거)가 모델(qwen 계열)이 한국어 답변에 중국어 한자를 섞어 내는 문제를 막기 위해 들어가 있습니다 — 모델을 교체하거나 프롬프트를 크게 바꾼 뒤에는 실제 한글 답변에 한자가 섞이지 않는지 확인하세요.

AI 서버가 응답하지 않을 때를 대비해 `app.js`의 관련 기능(AI 진단, 로그 AI 요약, 진단 카트 종합 분석)은 모두 timeout 후 규칙 기반 폴백으로 전환됩니다 — 서버 다운이 곧 사이트 장애로 이어지지 않습니다.

---

## 9. 문의/피드백 채널

`.github/ISSUE_TEMPLATE/site-feedback.yml`을 통해 GitHub Issue로 피드백을 받을 수 있습니다. `contact.html` 페이지도 참고하세요.

---

## 10. 자주 하는 실수 모음

- 새 오류 코드/증상/게임 페이지를 만들고 `sitemap.xml` 추가를 깜빡함.
- `data.js`를 고치고 `?v=` 버전을 안 올려서 배포해도 사용자에게는 캐시된 옛 내용이 보임.
- `style.css`에 전역 `:root`/`body` 색상을 재선언해서 "고치려던" 문제와 무관한 다른 페이지를 망가뜨림 — 반드시 스코프된 클래스 선택자로 좁혀서 고칠 것.
- 외부에서 받은 리포트(다른 AI가 만든 요약 등)의 기술적 사실(코드명, 원인 등)을 검증 없이 그대로 반영.
- `git push` 거부 시 원격 상태 확인 없이 강제 push.
