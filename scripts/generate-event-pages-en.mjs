// English event pages (pilot): writes en/index.html and en/event-<slug>.html from
// scripts/event-en-content.mjs, links each Korean page to its English edition with
// hreflang (idempotent patch), and adds the new URLs to sitemap.xml.
//
//   node scripts/generate-event-pages-en.mjs
//
// English pages deliberately skip site.js/search (both are Korean-only); they load
// style.css and ui-init.js (table of contents) with root-absolute paths.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { eventEn, enAreaOrder } from "./event-en-content.mjs";
import { renderAnalyzerPage } from "./analyzer-en-page.mjs";
import { groups as koGroups } from "./event-group-content.mjs";
import { groupsEn, DEFAULT_WARNING } from "./event-group-content-en.mjs";

const root = path.resolve(import.meta.dirname, "..");
const SITE = "https://itsvc.co.kr";
const today = new Date().toISOString().slice(0, 10);

const referenceHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assetRef = (asset) => {
  const m = referenceHtml.match(new RegExp(`="(${asset.replace(".", "\\.")}(?:\\?v=[a-zA-Z0-9-]+)?)"`));
  return m ? m[1] : asset;
};
const STYLE = assetRef("style.css");
const UI_INIT = assetRef("ui-init.js");

const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const enFile = (slug) => `en/event-${slug}.html`;
const enUrl = (slug) => `${SITE}/${enFile(slug)}`;
const koUrl = (ev) => `${SITE}/${ev.ko}`;

const GA = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-EQK19KNQR6"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EQK19KNQR6');</script>`;
const ICONS = `<link rel="icon" href="/favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">`;
const SITE_NAME = "PC Windows Diagnostic Center";

const header = (eyebrow, h1) => `  <a class="skip-link" href="#content">Skip to content</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="/en/" aria-label="English home">PC</a><div><p class="eyebrow">${esc(eyebrow)}</p><h1>${esc(h1)}</h1></div></div>
    <nav class="nav" aria-label="Main menu"><a href="/en/">Event ID guide</a><a href="/en/event-log-analyzer.html">Event log analyzer</a><a href="/" hreflang="ko" lang="ko">한국어 사이트</a></nav>
  </header>`;

const footer = `  <footer class="site-footer">
    <p>© ${new Date().getFullYear()} ${SITE_NAME}</p>
    <p class="footer-links"><a href="/en/">Event ID guide</a> · <a href="/en/event-log-analyzer.html">Event log analyzer</a> · <a href="/about.html" lang="ko">About (Korean)</a> · <a href="/privacy.html" lang="ko">Privacy policy (Korean)</a> · <a href="/terms.html" lang="ko">Terms (Korean)</a> · <a href="/contact.html" lang="ko">Contact (Korean)</a></p>
  </footer>`;

const list = (items, tag = "ul") => `<${tag} class="mini-list">\n${items.map((i) => `          <li>${esc(i)}</li>`).join("\n")}\n      </${tag}>`;

function pageHead({ title, desc, canonical, alternates, schemas, ogType }) {
  return `<!doctype html>
<html lang="en">
<head>${GA}
  <meta charset="utf-8">
  ${ICONS}
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}">
  <link rel="canonical" href="${canonical}">
${alternates.map(([lang, href]) => `  <link rel="alternate" hreflang="${lang}" href="${href}">`).join("\n")}
${schemas.map((s) => `  <script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n")}
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(desc)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:locale" content="en_US">
  <meta name="twitter:card" content="summary">
  <link rel="stylesheet" href="/${STYLE}">
</head>`;
}

function renderEvent(slug) {
  const ev = eventEn[slug];
  const url = enUrl(slug);
  const label = `${ev.source} ${ev.id}`;
  const related = ev.related.filter((s) => eventEn[s]);

  const sections = (ev.sections || []).map(([h, items]) =>
    `      <h3>${esc(h)}</h3>\n` + (items.length === 1 ? `      <p>${esc(items[0])}</p>` : "      " + list(items))).join("\n");

  const schemas = [
    { "@context": "https://schema.org", "@type": "TechArticle", headline: ev.title, description: ev.desc, url, mainEntityOfPage: url, inLanguage: "en", dateModified: today,
      author: { "@type": "Organization", name: SITE_NAME, url: `${SITE}/en/` }, publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE}/en/` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Event ID guide", item: `${SITE}/en/` },
      { "@type": "ListItem", position: 2, name: ev.area, item: `${SITE}/en/#${areaId(ev.area)}` },
      { "@type": "ListItem", position: 3, name: label, item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: ev.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];

  return `${pageHead({ title: ev.title, desc: ev.desc, canonical: url, ogType: "article", schemas,
    alternates: [["en", url], ["ko", koUrl(ev)], ["x-default", koUrl(ev)]] })}
<body>
${header(ev.area, label)}
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><a href="/en/#${areaId(ev.area)}">${esc(ev.area)}</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">${esc(label)}</span></div></nav>
  <main id="content" class="page article article-cols">
    <div class="toc" id="page-toc">
      <h4>Contents</h4>
      <ul id="toc-list"></ul>
      <div class="toc-progress"><div class="toc-progress-bar"><div class="toc-progress-fill"></div></div></div>
    </div>
    <article class="section">
      <p class="eyebrow">EVENT ID ${esc(ev.id)}</p>
      <h2>${esc(ev.title)}</h2>
      <p class="lead">${esc(ev.lead)}</p>
${ev.body.map((p) => `      <p>${esc(p)}</p>`).join("\n")}
${sections}
      <h3>When it appears</h3>
      ${list(ev.conditions)}
      <h3>Likely causes</h3>
      ${list(ev.causes)}
      <h3>What to check, in order</h3>
      ${list(ev.checks, "ol")}
      <div class="callout"><strong>Caution</strong>
${ev.caution.map((c) => `<p>${esc(c)}</p>`).join("\n")}</div>
${related.length ? `      <h3>Related events</h3>\n      <div class="link-list">${related.map((s) => `<a href="/${enFile(s)}">${esc(eventEn[s].source)} ${esc(eventEn[s].id)}</a>`).join("")}</div>` : ""}
      <h3>Frequently asked questions</h3>
      <ul class="mini-list">
${ev.faqs.map(([q, a]) => `          <li><strong>${esc(q)}</strong> ${esc(a)}</li>`).join("\n")}
      </ul>
${ev.refs.length ? `      <h3>Official references</h3>\n      <ul class="mini-list">\n${ev.refs.map(([href, text]) => `          <li><a href="${href}" target="_blank" rel="noopener">${esc(text)}</a></li>`).join("\n")}\n      </ul>` : ""}
      <p class="muted">This page is an English edition of our Korean explanation and is general guidance, not a substitute for professional support. Last reviewed: ${today}.</p>
      <p><a href="/${ev.ko}" hreflang="ko" lang="ko">한국어 원문 보기 (Korean original)</a></p>
    </article>
    <div class="sidebar" id="page-sidebar">
      <h4>More events</h4>
      <ul>
${related.map((s) => `        <li><a href="/${enFile(s)}">${esc(eventEn[s].source)} ${esc(eventEn[s].id)}</a></li>`).join("\n")}
        <li><a href="/en/">All English event guides</a></li>
      </ul>
    </div>
  </main>
${footer}
  <script defer src="/${UI_INIT}"></script>
</body>
</html>
`;
}

// ── informational-event group pages (English editions of event-info-*.html) ──
const shortSource = (v) => v.replace(/^Microsoft-Windows-/, "");

function renderGroup(koG) {
  const g = groupsEn[koG.file];
  if (!g) throw new Error(`no English content for ${koG.file}`);
  const slug = koG.file.replace(/^event-|\.html$/g, "");
  const url = `${SITE}/en/${koG.file}`;
  const koPageUrl = `${SITE}/${koG.file}`;
  for (const k of koG.members) if (!g.rows[k]) throw new Error(`${koG.file}: missing English row for ${k}`);
  for (const k of Object.keys(g.rows)) if (!koG.members.includes(k)) throw new Error(`${koG.file}: extra English row ${k}`);
  const rows = koG.members.map((key) => {
    const sp = key.lastIndexOf(" ");
    const label = `${shortSource(key.slice(0, sp))} ${key.slice(sp + 1)}`;
    return `            <tr><th scope="row">${esc(label)}</th><td>${esc(g.rows[key][0])}</td><td>${esc(g.rows[key][1])}</td></tr>`;
  }).join("\n");
  const siblings = koGroups.filter((x) => x.file !== koG.file);
  const schemas = [
    { "@context": "https://schema.org", "@type": "TechArticle", headline: g.title, description: g.desc, url, mainEntityOfPage: url, inLanguage: "en", dateModified: today,
      author: { "@type": "Organization", name: SITE_NAME, url: `${SITE}/en/` }, publisher: { "@type": "Organization", name: SITE_NAME, url: `${SITE}/en/` } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Event ID guide", item: `${SITE}/en/` },
      { "@type": "ListItem", position: 2, name: "Informational records", item: `${SITE}/en/#informational-records` },
      { "@type": "ListItem", position: 3, name: g.short, item: url } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }
  ];
  return `${pageHead({ title: g.title, desc: g.desc, canonical: url, ogType: "article", schemas,
    alternates: [["en", url], ["ko", koPageUrl], ["x-default", koPageUrl]] })}
<body>
${header(g.eyebrow, "Informational events explained")}
  <nav class="breadcrumb" aria-label="Breadcrumb"><div class="breadcrumb-inner"><a href="/en/">Event ID guide</a><span class="bc-sep" aria-hidden="true">/</span><a href="/en/#informational-records">Informational records</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">${esc(g.short)}</span></div></nav>
  <main id="content" class="page article article-cols">
    <div class="toc" id="page-toc">
      <h4>Contents</h4>
      <ul id="toc-list"></ul>
      <div class="toc-progress"><div class="toc-progress-bar"><div class="toc-progress-fill"></div></div></div>
    </div>
    <article class="section">
      <p class="eyebrow">${koG.members.length} INFORMATION-LEVEL EVENTS</p>
      <h2>${esc(g.title)}</h2>
      <p class="lead">${esc(g.lead)}</p>
${g.intro.map((p) => `      <p>${esc(p)}</p>`).join("\n")}
      <h3>The records explained on this page</h3>
      <div class="table-wrap" style="overflow-x:auto">
        <table>
          <thead><tr><th scope="col">Source and ID</th><th scope="col">Meaning</th><th scope="col">What to check</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
      <h3>When to worry</h3>
      <ul class="mini-list">
${g.judge.map((j) => `          <li>${esc(j)}</li>`).join("\n")}
      </ul>
      <div class="callout"><strong>Caution</strong>
<p>Do not conclude a failed part or a security incident from one information-level record. Use it as a clue only when Error/Warning records from the same time and a real symptom (drops, reboots, slowness) accompany it.</p></div>
      <h3>Related</h3>
      <div class="link-list">${["kernel-power-41", "disk-7", "whea-logger-18"].filter((k) => eventEn[k]).map((k) => `<a href="/${enFile(k)}">${esc(eventEn[k].source)} ${esc(eventEn[k].id)}</a>`).join("")}<a href="/en/event-log-analyzer.html">Event log analyzer</a></div>
      <h3>Frequently asked questions</h3>
      <ul class="mini-list">
${g.faqs.map(([q, a]) => `          <li><strong>${esc(q)}</strong> ${esc(a)}</li>`).join("\n")}
      </ul>
      <p class="muted">This page is an English edition of our Korean explanation. It is organized from the information-level records actually seen in Event Viewer; not every item has a dedicated Microsoft documentation page. Last reviewed: ${today}.</p>
      <p><a href="/${koG.file}" hreflang="ko" lang="ko">한국어 원문 보기 (Korean original)</a></p>
    </article>
    <div class="sidebar" id="page-sidebar">
      <h4>Other groups of informational records</h4>
      <ul>
${siblings.map((x) => `        <li><a href="/en/${x.file}">${esc(groupsEn[x.file].short)}</a></li>`).join("\n")}
        <li><a href="/en/">All English event guides</a></li>
      </ul>
    </div>
  </main>
${footer}
  <script defer src="/${UI_INIT}"></script>
</body>
</html>
`;
}

const areaId = (area) => area.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function renderIndex() {
  const title = "Windows Event ID Guide: Meaning, Causes and What to Check";
  const desc = "Plain-English explanations of common Windows Event Viewer events — Kernel-Power 41, Disk 7, WHEA-Logger 18, Display 4101 and more — with a safe order of checks.";
  const url = `${SITE}/en/`;
  const groups = enAreaOrder.map((area) => {
    const items = Object.entries(eventEn).filter(([, e]) => e.area === area);
    return items.length ? `      <h3 id="${areaId(area)}">${esc(area)}</h3>
      <div class="link-list">${items.map(([s, e]) => `<a href="/${enFile(s)}">${esc(e.source)} ${esc(e.id)} · ${esc(e.title.replace(/^[^:]+:\s*/, ""))}</a>`).join("")}</div>` : "";
  }).join("\n");
  const schemas = [
    { "@context": "https://schema.org", "@type": "CollectionPage", name: title, description: desc, url, inLanguage: "en",
      isPartOf: { "@type": "WebSite", name: SITE_NAME, url: `${SITE}/` } },
    { "@context": "https://schema.org", "@type": "ItemList", itemListElement: Object.keys(eventEn).map((s, i) => ({ "@type": "ListItem", position: i + 1, url: enUrl(s), name: `${eventEn[s].source} ${eventEn[s].id}` })) }
  ];
  return `${pageHead({ title, desc, canonical: url, ogType: "website", schemas, alternates: [["en", url], ["ko", `${SITE}/event-codes-index.html`], ["x-default", `${SITE}/event-codes-index.html`]] })}
<body>
${header("English edition", "Windows Event ID Guide")}
  <main id="content" class="page article">
    <article class="section">
      <p class="eyebrow">EVENT VIEWER</p>
      <h2>Windows Event ID guide</h2>
      <p class="lead">When Event Viewer shows a Critical or Error entry, the event ID alone rarely tells you what to replace or repair. These pages explain what each common event actually means, what it does <em>not</em> prove, and a safe order of checks.</p>
      <p>Each guide is written to avoid the usual traps: blaming the power supply from a single Kernel-Power 41, running chkdsk before backing up a failing drive, or editing DCOM permissions to silence a harmless warning. Where Microsoft documents an event, the official page is linked.</p>
${groups}
      <h3 id="informational-records">Informational records (mostly normal)</h3>
      <p class="muted">Boot, service-start and security-feature records that are not errors. Each page groups related records and says when to worry.</p>
      <div class="link-list">${koGroups.map((g) => `<a href="/en/${g.file}">${esc(groupsEn[g.file].short)} (${g.members.length} events)</a>`).join("")}</div>
      <h3>Analyze your own log</h3>
      <p>Have a pile of Event Viewer records and not sure which to read first? Paste them into the <a href="/en/event-log-analyzer.html">event log analyzer</a>: it reads each record's source and event ID, links the matching explanation, and shows the records around restarts. It runs entirely in your browser.</p>
      <h3>About this site</h3>
      <p>PC Windows Diagnostic Center is a Korean-language PC troubleshooting site. These English pages are a pilot edition of our most-searched event explanations; the full set of event guides, an event-log analyzer and other tools are currently Korean only. <a href="/event-codes-index.html" hreflang="ko" lang="ko">Browse the full Korean event index</a>.</p>
      <p class="muted">Last updated: ${today}</p>
    </article>
  </main>
${footer}
</body>
</html>
`;
}

// ── write English pages ──
fs.mkdirSync(path.join(root, "en"), { recursive: true });
fs.writeFileSync(path.join(root, "en/index.html"), renderIndex());
for (const slug of Object.keys(eventEn)) fs.writeFileSync(path.join(root, enFile(slug)), renderEvent(slug));
for (const g of koGroups) fs.writeFileSync(path.join(root, "en", g.file), renderGroup(g));

// ── analyzer: English event data + page ──
// 영문 분석기가 쓰는 데이터: "정규화한 원본|ID" → 영문 해설 요약. normSource는 event-log-analyzer.js와 같은 규칙이다.
const normSource = (v) => String(v || "").toLowerCase().replace(/^microsoft-windows-/, "").replace(/[\s_]+/g, "").trim();
const analyzerData = {};
for (const [slug, ev] of Object.entries(eventEn)) {
  analyzerData[`${normSource(ev.source)}|${ev.id}`] = { slug, t: ev.title, s: ev.lead, c: ev.checks.slice(0, 3), w: ev.caution.slice(0, 2) };
}
// 정보 수준 이벤트 묶음 페이지의 행도 분석기에서 영어 카드로 보이게 한다(slug는 en/event-<slug>.html 이름과 같다).
for (const g of koGroups) {
  const ge = groupsEn[g.file];
  const slug = g.file.replace(/^event-|\.html$/g, "");
  for (const key of g.members) {
    const sp = key.lastIndexOf(" ");
    const row = ge.rows[key];
    analyzerData[`${normSource(key.slice(0, sp))}|${key.slice(sp + 1)}`] = { slug, t: ge.short, s: row[0], c: [row[1]], w: [row[2] || DEFAULT_WARNING] };
  }
}
const dataJs = `// Generated file. Regenerate with scripts/generate-event-pages-en.mjs.\nwindow.EVENT_EN_DATA = ${JSON.stringify(analyzerData)};\n`;
fs.writeFileSync(path.join(root, "en/event-en-data.js"), dataJs);
const enDataRef = `en/event-en-data.js?v=${crypto.createHash("sha1").update(dataJs).digest("hex").slice(0, 8)}`;
const koAnalyzer = fs.readFileSync(path.join(root, "event-log-analyzer.html"), "utf8");
const refOf = (name) => (koAnalyzer.match(new RegExp(`src="(${name.replace(".", "\\.")}\\?v=[a-zA-Z0-9-]+)"`)) || [])[1] || name;
fs.writeFileSync(path.join(root, "en/event-log-analyzer.html"), renderAnalyzerPage({
  root, SITE, today, styleRef: STYLE, uiInitRef: UI_INIT, dataRef: refOf("data-event-codes.js"), analyzerRef: refOf("event-log-analyzer.js"),
  enDataRef, enCount: Object.keys(eventEn).length, ga: GA, icons: ICONS, header, footer
}));

// ── link the Korean pages to their English editions (idempotent) ──
let patched = 0;
for (const [slug, ev] of Object.entries(eventEn)) {
  const p = path.join(root, ev.ko);
  let h = fs.readFileSync(p, "utf8");
  const before = h;
  const koHref = koUrl(ev);
  if (!h.includes('hreflang="en"')) {
    // 일부 페이지는 canonical과 JSON-LD가 한 줄이라, 그 줄을 건드리면 dateModified가 바뀐 것으로 잡힌다(RSS 검사).
    // 별도 줄인 스타일시트 링크 앞에 넣는다.
    h = h.replace(/(\s*<link rel="stylesheet" href="style\.css)/,
      `\n  <link rel="alternate" hreflang="ko" href="${koHref}">\n  <link rel="alternate" hreflang="en" href="${enUrl(slug)}">\n  <link rel="alternate" hreflang="x-default" href="${koHref}">$1`);
  }
  if (!h.includes('class="lang-switch"')) {
    h = h.replace(/(\s*<p class="muted">최종 검토일:)/, `\n      <p class="lang-switch"><a href="${enFile(slug)}" hreflang="en" lang="en">English version</a></p>$1`);
  }
  if (h !== before) { fs.writeFileSync(p, h); patched++; }
}

// ── Korean analyzer page: hreflang + English link (idempotent) ──
{
  const kp = path.join(root, "event-log-analyzer.html");
  let kh = fs.readFileSync(kp, "utf8");
  const before = kh;
  if (!kh.includes('hreflang="en"')) {
    kh = kh.replace(/(<link rel="canonical" href="[^"]+">)/,
      `$1\n  <link rel="alternate" hreflang="ko" href="${SITE}/event-log-analyzer.html">\n  <link rel="alternate" hreflang="en" href="${SITE}/en/event-log-analyzer.html">\n  <link rel="alternate" hreflang="x-default" href="${SITE}/event-log-analyzer.html">`);
    kh = kh.replace(/(\s*<div class="card">\s*<label for="ela-input">)/, `\n      <p class="lang-switch"><a href="en/event-log-analyzer.html" hreflang="en" lang="en">English version</a></p>$1`);
  }
  if (kh !== before) fs.writeFileSync(kp, kh);
}

// ── Korean group pages: hreflang + English link (idempotent) ──
for (const g of koGroups) {
  const kp = path.join(root, g.file);
  let kh = fs.readFileSync(kp, "utf8");
  const before = kh;
  if (!kh.includes('hreflang="en"')) {
    kh = kh.replace(/(<link rel="canonical" href="[^"]+">)/,
      `$1\n  <link rel="alternate" hreflang="ko" href="${SITE}/${g.file}">\n  <link rel="alternate" hreflang="en" href="${SITE}/en/${g.file}">\n  <link rel="alternate" hreflang="x-default" href="${SITE}/${g.file}">`);
    kh = kh.replace(/(\s*<p class="muted">이 페이지는 이벤트 뷰어에서)/, `\n      <p class="lang-switch"><a href="en/${g.file}" hreflang="en" lang="en">English version</a></p>$1`);
  }
  if (kh !== before) fs.writeFileSync(kp, kh);
}

// ── sitemap ──
const smPath = path.join(root, "sitemap.xml");
let sm = fs.readFileSync(smPath, "utf8");
const urls = ["en/", "en/event-log-analyzer.html", ...Object.keys(eventEn).map(enFile), ...koGroups.map((g) => `en/${g.file}`)];
let added = 0;
for (const u of urls) {
  if (sm.includes(`<loc>${SITE}/${u}</loc>`)) continue;
  sm = sm.replace("</urlset>", `  <url><loc>${SITE}/${u}</loc><lastmod>${today}</lastmod></url>\n</urlset>`);
  added++;
}
fs.writeFileSync(smPath, sm);

console.log(`en pages: ${Object.keys(eventEn).length + 1}, Korean pages patched: ${patched}, sitemap entries added: ${added}`);
