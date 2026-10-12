"""사이트 감시: 공개 페이지·AI 서버 상태를 점검하고, 동의 기반 익명 문의에서 오류 코드 빈도를 집계한다.

launchd가 매일 실행하지만, 마지막 전체 점검 후 2일이 지나지 않았으면 아무것도 하지 않는다.
질문 원문은 보고서에 넣지 않고 오류 코드와 참조 문서 ID 빈도만 기록한다.
"""

import json
import os
import re
import subprocess
import urllib.request
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

SEOUL = timezone(timedelta(hours=9))
ROOT = Path(os.environ.get("SITE_WATCH_ROOT", Path(__file__).resolve().parent.parent))
DATA_DIR = Path(os.environ.get("SITE_WATCH_DATA", ROOT / "ai-service" / "data"))
STATE_PATH = DATA_DIR / "site-watch-state.json"
REPORT_DIR = DATA_DIR / "reports"
INQUIRY_PATH = Path(os.environ.get("AI_INQUIRY_STORAGE_PATH", DATA_DIR / "ai-inquiries.jsonl"))
SITE = "https://itsvc.co.kr"
AI_HEALTH = "https://ai.itsvc.co.kr/api/health"
INTERVAL_DAYS = 2

ANALYZER_PAGES = [
    "diagnostic.html",
    "minidump-analyzer.html",
    "event-codes-index.html",
    "device-manager-codes.html",
    "memory-test-guide.html",
    "upgrade.html",
    "pc-builder.html",
    "search-index.js",
    "sitemap.xml",
]

HEX_CODE = re.compile(r"0x[0-9A-Fa-f]{6,8}")
EVENT_ID = re.compile(r"(?:이벤트\s*ID|Event\s*ID)\s*[:=]?\s*(\d{3,5})", re.IGNORECASE)


def now():
    return datetime.now(SEOUL)


def load_state():
    try:
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}


def save_state(state):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "itsvc-site-watch/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as res:
            return res.status, res.read().decode("utf-8", errors="replace")
    except Exception as exc:
        return None, str(exc)


def check_pages():
    rows = []
    stamp = int(now().timestamp())
    for page in ANALYZER_PAGES:
        status, body = fetch(f"{SITE}/{page}?v={stamp}")
        ok = status == 200 and len(body) > 500
        rows.append((page, status, ok))
    return rows


def check_ai():
    status, body = fetch(AI_HEALTH)
    if status != 200:
        return False, f"응답 없음 또는 오류({body[:80]})"
    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        return False, "JSON 아님"
    model_ok = data.get("model_available") is True
    return model_ok, json.dumps({k: data.get(k) for k in ("ollama_reachable", "model_available", "kb_documents")}, ensure_ascii=False)


def run_link_check():
    script = ROOT / "scripts" / "check-links.mjs"
    if not script.exists():
        return "scripts/check-links.mjs 없음"
    try:
        out = subprocess.run(["node", str(script)], cwd=ROOT, capture_output=True, text=True, timeout=300)
        lines = [line for line in out.stdout.splitlines() if "깨진 링크" in line]
        return lines[-1] if lines else f"종료 코드 {out.returncode}"
    except (OSError, subprocess.TimeoutExpired) as exc:
        return f"실행 실패: {exc}"


def read_inquiries(since):
    if not INQUIRY_PATH.exists():
        return []
    records = []
    for line in INQUIRY_PATH.read_text(encoding="utf-8").splitlines():
        try:
            record = json.loads(line)
            recorded = datetime.fromisoformat(str(record["recorded_at"]))
        except (KeyError, TypeError, ValueError, json.JSONDecodeError):
            continue
        if recorded >= since:
            records.append(record)
    return records


def aggregate(records):
    codes, events, sources = Counter(), Counter(), Counter()
    for record in records:
        text = record.get("question", "")
        codes.update({"0x" + c[2:].upper() for c in HEX_CODE.findall(text)})
        events.update(EVENT_ID.findall(text))
        sources.update(record.get("source_ids") or [])
    return codes, events, sources


def guide_exists(code):
    slug = f"error-code-{code.lower()}.html"
    return (ROOT / slug).exists()


def build_report(pages, ai, links, records, codes, events, sources, since):
    stamp = now().strftime("%Y-%m-%d %H:%M")
    lines = [f"# 사이트 감시 보고서 ({stamp})", "", f"집계 구간: {since:%Y-%m-%d} ~ 현재, 문의 {len(records)}건", ""]
    lines += ["## 1. 공개 페이지", "", "| 페이지 | 상태 | 판정 |", "|---|---|---|"]
    for page, status, ok in pages:
        lines.append(f"| {page} | {status} | {'정상' if ok else '확인 필요'} |")
    lines += ["", "## 2. AI 서버", "", f"- 판정: {'정상' if ai[0] else '확인 필요'} — {ai[1]}", ""]
    lines += ["## 3. 깨진 내부 링크", "", f"- {links}", ""]
    lines += ["## 4. 오류 코드 빈도 (원인 후보, 확정 원인 아님)", ""]
    if not codes:
        lines.append("- 집계된 16진 오류 코드 없음")
    for code, count in codes.most_common(20):
        mark = "가이드 있음" if guide_exists(code) else "가이드 없음 → 콘텐츠 필요"
        lines.append(f"- {code}: {count}건 ({mark})")
    lines += ["", "## 5. 이벤트 ID 빈도", ""]
    if not events:
        lines.append("- 집계된 이벤트 ID 없음")
    for eid, count in events.most_common(20):
        lines.append(f"- 이벤트 ID {eid}: {count}건")
    lines += ["", "## 6. 많이 참조된 문서", ""]
    for doc, count in sources.most_common(15):
        lines.append(f"- {doc}: {count}건")
    lines += ["", "빈도가 높다고 해서 그 원인이 확실한 것은 아닙니다. 가이드의 점검 순서로 실제 재현을 확인한 뒤 판단하세요."]
    return "\n".join(lines) + "\n"


def main():
    state = load_state()
    last = state.get("last_full_run")
    if last:
        elapsed = now() - datetime.fromisoformat(last)
        if elapsed < timedelta(days=INTERVAL_DAYS):
            print(f"마지막 점검 {last}, 아직 {INTERVAL_DAYS}일이 지나지 않아 건너뜁니다.")
            return
        since = datetime.fromisoformat(last)
    else:
        since = now() - timedelta(days=INTERVAL_DAYS)

    pages = check_pages()
    ai = check_ai()
    links = run_link_check()
    records = read_inquiries(since)
    codes, events, sources = aggregate(records)
    report = build_report(pages, ai, links, records, codes, events, sources, since)

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    path = REPORT_DIR / f"site-watch-{now():%Y%m%d}.md"
    path.write_text(report, encoding="utf-8")
    save_state({"last_full_run": now().isoformat(timespec="seconds"), "last_report": str(path)})
    print(f"보고서 저장: {path}")


if __name__ == "__main__":
    main()
