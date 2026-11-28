"""Microsoft 공개 심볼(PDB)에서 함수 이름 색인을 만들어 주소를 `함수+오프셋`으로 바꾼다.

호출 스택 복원(stack_unwinder)이 모듈 이미지로 프레임 주소를 구하면, 이 모듈이 그 주소가 속한 함수의 이름을 알려 준다
(WinDbg가 `nt!MiDeleteFinalPageTables+0x20a`처럼 보여 주는 것과 같은 정보). Microsoft 모듈의 공개 PDB는 함수 이름(공개 심볼)을 담고 있다.

서버에 보내는 것은 모듈의 PDB 이름·GUID·나이(심볼 서버의 공개 파일 식별자)뿐이다. 덤프 내용은 보내지 않는다.
받은 PDB는 공개 심볼 중 코드 심볼만 뽑아 작은 색인 파일로 바꿔 캐시한다(PDB 전체를 쌓아 두지 않는다).

안전장치: 호스트는 symbol_store와 같은 msdl.microsoft.com 고정, 이름·GUID는 형식 검사, 받은 PDB는 PDB 머리의 GUID·나이가 요청과
같을 때만 쓴다. 크기·시간·하루 횟수 상한은 symbol_store와 공유하고, SYMBOL_FETCH_ENABLED=0이면 통신하지 않는다.
PDB는 외부에서 받은 파일이므로 모든 읽기는 범위를 확인하고 어긋나면 포기한다(호출한 쪽은 함수 이름 없이 진행한다).
"""
import bisect
import logging
import re
import struct
import time
import urllib.error
import urllib.request
from array import array
from typing import Optional

import symbol_store as S

logger = logging.getLogger("itsvc.ai.pdb")

MAX_PDB_BYTES = 80 * 1024 * 1024
MAX_SYMBOLS = 2_000_000
_MSF_MAGIC = b"Microsoft C/C++ MSF 7.00\r\n\x1a" + b"DS\x00\x00\x00"
_PDB_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_.\-]{0,63}\.pdb$", re.I)
_ID_RE = re.compile(r"^[0-9A-F]{32}[0-9A-F]{1,8}$")
_INDEX_MAGIC = b"ITSVCSYM1"
_S_PUB32 = 0x110E


class PdbError(ValueError):
    pass


# ── MSF 컨테이너 ────────────────────────────────────────────────────────────
class _Msf:
    def __init__(self, data: bytes):
        if len(data) < 64 or data[:32] != _MSF_MAGIC:
            raise PdbError("not an MSF 7.00 file")
        self.data = data
        self.bs, _, nblocks, ndir, _, bmap = struct.unpack_from("<6I", data, 32)
        if self.bs not in (512, 1024, 2048, 4096, 8192) or nblocks * self.bs > len(data) + self.bs or not (0 < ndir <= 64 * 1024 * 1024):
            raise PdbError("bad MSF header")
        dir_blocks = -(-ndir // self.bs)
        map_blocks = self._blocks_from(bmap * self.bs, dir_blocks)
        raw = b"".join(self._block(b) for b in map_blocks)[:ndir]
        if len(raw) < 4:
            raise PdbError("bad directory")
        nstreams = struct.unpack_from("<I", raw, 0)[0]
        if nstreams > 65536 or 4 + nstreams * 4 > len(raw):
            raise PdbError("bad stream count")
        sizes = struct.unpack_from(f"<{nstreams}I", raw, 4)
        pos = 4 + nstreams * 4
        self._streams = []
        for size in sizes:
            if size == 0xFFFFFFFF:
                self._streams.append(None)
                continue
            n = -(-size // self.bs)
            if pos + n * 4 > len(raw):
                raise PdbError("directory truncated")
            self._streams.append((size, struct.unpack_from(f"<{n}I", raw, pos) if n else ()))
            pos += n * 4

    def _block(self, b: int) -> bytes:
        off = b * self.bs
        if off + self.bs > len(self.data):
            raise PdbError("block out of range")
        return self.data[off:off + self.bs]

    def _blocks_from(self, off: int, count: int):
        if off + count * 4 > len(self.data):
            raise PdbError("block map out of range")
        return struct.unpack_from(f"<{count}I", self.data, off)

    def stream(self, index: int) -> bytes:
        if not (0 <= index < len(self._streams)) or self._streams[index] is None:
            raise PdbError("missing stream")
        size, blocks = self._streams[index]
        return b"".join(self._block(b) for b in blocks)[:size]


def pdb_identity(data: bytes):
    """PDB 머리(스트림 1)의 (GUID 식별 문자열 32자, 나이)."""
    msf = _Msf(data)
    s = msf.stream(1)
    if len(s) < 28:
        raise PdbError("bad pdb info stream")
    age = struct.unpack_from("<I", s, 8)[0]
    d1, d2, d3 = struct.unpack_from("<IHH", s, 12)
    return "%08X%04X%04X" % (d1, d2, d3) + s[20:28].hex().upper(), age


def parse_publics(data: bytes):
    """공개 심볼 중 코드 심볼을 (RVA 배열, 이름 목록)으로 돌려준다(RVA 오름차순)."""
    msf = _Msf(data)
    dbi = msf.stream(3)
    if len(dbi) < 64:
        raise PdbError("bad DBI stream")
    (_, _, _, _, _, _, _, sym_idx, _, mod_sz, sec_sz, map_sz, src_sz, ts_sz, _, opt_sz, ec_sz, _, _, _) = \
        struct.unpack_from("<iIIHHHHHHiiiiiIiiHHI", dbi, 0)[:20]
    if min(mod_sz, sec_sz, map_sz, src_sz, ts_sz, ec_sz, opt_sz) < 0:
        raise PdbError("bad DBI sizes")
    opt_off = 64 + mod_sz + sec_sz + map_sz + src_sz + ts_sz + ec_sz
    if opt_sz < 12 or opt_off + opt_sz > len(dbi):
        raise PdbError("no optional debug header")
    sec_stream = struct.unpack_from("<H", dbi, opt_off + 5 * 2)[0]   # SectionHdr
    if sec_stream == 0xFFFF:
        raise PdbError("no section headers")
    sec_raw = msf.stream(sec_stream)
    sections = [struct.unpack_from("<I", sec_raw, i * 40 + 12)[0] for i in range(len(sec_raw) // 40)]
    rec = msf.stream(sym_idx)
    pairs = []
    pos, end = 0, len(rec)
    while pos + 4 <= end and len(pairs) < MAX_SYMBOLS:
        ln, kind = struct.unpack_from("<HH", rec, pos)
        if ln < 2 or pos + 2 + ln > end:
            break
        if kind == _S_PUB32 and ln >= 14:
            flags, off, seg = struct.unpack_from("<IIH", rec, pos + 4)
            if (flags & 3) and 1 <= seg <= len(sections):   # 코드(1) 또는 함수(2) 심볼만
                nend = rec.find(b"\x00", pos + 14, pos + 2 + ln)
                name = rec[pos + 14:nend if nend > 0 else pos + 2 + ln].decode("ascii", "replace")
                if name:
                    pairs.append((sections[seg - 1] + off, name))
        pos += 2 + ln
    if not pairs:
        raise PdbError("no public symbols")
    pairs.sort(key=lambda x: x[0])
    return array("I", [p[0] & 0xFFFFFFFF for p in pairs]), [p[1] for p in pairs]


# ── 색인 ────────────────────────────────────────────────────────────────────
def _read_names(s: str, i: int):
    """'@'로 끝나는 이름 목록을 읽어 (구성 요소 목록, 다음 위치). 지원하지 않는 형태면 ValueError."""
    parts = []
    while i < len(s):
        if s[i] == "@":
            return parts, i + 1
        if s.startswith("?$", i):                       # 템플릿 이름: ?$이름@인수...@
            j = s.index("@", i)
            name, i, args = s[i + 2:j], j + 1, []
            while True:
                if i >= len(s):
                    raise ValueError
                if s[i] == "@":
                    i += 1
                    break
                if s[i] not in "UVT":                   # 구조체·클래스·공용체 인수만 지원한다
                    raise ValueError
                sub, i = _read_names(s, i + 1)
                args.append("::".join(reversed(sub)))
            parts.append(f"{name}<{', '.join(args)}>")
        else:
            j = s.find("@", i)
            if j <= i or not (s[i].isalpha() or s[i] == "_"):
                raise ValueError
            parts.append(s[i:j])
            i = j + 1
    raise ValueError


def demangle(name: str) -> str:
    """MSVC가 장식한 이름 중 일반 함수·생성자·소멸자와 클래스 템플릿만 읽을 수 있게 바꾼다. 못 읽는 형태는 그대로 둔다."""
    if not name.startswith("?"):
        return name
    try:
        special = name[1:3] in ("?0", "?1")
        parts, _ = _read_names(name, 3 if special else 1)
        if not parts:
            return name
        if special:
            cls = parts[0].split("<")[0]
            parts.insert(0, ("~" if name[2] == "1" else "") + cls)
        return "::".join(reversed(parts))
    except (ValueError, IndexError):
        return name


class SymbolIndex:
    def __init__(self, rvas: array, names: list):
        self.rvas, self.names = rvas, names

    def lookup(self, rva: int, max_gap: int = 0x100000):
        """rva 이하에서 가장 가까운 심볼의 (이름, 오프셋). max_gap보다 멀면 None."""
        k = bisect.bisect_right(self.rvas, rva) - 1
        if k < 0 or rva - self.rvas[k] > max_gap:
            return None
        return demangle(self.names[k]), rva - self.rvas[k]

    def dumps(self) -> bytes:
        blob = "\n".join(self.names).encode("utf-8", "replace")
        return _INDEX_MAGIC + struct.pack("<II", len(self.rvas), len(blob)) + self.rvas.tobytes() + blob

    @classmethod
    def loads(cls, raw: bytes) -> "SymbolIndex":
        if raw[:9] != _INDEX_MAGIC or len(raw) < 17:
            raise PdbError("bad index")
        n, blen = struct.unpack_from("<II", raw, 9)
        start = 17
        if n > MAX_SYMBOLS or start + n * 4 + blen != len(raw):
            raise PdbError("bad index size")
        rvas = array("I")
        rvas.frombytes(raw[start:start + n * 4])
        names = raw[start + n * 4:].decode("utf-8", "replace").split("\n")
        if len(names) != n:
            raise PdbError("bad index names")
        return cls(rvas, names)


def _index_path(pdb_name: str, ident: str):
    return S._cfg()["dir"] / "pdb" / pdb_name.lower() / (ident + ".idx")


def cached_index(pdb_name: str, ident: str) -> Optional[SymbolIndex]:
    if not (_PDB_RE.match(pdb_name or "") and _ID_RE.match(ident or "")):
        return None
    try:
        return SymbolIndex.loads(_index_path(pdb_name, ident).read_bytes())
    except (OSError, PdbError, struct.error):
        return None


def fetch_index(pdb_name: str, ident: str, deadline: Optional[float] = None) -> Optional[SymbolIndex]:
    """색인을 돌려준다(캐시 → 심볼 서버에서 PDB 받기). 없거나 실패하면 None."""
    if not (_PDB_RE.match(pdb_name or "") and _ID_RE.match(ident or "")):
        return None
    hit = cached_index(pdb_name, ident)
    if hit is not None:
        return hit
    cfg = S._cfg()
    if not cfg["enabled"]:
        return None
    path = _index_path(pdb_name, ident)
    missing = path.with_suffix(".missing")
    try:
        if missing.exists() and time.time() - missing.stat().st_mtime < S.MISSING_TTL_SEC:
            return None
    except OSError:
        pass
    key = f"pdb/{pdb_name.lower()}/{ident}"
    with S._lock:
        klock = S._key_locks.setdefault(key, __import__("threading").Lock())
    with klock:
        hit = cached_index(pdb_name, ident)
        if hit is not None:
            return hit
        if not S._allow_new_download(cfg["daily_cap"]):
            return None
        remaining = None if deadline is None else deadline - time.monotonic()
        if remaining is not None and remaining <= 1.0:
            return None
        timeout = cfg["timeout"] if remaining is None else max(2.0, min(cfg["timeout"], remaining))
        url = f"{S.SERVER}/{pdb_name.lower()}/{ident}/{pdb_name.lower()}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "itsvc-symbol-client/1.0"})
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                chunks, got = [], 0
                while True:
                    chunk = resp.read(1 << 20)
                    if not chunk:
                        break
                    got += len(chunk)
                    if got > MAX_PDB_BYTES or (deadline is not None and time.monotonic() > deadline + 10):
                        raise ValueError("too large or too slow")
                    chunks.append(chunk)
                data = b"".join(chunks)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                S._mark_missing(missing)
            return None
        except (urllib.error.URLError, OSError, ValueError, TimeoutError):
            return None
        try:
            guid, age = pdb_identity(data)
            # PDB 안의 나이는 이미지가 기록한 나이보다 클 수 있다(증분 갱신). GUID가 같고 나이가 이상이면 같은 PDB로 본다(WinDbg와 같은 규칙).
            if guid != ident[:32] or age < int(ident[32:], 16):
                S._mark_missing(missing)
                return None
            rvas, names = parse_publics(data)
        except (PdbError, struct.error, IndexError):
            S._mark_missing(missing)
            return None
        index = SymbolIndex(rvas, names)
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(".part")
            tmp.write_bytes(index.dumps())
            tmp.replace(path)
        except OSError:
            pass
        S._evict(cfg["max_mb"])
        return index


def index_for_image(img, deadline: Optional[float] = None) -> Optional[SymbolIndex]:
    """PEImage의 CodeView 정보로 심볼 색인을 얻는다. 정보가 없거나 서버에 없으면 None."""
    try:
        cv = img.codeview()
    except (ValueError, struct.error):
        return None
    if not cv:
        return None
    name, ident, _ = cv
    return fetch_index(name, ident, deadline)
