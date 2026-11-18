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

  // 태그 라벨: community-cases-tags.json(Worker·운영자 수리 기록과 같은 목록). 불러오지 못하면 태그는 표시하지 않는다.
  let TAGS = null;
  const tagsReady = fetch("community-cases-tags.json?v=cc-20261121c").then((r) => (r.ok ? r.json() : null)).then((t) => { TAGS = t; }).catch(() => {});
  const tagLabel = (group, key) => (TAGS && TAGS[group] && TAGS[group][key]) || "";

  const escapeHtml = (value) =>
    String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const setStatus = (message, isError = false, isSuccess = false) => {
    statusEl.textContent = message;
    statusEl.classList.toggle("is-error", isError);
    statusEl.classList.toggle("is-success", isSuccess);
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
    const resultLabel = tagLabel("result", item.result);
    const result = resultLabel ? `<span class="case-result case-result--${escapeHtml(item.result)}">${escapeHtml(resultLabel)}</span>` : "";
    const chips = [["symptom", "증상"], ["cause", "원인"], ["fix", "해결"]]
      .map(([group, name]) => { const label = tagLabel(group, item[group]); return label ? `<span class="case-tag">${name} · ${escapeHtml(label)}</span>` : ""; })
      .join("");
    const tags = chips ? `<div class="case-tags">${chips}</div>` : "";
    const operator = item.operator_comment ? `<p class="case-operator"><strong>운영자 코멘트</strong>${escapeHtml(item.operator_comment)}</p>` : "";
    const long = String(item.body || "").length > 160;
    return `<article class="community-case-card${item.result && tagLabel("result", item.result) ? " is-" + escapeHtml(item.result) : ""}">\
<header class="case-card-head">${badge}${result}<time class="eyebrow" datetime="${dateAttr}">${date}</time></header>\
<h3>${escapeHtml(item.title)}</h3>\
<p class="cc-body${long ? " is-clamped" : ""}">${escapeHtml(item.body).replace(/\n/g, "<br>")}</p>${long ? '<button type="button" class="cc-toggle" aria-expanded="false">더 보기</button>' : ""}\
${tags}${operator}${ref}</article>`;
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
      await tagsReady;
      const response = await fetch(`${apiBase}/cases?${params}`);
      if (!response.ok) throw new Error("load failed");
      const payload = await response.json();
      const cases = Array.isArray(payload.cases) ? payload.cases : [];
      if (!append) {
        list.innerHTML = cases.length
          ? cases.map(renderCard).join("")
          : '<div class="cc-empty"><p>아직 공개된 사례가 없습니다.</p><a href="#cc-submit">첫 해결 사례 남기기 →</a></div>';
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
      filterBar.querySelectorAll("[data-category]").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      loadCases(false);
    });
  }

  // 제출 폼의 카테고리 칩: 선택한 값을 숨은 입력(category)에 넣고 선택 상태를 표시한다.
  const catPills = root.querySelector("[data-cat-pills]");
  const catHidden = root.querySelector("[data-category-hidden]");
  if (catPills && catHidden) {
    catPills.addEventListener("click", (e) => {
      const pill = e.target.closest("[data-cat]");
      if (!pill) return;
      catHidden.value = pill.dataset.cat;
      catPills.querySelectorAll("[data-cat]").forEach((b) => {
        b.classList.toggle("is-active", b === pill);
        b.setAttribute("aria-pressed", b === pill ? "true" : "false");
      });
    });
  }

  if (moreBtn) {
    moreBtn.addEventListener("click", () => loadCases(true));
  }

  // 긴 본문은 4줄까지만 보이고 "더 보기"로 펼친다.
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".cc-toggle");
    if (!btn) return;
    const body = btn.previousElementSibling;
    const open = body.classList.toggle("is-clamped") === false;
    btn.textContent = open ? "접기" : "더 보기";
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });

  // 본문 글자 수 안내(1,200자 제한).
  const bodyField = form.querySelector("textarea[name=body]");
  const counter = root.querySelector("[data-body-counter]");
  if (bodyField && counter) {
    const updateCounter = () => { counter.textContent = `${bodyField.value.length} / 1200자 (최소 80자)`; };
    bodyField.addEventListener("input", updateCounter);
    form.addEventListener("reset", () => setTimeout(updateCounter, 0));
    updateCounter();
  }

  // 폼을 비우면(제출 성공 후 포함) 카테고리 칩 선택 상태도 함께 지운다.
  form.addEventListener("reset", () => {
    if (!catPills) return;
    catPills.querySelectorAll("[data-cat]").forEach((b) => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
  });

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
      setStatus("제출되었습니다. 개인정보와 내용 검토 후 공개 여부를 결정합니다.", false, true);
    } catch (error) {
      setStatus(error.message || "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.", true);
    } finally {
      submitButton.disabled = false;
    }
  });

  loadCases();
})();
