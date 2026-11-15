// 지역가입자 보험료 계산기 검증: node tests/regional-insurance-tests.mjs
// 기대값은 시행령 별표 4(재산등급표)·제44조(7.19%, 211.5원)·시행규칙 별표 8(전월세 평가)로 손계산한 값이다.
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { calculate: c, propertyScore: ps } = createRequire(import.meta.url)("../regional-insurance.js");

// 재산등급표 경계 (만원 단위, "이하" 포함)
assert.deepEqual(ps(0), { grade: 0, score: 0 });
assert.deepEqual(ps(-5), { grade: 0, score: 0 });
assert.deepEqual(ps(4_500_000), { grade: 1, score: 22 });     // 450만원 이하
assert.deepEqual(ps(4_500_001), { grade: 2, score: 44 });     // 450만원 초과
assert.deepEqual(ps(100_000_000), { grade: 18, score: 439 }); // 1억 = 10,000만원 (9,570 초과 10,700 이하)
assert.deepEqual(ps(7_781_240_000), { grade: 59, score: 2271 }); // 778,124만원 이하
assert.deepEqual(ps(7_781_250_000), { grade: 60, score: 2341 });

// 1) 소득 0, 재산세 과세표준 2억(주택 소유): 소득월액 하한 적용 + (2억-1억)=1억 → 18등급 439점
{
  const r = c({ ownsHouse: true, propertyTaxBase: 200_000_000 });
  assert.equal(r.floorApplied, true);
  assert.equal(r.incomePremium, 20160);
  assert.equal(r.score, 439);
  assert.equal(r.propertyPremium, Math.floor(439 * 211.5));   // 92,848
  assert.equal(r.health, 113000);                              // floor10(20,160 + 92,848.5)
  assert.equal(r.care, Math.floor(113000 * 0.1314 / 10) * 10); // 14,840
  assert.equal(r.pension, 0);                                  // 소득 없음
}
// 2) 사업소득 연 4,800만원, 재산 없음: 월 400만원 × 7.19% = 287,600, 국민연금 400만원 × 9.5%
{
  const r = c({ business: 48_000_000, ownsHouse: true });
  assert.equal(r.health, 287600);
  assert.equal(r.care, 37790);
  assert.equal(r.pension, 380000);
}
// 3) 임차: 주택 미소유, 보증금 5천 + 월세 50만 → (5,000만 + 2,000만) × 30% = 2,100만 < 1억 공제 → 0점
{
  const r = c({ ownsHouse: false, deposit: 50_000_000, monthlyRent: 500_000, business: 48_000_000 });
  assert.equal(r.rentEval, 21_000_000);
  assert.equal(r.score, 0);
  assert.equal(r.health, 287600);
}
// 4) 보증금 3억 + 월세 100만 → (3억 + 4,000만) × 30% = 1.02억 → 공제 후 200만원 → 1등급 22점
{
  const r = c({ ownsHouse: false, deposit: 300_000_000, monthlyRent: 1_000_000 });
  assert.equal(r.rentEval, 102_000_000);
  assert.equal(r.grade, 1);
  assert.equal(r.propertyPremium, Math.floor(22 * 211.5));     // 4,653
  // 주택 소유자는 임차 평가액을 반영하지 않는다
  assert.equal(c({ ownsHouse: true, deposit: 300_000_000, monthlyRent: 1_000_000 }).rentEval, 0);
}
// 5) 근로·연금소득은 50%만, 이자·배당은 합계 1천만원 이하면 제외
{
  assert.equal(c({ wage: 60_000_000, ownsHouse: true }).incomeMonth, 2_500_000);            // (6,000만×50%)÷12
  assert.equal(c({ interestDividend: 10_000_000, ownsHouse: true }).floorApplied, true);   // 제외 → 소득 0
  assert.equal(c({ interestDividend: 12_000_000, ownsHouse: true }).incomeMonth, 1_000_000);
}
// 6) 상한
{
  const r = c({ business: 5_000_000_000, ownsHouse: true });
  assert.equal(r.health, 4591740);
  assert.equal(r.limit, "상한");
  assert.equal(r.pension, Math.floor(6_590_000 * 0.095 / 10) * 10); // 기준소득월액 상한
}
// 7) 국민연금 기준소득월액 직접 입력이 우선, 하한 적용
{
  assert.equal(c({ business: 48_000_000, pensionBase: 1_000_000, ownsHouse: true }).pension, 95000);
  assert.equal(c({ business: 1_200_000, ownsHouse: true }).npBase, 410000);                  // 월 10만원 → 하한 41만원
}
console.log("regional-insurance: all assertions passed");
