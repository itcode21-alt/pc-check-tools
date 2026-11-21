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

  /* ───── Ctrl+K(맥은 ⌘K) 통합 검색 창 ─────
     헤더 검색과 같은 색인(window.SEARCH_INDEX)·매칭 규칙(siteSearchQuery)을 쓰는 가운데 창이다.
     ↑↓ 이동, Enter 열기, Esc 닫기. 입력이 비면 자주 찾는 증상, 결과가 없으면 진단 허브·전체 검색으로 안내한다. */
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  const hint = isMac ? "⌘K" : "Ctrl K";
  const TONES = { "증상": "#dcfce7;color:#166534", "오류코드": "#ede9fe;color:#4c1d95", "이벤트": "#fef3c7;color:#92400e", "게임 오류": "#dbeafe;color:#1e40af", "페이지": "#f3f4f6;color:#374151" };
  const CSS = `
    .cmdk-back{position:fixed;inset:0;z-index:2147483000;display:flex;justify-content:center;align-items:flex-start;padding:8vh 16px 16px;box-sizing:border-box;background:rgba(36,26,74,.55)}
    .cmdk-back[hidden]{display:none}
    .cmdk{width:100%;max-width:680px;max-height:84vh;display:flex;flex-direction:column;background:#fff;color:#111827;border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.35);overflow:hidden;font-family:inherit}
    .cmdk-top{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid #e5e7eb}
    .cmdk-input{flex:1 1 auto;min-width:0;min-height:48px;border:0;outline:0;font:inherit;font-size:18px;background:transparent;color:inherit}
    .cmdk-esc{min-height:36px;padding:0 10px;border:1px solid #d1d5db;border-radius:8px;background:#fff;color:#374151;font:inherit;font-size:13px;font-weight:800;cursor:pointer}
    .cmdk-esc:focus-visible,.cmdk-chip:focus-visible,.cmdk-link:focus-visible,.cmdk-row:focus-visible{outline:3px solid #f59e0b;outline-offset:2px}
    .cmdk-body{overflow:auto;padding:8px}
    .cmdk-label{padding:8px 10px;font-size:13px;font-weight:800;color:#4b5563}
    .cmdk-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
    .cmdk-row{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:12px;color:inherit;text-decoration:none;background:#fff}
    .cmdk-row.is-active{background:#f3efff;outline:2px solid #7c3aed}
    .cmdk-tag{flex:0 0 auto;min-width:64px;text-align:center;padding:3px 8px;border-radius:6px;font-size:12px;font-weight:800}
    .cmdk-title{flex:1 1 auto;min-width:0;font-size:16px;font-weight:800;overflow-wrap:anywhere}
    .cmdk-enter{color:#6d28d9;font-weight:900}
    .cmdk-chips{display:flex;flex-wrap:wrap;gap:8px;padding:2px 10px 10px}
    .cmdk-chip{min-height:40px;padding:0 14px;border:1px solid #d1d5db;border-radius:999px;background:#fff;color:#111827;font:inherit;font-size:15px;font-weight:700;cursor:pointer}
    .cmdk-empty{display:flex;flex-direction:column;gap:10px;align-items:center;padding:26px 16px;text-align:center}
    .cmdk-empty strong{font-size:17px}
    .cmdk-empty span{font-size:15px;color:#4b5563}
    .cmdk-link{display:inline-flex;align-items:center;min-height:46px;padding:0 20px;border-radius:12px;background:#7c3aed;color:#fff;font-weight:800;text-decoration:none}
    .cmdk-link--alt{background:#fff;color:#6d28d9;border:2px solid #7c3aed}
    .cmdk-foot{display:flex;flex-wrap:wrap;gap:6px 16px;padding:10px 16px;border-top:1px solid #e5e7eb;background:#f8f7fc;font-size:13px;color:#4b5563}
    .cmdk-foot .cmdk-count{margin-left:auto}
    @media (max-width:560px){.cmdk-back{padding-top:12px}.cmdk-foot .cmdk-keys{display:none}}
  `;
  let back = null, input = null, body = null, count = null, prevFocus = null, matches = [], active = 0;

  const build = () => {
    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);
    back = document.createElement("div");
    back.className = "cmdk-back";
    back.hidden = true;
    back.innerHTML = `
      <div class="cmdk" role="dialog" aria-modal="true" aria-label="통합 검색">
        <div class="cmdk-top">
          <span aria-hidden="true">🔍</span>
          <input class="cmdk-input" type="text" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" autocomplete="off" spellcheck="false" aria-label="통합 검색어" placeholder="오류 코드, 이벤트 ID, 증상, 게임 이름을 입력하세요">
          <button type="button" class="cmdk-esc" aria-label="검색 창 닫기">Esc</button>
        </div>
        <div class="cmdk-body" id="cmdk-list"></div>
        <div class="cmdk-foot"><span class="cmdk-keys">↑ ↓ 이동</span><span class="cmdk-keys">Enter 열기</span><span class="cmdk-keys">Esc 닫기</span><span class="cmdk-count" aria-live="polite"></span></div>
      </div>`;
    document.body.appendChild(back);
    input = back.querySelector(".cmdk-input");
    body = back.querySelector(".cmdk-body");
    count = back.querySelector(".cmdk-count");
    back.addEventListener("mousedown", (e) => { if (e.target === back) closePalette(); });
    back.querySelector(".cmdk-esc").addEventListener("click", closePalette);
    input.addEventListener("input", () => { active = 0; renderPalette(); });
    input.addEventListener("keydown", onKey);
    body.addEventListener("click", (e) => {
      const chip = e.target.closest("[data-cmdk-term]");
      if (!chip) return;
      input.value = chip.dataset.cmdkTerm;
      active = 0;
      renderPalette();
      input.focus();
    });
    body.addEventListener("mousemove", (e) => {
      const row = e.target.closest("[data-cmdk-i]");
      if (!row) return;
      const i = Number(row.dataset.cmdkI);
      if (i !== active) { active = i; markActive(false); }
    });
  };

  const markActive = (scroll) => {
    const rows = Array.from(body.querySelectorAll("[data-cmdk-i]"));
    rows.forEach((el, i) => {
      const on = i === active;
      const row = el.firstElementChild;
      row.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      const enter = el.querySelector(".cmdk-enter");
      if (enter) enter.textContent = on ? "↵" : "";
      if (on) { input.setAttribute("aria-activedescendant", el.id); if (scroll) el.scrollIntoView({ block: "nearest" }); }
    });
  };

  const renderPalette = () => {
    const q = input.value.trim();
    if (!q) {
      matches = [];
      input.removeAttribute("aria-activedescendant");
      body.innerHTML = `<div class="cmdk-label">자주 찾는 증상</div><div class="cmdk-chips">${POPULAR_SEARCHES.map((t) => `<button type="button" class="cmdk-chip" data-cmdk-term="${escapeHtml(t)}">${escapeHtml(t)}</button>`).join("")}</div>`;
      count.textContent = "";
      return;
    }
    const all = window.siteSearchQuery(q, INDEX);
    matches = all.slice(0, 8);
    active = Math.min(active, Math.max(0, matches.length - 1));
    if (!matches.length) {
      input.removeAttribute("aria-activedescendant");
      body.innerHTML = `<div class="cmdk-empty"><strong>"${escapeHtml(q)}"에 맞는 항목이 없어요</strong><span>코드 번호만(예: 41), 증상(예: 느려요)으로 다시 찾아보세요.</span><a class="cmdk-link" href="diagnostic.html">증상으로 진단 시작하기</a><a class="cmdk-link cmdk-link--alt" href="${resultsPageUrl(q)}">다른 표현으로 전체 검색 결과 보기</a></div>`;
      count.textContent = "0개 결과";
      return;
    }
    body.innerHTML = `<ul class="cmdk-list" role="listbox" aria-label="검색 결과">${matches.map((m, i) => `
      <li role="option" id="cmdk-opt-${i}" data-cmdk-i="${i}" aria-selected="false"><a class="cmdk-row" href="${escapeHtml(m.u)}"><span class="cmdk-tag" style="background:${TONES[m.c] || TONES["페이지"]}">${escapeHtml(m.c)}</span><span class="cmdk-title">${escapeHtml(m.t)}</span><span class="cmdk-enter" aria-hidden="true"></span></a></li>`).join("")}</ul>${all.length > matches.length ? `<div class="cmdk-chips"><a class="cmdk-link cmdk-link--alt" href="${resultsPageUrl(q)}">전체 ${all.length}건 결과 보기</a></div>` : ""}`;
    count.textContent = all.length + "개 결과";
    markActive(false);
  };

  function onKey(e) {
    if (e.key === "Escape") { e.preventDefault(); closePalette(); }
    else if (e.key === "ArrowDown" && matches.length) { e.preventDefault(); active = Math.min(active + 1, matches.length - 1); markActive(true); }
    else if (e.key === "ArrowUp" && matches.length) { e.preventDefault(); active = Math.max(active - 1, 0); markActive(true); }
    else if (e.key === "Enter") {
      e.preventDefault();
      if (matches[active]) window.location.href = matches[active].u;
      else if (input.value.trim()) window.location.href = resultsPageUrl(input.value);
    } else if (e.key === "Tab") {
      // 창 안에서만 포커스가 돈다(입력창 ↔ 닫기 버튼 ↔ 아래 링크).
      const f = Array.from(back.querySelectorAll("input,button,a[href]")).filter((el) => el.offsetParent !== null);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  }

  function openPalette() {
    if (!back) build();
    if (!back.hidden) { input.focus(); input.select(); return; }
    prevFocus = document.activeElement;
    back.hidden = false;
    document.documentElement.style.overflow = "hidden";
    active = 0;
    renderPalette();
    input.focus();
    input.select();
  }

  function closePalette() {
    if (!back || back.hidden) return;
    back.hidden = true;
    document.documentElement.style.overflow = "";
    input.value = "";
    if (prevFocus && typeof prevFocus.focus === "function") prevFocus.focus();
  }

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (back && !back.hidden) closePalette(); else openPalette();
    } else if (back && !back.hidden && e.key === "Escape") {
      closePalette();
    }
  });
  // 헤더 검색창에 단축키를 알려 준다(좁은 화면은 자리가 없어 그대로 둔다).
  roots.forEach((root) => {
    const el = root.querySelector("[data-site-search-input]");
    if (el && window.matchMedia && window.matchMedia("(min-width: 900px)").matches) el.placeholder = `${el.placeholder || "검색"} (${hint})`;
  });
})();
