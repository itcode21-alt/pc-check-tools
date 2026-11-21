/* 해결 사례 전후 비교 슬라이더.
   마크업(JS가 없으면 두 사진이 위아래로 나란히 보이고, JS가 있으면 슬라이더로 바뀐다):
   <figure class="ba" data-before-after data-before-label="청소 전" data-after-label="청소 후">
     <div class="ba-stage">
       <img class="ba-img ba-img--after" src="후.webp" alt="…" width="1280" height="800">
       <div class="ba-before"><img class="ba-img ba-img--before" src="전.webp" alt="…" width="1280" height="800"></div>
     </div>
   </figure>
   두 사진은 같은 각도·같은 크기로 찍은 것을 쓴다. alt는 사진마다 무엇이 다른지 적는다.
   고객 정보·시리얼 번호가 보이는 사진은 올리지 않는다(docs/WORKLOG.md 작업 규칙). */
(() => {
  const init = (fig) => {
    if (fig.dataset.baReady) return;
    const stage = fig.querySelector(".ba-stage");
    const beforeWrap = fig.querySelector(".ba-before");
    if (!stage || !beforeWrap || stage.querySelectorAll("img").length < 2) return;
    fig.dataset.baReady = "1";
    fig.classList.add("ba-ready");
    const beforeLabel = fig.dataset.beforeLabel || "전";
    const afterLabel = fig.dataset.afterLabel || "후";

    const mk = (tag, cls, text) => { const el = document.createElement(tag); if (cls) el.className = cls; if (text) el.textContent = text; return el; };
    const tagB = mk("span", "ba-tag ba-tag--before", beforeLabel);
    const tagA = mk("span", "ba-tag ba-tag--after", afterLabel);
    const handle = mk("div", "ba-handle");
    handle.setAttribute("aria-hidden", "true");
    handle.appendChild(mk("span", "ba-knob", "◀▶"));
    const range = document.createElement("input");
    range.type = "range"; range.min = "0"; range.max = "100"; range.value = "50"; range.step = "1";
    range.className = "ba-range";
    range.setAttribute("aria-label", `${beforeLabel}·${afterLabel} 비교 슬라이더`);
    stage.append(tagB, tagA, handle, range);

    const set = (v) => {
      const p = Math.min(100, Math.max(0, Number(v)));
      fig.style.setProperty("--ba-pos", p + "%");
      range.value = String(p);
      range.setAttribute("aria-valuetext", `${beforeLabel} ${Math.round(p)}% 보임`);
    };
    range.addEventListener("input", () => set(range.value));

    const bar = mk("div", "ba-actions");
    [[beforeLabel + "만 보기", 100], ["반반 보기", 50], [afterLabel + "만 보기", 0]].forEach(([label, v]) => {
      const b = mk("button", "ba-btn", label);
      b.type = "button";
      b.addEventListener("click", () => set(v));
      bar.appendChild(b);
    });
    bar.appendChild(mk("span", "ba-hint", "키보드 좌우 방향키로도 움직입니다."));
    fig.appendChild(bar);
    set(50);
  };
  const run = () => document.querySelectorAll("[data-before-after]").forEach(init);

  /* 증상 가이드는 app.js가 본문을 data.js 기준으로 다시 그리므로, 정적 HTML에 넣은 내용은 지워진다.
     그래서 <template data-guide-example data-after-heading="앞 섹션 제목">에 예시를 담아 두고,
     본문이 그려진 뒤 그 섹션 바로 뒤에 끼워 넣는다(본문 생성 코드와 data.js는 건드리지 않는다). */
  const placeTemplates = () => {
    document.querySelectorAll("template[data-guide-example]").forEach((tpl) => {
      if (tpl.dataset.placed) return;
      const place = (fallback) => {
        const detail = document.querySelector(".detail-page");
        const host = detail || (fallback ? document.querySelector("[data-symptom-detail-page]") : null);
        if (!host) return false;
        const heading = tpl.dataset.afterHeading || "";
        const anchor = detail && Array.from(detail.children).find((el) => el.tagName === "SECTION" && (el.querySelector("h2,h3") || {}).textContent && el.querySelector("h2,h3").textContent.includes(heading));
        const frag = tpl.content.cloneNode(true);
        if (anchor) anchor.after(frag); else host.appendChild(frag);
        tpl.dataset.placed = "1";
        run();
        return true;
      };
      if (place(false)) return;
      const obs = new MutationObserver(() => { if (place(false)) obs.disconnect(); });
      obs.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { obs.disconnect(); if (!tpl.dataset.placed) place(true); }, 4000);
    });
  };

  const start = () => { run(); placeTemplates(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
