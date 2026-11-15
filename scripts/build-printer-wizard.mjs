// 프린터 오류 해결 마법사 페이지(printer-troubleshooting-wizard.html)의 정적 해결 순서 목록을
// printer-wizard-data.js 에서 만들어 넣는다(크롤러가 JS 없이도 내용을 읽을 수 있게).
// 데이터를 고치면 `node scripts/build-printer-wizard.mjs` 를 다시 실행한다.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = createRequire(import.meta.url)(join(root, "printer-wizard-data.js"));
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const blocks = Object.entries(W.nodes).filter(([, n]) => n.type === "r").map(([id, n]) => {
  const steps = n.steps.map((s) => `<li>${esc(s)}</li>`).join("");
  const cmd = n.cmd ? `<p class="muted">관리자 권한 명령 프롬프트에서 실행:</p><pre><code>${esc(n.cmd)}</code></pre>` : "";
  const links = [...n.links.map(([h, t]) => `<li><a href="${h}">${esc(t)}</a></li>`),
    ...n.ms.map(([h, t]) => `<li><a href="${h}" target="_blank" rel="noopener noreferrer">${esc(t)}</a></li>`)].join("");
  return `<details id="${id}"><summary><strong>${esc(n.title)}</strong></summary><p>${esc(n.summary)}</p><ol class="mini-list">${steps}</ol>${cmd}${links ? `<ul class="mini-list">${links}</ul>` : ""}</details>`;
}).join("\n        ");

const page = join(root, "printer-troubleshooting-wizard.html");
if (existsSync(page)) {
  let html = readFileSync(page, "utf-8");
  const re = /<!-- PW-LIST:START -->[\s\S]*?<!-- PW-LIST:END -->/;
  if (!re.test(html)) throw new Error("PW-LIST 마커가 없습니다");
  html = html.replace(re, `<!-- PW-LIST:START -->\n        ${blocks}\n        <!-- PW-LIST:END -->`);
  writeFileSync(page, html);
}
console.log(`프린터 마법사 정적 목록 생성 완료: 해결 순서 ${Object.values(W.nodes).filter((n) => n.type === "r").length}개`);
