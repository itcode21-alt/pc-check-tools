// 정적 HTML에만 있고 방문자 화면에는 안 나오는 캡처 이미지를 찾아냅니다.
//
// 배경: 증상 상세(data-symptom-detail-page)와 오류 코드 상세(data-error-code-page) 페이지는
// 페이지 안의 정적 폴백 본문을 app.js가 data.js 기반으로 통째로 다시 그려서 덮어씁니다.
// 그래서 HTML에만 <img class="guide-image">를 넣으면 검색 로봇과 JS를 끈 브라우저에게만
// 보이고 실제 방문자에게는 안 보입니다(2026-10-27 점검에서 54개 페이지·88장이 이런 상태였음).
//
// 방문자 화면에 나오는 이미지는 아래 데이터에 있는 것뿐입니다.
//   - 증상 상세: symptomDetails[키].checks[].images[]·deeper[].images[] (app.js의 renderCheckImages),
//     extraSections[] (정적 HTML에만 쓴 손글씨 구간을 HTML 문자열로 그대로 담는 선택 필드)
//   - 오류 코드 상세: errorCodes[].screenshot(1장)과 errorCodes[].captures[](여러 장, 설명 문단 포함.
//     app.js의 renderErrorCaptures)
//
// 사용법:
//   node scripts/check-static-images-rendered.mjs --staged   커밋 대상 HTML만 검사(pre-commit)
//   node scripts/check-static-images-rendered.mjs --all      전체 검사(현황 확인용)
//   node scripts/check-static-images-rendered.mjs --write-baseline   지금 남은 항목을 기준 목록에 기록
//
// 기준 목록(docs/static-images-pending.json)은 아직 data.js로 옮기지 못한 과거 항목입니다.
// 목록에 있는 항목은 실패로 치지 않고, 목록에 없는 새 항목만 실패시킵니다. 항목을 data.js로
// 옮겼다면 --write-baseline으로 목록을 다시 만들어 줄여 가세요(목록에 남은 항목은 --all에서 보입니다).
import { execSync } from "node:child_process";
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const writeBaseline = process.argv.includes("--write-baseline");
const mode = process.argv.includes("--all") || writeBaseline ? "all" : "staged";
const baselinePath = join(root, "docs", "static-images-pending.json");
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, "utf-8")) : {};

const normalize = (value) => String(value || "").toLowerCase().replace(/\s+/g, "");
const baseName = (path) => String(path || "").replace(/^.*\//, "").replace(/\.(webp|jpe?g|png)$/i, "");

let files;
if (mode === "all") {
  files = readdirSync(root).filter((f) => f.endsWith(".html"));
} else {
  files = execSync("git diff --cached --name-only --diff-filter=ACM", { cwd: root, encoding: "utf-8" })
    .split("\n")
    .filter((f) => f.endsWith(".html") && !f.includes("/"));
}

// app.js가 다시 그리는 루트 요소(data-symptom-detail-page / data-error-code-page)의 HTML만 잘라냅니다.
// 루트 바깥(예: </section> 뒤에 직접 붙인 블록)에 있는 이미지는 JS가 지우지 않아 방문자에게 그대로 보입니다.
function rootHtml(html, attr) {
  const at = html.search(new RegExp(`${attr}="`));
  const open = html.lastIndexOf("<", at);
  const tagMatch = html.slice(open + 1).match(/^[a-z0-9]+/i);
  if (!tagMatch) return ""; // 스크립트 문자열 등에 속성 이름만 나오는 페이지(admin.html 등)
  const tag = tagMatch[0];
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi");
  re.lastIndex = open;
  let depth = 0;
  let match;
  while ((match = re.exec(html))) {
    depth += match[1] ? -1 : 1;
    if (depth === 0) return html.slice(open, match.index + match[0].length);
  }
  return html.slice(open);
}

const problems = [];
const pending = {};
let checked = 0;
let known = 0;

for (const file of files) {
  const html = readFileSync(join(root, file), "utf-8");
  const symptom = html.match(/data-symptom-detail-page="([^"]+)"/);
  const errorCode = html.match(/data-error-code-page="([^"]+)"/);
  if (!symptom && !errorCode) continue;

  const scope = rootHtml(html, symptom ? "data-symptom-detail-page" : "data-error-code-page");
  const staticImages = [...scope.matchAll(/<img [^>]*src="(assets\/[^"]+)"[^>]*class="guide-image"/g)].map((m) => baseName(m[1]));
  if (!staticImages.length) continue;
  checked += 1;

  // 페이지에 심어 둔 인라인 SITE_DATA가 실제 렌더링에 쓰이는 데이터입니다(build-detail-bundles.mjs).
  const inline = html.match(/<script>\s*window\.SITE_DATA\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/);
  if (!inline) continue; // 외부 data*.js를 쓰는 페이지는 이 검사 대상이 아닙니다.
  let data;
  try {
    data = JSON.parse(inline[1]);
  } catch {
    continue;
  }

  const rendered = new Set();
  if (symptom) {
    const details = data.symptomDetails && data.symptomDetails[symptom[1]];
    if (!details) continue; // 데이터가 없으면 정적 HTML이 그대로 보이므로 문제없음
    for (const item of [...(details.checks || []), ...(details.deeper || [])]) {
      for (const image of item.images || []) rendered.add(baseName(image.src));
    }
    for (const section of details.extraSections || []) {
      for (const match of String(section).matchAll(/assets\/([^"']+?)\.(?:webp|jpe?g|png)/g)) rendered.add(match[1]);
    }
  } else {
    const key = normalize(errorCode[1]);
    const code = (data.errorCodes || []).find(
      (item) => normalize(item.code) === key || (item.aliases || []).some((alias) => normalize(alias) === key),
    );
    if (!code) continue;
    if (code.screenshot && code.screenshot.src) rendered.add(baseName(code.screenshot.src));
    for (const capture of code.captures || []) rendered.add(baseName(capture.src));
  }

  const missing = [...new Set(staticImages)].filter((name) => !rendered.has(name));
  if (missing.length) pending[file] = missing;
  const fresh = missing.filter((name) => !(baseline[file] || []).includes(name));
  known += missing.length - fresh.length;
  if (fresh.length) {
    problems.push(`${file}: 방문자 화면에 안 나오는 이미지 ${fresh.length}장 → ${fresh.join(", ")}`);
  }
}

if (writeBaseline) {
  const sorted = Object.fromEntries(Object.entries(pending).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(baselinePath, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`기준 목록 기록: ${Object.keys(sorted).length}개 페이지, 이미지 ${Object.values(sorted).flat().length}장 → docs/static-images-pending.json`);
  process.exit(0);
}

if (problems.length) {
  console.error(`✗ 정적 HTML에만 있는 캡처 ${problems.length}개 페이지 (검사한 페이지 ${checked}개, 대상: ${mode === "all" ? "전체" : "커밋 대상"})`);
  for (const line of problems) console.error("  - " + line);
  console.error("");
  console.error("  증상 가이드는 data.js 해당 점검 항목(checks·deeper)의 images: [{ src, full, alt, width, height }]나 extraSections를,");
  console.error("  오류 코드는 해당 코드의 screenshot 또는 captures를 추가한 뒤 node scripts/split-data.mjs와");
  console.error("  node scripts/build-detail-bundles.mjs를 실행하세요. 자세한 배경은 이 파일 상단 주석을 참고하세요.");
  process.exit(1);
}

const knownNote = known ? `, 기준 목록의 미이전 ${known}장은 제외` : "";
console.log(`✓ 정적 캡처가 방문자 화면에도 나옴 (검사한 페이지 ${checked}개, 대상: ${mode === "all" ? "전체" : "커밋 대상"}${knownNote})`);
