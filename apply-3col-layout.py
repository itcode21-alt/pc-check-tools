#!/usr/bin/env python3
"""
3-column layout (TOC + content + sidebar) 을 모든 error-code-*.html 에 일괄 적용
- main 클래스에 article-cols 추가
- CSS 버전을 layout-20260723b 로 통일
- h3에 anchor id 삽입 (TOC 링크 대상)
- section 바깥(main 직속 자식)에 .toc / .sidebar 삽입
- ui-init.js 스크립트 추가 (없는 경우)
"""

import re
import sys
from pathlib import Path

WORK_DIR = Path("/Users/itpanda/Documents/ITSVC/pc-check-tools")
SKIP = {"error-code-0x0000008e.html"}  # 이미 처리됨

TOC_HTML = """\
    <!-- 좌측 고정 목차 (section 밖에 배치 — app.js innerHTML 덮어쓰기 영향 없음) -->
    <div class="toc" id="page-toc">
      <h4>📑 목차</h4>
      <ul>
        <li><a href="#interpretation">코드 해석</a></li>
        <li><a href="#causes">가능한 원인</a></li>
        <li><a href="#solutions">해결 방법</a></li>
        <li><a href="#related">관련 코드</a></li>
        <li><a href="#faq">자주 묻는 질문</a></li>
      </ul>
      <div class="toc-progress">
        <div class="toc-progress-bar">
          <div class="toc-progress-fill"></div>
        </div>
      </div>
    </div>

"""

SIDEBAR_BSOD = """\

    <!-- 우측 사이드바 (section 밖에 배치 — app.js innerHTML 덮어쓰기 영향 없음) -->
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

SIDEBAR_DM = """\

    <!-- 우측 사이드바 (section 밖에 배치 — app.js innerHTML 덮어쓰기 영향 없음) -->
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 비슷한 장치 코드</h4>
      <ul>
        <li><a href="error-code-device-manager-code-1.html">코드 1</a></li>
        <li><a href="error-code-device-manager-code-10.html">코드 10</a></li>
        <li><a href="error-code-device-manager-code-39.html">코드 39</a></li>
        <li><a href="error-code-device-manager-code-43.html">코드 43</a></li>
        <li><a href="error-code-device-manager-code-45.html">코드 45</a></li>
      </ul>
      <h4>⚠️ 관련 블루스크린</h4>
      <ul>
        <li><a href="error-code-0x0000007e.html">0x0000007E</a></li>
        <li><a href="error-code-0x0000008e.html">0x0000008E</a></li>
        <li><a href="error-code-0x000000ef.html">0x000000EF</a></li>
      </ul>
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="graphics-driver-guide.html">그래픽 드라이버 설치</a></li>
        <li><a href="windows-repair-tools-guide.html">Windows 복구 도구</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="event-kernel-power-41.html">이벤트 뷰어</a></li>
      </ul>
    </div>"""


def add_h3_ids(content):
    content = re.sub(
        r'<h3>([^<]*(?:해석|어떻게)[^<]*)</h3>',
        r'<h3 id="interpretation">\1</h3>',
        content, count=1
    )
    content = re.sub(
        r'<h3>([^<]*(?:원인|가능성)[^<]*)</h3>',
        r'<h3 id="causes">\1</h3>',
        content, count=1
    )
    content = re.sub(
        r'<h3>([^<]*(?:점검 항목|해결 방법)[^<]*)</h3>',
        r'<h3 id="solutions">\1</h3>',
        content, count=1
    )
    content = re.sub(
        r'<h3>([^<]*(?:연결된|다른 오류)[^<]*)</h3>',
        r'<h3 id="related">\1</h3>',
        content, count=1
    )
    content = re.sub(
        r'<h3>([^<]*자주 묻는[^<]*)</h3>',
        r'<h3 id="faq">\1</h3>',
        content, count=1
    )
    return content


def process_file(path):
    content = path.read_text(encoding='utf-8')

    if 'article-cols' in content:
        return False, "already done"

    is_dm = 'device-manager' in path.name

    # 1. CSS 버전 통일
    content = re.sub(r'style\.css\?v=[^"]+', 'style.css?v=layout-20260723b', content)

    # 2. main 클래스 수정
    content = content.replace(
        'class="page article"',
        'class="page article article-cols"',
    )
    if 'article-cols' not in content:
        return False, "main class replacement failed"

    # 3. h3 anchor id 삽입
    content = add_h3_ids(content)

    # 4. TOC 삽입 (section 직전)
    m = re.search(r'    <section class="section" data-error-code-page="', content)
    if not m:
        return False, "section tag not found"
    insert_pos = m.start()
    content = content[:insert_pos] + TOC_HTML + content[insert_pos:]

    # 5. 사이드바 삽입 (</main> 직전 — 처음 하나만)
    sidebar = SIDEBAR_DM if is_dm else SIDEBAR_BSOD
    main_close = content.find('  </main>')
    if main_close == -1:
        return False, "</main> not found"
    content = content[:main_close] + sidebar + '\n  </main>' + content[main_close + len('  </main>'):]

    # 6. ui-init.js 없으면 추가 (search-index.js 다음에)
    if 'ui-init.js' not in content:
        content = content.replace(
            '  <script defer src="search-index.js"></script>',
            '  <script defer src="search-index.js"></script>\n  <script defer src="ui-init.js"></script>',
            1
        )

    path.write_text(content, encoding='utf-8')
    return True, "ok"


files = sorted(WORK_DIR.glob("error-code-*.html"))
files = [f for f in files if f.name not in SKIP]

print(f"처리 대상: {len(files)}개 파일")

done = skip = err = 0
for f in files:
    try:
        ok, msg = process_file(f)
        if ok:
            done += 1
            if '--verbose' in sys.argv:
                print(f"  ✓ {f.name}")
        else:
            skip += 1
            print(f"  - {f.name}: {msg}")
    except Exception as e:
        err += 1
        print(f"  ✗ {f.name}: {e}")

print(f"\n결과: 성공 {done} / 건너뜀 {skip} / 오류 {err}")
