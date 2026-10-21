"""메인 화면의 "이번 달 Windows 업데이트 이슈" 카드를 Microsoft 공식 알려진 문제 표로 갱신한다.

사용법 (사이트 루트에서):
  python -X utf8 scripts/update-home-issues.py            # index.html 갱신
  python -X utf8 scripts/update-home-issues.py --dry-run  # 결과만 출력, 파일은 쓰지 않음

동작
- Microsoft Learn 한국어 "Windows 11 25H2 알려진 문제" 페이지의 표(요약·원래 업데이트·상태·마지막 업데이트)를 읽는다.
- 마지막 업데이트가 가장 최근인 항목 3개를 카드로 만들어 index.html의 HOME_ISSUES_* 마커 사이에 넣는다.
- 제목·상태·날짜는 공식 한국어 문구를 그대로 쓴다(직접 번역하거나 지어내지 않는다).
- 페이지를 못 읽었거나 표 구조가 바뀌어 항목을 하나도 못 뽑으면 index.html을 건드리지 않고 비정상 종료한다.
"""
import argparse
import datetime
import html
import re
import sys
import urllib.request
from html.parser import HTMLParser
from pathlib import Path

SOURCE_URL = "https://learn.microsoft.com/ko-kr/windows/release-health/status-windows-11-25h2"
INDEX = Path(__file__).resolve().parent.parent / "index.html"
MAX_CARDS = 3
MAX_BODY = 150


class TableParser(HTMLParser):
    """첫 번째 표의 각 행을 셀 목록으로, 셀은 <br> 기준 줄 목록으로 읽는다."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = 0
        self.in_table = False
        self.in_body = False
        self.in_cell = False
        self.in_bold = False
        self.row = None
        self.cell_lines = None
        self.cell_bold = None
        self.rows = []

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables += 1
            self.in_table = self.tables == 1
        elif self.in_table and tag == "tbody":
            self.in_body = True
        elif self.in_body and tag == "tr":
            self.row = []
        elif self.in_body and self.row is not None and tag in ("td", "th"):
            self.in_cell = True
            self.cell_lines = [""]
            self.cell_bold = ""
        elif self.in_cell and tag == "br":
            self.cell_lines.append("")
        elif self.in_cell and tag == "b":
            self.in_bold = True

    def handle_endtag(self, tag):
        if tag == "table" and self.in_table:
            self.in_table = False
            self.in_body = False
        elif self.in_cell and tag == "b":
            self.in_bold = False
        elif self.in_body and self.row is not None and tag in ("td", "th"):
            lines = [re.sub(r"\s+", " ", l).strip() for l in self.cell_lines]
            self.row.append({"lines": [l for l in lines if l], "bold": re.sub(r"\s+", " ", self.cell_bold).strip()})
            self.in_cell = False
        elif self.in_body and tag == "tr" and self.row is not None:
            if self.row:
                self.rows.append(self.row)
            self.row = None

    def handle_data(self, data):
        if self.in_cell:
            self.cell_lines[-1] += data
            if self.in_bold:
                self.cell_bold += data


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (itsvc home issues updater)"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8", "replace")


def parse_issues(page):
    p = TableParser()
    p.feed(page)
    issues = []
    for row in p.rows:
        if len(row) < 4:
            continue
        summary, origin, status, updated = row[:4]
        title = summary["bold"]
        # 요약 셀: 첫 줄이 제목, 이후가 설명
        desc_lines = [l for l in summary["lines"] if l != title]
        desc = " ".join(desc_lines)
        status_lines = status["lines"]
        status_text = status_lines[0] if status_lines else ""
        fixed_by = next((l for l in status_lines[1:] if re.fullmatch(r"KB\d{6,7}", l)), "")
        origin_kb = next((l for l in origin["lines"] if re.fullmatch(r"KB\d{6,7}", l)), "")
        date_match = next((re.search(r"\d{4}-\d{2}-\d{2}", l) for l in updated["lines"] if re.search(r"\d{4}-\d{2}-\d{2}", l)), None)
        if not title or not status_text or not date_match:
            continue
        issues.append({
            "title": title,
            "desc": desc,
            "status": status_text,
            "fixed_by": fixed_by,
            "origin_kb": origin_kb,
            "updated": date_match.group(0),
        })
    return issues


def short(text, limit=MAX_BODY):
    text = text.strip()
    if len(text) <= limit:
        return text
    cut = text[:limit]
    end = max(cut.rfind("."), cut.rfind("다 "))
    return (cut[: end + 1] if end > 40 else cut.rstrip() + "…").strip()


def card(issue):
    year, month, _ = issue["updated"].split("-")
    status = issue["status"] + (f" · {issue['fixed_by']}" if issue["fixed_by"] else "")
    body = short(issue["desc"]) if issue["desc"] else (f"{issue['origin_kb']} 이후 보고된 문제입니다." if issue["origin_kb"] else "")
    return (
        '        <a class="guide-card-link" href="windows-update-tracker.html"><article class="guide-card guide-card--simple">'
        f'<div class="guide-card-meta"><span class="guide-type">{year}년 {int(month)}월 · {html.escape(status)}</span></div>'
        f"<h3>{html.escape(issue['title'])}</h3><p>{html.escape(body)}</p>"
        '<span class="guide-card-cta">자세히 보기 →</span></article></a>'
    )


def intro(issues, checked):
    total = len(issues)
    open_count = sum(1 for i in issues if not i["status"].startswith("해결"))
    return (
        f"          <p>Microsoft 공식 알려진 문제 페이지({checked} 확인) 기준으로 최근 갱신된 문제입니다. "
        f"현재 공개된 {total}건 중 {open_count}건이 아직 해결되지 않은 상태(완화·조사 중 등)입니다. "
        "해결된 항목은 표시된 업데이트(KB)를 설치하면 됩니다.</p>"
    )


def replace_between(text, start, end, content, nl):
    a = text.index(start) + len(start)
    b = text.index(end)
    return text[:a] + nl + content + nl + "        " + text[b:]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--file", help="네트워크 대신 저장된 HTML 파일로 시험")
    args = ap.parse_args()

    try:
        page = Path(args.file).read_text(encoding="utf-8") if args.file else fetch(SOURCE_URL)
    except Exception as e:  # noqa: BLE001
        sys.exit(f"페이지를 읽지 못했습니다: {e}")

    issues = parse_issues(page)
    if not issues:
        sys.exit("알려진 문제 표에서 항목을 하나도 읽지 못했습니다. 페이지 구조가 바뀌었을 수 있어 index.html은 그대로 둡니다.")

    issues.sort(key=lambda i: i["updated"], reverse=True)
    top = issues[:MAX_CARDS]
    checked = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=9)).strftime("%Y-%m-%d")

    raw = INDEX.read_bytes().decode("utf-8")
    nl = "\r\n" if "\r\n" in raw else "\n"
    text = raw.replace("\r\n", "\n")
    for marker in ("HOME_ISSUES_INTRO_START", "HOME_ISSUES_INTRO_END", "HOME_ISSUES_GRID_START", "HOME_ISSUES_GRID_END"):
        if f"<!-- {marker} -->" not in text:
            sys.exit(f"index.html에 마커가 없습니다: {marker}")

    # 확인 날짜는 내용이 같아도 매일 바뀌면 불필요한 커밋이 생기므로, 카드 내용이 바뀐 경우에만 날짜를 갱신한다.
    new_text = text
    new_text = replace_between(new_text, "<!-- HOME_ISSUES_INTRO_START -->", "<!-- HOME_ISSUES_INTRO_END -->", intro(issues, checked), "\n")
    new_text = replace_between(new_text, "<!-- HOME_ISSUES_GRID_START -->", "<!-- HOME_ISSUES_GRID_END -->", "\n".join(card(i) for i in top), "\n")

    def strip_date(t):
        return re.sub(r"\(\d{4}-\d{2}-\d{2} 확인\)", "(DATE 확인)", t)

    if strip_date(new_text) == strip_date(text):
        print("변경 없음(카드 내용이 같음)")
        return

    print(f"항목 {len(issues)}건 읽음, 카드 {len(top)}개 갱신:")
    for i in top:
        print(f"  {i['updated']} | {i['status']}{' ' + i['fixed_by'] if i['fixed_by'] else ''} | {i['title'][:60]}")
    if args.dry_run:
        print("(dry-run: 파일을 쓰지 않음)")
        return
    INDEX.write_bytes(new_text.replace("\n", nl).encode("utf-8"))
    print("index.html 갱신 완료")


if __name__ == "__main__":
    main()
