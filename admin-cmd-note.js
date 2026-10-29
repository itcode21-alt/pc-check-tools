/* 관리자 권한이 필요한 명령(sfc·DISM·chkdsk)이 나오는 점검 단계에 실행 방법 안내를 덧붙인다.
 * - "관리자"가 이미 적힌 단계, 복구 환경·설치 미디어에서 쓰는 단계(bootrec 포함)는 건드리지 않는다.
 * - 같은 단계에 두 번 붙지 않으며, 동적으로 그려지는 목록도 처리한다. */
(() => {
  const CMD = /(sfc\s*\/scannow|dism\s*\/|chkdsk(\s|$|\/)|sfc\s*·\s*dism)/i;
  const SKIP = /관리자|복구 환경|WinRE|설치 미디어|부팅 USB|bootrec|Administrator/i;
  const NOTE = '※ 시작 메뉴에서 cmd를 검색해 우클릭 → ‘관리자 권한으로 실행’한 창에서 입력하세요. 일반 창에서는 “액세스가 거부되었습니다”와 같은 오류가 납니다.';

  const style = document.createElement('style');
  style.textContent = '.admin-cmd-note{display:block;margin-top:4px;font-size:.88em;color:#6b5b00;background:#fff8e1;border-left:3px solid #f0b400;padding:4px 8px;border-radius:4px}'
    + '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .admin-cmd-note{color:#f3d27a;background:#3a3216}}'
    + ':root[data-theme="dark"] .admin-cmd-note{color:#f3d27a;background:#3a3216}';
  document.head.appendChild(style);

  const run = () => {
    document.querySelectorAll('main li').forEach((li) => {
      if (li.querySelector('.admin-cmd-note') || li.querySelector('li')) return;
      const text = li.textContent || '';
      if (!CMD.test(text) || SKIP.test(text)) return;
      const n = document.createElement('span');
      n.className = 'admin-cmd-note';
      n.textContent = NOTE;
      li.appendChild(n);
    });
  };

  const main = document.querySelector('main');
  run();
  if (main && 'MutationObserver' in window) {
    let t = null;
    new MutationObserver(() => { clearTimeout(t); t = setTimeout(run, 200); })
      .observe(main, { childList: true, subtree: true });
  }
})();
