// 장치 관리자 오류 코드 찾기: 코드 번호를 직접 고르거나, 장치 관리자·PowerShell 출력을 붙여넣으면
// 코드별 의미와 먼저 확인할 순서를 사이트 해설(window.DEVICE_MANAGER_CODES)과 연결한다.
// 모든 처리는 브라우저 안에서만 이루어지며 입력 내용은 전송·저장하지 않는다.
(function () {
  "use strict";

  var MAX_CHARS = 1000000;
  var MAX_LINES = 10000;
  var codes = window.DEVICE_MANAGER_CODES || [];
  var searchIndex = window.SEARCH_INDEX || [];
  var byNum = {};
  codes.forEach(function (c) { byNum[c.n] = c; });

  var PCI_VENDOR = { "10DE": "NVIDIA", "1002": "AMD(ATI)", "8086": "Intel", "10EC": "Realtek", "14E4": "Broadcom", "1022": "AMD", "168C": "Qualcomm Atheros", "14C3": "MediaTek", "144D": "Samsung", "1B21": "ASMedia", "1912": "Renesas" };
  var USB_VENDOR = { "0BDA": "Realtek", "046D": "Logitech", "8087": "Intel" };

  var SAMPLE = [
    "Name                : NVIDIA GeForce RTX 3060",
    "PNPDeviceID         : PCI\\VEN_10DE&DEV_2503&SUBSYS_00000000&REV_A1\\4&1234&0&0008",
    "ConfigManagerErrorCode : 43",
    "",
    "Name                : USB 복합 장치",
    "PNPDeviceID         : USB\\VID_0BDA&PID_8153\\000001000000",
    "ConfigManagerErrorCode : 43",
    "",
    "Name                : 가상 예시 블루투스 어댑터",
    "PNPDeviceID         : USB\\VID_8087&PID_0026\\5&2A&0&1",
    "ConfigManagerErrorCode : 10"
  ].join("\n");

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var titleOfPage = function (file) {
    for (var i = 0; i < searchIndex.length; i++) if (searchIndex[i].u === file) return searchIndex[i].t;
    return file.replace(/\.html$/, "");
  };
  var validCode = function (n) { return n >= 1 && n <= 99; };

  // ---- 추출 ---------------------------------------------------------------------
  var RE_NAME = /^\s*(?:Name|FriendlyName|장치\s*이름|이름)\s*[:：]\s*(.+?)\s*$/i;
  var RE_ID = /^\s*(?:PNPDeviceID|DeviceID|InstanceId|장치\s*인스턴스\s*경로)\s*[:：]\s*(.+?)\s*$/i;
  var RE_CODE = /^\s*(?:ConfigManagerErrorCode|ProblemCode)\s*[:：=]\s*(\d{1,2})\b/i;
  var RE_INLINE = /(?:코드|Code)\s*(\d{1,2})\b/gi;
  var RE_ROW = /^(.*\S)\s+(\S+\\\S+)\s+(\d{1,2})\s*$/;

  function parseLabeled(lines) {
    var recs = [];
    var cur = {};
    var flush = function () {
      if (cur.code !== undefined) recs.push({ code: cur.code, name: cur.name || null, id: cur.id || null });
      cur = {};
    };
    lines.forEach(function (line) {
      var m;
      if ((m = line.match(RE_NAME))) { if (cur.name !== undefined) flush(); cur.name = m[1]; return; }
      if ((m = line.match(RE_ID))) { if (cur.id !== undefined) flush(); cur.id = m[1]; return; }
      if ((m = line.match(RE_CODE))) { if (cur.code !== undefined) flush(); cur.code = +m[1]; }
    });
    flush();
    return recs;
  }

  function parseTable(lines) {
    var recs = [];
    var headerAt = -1;
    lines.forEach(function (line, i) { if (headerAt < 0 && /ConfigManagerErrorCode/i.test(line) && !/[:：]/.test(line)) headerAt = i; });
    if (headerAt < 0) return recs;
    for (var i = headerAt + 1; i < lines.length; i++) {
      var m = lines[i].match(RE_ROW);
      if (m) recs.push({ code: +m[3], name: m[1].trim(), id: m[2] });
    }
    return recs;
  }

  function parseInline(lines) {
    var recs = [];
    lines.forEach(function (line) {
      var m;
      RE_INLINE.lastIndex = 0;
      while ((m = RE_INLINE.exec(line))) recs.push({ code: +m[1], name: null, id: null });
    });
    return recs;
  }

  function extract(text) {
    var truncated = false;
    if (text.length > MAX_CHARS) { text = text.slice(0, MAX_CHARS); truncated = true; }
    var lines = text.split(/\r?\n/);
    if (lines.length > MAX_LINES) { lines = lines.slice(0, MAX_LINES); truncated = true; }
    var recs = parseLabeled(lines);
    if (!recs.length) recs = parseTable(lines);
    if (!recs.length) recs = parseInline(lines);
    recs = recs.filter(function (r) { return validCode(r.code); });
    return { recs: recs, truncated: truncated };
  }

  // ---- 표시 ---------------------------------------------------------------------
  function hwHint(id) {
    if (!id) return "";
    var m = id.match(/VEN_([0-9A-F]{4})&DEV_([0-9A-F]{4})/i);
    if (m) {
      var v = PCI_VENDOR[m[1].toUpperCase()];
      return "PCI 제조사 코드 " + m[1].toUpperCase() + (v ? "(" + v + ")" : "") + " · 장치 코드 " + m[2].toUpperCase();
    }
    m = id.match(/VID_([0-9A-F]{4})&PID_([0-9A-F]{4})/i);
    if (m) {
      var u = USB_VENDOR[m[1].toUpperCase()];
      return "USB 제조사 코드 " + m[1].toUpperCase() + (u ? "(" + u + ")" : "") + " · 제품 코드 " + m[2].toUpperCase();
    }
    return "";
  }

  function groupByCode(recs) {
    var map = {};
    recs.forEach(function (r) {
      var g = map[r.code] || (map[r.code] = { n: r.code, devices: [], count: 0 });
      g.count++;
      if (r.name || r.id) g.devices.push(r);
    });
    return Object.keys(map).map(function (k) { return map[k]; }).sort(function (a, b) { return b.count - a.count || a.n - b.n; });
  }

  function cardHtml(g) {
    var c = byNum[g.n];
    var devs = g.devices.slice(0, 8).map(function (d) {
      var hint = hwHint(d.id);
      return "<li><strong>" + esc(d.name || "이름 없음") + "</strong>" + (hint ? '<br><span class="muted">' + esc(hint) + "</span>" : "") + "</li>";
    }).join("");
    var more = g.devices.length > 8 ? '<li class="muted">… 외 ' + (g.devices.length - 8) + "개</li>" : "";
    var devBlock = devs ? "<h4>해당 장치</h4><ul class=\"mini-list\">" + devs + more + "</ul>" : "";
    if (!c) {
      var src = (codes[0] && codes[0].o) || null;
      return '<article class="card dmf-card dmf-unknown"><h3>코드 ' + g.n + '</h3><p class="muted">기록 ' + g.count + "건</p>" + devBlock +
        "<p>이 사이트에 아직 해설이 없는 코드입니다. 코드 뜻은 Microsoft 공식 문서에서 확인하세요.</p>" +
        (src ? '<div class="link-list"><a href="' + esc(src.url) + '" target="_blank" rel="noopener noreferrer">' + esc(src.title) + "</a></div>" : "") + "</article>";
    }
    var causes = c.c.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var checks = c.k.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
    var links = [];
    if (c.p) links.push('<a href="' + esc(c.p) + '">코드 ' + c.n + " 자세히 보기</a>");
    if (c.r) links.push('<a href="' + esc(c.r) + '">' + esc(titleOfPage(c.r)) + "</a>");
    if (c.o && c.o.url) links.push('<a href="' + esc(c.o.url) + '" target="_blank" rel="noopener noreferrer">' + esc(c.o.title) + "</a>");
    return '<article class="card dmf-card"><h3>' + esc(c.t) + '</h3><p class="muted">기록 ' + g.count + "건</p>" +
      "<p>" + esc(c.s) + "</p>" + devBlock +
      (causes ? "<h4>흔한 원인</h4><ul class=\"mini-list\">" + causes + "</ul>" : "") +
      (checks ? "<h4>먼저 확인할 것</h4><ul class=\"mini-list\">" + checks + "</ul>" : "") +
      (links.length ? '<div class="link-list">' + links.join("") + "</div>" : "") + "</article>";
  }

  function noticesHtml(groups) {
    var out = [];
    groups.forEach(function (g) {
      if (g.count >= 3) out.push("코드 " + g.n + "이(가) " + g.count + "건 보입니다. 장치마다 따로 고치기보다 먼저 공통 요소(칩셋·USB 컨트롤러 드라이버, 최근의 Windows 업데이트나 드라이버 변경)를 의심해 보세요.");
    });
    if (groups.some(function (g) { return g.n === 45; })) {
      out.push("코드 45는 연결을 끊은 장치가 회색으로 남아 있을 때도 보입니다. 지금 쓰지 않는 장치라면 정상 동작일 수 있으니, 장치를 다시 연결해 정상으로 바뀌는지 먼저 보세요.");
    }
    return out;
  }

  function plainSummary(groups) {
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin : "https://itsvc.co.kr";
    var lines = ["[장치 관리자 오류 코드 해석 요약]"];
    groups.forEach(function (g) {
      var c = byNum[g.n];
      var names = g.devices.filter(function (d) { return d.name; }).slice(0, 4).map(function (d) { return d.name; });
      lines.push("- 코드 " + g.n + " × " + g.count + (c ? " · " + c.t.replace(/\s*\(코드 \d+\)\s*$/, "") : " · (사이트 해설 없음)") + (names.length ? " / 장치: " + names.join(", ") : "") + (c && c.p && c.p.indexOf("?") < 0 ? " " + base + "/" + c.p : ""));
    });
    lines.push("해석 도구: " + base + "/device-manager-code-finder.html");
    return lines.join("\n");
  }

  function render(recs, truncated, ui) {
    if (!recs.length) {
      ui.result.innerHTML = '<div class="card"><h3>코드를 찾지 못했습니다</h3><p>붙여넣은 내용에서 장치 관리자 오류 코드를 읽지 못했습니다. "코드 43"처럼 코드가 보이는 문구나, 아래 PowerShell 명령의 출력을 붙여넣어 주세요. 코드 번호를 알면 위의 번호 버튼이나 입력칸을 쓰는 편이 빠릅니다.</p></div>';
      ui.status.textContent = "코드를 찾지 못했습니다.";
      ui.actions.hidden = true;
      return "";
    }
    var groups = groupByCode(recs);
    var known = groups.filter(function (g) { return byNum[g.n]; }).length;
    ui.status.textContent = "기록 " + recs.length + "건 · 서로 다른 코드 " + groups.length + "종 · 사이트 해설이 있는 코드 " + known + "종" + (truncated ? " (입력이 길어 앞부분만 읽었습니다)" : "");
    var notices = noticesHtml(groups);
    var html = notices.length ? '<section class="card dmf-notice"><h3>종합 의견</h3><ul class="mini-list">' + notices.map(function (n) { return "<li>" + esc(n) + "</li>"; }).join("") + "</ul></section>" : "";
    html += groups.map(cardHtml).join("");
    ui.result.innerHTML = html;
    ui.actions.hidden = false;
    return plainSummary(groups);
  }

  function init() {
    var ui = {
      input: document.getElementById("dmf-input"),
      result: document.getElementById("dmf-result"),
      status: document.getElementById("dmf-status"),
      actions: document.getElementById("dmf-actions"),
      num: document.getElementById("dmf-num"),
      chips: document.getElementById("dmf-chips")
    };
    if (!ui.input || !ui.result) return;
    var last = "";
    var copyBtn = document.getElementById("dmf-copy");

    var runText = function () { var p = extract(ui.input.value); last = render(p.recs, p.truncated, ui); };
    var runCode = function (n) {
      if (!validCode(n)) { ui.status.textContent = "1~99 사이의 코드 번호를 입력해 주세요."; return; }
      last = render([{ code: n, name: null, id: null }], false, ui);
    };

    ui.chips.innerHTML = codes.map(function (c) { return '<button type="button" class="btn secondary dmf-chip" data-n="' + c.n + '">코드 ' + c.n + "</button>"; }).join("");
    ui.chips.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-n]");
      if (b) runCode(+b.getAttribute("data-n"));
    });
    document.getElementById("dmf-find").addEventListener("click", function () { runCode(parseInt(ui.num.value, 10)); });
    ui.num.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); runCode(parseInt(ui.num.value, 10)); } });
    document.getElementById("dmf-run").addEventListener("click", runText);
    document.getElementById("dmf-sample").addEventListener("click", function () { ui.input.value = SAMPLE; runText(); });
    document.getElementById("dmf-clear").addEventListener("click", function () {
      ui.input.value = ""; ui.num.value = ""; ui.result.innerHTML = ""; ui.status.textContent = ""; ui.actions.hidden = true; last = "";
    });
    copyBtn.addEventListener("click", function () {
      if (!last || !navigator.clipboard || !navigator.clipboard.writeText) return;
      navigator.clipboard.writeText(last).then(function () {
        copyBtn.textContent = "복사했습니다";
        setTimeout(function () { copyBtn.textContent = "요약 복사"; }, 1800);
      }, function () {});
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
