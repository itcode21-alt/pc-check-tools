"""캡처 이미지 현황을 현재 저장소 기준으로 계산해 출력한다.

docs/SCREENSHOT_TODO.md는 이 숫자를 직접 적지 않는다(PR마다 같은 줄이 충돌하고 실제와 어긋나기 때문).
현황이 필요하면 이 스크립트를 실행한다.

사용법 (사이트 루트에서):
  python -X utf8 scripts/screenshot-status.py          # 요약
  python -X utf8 scripts/screenshot-status.py --list   # 캡처가 없는 페이지 목록까지 출력
"""
import argparse
import glob
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


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--list", action="store_true", help="캡처가 없는 페이지 목록도 출력")
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

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
