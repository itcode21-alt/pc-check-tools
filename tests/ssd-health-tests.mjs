// 저장장치 건강 판정 규칙 검사: node tests/ssd-health-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
import zlib from "node:zlib";
const { evaluate, decodeHashPayload } = require("../ssd-health-check.js");

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

assert.equal(lvl({}, [{ drive: "C:", sizeGB: 500, freeGB: 100 }]), "good", "여유 20%");
assert.equal(lvl({}, [{ drive: "C:", sizeGB: 500, freeGB: 40 }]), "caution", "여유 8% 주의");
assert.equal(lvl({}, [{ drive: "C:", sizeGB: 500, freeGB: 10 }]), "caution", "여유 2%도 위험이 아닌 주의");

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
console.log("ssd-health-tests: ok");
