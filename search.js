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

  // 검색창이 비어 있을 때 뭘 입력해야 할지 몰라 그냥 닫아버리는 사용자가
  // 많았다 — 자주 겪는 증상 예시를 눌러볼 수 있게 보여준다.
  const POPULAR_SEARCHES = ["블루스크린", "컴퓨터 느려짐", "인터넷 연결 안됨", "화면 안나옴", "부팅이 안돼요", "usb 인식 안됨", "발열 심함", "정품 인증 오류"];

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

    const renderSuggestions = () => {
      currentMatches = [];
      currentQuery = "";
      currentTotal = 0;
      activeIndex = -1;
      applyReadableResultTheme();
      const chips = POPULAR_SEARCHES.map((term, i) => `
        <button type="button" class="site-search-suggestion" data-result-index="${i}" data-suggestion="${escapeHtml(term)}" style="color:#102a38">${escapeHtml(term)}</button>
      `).join("");
      results.innerHTML = `<p class="site-search-suggestions-label" style="color:#4e6670">자주 찾는 증상</p><div class="site-search-suggestions">${chips}</div>`;
      results.hidden = false;
    };

    const search = (query) => {
      if (!query.trim()) {
        renderSuggestions();
        return;
      }
      render(query, window.siteSearchQuery(query, INDEX));
    };

    input.addEventListener("input", () => search(input.value));
    input.addEventListener("focus", () => search(input.value));

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
      const items = Array.from(results.querySelectorAll("[data-result-index]"));
      if (results.hidden || !items.length) return;
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
        if (el.dataset.suggestion) {
          input.value = el.dataset.suggestion;
          search(input.value);
        } else if (el.dataset.resultIndex === "viewall") {
          window.location.href = resultsPageUrl(currentQuery);
        } else if (currentMatches[activeIndex]) {
          window.location.href = currentMatches[activeIndex].u;
        }
      } else if (event.key === "Escape") {
        close();
        input.blur();
      }
    });

    results.addEventListener("click", (event) => {
      const suggestion = event.target.closest("[data-suggestion]");
      if (!suggestion) return;
      // search()가 results.innerHTML을 새로 채우면서 클릭했던 버튼 자체가
      // DOM에서 떨어져 나간다 — 이 클릭이 document까지 버블링되면 "바깥
      // 클릭"으로 오인되어 방금 그린 결과가 바로 닫혀버리므로 막아야 한다.
      event.stopPropagation();
      input.value = suggestion.dataset.suggestion;
      search(input.value);
      input.focus();
    });

    document.addEventListener("click", (event) => {
      if (!root.contains(event.target)) close();
    });
  });
})();
