// English self-check (wizard) pages: writes en/pc-<kind>-check.html from the config below, links each Korean
// pc-<kind>-check.html to its English edition with hreflang + an "English version" link (idempotent patch) and adds
// the English URLs to sitemap.xml.
//
//   node scripts/generate-wizard-pages-en.mjs
//
// The question flow and step text live in wizard-<kind>-en.js, the screen text in wizard-ui-en.js, and the engine is
// the shared symptom-wizard.js. Only wizards that have wizard-<kind>-en.js appear in WIZARDS_READY.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const SITE = "https://itsvc.co.kr";
const now = new Date();
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; // local date (not UTC)
const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const koIndex = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assetRef = (asset) => {
  const m = koIndex.match(new RegExp(`="(${asset.replace(".", "\\.")}(?:\\?v=[a-zA-Z0-9-]+)?)"`));
  return m ? m[1] : asset;
};
const koStorage = fs.readFileSync(path.join(root, "pc-storage-check.html"), "utf8");
const tok = (name) => (koStorage.match(new RegExp(`${name.replace(".", "\\.")}\\?v=([A-Za-z0-9-]+)`)) || [])[1];
const STYLE = assetRef("style.css");
const WIZ_CSS_V = tok("symptom-wizard.css");
const WIZ_JS_V = tok("symptom-wizard.js");
const enHtml = fs.readFileSync(path.join(root, "en/ssd-health-check.html"), "utf8");
const UI_INIT = (enHtml.match(/\/ui-init\.js\?v=[A-Za-z0-9-]+/) || ["/ui-init.js"])[0];
const EN_CHROME = (enHtml.match(/\/en-chrome\.js\?v=[A-Za-z0-9-]+/) || ["/en-chrome.js"])[0];
const GA = enHtml.split("\n")[2];
const EN_DATA_V = "20261122b";

export const WIZARDS = {
  storage: {
    short: "Storage & Data Self-Check", nav: "Storage self-check",
    title: "Storage & Data Self-Check — External Drive Not Detected, C: Drive Full, Data at Risk",
    desc: "Pick a symptom — an external drive that is not detected, a full C: drive, a deleted file, a file you cannot delete, or an SSD you want to check — and get step by step what to try, what you need and how to do it, with your data protected first.",
    og: "Step by step checks for a drive that is not detected or a full C: drive, with your data protected first.",
    eyebrow: "STORAGE CHECK",
    lead: "This tool sorts external drive and USB detection, internal SSD or HDD detection, a full C: drive, deleted files and files that will not open, files that cannot be deleted, and SSD health checks into questions. For symptoms where your data is at stake, it steers you away from risky attempts such as formatting or resetting.",
    list: ["An external hard drive or USB drive is not detected", "An internal SSD or HDD is missing, even in the BIOS", "The C: drive is running out of space", "A file was deleted by mistake, or will not open", "A file cannot be deleted because it is in use", "I want to check whether my SSD is healthy"],
    card: [["What it does", "puts protecting your data first and guides you step by step, starting with checks that do not touch the data: ports, cables, Disk Management and BIOS detection."], ["What it does not do", "it cannot recover deleted data or a damaged disk for you. If the data is important, it is safer to ask a professional before you run recovery software yourself."], ["What it does not cover", "NAS-specific symptoms."]],
    faqs: [["A window asks me to format the disk when I connect it. Is it OK to click it?", "If you need the data, do not click it. Formatting erases the data. This prompt also appears when Windows cannot read the file system, so the data may still be there."], ["Will cleaning up the C: drive delete my files?", "Cleaning temporary files and update leftovers does not affect ordinary documents. But check the Downloads folder yourself first and delete only when it holds nothing you need."]],
  },
  input: {
    short: "Input & Sound Self-Check", nav: "Input & sound self-check",
    title: "Keyboard, Mouse, Sound, Microphone & Bluetooth Not Working — Self-Check",
    desc: "When a keyboard, mouse or touchpad does not work, or sound, a microphone, a webcam, Bluetooth or a USB device is not picked up, pick the symptom and get step by step what to try, what you need and how to do it.",
    og: "A self-check for a keyboard, sound, microphone or Bluetooth that stops working, step by step.",
    eyebrow: "INPUT CHECK",
    lead: "This tool sorts keyboard and mouse detection, single keys that fail, the laptop touchpad, sound, sound from only one earphone, the microphone, the webcam, Bluetooth and USB detection into questions. Each step shows what you need and how to do it, and if it is too hard to do yourself, it tells you what to do next.",
    list: ["A keyboard or mouse is not detected", "Only certain keyboard keys do not press", "The laptop touchpad does not work", "There is no sound", "The microphone is not picked up", "A Bluetooth device cannot be found", "A USB device is not detected"],
    card: [["What it does", "guides you step by step, starting with the easy checks that tell whether the device itself or the PC is the problem: ports, settings and drivers."], ["What it does not do", "it cannot confirm a fault in the internal circuit. A laptop keyboard or touchpad has to be taken apart, so it is hard to repair yourself."], ["What it does not cover", "printer and gamepad problems."]],
    faqs: [["What if only the front USB or front audio jack does not work?", "First test by plugging into the ports wired directly to the motherboard on the back of the PC (the back USB and audio jacks). If it works on the back, the front panel cable or its connection is the likely cause."], ["What is the first thing to try when a wireless device does not work?", "Replace the battery with a new one, plug the receiver into another USB port and pair the device again. It is the easiest and most common fix."]],
  },
  network: {
    short: "Internet & Network Self-Check", nav: "Internet self-check",
    title: "Internet Not Working? Wi-Fi Dropping, One Site Won't Open, Game Won't Connect — Self-Check",
    desc: "When the internet does not work or Wi-Fi keeps dropping, pick the symptom and get step by step what to try, what you need and how to do it. What you enter is processed only in your browser.",
    og: "A step by step self-check for when the internet does not work or Wi-Fi keeps dropping.",
    eyebrow: "NETWORK CHECK",
    lead: "This tool sorts the internet not working at all, Wi-Fi dropping, only certain sites not opening, a refused-connection error, the network dropping after an update, game connection errors and shared folder problems into questions. Each step shows what you need and how to do it, and if it is too hard to do yourself, it tells you what to do next.",
    list: ["The internet keeps dropping", "Wi-Fi drops or the signal is weak", "Only certain sites won't open", "A \"refused to connect\" error", "The internet stopped working after an update", "I can't connect to a game server"],
    card: [["What it does", "guides you step by step through checks that tell where the problem is: another device on the same router, another network (a phone hotspot), and wired versus wireless."], ["What it does not do", "it cannot confirm an internet provider line outage or a broken router. A line problem has to be checked with your internet provider's customer service."], ["What it does not cover", "detailed router settings (port forwarding and so on) and company network policy problems."]],
    faqs: [["Are the Command Prompt commands (ipconfig, netsh) safe?", "ipconfig /release, /renew and /flushdns get a new IP and a fresh DNS cache, and netsh winsock reset returns the network settings to their defaults. They are reversible settings resets, but on a company PC, ask the administrator first."], ["Does restarting the router erase its settings?", "Just switching the power off and on does not erase the settings. It is different from holding down the Reset button. Do not press the Reset button."]],
  },
  slow: {
    short: "Slow, Hot & Noisy PC Self-Check", nav: "Slow & noisy PC self-check",
    title: "Slow PC, Loud Fan, Overheating — Self-Check by Cause",
    desc: "When a computer gets slow, the fan gets loud or it runs hot, pick the symptom and get step by step what to try, what you need and how to do it. What you enter is processed only in your browser.",
    og: "Find the cause of a slow, hot or noisy computer, step by step.",
    eyebrow: "SLOW & NOISY PC CHECK",
    lead: "This tool sorts general slowness, slow boot-up, fan noise, shutdowns from overheating, hard drive noise, graphics card high-pitched noise and frame rate drops in games into questions. Each step shows what you need and how to do it, and if it is too hard to do yourself, it tells you what to do next.",
    list: ["The computer has become slow overall", "Booting takes a long time", "The fan got louder", "It is hot and suddenly shuts off", "The hard drive clicks", "The frame rate drops in games"],
    card: [["What it does", "guides you step by step through checks that tell the cause: what is high in Task Manager, the temperature and dust, and the condition of the storage device."], ["What it does not do", "it cannot confirm a part failure. Checks that need taking the PC apart, such as replacing thermal grease or the cooler, are left to a professional rather than done yourself."], ["What it does not cover", "a PC that does not switch on is covered by the \"PC won't start\" self-check."]],
    faqs: [["Task Manager shows the disk at 100%. Is it broken?", "No. It may be a temporary task such as a Windows update or search indexing, or a shortage of storage space. First check whether it lasts for more than a few minutes and which program is using it."], ["Can I keep using a hard drive that clicks?", "If a regular clicking repeats, the longer you keep using it the more the data can be damaged. Back up the important data first, and if the sound is severe, switch the power off and ask for help."]],
  },
  display: {
    short: "Screen Problems Self-Check", nav: "Screen self-check",
    title: "Monitor Problems Self-Check — Flicker, Stripes, External Monitor Not Showing",
    desc: "When the screen flickers, shows stripes, or an external monitor does not show, pick the symptom and get step by step what to try, what you need and how to do it. What you enter is processed only in your browser.",
    og: "A step by step self-check for a screen that flickers or corrupts.",
    eyebrow: "DISPLAY CHECK",
    lead: "This tool sorts screen flicker, stripes and corruption, external monitor detection, wrong colors, the refresh rate and a black screen after signing in into a few questions. Each step shows what you need and how to do it, and if it is too hard to do yourself, it tells you what to do next.",
    list: ["The screen flickers or shakes", "Stripes or broken color blocks appear", "An external or dual monitor does not show", "The screen colors look wrong", "A black screen after signing in", "The graphics driver stopped responding"],
    card: [["What it does", "sorts the symptom and guides you step by step through the easy checks first: cable, settings and driver. Steps that involve touching the graphics card show what you need and the cautions first."], ["What it does not do", "it cannot confirm a faulty graphics card or monitor. Confirming that takes a test with another monitor or graphics card, or an on-site check."], ["What it does not cover", "a PC that switches on but shows no picture at all is covered by the \"PC won't start\" self-check."]],
    faqs: [["How do I tell whether the flicker is the monitor or the computer?", "Connect the same monitor to another PC, or connect another monitor to this PC. If the symptom follows the monitor when you change it, it is likely the monitor; if it stays on the PC, it is likely the PC (cable, graphics card or driver)."], ["Isn't it risky to remove the graphics driver?", "Even if you remove the driver, Windows runs with a basic driver and the screen still shows. It is safer to download the latest driver from the maker's site beforehand and then go ahead."]],
  },
};

const WIZARDS_READY = Object.keys(WIZARDS).filter((k) => fs.existsSync(path.join(root, `wizard-${k}-en.js`)));

const j = (d) => JSON.stringify(d);
const render = (kind, c) => {
  const url = `${SITE}/en/pc-${kind}-check.html`;
  const ko = `${SITE}/pc-${kind}-check.html`;
  const app = { "@context": "https://schema.org", "@type": "WebApplication", name: c.short, applicationCategory: "UtilitiesApplication", dateModified: today, operatingSystem: "Any", url, inLanguage: "en", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } };
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: c.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const bc = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Event ID guide", item: `${SITE}/en/` }, { "@type": "ListItem", position: 2, name: c.short, item: url }] };
  const navLinks = WIZARDS_READY.map((k) => `<a href="/en/pc-${k}-check.html"${k === kind ? ' aria-current="page"' : ""}>${esc(WIZARDS[k].nav)}</a>`).join("");
  const footLinks = WIZARDS_READY.map((k) => `<a href="/en/pc-${k}-check.html">${esc(WIZARDS[k].nav)}</a>`).join(" · ");
  const related = WIZARDS_READY.filter((k) => k !== kind).map((k) => `<a href="/en/pc-${k}-check.html">${esc(WIZARDS[k].short)}</a>`).join("") + `<a href="/en/ssd-health-check.html">SSD health check</a><a href="/en/event-log-analyzer.html">Event log analyzer</a>`;
  return `<!doctype html>
<html lang="en">
${GA}
  <meta charset="utf-8">
  <link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${esc(c.title)} | PC Windows Diagnostic Center</title>
  <meta name="description" content="${esc(c.desc)}">
  <link rel="canonical" href="${url}">
  <link rel="alternate" hreflang="en" href="${url}">
  <link rel="alternate" hreflang="ko" href="${ko}">
  <link rel="alternate" hreflang="x-default" href="${ko}">
  <script type="application/ld+json">${j(app)}</script>
  <script type="application/ld+json">${j(faq)}</script>
  <script type="application/ld+json">${j(bc)}</script>
  <meta property="og:title" content="${esc(c.short)}"><meta property="og:description" content="${esc(c.og)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="${SITE}/assets/og-share.jpg">
  <link rel="stylesheet" href="/${STYLE}">
  <link rel="stylesheet" href="/symptom-wizard.css?v=${WIZ_CSS_V}">
</head>
<body>
  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="/en/" aria-label="English home">PC</a><div><p class="eyebrow">Tool</p><h1>${esc(c.short)}</h1></div></div>
    <nav class="nav" aria-label="Main menu"><a href="/en/">Event ID guide</a><a href="/en/event-log-analyzer.html">Event log analyzer</a><a href="/en/ssd-health-check.html">SSD health check</a>${navLinks}<a href="/pc-${kind}-check.html" hreflang="ko" lang="ko">한국어 사이트</a></nav>
  </header>
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">${esc(c.nav)}</span></div></nav>
  <main id="content" class="page">
    <section class="section">
      <p class="eyebrow">${esc(c.eyebrow)}</p>
      <h2>${esc(c.short)}</h2>
      <p class="lead">${esc(c.lead)}</p>
      <p class="tool-badge tool-badge--local"><span aria-hidden="true">🔒</span> Runs only in your browser · nothing is sent to a server</p>

      <div class="bc-stage" data-boot-check aria-live="polite">
        <div class="bc-trail" data-trail hidden></div>
        <div data-stage>
          <h3>Pick a symptom</h3>
          <ul class="mini-list">${c.list.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          <p class="muted">The question-by-question check needs JavaScript to be turned on.</p>
        </div>
        <div class="button-row bc-controls">
          <button class="btn secondary" type="button" data-back disabled>Previous question</button>
          <button class="btn secondary" type="button" data-reset hidden>Start over</button>
        </div>
      </div>

      <section class="card">
        <h3>What this tool does and does not do</h3>
        <ul class="mini-list">${c.card.map(([h, t]) => `<li><strong>${esc(h)}</strong>: ${esc(t)}</li>`).join("")}</ul>
      </section>

      <section class="card">
        <h3>Frequently asked questions</h3>
        <div class="faq-list">
${c.faqs.map(([q, a]) => `          <details class="faq-item"><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
        </div>
      </section>

      <section class="card">
        <h3>Related tools</h3>
        <div class="link-list">${related}</div>
      </section>
      <p class="muted" style="margin:1rem 0 0">Last reviewed: ${today}. English edition of our Korean self-check; it is general guidance, not a substitute for professional support.</p>
      <p><a href="/pc-${kind}-check.html" hreflang="ko" lang="ko">한국어 버전 (Korean edition)</a></p>
    </section>
  </main>
  <footer class="site-footer">
    <p>© 2026 PC Windows Diagnostic Center</p>
    <p class="footer-links"><a href="/en/">Event ID guide</a> · <a href="/en/event-log-analyzer.html">Event log analyzer</a> · <a href="/en/ssd-health-check.html">SSD health check</a> · ${footLinks} · <a href="/about.html" lang="ko">About (Korean)</a> · <a href="/privacy.html" lang="ko">Privacy policy (Korean)</a> · <a href="/terms.html" lang="ko">Terms (Korean)</a> · <a href="/contact.html" lang="ko">Contact (Korean)</a></p>
  </footer>
  <script defer src="/wizard-ui-en.js?v=${EN_DATA_V}"></script>
  <script defer src="/wizard-${kind}-en.js?v=${EN_DATA_V}"></script>
  <script defer src="/symptom-wizard.js?v=${WIZ_JS_V}"></script>
  <script defer src="${UI_INIT}"></script>
  <script defer src="${EN_CHROME}"></script>
</body>
</html>
`;
};

let sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
for (const kind of WIZARDS_READY) {
  fs.writeFileSync(path.join(root, `en/pc-${kind}-check.html`), render(kind, WIZARDS[kind]));
  // Korean page: hreflang pair + "English version" link (idempotent)
  const koPath = path.join(root, `pc-${kind}-check.html`);
  let ko = fs.readFileSync(koPath, "utf8");
  if (!ko.includes('hreflang="en"')) {
    const canon = `  <link rel="canonical" href="${SITE}/pc-${kind}-check.html">\n`;
    if (!ko.includes(canon)) throw new Error(`canonical line not found in pc-${kind}-check.html`);
    ko = ko.replace(canon, `${canon}  <link rel="alternate" hreflang="ko" href="${SITE}/pc-${kind}-check.html">\n  <link rel="alternate" hreflang="en" href="${SITE}/en/pc-${kind}-check.html">\n  <link rel="alternate" hreflang="x-default" href="${SITE}/pc-${kind}-check.html">\n`);
    const badge = '      <p class="tool-badge tool-badge--local">';
    if (ko.split(badge).length !== 2) throw new Error(`tool badge anchor not unique in pc-${kind}-check.html`);
    ko = ko.replace(badge, `      <p class="lang-switch"><a href="en/pc-${kind}-check.html" hreflang="en" lang="en">English version</a></p>\n${badge}`);
    fs.writeFileSync(koPath, ko);
  }
  const loc = `${SITE}/en/pc-${kind}-check.html`;
  if (!sitemap.includes(`<loc>${loc}</loc>`)) {
    const koLoc = `  <url><loc>${SITE}/pc-${kind}-check.html</loc>`;
    const i = sitemap.indexOf(koLoc);
    if (i < 0) throw new Error(`sitemap entry for pc-${kind}-check.html not found`);
    const end = sitemap.indexOf("\n", i) + 1;
    sitemap = sitemap.slice(0, end) + `  <url><loc>${loc}</loc><lastmod>${today}</lastmod></url>\n` + sitemap.slice(end);
  }
}
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log(`English wizard pages: ${WIZARDS_READY.join(", ")}`);
