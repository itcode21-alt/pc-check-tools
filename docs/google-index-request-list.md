# 구글 서치콘솔 색인 요청 목록

마지막 갱신: 2026-11-19. 상태 기록은 `docs/WORKLOG.md`의 "색인 요청" 항목과 함께 본다.

## 진행 방법
1. 서치콘솔(sc-domain:itsvc.co.kr) 상단 검색창에 아래 URL을 넣어 URL 검사를 한다.
2. 결과가 "URL이 Google에 등록되어 있음"이면 요청하지 않고 건너뛴다.
3. "등록되어 있지 않음"이면 "색인 생성 요청"을 누르고 약 30초 기다린다. "우선순위 크롤링 대기열에 추가"가 나오면 접수다.
4. "할당량 초과"가 나오면 즉시 멈추고, 그 URL을 다음 시도의 첫 번째로 남긴다. 하루에 접수되는 수는 6~9개 안팎이었다.
5. 함정: 성공 팝업이 떠 있으면 검색창 입력이 먹지 않는다. 팝업을 닫고, 검사 결과의 URL이 바뀐 것을 확인한 뒤 요청한다.

## 다음에 할 것
11/17 오류 코드 보강 페이지 재요청은 11/19에 모두 접수해서 대기 목록이 비었다. 새로 본문을 크게 고친 페이지가 생기면 여기에 적고, 아래 절차로 요청한다.
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
