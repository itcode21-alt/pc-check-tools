(() => {
  const root = document.querySelector("[data-community-admin]");
  if (!root) return;
  const apiBase = String(window.COMMUNITY_CASES_API_BASE || "").replace(/\/$/, "");
  const login = root.querySelector("[data-community-admin-login]");
  const status = root.querySelector("[data-community-admin-status]");
  const listSection = root.querySelector("[data-community-admin-list]");
  const list = root.querySelector("[data-community-admin-cases]");
  let token = "";
  const setStatus = (message, error = false) => { status.textContent = message; status.classList.toggle("is-error", error); };
  const escapeHtml = (value) => String(value || "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  const headers = () => ({ "Authorization": `Bearer ${token}`, "Content-Type": "application/json" });
  const load = async () => {
    const response = await fetch(`${apiBase}/admin/cases?status=pending`, { headers: headers() });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "대기 사례를 불러오지 못했습니다.");
    listSection.hidden = false;
    if (!payload.cases?.length) { list.innerHTML = '<p class="muted">검토 대기 사례가 없습니다.</p>'; return; }
    list.innerHTML = payload.cases.map((item) => `<article class="community-case-card" data-case-id="${escapeHtml(item.id)}"><p class="eyebrow">${escapeHtml(item.created_at)}</p><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.body).replace(/\n/g, "<br>")}</p>${item.page_url ? `<p><a href="${escapeHtml(item.page_url)}" target="_blank" rel="noopener">관련 페이지 확인 →</a></p>` : ""}<label class="community-admin-note">검토 메모 <input maxlength="300" placeholder="선택: 반려 사유 등"></label><div class="button-row"><button class="button primary" data-review="approved">승인·공개</button><button class="button secondary" data-review="rejected">반려</button></div></article>`).join("");
  };
  login.addEventListener("submit", async (event) => { event.preventDefault(); if (!apiBase) return setStatus("공개 API 주소가 설정되지 않았습니다.", true); token = new FormData(login).get("token"); try { await load(); setStatus("대기 사례를 불러왔습니다."); } catch (error) { token = ""; setStatus(error.message, true); } });
  list.addEventListener("click", async (event) => { const button = event.target.closest("button[data-review]"); if (!button || !token) return; const card = button.closest("[data-case-id]"); const statusValue = button.dataset.review; button.disabled = true; try { const response = await fetch(`${apiBase}/admin/cases/${card.dataset.caseId}`, { method: "PATCH", headers: headers(), body: JSON.stringify({ status: statusValue, note: card.querySelector("input").value }) }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || "검토 상태를 저장하지 못했습니다."); setStatus(statusValue === "approved" ? "사례를 승인해 공개했습니다." : "사례를 반려했습니다."); await load(); } catch (error) { setStatus(error.message, true); button.disabled = false; } });
})();
