import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const file = path.join(root, "data.js");
let src = fs.readFileSync(file, "utf8");

// Sources researched and verified live via WebFetch/WebSearch against learn.microsoft.com,
// support.microsoft.com, and the relevant vendor's own support domain. Keyed by the exact
// `code` string used in data.js errorCodes. Entries omitted here intentionally have no
// verified official source and are left without officialSource rather than guessing.
const sources = {
  // Bug check (blue screen) codes — Microsoft Learn bug-check-code-reference2
  "0xC000021A": { title: "Microsoft Learn: Bug Check 0xC000021A WINLOGON_FATAL_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc000021a--winlogin-fatal-error" },
  "0x0000007B": { title: "Microsoft Learn: Bug Check 0x7B INACCESSIBLE_BOOT_DEVICE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7b--inaccessible-boot-device" },
  "0x0000001A": { title: "Microsoft Learn: Bug Check 0x1A MEMORY_MANAGEMENT", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x1a--memory-management" },
  "0x00000050": { title: "Microsoft Learn: Bug Check 0x50 PAGE_FAULT_IN_NONPAGED_AREA", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x50--page-fault-in-nonpaged-area" },
  "0x000000EF": { title: "Microsoft Learn: Bug Check 0xEF CRITICAL_PROCESS_DIED", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xef--critical-process-died" },
  "0x000000D1": { title: "Microsoft Learn: Bug Check 0xD1 DRIVER_IRQL_NOT_LESS_OR_EQUAL", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xd1--driver-irql-not-less-or-equal" },
  "0x0000009F": { title: "Microsoft Learn: Bug Check 0x9F DRIVER_POWER_STATE_FAILURE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x9f--driver-power-state-failure" },
  "0x00000116": { title: "Microsoft Learn: Bug Check 0x116 VIDEO_TDR_FAILURE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x116---video-tdr-failure" },
  "0x00000133": { title: "Microsoft Learn: Bug Check 0x133 DPC_WATCHDOG_VIOLATION", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x133-dpc-watchdog-violation" },
  "0x0000003B": { title: "Microsoft Learn: Bug Check 0x3B SYSTEM_SERVICE_EXCEPTION", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x3b--system-service-exception" },
  "0x000000EA": { title: "Microsoft Learn: Bug Check 0xEA THREAD_STUCK_IN_DEVICE_DRIVER", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xea--thread-stuck-in-device-driver" },
  "0x0000007E": { title: "Microsoft Learn: Bug Check 0x7E SYSTEM_THREAD_EXCEPTION_NOT_HANDLED", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7e--system-thread-exception-not-handled" },
  "0x0000000A": { title: "Microsoft Learn: Bug Check 0xA IRQL_NOT_LESS_OR_EQUAL", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xa--irql-not-less-or-equal" },
  "0x00000024": { title: "Microsoft Learn: Bug Check 0x24 NTFS_FILE_SYSTEM", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x24--ntfs-file-system" },
  "0x000000F4": { title: "Microsoft Learn: Bug Check 0xF4 CRITICAL_OBJECT_TERMINATION", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf4--critical-object-termination" },
  "0x00000019": { title: "Microsoft Learn: Bug Check 0x19 BAD_POOL_HEADER", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x19--bad-pool-header" },
  "0x000000A5": { title: "Microsoft Learn: Bug Check 0xA5 ACPI_BIOS_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xa5--acpi-bios-error" },
  "0x00000074": { title: "Microsoft Learn: Bug Check 0x74 BAD_SYSTEM_CONFIG_INFO", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x74--bad-system-config-info" },
  "0xC0000225": { title: "Microsoft Learn: Windows startup issues troubleshooting", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/windows-boot-issues-troubleshooting" },
  "0x000000C2": { title: "Microsoft Learn: Bug Check 0xC2 BAD_POOL_CALLER", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc2--bad-pool-caller" },
  "0x000000ED": { title: "Microsoft Learn: Bug Check 0xED UNMOUNTABLE_BOOT_VOLUME", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xed--unmountable-boot-volume" },
  "0x000000F7": { title: "Microsoft Learn: Bug Check 0xF7 DRIVER_OVERRAN_STACK_BUFFER", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf7--driver-overran-stack-buffer" },
  "0x000000D8": { title: "Microsoft Learn: Bug Check 0xD8 DRIVER_USED_EXCESSIVE_PTES", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xd8--driver-used-excessive-ptes" },
  "0x0000009C": { title: "Microsoft Learn: Bug Check 0x9C MACHINE_CHECK_EXCEPTION", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x9c--machine-check-exception" },
  "0x00000077": { title: "Microsoft Learn: Bug Check 0x77 KERNEL_STACK_INPAGE_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x77--kernel-stack-inpage-error" },
  "0x000000BE": { title: "Microsoft Learn: Bug Check 0xBE ATTEMPTED_WRITE_TO_READONLY_MEMORY", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xbe--attempted-write-to-readonly-memory" },
  "0x0000007A": { title: "Microsoft Learn: Bug Check 0x7A KERNEL_DATA_INPAGE_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7a--kernel-data-inpage-error" },
  "0x00000124": { title: "Microsoft Learn: Bug Check 0x124 WHEA_UNCORRECTABLE_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x124---whea-uncorrectable-error" },
  "0x00000139": { title: "Microsoft Learn: Bug Check 0x139 KERNEL_SECURITY_CHECK_FAILURE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x139--kernel-security-check-failure" },
  "0x000000C4": { title: "Microsoft Learn: Bug Check 0xC4 DRIVER_VERIFIER_DETECTED_VIOLATION", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc4--driver-verifier-detected-violation" },
  "0x0000002E": { title: "Microsoft Learn: Bug Check 0x2E DATA_BUS_ERROR", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x2e--data-bus-error" },
  "0x00000080": { title: "Microsoft Learn: Bug Check 0x80 NMI_HARDWARE_FAILURE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x80--nmi-hardware-failure" },
  "0x0000007F": { title: "Microsoft Learn: Bug Check 0x7F UNEXPECTED_KERNEL_MODE_TRAP", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7f--unexpected-kernel-mode-trap" },
  "0x00000101": { title: "Microsoft Learn: Bug Check 0x101 CLOCK_WATCHDOG_TIMEOUT", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x101---clock-watchdog-timeout" },
  "0x0000012B": { title: "Microsoft Learn: Bug Check 0x12B FAULTY_HARDWARE_CORRUPTED_PAGE", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x12b---faulty-hardware-corrupted-page" },
  "0x000000F2": { title: "Microsoft Learn: Bug Check 0xF2 HARDWARE_INTERRUPT_STORM", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf2--hardware-interrupt-storm" },
  "0x00000117": { title: "Microsoft Learn: Bug Check 0x117 VIDEO_TDR_TIMEOUT_DETECTED", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x117---video-tdr-timeout-detected" },
  "0x00000079": { title: "Microsoft Learn: Bug Check 0x79 MISMATCHED_HAL", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x79--mismatched-hal" },
  "0x000000FE": { title: "Microsoft Learn: Bug Check 0xFE BUGCODE_USB_DRIVER", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xfe--bugcode-usb-driver" },
  "0x0000005C": { title: "Microsoft Learn: Bug Check 0x5C HAL_INITIALIZATION_FAILED", url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x5c--hal-initialization-failed" },

  // Win32 / HRESULT / Windows Update codes
  "0x80070002": { title: "Microsoft Learn: System Error Codes — ERROR_FILE_NOT_FOUND", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x80070057": { title: "Microsoft Learn: System Error Codes — ERROR_INVALID_PARAMETER", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x80070005": { title: "Microsoft Learn: System Error Codes — ERROR_ACCESS_DENIED", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0xC000000F": { title: "Microsoft Learn: Windows startup issues troubleshooting", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/windows-boot-issues-troubleshooting" },
  "0x800F0922": { title: "Microsoft Learn: Error code 0x800f0922 when installing Windows updates", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/error-0x800f0922-installing-windows-updates" },
  "0x80070422": { title: "Microsoft Learn: Windows Update error code list", url: "https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference" },
  "0x80070070": { title: "Microsoft Learn: System Error Codes — ERROR_DISK_FULL", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0xC1900101": { title: "Microsoft Learn: Windows 10 upgrade resolution procedures", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-client/setup-upgrade-and-drivers/windows-10-upgrade-resolution-procedures" },
  "0x80240034": { title: "Microsoft Learn: Windows Update error code list — WU_E_DOWNLOAD_FAILED", url: "https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference" },
  "0x8024402C": { title: "Microsoft Learn: Windows Update error code list — WU_E_PT_WINHTTP_NAME_NOT_RESOLVED", url: "https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference" },
  "0x80073712": { title: "Microsoft Learn: Fix Windows Update errors (component store repair)", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors" },
  "0x8007232B": { title: "Microsoft Learn: Activation error 0x8007232B — DNS name does not exist", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/licensing-and-activation/activation-error-0x8007232b-dns-name-does-not-exist" },
  "0x800f0821": { title: "Microsoft Learn: Fix Windows Update errors", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors" },
  "0x8024a105": { title: "Microsoft Learn: Troubleshoot Windows Update download errors", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/troubleshoot-windows-update-download-errors" },
  "0x80070020": { title: "Microsoft Learn: Windows Update error code list — InstallFileLocked", url: "https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference" },
  "0x8007000e": { title: "Microsoft Learn: System Error Codes — ERROR_OUTOFMEMORY", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x800705b4": { title: "Microsoft Learn: System Error Codes (1300-1699) — ERROR_TIMEOUT", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1300-1699-" },
  "0x80070003": { title: "Microsoft Learn: System Error Codes — ERROR_PATH_NOT_FOUND", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x800704CF": { title: "Microsoft Learn: System Error Codes (1000-1299) — network error range", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-" },
  "0x80070035": { title: "Microsoft Learn: System Error Codes — ERROR_BAD_NETPATH", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x80070718": { title: "Microsoft Learn: System Error Codes (1700-3999) — network/quota error range", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1700-3999-" },
  "0x80072EFD": { title: "Microsoft Learn: Troubleshoot Windows Update download errors", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/troubleshoot-windows-update-download-errors" },
  "0x80070490": { title: "Microsoft Learn: System Error Codes (1000-1299) — ERROR_NOT_FOUND", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-" },
  "0x8007274C": { title: "Microsoft Learn: System Error Codes (10000-11999) — WSAETIMEDOUT", url: "https://learn.microsoft.com/en-us/windows/win32/winsock/windows-sockets-error-codes-2" },
  "0x800704B3": { title: "Microsoft Learn: System Error Codes (1000-1299) — network path error range", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-" },
  "0x80070102": { title: "Microsoft Learn: System Error Codes — WAIT_TIMEOUT", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "0x80070570": { title: "Microsoft Learn: System Error Codes (1300-1699) — ERROR_FILE_CORRUPT", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1300-1699-" },

  // Device Manager codes — single official Microsoft Support hub covers all
  "코드 10": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 43": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 28": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 39": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 31": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 34": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 19": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 41": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 24": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },
  "코드 45": { title: "Microsoft 지원: Device Manager error codes", url: "https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows" },

  "0x800F081F": { title: "Microsoft Learn: Fix Windows Update errors (DISM source files)", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors" },
  "오류 0x80070005 (설치)": { title: "Microsoft Learn: System Error Codes — ERROR_ACCESS_DENIED", url: "https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-" },
  "인쇄 스풀러 서비스 응답 없음": { title: "Microsoft 지원: Fix print spooler service not running errors", url: "https://support.microsoft.com/en-us/windows/hardware/printer/fix-print-spooler-service-not-running-errors-in-windows" },
  "Windows Audio 서비스 응답 없음": { title: "Microsoft 지원: Fix sound or audio problems in Windows", url: "https://support.microsoft.com/en-us/windows/fix-sound-or-audio-problems-in-windows-73025246-b61c-40fb-671a-2535c7cd56c8" },
  "스팀 서버 연결 실패": { title: "Steam 공식 지원: 네트워크 연결 문제 해결", url: "https://help.steampowered.com/en/faqs/view/669A-2F68-D1D1-A5EC" },

  // MSI / Windows Installer errors
  "오류 1603": { title: "Microsoft Learn: MSI installation error 1603", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/application-management/msi-installation-error-1603" },
  "오류 1618": { title: "Microsoft Learn: MsiExec.exe error codes — ERROR_INSTALL_ALREADY_RUNNING", url: "https://learn.microsoft.com/en-us/windows/win32/msi/error-codes" },
  "오류 2503": { title: "Microsoft Learn: Windows Installer error messages", url: "https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages" },
  "오류 2502": { title: "Microsoft Learn: Windows Installer error messages", url: "https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages" },
  "오류 0x80070643": { title: "Microsoft Learn: MSI installation error 1603 (0x643)", url: "https://learn.microsoft.com/en-us/troubleshoot/windows-server/application-management/msi-installation-error-1603" },
  "오류 1935": { title: "Microsoft Learn: Windows Installer error messages", url: "https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages" },
  "오류 1719": { title: "Microsoft Learn: Windows Installer error messages", url: "https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages" },

  // Microsoft's own component (VC++ runtime)
  "MSVCP140.dll 오류": { title: "Microsoft Learn: Latest supported Visual C++ Redistributable downloads", url: "https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist" },

  // Third-party vendor sources (games, anti-cheat, browser)
  "뱅가드 오류": { title: "Riot 지원: VALORANT 오류 코드 및 해결 방법", url: "https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant" },
  "이지 안티치트 오류": { title: "Easy Anti-Cheat 공식 지원", url: "https://www.easy.ac/support/articles" },
  "배틀넷 연결 오류": { title: "블리자드 고객지원: Battle.net 연결 문제 해결", url: "https://kr.battle.net/support/ko/article/99037" },
  "로스트아크 실행 오류": { title: "로스트아크 공식 고객센터", url: "https://lostark.support.onstove.com/hc/ko" },
  "메이플스토리 실행 오류": { title: "넥슨 에러복구프로그램", url: "https://help.nexon.com/download/restore" },
  "리그오브레전드 패치 오류": { title: "Riot 지원: League of Legends 패치 문제 해결", url: "https://support.riotgames.com/ko/league-of-legends/client/patching-issues" },
  "서든어택 넷프로텍트 오류": { title: "넥슨 서든어택 고객센터", url: "https://cs.nexon.com/helpboard/nexon?gamecode=156" },
  "FC 온라인 실행 오류": { title: "넥슨 FC 온라인 고객센터", url: "https://cs.nexon.com/helpboard/nexon?gamecode=329" },
  "Aw Snap 오류": { title: "Google Chrome 고객센터: 페이지 로드 오류", url: "https://support.google.com/chrome/answer/6098869" }
};

let applied = 0;
let skipped = [];
for (const [code, source] of Object.entries(sources)) {
  const codeEscaped = code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(code: "${codeEscaped}"[\\s\\S]*?)(\\n\\s*\\},\\n)`);
  const match = src.match(pattern);
  if (!match) { skipped.push(code); continue; }
  if (match[1].includes("officialSource")) { continue; }
  const insertion = `,\n      officialSource: ${JSON.stringify(source)}`;
  src = src.replace(pattern, `$1${insertion}$2`);
  applied++;
}

fs.writeFileSync(file, src);
console.log(`officialSource 적용: ${applied}개`);
if (skipped.length) console.log("매칭 실패:", skipped.join(", "));
