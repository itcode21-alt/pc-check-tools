// data.js의 symptoms 배열은 오류 코드(errorCodes) 항목보다 훨씬 얕다
// (원인·점검 항목이 3개뿐이고 문장도 짧음). Gemini API로 각 증상을
// 더 상세하고 실무적인 내용으로 보강한 "초안"을 만든다.
//
// 이 스크립트는 data.js를 직접 수정하지 않는다. scripts/output/ 아래에
// 검토용 JSON 파일만 만들고, 실제 반영은 운영자가 내용을 확인한 뒤
// data.js에 수동으로 붙여넣는다(사실관계 오류를 그대로 반영하지 않기 위함).
//
// 무료 등급 Gemini API는 분당 요청 수 제한이 낮아(RPM), 항목이 많으면
// 429(quota exceeded)가 날 수 있다. 이 스크립트는:
//   - 요청 사이 기본 7초 간격
//   - 429를 만나면 응답의 retryDelay(있으면)만큼, 없으면 지수 백오프로
//     최대 3번까지 재시도
//   - 이전에 이미 성공한 항목은 결과 파일에 남아있으면 건너뜀(재실행 시
//     할당량을 아낄 수 있음). 처음부터 다시 하려면 --force 옵션 사용
//
// 사용법:
//   GEMINI_API_KEY를 .env 파일(저장소 루트, .env.example 참고)에 넣고
//   node scripts/enrich-symptoms-with-gemini.mjs                # 전체 31개
//   node scripts/enrich-symptoms-with-gemini.mjs no-display no-power   # 일부만
//   node scripts/enrich-symptoms-with-gemini.mjs --force         # 이미 성공한 것도 다시

import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}
loadEnvFile(path.join(root, ".env"));

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

if (!API_KEY) {
  console.error("GEMINI_API_KEY가 설정되어 있지 않습니다.");
  console.error("저장소 루트에 .env 파일을 만들고 GEMINI_API_KEY=값 을 넣으세요 (.env.example 참고).");
  process.exit(1);
}

let dataSrc = fs.readFileSync(path.join(root, "data.js"), "utf8")
  .replace("window.SITE_DATA = ", "globalThis.SITE_DATA = ");
const context = {};
vm.createContext(context);
vm.runInContext(dataSrc, context);
const symptoms = context.SITE_DATA.symptoms || [];

const args = process.argv.slice(2);
const force = args.includes("--force");
const requestedIds = args.filter((arg) => !arg.startsWith("--"));
const targets = requestedIds.length
  ? symptoms.filter((item) => requestedIds.includes(item.id))
  : symptoms;

if (requestedIds.length && targets.length !== requestedIds.length) {
  const found = new Set(targets.map((t) => t.id));
  const missing = requestedIds.filter((id) => !found.has(id));
  console.warn("⚠️  data.js에서 찾을 수 없는 id:", missing.join(", "));
}

const outDir = path.join(root, "scripts", "output");
const outPath = path.join(outDir, "symptoms-enriched-draft.json");
fs.mkdirSync(outDir, { recursive: true });

let existingResults = [];
if (!force && fs.existsSync(outPath)) {
  try {
    existingResults = JSON.parse(fs.readFileSync(outPath, "utf8"));
  } catch {
    existingResults = [];
  }
}
const alreadyDone = new Set(existingResults.map((r) => r.id));
const pending = targets.filter((s) => !alreadyDone.has(s.id));

if (!force && alreadyDone.size) {
  const skipping = targets.filter((s) => alreadyDone.has(s.id));
  if (skipping.length) {
    console.log(`이미 완료된 ${skipping.length}개는 건너뜁니다 (--force로 강제 재실행 가능): ${skipping.map((s) => s.id).join(", ")}`);
  }
}

const responseSchema = {
  type: "object",
  properties: {
    overview: { type: "string" },
    summary: { type: "string" },
    causes: { type: "array", items: { type: "string" } },
    checks: { type: "array", items: { type: "string" } },
  },
  required: ["overview", "summary", "causes", "checks"],
};

const buildPrompt = (symptom) => `당신은 "PC 윈도우 진단 센터"(itsvc.co.kr)라는 윈도우 PC 문제 해결 사이트의 콘텐츠 작성자입니다.
아래는 현재 등록된 증상의 축약된 초기 버전입니다. 이 내용을 더 상세하고 실무적으로 보강해주세요.

[증상 제목] ${symptom.title}
[기존 요약] ${symptom.summary}
[기존 원인 후보] ${(symptom.causes || []).join(", ")}
[기존 점검 순서] ${(symptom.checks || []).join(", ")}

작성 기준:
- overview: 이 증상이 왜 발생하는지, 어떤 상황에서 흔한지 2~3문장으로 설명 (기존 요약을 확장하되 구체적인 정보를 더할 것)
- summary: overview를 1문장으로 압축한 버전 (카드 미리보기용, 기존 요약과 뜻은 같되 더 명확하게)
- causes: 실제로 흔한 원인 4~5개를 구체적으로 나열. "케이블 문제"처럼 뭉뚱그리지 말고 "HDMI/DP 케이블이 완전히 삽입되지 않았거나 손상된 경우"처럼 구체적으로 쓸 것
- checks: 사용자가 직접 실행할 수 있는 점검 순서 4~5개를 실행 가능한 문장으로. "케이블 확인"이 아니라 "모니터와 그래픽카드를 연결하는 케이블을 다른 케이블로 교체해 재현 여부를 확인하세요."처럼 구체적인 동작으로 쓸 것
- 문장 종결어미는 반드시 해요체("~하세요", "~확인하세요", "~있습니다", "~됩니다")로 통일할 것. "~하십시오", "~하시기 바랍니다" 같은 하십시오체는 절대 쓰지 말 것
- 과장 없이 담백하고 실무적인 톤
- 하드웨어 교체보다 교체 전에 확인할 수 있는 저비용 점검을 먼저 배치할 것
- 실제로 확인되지 않은 통계나 수치(예: "80%의 경우")는 만들어내지 말 것`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function extractRetryDelaySeconds(errorBodyText) {
  try {
    const parsed = JSON.parse(errorBodyText);
    const detail = parsed?.error?.details?.find((d) => d["@type"]?.includes("RetryInfo"));
    const retryDelay = detail?.retryDelay; // 예: "34s"
    if (typeof retryDelay === "string" && retryDelay.endsWith("s")) {
      return Math.ceil(parseFloat(retryDelay));
    }
  } catch {
    // ignore
  }
  return null;
}

async function callGeminiOnce(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.4,
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`Gemini API 오류 ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    err.retryDelaySeconds = extractRetryDelaySeconds(text);
    throw err;
  }
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("응답에서 텍스트를 찾지 못함: " + JSON.stringify(json).slice(0, 200));
  const cleaned = text.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let attempt = 0;
  for (;;) {
    try {
      return await callGeminiOnce(prompt);
    } catch (err) {
      if (err.status === 429 && attempt < maxRetries) {
        const waitSeconds = err.retryDelaySeconds || 20 * (attempt + 1);
        console.log(`\n  할당량 초과 — ${waitSeconds}초 대기 후 재시도 (${attempt + 1}/${maxRetries})...`);
        await sleep(waitSeconds * 1000);
        attempt += 1;
        continue;
      }
      throw err;
    }
  }
}

const REQUEST_INTERVAL_MS = 7000; // 무료 등급 분당 요청 제한(대략 10 RPM)을 넘지 않도록 여유 있게 설정

async function main() {
  const results = [...existingResults];
  const failures = [];

  for (let i = 0; i < pending.length; i++) {
    const symptom = pending[i];
    process.stdout.write(`처리 중 (${i + 1}/${pending.length}): ${symptom.id} (${symptom.title})... `);
    try {
      const enriched = await callGeminiWithRetry(buildPrompt(symptom));
      results.push({
        id: symptom.id,
        title: symptom.title,
        before: {
          summary: symptom.summary,
          causes: symptom.causes,
          checks: symptom.checks,
        },
        after: enriched,
      });
      console.log("완료");
      // 실패해도 여기까지 온 결과는 즉시 저장 — 중간에 멈춰도 앞의 성공분은 남는다.
      fs.writeFileSync(outPath, JSON.stringify(results, null, 2), "utf8");
    } catch (err) {
      failures.push({ id: symptom.id, error: err.message });
      console.log("실패: " + err.message);
    }
    if (i < pending.length - 1) await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(`\n완료: ${results.length}개 누적 성공, 이번 실행 실패 ${failures.length}개`);
  console.log(`초안 파일: ${path.relative(root, outPath)}`);
  if (failures.length) {
    console.log("실패 목록 (다시 실행하면 이 항목들부터 재시도됩니다):");
    failures.forEach((f) => console.log(`  - ${f.id}: ${f.error}`));
  }
  console.log("\n내용을 검토한 뒤 data.js의 해당 symptom 항목에 overview/summary/causes/checks를 직접 붙여넣으세요.");
  console.log("(이 스크립트는 data.js를 자동으로 수정하지 않습니다.)");
}

main();
