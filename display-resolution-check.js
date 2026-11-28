/* 모니터 해상도·주사율 점검 (display-resolution-check.html)
 *
 * 브라우저만으로는 모니터의 최적(네이티브) 해상도를 알 수 없습니다(모니터 정보 EDID를 읽지 못함).
 * 그래서 (1) 브라우저가 아는 현재 출력 해상도·배율·주사율 근사값을 보여 주고,
 *       (2) 방문자가 고른 값 또는 PowerShell 출력(WmiMonitorListedSupportedSourceModes)으로 최적 사양을 받아 비교합니다.
 * 모든 계산은 브라우저 안에서만 이루어지고 어디로도 전송하지 않습니다.
 * 안내 문구의 근거: Microsoft 지원 "Change your screen resolution and layout in Windows",
 * "Change the refresh rate on your monitor in Windows", Win32 문서 WmiMonitorListedSupportedSourceModes.
 */
(function (root) {
  "use strict";

  const COMMON_RATES = [24, 30, 48, 50, 60, 72, 75, 85, 90, 100, 120, 144, 165, 170, 180, 200, 240, 280, 300, 360, 480];
  const STANDARD_SCALES = [100, 125, 150, 175, 200, 225, 250, 300, 350, 400, 450, 500];

  // 일반 사용자가 흔히 쓰는 이름(가로×세로 숫자를 몰라도 고를 수 있게 한다). 업계에서 널리 쓰는 통칭이다.
  const FRIENDLY_NAMES = {
    "1366x768": "HD (노트북 기본 화면)",
    "1600x900": "HD+",
    "1920x1080": "FHD (풀HD)",
    "1920x1200": "WUXGA (16:10 풀HD+)",
    "2560x1080": "울트라와이드 FHD",
    "2560x1440": "QHD (2K)",
    "2560x1600": "WQXGA (16:10 QHD+)",
    "3440x1440": "울트라와이드 QHD",
    "3840x1080": "슈퍼 울트라와이드 FHD",
    "3840x1600": "울트라와이드 QHD+",
    "3840x2160": "UHD (4K)",
    "5120x1440": "슈퍼 울트라와이드 QHD",
    "5120x2160": "울트라와이드 5K2K",
  };

  function friendlyName(w, h) {
    return FRIENDLY_NAMES[`${w}x${h}`] || "";
  }

  // "1920×1080 (FHD)"처럼 숫자와 이름을 함께 보여 준다.
  function describe(w, h) {
    const n = friendlyName(w, h);
    return n ? `${w}×${h} · ${n}` : `${w}×${h}`;
  }

  // ── 순수 계산(테스트 대상) ───────────────────────────────────────────────
  function physicalSize(screenW, screenH, dpr) {
    const r = dpr > 0 ? dpr : 1;
    return { w: Math.round(screenW * r), h: Math.round(screenH * r) };
  }

  function scalePercent(dpr) {
    return Math.round((dpr > 0 ? dpr : 1) * 100);
  }

  // 윈도우 배율(100·125·150…)에 해당하는지. 아니면 브라우저 확대/축소가 100%가 아닐 가능성이 크다.
  function isStandardScale(dpr) {
    const p = scalePercent(dpr);
    return STANDARD_SCALES.some((s) => Math.abs(s - p) <= 1);
  }

  function sameAspect(a, b) {
    return Math.abs(a.w / a.h - b.w / b.h) / (b.w / b.h) < 0.012;
  }

  // 현재 출력(cur)과 모니터 최적 해상도(nat)를 비교한다. 세로로 돌려 쓰는 모니터는 가로세로를 맞바꿔 비교한다.
  function classifyResolution(cur, nat) {
    const rotated = cur.w < cur.h !== nat.w < nat.h;
    const c = rotated ? { w: cur.h, h: cur.w } : cur;
    const t = 2;
    let kind;
    if (Math.abs(c.w - nat.w) <= t && Math.abs(c.h - nat.h) <= t) kind = "match";
    else if (c.w * c.h < nat.w * nat.h) kind = sameAspect(c, nat) ? "lower-same" : "lower-diff";
    else kind = sameAspect(c, nat) ? "higher-same" : "higher-diff";
    return { kind, rotated };
  }

  function snapRate(hz) {
    if (!(hz > 0)) return 0;
    let best = null;
    for (const r of COMMON_RATES) {
      const d = Math.abs(hz - r) / r;
      if (d <= 0.03 && (best === null || d < best.d)) best = { r, d };
    }
    return best ? best.r : Math.round(hz * 10) / 10;
  }

  function median(values) {
    const s = values.slice().sort((a, b) => a - b);
    const n = s.length;
    if (!n) return 0;
    return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
  }

  // 프레임 간격(ms) 배열 → 주사율 근사. 앞의 몇 프레임은 불안정해서 버린다.
  function refreshFromIntervals(intervals) {
    const used = intervals.slice(3);
    if (used.length < 20) return null;
    const m = median(used);
    if (!(m > 0)) return null;
    const near = used.filter((v) => Math.abs(v - m) / m <= 0.2).length;
    return { hz: snapRate(1000 / m), rawHz: 1000 / m, samples: used.length, stable: near / used.length };
  }

  function refreshVerdict(measured, max) {
    if (!(measured > 0)) return { kind: "none" };
    if (!(max > 0)) return { kind: "no-max" };
    return measured / max >= 0.92 ? { kind: "ok" } : { kind: "low" };
  }

  // PowerShell 출력에서 모니터별 최적 사양을 읽는다.
  // 한 줄 형식: Preferred=2560x1440@59.95;MaxHzAtPreferred=144;Monitor=DISPLAY\XXX\...
  function parsePreferred(text) {
    const out = [];
    const re = /Preferred\s*=\s*(\d{3,5})\s*x\s*(\d{3,5})\s*@\s*([\d.]+)(?:\s*;\s*MaxHzAtPreferred\s*=\s*([\d.]+))?(?:\s*;\s*Monitor\s*=\s*([^\r\n]*))?/gi;
    let m;
    while ((m = re.exec(String(text || "")))) {
      out.push({ w: +m[1], h: +m[2], hz: parseFloat(m[3]), maxHz: m[4] ? parseFloat(m[4]) : 0, name: (m[5] || "").trim() });
    }
    if (!out.length) {
      const f = /(\d{3,5})\s*[x×]\s*(\d{3,5})/.exec(String(text || ""));
      if (f) out.push({ w: +f[1], h: +f[2], hz: 0, maxHz: 0, name: "" });
    }
    return out.filter((o) => o.w >= 320 && o.h >= 240 && o.w <= 16384 && o.h <= 16384);
  }

  // ── 점검 파일(.bat)이 넘겨 주는 결과 ─────────────────────────────────────
  const clampInt = (v, lo, hi) => { const n = Math.round(Number(v)); return Number.isFinite(n) && n >= lo && n <= hi ? n : 0; };
  const cleanText = (v) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 80);

  // JSON 문자열을 안전하게 걸러 읽는다. 형식이 맞지 않으면 null.
  function parseCheckJson(text) {
    let o;
    try { o = JSON.parse(String(text || "")); } catch (e) { return null; }
    if (!o || typeof o !== "object" || !Array.isArray(o.monitors)) return null;
    const monitors = [];
    for (const m of o.monitors.slice(0, 8)) {
      if (!m || typeof m !== "object") continue;
      const prefW = clampInt(m.prefW, 320, 16384);
      const prefH = clampInt(m.prefH, 240, 16384);
      if (!prefW || !prefH) continue;
      const modes = (Array.isArray(m.modes) ? m.modes : []).slice(0, 12)
        .map((x) => ({ w: clampInt(x && x.w, 320, 16384), h: clampInt(x && x.h, 240, 16384), maxHz: Math.max(0, Math.min(1000, Number(x && x.maxHz) || 0)) }))
        .filter((x) => x.w && x.h);
      // 윈도우가 이 모니터에 실제로 제공하는 주사율(최적 해상도 기준). 모니터가 알려 주는 모드 목록(WMI)에는 일부만 있는 경우가 많다.
      const rates = (Array.isArray(m.rates) ? m.rates : []).slice(0, 24)
        .map((x) => Math.max(0, Math.min(1000, Number(x) || 0))).filter((x) => x > 1);
      monitors.push({
        name: cleanText(m.name), maker: cleanText(m.maker), model: cleanText(m.model), active: m.active !== false,
        prefW, prefH, prefHz: Math.max(0, Math.min(1000, Number(m.prefHz) || 0)), modes, rates,
        curW: clampInt(m.curW, 0, 16384), curH: clampInt(m.curH, 0, 16384), curHz: clampInt(m.curHz, 0, 1000),
      });
    }
    const adapters = (Array.isArray(o.adapters) ? o.adapters : []).slice(0, 6).map((a) => ({
      name: cleanText(a && a.name), curW: clampInt(a && a.curW, 0, 16384), curH: clampInt(a && a.curH, 0, 16384),
      curHz: clampInt(a && a.curHz, 0, 1000), driver: cleanText(a && a.driver),
    }));
    return monitors.length ? { monitors, adapters } : null;
  }

  // Microsoft Basic Display Driver: 제조사 그래픽 드라이버가 없거나 작동하지 않을 때 쓰이는 기본 드라이버(Microsoft Learn)
  function isBasicAdapter(name) {
    return /basic display|기본 디스플레이/i.test(String(name || ""));
  }

  // 지금 모니터에 신호를 내보내는 어댑터: 현재 해상도를 알려 주는 것 중 기본 드라이버가 아닌 것을 먼저 고른다.
  function pickAdapter(adapters) {
    const live = (adapters || []).filter((a) => a.curW > 0 && a.curH > 0);
    return live.find((a) => !isBasicAdapter(a.name)) || live[0] || null;
  }

  function monitorLabel(m) {
    const t = `${m.maker} ${m.model}`.trim();
    return t || m.name || "모니터";
  }

  // 최적 해상도에서 가장 높은 주사율: 모니터가 알려 주는 모드(WMI)와 윈도우가 실제로 제공하는 주사율 중 큰 값
  function monitorMaxHz(m) {
    let best = m.prefHz || 0;
    for (const x of m.modes || []) if (x.w === m.prefW && x.h === m.prefH && x.maxHz > best) best = x.maxHz;
    for (const r of m.rates || []) if (r > best) best = r;
    return best;
  }

  // 점검 파일이 주소의 #d= 뒤에 담아 보낸 값(gzip + base64url)을 JSON 문자열로 푼다. 해당 없으면 null.
  async function decodeHashPayload(hash) {
    if (!/^#d=/.test(hash || "")) return null;
    const m = /^#d=([A-Za-z0-9_-]+)$/.exec(hash);
    if (!m) throw new Error("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요.");
    if (typeof DecompressionStream === "undefined") throw new Error("이 브라우저는 점검 파일의 결과를 읽지 못합니다. 아래 '방법 2'나 '방법 3'을 이용하세요.");
    let b64 = m[1].replace(/-/g, "+").replace(/_/g, "/");
    while (b64.length % 4) b64 += "=";
    let bytes;
    try { bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)); } catch (e) { throw new Error("결과 값이 손상됐습니다. 점검 파일을 다시 실행해 주세요."); }
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
      return await new Response(stream).text();
    } catch (e) { throw new Error("결과 값을 풀지 못했습니다. 점검 파일을 다시 실행해 주세요."); }
  }

  // 결과 항목 목록. tone: ok | warn | info
  function buildReport(input) {
    const items = [];
    const { cur, nat, dpr, measuredHz, maxHz } = input;
    const fromWindows = input.hzSource === "windows";
    const hzLabel = fromWindows ? "Windows가 알려 준 현재 주사율" : "측정 주사율";
    const scale = scalePercent(dpr);

    if (input.basic) {
      items.push({
        tone: "warn",
        title: "그래픽 어댑터가 'Microsoft 기본 디스플레이 어댑터'로 보입니다",
        body: [
          "Microsoft 문서에 따르면 이 기본 드라이버는 제조사(NVIDIA·AMD·Intel) 그래픽 드라이버가 없거나 작동하지 않을 때 쓰이며, UEFI 환경에서는 해상도 변경이 불가능할 수 있습니다. 최적 해상도와 높은 주사율이 목록에 없는 흔한 이유입니다.",
        ],
        steps: [
          "설정 > Windows 업데이트 > 업데이트 확인으로 그래픽 드라이버를 받아 봅니다.",
          "그래도 기본 드라이버라면 그래픽카드(또는 노트북·메인보드) 제조사 사이트에서 내 모델에 맞는 드라이버를 받아 설치합니다.",
        ],
      });
    }

    if (!fromWindows && !isStandardScale(dpr)) {
      items.push({
        tone: "warn",
        title: "브라우저 확대·축소가 100%가 아닐 수 있습니다",
        body: [
          `현재 배율 값이 ${scale}%로 나와 윈도우 배율(100·125·150% 등)과 다릅니다. 브라우저를 확대·축소해 두면 출력 해상도 계산이 달라집니다.`,
          "Ctrl+0을 눌러 100%로 되돌린 뒤 이 페이지를 새로 고쳐 다시 확인하세요.",
        ],
      });
    }

    if (nat && nat.w > 0 && nat.h > 0) {
      const r = classifyResolution(cur, nat);
      const curText = describe(cur.w, cur.h);
      const natText = describe(nat.w, nat.h);
      const rotNote = r.rotated ? ["모니터를 세로로 돌려 쓰는 것으로 보고 가로·세로를 바꿔 비교했습니다."] : [];
      const recommended = "설정 > 시스템 > 디스플레이에서 이 모니터를 고른 뒤 '디스플레이 해상도' 목록에서 '(권장)'이 붙은 값을 선택합니다. 권장 값이 모니터 최적 해상도와 같다면 그대로 두면 됩니다.";
      const cableStep = "케이블·포트·모니터 입력 설정을 점검하세요(문서 외 일반 점검): 다른 케이블이나 다른 포트(HDMI↔DisplayPort)로 바꿔 보고, 데스크톱은 케이블이 메인보드가 아니라 그래픽카드 포트에 꽂혀 있는지, 모니터 메뉴(OSD)의 입력 소스·모드 설정이 맞는지 확인합니다.";
      // 장치 관리자에 제조사 그래픽 드라이버가 정상으로 잡힌 경우에는 드라이버 업데이트보다 설정·연결 쪽을 먼저 본다.
      const fixSteps = input.driverOk
        ? [
            recommended,
            "목록의 '(권장)' 값이 최적 해상도인데도 화면이 흐리다면 그래픽 제어판(NVIDIA 제어판·AMD Software·Intel 그래픽 설정)에서 맞춤 해상도나 크기 조정(스케일링), DSR·VSR 같은 가상 해상도 기능이 켜져 있지 않은지 확인합니다(문서 외 일반 점검).",
            cableStep,
          ]
        : [
            recommended,
            "'(권장)' 목록에 최적 해상도가 없거나 해상도가 저절로 바뀐다면 그래픽 드라이버가 문제일 수 있습니다. 설정 > Windows 업데이트 > 업데이트 확인으로 드라이버 업데이트를 받아 보세요(Microsoft 안내). 장치 관리자의 '디스플레이 어댑터'에 제조사 이름(NVIDIA·AMD·Intel)이 보이면 제조사 드라이버가 설치된 것입니다.",
            cableStep,
          ];
      if (r.kind === "match") {
        items.push({
          tone: "ok",
          title: `출력 해상도(${curText})가 모니터 최적 해상도(${natText})와 같습니다`,
          body: rotNote.concat([
            `글자나 화면이 작거나 커 보인다면 해상도가 아니라 '배율'(현재 ${scale}%) 설정 때문일 수 있습니다. 설정 > 시스템 > 디스플레이 > 배율에서 '(권장)'을 고르는 것이 보통 좋습니다.`,
          ]),
        });
      } else if (r.kind === "lower-same") {
        items.push({
          tone: "warn",
          title: `최적 해상도(${natText})보다 낮은 ${curText}로 출력되고 있습니다`,
          body: rotNote.concat([
            "Microsoft 안내에 따르면 모니터는 최적 해상도보다 낮은 해상도도 지원하지만, 글자가 덜 선명하고 화면이 작아 보이거나 가운데에 검은 테두리가 생기거나 늘어나 보일 수 있습니다.",
          ]),
          steps: fixSteps,
        });
      } else if (r.kind === "lower-diff") {
        items.push({
          tone: "warn",
          title: `최적 해상도(${natText})와 화면 비율이 다른 ${curText}로 출력되고 있습니다`,
          body: rotNote.concat([
            "비율이 다른 해상도는 화면이 가로나 세로로 늘어나 보이거나 양옆에 검은 띠가 생길 수 있습니다(Microsoft 안내: 늘어나 보이거나 검은 테두리가 생길 수 있음). 아래 '비율 확인' 테스트 패턴으로 원이 타원으로 보이는지 확인해 보세요.",
          ]),
          steps: fixSteps,
        });
      } else {
        items.push({
          tone: "info",
          title: `출력 해상도(${curText})가 입력하신 최적 해상도(${natText})보다 큽니다`,
          body: rotNote.concat([
            "최적 해상도를 잘못 고르셨거나 모니터가 지원 범위보다 큰 신호를 받아 줄여서 보여 주고 있을 수 있습니다(일부 모니터의 일반적인 동작). 줄여서 보여 주면 글자가 흐려 보일 수 있습니다.",
            "모니터 모델명으로 제조사 사양서의 '최적(권장) 해상도'를 다시 확인하고, 설정 > 시스템 > 디스플레이의 '(권장)' 표시와 비교해 보세요.",
          ]),
          steps: [fixSteps[0]],
        });
      }
      if (r.kind !== "match" && input.driverOk) {
        items.push({
          tone: "info",
          title: "그래픽 드라이버는 정상으로 설치돼 있습니다",
          body: [
            input.nativeInModes
              ? "모니터가 알려 주는 지원 모드에 최적 해상도가 있으므로, 드라이버 문제가 아니라 Windows 설정이나 그래픽 제어판 설정, 연결 때문에 다른 해상도로 나오고 있을 가능성이 큽니다."
              : "제조사 드라이버가 설치돼 있으니 드라이버 재설치보다 설정과 연결을 먼저 확인하세요.",
          ],
        });
      }
    } else {
      items.push({
        tone: "info",
        title: "내 모니터의 최적 해상도를 알아야 비교할 수 있습니다",
        body: [
          "브라우저는 모니터의 최적 해상도를 읽을 수 없습니다. 숫자를 몰라도 아래 방법 중 하나로 알아낼 수 있습니다.",
        ],
        steps: [
          "가장 쉬운 방법: 설정 > 시스템 > 디스플레이를 열고 '디스플레이 해상도' 목록에서 '(권장)'이 붙은 줄을 찾습니다. 그 값이 보통 모니터에 맞는 해상도입니다. 위 선택 상자에서 같은 이름(FHD·QHD·4K 등)이나 숫자를 고르세요.",
          "모니터 모델명으로 찾기: 모니터 뒷면 스티커나 전원을 켤 때 나오는 화면, 박스에 적힌 모델명을 검색해 제조사 사양서의 '해상도'를 확인합니다.",
          "자동으로 채우기: 위 'PowerShell로 자동으로 채우기'의 명령 결과를 붙여 넣으면 모니터가 알려 주는 최적 해상도가 채워집니다.",
        ],
      });
    }

    const v = refreshVerdict(measuredHz, maxHz);
    if (v.kind === "ok") {
      items.push({
        tone: "ok",
        title: `${hzLabel}(약 ${measuredHz}Hz)이 모니터 최대(${maxHz}Hz)에 가깝습니다`,
        body: ["브라우저에서 잰 근사값이라 오차가 있을 수 있습니다. Windows의 설정 > 시스템 > 디스플레이 > 고급 디스플레이 '디스플레이 정보'에서 현재 해상도와 주사율을 함께 볼 수 있습니다."],
      });
    } else if (v.kind === "low") {
      items.push({
        tone: "warn",
        title: `${hzLabel}(약 ${measuredHz}Hz)이 모니터 최대(${maxHz}Hz)보다 낮습니다`,
        body: [
          fromWindows
            ? "Windows가 알려 준 값입니다. 노트북이 절전·배터리 상태이거나 Windows 11의 '동적 주사율(DRR)'이 켜져 있으면 낮게 나올 수 있습니다(DRR은 120Hz 이상이면서 가변 주사율(VRR)을 지원하는 화면에서 상황에 따라 주사율을 자동으로 조절합니다). 모니터가 여러 대면 이 값이 다른 모니터의 값일 수 있습니다."
            : "브라우저 측정은 근사값입니다. 이 페이지가 다른 창에 가려졌거나 노트북이 절전·배터리 상태였거나, Windows 11의 '동적 주사율(DRR)'이 켜져 있으면 낮게 나올 수 있습니다(DRR은 120Hz 이상이면서 가변 주사율(VRR)을 지원하는 화면에서 상황에 따라 주사율을 자동으로 조절합니다). 위 조건을 정리한 뒤 다시 측정해 보세요.",
        ],
        steps: [
          "설정 > 시스템 > 디스플레이 > 고급 디스플레이에서 이 모니터를 고르고 '주사율 선택'에서 원하는 값을 고릅니다. 목록의 별표(*)가 붙은 값은 현재 해상도에서 지원되지 않아 선택하면 해상도가 바뀝니다(Microsoft 안내).",
          "원하는 주사율이 목록에 없다면 케이블·포트가 해당 해상도·주사율을 지원하는지, 모니터 설정(OSD)에서 입력 모드가 맞는지 확인하세요(문서 외 일반 점검). 다른 케이블이나 다른 포트로 바꿔 보는 것도 방법입니다.",
          "그래픽 드라이버를 업데이트한 뒤 다시 확인합니다(설정 > Windows 업데이트 또는 그래픽카드 제조사 사이트).",
        ],
      });
    } else if (v.kind === "no-max") {
      items.push({
        tone: "info",
        title: `${hzLabel}은 약 ${measuredHz}Hz입니다`,
        body: ["모니터의 최대 주사율을 선택하면 비교해 드립니다. 모니터 사양서나 PowerShell 결과에서 확인할 수 있습니다."],
      });
    }
    // 목록에 최적 해상도가 없거나 주사율이 낮을 때: 그래픽카드(출력 포트)·케이블·변환 기기를 어떻게 보완할지 안내한다.
    // 근거: HDMI 공식 사이트(HDMI 1.4b는 3840×2160을 24·25·30Hz까지, 케이블 등급 High Speed·Premium High Speed(18Gbps, 4K@60Hz 등)·
    // Ultra High Speed(최대 48Gbps)·Ultra96(96Gbps), 위조 케이블 주의)와 VESA(인증 부품 데이터베이스). 그 밖의 점검은 '문서 외 일반 점검'이다.
    const hzNow = fromWindows ? input.measuredHz : 0;
    const lowRes = nat && nat.w > 0 && classifyResolution(cur, nat).kind.startsWith("lower");
    const lowHz = refreshVerdict(measuredHz, maxHz).kind === "low";
    if (lowRes || lowHz) {
      const is4k = nat && nat.w >= 3840;
      if (is4k && measuredHz > 0 && measuredHz <= 31) {
        items.push({
          tone: "warn",
          title: `4K 해상도에서 주사율이 ${measuredHz}Hz 이하입니다 — HDMI 포트나 케이블이 한계일 수 있습니다`,
          body: [
            "HDMI 공식 사이트에 따르면 HDMI 1.4b가 지원하는 4K(3840×2160)는 24·25·30Hz까지입니다. 4K에서 30Hz까지만 나온다면 연결된 그래픽카드 HDMI 포트, 모니터 HDMI 입력, 케이블 중 하나가 그보다 낮은 수준일 수 있습니다.",
          ],
          steps: [
            "4K 60Hz를 쓰려면 그래픽카드 출력 포트와 모니터 입력이 모두 4K 60Hz를 지원해야 합니다. 두 제품의 사양서에서 HDMI 버전(또는 '4K 60Hz 지원')을 확인하세요.",
            "HDMI 케이블은 18Gbps 전체 대역폭이 인증된 'Premium High Speed' 이상(그보다 높은 'Ultra High Speed' 포함)을 쓰세요. HDMI 공식 사이트는 Premium High Speed 케이블을 4K@60Hz 같은 기능을 위한 인증으로 설명합니다.",
            "그래픽카드에 DisplayPort 출력이 있고 모니터에도 DisplayPort 입력이 있다면 DisplayPort 케이블로 바꿔 시험해 보세요(문서 외 일반 점검).",
          ],
        });
      }
      items.push({
        tone: "info",
        title: "그래픽카드나 케이블이 고해상도·고주사율을 지원하지 않을 수도 있습니다",
        body: [
          "해상도와 주사율은 모니터뿐 아니라 그래픽카드의 출력 포트, 케이블, 중간에 낀 변환 기기까지 모두 지원해야 나옵니다. 가장 낮은 규격이 전체 한계가 됩니다. 아래 순서로 어디를 보완해야 하는지 확인하세요.",
        ],
        steps: [
          "그래픽카드(내장 그래픽·노트북 포함): 제조사 사양서의 '최대 해상도'와 출력 포트 규격(HDMI 버전·DisplayPort 버전)을 확인합니다. HDMI는 버전마다 지원하는 해상도·주사율이 달라서, 예를 들어 HDMI 1.4b는 4K를 30Hz까지만 지원합니다(HDMI 공식 사이트). 원하는 값을 지원하지 않는 포트라면 다른 포트(DisplayPort 등)를 쓰거나 그래픽카드를 바꿔야 합니다.",
          "케이블: HDMI 케이블에는 공식 등급(High Speed·Premium High Speed·Ultra High Speed 등)이 있습니다. HDMI 공식 사이트는 Premium High Speed가 18Gbps 전체 대역폭, Ultra High Speed가 최대 48Gbps(HDMI 2.1) 구성용이고 일부 케이블은 위조품이라고 안내합니다. 오래되거나 등급 표시가 없는 케이블은 인증 등급의 케이블로 바꿔 시험하세요. DisplayPort는 VESA 인증 부품 데이터베이스에서 인증된 케이블을 찾을 수 있습니다.",
          "변환 젠더·허브·도킹스테이션: 같은 종류 포트끼리 케이블 하나로 직접 연결하는 것이 가장 안정적입니다(Dell 안내). 젠더는 방향이 정해져 있고(DisplayPort→HDMI 젠더를 거꾸로 쓸 수 없음), HDMI→DisplayPort·DisplayPort→DVI·DisplayPort→VGA는 전원이 필요한 능동 젠더가 필요하며, 해상도·주사율은 젠더 사양에 따라 제한됩니다. 젠더를 빼고 직결로 비교해 보세요.",
          "모니터: 입력 단자마다 지원하는 최대 해상도·주사율이 다를 수 있으니 사양서에서 어느 단자가 최대 값을 지원하는지 확인하고, 모니터 메뉴(OSD)의 입력 모드 설정이 맞는지 봅니다(문서 외 일반 점검).",
        ],
      });
    }
    void hzNow;
    return items;
  }

  const api = { parseCheckJson, isBasicAdapter, pickAdapter, monitorLabel, monitorMaxHz, decodeHashPayload, friendlyName, describe, physicalSize, scalePercent, isStandardScale, classifyResolution, snapRate, median, refreshFromIntervals, refreshVerdict, parsePreferred, buildReport, COMMON_RATES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ITSVC_RES = api;

  // ── 화면(브라우저에서만) ─────────────────────────────────────────────────
  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const state = { measuredHz: 0, payload: null, monitorIndex: 0, win: null, driverOk: false, nativeInModes: false };

  function readCurrent() {
    const dpr = window.devicePixelRatio || 1;
    const sw = (window.screen && window.screen.width) || 0;
    const sh = (window.screen && window.screen.height) || 0;
    return { dpr, sw, sh, cur: physicalSize(sw, sh, dpr) };
  }

  function renderCurrent() {
    const c = readCurrent();
    $("rc-cur-res").textContent = c.cur.w && c.cur.h ? describe(c.cur.w, c.cur.h).replace("×", " × ") : "알 수 없음";
    $("rc-cur-scale").textContent = `${scalePercent(c.dpr)}%`;
    $("rc-cur-css").textContent = `${c.sw} × ${c.sh}`;
    $("rc-zoom-warn").hidden = isStandardScale(c.dpr);
  }

  function selectedNative() {
    const v = $("rc-native").value;
    if (v === "custom") {
      const w = parseInt($("rc-nat-w").value, 10);
      const h = parseInt($("rc-nat-h").value, 10);
      return w > 0 && h > 0 ? { w, h } : null;
    }
    if (!v) return null;
    const m = /^(\d+)x(\d+)$/.exec(v);
    return m ? { w: +m[1], h: +m[2] } : null;
  }

  function selectedMaxHz() {
    const v = parseFloat($("rc-maxhz").value);
    return v > 0 ? v : 0;
  }

  function renderReport() {
    const c = readCurrent();
    const nat = selectedNative();
    const useWin = !!state.win;
    const items = buildReport({
      cur: useWin ? state.win.cur : c.cur,
      nat,
      dpr: c.dpr,
      measuredHz: useWin ? state.win.hz : state.measuredHz,
      maxHz: selectedMaxHz(),
      hzSource: useWin ? "windows" : "browser",
      basic: !!(state.win && state.win.basic),
      driverOk: state.driverOk,
      nativeInModes: state.nativeInModes,
    });
    const box = $("rc-report");
    box.hidden = false;
    box.innerHTML =
      "<h3>점검 결과</h3>" +
      (useWin ? `<p class="rc-note">현재 값은 점검 파일이 Windows에서 읽은 값(${esc(state.win.cur.w)}×${esc(state.win.cur.h)}${state.win.hz ? `, ${esc(state.win.hz)}Hz` : ""})을 기준으로 비교했습니다.</p>` : "") +
      items
        .map((it) => {
          const body = (it.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
          const steps = it.steps && it.steps.length ? `<ol class="mini-list">${it.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
          return `<div class="rc-item rc-${it.tone}"><h4>${esc(it.title)}</h4>${body}${steps}</div>`;
        })
        .join("");
    try {
      if (typeof gtag === "function") gtag("event", "res_check_compare", { has_native: nat ? 1 : 0, has_hz: (useWin ? state.win.hz : state.measuredHz) ? 1 : 0, via_file: useWin ? 1 : 0 });
    } catch (e) { /* 측정 실패는 무시 */ }
  }

  function setNativeSelect(w, h, hz) {
    const key = `${w}x${h}`;
    const sel = $("rc-native");
    const has = [...sel.options].some((o) => o.value === key);
    if (has) { sel.value = key; $("rc-custom").hidden = true; }
    else { sel.value = "custom"; $("rc-nat-w").value = w; $("rc-nat-h").value = h; $("rc-custom").hidden = false; }
    if (hz > 0) {
      const hs = $("rc-maxhz");
      const snapped = snapRate(hz);
      let found = false;
      for (const o of hs.options) { if (parseFloat(o.value) === snapped) { hs.value = o.value; found = true; } }
      if (!found) { const o = document.createElement("option"); o.value = String(snapped); o.textContent = `${snapped}Hz`; hs.appendChild(o); hs.value = o.value; }
    }
  }

  // 점검 파일의 결과로 화면을 채운다.
  function useMonitor(i) {
    const o = state.payload;
    if (!o) return;
    const m = o.monitors[i] || o.monitors[0];
    state.monitorIndex = i;
    const maxHz = monitorMaxHz(m);
    setNativeSelect(m.prefW, m.prefH, maxHz);
    const ad = pickAdapter(o.adapters);
    // 윈도우가 이 모니터에 대해 알려 준 현재 값이 있으면 그것을 쓴다(어댑터 값은 다른 모니터의 값일 수 있다).
    const own = m.curW > 0 && m.curH > 0;
    state.win = ad ? { cur: { w: own ? m.curW : ad.curW, h: own ? m.curH : ad.curH }, hz: own ? m.curHz : ad.curHz, basic: isBasicAdapter(ad.name) } : null;
    state.driverOk = !!(ad && !isBasicAdapter(ad.name));
    state.nativeInModes = (m.modes || []).some((x) => x.w === m.prefW && x.h === m.prefH);
    const lines = [
      `모니터: ${monitorLabel(m)}${m.active ? "" : " (현재 비활성)"}`,
      `모니터가 알려 준 최적(선호) 해상도: ${describe(m.prefW, m.prefH).replace("×", " × ")}${maxHz ? `, 최대 ${snapRate(maxHz)}Hz(${m.rates && m.rates.length ? "윈도우가 이 모니터에 제공하는 주사율 기준" : "모니터가 알려 준 지원 모드 기준, 실제 최대는 더 높을 수 있음"})` : ""}`,
    ];
    if (ad) lines.push(`Windows가 지금 쓰는 값: ${describe(state.win.cur.w, state.win.cur.h).replace("×", " × ")}${state.win.hz ? ` @ ${state.win.hz}Hz` : ""} · 그래픽 어댑터: ${ad.name || "알 수 없음"}`);
    if (!own && (o.adapters.filter((a) => a.curW > 0).length > 1 || o.monitors.length > 1)) lines.push("모니터나 그래픽 어댑터가 여러 개면 Windows가 알려 준 현재 값이 다른 모니터의 값일 수 있습니다.");
    $("rc-auto-info").innerHTML = lines.map((t) => `<li>${esc(t)}</li>`).join("");
    renderReport();
  }

  function applyPayload(o) {
    state.payload = o;
    const card = $("rc-auto");
    card.hidden = false;
    const pick = $("rc-monitor-pick");
    pick.innerHTML = o.monitors.map((m, i) => `<option value="${i}">${esc(monitorLabel(m))} — ${esc(m.prefW)}×${esc(m.prefH)}${m.active ? "" : " (비활성)"}</option>`).join("");
    const firstActive = Math.max(0, o.monitors.findIndex((m) => m.active));
    pick.value = String(firstActive);
    $("rc-monitor-pick-wrap").hidden = o.monitors.length < 2;
    $("rc-auto-err").hidden = true;
    useMonitor(firstActive);
    card.scrollIntoView({ block: "start" });
  }

  function showAutoError(msg) {
    const card = $("rc-auto");
    card.hidden = false;
    $("rc-auto-err").hidden = false;
    $("rc-auto-err").textContent = msg;
    $("rc-auto-info").innerHTML = "";
    $("rc-monitor-pick-wrap").hidden = true;
  }

  function measure() {
    const btn = $("rc-measure");
    const out = $("rc-hz");
    btn.disabled = true;
    out.textContent = "측정 중… (약 2초, 이 창을 가리지 마세요)";
    const intervals = [];
    let last = null;
    const start = performance.now();
    let aborted = false;
    function frame(ts) {
      if (document.hidden) { aborted = true; }
      if (last !== null) intervals.push(ts - last);
      last = ts;
      if (!aborted && ts - start < 2000) { requestAnimationFrame(frame); return; }
      btn.disabled = false;
      if (aborted) { out.textContent = "측정 중 창이 가려져 취소했습니다. 이 창을 앞에 둔 채 다시 시도하세요."; return; }
      const r = refreshFromIntervals(intervals);
      if (!r) { out.textContent = "측정하지 못했습니다. 다시 시도하세요."; return; }
      state.measuredHz = r.hz;
      out.textContent = `약 ${r.hz}Hz (프레임 ${r.samples}개 측정, 일정한 프레임 ${Math.round(r.stable * 100)}%)`;
      if ($("rc-report") && !$("rc-report").hidden) renderReport();
    }
    requestAnimationFrame(frame);
  }

  function applyPasted() {
    const status = $("rc-paste-status");
    const asJson = parseCheckJson($("rc-paste").value);
    if (asJson) { applyPayload(asJson); status.textContent = `점검 파일의 결과를 읽었습니다(모니터 ${asJson.monitors.length}대).`; return; }
    const list = parsePreferred($("rc-paste").value);
    if (!list.length) { status.textContent = "해상도를 읽지 못했습니다. 명령 결과를 그대로 붙여 넣었는지 확인하세요."; return; }
    const first = list[0];
    $("rc-native").value = "custom";
    $("rc-nat-w").value = first.w;
    $("rc-nat-h").value = first.h;
    $("rc-custom").hidden = false;
    const hz = first.maxHz || first.hz;
    if (hz > 0) {
      const sel = $("rc-maxhz");
      const snapped = snapRate(hz);
      let found = false;
      for (const o of sel.options) { if (parseFloat(o.value) === snapped) { sel.value = o.value; found = true; } }
      if (!found) { const o = document.createElement("option"); o.value = String(snapped); o.textContent = `${snapped}Hz`; sel.appendChild(o); sel.value = o.value; }
    }
    state.win = null; state.driverOk = false; state.nativeInModes = false;
    status.textContent = list.length > 1
      ? `모니터 ${list.length}대가 읽혔습니다. 첫 번째(${first.w}×${first.h})를 채웠습니다. 다른 모니터는 해당 창을 그 모니터로 옮긴 뒤 다시 확인하세요.`
      : `최적 해상도 ${first.w}×${first.h}${hz ? `, 최대 ${snapRate(hz)}Hz` : ""}를 채웠습니다.`;
    renderReport();
  }

  // ── 테스트 패턴 ────────────────────────────────────────────────────────
  const stage = () => $("rc-stage");
  const canvas = () => $("rc-canvas");
  let pattern = "grid";

  function paint() {
    const cv = canvas();
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = Math.max(1, Math.round(cv.clientWidth * dpr));
    const H = Math.max(1, Math.round(cv.clientHeight * dpr));
    cv.width = W;
    cv.height = H;
    const ctx = cv.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    if (pattern === "grid") {
      const img = ctx.createImageData(W, H);
      const px = new Uint32Array(img.data.buffer);
      const BLACK = 0xff000000, WHITE = 0xffffffff;
      const third = Math.floor(W / 3);
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          let on;
          if (x < third) on = x % 2; // 세로 1픽셀 줄무늬
          else if (x < third * 2) on = y % 2; // 가로 1픽셀 줄무늬
          else on = (x + y) % 2; // 1픽셀 체커보드
          px[y * W + x] = on ? WHITE : BLACK;
        }
      }
      ctx.putImageData(img, 0, 0);
    } else if (pattern === "text") {
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#000"; ctx.textBaseline = "top";
      let y = 10;
      for (const s of [10, 11, 12, 13, 14, 16, 18, 20, 24]) {
        ctx.font = `${s}px "Malgun Gothic", "Apple SD Gothic Neo", sans-serif`;
        ctx.fillText(`${s}px  가나다라마바사 해상도 선명도 ABC abc 0123456789`, 12, y);
        y += s + 10;
      }
    } else if (pattern === "shape") {
      ctx.fillStyle = "#808080"; ctx.fillRect(0, 0, W, H);
      const r = Math.min(W, H) * 0.3;
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(W * 0.3, H / 2, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeRect(W * 0.7 - r, H / 2 - r, r * 2, r * 2);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, H); ctx.moveTo(W, 0); ctx.lineTo(0, H); ctx.stroke();
      ctx.fillStyle = "#fff"; ctx.font = `${Math.max(12, Math.round(H / 24))}px sans-serif`; ctx.textBaseline = "top";
      ctx.fillText("원이 타원으로, 네모가 직사각형으로 보이면 화면이 늘어난 것입니다", 12, 10);
    } else {
      const bars = [[255, 255, 255], [255, 0, 0], [0, 255, 0], [0, 0, 255]];
      const bh = Math.floor(H / bars.length);
      bars.forEach((c, i) => {
        for (let x = 0; x < W; x++) {
          const t = Math.round((x / Math.max(1, W - 1)) * 255);
          ctx.fillStyle = `rgb(${Math.round((c[0] / 255) * t)},${Math.round((c[1] / 255) * t)},${Math.round((c[2] / 255) * t)})`;
          ctx.fillRect(x, i * bh, 1, bh);
        }
      });
    }
  }

  function setPattern(name) {
    pattern = name;
    document.querySelectorAll("[data-rc-pattern]").forEach((b) => b.setAttribute("aria-pressed", String(b.getAttribute("data-rc-pattern") === name)));
    const hints = {
      grid: "왼쪽은 세로 줄무늬, 가운데는 가로 줄무늬, 오른쪽은 체커보드입니다. 최적 해상도에서는 1픽셀 단위가 또렷하게 구분됩니다. 흐릿한 회색으로 뭉개져 보이면 최적 해상도가 아니거나 배율·확대가 100%가 아닐 수 있습니다.",
      text: "작은 글자가 또렷하게 읽히는지 봅니다. 최적 해상도가 아니면 글자 가장자리가 번져 보입니다.",
      shape: "원과 네모가 찌그러지지 않았는지 봅니다. 늘어나 보이면 화면 비율이 다른 해상도로 출력되고 있거나 모니터의 화면 비율 설정이 늘림으로 되어 있을 수 있습니다.",
      ramp: "회색·빨강·초록·파랑이 부드럽게 이어지는지 봅니다. 띠 모양으로 끊겨 보이면 색 설정이나 케이블·모니터 설정을 확인해 보세요.",
    };
    $("rc-pattern-hint").textContent = hints[name];
    paint();
  }

  function toggleFullscreen() {
    const el = stage();
    if (!document.fullscreenElement) { (el.requestFullscreen || el.webkitRequestFullscreen || function () {}).call(el); }
    else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }

  function init() {
    renderCurrent();
    window.addEventListener("resize", () => { renderCurrent(); paint(); });
    $("rc-measure").addEventListener("click", measure);
    $("rc-compare").addEventListener("click", renderReport);
    $("rc-native").addEventListener("change", () => { $("rc-custom").hidden = $("rc-native").value !== "custom"; });
    $("rc-apply").addEventListener("click", applyPasted);
    $("rc-monitor-pick").addEventListener("change", () => useMonitor(parseInt($("rc-monitor-pick").value, 10) || 0));
    const bat = $("rc-bat-source");
    if (bat) {
      bat.addEventListener("toggle", async () => {
        const pre = $("rc-bat-text");
        if (!bat.open || pre.dataset.loaded) return;
        try {
          const res = await fetch("assets/itsvc-display-check.bat", { cache: "no-store" });
          if (!res.ok) throw new Error();
          pre.textContent = await res.text();
          pre.dataset.loaded = "1";
        } catch (e) { pre.textContent = "내용을 불러오지 못했습니다. 파일을 내려받아 메모장으로 열어 확인할 수 있습니다."; }
      });
    }
    // 점검 파일이 열어 준 주소(#d=...)면 결과를 바로 채운다. 주소 뒤의 값은 읽은 뒤 바로 지운다.
    decodeHashPayload(location.hash).then((json) => {
      if (json === null) return;
      history.replaceState(null, "", location.pathname + location.search);
      const o = parseCheckJson(json);
      if (!o) { showAutoError("점검 파일의 결과를 읽지 못했습니다. 점검 파일을 다시 실행하거나 아래 방법 2·3을 이용하세요."); return; }
      applyPayload(o);
    }).catch((e) => showAutoError(e.message));
    $("rc-copy").addEventListener("click", () => {
      const t = $("rc-cmd").textContent;
      const done = () => { $("rc-copy").textContent = "복사했습니다"; setTimeout(() => ($("rc-copy").textContent = "명령 복사"), 1800); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(done, () => {});
    });
    document.querySelectorAll("[data-rc-pattern]").forEach((b) => b.addEventListener("click", () => setPattern(b.getAttribute("data-rc-pattern"))));
    $("rc-fs").addEventListener("click", toggleFullscreen);
    document.addEventListener("fullscreenchange", paint);
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(paint).observe(stage());
    setPattern("grid");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(typeof window !== "undefined" ? window : globalThis);
