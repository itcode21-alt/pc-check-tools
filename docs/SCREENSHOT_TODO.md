# 추가 필요한 캡처 이미지 리스트

갱신일: 2026-10-14 / `assets/` 캡처 160종(jpg 기준), 캡처가 들어간 페이지 105개(전체 HTML 396개).
파일명 규칙: `영역-대상-상태.jpg` 촬영 후 `.webp` 변환본 함께 저장. 아래 "작업 방법"의 스크립트를 쓰면 둘 다 자동 생성된다.

## 현황 요약
- 이벤트 페이지: 88개 중 41개에 캡처 있음 → **47개 없음** (아래 E)
- BSOD(error-code-0x…) 페이지: 98개 중 **9개**에 캡처 있음(`0x3B`, `0x50`, `0x7B`, `0x7F`, `0xBE`, `0xD1`, `0xEF`, `0x139`, `0xC000021A`). 아직 큰 공백 (아래 D)
- 복구 환경(WinRE): Windows 11 26H2 화면 순서와 `SrtTrail.txt` 읽는 법은 `windows-auto-repair-loop`에 반영됨
- 아래 A~C의 "작업 PC에서 촬영 가능한 항목"은 대부분 완료. 남은 건 BIOS 사진, 일부 VM 재현, 실기기 장애 화면이 필요한 항목이 중심

## 작업 방법
1. `Win+Shift+S`로 캡처 → 클립보드에 올라감
2. `python -X utf8 -I scripts/import-capture.py --watch` 실행 후 파일명·alt 입력, 또는 `NAME --clipboard --alt "설명"` / `NAME --file 경로 --alt "설명"`
3. 개인정보(PC 이름, 사용자명, MAC, IPv6, 계정 영역, 설치 앱 목록)는 잘라내거나 막대로 가린 뒤 저장하고, 가렸다면 본문에도 적는다.
4. 정상 상태 화면이면 본문에 "예시"임을 밝히고, 상태가 오류 화면과 다르면 단정하지 않는다.
5. 생성 스크립트(`generate-event-pages`, `generate-game-pages`, `generate-static-fallbacks`)는 캡처(`guide-image-link`)가 있는 페이지를 건너뛴다. 덮어쓰려면 `--force`.
6. VM에서 찍은 화면은 본문에 "Windows 11 26H2 기준", "테스트 VM에서 일부러 일으킨 화면"임을 밝힌다. 이 경우 "실패한 내용"에 테스트 도구의 드라이버(`myfault.sys`)가 나오므로 실제 장애에서는 원인 드라이버 이름이 나온다고 함께 적는다.
7. VM 화면에 제조사 로고(예: Hyper-V)가 있으면 로고를 잘라내고 쓴다.

## VM 촬영 환경 (Hyper-V)
- 생성: `scripts/vm/new-capture-vm.ps1`(관리자 PowerShell), 준비 안내는 `scripts/vm/enable-hyperv.md`. 호스트 BIOS의 SVM과 Hyper-V 활성화가 필요하다.
- VM 이름 `cap-win11`, Windows 11 26H2(빌드 26300). 체크포인트 `ready-notmyfault`(업데이트 완료 + Windows App Runtime 설치 + NotMyFault 준비)로 항상 되돌려 촬영한다.
- BIOS 화면은 Gigabyte 보드에서 `F12`로 USB(FAT32)에 BMP 스크린샷을 저장할 수 있다. 폰 촬영보다 선명하다. 여러 대의 BIOS 사진을 받으면 같은 방식으로 정리한다.
- **향상된 세션은 끈다.** 비밀번호 없는 로컬 계정은 향상된 세션(RDP)으로 로그인할 수 없다.
- Hyper-V 관리 명령(`Checkpoint-VM`, `Restore-VMCheckpoint` 등)은 **호스트의 관리자 PowerShell**에서만 동작한다. VM 안의 PowerShell에서는 없다.
- 블루스크린은 VM 안에서 "자동으로 다시 시작"을 해제해 두면 화면이 유지되어 캡처하기 좋다.

## 완료 (이번 작업에서 추가·복원)
| 캡처 | 쓴 페이지 |
|---|---|
| `msinfo32-bios-mode-secure-boot` | windows-11-upgrade-blocked |
| `eventviewer-filter-event-id-41`, `reliability-monitor-overview` | event-viewer-guide |
| `settings-proxy-manual-off`, `inetcpl-lan-settings-proxy` | network-err-connection-refused |
| `settings-remote-desktop-on`, `firewall-allowed-apps-remote-desktop`, `firewall-inbound-rule-remote-desktop` | windows-remote-desktop-not-connecting |
| `device-manager-wifi-power-management` | hardware-wifi-disconnect |
| `power-options-fast-startup-off` | windows-sleep-resume-fail |
| `services-windows-audio-properties`, `services-windows-audio-endpoint-builder-properties` | error-code-windows-audio-service-stopped |
| `cmd-ipconfig-flushdns` | network-specific-website-not-loading, hardware-wifi-disconnect |
| `cmd-ipconfig-all-dhcp-ip` | event-tcpip-4199 |
| `settings-windows-update-history` | windows-update-fail-loop |
| `taskmgr-restart-windows-explorer` | windows-click-unresponsive, windows-taskbar-freeze, windows-explorer-freeze |
| `settings-display-night-light`, `settings-display-night-light-options` | hardware-monitor-color-abnormal |
| `win-p-project-menu` | hardware-external-monitor-connect-blackout |
| `settings-display-hdr-support` | hardware-monitor-color-abnormal |
| `evtx-time-service-158` | event-time-service-158 |
| `evtx-service-7026`, `evtx-service-7023` | event-service-7026, event-service-7023 |
| `evtx-ntfs-98` | event-ntfs-98 |
| `evtx-kernel-power-109` | event-kernel-power-109 |
| `evtx-disk-153-properties` | event-disk-153 |
| `evtx-ntfs-55-corruption` (기존 이미지 재사용) | event-ntfs-55 |
| `windows11-install-assistant-error-80072f8f`, `cmd-w32tm-resync-success` (복원) | error-code-0x80072f8f |
| `bsod-driver-irql-not-less-or-equal-0xd1` | error-code-0x000000d1 |
| `bsod-page-fault-nonpaged-area-26h2` (예전 파란 화면과 비교) | error-code-0x00000050 |
| `bsod-system-service-exception-0x3b` | error-code-0x0000003b |
| `bsod-unexpected-kernel-mode-trap-0x7f` | error-code-0x0000007f |
| `bsod-inaccessible-boot-device-0x7b` | error-code-0x0000007b |
| `bsod-critical-process-died-0xef` | error-code-0x000000ef |
| `bsod-status-system-process-terminated-0xc000021a` | error-code-0xc000021a |
| `bsod-attempted-write-to-readonly-memory-0xbe` | error-code-0x000000be |
| `bsod-kernel-security-check-failure-0x139` | error-code-0x00000139 |
| `bios-gigabyte-boot-option-priorities-csm` (BIOS의 F12 스크린샷 기능으로 USB에 저장한 BMP를 변환) | bios-boot-guide, windows-11-upgrade-blocked |
| `bios-gigabyte-amd-cpu-ftpm` (MAC 주소 가림) | windows-11-upgrade-blocked |
| `bios-gigabyte-secure-boot-enabled` (다른 보드, Enabled·Active) | windows-11-upgrade-blocked |
| `bios-gigabyte-sata-mode-ahci-raid` | error-code-0x0000007b |
| `bios-gigabyte-csm-support-options` | error-code-0xc000000e |
| `bios-gigabyte-fast-boot-options` | bios-boot-guide |
| `bios-gigabyte-tweaker-xmp-expo-profile` | hardware-no-display |
| `winre-26h2-*` 8종(자동 복구 준비 중, PC 진단 중, 복구할 수 없습니다, 추가 복구 옵션, 문제 해결, 고급 옵션, 복구 옵션 더 보기, 시작 설정 목록) | windows-auto-repair-loop |
| `winre-26h2-command-prompt`, `winre-26h2-srttrail-head`, `winre-26h2-srttrail-tail` | windows-auto-repair-loop (복구 로그 읽는 법) |

이미 `main`에 있던 것: `sfc-scannow-result`, `chkdsk-scan-result`, `ddu-display-driver-uninstaller`, `services-windows-update-properties`.

## 진행 중
- 없음. VM 촬영 중 사이트 본문과 어긋난 부분은 아래처럼 정정했다.
  - 블루스크린 화면 설명: `common-error-codes`에 26H2는 검은 화면이라고 반영(PR #44)
  - 시작 복구/시동 복구 → 최신 Windows 11의 "빠른 머신 복구" 표기와 복구 진입 경로: 9개 페이지와 데이터 파일에 반영(#43)
  - 남은 불일치: `app.js`, `app-diagnostic-tool.js`의 "복구 환경에서 시작 복구 실행"(235개 페이지 캐시 버전과 함께 별도 작업 필요)
- 이벤트 캡처는 작업 PC에 기록된 이벤트로 진행하며, 현재 후보는 Application Error 1000, Application Hang 1002, .NET Runtime 1026.

## 남은 항목

### A. 복구 환경·BIOS (남은 것)
WinRE 화면 순서는 완료. 아래는 BIOS 사진(폰 촬영)과 일부 명령 결과다. 복구 환경에서 `diskpart → list volume`, `bootrec` 실행 결과를 찍으려면 VM에서 동작하는 상태가 필요하다.

| 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|
| `cmd-dism-restorehealth-complete` | DISM 100% 완료(실패 화면만 있음) | windows-shell-multiple-apps-not-opening, error-code-device-manager-code-19 |
| `bios-ahci-nvme-mode` | SATA 모드 AHCI/RST 선택 | error-code-0x0000007b, windows-install-failure |
| `windows-memory-diagnostic-result` | 재부팅 후 진단 결과 알림(진단 창은 있음) | windows-bsod-critical-process, error-code-0x000000a5 |
| `bios-xmp-expo-profile-options` | XMP/EXPO Profile 선택 상자를 `Enter`로 열어 선택지가 보이게(값은 고르지 말고 Esc) | hardware-no-display, error-code-0x00000124 |
| `bios-load-optimized-defaults-dialog` | Load Optimized Defaults 확인 대화상자 | bios-boot-guide |
| `bios-qflash-main`, `bios-system-info-version` | Q-Flash 첫 화면(업데이트는 실행하지 않음)과 BIOS 버전 확인 화면 | bios-boot-guide |
| `bios-power-ac-back-erp` | Power 설정의 AC BACK, Soft-Off by PWR-BTN, ErP | hardware-no-power, windows-sleep-resume-fail |
| `bios-smart-fan-temperature` | Smart Fan 6 또는 온도 모니터 화면 | hardware-overheat-shutdown, hardware-fan-noise |
| `bios-f12-boot-menu` | 부팅 중 `F12` 부팅 메뉴(USB 부팅 선택) | windows-install-failure, bios-boot-guide |
| `bios-usb-configuration` | USB Configuration(Legacy USB, XHCI Hand-off) | hardware-usb-not-detected, windows-keyboard-mouse-not-detected |
| `winre-26h2-diskpart-list-volume` | 복구 환경에서 `diskpart → list volume`(EFI와 OS 볼륨 문자 확인) | error-code-0xc000000e, 0xc0000225 |
| `winre-26h2-startup-repair-failed-screen` | 복구 환경 흐름에서 "PC가 올바르게 시작되지 않았습니다"에 해당하는 화면이 있는지 확인(26H2는 "복구할 수 없습니다"로 대체됨) | windows-auto-repair-loop |

### B. 서비스·네트워크 (남은 것)
| 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|
| `mstsc-error-internal-error` | 원격 데스크톱 연결 오류 대화상자(재현 시) | windows-remote-desktop-not-connecting |
| `chrome-err-connection-refused` | 크롬 "연결을 거부했습니다" 화면 | network-err-connection-refused |
| `cmd-netsh-winsock-reset` | winsock reset 결과. **재부팅 필요, VPN 클라이언트 영향 가능** — 필요한 PC에서만 | hardware-wifi-disconnect, windows-update-network-broken |

### C. 장치 관리자·설정 (남은 것)
| 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|
| `device-manager-touchpad-hid`, `settings-touchpad-enable` | 터치패드 장치와 설정(노트북 필요) | hardware-laptop-touchpad-not-working |
| `device-manager-error-code-properties` | 속성 > 일반 탭 "장치 상태"에 코드 표시(코드 1/10/19/24/34) | error-code-device-manager-code-* |
| `power-options-sleep-wake-timers` | 고급 전원 설정 > 깨우기 타이머 | windows-sleep-resume-fail, windows-screen-off-despite-settings |
| `settings-printer-driver-remove` | 인쇄 서버 속성 > 드라이버 탭 | windows-printer-add-freeze |
| `settings-windows-update-history-failed` | 업데이트 기록의 "설치 실패" 항목(실제 실패가 있을 때만) | windows-update-fail-loop, windows-11-24h2-update-fail |
| `taskmgr-run-new-task-explorer` | 새 작업 실행 창에 explorer.exe 입력(확인은 누르지 않음) | windows-click-unresponsive, windows-taskbar-freeze |

### D. BSOD 실물 화면 (98개 중 9개)
**26H2의 중지 화면은 검은 배경이고 슬픈 얼굴과 QR 코드가 없다.** 하단에 "중지 코드: 이름 (0x코드)"와 "실패한 내용"이 표시되며, 코드에 따라 "실패한 내용" 줄이나 진행률(%)이 없는 경우도 있다. 새로 올리는 화면은 "26H2 기준"으로 표기하고, 기존 파란 화면 캡처(`0x50`)는 비교용으로 남긴다.

**VM에서 `NotMyFault`로 얻은 결과 (v4.6)**
| 선택 항목 | 나온 코드 | 사이트 |
|---|---|---|
| High IRQL fault (Kernel-mode) | `0xD1` | 반영 |
| Buffer overflow | `0x50` | 반영(비교용) |
| High IRQL fault (User-mode) | `0x4A` | 사이트에 페이지가 없어 건너뜀 |
| Stack overflow | `0x7F` | 반영 |
| Hardcoded breakpoint | `0x3B` | 반영 |
| Trigger HAL Timer Watchdog | 미시험 | - |
| Code overwrite | `0xBE` (검증기 적용 상태에서 확인) | 반영 |
| Stack trash | `0x139` | 반영 |

`NotMyFault`는 항목이 달라도 같은 코드로 모이는 경우가 있지만(`0x3B`, `0x50`), `Code overwrite`(`0xBE`)와 `Stack trash`(`0x139`)처럼 새 코드를 주는 항목도 있어서 모든 항목을 한 번씩 시험해 볼 가치가 있었다. 아직 시험하지 않은 항목은 `Trigger HAL Timer Watchdog`뿐이다. 나머지 코드는 겨냥해서 만든다.

**드라이버 검증기(`verifier /standard /driver myfault.sys`) 적용 후 결과**
- 설정은 정상 적용됐다(`verifier /query`에서 표준 플래그 `0x001209BB`와 `myfault.sys` 확인).
- `Double free` → `0x50`. 특수 풀이 해제된 메모리 접근을 막기 때문에 나오는 정상 결과이며 "실패한 내용" 줄은 나오지 않았다.
- `High IRQL fault (Kernel-mode)` → `0xD1`("실패한 내용: myfault.sys"). 검증기 위반 계열(`0xC4`, `0xC1`, `0xC2`, `0xC5`)로는 바뀌지 않았다.
- 결론: `NotMyFault`로는 검증기 위반 계열 코드를 만들지 못했다. 이 코드들은 **다른 PC의 실제 사진·로그를 받았을 때** 채운다. `Code overwrite`는 `0xBE`(ATTEMPTED_WRITE_TO_READONLY_MEMORY)가 나와 사이트에 반영했다. 이 경우처럼 `NotMyFault`의 모든 항목을 한 번씩 시험해 볼 가치가 있다.
- 같은 코드라도 화면에 따라 "실패한 내용" 줄이 있거나 없다. 본문에 "이런 줄이 없는 경우도 있다"고 적어 두었다(`0x3B`, `0xEF`, `0xC000021A`).

| 우선 | 코드 | 방법(VM 안) | 파일명(제안) |
|---|---|---|---|
| 완료 | CRITICAL_PROCESS_DIED (0xEF) | VM 안의 관리자 PowerShell에서 ntdll의 `RtlAdjustPrivilege`와 `RtlSetProcessIsCritical`로 해당 PowerShell 프로세스를 핵심 프로세스로 표시한 뒤 `exit`(PsExec 불필요). "실패한 내용" 줄은 나오지 않았다. **재현 코드는 공개 본문에 쓰지 않는다** | `bsod-critical-process-died-0xef` |
| 완료 | STATUS_SYSTEM_PROCESS_TERMINATED (0xC000021A) | 복구 환경(명령 프롬프트)에서 로그인에 필요한 핵심 구성 요소를 임시로 사용할 수 없게 만든 뒤 정상 부팅. 처음 시도한 SYSTEM 권한 예약 작업의 `taskkill /f /im winlogon.exe`는 `LastTaskResult 1`로 실패(보호됨). 중지 코드가 이름 없이 `0xc000021a (0xC000021A)`로만 표시되고 "실패한 내용" 줄이 없었다. **재현 절차는 공개 본문에 쓰지 않는다** | `bsod-status-system-process-terminated-0xc000021a` |
| 보류 | CRITICAL_OBJECT_TERMINATION (0xF4) | `0xEF`나 `0xC000021A`와 다른 코드라 별도 방법이 필요하다. VM에서 안전하게 만드는 방법이 확인되지 않았으므로 **다른 PC의 실제 화면·로그**를 기다린다 | - |
| 시도함 | 드라이버 검증 계열(0xC4, 0xC1 등) | 위 검증기 결과 참고. VM에서는 만들지 못했다 | - |
| 3 | DPC_WATCHDOG_VIOLATION (0x133), CLOCK_WATCHDOG_TIMEOUT (0x101) | `NotMyFault`의 `Trigger HAL Timer Watchdog`가 어느 코드를 내는지 시험 | `bsod-<이름>` |
| - | MEMORY_MANAGEMENT (0x1A), WHEA_UNCORRECTABLE_ERROR (0x124), VIDEO_TDR_FAILURE (0x116), UNEXPECTED_STORE_EXCEPTION (0x154) | VM에서 안전하게 재현하기 어렵다. **다른 PC의 실제 사진·로그를 받았을 때만** 추가하고 합성하지 않는다 | - |

### E. 이벤트 로그 (47개 페이지 없음)
기존 `evtx-<소스>-<ID>-properties` 규칙 유지.

**사이트의 이벤트 로그·캡처는 여러 PC에서 온 것이다.** 작업 PC뿐 아니라 다른 PC의 로그(예: `evtx-ntfs-55-corruption`은 다른 PC 사례)도 쓴다. 그래서 다음을 지킨다.
- 작업 PC에 없는 이벤트를 "없으니 불필요"로 단정하지 않는다. 다른 PC의 `.evtx` 로그나 캡처가 있으면 그것으로 채운다.
- 한 PC에서 관찰한 패턴(발생 횟수, 간격, 부팅과의 관계 등)을 본문에 일반화하지 않고 "한 PC를 관찰한 사례"로 한정해 적는다.
- 다른 PC의 화면에는 컴퓨터 이름, 사용자명, 파일 경로가 있을 수 있으니 가린다. 캡처한 PC가 다르면 본문에 "다른 PC에서 기록된 사례"라고 밝힌다.
- 이벤트 뷰어에서 ID만 필터링하면 원본이 다른 같은 번호가 섞이므로(예: Disk 153과 Kernel-Boot 153) 원본까지 확인한다. 상세 영역의 컴퓨터 이름은 가린다.

**작업 PC에 있는 것 (바로 촬영 가능)**
| 이벤트 | 건수(조회 시점) | 파일명 | 비고 |
|---|---|---|---|
| Application Error 1000 | 92 | `evtx-application-error-1000` | 앱 경로·사용자명이 보이면 가림 |
| Application Hang 1002 | 14 | `evtx-application-hang-1002` | 같음 |
| .NET Runtime 1026 | 13 | `evtx-dotnet-runtime-1026` | |
| Service Control Manager 7031 | 1 | `evtx-service-7031` | |
| Kernel-Power 172 / 577 | 62 / 43 | `evtx-kernel-power-172` 등 | 109는 완료 |
| Kernel-General 12 / 13, Kernel-Boot 20 / 247 | 43~188 | `evtx-kernel-general-12` 등 | |
| VSS 8193 | 4 | `evtx-vss-8193` | |
| Defender 1116 | 65 | `evtx-defender-1116` | 파일 경로가 보이는지 확인 후 판단 |

**작업 PC에 없는 것 (다른 PC의 로그·캡처가 필요)**: WHEA-Logger 17/18/19/20/46/47, Disk 7/11, Ntfs 57(55는 기존 다른 PC 캡처로 대체). Security 4625/4740/1102는 작업 PC에서는 관리자 권한이 필요해 조회하지 못했다. 이런 이벤트는 다른 PC의 실제 로그를 받았을 때 추가하고, 합성하거나 가짜로 만들지 않는다.

**정정 이력**: `event-time-service-158`의 "부팅 때마다 중지된다" 표현은 한 PC의 관찰(부팅 후 약 17분 간격 5건)에 맞춰 고쳤고, 일반화하지 않고 한 PC의 관찰로 한정해 적었다.

### F. 도구·진단
| 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|
| `hwinfo-sensors-temperature` | HWiNFO 센서(CPU/GPU 온도) | hardware-overheat-shutdown, fan-noise, game-lag-fps-drop |
| `crystaldiskinfo-caution-example` | "주의" 상태 예시(실제 사례가 없으면 만들지 않음) | hardware-nvme-delay, hdd-clicking-noise |
| `memtest86-pass-fail-screen` | MemTest86 완료/오류 화면 | memory-test-guide, windows-bsod-critical-process |
| `rufus-windows-media-creation` | USB 설치 미디어 만들기 화면 | windows-install-failure, windows-11-upgrade-blocked |
| `pc-health-check-result` | PC 상태 검사 앱 결과 | windows-11-upgrade-blocked |
| `minidump-analyzer-result` | 사이트 minidump-analyzer 결과 화면 | minidump-analyzer, 각 BSOD 가이드 |

## 촬영 팁
- Windows 11 + 한국어 UI + 라이트 모드로 통일, 대상 창만 잘라서 저장.
- 재현이 어려운 오류는 실제 고객 PC 로그/사진을 사용한다. 합성·가짜 화면은 사이트 방침(정확성, 정직한 신뢰도)에 맞지 않으므로 쓰지 않는다.
- 상태를 바꾸는 동작(서비스 중지, 탐색기 재시작, winsock reset, 원격 데스크톱 켜기)은 캡처용으로 실행하지 않고 메뉴나 화면만 띄운다.
- alt 텍스트에 화면 내용(오류 코드·핵심 값)을 서술하고, 본문에서는 캡처가 정상 상태 예시인지 오류 상태인지 밝힌다.
