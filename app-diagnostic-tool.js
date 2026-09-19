// 자동 추출됨(2026-09-17) — app.js의 [data-diagnostic-root]/[data-board-root] 전용 코드.
// diagnostic.html에서만 로드된다. 원본 app.js를 고친 뒤 이 파일도 같은 부분을 다시
// 옮겨야 하며, 손으로 이 파일만 따로 고치지 말 것.
window.__initDiagnosticTool = function (__deps) {
  const { CONFIDENCE_LABEL, MISSING_EVENT_KEY, buildAddToBasketButton, buildEventEvidence, buildSaveCardButton, data, escapeEventText, findErrorCode, getErrorCodeIcon, getErrorCodeKind, getErrorCodeLabel, getEventTone, getSupplementalChecks, lookupDriverModule, normalizeCode, normalizeEventSource, readMissingEventReports, readRecentCodes, storageKey } = __deps;
const kindFilters = [
    { key: "all", label: "전체", className: "general" },
    { key: "boot", label: "부팅", className: "boot" },
    { key: "update", label: "업데이트", className: "update" },
    { key: "network", label: "네트워크", className: "network" },
    { key: "permission", label: "권한", className: "permission" },
    { key: "graphics", label: "그래픽", className: "graphics" },
    { key: "driver", label: "드라이버", className: "driver" },
    { key: "memory", label: "메모리", className: "memory" },
    { key: "storage", label: "저장장치", className: "storage" },
    { key: "hardware", label: "하드웨어", className: "hardware" },
    { key: "system", label: "시스템", className: "system" },
    { key: "install", label: "설치/제거", className: "install" },
    { key: "app", label: "앱 실행", className: "app" },
    { key: "game", label: "게임", className: "game" },
    { key: "general", label: "일반", className: "general" },
  ];

let selectedErrorKind = "all";

let currentHardwareLogMeta = null;

const getErrorCodeMatches = (query) => {
    // normalizeCode는 16진수 코드 형식만 남기고 나머지 문자를 모두 제거하므로,
    // "뱅가드 오류"처럼 한글 위주 검색어는 정규화 결과가 빈 문자열이 됩니다.
    // 이 경우에도 원본 검색어 기준으로 제목·요약·별칭을 계속 검색해야 하며,
    // 무필터(전체 목록 반환)로 빠지면 안 됩니다.
    const trimmedQuery = String(query || "").trim();
    const normalized = normalizeCode(query);
    const filtered = (data.errorCodes || []).filter((item) => selectedErrorKind === "all" || getErrorCodeKind(item).className === selectedErrorKind);
    if (!trimmedQuery) return filtered;
    const upperQuery = trimmedQuery.toUpperCase();
    return filtered.filter((item) => {
      const searchable = [
        item.code,
        item.title,
        item.summary,
        ...(item.aliases || [])
      ].join(" ").toUpperCase();
      return searchable.includes(upperQuery) || (normalized && normalizeCode(item.code).includes(normalized));
    });
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

const writeRecentCodes = (code) => {
    try {
      const next = readRecentCodes().filter((item) => item !== code);
      next.unshift(code);
      localStorage.setItem(storageKey, JSON.stringify(next.slice(0, 5)));
    } catch {
      // Ignore storage failures.
    }
  };

const basketStorageKey = "pc_diagnosis_basket";

const readBasket = () => {
    try {
      return JSON.parse(sessionStorage.getItem(basketStorageKey) || "[]").filter(Boolean);
    } catch {
      return [];
    }
  };

const writeBasket = (items) => {
    try {
      sessionStorage.setItem(basketStorageKey, JSON.stringify(items));
    } catch {
      // Ignore storage failures.
    }
  };

const normalizeLogText = (value) => String(value || "").replace(/\r\n/g, "\n").trim();

const firstMatch = (text, patterns, maxLength = 160) => {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = match[1].trim();
        // CSV 로그(HWiNFO 등)의 헤더·데이터 줄은 한 줄이 수천 자에 달해, 우연히
        // 패턴에 걸리면 필드 값이 표 데이터 전체가 되어버릴 수 있어 길이를 제한합니다.
        if (value.length > maxLength) continue;
        return value;
      }
    }
    return "";
  };

const collectMatches = (lines, pattern, limit = 3, maxLineLength = Infinity) => {
    const result = [];
    lines.forEach((line) => {
      // HWiNFO/CrystalDiskInfo의 CSV 내보내기는 헤더·데이터 한 줄이 수천 자에 달해,
      // 그대로 노출하면 실제 경고 문장이 아니라 표 데이터를 그대로 보여주게 됩니다.
      if (line.length > maxLineLength) return;
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
    if (/hwinfo|sensors|cpu package|gpu temperature|thermal throttling|vrm/.test(lower)
      || (/date[ /-]?time|날짜\s*[/-]?\s*시간|^시간\b/m.test(lower)
        && /cpu|gpu|시피유|그래픽/.test(lower)
        && /temperature|power|fan|voltage|온도|전력|팬|전압|사용량|사용률/.test(lower))) {
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

const FORCED_SOURCE_LABEL = { crystaldiskinfo: "CrystalDiskInfo", hwinfo: "HWiNFO", dxdiag: "dxdiag", msinfo32: "msinfo32" };

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

const parseDelimitedRow = (line, delimiter) => {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"') {
        if (quoted && line[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        cells.push(cell.trim());
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

const parseHWiNFOCsv = (text) => {
    const rawLines = text.replace(/^\uFEFF/, "").split("\n").map((line) => line.trim()).filter(Boolean);
    const headerIndex = rawLines.findIndex((line) => {
      const lower = line.toLowerCase();
      return /date[ /-]?time|timestamp|^date\b|날짜\s*[/-]?\s*시간|^시간\b/.test(lower)
        && /[,;]/.test(line)
        && /cpu|gpu|temperature|power|fan|voltage|clock|load|usage|온도|전력|팬|전압|클럭|사용량|사용률|부하/i.test(line);
    });
    if (headerIndex < 0) return { metrics: [], sampleCount: 0, quality: null };
    const headerLine = rawLines[headerIndex];
    const delimiter = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ";" : ",";
    const headers = parseDelimitedRow(headerLine, delimiter).map((value) => value.replace(/^\uFEFF/, ""));
    if (headers.length < 3) return { metrics: [], sampleCount: 0, quality: null };
    const dataLines = rawLines.slice(headerIndex + 1);
    const minimumCells = Math.max(3, Math.floor(headers.length * 0.55));
    let rows = dataLines.map((line) => parseDelimitedRow(line, delimiter)).filter((row) => row.length >= minimumCells);
    const numericValue = (value) => {
      const raw = String(value || "").replace(/\u00a0/g, " ").trim();
      if (!raw || /^(n\/a|na|--|unknown|not available)$/i.test(raw)) return null;
      const normalized = raw.replace(/,(?=\d{3}(?:\D|$))/g, "");
      // 값이 "숫자로 시작하고 뒤에는 짧은 단위만" 오는 경우만 숫자로 본다. 예전에는
      // 문자열 어디서든 첫 숫자를 뽑아서, HWiNFO가 로그 끝에 덧붙이는 센서 이름
      // 행("ASUS H110M-K"→110, "SAMSUNG MZVLQ512…"→512, "Intel HD Graphics 510"
      // →510)이 110V·512°C 같은 가짜 측정값이 되어 "발열 1순위" 같은 오진을 냈다.
      const match = normalized.match(/^([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)(?:\s*[°℃%A-Za-z/]{0,6})?$/i);
      return match ? Number(match[1]) : null;
    };
    // HWiNFO CSV 로깅은 "Date"·"Time"이 별도 열이고(합쳐진 "Date/Time" 열이
    // 아님), 날짜 형식도 "30.7.2026"(일.월.년)처럼 JS Date()가 직접 못 읽는
    // 유럽식이다. 기존 코드는 하나의 합쳐진 열만 찾고 그마저도 new Date()에
    // 그대로 넣어 항상 Invalid Date가 나왔다 — 그 결과 durationSeconds·gapCount
    // 같은 시간 기반 지표가 모든 HWiNFO 기본 로그에서 항상 0/빈 값이었다.
    const dateColIndex = headers.findIndex((header) => /^date$|^날짜$/i.test(header.trim()));
    const timeColIndex = headers.findIndex((header) => /^time$|^시간$/i.test(header.trim()));
    const combinedColIndex = headers.findIndex((header) => /date[ /-]?time|timestamp|날짜\s*[/-]?\s*시간/i.test(header) && !/^date$|^time$/i.test(header.trim()));
    // 날짜 형식은 Windows 지역 설정에 따라 30.7.2026(일.월.년, 한국판 HWiNFO),
    // 7/30/2026(미국), 30/07/2026(영국), 2026-07-30(ISO)로 제각각이다. 앞의 두 값이
    // 모두 12 이하인 "3/4/2026" 같은 경우는 값만으로 일/월을 알 수 없어, 파일 전체를
    // 훑어 13 이상이 나오는 쪽을 일로 보고, 그래도 모르면 시간 순서가 뒤로 가지 않는
    // 해석을 고른다. 마지막 수단은 점(.)이면 일-월, 슬래시(/)면 월-일이다.
    const splitDate = (raw) => {
      const iso = raw.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
      if (iso) return { y: Number(iso[1]), a: Number(iso[2]), b: Number(iso[3]), iso: true, sep: "-" };
      const m = raw.match(/^(\d{1,2})([./-])(\d{1,2})[./-](\d{4})$/);
      return m ? { y: Number(m[4]), a: Number(m[1]), b: Number(m[3]), iso: false, sep: m[2] } : null;
    };
    // HWiNFO의 시간 값은 "9:53:29.747"처럼 시·분·초가 0으로 채워지지 않거나
    // (JS의 ISO 파서는 이런 값을 Invalid Date로 처리한다), 영문 Windows에서는
    // "11:55:30 PM"처럼 12시간제로 나온다. 직접 시·분·초·밀리초로 분해한다.
    const parseClock = (raw) => {
      const m = raw.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})(?:[.,](\d+))?\s*([AaPp]\.?[Mm]\.?|오전|오후)?$/);
      if (!m) return null;
      let hour = Number(m[1]);
      const meridiem = (m[5] || "").toLowerCase();
      if (meridiem) {
        const pm = meridiem.startsWith("p") || meridiem === "오후";
        if (hour < 1 || hour > 12) return null;
        hour = (hour % 12) + (pm ? 12 : 0);
      }
      const ms = m[4] ? Math.round(Number(`0.${m[4]}`) * 1000) : 0;
      return { hour, minute: Number(m[2]), second: Number(m[3]), ms };
    };
    let dayFirst = null;
    if (dateColIndex >= 0 && timeColIndex >= 0 && dateColIndex !== timeColIndex) {
      const parts = rows.map((row) => splitDate(String(row[dateColIndex] || "").trim())).filter((v) => v && !v.iso);
      if (parts.some((v) => v.a > 12)) dayFirst = true;
      else if (parts.some((v) => v.b > 12)) dayFirst = false;
      else if (parts.length) {
        const backwardJumps = (first) => {
          let jumps = 0;
          let prev = null;
          parts.forEach((v) => {
            const key = first ? v.y * 10000 + v.b * 100 + v.a : v.y * 10000 + v.a * 100 + v.b;
            if (prev !== null && key < prev) jumps += 1;
            prev = key;
          });
          return jumps;
        };
        const dayFirstJumps = backwardJumps(true);
        const monthFirstJumps = backwardJumps(false);
        dayFirst = dayFirstJumps !== monthFirstJumps ? dayFirstJumps < monthFirstJumps : parts[0].sep === ".";
      }
    }
    const rowTimestamp = (rawDate, rawTime) => {
      const d = splitDate(rawDate);
      const t = parseClock(rawTime);
      if (!d || !t) return null;
      const month = d.iso ? d.a : dayFirst ? d.b : d.a;
      const day = d.iso ? d.b : dayFirst ? d.a : d.b;
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      const date = new Date(d.y, month - 1, day, t.hour, t.minute, t.second, t.ms);
      return Number.isNaN(date.getTime()) ? null : date.getTime();
    };
    // HWiNFO는 로그를 정상 종료하면 끝에 헤더 행과 센서 이름·출처 행을 한 번 더
    // 덧붙인다. 날짜·시간 열이 있는 로그에서는 실제 날짜와 시각이 있는 행만 측정값
    // 행으로 인정해, 이런 꼬리 행이 표본으로 집계되지 않게 한다.
    const rowsBeforeDateFilter = rows.length;
    if (dateColIndex >= 0 && timeColIndex >= 0 && dateColIndex !== timeColIndex) {
      rows = rows.filter((row) => /^\d{1,4}[./-]\d{1,2}[./-]\d{1,4}$/.test(String(row[dateColIndex] || "").trim())
        && /^\d{1,2}:\d{1,2}:\d{1,2}/.test(String(row[timeColIndex] || "").trim()));
    }
    let timestamps = [];
    if (dateColIndex >= 0 && timeColIndex >= 0 && dateColIndex !== timeColIndex) {
      timestamps = rows.map((row) => {
        const rawDate = String(row[dateColIndex] || "").trim();
        const rawTime = String(row[timeColIndex] || "").trim();
        if (!rawDate || !rawTime) return null;
        return rowTimestamp(rawDate, rawTime);
      });
    } else if (combinedColIndex >= 0) {
      timestamps = rows.map((row) => {
        const value = String(row[combinedColIndex] || "").replace(/\//g, "-").trim();
        const date = new Date(value.includes("T") ? value : value.replace(/\s+/, "T"));
        return Number.isNaN(date.getTime()) ? null : date.getTime();
      });
    }
    const validTimes = timestamps.filter((value) => value !== null);
    const intervals = validTimes.slice(1).map((value, index) => (value - validTimes[index]) / 1000).filter((value) => value > 0 && value < 86400).sort((a, b) => a - b);
    const medianInterval = intervals.length ? intervals[Math.floor(intervals.length / 2)] : null;
    const gapThreshold = medianInterval ? Math.max(10, medianInterval * 3) : null;
    const gapCount = gapThreshold ? intervals.filter((value) => value > gapThreshold).length : 0;
    // 꼬리 행(헤더 반복·센서 이름 행)은 측정값이 아니므로 "읽지 못한 행"으로 세지 않는다.
    const footerRows = rowsBeforeDateFilter - rows.length;
    const quality = {
      headerCount: headers.length,
      dataRows: dataLines.length - footerRows,
      footerRows,
      acceptedRows: rows.length,
      droppedRows: Math.max(0, dataLines.length - footerRows - rows.length),
      timestampCount: validTimes.length,
      startTime: validTimes.length ? new Date(validTimes[0]).toISOString() : "",
      endTime: validTimes.length ? new Date(validTimes[validTimes.length - 1]).toISOString() : "",
      durationSeconds: validTimes.length > 1 ? Math.max(0, (validTimes[validTimes.length - 1] - validTimes[0]) / 1000) : 0,
      medianInterval,
      gapCount,
    };
    const percentile = (values, ratio) => {
      if (!values.length) return null;
      const sorted = [...values].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
    };
    const categories = [
      // 주의: "package"/"ccd"/"core"는 온도·전력·전압·클럭 헤더 어디에나 붙는 위치
      // 수식어일 뿐이라 단독으로는 신호가 되지 않는다(예: "CPU Package Power"에도
      // "package"가 들어있다). 반드시 temp/temperature 같은 실제 단위 단어가
      // 있어야 매칭하도록 한다. tctl/tdie는 AMD가 그 자체로 온도 센서명으로 쓰는
      // 표기라 예외로 둔다.
      // "코어 온도(avg)"처럼 HWiNFO 한글판은 CPU 코어 평균 온도 열에 "CPU"라는
      // 단어를 아예 쓰지 않는 경우가 많다. cpu/시피유 접두어만 요구하면 이런
      // 로그에서는 CPU 온도를 통째로 못 찾는다 — 대신 gpu/그래픽/디스크 계열
      // 헤더는 부정형 전방탐색으로 명시적으로 제외해 오탐을 막는다.
      { key: "cpuTemp", label: "CPU 온도", unit: "°C", pattern: /^(?!.*(?:gpu|그래픽|디스크|disk|drive|ssd|nvme|vrm|vddcr|vdd[_ ]?misc|vdd[_ ]?soc)).*(?:cpu|시피유|코어|core|package|다이|tctl|tdie).*(?:tctl|tdie|temp|temperature|온도)/i, thresholds: [85, 95] },
      { key: "gpuTemp", label: "GPU 코어 온도", unit: "°C", pattern: /(?:gpu|그래픽).*(?:temp|temperature|온도)/i, thresholds: [80, 90] },
      { key: "gpuHotspot", label: "GPU 핫스팟", unit: "°C", pattern: /(?:gpu|그래픽).*(?:hot[ -]?spot|junction|핫스팟|접합)/i, thresholds: [95, 105] },
      // CPU VRM(전원부) 온도: 보드 전원부가 과열되면 CPU/GPU 코어 온도는
      // 정상인데도 순간 재부팅·다운클럭이 발생할 수 있어 별도로 추적한다.
      { key: "vrmTemp", label: "CPU VRM 온도", unit: "°C", pattern: /(?:vrm|vddcr|vdd[_ ]?misc|vdd[_ ]?soc).*(?:°c|℃|temp|온도)/i, thresholds: [80, 95] },
      // 디스크(SSD/NVMe) 온도: 기존 코드는 CrystalDiskInfo 텍스트에서만 단일값을
      // 읽었고, HWiNFO CSV의 시계열 디스크 온도 열은 전혀 집계하지 않았다.
      { key: "diskTemp", label: "디스크 온도", unit: "°C", pattern: /(?:디스크|disk|drive|ssd|nvme|hdd).*(?:온도|temp|temperature)/i, thresholds: [70, 85] },
      // 메인보드/칩셋 온도: 지금까지 카테고리가 아예 없어 로그에 있어도 통째로
      // 버려지고 있었다.
      { key: "mbTemp", label: "메인보드 온도", unit: "°C", pattern: /^(?:메인보드|motherboard|mainboard|시스템)\s*(?:\[°c\]|온도)?$|^(?:메인보드|motherboard|mainboard).*(?:온도|temp)/i, thresholds: [60, 75] },
      // "칩셋 1 (xHCI) [°C]"처럼 단어 "온도/temp" 없이 단위 기호만 붙는 경우가
      // 많아 °C/℃ 기호 자체도 매칭 조건에 포함한다.
      { key: "chipsetTemp", label: "칩셋 온도", unit: "°C", pattern: /(?:칩셋|chipset|pch|xhci).*(?:온도|temp|°c|℃)/i, thresholds: [70, 85] },
      // "팬" 단어만 요구하면 "GPU 팬1 [%]"(듀티 사이클, RPM이 아님) 같은 열도
      // 걸려서 RPM 카드에 % 값이 섞여 나온다. 실제 회전수 단위(rpm/회전)가
      // 있는 열만 이 카테고리로 잡는다.
      { key: "fan", label: "팬 회전수", unit: "RPM", pattern: /(?:cpu|gpu|system|chassis|case|시스템|케이스).*(?:rpm|회전)/i },
      { key: "cpuPower", label: "CPU 패키지 전력", unit: "W", pattern: /(?:cpu|시피유).*(?:power|전력)/i },
      { key: "gpuPower", label: "GPU 전력", unit: "W", pattern: /(?:gpu|그래픽).*(?:power|전력)/i },
      { key: "cpuVoltage", label: "CPU 전압", unit: "V", pattern: /(?:cpu|시피유).*(?:core voltage|voltage|vid|전압)/i },
      { key: "gpuVoltage", label: "GPU 전압", unit: "V", pattern: /(?:gpu|그래픽).*(?:core voltage|voltage|전압)/i },
      // PSU/12V 레일 전압: 게임 중 GPU 부하 스파이크로 12V 레일이 ATX 규격
      // (±5%, 위험 시 -10%) 밖으로 순간 처지는 현상은 순간 재부팅의 대표적
      // 원인인데, 로그에 값이 있어도 지금까지 전혀 추적하지 않고 있었다.
      // 다른 카테고리와 달리 "낮을수록 위험"이라 direction:"low"로 표시하고,
      // thresholds는 [주의 상한, 위험 상한] 대신 [주의 하한, 위험 하한]으로
      // 해석한다(값이 이 이하로 내려가면 경고).
      { key: "psuMain12v", label: "메인보드 +12V 레일", unit: "V", pattern: /^\+?12v$|^\+12v\s*\[v\]$/i, direction: "low", thresholds: [11.4, 10.8] },
      { key: "psuMain5v", label: "메인보드 +5V 레일", unit: "V", pattern: /^\+?5v$|^\+5v\s*\[v\]$/i, direction: "low", thresholds: [4.75, 4.5] },
      { key: "gpu12vInput", label: "GPU 12V 입력 전압", unit: "V", pattern: /(?:pcie\s*\+?12v|gpu.*12v).*(?:입력\s*전압|input\s*voltage)/i, direction: "low", thresholds: [11.4, 10.8] },
      { key: "gpu8pinInput", label: "GPU 8핀 입력 전압", unit: "V", pattern: /8-?pin.*(?:입력\s*전압|input\s*voltage)/i, direction: "low", thresholds: [11.4, 10.8] },
      { key: "cpuUsage", label: "CPU 사용량", unit: "%", pattern: /(?:cpu|시피유).*(?:total|package)?.*(?:usage|utilization|load|사용량|사용률|부하)/i },
      { key: "gpuUsage", label: "GPU 사용량", unit: "%", pattern: /(?:gpu|그래픽).*(?:core|memory)?.*(?:usage|utilization|load|사용량|사용률|부하)/i },
      // "가상 메모리 사용량"(커밋된 주소 공간 대비 비율)과 "물리적 메모리
      // 사용량"(실제 RAM 사용률)은 서로 다른 지표다. 하나의 패턴으로 묶으면
      // 점수·샘플 수가 비슷할 때 어느 쪽이 뽑힐지 알 수 없어, RAM 부족을
      // 직접 보여주는 물리 메모리 수치를 놓칠 수 있다.
      { key: "physicalMemoryLoad", label: "물리 메모리 사용량", unit: "%", pattern: /(?:physical\s*memory|물리적\s*메모리).*(?:load|usage|utilization|사용량|사용률|부하)/i, thresholds: [85, 95] },
      { key: "virtualMemoryLoad", label: "가상 메모리 사용량", unit: "%", pattern: /(?:virtual\s*memory|가상\s*메모리).*(?:load|usage|utilization|사용량|사용률|부하)/i, thresholds: [90, 98] },
      { key: "cpuClock", label: "CPU 유효 클럭", unit: "MHz", pattern: /(?:cpu|시피유).*(?:effective|core|clock|클럭).*(?:clock|mhz|클럭)/i },
      { key: "gpuClock", label: "GPU 클럭", unit: "MHz", pattern: /(?:gpu|그래픽).*(?:clock|mhz|클럭)/i },
    ];
    // rows와 timestamps는 같은 인덱스로 정렬되어 있어, 특정 값이 찍힌 시점을
    // 그대로 시각으로 되짚어볼 수 있다(최고 온도가 정확히 몇 시 몇 분에
    // 찍혔는지 등). 피크 하나만 보는 min/max/average보다 훨씬 구체적인 근거가 된다.
    const formatPeakTime = (rowIndex) => {
      const ms = timestamps[rowIndex];
      if (!ms) return null;
      return new Date(ms).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };
    const metrics = [];
    for (const category of categories) {
      const candidates = headers.map((header, index) => ({ header, index }))
        .filter(({ header }) => category.pattern.test(header)
          && !/\[\s*(?:yes\s*\/\s*no|예\s*\/\s*아니[오요])\s*\]/i.test(header)
          && !(category.key === "gpuTemp" && /hot spot|hotspot|junction/i.test(header))
          && !/maximum|minimum|average|최대|최소|평균/i.test(header));
      const summaries = candidates.map(({ header, index }) => {
        const points = rows.map((row, rowIndex) => ({ value: numericValue(row[index]), rowIndex }))
          .filter((point) => point.value !== null && Math.abs(point.value) < 100000);
        if (!points.length) return null;
        const values = points.map((point) => point.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const average = values.reduce((sum, value) => sum + value, 0) / values.length;
        const peakPoint = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
        const thresholds = category.thresholds;
        // PSU 12V/5V 레일처럼 "낮을수록 위험"인 지표는 온도·사용량과 반대
        // 방향으로 판정해야 한다. direction이 없으면 기존과 동일하게 값이
        // thresholds 이상일 때, "low"면 이하일 때 위험으로 본다.
        const isLow = category.direction === "low";
        const highSamples = thresholds ? values.filter((value) => (isLow ? value <= thresholds[0] : value >= thresholds[0])).length : 0;
        const criticalSamples = thresholds ? values.filter((value) => (isLow ? value <= thresholds[1] : value >= thresholds[1])).length : 0;
        // "디스크 기류 온도(Airflow Temperature)"는 SMART 보조 속성이라 드라이브 본체
        // 온도("디스크 온도")보다 값이 높게 나오는 일이 흔하다. 같은 조건이면 본체 온도를 대표로 삼는다.
        const score = (/(package|tdie|tctl|core|effective|total|junction|hotspot)/i.test(header) ? 2 : 0)
          + (/(average|maximum|minimum)/i.test(header) ? -3 : 0)
          + (/airflow|기류/i.test(header) ? -1 : 0);
        // 로그가 "정상 수치인 채로 갑자기 끊겼는지"를 판단하려면 마지막 구간의
        // 값이 필요하다. 최대/평균만 보면 종료 직전 상태를 알 수 없다.
        const tail = points.slice(-Math.min(5, points.length));
        const lastAverage = tail.reduce((sum, point) => sum + point.value, 0) / tail.length;
        return {
          header, index, min, max, average, p95: percentile(values, 0.95), samples: values.length,
          highSamples, criticalSamples,
          highRatio: thresholds ? highSamples / values.length : 0,
          score,
          sustainedSeconds: thresholds && medianInterval ? highSamples * medianInterval : 0,
          zeroSamples: category.key === "fan" ? values.filter((value) => value <= 0).length : 0,
          peakTime: formatPeakTime(peakPoint.rowIndex),
          lastAverage,
          lastNormal: thresholds ? (isLow ? lastAverage > thresholds[0] : lastAverage < thresholds[0]) : true,
        };
      }).filter(Boolean);
      if (!summaries.length) continue;
      const thresholds = category.thresholds;
      const isLow = category.direction === "low";
      const buildMetric = (best) => {
        const worstValue = isLow ? best.min : best.max;
        const status = thresholds
          ? ((isLow ? worstValue <= thresholds[1] : worstValue >= thresholds[1]) || (best.highRatio >= 0.2 && best.sustainedSeconds >= 30)
            ? "high"
            : (isLow ? worstValue <= thresholds[0] : worstValue >= thresholds[0]) ? "medium" : "normal")
          : "info";
        return { ...category, ...best, status };
      };
      if (category.key === "fan") {
        // CPU 팬, GPU 팬1/2, 케이스 팬은 서로 다른 부품이다. 점수가 가장 높은
        // 팬 하나만 대표로 보여주면, 다른 팬 하나가 죽어도(0 RPM) 화면에는
        // 안 나타난다 — 팬은 예외적으로 감지된 모든 열을 각각 카드로 낸다.
        summaries.forEach((summary) => metrics.push(buildMetric(summary)));
      } else {
        // 드라이브·센서가 여러 개라 열 이름이 같거나 점수가 같을 때는 첫 열이 아니라
        // 가장 걱정스러운 값(높을수록 위험하면 최대값이 큰 쪽, 낮을수록 위험하면 최소값이
        // 작은 쪽)을 가진 열을 대표로 삼는다. 안 그러면 HDD 34°C만 보여주고 같은 PC의
        // NVMe 55°C는 가려진다.
        const worse = (x, y) => (category.direction === "low" ? x.min - y.min : y.max - x.max);
        const best = summaries.sort((a, b) => b.score - a.score || b.samples - a.samples || worse(a, b))[0];
        metrics.push(buildMetric(best));
      }
    }

    // 명시적 쓰로틀링/전력 제한 열(HWiNFO의 "CPU Throttling", "PROCHOT", "Power Limit
    // Exceeded" 등)을 직접 찾는다. 기존 코드는 온도만 보고 쓰로틀링을 "추정"했을 뿐,
    // HWiNFO가 실제로 기록하는 쓰로틀링 신호 자체는 전혀 읽지 않고 있었다.
    // 한글판 HWiNFO는 "성능 제한 - 전력 소비/신뢰성 전압/최대 작동 전압"처럼
    // GPU Perf Cap Reason을 한글 열로 내보내는데 기존 패턴은 영문 키워드뿐이라
    // 이 열들을 전혀 못 읽었다. "(avg)" 요약 열은 개별 사유 열과 값이 겹치므로
    // 중복 집계를 막기 위해 별도로 제외한다.
    const throttlePattern = /throttl|prochot|power\s*limit\s*exceed|thermal\s*violation|vr\s*tdc|vrm.{0,15}(hot|throttl)|성능\s*제한|perf(?:ormance)?\s*cap/i;
    const throttleColumns = headers.map((header, index) => ({ header, index }))
      .filter(({ header }) => throttlePattern.test(header) && !/\(avg\)/i.test(header));
    const throttleFlagActive = (raw) => {
      const value = String(raw || "").trim();
      if (!value) return false;
      if (/^(yes|true|on|active|enabled|예)$/i.test(value)) return true;
      if (/^(no|false|off|inactive|disabled|-|n\/a|아니요|아니오)$/i.test(value)) return false;
      const num = numericValue(value);
      return num !== null && num > 0;
    };
    // "신뢰성 전압(Reliability Voltage)"·"최대 작동 전압" 한계는 NVIDIA/AMD
    // 부스트 알고리즘이 정상 작동 중에도 거의 항상 걸어 두는 상한이라, 이것만
    // 100% 활성으로 나온다고 고장을 의미하지 않는다. 반면 "전력 소비"·"온도"
    // 제한 사유는 실제 발열/전력 여유 부족을 뜻하므로 심각도를 다르게 매긴다.
    const classifyThrottleKind = (header) => {
      if (/신뢰성\s*전압|reliability\s*voltage|최대\s*작동\s*전압|max(?:imum)?\s*operating\s*voltage/i.test(header)) return "benign-voltage-cap";
      if (/전력\s*소비|power\s*(?:limit|consumption)/i.test(header)) return "power";
      if (/온도|thermal|temp/i.test(header)) return "thermal";
      if (/sli|gpuboost\s*sync/i.test(header)) return "sync";
      return "other";
    };
    const throttleEvents = throttleColumns.map(({ header, index }) => {
      const activePoints = rows.map((row, rowIndex) => ({ active: throttleFlagActive(row[index]), rowIndex })).filter((point) => point.active);
      const kind = classifyThrottleKind(header);
      if (!activePoints.length) return { header, kind, activeCount: 0, ratio: 0, firstTime: null };
      return {
        header,
        kind,
        activeCount: activePoints.length,
        ratio: rows.length ? activePoints.length / rows.length : 0,
        firstTime: formatPeakTime(activePoints[0].rowIndex),
        sustainedSeconds: medianInterval ? activePoints.length * medianInterval : 0,
      };
    }).filter((event) => event.activeCount > 0);

    // PMIC(메모리 전원부) 과전압/저전압 플래그. 거의 항상 "아니요"로 찍히지만
    // 켜진 적이 있다면 RAM 전원부·메인보드 VRM 고장의 강한 물증이라 별도로 뽑는다.
    const pmicPattern = /pmic.*(over|under)\s*voltage/i;
    const pmicColumns = headers.map((header, index) => ({ header, index })).filter(({ header }) => pmicPattern.test(header));
    const pmicEvents = pmicColumns.map(({ header, index }) => {
      const activePoints = rows.map((row, rowIndex) => ({ active: throttleFlagActive(row[index]), rowIndex })).filter((point) => point.active);
      if (!activePoints.length) return { header, activeCount: 0, firstTime: null };
      return { header, activeCount: activePoints.length, firstTime: formatPeakTime(activePoints[0].rowIndex) };
    }).filter((event) => event.activeCount > 0);

    // 명시적 플래그가 없는 로그가 대부분이므로, 사용률이 90% 이상인 구간에서
    // 실효 클럭이 관측 최대 클럭 대비 크게 떨어지는지 대조해 쓰로틀링을 간접
    // 추론한다. 두 지표를 각자 min/max로만 보면 못 잡아내는, 같은 시각(같은 행)의
    // 사용률과 클럭을 함께 봐야만 나오는 결론이다. CPU/GPU 둘 다 같은 방식으로 본다.
    const inferThrottle = (usageKey, clockKey, label) => {
      const usageMetric = metrics.find((metric) => metric.key === usageKey);
      const clockMetric = metrics.find((metric) => metric.key === clockKey);
      if (!usageMetric || !clockMetric) return null;
      const pairedHighLoad = rows.map((row) => ({
        usage: numericValue(row[usageMetric.index]),
        clock: numericValue(row[clockMetric.index]),
      })).filter((point) => point.usage !== null && point.clock !== null && point.usage >= 90 && point.clock > 0);
      if (pairedHighLoad.length < 5) return null;
      const avgHighLoadClock = pairedHighLoad.reduce((sum, point) => sum + point.clock, 0) / pairedHighLoad.length;
      const ratio = clockMetric.max ? avgHighLoadClock / clockMetric.max : null;
      if (ratio === null || ratio >= 0.75) return null;
      return { label, avgHighLoadClock, maxClock: clockMetric.max, ratio, sampleCount: pairedHighLoad.length };
    };
    const throttleInferences = [
      inferThrottle("cpuUsage", "cpuClock", "CPU"),
      inferThrottle("gpuUsage", "gpuClock", "GPU"),
    ].filter(Boolean);

    return { metrics, sampleCount: rows.length, quality, throttleEvents, throttleInferences, pmicEvents };
  };

const analyzeHardwareLog = (rawValue, forcedFormat) => {
    // 이벤트 뷰어 분석(analyzeEventLog)은 maskEventPrivacy를 이미 거치지만,
    // 하드웨어 로그(HWiNFO·dxdiag·msinfo32·CrystalDiskInfo)는 마스킹 없이
    // 원문 그대로 분석되고 있었다. 컴퓨터 이름·사용자 이름·경로가 highlights에
    // 그대로 노출될 수 있어 여기서도 동일하게 마스킹한다.
    const text = maskEventPrivacy(normalizeLogText(rawValue));
    const lines = text ? text.split("\n").map((line) => line.trim()).filter(Boolean) : [];
    if (!text) {
      return {
        empty: true,
        source: forcedFormat && FORCED_SOURCE_LABEL[forcedFormat]
          ? { key: forcedFormat, label: FORCED_SOURCE_LABEL[forcedFormat] }
          : { key: "generic", label: "일반 로그" },
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
    const source = forcedFormat && FORCED_SOURCE_LABEL[forcedFormat]
      ? { key: forcedFormat, label: FORCED_SOURCE_LABEL[forcedFormat] }
      : detectHardwareLogSource(text);
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
    const cpuUsage = firstMatch(text, [
      /^Total CPU Usage:\s*(.+)$/im,
      /^CPU Usage:\s*(.+)$/im,
      /^CPU Utilization:\s*(.+)$/im,
    ]);
    const storage = collectMatches(lines, /(nvme|ssd|hdd|disk|\bdrive\b|smart|sata|\bata\b|western digital|wdc|samsung|crucial|kingston|sk hynix|micron|seagate|toshiba|sandisk)/i, 3, 160);
    const tempMatches = [...text.matchAll(/(\d{2,3})\s*°?\s*C\b/gi)].map((match) => Number(match[1])).filter(Number.isFinite);
    const maxTemp = tempMatches.length ? Math.max(...tempMatches) : null;
    const cpuUsageMatches = [...text.matchAll(/cpu\s*(?:usage|utilization|load)\D{0,10}(\d{1,3})\s*%/gi)].map((match) => Number(match[1])).filter(Number.isFinite);
    const maxCpuUsage = cpuUsageMatches.length ? Math.max(...cpuUsageMatches) : null;
    const hwinData = source.key === "hwinfo" ? parseHWiNFOCsv(text) : { metrics: [], sampleCount: 0 };
    const hwinMetrics = hwinData.metrics;
    const hwinQuality = hwinData.quality;
    const hwinThrottleEvents = hwinData.throttleEvents || [];
    const hwinThrottleInferences = hwinData.throttleInferences || [];
    const hwinPmicEvents = hwinData.pmicEvents || [];
    const hwinMaxTemp = hwinMetrics.filter((metric) => ["cpuTemp", "gpuTemp", "gpuHotspot", "vrmTemp", "diskTemp"].includes(metric.key))
      .reduce((max, metric) => Math.max(max, metric.max), 0) || null;
    const observedMaxTemp = hwinMaxTemp ?? maxTemp;

    const fields = [];
    const addField = (label, value) => {
      if (value && !fields.some((item) => item.label === label && item.value === value)) {
        fields.push({ label, value });
      }
    };
    addField("CPU", cpu);
    if (cpuUsage) addField("CPU 사용량", cpuUsage);
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
    hwinMetrics.forEach((metric) => {
      const precision = metric.unit === "V" ? 3 : 1;
      addField(metric.label, `최대 ${metric.max.toFixed(precision)}${metric.unit} · 평균 ${metric.average.toFixed(precision)}${metric.unit}`);
    });

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

    const storageRiskPattern = /smart.*(caution|warning|bad|predicted failure)|reallocated sectors|pending sectors|uncorrectable|crc error|read error|timeout|io error|disk.*fail|nvme.*error/i;
    const thermalRiskPattern = /overheat|thermal.{0,30}(warn|error|critical|limit|exceed|throttl)|throttl|power.{0,15}limit.{0,15}exceed|fan.{0,20}(error|fail|0\s*rpm)|cooling.{0,20}(fail|error)/i;
    const memoryRiskPattern = /page fault|whea|machine check|invalid memory|memory.{0,30}(error|fail|corrupt|dump|blue.?screen)|bad.{0,10}memory|\bram\b.{0,30}(error|fail|issue|corrupt)/i;
    const driverRiskPattern = /driver.{0,30}(fail|error|not.*start|corrupt|missing)|device not started|code 10|code 43|failed to start|cannot start/i;
    const bootRiskPattern = /no boot|startup repair|boot.{0,20}(fail|error|missing|corrupt)|bcd.{0,20}(error|missing|corrupt)|mbr.{0,20}(error|corrupt)|winload|bootmgr/i;
    const cpuUsageRiskPattern = /cpu\s*(?:usage|utilization|load)/i;
    // HWiNFO CSV는 "SMART", "Timeout", "CRC" 같은 단어가 실제 경고가 아니라
    // 센서 이름(열 헤더)에만 들어있는 경우가 흔하다. 이 상태에서 원문 키워드
    // 매칭만으로 storageRisk/thermalRisk를 판정하면, 아래 "분석 결론"에서
    // 수치 기반으로 이미 "문제 아님"이라고 판단한 것과 서로 모순되는 경고가
    // 함께 뜬다. HWiNFO 소스는 실제 파싱된 구조화 수치(디스크 상태 필드,
    // 온도 status)가 있을 때 그 결과를 우선하도록 분리한다.
    const isHwinfoSource = source.key === "hwinfo";
    const hasStructuredDiskEvidence = Boolean(diskHealth || diskReallocated || diskPending || diskCrc);
    const storageRisk = isHwinfoSource
      ? hasStructuredDiskEvidence
      : storageRiskPattern.test(text);
    const thermalRisk = isHwinfoSource
      ? hwinMetrics.some((metric) => ["cpuTemp", "gpuTemp", "gpuHotspot", "vrmTemp", "diskTemp"].includes(metric.key) && metric.status === "high")
      : thermalRiskPattern.test(text) || (observedMaxTemp !== null && observedMaxTemp >= 85);
    const memoryRisk = memoryRiskPattern.test(text);
    const driverRisk = driverRiskPattern.test(text);
    const bootRisk = bootRiskPattern.test(text);
    const cpuUsageRisk = maxCpuUsage !== null && maxCpuUsage >= 90;

    const diagnoses = [];
    // confidence: 이 결론이 원인으로서 얼마나 확실한지 (tone/위험도와는 다른 축).
    // "high"=수치·반복 등 구체적 근거 있음, "verify"=단일 신호라 다른 원인과 구분 필요,
    // "low"=일반 경향일 뿐 특정 원인을 가리키지 않음. 데이터 품질 경고 등 원인 판단이
    // 아닌 항목은 confidence를 생략하면 배지 없이 렌더링된다.
    const addDiagnosis = (tone, title, detail, confidence) => {
      if (!diagnoses.some((item) => item.title === title)) diagnoses.push({ tone, title, detail, confidence });
    };
    let reportThermalFault = false;
    let reportAbruptNormalEnd = false;
    let reportVoltageSagFault = false;
    if (source.key === "hwinfo") {
      const thermalMetrics = hwinMetrics.filter((metric) => ["cpuTemp", "gpuTemp", "gpuHotspot", "vrmTemp", "diskTemp", "mbTemp", "chipsetTemp"].includes(metric.key));
      const hotMetrics = thermalMetrics.filter((metric) => metric.status === "high");
      const warmMetrics = thermalMetrics.filter((metric) => metric.status === "medium");
      if (hotMetrics.length) {
        reportThermalFault = true;
        addDiagnosis("high", "발열이 1순위 원인 후보입니다", `${hotMetrics.map((metric) => `${metric.label} 최대 ${metric.max.toFixed(1)}°C${metric.peakTime ? ` (${metric.peakTime})` : ""}`).join(", ")}가 감지되었습니다. 증상이 발생한 시각과 위 시간을 대조해 보세요. 쿨러 밀착, 팬 회전, 써멀구리스, 케이스 흡·배기와 기본 클럭 상태를 먼저 비교하세요.`, "high");
        addItem(parts, "CPU 쿨러 밀착 상태와 써멀구리스");
        addItem(parts, "케이스 흡·배기 팬과 통풍 경로");
        addItem(settings, "팬 곡선/쿨링 프로필을 기본값으로 재설정");
        addItem(steps, `고온 시각(${hotMetrics[0].peakTime || "위 최댓값 기록 시각"})과 증상(재부팅·다운) 시각을 대조`);
        addItem(steps, "측면 패널을 연 상태로 같은 작업을 재현해 온도 변화를 비교");
        addItem(focus, "CPU/GPU 온도와 팬 속도");
        addItem(focus, "쿨러, 써멀구리스, 통풍 상태");
      } else if (thermalMetrics.length) {
        addDiagnosis("low", "로그상 즉시 과열 근거는 낮습니다", `${thermalMetrics.map((metric) => `${metric.label} 최대 ${metric.max.toFixed(1)}°C`).join(", ")}로 기록되었습니다. 화면 꺼짐이나 재부팅이 계속되면 그래픽 드라이버·전원·WHEA 이벤트를 다음 순서로 확인하세요.`, "verify");
        addItem(steps, "재부팅·화면 꺼짐이 재발하면 이벤트 뷰어의 그래픽 드라이버·전원·WHEA 기록을 시각대로 확인");
      }
      if (warmMetrics.length && !hotMetrics.length) {
        addDiagnosis("medium", "온도 여유가 크지 않아 재현 조건을 확인하세요", `${warmMetrics.map((metric) => `${metric.label} ${metric.max.toFixed(1)}°C`).join(", ")}입니다. 같은 작업을 기본 팬 프로필과 측면 패널을 연 상태에서 비교해 냉각 문제인지 분리하세요.`, "verify");
        addItem(parts, "케이스 통풍 상태");
        addItem(settings, "팬 곡선/쿨링 프로필");
        addItem(steps, "같은 작업을 기본 팬 프로필·측면 패널 개방 상태로 재현해 온도 비교");
        addItem(focus, "CPU/GPU 온도와 팬 속도");
        addItem(focus, "쿨러, 써멀구리스, 통풍 상태");
      }
      // CPU 팬·GPU 팬1/2·케이스 팬은 서로 다른 부품이라 각각 확인해야 한다.
      // 대표 팬 하나만 보면 다른 팬이 죽어도 화면에 안 나타난다.
      const fanMetrics = hwinMetrics.filter((metric) => metric.key === "fan");
      const deadFans = fanMetrics.filter((metric) => metric.zeroSamples > 0 && hwinMaxTemp !== null && hwinMaxTemp >= 70);
      if (deadFans.length) {
        const detail = deadFans.map((metric) => {
          const zeroRatio = metric.samples ? Math.round((metric.zeroSamples / metric.samples) * 100) : 0;
          return `${metric.header} ${zeroRatio}%`;
        }).join(" · ");
        const worstRatio = Math.max(...deadFans.map((metric) => (metric.samples ? metric.zeroSamples / metric.samples : 0)));
        addDiagnosis(worstRatio >= 0.8 ? "high" : "medium", "팬 회전 신호를 실제 상태와 대조하세요", `온도는 ${hwinMaxTemp.toFixed(1)}°C까지 올라갔는데 다음 팬 기록이 0 RPM을 반복했습니다: ${detail}. 팬 헤더 연결·팬 모드·센서 선택 오류를 실제 회전 상태와 대조하세요. 0 RPM이 항상 고장을 뜻하지는 않습니다(펌프리스 모드 등).`, worstRatio >= 0.8 ? "high" : "verify");
        addItem(parts, "팬 헤더 연결과 팬 케이블");
        addItem(settings, "팬 회전 감지 방식(펌프리스 모드 등)");
        addItem(steps, "고온 구간 시각에 해당 팬이 실제로 도는지 육안으로 확인");
        addItem(focus, "CPU/GPU 온도와 팬 속도");
      }
      // PSU/12V 레일 새그: 게임 중 GPU 부하 스파이크로 12V가 ATX 규격 밖으로
      // 순간 처지면 재부팅으로 직결된다. 평균은 정상으로 보여도 최솟값이
      // 위험 구간에 들어간 순간이 있었는지가 핵심이라 min 기준으로 판정한다.
      const railMetrics = hwinMetrics.filter((metric) => ["psuMain12v", "psuMain5v", "gpu12vInput", "gpu8pinInput"].includes(metric.key));
      const sagRails = railMetrics.filter((metric) => metric.status !== "normal");
      if (sagRails.length) {
        reportVoltageSagFault = sagRails.some((metric) => metric.status === "high");
        addDiagnosis(reportVoltageSagFault ? "high" : "medium", "전원 레일 전압이 규격 밖으로 처진 구간이 있습니다", `${sagRails.map((metric) => `${metric.label} 최소 ${metric.min.toFixed(3)}V`).join(", ")}로 관측되었습니다(ATX 규격 기준 12V는 11.4V, 5V는 4.75V 이하면 주의). 부하 스파이크 때 PSU가 규정 전압을 못 버티고 있다는 신호로, 파워서플라이 노후화·케이블 접촉 불량·용량 부족을 우선 의심하세요. 이 순간이 재부팅 시각과 겹치는지 확인해 보세요.`, reportVoltageSagFault ? "high" : "verify");
        addItem(parts, "전원공급장치(PSU)");
        addItem(parts, "PCIe 보조전원 케이블과 커넥터");
        addItem(steps, "전압 처짐 시각과 재부팅·다운 시각을 대조");
        addItem(steps, "가능하다면 여유 있는 다른 PSU로 교차 테스트");
        addItem(focus, "PSU 12V/5V 전압 안정성");
      }
      const powerMetrics = hwinMetrics.filter((metric) => ["cpuPower", "gpuPower"].includes(metric.key));
      if (powerMetrics.length) {
        addDiagnosis("info", "전력 수치는 부하 비교용으로 해석하세요", `${powerMetrics.map((metric) => `${metric.label} 최대 ${metric.max.toFixed(1)}W`).join(", ")}가 기록됐습니다. PSU 고장을 확정하려면 게임 전환·부하 순간의 화면 꺼짐 시각과 12V 전압, Kernel-Power/WHEA 기록을 함께 비교하세요.`, "low");
      }
      // GPU Perf Cap 사유는 종류에 따라 심각도가 다르다. "신뢰성/최대 작동 전압"
      // 한계는 정상 부스트 동작 중에도 거의 항상 걸려 있어 그 자체로는 고장의
      // 증거가 아니다 — 이걸 구분하지 않으면 정상적인 로그에도 매번 "높음"
      // 경고가 떠서 실제 이상 신호와 구별이 안 된다.
      const meaningfulThrottle = hwinThrottleEvents.filter((event) => event.kind === "power" || event.kind === "thermal");
      const benignThrottle = hwinThrottleEvents.filter((event) => event.kind === "benign-voltage-cap");
      if (meaningfulThrottle.length) {
        addDiagnosis("high", "전력/온도 제한으로 인한 쓰로틀링이 기록되었습니다", `${meaningfulThrottle.map((event) => `${event.header} ${event.activeCount}회(${Math.round(event.ratio * 100)}%)${event.firstTime ? `, 최초 ${event.firstTime}` : ""}`).join(" · ")}. 로그 자체가 전력/온도 제한에 걸렸다고 기록한 구간입니다 — 발열·전력 여유를 최우선으로 확인하세요.`, "high");
        addItem(parts, "CPU/GPU 쿨러와 통풍");
        addItem(settings, "전력 제한(PL1/PL2) 또는 고성능 모드");
        addItem(software, "오버클럭/튜닝 프로그램 확인 후 제거하고 재현");
        addItem(steps, "쓰로틀링 발생 시각과 온도·전압 기록을 대조");
        addItem(focus, "쓰로틀링과 전력 제한");
      } else if (hwinThrottleInferences.length) {
        addDiagnosis("medium", "부하 중 클럭 저하가 감지됩니다", `${hwinThrottleInferences.map((inference) => `${inference.label} 사용률 90% 이상 구간(${inference.sampleCount}개 샘플) 평균 클럭 ${Math.round(inference.avgHighLoadClock)}MHz, 관측 최대 ${Math.round(inference.maxClock)}MHz의 ${Math.round(inference.ratio * 100)}%`).join(" · ")}. 이 로그에는 명시적 쓰로틀링 플래그가 없지만, 전력 제한(PL1/PL2)이나 온도 제한에 걸려 부하 중에도 클럭을 못 올리는 상태일 수 있습니다.`, "verify");
        addItem(settings, "전력 제한(PL1/PL2) 설정값 확인");
        addItem(software, "오버클럭/튜닝 프로그램 확인 후 제거하고 재현");
        addItem(steps, "같은 부하로 HWiNFO 로깅을 다시 켜고 쓰로틀링 플래그가 뜨는지 재확인");
        addItem(focus, "쓰로틀링과 전력 제한");
      }
      if (benignThrottle.length && !meaningfulThrottle.length) {
        addDiagnosis("info", "GPU 전압 상한은 정상 부스트 동작일 가능성이 높습니다", `${benignThrottle.map((event) => `${event.header} ${Math.round(event.ratio * 100)}%`).join(" · ")} 구간에서 활성화되었습니다. 이는 NVIDIA/AMD 부스트 알고리즘이 신뢰성 전압·최대 작동 전압 상한에 걸어두는 정상적인 동작으로, 대부분의 정상 카드에서도 항상 관측됩니다. 전력 소비·온도 제한 사유가 함께 뜨지 않는 한 단독으로는 고장 근거로 보기 어렵습니다.`, "low");
      }
      if (hwinPmicEvents.length) {
        addDiagnosis("high", "메모리(DIMM) 전원부 과전압/저전압이 기록되었습니다", `${hwinPmicEvents.map((event) => `${event.header}${event.firstTime ? ` (최초 ${event.firstTime})` : ""}`).join(" · ")}. RAM 전원 관리 칩(PMIC)이 전압 이상을 감지했다는 뜻으로, 메모리 모듈 불량·XMP/EXPO 오버클럭 불안정·메인보드 DIMM 전원부 문제를 우선 의심하세요.`, "high");
        addItem(parts, "메모리(RAM) 모듈");
        addItem(parts, "메인보드 DIMM 전원부");
        addItem(settings, "XMP/EXPO 해제 후 기본 클럭으로 재현");
        addItem(steps, "메모리 재장착 또는 슬롯 교차 장착 후 재현 여부 확인");
        addItem(focus, "메모리(DIMM) 전원부 안정성");
      }
      const physicalMemoryMetric = hwinMetrics.find((metric) => metric.key === "physicalMemoryLoad");
      if (physicalMemoryMetric && physicalMemoryMetric.status !== "normal") {
        addDiagnosis("medium", "물리 메모리 사용량이 높게 관측되었습니다", `물리 메모리 사용량이 최대 ${physicalMemoryMetric.max.toFixed(1)}%까지 올라갔습니다(평균 ${physicalMemoryMetric.average.toFixed(1)}%). 재부팅을 직접 유발하지는 않지만 메모리 부족으로 인한 응답 없음·강제 종료·페이지 파일 부하와 함께 나타나는 경우가 많아 작업 관리자에서 게임 실행 중 사용률을 다시 확인해 보세요.`, "verify");
        addItem(steps, "게임·작업 실행 중 작업 관리자에서 메모리 사용률 재확인");
      }
      if (hwinQuality?.droppedRows) {
        addDiagnosis("medium", "일부 로그 행을 읽지 못했습니다", `전체 ${hwinQuality.dataRows}개 데이터 행 중 ${hwinQuality.droppedRows}개가 열 수 부족으로 제외되었습니다. 원본 CSV를 다시 저장하거나 문제가 재현된 짧은 구간만 내보내 결과를 비교하세요.`);
      }
      if (hwinQuality?.gapCount) {
        addDiagnosis("medium", "센서 기록에 시간 공백이 있습니다", `기록 간격이 평소보다 크게 벌어진 구간이 ${hwinQuality.gapCount}개 있습니다. 화면 꺼짐이나 재부팅 시각이 이 공백과 겹치면 로그만으로는 원인을 확정하기 어렵습니다.`);
      }
      const sustainedHot = thermalMetrics.filter((metric) => metric.sustainedSeconds >= 30);
      if (sustainedHot.length) {
        addDiagnosis("high", "고온이 순간 피크가 아니라 지속되었습니다", `${sustainedHot.map((metric) => `${metric.label} 약 ${Math.round(metric.sustainedSeconds)}초 이상`).join(", ")} 임계 구간이 이어졌습니다. 쿨러 밀착·팬 곡선·케이스 흡배기와 기본 설정 상태를 우선 비교하세요.`, "high");
      }
      // 재부팅으로 로그가 끊긴 경우, 원인이 서서히 진행되는 발열/전력 문제라면
      // 종료 직전 값이 평소보다 높게 나오는 경향이 있다. 반대로 온도·전압·전력이
      // 끝까지 평범한 값으로 유지되다가 로그만 뚝 끊겼다면, 이는 점진적 열화가
      // 아니라 "순간적인 전원 차단(하드 리셋)"에 더 가까운 패턴이다. 이 구분은
      // 기존 코드에 전혀 없었고, 게임 중 재부팅 문의에서 특히 유용하다.
      if (hwinQuality?.durationSeconds >= 60 && !hotMetrics.length && !meaningfulThrottle.length && !hwinPmicEvents.length && !sagRails.length) {
        const tailNormal = thermalMetrics.every((metric) => metric.lastNormal !== false);
        if (tailNormal && thermalMetrics.length) {
          const tailSummary = thermalMetrics.map((metric) => `${metric.label} 종료 직전 평균 ${metric.lastAverage.toFixed(1)}°C`).join(", ");
          reportAbruptNormalEnd = true;
          addDiagnosis("medium", "온도·전력이 정상 범위인 채로 로그가 끊겼습니다", `${tailSummary} 등 종료 직전까지 특별한 상승 추세 없이 로그가 갑자기 끝났습니다(마지막 기록 ${hwinQuality.endTime ? new Date(hwinQuality.endTime).toLocaleString("ko-KR") : "확인 불가"}). 서서히 진행되는 발열·전력 부족보다 파워서플라이·전원 케이블·커넥터 접촉 불량, GPU 보조전원의 순간 전류 스파이크 같은 "순간 전원 차단" 쪽 가능성이 더 큽니다. 이벤트 뷰어의 Kernel-Power(ID 41), WHEA-Logger 항목을 같은 시각대에 대조해 보세요. 같은 시각에 Kernel-Power(ID 41)만 단독으로 있다면 전원 공급이 순간적으로 끊겼을 가능성이 크므로 PSU·전원 케이블·콘센트 접촉을 먼저 의심하고, WHEA-Logger(특히 ID 18·20처럼 "수정 불가/치명적" 오류)까지 같은 시각에 함께 기록되어 있다면 CPU·메모리·PCIe 레벨의 하드웨어 오류가 원인일 가능성이 높으므로 오버클럭·XMP/EXPO 설정 해제, 메모리 재장착, CPU 소켓 접촉 상태를 우선 점검하세요.`, "verify");
          addItem(parts, "전원공급장치(PSU)");
          addItem(parts, "전원 케이블과 커넥터 접촉");
          addItem(steps, "전원 케이블 재체결 및 다른 콘센트/멀티탭으로 교차 확인");
          addItem(steps, "이벤트 뷰어에서 로그 종료 시각과 같은 시각에 Kernel-Power(ID 41) 단독인지, WHEA-Logger가 함께 있는지 확인");
          addItem(steps, "WHEA-Logger가 함께 있다면 오버클럭·XMP/EXPO 해제 후 재현, 메모리 재장착으로 하드웨어 오류 여부 분리");
          addLink("Kernel-Power 41 원인과 점검", "event-kernel-power-41.html");
          addLink("WHEA-Logger 18 원인과 점검", "event-whea-logger-18.html");
          addLink("WHEA-Logger 20 원인과 점검", "event-whea-logger-20.html");
          addItem(focus, "전원 공급 안정성(PSU·케이블·콘센트)");
        }
      }
      if (!hwinMetrics.length) {
        addDiagnosis("medium", "HWiNFO 센서 열을 읽지 못했습니다", "붙여넣은 내용에 센서 헤더와 시간별 값이 없거나 화면 복사 형식일 수 있습니다. Sensors-only에서 CSV 로깅을 켠 뒤 문제가 재현된 구간을 다시 올려 주세요.");
        addItem(steps, "Sensors-only 모드에서 CSV 로깅을 켠 뒤 문제가 재현된 구간을 다시 저장해 업로드");
      }
    }

    if (source.key === "crystaldiskinfo") {
      addItem(parts, "저장장치와 SMART 항목");
      addItem(settings, "SATA/NVMe 연결 모드");
      addItem(software, "디스크 제조사 진단 도구");
    } else if (source.key === "dxdiag") {
      addItem(parts, "그래픽카드와 보조전원");
      addItem(settings, "그래픽 드라이버 버전과 날짜");
      addItem(software, "그래픽 드라이버 재설치 도구");
    } else if (source.key === "msinfo32") {
      addItem(parts, "메인보드와 BIOS/UEFI");
      addItem(settings, "BIOS 모드와 Secure Boot");
      addItem(settings, "부팅 순서와 저장장치 인식");
    }

    if (source.key === "crystaldiskinfo") {
      addItem(focus, "디스크 건강 상태와 재할당/보류 섹터");
      addItem(focus, "SATA 케이블, M.2 슬롯, 전원 연결");
      addItem(focus, "디스크 제조사 진단 도구");
    }
    if (source.key === "dxdiag") {
      addItem(focus, "그래픽 드라이버 버전과 날짜");
      addItem(focus, "문제 있는 장치와 Notes 항목");
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
      const storageEvidence = [];
      if (diskHealth) storageEvidence.push(`SMART 상태: ${diskHealth}`);
      if (diskReallocated) storageEvidence.push(`재할당 섹터: ${diskReallocated}`);
      if (diskPending) storageEvidence.push(`보류 섹터: ${diskPending}`);
      if (diskCrc) storageEvidence.push(`인터페이스 CRC 오류: ${diskCrc}`);
      const storageLine = storageEvidence.length
        ? `${storageEvidence.join(", ")} — 디스크 물리적 손상 신호로 보입니다.`
        : (collectMatches(lines, storageRiskPattern, 1, 200)[0] || "SMART 경고나 읽기 오류가 보입니다.");
      addAlert("high", "저장장치 확인 필요", storageLine);
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
      const thermalEvidence = [];
      if (observedMaxTemp !== null) thermalEvidence.push(`감지된 최고 온도: ${observedMaxTemp.toFixed(1)}°C`);
      if (cpuTemp) thermalEvidence.push(`CPU 온도: ${cpuTemp}`);
      if (gpuTemp) thermalEvidence.push(`GPU 온도: ${gpuTemp}`);
      if (hwinMetrics.length) {
        hwinMetrics.filter((metric) => ["cpuTemp", "gpuTemp", "gpuHotspot"].includes(metric.key))
          .forEach((metric) => thermalEvidence.push(`${metric.label} 최대 ${metric.max.toFixed(1)}°C`));
      }
      if (throttling) thermalEvidence.push(`쓰로틀링: ${throttling}`);
      const thermalLine = thermalEvidence.length
        ? `${thermalEvidence.join(", ")} — 냉각 성능 저하로 온도가 임계치를 넘었을 수 있습니다.`
        : (collectMatches(lines, thermalRiskPattern, 1, 200)[0] || "온도나 냉각 관련 문구가 보입니다.");
      addAlert("high", "온도 또는 냉각 점검", thermalLine);
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
      const memoryLine = collectMatches(lines, memoryRiskPattern, 1, 200)[0];
      const memoryDetail = memoryLine
        ? `감지된 문구: "${memoryLine}" — 메모리 또는 시스템 안정성 문제의 신호일 수 있습니다.`
        : "메모리나 WHEA 관련 문구가 있습니다.";
      addAlert("medium", "메모리/시스템 안정성 점검", memoryDetail);
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
      const driverEvidence = [];
      if (driverVersion) driverEvidence.push(`드라이버 정보: ${driverVersion}`);
      if (driverNotes) driverEvidence.push(`Notes: ${driverNotes}`);
      const driverLogLine = collectMatches(lines, driverRiskPattern, 1, 200)[0];
      const driverDetail = driverEvidence.length
        ? `${driverEvidence.join(", ")} — 장치가 정상 시작되지 않았을 수 있습니다.`
        : driverLogLine
          ? `감지된 문구: "${driverLogLine}" — 장치가 정상 시작되지 않았을 수 있습니다.`
          : "장치가 정상 시작되지 않았을 수 있습니다.";
      addAlert("medium", "드라이버 반응 확인", driverDetail);
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
      const bootEvidence = [];
      if (secureBoot) bootEvidence.push(`Secure Boot: ${secureBoot}`);
      if (bootMode) bootEvidence.push(`부팅 모드: ${bootMode}`);
      const bootLogLine = collectMatches(lines, bootRiskPattern, 1, 200)[0];
      const bootDetail = bootEvidence.length
        ? `${bootEvidence.join(", ")} — 부팅 구성 관련 확인이 필요합니다.`
        : bootLogLine
          ? `감지된 문구: "${bootLogLine}" — 부팅 구성이나 펌웨어 문제의 신호일 수 있습니다.`
          : "부팅 구성이나 펌웨어 문구가 보입니다.";
      addAlert("medium", "부팅 관련 항목 확인", bootDetail);
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

    const highlights = collectMatches(lines, /(warning|error|fail|caution|critical|temperature|smart|whea|timeout|reset|throttle|blue screen|reallocated|uncorrectable|nvme|ssd|gpu|memory|bios|boot)/i, 6, 240);
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
      diagnoses,
      metrics: hwinMetrics,
      sampleCount: hwinData.sampleCount,
      quality: hwinQuality,
      throttleEvents: hwinThrottleEvents,
      throttleInferences: hwinThrottleInferences,
      maxTemp: observedMaxTemp,
      // 다중 세션 비교(renderMultiLogAnalysis)가 진단 "제목" 문자열을 그대로
      // 비교해 연동하면, 나중에 문구만 살짝 고쳐도 그 연결이 조용히 끊긴다.
      // 그래서 판정 결과를 명시적 boolean으로도 노출한다.
      thermalFault: reportThermalFault,
      voltageSagFault: reportVoltageSagFault,
      abruptNormalEnd: reportAbruptNormalEnd,
    };
  };

const renderLogAnalysis = (report, keySuffix = "") => {
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
            <span>${escapeEventText(item.value)}</span>
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
            <p>${escapeEventText(item.detail)}</p>
          </div>
        `).join("")}
      </div>
    ` : `<p class="muted">눈에 띄는 경고 신호는 없습니다.</p>`;
    const highlightList = report.highlights.length ? `
      <div class="log-highlight-list">
        ${report.highlights.map((line) => `<div class="log-highlight">${escapeEventText(line)}</div>`).join("")}
      </div>
    ` : "";
    const metricList = report.metrics?.length ? `
      <h4>센서 수치 요약</h4>
      <div class="log-metric-list">
        ${report.metrics.map((metric) => `
          <div class="log-metric log-metric--${metric.status}">
            <strong>${escapeEventText(metric.label)}</strong>
            <span>최대 ${metric.max.toFixed(metric.unit === "V" ? 3 : 1)}${metric.unit} · 평균 ${metric.average.toFixed(metric.unit === "V" ? 3 : 1)}${metric.unit} · 최소 ${metric.min.toFixed(metric.unit === "V" ? 3 : 1)}${metric.unit}${metric.p95 !== null ? ` · P95 ${metric.p95.toFixed(metric.unit === "V" ? 3 : 1)}${metric.unit}` : ""}</span>
            <small>${escapeEventText(metric.header)} · ${metric.samples}개 샘플${metric.sustainedSeconds ? ` · 임계 구간 약 ${Math.round(metric.sustainedSeconds)}초` : ""}${metric.zeroSamples ? ` · 0 RPM ${metric.zeroSamples}회` : ""}${metric.peakTime ? ` · 최고값 시각 ${metric.peakTime}` : ""}</small>
          </div>
        `).join("")}
      </div>
      ${report.sampleCount ? `<p class="log-metric-note">HWiNFO 시간별 샘플 ${report.sampleCount}개를 집계했습니다. 최대값은 부하 순간, 평균값은 전체 기록의 경향을 보여줍니다.</p>` : ""}
      ${report.quality ? `<p class="log-quality-note">데이터 품질: ${report.quality.acceptedRows}/${report.quality.dataRows}개 행 분석 · ${report.quality.timestampCount ? `기록 ${Math.max(0, Math.round(report.quality.durationSeconds / 60))}분 · 중앙 간격 ${report.quality.medianInterval ? `${report.quality.medianInterval.toFixed(1)}초` : "확인 불가"}` : "시간 열 확인 불가"}${report.quality.droppedRows ? ` · 제외 ${report.quality.droppedRows}행` : ""}${report.quality.gapCount ? ` · 큰 공백 ${report.quality.gapCount}회` : ""}</p>` : ""}
      ${report.throttleEvents?.length ? `<p class="log-metric-note log-metric-note--warn">쓰로틀링 기록: ${report.throttleEvents.map((event) => `${escapeEventText(event.header)} ${event.activeCount}회(${Math.round(event.ratio * 100)}%)`).join(", ")}</p>` : ""}
    ` : "";
    const diagnosisList = report.diagnoses?.length ? `
      <h4>분석 결론</h4>
      <div class="log-diagnosis-list">
        ${report.diagnoses.map((item) => `
          <div class="log-diagnosis log-diagnosis--${item.tone}">
            <div class="log-diagnosis-head">
              <strong>${escapeEventText(item.title)}</strong>
              ${confidenceBadge(item.confidence)}
            </div>
            <p>${escapeEventText(item.detail)}</p>
          </div>
        `).join("")}
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
      ${metricList}
      ${diagnosisList}
      ${focusList ? `<h4>이 로그에서 특히 보는 항목</h4>${focusList}` : ""}
      ${alertList}
      ${highlightList ? `<h4>로그에서 확인된 내용</h4>
        <p class="log-evidence-note">아래는 로그 원문에서 그대로 가져온 문장입니다. 다음 항목을 점검하라고 보는 근거입니다.</p>
        ${highlightList}` : ""}
      ${partList ? `<h4>점검해야 할 부품</h4>${partList}` : ""}
      ${settingList ? `<h4>설정 확인</h4>${settingList}` : ""}
      ${softwareList ? `<h4>프로그램 점검</h4>${softwareList}` : ""}
      ${stepList ? `<h4>우선 점검 순서</h4>${stepList}` : ""}
      ${linkList ? `<h4>연결된 가이드</h4>${linkList}` : ""}
      <div class="result-card-actions">
        ${buildSaveCardButton({
          eyebrow: report.source.label,
          title: "하드웨어 로그 분석",
          tone: { high: "danger", medium: "warning", low: "info" }[statusTone] || "neutral",
          lines: [report.summary, ...report.alerts.slice(0, 2).map((item) => item.title)]
        })}
        ${report.fields.length || report.alerts.length || report.diagnoses?.length ? buildSaveTextButton(report, "하드웨어 로그 분석") : ""}
        ${report.fields.length || report.alerts.length ? `<button type="button" class="btn secondary code-button" data-ai-log-summary>AI 진단 요약 보기</button>` : ""}
        ${report.fields.length || report.alerts.length || report.diagnoses?.length ? buildAddToBasketButton({
          type: "log",
          // 여러 로그 파일을 한 번에 분석하면 각 세션 카드가 같은 밀리초에
          // 만들어져 Date.now()만으로는 key가 서로 겹쳤다 — 두 번째 세션부터는
          // "이미 담긴 항목"으로 조용히 무시돼 카트에 담기지 않던 원인이었다.
          // 세션마다 고유한 keySuffix(파일명 포함)가 있으면 그걸 쓰고, 없을
          // 때만(단일 파일 분석) 시각으로 대체한다.
          key: keySuffix ? `log-${keySuffix}` : String(Date.now()),
          // 파일명까지 넣지 않으면 여러 세션을 담아도 카트에서 전부
          // "로그 분석: HWiNFO"로 똑같이 보여 어떤 세션인지 구분이 안 된다.
          title: keySuffix ? `로그 분석: ${report.source.label} (${keySuffix.replace(/^\d+-/, "")})` : `로그 분석: ${report.source.label}`,
          summary: report.summary,
          // "분석 결론"(report.diagnoses)이 report.alerts보다 훨씬 정교하다 —
          // 발열/전압 처짐/팬 불일치/PMIC/쓰로틀링/급작스런 정상 종료 판정은
          // 전부 diagnoses에만 있고 alerts에는 없어서, 예전에는 종합진단
          // 카트에 이 핵심 정보가 아예 전달되지 않았다. tone 우선순위(high>
          // medium>low>info)로 정렬해 가장 신뢰도 높은 결론부터 전달한다.
          causes: [
            ...report.alerts.map((item) => `${item.title}: ${item.detail}`),
            ...(report.diagnoses || [])
              .filter((item) => !report.alerts.some((alert) => alert.title === item.title))
              .sort((a, b) => (toneRank(b.tone) - toneRank(a.tone)))
              .map((item) => `${item.title}: ${item.detail}`),
          ],
          checks: report.steps || [],
          timeStart: report.quality?.startTime,
          timeEnd: report.quality?.endTime,
          tone: { high: "danger", medium: "warning", low: "info" }[statusTone] || "neutral",
          evidence: {
            kind: "hardware-log",
            source: report.source,
            fileName: report.fileName || "",
            fields: report.fields || [],
            metrics: report.metrics || [],
            alerts: report.alerts || [],
            diagnoses: report.diagnoses || [],
            highlights: report.highlights || [],
            quality: report.quality || null,
            sampleCount: report.sampleCount || 0,
          },
        }) : ""}
        <p class="log-privacy-note">서버 전송 없이 브라우저에서 만들어지며, 컴퓨터 이름·사용자 이름·경로는 저장 전 자동으로 가려집니다.</p>
      </div>
      ${report.fields.length || report.alerts.length ? `<div class="ai-log-summary-result" aria-live="polite" data-ai-log-summary-result></div>` : ""}
    `;
  };

const renderMarkdownLite = (text) => {
    const lines = escapeEventText(text).split("\n");
    const blocks = [];
    let listBuffer = [];
    let listTag = "ul";
    let paragraphBuffer = [];
    const flushList = () => {
      if (listBuffer.length) blocks.push(`<${listTag}>${listBuffer.map((item) => `<li>${item}</li>`).join("")}</${listTag}>`);
      listBuffer = [];
    };
    const flushParagraph = () => {
      if (paragraphBuffer.length) blocks.push(`<p>${paragraphBuffer.join("<br>")}</p>`);
      paragraphBuffer = [];
    };
    lines.forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) {
        flushParagraph();
        flushList();
        return;
      }
      const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
      if (headingMatch) {
        flushParagraph();
        flushList();
        blocks.push(`<h5>${headingMatch[1]}</h5>`);
        return;
      }
      const bulletMatch = line.match(/^[*-]\s+(.+)$/);
      // "1. ", "2) " 같은 번호 목록도 순서 목록으로 인식한다. 실사용 테스트에서
      // 모델이 원인·점검 순서를 번호 목록으로 자주 써서(글머리 기호보다 흔함),
      // 이걸 못 알아들으면 목록이 그냥 줄바꿈 텍스트로만 남아 가독성이 떨어졌다.
      const orderedMatch = line.match(/^\d+[.)]\s+(.+)$/);
      if (bulletMatch || orderedMatch) {
        const nextTag = orderedMatch ? "ol" : "ul";
        if (listBuffer.length && listTag !== nextTag) flushList();
        listTag = nextTag;
        flushParagraph();
        listBuffer.push((orderedMatch || bulletMatch)[1]);
        return;
      }
      flushList();
      paragraphBuffer.push(line);
    });
    flushParagraph();
    flushList();
    return blocks.join("").replaceAll(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  };

const confidenceBadge = (confidence) => confidence && CONFIDENCE_LABEL[confidence]
    ? `<span class="confidence-badge confidence-badge--${confidence}">${CONFIDENCE_LABEL[confidence]}</span>`
    : "";

const renderAiMissingNotice = (reason) => `
    <div class="ai-missing-notice" role="status">
      <span class="ai-missing-badge">AI 분석 누락</span>
      <p>${reason || "AI 분석 진행에 문제가 있어 AI가 종합 분석한 결과가 아닙니다."} 아래는 대신 보여드리는 참고 정보입니다.</p>
    </div>
  `;

const TONE_RANK = { high: 3, medium: 2, low: 1, info: 0 };

const toneRank = (tone) => TONE_RANK[tone] ?? 0;

const recordMissingEvent = ({ id, source, level, time }) => {
    if (!id) return readMissingEventReports().length;
    try {
      const list = readMissingEventReports();
      const key = `${id}::${String(source || "").trim().toLowerCase()}`;
      const existing = list.find((item) => item.key === key);
      const nowIso = new Date().toISOString();
      if (existing) {
        existing.count = (existing.count || 1) + 1;
        existing.lastSeen = nowIso;
      } else {
        list.unshift({ key, id, source: source || "", level: level || "", time: time || "", firstSeen: nowIso, lastSeen: nowIso, count: 1 });
      }
      localStorage.setItem(MISSING_EVENT_KEY, JSON.stringify(list.slice(0, 200)));
      return list.length;
    } catch {
      return readMissingEventReports().length;
    }
  };

const buildSaveTextButton = (report, titleForFile) => {
    const payload = escapeEventText(JSON.stringify(report));
    const safeTitle = escapeEventText((titleForFile || report.source?.label || "진단결과").replace(/[^\w0-9가-힣-]+/g, "-").slice(0, 40));
    return `<button class="btn secondary save-text-btn" type="button" data-save-text data-save-text-report="${payload}" data-save-text-filename="${safeTitle}">텍스트로 저장</button>`;
  };

const maskEventPrivacy = (value) => String(value || "")
    .replace(/(Computer(?: Name)?|컴퓨터(?: 이름)?)\s*[:=]\s*[^\r\n<]+/gi, "$1: [컴퓨터 이름 숨김]")
    .replace(/(<Computer>)[^<]+(<\/Computer>)/gi, "$1[컴퓨터 이름 숨김]$2")
    .replace(/(User(?: Name)?|사용자(?: 이름)?)\s*[:=]\s*[^\r\n<]+/gi, "$1: [사용자 이름 숨김]")
    .replace(/(?:[A-Z]:)\\Users\\[^\\\s<]+/gi, (match) => match.replace(/\\[^\\\s<]+$/, "\\[사용자]"))
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[이메일 숨김]")
    .replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, "[IP 주소 숨김]")
    .replace(/(Serial(?: Number)?|시리얼(?: 번호)?|Product ID|제품 ID)\s*[:=]\s*[^\r\n<]+/gi, "$1: [식별자 숨김]")
    .replace(/\\Device\\HarddiskVolume\d+/gi, "\\Device\\HarddiskVolume[번호]");

const SYSTEM_TOKENS = {
      EndOfStream: 0x00, OpenStartElement: 0x01, CloseStartElement: 0x02, CloseEmptyElement: 0x03,
      CloseElement: 0x04, Value: 0x05, Attribute: 0x06, CDataSection: 0x07, EntityReference: 0x08,
      PITarget: 0x0a, PIData: 0x0b, TemplateInstance: 0x0c, NormalSubstitution: 0x0d,
      ConditionalSubstitution: 0x0e, StartOfStream: 0x0f,
    };

class EvtxParseError extends Error {}

function fileTimeToDate(qwordLE) {
      const EPOCH_DIFF = 11644473600000n;
      const ms = qwordLE / 10000n - EPOCH_DIFF;
      return new Date(Number(ms));
    }

function guidToString(bytes, off) {
      const h = (i) => bytes[off + i].toString(16).padStart(2, "0");
      return (
        h(3) + h(2) + h(1) + h(0) + "-" +
        h(5) + h(4) + "-" +
        h(7) + h(6) + "-" +
        h(8) + h(9) + "-" +
        h(10) + h(11) + h(12) + h(13) + h(14) + h(15)
      );
    }

function sidToString(dv, off) {
      const version = dv.getUint8(off);
      const numElements = dv.getUint8(off + 1);
      const idHigh = dv.getUint32(off + 2, false);
      const idLow = dv.getUint16(off + 6, false);
      let id = "S-" + version + "-" + (((idHigh << 16) ^ idLow) >>> 0);
      for (let i = 0; i < numElements; i++) {
        id += "-" + dv.getUint32(off + 8 + i * 4, true);
      }
      return { id, length: 8 + 4 * numElements };
    }

function escapeXmlText(s) {
      return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

class EvtxReader {
      constructor(arrayBuffer) {
        this.buf = arrayBuffer;
        this.dv = new DataView(arrayBuffer);
        this.u8 = new Uint8Array(arrayBuffer);
        this.decoder = new TextDecoder("utf-16le");
      }

      readWString(off, charLen) {
        const bytes = this.u8.subarray(off, off + charLen * 2);
        return this.decoder.decode(bytes);
      }

      parseName(fileOff) {
        const dv = this.dv;
        const nextOffset = dv.getUint32(fileOff, true);
        const strLen = dv.getUint16(fileOff + 6, true);
        const value = this.readWString(fileOff + 8, strLen);
        const tagLength = strLen * 2 + 8;
        return { nextOffset, value, length: tagLength + 2 };
      }

      loadChunkStrings(chunk) {
        const cache = new Map();
        for (let i = 0; i < 64; i++) {
          let ofs = this.dv.getUint32(chunk.fileOffset + 0x80 + i * 4, true);
          let guard = 0;
          while (ofs > 0 && guard < 5000) {
            guard++;
            if (cache.has(ofs)) break;
            const node = this.parseName(chunk.fileOffset + ofs);
            cache.set(ofs, node);
            ofs = node.nextOffset;
          }
        }
        chunk.strings = cache;
      }

      parseTemplateNode(fileOff) {
        const dv = this.dv;
        const nextOffset = dv.getUint32(fileOff, true);
        const guid = guidToString(this.u8, fileOff + 4);
        const dataLength = dv.getUint32(fileOff + 20, true);
        const contentOffset = fileOff + 24;
        return { nextOffset, guid, dataLength, contentOffset, totalLength: 24 + dataLength, fileOffset: fileOff };
      }

      loadChunkTemplates(chunk) {
        const cache = new Map();
        for (let i = 0; i < 32; i++) {
          let ofs = this.dv.getUint32(chunk.fileOffset + 0x180 + i * 4, true);
          let guard = 0;
          while (ofs > 0 && guard < 5000) {
            guard++;
            if (cache.has(ofs)) break;
            const tmpl = this.parseTemplateNode(chunk.fileOffset + ofs);
            cache.set(ofs, tmpl);
            ofs = tmpl.nextOffset;
          }
        }
        chunk.templates = cache;
      }

      resolveName(chunk, chunkRelOffset) {
        const entry = chunk.strings.get(chunkRelOffset);
        if (entry) return entry.value;
        try {
          return this.parseName(chunk.fileOffset + chunkRelOffset).value;
        } catch (e) {
          return "?";
        }
      }

      parseVariant(fileOff, type, chunk, declaredLength) {
        const dv = this.dv;
        const baseType = type & 0x7f;
        const isArray = (type & 0x80) !== 0;
        if (isArray) {
          return this.parseArrayVariant(fileOff, baseType, declaredLength);
        }
        switch (baseType) {
          case 0x00:
            return { kind: "null", string: "", length: declaredLength || 0 };
          case 0x01: {
            if (declaredLength != null) {
              const charLen = Math.floor(declaredLength / 2);
              const s = this.readWString(fileOff, charLen).replace(/ +$/, "");
              return { kind: "wstring", string: s, length: declaredLength };
            }
            const strLen = dv.getUint16(fileOff, true);
            const s = this.readWString(fileOff + 2, strLen).replace(/ +$/, "");
            return { kind: "wstring", string: s, length: 2 + strLen * 2 };
          }
          case 0x02: {
            if (declaredLength != null) {
              const bytes = this.u8.subarray(fileOff, fileOff + declaredLength);
              const s = Array.from(bytes).map((b) => String.fromCharCode(b)).join("").replace(/ +$/, "");
              return { kind: "string", string: s, length: declaredLength };
            }
            const strLen = dv.getUint16(fileOff, true);
            const bytes = this.u8.subarray(fileOff + 2, fileOff + 2 + strLen);
            const s = Array.from(bytes).map((b) => String.fromCharCode(b)).join("").replace(/ +$/, "");
            return { kind: "string", string: s, length: 2 + strLen };
          }
          case 0x03: return { kind: "i8", string: String(dv.getInt8(fileOff)), length: 1 };
          case 0x04: return { kind: "u8", string: String(dv.getUint8(fileOff)), length: 1 };
          case 0x05: return { kind: "i16", string: String(dv.getInt16(fileOff, true)), length: 2 };
          case 0x06: return { kind: "u16", string: String(dv.getUint16(fileOff, true)), length: 2 };
          case 0x07: return { kind: "i32", string: String(dv.getInt32(fileOff, true)), length: 4 };
          case 0x08: return { kind: "u32", string: String(dv.getUint32(fileOff, true)), length: 4 };
          case 0x09: return { kind: "i64", string: String(dv.getBigInt64(fileOff, true)), length: 8 };
          case 0x0a: return { kind: "u64", string: String(dv.getBigUint64(fileOff, true)), length: 8 };
          case 0x0b: return { kind: "float", string: String(dv.getFloat32(fileOff, true)), length: 4 };
          case 0x0c: return { kind: "double", string: String(dv.getFloat64(fileOff, true)), length: 8 };
          case 0x0d: {
            const v = dv.getInt32(fileOff, true);
            return { kind: "bool", string: v > 0 ? "True" : "False", length: 4 };
          }
          case 0x0e: {
            let size = declaredLength;
            let dataOff = fileOff;
            if (size == null) {
              size = dv.getUint32(fileOff, true);
              dataOff = fileOff + 4;
            }
            const bytes = this.u8.subarray(dataOff, dataOff + size);
            let bin = "";
            for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
            const b64 = typeof btoa === "function" ? btoa(bin) : Buffer.from(bytes).toString("base64");
            return { kind: "binary", string: b64, length: declaredLength == null ? 4 + size : size };
          }
          case 0x0f:
            return { kind: "guid", string: "{" + guidToString(this.u8, fileOff) + "}", length: 16 };
          case 0x10: {
            const len = declaredLength === 4 ? 4 : 8;
            const v = len === 4 ? dv.getUint32(fileOff, true) : dv.getBigUint64(fileOff, true);
            return { kind: "size", string: String(v), length: declaredLength == null ? 8 : declaredLength };
          }
          case 0x11: {
            const q = dv.getBigUint64(fileOff, true);
            // python-evtx special-cases 0 (and any out-of-range value) to datetime.min,
            // rendered without a timezone suffix -- match that so output lines up exactly.
            let filetimeStr;
            if (q === 0n) {
              filetimeStr = "0001-01-01 00:00:00";
            } else {
              const d = fileTimeToDate(q);
              const y = d.getUTCFullYear();
              if (!Number.isFinite(d.getTime()) || y < 1 || y > 9999) {
                filetimeStr = "0001-01-01 00:00:00";
              } else {
                const pad = (n, l) => String(n).padStart(l || 2, "0");
                filetimeStr = `${pad(y, 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}+00:00`;
              }
            }
            return { kind: "filetime", string: filetimeStr, length: 8 };
          }
          case 0x12: {
            const y = dv.getUint16(fileOff, true), mo = dv.getUint16(fileOff + 2, true);
            const d = dv.getUint16(fileOff + 6, true), h = dv.getUint16(fileOff + 8, true);
            const mi = dv.getUint16(fileOff + 10, true), se = dv.getUint16(fileOff + 12, true), msec = dv.getUint16(fileOff + 14, true);
            const dt = new Date(Date.UTC(y, mo - 1, d, h, mi, se, msec));
            return { kind: "systemtime", string: dt.toISOString(), length: 16 };
          }
          case 0x13: {
            const { id, length } = sidToString(dv, fileOff);
            return { kind: "sid", string: id, length };
          }
          case 0x14: {
            const bytes = this.u8.subarray(fileOff, fileOff + 4);
            let s = "0x";
            for (let i = bytes.length - 1; i >= 0; i--) s += bytes[i].toString(16).padStart(2, "0");
            return { kind: "hex32", string: s, length: 4 };
          }
          case 0x15: {
            const bytes = this.u8.subarray(fileOff, fileOff + 8);
            let s = "0x";
            for (let i = bytes.length - 1; i >= 0; i--) s += bytes[i].toString(16).padStart(2, "0");
            return { kind: "hex64", string: s, length: 8 };
          }
          case 0x21: {
            const root = this.parseRoot(fileOff, chunk, declaredLength);
            return { kind: "bxml", string: "", length: declaredLength != null ? declaredLength : root.length, root };
          }
          default:
            return { kind: "unknown", string: "", length: declaredLength || 0 };
        }
      }

      // Faithful port of python-evtx's WstringArrayTypeNode.string(): scans for runs of
      // (non-null byte, any byte) pairs -- i.e. mostly-ASCII UTF-16LE text -- and treats
      // remaining null-byte runs as empty <string></string> entries. Matches the ordering
      // quirk of the reference implementation so output lines up with validated ground truth.
      renderWstringArray(bytes) {
        let bin = "";
        for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
        const acc = [];
        let guard = 0;
        while (bin.length > 0 && guard < 10000) {
          guard++;
          const m = bin.match(/(?:[^\x00][^\n])+/);
          let progressed = false;
          if (m) {
            const frag = m[0];
            let decoded = "";
            for (let i = 0; i + 1 < frag.length; i += 2) {
              const code = frag.charCodeAt(i) | (frag.charCodeAt(i + 1) << 8);
              decoded += String.fromCharCode(code);
            }
            acc.push("<string>", escapeXmlText(decoded), "</string>\n");
            bin = bin.slice(frag.length + 2);
            progressed = true;
            if (bin.length === 0) break;
          }
          const nm = bin.match(/^\x00*/);
          const nullRun = nm ? nm[0] : "";
          if (nullRun.length > 0) {
            if (nullRun.length % 2 === 0) {
              for (let i = 0; i < nullRun.length / 2; i++) acc.push("<string></string>\n");
            }
            bin = bin.slice(nullRun.length);
            progressed = true;
          }
          if (!progressed) break;
        }
        return acc.join("");
      }

      parseArrayVariant(fileOff, baseType, declaredLength) {
        const dv = this.dv;
        let size = declaredLength;
        let dataOff = fileOff;
        if (size == null) {
          size = dv.getUint16(fileOff, true);
          dataOff = fileOff + 2;
        }
        const totalLen = declaredLength == null ? 2 + size : size;
        if (baseType === 0x01) {
          const bytes = this.u8.subarray(dataOff, dataOff + size);
          const s = this.renderWstringArray(bytes);
          return { kind: "wstringarray", string: s, length: totalLen };
        }
        const itemSizes = { 0x03: 1, 0x04: 1, 0x05: 2, 0x06: 2, 0x07: 4, 0x08: 4, 0x09: 8, 0x0a: 8, 0x0b: 4, 0x0c: 8 };
        const itemSize = itemSizes[baseType];
        if (itemSize) {
          const vals = [];
          let p = dataOff;
          const end = dataOff + size;
          while (p + itemSize <= end) {
            const v = this.parseVariant(p, baseType, null, itemSize);
            vals.push(v.string);
            p += itemSize;
          }
          return { kind: "array", string: vals.join(","), length: totalLen };
        }
        return { kind: "unknown-array", string: "", length: totalLen };
      }

      parseNode(fileOff, chunk) {
        const tokenByte = this.dv.getUint8(fileOff);
        const token = tokenByte & 0x0f;
        const flags = tokenByte >> 4;
        switch (token) {
          case SYSTEM_TOKENS.EndOfStream:
            return { node: { type: "eos" }, length: 1, token };
          case SYSTEM_TOKENS.OpenStartElement:
            return { ...this.parseOpenStartElement(fileOff, chunk, flags), token };
          case SYSTEM_TOKENS.CloseStartElement:
            return { node: { type: "closeStart" }, length: 1, token };
          case SYSTEM_TOKENS.CloseEmptyElement:
            return { node: { type: "closeEmpty" }, length: 1, token };
          case SYSTEM_TOKENS.CloseElement:
            return { node: { type: "closeElement" }, length: 1, token };
          case SYSTEM_TOKENS.Value:
            return { ...this.parseValueNode(fileOff, chunk), token };
          case SYSTEM_TOKENS.Attribute:
            return { ...this.parseAttribute(fileOff, chunk), token };
          case SYSTEM_TOKENS.CDataSection: {
            const strLen = this.dv.getUint16(fileOff + 1, true);
            const chars = Math.max(0, (strLen - 2) / 2);
            const s = this.readWString(fileOff + 3, chars);
            return { node: { type: "cdata", text: s }, length: 3 + strLen, token };
          }
          case SYSTEM_TOKENS.EntityReference: {
            const strOff = this.dv.getUint32(fileOff + 1, true);
            let extra = 0;
            const isResident = strOff > fileOff - chunk.fileOffset;
            if (isResident) extra = (chunk.strings.get(strOff) || this.parseName(chunk.fileOffset + strOff)).length;
            const name = this.resolveName(chunk, strOff);
            return { node: { type: "entityref", name }, length: 5 + extra, token };
          }
          case SYSTEM_TOKENS.PITarget: {
            const strOff = this.dv.getUint32(fileOff + 1, true);
            let extra = 0;
            const isResident = strOff > fileOff - chunk.fileOffset;
            if (isResident) extra = (chunk.strings.get(strOff) || this.parseName(chunk.fileOffset + strOff)).length;
            return { node: { type: "pitarget" }, length: 5 + extra, token };
          }
          case SYSTEM_TOKENS.PIData: {
            const strLen = this.dv.getUint16(fileOff + 1, true);
            return { node: { type: "pidata" }, length: 3 + strLen * 2, token };
          }
          case SYSTEM_TOKENS.TemplateInstance:
            return { ...this.parseTemplateInstance(fileOff, chunk), token };
          case SYSTEM_TOKENS.NormalSubstitution: {
            const index = this.dv.getUint16(fileOff + 1, true);
            const type = this.dv.getUint8(fileOff + 3);
            return { node: { type: "normalSub", index, subType: type }, length: 4, token };
          }
          case SYSTEM_TOKENS.ConditionalSubstitution: {
            const index = this.dv.getUint16(fileOff + 1, true);
            const type = this.dv.getUint8(fileOff + 3);
            return { node: { type: "condSub", index, subType: type }, length: 4, token };
          }
          case SYSTEM_TOKENS.StartOfStream:
            return { node: { type: "streamStart" }, length: 4, token };
          default:
            throw new EvtxParseError("Unknown token 0x" + token.toString(16) + " at " + fileOff);
        }
      }

      parseChildren(startOff, chunk, endTokens, maxChildren) {
        const children = [];
        let ofs = startOff;
        let count = 0;
        const limit = maxChildren != null ? maxChildren : Infinity;
        while (count < limit) {
          const { node, length, token } = this.parseNode(ofs, chunk);
          children.push(node);
          ofs += length;
          count++;
          if (endTokens && endTokens.includes(token)) break;
          if (token === SYSTEM_TOKENS.EndOfStream) break;
          // A TemplateInstanceNode's referenced template always ends in its own
          // EndOfStream token, so python-evtx's find_end_of_stream() short-circuits
          // the walk here too: no literal EndOfStream byte follows at this level.
          if (token === SYSTEM_TOKENS.TemplateInstance) break;
        }
        return { children, endOffset: ofs };
      }

      parseOpenStartElement(fileOff, chunk, flags) {
        let tagLength = 11;
        if (flags & 0x04) tagLength += 4;
        const stringOffset = this.dv.getUint32(fileOff + 7, true);
        const chunkRel = fileOff - chunk.fileOffset;
        const isResident = stringOffset > chunkRel;
        if (isResident) {
          const entry = chunk.strings.get(stringOffset) || this.parseName(chunk.fileOffset + stringOffset);
          tagLength += entry.length;
        }
        const name = this.resolveName(chunk, stringOffset);
        const { children, endOffset } = this.parseChildren(
          fileOff + tagLength, chunk,
          [SYSTEM_TOKENS.CloseElement, SYSTEM_TOKENS.CloseEmptyElement]
        );
        const length = endOffset - fileOff;
        return { node: { type: "element", name, children }, length };
      }

      parseValueNode(fileOff, chunk) {
        const type = this.dv.getUint8(fileOff + 1);
        const val = this.parseVariant(fileOff + 2, type, chunk, null);
        return { node: { type: "value", valueType: type, value: val }, length: 2 + val.length };
      }

      parseAttribute(fileOff, chunk) {
        let tagLength = 5;
        const stringOffset = this.dv.getUint32(fileOff + 1, true);
        const chunkRel = fileOff - chunk.fileOffset;
        const isResident = stringOffset > chunkRel;
        if (isResident) {
          const entry = chunk.strings.get(stringOffset) || this.parseName(chunk.fileOffset + stringOffset);
          tagLength += entry.length;
        }
        const name = this.resolveName(chunk, stringOffset);
        const { children, endOffset } = this.parseChildren(fileOff + tagLength, chunk, [], 1);
        const length = endOffset - fileOff;
        return { node: { type: "attribute", name, value: children[0] || null }, length };
      }

      parseTemplateInstance(fileOff, chunk) {
        const templateOffset = this.dv.getUint32(fileOff + 6, true);
        const chunkRel = fileOff - chunk.fileOffset;
        const isResident = templateOffset > chunkRel;
        let dataLength = 0;
        if (isResident) {
          let tmpl = chunk.templates.get(templateOffset);
          if (!tmpl) {
            tmpl = this.parseTemplateNode(chunk.fileOffset + templateOffset);
            chunk.templates.set(templateOffset, tmpl);
          }
          dataLength = tmpl.totalLength;
        }
        return { node: { type: "templateInstance", templateOffset }, length: 10 + dataLength };
      }

      parseElementTree(startOff, chunk) {
        const { children } = this.parseChildren(startOff, chunk, [SYSTEM_TOKENS.EndOfStream]);
        return children;
      }

      parseRoot(fileOff, chunk, declaredLength) {
        const { children, endOffset } = this.parseChildren(fileOff, chunk, [SYSTEM_TOKENS.EndOfStream]);
        const tiNode = children.find((c) => c.type === "templateInstance");
        let templateOffset = tiNode ? tiNode.templateOffset : null;
        let templateTree = [];
        if (templateOffset != null) {
          const tmpl = chunk.templates.get(templateOffset);
          if (tmpl) {
            templateTree = this.parseElementTree(tmpl.contentOffset, chunk);
          }
        }
        let ofs = endOffset;
        const subCount = this.dv.getUint32(ofs, true);
        ofs += 4;
        const descriptors = [];
        for (let i = 0; i < subCount; i++) {
          const size = this.dv.getUint16(ofs, true);
          const type = this.dv.getUint8(ofs + 2);
          descriptors.push({ size, type });
          ofs += 4;
        }
        const substitutions = [];
        for (const desc of descriptors) {
          const val = this.parseVariant(ofs, desc.type, chunk, desc.size);
          substitutions.push(val);
          ofs += desc.size;
        }
        const length = declaredLength != null ? declaredLength : ofs - fileOff;
        return { templateTree, substitutions, length };
      }

      renderNodes(nodes, subs, acc) {
        for (const node of nodes) this.renderNode(node, subs, acc);
      }

      renderNode(node, subs, acc) {
        switch (node.type) {
          case "streamStart":
          case "closeStart":
          case "closeEmpty":
          case "closeElement":
          case "eos":
          case "attribute":
            return;
          case "element": {
            acc.push("<", node.name);
            for (const child of node.children) {
              if (child.type === "attribute") {
                acc.push(" ", child.name, '="');
                if (child.value) this.renderNode(child.value, subs, acc);
                acc.push('"');
              }
            }
            acc.push(">");
            for (const child of node.children) {
              if (child.type !== "attribute") this.renderNode(child, subs, acc);
            }
            acc.push("</", node.name, ">\n");
            return;
          }
          case "value":
            acc.push(escapeXmlText(node.value.string));
            return;
          case "cdata":
            acc.push("<![CDATA[", escapeXmlText(node.text), "]]>");
            return;
          case "entityref":
            acc.push("&", node.name, ";");
            return;
          case "normalSub":
          case "condSub": {
            const sub = subs[node.index];
            if (!sub) return;
            if (sub.kind === "bxml" && sub.root) {
              this.renderNodes(sub.root.templateTree, sub.root.substitutions, acc);
            } else {
              acc.push(escapeXmlText(sub.string));
            }
            return;
          }
          default:
            return;
        }
      }

      renderRootToXml(root) {
        const acc = [];
        this.renderNodes(root.templateTree, root.substitutions, acc);
        return acc.join("");
      }

      parseFile() {
        const dv = this.dv;
        const magicBytes = String.fromCharCode(...this.u8.subarray(0, 8));
        if (magicBytes !== "ElfFile ") throw new EvtxParseError("Not an EVTX file (bad magic)");
        const headerChunkSize = dv.getUint16(40, true);
        const records = [];
        const errors = [];
        let ofs = headerChunkSize || 4096;
        let chunkIndex = 0;
        while (ofs + 0x10000 <= this.buf.byteLength) {
          const chunkMagic = String.fromCharCode(...this.u8.subarray(ofs, ofs + 8));
          if (chunkMagic !== "ElfChnk ") break;
          const chunk = { fileOffset: ofs };
          try {
            this.loadChunkStrings(chunk);
            this.loadChunkTemplates(chunk);
            const freeSpaceOffset = dv.getUint32(ofs + 48, true);
            let recOff = ofs + 512;
            const recEnd = ofs + freeSpaceOffset;
            while (recOff < recEnd - 24) {
              const magic = dv.getUint32(recOff, true);
              if (magic !== 0x00002a2a) break;
              const size = dv.getUint32(recOff + 4, true);
              if (size <= 0 || size > 0x10000 || recOff + size > this.buf.byteLength) break;
              try {
                const recordNum = dv.getBigUint64(recOff + 8, true);
                const filetime = dv.getBigUint64(recOff + 16, true);
                const timeCreated = fileTimeToDate(filetime);
                const root = this.parseRoot(recOff + 24, chunk, size - 24 - 4);
                const xml = this.renderRootToXml(root);
                records.push({ recordNumber: Number(recordNum), timeCreated, xml, chunkIndex });
              } catch (e) {
                errors.push({ recOff, chunkIndex, message: String((e && e.message) || e) });
              }
              recOff += size;
            }
          } catch (e) {
            errors.push({ chunkIndex, message: "chunk error: " + String((e && e.message) || e) });
          }
          ofs += 0x10000;
          chunkIndex++;
        }
        return { records, errors };
      }
    }

function parseEvtxArrayBuffer(arrayBuffer) {
      const reader = new EvtxReader(arrayBuffer);
      return reader.parseFile();
    }

const splitEventBlocks = (rawValue) => {
    const text = normalizeLogText(rawValue);
    if (!text) return [];
    const xmlBlocks = text.match(/<Event[\s>][\s\S]*?<\/Event>/gi);
    if (xmlBlocks && xmlBlocks.length > 1) return xmlBlocks;

    const idPattern = /(?:<EventID[^>]*>|Event ID\s*[:=]|이벤트 ID\s*[:=]|\bId\s*[:=])/i;

    // 1순위: 빈 줄로 구분된 문단마다 이벤트 ID가 있으면 문단 단위로 분리 (Format-List, 순차 붙여넣기 등)
    const paragraphs = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
    const paragraphsWithId = paragraphs.filter((p) => idPattern.test(p));
    if (paragraphsWithId.length > 1) return paragraphsWithId;

    // 2순위: 빈 줄 구분이 없으면 각 이벤트 정보의 맨 앞 필드(로그 이름)를 기준으로 분리해
    // 원본·이벤트 ID 등 뒤따르는 필드가 다른 이벤트로 잘못 섞이지 않게 한다.
    const recordStartPattern = /(?:Log Name|로그 이름)\s*[:=]/gi;
    const startIndexes = [];
    let match;
    while ((match = recordStartPattern.exec(text))) startIndexes.push(match.index);
    if (startIndexes.length > 1) {
      const blocks = startIndexes.map((startIndex, i) => {
        const end = i + 1 < startIndexes.length ? startIndexes[i + 1] : text.length;
        return text.slice(startIndex, end).trim();
      }).filter((block) => idPattern.test(block));
      if (blocks.length > 1) return blocks;
    }

    return [text];
  };

const findEventViewerEntries = ({ id, source }) => {
    const normalizedId = String(id || "").trim();
    const normalizedSource = normalizeEventSource(source);
    const entries = data.eventViewerCodes || [];
    return entries.filter((item) => {
      const idMatch = !normalizedId || String(item.id) === normalizedId;
      const sourceNames = [item.source, ...(item.sourceAliases || [])].map(normalizeEventSource);
      const sourceMatch = !normalizedSource || sourceNames.some((itemSource) => itemSource.includes(normalizedSource) || normalizedSource.includes(itemSource));
      return idMatch && sourceMatch;
    });
  };

const extractEventViewerFields = (rawValue) => {
    // 이벤트 뷰어의 "일반" 탭을 복사하면 "이벤트 ID(E):", "원본(S):"처럼
    // 필드명 뒤에 1~3자 약어가 괄호로 붙는 경우가 많아, 필드 정규식이
    // 콜론을 못 찾고 실패한다. 값 추출 전에 이 약어 괄호만 제거한다.
    const masked = maskEventPrivacy(normalizeLogText(rawValue)).replace(/\([A-Za-z가-힣0-9]{1,3}\)(?=\s*[:=])/g, "");
    const get = (patterns) => firstMatch(masked, patterns);
    const id = get([
      /<EventID[^>]*>(\d+)<\/EventID>/i,
      /(?:Event ID|이벤트 ID)\s*[:=]\s*(\d+)/i,
      /^\s*Id\s*[:=]\s*(\d+)/im,
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
    // WER-SystemErrorReporting/BugCheck 1001은 "The bugcheck was: 0x..." /
    // "오류 검사: 0x..." 문장에 정지 코드를 담는다. 위 BugcheckCode 필드와는
    // 다른 형식이라 별도 정규식이 필요하다(여러 건의 1001을 모아 정지 코드가
    // 서로 다른지 비교할 때 사용 — RAM 불량은 매번 다른 코드로 나타나는 경우가
    // 많다).
    const stopCode = get([/(?:bugcheck was|오류\s*검사)\s*[:：]?\s*(0x[0-9a-fA-F]+)/i]);
    const device = get([
      /(?:DeviceInstanceId|Device Name|장치 이름|DriverName|드라이버 이름)\s*[:=]\s*([^\r\n<]+)/i,
      /<Data Name=["'](?:DeviceInstanceId|DriverName)["']>([^<]+)<\/Data>/i,
    ]);
    const provider = get([
      /<Provider[^>]+Name=["']([^"']+)["']/i,
      /(?:ProviderName|공급자)\s*[:=]\s*([^\r\n<]+)/i,
    ]);
    const eventRecordId = get([
      /<EventRecordID>([^<]+)<\/EventRecordID>/i,
      /(?:EventRecordID|이벤트 레코드 ID)\s*[:=]\s*([^\r\n<]+)/i,
    ]);
    const computer = get([/<Computer>([^<]+)<\/Computer>/i, /(?:Computer|컴퓨터)\s*[:=]\s*([^\r\n<]+)/i]);
    const opcode = get([/<Opcode>([^<]+)<\/Opcode>/i, /(?:Opcode|작업 코드)\s*[:=]\s*([^\r\n<]+)/i]);
    const keywords = get([/<Keywords>([^<]+)<\/Keywords>/i, /(?:Keywords|키워드)\s*[:=]\s*([^\r\n<]+)/i]);
    const eventData = [];
    const dataMatches = masked.match(/<Data(?:\s+Name=["']([^"']+)["'])?>([\s\S]*?)<\/Data>/gi) || [];
    dataMatches.slice(0, 24).forEach((rawData) => {
      const match = rawData.match(/<Data(?:\s+Name=["']([^"']+)["'])?>([\s\S]*?)<\/Data>/i);
      if (!match) return;
      const value = match[2].trim();
      if (!value || /^(?:-+|없음|N\/A)$/i.test(value)) return;
      eventData.push({ name: match[1] || "값", value: value.slice(0, 240) });
    });
    const getDataValue = (names) => {
      const item = eventData.find(({ name }) => names.some((namePattern) => namePattern.test(name)));
      return item?.value || "";
    };
    const errorType = getDataValue([/errortype/i]);
    const errorSource = getDataValue([/errorsource/i]);
    const apicId = getDataValue([/apicid/i]);
    const getNamedData = (patterns) => getDataValue(patterns);
    const imageName = getNamedData([/imagename|image_name|faultingmodule|faulting_module/i]);
    const processName = getNamedData([/processname|process_name|applicationname|application_name/i]);
    const statusCode = getNamedData([/^status$|statuscode|status_code/i]);
    const errorCode = getNamedData([/^error(code)?$|error_code|ntstatus/i]);
    const failureBucketId = getNamedData([/failurebucketid|failure_bucket_id|bucketid/i]);
    const reportId = getNamedData([/^reportid$|report_id|werreportid/i]);
    const deviceName = getNamedData([/^devicename$|device_name|friendlyname/i]);
    const volumeName = getNamedData([/volumename|volume_name|driveletter/i]);
    const parameters = [1, 2, 3, 4].map((number) => getNamedData([new RegExp(`^param(?:eter)?${number}$`, "i")])).filter(Boolean);
    // <System>은 이벤트 하나마다 함께 들어 있으므로 XML 반복 횟수는 <Event>만 센다.
    const xmlRecordCount = (masked.match(/<Event(?=[\s>])/gi) || []).length;
    const textRecordCount = (masked.match(/(?:Event ID|이벤트 ID)\s*[:=]/gi) || []).length;
    const recordCount = Math.max(1, xmlRecordCount, textRecordCount);
    return {
      id, source, level, time, logName, task, bugcheckCode, stopCode, device, provider,
      eventRecordId, computer, opcode, keywords, errorType, errorSource, apicId,
      imageName, processName, statusCode, errorCode, failureBucketId, reportId,
      deviceName, volumeName, parameters, eventData,
      rawDataLength: getDataValue([/rawdata/i]).length, recordCount, masked
    };
  };

const typeLabelLookup = { symptom: "증상", code: "오류코드", event: "이벤트", log: "로그 분석", minidump: "미니덤프", ai: "AI 질문" };

const eventOfficialLinks = {
    "kernel-power:41": [{ label: "Microsoft: Kernel-Power 41", href: "https://learn.microsoft.com/troubleshoot/windows-client/performance/event-id-41-restart" }],
    "whea-logger:1": [{ label: "Microsoft Learn: WHEA 하드웨어 오류 이벤트", href: "https://learn.microsoft.com/windows-hardware/drivers/whea/whea-hardware-error-events" }],
    "whea-logger:18": [{ label: "Microsoft: WHEA 하드웨어 오류", href: "https://learn.microsoft.com/windows-hardware/drivers/whea/whea-hardware-error-events" }],
    "disk:7": [{ label: "Microsoft: 디스크 오류 점검", href: "https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors" }],
    "storahci:129": [{ label: "Microsoft: 저장장치 129·153 점검", href: "https://learn.microsoft.com/troubleshoot/windows-server/backup-and-storage/troubleshoot-data-corruption-and-disk-errors" }],
    "display:4101": [{ label: "Microsoft: 그래픽 TDR 동작", href: "https://learn.microsoft.com/windows-hardware/drivers/display/timeout-detection-and-recovery" }],
    "schannel:36874": [{ label: "Microsoft: Schannel 이벤트 36874", href: "https://learn.microsoft.com/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/dn786445(v=ws.11)" }],
    "schannel:36888": [{ label: "Microsoft: Schannel 이벤트 안내", href: "https://learn.microsoft.com/previous-versions/windows/it-pro/windows-server-2012-r2-and-2012/dn786445(v=ws.11)" }],
    "microsoft-windows-windows defender:5007": [{ label: "Microsoft Learn: Defender 이벤트 5007", href: "https://learn.microsoft.com/defender-endpoint/troubleshoot-microsoft-defender-antivirus" }],
    "application error:1000": [{ label: "Microsoft: Get-WinEvent", href: "https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent" }],
    "windowsupdateclient:20": [{ label: "Microsoft: Windows Update 문제 해결", href: "https://support.microsoft.com/windows/troubleshoot-problems-updating-windows-188c2b0a-7a86-4fdb-93d6-4f8f3f3e9f3c" }]
  };

const NOISY_EVENT_SOURCE_PATTERN = /^(Microsoft-Windows-HttpService|Microsoft-Windows-FilterManager|DCOM|Microsoft-Windows-Kernel-General|Microsoft-Windows-Kernel-Boot|Microsoft-Windows-Configuration-Change-Monitor|Microsoft-Windows-UserPnp|WPDClassInstaller|Service Control Manager)$/i;

const renderEventViewerResult = ({ entry, fields, repeatCount, selectedLevel, eventTime, timing }) => {
    if (!entry) {
      const missingTotal = recordMissingEvent({ id: fields?.id, source: fields?.source, level: selectedLevel || fields?.level, time: fields?.time || eventTime });
      const driverInfo = lookupDriverModule(fields?.source);
      const levelLabel = String(selectedLevel || fields?.level || "").trim();
      const isSevere = /치명적|오류|critical|error/i.test(levelLabel);
      const eventDataLines = (fields?.eventData || []).slice(0, 6).map(({ name, value }) => `${name ? `${name}: ` : ""}${value}`).filter(Boolean);
      const missingNote = `<p class="event-missing-note">이 이벤트 ID는 사이트 DB에 아직 없어 미등록 이벤트로 기록해 뒀습니다(누적 ${missingTotal}건). 나중에 모아서 사이트에 추가할 수 있도록 내보낼 수 있습니다.<br><button type="button" class="btn secondary" data-export-missing-events>기록 내보내기</button></p>`;
      // 사이트 DB에는 없어도 원본이 알려진 하드웨어 드라이버 모듈이면(nvlddmkm 등)
      // 그 자체로 강한 단서다. 일반 안내로 뭉개지 않고 무슨 드라이버인지 바로
      // 알려주고, 진단 카트(종합 AI 분석)에도 담을 수 있게 한다 — 지금까지는
      // 매칭된 entry가 있을 때만 카트에 담을 수 있어 이런 신호는 그냥 버려졌다.
      if (driverInfo) {
        const urgencyLine = isSevere
          ? `${escapeEventText(levelLabel)} 수준으로 기록되어 있어, 실제로 이 드라이버·장치에서 문제가 발생했을 가능성이 있습니다.`
          : "정보·경고 수준이지만, 화면 멈춤·장치 끊김 같은 증상과 시각이 겹치는지 확인해 보세요.";
        const basketButton = buildAddToBasketButton({
          type: "event",
          key: `driver-${fields?.id || "0"}-${fields?.source || "unknown"}`,
          title: `${driverInfo.vendor} ${driverInfo.category} 이벤트 (ID ${fields?.id || "?"})`,
          summary: driverInfo.desc,
          causes: [driverInfo.desc, ...eventDataLines],
          checks: [],
          time: fields?.time || eventTime,
          tone: isSevere ? "danger" : "info",
          evidence: buildEventEvidence({ fields, repeatCount, selectedLevel, eventTime }),
        });
        return `<div class="event-empty event-empty--driver"><strong>${escapeEventText(driverInfo.vendor)} ${escapeEventText(driverInfo.category)}가 남긴 이벤트입니다.</strong><p>이벤트 ID ${escapeEventText(fields?.id || "")}는 사이트 DB에 없지만, 원본 <strong>${escapeEventText(fields?.source || "")}</strong>은 ${escapeEventText(driverInfo.desc)}</p><p>${urgencyLine}</p>${eventDataLines.length ? `<section class="event-detail-values"><h5>XML 세부값</h5><ul>${eventDataLines.map((line) => `<li>${escapeEventText(line)}</li>`).join("")}</ul></section>` : ""}<div class="result-card-actions">${basketButton}</div>${missingNote}</div>`;
      }
      const extractedHint = fields?.eventData?.length ? `<p>XML에서 세부값 ${fields.eventData.length}개를 읽었지만, 현재 사이트의 해석 데이터에는 없는 이벤트입니다.</p>` : "";
      const severeBasketButton = isSevere ? `<div class="result-card-actions">${buildAddToBasketButton({
        type: "event",
        key: `unmatched-${fields?.id || "0"}-${fields?.source || "unknown"}`,
        title: `미등록 이벤트 (ID ${fields?.id || "?"} · ${fields?.source || "원본 미상"})`,
        summary: `${levelLabel} 수준으로 기록된 미등록 이벤트입니다.`,
        causes: eventDataLines,
        checks: [],
        time: fields?.time || eventTime,
        tone: "danger",
        evidence: buildEventEvidence({ fields, repeatCount: 1, selectedLevel, eventTime }),
      })}</div>` : "";
      return `<div class="event-empty"><strong>사이트에 등록되지 않은 이벤트입니다.</strong><p>이벤트 ID ${escapeEventText(fields?.id || "")} ${fields?.source ? `(${escapeEventText(fields.source)})` : ""}의 일반적인 의미를 아직 제공하지 않습니다. 원본과 XML 세부값을 보관해 Microsoft 문서나 전문가와 함께 확인하세요.</p>${extractedHint}${severeBasketButton}${missingNote}<p><a href="event-viewer-guide.html">이벤트 ID·원본·XML 확인 방법</a></p></div>`;
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
      fields.logName && ["로그", fields.logName], (fields.time || eventTime) && ["발생 시각", fields.time || eventTime],
      fields.task && ["작업 범주", fields.task], fields.bugcheckCode && ["BugcheckCode", fields.bugcheckCode],
      fields.device && ["장치·드라이버", fields.device], fields.imageName && ["이미지·모듈", fields.imageName],
      fields.processName && ["프로세스", fields.processName], selectedLevel && ["입력 수준", selectedLevel],
      repeatCount && ["반복 횟수", `${repeatCount}회`]
    ].filter(Boolean);
    const extracted = [
      fields.provider && ["공급자", fields.provider], fields.eventRecordId && ["레코드 ID", fields.eventRecordId],
      fields.computer && ["컴퓨터", fields.computer], fields.opcode && ["Opcode", fields.opcode],
      fields.keywords && ["Keywords", fields.keywords], fields.errorType && ["오류 유형", fields.errorType],
      fields.errorSource && ["오류 원본", fields.errorSource], fields.apicId && ["APIC ID", fields.apicId]
      , fields.statusCode && ["상태 코드", fields.statusCode], fields.errorCode && ["오류 코드", fields.errorCode]
      , fields.deviceName && ["장치 이름", fields.deviceName], fields.volumeName && ["볼륨", fields.volumeName]
      , fields.failureBucketId && ["FailureBucketId", fields.failureBucketId], fields.reportId && ["ReportId", fields.reportId]
      , ...((fields.parameters || []).length ? [["매개변수", fields.parameters.join(" · ")]] : [])
    ].filter(Boolean);
    const dataRows = (fields.eventData || []).filter(({ name }) => !/rawdata/i.test(name)).slice(0, 8);
    // 텍스트 저장·복사에 공통으로 쓰는 전체 결과 텍스트. 이벤트 ID·발생 시각·
    // 세부값뿐 아니라 원인 후보·점검 순서·주의사항까지 담아 수리점·커뮤니티에
    // 공유하기 전 한 파일로 정리할 수 있게 한다. fields는 이미 maskEventPrivacy를
    // 거친 값이라 별도 마스킹이 필요 없다.
    const fullResultText = [
      `이벤트 ${entry.id} · ${entry.source}`,
      entry.summary,
      `위험도: ${tone.label}`,
      `발생 시각: ${fields.time || eventTime || "입력되지 않음"}`,
      `반복 횟수: ${repeatCount}회`,
      ...(timing ? [`반복 패턴: ${timing.rangeText} · ${timing.patternLabel}`, ...(timing.nearbyText ? [timing.nearbyText] : [])] : []),
      ...extracted.map(([label, value]) => `${label}: ${value}`),
      "", "◆ 주요 원인 후보", ...entry.causes.map((v) => `- ${v}`),
      "", "◆ 먼저 할 점검", ...entry.checks.map((v, i) => `${i + 1}. ${v}`),
      "", "◆ 주의할 점", ...entry.warnings.map((v) => `- ${v}`),
      "", "※ 이벤트 하나만으로 특정 부품 고장을 확정할 수 없습니다. 같은 시각의 다른 이벤트, 반복 조건을 함께 비교하세요.",
      "  이 결과는 브라우저에서 생성되었으며 컴퓨터 이름·사용자 이름은 자동으로 가려졌습니다. — itsvc.co.kr"
    ].join("\n");
    const toneHint = tone.key === "danger"
      ? "반복되면 중요한 파일을 먼저 백업하고 원인 점검을 시작하세요."
      : tone.key === "warning"
        ? "한 번의 기록보다 같은 작업에서 반복되는지 확인하는 것이 중요합니다."
        : tone.key === "info"
          ? "드라이버와 설정 변경 시점을 먼저 비교해 보세요."
          : "실제 증상과 같은 시각에 발생했는지 확인한 뒤 판단하세요.";
    return `
      <article class="event-result event-result--${tone.key}">
        <header class="event-result-head">
          <div><span class="event-id">이벤트 ${escapeEventText(entry.id)}</span><h4>${escapeEventText(entry.source)}</h4></div>
          <span class="event-risk">${tone.label}</span>
        </header>
        <section class="event-quick-summary"><span>한눈에 보기</span><strong>${escapeEventText(entry.summary)}</strong><p>${toneHint}</p></section>
        ${timing ? `<section class="event-timing-note"><h5>반복 패턴</h5><p>${escapeEventText(timing.rangeText)} · ${escapeEventText(timing.patternLabel)}</p>${timing.nearbyText ? `<p class="event-timing-nearby">${escapeEventText(timing.nearbyText)}</p>` : ""}</section>` : ""}
        ${observed.length ? `<dl class="event-observed">${observed.map(([label, value]) => `<div><dt>${escapeEventText(label)}</dt><dd>${escapeEventText(value)}</dd></div>`).join("")}</dl>` : ""}
        ${(extracted.length || dataRows.length || fields.rawDataLength) ? `<section class="event-detail-values"><h5>자동 추출된 세부값</h5>${extracted.length ? `<dl>${extracted.map(([label, value]) => `<div><dt>${escapeEventText(label)}</dt><dd>${escapeEventText(value)}</dd></div>`).join("")}</dl>` : ""}${dataRows.length ? `<details class="event-technical-details"><summary>XML 이벤트 데이터 ${dataRows.length}개 보기</summary><div class="event-data-list">${dataRows.map(({ name, value }) => `<div class="event-data-row"><span>${escapeEventText(name)}</span><code>${escapeEventText(value)}</code></div>`).join("")}</div></details>` : ""}${fields.rawDataLength ? `<p class="event-raw-note">RawData ${fields.rawDataLength}자도 추출됐습니다. 값이 길어 화면에는 요약하지 않았으며, 원문 XML은 별도로 보관할 수 있습니다.</p>` : ""}</section>` : ""}
        <section><h5>이 기록만으로 확정할 수 없는 내용</h5><p>이벤트 하나만으로 특정 부품 고장이나 드라이버 문제를 확정할 수 없습니다. 발생 직전 작업, 같은 시각의 다른 이벤트, 반복 조건을 함께 비교해야 합니다.</p></section>
        <div class="event-result-grid">
          <section><h5>주요 원인 후보</h5><ul>${entry.causes.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ul></section>
          <section><h5>먼저 할 점검</h5><ol>${entry.checks.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ol></section>
        </div>
        <section class="event-warning"><h5>주의할 점</h5><ul>${entry.warnings.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ul></section>
        ${(relatedCodes || relatedGuides || officialLinks || entry.detailPage) ? `<nav class="event-links" aria-label="관련 자료">${entry.detailPage ? `<a href="${entry.detailPage}">이 이벤트 상세 설명</a>` : ""}${relatedCodes}${relatedGuides}${officialLinks}</nav>` : ""}
        <div class="result-card-actions">
          ${buildSaveCardButton({
            eyebrow: `이벤트 ${entry.id} · ${entry.source}`,
            title: `${entry.source} ${entry.id}`,
            tone: tone.key,
            lines: [entry.summary, `반복 횟수: ${repeatCount}회`, tone.label]
          })}
          ${buildAddToBasketButton({
            type: "event",
            key: `${entry.id}-${entry.source}`,
            title: `이벤트 ${entry.id} · ${entry.source}`,
            summary: entry.summary,
            causes: entry.causes,
            checks: entry.checks,
            time: fields.time || eventTime,
            tone: tone.key,
            evidence: buildEventEvidence({ fields, entry, repeatCount, selectedLevel, eventTime, timing }),
          })}
          <button class="btn secondary" type="button" data-copy-event-result="${escapeEventText(fullResultText)}">결과 복사</button>
          <button class="btn secondary save-text-btn" type="button" data-save-text-simple="${escapeEventText(fullResultText)}" data-save-text-filename="이벤트-${escapeEventText(entry.id)}-${escapeEventText(entry.source)}">텍스트로 저장</button>
          <p class="log-privacy-note">서버 전송 없이 브라우저에서 만들어지며, 컴퓨터 이름·사용자 이름은 저장 전 자동으로 가려집니다.</p>
        </div>
      </article>`;
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
        src="assets/diagnostic-pc-parts-v2.jpg"
        width="1672"
        height="941"
        decoding="async"
        alt="메인보드 보조전원, CPU, RAM, GPU, M.2 SSD, SATA 포트, CMOS 배터리와 PSU가 표시된 데스크톱 PC 부품도"
      >
    </div>
  `;

const renderBoardSection = () => {
    const parts = data.boardParts || [];
    if (!parts.length) return "";
    return `
      <section class="board-section" aria-label="PC 부품도 진단">
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
      boot: new Set(["auto-repair", "bsod-critical-process", "update-fail-loop", "startup-slow", "win11-upgrade-blocked"]),
      power: new Set(["gaming-reboot", "overheat-shutdown", "sleep-resume-fail", "no-power", "amd-cpu-cooler-pressure-no-post"]),
      device: new Set(["printer-add-freeze", "no-display", "dual-monitor-dp-not-detected", "nvme-delay", "usb-not-detected", "wifi-disconnect", "sound-not-working", "bluetooth-not-found", "gpu-coil-whine", "gpu-not-detected", "screen-flicker", "printer-offline", "update-network-broken", "keyboard-mouse-not-detected", "fan-noise", "network-drive-error"]),
      performance: new Set(["explorer-freeze", "taskbar-freeze", "disk-usage-100", "app-not-launching", "black-screen-after-login", "browser-not-responding", "install-failure", "game-launch-error", "game-connection-error", "activation-error", "ms-account-login-fail", "copy-paste-not-working", "store-error"]),
    };
    let selectedSymptomGroup = "all";
    let selectedSymptomId = "";
    const symptomMatchesGroup = (item, group) => group === "all" || symptomGroupMap[group]?.has(item.id);
    // 전원 불안정 계열 증상: 원인이 겹치는 경우가 많아 다른 증상을 함께 담아
    // 종합진단하도록 유도하고, 이번 달 Windows 업데이트 이슈도 함께 안내한다.
    const POWER_INSTABILITY_SYMPTOM_IDS = new Set(["gaming-reboot", "overheat-shutdown", "sleep-resume-fail", "no-power", "no-display", "amd-cpu-cooler-pressure-no-post"]);
    const buildPowerInstabilityHints = (symptom) => {
      if (!POWER_INSTABILITY_SYMPTOM_IDS.has(symptom.id)) return "";
      return `
        <div class="result-hint result-hint--basket">
          <p><strong>화면 미출력, 간헐적 재부팅, 사용 중 다운처럼 증상이 여러 개 겹치나요?</strong> 관련 증상을 각각 "진단 카트에 담기"로 모은 뒤 종합진단 탭에서 함께 분석하면 원인을 더 좁힐 수 있습니다.</p>
        </div>
        <div class="result-hint result-hint--update">
          <p><strong>⚠ 최근 Windows 업데이트 이후 증상이 시작됐나요?</strong> 이번 달 배포된 업데이트에서 비슷한 증상이 이미 보고된 경우가 있습니다. <a href="windows-update-tracker.html">이번 달 업데이트 이슈 확인 →</a></p>
        </div>
      `;
    };
    const renderSymptomCard = (item) => `
      <button class="diag-card${item.id === selectedSymptomId ? " active" : ""}" data-symptom="${item.id}">
        <span class="diag-title">${item.title}</span>
        <span class="diag-summary">${item.summary}</span>
      </button>
    `;

    document.querySelector('.diagnostic-static')?.setAttribute('hidden', '');
    diagnosticRoot.innerHTML = `
      <div class="diagnostic-mode-tabs" role="tablist" aria-label="진단 방법 선택">
        <button type="button" class="diagnostic-mode-tab active" role="tab" aria-selected="true" aria-controls="diagnostic-symptom" data-diagnostic-mode="symptom"><strong>증상</strong><span>보이는 문제로 찾기</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-code" data-diagnostic-mode="code"><strong>오류 코드</strong><span>코드 직접 입력</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-parts" data-diagnostic-mode="parts"><strong>PC 부품</strong><span>이미지에서 선택</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-event" data-diagnostic-mode="event"><strong>이벤트 뷰어</strong><span>ID·원본으로 찾기</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-log" data-diagnostic-mode="log"><strong>로그 분석</strong><span>고급 진단</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-minidump" data-diagnostic-mode="minidump"><strong>미니덤프</strong><span>BSOD 덤프 파일 분석</span></button>
        <button type="button" class="diagnostic-mode-tab" role="tab" aria-selected="false" aria-controls="diagnostic-ai" data-diagnostic-mode="ai"><strong>AI에게 물어보기</strong><span>자유롭게 질문하기</span></button>
        <button type="button" class="diagnostic-mode-tab diagnostic-mode-tab--combined" role="tab" aria-selected="false" aria-controls="diagnostic-combined" data-diagnostic-mode="combined"><strong>종합진단<span class="basket-tab-badge" data-basket-tab-count hidden>0</span></strong><span>모아서 한번에 분석</span></button>
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
          <div><p class="eyebrow">오류 코드 입력</p><h3>오류 코드를 단서로 원인을 좁혀 보세요</h3></div>
          <p class="muted">예: 0xC000021A, 0x0000007B, 0x80070002</p>
        </div>
        <section class="code-analysis-guide" aria-labelledby="code-analysis-guide-title">
          <h4 id="code-analysis-guide-title">오류 코드는 이렇게 분석하세요</h4>
          <p>코드 하나만으로 고장 부품을 확정하지 않습니다. <strong>발생 시점, 직전에 한 작업, 반복 여부</strong>를 코드와 함께 비교해야 원인 범위를 줄일 수 있습니다.</p>
          <ol class="code-analysis-steps">
            <li><strong>코드를 원문 그대로 기록</strong><span>앞의 <code>0x</code>와 숫자·문자를 포함해 블루스크린, 이벤트 뷰어, 설치 화면에 표시된 값을 입력합니다.</span></li>
            <li><strong>발생 조건을 분리</strong><span>부팅 중인지, 게임·절전 복귀·업데이트 중인지, 특정 작업에서만 반복되는지 기록합니다.</span></li>
            <li><strong>원인 후보와 점검 결과를 대조</strong><span>결과의 원인 목록을 그대로 믿기보다 안전 모드, 기본 BIOS 설정, 드라이버 롤백처럼 되돌리기 쉬운 항목부터 비교합니다.</span></li>
            <li><strong>추가 증거로 확정 범위를 좁힘</strong><span>반복되면 이벤트 뷰어의 같은 시각 기록과 <a href="minidump-analyzer.html">미니덤프</a>를 함께 확인합니다.</span></li>
          </ol>
          <div class="code-analysis-note"><strong>입력 전에 같이 적어 두면 좋은 정보</strong><span>발생 시각 · 최근 설치·업데이트 · 온도·전원 상태 · 이벤트 ID · 덤프 파일 생성 여부</span></div>
          <p class="code-analysis-links"><a href="event-viewer-guide.html">이벤트 뷰어 기록 확인 방법</a><a href="common-error-codes.html">오류 코드 해석 기준 보기</a></p>
        </section>
        ${renderKindFilters()}
        <div class="code-search">
          <label class="sr-only" for="error-code-input">에러 코드</label>
          <input id="error-code-input" class="code-input" type="text" placeholder="에러 코드 입력" inputmode="text" autocomplete="off">
          <div class="code-actions">
            <button class="btn primary code-button" type="button" data-code-search>확인</button>
            <button class="btn secondary code-button" type="button" data-code-clear>지우기</button>
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
        <div class="log-format-picker">
          <p class="log-format-label">어떤 로그를 올리시나요?</p>
          <div class="log-format-btns" role="group" aria-label="로그 종류 선택">
            <button type="button" class="log-format-btn" data-log-format="dxdiag">dxdiag</button>
            <button type="button" class="log-format-btn" data-log-format="msinfo32">msinfo32</button>
            <button type="button" class="log-format-btn" data-log-format="crystaldiskinfo">CrystalDiskInfo</button>
            <button type="button" class="log-format-btn" data-log-format="hwinfo">HWiNFO</button>
          </div>
          <p class="log-format-hint" data-log-selection-status>로그 종류를 선택하면 해당 형식에 맞는 파일 첨부와 분석 기준이 활성화됩니다. 선택하지 않아도 텍스트 붙여넣기는 자동 판별합니다.</p>
        </div>

        <div class="card" style="margin-bottom:1rem">
          <p class="eyebrow" style="margin:0 0 .5rem">로그 파일 만드는 방법 (한글 Windows 10/11)</p>
          <p style="margin:0 0 .7rem;font-size:.84rem;line-height:1.7">확인하려는 내용에 따라 아래 중 하나를 만들어 올리면 됩니다. 무엇을 볼지 모르겠다면 <strong>dxdiag</strong>부터 시작하세요. 별도 설치 없이 전체 사양을 한 번에 담습니다.</p>

          <details data-log-guide="dxdiag" open style="border-top:1px solid var(--border);padding-top:.65rem">
            <summary style="cursor:pointer;font-size:.84rem;font-weight:600;list-style:none"><span class="sum-caret" aria-hidden="true">▾</span> ① dxdiag — 전체 사양·그래픽 (설치 불필요)</summary>
            <ol style="margin:.5rem 0 .3rem;padding-left:1.4rem;line-height:1.9;font-size:.83rem">
              <li><strong>Win + R</strong> → <code style="background:var(--bg-subtle,#f1f5f9);padding:.15rem .45rem;border-radius:5px">dxdiag</code> 입력 → Enter</li>
              <li>정보 수집이 끝날 때까지 잠시 기다립니다</li>
              <li>아래쪽 <strong>모든 정보 저장</strong> 클릭 → 바탕화면에 <code style="font-size:.82rem">DxDiag.txt</code> 저장</li>
            </ol>
            <p style="margin:.2rem 0 0;font-size:.79rem;color:var(--text-muted,#6b7280)">CPU·RAM·그래픽카드·드라이버 버전과 최근 오류 기록이 함께 담깁니다.</p>
          </details>

          <details data-log-guide="msinfo32" open style="margin-top:.55rem;border-top:1px solid var(--border);padding-top:.65rem">
            <summary style="cursor:pointer;font-size:.84rem;font-weight:600;list-style:none"><span class="sum-caret" aria-hidden="true">▾</span> ② msinfo32 — 시스템 요약·장치 충돌 (설치 불필요)</summary>
            <ol style="margin:.5rem 0 .3rem;padding-left:1.4rem;line-height:1.9;font-size:.83rem">
              <li><strong>Win + R</strong> → <code style="background:var(--bg-subtle,#f1f5f9);padding:.15rem .45rem;border-radius:5px">msinfo32</code> 입력 → Enter</li>
              <li>왼쪽에서 <strong>시스템 요약</strong>을 선택합니다</li>
              <li>메뉴의 <strong>파일 → 내보내기</strong> → 텍스트 파일로 저장</li>
            </ol>
            <p style="margin:.2rem 0 0;font-size:.79rem;color:var(--text-muted,#6b7280)">전체를 내보내면 파일이 매우 커집니다. 장치 문제만 볼 때는 <strong>구성 요소 → 문제 있는 장치</strong>만 선택해 내보내세요.</p>
          </details>

          <details data-log-guide="crystaldiskinfo" open style="margin-top:.55rem;border-top:1px solid var(--border);padding-top:.65rem">
            <summary style="cursor:pointer;font-size:.84rem;font-weight:600;list-style:none"><span class="sum-caret" aria-hidden="true">▾</span> ③ CrystalDiskInfo — SSD·HDD 건강 상태</summary>
            <ol style="margin:.5rem 0 .3rem;padding-left:1.4rem;line-height:1.9;font-size:.83rem">
              <li>CrystalDiskInfo를 실행합니다</li>
              <li>메뉴의 <strong>편집 → 복사</strong>를 누르면 현재 디스크 정보가 클립보드에 담깁니다</li>
              <li>아래 입력창에 그대로 붙여넣습니다</li>
            </ol>
            <p style="margin:.2rem 0 0;font-size:.79rem;color:var(--text-muted,#6b7280)">재할당된 섹터 수, 대기 중 섹터 수, 총 사용 시간이 핵심입니다. 디스크가 여러 개면 문제가 의심되는 것을 선택한 뒤 복사하세요.</p>
          </details>

          <details data-log-guide="hwinfo" open style="margin-top:.55rem;border-top:1px solid var(--border);padding-top:.65rem">
            <summary style="cursor:pointer;font-size:.84rem;font-weight:600;list-style:none"><span class="sum-caret" aria-hidden="true">▾</span> ④ HWiNFO — 온도·전압 (발열·전원 의심 시)</summary>
            <ol style="margin:.5rem 0 .3rem;padding-left:1.4rem;line-height:1.9;font-size:.83rem">
              <li>HWiNFO를 <strong>Sensors-only</strong> 모드로 실행합니다</li>
              <li>문제가 나타나는 작업(게임·렌더링 등)을 10분 이상 진행합니다</li>
              <li>센서 창 아래 <strong>저장</strong>(로깅) 버튼으로 기록을 시작하면 <code>.csv</code> 파일로 저장됩니다</li>
              <li>기록을 멈춘 뒤 그 <code>.csv</code>를 올리거나, 간단히 확인만 할 때는 센서 화면 내용을 복사해 붙여넣어도 됩니다</li>
            </ol>
            <p style="margin:.2rem 0 0;font-size:.79rem;color:var(--text-muted,#6b7280)">최대값이 중요합니다. 부하 중 CPU·GPU 최고 온도와 전압 변동 폭을 함께 보세요. 로깅 <code>.csv</code>는 1초 간격 기록이라 시간이 길면 파일이 매우 커집니다. 문제가 나타난 구간만 남기고 올리는 편이 좋습니다.</p>
          </details>

          <p style="margin:.75rem 0 0;font-size:.79rem;color:var(--text-muted,#6b7280);border-top:1px solid var(--border);padding-top:.6rem"><strong>올리기 전 확인</strong> 로그에는 컴퓨터 이름과 사용자 이름이 포함될 수 있습니다. 이 도구는 브라우저에서만 처리하지만, 로그를 다른 곳에 공유할 때는 해당 부분을 가리세요.</p>
        </div>

        <div class="log-panel-grid">
          <div class="log-panel-inputs">
            <label class="sr-only" for="hardware-log-input">하드웨어 로그</label>
            <textarea id="hardware-log-input" class="code-input log-input" rows="10" placeholder="하드웨어 정보 로그를 붙여넣거나 파일을 선택하세요."></textarea>
            <div class="log-actions">
              <button class="btn primary code-button" type="button" data-log-analyze>분석</button>
              <button class="btn secondary code-button" type="button" data-log-clear>지우기</button>
              <label class="btn secondary log-file-button is-disabled" data-log-file-label aria-disabled="true">
                <span class="log-file-icon" aria-hidden="true">💾</span> <span data-log-file-label-text>로그 종류 선택</span>
                <input type="file" accept=".txt,.log,.csv,text/plain,text/csv" data-log-file disabled multiple>
              </label>
            </div>
            <div class="log-drop" data-log-drop>
              <span class="log-drop-icon" aria-hidden="true">💾</span>
              <span>파일을 끌어다 놓아도 됩니다 <span class="muted">(.txt · .log · .csv)</span></span>
            </div>
            <p class="log-privacy-note">파일을 선택하거나 끌어다 놓으면 "분석" 버튼을 누르지 않아도 바로 분석 결과가 표시됩니다. HWiNFO CSV는 여러 개를 한 번에 선택하면 재부팅으로 나뉜 세션들을 함께 비교합니다.</p>
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
        <section class="event-input-guide" aria-labelledby="event-input-guide-title">
          <div class="event-input-guide-head"><strong id="event-input-guide-title">아래 방법 중 하나로 시작하세요</strong></div>
          <div class="event-input-guide-grid">
            <article class="event-input-guide-card"><span class="event-input-guide-number">1</span><div><strong>파일 첨부</strong><p>이벤트 뷰어에서 저장한 <strong>.evtx</strong> 파일을 그대로 불러오면 ID·원본·발생 시각을 자동으로 읽습니다. TXT·LOG·XML 붙여넣기도 지원합니다.</p></div></article>
            <article class="event-input-guide-card"><span class="event-input-guide-number">2</span><div><strong>ID 직접 입력</strong><p><code>41</code>, <code>129</code>, <code>1001</code>처럼 ID만 넣어도 됩니다.</p></div></article>
          </div>
          <details class="event-xml-help"><summary>지난 7일 로그 파일을 통째로 저장하려면?</summary><ol><li><strong>Windows 로그 → 시스템</strong>(또는 확인할 로그)에서 <strong>현재 로그 필터링</strong>을 열고 <strong>로그 기간</strong>을 <strong>지난 7일</strong>로 선택한 뒤 확인을 누릅니다.<img src="assets/evtx-filter-last7days.jpg" alt="현재 로그 필터링 대화상자에서 로그 기간을 지난 7일로 선택한 화면" loading="lazy" width="543" height="551" class="guide-image"></li><li>필터가 적용된 상태에서 오른쪽 <strong>작업</strong> 패널의 <strong>필터링된 로그 파일을 다른 이름으로 저장...</strong>을 클릭합니다. 이 메뉴로 저장되는 파일의 확장자는 <strong><code>.evtx</code></strong>이며, 저장 대화상자의 파일 형식도 기본값이 <strong>이벤트 파일(*.evtx)</strong>로 지정되어 있으므로 그대로 저장하면 됩니다.<img src="assets/evtx-save-filtered-log-v2.jpg" alt="작업 패널에서 필터링된 로그 파일을 다른 이름으로 저장 메뉴를 선택한 화면" loading="lazy" width="352" height="719" class="guide-image"></li><li>저장 위치와 이름을 정해 저장하면 <strong>디스플레이 정보</strong> 창이 뜹니다. <strong>이 언어에 대한 디스플레이 정보(D)</strong>를 고르고 <strong>한국어(대한민국)</strong>에 체크한 뒤 확인을 누릅니다.<img src="assets/evtx-display-info.jpg" alt="디스플레이 정보 대화상자에서 한국어(대한민국)를 선택한 화면" loading="lazy" width="352" height="393" class="guide-image"></li></ol><p>파일에는 컴퓨터 이름·사용자 이름이 남아있을 수 있으니 다른 사람과 공유할 때는 확인해 주세요.</p></details>
        </section>
        <form class="event-form" data-event-form>
          <div class="event-fields">
            <label><span>이벤트 ID</span><input class="code-input" type="text" inputmode="numeric" placeholder="예: 41, 1000, 129" data-event-id></label>
            <label><span>원본</span><input class="code-input" type="text" list="event-source-list" placeholder="예: Kernel-Power" data-event-source></label>
            <datalist id="event-source-list">${[...new Set((data.eventViewerCodes || []).map((item) => item.source))].map((source) => `<option value="${source}"></option>`).join("")}</datalist>
            <label><span>수준</span><select class="code-input" data-event-level><option value="">선택 안 함</option><option>오류</option><option>경고</option><option>정보</option><option>치명적</option></select></label>
            <label class="event-time-field"><span>발생 시각 <small>선택</small></span><input class="code-input" type="datetime-local" data-event-time aria-describedby="event-time-help"><em id="event-time-help">오류가 발생한 날짜와 시간을 선택하세요.</em></label>
            <label><span>반복 횟수</span><input class="code-input" type="number" min="1" max="9999" value="1" data-event-repeat></label>
          </div>
          <label class="event-description-label"><span>설명·XML 붙여넣기</span><textarea class="code-input event-input" rows="10" placeholder="일반 탭 설명, XML 또는 Get-WinEvent 결과를 붙여넣으세요." data-event-text></textarea></label>
          <div class="log-actions">
            <button class="btn primary code-button" type="submit">이벤트 분석</button>
            <button class="btn secondary code-button" type="button" data-event-clear>지우기</button>
            <label class="btn secondary log-file-button">
              <span class="log-file-icon" aria-hidden="true">💾</span> TXT·LOG·XML·EVTX 불러오기
              <input type="file" accept=".txt,.log,.xml,.evtx,text/plain,text/xml,application/xml" data-event-file>
            </label>
          </div>
          <div class="log-drop" data-event-drop>
            <span class="log-drop-icon" aria-hidden="true">💾</span>
            <span>파일을 끌어다 놓아도 됩니다 <span class="muted">(.txt · .log · .xml · .evtx)</span></span>
          </div>
          <p class="log-privacy-note">파일을 선택하거나 끌어다 놓으면 "이벤트 분석" 버튼을 누르지 않아도 바로 분석 결과가 표시됩니다.</p>
        </form>
        <div class="event-result-shell" aria-live="polite" data-event-result><p>이벤트 ID만 입력해도 검색할 수 있습니다. 원본과 설명을 함께 넣으면 같은 ID의 다른 의미를 구분하기 쉽습니다.</p></div>
      </section>

      <section id="diagnostic-ai" class="diagnostic-mode-panel ai-panel" role="tabpanel" data-diagnostic-panel="ai" hidden>
        <div class="code-panel-head">
          <div><p class="eyebrow">AI 진단 (베타)</p><h3>증상을 자유롭게 설명하면 관련 자료를 찾아 답변합니다</h3></div>
        </div>
        <p class="log-privacy-note"><strong>참고</strong> AI 답변은 사이트에 있는 오류코드·이벤트·증상 자료에 근거해 생성되며, 참고 자료를 벗어난 추측은 하지 않도록 설계되어 있습니다. 답변은 참고용이며, 정확한 진단은 관련 문서를 함께 확인하세요.</p>
        <form class="ai-ask-form" data-ai-form>
          <label class="sr-only" for="ai-question-input">질문</label>
          <textarea id="ai-question-input" class="code-input" rows="3" placeholder="예: 게임하다가 갑자기 재부팅되고 이벤트 41이 떴어요" data-ai-question></textarea>
          <label class="ai-improvement-consent">
            <input type="checkbox" data-ai-save-consent>
            <span><strong>선택 동의:</strong> 문의 내용을 개인정보가 드러나지 않도록 가린 뒤 사이트 진단 자료 개선에 활용하는 데 동의합니다. 동의하지 않아도 AI 진단을 이용할 수 있으며, 동의한 문의는 90일 후 삭제됩니다.</span>
          </label>
          <div class="log-actions">
            <button class="btn primary code-button" type="submit">AI에게 물어보기</button>
            <button class="btn secondary code-button" type="button" data-ai-clear>지우기</button>
          </div>
        </form>
        <div class="result-box ai-result" aria-live="polite" data-ai-result>
          <p>증상이나 오류 상황을 문장으로 입력하면 관련 원인과 점검 순서를 찾아드립니다.</p>
        </div>
      </section>

      <section id="diagnostic-minidump" class="diagnostic-mode-panel" role="tabpanel" data-diagnostic-panel="minidump" hidden>
        <div class="code-panel-head">
          <div><p class="eyebrow">BSOD 미니덤프 분석</p><h3>블루스크린 덤프 파일로 원인 드라이버를 찾아냅니다</h3></div>
        </div>
        <p class="log-privacy-note"><strong>개인정보 보호</strong> 미니덤프는 분석을 위해 서버로 전송되며 처리 후 저장·공유되지 않습니다. 업로드 전 사용자 이름과 파일 경로가 포함되지 않았는지 확인하세요.</p>

        <div class="card" style="margin-bottom:1rem">
          <p class="eyebrow" style="margin:0 0 .5rem">덤프 파일 찾기 (한글 Windows 10/11)</p>
          <ol style="margin:.4rem 0 .8rem;padding-left:1.4rem;line-height:1.9;font-size:.88rem">
            <li><strong>Win + R</strong> 키를 누른 뒤 아래 경로를 그대로 붙여넣고 Enter</li>
            <li style="list-style:none;margin:.1rem 0 .4rem -1.4rem;padding-left:0"><code style="background:var(--bg-subtle,#f1f5f9);padding:.2rem .55rem;border-radius:5px;font-size:.85rem;display:inline-block">%SystemRoot%\\Minidump</code></li>
            <li>폴더 안의 <strong>.dmp 파일</strong> 중 <strong>날짜가 가장 최근</strong>인 파일을 선택하세요</li>
            <li>파일명 예시: <code style="font-size:.82rem">072424-4312-01.dmp</code> <span class="muted">(월일년-시간-번호 형식)</span></li>
          </ol>
          <details style="margin-top:.75rem;border-top:1px solid var(--border);padding-top:.65rem">
            <summary style="cursor:pointer;font-size:.84rem;font-weight:600;list-style:none">⚠ 폴더가 비어 있거나 .dmp 파일이 없는 경우</summary>
            <div style="margin-top:.6rem;font-size:.83rem;line-height:1.8">
              <p style="margin:0 0 .5rem;font-weight:600">① 소형 메모리 덤프 생성 설정하기</p>
              <ol style="margin:0 0 .3rem;padding-left:1.3rem">
                <li><strong>Win + R</strong> → <code>systempropertiesadvanced</code> 입력 → Enter</li>
                <li>"고급 시스템 설정" 창 → <strong>고급</strong> 탭 → "시작 및 복구" 항목의 <strong>설정</strong> 클릭</li>
                <li>"디버깅 정보 쓰기" 드롭다운 → <strong>소형 메모리 덤프(256KB)</strong> 선택</li>
                <li>"소형 덤프 디렉터리"가 <code>%SystemRoot%\Minidump</code>인지 확인</li>
                <li><strong>확인</strong> → 재부팅 후 다음 블루스크린 발생 시 자동 생성됩니다</li>
              </ol>
              <p style="margin:.6rem 0 .3rem;font-size:.8rem;color:var(--text-muted,#6b7280)">또는: <strong>내 PC</strong>(바탕화면) 우클릭 → <strong>속성</strong> → <strong>고급 시스템 설정</strong> → 고급 탭 → 시작 및 복구 → 설정</p>
              <p style="margin:.6rem 0 .5rem;font-weight:600">② 블루스크린 화면이 너무 빨리 사라지는 경우</p>
              <ul style="margin:0 0 .3rem;padding-left:1.3rem">
                <li>같은 "시작 및 복구" 창에서 <strong>"시스템 오류" → "자동으로 다시 시작" 체크 해제</strong></li>
                <li>이후 블루스크린 발생 시 오류 화면이 유지되어 STOP 코드를 직접 메모할 수 있습니다</li>
              </ul>
              <p style="margin:.6rem 0 .5rem;font-weight:600">③ 이미 재시작된 경우 — 이벤트 뷰어에서 확인</p>
              <ol style="margin:0;padding-left:1.3rem">
                <li><strong>Win + R</strong> → <code>eventvwr</code> → Enter</li>
                <li>왼쪽 트리: <strong>Windows 로그 → 시스템</strong></li>
                <li>원본이 <strong>BugCheck</strong> 또는 <strong>Kernel-Power</strong>(이벤트 ID 41)인 항목 확인</li>
                <li>해당 이벤트를 <strong>이벤트 뷰어 탭</strong>에 붙여넣으면 추가 분석 가능합니다</li>
              </ol>
            </div>
          </details>
        </div>

        <div class="log-panel-grid">
          <div class="log-panel-inputs">
            <div class="dmp-drop-zone" data-dmp-drop role="button" tabindex="0" aria-label="미니덤프 파일 업로드">
              <div style="font-size:2rem;line-height:1;margin-bottom:.4rem">💾</div>
              <strong>.dmp 파일을 끌어다 놓거나 클릭해서 선택하세요</strong>
              <span class="muted" style="font-size:.82rem;display:block;margin-top:.2rem">Windows 미니덤프 (.dmp) · 최대 64 MB</span>
              <input type="file" accept=".dmp" data-dmp-file style="display:none">
            </div>
            <div class="log-actions" style="margin-top:.6rem">
              <label class="btn secondary log-file-button"><span class="log-file-icon" aria-hidden="true">💾</span> .dmp 파일 선택<input type="file" accept=".dmp" data-dmp-file-btn style="display:none"></label>
              <button type="button" class="btn secondary code-button" data-dmp-reset style="display:none">↺ 다시 선택</button>
            </div>
            <div class="card" style="margin-top:.9rem;padding:.7rem .9rem">
              <p class="eyebrow" style="margin:0 0 .4rem;font-size:.68rem">분석 결과에서 확인하는 것</p>
              <ul style="margin:0;padding-left:1.2rem;font-size:.82rem;line-height:1.8">
                <li><strong>STOP 코드</strong> — BSOD 화면에 표시되는 오류 코드</li>
                <li><strong>원인 드라이버</strong> — 예외를 일으킨 .sys / .exe 파일명</li>
                <li><strong>조치 방법</strong> — 드라이버 업데이트·재설치 가이드</li>
                <li><strong>로드된 모듈 목록</strong> — 충돌 시점에 실행 중이던 드라이버 전체</li>
              </ul>
            </div>
          </div>
          <div class="result-box log-result" data-dmp-result aria-live="polite">
            <p>덤프 파일을 선택하면 STOP 코드와 원인 드라이버가 표시됩니다.</p>
          </div>
        </div>
      </section>

      <section id="diagnostic-combined" class="diagnostic-mode-panel" role="tabpanel" data-diagnostic-panel="combined" hidden>
        <div class="code-panel-head">
          <div><p class="eyebrow">종합진단</p><h3>모아둔 증상·오류코드·이벤트·로그·미니덤프·AI 질문을 한 번에 분석합니다</h3></div>
        </div>
        <section class="combined-howto" aria-labelledby="combined-howto-title">
          <h4 id="combined-howto-title">종합진단 이용 방법</h4>
          <p class="combined-howto-lead">각 진단 화면에서 확인한 단서를 한곳에 모아, 서로 관련이 있는지 비교하고 우선 점검 순서를 정리하는 기능입니다.</p>
          <ol class="combined-howto-steps">
            <li><strong>진단 화면에서 단서 찾기</strong><span>증상, 오류 코드, 이벤트 뷰어, 로그 분석 또는 미니덤프 탭에서 현재 문제와 관련된 결과를 확인합니다.</span></li>
            <li><strong>진단 카트에 담기</strong><span>결과 카드의 <b>진단 카트에 담기</b> 버튼을 눌러 같은 PC에서 발생한 단서를 모읍니다.</span></li>
            <li><strong>담은 항목 확인하기</strong><span>아래 목록에서 필요 없는 항목은 제거하고, 발생 시점이나 작업이 같은 항목만 남깁니다.</span></li>
            <li><strong>종합 분석하기</strong><span>버튼을 누르면 모은 정보를 비교해 가능성 높은 원인과 먼저 확인할 점검 순서를 보여줍니다.</span></li>
          </ol>
          <p class="combined-howto-note"><strong>참고:</strong> 항목이 많다고 진단이 더 정확해지는 것은 아닙니다. 같은 증상과 발생 시점에 관련된 자료부터 담아 주세요.</p>
        </section>
        <div class="diagnosis-basket" data-diagnosis-basket></div>
      </section>

      <div class="basket-confirm-overlay" data-confirm-overlay hidden>
        <div class="basket-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title">
          <p class="eyebrow" id="confirm-dialog-title" data-confirm-title>확인</p>
          <p class="basket-confirm-item" data-confirm-item></p>
          <p class="muted" data-confirm-message></p>
          <div class="basket-confirm-actions">
            <button type="button" class="btn secondary code-button" data-confirm-cancel>취소</button>
            <button type="button" class="btn primary code-button" data-confirm-ok>확인</button>
          </div>
        </div>
      </div>
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
    const logFileLabel = diagnosticRoot.querySelector("[data-log-file-label]");
    const logFileLabelText = diagnosticRoot.querySelector("[data-log-file-label-text]");
    const logDrop = diagnosticRoot.querySelector("[data-log-drop]");
    const logFormatPicker = diagnosticRoot.querySelector(".log-format-picker");
    const logSelectionStatus = diagnosticRoot.querySelector("[data-log-selection-status]");
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
        const text = [item.title, item.summary, ...(item.causes || []), ...(item.checks || []), ...(item.keywords || [])].join(" ").toLowerCase();
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
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${code.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>첫 점검 항목</strong></p>
        <ol>${[...code.checks, ...getSupplementalChecks(code)].map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${code.detailPage || code.link}">연결된 상세 가이드 열기</a></p>
        <div class="result-card-actions">
          ${buildSaveCardButton({
            eyebrow: kind.label,
            title: code.code,
            tone: "info",
            lines: [code.title, code.summary, `가장 가능성 높은 원인: ${code.causes[0]}`]
          })}
          ${buildAddToBasketButton({
            type: "code",
            key: code.code,
            title: `${code.code} · ${code.title}`,
            summary: code.summary,
            causes: code.causes,
            checks: [...code.checks, ...getSupplementalChecks(code)],
            tone: "neutral",
          })}
          <p class="log-privacy-note">서버 전송 없이 브라우저에서 이미지가 만들어집니다.</p>
        </div>
      `;
    };
    const clearSearch = () => {
      codeInput.value = "";
      suggestionsBox.hidden = true;
      suggestionsBox.innerHTML = "";
      codeResult.innerHTML = `<p>코드를 입력하면 관련 원인과 첫 점검 항목이 표시됩니다.</p>`;
    };
    let lastLogReport = null;
    let lastEventBasketBundle = null;
    const renderEventBatchButton = () => lastEventBasketBundle
      ? `<div class="event-batch-actions"><p>파일에서 읽은 이벤트의 ID·원본·발생 시각·XML 세부값을 하나의 분석 자료로 묶어 HWiNFO 로그와 함께 종합진단할 수 있습니다.</p><button type="button" class="btn primary code-button" data-basket-add-all-events>전체 이벤트 분석 결과를 진단 카트에 담기</button></div>`
      : "";
    let lastLogBasketBundle = null;
    const renderLogBatchButton = () => lastLogBasketBundle?.sessions?.length
      ? `<div class="event-batch-actions"><p>업로드한 ${lastLogBasketBundle.sessions.length}개 로그 세션의 분석 결과를 하나로 묶어 담을 수 있습니다.</p><button type="button" class="btn primary code-button" data-basket-add-all-logs>전체 로그 세션 분석 결과를 진단 카트에 담기</button></div>`
      : "";
    const renderHardwareLog = (value) => {
      // selectedLogFormat: 사용자가 로그 종류 칩을 직접 선택했다면 그 형식을
      // 그대로 강제 적용한다(아래에서 선언되지만, 이 함수는 이벤트로만
      // 호출되므로 실행 시점에는 이미 초기화되어 있다).
      const report = analyzeHardwareLog(value, selectedLogFormat || undefined);
      lastLogReport = report;
      lastLogBasketBundle = null;
      logResult.innerHTML = renderLogAnalysis(report);
    };
    const clearHardwareLog = () => {
      logInput.value = "";
      currentHardwareLogMeta = null;
      renderHardwareLog("");
    };
    const buildLogSummaryQuestion = (report) => {
      const fieldLine = report.fields.slice(0, 8).map((item) => `${item.label}: ${item.value}`).join(", ");
      const alertLine = report.alerts.slice(0, 4).map((item) => `${item.title}(${item.detail})`).join(", ");
      const highlightLine = report.highlights.slice(0, 3).map((line) => line.slice(0, 120)).join(" / ");
      return [
        "다음은 하드웨어 로그에서 자동으로 추출한 정보입니다. 어떤 문제가 의심되는지와 우선 점검 순서를 간단히 요약해 주세요.",
        `로그 종류: ${report.source.label}`,
        fieldLine ? `주요 항목: ${fieldLine}` : "",
        alertLine ? `경고 신호: ${alertLine}` : "",
        highlightLine ? `로그 내 특이 문장: ${highlightLine}` : "",
      ].filter(Boolean).join("\n");
    };
    const requestAiLogSummary = async () => {
      const report = lastLogReport;
      const resultBox = logResult.querySelector("[data-ai-log-summary-result]");
      if (!report || report.empty || !resultBox) return;
      resultBox.innerHTML = `<p class="muted">AI 진단 요약을 생성하는 중입니다… (최대 1분 정도 걸릴 수 있습니다)</p>`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_ASK_TIMEOUT_MS);
        const res = await fetch(`${AI_SERVICE_BASE_URL}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: buildLogSummaryQuestion(report) }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const answerHtml = data.answer
          ? renderMarkdownLite(data.answer)
          : `${renderAiMissingNotice("AI가 응답을 만들지 못했습니다.")}<p class="muted">위 점검 항목을 순서대로 확인해 주세요.</p>`;
        resultBox.innerHTML = `${answerHtml}${renderAiSources(data.sources)}`;
      } catch {
        resultBox.innerHTML = `${renderAiMissingNotice("AI 서비스에 연결할 수 없었습니다.")}<p class="muted">위에 표시된 점검 항목을 순서대로 확인해 주세요.</p>`;
      }
    };
    logResult.addEventListener("click", (event) => {
      if (event.target.closest("[data-ai-log-summary]")) requestAiLogSummary();
    });
    const formatDurationShort = (seconds) => {
      const total = Math.round(seconds);
      if (total < 60) return `${total}초`;
      if (total < 3600) return `${Math.round(total / 60)}분`;
      if (total < 86400) return `${(total / 3600).toFixed(1)}시간`;
      return `${(total / 86400).toFixed(1)}일`;
    };
    // HWiNFO 분석기(analyzeHardwareLog)와 같은 수준으로, evtx에서 읽은 여러 건의
    // 이벤트를 단순 반복 횟수로만 세지 않고 실제 발생 시각을 함께 본다.
    // 짧은 시간에 몰아서 발생했는지(burst), 일정 간격으로 반복되는지(periodic)를
    // 구분하면 "하드웨어가 순간적으로 고장났다"와 "예약 작업처럼 주기적으로
    // 발생한다"를 구분하는 데 직접적인 근거가 된다.
    const summarizeEventTiming = (times) => {
      if (times.length < 2) return null;
      const sorted = [...times].sort((a, b) => a - b);
      const intervals = sorted.slice(1).map((t, i) => (t - sorted[i]) / 1000).filter((seconds) => seconds >= 0);
      if (!intervals.length) return null;
      const avgIntervalSeconds = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      const variance = intervals.reduce((sum, value) => sum + (value - avgIntervalSeconds) ** 2, 0) / intervals.length;
      const stddev = Math.sqrt(variance);
      const burstRatio = intervals.filter((value) => value < 60).length / intervals.length;
      const pattern = burstRatio >= 0.6 ? "burst" : stddev / Math.max(avgIntervalSeconds, 1) < 0.3 ? "periodic" : "irregular";
      return {
        firstTime: sorted[0], lastTime: sorted[sorted.length - 1],
        spanSeconds: (sorted[sorted.length - 1] - sorted[0]) / 1000,
        avgIntervalSeconds, pattern, occurrences: sorted,
      };
    };
    // 서로 다른 이벤트 ID라도 같은 순간(±2분)에 자주 함께 기록됐다면 같은 원인일
    // 가능성이 있다는 신호다. HWiNFO의 "사용률과 클럭을 같은 행에서 함께 본다"와
    // 같은 발상 — 각 이벤트를 독립으로 보면 안 나오는 결론을, 시간축으로 맞춰봐야
    // 나온다. 그룹·기록이 너무 많으면(evtx 수천 건) 비용이 커지므로 상한을 둔다.
    const findNearbyEventGroups = (targetKey, groups) => {
      const target = groups.get(targetKey);
      if (!target?.times?.length || groups.size > 60) return [];
      const windowMs = 2 * 60 * 1000;
      const targetTimes = target.times.slice(0, 50);
      const nearby = [];
      groups.forEach((otherGroup, otherKey) => {
        if (otherKey === targetKey || !otherGroup.times.length) return;
        const otherTimes = otherGroup.times.slice(0, 50);
        const matches = targetTimes.filter((t) => otherTimes.some((ot) => Math.abs(ot - t) <= windowMs)).length;
        if (matches > 0) nearby.push({ fields: otherGroup.fields, matches });
      });
      return nearby.sort((a, b) => b.matches - a.matches).slice(0, 2);
    };
    const classifyEventDomain = (fields = {}) => {
      const id = String(fields.id || "").trim();
      const source = String(fields.source || "").toLowerCase();
      if (/(^|[^a-z])(disk|ntfs|storport|storahci|volmgr|volsnap)([^a-z]|$)/i.test(source) || [7, 9, 11, 15, 50, 51, 55, 57, 129, 153, 154, 157, 161, 162].includes(Number(id))) {
        return { key: "storage", label: "저장장치", tone: "danger", priority: 4, firstCheck: "중요 파일을 먼저 백업하고 SMART 상태·제조사 진단 도구를 확인" };
      }
      if (/(tcpip|dns|dhcp|e2fexpress|wlan|ndis|network)/i.test(source) || [27, 32, 1001, 1014, 4199, 4266].includes(Number(id))) {
        return { key: "network", label: "네트워크·DNS", tone: "warning", priority: 3, firstCheck: "랜 케이블·공유기·네트워크 드라이버·DNS 응답을 비교" };
      }
      if (/(nvlddmkm|display|amdwddmg|igfx|livekernelevent)/i.test(source) || [117, 141, 153, 4101].includes(Number(id))) {
        return { key: "graphics", label: "그래픽 드라이버", tone: "warning", priority: 2, firstCheck: "GPU 온도·보조전원과 그래픽 드라이버 설치 상태를 확인" };
      }
      if (/(security|defender|schannel)/i.test(source) || [4625, 4740, 1102, 36874, 36888, 7045].includes(Number(id))) {
        return { key: "security", label: "보안·인증", tone: "info", priority: 1, firstCheck: "실제 로그인·인증 장애와 반복 여부를 이벤트 시각과 대조" };
      }
      if (/(tpm)/i.test(source) || [15, 30].includes(Number(id))) {
        return { key: "tpm", label: "TPM·보안 칩", tone: "info", priority: 1, firstCheck: "BitLocker 복구 키를 확보한 뒤 TPM·BIOS 상태를 확인" };
      }
      return { key: "other", label: "Windows·응용 프로그램", tone: "info", priority: 0, firstCheck: "실제 기능 장애와 같은 시각에 발생했는지 확인" };
    };
    // 게임 중 화면 꺼짐·블루스크린·강제 재부팅과 직접 연결되는 이벤트를
    // 일반 이벤트 개수보다 먼저 보여주기 위한 별도 우선순위입니다.
    const classifyGameImpact = (fields = {}) => {
      const id = Number(String(fields.id || "").trim());
      const source = String(fields.source || "");
      if (/(nvlddmkm|amdwddmg|display|igfx|livekernelevent)/i.test(source) || [117, 141, 153, 4101].includes(id)) {
        return { priority: 5, label: "게임 중 화면 꺼짐·GPU 멈춤", reason: "그래픽 드라이버 응답·GPU 전원·온도·보조전원을 우선 확인" };
      }
      if (/(whea-logger|whea)/i.test(source) || (!source && [17, 18, 19, 20, 46, 47, 98, 140, 158].includes(id))) {
        return { priority: 5, label: "게임 중 블루스크린·하드웨어 오류", reason: "CPU·RAM·PCIe·전원·오버클럭 안정성을 우선 확인" };
      }
      if (/(kernel-power|eventlog)/i.test(source) && [41, 6008].includes(id)) {
        return { priority: 5, label: "게임 중 강제 재부팅·전원 꺼짐", reason: "PSU·전원 케이블·발열·오버클럭과 비정상 종료 직전 이벤트를 대조" };
      }
      if (/(windows error reporting|wer)/i.test(source) && id === 1001) {
        return { priority: 4, label: "블루스크린 보고", reason: "BugcheckCode·덤프 경로와 WHEA·GPU·Disk 이벤트를 확인" };
      }
      if (/(disk|ntfs|storport|storahci|volmgr|volsnap)/i.test(source) || [7, 9, 11, 15, 51, 55, 129, 153, 154, 157, 161, 162].includes(id)) {
        return { priority: 4, label: "게임 중 멈춤·재부팅과 저장장치 오류", reason: "중요 파일 백업 후 SMART·저장장치 연결·펌웨어·드라이버를 확인" };
      }
      if (/(application error|application hang)/i.test(source) && [1000, 1002].includes(id)) {
        return { priority: 2, label: "게임 프로그램 충돌", reason: "게임 파일·오버레이·안티치트·그래픽 드라이버를 하드웨어 이벤트와 분리" };
      }
      if (/(tcpip|dns|dhcp|e2fexpress|e1rexpress|wlan|ndis|network)/i.test(source) || [27, 32, 1014, 4199, 4266].includes(id)) {
        return { priority: 2, label: "게임 서버 연결·순간 끊김", reason: "랜·Wi-Fi 링크와 DNS·공유기 상태를 확인하되 블루스크린 원인으로 단정하지 않음" };
      }
      return { priority: 0, label: "", reason: "" };
    };
    const summarizePeakWindow = (times, windowMs = 2 * 60 * 1000) => {
      if (!times?.length) return null;
      const sorted = [...times].sort((a, b) => a - b);
      let best = { count: 1, start: sorted[0], end: sorted[0] };
      let left = 0;
      sorted.forEach((time, right) => {
        while (time - sorted[left] > windowMs) left += 1;
        if (right - left + 1 > best.count) best = { count: right - left + 1, start: sorted[left], end: time };
      });
      return best.count > 1 ? best : null;
    };
    // RAM 불량은 특정 드라이버 하나가 아니라 매번 다른 블루스크린 정지 코드로
    // 나타나는 경우가 많다(실제 진단 사례로 확인 — memory-test-guide.html 참고).
    // BugCheck/WER 1001이 2건 이상이고 정지 코드가 서로 다르면 RAM 의심 신호로
    // 별도 안내한다. 이벤트 종류가 하나뿐이라도(같은 id+원본이 반복) 이 패턴은
    // 나타나므로, groups.size===1인 경우에도 함께 써야 해 별도 함수로 분리했다.
    const detectMemoryPattern = (blockFieldsList) => {
      const bugcheckEntries = blockFieldsList.filter((item) => String(item.id || "").trim() === "1001" && /bugcheck|wer|windows error reporting/i.test(String(item.source || "")));
      const distinctStopCodes = [...new Set(bugcheckEntries.map((item) => (item.stopCode || "").toLowerCase()).filter(Boolean))];
      const wheaCount = blockFieldsList.filter((item) => /whea/i.test(String(item.source || ""))).length;
      return distinctStopCodes.length >= 2 ? { count: bugcheckEntries.length, codes: distinctStopCodes, wheaCount } : null;
    };
    const renderMemoryPatternHtml = (memoryPattern) => memoryPattern
      ? `<div class="event-diagnosis-lead"><strong>블루스크린 정지 코드가 ${memoryPattern.codes.length}가지로 매번 다릅니다 — 메모리(RAM) 의심</strong><p>블루스크린 보고(BugCheck/WER 1001)가 ${memoryPattern.count}건 있고, 정지 코드가 ${memoryPattern.codes.map((code) => escapeEventText(code)).join(", ")}로 반복될 때마다 달랐습니다. 특정 드라이버 하나가 반복되는 경우와 달리 코드가 계속 바뀌는 패턴은 RAM 불량에서 흔히 나타납니다.${memoryPattern.wheaCount ? "" : " 같은 로그에 WHEA-Logger 기록은 없는데, 일반(non-ECC) RAM은 손상돼도 WHEA에 남지 않는 경우가 많아 WHEA가 없다고 하드웨어 문제를 배제할 근거는 되지 않습니다."} <a href="memory-test-guide.html">메모리(RAM) 검사 방법</a>으로 MemTest86+ 검사를 먼저 진행해 보세요.</p></div>`
      : "";
    const buildEventBatchInsight = ({ groups, evaluated, allTimes, blockFieldsList }) => {
      const domains = new Map();
      evaluated.forEach(({ group, groupFallback, groupSource, levelLabel }) => {
        const domain = classifyEventDomain(group.fields);
        const gameImpact = classifyGameImpact(group.fields);
        const toneWeight = /치명적/.test(levelLabel) ? 5 : /오류/.test(levelLabel) ? 4 : /경고/.test(levelLabel) ? 2 : 0.25;
        const knownWeight = groupFallback.length ? 1 : 0.65;
        const noisyWeight = /DistributedCOM|Kernel-General|Kernel-Boot/i.test(groupSource) && /정보|경고/.test(levelLabel) ? 0.08 : 1;
        const item = domains.get(domain.key) || { ...domain, count: 0, eventTypes: 0, score: 0, gameScore: 0, groups: [], gameGroups: [], times: [] };
        item.count += group.count;
        item.eventTypes += 1;
        item.score += group.count * toneWeight * knownWeight * noisyWeight + domain.priority + gameImpact.priority * 2;
        item.gameScore += group.count * gameImpact.priority;
        item.groups.push({ id: String(group.fields.id || ""), source: groupSource, count: group.count, level: levelLabel, checks: groupFallback[0]?.checks || [] });
        if (gameImpact.priority) item.gameGroups.push({ id: String(group.fields.id || ""), source: groupSource, count: group.count, level: levelLabel, priority: gameImpact.priority, label: gameImpact.label, reason: gameImpact.reason });
        item.times.push(...group.times);
        domains.set(domain.key, item);
      });
      const ranked = [...domains.values()].sort((a, b) => b.score - a.score || b.count - a.count);
      const highRisk = ranked.filter((item) => item.key !== "other" && item.count > 0).slice(0, 4);
      const gameSignals = ranked.flatMap((item) => item.gameGroups || []).sort((a, b) => b.priority - a.priority || b.count - a.count).slice(0, 6);
      const eventFindings = evaluated
        .filter(({ group, groupFallback, levelLabel }) => {
          const impact = classifyGameImpact(group.fields);
          return groupFallback.length && (impact.priority >= 4 || /치명적|오류|경고/.test(levelLabel) || group.count >= 2);
        })
        .map(({ group, groupFallback, groupSource, levelLabel }) => {
          const entry = groupFallback[0];
          const impact = classifyGameImpact(group.fields);
          const peakItem = summarizePeakWindow(group.times);
          const severity = /치명적/.test(levelLabel) ? 4 : /오류/.test(levelLabel) ? 3 : /경고/.test(levelLabel) ? 2 : 1;
          return {
            id: String(group.fields.id || ""), source: groupSource || entry.source || "원본 미상", count: group.count,
            level: levelLabel || "수준 미상", severity, gamePriority: impact.priority,
            gameLabel: impact.label, summary: entry.summary || "등록된 요약이 없습니다.",
            checks: (entry.checks || []).slice(0, 3), warning: (entry.warnings || [])[0] || "이벤트 하나만으로 부품 고장을 확정하지 마세요.", peak: peakItem,
          };
        })
        .sort((a, b) => b.gamePriority - a.gamePriority || b.severity - a.severity || b.count - a.count)
        .slice(0, 8);
      const quiet = evaluated.filter(({ group, levelLabel, groupSource }) => group.count >= 5 && /정보|경고/.test(levelLabel) && /DistributedCOM|Kernel-General|Kernel-Boot/i.test(groupSource));
      const memoryPattern = detectMemoryPattern(blockFieldsList);
      const logNames = [...new Set(blockFieldsList.map((item) => item.logName).filter(Boolean))];
      const firstTime = allTimes.length ? Math.min(...allTimes) : null;
      const lastTime = allTimes.length ? Math.max(...allTimes) : null;
      const totalRecords = blockFieldsList.length;
      const rangeText = firstTime && lastTime ? `${formatSessionTime(firstTime)} ~ ${formatSessionTime(lastTime)}` : "발생 시각 확인 필요";
      const peak = highRisk.map((item) => ({ key: item.key, peak: summarizePeakWindow(item.times) })).filter((item) => item.peak);
      const checkOrder = [];
      highRisk.forEach((item) => {
        if (item.key === "storage") checkOrder.push("중요 파일을 다른 저장장치에 백업한 뒤 SMART 상태와 제조사 진단 도구로 저장장치 건강 상태 확인");
        if (item.key === "network") checkOrder.push("랜 케이블·공유기 포트·네트워크 드라이버를 교차 확인하고 ipconfig /flushdns 및 DNS 응답 비교");
        if (item.key === "graphics") checkOrder.push("NVIDIA/AMD 그래픽 드라이버를 안정 버전으로 재설치하고 GPU 온도·핫스팟·보조전원 확인");
        if (item.key === "security") checkOrder.push("보안 이벤트의 계정·원격 주소·반복 시각을 확인하고 단순 권한 경고와 실제 침해 신호를 구분");
        if (item.key === "tpm") checkOrder.push("BitLocker 복구 키를 확인한 뒤 TPM·BIOS 상태 점검; 복구 키 없이 TPM 초기화 금지");
      });
      if (!checkOrder.length) checkOrder.push("상위 이벤트의 발생 시각과 실제 증상을 대조한 뒤 같은 시간대의 로그를 추가 확인");
      const data = {
        totalRecords, rangeText, logNames, domains: ranked.map(({ key, label, count, eventTypes, groups: items, gameScore }) => ({ key, label, count, eventTypes, gameScore, items })),
        gameSignals,
        eventFindings,
        memoryPattern,
        peak: peak.map(({ key, peak: item }) => ({ key, count: item.count, start: item.start, end: item.end })),
        checkOrder, noisyCount: quiet.reduce((sum, item) => sum + item.group.count, 0),
      };
      const priorityHtml = highRisk.length ? `<ol class="event-priority-list">${highRisk.map((item, index) => {
        const peakItem = peak.find((value) => value.key === item.key)?.peak;
        const evidence = item.groups.slice(0, 4).map((value) => `${escapeEventText(value.source || "원본 미상")} ${escapeEventText(value.id || "ID 미상")} ${value.count}건`).join(" · ");
        const peakText = peakItem ? ` ${escapeEventText(formatSessionTime(peakItem.start))}~${escapeEventText(formatSessionTime(peakItem.end))}에 ${peakItem.count}건 집중.` : "";
        return `<li><strong>${index + 1}. ${escapeEventText(item.label)} — ${item.count}건</strong><span>${evidence}.${peakText} ${escapeEventText(item.firstCheck)}.</span></li>`;
      }).join("")}</ol>` : "<p>분류 가능한 반복 이벤트가 없어 개별 이벤트와 실제 증상을 함께 확인하세요.</p>";
      const findingHtml = eventFindings.length
        ? `<div class="event-finding-list">${eventFindings.map((item) => {
          const peakText = item.peak ? ` ${formatSessionTime(item.peak.start)}~${formatSessionTime(item.peak.end)}에 ${item.peak.count}건 집중.` : "";
          const checks = item.checks.length ? `<ul>${item.checks.map((check) => `<li>${escapeEventText(check)}</li>`).join("")}</ul>` : "<p>이벤트 XML의 세부값과 같은 시간대 로그를 추가로 확인하세요.</p>";
          return `<article class="event-finding-card"><div class="event-finding-meta"><span class="event-finding-level">${escapeEventText(item.level)}</span>${item.gameLabel ? `<span class="event-finding-game">${escapeEventText(item.gameLabel)}</span>` : ""}</div><h6>${escapeEventText(item.source)} · ID ${escapeEventText(item.id)} · ${item.count}건</h6><p class="event-finding-summary">${escapeEventText(item.summary)}</p><p class="event-finding-evidence"><strong>발생 근거:</strong> ${item.count}회 반복.${peakText} 실제 게임 오류·블루스크린·재부팅 시각과 겹치는지 확인하세요.</p><div class="event-finding-checks"><strong>먼저 확인할 항목</strong>${checks}</div><p class="event-finding-warning"><strong>판단 주의:</strong> ${escapeEventText(item.warning)}</p></article>`;
        }).join("")}</div>`
        : "<p>해석 가능한 오류·경고 이벤트가 없습니다. 정보성 기록은 실제 증상과 발생 시각이 겹칠 때만 추가 확인하세요.</p>";
      const leadFinding = eventFindings[0];
      const leadHtml = leadFinding
        ? `<div class="event-diagnosis-lead"><strong>현재 로그에서 가장 먼저 볼 신호</strong><p>${escapeEventText(leadFinding.source)} ID ${escapeEventText(leadFinding.id)}가 ${leadFinding.count}건 기록되었습니다. ${escapeEventText(leadFinding.summary)} 단, 게임 중 증상과 같은 시간대인지 확인한 뒤 부품 교체를 판단하세요.</p></div>`
        : "";
      const memoryPatternHtml = renderMemoryPatternHtml(memoryPattern);
      const checksHtml = `<ol class="event-check-order">${checkOrder.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ol>`;
      const caution = logNames.length ? `이 분석은 ${escapeEventText(logNames.join(", "))} 로그만 포함할 수 있으므로, 보안 로그가 없으면 로그인 침해 여부까지 판단할 수 없습니다.` : "로그 이름이 추출되지 않았으므로 원본 로그 범위를 확인하세요.";
      const html = `<section class="event-batch-insight"><div class="event-insight-heading"><span class="eyebrow">종합 분석</span><h4>이벤트 ${totalRecords}건의 우선순위와 발생 패턴</h4><p>${escapeEventText(rangeText)}${logNames.length ? ` · 로그: ${escapeEventText(logNames.join(", "))}` : ""}</p></div>${memoryPatternHtml}${leadHtml}<h5>항목별 해석과 점검 근거</h5>${findingHtml}<h5>가장 먼저 확인할 영역</h5>${priorityHtml}<h5>권장 점검 순서</h5>${checksHtml}${quiet.length ? `<p class="event-insight-muted">DCOM·Windows 기본 정보성 기록 등 ${quiet.reduce((sum, item) => sum + item.group.count, 0)}건은 우선순위에서 낮췄습니다. 실제 기능 장애와 시각이 일치할 때만 추가 확인하세요.</p>` : ""}<p class="event-insight-caution">${caution}</p></section>`;
      return { html, data };
    };
    const eventLevelLabelMap = { "1": "치명적", "2": "오류", "3": "경고", "4": "정보", critical: "치명적", error: "오류", warning: "경고", information: "정보" };
    const analyzeEventViewer = () => {
      lastEventBasketBundle = null;
      const rawText = eventTextInput.value;
      const manualId = String(eventIdInput.value || "").trim();
      const manualSource = String(eventSourceInput.value || "").trim();
      const blocks = !manualId && !manualSource ? splitEventBlocks(rawText) : [];
      const blockFieldsList = blocks.length > 1 ? blocks.map((block) => extractEventViewerFields(block)) : [];
      const fields = blockFieldsList.length ? blockFieldsList[0] : extractEventViewerFields(rawText);
      const id = String(manualId || fields.id || "").trim();
      const source = String(manualSource || fields.source || "").trim();
      // 텍스트를 붙여넣지 않고 ID·원본을 직접 입력한 경우 fields.id/source가 비어
      // 있어, 등록되지 않은 이벤트 안내 문구와 미등록 이벤트 기록이 빈 값으로
      // 표시되던 문제를 막는다(fields는 여기서만 쓰이는 지역 객체라 안전하게 보정).
      if (!fields.id) fields.id = id;
      if (!fields.source) fields.source = source;
      if (!eventIdInput.value && fields.id) eventIdInput.value = fields.id;
      if (!eventSourceInput.value && fields.source) eventSourceInput.value = fields.source;
      if (!eventLevelInput.value && fields.level) {
        eventLevelInput.value = eventLevelLabelMap[String(fields.level).toLowerCase()] || "";
      }
      if (!eventTimeInput.value && fields.time) {
        const parsedTime = new Date(fields.time);
        if (!Number.isNaN(parsedTime.getTime())) eventTimeInput.value = new Date(parsedTime.getTime() - parsedTime.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      }

      if (blockFieldsList.length > 1) {
        const groups = new Map();
        blockFieldsList.forEach((blockFields) => {
          const groupId = String(blockFields.id || "").trim();
          if (!groupId) return;
          const key = `${groupId}::${normalizeEventSource(blockFields.source)}`;
          if (!groups.has(key)) groups.set(key, { fields: blockFields, count: 0, times: [] });
          const group = groups.get(key);
          group.count += 1;
          const parsedTime = parseSessionTime(blockFields.time);
          if (parsedTime) group.times.push(parsedTime.getTime());
        });
        const buildTimingFor = (key, group) => {
          const timing = summarizeEventTiming(group.times);
          if (!timing) return null;
          const nearby = findNearbyEventGroups(key, groups);
          const patternLabel = timing.pattern === "burst"
            ? "짧은 시간에 몰아서 발생"
            : timing.pattern === "periodic"
              ? `약 ${formatDurationShort(timing.avgIntervalSeconds)} 간격으로 반복`
              : "간격이 불규칙하게 반복";
          return {
            rangeText: `최초 ${formatSessionTime(timing.firstTime)} ~ 최근 ${formatSessionTime(timing.lastTime)}`,
            patternLabel,
            nearbyText: nearby.length
              ? `이 이벤트가 발생할 때마다 ±2분 이내에 ${nearby.map((n) => `${n.fields.source || ""} ${n.fields.id || ""}`.trim()).filter(Boolean).join(", ")}도 함께 기록됐습니다 — 같은 원인일 가능성이 있습니다.`
              : "",
          };
        };
        if (groups.size > 1) {
          const groupList = [...groups.entries()];
          const allTimes = groupList.flatMap(([, group]) => group.times);
          const levelCounts = blockFieldsList.reduce((acc, blockFields) => {
            const raw = String(blockFields.level || "").trim();
            const label = eventLevelLabelMap[raw.toLowerCase()] || raw;
            if (label) acc[label] = (acc[label] || 0) + 1;
            return acc;
          }, {});
          const levelText = Object.entries(levelCounts).map(([label, count]) => `${label} ${count}건`).join(" · ");
          const rangeText = allTimes.length
            ? `${formatSessionTime(Math.min(...allTimes))} ~ ${formatSessionTime(Math.max(...allTimes))}`
            : "";
          // 이벤트 종류가 많을수록(evtx 파일 하나에 수십 종이 섞여 있는 경우가
          // 흔함) 전부 같은 비중의 카드로 늘어놓으면 정작 중요한 신호가 묻힌다.
          // 매칭·드라이버 인식·수준을 기준으로 점수를 매겨 중요한 것부터 보여주고,
          // Info 수준의 잘 알려진 정상 동작 기록(HttpService 등)은 카드 대신
          // 한 줄로 접는다.
          // 원본을 모를 때만(비어 있을 때만) 같은 ID의 다른 원본까지 넓혀 찾는다.
          // 원본이 있는데 그 조합이 DB에 없으면 빈 결과로 둬야 한다 — 그렇지
          // 않으면 서로 다른 제조사가 같은 이벤트 번호를 쓸 때(예: 153이 disk와
          // nvlddmkm 양쪽에 존재) 전혀 다른 이벤트로 잘못 매칭된다. 실제로
          // nvlddmkm(NVIDIA GPU 오류) 153이 disk 153(디스크 재시도) 설명으로
          // 잘못 표시되던 것을 실제 evtx 로그로 검증하다 발견함.
          const findGroupMatches = (id, source) => {
            const direct = findEventViewerEntries({ id, source });
            if (direct.length) return direct;
            return source ? [] : findEventViewerEntries({ id, source: "" });
          };
          const evaluated = groupList.map(([key, group]) => {
            const groupSource = String(group.fields.source || "").trim();
            const groupFallback = findGroupMatches(group.fields.id, groupSource);
            const driverInfo = !groupFallback.length ? lookupDriverModule(groupSource) : null;
            const rawLevel = String(group.fields.level || "").trim();
            const levelLabel = eventLevelLabelMap[rawLevel.toLowerCase()] || rawLevel;
            const isSevere = /치명적|오류/.test(levelLabel);
            const isInfo = /정보/.test(levelLabel);
            const matchedTone = groupFallback[0] ? getEventTone(groupFallback[0], group.count) : null;
            const isNoisy = !groupFallback.length && !driverInfo && isInfo && NOISY_EVENT_SOURCE_PATTERN.test(groupSource);
            const score = matchedTone
              ? { danger: 100, warning: 70, info: 40, neutral: 20 }[matchedTone.key] || 20
              : driverInfo ? (isSevere ? 90 : 55)
                : isSevere ? 50
                  : isNoisy ? -100
                    : 10;
            const toneKey = matchedTone ? matchedTone.key : driverInfo ? (isSevere ? "danger" : "info") : isSevere ? "danger" : "neutral";
            const chipLabel = matchedTone ? matchedTone.label : driverInfo ? `${driverInfo.category} 인식` : (levelLabel || "수준 미상");
            return { key, group, groupSource, groupFallback, score, isNoisy, levelLabel, toneKey, chipLabel };
          }).sort((a, b) => b.score - a.score);
          const notable = evaluated.filter((item) => !item.isNoisy);
          const noisy = evaluated.filter((item) => item.isNoisy);
          const insight = buildEventBatchInsight({ groups, evaluated, allTimes, blockFieldsList });
          const summary = `<div class="event-match-note"><strong>${groupList.length}개의 서로 다른 이벤트가 발견되었습니다.</strong><p>붙여넣은 로그에 섞여 있는 서로 다른 이벤트를 각각 나눠서, 매칭·드라이버 인식·수준을 기준으로 중요한 순서대로 정리했습니다. 코드를 눌러 상세 내용을 펼쳐 보세요. 반복 횟수는 같은 이벤트끼리만 정확히 계산됩니다.${rangeText ? ` 기간: ${rangeText}.` : ""}${levelText ? ` (${levelText})` : ""}</p></div>${insight.html}`;
          lastEventBasketBundle = {
            kind: "event-viewer-batch",
            totalRecords: blockFieldsList.length,
            eventTypes: groupList.length,
            rangeText,
            levelText,
            insight: insight.data,
            events: groupList.map(([key, group]) => ({
              ...buildEventEvidence({ fields: group.fields, repeatCount: group.count }),
              occurrences: group.times.map((value) => new Date(value).toISOString()),
            })),
          };
          // 이벤트가 많을 때 카드를 전부 펼쳐두면 결국 예전과 똑같이 스크롤이
          // 끝없이 이어진다. 코드·원본·수준·반복 횟수만 보이는 한 줄 요약을
          // <summary>로 두고, 클릭해야 상세 내용이 펼쳐지도록 접어둔다. 가장
          // 중요도가 높은 첫 번째 항목만 기본으로 펼쳐서 보여준다.
          const cards = notable.map(({ key, group, groupSource, groupFallback, levelLabel, toneKey, chipLabel }, index) => {
            const timing = buildTimingFor(key, group);
            // 전역 "수준" 입력값(eventLevelInput)은 첫 이벤트 기준으로 한 번만
            // 채워지는 값이라, 여러 종류 이벤트가 섞인 카드 목록에 그대로 쓰면
            // 모든 카드가 같은(첫 이벤트의) 수준으로 잘못 표시된다. 각 그룹
            // 자신의 수준(levelLabel)을 대신 넘긴다.
            const cardHtml = groupFallback.length > 1 && !groupSource
              ? groupFallback.map((entry) => renderEventViewerResult({ entry, fields: group.fields, repeatCount: group.count, selectedLevel: levelLabel, eventTime: eventTimeInput.value, timing })).join("")
              : renderEventViewerResult({ entry: groupFallback[0], fields: group.fields, repeatCount: group.count, selectedLevel: levelLabel, eventTime: eventTimeInput.value, timing });
            const countLabel = group.count > 1 ? `${group.count}회` : "1회";
            const summaryChips = `<span class="event-card-summary-chips"><span class="event-chip event-chip--code">이벤트 ${escapeEventText(group.fields.id || "?")}</span><span class="event-chip event-chip--source">${escapeEventText(groupSource || "원본 미상")}</span><span class="event-chip event-chip--${toneKey}">${escapeEventText(chipLabel)}</span><span class="event-chip event-chip--count">${countLabel}</span></span>`;
            return `<details class="event-card-collapse"${index === 0 ? " open" : ""}><summary>${summaryChips}</summary>${cardHtml}</details>`;
          }).join("");
          const noisyNote = noisy.length ? `<details class="event-noisy-collapse"><summary>정보성 이벤트 ${noisy.length}종 (총 ${noisy.reduce((sum, item) => sum + item.group.count, 0)}회) — 대부분 정상 동작 기록이라 접어뒀습니다</summary><ul>${noisy.map((item) => `<li>${escapeEventText(item.groupSource)} · ID ${escapeEventText(item.group.fields.id || "")} · ${item.group.count}회</li>`).join("")}</ul></details>` : "";
          eventResult.innerHTML = summary + cards + noisyNote + renderEventBatchButton();
          return;
        }
        if (groups.size === 1) {
          const [key, group] = [...groups.entries()][0];
          const groupSource = String(group.fields.source || "").trim();
          const groupMatches = findEventViewerEntries({ id: group.fields.id, source: groupSource });
          const groupFallback = groupMatches.length ? groupMatches : (groupSource ? [] : findEventViewerEntries({ id: group.fields.id, source: "" }));
          const repeatCount = Math.max(1, group.count, Number(eventRepeatInput.value || 1));
          const timing = buildTimingFor(key, group);
          lastEventBasketBundle = {
            kind: "event-viewer-batch",
            totalRecords: group.count,
            eventTypes: 1,
            events: [{
              ...buildEventEvidence({ fields: group.fields, repeatCount, timing }),
              occurrences: group.times.map((value) => new Date(value).toISOString()),
            }],
          };
          const memoryPatternHtml = renderMemoryPatternHtml(detectMemoryPattern(blockFieldsList));
          eventResult.innerHTML = memoryPatternHtml + (groupFallback.length > 1 && !groupSource
            ? `<div class="event-match-note"><strong>같은 ID의 원본이 여러 개일 수 있습니다.</strong><p>반복 횟수 ${repeatCount}회를 각 후보에 적용했습니다. 정확한 원본을 입력하면 결과를 좁힐 수 있습니다.</p></div>${groupFallback.map((entry) => renderEventViewerResult({ entry, fields: group.fields, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value, timing })).join("")}${renderEventBatchButton()}`
            : `${renderEventViewerResult({ entry: groupFallback[0], fields: group.fields, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value, timing })}${renderEventBatchButton()}`);
          return;
        }
      }

      const repeatCount = Math.max(1, Number(eventRepeatInput.value || 1), Number(fields.recordCount || 1));
      const matches = findEventViewerEntries({ id, source });
      const fallbackMatches = matches.length ? matches : (source ? [] : findEventViewerEntries({ id, source: "" }));
      if (!id) {
        eventResult.innerHTML = `<div class="event-empty"><strong>이벤트 ID를 확인할 수 없습니다.</strong><p>ID를 입력하거나 이벤트 속성의 일반 탭·XML 전체를 붙여넣어 주세요.</p></div>`;
        return;
      }
      lastEventBasketBundle = {
        kind: "event-viewer-batch",
        totalRecords: repeatCount,
        eventTypes: fallbackMatches.length || 1,
        events: fallbackMatches.length
          ? fallbackMatches.map((entry) => buildEventEvidence({ fields, entry, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value }))
          : [buildEventEvidence({ fields, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value })],
      };
      eventResult.innerHTML = fallbackMatches.length > 1 && !source
        ? `<div class="event-match-note"><strong>같은 ID의 원본이 여러 개일 수 있습니다.</strong><p>현재 데이터에서 ${fallbackMatches.length}개 후보를 찾았습니다. 정확한 원본을 입력하면 결과를 좁힐 수 있습니다.</p></div>${fallbackMatches.map((entry) => renderEventViewerResult({ entry, fields, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value })).join("")}${renderEventBatchButton()}`
        : `${renderEventViewerResult({ entry: fallbackMatches[0], fields, repeatCount, selectedLevel: eventLevelInput.value, eventTime: eventTimeInput.value })}${renderEventBatchButton()}`;
    };
    const clearEventViewer = () => {
      lastEventBasketBundle = null;
      eventForm.reset();
      eventRepeatInput.value = "1";
      eventResult.innerHTML = `<p>이벤트 ID만 입력해도 검색할 수 있습니다. 원본과 설명을 함께 넣으면 같은 ID의 다른 의미를 구분하기 쉽습니다.</p>`;
    };
    const renderSuggestions = (rawValue) => {
      const matches = getErrorCodeMatches(rawValue);
      if (!matches.length) {
        suggestionsBox.hidden = true;
        suggestionsBox.classList.remove("is-scrollable");
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
      // 목록은 전체 결과를 유지하고, 6개를 넘으면 CSS 스크롤 영역으로 전환합니다.
      // 이렇게 하면 관련 코드가 많은 장치 관리자·블루스크린 항목도 빠지지 않습니다.
      suggestionsBox.classList.toggle("is-scrollable", matches.length > 6);
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
    diagnosticRoot.querySelector("[data-code-clear]").addEventListener("click", () => {
      openConfirmDialog({
        title: "오류 코드 검색 지우기",
        message: "입력한 코드와 검색 결과가 사라집니다. 지울까요?",
        okLabel: "지우기",
        onConfirm: clearSearch,
      });
    });
    diagnosticRoot.querySelector("[data-log-analyze]").addEventListener("click", () => {
      renderHardwareLog(logInput.value);
    });
    diagnosticRoot.querySelector("[data-log-clear]").addEventListener("click", () => {
      openConfirmDialog({
        title: "로그 지우기",
        message: "붙여넣은 로그와 분석 결과가 모두 사라집니다. 지울까요?",
        okLabel: "지우기",
        onConfirm: clearHardwareLog,
      });
    });
    eventForm.addEventListener("submit", (event) => {
      event.preventDefault();
      analyzeEventViewer();
    });
    diagnosticRoot.querySelector("[data-event-clear]").addEventListener("click", () => {
      openConfirmDialog({
        title: "이벤트 정보 지우기",
        message: "입력한 이벤트 ID·원본·설명이 모두 사라집니다. 지울까요?",
        okLabel: "지우기",
        onConfirm: clearEventViewer,
      });
    });
    const handleEventFile = async (file) => {
      if (!file) return;
      const isEvtx = /\.evtx$/i.test(file.name || "");
      const maxEventFileSize = isEvtx ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > maxEventFileSize) {
        const limitLabel = isEvtx ? "20MB" : "5MB";
        const formatLabel = isEvtx ? "EVTX" : "TXT·LOG·XML";
        eventResult.innerHTML = `<div class="event-empty"><strong>파일이 너무 큽니다.</strong><p>현재는 ${limitLabel} 이하의 ${formatLabel} 파일만 브라우저에서 분석할 수 있습니다. 이벤트 뷰어에서 필요한 시간대만 필터링해 다시 저장해 주세요.</p></div>`;
        eventFileInput.value = "";
        return;
      }
      if (isEvtx) {
        eventResult.innerHTML = `<p class="muted">EVTX 파일을 분석하는 중입니다… 파일이 크면 몇 초 걸릴 수 있습니다.</p>`;
        await new Promise((resolve) => setTimeout(resolve, 30));
        try {
          const buffer = await file.arrayBuffer();
          const parsed = parseEvtxArrayBuffer(buffer);
          if (!parsed.records.length) {
            eventResult.innerHTML = `<div class="event-empty"><strong>이벤트를 찾지 못했습니다.</strong><p>올바른 .evtx 파일인지 확인해 주세요. 파일이 손상되었다면 이벤트 뷰어에서 XML로 다시 저장해 붙여넣는 방법도 시도해 보세요.</p></div>`;
            return;
          }
          const MAX_RECORDS = 4000;
          const records = parsed.records.slice(-MAX_RECORDS);
          const truncatedNote = parsed.records.length > MAX_RECORDS
            ? `<div class="event-match-note"><strong>이벤트가 많아 최근 ${MAX_RECORDS.toLocaleString()}건만 분석했습니다.</strong><p>전체 ${parsed.records.length.toLocaleString()}건 중 가장 최근 기록을 우선 사용했습니다.</p></div>`
            : "";
          const times = records.map((r) => r.timeCreated).filter((t) => t instanceof Date && !Number.isNaN(t.getTime()));
          const rangeNote = times.length
            ? `<p class="muted">EVTX에서 읽은 이벤트 ${records.length.toLocaleString()}건 · 기간 ${new Date(Math.min(...times.map((t) => t.getTime()))).toLocaleString("ko-KR")} ~ ${new Date(Math.max(...times.map((t) => t.getTime()))).toLocaleString("ko-KR")}</p>`
            : "";
          eventTextInput.value = records.map((r) => r.xml).join("\n");
          analyzeEventViewer();
          const skippedNote = parsed.errors.length
            ? `<p class="muted">형식을 인식하지 못한 레코드 ${parsed.errors.length.toLocaleString()}건은 건너뛰었습니다.</p>`
            : "";
          eventResult.insertAdjacentHTML("afterbegin", truncatedNote + rangeNote + skippedNote);
        } catch (err) {
          eventResult.innerHTML = `<div class="event-empty"><strong>EVTX 파일을 분석하지 못했습니다.</strong><p>파일이 손상되었거나 지원하지 않는 형식일 수 있습니다. 이벤트 뷰어에서 XML로 다시 저장해 붙여넣는 방법도 시도해 보세요.</p></div>`;
        }
        return;
      }
      try {
        eventTextInput.value = await file.text();
        analyzeEventViewer();
      } catch {
        eventResult.innerHTML = `<div class="event-empty"><strong>파일을 읽지 못했습니다.</strong><p>UTF-8 텍스트 기반의 TXT·LOG·XML 파일인지 확인한 뒤 다시 시도해 주세요.</p></div>`;
      }
    };
    eventFileInput.addEventListener("change", () => {
      handleEventFile(eventFileInput.files && eventFileInput.files[0]);
    });
    // 다른 로그 분석 탭(하드웨어 로그 등)과 같은 방식의 드래그 앤 드롭 첨부.
    const eventDrop = diagnosticRoot.querySelector("[data-event-drop]");
    eventDrop.addEventListener("dragover", (event) => {
      event.preventDefault();
      eventDrop.classList.add("dragover");
    });
    eventDrop.addEventListener("dragleave", () => {
      eventDrop.classList.remove("dragover");
    });
    eventDrop.addEventListener("drop", (event) => {
      event.preventDefault();
      eventDrop.classList.remove("dragover");
      const file = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) handleEventFile(file);
    });

    const aiForm = diagnosticRoot.querySelector("[data-ai-form]");
    const aiQuestionInput = diagnosticRoot.querySelector("[data-ai-question]");
    const aiSaveConsent = diagnosticRoot.querySelector("[data-ai-save-consent]");
    const aiResult = diagnosticRoot.querySelector("[data-ai-result]");
    const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
    // 실제 로그 분석 1건만 담아도(그리 크지 않은 프롬프트) 상세한 답변은 생성
    // 자체에 60초 넘게 걸리는 사례가 확인됐다(2026-08-04, 14,064자 프롬프트가
    // 65초 소요) — 60초는 너무 빠듯해 정상적으로 생성된 답변도 실패로 표시됐다.
    // 항목을 여러 개 담을수록(로그·이벤트 전체담기 등) 더 오래 걸릴 수 있어
    // 120초로 여유를 더 두었다.
    const AI_ASK_TIMEOUT_MS = 120000;
    const renderAiSources = (sources) => {
      if (!sources || !sources.length) return "";
      const links = sources
        .filter((s) => s.detailPage)
        .map((s) => `<a href="${s.detailPage}">${escapeEventText(s.title || s.id)}</a>`)
        .join("");
      return links ? `<p><strong>관련 문서</strong></p><div class="link-list">${links}</div>` : "";
    };
    const askAi = async () => {
      const question = aiQuestionInput.value.trim();
      if (!question) {
        aiResult.innerHTML = `<p>먼저 증상이나 오류 상황을 입력해 주세요.</p>`;
        return;
      }
      aiResult.innerHTML = `<p>답변을 생성하는 중입니다… (최대 1분 정도 걸릴 수 있습니다)</p>`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_ASK_TIMEOUT_MS);
        const res = await fetch(`${AI_SERVICE_BASE_URL}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            save_for_improvement: Boolean(aiSaveConsent && aiSaveConsent.checked),
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const answerHtml = data.answer
          ? renderMarkdownLite(data.answer)
          : `${renderAiMissingNotice("AI가 답변을 만들지 못했습니다.")}<p class="muted">아래 관련 문서를 확인해 주세요.</p>`;
        // 답변이 실제로 생성됐을 때만 종합진단 카트에 담을 수 있게 한다 —
        // 답변 없이 원인 후보만 나온 경우는 담을 근거가 없다.
        const basketButton = data.answer
          ? buildAddToBasketButton({
              type: "ai",
              key: `${Date.now()}`,
              title: question.length > 40 ? `${question.slice(0, 40)}…` : question,
              summary: data.answer.length > 400 ? `${data.answer.slice(0, 400)}…` : data.answer,
              evidence: { kind: "ai-qa", question, answer: data.answer },
              tone: "info",
            })
          : "";
        aiResult.innerHTML = `${answerHtml}${renderAiSources(data.sources)}${basketButton}`;
      } catch {
        aiResult.innerHTML = `
          ${renderAiMissingNotice("AI 서비스에 연결할 수 없었습니다.")}
          <p class="muted">대신 증상·오류 코드·이벤트 뷰어 탭에서 직접 검색해 보세요.</p>
          <p><a href="diagnostic.html#diagnostic-symptom">증상으로 찾기 탭 열기</a></p>
        `;
      }
    };
    aiForm.addEventListener("submit", (event) => {
      event.preventDefault();
      askAi();
    });
    const clearAiQuestion = () => {
      aiQuestionInput.value = "";
      if (aiSaveConsent) aiSaveConsent.checked = false;
      aiResult.innerHTML = `<p>증상이나 오류 상황을 문장으로 입력하면 관련 원인과 점검 순서를 찾아드립니다.</p>`;
    };
    diagnosticRoot.querySelector("[data-ai-clear]").addEventListener("click", () => {
      openConfirmDialog({
        title: "질문 지우기",
        message: "입력한 질문과 답변이 사라집니다. 지울까요?",
        okLabel: "지우기",
        onConfirm: clearAiQuestion,
      });
    });

    const confirmOverlay = diagnosticRoot.querySelector("[data-confirm-overlay]");
    const confirmTitleEl = diagnosticRoot.querySelector("[data-confirm-title]");
    const confirmItemEl = diagnosticRoot.querySelector("[data-confirm-item]");
    const confirmMessageEl = diagnosticRoot.querySelector("[data-confirm-message]");
    const confirmOkBtn = diagnosticRoot.querySelector("[data-confirm-ok]");
    let pendingConfirmAction = null;
    let confirmReturnFocus = null;
    const openConfirmDialog = ({ title = "확인", item = "", message = "", okLabel = "확인", onConfirm }) => {
      confirmTitleEl.textContent = title;
      confirmItemEl.textContent = item;
      confirmItemEl.hidden = !item;
      confirmMessageEl.textContent = message;
      confirmOkBtn.textContent = okLabel;
      pendingConfirmAction = onConfirm;
      confirmReturnFocus = document.activeElement;
      confirmOverlay.hidden = false;
      confirmOkBtn.focus();
    };
    const closeConfirmDialog = () => {
      pendingConfirmAction = null;
      confirmOverlay.hidden = true;
      if (confirmReturnFocus && typeof confirmReturnFocus.focus === "function") confirmReturnFocus.focus();
      confirmReturnFocus = null;
    };

    let basketItems = readBasket();
    const basketRoot = diagnosticRoot.querySelector("[data-diagnosis-basket]");
    const basketTabBadge = diagnosticRoot.querySelector("[data-basket-tab-count]");
    const diagnosisSessionsKey = "pc_diagnosis_sessions";
    let checklistState = {};
    let basketAnalysisText = "";
    let timeAnalysisScope = null;
    const readDiagnosisSessions = () => {
      try {
        const sessions = JSON.parse(localStorage.getItem(diagnosisSessionsKey) || "[]");
        return Array.isArray(sessions) ? sessions.filter((session) => session && Array.isArray(session.basket)) : [];
      } catch {
        return [];
      }
    };
    const writeDiagnosisSessions = (sessions) => {
      try {
        localStorage.setItem(diagnosisSessionsKey, JSON.stringify(sessions.slice(0, 10)));
      } catch {
        // 브라우저 저장 공간이 부족하거나 차단된 경우에도 현재 진단은 계속 사용할 수 있습니다.
      }
    };
    const getChecklistItems = () => {
      const seen = new Set();
      return basketItems.flatMap((item) => (item.checks || []).map((text, index) => ({
        id: `${item.key}:${index}`,
        source: item.title,
        text,
      }))).filter((item) => {
        const normalized = item.text.trim();
        if (!normalized || seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
    };
    const parseSessionTime = (value) => {
      if (!value) return null;
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? null : date;
    };
    const getTimedBasketItems = () => basketItems.map((item) => {
      const start = parseSessionTime(item.timeStart || item.time);
      const end = parseSessionTime(item.timeEnd || item.timeStart || item.time);
      return start ? { item, start, end } : null;
    }).filter(Boolean);
    // group을 못 찾을 때 이유를 함께 돌려준다. 예전에는 이유와 상관없이
    // "이벤트 결과를 먼저 담아 주세요"라는 한 가지 메시지만 보여줘서, 이벤트를
    // 이미 담았는데도 안 담은 것처럼 안내되는 문제가 있었다(실사용 화면에서
    // 발견 — 이벤트는 담았지만 ±5분 안에 겹치는 다른 자료가 없던 경우).
    const getSuggestedTimeGroup = () => {
      const timed = getTimedBasketItems();
      if (timed.length < 2) return { group: null, reason: "insufficient" };
      const eventTimed = timed.filter(({ item }) => item.type === "event");
      const inEventWindow = (anchor, candidate) => {
        const windowStart = anchor.start.getTime() - 5 * 60 * 1000;
        const windowEnd = anchor.start.getTime() + 5 * 60 * 1000;
        return candidate.start.getTime() <= windowEnd && candidate.end.getTime() >= windowStart;
      };
      // 이벤트 뷰어의 발생 시각을 기준으로 삼고, HWiNFO는 해당 구간의 보조 자료로만 포함합니다.
      if (eventTimed.length) {
        let eventBasedBest = null;
        eventTimed.forEach((anchor) => {
          const group = timed.filter((candidate) => inEventWindow(anchor, candidate));
          if (!eventBasedBest || group.length > eventBasedBest.length) eventBasedBest = group;
        });
        return eventBasedBest && eventBasedBest.length >= 2
          ? { group: eventBasedBest, reason: null }
          : { group: null, reason: "no-match" };
      }
      let best = null;
      timed.forEach((anchor) => {
        const group = timed.filter((candidate) => Math.abs(candidate.start - anchor.start) <= 5 * 60 * 1000);
        if (!best || group.length > best.length) best = group;
      });
      return best && best.length >= 2 ? { group: best, reason: null } : { group: null, reason: "no-event" };
    };
    const formatSessionTime = (value) => {
      const date = parseSessionTime(value);
      return date ? date.toLocaleString("ko-KR", { dateStyle: "short", timeStyle: "short" }) : "시간 미확인";
    };
    const getAnalysisItems = () => {
      if (!timeAnalysisScope?.length) return basketItems;
      const selected = new Set(timeAnalysisScope);
      return basketItems.filter((item) => selected.has(item.key));
    };
    const renderTimeAnalysis = () => {
      const { group, reason } = getSuggestedTimeGroup();
      if (!group) {
        const notes = {
          insufficient: "발생 시각이 있는 자료가 아직 부족합니다. 이벤트 뷰어나 로그 분석 결과를 담으면 자동으로 시간대를 비교합니다.",
          "no-event": "발생 시각이 있는 자료가 여러 개 있지만, ±5분 안에 겹치는 조합을 찾지 못했습니다.",
          "no-match": "이벤트 뷰어 기록은 담겨 있지만, 그 발생 시각 ±5분 안에 겹치는 다른 자료(HWiNFO 등)가 없습니다.",
        };
        return `<div class="time-analysis-note"><strong>같은 시간대로 묶을 자료가 없습니다.</strong><p>${notes[reason] || notes.insufficient} 시간 통합 없이도 종합진단은 계속 사용할 수 있습니다.</p></div>`;
      }
      const selected = timeAnalysisScope?.length ? new Set(timeAnalysisScope) : null;
      const groupKeys = group.map(({ item }) => item.key);
      return `
        <section class="time-analysis-suggestion" aria-labelledby="time-analysis-title">
          <div class="time-analysis-head"><div><p class="eyebrow">선택 기능</p><h4 id="time-analysis-title">같은 시간대 기록을 찾았습니다</h4></div><span>±5분 기준</span></div>
          <p>이벤트 뷰어 기록을 기준으로 ${group.length}개 자료가 ±5분 안에 있습니다. HWiNFO는 이 시점의 온도·전력·팬 상태를 확인하는 보조 지표로 사용합니다.</p>
          <ul>${group.map(({ item }) => `<li><strong>${escapeEventText(item.title)}</strong><span>${item.type === "event" ? "기준 이벤트" : "보조 로그"} · ${formatSessionTime(item.time || item.timeStart)}</span></li>`).join("")}</ul>
          <div class="time-analysis-actions">
            <button type="button" class="btn primary code-button" data-time-apply="${escapeEventText(JSON.stringify(groupKeys))}">${selected ? "이 시간대 적용됨" : "이 시간대로 분석"}</button>
            <button type="button" class="btn secondary code-button" data-time-skip>시간 통합 없이 전체 분석</button>
          </div>
          ${selected ? `<p class="time-analysis-applied">현재 종합 분석에는 선택한 ${selected.size}개 기록만 사용합니다.</p>` : ""}
        </section>
      `;
    };
    const sessionTitle = (session) => `${session.title || "진단 세션"} · ${session.basket.length}개 항목`;
    const renderSessionTools = () => {
      const sessions = readDiagnosisSessions();
      return `
        <div class="diagnosis-session-tools" aria-label="진단 결과 저장 도구">
          <div>
            <strong>진단 결과 저장</strong>
            <p>결과와 체크 상태는 이 브라우저에만 저장됩니다.</p>
          </div>
          <div class="diagnosis-session-actions">
            <button type="button" class="btn primary code-button" data-session-save>현재 결과 저장</button>
            <button type="button" class="btn secondary code-button" data-session-export>JSON 내보내기</button>
            <select class="session-load-select" data-session-load aria-label="저장된 진단 불러오기" ${sessions.length ? "" : "disabled"}>
              <option value="">${sessions.length ? "저장된 결과 불러오기" : "저장된 결과 없음"}</option>
              ${sessions.map((session) => `<option value="${escapeEventText(session.id)}">${escapeEventText(sessionTitle(session))}</option>`).join("")}
            </select>
            <button type="button" class="btn secondary code-button" data-session-new>새 진단</button>
          </div>
          <p class="diagnosis-session-status" data-session-status aria-live="polite"></p>
        </div>
      `;
    };
    const renderChecklist = () => {
      // 이벤트 배치 인사이트(종합 분석 → 권장 점검 순서)가 이미 담겨 있으면
      // 그 안에 우선순위까지 매긴 점검 순서가 따로 있어서, 각 카드의 점검
      // 항목을 그냥 모아 중복만 제거한 이 체크리스트는 같은 내용을 한 번 더
      // 나열할 뿐이다. 그럴 때는 체크리스트를 생략한다.
      const hasEventBatchInsight = basketItems.some((item) => item.evidence?.kind === "event-viewer-batch" && item.evidence?.insight);
      if (hasEventBatchInsight) return "";
      const items = getChecklistItems();
      if (!items.length) return "";
      const completed = items.filter((item) => checklistState[item.id]).length;
      return `
        <section class="diagnosis-checklist" aria-labelledby="diagnosis-checklist-title">
          <div class="diagnosis-checklist-head">
            <div><p class="eyebrow">점검 진행</p><h4 id="diagnosis-checklist-title">권장 점검 체크리스트</h4></div>
            <span>${completed}/${items.length} 완료</span>
          </div>
          <p class="muted">항목을 확인한 뒤 체크하세요. 결과는 저장할 때 함께 보관됩니다.</p>
          <div class="diagnosis-checklist-list">
            ${items.map((item) => `
              <label class="diagnosis-check-item${checklistState[item.id] ? " is-checked" : ""}">
                <input type="checkbox" data-checklist-id="${escapeEventText(item.id)}"${checklistState[item.id] ? " checked" : ""}>
                <span><strong>${escapeEventText(item.text)}</strong><small>${escapeEventText(item.source)}</small></span>
              </label>
            `).join("")}
          </div>
        </section>
      `;
    };
    const openBasketConfirm = (item) => {
      openConfirmDialog({
        title: "진단 카트에 담기",
        item: `[${typeLabelLookup[item.type] || item.type}] ${item.title}`,
        message: "이 항목을 진단 카트에 담을까요? 나중에 종합진단 탭에서 모아서 분석할 수 있습니다.",
        okLabel: "담기",
        onConfirm: () => {
          if (!basketItems.some((existing) => existing.key === item.key)) {
            basketItems = [...basketItems, item];
            writeBasket(basketItems);
            renderBasket();
          }
        },
      });
    };
    const renderBasket = () => {
      if (basketTabBadge) {
        basketTabBadge.textContent = String(basketItems.length);
        basketTabBadge.hidden = basketItems.length === 0;
      }
      if (!basketItems.length) {
        // 빈 카트에서는 "현재 결과 저장/JSON 내보내기/새 진단" 같은, 지금은
        // 눌러도 의미 없는 저장 도구가 안내문보다 먼저 보이고 있었다(실사용
        // 화면에서 확인됨). 무엇을 해야 하는지부터 보여주고, 이어서 볼 이전
        // 결과가 있을 때만(저장된 세션이 있을 때만) 불러오기만 작게 둔다.
        const sessions = readDiagnosisSessions();
        const loadOnly = sessions.length ? `
          <div class="basket-load-only">
            <select class="session-load-select" data-session-load aria-label="저장된 진단 불러오기">
              <option value="">이전에 저장한 결과 불러오기 (${sessions.length}개)</option>
              ${sessions.map((session) => `<option value="${escapeEventText(session.id)}">${escapeEventText(sessionTitle(session))}</option>`).join("")}
            </select>
          </div>
        ` : "";
        basketRoot.innerHTML = `<p class="basket-empty muted">증상·오류코드·이벤트·로그·미니덤프·AI 질문 결과에서 "진단 카트에 담기"를 눌러 모아보세요. 여러 개를 모으면 한 번에 종합 분석할 수 있습니다.</p>${loadOnly}`;
        return;
      }
      // 담은 항목이 전부 같은 회색 칩이라 카트만 봐서는 뭐가 심각한 항목인지
      // 구분이 안 됐다(이벤트 카드에는 이미 위험도 배지 색상이 있는데 카트에는
      // 안 넘어오고 있었음). 각 항목을 만들 때 넘긴 tone(danger/warning/info/
      // neutral)을 칩에도 그대로 반영한다.
      const chips = basketItems.map((item) => `
        <span class="basket-chip basket-chip--${item.tone || "neutral"}">
          <span class="basket-chip-type">${typeLabelLookup[item.type] || item.type}</span>
          <span class="basket-chip-title">${escapeEventText(item.title)}</span>
          <button type="button" class="basket-chip-remove" data-basket-remove="${escapeEventText(item.key)}" aria-label="담은 항목 제거">×</button>
        </span>
      `).join("");
      basketRoot.innerHTML = `
        ${renderSessionTools()}
        <div class="basket-head">
          <span class="basket-count">담은 항목 ${basketItems.length}개</span>
          <button type="button" class="btn primary code-button" data-basket-analyze>종합 분석하기</button>
        </div>
        <div class="basket-chip-list">${chips}</div>
        ${renderTimeAnalysis()}
        <div class="basket-analysis-result" data-basket-analysis-result></div>
        ${renderChecklist()}
      `;
    };
    const getCurrentSession = () => ({
      id: `session-${Date.now()}`,
      title: basketItems[0]?.title || "PC 진단 결과",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      basket: basketItems,
      checklist: checklistState,
      analysisText: basketAnalysisText,
      timeScope: timeAnalysisScope,
    });
    const saveCurrentSession = () => {
      if (!basketItems.length) return "먼저 진단 카트에 결과를 담아 주세요.";
      const sessions = readDiagnosisSessions();
      const session = getCurrentSession();
      writeDiagnosisSessions([session, ...sessions]);
      renderBasket();
      return `진단 결과를 저장했습니다. 최근 결과를 최대 ${Math.min(10, sessions.length + 1)}개까지 보관합니다.`;
    };
    const exportCurrentSession = () => {
      if (!basketItems.length) return "내보낼 진단 결과가 없습니다.";
      const blob = new Blob([JSON.stringify(getCurrentSession(), null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `itsvc-diagnosis-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return "진단 결과 JSON 파일을 다운로드했습니다.";
    };
    const setSessionStatus = (message) => {
      const status = basketRoot.querySelector("[data-session-status]");
      if (status) status.textContent = message;
    };
    const loadDiagnosisSession = (id) => {
      const session = readDiagnosisSessions().find((item) => item.id === id);
      if (!session) return;
      basketItems = session.basket;
      checklistState = session.checklist || {};
      basketAnalysisText = session.analysisText || "";
      timeAnalysisScope = session.timeScope || null;
      writeBasket(basketItems);
      renderBasket();
      const result = basketRoot.querySelector("[data-basket-analysis-result]");
      if (result && basketAnalysisText) result.innerHTML = `<p><strong>저장된 종합 분석 결과</strong></p><p>${escapeEventText(basketAnalysisText).replaceAll("\n", "<br>")}</p>`;
      setSessionStatus("저장된 진단 결과를 불러왔습니다.");
    };
    const resetDiagnosisSession = () => {
      basketItems = [];
      checklistState = {};
      basketAnalysisText = "";
      timeAnalysisScope = null;
      writeBasket(basketItems);
      renderBasket();
      setSessionStatus("새 진단을 시작했습니다.");
    };
    // report.metrics/evidence.metrics는 pattern·index·samples·score·sustainedSeconds
    // 처럼 사이트 내부 판정용 필드가 대부분이라 AI에게는 노이즈일 뿐이다 — 실제
    // 진단 근거는 이미 causes/checks에 사람이 읽을 문장으로 들어있다. AI가 이벤트
    // 뷰어 시각과 대조할 때만 필요한 최소 필드(라벨·단위·최대/평균·피크 시각)만
    // 남기고 나머지는 잘라 프롬프트 크기와 생성 시간을 줄인다(2026-08-04).
    const trimMetricsForPrompt = (metrics) => (metrics || []).map((m) => ({
      label: m.label, unit: m.unit, max: m.max, average: m.average, peakTime: m.peakTime,
    }));
    // 이벤트 뷰어 evidence(buildEventEvidence)는 device/imageName/errorCode처럼
    // 실제로 유용한 원본 필드가 많지만, 이벤트마다 해당 없는 필드는 빈 문자열로
    // 채워져 있어(대부분의 이벤트가 20개 필드 중 4~5개만 값이 있음) 그대로
    // 보내면 빈 키·값 쌍이 절반 이상을 차지한다. 값이 있는 필드만 남긴다
    // (log 계열의 metrics 트리밍과 같은 목적, 2026-08-04).
    const compactForPrompt = (value) => {
      if (Array.isArray(value)) {
        const arr = value.map(compactForPrompt).filter((v) => !(v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)));
        return arr;
      }
      if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value)) {
          const cv = compactForPrompt(v);
          const isEmpty = cv === undefined || cv === null || cv === ""
            || (Array.isArray(cv) && cv.length === 0)
            || (typeof cv === "object" && !Array.isArray(cv) && Object.keys(cv).length === 0);
          if (!isEmpty) out[k] = cv;
        }
        return out;
      }
      return value;
    };
    const summarizeEvidenceForPrompt = (evidence) => {
      if (!evidence) return null;
      if (evidence.kind === "hardware-log") {
        return compactForPrompt({
          kind: evidence.kind,
          fileName: evidence.fileName,
          fields: evidence.fields,
          metrics: trimMetricsForPrompt(evidence.metrics),
          diagnoses: evidence.diagnoses,
          alerts: evidence.alerts,
        });
      }
      if (evidence.kind === "log-batch") {
        return compactForPrompt({
          kind: evidence.kind,
          verdict: evidence.verdict,
          sessions: (evidence.sessions || []).map((s) => ({
            file: s.file, source: s.source, summary: s.summary,
            startTime: s.startTime, endTime: s.endTime,
            abruptNormalEnd: s.abruptNormalEnd, thermalFault: s.thermalFault,
            alerts: s.alerts, diagnoses: s.diagnoses,
          })),
        });
      }
      // event-viewer / event-viewer-batch 등: 필드 구조는 그대로 두고 빈 값만 제거.
      return compactForPrompt(evidence);
    };
    const buildBasketPrompt = (items) => {
      // 로그 분석(특히 HWiNFO)의 causes는 이제 report.diagnoses까지 포함해서
      // 단순 임계치 경고보다 훨씬 근거가 촘촘하다 — 다른 유형(symptom/code/event)의
      // 3개 컷과 똑같이 자르면 가장 근거 있는 정보가 잘려나가므로 타입별로
      // 한도를 다르게 둔다. checks(점검 순서)도 이미 사이트가 검증한 절차이니
      // AI가 새로 지어내지 않고 이를 바탕으로 우선순위만 정리하도록 함께 전달한다.
      const causeLimit = (type) => (type === "log" ? 8 : 4);
      const checkLimit = (type) => (type === "log" ? 6 : 4);
      const sections = ["symptom", "code", "event", "log", "minidump", "ai"].map((type) => {
        const group = items.filter((item) => item.type === type);
        if (!group.length) return "";
        const lines = group.map((item) => {
          const timeLabel = item.time || item.timeStart ? ` [발생 시각: ${formatSessionTime(item.time || item.timeStart)}]` : "";
          const causeLabel = item.causes?.length ? ` (원인: ${item.causes.slice(0, causeLimit(type)).join(" / ")})` : "";
          const checkLabel = item.checks?.length ? ` (이미 확인된 점검 절차: ${item.checks.slice(0, checkLimit(type)).join(" / ")})` : "";
          const evidenceJson = item.evidence ? JSON.stringify(summarizeEvidenceForPrompt(item.evidence)) : "";
          const evidenceLabel = evidenceJson ? ` (추출된 분석 데이터: ${evidenceJson.slice(0, 12000)}${evidenceJson.length > 12000 ? "…(요약 한도 초과)" : ""})` : "";
          return `- ${item.title}: ${item.summary}${timeLabel}${causeLabel}${checkLabel}${evidenceLabel}`;
        });
        return `[선택한 ${typeLabelLookup[type]}]\n${lines.join("\n")}`;
      }).filter(Boolean);
      return [
        "다음은 사용자가 진단 과정에서 모은 정보입니다. 전부 같은 PC에서 발생한 문제일 가능성이 높습니다.",
        "각 항목의 '이미 확인된 점검 절차'는 사이트가 이미 검증한 점검 방법이니 새로 지어내지 말고, 이를 바탕으로 어떤 원인일 때 어떤 순서로 확인하면 되는지 우선순위를 정리하세요.",
        "이벤트 뷰어 자료가 있으면 이벤트의 발생 시각과 ID를 1차 기준으로 삼고, HWiNFO 로그는 해당 시각 전후의 온도·전력·팬·사용률을 확인하는 보조 근거로만 해석하세요.",
        "이들을 종합해서 가장 가능성 높은 원인과, 우선순위가 있는 점검·조치 순서를 알려주세요.",
        "",
        ...sections,
      ].join("\n");
    };
    const buildBasketFallback = (items, reason) => {
      const causes = [...new Set(items.flatMap((item) => item.causes))];
      const checks = [...new Set(items.flatMap((item) => item.checks))];
      return `
        ${renderAiMissingNotice(reason || "AI 서비스에 연결할 수 없었습니다.")}
        <p class="muted">AI가 종합 판단한 결과 대신, 담은 항목마다 사이트 자체 오류 데이터베이스(증상·오류코드·이벤트·로그·미니덤프·AI 질문 데이터) 기준으로 정리된 원인·점검 항목을 안내합니다. 여러 항목 간 우선순위까지 종합하지는 않으니, 어떤 항목이 지금 상황과 더 가까운지는 직접 판단해 주세요.</p>
        ${causes.length ? `<p><strong>원인 후보(사이트 데이터 기준)</strong></p><ul>${causes.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ul>` : ""}
        ${checks.length ? `<p><strong>점검·조치 항목(사이트 데이터 기준)</strong></p><ol>${checks.map((value) => `<li>${escapeEventText(value)}</li>`).join("")}</ol>` : ""}
      `;
    };
    const runCombinedAnalysis = async () => {
      const resultBox = basketRoot.querySelector("[data-basket-analysis-result]");
      const analysisItems = getAnalysisItems();
      if (!resultBox || !analysisItems.length) return;
      resultBox.innerHTML = `<p class="muted">담은 항목을 종합해 분석하는 중입니다… (최대 1분 정도 걸릴 수 있습니다)</p>`;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_ASK_TIMEOUT_MS);
        const res = await fetch(`${AI_SERVICE_BASE_URL}/api/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: buildBasketPrompt(analysisItems) }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = await res.json();
        const answerHtml = data.answer
          ? renderMarkdownLite(data.answer)
          : buildBasketFallback(analysisItems, "AI가 종합 분석 결과를 만들지 못했습니다.");
        basketAnalysisText = data.answer || "[AI 분석 누락] AI가 종합 분석 결과를 만들지 못해 사이트 자체 오류 데이터베이스 기준으로 원인·점검 항목을 안내했습니다.";
        resultBox.innerHTML = `${answerHtml}${renderAiSources(data.sources)}`;
      } catch {
        basketAnalysisText = "[AI 분석 누락] AI 서비스에 연결할 수 없어 사이트 자체 오류 데이터베이스 기준으로 원인·점검 항목을 안내했습니다.";
        resultBox.innerHTML = buildBasketFallback(analysisItems, "AI 서비스에 연결할 수 없었습니다.");
      }
    };
    renderBasket();
    diagnosticRoot.addEventListener("change", (event) => {
      const checklist = event.target.closest("[data-checklist-id]");
      if (checklist) {
        checklistState[checklist.dataset.checklistId] = checklist.checked;
        checklist.closest(".diagnosis-check-item")?.classList.toggle("is-checked", checklist.checked);
        const items = getChecklistItems();
        const completed = items.filter((entry) => checklistState[entry.id]).length;
        const progress = basketRoot.querySelector(".diagnosis-checklist-head > span");
        if (progress) progress.textContent = `${completed}/${items.length} 완료`;
        return;
      }
      const sessionSelect = event.target.closest("[data-session-load]");
      if (sessionSelect?.value) loadDiagnosisSession(sessionSelect.value);
    });
    diagnosticRoot.addEventListener("click", (event) => {
      if (event.target.closest("[data-basket-add-all-events]")) {
        if (!lastEventBasketBundle?.events?.length) return;
        const events = lastEventBasketBundle.events;
        const occurrences = events.flatMap((item) => item.occurrences || []).sort();
        const bundleItem = {
          key: `event:batch:${Date.now()}`,
          type: "event",
          title: `이벤트 뷰어 전체 분석 · ${lastEventBasketBundle.eventTypes || events.length}종 ${lastEventBasketBundle.totalRecords || occurrences.length}건`,
          summary: `이벤트 뷰어에서 읽은 ${lastEventBasketBundle.totalRecords || occurrences.length}건의 기록을 원본·발생 시각·XML 세부값과 함께 묶었습니다.`,
          causes: events.slice(0, 20).map((item) => `${item.source || "원본 미상"} ${item.id || "ID 미상"} · ${item.repeatCount || 1}회`),
          checks: [
            "이벤트 뷰어 기록의 발생 시각을 기준으로 HWiNFO 온도·전력·팬 로그를 ±5분 범위에서 비교",
            "오류·치명적 이벤트와 반복 횟수가 높은 원본부터 점검",
            "같은 시간대의 WHEA·Display·Disk·Kernel-Power 이벤트가 함께 발생했는지 확인",
            "저장장치·전원·그래픽 관련 오류가 반복되면 중요한 파일을 먼저 백업",
          ],
          timeStart: occurrences[0] || "",
          timeEnd: occurrences[occurrences.length - 1] || "",
          evidence: lastEventBasketBundle,
        };
        openBasketConfirm(bundleItem);
        return;
      }
      if (event.target.closest("[data-basket-add-all-logs]")) {
        if (!lastLogBasketBundle?.sessions?.length) return;
        const { sessions, verdict } = lastLogBasketBundle;
        const starts = sessions.map((s) => s.startTime).filter(Boolean).sort();
        const ends = sessions.map((s) => s.endTime).filter(Boolean).sort();
        const hotCount = sessions.filter((s) => s.thermalFault).length;
        const normalCount = sessions.filter((s) => s.abruptNormalEnd).length;
        const bundleItem = {
          key: `log:batch:${Date.now()}`,
          type: "log",
          title: `하드웨어 로그 전체 분석 · ${sessions.length}개 세션`,
          summary: verdict || `업로드한 ${sessions.length}개 로그 세션을 함께 묶었습니다. 세션별 분석 결과는 각 세션의 요약을 참고하세요.`,
          causes: sessions.map((s) => `${s.file}: ${s.summary}`),
          checks: [
            "세션별 종료 직전 온도·전압 상태(고온 종료/정상 범위 종료)를 비교",
            "반복되는 경고·분석 결론이 있는 세션부터 우선 점검",
            "세션 간 간격이 짧다면 재현 조건이 동일한지 확인",
          ],
          timeStart: starts[0] || "",
          timeEnd: ends[ends.length - 1] || "",
          evidence: lastLogBasketBundle,
          tone: hotCount > 0 ? "danger" : (normalCount === sessions.length && sessions.length >= 2 ? "warning" : "neutral"),
        };
        openBasketConfirm(bundleItem);
        return;
      }
      const addBtn = event.target.closest("[data-basket-add]");
      if (addBtn) {
        try {
          const item = JSON.parse(addBtn.dataset.basketItem);
          if (!basketItems.some((existing) => existing.key === item.key)) {
            openBasketConfirm(item);
          }
        } catch {
          // Ignore malformed payloads.
        }
        return;
      }
      const removeBtn = event.target.closest("[data-basket-remove]");
      if (removeBtn) {
        basketItems = basketItems.filter((item) => item.key !== removeBtn.dataset.basketRemove);
        writeBasket(basketItems);
        renderBasket();
        return;
      }
      if (event.target.closest("[data-session-save]")) {
        setSessionStatus(saveCurrentSession());
        return;
      }
      if (event.target.closest("[data-session-export]")) {
        setSessionStatus(exportCurrentSession());
        return;
      }
      if (event.target.closest("[data-session-new]")) {
        openConfirmDialog({
          title: "새 진단 시작",
          message: "현재 카트와 체크 상태를 비우고 새 진단을 시작할까요? 저장한 결과는 유지됩니다.",
          okLabel: "새로 시작",
          onConfirm: resetDiagnosisSession,
        });
        return;
      }
      const timeApply = event.target.closest("[data-time-apply]");
      if (timeApply) {
        try {
          timeAnalysisScope = JSON.parse(timeApply.dataset.timeApply);
          renderBasket();
          setSessionStatus("같은 시간대 기록을 종합 분석 대상으로 적용했습니다.");
        } catch {
          setSessionStatus("시간대 묶음을 적용하지 못했습니다.");
        }
        return;
      }
      if (event.target.closest("[data-time-skip]")) {
        timeAnalysisScope = null;
        renderBasket();
        setSessionStatus("시간 통합 없이 전체 항목을 분석합니다.");
        return;
      }
      if (event.target.closest("[data-basket-analyze]")) {
        runCombinedAnalysis();
        return;
      }
      if (event.target.closest("[data-confirm-ok]")) {
        pendingConfirmAction?.();
        closeConfirmDialog();
        return;
      }
      if (event.target.closest("[data-confirm-cancel]") || event.target === confirmOverlay) {
        closeConfirmDialog();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && confirmOverlay && !confirmOverlay.hidden) {
        closeConfirmDialog();
      }
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
    let selectedLogFormat = "";
    const logFormatInfo = {
      dxdiag: { label: "dxdiag", extensions: ["txt", "log"], accept: ".txt,.log,text/plain" },
      msinfo32: { label: "msinfo32", extensions: ["txt", "log"], accept: ".txt,.log,text/plain" },
      crystaldiskinfo: { label: "CrystalDiskInfo", extensions: ["txt", "log"], accept: ".txt,.log,text/plain" },
      hwinfo: { label: "HWiNFO", extensions: ["csv", "txt", "log"], accept: ".csv,.txt,.log,text/csv,text/plain" },
    };
    const focusLogFormatPicker = () => {
      if (!logFormatPicker) return;
      logFormatPicker.scrollIntoView({ behavior: "smooth", block: "center" });
      logFormatPicker.classList.add("is-highlight");
      const firstButton = logFormatPicker.querySelector("[data-log-format]");
      if (firstButton) firstButton.focus({ preventScroll: true });
      setTimeout(() => logFormatPicker.classList.remove("is-highlight"), 1600);
    };
    const showLogFileError = (message) => {
      logResult.innerHTML = `<div class="log-alert log-alert--medium"><strong>파일 형식을 확인해 주세요</strong><p>${escapeEventText(message)}</p></div>`;
    };
    const isCompatibleLogFile = (file) => {
      if (!selectedLogFormat) return true;
      const info = logFormatInfo[selectedLogFormat];
      const extension = String(file.name || "").split(".").pop().toLowerCase();
      return info.extensions.includes(extension);
    };
    // HWiNFO를 한글 Windows에서 CSV로 로깅하면, "성능 제한 사유(Yes/No)" 같은
    // 일부 텍스트 값만 시스템 로캘(CP949/windows-949)로 저장되고 나머지는
    // UTF-8로 저장되는 경우가 있다(HWiNFO 자체의 알려진 인코딩 버그). 이런
    // 파일은 단일 인코딩으로는 절대 깨끗하게 디코딩되지 않는다 — UTF-8로
    // 읽으면 CP949 구간이 치환 문자로 깨지고, CP949로 읽으면 반대로 UTF-8
    // 한글 헤더가 깨진다. 그래서 UTF-8로 유효한 구간은 그대로 UTF-8로, 그
    // 사이에 낀 UTF-8로 무효한 바이트 구간만 CP949로 디코딩해 이어붙인다.
    const decodeMixedUtf8Cp949 = (buffer) => {
      try {
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        const fallbackDecoder = new TextDecoder("windows-949");
        const bytes = new Uint8Array(buffer);
        const len = bytes.length;
        const utf8SeqLen = (b) => {
          if (b < 0x80) return 1;
          if ((b & 0xE0) === 0xC0) return 2;
          if ((b & 0xF0) === 0xE0) return 3;
          if ((b & 0xF8) === 0xF0) return 4;
          return -1;
        };
        const isValidUtf8Seq = (start, seqLen) => {
          if (start + seqLen > len) return false;
          for (let k = 1; k < seqLen; k += 1) {
            if ((bytes[start + k] & 0xC0) !== 0x80) return false;
          }
          return true;
        };
        const parts = [];
        let runStart = 0;
        let i = 0;
        let hadInvalidRun = false;
        while (i < len) {
          const seqLen = utf8SeqLen(bytes[i]);
          if (seqLen === -1 || !isValidUtf8Seq(i, seqLen)) {
            hadInvalidRun = true;
            if (i > runStart) parts.push(utf8Decoder.decode(bytes.subarray(runStart, i)));
            // 무효 구간은 다음 ASCII 바이트(쉼표 등 구분자)가 나올 때까지로
            // 본다. CP949 바이트 중간에 우연히 "유효해 보이는" UTF-8 2바이트
            // 패턴이 섞여 있을 수 있어서, 그런 패턴만으로 구간을 끊으면
            // "아니요" 같은 6바이트 값의 중간에서 잘못 끊기는 문제가 있었다.
            let j = i + 1;
            while (j < len && bytes[j] >= 0x80) {
              j += 1;
            }
            parts.push(fallbackDecoder.decode(bytes.subarray(i, j)));
            runStart = j;
            i = j;
          } else {
            i += seqLen;
          }
        }
        if (len > runStart) parts.push(utf8Decoder.decode(bytes.subarray(runStart, len)));
        return hadInvalidRun ? parts.join("") : null;
      } catch {
        return null;
      }
    };
    const decodeHardwareFile = async (file) => {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const utf8Text = new TextDecoder("utf-8").decode(buffer);
      // 1) 유효한 UTF-8(순수 ASCII인 영문 로그 포함)이면 그대로 쓴다. 점수 경쟁으로
      //    인코딩을 고르면, 영문 로그를 windows-949로 읽을 때 BOM이나 "°C"의 바이트가
      //    우연히 한글 몇십 글자로 해석돼 점수가 올라가 잘못 뽑히는 문제가 있었다.
      if (!/�/.test(utf8Text) && !/\u0000/.test(utf8Text)) return utf8Text;
      // 2) UTF-16(BOM 또는 NUL이 섞인 파일)
      if ((bytes[0] === 0xFF && bytes[1] === 0xFE) || (bytes[0] === 0xFE && bytes[1] === 0xFF)) {
        return new TextDecoder(bytes[0] === 0xFE ? "utf-16be" : "utf-16le").decode(buffer);
      }
      if ((utf8Text.match(/\u0000/g) || []).length > 4) return new TextDecoder("utf-16le").decode(buffer);
      // 3) 남은 바이트 패턴으로 인코딩을 판정한다.
      //    - 유효한 UTF-8 다바이트 조각이 있으면: HWiNFO 한글판처럼 UTF-8 헤더 사이에
      //      CP949 값이 섞인 파일 → 혼합 복원
      //    - UTF-8 조각은 없고 한글 2바이트 쌍(KS X 1001)이 많으면: CP949로 저장된 파일
      //    - 그 외(고립된 °, µ 같은 바이트만 있음): 영문 Windows의 ANSI(windows-1252)
      let utf8Multi = 0;
      let hangulPairs = 0;
      for (let i = 0; i < bytes.length; i += 1) {
        const b = bytes[i];
        if (b < 0x80) continue;
        const need = (b & 0xE0) === 0xC0 ? 1 : (b & 0xF0) === 0xE0 ? 2 : (b & 0xF8) === 0xF0 ? 3 : 0;
        if (need && i + need < bytes.length && Array.from({ length: need }, (_, k) => bytes[i + 1 + k]).every((c) => (c & 0xC0) === 0x80)) {
          utf8Multi += 1;
          i += need;
        } else if (b >= 0xB0 && b <= 0xC8 && bytes[i + 1] >= 0xA1 && bytes[i + 1] <= 0xFE) {
          hangulPairs += 1;
          i += 1;
        }
      }
      if (utf8Multi >= 5) {
        const mixedDecoded = decodeMixedUtf8Cp949(buffer);
        if (mixedDecoded) return mixedDecoded;
      }
      if (hangulPairs >= 20) return new TextDecoder("windows-949").decode(buffer);
      return new TextDecoder("windows-1252").decode(buffer);
    };
    // 재부팅 때문에 로그가 여러 개로 쪼개진 경우(게임 중 3번 재부팅 → HWiNFO
    // 파일 3개), 파일 하나씩만 볼 수 있으면 "이게 우연인지 반복되는 고장인지"를
    // 사람이 일일이 대조해야 한다. 여러 파일을 한 번에 받아 세션별로 분석한 뒤
    // 시작·종료 시각, 세션 간 간격, 종료 직전 상태(정상/과열)를 나란히 비교해
    // 재현성 여부를 자동으로 보여준다.
    const renderMultiLogAnalysis = (items) => {
      const sessions = items.map(({ file, report }) => {
        const startMs = report.quality?.startTime ? new Date(report.quality.startTime).getTime() : null;
        const endMs = report.quality?.endTime ? new Date(report.quality.endTime).getTime() : null;
        // 진단 제목 문자열을 그대로 비교하면 문구만 바뀌어도 연결이 깨지므로,
        // analyzeHardwareLog가 명시적으로 내려주는 boolean 플래그를 사용한다.
        const abruptNormal = report.abruptNormalEnd === true;
        const hot = report.thermalFault === true;
        return { file, report, startMs, endMs, abruptNormal, hot };
      }).sort((a, b) => (a.startMs ?? 0) - (b.startMs ?? 0));

      const fmt = (ms) => ms ? new Date(ms).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "확인 불가";
      const allHwinfo = sessions.every((s) => s.report.source?.key === "hwinfo");
      const haveTimes = sessions.filter((s) => s.startMs && s.endMs);

      let summaryHtml = "";
      let verdict = "";
      if (allHwinfo && haveTimes.length >= 2) {
        const rows = sessions.map((s, i) => {
          const durationMin = s.startMs && s.endMs ? Math.round((s.endMs - s.startMs) / 60000) : null;
          const gapNote = i > 0 && sessions[i - 1].endMs && s.startMs
            ? ` · 이전 세션 종료 후 ${Math.round((s.startMs - sessions[i - 1].endMs) / 60000)}분 뒤 시작`
            : "";
          const endState = s.hot ? "종료 직전 고온" : s.abruptNormal ? "정상 범위에서 종료" : "판단 보류";
          return `<li><strong>세션 ${i + 1}</strong> (${escapeEventText(s.file.name)}) — ${fmt(s.startMs)} ~ ${fmt(s.endMs)}${durationMin !== null ? ` · 약 ${durationMin}분` : ""} · ${endState}${gapNote}</li>`;
        }).join("");
        const normalCount = sessions.filter((s) => s.abruptNormal).length;
        const hotCount = sessions.filter((s) => s.hot).length;
        if (normalCount === sessions.length && sessions.length >= 2) {
          verdict = `업로드한 ${sessions.length}개 세션 모두 온도·전압이 정상 범위인 채로 로그가 끊겼습니다. 우연이 아니라 반복되는 패턴이라는 뜻으로, 서서히 진행되는 발열보다 파워서플라이·전원 케이블·커넥터 접촉 불량 같은 "순간 전원 차단" 원인에 무게가 실립니다. 세션 길이가 짧은 경우(10분 내외)와 긴 경우(수 시간)에서 모두 발생했다면 특정 부하·발열 누적과 무관하다는 근거이기도 합니다.`;
        } else if (hotCount > 0 && normalCount > 0) {
          verdict = `세션마다 종료 직전 상태가 다릅니다(고온 종료 ${hotCount}회, 정상 범위 종료 ${normalCount}회). 한 가지 원인으로 단정하기보다 각 세션의 부하·게임·실행 시간대를 비교해, 발열 문제와 전원 문제가 섞여 있을 가능성을 확인하세요.`;
        } else {
          verdict = `세션별 종료 상태를 판단할 근거가 부족합니다. 각 세션의 개별 분석 결과를 아래에서 확인하세요.`;
        }
        summaryHtml = `
          <div class="log-alert log-alert--medium">
            <strong>다중 세션 비교 (${sessions.length}개 로그)</strong>
            <p>${verdict}</p>
            <ul class="mini-list" style="margin-top:.5rem">${rows}</ul>
          </div>
        `;
      } else {
        summaryHtml = `
          <div class="log-alert log-alert--low">
            <strong>다중 세션 비교</strong>
            <p>${sessions.length}개 파일을 각각 분석했습니다. ${allHwinfo ? "시간 정보를 읽지 못해 세션 간 비교는 생략합니다." : "HWiNFO 외의 형식이 섞여 있어 세션 비교 대신 개별 로그로만 분석합니다."}</p>
          </div>
        `;
      }

      const individualHtml = sessions.map((s, i) => `
        <div style="margin-top:1.1rem;padding-top:1.1rem;border-top:1px solid var(--border)">
          <h4 style="margin:0 0 .5rem">세션 ${i + 1} · ${escapeEventText(s.file.name)}</h4>
          ${renderLogAnalysis(s.report, `${i + 1}-${s.file.name}`)}
        </div>
      `).join("");

      lastLogBasketBundle = {
        kind: "log-batch",
        sessions: sessions.map((s) => ({
          file: s.file.name,
          source: s.report.source?.label || "",
          summary: s.report.summary || "",
          startTime: s.startMs ? new Date(s.startMs).toISOString() : "",
          endTime: s.endMs ? new Date(s.endMs).toISOString() : "",
          abruptNormalEnd: s.abruptNormal,
          thermalFault: s.hot,
          alerts: (s.report.alerts || []).map((item) => `${item.title}: ${item.detail}`),
          diagnoses: (s.report.diagnoses || []).map((item) => `${item.title}: ${item.detail}`),
        })),
        verdict,
      };

      return summaryHtml + individualHtml + renderLogBatchButton();
    };
    const readAndRenderLogFile = async (file) => {
      if (!file) return;
      if (!isCompatibleLogFile(file)) {
        const info = logFormatInfo[selectedLogFormat];
        showLogFileError(`${info.label} 분석에는 ${info.extensions.map((extension) => `.${extension}`).join(", ")} 파일을 사용하세요. 다른 형식이라면 위에서 로그 종류를 먼저 바꾸세요.`);
        return;
      }
      currentHardwareLogMeta = { name: file.name, size: file.size, type: file.type };
      const text = await decodeHardwareFile(file);
      logInput.value = text;
      renderHardwareLog(text);
    };
    const readAndRenderLogFiles = async (fileList) => {
      const files = Array.from(fileList || []).filter(Boolean);
      if (!files.length) return;
      const incompatible = files.filter((file) => !isCompatibleLogFile(file));
      if (incompatible.length === files.length) {
        const info = logFormatInfo[selectedLogFormat];
        showLogFileError(`${info.label} 분석에는 ${info.extensions.map((extension) => `.${extension}`).join(", ")} 파일을 사용하세요. 다른 형식이라면 위에서 로그 종류를 먼저 바꾸세요.`);
        return;
      }
      const validFiles = files.filter((file) => isCompatibleLogFile(file));
      if (validFiles.length === 1) {
        await readAndRenderLogFile(validFiles[0]);
        return;
      }
      // 파일이 여러 개면 textarea(단일 텍스트 입력)로는 표현이 안 되니 비우고
      // 안내만 남긴다. 각 파일은 analyzeHardwareLog를 그대로 재사용해 개별
      // 분석 정확도는 단일 파일 때와 동일하게 유지한다.
      logInput.value = "";
      currentHardwareLogMeta = null;
      logResult.innerHTML = `<p class="muted">${validFiles.length}개 파일을 분석하는 중입니다…</p>`;
      const items = [];
      for (const file of validFiles) {
        currentHardwareLogMeta = { name: file.name, size: file.size, type: file.type };
        const text = await decodeHardwareFile(file);
        const report = analyzeHardwareLog(text, selectedLogFormat || undefined);
        items.push({ file, report });
      }
      currentHardwareLogMeta = null;
      logResult.innerHTML = renderMultiLogAnalysis(items);
    };
    logInput.addEventListener("input", () => {
      currentHardwareLogMeta = null;
      renderHardwareLog(logInput.value);
    });
    logFileInput.addEventListener("change", async () => {
      await readAndRenderLogFiles(logFileInput.files);
    });
    logFileLabel.addEventListener("click", (event) => {
      if (selectedLogFormat) return;
      event.preventDefault();
      focusLogFormatPicker();
    });
    // 로그 종류를 선택하면 첨부 형식과 해당 분석 기준을 함께 바꾼다.
    diagnosticRoot.querySelectorAll("[data-log-format]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.dataset.logFormat;
        selectedLogFormat = key;
        const info = logFormatInfo[key];
        logFileInput.disabled = false;
        logFileInput.accept = info.accept;
        logFileLabelText.textContent = `${info.label} 파일 첨부`;
        logFileLabel.classList.remove("is-disabled");
        logFileLabel.setAttribute("aria-disabled", "false");
        logSelectionStatus.textContent = `${info.label} 로그를 선택했습니다. ${info.extensions.map((extension) => `.${extension}`).join(", ")} 파일을 첨부하면 ${info.label} 전용 기준으로 분석합니다.`;
        diagnosticRoot.querySelectorAll("[data-log-format]").forEach((b) => {
          b.classList.toggle("is-active", b === btn);
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        // 이미 붙여넣은 텍스트가 있는 상태에서 로그 종류를 바꾸면, 바뀐 형식
        // 기준으로 즉시 다시 분석해 보여준다(형식만 바꾸고 재분석이 안 되는
        // 문제를 막기 위함).
        if (logInput.value.trim()) renderHardwareLog(logInput.value);
        const guide = diagnosticRoot.querySelector(`[data-log-guide="${key}"]`);
        if (!guide) return;
        guide.open = true;
        guide.scrollIntoView({ behavior: "smooth", block: "center" });
        guide.classList.add("is-highlight");
        setTimeout(() => guide.classList.remove("is-highlight"), 1600);
      });
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
      const files = event.dataTransfer && event.dataTransfer.files;
      if (!files || !files.length) return;
      if (!selectedLogFormat) {
        showLogFileError("파일을 첨부하기 전에 위에서 dxdiag, msinfo32, CrystalDiskInfo 또는 HWiNFO 중 하나를 선택하세요.");
        focusLogFormatPicker();
        return;
      }
      await readAndRenderLogFiles(files);
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
        openConfirmDialog({
          title: "최근 검색 비우기",
          message: "최근 검색한 오류 코드 목록이 모두 사라집니다. 비울까요?",
          okLabel: "비우기",
          onConfirm: () => {
            try {
              localStorage.removeItem(storageKey);
            } catch {
              // Ignore storage failures.
            }
            renderRecentHistory();
          },
        });
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
        ${symptom.overview ? `<p class="detail-overview">${symptom.overview}</p>` : ""}
        <p><strong>가능성 높은 원인</strong></p>
        <ul>${symptom.causes.map((value) => `<li>${value}</li>`).join("")}</ul>
        <p><strong>권장 점검 순서</strong></p>
        <ol>${symptom.checks.map((value) => `<li>${value}</li>`).join("")}</ol>
        <p><a href="${symptom.link}">자세한 가이드 열기</a></p>
        <div class="result-card-actions">
          ${buildAddToBasketButton({
            type: "symptom",
            key: symptom.id,
            title: symptom.title,
            summary: symptom.summary,
            causes: symptom.causes,
            checks: symptom.checks,
          })}
        </div>
        ${buildPowerInstabilityHints(symptom)}
      `;
      diagnosticRoot.querySelectorAll(".diag-card").forEach((card) => card.classList.toggle("active", card.dataset.symptom === symptom.id));
    });

    // ── 미니덤프 분석 패널 ───────────────────────────────────────────
    (() => {
      const DMP_API = 'https://ai.itsvc.co.kr/api/minidump/analyze';
      const dropZone  = diagnosticRoot.querySelector('[data-dmp-drop]');
      const fileInput = diagnosticRoot.querySelector('[data-dmp-file]');
      const fileBtn   = diagnosticRoot.querySelector('[data-dmp-file-btn]');
      const resetBtn  = diagnosticRoot.querySelector('[data-dmp-reset]');
      const resultBox = diagnosticRoot.querySelector('[data-dmp-result]');
      if (!dropZone || !resultBox) return;

      const STOP_CODES = { '0x50': 'PAGE_FAULT_IN_NONPAGED_AREA', '0xd1': 'DRIVER_IRQL_NOT_LESS_OR_EQUAL', '0x116': 'VIDEO_TDR_FAILURE', '0x7e': 'SYSTEM_THREAD_EXCEPTION_NOT_HANDLED', '0x3b': 'SYSTEM_SERVICE_EXCEPTION', '0x124': 'WHEA_UNCORRECTABLE_ERROR', '0x133': 'DPC_WATCHDOG_VIOLATION', '0x24': 'NTFS_FILE_SYSTEM', '0xef': 'CRITICAL_PROCESS_DIED' };

      const setLoading = (on) => {
        resultBox.innerHTML = on
          ? '<p><span class="muted">🔍 덤프 파일을 분석하는 중입니다…</span></p>'
          : '';
      };

      const renderDmpResult = (d) => {
        const stopHex  = d.stopCode ? d.stopCode.toUpperCase() : '—';
        const stopName = d.stopCodeName || STOP_CODES[d.stopCode?.toLowerCase()] || '';
        const stopDesc = d.stopCodeDesc || '';
        const fault    = d.faultingModule || '';
        const fDesc    = d.faultingModuleDesc || '';
        const fAction  = d.faultingModuleAction || '';
        const os       = d.osBuild ? `Windows ${d.osBuild}` : '';
        const modCount = (d.modules || []).length;

        const faultHtml = fault ? `
          <div class="log-alert log-alert--high" style="margin-top:.75rem">
            <strong>원인 드라이버: <code>${fault}</code></strong>
            ${fDesc ? `<p>${fDesc}</p>` : ''}
            ${fAction ? `<p style="margin-top:.3rem;font-weight:600">→ ${fAction}</p>` : ''}
          </div>` : '';

        const stopHtml = d.stopCode ? `
          <div class="log-alert log-alert--high">
            <strong>STOP 코드: ${stopHex}${stopName ? ` · ${stopName}` : ''}</strong>
            ${stopDesc ? `<p>${stopDesc}</p>` : ''}
          </div>` : `<div class="log-alert log-alert--medium"><strong>STOP 코드를 식별하지 못했습니다</strong><p>모듈 목록을 직접 확인하세요.</p></div>`;

        const chipHtml = [
          os ? `<span class="log-focus-item">${os}</span>` : '',
          d.arch ? `<span class="log-focus-item">${d.arch}</span>` : '',
          modCount ? `<span class="log-focus-item">모듈 ${modCount}개</span>` : '',
        ].filter(Boolean).join('');

        // 백엔드(minidump_parser.py)가 이제 코드별 실제 가이드 페이지를
        // stopCodeGuidePage로 직접 내려준다(64개 코드 중 49개 커버). 이 패널의
        // guideLinks는 9개만 수동으로 걸어 둔 예전 표라, 그것만 쓰면 나머지
        // 40개 코드는 STOP 코드명은 나와도 가이드 링크가 안 붙는다.
        const guideLinks = {
          '0x116': 'gpu-upgrade-guide.html',
          '0xef':  'windows-bsod-critical-process.html',
        };
        const guideHref = d.stopCodeGuidePage || (d.stopCode ? guideLinks[d.stopCode.toLowerCase()] : null);
        const guideHtml = guideHref
          ? `<div class="log-link-list" style="margin-top:.5rem"><a href="${guideHref}">이 STOP 코드 상세 가이드 보기</a></div>`
          : '';

        resultBox.innerHTML = `
          <div class="log-source log-source--high"><strong>Windows 미니덤프 분석</strong><span>결함 모듈 식별 · 서버 측 파싱</span></div>
          ${stopHtml}
          ${faultHtml}
          ${chipHtml ? `<div class="log-focus-list" style="margin-top:.5rem">${chipHtml}</div>` : ''}
          ${guideHtml}
          <div class="result-card-actions" style="margin-top:.75rem">
            <a class="btn secondary code-button" href="minidump-analyzer.html" style="font-size:.8rem">상세 분석 페이지 열기</a>
          </div>
        `;
        resetBtn.style.display = '';
      };

      const renderDmpError = (msg) => {
        resultBox.innerHTML = `<div class="log-alert log-alert--medium"><strong>분석 실패</strong><p>${msg}</p></div>`;
        resetBtn.style.display = '';
      };

      const analyzeDmp = async (file) => {
        if (!file?.name.toLowerCase().endsWith('.dmp')) { renderDmpError('.dmp 파일만 분석할 수 있습니다.'); return; }
        if (file.size > 64 * 1024 * 1024) { renderDmpError('파일이 64 MB를 초과합니다. C:\\Windows\\Minidump\\ 폴더의 미니덤프를 사용하세요.'); return; }
        setLoading(true);
        resetBtn.style.display = 'none';
        try {
          const fd = new FormData();
          fd.append('file', file, file.name);
          const res = await fetch(DMP_API, { method: 'POST', body: fd });
          if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `서버 오류 (HTTP ${res.status})`); }
          renderDmpResult(await res.json());
        } catch (e) {
          renderDmpError(e.message || '서버에 연결할 수 없습니다.');
        }
      };

      dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
      dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
      dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-over'); const f = e.dataTransfer.files[0]; if (f) analyzeDmp(f); });
      dropZone.addEventListener('click', () => fileInput.click());
      dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
      fileInput.addEventListener('change', () => { if (fileInput.files[0]) analyzeDmp(fileInput.files[0]); });
      fileBtn.addEventListener('change', () => { if (fileBtn.files[0]) analyzeDmp(fileBtn.files[0]); });
      resetBtn.addEventListener('click', () => {
        resultBox.innerHTML = '<p>덤프 파일을 선택하면 STOP 코드와 원인 드라이버가 표시됩니다.</p>';
        resetBtn.style.display = 'none';
        fileInput.value = ''; fileBtn.value = '';
      });
    })();

    renderRecentHistory();
    renderHardwareLog("");
    const hashMode = window.location.hash.replace("#diagnostic-", "");
    if (hashMode && modePanels.some((panel) => panel.dataset.diagnosticPanel === hashMode)) {
      activateDiagnosticMode(hashMode);
    }
    // 구글 사이트링크 검색창(schema.org SearchAction)이 diagnostic.html?code=...로
    // 연결되므로, 쿼리 파라미터로 들어오면 오류 코드 탭을 열고 바로 검색해준다.
    const queryCode = new URLSearchParams(window.location.search).get("code");
    if (queryCode) {
      activateDiagnosticMode("code");
      codeInput.value = queryCode;
      renderCodeResult(queryCode);
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
};
