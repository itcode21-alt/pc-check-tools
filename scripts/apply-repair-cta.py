#!/usr/bin/env python3
"""전 페이지에 repair-cta.js(상단 띠배너 + 하단 수리 의뢰 블록)·admin-cmd-note.js 태그를 맞추고 공통 링크·버전을 정리한다 (2026-11-17 개정).

- FULL      : 띠배너 + 하단 수리 의뢰 블록 (콘텐츠·가이드 페이지, 진단 도구)
- BANNER    : 띠배너만 (data-banner-only) — 계산기·정책·허브·입력형 도구 페이지
- NO_CTA    : 태그를 건드리지 않는다 (관리·404·원격지원 페이지 자체)
- 이미 태그가 있으면 현재 분류에 맞는 최신 태그로 교체하고, 없으면 </body> 앞에 넣는다.
- 푸터 링크에 "원격지원"이 없으면 "문의" 앞에 넣는다.
- site.js·app.js·search-index.js·style.css 캐시 버전 문자열을 아래 상수로 통일한다(app.js 안의 site.js 동적 로드 버전 포함).
- 여러 번 실행해도 결과가 같다. 파일의 줄바꿈(CRLF/LF)은 그대로 보존한다.
- 다른 브랜치와 합칠 때 버전 줄이 충돌하면 이 스크립트를 다시 실행해 맞춘다.

사용: python3 scripts/apply-repair-cta.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

REPAIR_VER = "cta-banner-20261117e"
SITE_JS_VER = "nav-svc-20261117"
APP_JS_VER = "svc-20261117"
SEARCH_INDEX_VER = "svc-idx-20261117"
STYLE_VER = "ui-20261117c"

TAG_FULL = f'<script defer src="repair-cta.js?v={REPAIR_VER}"></script>'
TAG_BANNER = f'<script defer src="repair-cta.js?v={REPAIR_VER}" data-banner-only></script>'
ADMIN_TAG = '<script defer src="admin-cmd-note.js?v=adminnote-20261029"></script>'

# 태그를 건드리지 않는 페이지: 관리·시스템, 그리고 원격지원 페이지 자체(배너·블록이 자기 자신을 가리키게 되므로)
NO_CTA = {
    "404.html", "admin.html", "admin-local.html", "community-cases-admin.html",
    "remote-support.html",
}

# 띠배너만 보여주는 페이지: 계산기·정책·허브·입력형 도구
BANNER_ONLY = {
    "search-results.html", "sitemap.html",
    "about.html", "contact.html", "pricing.html", "privacy.html", "terms.html", "editorial-policy.html",
    "index.html", "tools.html",
    "games-diagnostic.html", "nas-diagnostic.html",
    "upgrade-diagnostic.html", "device-manager-code-finder.html",
    "minidump-analyzer.html", "event-log-analyzer.html", "parts-compatibility.html", "pc-builder.html",
    "pc-recommendation.html", "ram-upgrade-checker.html",
    "psu-calculator.html", "raid-calculator.html", "backup-storage-calculator.html",
    "ssd-tbw-calculator.html", "ups-calculator.html", "monitor-calculator.html",
    "community-cases.html",
    # 새 도구·안내 페이지
    "device-test.html", "inspection-report.html", "parts-support.html",
}

REPAIR_TAG_RE = re.compile(r'<script defer src="repair-cta\.js\?v=[^"]*"[^>]*></script>')
FOOTER_RE = re.compile(r'(<p class="footer-links">)(.*?)(</p>)', re.S)
CONTACT_LINK = '<a href="contact.html">문의</a>'
REMOTE_LINK = '<a href="remote-support.html">원격지원</a>'


def process(path: Path, stats: dict) -> None:
    raw = path.read_bytes().decode("utf-8")
    eol = "\r\n" if "\r\n" in raw else "\n"
    text = raw.replace("\r\n", "\n")
    before = text
    name = path.name

    text = re.sub(r'(src="site\.js\?v=)[^"]*', rf"\g<1>{SITE_JS_VER}", text)
    text = re.sub(r'(src="app\.js\?v=)[^"]*', rf"\g<1>{APP_JS_VER}", text)
    text = re.sub(r'(src="search-index\.js\?v=)[^"]*', rf"\g<1>{SEARCH_INDEX_VER}", text)
    text = re.sub(r'(href="style\.css\?v=)[^"]*', rf"\g<1>{STYLE_VER}", text)

    if name not in NO_CTA:
        banner_only = name in BANNER_ONLY
        want = TAG_BANNER if banner_only else TAG_FULL
        if REPAIR_TAG_RE.search(text):
            text = REPAIR_TAG_RE.sub(want, text, count=1)
        else:
            idx = text.rfind("</body>")
            if idx == -1:
                stats["no_body"].append(name)
            else:
                add = want if banner_only else want + "\n  " + ADMIN_TAG
                text = text[:idx] + "  " + add + "\n" + text[idx:]
                stats["tag_added"] += 1
        if not banner_only and "admin-cmd-note.js" not in text:
            idx = text.rfind("</body>")
            if idx != -1:
                text = text[:idx] + "  " + ADMIN_TAG + "\n" + text[idx:]

        def add_footer(match: re.Match) -> str:
            body = match.group(2)
            if "remote-support.html" in body:
                return match.group(0)
            stats["footer_added"] += 1
            if CONTACT_LINK in body:
                return match.group(1) + body.replace(CONTACT_LINK, f"{REMOTE_LINK} · {CONTACT_LINK}", 1) + match.group(3)
            return match.group(1) + body.rstrip() + f" · {REMOTE_LINK}" + match.group(3)

        text = FOOTER_RE.sub(add_footer, text, count=1)

    if text != before:
        path.write_bytes(text.replace("\n", eol).encode("utf-8"))
        stats["changed"] += 1


def patch_app_js() -> None:
    path = ROOT / "app.js"
    raw = path.read_bytes().decode("utf-8")
    new = re.sub(r'(siteShell\.src = "site\.js\?v=)[^"]*', rf"\g<1>{SITE_JS_VER}", raw)
    if new != raw:
        path.write_bytes(new.encode("utf-8"))
        print("app.js: site.js 동적 로드 버전 갱신")


def main() -> None:
    stats = {"changed": 0, "tag_added": 0, "footer_added": 0, "no_body": []}
    for path in sorted(ROOT.glob("*.html")):
        process(path, stats)
    patch_app_js()
    print(f"변경 {stats['changed']} · 태그 추가 {stats['tag_added']} · 푸터 링크 추가 {stats['footer_added']} · </body> 없음 {len(stats['no_body'])}")
    if stats["no_body"]:
        print("</body> 없음:", ", ".join(stats["no_body"]))


if __name__ == "__main__":
    main()
