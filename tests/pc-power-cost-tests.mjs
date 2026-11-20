// PC 전기요금 계산기 검증: node tests/pc-power-cost-tests.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const { usage, TIERS } = createRequire(import.meta.url)("../pc-power-cost.js");
const near = (a, b, m) => assert.ok(Math.abs(a - b) < 1e-9, `${m}: ${a} vs ${b}`);

// 부하만: 300W × 4시간 × 30일 = 36kWh (페이지 FAQ 예시)
let u = usage({ loadW: 300, loadH: 4, idleW: 0, idleH: 0, days: 30 });
near(u.monthly, 36, "monthly"); near(u.yearly, 432, "yearly"); near(u.parts.load, 36, "load part");
near(u.monthly * TIERS["2"], 7725.6, "월 요금(2단계 214.6원)");

// 부하 4h + 유휴 2h + 꺼 둔 18h(대기 2W)
u = usage({ loadW: 300, loadH: 4, idleW: 50, idleH: 2, standbyW: 2, days: 30 });
near(u.daily, 1.2 + 0.1 + 0.036, "daily");
near(u.monthly, 40.08, "monthly mix");
near(u.parts.load + u.parts.idle + u.parts.standby, u.monthly, "parts sum");
near(u.parts.standby, 1.08, "standby part");
near(u.idleToOffMonthly, 2.88, "유휴→끔 절감"); // (50-2)W × 2h × 30일

// 24시간 꽉 채우면 꺼 둔 시간은 0, 유휴 대기전력이 꺼 둔 전력보다 낮으면 절감 0
u = usage({ loadW: 100, loadH: 12, idleW: 1, idleH: 12, standbyW: 5, days: 30 });
near(u.parts.standby, 0, "no standby hours"); near(u.idleToOffMonthly, 0, "no saving");
console.log("pc-power-cost: all assertions passed");
