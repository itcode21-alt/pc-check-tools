# 추가 필요한 캡처 이미지 리스트

갱신일: 2026-10-13 / `assets/` 캡처 130종(jpg 기준), 캡처가 들어간 페이지 93개(전체 HTML 396개).
파일명 규칙: `영역-대상-상태.jpg` 촬영 후 `.webp` 변환본 함께 저장. 아래 "작업 방법"의 스크립트를 쓰면 둘 다 자동 생성된다.

## 현황 요약
- 이벤트 페이지: 88개 중 41개에 캡처 있음 → **47개 없음** (아래 E)
- BSOD(error-code-0x…) 페이지: 98개 중 **2개만** 캡처 있음 (아래 D)
- 아래 A~C의 "이 PC에서 촬영 가능한 항목"은 대부분 완료. 남은 건 재부팅·VM·실기기 사고 화면이 필요한 항목이 중심

## 작업 방법
1. `Win+Shift+S`로 캡처 → 클립보드에 올라감
2. `python -X utf8 -I scripts/import-capture.py --watch` 실행 후 파일명·alt 입력, 또는 `NAME --clipboard --alt "설명"` / `NAME --file 경로 --alt "설명"`
3. 개인정보(PC 이름, 사용자명, MAC, IPv6, 계정 영역, 설치 앱 목록)는 잘라내거나 막대로 가린 뒤 저장하고, 가렸다면 본문에도 적는다.
4. 정상 상태 화면이면 본문에 "예시"임을 밝히고, 상태가 오류 화면과 다르면 단정하지 않는다.
5. 생성 스크립트(`generate-event-pages`, `generate-game-pages`, `generate-static-fallbacks`)는 캡처(`guide-image-link`)가 있는 페이지를 건너뛴다. 덮어쓰려면 `--force`.

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

이미 `main`에 있던 것: `sfc-scannow-result`, `chkdsk-scan-result`, `ddu-display-driver-uninstaller`, `services-windows-update-properties`.

## 진행 중
- 없음. HDR 설정 화면은 완료(모니터 모델명은 그대로 노출하기로 결정).
- 이벤트 캡처는 이 PC에 실제로 기록된 것만 진행하며, 현재 후보는 Application Error 1000, Application Hang 1002, .NET Runtime 1026.

## 남은 항목

### A. 복구 환경·BIOS (재부팅 또는 VM 필요)
| 파일명(제안) | 촬영 내용 | 쓸 페이지 |
|---|---|---|
| `winre-advanced-options-menu` | 문제 해결 > 고급 옵션 | windows-auto-repair-loop, error-code-0xc000000e, 0xc0000225, 0x80070057, 0xc000000f, 0x0000007b |
| `winre-startup-settings-safemode` | 시작 설정에서 4/5번 안전 모드 | windows-black-screen-after-login, bsod-critical-process, display-driver-crash, click-unresponsive |
| `winre-command-prompt-bootrec` | WinRE 명령 프롬프트의 bootrec 실행 | error-code-0xc000000e, 0xc0000225, auto-repair-loop |
| `cmd-dism-restorehealth-complete` | DISM 100% 완료(실패 화면만 있음) | windows-shell-multiple-apps-not-opening, error-code-device-manager-code-19 |
| `bios-xmp-expo-setting` | BIOS XMP/EXPO 메뉴(제조사 1~2종) | hardware-no-display, windows-bsod-critical-process, error-code-0x00000124 |
| `bios-boot-menu-boot-priority` | BIOS 부팅 순서 화면 | bios-boot-guide, laptop-bios-entry-guide |
| `bios-ahci-nvme-mode` | SATA 모드 AHCI/RST 선택 | error-code-0x0000007b, windows-install-failure |
| `windows-memory-diagnostic-result` | 재부팅 후 진단 결과 알림(진단 창은 있음) | windows-bsod-critical-process, error-code-0x000000a5 |
| `winre-automatic-repair-failed` | "PC가 올바르게 시작되지 않았습니다" 화면 | windows-auto-repair-loop, error-code-0xc000000e |

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

### D. BSOD 실물 화면 (가장 큰 공백: 98개 중 2개)
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

### E. 이벤트 로그 (47개 페이지 없음)
기존 `evtx-<소스>-<ID>-properties` 규칙 유지. **이 PC에 실제로 기록된 이벤트만** 쓴다. 이벤트 뷰어에서 ID만 필터링하면 원본이 다른 같은 번호가 섞이므로(예: Disk 153과 Kernel-Boot 153) 원본까지 확인한다. 상세 영역의 컴퓨터 이름은 가린다.

**이 PC에 있는 것 (촬영 가능)**
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

**이 PC에 없어서 건너뛰는 것**: WHEA-Logger 17/18/19/20/46/47, Disk 7/11, Ntfs 55/57(55는 기존 이미지로 대체). Security 4625/4740/1102는 관리자 권한이 필요해 조회하지 못했다. 이런 이벤트는 실제 고객 PC 로그를 받았을 때만 추가하고 가짜로 만들지 않는다.

**본문과 데이터 불일치 (정정 검토)**: `event-time-service-158` 본문은 "부팅 때마다 중지된다"고 쓰고 있으나, 이 PC에서는 약 17분 간격으로 반복 기록된다.

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
