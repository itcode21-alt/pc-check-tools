#!/usr/bin/env python3
"""
3-column layout 보완 스크립트
1. 압축(minified) error-code-*.html 8개 처리
2. event-*.html 30개 처리
"""

import re
from pathlib import Path

WORK_DIR = Path("/Users/itpanda/Documents/ITSVC/pc-check-tools")

TOC_HTML = """\
    <!-- 좌측 고정 목차 (section 밖에 배치) -->
    <div class="toc" id="page-toc">
      <h4>📑 목차</h4>
      <ul id="toc-list"><!-- ui-init.js가 동적으로 채움 --></ul>
      <div class="toc-progress">
        <div class="toc-progress-bar">
          <div class="toc-progress-fill"></div>
        </div>
      </div>
    </div>
"""

SIDEBAR_BSOD = """\
    <!-- 우측 사이드바 -->
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 비슷한 오류</h4>
      <ul>
        <li><a href="error-code-0x0000008e.html">0x0000008E</a></li>
        <li><a href="error-code-0x0000007e.html">0x0000007E</a></li>
        <li><a href="error-code-0x0000003b.html">0x0000003B</a></li>
        <li><a href="error-code-0x000000ef.html">0x000000EF</a></li>
        <li><a href="error-code-0x0000007f.html">0x0000007F</a></li>
      </ul>
      <h4>⚠️ 관련 장치 코드</h4>
      <ul>
        <li><a href="error-code-device-manager-code-43.html">코드 43</a></li>
        <li><a href="error-code-device-manager-code-1.html">코드 1</a></li>
        <li><a href="error-code-device-manager-code-10.html">코드 10</a></li>
        <li><a href="error-code-device-manager-code-39.html">코드 39</a></li>
      </ul>
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="graphics-driver-guide.html">그래픽 드라이버 설치</a></li>
        <li><a href="memory-test-guide.html">메모리 검사 가이드</a></li>
        <li><a href="windows-repair-tools-guide.html">Windows 복구 도구</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="event-kernel-power-41.html">이벤트 뷰어</a></li>
        <li><a href="windows-bsod-critical-process.html">BSOD 분석</a></li>
      </ul>
    </div>"""

SIDEBAR_EVENT = """\
    <!-- 우측 사이드바 -->
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 관련 이벤트</h4>
      <ul>
        <li><a href="event-kernel-power-41.html">Kernel-Power 41</a></li>
        <li><a href="event-whea-logger-18.html">WHEA-Logger 18</a></li>
        <li><a href="event-disk-7.html">Disk 이벤트 7</a></li>
        <li><a href="event-service-7001.html">서비스 7001</a></li>
        <li><a href="event-application-error-1000.html">응용 프로그램 오류 1000</a></li>
      </ul>
      <h4>⚠️ 관련 블루스크린</h4>
      <ul>
        <li><a href="error-code-0x0000008e.html">0x0000008E</a></li>
        <li><a href="error-code-0x0000007e.html">0x0000007E</a></li>
        <li><a href="error-code-0x000000ef.html">0x000000EF</a></li>
      </ul>
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="event-viewer-guide.html">이벤트 뷰어 가이드</a></li>
        <li><a href="windows-repair-tools-guide.html">Windows 복구 도구</a></li>
        <li><a href="memory-test-guide.html">메모리 검사 가이드</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="windows-bsod-critical-process.html">BSOD 분석</a></li>
      </ul>
    </div>"""


def add_ui_init(content):
    if 'ui-init.js' in content:
        return content
    return content.replace(
        '<script defer src="search-index.js"></script>',
        '<script defer src="search-index.js"></script>\n  <script defer src="ui-init.js"></script>',
        1
    )


def update_css(content):
    return re.sub(r'style\.css\?v=[^"]+', 'style.css?v=layout-20260723b', content)


# ──────────────────────────────────────────────────────────
# 유형 A: 압축 error-code 파일 (main><section 같은 줄)
# ──────────────────────────────────────────────────────────
def process_minified_error_code(path):
    content = path.read_text(encoding='utf-8')
    if 'article-cols' in content:
        return False, "already done"

    content = update_css(content)

    # main + section 동시 치환: <main ...><section ...> 형태
    # 원본 패턴: <main id="content" class="page article"><section class="section" data-error-code-page="...">
    pattern = r'(<main id="content") class="page article">(<section class="section" data-error-code-page="[^"]*">)'
    replacement = r'\1 class="page article article-cols">\n' + TOC_HTML + r'\n    \2\n'
    new_content = re.sub(pattern, replacement, content, count=1)
    if 'article-cols' not in new_content:
        return False, "main pattern not matched"

    # </section></main> 형태의 닫는 태그 처리
    new_content = new_content.replace(
        '</section></main>',
        '</section>\n' + SIDEBAR_BSOD + '\n  </main>',
        1
    )

    new_content = add_ui_init(new_content)
    path.write_text(new_content, encoding='utf-8')
    return True, "ok"


# ──────────────────────────────────────────────────────────
# 유형 B: event-*.html (main><article 같은 줄)
# ──────────────────────────────────────────────────────────
def process_event_page(path):
    content = path.read_text(encoding='utf-8')
    if 'article-cols' in content:
        return False, "already done"

    content = update_css(content)

    # 패턴 1: 같은 줄 <main ...><article class="section">
    p1 = r'(<main id="content") class="page article">(<article class="section">)'
    r1 = r'\1 class="page article article-cols">\n' + TOC_HTML + r'\n    \2'
    new_content = re.sub(p1, r1, content, count=1)

    # 패턴 2: 별도 줄 구조
    if 'article-cols' not in new_content:
        new_content = new_content.replace(
            '  <main id="content" class="page article">',
            '  <main id="content" class="page article article-cols">',
            1
        )
        # TOC를 <article class="section"> 앞에 삽입
        new_content = new_content.replace(
            '    <article class="section">',
            TOC_HTML + '    <article class="section">',
            1
        )

    if 'article-cols' not in new_content:
        return False, "event main pattern not matched"

    # 닫는 태그 처리 — 압축 형태
    new_content = new_content.replace(
        '</article></main>',
        '</article>\n' + SIDEBAR_EVENT + '\n  </main>',
        1
    )
    # 일반 형태 (들여쓰기 2칸 </main>)
    new_content = new_content.replace(
        '    </article>\n  </main>',
        '    </article>\n' + SIDEBAR_EVENT + '\n  </main>',
        1
    )

    new_content = add_ui_init(new_content)
    path.write_text(new_content, encoding='utf-8')
    return True, "ok"


done = skip = err = 0

# 1. 누락된 error-code 8개
missing_ec = [f for f in WORK_DIR.glob("error-code-*.html") if 'article-cols' not in f.read_text(encoding='utf-8')]
print(f"누락 error-code 파일: {len(missing_ec)}개")
for f in missing_ec:
    try:
        ok, msg = process_minified_error_code(f)
        if ok:
            done += 1; print(f"  ✓ {f.name}")
        else:
            skip += 1; print(f"  - {f.name}: {msg}")
    except Exception as e:
        err += 1; print(f"  ✗ {f.name}: {e}")

# 2. event-*.html 30개
event_files = sorted(WORK_DIR.glob("event-*.html"))
print(f"\nevent-*.html 파일: {len(event_files)}개")
for f in event_files:
    try:
        ok, msg = process_event_page(f)
        if ok:
            done += 1; print(f"  ✓ {f.name}")
        else:
            skip += 1; print(f"  - {f.name}: {msg}")
    except Exception as e:
        err += 1; print(f"  ✗ {f.name}: {e}")

print(f"\n결과: 성공 {done} / 건너뜀 {skip} / 오류 {err}")
