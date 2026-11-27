"""작은 메모리 덤프(PAGEDU64, 트리아지) 해독 테스트. 실행: python test_kernel_dump_parser.py (pytest도 가능)

구조는 실제 덤프 9개로 확인한 것이다(kernel_dump_parser.py 머리말). 사용자의 실제 덤프는 개인정보가 들어 있을 수 있어
저장소에 넣지 않고, 같은 구조의 합성 덤프로 시험한다. 실제 덤프 폴더가 있으면 ITSVC_DUMP_SAMPLES=폴더 로 불변 조건도 확인한다.
"""
import glob
import os
import struct

import kernel_dump_parser as K

KERNEL_BASE = 0xFFFFF80100000000
TIMESTAMP = 0x11111111


def _name_record(name: str) -> bytes:
    raw = struct.pack("<I", len(name)) + name.encode("utf-16le") + b"\x00\x00"
    return raw + b"\x00" * (-len(raw) % 8)


def build_dump(code=0x1A, params=(1, 2, 3, 4), mods=None, stack=None, rsp_slot=0, dump_type=4, break_overlap=False, process=None, thread_process_ptr=None):
    """mods: [(이름, 시작 주소, 크기)], stack: 스택 슬롯 값 목록(최근 호출이 앞), rsp_slot: 현재 스택 포인터가 가리키는 슬롯 번호.
    process: 크래시 당시 프로세스 이미지 이름(EPROCESS 블롭에 NUL 종료 문자열로 저장), thread_process_ptr: 스레드 블롭의 Process 포인터 값."""
    mods = mods or [("ntoskrnl.exe", KERNEL_BASE, 0x1000000)]
    stack = stack or [0] * 16
    if break_overlap:
        mods = list(mods) + [("bad.sys", mods[0][1] + 0x1000, 0x1000)]
    stk_len = len(stack) * 8
    ctx_off, stk_off, drv_off = 0x2100, 0x2800, 0x2800 + stk_len + (-stk_len % 16)
    pool_off = drv_off + len(mods) * 144
    pool, name_off, cur = b"", [], pool_off
    for name, _, _ in mods:
        rec = _name_record(name)
        name_off.append(cur)
        pool += rec
        cur += len(rec)
    proc_off, thr_off = pool_off + len(pool) + 0x100, pool_off + len(pool) + 0x100 + 0x840
    data = bytearray(thr_off + 0x400)
    data[0:8] = b"PAGEDU64"
    struct.pack_into("<II", data, 8, 15, 26100)
    struct.pack_into("<I", data, 0x34, 8)
    struct.pack_into("<I", data, 0x38, code)
    struct.pack_into("<4Q", data, 0x40, *params)
    struct.pack_into("<I", data, 0xF98, dump_type)
    f = [0] * 18
    f[1], f[3], f[10], f[11], f[12], f[13], f[14], f[15] = len(data), ctx_off, stk_off, stk_len, drv_off, len(mods), pool_off, len(pool)
    if process:
        f[8], f[9] = proc_off, thr_off
        data[proc_off + 0x338:proc_off + 0x338 + len(process) + 1] = process.encode() + b"\x00"
        if thread_process_ptr:
            struct.pack_into("<Q", data, thr_off + 0x220, thread_process_ptr)
    struct.pack_into("<18I", data, 0x2000, *f)
    top = 0xFFFFD00012340000
    struct.pack_into("<Q", data, 0x2000 + 18 * 4, top)
    struct.pack_into("<I", data, ctx_off + 0x30, 0x10000F)
    struct.pack_into("<Q", data, ctx_off + 0x98, top + rsp_slot * 8)
    struct.pack_into("<Q", data, ctx_off + 0xF8, mods[0][1] + 0x2000)
    for i, v in enumerate(stack):
        struct.pack_into("<Q", data, stk_off + i * 8, v)
    for i, (name, base, size) in enumerate(mods):
        e = drv_off + i * 144
        struct.pack_into("<Q", data, e, name_off[i])
        struct.pack_into("<QQQ", data, e + 0x38, base, base + 0x2000, size)
        struct.pack_into("<I", data, e + 0x88, TIMESTAMP)
    data[pool_off:pool_off + len(pool)] = pool
    return bytes(data)


NT = ("ntoskrnl.exe", KERNEL_BASE, 0x1000000)
NTFS = ("Ntfs.sys", KERNEL_BASE + 0x2000000, 0x200000)
BAD = ("badrv.sys", KERNEL_BASE + 0x3000000, 0x40000)
GPU = ("nvlddmkm.sys", KERNEL_BASE + 0x4000000, 0x1000000)
MODS = [NT, NTFS, BAD, GPU]


def _addr(mod, rva):
    return mod[1] + rva


def test_modules_are_read_with_address_ranges_in_order():
    r = K.parse(build_dump(mods=MODS))
    assert r["moduleCount"] == 4
    assert [m["name"] for m in r["modules"]] == ["ntoskrnl.exe", "Ntfs.sys", "badrv.sys", "nvlddmkm.sys"]
    assert r["modules"][1]["base"] == hex(NTFS[1]) and r["modules"][1]["size"] == 0x200000
    assert r["gpuDrivers"] == ["NVIDIA"]


def test_module_names_recorded_with_paths_are_reduced_to_file_names():
    # Windows 11 22621 등은 "\\SystemRoot\\system32\\ntoskrnl.exe"처럼 경로째 기록한다. 이름만 쓰지 않으면 ntoskrnl이 "외부 모듈"로 오인된다.
    mods = [("\\SystemRoot\\system32\\ntoskrnl.exe", NT[1], NT[2]), ("\\SystemRoot\\System32\\drivers\\Ntfs.sys", NTFS[1], NTFS[2])]
    stack = [0, _addr(NT, 0x4000), _addr(NTFS, 0x8000)]
    r = K.parse(build_dump(code=0x50, mods=mods, stack=stack))
    assert [m["name"] for m in r["modules"]] == ["ntoskrnl.exe", "Ntfs.sys"]
    assert r["stackExternalModules"] == [] and "faultingModule" not in r


def test_stack_scan_lists_modules_most_recent_first_and_flags_external():
    stack = [0, _addr(NT, 0x4000), 5, _addr(NTFS, 0x8000), _addr(BAD, 0x1234), _addr(BAD, 0x2222), 0]
    r = K.parse(build_dump(code=0x50, mods=MODS, stack=stack))
    assert [m["name"] for m in r["stackModules"]] == ["ntoskrnl.exe", "Ntfs.sys", "badrv.sys"]
    assert [m["system"] for m in r["stackModules"]] == [True, True, False]
    assert r["stackModules"][2]["hits"] == 2
    assert r["stackExternalModules"] == ["badrv.sys"]
    assert r["faultingModule"] == "badrv.sys" and "후보로만" in r["faultingModuleBasis"]
    assert "faultingModuleNote" not in r


def test_only_system_modules_gives_note_instead_of_a_culprit():
    stack = [_addr(NT, 0x4000), _addr(NTFS, 0x8000)]
    r = K.parse(build_dump(code=0x1A, mods=MODS, stack=stack))
    assert r["stackExternalModules"] == [] and "faultingModule" not in r
    assert "외부 드라이버는 나타나지 않았습니다" in r["faultingModuleNote"]


def test_stop_param_address_wins_over_stack_order():
    # 0xD1: P4가 명령 주소. 스택에는 다른 외부 드라이버가 먼저 나와도 매개변수가 가리키는 모듈을 우선한다.
    stack = [_addr(BAD, 0x1000 + 0x10), _addr(GPU, 0x5000)]
    r = K.parse(build_dump(code=0xD1, params=(0x10, 2, 0, _addr(GPU, 0x9000)), mods=MODS, stack=stack))
    assert r["faultingModule"] == "nvlddmkm.sys" and "매개변수" in r["faultingModuleBasis"]
    assert r["faultingModuleDesc"]            # 알려진 드라이버라 설명이 붙는다


def test_param_address_inside_ntoskrnl_is_not_blamed():
    r = K.parse(build_dump(code=0xA, params=(0, 2, 0, _addr(NT, 0x5000)), mods=MODS, stack=[_addr(NT, 0x4000)]))
    assert "faultingModule" not in r


def test_values_below_current_stack_pointer_are_ignored():
    # 슬롯 0~2는 이미 끝난 호출의 흔적(Rsp보다 아래). 슬롯 3부터가 살아 있는 스택이다.
    stack = [_addr(BAD, 0x1500), _addr(BAD, 0x1600), 0, _addr(NT, 0x4000), _addr(NTFS, 0x8000)]
    r = K.parse(build_dump(code=0x50, mods=MODS, stack=stack, rsp_slot=3))
    assert [m["name"] for m in r["stackModules"]] == ["ntoskrnl.exe", "Ntfs.sys"]
    assert r["stackExternalModules"] == []


def test_module_header_pointers_are_not_return_addresses():
    # 모듈 시작(PE 헤더) 부근을 가리키는 값(리스트 포인터 등)은 반환 주소로 세지 않는다.
    r = K.parse(build_dump(mods=MODS, stack=[BAD[1], BAD[1] + 0x800, NT[1]]))
    assert r["stackModules"] == [] and r["stackExternalModules"] == []


def test_overlapping_ranges_fall_back_to_names_only():
    r = K.parse(build_dump(mods=MODS, stack=[_addr(BAD, 0x1500)], break_overlap=True))
    assert all("base" not in m for m in r["modules"])   # 구조를 믿을 수 없으면 주소를 쓰지 않는다(이름만 읽는 예전 방식)
    assert "stackModules" not in r and "faultingModule" not in r


def test_corrupt_or_truncated_dump_never_raises():
    good = build_dump(mods=MODS, stack=[_addr(BAD, 0x1500)])
    for cut in (0x2000, 0x2040, 0x2200, len(good) // 2, len(good) - 5):
        r = K.parse(good[:cut])
        assert "stopCode" in r or "error" in r
    bad = bytearray(good)
    struct.pack_into("<I", bad, 0x2000 + 13 * 4, 0xFFFFFF)   # DriverCount 비정상
    assert K.parse(bytes(bad))["moduleCount"] >= 0


def test_non_triage_dump_has_no_module_analysis():
    r = K.parse(build_dump(dump_type=2, mods=MODS, stack=[_addr(BAD, 0x1500)]))
    assert "stackModules" not in r and "modules" in r and r["modules"] == []


def test_crash_process_is_read_and_confirmed_against_param1():
    ptr = 0xFFFF808CFABDD180
    r = K.parse(build_dump(code=0xEF, params=(ptr, 0, ptr, 0), process="csrss.exe", thread_process_ptr=ptr))
    assert r["crashProcess"]["name"] == "csrss.exe"
    assert r["crashProcess"]["sameAsParam1"] is True
    assert "Windows 하위 시스템" in r["crashProcess"]["role"]
    notes = " ".join(r["paramNotes"])
    assert "끝난 핵심 프로세스: csrss.exe" in notes and "확정하지는 않습니다" in notes


def test_crash_process_not_confirmed_when_thread_points_elsewhere():
    r = K.parse(build_dump(code=0xEF, params=(0xFFFF808CFABDD180, 0, 0, 0), process="wininit.exe", thread_process_ptr=0xFFFF808CFABDEEEE))
    assert r["crashProcess"]["sameAsParam1"] is False
    notes = " ".join(r["paramNotes"])
    assert "크래시 당시 실행 중이던 프로세스: wininit.exe" in notes and "확인은 하지 못했습니다" in notes
    assert "끝난 핵심 프로세스" not in notes


def test_crash_process_for_other_stop_codes_is_context_only():
    r = K.parse(build_dump(code=0x1A, process="game.exe"))
    assert r["crashProcess"] == {"name": "game.exe"}   # 역할·원인 안내 없이 이름만
    assert not any("프로세스" in n for n in r["paramNotes"])


def test_missing_or_garbage_process_blob_is_ignored():
    assert "crashProcess" not in K.parse(build_dump(code=0xEF))
    data = bytearray(build_dump(code=0xEF, process="csrss.exe"))
    hdr = K._triage_fields(bytes(data))
    data[hdr["proc"]:hdr["proc"] + 0x840] = bytes([0xFF]) * 0x840
    assert "crashProcess" not in K.parse(bytes(data))


def test_variant_bugcheck_code_is_read_as_its_base_code():
    r = K.parse(build_dump(code=0x1000007E, params=(0xC0000005, _addr(NT, 0x2000), 0, 0)))
    assert r["stopCode"] == "0x1000007e"           # 파일에 적힌 값은 그대로 보여 주고
    assert r["stopCodeName"] == "SYSTEM_THREAD_EXCEPTION_NOT_HANDLED"   # 이름은 기본 코드(0x7E)로 풀이한다
    assert K.base_code(0x1000007E) == 0x7E and K.base_code(0x10000001) == 0x10000001   # 모르는 변형은 건드리지 않는다


def test_truncated_process_name_is_read_at_known_offset():
    r = K.parse(build_dump(code=0x1A, process="HncUpdateServi"))   # 15자에서 잘려 .exe가 없는 이름(실제 덤프)
    assert r["crashProcess"]["name"] == "HncUpdateServi"


def test_fault_inside_windows_component_does_not_blame_stack_leftovers():
    # 문제 명령(P2)이 ntoskrnl 안인데 스택을 훑다가 외부 모듈 값이 나온 경우(실제: 메모리 관리자 안의 오류 + 이전 호출 흔적)
    r = K.parse(build_dump(code=0x1E, params=(0xC0000005, _addr(NT, 0x2000), 0, 0), mods=MODS, stack=[_addr(BAD, 0x1500)]))
    assert "faultingModule" not in r
    assert r["faultInSystemModule"] == "ntoskrnl.exe"
    assert "이전 호출의 흔적" in r["faultingModuleNote"]


def test_tdr_param2_points_to_the_display_driver():
    r = K.parse(build_dump(code=0x116, params=(0x1, _addr(GPU, 0x10000), 0xC000009A, 4), mods=MODS))
    assert r["faultingModule"] == "nvlddmkm.sys"


def test_real_samples_invariants_when_available():
    folder = os.environ.get("ITSVC_DUMP_SAMPLES")
    files = sorted(glob.glob(os.path.join(folder, "*.dmp"))) if folder else []
    for path in files:
        data = open(path, "rb").read()
        r = K.parse(data)
        hdr = K._triage_fields(data)
        mods = K.read_modules(data, hdr)
        assert len(mods) == hdr["count"] == r["moduleCount"], path
        rng = sorted(mods, key=lambda m: m["base"])
        assert all(a["base"] + a["size"] <= b["base"] for a, b in zip(rng, rng[1:])), path
        assert all(m["base"] <= m["entry"] < m["base"] + m["size"] for m in mods), path
        assert r["stackModules"][0]["name"] == "ntoskrnl.exe", path
        assert r["stopCode"] == hex(struct.unpack_from("<I", data, 0x38)[0]), path


def test_param_notes_for_0x12b_and_0x1a_follow_microsoft_docs():
    n = K._param_notes(0x12B, [0xC00002C4, 0xF4F, 0x172024906F0, 0xFFFFE7015B840000])   # 매개변수 3·4가 0이 아님 → 압축 저장소 관리자
    assert "압축 저장소" in n[0] and "0xC00002C4" in n[1] and "3919" in n[1]
    n = K._param_notes(0x12B, [0xFFFFF80000001000, 0x1234, 0, 0])                         # 3·4가 모두 0 → 단일 비트 오류
    assert "단일 비트" in n[0] and "0x1234" in n[1]
    n = K._param_notes(0x1A, [0x41792, 0xFFFFC001189684E8, 0x800000000000, 0])
    assert "PTE" in n[0] and "0xFFFFC001189684E8" in n[1]
    assert K._param_notes(0x1A, [0x3453, 0, 0, 0]) == []                                  # 확인하지 못한 값은 설명하지 않는다


def test_param_notes_for_0x9c_say_when_status_is_empty():
    n = K._param_notes(0x9C, [0x80000001, 0xFFFFCE0094954B30, 0, 0])
    assert "MCE" in n[0] and "가릴 수 없습니다" in n[1]
    n = K._param_notes(0x9C, [0x4, 0xFFFFCE0094954B30, 0xB6242000, 0xB0000135])
    assert "B6242000B0000135" in n[1] and "L1 데이터 캐시" in n[3]


def test_param_notes_for_0x124_decode_status_bits_and_cache_code():
    n = K._param_notes(0x124, [0, 0xFFFFE68CDF140028, 0xB6002000, 0x4E000175])
    assert "UC" in n[2] and "PCC" in n[2] and "ADDRV" in n[2]
    assert "0x0175" in n[3] and "L1 데이터 캐시" in n[3] and "제거" in n[3]
    n = K._param_notes(0x124, [0, 0, 0x36002000, 0x0])                 # VAL 비트 꺼짐 → 해석하지 않는다
    assert "읽을 수 없습니다" in n[-1]
    n = K._param_notes(0x124, [0, 0, 0xB6000000, 0x00000800])           # 버스 오류 형식(0x08xx)은 코드를 풀지 않는다
    assert not any("메모리 계층" in x for x in n)


def test_param_notes_for_0x50_and_0x4e_follow_microsoft_docs():
    n = K._param_notes(0x50, [0xFFFFBD8CB1EAE3A0, 0, 0xFFFFF803CF89E63E, 2])
    assert "읽기" in n[0] and "NOT_PRESENT_PAGE_TABLE" in n[1]
    n = K._param_notes(0x4E, [6, 0x79330E, 0xFFFFA4A8949EEAE8, 0xA0080079330E921])
    assert "단일 비트" in n[0] and "0x79330E" in n[1]
    assert K._param_notes(0x4E, [0x55, 0, 0, 0]) == []                 # 문서에서 확인하지 못한 값은 설명하지 않는다


def test_param_notes_for_0xa_0xd1_and_intel_gpu_names():
    n = K._param_notes(0xD1, [0xFFFFF80000001000, 2, 1, 0xFFFFF80000002000])
    assert "쓰기" in n[1] and "DISPATCH_LEVEL" in n[1]
    n = K._param_notes(0xA, [0x10, 2, 8, 0x10])
    assert "실행" in n[1]
    assert K.GPU_DRIVER_FILES["igdkmdnd64.sys"].startswith("Intel")


def test_param_notes_for_exception_family_0x1e_0x3b_0x7e():
    n = K._param_notes(0x1E, [0xFFFFFFFFC0000005, 0xFFFFF80000001000, 0, 0x10])
    assert "접근 위반" in n[0] and "0x10" in n[1]
    n = K._param_notes(0x3B, [0xC0000005, 0xFFFFF80000001000, 0xFFFFA00000000000, 0])
    assert "시스템 스레드" in n[1]
    n = K._param_notes(0x7E, [0x80000003, 0xFFFFF80000001000, 0, 0])
    assert "STATUS_BREAKPOINT" in n[0] and len(n) == 1
    n = K._param_notes(0x7E, [0xC0001234, 0xFFFFF80000001000, 0, 0])
    assert "0xC0001234" in n[0] and "—" not in n[0]                       # 이름을 모르는 코드는 이름 없이 값만


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
