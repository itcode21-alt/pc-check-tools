(() => {
  const root = document.querySelector("[data-community-cases]");
  if (!root) return;

  const apiBase = String(window.COMMUNITY_CASES_API_BASE || "").replace(/\/$/, "");
  const form = root.querySelector("[data-community-case-form]");
  const statusEl = root.querySelector("[data-community-case-status]");
  const list = root.querySelector("[data-community-cases-list]");
  const filterBar = root.querySelector("[data-cases-filter-bar]");
  const moreBtn = root.querySelector("[data-cases-more]");

  let currentCategory = "";
  let offset = 0;
  const LIMIT = 12;

  const CATEGORY_LABELS = {
    windows: "Windows",
    hardware: "하드웨어",
    game: "게임",
    network: "네트워크",
    other: "기타",
  };

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const setStatus = (message, isError = false) => {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
  };

  const formatDate = (iso) => (iso || "").slice(0, 10).replace(/-/g, ".");

  const renderCard = (item) => {
    const badge = item.category
      ? `<span class="case-badge">${escapeHtml(CATEGORY_LABELS[item.category] || item.category)}</span>`
      : "";
    const date = item.created_at ? formatDate(item.created_at) : "";
    const dateAttr = item.created_at ? escapeHtml(item.created_at.slice(0, 10)) : "";
    const ref = item.page_url
      ? `<a href="${escapeHtml(item.page_url)}" class="case-ref-link">관련 가이드 보기 →</a>`
      : "";
    return `<article class="community-case-card">\
<header class="case-card-head">${badge}<time class="eyebrow" datetime="${dateAttr}">${date}</time></header>\
<h3>${escapeHtml(item.title)}</h3>\
<p>${escapeHtml(item.body).replace(/\n/g, "<br>")}</p>\
${ref}</article>`;
  };

  const loadCases = async (append = false) => {
    if (!apiBase) {
      list.innerHTML = '<p class="muted">공개 사례 기능을 준비하고 있습니다. 검토 시스템이 연결되면 이곳에 사례가 표시됩니다.</p>';
      if (moreBtn) moreBtn.hidden = true;
      return;
    }
    if (!append) {
      list.innerHTML = '<p class="muted">불러오는 중입니다…</p>';
      offset = 0;
    }
    try {
      const params = new URLSearchParams({ limit: LIMIT, offset });
      if (currentCategory) params.set("category", currentCategory);
      const response = await fetch(`${apiBase}/cases?${params}`);
      if (!response.ok) throw new Error("load failed");
      const payload = await response.json();
      const cases = Array.isArray(payload.cases) ? payload.cases : [];
      if (!append) {
        list.innerHTML = cases.length
          ? cases.map(renderCard).join("")
          : '<p class="muted">아직 공개된 사례가 없습니다. 첫 해결 사례를 남겨 주세요.</p>';
      } else if (cases.length) {
        list.insertAdjacentHTML("beforeend", cases.map(renderCard).join(""));
      }
      offset += cases.length;
      if (moreBtn) moreBtn.hidden = cases.length < LIMIT;
    } catch {
      if (!append) list.innerHTML = '<p class="muted">공개 사례를 잠시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
      if (moreBtn) moreBtn.hidden = true;
    }
  };

  if (filterBar) {
    filterBar.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-category]");
      if (!btn) return;
      currentCategory = btn.dataset.category;
      filterBar.querySelectorAll("[data-category]").forEach((b) => b.classList.toggle("is-active", b === btn));
      loadCases(false);
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => loadCases(true));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    if (!apiBase) {
      setStatus("사례 제출 기능을 준비하고 있습니다. 운영자용 저장소 연결 후 이용할 수 있습니다.", true);
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const submitButton = form.querySelector("button[type=submit]");
    submitButton.disabled = true;
    setStatus("제출하는 중입니다.");
    try {
      const response = await fetch(`${apiBase}/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.message || "제출에 실패했습니다.");
      form.reset();
      setStatus("제출되었습니다. 개인정보와 내용 검토 후 공개 여부를 결정합니다.");
    } catch (error) {
      setStatus(error.message || "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  loadCases();
})();
