"""PDB 공개 심볼 해석·색인·다운로드 안전장치, 실패 버킷 시험. 실행: python test_pdb_symbols.py (pytest도 가능)

실제 ntkrnlmp.pdb(약 11MB)로 확인한 형식을 따라 만든 작은 합성 PDB로 시험한다(실제 PDB는 저장소에 넣지 않는다).
"""
import os
import random
import struct
import tempfile

import failure_bucket as FB
import pdb_symbols as PS
import pe_image
import symbol_store as SS
from test_pe_unwind import _Resp, _with_env, make_pe

GUID_HEX = "72C69E726C648BC18257AF38FA78A2F2"
GUID_BYTES = struct.pack("<IHH", 0x72C69E72, 0x6C64, 0x8BC1) + bytes.fromhex("8257AF38FA78A2F2")


def _pub(name: str, seg: int, off: int, flags: int = 2) -> bytes:
    body = struct.pack("<HIIH", 0x110E, flags, off, seg) + name.encode() + b"\x00"
    body += b"\x00" * (-(len(body) + 2) % 4)
    return struct.pack("<H", len(body)) + body


def build_pdb(publics, sections=(0x1000, 0x5000), age=6, bs=512, with_opt=True):
    """publics: [(이름, 구역 번호(1부터), 구역 안 오프셋, 플래그)]"""
    pdb_info = struct.pack("<III", 20000404, 0, age) + GUID_BYTES
    sec_stream = b"".join(b"\x00" * 12 + struct.pack("<I", va) + b"\x00" * 24 for va in sections)
    syms = b"".join(_pub(*p) for p in publics)
    opt = b"".join(struct.pack("<H", 4 if i == 5 else 0xFFFF) for i in range(11)) if with_opt else b""
    dbi_head = struct.pack("<iIIHHHHHHiiiiiIiiHHI", -1, 19990903, age, 0xFFFF, 0, 0xFFFF, 0, 5, 0, 0, 0, 0, 0, 0, 0, len(opt), 0, 0, 0x8664, 0)
    # 스트림: 0(빈), 1(PDB 정보), 2(빈), 3(DBI), 4(구역 머리), 5(심볼 레코드)
    streams = [b"", pdb_info, b"", dbi_head + opt, sec_stream, syms]
    blocks = [b"\x00" * bs, b"\x00" * bs, b"\x00" * bs]   # 0: 머리, 1·2: 빈 블록 지도

    def put(data: bytes):
        ids = []
        for i in range(0, len(data), bs):
            ids.append(len(blocks))
            blocks.append(data[i:i + bs].ljust(bs, b"\x00"))
        return ids
    ids = [put(s) for s in streams]
    directory = struct.pack("<I", len(streams)) + b"".join(struct.pack("<I", len(s)) for s in streams)
    directory += b"".join(struct.pack(f"<{len(i)}I", *i) for i in ids)
    dir_ids = put(directory)
    map_block = len(blocks)
    blocks.append(struct.pack(f"<{len(dir_ids)}I", *dir_ids).ljust(bs, b"\x00"))
    head = PS._MSF_MAGIC + struct.pack("<6I", bs, 1, len(blocks), len(directory), 0, map_block)
    blocks[0] = head.ljust(bs, b"\x00")
    return b"".join(blocks)


PUBLICS = [("FuncB", 1, 0x200, 2), ("FuncA", 1, 0x10, 2), ("Label", 1, 0x80, 1), ("DataSym", 1, 0x300, 0), ("FuncC", 2, 0x20, 2)]


def test_publics_are_sorted_to_rvas_and_data_symbols_are_ignored():
    rvas, names = PS.parse_publics(build_pdb(PUBLICS))
    assert list(rvas) == [0x1010, 0x1080, 0x1200, 0x5020]
    assert names == ["FuncA", "Label", "FuncB", "FuncC"]          # 플래그 0(데이터)은 제외
    idx = PS.SymbolIndex(rvas, names)
    assert idx.lookup(0x1215) == ("FuncB", 0x15)
    assert idx.lookup(0x500) is None                              # 첫 심볼보다 앞
    assert idx.lookup(0x5020 + 0x200000) is None                  # 너무 먼 주소는 이름을 붙이지 않는다


def test_pdb_identity_and_index_roundtrip():
    data = build_pdb(PUBLICS, age=6)
    assert PS.pdb_identity(data) == (GUID_HEX, 6)
    rvas, names = PS.parse_publics(data)
    idx2 = PS.SymbolIndex.loads(PS.SymbolIndex(rvas, names).dumps())
    assert list(idx2.rvas) == list(rvas) and idx2.names == names
    for bad in (b"", b"ITSVCSYM1", b"ITSVCSYM1" + struct.pack("<II", 5, 5) + b"xx"):
        try:
            PS.SymbolIndex.loads(bad)
            assert False, bad
        except PS.PdbError:
            pass


def test_garbage_and_truncated_pdb_only_raise_pdb_error():
    good = build_pdb(PUBLICS)
    rng = random.Random(1)
    samples = [b"", b"MZ" + b"\x00" * 100, good[:100], good[:len(good) // 2], good[:-3], build_pdb(PUBLICS, with_opt=False)]
    for _ in range(20):
        b = bytearray(good)
        for _ in range(8):
            b[rng.randrange(len(b))] = rng.randrange(256)
        samples.append(bytes(b))
    for s in samples:
        try:
            PS.parse_publics(s)
        except PS.PdbError:
            pass   # 잘못된 파일은 PdbError로만 거절한다(다른 예외나 무한 루프 없음)


def test_download_checks_identity_cache_and_server():
    calls = []
    pdb = build_pdb(PUBLICS, age=6)

    def fake(req, timeout=None):
        calls.append(req.full_url)
        return _Resp(pdb)
    ident = GUID_HEX + "1"                                         # 이미지의 나이 1 < PDB의 나이 6 → 같은 PDB로 인정
    with _with_env(SYMBOL_FETCH_ENABLED=1, SYMBOL_DAILY_FETCH_CAP=50):
        orig = SS.urllib.request.urlopen
        SS.urllib.request.urlopen = fake
        try:
            idx = PS.fetch_index("ntkrnlmp.pdb", ident)
            assert idx is not None and idx.lookup(0x1215) == ("FuncB", 0x15)
            assert PS.fetch_index("ntkrnlmp.pdb", ident) is not None and len(calls) == 1   # 두 번째는 캐시
            assert calls == [f"https://msdl.microsoft.com/download/symbols/ntkrnlmp.pdb/{ident}/ntkrnlmp.pdb"]
            # 요청과 다른 PDB(GUID 불일치)·더 낮은 나이는 저장하지 않고, 같은 요청을 다시 묻지 않는다
            other = "0" * 32 + "1"
            assert PS.fetch_index("evil.pdb", other) is None
            n = len(calls)
            assert PS.fetch_index("evil.pdb", other) is None and len(calls) == n
            assert PS.fetch_index("old.pdb", GUID_HEX + "9") is None                      # PDB 나이 6 < 요청 9
        finally:
            SS.urllib.request.urlopen = orig


def test_invalid_names_and_disabled_fetch_never_touch_the_network():
    def boom(*a, **k):
        raise AssertionError("network used")
    orig = SS.urllib.request.urlopen
    SS.urllib.request.urlopen = boom
    try:
        with _with_env(SYMBOL_FETCH_ENABLED=1):
            for name, ident in (("../x.pdb", GUID_HEX + "1"), ("a/b.pdb", GUID_HEX + "1"), ("x.exe", GUID_HEX + "1"), ("x.pdb", "zz"), ("x.pdb", GUID_HEX)):
                assert PS.fetch_index(name, ident) is None, (name, ident)
        with _with_env(SYMBOL_FETCH_ENABLED=0):
            assert PS.fetch_index("ntkrnlmp.pdb", GUID_HEX + "1") is None
    finally:
        SS.urllib.request.urlopen = orig


def test_codeview_identifier_is_read_from_the_debug_directory():
    img = pe_image.PEImage(make_pe())
    blob = b"RSDS" + GUID_BYTES + struct.pack("<I", 1) + b"c:\\build\\obj\\ntkrnlmp.pdb\x00"
    data = bytearray(0x400)
    data[0x100:0x100 + len(blob)] = blob
    entry = struct.pack("<IIHHIIII", 0, 0, 0, 0, 2, len(blob), 0, 0x100)
    img.data = bytes(data)
    img._dirs = [(0, 0)] * 6 + [(0x1000, 28)]
    img.read = lambda rva, size: entry
    assert img.codeview() == ("ntkrnlmp.pdb", GUID_HEX + "1", 1)
    img.read = lambda rva, size: struct.pack("<IIHHIIII", 0, 0, 0, 0, 1, 10, 0, 0x100)   # CodeView가 아닌 항목
    assert img.codeview() is None


# ── 실패 버킷 ────────────────────────────────────────────────────────────────
NT = {"name": "ntoskrnl.exe", "base": 0xFFFFF80276600000, "size": 0x1450000}
GPU = {"name": "nvlddmkm.sys", "base": 0xFFFFF80280000000, "size": 0x1000000}
MODS = [NT, GPU]
TABLE = {0x10000: ("MiLockLowestValidPageTableEx", 0x5BC), 0x20000: ("ExFreePoolWithTag", 0x3F3)}


def _resolver(module, rva):
    return TABLE.get(rva) if module == "ntoskrnl.exe" else None


def _frames(*names):
    return [{"module": "ntoskrnl.exe", "rva": 0x1000 * (i + 1), "function": n, "symbol": f"nt!{n}+0x10"} for i, n in enumerate(names)]


def test_access_violation_bucket_uses_the_faulting_function():
    r = {"stopCode": "0x1e", "stopParams": ["0xffffffffc0000005", hex(NT["base"] + 0x10000), "0x0", "0x0"]}   # P1은 64비트로 부호 확장돼 있다
    FB.apply(r, MODS, _resolver, [])
    assert r["failureBucket"] == "AV_nt!MiLockLowestValidPageTableEx" and r["faultingSymbol"] == "nt!MiLockLowestValidPageTableEx+0x5bc"


def test_generic_allocator_function_is_skipped_to_its_caller():
    r = {"stopCode": "0x1000007e", "stopParams": ["0xc0000005", hex(NT["base"] + 0x20000), "0x0", "0x0"]}
    FB.apply(r, MODS, _resolver, _frames("ExFreePoolWithTag", "MiDeleteImageCreationMdls", "MiCreateNewSection"))
    assert r["failureBucket"] == "AV_nt!MiDeleteImageCreationMdls"
    r2 = {"stopCode": "0x1000007e", "stopParams": ["0xc0000005", hex(NT["base"] + 0x20000), "0x0", "0x0"]}
    FB.apply(r2, MODS, _resolver, [])                              # 호출 체인이 없으면 범용 함수는 버킷을 만들지 않는다(추측 안 함)
    assert "failureBucket" not in r2


def test_memory_management_tdr_and_critical_process_buckets():
    r = {"stopCode": "0x1a", "stopParams": ["0x3453", "0x0", "0x0", "0x0"]}
    FB.apply(r, MODS, None, _frames("KeBugCheckEx", "MiDeleteFinalPageTables", "MmDeleteProcessAddressSpace"))
    assert r["failureBucket"] == "0x1a_3453_nt!MiDeleteFinalPageTables"
    r = {"stopCode": "0x116", "stopParams": ["0x0", "0x0", "0x0", "0x0"], "faultingModule": "nvlddmkm.sys"}
    FB.apply(r, MODS, None, [])
    assert r["failureBucket"] == "0x116_IMAGE_nvlddmkm.sys"
    r = {"stopCode": "0xef", "stopParams": ["0x0"] * 4, "crashProcess": {"name": "csrss.exe"}}
    FB.apply(r, MODS, None, [])
    assert r["failureBucket"] == "0xEF_csrss.exe_IMAGE_csrss.exe"


def _fr(*pairs):
    return [{"module": m, "rva": 0x1000 * (i + 1), "function": f} for i, (m, f) in enumerate(pairs)]


def test_dpc_watchdog_bucket_from_public_cases():
    frames = _fr(("ntoskrnl.exe", "KeBugCheckEx"), ("ntoskrnl.exe", "KeAccumulateTicks"), ("ntoskrnl.exe", "KiInterruptDispatchNoLockNoEtw"), ("nvlddmkm.sys", "nvlddmkm_func"))
    r = {"stopCode": "0x133", "stopParams": ["0x1", "0x1e00", "0x0", "0x0"]}
    FB.apply(r, MODS, None, frames)
    assert r["failureBucket"] == "0x133_ISR_nvlddmkm!nvlddmkm_func" and r["failureBucketBasis"] == "public-cases"
    r = {"stopCode": "0x133", "stopParams": ["0x0", "0x1e00", "0x1000", "0x0"]}
    FB.apply(r, MODS, None, _fr(("ntoskrnl.exe", "KiInterruptDispatchNoLockNoEtw"), ("nvlddmkm.sys", None)))
    assert r["failureBucket"] == "0x133_DPC_nvlddmkm!unknown_function"
    r = {"stopCode": "0x133", "stopParams": ["0x1", "0x0", "0x0", "0x0"]}
    FB.apply(r, MODS, None, _fr(("ntoskrnl.exe", "KeBugCheckEx"), ("ntoskrnl.exe", "KeAccumulateTicks")))
    assert r["failureBucket"] == "0x133_ISR_nt!KeAccumulateTicks"


def test_dpc_watchdog_dispatch_at_stack_end_falls_back_to_kernel_rule():
    # 실제 서버 결과(11/27): 인터럽트 디스패치가 스택 맨 끝이고 그 다음 프레임이 없는 경우
    names = ["KeBugCheckEx", "KeAccumulateTicks", "KiUpdateRunTime", "KeClockInterruptNotify", "HalpTimerClockInterrupt",
             "KiCallInterruptServiceRoutine", "KiInterruptSubDispatchNoLockNoEtw", "KiInterruptDispatchNoLockNoEtw"]
    r = {"stopCode": "0x133", "stopParams": ["0x1", "0x1e00", "0x0", "0x0"]}
    FB.apply(r, MODS, None, _fr(*[("ntoskrnl.exe", n) for n in names]))
    assert r["failureBucket"] == "0x133_ISR_nt!KeAccumulateTicks" and r["failureBucketBasis"] == "public-cases"


def test_dpc_watchdog_without_stack_gets_no_bucket_and_0x117_is_labeled():
    r = {"stopCode": "0x133", "stopParams": ["0x1", "0x1e00", "0x0", "0x0"], "faultingModule": "nvlddmkm.sys"}
    FB.apply(r, MODS, None, [])
    assert "failureBucket" not in r and "failureBucketBasis" not in r
    r = {"stopCode": "0x117", "stopParams": ["0x0"] * 4, "faultingModule": "nvlddmkm.sys"}
    FB.apply(r, MODS, None, [])
    assert r["failureBucket"] == "0x117_IMAGE_nvlddmkm.sys" and r["failureBucketBasis"] == "public-cases"


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
