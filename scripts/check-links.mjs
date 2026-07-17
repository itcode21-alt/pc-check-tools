// 전체 정적 HTML 파일의 내부 링크(href)가 실제 존재하는 파일을 가리키는지 검사합니다.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

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
    if (!existsSync(join(root, href))) {
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
}
