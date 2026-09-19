"""Windows 커널 메모리 덤프(PAGEDU64) 헤더 분석.

C:\\Windows\\Minidump 아래 파일도 "시작 및 복구" 설정에 따라 MDMP가 아니라 이 형식으로
저장된다. 여기서는 헤더(버그체크 코드·매개변수·빌드·CPU 수)와 작은(트리아지) 덤프에
들어 있는 드라이버 이름 목록만 읽는다. 호출 스택을 풀어 원인 모듈을 특정하는 분석은
심볼이 필요해 하지 않는다(WinDbg의 !analyze -v 영역).
"""
import re
import struct

from minidump_parser import STOP_CODES, STOP_CODE_GUIDE_PAGE, KNOWN_DRIVERS

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


def is_kernel_64(data: bytes) -> bool:
    return len(data) >= 0x1000 and data[:8] == SIGNATURE_64


def _param_notes(code: int, p: list) -> list:
    notes = []
    if code in (0x116, 0x117, 0x119):
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
        elif p[0] == 1:
            notes.append("시스템이 DISPATCH_LEVEL 이상에서 누적으로 너무 오래 머물렀습니다(누적 DPC/ISR 지연).")
    elif code == 0x124:
        src = WHEA_SOURCES.get(p[0])
        if src:
            notes.append(f"하드웨어 오류 발생원: {src}")
    return notes


def parse(data: bytes) -> dict:
    if not is_kernel_64(data):
        return {"error": "지원하지 않는 커널 덤프 형식입니다."}
    major, build = struct.unpack_from("<II", data, 8)
    cpus = struct.unpack_from("<I", data, 0x34)[0]
    code = struct.unpack_from("<I", data, 0x38)[0]
    params = list(struct.unpack_from("<4Q", data, 0x40))
    dump_type = struct.unpack_from("<I", data, 0xF98)[0]

    name, desc = STOP_CODES.get(code, (None, None))
    result = {
        "dumpFormat": "kernel",
        "dumpType": DUMP_TYPES.get(dump_type, f"알 수 없는 형식({dump_type})"),
        "stopCode": hex(code),
        "stopCodeName": name,
        "stopCodeDesc": desc,
        "stopParams": [hex(x) for x in params],
        "paramNotes": _param_notes(code, params),
        "osBuild": f"10.0.{build}" if major == 15 or build >= 10240 else f"{major}.{build}",
        "arch": "x64",
        "cpuCount": cpus if 0 < cpus <= 1024 else None,
        "modules": [],
    }
    guide = STOP_CODE_GUIDE_PAGE.get(code)
    if guide:
        result["stopCodeGuidePage"] = guide

    if dump_type == 4 and len(data) > _TRIAGE_BASE + 0x40:
        try:
            names = _driver_names(data)
        except Exception:
            names = []
        result["modules"] = [{"name": n} for n in names[:200]]
        gpu = []
        for n in names:
            v = GPU_DRIVER_FILES.get(n.lower())
            if v and v not in gpu:
                gpu.append(v)
        result["gpuDrivers"] = gpu
        known = [n for n in names if n.lower() in KNOWN_DRIVERS]
        result["knownDrivers"] = known[:40]
    result["faultingModuleNote"] = ("커널 덤프 형식이라 호출 스택 기반으로 원인 드라이버를 특정하지 않았습니다. "
                                    "정밀 분석이 필요하면 WinDbg에서 !analyze -v를 실행하세요.")
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
    return out
