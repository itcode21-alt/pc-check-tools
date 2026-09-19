// app.js가 데이터로 렌더링하는 루트 요소가 있는 페이지에 데이터 소스가 실제로 있는지 검사합니다.
//
// 배경: 2026-09-17 data.js 분리 리팩터링 때 guides.html의 data.js 태그만 지워지고 대체 조각
// 파일이 빠져 "가이드 0개"로 표시됐고, 같은 날 normalizeCode가 한글 코드를 못 찾아 14개
// 페이지가 정적 폴백에 머물렀다. 둘 다 링크·버전 검사가 정적이라 통과했다.
//
// 검사 1) [data-error-code-page] / [data-symptom-detail-page] / [data-guides-root] /
//         [data-diagnostic-root] 가 있고 app.js를 로드하는 페이지는 데이터 소스가 있어야 한다
//         (외부 data*.js 태그 또는 인라인 `window.SITE_DATA = {...}`).
// 검사 2) 오류코드 상세 페이지의 data-error-code-page 값이 그 페이지가 가진 인라인 데이터의
//         "code"/"aliases"에 실제로 있어야 한다(인라인 번들 페이지만 — 외부 조각을 로드하는
//         페이지는 전체 데이터를 갖고 있으므로 건너뜀).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

const ROOT_ATTR = /data-(?:error-code-page|symptom-detail-page|guides-root|diagnostic-root)\b/;
const LOADS_APP = /<script[^>]+src="app\.js(?:\?[^"]*)?"/;
const EXTERNAL_DATA = /<script[^>]+src="(?:data|data-[a-z-]+)\.js(?:\?[^"]*)?"/;
const INLINE_DATA = /<script>\s*window\.SITE_DATA\s*=/;
const ERROR_CODE_ATTR = /data-error-code-page="([^"]+)"/;

const problems = [];
let checked = 0;

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf-8");
  if (!LOADS_APP.test(html) || !ROOT_ATTR.test(html)) continue;
  checked += 1;

  const hasExternal = EXTERNAL_DATA.test(html);
  const hasInline = INLINE_DATA.test(html);
  if (!hasExternal && !hasInline) {
    problems.push(`${file}: app.js 렌더링 루트가 있는데 데이터 소스(data*.js 또는 인라인 SITE_DATA)가 없습니다.`);
    continue;
  }

  const attr = html.match(ERROR_CODE_ATTR)?.[1];
  if (hasInline && !hasExternal && attr) {
    const inline = html.match(/<script>\s*window\.SITE_DATA\s*=([\s\S]*?)<\/script>/)?.[1] ?? "";
    let data;
    try {
      data = new Function(`return (${inline.trim().replace(/;$/, "")})`)();
    } catch {
      problems.push(`${file}: 인라인 SITE_DATA를 해석하지 못했습니다.`);
      continue;
    }
    const wanted = attr.trim().toLowerCase();
    const found = (data.errorCodes || []).some((item) =>
      [item.code, ...(item.aliases || [])].some((c) => String(c).trim().toLowerCase() === wanted)
    );
    if (!found) {
      problems.push(`${file}: data-error-code-page="${attr}" 코드가 인라인 SITE_DATA.errorCodes에 없습니다(동적 렌더링이 조용히 실패합니다).`);
    }
  }
}

if (problems.length) {
  console.log("❌ 페이지 데이터 소스 검사 실패:");
  problems.forEach((p) => console.log(`   - ${p}`));
  process.exitCode = 1;
} else {
  console.log(`✓ 페이지 데이터 소스 정상 (렌더링 루트가 있는 페이지 ${checked}개 검사)`);
}
