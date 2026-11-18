// 가이드 목록(guides.html) 종류 필터: 증상 해결·오류 코드·이벤트·업데이트·NAS·도구·기본·사례.
// 구역 표시는 CSS(data-kind-filter 속성)가 처리하므로, 증상 카드처럼 app.js가 다시 그려도 필터가 유지된다.
(() => {
  const root = document.querySelector('.guides-intro[data-kind-filter]');
  const bar = document.querySelector('[data-guide-type-filters]');
  if (!root || !bar) return;
  const set = (key) => {
    root.setAttribute('data-kind-filter', key);
    bar.querySelectorAll('[data-guide-type]').forEach((b) => {
      const on = b.dataset.guideType === key;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  };
  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-guide-type]');
    if (btn) set(btn.dataset.guideType);
  });
  // 검색을 시작하면 결과가 가려지지 않도록 필터를 전체로 되돌린다.
  const search = document.querySelector('[data-guide-search]');
  if (search) search.addEventListener('input', () => { if (search.value.trim()) set('all'); });
  // 주소의 #guide-symptoms 등으로 들어오면 전체 보기 유지.
})();
