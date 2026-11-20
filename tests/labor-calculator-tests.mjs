// 퇴직금·주휴수당 계산기 검증: node tests/labor-calculator-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { severance: sev, weeklyHoliday: wk, retirementTax: rtax, minimumWageCheck: mwc } = createRequire(import.meta.url)("../labor-calculator.js");

// 계속근로기간 (입사일 포함 ~ 마지막 근무일 포함)
assert.equal(sev({ start: "2024-01-01", lastDay: "2024-12-31", wages3m: 9e6 }).tenureDays, 366); // 윤년
assert.equal(sev({ start: "2025-01-01", lastDay: "2025-12-31", wages3m: 9e6 }).tenureDays, 365);
assert.equal(sev({ start: "2025-01-01", lastDay: "2025-12-31", wages3m: 9e6 }).eligible, true);
assert.equal(sev({ start: "2025-01-02", lastDay: "2025-12-31", wages3m: 9e6 }).eligible, false); // 364일
assert.equal(sev({ start: "2024-01-01", lastDay: "2025-12-31", wages3m: 9e6, weeklyHours: 14 }).eligible, false);

// 3개월 총일수: 퇴직일(2026-01-01) 이전 3개월 = 2025-10-01 ~ 2025-12-31 = 92일
const a = sev({ start: "2024-01-01", lastDay: "2025-12-31", wages3m: 9_000_000 });
assert.equal(a.periodDays, 92);
assert.equal(a.tenureDays, 731);
assert.equal(a.pay, Math.floor((9_000_000 / 92) * 30 * 731 / 365));
// 말일 보정: 퇴직일 2026-03-31 → 3개월 전 2025-12-31, 90일
assert.equal(sev({ start: "2024-01-01", lastDay: "2026-03-30", wages3m: 9e6 }).periodDays, 90);
// 상여금·연차수당 3/12 가산
const b = sev({ start: "2024-01-01", lastDay: "2025-12-31", wages3m: 9e6, annualBonus: 4_000_000, annualLeavePay: 1_200_000 });
assert.equal(b.pay, Math.floor(((9e6 + 1_000_000 + 300_000) / 92) * 30 * 731 / 365));

// 주휴수당
assert.equal(wk({ hourly: 10000, weeklyHours: 40 }).weekly, 80000);
assert.equal(wk({ hourly: 10000, weeklyHours: 20 }).weekly, 40000);   // 20/40×8=4시간
assert.equal(wk({ hourly: 10000, weeklyHours: 14.9 }).weekly, 0);      // 15시간 미만
assert.equal(wk({ hourly: 10000, weeklyHours: 40, fullAttendance: false }).weekly, 0);
assert.equal(wk({ hourly: 10000, weeklyHours: 45 }).holidayHours, 8);  // 40시간 이상은 8시간
assert.equal(wk({ hourly: 10000, weeklyHours: 40 }).weeklyTotal, 480000);
console.log("labor-calculator: all assertions passed");

// 퇴직소득세 — 국세청 「퇴직소득세 계산방법」 계산 사례(2004-01-01 입사, 2023-12-31 퇴사, 퇴직급여 1억원)
const t1 = rtax({ pay: 100_000_000, start: "2004-01-01", lastDay: "2023-12-31" });
assert.equal(t1.years, 20);
assert.equal(t1.tenureDeduction, 40_000_000);
assert.equal(t1.converted, 36_000_000);
assert.equal(t1.convertedDeduction, 24_800_000);
assert.equal(t1.taxBase, 11_200_000);
assert.equal(t1.convertedTax, 672_000);
assert.equal(t1.tax, 1_120_000);
// 근속 5년, 2천만원: 공제 500만, 환산 3,600만, 환산급여공제 2,480만, 과세표준 1,120만, 6% → 67.2만 ÷12×5 = 28만
const t2 = rtax({ pay: 20_000_000, start: "2021-01-01", lastDay: "2025-12-31" });
assert.equal(t2.years, 5);
assert.equal(t2.tax, 280_000);
// 높은 구간: 근속 10년, 3억원 → 38% 구간, 산출세액 38,990,000원
const t3 = rtax({ pay: 300_000_000, start: "2016-01-01", lastDay: "2025-12-31" });
assert.equal(t3.years, 10);
assert.equal(t3.tenureDeduction, 15_000_000);
assert.equal(t3.rate, 0.38);
assert.equal(t3.tax, 38_990_000);
// 근속연수: 1년 미만 끝수는 1년으로 올림 (4년 4개월 → 5년), 정확히 5년은 5년
assert.equal(rtax({ pay: 1e7, start: "2022-03-01", lastDay: "2026-06-30" }).years, 5);
assert.equal(rtax({ pay: 1e7, start: "2021-01-01", lastDay: "2025-12-31" }).years, 5);
assert.equal(rtax({ pay: 1e7, start: "2021-01-01", lastDay: "2026-01-01" }).years, 6);
// 환산급여가 800만원 이하이면 전액 공제되어 세금 0
assert.equal(rtax({ pay: 3_000_000, start: "2021-01-01", lastDay: "2025-12-31" }).tax, 0);
console.log("labor-calculator retirementTax: ok");

// 최저임금 비교(2026년 10,320원)
assert.deepEqual(mwc(10320), { min: 10320, diff: 0, ok: true });
assert.equal(mwc(10319).ok, false);
assert.equal(mwc(10319).diff, -1);
assert.equal(mwc(12000).diff, 1680);
assert.equal(mwc(0), null);
console.log("labor-calculator minimumWageCheck: ok");
