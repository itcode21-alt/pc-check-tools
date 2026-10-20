// 이벤트 로그 붙여넣기 해석기: 사용자가 붙여넣은 이벤트 뷰어 텍스트·XML·PowerShell 출력에서
// (원본, 이벤트 ID) 쌍을 뽑아 사이트의 eventViewerCodes 해설과 연결한다.
// 모든 처리는 브라우저 안에서만 이루어지며 입력 내용은 어디로도 전송·저장하지 않는다.
(function () {
  "use strict";

  var MAX_CHARS = 2000000;
  var MAX_LINES = 20000;
  var LEVEL_LABEL = { critical: "중대", error: "오류", warning: "경고", information: "정보" };
  var LEVEL_RANK = { critical: 0, error: 1, warning: 2, information: 3 };
  // driver/info 분류는 서비스·네트워크·TPM 등 성격이 다른 이벤트를 넓게 묶고 있어 배지로 보여 주지 않는다.
  var URGENCY_LABEL = { "repeat-check": "반복되면 확인", backup: "백업 먼저" };
  var RESTART_KEYS = { "kernel-power|41": 1, "eventlog|6008": 1 };
  var CORRELATION_MS = 10 * 60 * 1000;

  var SAMPLE = [
    "로그 이름:      System",
    "원본:           Microsoft-Windows-Kernel-Power",
    "날짜:           2026-10-18 오후 9:42:10",
    "이벤트 ID:      41",
    "수준:           중대",
    "",
    "로그 이름:      System",
    "원본:           Microsoft-Windows-WHEA-Logger",
    "날짜:           2026-10-18 오후 9:41:58",
    "이벤트 ID:      17",
    "수준:           경고",
    "",
    "로그 이름:      System",
    "원본:           Disk",
    "날짜:           2026-10-18 오후 9:35:20",
    "이벤트 ID:      153",
    "수준:           경고",
    "",
    "TimeCreated  : 2026-10-17 오전 11:03:44",
    "ProviderName : Service Control Manager",
    "Id           : 7034",
    "",
    "TimeCreated  : 2026-10-17 오전 11:03:44",
    "ProviderName : ExampleVendorService",
    "Id           : 9999"
  ].join("\n");

  var data = (window.SITE_DATA && window.SITE_DATA.eventViewerCodes) || [];
  var searchIndex = window.SEARCH_INDEX || [];

  var normSource = function (s) {
    return String(s || "").toLowerCase().replace(/^microsoft-windows-/, "").replace(/[\s_]+/g, "").trim();
  };
  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };

  // ---- 사이트 해설 데이터 색인 ------------------------------------------------
  var bySourceId = {};
  var byId = {};
  data.forEach(function (entry) {
    bySourceId[normSource(entry.source) + "|" + entry.id] = entry;
    (byId[entry.id] = byId[entry.id] || []).push(entry);
  });

  var titleOfPage = function (file) {
    for (var i = 0; i < searchIndex.length; i++) {
      if (searchIndex[i].u === file) return searchIndex[i].t;
    }
    return file.replace(/\.html$/, "");
  };

  // ---- 시각 해석 ---------------------------------------------------------------
  function parseTime(raw) {
    if (!raw) return null;
    var m = raw.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z)?/);
    if (m && !/오전|오후|AM|PM/i.test(raw)) {
      var parts = [+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]];
      return m[7] ? Date.UTC.apply(null, parts) : new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]).getTime();
    }
    m = raw.match(/(\d{4})[.\-\/]\s*(\d{1,2})[.\-\/]\s*(\d{1,2})\.?\s*(오전|오후)?\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (m) {
      var h = +m[5];
      if (m[4] === "오후" && h < 12) h += 12;
      if (m[4] === "오전" && h === 12) h = 0;
      return new Date(+m[1], +m[2] - 1, +m[3], h, +m[6], +(m[7] || 0)).getTime();
    }
    m = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      var hh = +m[4];
      if (m[7] && /pm/i.test(m[7]) && hh < 12) hh += 12;
      if (m[7] && /am/i.test(m[7]) && hh === 12) hh = 0;
      return new Date(+m[3], +m[1] - 1, +m[2], hh, +m[5], +m[6]).getTime();
    }
    return null;
  }

  // ---- 기록 추출 -----------------------------------------------------------------
  function parseXml(text) {
    var records = [];
    text.split(/(?=<Event[\s>])/i).forEach(function (chunk) {
      var id = chunk.match(/<EventID[^>]*>\s*(\d{1,5})\s*<\/EventID>/i);
      if (!id) return;
      var src = chunk.match(/<Provider\b[^>]*\bName\s*=\s*["']([^"']+)["']/i);
      var time = chunk.match(/<TimeCreated\b[^>]*\bSystemTime\s*=\s*["']([^"']+)["']/i);
      records.push({ source: src ? src[1] : null, id: id[1], timeRaw: time ? time[1] : null });
    });
    return records;
  }

  var RE_SOURCE = /^\s*(?:원본|공급자(?:\s*이름)?|Source|ProviderName|Provider\s*Name)\s*[:：]\s*(.+?)\s*$/i;
  var RE_ID = /^\s*(?:이벤트\s*ID|Event\s*ID|EventId|Id)\s*[:：]\s*(\d{1,5})\b/i;
  var RE_TIME = /^\s*(?:날짜(?:\s*및\s*시간)?|기록된\s*시간|Date(?:\s*and\s*Time)?|Logged|TimeCreated|Time\s*Created)\s*[:：]\s*(.+?)\s*$/i;

  function parseLabeled(lines) {
    var records = [];
    var cur = {};
    var flush = function () {
      if (cur.id) records.push({ source: cur.source || null, id: cur.id, timeRaw: cur.timeRaw || null });
      cur = {};
    };
    lines.forEach(function (line) {
      var m;
      if ((m = line.match(RE_SOURCE))) { if (cur.source) flush(); cur.source = m[1]; return; }
      if ((m = line.match(RE_ID))) { if (cur.id) flush(); cur.id = m[1]; return; }
      if ((m = line.match(RE_TIME))) { if (cur.timeRaw) flush(); cur.timeRaw = m[1]; }
    });
    flush();
    return records;
  }

  // 라벨이 없는 표·CSV·자유 텍스트: 사이트가 아는 (원본, ID) 쌍만 한 줄 안에서 찾는다.
  function parseKnownPairs(lines) {
    var records = [];
    var sources = [];
    data.forEach(function (entry) {
      var n = entry.source.toLowerCase().replace(/^microsoft-windows-/, "");
      if (sources.indexOf(n) < 0) sources.push(n);
    });
    lines.forEach(function (line) {
      var lower = line.toLowerCase();
      var nums = [];
      var re = /(^|[^\d:.\/\-])(\d{1,5})(?![\d:.\/\-])/g;
      var m;
      while ((m = re.exec(line))) nums.push(m[2]);
      if (!nums.length) return;
      sources.forEach(function (src) {
        if (lower.indexOf(src) < 0) return;
        nums.forEach(function (n) {
          var entry = bySourceId[normSource(src) + "|" + n];
          if (entry) records.push({ source: entry.source, id: n, timeRaw: line });
        });
      });
    });
    return records;
  }

  function extract(text) {
    var truncated = false;
    if (text.length > MAX_CHARS) { text = text.slice(0, MAX_CHARS); truncated = true; }
    var records;
    if (/<EventID[\s>]/i.test(text)) {
      records = parseXml(text);
    } else {
      var lines = text.split(/\r?\n/);
      if (lines.length > MAX_LINES) { lines = lines.slice(0, MAX_LINES); truncated = true; }
      records = parseLabeled(lines);
      if (!records.length) records = parseKnownPairs(lines);
    }
    records.forEach(function (r) { r.ms = parseTime(r.timeRaw); });
    return { records: records, truncated: truncated };
  }

  // ---- 집계 ----------------------------------------------------------------------
  function group(records) {
    var map = {};
    var order = [];
    records.forEach(function (r) {
      var key = (r.source ? normSource(r.source) : "?") + "|" + r.id;
      if (!map[key]) {
        map[key] = { key: key, source: r.source, id: r.id, count: 0, first: null, last: null, entry: null };
        order.push(key);
      }
      var g = map[key];
      g.count++;
      if (r.ms !== null) {
        if (!g.first || r.ms < g.first.ms) g.first = r;
        if (!g.last || r.ms > g.last.ms) g.last = r;
      }
    });
    return order.map(function (k) {
      var g = map[k];
      g.entry = r_entry(g);
      return g;
    });
  }
  function r_entry(g) { return g.source ? bySourceId[g.key] || null : null; }

  function sortGroups(groups) {
    return groups.slice().sort(function (a, b) {
      var ra = a.entry ? LEVEL_RANK[a.entry.level] : 9;
      var rb = b.entry ? LEVEL_RANK[b.entry.level] : 9;
      if (ra !== rb) return ra - rb;
      return b.count - a.count;
    });
  }

  // ---- 화면 ----------------------------------------------------------------------
  var fmtTime = function (rec) {
    if (!rec) return "";
    var d = new Date(rec.ms);
    var p = function (n) { return n < 10 ? "0" + n : "" + n; };
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes());
  };

  function linkList(entry) {
    var links = [];
    if (entry.detailPage && entry.detailPage !== "event-viewer-guide.html") {
      links.push('<a href="' + esc(entry.detailPage) + '">' + esc(entry.source) + " 이벤트 " + esc(entry.id) + " 자세히 보기</a>");
    }
    (entry.relatedGuides || []).slice(0, 3).forEach(function (g) {
      links.push('<a href="' + esc(g) + '">' + esc(titleOfPage(g)) + "</a>");
    });
    return links.length ? '<div class="link-list">' + links.join("") + "</div>" : "";
  }

  function cardHtml(g) {
    var title = (g.source || "원본 미확인") + " · 이벤트 " + g.id;
    var meta = ["기록 " + g.count + "건"];
    if (g.first) meta.push(g.first === g.last || fmtTime(g.first) === fmtTime(g.last) ? fmtTime(g.first) : fmtTime(g.first) + " ~ " + fmtTime(g.last));
    if (!g.entry) {
      var cands = g.source ? [] : byId[g.id] || [];
      var body;
      if (g.source) {
        body = "<p>이 사이트에 아직 해설이 없는 이벤트입니다. 원본과 ID가 정확한지 확인한 뒤 아래 방법으로 더 찾아보세요.</p>" +
          '<div class="link-list"><a href="https://learn.microsoft.com/search/?terms=' + encodeURIComponent((g.source || "") + " event " + g.id) +
          '" target="_blank" rel="noopener noreferrer">Microsoft Learn에서 검색</a><a href="diagnostic.html">진단 도구에서 증상과 함께 분석</a></div>';
      } else {
        body = "<p>원본(Source) 이름이 없어 정확히 해석할 수 없습니다. 같은 이벤트 ID라도 원본에 따라 뜻이 완전히 다릅니다.</p>" +
          (cands.length
            ? '<p class="muted">이 ID를 쓰는 사이트 등록 이벤트: ' + cands.slice(0, 6).map(function (c) {
                return '<a href="' + esc(c.detailPage) + '">' + esc(c.source) + " " + esc(c.id) + "</a>";
              }).join(" · ") + "</p>"
            : "");
      }
      return '<article class="card ela-card ela-unknown"><h3>' + esc(title) + '</h3><p class="muted">' + meta.join(" · ") + "</p>" + body + "</article>";
    }
    var e = g.entry;
    var badges = '<span class="ela-badge ela-' + esc(e.level) + '">' + esc(LEVEL_LABEL[e.level] || e.level) + "</span>";
    if (URGENCY_LABEL[e.urgency]) badges += '<span class="ela-badge ela-urg">' + esc(URGENCY_LABEL[e.urgency]) + "</span>";
    var checks = (e.checks || []).slice(0, 3).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    var warns = (e.warnings || []).slice(0, 2).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    return '<article class="card ela-card"><h3>' + esc(title) + "</h3>" +
      '<p class="ela-meta">' + badges + '<span class="muted">' + meta.join(" · ") + "</span></p>" +
      "<p>" + esc(e.summary) + "</p>" +
      (checks ? "<h4>먼저 확인할 것</h4><ul class=\"mini-list\">" + checks + "</ul>" : "") +
      (warns ? "<h4>주의</h4><ul class=\"mini-list\">" + warns + "</ul>" : "") +
      linkList(e) + "</article>";
  }

  function noticesHtml(groups, records) {
    var out = [];
    var matched = groups.filter(function (g) { return g.entry; });
    if (matched.some(function (g) { return g.entry.urgency === "backup"; })) {
      out.push("'백업 먼저'로 분류된 기록이 있습니다(디스크·파일 시스템 오류, 하드웨어 오류 보고, 블루스크린 등). 점검이나 재설치에 들어가기 전에 중요한 파일부터 백업하세요. 점검 과정에서 상태가 더 나빠질 수 있습니다.");
    }
    if (matched.some(function (g) { return g.key.indexOf("whea-logger|") === 0; })) {
      out.push("WHEA-Logger 기록이 있습니다. 하드웨어가 오류를 보고한 경로이므로, 재부팅·종료 기록(Kernel-Power 41, EventLog 6008)보다 WHEA 기록의 상세 페이지를 먼저 읽는 편이 원인 범위를 좁히는 데 유리합니다.");
    }
    var repeated = groups.filter(function (g) { return g.count >= 3; });
    if (repeated.length) {
      out.push("같은 이벤트가 3건 이상 반복된 항목: " + repeated.slice(0, 5).map(function (g) {
        return esc((g.source || "?") + " " + g.id) + " (" + g.count + "건)";
      }).join(", ") + ". 한 번뿐인 기록보다 반복되는 기록이 우선 확인 대상입니다.");
    }
    return out;
  }

  function timelineHtml(records) {
    var timed = records.filter(function (r) { return r.ms !== null; });
    var restarts = timed.filter(function (r) { return r.source && RESTART_KEYS[normSource(r.source) + "|" + r.id]; });
    if (!restarts.length) return "";
    var blocks = [];
    restarts.slice(0, 5).forEach(function (rs) {
      var before = timed.filter(function (r) {
        var isRestart = r.source && RESTART_KEYS[normSource(r.source) + "|" + r.id];
        return !isRestart && r.ms <= rs.ms && rs.ms - r.ms <= CORRELATION_MS;
      }).sort(function (a, b) { return a.ms - b.ms; });
      var name = (rs.source || "") + " " + rs.id;
      if (!before.length) {
        blocks.push("<li><strong>" + esc(fmtTime(rs)) + " " + esc(name) + "</strong> — 직전 10분 안에 붙여넣은 다른 기록이 없습니다. 더 넓은 범위의 로그를 붙여넣으면 앞뒤 흐름을 볼 수 있습니다.</li>");
      } else {
        var seen = {};
        var items = [];
        before.forEach(function (r) {
          var label = (r.source || "원본 미확인") + " " + r.id;
          if (seen[label]) return;
          seen[label] = true;
          items.push(esc(fmtTime(r)) + " " + esc(label));
        });
        blocks.push("<li><strong>" + esc(fmtTime(rs)) + " " + esc(name) + "</strong> — 직전 10분 안의 기록: " + items.join(", ") + "</li>");
      }
    });
    return '<section class="card"><h3>재부팅·비정상 종료 직전 기록</h3><ul class="mini-list">' + blocks.join("") +
      '</ul><p class="muted">직전에 있던 기록이 원인이라는 뜻은 아닙니다. 어떤 기록부터 열어 볼지 정하는 단서로만 쓰세요.</p></section>';
  }

  function plainSummary(groups) {
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin : "https://itsvc.co.kr";
    var lines = ["[이벤트 로그 해석 요약]"];
    groups.forEach(function (g) {
      var line = "- " + (g.source || "원본 미확인") + " 이벤트 " + g.id + " × " + g.count;
      if (g.entry) {
        line += " (" + (LEVEL_LABEL[g.entry.level] || g.entry.level) + ")";
        if (g.entry.detailPage && g.entry.detailPage !== "event-viewer-guide.html") line += " " + base + "/" + g.entry.detailPage;
      } else {
        line += " (사이트 해설 없음)";
      }
      lines.push(line);
    });
    lines.push("해석 도구: " + base + "/event-log-analyzer.html");
    return lines.join("\n");
  }

  function render(text, resultEl, statusEl, actionsEl) {
    var parsed = extract(text);
    var records = parsed.records;
    if (!records.length) {
      resultEl.innerHTML = '<div class="card"><h3>이벤트를 찾지 못했습니다</h3><p>붙여넣은 내용에서 이벤트 ID를 읽지 못했습니다. 아래 "붙여넣을 수 있는 형식"을 확인하고, 이벤트의 <strong>원본(Source)</strong>과 <strong>이벤트 ID</strong>가 함께 보이는 텍스트나 XML을 붙여넣어 주세요.</p></div>';
      statusEl.textContent = "이벤트를 찾지 못했습니다.";
      actionsEl.hidden = true;
      return null;
    }
    var groups = sortGroups(group(records));
    var known = groups.filter(function (g) { return g.entry; }).length;
    statusEl.textContent = "기록 " + records.length + "건 · 서로 다른 이벤트 " + groups.length + "종 · 사이트 해설이 있는 이벤트 " + known + "종" +
      (parsed.truncated ? " (입력이 너무 길어 앞부분만 읽었습니다)" : "");
    var notices = noticesHtml(groups, records);
    var html = "";
    if (notices.length) {
      html += '<section class="card ela-notice"><h3>종합 의견</h3><ul class="mini-list">' + notices.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></section>";
    }
    html += timelineHtml(records);
    html += groups.map(cardHtml).join("");
    resultEl.innerHTML = html;
    actionsEl.hidden = false;
    return plainSummary(groups);
  }

  // ---- 연결 ----------------------------------------------------------------------
  function init() {
    var input = document.getElementById("ela-input");
    var resultEl = document.getElementById("ela-result");
    var statusEl = document.getElementById("ela-status");
    var actionsEl = document.getElementById("ela-actions");
    var copyBtn = document.getElementById("ela-copy");
    var fileEl = document.getElementById("ela-file");
    if (!input || !resultEl) return;
    var lastSummary = "";

    document.getElementById("ela-run").addEventListener("click", function () {
      lastSummary = render(input.value, resultEl, statusEl, actionsEl) || "";
    });
    document.getElementById("ela-sample").addEventListener("click", function () {
      input.value = SAMPLE;
      lastSummary = render(input.value, resultEl, statusEl, actionsEl) || "";
    });
    document.getElementById("ela-clear").addEventListener("click", function () {
      input.value = "";
      resultEl.innerHTML = "";
      statusEl.textContent = "";
      actionsEl.hidden = true;
      lastSummary = "";
      if (fileEl) fileEl.value = "";
    });
    if (fileEl) {
      fileEl.addEventListener("change", function () {
        var f = fileEl.files && fileEl.files[0];
        if (!f) return;
        if (f.size > MAX_CHARS) { statusEl.textContent = "파일이 2MB를 넘습니다. 기간이나 개수를 줄여 다시 저장해 주세요."; return; }
        var reader = new FileReader();
        reader.onload = function () {
          input.value = String(reader.result || "");
          lastSummary = render(input.value, resultEl, statusEl, actionsEl) || "";
        };
        reader.readAsText(f);
      });
    }
    copyBtn.addEventListener("click", function () {
      if (!lastSummary) return;
      var done = function () { copyBtn.textContent = "복사했습니다"; setTimeout(function () { copyBtn.textContent = "요약 복사"; }, 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(lastSummary).then(done, function () {});
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
