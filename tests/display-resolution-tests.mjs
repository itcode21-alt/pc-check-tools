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

// 일반 사용자용 이름
assert.equal(R.friendlyName(1920, 1080), "FHD (풀HD)");
assert.equal(R.friendlyName(2560, 1440), "QHD (2K)");
assert.equal(R.friendlyName(3840, 2160), "UHD (4K)");
assert.equal(R.friendlyName(3420, 2224), "");
assert.equal(R.describe(2560, 1440), "2560×1440 · QHD (2K)");
assert.equal(R.describe(3420, 2224), "3420×2224");

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
assert.ok(r[0].steps.length === 3 && /\(권장\)/.test(r[0].steps[0]) && /모델명/.test(r[0].steps[1]) && /PowerShell/.test(r[0].steps[2]));   // 숫자를 몰라도 알아낼 방법 3가지
r = rep({ nat: { w: 2560, h: 1440 } });
assert.ok(/FHD \(풀HD\)/.test(r[0].title) && /QHD \(2K\)/.test(r[0].title));                                                  // 결과 제목에 이름이 함께 나온다
r = rep({ nat: { w: 1920, h: 1080 }, measuredHz: 60, maxHz: 144 });
assert.ok(r.some((x) => x.tone === "warn" && /주사율/.test(x.title)));
assert.ok(r.find((x) => /주사율/.test(x.title)).steps.some((s) => /별표/.test(s)));     // Microsoft 안내(별표) 반영
r = rep({ nat: { w: 1920, h: 1080 }, dpr: 1.1 });
assert.ok(r.some((x) => /확대·축소/.test(x.title)));
// ── 점검 파일(.bat) 결과 ──
import fs from "node:fs";
import zlib from "node:zlib";
const payload = {
  v: 1,
  monitors: [
    { name: "DISPLAY\\GSM5BBF\\4&1", maker: "GSM", model: "LG ULTRAGEAR", active: true, prefW: 2560, prefH: 1440, prefHz: 59.95,
      modes: [{ w: 2560, h: 1440, maxHz: 144 }, { w: 1920, h: 1080, maxHz: 144 }] },
    { name: "DISPLAY\\DEL4112\\5&2", maker: "DEL", model: "DELL P2419H", active: false, prefW: 1920, prefH: 1080, prefHz: 60, modes: [] },
  ],
  adapters: [
    { name: "Microsoft Basic Display Adapter", curW: 0, curH: 0, curHz: 0, driver: "10.0" },
    { name: "NVIDIA GeForce RTX 4060", curW: 1920, curH: 1080, curHz: 60, driver: "31.0" },
  ],
};
const parsed = R.parseCheckJson(JSON.stringify(payload));
assert.equal(parsed.monitors.length, 2);
assert.equal(R.monitorMaxHz(parsed.monitors[0]), 144);                                  // 최적 해상도의 지원 모드 중 최고 주사율
assert.equal(R.monitorMaxHz(parsed.monitors[1]), 60);
assert.equal(R.monitorLabel(parsed.monitors[0]), "GSM LG ULTRAGEAR");
assert.equal(R.pickAdapter(parsed.adapters).name, "NVIDIA GeForce RTX 4060");           // 현재 해상도를 알려 주는 제조사 드라이버 어댑터
assert.ok(R.isBasicAdapter("Microsoft Basic Display Adapter") && R.isBasicAdapter("Microsoft 기본 디스플레이 어댑터") && !R.isBasicAdapter("NVIDIA GeForce RTX 4060"));
assert.equal(R.parseCheckJson("{}"), null);                                               // 형식이 다르면 읽지 않는다
assert.equal(R.parseCheckJson("not json"), null);
assert.equal(R.parseCheckJson(JSON.stringify({ monitors: [{ prefW: 5, prefH: 5 }] })), null);
const evil = R.parseCheckJson(JSON.stringify({ monitors: [{ name: "<img src=x onerror=1>\u0000", prefW: 1920, prefH: 1080, modes: new Array(50).fill({ w: 1, h: 1 }) }], adapters: [] }));
assert.ok(evil.monitors[0].modes.length <= 12 && !/\u0000/.test(evil.monitors[0].name));      // 길이 제한·제어문자 제거(화면 출력은 별도로 이스케이프)

// 점검 파일이 만드는 주소(#d=…, gzip + base64url)를 그대로 풀 수 있다
const b64url = zlib.gzipSync(Buffer.from(JSON.stringify(payload), "utf8")).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const decoded = await R.decodeHashPayload("#d=" + b64url);
assert.equal(R.parseCheckJson(decoded).monitors[0].prefW, 2560);
assert.equal(await R.decodeHashPayload(""), null);
await assert.rejects(() => R.decodeHashPayload("#d=!!"), /손상/);

// Windows가 알려 준 값으로 비교: 제조사 드라이버가 정상일 때와 기본 드라이버일 때
const winRep = (o) => R.buildReport(Object.assign({ cur: { w: 1920, h: 1080 }, nat: { w: 2560, h: 1440 }, dpr: 1, measuredHz: 60, maxHz: 144, hzSource: "windows" }, o));
let w = winRep({ driverOk: true, nativeInModes: true });
assert.ok(w.some((x) => /드라이버는 정상/.test(x.title)));
assert.ok(!w.some((x) => /확대·축소/.test(x.title)));                                  // 브라우저 배율 경고는 Windows 값에는 해당 없음
assert.ok(w.find((x) => /드라이버는 정상/.test(x.title)).body.join("").includes("지원 모드"));
const mm = w.find((x) => /보다 낮은/.test(x.title)); assert.ok(mm.steps.some((x) => /그래픽 제어판/.test(x)) && !mm.steps.some((x) => /업데이트 확인/.test(x)));  // 정상 드라이버면 업데이트보다 설정·연결 먼저
assert.ok(w.some((x) => /Windows가 알려 준 현재 주사율/.test(x.title)));
w = winRep({ basic: true, driverOk: false });
assert.ok(/기본 디스플레이/.test(w[0].title) && /UEFI/.test(w[0].body.join("")));          // Microsoft 문서 근거(UEFI에서 해상도 변경 불가)
// 그래픽카드·케이블 보완 안내
w = winRep({ driverOk: true });
const adv = w.find((x) => /그래픽카드나 케이블/.test(x.title));
assert.ok(adv && adv.steps.length === 4 && /HDMI 1.4b/.test(adv.steps[0]) && /Premium High Speed/.test(adv.steps[1]) && /젠더/.test(adv.steps[2]));
assert.ok(/능동/.test(adv.steps[2]) && /방향/.test(adv.steps[2]));                         // 젠더는 방향·능동 여부 안내(Dell)
// 4K인데 30Hz 이하 → HDMI 한계 경고
w = R.buildReport({ cur: { w: 3840, h: 2160 }, nat: { w: 3840, h: 2160 }, dpr: 1, measuredHz: 30, maxHz: 60, hzSource: "windows" });
assert.ok(w.some((x) => x.tone === "warn" && /4K 해상도에서 주사율이 30Hz/.test(x.title)));
// 해상도·주사율이 모두 정상이면 보완 안내를 붙이지 않는다
w = R.buildReport({ cur: { w: 2560, h: 1440 }, nat: { w: 2560, h: 1440 }, dpr: 1, measuredHz: 144, maxHz: 144, hzSource: "windows" });
assert.ok(!w.some((x) => /그래픽카드나 케이블/.test(x.title)));

// 점검 파일(.bat) 형식 확인: 줄바꿈 CRLF, 마커·읽기 전용 명령·주소 구성
const bat = fs.readFileSync(new URL("../assets/itsvc-display-check.bat", import.meta.url), "utf8");
assert.ok(bat.includes("\r\n") && !/[^\r]\n/.test(bat));
assert.ok(/#PS'\+'-START/.test(bat) && /\n#PS-START\r?\n/.test(bat));
assert.ok(/WmiMonitorListedSupportedSourceModes/.test(bat) && /Win32_VideoController/.test(bat) && /#d=\$b64/.test(bat));
assert.ok(!/(Remove-Item|Set-ItemProperty|New-ItemProperty|Stop-Service|Restart-Computer|Format-Volume|Invoke-WebRequest|DownloadString|Invoke-RestMethod)/i.test(bat));   // 읽기 전용: 지우기·설정 변경·네트워크 전송 명령 없음
assert.ok(bat.includes("https://itsvc.co.kr/display-resolution-check.html"));
console.log("display-resolution 검증 통과");

// 윈도우가 실제로 제공하는 주사율(rates)이 모니터가 알려 준 모드(WMI)보다 많은 경우: 실제 사례(WMI 1080p 60Hz만, 윈도우 50·59·60·75·100Hz)
const real = R.parseCheckJson(JSON.stringify({ v: 1, monitors: [{ name: "DISPLAY-SAM743D-x", maker: "SAM", model: "LS27C43xG", active: true, prefW: 1920, prefH: 1080, prefHz: 60,
  modes: [{ w: 1920, h: 1080, maxHz: 60 }], rates: [50, 59, 60, 75, 100], curW: 1920, curH: 1080, curHz: 60 }], adapters: [{ name: "NVIDIA GeForce RTX 3060", curW: 1920, curH: 1080, curHz: 60, driver: "1" }] }));
assert.equal(R.monitorMaxHz(real.monitors[0]), 100);                                      // WMI의 60이 아니라 실제 최대 100
assert.deepEqual(real.monitors[0].rates, [50, 59, 60, 75, 100]);
assert.equal(real.monitors[0].curHz, 60);
const old2 = R.parseCheckJson(JSON.stringify({ monitors: [{ prefW: 1920, prefH: 1080, prefHz: 60, modes: [{ w: 1920, h: 1080, maxHz: 60 }] }] }));
assert.equal(R.monitorMaxHz(old2.monitors[0]), 60);                                       // rates가 없는 예전 점검 파일 결과도 그대로 읽는다
assert.deepEqual(old2.monitors[0].rates, []);
const junk = R.parseCheckJson(JSON.stringify({ monitors: [{ prefW: 1920, prefH: 1080, rates: ["x", -5, 0, 1, 144, 99999, ...new Array(60).fill(75)] }] }));
assert.ok(junk.monitors[0].rates.length <= 24 && junk.monitors[0].rates.every((r) => r > 1 && r <= 1000));  // 이상한 값은 걸러 낸다
console.log("display-resolution rates 검증 통과");
