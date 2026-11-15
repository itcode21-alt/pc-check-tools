/* 블루스크린 코드 해석기 — 정지 코드(0x…), 코드 이름(IRQL_NOT_LESS_OR_EQUAL), 이벤트 뷰어 BugCheck 문구,
   한글·영문 키워드를 받아 사이트 해설(bsod-lookup.js)과 연결한다.
   모든 처리는 브라우저 안에서만 이루어지며 입력 내용은 전송·저장하지 않는다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) { globalThis.window = globalThis.window || {}; require("./bsod-lookup.js"); module.exports = factory(globalThis.window.BSOD_LOOKUP); }
  else root.ItsvcBsod = factory(root.BSOD_LOOKUP || []);
})(typeof self !== "undefined" ? self : this, function (DATA) {
  const MAX_CHARS = 20000;
  const norm8 = (h) => h.replace(/^0x/i, "").toUpperCase().padStart(8, "0");
  const byHex = new Map(DATA.map((d) => [d.h, d]));
  const byName = new Map(DATA.filter((d) => d.n).map((d) => [d.n, d]));

  // 반환: { mode: "code"|"name"|"search"|"none", matches: [entry], unknown: ["0x..."] }
  function parse(input) {
    const text = String(input || "").slice(0, MAX_CHARS).trim();
    if (!text) return { mode: "none", matches: [], unknown: [] };
    const seen = new Set(), matches = [], unknown = [];
    const add = (d) => { if (d && !seen.has(d.h)) { seen.add(d.h); matches.push(d); } };

    // 1) 이벤트 뷰어 BugCheck 문구: "The bugcheck was: 0x000000d1 (0x..., ...)" — 첫 값만 코드, 나머지는 매개변수
    const bc = text.match(/bug\s*check[^0-9a-fx]{0,60}?(0x[0-9a-f]{1,8})/i) || text.match(/(?:확인|코드)[^0-9a-fx]{0,20}(0x[0-9a-f]{1,8})/i);
    if (bc) {
      const d = byHex.get(norm8(bc[1]));
      if (d) add(d); else unknown.push("0x" + norm8(bc[1]).replace(/^0+(?=.)/, ""));
    }
    // 2) 코드 이름 (밑줄 포함 대문자 토큰, 소문자 입력도 허용)
    for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+/g)) add(byName.get(m[0].toUpperCase()));
    // 3) 0x 접두 16진수 — BugCheck 문구가 이미 코드를 잡았으면 매개변수라서 건너뜀
    if (!bc) {
      const hexes = [...new Set((text.match(/0x[0-9a-f]{1,8}/gi) || []).map(norm8))];
      const known = hexes.map((h) => byHex.get(h)).filter(Boolean);
      known.forEach(add);
      if (!known.length && hexes.length) unknown.push("0x" + hexes[0].replace(/^0+(?=.)/, ""));
    }
    if (matches.length || unknown.length) return { mode: matches.length ? "code" : "code", matches, unknown };

    // 4) 접두 없는 16진수 한 개 (예: 7B, d1, 133)
    if (/^[0-9a-f]{1,8}$/i.test(text)) {
      const d = byHex.get(norm8(text));
      if (d) return { mode: "code", matches: [d], unknown: [] };
      return { mode: "code", matches: [], unknown: ["0x" + norm8(text).replace(/^0+(?=.)/, "")] };
    }
    // 5) 이름 일부·한글 키워드 검색 (공백으로 나눈 단어가 모두 들어 있어야 함)
    const words = text.toLowerCase().replace(/[_]+/g, " ").split(/\s+/).filter((w) => w.length >= 2);
    if (words.length) {
      const hay = (d) => (d.n + " " + d.t + " " + d.s + " " + d.a.join(" ")).toLowerCase().replace(/_/g, " ");
      DATA.filter((d) => words.every((w) => hay(d).includes(w))).slice(0, 12).forEach(add);
    }
    return { mode: matches.length ? "search" : "none", matches, unknown: [] };
  }

  /* ───── 화면 연결 ───── */
  function init() {
    const $ = (id) => document.getElementById(id);
    const form = $("bsod-form");
    if (!form) return;
    const MS = "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-code-reference2";
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

    function card(d) {
      const c = el("section", "card");
      c.appendChild(el("h3", "", d.c + (d.n ? " · " + d.n : " · " + d.t)));
      c.appendChild(el("p", "", d.s));
      if (d.k.length) {
        c.appendChild(el("h4", "", "흔한 원인"));
        const ul = el("ul", "mini-list"); d.k.forEach((x) => ul.appendChild(el("li", "", x))); c.appendChild(ul);
      }
      if (d.v.length) {
        c.appendChild(el("h4", "", "먼저 확인할 순서"));
        const ol = el("ol", "mini-list"); d.v.forEach((x) => ol.appendChild(el("li", "", x))); c.appendChild(ol);
      }
      if (d.l) {
        const a = el("a", "btn primary", "이 코드 상세 가이드 보기"); a.href = d.l; c.appendChild(a);
      }
      return c;
    }

    function render(r) {
      const out = $("bsod-out"); out.textContent = "";
      const msg = $("bsod-msg"); msg.textContent = "";
      if (r.mode === "none" && !r.unknown.length) {
        msg.textContent = $("bsod-input").value.trim()
          ? "일치하는 코드를 찾지 못했습니다. 화면에 보이는 '중지 코드' 이름(예: CRITICAL_PROCESS_DIED)이나 0x로 시작하는 코드를 입력해 보세요."
          : "코드나 이름을 입력해 주세요.";
        return;
      }
      if (r.mode === "search") msg.textContent = "입력한 단어와 관련된 코드 " + r.matches.length + "개를 찾았습니다.";
      r.matches.forEach((d) => out.appendChild(card(d)));
      r.unknown.forEach((u) => {
        const c = el("section", "card");
        c.appendChild(el("h3", "", u + " · 사이트에 해설이 없는 코드"));
        c.appendChild(el("p", "", "아직 이 사이트에 정리하지 않은 코드입니다. 마이크로소프트의 버그 체크 코드 참조에서 이름과 매개변수의 뜻을 확인할 수 있습니다."));
        const a = el("a", "btn", "Microsoft 버그 체크 코드 참조"); a.href = MS; a.target = "_blank"; a.rel = "noopener noreferrer"; c.appendChild(a);
        c.appendChild(el("p", "muted", "덤프 파일(.dmp)이 있다면 위의 덤프 분석기로 원인 드라이버까지 좁힐 수 있습니다."));
        out.appendChild(c);
      });
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const run = () => render(parse($("bsod-input").value));
    form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
    form.addEventListener("reset", () => { $("bsod-out").textContent = ""; $("bsod-msg").textContent = ""; });
    document.querySelectorAll("[data-bsod-pick]").forEach((b) => b.addEventListener("click", () => {
      $("bsod-input").value = b.getAttribute("data-bsod-pick"); run();
    }));
    const list = $("bsod-list");
    if (list) DATA.forEach((d) => {
      const li = el("li");
      const a = el("a", "", d.c + " " + (d.n || d.t)); a.href = "#bsod-input";
      a.addEventListener("click", (e) => { e.preventDefault(); $("bsod-input").value = d.c; run(); });
      li.appendChild(a); list.appendChild(li);
    });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { parse };
});
