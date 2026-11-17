// 수리 의뢰 블록 (2026-10-27)
//
// 콘텐츠 페이지 본문 끝에 "카카오톡으로 증상 보내기" 블록을 넣는다.
// - 오류코드·증상 상세 페이지는 app.js가 본문을 다시 그리므로 DOMContentLoaded 이후에 넣는다.
// - 본문하단 광고(.ad-unit, slot 1101059097)가 본문 안에 있으면 그 "위"에 넣는다.
//   상세 페이지처럼 광고가 본문 section 바깥(main 직속)에 있으면 본문 끝에 넣는 것만으로 광고 위가 된다.
// - 계산기·정책 페이지 등은 스크립트 태그에 data-banner-only를 붙여 상단 띠배너만 보여준다 (scripts/apply-repair-cta.py).
// - 상단 띠배너(2026-11-17)는 이 스크립트가 들어간 모든 페이지에 뜬다. 닫으면 그 탭 세션 동안 숨긴다.
// - 연락처·가격·지역은 아래 REPAIR 값만 고치면 전 페이지에 반영된다.
(() => {
  if (window.__itsvcRepairCta) return;
  window.__itsvcRepairCta = true;

  // data-banner-only로 로드됐으면 하단 의뢰 블록은 넣지 않는다.
  const selfScript = document.currentScript || document.querySelector('script[src*="repair-cta.js"]');
  const bannerOnly = !!(selfScript && selfScript.hasAttribute("data-banner-only"));
  const pageName = location.pathname.split("/").pop() || "index.html";

  // ── 수리 의뢰 블록 (2026-10-27) ─────────────────────────────────────
  const REPAIR = {
    kakaoUrl: "https://pf.kakao.com/_xgExbWX/chat",
    remoteUrl: "remote-support.html",
    remotePrice: "2만원 · 원인을 못 찾으면 무료",
    visitPrice: "3만원 (원거리 4만원)",
    areas: "인천 검단구·서해구 청라, 김포, 고양, 파주",
  };

  // 하드웨어 가이드 → 관련 부품 A/S 안내(parts-support.html#앵커). 목록에 없는 페이지에는 붙이지 않는다.
  const PART_LABEL = { cpu: "CPU", board: "메인보드", gpu: "그래픽카드", memory: "메모리", storage: "SSD·HDD", psu: "파워", monitor: "모니터" };
  const HARDWARE_PARTS = {
    "hardware-amd-cpu-cooler-pressure-no-post": ["cpu", "board"],
    "hardware-ddr5-dual-channel-xmp-issue": ["memory", "board"],
    "hardware-dual-monitor-dp-not-detected": ["gpu", "monitor"],
    "hardware-external-drive-not-detected": ["storage"],
    "hardware-external-monitor-connect-blackout": ["monitor"],
    "hardware-game-lag-fps-drop": ["gpu"],
    "hardware-gaming-reboot": ["psu", "gpu"],
    "hardware-gpu-artifacts": ["gpu"],
    "hardware-gpu-coil-whine": ["gpu"],
    "hardware-gpu-not-detected": ["gpu", "board"],
    "hardware-gpu-tdr-pcie-whea-combination": ["gpu", "board"],
    "hardware-hdd-clicking-noise": ["storage"],
    "hardware-monitor-color-abnormal": ["monitor"],
    "hardware-monitor-refresh-rate-stuck": ["monitor"],
    "hardware-no-display": ["gpu", "monitor", "memory"],
    "hardware-no-power": ["psu", "board"],
    "hardware-nvidia-app-install-error": ["gpu"],
    "hardware-nvme-delay": ["storage", "board"],
    "hardware-overheat-shutdown": ["cpu", "gpu"],
    "hardware-rtx-50-driver-issues": ["gpu"],
    "hardware-screen-flicker": ["monitor", "gpu"],
    "hardware-screen-tearing": ["monitor", "gpu"],
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
.repair-cta__parts{margin:12px 0 0;font-size:.9rem;color:var(--text-secondary,#5f6368);line-height:1.7}
.repair-cta__parts a{font-weight:600;color:var(--accent-link,#1967d2)}
.repair-cta__fallback{margin:12px 0 0}
.repair-cta__fallback p{margin:0 0 6px;font-size:.88rem;color:var(--text-secondary,#5f6368)}
.repair-cta__fallback textarea{width:100%;min-height:150px;box-sizing:border-box;padding:10px;border:1px solid var(--line,#dadce0);border-radius:8px;
  background:var(--panel,#fff);color:var(--text,#202124);font:inherit;font-size:.9rem;line-height:1.5}
.cta-topbar{display:flex;align-items:center;justify-content:center;gap:10px;position:relative;padding:9px 44px 9px 16px;border-bottom:1px solid var(--line,#dadce0);
  background:var(--panel-strong,#f5f5f7);color:var(--text,#202124);font-size:.92rem;line-height:1.45;text-align:center}
.cta-topbar__link{font-weight:800;color:var(--accent-link,#1967d2);text-decoration:none;white-space:nowrap}
.cta-topbar__link:hover{text-decoration:underline}
.cta-topbar__close{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:32px;height:32px;padding:0;border:0;border-radius:6px;background:transparent;
  color:var(--text-secondary,#5f6368);font-size:20px;line-height:1;cursor:pointer}
.cta-topbar__close:hover{background:rgba(128,128,128,.18)}
.cta-topbar__link:focus-visible,.cta-topbar__close:focus-visible{outline:2px solid var(--accent-link,#1967d2);outline-offset:2px}
@media (max-width:560px){.cta-topbar{font-size:.86rem;padding:8px 40px 8px 12px}.repair-cta__plans{grid-template-columns:1fr}.repair-cta__kakao,.repair-cta__copy{width:100%;justify-content:center}}
@media print{.cta-topbar,.repair-cta{display:none!important}}`;
    document.head.append(style);
  };

  const track = (action) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", "repair_cta", { cta_action: action, page_path: location.pathname });
      }
    } catch (error) { /* 측정 실패는 무시 */ }
  };

  // 진단 도구에 결과가 떠 있으면 그 텍스트도 문의 내용에 넣는다(펼쳐진 결과 영역만, 최대 1200자).
  // 빈 상태 안내("코드를 입력하면 …")와 검색 실패 안내는 제목·목록·카드 없이 <p>만 있어서 결과로 보지 않는다.
  const RESULT_SELECTOR = "[data-code-result],[data-event-result],[data-log-result],[data-ai-result],[data-timeline-result],[data-basket-analysis-result],[data-dmp-result]";
  const REAL_RESULT_MARKUP = "h2,h3,h4,article,ul,ol,table,[class*='card'],[class*='head']";
  const collectResultText = () => {
    const texts = [];
    document.querySelectorAll(RESULT_SELECTOR).forEach((el) => {
      if (el.hidden || el.closest("[hidden]") || !el.querySelector(REAL_RESULT_MARKUP)) return;
      const clone = el.cloneNode(true);
      clone.querySelectorAll("button, script, style, .result-card-actions, [hidden]").forEach((node) => node.remove());
      clone.querySelectorAll("li").forEach((li) => li.prepend("• "));
      clone.querySelectorAll("h2, h3, h4, p, li, tr, article, section, div").forEach((node) => node.append("\n"));
      const text = (clone.textContent || "").split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter((line) => line.length > 1).join("\n");
      if (text) texts.push(text);
    });
    const joined = texts.filter((text, i) => !texts.some((other, j) => j !== i && other.length > text.length && other.includes(text))).join("\n");
    return joined.length > 1200 ? `${joined.slice(0, 1200)}…` : joined;
  };

  const buildMessage = () => {
    const lines = [
      "[itsvc.co.kr 문의 참고]",
      `페이지: ${document.title.trim()}`,
      `주소: ${location.href}`,
    ];
    const result = collectResultText();
    if (result) lines.push("진단 결과:", result);
    lines.push("증상: ", "언제부터: ", "지역(방문 희망 시): ");
    return lines.join("\n");
  };

  // 클립보드 API → 구형 execCommand 순으로 시도하고, 둘 다 안 되면 false를 돌려준다.
  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (error) { /* 아래 방법으로 이어서 시도 */ }
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.append(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (error) { ok = false; }
    area.remove();
    return ok;
  };

  const partsLinksHtml = () => {
    const parts = HARDWARE_PARTS[pageName.replace(/\.html$/, "")];
    if (!parts) return "";
    const links = parts.map((key) => `<a href="parts-support.html#${key}" data-as-link="${key}">${PART_LABEL[key]}</a>`).join(" · ");
    return `<p class="repair-cta__parts">부품 고장이 의심되면 제조사 공식 A/S부터 확인하세요: ${links} 안내</p>`;
  };

  const makeRepairCta = () => {
    const box = document.createElement("aside");
    box.className = "repair-cta";
    box.setAttribute("aria-label", "수리 의뢰");
    box.innerHTML = `
      <p class="repair-cta__eyebrow">수리 의뢰</p>
      <p class="repair-cta__title">직접 해결이 어렵다면 원격 점검 2만원</p>
      <p class="repair-cta__desc">이 사이트는 PC 출장 수리 기사 <b>아이티에스</b>가 운영합니다. 먼저 원격으로 점검하고, 부품 교체가 필요하면 방문해서 수리합니다.</p>
      <ul class="repair-cta__plans">
        <li><b>원격 점검 · 전국</b><span>30분 안에 원인 확인</span><span><em>${REPAIR.remotePrice}</em></span></li>
        <li><b>방문 수리</b><span>${REPAIR.areas}</span><span>출장비 <em>${REPAIR.visitPrice}</em></span></li>
      </ul>
      <div class="repair-cta__actions">
        <a class="repair-cta__kakao" href="${REPAIR.kakaoUrl}" target="_blank" rel="noopener">카카오톡으로 증상 보내기</a>
        <button type="button" class="repair-cta__copy">증상 복사</button>
        <a class="repair-cta__more" href="${REPAIR.remoteUrl}" data-remote-link>원격지원 안내 →</a>
        <a class="repair-cta__more" href="pricing.html">요금 자세히 보기 →</a>
      </div>
      <p class="repair-cta__hint">"증상 복사"를 누른 뒤 카카오톡 채팅창에 붙여 넣으면 보고 계신 페이지와 진단 결과가 그대로 전달됩니다.</p>
      ${partsLinksHtml()}`;

    box.querySelector(".repair-cta__kakao").addEventListener("click", () => track("kakao"));
    box.querySelector("[data-remote-link]").addEventListener("click", () => track("remote_page"));
    box.querySelectorAll("[data-as-link]").forEach((link) => link.addEventListener("click", () => track(`as_${link.dataset.asLink}`)));

    const copyBtn = box.querySelector(".repair-cta__copy");
    copyBtn.addEventListener("click", async () => {
      track("copy");
      const message = buildMessage();
      const ok = await copyText(message);
      box.querySelector(".repair-cta__fallback")?.remove();
      if (ok) {
        copyBtn.textContent = "복사됨 ✓";
      } else {
        const fallback = document.createElement("div");
        fallback.className = "repair-cta__fallback";
        fallback.setAttribute("role", "status");
        fallback.innerHTML = `<p>자동 복사가 되지 않았습니다. 아래 내용을 직접 선택해 복사한 뒤 카카오톡 채팅창에 붙여 넣어 주세요.</p><textarea readonly aria-label="문의 내용"></textarea>`;
        const area = fallback.querySelector("textarea");
        area.value = message;
        box.append(fallback);
        area.focus();
        area.select();
        copyBtn.textContent = "직접 복사해 주세요";
      }
      setTimeout(() => { copyBtn.textContent = "증상 복사"; }, 2500);
    });
    return box;
  };

  // ── 상단 띠배너 (2026-11-17) ────────────────────────────────────────
  // 닫으면 같은 탭 세션에서는 다시 뜨지 않는다. 저장소를 못 쓰는 환경에서는 그 화면에서만 숨긴다.
  const BANNER_KEY = "itsvc_cta_topbar_closed";
  const bannerClosed = () => { try { return sessionStorage.getItem(BANNER_KEY) === "1"; } catch (error) { return false; } };
  const rememberBannerClosed = () => { try { sessionStorage.setItem(BANNER_KEY, "1"); } catch (error) { /* 저장 불가 — 무시 */ } };

  const placeBanner = () => {
    if (pageName === REPAIR.remoteUrl || document.querySelector(".cta-topbar") || bannerClosed()) return;
    ensureRepairStyle();
    const bar = document.createElement("div");
    bar.className = "cta-topbar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "원격 점검 안내");
    bar.innerHTML = `<span>해결이 어렵다면</span><a class="cta-topbar__link" href="${REPAIR.remoteUrl}">원격 점검 2만원 →</a><button type="button" class="cta-topbar__close" aria-label="안내 닫기">×</button>`;
    bar.querySelector(".cta-topbar__link").addEventListener("click", () => track("banner"));
    bar.querySelector(".cta-topbar__close").addEventListener("click", () => {
      rememberBannerClosed();
      bar.remove();
      track("banner_close");
    });
    const header = document.querySelector("body > header, body > .site-header");
    if (header) header.before(bar);
    else document.body.prepend(bar);
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

  // ── 본문 링크 클릭 측정 (2026-11-17) ──────────────────────────────────
  // 방문자가 "해결에 쓸 만한 다음 행동"을 했는지 GA4에서 구분하기 위한 이벤트다.
  // 수집하는 값은 이동 종류·도메인·내부 경로뿐이며 검색어·입력값·개인정보는 보내지 않는다.
  //   outbound_official : 본문의 외부 링크(공식 문서·고객센터 등)
  //   affiliate_click   : 쿠팡 파트너스 링크
  //   tool_click        : 진단 도구로 이동
  //   next_page_click   : 다른 오류·게임·증상 가이드로 이동
  // 수리 문의(카카오·복사)는 위의 repair_cta 이벤트가 따로 담당한다.
  const sendEvent = (name, params) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, Object.assign({ page_path: location.pathname, transport_type: "beacon" }, params));
      }
    } catch (error) { /* 측정 실패는 무시 */ }
  };

  const classifyInternal = (path) => {
    const file = path.replace(/^\//, "").replace(/\.html$/, "");
    if (file === "diagnostic") return "tool_click";
    if (/^(error-code|event)-/.test(file)) return "next_page_click:error_code";
    if (/^game-/.test(file)) return "next_page_click:game";
    if (/^(hardware|windows|network|nas|laptop)-/.test(file)) return "next_page_click:symptom";
    if (/-guide$/.test(file)) return "next_page_click:guide";
    return null;
  };

  document.addEventListener("click", (event) => {
    const link = event.target && event.target.closest ? event.target.closest("a[href]") : null;
    if (!link || !link.closest("main")) return;
    if (link.closest(".repair-cta")) return;
    let url;
    try { url = new URL(link.getAttribute("href"), location.href); } catch (error) { return; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return;

    if (url.hostname !== location.hostname) {
      if (/(^|\.)kakao\.com$/.test(url.hostname)) return;
      if (/(^|\.)coupang\.com$/.test(url.hostname) || /(^|\.)link\.coupang\.com$/.test(url.hostname)) {
        sendEvent("affiliate_click", { link_domain: url.hostname });
      } else {
        sendEvent("outbound_official", { link_domain: url.hostname });
      }
      return;
    }
    if (url.pathname === location.pathname) return;
    const kind = classifyInternal(url.pathname);
    if (!kind) return;
    const [name, target] = kind.split(":");
    sendEvent(name, target ? { target_type: target, target_path: url.pathname } : { target_path: url.pathname });
  }, true);

  const init = () => {
    placeBanner();
    if (!bannerOnly) place();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
