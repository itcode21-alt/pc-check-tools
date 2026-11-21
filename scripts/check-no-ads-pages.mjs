// 도구 페이지(계산기·분석기·마법사·업로드 도구)의 광고 규칙을 지킨다.
// 배경(2026-11-22): 모바일에서 자동 광고(전면·앵커·페이지 내)가 입력 영역과 결과를 가려 사용자가 떠난다고 판단했다.
// 규칙 1) pages 목록의 페이지에는 애드센스 스크립트·광고 칸(<ins class="adsbygoogle">, .ad-unit)을 직접 넣지 않는다.
// 규칙 2) 한국어 도구 페이지(sideAdsPages)는 tool-ads.js 한 줄만 둔다. 이 로더는 화면 폭 1280px 이상에서만
//         애드센스 스크립트를 불러와 측면 광고를 허용한다(모바일·좁은 화면에는 광고가 없다).
// 가이드 글 페이지의 광고는 이 검사의 대상이 아니다. 목록: scripts/lib/no-ads-pages.json
// 사용: node scripts/check-no-ads-pages.mjs  (위반이 있으면 종료 코드 1)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const cfg = JSON.parse(fs.readFileSync(path.join(root, "scripts/lib/no-ads-pages.json"), "utf8"));
const side = new Set(cfg.sideAdsPages || []);
const bad = [];
let checked = 0;
for (const page of cfg.pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) { bad.push(`${page}: 파일이 없습니다(목록에서 지우거나 파일명을 확인하세요)`); continue; }
  checked++;
  const html = fs.readFileSync(file, "utf8");
  const found = [];
  if (/pagead2\.googlesyndication\.com/.test(html)) found.push("애드센스 스크립트 직접 삽입");
  if (/class="adsbygoogle"/.test(html)) found.push("광고 칸(<ins class=\"adsbygoogle\">)");
  if (/class="ad-unit/.test(html)) found.push("광고 영역(.ad-unit)");
  const loaders = (html.match(/tool-ads\.js/g) || []).length;
  if (side.has(page) && loaders !== 1) found.push(`tool-ads.js 로더가 ${loaders}개(1개여야 함)`);
  if (!side.has(page) && loaders > 0) found.push("광고를 넣지 않기로 한 페이지에 tool-ads.js가 있음");
  if (found.length) bad.push(`${page}: ${found.join(", ")}`);
}
for (const page of side) if (!cfg.pages.includes(page)) bad.push(`${page}: sideAdsPages에만 있고 pages에는 없음`);
if (bad.length) {
  console.error("❌ 도구 페이지 광고 규칙 위반(scripts/lib/no-ads-pages.json):");
  bad.forEach((b) => console.error("  - " + b));
  process.exit(1);
}
console.log(`✓ 도구 페이지 광고 규칙: 정상 (검사한 페이지 ${checked}개, 측면 광고 로더 ${side.size}개)`);
