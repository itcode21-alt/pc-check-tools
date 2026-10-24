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
  // 41과 6008은 같은 재부팅에서 함께 남으므로 이 간격 안의 재부팅 기록은 한 번으로 센다.
  var CLUSTER_MS = 3 * 60 * 1000;
  // 부팅할 때마다 정상적으로 남는 기록은 "재부팅 직후 기록"에서 뺀다.
  var HIST_MIN_RECORDS = 5;
  var HIST_MAX_BUCKETS = 62;
  var SHARE_MAX_GROUPS = 60;
  var BOOT_NOISE = { "eventlog|6005": 1, "eventlog|6009": 1, "eventlog|6013": 1, "kernel-general|12": 1 };

  // 이벤트 조합 규칙: 확정이 아니라 "어느 쪽부터 의심할지"만 알려 준다.
  // keys는 normSource(원본)|이벤트 ID 형식이다.
  var PATTERNS = [
    {
      title: "저장장치 입출력 오류 경로",
      keys: ["disk|7", "disk|9", "disk|11", "disk|15", "disk|51", "disk|52", "disk|98", "disk|153", "disk|154", "disk|157", "disk|158",
        "storahci|129", "stornvme|11", "stornvme|129", "ntfs|50", "ntfs|55", "ntfs|57", "ntfs|98", "ntfs|137", "ntfs|140", "volmgr|161", "volmgr|162"],
      text: "디스크·파일 시스템 계열 기록입니다. SSD/HDD 자체뿐 아니라 SATA·전원 케이블, 컨트롤러, 드라이버도 같은 기록을 남깁니다.",
      withRestart: "재부팅 기록이 함께 있어 저장장치 문제로 시스템이 멈췄을 가능성을 먼저 살필 만합니다.",
      next: "중요한 파일을 먼저 백업하고, 디스크 상태(SMART)와 연결 상태를 점검하세요.",
      links: [["event-disk-153.html", "Disk 153 해설"], ["windows-disk-usage-100.html", "디스크 사용률 100% 가이드"]]
    },
    {
      title: "하드웨어 오류 보고 경로 (WHEA)",
      keys: ["whea-logger|1", "whea-logger|17", "whea-logger|18", "whea-logger|19", "whea-logger|20", "whea-logger|46", "whea-logger|47"],
      text: "하드웨어가 직접 오류를 보고한 기록입니다. CPU·메모리·PCIe 장치·전원 중 하나의 불안정과 연관되는 일이 많지만 어느 부품인지는 이 기록만으로 알 수 없습니다.",
      withRestart: "재부팅 기록과 함께 있어 하드웨어 오류가 재시작으로 이어졌을 가능성을 먼저 살필 만합니다.",
      next: "오버클럭·XMP/EXPO 설정을 기본값으로 돌리고, WHEA 상세 페이지의 오류 유형부터 구분하세요.",
      links: [["event-whea-logger-17.html", "WHEA-Logger 17 해설"]]
    },
    {
      title: "그래픽 드라이버·GPU 경로",
      keys: ["display|4101", "nvlddmkm|153", "livekernelevent|141"],
      text: "그래픽 드라이버가 응답하지 않아 복구했거나 GPU 쪽 오류를 남긴 기록입니다. 드라이버 문제인 경우가 흔하지만 과열·전원·GPU 불량과 구분하려면 반복 시점과 부하 상황을 봐야 합니다.",
      withRestart: "재부팅·블루스크린과 함께 있어 GPU 부하 중 시스템이 멈췄는지 확인할 만합니다.",
      next: "그래픽 드라이버를 완전 제거 후 재설치하고, 게임·렌더링 중 온도와 전원을 확인하세요.",
      links: [["event-display-4101.html", "Display 4101 해설"], ["hardware-gpu-artifacts.html", "화면 깨짐 가이드"]]
    },
    {
      title: "블루스크린 후 재시작",
      keys: ["bugcheck|1001"],
      text: "블루스크린(BugCheck) 뒤에 남는 기록입니다. 정지 코드는 이벤트 본문이나 덤프 파일에 있습니다.",
      next: "본문의 BugCheck 코드를 확인하고, 덤프 파일은 미니덤프 분석기로 해석해 보세요.",
      links: [["event-bugcheck-1001.html", "BugCheck 1001 해설"], ["minidump-analyzer.html", "미니덤프 분석기"]]
    },
    {
      title: "절전·복귀 경로",
      keys: ["power-troubleshooter|1", "kernel-power|42", "kernel-power|107", "kernel-power|109", "kernel-power|172", "kernel-power|566", "kernel-power|577"],
      text: "절전·최대 절전 진입 또는 복귀와 관련된 기록입니다.",
      withRestart: "복귀 중 비정상 종료 기록이 함께 있어 절전 복귀 실패 가능성을 살필 만합니다.",
      next: "절전 복귀 직후의 기록을 보고, 장치 드라이버·빠른 시작 설정을 점검하세요.",
      links: [["event-power-sleep-wake.html", "절전·복귀 이벤트 가이드"], ["windows-sleep-resume-fail.html", "절전 복귀 실패 가이드"]]
    },
    {
      title: "장치 시작·드라이버 문제",
      keys: ["kernel-pnp|219", "kernel-pnp|411"],
      text: "장치가 시작되지 못했거나 드라이버가 로드되지 않았다는 Plug and Play 기록입니다. 어느 장치인지(장치 인스턴스 ID)가 이벤트 본문에 있습니다.",
      next: "장치 관리자에서 해당 장치의 상태와 오류 코드를 확인하고, 제조사 드라이버를 재설치하세요. Kernel-PnP 411은 시스템 로그가 아니라 Kernel-PnP/Configuration 로그에 남습니다.",
      links: [["event-kernel-pnp-411.html", "Kernel-PnP 411 해설"], ["device-manager-codes.html", "장치 관리자 오류 코드 모음"]]
    },
    {
      title: "서비스 시작·종료 실패",
      keys: ["servicecontrolmanager|7000", "servicecontrolmanager|7001", "servicecontrolmanager|7009", "servicecontrolmanager|7011",
        "servicecontrolmanager|7022", "servicecontrolmanager|7023", "servicecontrolmanager|7024", "servicecontrolmanager|7026",
        "servicecontrolmanager|7031", "servicecontrolmanager|7032", "servicecontrolmanager|7034", "servicecontrolmanager|7038"],
      text: "Windows 서비스가 시작하지 못했거나 예기치 않게 종료된 기록입니다. 같은 서비스가 반복되는지 이름을 확인하세요.",
      next: "서비스 이름을 확인하고 해당 프로그램·드라이버 업데이트 여부를 점검하세요.",
      links: [["event-service-7034.html", "서비스 7034 해설"]]
    },
    {
      title: "로그인 실패·계정 잠금",
      keys: ["security|4625", "security|4740"],
      text: "로그인 실패나 계정 잠금 기록입니다. 비밀번호 오입력일 수도 있고 외부에서의 반복 시도일 수도 있습니다.",
      next: "실패가 어디에서(내부/외부) 반복되는지 상세 내용을 확인하세요.",
      links: [["event-security-4625.html", "Security 4625 해설"]]
    }
  ];

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

  // ---- 패턴 판별 -------------------------------------------------------------------
  function isRestart(r) { return !!(r.source && RESTART_KEYS[normSource(r.source) + "|" + r.id]); }

  function matchPatterns(groups) {
    var counts = {};
    groups.forEach(function (g) { if (g.source) counts[g.key] = g.count; });
    var restartCount = 0;
    Object.keys(RESTART_KEYS).forEach(function (k) { restartCount += counts[k] || 0; });
    var out = [];
    PATTERNS.forEach(function (p) {
      var hit = [];
      var total = 0;
      p.keys.forEach(function (k) { if (counts[k]) { hit.push(k); total += counts[k]; } });
      if (!hit.length) return;
      out.push({ rule: p, hits: hit, total: total, withRestart: restartCount > 0 });
    });
    if (restartCount && !out.length) {
      out.push({
        rule: {
          title: "재부팅 기록만 있고 단서가 부족함",
          text: "비정상 종료 기록은 있지만 붙여넣은 범위에서 원인을 가리킬 만한 다른 기록이 보이지 않습니다.",
          next: "재부팅 시각 앞뒤로 범위를 넓혀 System 로그를 다시 모으고(아래 명령 만들기 사용), 블루스크린이 있었다면 덤프 파일을 분석하세요.",
          links: [["minidump-analyzer.html", "미니덤프 분석기"], ["event-kernel-power-41.html", "Kernel-Power 41 해설"]]
        },
        hits: [], total: 0, withRestart: true
      });
    }
    return out.sort(function (a, b) { return b.total - a.total; });
  }

  function patternHtml(patterns) {
    if (!patterns.length) return "";
    var items = patterns.map(function (m) {
      var p = m.rule;
      var head = "<strong>" + esc(p.title) + "</strong>";
      if (m.total) head += ' <span class="muted">(관련 기록 ' + m.total + "건" + (m.total >= 3 ? ", 반복됨" : "") + ")</span>";
      var body = "<p>" + esc(p.text) + (m.withRestart && p.withRestart ? " " + esc(p.withRestart) : "") + "</p>";
      if (p.next) body += "<p><strong>먼저 할 일:</strong> " + esc(p.next) + "</p>";
      var links = (p.links || []).map(function (l) { return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + "</a>"; }).join("");
      return "<li>" + head + body + (links ? '<div class="link-list">' + links + "</div>" : "") + "</li>";
    });
    return '<section class="card ela-notice"><h3>이런 패턴으로 보입니다</h3><ul class="mini-list">' + items.join("") +
      '</ul><p class="muted">기록의 조합으로 의심 범위를 좁힌 것이며 원인 확정이 아닙니다. 같은 기록이 정상 PC에서도 남는 경우가 있으니 증상이 있었던 시각의 기록을 우선 보세요.</p></section>';
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
          '" target="_blank" rel="noopener noreferrer">Microsoft Learn에서 검색</a><a href="diagnostic.html">진단 도구에서 증상과 함께 분석</a>' +
          '<a href="' + esc(requestUrl(g)) + '" target="_blank" rel="noopener noreferrer">이 이벤트 해설 요청하기 (GitHub, 공개)</a></div>' +
          '<p class="muted">요청에는 원본 이름과 이벤트 ID만 미리 채워집니다. 컴퓨터 이름·사용자 이름 같은 개인정보는 적지 마세요.</p>';
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

  function fmtDur(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + "분";
    var h = Math.floor(m / 60);
    if (h < 24) return h + "시간" + (m % 60 ? " " + (m % 60) + "분" : "");
    var d = Math.floor(h / 24);
    return d + "일" + (h % 24 ? " " + (h % 24) + "시간" : "");
  }

  function restartClusters(timed) {
    var restarts = timed.filter(isRestart).sort(function (a, b) { return a.ms - b.ms; });
    var clusters = [];
    restarts.forEach(function (r) {
      var c = clusters[clusters.length - 1];
      if (c && r.ms - c.last.ms <= CLUSTER_MS) { c.last = r; c.members.push(r); }
      else clusters.push({ first: r, last: r, members: [r] });
    });
    return clusters;
  }

  function labelList(list, max) {
    var seen = {};
    var items = [];
    list.forEach(function (r) {
      var label = (r.source || "원본 미확인") + " " + r.id;
      if (seen[label]) return;
      seen[label] = true;
      items.push(esc(fmtTime(r)) + " " + esc(label));
    });
    var more = items.length > max ? " 외 " + (items.length - max) + "종" : "";
    return items.slice(0, max).join(", ") + more;
  }

  function recurrenceNote(clusters) {
    if (clusters.length < 2) return "";
    var gaps = [];
    for (var i = 1; i < clusters.length; i++) gaps.push(clusters[i].first.ms - clusters[i - 1].last.ms);
    var min = Math.min.apply(null, gaps);
    var max = Math.max.apply(null, gaps);
    var text = "재부팅 " + clusters.length + "회, 간격: " + gaps.slice(0, 8).map(fmtDur).join(" → ") + (gaps.length > 8 ? " …" : "") + ". ";
    if (clusters.length >= 3 && min > 0 && max / min <= 1.3) {
      text += "간격이 비슷합니다(약 " + fmtDur(gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length) +
        "). 예약 작업·업데이트·타이머처럼 주기적인 요인도 함께 확인해 볼 만합니다.";
    } else if (clusters[clusters.length - 1].last.ms - clusters[0].first.ms <= 24 * 3600 * 1000) {
      text += "하루 안에 반복되었습니다. 같은 조건(부하, 시각, 작업)에서 일어나는지 살펴보세요.";
    } else {
      text += "간격이 일정하지 않습니다.";
    }
    return text;
  }

  function timelineHtml(records) {
    var timed = records.filter(function (r) { return r.ms !== null; });
    var clusters = restartClusters(timed);
    if (!clusters.length) return "";
    var blocks = [];
    clusters.slice(0, 5).forEach(function (c) {
      var names = {};
      c.members.forEach(function (r) { names[(r.source || "") + " " + r.id] = 1; });
      var name = Object.keys(names).join(" + ");
      var before = timed.filter(function (r) {
        return !isRestart(r) && r.ms <= c.first.ms && c.first.ms - r.ms <= CORRELATION_MS;
      }).sort(function (a, b) { return a.ms - b.ms; });
      var after = timed.filter(function (r) {
        return !isRestart(r) && !BOOT_NOISE[normSource(r.source) + "|" + r.id] && r.ms >= c.last.ms && r.ms - c.last.ms <= CORRELATION_MS;
      }).sort(function (a, b) { return a.ms - b.ms; });
      var line = "<li><strong>" + esc(fmtTime(c.first)) + " " + esc(name) + "</strong>";
      line += before.length
        ? "<br>직전 10분: " + labelList(before, 8)
        : "<br>직전 10분 안에 붙여넣은 다른 기록이 없습니다. 더 넓은 범위의 로그를 붙여넣으면 앞뒤 흐름을 볼 수 있습니다.";
      line += after.length
        ? "<br>직후 10분(부팅 때마다 남는 기록 제외): " + labelList(after, 8)
        : "<br>직후 10분 안에 다른 이상 기록은 없습니다(또는 붙여넣지 않았습니다).";
      blocks.push(line + "</li>");
    });
    var note = recurrenceNote(clusters);
    return '<section class="card"><h3>재부팅·비정상 종료 전후 기록</h3><ul class="mini-list">' + blocks.join("") +
      "</ul>" + (note ? "<p>" + esc(note) + "</p>" : "") +
      '<p class="muted">전후에 있던 기록이 원인이라는 뜻은 아닙니다. 어떤 기록부터 열어 볼지 정하는 단서로만 쓰세요. 같은 시각(3분 이내)의 41·6008은 한 번의 재부팅으로 묶어 셉니다.</p></section>';
  }


  // ---- 해설 요청 링크 ---------------------------------------------------------------
  function requestUrl(g) {
    var title = "이벤트 해설 요청: " + g.source + " " + g.id;
    var body = "원본(Source): " + g.source + "\n이벤트 ID: " + g.id + "\n\n(컴퓨터 이름, 사용자 이름, 계정 정보는 적지 마세요.)";
    return "https://github.com/itcode21-alt/pc-check-tools/issues/new?title=" + encodeURIComponent(title) + "&body=" + encodeURIComponent(body);
  }

  // ---- 시간대별 분포 ----------------------------------------------------------------
  function bucketStart(ms, hourly) {
    var d = new Date(ms);
    return hourly ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()).getTime()
      : new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function histogramHtml(records) {
    var timed = records.filter(function (r) { return r.ms !== null; });
    if (timed.length < HIST_MIN_RECORDS) return "";
    var min = Math.min.apply(null, timed.map(function (r) { return r.ms; }));
    var max = Math.max.apply(null, timed.map(function (r) { return r.ms; }));
    if (max - min <= 0) return "";
    var hourly = max - min <= 48 * 3600 * 1000;
    var buckets = [];
    var index = {};
    var cur = new Date(bucketStart(min, hourly));
    while (cur.getTime() <= max && buckets.length <= HIST_MAX_BUCKETS) {
      index[cur.getTime()] = buckets.length;
      buckets.push({ t: cur.getTime(), n: 0, restart: 0 });
      if (hourly) cur.setHours(cur.getHours() + 1); else cur.setDate(cur.getDate() + 1);
    }
    if (buckets.length > HIST_MAX_BUCKETS) return "";
    timed.forEach(function (r) {
      var b = buckets[index[bucketStart(r.ms, hourly)]];
      if (!b) return;
      b.n++;
      if (isRestart(r)) b.restart++;
    });
    var peak = buckets.reduce(function (a, b) { return b.n > a.n ? b : a; }, buckets[0]);
    var label = function (t) {
      var d = new Date(t);
      return (d.getMonth() + 1) + "/" + d.getDate() + (hourly ? " " + d.getHours() + "시" : "");
    };
    var bars = buckets.map(function (b) {
      var h = Math.max(b.n ? 6 : 0, Math.round(b.n / peak.n * 100));
      var cls = b.restart ? "ela-bar ela-bar-restart" : "ela-bar";
      return '<span class="' + cls + '" style="height:' + h + '%" title="' + esc(label(b.t) + " · " + b.n + "건" + (b.restart ? " (재부팅 기록 포함)" : "")) + '"></span>';
    }).join("");
    var summary = "기록이 가장 많은 구간은 " + label(peak.t) + " (" + peak.n + "건)입니다.";
    var share = Math.round(peak.n / timed.length * 100);
    var focus = peak.n >= 3 && share >= 50 && buckets.length >= 3
      ? " 전체 기록의 " + share + "%가 이 구간에 몰려 있습니다. 그 시각 앞뒤에 무엇을 하고 있었는지 떠올려 보세요(게임, 업데이트, 절전 복귀 등)."
      : "";
    return '<section class="card"><h3>시간대별 기록 분포</h3>' +
      '<div class="ela-hist" role="img" aria-label="' + esc("시간대별 기록 분포. " + summary) + '">' + bars + "</div>" +
      '<p class="ela-hist-axis muted"><span>' + esc(label(buckets[0].t)) + "</span><span>" + esc(label(buckets[buckets.length - 1].t)) + "</span></p>" +
      "<p>" + esc(summary + focus) + "</p>" +
      '<p class="muted">막대 하나는 ' + (hourly ? "1시간" : "하루") + "입니다. 주황색 막대는 재부팅·비정상 종료 기록이 포함된 구간입니다.</p></section>";
  }

  // ---- 더 모으면 좋은 로그 ----------------------------------------------------------
  function gapNotices(groups, records, shared) {
    var has = {};
    groups.forEach(function (g) { if (g.source) has[g.key] = g.count; });
    var any = function (prefix) {
      return Object.keys(has).some(function (k) { return k.indexOf(prefix) === 0; });
    };
    var restart = Object.keys(RESTART_KEYS).some(function (k) { return has[k]; });
    var out = [];
    if (restart && !has["bugcheck|1001"] && !any("whea-logger|")) {
      out.push("재부팅 기록은 있지만 블루스크린(BugCheck 1001)이나 WHEA 기록이 없습니다. 전원이 갑자기 끊긴 형태일 수 있고(전원·과열·강제 종료), 붙여넣은 범위 밖에 있을 수도 있습니다. 재부팅 시각 앞뒤로 범위를 넓혀 다시 모으거나, 블루스크린을 봤다면 <a href=\"minidump-analyzer.html\">미니덤프 분석기</a>를 써 보세요.");
    }
    if ((has["display|4101"] || has["nvlddmkm|153"] || has["livekernelevent|141"]) && !has["applicationerror|1000"] && !has["applicationhang|1002"]) {
      out.push("그래픽 관련 기록은 있는데 Application 로그의 프로그램 오류(1000)·응답 없음(1002)이 없습니다. 어느 프로그램에서 일어났는지 보려면 아래 \"수집 명령 만들기\"에서 \"프로그램이 자꾸 종료됨\"을 골라 함께 모아 보세요.");
    }
    var untimed = records.filter(function (r) { return r.ms === null; }).length;
    if (!shared && untimed) {
      out.push("시각을 읽지 못한 기록이 " + untimed + "건 있습니다. 시각이 없으면 전후 비교와 분포를 만들 수 없습니다. PowerShell에서 모을 때는 <code>Format-List TimeCreated, ProviderName, Id</code>처럼 TimeCreated를 포함하세요.");
    }
    var noSource = groups.filter(function (g) { return !g.source; }).reduce(function (a, g) { return a + g.count; }, 0);
    if (noSource) {
      out.push("원본(Source)을 읽지 못한 기록이 " + noSource + "건 있습니다. 같은 ID라도 원본에 따라 뜻이 달라서 해석하지 못했습니다. 원본이 함께 보이도록 다시 복사해 주세요.");
    }
    return out;
  }

  function gapHtml(notices) {
    if (!notices.length) return "";
    return '<section class="card"><h3>더 모으면 좋은 로그</h3><ul class="mini-list">' +
      notices.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></section>";
  }

  // ---- 이전 해석과 비교 (이 페이지가 열려 있는 동안만 메모리에 보관) -----------------
  function snapshot(groups) {
    var snap = {};
    groups.forEach(function (g) { snap[g.key] = { label: (g.source || "원본 미확인") + " " + g.id, count: g.count }; });
    return snap;
  }

  function compareHtml(prev, groups) {
    var now = snapshot(groups);
    var gone = [];
    var still = [];
    var fresh = [];
    Object.keys(prev).forEach(function (k) {
      if (!now[k]) gone.push(prev[k].label + " (" + prev[k].count + "건)");
      else still.push(now[k].label + " " + prev[k].count + "건 → " + now[k].count + "건");
    });
    Object.keys(now).forEach(function (k) { if (!prev[k]) fresh.push(now[k].label + " (" + now[k].count + "건)"); });
    var part = function (title, list) {
      return list.length ? "<li><strong>" + title + "</strong>: " + list.slice(0, 8).map(esc).join(", ") + (list.length > 8 ? " 외 " + (list.length - 8) + "종" : "") + "</li>" : "";
    };
    return '<section class="card"><h3>직전 해석과 비교</h3><ul class="mini-list">' +
      part("이번에는 보이지 않는 이벤트", gone) + part("계속 보이는 이벤트", still) + part("새로 보이는 이벤트", fresh) +
      '</ul><p class="muted">같은 기간·같은 명령으로 모은 로그끼리 비교해야 의미가 있습니다. 이 비교는 이 페이지를 연 동안만 브라우저 메모리에 있고, 새로고침하거나 "지우기"를 누르면 사라집니다. 어디에도 저장하거나 전송하지 않습니다.</p></section>';
  }

  // ---- 내보내기: 마크다운, 공유 링크 -------------------------------------------------
  function mdCell(s) { return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " "); }

  function markdownSummary(groups, patterns) {
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin : "https://itsvc.co.kr";
    var lines = ["## 이벤트 로그 해석 요약", ""];
    if (patterns && patterns.length) {
      lines.push("의심 범위(확정 아님): " + patterns.map(function (m) { return m.rule.title; }).join(", "), "");
    }
    lines.push("| 원본 | 이벤트 ID | 횟수 | 수준 | 설명 |", "|---|---|---|---|---|");
    groups.forEach(function (g) {
      var level = g.entry ? (LEVEL_LABEL[g.entry.level] || g.entry.level) : "-";
      var doc = g.entry && g.entry.detailPage && g.entry.detailPage !== "event-viewer-guide.html"
        ? "[자세히](" + base + "/" + g.entry.detailPage + ")" : "-";
      lines.push("| " + mdCell(g.source || "원본 미확인") + " | " + mdCell(g.id) + " | " + g.count + " | " + level + " | " + doc + " |");
    });
    lines.push("", "해석 도구: " + base + "/event-log-analyzer.html");
    return lines.join("\n");
  }

  function toBase64Url(str) {
    return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function fromBase64Url(b64) {
    b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    return decodeURIComponent(escape(atob(b64)));
  }

  // 공유 링크에는 원본·이벤트 ID·횟수만 담는다(시각·본문은 담지 않는다).
  function shareLink(groups) {
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin + location.pathname : "https://itsvc.co.kr/event-log-analyzer.html";
    var list = groups.slice(0, SHARE_MAX_GROUPS).map(function (g) { return [g.source || "", String(g.id), g.count]; });
    return base + "#s=" + toBase64Url(JSON.stringify(list));
  }

  function groupsFromShare(hash) {
    var m = /^#s=([A-Za-z0-9_-]+)$/.exec(hash || "");
    if (!m || m[1].length > 6000) return null;
    try {
      var list = JSON.parse(fromBase64Url(m[1]));
      if (!Array.isArray(list) || !list.length || list.length > SHARE_MAX_GROUPS) return null;
      var groups = [];
      for (var i = 0; i < list.length; i++) {
        var it = list[i];
        if (!Array.isArray(it) || typeof it[0] !== "string" || typeof it[1] !== "string" || typeof it[2] !== "number") return null;
        if (it[0].length > 80 || !/^\d{1,6}$/.test(it[1]) || it[2] < 1 || it[2] > 99999 || Math.floor(it[2]) !== it[2]) return null;
        var g = { key: (it[0] ? normSource(it[0]) : "?") + "|" + it[1], source: it[0] || null, id: it[1], count: it[2], first: null, last: null, entry: null };
        g.entry = r_entry(g);
        groups.push(g);
      }
      return groups;
    } catch (e) {
      return null;
    }
  }

  function plainSummary(groups, patterns) {
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
    if (patterns && patterns.length) {
      lines.push("의심 범위(확정 아님): " + patterns.map(function (m) { return m.rule.title; }).join(", "));
    }
    lines.push("해석 도구: " + base + "/event-log-analyzer.html");
    return lines.join("\n");
  }

  // 결과 화면 한 벌을 만든다. records가 비어 있으면(공유 링크) 시각이 필요한 부분은 생략된다.
  function viewHtml(groups, records, opts) {
    var patterns = matchPatterns(groups);
    var notices = noticesHtml(groups, records);
    var html = patternHtml(patterns);
    if (notices.length) {
      html += '<section class="card ela-notice"><h3>종합 의견</h3><ul class="mini-list">' + notices.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></section>";
    }
    if (opts.prev) html += compareHtml(opts.prev, groups);
    html += gapHtml(gapNotices(groups, records, opts.shared));
    html += histogramHtml(records);
    html += timelineHtml(records);
    html += groups.map(cardHtml).join("");
    return { html: html, patterns: patterns };
  }

  function outputs(groups, patterns) {
    return { summary: plainSummary(groups, patterns), markdown: markdownSummary(groups, patterns), share: shareLink(groups) };
  }

  // 마지막 비교 기준. 이 변수는 페이지가 열려 있는 동안만 존재한다.
  var baseline = null;

  function render(text, resultEl, statusEl, actionsEl, compare) {
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
    var view = viewHtml(groups, records, { prev: compare ? baseline : null });
    baseline = compare ? snapshot(groups) : null;
    resultEl.innerHTML = view.html;
    actionsEl.hidden = false;
    return outputs(groups, view.patterns);
  }

  function renderShared(groups, resultEl, statusEl, actionsEl) {
    groups = sortGroups(groups);
    var total = groups.reduce(function (a, g) { return a + g.count; }, 0);
    statusEl.textContent = "공유 링크로 열린 요약입니다 · 기록 " + total + "건 · 서로 다른 이벤트 " + groups.length + "종. 시각 정보는 링크에 담기지 않아 전후 비교와 분포는 표시하지 않습니다.";
    var view = viewHtml(groups, [], { shared: true });
    resultEl.innerHTML = view.html;
    actionsEl.hidden = false;
    baseline = null;
    return outputs(groups, view.patterns);
  }

  // ---- 수집 명령 만들기 ------------------------------------------------------------
  // ids가 없으면 중대·오류·경고(Level 1~3)만 모은다.
  var PS_PRESETS = [
    { label: "갑자기 재부팅되거나 꺼짐", logs: ["System"], ids: [41, 6008, 1001, 1074, 6005, 6006, 17, 18, 19, 20, 46, 47],
      desc: "비정상 종료(41·6008), 블루스크린(1001), 정상 종료·시작(1074·6005·6006), WHEA 하드웨어 오류를 모읍니다." },
    { label: "블루스크린", logs: ["System"], ids: [1001, 41, 6008, 17, 18, 19, 20, 46, 47, 7, 11, 51, 153, 154, 157],
      desc: "BugCheck(1001)와 그 전후에 자주 함께 남는 하드웨어·디스크 오류를 모읍니다." },
    { label: "디스크 오류·멈춤·느려짐", logs: ["System"], ids: [7, 9, 11, 15, 51, 52, 55, 57, 98, 129, 137, 140, 153, 154, 157, 158, 41],
      desc: "Disk·Ntfs·storahci·stornvme 계열의 입출력 오류, 재시도, 고장 예측 기록을 모읍니다." },
    { label: "화면 깜빡임·그래픽 멈춤", logs: ["System"], ids: [4101, 141, 153, 1001, 41],
      desc: "그래픽 드라이버 복구(4101), GPU 오류(141·nvlddmkm 153), 재시작 기록을 모읍니다." },
    { label: "절전·복귀 문제", logs: ["System"], ids: [1, 42, 107, 109, 172, 566, 41, 6008],
      desc: "절전 진입·복귀(Power-Troubleshooter 1, Kernel-Power 42·107·109)와 비정상 종료를 모읍니다." },
    { label: "장치 인식·드라이버 문제", logs: ["System", "Microsoft-Windows-Kernel-PnP/Configuration"], ids: [219, 411, 7026],
      desc: "Kernel-PnP 219·411(장치 시작 문제), SCM 7026(부팅 드라이버 로드 실패)을 모읍니다. 411은 Kernel-PnP/Configuration 로그에 남습니다." },
    { label: "프로그램이 자꾸 종료됨", logs: ["Application"], ids: [1000, 1002, 1026, 1001],
      desc: "응용 프로그램 오류(1000), 응답 없음(1002), .NET 오류(1026), 오류 보고(1001)를 모읍니다." },
    { label: "오류·경고 전체 (System + Application)", logs: ["System", "Application"], ids: null,
      desc: "ID를 가리지 않고 중대·오류·경고 수준만 모읍니다. 증상을 모를 때 쓰세요." }
  ];
  var PS_DAYS = [1, 3, 7, 14, 30];
  var PS_MAX = [50, 100, 300, 500];

  function buildCommand(preset, days, max) {
    var filter = "LogName=" + preset.logs.map(function (l) { return "'" + l + "'"; }).join(",") + "; " +
      (preset.ids ? "Id=" + preset.ids.join(",") : "Level=1,2,3") + "; StartTime=(Get-Date).AddDays(-" + days + ")";
    return "Get-WinEvent -FilterHashtable @{" + filter + "} -MaxEvents " + max +
      " -ErrorAction SilentlyContinue | Format-List TimeCreated, ProviderName, Id";
  }

  function initCommandBuilder() {
    var box = document.getElementById("ela-ps");
    var sel = document.getElementById("ela-ps-symptom");
    var daysEl = document.getElementById("ela-ps-days");
    var maxEl = document.getElementById("ela-ps-max");
    var out = document.getElementById("ela-ps-cmd");
    var desc = document.getElementById("ela-ps-desc");
    var copy = document.getElementById("ela-ps-copy");
    if (!box || !sel || !daysEl || !maxEl || !out) return;
    var opt = function (el, value, label, selected) {
      var o = document.createElement("option");
      o.value = value; o.textContent = label; if (selected) o.selected = true;
      el.appendChild(o);
    };
    PS_PRESETS.forEach(function (p, i) { opt(sel, i, p.label, false); });
    PS_DAYS.forEach(function (d) { opt(daysEl, d, "최근 " + d + "일", d === 3); });
    PS_MAX.forEach(function (m) { opt(maxEl, m, "최대 " + m + "건", m === 100); });
    var update = function () {
      var preset = PS_PRESETS[+sel.value];
      out.textContent = buildCommand(preset, +daysEl.value, +maxEl.value);
      if (desc) desc.textContent = preset.desc;
    };
    [sel, daysEl, maxEl].forEach(function (el) { el.addEventListener("change", update); });
    if (copy) {
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = "복사했습니다"; setTimeout(function () { copy.textContent = "명령 복사"; }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.textContent).then(done, function () {});
      });
    }
    update();
    box.hidden = false;
  }

  // ---- 연결 ----------------------------------------------------------------------
  function init() {
    var input = document.getElementById("ela-input");
    var resultEl = document.getElementById("ela-result");
    var statusEl = document.getElementById("ela-status");
    var actionsEl = document.getElementById("ela-actions");
    var copyBtn = document.getElementById("ela-copy");
    var fileEl = document.getElementById("ela-file");
    initCommandBuilder();
    if (!input || !resultEl) return;
    var lastOut = null;
    var flash = function (btn, text, original) { btn.textContent = text; setTimeout(function () { btn.textContent = original; }, 1800); };
    var copyOf = function (btn, key, original) {
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (!lastOut) return;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(lastOut[key]).then(function () { flash(btn, "복사했습니다", original); }, function () {});
        }
      });
    };

    document.getElementById("ela-run").addEventListener("click", function () {
      lastOut = render(input.value, resultEl, statusEl, actionsEl, true);
    });
    document.getElementById("ela-sample").addEventListener("click", function () {
      input.value = SAMPLE;
      lastOut = render(input.value, resultEl, statusEl, actionsEl, false);
    });
    document.getElementById("ela-clear").addEventListener("click", function () {
      input.value = "";
      resultEl.innerHTML = "";
      statusEl.textContent = "";
      actionsEl.hidden = true;
      lastOut = null;
      baseline = null;
      if (fileEl) fileEl.value = "";
      if (location.hash.indexOf("#s=") === 0 && history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    });
    if (fileEl) {
      fileEl.addEventListener("change", function () {
        var f = fileEl.files && fileEl.files[0];
        if (!f) return;
        if (f.size > MAX_CHARS) { statusEl.textContent = "파일이 2MB를 넘습니다. 기간이나 개수를 줄여 다시 저장해 주세요."; return; }
        var reader = new FileReader();
        reader.onload = function () {
          input.value = String(reader.result || "");
          lastOut = render(input.value, resultEl, statusEl, actionsEl, true);
        };
        reader.readAsText(f);
      });
    }
    copyOf(copyBtn, "summary", "요약 복사");
    copyOf(document.getElementById("ela-copy-md"), "markdown", "마크다운 복사");
    copyOf(document.getElementById("ela-copy-link"), "share", "공유 링크 복사");
    var printBtn = document.getElementById("ela-print");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    var shared = groupsFromShare(location.hash);
    if (shared) lastOut = renderShared(shared, resultEl, statusEl, actionsEl);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      extract: extract, group: group, matchPatterns: matchPatterns, timelineHtml: timelineHtml, buildCommand: buildCommand,
      PS_PRESETS: PS_PRESETS, PATTERNS: PATTERNS, histogramHtml: histogramHtml, gapNotices: gapNotices, compareHtml: compareHtml,
      snapshot: snapshot, markdownSummary: markdownSummary, shareLink: shareLink, groupsFromShare: groupsFromShare, requestUrl: requestUrl, cardHtml: cardHtml
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
