// en/event-log-analyzer.html — the English edition of the event log analyzer page.
// The behavior is event-log-analyzer.js (language switched by <html lang="en">); this file only
// holds the static English page. Keep it in step with event-log-analyzer.html (Korean).
import fs from "node:fs";
import path from "node:path";

const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

export function renderAnalyzerPage({ root, SITE, today, styleRef, uiInitRef, dataRef, analyzerRef, builderRef, enDataRef, enCount, ga, icons, header, footer }) {
  const koHtml = fs.readFileSync(path.join(root, "event-log-analyzer.html"), "utf8");
  // The Korean page's inline <style> is reused as-is so both editions look the same.
  const style = (koHtml.match(/<style>[\s\S]*?<\/style>/) || [""])[0];
  const url = `${SITE}/en/event-log-analyzer.html`;
  const koUrl = `${SITE}/event-log-analyzer.html`;
  const title = "Windows Event Log Analyzer — Paste Event Viewer Output and Get Explanations";
  const desc = "Paste text or XML copied from Windows Event Viewer, or PowerShell output, and see what each event means, what to check first and what happened around restarts. Everything runs in your browser.";

  const faq = [
    ["Is the text I paste sent to a server?", "No. The analyzer runs only in your browser and does not send or store what you paste. It uses only the source, the event ID and the record time, and does not read computer names or user names."],
    ["Can it interpret an event from the ID alone?", "The source is needed too. Event ID 7001 means different things for Service Control Manager and Winlogon, and 1001 means different things for BugCheck, Windows Error Reporting and DHCP-Client. With an ID alone it can only list the candidates that use that ID."],
    ["What about events without an explanation on this site?", `They are shown separately with a Microsoft Learn search link. The tool does not invent meanings. English explanations currently exist for ${enCount} common events and for the informational records grouped on five pages; for the others it points to the Korean explanation where one exists.`],
    ["Can the result confirm a failed part?", "No. An event records what Windows saw; it does not name the faulty part. Use the tool to decide which records to read first and in what order to check."]
  ];
  const schemas = [
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Windows Event Log Analyzer", applicationCategory: "UtilitiesApplication", operatingSystem: "Any", url, inLanguage: "en",
      description: "A browser tool that reads the source and event ID from Event Viewer text, XML or PowerShell output and explains what each event means and what to check first.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, dateModified: today,
      author: { "@type": "Organization", name: "PC Windows Diagnostic Center", url: `${SITE}/en/` }, publisher: { "@type": "Organization", name: "PC Windows Diagnostic Center", url: `${SITE}/en/` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Event ID guide", item: `${SITE}/en/` },
      { "@type": "ListItem", position: 2, name: "Event log analyzer", item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];

  const popular = [
    ["kernel-power-41", "Kernel-Power 41 · restart after an abnormal shutdown"],
    ["whea-logger-18", "WHEA-Logger 18 · hardware error report"],
    ["disk-153", "Disk 153 · disk I/O retry"],
    ["bugcheck-1001", "BugCheck 1001 · restart after a blue screen"],
    ["display-4101", "Display 4101 · graphics driver recovered"]
  ];

  return `<!doctype html>
<html lang="en">
<head>${ga}
  <meta charset="utf-8">
  ${icons}
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${url}">
  <link rel="alternate" hreflang="ko" href="${koUrl}">
  <link rel="alternate" hreflang="x-default" href="${koUrl}">
${schemas.map((s) => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
  <meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="/${styleRef}">
  ${style}
</head>
<body>
${header("Tool", "Event Log Analyzer")}
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">Event log analyzer</span></div></nav>
  <main id="content" class="page">
    <section class="section">
      <p class="eyebrow">EVENT LOG ANALYZER</p>
      <h2>Windows Event Log Analyzer</h2>
      <p class="lead">Paste text or XML copied from Event Viewer, or PowerShell output, and the analyzer reads each record's <strong>Source</strong> and <strong>Event ID</strong> and lays out what it means and what to check first. It narrows down where to look from the combination of records, and when there are restart records it also shows the records in the 10 minutes before and after and the gaps between repeats. All processing happens in this browser; what you paste is not sent anywhere.</p>

      <div class="card">
        <label for="ela-input"><strong>Paste event content</strong></label>
        <textarea id="ela-input" class="ela-textarea" spellcheck="false" placeholder="Paste Event Viewer event text, XML, or Get-WinEvent output here. You can paste many records at once."></textarea>
        <div class="button-row" style="margin-top:14px"><button class="btn primary" type="button" id="ela-run">Analyze</button><button class="btn secondary" type="button" id="ela-sample">Try an example</button><button class="btn secondary" type="button" id="ela-clear">Clear</button></div>
        <p class="ela-file muted">Load from a file (.txt .xml .csv, up to 2 MB): <input type="file" id="ela-file" accept=".txt,.xml,.csv,.log,text/plain,text/xml"></p>
        <p class="muted">This page accepts text and XML only. To analyze a .evtx file, use the Event Viewer tab of the <a href="/diagnostic.html#diagnostic-event" hreflang="ko" lang="ko">diagnostic tool (Korean)</a>. The example is a made-up record for illustration.</p>
        <p class="ela-status" id="ela-status" aria-live="polite"></p>
      </div>

      <div id="ela-actions" class="card" hidden>
        <div class="button-row"><button class="btn secondary" type="button" id="ela-copy" title="Copies the analysis as a few lines of text. Use it to paste into a forum question or a chat.">Copy summary</button><button class="btn secondary" type="button" id="ela-copy-md" title="Copies the same content as a table (Markdown). It shows as a table where Markdown is supported.">Copy as Markdown</button><button class="btn secondary" type="button" id="ela-copy-link" title="Copies a web address that reopens this result.">Copy share link</button><button class="btn secondary" type="button" id="ela-csv" title="Saves the per-event summary to your PC as a CSV file that opens in a spreadsheet.">Save CSV</button><button class="btn secondary" type="button" id="ela-print" title="Prints the result screen or saves it as a PDF file.">Print / save PDF</button></div>
        <h4 style="margin:16px 0 6px">What does each button copy or save?</h4>
        <ul class="mini-list">
          <li><strong>Copy summary</strong> — copies the list of analyzed events as a few lines of text. Each line has the source name, event ID, how many times it appeared and the address of the explanation page. Use it to paste straight into a community question or a chat.</li>
          <li><strong>Copy as Markdown</strong> — copies the same content in table form. Pasted into places that support Markdown (GitHub, Discord, Notion) it shows as a table; where it is not supported the <code>|</code> characters appear as they are, so use “Copy summary” there.</li>
          <li><strong>Copy share link</strong> — copies a web address that reopens this result. Sending it to someone opens the same event summary. The address contains only the source, event ID and count, nothing is stored on a server, and because it has no times the distribution and before/after records are not shown.</li>
          <li><strong>Save CSV</strong> — downloads the per-event summary (source, ID, count, level, first/last record time, explanation page) to your PC as <code>event-log-summary.csv</code>, which opens in a spreadsheet. It contains times, so keep that in mind when sending it to others.</li>
          <li><strong>Print / save PDF</strong> — prints the current result (overall assessment, distribution, before/after records, event cards) or keeps it as a PDF. In the print dialog choose “Save as PDF” instead of a printer. It is exactly what you see on screen, so record times are included.</li>
        </ul>
        <p class="muted"><strong>Which should I choose?</strong> Use “Copy summary” when asking for help, “Save CSV” to organize in a spreadsheet or keep a file, and “Print / save PDF” to keep the screen as it is. The summary, Markdown and share link do not include record times or event bodies. Every button works only inside this browser and sends nothing you entered to a server.</p>
      </div>
      <div id="ela-result" aria-live="polite"></div>

      <section class="card">
        <h3>Formats you can paste</h3>
        <ul class="mini-list">
          <li><strong>Event Viewer General tab text</strong>: double-click an event to open it and copy the body. The “Source”, “Event ID” and “Date” lines are read.</li>
          <li><strong>XML view on the Details tab</strong>: the &lt;Provider Name&gt;, &lt;EventID&gt; and &lt;TimeCreated&gt; values are read. You can paste the XML of several events one after another.</li>
          <li><strong>PowerShell Format-List output</strong>: the ProviderName, Id and TimeCreated lines are read. This is the easiest way to collect many records at once.</li>
          <li><strong>One-line table or CSV rows</strong>: only when none of the formats above is present, it looks for lines where a source name and an ID that this site knows appear together.</li>
        </ul>
        <p>To collect only the errors and warnings of the last 3 days as text, open PowerShell, run the command below and copy the output. Usage is documented at <a href="https://learn.microsoft.com/powershell/module/microsoft.powershell.diagnostics/get-winevent" target="_blank" rel="noopener noreferrer">Microsoft Learn: Get-WinEvent</a>.</p>
        <pre class="command-block"><code>Get-WinEvent -FilterHashtable @{LogName='System'; Level=1,2,3; StartTime=(Get-Date).AddDays(-3)} -MaxEvents 100 | Format-List TimeCreated, ProviderName, Id</code></pre>
        <p class="muted">Level 1, 2 and 3 are Critical, Error and Warning. If there are too many records, lower the -MaxEvents value or narrow StartTime to the day the symptom happened.</p>
      </section>

      <section class="card" id="ela-ps" hidden>
        <h3>Build a collection command for your symptom</h3>
        <p>Choose a symptom and a period and the page builds a PowerShell command that collects only the matching events. Paste the command into PowerShell, run it, and paste the output into the box above.</p>
        <div class="button-row">
          <label>Symptom <select id="ela-ps-symptom"></select></label>
          <label>Period <select id="ela-ps-days"></select></label>
          <label>Count <select id="ela-ps-max"></select></label>
        </div>
        <p class="muted" style="margin-bottom:0">Custom date range (optional): choosing dates overrides the “Period” above.</p>
        <div class="button-row" style="margin-top:8px">
          <label>Start date <input type="date" class="ela-date" id="ela-ps-from"></label>
          <label>End date <input type="date" class="ela-date" id="ela-ps-to"></label>
        </div>
        <p class="muted" id="ela-ps-range-note" aria-live="polite"></p>
        <p class="muted" id="ela-ps-desc"></p>
        <pre class="command-block"><code id="ela-ps-cmd"></code></pre>
        <div class="button-row"><button class="btn secondary" type="button" id="ela-ps-copy">Copy command</button></div>
        <h4 style="margin:18px 0 6px">How to use the command</h4>
        <ol class="mini-list">
          <li><strong>Copy the command</strong>: press “Copy command” above.</li>
          <li><strong>Open PowerShell</strong>: right-click the Start button and choose <em>Windows PowerShell</em> (<em>Terminal</em> on Windows 11). Administrator rights are not needed. Check that <code>PS</code> appears at the start of the prompt; this command does not work in Command Prompt (cmd).</li>
          <li><strong>Paste and run</strong>: right-click in the PowerShell window or press <kbd>Ctrl</kbd>+<kbd>V</kbd> to paste, then press <kbd>Enter</kbd>. After a few seconds the events are listed as <code>TimeCreated</code>, <code>ProviderName</code> and <code>Id</code> lines. If nothing appears, there were no such events in that period, so widen it.</li>
          <li><strong>Copy the output</strong>: select the output by dragging with the mouse and copy it (in the classic console window, select and right-click; in Terminal press <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>C</kbd>). If there are more lines than fit on the screen, scroll up and select from the start to the end, or lower the “Count” above and run again.</li>
          <li><strong>Analyze</strong>: paste what you copied into the box at the top of this page and press “Analyze”.</li>
        </ol>
        <p class="muted">This command only reads the event log; it does not change settings or files. The output contains only the record time, the source name and the event ID, not the computer name or user name.</p>
        <p class="muted">The System and Application logs can be read with normal PowerShell rights. If there is no result, the output is empty without an error. Widen the period or change the symptom. If there were several restarts, it is easier to read when you narrow the period to the day the symptom occurred.</p>
      </section>

      <section class="card">
        <h3>How to read the result</h3>
        <ul class="mini-list">
          <li><strong>Source and ID are a pair.</strong> The same number means something different when the source differs. Event 7001 means different things for Service Control Manager and Winlogon, 1001 for BugCheck, Windows Error Reporting and DHCP-Client, and 153 for Disk and nvlddmkm. So the tool does not guess at records with no source and shows only the candidates that use the same ID.</li>
          <li><strong>The level badge is the usual weight of that kind of event.</strong> The Critical, Error, Warning and Information badges say how seriously such an event is normally treated; they are not a verdict that your PC is at that level. Even for the same warning, a record seen once and one repeated dozens of times a day should be read differently.</li>
          <li><strong>“These patterns appear”</strong> narrows where to suspect first from the combination of events. It separates storage, WHEA hardware errors, graphics driver, blue screen, sleep/resume, device start problems, service failures, update/install failures, wireless/wired connection problems and sign-in failure paths. It does not confirm a cause.</li>
          <li><strong>The distribution over time</strong> appears when there are 5 or more records with times. Within 48 hours the bars are one hour each, otherwise one day each, and periods that include restart records are orange. If records cluster in one period it is a clue to recall what you were doing then.</li>
          <li><strong>Logs worth collecting</strong> points out clues missing from the pasted range, for example restarts with no blue screen or WHEA records, or records whose time or source could not be read.</li>
          <li><strong>Comparison with the previous analysis</strong> appears when you collect again with the same command after a fix and press “Analyze” once more. It separates events that disappeared, events still seen and new events. The previous result lives only in this tab's memory while the page is open and is not saved.</li>
          <li><strong>Narrowing the results</strong> appears when there are 4 or more distinct events. You can filter the cards below by level, by whether there is an explanation, by 3 or more repeats, and sort by importance, repeat count or recency; it changes only the screen, and your input is unchanged.</li>
          <li><strong>The format read and time recognition</strong> are shown in the status line at the top of the result. Check that it was read in the format you intended (XML, PowerShell, General tab) and how many records had a readable time. Without times, the before/after records and the distribution cannot be built.</li>
          <li><strong>Records before and after restarts</strong> appear only when Kernel-Power 41 or EventLog 6008 is present and times were pasted. A restart record only records the result “not shut down normally”, so what came before it is the clue that narrows the cause. A preceding record is not evidence of the cause, though.</li>
          <li><strong>Events without an explanation</strong> are shown separately as dashed cards. The tool does not pretend to explain every event: it points to a Microsoft Learn search and offers a link to the contact page to request one. Please enter the source and event ID in the form. Explanations are in English for ${enCount} common events and the informational-record groups; for others the Korean explanation is linked where one exists.</li>
        </ul>
      </section>

      <section class="card">
        <h3>What this tool does not do</h3>
        <ul class="mini-list">
          <li>It does not conclude from one event that a power supply, memory or SSD is faulty. An event is a record of what Windows saw.</li>
          <li>No AI writes text for it. It shows an explanation only when the event matches data registered on this site.</li>
          <li>It neither reads nor stores values such as computer names, user names or IP addresses. The analysis uses only the source, the event ID and the record time.</li>
          <li>For a combined analysis of symptoms, error codes and parts, or to load a .evtx file directly, use the <a href="/diagnostic.html" hreflang="ko" lang="ko">diagnostic tool (Korean)</a>. This page is a light tool that quickly organizes pasted records by event.</li>
        </ul>
      </section>

      <section class="card">
        <h3>Frequently checked events</h3>
        <div class="link-list">
${popular.map(([slug, label]) => `          <a href="/en/event-${slug}.html">${esc(label)}</a>`).join("\n")}
          <a href="/en/">All English event guides</a>
        </div>
      </section>

      <section class="card">
        <h3>Frequently asked questions</h3>
${faq.map(([q, a]) => `        <h4>${esc(q)}</h4>\n        <p>${esc(a)}</p>`).join("\n")}
      </section>
      <p><a href="/event-log-analyzer.html" hreflang="ko" lang="ko">한국어 버전 (Korean edition)</a></p>
    </section>
  </main>
${footer}
  <script defer src="/${dataRef}"></script>
  <script defer src="/${enDataRef}"></script>
  <script defer src="/${builderRef}"></script>
  <script defer src="/${analyzerRef}"></script>
  <script defer src="/${uiInitRef}"></script>
</body>
</html>
`;
}
