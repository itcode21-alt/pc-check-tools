// 도구 페이지(계산기·분석기·마법사·업로드 도구)에 애드센스 스크립트나 광고 칸이 다시 들어가는 것을 막는다.
// 배경(2026-11-22): 모바일에서 자동 광고(전면·앵커·페이지 내)가 입력 영역과 결과를 가려 사용자가 떠난다고 판단해
// 도구 페이지에서만 광고를 뺐다. 가이드 글 페이지의 광고는 유지한다. 대상 목록: scripts/lib/no-ads-pages.json
// 사용: node scripts/check-no-ads-pages.mjs  (위반이 있으면 종료 코드 1)
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const { pages } = JSON.parse(fs.readFileSync(path.join(root, "scripts/lib/no-ads-pages.json"), "utf8"));
const bad = [];
let checked = 0;
for (const page of pages) {
  const file = path.join(root, page);
  if (!fs.existsSync(file)) { bad.push(`${page}: 파일이 없습니다(목록에서 지우거나 파일명을 확인하세요)`); continue; }
  checked++;
  const html = fs.readFileSync(file, "utf8");
  const found = [];
  if (/pagead2\.googlesyndication\.com/.test(html)) found.push("애드센스 스크립트");
  if (/class="adsbygoogle"/.test(html)) found.push("광고 칸(<ins class=\"adsbygoogle\">)");
  if (/class="ad-unit/.test(html)) found.push("광고 영역(.ad-unit)");
  if (found.length) bad.push(`${page}: ${found.join(", ")}`);
}
if (bad.length) {
  console.error("❌ 도구 페이지에 광고 코드가 있습니다(도구 페이지는 광고를 넣지 않기로 함, scripts/lib/no-ads-pages.json):");
  bad.forEach((b) => console.error("  - " + b));
  process.exit(1);
}
console.log(`✓ 도구 페이지 광고 제외 유지: 정상 (검사한 페이지 ${checked}개)`);
