# 구글 서치콘솔 색인 요청 목록

마지막 갱신: 2026-11-19. 상태 기록은 `docs/WORKLOG.md`의 "색인 요청" 항목과 함께 본다.

## 진행 방법
1. 서치콘솔(sc-domain:itsvc.co.kr) 상단 검색창에 아래 URL을 넣어 URL 검사를 한다.
2. 결과가 "URL이 Google에 등록되어 있음"이면 요청하지 않고 건너뛴다.
3. "등록되어 있지 않음"이면 "색인 생성 요청"을 누르고 약 30초 기다린다. "우선순위 크롤링 대기열에 추가"가 나오면 접수다.
4. "할당량 초과"가 나오면 즉시 멈추고, 그 URL을 다음 시도의 첫 번째로 남긴다. 하루에 접수되는 수는 6~9개 안팎이었다.
5. 함정: 성공 팝업이 떠 있으면 검색창 입력이 먹지 않는다. 팝업을 닫고, 검사 결과의 URL이 바뀐 것을 확인한 뒤 요청한다.

## 다음에 할 것
11/19에 앞선 목록(touchpad~0x80070005)을 모두 처리했다. 남은 것은 아래 재요청 대상 고르기뿐이다.
- 최근 내용이 크게 바뀐 페이지(11/17 오류 코드 보강 26개 등)를 URL 검사로 '마지막 크롤링' 날짜와 비교해 재요청 대상을 고른다.
- 새 페이지가 생기면 이 목록에 추가한다(신규 페이지는 URL 검사에서 미등록인 경우가 많다).

## 완료 기록
- 11/17 접수: dm 45·24·43·28, `windows-bitlocker-recovery-key`, `windows-dxgi-device-removed-error`
- 11/18 접수: `windows-bootmgr-missing`, dm-39, `security-access-errors`, `windows-network-drive-error`, `game-lol`, `game-valorant`, `hardware-sound-not-working`, `error-code-lostark-error`, `windows-click-unresponsive`
- 이미 등록돼 요청 생략: dm-1·10·31·34·37·38·41, `device-manager-codes`, `common-error-codes`, `error-code-vanguard-error`, `game-overwatch2`, `event-viewer-guide`, `hardware-screen-flicker`, `network-connection-guide`, `game-poe2`, `windows-11-25h2-upgrade-issues`, `windows-update-tracker`
- 11/19 접수: `hardware-laptop-touchpad-not-working`, `error-code-0x0000007b`(화면에 '색인 생성 요청됨' 표시 확인, 완료 문구는 못 잡음)
- 11/19 사용자가 직접 요청: `news`(요청 시도 전 확인했더니 구글봇이 11/19 12:51에 크롤링한 기록이 있었음, 색인 상태는 아직 '등록되어 있지 않음')
- 11/19 이미 등록돼 생략: `error-codes-index`, `error-code-0x00000116`, `error-code-0x80070005`
