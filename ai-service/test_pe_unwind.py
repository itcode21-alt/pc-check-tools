"""PE 파서·x64 언와인더·심볼 서버 캐시·호출 스택 복원 테스트. 실행: python test_pe_unwind.py (pytest도 가능)

네트워크는 쓰지 않는다(urlopen을 가짜로 바꿈). 실제 심볼 서버·실제 덤프로 확인하려면 SYMBOL_CACHE_DIR(이미지가 이미 있는 캐시)과
ITSVC_DUMP_SAMPLES(덤프 폴더)를 지정한다.
"""
import glob
import io
import os
import struct
import tempfile
import urllib.error
from pathlib import Path

import kernel_dump_parser as K
import pe_image as PE
import stack_unwinder as U
import symbol_store as SS
import test_kernel_dump_parser as T

# ── 합성 PE 만들기 ────────────────────────────────────────────────────────
SEC_VA, SEC_RAW, SEC_SIZE = 0x1000, 0x400, 0x5000
PDATA_RVA, XDATA_RVA, EXP_RVA = 0x3000, 0x4000, 0x5000


def c_push(off, reg):
    return [off | (PE.UWOP_PUSH_NONVOL << 8) | (reg << 12)]


def c_alloc(off, size):
    assert size % 8 == 0 and 8 <= size <= 128
    return [off | (PE.UWOP_ALLOC_SMALL << 8) | (((size - 8) // 8) << 12)]


def c_alloc_large(off, size):
    return [off | (PE.UWOP_ALLOC_LARGE << 8), size // 8]


def c_setfp(off):
    return [off | (PE.UWOP_SET_FPREG << 8)]


def c_save(off, reg, slot):
    return [off | (PE.UWOP_SAVE_NONVOL << 8) | (reg << 12), slot]


def c_mach(off, error_code=False):
    return [off | (PE.UWOP_PUSH_MACHFRAME << 8) | ((1 if error_code else 0) << 12)]


def unwind_bytes(prolog, codes, frame_reg=0, frame_off=0, chain=None):
    slots = [x for c in codes for x in c]
    count = len(slots)                      # CountOfCodes는 패딩 전의 슬롯 수
    if count % 2:
        slots.append(0)                     # 언와인드 코드 배열은 짝수 칸으로 맞춘다
    flags = PE.UNW_FLAG_CHAININFO if chain else 0
    head = bytes([1 | (flags << 3), prolog, count, frame_reg | ((frame_off // 16) << 4)])
    tail = struct.pack("<III", *chain) if chain else b""
    return head + b"".join(struct.pack("<H", x) for x in slots) + tail


def make_pe(timestamp=0x11111111, size_of_image=0x10000, funcs=(), exports=()):
    """funcs: [(begin, end, unwind_info_bytes)], exports: [(rva, 이름)]."""
    data = bytearray(SEC_RAW + SEC_SIZE)
    data[0:2] = b"MZ"
    nt, opt_size = 0x80, 0xF0
    struct.pack_into("<I", data, 0x3C, nt)
    data[nt:nt + 4] = b"PE\0\0"
    struct.pack_into("<HHI", data, nt + 4, 0x8664, 1, timestamp)
    struct.pack_into("<H", data, nt + 0x14, opt_size)
    opt = nt + 0x18
    struct.pack_into("<H", data, opt, 0x20B)
    struct.pack_into("<Q", data, opt + 0x18, 0x140000000)
    struct.pack_into("<II", data, opt + 0x38, size_of_image, 0x400)
    struct.pack_into("<I", data, opt + 0x6C, 16)
    struct.pack_into("<8sIIII", data, nt + 0x18 + opt_size, b".rdata", SEC_SIZE, SEC_VA, SEC_SIZE, SEC_RAW)

    def put(rva, raw):
        data[SEC_RAW + (rva - SEC_VA):SEC_RAW + (rva - SEC_VA) + len(raw)] = raw

    xcur = XDATA_RVA
    entries = []
    for begin, end, ub in sorted(funcs):
        put(xcur, ub)
        entries.append(struct.pack("<III", begin, end, xcur))
        xcur += (len(ub) + 3) & ~3
    if entries:
        put(PDATA_RVA, b"".join(entries))
        struct.pack_into("<II", data, opt + 0x70 + 8 * 3, PDATA_RVA, len(entries) * 12)
    if exports:
        ex = sorted(exports)
        n = len(ex)
        put(EXP_RVA, struct.pack("<IIHHIIIIIII", 0, 0, 0, 0, 0, 1, n, n, EXP_RVA + 0x100, EXP_RVA + 0x200, EXP_RVA + 0x300))
        name_off = EXP_RVA + 0x400
        for i, (rva, name) in enumerate(ex):
            put(EXP_RVA + 0x100 + 4 * i, struct.pack("<I", rva))
            put(EXP_RVA + 0x200 + 4 * i, struct.pack("<I", name_off))
            put(EXP_RVA + 0x300 + 2 * i, struct.pack("<H", i))
            put(name_off, name.encode() + b"\0")
            name_off += len(name) + 1
        struct.pack_into("<II", data, opt + 0x70, EXP_RVA, 0x500)
    return bytes(data)


def mem(values: dict):
    return lambda addr: values.get(addr)


def regs(**kw):
    r = [0] * 16
    for k, v in kw.items():
        r[PE.REG_NAMES.index(k)] = v
    return r


RSP0 = 0x1000


def test_garbage_is_rejected():
    for bad in (b"", b"MZ" + b"\0" * 600, b"\x7fELF" + b"\0" * 600):
        try:
            PE.PEImage(bad)
        except ValueError:
            continue
        raise AssertionError("garbage accepted")
    good = make_pe()
    try:
        PE.PEImage(good[:0x100])
    except ValueError:
        pass
    else:
        raise AssertionError("truncated accepted")


def test_leaf_function_returns_from_top_of_stack():
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(0, []))]))
    rip, r, mach = PE.virtual_unwind(img, 0x1500, regs(rsp=RSP0), mem({RSP0: 0xAAAA}))   # 어떤 함수에도 속하지 않음 = 리프
    assert (rip, r[PE.RSP], mach) == (0xAAAA, RSP0 + 8, False)


def test_alloc_small_then_return():
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(4, [c_alloc(4, 0x28)]))]))
    rip, r, _ = PE.virtual_unwind(img, 0x1150, regs(rsp=RSP0), mem({RSP0 + 0x28: 0xBBBB}))
    assert (rip, r[PE.RSP]) == (0xBBBB, RSP0 + 0x28 + 8)


def test_push_nonvol_restores_register_and_alloc_large():
    # 프롤로그: push rbp(오프셋 1) → sub rsp,0x100(오프셋 8). 코드 배열은 실행의 역순.
    info = unwind_bytes(8, [c_alloc_large(8, 0x100), c_push(1, PE.RBP)])
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, info)]))
    saved_rbp, ret = 0x7777, 0xCCCC
    rip, r, _ = PE.virtual_unwind(img, 0x1180, regs(rsp=RSP0, rbp=0x1), mem({RSP0 + 0x100: saved_rbp, RSP0 + 0x108: ret}))
    assert (rip, r[PE.RBP], r[PE.RSP]) == (ret, saved_rbp, RSP0 + 0x110)


def test_frame_register_function_uses_rbp_to_find_the_frame():
    # push rbp; sub rsp,0x20; lea rbp,[rsp+0x20](=SET_FPREG, 프레임 오프셋 0x20). rsp가 중간에 바뀌어도 rbp로 복원한다.
    info = unwind_bytes(8, [c_alloc(8, 0x20), c_setfp(4), c_push(1, PE.RBP)], frame_reg=PE.RBP, frame_off=0x20)
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, info)]))
    frame_rbp = RSP0 + 0x40               # = 프롤로그가 끝난 뒤 rsp + 0x20
    rip, r, _ = PE.virtual_unwind(img, 0x1190, regs(rsp=0xDEAD0000, rbp=frame_rbp),   # 현재 rsp는 믿지 않는다
                                  mem({frame_rbp: 0x5151, frame_rbp + 8: 0xDDDD}))
    assert (rip, r[PE.RBP], r[PE.RSP]) == (0xDDDD, 0x5151, frame_rbp + 16)


def test_pc_inside_prologue_applies_only_executed_codes():
    info = unwind_bytes(8, [c_alloc(8, 0x20), c_push(1, PE.RBP)])
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, info)]))
    # 오프셋 2: push rbp까지만 실행됨 → rsp += 8 한 뒤 반환 주소
    rip, r, _ = PE.virtual_unwind(img, 0x1102, regs(rsp=RSP0), mem({RSP0: 0x1234, RSP0 + 8: 0xEEEE}))
    assert (rip, r[PE.RBP], r[PE.RSP]) == (0xEEEE, 0x1234, RSP0 + 16)


def test_machine_frame_returns_the_faulting_instruction_and_stack():
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(0, [c_mach(0)]))]))
    m = {RSP0: 0xFA17, RSP0 + 8: 0x10, RSP0 + 0x10: 0x246, RSP0 + 0x18: 0x9000, RSP0 + 0x20: 0x18}
    rip, r, mach = PE.virtual_unwind(img, 0x1100, regs(rsp=RSP0), mem(m))
    assert (rip, r[PE.RSP], mach) == (0xFA17, 0x9000, True)
    img2 = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(0, [c_mach(0, error_code=True)]))]))
    m2 = {RSP0: 0x2, RSP0 + 8: 0xFA18, RSP0 + 0x20: 0x9100}
    rip, r, mach = PE.virtual_unwind(img2, 0x1100, regs(rsp=RSP0), mem(m2))
    assert (rip, r[PE.RSP], mach) == (0xFA18, 0x9100, True)


def test_chained_unwind_info_continues_in_the_parent():
    parent = unwind_bytes(4, [c_alloc(4, 0x28)])
    child = unwind_bytes(0, [], chain=(0x1100, 0x1200, XDATA_RVA))   # 부모 = 첫 번째로 놓인 언와인드 정보(XDATA_RVA)
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, parent), (0x1300, 0x1400, child)]))
    rip, r, _ = PE.virtual_unwind(img, 0x1350, regs(rsp=RSP0), mem({RSP0 + 0x28: 0xABCD}))
    assert (rip, r[PE.RSP]) == (0xABCD, RSP0 + 0x30)


def test_unreadable_stack_or_bad_unwind_info_raises_value_error():
    img = PE.PEImage(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(4, [c_alloc(4, 0x28)]))]))
    try:
        PE.virtual_unwind(img, 0x1150, regs(rsp=RSP0), mem({}))
    except ValueError:
        pass
    else:
        raise AssertionError("읽을 수 없는 스택을 조용히 넘김")
    bad = bytearray(make_pe(funcs=[(0x1100, 0x1200, unwind_bytes(4, [c_alloc(4, 0x28)]))]))
    bad[SEC_RAW + (XDATA_RVA - SEC_VA)] = 0xFF      # 버전·플래그 깨짐
    try:
        PE.virtual_unwind(PE.PEImage(bytes(bad)), 0x1150, regs(rsp=RSP0), mem({RSP0 + 0x28: 1}))
    except ValueError:
        pass
    else:
        raise AssertionError("깨진 언와인드 정보를 받아들임")


def test_nearest_export_name():
    img = PE.PEImage(make_pe(exports=[(0x1100, "KeBugCheckEx"), (0x1400, "IofCallDriver")]))
    assert img.nearest_export(0x1110) == ("KeBugCheckEx", 0x10)
    assert img.nearest_export(0x1400) == ("IofCallDriver", 0)
    assert img.nearest_export(0x1000) is None


# ── 심볼 서버 캐시 ────────────────────────────────────────────────────────
class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def _with_env(**env):
    class Ctx:
        def __enter__(self):
            self.old = {k: os.environ.get(k) for k in env}
            os.environ.update({k: str(v) for k, v in env.items()})
            self.tmp = tempfile.TemporaryDirectory()
            os.environ["SYMBOL_CACHE_DIR"] = self.tmp.name
            return self.tmp.name

        def __exit__(self, *a):
            for k, v in self.old.items():
                os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)
            os.environ.pop("SYMBOL_CACHE_DIR", None)
            self.tmp.cleanup()
    return Ctx()


def test_symbol_id_validation_blocks_path_tricks():
    assert SS.valid_id("ntoskrnl.exe", 0xAFF6531F, 0x1450000)
    for bad in ("../etc/passwd", "a/b.sys", "", "x" * 80, ".hidden", "a b.sys", "a?b.sys"):
        assert not SS.valid_id(bad, 1, 0x1000), bad
    assert not SS.valid_id("a.sys", -1, 0x1000) and not SS.valid_id("a.sys", 1 << 33, 0x1000) and not SS.valid_id("a.sys", 1, 0)
    assert SS.image_key(0xAFF6531F, 0x1450000) == "AFF6531F1450000"


def test_disabled_fetch_never_touches_the_network():
    with _with_env(SYMBOL_FETCH_ENABLED=0):
        orig = SS.urllib.request.urlopen
        SS.urllib.request.urlopen = lambda *a, **k: (_ for _ in ()).throw(AssertionError("network used"))
        try:
            assert SS.fetch("hal.dll", 0x11111111, 0x10000) is None
        finally:
            SS.urllib.request.urlopen = orig


def test_download_is_validated_cached_and_only_asks_the_symbol_server():
    pe = make_pe(timestamp=0x11111111, size_of_image=0x10000)
    calls = []

    def fake_urlopen(req, timeout=None):
        calls.append(req.full_url)
        return _Resp(pe)

    with _with_env(SYMBOL_FETCH_ENABLED=1, SYMBOL_DAILY_FETCH_CAP=50):
        orig = SS.urllib.request.urlopen
        SS.urllib.request.urlopen = fake_urlopen
        try:
            assert SS.fetch("Hal.dll", 0x11111111, 0x10000) == pe
            assert SS.fetch("Hal.dll", 0x11111111, 0x10000) == pe          # 두 번째는 캐시
            assert calls == ["https://msdl.microsoft.com/download/symbols/hal.dll/1111111110000/hal.dll"]
            # 요청과 다른 이미지(타임스탬프 불일치)는 저장하지 않고, 같은 요청을 다시 묻지 않는다
            assert SS.fetch("evil.sys", 0x22222222, 0x10000) is None
            n = len(calls)
            assert SS.fetch("evil.sys", 0x22222222, 0x10000) is None and len(calls) == n
        finally:
            SS.urllib.request.urlopen = orig


def test_404_is_remembered_and_daily_cap_stops_downloads():
    calls = []

    def not_found(req, timeout=None):
        calls.append(1)
        raise urllib.error.HTTPError(req.full_url, 404, "nf", {}, None)

    with _with_env(SYMBOL_FETCH_ENABLED=1, SYMBOL_DAILY_FETCH_CAP=50):
        orig = SS.urllib.request.urlopen
        SS.urllib.request.urlopen = not_found
        try:
            assert SS.fetch("vendor.sys", 0x33333333, 0x8000) is None and SS.fetch("vendor.sys", 0x33333333, 0x8000) is None
            assert len(calls) == 1
        finally:
            SS.urllib.request.urlopen = orig
    with _with_env(SYMBOL_FETCH_ENABLED=1, SYMBOL_DAILY_FETCH_CAP=0):
        SS._day.update({"date": None, "count": 0})
        SS.urllib.request.urlopen = lambda *a, **k: (_ for _ in ()).throw(AssertionError("cap ignored"))
        try:
            assert SS.fetch("capped.sys", 0x44444444, 0x8000) is None
        finally:
            SS.urllib.request.urlopen = orig


# ── 호출 스택 복원(합성 덤프 + 가짜 이미지) ──────────────────────────────────
def _images(**by_name):
    def fake_fetch(name, ts, size, deadline=None):
        return by_name.get(name)
    return fake_fetch


def _run(stack, images, rsp_slot=0, code=0x50, params=(1, 2, 3, 4)):
    data = T.build_dump(code=code, params=params, mods=T.MODS, stack=stack, rsp_slot=rsp_slot)
    result = K.parse(data)
    orig = SS.fetch
    SS.fetch = _images(**images)
    try:
        return U.enhance(data, result, budget_sec=5)
    finally:
        SS.fetch = orig


NT_IMG = make_pe(funcs=[(0x2000 - 0x100, 0x2000 + 0x100, unwind_bytes(4, [c_alloc(4, 0x28)]))])      # rip rva 0x2000, 스택 5칸
NTFS_IMG = make_pe(funcs=[(0x7F00, 0x8100, unwind_bytes(4, [c_alloc(4, 0x18)]))])                  # 반환 주소 rva 0x8000


def test_unwind_follows_return_addresses_through_modules_and_names_the_external_one():
    stack = [0] * 5 + [T._addr(T.NTFS, 0x8000)] + [0] * 3 + [T._addr(T.BAD, 0x1234), 0, 0]
    r = _run(stack, {"ntoskrnl.exe": NT_IMG, "Ntfs.sys": NTFS_IMG})
    assert r["stackMethod"] == "unwind" and r["stackUnwind"]["used"]
    assert [f["module"] for f in r["stackFrames"]] == ["ntoskrnl.exe", "Ntfs.sys", "badrv.sys"]
    assert r["stackUnwind"]["stop"] == "image-missing" and r["stackUnwind"]["missing"] == ["badrv.sys"]
    assert r["faultingModule"] == "badrv.sys" and "복원" in r["faultingModuleBasis"]
    assert [m["name"] for m in r["stackModules"]] == ["ntoskrnl.exe", "Ntfs.sys", "badrv.sys"]


def test_unwind_ignores_stale_stack_values_that_the_heuristic_would_pick():
    # 0번 칸의 badrv 값은 끝난 호출의 흔적(rsp보다 아래). 복원은 이를 건너뛰고 실제 호출 체인만 따른다.
    stack = [T._addr(T.BAD, 0x1500)] + [0] * 4 + [T._addr(T.NTFS, 0x8000)] + [0] * 6
    data = T.build_dump(code=0x50, mods=T.MODS, stack=stack, rsp_slot=1)
    parsed = K.parse(data)
    assert parsed["stackExternalModules"] == []        # rsp 아래는 훑기에서도 제외되지만
    stack2 = [0] * 5 + [T._addr(T.NTFS, 0x8000)] + [0] * 6
    r = _run(stack2, {"ntoskrnl.exe": NT_IMG, "Ntfs.sys": NTFS_IMG})
    assert [f["module"] for f in r["stackFrames"]][:2] == ["ntoskrnl.exe", "Ntfs.sys"]


def test_when_no_image_is_available_the_scan_result_is_kept():
    stack = [0] * 5 + [T._addr(T.NTFS, 0x8000), T._addr(T.BAD, 0x1500)]
    r = _run(stack, {})
    assert r["stackMethod"] == "scan" and r["stackUnwind"]["used"] is False
    assert r["stackUnwind"]["reason"] == "image-missing"
    assert "stackFrames" not in r and r["faultingModule"] == "badrv.sys"          # 훑기 후보가 그대로


def test_stack_pointer_outside_saved_stack_skips_unwinding():
    data = T.build_dump(mods=T.MODS, stack=[0] * 8)
    data = bytearray(data)
    ctx = 0x2100
    struct.pack_into("<Q", data, ctx + 0x98, 0x1000)       # 저장된 스택 밖
    r = K.parse(bytes(data))
    orig = SS.fetch
    SS.fetch = _images(**{"ntoskrnl.exe": NT_IMG})
    try:
        out = U.enhance(bytes(data), r, budget_sec=5)
    finally:
        SS.fetch = orig
    assert out["stackMethod"] == "scan" and out["stackUnwind"]["used"] is False


def test_enhance_never_raises_on_garbage_and_non_kernel_results():
    assert U.enhance(b"", {"dumpFormat": "mdmp"}) == {"dumpFormat": "mdmp"}
    r = K.parse(T.build_dump(mods=T.MODS, stack=[1, 2, 3]))
    assert U.enhance(b"\0" * 100, r)["stopCode"] == r["stopCode"]


def test_real_samples_unwind_when_images_are_cached():
    folder, cache = os.environ.get("ITSVC_DUMP_SAMPLES"), os.environ.get("SYMBOL_CACHE_DIR")
    if not folder or not cache:
        return
    os.environ["SYMBOL_FETCH_ENABLED"] = "0"     # 캐시만 사용
    for path in sorted(glob.glob(os.path.join(folder, "*.dmp"))):
        data = open(path, "rb").read()
        r = U.enhance(data, K.parse(data))
        if r.get("stackUnwind", {}).get("used"):
            frames = r["stackFrames"]
            assert frames[0]["symbol"] and "KeBugCheck" in frames[0]["symbol"], path        # 첫 프레임은 버그체크 함수
            assert len(frames) >= 4, path
            # 매개변수가 명령 주소인 코드(0x50: P3)라면 복원한 프레임 중 하나가 그 주소여야 한다
            if r["stopCode"] == "0x50":
                p3 = int(r["stopParams"][2], 16)
                hdr = K._triage_fields(data)
                mods = K.read_modules(data, hdr)
                owner = next(m for m in mods if m["base"] <= p3 < m["base"] + m["size"])
                assert any(f["module"] == owner["name"] and int(f["rva"], 16) == p3 - owner["base"] for f in frames), path


if __name__ == "__main__":
    import traceback
    fails = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("ok  ", name)
            except Exception:
                fails += 1
                print("FAIL", name)
                traceback.print_exc()
    raise SystemExit(1 if fails else 0)
