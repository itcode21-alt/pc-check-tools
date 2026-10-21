"""캡처 이미지 현황을 현재 저장소 기준으로 계산해 출력한다.

docs/SCREENSHOT_TODO.md는 이 숫자를 직접 적지 않는다(PR마다 같은 줄이 충돌하고 실제와 어긋나기 때문).
현황이 필요하면 이 스크립트를 실행한다.

사용법 (사이트 루트에서):
  python -X utf8 scripts/screenshot-status.py          # 요약
  python -X utf8 scripts/screenshot-status.py --list   # 캡처가 없는 페이지 목록까지 출력
  python -X utf8 scripts/screenshot-status.py --check  # 촬영 목록 문서와 사이트가 어긋났는지 점검(어긋나면 종료 코드 1)
  python -X utf8 scripts/screenshot-status.py --undocumented  # 문서에 이름이 없는 사이트 이미지(정보 출력, 실패 아님)

--check 가 보는 것: (1) 문서 '완료' 표의 파일명이 assets에 있고 어떤 페이지가 쓰는가, (2) '남은 항목'에 적힌 이름이 이미 사이트에서 쓰이는데 완료 표에 없는가.
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GROUPS = [
    ("이벤트 상세 페이지", r"event-(?!codes-index).*\.html"),
    ("16진수 코드 페이지(error-code-0x…: 블루스크린 정지 코드와 0x8…, 0xc… 오류 포함)", r"error-code-0x[0-9a-f]+\.html"),
    ("기타 오류 코드 페이지(error-code-… 나머지)", r"error-code-(?!0x).*\.html"),
    ("하드웨어·증상 가이드(hardware-, windows-, network-, nas-)", r"(hardware|windows|network|nas)-.*\.html"),
]


def has_capture(path: Path) -> bool:
    return "guide-image-link" in path.read_text(encoding="utf-8", errors="replace")


def site_usage():
    """assets/*.jpg 이미지 이름 -> 그 이미지를 쓰는 HTML 파일 목록."""
    names = {p.stem for p in (ROOT / "assets").glob("*.jpg")}
    texts = {p.name: p.read_text(encoding="utf-8", errors="replace") for p in ROOT.glob("*.html")}
    return names, {n: sorted(f for f, t in texts.items() if f"assets/{n}.jpg" in t) for n in names}


def doc_names(section_text):
    """문서 표의 앞쪽 두 칸에서 `이미지이름`을 뽑는다. 와일드카드(*)가 든 이름은 건너뛴다."""
    found = set()
    for row in section_text.splitlines():
        if not row.startswith("|"):
            continue
        for cell in row.split("|")[1:3]:
            for name in re.findall(r"`([a-z0-9][a-z0-9-]+)`", cell):
                if "*" not in name:
                    found.add(name)
    return found


def wildcard_prefixes(section_text):
    """`winre-26h2-*` 처럼 묶음으로 적은 이름의 접두어(winre-26h2-)를 뽑는다."""
    prefixes = set()
    for row in section_text.splitlines():
        if row.startswith("|"):
            for cell in row.split("|")[1:3]:
                prefixes.update(re.findall(r"`([a-z0-9][a-z0-9-]*-)\*`", cell))
    return prefixes


def run_undocumented():
    """사이트가 쓰는 이미지 중 문서 어디에도 이름이 없는 것을 정보로 출력한다(실패 조건 아님).

    이 문서를 만들기 전부터 있던 이미지는 문서에 적지 않으므로 대부분은 정상이다.
    새로 추가한 이미지를 문서에 빠뜨렸는지 볼 때 참고한다.
    """
    doc = (ROOT / "docs" / "SCREENSHOT_TODO.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    prefixes = wildcard_prefixes(doc)
    names, usage = site_usage()
    missing = sorted(
        n for n in names
        if usage[n] and f"`{n}`" not in doc and not any(n.startswith(p) for p in prefixes)
    )
    print(f"사이트가 쓰는 이미지 중 문서에 이름이 없는 것: {len(missing)}개 (문서를 만들기 전의 이미지가 대부분)")
    for n in missing:
        print("  ", n, "->", ", ".join(usage[n]))
    return 0


def run_check():
    """촬영 목록 문서와 사이트의 실제 상태를 대조한다. 어긋나면 1, 문서 구조를 못 읽으면 2를 돌려준다."""
    doc = (ROOT / "docs" / "SCREENSHOT_TODO.md").read_text(encoding="utf-8").replace("\r\n", "\n")
    a, b, c = doc.find("## 완료"), doc.find("## 진행 중"), doc.find("## 남은 항목")
    if min(a, b, c) < 0 or not (a < b < c):
        print("문서에서 '## 완료', '## 진행 중', '## 남은 항목' 제목을 찾지 못해 점검을 중단합니다.")
        return 2
    done = doc_names(doc[a:b])
    todo = doc_names(doc[c:])
    names, usage = site_usage()
    problems = []
    for n in sorted(done):
        if n not in names:
            problems.append(f"완료 표: `{n}` 파일이 assets에 없습니다")
        elif not usage[n]:
            problems.append(f"완료 표: `{n}` 은(는) 어떤 페이지에서도 쓰이지 않습니다")
    for n in sorted(todo - done):
        if usage.get(n):
            problems.append(f"남은 항목: `{n}` 은(는) 이미 {', '.join(usage[n])}에서 쓰이는데 완료 표에 없습니다")
    print(f"완료 표 {len(done)}개, 남은 항목 이름 {len(todo)}개를 사이트와 대조했습니다.")
    if problems:
        print(f"어긋난 곳 {len(problems)}건:")
        for item in problems:
            print("  -", item)
        return 1
    print("어긋난 곳 없음")
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="캡처가 없는 페이지 목록도 출력")
    ap.add_argument("--check", action="store_true", help="촬영 목록 문서와 사이트가 어긋났는지 점검")
    ap.add_argument("--undocumented", action="store_true", help="문서에 이름이 없는 사이트 이미지를 정보로 출력")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if args.undocumented:
        sys.exit(run_undocumented())
    if args.check:
        sys.exit(run_check())

    htmls = sorted(p for p in ROOT.glob("*.html"))
    jpgs = sorted(p for p in (ROOT / "assets").glob("*.jpg"))
    with_capture = [p for p in htmls if has_capture(p)]
    print(f"assets 캡처(jpg 기준): {len(jpgs)}종")
    print(f"HTML 페이지: {len(htmls)}개 중 캡처가 들어간 페이지 {len(with_capture)}개")
    print()
    missing_all = {}
    for title, pattern in GROUPS:
        rx = re.compile(pattern)
        members = [p for p in htmls if rx.fullmatch(p.name)]
        miss = [p.name for p in members if not has_capture(p)]
        missing_all[title] = miss
        print(f"{title}: {len(members)}개 중 캡처 있음 {len(members) - len(miss)}개, 없음 {len(miss)}개")
    if args.list:
        for title, miss in missing_all.items():
            print(f"\n[{title}] 캡처 없는 페이지 {len(miss)}개")
            for name in miss:
                print("  ", name)


if __name__ == "__main__":
    main()
