"""x64 PE 이미지에서 예외(.pdata)·언와인드 정보와 내보내기 이름을 읽고, 호출 프레임 하나를 되감는다.

Microsoft 심볼 서버에서 받은 모듈 이미지(ntoskrnl.exe 등)로 크래시 시점의 호출 스택을 정확히 복원하기 위한 부품이다.
Windows의 RtlVirtualUnwind(x64)와 같은 규칙을 따르되, 에필로그 흉내와 예외 처리기 해석은 하지 않는다.
외부에서 받은 파일이므로 모든 읽기는 범위를 확인하고, 어긋나면 ValueError로 포기한다(호출한 쪽이 후퇴한다).
"""
import bisect
import struct
from typing import Callable, Optional

# 일반 레지스터 번호(RtlVirtualUnwind·CONTEXT 순서): rax rcx rdx rbx rsp rbp rsi rdi r8..r15
RSP, RBP = 4, 5
REG_NAMES = ["rax", "rcx", "rdx", "rbx", "rsp", "rbp", "rsi", "rdi", "r8", "r9", "r10", "r11", "r12", "r13", "r14", "r15"]

UWOP_PUSH_NONVOL, UWOP_ALLOC_LARGE, UWOP_ALLOC_SMALL, UWOP_SET_FPREG = 0, 1, 2, 3
UWOP_SAVE_NONVOL, UWOP_SAVE_NONVOL_FAR, UWOP_EPILOG, UWOP_SPARE = 4, 5, 6, 7
UWOP_SAVE_XMM128, UWOP_SAVE_XMM128_FAR, UWOP_PUSH_MACHFRAME = 8, 9, 10
UNW_FLAG_CHAININFO = 0x4

_MAX_CHAIN = 16


class PEImage:
    def __init__(self, data: bytes):
        self.data = data
        if len(data) < 0x200 or data[:2] != b"MZ":
            raise ValueError("not a PE file")
        nt = struct.unpack_from("<I", data, 0x3C)[0]
        if nt + 0x108 > len(data) or data[nt:nt + 4] != b"PE\0\0":
            raise ValueError("bad PE signature")
        machine, nsec, timestamp = struct.unpack_from("<HHI", data, nt + 4)
        opt_size = struct.unpack_from("<H", data, nt + 0x14)[0]
        opt = nt + 0x18
        if machine != 0x8664 or struct.unpack_from("<H", data, opt)[0] != 0x20B:
            raise ValueError("not an x64 image")
        self.timestamp = timestamp
        self.image_base = struct.unpack_from("<Q", data, opt + 0x18)[0]
        self.size_of_image = struct.unpack_from("<I", data, opt + 0x38)[0]
        self.size_of_headers = struct.unpack_from("<I", data, opt + 0x3C)[0]
        n_dirs = struct.unpack_from("<I", data, opt + 0x6C)[0]
        self._dirs = [struct.unpack_from("<II", data, opt + 0x70 + 8 * i) for i in range(min(n_dirs, 16))]
        sec = opt + opt_size
        if not (0 < nsec <= 96) or sec + nsec * 40 > len(data):
            raise ValueError("bad section table")
        self._sections = []
        for i in range(nsec):
            _, vsize, va, rawsize, rawptr = struct.unpack_from("<8sIIII", data, sec + i * 40)
            self._sections.append((va, max(vsize, rawsize), rawptr, rawsize))
        self._pdata: Optional[bytes] = None
        self._pdata_begins: list = []
        self._exports: Optional[list] = None

    # ── 주소 변환 ────────────────────────────────────────────────────────
    def rva_to_off(self, rva: int) -> int:
        if 0 <= rva < self.size_of_headers:
            return rva
        for va, vsize, rawptr, rawsize in self._sections:
            if va <= rva < va + vsize:
                off = rva - va
                if off >= rawsize:
                    raise ValueError("rva in uninitialized data")
                return rawptr + off
        raise ValueError("rva not mapped")

    def read(self, rva: int, size: int) -> bytes:
        off = self.rva_to_off(rva)
        if size < 0 or off + size > len(self.data):
            raise ValueError("read past end")
        return self.data[off:off + size]

    # ── 디버그 디렉터리(CodeView): 심볼 파일(PDB)의 식별자 ────────────────────────
    def codeview(self):
        """(PDB 파일 이름, 심볼 서버용 식별자 'GUID대문자32자+나이16진수', 나이). 없으면 None."""
        rva, size = self._dirs[6] if len(self._dirs) > 6 else (0, 0)
        if not rva or size < 28 or size > 4096:
            return None
        raw = self.read(rva, size - size % 28)
        for i in range(0, len(raw), 28):
            _, _, _, _, kind, dsize, _, ptr = struct.unpack_from("<IIHHIIII", raw, i)
            if kind != 2 or dsize < 25 or dsize > 1024 or ptr + dsize > len(self.data):
                continue
            blob = self.data[ptr:ptr + dsize]
            if blob[:4] != b"RSDS":
                continue
            d1, d2, d3 = struct.unpack_from("<IHH", blob, 4)
            age = struct.unpack_from("<I", blob, 20)[0]
            end = blob.find(b"\x00", 24)
            name = blob[24:end if end > 0 else len(blob)].decode("ascii", "replace")
            name = name.replace("\\", "/").rsplit("/", 1)[-1]
            return name, "%08X%04X%04X" % (d1, d2, d3) + blob[12:20].hex().upper() + "%X" % age, age
        return None

    # ── 예외 디렉터리(.pdata) ─────────────────────────────────────────────
    def _load_pdata(self):
        if self._pdata is not None:
            return
        rva, size = self._dirs[3] if len(self._dirs) > 3 else (0, 0)
        if not rva or size < 12 or size > 64 * 1024 * 1024:
            self._pdata, self._pdata_begins = b"", []
            return
        raw = self.read(rva, size - size % 12)
        self._pdata = raw
        self._pdata_begins = [struct.unpack_from("<I", raw, i)[0] for i in range(0, len(raw), 12)]

    def runtime_function(self, rva: int):
        """rva가 속한 함수의 (시작, 끝, 언와인드 정보 RVA). 없으면 None(리프 함수)."""
        self._load_pdata()
        k = bisect.bisect_right(self._pdata_begins, rva) - 1
        if k < 0:
            return None
        begin, end, unwind = struct.unpack_from("<III", self._pdata, k * 12)
        return (begin, end, unwind) if begin <= rva < end else None

    def unwind_info(self, rva: int) -> dict:
        head = self.read(rva, 4)
        ver_flags, prolog, count, frame = head
        if ver_flags & 7 not in (1, 2):
            raise ValueError("unsupported unwind version")
        flags = ver_flags >> 3
        raw = self.read(rva + 4, count * 2)
        slots = [struct.unpack_from("<H", raw, i * 2)[0] for i in range(count)]
        codes, i = [], 0
        while i < count:
            s = slots[i]
            off, op, info = s & 0xFF, (s >> 8) & 0xF, s >> 12
            n, extra = 1, None
            if op == UWOP_ALLOC_LARGE:
                if info == 0:
                    n, extra = 2, slots[i + 1] * 8 if i + 1 < count else None
                else:
                    n, extra = 3, (slots[i + 1] | (slots[i + 2] << 16)) if i + 2 < count else None
            elif op in (UWOP_SAVE_NONVOL, UWOP_SAVE_XMM128, UWOP_EPILOG):
                n, extra = 2, slots[i + 1] if i + 1 < count else None
            elif op in (UWOP_SAVE_NONVOL_FAR, UWOP_SAVE_XMM128_FAR):
                n, extra = 3, (slots[i + 1] | (slots[i + 2] << 16)) if i + 2 < count else None
            if extra is None and n > 1:
                raise ValueError("truncated unwind codes")
            codes.append((off, op, info, extra))
            i += n
        chain = None
        if flags & UNW_FLAG_CHAININFO:
            tail = rva + 4 + ((count + 1) & ~1) * 2
            chain = struct.unpack("<III", self.read(tail, 12))
        return {"flags": flags, "prolog": prolog, "codes": codes, "frame_reg": frame & 0xF, "frame_off": (frame >> 4) * 16, "chain": chain}

    # ── 내보내기 이름(함수 이름 대신 쓰는 가장 가까운 이름) ─────────────────────
    def nearest_export(self, rva: int):
        if self._exports is None:
            self._exports = self._load_exports()
        k = bisect.bisect_right(self._exports, (rva, "\U0010ffff")) - 1
        if k < 0:
            return None
        start, name = self._exports[k]
        return (name, rva - start) if rva - start < 0x4000 else None

    def _load_exports(self) -> list:
        try:
            rva, size = self._dirs[0] if self._dirs else (0, 0)
            if not rva:
                return []
            d = self.read(rva, 40)
            n_funcs, n_names, f_rva, n_rva, o_rva = struct.unpack_from("<IIIII", d, 20)
            if not (0 < n_names <= 100000 and 0 < n_funcs <= 200000):
                return []
            funcs = struct.unpack(f"<{n_funcs}I", self.read(f_rva, n_funcs * 4))
            names = struct.unpack(f"<{n_names}I", self.read(n_rva, n_names * 4))
            ords = struct.unpack(f"<{n_names}H", self.read(o_rva, n_names * 2))
            out = []
            for name_rva, o in zip(names, ords):
                if o >= n_funcs:
                    continue
                fr = funcs[o]
                if rva <= fr < rva + size:   # 다른 모듈로 넘기는(forwarder) 항목은 건너뛴다
                    continue
                raw = self.read(name_rva, 96)
                nm = raw.split(b"\0", 1)[0].decode("ascii", "replace")
                if nm.isprintable() and nm:
                    out.append((fr, nm))
            out.sort()
            return out
        except (ValueError, struct.error):
            return []


def virtual_unwind(img: PEImage, ctrl_rva: int, regs: list, read_u64: Callable[[int], Optional[int]]):
    """ctrl_rva 위치(함수 안)에서 한 단계 되감아 (호출한 쪽 RIP, 갱신된 레지스터, 머신 프레임 여부)를 돌려준다.

    read_u64(주소)는 스택 메모리를 읽어 값을 주거나, 덤프에 없으면 None을 준다.
    """
    regs = list(regs)
    rf = img.runtime_function(ctrl_rva)
    if rf is None:   # 리프 함수: 반환 주소가 스택 맨 위에 있다
        ret = read_u64(regs[RSP])
        if ret is None:
            raise ValueError("stack read failed")
        regs[RSP] += 8
        return ret, regs, False
    prolog_off = ctrl_rva - rf[0]
    cur, first = rf, True
    for _ in range(_MAX_CHAIN):
        ui = img.unwind_info(cur[2])
        in_prolog = first and prolog_off < ui["prolog"]
        if ui["frame_reg"] and not in_prolog:
            regs[RSP] = (regs[ui["frame_reg"]] - ui["frame_off"]) & 0xFFFFFFFFFFFFFFFF
        for off, op, info, extra in ui["codes"]:
            if in_prolog and off > prolog_off:
                continue
            if op == UWOP_PUSH_NONVOL:
                v = read_u64(regs[RSP])
                if v is None:
                    raise ValueError("stack read failed")
                regs[info] = v
                regs[RSP] += 8
            elif op == UWOP_ALLOC_LARGE:
                regs[RSP] += extra
            elif op == UWOP_ALLOC_SMALL:
                regs[RSP] += info * 8 + 8
            elif op == UWOP_SET_FPREG:
                if in_prolog:
                    regs[RSP] = (regs[ui["frame_reg"]] - ui["frame_off"]) & 0xFFFFFFFFFFFFFFFF
            elif op in (UWOP_SAVE_NONVOL, UWOP_SAVE_NONVOL_FAR):
                v = read_u64(regs[RSP] + (extra * 8 if op == UWOP_SAVE_NONVOL else extra))
                if v is None:
                    raise ValueError("stack read failed")
                regs[info] = v
            elif op == UWOP_PUSH_MACHFRAME:
                sp = regs[RSP]
                if info:   # 오류 코드가 먼저 쌓인 프레임
                    sp += 8
                rip, new_rsp = read_u64(sp), read_u64(sp + 0x18)
                if rip is None or new_rsp is None:
                    raise ValueError("stack read failed")
                regs[RSP] = new_rsp
                return rip, regs, True
        if ui["chain"]:
            cur, first = ui["chain"], False
            continue
        break
    else:
        raise ValueError("unwind chain too long")
    ret = read_u64(regs[RSP])
    if ret is None:
        raise ValueError("stack read failed")
    regs[RSP] += 8
    return ret, regs, False
