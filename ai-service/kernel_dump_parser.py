"""Windows 커널 메모리 덤프(PAGEDU64) 헤더 분석.

C:\\Windows\\Minidump 아래 파일도 "시작 및 복구" 설정에 따라 MDMP가 아니라 이 형식으로
저장된다. 여기서는 헤더(버그체크 코드·매개변수·빌드·CPU 수)와 작은(트리아지) 덤프에
들어 있는 드라이버 이름 목록만 읽는다. 호출 스택을 풀어 원인 모듈을 특정하는 분석은
심볼이 필요해 하지 않는다(WinDbg의 !analyze -v 영역).
"""
import bisect
import re
import struct
from datetime import datetime, timedelta, timezone

from minidump_parser import STOP_CODES, STOP_CODE_GUIDE_PAGE, KNOWN_DRIVERS, _STOP_PARAM_ADDRESS_INDEX

SIGNATURE_64 = b"PAGEDU64"

DUMP_TYPES = {
    1: "전체 메모리 덤프", 2: "커널 메모리 덤프", 4: "작은 메모리 덤프(트리아지)",
    5: "자동/비트맵 전체 덤프", 6: "자동/비트맵 커널 덤프",
}
GPU_DRIVER_FILES = {
    "nvlddmkm.sys": "NVIDIA", "amdkmdag.sys": "AMD", "amdkmdap.sys": "AMD", "atikmdag.sys": "AMD",
    "igdkmd64.sys": "Intel(내장 그래픽)",
}
NTSTATUS_NAMES = {
    0x00000000: "없음",
    0xC0000001: "STATUS_UNSUCCESSFUL",
    0xC0000005: "STATUS_ACCESS_VIOLATION",
    0xC000009A: "STATUS_INSUFFICIENT_RESOURCES",
    0xC000000D: "STATUS_INVALID_PARAMETER",
}
WHEA_SOURCES = {0: "머신 체크(MCE)", 1: "수정된 머신 체크(CMC)", 2: "수정된 플랫폼 오류(CPE)", 3: "NMI",
                4: "PCI Express 오류", 5: "일반 하드웨어 오류", 6: "INIT", 7: "부트 오류"}
_NAME_RE = re.compile(r"[A-Za-z0-9_\-\.]{2,40}\.(?:sys|dll|exe)", re.I)

_TRIAGE_BASE = 0x2000


_EPOCH_1601 = datetime(1601, 1, 1, tzinfo=timezone.utc)


def _filetime_iso(v: int):
    """FILETIME(100ns)을 ISO 문자열로. 2000~2100년 밖이면 무효로 본다."""
    try:
        t = _EPOCH_1601 + timedelta(microseconds=v // 10)
    except OverflowError:
        return None
    return t.isoformat() if 2000 <= t.year <= 2100 else None


def is_kernel_64(data: bytes) -> bool:
    return len(data) >= 0x1000 and data[:8] == SIGNATURE_64


def _param_notes(code: int, p: list) -> list:
    notes = []
    if code == 0x117:
        notes.append("그래픽 드라이버가 정해진 시간 안에 응답하지 못했고(TDR 시간 초과 감지), 시스템이 중단됐습니다.")
        notes.append("매개변수 2는 문제를 일으킨 디스플레이 드라이버 모듈 안을 가리키는 주소입니다(Microsoft 문서).")
    elif code in (0x116, 0x119):
        st = p[2] & 0xFFFFFFFF
        name = NTSTATUS_NAMES.get(st)
        notes.append("그래픽 드라이버가 정해진 시간 안에 응답하지 못했고, 복구(TDR)도 실패해 시스템이 중단됐습니다.")
        if name:
            notes.append(f"실패 상태 코드: 0x{st:X} ({name})")
        else:
            notes.append(f"실패 상태 코드: 0x{st:X}")
    elif code == 0x133:
        if p[0] == 0:
            notes.append("DPC 하나가 허용 시간을 초과했습니다(단일 DPC 지연).")
            notes.append(f"DPC 소요 시간 {p[1]} 틱 / 허용 시간 {p[2]} 틱(Microsoft 문서: 매개변수 2·3).")
        elif p[0] == 1:
            notes.append("시스템이 DISPATCH_LEVEL 이상에서 누적으로 너무 오래 머물렀습니다(누적 DPC/ISR 지연).")
            notes.append(f"감시 주기 {p[1]} 틱(Microsoft 문서: 매개변수 2).")
    elif code == 0x12B:
        # Microsoft 문서: 매개변수 3·4가 모두 0이면 메모리 관리자가 0이어야 할 페이지의 단일 비트 오류를 발견,
        # 둘 다 0이 아니면 압축 저장소 관리자가 물리 메모리 손상 때문에 페이지 압축 해제에 실패한 것이다.
        if p[2] == 0 and p[3] == 0:
            notes.append("메모리 관리자가 0으로 비어 있어야 할 페이지에서 단일 비트 오류를 발견했습니다(하드웨어 메모리 오류).")
            notes.append(f"손상된 페이지의 가상 주소 0x{p[0]:X}, 물리 페이지 번호 0x{p[1]:X}")
        else:
            notes.append("압축 저장소 관리자가 물리 메모리 손상 때문에 압축된 페이지를 풀지 못했습니다(인증·CRC·압축 해제 실패 중 하나).")
            notes.append(f"실패 종류 값(FailStatus) 0x{p[0] & 0xFFFFFFFF:X}, 읽던 페이지의 압축 크기 {p[1]}바이트")
            notes.append("원인 후보(Microsoft 문서): 불량 RAM, DMA·MDL을 잘못 쓰는 드라이버, 전원 전환 중 펌웨어가 물리 페이지를 건드린 경우.")
    elif code == 0x1A and p[0] == 0x41792:
        notes.append("손상된 PTE(페이지 테이블 항목)가 발견됐습니다(Microsoft 문서).")
        notes.append(f"PTE 주소 0x{p[1]:X}, PTE 내용(매개변수 3·4: 문서상 낮은 부분·높은 부분) 0x{p[2]:X} / 0x{p[3]:X}")
    elif code == 0x1A and p[0] == 0x41790:
        notes.append("페이지 테이블 페이지가 손상됐습니다. 64비트에서 매개변수 2는 손상된 페이지 테이블 페이지의 PFN 주소입니다(Microsoft 문서).")
    elif code == 0x1A and p[0] == 0x61941:
        notes.append("페이징 계층 구조가 손상됐습니다. 매개변수 2는 오류를 일으킨 가상 주소를 가리키는 포인터입니다(Microsoft 문서).")
    elif code == 0x124:
        src = WHEA_SOURCES.get(p[0])
        if src:
            notes.append(f"하드웨어 오류 발생원: {src}")
    elif code == 0xEF:
        notes.append("Windows가 없어서는 안 되는 핵심 프로세스(또는 스레드)가 끝난 것을 감지해 시스템을 중단했습니다.")
        if p[1] == 0:
            notes.append("끝난 대상: 프로세스 전체(매개변수 2 = 0)")
        elif p[1] == 1:
            notes.append("끝난 대상: 프로세스가 아니라 그 안의 핵심 스레드(매개변수 2 = 1)")
    return notes


# ── 작은 메모리 덤프(트리아지)의 모듈 목록·호출 스택 해독 ─────────────────────────
# 실제 덤프 9개(Windows 11 두 빌드, 2026-11-26)로 구조를 확인했다. 헤더의 오프셋은 모두 "파일 처음" 기준이다.
#   트리아지 헤더(파일 0x2000): [3]ContextOffset [10]CallStackOffset [11]SizeOfCallStack [12]DriverListOffset
#                               [13]DriverCount [14]StringPoolOffset, +0x48 TopOfStack(u64)
#   드라이버 목록: 144바이트 고정 항목 × DriverCount. +0x00 이름 위치(파일 기준, [u32 글자수][UTF-16] 형식),
#                  +0x38 DllBase, +0x40 EntryPoint, +0x48 SizeOfImage
#   컨텍스트(AMD64 CONTEXT): +0x30 ContextFlags, +0x98 Rsp, +0xF8 Rip
#   호출 스택: CallStackOffset부터 SizeOfCallStack바이트, 가상 주소는 TopOfStack부터 시작
_ENTRY_SIZE = 144
_MAX_MODULES = 1500
_MAX_STACK = 262144
_MIN_RVA = 0x1000   # 모듈 시작 부분(PE 헤더)을 가리키는 값은 반환 주소로 보지 않는다
_KERNEL_VA = 0xFFFF800000000000

# 이름만으로 "Windows 기본 구성 요소"로 보이는 모듈. 이 목록에 없다고 곧 서드파티는 아니므로
# 결과에는 항상 '후보'로만 표시하고 제조사 확인을 안내한다.
SYSTEM_MODULES = frozenset("""
ntoskrnl.exe ntkrnlmp.exe ntkrnlpa.exe ntkrpamp.exe hal.dll kdcom.dll kd.dll mcupdate.dll mcupdate_genuineintel.dll mcupdate_authenticamd.dll
clfs.sys tm.sys pshed.dll bootvid.dll fltmgr.sys msrpc.sys ksecdd.sys ksecpkg.sys clipsp.sys cmimcext.sys werkernel.sys ntosext.sys
watchdog.sys wmilib.sys acpi.sys wdf01000.sys wdfldr.sys ndis.sys netio.sys tcpip.sys tcpipreg.sys fwpkclnt.sys wfplwfs.sys
ntfs.sys fastfat.sys exfat.sys refs.sys refsv1.sys udfs.sys cdfs.sys volmgr.sys volmgrx.sys volsnap.sys partmgr.sys disk.sys classpnp.sys
storport.sys stornvme.sys storahci.sys msahci.sys pci.sys pcw.sys usbxhci.sys usbhub3.sys usbport.sys usbhub.sys ucx01000.sys
hidclass.sys hidusb.sys hidparse.sys kbdclass.sys mouclass.sys kbdhid.sys mouhid.sys afd.sys http.sys win32k.sys win32kbase.sys
win32kfull.sys dxgkrnl.sys dxgmms1.sys dxgmms2.sys cng.sys ci.dll symcryptk.dll bfs.sys fileinfo.sys wof.sys msfs.sys npfs.sys cdd.dll
tdx.sys mup.sys rdbss.sys srv2.sys srvnet.sys ksthunk.sys ks.sys portcls.sys drmk.sys wdmaud.sys hdaudbus.sys msisadrv.sys
intelpep.sys intelppm.sys amdppm.sys processr.sys wdfilter.sys wdnisdrv.sys wdboot.sys vdrvroot.sys spaceport.sys storqosflt.sys
bindflt.sys cldflt.sys luafv.sys npsvctrig.sys wcifs.sys wcnfs.sys applockerfltr.sys tpm.sys ndiswan.sys nsiproxy.sys pacer.sys
monitor.sys condrv.sys beep.sys null.sys netbt.sys wanarp.sys vwifibus.sys vwififlt.sys mssecflt.sys ahcache.sys peauth.sys
pdc.sys ehstorclass.sys iorate.sys fvevol.sys
""".split())


def _u32(data, off):
    return struct.unpack_from("<I", data, off)[0] if 0 <= off <= len(data) - 4 else None


def _u64(data, off):
    return struct.unpack_from("<Q", data, off)[0] if 0 <= off <= len(data) - 8 else None


def _read_name(data: bytes, off):
    """[u32 글자수][UTF-16] 형식의 이름. 형식이 어긋나면 None."""
    if not isinstance(off, int) or off <= 0:
        return None
    n = _u32(data, off)
    if n is None or not (1 <= n <= 260) or off + 4 + n * 2 > len(data):
        return None
    name = data[off + 4:off + 4 + n * 2].decode("utf-16le", "replace")
    return name if name.isprintable() else None


def _triage_fields(data: bytes) -> dict:
    f = struct.unpack_from("<16I", data, _TRIAGE_BASE)
    return {"ctx": f[3], "proc": f[8], "thr": f[9], "stk": f[10], "stk_len": f[11], "drv": f[12], "count": f[13], "pool": f[14],
            "top": _u64(data, _TRIAGE_BASE + 18 * 4)}


def read_modules(data: bytes, hdr: dict) -> list:
    """드라이버 목록을 (이름, 시작 주소, 크기)로 읽는다. 구조가 예상과 다르면 빈 목록(→ 이름만 읽는 예전 방식)."""
    drv, count = hdr["drv"], hdr["count"]
    if not (0 < count <= _MAX_MODULES) or drv <= 0 or drv + count * _ENTRY_SIZE > len(data):
        return []
    mods = []
    for i in range(count):
        e = drv + i * _ENTRY_SIZE
        name = _read_name(data, _u64(data, e))
        base, entry, size = struct.unpack_from("<QQQ", data, e + 0x38)
        if name is None or base < _KERNEL_VA or not (0 < size <= 0x10000000):
            return []
        mods.append({"name": name, "base": base, "size": size, "entry": entry, "timestamp": struct.unpack_from("<I", data, e + 0x88)[0]})
    # 검증: 모듈 범위가 서로 겹치면 구조를 잘못 읽은 것이다.
    rng = sorted(mods, key=lambda m: m["base"])
    if any(a["base"] + a["size"] > b["base"] for a, b in zip(rng, rng[1:])):
        return []
    return mods


# ── 크래시 당시 프로세스 ────────────────────────────────────────────────────
# 트리아지 헤더의 ProcessOffset은 크래시 때 실행 중이던 프로세스의 EPROCESS 일부를 가리킨다.
# 이미지 이름(ImageFileName, 15자 + NUL)의 위치는 Windows 빌드마다 달라 고정값을 믿지 않고,
# 블롭 안에서 "…exe" 꼴의 NUL 종료 문자열을 찾는다(실제 덤프: 빌드 26100에서 +0x338에 csrss.exe).
_PROC_BLOB_MAX = 0x1000
_EXE_NAME_RE = re.compile(rb"(?<![ -~])(?:[A-Za-z0-9_\-\. ]{1,10}\.exe\x00|System\x00|Registry\x00|MemCompression\x00)", re.I)


# ImageFileName 위치를 실제 덤프로 확인한 빌드(WinDbg !analyze의 PROCESS_NAME과 대조). 이 이름은 15자에서 잘려 있어
# ".exe"로 끝나지 않을 수 있다(예: "HncUpdateServi"). 확인하지 못한 빌드는 아래 탐색으로 넘어간다.
_IMAGE_NAME_OFFSETS = {26100: 0x338}
_NAME_CHARS = frozenset(b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-. ()[]")


def _name_at_known_offset(data: bytes, off: int, end: int, build):
    pos = _IMAGE_NAME_OFFSETS.get(build)
    if pos is None or off + pos + 16 > end:
        return None
    raw = data[off + pos:off + pos + 16]
    n = raw.find(b"\x00")
    if not (1 <= n <= 15) or any(b not in _NAME_CHARS for b in raw[:n]):
        return None
    return raw[:n].decode("ascii")


def read_crash_process(data: bytes, hdr: dict, param1=None, build=None):
    """크래시 당시 프로세스 이름을 읽는다. 읽지 못하면 None.

    param1(버그체크 매개변수 1)이 있으면 스레드 블롭 앞부분(KTHREAD.Process)에 같은 주소가 있는지 보고
    `sameAsParam1`(True/False/None=확인 불가)로 알려 준다. 0xEF처럼 매개변수 1이 프로세스 객체인 코드에서
    "종료된 프로세스와 같은 프로세스"인지 가르는 근거다.
    """
    off, thr = hdr.get("proc") or 0, hdr.get("thr") or 0
    if not (0x2000 <= off < len(data)):
        return None
    end = min(len(data), off + _PROC_BLOB_MAX)
    if 0 < thr and off < thr < end:
        end = thr
    name = _name_at_known_offset(data, off, end, build)
    if name is None:
        m = _EXE_NAME_RE.search(data, off, end)
        if not m:
            return None
        name = m.group(0)[:-1].decode("ascii", "replace")
        if not name.isprintable():
            return None
    same = None
    if param1 and 0x2000 <= thr < len(data):
        seg = data[thr:min(len(data), thr + 0x400)]
        same = any(struct.unpack_from("<Q", seg, i)[0] == param1 for i in range(0, len(seg) - 7, 8))
    return {"name": name, "sameAsParam1": same}


# 이 프로세스가 끝나면 Windows가 스스로 중단(0xEF)시키는 핵심 프로세스. 이름만으로 역할을 안내하며 원인을 단정하지 않는다.
CRITICAL_PROCESSES = {
    "csrss.exe": ("Windows 하위 시스템(콘솔 창·프로세스/스레드 생성 지원)", "시스템 파일·메모리 손상 또는 보안 프로그램의 강제 종료"),
    "wininit.exe": ("시스템 시작 시 서비스·보안 기관(lsass)을 띄우는 초기화 프로세스", "시스템 파일 손상 또는 부팅 직후 서비스 충돌"),
    "winlogon.exe": ("로그온·로그오프와 보안 화면을 담당하는 프로세스", "로그온 관련 드라이버·프로그램 충돌 또는 시스템 파일 손상"),
    "smss.exe": ("세션 관리자(부팅 때 세션과 하위 시스템을 만드는 프로세스)", "시스템 파일 손상 또는 디스크 오류"),
    "services.exe": ("서비스 제어 관리자(Windows 서비스를 시작·관리)", "서비스 관련 소프트웨어 충돌 또는 시스템 파일 손상"),
    "lsass.exe": ("로컬 보안 기관(로그인 인증·보안 정책)", "보안 프로그램 충돌 또는 인증 관련 구성 요소 손상"),
    "svchost.exe": ("Windows 서비스를 실행하는 호스트 프로세스", "해당 서비스를 쓰는 드라이버·프로그램 충돌"),
    "system": ("커널 모드 작업을 처리하는 시스템 프로세스", "드라이버 또는 저장장치·메모리 문제"),
}


def process_info(name: str):
    """프로세스 이름 → (역할, 흔한 원인 분류) 또는 None."""
    return CRITICAL_PROCESSES.get((name or "").lower())


def is_system_module(name: str) -> bool:
    return (name or "").lower() in SYSTEM_MODULES


def stack_analysis(data: bytes, hdr: dict, mods: list) -> dict:
    """호출 스택에 남아 있는 값 중 모듈 범위에 속하는 것을 찾아 모듈을 나타난 순서(최근 호출이 먼저)로 돌려준다.

    스택 복원(언와인드)이 아니라 저장된 스택 바이트를 훑는 것이라, 이미 끝난 호출의 흔적이 섞일 수 있다.
    """
    stk_off, stk_len, top = hdr["stk"], hdr["stk_len"], hdr["top"]
    if not mods or not top or not (0 < stk_len <= _MAX_STACK) or stk_off <= 0 or stk_off + stk_len > len(data):
        return {}
    flags = _u32(data, hdr["ctx"] + 0x30)
    rsp = rip = None
    if flags:
        rsp, rip = _u64(data, hdr["ctx"] + 0x98), _u64(data, hdr["ctx"] + 0xF8)
    start = 0
    if rsp and top <= rsp < top + stk_len:
        start = ((rsp - top) // 8) * 8   # 현재 스택 포인터보다 아래(이미 끝난 영역)는 제외한다
    order = sorted(range(len(mods)), key=lambda i: mods[i]["base"])
    bases = [mods[i]["base"] for i in order]

    def find(addr):
        k = bisect.bisect_right(bases, addr) - 1
        if k < 0:
            return None
        m = mods[order[k]]
        return m if addr < m["base"] + m["size"] else None

    seq, counts = [], {}
    for off in range(start, stk_len - 7, 8):
        v = struct.unpack_from("<Q", data, stk_off + off)[0]
        m = find(v)
        if m is not None and v - m["base"] >= _MIN_RVA:
            if m["name"] not in counts:
                seq.append(m["name"])
            counts[m["name"]] = counts.get(m["name"], 0) + 1
    rip_mod = find(rip) if rip else None
    return {"sequence": seq, "hits": counts, "ripModule": rip_mod["name"] if rip_mod else None}


def _param_module(code: int, params: list, mods: list):
    idx = _STOP_PARAM_ADDRESS_INDEX.get(code)
    if idx is None or idx >= len(params) or not params[idx]:
        return None
    addr = params[idx]
    for m in mods:
        if m["base"] <= addr < m["base"] + m["size"]:
            return m["name"]
    return None


NOTE_NO_EXTERNAL = ("호출 스택에 남아 있는 값에서는 Windows 기본 구성 요소로 보이는 모듈만 확인되고 외부 드라이버는 나타나지 않았습니다. "
                    "특정 드라이버보다 메모리·하드웨어처럼 시스템 전체 문제일 가능성도 함께 보세요. 스택을 정밀하게 복원한 결과가 아니므로 "
                    "더 정확히 보려면 WinDbg에서 !analyze -v를 실행하세요.")
NOTE_NO_EXTERNAL_UNWIND = ("모듈 이미지로 복원한 호출 스택에서 Windows 기본 구성 요소로 보이는 모듈만 확인되고 외부 드라이버는 나타나지 않았습니다. "
                          "특정 드라이버보다 메모리·하드웨어처럼 시스템 전체 문제일 가능성도 함께 보세요. 함수 이름 해석(심볼)과 WinDbg의 분석 규칙은 "
                          "적용하지 않은 결과이므로 정밀한 판정이 필요하면 WinDbg에서 !analyze -v를 실행하세요.")
NOTE_NO_STACK = ("커널 덤프에서 호출 스택을 읽지 못해 원인 드라이버를 특정하지 않았습니다. "
                 "정밀 분석이 필요하면 WinDbg에서 !analyze -v를 실행하세요.")
BASIS_PARAM = ("STOP 코드 매개변수가 가리키는 명령 주소가 이 모듈 안에 있습니다. 호출 스택을 정밀하게 복원한 결과는 아니므로 후보로만 보세요.")
BASIS_UNWIND = ("Microsoft 심볼 서버의 모듈 이미지로 호출 스택을 복원했을 때, Windows 기본 구성 요소가 아닌 모듈 중 가장 먼저(가장 최근 호출 쪽) 나타났습니다. "
                "WinDbg의 전체 분석과는 다르므로 후보로만 보고, 제조사·버전을 함께 확인하세요.")
BASIS_STACK = ("호출 스택에 남아 있는 값에서 Windows 기본 구성 요소가 아닌 모듈 중 가장 먼저(가장 최근 호출 쪽) 나타났습니다. "
               "스택을 정밀하게 복원한 결과가 아니라 후보로만 보세요. 제조사·버전을 함께 확인하세요.")


def apply_stack_result(result: dict, code: int, params: list, mods: list, seq: list, hits: dict, method: str):
    """스택에 나타난 모듈 순서(seq, 최근 호출이 먼저)로 결과 필드와 원인 후보를 정한다. 안내 문구(없으면 None)를 돌려준다.

    method: "scan"(스택 값 훑기) 또는 "unwind"(모듈 이미지로 복원). 호출할 때마다 이전 후보·안내를 지우고 다시 정한다.
    """
    for k in ("faultingModule", "faultingModuleBasis", "faultingModuleDesc", "faultingModuleAction", "faultingModuleNote"):
        result.pop(k, None)
    result["stackMethod"] = method
    result["stackModules"] = [{"name": n, "system": is_system_module(n), "hits": hits.get(n, 1)} for n in seq[:12]]
    external = [n for n in seq if not is_system_module(n)]
    result["stackExternalModules"] = external[:8]
    culprit, basis = _param_module(code, params, mods), None
    result.pop("faultInSystemModule", None)
    if culprit and not is_system_module(culprit):
        basis = BASIS_PARAM
    elif culprit and method != "unwind":
        # 문제가 난 명령 자체가 Windows 구성 요소 안에 있다. 스택을 단순히 훑은 결과에는 이미 끝난 호출의 흔적이 섞이므로
        # (실제 사례: 커널 메모리 관리자 안에서 난 오류인데 스택에 남은 Microsoft 저장소 드라이버를 외부 후보로 지목) 지목하지 않는다.
        result["faultInSystemModule"] = culprit
        leftover = f" 스택에 남은 외부 모듈({', '.join(external[:4])})은 이전 호출의 흔적일 수 있어 원인으로 지목하지 않았습니다." if external else ""
        return (f"문제가 난 명령이 Windows 구성 요소({culprit}) 안에 있습니다.{leftover} "
                "특정 드라이버보다 메모리·CPU 같은 하드웨어나 시스템 전체 문제일 가능성도 함께 보세요. 정밀한 판정이 필요하면 WinDbg에서 !analyze -v를 실행하세요.")
    elif external:
        culprit, basis = external[0], (BASIS_UNWIND if method == "unwind" else BASIS_STACK)
    else:
        culprit = None
    if culprit and basis:
        result["faultingModule"] = culprit
        result["faultingModuleBasis"] = basis
        known_driver = KNOWN_DRIVERS.get(culprit.lower())
        if known_driver:
            result["faultingModuleDesc"], result["faultingModuleAction"] = known_driver
        return None
    return NOTE_NO_EXTERNAL_UNWIND if method == "unwind" else NOTE_NO_EXTERNAL


def apply_crash_process(result: dict, code: int, proc: dict):
    """크래시 당시 프로세스를 결과에 넣고, 0xEF면 어떤 프로세스가 끝났는지 안내를 덧붙인다."""
    name = proc["name"]
    info = process_info(name)
    entry = {"name": name}
    if info:
        entry["role"], entry["commonCauses"] = info
    if code == 0xEF:
        entry["sameAsParam1"] = proc.get("sameAsParam1")
        notes = result.setdefault("paramNotes", [])
        if proc.get("sameAsParam1"):
            notes.append(f"끝난 핵심 프로세스: {name} (버그체크가 가리키는 프로세스 객체와 덤프에 저장된 현재 프로세스가 같아 확인됨)")
        else:
            notes.append(f"크래시 당시 실행 중이던 프로세스: {name} (끝난 프로세스와 같다는 확인은 하지 못했습니다)")
        if info:
            notes.append(f"{name} — {info[0]}. 이 프로세스가 비정상 종료되는 흔한 원인: {info[1]}. 이름만으로 안내하는 일반 설명이며 이 PC의 원인을 확정하지는 않습니다.")
    result["crashProcess"] = entry


def base_code(raw: int) -> int:
    """0x1000007E처럼 맨 앞 비트(0x10000000)가 붙은 변형은 같은 계열 코드(0x7E)로 풀이한다(WinDbg도 BUGCHECK_CODE를 7e로 표시)."""
    low = raw & 0x0FFFFFFF
    return low if (raw & 0xF0000000) == 0x10000000 and low in STOP_CODES else raw


def parse(data: bytes) -> dict:
    if not is_kernel_64(data):
        return {"error": "지원하지 않는 커널 덤프 형식입니다."}
    major, build = struct.unpack_from("<II", data, 8)
    cpus = struct.unpack_from("<I", data, 0x34)[0]
    raw_code = struct.unpack_from("<I", data, 0x38)[0]
    code = base_code(raw_code)
    params = list(struct.unpack_from("<4Q", data, 0x40))
    dump_type = struct.unpack_from("<I", data, 0xF98)[0]
    crash_time = _filetime_iso(struct.unpack_from("<Q", data, 0xFA8)[0])
    uptime_100ns = struct.unpack_from("<Q", data, 0x1030)[0]
    # 부팅 후 경과 시간: 0이거나 비정상적으로 크면(10년 초과) 신뢰하지 않는다.
    uptime_min = round(uptime_100ns / 10_000_000 / 60, 1) if 0 < uptime_100ns < 10 * 365 * 24 * 3600 * 10_000_000 else None

    name, desc = STOP_CODES.get(code, (None, None))
    result = {
        "dumpFormat": "kernel",
        "dumpType": DUMP_TYPES.get(dump_type, f"알 수 없는 형식({dump_type})"),
        "stopCode": hex(raw_code),
        "stopCodeName": name,
        "stopCodeDesc": desc,
        "stopParams": [hex(x) for x in params],
        "paramNotes": _param_notes(code, params),
        "osBuild": f"10.0.{build}" if major == 15 or build >= 10240 else f"{major}.{build}",
        "arch": "x64",
        "cpuCount": cpus if 0 < cpus <= 1024 else None,
        "crashTime": crash_time,
        "uptimeMinutes": uptime_min,
        "modules": [],
    }
    guide = STOP_CODE_GUIDE_PAGE.get(code)
    if guide:
        result["stopCodeGuidePage"] = guide

    note = NOTE_NO_STACK
    if dump_type == 4 and len(data) > _TRIAGE_BASE + 0x40:
        mods, stack, hdr = [], {}, {}
        try:
            hdr = _triage_fields(data)
            mods = read_modules(data, hdr)
            stack = stack_analysis(data, hdr, mods)
        except Exception:
            mods, stack = [], {}
        if mods:
            names = [m["name"] for m in mods]
            result["modules"] = [{"name": m["name"], "base": hex(m["base"]), "size": m["size"]} for m in mods[:400]]
        else:
            try:
                names = _driver_names(data)
            except Exception:
                names = []
            result["modules"] = [{"name": n} for n in names[:200]]
        result["moduleCount"] = len(names)
        try:
            proc = read_crash_process(data, hdr, params[0] if code == 0xEF else None, build)
        except Exception:
            proc = None
        if proc:
            apply_crash_process(result, code, proc)
        gpu = []
        for n in names:
            v = GPU_DRIVER_FILES.get(n.lower())
            if v and v not in gpu:
                gpu.append(v)
        result["gpuDrivers"] = gpu
        known = [n for n in names if n.lower() in KNOWN_DRIVERS]
        result["knownDrivers"] = known[:40]

        if stack:
            note = apply_stack_result(result, code, params, mods, stack["sequence"], stack["hits"], "scan")
    if note:
        result["faultingModuleNote"] = note
    return result


def _driver_names(data: bytes) -> list:
    drv_off, drv_count, pool_off, pool_size = struct.unpack_from("<IIII", data, _TRIAGE_BASE + 12 * 4)
    start = _TRIAGE_BASE + drv_off
    end = min(len(data), _TRIAGE_BASE + pool_off + pool_size)
    if not (0 < drv_count < 2000) or start >= end:
        return []
    chunk = data[start:end]
    if len(chunk) % 2:
        chunk = chunk[:-1]
    text = chunk.decode("utf-16le", "replace")
    seen, out = set(), []
    for m in _NAME_RE.finditer(text):
        n = m.group(0)
        if n.lower() not in seen:
            seen.add(n.lower())
            out.append(n)
    # 문자열 풀 끝에는 드라이버가 아닌 프로세스 이름 등이 함께 들어 있어, 헤더가 알려 주는
    # 드라이버 수까지만 채택한다.
    return out[:drv_count]
