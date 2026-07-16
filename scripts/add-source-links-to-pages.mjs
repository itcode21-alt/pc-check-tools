import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = {};
vm.createContext(context);
let dataSrc = fs.readFileSync(path.join(root, "data.js"), "utf8")
  .replace("window.SITE_DATA = ", "globalThis.SITE_DATA = ");
vm.runInContext(dataSrc, context);
const data = context.SITE_DATA;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

let updated = 0;
let missingFile = [];
let noSource = [];
let alreadyHas = [];

for (const code of data.errorCodes) {
  if (!code.officialSource) { noSource.push(code.code); continue; }
  const fileName = code.detailPage || code.link;
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) { missingFile.push(code.code); continue; }

  let html = fs.readFileSync(filePath, "utf8");
  if (html.includes("공식 참고자료")) { alreadyHas.push(code.code); continue; }

  const section = `        <h3>공식 참고자료</h3>\n        <div class="link-list"><a href="${escapeHtml(code.officialSource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(code.officialSource.title)}</a></div>\n        <h3>자주 묻는 질문</h3>`;
  const updatedHtml = html.replace("        <h3>자주 묻는 질문</h3>", section);
  if (updatedHtml === html) { missingFile.push(`${code.code} (앵커 없음)`); continue; }

  fs.writeFileSync(filePath, updatedHtml);
  updated++;
}

console.log(`업데이트 완료: ${updated}개`);
console.log(`출처 없음(건너뜀): ${noSource.length}개`);
console.log(`파일 없음/앵커 없음: ${missingFile.length}개`, missingFile);
console.log(`이미 반영됨: ${alreadyHas.length}개`);
