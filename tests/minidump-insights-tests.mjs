// 미니덤프 분석기 보조 모듈 검증: node tests/minidump-insights-tests.mjs
// 실제 사용자 파일이 아니라 합성 바이트·합성 서버 응답만 쓴다.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const I = createRequire(import.meta.url)("../minidump-insights.js");

// 가짜 File: 앞 부분 바이트와 크기를 마음대로 정한다.
function file(name, bytes, { size, modified = Date.UTC(2026, 8, 18), path = "", text, unreadable = false } = {}) {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  return {
    name, size: size ?? buf.length, lastModified: modified, webkitRelativePath: path,
    slice: () => ({ arrayBuffer: async () => { if (unreadable) throw new Error("EPERM"); return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength); } }),
    text: async () => (text !== undefined ? text : new TextDecoder().decode(buf)),
  };
}
const pad = (head, n = 5000) => { const b = new Uint8Array(n); b.set(head); return b; };
const MDMP = pad([0x4d, 0x44, 0x4d, 0x50]);
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));
const pageDump = (type) => { const b = pad(ascii("PAGEDU64")); new DataView(b.buffer).setUint32(0xF98, type, true); return b; };
const EVTX = pad(ascii("ElfFile\0"));

// ── 업로드 전 검사 ──────────────────────────────────────────────────────
let it = await I.inspectFile(file("091826-1-01.dmp", MDMP));
assert.equal(it.status, "ok"); assert.equal(it.typeLabel, "미니덤프(MDMP)"); assert.equal(it.readable, true);

it = await I.inspectFile(file("empty.dmp", new Uint8Array(0)));
assert.equal(it.status, "block"); assert.match(it.problems[0], /0바이트/);

it = await I.inspectFile(file("perm.dmp", MDMP, { unreadable: true }));
assert.equal(it.status, "block"); assert.equal(it.readable, false); assert.match(it.problems[0], /읽지 못했/);

it = await I.inspectFile(file("fake.dmp", pad([1, 2, 3, 4])));
assert.equal(it.status, "block"); assert.match(it.problems[0], /머리 부분/);

it = await I.inspectFile(file("tiny.dmp", new Uint8Array([0x4d, 0x44, 0x4d, 0x50])));
assert.equal(it.status, "block"); assert.match(it.problems.join(" "), /너무 작아/);

it = await I.inspectFile(file("huge.dmp", MDMP, { size: 70 * 1024 * 1024 }));
assert.equal(it.status, "block"); assert.match(it.problems.join(" "), /너무 큽니다/);

// 커널/전체 덤프 구분
it = await I.inspectFile(file("MEMORY.DMP", pageDump(4)));
assert.equal(it.status, "ok"); assert.match(it.typeLabel, /작은 메모리 덤프\(트리아지\)/);
it = await I.inspectFile(file("MEMORY.DMP", pageDump(1), { size: 3 * 1024 ** 3 }));
assert.equal(it.status, "block"); assert.match(it.typeLabel, /전체 메모리 덤프/);
it = await I.inspectFile(file("old.dmp", pad(ascii("PAGEDUMP"))));
assert.equal(it.status, "block"); assert.match(it.problems[0], /지원하지 않습니다/);

// evtx / json
it = await I.inspectFile(file("System.evtx", EVTX));
assert.equal(it.status, "ok"); assert.equal(it.typeLabel, "이벤트 로그(EVTX)");
it = await I.inspectFile(file("System.evtx", pad(ascii("NotAnEvtx"))));
assert.equal(it.status, "block");
it = await I.inspectFile(file("hardware.json", ascii('{"gpu":{}}')));
assert.equal(it.status, "ok"); assert.equal(it.typeLabel, "하드웨어 정보(JSON)");
it = await I.inspectFile(file("hardware.json", ascii("{broken")));
assert.equal(it.status, "block"); assert.match(it.problems[0], /JSON 형식/);
it = await I.inspectFile(file("list.json", ascii("[1,2]")));
assert.equal(it.status, "block");
it = await I.inspectFile(file("notes.txt", ascii("hello")));
assert.equal(it.status, "skip");

// ── 수집 폴더 검증 ──────────────────────────────────────────────────────
const items = [];
for (const f of [file("a.dmp", MDMP), file("b.dmp", MDMP), file("c.dmp", new Uint8Array(0)), file("System.evtx", EVTX), file("hardware.json", ascii("{}"))]) items.push(await I.inspectFile(f));
let sum = I.summarizeChecks(items);
assert.equal(sum.dumpCount, 2); assert.equal(sum.blockedCount, 1); assert.equal(sum.canAnalyze, true);
assert.equal(sum.accepted.length, 4);                       // 0바이트 덤프는 분석 대상에서 빠진다
assert.equal(sum.checks.find((c) => c.id === "zero").state, "bad");
assert.equal(sum.checks.find((c) => c.id === "evtx").state, "ok");
assert.deepEqual(sum.missing, []);

// 덤프만 올린 경우: 이벤트 로그·hardware.json 누락 안내
sum = I.summarizeChecks([await I.inspectFile(file("a.dmp", MDMP))]);
assert.deepEqual(sum.missing, ["이벤트 로그(System.evtx)", "하드웨어 정보(hardware.json)"]);
// 덤프가 없고 이벤트 로그만: 분석 가능, 덤프 누락 안내
sum = I.summarizeChecks([await I.inspectFile(file("System.evtx", EVTX))]);
assert.equal(sum.canAnalyze, true); assert.ok(sum.missing.includes("덤프(.dmp)"));
// System.evtx가 아닌 이름
sum = I.summarizeChecks([await I.inspectFile(file("Other.evtx", EVTX))]);
assert.equal(sum.checks.find((c) => c.id === "evtx").state, "warn");
// 덤프 9개 → 8개만
const nine = [];
for (let i = 0; i < 9; i++) nine.push(await I.inspectFile(file(`d${i}.dmp`, MDMP)));
sum = I.summarizeChecks(nine);
assert.equal(sum.accepted.length, 8); assert.ok(sum.notes.some((n) => /최대 8개/.test(n)));
// 전부 차단이면 분석 불가
sum = I.summarizeChecks([await I.inspectFile(file("e.dmp", new Uint8Array(0)))]);
assert.equal(sum.canAnalyze, false);

// 파일 이름·경로는 escape된다
const evil = await I.inspectFile(file('<img src=x onerror=alert(1)>.dmp', MDMP, { path: '<b>폴더</b>/x.dmp' }));
const html = I.renderPrecheck([evil], I.summarizeChecks([evil]));
assert.ok(!html.includes("<img src=x") && !html.includes("<b>폴더</b>"));
assert.ok(html.includes("&lt;img src=x onerror=alert(1)&gt;"));

// ── 덤프 발생 기간 ↔ 이벤트 로그 기간 ─────────────────────────────────────
const range = { start: "2026-09-17T00:00:00+00:00", end: "2026-09-19T00:00:00+00:00" };
assert.equal(I.coverageCheck(["2026-09-18T07:54:00+00:00"], range).state, "ok");
assert.equal(I.coverageCheck(["2026-10-18T07:54:00+00:00"], range).state, "bad");
assert.equal(I.coverageCheck(["2026-09-18T07:54:00+00:00", "2026-10-18T07:54:00+00:00"], range).state, "warn");
assert.equal(I.coverageCheck([], range).state, "unknown");
assert.equal(I.coverageCheck(["2026-09-18T07:54:00+00:00"], null).state, "unknown");

// ── 결과 카드 렌더링(서버 응답 모양) ───────────────────────────────────────
const verdict = {
  summaryCard: { conclusion: '<script>alert("x")</script> 결론', confidence: "중간", step1: "중요 파일을 백업하세요.", step2: "드라이버를 다시 설치하세요.",
    ifRepeats: "계속되면 원격 점검을 신청하세요.", risk: { label: "주의", text: "점검이 필요합니다." }, remote: { label: "일부 가능", text: "원격 안내" },
    warnings: ["교차 테스트 후 교체하세요."] },
  candidates: [{ key: "gpu", title: "그래픽카드·PCIe·라이저", likelihood: "높음", sharePercent: 62, reasons: ["근거1"], counterEvidence: ["반대1"],
    nextChecks: ["확인1"], remote: { label: "일부 가능", text: "r" }, visit: { label: "필요할 수 있음", text: "v" }, crossTestWarning: "교차 테스트 필요" }],
  cta: { primary: { type: "crosscheck", title: "전문가 교차 점검", text: "t" }, also: [{ type: "backup", title: "백업 먼저", text: "b" }] },
  symptomMismatch: [{ message: "문진은 게임 중 오류, 로그는 저장장치" }],
  eventCorrelation: { summary: "요약", items: [{ time: "2026-09-18T07:54:00+00:00", fileName: "a.dmp", text: "Display 4101 (3건) → 0x116 블루스크린", linked: true }] },
  timelineFull: [{ time: "2026-09-18T07:54:00+00:00", kind: "dump", group: "dump", label: "블루스크린 0x116 · 의심 모듈 <b>x</b>" }],
  moduleReliability: { total: 3, caution: "확정할 수 없습니다.", items: [{ module: "nv.sys", total: 3, count: 3, sharePercent: 100, firstSeen: "2026-09-18T01:00:00+00:00", lastSeen: "2026-09-20T01:00:00+00:00", confidence: "높음", candidate: true }] },
};
const summary = I.renderSummaryCard(verdict);
assert.ok(summary.includes("risk-warn") && summary.includes("지금 할 일 1단계") && summary.includes("계속 발생하면"));
assert.ok(!summary.includes("<script>"), "서버 문자열은 escape");
const rule = I.renderRuleAnalysis(verdict);
for (const needle of ["원인 후보", "반대 근거·불확실성", "교차 테스트 필요", "문진과 로그가 다릅니다", "Display 4101", "시간순 타임라인", "반복 모듈 신뢰도", "확정할 수 없습니다", "#remote-card", "backup-storage-calculator.html"])
  assert.ok(rule.includes(needle), "누락: " + needle);
assert.ok(!rule.includes("<b>x</b>"), "타임라인 라벨 escape");
// 서버가 새 필드를 주지 않으면(예전 서버) 빈 화면이 아니라 빈 문자열
assert.equal(I.renderRuleAnalysis({}), "");
assert.equal(I.renderSummaryCard({}), "");
// 반복 모듈이 없으면 커널은 원인으로 보지 않는다는 안내
assert.match(I.renderModuleReliability({ moduleReliability: { total: 2, items: [], caution: "c" } }), /ntoskrnl/);


// ── 저장(텍스트·PDF)·카카오톡 상담용 요약 ──────────────────────────────────
const ctx = {
  verdict: { ...verdict, analysisId: "an_abc1234567", moduleReliability: { total: 4, caution: "확정할 수 없습니다.", items: [
    { module: "nvlddmkm.sys", total: 4, count: 3, sharePercent: 75, firstSeen: "2026-09-18T01:00:00+00:00", lastSeen: "2026-09-20T01:00:00+00:00", confidence: "높음", repeated: true },
    { module: "other.sys", total: 4, count: 1, sharePercent: 25, firstSeen: "2026-09-19T01:00:00+00:00", lastSeen: "2026-09-19T01:00:00+00:00", confidence: "낮음", repeated: false }] },
    crossTestWarning: "교차 테스트 필요" },
  results: [
    { file: { name: "a.dmp" }, data: { stopCode: "0x116", stopCodeName: "VIDEO_TDR_FAILURE", crashTime: "2026-09-18T07:54:00+00:00" } },
    { file: { name: "b.dmp" }, data: { stopCode: "0x116", stopCodeName: "VIDEO_TDR_FAILURE", crashTime: "2026-09-20T07:54:00+00:00" } },
    { file: { name: "g.exe.dmp" }, data: { dumpKind: "application", stopCode: "0x1", crashTime: "2026-10-01T00:00:00+00:00" } }],
  evtx: { wheaById: { "17": 3600 }, shutdownSummary: { count: 2 } },
  files: [{ name: "a.dmp", sizeText: "4.9 KB", typeLabel: "미니덤프(MDMP)" }, { name: "System.evtx", sizeText: "30 MB", typeLabel: "이벤트 로그(EVTX)" }],
  analysisId: "an_abc1234567", now: new Date("2026-11-26T12:00:00Z"),
  symptoms: { types: ["load", "freeze"], perDay: 2 }, symptomLabels: { load: "게임·고부하 작업 중에만 발생", freeze: "멈춤·심한 느려짐" },
  userActions: "드라이버 재설치", remoteChoice: "want", ai: null,
};
const kakao = I.buildKakaoSummary(ctx).split("\n");
const labels = ["[PC 블루스크린 분석 요청]", "", "발생 증상:", "발생 횟수:", "최근 발생 시각:", "STOP 코드:", "반복 의심 모듈:", "WHEA/이벤트 근거:", "사용자가 해본 조치:", "원격 점검 희망 여부:", "분석 ID:"];
labels.forEach((l, i) => assert.ok(kakao[i].startsWith(l), `카카오 요약 ${i}번째 줄: ${kakao[i]}`));
assert.match(kakao[2], /게임·고부하 작업 중에만 발생, 멈춤·심한 느려짐 \(하루 약 2회\)/);
assert.match(kakao[3], /블루스크린 덤프 2개, 이벤트 로그의 예기치 않은 종료 2회/);   // 프로그램 크래시 덤프는 센 블루스크린에서 제외
assert.match(kakao[4], /2026\. 09\. 20\. 16:54 KST/);                                // 가장 최근 BSOD, 한국 시간
assert.match(kakao[5], /0x116 VIDEO_TDR_FAILURE ×2/);
assert.match(kakao[6], /nvlddmkm\.sys \(덤프 4개 중 3개 · 신뢰도 높음 · 원인 확정 아님\)/);
assert.ok(!kakao[6].includes("other.sys"), "반복되지 않은 모듈은 반복 의심으로 올리지 않는다");
assert.match(kakao[7], /Display 4101.*WHEA-Logger 17 3,600건/);
assert.match(kakao[8], /드라이버 재설치/); assert.match(kakao[9], /희망$/); assert.match(kakao[10], /an_abc1234567/);
// 정보가 없으면 지어내지 않고 '확인 안 됨'
const empty = I.buildKakaoSummary({ verdict: {}, results: [], evtx: null, symptoms: null, now: new Date() });
assert.match(empty, /발생 증상: \(문진 미입력\)/); assert.match(empty, /최근 발생 시각: 확인 안 됨/); assert.match(empty, /반복 의심 모듈: 반복된 모듈 없음/); assert.match(empty, /분석 ID: \(발급 안 됨\)/);

const tx = I.exportTextSections(ctx);
const head = tx.head.join("\n"), top = tx.top.join("\n"), bottom = tx.bottom.join("\n");
assert.ok(head.includes("분석 ID: an_abc1234567") && head.includes("생성 시각:") && head.includes("업로드 파일 (2개):") && head.includes("System.evtx (30 MB, 이벤트 로그(EVTX))"));
for (const n of ["한눈에 보기", "원인 후보 (5가지 범주", "반대 근거·불확실성", "반복 의심 모듈 (원인 확정 아님)", "주요 이벤트 근거", "교차 테스트 필요"]) assert.ok(top.includes(n), "텍스트 누락: " + n);
assert.ok(bottom.includes("AI 쉬운 설명") && bottom.includes("요청하지 않았습니다") && bottom.includes("원격 점검 신청 안내") && bottom.includes(I.REMOTE_POLICY));
const withAi = I.exportTextSections({ ...ctx, ai: { fallback: false, summary: { cause: "원인 문장", selfCheck: ["조치1", "조치2"], remoteInspection: "원격 권유", disclaimer: "참고용" } } }).bottom.join("\n");
assert.ok(withAi.includes("참고용 · 위 규칙 기반 분석과 별개") && withAi.includes("안전한 조치 2: 조치2"));

// PDF(HTML) 보고서 구역은 서버·사용자 값을 escape한다
const evilCtx = { ...ctx, files: [{ name: "<script>alert(1)</script>.dmp", sizeText: "1 KB", typeLabel: "<b>x</b>" }], analysisId: '"><img src=x>',
  ai: { fallback: true, summary: { cause: "<i>c</i>", selfCheck: ["<u>1</u>", "2"], remoteInspection: "r", disclaimer: "d" } } };
const h = I.exportHtmlSections(evilCtx);
const all = h.head + h.top + h.bottom;
assert.ok(!all.includes("<script>") && !all.includes("<img src=x>") && !all.includes("<i>c</i>") && !all.includes("<u>1</u>") && !all.includes("<b>x</b>"));
assert.ok(h.head.includes("분석 ID") && all.includes("업로드 파일") && all.includes("원인 후보") && all.includes("반복 의심 모듈") && all.includes("AI 쉬운 설명") && all.includes("원격 점검 신청 안내"));
assert.ok(I.exportHtmlSections({ results: [], now: new Date() }).bottom.includes("요청하지 않았습니다"));

console.log("minidump-insights 검증 통과");
