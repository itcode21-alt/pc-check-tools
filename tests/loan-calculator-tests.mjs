// 대출 계산기 검증: node tests/loan-calculator-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { schedule } = createRequire(import.meta.url)("../loan-calculator.js");
const P = 100_000_000, near = (a, b, tol, m) => assert.ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b}`);

// 원리금균등: 1억, 연 4%, 36개월 → 월 상환액 = P·r/(1-(1+r)^-n)
{
  const r = 0.04 / 12, n = 36, pmt = (P * r) / (1 - Math.pow(1 + r, -n));
  const s = schedule({ principal: P, annualRate: 4, months: n, method: "equal-payment" });
  near(s.first, pmt, 1, "원리금균등 월 상환액");
  assert.equal(s.rows.at(-1).balance, 0);
  assert.equal(s.rows.reduce((a, x) => a + x.principal, 0), P);
  near(s.totalInterest, pmt * n - P, n, "총이자");
}
// 원금균등: 총이자 ≈ P·r·(n+1)/2, 첫 달 = P/n + P·r
{
  const r = 0.05 / 12, n = 24;
  const s = schedule({ principal: P, annualRate: 5, months: n, method: "equal-principal" });
  near(s.totalInterest, (P * r * (n + 1)) / 2, n, "원금균등 총이자");
  near(s.first, Math.floor(P / n) + Math.floor(P * r), 1, "원금균등 첫 달");
  assert.ok(s.rows[0].payment > s.rows.at(-1).payment); // 월 상환액은 점점 줄어듦
  assert.equal(s.rows.at(-1).balance, 0);
}
// 만기일시: 이자만 내다가 마지막 달 원금 상환
{
  const s = schedule({ principal: P, annualRate: 6, months: 12, method: "bullet" });
  assert.equal(s.first, 500_000);               // 1억 × 6% ÷ 12
  assert.equal(s.totalInterest, 6_000_000);
  assert.equal(s.last, P + 500_000);
}
// 거치기간: 거치 동안 이자만, 이후 원리금균등
{
  const s = schedule({ principal: P, annualRate: 6, months: 24, graceMonths: 12, method: "equal-payment" });
  assert.ok(s.rows.slice(0, 12).every((x) => x.principal === 0 && x.interest === 500_000));
  assert.ok(s.rows[12].principal > 0);
  assert.equal(s.rows.at(-1).balance, 0);
}
// 무이자
{
  const s = schedule({ principal: 12_000_000, annualRate: 0, months: 12, method: "equal-payment" });
  assert.equal(s.totalInterest, 0);
  assert.equal(s.first, 1_000_000);
}
console.log("loan-calculator: all assertions passed");
