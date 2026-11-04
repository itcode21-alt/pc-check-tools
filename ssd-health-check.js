(() => {
  // 저장장치 건강 판정 — 브라우저 안에서만 계산한다(서버 전송 없음).
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
      if (!cleaned) throw new Error("붙여넣은 내용이 비어 있습니다.");
      try { data = JSON.parse(cleaned); }
      catch (e) { throw new Error("JSON 형식이 아닙니다. 점검 파일이나 방법 2의 명령 결과를 그대로 붙여넣어 주세요."); }
    }
    if (Array.isArray(data)) data = { disks: data };
    if (!data || typeof data !== "object") throw new Error("읽을 수 있는 디스크 정보가 없습니다.");
    const disks = asList(data.disks).filter((d) => d && typeof d === "object");
    const volumes = asList(data.volumes).filter((v) => v && typeof v === "object");
    const events = asList(data.events).filter((e) => e && typeof e === "object");
    // events 값이 없으면(구버전 데이터) 이벤트 판정을 하지 않는다. 있으면 비어 있어도 '기록 없음'으로 본다.
    const hasEventData = data.events !== undefined || data.eventsChecked !== undefined;
    const eventsChecked = hasEventData && data.eventsChecked !== false;
    if (!disks.length && !volumes.length) throw new Error("디스크 정보(disks)나 볼륨 정보(volumes)를 찾지 못했습니다.");
    return { disks, volumes, events, hasEventData, eventsChecked };
  }

  const isSsd = (d) => text(d.mediaType).toLowerCase() === "ssd" || text(d.busType).toLowerCase() === "nvme";

  // ── 이벤트 로그 신호 ─────────────────────────────────────────────
  // [종류, 이름]. 종류: data(불량 블록·하드웨어 입출력 오류) / predicted(고장 예측) / controller(컨트롤러 오류·재설정)
  //                    / io(입출력 재시도) / removed(갑작스러운 제거) / fs(파일 시스템 손상)
  const EVENT_INFO = {
    "disk|7": ["data", "Disk 7 · 불량 블록"],
    "disk|154": ["data", "Disk 154 · 하드웨어 오류로 입출력 실패"],
    "disk|52": ["predicted", "Disk 52 · 저장장치 고장 예측 경고"],
    "disk|9": ["controller", "Disk 9 · 컨트롤러 오류"],
    "disk|11": ["controller", "Disk 11 · 컨트롤러 오류"],
    "stornvme|11": ["controller", "stornvme 11 · NVMe 컨트롤러 오류"],
    "stornvme|129": ["controller", "stornvme 129 · NVMe 장치 재설정"],
    "storahci|129": ["controller", "storahci 129 · 저장장치 재설정"],
    "disk|51": ["io", "Disk 51 · 페이징 입출력 오류"],
    "disk|153": ["io", "Disk 153 · 입출력 재시도"],
    "disk|157": ["removed", "Disk 157 · 디스크가 갑자기 제거됨"],
    "ntfs|50": ["fs", "Ntfs 50 · 지연된 쓰기 실패"],
    "ntfs|55": ["fs", "Ntfs 55 · 파일 시스템 손상"],
    "ntfs|57": ["fs", "Ntfs 57 · 메타데이터 쓰기 실패"],
    "ntfs|140": ["fs", "Ntfs 140 · 트랜잭션 로그 플러시 실패"],
  };

  function normEvent(e) {
    const provider = text(e.provider).toLowerCase().replace(/^microsoft-windows-/, "");
    const id = num(e.id);
    const info = EVENT_INFO[`${provider}|${id}`];
    const count = num(e.count);
    if (!info || id === null || !count || count < 1) return null;
    const disk = text(e.disk).replace(/\D/g, "");
    return { provider, id, kind: info[0], label: info[1], count, last: text(e.last), disk, href: `event-${provider}-${id}.html` };
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
      findings.push({ level: lv, title, detail, href: top ? top.href : undefined, hrefLabel: top ? "해설 보기" : undefined });
      level = worse(level, lv);
    };
    const list = (kind) => mine.filter((e) => e.kind === kind).map((e) => `${e.label} ${e.count}회${e.last ? `(최근 ${e.last})` : ""}`).join(", ");

    if (c.predicted >= 1) add("danger", `저장장치 고장 예측 경고 ${c.predicted}회`, `${list("predicted")}. 디스크가 스스로 곧 고장 날 수 있다고 보고한 기록입니다. 지금 백업하고 교체를 준비하세요.`, "predicted");
    if (c.data >= 3) add("danger", `불량 블록·하드웨어 입출력 오류가 반복됩니다 (${c.data}회)`, `${list("data")}. 같은 오류가 반복되면 디스크 불량 가능성이 큽니다. 백업을 먼저 하세요.`, "data");
    else if (c.data >= 1) add("caution", `불량 블록·하드웨어 입출력 오류 기록 ${c.data}회`, `${list("data")}. 한두 번이라도 기록됐다면 백업해 두고 늘어나는지 지켜보세요.`, "data");

    if (c.controller >= 3 && (a.data + a.fs + a.predicted) >= 1) {
      add("danger", `컨트롤러·연결 이상과 데이터 오류가 함께 기록됐습니다 (컨트롤러 ${c.controller}회)`, `${list("controller")}. 컨트롤러·연결 문제와 데이터 오류가 같이 나타나면 갑자기 디스크가 사라지거나 데이터가 손상될 위험이 큽니다. 백업을 먼저 하고, 케이블·슬롯·펌웨어를 점검하세요.`, "controller");
    } else if (c.controller >= 3) {
      add("caution", `컨트롤러·연결 관련 기록이 반복됩니다 (${c.controller}회)`, `${list("controller")}. 디스크 자체보다 케이블·슬롯·전원 절약 설정·드라이버·펌웨어 문제일 수 있습니다. 반복되면 백업해 두고 점검하세요.`, "controller");
    } else if (c.controller >= 1) {
      add("info", `컨트롤러·연결 관련 기록 ${c.controller}회`, `${list("controller")}. 드물게 한두 번은 흔히 있지만, 늘어나는지 지켜보세요.`, "controller");
    }

    if (c.fs >= 3 || (c.fs >= 1 && a.data >= 1)) add("danger", `파일 시스템 손상 기록이 있습니다 (${c.fs}회)`, `${list("fs")}. ${a.data >= 1 ? "불량 블록·하드웨어 오류와 함께 기록돼 저장장치 문제일 가능성이 있습니다. " : ""}디스크 검사 전에 백업을 먼저 하세요.`, "fs");
    else if (c.fs >= 1) add("caution", `파일 시스템 오류 기록 ${c.fs}회`, `${list("fs")}. 비정상 종료 뒤에도 남을 수 있습니다. 백업 후 상태를 확인하세요.`, "fs");

    if (c.io >= 5) add("caution", `입출력 재시도·오류가 잦습니다 (${c.io}회)`, `${list("io")}. 케이블·포트 접촉, 외장 장치 전원, 디스크 상태를 점검하세요.`, "io");
    else if (c.io >= 1) add("info", `입출력 재시도·오류 기록 ${c.io}회`, `${list("io")}.`, "io");

    if (c.removed >= 3) add("caution", `디스크 연결이 자주 끊깁니다 (${c.removed}회)`, `${list("removed")}. 외장 장치를 안전 제거 없이 뽑은 경우가 아니라면 케이블·포트·전원을 점검하세요.`, "removed");
    else if (c.removed >= 1) add("info", `디스크가 갑자기 제거된 기록 ${c.removed}회`, `${list("removed")}. 외장 장치를 안전 제거 없이 뽑으면 남습니다.`, "removed");
    return { level, findings };
  }

  // ── 교체 시점 추정 ───────────────────────────────────────────────
  const monthsText = (m) => (m >= 24 ? `약 ${Math.round(m / 12)}년` : m >= 1 ? `약 ${Math.round(m)}개월` : "1개월 미만");
  function estimateReplacement(wear, hours) {
    if (wear === null || hours === null || wear < EST_MIN_WEAR || hours < EST_MIN_HOURS || wear >= WEAR_DANGER) return null;
    const hoursLeft = ((WEAR_DANGER - wear) / wear) * hours;
    const m8 = hoursLeft / 8 / 30;
    const m24 = hoursLeft / 24 / 30;
    return { hoursLeft: Math.round(hoursLeft), monthsAt8h: m8, monthsAtAlways: m24, soon: m8 <= EST_SOON_MONTHS,
      title: `교체 시점 추정: 수명 소모 ${WEAR_DANGER}%까지 하루 8시간 사용 시 ${monthsText(m8)}, 상시 켜 두면 ${monthsText(m24)}`,
      detail: `지금까지의 속도(수명 소모 ${wear}% / 전원 켜진 ${hours.toLocaleString("ko-KR")}시간)가 이어지면 앞으로 전원이 켜진 시간으로 약 ${Math.round(hoursLeft).toLocaleString("ko-KR")}시간 뒤입니다. 사용량이 늘거나 줄면 달라지는 대략적인 추정이며, 수명 소모가 항상 일정한 속도로 진행되지는 않습니다.` };
  }

  const keyOf = (d, model, sizeGB) => [model, sizeGB === null ? "" : sizeGB, text(d.busType).toLowerCase(), num(d.diskNumber) === null ? "" : num(d.diskNumber)].join("|");

  function evaluateDisk(d, myEvents, allCounts) {
    const model = text(d.model) || "이름 없는 디스크";
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
      add("danger", `Windows 디스크 상태가 '${health}'입니다`, "Windows가 이 디스크를 정상으로 보지 않습니다. 가장 먼저 백업하세요.");
    }
    if (/predictive/i.test(oper)) {
      add("danger", "고장 예측(Predictive Failure) 상태입니다", "디스크가 스스로 곧 고장 날 가능성을 보고한 상태입니다. 지금 백업하고 교체를 준비하세요.");
    } else if (oper && !/^ok$/i.test(oper)) {
      add("caution", `동작 상태가 '${oper}'입니다`, "연결·전원 문제이거나 디스크 이상일 수 있습니다. 케이블·포트를 확인하고 상태가 반복되면 백업하세요.");
    }
    if (cdi === "bad") add("danger", "CrystalDiskInfo 상태가 '나쁨'입니다", "프로그램이 이 디스크를 위험으로 판단했습니다. 지금 백업하고 교체를 준비하세요.");
    else if (cdi === "caution") add("caution", "CrystalDiskInfo 상태가 '주의'입니다", "프로그램이 주의를 표시했습니다. 어떤 항목이 노란색인지 확인하고 백업해 두세요.");
    if ((readErr || 0) > 0 || (writeErr || 0) > 0) {
      add("danger", "복구되지 않은 읽기/쓰기 오류가 기록돼 있습니다", `읽기 오류 ${readErr || 0}건, 쓰기 오류 ${writeErr || 0}건. 저장장치가 데이터를 제대로 읽거나 쓰지 못한 기록입니다.`);
    }
    if ((pending || 0) > 0 || (uncorr || 0) > 0) {
      add("danger", `읽기 불안정·복구 불가능 섹터가 있습니다 (대기 ${pending || 0}개, 복구 불가 ${uncorr || 0}개)`, "읽지 못하는 불안정한 영역이 있다는 뜻으로, 교체가 필요한 경우가 많습니다. 지금 백업하세요.");
    }
    if (realloc !== null && realloc > 0) {
      if (realloc >= REALLOCATED_DANGER) add("danger", `재할당된 섹터 ${realloc.toLocaleString("ko-KR")}개`, "불량 영역이 많이 대체됐습니다. 지금 백업하고 교체를 준비하세요.");
      else add("caution", `재할당된 섹터 ${realloc.toLocaleString("ko-KR")}개`, "불량 영역이 예비 영역으로 대체된 기록입니다. 값이 늘어나는지 정기적으로 확인하고 백업해 두세요.");
    }
    if (critWarn !== null && critWarn > 0) {
      add("danger", `NVMe 치명적 경고(Critical Warning)가 0이 아닙니다 (값 ${critWarn})`, "NVMe가 예비 공간 부족·과열·미디어 오류·읽기 전용 전환 등을 보고한 상태입니다. 지금 백업하세요.");
    }
    if (spare !== null) {
      const thr = spareThr !== null ? spareThr : SPARE_DEFAULT_THRESHOLD;
      if (spare <= thr) add("danger", `사용 가능한 예비 영역 ${spare}% (기준 ${thr}% 이하)`, "교체용 예비 영역이 거의 없습니다. 지금 백업하고 교체를 준비하세요.");
      else if (spare <= SPARE_CAUTION_PCT) add("caution", `사용 가능한 예비 영역 ${spare}%`, "예비 영역이 줄고 있습니다. 교체를 계획하고 백업해 두세요.");
    }
    if (mediaErr !== null && mediaErr > 0) {
      add("danger", `미디어 및 데이터 무결성 오류 ${mediaErr.toLocaleString("ko-KR")}건`, "저장된 데이터를 읽는 과정에서 무결성 오류가 보고됐습니다. 지금 백업하세요.");
    }
    if (wear !== null) {
      if (wear >= WEAR_DANGER) add("danger", `수명 소모 ${wear}%`, "SSD 수명이 거의 다 소진됐습니다. 갑자기 쓰기 전용·읽기 전용 상태로 바뀌거나 인식이 안 될 수 있습니다.");
      else if (wear >= WEAR_CAUTION) add("caution", `수명 소모 ${wear}%`, "수명의 상당 부분을 사용했습니다. 교체를 계획하고 중요한 자료는 따로 백업해 두세요.");
    }
    if (temp !== null && temp >= (hdd ? TEMP_LIMIT_HDD : TEMP_LIMIT_SSD)) {
      add("caution", `온도 ${temp}℃`, "방열·통풍을 점검하세요. 과열이 이어지면 속도 저하와 오류가 늘 수 있습니다.");
    }
    if (hours !== null && hours >= AGE_INFO_HOURS) {
      findings.push({ level: "info", title: `사용 시간 ${hours.toLocaleString("ko-KR")}시간`, detail: "오래 사용한 디스크입니다(약 4년 이상 상시 사용 수준). 수치가 정상이어도 백업은 따로 두는 편이 안전합니다." });
    }
    const lat = [["읽기", num(d.readLatencyMax)], ["쓰기", num(d.writeLatencyMax)], ["플러시", num(d.flushLatencyMax)]].filter(([, v]) => v !== null && v >= LATENCY_INFO);
    if (lat.length) {
      findings.push({ level: "info", title: `최대 지연 값이 큽니다 (${lat.map(([n, v]) => `${n} ${v.toLocaleString("ko-KR")}`).join(", ")})`, detail: "디스크가 한때 오래 응답하지 않았을 수 있습니다. 값의 단위는 드라이버에 따라 다를 수 있어 참고만 하세요. 멈춤 증상이 있다면 컨트롤러·연결 점검이 필요합니다." });
    }
    const est = estimateReplacement(wear, hours);
    if (est) {
      // 추정은 대략적인 값이라 판정 등급은 바꾸지 않고 참고 정보로만 보여 준다.
      findings.push({ level: "info", title: est.title + (est.soon ? " — 교체를 미리 계획하세요" : ""), detail: est.detail, href: "ssd-tbw-calculator.html", hrefLabel: "SSD 수명(TBW) 계산기" });
    }
    if (myEvents && myEvents.length) {
      // 다른 디스크·시스템 전체 기록과 함께 봐야 하는 판정(컨트롤러 + 데이터 오류 등)을 위해 전체 이벤트도 넘긴다.
      const ev = eventFindings(myEvents, allCounts ? allCounts.list : myEvents);
      ev.findings.forEach((f) => { findings.push(f); level = worse(level, f.level); });
    }

    const detailRead = wear !== null || temp !== null || readErr !== null || writeErr !== null || realloc !== null || pending !== null || uncorr !== null || spare !== null || critWarn !== null || mediaErr !== null || cdi !== "";
    if (!detailRead) {
      findings.push({ level: "info", title: "SMART 상세(수명·온도·오류)를 읽지 못했습니다", detail: "관리자 권한 PowerShell에서 다시 실행해야 읽히는 경우가 많습니다. 상세 값 없이는 '양호'라고 말할 수 없습니다." });
      if (level === "good") level = "unknown";
    }
    const sizeGB = num(d.sizeGB);
    return { model, key: keyOf(d, model, sizeGB), kind: hdd ? "HDD" : isSsd(d) ? "SSD" : (text(d.mediaType) || "디스크"), sizeGB, diskNumber: num(d.diskNumber), drives, level, findings, detailRead,
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
    let title = `${drive} 여유 공간 ${pct}% (${free}GB / ${size}GB)`;
    let detail = "";
    if (pct < FREE_DANGER_PCT) {
      level = "critical";
      detail = "공간이 거의 가득 찼습니다. 디스크 고장과는 다른 문제지만, 이대로면 파일 저장·업데이트가 실패하고 속도가 크게 느려질 수 있습니다(SSD는 빈 공간이 부족하면 쓰기 성능이 떨어집니다). 불필요한 파일을 정리하거나 큰 파일을 다른 드라이브로 옮기세요.";
    } else if (pct < FREE_CAUTION_PCT) {
      level = "low";
      detail = "공간이 부족해지고 있습니다. 디스크 상태와는 별개의 문제이고, 정리하면 해결됩니다. 10% 이상 확보하면 속도와 안정성에 유리합니다.";
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
    const sysEvents = evAll.filter((e) => e.disk === "" || !diskNumbers.includes(Number(e.disk)));
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
    let spaceLevel = "good";
    volumeResults.forEach((v) => { if (v.level === "critical" || (v.level === "low" && spaceLevel === "good")) spaceLevel = v.level; });
    return { level, spaceLevel, disks: diskResults, volumes: volumeResults, events: eventsResult };
  }

  // ── 이전 결과와 비교(이 브라우저에 저장된 기록 사용) ─────────────────────
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
            disk.findings.push({ level: "caution", title: `지난 점검(${prev.d})보다 수명 소모가 빠르게 늘었습니다 (+${delta}%p, 30일 환산 약 ${per30}%p)`, detail: "짧은 기간에 수명 소모가 크게 늘었습니다. 대용량 쓰기 작업이 있었는지 확인하고, 계속되면 교체를 앞당겨 계획하세요." });
            disk.level = worse(disk.level, "caution");
          } else notes.push(`수명 소모 +${delta}%p`);
        } else notes.push("수명 소모 변화 없음");
      }
      const errNow = (m.readErr || 0) + (m.writeErr || 0);
      const errPrev = (prev.rErr || 0) + (prev.wErr || 0);
      if (errNow > errPrev) {
        disk.findings.push({ level: "danger", title: `복구되지 않은 오류가 지난 점검(${prev.d})보다 늘었습니다 (${errPrev}건 → ${errNow}건)`, detail: "오류가 계속 늘고 있습니다. 지금 백업하고 교체를 준비하세요." });
        disk.level = worse(disk.level, "danger");
      } else if (errNow > 0) notes.push(`오류 ${errNow}건 그대로`);
      if (notes.length) disk.findings.push({ level: "info", title: `지난 점검(${prev.d})과 비교`, detail: `${notes.join(" · ")} (${days}일 사이).` });
    });
    let level = "good";
    res.disks.forEach((d) => { level = worse(level, d.level); });
    if (res.events) level = worse(level, res.events.level);
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
      list.push({ d: today, wear: m.wear, hours: m.hours, rErr: m.readErr, wErr: m.writeErr });
      h.disks[disk.key] = list.sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-HISTORY_KEEP);
    });
    return h;
  }

  // 점검 파일이 주소의 #d= 뒤에 담아 보낸 값(gzip + base64url)을 JSON 문자열로 푼다. 해당 없으면 null.
  async function decodeHashPayload(hash) {
    if (!/^#d=/.test(hash || "")) return null;
    const m = /^#d=([A-Za-z0-9_-]+)$/.exec(hash);
    if (!m) throw new Error("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요.");
    if (typeof DecompressionStream === "undefined") throw new Error("이 브라우저는 점검 파일의 결과를 읽지 못합니다. 아래 '명령을 직접 실행' 방법을 이용하세요.");
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    let bytes;
    try { bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); }
    catch (e) { throw new Error("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요."); }
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return await new Response(stream).text();
    } catch (e) { throw new Error("결과 값을 풀지 못했습니다. 점검 파일을 다시 실행해 주세요."); }
  }

  const VERDICT = {
    danger: { badge: "위험", headline: "이 저장장치는 곧 고장 날 수 있습니다. 지금 바로 중요한 자료를 백업하고 교체를 준비하세요." },
    caution: { badge: "주의", headline: "당장 고장 난다는 뜻은 아니지만 디스크 상태에서 신경 써야 할 항목이 있습니다. 백업을 먼저 확인하세요." },
    good: { badge: "양호", headline: "확인된 수치에서는 큰 이상이 보이지 않습니다. 그래도 백업은 따로 두세요." },
    unknown: { badge: "확인 불가", headline: "Windows 상태는 정상으로 보이지만, 수명·오류 같은 상세 값을 읽지 못해 판단할 수 없습니다." },
  };

  // 상담·게시글에 붙여넣기 좋은 짧은 요약 텍스트. 일련번호 같은 식별 정보는 넣지 않는다.
  const LEVEL_TEXT = { danger: "위험", caution: "주의", good: "양호", unknown: "확인 불가" };
  function buildSummary(res, dateText) {
    const lines = [`[SSD·디스크 건강 판정] ${dateText} · 디스크 상태: ${LEVEL_TEXT[res.level]}${res.spaceLevel && res.spaceLevel !== "good" ? " · 여유 공간: 부족" : ""}`];
    res.disks.forEach((d) => {
      const head = `- ${d.model} (${d.kind}${d.sizeGB ? ` ${d.sizeGB}GB` : ""}${d.drives && d.drives.length ? `, ${d.drives.join(" ")}` : ""}): ${LEVEL_TEXT[d.level]}`;
      const why = d.findings.filter((f) => f.level !== "info").map((f) => f.title);
      lines.push(why.length ? `${head} — ${why.join("; ")}` : head);
    });
    res.volumes.forEach((v) => {
      lines.push(`- ${v.drive} 여유 ${v.pct}% (${v.freeGB}GB / ${v.sizeGB}GB)${v.level === "good" ? "" : v.level === "critical" ? " — 공간 매우 부족" : " — 공간 부족"}`);
    });
    if (res.events && res.events.checked && res.events.level !== "good") {
      lines.push(`- 이벤트 로그(최근 30일): ${res.events.findings.filter((f) => f.level !== "info").map((f) => f.title).join("; ")}`);
    }
    lines.push("(참고용 판정) https://itsvc.co.kr/ssd-health-check.html");
    return lines.join("\n");
  }

  // 점검 전에 결과 화면을 미리 볼 수 있는 예시 데이터(가상의 값).
  const SAMPLES = {
    danger: {
      label: "위험 예시",
      data: {
        disks: [
          { model: "예시 NVMe SSD 500GB", mediaType: "SSD", busType: "NVMe", diskNumber: 0, health: "Warning", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 93, temperature: 52, powerOnHours: 21500, readErrorsUncorrected: 2, writeErrorsUncorrected: 0 },
          { model: "예시 SATA SSD 1TB", mediaType: "SSD", busType: "SATA", diskNumber: 1, health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["D:"], wear: 12, temperature: 38, powerOnHours: 8200, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
        ],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 24 }, { drive: "D:", sizeGB: 931, freeGB: 610 }],
        eventsChecked: true,
        events: [{ provider: "disk", id: 7, disk: "0", count: 4, last: "2026-11-02" }, { provider: "stornvme", id: 129, disk: "", count: 9, last: "2026-11-02" }, { provider: "Ntfs", id: 55, disk: "", count: 1, last: "2026-10-30" }],
      },
    },
    caution: {
      label: "주의 예시",
      data: {
        disks: [{ model: "예시 SATA SSD 500GB", mediaType: "SSD", busType: "SATA", diskNumber: 0, health: "Healthy", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 74, temperature: 46, powerOnHours: 30100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0, reallocatedSectors: 12 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 38 }],
        eventsChecked: true,
        events: [{ provider: "stornvme", id: 129, disk: "", count: 2, last: "2026-10-28" }],
      },
    },
    space: {
      label: "공간 부족 예시",
      data: {
        disks: [{ model: "예시 NVMe SSD 1TB", mediaType: "SSD", busType: "NVMe", diskNumber: 0, health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["C:", "D:"], wear: 6, temperature: 42, powerOnHours: 4100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 14 }, { drive: "D:", sizeGB: 465, freeGB: 300 }],
        eventsChecked: true,
        events: [],
      },
    },
    good: {
      label: "양호 예시",
      data: {
        disks: [
          { model: "예시 NVMe SSD 1TB", mediaType: "SSD", busType: "NVMe", health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["C:"], wear: 4, temperature: 41, powerOnHours: 3200, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
          { model: "예시 HDD 2TB", mediaType: "HDD", busType: "SATA", health: "Healthy", operational: "OK", sizeGB: 2000, drives: ["D:"], wear: null, temperature: 35, powerOnHours: 15000, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
        ],
        volumes: [{ drive: "C:", sizeGB: 931, freeGB: 520 }, { drive: "D:", sizeGB: 1863, freeGB: 1400 }],
      },
    },
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { evaluate, normalize, evaluateDisk, evaluateVolume, decodeHashPayload, buildSummary, estimateReplacement, compareWithHistory, updateHistory, EVENT_INFO, SAMPLES, VERDICT };
    return;
  }

  // ── 화면 ───────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LEVEL_LABEL = { danger: "위험", caution: "주의", good: "양호", unknown: "확인 불가", info: "참고", low: "공간 부족", critical: "공간 매우 부족" };

  // 방법 2의 한 줄 명령(점검 파일과 같은 내용). 이벤트 로그는 최근 30일 저장장치 관련 기록만 종류별로 센다.
  const COMMAND = [
    String.raw`$d = Get-PhysicalDisk | ForEach-Object { $r = $_ | Get-StorageReliabilityCounter; $l = @(Get-Partition -DiskNumber $_.DeviceId -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { "$($_.DriveLetter):" }); [pscustomobject]@{ diskNumber = $_.DeviceId; drives = $l; model = $_.FriendlyName; mediaType = "$($_.MediaType)"; busType = "$($_.BusType)"; health = "$($_.HealthStatus)"; operational = "$($_.OperationalStatus)"; sizeGB = [math]::Round($_.Size / 1GB); wear = $r.Wear; temperature = $r.Temperature; powerOnHours = $r.PowerOnHours; readErrorsUncorrected = $r.ReadErrorsUncorrected; writeErrorsUncorrected = $r.WriteErrorsUncorrected; readLatencyMax = $r.ReadLatencyMax; writeLatencyMax = $r.WriteLatencyMax; flushLatencyMax = $r.FlushLatencyMax } }`,
    String.raw`$v = Get-Volume | Where-Object DriveLetter | ForEach-Object { [pscustomobject]@{ drive = "$($_.DriveLetter):"; sizeGB = [math]::Round($_.Size / 1GB, 1); freeGB = [math]::Round($_.SizeRemaining / 1GB, 1) } }`,
    String.raw`$ev = @(); $ok = $true; try { $t = (Get-Date).AddDays(-30).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.000Z'); $x = "*[System[TimeCreated[@SystemTime>='$t'] and ((Provider[@Name='disk'] and (EventID=7 or EventID=9 or EventID=11 or EventID=51 or EventID=52 or EventID=153 or EventID=154 or EventID=157)) or (Provider[@Name='stornvme'] and (EventID=11 or EventID=129)) or (Provider[@Name='storahci'] and EventID=129) or ((Provider[@Name='Ntfs'] or Provider[@Name='Microsoft-Windows-Ntfs']) and (EventID=50 or EventID=55 or EventID=57 or EventID=140)))]]"; $ev = @(Get-WinEvent -LogName System -FilterXPath $x -MaxEvents 3000 -ErrorAction Stop | Group-Object { "$($_.ProviderName)|$($_.Id)|" + [regex]::Match("$($_.Message)", 'Harddisk(\d+)').Groups[1].Value } | ForEach-Object { $p = $_.Name -split '\|'; [pscustomobject]@{ provider = $p[0]; id = [int]$p[1]; disk = $p[2]; count = $_.Count; last = $_.Group[0].TimeCreated.ToString('yyyy-MM-dd') } }) } catch { if ($_.FullyQualifiedErrorId -notlike 'NoMatchingEventsFound*') { $ok = $false } }`,
    String.raw`[pscustomobject]@{ disks = @($d); volumes = @($v); events = @($ev); eventsChecked = $ok } | ConvertTo-Json -Depth 4 | Set-Clipboard`,
  ].join("; ");

  // 이전 결과 비교용 기록(이 브라우저에만 저장, 서버로 보내지 않음)
  const HISTORY_KEY = "itsvc-ssd-health-v1";
  const HISTORY_OFF_KEY = "itsvc-ssd-health-history-off";
  const historyEnabled = () => { try { return localStorage.getItem(HISTORY_OFF_KEY) !== "1"; } catch (e) { return false; } };
  const loadHistory = () => { try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "null"); } catch (e) { return null; } };
  const saveHistory = (h) => { try { localStorage.setItem(HISTORY_KEY, JSON.stringify(h)); return true; } catch (e) { return false; } };
  const todayISO = () => { const d = new Date(); const pad = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };

  let lastSummary = "";
  const KAKAO_URL = "https://pf.kakao.com/_xgExbWX/chat";

  function renderResult(res, opts) {
    const sample = !!(opts && opts.sample);
    const v = VERDICT[res.level];
    const box = $("shc-result");
    const disks = res.disks.map((d) => `
      <div class="shc-item shc-${d.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${d.level}">${LEVEL_LABEL[d.level]}</span> <strong>${esc(d.model)}</strong> <span class="muted">${esc(d.kind)}${d.sizeGB ? ` · ${esc(d.sizeGB)}GB` : ""}</span>${d.drives ? ` <span class="shc-drives">${d.drives.length ? `드라이브 ${esc(d.drives.join(", "))}` : "드라이브 문자 없음"}</span>` : ""}</p>
        ${d.findings.length ? `<ul class="mini-list">${d.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || "해설 보기")}</a>` : ""}</li>`).join("")}</ul>` : `<p class="muted">Windows 상태, 수명, 온도, 오류 기록에서 이상이 보이지 않습니다.</p>`}
      </div>`).join("");
    const vols = res.volumes.map((x) => `
      <div class="shc-item shc-${x.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${x.level}">${LEVEL_LABEL[x.level]}</span> <strong>${esc(x.title)}</strong>${x.disks && x.disks.length ? ` <span class="muted">· ${esc(x.disks.join(", "))}</span>` : ""}</p>
        ${x.detail ? `<p>${esc(x.detail)}${x.level !== "good" ? ' <a href="windows-c-drive-storage-full.html">C 드라이브 용량 부족 해결</a>' : ""}</p>` : ""}
      </div>`).join("");

    const ev = res.events;
    const evCard = !ev ? "" : `
      <div class="card"><h3>저장장치 연결·컨트롤러 신호 <span class="muted" style="font-size:.85rem;font-weight:400">· 이벤트 로그 최근 30일, 간접 신호입니다</span></h3>
        ${!ev.checked ? `<p><span class="shc-pill shc-pill-unknown">확인 불가</span> 이벤트 로그를 읽지 못했습니다. 관리자 권한으로 다시 실행해 보세요.</p>` : `
        <p class="shc-item-head"><span class="shc-pill shc-pill-${ev.level}">${LEVEL_LABEL[ev.level]}</span> ${ev.items.length ? "디스크를 특정하지 못한 저장장치 관련 기록이 있습니다." : ev.total ? "디스크별 기록은 위의 저장장치별 결과에 표시했습니다. 그 밖의 기록은 없습니다." : "최근 30일 동안 저장장치 연결·컨트롤러·파일 시스템 관련 오류 기록이 없습니다."}</p>
        ${ev.findings.length ? `<ul class="mini-list">${ev.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || "해설 보기")}</a>` : ""}</li>`).join("")}</ul>` : ""}
        ${ev.items.length ? `<ul class="mini-list">${ev.items.map((e) => `<li>${esc(e.label)} — ${esc(e.count)}회${e.last ? ` (최근 ${esc(e.last)})` : ""} <a href="${esc(e.href)}">해설 보기</a></li>`).join("")}</ul>` : ""}
        <p class="muted">이벤트 기록은 컨트롤러·케이블·드라이버 문제도 함께 반영하는 간접 신호입니다. 디스크가 멀쩡해도 남을 수 있고, 반대로 없다고 안전하다는 뜻도 아닙니다.</p>`}
      </div>`;
    const dangerDisks = res.disks.filter((d) => d.level === "danger");
    const dangerWho = dangerDisks.length
      ? `<p><strong>위험 판정 디스크:</strong> ${dangerDisks.map((d) => `${esc(d.model)}${d.drives && d.drives.length ? ` (${esc(d.drives.join(", "))} 드라이브)` : ""}`).join(" · ")} — ${dangerDisks.some((d) => d.drives && d.drives.length) ? "이 드라이브에 있는 자료부터 백업하세요." : "이 디스크에 있는 자료부터 백업하세요."}</p>`
      : (ev && ev.checked && ev.level === "danger" ? `<p><strong>이벤트 로그가 위험 신호를 보였습니다.</strong> 특정 디스크를 가리키지 못한 기록이라, 중요한 자료는 모든 저장장치에서 먼저 백업하세요.</p>` : "");
    const dangerSteps = res.level === "danger" ? `
      <div class="card shc-steps">
        <h3>지금 이 순서로 하세요</h3>
        ${dangerWho}
        <ol class="mini-list">
          <li><strong>새 프로그램 설치·대용량 복사·조각 모음·디스크 검사(chkdsk)는 멈추세요.</strong> 불안정한 저장장치에 쓰기를 더하면 상태가 더 나빠질 수 있습니다.</li>
          <li><strong>중요한 자료부터 외장 드라이브나 클라우드로 복사하세요.</strong> 문서·사진·작업 파일을 먼저, 프로그램과 게임은 나중에 다시 받을 수 있으니 뒤로 미룹니다.</li>
          <li>복사 중 오류가 나는 파일은 건너뛰고 나머지를 먼저 옮기세요. 같은 파일에서 계속 멈추면 억지로 반복하지 마세요.</li>
          <li>백업이 끝나면 교체용 저장장치를 준비하세요. <a href="ssd-upgrade-guide.html">SSD 교체·추가 설치 가이드</a> · <a href="backup-storage-calculator.html">백업 저장공간 계산기</a></li>
          <li>이미 인식이 오락가락하거나 파일이 열리지 않는다면 전원을 껐다 켜는 시도를 반복하지 말고 <a href="contact.html">수리·데이터 상담</a>을 먼저 받으세요.</li>
        </ol>
      </div>` : "";

    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    lastSummary = buildSummary(res, `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    const hist = opts && opts.historyInfo ? opts.historyInfo : null;
    const toolbar = sample ? "" : `
      <div class="card shc-tools">
        <div class="button-row">
          <button class="btn secondary" type="button" id="shc-copy-summary">결과 요약 복사</button>
          ${res.level === "danger" || res.level === "caution" ? `<a class="btn secondary" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 상담하기</a>` : ""}
        </div>
        <p class="muted" id="shc-copy-msg">요약을 복사해 상담이나 게시글에 붙여넣을 수 있습니다. 디스크 모델명과 수치만 들어가고 일련번호 같은 식별 정보는 포함되지 않습니다.</p>
        ${hist ? `<hr style="border:0;border-top:1px solid rgba(128,128,128,.25);margin:10px 0">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="shc-history-on" ${hist.enabled ? "checked" : ""}> 이 브라우저에 결과를 저장해 다음 점검과 비교하기</label>
        <p class="muted" id="shc-history-msg" style="margin:6px 0 0">${hist.enabled ? (hist.saved ? (hist.hadPrev ? "지난 점검과 비교한 내용은 디스크별 결과에 표시했습니다." : "이전 기록이 없어 이번 결과를 저장했습니다. 다음에 점검하면 변화를 비교해 보여 드립니다.") : "브라우저가 저장을 허용하지 않아 기록하지 못했습니다.") : "저장하지 않았습니다. 체크하면 다음 점검부터 비교합니다."} 모델명과 수치만 이 브라우저에 저장되고 서버로 전송되지 않습니다.
          <button class="btn secondary" type="button" id="shc-history-clear" style="padding:2px 10px;margin-left:6px">저장된 기록 지우기</button></p>` : ""}
      </div>`;
    const sampleBanner = sample ? `<div class="card shc-sample"><strong>예시 화면입니다.</strong> 실제 내 PC의 결과가 아니라 가상의 값으로 만든 미리보기입니다. 내 PC 결과를 보려면 위의 방법 1 또는 2를 이용하세요.</div>` : "";
    box.innerHTML = `
      ${sampleBanner}
      <div class="card shc-verdict shc-${res.level}">
        <p><span class="shc-pill shc-pill-${res.level}">${v.badge}</span></p>
        <h3>${esc(v.headline)}</h3>
        ${res.spaceLevel && res.spaceLevel !== "good" ? `<p class="shc-space-note">※ 일부 드라이브의 <strong>여유 공간이 부족</strong>합니다. 이것은 디스크 상태(고장 여부)와는 <strong>별개의 문제</strong>입니다. 디스크가 정상이어도 공간이 부족하면 속도 저하나 저장·업데이트 실패가 생길 수 있고, 파일을 정리하면 해결됩니다. 아래 "드라이브 여유 공간"을 확인하세요.</p>` : ""}
      </div>
      ${toolbar}
      ${dangerSteps}
      <div class="card"><h3>저장장치별 결과</h3>${disks || '<p class="muted">디스크 정보가 없습니다.</p>'}</div>
      ${evCard}
      ${vols ? `<div class="card"><h3>드라이브 여유 공간 <span class="muted" style="font-size:.85rem;font-weight:400">· 디스크 건강과는 별개입니다</span></h3>${vols}</div>` : ""}
      <p class="muted">SMART 값이 정상이어도 SSD는 컨트롤러·펌웨어 문제로 예고 없이 고장 날 수 있습니다. 이 판정은 참고용이며, 중요한 자료는 결과와 상관없이 다른 저장장치에 따로 백업해 두세요.
        더 자세한 확인은 <a href="ssd-smart-health-guide.html">SSD SMART·건강 상태 확인 방법</a>, 이벤트 로그까지 함께 보려면 <a href="minidump-analyzer.html">크래시·이벤트 로그 분석기</a>를 이용하세요.</p>`;
    box.hidden = false;
    const copyBtn = $("shc-copy-summary");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const msg = $("shc-copy-msg");
        try { await navigator.clipboard.writeText(lastSummary); copyBtn.textContent = "복사됨 ✓"; }
        catch (e) {
          // 클립보드 권한이 없으면 선택할 수 있게 텍스트를 보여 준다.
          msg.innerHTML = `<textarea class="code-input" readonly rows="6" style="width:100%;box-sizing:border-box">${esc(lastSummary)}</textarea>`;
          msg.querySelector("textarea").select();
        }
        setTimeout(() => { copyBtn.textContent = "결과 요약 복사"; }, 2000);
      });
    }
    const histOn = $("shc-history-on");
    if (histOn) {
      histOn.addEventListener("change", () => {
        try { if (histOn.checked) localStorage.removeItem(HISTORY_OFF_KEY); else localStorage.setItem(HISTORY_OFF_KEY, "1"); } catch (e) { /* 저장소를 못 쓰면 무시 */ }
        $("shc-history-msg").firstChild.textContent = histOn.checked ? "다음 점검부터 결과를 저장해 비교합니다. " : "다음 점검부터 저장하지 않습니다. ";
      });
      $("shc-history-clear").addEventListener("click", (e) => {
        try { localStorage.removeItem(HISTORY_KEY); } catch (err) { /* 무시 */ }
        e.currentTarget.textContent = "지웠습니다 ✓";
      });
    }
    box.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showError(msg) {
    const e = $("shc-error");
    e.textContent = "⚠ " + msg;
    e.hidden = false;
    $("shc-result").hidden = true;
  }

  function run(raw, opts) {
    $("shc-error").hidden = true;
    try {
      const res = evaluate(raw);
      const o = Object.assign({}, opts);
      // 예시·직접 입력 결과는 기록하지 않는다. 점검 결과만 이전 기록과 비교하고 저장한다.
      if (!o.sample && !o.manual) {
        if (historyEnabled()) {
          const today = todayISO();
          const prev = loadHistory();
          const hadPrev = !!(prev && prev.disks && res.disks.some((d) => (prev.disks[d.key] || []).some((e) => e.d < today)));
          compareWithHistory(res, prev, today);
          o.historyInfo = { enabled: true, hadPrev, saved: saveHistory(updateHistory(prev, res, today)) };
        } else o.historyInfo = { enabled: false };
      }
      renderResult(res, o);
    } catch (e) { showError(e.message || "분석 중 오류가 발생했습니다."); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("shc-command").textContent = COMMAND;
    $("shc-copy").addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      try { await navigator.clipboard.writeText(COMMAND); btn.textContent = "복사됨 ✓"; }
      catch (e) { btn.textContent = "직접 선택해 복사하세요"; }
      setTimeout(() => { btn.textContent = "명령 복사"; }, 2000);
    });
    document.querySelectorAll("[data-shc-sample]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sample = SAMPLES[btn.getAttribute("data-shc-sample")];
        if (sample) run(sample.data, { sample: true });
      });
    });
    const cdiForm = $("shc-cdi-form");
    if (cdiForm) {
      cdiForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        const field = (id) => { const v = $(id).value.trim(); return v === "" ? null : Number(v); };
        const ids = ["health", "temp", "hours", "realloc", "pending", "uncorr", "spare", "spare-thr", "crit", "media"];
        const vals = {};
        for (const id of ids) {
          vals[id] = field("shc-cdi-" + id);
          if (vals[id] !== null && (!Number.isFinite(vals[id]) || vals[id] < 0)) { showError("입력한 값은 0 이상의 숫자여야 합니다."); return; }
        }
        const status = $("shc-cdi-status").value;
        if (!status && ids.every((id) => vals[id] === null)) { showError("CrystalDiskInfo에서 확인한 값을 하나 이상 입력해 주세요."); return; }
        if (vals.health !== null && vals.health > 100) { showError("건강 상태는 0~100% 사이로 입력해 주세요."); return; }
        const type = $("shc-cdi-type").value;
        const drive = $("shc-cdi-drive").value.trim().toUpperCase().replace(/[^A-Z]/g, "")[0];
        const disk = {
          model: $("shc-cdi-model").value.trim() || "CrystalDiskInfo 입력 값",
          mediaType: type === "hdd" ? "HDD" : "SSD", busType: type === "nvme" ? "NVMe" : "SATA", health: "Healthy", operational: "OK", sizeGB: null,
          drives: drive ? [drive + ":"] : undefined, cdiStatus: status || undefined, healthPercent: vals.health, temperature: vals.temp, powerOnHours: vals.hours,
          reallocatedSectors: vals.realloc, pendingSectors: vals.pending, uncorrectableSectors: vals.uncorr, availableSpare: vals.spare, availableSpareThreshold: vals["spare-thr"],
          criticalWarning: vals.crit, mediaErrors: vals.media,
        };
        run({ disks: [disk] }, { manual: true });
      });
    }
    $("shc-analyze").addEventListener("click", () => run($("shc-input").value));
    $("shc-clear").addEventListener("click", () => { $("shc-input").value = ""; $("shc-result").hidden = true; $("shc-error").hidden = true; });

    // 붙여넣는 순간 JSON처럼 보이면 바로 판정한다(버튼을 따로 누르지 않아도 됨).
    $("shc-input").addEventListener("paste", () => {
      setTimeout(() => { const v = $("shc-input").value.trim(); if (v.startsWith("{") || v.startsWith("[")) run(v); }, 0);
    });
    $("shc-paste").addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      try {
        const t = await navigator.clipboard.readText();
        $("shc-input").value = t;
        run(t);
      } catch (e) {
        showError("브라우저가 클립보드 읽기를 허용하지 않았습니다. 아래 입력칸을 클릭하고 Ctrl+V로 붙여넣어 주세요.");
        $("shc-input").focus();
      }
      btn.blur();
    });

    $("shc-file").addEventListener("change", async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { showError("파일이 너무 큽니다. 수집 스크립트가 만든 hardware.json을 선택해 주세요."); return; }
      run(await file.text());
      ev.target.value = "";
    });

    // 점검 파일(.bat) 내용을 펼쳐서 직접 확인할 수 있게 한다.
    const batBox = $("shc-bat-source");
    if (batBox) {
      batBox.addEventListener("toggle", async () => {
        const pre = $("shc-bat-text");
        if (!batBox.open || pre.dataset.loaded) return;
        try {
          const res = await fetch("assets/itsvc-disk-check.bat", { cache: "no-store" });
          if (!res.ok) throw new Error();
          pre.textContent = await res.text();
          pre.dataset.loaded = "1";
        } catch (e) { pre.textContent = "내용을 불러오지 못했습니다. 파일을 내려받아 메모장으로 열어 확인할 수 있습니다."; }
      });
    }

    // 점검 파일이 열어 준 주소(#d=...)면 결과를 바로 판정한다.
    decodeHashPayload(location.hash).then((json) => {
      if (json === null) return;
      $("shc-input").value = json;
      history.replaceState(null, "", location.pathname + location.search);
      run(json);
    }).catch((e) => showError(e.message));
  });
})();
