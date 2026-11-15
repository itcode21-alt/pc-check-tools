// 블루스크린 코드 해석기 파서 검증: node tests/bluescreen-code-finder-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { parse } = require("../bluescreen-code-finder.js");
const codes = (r) => r.matches.map((d) => d.c);

// ── 사이트 해설이 있는 코드
assert.deepEqual(codes(parse("0x0000007B")), ["0x7B"]);               // 8자리
assert.deepEqual(codes(parse("0x7b")), ["0x7B"]);                     // 짧은 형태·소문자
assert.deepEqual(codes(parse("7B")), ["0x7B"]);                       // 접두 없는 16진수
assert.deepEqual(codes(parse("133")), ["0x133"]);                     // 3자리
assert.deepEqual(codes(parse("c000021a")), ["0xC000021A"]);
assert.deepEqual(codes(parse("CRITICAL_PROCESS_DIED")), ["0xEF"]);    // 이름
assert.deepEqual(codes(parse("critical_process_died")), ["0xEF"]);    // 소문자 이름
assert.deepEqual(codes(parse("중지 코드: IRQL_NOT_LESS_OR_EQUAL")), ["0xA"]);
assert.deepEqual(codes(parse("SYSTEM_THREAD_EXCEPTION_NOT_HANDLED")), ["0x7E"]); // 이름이 정확히 일치해야 함

// ── 이벤트 뷰어 문구: 영문·한글, 첫 값이 코드이고 괄호 안은 매개변수
const en = "The bugcheck was: 0x000000d1 (0xffffd0a1, 0x0000000000000002, 0x0000000000000000, 0xfffff80123456789).";
assert.deepEqual(codes(parse(en)), ["0xD1"]);
assert.equal(parse(en).unknown.length, 0);
const ko = "컴퓨터가 버그 검사에서 다시 부팅되었습니다. 버그 검사: 0x0000007e (0xffffffffc0000005, 0xfffff8012345, 0xffffd001, 0x0).";
assert.deepEqual(codes(parse(ko)), ["0x7E"]);
assert.equal(parse(ko).unknown.length, 0);
assert.deepEqual(codes(parse("버그 확인: 0x00000116 (0x1, 0x2)")), ["0x116"]);
assert.deepEqual(codes(parse("The bugcheck was: 0x00000116 (0x1, 0x2)")), ["0x116"]);

// ── 코드가 여러 개 있으면 모두 (중복 제거)
assert.deepEqual(codes(parse("0x0000000A 그리고 0x0000001E 그리고 0xA")).sort(), ["0x1E", "0xA"]);
// 알려진 코드가 있으면 같이 붙여넣은 주소·매개변수 값은 무시
assert.deepEqual(codes(parse("0x0000001E 주소 0xffffd0a1 0x12345678")), ["0x1E"]);

// ── 사이트에 해설이 없지만 Microsoft 참조에 있는 코드: 이름과 문서 링크로 안내
{
  const r = parse("0x0000009A");
  assert.equal(r.matches.length, 0);
  assert.equal(r.unknown[0].c, "0x9A");
  assert.equal(r.unknown[0].ms.n, "SYSTEM_LICENSE_VIOLATION");
  assert.ok(r.unknown[0].ms.u.startsWith("https://learn.microsoft.com/") && r.unknown[0].ms.u.endsWith("bug-check-0x9a--system-license-violation"));
  assert.equal(parse("SPECIAL_POOL_DETECTED_MEMORY_CORRUPTION").unknown[0].c, "0xC1"); // 이름으로 찾기
  assert.equal(parse("9a").unknown[0].ms.n, "SYSTEM_LICENSE_VIOLATION");              // 접두 없는 값
}
// ── 어디에도 없는 값
{
  const r = parse("0x00000999");
  assert.equal(r.matches.length, 0);
  assert.equal(r.unknown[0].c, "0x999");
  assert.equal(r.unknown[0].ms, null);
}

// ── 키워드 검색 (한글·영문, 사이트 해설 + Microsoft 참조)
assert.ok(parse("WHEA").matches.some((d) => d.c === "0x124"));
assert.ok(parse("video tdr").matches.some((d) => d.c === "0x116"));
assert.ok(parse("부팅").matches.length > 0);                          // 한글 키워드
assert.ok(parse("license").related.some((x) => x.n === "SYSTEM_LICENSE_VIOLATION")); // MS에만 있는 코드
assert.equal(parse("zzzzqqqq").mode, "none");

// ── 빈 입력·길이 제한
assert.equal(parse("").mode, "none");
assert.equal(parse("   ").mode, "none");
assert.doesNotThrow(() => parse("0x1 ".repeat(50000)));
console.log("bluescreen-code-finder: all assertions passed");
