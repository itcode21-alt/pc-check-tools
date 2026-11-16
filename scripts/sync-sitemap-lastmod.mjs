// sitemap.xml의 <lastmod>를 각 페이지의 JSON-LD dateModified에 맞춘다(더 늦은 날짜일 때만 올린다).
// 배경(2026-11-17): 이번 주에 고친 페이지 69개의 lastmod가 옛 날짜(10/13·10/21 등)로 남아 있어,
// 검색엔진이 변경을 알아챌 단서가 사이트맵에 없었다. sitemap.xml을 새로 생성하지 않고 날짜만 고친다.
//   node scripts/sync-sitemap-lastmod.mjs          # 변경 대상만 출력
//   node scripts/sync-sitemap-lastmod.mjs --write  # 실제로 sitemap.xml 수정
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const write = process.argv.includes("--write");
const path = join(root, "sitemap.xml");
let xml = readFileSync(path, "utf8");
let changed = 0;
xml = xml.replace(/<url><loc>https:\/\/itsvc\.co\.kr\/([^<]+\.html)<\/loc><lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod><\/url>/g, (whole, file, lastmod) => {
  const page = join(root, file);
  if (!existsSync(page)) return whole;
  const dates = [...readFileSync(page, "utf8").matchAll(/"dateModified":"(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]);
  const latest = dates.sort().pop();
  if (!latest || latest <= lastmod) return whole;
  changed += 1;
  console.log(`${file}: ${lastmod} → ${latest}`);
  return whole.replace(`<lastmod>${lastmod}</lastmod>`, `<lastmod>${latest}</lastmod>`);
});
console.log(`lastmod를 올릴 항목: ${changed}개${write ? " (sitemap.xml 수정함)" : " (--write를 붙이면 수정)"}`);
if (write && changed) writeFileSync(path, xml);
