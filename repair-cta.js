// 수리 의뢰 블록 (2026-10-28)
//
// 콘텐츠 페이지 본문 끝에 "카카오톡으로 증상 보내기" 블록을 넣는다.
// - 오류코드·증상 상세 페이지는 app.js가 본문을 다시 그리므로 DOMContentLoaded 이후에 넣는다.
// - 본문하단 광고(.ad-unit, slot 1101059097)가 본문 안에 있으면 그 "위"에 넣는다.
//   상세 페이지처럼 광고가 본문 section 바깥(main 직속)에 있으면 본문 끝에 넣는 것만으로 광고 위가 된다.
// - 진단 도구·계산기·정책 페이지에는 스크립트 태그를 넣지 않는다 (scripts/apply-repair-cta.py).
// - 연락처·가격·지역은 아래 REPAIR 값만 고치면 전 페이지에 반영된다.
(() => {
  if (window.__itsvcRepairCta) return;
  window.__itsvcRepairCta = true;

  // ── 수리 의뢰 블록 (2026-10-28) ─────────────────────────────────────
  const REPAIR = {
    kakaoUrl: "https://pf.kakao.com/_xgExbWX/chat",
    remotePrice: "2만원 · 원인을 못 찾으면 무료",
    visitPrice: "3만원 (원거리 4만원)",
    areas: "인천 검단구·서해구 청라, 김포, 고양, 파주",
  };

  const ensureRepairStyle = () => {
    if (document.getElementById("repair-cta-style")) return;
    const style = document.createElement("style");
    style.id = "repair-cta-style";
    style.textContent = `
.repair-cta{margin:32px 0 8px;padding:22px 22px 18px;border:1px solid var(--line,#dadce0);border-left:4px solid var(--accent-link,#1967d2);
  border-radius:10px;background:var(--panel-strong,#f5f5f7);color:var(--text,#202124)}
.repair-cta__eyebrow{margin:0 0 6px;font-size:.8rem;font-weight:700;letter-spacing:.04em;color:var(--accent-link,#1967d2)}
.repair-cta p.repair-cta__title{color:var(--text,#202124);margin:0 0 8px;font-size:1.2rem;font-weight:800;line-height:1.4}
.repair-cta__desc{margin:0 0 14px;color:var(--text-secondary,#5f6368);line-height:1.65}
.repair-cta__plans{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 16px;padding:0;list-style:none}
.repair-cta .repair-cta__plans li{margin:0;min-width:0;padding:12px 14px;border:1px solid var(--line,#dadce0);border-radius:8px;background:var(--panel,#fff)}
.repair-cta__plans b{display:block;margin-bottom:2px}
.repair-cta__plans span{display:block;font-size:.9rem;color:var(--text-secondary,#5f6368);line-height:1.5}
.repair-cta__plans em{font-style:normal;font-weight:700;color:var(--text,#202124)}
.repair-cta__actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.repair-cta__kakao{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:8px;background:#FEE500;color:#191919!important;
  font-weight:800;text-decoration:none!important}
.repair-cta__copy{padding:10px 14px;border-radius:8px;border:1px solid var(--line,#dadce0);background:var(--panel,#fff);color:var(--text,#202124);
  font:inherit;font-weight:600;cursor:pointer}
.repair-cta__kakao:focus-visible,.repair-cta__copy:focus-visible{outline:2px solid var(--accent-link,#1967d2);outline-offset:2px}
.repair-cta__more{font-weight:600;color:var(--accent-link,#1967d2)}
.repair-cta__hint{margin:10px 0 0;font-size:.85rem;color:var(--muted,#9aa0a6)}
@media (max-width:560px){.repair-cta__plans{grid-template-columns:1fr}.repair-cta__kakao,.repair-cta__copy{width:100%;justify-content:center}}`;
    document.head.append(style);
  };

  const track = (action) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "repair_cta", { cta_action: action, page_path: location.pathname });
      }
    } catch (error) { /* 측정 실패는 무시 */ }
  };

  const makeRepairCta = () => {
    const pageTitle = (document.querySelector("header h1, h1")?.textContent || document.title).trim().slice(0, 60);
    const message = `[itsvc.co.kr] "${pageTitle}" 페이지 보고 문의드립니다.\n증상: \n언제부터: \n지역(방문 희망 시): `;

    const box = document.createElement("aside");
    box.className = "repair-cta";
    box.setAttribute("aria-label", "수리 의뢰");
    box.innerHTML = `
      <p class="repair-cta__eyebrow">직접 해결이 안 될 때</p>
      <p class="repair-cta__title">여기까지 해도 안 되면, 이 글을 쓴 수리 기사가 직접 봐드립니다</p>
      <p class="repair-cta__desc">이 사이트는 PC 출장 수리 기사 <b>아이티판다</b>가 운영합니다. 먼저 원격으로 점검하고, 부품 교체가 필요하면 방문해서 수리합니다.</p>
      <ul class="repair-cta__plans">
        <li><b>원격 점검 · 전국</b><span>30분 안에 원인 확인</span><span><em>${REPAIR.remotePrice}</em></span></li>
        <li><b>방문 수리</b><span>${REPAIR.areas}</span><span>출장비 <em>${REPAIR.visitPrice}</em></span></li>
      </ul>
      <div class="repair-cta__actions">
        <a class="repair-cta__kakao" href="${REPAIR.kakaoUrl}" target="_blank" rel="noopener">카카오톡으로 증상 보내기</a>
        <button type="button" class="repair-cta__copy">보낼 내용 복사</button>
        <a class="repair-cta__more" href="pricing.html">요금 자세히 보기 →</a>
      </div>
      <p class="repair-cta__hint">"보낼 내용 복사"를 누른 뒤 채팅창에 붙여 넣으면 어떤 오류인지 바로 전달됩니다.</p>`;

    box.querySelector(".repair-cta__kakao").addEventListener("click", () => track("kakao"));
    const copyBtn = box.querySelector(".repair-cta__copy");
    copyBtn.addEventListener("click", async () => {
      track("copy");
      try {
        await navigator.clipboard.writeText(message);
        copyBtn.textContent = "복사됨 ✓";
      } catch (error) {
        window.prompt("아래 내용을 복사해 채팅에 붙여 넣으세요", message);
      }
      setTimeout(() => { copyBtn.textContent = "보낼 내용 복사"; }, 2500);
    });
    return box;
  };

  const place = () => {
    const container = document.querySelector("main > .section, main > article.section, main > section");
    if (!container || container.querySelector(".repair-cta")) return;
    ensureRepairStyle();
    const cta = makeRepairCta();
    const bottomAd = Array.from(container.children).reverse()
      .find((el) => el.classList.contains("ad-unit") && el.querySelector('ins[data-ad-slot="1101059097"]'));
    if (bottomAd) bottomAd.before(cta);
    else container.append(cta);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", place, { once: true });
  } else {
    place();
  }
})();
