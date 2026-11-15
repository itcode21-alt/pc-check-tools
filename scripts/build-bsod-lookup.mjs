// 블루스크린 코드 해석기(bluescreen-code-finder.html)용 경량 데이터 bsod-lookup.js 를 만든다.
// 원본은 data-error-codes.js(약 700KB)의 errorCodes 중 정지 코드(0x0000XXXX)와 0xC000021A.
// 원본을 고치면 `node scripts/build-bsod-lookup.mjs` 를 다시 실행한다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const win = {};
// eslint-disable-next-line no-new-func
new Function("window", readFileSync(join(root, "data-error-codes.js"), "utf-8"))(win);
const list = win.SITE_DATA.errorCodes;

// 정지 코드 이름(영문 대문자·밑줄)이 제목인 0x0000XXXX 항목 + 0xC000021A. 프린터 0x709 같은 일반 오류는 제외.
const isStop = (e) => (/^0x0000[0-9A-Fa-f]{4}$/.test(e.code) && /^[A-Z0-9_]+$/.test(e.title)) || /^0xC000021A$/i.test(e.code);
const rows = list.filter(isStop).map((e) => {
  const hex = e.code.replace(/^0x/i, "").toUpperCase().padStart(8, "0");
  const short = "0x" + hex.replace(/^0+(?=.)/, "");
  const isName = /^[A-Z0-9_]+$/.test(e.title);
  return {
    c: short, h: hex,
    n: isName ? e.title : "",            // 정지 코드 이름 (영문). 없으면 빈 문자열
    t: isName ? "" : e.title,            // 한글 제목
    s: e.summary,
    k: (e.causes || []).slice(0, 3),
    v: (e.checks || []).slice(0, 4),
    l: e.detailPage || e.link || "",
    a: (e.aliases || []).map((x) => String(x).toLowerCase()),
  };
}).sort((a, b) => parseInt(a.h, 16) - parseInt(b.h, 16));

const out = "/* 자동 생성: node scripts/build-bsod-lookup.mjs (원본 data-error-codes.js) — 직접 고치지 마세요 */\n" +
  "window.BSOD_LOOKUP=" + JSON.stringify(rows) + ";\n";
writeFileSync(join(root, "bsod-lookup.js"), out);
console.log(`bsod-lookup.js 생성 완료: 코드 ${rows.length}개, ${out.length}바이트`);
