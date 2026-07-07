(() => {
  const data = window.SITE_DATA || { symptoms: [] };

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const diagnosticRoot = document.querySelector("[data-diagnostic-root]");
  if (diagnosticRoot) {
    const cards = data.symptoms.map((item) => `
      <button class="diag-card" data-symptom="${item.id}">
        <span class="diag-title">${item.title}</span>
        <span class="diag-summary">${item.summary}</span>
      </button>
    `).join("");

    diagnosticRoot.innerHTML = `
      <div class="diag-grid">${cards}</div>
      <aside class="result-panel" aria-live="polite">
        <h3>진단 결과</h3>
        <p class="muted">왼쪽에서 증상을 선택해 주세요.</p>
        <div class="result-box" data-result-box>
          <p>선택된 증상에 맞는 원인, 점검 순서, 관련 페이지를 보여줍니다.</p>
        </div>
      </aside>
    `;

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
  }

  const guidesRoot = document.querySelector("[data-guides-root]");
  if (guidesRoot) {
    guidesRoot.innerHTML = data.symptoms.map((item) => `
      <article class="card">
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <ul class="mini-list">
          <li>${item.causes[0]}</li>
          <li>${item.checks[0]}</li>
        </ul>
        <a href="${item.link}">페이지 열기</a>
      </article>
    `).join("");
  }
})();
