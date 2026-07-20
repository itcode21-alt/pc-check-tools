(() => {
  const root = document.querySelector("[data-community-cases]");
  if (!root) return;

  // 운영자가 별도 설정 파일에 Worker 주소를 넣기 전에는 네트워크 요청을 보내지 않습니다.
  const apiBase = String(window.COMMUNITY_CASES_API_BASE || "").replace(/\/$/, "");
  const form = root.querySelector("[data-community-case-form]");
  const status = root.querySelector("[data-community-case-status]");
  const list = root.querySelector("[data-community-cases-list]");
  const setStatus = (message, isError = false) => {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
  };
  const escapeHtml = (value) => String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);

  const renderCases = (cases) => {
    if (!cases.length) {
      list.innerHTML = '<p class="muted">아직 공개된 사례가 없습니다. 첫 해결 사례를 남겨 주세요.</p>';
      return;
    }
    list.innerHTML = cases.map((item) => `<article class="community-case-card"><p class="eyebrow">검토 완료 · ${escapeHtml(item.created_at.slice(0, 10))}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body).replace(/\n/g, "<br>")}</p>${item.page_url ? `<a href="${escapeHtml(item.page_url)}">관련 가이드 보기 →</a>` : ""}</article>`).join("");
  };

  const loadCases = async () => {
    if (!apiBase) {
      list.innerHTML = '<p class="muted">공개 사례 기능을 준비하고 있습니다. 검토 시스템이 연결되면 이곳에 사례가 표시됩니다.</p>';
      return;
    }
    try {
      const response = await fetch(`${apiBase}/cases?limit=12`);
      if (!response.ok) throw new Error("load failed");
      const payload = await response.json();
      renderCases(Array.isArray(payload.cases) ? payload.cases : []);
    } catch {
      list.innerHTML = '<p class="muted">공개 사례를 잠시 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    }
  };

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
      const response = await fetch(`${apiBase}/cases`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
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
