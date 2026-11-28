// 모니터 해상도·주사율 점검 로직 검증: node tests/display-resolution-tests.mjs
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const R = createRequire(import.meta.url)("../display-resolution-check.js");

// 출력 해상도 = 화면 크기 × 배율
assert.deepEqual(R.physicalSize(1536, 864, 1.25), { w: 1920, h: 1080 });
assert.deepEqual(R.physicalSize(1710, 1112, 2), { w: 3420, h: 2224 });
assert.equal(R.scalePercent(1.5), 150);
assert.ok(R.isStandardScale(1.25) && R.isStandardScale(2) && !R.isStandardScale(1.1) && !R.isStandardScale(0.9));

// 해상도 비교
const c = (cur, nat) => R.classifyResolution(cur, nat);
assert.equal(c({ w: 1920, h: 1080 }, { w: 1920, h: 1080 }).kind, "match");
assert.equal(c({ w: 1919, h: 1080 }, { w: 1920, h: 1080 }).kind, "match");            // 반올림 오차 허용
assert.equal(c({ w: 1920, h: 1080 }, { w: 2560, h: 1440 }).kind, "lower-same");
assert.equal(c({ w: 1280, h: 1024 }, { w: 2560, h: 1440 }).kind, "lower-diff");
assert.equal(c({ w: 3840, h: 2160 }, { w: 2560, h: 1440 }).kind, "higher-same");
assert.equal(c({ w: 1080, h: 1920 }, { w: 1920, h: 1080 }).kind, "match");            // 세로로 돌려 쓰는 모니터
assert.equal(c({ w: 1080, h: 1920 }, { w: 1920, h: 1080 }).rotated, true);
assert.equal(c({ w: 1920, h: 1080 }, { w: 1920, h: 1080 }).rotated, false);

// 주사율 근사: 흔한 값으로 맞추기
assert.equal(R.snapRate(59.94), 60);
assert.equal(R.snapRate(143.6), 144);
assert.equal(R.snapRate(0), 0);
assert.equal(R.snapRate(93), 93);                                                  // 흔한 값과 3% 넘게 다르면 그대로
const steady = (ms, n) => Array.from({ length: n }, () => ms);
const r60 = R.refreshFromIntervals(steady(16.667, 120));
assert.equal(r60.hz, 60); assert.ok(r60.stable > 0.99);
assert.equal(R.refreshFromIntervals(steady(6.944, 300)).hz, 144);
assert.equal(R.refreshFromIntervals(steady(16.7, 10)), null);                          // 표본이 적으면 판단하지 않는다
const jitter = steady(16.667, 100); jitter[10] = 60; jitter[30] = 80;                  // 튀는 프레임이 있어도 중앙값은 유지
assert.equal(R.refreshFromIntervals(jitter).hz, 60);

// 주사율 판정
assert.equal(R.refreshVerdict(144, 144).kind, "ok");
assert.equal(R.refreshVerdict(60, 144).kind, "low");
assert.equal(R.refreshVerdict(60, 0).kind, "no-max");
assert.equal(R.refreshVerdict(0, 144).kind, "none");

// PowerShell 출력 해석
const out = "Preferred=2560x1440@59.95;MaxHzAtPreferred=144;Monitor=DISPLAY\\GSM5BBF\\4&abc\r\nPreferred=1920x1080@60;MaxHzAtPreferred=75;Monitor=DISPLAY\\DEL4112\\x";
const p = R.parsePreferred(out);
assert.equal(p.length, 2);
assert.deepEqual([p[0].w, p[0].h, p[0].hz, p[0].maxHz], [2560, 1440, 59.95, 144]);
assert.equal(p[1].name, "DISPLAY\\DEL4112\\x");
assert.equal(R.parsePreferred("그냥 3840 x 2160 입니다")[0].w, 3840);                  // 해상도만 적어도 읽는다
assert.equal(R.parsePreferred("아무것도 없음").length, 0);
assert.equal(R.parsePreferred("Preferred=99x99@60").length, 0);                         // 말이 안 되는 크기는 버린다

// 결과 문구
const rep = (o) => R.buildReport(Object.assign({ cur: { w: 1920, h: 1080 }, dpr: 1, measuredHz: 0, maxHz: 0 }, o));
let r = rep({ nat: { w: 1920, h: 1080 } });
assert.equal(r[0].tone, "ok");
r = rep({ nat: { w: 2560, h: 1440 } });
assert.equal(r[0].tone, "warn"); assert.ok(r[0].steps.length >= 3 && /\(권장\)/.test(r[0].steps[0]));
assert.ok(/Microsoft/.test(r[0].body.join("")));
r = rep({ nat: null });
assert.equal(r[0].tone, "info");
r = rep({ nat: { w: 1920, h: 1080 }, measuredHz: 60, maxHz: 144 });
assert.ok(r.some((x) => x.tone === "warn" && /주사율/.test(x.title)));
assert.ok(r.find((x) => /주사율/.test(x.title)).steps.some((s) => /별표/.test(s)));     // Microsoft 안내(별표) 반영
r = rep({ nat: { w: 1920, h: 1080 }, dpr: 1.1 });
assert.ok(r.some((x) => /확대·축소/.test(x.title)));
console.log("display-resolution 검증 통과");
