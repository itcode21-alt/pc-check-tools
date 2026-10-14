// 새로 만든 상세/콘텐츠 페이지가 공용 스크립트 구성을 빠뜨리는 회귀를 커밋 전에 막습니다.
//
// 배경(2026-10-14 점검): 10월 13일에 추가한 error-code-0x0000010e/0122/0135 페이지가
//  - 페이지별 인라인 번들 대신 전체 data.js(1.2MB)를 불러와 페이지 하나가 2.2MB였고,
//  - ui-init.js(다크모드·목차)와 search-core.js(검색 정렬 로직)가 빠져 있었으며,
//  - 헤더에 검색창 마크업이 없었다.
// 기존 검사(링크·버전·데이터 소스 존재)는 모두 통과해서 아무도 몰랐다.
//
// 검사 1) 단일 코드/증상 상세 페이지(data-error-code-page="값", data-symptom-detail-page="값")는
//         외부 data.js/data-*.js 태그 대신 인라인 SITE_DATA 번들을 써야 한다
//         (node scripts/build-detail-bundles.mjs).
// 검사 2) search.js를 불러오는 페이지는 그 앞에 search-core.js도 불러와야 한다.
// 검사 3) search.js를 불러오는 콘텐츠 페이지는 ui-init.js도 불러와야 한다.
// 검사 4) 정적 <header class="site-header">가 있는 페이지는 검색창(data-site-search)이 있어야 한다.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

// 관리자 도구·404·리다이렉트 스텁은 공용 UI 대상이 아니다.
const EXEMPT = new Set(["admin.html", "admin-local.html", "community-cases-admin.html", "404.html", "parts-compatibility.html", "upgrade-diagnostic.html"]);

const has = (html, name) => new RegExp(`<script[^>]*\\bsrc="${name.replace(".", "\\.")}(?:\\?[^"]*)?"`).test(html);
const problems = [];

for (const file of htmlFiles) {
  if (EXEMPT.has(file)) continue;
  const html = readFileSync(join(root, file), "utf-8");
  const add = (msg) => problems.push(`${file}: ${msg}`);

  const singleDetail = /data-(?:error-code-page|symptom-detail-page)="[^"]+"/.test(html);
  if (singleDetail && /<script[^>]*\bsrc="data(?:-[a-z-]+)?\.js/.test(html)) {
    add("단일 상세 페이지가 외부 data*.js를 불러옵니다 → node scripts/build-detail-bundles.mjs 실행");
  }

  if (has(html, "search.js")) {
    if (!has(html, "search-core.js")) add("search.js 앞에 search-core.js가 없습니다");
    if (!has(html, "ui-init.js")) add("ui-init.js(다크모드·목차)가 없습니다");
  }

  const usesShell = html.includes('id="site-header"');
  if (!usesShell && /<header[^>]*class="site-header/.test(html) && !html.includes("data-site-search")) {
    add("헤더에 검색창(data-site-search)이 없습니다");
  }
}

if (problems.length) {
  console.error(`❌ 공용 스크립트·헤더 구성 문제 ${problems.length}건:`);
  problems.forEach((p) => console.error(` - ${p}`));
  process.exit(1);
}
console.log(`✓ 공용 스크립트·헤더 구성 정상 (검사한 페이지 ${htmlFiles.length - EXEMPT.size}개)`);
