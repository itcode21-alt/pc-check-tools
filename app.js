(() => {
  const data = window.SITE_DATA || { symptoms: [] };
  const storageKey = "pc_recent_error_codes";
  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const kindFilters = [
    { key: "all", label: "전체", className: "general" },
    { key: "boot", label: "부팅", className: "boot" },
    { key: "update", label: "업데이트", className: "update" },
    { key: "permission", label: "권한", className: "permission" },
    { key: "graphics", label: "그래픽", className: "graphics" },
    { key: "driver", label: "드라이버", className: "driver" },
    { key: "memory", label: "메모리", className: "memory" },
    { key: "storage", label: "저장장치", className: "storage" },
    { key: "general", label: "일반", className: "general" },
  ];
  let selectedErrorKind = "all";
  let selectedGuideKind = "all";
  let currentHardwareLogMeta = null;
  const normalizeCode = (value) => String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^BUGCHECK:/, "")
    .replace(/^IRQL_NOT_LESS_OR_EQUAL:?/, "")
    .replace(/^0X/, "0x")
    .replace(/[^0-9A-Fx]/g, "");

  const findErrorCode = (value) => {
    const normalized = normalizeCode(value);
    if (!normalized) return null;
    return (data.errorCodes || []).find((item) => {
      const current = normalizeCode(item.code);
      const aliases = (item.aliases || []).map(normalizeCode);
      return current === normalized || aliases.includes(normalized);
    }) || null;
  };
  const getErrorCodeLabel = (item) => `${item.code} · ${item.title}`;
  const getErrorCodeKind = (item) => {
    const code = normalizeCode(item.code);
    if (code.startsWith("0xC000021A") || code.startsWith("0xC000000F") || code.startsWith("0xC0000225") || code.startsWith("0x00000074") || code.startsWith("0x000000A5") || code.startsWith("0x000000ED")) return { label: "부팅", className: "boot" };
    if (code.startsWith("0x800F") || code.startsWith("0x80070002") || code.startsWith("0x80070057") || code.startsWith("0x80004005")) return { label: "업데이트", className: "update" };
    if (code.startsWith("0x80070005")) return { label: "권한", className: "permission" };
    if (code.startsWith("0x00000116") || code.startsWith("0x000000EA")) return { label: "그래픽", className: "graphics" };
    if (code.startsWith("0x000000D1") || code.startsWith("0x0000009F") || code.startsWith("0x000000C2") || code.startsWith("0x000000F7")) return { label: "드라이버", className: "driver" };
    if (code.startsWith("0x00000019") || code.startsWith("0x0000001A") || code.startsWith("0x00000050") || code.startsWith("0x000000BE") || code.startsWith("0x000000D8")) return { label: "메모리", className: "memory" };
    if (code.startsWith("0x0000007B") || code.startsWith("0x0000007A") || code.startsWith("0x00000133") || code.startsWith("0x80070570")) return { label: "저장장치", className: "storage" };
    return { label: "일반", className: "general" };
  };
  const getErrorCodeIcon = (item) => {
    const kind = getErrorCodeKind(item).className;
    const map = {
      boot: "B",
      update: "U",
      permission: "P",
      graphics: "G",
      driver: "D",
      memory: "M",
      storage: "S",
      general: "I",
    };
    return map[kind] || "I";
  };
  const getErrorCodeMatches = (query) => {
    const normalized = normalizeCode(query);
    const filtered = (data.errorCodes || []).filter((item) => selectedErrorKind === "all" || getErrorCodeKind(item).className === selectedErrorKind);
    if (!normalized) return filtered.slice(0, 6);
    return filtered.filter((item) => {
      const searchable = [
        item.code,
        item.title,
        item.summary,
        ...(item.aliases || [])
      ].join(" ").toUpperCase();
      return searchable.includes(normalized.toUpperCase()) || normalizeCode(item.code).includes(normalized);
    }).slice(0, 6);
  };
  const getGuideKind = (item) => item.link.startsWith("hardware-") ? "hardware" : "windows";
  const getGuideReadTime = (item) => {
    const details = (data.symptomDetails || {})[item.id] || {};
    const content = [
      ...(details.intro || []),
      ...(details.warnings || []),
      ...(details.checks || []).flatMap((check) => [check.title, check.why, check.how]),
      ...(details.deeper || []).flatMap((part) => [part.heading, part.text]),
      ...(details.decision || []).flatMap((part) => [part.heading, part.text]),
      ...(details.examples || []),
      ...(details.mistakes || []),
      ...(details.faq || []).flatMap((item) => [item.q, item.a]),
    ].join(" ");
    return Math.max(3, Math.round(content.length / 420));
  };
  const navPage = currentPage.startsWith("error-code-") ? "diagnostic.html" :
    (currentPage.endsWith(".html") && !["index.html", "diagnostic.html", "guides.html"].includes(currentPage) ? "guides.html" : currentPage);
  document.querySelectorAll(".nav a").forEach((link) => {
    const targetPage = (link.getAttribute("href") || "").split("#")[0].toLowerCase();
    const isHome = currentPage === "" && targetPage === "index.html";
    if (targetPage === navPage || isHome) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });
  const renderKindFilters = () => `
    <div class="kind-filters" data-kind-filters>
      ${kindFilters.map((kind) => `
        <button type="button" class="kind-filter${kind.key === selectedErrorKind ? " active" : ""}" data-kind-key="${kind.key}">
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </button>
      `).join("")}
    </div>
  `;
  const readRecentCodes = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]").filter(Boolean);
    } catch {
      return [];
    }
  };
  const writeRecentCodes = (code) => {
    try {
      const next = readRecentCodes().filter((item) => item !== code);
      next.unshift(code);
      localStorage.setItem(storageKey, JSON.stringify(next.slice(0, 5)));
    } catch {
      // Ignore storage failures.
    }
  };
  const renderExampleTiles = (code) => {
    const examples = code.examples || [
      `${code.code} 관련 증상이 부팅 또는 작업 중 반복됨`,
      `${(code.causes && code.causes[0]) || "가장 가능성 높은 원인"} 확인 필요`,
      `${(code.checks && code.checks[0]) || "첫 점검 항목"}부터 진행`
    ];
    return `
      <div class="example-grid">
        ${examples.map((value, index) => `
          <div class="example-tile">
            <span class="example-index">${index + 1}</span>
            <strong>${value}</strong>
          </div>
        `).join("")}
      </div>
    `;
  };
  const getSupplementalChecks = (code) => {
    const kind = getErrorCodeKind(code).className;
    const lookup = {
      boot: ["복구 환경에서 시작 복구 실행", "최근 하드웨어 변경 내역 확인"],
      update: ["보안 프로그램과 VPN 상태 확인", "업데이트 캐시 초기화"],
      permission: ["관리자 권한으로 재실행", "폴더/레지스트리 권한 점검"],
      graphics: ["그래픽 드라이버 안정 버전 재설치", "발열과 전원 공급 상태 확인"],
      driver: ["최근 설치 장치 분리", "안전 모드에서 재현 여부 확인"],
      memory: ["메모리 재장착 또는 슬롯 교차", "Windows 메모리 진단 실행"],
      storage: ["디스크 SMART/건강 상태 점검", "케이블과 슬롯 접촉 확인"],
      general: ["최근 설치/변경 사항 되돌리기", "시스템 복원 지점 검토"],
    };
    return lookup[kind] || lookup.general;
  };
  const getErrorCodeGuidance = (code) => {
    const kind = getErrorCodeKind(code).className;
    const isHardware = /WHEA|MACHINE_CHECK|UNCORRECTABLE|전원|과열/i.test(`${code.title} ${code.summary}`);
    const lookup = {
      boot: {
        interpretation: "부팅 계열 코드는 Windows가 시스템 드라이브나 부팅 구성 정보를 정상적으로 읽지 못했다는 뜻입니다. 복구 명령을 반복하기 전에 BIOS에서 저장장치가 안정적으로 인식되는지와 최근 부팅 설정 변경 여부를 먼저 나누어 확인해야 합니다.",
        caution: "디스크가 간헐적으로 사라지거나 읽기 오류가 있다면 복구·재설치보다 중요한 파일 백업이 우선입니다.",
        next: "복구 환경에서도 같은 문제가 이어지면 다른 포트나 슬롯에서 저장장치를 교차 확인하고, 제조사 진단 도구의 건강 상태 결과를 함께 기록하세요."
      },
      update: {
        interpretation: "업데이트 계열 코드는 설치 파일, 구성 요소 저장소, 서비스, 여유 공간 중 어느 단계에서 작업이 중단됐는지를 나타냅니다. 코드만 반복 입력하기보다 업데이트 기록의 실패 시각과 바로 앞 단계에서 멈춘 비율을 함께 보면 범위를 더 빨리 좁힐 수 있습니다.",
        caution: "업데이트 캐시를 초기화하기 전에 중요한 작업을 종료하고, 시스템 드라이브와 복구 파티션의 여유 공간을 확인하세요.",
        next: "같은 코드가 반복되면 Windows Update 로그, DISM 결과, 설치 미디어 버전이 현재 Windows 버전과 일치하는지 차례로 확인하세요."
      },
      permission: {
        interpretation: "권한 계열 코드는 현재 계정, 폴더 권한, 보안 프로그램 또는 조직 정책이 작업을 막고 있다는 의미입니다. 무조건 모든 권한을 허용하기보다 어떤 파일이나 설정에서 거부됐는지를 먼저 확인해야 합니다.",
        caution: "시스템 폴더의 소유자와 권한을 일괄 변경하면 다른 업데이트나 앱 실행에 문제가 생길 수 있습니다.",
        next: "관리자 권한에서도 실패하면 보안 프로그램 기록, 파일 소유자, 회사·학교 계정 정책 적용 여부를 확인하세요."
      },
      graphics: {
        interpretation: "그래픽 계열 코드는 GPU가 정해진 시간 안에 응답하지 못했거나 드라이버 복구에 실패했을 때 주로 나타납니다. 드라이버 문제와 발열·전원 문제를 같은 순서로 확인해야 재설치만 반복하는 일을 줄일 수 있습니다.",
        caution: "고온이나 화면 깨짐이 함께 보이면 장시간 부하 테스트보다 전원 케이블과 냉각 상태를 먼저 확인하세요.",
        next: "안정 버전 드라이버에서도 재현되면 GPU 온도, 핫스팟 온도, 보조전원 연결, 다른 그래픽 출력 경로를 교차 확인하세요."
      },
      driver: {
        interpretation: "드라이버 계열 코드는 커널 영역에서 장치 드라이버가 잘못된 메모리나 전원 상태를 사용했을 가능성을 보여줍니다. 최근 설치한 드라이버와 연결 장치를 기준으로 재현 시점을 비교하는 것이 핵심입니다.",
        caution: "원인을 모른 채 여러 드라이버를 한꺼번에 갱신하면 어떤 변경이 영향을 줬는지 확인하기 어려워집니다.",
        next: "안전 모드에서는 멈추지 않는다면 최근 드라이버를 하나씩 되돌리고, 장치 관리자와 이벤트 로그의 오류 장치를 함께 확인하세요."
      },
      memory: {
        interpretation: "메모리 계열 코드는 RAM 자체뿐 아니라 메모리를 사용하는 드라이버, 저장장치 페이지 파일, 오버클럭 설정 때문에 발생할 수 있습니다. 코드가 매번 달라지는지와 특정 작업에서만 반복되는지를 함께 봐야 합니다.",
        caution: "XMP·EXPO나 수동 오버클럭이 켜져 있다면 기본값 상태에서 먼저 재현 여부를 확인하세요.",
        next: "메모리를 한 개씩 장착해 슬롯을 교차하고, 기본 설정에서 장시간 검사한 결과를 비교하세요."
      },
      storage: {
        interpretation: "저장장치 계열 코드는 Windows가 SSD·HDD에서 필요한 데이터를 제때 읽지 못했거나 장치 응답이 지연됐다는 뜻입니다. 파일 시스템 오류와 물리 연결, 디스크 건강 상태를 구분해서 확인해야 합니다.",
        caution: "SMART 경고나 반복되는 읽기 오류가 있으면 검사 작업보다 데이터 백업을 먼저 진행하세요.",
        next: "다른 포트·케이블·M.2 슬롯에서도 같은 현상이 나타나는지 확인하고 제조사 펌웨어와 진단 결과를 함께 비교하세요."
      },
      general: {
        interpretation: "이 코드는 한 가지 부품만 지목하기보다 발생 시점과 함께 나타난 증상을 기준으로 해석해야 합니다. 최근 변경 사항, 반복 조건, 안전 모드에서의 재현 여부를 기록하면 소프트웨어와 하드웨어 원인을 분리하는 데 도움이 됩니다.",
        caution: "원인이 확인되지 않은 상태에서 레지스트리 수정이나 초기화를 먼저 진행하지 마세요.",
        next: "같은 코드가 반복되면 이벤트 로그와 장치 상태를 기록하고, 코드가 계속 바뀐다면 메모리·전원·온도처럼 시스템 전체 안정성을 먼저 확인하세요."
      }
    };
    if (isHardware) {
      return {
        interpretation: "이 오류는 Windows 하드웨어 오류 아키텍처가 CPU, 메모리, PCIe 장치 또는 전원 계통에서 수정할 수 없는 문제를 보고했을 때 주로 나타납니다. 특정 부품을 바로 단정하지 말고 온도, 기본 클럭 상태, 전원 안정성, 재현되는 작업을 함께 기록해야 합니다.",
        caution: "오버클럭과 XMP·EXPO를 기본값으로 돌리고, 과열이나 타는 냄새가 있으면 즉시 전원을 끈 뒤 점검하세요.",
        next: "기본 설정에서도 반복되면 CPU·메모리·GPU를 각각 분리해 테스트하고 WHEA 이벤트의 오류 원본과 제조사 진단 결과를 확인하세요."
      };
    }
    return lookup[kind] || lookup.general;
  };
  const normalizeLogText = (value) => String(value || "").replace(/\r\n/g, "\n").trim();
  const firstMatch = (text, patterns) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) return match[1].trim();
    }
    return "";
  };
  const collectMatches = (lines, pattern, limit = 3) => {
    const result = [];
    lines.forEach((line) => {
      if (pattern.test(line) && !result.includes(line)) {
        result.push(line);
      }
    });
    return result.slice(0, limit);
  };
  const detectHardwareLogSource = (text) => {
    const lower = text.toLowerCase();
    if (/crystaldiskinfo|smart status|health status|power on hours|interface crc error count/.test(lower)) {
      return { key: "crystaldiskinfo", label: "CrystalDiskInfo" };
    }
    if (/hwinfo|sensors|cpu package|gpu temperature|thermal throttling|vrm/.test(lower)) {
      return { key: "hwinfo", label: "HWiNFO" };
    }
    if (/directx diagnostic tool|dxdiag|display devices|sound devices|system information/.test(lower)) {
      return { key: "dxdiag", label: "dxdiag" };
    }
    if (/system summary|bios mode|secure boot state|baseboard product|installed physical memory|problem devices/.test(lower)) {
      return { key: "msinfo32", label: "msinfo32" };
    }
    return { key: "generic", label: "일반 로그" };
  };
  const getHardwareFileBadge = (file) => {
    if (!file) return "";
    const name = String(file.name || "").trim();
    const ext = (name.includes(".") ? name.split(".").pop() : "").toLowerCase();
    const map = {
      txt: "TXT 파일",
      log: "LOG 파일",
      csv: "CSV 파일",
      json: "JSON 파일",
      xml: "XML 파일",
      html: "HTML 파일",
      htm: "HTML 파일",
      md: "MD 파일",
    };
    return map[ext] || (ext ? `${ext.toUpperCase()} 파일` : "파일");
  };
  const analyzeHardwareLog = (rawValue) => {
    const text = normalizeLogText(rawValue);
    const lines = text ? text.split("\n").map((line) => line.trim()).filter(Boolean) : [];
    if (!text) {
      return {
        empty: true,
        source: { key: "generic", label: "일반 로그" },
        fileBadge: currentHardwareLogMeta ? getHardwareFileBadge(currentHardwareLogMeta) : "",
        fileName: currentHardwareLogMeta ? currentHardwareLogMeta.name : "",
        summary: "로그를 붙여넣거나 파일을 선택하면 하드웨어 정보를 읽어줍니다.",
        fields: [],
        alerts: [],
        highlights: [],
        links: [],
        focus: [],
        formatNote: "",
        maxTemp: null,
      };
    }
    const source = detectHardwareLogSource(text);
    const focus = [];
    const formatNoteMap = {
      crystaldiskinfo: "디스크 상태와 SMART 항목을 중심으로 읽고 있습니다.",
      hwinfo: "온도, 전력, 팬, 쓰로틀링 정보를 중심으로 읽고 있습니다.",
      dxdiag: "그래픽 드라이버와 DirectX 관련 항목을 중심으로 읽고 있습니다.",
      msinfo32: "BIOS, 부팅 방식, 장치 요약을 중심으로 읽고 있습니다.",
      generic: "로그 내용에서 핵심 하드웨어 항목을 찾아 읽고 있습니다.",
    };

    const cpu = firstMatch(text, [
      /^(?:.*(?:CPU|Processor|프로세서).*)[:=]\s*(.+)$/im,
      /^Processor Name:\s*(.+)$/im,
      /^CPU Name:\s*(.+)$/im,
    ]);
    const memory = firstMatch(text, [
      /^(?:.*(?:Installed Memory \(RAM\)|Installed Physical Memory|Total Physical Memory).*)[:=]\s*(.+)$/im,
      /^Memory:\s*(.+)$/im,
    ]);
    const gpu = firstMatch(text, [
      /^(?:.*(?:Card name|Name|Video Controller|Adapter Description).*)[:=]\s*(.+)$/im,
      /^Display Device:\s*(.+)$/im,
    ]);
    const bios = firstMatch(text, [
      /^(?:.*(?:BIOS Version\/Date|BIOS Version|UEFI).*)[:=]\s*(.+)$/im,
      /^BIOS:\s*(.+)$/im,
    ]);
    const board = firstMatch(text, [
      /^(?:.*(?:BaseBoard Product|BaseBoard Manufacturer|Motherboard|Mainboard).*)[:=]\s*(.+)$/im,
      /^Motherboard:\s*(.+)$/im,
    ]);
    const diskHealth = firstMatch(text, [
      /^Health Status:\s*(.+)$/im,
      /^Disk Health:\s*(.+)$/im,
      /^SMART Status:\s*(.+)$/im,
    ]);
    const diskTemp = firstMatch(text, [
      /^Temperature:\s*(.+)$/im,
      /^Drive Temperature:\s*(.+)$/im,
      /^Current Temperature:\s*(.+)$/im,
    ]);
    const diskPowerHours = firstMatch(text, [
      /^Power On Hours:\s*(.+)$/im,
      /^Power-on Hours:\s*(.+)$/im,
    ]);
    const diskPowerCycles = firstMatch(text, [
      /^Power Cycle Count:\s*(.+)$/im,
      /^Power On Count:\s*(.+)$/im,
    ]);
    const diskCrc = firstMatch(text, [
      /^Interface CRC Error Count:\s*(.+)$/im,
      /^CRC Error Count:\s*(.+)$/im,
    ]);
    const diskPending = firstMatch(text, [
      /^Current Pending Sector Count:\s*(.+)$/im,
      /^Pending Sector Count:\s*(.+)$/im,
    ]);
    const diskReallocated = firstMatch(text, [
      /^Reallocated Sectors Count:\s*(.+)$/im,
      /^Reallocated Sector Count:\s*(.+)$/im,
    ]);
    const cpuTemp = firstMatch(text, [
      /^CPU Package\s*:\s*(.+)$/im,
      /^CPU Temperature:\s*(.+)$/im,
      /^CPU Package Temperature:\s*(.+)$/im,
    ]);
    const gpuTemp = firstMatch(text, [
      /^GPU Temperature:\s*(.+)$/im,
      /^GPU Core Temperature:\s*(.+)$/im,
      /^GPU Hot Spot Temperature:\s*(.+)$/im,
    ]);
    const fanSpeed = firstMatch(text, [
      /^CPU Fan:\s*(.+)$/im,
      /^GPU Fan:\s*(.+)$/im,
      /^Fan Speed:\s*(.+)$/im,
    ]);
    const throttling = firstMatch(text, [
      /^Thermal Throttling:\s*(.+)$/im,
      /^Power Limit Exceeded:\s*(.+)$/im,
      /^Limit Reasons:\s*(.+)$/im,
    ]);
    const driverVersion = firstMatch(text, [
      /^Driver Version:\s*(.+)$/im,
      /^Display Driver Version:\s*(.+)$/im,
      /^Driver Date:\s*(.+)$/im,
    ]);
    const driverNotes = firstMatch(text, [
      /^Notes:\s*(.+)$/im,
      /^Problem Devices:\s*(.+)$/im,
      /^Display Devices:\s*(.+)$/im,
    ]);
    const secureBoot = firstMatch(text, [
      /^Secure Boot State:\s*(.+)$/im,
      /^Secure Boot:\s*(.+)$/im,
    ]);
    const bootMode = firstMatch(text, [
      /^BIOS Mode:\s*(.+)$/im,
      /^Boot Mode:\s*(.+)$/im,
    ]);
    const storage = collectMatches(lines, /(nvme|ssd|hdd|disk|drive|smart|sata|ata|western digital|wdc|samsung|crucial|kingston|sk hynix|micron|seagate|toshiba|sandisk)/i, 3);
    const tempMatches = [...text.matchAll(/(\d{2,3})\s*°?\s*C\b/gi)].map((match) => Number(match[1])).filter(Number.isFinite);
    const maxTemp = tempMatches.length ? Math.max(...tempMatches) : null;

    const fields = [];
    const addField = (label, value) => {
      if (value && !fields.some((item) => item.label === label && item.value === value)) {
        fields.push({ label, value });
      }
    };
    addField("CPU", cpu);
    addField("메모리", memory);
    addField("그래픽", gpu);
    addField("BIOS/UEFI", bios);
    addField("메인보드", board);
    if (storage.length) addField("저장장치", storage[0]);
    if (diskHealth) addField("디스크 상태", diskHealth);
    if (diskTemp) addField("디스크 온도", diskTemp);
    if (diskPowerHours) addField("디스크 사용 시간", diskPowerHours);
    if (diskPowerCycles) addField("디스크 전원 켜짐 횟수", diskPowerCycles);
    if (diskCrc) addField("인터페이스 오류", diskCrc);
    if (diskPending) addField("보류 섹터", diskPending);
    if (diskReallocated) addField("재할당 섹터", diskReallocated);
    if (cpuTemp) addField("CPU 온도", cpuTemp);
    if (gpuTemp) addField("GPU 온도", gpuTemp);
    if (fanSpeed) addField("팬 속도", fanSpeed);
    if (throttling) addField("쓰로틀링", throttling);
    if (driverVersion) addField("드라이버 정보", driverVersion);
    if (driverNotes) addField("드라이버 메모", driverNotes);
    if (secureBoot) addField("Secure Boot", secureBoot);
    if (bootMode) addField("BIOS 모드", bootMode);

    const alerts = [];
    const links = [];
    const parts = [];
    const settings = [];
    const software = [];
    const steps = [];
    const addAlert = (severity, title, detail) => {
      if (!alerts.some((item) => item.title === title && item.detail === detail)) {
        alerts.push({ severity, title, detail });
      }
    };
    const addItem = (list, value) => {
      if (value && !list.includes(value)) {
        list.push(value);
      }
    };
    const addLink = (label, href) => {
      if (!links.some((item) => item.href === href)) {
        links.push({ label, href });
      }
    };

    const storageRisk = /smart.*(caution|warning|bad|predicted failure)|reallocated sectors|pending sectors|uncorrectable|crc error|read error|timeout|io error|disk.*fail|nvme.*error/i.test(text);
    const thermalRisk = /overheat|thermal|throttl|temperature|fan.*error|cooling/i.test(text) || (maxTemp !== null && maxTemp >= 85);
    const memoryRisk = /memory|ram|page fault|whea|machine check|invalid memory/i.test(text);
    const driverRisk = /driver|device not started|code 10|code 43|failed to start|cannot start/i.test(text);
    const bootRisk = /boot|bcd|uefi|secure boot|mbr|gpt|no boot|startup repair/i.test(text);

    addItem(parts, "저장장치(SATA/NVMe/SSD)");
    addItem(parts, "메모리(RAM)와 슬롯");
    addItem(parts, "메인보드와 BIOS/UEFI");

    addItem(settings, "BIOS/UEFI 기본값");
    addItem(settings, "XMP/EXPO 메모리 설정");
    addItem(settings, "전원 관리와 빠른 시작");
    addItem(software, "보안 프로그램 또는 백신");
    addItem(software, "오버레이/튜닝/오버클럭 프로그램");
    addItem(software, "최근 설치한 드라이버나 유틸리티");

    if (source.key === "crystaldiskinfo") {
      addItem(focus, "디스크 건강 상태와 재할당/보류 섹터");
      addItem(focus, "SATA 케이블, M.2 슬롯, 전원 연결");
      addItem(focus, "디스크 제조사 진단 도구");
    }
    if (source.key === "hwinfo") {
      addItem(focus, "CPU/GPU 온도와 팬 속도");
      addItem(focus, "쓰로틀링과 전력 제한");
      addItem(focus, "쿨러, 써멀구리스, 통풍 상태");
    }
    if (source.key === "dxdiag") {
      addItem(focus, "그래픽 드라이버 버전과 날짜");
      addItem(focus, "문제 없는지 Notes 항목");
      addItem(focus, "그래픽 드라이버 재설치");
    }
    if (source.key === "msinfo32") {
      addItem(focus, "BIOS 모드와 Secure Boot");
      addItem(focus, "메인보드 모델과 BIOS 버전");
      addItem(focus, "부팅 순서와 저장장치 인식");
    }
    if (source.key === "generic") {
      addItem(focus, "디스크 상태");
      addItem(focus, "메모리 온도/안정성");
      addItem(focus, "드라이버와 부팅 구성");
    }

    if (storageRisk) {
      addAlert("high", "저장장치 확인 필요", "SMART 경고나 읽기 오류가 보입니다.");
      addLink("NVMe 인식 지연", "hardware-nvme-delay.html");
      addLink("부팅 장치를 찾을 수 없음", "error-code-0x0000007b.html");
      addItem(parts, "SSD/NVMe 상태");
      addItem(parts, "SATA 케이블 또는 M.2 슬롯");
      addItem(settings, "BIOS 저장장치 인식 모드");
      addItem(settings, "부팅 순서");
      addItem(software, "SSD 제조사 진단 도구");
      addItem(steps, "디스크 SMART 상태부터 확인");
      addItem(steps, "케이블과 슬롯을 다시 연결");
      addItem(steps, "다른 포트나 다른 디스크로 교차 확인");
    }
    if (thermalRisk) {
      addAlert("high", "온도 또는 냉각 점검", maxTemp !== null ? `감지된 최고 온도: ${maxTemp}°C` : "온도나 냉각 관련 문구가 보입니다.");
      addLink("게임 중 재부팅", "hardware-gaming-reboot.html");
      addLink("화면 미출력", "hardware-no-display.html");
      addItem(parts, "CPU 쿨러와 써멀구리스");
      addItem(parts, "그래픽카드 팬과 먼지");
      addItem(parts, "전원공급장치(PSU)");
      addItem(settings, "팬 곡선/쿨링 프로필");
      addItem(settings, "전력 제한 또는 고성능 모드");
      addItem(software, "오버클럭/튜닝 프로그램");
      addItem(steps, "온도와 팬 회전수 확인");
      addItem(steps, "먼지와 통풍 상태 점검");
    }
    if (memoryRisk) {
      addAlert("medium", "메모리/시스템 안정성 점검", "메모리나 WHEA 관련 문구가 있습니다.");
      addLink("Critical Process Died", "windows-bsod-critical-process.html");
      addLink("MEMORY_MANAGEMENT", "error-code-0x0000001a.html");
      addItem(parts, "메모리(RAM)");
      addItem(parts, "메모리 슬롯");
      addItem(parts, "메인보드");
      addItem(settings, "XMP/EXPO 해제 후 재확인");
      addItem(settings, "메모리 기본 클럭/타이밍");
      addItem(software, "메모리 테스트 도구");
      addItem(steps, "메모리 재장착 또는 슬롯 교차");
      addItem(steps, "Windows 메모리 진단 실행");
    }
    if (driverRisk) {
      addAlert("medium", "드라이버 반응 확인", "장치가 정상 시작되지 않았을 수 있습니다.");
      addLink("장치 인식 문제", "hardware-usb-not-detected.html");
      addLink("드라이버 전원 상태 실패", "error-code-0x0000009f.html");
      addItem(parts, "그래픽/칩셋/스토리지 드라이버가 연결된 장치");
      addItem(settings, "장치 관리자 전원 관리 옵션");
      addItem(settings, "최근 업데이트된 드라이버");
      addItem(software, "보안 프로그램과 장치 유틸리티");
      addItem(steps, "최근 드라이버 변경 내역 확인");
      addItem(steps, "안전 모드에서 재현 여부 확인");
    }
    if (bootRisk) {
      addAlert("medium", "부팅 관련 항목 확인", "부팅 구성이나 펌웨어 문구가 보입니다.");
      addLink("자동 복구 루프", "windows-auto-repair-loop.html");
      addLink("부팅 정보 읽기 실패", "error-code-0xc000000f.html");
      addItem(parts, "저장장치");
      addItem(parts, "메인보드 BIOS/UEFI");
      addItem(settings, "UEFI/Legacy 부팅 방식");
      addItem(settings, "Secure Boot");
      addItem(settings, "부팅 순서와 복구 옵션");
      addItem(software, "부팅 복구 유틸리티");
      addItem(steps, "부팅 장치 인식 여부 확인");
      addItem(steps, "복구 환경에서 시작 복구 실행");
    }
    if (memory.length && !memoryRisk) {
      addItem(parts, "메모리(RAM)");
      addItem(settings, "XMP/EXPO 설정");
      addItem(steps, "메모리 기본 상태로 재부팅해 확인");
    }
    if (gpu.length) {
      addItem(parts, "그래픽카드와 보조전원");
      addItem(settings, "그래픽 드라이버와 전원 관리");
      addItem(software, "그래픽 드라이버 재설치 도구");
    }
    if (bios.length) {
      addItem(settings, "BIOS 버전과 기본값");
    }
    if (board.length) {
      addItem(parts, "메인보드와 전원부");
    }
    if (storage.length) {
      addItem(parts, "저장장치");
      addItem(settings, "SATA/NVMe 모드");
    }
    if (!focus.length) {
      addItem(focus, "하드웨어 부품과 설정");
      addItem(focus, "드라이버와 보안 프로그램");
    }

    const highlights = collectMatches(lines, /(warning|error|fail|caution|critical|temperature|smart|whea|timeout|reset|throttle|blue screen|reallocated|uncorrectable|nvme|ssd|gpu|memory|bios|boot)/i, 6);
    const summary = alerts.length
      ? "주의 신호가 감지되었습니다. 아래 점검 항목을 순서대로 확인해 보세요."
      : fields.length
        ? "로그는 읽혔습니다. 핵심 부품과 설정을 먼저 확인해 보세요."
        : "읽을 만한 시스템 정보는 보이지 않지만, 형식을 다시 확인해 볼 수 있습니다.";

    return {
      empty: false,
      source,
      fileBadge: currentHardwareLogMeta ? getHardwareFileBadge(currentHardwareLogMeta) : "",
      fileName: currentHardwareLogMeta ? currentHardwareLogMeta.name : "",
      summary,
      fields,
      alerts,
      parts,
      settings,
      software,
      steps,
      focus,
      formatNote: formatNoteMap[source.key] || formatNoteMap.generic,
      highlights,
      links,
      maxTemp,
    };
  };
  const renderLogAnalysis = (report) => {
    if (report.empty) {
      return `
        <p class="muted">로그를 붙여넣거나 파일을 선택하면 하드웨어 정보가 표시됩니다.</p>
      `;
    }
    const statusTone = report.alerts.some((item) => item.severity === "high")
      ? "high"
      : report.alerts.some((item) => item.severity === "medium")
        ? "medium"
        : "low";
    const fileBadge = report.fileBadge ? `<span class="log-file-badge">${report.fileBadge}</span>` : "";
    const fileName = report.fileName ? `<span class="log-file-name">${report.fileName}</span>` : "";
    const fieldList = report.fields.length ? `
      <div class="log-field-list">
        ${report.fields.map((item) => `
          <div class="log-field">
            <strong>${item.label}</strong>
            <span>${item.value}</span>
          </div>
        `).join("")}
      </div>
    ` : `<p class="muted">핵심 하드웨어 항목을 찾지 못했습니다.</p>`;
    const focusList = report.focus.length ? `
      <div class="log-focus-list">
        ${report.focus.map((value) => `<span class="log-focus-item">${value}</span>`).join("")}
      </div>
    ` : "";
    const partList = report.parts.length ? `
      <ul class="mini-list log-mini-list">${report.parts.map((value) => `<li>${value}</li>`).join("")}</ul>
    ` : "";
    const settingList = report.settings.length ? `
      <ul class="mini-list log-mini-list">${report.settings.map((value) => `<li>${value}</li>`).join("")}</ul>
    ` : "";
    const softwareList = report.software.length ? `
      <ul class="mini-list log-mini-list">${report.software.map((value) => `<li>${value}</li>`).join("")}</ul>
    ` : "";
    const stepList = report.steps.length ? `
      <ol class="mini-list log-mini-list">${report.steps.map((value) => `<li>${value}</li>`).join("")}</ol>
    ` : "";
    const alertList = report.alerts.length ? `
      <div class="log-alert-list">
        ${report.alerts.map((item) => `
          <div class="log-alert log-alert--${item.severity}">
            <strong>${item.title}</strong>
            <p>${item.detail}</p>
          </div>
        `).join("")}
      </div>
    ` : `<p class="muted">눈에 띄는 경고 신호는 없습니다.</p>`;
    const highlightList = report.highlights.length ? `
      <div class="log-highlight-list">
        ${report.highlights.map((line) => `<div class="log-highlight">${line}</div>`).join("")}
      </div>
    ` : "";
    const linkList = report.links.length ? `
      <div class="log-link-list">
        ${report.links.map((item) => `<a href="${item.href}">${item.label}</a>`).join("")}
      </div>
    ` : "";
    return `
      <div class="log-source log-source--${statusTone}">
        <strong>${report.source.label}</strong>
        <span>${report.formatNote}</span>
        ${fileBadge}
        ${fileName}
      </div>
      <p class="log-summary">${report.summary}</p>
      ${fieldList}
      ${focusList ? `<h4>이 로그에서 특히 보는 항목</h4>${focusList}` : ""}
      ${partList ? `<h4>확인해야 할 부품</h4>${partList}` : ""}
      ${settingList ? `<h4>설정 확인</h4>${settingList}` : ""}
      ${softwareList ? `<h4>프로그램 점검</h4>${softwareList}` : ""}
      ${stepList ? `<h4>우선 점검 순서</h4>${stepList}` : ""}
      ${alertList}
      ${highlightList ? `<h4>감지된 문장</h4>${highlightList}` : ""}
      ${linkList ? `<h4>연결된 가이드</h4>${linkList}` : ""}
    `;
  };
  const renderParagraphs = (items) => (items || []).map((value) => `<p>${value}</p>`).join("");
  const escapeEventText = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  const maskEventPrivacy = (value) => String(value || "")
    .replace(/(Computer(?: Name)?|컴퓨터(?: 이름)?)\s*[:=]\s*[^\r\n<]+/gi, "$1: [컴퓨터 이름 숨김]")
    .replace(/(User(?: Name)?|사용자(?: 이름)?)\s*[:=]\s*[^\r\n<]+/gi, "$1: [사용자 이름 숨김]")
    .replace(/C:\\Users\\[^\\\s<]+/gi, "C:\\Users\\[사용자]")
    .replace(/\\Device\\HarddiskVolume\d+/gi, "\\Device\\HarddiskVolume[번호]");
  const normalizeEventSource = (value) => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  const findEventViewerEntries = ({ id, source }) => {
    const normalizedId = String(id || "").trim();
    const normalizedSource = normalizeEventSource(source);
    const entries = data.eventViewerCodes || [];
    return entries.filter((item) => {
      const idMatch = !normalizedId || String(item.id) === normalizedId;
      const itemSource = normalizeEventSource(item.source);
      const sourceMatch = !normalizedSource || itemSource.includes(normalizedSource) || normalizedSource.includes(itemSource);
      return idMatch && sourceMatch;
    });
  };
  const extractEventViewerFields = (rawValue) => {
    const masked = maskEventPrivacy(normalizeLogText(rawValue));
    const get = (patterns) => firstMatch(masked, patterns);
    const id = get([
      /<EventID[^>]*>(\d+)<\/EventID>/i,
      /(?:Event ID|이벤트 ID|Id)\s*[:=]\s*(\d+)/i,
      /^\s*(?:오류|경고|정보)?\s*(\d{1,5})\s+(?:Kernel|Disk|Ntfs|Display|WHEA|Application|EventLog|Service)/im,
    ]);
    const source = get([
      /<Provider[^>]+Name=["']([^"']+)["']/i,
      /(?:Source|원본|ProviderName)\s*[:=]\s*([^\r\n<]+)/i,
    ]);
    const level = get([
      /(?:Level|수준|LevelDisplayName)\s*[:=]\s*([^\r\n<]+)/i,
      /<Level>(\d+)<\/Level>/i,
    ]);
    const time = get([
      /<TimeCreated[^>]+SystemTime=["']([^"']+)["']/i,
      /(?:Date and Time|날짜 및 시간|TimeCreated|시간)\s*[:=]\s*([^\r\n<]+)/i,
    ]);
    const logName = get([
      /<Channel>([^<]+)<\/Channel>/i,
      /(?:Log Name|로그 이름)\s*[:=]\s*([^\r\n<]+)/i,
    ]);
    const task = get([/(?:Task Category|작업 범주|TaskDisplayName)\s*[:=]\s*([^\r\n<]+)/i]);
    const bugcheckCode = get([/<Data Name=["']BugcheckCode["']>([^<]+)<\/Data>/i, /BugcheckCode\s*[:=]\s*([^\s<]+)/i]);
    const device = get([
      /(?:DeviceInstanceId|Device Name|장치 이름|DriverName|드라이버 이름)\s*[:=]\s*([^\r\n<]+)/i,
      /<Data Name=["'](?:DeviceInstanceId|DriverName)["']>([^<]+)<\/Data>/i,
    ]);
    const eventRecordPattern = /<(?:Event|System)[\s>]/gi;
    const recordCount = Math.max(1, (masked.match(eventRecordPattern) || []).length, (masked.match(/(?:Event ID|이벤트 ID)\s*[:=]/gi) || []).length);
    return { id, source, level, time, logName, task, bugcheckCode, device, recordCount, masked };
  };
  const getEventTone = (entry, repeatCount = 1) => {
    if (entry.urgency === "backup") return { key: "danger", label: "백업·우선 점검" };
    if (entry.urgency === "repeat-check" || repeatCount >= 3) return { key: "warning", label: "반복 여부 확인" };
    if (entry.urgency === "driver") return { key: "info", label: "설정·드라이버 점검" };
    return { key: "neutral", label: "대체로 낮은 긴급도" };
  };
  const eventOfficialLinks = {
    "kernel-power:41": [{ label: "Microsoft: Kernel-Power 41", href: "https://learn.microsoft.com/troubleshoot/windows-client/performance/event-id-41-restart" }],
    "whea-logger:18": [{ label: "Microsoft: WHEA 하드웨어 오류", href: "https://learn.microsoft.com/windows-hardware/drivers/whea/whea-hardware-error-events" }],
    "disk:7": [{ label: "Microsoft: 디스크 오류 점검", href: "https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors" }],
    "storahci:129": [{ label: "Microsoft: 저장장치 129·153 점검", href: "https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors" }],
    "display:4101": [{ label: "Microsoft: 그래픽 TDR 동작", href: "https://learn.microsoft.com/windows-hardware/drivers/display/timeout-detection-and-recovery" }],
    "application error:1000": [{ label: "Microsoft: Get-WinEvent", href: "https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent" }]
  };
  const renderEventViewerResult = ({ entry, fields, repeatCount, selectedLevel }) => {
    if (!entry) {
      return `<div class="event-empty"><strong>일치하는 이벤트를 찾지 못했습니다.</strong><p>이벤트 ID와 원본을 확인해 주세요. 같은 ID도 원본에 따라 의미가 달라질 수 있습니다.</p><p><a href="event-viewer-guide.html">이벤트 ID와 원본 확인 방법</a></p></div>`;
    }
    const tone = getEventTone(entry, repeatCount);
    const relatedCodes = (entry.relatedCodes || []).map((codeValue) => {
      const code = findErrorCode(codeValue);
      return code ? `<a href="${code.detailPage || code.link}">${escapeEventText(codeValue)}</a>` : `<span>${escapeEventText(codeValue)}</span>`;
    }).join("");
    const relatedGuides = (entry.relatedGuides || []).map((href) => {
      const symptom = (data.symptoms || []).find((item) => item.link === href);
      return `<a href="${escapeEventText(href)}">${escapeEventText(symptom?.title || "관련 증상 가이드")}</a>`;
    }).join("");
    const officialKey = `${entry.source}:${entry.id}`.toLowerCase();
    const officialLinks = (eventOfficialLinks[officialKey] || []).map((item) =>
      `<a href="${item.href}" target="_blank" rel="noopener noreferrer">${escapeEventText(item.label)}</a>`
    ).join("");
    const observed = [
      fields.logName && ["로그", fields.logName], fields.time && ["발생 시각", fields.time],
      fields.task && ["작업 범주", fields.task], fields.bugcheckCode && ["BugcheckCode", fields.bugcheckCode],
      fields.device && ["장치·드라이버", fields.device], selectedLevel && ["입력 수준", selectedLevel],
      repeatCount && ["반복 횟수", `${repeatCount}회`]
    ].filter(Boolean);
    return `
      <article class="event-result event-result--${tone.key}">
        <header class="event-result-head">
          <div><span class="event-id">이벤트 ${escapeEventText(entry.id)}</span><h4>${escapeEventText(entry.source)}</h4></div>
          <span class="event-risk">${tone.label}</span>
        </header>
        <p class="event-summary">${escapeEventText(entry.summary)}</p>
        ${observed.length ? `<dl class="event-observed">${observed.map(([label, value]) => `<div><dt>${escapeEventText(label)}</dt><dd>${escapeEventText(value)}</dd></div>`).join("")}</dl>` : ""}
        <section><h5>이 기록만으로 확정할 수 없는 내용</h5><p>이벤트 하나만으로 특정 부품 고장이나 드라이버 문제를 확정할 수 없습니다. 발생 직전 작업, 같은 시각의 다른 이벤트, 반복 조건을 함께 비교해야 합니다.</p></section>
        <div class="event-result-grid">
          <section><h5>주요 원인 후보</h5><ul>${entry.causes.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ul></section>
          <section><h5>먼저 할 점검</h5><ol>${entry.checks.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ol></section>
        </div>
        <section class="event-warning"><h5>주의할 점</h5><ul>${entry.warnings.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ul></section>
        ${(relatedCodes || relatedGuides || officialLinks || entry.detailPage) ? `<nav class="event-links" aria-label="관련 자료">${entry.detailPage ? `<a href="${entry.detailPage}">이 이벤트 상세 설명</a>` : ""}${relatedCodes}${relatedGuides}${officialLinks}</nav>` : ""}
      </article>`;
  };
  const siteLastUpdated = "2026-07-13";
  const detailThemeLookup = {
    "auto-repair": "boot",
    "bsod-critical-process": "critical",
    "explorer-freeze": "explorer",
    "printer-add-freeze": "printer",
    "gaming-reboot": "gaming",
    "no-display": "display",
    "nvme-delay": "storage",
    "usb-not-detected": "usb",
    "update-fail-loop": "update",
    "startup-slow": "startup",
    "taskbar-freeze": "taskbar",
    "wifi-disconnect": "wifi",
    "overheat-shutdown": "heat",
    "sound-not-working": "audio",
    "sleep-resume-fail": "sleep",
    "no-power": "power",
    "black-screen-after-login": "display",
    "disk-usage-100": "storage",
    "bluetooth-not-found": "usb",
    "app-not-launching": "update",
  };
  const quickCodeLookup = {
    "auto-repair": ["0xc000000f", "0xc0000225", "0x80070002", "0x800f0922"],
    "bsod-critical-process": ["0x000000ef", "0x000000d1", "0x00000050", "0x0000001a"],
    "explorer-freeze": ["0x80004005", "0x80070005", "0x0000003b", "0x0000007e"],
    "printer-add-freeze": ["0x80070005", "0x80004005", "0x0000009f", "0x000000c2"],
    "gaming-reboot": ["0x00000116", "0x000000ea", "0x0000009c", "0x0000001a"],
    "no-display": ["0x00000116", "0x000000ea", "0x000000a5", "0x000000be"],
    "nvme-delay": ["0x00000133", "0x0000007b", "0x00000077", "0x0000007a"],
    "usb-not-detected": ["0x0000009f", "0x000000c2", "0x80070005", "0x80004005"],
    "sleep-resume-fail": ["0x0000009f", "0x000000d1", "0x00000050", "0x80070005"],
    "no-power": ["0x0000009c", "0x000000ea", "0x0000001a", "0x000000be"],
    "black-screen-after-login": ["0x00000116", "0x000000ea", "0x0000009f"],
    "disk-usage-100": ["0x00000133", "0x0000007a", "0x00000077"],
    "bluetooth-not-found": ["0x0000009f", "0x80070422", "0x80070005"],
    "app-not-launching": ["0x80070005", "0x80004005", "0x80070002"],
  };
  const detailFlowLookup = {
    "auto-repair": ["warnings", "intro", "codes", "checks", "decision", "deeper", "examples", "faq"],
    "bsod-critical-process": ["intro", "warnings", "codes", "checks", "decision", "examples", "deeper", "faq"],
    "explorer-freeze": ["warnings", "intro", "examples", "codes", "checks", "decision", "deeper", "faq"],
    "printer-add-freeze": ["intro", "checks", "codes", "decision", "deeper", "examples", "faq"],
    "gaming-reboot": ["warnings", "checks", "intro", "codes", "decision", "deeper", "examples", "faq"],
    "no-display": ["warnings", "codes", "intro", "checks", "decision", "deeper", "examples", "faq"],
    "nvme-delay": ["intro", "warnings", "checks", "codes", "decision", "deeper", "examples", "faq"],
    "usb-not-detected": ["warnings", "intro", "checks", "codes", "decision", "deeper", "examples", "faq"],
    "update-fail-loop": ["warnings", "intro", "codes", "checks", "deeper", "decision", "examples", "faq"],
    "startup-slow": ["intro", "codes", "warnings", "checks", "examples", "decision", "deeper", "faq"],
    "taskbar-freeze": ["warnings", "intro", "checks", "examples", "codes", "decision", "deeper", "faq"],
    "wifi-disconnect": ["intro", "warnings", "checks", "decision", "codes", "deeper", "examples", "faq"],
    "overheat-shutdown": ["warnings", "intro", "checks", "decision", "codes", "deeper", "examples", "faq"],
    "sound-not-working": ["intro", "codes", "warnings", "checks", "decision", "examples", "deeper", "faq"],
    "sleep-resume-fail": ["warnings", "intro", "checks", "codes", "decision", "deeper", "examples", "faq"],
    "no-power": ["warnings", "intro", "checks", "decision", "codes", "deeper", "examples", "faq"],
    "black-screen-after-login": ["warnings", "intro", "checks", "codes", "decision", "examples", "deeper", "faq"],
    "disk-usage-100": ["intro", "warnings", "checks", "decision", "codes", "deeper", "examples", "faq"],
    "bluetooth-not-found": ["warnings", "intro", "checks", "decision", "deeper", "codes", "examples", "faq"],
    "app-not-launching": ["intro", "warnings", "codes", "checks", "decision", "examples", "deeper", "faq"],
  };
  const detailLayoutLookup = {
    "auto-repair": { checks: "grid", deeper: "grid" },
    "bsod-critical-process": { checks: "split", deeper: "grid" },
    "explorer-freeze": { checks: "stack", deeper: "stack" },
    "printer-add-freeze": { checks: "split", deeper: "stack" },
    "gaming-reboot": { checks: "grid", deeper: "split" },
    "no-display": { checks: "split", deeper: "grid" },
    "nvme-delay": { checks: "grid", deeper: "stack" },
    "usb-not-detected": { checks: "stack", deeper: "split" },
    "update-fail-loop": { checks: "split", deeper: "grid" },
    "startup-slow": { checks: "grid", deeper: "grid" },
    "taskbar-freeze": { checks: "stack", deeper: "grid" },
    "wifi-disconnect": { checks: "split", deeper: "stack" },
    "overheat-shutdown": { checks: "grid", deeper: "split" },
    "sound-not-working": { checks: "stack", deeper: "stack" },
    "sleep-resume-fail": { checks: "split", deeper: "grid" },
    "no-power": { checks: "grid", deeper: "stack" },
    "black-screen-after-login": { checks: "split", deeper: "grid" },
    "disk-usage-100": { checks: "grid", deeper: "split" },
    "bluetooth-not-found": { checks: "split", deeper: "stack" },
    "app-not-launching": { checks: "grid", deeper: "grid" },
  };
  const detailAngleLookup = {
    "auto-repair": "복구를 반복 실행하기보다 부팅 파일과 외장 장치의 영향을 먼저 구분하는 것이 중요합니다.",
    "bsod-critical-process": "같은 블루스크린이 반복되는지, 코드가 바뀌는지를 먼저 나눠야 합니다.",
    "explorer-freeze": "탐색기 멈춤은 폴더 자체보다 셸 확장과 우클릭 메뉴가 원인일 수 있습니다.",
    "printer-add-freeze": "프린터 자체보다 기존 드라이버와 포트 설정의 충돌 여부를 먼저 확인하는 편이 빠릅니다.",
    "gaming-reboot": "게임 중 재부팅은 온도와 전원 공급 상태를 함께 확인해야 원인을 정확히 판단할 수 있습니다.",
    "no-display": "화면이 나오지 않을 때는 모니터 고장으로 단정하기 전에 출력 경로와 메모리 접촉 상태를 확인해야 합니다.",
    "nvme-delay": "NVMe 인식 지연은 저장장치의 속도보다 초기 인식 과정과 BIOS 설정을 먼저 확인해야 합니다.",
    "usb-not-detected": "USB 미인식은 포트 문제와 절전 설정을 함께 확인해야 원인이 빨리 좁혀집니다.",
    "update-fail-loop": "업데이트 실패는 같은 코드 반복인지, 매번 다른 코드인지부터 구분하세요.",
    "startup-slow": "부팅 지연은 로그인 전과 후를 나누면 시작 프로그램 원인을 빨리 찾을 수 있습니다.",
    "taskbar-freeze": "작업표시줄 멈춤은 탐색기 셸과 시작 메뉴 쪽을 따로 보는 것이 핵심입니다.",
    "wifi-disconnect": "와이파이 끊김은 공유기보다 무선 드라이버와 절전 설정이 먼저일 때가 많습니다.",
    "overheat-shutdown": "과열 종료는 온도 로그와 전원 공급을 함께 보아야 해석이 정확합니다.",
    "sound-not-working": "소리 문제는 출력 장치가 바뀌었는지부터 확인해야 헷갈리지 않습니다.",
    "sleep-resume-fail": "절전 복귀 실패는 전원 상태 전환 과정과 주변 장치의 영향을 함께 확인해야 합니다.",
    "no-power": "전원 반응이 없다면 전원 연결 상태와 PSU를 가장 먼저 확인해야 합니다.",
    "black-screen-after-login": "로그인까지 보였다면 모니터 고장보다 그래픽 출력 모드와 Windows 탐색기 상태를 먼저 나눠 보세요.",
    "disk-usage-100": "디스크 100%는 저장 공간이 가득 찼다는 뜻이 아니라 처리 시간이 포화됐다는 의미입니다.",
    "bluetooth-not-found": "검색되지 않는 문제와 목록에는 보이지만 연결되지 않는 문제를 분리하면 원인을 빨리 찾을 수 있습니다.",
    "app-not-launching": "앱 하나만 안 열리는지 여러 앱이 함께 안 열리는지부터 구분해야 불필요한 초기화를 피할 수 있습니다.",
  };
  const detailHeadingLookup = {
    "auto-repair": "자동 복구 화면이 반복될 때 확인할 순서",
    "bsod-critical-process": "Critical Process Died가 반복될 때 확인할 순서",
    "explorer-freeze": "탐색기만 멈출 때 원인을 좁히는 방법",
    "printer-add-freeze": "프린터 추가가 멈출 때 먼저 확인할 것",
    "gaming-reboot": "게임 중 재부팅이 반복될 때 확인할 순서",
    "no-display": "전원은 켜지는데 화면이 안 뜰 때 확인 순서",
    "nvme-delay": "NVMe 인식이 늦어질 때 먼저 확인할 항목",
    "usb-not-detected": "USB가 인식되지 않을 때 확인할 순서",
    "update-fail-loop": "윈도우 업데이트가 반복해서 실패할 때 확인할 순서",
    "startup-slow": "부팅은 되는데 바탕화면이 늦게 뜰 때",
    "taskbar-freeze": "작업표시줄과 시작 메뉴가 멈출 때 보는 순서",
    "wifi-disconnect": "와이파이가 자꾸 끊길 때 먼저 확인할 부분",
    "overheat-shutdown": "온도가 오르면서 전원이 꺼질 때 확인할 순서",
    "sound-not-working": "소리가 나오지 않을 때 확인할 순서",
    "sleep-resume-fail": "절전 모드에서 정상적으로 복귀하지 못할 때 확인할 순서",
    "no-power": "전원 버튼을 눌러도 반응이 없을 때 확인할 순서",
    "black-screen-after-login": "로그인 후 검은 화면이 나타날 때 확인할 순서",
    "disk-usage-100": "디스크 사용률이 100%로 유지될 때 확인할 순서",
    "bluetooth-not-found": "블루투스 장치가 검색되지 않을 때 확인 순서",
    "app-not-launching": "앱이 열리지 않거나 바로 종료될 때 확인할 순서",
  };
  const detailExampleLeadLookup = {
    "auto-repair": "단순한 복구 오류처럼 보여도 저장장치와 부팅 정보에 문제가 함께 발생한 경우가 많습니다.",
    "bsod-critical-process": "같은 코드가 계속 반복되면 드라이버나 파일 손상 쪽을 더 우선해서 봐야 합니다.",
    "explorer-freeze": "폴더가 느린지, 우클릭이 막히는지에 따라 원인이 달라집니다.",
    "printer-add-freeze": "같은 프린터라도 연결 방식과 남아 있는 장치 항목에 따라 결과가 달라집니다.",
    "gaming-reboot": "게임에서만 꺼진다면 전원 공급과 온도 한계를 같이 봐야 합니다.",
    "no-display": "화면이 없다고 바로 본체 고장으로 단정하면 안 됩니다.",
    "nvme-delay": "저장장치 성능보다 초기 인식과 설정 문제를 먼저 나눠야 합니다.",
    "usb-not-detected": "USB 허브를 사용할 때와 본체 포트에 직접 연결할 때의 결과를 비교하면 원인을 좁히기 쉽습니다.",
    "update-fail-loop": "같은 코드가 반복되면 업데이트 캐시, 다른 코드면 환경 조건을 봐야 합니다.",
    "startup-slow": "로그인 전후 중 어느 구간이 느린지 구분하면 시작 프로그램과 저장장치 중 어디를 먼저 확인할지 판단할 수 있습니다.",
    "taskbar-freeze": "작업표시줄만 멈추는지, 탐색기 전체가 멈추는지부터 구분하세요.",
    "wifi-disconnect": "무선만 끊기는지, 유선도 같이 불안한지에 따라 점검 순서가 달라집니다.",
    "overheat-shutdown": "온도 로그만 보는 것보다 꺼지는 시점의 부하 상태가 더 중요합니다.",
    "sound-not-working": "출력 장치가 바뀌었는지 확인하지 않으면 원인을 잘못 잡기 쉽습니다.",
    "sleep-resume-fail": "복귀 직후의 재현 여부와 연결 장치가 가장 큰 단서입니다.",
    "no-power": "완전 무반응인지, 잠깐 반응하는지에 따라 보는 순서가 달라집니다.",
    "black-screen-after-login": "마우스 포인터와 Ctrl+Alt+Delete 반응은 하드웨어 출력 문제와 Windows 셸 문제를 나누는 중요한 단서입니다.",
    "disk-usage-100": "전송 속도뿐 아니라 응답 시간과 점유 프로세스를 함께 봐야 실제 병목을 찾을 수 있습니다.",
    "bluetooth-not-found": "다른 휴대폰에서 보이는지 시험하면 PC 어댑터와 블루투스 장치 중 어느 쪽을 먼저 볼지 정할 수 있습니다.",
    "app-not-launching": "오류 창과 이벤트 기록을 남겨 두면 복구, 초기화, 재설치 중 필요한 단계만 선택할 수 있습니다.",
  };
  const detailSafeModeLookup = {
    "auto-repair": "안전 모드가 열리면 윈도우 자체보다 최근 드라이버와 프로그램 쪽 가능성이 커집니다.",
    "bsod-critical-process": "안전 모드에서도 같은 코드가 뜨면 저장장치나 시스템 파일 손상을 더 의심해야 합니다.",
    "explorer-freeze": "안전 모드에서 멀쩡하면 셸 확장이나 시작 프로그램 영향이 큽니다.",
    "printer-add-freeze": "안전 모드에서 장치 추가가 되면 드라이버나 스풀러 쪽을 먼저 봐야 합니다.",
    "gaming-reboot": "안전 모드에서 게임 문제가 재현되지 않으면 전원, 발열, 그래픽 드라이버 가능성이 높습니다.",
    "no-display": "안전 모드 진입조차 어렵다면 그래픽카드나 메모리, 보드 쪽을 더 의심하세요.",
    "nvme-delay": "안전 모드 여부보다 BIOS 단계에서 SSD가 늦게 잡히는지가 더 중요합니다.",
    "usb-not-detected": "안전 모드에서도 USB가 안 잡히면 포트나 전원 관리 문제를 더 먼저 봐야 합니다.",
    "update-fail-loop": "안전 모드에서 업데이트 관련 항목이 사라지면 캐시와 서비스 충돌 가능성이 높습니다.",
    "startup-slow": "안전 모드에서 빠르면 시작 프로그램과 백그라운드 서비스가 원인일 수 있습니다.",
    "taskbar-freeze": "안전 모드에서 작업표시줄이 멀쩡하면 셸 확장이나 시작 메뉴 구성 문제일 가능성이 큽니다.",
    "wifi-disconnect": "안전 모드에서 무선이 사라지면 드라이버보다 설정/전원 관리가 핵심입니다.",
    "overheat-shutdown": "안전 모드에서 꺼지지 않으면 부하와 냉각 조건이 핵심입니다.",
    "sound-not-working": "안전 모드에서 소리가 나면 드라이버와 장치 선택 문제가 유력합니다.",
    "sleep-resume-fail": "안전 모드에서 복귀가 쉬우면 전원 관리 드라이버나 연결 장치 영향이 커집니다.",
    "no-power": "안전 모드 이전 단계의 문제라 OS 검사보다 전원부부터 봐야 합니다.",
    "black-screen-after-login": "안전 모드에서 바탕화면이 정상이라면 그래픽 드라이버와 시작 프로그램, 셸 확장 가능성이 큽니다.",
    "disk-usage-100": "안전 모드에서 사용률이 안정되면 백그라운드 앱과 서비스의 영향을 우선 비교하세요.",
    "bluetooth-not-found": "안전 모드에서는 일부 블루투스 기능이 제한될 수 있으므로 장치 관리자 인식 여부를 중심으로 확인하세요.",
    "app-not-launching": "안전 모드에서 앱이 열리면 시작 프로그램, 보안 프로그램, 추가 플러그인 충돌을 의심할 수 있습니다.",
  };
  const detailCommandLookup = {
    "auto-repair": [
      { command: "sfc /scannow", context: "윈도우 또는 안전 모드 · 관리자 권한", note: "윈도우에 로그인할 수 있을 때 시스템 파일 손상을 검사합니다." },
      { command: "DISM /Online /Cleanup-Image /RestoreHealth", context: "윈도우 또는 안전 모드 · 관리자 권한", note: "현재 실행 중인 윈도우의 복구 이미지 손상을 점검합니다. 복구 환경에서는 /Online을 사용하지 않습니다." },
      { command: "chkdsk C: /scan", context: "윈도우 실행 중 · 관리자 권한", note: "C:가 실제 윈도우 드라이브인지 확인한 뒤 파일 시스템 오류를 검사합니다." }
    ],
    "bsod-critical-process": [
      { command: "sfc /scannow", note: "핵심 시스템 파일 무결성을 확인합니다." },
      { command: "mdsched.exe", note: "메모리 검사를 시작합니다." },
      { command: "eventvwr.msc", note: "재부팅 직전 로그를 확인합니다." }
    ],
    "explorer-freeze": [
      { command: "taskkill /f /im explorer.exe", note: "탐색기를 재시작해 셸 문제를 분리합니다." },
      { command: "msconfig", note: "시작 프로그램을 줄여 재현 여부를 봅니다." },
      { command: "eventvwr.msc", note: "우클릭/셸 확장 오류 로그를 찾습니다." }
    ],
    "printer-add-freeze": [
      { command: "services.msc", note: "스풀러 상태를 확인합니다." },
      { command: "control printers", note: "기존 장치와 포트를 정리합니다." },
      { command: "devmgmt.msc", note: "장치 목록과 드라이버 상태를 봅니다." }
    ],
    "gaming-reboot": [
      { command: "dxdiag", note: "그래픽 장치와 드라이버를 확인합니다." },
      { command: "eventvwr.msc", note: "전원/드라이버 종료 로그를 봅니다." },
      { command: "powercfg.cpl", note: "전원 계획과 성능 모드를 점검합니다." }
    ],
    "no-display": [
      { command: "winver", note: "업데이트 직후 문제인지 확인합니다." },
      { command: "devmgmt.msc", note: "그래픽 장치와 메모리 상태를 봅니다." },
      { command: "msinfo32", note: "보드와 BIOS 정보를 확인합니다." }
    ],
    "nvme-delay": [
      { command: "msinfo32", note: "스토리지와 보드 정보를 한 번에 봅니다." },
      { command: "chkdsk C: /scan", note: "디스크 오류를 확인합니다." },
      { command: "eventvwr.msc", note: "부팅 지연과 디스크 오류 로그를 찾습니다." }
    ],
    "usb-not-detected": [
      { command: "devmgmt.msc", note: "장치 관리자에서 느낌표와 알 수 없는 장치를 확인합니다." },
      { command: "powercfg.cpl", note: "USB 절전 관련 설정을 봅니다." },
      { command: "services.msc", note: "장치 인식에 필요한 서비스 상태를 봅니다." }
    ],
    "update-fail-loop": [
      { command: "sfc /scannow", note: "파일 손상 여부를 확인합니다." },
      { command: "DISM /Online /Cleanup-Image /RestoreHealth", note: "업데이트 이미지 손상을 점검합니다." },
      { command: "cleanmgr", note: "임시 파일과 공간을 정리합니다." }
    ],
    "startup-slow": [
      { command: "msconfig", note: "시작 프로그램과 서비스를 줄입니다." },
      { command: "taskmgr", note: "시작 앱 지연을 확인합니다." },
      { command: "chkdsk C: /scan", note: "부팅 지연이 디스크 때문인지 봅니다." }
    ],
    "taskbar-freeze": [
      { command: "taskkill /f /im explorer.exe", note: "작업표시줄 셸을 다시 띄웁니다." },
      { command: "msconfig", note: "셸 확장과 시작 항목을 줄입니다." },
      { command: "eventvwr.msc", note: "ShellExperienceHost 관련 로그를 찾습니다." }
    ],
    "wifi-disconnect": [
      { command: "devmgmt.msc", note: "무선 어댑터 드라이버와 전원 설정을 봅니다." },
      { command: "powercfg.cpl", note: "절전 옵션을 확인합니다." },
      { command: "ncpa.cpl", note: "네트워크 어댑터 상태를 확인합니다." }
    ],
    "overheat-shutdown": [
      { command: "msinfo32", note: "시스템 구성과 보드를 확인합니다." },
      { command: "eventvwr.msc", note: "예기치 않은 전원 종료를 찾습니다." },
      { command: "dxdiag", note: "GPU 부하와 드라이버를 확인합니다." }
    ],
    "sound-not-working": [
      { command: "mmsys.cpl", note: "기본 출력 장치를 확인합니다." },
      { command: "devmgmt.msc", note: "오디오 장치와 드라이버를 봅니다." },
      { command: "services.msc", note: "오디오 서비스가 꺼졌는지 확인합니다." }
    ],
    "sleep-resume-fail": [
      { command: "powercfg.cpl", note: "전원 계획과 절전 시간을 확인합니다." },
      { command: "devmgmt.msc", note: "전원 관리 드라이버와 장치 상태를 봅니다." },
      { command: "eventvwr.msc", note: "복귀 직전 이벤트와 오류를 찾습니다." }
    ],
    "no-power": [
      { command: "powercfg.cpl", note: "전원 계획보다 먼저 하드웨어 연결을 봐야 합니다." },
      { command: "msinfo32", note: "보드와 전원 정보 확인용입니다." },
      { command: "eventvwr.msc", note: "정상 부팅 로그가 있는지 확인합니다." }
    ],
    "black-screen-after-login": [
      { command: "taskmgr", note: "Windows 탐색기를 다시 실행하고 멈춘 시작 앱을 확인합니다." },
      { command: "devmgmt.msc", note: "그래픽 어댑터 드라이버 상태와 이전 버전 복원 가능 여부를 봅니다." },
      { command: "eventvwr.msc", note: "로그인 시각의 Display 또는 응용 프로그램 오류를 확인합니다." }
    ],
    "disk-usage-100": [
      { command: "taskmgr", note: "디스크 열을 정렬해 점유 프로세스와 지속 시간을 확인합니다." },
      { command: "resmon", note: "어떤 파일이 반복해서 읽히고 응답 시간이 얼마나 긴지 봅니다." },
      { command: "chkdsk C: /scan", note: "온라인 상태에서 파일 시스템 오류를 먼저 검사합니다." }
    ],
    "bluetooth-not-found": [
      { command: "ms-settings:bluetooth", note: "블루투스 설정과 장치 추가 화면을 바로 엽니다." },
      { command: "devmgmt.msc", note: "블루투스 어댑터 인식과 드라이버 오류를 확인합니다." },
      { command: "services.msc", note: "Bluetooth 지원 서비스가 중지됐는지 확인합니다." }
    ],
    "app-not-launching": [
      { command: "eventvwr.msc", note: "응용 프로그램 오류의 모듈 이름과 예외 코드를 확인합니다." },
      { command: "appwiz.cpl", note: "데스크톱 프로그램의 복구 또는 제거 항목을 엽니다." },
      { command: "wsreset.exe", note: "Microsoft Store 앱 캐시 문제를 확인할 때 사용합니다." }
    ]
  };
  const detailRelatedLookup = {
    "auto-repair": ["bsod-critical-process", "nvme-delay", "update-fail-loop"],
    "bsod-critical-process": ["auto-repair", "gaming-reboot", "sleep-resume-fail"],
    "explorer-freeze": ["taskbar-freeze", "update-fail-loop", "sound-not-working"],
    "printer-add-freeze": ["usb-not-detected", "sound-not-working", "taskbar-freeze"],
    "gaming-reboot": ["overheat-shutdown", "no-display", "bsod-critical-process"],
    "no-display": ["gaming-reboot", "no-power", "bsod-critical-process"],
    "nvme-delay": ["auto-repair", "update-fail-loop", "sleep-resume-fail"],
    "usb-not-detected": ["wifi-disconnect", "sound-not-working", "printer-add-freeze"],
    "update-fail-loop": ["auto-repair", "startup-slow", "bsod-critical-process"],
    "startup-slow": ["taskbar-freeze", "update-fail-loop", "nvme-delay"],
    "taskbar-freeze": ["explorer-freeze", "startup-slow", "sound-not-working"],
    "wifi-disconnect": ["usb-not-detected", "sleep-resume-fail", "sound-not-working"],
    "overheat-shutdown": ["gaming-reboot", "no-power", "no-display"],
    "sound-not-working": ["usb-not-detected", "taskbar-freeze", "wifi-disconnect"],
    "sleep-resume-fail": ["wifi-disconnect", "auto-repair", "bsod-critical-process"],
    "no-power": ["overheat-shutdown", "no-display", "gaming-reboot"],
    "black-screen-after-login": ["no-display", "taskbar-freeze", "sleep-resume-fail"],
    "disk-usage-100": ["startup-slow", "nvme-delay", "update-fail-loop"],
    "bluetooth-not-found": ["usb-not-detected", "wifi-disconnect", "sleep-resume-fail"],
    "app-not-launching": ["explorer-freeze", "taskbar-freeze", "update-fail-loop"],
  };
  const detailOfficialLookup = {
    "black-screen-after-login": [
      { label: "Microsoft: Windows 검은 화면 문제 해결", href: "https://support.microsoft.com/en-us/windows/troubleshooting-blank-screens-in-windows-51ef7b96-47cb-b454-fcab-fac643784457" }
    ],
    "disk-usage-100": [
      { label: "Microsoft: Windows PC 성능 개선", href: "https://support.microsoft.com/windows/tips-to-improve-pc-performance-in-windows-b3b3ef5b-5953-fb6a-2528-4bbed82fba96" },
      { label: "Microsoft: Windows 드라이브 공간 확보", href: "https://support.microsoft.com/en-us/windows/free-up-drive-space-in-windows-85529ccb-c365-490d-b548-831022bc9b32" }
    ],
    "bluetooth-not-found": [
      { label: "Microsoft: Windows Bluetooth 문제 해결", href: "https://support.microsoft.com/en-us/windows/fix-bluetooth-problems-in-windows-723e092f-03fa-858b-5c80-131ec3fba75c" },
      { label: "Microsoft: Bluetooth 드라이버 업데이트", href: "https://support.microsoft.com/en-us/windows/update-bluetooth-drivers-in-windows-8dab0b80-1060-d1bc-6cc3-5b6a08a9fd33" }
    ],
    "app-not-launching": [
      { label: "Microsoft: Windows 앱 및 프로그램 복구", href: "https://support.microsoft.com/en-us/windows/repair-apps-and-programs-in-windows-e90eefe4-d0a2-7c1b-dd59-949a9030f317" },
      { label: "Microsoft: 프로그램 설치 및 제거 문제 해결", href: "https://support.microsoft.com/en-us/topic/fix-problems-that-block-programs-from-being-installed-or-removed-cca7d1b6-65a9-3d98-426b-e9f927e1eb4d" }
    ]
  };
  const renderQuickCodeButtons = (pageKey) => {
    const codes = quickCodeLookup[pageKey] || [];
    const items = codes.map((codeValue) => {
      const code = findErrorCode(codeValue);
      if (!code) return "";
      const kind = getErrorCodeKind(code);
      return `
        <div class="code-quick-item">
          <a class="code-quick-btn" href="${code.detailPage || code.link}">
            <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
            <strong>${code.code}</strong>
            <span>${code.title}</span>
          </a>
          <button class="button secondary code-copy-btn" type="button" data-copy-code="${code.code}">복사</button>
        </div>
      `;
    }).filter(Boolean).join("");
    if (!items) return "";
    return `
      <section class="section">
        <h3>자주 함께 보는 에러 코드</h3>
        <p class="copy-note">복사 버튼은 코드 문자열만 복사합니다. 상세 페이지로 바로 가려면 카드 제목을 눌러 주세요.</p>
        <div class="code-quick-grid">${items}</div>
      </section>
    `;
  };
  const renderCommandCards = (pageKey) => {
    const items = (detailCommandLookup[pageKey] || []).map((item) => `
      <article class="card command-card">
        <p class="eyebrow">${item.context || "윈도우 실행 중 · 관리자 권한 권장"}</p>
        <h4>${item.command}</h4>
        <p>${item.note}</p>
      </article>
    `).join("");
    if (!items) return "";
    return `
      <section class="section">
        <h3>명령어 예시</h3>
        <p class="muted">명령어를 실행하기 전에 중요한 파일을 백업하고 실행 환경과 관리자 권한을 확인하세요. Windows 복구 환경에서는 윈도우 드라이브 문자가 C:가 아닐 수 있으며, 실행 결과를 확인하지 않은 채 복구·삭제 명령을 연속으로 사용하지 마세요.</p>
        <div class="detail-grid">${items}</div>
      </section>
    `;
  };
  const renderSafeModeSection = (pageKey) => {
    const note = detailSafeModeLookup[pageKey];
    if (!note) return "";
    return `
      <section class="section">
        <h3>안전모드 확인</h3>
        <p>${note}</p>
      </section>
    `;
  };
  const renderRelatedGuideLinks = (pageKey) => {
    const related = (detailRelatedLookup[pageKey] || []).map((relatedKey) => {
      const symptom = (data.symptoms || []).find((item) => item.id === relatedKey);
      if (!symptom) return "";
      return `
        <a class="related-guide-link" href="${symptom.link}">
          <strong>${symptom.title}</strong>
          <span>${symptom.summary}</span>
        </a>
      `;
    }).filter(Boolean).join("");
    if (!related) return "";
    return `
      <section class="section">
        <h3>관련 글 링크</h3>
        <div class="related-guide-grid">${related}</div>
      </section>
    `;
  };
  const renderOfficialLinks = (pageKey) => {
    const links = (detailOfficialLookup[pageKey] || []).map((item) => `
      <a class="related-guide-link" href="${item.href}" target="_blank" rel="noopener noreferrer">
        <strong>${item.label}</strong>
        <span>현재 Windows 버전에 맞는 공식 절차를 새 창에서 확인합니다.</span>
      </a>
    `).join("");
    if (!links) return "";
    return `
      <section class="section">
        <h3>Microsoft 공식 자료</h3>
        <p class="muted">기능 이름과 메뉴 위치는 Windows 버전에 따라 달라질 수 있습니다.</p>
        <div class="related-guide-grid">${links}</div>
      </section>
    `;
  };
  const buildFaqJsonLd = (faqItems, pageUrl, title) => {
    if (!faqItems || !faqItems.length) return "";
    const mainEntity = faqItems.map((item) => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.a,
      },
    }));
    return `
      <script type="application/ld+json">
        ${JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": mainEntity,
          "url": `${data.siteUrl}/${pageUrl}`,
          "name": title,
        })}
      </script>
    `;
  };
  const renderSymptomDetailPage = (pageKey) => {
    const details = (data.symptomDetails && data.symptomDetails[pageKey]) || null;
    const symptom = (data.symptoms || []).find((item) => item.id === pageKey) || null;
    if (!details || !symptom) return null;
    const theme = detailThemeLookup[pageKey] || "default";
    const title = symptom.title;
    const summary = symptom.summary;
    const detailHeading = detailHeadingLookup[pageKey] || title;
    const warningTiles = (details.warnings || []).map((value, index) => `
      <div class="fact-card">
        <span class="example-index">${index + 1}</span>
        <strong>${value}</strong>
      </div>
    `).join("");
    const checkCards = (details.checks || []).map((item) => `
      <article class="card detail-step">
        <h3>${item.title}</h3>
        <p class="muted">${item.why}</p>
        <p>${item.how}</p>
      </article>
    `).join("");
    const deeperCards = (details.deeper || []).map((item) => `
      <article class="card detail-step">
        <h3>${item.heading}</h3>
        <p>${item.text}</p>
      </article>
    `).join("");
    const decisionCards = (details.decision || []).map((item) => `
      <article class="card detail-step">
        <h3>${item.heading}</h3>
        <p>${item.text}</p>
      </article>
    `).join("");
    const examples = (details.examples || []).map((value) => `<li>${value}</li>`).join("");
    const mistakes = (details.mistakes || []).map((value) => `<li>${value}</li>`).join("");
    const faq = (details.faq || []).map((item) => `
      <details class="faq-item">
        <summary>${item.q}</summary>
        <p>${item.a}</p>
      </details>
    `).join("");
    const firstCheck = (details.checks || [])[0] || {};
    const firstDecision = (details.decision || [])[0] || {};
    const firstDeeper = (details.deeper || [])[0] || {};
    const firstExample = (details.examples || [])[0] || "";
    const firstMistake = (details.mistakes || [])[0] || "";
    const firstFaq = (details.faq || [])[0] || {};
    const followupCardsHtml = [
      {
        title: "첫 점검을 이렇게 읽기",
        text: `${firstCheck.title || "가장 먼저 확인할 항목"}를 우선 보면 진단의 방향이 빨라집니다. ${firstCheck.why || ""} ${firstCheck.how || ""}처럼 바로 실행할 수 있는 확인부터 해두면, 소프트웨어와 하드웨어 중 어느 쪽에 더 무게를 둘지 정하기가 쉬워집니다.`
      },
      {
        title: "비슷한 증상과 나누는 기준",
        text: `${firstDecision.heading || "여기서 판단할 기준"}은 같은 문제처럼 보여도 해석이 달라질 수 있다는 뜻입니다. ${firstDecision.text || ""} ${firstDeeper.heading || "추가로 보는 포인트"}를 함께 붙이면 ${firstExample || "반복되는 사례"}가 단순한 우연인지, 반복 가능한 원인인지 더 잘 구분됩니다.`
      },
      {
        title: "해결이 늦어질 때",
        text: `${firstMistake || "자주 하는 실수"}를 피하면서도 증상이 이어진다면, ${firstFaq.q || "자주 묻는 질문"}에서 다루는 조건을 다시 확인해 보세요. 그래도 같은 현상이 반복되면 재설치보다 데이터 보호와 백업, 그리고 관련 장치나 설정의 교차 점검을 먼저 생각하는 편이 안전합니다.`
      }
    ].map((item) => `
      <article class="card detail-step">
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>
    `).join("");
    const layout = detailLayoutLookup[pageKey] || { checks: "grid", deeper: "grid" };
    const checksClass = layout.checks === "split" ? "detail-grid detail-grid--split" : layout.checks === "stack" ? "detail-stack" : "detail-grid";
    const deeperClass = layout.deeper === "split" ? "detail-grid detail-grid--split" : layout.deeper === "stack" ? "detail-stack" : "detail-grid";
    const sections = {
      intro: `
        <section class="section">
          <p class="eyebrow">${details.badge || "증상별 가이드"}</p>
          <h2>${detailHeading}</h2>
          <p class="lead">${summary}</p>
          <p class="detail-subtitle">${details.subtitle || ""}</p>
          ${renderParagraphs(details.intro)}
          <div class="takeaway-panel">
            <div>
              <span class="takeaway-label">핵심 요약</span>
              <strong>먼저 ${details.checks?.[0]?.title || "기본 연결과 최근 변경 사항"}부터 확인하세요.</strong>
            </div>
            <div class="takeaway-list">
              <span><b>가능성 높은 원인</b>${symptom.causes?.[0] || "최근 변경 또는 연결 상태"}</span>
              <span><b>첫 확인 항목</b>${symptom.checks?.[0] || "증상이 시작된 시점"}</span>
              <span><b>읽는 시간</b>약 ${getGuideReadTime(symptom)}분</span>
            </div>
          </div>
        </section>
      `,
      angle: detailAngleLookup[pageKey] ? `
        <section class="section">
          <h3>핵심 시선</h3>
          <p class="callout">${detailAngleLookup[pageKey]}</p>
        </section>
      ` : "",
      warnings: `
        <section class="section">
          <h3>이 증상에서 먼저 보이는 신호</h3>
          <div class="fact-grid">${warningTiles}</div>
        </section>
      `,
      codes: renderQuickCodeButtons(pageKey),
      checks: `
        <section class="section">
          <h3>먼저 확인할 것</h3>
          <div class="${checksClass}">${checkCards}</div>
        </section>
      `,
      decision: decisionCards ? `
        <section class="section">
          <h3>여기서 판단할 기준</h3>
          <div class="detail-grid">${decisionCards}</div>
        </section>
      ` : "",
      deeper: `
        <section class="section">
          <h3>같이 확인하면 좋은 부분</h3>
          <div class="${deeperClass}">${deeperCards}</div>
        </section>
      `,
      examples: `
        <section class="section">
          <h3>실제 확인 예시</h3>
          <p class="muted">${detailExampleLeadLookup[pageKey] || ""}</p>
          <ul class="mini-list">${examples}</ul>
        </section>
      `,
      mistakes: `
        <section class="section">
          <h3>자주 하는 실수</h3>
          <ul class="mini-list">${mistakes}</ul>
        </section>
      `,
      faq: `
        <section class="section">
          <h3>자주 묻는 질문</h3>
          <div class="faq-grid">${faq}</div>
        </section>
      `,
    };
    const order = detailFlowLookup[pageKey] || ["intro", "warnings", "codes", "checks", "deeper", "examples", "faq"];
    const safeModeSection = renderSafeModeSection(pageKey);
    const commandSection = renderCommandCards(pageKey);
    const relatedSection = renderRelatedGuideLinks(pageKey);
    const officialSection = renderOfficialLinks(pageKey);
    return `<div class="detail-page detail-page--${theme}">
      ${order.map((key) => sections[key] || "").join("")}
      ${sections.angle}
      ${safeModeSection}
      ${commandSection}
      <section class="section">
        <h3>실전 해석</h3>
        <div class="detail-grid">${followupCardsHtml}</div>
      </section>
      ${relatedSection}
      ${officialSection}
      <section class="section">
        <h3>다음 단계</h3>
        <p class="callout">증상만으로 끝내지 말고 진단 도구와 함께 확인하면 원인 범위를 더 빨리 좁힐 수 있습니다.</p>
        <div class="link-list">
          <a href="diagnostic.html">진단 도구 열기</a>
          <a href="guides.html">다른 증상 가이드 보기</a>
          <a href="${symptom.link}">이 페이지 다시 보기</a>
        </div>
      </section>
      ${buildFaqJsonLd(details.faq, symptom.link, title)}
    </div>`;
  };

  const renderBoardDetail = (part) => {
    const symptoms = (part.symptoms || []).map((name) => `<li>${name}</li>`).join("");
    const codes = (part.codes || []).map((code) => {
      const item = findErrorCode(code);
      return item
        ? `<a class="board-code" href="${item.detailPage || item.link}">${code}</a>`
        : `<span class="board-code">${code}</span>`;
    }).join("");
    const cases = (part.cases || []).map((item) => `<li>${item}</li>`).join("");
    const relatedLinks = (part.symptoms || []).map((name) => {
      const symptom = (data.symptoms || []).find((item) => item.title === name);
      return symptom ? `<a class="related-guide-link" href="${symptom.link}"><strong>${symptom.title}</strong><span>${symptom.summary}</span></a>` : "";
    }).filter(Boolean).join("");
    return `
      <article class="board-detail-card">
        <p class="eyebrow">인터랙티브 부품도</p>
        <h3>${part.label}</h3>
        <p class="lead">${part.summary}</p>
        <p class="board-note">${part.note}</p>
        <div class="board-chip-row">${codes}</div>
        <div class="board-detail-block">
          <h4>자주 연결되는 증상</h4>
          <ul class="mini-list">${symptoms}</ul>
        </div>
        ${cases ? `<div class="board-detail-block"><h4>대표 오류 사례</h4><ul class="mini-list">${cases}</ul></div>` : ""}
        <div class="board-detail-block">
          <h4>관련 글</h4>
          <div class="related-guide-grid">${relatedLinks}</div>
        </div>
      </article>
    `;
  };

  const renderBoardArtwork = () => `
    <div class="board-artwork">
      <img
        class="board-image"
        src="assets/diagnostic-pc-parts.jpg"
        width="1600"
        height="873"
        decoding="async"
        alt="CPU, RAM, GPU, M.2 SSD, SATA 포트, CMOS 배터리와 PSU가 표시된 데스크톱 PC 부품도"
      >
    </div>
  `;

  const renderBoardSection = () => {
    const parts = data.boardParts || [];
    if (!parts.length) return "";
    return `
      <section class="section board-section">
        <div class="guide-section-head">
          <div>
            <p class="eyebrow">부품도 진단</p>
            <h3>부품을 클릭하거나 마우스를 올리면 관련 오류가 보입니다</h3>
            <p>사진 같은 메인보드 디자인을 진단용 인터랙션으로 바꿔, CPU, RAM, GPU, PSU 같은 부품별로 관련 오류 코드와 블루스크린 증상을 바로 볼 수 있습니다.</p>
          </div>
          <div class="guide-section-nav">
            <a href="diagnostic.html">전체 진단 보기</a>
            <a href="guides.html">가이드 목록</a>
          </div>
        </div>
        <div class="board-lab">
          <div class="board-canvas" data-board-canvas>
            <div class="board-frame">
              <div class="board-glow"></div>
              <div class="board-board">
                ${renderBoardArtwork()}
                <div class="board-circuit board-circuit--one"></div>
                <div class="board-circuit board-circuit--two"></div>
                <div class="board-circuit board-circuit--three"></div>
                ${parts.map((part) => `
                  <button
                    type="button"
                    class="board-hotspot"
                    data-board-part
                    data-part-id="${part.id}"
                    style="--x:${part.position.x}%; --y:${part.position.y}%; --w:${part.hitbox?.w || 18}%; --h:${part.hitbox?.h || 18}%"
                    aria-label="${part.label}"
                  >
                    <span class="sr-only">${part.shortLabel || part.label}</span>
                  </button>
                `).join("")}
              </div>
            </div>
          </div>
          <aside class="board-detail" data-board-detail aria-live="polite"></aside>
        </div>
      </section>
    `;
  };

  let footers = Array.from(document.querySelectorAll(".site-footer"));
  if (!footers.length && document.body) {
    const footer = document.createElement("footer");
    footer.className = "site-footer";
    footer.innerHTML = `<p>© <span data-year></span> ${data.siteName || "PC 윈도우 진단 센터"}</p>`;
    document.body.appendChild(footer);
    footers = [footer];
  }
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });
    footers.forEach((footer) => {
      if (footer.querySelector(".footer-links")) return;
      const links = document.createElement("p");
      links.className = "footer-links";
      links.innerHTML = `
      <a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a> · <a href="contact.html">문의</a>
    `;
      footer.appendChild(links);
    });

  const symptomDetailRoot = document.querySelector("[data-symptom-detail-page]");
  if (symptomDetailRoot) {
    const detail = renderSymptomDetailPage(symptomDetailRoot.dataset.symptomDetailPage);
    if (detail) {
      symptomDetailRoot.innerHTML = detail;
    }
  }

  const detailRoot = document.querySelector("[data-error-code-page]");
  if (detailRoot) {
    const code = findErrorCode(detailRoot.dataset.errorCodePage);
    if (code) {
      const relatedSymptom = (data.symptoms || []).find((item) => item.link === code.relatedSymptom);
      const kind = getErrorCodeKind(code);
      const guidance = getErrorCodeGuidance(code);
      const diagnosticQuestions = [
        `${code.code}가 재부팅할 때마다 같은 작업에서 반복되는지 기록하세요.`,
        `${code.causes[0]}과 관련된 드라이버·장치·설정 변경이 직전에 있었는지 확인하세요.`,
        `${code.checks[0]} 전후로 증상이 달라지는지 비교하면 원인 범위를 더 빠르게 줄일 수 있습니다.`
      ];
      const isUpdateCode = /^0x(?:800|C190)/i.test(code.code);
      const officialLinks = isUpdateCode ? [
        { label: "Microsoft: Windows 업데이트 문제 해결", href: "https://support.microsoft.com/en-US/Windows/Deployment/Updates-Lifecycle/troubleshoot-problems-updating-windows" },
        { label: "Microsoft: Windows 도움말", href: "https://support.microsoft.com/windows/" }
      ] : [
        { label: "Microsoft Learn: 버그 검사 코드 참조", href: "https://learn.microsoft.com/windows-hardware/drivers/debugger/bug-check-code-reference2" },
        { label: "Microsoft: 블루스크린 오류 해결", href: "https://support.microsoft.com/en-US/windows/resolving-blue-screen-errors-in-windows-60b01860-58f2-be66-7516-5c45a66ae3c6" }
      ];
      detailRoot.innerHTML = `
        <p class="eyebrow">에러 코드 상세</p>
        <div class="code-heading">
          <span class="code-icon code-icon--${kind.className}">${getErrorCodeIcon(code)}</span>
          <h2>${code.code} · ${code.title}</h2>
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </div>
        <p class="lead">${code.summary}</p>
        <p class="key-cause"><strong>가장 가능성 높은 원인:</strong> ${code.causes[0]}</p>
        <section class="card error-context-card">
          <h3>이 코드를 어떻게 해석해야 하나요?</h3>
          <p>${guidance.interpretation}</p>
          <p><strong>먼저 기억할 점:</strong> 오류코드는 원인 후보를 좁히는 단서이며, 코드 하나만으로 고장 부품을 확정하지는 않습니다.</p>
        </section>
        <div class="detail-grid">
          <section class="card">
            <h3>가능성 높은 원인</h3>
            <ul class="mini-list">${code.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
          </section>
          <section class="card">
            <h3>첫 점검 항목</h3>
            <ol class="mini-list">${[...code.checks, ...getSupplementalChecks(code)].map((value) => `<li>${value}</li>`).join("")}</ol>
          </section>
        </div>
        <section class="card">
          <h3>재현 조건에서 기록할 단서</h3>
          <ul class="mini-list">${diagnosticQuestions.map((value) => `<li>${value}</li>`).join("")}</ul>
        </section>
        <section class="card caution-card">
          <h3>점검 전 주의</h3>
          <p>${guidance.caution}</p>
          <p>시스템 복원, 드라이버 제거, 디스크 복구 명령을 실행하기 전에는 중요한 파일을 다른 저장장치에 복사해 두는 것이 안전합니다.</p>
        </section>
        <section class="card screenshot-card">
          <h3>화면에서 확인할 내용</h3>
          <p class="muted">정지 코드, 오류 이름, 발생 직전 작업을 함께 기록하면 다음 점검에서 중요한 비교 자료가 됩니다.</p>
          <div class="error-screen error-screen--${kind.className}">
            <div class="error-screen-top">
              <span class="screen-dot"></span>
              <span class="screen-dot"></span>
              <span class="screen-dot"></span>
            </div>
            <div class="error-screen-body">
              <p class="error-screen-code">${code.code}</p>
              <p class="error-screen-title">${code.title}</p>
              <p class="error-screen-copy">${code.summary}</p>
            </div>
          </div>
          ${renderExampleTiles(code)}
        </section>
        <section class="card">
          <h3>그래도 해결되지 않을 때</h3>
          <p>${guidance.next}</p>
          <p>부팅 불가, 반복 재부팅, SMART 경고, 비정상적인 발열이 함께 나타나면 사용을 계속하기보다 제조사 서비스나 전문 점검을 고려하세요.</p>
        </section>
        <section class="card">
          <h3>관련 증상 진단</h3>
          <p>${relatedSymptom ? relatedSymptom.summary : "같은 계열 증상 진단으로 연결됩니다."}</p>
          <p><a href="${code.relatedSymptom || code.link}">연결된 증상 페이지 열기</a></p>
        </section>
        <section class="card">
          <h3>공식 자료로 다시 확인하기</h3>
          <p>Windows 버전과 업데이트 상태에 따라 안내가 달라질 수 있으므로, 아래 Microsoft 공식 자료와 현재 PC 제조사의 지원 문서를 함께 확인하세요.</p>
          <div class="link-list">${officialLinks.map((item) => `<a href="${item.href}" target="_blank" rel="noopener">${item.label}</a>`).join("")}</div>
        </section>
        <section class="card">
          <h3>바로 다른 코드 찾기</h3>
          <p><a href="diagnostic.html">진단 도구로 돌아가기</a></p>
        </section>
      `;
    }
  }

  const diagnosticRoot = document.querySelector("[data-diagnostic-root]");
  if (diagnosticRoot) {
    const symptomGroups = [
      { key: "all", label: "전체" },
      { key: "boot", label: "부팅" },
      { key: "power", label: "전원" },
      { key: "device", label: "장치" },
      { key: "performance", label: "성능" },
    ];
    const symptomGroupMap = {
      boot: new Set(["auto-repair", "bsod-critical-process", "update-fail-loop", "startup-slow"]),
      power: new Set(["gaming-reboot", "overheat-shutdown", "sleep-resume-fail", "no-power"]),
      device: new Set(["printer-add-freeze", "no-display", "nvme-delay", "usb-not-detected", "wifi-disconnect", "sound-not-working", "bluetooth-not-found"]),
      performance: new Set(["explorer-freeze", "taskbar-freeze", "disk-usage-100", "app-not-launching", "black-screen-after-login"]),
    };
    let selectedSymptomGroup = "all";
    let selectedSymptomId = "";
    const symptomMatchesGroup = (item, group) => group === "all" || symptomGroupMap[group]?.has(item.id);
    const renderSymptomCard = (item) => `
      <button class="diag-card${item.id === selectedSymptomId ? " active" : ""}" data-symptom="${item.id}">
        <span class="diag-title">${item.title}</span>
        <span class="diag-summary">${item.summary}</span>
      </button>
    `;

    diagnosticRoot.innerHTML = `
      <div class="diagnostic-mode-tabs" role="tablist" aria-label="진단 방법 선택">
        <button type="button" class="diagnostic-mode-tab active" role="tab" aria-selected="true" aria-controls="diagnostic-symptom" data-diagnostic-mode="symptom"><strong>증상</strong><span>보이는 문제로 찾기</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-code" data-diagnostic-mode="code"><strong>오류 코드</strong><span>코드 직접 입력</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-parts" data-diagnostic-mode="parts"><strong>PC 부품</strong><span>이미지에서 선택</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-log" data-diagnostic-mode="log"><strong>로그 분석</strong><span>고급 진단</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-event" data-diagnostic-mode="event"><strong>이벤트 뷰어</strong><span>ID·원본으로 찾기</span></button>
      </div>

      <section id="diagnostic-symptom" class="diagnostic-mode-panel" role="tabpanel" data-diagnostic-panel="symptom">
        <div class="diagnostic-panel-head">
          <div>
            <p class="eyebrow">증상으로 찾기</p>
            <h3>현재 화면과 가장 가까운 증상을 선택하세요</h3>
            <p>증상 이름을 검색하거나 분야를 고르면 원인 후보와 첫 점검 순서를 보여줍니다.</p>
          </div>
        </div>
        <div class="symptom-toolbar">
          <label class="sr-only" for="symptom-search-input">증상 검색</label>
          <input id="symptom-search-input" class="code-input" type="search" placeholder="예: 검은 화면, 재부팅, USB" autocomplete="off" data-symptom-search>
          <div class="symptom-group-filters" aria-label="증상 분야 선택">
            ${symptomGroups.map((group) => `<button type="button" class="symptom-group-filter${group.key === "all" ? " active" : ""}" data-symptom-group="${group.key}">${group.label}</button>`).join("")}
          </div>
        </div>
        <div class="symptom-result-meta"><span data-symptom-count>${data.symptoms.length}개 증상</span></div>
        <div class="symptom-diagnosis-layout">
          <div class="diag-grid" data-symptom-grid>${data.symptoms.map(renderSymptomCard).join("")}</div>
          <aside class="result-panel" aria-live="polite">
            <h3>진단 결과</h3>
            <p class="muted">증상을 선택하면 가능한 원인과 점검 순서가 표시됩니다.</p>
            <div class="result-box" data-result-box>
              <p>현재 겪는 문제와 가장 가까운 증상을 선택해 주세요.</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="diagnostic-code" class="diagnostic-mode-panel code-panel" role="tabpanel" data-diagnostic-panel="code" hidden>
        <div class="code-panel-head">
          <div><p class="eyebrow">오류 코드 입력</p><h3>코드를 넣으면 흔한 원인을 바로 보여줍니다</h3></div>
          <p class="muted">예: 0xC000021A, 0x0000007B, 0x80070002</p>
        </div>
        <div class="code-quick-strip">
          <p class="code-quick-label">자주 보는 코드</p>
          <p class="copy-note">복사 버튼은 코드만 복사하고, 카드 자체를 누르면 상세 안내로 이동합니다.</p>
          <div class="code-quick-inline">
            ${["0xc000021a", "0x0000007b", "0x80070002", "0x00000133", "0x80070005"].map((value) => {
              const code = findErrorCode(value);
              if (!code) return "";
              const kind = getErrorCodeKind(code);
              return `
                <div class="code-quick-item">
                  <a class="code-quick-pill" href="${code.detailPage || code.link}">
                    <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
                    <strong>${code.code}</strong>
                  </a>
                  <button class="button secondary code-copy-btn" type="button" data-copy-code="${code.code}">복사</button>
                </div>
              `;
            }).join("")}
          </div>
        </div>
        ${renderKindFilters()}
        <div class="code-search">
          <label class="sr-only" for="error-code-input">에러 코드</label>
          <input id="error-code-input" class="code-input" type="text" placeholder="에러 코드 입력" inputmode="text" autocomplete="off">
          <div class="code-actions">
            <button class="button primary code-button" type="button" data-code-search>확인</button>
            <button class="button secondary code-button" type="button" data-code-clear>지우기</button>
          </div>
        </div>
        <div class="code-suggestions" data-code-suggestions hidden></div>
        <div class="code-history" data-code-history hidden></div>
        <div class="code-result result-box" data-code-result>
          <p>코드를 입력하면 관련 원인과 첫 점검 항목이 표시됩니다.</p>
        </div>
      </section>

      <section id="diagnostic-parts" class="diagnostic-mode-panel" role="tabpanel" data-diagnostic-panel="parts" hidden>
        <div class="diagnostic-panel-head">
          <div><p class="eyebrow">PC 부품으로 찾기</p><h3>이미지의 부품명을 선택해 관련 증상과 오류를 확인하세요</h3><p>CPU, RAM, GPU, 전원 커넥터, 저장장치 라벨에 마우스를 올리거나 클릭할 수 있습니다.</p></div>
        </div>
        <div class="board-preview-shell" data-board-root></div>
      </section>

      <section id="diagnostic-log" class="diagnostic-mode-panel log-panel" role="tabpanel" data-diagnostic-panel="log" hidden>
        <div class="code-panel-head">
          <div>
            <p class="eyebrow">하드웨어 정보 로그</p>
            <h3>로그 파일을 올리거나 붙여넣으면 핵심 정보를 읽어줍니다</h3>
          </div>
          <p class="muted">예: dxdiag, msinfo32, CrystalDiskInfo, HWiNFO 텍스트</p>
        </div>
        <p class="log-privacy-note"><strong>브라우저 내 처리</strong> 파일과 입력 내용은 서버로 전송되지 않습니다.</p>
        <div class="log-format-badges"><span>HWiNFO</span><span>dxdiag</span><span>msinfo32</span><span>CrystalDiskInfo</span><span>TXT / LOG</span></div>
        <div class="log-panel-grid">
          <div class="log-panel-inputs">
            <label class="sr-only" for="hardware-log-input">하드웨어 로그</label>
            <textarea id="hardware-log-input" class="code-input log-input" rows="10" placeholder="하드웨어 정보 로그를 붙여넣거나 파일을 선택하세요."></textarea>
            <div class="log-actions">
              <button class="button primary code-button" type="button" data-log-analyze>분석</button>
              <button class="button secondary code-button" type="button" data-log-clear>지우기</button>
              <label class="button secondary log-file-button">
                파일 불러오기
                <input type="file" accept=".txt,.log,text/plain" data-log-file>
              </label>
            </div>
            <div class="log-drop" data-log-drop>파일을 끌어다 놓아도 됩니다</div>
          </div>
          <div class="result-box log-result" data-log-result>
            <p>로그를 넣으면 시스템 정보와 주의 신호가 표시됩니다.</p>
          </div>
        </div>
      </section>

      <section id="diagnostic-event" class="diagnostic-mode-panel event-panel" role="tabpanel" data-diagnostic-panel="event" hidden>
        <div class="code-panel-head">
          <div><p class="eyebrow">Windows 이벤트 뷰어</p><h3>이벤트 ID와 발생 상황을 함께 해석하세요</h3></div>
          <p class="muted"><a href="event-viewer-guide.html">이벤트 확인·복사 방법</a></p>
        </div>
        <p class="log-privacy-note"><strong>브라우저 내 처리</strong> 입력 내용은 전송되지 않으며 사용자명, 컴퓨터 이름과 사용자 경로는 결과에서 자동으로 가립니다.</p>
        <form class="event-form" data-event-form>
          <div class="event-fields">
            <label><span>이벤트 ID</span><input class="code-input" type="text" inputmode="numeric" placeholder="예: 41, 1000, 129" data-event-id></label>
            <label><span>원본</span><input class="code-input" type="text" list="event-source-list" placeholder="예: Kernel-Power" data-event-source></label>
            <datalist id="event-source-list">${[...new Set((data.eventViewerCodes || []).map((item) => item.source))].map((source) => `<option value="${source}"></option>`).join("")}</datalist>
            <label><span>수준</span><select class="code-input" data-event-level><option value="">선택 안 함</option><option>오류</option><option>경고</option><option>정보</option><option>치명적</option></select></label>
            <label><span>발생 시각</span><input class="code-input" type="datetime-local" data-event-time></label>
            <label><span>반복 횟수</span><input class="code-input" type="number" min="1" max="9999" value="1" data-event-repeat></label>
          </div>
          <label class="event-description-label"><span>일반 탭 설명, 이벤트 XML 또는 Get-WinEvent 결과</span><textarea class="code-input event-input" rows="10" placeholder="이벤트 속성의 일반 탭 또는 XML 내용을 붙여넣으세요. 여러 이벤트가 들어 있는 TXT·LOG 파일도 읽을 수 있습니다." data-event-text></textarea></label>
          <div class="log-actions">
            <button class="button primary code-button" type="submit">이벤트 분석</button>
            <button class="button secondary code-button" type="button" data-event-clear>지우기</button>
            <label class="button secondary log-file-button">TXT·LOG·XML 불러오기<input type="file" accept=".txt,.log,.xml,text/plain,text/xml,application/xml" data-event-file></label>
          </div>
        </form>
        <div class="event-result-shell" aria-live="polite" data-event-result><p>이벤트 ID만 입력해도 검색할 수 있습니다. 원본과 설명을 함께 넣으면 같은 ID의 다른 의미를 구분하기 쉽습니다.</p></div>
      </section>
    `;

    const codeInput = diagnosticRoot.querySelector("#error-code-input");
    const modeButtons = Array.from(diagnosticRoot.querySelectorAll("[data-diagnostic-mode]"));
    const modePanels = Array.from(diagnosticRoot.querySelectorAll("[data-diagnostic-panel]"));
    const symptomSearchInput = diagnosticRoot.querySelector("[data-symptom-search]");
    const symptomGrid = diagnosticRoot.querySelector("[data-symptom-grid]");
    const symptomCount = diagnosticRoot.querySelector("[data-symptom-count]");
    const logInput = diagnosticRoot.querySelector("#hardware-log-input");
    const logResult = diagnosticRoot.querySelector("[data-log-result]");
    const logFileInput = diagnosticRoot.querySelector("[data-log-file]");
    const logDrop = diagnosticRoot.querySelector("[data-log-drop]");
    const suggestionsBox = diagnosticRoot.querySelector("[data-code-suggestions]");
    const historyBox = diagnosticRoot.querySelector("[data-code-history]");
    const codeResult = diagnosticRoot.querySelector("[data-code-result]");
    const eventForm = diagnosticRoot.querySelector("[data-event-form]");
    const eventIdInput = diagnosticRoot.querySelector("[data-event-id]");
    const eventSourceInput = diagnosticRoot.querySelector("[data-event-source]");
    const eventLevelInput = diagnosticRoot.querySelector("[data-event-level]");
    const eventTimeInput = diagnosticRoot.querySelector("[data-event-time]");
    const eventRepeatInput = diagnosticRoot.querySelector("[data-event-repeat]");
    const eventTextInput = diagnosticRoot.querySelector("[data-event-text]");
    const eventFileInput = diagnosticRoot.querySelector("[data-event-file]");
    const eventResult = diagnosticRoot.querySelector("[data-event-result]");
    const activateDiagnosticMode = (mode) => {
      modeButtons.forEach((button) => {
        const active = button.dataset.diagnosticMode === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active ? 0 : -1;
      });
      modePanels.forEach((panel) => {
        panel.hidden = panel.dataset.diagnosticPanel !== mode;
      });
    };
    const renderSymptomList = () => {
      const query = (symptomSearchInput?.value || "").trim().toLowerCase();
      const visible = data.symptoms.filter((item) => {
        if (!symptomMatchesGroup(item, selectedSymptomGroup)) return false;
        if (!query) return true;
        const text = [item.title, item.summary, ...(item.causes || []), ...(item.checks || [])].join(" ").toLowerCase();
        return text.includes(query);
      });
      symptomGrid.innerHTML = visible.length
        ? visible.map(renderSymptomCard).join("")
        : `<div class="diagnostic-empty"><strong>일치하는 증상이 없습니다.</strong><p>다른 증상 이름이나 오류 코드를 입력해 보세요.</p></div>`;
      symptomCount.textContent = `${visible.length}개 증상`;
      diagnosticRoot.querySelectorAll("[data-symptom-group]").forEach((button) => {
        button.classList.toggle("active", button.dataset.symptomGroup === selectedSymptomGroup);
      });
    };
    diagnosticRoot.addEventListener("click", (event) => {
      const modeButton = event.target.closest("[data-diagnostic-mode]");
      if (modeButton) {
        activateDiagnosticMode(modeButton.dataset.diagnosticMode);
        return;
      }
      const groupButton = event.target.closest("[data-symptom-group]");
      if (groupButton) {
        selectedSymptomGroup = groupButton.dataset.symptomGroup;
        renderSymptomList();
      }
    });
    modeButtons.forEach((button, index) => {
      button.addEventListener("keydown", (event) => {
        if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
        event.preventDefault();
        const offset = event.key === 'ArrowRight' ? 1 : -1;
        const next = modeButtons[(index + offset + modeButtons.length) % modeButtons.length];
        activateDiagnosticMode(next.dataset.diagnosticMode);
        next.focus();
      });
    });
    symptomSearchInput.addEventListener("input", renderSymptomList);
    const renderRecentHistory = () => {
      const recent = readRecentCodes();
      if (!recent.length) {
        historyBox.hidden = true;
        historyBox.innerHTML = "";
        return;
      }
      historyBox.innerHTML = `
        <div class="history-head">
          <span class="eyebrow">최근 검색</span>
          <button type="button" class="history-clear" data-history-clear>비우기</button>
        </div>
        <div class="history-list">
          ${recent.map((value) => `
            <button type="button" class="history-item" data-code-value="${value}">${value}</button>
          `).join("")}
        </div>
      `;
      historyBox.hidden = false;
    };
    const renderCodeResult = (rawValue) => {
      const code = findErrorCode(rawValue);
      if (!code) {
        codeResult.innerHTML = `
          <p><strong>일치하는 코드가 없습니다.</strong></p>
          <p class="muted">입력 형식을 다시 확인하거나 증상 선택 진단을 이용해 주세요.</p>
        `;
        return;
      }

      writeRecentCodes(code.code);
      renderRecentHistory();
      const kind = getErrorCodeKind(code);
      codeResult.innerHTML = `
        <div class="code-result-head">
          <span class="code-icon code-icon--${kind.className}">${getErrorCodeIcon(code)}</span>
          <h4>${code.code} · ${code.title}</h4>
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </div>
        <p>${code.summary}</p>
        <p class="key-cause"><strong>가장 가능성 높은 원인:</strong> ${code.causes[0]}</p>
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${code.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>첫 점검 항목</strong></p>
        <ol>${[...code.checks, ...getSupplementalChecks(code)].map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${code.detailPage || code.link}">연결된 상세 가이드 열기</a></p>
      `;
    };
    const clearSearch = () => {
      codeInput.value = "";
      suggestionsBox.hidden = true;
      suggestionsBox.innerHTML = "";
      codeResult.innerHTML = `<p>코드를 입력하면 관련 원인과 첫 점검 항목이 표시됩니다.</p>`;
    };
    const renderHardwareLog = (value) => {
      const report = analyzeHardwareLog(value);
      logResult.innerHTML = renderLogAnalysis(report);
    };
    const clearHardwareLog = () => {
      logInput.value = "";
      currentHardwareLogMeta = null;
      renderHardwareLog("");
    };
    const analyzeEventViewer = () => {
      const fields = extractEventViewerFields(eventTextInput.value);
      const id = String(eventIdInput.value || fields.id || "").trim();
      const source = String(eventSourceInput.value || fields.source || "").trim();
      const repeatCount = Math.max(1, Number(eventRepeatInput.value || 1), Number(fields.recordCount || 1));
      if (!eventIdInput.value && fields.id) eventIdInput.value = fields.id;
      if (!eventSourceInput.value && fields.source) eventSourceInput.value = fields.source;
      if (!eventLevelInput.value && fields.level) {
        const levelMap = { "1": "치명적", "2": "오류", "3": "경고", "4": "정보", critical: "치명적", error: "오류", warning: "경고", information: "정보" };
        eventLevelInput.value = levelMap[String(fields.level).toLowerCase()] || "";
      }
      if (!eventTimeInput.value && fields.time) {
        const parsedTime = new Date(fields.time);
        if (!Number.isNaN(parsedTime.getTime())) eventTimeInput.value = new Date(parsedTime.getTime() - parsedTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }
      const matches = findEventViewerEntries({ id, source });
      const fallbackMatches = matches.length ? matches : findEventViewerEntries({ id, source: "" });
      if (!id) {
        eventResult.innerHTML = `<div class="event-empty"><strong>이벤트 ID를 확인할 수 없습니다.</strong><p>ID를 입력하거나 이벤트 속성의 일반 탭·XML 전체를 붙여넣어 주세요.</p></div>`;
        return;
      }
      eventResult.innerHTML = fallbackMatches.length > 1 && !source
        ? `<div class="event-match-note"><strong>같은 ID의 원본이 여러 개일 수 있습니다.</strong><p>현재 데이터에서 ${fallbackMatches.length}개 후보를 찾았습니다. 정확한 원본을 입력하면 결과를 좁힐 수 있습니다.</p></div>${fallbackMatches.map((entry) => renderEventViewerResult({ entry, fields, repeatCount, selectedLevel: eventLevelInput.value })).join("")}`
        : renderEventViewerResult({ entry: fallbackMatches[0], fields, repeatCount, selectedLevel: eventLevelInput.value });
    };
    const clearEventViewer = () => {
      eventForm.reset();
      eventRepeatInput.value = "1";
      eventResult.innerHTML = `<p>이벤트 ID만 입력해도 검색할 수 있습니다. 원본과 설명을 함께 넣으면 같은 ID의 다른 의미를 구분하기 쉽습니다.</p>`;
    };
    const renderSuggestions = (rawValue) => {
      const matches = getErrorCodeMatches(rawValue);
      if (!matches.length) {
        suggestionsBox.hidden = true;
        suggestionsBox.innerHTML = "";
        return;
      }
      suggestionsBox.innerHTML = matches.map((item) => `
        <button type="button" class="suggestion-item" data-code-value="${item.code}">
          <span class="code-icon code-icon--${getErrorCodeKind(item).className}">${getErrorCodeIcon(item)}</span>
          <strong>${getErrorCodeLabel(item)}</strong>
          <span class="suggestion-meta">
            <span class="code-chip code-chip--${getErrorCodeKind(item).className}">${getErrorCodeKind(item).label}</span>
            <span>${item.title}</span>
          </span>
        </button>
      `).join("");
      suggestionsBox.hidden = false;
    };
    const refreshKindFilters = () => {
      diagnosticRoot.querySelector("[data-kind-filters]").innerHTML = kindFilters.map((kind) => `
        <button type="button" class="kind-filter${kind.key === selectedErrorKind ? " active" : ""}" data-kind-key="${kind.key}">
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </button>
      `).join("");
    };

    diagnosticRoot.querySelector("[data-code-search]").addEventListener("click", () => {
      renderCodeResult(codeInput.value);
    });
    diagnosticRoot.querySelector("[data-code-clear]").addEventListener("click", clearSearch);
    diagnosticRoot.querySelector("[data-log-analyze]").addEventListener("click", () => {
      renderHardwareLog(logInput.value);
    });
    diagnosticRoot.querySelector("[data-log-clear]").addEventListener("click", clearHardwareLog);
    eventForm.addEventListener("submit", (event) => {
      event.preventDefault();
      analyzeEventViewer();
    });
    diagnosticRoot.querySelector("[data-event-clear]").addEventListener("click", clearEventViewer);
    eventFileInput.addEventListener("change", async () => {
      const file = eventFileInput.files && eventFileInput.files[0];
      if (!file) return;
      eventTextInput.value = await file.text();
      analyzeEventViewer();
    });

    codeInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        renderCodeResult(codeInput.value);
        suggestionsBox.hidden = true;
      }
      if (event.key === "Escape") {
        suggestionsBox.hidden = true;
      }
    });
    codeInput.addEventListener("input", () => {
      renderSuggestions(codeInput.value);
    });
    codeInput.addEventListener("focus", () => {
      renderSuggestions(codeInput.value);
    });
    logInput.addEventListener("input", () => {
      currentHardwareLogMeta = null;
      renderHardwareLog(logInput.value);
    });
    logFileInput.addEventListener("change", async () => {
      const file = logFileInput.files && logFileInput.files[0];
      if (!file) return;
      currentHardwareLogMeta = { name: file.name, size: file.size, type: file.type };
      const text = await file.text();
      logInput.value = text;
      renderHardwareLog(text);
    });
    logDrop.addEventListener("dragover", (event) => {
      event.preventDefault();
      logDrop.classList.add("dragover");
    });
    logDrop.addEventListener("dragleave", () => {
      logDrop.classList.remove("dragover");
    });
    logDrop.addEventListener("drop", async (event) => {
      event.preventDefault();
      logDrop.classList.remove("dragover");
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (!file) return;
      currentHardwareLogMeta = { name: file.name, size: file.size, type: file.type };
      const text = await file.text();
      logInput.value = text;
      renderHardwareLog(text);
    });

    suggestionsBox.addEventListener("click", (event) => {
      const item = event.target.closest("[data-code-value]");
      if (!item) return;
      codeInput.value = item.dataset.codeValue;
      suggestionsBox.hidden = true;
      renderCodeResult(codeInput.value);
    });
    historyBox.addEventListener("click", (event) => {
      const item = event.target.closest("[data-code-value]");
      if (item) {
        codeInput.value = item.dataset.codeValue;
        suggestionsBox.hidden = true;
        renderCodeResult(codeInput.value);
        return;
      }
      if (event.target.closest("[data-history-clear]")) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          // Ignore storage failures.
        }
        renderRecentHistory();
      }
    });

    diagnosticRoot.addEventListener("click", (event) => {
      const kindBtn = event.target.closest("[data-kind-key]");
      if (!kindBtn) return;
      selectedErrorKind = kindBtn.dataset.kindKey;
      refreshKindFilters();
      renderSuggestions(codeInput.value);
    });

    diagnosticRoot.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-symptom]");
      if (!btn) return;
      const symptom = data.symptoms.find((item) => item.id === btn.dataset.symptom);
      if (!symptom) return;
      selectedSymptomId = symptom.id;
      const box = diagnosticRoot.querySelector("[data-result-box]");
      box.innerHTML = `
        <h4>${symptom.title}</h4>
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${symptom.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>권장 점검 순서</strong></p>
        <ol>${symptom.checks.map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${symptom.link}">자세한 가이드 열기</a></p>
      `;
      diagnosticRoot.querySelectorAll(".diag-card").forEach((card) => card.classList.toggle("active", card.dataset.symptom === symptom.id));
    });

    renderRecentHistory();
    renderHardwareLog("");
    if (window.location.hash === "#diagnostic-event") {
      activateDiagnosticMode("event");
    }
  }

  const boardRoot = document.querySelector("[data-board-root]");
  if (boardRoot) {
    const parts = data.boardParts || [];
    if (parts.length) {
      boardRoot.innerHTML = renderBoardSection();
      const detailEl = boardRoot.querySelector("[data-board-detail]");
      const buttons = Array.from(boardRoot.querySelectorAll("[data-board-part]"));
      const findPart = (partId) => parts.find((item) => item.id === partId) || parts[0];
      const setPart = (part) => {
        if (!detailEl || !part) return;
        detailEl.innerHTML = renderBoardDetail(part);
        buttons.forEach((button) => button.classList.toggle("active", button.dataset.partId === part.id));
      };
      buttons.forEach((button) => {
        const part = findPart(button.dataset.partId);
        if (!part) return;
        button.addEventListener("mouseenter", () => setPart(part));
        button.addEventListener("focus", () => setPart(part));
        button.addEventListener("click", () => setPart(part));
      });
      setPart(parts[0]);
    }
  }

  document.addEventListener("click", async (event) => {
    const copyButton = event.target.closest("[data-copy-code]");
    if (!copyButton) return;
    const code = copyButton.dataset.copyCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      const previous = copyButton.textContent;
      copyButton.textContent = "복사됨";
      copyButton.classList.add("is-copied");
      window.setTimeout(() => {
        copyButton.textContent = previous;
        copyButton.classList.remove("is-copied");
      }, 1200);
    } catch {
      copyButton.textContent = "복사 실패";
      window.setTimeout(() => {
        copyButton.textContent = "복사";
      }, 1200);
    }
  });

  const guidesRoot = document.querySelector("[data-guides-root]");
  if (guidesRoot) {
    const guideSearchInput = document.querySelector("[data-guide-search]");
    const powerGuideIds = new Set([
      "auto-repair", "gaming-reboot", "no-display", "overheat-shutdown",
      "sleep-resume-fail", "no-power", "startup-slow"
    ]);
    const featuredGuideIds = ["black-screen-after-login", "auto-repair", "disk-usage-100"];
    const popularCodeValues = [
      "0xC000000F", "0x000000EF", "0x00000124", "0x0000009F",
      "0x00000116", "0x0000007A", "0x80070005", "0x800F0922"
    ];
    let guideSearchQuery = "";
    const escapeGuideText = (value) => String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
    const matchesGuideKind = (item, kind) => {
      if (kind === "all") return true;
      if (kind === "power") return powerGuideIds.has(item.id);
      return getGuideKind(item) === kind;
    };
    const matchesGuideSearch = (item, query) => {
      if (!query) return true;
      const text = [item.title, item.summary, ...(item.causes || []), ...(item.checks || [])].join(" ").toLowerCase();
      return text.includes(query);
    };
    const matchesCodeSearch = (item, query) => {
      if (!query) return false;
      const text = [item.code, item.title, item.summary, ...(item.causes || []), ...(item.aliases || [])].join(" ").toLowerCase();
      return text.includes(query);
    };
    const renderGuideCard = (item, featured = false) => `
      <a class="guide-card-link${featured ? " guide-card-link--featured" : ""}" href="${item.link}">
        <article class="guide-card guide-card--simple">
          <div class="guide-card-meta">
            <span class="guide-type">${getGuideKind(item) === "hardware" ? "하드웨어" : "Windows"}</span>
            <span>약 ${getGuideReadTime(item)}분</span>
          </div>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <p class="guide-first-check"><strong>첫 점검</strong>${item.checks[0]}</p>
          <span class="guide-card-cta">가이드 열기 <span aria-hidden="true">→</span></span>
        </article>
      </a>
    `;
    const renderGuides = () => {
      const guideKinds = [
        { key: "all", label: "전체 가이드" },
        { key: "windows", label: "Windows" },
        { key: "hardware", label: "하드웨어 문제" },
        { key: "power", label: "전원·부팅" },
      ];
      const query = guideSearchQuery.trim().toLowerCase();
      const safeQuery = escapeGuideText(guideSearchQuery.trim());
      const visibleSymptoms = data.symptoms.filter((item) => matchesGuideKind(item, selectedGuideKind) && matchesGuideSearch(item, query));
      const featuredGuides = featuredGuideIds.map((id) => data.symptoms.find((item) => item.id === id)).filter(Boolean);
      const visibleCodes = query
        ? (data.errorCodes || []).filter((item) => matchesCodeSearch(item, query)).slice(0, 8)
        : popularCodeValues.map((value) => findErrorCode(value)).filter(Boolean);
      const codeLinks = visibleCodes.map((item) => {
        const kind = getErrorCodeKind(item);
        return `
          <a class="code-index-item" href="${item.detailPage || item.link}">
            <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
            <strong>${item.code}</strong>
            <span>${item.title}</span>
          </a>
        `;
      }).join("");
      guidesRoot.innerHTML = `
        <div class="guide-layout">
          <section class="guide-section guide-section--filters" aria-label="가이드 분류">
            <div class="guide-kind-filters" aria-label="가이드 분야 선택">
              ${guideKinds.map((kind) => `
                <button type="button" class="guide-kind-filter${kind.key === selectedGuideKind ? " active" : ""}" data-guide-kind="${kind.key}">${kind.label}<span>${data.symptoms.filter((item) => matchesGuideKind(item, kind.key)).length}</span></button>
              `).join("")}
            </div>
          </section>

          ${!query && selectedGuideKind === "all" ? `
            <section class="guide-section guide-featured-section">
              <div class="guide-section-head"><div><p class="eyebrow">추천 가이드</p><h3>먼저 확인하기 좋은 문제</h3></div></div>
              <div class="guide-featured-grid">${featuredGuides.map((item) => renderGuideCard(item, true)).join("")}</div>
            </section>
          ` : ""}

          <section class="guide-section" id="guide-symptoms">
            <div class="guide-section-head">
              <div>
                <p class="eyebrow">전체 가이드</p>
                <h3>${query ? `“${safeQuery}” 검색 결과` : "증상에 맞는 가이드를 선택하세요"}</h3>
              </div>
              <span class="guide-result-count">${visibleSymptoms.length}개 가이드</span>
            </div>
            ${visibleSymptoms.length
              ? `<div class="guide-clean-grid">${visibleSymptoms.map((item) => renderGuideCard(item)).join("")}</div>`
              : `<div class="guide-empty"><strong>일치하는 증상 가이드가 없습니다.</strong><p>다른 증상 이름이나 오류 코드를 입력해 보세요.</p></div>`}
          </section>

          <section class="guide-section guide-section--codes" id="guide-codes">
            <div class="guide-section-head">
              <div><p class="eyebrow">에러 코드</p><h3>${query ? "함께 검색된 오류 코드" : "자주 찾는 오류 코드"}</h3></div>
              <a class="guide-code-more" href="diagnostic.html">진단 도구에서 전체 코드 검색</a>
            </div>
            ${codeLinks ? `<div class="code-index-grid">${codeLinks}</div>` : `<p class="muted">일치하는 오류 코드가 없습니다.</p>`}
          </section>
        </div>
      `;
    };
    renderGuides();
    guidesRoot.addEventListener("click", (event) => {
      const guideKindBtn = event.target.closest("[data-guide-kind]");
      if (guideKindBtn) {
        selectedGuideKind = guideKindBtn.dataset.guideKind;
        renderGuides();
      }
    });
    if (guideSearchInput) {
      guideSearchInput.addEventListener("input", () => {
        guideSearchQuery = guideSearchInput.value;
        renderGuides();
      });
    }
  }
})();
