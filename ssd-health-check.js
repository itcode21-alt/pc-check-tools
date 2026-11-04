(() => {
  // 저장장치 건강 판정 — 브라우저 안에서만 계산한다(서버 전송 없음).
  // 입력: 관리자 PowerShell 명령의 JSON 결과 또는 수집 스크립트의 hardware.json
  //   { disks: [{ model, mediaType, busType, health, operational, sizeGB, wear, temperature,
  //               powerOnHours, readErrorsUncorrected, writeErrorsUncorrected }],
  //     volumes: [{ drive, sizeGB, freeGB }] }
  // 판정 등급: danger(위험) > caution(주의) > good(양호) / unknown(상세 확인 불가)

  const WEAR_DANGER = 90;
  const WEAR_CAUTION = 70;
  const TEMP_LIMIT_SSD = 70;
  const TEMP_LIMIT_HDD = 55;
  const FREE_DANGER_PCT = 5;
  const FREE_CAUTION_PCT = 10;
  const AGE_INFO_HOURS = 35000;

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
    if (!disks.length && !volumes.length) throw new Error("디스크 정보(disks)나 볼륨 정보(volumes)를 찾지 못했습니다.");
    return { disks, volumes };
  }

  const isSsd = (d) => text(d.mediaType).toLowerCase() === "ssd" || text(d.busType).toLowerCase() === "nvme";

  function evaluateDisk(d) {
    const model = text(d.model) || "이름 없는 디스크";
    const media = text(d.mediaType).toLowerCase();
    const hdd = media === "hdd";
    const health = text(d.health);
    const oper = text(d.operational);
    const wear = num(d.wear);
    const temp = num(d.temperature);
    const hours = num(d.powerOnHours);
    const readErr = num(d.readErrorsUncorrected);
    const writeErr = num(d.writeErrorsUncorrected);
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
    if ((readErr || 0) > 0 || (writeErr || 0) > 0) {
      add("danger", "복구되지 않은 읽기/쓰기 오류가 기록돼 있습니다", `읽기 오류 ${readErr || 0}건, 쓰기 오류 ${writeErr || 0}건. 저장장치가 데이터를 제대로 읽거나 쓰지 못한 기록입니다.`);
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

    const detailRead = wear !== null || temp !== null || readErr !== null || writeErr !== null;
    if (!detailRead) {
      findings.push({ level: "info", title: "SMART 상세(수명·온도·오류)를 읽지 못했습니다", detail: "관리자 권한 PowerShell에서 다시 실행해야 읽히는 경우가 많습니다. 상세 값 없이는 '양호'라고 말할 수 없습니다." });
      if (level === "good") level = "unknown";
    }
    return { model, kind: hdd ? "HDD" : isSsd(d) ? "SSD" : (text(d.mediaType) || "디스크"), sizeGB: num(d.sizeGB), drives, level, findings, detailRead };
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
    const { disks, volumes } = normalize(raw);
    const diskResults = disks.map(evaluateDisk);
    // 드라이브는 C → D → E … 알파벳 순서로 보여 준다.
    const volumeResults = volumes.map(evaluateVolume).filter(Boolean).sort((a, b) => a.drive.localeCompare(b.drive, "en"));
    volumeResults.forEach((v) => { v.disks = diskResults.filter((d) => d.drives && d.drives.includes(text(v.drive).toUpperCase())).map((d) => d.model); });
    // level = 디스크 건강 등급(위험/주의/양호/확인 불가). 여유 공간은 건강 등급을 바꾸지 않고 spaceLevel로 따로 알린다.
    let level = "good";
    diskResults.forEach((d) => { level = worse(level, d.level); });
    let spaceLevel = "good";
    volumeResults.forEach((v) => { if (v.level === "critical" || (v.level === "low" && spaceLevel === "good")) spaceLevel = v.level; });
    return { level, spaceLevel, disks: diskResults, volumes: volumeResults };
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
    lines.push("(참고용 판정) https://itsvc.co.kr/ssd-health-check.html");
    return lines.join("\n");
  }

  // 점검 전에 결과 화면을 미리 볼 수 있는 예시 데이터(가상의 값).
  const SAMPLES = {
    danger: {
      label: "위험 예시",
      data: {
        disks: [
          { model: "예시 NVMe SSD 500GB", mediaType: "SSD", busType: "NVMe", health: "Warning", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 93, temperature: 52, powerOnHours: 21500, readErrorsUncorrected: 2, writeErrorsUncorrected: 0 },
          { model: "예시 SATA SSD 1TB", mediaType: "SSD", busType: "SATA", health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["D:"], wear: 12, temperature: 38, powerOnHours: 8200, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 },
        ],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 24 }, { drive: "D:", sizeGB: 931, freeGB: 610 }],
      },
    },
    caution: {
      label: "주의 예시",
      data: {
        disks: [{ model: "예시 SATA SSD 500GB", mediaType: "SSD", busType: "SATA", health: "Healthy", operational: "OK", sizeGB: 500, drives: ["C:"], wear: 74, temperature: 46, powerOnHours: 30100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 38 }],
      },
    },
    space: {
      label: "공간 부족 예시",
      data: {
        disks: [{ model: "예시 NVMe SSD 1TB", mediaType: "SSD", busType: "NVMe", health: "Healthy", operational: "OK", sizeGB: 1000, drives: ["C:", "D:"], wear: 6, temperature: 42, powerOnHours: 4100, readErrorsUncorrected: 0, writeErrorsUncorrected: 0 }],
        volumes: [{ drive: "C:", sizeGB: 465, freeGB: 14 }, { drive: "D:", sizeGB: 465, freeGB: 300 }],
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
    module.exports = { evaluate, normalize, evaluateDisk, evaluateVolume, decodeHashPayload, buildSummary, SAMPLES, VERDICT };
    return;
  }

  // ── 화면 ───────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LEVEL_LABEL = { danger: "위험", caution: "주의", good: "양호", unknown: "확인 불가", info: "참고", low: "공간 부족", critical: "공간 매우 부족" };

  const COMMAND = [
    "$d = Get-PhysicalDisk | ForEach-Object { $r = $_ | Get-StorageReliabilityCounter; $l = @(Get-Partition -DiskNumber $_.DeviceId -ErrorAction SilentlyContinue | Where-Object DriveLetter | ForEach-Object { \"$($_.DriveLetter):\" }); [pscustomobject]@{ diskNumber = $_.DeviceId; drives = $l; model = $_.FriendlyName; mediaType = \"$($_.MediaType)\"; busType = \"$($_.BusType)\"; health = \"$($_.HealthStatus)\"; operational = \"$($_.OperationalStatus)\"; sizeGB = [math]::Round($_.Size / 1GB); wear = $r.Wear; temperature = $r.Temperature; powerOnHours = $r.PowerOnHours; readErrorsUncorrected = $r.ReadErrorsUncorrected; writeErrorsUncorrected = $r.WriteErrorsUncorrected } }",
    "$v = Get-Volume | Where-Object DriveLetter | ForEach-Object { [pscustomobject]@{ drive = \"$($_.DriveLetter):\"; sizeGB = [math]::Round($_.Size / 1GB, 1); freeGB = [math]::Round($_.SizeRemaining / 1GB, 1) } }",
    "[pscustomobject]@{ disks = @($d); volumes = @($v) } | ConvertTo-Json -Depth 4 | Set-Clipboard",
  ].join("; ");

  let lastSummary = "";
  const KAKAO_URL = "https://pf.kakao.com/_xgExbWX/chat";

  function renderResult(res, opts) {
    const sample = !!(opts && opts.sample);
    const v = VERDICT[res.level];
    const box = $("shc-result");
    const disks = res.disks.map((d) => `
      <div class="shc-item shc-${d.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${d.level}">${LEVEL_LABEL[d.level]}</span> <strong>${esc(d.model)}</strong> <span class="muted">${esc(d.kind)}${d.sizeGB ? ` · ${esc(d.sizeGB)}GB` : ""}</span>${d.drives ? ` <span class="shc-drives">${d.drives.length ? `드라이브 ${esc(d.drives.join(", "))}` : "드라이브 문자 없음"}</span>` : ""}</p>
        ${d.findings.length ? `<ul class="mini-list">${d.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}</li>`).join("")}</ul>` : `<p class="muted">Windows 상태, 수명, 온도, 오류 기록에서 이상이 보이지 않습니다.</p>`}
      </div>`).join("");
    const vols = res.volumes.map((x) => `
      <div class="shc-item shc-${x.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${x.level}">${LEVEL_LABEL[x.level]}</span> <strong>${esc(x.title)}</strong>${x.disks && x.disks.length ? ` <span class="muted">· ${esc(x.disks.join(", "))}</span>` : ""}</p>
        ${x.detail ? `<p>${esc(x.detail)}${x.level !== "good" ? ' <a href="windows-c-drive-storage-full.html">C 드라이브 용량 부족 해결</a>' : ""}</p>` : ""}
      </div>`).join("");

    const dangerDisks = res.disks.filter((d) => d.level === "danger");
    const dangerWho = dangerDisks.length
      ? `<p><strong>위험 판정 디스크:</strong> ${dangerDisks.map((d) => `${esc(d.model)}${d.drives && d.drives.length ? ` (${esc(d.drives.join(", "))} 드라이브)` : ""}`).join(" · ")} — ${dangerDisks.some((d) => d.drives && d.drives.length) ? "이 드라이브에 있는 자료부터 백업하세요." : "이 디스크에 있는 자료부터 백업하세요."}</p>`
      : "";
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
    const toolbar = sample ? "" : `
      <div class="card shc-tools">
        <div class="button-row">
          <button class="btn secondary" type="button" id="shc-copy-summary">결과 요약 복사</button>
          ${res.level === "danger" || res.level === "caution" ? `<a class="btn secondary" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 상담하기</a>` : ""}
        </div>
        <p class="muted" id="shc-copy-msg">요약을 복사해 상담이나 게시글에 붙여넣을 수 있습니다. 디스크 모델명과 수치만 들어가고 일련번호 같은 식별 정보는 포함되지 않습니다.</p>
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
    try { renderResult(evaluate(raw), opts); }
    catch (e) { showError(e.message || "분석 중 오류가 발생했습니다."); }
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
