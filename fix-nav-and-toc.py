#!/usr/bin/env python3
"""
1. 구 nav를 신 nav로 교체 (aria-current 보존)
2. error-code 페이지의 하드코딩된 TOC를 동적 TOC로 교체
"""
import re
from pathlib import Path

ROOT = Path(".")

# ── 신 nav 템플릿 (aria-current 없는 기본형) ──
NEW_NAV_NO_CURRENT = '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="pc-recommendation.html">💻 PC 추천</a><a href="upgrade-diagnostic.html">🔧 업그레이드</a><a href="beginner-guide.html">📚 가이드</a><a href="diagnostic.html">진단</a><a href="admin/dashboard.html">📊 대시보드</a><a href="guides.html">더보기</a></nav>'

# aria-current="page"를 guides.html에 붙인 버전 (가이드/에러코드 계열)
NEW_NAV_GUIDES_CURRENT = '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="pc-recommendation.html">💻 PC 추천</a><a href="upgrade-diagnostic.html">🔧 업그레이드</a><a href="beginner-guide.html">📚 가이드</a><a href="diagnostic.html">진단</a><a href="admin/dashboard.html">📊 대시보드</a><a href="guides.html" aria-current="page">더보기</a></nav>'

# 구 nav 정규식 (contact.html·games·tools 포함 패턴을 잡음)
OLD_NAV_PATTERN = re.compile(
    r'<nav class="nav" aria-label="주요 메뉴">\s*'
    r'<a href="index\.html"[^>]*>홈</a>'
    r'<a href="diagnostic\.html"[^>]*>진단</a>'
    r'.*?'            # 중간 링크들
    r'<a href="contact\.html"[^>]*>문의</a>'
    r'\s*</nav>',
    re.DOTALL
)

# ── 하드코딩 TOC (ul 내용 5개 li) ──
OLD_TOC_UL = re.compile(
    r'<ul>\s*'
    r'<li><a href="#interpretation">[^<]+</a></li>\s*'
    r'<li><a href="#causes">[^<]+</a></li>\s*'
    r'<li><a href="#solutions">[^<]+</a></li>\s*'
    r'<li><a href="#related">[^<]+</a></li>\s*'
    r'<li><a href="#faq">[^<]+</a></li>\s*'
    r'</ul>',
    re.DOTALL
)
NEW_TOC_UL = '<ul id="toc-list"><!-- ui-init.js가 동적으로 채움 --></ul>'

nav_fixed = toc_fixed = skipped = 0

for f in sorted(ROOT.glob("*.html")):
    content = f.read_text(encoding='utf-8', errors='ignore')
    changed = False

    # ── 1. nav 교체 ──
    m = OLD_NAV_PATTERN.search(content)
    if m:
        old_nav = m.group(0)
        # 기존 nav 안에 aria-current 위치 파악
        curr_match = re.search(r'href="([^"]+)" aria-current="page"', old_nav)
        curr_href = curr_match.group(1) if curr_match else None

        # 신 nav 결정
        if curr_href in (None, 'sitemap.html', 'news.html'):
            new_nav = NEW_NAV_NO_CURRENT
        else:
            # contact, games, tools 등 신 nav에 없는 링크가 current였으면 → guides 로 이동
            new_nav = NEW_NAV_GUIDES_CURRENT

        # 단 index.html 자체는 홈이 current
        if f.name == 'index.html':
            new_nav = NEW_NAV_NO_CURRENT.replace(
                '<a href="index.html">홈</a>',
                '<a href="index.html" aria-current="page">홈</a>'
            )

        content = content.replace(old_nav, new_nav, 1)
        nav_fixed += 1
        changed = True

    # ── 2. 하드코딩 TOC → 동적 TOC ──
    if OLD_TOC_UL.search(content):
        content = OLD_TOC_UL.sub(NEW_TOC_UL, content, count=1)
        toc_fixed += 1
        changed = True

    if changed:
        f.write_text(content, encoding='utf-8')
    else:
        skipped += 1

print(f"nav 교체: {nav_fixed}개 파일")
print(f"TOC 동적화: {toc_fixed}개 파일")
print(f"변경 없음: {skipped}개 파일")
