#!/usr/bin/env python3
"""
디자인 시스템을 모든 error-code-* 페이지에 적용
"""

import os
import re
from pathlib import Path

# 현재 디렉토리의 error-code-*.html 파일 찾기
files_to_process = list(Path(".").glob("error-code-*.html"))

# 이미 처리한 파일 제외
processed = ["error-code-0x0000008e.html"]
files_to_process = [f for f in files_to_process if f.name not in processed]

print(f"처리할 파일: {len(files_to_process)}개")

for file_path in files_to_process[:10]:  # 처음 10개만 처리
    print(f"\n📝 {file_path.name} 처리 중...")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 이미 변환되었는지 확인
    if 'article-layout' in content or 'content-with-sidebar' in content:
        print(f"  ✓ 이미 변환됨")
        continue

    # main 섹션 시작 찾기
    main_pattern = r'(<main id="content" class="page article">\s*<section class="section"[^>]*>\s*)<article class="static-detail-fallback">'

    # 목차 HTML
    toc_html = '''<div class="article-layout">
        <aside class="table-of-contents">
          <h4>📑 목차</h4>
          <ul>
            <li><a href="#interpretation">개요</a></li>
            <li><a href="#causes">원인</a></li>
            <li><a href="#solutions">해결 방법</a></li>
            <li><a href="#related">관련 정보</a></li>
            <li><a href="#faq">자주 묻는 질문</a></li>
          </ul>
          <div class="toc-progress">
            <div class="toc-progress-bar">
              <div class="toc-progress-fill"></div>
            </div>
          </div>
        </aside>

        <div class="content-with-sidebar">
          <article class="static-detail-fallback">'''

    # 첫 번째 h3를 id="interpretation"으로 변경
    content = re.sub(
        r'<h3>([^<]*(?:개요|해석|어떻게)[^<]*)</h3>',
        r'<h3 id="interpretation">\1</h3>',
        content,
        count=1
    )

    # 두 번째 h3 (원인)를 id="causes"로 변경
    content = re.sub(
        r'<h3>([^<]*(?:원인|가능성)[^<]*)</h3>',
        r'<h3 id="causes">\1</h3>',
        content,
        count=1
    )

    # 세 번째 h3 (해결)를 id="solutions"로 변경
    content = re.sub(
        r'<h3>([^<]*(?:점검|해결|첫[^<]*)[^<]*)</h3>',
        r'<h3 id="solutions">\1</h3>',
        content,
        count=1
    )

    # main 섹션 수정
    content = re.sub(
        main_pattern,
        r'\1' + toc_html,
        content
    )

    # article 종료 찾아서 사이드바 추가
    article_end = r'(<p class="muted">최종 검토일:[^<]*</p>)\s*</article>\s*</section>\s*</main>'

    sidebar_html = '''\\1
          </article>

          <aside class="article-sidebar">
            <h4>🔗 비슷한 오류</h4>
            <ul>
              <li><a href="error-code-0x0000008e.html">0x0000008E</a></li>
              <li><a href="error-code-0x0000007e.html">0x0000007E</a></li>
              <li><a href="error-code-0x0000003b.html">0x0000003B</a></li>
              <li><a href="error-code-0x000000ef.html">0x000000EF</a></li>
            </ul>

            <h4>⚠️ 관련 장치 코드</h4>
            <ul>
              <li><a href="error-code-device-manager-code-1.html">코드 1</a></li>
              <li><a href="error-code-device-manager-code-10.html">코드 10</a></li>
              <li><a href="error-code-device-manager-code-43.html">코드 43</a></li>
            </ul>

            <h4>📅 최근 업데이트</h4>
            <ul>
              <li><a href="diagnostic.html">PC 진단 도구</a></li>
              <li><a href="guides.html">전체 가이드</a></li>
              <li><a href="windows-repair-tools-guide.html">복구 도구</a></li>
            </ul>

            <h4>🛠️ 진단 도구</h4>
            <ul>
              <li><a href="tools.html">도구 모음</a></li>
              <li><a href="event-viewer-guide.html">이벤트 뷰어</a></li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  </main>'''

    content = re.sub(
        article_end,
        sidebar_html,
        content
    )

    # 파일 저장
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"  ✓ 완료")

print("\n✅ 처리 완료!")
