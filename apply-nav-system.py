#!/usr/bin/env python3
"""
Nav 시스템 개선: 글로벌 4항목 nav 교체 + 카테고리 브레드크럼 삽입
"""
import re
from pathlib import Path

ROOT = Path("/Users/itpanda/Documents/ITSVC/pc-check-tools")

# ── 새 글로벌 nav (4항목) ──────────────────────────────────────────
NAV = {
    'home':       '<nav class="nav" aria-label="주요 메뉴"><a href="index.html" aria-current="page">홈</a><a href="diagnostic.html">진단</a><a href="guides.html">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>',
    'diagnostic': '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html" aria-current="page">진단</a><a href="guides.html">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>',
    'guide':      '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html" aria-current="page">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>',
    'pc-rec':     '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html">가이드</a><a href="pc-recommendation.html" aria-current="page">PC 추천</a></nav>',
    None:         '<nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>',
}

# 기존 nav 패턴 (모든 형식 매칭)
OLD_NAV = re.compile(r'<nav class="nav" aria-label="주요 메뉴">.*?</nav>', re.DOTALL)

# ── 브레드크럼 생성 ───────────────────────────────────────────────
def breadcrumb_html(crumbs, page_title):
    parts = []
    for href, label in crumbs:
        parts.append(f'<a href="{href}">{label}</a><span class="bc-sep" aria-hidden="true">/</span>')
    parts.append(f'<span aria-current="page">{page_title}</span>')
    inner = ''.join(parts)
    return f'<nav class="breadcrumb" aria-label="현재 위치"><div class="breadcrumb-inner">{inner}</div></nav>'

# ── 페이지 분류 ──────────────────────────────────────────────────
# 허브/상위 페이지 (브레드크럼 없음)
HUB_PAGES = {
    'index.html': 'home',
    'diagnostic.html': 'diagnostic',
    'pc-recommendation.html': 'pc-rec',
    'upgrade-diagnostic.html': 'pc-rec',
    'upgrade.html': 'pc-rec',
    'upgrade-compatibility-test.html': 'pc-rec',
    'guides.html': 'guide',
    'beginner-guide.html': 'guide',
    'games-diagnostic.html': 'guide',
    'common-error-codes.html': 'guide',
    'device-manager-codes.html': 'guide',
    'error-codes-index.html': 'guide',
    'tools.html': 'guide',
    'event-viewer-guide.html': 'guide',
    'windows-update-tracker.html': 'guide',
    'community-cases.html': 'guide',
}

# 없음 current (정보·관리 페이지)
NO_CURRENT = {
    'about.html', 'privacy.html', 'terms.html', 'contact.html',
    'editorial-policy.html', '404.html', 'news.html', 'sitemap.html',
    'community-cases-admin.html',
}

# 계산기·도구 페이지
UTIL_PAGES = {
    'psu-calculator.html', 'raid-calculator.html', 'backup-storage-calculator.html',
    'ssd-tbw-calculator.html', 'ups-calculator.html', 'monitor-calculator.html',
    'ram-upgrade-checker.html',
}

# 특수 분류: 특정 파일명을 명시적으로 지정
EXPLICIT = {
    'windows-bsod-critical-process.html': (
        'guide', [('index.html', '홈'), ('guides.html', '가이드'), ('common-error-codes.html', 'BSOD 오류코드')]
    ),
    'security-access-errors.html': (
        'guide', [('index.html', '홈'), ('guides.html', '가이드')]
    ),
}

# 가이드 아티클 (*-guide.html 형태 파일)
GUIDE_ARTICLES = {
    'graphics-driver-guide.html', 'memory-test-guide.html', 'network-connection-guide.html',
    'ssd-upgrade-guide.html', 'gpu-upgrade-guide.html', 'laptop-upgrade-guide.html',
    'bios-boot-guide.html', 'ssd-smart-health-guide.html', 'windows-repair-tools-guide.html',
}

def classify(filename):
    """(nav_current, crumbs_or_None) 반환"""
    f = filename.lower()

    if f in HUB_PAGES:
        return HUB_PAGES[f], None

    if f in NO_CURRENT or f in UTIL_PAGES:
        return None, None

    if f in EXPLICIT:
        return EXPLICIT[f]

    if f in GUIDE_ARTICLES:
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드')]

    # 장치 관리자 코드 (error-code-device-manager-code-* 가 먼저여야 함)
    if f.startswith('error-code-device-manager-code-'):
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드'), ('device-manager-codes.html', '장치관리자 코드')]

    if f.startswith('error-code-'):
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드'), ('common-error-codes.html', 'BSOD 오류코드')]

    if f.startswith('event-'):
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드'), ('event-viewer-guide.html', '이벤트 뷰어')]

    if f.startswith('hardware-'):
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드')]

    if f.startswith('windows-'):
        return 'guide', [('index.html', '홈'), ('guides.html', '가이드')]

    if f.startswith('game-'):
        return 'guide', [('index.html', '홈'), ('games-diagnostic.html', '게임 오류')]

    # 분류 안 된 나머지 (기본: guide, 브레드크럼 없음)
    return 'guide', None

# ── 메인 처리 ────────────────────────────────────────────────────
nav_updated = bc_added = skipped = errors = 0

for f in sorted(ROOT.glob("*.html")):
    try:
        content = f.read_text(encoding='utf-8', errors='ignore')
        changed = False

        nav_current, crumbs = classify(f.name)

        # 1. nav 교체
        if OLD_NAV.search(content):
            new_nav = NAV[nav_current]
            content = OLD_NAV.sub(new_nav, content, count=1)
            nav_updated += 1
            changed = True
        else:
            skipped += 1

        # 2. 브레드크럼 삽입 (크럼이 있고, 아직 없는 경우만)
        if crumbs and 'class="breadcrumb"' not in content:
            # 브랜드 div에서 h1 추출
            h1m = re.search(r'<div class="brand">.*?<h1>(.*?)</h1>', content, re.DOTALL)
            page_title = h1m.group(1).strip() if h1m else f.stem.replace('-', ' ')

            bc = breadcrumb_html(crumbs, page_title)
            content = content.replace('</header>', f'</header>\n{bc}', 1)
            bc_added += 1
            changed = True

        if changed:
            f.write_text(content, encoding='utf-8')

    except Exception as e:
        errors += 1
        print(f"  ✗ {f.name}: {e}")

print(f"nav 교체: {nav_updated}개")
print(f"브레드크럼 삽입: {bc_added}개")
print(f"nav 없음(건너뜀): {skipped}개")
print(f"오류: {errors}개")
