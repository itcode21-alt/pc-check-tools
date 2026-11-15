// 퇴직금·주휴수당 계산기 검증: node tests/labor-calculator-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { severance: sev, weeklyHoliday: wk } = createRequire(import.meta.url)("../labor-calculator.js");

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
