// 영문 홈(en/index.html) 화면 보강(시안 EnHome): 검색, 증상으로 시작, 영역 카드(ID·원본·제목·우선순위), 더보기.
// 원본 HTML(h3 + p.muted + div.link-list)은 그대로 두고 로드 후 카드로 바꾼다. JS가 없으면 원래 목록이 보인다.
// 우선순위 라벨은 한국어판 사이트 데이터(urgency)의 4개 라벨을 그대로 번역한 것이다.
(() => {
  const root = document.querySelector('[data-en-home]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';

  const PRIO = {
    backup: { label: 'Back up first', cls: 'backup', order: 1 },
    'repeat-check': { label: 'Check if it repeats', cls: 'repeat', order: 2 },
    driver: { label: 'Check settings & drivers', cls: 'driver', order: 3 },
    info: { label: 'Usually low urgency', cls: 'info', order: 4 }
  };
  const prioByFile = {};
  if (window.SITE_DATA && Array.isArray(window.SITE_DATA.eventViewerCodes)) {
    window.SITE_DATA.eventViewerCodes.forEach((e) => { if (e.detailPage && e.urgency) prioByFile[e.detailPage] = e.urgency; });
  }
  const ICON = { 'power-and-shutdown': 'psu', 'crashes-and-reports': 'bsod', 'hardware-errors': 'device', graphics: 'game', storage: 'ssd', network: 'event', 'applications-and-services': 'report', 'security-and-accounts': 'code', 'windows-update': 'update', 'informational-records': 'report' };
  const LIMIT = 5;

  const groups = [];
  Array.from(root.children).forEach((el) => {
    if (el.tagName !== 'H3' || !el.id) return;
    let next = el.nextElementSibling;
    let desc = null;
    if (next && next.matches('p.muted')) { desc = next; next = next.nextElementSibling; }
    if (next && next.matches('div.link-list') && next.querySelector('a[href*="/en/event-"]')) groups.push({ h3: el, desc, list: next });
  });
  if (!groups.length) return;

  let total = 0;
  const cards = groups.map(({ h3, desc, list }) => {
    const card = document.createElement('section');
    card.className = 'ci-card';
    card.id = 'area-' + h3.id;
    const rows = Array.from(list.querySelectorAll('a')).map((a) => {
      const href = a.getAttribute('href');
      const file = href.split('/').pop();
      const text = a.textContent.trim();
      const cut = text.indexOf(' · ');
      const codeText = cut > 0 ? text.slice(0, cut) : text;
      const titleText = cut > 0 ? text.slice(cut + 3) : '';
      const prio = PRIO[prioByFile[file]] ? prioByFile[file] : '';
      const row = document.createElement('li');
      row.className = 'ci-row';
      const link = document.createElement('a');
      link.href = href;
      const idm = codeText.match(/^(.*\S)\s+(\d[\d·,\-]*)$/);
      const code = document.createElement('span');
      code.className = 'ci-code';
      const title = document.createElement('span');
      title.className = 'ci-title';
      title.textContent = titleText;
      if (prio) {
        const badge = document.createElement('span');
        badge.className = 'ci-prio ci-prio--' + PRIO[prio].cls;
        badge.textContent = PRIO[prio].label;
        title.appendChild(badge);
      }
      const go = document.createElement('span');
      go.className = 'ci-go';
      go.setAttribute('aria-hidden', 'true');
      if (idm) {
        link.className = 'ci-row-split';
        code.classList.add('ci-id');
        code.textContent = idm[2];
        const src = document.createElement('span');
        src.className = 'ci-src';
        src.textContent = idm[1];
        link.append(code, src, title, go);
      } else {
        code.textContent = codeText;
        link.append(code, title, go);
      }
      row.appendChild(link);
      return { el: row, code: codeText, title: titleText, prio };
    });
    total += rows.length;
    const head = document.createElement('div');
    head.className = 'ci-card-head';
    const tile = document.createElement('span');
    tile.className = 'tile-icon';
    tile.innerHTML = '<img src="/assets/icons/tools/' + (ICON[h3.id] || 'event') + '.svg" alt="" width="40" height="40" loading="lazy">';
    const meta = document.createElement('div');
    meta.className = 'ci-card-meta';
    const count = document.createElement('span');
    count.className = 'ci-card-count';
    h3.parentNode.insertBefore(card, h3);
    meta.append(h3, count);
    if (desc) { desc.classList.add('ci-card-desc'); meta.appendChild(desc); }
    head.append(tile, meta);
    const ul = document.createElement('ul');
    ul.className = 'ci-list';
    rows.forEach((r) => ul.appendChild(r.el));
    const more = document.createElement('button');
    more.type = 'button';
    more.className = 'ci-more-btn';
    more.hidden = true;
    more.setAttribute('aria-expanded', 'false');
    list.remove();
    card.append(head, ul, more);
    return { card, count, rows, name: h3.textContent, more, expanded: false, id: h3.id };
  });

  // 증상으로 시작: 영역의 처음 두 이벤트를 "Likely events"로 보여 준다(영역 목록에서 그대로 가져옴).
  const SYMPTOMS = [
    ['My PC restarted on its own', 'power-and-shutdown', 'psu'],
    ['Blue screen or a crash', 'crashes-and-reports', 'bsod'],
    ['Hardware error messages', 'hardware-errors', 'device'],
    ['Drive or disk warnings', 'storage', 'ssd'],
    ['Screen or driver problems', 'graphics', 'game'],
    ['An app keeps closing or hanging', 'applications-and-services', 'report']
  ];
  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));
  const symCards = SYMPTOMS.filter(([, id]) => byId[id]).map(([title, id, icon]) => {
    const picks = byId[id].rows.slice(0, 2).map((r) => r.code).join(', ');
    return '<a class="guide-quick-link" href="#area-' + id + '"><span class="tile-icon"><img src="/assets/icons/tools/' + icon + '.svg" alt="" width="40" height="40" loading="lazy"></span><strong>' + title + '</strong><span>Likely events: ' + picks + '</span><span class="guide-quick-go">Open ' + byId[id].name.replace(/&amp;/g, '&') + ' →</span></a>';
  }).join('');

  const prioCounts = {};
  cards.forEach((g) => g.rows.forEach((r) => { if (r.prio) prioCounts[r.prio] = (prioCounts[r.prio] || 0) + 1; }));
  const prioKeys = Object.keys(PRIO).filter((k) => prioCounts[k]).sort((a, b) => PRIO[a].order - PRIO[b].order);

  const bar = document.createElement('div');
  bar.className = 'ci-toolbar';
  bar.innerHTML =
    '<div class="callout"><strong>English edition (pilot)</strong><p>This English edition covers the most-searched events. The full index is available in Korean. <a href="/event-codes-index.html" hreflang="ko" lang="ko">Open the Korean index →</a></p></div>' +
    '<label class="ci-search"><span class="sr-only">Search event ID or source</span><input type="search" id="ci-q" placeholder="Search event ID or source (e.g. 41, Kernel-Power, Disk)" autocomplete="off"></label>' +
    (symCards ? '<h3 class="en-sym-title">Start from a symptom</h3><div class="guide-quick-grid guide-quick-grid--three">' + symCards + '</div>' : '') +
    '<h3 class="en-sym-title">Browse by area</h3>' +
    (prioKeys.length ? '<div class="ci-chips" role="group" aria-label="Priority"><span class="ci-chips-label">Priority</span>' +
      '<button type="button" class="ci-chip ci-prio-chip is-active" data-prio="all" aria-pressed="true">All</button>' +
      prioKeys.map((k) => '<button type="button" class="ci-chip ci-prio-chip" data-prio="' + k + '" aria-pressed="false">' + PRIO[k].label + ' <span class="ci-chip-n">' + prioCounts[k] + '</span></button>').join('') + '</div>' : '') +
    '<p class="ci-summary" aria-live="polite">Total <b>' + total + '</b> events · showing <b id="ci-shown">' + total + '</b></p>';
  const empty = document.createElement('div');
  empty.className = 'ci-empty';
  empty.hidden = true;
  empty.innerHTML = '<p>No event matches. Try another ID or source, or paste your log into the analyzer.</p><a href="/en/event-log-analyzer.html">Open the event log analyzer →</a>';
  const first = cards[0].card;
  first.parentNode.insertBefore(bar, first);
  first.parentNode.appendChild(empty);

  let prioKey = 'all';
  const apply = () => {
    const q = bar.querySelector('#ci-q').value.trim().toLowerCase();
    const capped = !q && prioKey === 'all';
    let shown = 0;
    cards.forEach((g) => {
      const matched = g.rows.filter((r) => {
        const ok = (prioKey === 'all' || r.prio === prioKey) && (!q || (r.code + ' ' + r.title + ' ' + g.name).toLowerCase().includes(q));
        r.el.hidden = true;
        return ok;
      });
      const limit = capped && !g.expanded ? LIMIT : matched.length;
      matched.forEach((r, i) => { r.el.hidden = i >= limit; });
      g.card.hidden = matched.length === 0;
      g.count.textContent = matched.length + (matched.length === 1 ? ' event' : ' events');
      const extra = matched.length - LIMIT;
      g.more.hidden = !(capped && extra > 0);
      g.more.textContent = g.expanded ? 'Show less' : 'Show ' + extra + ' more';
      g.more.setAttribute('aria-expanded', g.expanded ? 'true' : 'false');
      shown += matched.length;
    });
    bar.querySelector('#ci-shown').textContent = String(shown);
    empty.hidden = shown !== 0;
  };
  cards.forEach((g) => g.more.addEventListener('click', () => { g.expanded = !g.expanded; apply(); if (!g.expanded) g.card.scrollIntoView({ block: 'nearest' }); }));
  bar.querySelector('#ci-q').addEventListener('input', apply);
  bar.querySelectorAll('.ci-prio-chip').forEach((btn) => btn.addEventListener('click', () => {
    prioKey = btn.dataset.prio;
    bar.querySelectorAll('.ci-prio-chip').forEach((b) => {
      const on = b === btn;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    apply();
  }));
  apply();
})();
