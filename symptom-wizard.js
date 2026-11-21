(() => {
  // 증상별 자가진단 공용 엔진 (2026-11-21)
  // 데이터(질문 흐름·단계)는 wizard-*.js가 window.ITSVC_WIZARD.nodes로 제공합니다.
  // 각 결과의 단계는 "직접 해보시겠어요?"를 먼저 묻고, 해본다면 준비물과 자세한 방법을 보여 줍니다.
  // 어렵다고 하거나 준비물이 없거나 limit 단계(분해·교체 시험 등)에 닿으면 문의·수리 요청으로 연결합니다.
  // 화면 구성(4단계 진행 막대, 선택 칩, 단계 목록, 체크리스트, 결과 카드)은 리디자인 시안(SelfCheckFlow)을 따르되,
  // 시안의 원인 후보 퍼센트는 예시 값이라 근거가 없어 넣지 않았습니다. 스타일은 symptom-wizard.css에 있습니다.
  // 입력은 브라우저에서만 처리되며 어디로도 전송하지 않습니다.
  const KAKAO_URL = "https://pf.kakao.com/_xgExbWX/chat";
  const VISIT = "visit";
  const REMOTE = "remote";
  const NODES = (window.ITSVC_WIZARD && window.ITSVC_WIZARD.nodes) || null;
  if (!NODES) return;

  // ── GA4 측정 (2026-11-21) ───────────────────────────────────────────
  // 방문자가 자가진단을 어디까지 따라 하고, 어디서 해결·문의로 갈라지는지 보기 위한 이벤트다.
  // 보내는 값은 자가진단 종류, 질문·결과 id, 단계 번호, 이동 종류뿐이다.
  // 고른 답의 문구, 증상 요약, 복사한 내용, 개인정보는 보내지 않는다.
  //   wizard_start         : 자가진단 시작(entry=direct|guide, from_path=같은 사이트 안 이전 페이지 경로)
  //   wizard_answer        : 질문에 답함(node, answer_index)
  //   wizard_result        : 결과 화면에 도달(node)
  //   wizard_step_try      : "직접 해볼게요" 선택(node, step_index, step_total)
  //   wizard_step_same     : "해봤는데 그대로예요" 선택
  //   wizard_solved        : "해결됐어요" 선택(steps_done = 그대로였던 단계 수)
  //   wizard_contact       : 문의 안내 화면 도달(reason=hard|notools|hard_doing|limit|exhausted)
  //   wizard_contact_click : 문의 관련 클릭(action=kakao|copy|remote|pricing, place=result|step)
  //   wizard_guide_click   : 결과 화면의 가이드 링크 클릭(target_path)
  const WIZ = ((window.location.pathname.split("/").pop() || "").replace(/^pc-/, "").replace(/-check(\.html)?$/, "")) || "unknown";
  const track = (name, params) => {
    try {
      if (typeof window.gtag === "function") {
        window.gtag("event", name, Object.assign({ wizard: WIZ, page_path: window.location.pathname, transport_type: "beacon" }, params));
      }
    } catch (error) { /* 측정 실패는 무시 */ }
  };

  const CTA = {
    [VISIT]: {
      lead: "직접 확인해도 해결되지 않으면 방문 점검을 문의해 주세요. 윈도우가 켜지지 않는 상태라면 원격 연결을 쓰기 어렵습니다. 노트북은 접수 가능 여부와 요금을 먼저 문의해 주세요.",
      price: "방문 출장비 3만원 (고양·파주 4만원, 인천 검단·청라·김포 기준) · 요금 기준은 요금 안내 페이지에서 확인할 수 있습니다.",
      help: { href: "pricing.html", text: "방문 점검 요금 보기" },
    },
    [REMOTE]: {
      lead: "윈도우가 실행되는 증상이라 원격 점검으로 먼저 원인을 확인해 볼 수 있습니다.",
      price: "원격 점검 2만원 · 30분 안에 원인을 찾지 못하면 비용을 받지 않습니다.",
      help: { href: "remote-support.html", text: "도움이 필요해요 (원격 점검)" },
    },
  };

  const STAGES = ["증상 선택", "확인 질문", "직접 해 보기", "결과"];
  const WARN_ICON = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l10 18H2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v5M12 18v.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  const root = document.querySelector("[data-boot-check]");
  if (!root) return;
  root.classList.add("bc-wizard");
  const stage = root.querySelector("[data-stage]");
  const trail = root.querySelector("[data-trail]");
  const backBtn = root.querySelector("[data-back]");
  const resetBtn = root.querySelector("[data-reset]");

  // 4단계 진행 막대(증상 선택 → 확인 질문 → 직접 해 보기 → 결과)
  const stagesEl = document.createElement("ol");
  stagesEl.className = "bc-stages";
  stagesEl.setAttribute("aria-label", "진행 단계");
  root.insertBefore(stagesEl, trail);
  const updateStages = (idx) => {
    stagesEl.innerHTML = STAGES.map((name, i) =>
      `<li class="${i < idx ? "is-done" : i === idx ? "is-cur" : ""}"${i === idx ? ' aria-current="step"' : ""}><span class="bc-stage-bar"></span><span class="bc-stage-name">${i + 1} ${name}</span></li>`
    ).join("");
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let history = [];
  let current = "start";

  // 결과 화면 상태
  let stepIdx = 0;
  let phase = "ask"; // ask(해보시겠어요?) | doing(자세한 방법)
  let outcome = null; // null | solved | contact
  let doneSteps = []; // 해본 단계 제목
  let hardStep = null; // 어렵다고 한 단계
  let memCount = null; // multi | single (메모리가 걸린 결과에서만 묻는다)
  let gpuKind = null; // igpu | noigpu | unknown (그래픽이 걸린 결과에서만 묻는다)

  function renderTrail() {
    if (!history.length) {
      trail.hidden = true;
      trail.innerHTML = "";
      return;
    }
    trail.hidden = false;
    trail.innerHTML = `<span class="bc-trail-label">지금까지 선택</span>` + history.map((h) => `<span class="bc-chip">${esc(h.a)}</span>`).join("");
  }

  function renderQuestion(node) {
    updateStages(history.length === 0 ? 0 : 1);
    const hint = node.hint ? `<p class="bc-hint">${esc(node.hint)}</p>` : "";
    const opts = node.options
      .map((o, i) => `<button type="button" class="bc-option" data-idx="${i}"${o.href ? ' data-link="1"' : ""}><span class="bc-option-t">${esc(o.t)}</span>${o.href ? '<span class="bc-option-sub">다른 자가진단 페이지로 이동합니다</span>' : ""}</button>`)
      .join("");
    stage.innerHTML = `<section class="bc-panel"><p class="bc-qno">${history.length === 0 ? "증상 선택" : `확인 질문 ${history.length}`}</p><h3 class="bc-q" tabindex="-1" data-focus>${esc(node.q)}</h3>${hint}<div class="bc-options">${opts}</div></section>`;
    stage.querySelectorAll(".bc-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const o = node.options[Number(btn.dataset.idx)];
        track("wizard_answer", { node: current, answer_index: Number(btn.dataset.idx) + 1 });
        if (o.href) { window.location.href = o.href; return; }
        history.push({ id: current, a: o.t });
        current = o.next;
        render();
      });
    });
  }

  function summaryText(node) {
    const symptom = history.map((h) => h.a).join(" → ");
    const done = doneSteps.map((t, i) => `${i + 1}. ${t}`);
    const hard = hardStep ? `\n[직접 하기 어려운 단계] ${hardStep}` : "";
    return `[증상] ${symptom}\n[진단 결과] ${node.title}\n[해본 것]\n${done.length ? done.join("\n") : "(아직 없음)"}${hard}\n[결과] 그대로입니다.`;
  }

  function guidesHtml(node) {
    return `<section class="bc-guides"><h4>자세한 방법은 이 가이드에</h4><div class="link-list">${node.guides.map((g) => `<a href="${esc(g.href)}">${esc(g.t)}</a>`).join("")}</div></section>`;
  }

  function helpHtml(node) {
    const cta = CTA[node.mode];
    return `<div class="bc-help"><span class="bc-help-t">따라 하다 막혔나요?</span><span class="bc-help-a"><a class="bc-btn bc-btn--dark" href="${cta.help.href}">${esc(cta.help.text)}</a><a class="bc-btn bc-btn--kakao" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡 문의</a></span></div>`;
  }

  function railHtml(steps, curIdx) {
    const items = steps.map((st, i) => {
      const done = i < doneSteps.length;
      const cur = i === curIdx;
      const label = st.limit ? "맡기는 단계" : st.t;
      const meta = done ? "해 봤지만 그대로" : cur ? "지금 단계" : st.limit ? "전문 점검" : "다음 단계";
      const mark = done ? "✓" : st.limit ? "!" : String(i + 1);
      return `<li class="bc-rail-item${done ? " is-done" : ""}${cur ? " is-cur" : ""}${st.limit ? " is-limit" : ""}"${cur ? ' aria-current="step"' : ""}><span class="bc-rail-mark" aria-hidden="true">${mark}</span><span class="bc-rail-text"><span class="bc-rail-title">${esc(label)}</span><span class="bc-rail-meta">${meta}</span></span></li>`;
    }).join("");
    const pct = steps.length ? Math.round((doneSteps.length / steps.length) * 100) : 0;
    return `<aside class="bc-rail" aria-label="단계 목록"><div class="bc-rail-card"><div class="bc-rail-head"><span>진행 상황</span><b>${doneSteps.length} / ${steps.length}</b></div><div class="bc-progress" role="progressbar" aria-label="진행 상황" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="${doneSteps.length}"><div style="width:${pct}%"></div></div><ol class="bc-rail-list">${items}</ol></div><div class="bc-rail-note"><img src="assets/brand/logo-head.webp" width="40" height="40" alt="" loading="lazy"><span>막히면 언제든 '어려워요'를 눌러 문의로 넘어갈 수 있어요.</span></div></aside>`;
  }

  function renderResult(node) {
    updateStages(outcome ? 3 : 2);
    const head = `<header class="bc-result-head"><p class="bc-qno">진단 결과</p><h3 class="bc-q" tabindex="-1" data-focus>${esc(node.title)}</h3><p class="bc-lead">${esc(node.lead)}</p></header>`;

    if (node.memory && memCount === null) {
      stage.innerHTML = `<section class="bc-panel">${head}
        <div class="bc-step"><p class="bc-ask"><strong>메모리(RAM)가 몇 개 꽂혀 있나요?</strong></p>
          <p class="bc-hint">본체를 열면 메인보드에 길쭉한 막대 모양이 보입니다. 개수에 따라 시험 방법이 달라집니다. 열어 보기 어렵다면 세 번째를 고르세요.</p>
          <div class="bc-options"><button type="button" class="bc-option" data-mem="multi"><span class="bc-option-t">2개 이상 꽂혀 있다</span></button><button type="button" class="bc-option" data-mem="single"><span class="bc-option-t">1개만 꽂혀 있다</span></button><button type="button" class="bc-option" data-mem="single"><span class="bc-option-t">모르겠다 / 열어 보기 어렵다</span></button></div></div></section>`;
      stage.querySelectorAll("[data-mem]").forEach((b) => b.addEventListener("click", () => { memCount = b.dataset.mem; renderResult(node); }));
      return;
    }
    if (node.igpu && gpuKind === null) {
      stage.innerHTML = `<section class="bc-panel">${head}
        <div class="bc-step"><p class="bc-ask"><strong>CPU에 내장 그래픽이 있나요?</strong></p>
          <p class="bc-hint">내장 그래픽이 있으면 그래픽카드를 빼고 메인보드 포트로 시험할 수 있고, 없으면 시험용 그래픽카드가 필요합니다.</p>
          <details class="faq-item"><summary>내장 그래픽이 있는지 확인하는 방법</summary>
            <p><strong>윈도우가 켜질 때</strong></p>
            <ul class="mini-list">
              <li>작업 관리자(Ctrl+Shift+Esc) → 성능 탭에 'GPU' 항목이 둘 이상이고 그중 하나가 Intel UHD·Intel Iris·AMD Radeon Graphics처럼 보이면 내장 그래픽이 있는 것입니다.</li>
              <li>장치 관리자 → 디스플레이 어댑터에 내장 그래픽 이름이 보이는지 봅니다. 다만 BIOS에서 꺼 두면 보이지 않을 수 있습니다.</li>
              <li>설정 > 시스템 > 정보의 '프로세서'에서 CPU 모델명을 확인한 뒤 아래 제조사 사양으로 조회합니다.</li>
            </ul>
            <p><strong>CPU 모델명으로 확인하기</strong></p>
            <ul class="mini-list">
              <li>인텔: 모델명 끝에 F가 붙으면(예: 12400F, 13400KF) 내장 그래픽이 없습니다. 인텔 공식 제품 사양(ARK)의 'Processor Graphics' 항목에서도 확인할 수 있습니다.</li>
              <li>AMD: 제조사 공식 제품 사양의 'Graphics Model' 항목에서 확인합니다. 'Discrete Graphics Card Required' 같은 문구가 있으면 내장 그래픽이 없는 모델입니다. 모델마다 다르니 모델명으로 반드시 조회하세요.</li>
            </ul>
            <p><strong>윈도우가 켜지지 않을 때</strong></p>
            <ul class="mini-list">
              <li>구매 내역, 제품 박스, 견적서에서 CPU 모델명을 찾아 위 방법으로 조회합니다.</li>
              <li>CPU 표면에도 모델명이 인쇄되어 있지만 쿨러를 빼야 보이므로 권하지 않습니다.</li>
              <li>메인보드 뒷면에 HDMI·DP 같은 모니터 포트가 있는지 봅니다. 포트가 없으면 내장 그래픽 출력을 쓸 수 없습니다. 포트가 있어도 CPU가 내장 그래픽이 없는 모델이면 화면이 나오지 않으니, 모델명 확인과 함께 보세요.</li>
            </ul>
          </details>
          <div class="bc-options"><button type="button" class="bc-option" data-gpu="igpu"><span class="bc-option-t">내장 그래픽이 있다</span></button><button type="button" class="bc-option" data-gpu="noigpu"><span class="bc-option-t">내장 그래픽이 없다</span></button><button type="button" class="bc-option" data-gpu="unknown"><span class="bc-option-t">모르겠다</span></button></div></div></section>`;
      stage.querySelectorAll("[data-gpu]").forEach((b) => b.addEventListener("click", () => { gpuKind = b.dataset.gpu; renderResult(node); }));
      return;
    }
    const steps = node.steps.filter((st) => (!st.only || st.only === memCount) && (!st.onlyGpu || st.onlyGpu === gpuKind || gpuKind === "unknown"));
    const warn = node.warn ? `<div class="bc-warn" role="note">${WARN_ICON}<span><b>이럴 땐 직접 하지 마세요.</b> ${esc(node.warn)}</span></div>` : "";
    const focusHead = () => { const f = stage.querySelector("[data-focus]"); if (f) f.focus(); };

    if (outcome === "solved") {
      stage.innerHTML = `<section class="bc-solved"><img src="assets/brand/panda-thumbs-up.webp" width="150" height="150" alt="엄지를 든 아이티판다" loading="lazy">
        <div class="bc-solved-body"><h3 class="bc-q" tabindex="-1" data-focus>해결되어 다행입니다</h3>
          <p>${doneSteps.length ? `${doneSteps.length}단계를 해 본 뒤 해결하셨습니다. ` : ""}같은 증상이 다시 생기면 아래 가이드를 참고하세요. 반복된다면 부품 상태를 확인해 보는 것이 좋습니다.</p>
          <p class="bc-solved-for">${esc(node.title)}</p></div></section>
        ${guidesHtml(node)}`;
      return;
    }

    if (outcome === "contact") {
      const cta = CTA[node.mode];
      const remoteBtn = node.mode === REMOTE ? `<a class="bc-btn bc-btn--brand" href="remote-support.html">원격 점검 안내</a>` : "";
      stage.innerHTML = `<article class="bc-result-card bc-cta">
          <p class="bc-result-eyebrow">${doneSteps.length ? `${doneSteps.length}단계를 해 봤습니다` : "아직 해 본 단계가 없습니다"}</p>
          <h3 class="bc-result-title" tabindex="-1" data-focus>직접 확인하기 어려운 부분은 맡겨 주세요</h3>
          <p class="bc-result-lead">${hardStep ? "직접 하기 어려운 단계는 무리하지 않으셔도 됩니다. 아래에서 문의·수리 요청을 하실 수 있습니다. " : ""}${esc(cta.lead)}</p>
          ${doneSteps.length ? `<ol class="bc-result-done">${doneSteps.map((t) => `<li>${esc(t)}</li>`).join("")}</ol>` : ""}
          <p class="bc-result-price">${esc(cta.price)}</p>
          <p class="bc-result-copyhint">아래 요약을 복사해 카카오톡에 붙여넣으면 상담이 빨라집니다.</p>
          <pre class="bc-summary" data-summary>${esc(summaryText(node))}</pre>
          <div class="bc-result-actions"><button class="bc-btn bc-btn--ghost" type="button" data-copy>증상 요약 복사</button><span class="bc-copy-msg" data-copy-msg aria-live="polite"></span></div>
          <div class="bc-result-actions">
            ${remoteBtn}
            <a class="bc-btn bc-btn--kakao" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 증상 보내기</a>
            <a class="bc-btn bc-btn--ghost" href="pricing.html">요금 안내</a>
          </div>
        </article>
        ${warn}
        ${guidesHtml(node)}`;
      stage.querySelector("[data-copy]").addEventListener("click", async () => {
        const msg = stage.querySelector("[data-copy-msg]");
        try {
          await navigator.clipboard.writeText(stage.querySelector("[data-summary]").textContent);
          msg.textContent = "복사했습니다.";
        } catch {
          msg.textContent = "복사하지 못했습니다. 위 내용을 직접 선택해 복사해 주세요.";
        }
      });
      return;
    }

    const cur = steps[stepIdx];
    const go = (state, reason) => {
      outcome = state;
      if (state === "solved") track("wizard_solved", { node: current, steps_done: doneSteps.length, step_index: stepIdx + 1 });
      else track("wizard_contact", { node: current, reason: reason || "unknown", steps_done: doneSteps.length, step_index: stepIdx + 1 });
      renderResult(node);
      focusHead();
    };
    const wrap = (main) => `${head}${warn}<div class="bc-layout">${railHtml(steps, stepIdx)}<div class="bc-main">${main}</div></div>`;

    // 한계 단계: 직접 하기보다 맡기는 단계
    if (cur.limit) {
      stage.innerHTML = wrap(`<article class="bc-step bc-step--limit"><p class="bc-step-no">여기부터는 맡기는 단계입니다</p><p class="bc-step-title">${esc(cur.t)}</p>
          <div class="bc-actions"><button class="bc-btn bc-btn--brand" type="button" data-contact>문의·수리 요청으로 가기</button><button class="bc-btn bc-btn--green" type="button" data-solved>해결됐어요</button></div></article>
        ${guidesHtml(node)}${helpHtml(node)}`);
      stage.querySelector("[data-contact]").addEventListener("click", () => go("contact", "limit"));
      stage.querySelector("[data-solved]").addEventListener("click", () => go("solved"));
      return;
    }

    const stepNo = `단계 ${stepIdx + 1} / ${steps.length}`;
    const needs = cur.needs ? `<span class="bc-badge">${esc(cur.needs)}</span>` : "";
    const spareHtml = cur.spare
      ? `<p class="bc-spare"><b>점검용 부품 팁</b> ${esc(cur.spare)} 시험용이므로 정상 동작이 확인된 것을 쓰고, 규격이 같은지 먼저 확인하세요.</p>`
      : "";
    const toolsHtml = (cur.tools && cur.tools.length
      ? `<div class="bc-tools"><b>준비물</b><ul class="mini-list">${cur.tools.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
      : `<p class="bc-tools bc-tools--none"><b>준비물</b> 별도 공구나 부품 없이 할 수 있습니다.</p>`) + spareHtml;
    const stepHead = `<header class="bc-step-head"><div class="bc-step-meta"><span class="bc-step-no">${stepNo}${phase === "doing" ? " · 따라 해 보세요" : ""}</span>${needs}</div><h4 class="bc-step-title">${esc(cur.t)}</h4></header>`;

    if (phase === "ask") {
      const hasTools = !!(cur.tools && cur.tools.length);
      const question = hasTools ? "준비물이 있고 직접 해보시겠어요?" : "이 단계를 직접 해보시겠어요?";
      const yes = hasTools ? "준비돼 있어요, 해볼게요" : "직접 해볼게요";
      const noTools = hasTools ? `<button class="bc-btn bc-btn--ghost" type="button" data-notools>준비물이 없어요, 문의할게요</button>` : "";
      stage.innerHTML = wrap(`<article class="bc-step">${stepHead}${toolsHtml}
          <p class="bc-ask">${question}</p>
          <div class="bc-actions"><button class="bc-btn bc-btn--brand" type="button" data-try>${yes}</button>${noTools}<button class="bc-btn bc-btn--ghost" type="button" data-hard>어려워요, 문의할게요</button></div>
          <p class="bc-hint">직접 해볼 수 있는 범위와 가지고 있는 공구는 사람마다 다릅니다. 무리하지 않으셔도 됩니다.</p></article>
        ${guidesHtml(node)}${helpHtml(node)}`);
      stage.querySelector("[data-try]").addEventListener("click", () => { track("wizard_step_try", { node: current, step_index: stepIdx + 1, step_total: steps.length }); phase = "doing"; renderResult(node); const f = stage.querySelector(".bc-step"); if (f) f.scrollIntoView({ block: "nearest" }); });
      stage.querySelector("[data-hard]").addEventListener("click", () => { hardStep = cur.t; go("contact", "hard"); });
      const nt = stage.querySelector("[data-notools]");
      if (nt) nt.addEventListener("click", () => { hardStep = `${cur.t} (준비물이 없음: ${cur.tools.join(", ")})`; go("contact", "notools"); });
      return;
    }

    // doing: 자세한 방법(체크리스트)
    const how = cur.how.map((h, i) => `<li><button type="button" role="checkbox" aria-checked="false" class="bc-sub" data-sub="${i}"><span class="bc-box" aria-hidden="true"></span><span class="bc-sub-text">${esc(h)}</span></button></li>`).join("");
    const note = cur.note ? `<div class="bc-note"><b>참고</b> ${esc(cur.note)}</div>` : "";
    stage.innerHTML = wrap(`<article class="bc-step">${stepHead}${toolsHtml}
        <div class="bc-how-head"><h5>따라 하기</h5><span class="bc-how-count" data-sub-count>0 / ${cur.how.length} 완료</span></div>
        <ol class="bc-how">${how}</ol>${note}
        <p class="bc-ask">해보셨나요?</p>
        <div class="bc-actions"><button class="bc-btn bc-btn--green" type="button" data-solved>해결됐어요</button><button class="bc-btn bc-btn--brand" type="button" data-same>해봤는데 그대로예요</button><button class="bc-btn bc-btn--ghost" type="button" data-hard>하다가 어려워졌어요</button></div></article>
      ${guidesHtml(node)}${helpHtml(node)}`);
    stage.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => {
      b.setAttribute("aria-checked", b.getAttribute("aria-checked") === "true" ? "false" : "true");
      const total = stage.querySelectorAll("[data-sub]").length;
      const on = stage.querySelectorAll('[data-sub][aria-checked="true"]').length;
      stage.querySelector("[data-sub-count]").textContent = `${on} / ${total} 완료`;
    }));
    stage.querySelector("[data-same]").addEventListener("click", () => {
      track("wizard_step_same", { node: current, step_index: stepIdx + 1, step_total: steps.length });
      doneSteps.push(cur.t);
      stepIdx += 1;
      phase = "ask";
      if (stepIdx >= steps.length) go("contact", "exhausted");
      else { renderResult(node); const f = stage.querySelector(".bc-step"); if (f) f.scrollIntoView({ block: "nearest" }); }
    });
    stage.querySelector("[data-solved]").addEventListener("click", () => go("solved"));
    stage.querySelector("[data-hard]").addEventListener("click", () => { hardStep = `${cur.t} (하다가 어려워짐)`; go("contact", "hard_doing"); });
  }

  function render() {
    const node = NODES[current];
    stepIdx = 0;
    phase = "ask";
    outcome = null;
    doneSteps = [];
    hardStep = null;
    memCount = null;
    gpuKind = null;
    if (node.options) renderQuestion(node);
    else {
      track("wizard_result", { node: current });
      renderResult(node);
    }
    renderTrail();
    backBtn.disabled = history.length === 0;
    resetBtn.hidden = history.length === 0;
    const focusEl = stage.querySelector("[data-focus]");
    if (focusEl && history.length) focusEl.focus({ preventScroll: false });
  }

  backBtn.addEventListener("click", () => {
    const last = history.pop();
    if (last) current = last.id;
    render();
  });
  resetBtn.addEventListener("click", () => {
    history = [];
    current = "start";
    render();
  });

  // 문의·가이드 링크 클릭 측정(결과 화면 안의 링크와 복사 버튼)
  stage.addEventListener("click", (event) => {
    const el = event.target && event.target.closest ? event.target.closest("a[href], [data-copy]") : null;
    if (!el) return;
    if (el.matches("[data-copy]")) { track("wizard_contact_click", { node: current, action: "copy", place: "result" }); return; }
    const href = el.getAttribute("href") || "";
    const place = el.closest(".bc-cta") ? "result" : "step";
    if (href.indexOf("pf.kakao.com") !== -1) track("wizard_contact_click", { node: current, action: "kakao", place });
    else if (/^remote-support/.test(href)) track("wizard_contact_click", { node: current, action: "remote", place });
    else if (/^pricing/.test(href)) track("wizard_contact_click", { node: current, action: "pricing", place });
    else if (el.closest(".link-list")) track("wizard_guide_click", { node: current, target_path: href.split("#")[0] });
  });

  // 증상 가이드에서 #n=노드이름 으로 들어오면 해당 질문·결과에서 바로 시작합니다.
  const entry = /[#&]n=([A-Za-z0-9_]+)/.exec(window.location.hash || "");
  if (entry && NODES[entry[1]] && entry[1] !== "start") {
    history = [{ id: "start", a: "증상 가이드에서 바로 이동" }];
    current = entry[1];
  }

  // 같은 사이트 안에서 온 경우에만 이전 페이지 경로를 보낸다(외부 주소는 보내지 않음)
  let fromPath = "none";
  try {
    if (document.referrer) {
      const ref = new URL(document.referrer);
      if (ref.hostname === window.location.hostname) fromPath = ref.pathname;
      else fromPath = "external";
    }
  } catch (error) { /* 무시 */ }
  track("wizard_start", { entry: history.length ? "guide" : "direct", start_node: current, from_path: fromPath });

  render();
})();
