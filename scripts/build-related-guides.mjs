// "함께 볼 가이드" 데이터 생성: node scripts/build-related-guides.mjs
//
// 페이지마다 관련 가이드 최대 3개를 미리 계산해 related-guides.js(window.RELATED_GUIDES)로 만든다.
// repair-cta.js가 이 데이터를 읽어 본문 끝에 카드로 보여 준다(방문당 페이지뷰를 늘려 광고·수리 의뢰 노출을 늘리는 것이 목적).
//
// 원칙(애드센스 저품질 방지):
//  - 링크 대상은 "광고가 붙어 있고 본문이 충실한" 페이지만 쓴다. 본문이 짧아 일부러 광고를 뺀 페이지(event-* 일부)는
//    대상에서 제외한다(그 페이지는 링크를 "내보내는" 쪽으로만 쓴다).
//  - 관련도는 제목·키워드의 겹침(IDF 가중 코사인)으로 정하고, 같은 종류(오류코드↔오류코드)는 조금 가산한다.
//  - 한 페이지로 링크가 몰리지 않게 대상별 받는 링크 수에 상한을 둔다. 입력이 같으면 결과도 항상 같다(무작위 없음).
//  - 도구·계산기·정책·색인(허브) 페이지는 대상도 출처도 아니다.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "related-guides.js");
const PER_PAGE = 3;
const INBOUND_CAP = 12;

const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");
const sandbox = { window: {} };
vm.runInNewContext(read("search-index.js"), sandbox);
const INDEX = sandbox.window.SEARCH_INDEX;

const noAds = JSON.parse(read("scripts/lib/no-ads-pages.json"));
const toolPages = new Set([...(noAds.pages || []), ...(noAds.sideAdsPages || [])]);
const DENY = new Set([
  "index.html", "guides.html", "tools.html", "news.html", "sitemap.html", "search-results.html", "community-cases.html",
  "community-cases-admin.html", "contact.html", "about.html", "privacy.html", "terms.html", "editorial-policy.html",
  "pricing.html", "remote-support.html", "diagnostic.html", "error-codes-index.html", "event-codes-index.html",
  "games-diagnostic.html", "device-manager-codes.html", "404.html", "admin.html", "admin-local.html",
]);

const exists = (f) => fs.existsSync(path.join(ROOT, f));
const html = (f) => read(f);
const eligibleFile = (f) => /^[a-z0-9._-]+\.html$/i.test(f) && !DENY.has(f) && !toolPages.has(f) && exists(f);

// 링크 대상: 광고가 있고, noindex가 아니며, 본문 텍스트가 충분한 페이지
function bodyTextLength(h) {
  const main = /<main[\s\S]*?<\/main>/i.exec(h);
  return (main ? main[0] : h).replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").length;
}

// 출처: 공용 의뢰 블록(repair-cta.js)이 본문에 붙는 콘텐츠 페이지
const sources = [];
const targets = new Map();
for (const f of fs.readdirSync(ROOT).filter((x) => x.endsWith(".html")).sort()) {
  if (!eligibleFile(f)) continue;
  const h = html(f);
  if (!/repair-cta\.js/.test(h) || /repair-cta\.js[^>]*data-banner-only/.test(h)) continue;
  if (/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(h)) continue;
  sources.push(f);
  if (/adsbygoogle\.js/.test(h) && bodyTextLength(h) >= 1500) targets.set(f, true);
}

// 검색 인덱스에서 제목·키워드·종류를 가져온다(없는 페이지는 <title>로 대체)
const entry = new Map();
for (const e of INDEX) if (e.u && !e.u.includes("#") && !entry.has(e.u)) entry.set(e.u, e);
const titleOf = (f) => (entry.get(f)?.t) || ((/<title>([^<]*)<\/title>/i.exec(html(f)) || [])[1] || f).replace(/\s*\|.*$/, "").trim();
const textOf = (f) => `${titleOf(f)} ${titleOf(f)} ${(entry.get(f)?.k) || ""}`;

const STOP = new Set(["오류", "해결", "방법", "windows", "윈도우", "확인", "발생", "문제", "경우", "때문", "있는", "합니다", "입니다", "the", "and", "for", "error", "code"]);
const tokens = (s) => {
  const out = new Map();
  for (const w of s.toLowerCase().replace(/[^0-9a-z가-힣._]+/g, " ").split(" ")) {
    const t = w.replace(/(으로|에서|에게|하고|입니다|합니다|이나|라고|까지|부터|보다|에는|에도|은|는|이|가|을|를|의|에|와|과|도|로)$/u, "");
    if (t.length < 2 || STOP.has(t) || /^\d+$/.test(t)) continue;
    out.set(t, (out.get(t) || 0) + 1);
  }
  return out;
};
const docs = new Map();
for (const f of new Set([...sources, ...targets.keys()])) docs.set(f, tokens(textOf(f)));
const df = new Map();
for (const tk of docs.values()) for (const t of tk.keys()) df.set(t, (df.get(t) || 0) + 1);
const N = docs.size;
const vec = new Map();
for (const [f, tk] of docs) {
  const v = new Map();
  let norm = 0;
  for (const [t, c] of tk) { const w = (1 + Math.log(c)) * Math.log(1 + N / (df.get(t) || 1)); v.set(t, w); norm += w * w; }
  vec.set(f, { v, norm: Math.sqrt(norm) || 1 });
}
const cos = (a, b) => {
  const [x, y] = vec.get(a).v.size < vec.get(b).v.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [t, w] of vec.get(x).v) { const u = vec.get(y).v.get(t); if (u) dot += w * u; }
  return dot / (vec.get(a).norm * vec.get(b).norm);
};
const family = (f) => (/^(error-code|event|game|hardware|windows|network|nas)-/.exec(f) || [])[1] || "other";
const MIN_SCORE = 0.06;

// 출처를 고정된 순서로 훑되, 대상별 받는 링크 수 상한을 지키며 점수가 높은 순으로 고른다.
const inbound = new Map();
const result = {};
for (const src of sources) {
  const cands = [];
  for (const t of targets.keys()) {
    if (t === src) continue;
    let s = cos(src, t);
    if (family(src) === family(t)) s += 0.05;
    if (s >= MIN_SCORE) cands.push([s, t]);
  }
  cands.sort((a, b) => b[0] - a[0] || (a[1] < b[1] ? -1 : 1));
  const picked = [];
  for (const [, t] of cands) {
    if (picked.length >= PER_PAGE) break;
    if ((inbound.get(t) || 0) >= INBOUND_CAP) continue;
    picked.push(t);
    inbound.set(t, (inbound.get(t) || 0) + 1);
  }
  if (picked.length) result[src] = picked;
}

const titles = {};
for (const list of Object.values(result)) for (const t of list) titles[t] = titleOf(t);
const stamp = `// 자동 생성 파일입니다 — scripts/build-related-guides.mjs로 재생성하세요(페이지를 추가·삭제·크게 고친 뒤).\n`;
const body = `window.RELATED_GUIDES=${JSON.stringify({ links: result, titles })};\n`;
fs.writeFileSync(OUT, stamp + body);
const counts = Object.values(result).map((l) => l.length);
console.log(`출처 ${sources.length}개 중 ${counts.length}개에 관련 가이드 연결(3개: ${counts.filter((c) => c === 3).length}), 대상 후보 ${targets.size}개, 받은 링크 최대 ${Math.max(...inbound.values())}`);
console.log(`related-guides.js ${(fs.statSync(OUT).size / 1024).toFixed(1)}KB`);
