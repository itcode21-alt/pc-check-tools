// 전체 정적 HTML 파일의 내부 링크(href)가 실제 존재하는 파일을 가리키는지 검사합니다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// en/ 영문판 페이지도 함께 검사한다(루트 절대 경로 "/x.html"는 사이트 루트 기준으로 확인).
const htmlFiles = [
  ...readdirSync(root).filter((f) => f.endsWith(".html")),
  ...(existsSync(join(root, "en")) ? readdirSync(join(root, "en")).filter((f) => f.endsWith(".html")).map((f) => `en/${f}`) : []),
];

const hrefPattern = /href="([^"]+)"/g;
let brokenCount = 0;
const brokenByFile = {};

for (const file of htmlFiles) {
  const content = readFileSync(join(root, file), "utf-8").replace(/<script[\s\S]*?<\/script>/gi, "");
  let match;
  while ((match = hrefPattern.exec(content))) {
    let href = match[1];
    if (/^(https?:|mailto:|tel:|#|javascript:)/.test(href)) continue;
    href = href.split("#")[0].split("?")[0];
    if (!href) continue;
    const target = href.startsWith("/") ? join(root, href.slice(1)) : join(root, dirname(file), href);
    if (!existsSync(href.endsWith("/") ? join(target, "index.html") : target)) {
      (brokenByFile[file] ||= new Set()).add(href);
      brokenCount++;
    }
  }
}

const files = Object.keys(brokenByFile);
if (files.length === 0) {
  console.log(`검사한 파일: ${htmlFiles.length}개, 깨진 링크: 0개`);
} else {
  console.log(`검사한 파일: ${htmlFiles.length}개, 깨진 링크가 있는 파일: ${files.length}개\n`);
  for (const file of files) {
    console.log(`${file}:`);
    for (const href of brokenByFile[file]) console.log(`  -> ${href}`);
  }
  process.exitCode = 1;
}
