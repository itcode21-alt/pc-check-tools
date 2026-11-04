// en/ssd-health-check.html — the English edition of the SSD / disk health check page.
// The behavior is ssd-health-engine.js + ssd-health-check.js (language switched by <html lang="en">); this file
// only holds the static English page. Keep it in step with ssd-health-check.html (Korean).
// Run: node scripts/generate-ssd-health-page-en.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SITE = "https://itsvc.co.kr";
const today = process.env.SSD_PAGE_DATE || "2026-11-04";
const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const koHtml = fs.readFileSync(path.join(root, "ssd-health-check.html"), "utf8");
const analyzerEn = fs.readFileSync(path.join(root, "en/event-log-analyzer.html"), "utf8");
// Reuse the Korean page's inline <style>, and the script/stylesheet versions of the live pages, so nothing drifts.
const style = (koHtml.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
const ref = (html, re) => (html.match(re) || [, ""])[1];
const styleRef = ref(analyzerEn, /href="(\/style\.css[^"]*)"/);
const engineRef = ref(koHtml, /src="(ssd-health-engine\.js[^"]*)"/);
const uiRef = ref(koHtml, /src="(ssd-health-check\.js[^"]*)"/);
const GA = (analyzerEn.match(/<head>(<script async[\s\S]*?<\/script><script>[\s\S]*?<\/script>)/) || [, ""])[1];
const ICONS = (analyzerEn.match(/<link rel="icon" href="\/favicon\.ico"[^\n]*/) || [""])[0].trim();

const url = `${SITE}/en/ssd-health-check.html`;
const koUrl = `${SITE}/ssd-health-check.html`;
const title = "SSD Health Check — Is Your Drive About to Fail? | PC Windows Diagnostic Center";
const desc = "Check an SSD or HDD's health status, wear, error records, temperature, free space and recent storage events, and find out whether you should back up and replace it now. Calculated in your browser only.";

const faq = [
  ["What is the easiest way to check an SSD's health?", "Download the check file on this page and double-click it. When the permission prompt appears, click Yes; it reads the disk status, wear, error records, temperature, free space and the storage-related events of the last 30 days, and shows the result right away. If you would rather not use a file, you can paste a command into an administrator PowerShell, or type in the values from CrystalDiskInfo if you already use it."],
  ["Can an SSD fail suddenly even when the verdict is Good?", "Yes. The verdict is based on the values and event records that Windows and the disk report, so a failure caused by a controller or firmware problem, where the drive simply stops being recognised, may not be flagged in advance. Keep a separate backup of important data whatever the verdict says."],
  ["What should I do if my SSD is suddenly not recognised?", "Do not keep power-cycling it, and do not accept if Disk Management asks you to initialize or format it. Re-seat the cable and slot, or try another slot, a USB enclosure or another PC, and check whether it shows up in the BIOS. If it still does not, or the data is important, stop trying yourself and get professional help."],
  ["At what wear percentage should I replace an SSD?", "This tool treats 70% wear or more as Caution and 90% or more as Danger. The real margin depends on the manufacturer's rated write endurance (TBW) and your usage pattern. High wear does not mean immediate failure, but it is safer to plan the backup and replacement early."],
  ["Does low free space mean the SSD has failed?", "No. Low free space is a separate problem from disk failure. A nearly full drive gets slower and saves or updates can fail, so cleaning up is needed, but it is shown separately and does not change the disk-health verdict."],
  ["Is the check file safe? Is my information sent to a server?", "The check file is read-only: it changes no settings and deletes no files. You can preview its content on the page, the result is handed only to the browser on this PC, and the verdict is calculated inside the browser (nothing is sent to a server). If you turn on the comparison with previous checks, only model names and values are stored in this browser, and you can turn it off or clear it at any time."],
];

const schemas = [
  { "@context": "https://schema.org", "@type": "WebApplication", name: "SSD Health Check", applicationCategory: "UtilitiesApplication", operatingSystem: "Windows", url, inLanguage: "en",
    description: "A browser tool that judges from disk status, wear, error records, temperature, free space and recent storage events whether an SSD or HDD needs to be backed up and replaced.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, dateModified: today,
    author: { "@type": "Organization", name: "PC Windows Diagnostic Center", url: `${SITE}/en/` }, publisher: { "@type": "Organization", name: "PC Windows Diagnostic Center", url: `${SITE}/en/` } },
  { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Event ID guide", item: `${SITE}/en/` },
    { "@type": "ListItem", position: 2, name: "SSD health check", item: url } ] },
];

const cdiField = (id, label, attrs) => `              <label><span>${label}</span><input class="code-input" id="shc-cdi-${id}" ${attrs}></label>`;

const html = `<!doctype html>
<html lang="en">
<head>${GA}
  <meta charset="utf-8">
  ${ICONS}
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${url}">
  <link rel="alternate" hreflang="ko" href="${koUrl}">
  <link rel="alternate" hreflang="x-default" href="${koUrl}">
${schemas.map((s) => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
  <meta property="og:title" content="SSD Health Check — Is Your Drive About to Fail?"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="${styleRef}">
  ${style}
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="/en/" aria-label="English home">PC</a><div><p class="eyebrow">Tool</p><h1>SSD Health Check</h1></div></div>
    <nav class="nav" aria-label="Main menu"><a href="/en/">Event ID guide</a><a href="/en/event-log-analyzer.html">Event log analyzer</a><a href="/en/ssd-health-check.html">SSD health check</a><a href="/ssd-health-check.html" hreflang="ko" lang="ko">한국어 사이트</a></nav>
  </header>
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">SSD health check</span></div></nav>
  <main id="content" class="page">
    <section class="section">
      <p class="eyebrow">DISK HEALTH CHECK</p>
      <h2>SSD &amp; Disk Health Check</h2>
      <p class="lead">An SSD can get worse suddenly and leave you unable to get your data out. This tool reads a storage device's status, wear, error records and temperature together with each drive's free space and the storage events of the last 30 days, and tells you <strong>whether you should back up and replace it now</strong>. The calculation happens inside this page and is not sent to a server.</p>

      <div class="card shc-noprint">
        <p style="margin:0 0 8px"><strong>Want to see what the result looks like first?</strong> You can preview it with example (made-up) values.</p>
        <div class="button-row">
          <button class="btn secondary" type="button" data-shc-sample="danger">Show Danger example</button>
          <button class="btn secondary" type="button" data-shc-sample="caution">Show Caution example</button>
          <button class="btn secondary" type="button" data-shc-sample="good">Show Good example</button>
          <button class="btn secondary" type="button" data-shc-sample="space">Show Low-space example</button>
        </div>
      </div>

      <div class="card shc-noprint">
        <h3>Method 1 · Run the check file and you are done (easiest)</h3>
        <ol class="mini-list">
          <li>Download the <strong>check file</strong> with the button below.</li>
          <li><strong>Double-click</strong> the downloaded file and click <strong>“Yes”</strong> when the permission prompt appears. Administrator rights are needed to read wear, temperature and error records.</li>
          <li>After a moment the <strong>result appears in your browser automatically</strong>. No copying or pasting is needed.</li>
        </ol>
        <div class="button-row" style="margin-top:10px"><a class="btn primary" href="/assets/itsvc-disk-check-en.bat" download>Download the check file</a></div>
        <p class="muted">It also reads the storage-related event records of the last 30 days (only the count per kind of error). It is read-only: it changes no settings and deletes no files, and the result is handed only to the browser on this PC (the part of the address after # is not sent to a server). Even if you click “No” in the permission prompt, the disk status and free space are still checked.</p>
        <details>
          <summary>Do you get a warning when downloading?</summary>
          <div>
            <p>If the browser says the file may be dangerous, choose <strong>Keep</strong>. If a “publisher cannot be verified” or “Windows protected your PC” window appears when you run it, click <strong>More info → Run</strong> (or <strong>Run</strong>). This warning always appears for executable files downloaded from the internet. If you are unsure, preview the content below first, or use Method 2.</p>
          </div>
        </details>
        <details id="shc-bat-source" data-src="/assets/itsvc-disk-check-en.bat">
          <summary>Preview the content of the check file</summary>
          <pre id="shc-bat-text" style="white-space:pre-wrap;word-break:break-all;font-size:.78rem;max-height:340px;overflow:auto">Loads when you open this.</pre>
        </details>
      </div>

      <div class="card shc-noprint">
        <details>
          <summary><strong>Method 2 · Run a command yourself, without a file, and paste the result</strong></summary>
          <ol class="mini-list" style="margin-top:12px">
            <li>Right-click the Start button and open <strong>Terminal (Admin)</strong> or <strong>Windows PowerShell (Admin)</strong>.</li>
            <li>Paste the command below and press Enter. Nothing is printed on screen; the result is <strong>copied to the clipboard automatically</strong>.</li>
          </ol>
          <code id="shc-command"></code>
          <div class="button-row" style="margin-top:10px"><button class="btn secondary" type="button" id="shc-copy">Copy command</button></div>
        </details>
      </div>

      <div class="card shc-noprint">
        <h3>Paste the result</h3>
        <p class="muted">Use this for the result of Method 2, or for a <code>hardware.json</code> file. It is judged as soon as you paste.</p>
        <div class="button-row" style="margin-bottom:10px"><button class="btn secondary" type="button" id="shc-paste">Paste from clipboard</button></div>
        <label for="shc-input" class="muted">Or click the box below and paste with Ctrl+V.</label>
        <textarea class="code-input" id="shc-input" spellcheck="false" placeholder='{"disks":[...],"volumes":[...]}'></textarea>
        <div class="button-row" style="margin-top:12px">
          <button class="btn primary" type="button" id="shc-analyze">Check health</button>
          <button class="btn secondary" type="button" id="shc-clear">Clear</button>
          <label class="btn secondary" style="cursor:pointer">Choose hardware.json<input type="file" id="shc-file" accept=".json,application/json" hidden></label>
        </div>
        <p id="shc-error" role="alert" hidden></p>
      </div>

      <div class="card shc-noprint">
        <details>
          <summary><strong>Type in CrystalDiskInfo values to get a verdict (optional)</strong></summary>
          <p class="muted" style="margin-top:12px">If you already use CrystalDiskInfo, enter the values you see on its screen as they are. Items the check file cannot read, such as reallocated and pending sectors and the NVMe spare area, are included in the verdict. Leave unknown boxes empty.</p>
          <form id="shc-cdi-form" class="shc-cdi">
            <div class="event-fields">
              <label><span>Type</span><select class="code-input" id="shc-cdi-type"><option value="sata">SATA SSD</option><option value="nvme">NVMe SSD</option><option value="hdd">HDD</option></select></label>
              <label><span>Status (coloured box at the top left)</span><select class="code-input" id="shc-cdi-status"><option value="">Unknown</option><option value="good">Good (blue/green)</option><option value="caution">Caution (yellow)</option><option value="bad">Bad (red)</option></select></label>
${cdiField("health", "Health status (%)", 'type="number" min="0" max="100" step="1" placeholder="e.g. 98"')}
${cdiField("temp", "Temperature (℃)", 'type="number" min="0" step="1" placeholder="e.g. 38"')}
${cdiField("hours", "Power-on hours", 'type="number" min="0" step="1" placeholder="e.g. 6412"')}
${cdiField("realloc", "Reallocated sectors", 'type="number" min="0" step="1" placeholder="SATA"')}
${cdiField("pending", "Current pending sectors", 'type="number" min="0" step="1" placeholder="SATA"')}
${cdiField("uncorr", "Uncorrectable sectors", 'type="number" min="0" step="1" placeholder="SATA"')}
${cdiField("spare", "Available spare (%)", 'type="number" min="0" max="100" step="1" placeholder="NVMe"')}
${cdiField("spare-thr", "Available spare threshold (%)", 'type="number" min="0" max="100" step="1" placeholder="NVMe, usually 10"')}
${cdiField("crit", "Critical warning value", 'type="number" min="0" step="1" placeholder="NVMe, 0 is normal"')}
${cdiField("media", "Media and data integrity errors", 'type="number" min="0" step="1" placeholder="NVMe"')}
${cdiField("model", "Model name (optional)", 'type="text" maxlength="60" placeholder="e.g. Samsung SSD 970 EVO"')}
${cdiField("drive", "Drive letter (optional)", 'type="text" maxlength="2" placeholder="e.g. C"')}
            </div>
            <div class="button-row" style="margin-top:12px"><button class="btn primary" type="submit">Check with these values</button></div>
          </form>
        </details>
      </div>

      <div id="shc-result" aria-live="polite" hidden></div>

      <section class="card shc-noprint">
        <h3>How the verdict is made</h3>
        <ul class="mini-list">
          <li><strong>Danger</strong> — Windows does not report the disk as Healthy, the disk reports Predictive Failure, there are uncorrected read or write errors, or wear is 90% or more. If you entered CrystalDiskInfo values, status “Bad”, pending or uncorrectable sectors, 100 or more reallocated sectors, an NVMe critical warning, spare at or below its threshold, or integrity errors are also Danger.</li>
          <li><strong>Caution</strong> — wear of 70–89%, 70℃ or more for an SSD (55℃ for an HDD), an operational status other than OK, any reallocated sectors, or NVMe spare of 30% or less.</li>
          <li><strong>Event-log signals</strong> (last 30 days, read by the check file and Method 2) — bad blocks or hardware I/O errors (Disk 7, 154): Caution once, Danger at three or more. A failure prediction warning (Disk 52): Danger even once. Controller errors and resets (Disk 9, 11, stornvme 11, 129, storahci 129): Caution at three or more, Danger when they appear with data errors. File-system corruption (Ntfs 50, 55, 57, 140): Caution once, Danger at three or more or together with hardware errors. I/O retries (Disk 51, 153): Caution at five or more. Disk connection drops (Disk 157): Caution at three or more. Events are an indirect signal that also reflects cable and driver problems; Disk events that include a disk number are attached to that disk and the rest are shown separately.</li>
          <li><strong>Disks not currently connected</strong> — disks Windows cannot communicate with, disks that appear in the event log but not in the current list, and disks that were present at the previous check but are not visible now are shown separately. A vanished internal disk (SATA, NVMe and so on) is a Caution; an external USB disk only gets a note (only when saving previous checks is on).</li>
          <li><strong>Unknown</strong> — wear, temperature and error values could not be read. In that case run it again with administrator rights; a disk is never called Good without those values.</li>
          <li><strong>Low free space</strong> — less than 10% free (under 5% is very low). It is shown <strong>separately from disk health</strong>: a healthy disk can still slow down or fail to save when it is short of space, but that does not mean it is failing.</li>
          <li><strong>Reference information</strong> (does not change the verdict) — long power-on time (roughly four or more years of constant use), large maximum latency values, the <strong>replacement estimate</strong> (a rough figure assuming the wear pace so far continues), and the <strong>comparison with the previous check</strong> (if wear rose by 3 points or more per 30 days, or errors increased, it is raised to Caution or Danger).</li>
        </ul>
        <p class="muted">Even when SMART values look normal, an SSD can fail without warning because of a controller or firmware problem. This is therefore not a guarantee that the drive is safe until it fails; it is a reference tool that tells you whether to hurry with a backup now. Always keep a separate copy of important data.</p>
      </section>

      <section class="card shc-noprint">
        <h3>What this tool can and cannot tell you</h3>
        <p><strong>What it can tell you</strong></p>
        <ul class="mini-list">
          <li>The disk status Windows reports (Healthy or not), the operational status, and disks that are not connected</li>
          <li>Wear, temperature, power-on time and uncorrected read/write errors (when the device reports them)</li>
          <li>Each drive's free space and which disk it belongs to</li>
          <li>Storage-related event records of the last 30 days, such as controller resets, bad blocks and file-system corruption</li>
          <li>Changes since the previous check (wear increase, error increase, a vanished disk) and a rough replacement timing</li>
        </ul>
        <p><strong>What it cannot tell you</strong></p>
        <ul class="mini-list">
          <li>A sudden controller or firmware failure — it can happen without warning even when the values are normal.</li>
          <li>Wear and error status when the device does not give detailed values to Windows — it is shown as “Unknown”, and never as Good.</li>
          <li>Whether data can be recovered, or whether a hardware failure is confirmed — the verdict is for reference only.</li>
        </ul>
      </section>

      <section class="card shc-noprint" id="faq">
        <h3>Frequently asked questions</h3>
        <ul class="mini-list">
${faq.map(([q, a]) => `          <li><strong>${esc(q)}</strong> ${esc(a)}</li>`).join("\n")}
        </ul>
        <p class="muted">Last reviewed: ${today}</p>
      </section>
      <p><a href="/ssd-health-check.html" hreflang="ko" lang="ko">한국어 버전 (Korean edition)</a></p>
    </section>
  </main>
  <footer class="site-footer">
    <p>© ${today.slice(0, 4)} PC Windows Diagnostic Center</p>
    <p class="footer-links"><a href="/en/">Event ID guide</a> · <a href="/en/event-log-analyzer.html">Event log analyzer</a> · <a href="/en/ssd-health-check.html">SSD health check</a> · <a href="/about.html" lang="ko">About (Korean)</a> · <a href="/privacy.html" lang="ko">Privacy policy (Korean)</a> · <a href="/terms.html" lang="ko">Terms (Korean)</a> · <a href="/contact.html" lang="ko">Contact (Korean)</a></p>
  </footer>
  <script defer src="/${engineRef}"></script>
  <script defer src="/${uiRef}"></script>
  <script defer src="/ui-init.js"></script>
</body>
</html>
`;

fs.writeFileSync(path.join(root, "en/ssd-health-check.html"), html);
console.log(`en/ssd-health-check.html written (${html.length} bytes)`);
