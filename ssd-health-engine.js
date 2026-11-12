(() => {
  // 저장장치 건강 판정 엔진 — DOM 없이 판정만 한다(브라우저·Node 공용). SSD 건강 판정 페이지와 크래시 분석기가 함께 쓴다.
  // 브라우저 안에서만 계산하며 서버로 전송하지 않는다.
  // 입력: 점검 파일·관리자 PowerShell 명령의 JSON 결과, 수집 스크립트의 hardware.json, CrystalDiskInfo 직접 입력
  //   { disks: [{ model, mediaType, busType, diskNumber, drives, health, operational, sizeGB, wear, temperature,
  //               powerOnHours, readErrorsUncorrected, writeErrorsUncorrected, (선택) readLatencyMax … }],
  //     volumes: [{ drive, sizeGB, freeGB }],
  //     events: [{ provider, id, disk, count, last }], eventsChecked: true }   // 최근 30일 저장장치 관련 이벤트 집계
  // 판정 등급: danger(위험) > caution(주의) > good(양호) / unknown(상세 확인 불가)

  const WEAR_DANGER = 90;
  const WEAR_CAUTION = 70;
  const TEMP_LIMIT_SSD = 70;
  const TEMP_LIMIT_HDD = 55;
  const FREE_DANGER_PCT = 5;
  const FREE_CAUTION_PCT = 10;
  const AGE_INFO_HOURS = 35000;
  const REALLOCATED_DANGER = 100;
  const SPARE_CAUTION_PCT = 30;
  const SPARE_DEFAULT_THRESHOLD = 10;
  const LATENCY_INFO = 10000;
  const EST_MIN_WEAR = 3;
  const EST_MIN_HOURS = 300;
  const EST_SOON_MONTHS = 6;
  const FAST_WEAR_PER_30D = 3;
  const HISTORY_KEEP = 12;

  // 화면 언어("ko" 기본, "en"). 판정 문구는 T(한국어, 영어)로 고르고, setLang("en")으로 영어판 페이지가 전환한다.
  let LANG = "ko";
  const T = (ko, en) => (LANG === "en" ? en : ko);
  const nf = (n) => Number(n).toLocaleString(LANG === "en" ? "en-US" : "ko-KR");
  const setLang = (lang) => { LANG = lang === "en" ? "en" : "ko"; };

  const num = (v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const text = (v) => (v === null || v === undefined ? "" : String(v).trim());
  const asList = (v) => (Array.isArray(v) ? v : v && typeof v === "object" ? [v] : []);

  const RANK = { good: 0, unknown: 1, caution: 2, danger: 3 };
  const worse = (a, b) => (RANK[b] > RANK[a] ? b : a);

  // PowerShell 결과(ConvertTo-Json)와 hardware.json을 같은 모양으로 맞춘다.
  function normalize(raw) {
    let data = raw;
    if (typeof raw === "string") {
      const cleaned = raw.replace(/^﻿/, "").trim();
      if (!cleaned) throw new Error(T("붙여넣은 내용이 비어 있습니다.", "The pasted content is empty."));
      try { data = JSON.parse(cleaned); }
      catch (e) { throw new Error(T("JSON 형식이 아닙니다. 점검 파일이나 방법 2의 명령 결과를 그대로 붙여넣어 주세요.", "This is not JSON. Paste the result of the check file or of the Method 2 command exactly as it is.")); }
    }
    if (Array.isArray(data)) data = { disks: data };
    if (!data || typeof data !== "object") throw new Error(T("읽을 수 있는 디스크 정보가 없습니다.", "There is no readable disk information."));
    const disks = asList(data.disks).filter((d) => d && typeof d === "object");
    const volumes = asList(data.volumes).filter((v) => v && typeof v === "object");
    const events = asList(data.events).filter((e) => e && typeof e === "object");
    // events 값이 없으면(구버전 데이터) 이벤트 판정을 하지 않는다. 있으면 비어 있어도 '기록 없음'으로 본다.
    const hasEventData = data.events !== undefined || data.eventsChecked !== undefined;
    const eventsChecked = hasEventData && data.eventsChecked !== false;
    if (!disks.length && !volumes.length) throw new Error(T("디스크 정보(disks)나 볼륨 정보(volumes)를 찾지 못했습니다.", "Could not find disk information (disks) or volume information (volumes)."));
    return { disks, volumes, events, hasEventData, eventsChecked };
  }

  const isSsd = (d) => text(d.mediaType).toLowerCase() === "ssd" || text(d.busType).toLowerCase() === "nvme";

  // ── 이벤트 로그 신호 ─────────────────────────────────────────────
  // [종류, 이름]. 종류: data(불량 블록·하드웨어 입출력 오류) / predicted(고장 예측) / controller(컨트롤러 오류·재설정)
  //                    / io(입출력 재시도) / removed(갑작스러운 제거) / fs(파일 시스템 손상)
  const EVENT_INFO = {
    "disk|7": ["data", "Disk 7 · 불량 블록", "Disk 7 · bad block"],
    "disk|154": ["data", "Disk 154 · 하드웨어 오류로 입출력 실패", "Disk 154 · I/O failed due to a hardware error"],
    "disk|52": ["predicted", "Disk 52 · 저장장치 고장 예측 경고", "Disk 52 · storage failure prediction warning"],
    "disk|9": ["controller", "Disk 9 · 컨트롤러 오류", "Disk 9 · controller error"],
    "disk|11": ["controller", "Disk 11 · 컨트롤러 오류", "Disk 11 · controller error"],
    "stornvme|11": ["controller", "stornvme 11 · NVMe 컨트롤러 오류", "stornvme 11 · NVMe controller error"],
    "stornvme|129": ["controller", "stornvme 129 · NVMe 장치 재설정", "stornvme 129 · NVMe device reset"],
    "storahci|129": ["controller", "storahci 129 · 저장장치 재설정", "storahci 129 · storage device reset"],
    "disk|51": ["io", "Disk 51 · 페이징 입출력 오류", "Disk 51 · paging I/O error"],
    "disk|153": ["io", "Disk 153 · 입출력 재시도", "Disk 153 · I/O retry"],
    "disk|157": ["removed", "Disk 157 · 디스크가 갑자기 제거됨", "Disk 157 · disk surprise-removed"],
    "ntfs|50": ["fs", "Ntfs 50 · 지연된 쓰기 실패", "Ntfs 50 · delayed write failed"],
    "ntfs|55": ["fs", "Ntfs 55 · 파일 시스템 손상", "Ntfs 55 · file-system corruption"],
    "ntfs|57": ["fs", "Ntfs 57 · 메타데이터 쓰기 실패", "Ntfs 57 · metadata write failed"],
    "ntfs|140": ["fs", "Ntfs 140 · 트랜잭션 로그 플러시 실패", "Ntfs 140 · transaction log flush failed"],
  };

  function normEvent(e) {
    const provider = text(e.provider).toLowerCase().replace(/^microsoft-windows-/, "");
    const id = num(e.id);
    const info = EVENT_INFO[`${provider}|${id}`];
    const count = num(e.count);
    if (!info || id === null || !count || count < 1) return null;
    const disk = text(e.disk).replace(/\D/g, "");
    return { provider, id, kind: info[0], label: LANG === "en" ? info[2] : info[1], count, last: text(e.last), disk, href: `${LANG === "en" ? "/en/" : ""}event-${provider}-${id}.html` };
  }

  const kindCounts = (list) => {
    const c = { data: 0, predicted: 0, controller: 0, io: 0, removed: 0, fs: 0 };
    list.forEach((e) => { c[e.kind] += e.count; });
    return c;
  };

  // mine = 이 대상(디스크 하나 또는 디스크를 특정하지 못한 기록)의 이벤트, all = 전체 이벤트(여러 종류가 함께 기록됐는지 볼 때 사용)
  function eventFindings(mine, all) {
    const c = kindCounts(mine);
    const a = kindCounts(all);
    const findings = [];
    let level = "good";
    const add = (lv, title, detail, kind) => {
      const top = mine.filter((e) => e.kind === kind).sort((x, y) => y.count - x.count)[0];
      findings.push({ level: lv, title, detail, href: top ? top.href : undefined, hrefLabel: top ? T("해설 보기", "Read the explanation") : undefined });
      level = worse(level, lv);
    };
    const list = (kind) => mine.filter((e) => e.kind === kind).map((e) => T(`${e.label} ${e.count}회${e.last ? `(최근 ${e.last})` : ""}`, `${e.label} ×${e.count}${e.last ? ` (latest ${e.last})` : ""}`)).join(", ");

    if (c.predicted >= 1) add("danger", T(`저장장치 고장 예측 경고 ${c.predicted}회`, `Storage failure prediction warning ×${c.predicted}`), T(`${list("predicted")}. 디스크가 스스로 곧 고장 날 수 있다고 보고한 기록입니다. 지금 백업하고 교체를 준비하세요.`, `${list("predicted")}. The disk itself has reported that it may fail soon. Back up now and prepare a replacement.`), "predicted");
    if (c.data >= 3) add("danger", T(`불량 블록·하드웨어 입출력 오류가 반복됩니다 (${c.data}회)`, `Bad blocks / hardware I/O errors keep repeating (×${c.data})`), T(`${list("data")}. 같은 오류가 반복되면 디스크 불량 가능성이 큽니다. 백업을 먼저 하세요.`, `${list("data")}. When the same error repeats, a faulty disk is likely. Back up first.`), "data");
    else if (c.data >= 1) add("caution", T(`불량 블록·하드웨어 입출력 오류 기록 ${c.data}회`, `Bad block / hardware I/O error records ×${c.data}`), T(`${list("data")}. 한두 번이라도 기록됐다면 백업해 두고 늘어나는지 지켜보세요.`, `${list("data")}. Even one or two records are a reason to back up and watch whether they increase.`), "data");

    if (c.controller >= 3 && (a.data + a.fs + a.predicted) >= 1) {
      add("danger", T(`컨트롤러·연결 이상과 데이터 오류가 함께 기록됐습니다 (컨트롤러 ${c.controller}회)`, `Controller/connection problems and data errors were recorded together (controller ×${c.controller})`), T(`${list("controller")}. 컨트롤러·연결 문제와 데이터 오류가 같이 나타나면 갑자기 디스크가 사라지거나 데이터가 손상될 위험이 큽니다. 백업을 먼저 하고, 케이블·슬롯·펌웨어를 점검하세요.`, `${list("controller")}. When controller or connection problems appear together with data errors, there is a high risk that the disk suddenly disappears or data is damaged. Back up first, then check the cable, slot and firmware.`), "controller");
    } else if (c.controller >= 3) {
      add("caution", T(`컨트롤러·연결 관련 기록이 반복됩니다 (${c.controller}회)`, `Controller/connection records keep repeating (×${c.controller})`), T(`${list("controller")}. 디스크 자체보다 케이블·슬롯·전원 절약 설정·드라이버·펌웨어 문제일 수 있습니다. 반복되면 백업해 두고 점검하세요.`, `${list("controller")}. The cause may be the cable, slot, power-saving setting, driver or firmware rather than the disk itself. If it repeats, back up and check.`), "controller");
    } else if (c.controller >= 1) {
      add("info", T(`컨트롤러·연결 관련 기록 ${c.controller}회`, `Controller/connection records ×${c.controller}`), T(`${list("controller")}. 드물게 한두 번은 흔히 있지만, 늘어나는지 지켜보세요.`, `${list("controller")}. One or two now and then is common, but watch whether it increases.`), "controller");
    }

    if (c.fs >= 3 || (c.fs >= 1 && a.data >= 1)) add("danger", T(`파일 시스템 손상 기록이 있습니다 (${c.fs}회)`, `File-system corruption records found (×${c.fs})`), T(`${list("fs")}. ${a.data >= 1 ? "불량 블록·하드웨어 오류와 함께 기록돼 저장장치 문제일 가능성이 있습니다. " : ""}디스크 검사 전에 백업을 먼저 하세요.`, `${list("fs")}. ${a.data >= 1 ? "They were recorded together with bad-block or hardware errors, so a storage-device problem is possible. " : ""}Back up before running a disk check.`), "fs");
    else if (c.fs >= 1) add("caution", T(`파일 시스템 오류 기록 ${c.fs}회`, `File-system error records ×${c.fs}`), T(`${list("fs")}. 비정상 종료 뒤에도 남을 수 있습니다. 백업 후 상태를 확인하세요.`, `${list("fs")}. They can also remain after an abnormal shutdown. Back up, then check the state.`), "fs");

    if (c.io >= 5) add("caution", T(`입출력 재시도·오류가 잦습니다 (${c.io}회)`, `I/O retries and errors are frequent (×${c.io})`), T(`${list("io")}. 케이블·포트 접촉, 외장 장치 전원, 디스크 상태를 점검하세요.`, `${list("io")}. Check the cable and port contact, the power of external devices and the disk state.`), "io");
    else if (c.io >= 1) add("info", T(`입출력 재시도·오류 기록 ${c.io}회`, `I/O retry/error records ×${c.io}`), `${list("io")}.`, "io");

    if (c.removed >= 3) add("caution", T(`디스크 연결이 자주 끊깁니다 (${c.removed}회)`, `The disk connection drops often (×${c.removed})`), T(`${list("removed")}. 외장 장치를 안전 제거 없이 뽑은 경우가 아니라면 케이블·포트·전원을 점검하세요.`, `${list("removed")}. Unless you pulled an external device without safe removal, check the cable, port and power.`), "removed");
    else if (c.removed >= 1) add("info", T(`디스크가 갑자기 제거된 기록 ${c.removed}회`, `Disk surprise-removal records ×${c.removed}`), T(`${list("removed")}. 외장 장치를 안전 제거 없이 뽑으면 남습니다.`, `${list("removed")}. It is logged when an external device is pulled out without safe removal.`), "removed");
    return { level, findings };
  }

  // ── 교체 시점 추정 ───────────────────────────────────────────────
  const monthsText = (m) => (m >= 24 ? T(`약 ${Math.round(m / 12)}년`, `about ${Math.round(m / 12)} years`) : m >= 1 ? T(`약 ${Math.round(m)}개월`, `about ${Math.round(m)} months`) : T("1개월 미만", "under 1 month"));
  function estimateReplacement(wear, hours) {
    if (wear === null || hours === null || wear < EST_MIN_WEAR || hours < EST_MIN_HOURS || wear >= WEAR_DANGER) return null;
    const hoursLeft = ((WEAR_DANGER - wear) / wear) * hours;
    const m8 = hoursLeft / 8 / 30;
    const m24 = hoursLeft / 24 / 30;
    return { hoursLeft: Math.round(hoursLeft), monthsAt8h: m8, monthsAtAlways: m24, soon: m8 <= EST_SOON_MONTHS,
      title: T(`교체 시점 추정: 수명 소모 ${WEAR_DANGER}%까지 하루 8시간 사용 시 ${monthsText(m8)}, 상시 켜 두면 ${monthsText(m24)}`, `Replacement estimate: ${monthsText(m8)} to ${WEAR_DANGER}% wear at 8 hours a day, ${monthsText(m24)} if left on all the time`),
      detail: T(`지금까지의 속도(수명 소모 ${wear}% / 전원 켜진 ${nf(hours)}시간)가 이어지면 앞으로 전원이 켜진 시간으로 약 ${nf(Math.round(hoursLeft))}시간 뒤입니다. 사용량이 늘거나 줄면 달라지는 대략적인 추정이며, 수명 소모가 항상 일정한 속도로 진행되지는 않습니다.`, `If the pace so far (${wear}% wear over ${nf(hours)} powered-on hours) continues, that is about ${nf(Math.round(hoursLeft))} more powered-on hours. This is a rough estimate that changes if usage rises or falls, and wear does not always progress at a constant rate.`) };
  }

  const keyOf = (d, model, sizeGB) => [model, sizeGB === null ? "" : sizeGB, text(d.busType).toLowerCase(), num(d.diskNumber) === null ? "" : num(d.diskNumber)].join("|");

  function evaluateDisk(d, myEvents, allCounts) {
    const model = text(d.model) || T("이름 없는 디스크", "Unnamed disk");
    const media = text(d.mediaType).toLowerCase();
    const hdd = media === "hdd";
    const health = text(d.health);
    const oper = text(d.operational);
    const hp = num(d.healthPercent);
    const wear = num(d.wear) !== null ? num(d.wear) : hp !== null ? Math.max(0, Math.min(100, 100 - hp)) : null;
    const temp = num(d.temperature);
    const hours = num(d.powerOnHours);
    const readErr = num(d.readErrorsUncorrected);
    const writeErr = num(d.writeErrorsUncorrected);
    const realloc = num(d.reallocatedSectors);
    const pending = num(d.pendingSectors);
    const uncorr = num(d.uncorrectableSectors);
    const spare = num(d.availableSpare);
    const spareThr = num(d.availableSpareThreshold);
    const critWarn = num(d.criticalWarning);
    const mediaErr = num(d.mediaErrors);
    const cdi = text(d.cdiStatus).toLowerCase();
    // 이 디스크에 속한 드라이브 문자(C:, D: …). 값이 없으면(구버전 데이터) null, 빈 배열이면 드라이브 문자 없음.
    const rawDrives = d.drives === undefined || d.drives === null ? null : asList(typeof d.drives === "string" ? [d.drives] : d.drives);
    const drives = rawDrives === null ? null : rawDrives.map((x) => text(x).toUpperCase().replace(/[^A-Z]/g, "")).filter(Boolean).map((x) => x[0] + ":").sort();
    const findings = [];
    let level = "good";
    const add = (lv, title, detail) => { findings.push({ level: lv, title, detail }); level = worse(level, lv); };

    if (health && health.toLowerCase() !== "healthy") {
      add("danger", T(`Windows 디스크 상태가 '${health}'입니다`, `Windows reports the disk status as '${health}'`), T("Windows가 이 디스크를 정상으로 보지 않습니다. 가장 먼저 백업하세요.", "Windows does not consider this disk healthy. Back up first."));
    }
    let disconnected = false;
    if (/predictive/i.test(oper)) {
      add("danger", T("고장 예측(Predictive Failure) 상태입니다", "Predictive Failure state"), T("디스크가 스스로 곧 고장 날 가능성을 보고한 상태입니다. 지금 백업하고 교체를 준비하세요.", "The disk reports that it may fail soon. Back up now and prepare a replacement."));
    } else if (/lost communication|offline/i.test(oper)) {
      disconnected = true;
      add("caution", T(`현재 연결되어 있지 않은 디스크입니다 (Windows가 통신하지 못함, 상태 '${oper}')`, `Disk not currently connected (Windows cannot communicate with it, status '${oper}')`), T("케이블·전원·슬롯 연결이 풀렸거나 디스크가 응답하지 않는 상태입니다. 내장 디스크라면 PC를 끄고 연결을 확인하고, 반복되면 백업이 가능한지 먼저 확인하세요. 외장 디스크를 분리한 것이라면 정상입니다.", "The cable, power or slot connection may have come loose, or the disk is not responding. For an internal disk, turn the PC off and check the connection, and if it repeats, first check whether a backup is possible. If you just unplugged an external disk, this is normal."));
    } else if (oper && !/^ok$/i.test(oper)) {
      add("caution", T(`동작 상태가 '${oper}'입니다`, `Operational status is '${oper}'`), T("연결·전원 문제이거나 디스크 이상일 수 있습니다. 케이블·포트를 확인하고 상태가 반복되면 백업하세요.", "It may be a connection or power problem, or a disk problem. Check the cable and port, and back up if the state repeats."));
    }
    if (cdi === "bad") add("danger", T("CrystalDiskInfo 상태가 '나쁨'입니다", "CrystalDiskInfo status is 'Bad'"), T("프로그램이 이 디스크를 위험으로 판단했습니다. 지금 백업하고 교체를 준비하세요.", "The program judges this disk to be at risk. Back up now and prepare a replacement."));
    else if (cdi === "caution") add("caution", T("CrystalDiskInfo 상태가 '주의'입니다", "CrystalDiskInfo status is 'Caution'"), T("프로그램이 주의를 표시했습니다. 어떤 항목이 노란색인지 확인하고 백업해 두세요.", "The program shows a caution. Check which item is yellow and back up."));
    if ((readErr || 0) > 0 || (writeErr || 0) > 0) {
      add("danger", T("복구되지 않은 읽기/쓰기 오류가 기록돼 있습니다", "Uncorrected read/write errors are recorded"), T(`읽기 오류 ${readErr || 0}건, 쓰기 오류 ${writeErr || 0}건. 저장장치가 데이터를 제대로 읽거나 쓰지 못한 기록입니다.`, `${readErr || 0} read errors and ${writeErr || 0} write errors. These are records of the storage device failing to read or write data correctly.`));
    }
    if ((pending || 0) > 0 || (uncorr || 0) > 0) {
      add("danger", T(`읽기 불안정·복구 불가능 섹터가 있습니다 (대기 ${pending || 0}개, 복구 불가 ${uncorr || 0}개)`, `Unstable or uncorrectable sectors found (${pending || 0} pending, ${uncorr || 0} uncorrectable)`), T("읽지 못하는 불안정한 영역이 있다는 뜻으로, 교체가 필요한 경우가 많습니다. 지금 백업하세요.", "It means some areas cannot be read reliably, and replacement is often needed. Back up now."));
    }
    if (realloc !== null && realloc > 0) {
      if (realloc >= REALLOCATED_DANGER) add("danger", T(`재할당된 섹터 ${nf(realloc)}개`, `Reallocated sectors: ${nf(realloc)}`), T("불량 영역이 많이 대체됐습니다. 지금 백업하고 교체를 준비하세요.", "Many bad areas have been replaced. Back up now and prepare a replacement."));
      else add("caution", T(`재할당된 섹터 ${nf(realloc)}개`, `Reallocated sectors: ${nf(realloc)}`), T("불량 영역이 예비 영역으로 대체된 기록입니다. 값이 늘어나는지 정기적으로 확인하고 백업해 두세요.", "Bad areas have been replaced with spare areas. Check regularly whether the value grows, and back up."));
    }
    if (critWarn !== null && critWarn > 0) {
      add("danger", T(`NVMe 치명적 경고(Critical Warning)가 0이 아닙니다 (값 ${critWarn})`, `NVMe Critical Warning is not 0 (value ${critWarn})`), T("NVMe가 예비 공간 부족·과열·미디어 오류·읽기 전용 전환 등을 보고한 상태입니다. 지금 백업하세요.", "The NVMe drive has reported low spare capacity, overheating, a media error or a switch to read-only. Back up now."));
    }
    if (spare !== null) {
      const thr = spareThr !== null ? spareThr : SPARE_DEFAULT_THRESHOLD;
      if (spare <= thr) add("danger", T(`사용 가능한 예비 영역 ${spare}% (기준 ${thr}% 이하)`, `Available spare ${spare}% (at or below the ${thr}% threshold)`), T("교체용 예비 영역이 거의 없습니다. 지금 백업하고 교체를 준비하세요.", "There is almost no spare area left. Back up now and prepare a replacement."));
      else if (spare <= SPARE_CAUTION_PCT) add("caution", T(`사용 가능한 예비 영역 ${spare}%`, `Available spare ${spare}%`), T("예비 영역이 줄고 있습니다. 교체를 계획하고 백업해 두세요.", "The spare area is shrinking. Plan a replacement and back up."));
    }
    if (mediaErr !== null && mediaErr > 0) {
      add("danger", T(`미디어 및 데이터 무결성 오류 ${nf(mediaErr)}건`, `Media and data integrity errors: ${nf(mediaErr)}`), T("저장된 데이터를 읽는 과정에서 무결성 오류가 보고됐습니다. 지금 백업하세요.", "Integrity errors were reported while reading stored data. Back up now."));
    }
    if (wear !== null) {
      if (wear >= WEAR_DANGER) add("danger", T(`수명 소모 ${wear}%`, `Wear ${wear}%`), T("SSD 수명이 거의 다 소진됐습니다. 갑자기 쓰기 전용·읽기 전용 상태로 바뀌거나 인식이 안 될 수 있습니다.", "The SSD's life is almost used up. It may suddenly switch to a read-only state or stop being recognised."));
      else if (wear >= WEAR_CAUTION) add("caution", T(`수명 소모 ${wear}%`, `Wear ${wear}%`), T("수명의 상당 부분을 사용했습니다. 교체를 계획하고 중요한 자료는 따로 백업해 두세요.", "A large part of its life has been used. Plan a replacement and keep important data backed up separately."));
    }
    if (temp !== null && temp >= (hdd ? TEMP_LIMIT_HDD : TEMP_LIMIT_SSD)) {
      add("caution", T(`온도 ${temp}℃`, `Temperature ${temp}℃`), T("방열·통풍을 점검하세요. 과열이 이어지면 속도 저하와 오류가 늘 수 있습니다.", "Check cooling and airflow. Continued overheating can slow the drive and increase errors."));
    }
    if (hours !== null && hours >= AGE_INFO_HOURS) {
      findings.push({ level: "info", title: T(`사용 시간 ${nf(hours)}시간`, `Power-on time ${nf(hours)} hours`), detail: T("오래 사용한 디스크입니다(약 4년 이상 상시 사용 수준). 수치가 정상이어도 백업은 따로 두는 편이 안전합니다.", "This is a well-used disk (roughly four or more years of constant use). Even if the values look normal, it is safer to keep a separate backup.") });
    }
    const lat = [[T("읽기", "Read"), num(d.readLatencyMax)], [T("쓰기", "Write"), num(d.writeLatencyMax)], [T("플러시", "Flush"), num(d.flushLatencyMax)]].filter(([, v]) => v !== null && v >= LATENCY_INFO);
    if (lat.length) {
      findings.push({ level: "info", title: T(`최대 지연 값이 큽니다 (${lat.map(([n, v]) => `${n} ${nf(v)}`).join(", ")})`, `Maximum latency values are large (${lat.map(([n, v]) => `${n} ${nf(v)}`).join(", ")})`), detail: T("디스크가 한때 오래 응답하지 않았을 수 있습니다. 값의 단위는 드라이버에 따라 다를 수 있어 참고만 하세요. 멈춤 증상이 있다면 컨트롤러·연결 점검이 필요합니다.", "The disk may once have stopped responding for a long time. The unit can differ by driver, so treat it as a reference only. If you have freezing symptoms, check the controller and connection.") });
    }
    const est = estimateReplacement(wear, hours);
    if (est) {
      // 추정은 대략적인 값이라 판정 등급은 바꾸지 않고 참고 정보로만 보여 준다.
      findings.push({ level: "info", title: est.title + (est.soon ? T(" — 교체를 미리 계획하세요", " — plan a replacement in advance") : ""), detail: est.detail, href: LANG === "en" ? undefined : "ssd-tbw-calculator.html", hrefLabel: LANG === "en" ? undefined : "SSD 수명(TBW) 계산기" });
    }
    if (myEvents && myEvents.length) {
      // 다른 디스크·시스템 전체 기록과 함께 봐야 하는 판정(컨트롤러 + 데이터 오류 등)을 위해 전체 이벤트도 넘긴다.
      const ev = eventFindings(myEvents, allCounts ? allCounts.list : myEvents);
      ev.findings.forEach((f) => { findings.push(f); level = worse(level, f.level); });
    }

    const detailRead = wear !== null || temp !== null || readErr !== null || writeErr !== null || realloc !== null || pending !== null || uncorr !== null || spare !== null || critWarn !== null || mediaErr !== null || cdi !== "";
    if (!detailRead) {
      findings.push({ level: "info", title: T("SMART 상세(수명·온도·오류)를 읽지 못했습니다", "Could not read SMART details (wear, temperature, errors)"), detail: T("관리자 권한 PowerShell에서 다시 실행해야 읽히는 경우가 많습니다. 상세 값 없이는 '양호'라고 말할 수 없습니다.", "They can often be read only when run again in an administrator PowerShell. Without the details we cannot call the disk 'healthy'.") });
      if (level === "good") level = "unknown";
    }
    const sizeGB = num(d.sizeGB);
    return { model, bus: text(d.busType).toLowerCase(), key: keyOf(d, model, sizeGB), kind: hdd ? "HDD" : isSsd(d) ? "SSD" : (text(d.mediaType) || T("디스크", "Disk")), sizeGB, diskNumber: num(d.diskNumber), drives, level, findings, detailRead, disconnected,
      metrics: { wear, hours, temp, readErr, writeErr } };
  }

  function evaluateVolume(v) {
    const size = num(v.sizeGB);
    const free = num(v.freeGB);
    const drive = text(v.drive) || "?";
    if (size === null || free === null || size <= 0) return null;
    const pct = Math.round((free / size) * 1000) / 10;
    // 공간 등급(good / low / critical)은 디스크 건강 등급과 별개다. 공간이 부족해도 디스크가 고장 난 것은 아니다.
    let level = "good";
    let title = T(`${drive} 여유 공간 ${pct}% (${free}GB / ${size}GB)`, `${drive} free space ${pct}% (${free}GB / ${size}GB)`);
    let detail = "";
    if (pct < FREE_DANGER_PCT) {
      level = "critical";
      detail = T("공간이 거의 가득 찼습니다. 디스크 고장과는 다른 문제지만, 이대로면 파일 저장·업데이트가 실패하고 속도가 크게 느려질 수 있습니다(SSD는 빈 공간이 부족하면 쓰기 성능이 떨어집니다). 불필요한 파일을 정리하거나 큰 파일을 다른 드라이브로 옮기세요.", "The drive is almost full. This is a different problem from a disk failure, but as it is, saving files and updates can fail and the drive can become much slower (an SSD loses write performance when it runs short of free space). Delete unneeded files or move large files to another drive.");
    } else if (pct < FREE_CAUTION_PCT) {
      level = "low";
      detail = T("공간이 부족해지고 있습니다. 디스크 상태와는 별개의 문제이고, 정리하면 해결됩니다. 10% 이상 확보하면 속도와 안정성에 유리합니다.", "Free space is running low. This is separate from the disk's health and is solved by cleaning up. Keeping at least 10% free helps speed and stability.");
    }
    return { drive, pct, freeGB: free, sizeGB: size, level, title, detail, severe: pct < FREE_DANGER_PCT };
  }

  function evaluate(raw) {
    const { disks, volumes, events, hasEventData, eventsChecked } = normalize(raw);
    const evAll = events.map(normEvent).filter(Boolean);
    const diskNumbers = disks.map((d) => num(d.diskNumber)).filter((n) => n !== null);
    const mineFor = (d) => (num(d.diskNumber) === null ? [] : evAll.filter((e) => e.disk !== "" && Number(e.disk) === num(d.diskNumber)));
    const allCounts = { list: evAll };
    const diskResults = disks.map((d) => evaluateDisk(d, mineFor(d), allCounts));
    // 디스크를 특정하지 못한 기록(stornvme·storahci·Ntfs, 번호를 알 수 없는 Disk 기록)은 시스템 전체 신호로 따로 판정한다.
    // 디스크 번호를 알 수 있는 데이터일 때, 현재 연결된 디스크에 없는 번호의 기록은 '연결되어 있지 않은 디스크'의 기록으로 따로 본다.
    const numbered = diskNumbers.length > 0;
    const sysEvents = evAll.filter((e) => e.disk === "" || !numbered);
    const goneEvents = numbered ? evAll.filter((e) => e.disk !== "" && !diskNumbers.includes(Number(e.disk))) : [];
    const disconnected = [];
    const byGone = {};
    goneEvents.forEach((e) => { (byGone[e.disk] = byGone[e.disk] || []).push(e); });
    Object.keys(byGone).sort((a, b) => Number(a) - Number(b)).forEach((n) => {
      const g = eventFindings(byGone[n], evAll);
      disconnected.push({ source: "events", level: g.level, findings: g.findings, items: byGone[n],
        title: T(`디스크 ${n}`, `Disk ${n}`), detail: T(`최근 30일 이벤트 기록에는 디스크 ${n}이 있지만 지금 연결된 디스크 목록에는 없습니다. 외장 디스크를 분리했거나 연결이 끊어진 디스크일 수 있습니다.`, `The last 30 days of event records include disk ${n}, but it is not in the list of currently connected disks. It may be an external disk you removed, or a disk whose connection was lost.`) });
    });
    let eventsResult = null;
    if (hasEventData) {
      const ev = eventFindings(sysEvents, evAll);
      eventsResult = { checked: eventsChecked, level: eventsChecked ? ev.level : "good", findings: ev.findings, items: sysEvents.slice().sort((a, b) => b.count - a.count), total: evAll.reduce((n, e) => n + e.count, 0) };
    }
    // 드라이브는 C → D → E … 알파벳 순서로 보여 준다.
    const volumeResults = volumes.map(evaluateVolume).filter(Boolean).sort((a, b) => a.drive.localeCompare(b.drive, "en"));
    volumeResults.forEach((v) => { v.disks = diskResults.filter((d) => d.drives && d.drives.includes(text(v.drive).toUpperCase())).map((d) => d.model); });
    // level = 디스크 건강 등급(위험/주의/양호/확인 불가). 여유 공간은 건강 등급을 바꾸지 않고 spaceLevel로 따로 알린다.
    let level = "good";
    diskResults.forEach((d) => { level = worse(level, d.level); });
    if (eventsResult) level = worse(level, eventsResult.level);
    disconnected.forEach((g) => { level = worse(level, g.level); });
    let spaceLevel = "good";
    volumeResults.forEach((v) => { if (v.level === "critical" || (v.level === "low" && spaceLevel === "good")) spaceLevel = v.level; });
    return { level, spaceLevel, disks: diskResults, volumes: volumeResults, events: eventsResult, disconnected };
  }

  // ── 이전 결과와 비교(이 브라우저에 저장된 기록 사용) ─────────────────────
  // 키(model|size|bus|diskNumber)에서 디스크 번호를 뺀 값. 디스크를 뗐을 때 번호가 밀려도 같은 디스크로 본다.
  const baseOf = (k) => String(k).split("|").slice(0, 3).join("|");
  const dayDiff = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);

  // history = { v: 1, disks: { [key]: [{ d: "YYYY-MM-DD", wear, hours, rErr, wErr }, ...] } }. res.disks[].findings에 비교 결과를 덧붙인다.
  function compareWithHistory(res, history, today) {
    res.disks.forEach((disk) => {
      const entries = (history && history.disks && history.disks[disk.key]) || [];
      const prev = entries.filter((e) => e.d < today).sort((a, b) => (a.d < b.d ? 1 : -1))[0];
      const m = disk.metrics;
      if (!prev || !disk.detailRead) return;
      const days = dayDiff(prev.d, today);
      const notes = [];
      if (m.wear !== null && prev.wear !== null && prev.wear !== undefined) {
        const delta = Math.round((m.wear - prev.wear) * 10) / 10;
        if (delta > 0) {
          const per30 = days > 0 ? Math.round((delta / days) * 30 * 10) / 10 : delta;
          if (days >= 7 && per30 >= FAST_WEAR_PER_30D) {
            disk.findings.push({ level: "caution", title: T(`지난 점검(${prev.d})보다 수명 소모가 빠르게 늘었습니다 (+${delta}%p, 30일 환산 약 ${per30}%p)`, `Wear grew quickly since the last check (${prev.d}) (+${delta} points, about ${per30} points per 30 days)`), detail: T("짧은 기간에 수명 소모가 크게 늘었습니다. 대용량 쓰기 작업이 있었는지 확인하고, 계속되면 교체를 앞당겨 계획하세요.", "Wear rose sharply in a short time. Check whether there was a large write job, and if it continues, bring the replacement plan forward.") });
            disk.level = worse(disk.level, "caution");
          } else notes.push(T(`수명 소모 +${delta}%p`, `wear +${delta} points`));
        } else notes.push(T("수명 소모 변화 없음", "wear unchanged"));
      }
      const errNow = (m.readErr || 0) + (m.writeErr || 0);
      const errPrev = (prev.rErr || 0) + (prev.wErr || 0);
      if (errNow > errPrev) {
        disk.findings.push({ level: "danger", title: T(`복구되지 않은 오류가 지난 점검(${prev.d})보다 늘었습니다 (${errPrev}건 → ${errNow}건)`, `Uncorrected errors increased since the last check (${prev.d}) (${errPrev} → ${errNow})`), detail: T("오류가 계속 늘고 있습니다. 지금 백업하고 교체를 준비하세요.", "Errors keep increasing. Back up now and prepare a replacement.") });
        disk.level = worse(disk.level, "danger");
      } else if (errNow > 0) notes.push(T(`오류 ${errNow}건 그대로`, `${errNow} errors unchanged`));
      if (notes.length) disk.findings.push({ level: "info", title: T(`지난 점검(${prev.d})과 비교`, `Compared with the last check (${prev.d})`), detail: T(`${notes.join(" · ")} (${days}일 사이).`, `${notes.join(" · ")} (over ${days} days).`) });
    });
    // 지난 점검에는 있었는데 지금은 보이지 않는 디스크
    if (res.disks.length && history && history.disks) {
      const present = new Set(res.disks.map((d) => baseOf(d.key)));
      const lastByBase = {};
      Object.keys(history.disks).forEach((k) => {
        const b = baseOf(k);
        if (present.has(b)) return;
        (history.disks[k] || []).forEach((e) => { if (!lastByBase[b] || e.d > lastByBase[b].d) lastByBase[b] = { d: e.d, drives: e.drives || null }; });
      });
      Object.keys(lastByBase).sort().forEach((b) => {
        const [model, size, bus] = b.split("|");
        const external = bus === "usb";
        const sizeGB = size === "" ? null : Number(size);
        res.disconnected.push({ source: "history", baseKey: b, level: external ? "good" : "caution", findings: [], items: [],
          title: T(`${model}${sizeGB ? ` ${sizeGB}GB` : ""}${external ? " (외장 USB)" : ""}${lastByBase[b].drives && lastByBase[b].drives.length ? ` · ${lastByBase[b].drives.join(", ")} 드라이브` : ""}`, `${model}${sizeGB ? ` ${sizeGB}GB` : ""}${external ? " (external USB)" : ""}${lastByBase[b].drives && lastByBase[b].drives.length ? ` · drive ${lastByBase[b].drives.join(", ")}` : ""}`),
          detail: external
            ? T(`지난 점검(${lastByBase[b].d})에는 연결되어 있었지만 지금은 보이지 않습니다. 외장 디스크를 분리했다면 정상입니다.`, `It was connected at the last check (${lastByBase[b].d}) but is not visible now. If you unplugged the external disk, that is normal.`)
            : T(`지난 점검(${lastByBase[b].d})에는 연결되어 있었지만 지금은 보이지 않습니다. 내장 디스크가 사라진 것이라면 케이블·전원·슬롯 접촉이나 디스크 고장일 수 있으니, 남은 디스크를 포함해 중요한 자료의 백업을 먼저 하고 연결을 확인하세요. 일부러 뗀 디스크라면 아래 버튼으로 알림을 끄세요.`, `It was connected at the last check (${lastByBase[b].d}) but is not visible now. If an internal disk has disappeared, it may be a loose cable, power or slot contact, or a disk failure, so back up important data first, including from the remaining disks, and check the connection. If you removed the disk on purpose, use the button below to turn the notice off.`) });
      });
    }
    let level = "good";
    res.disks.forEach((d) => { level = worse(level, d.level); });
    if (res.events) level = worse(level, res.events.level);
    (res.disconnected || []).forEach((g) => { level = worse(level, g.level); });
    res.level = level;
    return res;
  }

  // 오늘 결과를 기록에 반영한다(같은 날 다시 점검하면 덮어쓴다). 상세 값을 읽은 디스크만 저장한다.
  function updateHistory(history, res, today) {
    const h = history && history.v === 1 && history.disks ? history : { v: 1, disks: {} };
    res.disks.forEach((disk) => {
      if (!disk.detailRead) return;
      const m = disk.metrics;
      const list = (h.disks[disk.key] || []).filter((e) => e.d !== today);
      list.push({ d: today, wear: m.wear, hours: m.hours, rErr: m.readErr, wErr: m.writeErr, drives: disk.drives });
      h.disks[disk.key] = list.sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-HISTORY_KEEP);
    });
    return h;
  }

  // 판정 데이터를 gzip + base64url로 줄여 SSD 건강 판정 페이지 주소의 #d= 값으로 만든다. 지원하지 않거나 너무 길면 null.
  async function encodeHashPayload(jsonText, maxLength) {
    if (typeof CompressionStream === "undefined") return null;
    const stream = new Blob([new TextEncoder().encode(jsonText)]).stream().pipeThrough(new CompressionStream("gzip"));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    let bin = "";
    buf.forEach((b) => { bin += String.fromCharCode(b); });
    const hash = "#d=" + btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return hash.length <= (maxLength || 1800) ? hash : null;
  }

  // 점검 파일이 주소의 #d= 뒤에 담아 보낸 값(gzip + base64url)을 JSON 문자열로 푼다. 해당 없으면 null.
  async function decodeHashPayload(hash) {
    if (!/^#d=/.test(hash || "")) return null;
    const m = /^#d=([A-Za-z0-9_-]+)$/.exec(hash);
    if (!m) throw new Error(T("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요.", "The result value is damaged. Run the check file again."));
    if (typeof DecompressionStream === "undefined") throw new Error(T("이 브라우저는 점검 파일의 결과를 읽지 못합니다. 아래 '명령을 직접 실행' 방법을 이용하세요.", "This browser cannot read the result of the check file. Use the 'run the command yourself' method below."));
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    let bytes;
    try { bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }
    catch (e) { throw new Error(T("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요.", "The result value is damaged. Run the check file again.")); }
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return await new Response(stream).text();
    } catch (e) { throw new Error(T("결과 값을 풀지 못했습니다. 점검 파일을 다시 실행해 주세요.", "Could not unpack the result value. Run the check file again.")); }
  }

  const VERDICT = {
    danger: { get badge() { return T("위험", "Danger"); }, get headline() { return T("이 저장장치는 곧 고장 날 수 있습니다. 지금 바로 중요한 자료를 백업하고 교체를 준비하세요.", "This storage device may fail soon. Back up your important data right now and prepare a replacement."); } },
    caution: { get badge() { return T("주의", "Caution"); }, get headline() { return T("당장 고장 난다는 뜻은 아니지만 디스크 상태에서 신경 써야 할 항목이 있습니다. 백업을 먼저 확인하세요.", "It does not mean failure is imminent, but there are disk-health items that need attention. Check your backup first."); } },
    good: { get badge() { return T("양호", "Good"); }, get headline() { return T("확인된 수치에서는 큰 이상이 보이지 않습니다. 그래도 백업은 따로 두세요.", "No major problem shows in the values that could be checked. Still, keep a separate backup."); } },
    unknown: { get badge() { return T("확인 불가", "Unknown"); }, get headline() { return T("Windows 상태는 정상으로 보이지만, 수명·오류 같은 상세 값을 읽지 못해 판단할 수 없습니다.", "Windows reports the disk as normal, but details such as wear and errors could not be read, so no judgement can be made."); } },
  };

  // 종합 판정(위험/주의)을 만든 디스크 목록. 어느 디스크 때문인지 판정 카드에서 바로 보여 주기 위해 사용한다.
  function whichDisks(res) {
    if (res.level !== "danger" && res.level !== "caution") return { disks: [], viaEvents: false, viaMissing: false };
    const disks = res.disks.filter((d) => d.level === res.level).map((d) => ({ model: d.model, kind: d.kind, sizeGB: d.sizeGB, diskNumber: d.diskNumber, drives: d.drives }));
    // 디스크별 판정이 아니라 디스크를 특정하지 못한 이벤트 신호가 원인일 수 있다.
    const viaEvents = !!(res.events && res.events.checked && res.events.level === res.level);
    const viaMissing = (res.disconnected || []).some((g) => g.level === res.level);
    return { disks, viaEvents, viaMissing };
  }

  // ── 교체·백업 준비 계산 ────────────────────────────────────────────
  // Windows는 용량을 GiB(2^30)로 보고하지만 제품 용량 표기는 10진 GB다. 같은 기준으로 비교하려고 환산한다.
  const GIB_TO_GB = 1.073741824;
  const SSD_SIZES_GB = [250, 500, 1000, 2000, 4000];
  const KEEP_USAGE = 0.7;       // 교체 SSD는 사용량이 70% 이하가 되도록(80%를 넘으면 쓰기 속도가 떨어지는 SSD가 많음)
  const BACKUP_MARGIN = 1.2;    // 백업용 저장장치는 사용량보다 20% 여유

  // 위험·주의 디스크마다 지금 쓰는 용량과 권장 교체 용량, 백업에 필요한 용량을 계산한다. 대상 디스크가 없으면 null.
  function replacementPlan(res) {
    const targets = res.disks.filter((d) => d.level === "danger" || d.level === "caution");
    if (!targets.length) return null;
    const volByDrive = {};
    res.volumes.forEach((v) => { volByDrive[text(v.drive).toUpperCase()] = v; });
    const items = targets.map((d) => {
      const vols = (d.drives || []).map((x) => volByDrive[x]).filter(Boolean);
      const usedGiB = vols.length ? vols.reduce((n, v) => n + Math.max(0, v.sizeGB - v.freeGB), 0) : null;
      const usedGB = usedGiB === null ? null : Math.round(usedGiB * GIB_TO_GB);
      let recommendedGB = null;
      let tooBig = false;
      if (usedGB !== null) {
        recommendedGB = SSD_SIZES_GB.find((c) => usedGB / c <= KEEP_USAGE) || null;
        tooBig = recommendedGB === null;
      }
      return { model: d.model, kind: d.kind, bus: d.bus, drives: d.drives, sizeGB: d.sizeGB, usedGB, recommendedGB, tooBig, volumesKnown: vols.length > 0 };
    });
    let backupUsedGB = null;
    let basis = "disks";
    if (items.every((i) => i.usedGB !== null)) backupUsedGB = items.reduce((n, i) => n + i.usedGB, 0);
    else if (res.volumes.length) {
      // 디스크와 드라이브가 연결되지 않으면 전체 드라이브의 사용량으로 대신한다.
      backupUsedGB = Math.round(res.volumes.reduce((n, v) => n + Math.max(0, v.sizeGB - v.freeGB), 0) * GIB_TO_GB);
      basis = "all";
    }
    return { items, basis, backupUsedGB, backupSuggestGB: backupUsedGB === null ? null : Math.ceil((backupUsedGB * BACKUP_MARGIN) / 10) * 10 };
  }

  // 상담·게시글에 붙여넣기 좋은 짧은 요약 텍스트. 일련번호 같은 식별 정보는 넣지 않는다.
  const levelText = (lv) => ({ danger: T("위험", "Danger"), caution: T("주의", "Caution"), good: T("양호", "Good"), unknown: T("확인 불가", "Unknown") }[lv]);
  function buildSummary(res, dateText) {
    const spaceLow = res.spaceLevel && res.spaceLevel !== "good";
    const lines = [T(`[SSD·디스크 건강 판정] ${dateText} · 디스크 상태: ${levelText(res.level)}${spaceLow ? " · 여유 공간: 부족" : ""}`, `[SSD / disk health check] ${dateText} · Disk health: ${levelText(res.level)}${spaceLow ? " · Free space: low" : ""}`)];
    res.disks.forEach((d) => {
      const head = `- ${d.model} (${d.kind}${d.sizeGB ? ` ${d.sizeGB}GB` : ""}${d.drives && d.drives.length ? `, ${d.drives.join(" ")}` : ""}): ${levelText(d.level)}`;
      const why = d.findings.filter((f) => f.level !== "info").map((f) => f.title);
      lines.push(why.length ? `${head} — ${why.join("; ")}` : head);
    });
    res.volumes.forEach((v) => {
      lines.push(T(`- ${v.drive} 여유 ${v.pct}% (${v.freeGB}GB / ${v.sizeGB}GB)${v.level === "good" ? "" : v.level === "critical" ? " — 공간 매우 부족" : " — 공간 부족"}`, `- ${v.drive} free ${v.pct}% (${v.freeGB}GB / ${v.sizeGB}GB)${v.level === "good" ? "" : v.level === "critical" ? " — very low space" : " — low space"}`));
    });
    if (res.disconnected && res.disconnected.length) {
      lines.push(T(`- 현재 연결되어 있지 않은 디스크: ${res.disconnected.map((g) => g.title).join("; ")}`, `- Disks not currently connected: ${res.disconnected.map((g) => g.title).join("; ")}`));
    }
    if (res.events && res.events.checked && res.events.level !== "good") {
      lines.push(T(`- 이벤트 로그(최근 30일): ${res.events.findings.filter((f) => f.level !== "info").map((f) => f.title).join("; ")}`, `- Event log (last 30 days): ${res.events.findings.filter((f) => f.level !== "info").map((f) => f.title).join("; ")}`));
    }
    lines.push(T("(참고용 판정) https://itsvc.co.kr/ssd-health-check.html", "(Reference-only verdict) https://itsvc.co.kr/en/ssd-health-check.html"));
    return lines.join("\n");
  }

  // 점검 전에 결과 화면을 미리 볼 수 있는 예시 데이터(가상의 값).
  const SAMPLES = {
    danger: {
      get label() { return T("위험 예시", "Danger example"); },
      get data() { return {
        disks: [
          { model: T("예시 NVMe SSD 500GB", "Example NVMe SSD 500GB"), mediaType: "SSD", busType: "NVMe", diskNumber: 0, health: "Warning", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 93, temperature: 52, powerOnHours: 21500, readErrorsUncorrected: 2, writeErrorsUncorrected: 0 },
          { model: T("예시 SATA SSD 1TB", "Example SATA SSD 1TB"), mediaType: "SSD", busType: "SATA", diskNumber: 1, health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["D:"], wear: 12, temperature: 38, powerOnHours: 8200, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
        ],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 24 }, { drive: "D:", sizeGB: 931, freeGB: 610 }],
        eventsChecked: true,
        events: [{ provider: "disk", id: 7, disk: "0", count: 4, last: "2026-11-02" }, { provider: "stornvme", id: 129, disk: "", count: 9, last: "2026-11-02" }, { provider: "Ntfs", id: 55, disk: "", count: 1, last: "2026-10-30" }],
      }; },
    },
    caution: {
      get label() { return T("주의 예시", "Caution example"); },
      get data() { return {
        disks: [{ model: T("예시 SATA SSD 500GB", "Example SATA SSD 500GB"), mediaType: "SSD", busType: "SATA", diskNumber: 0, health: "Healthy", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 74, temperature: 46, powerOnHours: 30100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0, reallocatedSectors: 12 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 38 }],
        eventsChecked: true,
        events: [{ provider: "stornvme", id: 129, disk: "", count: 2, last: "2026-10-28" }, { provider: "disk", id: 7, disk: "3", count: 1, last: "2026-10-27" }],
      }; },
    },
    space: {
      get label() { return T("공간 부족 예시", "Low-space example"); },
      get data() { return {
        disks: [{ model: T("예시 NVMe SSD 1TB", "Example NVMe SSD 1TB"), mediaType: "SSD", busType: "NVMe", diskNumber: 0, health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["C:", "D:"], wear: 6, temperature: 42, powerOnHours: 4100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 14 }, { drive: "D:", sizeGB: 465, freeGB: 300 }],
        eventsChecked: true,
        events: [],
      }; },
    },
    good: {
      get label() { return T("양호 예시", "Good example"); },
      get data() { return {
        disks: [
          { model: T("예시 NVMe SSD 1TB", "Example NVMe SSD 1TB"), mediaType: "SSD", busType: "NVMe", health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["C:"], wear: 4, temperature: 41, powerOnHours: 3200, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
          { model: T("예시 HDD 2TB", "Example HDD 2TB"), mediaType: "HDD", busType: "SATA", health: "Healthy", operational: "OK", sizeGB: 2000, drives: ["D:"], wear: null, temperature: 35, powerOnHours: 15000, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
        ],
        volumes: [{ drive: "C:", sizeGB: 931, freeGB: 520 }, { drive: "D:", sizeGB: 1863, freeGB: 1400 }],
      }; },
    },
  };

  const api = { setLang, baseOf, evaluate, normalize, evaluateDisk, evaluateVolume, decodeHashPayload, buildSummary, whichDisks, replacementPlan, estimateReplacement, compareWithHistory, updateHistory, EVENT_INFO, SAMPLES, VERDICT, encodeHashPayload };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.SsdHealthEngine = api;
})();
