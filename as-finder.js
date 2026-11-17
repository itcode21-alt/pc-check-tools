/*
 * 제조사 A/S 안내 페이지의 '정품 조회·A/S 센터 찾기·접수 메모' 기능.
 * 센터·브랜드 데이터는 data/as-centers.json 에서 읽습니다. 입력값은 서버로 전송하거나 저장하지 않습니다.
 * 이 파일은 data/as-centers.json 의 해시 버전을 포함하므로 python3 scripts/build-as-centers.py 로 갱신하세요.
 */
(() => {
    // ── 데이터 ─────────────────────────────────────────────────
    // 센터·브랜드 정보는 data/as-centers.json 한 곳에서 관리합니다(출처·확인일·상태 포함).
    // 수정은 그 파일에서 하고 `python3 scripts/build-as-centers.py`로 검증·갱신하세요. 버전 값은 스크립트가 맞춥니다.
    const DATA_URL = "data/as-centers.json?v=82ceac76db";
    let CENTERS = {};
    let BRANDS = [];
    let CHECKED = "";

    // ── 화면 ───────────────────────────────────────────────────
    const $ = (id) => document.getElementById(id);
    const el = (tag, props, ...kids) => {
      const n = document.createElement(tag);
      if (props) Object.assign(n, props);
      kids.forEach((k) => { if (k != null) n.append(k); });
      return n;
    };
    const mapLinks = (addr) => {
      const q = encodeURIComponent(addr);
      const mk = (label, kind, name, href) => el("a", { href, target: "_blank", rel: "noopener noreferrer", textContent: label, className: "map map-" + kind, title: name + "에서 보기", ariaLabel: name + "에서 주소 보기" });
      return [mk("N", "n", "네이버 지도", "https://map.naver.com/p/search/" + q), mk("G", "g", "구글 지도", "https://www.google.com/maps/search/?api=1&query=" + q), mk("K", "k", "카카오맵", "https://map.kakao.com/?q=" + q)];
    };
    const copyText = async (text) => {
      try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); return true; } } catch (e) { /* 아래 대체 방법 사용 */ }
      const ta = el("textarea", { value: text });
      ta.setAttribute("readonly", "");
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.append(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    };
    const flash = (btn, ok) => {
      const old = btn.dataset.label || btn.textContent;
      btn.dataset.label = old;
      btn.textContent = ok ? "복사됨" : "복사 실패";
      setTimeout(() => { btn.textContent = old; }, 1500);
    };
    const copyBtn = (text, label) => {
      const b = el("button", { type: "button", className: "copy", textContent: label || "복사" });
      b.addEventListener("click", async () => flash(b, await copyText(text)));
      return b;
    };

    const normalize = (v) => String(v || "").trim().replace(/\s+/g, "").toUpperCase();
    const serialProblem = (v) => {
      if (!v) return "";
      if (!/^[A-Z0-9\-_]+$/.test(v)) return "시리얼 번호에는 보통 영문·숫자·하이픈만 들어갑니다. 라벨의 글자를 다시 확인하세요(0과 O, 1과 I 혼동 주의).";
      if (v.length < 6) return "시리얼 번호가 너무 짧아 보입니다. 라벨의 전체 번호를 입력했는지 확인하세요.";
      if (v.length > 30) return "시리얼 번호가 너무 깁니다. 모델명이나 바코드 숫자가 섞이지 않았는지 확인하세요.";
      return "";
    };

    let current = null;

    let CATEGORIES = [];
    let catFilter = "";
    let searchText = "";
    const renderCats = () => {
      const box = $("cat-chips");
      box.replaceChildren();
      CATEGORIES.forEach((c) => {
        const btn = el("button", { type: "button", className: "chip", textContent: c });
        btn.setAttribute("aria-pressed", String(c === catFilter));
        btn.addEventListener("click", () => {
          catFilter = catFilter === c ? "" : c;
          searchText = "";
          $("brand-search").value = "";
          renderCats();
          renderChips();
        });
        box.append(btn);
      });
    };
    const renderChips = () => {
      const box = $("brand-chips");
      box.replaceChildren();
      const q = searchText.trim().toLowerCase();
      let list = [];
      if (q) list = BRANDS.filter((b) => (b.name + " " + b.who).toLowerCase().includes(q)).slice(0, 14);
      else if (catFilter) list = BRANDS.filter((b) => b.categories.includes(catFilter));
      if (!list.length) {
        box.append(el("p", { className: "note", textContent: q ? "찾는 브랜드가 없습니다. 다른 이름으로 검색하거나 부품 종류를 골라 보세요." : "부품 종류를 고르거나 브랜드 이름으로 검색하면 브랜드가 나타납니다." }));
        return;
      }
      list.forEach((b) => {
        const btn = el("button", { type: "button", className: "chip", textContent: b.name });
        btn.setAttribute("aria-pressed", String(!!current && current.id === b.id));
        btn.dataset.id = b.id;
        btn.addEventListener("click", () => selectBrand(b.id));
        box.append(btn);
      });
    };

    const renderPanel = () => {
      const panel = $("brand-panel");
      panel.replaceChildren();
      if (!current) { panel.hidden = true; return; }
      panel.hidden = false;
      const hasLookup = current.lookup.length > 0;
      const head = el("h3", { textContent: current.name });
      head.append(el("span", { className: "badge " + (hasLookup ? "ok" : "chk"), textContent: hasLookup ? "온라인 정품 조회 있음" : "온라인 조회 없음" }));
      panel.append(
        head,
        el("p", { className: "who" }, el("b", { textContent: "국내 유통사: " }), document.createTextNode(current.who)),
        el("p", { textContent: current.how }),
        el("p", { className: "muted", textContent: "시리얼 번호 위치: " + current.where })
      );
      if (hasLookup) {
        const box = el("div", { className: "lookup-box" });
        box.append(el("p", { className: "lookup-title", textContent: "정품 조회하기" }));
        const input = el("input", { type: "text", id: "serial", placeholder: "시리얼 번호 입력 (예: SN2304012345)", maxLength: 40, autocomplete: "off", spellcheck: false });
        input.setAttribute("aria-label", "시리얼 번호");
        const status = el("p", { className: "dt-status", id: "serial-status", role: "status" });
        input.addEventListener("input", () => {
          const pr = serialProblem(normalize(input.value));
          status.textContent = pr;
          status.className = "dt-status" + (pr ? " err" : "");
        });
        box.append(input);
        const row = el("div", { className: "dt-row" });
        current.lookup.forEach(({ label, url }) => {
          const b = el("button", { type: "button", className: "btn primary", textContent: "'" + label + "' 열기" });
          b.addEventListener("click", async () => {
            const sn = normalize(input.value);
            if (sn) await copyText(sn);
            window.open(url, "_blank", "noopener,noreferrer");
            status.className = "dt-status";
            status.textContent = sn ? "시리얼을 복사했습니다. 열린 조회 페이지의 입력칸에 붙여넣기(Ctrl+V) 하세요." : "조회 페이지를 열었습니다. 시리얼을 입력해 조회하세요.";
          });
          row.append(b);
        });
        box.append(row, status, el("p", { className: "note", textContent: "이 페이지에서 직접 조회되는 것은 아니고, 유통사 공식 조회 페이지가 새 창으로 열립니다. 시리얼을 입력해 두면 복사되어 그 페이지에서 붙여넣기만 하면 됩니다. 조회 결과가 정품으로 나오는 유통사가 A/S 접수처이며, 조회가 안 되면 병행수입·해외직구·벌크 제품일 수 있으니 구매처에 먼저 문의하세요. 입력한 번호는 서버로 전송하지 않습니다." }));
        panel.append(box);
      } else {
        panel.append(el("p", { className: "note", textContent: "이 브랜드는 확인된 온라인 시리얼 조회가 없습니다. 아래 센터 정보의 전화번호로 문의하세요." }));
      }
    };

    const addrRow = (label, addr) => {
      const dt = el("dt", { textContent: label });
      const dd = el("dd");
      if (!addr) { dd.append(el("span", { className: "muted", textContent: "공식 안내에 없음 — 센터 안내 페이지나 전화로 확인" })); return [dt, dd]; }
      dd.append(el("span", { textContent: addr + " " }), copyBtn(addr), el("span", { className: "maps" }, ...mapLinks(addr)));
      return [dt, dd];
    };

    const renderCenters = () => {
      const box = $("center-list");
      box.replaceChildren();
      const hit = current ? current.centers : [];
      const ids = Object.keys(CENTERS).sort((a, b) => (hit.includes(b) ? 1 : 0) - (hit.includes(a) ? 1 : 0));
      ids.forEach((id) => {
        const c = CENTERS[id];
        const card = el("details", { className: "center" + (hit.includes(id) ? " match" : "") });
        card.id = "center-" + id;
        if (hit.includes(id)) card.open = true;
        const sum = el("summary");
        sum.append(el("span", { className: "c-name", textContent: c.name }), el("span", { className: "badge " + c.status, textContent: c.status === "ok" ? "확인됨" : "접수 전 재확인" }));
        if (hit.includes(id)) sum.append(el("span", { className: "badge pick", textContent: "선택한 브랜드 접수처" }));
        if (c.tel.length) sum.append(el("span", { className: "c-tel", textContent: c.tel[0] }));
        const dl = el("dl", { className: "kv" });
        dl.append(el("dt", { textContent: "취급 브랜드" }), el("dd", { textContent: c.brands }));
        const telDd = el("dd");
        if (c.tel.length) c.tel.forEach((t, i) => { if (i) telDd.append(el("br")); telDd.append(document.createTextNode(t)); }); else telDd.append(el("span", { className: "muted", textContent: "공식 페이지에서 확인" }));
        dl.append(el("dt", { textContent: "연락처" }), telDd);
        dl.append(el("dt", { textContent: "운영시간" }), el("dd", {}, c.hours ? document.createTextNode(c.hours) : el("span", { className: "muted", textContent: "공식 안내에 없음 — 전화로 확인" })));
        dl.append(...addrRow("방문 주소", c.visit), ...addrRow("택배 주소", c.parcel));
        const ul = el("ul", { className: "mini-list" });
        c.notes.forEach((n) => ul.append(el("li", { textContent: n })));
        const links = el("p", { className: "links" });
        c.links.forEach(({ label, url: href }, i) => { if (i) links.append(" · "); links.append(el("a", { href, target: "_blank", rel: "noopener noreferrer", textContent: label })); });
        const meta = el("p", { className: "meta", textContent: "출처: " + c.source + " · 확인일 " + (c.checked || CHECKED) });
        card.append(sum, dl, ul, links, meta);
        box.append(card);
      });
    };

    const selectBrand = (id) => {
      current = BRANDS.find((b) => b.id === id) || null;
      if (current && !searchText && (!catFilter || !current.categories.includes(catFilter))) {
        catFilter = current.categories[0];
        renderCats();
      }
      renderChips();
      renderPanel();
      renderCenters();
    };

    // ── 접수 메모(택배 동봉용) ───────────────────────────────────
    const slipCenter = $("slip-center");
        const val = (id) => $(id).value.trim();
    const renderSlip = () => {
      const out = $("slip");
      out.replaceChildren();
      const c = CENTERS[slipCenter.value];
      out.append(el("h3", { textContent: "A/S 접수 메모" }), el("p", { className: "r-sub", textContent: "택배 상자 안에 넣어 함께 보내세요" }));
      const rows = [
        ["받는 곳", c ? c.name + " / " + c.parcel : "-"],
        ["보내는 분", val("slip-name") || "-"],
        ["연락처", val("slip-tel") || "-"],
        ["반송 주소", val("slip-addr") || "-"],
        ["제품(브랜드·모델)", val("slip-item") || "-"],
        ["시리얼 번호", normalize($("slip-serial").value) || "-"],
        ["구매일·구매처", val("slip-buy") || "-"],
        ["고장 증상", val("slip-symptom") || "-"]
      ];
      const table = el("table");
      rows.forEach(([k, v]) => table.append(el("tr", {}, el("th", { textContent: k }), el("td", { textContent: v }))));
      out.append(table, el("p", { className: "r-note", textContent: "센터가 별도 양식(예: 피씨디렉트 택배서비스 의뢰서)을 요구하면 그 양식을 우선하세요. 입력한 내용은 이 브라우저 안에서만 쓰이며 서버로 전송하거나 저장하지 않습니다." }));
    };
    $("slip-form").addEventListener("input", renderSlip);
    $("slip-form").addEventListener("change", renderSlip);
    $("slip-print").addEventListener("click", () => { renderSlip(); window.print(); });
    $("slip-reset").addEventListener("click", () => { $("slip-form").reset(); renderSlip(); });

    const openHash = () => {
      const hash = decodeURIComponent(location.hash.replace("#", ""));
      if (!hash) return;
      if (BRANDS.some((b) => b.id === hash)) {
        selectBrand(hash);
        const box = $("lookup");
        if (box) box.scrollIntoView();
      } else if (hash.startsWith("center-") && $(hash)) {
        $(hash).open = true;
        $(hash).scrollIntoView();
      }
    };
    window.addEventListener("hashchange", openHash);
    const start = () => {
      Object.entries(CENTERS).forEach(([id, c]) => { if (c.parcel) slipCenter.append(el("option", { value: id, textContent: c.name })); });
      $("brand-search").addEventListener("input", () => {
        searchText = $("brand-search").value;
        if (searchText.trim()) { catFilter = ""; renderCats(); }
        renderChips();
      });
      renderCats();
      renderChips();
      renderCenters();
      renderSlip();
      openHash();
    };
    fetch(DATA_URL).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); }).then((doc) => {
      BRANDS = doc.brands;
      CATEGORIES = doc.categories;
      CHECKED = doc.updated;
      CENTERS = {};
      doc.centers.forEach((c) => { CENTERS[c.id] = c; });
      start();
    }).catch(() => {
      $("center-list").textContent = "센터 정보를 불러오지 못했습니다. 잠시 후 다시 시도하거나 제조사 A/S 안내 페이지를 확인하세요.";
    });
})();
