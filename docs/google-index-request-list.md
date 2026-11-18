# 구글 서치콘솔 색인 요청 목록

마지막 갱신: 2026-11-19. 상태 기록은 `docs/WORKLOG.md`의 "색인 요청" 항목과 함께 본다.

## 진행 방법
1. 서치콘솔(sc-domain:itsvc.co.kr) 상단 검색창에 아래 URL을 넣어 URL 검사를 한다.
2. 결과가 "URL이 Google에 등록되어 있음"이면 요청하지 않고 건너뛴다.
3. "등록되어 있지 않음"이면 "색인 생성 요청"을 누르고 약 30초 기다린다. "우선순위 크롤링 대기열에 추가"가 나오면 접수다.
4. "할당량 초과"가 나오면 즉시 멈추고, 그 URL을 다음 시도의 첫 번째로 남긴다. 하루에 접수되는 수는 6~9개 안팎이었다.
5. 함정: 성공 팝업이 떠 있으면 검색창 입력이 먹지 않는다. 팝업을 닫고, 검사 결과의 URL이 바뀐 것을 확인한 뒤 요청한다.

## 다음에 할 것: 11/17 오류 코드 보강 페이지 재요청
11/17에 공식 문서 기준으로 본문을 보강한 오류 코드 페이지다. 구글이 마지막으로 크롤링한 날이 보강 이전(10/3~11/16)이어서 재요청 대상으로 골랐다.
URL 검사 화면에서 '최근 크롤링' 날짜가 11/17 이후이면 이미 반영된 것이니 건너뛴다. 날짜는 접힌 영역에 있으므로 JS로 `document.body.textContent`에서 '최근 크롤링' 뒤를 읽는다.
확인한 마지막 크롤링: 0x80240034·0x8024402c·0x80240fff·0x80072efd·0x800f081f는 2026-10-21, 0x800f0831은 2026-10-3, 0x80070057은 2026-11-16. 나머지는 미확인(비슷할 것으로 추정).

1. https://itsvc.co.kr/error-code-0x80070057.html
2. https://itsvc.co.kr/error-code-0x80240034.html
3. https://itsvc.co.kr/error-code-0x8024402c.html
4. https://itsvc.co.kr/error-code-0x80240fff.html
5. https://itsvc.co.kr/error-code-0x80072efd.html
6. https://itsvc.co.kr/error-code-0x800f081f.html
7. https://itsvc.co.kr/error-code-0x800f0831.html
8. https://itsvc.co.kr/error-code-0x80073712.html
9. https://itsvc.co.kr/error-code-0x800b0101.html
10. https://itsvc.co.kr/error-code-0x80072f8f.html
11. https://itsvc.co.kr/error-code-0x8024a105.html
12. https://itsvc.co.kr/error-code-0x8007000d.html
13. https://itsvc.co.kr/error-code-0x800705b4.html
14. https://itsvc.co.kr/error-code-0x80070005.html
15. https://itsvc.co.kr/error-code-0x80070002.html
16. https://itsvc.co.kr/error-code-0xc1900101.html
17. https://itsvc.co.kr/error-code-0x80070003.html
18. https://itsvc.co.kr/error-code-0x8007000e.html
19. https://itsvc.co.kr/error-code-0x80070070.html
20. https://itsvc.co.kr/error-code-0x80070490.html
21. https://itsvc.co.kr/error-code-0x80073cf9.html
22. https://itsvc.co.kr/error-code-0xc004c003.html
23. https://itsvc.co.kr/error-code-0x803f7001.html
24. https://itsvc.co.kr/error-code-0xc004f050.html

각 항목은 순서대로, 할당량 초과가 나오면 그 항목에서 멈춘다. 11/19에는 5번째 시도(0x80070057)에서 막혔다.

## 완료 기록
- 11/17 접수: dm 45·24·43·28, `windows-bitlocker-recovery-key`, `windows-dxgi-device-removed-error`
- 11/18 접수: `windows-bootmgr-missing`, dm-39, `security-access-errors`, `windows-network-drive-error`, `game-lol`, `game-valorant`, `hardware-sound-not-working`, `error-code-lostark-error`, `windows-click-unresponsive`
- 이미 등록돼 요청 생략: dm-1·10·31·34·37·38·41, `device-manager-codes`, `common-error-codes`, `error-code-vanguard-error`, `game-overwatch2`, `event-viewer-guide`, `hardware-screen-flicker`, `network-connection-guide`, `game-poe2`, `windows-11-25h2-upgrade-issues`, `windows-update-tracker`
- 11/19 접수: `hardware-laptop-touchpad-not-working`, `error-code-0x0000007b`(화면에 '색인 생성 요청됨' 표시 확인, 완료 문구는 못 잡음)
- 11/19 사용자가 직접 요청: `news`(요청 시도 전 확인했더니 구글봇이 11/19 12:51에 크롤링한 기록이 있었음, 색인 상태는 아직 '등록되어 있지 않음')
- 11/19 이미 등록돼 생략: `error-codes-index`, `error-code-0x00000116`, `error-code-0x80070005`
- 11/19 재요청 접수: `error-code-0x80070422`, `error-code-0x80070020`(요청 전 미등록이었음). `error-code-0x80070057`은 할당량 초과로 미접수.
