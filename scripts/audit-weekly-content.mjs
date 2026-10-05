// 지난 N일(기본 7일)의 콘텐츠 변경을 애드센스 저품질 관점에서 읽기 전용으로 점검해 보고서를
// 출력합니다. 저장소를 수정하지 않습니다(주간 감사 루틴이 사용).
//
// 보는 것: ① 커밋 수(루틴/사람) ② 콘텐츠 보강 커밋마다 추가 구조(원인카드/예시/실수/FAQ)
// ③ 새 텍스트의 길이 분포와 반복 시작 문구 ④ 사이트 전체 symptomDetails의 같은 문장 중복
// ⑤ sitemap.xml lastmod 몰림(가짜 신선도) ⑥ 내용은 안 바뀌었는데 dateModified만 올라간 페이지.
// 사용법: node scripts/audit-weekly-content.mjs [--days=7]
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const daysArg = process.argv.find((a) => a.startsWith("--days="));
const days = daysArg ? Number(daysArg.slice(7)) : 7;
const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 256, stdio: ["ignore", "pipe", "ignore"] });
const details = (src) => { const w = {}; new Function("window", src)(w); return w.SITE_DATA; };
const norm = (s) => String(s).replace(/[\s ]+/g, " ").replace(/[“”"'`]/g, "").trim();
const sentences = (t) => norm(t).split(/(?<=[.!?。])\s+/).filter((s) => s.length >= 18);

const since = `${days} days ago`;
const commits = git("log", `--since=${since}`, "--format=%H%x09%an%x09%ad%x09%s", "--date=short", "--no-merges")
  .split("\n").filter(Boolean).map((l) => { const [h, an, ad, ...s] = l.split("\t"); return { h, an, ad, s: s.join("\t") }; })
  .filter((c) => !/update part and laptop prices/.test(c.s));

console.log(`# 주간 콘텐츠 감사 (최근 ${days}일, 가격 봇 커밋 제외)`);
const routine = commits.filter((c) => c.an === "Claude");
console.log(`커밋 ${commits.length}개 (작성자 Claude ${routine.length}개 / 그 외 ${commits.length - routine.length}개)`);

// 새로 추가된 HTML 페이지 수(새 페이지가 색인 대기열을 키우므로 속도를 본다)
const addedPages = git("log", `--since=${since}`, "--diff-filter=A", "--name-only", "--format=@@%h %an %ad", "--date=short", "--", "*.html")
  .split("\n").reduce((acc, l) => { if (l.startsWith("@@")) acc.cur = l.slice(2); else if (l.trim() && acc.cur) acc.list.push(`${l.trim()} (${acc.cur})`); return acc; }, { cur: "", list: [] }).list;
console.log(`새로 추가된 HTML 페이지: ${addedPages.length}개${addedPages.length > 2 ? " ⚠ 주 2개를 넘음(색인 대기열 증가 속도 확인)" : ""}`);
addedPages.forEach((x) => console.log(`- ${x}`));

// ② 보강 커밋별 구조
const shapeRows = [];
const newTexts = [];
let lastData = null;
for (const c of [...commits].reverse()) {
  let before, after;
  try { before = details(git("show", `${c.h}~1:data.js`)).symptomDetails; after = details(git("show", `${c.h}:data.js`)).symptomDetails; } catch { continue; }
  const keys = Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
  if (!keys.length) continue;
  const row = { c, keys: [] };
  for (const k of keys) {
    const cnt = (f, id) => { const b = new Set(((before[k] || {})[f] || []).map(id)); return ((after[k] || {})[f] || []).filter((x) => !b.has(id(x))); };
    const dd = cnt("deeper", (x) => x.text), ex = cnt("examples", String), mi = cnt("mistakes", String), fq = cnt("faq", (x) => x.q + "|" + x.a);
    if (dd.length + ex.length + mi.length + fq.length === 0) continue;
    row.keys.push({ k, shape: [dd.length, ex.length, mi.length, fq.length].join("/") });
    dd.forEach((x) => newTexts.push({ k, f: "deeper", t: x.text }));
    ex.forEach((x) => newTexts.push({ k, f: "examples", t: String(x) }));
    mi.forEach((x) => newTexts.push({ k, f: "mistakes", t: String(x) }));
    fq.forEach((x) => newTexts.push({ k, f: "faq", t: x.a }));
  }
  if (row.keys.length) shapeRows.push(row);
}
console.log(`\n## 원인카드·예시·실수·FAQ가 추가된 커밋 ${shapeRows.length}개 (체크 단계·서식만 바뀐 변경은 제외)`);
const shapeCount = {};
shapeRows.forEach((r) => {
  console.log(`- ${r.c.ad} ${r.c.h.slice(0, 7)} ${r.keys.map((x) => `${x.k}[${x.shape}]`).join(", ")}`);
  r.keys.forEach((x) => { shapeCount[x.shape] = (shapeCount[x.shape] || 0) + 1; });
});
const totalKeys = Object.values(shapeCount).reduce((a, b) => a + b, 0);
const top = Object.entries(shapeCount).sort((a, b) => b[1] - a[1])[0];
if (totalKeys) {
  console.log(`구조(원인카드/예시/실수/FAQ) 분포: ${Object.entries(shapeCount).map(([s, n]) => `${s}×${n}`).join(", ")}`);
  console.log(`가장 흔한 구조 ${top[0]} 비율 ${Math.round((top[1] / totalKeys) * 100)}% ${top[1] / totalKeys >= 0.5 && totalKeys >= 4 ? "⚠ 같은 모양 편중(템플릿 의심)" : "(양호)"}`);
}

// ③ 새 텍스트 길이·시작 문구
const lens = newTexts.map((x) => norm(x.t).length).sort((a, b) => a - b);
if (lens.length) {
  console.log(`\n## 새로 추가된 텍스트 ${lens.length}개: 길이 최소 ${lens[0]} / 중앙값 ${lens[Math.floor(lens.length / 2)]} / 최대 ${lens[lens.length - 1]}`);
  const opens = {};
  newTexts.filter((x) => x.f === "deeper" || x.f === "faq").forEach((x) => { const o = norm(x.t).slice(0, 8); opens[o] = (opens[o] || 0) + 1; });
  const rep = Object.entries(opens).filter(([o, n]) => n >= 3 && !/^(Windows|Microsoft)/.test(o));
  console.log(rep.length ? `⚠ 같은 8자로 시작하는 새 문장 반복: ${rep.map(([o, n]) => `"${o}"×${n}`).join(", ")}` : "같은 시작 문구 반복 없음");
}

// ④ 전체 symptomDetails 같은 문장 중복(절차 1단계 checks.how 제외)
const cur = details(git("show", "HEAD:data.js")).symptomDetails;
const owners = new Map();
for (const [k, v] of Object.entries(cur)) {
  const texts = [...(v.deeper || []).map((x) => x.text), ...(v.examples || []).map(String), ...(v.mistakes || []).map(String), ...(v.faq || []).map((x) => x.a), ...(v.decision || []).map((x) => x.text)];
  for (const t of texts) for (const s of [norm(t), ...sentences(t)]) { if (s.length < 12) continue; const key = s.replace(/\s/g, ""); if (!owners.has(key)) owners.set(key, { s, ks: new Set() }); owners.get(key).ks.add(k); }
}
const dups = [...owners.values()].filter((o) => o.ks.size > 1);
console.log(`\n## 전체 symptomDetails에서 서로 다른 증상 간 똑같은 문장: ${dups.length}건`);
dups.slice(0, 8).forEach((o) => console.log(`- "${o.s.slice(0, 50)}…" → ${[...o.ks].join(", ")}`));

// ⑤ sitemap lastmod 몰림
const sm = readFileSync(join(root, "sitemap.xml"), "utf8");
const dates = {}; let n = 0;
for (const m of sm.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) { dates[m[1]] = (dates[m[1]] || 0) + 1; n++; }
const topDate = Object.entries(dates).sort((a, b) => b[1] - a[1]).slice(0, 3);
console.log(`\n## sitemap.xml lastmod (${n}개 URL): 상위 ${topDate.map(([d, c]) => `${d}×${c}`).join(", ")}`);
console.log(topDate[0] && topDate[0][1] / n > 0.5 ? "⚠ 절반 넘는 페이지가 같은 날짜 — 가짜 신선도 의심(얕은 클론에서 재생성됐는지 확인)" : "날짜 분포 정상");

// ⑥ 내용은 그대로인데 dateModified만 올린 증상 페이지
const linkToKey = {};
(details(git("show", "HEAD:data.js")).symptoms || []).forEach((s) => { linkToKey[s.link] = s.id; });
const dateOnly = [];
for (const c of commits) {
  let files;
  try { files = git("diff-tree", "--no-commit-id", "--name-only", "-r", c.h).split("\n").filter((f) => f.endsWith(".html") && linkToKey[f]); } catch { continue; }
  if (!files.length) continue;
  let before, after;
  try { before = details(git("show", `${c.h}~1:data.js`)).symptomDetails; after = details(git("show", `${c.h}:data.js`)).symptomDetails; } catch { continue; }
  for (const f of files) {
    const diff = git("show", c.h, "--", f);
    if (/^\+.*"dateModified":"\d{4}-\d{2}-\d{2}"/m.test(diff) && JSON.stringify(before[linkToKey[f]]) === JSON.stringify(after[linkToKey[f]])) dateOnly.push(`${f} (${c.ad} ${c.h.slice(0, 7)})`);
  }
}
console.log(`\n## 내용 변경 없이 dateModified만 올린 증상 페이지: ${dateOnly.length}건`);
dateOnly.slice(0, 10).forEach((x) => console.log(`- ${x}`));
