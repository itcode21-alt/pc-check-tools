/* UI 초기화 - 목차, 다크모드, 진행률 바 */
function buildDynamicToc() {
  const tocList = document.getElementById('toc-list');
  if (!tocList) return;
  const contentArea = document.querySelector('[data-error-code-page], .static-detail-fallback, article.section, .section');
  if (!contentArea) return;
  const headings = contentArea.querySelectorAll('h2, h3');
  if (headings.length === 0) return;
  const items = [];
  headings.forEach(h => {
    if (!h.id) h.id = 'toc-' + Math.random().toString(36).substr(2, 7);
    const text = h.textContent.replace(/^[📑🔗⚠️📅🛠️]\s*/u, '').trim();
    if (text.length > 1) items.push(`<li><a href="#${h.id}">${text}</a></li>`);
  });
  if (items.length > 0) tocList.innerHTML = items.join('');
}
function initTocCollapse() {
  const toc = document.querySelector('.toc');
  const heading = toc && toc.querySelector('h4');
  if (!toc || !heading) return;
  toc.classList.add('toc-collapsed');
  heading.addEventListener('click', () => {
    toc.classList.toggle('toc-collapsed');
  });
}
function initTableOfContents() {
  buildDynamicToc();
  initTocCollapse();
  const tocLinks = document.querySelectorAll('.toc a, .table-of-contents a');
  const progressFill = document.querySelector('.toc-progress-fill');
  if (tocLinks.length === 0) return;
  const options = { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '-80px 0px -66% 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        tocLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`.toc a[href="#${id}"], .table-of-contents a[href="#${id}"]`);
        if (activeLink) activeLink.classList.add('active');
        if (progressFill) {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercent = (scrollTop / docHeight) * 100;
          progressFill.style.width = scrollPercent + '%';
        }
      }
    });
  }, options);
  document.querySelectorAll('h2, h3').forEach(heading => {
    if (!heading.id) heading.id = 'section-' + Math.random().toString(36).substr(2, 9);
    observer.observe(heading);
  });
}
function ensureThemeToggle() {
  let toggle = document.querySelector('.theme-toggle');
  if (toggle) return toggle;
  const header = document.querySelector('.site-header');
  if (!header) return null;
  toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Toggle dark mode' : '다크모드 전환');
  const search = header.querySelector('.site-search');
  if (search && search.parentNode === header) {
    const wrap = document.createElement('div');
    wrap.className = 'header-actions';
    header.insertBefore(wrap, search);
    wrap.appendChild(search);
    wrap.appendChild(toggle);
  } else {
    header.appendChild(toggle);
  }
  return toggle;
}
function updateThemeToggleLabel(toggle) {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const en = document.documentElement.lang === 'en';
  toggle.textContent = isDark ? (en ? '☀️ Light mode' : '☀️ 라이트 모드') : (en ? '🌙 Dark mode' : '🌙 다크 모드');
}
function initDarkModeToggle() {
  const toggle = ensureThemeToggle();
  if (!toggle) return;
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    if (!localStorage.getItem('theme')) applyTheme('dark');
  }
  updateThemeToggleLabel(toggle);
  toggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeToggleLabel(toggle);
  });
}
function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    document.body.style.colorScheme = 'dark';
  } else {
    html.setAttribute('data-theme', 'light');
    document.body.style.colorScheme = 'light';
  }
}
const filterIcons = {'전체':'⚙️','부팅':'🔌','전원':'⚡','장치':'📱','성능':'💨','메모리':'🧠','저장소':'💾','그래픽':'🎮','네트워크':'🌐','오류코드':'⚠️','드라이버':'🔧','게임':'🎯'};
function initFilterButtons() {
  const filterButtons = document.querySelectorAll('.filter-btn-icon');
  filterButtons.forEach(btn => {
    const text = btn.textContent.trim();
    for (const [keyword, icon] of Object.entries(filterIcons)) {
      if (text.includes(keyword)) {
        btn.innerHTML = `<span>${icon}</span> ${text}`;
        break;
      }
    }
    btn.addEventListener('click', () => {
      const parent = btn.parentElement;
      const siblings = parent.querySelectorAll('.filter-btn-icon');
      siblings.forEach(sibling => sibling.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}
function initImageLightbox() {
  let overlay = null;
  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
  }
  function closeLightbox() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKeydown);
  }
  function openLightbox(src, alt) {
    overlay = document.createElement('div');
    overlay.className = 'image-lightbox-overlay';
    const img = document.createElement('img');
    img.className = 'image-lightbox-img';
    img.src = src;
    img.alt = alt || '';
    overlay.appendChild(img);
    overlay.addEventListener('click', closeLightbox);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a.guide-image-link');
    if (!link) return;
    event.preventDefault();
    const innerImg = link.querySelector('img');
    openLightbox(link.getAttribute('href'), innerImg ? innerImg.getAttribute('alt') : '');
  });
}
/* 명령·작업 안전 안내 - 본문이 다루는 위험 작업(sfc·DISM·chkdsk·bootrec·diskpart·레지스트리 등)을 찾아
   위험도·관리자 권한·재부팅·데이터 손실·백업 여부를 한곳에 모아 본문 위쪽에 보여 준다. 페이지를 일일이
   고치지 않도록 본문 텍스트에서 감지하며, 오류 코드 페이지처럼 app.js가 본문을 다시 그리는 경우도 따라간다. */
const COMMAND_SAFETY_RULES = [
  { key: 'sfc', test: /sfc\s*\/scannow/i, name: 'sfc /scannow', risk: 'low', admin: '관리자 권한 필요', reboot: '재부팅 보통 불필요', data: '데이터 손실 없음', backup: '백업 필수 아님',
    note: '끝날 때까지 창을 닫지 마세요. 컴퓨터에 따라 수십 분 걸릴 수 있습니다.' },
  { key: 'dism', test: /dism[^\n<]{0,80}(restorehealth|checkhealth|scanhealth)|dism\s*\/online/i, name: 'DISM /Online /Cleanup-Image', risk: 'low', admin: '관리자 권한 필요', reboot: '재부팅 보통 불필요', data: '데이터 손실 없음', backup: '백업 필수 아님',
    note: 'RestoreHealth는 Windows 업데이트 원본을 쓰므로 인터넷 연결이 필요할 수 있습니다. 진행률이 한동안 멈춘 것처럼 보일 수 있으니 창을 닫지 마세요.' },
  { key: 'chkdsk', test: /chkdsk[^\n<]{0,16}\/[fr]\b/i, name: 'chkdsk /f · /r', risk: 'medium', admin: '관리자 권한 필요', reboot: '사용 중인 드라이브는 다음 재시작 때 검사가 예약됨', data: '파일 시스템을 고치는 과정에서 일부 파일이 정리될 수 있음', backup: '중요 파일 먼저 백업',
    note: '/r은 드라이브 용량에 따라 오래 걸릴 수 있고, 도중에 전원을 끄면 안 됩니다. 드라이브 상태가 나쁘면 검사 자체가 부담이 될 수 있어 백업이 먼저입니다.' },
  { key: 'bootrec', test: /bootrec/i, name: 'bootrec (/fixmbr · /fixboot · /rebuildbcd)', risk: 'high', admin: 'Windows 복구 환경(WinRE)의 명령 프롬프트에서 실행', reboot: '재부팅 필요', data: '파일을 지우지는 않지만 잘못하면 부팅이 되지 않을 수 있음', backup: '가능하면 중요 파일 백업 후 진행',
    note: '디스크 방식(UEFI/GPT, 레거시/MBR)에 따라 맞는 명령이 다르니 해당 단계의 설명을 확인한 뒤 실행하세요.' },
  { key: 'diskpart', test: /diskpart/i, name: 'diskpart', risk: 'high', admin: '관리자 권한 또는 복구 환경에서 실행', reboot: '재부팅 보통 불필요', data: 'clean·format 같은 명령은 디스크 전체를 지움', backup: '백업 필수',
    note: 'list disk로 디스크 번호와 용량을 확인하고, select disk로 고른 대상이 맞는지 두 번 확인한 뒤에만 진행하세요.' },
  { key: 'registry', test: /reg\s+(delete|add)\b|regedit/i, name: '레지스트리 수정 (reg · regedit)', risk: 'high', admin: '관리자 권한 필요', reboot: '재부팅 또는 로그아웃이 필요할 수 있음', data: '잘못 고치면 Windows나 프로그램이 정상 동작하지 않을 수 있음', backup: '변경 전 해당 키 내보내기 백업',
    note: '안내된 키와 값만 정확히 수정하세요.' },
  { key: 'netsh', test: /netsh[^\n<]{0,30}reset/i, name: 'netsh winsock · int ip reset', risk: 'medium', admin: '관리자 권한 필요', reboot: '재부팅 필요', data: '데이터 손실 없음', backup: '고정 IP·DNS 설정은 미리 적어 두기',
    note: '네트워크 설정이 초기화되어 직접 입력해 둔 값이 지워질 수 있습니다.' },
  { key: 'ddu', test: /\bDDU\b|Display Driver Uninstaller/i, name: 'DDU(Display Driver Uninstaller)', risk: 'medium', admin: '안전 모드에서 실행 권장', reboot: '재부팅 필요', data: '데이터 손실 없음', backup: '새 드라이버 설치 파일을 미리 내려받아 두기',
    note: '제거 직후에는 화면 해상도가 낮아지거나 화면 기능이 제한될 수 있습니다.' },
  { key: 'bios', test: /(BIOS|바이오스|CMOS)[^\n<.]{0,12}(초기화|리셋|reset)|CMOS 배터리|기본값 복원/i, name: 'BIOS(UEFI) 설정 초기화', risk: 'medium', admin: '해당 없음(펌웨어 설정 화면)', reboot: '재부팅 필요', data: '저장장치 모드(AHCI/RAID)가 바뀌면 부팅이 되지 않을 수 있음', backup: '현재 설정(부팅 순서·XMP/EXPO·저장장치 모드)을 사진으로 기록',
    note: '초기화 뒤에는 필요한 설정을 다시 맞춰야 합니다.' },
];
const COMMAND_SAFETY_RISK = {
  low: { label: '위험도 낮음', bg: 'rgba(107, 114, 128, .16)', border: 'rgba(107, 114, 128, .45)' },
  medium: { label: '위험도 보통', bg: 'rgba(217, 130, 19, .18)', border: 'rgba(217, 130, 19, .55)' },
  high: { label: '위험도 높음', bg: 'rgba(200, 50, 50, .16)', border: 'rgba(200, 50, 50, .55)' },
};
function escapeCommandSafetyText(value) {
  return String(value).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}
function initCommandSafety() {
  if (document.documentElement.lang === 'en') return;
  const main = document.getElementById('content');
  if (!main || main.querySelector('[data-diagnostic-root]')) return;
  // 위험도 안내는 해당 명령이 "처음 나오는 단계" 바로 앞에 붙인다(페이지 맨 위에 일괄 표시하지 않음).
  // 목차·바로 이동 목록·사이드·기존 안내 박스에 적힌 명령어 언급은 검사 대상에서 뺀다.
  const SKIP = '.toc, .jump-groups, .game-side, nav, aside, .breadcrumb, header, .guide-card, .guide-card-link, .guide-section, .guide-static-hub, .guide-quick-start, .card-grid, .guide-clean-grid, .link-list, .home-update-tracker, .diagnostic-tools-banner, .ci-card, .search-results';
  const BLOCKS = 'p, li, pre, td, dd, h2, h3, h4';
  const CONTAINER = 'main, article, section, .static-detail-fallback, .detail-page, .detail-stack';
  let timer = null;
  let observer = null;
  const findAnchor = (rule) => {
    const hit = Array.from(main.querySelectorAll(BLOCKS)).find((el) => !el.closest(SKIP) && rule.test.test(el.textContent || ''));
    if (!hit) return null;
    let anchor = hit;
    while (anchor.parentElement && anchor.parentElement !== main && !anchor.parentElement.matches(CONTAINER)) anchor = anchor.parentElement;
    return anchor;
  };
  const buildItem = (rule) => {
    const risk = COMMAND_SAFETY_RISK[rule.risk];
    const facts = [rule.admin, rule.reboot, rule.data, rule.backup].map(escapeCommandSafetyText).join(' · ');
    return `<li style="margin:8px 0;line-height:1.6"><span style="display:inline-block;margin-right:6px;padding:1px 8px;border:1px solid ${risk.border};border-radius:999px;background:${risk.bg};font-size:12px;font-weight:600;white-space:nowrap">${risk.label}</span><code>${escapeCommandSafetyText(rule.name)}</code><br><span style="font-size:13px">${facts}. ${escapeCommandSafetyText(rule.note)}</span></li>`;
  };
  const apply = () => {
    if (observer) observer.disconnect();
    main.querySelectorAll('[data-command-safety]').forEach((box) => box.remove());
    // 같은 위치에 걸리는 작업은 한 상자로 묶는다.
    const groups = [];
    COMMAND_SAFETY_RULES.forEach((rule) => {
      const anchor = findAnchor(rule);
      if (!anchor) return;
      const group = groups.find((item) => item.anchor === anchor);
      if (group) group.rules.push(rule);
      else groups.push({ anchor, rules: [rule] });
    });
    groups.forEach(({ anchor, rules }) => {
      const box = document.createElement('aside');
      box.className = 'callout';
      box.setAttribute('role', 'note');
      box.setAttribute('data-command-safety', rules.map((rule) => rule.key).join(','));
      box.innerHTML = `<strong>실행 전 확인: ${rules.length > 1 ? '이 단계의 작업별 위험도' : '이 작업의 위험도'}</strong><ul style="list-style:none;margin:6px 0 0;padding:0">${rules.map(buildItem).join('')}</ul>`;
      anchor.insertAdjacentElement('beforebegin', box);
    });
    if (observer) observer.observe(main, { childList: true, subtree: true });
  };
  observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(apply, 200);
  });
  apply();
}
/* 게임 상세: 분류 필터. 버튼을 누르면 해당 분류의 오류 카드만 보이고, 나머지는 숨긴다(내용은 DOM에 그대로). */
function initGameFilter() {
  const bar = document.querySelector('[data-game-filter]');
  if (!bar) return;
  const cards = Array.from(document.querySelectorAll('.game-err-card'));
  bar.addEventListener('click', (event) => {
    const btn = event.target.closest('.game-filter-btn');
    if (!btn) return;
    const filter = btn.getAttribute('data-filter');
    bar.querySelectorAll('.game-filter-btn').forEach((item) => {
      const on = item === btn;
      item.classList.toggle('is-active', on);
      item.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    cards.forEach((card) => { card.hidden = filter !== 'all' && card.getAttribute('data-group') !== filter; });
  });
  // "바로 이동" 링크가 가리키는 카드가 숨겨져 있으면 먼저 펼친다.
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    const card = target && target.closest('.game-err-card');
    if (card && card.hidden) {
      const all = bar.querySelector('[data-filter="all"]');
      if (all) all.click();
    }
  });
}
/* 우측 사이드(#page-sidebar)가 있는 상세·가이드 페이지에 판다 안내 카드를 맨 위에 넣는다(목록 페이지는 이미 있음). */
function initSidebarCta() {
  const side = document.getElementById('page-sidebar');
  if (!side || side.querySelector('.ci-cta')) return;
  const path = location.pathname.split('/').pop() || '';
  let title = '원인을 못 찾겠다면';
  let sub = '증상으로 먼저 찾아 보세요.';
  let href = 'diagnostic.html';
  let label = '진단 도구 열기';
  if (/^error-code-/.test(path)) { title = '코드를 모르겠다면'; }
  else if (/^event-/.test(path)) { title = '이벤트 ID를 모르겠다면'; sub = '기록을 붙여넣어 해석해 보세요.'; href = 'event-log-analyzer.html'; label = '이벤트 로그 해석기 열기'; }
  const card = document.createElement('div');
  card.className = 'ci-cta';
  card.innerHTML = '<img src="assets/brand/logo-head.webp" width="96" height="96" alt="" loading="lazy"><b>' + title + '</b><span>' + sub + '</span><a href="' + href + '">' + label + '</a>';
  side.insertBefore(card, side.firstChild);
}
/* 우측 사이드가 없는 단일 열 본문(main.page.article)에는 오른쪽 빈 공간에 같은 안내 카드 + 바로가기 사이드를 자동으로 만든다. */
function initAutoSidebar() {
  const main = document.getElementById('content');
  if (!main || !main.matches('main.page.article') || main.classList.contains('article-cols')) return;
  if (document.getElementById('page-sidebar') || main.querySelector('.game-side, [data-community-cases], [data-diagnostic-root], [data-guides-root]')) return;
  const path = location.pathname.split('/').pop() || '';
  let title = '원인을 못 찾겠다면';
  let sub = '증상으로 먼저 찾아 보세요.';
  let href = 'diagnostic.html';
  let label = '진단 도구 열기';
  let links = [['진단 도구', 'diagnostic.html'], ['가이드 목록', 'guides.html'], ['도구 모음', 'tools.html']];
  if (/^error-code-/.test(path)) {
    title = '코드를 모르겠다면';
    links = [['전체 오류 코드 목록', 'error-codes-index.html'], ['BSOD 오류코드 상세', 'common-error-codes.html'], ['진단 도구', 'diagnostic.html']];
  } else if (/^event-/.test(path)) {
    title = '이벤트 ID를 모르겠다면';
    sub = '기록을 붙여넣어 해석해 보세요.';
    href = 'event-log-analyzer.html';
    label = '이벤트 로그 해석기 열기';
    links = [['전체 이벤트 코드 목록', 'event-codes-index.html'], ['이벤트 뷰어 확인 방법', 'event-viewer-guide.html'], ['이벤트 뷰어 진단', 'diagnostic.html#diagnostic-event']];
  }
  const aside = document.createElement('aside');
  aside.className = 'auto-side';
  aside.setAttribute('aria-label', '안내');
  aside.innerHTML = '<div class="ci-cta"><img src="assets/brand/logo-head.webp" width="96" height="96" alt="" loading="lazy"><b>' + title + '</b><span>' + sub + '</span><a href="' + href + '">' + label + '</a></div>' +
    '<nav class="game-side-list" aria-label="바로가기"><h3>바로가기</h3><ul>' + links.map((l) => '<li><a href="' + l[1] + '"><span>' + l[0] + '</span></a></li>').join('') + '</ul></nav>';
  main.classList.add('has-auto-side');
  main.appendChild(aside);
}
document.addEventListener('DOMContentLoaded', () => {
  initCommandSafety();
  initGameFilter();
  initSidebarCta();
  initAutoSidebar();
  initTableOfContents();
  initDarkModeToggle();
  initFilterButtons();
  initImageLightbox();
  window.addEventListener('scroll', () => {
    const progressFill = document.querySelector('.toc-progress-fill');
    if (progressFill) {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      progressFill.style.width = scrollPercent + '%';
    }
  });
});
window.DesignSystem = { applyTheme, initTableOfContents, initDarkModeToggle, initFilterButtons, initImageLightbox };
