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

const files = fs.readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".html") && !excluded.has(entry.name))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const locations = files.map((file) => {
  const loc = file === "index.html" ? `${baseUrl}/` : `${baseUrl}/${file}`;
  return `  <url><loc>${loc}</loc></url>`;
}).join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${locations}\n</urlset>\n`;
fs.writeFileSync(path.join(root, "sitemap.xml"), sitemap);
console.log(`Generated sitemap.xml with ${files.length} public HTML pages.`);
