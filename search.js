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

    const search = (query) => {
      const q = query.trim().toLowerCase();
      if (!q) {
        close();
        return;
      }
      const matches = INDEX.filter((item) => item.k.includes(q)).slice(0, MAX_RESULTS);
      render(matches);
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
