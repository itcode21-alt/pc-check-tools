"""작은 메모리 덤프의 호출 스택을 모듈 이미지로 복원해 분석 결과에 반영한다.

kernel_dump_parser가 만든 결과(스택 값 훑기 기반)를, Microsoft 심볼 서버의 모듈 이미지로 복원한 호출 체인으로 덮어쓴다.
이미지를 못 받으면(서버 없음·시간 초과·제조사 드라이버 등) 가능한 곳까지만 복원하고, 못 한 부분은 훑기 결과를 그대로 둔다.
어떤 실패도 분석을 막지 않는다(결과를 바꾸지 않고 돌려준다).
"""
import logging
import struct
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from typing import Optional

import kernel_dump_parser as K
import pe_image
import symbol_store

logger = logging.getLogger("itsvc.ai.unwind")

_CTX_REGS = [0x78, 0x80, 0x88, 0x90, 0x98, 0xA0, 0xA8, 0xB0, 0xB8, 0xC0, 0xC8, 0xD0, 0xD8, 0xE0, 0xE8, 0xF0]
MAX_FRAMES = 48
DEFAULT_BUDGET_SEC = 25.0
MAX_PREFETCH = 10
_slots = threading.BoundedSemaphore(2)   # 동시에 두 분석까지만 이미지를 받는다(나머지는 스캔 결과로 진행)


class _Images:
    """모듈 이름 → PEImage 캐시. 받지 못한 모듈은 한 번만 시도한다."""

    def __init__(self, mods: list, deadline: float):
        self.deadline = deadline
        self._by_name = {m["name"]: m for m in mods}
        self._images: dict = {}
        self.missing: set = set()

    def prefetch(self, names: list):
        todo = [n for n in names if n in self._by_name and n not in self._images and n not in self.missing][:MAX_PREFETCH]
        if not todo:
            return
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(self.get, todo))

    def get(self, name: str) -> Optional[pe_image.PEImage]:
        if name in self._images:
            return self._images[name]
        if name in self.missing or name not in self._by_name:
            return None
        m = self._by_name[name]
        data = symbol_store.fetch(name, m["timestamp"], m["size"], self.deadline)
        img = None
        if data is not None:
            try:
                img = pe_image.PEImage(data)
            except (ValueError, struct.error):
                img = None
        if img is None:
            self.missing.add(name)
        else:
            self._images[name] = img
        return img


def _find(mods_sorted, bases, addr):
    import bisect
    k = bisect.bisect_right(bases, addr) - 1
    if k < 0:
        return None
    m = mods_sorted[k]
    return m if addr < m["base"] + m["size"] else None


def unwind(data: bytes, hdr: dict, mods: list, budget_sec: float = DEFAULT_BUDGET_SEC, seed_modules: Optional[list] = None) -> dict:
    """호출 체인을 복원한다. 돌려주는 값: {"frames": [...], "stop": 이유, "complete": 마지막까지 복원했는가}. 복원을 못 하면 {}."""
    ctx, stk_off, stk_len, top = hdr["ctx"], hdr["stk"], hdr["stk_len"], hdr["top"]
    if not mods or not top or not (0 < stk_len <= K._MAX_STACK) or stk_off <= 0 or stk_off + stk_len > len(data):
        return {}
    if not _u32(data, ctx + 0x30):
        return {}
    regs = [_u64(data, ctx + o) for o in _CTX_REGS]
    rip = _u64(data, ctx + 0xF8)
    if rip is None or any(r is None for r in regs) or not (top <= regs[pe_image.RSP] < top + stk_len):
        return {}
    start = time.monotonic()
    images = _Images(mods, start + budget_sec)
    mods_sorted = sorted(mods, key=lambda m: m["base"])
    bases = [m["base"] for m in mods_sorted]

    def read_u64(addr):
        off = addr - top
        if 0 <= off <= stk_len - 8:
            return struct.unpack_from("<Q", data, stk_off + off)[0]
        return None

    first = _find(mods_sorted, bases, rip)
    images.prefetch(([first["name"]] if first else []) + list(seed_modules or []))
    frames, stop, exact = [], "end", True
    for _ in range(MAX_FRAMES):
        mod = _find(mods_sorted, bases, rip)
        if mod is None:
            stop = "outside-modules"
            break
        rva = rip - mod["base"]
        img = images.get(mod["name"])
        frame = {"module": mod["name"], "rva": rva, "symbol": None}
        look = rva if exact else rva - 1   # 호출 다음 주소는 호출한 함수 안으로 보려고 1 뺀다
        if img is not None:
            try:
                rf = img.runtime_function(look)
                ex = img.nearest_export(rva)
                if ex and (rf is None or ex[1] <= rva - rf[0]):   # 같은 함수 안의 내보내기 이름만 믿는다
                    frame["symbol"] = f"{mod['name']}!{ex[0]}+0x{ex[1]:x}"
            except (ValueError, struct.error):
                pass
        frames.append(frame)
        if img is None:
            stop = "image-missing"
            break
        try:
            nrip, nregs, machine = pe_image.virtual_unwind(img, look, regs, read_u64)
        except (ValueError, struct.error):
            stop = "unwind-failed"
            break
        if not machine and nregs[pe_image.RSP] <= regs[pe_image.RSP]:
            stop = "stack-not-advancing"
            break
        if nrip == 0:
            stop = "end"
            break
        rip, regs, exact = nrip, nregs, machine
    else:
        stop = "max-frames"
    return {"frames": frames, "stop": stop, "complete": stop == "end", "missing": sorted(images.missing),
            "images": len(images._images), "seconds": round(time.monotonic() - start, 1)}


def _u32(data, off):
    return struct.unpack_from("<I", data, off)[0] if 0 <= off <= len(data) - 4 else None


def _u64(data, off):
    return struct.unpack_from("<Q", data, off)[0] if 0 <= off <= len(data) - 8 else None


def enhance(data: bytes, result: dict, budget_sec: float = DEFAULT_BUDGET_SEC) -> dict:
    """kernel_dump_parser.parse 결과에 복원한 호출 체인을 덧붙이고 원인 후보를 다시 정한다. 실패하면 결과를 그대로 둔다."""
    if not _slots.acquire(timeout=1.0):
        result["stackUnwind"] = {"used": False, "reason": "busy"}
        return result
    try:
        if result.get("dumpFormat") != "kernel" or result.get("stackMethod") is None:
            return result
        hdr = K._triage_fields(data)
        mods = K.read_modules(data, hdr)
        seed = [m["name"] for m in (result.get("stackModules") or [])]
        out = unwind(data, hdr, mods, budget_sec, seed)
        frames = out.get("frames") or []
        if len(frames) < 2:
            result["stackUnwind"] = {"used": False, "reason": out.get("stop") or "unavailable", "missing": out.get("missing", [])}
            return result
        seq, hits = [], {}
        for f in frames:
            hits[f["module"]] = hits.get(f["module"], 0) + 1
            if f["module"] not in seq:
                seq.append(f["module"])
        params = [int(x, 16) for x in (result.get("stopParams") or [])]
        code = K.base_code(int(result["stopCode"], 16))
        result["stackFrames"] = [{"module": f["module"], "rva": hex(f["rva"]), "symbol": f["symbol"]} for f in frames[:40]]
        note = K.apply_stack_result(result, code, params, mods, seq, hits, "unwind")
        if note:
            result["faultingModuleNote"] = note
        result["stackUnwind"] = {"used": True, "complete": out["complete"], "stop": out["stop"], "missing": out["missing"],
                                 "images": out["images"], "seconds": out["seconds"]}
    except Exception:
        logger.exception("stack unwind failed")
    finally:
        _slots.release()
    return result
