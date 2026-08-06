(() => {
  const form = document.querySelector("[data-search-results-form]");
  const input = document.querySelector("[data-search-results-input]");
  const summary = document.querySelector("[data-search-results-summary]");
  const list = document.querySelector("[data-search-results-list]");
  if (!form || !input || !summary || !list) return;
  if (typeof window.SEARCH_INDEX === "undefined" || typeof window.siteSearchQuery !== "function") {
    summary.textContent = "검색 기능을 불러오지 못했습니다. 새로고침해 주세요.";
    return;
  }

  const CATEGORY_ORDER = ["증상", "오류코드", "이벤트", "게임 오류", "페이지"];

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  const getQuery = () => new URLSearchParams(window.location.search).get("q") || "";

  const render = (query) => {
    if (!query.trim()) {
      summary.textContent = "";
      list.innerHTML = `<p class="search-results-empty">찾고 싶은 증상, 오류 코드, 게임 오류를 입력해 주세요.</p>`;
      return;
    }
    const matches = window.siteSearchQuery(query, window.SEARCH_INDEX);
    document.title = `"${query}" 검색 결과 | PC 윈도우 진단 센터`;

    if (!matches.length) {
      summary.textContent = `"${query}"에 대한 검색 결과가 없습니다.`;
      list.innerHTML = `
        <div class="search-results-empty">
          <p>다른 표현으로 다시 검색해 보시거나, 아래에서 찾아보세요.</p>
          <p><a href="diagnostic.html">진단 도구에서 증상·오류 코드로 찾기 →</a></p>
          <p><a href="guides.html">전체 가이드 목록 보기 →</a></p>
        </div>
      `;
      return;
    }

    summary.textContent = `"${query}" 검색 결과 ${matches.length}건`;

    const groups = new Map();
    matches.forEach((item) => {
      if (!groups.has(item.c)) groups.set(item.c, []);
      groups.get(item.c).push(item);
    });
    const orderedCategories = [
      ...CATEGORY_ORDER.filter((c) => groups.has(c)),
      ...[...groups.keys()].filter((c) => !CATEGORY_ORDER.includes(c)),
    ];

    list.innerHTML = orderedCategories.map((category) => `
      <div class="search-results-group">
        <h2>${escapeHtml(category)} <span class="search-results-group-count">${groups.get(category).length}건</span></h2>
        <ul class="search-results-items">
          ${groups.get(category).map((item) => `
            <li><a href="${item.u}">${escapeHtml(item.t)}</a></li>
          `).join("")}
        </ul>
      </div>
    `).join("");
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const query = input.value.trim();
    const url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.pushState({}, "", url);
    render(query);
  });

  window.addEventListener("popstate", () => {
    const query = getQuery();
    input.value = query;
    render(query);
  });

  const initialQuery = getQuery();
  input.value = initialQuery;
  render(initialQuery);
})();
