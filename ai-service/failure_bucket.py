"""문제 위치(함수)와 실패 버킷 이름을 WinDbg `!analyze -v` 방식에 가깝게 만든다.

WinDbg의 SYMBOL_NAME·FAILURE_BUCKET_ID는 "같은 원인의 크래시를 묶는" 이름이다. 이 모듈은 그 규칙 전체를 옮긴 것이 아니라,
실제 덤프 9개에서 WinDbg 출력과 대조해 확인한 형태만 만든다. 확인하지 못한 버그체크는 버킷을 만들지 않는다(추측하지 않는다).
확인한 형태(WinDbg 출력 → 여기서 만드는 값):
  - 접근 위반 예외(0x1E·0x7E 등, 예외 코드 0xC0000005): AV_<모듈>!<함수>   예) AV_nt!MiLockLowestValidPageTableEx
  - 0x1A(MEMORY_MANAGEMENT): 0x1a_<매개변수1>_<모듈>!<함수>              예) 0x1a_3453_nt!MiDeleteFinalPageTables
  - 0x116(그래픽 TDR): 0x116_IMAGE_<원인 모듈>                            예) 0x116_IMAGE_nvlddmkm.sys
자체 덤프 1건 대조(failureBucketBasis="windbg-1"):
  - 0x133 ISR(매개변수 1=1)이고 호출 체인을 못 푼 경우: 0x133_ISR_<외부 드라이버>!unknown_function   예) 0x133_ISR_nvlddmkm!unknown_function
  - 0x4E·0x13A: 0x4E_<P1>_<모듈>!<함수>, 0x13a_<P1>_<모듈>!<함수>   예) 0x4E_7_afd!AfdCancelReceiveDatagram (0x4E는 커널 프레임 아래 첫 커널 밖 프레임)
  - 0xA·0x50(페이지 폴트 계열): AV_<모듈>!<함수>, 함수는 매개변수가 가리키는 명령 주소(0xA=P4, 0x50=P3)   예) AV_nt!MiMakePageAvoidRead
확인했지만 만들지 않는 것: 0x9C(0x9C_SPURIOUS_<CPU 제조사>_…)·0x124(…_PROCESSOR_Cache_BANK0_MSCOD…_MCACOD…)·0x12B(…_StCtDecompressFailed_…)는 CPU 제조사·세부 필드가 필요하다.
공개 사례 기반(자체 덤프로는 아직 확인하지 못한 형태 — failureBucketBasis="public-cases"로 표시):
  - 0x117: 0x117_IMAGE_<원인 모듈>   (0x116과 같은 TDR 계열이라는 유추. 공개 WinDbg 출력의 LKD_0x117_IMAGE_nvlddmkm.sys와 일치)
  - 0x133: 0x133_<DPC|ISR>_<모듈>!<함수>   (KiInterruptDispatchNoLockNoEtw 다음 프레임. 심볼이 없으면 unknown_function,
           외부 모듈이 없으면 0x133_ISR_nt!KeAccumulateTicks). 매개변수 1이 0이면 DPC, 1이면 ISR로 표기한 공개 출력 4건 기준.
  - 0xEF(핵심 프로세스 종료): 0xEF_<프로세스>_IMAGE_<프로세스>             예) 0xEF_csrss.exe_IMAGE_csrss.exe
"""
from typing import Optional

import kernel_dump_parser as K
from minidump_parser import _STOP_PARAM_ADDRESS_INDEX

# 문제 위치로 보지 않는 범용 함수(메모리 해제·복사, 예외 전달 등). WinDbg도 이런 함수는 건너뛰고 그 호출자를 고른다.
GENERIC = frozenset("""
KeBugCheckEx KeBugCheck2 KeBugCheck KiBugCheckDispatch KiDispatchException KiExceptionDispatch KiPageFault KiGeneralProtectionFault
KxExceptionDispatchOnExceptionStack KiExceptionDispatchOnExceptionStack
ExFreePoolWithTag ExFreePool ExFreePool2 ExAllocatePoolWithTag ExAllocatePool ExAllocatePool2 ExAllocatePool3
memcpy memmove memset RtlCopyMemory RtlMoveMemory RtlFillMemory RtlZeroMemory
""".split())

_AV = 0xC0000005
_PAGEFAULT_CODES = {0x0A: 3, 0x50: 2}   # 문제 명령 주소의 매개변수 위치. 자체 덤프 각 1건(0xA·0x50)에서 WinDbg의 SYMBOL_NAME과 일치를 확인
_SKIP_KERNEL_FRAMES = {0x4E}            # 자체 덤프 1건에서 WinDbg가 afd!AfdCancelReceiveDatagram을 고른 것을 확인(0x1A·0x13A는 커널 프레임만이라 구분 불가)
_P1_BUCKET_PREFIX = {0x1A: "0x1a", 0x4E: "0x4E", 0x13A: "0x13a"}   # WinDbg 출력의 대소문자 그대로(0x1A는 처음부터 확인, 0x4E·0x13A는 덤프 각 1건)
_NT_NAMES = ("ntoskrnl.exe", "ntkrnlmp.exe", "ntkrnlpa.exe", "ntkrpamp.exe")
_EXCEPTION_CODES = {0x1E, 0x7E, 0x3B, 0x8E}   # 매개변수 1이 예외 코드인 버그체크


def _find(mods: list, addr: int):
    for m in mods:
        if m["base"] <= addr < m["base"] + m["size"]:
            return m
    return None


def locate(result: dict, mods: list, resolver, frames: list) -> Optional[dict]:
    """문제가 난 곳의 {"module", "function", "symbol"(오프셋 포함)}. 알 수 없으면 None."""
    try:
        code = K.base_code(int(result["stopCode"], 16))
        params = [int(x, 16) for x in result.get("stopParams") or []]
    except (KeyError, ValueError):
        return None
    if code in _EXCEPTION_CODES and len(params) >= 2:
        idx = _STOP_PARAM_ADDRESS_INDEX.get(code)
        m = _find(mods, params[idx]) if idx is not None and idx < len(params) else None
        hit = resolver(m["name"], params[idx] - m["base"]) if m and resolver else None
        if m and hit:
            return {"module": m["name"], "function": hit[0], "symbol": f"{K_short(m['name'])}!{hit[0]}+0x{hit[1]:x}"}
        return None
    if code in _PAGEFAULT_CODES and len(params) > _PAGEFAULT_CODES[code]:   # 페이지 폴트 계열: 매개변수가 가리키는 명령 주소가 문제 위치
        addr = params[_PAGEFAULT_CODES[code]]
        m = _find(mods, addr) if addr else None
        hit = resolver(m["name"], addr - m["base"]) if m and resolver else None
        if m and hit:
            return {"module": m["name"], "function": hit[0], "symbol": f"{K_short(m['name'])}!{hit[0]}+0x{hit[1]:x}"}
        return None
    # 그 밖의 버그체크: 버그체크 함수 바로 다음 프레임(호출한 쪽)이 문제 위치다.
    for i, f in enumerate(frames):
        if f.get("function") == "KeBugCheckEx" and i + 1 < len(frames):
            nxt = frames[i + 1]
            if code in _SKIP_KERNEL_FRAMES:   # WinDbg는 커널 프레임이 이어지면 그 아래의 첫 커널 밖 모듈 프레임을 문제 위치로 잡는다
                for g in frames[i + 1:]:
                    if g.get("function") and g["module"].lower() not in _NT_NAMES:
                        nxt = g
                        break
            if nxt.get("function"):
                return {"module": nxt["module"], "function": nxt["function"], "symbol": nxt.get("symbol") or f"{K_short(nxt['module'])}!{nxt['function']}"}
            return None
    return None


def _pick_function(where: dict, frames: list) -> Optional[tuple]:
    """(모듈, 함수). 범용 함수면 그 호출자로 넘어간다."""
    mod, func = where["module"], where["function"]
    if func not in GENERIC:
        return mod, func
    start = None
    for i, f in enumerate(frames):
        if f.get("function") == func and f["module"] == mod:
            start = i
            break
    if start is None:
        return None
    for f in frames[start + 1:]:
        if f.get("function") and f["function"] not in GENERIC:
            return f["module"], f["function"]
    return None


_INTERRUPT_DISPATCH = ("KiInterruptDispatchNoLockNoEtw", "KiInterruptDispatchNoLock", "KiInterruptDispatch")


def _dpc_watchdog_bucket(p1: int, frames: list) -> Optional[str]:
    """0x133 버킷(공개 WinDbg 출력 기준). 인터럽트 디스패치 다음 프레임이 '끊긴 코드'의 위치다."""
    kind = "DPC" if p1 == 0 else "ISR"
    for i, f in enumerate(frames):
        if f.get("function") in _INTERRUPT_DISPATCH and f.get("module", "").lower().startswith("nt"):
            if i + 1 >= len(frames):
                break   # 디스패치가 스택 끝이면 끊긴 코드의 프레임이 없다 → 아래 커널 내부 규칙으로
            nxt = frames[i + 1]
            mod = K_short(nxt["module"]) if nxt.get("module") else None
            if not mod:
                return None
            return f"0x133_{kind}_{mod}!{nxt.get('function') or 'unknown_function'}"
    for i, f in enumerate(frames):   # 외부 모듈 없이 커널 안에서 시간이 쌓인 경우
        if f.get("function") == "KeBugCheckEx" and i + 1 < len(frames) and frames[i + 1].get("function") == "KeAccumulateTicks":
            return "0x133_ISR_nt!KeAccumulateTicks"
    return None


def _scan_isr_bucket(result: dict, p1: int) -> Optional[str]:
    """호출 체인을 못 푼 0x133(ISR) 덤프의 대체 규칙. 저장된 스택이 인터럽트 스택이라 스택 포인터가 그 밖에 있으면 복원이 시작되지 않는다.
    스택을 훑은 결과에서 커널 다음으로 나오는 첫 모듈이 외부 드라이버이고 그것이 원인 모듈이면, WinDbg처럼 그 드라이버의 ISR로 묶는다.
    자체 덤프 1건(nvlddmkm, 매개변수 1=1)에서 WinDbg의 0x133_ISR_nvlddmkm!unknown_function과 일치함을 확인했다. DPC(매개변수 1=0)는 확인한 덤프가 없어 만들지 않는다."""
    if p1 != 1 or result.get("stackMethod") != "scan":
        return None
    fault = result.get("faultingModule")
    seq = [m.get("name") for m in result.get("stackModules") or [] if m.get("name")]
    if not fault or len(seq) < 2 or K.is_system_module(fault) or not K.is_system_module(seq[0]) or seq[1] != fault:
        return None
    return f"0x133_ISR_{K_short(fault)}!unknown_function"


def apply(result: dict, mods: list, resolver, frames: list) -> dict:
    """result에 faultingSymbol·failureBucket을 넣는다(알 수 있는 것만)."""
    for k in ("faultingSymbol", "failureBucket", "failureBucketBasis"):
        result.pop(k, None)
    try:
        code = K.base_code(int(result["stopCode"], 16))
        params = [int(x, 16) for x in result.get("stopParams") or []]
    except (KeyError, ValueError):
        return result
    where = locate(result, mods, resolver, frames)
    if where:
        result["faultingSymbol"] = where["symbol"]
    bucket = None
    if code in _EXCEPTION_CODES and params and (params[0] & 0xFFFFFFFF) == _AV and where:   # 매개변수는 64비트로 부호 확장돼 있을 수 있다
        picked = _pick_function(where, frames)
        if picked:
            bucket = f"AV_{K_short(picked[0])}!{picked[1]}"
    elif code in _P1_BUCKET_PREFIX and len(params) >= 1 and where:
        picked = _pick_function(where, frames)
        if picked:
            bucket = f"{_P1_BUCKET_PREFIX[code]}_{params[0]:x}_{K_short(picked[0])}!{picked[1]}"
            if code != 0x1A:
                result["failureBucketBasis"] = "windbg-1"
    elif code in _PAGEFAULT_CODES and where:
        picked = _pick_function(where, frames)
        if picked:
            bucket = f"AV_{K_short(picked[0])}!{picked[1]}"
            result["failureBucketBasis"] = "windbg-1"
    elif code == 0x116 and result.get("faultingModule"):
        bucket = f"0x{code:X}_IMAGE_{result['faultingModule']}"
    elif code == 0x117 and result.get("faultingModule"):
        bucket = f"0x117_IMAGE_{result['faultingModule']}"
        result["failureBucketBasis"] = "public-cases"
    elif code == 0x133 and params and params[0] in (0, 1):
        b = _dpc_watchdog_bucket(params[0], frames)
        if b:
            bucket = b
            result["failureBucketBasis"] = "public-cases"
        elif not frames:
            b = _scan_isr_bucket(result, params[0])
            if b:
                bucket = b
                result["failureBucketBasis"] = "windbg-1"
    elif code == 0xEF and isinstance(result.get("crashProcess"), dict) and result["crashProcess"].get("name"):
        p = result["crashProcess"]["name"]
        bucket = f"0xEF_{p}_IMAGE_{p}"
    if bucket:
        result["failureBucket"] = bucket
    return result


def K_short(name: str) -> str:
    low = name.lower()
    if low in ("ntoskrnl.exe", "ntkrnlmp.exe", "ntkrnlpa.exe", "ntkrpamp.exe"):
        return "nt"
    return name.rsplit(".", 1)[0] if "." in name else name
