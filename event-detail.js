// 이벤트 상세 페이지(event-*.html) 화면 보강(시안 CodeDetailV2 방식).
// 본문 HTML(eyebrow·h2·lead, h3 구역과 목록)은 그대로 두고, 로드 후 구역을 카드로 나누고
// 원인은 아이콘 카드, 점검 순서는 단계 아코디언, FAQ는 접이식으로 바꿔 보여 준다.
// 문장은 새로 만들지 않고 기존 문장을 그대로 옮긴다. JS가 없으면 원래 본문이 그대로 보인다.
(() => {
  const art = document.querySelector('main.page article.section');
  if (!art || art.dataset.evReady) return;
  const kids = Array.from(art.children);
  if (!kids.some((el) => el.tagName === 'H3')) return;
  art.dataset.evReady = '1';
  art.classList.add('ev-enhanced');

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const lis = (list) => Array.from(list.children).filter((li) => li.tagName === 'LI');

  // h3 단위 블록으로 나눈다.
  const blocks = [];
  let cur = null;
  kids.forEach((el) => {
    if (el.tagName === 'H3') { cur = { h3: el, nodes: [] }; blocks.push(cur); } else if (cur) { cur.nodes.push(el); }
  });
  // 마지막 블록 뒤에 붙은 문단(영문판 링크·검토일·진단 도구 링크)은 카드 밖으로 뺀다.
  const footer = [];
  const lastNodes = blocks[blocks.length - 1].nodes;
  while (lastNodes.length && lastNodes[lastNodes.length - 1].tagName === 'P') footer.unshift(lastNodes.pop());

  const stats = { cond: 0, cause: 0, steps: 0 };
  let firstSection = null;
  blocks.forEach(({ h3, nodes }) => {
    const title = h3.textContent.trim();
    const section = document.createElement('section');
    section.className = 'ev-section';
    h3.parentNode.insertBefore(section, h3);
    section.appendChild(h3);
    nodes.forEach((n) => section.appendChild(n));
    if (!firstSection) firstSection = section;

    if (title === '발생 조건') {
      section.id = 'ev-conditions';
      const ul = section.querySelector(':scope > ul');
      if (ul) {
        ul.className = 'ev-chips';
        stats.cond = lis(ul).length;
      }
    } else if (title === '가능성 높은 원인') {
      section.id = 'ev-causes';
      const ul = section.querySelector(':scope > ul');
      if (ul) {
        ul.className = 'cause-cards';
        lis(ul).forEach((li) => {
          li.innerHTML = '<span class="tile-icon"><img src="assets/icons/tools/event.svg" alt="" width="40" height="40" loading="lazy"></span><span>' + li.innerHTML + '</span>';
        });
        stats.cause = lis(ul).length;
      }
    } else if (title === '점검 순서' || title === '안전한 점검 순서') {
      section.id = 'ev-steps';
      const ol = section.querySelector(':scope > ol');
      if (ol) {
        const items = lis(ol);
        stats.steps = items.length;
        const wrap = document.createElement('div');
        wrap.className = 'check-steps';
        items.forEach((li, i) => {
          const strong = li.querySelector(':scope > strong');
          const html = li.innerHTML;
          const m = strong && html.match(/^\s*<strong>([\s\S]*?)<\/strong>\s*(?:—|–|-)\s*([\s\S]*)$/);
          if (!m || !m[2].trim()) {
            const row = document.createElement('div');
            row.className = 'check-step check-step--plain';
            row.innerHTML = '<span class="check-step-num">' + (i + 1) + '</span><div class="check-step-main"><span>' + html + '</span></div>';
            wrap.appendChild(row);
            return;
          }
          const det = document.createElement('details');
          det.className = 'check-step';
          if (i === 0) det.open = true;
          det.innerHTML = '<summary><span class="check-step-num">' + (i + 1) + '</span><b>' + m[1] + '</b></summary><div class="check-step-body"><p>' + m[2] + '</p></div>';
          wrap.appendChild(det);
        });
        const hint = document.createElement('p');
        hint.className = 'muted check-steps-hint';
        hint.textContent = '단계를 눌러 자세한 내용을 확인하세요.';
        ol.replaceWith(hint, wrap);
      }
    } else if (title === '자주 묻는 질문') {
      section.id = 'ev-faq';
      const ul = section.querySelector(':scope > ul');
      if (ul) {
        const grid = document.createElement('div');
        grid.className = 'faq-grid';
        lis(ul).forEach((li) => {
          const strong = li.querySelector(':scope > strong');
          if (!strong) { grid.appendChild(li.cloneNode(true)); return; }
          const q = strong.innerHTML;
          strong.remove();
          const det = document.createElement('details');
          det.className = 'faq-item';
          det.innerHTML = '<summary>' + q + '</summary><p>' + li.innerHTML.trim() + '</p>';
          grid.appendChild(det);
        });
        ul.replaceWith(grid);
      }
    }
  });
  footer.forEach((p) => art.appendChild(p));

  // 한눈에 보기: 화면에 이미 있는 항목 수만 요약한다.
  const cards = [];
  if (stats.cause) cards.push(['가능한 원인', stats.cause, '가지', '#ev-causes', '원인 보기 →']);
  if (stats.steps) cards.push(['점검 단계', stats.steps, '단계', '#ev-steps', '점검 순서 보기 →']);
  if (stats.cond) cards.push(['나타나는 조건', stats.cond, '가지', '#ev-conditions', '조건 보기 →']);
  if (cards.length >= 2 && firstSection) {
    const glance = document.createElement('section');
    glance.className = 'code-glance';
    glance.setAttribute('aria-label', '한눈에 보기');
    glance.innerHTML = cards.map(([label, n, unit, href, link]) =>
      '<div class="code-glance-item"><span class="code-glance-label">' + esc(label) + '</span><b><em>' + n + '</em>' + esc(unit) + '</b><a href="' + href + '">' + esc(link) + '</a></div>').join('');
    firstSection.parentNode.insertBefore(glance, firstSection);
  }
})();
