// 대출 계산기 검증: node tests/loan-calculator-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { schedule, yearlySummary, compareMethods } = createRequire(import.meta.url)("../loan-calculator.js");
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

// 연도별 요약: 12개월씩 묶은 합계가 전체와 맞고, 연말 잔액이 회차표의 12·24…회차 잔액과 같다.
{
  const r = schedule({ principal: P, annualRate: 4.5, months: 126, graceMonths: 6, method: "equal-payment" }); // 10년 6개월
  const ys = yearlySummary(r.rows);
  assert.equal(ys.length, 11);                                      // 10년 + 6개월(11년차)
  assert.equal(ys.reduce((s, y) => s + y.interest, 0), r.totalInterest);
  assert.equal(ys.reduce((s, y) => s + y.principal, 0), P);
  assert.equal(ys.reduce((s, y) => s + y.payment, 0), r.totalPayment);
  assert.equal(ys[0].balance, r.rows[11].balance);
  assert.equal(ys[4].balance, r.rows[59].balance);
  assert.equal(ys[10].balance, 0);
  assert.equal(ys[10].payment, r.rows.slice(120).reduce((s, x) => s + x.payment, 0));
}
// 방식별 비교: 1억, 연 4.5%, 10년. 만기일시 월 이자 375,000원 × 120회 = 45,000,000원.
{
  const [ep, epr, bl] = compareMethods({ principal: P, annualRate: 4.5, months: 120 });
  assert.equal([ep.method, epr.method, bl.method].join(), "equal-payment,equal-principal,bullet");
  assert.equal(bl.first, 375_000);
  assert.equal(bl.totalInterest, 45_000_000);
  assert.equal(bl.last, P + 375_000);
  assert.ok(epr.totalInterest < ep.totalInterest && ep.totalInterest < bl.totalInterest);
  assert.ok(epr.first > ep.first);                                  // 원금균등은 첫 달 부담이 더 크다
  assert.equal(ep.totalInterest, schedule({ principal: P, annualRate: 4.5, months: 120, method: "equal-payment" }).totalInterest);
  // 금리 0%: 원리금균등·원금균등 총이자 모두 0
  const z = compareMethods({ principal: P, annualRate: 0, months: 120 });
  assert.equal(z[0].totalInterest + z[1].totalInterest + z[2].totalInterest, 0);
}
console.log("loan-calculator yearlySummary/compareMethods: ok");
