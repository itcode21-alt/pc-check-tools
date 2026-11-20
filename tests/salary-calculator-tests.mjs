// 연봉 실수령액 계산기 검증: node tests/salary-calculator-tests.mjs
// 기대값은 소득세법 시행령 별표 2 <개정 2026. 2. 27.> 공식 PDF의 해당 행에서 옮긴 값이다.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const S = createRequire(import.meta.url)("../salary-calculator.js");
const tax = (m, fam = 1, kids = 0) => S.incomeTaxMonthly(m, fam, kids);

// 공식 표 행: 월급여(천원) 구간 → 가족 1명 / 2명 / 3명
assert.equal(tax(2_300_000), 29160);               // 2,300~2,310천원, 1명
assert.equal(tax(2_300_000, 2), 22160);
assert.equal(tax(2_300_000, 3), 12550);
assert.equal(tax(3_960_000), 190620);              // 3,960~3,980천원, 1명
assert.equal(tax(8_120_000), 986720);              // 8,120~8,140천원, 1명
assert.equal(tax(700_000), 0);                     // 770천원 미만
assert.equal(tax(2_500_000, 1), 35600);            // 2,500~2,510천원

// 10,000천원 정확히 / 초과 산식 (별표 원문 산식을 손계산)
assert.equal(tax(10_000_000), 1507400);
assert.equal(tax(12_000_000), 1507400 + Math.floor(2000 * 1000 * 0.98 * 0.35) + 25000);
assert.equal(tax(20_000_000), 1507400 + 1397000 + Math.floor(6000 * 1000 * 0.98 * 0.38));
assert.equal(tax(100_000_000), 1507400 + 31034600 + 13000 * 1000 * 0.45);

// 자녀 세액공제: 1명 20,830 / 2명 45,830 / 3명 79,160, 음수면 0
assert.equal(tax(2_500_000, 3, 1), 16530 - 20830 > 0 ? 16530 - 20830 : 0);
assert.equal(tax(3_960_000, 4, 1), 88250 - 20830);
assert.equal(tax(3_960_000, 4, 2), 88250 - 45830);
assert.equal(tax(3_960_000, 5, 3), 75120 - 79160 > 0 ? 75120 - 79160 : 0);

// 11명 초과: 11명 세액 - (10명-11명) × 초과 인원
assert.equal(tax(3_960_000, 13), 21700 - (26950 - 21700) * 2);

// 대표 연봉 종합 (비과세 월 20만원, 부양가족 1명)
const cases = [[30e6, 29160], [50e6, 190620], [100e6, 986720]];
for (const [y, t] of cases) {
  const r = S.calculate({ monthlyGross: Math.floor(y / 12), nonTaxable: 200000, family: 1, children: 0 });
  assert.equal(r.deductions.incomeTax, t, `연봉 ${y} 소득세`);
  assert.equal(r.deductions.localTax, Math.floor(t * 0.1 / 10) * 10);
  assert.equal(r.net, r.monthlyGross - r.totalDeduction);
}
// 국민연금 상·하한
const hi = S.calculate({ monthlyGross: 20_000_000 });
assert.equal(hi.deductions.pension, Math.floor(6_590_000 * 0.0475 / 10) * 10);
const lo = S.calculate({ monthlyGross: 300_000 });
assert.equal(lo.deductions.pension, Math.floor(410_000 * 0.0475 / 10) * 10);
// 부동소수점 회귀: 월 과세급여 280만원 → 고용보험 0.9% = 25,200원 (25,190원으로 잘리면 안 됨)
{
  const r = S.calculate({ monthlyGross: 3_000_000, nonTaxable: 200_000, family: 1, children: 0 });
  assert.equal(r.deductions.employment, 25200);
  assert.equal(r.deductions.pension, 133000);   // 280만원 × 4.75%
  assert.equal(r.deductions.health, 100660);    // 280만원 × 3.595%
  assert.equal(r.deductions.care, 13220);       // 100,660 × 13.14% = 13,226.7 → 13,220
}
// 역산(solveGross): 목표 실수령액 이상이 되는 가장 작은 월급. 기대값은 1원씩 올려 보는 단순 탐색(오라클)과 비교한다.
for (const [target, nonTaxable, family, kids] of [[2_500_000, 0, 1, 0], [3_000_000, 200_000, 2, 0], [4_200_000, 200_000, 4, 2], [7_000_000, 0, 1, 0], [12_000_000, 0, 3, 1], [20_000_000, 0, 1, 0]]) {
  const net = (g) => S.calculate({ monthlyGross: g, nonTaxable, family, children: kids }).net;
  const g = S.solveGross({ targetNet: target, nonTaxable, family, children: kids });
  let oracle = target; while (net(oracle) < target) oracle++;
  assert.equal(g, oracle, `target ${target}: solve ${g} vs brute ${oracle}`);
  assert.ok(net(g) >= target);
  assert.ok(net(g) - target < 100, `target ${target}: overshoot ${net(g) - target}`);
}
assert.equal(S.solveGross({ targetNet: 0 }), null);
// 간이세액표 구간 경계에서 월급이 늘어도 실수령액이 줄 수 있다(역산에서 구간 탐색을 하는 이유). 하락 폭은 5만원 이내다.
for (const [family, kids, nt] of [[1, 0, 0], [2, 0, 200_000], [4, 2, 200_000], [3, 1, 0]]) {
  let prev = -Infinity;
  for (let g = 700_000; g <= 25_000_000; g += 1000) {
    const n = S.calculate({ monthlyGross: g, nonTaxable: nt, family, children: kids }).net;
    assert.ok(prev - n < 50_000, `net dropped ${prev - n} at gross ${g}`);
    prev = n;
  }
}
console.log("salary-calculator: all assertions passed");
