(() => {
  const data = window.SITE_DATA || { symptoms: [] };
  const storageKey = "pc_recent_error_codes";
  const normalizeCode = (value) => String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^BUGCHECK:/, "")
    .replace(/^IRQL_NOT_LESS_OR_EQUAL:?/, "")
    .replace(/^0X/, "0x")
    .replace(/[^0-9A-Fx]/g, "");

  const findErrorCode = (value) => {
    const normalized = normalizeCode(value);
    if (!normalized) return null;
    return (data.errorCodes || []).find((item) => {
      const current = normalizeCode(item.code);
      const aliases = (item.aliases || []).map(normalizeCode);
      return current === normalized || aliases.includes(normalized);
    }) || null;
  };
  const getErrorCodeLabel = (item) => `${item.code} · ${item.title}`;
  const getErrorCodeMatches = (query) => {
    const normalized = normalizeCode(query);
    if (!normalized) return (data.errorCodes || []).slice(0, 6);
    return (data.errorCodes || []).filter((item) => {
      const searchable = [
        item.code,
        item.title,
        item.summary,
        ...(item.aliases || [])
      ].join(" ").toUpperCase();
      return searchable.includes(normalized.toUpperCase()) || normalizeCode(item.code).includes(normalized);
    }).slice(0, 6);
  };
  const readRecentCodes = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]").filter(Boolean);
    } catch {
      return [];
    }
  };
  const writeRecentCodes = (code) => {
    try {
      const next = readRecentCodes().filter((item) => item !== code);
      next.unshift(code);
      localStorage.setItem(storageKey, JSON.stringify(next.slice(0, 5)));
    } catch {
      // Ignore storage failures.
    }
  };
  const renderExampleTiles = (code) => {
    const examples = code.examples || [
      `${code.code} 관련 증상이 부팅 또는 작업 중 반복됨`,
      `${(code.causes && code.causes[0]) || "가장 가능성 높은 원인"} 확인 필요`,
      `${(code.checks && code.checks[0]) || "첫 점검 항목"}부터 진행`
    ];
    return `
      <div class="example-grid">
        ${examples.map((value, index) => `
          <div class="example-tile">
            <span class="example-index">${index + 1}</span>
            <strong>${value}</strong>
          </div>
        `).join("")}
      </div>
    `;
  };

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const detailRoot = document.querySelector("[data-error-code-page]");
  if (detailRoot) {
    const code = findErrorCode(detailRoot.dataset.errorCodePage);
    if (code) {
      const relatedSymptom = (data.symptoms || []).find((item) => item.link === code.relatedSymptom);
      detailRoot.innerHTML = `
        <p class="eyebrow">에러 코드 상세</p>
        <h2>${code.code} · ${code.title}</h2>
        <p class="lead">${code.summary}</p>
        <div class="detail-grid">
          <section class="card">
            <h3>가능성 높은 원인</h3>
            <ul class="mini-list">${code.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
          </section>
          <section class="card">
            <h3>첫 점검 항목</h3>
            <ol class="mini-list">${code.checks.map((value) => `<li>${value}</li>`).join("")}</ol>
          </section>
        </div>
        <section class="card screenshot-card">
          <h3>화면 예시</h3>
          <p class="muted">실제 캡처 대신, 자주 보이는 상황을 한눈에 보기 쉽게 정리했습니다.</p>
          ${renderExampleTiles(code)}
        </section>
        <section class="card">
          <h3>관련 증상 진단</h3>
          <p>${relatedSymptom ? relatedSymptom.summary : "같은 계열 증상 진단으로 연결됩니다."}</p>
          <p><a href="${code.relatedSymptom || code.link}">연결된 증상 페이지 열기</a></p>
        </section>
        <section class="card">
          <h3>바로 다른 코드 찾기</h3>
          <p><a href="diagnostic.html">진단 도구로 돌아가기</a></p>
        </section>
      `;
    }
  }

  const diagnosticRoot = document.querySelector("[data-diagnostic-root]");
  if (diagnosticRoot) {
    const cards = data.symptoms.map((item) => `
      <button class="diag-card" data-symptom="${item.id}">
        <span class="diag-title">${item.title}</span>
        <span class="diag-summary">${item.summary}</span>
      </button>
    `).join("");

    diagnosticRoot.innerHTML = `
      <section class="code-panel">
        <div class="code-panel-head">
          <div>
            <p class="eyebrow">에러 코드 입력</p>
            <h3>코드를 넣으면 흔한 원인을 바로 보여줍니다</h3>
          </div>
          <p class="muted">예: 0xC000021A, 0x0000007B, 0x80070002</p>
        </div>
        <div class="code-search">
          <label class="sr-only" for="error-code-input">에러 코드</label>
          <input id="error-code-input" class="code-input" type="text" placeholder="에러 코드 입력" inputmode="text" autocomplete="off">
          <div class="code-actions">
            <button class="button primary code-button" type="button" data-code-search>확인</button>
            <button class="button secondary code-button" type="button" data-code-clear>지우기</button>
          </div>
        </div>
        <div class="code-suggestions" data-code-suggestions hidden></div>
        <div class="code-history" data-code-history hidden></div>
        <div class="code-result result-box" data-code-result>
          <p>코드를 입력하면 관련 원인과 첫 점검 항목이 표시됩니다.</p>
        </div>
      </section>
      <div class="diag-grid">${cards}</div>
      <aside class="result-panel" aria-live="polite">
        <h3>진단 결과</h3>
        <p class="muted">왼쪽에서 증상을 선택하거나 위에 에러 코드를 입력해 주세요.</p>
        <div class="result-box" data-result-box>
          <p>선택된 증상에 맞는 원인, 점검 순서, 관련 페이지를 보여줍니다.</p>
        </div>
      </aside>
    `;

    const codeInput = diagnosticRoot.querySelector("#error-code-input");
    const suggestionsBox = diagnosticRoot.querySelector("[data-code-suggestions]");
    const historyBox = diagnosticRoot.querySelector("[data-code-history]");
    const codeResult = diagnosticRoot.querySelector("[data-code-result]");
    const renderRecentHistory = () => {
      const recent = readRecentCodes();
      if (!recent.length) {
        historyBox.hidden = true;
        historyBox.innerHTML = "";
        return;
      }
      historyBox.innerHTML = `
        <div class="history-head">
          <span class="eyebrow">최근 검색</span>
          <button type="button" class="history-clear" data-history-clear>비우기</button>
        </div>
        <div class="history-list">
          ${recent.map((value) => `
            <button type="button" class="history-item" data-code-value="${value}">${value}</button>
          `).join("")}
        </div>
      `;
      historyBox.hidden = false;
    };
    const renderCodeResult = (rawValue) => {
      const code = findErrorCode(rawValue);
      if (!code) {
        codeResult.innerHTML = `
          <p><strong>일치하는 코드가 없습니다.</strong></p>
          <p class="muted">입력 형식을 다시 확인하거나 증상 선택 진단을 이용해 주세요.</p>
        `;
        return;
      }

      writeRecentCodes(code.code);
      renderRecentHistory();
      codeResult.innerHTML = `
        <h4>${code.code} · ${code.title}</h4>
        <p>${code.summary}</p>
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${code.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>첫 점검 항목</strong></p>
        <ol>${code.checks.map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${code.detailPage || code.link}">연결된 상세 가이드 열기</a></p>
      `;
    };
    const clearSearch = () => {
      codeInput.value = "";
      suggestionsBox.hidden = true;
      suggestionsBox.innerHTML = "";
      codeResult.innerHTML = `<p>코드를 입력하면 관련 원인과 첫 점검 항목이 표시됩니다.</p>`;
    };
    const renderSuggestions = (rawValue) => {
      const matches = getErrorCodeMatches(rawValue);
      if (!matches.length) {
        suggestionsBox.hidden = true;
        suggestionsBox.innerHTML = "";
        return;
      }
      suggestionsBox.innerHTML = matches.map((item) => `
        <button type="button" class="suggestion-item" data-code-value="${item.code}">
          <strong>${getErrorCodeLabel(item)}</strong>
          <span>${item.title}</span>
        </button>
      `).join("");
      suggestionsBox.hidden = false;
    };

    diagnosticRoot.querySelector("[data-code-search]").addEventListener("click", () => {
      renderCodeResult(codeInput.value);
    });
    diagnosticRoot.querySelector("[data-code-clear]").addEventListener("click", clearSearch);

    codeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        renderCodeResult(codeInput.value);
        suggestionsBox.hidden = true;
      }
      if (event.key === "Escape") {
        suggestionsBox.hidden = true;
      }
    });
    codeInput.addEventListener("input", () => {
      renderSuggestions(codeInput.value);
    });
    codeInput.addEventListener("focus", () => {
      renderSuggestions(codeInput.value);
    });

    suggestionsBox.addEventListener("click", (event) => {
      const item = event.target.closest("[data-code-value]");
      if (!item) return;
      codeInput.value = item.dataset.codeValue;
      suggestionsBox.hidden = true;
      renderCodeResult(codeInput.value);
    });
    historyBox.addEventListener("click", (event) => {
      const item = event.target.closest("[data-code-value]");
      if (item) {
        codeInput.value = item.dataset.codeValue;
        suggestionsBox.hidden = true;
        renderCodeResult(codeInput.value);
        return;
      }
      if (event.target.closest("[data-history-clear]")) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore storage failures.
        }
        renderRecentHistory();
      }
    });

    diagnosticRoot.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-symptom]");
      if (!btn) return;
      const symptom = data.symptoms.find((item) => item.id === btn.dataset.symptom);
      if (!symptom) return;
      const box = diagnosticRoot.querySelector("[data-result-box]");
      box.innerHTML = `
        <h4>${symptom.title}</h4>
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${symptom.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>권장 점검 순서</strong></p>
        <ol>${symptom.checks.map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${symptom.link}">자세한 가이드 열기</a></p>
      `;
      diagnosticRoot.querySelectorAll(".diag-card").forEach((card) => card.classList.toggle("active", card.dataset.symptom === symptom.id));
    });

    renderRecentHistory();
  }

  const guidesRoot = document.querySelector("[data-guides-root]");
  if (guidesRoot) {
    const errorLinks = (data.errorCodes || []).map((item) => `
      <article class="card code-card">
        <h3>${item.code}</h3>
        <p>${getErrorCodeLabel(item)}</p>
        <p class="muted">${item.summary}</p>
        <a href="${item.detailPage || item.link}">상세 페이지</a>
      </article>
    `).join("");
    guidesRoot.innerHTML = `
      <div class="card-grid">${data.symptoms.map((item) => `
      <article class="card">
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <ul class="mini-list">
          <li>${item.causes[0]}</li>
          <li>${item.checks[0]}</li>
        </ul>
        <a href="${item.link}">페이지 열기</a>
      </article>
      `).join("")}</div>
      <h3 class="section-subtitle">에러 코드 바로가기</h3>
      <div class="card-grid">${errorLinks}</div>
    `;
  }
})();
