/* 블루스크린 코드 해석기 — 정지 코드(0x…), 코드 이름(IRQL_NOT_LESS_OR_EQUAL), 이벤트 뷰어 BugCheck 문구,
   한글·영문 키워드를 받아 사이트 해설(bsod-lookup.js)과 연결한다. 사이트에 해설이 없는 코드는
   Microsoft 버그 체크 참조(BSOD_MS, 코드·이름·문서 경로)로 안내한다.
   모든 처리는 브라우저 안에서만 이루어지며 입력 내용은 전송·저장하지 않는다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    globalThis.window = globalThis.window || {}; require("./bsod-lookup.js");
    module.exports = factory(globalThis.window.BSOD_LOOKUP, globalThis.window.BSOD_MS);
  } else root.ItsvcBsod = factory(root.BSOD_LOOKUP || [], root.BSOD_MS || {});
})(typeof self !== "undefined" ? self : this, function (DATA, MS) {
  const MAX_CHARS = 20000;
  const MS_BASE = "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/";
  const norm8 = (h) => h.replace(/^0x/i, "").toUpperCase().padStart(8, "0");
  const short = (hex8) => "0x" + hex8.replace(/^0+(?=.)/, "");
  const byHex = new Map(DATA.map((d) => [d.h, d]));
  const byName = new Map(DATA.filter((d) => d.n).map((d) => [d.n, d]));
  const msByName = new Map(Object.entries(MS).map(([h, v]) => [v[0], h]));
  const msInfo = (hex8) => (MS[hex8] ? { n: MS[hex8][0], u: MS_BASE + MS[hex8][1] } : null);

  // 반환: { mode: "code"|"search"|"none", matches: [사이트 해설], unknown: [{ c, ms }], related: [{ c, n, u }] }
  function parse(input) {
    const text = String(input || "").slice(0, MAX_CHARS).trim();
    const res = { mode: "none", matches: [], unknown: [], related: [] };
    if (!text) return res;
    const seen = new Set();
    const addSite = (d) => { if (d && !seen.has(d.h)) { seen.add(d.h); res.matches.push(d); } };
    const addUnknown = (hex8) => {
      if (seen.has(hex8)) return; seen.add(hex8);
      res.unknown.push({ c: short(hex8), ms: msInfo(hex8) });
    };
    const resolve = (hex8) => { const d = byHex.get(hex8); if (d) addSite(d); else addUnknown(hex8); };

    // 1) 이벤트 뷰어 문구: "The bugcheck was: 0x000000d1 (…)" / "버그 검사: 0x0000007e (…)" — 첫 값만 코드, 괄호 안은 매개변수
    const bc = text.match(/(?:bug\s*check|버그\s*(?:검사|확인))[^0-9a-fx]{0,60}?(0x[0-9a-f]{1,8})/i);
    if (bc) resolve(norm8(bc[1]));
    // 2) 코드 이름 (밑줄 포함 토큰, 소문자 입력 허용). 사이트에 없으면 Microsoft 참조에서 찾는다.
    for (const m of text.matchAll(/[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+/g)) {
      const name = m[0].toUpperCase();
      if (byName.has(name)) addSite(byName.get(name));
      else if (msByName.has(name)) addUnknown(msByName.get(name));
    }
    // 3) 0x 접두 16진수 — BugCheck 문구가 코드를 이미 잡았으면 매개변수라 건너뜀. 알려진 코드가 하나라도 있으면 나머지(주소 등)는 무시
    if (!bc) {
      const hexes = [...new Set((text.match(/0x[0-9a-f]{1,8}/gi) || []).map(norm8))];
      const known = hexes.filter((h) => byHex.has(h) || MS[h]);
      if (known.length) known.forEach(resolve);
      else if (!res.matches.length && !res.unknown.length && hexes.length) addUnknown(hexes[0]);
    }
    if (res.matches.length || res.unknown.length) { res.mode = "code"; return res; }

    // 4) 접두 없는 16진수 한 개 (예: 7B, d1, 133)
    if (/^[0-9a-f]{1,8}$/i.test(text)) { resolve(norm8(text)); res.mode = "code"; return res; }

    // 5) 이름 일부·한글 키워드 (공백으로 나눈 단어가 모두 들어 있어야 함)
    const words = text.toLowerCase().replace(/_+/g, " ").split(/\s+/).filter((w) => w.length >= 2);
    if (words.length) {
      const hay = (d) => (d.n + " " + d.t + " " + d.s + " " + d.a.join(" ")).toLowerCase().replace(/_/g, " ");
      DATA.filter((d) => words.every((w) => hay(d).includes(w))).slice(0, 12).forEach(addSite);
      for (const [hex, [name, slug]] of Object.entries(MS)) {
        if (res.related.length >= 8) break;
        if (words.every((w) => name.toLowerCase().replace(/_/g, " ").includes(w))) res.related.push({ c: short(hex), n: name, u: MS_BASE + slug });
      }
    }
    res.mode = res.matches.length || res.related.length ? "search" : "none";
    return res;
  }

  /* ───── 화면 연결 ───── */
  function init() {
    const $ = (id) => document.getElementById(id);
    const form = $("bsod-form");
    if (!form) return;
    const MS_REF = MS_BASE + "bug-check-code-reference2";
    const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
    const link = (cls, txt, href, ext) => { const a = el("a", cls, txt); a.href = href; if (ext) { a.target = "_blank"; a.rel = "noopener noreferrer"; } return a; };

    function card(d) {
      const c = el("section", "card");
      c.appendChild(el("h3", "", d.c + " · " + (d.n || d.t)));
      c.appendChild(el("p", "", d.s));
      if (d.k.length) {
        c.appendChild(el("h4", "", "흔한 원인"));
        const ul = el("ul", "mini-list"); d.k.forEach((x) => ul.appendChild(el("li", "", x))); c.appendChild(ul);
      }
      if (d.v.length) {
        c.appendChild(el("h4", "", "먼저 확인할 순서"));
        const ol = el("ol", "mini-list"); d.v.forEach((x) => ol.appendChild(el("li", "", x))); c.appendChild(ol);
      }
      if (d.l) c.appendChild(link("btn primary", "이 코드 상세 가이드 보기", d.l));
      return c;
    }
    function unknownCard(u) {
      const c = el("section", "card");
      if (u.ms) {
        c.appendChild(el("h3", "", u.c + " · " + u.ms.n));
        c.appendChild(el("p", "", "Microsoft 문서에는 " + u.ms.n + " 코드로 정의돼 있지만, 이 사이트에는 아직 해설이 없습니다. 아래 공식 문서에서 이 코드의 의미와 매개변수 설명을 볼 수 있습니다."));
        c.appendChild(link("btn", "Microsoft 문서에서 보기", u.ms.u, true));
      } else {
        c.appendChild(el("h3", "", u.c + " · 알려진 정지 코드 목록에 없는 값"));
        c.appendChild(el("p", "", "정지 코드가 아닌 값이거나 드문 코드일 수 있습니다. 이벤트 로그의 'The bugcheck was:' 뒤 첫 번째 값이 코드이고, 괄호 안 값은 매개변수입니다. 마이크로소프트의 버그 체크 코드 참조에서 직접 찾아볼 수 있습니다."));
        c.appendChild(link("btn", "Microsoft 버그 체크 코드 참조", MS_REF, true));
      }
      c.appendChild(el("p", "muted", "덤프 파일(.dmp)이 있다면 덤프 분석기로 원인 드라이버까지 좁힐 수 있습니다."));
      return c;
    }

    function render(r) {
      const out = $("bsod-out"); out.textContent = "";
      const msg = $("bsod-msg"); msg.textContent = "";
      if (r.mode === "none") {
        msg.textContent = $("bsod-input").value.trim()
          ? "일치하는 코드를 찾지 못했습니다. 화면에 보이는 '중지 코드' 이름(예: CRITICAL_PROCESS_DIED)이나 0x로 시작하는 코드를 입력해 보세요."
          : "코드나 이름을 입력해 주세요.";
        return;
      }
      if (r.mode === "search") msg.textContent = "입력한 단어와 관련된 코드를 찾았습니다.";
      r.matches.forEach((d) => out.appendChild(card(d)));
      r.unknown.forEach((u) => out.appendChild(unknownCard(u)));
      if (r.related.length) {
        const c = el("section", "card");
        c.appendChild(el("h3", "", "Microsoft 문서에만 있는 관련 코드"));
        const ul = el("ul", "mini-list");
        r.related.forEach((x) => { const li = el("li"); li.appendChild(link("", x.c + " " + x.n, x.u, true)); ul.appendChild(li); });
        c.appendChild(ul); out.appendChild(c);
      }
      out.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    const run = () => render(parse($("bsod-input").value));
    form.addEventListener("submit", (e) => { e.preventDefault(); run(); });
    form.addEventListener("reset", () => { $("bsod-out").textContent = ""; $("bsod-msg").textContent = ""; });
    // Enter 로 해석, Shift+Enter 는 줄바꿈 (붙여넣은 여러 줄 문구는 그대로 처리)
    $("bsod-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); run(); }
    });
    document.querySelectorAll("[data-bsod-pick]").forEach((b) => b.addEventListener("click", () => {
      $("bsod-input").value = b.getAttribute("data-bsod-pick"); run();
    }));
    // 다른 페이지에서 ?code=0x7B 형태로 바로 연결
    const q = new URLSearchParams(location.search).get("code");
    if (q) { $("bsod-input").value = q.slice(0, 200); run(); }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { parse };
});
