// 전체 오류 코드 목록(error-codes-index.html)·전체 이벤트 코드 목록(event-codes-index.html) 화면 보강.
// 원본 HTML(h3 [+ p.muted] + ul.code-index-list > li > a — 제목)은 그대로 두고(운영 문서의 "ul에 한 줄 추가" 방식 유지),
// 로드 후 구역 카드·코드 칩 행·검색·필터로 바꿔 보여 준다. JS가 없어도 원래 목록이 그대로 보인다.
// 루트에 data-ci-chips="format"(오류 코드: 0x… / 코드 번호) 또는 "group"(이벤트: 원인 영역별)을 지정한다.
(() => {
  const root = document.querySelector('[data-ci-root]');
  if (!root || root.dataset.ciReady) return;
  root.dataset.ciReady = '1';
  const mode = root.getAttribute('data-ci-chips') === 'group' ? 'group' : 'format';

  const ICONS = [
    [/bsod|critical|auto-repair|no-display|black-screen|crash|bugcheck|whea|hardware/, 'bsod'],
    [/printer|print/, 'printer'],
    [/update|install|store|activation|app-|application/, 'update'],
    [/nvme|disk|storage|usb|ntfs|volume/, 'ssd'],
    [/game|display|gpu|graphics/, 'game'],
    [/power|sleep|boot|shutdown|reboot|taskbar|explorer|browser/, 'psu'],
    [/sound|audio|bluetooth|wifi|network|connection|dns|tcp/, 'event'],
    [/driver|device|pnp/, 'device']
  ];
  const iconFor = (id) => {
    const hit = ICONS.find(([re]) => re.test(id));
    return hit ? hit[1] : 'code';
  };
  const kindOf = (code) => (/^0x/i.test(code) ? 'hex' : 'text');

  const groups = [];
  Array.from(root.children).forEach((el) => {
    if (el.tagName !== 'H3') return;
    let next = el.nextElementSibling;
    let desc = null;
    if (next && next.matches('p.muted')) { desc = next; next = next.nextElementSibling; }
    if (next && next.matches('ul.code-index-list')) groups.push({ h3: el, desc, ul: next });
  });
  if (!groups.length) return;

  let total = 0;
  const cards = groups.map(({ h3, desc, ul }, index) => {
    const card = document.createElement('section');
    card.className = 'ci-card';
    const rows = Array.from(ul.children).filter((li) => li.tagName === 'LI').map((li) => {
      const a = li.querySelector(':scope > a');
      const m = a && li.textContent.match(/^\s*(.*?)\s+—\s+(.*)$/s);
      if (!a || !m) return { li, code: '', title: '', kind: 'text', el: li };
      const row = document.createElement('li');
      row.className = 'ci-row';
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      const code = document.createElement('span');
      code.className = 'ci-code';
      code.textContent = a.textContent.trim();
      const title = document.createElement('span');
      title.className = 'ci-title';
      title.textContent = m[2].trim();
      const go = document.createElement('span');
      go.className = 'ci-go';
      go.textContent = '→';
      go.setAttribute('aria-hidden', 'true');
      link.append(code, title, go);
      row.appendChild(link);
      return { li, code: code.textContent, title: title.textContent, kind: kindOf(code.textContent), el: row };
    });
    total += rows.filter((r) => r.code).length;
    const head = document.createElement('div');
    head.className = 'ci-card-head';
    const tile = document.createElement('span');
    tile.className = 'tile-icon';
    tile.innerHTML = `<img src="assets/icons/tools/${iconFor(h3.id)}.svg" alt="" width="40" height="40" loading="lazy">`;
    const meta = document.createElement('div');
    meta.className = 'ci-card-meta';
    const count = document.createElement('span');
    count.className = 'ci-card-count';
    h3.parentNode.insertBefore(card, h3);
    meta.append(h3, count);
    if (desc) { desc.classList.add('ci-card-desc'); meta.appendChild(desc); }
    head.append(tile, meta);
    ul.className = 'ci-list';
    rows.forEach((r) => { if (r.el !== r.li) r.li.replaceWith(r.el); });
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'ci-more-btn';
    more.hidden = true;
    more.setAttribute('aria-expanded', 'false');
    card.append(head, ul, more);
    const label = h3.firstChild && h3.firstChild.nodeType === 3 ? h3.firstChild.textContent.trim() : h3.textContent.trim();
    return { card, count, rows, name: label, index, more, expanded: false };
  });

  // 검색·필터 도구줄
  const chips = mode === 'group'
    ? [{ key: 'all', label: '전체' }].concat(cards.map((g) => ({ key: String(g.index), label: g.name })))
    : [{ key: 'all', label: '전체' }, { key: 'hex', label: '16진수 코드 (0x…)' }, { key: 'text', label: '코드 번호·증상명' }];
  const bar = document.createElement('div');
  bar.className = 'ci-toolbar';
  bar.innerHTML =
    '<label class="ci-search"><span class="sr-only">코드 검색</span><input type="search" id="ci-q" placeholder="' +
    (mode === 'group' ? '이벤트 ID, 원본(Source), 증상 검색 (예: 41, Kernel-Power, Disk)' : '코드, 이름, 증상 검색 (예: 0x80070005, 블루스크린)') +
    '" autocomplete="off"></label>' +
    `<div class="ci-chips" role="group" aria-label="${mode === 'group' ? '원인 영역' : '코드 형식'}"><span class="ci-chips-label">${mode === 'group' ? '영역' : '형식'}</span>` +
    chips.map((c, i) => `<button type="button" class="ci-chip${i === 0 ? ' is-active' : ''}" data-key="${c.key}" aria-pressed="${i === 0 ? 'true' : 'false'}">${c.label.replace(/[<>&]/g, '')}</button>`).join('') +
    '</div>' +
    `<p class="ci-summary" aria-live="polite">전체 <b>${total}</b>개 · 일치 <b id="ci-shown">${total}</b>건</p>`;
  const empty = document.createElement('div');
  empty.className = 'ci-empty';
  empty.hidden = true;
  empty.innerHTML = mode === 'group'
    ? '<p>찾는 이벤트가 없습니다. ID가 기억나지 않으면 이벤트 기록을 붙여넣어 해석해 보세요.</p><a href="event-log-analyzer.html">이벤트 로그 해석기로 이동 →</a>'
    : '<p>찾는 코드가 없습니다. 코드를 모르면 진단 도구로 증상부터 찾아 보세요.</p><a href="diagnostic.html">진단 도구로 이동 →</a>';
  const first = cards[0].card;
  // 검색·필터는 제목 띠(리드 문단) 바로 아래에 둔다. 리드가 없으면 첫 카드 앞.
  const lead = root.querySelector(':scope > p.lead');
  if (lead) lead.insertAdjacentElement('afterend', bar);
  else first.parentNode.insertBefore(bar, first);
  first.parentNode.appendChild(empty);

  let key = 'all';
  const LIMIT = 5; // 기본 노출 개수. 검색·필터 중에는 일치하는 항목을 모두 보여 준다.
  const apply = () => {
    const q = bar.querySelector('#ci-q').value.trim().toLowerCase();
    const capped = !q && key === 'all';
    let shown = 0;
    cards.forEach((g) => {
      const matched = g.rows.filter((r) => {
        if (!r.code) return false;
        const byKey = key === 'all' || (mode === 'group' ? String(g.index) === key : r.kind === key);
        const ok = byKey && (!q || `${r.code} ${r.title} ${g.name}`.toLowerCase().includes(q));
        r.el.hidden = true;
        return ok;
      });
      const limit = capped && !g.expanded ? LIMIT : matched.length;
      matched.forEach((r, i) => { r.el.hidden = i >= limit; });
      g.card.hidden = matched.length === 0;
      g.count.textContent = `${matched.length}개 코드`;
      const extra = matched.length - LIMIT;
      g.more.hidden = !(capped && extra > 0);
      g.more.textContent = g.expanded ? '접기' : `나머지 ${extra}개 더보기`;
      g.more.setAttribute('aria-expanded', g.expanded ? 'true' : 'false');
      shown += matched.length;
    });
    bar.querySelector('#ci-shown').textContent = String(shown);
    empty.hidden = shown !== 0;
  };
  cards.forEach((g) => g.more.addEventListener('click', () => { g.expanded = !g.expanded; apply(); if (!g.expanded) g.card.scrollIntoView({ block: 'nearest' }); }));
  bar.querySelector('#ci-q').addEventListener('input', apply);
  bar.querySelectorAll('.ci-chip').forEach((btn) => btn.addEventListener('click', () => {
    key = btn.dataset.key;
    bar.querySelectorAll('.ci-chip').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    apply();
  }));
  apply();
})();
