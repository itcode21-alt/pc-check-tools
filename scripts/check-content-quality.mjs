// data.js의 symptomDetails에 새로 추가·수정된 텍스트가 "자동 생성 티가 나는" 패턴인지
// 커밋 전에 검사합니다.
//
// 배경: 이 사이트는 애드센스에서 "가치가 별로 없는 콘텐츠"로 심사 반려된 전력이 있고,
// 클라우드 루틴이 주기적으로 증상 항목을 보강한다. 그런데 "같은 구조·같은 개수로 채우지
// 말라"는 규칙이 프롬프트에만 있으면 모델이 어겨도 막을 방법이 없어서, 객관적으로 잴 수
// 있는 것만 스크립트로 강제한다(2026-10-06, 40개 증상 중 27개가 정확히 원인카드 2/예시 2/
// 실수 2/FAQ 1로 보강된 것이 발견됨).
//
// 사용법: node scripts/check-content-quality.mjs --staged   (커밋 전: 인덱스 vs HEAD)
//         node scripts/check-content-quality.mjs --base=<ref> (CI: ref vs HEAD)
// 규칙을 어기면 종료 코드 1. 구조 반복 검사만 --allow-uniform-shape로 우회할 수 있다.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const staged = process.argv.includes("--staged");
const baseArg = process.argv.find((a) => a.startsWith("--base="));
const base = baseArg ? baseArg.slice("--base=".length) : null;
const allowUniform = process.argv.includes("--allow-uniform-shape");

if (!staged && !base) {
  console.log("사용법: node scripts/check-content-quality.mjs --staged  (또는 --base=<ref>)");
  process.exit(0);
}

const git = (...args) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 64, stdio: ["ignore", "pipe", "ignore"] });

function details(source) {
  const w = {};
  new Function("window", source)(w);
  return w.SITE_DATA.symptomDetails || {};
}

let oldSource;
let newSource;
try {
  oldSource = git("show", staged ? "HEAD:data.js" : `${base}:data.js`);
  newSource = staged ? git("show", ":data.js") : git("show", "HEAD:data.js");
} catch {
  console.log("✓ 콘텐츠 품질: data.js 이력을 읽을 수 없어 건너뜀");
  process.exit(0);
}
if (oldSource === newSource) {
  console.log("✓ 콘텐츠 품질: data.js 변경 없음");
  process.exit(0);
}

const oldD = details(oldSource);
const newD = details(newSource);
const changed = Object.keys(newD).filter((k) => JSON.stringify(oldD[k]) !== JSON.stringify(newD[k]));
if (changed.length === 0) {
  console.log("✓ 콘텐츠 품질: symptomDetails 변경 없음");
  process.exit(0);
}

// ---- 추가된 항목 추출 ------------------------------------------------------
const norm = (s) => String(s).replace(/[\s ]+/g, " ").replace(/[“”"'`]/g, "").trim();
const keyOf = (s) => norm(s).replace(/\s/g, "");
const sentences = (t) =>
  norm(t).split(/(?<=[.!?。])\s+/).map((s) => s.trim()).filter((s) => s.length >= 18);

function addedItems(key) {
  const o = oldD[key] || {};
  const n = newD[key] || {};
  const has = (arr, f) => new Set((arr || []).map(f));
  const out = [];
  const oldDeeper = has(o.deeper, (x) => x.text);
  (n.deeper || []).filter((x) => !oldDeeper.has(x.text)).forEach((x) => out.push({ field: "deeper", text: x.text, min: 60 }));
  const oldEx = has(o.examples, String);
  (n.examples || []).filter((x) => !oldEx.has(String(x))).forEach((x) => out.push({ field: "examples", text: String(x), min: 12 }));
  const oldMis = has(o.mistakes, String);
  (n.mistakes || []).filter((x) => !oldMis.has(String(x))).forEach((x) => out.push({ field: "mistakes", text: String(x), min: 12 }));
  const oldFaq = has(o.faq, (x) => x.q + "|" + x.a);
  (n.faq || []).filter((x) => !oldFaq.has(x.q + "|" + x.a)).forEach((x) => out.push({ field: "faq", text: x.a, min: 40 }));
  return out;
}

const shapeOf = (key, from, to) => {
  const count = (f, id) => {
    const before = new Set(((from[key] || {})[f] || []).map(id));
    return ((to[key] || {})[f] || []).filter((x) => !before.has(id(x))).length;
  };
  return [
    count("deeper", (x) => x.text),
    count("examples", String),
    count("mistakes", String),
    count("faq", (x) => x.q + "|" + x.a),
  ].join("/");
};

// ---- 규칙 검사 -------------------------------------------------------------
const errors = [];
const adWords = /광고\s*(를|을)?\s*(눌|클릭)|클릭\s*해\s*주|후원|구독\s*과\s*좋아요|adsbygoogle/;

// 다른 증상(및 같은 증상의 기존 문장)에 이미 있는 문장 모음
const corpus = new Map(); // keyOf(sentence) -> Set(symptom key)
function addCorpus(symptom, text) {
  for (const s of [norm(text), ...sentences(text)]) {
    if (s.length < 12) continue;
    const k = keyOf(s);
    if (!corpus.has(k)) corpus.set(k, new Set());
    corpus.get(k).add(symptom);
  }
}
for (const [k, v] of Object.entries(newD)) {
  const added = changed.includes(k) ? new Set(addedItems(k).map((i) => i.text)) : null;
  const skip = (t) => added && added.has(t);
  (v.deeper || []).forEach((x) => !skip(x.text) && addCorpus(k, x.text));
  (v.decision || []).forEach((x) => addCorpus(k, x.text));
  (v.examples || []).forEach((x) => !skip(String(x)) && addCorpus(k, String(x)));
  (v.mistakes || []).forEach((x) => !skip(String(x)) && addCorpus(k, String(x)));
  (v.faq || []).forEach((x) => !skip(x.a) && addCorpus(k, x.a));
}

for (const key of changed) {
  for (const item of addedItems(key)) {
    const label = `${key} · ${item.field} · "${norm(item.text).slice(0, 40)}…"`;
    if (norm(item.text).length < item.min) errors.push(`${label}\n   너무 짧음(${norm(item.text).length}자 < ${item.min}자) — 새 정보가 없으면 항목을 추가하지 마세요.`);
    if (adWords.test(item.text)) errors.push(`${label}\n   광고·클릭·후원 유도로 보일 수 있는 표현이 들어 있음.`);
    for (const s of [norm(item.text), ...sentences(item.text)]) {
      if (s.length < 12) continue;
      const owners = corpus.get(keyOf(s));
      if (owners) {
        const where = [...owners].join(", ");
        errors.push(`${label}\n   이미 있는 문장과 똑같음("${s.slice(0, 50)}…") → ${where}. 증상에 맞게 구체적으로 다시 쓰세요.`);
        break;
      }
    }
  }
}

// 직전 보강 커밋과 같은 모양(구조 반복) 검사
let shapeNote = "";
try {
  const anchor = staged ? "HEAD" : base;
  const hashes = git("log", "--format=%H", "-n", "12", anchor, "--", "data.js").split("\n").filter(Boolean);
  let prevShapes = null;
  for (const h of hashes) {
    const parentSrc = git("show", `${h}~1:data.js`);
    const curSrc = git("show", `${h}:data.js`);
    const a = details(parentSrc);
    const b = details(curSrc);
    const ks = Object.keys(b).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]));
    if (ks.length) { prevShapes = new Set(ks.map((k) => shapeOf(k, a, b))); break; }
  }
  const cur = changed.map((k) => shapeOf(k, oldD, newD));
  const curSet = new Set(cur);
  if (prevShapes && curSet.size === 1 && prevShapes.size === 1 && [...curSet][0] === [...prevShapes][0] && [...curSet][0] !== "0/0/0/0") {
    const msg = `직전 콘텐츠 보강 커밋과 추가 구조가 똑같음(원인카드/예시/실수/FAQ = ${[...curSet][0]}). 같은 모양으로 반복하면 자동 생성 템플릿으로 보입니다 — 그 증상에서 정말 부족한 부분만 다르게 구성하세요.`;
    if (allowUniform) shapeNote = `⚠ ${msg} (--allow-uniform-shape로 우회됨)`;
    else errors.push(msg);
  }
} catch {
  shapeNote = "(이력이 얕아 구조 반복 검사는 건너뜀)";
}

if (errors.length) {
  console.log(`❌ 콘텐츠 품질 검사 실패 (${errors.length}건, 변경된 증상 ${changed.length}개):`);
  errors.forEach((e, i) => console.log(` ${i + 1}. ${e}`));
  process.exit(1);
}
console.log(`✓ 콘텐츠 품질: 정상 (변경된 증상 ${changed.length}개: ${changed.slice(0, 6).join(", ")}${changed.length > 6 ? " …" : ""}) ${shapeNote}`.trim());
