/* 내 PC 사양에 맞는 Ollama 모델 추천 — VRAM·RAM으로 들어가는 모델과 할 수 있는 작업을 고른다.
   모델 목록·파일 크기·기능 표시(tools·thinking·vision 등)는 Ollama 모델 라이브러리의 태그 목록과 모델 페이지에서
   2026-11-23에 직접 읽은 값이다(기본 태그 기준). 라이브러리는 계속 바뀌므로 분기마다 다시 확인한다.
   판정 규칙
   - 파일 크기 × 1.2 ≤ VRAM : 여유 있게 들어감. Hugging Face 메모리 추정 문서가 "추론에서는 로딩 크기에 최대 약 20% 추가"라고
     안내한 값을 쓴다. 컨텍스트가 쓰는 메모리는 모델마다 달라 포함하지 못한다.
   - 파일 크기 ≤ VRAM < 파일 크기 × 1.2 : 겨우 들어감(컨텍스트 여유 작음).
   - 그 밖에는 VRAM에 안 들어감. Ollama 문서는 CPU로 일부가 넘어가는 상태를 피하라고 안내한다.
   - 느려도 괜찮을 때의 후보(CPU·RAM 사용)는 이 도구 자체의 어림 기준이다(문서 근거 없음):
     파일 크기 × 1.2 ≤ RAM × 0.5 (운영체제·다른 프로그램 몫으로 RAM의 절반은 남긴다).
   속도, 한국어 품질, 답변 품질은 판단하지 않는다. 참고용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ItsvcOllamaPicker = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var DATA_DATE = "2026-11-23";
  var OVERHEAD = 1.2;      // Hugging Face 문서: 추론 시 로딩 크기에 최대 약 20% 추가
  var RAM_SHARE = 0.5;     // 이 도구의 자체 기준: 모델은 RAM의 절반까지만 쓴다고 본다

  // 기능 표시: tools=도구 호출, thinking=추론 모드, vision=이미지 입력, code=코드 특화, embedding=문서 검색용 임베딩
  // [이름, 태그, 파일 크기(GB), 기능 목록]
  var MODELS = [
    ["llama3.2", "1b", 1.3, ["tools"]],
    ["llama3.2", "3b", 2.0, ["tools"]],
    ["gemma3", "1b", 0.806, []],
    ["gemma3", "4b", 3.4, ["vision"]],
    ["gemma3", "12b", 8.2, ["vision"]],
    ["gemma3", "27b", 17, ["vision"]],
    ["gemma4", "e2b", 4.6, ["vision", "tools", "thinking"]],
    ["gemma4", "e4b", 6.6, ["vision", "tools", "thinking"]],
    ["gemma4", "12b", 7.7, ["vision", "tools", "thinking"]],
    ["gemma4", "26b", 16, ["vision", "tools", "thinking"]],
    ["gemma4", "31b", 19, ["vision", "tools", "thinking"]],
    ["qwen3", "1.7b", 1.4, ["tools", "thinking"]],
    ["qwen3", "4b", 2.5, ["tools", "thinking"]],
    ["qwen3", "8b", 5.2, ["tools", "thinking"]],
    ["qwen3", "14b", 9.3, ["tools", "thinking"]],
    ["qwen3", "30b", 19, ["tools", "thinking"]],
    ["qwen3", "32b", 20, ["tools", "thinking"]],
    ["qwen3.5", "2b", 2.7, ["vision", "tools", "thinking"]],
    ["qwen3.5", "4b", 3.3, ["vision", "tools", "thinking"]],
    ["qwen3.5", "9b", 6.6, ["vision", "tools", "thinking"]],
    ["qwen3.5", "27b", 17, ["vision", "tools", "thinking"]],
    ["qwen3.5", "35b", 22, ["vision", "tools", "thinking"]],
    ["qwen3.6", "27b", 18, ["vision", "tools", "thinking"]],
    ["qwen3.6", "35b", 23, ["vision", "tools", "thinking"]],
    ["qwen3-vl", "4b", 3.3, ["vision", "tools", "thinking"]],
    ["qwen3-vl", "8b", 6.2, ["vision", "tools", "thinking"]],
    ["qwen3-vl", "30b", 20, ["vision", "tools", "thinking"]],
    ["qwen3-vl", "32b", 21, ["vision", "tools", "thinking"]],
    ["qwen2.5vl", "7b", 6.0, ["vision"]],
    ["llama3.2-vision", "11b", 7.8, ["vision"]],
    ["llama3.1", "8b", 4.9, ["tools"]],
    ["mistral", "7b", 4.4, ["tools"]],
    ["qwen2.5", "3b", 1.9, ["tools"]],
    ["qwen2.5", "7b", 4.7, ["tools"]],
    ["qwen2.5", "14b", 9.0, ["tools"]],
    ["qwen2.5", "32b", 20, ["tools"]],
    ["deepseek-r1", "7b", 4.7, ["tools", "thinking"]],
    ["deepseek-r1", "8b", 5.2, ["tools", "thinking"]],
    ["deepseek-r1", "14b", 9.0, ["tools", "thinking"]],
    ["deepseek-r1", "32b", 20, ["tools", "thinking"]],
    ["phi4", "14b", 9.1, []],
    ["gpt-oss", "20b", 14, ["tools", "thinking"]],
    ["qwen2.5-coder", "7b", 4.7, ["tools", "code"]],
    ["qwen2.5-coder", "14b", 9.0, ["tools", "code"]],
    ["qwen2.5-coder", "32b", 20, ["tools", "code"]],
    ["qwen3-coder", "30b", 19, ["tools", "code"]],
    ["nomic-embed-text", "latest", 0.274, ["embedding"]],
    ["bge-m3", "567m", 1.2, ["embedding"]],
    ["qwen3-embedding", "0.6b", 0.639, ["embedding"]],
    ["qwen3-embedding", "4b", 2.5, ["embedding"]]
  ].map(function (m) {
    var tag = m[1] === "latest" ? "" : ":" + m[1];
    return { name: m[0], tag: m[1], id: m[0] + tag, sizeGB: m[2], caps: m[3], chat: m[3].indexOf("embedding") < 0 };
  });

  // NVIDIA GeForce 데스크톱 카드의 표준 메모리 구성(NVIDIA 공식 비교표, 2026-11-23). 같은 이름에 두 가지 판이 있는 카드는 나눠 적었다.
  var GPUS = [
    ["RTX 5090", 32], ["RTX 5080", 16], ["RTX 5070 Ti", 16], ["RTX 5070", 12], ["RTX 5060 Ti (16GB판)", 16], ["RTX 5060 Ti (8GB판)", 8], ["RTX 5060", 8], ["RTX 5050", 8],
    ["RTX 4090", 24], ["RTX 4080 SUPER", 16], ["RTX 4080", 16], ["RTX 4070 Ti SUPER", 16], ["RTX 4070 Ti", 12], ["RTX 4070 SUPER", 12], ["RTX 4070", 12],
    ["RTX 4060 Ti (16GB판)", 16], ["RTX 4060 Ti (8GB판)", 8], ["RTX 4060", 8],
    ["RTX 3090 Ti", 24], ["RTX 3090", 24], ["RTX 3080 Ti", 12], ["RTX 3080 (12GB판)", 12], ["RTX 3080 (10GB판)", 10], ["RTX 3070 Ti", 8], ["RTX 3070", 8], ["RTX 3060 Ti", 8],
    ["RTX 3060 (12GB판)", 12], ["RTX 3060 (8GB판)", 8], ["RTX 3050 (8GB판)", 8], ["RTX 3050 (6GB판)", 6]
  ].map(function (g) { return { name: g[0], vramGB: g[1] }; });

  var CAP_TEXT = {
    chat: "일반 대화·질문 답변·글 요약",
    tools: "도구 호출(함수 호출) — 에이전트·자동화 연동",
    thinking: "단계적 추론(thinking) 모드",
    vision: "이미지 입력 이해(사진·스크린샷 설명)",
    code: "코드 작성·수정에 특화",
    embedding: "문서 검색·RAG용 임베딩(대화용 아님)"
  };
  var TASK_ORDER = ["chat", "tools", "thinking", "vision", "code", "embedding"];

  function fitOf(m, vramGB, ramGB) {
    var need = m.sizeGB * OVERHEAD, eps = 1e-9; // 부동소수점 경계 오차 방지(예: 10 × 1.2)
    if (vramGB > 0 && need <= vramGB + eps) return "comfortable";
    if (vramGB > 0 && m.sizeGB <= vramGB + eps) return "tight";
    if (need <= ramGB * RAM_SHARE + eps) return "cpu";
    return "none";
  }
  function capsOf(m) { return (m.chat ? ["chat"] : []).concat(m.caps.filter(function (c) { return c !== "chat"; })); }

  // o = { vramGB: 0 이상 숫자(0은 GPU 없음·내장 그래픽), ramGB: 숫자 }
  function recommend(o) {
    var vram = Math.max(0, Number(o.vramGB) || 0), ram = Math.max(0, Number(o.ramGB) || 0);
    var groups = { comfortable: [], tight: [], cpu: [], none: [] };
    MODELS.forEach(function (m) {
      var f = fitOf(m, vram, ram);
      groups[f].push({ id: m.id, name: m.name, tag: m.tag, sizeGB: m.sizeGB, caps: capsOf(m), fit: f, command: "ollama run " + m.id });
    });
    Object.keys(groups).forEach(function (k) { groups[k].sort(function (a, b) { return b.sizeGB - a.sizeGB || a.id.localeCompare(b.id); }); });
    // 작업별로 "여유 있게 들어가는" 모델 중 큰 것부터 최대 3개. GPU가 없으면 CPU 후보에서 고른다.
    var pool = vram > 0 ? groups.comfortable : groups.cpu;
    var tasks = TASK_ORDER.map(function (t) {
      var list = pool.filter(function (m) { return m.caps.indexOf(t) >= 0; });
      var tightList = vram > 0 ? groups.tight.filter(function (m) { return m.caps.indexOf(t) >= 0; }) : [];
      return { task: t, label: CAP_TEXT[t], models: list.slice(0, 3), tightModels: list.length ? [] : tightList.slice(0, 2) };
    });
    var best = pool.filter(function (m) { return m.caps.indexOf("chat") >= 0; })[0] || null;
    return { vramGB: vram, ramGB: ram, usesGpu: vram > 0, groups: groups, tasks: tasks, best: best,
      ramWarn: ram > 0 && ram < 16, dataDate: DATA_DATE };
  }

  function fmtSize(gb) { return gb < 1 ? Math.round(gb * 1000) + "MB" : (Math.round(gb * 10) / 10) + "GB"; }

  function init() {
    var form = document.getElementById("op-form");
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var vramSel = $("op-vram"), ramSel = $("op-ram"), cardSel = $("op-card");
    GPUS.forEach(function (g) {
      var o = document.createElement("option"); o.value = String(g.vramGB); o.textContent = g.name + " — VRAM " + g.vramGB + "GB"; cardSel.appendChild(o);
    });
    cardSel.addEventListener("change", function () {
      if (cardSel.value) vramSel.value = cardSel.value;
    });
    vramSel.addEventListener("change", function () { cardSel.value = ""; });

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    function chips(caps) {
      var wrap = el("span", "op-chips");
      caps.forEach(function (c) { wrap.appendChild(el("span", "op-chip op-chip--" + c, { chat: "대화", tools: "도구 호출", thinking: "추론", vision: "이미지", code: "코드", embedding: "임베딩" }[c])); });
      return wrap;
    }
    function table(list) {
      var wrap = el("div", "table-wrap"), t = document.createElement("table");
      var head = document.createElement("thead"), hr = document.createElement("tr");
      ["모델", "파일 크기", "할 수 있는 일", "받는 명령"].forEach(function (h) { hr.appendChild(el("th", null, h)); });
      head.appendChild(hr); t.appendChild(head);
      var body = document.createElement("tbody");
      list.forEach(function (m) {
        var tr = document.createElement("tr");
        tr.appendChild(el("td", null, m.id));
        tr.appendChild(el("td", null, fmtSize(m.sizeGB)));
        var td = document.createElement("td"); td.appendChild(chips(m.caps)); tr.appendChild(td);
        var cmd = document.createElement("td"); cmd.appendChild(el("code", null, m.command)); tr.appendChild(cmd);
        body.appendChild(tr);
      });
      t.appendChild(body); wrap.appendChild(t); return wrap;
    }
    function section(title, note, list) {
      var d = el("div", "op-group");
      d.appendChild(el("h4", null, title + " (" + list.length + "개)"));
      if (note) d.appendChild(el("p", "muted", note));
      if (list.length) d.appendChild(table(list)); else d.appendChild(el("p", "muted", "해당하는 모델이 목록에 없습니다."));
      return d;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var r = recommend({ vramGB: Number(vramSel.value), ramGB: Number(ramSel.value) });
      var out = $("op-result"); out.hidden = false; out.textContent = "";
      var hero = el("div", "card calc-hero");
      hero.appendChild(el("p", "hero-label", r.usesGpu ? "GPU에 여유 있게 들어가는 가장 큰 대화 모델" : "GPU 없이 CPU·RAM으로 돌려 볼 수 있는 가장 큰 대화 모델"));
      hero.appendChild(el("p", "hero-main", r.best ? r.best.id + " (" + fmtSize(r.best.sizeGB) + ")" : "추천할 모델이 없습니다"));
      hero.appendChild(el("p", "hero-sub", "VRAM " + (r.vramGB || "없음") + (r.vramGB ? "GB" : "") + " · RAM " + r.ramGB + "GB 기준. 파일 크기만 본 계산이라 컨텍스트가 쓰는 메모리와 속도는 반영하지 않았습니다."));
      var stats = el("div", "hero-stats");
      [["여유 있게 들어감", r.groups.comfortable.length], ["겨우 들어감", r.groups.tight.length], ["느려도 되면(CPU·RAM)", r.groups.cpu.length]].forEach(function (s) {
        var d = el("div", "hero-stat"); d.appendChild(el("span", null, s[0])); d.appendChild(el("b", null, s[1] + "개")); stats.appendChild(d);
      });
      hero.appendChild(stats);
      if (r.ramWarn) hero.appendChild(el("p", "muted", "RAM이 16GB보다 적습니다. LM Studio 공식 문서는 Windows에서 RAM 16GB 이상을 권장합니다."));
      out.appendChild(hero);

      var taskCard = el("section", "card");
      taskCard.appendChild(el("h3", null, "이 사양에서 할 수 있는 작업"));
      var ul = el("ul", "mini-list");
      r.tasks.forEach(function (t) {
        var li = document.createElement("li");
        li.appendChild(el("strong", null, t.label + ": "));
        if (t.models.length) li.appendChild(document.createTextNode(t.models.map(function (m) { return m.id + "(" + fmtSize(m.sizeGB) + ")"; }).join(", ")));
        else if (t.tightModels.length) li.appendChild(document.createTextNode("여유 있게 들어가는 모델은 없고, 겨우 들어가는 " + t.tightModels.map(function (m) { return m.id + "(" + fmtSize(m.sizeGB) + ")"; }).join(", ") + "만 가능합니다."));
        else li.appendChild(document.createTextNode("이 사양에서 목록의 모델로는 어렵습니다."));
        ul.appendChild(li);
      });
      taskCard.appendChild(ul);
      taskCard.appendChild(el("p", "muted", "작업 표시는 Ollama 라이브러리의 기능 표시(tools·thinking·vision·embedding)와 모델 설명을 따른 것입니다. 한국어 답변 품질과 실제 정확도는 자료가 없어 판단하지 않았습니다."));
      out.appendChild(taskCard);

      var all = el("section", "card");
      all.appendChild(el("h3", null, "들어가는 모델 목록"));
      if (r.usesGpu) {
        all.appendChild(section("여유 있게 들어감", "파일 크기 × 1.2가 VRAM 이하인 모델입니다(Hugging Face 문서의 추론 시 최대 약 20% 추가 기준).", r.groups.comfortable));
        all.appendChild(section("겨우 들어감", "파일은 VRAM에 들어가지만 컨텍스트 여유가 작을 수 있습니다.", r.groups.tight));
      }
      all.appendChild(section(r.usesGpu ? "VRAM에는 안 들어가지만 느려도 되면" : "GPU 없이 RAM으로 돌릴 수 있는 후보", "이 도구의 자체 어림 기준(파일 크기 × 1.2가 RAM의 절반 이하)입니다. Ollama 문서는 CPU로 넘어가는 상태를 피하라고 안내하며, 속도는 보장하지 않습니다.", r.groups.cpu));
      out.appendChild(all);
      out.appendChild(el("p", "muted", "모델 목록·파일 크기·기능 표시는 Ollama 라이브러리에서 " + r.dataDate + "에 확인한 기본 태그 값입니다. 새 모델이 나오거나 크기가 바뀔 수 있습니다."));
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    form.addEventListener("reset", function () { $("op-result").hidden = true; cardSel.value = ""; });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  return { recommend: recommend, MODELS: MODELS, GPUS: GPUS, fitOf: fitOf, fmtSize: fmtSize, OVERHEAD: OVERHEAD, RAM_SHARE: RAM_SHARE, DATA_DATE: DATA_DATE };
});
