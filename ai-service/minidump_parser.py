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
}


def is_valid(data: bytes) -> bool:
    return len(data) >= 8 and data[:4] == MINIDUMP_SIGNATURE


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
