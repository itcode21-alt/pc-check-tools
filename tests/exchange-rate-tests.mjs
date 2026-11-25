// 환율 계산기 검증: node tests/exchange-rate-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const X = createRequire(import.meta.url)("../exchange-rate.js");
const near = (a, b, m, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${m}: ${a} vs ${b}`);

// 2026-11-25 Frankfurter USD 기준 응답 예시(실제 조회값)
const rates = { KRW: 1345.4, JPY: 159.32, EUR: 0.91449, CNY: 6.6757 };

// 교차 환율: USD→KRW, KRW→USD, JPY→KRW, EUR→KRW, 같은 통화
near(X.crossRate(rates, "USD", "KRW"), 1345.4, "USD→KRW");
near(X.crossRate(rates, "KRW", "USD"), 1 / 1345.4, "KRW→USD");
near(X.crossRate(rates, "JPY", "KRW"), 1345.4 / 159.32, "JPY→KRW");
near(X.crossRate(rates, "EUR", "KRW"), 1345.4 / 0.91449, "EUR→KRW");
assert.equal(X.crossRate(rates, "KRW", "KRW"), 1);
// 없는 통화·잘못된 값
assert.equal(X.crossRate(rates, "USD", "VND"), null);
assert.equal(X.crossRate({ KRW: 0 }, "USD", "KRW"), null);
assert.equal(X.crossRate({ KRW: NaN }, "USD", "KRW"), null);
assert.equal(X.crossRate(null, "USD", "KRW"), null);
// 왕복: A→B 환율 × B→A 환율 = 1
near(X.crossRate(rates, "JPY", "EUR") * X.crossRate(rates, "EUR", "JPY"), 1, "왕복");

// 환산·수수료: 1,000달러, 환율 1345.4, 수수료 1% → 환산 1,345,400 − 13,454 = 1,331,946
let c = X.convert(1000, 1345.4, 1);
near(c.gross, 1345400, "gross"); near(c.fee, 13454, "fee"); near(c.net, 1331946, "net");
c = X.convert(1000, 1345.4, 0);
near(c.net, 1345400, "수수료 0"); near(c.fee, 0, "수수료 0 금액");
near(X.convert(1000, 1345.4).net, 1345400, "수수료 생략");

// 역산: 1,331,946원을 받으려면 수수료 1%에서 1,000달러 필요 → convert와 서로 역함수
near(X.required(1331946, 1345.4, 1), 1000, "required", 1e-6);
near(X.required(1345400, 1345.4, 0), 1000, "required 수수료 0");
const need = X.required(500000, 1345.4, 2.5);
near(X.convert(need, 1345.4, 2.5).net, 500000, "역함수", 1e-6);
assert.ok(isNaN(X.required(100, 1345.4, 100)), "수수료 100%는 계산 불가");

// 입력 검증
assert.equal(X.validate({ amount: 100, rate: 1345.4, feePct: 1 }), "");
assert.notEqual(X.validate({ amount: 0, rate: 1, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: -5, rate: 1, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: NaN, rate: 1, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: 1e14, rate: 1, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: 100, rate: 0, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: 100, rate: null, feePct: 0 }), "");
assert.notEqual(X.validate({ amount: 100, rate: 1, feePct: -1 }), "");
assert.notEqual(X.validate({ amount: 100, rate: 1, feePct: 100 }), "");
assert.equal(X.validate({ amount: 100, rate: 1, feePct: 99.9 }), "");

// 통화 목록: 30종, 코드 중복 없음, KRW 첫째
assert.equal(X.CURRENCIES.length, 30);
assert.equal(new Set(X.CURRENCIES.map((x) => x.code)).size, 30);
assert.equal(X.CURRENCIES[0].code, "KRW");
// 표시: 원·엔은 소수 없음, 달러는 소수 2자리, 환율은 크기에 따라
assert.equal(X.fmt(1331946.4, "KRW"), "1,331,946");
assert.equal(X.fmt(1234.5, "USD"), "1,234.50");
assert.equal(X.fmt(15932, "JPY"), "15,932");
assert.equal(X.fmtRate(1345.4), "1,345.4");
assert.equal(X.fmtRate(0.00074328), "0.0007433");
assert.equal(X.fmtRate(1.0956), "1.0956");
// 바로가기: 방향 유지, 원화 쪽 보존
assert.deepEqual(X.quickPick("USD", "KRW", "JPY"), { from: "JPY", to: "KRW" });
assert.deepEqual(X.quickPick("KRW", "USD", "JPY"), { from: "KRW", to: "JPY" });
assert.deepEqual(X.quickPick("EUR", "JPY", "USD"), { from: "USD", to: "KRW" });
assert.deepEqual(X.quickPick("USD", "KRW", "KRW"), { from: "USD", to: "KRW" });
assert.equal(X.QUICK.length, 10);
for (const [code] of X.QUICK) assert.ok(X.CURRENCIES.some((c) => c.code === code), code + " 지원 통화");
console.log("exchange-rate: all assertions passed");
