(() => {
  // 저장장치 건강 판정 페이지 화면. 판정 규칙은 ssd-health-engine.js(공용)에 있다.
  const { evaluate, decodeHashPayload, buildSummary, whichDisks, compareWithHistory, updateHistory, baseOf, SAMPLES, VERDICT } = window.SsdHealthEngine;

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
        <p class="shc-item-head"><span class="shc-pill shc-pill-${d.level}">${LEVEL_LABEL[d.level]}</span> <strong>${esc(d.model)}</strong> <span class="muted">${esc(d.kind)}${d.sizeGB ? ` · ${esc(d.sizeGB)}GB` : ""}</span>${d.drives ? ` <span class="shc-drives">${d.drives.length ? `드라이브 ${esc(d.drives.join(", "))}` : "드라이브 문자 없음"}</span>` : ""}${d.disconnected ? ` <span class="shc-pill shc-pill-unknown">연결되어 있지 않음</span>` : ""}</p>
        ${d.findings.length ? `<ul class="mini-list">${d.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || "해설 보기")}</a>` : ""}</li>`).join("")}</ul>` : `<p class="muted">Windows 상태, 수명, 온도, 오류 기록에서 이상이 보이지 않습니다.</p>`}
      </div>`).join("");
    const vols = res.volumes.map((x) => `
      <div class="shc-item shc-${x.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${x.level}">${LEVEL_LABEL[x.level]}</span> <strong>${esc(x.title)}</strong>${x.disks && x.disks.length ? ` <span class="muted">· ${esc(x.disks.join(", "))}</span>` : ""}</p>
        ${x.detail ? `<p>${esc(x.detail)}${x.level !== "good" ? ' <a href="windows-c-drive-storage-full.html">C 드라이브 용량 부족 해결</a>' : ""}</p>` : ""}
      </div>`).join("");

    const gone = res.disconnected || [];
    const goneCard = !gone.length ? "" : `
      <div class="card"><h3>현재 연결되어 있지 않은 디스크 <span class="muted" style="font-size:.85rem;font-weight:400">· 지난 점검 기록과 이벤트 로그 기준</span></h3>
        ${gone.map((g) => `
        <div class="shc-item shc-${g.level}">
          <p class="shc-item-head"><span class="shc-pill shc-pill-${g.level === "good" ? "unknown" : g.level}">연결되어 있지 않음</span> <strong>${esc(g.title)}</strong></p>
          <p>${esc(g.detail)}</p>
          ${g.findings && g.findings.length ? `<ul class="mini-list">${g.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || "해설 보기")}</a>` : ""}</li>`).join("")}</ul>` : ""}
          ${g.source === "history" ? `<button class="btn secondary" type="button" data-shc-forget="${esc(g.baseKey)}">이 디스크는 더 이상 알리지 않기</button>` : ""}
        </div>`).join("")}
      </div>`;
    const ev = res.events;
    const evCard = !ev ? "" : `
      <div class="card"><h3>저장장치 연결·컨트롤러 신호 <span class="muted" style="font-size:.85rem;font-weight:400">· 이벤트 로그 최근 30일, 간접 신호입니다</span></h3>
        ${!ev.checked ? `<p><span class="shc-pill shc-pill-unknown">확인 불가</span> 이벤트 로그를 읽지 못했습니다. 관리자 권한으로 다시 실행해 보세요.</p>` : `
        <p class="shc-item-head"><span class="shc-pill shc-pill-${ev.level}">${LEVEL_LABEL[ev.level]}</span> ${ev.items.length ? "디스크를 특정하지 못한 저장장치 관련 기록이 있습니다." : ev.total ? "디스크별 기록은 위의 저장장치별 결과에 표시했습니다. 그 밖의 기록은 없습니다." : "최근 30일 동안 저장장치 연결·컨트롤러·파일 시스템 관련 오류 기록이 없습니다."}</p>
        ${ev.findings.length ? `<ul class="mini-list">${ev.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || "해설 보기")}</a>` : ""}</li>`).join("")}</ul>` : ""}
        ${ev.items.length ? `<ul class="mini-list">${ev.items.map((e) => `<li>${esc(e.label)} — ${esc(e.count)}회${e.last ? ` (최근 ${esc(e.last)})` : ""} <a href="${esc(e.href)}">해설 보기</a></li>`).join("")}</ul>` : ""}
        <p class="muted">이벤트 기록은 컨트롤러·케이블·드라이버 문제도 함께 반영하는 간접 신호입니다. 디스크가 멀쩡해도 남을 수 있고, 반대로 없다고 안전하다는 뜻도 아닙니다.</p>`}
      </div>`;
    const who = whichDisks(res);
    const diskTag = (d) => `<span class="shc-which-item"><strong>${esc(d.model)}</strong><span class="muted"> ${esc(d.kind)}${d.sizeGB ? ` ${esc(d.sizeGB)}GB` : ""}</span>${d.drives && d.drives.length ? ` <span class="shc-drives">${esc(d.drives.join(", "))} 드라이브</span>` : d.diskNumber !== null && d.diskNumber !== undefined ? ` <span class="shc-drives">디스크 ${esc(d.diskNumber)}</span>` : ""}</span>`;
    const whichLine = who.disks.length || who.viaEvents || who.viaMissing
      ? `<p class="shc-which"><span class="muted">${res.level === "danger" ? "위험 판정 디스크" : "주의 판정 디스크"}</span> ${who.disks.map(diskTag).join("")}${who.viaEvents ? `<span class="shc-which-item">이벤트 로그 신호 <span class="muted">(특정 디스크를 가리키지 못한 기록 — 아래 "저장장치 연결·컨트롤러 신호" 참고)</span></span>` : ""}${who.viaMissing ? `<span class="shc-which-item">현재 연결되어 있지 않은 디스크 <span class="muted">(아래 참고)</span></span>` : ""}</p>`
      : "";
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
        ${whichLine}
        ${res.spaceLevel && res.spaceLevel !== "good" ? `<p class="shc-space-note">※ 일부 드라이브의 <strong>여유 공간이 부족</strong>합니다. 이것은 디스크 상태(고장 여부)와는 <strong>별개의 문제</strong>입니다. 디스크가 정상이어도 공간이 부족하면 속도 저하나 저장·업데이트 실패가 생길 수 있고, 파일을 정리하면 해결됩니다. 아래 "드라이브 여유 공간"을 확인하세요.</p>` : ""}
      </div>
      ${toolbar}
      ${dangerSteps}
      <div class="card"><h3>저장장치별 결과</h3>${disks || '<p class="muted">디스크 정보가 없습니다.</p>'}</div>
      ${goneCard}
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
    box.querySelectorAll("[data-shc-forget]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const base = btn.getAttribute("data-shc-forget");
        const h = loadHistory();
        if (h && h.disks) { Object.keys(h.disks).forEach((k) => { if (baseOf(k) === base) delete h.disks[k]; }); saveHistory(h); }
        btn.textContent = "더 이상 알리지 않습니다 ✓";
        btn.disabled = true;
      });
    });
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
