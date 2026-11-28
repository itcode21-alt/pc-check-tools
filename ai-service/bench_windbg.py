"""분석기 vs WinDbg 대조 측정 도구(Windows PC 전용: cdb 필요).

덤프 파일(또는 폴더)을 주면 각 덤프에 `cdb -z <덤프> -c "!analyze -v; q"`를 돌려 WinDbg 결과를 캐시에 저장하고,
같은 덤프를 우리 분석기(kernel_dump_parser + stack_unwinder)로 분석해 필드별로 비교한 뒤 일치율 표를 낸다.

사용법(저장소 루트에서):
    python -I ai-service/bench_windbg.py <덤프 파일 또는 폴더> [...] [--out 결과.md] [--cache 폴더] [--cdb cdb.exe 경로] [--jobs 2]

- 덤프 원본과 WinDbg 출력은 개인정보가 있을 수 있어 저장소에 두지 않는다. 캐시 기본 위치는 %LOCALAPPDATA%\\itsvc-bench\\windbg.
- 결과 표에는 덤프 파일 이름만 쓴다(폴더 이름·경로는 쓰지 않는다). 같은 내용의 덤프는 한 번만 센다.
- 각 필드의 판정: 일치 / 불일치 / 미생성(WinDbg는 값이 있는데 우리는 만들지 않음) / 비교불가(WinDbg에 값이 없음) /
  의도(원인 모듈 필드 한정: WinDbg는 Microsoft 시스템 드라이버를 지목했지만 우리는 일부러 시스템 모듈을 원인으로 지목하지 않는다. 비율 계산에서 제외하고 따로 표시).
  일치율 = 일치 ÷ (일치+불일치+미생성), 정밀도 = 일치 ÷ (일치+불일치). 틀린 값을 내는 것이 값을 안 내는 것보다 나쁘므로 둘을 따로 본다.
"""
import argparse
import hashlib
import os
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SYMBOL_PATH = "srv*C:\\Symbols*https://msdl.microsoft.com/download/symbols"
FIELDS = ("stopCode", "params", "process", "module", "symbol", "bucket")
FIELD_LABELS = {"stopCode": "STOP 코드", "params": "매개변수", "process": "프로세스", "module": "원인 모듈",
                "symbol": "문제 함수", "bucket": "실패 버킷"}
_KERNEL_IMAGES = {"ntkrnlmp.exe", "ntoskrnl.exe", "ntkrnlpa.exe", "ntkrpamp.exe", "hal.dll"}
_CPU_VENDOR_IMAGES = {"authenticamd.sys", "genuineintel.sys"}


# ── WinDbg 출력 파싱 ────────────────────────────────────────────────────────
def parse_windbg(text: str) -> dict:
    """`!analyze -v` 출력에서 비교에 쓰는 줄을 읽는다. 없는 값은 None."""
    def line(key):
        m = re.search(rf"^{key}:[ \t]*(.+?)[ \t]*$", text, re.M)
        return m.group(1).strip() if m else None

    code = line("BUGCHECK_CODE")
    params = []
    for i in range(1, 5):
        v = line(f"BUGCHECK_P{i}")
        params.append(int(v, 16) if v and re.fullmatch(r"[0-9a-fA-F]+", v) else None)
    return {"stopCode": int(code, 16) if code and re.fullmatch(r"[0-9a-fA-F]+", code) else None,
            "params": params, "process": line("PROCESS_NAME"), "image": line("IMAGE_NAME"),
            "symbol": line("SYMBOL_NAME"), "bucket": line("FAILURE_BUCKET_ID")}


def split_symbol(sym):
    """WinDbg SYMBOL_NAME → (모듈, 함수 또는 None). 'nt!MiX+b6' → ('nt','MiX'), 'nvlddmkm+e34e3' → ('nvlddmkm', None)."""
    if not sym:
        return None
    base = re.sub(r"\+(?:0x)?[0-9a-fA-F]+$", "", sym)
    if "!" in base:
        mod, func = base.split("!", 1)
        return mod, func
    return base, None


# ── 비교 ────────────────────────────────────────────────────────────────────
def _verdict(ours, theirs, equal):
    if theirs in (None, "", []):
        return "비교불가"
    if ours in (None, "", []):
        return "미생성"
    return "일치" if equal(ours, theirs) else "불일치"


def _is_system(name: str) -> bool:
    import kernel_dump_parser as K
    return K.is_system_module(name)


def compare(ours: dict, win: dict) -> dict:
    """ours: {stopCode(int), params(list[int]), process, module, symbol, bucket}. win: parse_windbg 결과. 필드별 판정을 돌려준다."""
    out = {}
    out["stopCode"] = _verdict(ours.get("stopCode"), win["stopCode"], lambda a, b: a == b)
    wp = [p for p in win["params"]]
    op = ours.get("params") or []
    out["params"] = _verdict(op if op else None, wp if any(p is not None for p in wp) else None,
                             lambda a, b: all((x is None) or (i < len(a) and (a[i] & 0xFFFFFFFFFFFFFFFF) == x) for i, x in enumerate(b)))
    # 프로세스: 커널은 이름을 15자까지만 저장하므로 우리 이름이 WinDbg 이름의 앞부분이면 같은 것으로 본다
    out["process"] = _verdict(ours.get("process"), win["process"],
                              lambda a, b: b.lower() == a.lower() or (len(a) >= 14 and b.lower().startswith(a.lower())))

    # 원인 모듈: 우리가 지목하지 않았는데 WinDbg도 커널·CPU(하드웨어)를 가리키면 같은 판단(드라이버 지목 없음)으로 본다
    img = (win["image"] or "").lower()
    if not ours.get("module") and (img in _KERNEL_IMAGES or img in _CPU_VENDOR_IMAGES):
        out["module"] = "일치"
    else:
        out["module"] = _verdict(ours.get("module"), win["image"], lambda a, b: a.lower() == b.lower())
        if out["module"] == "미생성" and _is_system(win["image"]):
            out["module"] = "의도"

    ws = split_symbol(win["symbol"])
    os_ = split_symbol(ours.get("symbol"))
    if ws and ws[1] is None:      # WinDbg도 함수 이름을 못 구한 경우(모듈+오프셋)
        out["symbol"] = "일치" if (os_ is None or os_[1] is None) else "불일치"
    else:
        out["symbol"] = _verdict(os_, ws, lambda a, b: a[1] == b[1] and a[0].lower() == b[0].lower())
    out["bucket"] = _verdict(ours.get("bucket"), win["bucket"], lambda a, b: a == b)
    return out


def summarize(rows: list) -> dict:
    """rows: compare() 결과 목록 → 필드별 {일치, 불일치, 미생성, 비교불가, 일치율, 정밀도}."""
    summary = {}
    for f in FIELDS:
        c = {"일치": 0, "불일치": 0, "미생성": 0, "비교불가": 0, "의도": 0}
        for r in rows:
            c[r["cmp"][f]] += 1
        denom = c["일치"] + c["불일치"] + c["미생성"]
        prod = c["일치"] + c["불일치"]
        c["일치율"] = (c["일치"] / denom) if denom else None
        c["정밀도"] = (c["일치"] / prod) if prod else None
        summary[f] = c
    return summary


# ── 실행 ────────────────────────────────────────────────────────────────────
def find_cdb(explicit=None):
    if explicit and os.path.isfile(explicit):
        return explicit
    env = os.environ.get("CDB_PATH")
    if env and os.path.isfile(env):
        return env
    try:
        loc = subprocess.run(["powershell", "-NoProfile", "-Command", "(Get-AppxPackage Microsoft.WinDbg | Select -First 1).InstallLocation"],
                             capture_output=True, text=True, timeout=60).stdout.strip()
        cand = os.path.join(loc, "amd64", "cdb.exe") if loc else ""
        if cand and os.path.isfile(cand):
            return cand
    except Exception:
        pass
    for p in os.environ.get("PATH", "").split(os.pathsep):
        cand = os.path.join(p, "cdb.exe")
        if os.path.isfile(cand):
            return cand
    return None


def run_windbg(cdb, dump_path, cache_file, timeout=900):
    if os.path.isfile(cache_file) and os.path.getsize(cache_file) > 0:
        return open(cache_file, encoding="utf-8", errors="replace").read()
    proc = subprocess.run([cdb, "-z", dump_path, "-y", SYMBOL_PATH, "-c", "!analyze -v; q"], capture_output=True, timeout=timeout)
    text = proc.stdout.decode("utf-8", "replace")
    os.makedirs(os.path.dirname(cache_file), exist_ok=True)
    open(cache_file, "w", encoding="utf-8").write(text)
    return text


def run_ours(data: bytes):
    """우리 분석기 결과를 비교용 값으로 줄인다. 커널(PAGEDU64) 덤프가 아니면 None."""
    import kernel_dump_parser as K
    if not K.is_kernel_64(data):
        return None
    r = K.parse(data)
    if "error" in r:
        return None
    try:
        import stack_unwinder
        r = stack_unwinder.enhance(data, r)
    except Exception:
        pass
    params = []
    for x in r.get("stopParams") or []:
        try:
            params.append(int(x, 16))
        except ValueError:
            params.append(None)
    return {"stopCode": K.base_code(int(r["stopCode"], 16)), "params": params, "process": (r.get("crashProcess") or {}).get("name"),
            "module": r.get("faultingModule"), "symbol": r.get("faultingSymbol"), "bucket": r.get("failureBucket")}


def collect(paths):
    files = []
    for p in paths:
        if os.path.isdir(p):
            for root, _, names in os.walk(p):
                files += [os.path.join(root, n) for n in names if n.lower().endswith(".dmp")]
        elif os.path.isfile(p):
            files.append(p)
    seen, out = {}, []
    for f in sorted(files):
        h = hashlib.md5(open(f, "rb").read()).hexdigest()
        if h not in seen:
            seen[h] = f
            out.append((h, f))
    return out


def render(rows, summary, skipped, stamp):
    L = [f"# 분석기 vs WinDbg 대조 ({stamp})", "",
         f"덤프 {len(rows)}개(중복 제외, 커널 덤프가 아니라 건너뛴 것 {skipped}개). 일치율 = 일치÷(일치+불일치+미생성), 정밀도 = 일치÷(일치+불일치).", "",
         "| 필드 | 일치 | 불일치 | 미생성 | 비교불가 | 의도 | 일치율 | 정밀도 |", "|---|---|---|---|---|---|---|---|"]
    pct = lambda v: "-" if v is None else f"{v * 100:.0f}%"
    for f in FIELDS:
        c = summary[f]
        L.append(f"| {FIELD_LABELS[f]} | {c['일치']} | {c['불일치']} | {c['미생성']} | {c['비교불가']} | {c['의도']} | {pct(c['일치율'])} | {pct(c['정밀도'])} |")
    L += ["", "## 덤프별", "", "| 파일 | STOP | " + " | ".join(FIELD_LABELS[f] for f in FIELDS[1:]) + " |", "|---|---|" + "---|" * (len(FIELDS) - 1)]
    for r in rows:
        L.append(f"| {r['name']} | {hex(r['code'])} | " + " | ".join(r["cmp"][f] for f in FIELDS[1:]) + " |")
    bad = [(r, f) for r in rows for f in FIELDS if r["cmp"][f] == "불일치"]
    if bad:
        L += ["", "## 불일치 상세(우리 값 ↔ WinDbg 값)", ""]
        win_key = {"process": "process", "module": "image", "symbol": "symbol", "bucket": "bucket"}
        for r, f in bad:
            L.append(f"- {r['name']} · {FIELD_LABELS[f]}: {r['ours'].get(f)} ↔ {r['win'].get(win_key.get(f, f))}")
    return "\n".join(L) + "\n"


def main(argv=None):
    ap = argparse.ArgumentParser(description="분석기 vs WinDbg 대조 측정")
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--out")
    ap.add_argument("--cache", default=os.path.join(os.environ.get("LOCALAPPDATA", "."), "itsvc-bench", "windbg"))
    ap.add_argument("--cdb")
    ap.add_argument("--jobs", type=int, default=2)
    a = ap.parse_args(argv)
    cdb = find_cdb(a.cdb)
    if not cdb:
        print("cdb.exe를 찾지 못했습니다. WinDbg를 설치하거나 --cdb로 경로를 주세요(Windows PC 전용).", file=sys.stderr)
        return 2
    items = collect(a.paths)
    kernel_items, skipped = [], 0
    for h, f in items:
        with open(f, "rb") as fh:
            is_kernel = fh.read(8) == b"PAGEDU64"
        if is_kernel:
            kernel_items.append((h, f))
        else:
            skipped += 1
    print(f"덤프 {len(kernel_items)}개 대조(건너뜀 {skipped}개). WinDbg는 처음 보는 덤프마다 1~3분 걸립니다.", file=sys.stderr)

    def work(item):
        h, f = item
        win_text = run_windbg(cdb, f, os.path.join(a.cache, h + ".txt"))
        return h, f, parse_windbg(win_text)

    with ThreadPoolExecutor(max_workers=max(1, a.jobs)) as pool:
        wins = list(pool.map(work, kernel_items))
    rows = []
    for h, f, win in wins:
        ours = run_ours(open(f, "rb").read())
        if ours is None or win["stopCode"] is None:
            skipped += 1
            continue
        rows.append({"name": os.path.basename(f), "code": ours["stopCode"], "ours": ours, "win": win, "cmp": compare(ours, win)})
    summary = summarize(rows)
    import datetime
    text = render(rows, summary, skipped, datetime.date.today().isoformat())
    if a.out:
        open(a.out, "w", encoding="utf-8").write(text)
    sys.stdout.buffer.write(text.encode("utf-8"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
