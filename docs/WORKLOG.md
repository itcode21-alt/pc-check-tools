# 작업 일지 (장치 간 공유용)

이 파일은 맥북·데스크탑처럼 여러 장치에서 클로드로 작업할 때 맥락을 이어 가기 위한 기록입니다.
저장소가 **공개(PUBLIC)**이므로 개인정보, 인증 정보(API 키·토큰), 계정 이메일, 내부 사업 사정은 적지 않습니다.

## 운영 방법
1. 작업을 시작할 때 `git pull` 후 이 파일을 먼저 읽습니다.
2. 작업을 마치면 "작업 이력"에 한 줄을 추가하고, 바뀐 "남은 일"·"색인 요청 기록"을 고쳐 커밋합니다.
3. 클로드에게는 "작업 일지 갱신해 줘"라고 하면 됩니다. (저장소 루트의 `CLAUDE.md`가 이 파일을 읽도록 안내합니다.)
4. 개인적이거나 민감한 메모는 이 파일이 아니라 각 장치의 로컬 메모리에 둡니다.

## 사이트 구조와 파이프라인
- 사이트: https://itsvc.co.kr (GitHub Pages 정적 사이트, main에 푸시하면 배포). 한국어 Windows·하드웨어·게임 오류 진단 가이드.
- `data.js`가 원본입니다. 아래 파생 파일은 직접 고치지 말고 스크립트로 재생성합니다.
  ```
  node scripts/split-data.mjs
  node scripts/build-detail-bundles.mjs
  node scripts/build-search-index.mjs
  node scripts/build-kb.mjs
  node scripts/generate-rss.mjs
  node scripts/sync-sitemap-lastmod.mjs --write   # 수정일(dateModified)을 올린 뒤 사이트맵 lastmod 동기화
  ```
- **실행하지 않는 스크립트**: `scripts/generate-sitemap.mjs`, `scripts/generate-game-pages.mjs`(수기로 다듬은 내용을 덮어씀). 사이트맵은 위 동기화 스크립트로만 날짜를 고칩니다.
- 오류 코드·증상 상세 페이지(`data-error-code-page` 등)는 `app.js`가 `data.js`로 본문을 다시 그립니다. 정적 HTML의 `STATIC_FALLBACK` 구간은 크롤러·무JS용이므로 데이터를 바꾸면 손으로 맞춰 줍니다.
- 게임 허브(`game-*.html`)의 목록 데이터는 `games-data.js`(진단 도구에서도 사용)와 HTML 두 곳에 있어 **둘 다** 고칩니다.
- 장치 관리자 코드 중 12·14·18·22·29·32·40·48·52는 개별 페이지 없이 `device-manager-codes.html?code=…`에서 데이터로만 그려집니다.
- **캐시 버스터**: 공유 자산(`app.js`, `data.js`, `search-index.js`, `games-data.js`, `game-status.js`, `repair-cta.js` 등)을 바꾸면 모든 HTML(`en/` 포함)의 `?v=` 문자열을 같이 올려야 합니다. `node scripts/check-asset-versions.mjs`로 확인합니다.
- 커밋 훅(우회 금지, `--no-verify` 쓰지 않기): 자산 버전, 링크, RSS 최신성(dateModified 변경 시 `rss.xml` 재생성), 콘텐츠 품질, 정적 이미지, KB 최신성, 정책 링크, 공용 스크립트.
- `data.js`처럼 큰 파일은 Python 스크립트로 구간을 찾아 치환하고 `node --check data.js`로 확인합니다. 메타 설명은 한글 80~110자.
- 푸시가 거절되면(원격이 앞섬) `git pull --no-rebase origin main` 후 다시 푸시합니다. 충돌이 캐시 토큰 때문이면 내 변경을 되돌려 원격을 받은 뒤 같은 작업을 다시 적용하는 편이 안전합니다.

## 작업 규칙
- **정확성이 최우선**입니다. 공식 문서(Microsoft·Riot·게임사 지원 문서)로 확인된 내용만 씁니다. 확인하지 못한 것은 "확인하지 못했다"고 적고, 공식 문서에 없는 점검은 "문서 외 일반 점검"으로 구분합니다.
- 애드센스 품질 유지: 같은 문장을 여러 페이지에 복붙하지 않고, 미확정 정보·근거 없는 수치를 쓰지 않으며, 같은 모양으로 일괄 보강하지 않습니다.
- 모든 응답과 커밋 메시지는 한국어로 씁니다.
- 일러스트·목업 이미지는 넣지 않습니다. 이미지 삭제는 중복본이 아니면 2회 이상 검토합니다.
- 색 구분이 필요하면 기존 4톤(danger/warning/info/neutral) 안에서 해결합니다(알록달록한 팔레트 금지).
- 정규식 일괄 편집 전에는 이미 손으로 만든 예외(`<picture>` 등)를 먼저 grep합니다.
- 네이버 서치어드바이저는 클로드 도구로 접근이 막혀 있어 **사용자가 직접** 수집 요청을 제출합니다. 블로그 게시도 사용자가 직접 합니다.

## 현황 요약 (2026-11-17 기준)
- 유입(GA4, 28일, 세션 3,618): 네이버 검색·블로그 약 78%, Bing 11%, 직접 8%, 구글 0.9%(구글은 적지만 참여 품질이 가장 높음). 주요 이벤트는 `repair_cta`만 지정.
- 구글 서치콘솔 기준값(2026-11-10): 색인 201 / 미색인 317, 클릭 61 / 노출 1,384. 2~4주 뒤 재비교.
- Bing AI 성능(Copilot 인용, 3개월): 인용 6.7K. 상위: 이벤트 뷰어 가이드, 장치 관리자 코드 45, 네트워크 가이드, 복구 도구 가이드 등.
- 네이버 검색 키워드 상위(11/17 스크린샷): 뱅가드 해결방법, 0x00000709, 메이플 실행 안 될 때, 피파 실행 오류, 스타크래프트 배틀넷 오류 등.

- 영문 페이지(`/en/`) GA4 유입(10/20~11/16, 28일): 조회수 19회(전체의 0.4%), 활성 사용자 9명, 평균 참여 9초. 상위는 `event-log-analyzer` 4회·3명이고 나머지는 1~2회씩. 소스·국가는 미확인. 영문 페이지 117개 중 조회가 있었던 것은 10여 개뿐. 12월 말 재검토(서치콘솔 `/en/` 색인·노출) 때 이 값을 기준으로 비교.

## 색인·수집 요청 기록
**구글(URL 검사 → 색인 생성 요청)** 하루 한도가 약 10건 안팎이고 "할당량 초과"가 나오면 그날은 중단. 요청 전 마지막 크롤링 날짜가 마지막 실제 변경일보다 앞설 때만 요청.
- 접수 완료: 장치 관리자 코드 45, 24(불확실), 43, 28, 31, 41, 1, 10, 37, 38 / 게임·기타 다수(11/14~16 기록은 로컬 메모리).
- **남은 순서**: 신규 `windows-bitlocker-recovery-key`, `windows-dxgi-device-removed-error`, `windows-bootmgr-missing`(11/17 추가, 최우선) → 장치 관리자 코드 39, 34 → `device-manager-codes`, `common-error-codes`, `security-access-errors` → `error-code-vanguard-error`, `game-lol`, `game-valorant`, `game-overwatch2` → `event-viewer-guide`, `hardware-screen-flicker`, `network-connection-guide` → 기존 백로그(`windows-network-drive-error`, `error-code-lostark-error`, `hardware-sound-not-working`, `windows-click-unresponsive`, `hardware-laptop-touchpad-not-working`, `game-poe2`, `windows-11-25h2-upgrade-issues`, `windows-update-tracker`, `news`, `error-codes-index`, 0x7b·0x116·0x80070005).
- 11/17에 다른 PC에서 5건 요청(어떤 페이지인지 미확인 — 알게 되면 여기에 적기).

**네이버(사용자 직접 제출)** 아직 미제출. 2026-11-17 최신 목록 59개(A 27 + B 26 + C 6, 우선순위 순서로 제출, 11/17 갱신). 11/10에 요청한 26건 중 이후 내용이 바뀐 것도 재요청 대상으로 포함.
- A. 검색 키워드 직결·제목 변경 27: `error-code-vanguard-error`, `game-starcraft2`, `windows-bsod-critical-process`, `error-code-c0000142`, `error-code-maplestory-error`, `game-maplestory`, `error-code-fconline-error`, `game-fconline`, `error-code-0x80070079`, `game-aion2`, `error-code-0x80070035`, `error-code-0x0000001a`, `error-code-msvcp140`, `error-code-suddenattack-error`, `game-suddenattack`, `game-blackdesert`, `game-lineageclassic`, `game-battlegrounds`, `game-lol`, `game-valorant`, `game-overwatch2`, `game-lostark`, `error-code-lostark-error`, `error-code-steam-connection-fail`, `error-code-battlenet-error`, `error-code-easyanticheat-error`, `error-code-lol-patch-error`
- B. 이번 주 공식 문서 기준으로 고친 페이지 26: 장치 관리자 코드 `error-code-device-manager-code-{1,10,24,28,31,34,37,38,39,41,43,45}`, `device-manager-codes`, `common-error-codes`, `security-access-errors`, `event-viewer-guide`, `hardware-screen-flicker`, `network-connection-guide`, `windows-update-tracker`, `error-code-1603`, `error-code-0x800f0922`, `guides`, `error-codes-index`, `windows-11-25h2-upgrade-issues`, `news`, `tools`
- C. 데스크탑에서 새로 만든 페이지 6: `remote-support`, `device-test`, `inspection-report`, `as-center-finder`, `parts-support`, `hardware-pawnio-driver-guide`
- 제외: `error-code-80070643`(noindex 리다이렉트), 캐시 토큰만 바뀐 페이지, `en/`, 관리자 페이지.
- 서치어드바이저 "사이트맵·RSS(`rss.xml`) 제출" 여부는 사용자 확인 필요.

**Bing**: 사이트맵 2개 등록(www 쪽은 중복, 삭제는 선택). IndexNow는 배포 때 바뀐 HTML만 제출하되 `?v=` 토큰만 바뀐 파일은 제외하도록 수정함(11/17). 효과(제출 수 감소)는 다음 배포 후 확인. 수동 URL 제출 할당량 하루 100건.

## 남은 일
- [ ] (11/18 이후) GA4에서 새 이벤트 `tool_click`, `outbound_official`, `affiliate_click`(선택: `game_status_report`)를 주요 이벤트로 지정. `next_page_click`은 일반 이벤트로 유지.
- [ ] 구글 색인 요청 이어서(위 "남은 순서").
- [ ] 사용자: 네이버 수집 요청 41개 제출, Daum 검색등록 제출(폼 값은 별도 안내), Bing www 사이트맵 삭제(선택).
- [ ] 게임 허브 대조 계속: 로스트아크·배틀그라운드·검은사막·메이플·던파·서든어택·FC온라인·PoE2, 롤의 나머지 항목, 발로란트 나머지 항목. 블리자드·넥슨 문서는 로그인·차단으로 본문 확인이 어려움. Steam 문서는 제목만 확인됨.
- [ ] 아직 공식 문서와 대조하지 않은 오류 코드 약 150개, 7/14~15 이후 손대지 않은 게임 오류 약 130개.
- [ ] 공식 출처가 없는 인용 상위 페이지: `windows-disk-usage-100`(MS 공식 문서 못 찾음), `hardware-gamepad-controller-not-detected`, `network-specific-website-not-loading`.
- [ ] 모바일 헤더(약 230px) 축소 검토는 디자인 변경이라 사용자 승인 후 진행.
- [ ] POE2 정식 출시(2026-12-12) 사전 공지 확인 → 11/28 이후 `game-poe2.html` 갱신(`docs/game-watch.json`, `docs/GAME_LAUNCH_PLAYBOOK.md` 참고).

## 효과 확인 일정
- 11/24~12/1: 게임 오류 페이지 개선(접속 신고 위젯 확장, 첫 화면 요약, 점검 항목 바로가기)의 효과를 GA4 평균 참여 시간·`next_page_click`·`tool_click`으로 비교.
- 12월 초: 구글·네이버 실적을 11/10 기준값과 비교. 제목을 바꾼 11개 페이지(뱅가드, 스타크래프트, critical process died, 0xc0000142, 메이플, FC온라인, 0x80070079, 아이온2, 0x80070035, 0x1A)의 네이버 키워드 클릭률 비교.
- 다음 배포 뒤: Bing IndexNow 제출 수가 수십 건 수준으로 줄었는지 확인.

## 다른 장치·다른 세션에서 반영된 작업 (11/17, 저장소 기록 기준)
이 목록은 푸시된 커밋을 보고 정리했습니다. 이 일지를 쓰는 세션이 직접 한 작업이 아니며, 세부는 각 커밋 메시지를 참고하세요.
- 원격 점검 전환 구조: `remote-support.html`(원격지원), 상단 띠 배너, `device-test.html`(장치 테스트, GPU 확인 추가), `inspection-report.html`(점검 확인서, 문의 QR 코드 포함), 제조사 A/S 안내.
- A/S 센터·정품 조회: `as-center-finder.html`, `parts-support.html`, 브랜드별 유통사·센터 데이터를 JSON 단일 원본으로 정리·검증.
- 가이드 신규: `hardware-pawnio-driver-guide.html`(PawnIO 드라이버 설치·확인·제거). SSD 건강 판정 영문판 `en/ssd-health-check.html` 추가.
- 디자인: 제목 글꼴 Paperlogy 적용, 가이드 3열 레이아웃 복구, 도구·안내 페이지 읽기 폭 제한.
- 웹 클로드 세션(`ccr-…` 브랜치) PR로 저장소 규칙 `CLAUDE.md`(CI·캐시 토큰·푸시 전 점검)와 프로젝트 스킬이 추가됨. 이 파일의 `CLAUDE.md`는 그 규칙과 장치 간 공유 규칙을 합친 것.
- **색인·수집 요청 후보(신규 페이지)**: `remote-support`, `device-test`, `inspection-report`, `as-center-finder`, `parts-support`, `hardware-pawnio-driver-guide` — 구글·네이버·Bing 요청 여부 미확인. 다른 장치에서 이미 요청했다면 알려 주세요.

## 작업 이력 (최신순)
- 11/17 오류 코드 보강 6개(0x8007000D·0x800705B4·0x80070057·0x80070005·0x80070002·0xC1900101): Microsoft 지원 문서 'Windows 업데이트 문제 해결'(support.microsoft.com/help/10164)의 코드별 원인·단계를 첫 점검에 반영하고 문서 외 점검은 구분 표기. 정정: 0x80070005 FAQ가 프린터 문답으로 잘못 들어가 있었고 0x80070002의 '10GB 권장'은 문서의 16GB(32비트)/20GB(64비트)로 바로잡음. 페이지 본문에는 '이전에 ~였다' 같은 수정 이력 문장을 넣지 않음(이력은 이 일지에만). 토큰 `e3-idx-1117`/`e3-20261117`. 같은 문서가 0x80070003·0x8007000E·0x80080005·0x80248014·0x80246007·0x800F0922도 다루므로 다음 배치 후보. 남은 미대조 오류 코드 약 130개. Daum 검색등록은 register.search.daum.net(등록 흐름: 서비스·URL → 동의 → 정보 입력 → 확인·신청 → 검토 → 노출).
- 11/17 오류 코드 보강 6개(0x800F081F·0x800F0831·0x80073712·0x800B0101·0x80072F8F·0x8024A105; Microsoft 업데이트 손상 해결·0x800F0831·0x80072F8F·일반 업데이트 문제 해결 문서 대조). 발견·정정: ① 0x800F0831·0x800B0101의 FAQ가 블루스크린 덤프 문답으로 잘못 들어가 있었음 → 코드에 맞게 교체. ② 0x80073712의 '디스크 10GB 권장'은 근거 없어 Microsoft 문서의 16GB(32비트)/20GB(64비트)로 정정. ③ 0x8024A105는 공식 오류 목록에 정의가 없고 기존 출처도 이 코드를 다루지 않아, '다운로드 실패' 단정을 제거하고 제목을 'Windows Update 오류(공식 오류 목록에 없는 코드)'로 변경, 출처는 Microsoft 일반 업데이트 문제 해결 문서로 교체. ④ `data.js`에 `C:\Windows\...`가 역슬래시 하나로 적혀 JS에서 `C:WindowsLogsCBSCBS`처럼 깨져 보이던 경로 7곳(오류 코드·증상 12개 페이지)을 이스케이프 수정. 함정: data.js에는 한 줄형 항목이 있어 코드 블록 탐색 때 `code: "…", title:` 한 줄 형식을 같이 처리해야 하고, JSON으로 읽을 수 없는 값(잘못된 이스케이프)이 있으면 보강 스크립트가 실패함. 토큰 `e2-idx-1117`/`e2-20261117`. 남은 미대조 오류 코드 약 135개.
- 11/17 오류 코드 보강 6개(Microsoft Windows Update 오류 목록·다운로드 오류 문서 대조): 0x80240034는 제목이 'WU_E_UNKNOWN 알 수 없는 오류'로 잘못 적혀 있어 공식 정의 WU_E_DOWNLOAD_FAILED(업데이트 다운로드 실패)로 바로잡고 다른 페이지의 연결 목록 제목도 정정. 0x8024402C(프록시·서버 이름 확인 실패), 0x80070020(InstallFileLocked, 백신·백업 검사 중 파일), 0x80070422(서비스 중지), 0x80240FFF(WU_E_UNEXPECTED), 0x80072EFD(방화벽·프록시의 Microsoft URL 차단)에 공식 정의·해결 안내를 넣고 문서 외 점검은 구분 표기. 토큰 `ec-idx-1117`/`ec-20261117`. 남은 미대조 오류 코드 약 140개(Windows Update 계열은 0x800F081F·0x800F0831·0x80073712·0x80072F8F·0x8024A105·0x800B0101 등이 다음 후보).
- 11/17 신규 가이드 3개(BitLocker·DXGI·BOOTMGR)를 기존 페이지 사이드바·본문에서 연결: 0xc000000f, 0xc0000225, 자동 복구 루프, 복구 도구 가이드, 그래픽 드라이버 응답 없음, Display 4101, 0x116, 게임 프레임 저하, MS 계정 로그인 실패, BIOS 부팅 가이드(BIOS 업데이트 전 BitLocker 일시 중단 안내 추가). 정적 HTML만 수정(데이터·자산 변경 없음).
- 11/17 신규 가이드 2개: `windows-dxgi-device-removed-error.html`(DXGI_ERROR_DEVICE_REMOVED 0x887A0005; Microsoft DXGI·TDR 문서, TDR 레지스트리는 사용자 조작 금지 안내 반영)와 `windows-bootmgr-missing.html`(BOOTMGR is missing; Microsoft Windows 시작 문제 해결 문서의 시작 복구·bootrec·BCD 순서). 문서 외 점검은 구분 표기, 명령은 Windows 복구 환경에서 실행해 보지 못함. 토큰 `bm-idx-1117`/`bm-20261117`. 색인 요청 후보(신규 3개: BitLocker·DXGI·BOOTMGR) — 이번 주 신규 가이드가 규칙(7일 2개 이하)을 넘으므로 당분간 신규 페이지 중단, 보강 위주.
- 11/17 신규 가이드 `windows-bitlocker-recovery-key.html`(BitLocker 복구 키 48자리 입력 화면): Microsoft 공식 문서 4건(복구 키 찾기·복구 개요·작업 가이드·디바이스 암호화) 기준, 문서 외 점검은 구분 표기. data.js 증상 `bitlocker-recovery-key-screen`, guides·사이트맵·RSS·검색색인·KB 반영, 토큰 `bl-idx-1117`/`bl-20261117`. 색인·수집 요청 후보에 추가. 다음 신규 후보: DXGI_ERROR_DEVICE_REMOVED(0x887A0005), 부팅 장치 없음(BOOTMGR). 새 페이지는 7일 2개 이하 규칙 적용.
- 11/17 모바일(≤680px) 헤더 높이 축소: 헤더를 grid로 바꿔 로고·다크 모드·메뉴 버튼을 한 줄, 검색창을 둘째 줄로(약 229px → 약 100px). `style.css` 토큰 `ui-20261117g`. 데스크톱·태블릿은 변경 없음. 남은 디자인 보류: 오류 코드 상세의 `code-icon`/`code-chip`(사용자 결정으로 유지).
- 11/17 사이트 전반 점검(낡은 문장·목록 누락·사이트맵·외부 링크 451개·모바일 18페이지 가로 넘침): 죽은 링크 1건(`parts-support.html`의 ECS 서비스 센터 URL 404, ECS 사이트 자체 메뉴도 같은 404)을 기술 지원 문의 양식 페이지로 교체. 나머지 이상 없음. 모바일 헤더 약 229px 축소와 `code-icon`/`code-chip` 스타일은 사용자 결정 대기·보류 항목이라 건드리지 않음.
- 11/17 롤 허브 4개 항목(클라이언트 크래시, 그래픽 장치 초기화, 서버 연결, Error 004)에 Riot 오류 코드 문서(support.riotgames.com/ko-kr/league-of-legends/performance/league-error-codes-and-solutions, 2025-05-19 게시) 내용 반영: 0xc0000005·치명적인 오류·DirectX 오류(game.cfg)·d3dx9_43.dll·Error 7·1B·002. 문서 외 점검은 구분 표기. 롤 나머지 항목(자리비움·리플레이·소리 등)과 발로란트 나머지는 미대조.
- 11/17 게임 허브 출처 URL 137개를 일괄 점검(HTTP 응답·이동 여부): 로스트아크 허브 9개 항목의 공식 출처 `lostark.support.onstove.com/hc/ko`가 로스트아크 서비스 이용약관 페이지로 이동하는 것을 발견해 실제 고객센터(`cs.onstove.com/ko/service/45`)와 약관(`clause.onstove.com/stove/terms?…game_id=45`)으로 교체. 나머지는 정상(Riot 등은 언어 경로만 이동). 블리자드·Pearl Abyss·PUBG 지원 문서는 스크립트로 읽히지 않아(차단·로그인) 본문 대조 불가. 남은 점검: 출처가 사이트 루트·목록 페이지인 항목(PUBG 8개 `support.pubg.com/hc/ko`, 검은사막 4개 등)은 항목별 문서로 바꿀 수 있는지 확인 필요.
- 11/17 영문 페이지 현황 점검(117개, 한국어 이벤트 125개 중 115개 번역, 본문 한글 잔존 없음, hreflang 정상)과 GA4 영문 유입 측정(위 현황 요약 참고).
- 11/17 `CLAUDE.md` 정리: 장치 간 공유 규칙과 웹 클로드가 만든 CI·구조 규칙을 7개 섹션(세션 시작/작업 종료/반드시 지킬 것/원본·파생/캐시 토큰/푸시 전 점검/PR 흐름)으로 재구성, 중복 제거.
- 11/17 장치 간 공유 체계 도입: `docs/WORKLOG.md`와 `CLAUDE.md`(작업 단위마다 일지를 같은 커밋에 갱신·푸시).
- 11/17 뱅가드 오류 페이지에 Riot 공식 VAN 코드 7개(9007·9051·9005·148·128·193·83) 추가, 롤 패치 멈춤을 공식 문서 기준으로 보강.
- 11/17 롤 허브 Error 004를 Riot 공식 문서로 교체(기존 출처가 무관한 문서였음).
- 11/17 게임 허브 대조: 오버워치는 2026-02 개명("오버워치")을 반영해 "오버워치(구 오버워치 2)" 병기, 확인 불가한 배치 경기 수 삭제. 발로란트 VAN 59(로그인 대기열)·VAN 51(파티 개설)을 Riot 공식 설명으로 교체(기존엔 Vanguard 드라이버 오류로 잘못 설명).
- 11/17 네이버 검색 키워드 TOP30 반영: 11개 페이지 제목·설명 보강, `msvcp140` 페이지에서 서든어택 허브 연결.
- 11/17 사이트맵 lastmod 69개 정정 + `scripts/sync-sitemap-lastmod.mjs` 추가.
- 11/17 Bing 인용 상위 페이지 보강(이벤트 뷰어 가이드, 화면 깜빡임, 네트워크 연결 가이드에 공식 안내·출처).
- 11/17 오류 페이지 첫 화면에 '먼저 해 볼 것·흔한 원인' 요약과 점검 항목 바로가기, 접속 신고 위젯을 게임 오류 페이지 8곳으로 확장.
- 11/17 GA4 행동 이벤트 추가(`outbound_official`, `affiliate_click`, `tool_click`, `next_page_click`, `game_status_report`), IndexNow가 캐시 토큰만 바뀐 HTML을 제외하도록 수정.
- 11/16~17 장치 관리자 오류 코드 전체(개별 12 + 공유 페이지 9 + 짧은 일반 코드 9)를 Microsoft 공식 문서 기준으로 보강. 공식 문서가 정의만 주는 코드는 그 사실을 밝히고 점검은 "문서 외 일반 점검"으로 구분.
- 11/14~16 0x800F0922, 1603·0x80070643 병합, 오류 코드 템플릿 중복 정리, 게임 출시·패치 선점 체계, 수리 사례 기록 양식, 게임 접속 신고 위젯, 낡은 내용 점검 스크립트(`scripts/audit-stale-content.mjs`).
