// en/display-resolution-check.html — the English edition of the monitor resolution / refresh rate check.
// The behavior is display-resolution-check.js (it switches to English when <html lang="en">); this script only writes the static English page.
// Keep it in step with display-resolution-check.html (Korean). Run: node scripts/generate-display-resolution-page-en.mjs
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const R = createRequire(import.meta.url)(path.join(ROOT, "display-resolution-check.js"));
R.setLang("en");

const ko = fs.readFileSync(path.join(ROOT, "display-resolution-check.html"), "utf8");
const css = /<style>[\s\S]*?<\/style>/.exec(ko)[0];
const tokens = {
  js: /display-resolution-check\.js\?v=([A-Za-z0-9]+)/.exec(ko)[1],
  style: /style\.css\?v=([A-Za-z0-9-]+)/.exec(ko)[1],
};
const URL = "https://itsvc.co.kr/en/display-resolution-check.html";
const KO_URL = "https://itsvc.co.kr/display-resolution-check.html";
const TITLE = "Monitor Resolution & Refresh Rate Check — Not at the Best Resolution After Changing a Monitor | PC Windows Diagnostic Center";
const DESC = "After changing a monitor that does not run at its best resolution, check the resolution, scale and refresh rate your PC outputs now, compare them with the monitor's best specification, and see which part to improve: the graphics card, the cable or an adapter. Calculated in your browser only.";

const nat = ["1366x768", "1600x900", "1920x1080", "1920x1200", "2560x1080", "2560x1440", "2560x1600", "3440x1440", "3840x1080", "3840x1600", "3840x2160", "5120x1440", "5120x2160"];
const natOptions = '<option value="" selected>I am not sure (check with the methods below)</option>' +
  nat.map((o) => { const [w, h] = o.split("x"); return `<option value="${o}">${R.friendlyName(+w, +h)} — ${w} × ${h}</option>`; }).join("") +
  '<option value="custom">Not in the list (enter the numbers)</option>';
const hzOptions = '<option value="" selected>I do not know</option>' + [60, 75, 100, 120, 144, 165, 180, 240, 360].map((h) => `<option value="${h}">${h} Hz</option>`).join("");
const cmd = /<pre class="rc-cmd" id="rc-cmd">([\s\S]*?)<\/pre>/.exec(ko)[1];   // already HTML-escaped; the command is plain ASCII

const jsonLd = [
  { "@context": "https://schema.org", "@type": "WebApplication", name: "Monitor Resolution & Refresh Rate Check", applicationCategory: "UtilitiesApplication", operatingSystem: "Windows", url: URL, inLanguage: "en",
    description: "A browser tool that shows the resolution, scale and refresh rate your PC outputs now, compares them with the monitor's best specification, and explains what to improve.", offers: { "@type": "Offer", price: "0", priceCurrency: "KRW" } },
  { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "Event ID guide", item: "https://itsvc.co.kr/en/" },
    { "@type": "ListItem", position: 2, name: "Resolution & refresh rate check", item: URL } ] },
].map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n");

const html = `<!doctype html>
<html lang="en">
<head><script async src="https://www.googletagmanager.com/gtag/js?id=G-EQK19KNQR6"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EQK19KNQR6');</script>
  <meta charset="utf-8">
  <link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${TITLE}</title>
  <meta name="description" content="${DESC}">
  <link rel="canonical" href="${URL}">
  <link rel="alternate" hreflang="en" href="${URL}">
  <link rel="alternate" hreflang="ko" href="${KO_URL}">
  <link rel="alternate" hreflang="x-default" href="${KO_URL}">
${jsonLd}
  <meta property="og:title" content="Monitor Resolution & Refresh Rate Check"><meta property="og:description" content="After changing a monitor that does not run at its best resolution, compare what your PC outputs now with the monitor's best specification."><meta property="og:url" content="${URL}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary_large_image"><meta property="og:image" content="https://itsvc.co.kr/assets/og-share.jpg">
  <link rel="stylesheet" href="/style.css?v=${tokens.style}">
  ${css}
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="/en/" aria-label="English home">PC</a><div><p class="eyebrow">Tool</p><h1>Resolution &amp; Refresh Rate Check</h1></div></div>
    <nav class="nav" aria-label="Main menu"><a href="/en/">Event ID guide</a><a href="/en/event-log-analyzer.html">Event log analyzer</a><a href="/en/ssd-health-check.html">SSD health check</a><a href="/en/display-resolution-check.html">Resolution check</a><a href="/display-resolution-check.html" hreflang="ko" lang="ko">한국어 사이트</a></nav>
  </header>
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">Resolution &amp; refresh rate check</span></div></nav>
  <main id="content" class="page">
    <section class="section">
      <p class="eyebrow">DISPLAY RESOLUTION CHECK</p>
      <h2>Monitor Resolution &amp; Refresh Rate Check</h2>
      <p class="lead">After you change a monitor, the picture may look blurry or stretched, or the refresh rate may not match. This tool shows the resolution, scale and refresh rate your PC outputs now, compares them with the monitor's best specification, and tells you which part to improve. The calculation happens in your browser, and what you enter or paste is not sent to a server.</p>
      <div class="rc-warnbox"><strong>Good to know first:</strong> a browser cannot read the monitor's best (native) resolution directly. You need to tell it in step 2, either by running the check file, by pasting a PowerShell result or by choosing it yourself. In Windows, the value marked <strong>"(Recommended)"</strong> in the resolution list is usually the one that fits the monitor.</div>

      <section class="card" id="rc-step1">
        <h3>1. What the monitor this window is on outputs now (browser view)</h3>
        <p class="rc-note">With several monitors, move this window onto the monitor you want to check and reload. It is only accurate when the browser zoom is 100% (Ctrl+0).</p>
        <table class="rc-table"><tbody>
          <tr><th>Resolution being output now</th><td id="rc-cur-res">Checking…</td></tr>
          <tr><th>Windows scale (estimate)</th><td id="rc-cur-scale">Checking…</td></tr>
          <tr><th>Screen size after scaling (for reference)</th><td id="rc-cur-css">Checking…</td></tr>
          <tr><th>Measured refresh rate (approximate)</th><td id="rc-hz">Not measured yet.</td></tr>
        </tbody></table>
        <div class="rc-warnbox" id="rc-zoom-warn" hidden>The scale value does not look like a Windows scale (100%, 125%, 150% and so on). If you zoomed the browser in or out, press Ctrl+0 to return to 100% and reload.</div>
        <div class="rc-row"><button class="btn secondary" type="button" id="rc-measure">Measure refresh rate (about 2 s)</button></div>
        <p class="rc-note">The refresh rate is an approximation measured from the screen update interval. It can read low if this window is covered, a laptop is in power saving, or Windows 11 Dynamic Refresh Rate (DRR) is on.</p>
      </section>

      <section class="card" id="rc-step2">
        <h3>2. Find out your monitor's best specification</h3>
        <p class="rc-note">A browser cannot read what the monitor reports. Tell it with one of the three methods below. <strong>Method 1 is the easiest.</strong></p>

        <h4>Method 1 · Run the check file and you are done (easiest)</h4>
        <ol class="mini-list">
          <li>Download the <strong>check file</strong> with the button below.</li>
          <li><strong>Double-click</strong> the downloaded file. Administrator rights are not needed.</li>
          <li>After a moment, <strong>the browser fills in the result and compares it for you.</strong> No copy and paste is needed.</li>
        </ol>
        <div class="button-row" style="margin-top:10px"><a class="btn primary" href="/assets/itsvc-display-check-en.bat" download>Download the check file</a></div>
        <p class="rc-note">It reads the best (preferred) resolution and supported modes the monitor reports, the monitor name, and the resolution and refresh rate the graphics adapter is using now. It is read-only: it changes no settings and deletes no files, and the result is handed only to the browser on this PC (the value after # in the address is not sent to a server, and the page removes it from the address right after reading it).</p>
        <details>
          <summary>Does a warning appear when you download it?</summary>
          <div>
            <p>If the browser says "This file may be dangerous", choose <strong>Keep</strong>. If "Publisher could not be verified" or the "Windows protected your PC" window appears when you run it, click <strong>More info → Run</strong>. This warning always appears for executable files downloaded from the internet. If you are worried, check the content below first or use Method 2 or 3.</p>
          </div>
        </details>
        <details id="rc-bat-source">
          <summary>Preview the content of the check file</summary>
          <pre id="rc-bat-text" class="rc-cmd" style="max-height:340px;overflow:auto">Loads when you open this.</pre>
        </details>

        <details class="rc-ps">
          <summary><strong>Method 2 · Run a PowerShell command yourself and paste the result</strong></summary>
          <p class="rc-note">Open PowerShell in Windows (right-click the Start button and choose "Terminal"), paste the line below, press Enter, and paste what it prints into the box below. The command only reads and changes no settings. It reads the "preferred mode" from the information the monitor reports about its supported modes (WmiMonitorListedSupportedSourceModes in WMI).</p>
          <pre class="rc-cmd" id="rc-cmd">${cmd}</pre>
          <div class="rc-row"><button class="btn secondary" type="button" id="rc-copy">Copy command</button></div>
          <label><span>Paste the PowerShell result here</span>
            <textarea class="code-input rc-paste" id="rc-paste" placeholder="Preferred=2560x1440@59.95;MaxHzAtPreferred=144;Monitor=..." spellcheck="false"></textarea>
          </label>
          <div class="rc-row"><button class="btn secondary" type="button" id="rc-apply">Apply the pasted value</button></div>
          <p class="rc-note" id="rc-paste-status" aria-live="polite"></p>
          <p class="rc-note">Limit: the list the monitor reports may contain only some of its modes, so the maximum refresh rate can read lower than the real one, or the list can be empty. In that case choose the values yourself below.</p>
        </details>

        <h4 style="margin-top:18px">Method 3 · Choose it yourself</h4>
        <div class="event-fields">
          <label><span>My monitor's best resolution</span>
            <select class="code-input" id="rc-native">${natOptions}</select>
          </label>
          <label><span>Monitor's maximum refresh rate</span>
            <select class="code-input" id="rc-maxhz">${hzOptions}</select>
          </label>
        </div>
        <div class="event-fields" id="rc-custom" hidden>
          <label><span>Width (pixels)</span><input class="code-input" id="rc-nat-w" type="number" min="320" max="16384" step="1" inputmode="numeric"></label>
          <label><span>Height (pixels)</span><input class="code-input" id="rc-nat-h" type="number" min="240" max="16384" step="1" inputmode="numeric"></label>
        </div>
        <details class="rc-howto">
          <summary>I do not know the numbers — how to find the (Recommended) value</summary>
          <ol class="mini-list">
            <li><strong>Easiest:</strong> open Settings (Win+I) &gt; System &gt; Display and find the line marked <strong>"(Recommended)"</strong> in the "Display resolution" list. That value is usually the one that fits the monitor. Pick the same name (FHD, QHD, 4K and so on) or the same numbers in the box above.</li>
            <li><strong>By model name:</strong> search the model name on the sticker on the back of the monitor, on the start-up screen or on the box, and check the "resolution" in the manufacturer's specification.</li>
            <li><strong>Fill it in automatically:</strong> Method 1 (the check file) or Method 2 (the command) fills it in even if you do not know the numbers.</li>
          </ol>
          <p class="rc-note">The names are common labels. FHD means 1920×1080, QHD (2K) means 2560×1440 and UHD (4K) means 3840×2160. The monitor size alone does not tell you the resolution; even the same size differs by product.</p>
        </details>
        <div class="button-row" style="margin-top:16px">
          <button class="btn primary" type="button" id="rc-compare">Compare with the current values</button>
        </div>
      </section>

      <section class="card" id="rc-auto" hidden>
        <h3>Check file result</h3>
        <div class="rc-warnbox" id="rc-auto-err" hidden></div>
        <div id="rc-monitor-pick-wrap" hidden>
          <label><span>Monitor to check</span><select class="code-input" id="rc-monitor-pick"></select></label>
        </div>
        <ul class="mini-list" id="rc-auto-info"></ul>
      </section>

      <div class="card" id="rc-report" aria-live="polite" hidden></div>

      <section class="card" id="rc-step3">
        <h3>3. Sharpness and aspect ratio test patterns</h3>
        <p class="rc-note">Viewing it full screen is more accurate. If the monitor is not at its best resolution, it stretches or shrinks the picture, so 1-pixel patterns and text get blurry. If the scale is not 100%, the 1-pixel mapping may not be exact. For dead pixels, the Korean site has a <a href="/device-test.html" hreflang="ko" lang="ko">device test</a> page.</p>
        <div class="rc-row" role="group" aria-label="Choose a test pattern">
          <button class="btn secondary" type="button" data-rc-pattern="grid" aria-pressed="true">1-pixel pattern</button>
          <button class="btn secondary" type="button" data-rc-pattern="text" aria-pressed="false">Text sharpness</button>
          <button class="btn secondary" type="button" data-rc-pattern="shape" aria-pressed="false">Aspect ratio (circle and square)</button>
          <button class="btn secondary" type="button" data-rc-pattern="ramp" aria-pressed="false">Color bands</button>
          <button class="btn secondary" type="button" id="rc-fs">Toggle full screen</button>
        </div>
        <div class="rc-stage" id="rc-stage"><canvas id="rc-canvas" aria-label="Resolution test pattern"></canvas></div>
        <p class="rc-note" id="rc-pattern-hint"></p>
      </section>

      <section class="card" id="rc-ports">
        <h3>Differences by connection type (VGA, DVI, HDMI, DisplayPort)</h3>
        <p class="rc-note">The resolution and refresh rate only appear if the monitor, the graphics card's output port, the cable and the monitor input all support them. The lowest specification sets the limit for the whole chain. The figures below are the general standards in manufacturers' support documents and differ by product, so also check the specifications of your port and monitor.</p>
        <div style="overflow-x:auto">
        <table class="rc-table rc-ports-table">
          <thead><tr><th>Connection</th><th>Signal</th><th>Audio</th><th>Typical maximum resolution and refresh rate</th></tr></thead>
          <tbody>
            <tr><td><strong>VGA</strong> (RGB, D-Sub)</td><td>Analog</td><td>No</td><td>Mostly up to 1920×1080 (Full HD). Some hardware can go higher, but picture quality drops noticeably as the resolution rises. Even at the same resolution it is softer than a digital connection.</td></tr>
            <tr><td><strong>DVI</strong></td><td>Digital</td><td>No</td><td>Single-link up to 1920×1200 at 60 Hz, dual-link up to 2560×1440 at 60 Hz.</td></tr>
            <tr><td><strong>HDMI</strong></td><td>Digital</td><td>Yes</td><td>HDMI 1.4: 4K up to 30 Hz · HDMI 2.0: 4K at 60 Hz · HDMI 2.1: 8K at 60 Hz or 4K at 120 Hz.</td></tr>
            <tr><td><strong>DisplayPort</strong></td><td>Digital</td><td>Yes</td><td>DP 1.2: 4K at 60 Hz · DP 1.3: 4K at 120 Hz or 5K at 60 Hz · DP 1.4: 4K at 120 Hz without compression (DSC), 8K at 60 Hz with DSC.</td></tr>
          </tbody>
        </table>
        </div>
        <ul class="mini-list">
          <li><strong>Audio:</strong> VGA and DVI carry video only, so you need a separate cable for sound. HDMI and DisplayPort carry video and audio together.</li>
          <li><strong>Picture quality:</strong> VGA is analog, so even at the same resolution it is less sharp than digital (DVI, HDMI, DisplayPort). Use a digital connection when you can.</li>
          <li><strong>Where you see them:</strong> DisplayPort is common on desktops, graphics cards and gaming monitors; HDMI is common on TVs, game consoles and laptops.</li>
          <li><strong>USB-C ports:</strong> not every USB-C port outputs video. Check whether there is a DisplayPort or Thunderbolt mark next to the port, and in the product specifications.</li>
          <li><strong>Version numbers:</strong> the higher the HDMI or DisplayPort version, the higher the resolution and refresh rate it supports. The cable grade can also be the limit. The official HDMI site distinguishes "Premium High Speed" cables (certified for 18 Gbps, for features such as 4K@60Hz) from "Ultra High Speed" cables for HDMI 2.1 (up to 48 Gbps), and warns that some cables are counterfeit.</li>
        </ul>
        <p class="rc-note">Sources: Dell support document "Understanding Video Cables: Which One Do You Need", the official HDMI Licensing Administrator site (HDMI 1.4b specification, Premium High Speed cables), and the official VESA site (DisplayPort certified components database).</p>
      </section>

      <section class="card" id="rc-adapters">
        <h3>What changes when you use an adapter</h3>
        <p class="rc-note">When the port types differ and you use an adapter, the resolution, refresh rate, audio and stability can change. Connecting the same kind of port directly with one cable is the most stable (Dell guidance).</p>
        <ul class="mini-list">
          <li><strong>An adapter has a direction:</strong> a DisplayPort-to-HDMI adapter cannot be used in reverse (HDMI to DisplayPort). Check the port on the sending side (graphics card, laptop, game console) and on the receiving side (monitor, TV) and choose an adapter for that direction.</li>
          <li><strong>Passive adapters:</strong> there is no chip inside and the graphics card does the signal conversion. They work only for DisplayPort to HDMI, the graphics card must support DP++ (dual-mode DisplayPort), and they suit a single monitor. The resolution is generally up to 4K at 60 Hz depending on the adapter's quality. They do not work in AMD Eyefinity or NVIDIA Surround multi-monitor setups.</li>
          <li><strong>Active adapters:</strong> a conversion chip inside converts the signal regardless of the graphics card. <strong>HDMI to DisplayPort, DisplayPort to DVI and DisplayPort to VGA (digital to analog) always need an active adapter</strong>, and DisplayPort to HDMI also needs an active one when you use several monitors or DP++ is not supported. A product with a USB power cable must be plugged into a USB port on the PC for power.</li>
          <li><strong>The resolution and refresh rate follow the adapter's specification:</strong> check before buying which resolutions and refresh rates (60 Hz, 120 Hz, 144 Hz and so on) the adapter supports and whether it passes audio. Even if the monitor and graphics card support them, a lower adapter can limit the result.</li>
          <li><strong>Audio:</strong> converting to DVI or VGA does not carry sound.</li>
          <li><strong>HDMI connector adapters:</strong> the official HDMI site says each HDMI passive adapter has product-specific usage limitations. Check that the product meets the compliance guideline and read the manufacturer's specification.</li>
          <li><strong>How to check:</strong> when the resolution or refresh rate does not appear, take out the adapter, hub or docking station and test with a direct connection. If it works directly, the adapter was the cause.</li>
        </ul>
        <p class="rc-note">Sources: Dell support documents "HDMI to DisplayPort Adapter: A Simple Guide" and "Understanding Video Cables: Which One Do You Need", and the official HDMI Licensing Administrator site (HDMI Passive Adapters).</p>
      </section>

      <section class="card">
        <h3>How to change the resolution and refresh rate in Windows</h3>
        <ol class="mini-list">
          <li>Open Settings (Win+I) &gt; System &gt; Display. With several monitors, first select the one you want to change.</li>
          <li>In the "Display resolution" list, choose the value marked <strong>"(Recommended)"</strong>. Microsoft usually advises using the recommended value. A resolution lower than the best one makes text less sharp and can make the picture look small, centered with black edges, or stretched.</li>
          <li>If text feels too small or too large, choose "(Recommended)" under "Scale" on the same screen. That adjusts the scale, not the resolution.</li>
          <li>Change the refresh rate under Settings &gt; System &gt; Display &gt; Advanced display, with "Choose a refresh rate". "Display information" on the same screen shows the current resolution and refresh rate. A refresh rate marked with an asterisk (*) is not supported at the current resolution, and choosing it changes the resolution.</li>
          <li>If the resolution changes in unexpected ways, the graphics driver may need an update. You can get it from Settings &gt; Windows Update &gt; Check for updates.</li>
        </ol>
        <p class="rc-note">Sources: Microsoft Support "Change your screen resolution and layout in Windows" and "Change the refresh rate on your monitor in Windows".</p>
      </section>

      <section class="card">
        <h3>Checklist after replacing a monitor</h3>
        <ol class="mini-list">
          <li>On a desktop, check that the monitor cable is in a graphics card port and not a motherboard port.</li>
          <li>Choose the "(Recommended)" value under "Display resolution" and the refresh rate as described above.</li>
          <li>If the best resolution or a high refresh rate is not in the "(Recommended)" list, update the graphics driver.</li>
          <li>If it is still missing, check the cable and the port (a general check not in the documentation): is it a cable for a standard the monitor supports, and does the result change if you switch between HDMI and DisplayPort?</li>
          <li>In the monitor's menu (OSD), check that the input source and that input's settings (mode, signal format and so on) are right. Names and positions differ by manufacturer.</li>
          <li>Finally, check the sharpness and the aspect ratio by eye with the test patterns above.</li>
        </ol>
        <div class="link-list">
          <a href="/en/ssd-health-check.html">SSD health check</a>
          <a href="/en/event-log-analyzer.html">Event log analyzer</a>
        </div>
      </section>

      <section class="card">
        <h3>How it is measured, and its limits</h3>
        <ul class="mini-list">
          <li>Output resolution = the screen size the browser reports × the scale (devicePixelRatio). It can be wrong if the browser zoom is not 100%.</li>
          <li>The refresh rate is the median screen update interval over about 2 seconds, shown rounded to a nearby common value (60, 75, 120, 144 Hz and so on).</li>
          <li>The browser cannot know the monitor's best resolution, so you choose it or paste the PowerShell result. The "preferred mode" in the PowerShell result is what the monitor reports, and the list may be only partial depending on the monitor and the cable.</li>
          <li>This tool is a reference to help your diagnosis. It cannot confirm a cause.</li>
        </ul>
      </section>
      <p><a href="/display-resolution-check.html" hreflang="ko" lang="ko">한국어 버전 (Korean edition)</a></p>
    </section>
  </main>
  <footer class="site-footer">
    <p>© 2026 PC Windows Diagnostic Center</p>
    <p class="footer-links"><a href="/en/">Event ID guide</a> · <a href="/en/event-log-analyzer.html">Event log analyzer</a> · <a href="/en/ssd-health-check.html">SSD health check</a> · <a href="/en/display-resolution-check.html">Resolution check</a> · <a href="/about.html" lang="ko">About (Korean)</a> · <a href="/privacy.html" lang="ko">Privacy policy (Korean)</a></p>
  </footer>
  <script defer src="/display-resolution-check.js?v=${tokens.js}"></script>
  <script defer src="/ui-init.js?v=init-cmd-20261120d"></script>
  <script defer src="/en-chrome.js?v=en-chrome-20261124a"></script>
</body>
</html>
`;
fs.writeFileSync(path.join(ROOT, "en/display-resolution-check.html"), html);
console.log("en/display-resolution-check.html written (" + (html.length / 1024).toFixed(1) + " KB)");
