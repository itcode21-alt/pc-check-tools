// 블루스크린 코드 해석기 파서 검증: node tests/bluescreen-code-finder-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { parse } = createRequire(import.meta.url)("../bluescreen-code-finder.js");
const codes = (r) => r.matches.map((d) => d.c);

assert.deepEqual(codes(parse("0x0000007B")), ["0x7B"]);               // 8자리
assert.deepEqual(codes(parse("0x7b")), ["0x7B"]);                     // 짧은 형태·소문자
assert.deepEqual(codes(parse("7B")), ["0x7B"]);                       // 접두 없는 16진수
assert.deepEqual(codes(parse("133")), ["0x133"]);                     // 3자리
assert.deepEqual(codes(parse("c000021a")), ["0xC000021A"]);
assert.deepEqual(codes(parse("CRITICAL_PROCESS_DIED")), ["0xEF"]);    // 이름
assert.deepEqual(codes(parse("critical_process_died")), ["0xEF"]);    // 소문자 이름
assert.deepEqual(codes(parse("중지 코드: IRQL_NOT_LESS_OR_EQUAL")), ["0xA"]);

// 이벤트 뷰어 BugCheck 문구: 첫 값이 코드, 나머지는 매개변수라서 무시
const ev = "컴퓨터가 버그 확인에서 다시 시작되었습니다. The bugcheck was: 0x000000d1 (0xffffd0a1, 0x0000000000000002, 0x0000000000000000, 0xfffff80123456789).";
assert.deepEqual(codes(parse(ev)), ["0xD1"]);
assert.equal(parse(ev).unknown.length, 0);
assert.deepEqual(codes(parse("The bugcheck was: 0x00000116 (0x1, 0x2)")), ["0x116"]);

// 코드가 여러 개 있으면 모두 (중복 제거)
assert.deepEqual(codes(parse("0x0000000A 그리고 0x0000001E 그리고 0xA")).sort(), ["0x1E", "0xA"]);

// 모르는 코드
const u = parse("0x00000999");
assert.equal(u.matches.length, 0); assert.deepEqual(u.unknown, ["0x999"]);

// 한글·영문 키워드 검색
assert.ok(codes(parse("드라이버 타임아웃")).length >= 0);
assert.ok(parse("WHEA").matches.some((d) => d.c === "0x124"));
assert.ok(parse("video tdr").matches.some((d) => d.c === "0x116"));

// 빈 입력·무관한 입력
assert.equal(parse("").mode, "none");
assert.equal(parse("zzzzqqqq").matches.length, 0);
console.log("bluescreen-code-finder: all assertions passed");
