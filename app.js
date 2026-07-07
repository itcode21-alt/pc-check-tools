(() => {
  const data = window.SITE_DATA || { symptoms: [] };
  const storageKey = "pc_recent_error_codes";
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
    if (code.startsWith("0x0000007B") || code.startsWith("0x0000003A") || code.startsWith("0x00000133") || code.startsWith("0x80070570")) return { label: "저장장치", className: "storage" };
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

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const detailRoot = document.querySelector("[data-error-code-page]");
  if (detailRoot) {
    const code = findErrorCode(detailRoot.dataset.errorCodePage);
    if (code) {
      const relatedSymptom = (data.symptoms || []).find((item) => item.link === code.relatedSymptom);
      const kind = getErrorCodeKind(code);
      detailRoot.innerHTML = `
        <p class="eyebrow">에러 코드 상세</p>
        <div class="code-heading">
          <span class="code-icon code-icon--${kind.className}">${getErrorCodeIcon(code)}</span>
          <h2>${code.code} · ${code.title}</h2>
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </div>
        <p class="lead">${code.summary}</p>
        <p class="key-cause"><strong>가장 가능성 높은 원인:</strong> ${code.causes[0]}</p>
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
        <section class="card screenshot-card">
          <h3>화면 예시</h3>
          <p class="muted">실제 캡처 대신, 자주 보이는 상황을 한눈에 보기 쉽게 정리했습니다.</p>
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
          <h3>관련 증상 진단</h3>
          <p>${relatedSymptom ? relatedSymptom.summary : "같은 계열 증상 진단으로 연결됩니다."}</p>
          <p><a href="${code.relatedSymptom || code.link}">연결된 증상 페이지 열기</a></p>
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
    const cards = data.symptoms.map((item) => `
      <button class="diag-card" data-symptom="${item.id}">
        <span class="diag-title">${item.title}</span>
        <span class="diag-summary">${item.summary}</span>
      </button>
    `).join("");

    diagnosticRoot.innerHTML = `
      <section class="code-panel">
        <div class="code-panel-head">
          <div>
            <p class="eyebrow">에러 코드 입력</p>
            <h3>코드를 넣으면 흔한 원인을 바로 보여줍니다</h3>
          </div>
          <p class="muted">예: 0xC000021A, 0x0000007B, 0x80070002</p>
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
      <section class="log-panel">
        <div class="code-panel-head">
          <div>
            <p class="eyebrow">하드웨어 정보 로그</p>
            <h3>로그 파일을 올리거나 붙여넣으면 핵심 정보를 읽어줍니다</h3>
          </div>
          <p class="muted">예: dxdiag, msinfo32, CrystalDiskInfo, HWiNFO 텍스트</p>
        </div>
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
      <div class="diag-grid">${cards}</div>
      <aside class="result-panel" aria-live="polite">
        <h3>진단 결과</h3>
        <p class="muted">왼쪽에서 증상을 선택하거나 위에 에러 코드를 입력해 주세요.</p>
        <div class="result-box" data-result-box>
          <p>선택된 증상에 맞는 원인, 점검 순서, 관련 페이지를 보여줍니다.</p>
        </div>
      </aside>
    `;

    const codeInput = diagnosticRoot.querySelector("#error-code-input");
    const logInput = diagnosticRoot.querySelector("#hardware-log-input");
    const logResult = diagnosticRoot.querySelector("[data-log-result]");
    const logFileInput = diagnosticRoot.querySelector("[data-log-file]");
    const logDrop = diagnosticRoot.querySelector("[data-log-drop]");
    const suggestionsBox = diagnosticRoot.querySelector("[data-code-suggestions]");
    const historyBox = diagnosticRoot.querySelector("[data-code-history]");
    const codeResult = diagnosticRoot.querySelector("[data-code-result]");
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
  }

  const guidesRoot = document.querySelector("[data-guides-root]");
  if (guidesRoot) {
    const renderGuides = () => {
      const errorLinks = (data.errorCodes || []).filter((item) => selectedErrorKind === "all" || getErrorCodeKind(item).className === selectedErrorKind).map((item) => `
        <article class="card code-card">
          <div class="code-card-head">
            <span class="code-icon code-icon--${getErrorCodeKind(item).className}">${getErrorCodeIcon(item)}</span>
            <h3>${item.code}</h3>
            <span class="code-chip code-chip--${getErrorCodeKind(item).className}">${getErrorCodeKind(item).label}</span>
          </div>
          <p>${getErrorCodeLabel(item)}</p>
          <p class="muted">${item.summary}</p>
          <p class="key-cause">가장 가능성 높은 원인: ${item.causes[0]}</p>
          <a href="${item.detailPage || item.link}">상세 페이지</a>
        </article>
      `).join("");
      guidesRoot.innerHTML = `
        ${renderKindFilters()}
        <div class="card-grid guide-grid">${data.symptoms.map((item) => `
        <article class="card guide-card">
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <p class="key-cause">대표 원인: ${item.causes[0]}</p>
          <p class="muted">첫 점검: ${item.checks[0]}</p>
          <a href="${item.link}">가이드 열기</a>
        </article>
        `).join("")}</div>
        <h3 class="section-subtitle">에러 코드도 함께 보기</h3>
        <div class="card-grid code-grid">${errorLinks}</div>
      `;
    };
    renderGuides();
    guidesRoot.addEventListener("click", (event) => {
      const kindBtn = event.target.closest("[data-kind-key]");
      if (!kindBtn) return;
      selectedErrorKind = kindBtn.dataset.kindKey;
      renderGuides();
    });
  }
})();
