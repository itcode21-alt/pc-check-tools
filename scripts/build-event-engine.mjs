// app-diagnostic-tool.js의 이벤트 로그(.evtx) 파서와 조합 판정(R1~R12)을 event-engine.js로 복사한다.
// 원본은 app-diagnostic-tool.js 한 곳이다. 규칙을 고친 뒤에는 이 스크립트를 다시 실행해야
// 미니덤프 분석기 페이지가 같은 결과를 낸다. (--check: 복사본이 최신인지 검사만 한다)
import fs from "node:fs";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname;
const src = fs.readFileSync(root + "app-diagnostic-tool.js", "utf8").split("\n");
const lineOf = (re, from = 0) => {
  const i = src.findIndex((line, n) => n >= from && re.test(line));
  if (i < 0) throw new Error(`앵커를 찾지 못함: ${re}`);
  return i;
};
const parses = (text) => { try { new vm.Script(text); return true; } catch { return false; } };
// start 줄부터 한 문장(선언)이 끝나는 가장 짧은 줄까지
const statement = (start) => {
  for (let end = start; end < Math.min(src.length, start + 900); end++) {
    const text = src.slice(start, end + 1).join("\n");
    if (/[;}]\s*$/.test(src[end]) && parses(text)) return text;
  }
  throw new Error(`선언 끝을 찾지 못함: ${src[start].slice(0, 60)}`);
};

const parts = [];
parts.push(statement(lineOf(/^const normalizeLogText =/)));
parts.push(statement(lineOf(/^const firstMatch =/)));
parts.push(statement(lineOf(/^const maskEventPrivacy =/)));
// SYSTEM_TOKENS ~ parseEvtxArrayBuffer 끝(splitEventBlocks 직전)
const evtxStart = lineOf(/^const SYSTEM_TOKENS =/);
const evtxEnd = lineOf(/^const splitEventBlocks =/);
parts.push(src.slice(evtxStart, evtxEnd).join("\n"));
parts.push(statement(lineOf(/^const extractEventViewerFields =/)));
parts.push(statement(lineOf(/^\s*const parseSessionTime =/)));
parts.push(statement(lineOf(/^\s*const formatSessionTime =/)));
// 조합 판정: 주석 머리글부터 buildEventBatchInsight 직전까지
const comboStart = lineOf(/^\s*\/\/ ───── 이벤트 조합 판정/);
const comboEnd = lineOf(/^\s*const buildEventBatchInsight =/, comboStart);
parts.push(src.slice(comboStart, comboEnd).join("\n"));
parts.push(src[lineOf(/^\s*const COMBO_RULES_VERSION =/)]);

const out = `// 자동 생성 파일 — 직접 고치지 마세요. 원본은 app-diagnostic-tool.js이며
// node scripts/build-event-engine.mjs 로 다시 만듭니다. (이벤트 로그 파서 + 조합 판정 R1~R12)
(function () {
  "use strict";
  let data = {};
  const escapeEventText = (value) => String(value || "")
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
${parts.join("\n\n")}
  window.ItsEventEngine = {
    parseEvtxArrayBuffer, extractEventViewerFields, evaluateEventCombos, renderEventCombos,
    rulesVersion: COMBO_RULES_VERSION,
    setData(value) { data = value || {}; },
  };
})();
`;
const target = root + "event-engine.js";
if (process.argv.includes("--check")) {
  const current = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
  if (current !== out) { console.error("❌ event-engine.js가 app-diagnostic-tool.js와 다릅니다. node scripts/build-event-engine.mjs 를 실행하세요."); process.exit(1); }
  console.log("✓ event-engine.js 최신");
} else {
  fs.writeFileSync(target, out);
  console.log("event-engine.js 생성", out.length, "bytes");
}
