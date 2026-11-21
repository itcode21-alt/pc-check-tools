# 구글 서치콘솔 색인 요청 목록

마지막 갱신: 2026-11-21. 상태 기록은 `docs/WORKLOG.md`의 "색인 요청" 항목과 함께 본다.

## 진행 방법
1. 서치콘솔(sc-domain:itsvc.co.kr) 상단 검색창에 아래 URL을 넣어 URL 검사를 한다.
2. 결과가 "URL이 Google에 등록되어 있음"이면 요청하지 않고 건너뛴다.
3. "등록되어 있지 않음"이면 "색인 생성 요청"을 누르고 약 30초 기다린다. "우선순위 크롤링 대기열에 추가"가 나오면 접수다.
4. "할당량 초과"가 나오면 즉시 멈추고, 그 URL을 다음 시도의 첫 번째로 남긴다. 하루에 접수되는 수는 6~9개 안팎이었다.
5. 함정: 성공 팝업이 떠 있으면 검색창 입력이 먹지 않는다. 팝업을 닫고, 검사 결과의 URL이 바뀐 것을 확인한 뒤 요청한다.

## 다음에 할 것
**11/21 신규 자가진단 6페이지(1순위, 모두 크롤링 기록 없는 새 페이지)** — 접수 완료: `pc-boot-check`, `pc-display-check`. **`pc-network-check`에서 "월 할당량 초과 — 내일 다시 제출해 주세요"로 중단**(그 URL이 다음 시도의 첫 번째). 남은 순서: `pc-network-check` → `pc-slow-check` → `pc-storage-check` → `pc-input-check`. 그다음 아래 기존 후보(11/15 신규 7개 등). 자가진단 연결 박스가 추가된 증상 가이드 47곳은 본문 변화가 작아 요청하지 않음(구글이 스스로 재크롤링하는지 6~8주 뒤 Search Console 마지막 크롤링 날짜로 확인).

**11/21 근거 없는 메모리 문장 정정 3페이지(2순위, 본문이 바뀐 기존 페이지)** — `error-code-0x0000013a`, `error-code-0x00000139`, `error-code-0x000000be` (11/21 푸시 `500ef8fc6`). "램이 원인입니다" 단정을 "문서 외 일반 점검/가능성"으로 고친 페이지라 URL 검사에서 마지막 크롤링이 11/21보다 앞서면 요청한다. `0x0000013a`는 이전 요청 기록이 없고, `0x00000139`·`0x000000be`는 11/20 이전 요청 기록이 이 저장소에 없다. 1순위(자가진단 6페이지) 다음에 한다.
- 요청하지 않음: 같은 날 자가진단 박스만 덧붙인 오류 코드 페이지(0x1A·0x50·0x12B·0x7F·0x19·0x109·0xC2 등)는 본문 변화가 작아 제외.

**11/20 점검으로 추가한 후보(구글 요청 기록에 없는 페이지)** — 모두 URL 검사부터 하고 이미 등록돼 있으면 건너뛴다. 11/14~16 요청 기록은 로컬 메모리에만 있어 이 저장소에서는 확인되지 않는다.
- 11/15에 만들었는데 이 저장소 기록에 요청이 없는 7개: `regional-insurance-calculator`, `bluescreen-code-finder`, `printer-troubleshooting-wizard`, `payslip-deductions-guide`, `retirement-health-insurance-guide`, `printer-keeps-offline-fixed-ip-guide`, `bluescreen-find-stop-code-guide`.
- 본문이 크게 바뀐 허브·도구 페이지(11/18~11/20 리디자인·기능 보강): `tools`(새 첫 화면·문구·카드 3개), `games-diagnostic`(게임 허브: 표시 N개/전체 N개·추가 요청 링크), `guides`(분류별 아코디언), `event-codes-index`(ID 칩·원본·의미 4열), `remote-support`(카카오 버튼 제거·판다), `minidump-analyzer`(처리 방식 배지·서버 분석 안내·실행 전 확인 안내), `community-cases`(리디자인, Worker 새 코드 배포 뒤에 요청하는 편이 낫다).
- 후순위: `en/index.html`(영문 홈 개편, 영문 75개 유지 결정 기준으로 낮은 우선순위).
- 요청하지 않음: 마크업만 바뀐 FAQ 아코디언 19개 페이지, OG 이미지·캐시 토큰만 바뀐 페이지(본문 텍스트 변화 없음).

**다음에 할 것(할당량 초과로 남음)**: 11/15 신규 7개 중 `regional-insurance-calculator`부터(11/21 검사: "Google에는 아직 알려지지 않은 URL", 요청 시 "할당량 초과"), 이어서 `bluescreen-code-finder`, `printer-troubleshooting-wizard`, `payslip-deductions-guide`, `retirement-health-insurance-guide`, `printer-keeps-offline-fixed-ip-guide`, `bluescreen-find-stop-code-guide`, 그 다음 허브 7개. 나머지 대기 목록은 없음. 11/17 오류 코드 보강 페이지 재요청은 11/19에 모두 접수해서 대기 목록이 비었다. 새로 본문을 크게 고친 페이지가 생기면 여기에 적고, 아래 절차로 요청한다.
절차: URL 검사 → 마지막 크롤링이 변경일보다 앞서면 '색인 생성 요청'. '최근 크롤링' 날짜는 접힌 영역에 있어 JS로 `document.body.textContent`에서 '최근 크롤링' 뒤를 읽는다.
주의: 연결된 브라우저 번호는 세션마다 바뀐다. 이 속성 권한이 없는 계정이면 '이 속성에 액세스할 수 없습니다'가 뜨니 `list_connected_browsers`로 권한 있는 쪽을 고른다. 완료 팝업이 뜨기까지 40초쯤 걸리고, '오류 발생: 나중에 다시 시도' 팝업은 할당량 초과가 아니라 일시 오류라서 페이지를 새로 열어 한 번 더 하면 접수된다(0x80070005가 그랬다).

## 완료 기록
- 11/17 접수: dm 45·24·43·28, `windows-bitlocker-recovery-key`, `windows-dxgi-device-removed-error`
- 11/18 접수: `windows-bootmgr-missing`, dm-39, `security-access-errors`, `windows-network-drive-error`, `game-lol`, `game-valorant`, `hardware-sound-not-working`, `error-code-lostark-error`, `windows-click-unresponsive`
- 이미 등록돼 요청 생략: dm-1·10·31·34·37·38·41, `device-manager-codes`, `common-error-codes`, `error-code-vanguard-error`, `game-overwatch2`, `event-viewer-guide`, `hardware-screen-flicker`, `network-connection-guide`, `game-poe2`, `windows-11-25h2-upgrade-issues`, `windows-update-tracker`
- 11/19 접수: `hardware-laptop-touchpad-not-working`, `error-code-0x0000007b`(화면에 '색인 생성 요청됨' 표시 확인, 완료 문구는 못 잡음)
- 11/19 사용자가 직접 요청: `news`(요청 시도 전 확인했더니 구글봇이 11/19 12:51에 크롤링한 기록이 있었음, 색인 상태는 아직 '등록되어 있지 않음')
- 11/19 이미 등록돼 생략: `error-codes-index`, `error-code-0x00000116`, `error-code-0x80070005`
- 11/19 재요청 접수: `error-code-0x80070422`, `error-code-0x80070020`(요청 전 미등록이었음). `error-code-0x80070057`은 할당량 초과로 미접수.
- 11/19 재요청 접수(2차): `error-code-0x80070057`, `0x8024402c`, `0x80240fff`, `0x80072efd`, `0x800f081f`, `0x800f0831`, `0x80073712`, `0x800b0101`, `0x80072f8f`, `0x8024a105`, `0x8007000d` 11개. `0x800705b4`에서 할당량 초과. 같은 날 앞서 접수한 `0x80070422`, `0x80070020` 포함하면 보강 오류 코드 13개 재요청 완료.
- 11/19 재요청 접수(3차): `error-code-0x800705b4`, `0x80070005`(첫 시도 일시 오류, 재시도로 접수), `0x80070002`, `0xc1900101`, `0x80070003`, `0x8007000e`, `0x80070070`, `0x80070490`, `0x80073cf9`, `0xc004c003`, `0x803f7001`, `0xc004f050` 12개. 할당량 초과 없음. 11/17 보강 오류 코드 재요청 전부 끝(0x80240034만 구글이 스스로 재크롤링해 생략).
- 11/19 접수: `windows-cpu-usage-100`(요청 전 '등록되어 있지 않음', 크롤링 기록 없음이었음. 11/19 실수 항목 추가 반영분)
- 11/20 접수(문서 대조로 본문을 고친 페이지 21개, 할당량 초과 없음): `error-code-0x0000000a`·`0x0000001e`·`0x0000003b`·`0x00000050`·`0x0000007e`·`0x0000009f`·`0x000000d1`, `0x0000001a`·`0x00000024`·`0x0000007b`·`0x000000ef`·`0x000000f4`·`0x00000116`·`0x00000133`·`0x000000c5`, `0x0000004e`·`0x000000ea`·`0x000000a5`·`0x00000074`·`0x000000ed`, `game-steam`. 마지막 크롤링은 모두 수정 이전(0x7B는 11/19)이었음. 이 세션은 연결 브라우저가 처음엔 권한 없는 쪽이었다가 사용자가 다시 연결한 뒤 권한 있는 쪽으로 바뀜.
- 11/20 접수: `windows-update-tracker`(11/20 00:30에 KB5132057 카드 추가, 요청 전 마지막 크롤링 11/13). 이로써 11/20까지 본문이 바뀐 페이지는 모두 요청 끝. 요청 직후 팝업이 늦게(약 50초) 떠서 클릭 뒤 한 번 더 기다려야 접수를 확인할 수 있었음.
- 11/20 접수: 11/18에 새로 만든 계산기 3개 `social-insurance-calculator`·`hourly-wage-converter`·`pc-power-cost-calculator`(요청 전 모두 '등록되어 있지 않음', 크롤링 기록 없음). 11/18에 만들고도 구글 요청이 빠져 있던 것을 11/20에 발견해 요청.
- 11/20 접수(블루스크린 4차 보강 11개, 할당량 초과 없음): `error-code-0x0000009c`·`error-code-0x00000077`·`error-code-0x0000007a`·`error-code-0x00000101`·`error-code-0x00000117`·`error-code-0x00000109`·`error-code-0x00000154`·`error-code-0x000000f2`·`error-code-0x00000080`·`error-code-0x0000002e`·`error-code-0x0000007f`. `0x80`은 첫 시도에 일시 '오류 발생'이 떠서 새로 열어 재시도로 접수. `0x2E`는 로딩이 늦어 첫 읽기가 빈 값이었음(요청 전에 결과 화면이 뜬 뒤 다시 읽음).
- 11/20 접수(계산기 기능 보강분): `salary-calculator`·`retirement-pay-calculator`(두 페이지 모두 요청 전 "발견됨 - 현재 색인이 생성되지 않음", 크롤링 기록 없음. 11/15에 만들고도 요청이 빠져 있었음). `loan-calculator`는 "할당량 초과"로 미접수, 오늘 요청 누계는 앞선 36개 + 2개에서 멈춤. 11/20에 이미 접수한 `social-insurance-calculator`·`hourly-wage-converter`·`pc-power-cost-calculator`는 그 뒤 본문을 더 고쳤지만 아직 크롤링 전이라 재요청하지 않음(크롤링 후에도 마지막 크롤링이 변경일보다 앞서면 재요청).
- 11/20 재시도 접수: `loan-calculator`(검사 결과가 "알려지지 않은 URL"에서 "발견됨 - 현재 색인이 생성되지 않음, 참조 사이트맵 있음"으로 바뀌어 있었고 요청 접수됨). 이어서 `weekly-holiday-pay-calculator`는 다시 "할당량 초과"(월별·일일 할당량 문구, 오늘 누계 36+3). 오늘은 여기서 중단.
- 11/21 접수: `weekly-holiday-pay-calculator`(요청 전 "알려지지 않은 URL", 크롤링 기록 없음). 이어서 `regional-insurance-calculator`는 "월별 할당량을 초과" 팝업으로 미접수. 11/20(loan 1건)과 11/21(weekly 1건)처럼 할당량이 풀려도 1건만 받고 다시 차는 패턴이라, 하루 여러 건이 아니라 **하루 1건씩** 시도하는 편이 효율적일 수 있음(월 단위 한도 가능성).
- 11/21 접수: `pc-boot-check`, `pc-display-check`(둘 다 요청 전 "URL이 Google에 등록되어 있지 않음", 크롤링 기록·참조 사이트맵 없음이었고, 요청 후 "색인 생성 요청됨 — 우선순위 크롤링 대기열에 추가" 확인). 이어서 `pc-network-check`는 "월 할당량 초과" 팝업으로 미접수(URL 검사는 같은 "알려지지 않은 URL" 상태). 하루에 약 2건 접수 뒤 멈추는 패턴이 이어지는 중.
