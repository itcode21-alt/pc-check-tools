// 오류코드/증상 상세 페이지 각각에 필요한 SITE_DATA를 최소 단위로 계산해서
// <script>window.SITE_DATA = {...}</script>로 그 페이지 안에 직접 심습니다.
//
// 배경: data.js를 카테고리별로 나눠도(scripts/split-data.mjs) 오류코드 상세
// 페이지는 여전히 errorCodes 159개 전체(500KB+)를, 증상 상세 페이지는
// symptomDetails 67개 전체(300KB+)를 받는데, 실제로 화면에 렌더링되는 건 자기
// 항목 1개 + 관련 항목 몇 개뿐입니다. app.js의 교차 참조 로직(findErrorCode,
// getRelatedErrorCodes, getRelatedEvents, getSymptomRelatedCodes 등)을 그대로
// 재사용해(손으로 다시 옮겨 적지 않고 app.js에서 해당 줄 범위를 그대로 추출해
// 실행) 페이지별로 정확히 필요한 항목만 골라낸다.
//
// app.js의 아래 함수/블록이 바뀌면 이 스크립트의 EXTRACT_RANGES도 같이
// 확인할 것: normalizeCode/findErrorCode/getRelatedErrorCodes/getRelatedEvents
// (공용 헬퍼), quickCodeLookup/detailRelatedLookup/getSymptomRelatedCodes
// (증상 상세 전용). 라인 번호가 밀렸으면 grep으로 다시 찾아 EXTRACT_RANGES를
// 갱신해야 한다.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const dataSrc = readFileSync(join(root, "data.js"), "utf-8");
const dataWindow = {};
new Function("window", dataSrc)(dataWindow);
const DATA = dataWindow.SITE_DATA;

const appSrc = readFileSync(join(root, "app.js"), "utf-8");
const appLines = appSrc.split("\n");
// 1-indexed inclusive line ranges, extracted verbatim from app.js (검증: node --check로
// 확인한 실제 경계 — 위 주석 참고).
const EXTRACT_RANGES = [
  [38, 98],   // data, normalizeCode, findErrorCode, getErrorCodeLabel, codeToBoardParts,
              // codeToEvents, getRelatedEvents, getRelatedBoardParts, getRelatedErrorCodes
  [792, 809], // quickCodeLookup
  [1103, 1126], // detailRelatedLookup
  [1157, 1170], // getSymptomRelatedCodes
];
const extracted = EXTRACT_RANGES.map(([a, b]) => appLines.slice(a - 1, b).join("\n")).join("\n");

// 위 블록은 `const data = window.SITE_DATA || {...}`로 시작하므로, DATA를
// window.SITE_DATA에 먼저 얹어 그대로 재사용한다.
const sandbox = { window: { SITE_DATA: DATA, location: { pathname: "/" } }, console };
vm.createContext(sandbox);
vm.runInContext(
  `${extracted}\nglobalThis.__helpers = { findErrorCode, getRelatedErrorCodes, getRelatedEvents, getSymptomRelatedCodes, normalizeCode };`,
  sandbox
);
const { findErrorCode, getRelatedErrorCodes, getRelatedEvents, getSymptomRelatedCodes, normalizeCode } = sandbox.__helpers;

function buildBundleForErrorCode(code) {
  const relatedSymptom = (DATA.symptoms || []).find((item) => item.link === code.relatedSymptom);
  const relatedCodes = getRelatedErrorCodes(code);
  const relatedEvents = getRelatedEvents(code);

  const errorCodesSet = new Map();
  errorCodesSet.set(normalizeCode(code.code), code);
  relatedCodes.forEach((c) => errorCodesSet.set(normalizeCode(c.code), c));

  return {
    siteName: DATA.siteName,
    siteUrl: DATA.siteUrl,
    errorCodes: [...errorCodesSet.values()],
    symptoms: relatedSymptom ? [relatedSymptom] : [],
    boardParts: DATA.boardParts,
    eventViewerCodes: relatedEvents,
  };
}

function buildBundleForSymptom(pageKey) {
  const symptom = (DATA.symptoms || []).find((item) => item.id === pageKey);
  const details = (DATA.symptomDetails || {})[pageKey];
  const relatedCodes = getSymptomRelatedCodes(pageKey);
  const relatedSymptomIds = new Set([pageKey]);
  // detailRelatedLookup은 위 EXTRACT_RANGES에서 이미 sandbox에 선언되어 있으므로
  // 재선언하지 않고 그대로 참조만 한다("이미 선언됨" SyntaxError 방지).
  vm.runInContext(`globalThis.__related = detailRelatedLookup[${JSON.stringify(pageKey)}] || [];`, sandbox);
  (sandbox.__related || []).forEach((id) => relatedSymptomIds.add(id));

  const symptomsSet = new Map();
  if (symptom) symptomsSet.set(symptom.id, symptom);
  [...relatedSymptomIds].forEach((id) => {
    const s = (DATA.symptoms || []).find((item) => item.id === id);
    if (s) symptomsSet.set(s.id, s);
  });

  return {
    siteName: DATA.siteName,
    siteUrl: DATA.siteUrl,
    symptoms: [...symptomsSet.values()],
    symptomDetails: details ? { [pageKey]: details } : {},
    boardParts: DATA.boardParts,
    errorCodes: relatedCodes,
  };
}

function replaceScriptTags(html, bundle) {
  const inline = `<script>window.SITE_DATA = ${JSON.stringify(bundle)};</script>`;
  const pattern = /(<script[^>]*\bsrc="data-[a-z-]+\.js\?v=data-split-20260917"[^>]*><\/script>)+/;
  if (!pattern.test(html)) return null;
  return html.replace(pattern, inline);
}

import { readdirSync } from "node:fs";
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

let errorCodeCount = 0;
let symptomCount = 0;
let skipped = [];

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), "utf-8");
  const errCodeMatch = html.match(/data-error-code-page="([^"]+)"/);
  const symptomMatch = html.match(/data-symptom-detail-page="([^"]+)"/);

  if (errCodeMatch) {
    const requestedCode = errCodeMatch[1];
    const code = findErrorCode(requestedCode);
    if (!code) { skipped.push([file, "코드를 data.js에서 못 찾음: " + requestedCode]); continue; }
    const bundle = buildBundleForErrorCode(code);
    const newHtml = replaceScriptTags(html, bundle);
    if (!newHtml) { skipped.push([file, "data-*.js 스크립트 태그 패턴 없음"]); continue; }
    writeFileSync(join(root, file), newHtml, "utf-8");
    errorCodeCount++;
  } else if (symptomMatch) {
    const pageKey = symptomMatch[1];
    const bundle = buildBundleForSymptom(pageKey);
    if (!bundle.symptomDetails[pageKey]) { skipped.push([file, "symptomDetails에 없음: " + pageKey]); continue; }
    const newHtml = replaceScriptTags(html, bundle);
    if (!newHtml) { skipped.push([file, "data-*.js 스크립트 태그 패턴 없음"]); continue; }
    writeFileSync(join(root, file), newHtml, "utf-8");
    symptomCount++;
  }
}

console.log("오류코드 페이지 처리:", errorCodeCount);
console.log("증상 페이지 처리:", symptomCount);
if (skipped.length) {
  console.log("스킵됨:", skipped.length);
  skipped.forEach(([f, reason]) => console.log(" -", f, ":", reason));
}
