(() => {
  // 증상별 자가진단 공용 엔진 (2026-11-21)
  // 데이터(질문 흐름·단계)는 wizard-*.js가 window.ITSVC_WIZARD.nodes로 제공합니다.
  // 각 결과의 단계는 "직접 해보시겠어요?"를 먼저 묻고, 해본다면 준비물과 자세한 방법을 보여 줍니다.
  // 어렵다고 하거나 준비물이 없거나 limit 단계(분해·교체 시험 등)에 닿으면 문의·수리 요청으로 연결합니다.
  // 입력은 브라우저에서만 처리되며 어디로도 전송하지 않습니다.
  const KAKAO_URL = "https://pf.kakao.com/_xgExbWX/chat";
  const VISIT = "visit";
  const REMOTE = "remote";
  const NODES = (window.ITSVC_WIZARD && window.ITSVC_WIZARD.nodes) || null;
  if (!NODES) return;

  const CTA = {
    [VISIT]: {
      lead: "직접 확인해도 해결되지 않으면 방문 점검을 문의해 주세요. 윈도우가 켜지지 않는 상태라면 원격 연결을 쓰기 어렵습니다. 노트북은 접수 가능 여부와 요금을 먼저 문의해 주세요.",
      price: "방문 출장비 3만원 (고양·파주 4만원, 인천 검단·청라·김포 기준) · 요금 기준은 요금 안내 페이지에서 확인할 수 있습니다.",
    },
    [REMOTE]: {
      lead: "윈도우가 실행되는 증상이라 원격 점검으로 먼저 원인을 확인해 볼 수 있습니다.",
      price: "원격 점검 2만원 · 30분 안에 원인을 찾지 못하면 비용을 받지 않습니다.",
    },
  };

  const root = document.querySelector("[data-boot-check]");
  if (!root) return;
  const stage = root.querySelector("[data-stage]");
  const trail = root.querySelector("[data-trail]");
  const backBtn = root.querySelector("[data-back]");
  const resetBtn = root.querySelector("[data-reset]");

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
    trail.innerHTML = "<strong>고른 답</strong><ol>" + history.map((h) => `<li>${esc(h.a)}</li>`).join("") + "</ol>";
  }

  function renderQuestion(node) {
    const hint = node.hint ? `<p class="muted">${esc(node.hint)}</p>` : "";
    const opts = node.options
      .map((o, i) => `<button type="button" class="bc-option" data-idx="${i}"${o.href ? ' data-link="1"' : ""}>${esc(o.t)}</button>`)
      .join("");
    stage.innerHTML = `<h3 tabindex="-1" data-focus>${esc(node.q)}</h3>${hint}<div class="bc-options">${opts}</div>`;
    stage.querySelectorAll(".bc-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const o = node.options[Number(btn.dataset.idx)];
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

  function ctaHtml(node, withSummary) {
    const cta = CTA[node.mode];
    const remoteLink = node.mode === REMOTE ? `<a class="btn secondary" href="remote-support.html">원격 점검 안내</a>` : "";
    const summary = withSummary
      ? `<p class="muted">아래 요약을 복사해 카카오톡에 붙여넣으면 상담이 빨라집니다.</p>
         <pre class="bc-summary" data-summary>${esc(summaryText(node))}</pre>
         <div class="button-row"><button class="btn secondary" type="button" data-copy>증상 요약 복사</button><span class="muted" data-copy-msg aria-live="polite"></span></div>`
      : "";
    return `<div class="card bc-cta">
        <h4>직접 해결이 어려우면</h4>
        <p>${esc(cta.lead)}</p>
        <p class="muted">${esc(cta.price)}</p>
        ${summary}
        <div class="button-row">
          <a class="btn primary" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 증상 보내기</a>
          ${remoteLink}
          <a class="btn secondary" href="pricing.html">요금 안내</a>
        </div>
      </div>`;
  }

  function guidesHtml(node) {
    return `<h4>자세한 방법은 이 가이드에</h4><div class="link-list">${node.guides.map((g) => `<a href="${esc(g.href)}">${esc(g.t)}</a>`).join("")}</div>`;
  }

  function renderResult(node) {
    if (node.memory && memCount === null) {
      stage.innerHTML = `<p class="eyebrow">진단 결과</p><h3 tabindex="-1" data-focus>${esc(node.title)}</h3><p>${esc(node.lead)}</p>
        <div class="card bc-step"><p><strong>메모리(RAM)가 몇 개 꽂혀 있나요?</strong></p>
          <p class="muted">본체를 열면 메인보드에 길쭉한 막대 모양이 보입니다. 개수에 따라 시험 방법이 달라집니다. 열어 보기 어렵다면 세 번째를 고르세요.</p>
          <div class="bc-options"><button type="button" class="bc-option" data-mem="multi">2개 이상 꽂혀 있다</button><button type="button" class="bc-option" data-mem="single">1개만 꽂혀 있다</button><button type="button" class="bc-option" data-mem="single">모르겠다 / 열어 보기 어렵다</button></div></div>`;
      stage.querySelectorAll("[data-mem]").forEach((b) => b.addEventListener("click", () => { memCount = b.dataset.mem; renderResult(node); }));
      return;
    }
    if (node.igpu && gpuKind === null) {
      stage.innerHTML = `<p class="eyebrow">진단 결과</p><h3 tabindex="-1" data-focus>${esc(node.title)}</h3><p>${esc(node.lead)}</p>
        <div class="card bc-step"><p><strong>CPU에 내장 그래픽이 있나요?</strong></p>
          <p class="muted">내장 그래픽이 있으면 그래픽카드를 빼고 메인보드 포트로 시험할 수 있고, 없으면 시험용 그래픽카드가 필요합니다.</p>
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
          <div class="bc-options"><button type="button" class="bc-option" data-gpu="igpu">내장 그래픽이 있다</button><button type="button" class="bc-option" data-gpu="noigpu">내장 그래픽이 없다</button><button type="button" class="bc-option" data-gpu="unknown">모르겠다</button></div></div>`;
      stage.querySelectorAll("[data-gpu]").forEach((b) => b.addEventListener("click", () => { gpuKind = b.dataset.gpu; renderResult(node); }));
      return;
    }
    const steps = node.steps.filter((st) => (!st.only || st.only === memCount) && (!st.onlyGpu || st.onlyGpu === gpuKind || gpuKind === "unknown"));
    const head = `<p class="eyebrow">진단 결과</p><h3 tabindex="-1" data-focus>${esc(node.title)}</h3><p>${esc(node.lead)}</p>`;
    const warn = node.warn ? `<div class="callout"><strong>이럴 땐 직접 하지 마세요</strong><p>${esc(node.warn)}</p></div>` : "";
    const focusHead = () => { const f = stage.querySelector("[data-focus]"); if (f) f.focus(); };

    if (outcome === "solved") {
      stage.innerHTML = `${head}
        <div class="callout"><strong>해결되어 다행입니다</strong><p>같은 증상이 다시 생기면 아래 가이드를 참고하세요. 반복된다면 부품 상태를 확인해 보는 것이 좋습니다.</p></div>
        ${guidesHtml(node)}`;
      return;
    }

    if (outcome === "contact") {
      stage.innerHTML = `${head}
        <h4>여기까지 진행하셨습니다</h4>
        ${hardStep ? `<p class="muted">직접 하기 어려운 단계는 무리하지 않으셔도 됩니다. 아래에서 문의·수리 요청을 하실 수 있습니다.</p>` : ""}
        <ol class="mini-list">${doneSteps.map((t) => `<li>${esc(t)}</li>`).join("") || "<li>해본 단계가 없습니다.</li>"}</ol>
        ${warn}
        ${ctaHtml(node, true)}
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
    const doneHtml = doneSteps.map((t) => `<li class="bc-done"><span aria-hidden="true">✓</span> ${esc(t)}</li>`).join("");
    const doneList = doneHtml ? `<ul class="bc-donelist">${doneHtml}</ul>` : "";
    const quick = `<p class="muted bc-quick">바로 상담이 필요하면 <a href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡 문의</a> · <a href="pricing.html">요금 안내</a></p>`;
    const go = (state) => { outcome = state; renderResult(node); focusHead(); };

    // 한계 단계: 직접 하기보다 맡기는 단계
    if (cur.limit) {
      stage.innerHTML = `${head}${warn}${doneList}
        <div class="card bc-step"><p class="eyebrow">여기부터는 맡기는 단계입니다</p><p>${esc(cur.t)}</p>
          <div class="button-row"><button class="btn primary" type="button" data-contact>문의·수리 요청으로 가기</button><button class="btn secondary" type="button" data-solved>해결됐어요</button></div></div>
        ${guidesHtml(node)}${quick}`;
      stage.querySelector("[data-contact]").addEventListener("click", () => go("contact"));
      stage.querySelector("[data-solved]").addEventListener("click", () => go("solved"));
      return;
    }

    const eyebrow = `단계 ${stepIdx + 1} / ${steps.length}`;
    const needs = cur.needs ? `<p class="muted bc-needs">${esc(cur.needs)}</p>` : "";
    const spareHtml = cur.spare
      ? `<p class="bc-spare"><strong>점검용 부품 팁</strong> ${esc(cur.spare)} 시험용이므로 정상 동작이 확인된 것을 쓰고, 규격이 같은지 먼저 확인하세요.</p>`
      : "";
    const toolsHtml = (cur.tools && cur.tools.length
      ? `<div class="bc-tools"><strong>준비물</strong><ul class="mini-list">${cur.tools.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
      : `<p class="muted bc-tools"><strong>준비물</strong> 별도 공구나 부품 없이 할 수 있습니다.</p>`) + spareHtml;

    if (phase === "ask") {
      const hasTools = !!(cur.tools && cur.tools.length);
      const question = hasTools ? "준비물이 있고 직접 해보시겠어요?" : "이 단계를 직접 해보시겠어요?";
      const yes = hasTools ? "준비돼 있어요, 해볼게요" : "직접 해볼게요";
      const noTools = hasTools ? `<button class="btn secondary" type="button" data-notools>준비물이 없어요, 문의할게요</button>` : "";
      stage.innerHTML = `${head}${warn}${doneList}
        <div class="card bc-step"><p class="eyebrow">${eyebrow}</p>
          <p><strong>${esc(cur.t)}</strong></p>${needs}${toolsHtml}
          <p>${question}</p>
          <div class="button-row"><button class="btn primary" type="button" data-try>${yes}</button>${noTools}<button class="btn secondary" type="button" data-hard>어려워요, 문의할게요</button></div>
          <p class="muted">직접 해볼 수 있는 범위와 가지고 있는 공구는 사람마다 다릅니다. 무리하지 않으셔도 됩니다.</p></div>
        ${guidesHtml(node)}${quick}`;
      stage.querySelector("[data-try]").addEventListener("click", () => { phase = "doing"; renderResult(node); const f = stage.querySelector(".bc-step"); if (f) f.scrollIntoView({ block: "nearest" }); });
      stage.querySelector("[data-hard]").addEventListener("click", () => { hardStep = cur.t; go("contact"); });
      const nt = stage.querySelector("[data-notools]");
      if (nt) nt.addEventListener("click", () => { hardStep = `${cur.t} (준비물이 없음: ${cur.tools.join(", ")})`; go("contact"); });
      return;
    }

    // doing: 자세한 방법
    const how = cur.how.map((h) => `<li>${esc(h)}</li>`).join("");
    const note = cur.note ? `<div class="callout"><strong>참고</strong><p>${esc(cur.note)}</p></div>` : "";
    stage.innerHTML = `${head}${warn}${doneList}
      <div class="card bc-step"><p class="eyebrow">${eyebrow} · 따라 해 보세요</p>
        <p><strong>${esc(cur.t)}</strong></p>${needs}${toolsHtml}
        <ol class="mini-list bc-how">${how}</ol>${note}
        <p>해보셨나요?</p>
        <div class="button-row"><button class="btn primary" type="button" data-same>해봤는데 그대로예요</button><button class="btn secondary" type="button" data-solved>해결됐어요</button><button class="btn secondary" type="button" data-hard>하다가 어려워졌어요</button></div></div>
      ${guidesHtml(node)}${quick}`;
    stage.querySelector("[data-same]").addEventListener("click", () => {
      doneSteps.push(cur.t);
      stepIdx += 1;
      phase = "ask";
      if (stepIdx >= steps.length) go("contact");
      else { renderResult(node); const f = stage.querySelector(".bc-step"); if (f) f.scrollIntoView({ block: "nearest" }); }
    });
    stage.querySelector("[data-solved]").addEventListener("click", () => go("solved"));
    stage.querySelector("[data-hard]").addEventListener("click", () => { hardStep = `${cur.t} (하다가 어려워짐)`; go("contact"); });
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
    else renderResult(node);
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

  render();
})();
