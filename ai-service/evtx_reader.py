"""Windows 이벤트 로그(.evtx) 고속 리더.

python-evtx는 레코드마다 XML 전체를 렌더링해서 21MB 로그 하나에 50초 넘게 걸리고,
UTF-16 오류가 있는 레코드에서 예외로 멈춘다. 여기서는 BinXML 템플릿 정의를
템플릿 GUID당 한 번만 해석해 "어느 치환 슬롯이 어떤 필드인지"를 기억해 두고,
레코드마다에서는 치환 값 배열만 읽는다. EventData가 치환 슬롯 안에 중첩된 BinXML
(값 형식 0x21)로 들어 있는 이벤트도 같은 방식으로 재귀 처리한다.
"""
import struct
import time
from datetime import datetime, timedelta, timezone

CHUNK_SIZE = 0x10000
FILE_HEADER_SIZE = 0x1000
_EPOCH_1601 = datetime(1601, 1, 1, tzinfo=timezone.utc)
_MAX_NESTING = 3

# 값 형식 코드 → 고정 크기(가변 길이 형식은 여기 없음)
_FIXED = {0x03: 1, 0x04: 1, 0x05: 2, 0x06: 2, 0x07: 4, 0x08: 4, 0x09: 8, 0x0A: 8,
          0x0B: 4, 0x0C: 8, 0x0D: 4, 0x0F: 16, 0x11: 8, 0x12: 16, 0x14: 4, 0x15: 8}


class EvtxError(Exception):
    pass


def _filetime(v: int):
    if v <= 0:
        return None
    try:
        return _EPOCH_1601 + timedelta(microseconds=v // 10)
    except OverflowError:
        return None


def _read_name(c: bytes, off: int) -> str:
    # 이름 구조: u32 다음 오프셋, u16 해시, u16 글자 수, UTF-16 문자열
    n = struct.unpack_from("<H", c, off + 6)[0]
    return c[off + 8: off + 8 + n * 2].decode("utf-16le", "replace")


def _name_struct_len(c: bytes, off: int) -> int:
    n = struct.unpack_from("<H", c, off + 6)[0]
    return 8 + (n + 1) * 2


class _Template:
    """템플릿 정의에서 뽑은 '키 → 치환 슬롯/리터럴' 매핑."""
    __slots__ = ("slots", "literals")

    def __init__(self):
        self.slots = {}     # 키 -> 치환 인덱스
        self.literals = {}  # 키 -> 문자열


def _parse_template(c: bytes, pos: int, end: int) -> _Template:
    tpl = _Template()
    stack = []          # [{name, dname}]
    cur_attr = None
    data_pos = {}       # 이름 없는 Data의 위치 카운터

    def names(upto=None):
        seq = stack if upto is None else stack[:upto]
        # 이벤트 전체 템플릿은 루트가 Event라서 빼고, 중첩 템플릿(EventData 등)은 루트를 남긴다.
        start = 1 if stack and stack[0]["name"] == "Event" else 0
        return "/".join(e["name"] for e in seq[start:])

    def put(key, kind, value):
        if kind == "sub":
            tpl.slots[key] = value
        else:
            tpl.literals[key] = value

    def assign(kind, value):
        nonlocal cur_attr
        if not stack:
            return
        top = stack[-1]
        if cur_attr is not None:
            attr, cur_attr = cur_attr, None
            if kind == "lit" and top["name"] == "Data" and attr == "Name":
                top["dname"] = value
            put(f"{names()}@{attr}", kind, value)
            return
        if top["name"] == "Data":
            parent = names(len(stack) - 1)
            if top["dname"]:
                put(f"{parent}/Data:{top['dname']}", kind, value)
            else:
                put(f"{parent}/Data#{data_pos.get(parent, 0)}", kind, value)
        else:
            put(names(), kind, value)

    while pos < end:
        t = c[pos]
        b = t & 0x3F
        if b == 0x00:
            break
        if b == 0x0F:
            pos += 4
        elif b == 0x01:
            name_off = struct.unpack_from("<I", c, pos + 7)[0]
            name = _read_name(c, name_off)
            pos += 11
            if name_off == pos:
                pos += _name_struct_len(c, name_off)
            if t & 0x40:
                pos += 4
            stack.append({"name": name, "dname": None})
        elif b == 0x06:
            name_off = struct.unpack_from("<I", c, pos + 1)[0]
            aname = _read_name(c, name_off)
            pos += 5
            if name_off == pos:
                pos += _name_struct_len(c, name_off)
            cur_attr = aname
        elif b == 0x02:
            pos += 1
        elif b == 0x03:
            stack.pop()
            pos += 1
        elif b == 0x04:
            top = stack.pop()
            if top["name"] == "Data" and not top["dname"]:
                parent = names(len(stack))
                data_pos[parent] = data_pos.get(parent, 0) + 1
            pos += 1
        elif b == 0x05:
            vt = c[pos + 1]
            if vt == 0x01:
                n = struct.unpack_from("<H", c, pos + 2)[0]
                s = c[pos + 4: pos + 4 + n * 2].decode("utf-16le", "replace")
                pos += 4 + n * 2
                assign("lit", s)
            else:
                sz = _FIXED.get(vt)
                if sz is None:
                    raise EvtxError(f"template literal type {vt:#x}")
                pos += 2 + sz
        elif b in (0x0D, 0x0E):
            idx = struct.unpack_from("<H", c, pos + 1)[0]
            pos += 4
            assign("sub", idx)
        elif b == 0x07:
            n = struct.unpack_from("<H", c, pos + 1)[0]
            pos += 3 + n * 2
        elif b == 0x08:
            pos += 3
        elif b == 0x09:
            name_off = struct.unpack_from("<I", c, pos + 1)[0]
            pos += 5
            if name_off == pos:
                pos += _name_struct_len(c, name_off)
        elif b == 0x0C:
            pos = _skip_template_instance(c, pos)
        else:
            raise EvtxError(f"unknown token {t:#x}")
    return tpl


def _skip_template_instance(c: bytes, pos: int) -> int:
    def_off = struct.unpack_from("<I", c, pos + 6)[0]
    pos += 10
    if def_off == pos:
        size = struct.unpack_from("<I", c, pos + 20)[0]
        pos += 24 + size
    count = struct.unpack_from("<I", c, pos)[0]
    pos += 4
    total = sum(struct.unpack_from("<H", c, pos + i * 4)[0] for i in range(count))
    return pos + count * 4 + total


def _decode(raw: bytes, vt: int):
    arr = vt & 0x80
    t = vt & 0x7F
    try:
        if arr:
            if t == 0x01:
                return [s for s in raw.decode("utf-16le", "replace").split("\x00") if s]
            return raw.hex()
        if t == 0x00:
            return None
        if t == 0x01:
            return raw.decode("utf-16le", "replace").rstrip("\x00")
        if t == 0x02:
            return raw.decode("latin-1").rstrip("\x00")
        if t == 0x03:
            return struct.unpack("<b", raw[:1])[0]
        if t == 0x04:
            return raw[0]
        if t == 0x05:
            return struct.unpack("<h", raw[:2])[0]
        if t == 0x06:
            return struct.unpack("<H", raw[:2])[0]
        if t == 0x07:
            return struct.unpack("<i", raw[:4])[0]
        if t in (0x08, 0x14):
            return struct.unpack("<I", raw[:4])[0]
        if t == 0x09:
            return struct.unpack("<q", raw[:8])[0]
        if t in (0x0A, 0x15, 0x10):
            return struct.unpack("<Q", raw[:8])[0] if len(raw) >= 8 else struct.unpack("<I", raw[:4])[0]
        if t == 0x0D:
            return bool(struct.unpack("<I", raw[:4])[0])
        if t == 0x11:
            return _filetime(struct.unpack("<Q", raw[:8])[0])
        return raw.hex()
    except Exception:
        return None


class EvtxRecord:
    __slots__ = ("record_id", "time", "provider", "event_id", "level", "channel", "data")


def _read_instance(c: bytes, p: int, templates: dict):
    """p 위치의 (선택적 FragmentHeader +) TemplateInstance를 읽는다.

    반환: (템플릿, 치환 디스크립터[(size, type)], 값이 시작하는 청크 내 오프셋 목록)
    """
    if c[p] == 0x0F:
        p += 4
    if (c[p] & 0x3F) != 0x0C:
        raise EvtxError("템플릿 없는 BinXML")
    def_off = struct.unpack_from("<I", c, p + 6)[0]
    p += 10
    inline = def_off == p
    guid = bytes(c[def_off + 4: def_off + 20])
    dsize = struct.unpack_from("<I", c, def_off + 20)[0]
    if inline:
        p += 24 + dsize
    tpl = templates.get(guid)
    if tpl is None:
        tpl = _parse_template(c, def_off + 24, def_off + 24 + dsize)
        templates[guid] = tpl
    count = struct.unpack_from("<I", c, p)[0]
    p += 4
    desc = [struct.unpack_from("<HB", c, p + i * 4) for i in range(count)]
    p += count * 4
    offsets = []
    for sz, _vt in desc:
        offsets.append(p)
        p += sz
    return tpl, desc, offsets


def _value(c, desc, offsets, idx):
    if idx >= len(desc):
        return None
    sz, vt = desc[idx]
    return _decode(c[offsets[idx]: offsets[idx] + sz], vt)


def _collect_data(c, tpl, desc, offsets, templates, out, depth=0):
    """EventData/UserData 값을 이름→값 dict로 모은다(중첩 BinXML은 재귀)."""
    for key, idx in tpl.slots.items():
        if idx >= len(desc):
            continue
        sz, vt = desc[idx]
        if (vt & 0x7F) == 0x21:
            if depth < _MAX_NESTING and sz > 0:
                try:
                    t2, d2, o2 = _read_instance(c, offsets[idx], templates)
                    _collect_data(c, t2, d2, o2, templates, out, depth + 1)
                except Exception:
                    pass
            continue
        if "/Data:" in key:
            out[key.split("/Data:", 1)[1]] = _value(c, desc, offsets, idx)
        elif "/Data#" in key:
            out["#" + key.split("/Data#", 1)[1]] = _value(c, desc, offsets, idx)
        elif key.startswith(("UserData/", "EventData/")) and "@" not in key:
            out[key.split("/", 1)[1]] = _value(c, desc, offsets, idx)
    for key, text in tpl.literals.items():
        if "/Data:" in key:
            out.setdefault(key.split("/Data:", 1)[1], text)


def _parse_record(c: bytes, pos: int, templates: dict, want_data):
    record_id, ts = struct.unpack_from("<QQ", c, pos + 8)
    tpl, desc, offsets = _read_instance(c, pos + 24, templates)

    def get(key):
        if key in tpl.slots:
            return _value(c, desc, offsets, tpl.slots[key])
        return tpl.literals.get(key)

    rec = EvtxRecord()
    rec.record_id = record_id
    rec.provider = get("System/Provider@Name") or ""
    try:
        rec.event_id = int(get("System/EventID"))
    except (TypeError, ValueError):
        rec.event_id = -1
    lvl = get("System/Level")
    rec.level = lvl if isinstance(lvl, int) else None
    st = get("System/TimeCreated@SystemTime")
    rec.time = st if isinstance(st, datetime) else _filetime(ts)
    rec.channel = get("System/Channel")
    rec.data = None
    if want_data is not None and want_data(rec.provider, rec.event_id):
        out = {}
        _collect_data(c, tpl, desc, offsets, templates, out)
        rec.data = out
    return rec


def iter_records(data: bytes, time_budget: float = 50.0, want_data=None, stats=None):
    """레코드를 하나씩 내어준다.

    want_data(provider, event_id)가 True인 이벤트만 EventData를 풀어서 준다
    (나머지는 provider/id/time/level만 채운다). stats에 skipped·truncated를 기록한다.
    """
    if data[:8] != b"ElfFile\x00":
        raise EvtxError("EVTX 파일이 아닙니다.")
    templates = {}
    started = time.monotonic()
    n_chunks = (len(data) - FILE_HEADER_SIZE) // CHUNK_SIZE
    for ci in range(n_chunks):
        base = FILE_HEADER_SIZE + ci * CHUNK_SIZE
        c = data[base: base + CHUNK_SIZE]
        if c[:8] != b"ElfChnk\x00":
            continue
        free_off = struct.unpack_from("<I", c, 0x30)[0]
        pos = 0x200
        while pos + 24 <= min(free_off, CHUNK_SIZE):
            if time.monotonic() - started > time_budget:
                if stats is not None:
                    stats["truncated"] = True
                return
            if c[pos:pos + 4] != b"\x2a\x2a\x00\x00":
                break
            size = struct.unpack_from("<I", c, pos + 4)[0]
            if size < 32 or pos + size > CHUNK_SIZE:
                break
            try:
                rec = _parse_record(c, pos, templates, want_data)
            except Exception:
                rec = None
                if stats is not None:
                    stats["skipped"] = stats.get("skipped", 0) + 1
            pos += size
            if rec is not None:
                yield rec
