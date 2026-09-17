// data.js(1.2MB)를 카테고리별 파일로 분리해서 생성합니다.
// 대부분의 페이지(오류코드 상세, 증상 상세)는 SITE_DATA의 일부 카테고리만
// 필요한데도 지금까지는 항상 data.js 전체를 불러왔습니다. 이 스크립트는
// data.js를 유일한 원본(source of truth)으로 유지한 채, 거기서 카테고리별
// 조각 파일(data-*.js)을 파생시킵니다. data.js 자체를 고치면 이 스크립트를
// 다시 실행해서 조각 파일들을 갱신해야 합니다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const dataSrc = readFileSync(join(root, "data.js"), "utf-8");
const dataWindow = {};
// eslint-disable-next-line no-new-func
new Function("window", dataSrc)(dataWindow);
const DATA = dataWindow.SITE_DATA;

const CHUNKS = {
  "data-core.js": { siteName: DATA.siteName, siteUrl: DATA.siteUrl },
  "data-error-codes.js": { errorCodes: DATA.errorCodes },
  "data-symptoms.js": { symptoms: DATA.symptoms },
  "data-symptom-details.js": { symptomDetails: DATA.symptomDetails },
  "data-board-parts.js": { boardParts: DATA.boardParts },
  "data-event-codes.js": { eventViewerCodes: DATA.eventViewerCodes },
  "data-parts-catalog.js": { parts: DATA.parts },
};

for (const [filename, chunk] of Object.entries(CHUNKS)) {
  const body = `window.SITE_DATA = Object.assign(window.SITE_DATA || {}, ${JSON.stringify(chunk)});\n`;
  writeFileSync(join(root, filename), body, "utf-8");
  console.log(filename, `${(body.length / 1024).toFixed(1)}KB`);
}
