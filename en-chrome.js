// 영문판(en/) 공통 헤더 리뉴얼: 상단 안내 띠, 고정 브랜드.
// 한국어 페이지의 site.js/repair-cta.js 에 해당하는 영문 전용 가벼운 스크립트다.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;
  const BAND_KEY = "itsvc-en-band-closed";
  let closed = false;
  try { closed = sessionStorage.getItem(BAND_KEY) === "1"; } catch (e) { /* 저장소 차단 시 무시 */ }

  if (!document.getElementById("en-chrome-style")) {
    const st = document.createElement("style");
    st.id = "en-chrome-style";
    st.textContent = ".cta-topbar{display:flex;align-items:center;justify-content:center;gap:10px;position:relative;padding:9px 44px 9px 16px;line-height:1.45;text-align:center}" +
      ".cta-topbar__link{font-weight:800;text-decoration:none;white-space:nowrap}.cta-topbar__link:hover{text-decoration:underline}" +
      ".cta-topbar__close{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;padding:0;border:0;border-radius:6px;background:transparent;font-size:20px;line-height:1;cursor:pointer}" +
      ".cta-topbar__close:hover{background:rgba(128,128,128,.18)}.cta-topbar__link:focus-visible,.cta-topbar__close:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}" +
      "@media (max-width:560px){.cta-topbar{font-size:.86rem;padding:8px 40px 8px 12px}}@media print{.cta-topbar{display:none!important}}";
    document.head.appendChild(st);
  }
  if (!closed && !document.querySelector(".cta-topbar")) {
    const bar = document.createElement("div");
    bar.className = "cta-topbar";
    bar.innerHTML = '<span>Need hands-on help? <b>Remote check KRW 20,000</b> · available nationwide</span>' +
      '<a class="cta-topbar__link" href="/remote-support.html" hreflang="ko" lang="ko">원격지원 안내 (Korean) →</a>' +
      '<button type="button" class="cta-topbar__close" aria-label="Close banner">×</button>';
    bar.querySelector(".cta-topbar__close").addEventListener("click", () => {
      try { sessionStorage.setItem(BAND_KEY, "1"); } catch (e) { /* 무시 */ }
      bar.remove();
    });
    header.parentNode.insertBefore(bar, header);
  }

  const brand = header.querySelector(".brand");
  if (brand && !brand.querySelector(".brand-name")) {
    const home = brand.querySelector(".brand-mark")?.getAttribute("href") || "/en/";
    brand.querySelector("h1")?.classList.add("brand-title-seo");
    brand.querySelector(".eyebrow")?.classList.add("brand-title-seo");
    brand.insertAdjacentHTML("beforeend", `<a class="brand-name" href="${home}"><span class="brand-name-main">PC Windows Diagnostic Center</span><span class="brand-sub">IT Panda</span></a>`);
  }
})();
