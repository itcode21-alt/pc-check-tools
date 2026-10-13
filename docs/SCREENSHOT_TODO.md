# 추가 필요한 캡처 이미지 리스트

기준일: 2026-10-13 / 현재 `assets/`에 캡처 ~90종, 이미지가 들어간 페이지 71개(전체 HTML 393개).
파일명 규칙: 기존과 동일하게 `영역-대상-상태.jpg` 촬영 후 `.webp` 변환본 함께 저장.

## 현황 요약
- 이미지 있는 이벤트 페이지 34 / 88개 → **54개 이벤트 페이지가 캡처 없음**
- BSOD(error-code-0x…) 페이지는 `0x00000050` 하나만 이미지 있음
- 문제 해결 가이드(windows-*, hardware-*)는 설정·장치 관리자 위주로만 일부 존재
- 빠진 파일(참조했는데 없음): 없음 / 어디에도 안 쓰는 파일: `icon-192.png`, `icon-512.png`(PWA용, 정상)

## A. 여러 페이지에서 재사용되는 공통 캡처 (최우선)
한 장으로 10개 이상 페이지에 쓸 수 있어 효율이 가장 좋음.

| # | 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|---|
| A1 | `winre-advanced-options-menu` | 고급 옵션 화면(문제 해결 > 고급 옵션) | auto-repair-loop, 0xc000000e, 0xc0000225, 0x80070057, 0xc000000f, 0x0000007b |
| A2 | `winre-startup-settings-safemode` | 시작 설정에서 4/5번(안전 모드) 선택 화면 | black-screen-after-login, bsod-critical-process, display-driver-crash, click-unresponsive |
| A3 | `winre-command-prompt-bootrec` | WinRE 명령 프롬프트에서 `bootrec /fixmbr` 등 실행 | 0xc000000e, 0xc0000225, auto-repair-loop |
| A4 | `cmd-sfc-scannow-result` | `sfc /scannow` 완료 메시지(무결성 위반 없음/복구함) | bsod-critical-process, shell-multiple-apps, app-not-launching, explorer-freeze |
| A5 | `cmd-dism-checkhealth-restorehealth` | DISM 진행률 100% 완료 화면 | shell-multiple-apps, device-manager-code-19, 0x80070057 |
| A6 | `cmd-chkdsk-result` | chkdsk 결과 요약(불량 섹터 없음) | nvme-delay, 0x0000007b, auto-repair-loop |
| A7 | `bios-secure-boot-tpm-status` | msinfo32 "보안 부팅 상태 / BIOS 모드" 화면 | windows-11-upgrade-blocked, click-unresponsive, app-not-launching |
| A8 | `bios-xmp-expo-setting` | BIOS XMP/EXPO 프로파일 메뉴(제조사 1~2종) | no-display, bsod-critical-process, 0x00000124 |
| A9 | `ddu-clean-uninstall-screen` | DDU 메인 화면(안전 모드, "Clean and restart") | display-driver-crash, black-screen-after-login, no-display |
| A10 | `windows-memory-diagnostic-result` | 재부팅 후 알림 영역 진단 결과(이미 진단 창은 있음) | bsod-critical-process, 0x000000a5, 0x00000124 |
| A11 | `eventviewer-find-event-by-id` | 이벤트 뷰어 "현재 로그 필터링"에서 ID 입력 | 모든 event-* 페이지 공통 안내용 |
| A12 | `reliability-monitor-overview` | 신뢰성 기록 보기(빨간 X 이벤트 목록) | 0x00000124, windows-update-errors-guide, app 오류 계열 |

## B. 서비스·네트워크 캡처 (문제 가이드에 빠져 있음)

| # | 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|---|
| B1 | `services-windows-update-properties` | services.msc의 Windows Update 속성(시작 유형/상태) | error-code-0x80070422, update-fail-loop |
| B2 | `services-windows-audio-restart` | Windows Audio 서비스 우클릭 > 다시 시작 | error-code-windows-audio-service-stopped |
| B3 | `settings-proxy-manual-off` | 설정 > 네트워크 > 프록시 수동 설정 꺼짐 | network-err-connection-refused, specific-website-not-loading |
| B4 | `inetcpl-lan-settings-proxy` | 인터넷 속성 > 연결 > LAN 설정 | network-err-connection-refused |
| B5 | `cmd-ipconfig-flushdns-winsock` | `ipconfig /flushdns`, `netsh winsock reset` 결과 | wifi-disconnect, specific-website-not-loading, update-network-broken |
| B6 | `device-manager-wifi-power-management` | Wi-Fi 어댑터 속성 > 전원 관리 탭 | hardware-wifi-disconnect |
| B7 | `settings-remote-desktop-on` | 설정 > 시스템 > 원격 데스크톱 켜기 | windows-remote-desktop-not-connecting |
| B8 | `firewall-inbound-rule-rdp-3389` | 고급 보안 방화벽 인바운드 규칙(원격 데스크톱 허용) | windows-remote-desktop-not-connecting |
| B9 | `mstsc-error-internal-error` | 원격 데스크톱 연결 오류 대화상자(가능하면 재현) | windows-remote-desktop-not-connecting |
| B10 | `chrome-err-connection-refused` | 크롬 "연결을 거부했습니다" 화면 | network-err-connection-refused |

## C. 장치 관리자·설정 캡처

| # | 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|---|
| C1 | `device-manager-touchpad-hid` | 장치 관리자 > 마우스 및 기타 포인팅 장치(느낌표/정상) | hardware-laptop-touchpad-not-working |
| C2 | `settings-touchpad-enable` | 설정 > Bluetooth 및 장치 > 터치패드 켜기 | hardware-laptop-touchpad-not-working |
| C3 | `device-manager-display-adapter-status` | 디스플레이 어댑터 속성 > 장치 상태(코드 43 등 재현이 어려우면 정상) | gpu-not-detected, display-driver-crash |
| C4 | `device-manager-error-code-properties` | 속성 > 일반 탭 "장치 상태"에 코드 표시(코드 1/10/19/24/34 각각) | error-code-device-manager-code-* (5~10개) |
| C5 | `power-options-fast-startup-off` | 제어판 > 전원 옵션 > 시스템 설정(빠른 시작 해제) | sleep-resume-fail, black-screen-after-login |
| C6 | `power-options-sleep-wake-timers` | 고급 전원 설정 > 절전 > 깨우기 타이머 | sleep-resume-fail, screen-off-despite-settings |
| C7 | `settings-windows-update-pause-history` | Windows Update > 업데이트 기록 > 실패 항목 | update-fail-loop, 24h2-update-fail, update-errors-guide |
| C8 | `settings-printer-driver-remove` | 인쇄 서버 속성 > 드라이버 탭 제거 | windows-printer-add-freeze |
| C9 | `taskmgr-end-explorer-run-new-task` | 작업 관리자에서 탐색기 다시 시작 / 새 작업 실행 | click-unresponsive, shell-multiple-apps, explorer-freeze |
| C10 | `settings-display-hdr-scaling` | 설정 > 디스플레이 해상도/배율/HDR | hardware-monitor-color-abnormal, external-monitor-connect-blackout |

## D. BSOD 실물 화면 (이미지 없음, 가장 큰 공백)
VM(Hyper-V/VirtualBox)에서 `NotMyFault` 등으로 재현 가능한 코드 우선. 파란 화면 + QR + 중지 코드 포함.

| 우선 | 코드 | 파일명(제안) | 재현 난이도 |
|---|---|---|---|
| 1 | CRITICAL_PROCESS_DIED (0xEF) | `bsod-critical-process-died` | 쉬움 |
| 1 | INACCESSIBLE_BOOT_DEVICE (0x7B) | `bsod-inaccessible-boot-device` | 보통(VM 컨트롤러 변경) |
| 1 | WHEA_UNCORRECTABLE_ERROR (0x124) | `bsod-whea-uncorrectable` | 어려움(실기기 사진 또는 생략) |
| 2 | KERNEL_SECURITY_CHECK_FAILURE (0x139) | `bsod-kernel-security-check-failure` | 쉬움 |
| 2 | DRIVER_IRQL_NOT_LESS_OR_EQUAL (0xD1) | `bsod-driver-irql` | 쉬움 |
| 2 | SYSTEM_SERVICE_EXCEPTION (0x3B) | `bsod-system-service-exception` | 쉬움 |
| 2 | VIDEO_TDR_FAILURE (0x116) | `bsod-video-tdr-failure` | 어려움 |
| 3 | MEMORY_MANAGEMENT (0x1A), IRQL_NOT_LESS_OR_EQUAL (0xA), UNEXPECTED_STORE_EXCEPTION (0x154), DPC_WATCHDOG_VIOLATION (0x133) | `bsod-<이름>` | 쉬움~보통 |

복구 화면: `winre-automatic-repair-failed`("자동 복구를 준비하는 중 / PC가 올바르게 시작되지 않았습니다") — windows-auto-repair-loop, 0xc000000e, 0xc0000225.

## E. 이벤트 로그 캡처 (54개 페이지 중 우선 15개)
기존 `evtx-<소스>-<ID>-properties` 규칙 유지. 이벤트 속성 > 일반 탭 + 자세히 탭 중 필요한 쪽.

| 우선 | 이벤트 | 파일명 | 비고 |
|---|---|---|---|
| 1 | Disk 7 | `evtx-disk-7-properties` | "불량 블록" - 실기기 로그에서 캡처 |
| 1 | Disk 11 | `evtx-disk-11-properties` | 컨트롤러 오류 |
| 1 | Disk 153 | `evtx-disk-153-properties` | 재시도 IO |
| 1 | NTFS 55 | `evtx-ntfs-55-corruption`(있음, memory-test-guide에만 사용) → event-ntfs-55 페이지에도 삽입 | 재촬영 불필요 |
| 1 | WHEA-Logger 17/18/19/20/46/47 | `evtx-whea-logger-18-properties` 등 | 18, 17 우선, 나머지는 같은 구조 |
| 1 | Application Error 1000 | `evtx-application-error-1000` | 오류 모듈/예외 코드 부분 |
| 1 | Application Hang 1002 | `evtx-application-hang-1002` | |
| 2 | Service Control Manager 7011/7023/7026/7031 | `evtx-service-7031` 등 | 7034(있음)과 같은 형식 |
| 2 | Kernel-Power 109/172/577 | `evtx-kernel-power-109` 등 | |
| 2 | Kernel-Boot 20/247, Kernel-General 12/13 | `evtx-kernel-general-12` 등 | 부팅/종료 시각 |
| 2 | Defender 1116/1117 | `evtx-defender-1116` | 위협 이름은 EICAR 테스트 파일로 재현 |
| 2 | Security 4625/4740/1102 | `evtx-security-4625` | 실패 로그온, 계정 잠김, 로그 삭제 |
| 2 | VSS 8193, Volsnap 25 | `evtx-vss-8193` | |
| 3 | PowerShell 4104, WMI 10, Resource-Exhaustion 2004, TPM 15, DNS/기타 | `evtx-<소스>-<ID>` | 필요 시 |

## F. 도구·진단 페이지

| # | 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|---|
| F1 | `hwinfo-sensors-temperature` | HWiNFO 센서 화면(CPU/GPU 온도) | hardware-overheat-shutdown, fan-noise, game-lag-fps-drop |
| F2 | `crystaldiskinfo-caution-example` | CrystalDiskInfo "주의" 상태 예시(대체 불량 사례 불가 시 정상 화면 + 주의 항목 주석) | hardware-nvme-delay, hdd-clicking-noise |
| F3 | `memtest86-pass-fail-screen` | MemTest86 완료/오류 화면 | memory-test-guide, bsod-critical-process |
| F4 | `bios-boot-menu-boot-priority` | BIOS 부팅 순서 화면(제조사별 ASUS/MSI/삼성/LG 중 2~3종) | bios-boot-guide, laptop-bios-entry-guide |
| F5 | `bios-ahci-nvme-mode` | SATA 모드 AHCI/RST 선택 화면 | 0x0000007b, windows-install-failure |
| F6 | `rufus-windows-media-creation` | Rufus/미디어 생성 도구 USB 만들기 화면 | windows-install-failure, 11-upgrade-blocked |
| F7 | `pc-health-check-result` | PC 상태 검사 앱 "이 PC는 Windows 11 요구 사항 충족 못함" | windows-11-upgrade-blocked |
| F8 | `minidump-analyzer-result` | 사이트 자체 minidump-analyzer 결과 화면 | minidump-analyzer, 각 BSOD 가이드 |

## 촬영 팁
- 개인정보(사용자명, PC 이름, IP, 시리얼, 제품 키) 가려서 저장.
- Windows 11 24H2/25H2 + 한국어 UI + 라이트 모드로 통일, 해상도 1920×1080 기준, 대상 창만 잘라서 저장.
- 재현이 어려운 오류는 실제 고객 PC 로그/사진 사용. 합성·가짜 화면은 사이트 방침(정확성, 정직한 신뢰도)에 맞지 않으므로 사용하지 않기.
- alt 텍스트에 화면 내용(오류 코드·핵심 값)을 서술.
