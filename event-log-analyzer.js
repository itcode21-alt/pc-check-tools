// 이벤트 로그 붙여넣기 해석기: 사용자가 붙여넣은 이벤트 뷰어 텍스트·XML·PowerShell 출력에서
// (원본, 이벤트 ID) 쌍을 뽑아 사이트의 eventViewerCodes 해설과 연결한다.
// 모든 처리는 브라우저 안에서만 이루어지며 입력 내용은 어디로도 전송·저장하지 않는다.
(function () {
  "use strict";

  // 같은 코드가 한국어 페이지(event-log-analyzer.html)와 영문 페이지(en/event-log-analyzer.html)를 함께 구동한다.
  // 화면에 나오는 문구는 T(한국어, 영어)로 짝을 지어 두고, 한국어 페이지의 출력은 그대로 유지한다.
  var LANG = typeof document !== "undefined" && document.documentElement && document.documentElement.lang === "en" ? "en" : "ko";
  var T = function (ko, en) { return LANG === "en" ? en : ko; };
  // 영문 해설(영문 페이지에서만 사용): { "정규화한 원본|ID": { slug, t, s, c, w } }
  var EN_DATA = (typeof window !== "undefined" && window.EVENT_EN_DATA) || {};
  var enPage = function (e) { return "/en/event-" + e.slug + ".html"; };

  var MAX_CHARS = 2000000;
  var MAX_LINES = 20000;
  var LEVEL_LABEL = { critical: T("중대", "Critical"), error: T("오류", "Error"), warning: T("경고", "Warning"), information: T("정보", "Information") };
  var LEVEL_RANK = { critical: 0, error: 1, warning: 2, information: 3 };
  // driver/info 분류는 서비스·네트워크·TPM 등 성격이 다른 이벤트를 넓게 묶고 있어 배지로 보여 주지 않는다.
  var URGENCY_LABEL = { "repeat-check": T("반복되면 확인", "Check if it repeats"), backup: T("백업 먼저", "Back up first") };
  var RESTART_KEYS = { "kernel-power|41": 1, "eventlog|6008": 1 };
  var CORRELATION_MS = 10 * 60 * 1000;
  // 41과 6008은 같은 재부팅에서 함께 남으므로 이 간격 안의 재부팅 기록은 한 번으로 센다.
  var FORMAT_LABEL = { xml: T("이벤트 XML", "Event XML"), powershell: T("PowerShell Format-List 출력", "PowerShell Format-List output"), labeled: T("이벤트 뷰어 일반 탭 내용", "Event Viewer General tab text"), pairs: T("한 줄 형식(원본·ID만 인식)", "One-line format (source and ID only)") };
  var CLUSTER_MS = 3 * 60 * 1000;
  // 부팅할 때마다 정상적으로 남는 기록은 "재부팅 직후 기록"에서 뺀다.
  var FILTER_MIN_GROUPS = 4;
  var HIST_MIN_RECORDS = 5;
  var HIST_MAX_BUCKETS = 62;
  var SHARE_MAX_GROUPS = 60;
  var BOOT_NOISE = { "eventlog|6005": 1, "eventlog|6009": 1, "eventlog|6013": 1, "kernel-general|12": 1 };

  // 이벤트 조합 규칙: 확정이 아니라 "어느 쪽부터 의심할지"만 알려 준다.
  // keys는 normSource(원본)|이벤트 ID 형식이다.
  var PATTERNS = [
    {
      title: T("저장장치 입출력 오류 경로", "Storage I/O error path"),
      keys: ["disk|7", "disk|9", "disk|11", "disk|15", "disk|51", "disk|52", "disk|98", "disk|153", "disk|154", "disk|157", "disk|158",
        "storahci|129", "stornvme|11", "stornvme|129", "ntfs|50", "ntfs|55", "ntfs|57", "ntfs|98", "ntfs|137", "ntfs|140", "esent|508", "esent|509", "volmgr|161", "volmgr|162"],
      text: T("디스크·파일 시스템 계열 기록입니다. SSD/HDD 자체뿐 아니라 SATA·전원 케이블, 컨트롤러, 드라이버도 같은 기록을 남깁니다.",
        "Records from the disk and file-system layers. Besides the SSD/HDD itself, SATA/power cables, the controller and drivers can leave the same records."),
      withRestart: T("재부팅 기록이 함께 있어 저장장치 문제로 시스템이 멈췄을 가능성을 먼저 살필 만합니다.",
        "A restart record is also present, so it is worth first considering that a storage problem made the system stop."),
      next: T("중요한 파일을 먼저 백업하고, 디스크 상태(SMART)와 연결 상태를 점검하세요.",
        "Back up important files first, then check the drive's health (SMART) and its connections."),
      links: T([["event-disk-153.html", "Disk 153 해설"], ["windows-disk-usage-100.html", "디스크 사용률 100% 가이드"]],
        [["/en/event-disk-153.html", "Disk 153 explained"], ["/en/event-disk-7.html", "Disk 7 explained"]])
    },
    {
      title: T("하드웨어 오류 보고 경로 (WHEA)", "Hardware error reports (WHEA)"),
      keys: ["whea-logger|1", "whea-logger|17", "whea-logger|18", "whea-logger|19", "whea-logger|20", "whea-logger|46", "whea-logger|47"],
      text: T("하드웨어가 직접 오류를 보고한 기록입니다. CPU·메모리·PCIe 장치·전원 중 하나의 불안정과 연관되는 일이 많지만 어느 부품인지는 이 기록만으로 알 수 없습니다.",
        "Records where the hardware itself reported an error. They are often linked to instability in the CPU, memory, a PCIe device or power, but this record alone cannot say which part."),
      withRestart: T("재부팅 기록과 함께 있어 하드웨어 오류가 재시작으로 이어졌을 가능성을 먼저 살필 만합니다.",
        "Together with a restart record, it is worth first considering that a hardware error led to the restart."),
      next: T("오버클럭·XMP/EXPO 설정을 기본값으로 돌리고, WHEA 상세 페이지의 오류 유형부터 구분하세요.",
        "Reset overclock and XMP/EXPO settings to defaults, and start by telling apart the error type on the WHEA detail page."),
      links: T([["event-whea-logger-17.html", "WHEA-Logger 17 해설"]],
        [["/en/event-whea-logger-18.html", "WHEA-Logger 18 explained"], ["/en/event-whea-logger-1.html", "WHEA-Logger 1 explained"]])
    },
    {
      title: T("그래픽 드라이버·GPU 경로", "Graphics driver / GPU path"),
      keys: ["display|4101", "nvlddmkm|153", "livekernelevent|141"],
      text: T("그래픽 드라이버가 응답하지 않아 복구했거나 GPU 쪽 오류를 남긴 기록입니다. 드라이버 문제인 경우가 흔하지만 과열·전원·GPU 불량과 구분하려면 반복 시점과 부하 상황을 봐야 합니다.",
        "Records where the graphics driver stopped responding and recovered, or the GPU reported an error. A driver problem is common, but telling it apart from overheating, power or a faulty GPU needs the timing of repeats and the load at that moment."),
      withRestart: T("재부팅·블루스크린과 함께 있어 GPU 부하 중 시스템이 멈췄는지 확인할 만합니다.",
        "Together with a reboot or blue screen, check whether the system stopped under GPU load."),
      next: T("그래픽 드라이버를 완전 제거 후 재설치하고, 게임·렌더링 중 온도와 전원을 확인하세요.",
        "Fully remove and reinstall the graphics driver, and check temperature and power during games or rendering."),
      links: T([["event-display-4101.html", "Display 4101 해설"], ["hardware-gpu-artifacts.html", "화면 깨짐 가이드"]],
        [["/en/event-display-4101.html", "Display 4101 explained"], ["/en/event-nvlddmkm-153.html", "nvlddmkm 153 explained"]])
    },
    {
      title: T("블루스크린 후 재시작", "Restart after a blue screen"),
      keys: ["bugcheck|1001", "volmgr|161"],
      text: T("블루스크린(BugCheck) 뒤에 남는 기록입니다. 정지 코드는 이벤트 본문이나 덤프 파일에 있습니다.",
        "Records left after a blue screen (BugCheck). The stop code is in the event body or the dump file."),
      next: T("본문의 BugCheck 코드를 확인하고, 덤프 파일은 미니덤프 분석기로 해석해 보세요.",
        "Check the BugCheck code in the body, and analyze the dump file with the minidump analyzer (a Korean-language tool)."),
      links: T([["event-bugcheck-1001.html", "BugCheck 1001 해설"], ["minidump-analyzer.html", "미니덤프 분석기"]],
        [["/en/event-bugcheck-1001.html", "BugCheck 1001 explained"], ["/minidump-analyzer.html", "Minidump analyzer (Korean)"]])
    },
    {
      title: T("절전·복귀 경로", "Sleep and resume path"),
      keys: ["power-troubleshooter|1", "kernel-power|42", "kernel-power|107", "kernel-power|109", "kernel-power|172", "kernel-power|566", "kernel-power|577"],
      text: T("절전·최대 절전 진입 또는 복귀와 관련된 기록입니다.",
        "Records related to entering or resuming from sleep or hibernation."),
      withRestart: T("복귀 중 비정상 종료 기록이 함께 있어 절전 복귀 실패 가능성을 살필 만합니다.",
        "An abnormal-shutdown record is also present, so it is worth considering a failed resume from sleep."),
      next: T("절전 복귀 직후의 기록을 보고, 장치 드라이버·빠른 시작 설정을 점검하세요.",
        "Look at the records right after resume, and check device drivers and the fast startup setting."),
      links: T([["event-power-sleep-wake.html", "절전·복귀 이벤트 가이드"], ["windows-sleep-resume-fail.html", "절전 복귀 실패 가이드"]],
        [["/en/event-kernel-power-109.html", "Kernel-Power 109 explained"]])
    },
    {
      title: T("장치 시작·드라이버 문제", "Device start / driver problems"),
      keys: ["kernel-pnp|219", "kernel-pnp|411"],
      text: T("장치가 시작되지 못했거나 드라이버가 로드되지 않았다는 Plug and Play 기록입니다. 어느 장치인지(장치 인스턴스 ID)가 이벤트 본문에 있습니다.",
        "Plug and Play records saying a device could not start or a driver did not load. The device instance ID in the event body tells you which device."),
      next: T("장치 관리자에서 해당 장치의 상태와 오류 코드를 확인하고, 제조사 드라이버를 재설치하세요. Kernel-PnP 411은 시스템 로그가 아니라 Kernel-PnP/Configuration 로그에 남습니다.",
        "In Device Manager check that device's state and error code, and reinstall the maker's driver. Kernel-PnP 411 is written not to the System log but to the Kernel-PnP/Configuration log."),
      links: T([["event-kernel-pnp-411.html", "Kernel-PnP 411 해설"], ["device-manager-codes.html", "장치 관리자 오류 코드 모음"]],
        [["/device-manager-codes.html", "Device Manager error codes (Korean)"]])
    },
    {
      title: T("Windows 업데이트·프로그램 설치 실패", "Windows Update / installation failures"),
      keys: ["windowsupdateclient|20", "windowsupdateclient|25", "windowsupdateclient|31", "msiinstaller|11708"],
      text: T("Windows 업데이트의 내려받기·설치 실패, 또는 Windows Installer 설치 실패 기록입니다. 어느 업데이트·제품인지는 이벤트 본문에 있습니다.",
        "Records of a failed download or install in Windows Update, or a failed Windows Installer install. The event body says which update or product."),
      next: T("업데이트는 KB 번호와 오류 코드를, 프로그램 설치는 같은 시각의 MsiInstaller 1033 상태 값을 먼저 기록하세요.",
        "For updates, first note the KB number and error code; for program installs, the MsiInstaller 1033 status value from the same time."),
      links: T([["event-windowsupdateclient-31.html", "WindowsUpdateClient 31 해설"], ["event-msiinstaller-11708.html", "MsiInstaller 11708 해설"], ["windows-update-errors-guide.html", "Windows 업데이트 오류 가이드"]],
        [["/en/event-windowsupdateclient-31.html", "WindowsUpdateClient 31 explained"], ["/en/event-windowsupdateclient-20.html", "WindowsUpdateClient 20 explained"]])
    },
    {
      title: T("IP 주소·유선 연결 문제", "IP address / wired connection problems"),
      keys: ["dhcp-client|1001", "e1rexpress|27", "e2fexpress|27"],
      text: T("IP 주소를 받지 못했거나 유선 랜 링크가 불안정하다는 기록입니다. DNS를 바꾸기 전에 IP 주소와 기본 게이트웨이, 케이블·공유기부터 확인하는 것이 순서입니다.",
        "Records that an IP address was not obtained or the wired LAN link is unstable. Before changing DNS, check the IP address, the default gateway, the cable and the router, in that order."),
      next: T("ipconfig /all로 IPv4와 게이트웨이를 확인하고, 다른 케이블·포트와 같은 공유기의 다른 기기와 비교해 PC 쪽인지 공유기·회선 쪽인지 가르세요.",
        "Check IPv4 and the gateway with ipconfig /all, and compare another cable/port and another device on the same router to tell a PC-side problem from a router or line problem."),
      links: T([["event-dhcp-client-1001.html", "DHCP-Client 1001 해설"], ["network-connection-guide.html", "네트워크 연결 확인 방법"]], [])
    },
    {
      title: T("무선 네트워크 연결 문제", "Wireless connection problems"),
      keys: ["wlan-autoconfig|8002", "wlan-autoconfig|10002"],
      text: T("무선 네트워크에 연결하지 못했거나 연결 상태가 불안정하다는 기록입니다. 실패 이유 문장이 이벤트에 들어 있습니다.",
        "Records that the wireless network could not be joined or the connection is unstable. The failure-reason sentence is in the event."),
      next: T("실패 이유(Failure Reason)를 기록하고, 저장된 네트워크를 지운 뒤 다시 연결하거나 무선 어댑터 드라이버를 비교해 보세요.",
        "Note the Failure Reason, then forget the saved network and reconnect, or compare wireless adapter drivers."),
      links: T([["event-wlan-autoconfig-8002.html", "WLAN-AutoConfig 8002 해설"], ["hardware-wifi-disconnect.html", "Wi-Fi 연결 끊김 가이드"]], [])
    },
    {
      title: T("서비스 시작·종료 실패", "Service start/stop failures"),
      keys: ["servicecontrolmanager|7000", "servicecontrolmanager|7001", "servicecontrolmanager|7009", "servicecontrolmanager|7011",
        "servicecontrolmanager|7022", "servicecontrolmanager|7023", "servicecontrolmanager|7024", "servicecontrolmanager|7026",
        "servicecontrolmanager|7031", "servicecontrolmanager|7032", "servicecontrolmanager|7034", "servicecontrolmanager|7038"],
      text: T("Windows 서비스가 시작하지 못했거나 예기치 않게 종료된 기록입니다. 같은 서비스가 반복되는지 이름을 확인하세요.",
        "Records where a Windows service could not start or ended unexpectedly. Check whether the same service name repeats."),
      next: T("서비스 이름을 확인하고 해당 프로그램·드라이버 업데이트 여부를 점검하세요.",
        "Check the service name and whether the related program or driver has an update."),
      links: T([["event-service-7034.html", "서비스 7034 해설"]],
        [["/en/event-service-7000.html", "Service 7000 explained"], ["/en/event-service-7034.html", "Service 7034 explained"]])
    },
    {
      title: T("로그인 실패·계정 잠금", "Failed sign-ins / account lockout"),
      keys: ["security|4625", "security|4740"],
      text: T("로그인 실패나 계정 잠금 기록입니다. 비밀번호 오입력일 수도 있고 외부에서의 반복 시도일 수도 있습니다.",
        "Records of failed sign-ins or an account lockout. It may be a mistyped password or repeated attempts from outside."),
      next: T("실패가 어디에서(내부/외부) 반복되는지 상세 내용을 확인하세요.",
        "Check the details to see where (internal or external) the failures repeat."),
      links: T([["event-security-4625.html", "Security 4625 해설"]],
        [["/en/event-security-4625.html", "Security 4625 explained"]])
    }
  ];

  var SAMPLE_KO = [
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
  var SAMPLE_EN = [
    "Log Name:      System",
    "Source:        Microsoft-Windows-Kernel-Power",
    "Date:          10/18/2026 9:42:10 PM",
    "Event ID:      41",
    "Level:         Critical",
    "",
    "Log Name:      System",
    "Source:        Microsoft-Windows-WHEA-Logger",
    "Date:          10/18/2026 9:41:58 PM",
    "Event ID:      17",
    "Level:         Warning",
    "",
    "Log Name:      System",
    "Source:        Disk",
    "Date:          10/18/2026 9:35:20 PM",
    "Event ID:      153",
    "Level:         Warning",
    "",
    "TimeCreated  : 10/17/2026 11:03:44 AM",
    "ProviderName : Service Control Manager",
    "Id           : 7034",
    "",
    "TimeCreated  : 10/17/2026 11:03:44 AM",
    "ProviderName : ExampleVendorService",
    "Id           : 9999"
  ].join("\n");
  var SAMPLE = T(SAMPLE_KO, SAMPLE_EN);

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
    var format;
    if (/<EventID[\s>]/i.test(text)) {
      records = parseXml(text);
      format = "xml";
    } else {
      var lines = text.split(/\r?\n/);
      if (lines.length > MAX_LINES) { lines = lines.slice(0, MAX_LINES); truncated = true; }
      records = parseLabeled(lines);
      if (records.length) {
        format = lines.some(function (l) { return /^\s*ProviderName\s*:/i.test(l); }) ? "powershell" : "labeled";
      } else {
        records = parseKnownPairs(lines);
        format = "pairs";
      }
    }
    records.forEach(function (r) { r.ms = parseTime(r.timeRaw); });
    return { records: records, truncated: truncated, format: format };
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
          title: T("재부팅 기록만 있고 단서가 부족함", "Restart records only, not enough clues"),
          text: T("비정상 종료 기록은 있지만 붙여넣은 범위에서 원인을 가리킬 만한 다른 기록이 보이지 않습니다.",
            "Abnormal-shutdown records exist, but nothing else in the pasted range points to a cause."),
          next: T("재부팅 시각 앞뒤로 범위를 넓혀 System 로그를 다시 모으고(아래 명령 만들기 사용), 블루스크린이 있었다면 덤프 파일을 분석하세요.",
            "Widen the range around the restart time and collect the System log again (use the command builder below), and if there was a blue screen, analyze the dump file."),
          links: T([["minidump-analyzer.html", "미니덤프 분석기"], ["event-kernel-power-41.html", "Kernel-Power 41 해설"]],
            [["/minidump-analyzer.html", "Minidump analyzer (Korean)"], ["/en/event-kernel-power-41.html", "Kernel-Power 41 explained"]])
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
      if (m.total) head += ' <span class="muted">(' + T("관련 기록 " + m.total + "건" + (m.total >= 3 ? ", 반복됨" : ""), m.total + " related record" + (m.total === 1 ? "" : "s") + (m.total >= 3 ? ", repeated" : "")) + ")</span>";
      var body = "<p>" + esc(p.text) + (m.withRestart && p.withRestart ? " " + esc(p.withRestart) : "") + "</p>";
      if (p.next) body += "<p><strong>" + T("먼저 할 일:", "What to do first:") + "</strong> " + esc(p.next) + "</p>";
      var links = (p.links || []).map(function (l) { return '<a href="' + esc(l[0]) + '">' + esc(l[1]) + "</a>"; }).join("");
      return "<li>" + head + body + (links ? '<div class="link-list">' + links + "</div>" : "") + "</li>";
    });
    return '<section class="card ela-notice"><h3>' + T("이런 패턴으로 보입니다", "These patterns appear") + '</h3><ul class="mini-list">' + items.join("") +
      '</ul><p class="muted">' + T("기록의 조합으로 의심 범위를 좁힌 것이며 원인 확정이 아닙니다. 같은 기록이 정상 PC에서도 남는 경우가 있으니 증상이 있었던 시각의 기록을 우선 보세요.",
        "The combination of records only narrows where to suspect; it does not confirm a cause. The same records can also appear on a healthy PC, so look first at the records from the time the symptom occurred.") + '</p></section>';
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
    if (LANG === "en") {
      var en = EN_DATA[normSource(entry.source) + "|" + entry.id];
      if (en) links.push('<a href="' + esc(enPage(en)) + '">' + esc(entry.source) + " event " + esc(entry.id) + " — full explanation</a>");
      else if (entry.detailPage && entry.detailPage !== "event-viewer-guide.html") {
        links.push('<a href="/' + esc(entry.detailPage) + '" hreflang="ko" lang="ko">' + esc(entry.source) + " " + esc(entry.id) + " — Korean explanation</a>");
      }
      return links.length ? '<div class="link-list">' + links.join("") + "</div>" : "";
    }
    if (entry.detailPage && entry.detailPage !== "event-viewer-guide.html") {
      links.push('<a href="' + esc(entry.detailPage) + '">' + esc(entry.source) + " 이벤트 " + esc(entry.id) + " 자세히 보기</a>");
    }
    (entry.relatedGuides || []).slice(0, 3).forEach(function (g) {
      links.push('<a href="' + esc(g) + '">' + esc(titleOfPage(g)) + "</a>");
    });
    return links.length ? '<div class="link-list">' + links.join("") + "</div>" : "";
  }

  // 필터·정렬에 쓰는 속성. 수준을 모르는 이벤트(해설 없음)는 9로 둔다.
  function cardAttrs(g, i) {
    var rank = g.entry && LEVEL_RANK[g.entry.level] !== undefined ? LEVEL_RANK[g.entry.level] : 9;
    return ' data-i="' + i + '" data-rank="' + rank + '" data-known="' + (g.entry ? 1 : 0) + '" data-count="' + g.count + '" data-last="' + (g.last ? g.last.ms : 0) + '"';
  }

  function cardHtml(g, i) {
    var title = (g.source || T("원본 미확인", "Source unknown")) + T(" · 이벤트 ", " · Event ") + g.id;
    var meta = [T("기록 " + g.count + "건", g.count + (g.count === 1 ? " record" : " records"))];
    if (g.first) meta.push(g.first === g.last || fmtTime(g.first) === fmtTime(g.last) ? fmtTime(g.first) : fmtTime(g.first) + " ~ " + fmtTime(g.last));
    if (!g.entry) {
      var cands = g.source ? [] : byId[g.id] || [];
      var body;
      if (g.source) {
        body = "<p>" + T("이 사이트에 아직 해설이 없는 이벤트입니다. 원본과 ID가 정확한지 확인한 뒤 아래 방법으로 더 찾아보세요.",
            "This site has no explanation for this event yet. Check that the source and ID are exact, then look further with the options below.") + "</p>" +
          '<div class="link-list"><a href="https://learn.microsoft.com/search/?terms=' + encodeURIComponent((g.source || "") + " event " + g.id) +
          '" target="_blank" rel="noopener noreferrer">' + T("Microsoft Learn에서 검색", "Search Microsoft Learn") + "</a>" +
          (LANG === "en" ? "" : '<a href="diagnostic.html">진단 도구에서 증상과 함께 분석</a>') +
          '<a href="' + esc(requestUrl(g)) + '" target="_blank" rel="noopener noreferrer">' + T("이 이벤트 해설 요청하기 (GitHub, 공개)", "Request an explanation for this event (GitHub, public)") + "</a></div>" +
          '<p class="muted">' + T("요청에는 원본 이름과 이벤트 ID만 미리 채워집니다. 컴퓨터 이름·사용자 이름 같은 개인정보는 적지 마세요.",
            "Only the source name and event ID are pre-filled in the request. Do not add personal information such as a computer name or user name.") + "</p>";
      } else {
        body = "<p>" + T("원본(Source) 이름이 없어 정확히 해석할 수 없습니다. 같은 이벤트 ID라도 원본에 따라 뜻이 완전히 다릅니다.",
            "The source name is missing, so this cannot be interpreted exactly. The same event ID means something completely different depending on the source.") + "</p>" +
          (cands.length
            ? '<p class="muted">' + T("이 ID를 쓰는 사이트 등록 이벤트: ", "Events on this site that use this ID: ") + cands.slice(0, 6).map(function (c) {
                var en = EN_DATA[normSource(c.source) + "|" + c.id];
                var href = LANG === "en" ? (en ? enPage(en) : "/" + c.detailPage) : c.detailPage;
                return '<a href="' + esc(href) + '">' + esc(c.source) + " " + esc(c.id) + "</a>";
              }).join(" · ") + "</p>"
            : "");
      }
      return '<article class="card ela-card ela-unknown"' + cardAttrs(g, i) + '><h3>' + esc(title) + '</h3><p class="muted">' + meta.join(" · ") + "</p>" + body + "</article>";
    }
    var e = g.entry;
    var badges = '<span class="ela-badge ela-' + esc(e.level) + '">' + esc(LEVEL_LABEL[e.level] || e.level) + "</span>";
    if (URGENCY_LABEL[e.urgency]) badges += '<span class="ela-badge ela-urg">' + esc(URGENCY_LABEL[e.urgency]) + "</span>";
    var en = LANG === "en" ? EN_DATA[g.key] : null;
    var summary = e.summary;
    var checkList = (e.checks || []).slice(0, 3);
    var warnList = (e.warnings || []).slice(0, 2);
    if (LANG === "en") {
      // 영문 해설이 있는 이벤트만 본문을 보여 준다. 없으면 한국어 문장을 노출하지 않고 안내한다.
      summary = en ? en.s : "";
      checkList = en ? en.c : [];
      warnList = en ? en.w : [];
    }
    var checks = checkList.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    var warns = warnList.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("");
    var noEn = LANG === "en" && !en
      ? '<p>No English explanation is available for this event yet. You can use the Korean explanation below, search Microsoft Learn, or request an English one.</p>' +
        '<div class="link-list"><a href="https://learn.microsoft.com/search/?terms=' + encodeURIComponent((g.source || "") + " event " + g.id) +
        '" target="_blank" rel="noopener noreferrer">Search Microsoft Learn</a><a href="' + esc(requestUrl(g)) + '" target="_blank" rel="noopener noreferrer">Request an English explanation (GitHub, public)</a></div>'
      : "";
    return '<article class="card ela-card"' + cardAttrs(g, i) + '><h3>' + esc(title) + "</h3>" +
      '<p class="ela-meta">' + badges + '<span class="muted">' + meta.join(" · ") + "</span></p>" +
      (noEn || "<p>" + esc(summary) + "</p>") +
      (checks ? "<h4>" + T("먼저 확인할 것", "Check first") + "</h4><ul class=\"mini-list\">" + checks + "</ul>" : "") +
      (warns ? "<h4>" + T("주의", "Caution") + "</h4><ul class=\"mini-list\">" + warns + "</ul>" : "") +
      linkList(e) + "</article>";
  }

  function noticesHtml(groups, records) {
    var out = [];
    var matched = groups.filter(function (g) { return g.entry; });
    if (matched.some(function (g) { return g.entry.urgency === "backup"; })) {
      out.push(T("'백업 먼저'로 분류된 기록이 있습니다(디스크·파일 시스템 오류, 하드웨어 오류 보고, 블루스크린 등). 점검이나 재설치에 들어가기 전에 중요한 파일부터 백업하세요. 점검 과정에서 상태가 더 나빠질 수 있습니다.",
        "Some records are classified “Back up first” (disk or file-system errors, hardware error reports, blue screens and so on). Back up important files before any checks or a reinstall; checking can make the condition worse."));
    }
    if (matched.some(function (g) { return g.key.indexOf("whea-logger|") === 0; })) {
      out.push(T("WHEA-Logger 기록이 있습니다. 하드웨어가 오류를 보고한 경로이므로, 재부팅·종료 기록(Kernel-Power 41, EventLog 6008)보다 WHEA 기록의 상세 페이지를 먼저 읽는 편이 원인 범위를 좁히는 데 유리합니다.",
        "WHEA-Logger records are present. Because this is a path where the hardware itself reported an error, reading the WHEA detail pages before the restart/shutdown records (Kernel-Power 41, EventLog 6008) narrows the cause better."));
    }
    var repeated = groups.filter(function (g) { return g.count >= 3; });
    if (repeated.length) {
      out.push(T("같은 이벤트가 3건 이상 반복된 항목: ", "Events repeated 3 or more times: ") + repeated.slice(0, 5).map(function (g) {
        return esc((g.source || "?") + " " + g.id) + " (" + T(g.count + "건", g.count + "×") + ")";
      }).join(", ") + T(". 한 번뿐인 기록보다 반복되는 기록이 우선 확인 대상입니다.", ". Records that repeat are a higher priority to check than ones that appear once."));
    }
    return out;
  }

  function fmtDur(ms) {
    var m = Math.round(ms / 60000);
    if (m < 60) return m + T("분", " min");
    var h = Math.floor(m / 60);
    if (h < 24) return h + T("시간", " h") + (m % 60 ? " " + (m % 60) + T("분", " min") : "");
    var d = Math.floor(h / 24);
    return d + T("일", " d") + (h % 24 ? " " + (h % 24) + T("시간", " h") : "");
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
      var label = (r.source || T("원본 미확인", "Source unknown")) + " " + r.id;
      if (seen[label]) return;
      seen[label] = true;
      items.push(esc(fmtTime(r)) + " " + esc(label));
    });
    var more = items.length > max ? T(" 외 " + (items.length - max) + "종", " and " + (items.length - max) + " more") : "";
    return items.slice(0, max).join(", ") + more;
  }

  function recurrenceNote(clusters) {
    if (clusters.length < 2) return "";
    var gaps = [];
    for (var i = 1; i < clusters.length; i++) gaps.push(clusters[i].first.ms - clusters[i - 1].last.ms);
    var min = Math.min.apply(null, gaps);
    var max = Math.max.apply(null, gaps);
    var text = T("재부팅 " + clusters.length + "회, 간격: ", clusters.length + " restarts, gaps: ") + gaps.slice(0, 8).map(fmtDur).join(" → ") + (gaps.length > 8 ? " …" : "") + ". ";
    if (clusters.length >= 3 && min > 0 && max / min <= 1.3) {
      text += T("간격이 비슷합니다(약 ", "The gaps are similar (about ") + fmtDur(gaps.reduce(function (a, b) { return a + b; }, 0) / gaps.length) +
        T("). 예약 작업·업데이트·타이머처럼 주기적인 요인도 함께 확인해 볼 만합니다.",
          "). It is worth also checking periodic factors such as scheduled tasks, updates or timers.");
    } else if (clusters[clusters.length - 1].last.ms - clusters[0].first.ms <= 24 * 3600 * 1000) {
      text += T("하루 안에 반복되었습니다. 같은 조건(부하, 시각, 작업)에서 일어나는지 살펴보세요.",
        "It repeated within a day. See whether it happens under the same conditions (load, time, task).");
    } else {
      text += T("간격이 일정하지 않습니다.", "The gaps are not regular.");
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
        ? "<br>" + T("직전 10분: ", "Previous 10 minutes: ") + labelList(before, 8)
        : "<br>" + T("직전 10분 안에 붙여넣은 다른 기록이 없습니다. 더 넓은 범위의 로그를 붙여넣으면 앞뒤 흐름을 볼 수 있습니다.",
          "No other pasted records fall in the previous 10 minutes. Paste a wider range of the log to see the flow before and after.");
      line += after.length
        ? "<br>" + T("직후 10분(부팅 때마다 남는 기록 제외): ", "Next 10 minutes (excluding records written at every boot): ") + labelList(after, 8)
        : "<br>" + T("직후 10분 안에 다른 이상 기록은 없습니다(또는 붙여넣지 않았습니다).", "No other abnormal records in the next 10 minutes (or they were not pasted).");
      blocks.push(line + "</li>");
    });
    var note = recurrenceNote(clusters);
    return '<section class="card"><h3>' + T("재부팅·비정상 종료 전후 기록", "Records before and after restarts / abnormal shutdowns") + '</h3><ul class="mini-list">' + blocks.join("") +
      "</ul>" + (note ? "<p>" + esc(note) + "</p>" : "") +
      '<p class="muted">' + T("전후에 있던 기록이 원인이라는 뜻은 아닙니다. 어떤 기록부터 열어 볼지 정하는 단서로만 쓰세요. 같은 시각(3분 이내)의 41·6008은 한 번의 재부팅으로 묶어 셉니다.",
        "Records before or after are not necessarily the cause; use them only as clues for which record to open first. 41 and 6008 within 3 minutes of each other are counted as one restart.") + '</p></section>';
  }


  // ---- 해설 요청 링크 ---------------------------------------------------------------
  function requestUrl(g) {
    var title = T("이벤트 해설 요청: ", LANG === "en" ? "English explanation request: " : "") + g.source + " " + g.id;
    var body = T("원본(Source): " + g.source + "\n이벤트 ID: " + g.id + "\n\n(컴퓨터 이름, 사용자 이름, 계정 정보는 적지 마세요.)",
      "Source: " + g.source + "\nEvent ID: " + g.id + "\n\n(Please do not include computer names, user names or account information.)");
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
      return (d.getMonth() + 1) + "/" + d.getDate() + (hourly ? " " + d.getHours() + T("시", ":00") : "");
    };
    var bars = buckets.map(function (b) {
      var h = Math.max(b.n ? 6 : 0, Math.round(b.n / peak.n * 100));
      var cls = b.restart ? "ela-bar ela-bar-restart" : "ela-bar";
      return '<span class="' + cls + '" style="height:' + h + '%" title="' + esc(label(b.t) + " · " + T(b.n + "건" + (b.restart ? " (재부팅 기록 포함)" : ""), b.n + (b.n === 1 ? " record" : " records") + (b.restart ? " (includes a restart record)" : ""))) + '"></span>';
    }).join("");
    var summary = T("기록이 가장 많은 구간은 " + label(peak.t) + " (" + peak.n + "건)입니다.", "The busiest period is " + label(peak.t) + " (" + peak.n + " records).");
    var share = Math.round(peak.n / timed.length * 100);
    var focus = peak.n >= 3 && share >= 50 && buckets.length >= 3
      ? T(" 전체 기록의 " + share + "%가 이 구간에 몰려 있습니다. 그 시각 앞뒤에 무엇을 하고 있었는지 떠올려 보세요(게임, 업데이트, 절전 복귀 등).",
        " " + share + "% of all records are concentrated in this period. Think about what you were doing around that time (a game, an update, resuming from sleep and so on).")
      : "";
    return '<section class="card"><h3>' + T("시간대별 기록 분포", "Distribution of records over time") + '</h3>' +
      '<div class="ela-hist" role="img" aria-label="' + esc(T("시간대별 기록 분포. ", "Distribution of records over time. ") + summary) + '">' + bars + "</div>" +
      '<p class="ela-hist-axis muted"><span>' + esc(label(buckets[0].t)) + "</span><span>" + esc(label(buckets[buckets.length - 1].t)) + "</span></p>" +
      "<p>" + esc(summary + focus) + "</p>" +
      '<p class="muted">' + T("막대 하나는 " + (hourly ? "1시간" : "하루") + "입니다. 주황색 막대는 재부팅·비정상 종료 기록이 포함된 구간입니다.",
        "Each bar is " + (hourly ? "one hour" : "one day") + ". An orange bar is a period that includes restart or abnormal-shutdown records.") + "</p></section>";
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
      out.push(T("재부팅 기록은 있지만 블루스크린(BugCheck 1001)이나 WHEA 기록이 없습니다. 전원이 갑자기 끊긴 형태일 수 있고(전원·과열·강제 종료), 붙여넣은 범위 밖에 있을 수도 있습니다. 재부팅 시각 앞뒤로 범위를 넓혀 다시 모으거나, 블루스크린을 봤다면 <a href=\"minidump-analyzer.html\">미니덤프 분석기</a>를 써 보세요.",
        "There are restart records but no blue screen (BugCheck 1001) or WHEA records. Power may have been cut suddenly (power, overheating, forced shutdown), or the records may be outside the pasted range. Widen the range around the restart time and collect again, or if you saw a blue screen, try the <a href=\"/minidump-analyzer.html\">minidump analyzer (Korean)</a>."));
    }
    if ((has["display|4101"] || has["nvlddmkm|153"] || has["livekernelevent|141"]) && !has["applicationerror|1000"] && !has["applicationhang|1002"]) {
      out.push(T("그래픽 관련 기록은 있는데 Application 로그의 프로그램 오류(1000)·응답 없음(1002)이 없습니다. 어느 프로그램에서 일어났는지 보려면 아래 \"수집 명령 만들기\"에서 \"프로그램이 자꾸 종료됨\"을 골라 함께 모아 보세요.",
        "There are graphics records but no application error (1000) or not-responding (1002) records from the Application log. To see which program it happened in, choose “Programs keep closing” in the command builder below and collect those too."));
    }
    var untimed = records.filter(function (r) { return r.ms === null; }).length;
    if (!shared && untimed) {
      out.push(T("시각을 읽지 못한 기록이 " + untimed + "건 있습니다. 시각이 없으면 전후 비교와 분포를 만들 수 없습니다. PowerShell에서 모을 때는 <code>Format-List TimeCreated, ProviderName, Id</code>처럼 TimeCreated를 포함하세요.",
        untimed + " record" + (untimed === 1 ? "" : "s") + " had no readable time. Without times, the before/after comparison and the distribution cannot be built. When collecting with PowerShell, include TimeCreated, for example <code>Format-List TimeCreated, ProviderName, Id</code>."));
    }
    var noSource = groups.filter(function (g) { return !g.source; }).reduce(function (a, g) { return a + g.count; }, 0);
    if (noSource) {
      out.push(T("원본(Source)을 읽지 못한 기록이 " + noSource + "건 있습니다. 같은 ID라도 원본에 따라 뜻이 달라서 해석하지 못했습니다. 원본이 함께 보이도록 다시 복사해 주세요.",
        noSource + " record" + (noSource === 1 ? "" : "s") + " had no readable source. The same ID means different things per source, so they could not be interpreted. Copy again so the source is included."));
    }
    return out;
  }

  function gapHtml(notices) {
    if (!notices.length) return "";
    return '<section class="card"><h3>' + T("더 모으면 좋은 로그", "Logs worth collecting") + '</h3><ul class="mini-list">' +
      notices.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></section>";
  }

  // ---- 이전 해석과 비교 (이 페이지가 열려 있는 동안만 메모리에 보관) -----------------
  function snapshot(groups) {
    var snap = {};
    groups.forEach(function (g) { snap[g.key] = { label: (g.source || T("원본 미확인", "Source unknown")) + " " + g.id, count: g.count }; });
    return snap;
  }

  function compareHtml(prev, groups) {
    var now = snapshot(groups);
    var gone = [];
    var still = [];
    var fresh = [];
    Object.keys(prev).forEach(function (k) {
      if (!now[k]) gone.push(prev[k].label + " (" + T(prev[k].count + "건", prev[k].count + "×") + ")");
      else still.push(now[k].label + " " + T(prev[k].count + "건 → " + now[k].count + "건", prev[k].count + " → " + now[k].count));
    });
    Object.keys(now).forEach(function (k) { if (!prev[k]) fresh.push(now[k].label + " (" + T(now[k].count + "건", now[k].count + "×") + ")"); });
    var part = function (title, list) {
      return list.length ? "<li><strong>" + title + "</strong>: " + list.slice(0, 8).map(esc).join(", ") + (list.length > 8 ? T(" 외 " + (list.length - 8) + "종", " and " + (list.length - 8) + " more") : "") + "</li>" : "";
    };
    return '<section class="card"><h3>' + T("직전 해석과 비교", "Compared with the previous analysis") + '</h3><ul class="mini-list">' +
      part(T("이번에는 보이지 않는 이벤트", "Events no longer seen"), gone) + part(T("계속 보이는 이벤트", "Events still seen"), still) + part(T("새로 보이는 이벤트", "New events"), fresh) +
      '</ul><p class="muted">' + T("같은 기간·같은 명령으로 모은 로그끼리 비교해야 의미가 있습니다. 이 비교는 이 페이지를 연 동안만 브라우저 메모리에 있고, 새로고침하거나 \"지우기\"를 누르면 사라집니다. 어디에도 저장하거나 전송하지 않습니다.",
        "A comparison only makes sense between logs collected over the same period with the same command. It exists only in this browser tab's memory while the page is open and disappears on refresh or “Clear”. It is not saved or sent anywhere.") + '</p></section>';
  }

  // ---- 내보내기: 마크다운, 공유 링크 -------------------------------------------------
  function mdCell(s) { return String(s).replace(/\|/g, "\\|").replace(/\r?\n/g, " "); }

  // 설명 페이지 주소: 영문 페이지에서는 영문 해설이 있으면 그 주소, 없으면 한국어 해설 주소를 쓴다.
  function docUrl(g, base) {
    var e = g.entry;
    if (LANG === "en") {
      var en = EN_DATA[g.key];
      if (en) return base + enPage(en);
    }
    return e && e.detailPage && e.detailPage !== "event-viewer-guide.html" ? base + "/" + e.detailPage : "";
  }
  function docLink(g, base, mode) {
    var url = docUrl(g, base);
    if (!url) return "-";
    return mode === "md" ? "[" + T("자세히", "details") + "](" + url + ")" : url;
  }
  function toolUrl(base) { return base + (LANG === "en" ? "/en/event-log-analyzer.html" : "/event-log-analyzer.html"); }

  function markdownSummary(groups, patterns) {
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin : "https://itsvc.co.kr";
    var lines = [T("## 이벤트 로그 해석 요약", "## Event log analysis summary"), ""];
    if (patterns && patterns.length) {
      lines.push(T("의심 범위(확정 아님): ", "Suspected areas (not confirmed): ") + patterns.map(function (m) { return m.rule.title; }).join(", "), "");
    }
    lines.push(T("| 원본 | 이벤트 ID | 횟수 | 수준 | 설명 |", "| Source | Event ID | Count | Level | Details |"), "|---|---|---|---|---|");
    groups.forEach(function (g) {
      var level = g.entry ? (LEVEL_LABEL[g.entry.level] || g.entry.level) : "-";
      lines.push("| " + mdCell(g.source || T("원본 미확인", "Source unknown")) + " | " + mdCell(g.id) + " | " + g.count + " | " + level + " | " + docLink(g, base, "md") + " |");
    });
    lines.push("", T("해석 도구: ", "Analysis tool: ") + toolUrl(base));
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
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin + location.pathname : "https://itsvc.co.kr" + (LANG === "en" ? "/en/event-log-analyzer.html" : "/event-log-analyzer.html");
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
    var lines = [T("[이벤트 로그 해석 요약]", "[Event log analysis summary]")];
    groups.forEach(function (g) {
      var line = "- " + (g.source || T("원본 미확인", "Source unknown")) + T(" 이벤트 ", " event ") + g.id + " × " + g.count;
      if (g.entry) {
        line += " (" + (LEVEL_LABEL[g.entry.level] || g.entry.level) + ")";
        var url = docUrl(g, base);
        if (url) line += " " + url;
      } else {
        line += T(" (사이트 해설 없음)", " (no explanation on this site)");
      }
      lines.push(line);
    });
    if (patterns && patterns.length) {
      lines.push(T("의심 범위(확정 아님): ", "Suspected areas (not confirmed): ") + patterns.map(function (m) { return m.rule.title; }).join(", "));
    }
    lines.push(T("해석 도구: ", "Analysis tool: ") + toolUrl(base));
    return lines.join("\n");
  }

  // 결과 화면 한 벌을 만든다. records가 비어 있으면(공유 링크) 시각이 필요한 부분은 생략된다.
  function viewHtml(groups, records, opts) {
    var patterns = matchPatterns(groups);
    var notices = noticesHtml(groups, records);
    var html = patternHtml(patterns);
    if (notices.length) {
      html += '<section class="card ela-notice"><h3>' + T("종합 의견", "Overall assessment") + '</h3><ul class="mini-list">' + notices.map(function (n) { return "<li>" + n + "</li>"; }).join("") + "</ul></section>";
    }
    if (opts.prev) html += compareHtml(opts.prev, groups);
    html += gapHtml(gapNotices(groups, records, opts.shared));
    html += histogramHtml(records);
    html += timelineHtml(records);
    html += filterHtml(groups);
    html += '<div id="ela-cards">' + groups.map(cardHtml).join("") + "</div>";
    return { html: html, patterns: patterns };
  }

  // ---- 결과 필터·정렬 --------------------------------------------------------------
  function filterHtml(groups) {
    if (groups.length < FILTER_MIN_GROUPS) return "";
    return '<section class="card ela-filter" aria-label="' + T("결과 필터", "Result filters") + '"><h3>' + T("결과 좁혀 보기", "Narrow the results") + '</h3>' +
      '<div class="button-row ela-filter-row">' +
      '<label>' + T("수준", "Level") + ' <select id="ela-f-level"><option value="all">' + T("전체", "All") + '</option><option value="1">' + T("중대·오류만", "Critical and error only") + '</option><option value="2">' + T("경고 이상", "Warning and above") + '</option></select></label>' +
      '<label><input type="checkbox" id="ela-f-known"> ' + T("해설 있는 것만", "Only events with an explanation") + '</label>' +
      '<label><input type="checkbox" id="ela-f-repeat"> ' + T("3건 이상 반복만", "Only events repeated 3+ times") + '</label>' +
      '<label>' + T("정렬", "Sort") + ' <select id="ela-f-sort"><option value="default">' + T("중요도순", "By importance") + '</option><option value="count">' + T("많이 반복된 순", "Most repeated") + '</option><option value="recent">' + T("최근 순", "Most recent") + '</option></select></label>' +
      '</div><p class="muted" id="ela-f-count" aria-live="polite"></p>' +
      '<p class="muted">' + T("해설이 없는 이벤트는 수준을 알 수 없어 \"수준\" 필터를 켜면 숨겨집니다. 아래 이벤트 카드에만 적용되며 위의 종합 의견·분포·전후 기록은 그대로입니다.",
        "Events without an explanation have an unknown level, so they are hidden when the Level filter is on. The filters apply only to the event cards below; the overall assessment, distribution and before/after records above stay as they are.") + '</p></section>';
  }

  // 카드 목록에 필터·정렬을 적용한다. 화면 요소만 바꾸고 데이터는 건드리지 않는다.
  function applyFilters(resultEl) {
    var box = resultEl.querySelector("#ela-cards");
    var levelEl = resultEl.querySelector("#ela-f-level");
    if (!box || !levelEl) return;
    var knownEl = resultEl.querySelector("#ela-f-known");
    var repeatEl = resultEl.querySelector("#ela-f-repeat");
    var sortEl = resultEl.querySelector("#ela-f-sort");
    var countEl = resultEl.querySelector("#ela-f-count");
    var cards = Array.prototype.slice.call(box.children);
    var maxRank = levelEl.value === "all" ? 99 : +levelEl.value;
    var shown = 0;
    cards.forEach(function (c) {
      var ok = +c.getAttribute("data-rank") <= maxRank &&
        (!knownEl.checked || c.getAttribute("data-known") === "1") &&
        (!repeatEl.checked || +c.getAttribute("data-count") >= 3);
      c.hidden = !ok;
      if (ok) shown++;
    });
    var key = sortEl.value;
    cards.sort(function (a, b) {
      if (key === "count") return (+b.getAttribute("data-count")) - (+a.getAttribute("data-count")) || (+a.getAttribute("data-i")) - (+b.getAttribute("data-i"));
      if (key === "recent") return (+b.getAttribute("data-last")) - (+a.getAttribute("data-last")) || (+a.getAttribute("data-i")) - (+b.getAttribute("data-i"));
      return (+a.getAttribute("data-i")) - (+b.getAttribute("data-i"));
    }).forEach(function (c) { box.appendChild(c); });
    if (countEl) countEl.textContent = T(cards.length + "종 중 " + shown + "종을 표시합니다." + (shown ? "" : " 조건에 맞는 이벤트가 없습니다. 조건을 풀어 보세요."),
      "Showing " + shown + " of " + cards.length + " events." + (shown ? "" : " No events match. Loosen the conditions."));
  }

  function bindFilters(resultEl) {
    var ids = ["ela-f-level", "ela-f-known", "ela-f-repeat", "ela-f-sort"];
    ids.forEach(function (id) {
      var el = resultEl.querySelector("#" + id);
      if (el) el.addEventListener("change", function () { applyFilters(resultEl); });
    });
    applyFilters(resultEl);
  }

  // ---- CSV 내보내기 ------------------------------------------------------------------
  // 스프레드시트가 수식으로 해석하지 않도록 =, +, -, @로 시작하는 값 앞에 작은따옴표를 붙인다.
  function csvCell(v) {
    var t = String(v === null || v === undefined ? "" : v);
    if (/^[=+\-@\t\r]/.test(t)) t = "'" + t;
    return /[",\n\r]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  }

  function csvSummary(groups) {
    var rows = [T(["원본", "이벤트 ID", "횟수", "수준", "긴급도", "처음 기록", "마지막 기록", "설명 페이지"],
      ["Source", "Event ID", "Count", "Level", "Urgency", "First record", "Last record", "Explanation page"])];
    var base = location.origin && location.origin.indexOf("http") === 0 ? location.origin : "https://itsvc.co.kr";
    groups.forEach(function (g) {
      var e = g.entry;
      rows.push([
        g.source || T("원본 미확인", "Source unknown"), g.id, g.count,
        e ? (LEVEL_LABEL[e.level] || e.level) : "",
        e ? (URGENCY_LABEL[e.urgency] || "") : "",
        g.first ? fmtTime(g.first) : "", g.last ? fmtTime(g.last) : "",
        docUrl(g, base)
      ]);
    });
    return rows.map(function (r) { return r.map(csvCell).join(","); }).join("\r\n");
  }

  function downloadCsv(text) {
    var blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "event-log-summary.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function outputs(groups, patterns) {
    return { summary: plainSummary(groups, patterns), markdown: markdownSummary(groups, patterns), share: shareLink(groups), csv: csvSummary(groups) };
  }

  // 마지막 비교 기준. 이 변수는 페이지가 열려 있는 동안만 존재한다.
  var baseline = null;

  function render(text, resultEl, statusEl, actionsEl, compare) {
    var parsed = extract(text);
    var records = parsed.records;
    if (!records.length) {
      resultEl.innerHTML = '<div class="card"><h3>' + T("이벤트를 찾지 못했습니다", "No events found") + '</h3><p>' + T('붙여넣은 내용에서 이벤트 ID를 읽지 못했습니다. 아래 "붙여넣을 수 있는 형식"을 확인하고, 이벤트의 <strong>원본(Source)</strong>과 <strong>이벤트 ID</strong>가 함께 보이는 텍스트나 XML을 붙여넣어 주세요.',
        'No event IDs could be read from what you pasted. Check “Formats you can paste” below, and paste text or XML where the event <strong>Source</strong> and <strong>Event ID</strong> are visible together.') + '</p></div>';
      statusEl.textContent = T("이벤트를 찾지 못했습니다.", "No events found.");
      actionsEl.hidden = true;
      return null;
    }
    var groups = sortGroups(group(records));
    var known = groups.filter(function (g) { return g.entry; }).length;
    var timedCount = records.filter(function (r) { return r.ms !== null; }).length;
    statusEl.textContent = T("기록 " + records.length + "건 · 서로 다른 이벤트 " + groups.length + "종 · 사이트 해설이 있는 이벤트 " + known + "종" +
      " · 읽은 형식: " + (FORMAT_LABEL[parsed.format] || parsed.format) + " · 시각을 읽은 기록 " + timedCount + "/" + records.length + "건" +
      (parsed.truncated ? " (입력이 너무 길어 앞부분만 읽었습니다)" : ""),
      records.length + " record" + (records.length === 1 ? "" : "s") + " · " + groups.length + " distinct event" + (groups.length === 1 ? "" : "s") + " · " + known + " with an explanation on this site" +
      " · Format read: " + (FORMAT_LABEL[parsed.format] || parsed.format) + " · Records with a readable time: " + timedCount + "/" + records.length +
      (parsed.truncated ? " (the input was too long, so only the beginning was read)" : ""));
    var view = viewHtml(groups, records, { prev: compare ? baseline : null });
    baseline = compare ? snapshot(groups) : null;
    resultEl.innerHTML = view.html;
    bindFilters(resultEl);
    actionsEl.hidden = false;
    return outputs(groups, view.patterns);
  }

  function renderShared(groups, resultEl, statusEl, actionsEl) {
    groups = sortGroups(groups);
    var total = groups.reduce(function (a, g) { return a + g.count; }, 0);
    statusEl.textContent = T("공유 링크로 열린 요약입니다 · 기록 " + total + "건 · 서로 다른 이벤트 " + groups.length + "종. 시각 정보는 링크에 담기지 않아 전후 비교와 분포는 표시하지 않습니다.",
      "Summary opened from a share link · " + total + " record" + (total === 1 ? "" : "s") + " · " + groups.length + " distinct event" + (groups.length === 1 ? "" : "s") + ". Times are not included in the link, so the before/after comparison and the distribution are not shown.");
    var view = viewHtml(groups, [], { shared: true });
    resultEl.innerHTML = view.html;
    bindFilters(resultEl);
    actionsEl.hidden = false;
    baseline = null;
    return outputs(groups, view.patterns);
  }

  // ---- 수집 명령 만들기 ------------------------------------------------------------
  // ids가 없으면 중대·오류·경고(Level 1~3)만 모은다.
  var PS_PRESETS = [
    { label: T("갑자기 재부팅되거나 꺼짐", "Sudden restarts or power-offs"), logs: ["System"], ids: [41, 6008, 1001, 1074, 6005, 6006, 17, 18, 19, 20, 46, 47],
      desc: T("비정상 종료(41·6008), 블루스크린(1001), 정상 종료·시작(1074·6005·6006), WHEA 하드웨어 오류를 모읍니다.",
        "Collects abnormal shutdowns (41, 6008), blue screens (1001), normal shutdown/start (1074, 6005, 6006) and WHEA hardware errors.") },
    { label: T("블루스크린", "Blue screens"), logs: ["System"], ids: [1001, 41, 6008, 17, 18, 19, 20, 46, 47, 7, 11, 51, 153, 154, 157],
      desc: T("BugCheck(1001)와 그 전후에 자주 함께 남는 하드웨어·디스크 오류를 모읍니다.",
        "Collects BugCheck (1001) and the hardware and disk errors that often appear around it.") },
    { label: T("디스크 오류·멈춤·느려짐", "Disk errors, freezes, slowness"), logs: ["System"], ids: [7, 9, 11, 15, 51, 52, 55, 57, 98, 129, 137, 140, 153, 154, 157, 158, 41],
      desc: T("Disk·Ntfs·storahci·stornvme 계열의 입출력 오류, 재시도, 고장 예측 기록을 모읍니다.",
        "Collects I/O errors, retries and failure-prediction records from Disk, Ntfs, storahci and stornvme.") },
    { label: T("화면 깜빡임·그래픽 멈춤", "Screen flicker, graphics freezes"), logs: ["System"], ids: [4101, 141, 153, 1001, 41],
      desc: T("그래픽 드라이버 복구(4101), GPU 오류(141·nvlddmkm 153), 재시작 기록을 모읍니다.",
        "Collects graphics driver recovery (4101), GPU errors (141, nvlddmkm 153) and restart records.") },
    { label: T("절전·복귀 문제", "Sleep and resume problems"), logs: ["System"], ids: [1, 42, 107, 109, 172, 566, 41, 6008],
      desc: T("절전 진입·복귀(Power-Troubleshooter 1, Kernel-Power 42·107·109)와 비정상 종료를 모읍니다.",
        "Collects sleep entry/resume (Power-Troubleshooter 1, Kernel-Power 42, 107, 109) and abnormal shutdowns.") },
    { label: T("장치 인식·드라이버 문제", "Device recognition and driver problems"), logs: ["System", "Microsoft-Windows-Kernel-PnP/Configuration"], ids: [219, 411, 7026],
      desc: T("Kernel-PnP 219·411(장치 시작 문제), SCM 7026(부팅 드라이버 로드 실패)을 모읍니다. 411은 Kernel-PnP/Configuration 로그에 남습니다.",
        "Collects Kernel-PnP 219 and 411 (device start problems) and SCM 7026 (boot driver failed to load). 411 is written to the Kernel-PnP/Configuration log.") },
    { label: T("부팅·종료가 느림", "Slow boot or shutdown"), logs: ["Microsoft-Windows-Diagnostics-Performance/Operational"], ids: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 200, 201, 202, 203],
      desc: T("부팅 시간(100)과 시작을 지연시킨 항목(101~110), 종료 시간(200)과 종료를 지연시킨 항목(201~203)을 모읍니다. 이 이벤트들은 시스템 로그가 아니라 Diagnostics-Performance/Operational 로그에 남습니다.",
        "Collects boot time (100) and items that delayed start-up (101–110), shutdown time (200) and items that delayed shutdown (201–203). These events are written to the Diagnostics-Performance/Operational log, not the System log.") },
    { label: T("Wi-Fi 연결 끊김·실패", "Wi-Fi drops and failures"), logs: ["System", "Microsoft-Windows-WLAN-AutoConfig/Operational"], ids: [8001, 8002, 8003, 10002],
      desc: T("무선 연결 성공(8001)·실패(8002)·해제(8003)와 어댑터 관련 기록을 모읍니다. 연결 기록은 WLAN-AutoConfig/Operational 로그에 남습니다.",
        "Collects wireless connection success (8001), failure (8002), disconnection (8003) and adapter records. Connection records are written to the WLAN-AutoConfig/Operational log.") },
    { label: T("업데이트·프로그램 설치 실패", "Update and program install failures"), logs: ["System", "Application"], ids: [20, 31, 11708, 1033],
      desc: T("Windows 업데이트 다운로드·설치 실패(31·20)와 Windows Installer 설치 실패(11708), 설치 결과 상태(1033)를 모읍니다.",
        "Collects Windows Update download/install failures (31, 20), Windows Installer failures (11708) and the install result status (1033).") },
    { label: T("프로그램이 자꾸 종료됨", "Programs keep closing"), logs: ["Application"], ids: [1000, 1002, 1026, 1001],
      desc: T("응용 프로그램 오류(1000), 응답 없음(1002), .NET 오류(1026), 오류 보고(1001)를 모읍니다.",
        "Collects application errors (1000), not-responding (1002), .NET errors (1026) and error reports (1001).") },
    { label: T("오류·경고 전체 (System + Application)", "All errors and warnings (System + Application)"), logs: ["System", "Application"], ids: null,
      desc: T("ID를 가리지 않고 중대·오류·경고 수준만 모읍니다. 증상을 모를 때 쓰세요.",
        "Collects only Critical, Error and Warning levels regardless of ID. Use it when you do not know the symptom.") }
  ];
  var PS_DAYS = [1, 3, 7, 14, 30];
  var PS_MAX = [50, 100, 300, 500];

  // range가 있으면 {from, to}(YYYY-MM-DD, 종료일 포함)로 기간을 직접 지정한다. 형식이 다르면 days를 쓴다.
  var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  function dayAfter(iso) {
    return new Date(Date.parse(iso + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  }
  function validRange(range) {
    return !!(range && ISO_DATE.test(range.from) && ISO_DATE.test(range.to) && !isNaN(Date.parse(range.from + "T00:00:00Z")) &&
      !isNaN(Date.parse(range.to + "T00:00:00Z")) && range.from <= range.to);
  }

  function buildCommand(preset, days, max, range) {
    var time = validRange(range)
      ? "StartTime=[datetime]'" + range.from + "'; EndTime=[datetime]'" + dayAfter(range.to) + "'"
      : "StartTime=(Get-Date).AddDays(-" + days + ")";
    var filter = "LogName=" + preset.logs.map(function (l) { return "'" + l + "'"; }).join(",") + "; " +
      (preset.ids ? "Id=" + preset.ids.join(",") : "Level=1,2,3") + "; " + time;
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
    PS_DAYS.forEach(function (d) { opt(daysEl, d, T("최근 " + d + "일", "Last " + d + (d === 1 ? " day" : " days")), d === 3); });
    PS_MAX.forEach(function (m) { opt(maxEl, m, T("최대 " + m + "건", "Up to " + m), m === 100); });
    var fromEl = document.getElementById("ela-ps-from");
    var toEl = document.getElementById("ela-ps-to");
    var rangeNote = document.getElementById("ela-ps-range-note");
    var update = function () {
      var preset = PS_PRESETS[+sel.value];
      var range = fromEl && toEl ? { from: fromEl.value, to: toEl.value } : null;
      var useRange = validRange(range);
      daysEl.disabled = useRange;
      out.textContent = buildCommand(preset, +daysEl.value, +maxEl.value, useRange ? range : null);
      if (desc) desc.textContent = preset.desc;
      if (rangeNote) {
        var half = !!(range && (range.from || range.to) && !(range.from && range.to));
        var reversed = !!(range && range.from && range.to && range.from > range.to);
        rangeNote.textContent = useRange ? T("기간 직접 지정을 사용 중입니다(종료일 포함). 지우면 위의 \"기간\" 선택으로 돌아갑니다.", "A custom date range is in use (end date included). Clear it to go back to the “Period” choice above.")
          : reversed ? T("시작일이 종료일보다 늦어서 적용하지 않았습니다.", "The start date is later than the end date, so it was not applied.")
          : half ? T("시작일과 종료일을 모두 고르면 적용됩니다.", "It applies once both a start and an end date are chosen.") : "";
      }
    };
    [sel, daysEl, maxEl, fromEl, toEl].forEach(function (el) { if (el) el.addEventListener("change", update); });
    if (copy) {
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = T("복사했습니다", "Copied"); setTimeout(function () { copy.textContent = T("명령 복사", "Copy command"); }, 1800); };
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
          navigator.clipboard.writeText(lastOut[key]).then(function () { flash(btn, T("복사했습니다", "Copied"), original); }, function () {});
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
        if (f.size > MAX_CHARS) { statusEl.textContent = T("파일이 2MB를 넘습니다. 기간이나 개수를 줄여 다시 저장해 주세요.", "The file is over 2 MB. Reduce the period or the count and save it again."); return; }
        var reader = new FileReader();
        reader.onload = function () {
          input.value = String(reader.result || "");
          lastOut = render(input.value, resultEl, statusEl, actionsEl, true);
        };
        reader.readAsText(f);
      });
    }
    copyOf(copyBtn, "summary", T("요약 복사", "Copy summary"));
    copyOf(document.getElementById("ela-copy-md"), "markdown", T("마크다운 복사", "Copy as Markdown"));
    copyOf(document.getElementById("ela-copy-link"), "share", T("공유 링크 복사", "Copy share link"));
    var csvBtn = document.getElementById("ela-csv");
    if (csvBtn) csvBtn.addEventListener("click", function () { if (lastOut) downloadCsv(lastOut.csv); });
    var printBtn = document.getElementById("ela-print");
    if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

    var shared = groupsFromShare(location.hash);
    if (shared) lastOut = renderShared(shared, resultEl, statusEl, actionsEl);
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = {
      extract: extract, group: group, matchPatterns: matchPatterns, timelineHtml: timelineHtml, buildCommand: buildCommand,
      PS_PRESETS: PS_PRESETS, PATTERNS: PATTERNS, histogramHtml: histogramHtml, gapNotices: gapNotices, compareHtml: compareHtml,
      snapshot: snapshot, markdownSummary: markdownSummary, shareLink: shareLink, groupsFromShare: groupsFromShare, requestUrl: requestUrl, cardHtml: cardHtml, csvSummary: csvSummary, csvCell: csvCell, validRange: validRange, FORMAT_LABEL: FORMAT_LABEL
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
