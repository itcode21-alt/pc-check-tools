import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();

// 각 HTML 파일의 lastmod를 "그 파일이 마지막으로 커밋된 날짜"로 단순하게 구하면 정확하지
// 않다 — 이 사이트는 공유 자산(app.js/style.css/site.js 등)의 캐시 버전 문자열을 올릴 때,
// 파비콘·theme-color 메타 태그를 추가할 때, 오류코드 상세 페이지의 인라인 SITE_DATA 번들을
// 재생성할 때(build-detail-bundles.mjs) 등 "그 페이지의 실제 내용은 그대로인데 파일 바이트만
// 바뀌는" 사이트 전체 일괄 커밋이 잦다. 이런 커밋의 날짜를 lastmod로 쓰면 대부분의 페이지가
// 같은 날짜로 몰려 "가짜 신선도"가 되고, Google은 이런 부정확한 lastmod를 감지하면 사이트맵
// 전체의 lastmod 신호를 아예 무시해버린다(공식 가이드 경고). 그래서 git log -p로 모든 HTML
// 파일의 전체 변경 이력을 한 번에 읽고, 각 커밋의 diff에서 "이 파일에 실제 콘텐츠로 보이는
// 줄 변경이 있었는지"를 판정해 그런 변경이 있는 가장 최근 커밋의 날짜만 lastmod로 쓴다
// (2026-09-22 Search Console 미색인 조사 중 결정 — 처음엔 단순 "최종 커밋일"로 시도했다가
// about.html 등 369개 중 336개가 캐시 버전 문자열 하나 때문에 같은 날짜로 몰리는 걸 보고
// 이 방식으로 바꿨다).
const CHROME_LINE_PATTERNS = [
  /<script[^>]*src="(?:site|app|app-diagnostic-tool|data|data-[a-z-]+|search-index|search-core|search|ui-init|design-system-enhancement)\.js/,
  /<link rel="stylesheet" href="style\.css/,
  /googletagmanager|adsbygoogle|dataLayer|gtag\(/,
  /<meta name="theme-color"/,
  /<meta name="viewport"/,
  /<link rel="(?:icon|manifest|apple-touch-icon)"/,
  /class="site-header|class="nav"|class="site-search|class="brand"|class="brand-mark|data-site-search/,
  /class="site-footer|footer-links|<footer/,
  /class="skip-link|data-itsvc-site-shell/,
  /^\s*<!--.*-->\s*$/,
  /^\s*<html[^>]*>\s*$/,
  /window\.SITE_DATA\s*=/, // 페이지별 인라인 데이터 번들(build-detail-bundles.mjs) 재생성
];
const isChromeLine = (line) => !line.trim() || CHROME_LINE_PATTERNS.some((re) => re.test(line));

const lastModByFile = (() => {
  const raw = execFileSync(
    "git",
    ["log", "--format=@@COMMIT@@%H %ad", "--date=short", "-p", "--diff-filter=ACMR", "--", "*.html"],
    { cwd: root, encoding: "utf8", maxBuffer: 1024 * 1024 * 256 }
  );
  const map = new Map();
  let currentDate = null;
  let currentFile = null;
  let hasRealChange = false;
  const finalizeFile = () => {
    if (currentFile && hasRealChange && !map.has(currentFile)) map.set(currentFile, currentDate);
    currentFile = null;
    hasRealChange = false;
  };
  for (const line of raw.split("\n")) {
    if (line.startsWith("@@COMMIT@@")) {
      finalizeFile();
      const rest = line.slice("@@COMMIT@@".length);
      const spaceAt = rest.indexOf(" ");
      currentDate = rest.slice(spaceAt + 1);
    } else if (line.startsWith("diff --git a/")) {
      finalizeFile();
      const m = line.match(/^diff --git a\/(.*?) b\//);
      currentFile = m ? m[1] : null;
    } else if ((line.startsWith("+") || line.startsWith("-")) && !line.startsWith("+++") && !line.startsWith("---")) {
      if (currentFile && !map.has(currentFile) && !isChromeLine(line.slice(1))) hasRealChange = true;
    }
  }
  finalizeFile();
  return map;
})();
const baseUrl = "https://itsvc.co.kr";
const excluded = new Set([
  "404.html",
  "admin.html",
  "admin-local.html",
  "community-cases-admin.html",
  "search-results.html",
]);

const isSelfCanonical = (file) => {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const m = html.match(/<link rel="canonical" href="([^"]*)">/);
  if (!m) return true; // no canonical tag: nothing to contradict, keep it
  const expected = file === "index.html" ? `${baseUrl}/` : `${baseUrl}/${file}`;
  return m[1] === expected;
};

const files = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html") && !excluded.has(entry.name))
  .map((entry) => entry.name)
  .filter(isSelfCanonical) // 다른 페이지를 canonical로 지정한 별칭 페이지는 사이트맵에서 제외
  .sort((a, b) => a.localeCompare(b));

const locations = files.map((file) => {
  const loc = file === "index.html" ? `${baseUrl}/` : `${baseUrl}/${file}`;
  const lastmod = lastModByFile.get(file);
  return lastmod
    ? `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`
    : `  <url><loc>${loc}</loc></url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
const withDate = files.filter((f) => lastModByFile.has(f)).length;
console.log(`Generated sitemap.xml with ${files.length} public HTML pages (${withDate} with a detected content-changing commit, ${files.length - withDate} unmatched — new/renamed files not yet in git history).`);
