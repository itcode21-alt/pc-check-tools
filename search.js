(() => {
  const roots = Array.from(document.querySelectorAll("[data-site-search]"));
  if (!roots.length || typeof window.SEARCH_INDEX === "undefined") return;

  const INDEX = window.SEARCH_INDEX;
  const MAX_RESULTS = 8;

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  roots.forEach((root) => {
    const input = root.querySelector("[data-site-search-input]");
    const results = root.querySelector("[data-site-search-results]");
    if (!input || !results) return;

    let activeIndex = -1;
    let currentMatches = [];

    // 오래된 CSS가 브라우저·CDN 캐시에 남아도 검색 결과의 대비를 보장한다.
    // 검색 패널은 밝은 사이트 공통 UI이므로, 다크 테마 색상을 직접 상속받지 않게 한다.
    const applyReadableResultTheme = () => {
      Object.assign(results.style, {
        backgroundColor: "#ffffff",
        borderColor: "#c8d7ed",
        boxShadow: "0 16px 36px rgba(16, 42, 56, 0.16)",
      });
    };

    const render = (matches) => {
      currentMatches = matches;
      activeIndex = -1;
      applyReadableResultTheme();
      if (!matches.length) {
        results.innerHTML = `<p class="site-search-empty" style="color:#4e6670">일치하는 결과가 없습니다.</p>`;
        results.hidden = false;
        return;
      }
      results.innerHTML = matches.map((item, i) => `
        <a href="${item.u}" class="site-search-result" data-result-index="${i}" style="color:#102a38">
          <span class="site-search-result-category" style="color:#087ea4">${escapeHtml(item.c)}</span>
          <span class="site-search-result-title" style="color:#102a38">${escapeHtml(item.t)}</span>
        </a>
      `).join("");
      results.hidden = false;
    };

    const close = () => {
      results.hidden = true;
      results.innerHTML = "";
      activeIndex = -1;
      currentMatches = [];
    };

    const normalize = (value) => String(value || "")
      .toLowerCase()
      .replace(/[._/·,:()[\]-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // "부팅이 안되요"/"충전이 안돼요"처럼 구어체로 검색해도 색인에 쓰인
    // "안됨" 표기와 매칭되도록 흔한 활용형을 정규화한다. 구체적인 형태부터
    // 순서대로 치환해야 넓은 패턴이 먼저 먹어치우지 않는다.
    const COLLOQUIAL_MAP = [
      [/안\s?되나요/g, "안됨"],
      [/안\s?돼나요/g, "안됨"],
      [/안\s?되네요/g, "안됨"],
      [/안\s?됩니다/g, "안됨"],
      [/안\s?되요/g, "안됨"],
      [/안\s?돼요/g, "안됨"],
      [/안\s?되고/g, "안됨"],
      [/안\s?돼/g, "안됨"],
      [/안\s?되/g, "안됨"],
    ];
    const applyColloquial = (value) => COLLOQUIAL_MAP.reduce((acc, [re, rep]) => acc.replace(re, rep), value);

    // 조사가 붙은 검색어("부팅이", "화면을")도 매칭되도록, 토큰 끝의 흔한
    // 조사를 뗀 변형도 함께 시도한다. 긴 조사부터 검사해야 짧은 조사가
    // 잘못 먼저 잘려나가지 않는다(예: "부터"를 "터"보다 먼저 검사).
    const PARTICLES = ["에서", "부터", "까지", "이랑", "하고", "으로", "에게", "한테", "보다", "마저", "조차", "이나", "은", "는", "이", "가", "을", "를", "도", "만", "의", "에", "로", "과", "와"]
      .sort((a, b) => b.length - a.length);
    const stripParticle = (token) => {
      for (const p of PARTICLES) {
        if (token.length > p.length + 1 && token.endsWith(p)) return token.slice(0, -p.length);
      }
      return null;
    };

    const search = (query) => {
      const rawTokens = normalize(applyColloquial(query)).split(" ").filter(Boolean);
      if (!rawTokens.length) {
        close();
        return;
      }
      const tokenVariants = rawTokens.map((t) => {
        const stripped = stripParticle(t);
        return stripped ? [t, stripped] : [t];
      });
      const scored = [];
      for (const item of INDEX) {
        const title = normalize(item.t);
        const searchable = normalize(`${item.t} ${item.k}`);
        let ok = true;
        let score = 0;
        for (const variants of tokenVariants) {
          let best = -1;
          for (const v of variants) {
            if (title === v) best = Math.max(best, 100);
            else if (title.startsWith(v)) best = Math.max(best, 50);
            else if (title.includes(v)) best = Math.max(best, 20);
            else if (searchable.includes(v)) best = Math.max(best, 5);
          }
          if (best < 0) { ok = false; break; }
          score += best;
        }
        if (ok) scored.push({ item, score });
      }
      scored.sort((a, b) => b.score - a.score);
      render(scored.slice(0, MAX_RESULTS).map((s) => s.item));
    };

    input.addEventListener("input", () => search(input.value));
    input.addEventListener("focus", () => {
      if (input.value.trim()) search(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (results.hidden || !currentMatches.length) return;
      const items = Array.from(results.querySelectorAll("[data-result-index]"));
      if (event.key === "ArrowDown") {
        event.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
        items[activeIndex]?.scrollIntoView({ block: "nearest" });
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle("is-active", i === activeIndex));
        items[activeIndex]?.scrollIntoView({ block: "nearest" });
      } else if (event.key === "Enter") {
        if (activeIndex >= 0 && currentMatches[activeIndex]) {
          event.preventDefault();
          window.location.href = currentMatches[activeIndex].u;
        }
      } else if (event.key === "Escape") {
        close();
        input.blur();
      }
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) close();
    });
  });
})();
