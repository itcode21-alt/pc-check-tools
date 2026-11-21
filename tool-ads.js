/* 도구 페이지(계산기·분석기·업로드 도구)의 측면 광고용 로더.
   모바일과 좁은 화면에서는 애드센스 스크립트를 아예 불러오지 않는다(전면·앵커 같은 가림 광고가 입력·결과를
   덮는 문제 때문, 2026-11-22). 화면이 충분히 넓을 때만 같은 애드센스 스크립트를 불러와, 애드센스 설정에서
   켜 둔 형식(측면 레일 등)이 좌우 여백에 표시되게 한다. 광고 칸(ins)은 도구 페이지에 직접 넣지 않는다.
   검사: scripts/check-no-ads-pages.mjs, 대상 목록: scripts/lib/no-ads-pages.json */
(() => {
  if (!window.matchMedia || !window.matchMedia("(min-width: 1280px)").matches) return;
  if (document.querySelector('script[src*="pagead2.googlesyndication.com"]')) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9907102461716567";
  s.crossOrigin = "anonymous";
  document.head.appendChild(s);
})();
