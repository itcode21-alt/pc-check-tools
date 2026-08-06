(() => {
  const roots = Array.from(document.querySelectorAll("[data-site-search]"));
  if (!roots.length || typeof window.SEARCH_INDEX === "undefined" || typeof window.siteSearchQuery !== "function") return;

  const INDEX = window.SEARCH_INDEX;
  const MAX_RESULTS = 8;

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const resultsPageUrl = (query) => `search-results.html?q=${encodeURIComponent(query)}`;

  roots.forEach((root) => {
    const input = root.querySelector("[data-site-search-input]");
    const results = root.querySelector("[data-site-search-results]");
    if (!input || !results) return;

    // 헤더 검색창에는 원래 버튼이 없어 엔터키를 모르면 검색할 방법이
    // 없었다. 버튼 마크업이 300개 넘는 페이지에 하드코딩돼 있어 전부
    // 고치는 대신, 여기서 버튼을 만들어 입력창 옆에 끼워 넣는다.
    if (!root.querySelector("[data-site-search-button]")) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "site-search-button";
      button.setAttribute("data-site-search-button", "");
      button.setAttribute("aria-label", "검색");
      button.textContent = "검색";
      button.addEventListener("click", () => {
        if (input.value.trim()) window.location.href = resultsPageUrl(input.value);
      });
      input.insertAdjacentElement("afterend", button);
    }

    let activeIndex = -1;
    let currentMatches = [];
    let currentQuery = "";
    let currentTotal = 0;

    // 오래된 CSS가 브라우저·CDN 캐시에 남아도 검색 결과의 대비를 보장한다.
    // 검색 패널은 밝은 사이트 공통 UI이므로, 다크 테마 색상을 직접 상속받지 않게 한다.
    const applyReadableResultTheme = () => {
      Object.assign(results.style, {
        backgroundColor: "#ffffff",
        borderColor: "#c8d7ed",
        boxShadow: "0 16px 36px rgba(16, 42, 56, 0.16)",
      });
    };

    const render = (query, allMatches) => {
      const matches = allMatches.slice(0, MAX_RESULTS);
      currentMatches = matches;
      currentQuery = query;
      currentTotal = allMatches.length;
      activeIndex = -1;
      applyReadableResultTheme();
      if (!allMatches.length) {
        results.innerHTML = `
          <p class="site-search-empty" style="color:#4e6670">일치하는 결과가 없습니다.</p>
          <a href="${resultsPageUrl(query)}" class="site-search-viewall" data-result-index="viewall" style="color:#087ea4">다른 표현으로 전체 검색 결과 보기 →</a>
        `;
        results.hidden = false;
        return;
      }
      const rows = matches.map((item, i) => `
        <a href="${item.u}" class="site-search-result" data-result-index="${i}" style="color:#102a38">
          <span class="site-search-result-category" style="color:#087ea4">${escapeHtml(item.c)}</span>
          <span class="site-search-result-title" style="color:#102a38">${escapeHtml(item.t)}</span>
        </a>
      `).join("");
      const viewAll = allMatches.length > MAX_RESULTS
        ? `<a href="${resultsPageUrl(query)}" class="site-search-viewall" data-result-index="viewall" style="color:#087ea4">전체 ${allMatches.length}건 결과 보기 →</a>`
        : "";
      results.innerHTML = rows + viewAll;
      results.hidden = false;
    };

    const close = () => {
      results.hidden = true;
      results.innerHTML = "";
      activeIndex = -1;
      currentMatches = [];
      currentQuery = "";
      currentTotal = 0;
    };

    const search = (query) => {
      if (!query.trim()) {
        close();
        return;
      }
      render(query, window.siteSearchQuery(query, INDEX));
    };

    input.addEventListener("input", () => search(input.value));
    input.addEventListener("focus", () => {
      if (input.value.trim()) search(input.value);
    });

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && (results.hidden || activeIndex < 0)) {
        // 아무 항목도 화살표로 선택하지 않은 상태에서 엔터를 누르면
        // 전체 검색 결과 페이지로 이동한다.
        if (input.value.trim()) {
          event.preventDefault();
          window.location.href = resultsPageUrl(input.value);
        }
        return;
      }
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
        const el = items[activeIndex];
        if (!el) return;
        event.preventDefault();
        if (el.dataset.resultIndex === "viewall") {
          window.location.href = resultsPageUrl(currentQuery);
        } else if (currentMatches[activeIndex]) {
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
