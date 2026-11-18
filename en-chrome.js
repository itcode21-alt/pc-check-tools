// 영문판(en/) 공통 헤더 리뉴얼: 고정 브랜드. (영문 방문자에게는 출장·원격 지원과 카카오톡 문의를 보여주지 않는다.)
// 한국어 페이지의 site.js/repair-cta.js 에 해당하는 영문 전용 가벼운 스크립트다.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const brand = header.querySelector(".brand");
  if (brand && !brand.querySelector(".brand-name")) {
    const home = brand.querySelector(".brand-mark")?.getAttribute("href") || "/en/";
    brand.querySelector("h1")?.classList.add("brand-title-seo");
    brand.querySelector(".eyebrow")?.classList.add("brand-title-seo");
    brand.insertAdjacentHTML("beforeend", `<a class="brand-name" href="${home}"><span class="brand-name-main">PC Windows Diagnostic Center</span><span class="brand-sub">IT Panda</span></a>`);
  }
})();
