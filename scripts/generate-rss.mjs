// RSS 2.0 피드를 생성합니다 (네이버 서치어드바이저 RSS 제출용).
// 사이트맵과 달리 "최근에 새로 만들었거나 수정한 페이지"만 최신순으로 담아,
// 검색엔진이 변경된 콘텐츠를 더 빨리 재수집하도록 신호를 줍니다.
// 사용법: node scripts/generate-rss.mjs
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const baseUrl = "https://itsvc.co.kr";
const excluded = new Set([
  "404.html",
  "admin.html",
  "admin-local.html",
  "community-cases-admin.html",
  "search-results.html",
]);

const MAX_ITEMS = 80;

const files = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html") && !excluded.has(entry.name))
  .map((entry) => entry.name);

// 소스 HTML의 title/description은 이미 HTML 엔티티로 인코딩된 상태로 저장돼
// 있는 경우가 있다(예: 메타 description 안의 큰따옴표 -> &quot;). 그대로
// XML로 다시 escapeXml하면 &quot;가 &amp;quot;로 이중 인코딩된다.
// 먼저 디코드해서 원문 텍스트로 되돌린 뒤, 우리가 직접 한 번만 이스케이프한다.
const unescapeHtml = (s) => String(s)
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&");

const escapeXml = (s) => unescapeHtml(s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const items = [];
for (const file of files) {
  const html = fs.readFileSync(path.join(root, file), "utf-8");

  const titleMatch = html.match(/<title>(.*?)<\/title>/s);
  if (!titleMatch) continue;
  const title = titleMatch[1].trim();

  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const description = descMatch ? descMatch[1] : "";

  // dateModified는 여러 개의 JSON-LD 블록에 나타날 수 있어(TechArticle, WebPage 등)
  // 가장 마지막 값을 그 페이지의 최종 수정일로 취급합니다.
  const dateMatches = [...html.matchAll(/"dateModified":"(\d{4}-\d{2}-\d{2})"/g)];
  if (dateMatches.length === 0) continue;
  const dateModified = dateMatches[dateMatches.length - 1][1];

  const loc = file === "index.html" ? `${baseUrl}/` : `${baseUrl}/${file}`;
  items.push({ file, title, description, dateModified, loc });
}

items.sort((a, b) => (a.dateModified < b.dateModified ? 1 : a.dateModified > b.dateModified ? -1 : 0));
const topItems = items.slice(0, MAX_ITEMS);

const rssItems = topItems.map((item) => {
  const pubDate = new Date(`${item.dateModified}T00:00:00+09:00`).toUTCString();
  return `  <item>
    <title>${escapeXml(item.title)}</title>
    <link>${item.loc}</link>
    <guid isPermaLink="true">${item.loc}</guid>
    <description>${escapeXml(item.description)}</description>
    <pubDate>${pubDate}</pubDate>
  </item>`;
}).join("\n");

const now = new Date().toUTCString();
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>PC 윈도우 진단 센터</title>
  <link>${baseUrl}/</link>
  <description>부팅·블루스크린·USB 미인식 등 PC 증상 자가진단 가이드. 오류 코드·이벤트 로그·게임 오류·Windows 업데이트 문제를 실제 사례와 공식 자료로 확인하세요.</description>
  <language>ko-KR</language>
  <lastBuildDate>${now}</lastBuildDate>
${rssItems}
</channel>
</rss>
`;

fs.writeFileSync(path.join(root, "rss.xml"), rss);
console.log(`Generated rss.xml with ${topItems.length} recent items (of ${items.length} pages with dateModified).`);
