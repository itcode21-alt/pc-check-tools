// 저장장치 건강 판정 규칙 검사: node tests/ssd-health-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
import zlib from "node:zlib";
import fs from "node:fs";
const { baseOf, evaluate, decodeHashPayload, encodeHashPayload, buildSummary, whichDisks, estimateReplacement, compareWithHistory, updateHistory, EVENT_INFO, SAMPLES } = require("../ssd-health-engine.js");

const disk = (o = {}) => ({ model: "Test SSD", mediaType: "SSD", busType: "NVMe", health: "Healthy", operational: "OK", sizeGB: 500, wear: 5, temperature: 40, powerOnHours: 3000, readErrorsUncorrected: 0, writeErrorsUncorrected: 0, ...o });
const lvl = (d, v) => evaluate({ disks: [disk(d)], volumes: v || [] }).level;

assert.equal(lvl(), "good", "정상 디스크는 양호");
assert.equal(lvl({ health: "Warning" }), "danger", "HealthStatus가 Healthy가 아니면 위험");
assert.equal(lvl({ operational: "Predictive Failure" }), "danger", "고장 예측은 위험");
assert.equal(lvl({ operational: "Degraded" }), "caution", "OK가 아닌 동작 상태는 주의");
assert.equal(lvl({ readErrorsUncorrected: 3 }), "danger", "복구 안 된 읽기 오류는 위험");
assert.equal(lvl({ writeErrorsUncorrected: 1 }), "danger", "복구 안 된 쓰기 오류는 위험");
assert.equal(lvl({ wear: 90 }), "danger", "수명 90% 이상 위험");
assert.equal(lvl({ wear: 89 }), "caution", "수명 70~89% 주의");
assert.equal(lvl({ wear: 70 }), "caution");
assert.equal(lvl({ wear: 69 }), "good");
assert.equal(lvl({ temperature: 70 }), "caution", "SSD 70℃ 이상 주의");
assert.equal(lvl({ temperature: 69 }), "good");
assert.equal(lvl({ mediaType: "HDD", busType: "SATA", wear: null, temperature: 55 }), "caution", "HDD 55℃ 이상 주의");
assert.equal(lvl({ powerOnHours: 40000 }), "good", "사용 시간은 참고만(등급 불변)");
assert.equal(lvl({ wear: null, temperature: null, readErrorsUncorrected: null, writeErrorsUncorrected: null }), "unknown", "상세를 못 읽으면 확인 불가");
assert.equal(lvl({ wear: null, temperature: null, readErrorsUncorrected: null, writeErrorsUncorrected: null, health: "Warning" }), "danger", "상세가 없어도 Windows 경고는 위험");

// 여유 공간은 디스크 건강 등급을 바꾸지 않고 spaceLevel로 따로 알린다
const space = (free) => evaluate({ disks: [disk()], volumes: [{ drive: "C:", sizeGB: 500, freeGB: free }] });
assert.equal(space(100).spaceLevel, "good", "여유 20%");
assert.equal(space(40).spaceLevel, "low", "여유 8%는 공간 부족");
assert.equal(space(10).spaceLevel, "critical", "여유 2%는 공간 매우 부족");
assert.equal(space(10).level, "good", "공간이 부족해도 디스크 건강은 양호");
assert.equal(evaluate({ disks: [disk({ wear: 95 })], volumes: [{ drive: "C:", sizeGB: 500, freeGB: 100 }] }).spaceLevel, "good", "건강이 나빠도 공간은 별개");

// 입력 형태: 문자열 JSON, 단일 객체, BOM, 배열
assert.equal(evaluate("﻿" + JSON.stringify({ disks: disk() })).level, "good", "disks가 객체 하나여도 처리");
assert.equal(evaluate(JSON.stringify([disk({ wear: 95 })])).level, "danger", "최상위 배열 처리");
assert.throws(() => evaluate("not json"), /JSON/);
assert.throws(() => evaluate("{}"), /찾지 못/);
assert.throws(() => evaluate("   "), /비어/);

// 드라이브는 알파벳 순서(C, D, E …)로 표시
const order = evaluate({ disks: [disk()], volumes: [{ drive: "E:", sizeGB: 100, freeGB: 50 }, { drive: "C:", sizeGB: 100, freeGB: 50 }, { drive: "D:", sizeGB: 100, freeGB: 50 }] }).volumes.map((v) => v.drive);
assert.deepEqual(order, ["C:", "D:", "E:"], "드라이브 알파벳 순서");

// 디스크 ↔ 드라이브 문자 연결
const mapped = evaluate({
  disks: [disk({ model: "Disk A", drives: ["d:", "C:"] }), disk({ model: "Disk B", drives: "E:" }), disk({ model: "Disk C", drives: [] }), disk({ model: "Disk D" })],
  volumes: [{ drive: "C:", sizeGB: 100, freeGB: 50 }, { drive: "E:", sizeGB: 100, freeGB: 50 }, { drive: "F:", sizeGB: 100, freeGB: 50 }],
});
assert.deepEqual(mapped.disks.map((d) => d.drives), [["C:", "D:"], ["E:"], [], null], "드라이브 문자는 대문자·정렬, 없으면 [], 필드가 없으면 null");
assert.deepEqual(mapped.volumes.map((v) => v.disks), [["Disk A"], ["Disk B"], []], "볼륨이 속한 디스크 표시(없으면 빈 배열)");

// 여러 디스크는 가장 나쁜 등급을 따른다
assert.equal(evaluate({ disks: [disk(), disk({ model: "Old", wear: 92 })] }).level, "danger");
// 점검 파일이 주소에 담아 보내는 #d= 값(gzip + base64url) 복원
const toHash = (obj) => "#d=" + zlib.gzipSync(Buffer.from(JSON.stringify(obj), "utf8")).toString("base64").replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
const payload = { disks: [disk({ model: "삼성 SSD 970 EVO", wear: 95 })], volumes: [{ drive: "C:", sizeGB: 465, freeGB: 12 }] };
const decoded = await decodeHashPayload(toHash(payload));
assert.deepEqual(JSON.parse(decoded), payload, "해시 복원 결과가 원본과 같아야 함(한글 포함)");
assert.equal(evaluate(decoded).level, "danger", "복원한 값으로 판정");
assert.equal(await decodeHashPayload(""), null, "해시가 없으면 null");
assert.equal(await decodeHashPayload("#section"), null, "#d=가 아니면 null");
await assert.rejects(() => decodeHashPayload("#d=@@@"), /손상/, "허용되지 않는 문자는 오류");
await assert.rejects(() => decodeHashPayload("#d=AAAA"), /풀지|손상/, "손상된 값은 오류");
// 예시 데이터는 각자 의도한 등급이어야 한다
assert.equal(evaluate(SAMPLES.danger.data).level, "danger");
assert.equal(evaluate(SAMPLES.caution.data).level, "caution");
assert.equal(evaluate(SAMPLES.good.data).level, "good");
assert.equal(evaluate(SAMPLES.space.data).level, "good", "공간 부족 예시는 디스크 건강은 양호");
assert.equal(evaluate(SAMPLES.space.data).spaceLevel, "critical", "공간 부족 예시는 공간 매우 부족");

// 요약 텍스트: 등급·드라이브·이유가 들어가고 식별 정보 필드는 쓰지 않는다
const sum = buildSummary(evaluate({ disks: [disk({ model: "Test SSD", drives: ["C:"], wear: 95, serialNumber: "SECRET-123" })], volumes: [{ drive: "C:", sizeGB: 100, freeGB: 3 }] }), "2026-11-04");
assert.match(sum, /^\[SSD·디스크 건강 판정\] 2026-11-04 · 디스크 상태: 위험 · 여유 공간: 부족/);
assert.match(sum, /Test SSD \(SSD 500GB, C:\): 위험 — 수명 소모 95%/);
assert.match(sum, /C: 여유 3% \(3GB \/ 100GB\) — 공간 매우 부족/);
assert.ok(!sum.includes("SECRET-123"), "일련번호는 요약에 포함하지 않음");
// ── 이벤트 로그 신호 ───────────────────────────────────────────────
const withEvents = (events, d) => evaluate({ disks: [disk({ diskNumber: 0, ...d })], events, eventsChecked: true });
const ev = (provider, id, count, diskNo = "") => ({ provider, id, count, disk: diskNo, last: "2026-11-01" });
assert.equal(withEvents([]).level, "good", "이벤트가 없으면 영향 없음");
assert.equal(withEvents([]).events.checked, true);
assert.equal(evaluate({ disks: [disk()] }).events, null, "events 값이 없는 구버전 데이터는 이벤트 판정 안 함");
assert.equal(evaluate({ disks: [disk()], events: [], eventsChecked: false }).events.checked, false, "읽지 못했으면 확인 불가로 표시");
assert.equal(withEvents([ev("disk", 7, 1, "0")]).disks[0].level, "caution", "Disk 7 1회는 주의(해당 디스크)");
assert.equal(withEvents([ev("disk", 7, 3, "0")]).disks[0].level, "danger", "Disk 7 3회 이상은 위험");
assert.equal(withEvents([ev("disk", 7, 3, "1")]).disks[0].level, "good", "다른 디스크의 기록은 이 디스크에 붙지 않음");
const gone = withEvents([ev("disk", 7, 3, "1")]);
assert.equal(gone.events.items.length, 0, "현재 목록에 없는 디스크 번호의 기록은 시스템 신호가 아님");
assert.equal(gone.disconnected.length, 1, "연결되어 있지 않은 디스크의 기록으로 분리");
assert.equal(gone.disconnected[0].title, "디스크 1");
assert.equal(gone.disconnected[0].level, "danger", "그 디스크의 불량 블록 3회는 위험");
assert.equal(gone.level, "danger", "종합 판정에도 반영");
assert.equal(evaluate({ disks: [disk()], events: [ev("disk", 7, 3, "1")], eventsChecked: true }).events.items.length, 1, "디스크 번호를 알 수 없는 데이터는 이전처럼 시스템 신호로 표시");
assert.equal(withEvents([ev("disk", 52, 1, "0")]).level, "danger", "고장 예측 경고(Disk 52)는 1회라도 위험");
assert.equal(withEvents([ev("stornvme", 129, 2)]).level, "good", "컨트롤러 재설정 1~2회는 참고");
assert.equal(withEvents([ev("stornvme", 129, 5)]).level, "caution", "컨트롤러 재설정 3회 이상은 주의");
assert.equal(withEvents([ev("stornvme", 129, 5)]).events.level, "caution", "디스크를 특정하지 못한 기록은 시스템 신호");
assert.equal(withEvents([ev("stornvme", 129, 5), ev("disk", 7, 1, "0")]).level, "danger", "컨트롤러 이상 + 데이터 오류가 함께면 위험");
assert.equal(withEvents([ev("Ntfs", 55, 1)]).level, "caution", "Ntfs 55 1회는 주의");
assert.equal(withEvents([ev("Microsoft-Windows-Ntfs", 140, 3)]).level, "danger", "Ntfs 3회 이상은 위험(공급자 접두 무시)");
assert.equal(withEvents([ev("disk", 153, 4, "0")]).disks[0].level, "good", "입출력 재시도 4회는 참고");
assert.equal(withEvents([ev("disk", 153, 5, "0")]).disks[0].level, "caution", "입출력 재시도 5회 이상은 주의");
assert.equal(withEvents([ev("disk", 157, 3, "0")]).disks[0].level, "caution", "연결 끊김 3회 이상은 주의");
assert.equal(withEvents([ev("disk", 99, 50, "0")]).level, "good", "모르는 이벤트는 무시");
assert.equal(evaluate(SAMPLES.danger.data).events.items.length, 2, "예시: 디스크 없는 이벤트는 시스템 신호로");
for (const k of Object.keys(EVENT_INFO)) {
  const [prov, id] = k.split("|");
  assert.ok(fs.existsSync(new URL(`../event-${prov}-${id}.html`, import.meta.url)), `이벤트 해설 페이지가 있어야 함: event-${prov}-${id}.html`);
}

// ── CrystalDiskInfo 값(직접 입력) ───────────────────────────────────
const cdi = (o) => evaluate({ disks: [{ model: "CDI", mediaType: "SSD", busType: "SATA", health: "Healthy", operational: "OK", ...o }] }).level;
assert.equal(cdi({ cdiStatus: "good", healthPercent: 98 }), "good", "상태 정상, 건강 98%");
assert.equal(cdi({ cdiStatus: "bad" }), "danger");
assert.equal(cdi({ cdiStatus: "caution" }), "caution");
assert.equal(cdi({ healthPercent: 8 }), "danger", "건강 8% = 수명 소모 92%");
assert.equal(cdi({ healthPercent: 25 }), "caution", "건강 25% = 수명 소모 75%");
assert.equal(cdi({ reallocatedSectors: 5 }), "caution");
assert.equal(cdi({ reallocatedSectors: 150 }), "danger");
assert.equal(cdi({ pendingSectors: 1 }), "danger");
assert.equal(cdi({ uncorrectableSectors: 1 }), "danger");
assert.equal(cdi({ reallocatedSectors: 0, pendingSectors: 0, uncorrectableSectors: 0 }), "good", "섹터가 모두 0이면 양호");
assert.equal(cdi({ busType: "NVMe", availableSpare: 100, availableSpareThreshold: 10 }), "good");
assert.equal(cdi({ busType: "NVMe", availableSpare: 10, availableSpareThreshold: 10 }), "danger", "예비 영역이 기준 이하");
assert.equal(cdi({ busType: "NVMe", availableSpare: 25 }), "caution", "예비 영역 30% 이하 주의");
assert.equal(cdi({ busType: "NVMe", criticalWarning: 4 }), "danger", "치명적 경고 0이 아님");
assert.equal(cdi({ busType: "NVMe", criticalWarning: 0, mediaErrors: 0 }), "good");
assert.equal(cdi({ busType: "NVMe", mediaErrors: 3 }), "danger", "무결성 오류");

// ── 교체 시점 추정 ─────────────────────────────────────────────────
assert.equal(estimateReplacement(2, 5000), null, "수명 소모가 너무 적으면 추정 안 함");
assert.equal(estimateReplacement(10, 100), null, "사용 시간이 너무 짧으면 추정 안 함");
assert.equal(estimateReplacement(95, 30000), null, "이미 90% 이상이면 추정 안 함");
const est = estimateReplacement(10, 5000);
assert.equal(est.hoursLeft, 40000, "10%에 5000시간 → 90%까지 40000시간");
assert.ok(est.monthsAtAlways > est.monthsAtAlways / 2 && est.monthsAt8h > est.monthsAtAlways, "하루 8시간 사용이 더 오래 감");
const e1 = evaluate({ disks: [disk({ wear: 10, powerOnHours: 5000 })] });
assert.equal(e1.level, "good", "추정은 등급을 바꾸지 않음");
assert.ok(e1.disks[0].findings.some((f) => f.level === "info" && /교체 시점 추정/.test(f.title)), "추정 문구가 참고로 표시됨");

// ── 이전 결과와 비교 ───────────────────────────────────────────────
const key = evaluate({ disks: [disk({ diskNumber: 0 })] }).disks[0].key;
const hist = (wear, rErr = 0, d = "2026-10-01") => ({ v: 1, disks: { [key]: [{ d, wear, hours: 1000, rErr, wErr: 0 }] } });
const cmp = (cur, h) => compareWithHistory(evaluate({ disks: [disk({ diskNumber: 0, ...cur })] }), h, "2026-11-01");
const hf = (res) => res.disks[0].findings.filter((f) => /지난 점검/.test(f.title));
assert.equal(hf(cmp({ wear: 5 }, null)).length, 0, "이전 기록이 없으면 비교 문구를 덧붙이지 않음");
assert.ok(cmp({ wear: 5 }, hist(4)).disks[0].findings.some((f) => /수명 소모 \+1%p/.test(f.detail)), "수명 소모 +1%p는 참고");
assert.equal(cmp({ wear: 5 }, hist(4)).level, "good", "소폭 증가는 등급 불변");
assert.equal(cmp({ wear: 12 }, hist(5)).level, "caution", "한 달에 7%p 증가는 빠른 소모로 주의");
assert.equal(cmp({ wear: 5 }, hist(5)).disks[0].findings.some((f) => /변화 없음/.test(f.detail)), true, "변화 없음 표시");
assert.equal(cmp({ wear: 5, readErrorsUncorrected: 3 }, hist(5, 0)).disks[0].findings.some((f) => /늘었습니다/.test(f.title)), true, "오류 증가 표시");
assert.equal(hf(compareWithHistory(evaluate({ disks: [disk({ diskNumber: 0, wear: 5 })] }), hist(4, 0, "2026-11-01"), "2026-11-01")).length, 0, "같은 날 기록은 비교하지 않음");
const saved = updateHistory(null, evaluate({ disks: [disk({ diskNumber: 0, wear: 7 })] }), "2026-11-01");
assert.equal(saved.disks[key][0].wear, 7, "기록 저장");
const saved2 = updateHistory(saved, evaluate({ disks: [disk({ diskNumber: 0, wear: 8 })] }), "2026-11-01");
assert.equal(saved2.disks[key].length, 1, "같은 날은 덮어쓴다");
assert.equal(saved2.disks[key][0].wear, 8);
let h13 = null;
for (let i = 1; i <= 15; i++) h13 = updateHistory(h13, evaluate({ disks: [disk({ diskNumber: 0, wear: i })] }), `2026-10-${String(i).padStart(2, "0")}`);
assert.equal(h13.disks[key].length, 12, "기록은 최근 12개만 보관");
assert.equal(updateHistory(null, evaluate({ disks: [{ model: "No detail", mediaType: "SSD", busType: "SATA", health: "Healthy", operational: "OK" }] }), "2026-11-01").disks["No detail|||sata|"], undefined, "상세를 못 읽은 디스크는 저장하지 않음");

// 요약에 이벤트 줄 포함
assert.match(buildSummary(evaluate(SAMPLES.danger.data), "2026-11-04"), /이벤트 로그\(최근 30일\):/);
// 종합 판정을 만든 디스크 표시
const w1 = whichDisks(evaluate({ disks: [disk({ model: "A", diskNumber: 0, drives: ["C:"] }), disk({ model: "B", diskNumber: 1, drives: ["D:", "E:"], wear: 95 })] }));
assert.deepEqual(w1.disks.map((d) => d.model), ["B"], "위험을 만든 디스크만 표시");
assert.deepEqual(w1.disks[0].drives, ["D:", "E:"]);
assert.equal(w1.viaEvents, false);
assert.deepEqual(whichDisks(evaluate({ disks: [disk()] })).disks, [], "양호면 표시 없음");
const w2 = whichDisks(evaluate({ disks: [disk({ diskNumber: 0 })], events: [{ provider: "disk", id: 52, disk: "", count: 1, last: "2026-11-01" }], eventsChecked: true }));
assert.equal(w2.disks.length, 0, "디스크 판정은 양호");
assert.equal(w2.viaEvents, true, "디스크를 특정하지 못한 이벤트가 원인이면 알려 줌");
assert.deepEqual(whichDisks(evaluate({ disks: [disk({ wear: 75 }), disk({ model: "Other", wear: 95 })] })).disks.map((d) => d.model), ["Other"], "주의 디스크는 위험 판정 때 따로 나열하지 않음");
// ── 연결되어 있지 않은 디스크 ───────────────────────────────────────
const lost = evaluate({ disks: [disk({ operational: "Lost Communication" })] });
assert.equal(lost.disks[0].disconnected, true, "통신 끊김 상태는 연결 안 됨으로 표시");
assert.equal(lost.level, "caution");
assert.ok(lost.disks[0].findings.some((f) => /연결되어 있지 않은 디스크/.test(f.title)));
assert.equal(evaluate({ disks: [disk()] }).disks[0].disconnected, false);
assert.equal(evaluate({ disks: [disk({ operational: "Degraded" })] }).disks[0].disconnected, false, "그 밖의 비정상 상태는 연결 안 됨이 아님");

// 지난 점검에는 있었지만 지금 없는 디스크 (모델|용량|연결방식으로 판단, 디스크 번호가 밀려도 같은 디스크)
const keyA = evaluate({ disks: [disk({ model: "Internal NVMe", diskNumber: 1, sizeGB: 1000 })] }).disks[0].key;
const keyUsb = evaluate({ disks: [disk({ model: "Backup USB", busType: "USB", diskNumber: 2, sizeGB: 2000 })] }).disks[0].key;
assert.equal(baseOf(keyA), "Internal NVMe|1000|nvme", "키에서 디스크 번호를 뺀 값");
const old2 = { v: 1, disks: { [keyA]: [{ d: "2026-10-01", wear: 5, hours: 100, rErr: 0, wErr: 0, drives: ["D:"] }], [keyUsb]: [{ d: "2026-10-02", wear: null, hours: null, rErr: 0, wErr: 0, drives: ["E:"] }] } };
const nowC = (...ds) => compareWithHistory(evaluate({ disks: ds }), old2, "2026-11-01");
const miss = nowC(disk({ model: "Main SSD", diskNumber: 0, sizeGB: 500 }));
assert.equal(miss.disconnected.length, 2, "내장·외장 모두 지금 목록에 없음");
const mi = miss.disconnected.find((g) => /Internal NVMe/.test(g.title));
const mu = miss.disconnected.find((g) => /Backup USB/.test(g.title));
assert.equal(mi.level, "caution", "내장 디스크가 사라지면 주의");
assert.match(mi.title, /D: 드라이브/, "지난 점검의 드라이브 문자도 표시");
assert.equal(mu.level, "good", "외장 USB는 안내만");
assert.match(mu.title, /외장 USB/);
assert.equal(miss.level, "caution", "내장 디스크 실종은 종합 판정에 반영");
const shifted = nowC(disk({ model: "Internal NVMe", diskNumber: 0, sizeGB: 1000 }), disk({ model: "Backup USB", busType: "USB", diskNumber: 1, sizeGB: 2000 }));
assert.equal(shifted.disconnected.length, 0, "디스크 번호가 바뀌어도 같은 디스크면 사라진 것으로 보지 않음");
assert.equal(compareWithHistory(evaluate({ disks: [disk()] }), null, "2026-11-01").disconnected.length, 0, "기록이 없으면 비교 안 함");
assert.deepEqual(whichDisks(miss).disks.length, 0);
assert.equal(whichDisks(miss).viaMissing, true, "원인이 연결 안 된 디스크이면 판정 카드에 알려 줌");
assert.match(buildSummary(miss, "2026-11-04"), /현재 연결되어 있지 않은 디스크: .*Internal NVMe/, "요약에 포함");
assert.equal(evaluate(SAMPLES.caution.data).disconnected.length, 1, "주의 예시에는 연결되어 있지 않은 디스크 기록이 있음");

// 주소 값 만들기(분석기에서 '자세히 보기' 링크에 사용) ↔ 풀기 왕복
const rt = await encodeHashPayload(JSON.stringify(payload));
assert.ok(rt && rt.startsWith("#d="), "주소 값 생성");
assert.deepEqual(JSON.parse(await decodeHashPayload(rt)), payload, "생성한 값을 다시 풀면 원본과 같음(한글 포함)");
assert.equal(await encodeHashPayload(JSON.stringify(payload), 10), null, "길이 제한을 넘으면 null");
console.log("ssd-health-tests: ok");
