// Builds kb/knowledge-base.json from data.js for use by the future AI/RAG service.
// Does not invent new facts: every added field is derived mechanically from
// relationships already authored in data.js (relatedCodes, boardParts.codes,
// eventViewerCodes.relatedGuides, causes array order).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const src = readFileSync(join(root, "data.js"), "utf-8");
const window = {};
// eslint-disable-next-line no-new-func
new Function("window", src)(window);
const DATA = window.SITE_DATA;

const norm = (code) => code.toLowerCase().replace(/^0x/, "").replace(/^0+/, "") || "0";

function weightedCauses(causes) {
  if (!causes || causes.length === 0) return [];
  const n = causes.length;
  return causes.map((text, i) => ({
    text,
    // First listed cause is treated as most likely (author-ordered), last as least.
    // 5..1 scale, derived purely from existing array position.
    weight: n === 1 ? 5 : Math.round(5 - (4 * i) / (n - 1)),
  }));
}

// code -> boardPart ids that list it
const codeToParts = new Map();
for (const part of DATA.boardParts) {
  for (const code of part.codes || []) {
    const key = norm(code);
    if (!codeToParts.has(key)) codeToParts.set(key, []);
    codeToParts.get(key).push(part.id);
  }
}

// code -> eventViewerCodes ids that relate to it
const codeToEvents = new Map();
for (const ev of DATA.eventViewerCodes) {
  for (const code of ev.relatedCodes || []) {
    const key = norm(code);
    if (!codeToEvents.has(key)) codeToEvents.set(key, []);
    codeToEvents.get(key).push(ev.id);
  }
}

// symptom link (html file) -> symptom id
const linkToSymptomId = new Map();
for (const s of DATA.symptoms) linkToSymptomId.set(s.link, s.id);

const docs = [];

for (const e of DATA.errorCodes) {
  const key = norm(e.code);
  docs.push({
    id: `errorcode-${key}`,
    category: "error_code",
    code: e.code,
    title: e.title,
    summary: e.summary,
    overview: e.overview,
    causes: weightedCauses(e.causes),
    checks: e.checks || [],
    warnings: e.warnings || [],
    related: {
      componentTags: codeToParts.get(key) || [],
      eventIds: codeToEvents.get(key) || [],
      symptomId: e.relatedSymptom ? linkToSymptomId.get(e.relatedSymptom) || null : null,
    },
    aliases: e.aliases || [],
    officialSource: e.officialSource || null,
    detailPage: e.detailPage || e.link,
  });
}

for (const s of DATA.symptoms) {
  const detail = DATA.symptomDetails?.[s.id] || null;
  const partsForSymptom = DATA.boardParts
    .filter((p) => (p.symptoms || []).includes(s.title))
    .map((p) => p.id);
  const codesForSymptom = new Set();
  for (const p of DATA.boardParts) {
    if ((p.symptoms || []).includes(s.title)) {
      for (const c of p.codes || []) codesForSymptom.add(c);
    }
  }
  docs.push({
    id: `symptom-${s.id}`,
    category: "symptom",
    title: s.title,
    summary: s.summary,
    causes: weightedCauses(s.causes),
    checks: s.checks || [],
    related: {
      componentTags: partsForSymptom,
      errorCodes: [...codesForSymptom],
    },
    detail: detail
      ? {
          badge: detail.badge,
          subtitle: detail.subtitle,
          intro: detail.intro,
          warnings: detail.warnings,
          checks: detail.checks,
          deeper: detail.deeper,
          decision: detail.decision,
          examples: detail.examples,
          mistakes: detail.mistakes,
          faq: detail.faq,
        }
      : null,
    detailPage: s.link,
  });
}

for (const ev of DATA.eventViewerCodes) {
  const relatedSymptomIds = (ev.relatedGuides || [])
    .map((link) => linkToSymptomId.get(link))
    .filter(Boolean);
  const tags = new Set();
  for (const code of ev.relatedCodes || []) {
    for (const partId of codeToParts.get(norm(code)) || []) tags.add(partId);
  }
  docs.push({
    id: `event-${ev.source}-${ev.id}`.toLowerCase().replace(/\s+/g, "-"),
    category: "event_id",
    eventId: ev.id,
    source: ev.source,
    level: ev.level,
    urgency: ev.urgency,
    summary: ev.summary,
    conditions: ev.conditions || [],
    causes: weightedCauses(ev.causes),
    checks: ev.checks || [],
    warnings: ev.warnings || [],
    related: {
      errorCodes: ev.relatedCodes || [],
      symptomIds: relatedSymptomIds,
      componentTags: [...tags],
    },
    detailPage: ev.detailPage,
  });
}

for (const p of DATA.boardParts) {
  const relatedEventIds = new Set();
  for (const code of p.codes || []) {
    for (const evId of codeToEvents.get(norm(code)) || []) relatedEventIds.add(evId);
  }
  docs.push({
    id: `component-${p.id}`,
    category: "component",
    title: p.label,
    shortLabel: p.shortLabel,
    summary: p.summary,
    note: p.note || null,
    related: {
      errorCodes: p.codes || [],
      symptoms: p.symptoms || [],
      eventIds: [...relatedEventIds],
    },
  });
}

const kbDir = join(root, "kb");
mkdirSync(kbDir, { recursive: true });
const outPath = join(kbDir, "knowledge-base.json");
writeFileSync(outPath, JSON.stringify({ siteName: DATA.siteName, siteUrl: DATA.siteUrl, generatedAt: new Date().toISOString(), documents: docs }, null, 2));

console.log(`Wrote ${docs.length} documents to ${outPath}`);
console.log(
  `  error_code: ${docs.filter((d) => d.category === "error_code").length}, ` +
    `symptom: ${docs.filter((d) => d.category === "symptom").length}, ` +
    `event_id: ${docs.filter((d) => d.category === "event_id").length}, ` +
    `component: ${docs.filter((d) => d.category === "component").length}`
);
