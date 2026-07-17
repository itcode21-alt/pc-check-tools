(() => {
  const root = document.querySelector("[data-site-search]");
  if (!root || typeof window.SEARCH_INDEX === "undefined") return;

  const input = root.querySelector("[data-site-search-input]");
  const results = root.querySelector("[data-site-search-results]");
  const INDEX = window.SEARCH_INDEX;
  const MAX_RESULTS = 8;

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

  let activeIndex = -1;
  let currentMatches = [];

  const render = (matches) => {
    currentMatches = matches;
    activeIndex = -1;
    if (!matches.length) {
      results.innerHTML = `<p class="site-search-empty">일치하는 결과가 없습니다.</p>`;
      results.hidden = false;
      return;
    }
    results.innerHTML = matches.map((item, i) => `
      <a href="${item.u}" class="site-search-result" data-result-index="${i}">
        <span class="site-search-result-category">${escapeHtml(item.c)}</span>
        <span class="site-search-result-title">${escapeHtml(item.t)}</span>
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
})();
