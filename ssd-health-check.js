(() => {
  // 저장장치 건강 판정 페이지 화면. 판정 규칙은 ssd-health-engine.js(공용)에 있다.
  const { setLang, evaluate, decodeHashPayload, buildSummary, whichDisks, replacementPlan, compareWithHistory, updateHistory, baseOf, SAMPLES, VERDICT } = window.SsdHealthEngine;
  // 영문판 페이지(<html lang="en">)는 같은 스크립트를 영어로 쓴다. 한국어 전용 페이지로 가는 링크는 영문판에서 뺀다.
  const EN = document.documentElement.lang === "en";
  if (EN) setLang("en");
  const T = (ko, en) => (EN ? en : ko);
  const nf = (n) => Number(n).toLocaleString(EN ? "en-US" : "ko-KR");

  // ── 화면 ───────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const LEVEL_LABEL = { danger: T("위험", "Danger"), caution: T("주의", "Caution"), good: T("양호", "Good"), unknown: T("확인 불가", "Unknown"), info: T("참고", "Info"), low: T("공간 부족", "Low space"), critical: T("공간 매우 부족", "Very low space") };

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
        <p class="shc-item-head"><span class="shc-pill shc-pill-${d.level}">${LEVEL_LABEL[d.level]}</span> <strong>${esc(d.model)}</strong> <span class="muted">${esc(d.kind)}${d.sizeGB ? ` · ${esc(d.sizeGB)}GB` : ""}</span>${d.drives ? ` <span class="shc-drives">${d.drives.length ? T(`드라이브 ${esc(d.drives.join(", "))}`, `drive ${esc(d.drives.join(", "))}`) : T("드라이브 문자 없음", "no drive letter")}</span>` : ""}${d.disconnected ? ` <span class="shc-pill shc-pill-unknown">${T("연결되어 있지 않음", "Not connected")}</span>` : ""}</p>
        ${d.findings.length ? `<ul class="mini-list">${d.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || T("해설 보기", "Read the explanation"))}</a>` : ""}</li>`).join("")}</ul>` : `<p class="muted">${T("Windows 상태, 수명, 온도, 오류 기록에서 이상이 보이지 않습니다.", "No problems show in the Windows status, wear, temperature or error records.")}</p>`}
      </div>`).join("");
    const vols = res.volumes.map((x) => `
      <div class="shc-item shc-${x.level}">
        <p class="shc-item-head"><span class="shc-pill shc-pill-${x.level}">${LEVEL_LABEL[x.level]}</span> <strong>${esc(x.title)}</strong>${x.disks && x.disks.length ? ` <span class="muted">· ${esc(x.disks.join(", "))}</span>` : ""}</p>
        ${x.detail ? `<p>${esc(x.detail)}${x.level !== "good" && !EN ? ' <a href="windows-c-drive-storage-full.html">C 드라이브 용량 부족 해결</a>' : ""}</p>` : ""}
      </div>`).join("");

    const gone = res.disconnected || [];
    const goneCard = !gone.length ? "" : `
      <div class="card"><h3>${T("현재 연결되어 있지 않은 디스크", "Disks not currently connected")} <span class="muted" style="font-size:.85rem;font-weight:400">${T("· 지난 점검 기록과 이벤트 로그 기준", "· based on the previous check and the event log")}</span></h3>
        ${gone.map((g) => `
        <div class="shc-item shc-${g.level}">
          <p class="shc-item-head"><span class="shc-pill shc-pill-${g.level === "good" ? "unknown" : g.level}">${T("연결되어 있지 않음", "Not connected")}</span> <strong>${esc(g.title)}</strong></p>
          <p>${esc(g.detail)}</p>
          ${g.findings && g.findings.length ? `<ul class="mini-list">${g.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || T("해설 보기", "Read the explanation"))}</a>` : ""}</li>`).join("")}</ul>` : ""}
          ${g.source === "history" ? `<button class="btn secondary" type="button" data-shc-forget="${esc(g.baseKey)}">${T("이 디스크는 더 이상 알리지 않기", "Stop notifying me about this disk")}</button>` : ""}
        </div>`).join("")}
      </div>`;
    const ev = res.events;
    const evCard = !ev ? "" : `
      <div class="card"><h3>${T("저장장치 연결·컨트롤러 신호", "Storage connection / controller signals")} <span class="muted" style="font-size:.85rem;font-weight:400">${T("· 이벤트 로그 최근 30일, 간접 신호입니다", "· event log, last 30 days; indirect signals")}</span></h3>
        ${!ev.checked ? `<p><span class="shc-pill shc-pill-unknown">${T("확인 불가", "Unknown")}</span> ${T("이벤트 로그를 읽지 못했습니다. 관리자 권한으로 다시 실행해 보세요.", "Could not read the event log. Try running it again with administrator rights.")}</p>` : `
        <p class="shc-item-head"><span class="shc-pill shc-pill-${ev.level}">${LEVEL_LABEL[ev.level]}</span> ${ev.items.length ? T("디스크를 특정하지 못한 저장장치 관련 기록이 있습니다.", "There are storage-related records that could not be tied to a specific disk.") : ev.total ? T("디스크별 기록은 위의 저장장치별 결과에 표시했습니다. 그 밖의 기록은 없습니다.", "Per-disk records are shown in the per-device results above. There are no other records.") : T("최근 30일 동안 저장장치 연결·컨트롤러·파일 시스템 관련 오류 기록이 없습니다.", "There are no storage connection, controller or file-system error records in the last 30 days.")}</p>
        ${ev.findings.length ? `<ul class="mini-list">${ev.findings.map((f) => `<li><strong>${esc(f.title)}</strong> — ${esc(f.detail)}${f.href ? ` <a href="${esc(f.href)}">${esc(f.hrefLabel || T("해설 보기", "Read the explanation"))}</a>` : ""}</li>`).join("")}</ul>` : ""}
        ${ev.items.length ? `<ul class="mini-list">${ev.items.map((e) => `<li>${esc(e.label)} — ${T(`${esc(e.count)}회${e.last ? ` (최근 ${esc(e.last)})` : ""}`, `×${esc(e.count)}${e.last ? ` (latest ${esc(e.last)})` : ""}`)} <a href="${esc(e.href)}">${T("해설 보기", "Read the explanation")}</a></li>`).join("")}</ul>` : ""}
        <p class="muted">${T("이벤트 기록은 컨트롤러·케이블·드라이버 문제도 함께 반영하는 간접 신호입니다. 디스크가 멀쩡해도 남을 수 있고, 반대로 없다고 안전하다는 뜻도 아닙니다.", "Event records are an indirect signal that also reflects controller, cable and driver problems. They can appear even when the disk is fine, and the absence of records does not mean the disk is safe.")}</p>`}
      </div>`;
    const who = whichDisks(res);
    const diskTag = (d) => `<span class="shc-which-item"><strong>${esc(d.model)}</strong><span class="muted"> ${esc(d.kind)}${d.sizeGB ? ` ${esc(d.sizeGB)}GB` : ""}</span>${d.drives && d.drives.length ? ` <span class="shc-drives">${T(`${esc(d.drives.join(", "))} 드라이브`, `drive ${esc(d.drives.join(", "))}`)}</span>` : d.diskNumber !== null && d.diskNumber !== undefined ? ` <span class="shc-drives">${T("디스크", "Disk")} ${esc(d.diskNumber)}</span>` : ""}</span>`;
    const whichLine = who.disks.length || who.viaEvents || who.viaMissing
      ? `<p class="shc-which"><span class="muted">${res.level === "danger" ? T("위험 판정 디스크", "Disks judged Danger") : T("주의 판정 디스크", "Disks judged Caution")}</span> ${who.disks.map(diskTag).join("")}${who.viaEvents ? `<span class="shc-which-item">${T("이벤트 로그 신호", "Event-log signal")} <span class="muted">${T('(특정 디스크를 가리키지 못한 기록 — 아래 "저장장치 연결·컨트롤러 신호" 참고)', "(records that do not point to a specific disk — see “Storage connection / controller signals” below)")}</span></span>` : ""}${who.viaMissing ? `<span class="shc-which-item">${T("현재 연결되어 있지 않은 디스크", "Disk not currently connected")} <span class="muted">${T("(아래 참고)", "(see below)")}</span></span>` : ""}</p>`
      : "";
    const dangerDisks = res.disks.filter((d) => d.level === "danger");
    const dangerWho = dangerDisks.length
      ? `<p><strong>${T("위험 판정 디스크:", "Disks judged Danger:")}</strong> ${dangerDisks.map((d) => `${esc(d.model)}${d.drives && d.drives.length ? T(` (${esc(d.drives.join(", "))} 드라이브)`, ` (drive ${esc(d.drives.join(", "))})`) : ""}`).join(" · ")} — ${dangerDisks.some((d) => d.drives && d.drives.length) ? T("이 드라이브에 있는 자료부터 백업하세요.", "back up the data on these drives first.") : T("이 디스크에 있는 자료부터 백업하세요.", "back up the data on this disk first.")}</p>`
      : (ev && ev.checked && ev.level === "danger" ? T(`<p><strong>이벤트 로그가 위험 신호를 보였습니다.</strong> 특정 디스크를 가리키지 못한 기록이라, 중요한 자료는 모든 저장장치에서 먼저 백업하세요.</p>`, `<p><strong>The event log showed a danger signal.</strong> It does not point to a specific disk, so back up the important data on every storage device first.</p>`) : "");
    const dangerSteps = res.level === "danger" ? `
      <div class="card shc-steps">
        ${EN ? `        <h3>Do this now, in this order</h3>
        ${dangerWho}
        <ol class="mini-list">
          <li><strong>Stop installing programs, large copies, defragmenting and disk checks (chkdsk).</strong> Adding writes to an unstable storage device can make its state worse.</li>
          <li><strong>Copy your important data to an external drive or the cloud first.</strong> Documents, photos and work files come first; programs and games can be downloaded again later.</li>
          <li>Skip files that produce errors during copying and move the rest first. If it keeps stopping on the same file, do not force it.</li>
          <li>When the backup is done, prepare a replacement storage device.</li>
          <li>If the disk is already flickering in and out or files will not open, do not keep power-cycling it. Stop and get professional help first.</li>
        </ol>
` : `        <h3>지금 이 순서로 하세요</h3>
        ${dangerWho}
        <ol class="mini-list">
          <li><strong>새 프로그램 설치·대용량 복사·조각 모음·디스크 검사(chkdsk)는 멈추세요.</strong> 불안정한 저장장치에 쓰기를 더하면 상태가 더 나빠질 수 있습니다.</li>
          <li><strong>중요한 자료부터 외장 드라이브나 클라우드로 복사하세요.</strong> 문서·사진·작업 파일을 먼저, 프로그램과 게임은 나중에 다시 받을 수 있으니 뒤로 미룹니다.</li>
          <li>복사 중 오류가 나는 파일은 건너뛰고 나머지를 먼저 옮기세요. 같은 파일에서 계속 멈추면 억지로 반복하지 마세요.</li>
          <li>백업이 끝나면 교체용 저장장치를 준비하세요. <a href="ssd-upgrade-guide.html">SSD 교체·추가 설치 가이드</a> · <a href="backup-storage-calculator.html">백업 저장공간 계산기</a></li>
          <li>이미 인식이 오락가락하거나 파일이 열리지 않는다면 전원을 껐다 켜는 시도를 반복하지 말고 <a href="contact.html">수리·데이터 상담</a>을 먼저 받으세요.</li>
        </ol>
`}
      </div>` : "";

    const plan = replacementPlan(res);
    const gbText = (n) => `${nf(n)}GB`;
    const sizeText = (gb) => (gb >= 1000 ? `${gb / 1000}TB` : `${gb}GB`);
    const busHint = (b) => (b === "nvme" ? T("기존과 같은 M.2 NVMe 규격", "the same M.2 NVMe form factor as now") : b === "sata" ? T("기존과 같은 SATA 규격(2.5인치 또는 M.2 SATA)", "the same SATA form factor as now (2.5-inch or M.2 SATA)") : T("기존과 같은 연결 규격", "the same connection type as now"));
    const planRows = !plan ? "" : plan.items.map((i) => `<li><strong>${esc(i.model)}</strong>${i.drives && i.drives.length ? ` <span class="muted">${T(`(${esc(i.drives.join(", "))} 드라이브)`, `(drive ${esc(i.drives.join(", "))})`)}</span>` : ""} — ${
      i.usedGB === null ? T(`사용 중인 용량을 알 수 없습니다. 기존 용량${i.sizeGB ? `(약 ${esc(gbText(i.sizeGB))})` : ""} 이상을 권장합니다.`, `The used space is unknown. At least the current capacity${i.sizeGB ? ` (about ${esc(gbText(i.sizeGB))})` : ""} is recommended.`)
        : i.tooBig ? T(`지금 약 ${esc(gbText(i.usedGB))}를 쓰고 있어 4TB 한 개로도 여유가 부족합니다. 저장장치를 나누거나 정리 후 계산해 보세요.`, `About ${esc(gbText(i.usedGB))} is in use now, so even one 4TB drive leaves too little room. Split the data across drives or clean up and calculate again.`)
        : T(`지금 약 ${esc(gbText(i.usedGB))}를 쓰고 있어 <strong>${esc(sizeText(i.recommendedGB))} 이상</strong>을 권장합니다 (${esc(busHint(i.bus))}).`, `About ${esc(gbText(i.usedGB))} is in use now, so <strong>${esc(sizeText(i.recommendedGB))} or more</strong> is recommended (${esc(busHint(i.bus))}).`)}</li>`).join("");
    const prepCard = !plan ? "" : `
      <div class="card shc-prep">
        ${EN ? `        <h3>Backup and replacement preparation <span class="muted" style="font-size:.85rem;font-weight:400">· based on your PC's usage</span></h3>
        <p><strong>Storage to back up:</strong> ${plan.backupUsedGB === null ? "The used space is unknown, so it could not be calculated." : `About ${esc(gbText(plan.backupUsedGB))} is currently stored on ${plan.basis === "all" ? "all drives" : "the Danger/Caution disks"}. To move everything you need an external drive or cloud storage of <strong>${esc(gbText(plan.backupSuggestGB))} or more</strong> (20% headroom), and much less if you first move only what you really need, such as documents and photos.`}</p>
        <p><strong>Replacement SSD capacity:</strong></p>
        <ul class="mini-list">${planRows}</ul>
        <p class="muted">These values are chosen so usage stays at or below 70% (many SSDs write more slowly the fuller they get). Consider one size larger to allow for growth.</p>
        <details ${res.level === "danger" ? "open" : ""}>
          <summary><strong>How should you move your data?</strong></summary>
          <ol class="mini-list" style="margin-top:10px">
            <li><strong>Copy only the important files first (safest, recommended when in a hurry).</strong> Copy the Documents, Pictures, Desktop and Downloads folders to an external drive in File Explorer. If many files stop on read errors, run something like <code>robocopy "C:\\Users\\YourName\\Documents" "E:\\Backup\\Documents" /E /R:1 /W:1 /XJ</code> at a command prompt. Replace E: with your backup drive letter; <code>/R:1 /W:1</code> limits retries to one so it does not stall on unreadable files.</li>
            <li><strong>Clone the whole disk (keeps Windows and programs as they are).</strong> You can use the manufacturer's migration tool or a cloning tool such as Clonezilla. But a disk in bad condition can stop on read errors during cloning, or the errors can be copied over as they are, so <strong>finish copying your important files first</strong> and then try. After cloning, disconnect the original and check that the PC boots from the new disk.</li>
            <li><strong>Install fresh and restore only your files.</strong> For a disk that had errors, a fresh install is often safer than cloning. Before installing, check your BitLocker recovery key (for example on your Microsoft account page) and your sign-in and authenticator-app information.</li>
          </ol>
        </details>
        <details ${res.level === "danger" ? "open" : ""}>
          <summary><strong>When the disk is not recognised or keeps dropping out</strong></summary>
          <ol class="mini-list" style="margin-top:10px">
            <li><strong>Do not keep power-cycling it.</strong> Copy your important files first while it can still be read.</li>
            <li>If Disk Management (<code>diskmgmt.msc</code>) asks <strong>“Do you want to initialize?” or “Do you want to format?”, do not accept.</strong> The data can be erased.</li>
            <li>Turn the PC off and re-seat the cable and slot, or try another slot, a USB enclosure or another PC. That tells you whether it is a connection problem or a disk problem. First check whether the disk shows up on the BIOS screen.</li>
            <li>If you use a recovery program, save its output to <strong>a disk other than the original</strong>.</li>
            <li>If it does not show up even in the BIOS, or the data is important, stop trying yourself and get professional help. For more details see the explanations of <a href="/en/event-disk-7.html">Disk 7</a> and <a href="/en/event-disk-157.html">Disk 157</a>.</li>
          </ol>
        </details>
` : `        <h3>백업·교체 준비 <span class="muted" style="font-size:.85rem;font-weight:400">· 내 PC의 사용량 기준</span></h3>
        <p><strong>백업할 저장장치:</strong> ${plan.backupUsedGB === null ? "사용량을 알 수 없어 계산하지 못했습니다. 백업 저장공간 계산기로 필요한 용량을 확인하세요." : `${plan.basis === "all" ? "전체 드라이브" : "위험·주의 디스크"}에 지금 약 ${esc(gbText(plan.backupUsedGB))}가 저장돼 있습니다. 전부 옮기려면 <strong>${esc(gbText(plan.backupSuggestGB))} 이상</strong>(20% 여유)의 외장 드라이브나 클라우드가 필요하고, 문서·사진처럼 꼭 필요한 자료만 먼저 옮기면 훨씬 적게 듭니다.`} <a href="backup-storage-calculator.html">백업 저장공간 계산기</a></p>
        <p><strong>교체용 SSD 용량:</strong></p>
        <ul class="mini-list">${planRows}</ul>
        <p class="muted">사용량이 70%를 넘지 않게 고른 값입니다(가득 찰수록 쓰기 속도가 떨어지는 SSD가 많습니다). 늘어날 사용량을 생각해 한 단계 큰 용량도 고려하세요. 규격·슬롯 확인은 <a href="ssd-upgrade-guide.html">SSD 교체·추가 설치 전 확인사항</a>을 보세요.</p>
        <details ${res.level === "danger" ? "open" : ""}>
          <summary><strong>어떻게 옮길까요?</strong></summary>
          <ol class="mini-list" style="margin-top:10px">
            <li><strong>중요한 파일만 먼저 복사 (가장 안전, 급할 때 권장).</strong> 탐색기에서 문서·사진·바탕화면·다운로드 폴더를 외장 드라이브로 복사합니다. 읽기 오류로 멈추는 파일이 많다면 명령 프롬프트에서 <code>robocopy "C:\\Users\\내이름\\Documents" "E:\\백업\\Documents" /E /R:1 /W:1 /XJ</code>처럼 실행하세요. E:는 백업 드라이브 문자로 바꾸고, <code>/R:1 /W:1</code>은 읽기 오류 파일에서 오래 멈추지 않게 재시도를 1회로 줄입니다.</li>
            <li><strong>디스크 통째 복제 (윈도우·프로그램까지 그대로).</strong> 제조사가 주는 이전 도구나 Clonezilla 같은 복제 도구를 쓸 수 있습니다. 다만 상태가 나쁜 디스크는 복제 도중 읽기 오류로 멈추거나 오류까지 그대로 옮겨질 수 있으니, <strong>중요한 파일 복사를 먼저</strong> 끝내고 시도하세요. 복제 뒤에는 원본을 분리하고 새 디스크로 부팅되는지 확인합니다.</li>
            <li><strong>새로 설치하고 파일만 복원.</strong> 오류가 있던 디스크는 복제보다 새로 설치하는 쪽이 안전할 때가 많습니다. 설치 전에 BitLocker 복구 키(Microsoft 계정 페이지 등)와 로그인·인증 앱 정보를 확인해 두세요.</li>
          </ol>
        </details>
        <details ${res.level === "danger" ? "open" : ""}>
          <summary><strong>디스크가 인식 안 되거나 자꾸 끊길 때</strong></summary>
          <ol class="mini-list" style="margin-top:10px">
            <li><strong>전원을 껐다 켜는 시도를 반복하지 마세요.</strong> 읽을 수 있는 동안 중요한 파일 복사부터 하세요.</li>
            <li>디스크 관리(<code>diskmgmt.msc</code>)에서 <strong>"초기화하시겠습니까?"나 "포맷하시겠습니까?"가 나오면 누르지 마세요.</strong> 데이터가 지워질 수 있습니다.</li>
            <li>PC를 끄고 케이블·슬롯을 다시 꽂거나, 다른 슬롯·USB 케이스·다른 PC에 연결해 보세요. 연결 문제인지 디스크 문제인지 가릴 수 있습니다. 먼저 BIOS 화면에서 디스크가 보이는지도 확인하세요.</li>
            <li>복구 프로그램을 쓴다면 결과는 <strong>원본이 아닌 다른 디스크</strong>에 저장하세요.</li>
            <li>BIOS에서도 보이지 않거나 중요한 자료라면 직접 시도를 멈추고 <a href="contact.html">수리·데이터 상담</a>을 받으세요. 더 확인하려면 <a href="hardware-nvme-delay.html">NVMe 인식 지연 점검</a>, <a href="event-disk-7.html">Disk 7</a>·<a href="event-disk-157.html">Disk 157</a> 해설을 참고하세요.</li>
          </ol>
        </details>
`}
      </div>`;
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    lastSummary = buildSummary(res, `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
    const hist = opts && opts.historyInfo ? opts.historyInfo : null;
    const toolbar = sample ? "" : `
      <div class="card shc-tools">
        <div class="button-row">
          <button class="btn secondary" type="button" id="shc-copy-summary">${T("결과 요약 복사", "Copy summary")}</button>
          <button class="btn secondary" type="button" id="shc-print">${T("결과 인쇄·PDF 저장", "Print / save as PDF")}</button>
          ${!EN && (res.level === "danger" || res.level === "caution") ? `<a class="btn secondary" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 상담하기</a>` : ""}
        </div>
        <p class="muted" id="shc-copy-msg">${T("요약을 복사해 상담이나 게시글에 붙여넣을 수 있습니다. 디스크 모델명과 수치만 들어가고 일련번호 같은 식별 정보는 포함되지 않습니다.", "You can copy the summary and paste it into a support request or a post. It contains only the disk model names and values, and no identifying information such as serial numbers.")}</p>
        ${hist ? `<hr style="border:0;border-top:1px solid rgba(128,128,128,.25);margin:10px 0">
        <label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="shc-history-on" ${hist.enabled ? "checked" : ""}> ${T("이 브라우저에 결과를 저장해 다음 점검과 비교하기", "Save the result in this browser to compare with the next check")}</label>
        <p class="muted" id="shc-history-msg" style="margin:6px 0 0">${hist.enabled ? (hist.saved ? (hist.hadPrev ? T("지난 점검과 비교한 내용은 디스크별 결과에 표시했습니다.", "The comparison with the previous check is shown in each disk's result.") : T("이전 기록이 없어 이번 결과를 저장했습니다. 다음에 점검하면 변화를 비교해 보여 드립니다.", "There was no earlier record, so this result was saved. Next time you check, the changes will be compared.")) : T("브라우저가 저장을 허용하지 않아 기록하지 못했습니다.", "The browser did not allow saving, so nothing was recorded.")) : T("저장하지 않았습니다. 체크하면 다음 점검부터 비교합니다.", "Not saved. Tick the box to compare from the next check.")} ${T("모델명과 수치만 이 브라우저에 저장되고 서버로 전송되지 않습니다.", "Only model names and values are saved in this browser and nothing is sent to a server.")}
          <button class="btn secondary" type="button" id="shc-history-clear" style="padding:2px 10px;margin-left:6px">${T("저장된 기록 지우기", "Clear saved records")}</button></p>` : ""}
      </div>`;
    const sampleBanner = sample ? T(`<div class="card shc-sample"><strong>예시 화면입니다.</strong> 실제 내 PC의 결과가 아니라 가상의 값으로 만든 미리보기입니다. 내 PC 결과를 보려면 위의 방법 1 또는 2를 이용하세요.</div>`, `<div class="card shc-sample"><strong>This is an example.</strong> It is a preview made with made-up values, not the result of your PC. To see your own PC's result, use Method 1 or 2 above.</div>`) : "";
    box.innerHTML = `
      ${sampleBanner}
      <div class="card shc-verdict shc-${res.level}">
        <p><span class="shc-pill shc-pill-${res.level}">${v.badge}</span></p>
        <h3>${esc(v.headline)}</h3>
        ${whichLine}
        ${res.spaceLevel && res.spaceLevel !== "good" ? T(`<p class="shc-space-note">※ 일부 드라이브의 <strong>여유 공간이 부족</strong>합니다. 이것은 디스크 상태(고장 여부)와는 <strong>별개의 문제</strong>입니다. 디스크가 정상이어도 공간이 부족하면 속도 저하나 저장·업데이트 실패가 생길 수 있고, 파일을 정리하면 해결됩니다. 아래 "드라이브 여유 공간"을 확인하세요.</p>`, `<p class="shc-space-note">※ Free space is low on some drives. This is a <strong>separate problem</strong> from the disk's health (whether it is failing). Even if the disk is fine, low free space can cause slowdowns and failed saves or updates, and cleaning up files fixes it. See “Drive free space” below.</p>`) : ""}
      </div>
      ${toolbar}
      ${dangerSteps}
      ${prepCard}
      <div class="card"><h3>${T("저장장치별 결과", "Per-device results")}</h3>${disks || `<p class="muted">${T("디스크 정보가 없습니다.", "No disk information.")}</p>`}</div>
      ${goneCard}
      ${evCard}
      ${vols ? `<div class="card"><h3>${T("드라이브 여유 공간", "Drive free space")} <span class="muted" style="font-size:.85rem;font-weight:400">${T("· 디스크 건강과는 별개입니다", "· separate from disk health")}</span></h3>${vols}</div>` : ""}
      ${EN ? `      <p class="muted">Even when SMART values look normal, an SSD can fail without warning because of a controller or firmware problem. This verdict is for reference only; keep a separate backup of important data whatever the result says. To read the event log in more detail, see the <a href="/en/event-log-analyzer.html">event log analyzer</a>.</p>` : `      <p class="muted">SMART 값이 정상이어도 SSD는 컨트롤러·펌웨어 문제로 예고 없이 고장 날 수 있습니다. 이 판정은 참고용이며, 중요한 자료는 결과와 상관없이 다른 저장장치에 따로 백업해 두세요.
        더 자세한 확인은 <a href="ssd-smart-health-guide.html">SSD SMART·건강 상태 확인 방법</a>, 이벤트 로그까지 함께 보려면 <a href="minidump-analyzer.html">크래시·이벤트 로그 분석기</a>를 이용하세요.</p>`}`;
    box.hidden = false;
    const copyBtn = $("shc-copy-summary");
    if (copyBtn) {
      copyBtn.addEventListener("click", async () => {
        const msg = $("shc-copy-msg");
        try { await navigator.clipboard.writeText(lastSummary); copyBtn.textContent = T("복사됨 ✓", "Copied ✓"); }
        catch (e) {
          // 클립보드 권한이 없으면 선택할 수 있게 텍스트를 보여 준다.
          msg.innerHTML = `<textarea class="code-input" readonly rows="6" style="width:100%;box-sizing:border-box">${esc(lastSummary)}</textarea>`;
          msg.querySelector("textarea").select();
        }
        setTimeout(() => { copyBtn.textContent = T("결과 요약 복사", "Copy summary"); }, 2000);
      });
    }
    box.querySelectorAll("[data-shc-forget]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const base = btn.getAttribute("data-shc-forget");
        const h = loadHistory();
        if (h && h.disks) { Object.keys(h.disks).forEach((k) => { if (baseOf(k) === base) delete h.disks[k]; }); saveHistory(h); }
        btn.textContent = T("더 이상 알리지 않습니다 ✓", "Won't notify again ✓");
        btn.disabled = true;
      });
    });
    const printBtn = $("shc-print");
    if (printBtn) printBtn.addEventListener("click", () => window.print());
    const histOn = $("shc-history-on");
    if (histOn) {
      histOn.addEventListener("change", () => {
        try { if (histOn.checked) localStorage.removeItem(HISTORY_OFF_KEY); else localStorage.setItem(HISTORY_OFF_KEY, "1"); } catch (e) { /* 저장소를 못 쓰면 무시 */ }
        $("shc-history-msg").firstChild.textContent = histOn.checked ? T("다음 점검부터 결과를 저장해 비교합니다. ", "From the next check, results are saved and compared. ") : T("다음 점검부터 저장하지 않습니다. ", "From the next check, results are not saved. ");
      });
      $("shc-history-clear").addEventListener("click", (e) => {
        try { localStorage.removeItem(HISTORY_KEY); } catch (err) { /* 무시 */ }
        e.currentTarget.textContent = T("지웠습니다 ✓", "Cleared ✓");
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
    } catch (e) { showError(e.message || T("분석 중 오류가 발생했습니다.", "An error occurred during analysis.")); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("shc-command").textContent = COMMAND;
    $("shc-copy").addEventListener("click", async (ev) => {
      const btn = ev.currentTarget;
      try { await navigator.clipboard.writeText(COMMAND); btn.textContent = T("복사됨 ✓", "Copied ✓"); }
      catch (e) { btn.textContent = T("직접 선택해 복사하세요", "Select it and copy manually"); }
      setTimeout(() => { btn.textContent = T("명령 복사", "Copy command"); }, 2000);
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
          if (vals[id] !== null && (!Number.isFinite(vals[id]) || vals[id] < 0)) { showError(T("입력한 값은 0 이상의 숫자여야 합니다.", "Values must be numbers of 0 or more.")); return; }
        }
        const status = $("shc-cdi-status").value;
        if (!status && ids.every((id) => vals[id] === null)) { showError(T("CrystalDiskInfo에서 확인한 값을 하나 이상 입력해 주세요.", "Enter at least one value you read in CrystalDiskInfo.")); return; }
        if (vals.health !== null && vals.health > 100) { showError(T("건강 상태는 0~100% 사이로 입력해 주세요.", "Enter the health status as a value between 0 and 100%.")); return; }
        const type = $("shc-cdi-type").value;
        const drive = $("shc-cdi-drive").value.trim().toUpperCase().replace(/[^A-Z]/g, "")[0];
        const disk = {
          model: $("shc-cdi-model").value.trim() || T("CrystalDiskInfo 입력 값", "CrystalDiskInfo values"),
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
        showError(T("브라우저가 클립보드 읽기를 허용하지 않았습니다. 아래 입력칸을 클릭하고 Ctrl+V로 붙여넣어 주세요.", "The browser did not allow reading the clipboard. Click the box below and paste with Ctrl+V."));
        $("shc-input").focus();
      }
      btn.blur();
    });

    $("shc-file").addEventListener("change", async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { showError(T("파일이 너무 큽니다. 수집 스크립트가 만든 hardware.json을 선택해 주세요.", "The file is too large. Select the hardware.json made by the collection script.")); return; }
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
          const res = await fetch(batBox.dataset.src || "assets/itsvc-disk-check.bat", { cache: "no-store" });
          if (!res.ok) throw new Error();
          pre.textContent = await res.text();
          pre.dataset.loaded = "1";
        } catch (e) { pre.textContent = T("내용을 불러오지 못했습니다. 파일을 내려받아 메모장으로 열어 확인할 수 있습니다.", "Could not load the content. Download the file and open it in Notepad to check it."); }
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
