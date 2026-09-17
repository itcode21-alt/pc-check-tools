(() => {
  // data.js의 동적 텍스트(증상 제목 등) 뒤에 조사(을/를, 은/는)를 붙일 때
  // 마지막 글자의 받침 유무에 따라 골라 쓴다 — 하드코딩하면 "확인를"처럼
  // 받침 있는 단어 뒤에서 문법이 깨진다(2026-08-07 발견).
  const josa = (word, withBatchim, withoutBatchim) => {
    const text = String(word || "").trim();
    const lastChar = text.charCodeAt(text.length - 1);
    if (Number.isNaN(lastChar) || lastChar < 0xac00 || lastChar > 0xd7a3) return withoutBatchim;
    return (lastChar - 0xac00) % 28 !== 0 ? withBatchim : withoutBatchim;
  };

  // 상세 진단 페이지는 app.js만 불러오는 경우가 많습니다.
  // 공통 site.js를 동적으로 추가해 전 페이지에서 같은 메뉴·푸터를 사용합니다.
  // 페이지에 이미 site.js가 <script> 태그로 정적으로 들어있는 경우(대부분의
  // 페이지가 여기 해당)까지 data-itsvc-site-shell 속성 유무로만 판단하면
  // 정적 태그는 그 속성이 없어 매번 중복 로드되므로, src 자체를 함께 검사한다.
  const siteJsAlreadyLoaded = Array.from(document.querySelectorAll("script[src]"))
    .some((script) => script.src.includes("site.js"));
  if (!siteJsAlreadyLoaded && !document.querySelector('script[data-itsvc-site-shell]')) {
    const siteShell = document.createElement("script");
    siteShell.src = "site.js?v=nav-submenu-20260720";
    siteShell.defer = true;
    siteShell.dataset.itsvcSiteShell = "true";
    document.head.append(siteShell);
  }

  // 어필리에이트 안내문 자동 삽입(addAffiliateDisclosures)과 그 MutationObserver는
  // site.js에만 둔다. 예전엔 이 파일에도 완전히 동일한 로직이 복제돼 있었는데,
  // app.js만 정적으로 로드하고 site.js는 위에서 동적으로 추가하는 페이지(증상·
  // 오류코드 상세 등 대부분의 페이지)에서 동일한 body를 감시하는 MutationObserver가
  // 2개씩 붙어 있었다(2026-08-10 발견 — pc-recommendation.html의 무한 루프 버그를
  // 고치다가 우연히 찾음). 관찰자가 2개면 성능 낭비일 뿐 아니라, 앞으로 누군가
  // .card/.section 래퍼 없이 쿠팡 링크를 추가하는 실수를 반복하면 무한 루프가
  // 2배로 증폭될 위험이 있어 제거함 — 위에서 site.js를 항상 로드하도록 보장하고
  // 있고, site.js가 로드되자마자 자체적으로 전체 스캔 1회 + 옵저버 등록을 하므로
  // 이 파일에서 따로 처리하지 않아도 안전하다.

  const data = window.SITE_DATA || { symptoms: [] };
  const storageKey = "pc_recent_error_codes";
  const currentPage = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  
  
  let selectedGuideKind = "all";
  
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

  const codeToBoardParts = new Map();
  (data.boardParts || []).forEach((part) => {
    (part.codes || []).forEach((code) => {
      const key = normalizeCode(code);
      if (!codeToBoardParts.has(key)) codeToBoardParts.set(key, []);
      codeToBoardParts.get(key).push(part);
    });
  });
  const codeToEvents = new Map();
  (data.eventViewerCodes || []).forEach((event) => {
    (event.relatedCodes || []).forEach((code) => {
      const key = normalizeCode(code);
      if (!codeToEvents.has(key)) codeToEvents.set(key, []);
      codeToEvents.get(key).push(event);
    });
  });
  const getRelatedEvents = (item) => codeToEvents.get(normalizeCode(item.code)) || [];
  const getRelatedBoardParts = (item) => codeToBoardParts.get(normalizeCode(item.code)) || [];
  const getRelatedErrorCodes = (item) => {
    const key = normalizeCode(item.code);
    const parts = codeToBoardParts.get(key) || [];
    const seen = new Set([key]);
    const related = [];
    parts.forEach((part) => {
      (part.codes || []).forEach((code) => {
        const otherKey = normalizeCode(code);
        if (seen.has(otherKey)) return;
        seen.add(otherKey);
        const otherItem = findErrorCode(code);
        if (otherItem) related.push(otherItem);
      });
    });
    return related;
  };
  const appLaunchCodes = new Set(["0xc0000142", "0xc000007b", "0xc0000005", "0xc0000022", "msvcp140.dll 오류", "이 앱이 pc에서 실행되지 않습니다", "브라우저 응답 없음", "aw snap 오류"]);
  const gameCodes = new Set(["뱅가드 오류", "이지 안티치트 오류", "배틀넷 연결 오류", "로스트아크 실행 오류", "메이플스토리 실행 오류", "리그오브레전드 패치 오류", "서든어택 넷프로텍트 오류", "fc 온라인 실행 오류", "스팀 서버 연결 실패"]);
  // 접두사 규칙만으로는 분류되지 않는 개별 코드에 대한 명시적 분류.
  // 새 오류 코드를 data.js에 추가할 때 여기 목록도 함께 검토해 '일반'으로만 남지 않게 한다.
  const explicitKindOverrides = {
    "0x0000004E": { label: "메모리", className: "memory" },
    "0x8007000E": { label: "메모리", className: "memory" },
    "0x000000C5": { label: "드라이버", className: "driver" },
    "0x0000008E": { label: "시스템", className: "system" },
    "0xC000000E": { label: "부팅", className: "boot" },
    "0x803F7001": { label: "권한", className: "permission" },
    "0xC004F050": { label: "권한", className: "permission" },
    "0x800B0101": { label: "권한", className: "permission" },
    "0x80070422": { label: "시스템", className: "system" },
    "0x80070070": { label: "저장장치", className: "storage" },
    "0x80070020": { label: "시스템", className: "system" },
    "0x800705B4": { label: "시스템", className: "system" },
    "0x80070003": { label: "시스템", className: "system" },
    "0x80072F8F": { label: "네트워크", className: "network" },
    "0x80070490": { label: "네트워크", className: "network" },
    "0x8007045D": { label: "저장장치", className: "storage" },
    "0x00000079": { label: "하드웨어", className: "hardware" },
  };
  const getErrorCodeKind = (item) => {
    const rawCode = String(item.code || "");
    if (gameCodes.has(rawCode.toLowerCase())) return { label: "게임", className: "game" };
    if (appLaunchCodes.has(rawCode.toLowerCase())) return { label: "앱 실행", className: "app" };
    if (rawCode.startsWith("코드")) return { label: "드라이버", className: "driver" };
    if (rawCode.startsWith("오류")) return { label: "설치/제거", className: "install" };
    const code = normalizeCode(item.code);
    if (explicitKindOverrides[code]) return explicitKindOverrides[code];
    if (code.startsWith("0xC000021A") || code.startsWith("0xC000000F") || code.startsWith("0xC0000225") || code.startsWith("0x00000074") || code.startsWith("0x000000A5") || code.startsWith("0x000000ED")) return { label: "부팅", className: "boot" };
    if (code.startsWith("0x800F") || code.startsWith("0x80070002") || code.startsWith("0x80070057") || code.startsWith("0x80004005") || code.startsWith("0x8024") || code.startsWith("0xC1900") || code.startsWith("0x80073712")) return { label: "업데이트", className: "update" };
    if (code.startsWith("0x80070005")) return { label: "권한", className: "permission" };
    if (code.startsWith("0x80070522") || code.startsWith("0x800900") || code.startsWith("0x800903") || /제어된\s*폴더|권한|인증/.test(rawCode)) return { label: "권한", className: "permission" };
    if (code.startsWith("0x00000113") || code.startsWith("0x00000116") || code.startsWith("0x00000117") || code.startsWith("0x00000119") || code.startsWith("0x000000EA")) return { label: "그래픽", className: "graphics" };
    if (code.startsWith("0x000000D1") || code.startsWith("0x0000009F") || code.startsWith("0x000000C2") || code.startsWith("0x000000F7")) return { label: "드라이버", className: "driver" };
    if (code.startsWith("0x00000019") || code.startsWith("0x0000001A") || code.startsWith("0x00000050") || code.startsWith("0x000000BE") || code.startsWith("0x000000D8")) return { label: "메모리", className: "memory" };
    if (code.startsWith("0x0000007B") || code.startsWith("0x0000007A") || code.startsWith("0x00000133") || code.startsWith("0x80070570")) return { label: "저장장치", className: "storage" };
    if (/^(0x8007232B|0x800704CF|0x80070035|0x80070718|0x80072EFD|0x8007274C|0x800704B3|0x80070102|0x80072EE2|0x80072EE7)/.test(code)) return { label: "네트워크", className: "network" };
    if (/^(0x00000124|0x0000009C|0x00000101|0x0000012B|0x00000080|0x0000007F|0x0000002E|0x00000077|0x000000F2|0x00000154)/.test(code)) return { label: "하드웨어", className: "hardware" };
    if (/^(0x0000001E|0x000000EF|0x0000003B|0x0000007E|0x0000000A|0x00000024|0x000000F4|0x00000139|0x000000C4|0x000000FE|0x0000005C|0x00000109|0x0000009E|0x00000119|0x0000013A|0x00000144|0x00000164)/.test(code) || /탐색기|셸 확장|Windows Audio|인쇄 스풀러|최신 대기 모드|SysMain|TiWorker/.test(rawCode)) return { label: "시스템", className: "system" };
    return { label: "일반", className: "general" };
  };
  const getErrorCodeIcon = (item) => {
    const kind = getErrorCodeKind(item).className;
    const map = {
      boot: "B",
      update: "U",
      network: "W",
      permission: "P",
      graphics: "G",
      driver: "D",
      memory: "M",
      storage: "S",
      hardware: "H",
      system: "Y",
      install: "N",
      app: "A",
      game: "K",
      general: "I",
    };
    return map[kind] || "I";
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
  
  const readRecentCodes = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "[]").filter(Boolean);
    } catch {
      return [];
    }
  };
  
  
  
  
  const renderExampleTiles = (code) => {
    const examples = code.examples || [
      `${code.code} 관련 증상이 부팅 또는 작업 중 반복됨`,
      "발생 직전 실행 중이던 프로그램이나 작업",
      "화면에 표시된 정확한 코드와 부가 메시지"
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
        interpretation: "이 코드는 한 가지 부품만 지목하기보다 발생 시점과 함께 나타난 증상을 기준으로 해석해야 합니다. 최근 변경 사항, 반복 조건, 안전 모드에서의 재현 여부를 기록하면 원인을 좁히는 데 도움이 됩니다.",
        caution: "원인이 확인되지 않은 상태에서 레지스트리 수정이나 초기화를 먼저 진행하지 마세요.",
        next: "같은 코드가 반복되면 발생 시각과 직전 작업을 기록하고, 관련 증상 페이지나 공식 지원 문서에서 같은 코드 사례를 함께 확인하세요."
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
  
  
  
  
  // 사용자가 로그 종류 칩(dxdiag/msinfo32/CrystalDiskInfo/HWiNFO)을 직접
  // 선택했는데도, 파일 내용이 자동 인식 정규식과 안 맞으면 조용히 "일반
  // 로그"로 떨어져 훨씬 단순한 분석만 나오는 문제가 있었다. 사용자가 형식을
  // 명시했다면 그 선택을 그대로 신뢰해서 강제로 해당 형식으로 분석한다.
  
  
  
  
  
  
  const renderParagraphs = (items) => (items || []).map((value) => `<p>${value}</p>`).join("");
  const renderCommunityCases = (cases, wrapperClass = "card") => {
    if (!cases || !cases.length) {
      return `
        <section class="${wrapperClass}">
          <h3>실제 사용자 사례</h3>
          <p class="muted">아직 등록된 해결 사례가 없습니다. 이 방법으로 해결하셨다면 첫 사례를 남겨 다른 사용자에게 도움을 주세요.</p>
          <a class="btn secondary" href="community-cases.html">해결 사례 공유하기</a>
        </section>`;
    }
    return `
        <section class="${wrapperClass}">
          <h3>실제 사용자 사례</h3>
          <p class="muted">위 점검 순서로도 해결되지 않았을 때, 다른 원인으로 해결된 사례입니다.</p>
          ${cases.map((c) => `
            <div class="community-case">
              <p class="community-case-title">${c.title || ""}</p>
              <p>${c.summary}</p>
              <p class="community-case-insight"><strong>포인트:</strong> ${c.insight}</p>
            </div>
          `).join("")}
          <a class="btn secondary" href="community-cases.html">내 해결 사례도 공유하기</a>
        </section>`;
  };
  const renderRelatedEvents = (code) => {
    const events = getRelatedEvents(code).filter((event) => event.detailPage);
    if (!events.length) return "";
    return `
        <section class="card">
          <h3>관련 이벤트 뷰어 기록</h3>
          <p class="muted">이 오류코드와 함께 자주 확인되는 이벤트 ID입니다.</p>
          <div class="link-list">${events.map((event) => `<a href="${event.detailPage}">이벤트 ID ${event.id} · ${event.source}</a>`).join("")}</div>
        </section>`;
  };
  const renderRelatedErrorCodes = (code) => {
    const others = getRelatedErrorCodes(code).filter((item) => item.detailPage || item.link);
    if (!others.length) return "";
    return `
        <section class="card">
          <h3>같은 부품 계열의 다른 오류코드</h3>
          <p class="muted">같은 하드웨어 부위에서 함께 확인되는 오류코드입니다.</p>
          <div class="link-list">${others.map((item) => `<a href="${item.detailPage || item.link}">${getErrorCodeLabel(item)}</a>`).join("")}</div>
        </section>`;
  };
  const renderPartsCards = (parts, note) => {
    if (!parts.length) return "";
    const cards = parts.map((part) => `
        <article class="card">
          <h4>${part.label}</h4>
          <p>${part.summary || ""}</p>
          ${part.note ? `<p class="muted">${part.note}</p>` : ""}
        </article>
      `).join("");
    return `
        <section class="card">
          <h3>점검해야 할 부품</h3>
          <p class="muted">${note} PC 부품 이미지에서 위치를 다시 확인하려면 <a href="diagnostic.html#diagnostic-parts">부품 진단 탭</a>을 열어 보세요.</p>
          <div class="detail-grid">${cards}</div>
        </section>`;
  };
  const renderRelatedPartsSection = (code) => renderPartsCards(getRelatedBoardParts(code), "이 오류코드와 함께 자주 확인되는 부품입니다.");
  const getRelatedPartsForSymptom = (symptom) => (data.boardParts || []).filter((part) => (part.symptoms || []).includes(symptom.title));
  const renderSymptomPartsSection = (symptom) => renderPartsCards(getRelatedPartsForSymptom(symptom), "이 증상과 함께 자주 확인되는 부품입니다.");
  const powerPartIds = new Set(["psu", "eps-power", "atx-power"]);
  const renderPsuCalculatorLink = (code) => {
    const parts = getRelatedBoardParts(code);
    if (!parts.some((part) => powerPartIds.has(part.id))) return "";
    return `
        <section class="card">
          <h3>전원 용량부터 확인해 보세요</h3>
          <p>이 오류코드는 전원 공급과 관련된 부위에서 자주 확인됩니다. 현재 파워서플라이 용량이 충분한지 먼저 계산해 보세요.</p>
          <p><a href="psu-calculator.html">PSU 용량 계산기 열기</a></p>
        </section>`;
  };
  const storagePartIds = new Set(["m2", "sata"]);
  const renderSsdCalculatorLink = (code) => {
    const parts = getRelatedBoardParts(code);
    if (!parts.some((part) => storagePartIds.has(part.id))) return "";
    return `
        <section class="card">
          <h3>SSD 수명도 함께 확인해 보세요</h3>
          <p>이 오류코드는 저장장치와 관련된 부위에서 자주 확인됩니다. 현재 SSD의 누적 쓰기량이 보증 수명(TBW)에 얼마나 가까운지 계산해 보세요.</p>
          <p><a href="ssd-tbw-calculator.html">SSD 수명(TBW) 계산기 열기</a></p>
        </section>`;
  };
  // 오류코드 kind(하드웨어 원인 분류)를 실제 쿠팡 상품 카테고리로 좁혀
  // 연결한다. 소프트웨어·설정성 원인(driver/network/system/boot/update/
  // permission/game/app/install/general/hardware)은 특정 부품과 대응되지
  // 않으므로 의도적으로 매핑하지 않는다.
  const CATEGORY_SHOP_CONFIG = {
    memory: { title: "메모리(RAM) 교체·증설을 고려한다면", desc: "이 오류코드는 메모리(RAM)와 관련된 부위에서 자주 확인됩니다.", endpoint: "ram-link", params: "device=desktop&ddr=unknown", fallbackQuery: "데스크탑 RAM", fallbackUrl: "https://link.coupang.com/a/gV10UqukxM", linkText: "RAM 찾아보기" },
    graphics: { title: "그래픽카드 교체를 고려한다면", desc: "이 오류코드는 그래픽카드와 관련된 부위에서 자주 확인됩니다.", endpoint: "gpu-link", params: "tier=unknown", fallbackQuery: "그래픽카드", fallbackUrl: "https://link.coupang.com/a/gV102P6Iqy", linkText: "그래픽카드 찾아보기" },
    storage: { title: "SSD 교체를 고려한다면", desc: "이 오류코드는 저장장치와 관련된 부위에서 자주 확인됩니다.", endpoint: "ssd-link", params: "capacity=1000&form_factor=unknown&nand_type=unknown", fallbackQuery: "M.2 NVMe SSD 1TB", fallbackUrl: "https://link.coupang.com/a/gV10OlCwMK", linkText: "SSD 찾아보기" },
    hardware: { title: "파워서플라이 상태도 함께 확인해 보세요", desc: "이 오류코드는 전원 공급 불안정이나 하드웨어 자체 결함에서 자주 확인됩니다.", endpoint: "psu-link", params: "watt=650", fallbackQuery: "파워서플라이 650W", fallbackUrl: "https://link.coupang.com/a/f3qAdkChXM", linkText: "파워서플라이 찾아보기" },
  };
  // fallbackUrl은 링크 생성 API(ai.itsvc.co.kr)가 죽었을 때 쓰는 실제 파트너스
  // 추적 링크다. 이 값이 없으면 아래 hydrate가 쿠팡 검색 주소로 떨어지는데,
  // 검색 주소는 추적이 안 붙어 수수료가 0원이 된다. 2026-09-10에 터널이 끊겨
  // 전 카테고리가 조용히 검색 주소로 돌던 일이 있어, 그때 API가 돌려준 링크를
  // 그대로 폴백으로 박아뒀다(같은 장애가 나도 수익은 유지된다).
  const renderCategoryShopSection = (kind, wrapperClass = "card") => {
    const config = CATEGORY_SHOP_CONFIG[kind.className];
    if (!config) return "";
    return `
        <section class="${wrapperClass}" data-category-shop="${kind.className}">
          <h3>${config.title}</h3>
          <p>${config.desc}</p>
          <div class="link-list"><a href="#" data-category-shop-link target="_blank" rel="noopener noreferrer sponsored">${config.linkText}</a></div>
          <p class="affiliate-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
        </section>`;
  };
  const hydrateCategoryShopLink = (root, kind) => {
    const config = CATEGORY_SHOP_CONFIG[kind.className];
    const section = root.querySelector("[data-category-shop]");
    const link = root.querySelector("[data-category-shop-link]");
    if (!config || !section || !link) return;
    const fallbackUrl = config.fallbackUrl || `https://www.coupang.com/np/search?q=${encodeURIComponent(config.fallbackQuery)}`;
    link.href = fallbackUrl;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch(`https://ai.itsvc.co.kr/api/coupang/${config.endpoint}?${config.params}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.url) link.href = json.url;
      })
      .catch(() => {})
      .finally(() => clearTimeout(timeout));
  };
  const escapeEventText = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
  // AI 답변(종합 분석/AI 질문/로그 요약 세 곳 공통)은 모델이 마크다운 형식
  // (### 제목, * 목록, **굵게**)으로 응답하는데, 예전에는 **굵게**와 줄바꿈만
  // 처리하고 나머지는 그대로 흘려보내 "### 원인 후보..."처럼 기호가 그대로
  // 노출되고 있었다. 새 의존성 없이 헤딩·목록·굵게만 가벼운 줄 단위 파싱으로
  // 처리한다. 입력은 escapeEventText로 먼저 이스케이프하므로 안전하다.
  
  // 신뢰도 배지: tone(위험도)과는 별개 축으로, 이 결론이 원인으로서 얼마나 확실한지 표시.
  // confidence가 없으면(데이터 품질 경고 등 원인 판단이 아닌 항목) 배지를 그리지 않는다.
  const CONFIDENCE_LABEL = { high: "높은 가능성", verify: "확인 필요", low: "근거 부족" };
  
  // AI 서비스(ai.itsvc.co.kr) 연결 실패나 응답 없음 시, 예전에는 "AI 서비스에
  // 연결할 수 없습니다" 같은 문구가 본문 안에 묻혀 있어 사용자가 지금 보는
  // 내용이 AI가 실제로 분석한 결과인지, 그냥 모아둔 항목을 나열한 것인지
  // 구분하기 어려웠다. 배지로 명확히 표시해서 착각을 막는다.
  
  // 진단(diagnoses) 항목을 종합진단 카트로 넘길 때 신뢰도 높은 결론부터
  // 정렬하기 위한 순위. tone은 log-diagnosis 렌더링에도 쓰이는 값(high/medium/low/info).
  
  
  // 진단 결과를 텍스트 파일로 저장. report는 analyzeHardwareLog()가 반환하는
  // 구조를 그대로 받는다 — 이미 maskEventPrivacy를 거친 값들이라 여기서
  // 추가로 가릴 필요는 없다(수리점·커뮤니티 공유 전 사용자명·PC 이름 자동 마스킹).
  const formatLogReportAsText = (report) => {
    const lines = [];
    lines.push(`[${report.source.label}] 진단 결과`);
    lines.push(`생성 시각: ${new Date().toLocaleString("ko-KR")}`);
    lines.push("");
    lines.push(report.summary || "");
    if (report.fields?.length) {
      lines.push("", "◆ 핵심 항목");
      report.fields.forEach((item) => lines.push(`- ${item.label}: ${item.value}`));
    }
    if (report.metrics?.length) {
      lines.push("", "◆ 측정값");
      report.metrics.forEach((metric) => {
        const unit = metric.unit === "V" ? 3 : 1;
        lines.push(`- ${metric.label}: 최대 ${metric.max.toFixed(unit)}${metric.unit} · 평균 ${metric.average.toFixed(unit)}${metric.unit} (${metric.samples}개 샘플)${metric.peakTime ? ` · 최고값 시각 ${metric.peakTime}` : ""}`);
      });
    }
    if (report.throttleEvents?.length) {
      lines.push("", "◆ 쓰로틀링 기록 (로그에 실제로 기록된 신호)");
      report.throttleEvents.forEach((event) => lines.push(`- ${event.header}: ${event.activeCount}회 (${Math.round(event.ratio * 100)}%)${event.firstTime ? `, 최초 발생 ${event.firstTime}` : ""}`));
    } else if (report.throttleInferences?.length) {
      lines.push("", "◆ 쓰로틀링 추정 (명시적 플래그 없음, 클럭 저하로 추론)");
      report.throttleInferences.forEach((inference) => lines.push(`- ${inference.label} 사용률 90%↑ 구간 평균 클럭 ${Math.round(inference.avgHighLoadClock)}MHz (관측 최대 ${Math.round(inference.maxClock)}MHz의 ${Math.round(inference.ratio * 100)}%)`));
    }
    if (report.diagnoses?.length) {
      lines.push("", "◆ 분석 결론");
      report.diagnoses.forEach((item) => {
        const conf = CONFIDENCE_LABEL[item.confidence] ? ` [${CONFIDENCE_LABEL[item.confidence]}]` : "";
        lines.push(`- ${item.title}${conf}`, `  ${item.detail}`);
      });
    }
    if (report.alerts?.length) {
      lines.push("", "◆ 경고");
      report.alerts.forEach((item) => lines.push(`- ${item.title}`, `  ${item.detail}`));
    }
    if (report.parts?.length) { lines.push("", "◆ 점검해야 할 부품"); report.parts.forEach((v) => lines.push(`- ${v}`)); }
    if (report.settings?.length) { lines.push("", "◆ 설정 확인"); report.settings.forEach((v) => lines.push(`- ${v}`)); }
    if (report.software?.length) { lines.push("", "◆ 프로그램 점검"); report.software.forEach((v) => lines.push(`- ${v}`)); }
    if (report.steps?.length) { lines.push("", "◆ 우선 점검 순서"); report.steps.forEach((v, i) => lines.push(`${i + 1}. ${v}`)); }
    if (report.highlights?.length) {
      lines.push("", "◆ 로그에서 확인된 내용 (원문 발췌, 자동 마스킹됨)");
      report.highlights.forEach((v) => lines.push(`  ${v}`));
    }
    lines.push("", "※ 이 파일은 브라우저에서 생성되었으며 컴퓨터 이름·사용자 이름·경로는 자동으로 가려졌습니다.",
      "  공유 전 한 번 더 확인해 주세요. — itsvc.co.kr");
    return lines.join("\n");
  };
  const downloadTextFile = (text, filename) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  // 이벤트 뷰어 분석에서 사이트 데이터베이스에 없는 이벤트 ID를 만나면 이 브라우저에
  // 기록해 둔다. 방문자·운영자 모두 나중에 "기록 내보내기"로 어떤 이벤트가
  // 빠져있었는지 모아서 확인하고 사이트에 추가할 수 있게 하기 위함. 서버로
  // 전송되지 않으며 이 브라우저 안에서만 누적된다.
  const MISSING_EVENT_KEY = "pc_missing_event_reports";
  const readMissingEventReports = () => {
    try {
      const list = JSON.parse(localStorage.getItem(MISSING_EVENT_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  };
  
  const exportMissingEventReports = () => {
    const list = readMissingEventReports();
    if (!list.length) return false;
    const lines = [
      "미등록 이벤트 기록 (사이트에 아직 해석 데이터가 없는 이벤트 ID)",
      `내보낸 시각: ${new Date().toLocaleString("ko-KR")}`,
      "",
      ...list.map((item) => `- ID ${item.id} · 원본 ${item.source || "확인 안됨"}${item.level ? ` · 수준 ${item.level}` : ""} · ${item.count}회 발견 · 최근 ${new Date(item.lastSeen).toLocaleString("ko-KR")}`),
    ];
    downloadTextFile(lines.join("\n"), `missing-events-${new Date().toISOString().slice(0, 10)}.txt`);
    return true;
  };
  
  
  const normalizeEventSource = (value) => String(value || "").trim().toLowerCase().replace(/[\s_-]+/g, "");
        // ==== EVTX(.evtx) / BinXML 파서시작 (python-evtx를 기준으로 포팅, MIT/Apache-2.0 참고) ====
    // EVTX / BinXML parser - ported from python-evtx (Willi Ballenthin, Apache-2.0)
    // Produces per-record XML strings compatible with real Windows Event Viewer "XML 보기" output.

    

    

    

    

    

    

    

    

        // ==== EVTX 파서 끝 ====
  
  
  
  const getEventTone = (entry, repeatCount = 1) => {
    if (entry.urgency === "backup") return { key: "danger", label: "백업·우선 점검" };
    if (entry.urgency === "repeat-check" || repeatCount >= 3) return { key: "warning", label: "반복 여부 확인" };
    if (entry.urgency === "driver") return { key: "info", label: "설정·드라이버 점검" };
    return { key: "neutral", label: "대체로 낮은 긴급도" };
  };
  const CARD_TONE_COLORS = { danger: "#c53a32", warning: "#d98213", info: "#2368c4", neutral: "#8a9399" };
  const getCssVar = (name, fallback) => {
    try {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || fallback;
    } catch {
      return fallback;
    }
  };
  const wrapCanvasText = (ctx, value, maxWidth) => {
    const words = String(value || "").split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (current && ctx.measureText(candidate).width > maxWidth) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) lines.push(current);
    return lines;
  };
  const renderSummaryCardCanvas = ({ eyebrow, title, lines, tone }) => {
    const width = 800;
    const height = 500;
    const padding = 48;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const fontFamily = "-apple-system, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif";
    const bg = getCssVar("--bg", "#07141d");
    const text = getCssVar("--text", "#effbff");
    const muted = getCssVar("--muted", "#a8c0c9");
    const accent = getCssVar("--accent", "#67e8f9");
    const lineColor = getCssVar("--line", "rgba(169, 224, 232, 0.3)");
    const toneColor = CARD_TONE_COLORS[tone] || CARD_TONE_COLORS.neutral;

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = toneColor;
    ctx.fillRect(0, 0, width, 8);

    let y = padding + 20;
    ctx.fillStyle = accent;
    ctx.font = `600 16px ${fontFamily}`;
    ctx.fillText("PC 윈도우 진단 센터", padding, y);
    y += 34;

    if (eyebrow) {
      ctx.fillStyle = muted;
      ctx.font = `600 13px ${fontFamily}`;
      ctx.fillText(String(eyebrow).toUpperCase(), padding, y);
      y += 30;
    }

    ctx.fillStyle = text;
    ctx.font = `700 30px ${fontFamily}`;
    wrapCanvasText(ctx, title, width - padding * 2).slice(0, 2).forEach((titleLine) => {
      ctx.fillText(titleLine, padding, y);
      y += 38;
    });
    y += 10;

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    y += 32;

    ctx.fillStyle = text;
    ctx.font = `400 17px ${fontFamily}`;
    (lines || []).forEach((lineText) => {
      wrapCanvasText(ctx, lineText, width - padding * 2).forEach((wrappedLine) => {
        if (y > height - 70) return;
        ctx.fillText(wrappedLine, padding, y);
        y += 27;
      });
      y += 9;
    });

    ctx.fillStyle = muted;
    ctx.font = `400 13px ${fontFamily}`;
    const today = new Date().toISOString().slice(0, 10);
    ctx.fillText(`itsvc.co.kr · 서버 저장 없이 브라우저에서 생성됨 · ${today}`, padding, height - padding + 12);

    return canvas;
  };
  const downloadOrShareCanvas = (canvas, filename) => new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return resolve(false);
      const safeFilename = filename || "pc-check-summary.png";
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], safeFilename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: "PC 윈도우 진단 센터" });
            return resolve(true);
          }
        } catch {
          // 공유 취소·실패 시 다운로드로 대체
        }
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = safeFilename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve(true);
    }, "image/png");
  });
  const buildSaveCardButton = ({ eyebrow, title, tone, lines }) => {
    const payload = escapeEventText(JSON.stringify(lines || []));
    return `<button class="btn secondary save-card-btn" type="button" data-save-card data-card-eyebrow="${escapeEventText(eyebrow)}" data-card-title="${escapeEventText(title)}" data-card-tone="${escapeEventText(tone)}" data-card-lines="${payload}">이미지로 저장</button>`;
  };
  
  const buildAddToBasketButton = ({ type, key, title, summary, causes, checks, time, timeStart, timeEnd, evidence, tone }) => {
    const item = { key: `${type}:${key}`, type, title, summary: summary || "", causes: causes || [], checks: checks || [], time: time || "", timeStart: timeStart || "", timeEnd: timeEnd || "", evidence: evidence || null, tone: tone || "neutral" };
    const payload = escapeEventText(JSON.stringify(item));
    return `<button class="btn secondary basket-add-btn" type="button" data-basket-add data-basket-item="${payload}">진단 카트에 담기</button>`;
  };
  
  // 사이트 DB에 이벤트 ID로는 없어도, 원본(Provider) 이름이 알려진 하드웨어 드라이버
  // 모듈이면 그 자체로 강한 단서다(예: nvlddmkm=NVIDIA 그래픽 드라이버 커널 모듈).
  // ChatGPT로 같은 evtx 로그를 분석했을 때 이 신호(발생 1회뿐이었지만 GPU 오류로
  // 정확히 짚어낸 사례)를 기준으로 추가함 — ID·원본 매칭만으로는 못 잡던 부분.
  const DRIVER_MODULE_INFO = {
    nvlddmkm: { vendor: "NVIDIA", category: "그래픽 드라이버", focus: "hardware:gpu", desc: "NVIDIA 그래픽 드라이버의 커널 모듈입니다. GPU 동작 중 오류가 감지되면 화면 멈춤·깜빡임·강제 종료 후 재부팅으로 이어질 수 있습니다." },
    atikmdag: { vendor: "AMD", category: "그래픽 드라이버", focus: "hardware:gpu", desc: "AMD 그래픽 드라이버의 커널 모듈입니다." },
    atikmpag: { vendor: "AMD", category: "그래픽 드라이버", focus: "hardware:gpu", desc: "AMD 그래픽 드라이버의 커널 모듈입니다." },
    amdkmdag: { vendor: "AMD", category: "그래픽 드라이버", focus: "hardware:gpu", desc: "AMD 그래픽 드라이버의 커널 모듈입니다." },
    igfx: { vendor: "Intel", category: "그래픽 드라이버", focus: "hardware:gpu", desc: "Intel 내장 그래픽 드라이버입니다." },
    netwtw: { vendor: "Intel", category: "무선랜 드라이버", focus: "hardware:wifi", desc: "Intel Wi-Fi 무선랜 드라이버입니다." },
    e1rexpress: { vendor: "Intel", category: "유선랜 드라이버", focus: "hardware:wifi", desc: "Intel 기가비트 유선랜(이더넷) 드라이버입니다." },
    e1dexpress: { vendor: "Intel", category: "유선랜 드라이버", focus: "hardware:wifi", desc: "Intel 유선랜 드라이버입니다." },
    rtwlan: { vendor: "Realtek", category: "무선랜 드라이버", focus: "hardware:wifi", desc: "Realtek Wi-Fi 무선랜 드라이버입니다." },
    rt640x64: { vendor: "Realtek", category: "유선랜 드라이버", focus: "hardware:wifi", desc: "Realtek 유선랜 드라이버입니다." },
    iastora: { vendor: "Intel", category: "저장장치 드라이버", focus: "hardware:storage", desc: "Intel Rapid Storage Technology(RST) 저장장치 드라이버입니다." },
    stornvme: { vendor: "Microsoft", category: "NVMe 드라이버", focus: "hardware:storage", desc: "Windows 기본 NVMe 저장장치 드라이버입니다." },
    amdsata: { vendor: "AMD", category: "저장장치 드라이버", focus: "hardware:storage", desc: "AMD SATA 저장장치 드라이버입니다." },
    bthusb: { vendor: "Windows", category: "블루투스 드라이버", focus: "hardware:wifi", desc: "블루투스 USB 드라이버입니다." },
  };
  const lookupDriverModule = (source) => {
    const key = String(source || "").trim().toLowerCase();
    if (!key) return null;
    if (DRIVER_MODULE_INFO[key]) return DRIVER_MODULE_INFO[key];
    const prefix = Object.keys(DRIVER_MODULE_INFO).find((candidate) => key.startsWith(candidate));
    return prefix ? DRIVER_MODULE_INFO[prefix] : null;
  };
  // Info 수준에서 사실상 항상 정상 동작 기록으로 남는 원본들. 이벤트 개수가 많다는
  // 이유만으로 중요해 보이지 않도록, 다중 이벤트 요약에서 개별 카드 대신 한 줄로
  // 접어서 보여줄 때 사용한다(ChatGPT 분석에서도 UPnP 이벤트를 "많다는 이유만으로
  // 오류로 볼 항목은 아니다"라고 별도로 짚었던 것과 같은 판단).
  
  const buildEventEvidence = ({ fields = {}, entry = null, repeatCount = 1, selectedLevel = "", eventTime = "", timing = null }) => ({
    kind: "event-viewer",
    id: String(fields.id || entry?.id || ""),
    source: String(fields.source || entry?.source || ""),
    level: String(selectedLevel || fields.level || ""),
    time: String(fields.time || eventTime || ""),
    logName: String(fields.logName || ""),
    task: String(fields.task || ""),
    provider: String(fields.provider || ""),
    eventRecordId: String(fields.eventRecordId || ""),
    computer: String(fields.computer || ""),
    opcode: String(fields.opcode || ""),
    keywords: String(fields.keywords || ""),
    bugcheckCode: String(fields.bugcheckCode || ""),
    device: String(fields.device || ""),
    imageName: String(fields.imageName || ""),
    processName: String(fields.processName || ""),
    errorType: String(fields.errorType || ""),
    errorSource: String(fields.errorSource || ""),
    apicId: String(fields.apicId || ""),
    statusCode: String(fields.statusCode || ""),
    errorCode: String(fields.errorCode || ""),
    deviceName: String(fields.deviceName || ""),
    volumeName: String(fields.volumeName || ""),
    failureBucketId: String(fields.failureBucketId || ""),
    reportId: String(fields.reportId || ""),
    parameters: fields.parameters || [],
    eventData: (fields.eventData || []).map(({ name, value }) => ({ name: String(name || "값"), value: String(value || "") })),
    repeatCount: Math.max(1, Number(repeatCount) || 1),
    timing: timing || null,
  });
  
  const siteLastUpdated = "2026-07-28";
  const detailThemeLookup = {
    "auto-repair": "boot",
    "bsod-critical-process": "critical",
    "explorer-freeze": "explorer",
    "printer-add-freeze": "printer",
    "gaming-reboot": "gaming",
    "no-display": "display",
    "amd-cpu-cooler-pressure-no-post": "power",
    "dual-monitor-dp-not-detected": "display",
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
    "amd-cpu-cooler-pressure-no-post": ["0x00000124", "0x0000009c", "0x0000001a", "0x00000050"],
    "dual-monitor-dp-not-detected": ["0x00000116", "0x00000117", "0x00000119", "0x000000ea"],
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
    "amd-cpu-cooler-pressure-no-post": ["warnings", "intro", "checks", "decision", "codes", "deeper", "examples", "faq"],
    "dual-monitor-dp-not-detected": ["warnings", "intro", "checks", "codes", "decision", "deeper", "examples", "faq"],
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
    "amd-cpu-cooler-pressure-no-post": { checks: "grid", deeper: "split" },
    "dual-monitor-dp-not-detected": { checks: "grid", deeper: "split" },
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
    "amd-cpu-cooler-pressure-no-post": "나사를 느슨하게 둔 상태를 해결책으로 쓰지 말고, 올바른 AM4·AM5 장착 부품과 균등한 조임 상태를 확인해야 합니다.",
    "dual-monitor-dp-not-detected": "두 화면을 각각 연결했을 때와 함께 연결했을 때의 결과를 비교하면 케이블·포트 문제와 대역폭 문제를 구분할 수 있습니다.",
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
  const detailAffiliateLookup = {
    "overheat-shutdown": {
      note: "쿨링 부족이나 노후화가 의심되면 부품 교체를 고려해 보세요.",
      links: [
        { label: "CPU 쿨러", href: "https://link.coupang.com/a/fsCIycaU4y" },
        { label: "서멀 구리스", href: "https://link.coupang.com/a/fsCIDeYSpE" },
      ],
    },
    "sound-not-working": {
      note: "내장 사운드 자체 고장이 의심되면 우회하는 방법도 있습니다.",
      links: [{ label: "USB 외장 사운드카드", href: "https://link.coupang.com/a/fsCIIhpeKa" }],
    },
    "bluetooth-not-found": {
      note: "PC 자체에 블루투스가 없거나 내장 모듈이 고장났다면 추가하는 방법도 있습니다.",
      links: [{ label: "블루투스 동글", href: "https://link.coupang.com/a/fsCINtjWhg" }],
    },
    "wifi-disconnect": {
      note: "무선 어댑터 자체가 노후됐다면 교체하는 것도 고려해 보세요.",
      links: [{ label: "새 와이파이 어댑터", href: "https://link.coupang.com/a/fsCISSe1Js" }],
    },
    "usb-not-detected": {
      note: "포트가 부족하거나 허브 자체가 노후됐다면 교체를 고려해 보세요.",
      links: [{ label: "USB 허브", href: "https://link.coupang.com/a/fsCIYPQk7o" }],
    },
  };
  const renderAffiliateSection = (pageKey) => {
    const entry = detailAffiliateLookup[pageKey];
    if (entry) {
      const links = entry.links.map((item) => `<a href="${item.href}" target="_blank" rel="noopener noreferrer sponsored">${item.label}</a>`).join("");
      return `
      <section class="section">
        <h3>관련 제품</h3>
        <p class="muted">${entry.note}</p>
        <p class="affiliate-disclosure">이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.</p>
        <div class="link-list">${links}</div>
      </section>
    `;
    }
    // 수동 큐레이션이 없는 증상은, 연결된 오류 코드들의 kind 분포로 추정한
    // 부품 카테고리(메모리/그래픽카드/저장장치)가 있을 때만 쿠팡 링크를 보여준다.
    const category = getSymptomShopCategory(pageKey);
    return category ? renderCategoryShopSection({ className: category }, "section") : "";
  };
  const detailHeadingLookup = {
    "auto-repair": "자동 복구 화면이 반복될 때 확인할 순서",
    "bsod-critical-process": "Critical Process Died가 반복될 때 확인할 순서",
    "explorer-freeze": "탐색기만 멈출 때 원인을 좁히는 방법",
    "printer-add-freeze": "프린터 추가가 멈출 때 먼저 확인할 것",
    "gaming-reboot": "게임 중 재부팅이 반복될 때 확인할 순서",
    "no-display": "전원은 켜지는데 화면이 안 뜰 때 확인 순서",
    "amd-cpu-cooler-pressure-no-post": "AMD CPU 쿨러 장착 후 POST가 멈출 때 확인할 순서",
    "dual-monitor-dp-not-detected": "듀얼 모니터 한쪽만 안 나올 때 확인 순서",
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
    "amd-cpu-cooler-pressure-no-post": "쿨러 교체 전후와 CPU·DRAM LED 상태를 비교하면 장착 문제와 다른 고장을 구분하기 쉽습니다.",
    "dual-monitor-dp-not-detected": "한 대씩은 정상인지, 두 대를 함께 연결할 때만 실패하는지를 먼저 나누세요.",
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
    "dual-monitor-dp-not-detected": "안전 모드에서 두 번째 화면이 감지되면 그래픽 드라이버나 시작 프로그램이 화면 구성에 영향을 주는지 비교하세요.",
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
    "dual-monitor-dp-not-detected": [
      { command: "ms-settings:display", note: "여러 디스플레이의 감지, 확장 모드, 해상도와 주사율을 확인합니다." },
      { command: "devmgmt.msc", note: "그래픽 어댑터의 오류 표시와 드라이버 버전을 확인합니다." },
      { command: "dxdiag", note: "그래픽 장치와 드라이버 정보를 기록해 제조사 지원 문서와 비교합니다." }
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
    "amd-cpu-cooler-pressure-no-post": ["no-display", "no-power", "overheat-shutdown"],
    "dual-monitor-dp-not-detected": ["no-display", "black-screen-after-login", "sleep-resume-fail"],
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
    "amd-cpu-cooler-pressure-no-post": [
      { label: "AMD: 데스크톱 시스템 부팅 실패 기본 점검", href: "https://www.amd.com/en/resources/support-articles/faqs/PIBRMATS1.html" },
      { label: "AMD: 방열판 장착 압력의 일반 원칙(설계 자료)", href: "https://docs.amd.com/r/en-US/xapp1377-heatsinks-thermal/Heatsink-Attachment-and-Mounting" },
      { label: "Noctua: AMD 쿨러 나사 토크 안내(자사 제품 전용)", href: "https://www.noctua.at/cn/support/faqs/how-much-torque-should-i-apply-when-tightening-the-screws-of-my-noctua-cpu-cooler" },
      { label: "Noctua: AMD 메인보드 백플레이트 확인", href: "https://www.noctua.at/en/support/faqs/does-my-amd-motherboard-come-with-a-backplate-and-how-do-i-proceed-with-the-installation" }
    ],
    "dual-monitor-dp-not-detected": [
      { label: "Microsoft: Windows 검은 화면 및 외부 디스플레이 문제 해결", href: "https://support.microsoft.com/en-us/windows/troubleshooting-blank-screens-in-windows-51ef7b96-47cb-b454-fcab-fac643784457" }
    ],
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
  // 증상 하나에 연결된 오류 코드들(수동 큐레이션 + relatedSymptom 자동 매칭)을
  // 모아 kind별로 세어, 가장 많이 나온 부품 카테고리 하나를 증상의 쇼핑
  // 카테고리로 추정한다. detailAffiliateLookup에 이미 수동으로 큐레이션된
  // 증상은 그 쪽을 우선하고, 없는 증상만 이 자동 추정을 보조로 쓴다.
  const getSymptomRelatedCodes = (pageKey) => {
    const symptom = (data.symptoms || []).find((item) => item.id === pageKey);
    const manualCodes = (quickCodeLookup[pageKey] || []).map(findErrorCode).filter(Boolean);
    const autoCodes = symptom
      ? (data.errorCodes || []).filter((item) => item.relatedSymptom === symptom.link)
      : [];
    const seen = new Set();
    return [...manualCodes, ...autoCodes].filter((code) => {
      const key = normalizeCode(code.code);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };
  const getSymptomShopCategory = (pageKey) => {
    const codes = getSymptomRelatedCodes(pageKey);
    const counts = {};
    codes.forEach((code) => {
      const className = getErrorCodeKind(code).className;
      if (CATEGORY_SHOP_CONFIG[className]) counts[className] = (counts[className] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length ? sorted[0][0] : null;
  };
  const renderQuickCodeButtons = (pageKey) => {
    const codes = getSymptomRelatedCodes(pageKey);
    const items = codes.map((code) => {
      const kind = getErrorCodeKind(code);
      return `
        <div class="code-quick-item">
          <a class="code-quick-btn" href="${code.detailPage || code.link}">
            <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
            <strong>${code.code}</strong>
            <span>${code.title}</span>
          </a>
          <button class="btn secondary code-copy-btn" type="button" data-copy-code="${code.code}">복사</button>
        </div>
      `;
    }).join("");
    if (!items) return "";
    return `
      <section class="section">
        <h3>자주 함께 보는 에러 코드</h3>
        <p class="copy-note">복사 버튼은 코드 문자열만 복사합니다. 상세 페이지로 바로 가려면 카드 제목을 눌러 주세요.</p>
        <div class="code-quick-grid">${items}</div>
      </section>
    `;
  };
  const cmdWindowCommandPattern = /^(sfc|dism|chkdsk|bootrec|diskpart)\b/i;
  const getCommandRunHint = (command) => {
    if (cmdWindowCommandPattern.test(command)) {
      return "명령 프롬프트(cmd.exe)를 관리자 권한으로 실행한 뒤 이 명령을 입력하고 Enter";
    }
    return "Windows 키 + R을 눌러 실행 창에 이 명령을 입력하고 Enter (또는 확인)";
  };
  const renderCommandCards = (pageKey) => {
    const items = (detailCommandLookup[pageKey] || []).map((item) => `
      <article class="card command-card">
        <p class="eyebrow">${item.context || "윈도우 실행 중 · 관리자 권한 권장"}</p>
        <h4>${item.command}</h4>
        <p>${item.note}</p>
        <p class="command-run-hint"><strong>실행 방법:</strong> ${getCommandRunHint(item.command)}</p>
      </article>
    `).join("");
    if (!items) return "";
    const hasCmdWindowCommand = (detailCommandLookup[pageKey] || []).some((item) => cmdWindowCommandPattern.test(item.command));
    return `
      <section class="section">
        <h3>명령어 예시</h3>
        <p class="muted">명령어를 실행하기 전에 중요한 파일을 백업하고 실행 환경과 관리자 권한을 확인하세요. Windows 복구 환경에서는 윈도우 드라이브 문자가 C:가 아닐 수 있으며, 실행 결과를 확인하지 않은 채 복구·삭제 명령을 연속으로 사용하지 마세요.</p>
        <div class="detail-grid">${items}</div>
        ${hasCmdWindowCommand ? `<p class="muted"><a href="windows-repair-tools-guide.html">각 명령어의 자세한 실행 방법과 결과 해석 보기 →</a></p>` : ""}
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
    const firstCheckTitle = firstCheck.title || "가장 먼저 확인할 항목";
    const firstDecisionHeading = firstDecision.heading || "여기서 판단할 기준";
    const firstDeeperHeading = firstDeeper.heading || "추가로 보는 포인트";
    const firstMistakeText = firstMistake || "자주 하는 실수";
    const followupCardsHtml = [
      {
        title: "첫 점검을 이렇게 읽기",
        text: `${firstCheckTitle}${josa(firstCheckTitle, "을", "를")} 우선 보면 진단의 방향이 빨라집니다. ${firstCheck.why || ""} ${firstCheck.how || ""}처럼 바로 실행할 수 있는 확인부터 해두면, 소프트웨어와 하드웨어 중 어느 쪽에 더 무게를 둘지 정하기가 쉬워집니다.`
      },
      {
        title: "비슷한 증상과 나누는 기준",
        text: `${firstDecisionHeading}${josa(firstDecisionHeading, "은", "는")} 같은 문제처럼 보여도 해석이 달라질 수 있다는 뜻입니다. ${firstDecision.text || ""} ${firstDeeperHeading}${josa(firstDeeperHeading, "을", "를")} 함께 붙이면 ${firstExample || "반복되는 사례"}가 단순한 우연인지, 반복 가능한 원인인지 더 잘 구분됩니다.`
      },
      {
        title: "해결이 늦어질 때",
        text: `${firstMistakeText}${josa(firstMistakeText, "을", "를")} 피하면서도 증상이 이어진다면, ${firstFaq.q || "자주 묻는 질문"}에서 다루는 조건을 다시 확인해 보세요. 그래도 같은 현상이 반복되면 재설치보다 데이터 보호와 백업, 그리고 관련 장치나 설정의 교차 점검을 먼저 생각하는 편이 안전합니다.`
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
              <span><b>가능성 높은 원인</b> ${symptom.causes?.[0] || "최근 변경 또는 연결 상태"}</span>
              <span><b>첫 확인 항목</b> ${symptom.checks?.[0] || "증상이 시작된 시점"}</span>
              <span><b>읽는 시간</b> 약 ${getGuideReadTime(symptom)}분</span>
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
    const communityCaseSection = renderCommunityCases(details.communityCases, "section");
    const relatedSection = renderRelatedGuideLinks(pageKey);
    const officialSection = renderOfficialLinks(pageKey);
    return `<div class="detail-page detail-page--${theme}">
      ${order.map((key) => sections[key] || "").join("")}
      ${sections.angle}
      ${safeModeSection}
      ${commandSection}
      ${communityCaseSection}
      ${renderSymptomPartsSection(symptom)}
      <section class="section">
        <h3>실전 해석</h3>
        <div class="detail-grid">${followupCardsHtml}</div>
      </section>
      ${relatedSection}
      ${officialSection}
      ${renderAffiliateSection(pageKey)}
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
    const symptomPageKey = symptomDetailRoot.dataset.symptomDetailPage;
    const detail = renderSymptomDetailPage(symptomPageKey);
    if (detail) {
      symptomDetailRoot.innerHTML = detail;
      if (!detailAffiliateLookup[symptomPageKey]) {
        const category = getSymptomShopCategory(symptomPageKey);
        if (category) hydrateCategoryShopLink(symptomDetailRoot, { className: category });
      }
    }
  }

  const detailRoot = document.querySelector("[data-error-code-page]");
  if (detailRoot) {
    // 장치 관리자 코드 모음은 하나의 공통 상세 화면을 사용합니다.
    // 개별 링크의 `?code=코드%2012` 값을 우선 읽어 같은 레이아웃으로 표시합니다.
    const requestedCode = new URLSearchParams(window.location.search).get("code");
    const code = findErrorCode(requestedCode || detailRoot.dataset.errorCodePage);
    if (code) {
      const relatedSymptom = (data.symptoms || []).find((item) => item.link === code.relatedSymptom);
      const kind = getErrorCodeKind(code);
      const guidance = getErrorCodeGuidance(code);
      const diagnosticQuestions = [
        `${code.code}가 재부팅할 때마다 같은 작업에서 반복되는지 기록하세요.`,
        "문제가 시작된 시점에 최근 설치·업데이트한 프로그램이나 드라이버가 있었는지 확인하세요.",
        "안전 모드나 다른 계정에서도 같은 증상이 재현되는지 비교해보세요."
      ];
      const isUpdateCode = /^0x(?:800|C190)/i.test(code.code);
      const officialLinks = isUpdateCode ? [
        { label: "Microsoft: Windows 업데이트 문제 해결", href: "https://support.microsoft.com/en-US/Windows/Deployment/Updates-Lifecycle/troubleshoot-problems-updating-windows" },
        { label: "Microsoft: Windows 도움말", href: "https://support.microsoft.com/windows/" }
      ] : [
        { label: "Microsoft Learn: 버그 검사 코드 참조", href: "https://learn.microsoft.com/windows-hardware/drivers/debugger/bug-check-code-reference2" },
        { label: "Microsoft: 블루스크린 오류 해결", href: "https://support.microsoft.com/en-US/windows/resolving-blue-screen-errors-in-windows-60b01860-58f2-be66-7516-5c45a66ae3c6" }
      ];
      // data.js의 overview는 summary와 같거나 summary로 시작하는 항목이 많다(140개 중 95개).
      // 그대로 두면 같은 문장이 lead와 본문에 연달아 두 번 노출되므로 중복분을 걷어낸다.
      const overviewText = (() => {
        const summaryText = String(code.summary || "").trim();
        const raw = String(code.overview || "").trim();
        if (!raw || !summaryText) return raw;
        if (raw === summaryText) return "";
        return raw.startsWith(summaryText) ? raw.slice(summaryText.length).trim() : raw;
      })();
      detailRoot.innerHTML = `
        <p class="eyebrow">에러 코드 상세</p>
        <div class="code-heading">
          <span class="code-icon code-icon--${kind.className}">${getErrorCodeIcon(code)}</span>
          <h2>${code.code} · ${code.title}</h2>
          <span class="code-chip code-chip--${kind.className}">${kind.label}</span>
        </div>
        <p class="lead">${code.summary}</p>
        ${code.screenshot ? `<a href="${code.screenshot.src}" target="_blank" rel="noopener" class="guide-image-link"><img src="${code.screenshot.src}" alt="${code.screenshot.alt}" loading="lazy" width="${code.screenshot.width}" height="${code.screenshot.height}" class="guide-image"></a>` : ""}
        ${overviewText ? `<p class="detail-overview">${overviewText}</p>` : ""}
        ${code.plainExplanation ? `<div class="callout"><strong>쉽게 말하면</strong><p>${code.plainExplanation}</p></div>` : ""}
        <section class="card error-context-card">
          <h3>이 코드를 어떻게 해석해야 하나요?</h3>
          <p>${code.narrative || guidance.interpretation}</p>
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
        ${(code.decisionSteps && code.decisionSteps.length) ? `
        <section class="card">
          <h3>확인 결과에 따른 다음 단계</h3>
          <ul class="mini-list">${code.decisionSteps.map((item) => `<li><strong>${item.condition}</strong> — ${item.action}</li>`).join("")}</ul>
        </section>` : ""}
        ${renderCommunityCases(code.communityCases)}
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
          ${["boot", "graphics", "driver", "memory", "storage"].includes(kind.className) ? `<p>부팅 불가, 반복 재부팅, SMART 경고, 비정상적인 발열이 함께 나타나면 사용을 계속하기보다 제조사 서비스나 전문 점검을 고려하세요.</p>` : ""}
        </section>
        <section class="card">
          <h3>관련 증상 진단</h3>
          <p>${relatedSymptom ? relatedSymptom.summary : "같은 계열 증상 진단으로 연결됩니다."}</p>
          <p><a href="${code.relatedSymptom || code.link}">연결된 증상 페이지 열기</a></p>
        </section>
        ${renderRelatedEvents(code)}
        ${renderRelatedErrorCodes(code)}
        ${renderRelatedPartsSection(code)}
        ${renderPsuCalculatorLink(code)}
        ${renderSsdCalculatorLink(code)}
        ${renderCategoryShopSection(kind)}
        <section class="card">
          <h3>공식 자료로 다시 확인하기</h3>
          <p>Windows 버전과 업데이트 상태에 따라 안내가 달라질 수 있으므로, 아래 공식 자료와 현재 PC 제조사의 지원 문서를 함께 확인하세요.</p>
          <div class="link-list">${[
            ...(code.officialSource ? [{ label: code.officialSource.title, href: code.officialSource.url }] : []),
            ...officialLinks
          ].map((item) => `<a href="${item.href}" target="_blank" rel="noopener">${item.label}</a>`).join("")}</div>
        </section>
        ${(code.faq && code.faq.length) ? `
        <section class="card">
          <h3>자주 묻는 질문</h3>
          <div class="faq-grid">${code.faq.map((item) => `
            <details class="faq-item">
              <summary>${item.q}</summary>
              <p>${item.a}</p>
            </details>
          `).join("")}</div>
        </section>` : ""}
        <section class="card">
          <h3>바로 다른 코드 찾기</h3>
          <p><a href="diagnostic.html">진단 도구로 돌아가기</a></p>
        </section>
      `;
      hydrateCategoryShopLink(detailRoot, kind);
    }
  }

    const diagnosticRoot = document.querySelector("[data-diagnostic-root]");
  if (diagnosticRoot && typeof window.__initDiagnosticTool === "function") {
    window.__initDiagnosticTool({ CONFIDENCE_LABEL, MISSING_EVENT_KEY, buildAddToBasketButton, buildEventEvidence, buildSaveCardButton, data, escapeEventText, findErrorCode, getErrorCodeIcon, getErrorCodeKind, getErrorCodeLabel, getEventTone, getSupplementalChecks, lookupDriverModule, normalizeCode, normalizeEventSource, readMissingEventReports, readRecentCodes, storageKey });
  }

  

  
  

  document.addEventListener("click", async (event) => {
    const exportMissingButton = event.target.closest("[data-export-missing-events]");
    if (exportMissingButton) {
      const previous = exportMissingButton.textContent;
      exportMissingButton.textContent = exportMissingEventReports() ? "내보냈습니다" : "기록 없음";
      window.setTimeout(() => { exportMissingButton.textContent = previous; }, 1200);
      return;
    }
    const eventCopyButton = event.target.closest("[data-copy-event-result]");
    if (eventCopyButton) {
      const text = eventCopyButton.dataset.copyEventResult || "";
      try {
        await navigator.clipboard.writeText(text);
        const previous = eventCopyButton.textContent;
        eventCopyButton.textContent = "복사됨";
        eventCopyButton.classList.add("is-copied");
        window.setTimeout(() => {
          eventCopyButton.textContent = previous;
          eventCopyButton.classList.remove("is-copied");
        }, 1200);
      } catch {
        eventCopyButton.textContent = "복사 실패";
        window.setTimeout(() => { eventCopyButton.textContent = "결과 복사"; }, 1200);
      }
      return;
    }
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

  document.addEventListener("click", async (event) => {
    const saveButton = event.target.closest("[data-save-card]");
    if (!saveButton) return;
    const eyebrow = saveButton.dataset.cardEyebrow || "";
    const title = saveButton.dataset.cardTitle || "진단 결과";
    const tone = saveButton.dataset.cardTone || "neutral";
    let lines = [];
    try {
      lines = JSON.parse(saveButton.dataset.cardLines || "[]");
    } catch {
      lines = [];
    }
    const previous = saveButton.textContent;
    saveButton.textContent = "생성 중...";
    saveButton.disabled = true;
    try {
      const canvas = renderSummaryCardCanvas({ eyebrow, title, lines, tone });
      const filename = `${title.replace(/[^\w0-9가-힣-]+/g, "-").slice(0, 40) || "diagnosis"}-요약카드.png`;
      await downloadOrShareCanvas(canvas, filename);
    } finally {
      saveButton.textContent = previous;
      saveButton.disabled = false;
    }
  });

  document.addEventListener("click", (event) => {
    const textButton = event.target.closest("[data-save-text]");
    if (textButton) {
      let report;
      try {
        report = JSON.parse(textButton.dataset.saveTextReport || "{}");
      } catch {
        return;
      }
      const filename = `${textButton.dataset.saveTextFilename || "진단결과"}-진단결과.txt`;
      downloadTextFile(formatLogReportAsText(report), filename);
      return;
    }
    const simpleButton = event.target.closest("[data-save-text-simple]");
    if (simpleButton) {
      const filename = `${simpleButton.dataset.saveTextFilename || "진단결과"}-진단결과.txt`;
      downloadTextFile(simpleButton.dataset.saveTextSimple || "", filename);
    }
  });

  const guidesRoot = document.querySelector("[data-guides-root]");
  if (guidesRoot) {
    document.body.classList.add("guides-enhanced");
    const guideSearchInput = document.querySelector("[data-guide-search]");
    const powerGuideIds = new Set([
      "auto-repair", "gaming-reboot", "no-display", "overheat-shutdown",
      "sleep-resume-fail", "no-power", "startup-slow"
    ]);
    const featuredGuideIds = ["black-screen-after-login", "auto-repair", "disk-usage-100"];
    let guideSearchQuery = "";
    let showAllGuides = false;
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
      const displayedSymptoms = query || showAllGuides ? visibleSymptoms : visibleSymptoms.slice(0, 6);
      const featuredGuides = featuredGuideIds.map((id) => data.symptoms.find((item) => item.id === id)).filter(Boolean);
      guidesRoot.innerHTML = `
        <div class="guide-layout">
          ${!query ? `
            <section class="guide-section guide-quick-start" aria-labelledby="guide-quick-start-title">
              <div class="guide-section-head"><div><p class="eyebrow">빠른 시작</p><h3 id="guide-quick-start-title">무엇을 확인하시나요?</h3><p>지금 가진 정보에 맞는 출발점을 선택하세요.</p></div></div>
              <div class="guide-quick-grid">
                <a class="guide-quick-link" href="#guide-symptoms" aria-describedby="guide-tooltip-symptom"><strong>증상으로 찾기</strong><span>증상에 맞는 점검 순서 보기</span><span class="guide-quick-tooltip" id="guide-tooltip-symptom" role="tooltip">오류 코드가 없거나 원인이 불확실할 때 선택하세요. 화면 멈춤, 재부팅, 소리·네트워크 문제처럼 현재 증상에서 점검 순서를 찾습니다.</span></a>
                <a class="guide-quick-link" href="error-codes-index.html" aria-describedby="guide-tooltip-code"><strong>오류코드 찾기</strong><span>코드와 오류 이름으로 바로 확인</span><span class="guide-quick-tooltip" id="guide-tooltip-code" role="tooltip">블루스크린 정지 코드, 설치 오류 번호, 게임 오류 이름을 알고 있을 때 선택하세요. 코드별 원인 후보와 우선 점검 항목으로 바로 이동합니다.</span></a>
                <a class="guide-quick-link" href="diagnostic.html#diagnostic-event" aria-describedby="guide-tooltip-event"><strong>이벤트 로그</strong><span>이벤트 뷰어 기록 분석하기</span><span class="guide-quick-tooltip" id="guide-tooltip-event" role="tooltip">이벤트 뷰어의 ID·원본·설명 또는 XML을 확인할 때 선택하세요. 발생 시각과 반복 여부를 함께 비교해 원인 범위를 좁힙니다.</span></a>
                <a class="guide-quick-link" href="windows-repair-tools-guide.html" aria-describedby="guide-tooltip-command"><strong>진단 명령어</strong><span>SFC·DISM·CHKDSK 사용법</span><span class="guide-quick-tooltip" id="guide-tooltip-command" role="tooltip">SFC, DISM, CHKDSK처럼 관리자 권한이 필요한 복구 도구를 실행하기 전에 선택하세요. 실행 순서와 결과 문구별 다음 조치를 안내합니다.</span></a>
              </div>
            </section>
          ` : ""}
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
              ? `<div class="guide-clean-grid">${displayedSymptoms.map((item) => renderGuideCard(item)).join("")}</div>
                ${!query && !showAllGuides && visibleSymptoms.length > displayedSymptoms.length
                  ? `<button type="button" class="guide-show-more" data-guide-show-more>가이드 ${visibleSymptoms.length}개 모두 보기</button>`
                  : ""}`
              : `<div class="guide-empty"><strong>일치하는 증상 가이드가 없습니다.</strong><p>다른 증상 이름이나 오류 코드를 입력해 보세요.</p></div>`}
          </section>
        </div>
      `;
    };
    renderGuides();
    guidesRoot.addEventListener("click", (event) => {
      const guideKindBtn = event.target.closest("[data-guide-kind]");
      if (guideKindBtn) {
        selectedGuideKind = guideKindBtn.dataset.guideKind;
        showAllGuides = false;
        renderGuides();
      }
      if (event.target.closest("[data-guide-show-more]")) {
        showAllGuides = true;
        renderGuides();
      }
    });
    if (guideSearchInput) {
      guideSearchInput.addEventListener("input", () => {
        guideSearchQuery = guideSearchInput.value;
        showAllGuides = false;
        renderGuides();
      });
    }
  }
})();

(() => {
  let overlay = null;
  function onKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
  }
  function closeLightbox() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.removeEventListener('keydown', onKeydown);
  }
  function openLightbox(src, alt) {
    overlay = document.createElement('div');
    overlay.className = 'image-lightbox-overlay';
    const img = document.createElement('img');
    img.className = 'image-lightbox-img';
    img.src = src;
    img.alt = alt || '';
    overlay.appendChild(img);
    overlay.addEventListener('click', closeLightbox);
    document.body.appendChild(overlay);
    document.addEventListener('keydown', onKeydown);
  }
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a.guide-image-link');
    if (!link) return;
    event.preventDefault();
    const innerImg = link.querySelector('img');
    openLightbox(link.getAttribute('href'), innerImg ? innerImg.getAttribute('alt') : '');
  });
})();
