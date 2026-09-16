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
  return `  <url><loc>${loc}</loc></url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log(`Generated sitemap.xml with ${files.length} public HTML pages.`);
