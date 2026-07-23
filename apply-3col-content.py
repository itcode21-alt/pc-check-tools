#!/usr/bin/env python3
"""
hardware-*, windows-*, game-*, 가이드 아티클에 3-column 레이아웃 적용
"""
import re
from pathlib import Path

ROOT = Path("/Users/itpanda/Documents/ITSVC/pc-check-tools")

TOC_HTML = """\
    <!-- 좌측 고정 목차 -->
    <div class="toc" id="page-toc">
      <h4>📑 목차</h4>
      <ul id="toc-list"><!-- ui-init.js가 동적으로 채움 --></ul>
      <div class="toc-progress">
        <div class="toc-progress-bar">
          <div class="toc-progress-fill"></div>
        </div>
      </div>
    </div>"""

SIDEBAR_HW = """\
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 관련 하드웨어 문제</h4>
      <ul>
        <li><a href="hardware-gpu-not-detected.html">GPU 미인식</a></li>
        <li><a href="hardware-usb-not-detected.html">USB 장치 미인식</a></li>
        <li><a href="hardware-screen-flicker.html">화면 깜빡임</a></li>
        <li><a href="hardware-no-display.html">화면 안 나옴</a></li>
        <li><a href="hardware-overheat-shutdown.html">발열 자동 종료</a></li>
        <li><a href="hardware-no-power.html">전원 켜지지 않음</a></li>
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
        <li><a href="event-viewer-guide.html">이벤트 뷰어</a></li>
      </ul>
    </div>"""

SIDEBAR_WIN = """\
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 관련 Windows 문제</h4>
      <ul>
        <li><a href="windows-startup-slow.html">부팅 속도 저하</a></li>
        <li><a href="windows-auto-repair-loop.html">자동 복구 루프</a></li>
        <li><a href="windows-bsod-critical-process.html">BSOD 분석</a></li>
        <li><a href="windows-update-fail-loop.html">업데이트 오류</a></li>
        <li><a href="windows-explorer-freeze.html">탐색기 멈춤</a></li>
      </ul>
      <h4>⚠️ 관련 오류코드</h4>
      <ul>
        <li><a href="common-error-codes.html">BSOD 오류코드 목록</a></li>
        <li><a href="error-code-0x000000ef.html">0x000000EF</a></li>
        <li><a href="error-code-0xc000021a.html">0xC000021A</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="windows-repair-tools-guide.html">복구 도구 가이드</a></li>
      </ul>
    </div>"""

SIDEBAR_GAME = """\
    <div class="sidebar" id="page-sidebar">
      <h4>🎮 다른 게임 오류</h4>
      <ul>
        <li><a href="game-lol.html">리그 오브 레전드</a></li>
        <li><a href="game-valorant.html">발로란트</a></li>
        <li><a href="game-battlegrounds.html">배틀그라운드</a></li>
        <li><a href="game-overwatch2.html">오버워치 2</a></li>
        <li><a href="game-lostark.html">로스트아크</a></li>
        <li><a href="game-maplestory.html">메이플스토리</a></li>
      </ul>
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="graphics-driver-guide.html">그래픽 드라이버 설치</a></li>
        <li><a href="hardware-gaming-reboot.html">게임 중 재부팅</a></li>
        <li><a href="windows-game-launch-error.html">게임 실행 오류</a></li>
        <li><a href="windows-game-connection-error.html">게임 연결 오류</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="psu-calculator.html">파워 용량 계산기</a></li>
      </ul>
    </div>"""

SIDEBAR_GUIDE = """\
    <div class="sidebar" id="page-sidebar">
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="graphics-driver-guide.html">그래픽 드라이버 설치</a></li>
        <li><a href="memory-test-guide.html">메모리 검사 가이드</a></li>
        <li><a href="windows-repair-tools-guide.html">Windows 복구 도구</a></li>
        <li><a href="ssd-upgrade-guide.html">SSD 업그레이드</a></li>
        <li><a href="network-connection-guide.html">네트워크 연결 가이드</a></li>
      </ul>
      <h4>⚠️ 관련 오류코드</h4>
      <ul>
        <li><a href="common-error-codes.html">BSOD 오류코드 목록</a></li>
        <li><a href="device-manager-codes.html">장치관리자 코드</a></li>
      </ul>
      <h4>🛠️ 진단 도구</h4>
      <ul>
        <li><a href="diagnostic.html">PC 진단</a></li>
        <li><a href="event-viewer-guide.html">이벤트 뷰어</a></li>
      </ul>
    </div>"""

# 처리 대상
SKIP = {'windows-update-tracker.html'}

GUIDE_ARTICLES = {
    'graphics-driver-guide.html', 'memory-test-guide.html', 'network-connection-guide.html',
    'ssd-upgrade-guide.html', 'gpu-upgrade-guide.html', 'laptop-upgrade-guide.html',
    'bios-boot-guide.html', 'ssd-smart-health-guide.html', 'windows-repair-tools-guide.html',
}

def sidebar_for(filename):
    f = filename.lower()
    if f.startswith('hardware-'):
        return SIDEBAR_HW
    elif f.startswith('windows-'):
        return SIDEBAR_WIN
    elif f.startswith('game-'):
        return SIDEBAR_GAME
    return SIDEBAR_GUIDE

def process(path):
    content = path.read_text(encoding='utf-8', errors='ignore')

    if 'article-cols' in content:
        return False, 'already done'

    # 1. main 클래스 추가
    if '<main id="content" class="page article">' not in content:
        return False, 'main pattern not found'

    content = content.replace(
        '<main id="content" class="page article">',
        '<main id="content" class="page article article-cols">\n' + TOC_HTML,
        1
    )

    # 2. 사이드바 삽입 — 닫는 패턴 탐지
    sidebar = sidebar_for(path.name)

    if '</section>\n  </main>' in content:
        content = content.replace(
            '</section>\n  </main>',
            '</section>\n' + sidebar + '\n  </main>',
            1
        )
    elif '</article>\n  </main>' in content:
        content = content.replace(
            '</article>\n  </main>',
            '</article>\n' + sidebar + '\n  </main>',
            1
        )
    elif '</article></section></main>' in content:
        content = content.replace(
            '</article></section></main>',
            '</article></section>\n' + sidebar + '\n  </main>',
            1
        )
    elif '</article></main>' in content:
        content = content.replace(
            '</article></main>',
            '</article>\n' + sidebar + '\n  </main>',
            1
        )
    else:
        return False, 'close pattern not found'

    # 3. game 페이지 "바로 이동" 섹션 제거 (TOC로 대체)
    if path.name.startswith('game-'):
        content = re.sub(
            r'<h3>바로 이동</h3>\s*<ul class="mini-list">.*?</ul>\s*',
            '',
            content,
            count=1,
            flags=re.DOTALL
        )

    # 4. ui-init.js 추가 (없을 경우)
    if 'ui-init.js' not in content:
        for anchor in ['<script defer src="search-index.js">', '<script defer src="site.js', '<script defer src="app.js']:
            if anchor in content:
                insert_after = content.index(anchor) + len(anchor)
                end = content.index('>', insert_after) + 1
                tag = content[content.index(anchor):end]
                content = content.replace(
                    tag,
                    tag + '\n  <script defer src="ui-init.js"></script>',
                    1
                )
                break

    path.write_text(content, encoding='utf-8')
    return True, 'ok'


done = skip = err = 0

targets = (
    list(ROOT.glob('hardware-*.html')) +
    [f for f in ROOT.glob('windows-*.html') if f.name not in SKIP] +
    list(ROOT.glob('game-*.html')) +
    [ROOT / fn for fn in GUIDE_ARTICLES]
)

for path in sorted(set(targets)):
    try:
        ok, msg = process(path)
        if ok:
            done += 1
            print(f'  ✓ {path.name}')
        else:
            skip += 1
            print(f'  - {path.name}: {msg}')
    except Exception as e:
        err += 1
        print(f'  ✗ {path.name}: {e}')

print(f'\n완료: {done} / 건너뜀: {skip} / 오류: {err}')
