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

  // 결과 항목 목록. tone: ok | warn | info
  function buildReport(input) {
    const items = [];
    const { cur, nat, dpr, measuredHz, maxHz } = input;
    const scale = scalePercent(dpr);

    if (!isStandardScale(dpr)) {
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
      const curText = `${cur.w}×${cur.h}`;
      const natText = `${nat.w}×${nat.h}`;
      const rotNote = r.rotated ? ["모니터를 세로로 돌려 쓰는 것으로 보고 가로·세로를 바꿔 비교했습니다."] : [];
      const fixSteps = [
        "설정 > 시스템 > 디스플레이에서 이 모니터를 고른 뒤 '디스플레이 해상도' 목록에서 '(권장)'이 붙은 값을 선택합니다. 권장 값이 모니터 최적 해상도와 같다면 그대로 두면 됩니다.",
        "'(권장)' 목록에 최적 해상도가 없거나 해상도가 저절로 바뀐다면 그래픽 드라이버가 문제일 수 있습니다. 설정 > Windows 업데이트 > 업데이트 확인으로 드라이버 업데이트를 받아 보세요(Microsoft 안내).",
        "그래도 없다면 케이블·포트·모니터 입력 설정을 점검하세요(문서 외 일반 점검): 다른 케이블이나 다른 포트(HDMI↔DisplayPort)로 바꿔 보고, 데스크톱은 케이블이 메인보드가 아니라 그래픽카드 포트에 꽂혀 있는지 확인합니다.",
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
    } else {
      items.push({
        tone: "info",
        title: "모니터의 최적 해상도를 알려 주세요",
        body: [
          "브라우저는 모니터의 최적 해상도를 읽을 수 없어서 비교하려면 값이 필요합니다. 설정 > 시스템 > 디스플레이의 '디스플레이 해상도' 목록에서 '(권장)'이 붙은 값을 고르거나, 아래 PowerShell 명령의 결과를 붙여 넣으면 자동으로 채워집니다.",
        ],
      });
    }

    const v = refreshVerdict(measuredHz, maxHz);
    if (v.kind === "ok") {
      items.push({
        tone: "ok",
        title: `측정 주사율(약 ${measuredHz}Hz)이 모니터 최대(${maxHz}Hz)에 가깝습니다`,
        body: ["브라우저에서 잰 근사값이라 오차가 있을 수 있습니다. Windows의 설정 > 시스템 > 디스플레이 > 고급 디스플레이 '디스플레이 정보'에서 현재 해상도와 주사율을 함께 볼 수 있습니다."],
      });
    } else if (v.kind === "low") {
      items.push({
        tone: "warn",
        title: `측정 주사율(약 ${measuredHz}Hz)이 모니터 최대(${maxHz}Hz)보다 낮습니다`,
        body: [
          "브라우저 측정은 근사값입니다. 이 페이지가 다른 창에 가려졌거나 노트북이 절전·배터리 상태였거나, Windows 11의 '동적 주사율(DRR)'이 켜져 있으면 낮게 나올 수 있습니다(DRR은 120Hz 이상이면서 가변 주사율(VRR)을 지원하는 화면에서 상황에 따라 주사율을 자동으로 조절합니다). 위 조건을 정리한 뒤 다시 측정해 보세요.",
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
        title: `측정 주사율은 약 ${measuredHz}Hz입니다`,
        body: ["모니터의 최대 주사율을 선택하면 비교해 드립니다. 모니터 사양서나 PowerShell 결과에서 확인할 수 있습니다."],
      });
    }
    return items;
  }

  const api = { physicalSize, scalePercent, isStandardScale, classifyResolution, snapRate, median, refreshFromIntervals, refreshVerdict, parsePreferred, buildReport, COMMON_RATES };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.ITSVC_RES = api;

  // ── 화면(브라우저에서만) ─────────────────────────────────────────────────
  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const state = { measuredHz: 0 };

  function readCurrent() {
    const dpr = window.devicePixelRatio || 1;
    const sw = (window.screen && window.screen.width) || 0;
    const sh = (window.screen && window.screen.height) || 0;
    return { dpr, sw, sh, cur: physicalSize(sw, sh, dpr) };
  }

  function renderCurrent() {
    const c = readCurrent();
    $("rc-cur-res").textContent = c.cur.w && c.cur.h ? `${c.cur.w} × ${c.cur.h}` : "알 수 없음";
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
    const items = buildReport({ cur: c.cur, nat: selectedNative(), dpr: c.dpr, measuredHz: state.measuredHz, maxHz: selectedMaxHz() });
    const box = $("rc-report");
    box.hidden = false;
    box.innerHTML =
      "<h3>점검 결과</h3>" +
      items
        .map((it) => {
          const body = (it.body || []).map((p) => `<p>${esc(p)}</p>`).join("");
          const steps = it.steps && it.steps.length ? `<ol class="mini-list">${it.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>` : "";
          return `<div class="rc-item rc-${it.tone}"><h4>${esc(it.title)}</h4>${body}${steps}</div>`;
        })
        .join("");
    try {
      if (typeof gtag === "function") gtag("event", "res_check_compare", { has_native: selectedNative() ? 1 : 0, has_hz: state.measuredHz ? 1 : 0 });
    } catch (e) { /* 측정 실패는 무시 */ }
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
    const list = parsePreferred($("rc-paste").value);
    const status = $("rc-paste-status");
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
