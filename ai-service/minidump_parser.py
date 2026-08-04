"""Windows 미니덤프(.dmp) 파일에서 STOP 코드·결함 모듈 등 진단 정보를 추출합니다."""
import os
import tempfile
from typing import Optional

try:
    from minidump.minidumpfile import MinidumpFile
    _LIB_OK = True
except ImportError:
    _LIB_OK = False

MINIDUMP_SIGNATURE = b"MDMP"
# 커널/전체 메모리 덤프(%SystemRoot%\MEMORY.DMP 등)의 헤더 시그니처.
# Windows의 "시작 및 복구" 설정이 "커널 메모리 덤프"·"전체 메모리 덤프"로
# 되어 있으면 C:\Windows\Minidump\ 폴더에 있는 파일도 이 형식으로 저장될 수
# 있다 — 파일명 패턴(MMDDYY-NNNNN-01.dmp)만으로는 구분할 수 없어 사용자가
# 혼란스러워하는 경우가 실제로 있었다(2026-08-04). 이 라이브러리(minidump)는
# MDMP만 지원하므로 이 형식은 파싱할 수 없지만, 최소한 원인을 정확히 안내한다.
KERNEL_DUMP_SIGNATURES = (b"PAGEDUMP", b"PAGEDU64")

# ── STOP 코드 테이블 ──────────────────────────────────────────────────────────
STOP_CODES: dict[int, tuple[str, str]] = {
    0x0000001E: ("KMODE_EXCEPTION_NOT_HANDLED",           "커널 모드 예외 처리 실패"),
    0x00000024: ("NTFS_FILE_SYSTEM",                      "NTFS 파일 시스템 오류 — 디스크 점검 필요"),
    0x0000002E: ("DATA_BUS_ERROR",                        "데이터 버스 오류 — RAM 불량 가능성"),
    0x0000003B: ("SYSTEM_SERVICE_EXCEPTION",              "시스템 서비스 예외"),
    0x0000007B: ("INACCESSIBLE_BOOT_DEVICE",              "부팅 장치 접근 불가 — 스토리지 드라이버 오류"),
    0x0000007E: ("SYSTEM_THREAD_EXCEPTION_NOT_HANDLED",   "시스템 스레드 예외 처리 실패"),
    0x0000007F: ("UNEXPECTED_KERNEL_MODE_TRAP",           "예상치 못한 커널 트랩 — 하드웨어 오류 가능"),
    0x00000050: ("PAGE_FAULT_IN_NONPAGED_AREA",           "비페이지드 영역 페이지 폴트 — 드라이버 또는 RAM 오류"),
    0x0000007A: ("KERNEL_DATA_INPAGE_ERROR",              "페이지 파일 읽기 실패 — 디스크 또는 RAM 오류"),
    0x00000096: ("INVALID_WORK_QUEUE_ITEM",               "작업 큐 항목 오류"),
    0x0000009C: ("MACHINE_CHECK_EXCEPTION",               "CPU 하드웨어 오류 — 과열 또는 CPU 결함"),
    0x0000009F: ("DRIVER_POWER_STATE_FAILURE",            "드라이버 전원 상태 실패"),
    0x000000BE: ("ATTEMPTED_WRITE_TO_READONLY_MEMORY",    "읽기 전용 메모리 쓰기 시도 — 드라이버 오류"),
    0x000000C4: ("DRIVER_VERIFIER_DETECTED_VIOLATION",    "드라이버 검증기 위반"),
    0x000000D1: ("DRIVER_IRQL_NOT_LESS_OR_EQUAL",         "드라이버 IRQL 오류 — 드라이버 업데이트 필요"),
    0x000000EF: ("CRITICAL_PROCESS_DIED",                 "핵심 시스템 프로세스 강제 종료"),
    0x000000F4: ("CRITICAL_OBJECT_TERMINATION",           "핵심 개체 종료 — 시스템 파일 또는 디스크 오류"),
    0x00000116: ("VIDEO_TDR_FAILURE",                     "그래픽 드라이버 응답 없음(TDR) — GPU 드라이버 오류"),
    0x00000117: ("VIDEO_TDR_TIMEOUT_DETECTED",            "그래픽 드라이버 타임아웃"),
    0x00000119: ("VIDEO_SCHEDULER_INTERNAL_ERROR",        "GPU 스케줄러 내부 오류"),
    0x00000124: ("WHEA_UNCORRECTABLE_ERROR",              "하드웨어 수정 불가 오류 — CPU·RAM·전원 문제"),
    0x00000133: ("DPC_WATCHDOG_VIOLATION",                "DPC 감시자 위반 — 드라이버 또는 SSD 펌웨어 문제"),
    0x0000013A: ("KERNEL_MODE_HEAP_CORRUPTION",           "커널 힙 메모리 손상"),
    0x0000015A: ("FATAL_SYSTEM_ERROR",                    "심각한 시스템 오류"),
    0x00000154: ("UNEXPECTED_STORE_EXCEPTION",            "저장소 예외 — NVMe SSD 펌웨어 또는 드라이버 문제"),
    0x0000017E: ("MICROCODE_REVISION_MISMATCH",           "CPU 마이크로코드 불일치 — BIOS 업데이트 권장"),
    0xC000021A: ("STATUS_SYSTEM_PROCESS_TERMINATED",      "윈도우 서브시스템 프로세스 강제 종료"),
    0xC0000005: ("STATUS_ACCESS_VIOLATION",               "메모리 접근 위반"),
    0xC0000221: ("STATUS_IMAGE_CHECKSUM_MISMATCH",        "드라이버 파일 체크섬 불일치 — 손상된 시스템 파일"),
    # 이 아래는 사이트의 오류 코드 가이드(error-code-0x*.html, data.js 기준)에는
    # 이미 페이지가 있지만 이 표에는 빠져 있던 코드들이다. 특히 0xA
    # (IRQL_NOT_LESS_OR_EQUAL)는 실제로 가장 흔한 BSOD 코드 중 하나인데도
    # 통째로 빠져 있어서, 정작 가장 자주 볼 결과 화면에 코드명·설명이 비어
    # 있었다. data.js의 코드 목록과 대조해 채워 넣었다.
    0x0000000A: ("IRQL_NOT_LESS_OR_EQUAL",                "잘못된 인터럽트 요청 레벨 접근 — 드라이버 또는 RAM 결함(가장 흔한 BSOD 코드 중 하나)"),
    0x00000019: ("BAD_POOL_HEADER",                       "커널 메모리 풀 헤더 손상 — 드라이버 또는 RAM 오류"),
    0x0000001A: ("MEMORY_MANAGEMENT",                     "메모리 관리자 오류 — RAM 불량 또는 드라이버 결함"),
    0x0000004E: ("PFN_LIST_CORRUPT",                      "페이지 프레임 번호 목록 손상 — RAM 불량 가능성"),
    0x0000005C: ("HAL_INITIALIZATION_FAILED",             "HAL 초기화 실패 — 하드웨어 비호환 또는 BIOS 설정 문제"),
    0x00000074: ("BAD_SYSTEM_CONFIG_INFO",                "시스템 구성 정보 손상 — 레지스트리 또는 부팅 설정 오류"),
    0x00000077: ("KERNEL_STACK_INPAGE_ERROR",             "커널 스택 페이지 읽기 실패 — 디스크 또는 RAM 오류"),
    0x00000079: ("MISMATCHED_HAL",                        "HAL과 커널 버전 불일치 — 시스템 파일 손상"),
    0x00000080: ("NMI_HARDWARE_FAILURE",                  "NMI 하드웨어 오류 — 메모리 패리티 또는 하드웨어 결함"),
    0x0000008E: ("KERNEL_MODE_EXCEPTION_NOT_HANDLED",     "커널 모드 예외 처리 실패 — 드라이버 또는 하드웨어 결함"),
    0x0000009E: ("USER_MODE_HEALTH_MONITOR",              "사용자 모드 헬스 모니터 응답 없음 — 시스템 서비스 응답 지연"),
    0x000000A5: ("ACPI_BIOS_ERROR",                        "ACPI BIOS가 규격을 따르지 않음 — BIOS 업데이트 필요"),
    0x000000C2: ("BAD_POOL_CALLER",                        "커널 메모리 풀 API 오용 — 드라이버 결함"),
    0x000000C5: ("DRIVER_CORRUPTED_EXPOOL",                "드라이버가 풀 메모리를 손상시킴 — 결함 드라이버"),
    0x000000D8: ("DRIVER_USED_EXCESSIVE_PTES",             "드라이버가 페이지 테이블 항목을 과도하게 사용 — 드라이버 결함"),
    0x000000EA: ("THREAD_STUCK_IN_DEVICE_DRIVER",          "드라이버 스레드가 무한 대기 — 그래픽 드라이버 결함이 흔함"),
    0x000000ED: ("UNMOUNTABLE_BOOT_VOLUME",                "부팅 볼륨을 마운트할 수 없음 — 디스크 손상 또는 케이블 문제"),
    0x000000F2: ("HARDWARE_INTERRUPT_STORM",               "하드웨어 인터럽트 폭주 — 장치 또는 드라이버 결함"),
    0x000000F7: ("DRIVER_OVERRAN_STACK_BUFFER",            "드라이버가 스택 버퍼 초과 — 결함 드라이버"),
    0x000000FE: ("BUGCODE_USB_DRIVER",                     "USB 드라이버 오류 — USB 컨트롤러 또는 주변기기 드라이버 문제"),
    0x00000101: ("CLOCK_WATCHDOG_TIMEOUT",                 "CPU 코어가 응답하지 않음 — 오버클럭 또는 CPU 결함"),
    0x00000109: ("CRITICAL_STRUCTURE_CORRUPTION",          "커널 핵심 구조체 손상 — 드라이버 결함 또는 보안 위협"),
    0x00000113: ("VIDEO_DXGKRNL_FATAL_ERROR",              "DirectX 그래픽 커널 치명적 오류 — GPU 드라이버 문제"),
    0x0000012B: ("FAULTY_HARDWARE_CORRUPTED_PAGE",         "하드웨어 결함으로 메모리 페이지 손상 — RAM·CPU 점검 필요"),
    0x00000139: ("KERNEL_SECURITY_CHECK_FAILURE",          "커널 보안 검사 실패 — 드라이버 결함 또는 메모리 손상"),
    0x00000144: ("BUGCODE_USB3_DRIVER",                    "USB 3 드라이버 오류 — USB 컨트롤러 드라이버 문제"),
    0x00000164: ("WIN32K_CRITICAL_FAILURE",                "Win32k 커널 그래픽 치명적 오류 — 그래픽 드라이버 문제"),
    # data.js(사이트 오류 코드 DB)에는 없지만 Microsoft 공식 문서에 등재된
    # 코드들이다. 사이트 전용 가이드 페이지는 없어도(STOP_CODE_GUIDE_PAGE에는
    # 안 넣음) 최소한 코드명·설명은 비어 있지 않도록 채운다. 0x7C·0xE2·0xFC는
    # Microsoft Learn 문서로 재확인한 뒤 추가했다.
    0x00000044: ("MULTIPLE_IRP_COMPLETE_REQUESTS",         "드라이버가 동일 IRP를 두 번 완료 처리 — 결함 드라이버"),
    0x0000006B: ("PROCESS1_INITIALIZATION_FAILED",         "1단계 프로세스 초기화 실패 — 드라이버 또는 시스템 파일 손상"),
    0x0000007C: ("BUGCODE_NDIS_DRIVER",                    "네트워크(NDIS) 드라이버 오류 — 네트워크 어댑터 드라이버 문제"),
    0x000000CE: ("DRIVER_UNLOADED_WITHOUT_CANCELLING_PENDING_OPERATIONS", "드라이버가 대기 작업을 취소하지 않고 언로드됨 — 결함 드라이버"),
    0x000000D5: ("DRIVER_PAGE_FAULT_IN_FREED_SPECIAL_POOL", "이미 해제된 메모리 접근 — 결함 드라이버"),
    0x000000DE: ("POOL_CORRUPTION_IN_FILE_AREA",           "파일 영역 메모리 풀 손상 — 드라이버 또는 파일시스템 결함"),
    # 0xE2는 사용자가 키보드/디버거로 직접 강제 발생시킨 크래시(테스트·진단
    # 목적)일 수 있어, 다른 코드와 달리 "하드웨어 결함이 아닐 수 있다"는
    # 안내를 desc에 포함한다 — 그대로 두면 사용자가 불필요하게 부품을
    # 의심할 수 있다.
    0x000000E2: ("MANUALLY_INITIATED_CRASH",               "키보드 또는 디버거로 직접 발생시킨 강제 크래시 — 실제 하드웨어 결함이 아니라 테스트·진단 목적일 수 있음"),
    0x000000FC: ("ATTEMPTED_EXECUTE_OF_NOEXECUTE_MEMORY",  "실행 불가 메모리 영역에서 코드 실행 시도 — 결함 드라이버 또는 보안 소프트웨어 충돌"),
}

# 사이트 자체의 오류 코드 가이드 페이지로 바로 연결하기 위한 매핑.
# 프런트엔드(minidump-analyzer.html)의 STOP_GUIDE_MAP은 8개만 수동으로
# 걸어 두고 있었다. 여기 있는 코드들은 data.js(사이트의 오류 코드 DB)에
# "error-code-0x........html" 형태의 전용 페이지가 실제로 존재함을
# 확인한 뒤 넣은 것이다 — 패턴만으로 생성하면 0x113처럼 전용 페이지가
# 없고 쿼리 파라미터로 리다이렉트되는 코드나, 0x96/0x15A/0x17E처럼
# data.js에 아예 없는 레거시 코드에서 존재하지 않는 링크가 생기므로
# 코드별로 실제 페이지를 확인해 명시적으로만 나열한다.
STOP_CODE_GUIDE_PAGE: dict[int, str] = {
    0x0000000A: "error-code-0x0000000a.html",
    0x00000019: "error-code-0x00000019.html",
    0x0000001A: "error-code-0x0000001a.html",
    0x0000001E: "error-code-0x0000001e.html",
    0x00000024: "error-code-0x00000024.html",
    0x0000002E: "error-code-0x0000002e.html",
    0x0000003B: "error-code-0x0000003b.html",
    0x0000004E: "error-code-0x0000004e.html",
    0x00000050: "error-code-0x00000050.html",
    0x0000005C: "error-code-0x0000005c.html",
    0x00000074: "error-code-0x00000074.html",
    0x00000077: "error-code-0x00000077.html",
    0x00000079: "error-code-0x00000079.html",
    0x0000007A: "error-code-0x0000007a.html",
    0x0000007B: "error-code-0x0000007b.html",
    0x0000007E: "error-code-0x0000007e.html",
    0x0000007F: "error-code-0x0000007f.html",
    0x00000080: "error-code-0x00000080.html",
    0x0000008E: "error-code-0x0000008e.html",
    0x0000009C: "error-code-0x0000009c.html",
    0x0000009E: "error-code-0x0000009e.html",
    0x0000009F: "error-code-0x0000009f.html",
    0x000000A5: "error-code-0x000000a5.html",
    0x000000BE: "error-code-0x000000be.html",
    0x000000C2: "error-code-0x000000c2.html",
    0x000000C4: "error-code-0x000000c4.html",
    0x000000C5: "error-code-0x000000c5.html",
    0x000000D1: "error-code-0x000000d1.html",
    0x000000D8: "error-code-0x000000d8.html",
    0x000000EA: "error-code-0x000000ea.html",
    0x000000ED: "error-code-0x000000ed.html",
    0x000000EF: "error-code-0x000000ef.html",
    0x000000F2: "error-code-0x000000f2.html",
    0x000000F4: "error-code-0x000000f4.html",
    0x000000F7: "error-code-0x000000f7.html",
    0x000000FE: "error-code-0x000000fe.html",
    0x00000101: "error-code-0x00000101.html",
    0x00000109: "error-code-0x00000109.html",
    0x00000116: "error-code-0x00000116.html",
    0x00000117: "error-code-0x00000117.html",
    0x00000119: "error-code-0x00000119.html",
    0x00000124: "error-code-0x00000124.html",
    0x0000012B: "error-code-0x0000012b.html",
    0x00000133: "error-code-0x00000133.html",
    0x00000139: "error-code-0x00000139.html",
    0x0000013A: "error-code-0x0000013a.html",
    0x00000144: "error-code-0x00000144.html",
    0x00000154: "error-code-0x00000154.html",
    0x00000164: "error-code-0x00000164.html",
}

# ── 알려진 드라이버 테이블 ────────────────────────────────────────────────────
KNOWN_DRIVERS: dict[str, tuple[str, str]] = {
    # GPU
    "nvlddmkm.sys":    ("NVIDIA 그래픽 드라이버",         "DDU로 GPU 드라이버를 완전 제거 후 최신 버전으로 재설치하세요."),
    "atikmdag.sys":    ("AMD 그래픽 드라이버",            "DDU로 GPU 드라이버를 완전 제거 후 최신 버전으로 재설치하세요."),
    "amdkmdap.sys":    ("AMD 커널 모드 드라이버",         "AMD GPU 드라이버를 최신 버전으로 업데이트하세요."),
    "amdkmdag.sys":    ("AMD 그래픽 커널 드라이버",       "AMD GPU 드라이버를 최신 버전으로 업데이트하세요."),
    "dxgkrnl.sys":     ("DirectX 그래픽 커널",           "GPU 드라이버를 업데이트하거나 Windows 업데이트를 실행하세요."),
    "dxgmms2.sys":     ("DirectX GPU 메모리 관리자",      "GPU 드라이버 업데이트를 권장합니다."),
    "igdkmd64.sys":    ("Intel 내장 그래픽 드라이버",     "Intel 그래픽 드라이버를 최신 버전으로 업데이트하세요."),
    # Storage
    "ntfs.sys":        ("NTFS 파일 시스템",               "CHKDSK /f /r로 디스크 오류를 점검하세요. SSD·HDD 불량 가능성이 있습니다."),
    "storport.sys":    ("스토리지 포트 드라이버",          "스토리지 컨트롤러 드라이버를 업데이트하거나 케이블을 점검하세요."),
    "stornvme.sys":    ("NVMe 스토리지 드라이버",         "NVMe SSD 펌웨어와 드라이버를 업데이트하세요."),
    "iastora.sys":     ("Intel RST 스토리지 드라이버",    "Intel RST 드라이버를 최신 버전으로 업데이트하세요."),
    "iastorac.sys":    ("Intel AHCI 스토리지 드라이버",   "Intel RST 드라이버를 최신 버전으로 업데이트하세요."),
    "disk.sys":        ("디스크 드라이버",                "디스크 연결 케이블과 전원을 점검하세요."),
    "volmgr.sys":      ("볼륨 관리자 드라이버",            "디스크 관리 도구로 볼륨 상태를 확인하세요."),
    "clfs.sys":        ("공통 로그 파일 시스템",           "CHKDSK 실행 및 Windows 업데이트를 권장합니다."),
    # Network
    "tcpip.sys":       ("TCP/IP 네트워크 드라이버",        "네트워크 어댑터 드라이버를 업데이트하세요."),
    "ndis.sys":        ("네트워크 드라이버 인터페이스",    "네트워크 어댑터 드라이버를 업데이트하세요."),
    # Windows core
    "ntoskrnl.exe":    ("Windows NT 운영체제 커널",        "RAM 불량 또는 시스템 파일 손상이 의심됩니다. MemTest86으로 RAM을 점검하고 sfc /scannow를 실행하세요."),
    "ntkrnlmp.exe":    ("Windows NT 커널 (멀티코어)",      "RAM 불량 또는 시스템 파일 손상이 의심됩니다."),
    "win32k.sys":      ("Windows 커널 그래픽",            "Windows 업데이트 확인 또는 GPU 드라이버를 업데이트하세요."),
    "win32kbase.sys":  ("Windows 기반 커널 그래픽",       "Windows 업데이트를 실행하세요."),
    "hal.dll":         ("하드웨어 추상화 계층(HAL)",       "드라이버 불일치 또는 시스템 파일 손상 가능성이 있습니다. sfc /scannow를 실행하세요."),
    "fltmgr.sys":      ("파일 시스템 필터 관리자",         "보안 소프트웨어 또는 파일 필터 드라이버를 점검하세요."),
    "wdf01000.sys":    ("Windows 드라이버 프레임워크",     "최근 설치한 드라이버를 점검하거나 Windows 업데이트를 실행하세요."),
    "cng.sys":         ("Windows 암호화 NG 드라이버",      "Windows 업데이트를 실행하세요."),
    # Audio
    "portcls.sys":     ("오디오 포트 클래스 드라이버",     "사운드 드라이버를 최신 버전으로 재설치하세요."),
    "ks.sys":          ("커널 스트리밍 드라이버",          "멀티미디어 드라이버를 업데이트하세요."),
    # Security / Antivirus
    "kl1.sys":         ("카스퍼스키 드라이버",             "카스퍼스키를 최신 버전으로 업데이트하거나 일시적으로 비활성화 후 테스트하세요."),
    "mfefirek.sys":    ("McAfee 방화벽 드라이버",          "McAfee를 최신 버전으로 업데이트하거나 비활성화 후 테스트하세요."),
    "umpd.sys":        ("USB 미디어 포트 드라이버",        "USB 드라이버를 업데이트하거나 USB 장치를 분리 후 테스트하세요."),
    # 아래는 실제 BSOD 사례에서 매우 자주 지목되는 드라이버인데도 표에
    # 없어서, 결함 모듈이 잡혀도 이름만 나오고 설명·조치가 비어 있던
    # 항목들이다. 리얼텍 오디오·ASMedia USB(AMD 보드에서 흔함)·Razer
    # 주변기기·Npcap 캡처 드라이버가 특히 대표적이다.
    "rtkvhd64.sys":    ("Realtek 하이 데피니션 오디오 드라이버", "리얼텍 오디오 드라이버를 제조사 최신 버전으로 재설치하세요. 실제 BSOD 원인으로 매우 흔하게 지목되는 드라이버입니다."),
    "nvhda64v.sys":    ("NVIDIA HD 오디오 드라이버",       "GPU 드라이버 재설치 시 오디오 컴포넌트도 함께 최신 버전으로 재설치하세요."),
    "asmtxhci.sys":    ("ASMedia USB 3.x 호스트 컨트롤러 드라이버", "메인보드 제조사 홈페이지에서 ASMedia USB 컨트롤러 드라이버를 최신 버전으로 업데이트하세요. AMD 메인보드에서 흔한 BSOD 원인입니다."),
    "asmthub3.sys":    ("ASMedia USB 3.x 허브 드라이버",   "메인보드 제조사의 ASMedia USB 드라이버를 최신 버전으로 업데이트하세요."),
    "rzpnk.sys":       ("Razer 주변기기 드라이버(Synapse)", "Razer Synapse와 관련 드라이버를 최신 버전으로 업데이트하거나, 문제가 계속되면 제거 후 테스트하세요."),
    "rzudd.sys":       ("Razer 통합 디스플레이 드라이버",   "Razer Synapse를 최신 버전으로 업데이트하거나 제거 후 재현 여부를 확인하세요."),
    "npf.sys":         ("Npcap/WinPcap 패킷 캡처 드라이버", "Wireshark 등에 포함된 Npcap 드라이버를 최신 버전으로 업데이트하거나, 사용하지 않는다면 제거하세요."),
    "amdppm.sys":      ("AMD 전원 관리 드라이버",           "AMD 칩셋 드라이버를 메인보드 제조사 최신 버전으로 업데이트하세요."),
    "amd_matt.sys":    ("AMD 칩셋 텔레메트리 드라이버",     "AMD 칩셋 드라이버 패키지를 최신 버전으로 업데이트하세요."),
    "rtwlane.sys":     ("Realtek 무선랜 드라이버",          "무선랜 드라이버를 노트북·메인보드 제조사 최신 버전으로 업데이트하세요."),
    "rtwlanu.sys":     ("Realtek USB 무선랜 드라이버",      "USB 무선랜 어댑터 드라이버를 최신 버전으로 업데이트하세요."),
    "acpi.sys":        ("ACPI 드라이버",                    "BIOS/UEFI를 최신 버전으로 업데이트하세요. 전원 관리 관련 하드웨어·펌웨어 문제일 수 있습니다."),
    "cldflt.sys":      ("클라우드 파일 필터 드라이버(OneDrive)", "OneDrive를 최신 버전으로 업데이트하거나 재설치하세요."),
    "usbxhci.sys":     ("USB 3 호스트 컨트롤러 드라이버",   "칩셋·USB 드라이버를 메인보드 제조사 최신 버전으로 업데이트하세요."),
    "usbhub3.sys":     ("USB 3 허브 드라이버",              "USB 드라이버를 최신 버전으로 업데이트하고, 허브·연장 케이블을 거치지 않고 직결해 재현 여부를 확인하세요."),
    # 아래는 웹 검색으로 실존 여부·역할을 재확인한 뒤 추가한 드라이버다
    # (네트워크 어댑터, 가상화, 보안 제품, 레거시 마운트 도구 등).
    "sptd.sys":        ("SCSI Pass Through Direct(가상 드라이브 마운트 도구)", "DAEMON Tools 등 가상 드라이브 프로그램이 설치한 레거시 드라이버로, 오래전부터 BSOD 원인으로 잘 알려져 있습니다. 해당 프로그램을 제거하거나 최신 버전으로 교체하세요."),
    "l1c63x64.sys":    ("Qualcomm Atheros(AR81xx) 기가비트 이더넷 드라이버", "메인보드·노트북 제조사에서 유선랜 드라이버를 최신 버전으로 업데이트하세요."),
    "e1dexpress.sys":  ("Intel 기가비트 이더넷 드라이버",     "Intel 유선랜 드라이버를 최신 버전으로 업데이트하세요."),
    "athwnx.sys":      ("Qualcomm Atheros 무선랜 드라이버",  "무선랜 드라이버를 노트북·메인보드 제조사 최신 버전으로 업데이트하세요."),
    "vboxdrv.sys":     ("Oracle VirtualBox 가상화 드라이버", "VirtualBox를 최신 버전으로 업데이트하세요. 다른 가상화 기능(Hyper-V, WSL2)과 충돌할 수 있습니다."),
    "vmswitch.sys":    ("Hyper-V 가상 스위치 드라이버",      "Hyper-V·WSL2 관련 기능을 최신 버전으로 업데이트하거나, 사용하지 않는다면 Windows 기능에서 비활성화 후 재현 여부를 확인하세요."),
    "mpfilter.sys":    ("Windows Defender(Microsoft Defender) 필터 드라이버", "Windows 업데이트로 Defender 정의를 최신화하세요. 다른 보안 프로그램과 충돌 중일 수 있습니다."),
    "eamonm.sys":      ("ESET 보안 제품 드라이버",           "ESET을 최신 버전으로 업데이트하거나 일시적으로 비활성화 후 테스트하세요."),
    "avgtpx64.sys":    ("Avast/AVG 보안 제품 드라이버",      "Avast 또는 AVG를 최신 버전으로 업데이트하거나 일시적으로 비활성화 후 테스트하세요."),
}


def is_valid(data: bytes) -> bool:
    return len(data) >= 8 and data[:4] == MINIDUMP_SIGNATURE


def is_kernel_or_full_dump(data: bytes) -> bool:
    """MDMP가 아니라 커널/전체 메모리 덤프 형식인지 확인합니다."""
    return len(data) >= 8 and data[:8] in KERNEL_DUMP_SIGNATURES


def parse(data: bytes) -> dict:
    """바이트 배열에서 미니덤프 정보를 추출해 dict로 반환합니다."""
    if not _LIB_OK:
        return {"error": "minidump 라이브러리 미설치. pip install minidump을 실행하세요."}

    with tempfile.NamedTemporaryFile(suffix=".dmp", delete=False) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        mf = MinidumpFile.parse(tmp_path)
        return _extract(mf)
    except Exception as exc:
        return {"error": f"파싱 실패: {exc}"}
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def _extract(mf) -> dict:
    result: dict = {}

    # ── 예외 / STOP 코드 ──────────────────────────────────────────────
    exception_address: Optional[int] = None

    if mf.exception:
        exc = mf.exception.ExceptionRecord
        raw = exc.ExceptionCode
        exception_address = exc.ExceptionAddress
        params = list(exc.ExceptionInformation or [])

        # 커널 BSOD에서 실제 STOP 코드는 ExceptionInformation[0]에 있음
        KERNEL_BREAKS = {0x80000003, 0x80000004, 0xC0000005, 0xC000001D}
        if raw in KERNEL_BREAKS and params and 0 < params[0] < 0x200:
            stop_code = params[0]
            stop_params = params[1:4]
        else:
            stop_code = raw
            stop_params = params[:4]

        code_name, code_desc = STOP_CODES.get(stop_code, (None, None))
        result["stopCode"] = hex(stop_code)
        result["stopCodeName"] = code_name
        result["stopCodeDesc"] = code_desc
        result["stopParams"] = [hex(x) for x in stop_params]
        # 사이트에 이미 이 코드 전용 가이드 페이지가 있으면 링크를 함께
        # 내려준다. 프런트엔드가 8개짜리 하드코딩 표를 유지할 필요가 없어진다.
        guide_page = STOP_CODE_GUIDE_PAGE.get(stop_code)
        if guide_page:
            result["stopCodeGuidePage"] = guide_page

    # ── 모듈 목록 + 결함 모듈 ─────────────────────────────────────────
    modules = []
    faulting_module: Optional[str] = None

    if mf.modules:
        for mod in mf.modules.modules:
            raw_name = mod.name or ""
            name = raw_name.replace("\\", "/").split("/")[-1]
            if not name:
                continue

            entry: dict = {"name": name, "base": hex(mod.BaseOfImage), "size": mod.SizeOfImage}

            try:
                vi = mod.VersionInfo
                if vi and vi.dwFileVersionMS:
                    hi = vi.dwFileVersionMS
                    lo = vi.dwFileVersionLS
                    entry["version"] = f"{hi >> 16}.{hi & 0xFFFF}.{lo >> 16}.{lo & 0xFFFF}"
            except Exception:
                pass

            # 예외 주소를 포함하는 모듈 = 결함 모듈
            if exception_address is not None:
                base = mod.BaseOfImage
                if base <= exception_address < base + mod.SizeOfImage:
                    faulting_module = name

            modules.append(entry)

    result["modules"] = modules[:80]

    if faulting_module:
        result["faultingModule"] = faulting_module
        key = faulting_module.lower()
        known = KNOWN_DRIVERS.get(key) or KNOWN_DRIVERS.get(faulting_module)
        if known:
            result["faultingModuleDesc"], result["faultingModuleAction"] = known

    # ── 시스템 정보 ───────────────────────────────────────────────────
    if mf.sysinfo:
        si = mf.sysinfo
        try:
            result["osBuild"] = f"{si.MajorVersion}.{si.MinorVersion}.{si.BuildNumber}"
            result["arch"] = "x64" if getattr(si, "ProcessorArchitecture", 9) == 9 else "x86"
        except Exception:
            pass

    return result
