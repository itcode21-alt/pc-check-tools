#!/usr/bin/env python3
"""콘텐츠 페이지에 repair-cta.js(수리 의뢰 블록) 태그를 넣는다 (2026-10-28).

- 진단 도구·계산기·정책·관리 페이지(EXCLUDE)는 건너뛴다.
- 이미 태그가 있으면 건너뛴다(여러 번 실행해도 안전).
- 새 페이지를 만든 뒤 다시 실행하면 그 페이지에도 들어간다.

사용: python3 scripts/apply-repair-cta.py
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAG = '<script defer src="repair-cta.js?v=cta-20261028"></script>'

EXCLUDE = {
    # 관리·시스템
    "404.html", "admin.html", "admin-local.html", "community-cases-admin.html",
    "search-results.html", "sitemap.html",
    # 정책·소개
    "about.html", "contact.html", "pricing.html", "privacy.html", "terms.html", "editorial-policy.html",
    # 홈(진단 도구 허브)
    "index.html", "tools.html",
    # 진단 도구·계산기·입력형 페이지 — 의뢰 블록 불필요
    "diagnostic.html", "games-diagnostic.html", "nas-diagnostic.html",
    "upgrade-diagnostic.html", "device-manager-code-finder.html",
    "minidump-analyzer.html", "event-log-analyzer.html", "parts-compatibility.html", "pc-builder.html",
    "pc-recommendation.html", "ram-upgrade-checker.html",
    "psu-calculator.html", "raid-calculator.html", "backup-storage-calculator.html",
    "ssd-tbw-calculator.html", "ups-calculator.html", "monitor-calculator.html",
    # 사용자 입력 게시판
    "community-cases.html",
}


def main() -> None:
    added, skipped, excluded, no_body = [], [], [], []
    for path in sorted(ROOT.glob("*.html")):
        name = path.name
        if name in EXCLUDE:
            excluded.append(name)
            continue
        html = path.read_text(encoding="utf-8")
        if "repair-cta.js" in html:
            skipped.append(name)
            continue
        idx = html.rfind("</body>")
        if idx == -1:
            no_body.append(name)
            continue
        html = html[:idx] + "  " + TAG + "\n" + html[idx:]
        path.write_text(html, encoding="utf-8")
        added.append(name)
    print(f"추가 {len(added)} · 이미 있음 {len(skipped)} · 제외 {len(excluded)} · </body> 없음 {len(no_body)}")
    if no_body:
        print("</body> 없음:", ", ".join(no_body))


if __name__ == "__main__":
    main()
