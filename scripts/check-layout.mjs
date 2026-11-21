#!/usr/bin/env node
// 모바일(375px) 화면 깨짐 점검. 실제 Chrome으로 페이지를 열어 다음을 잰다.
//   overflow  : 가로 스크롤이 생기는가(문서 폭 > 뷰포트)
//   stray     : <main> 바로 아래에 본문 밖으로 떠 있는 제목·표·목록·그림이 있는가
//   squeezed  : 글자가 좁은 폭에 눌려 세로로 쌓이는 요소(예: 그리드 열에 갇힌 안내 문구)
//   image     : 불러오지 못한 이미지
// 11/22에 사람이 손으로 578페이지를 열어 찾던 문제(본문 밖에 뜬 캡처 구간, 번호 열에 눌린 안내 문구)를
// 푸시 전에 기계로 잡기 위한 스크립트다. 외부 패키지 없이 Node 22의 WebSocket과 Chrome DevTools Protocol만 쓴다.
//
// 사용법
//   node scripts/check-layout.mjs --all                 전체 HTML(루트·en/), 약 3~4분
//   node scripts/check-layout.mjs --staged              커밋 대기 중인 HTML만(훅용)
//   node scripts/check-layout.mjs --base=origin/main    기준 브랜치 대비 바뀐 HTML만
//   node scripts/check-layout.mjs a.html en/b.html      지정한 페이지만
//   옵션: --width=375  --concurrency=6  --max=40  --require(Chrome이 없으면 실패. 기본은 건너뜀)
//   --staged·--base 로 고른 페이지가 --max(기본 40)개를 넘으면(공용 자산 토큰을 올려 모든 HTML이 바뀐 커밋 등)
//   페이지 종류가 고르게 섞이도록 간격을 두고 표본만 점검한다. 전부 보려면 --all 을 쓴다.
//   Chrome 경로는 CHROME_BIN 환경변수로 지정할 수 있다.
//
// style.css·app.js 같은 공용 자산을 바꿨을 때는 --all 로 돌려야 한다(바뀐 HTML만으로는 영향 범위를 알 수 없다).
// 예외로 둘 페이지는 scripts/lib/layout-allowlist.json 에 { "페이지.html": ["overflow", ...] } 로 적는다.
import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import os from "node:os";
import { spawn, execSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const opt = (name, def) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split("=").slice(1).join("=") : def;
};
const flag = (name) => args.includes(`--${name}`);
const WIDTH = Number(opt("width", 375));
const CONCURRENCY = Number(opt("concurrency", 6));
const positional = args.filter((a) => !a.startsWith("--"));

const allowlist = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(root, "scripts/lib/layout-allowlist.json"), "utf8")); } catch { return {}; }
})();

// ---- 대상 페이지 ----
const listAll = () => {
  const out = [];
  for (const dir of ["", "en"]) {
    const abs = path.join(root, dir);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs)) if (f.endsWith(".html")) out.push(path.posix.join(dir, f));
  }
  return out;
};
const sh = (cmd) => execSync(cmd, { cwd: root, encoding: "utf8" }).split("\n").map((s) => s.trim()).filter(Boolean);
let pages;
if (positional.length) pages = positional;
else if (flag("staged")) pages = sh("git diff --cached --name-only --diff-filter=ACMR").filter((f) => /^(en\/)?[^/]+\.html$/.test(f));
else if (opt("base", "")) pages = sh(`git diff --name-only --diff-filter=ACMR ${opt("base")}...HEAD`).filter((f) => /^(en\/)?[^/]+\.html$/.test(f));
else if (flag("all")) pages = listAll();
else {
  console.error("대상이 없습니다. --all, --staged, --base=<브랜치> 또는 페이지 경로를 지정하세요.");
  process.exit(2);
}
pages = pages.filter((p) => fs.existsSync(path.join(root, p)) && !/^admin-local\.html$/.test(p));
const MAX = Number(opt("max", 40));
let sampled = false;
if (!flag("all") && !positional.length && pages.length > MAX) {
  const sorted = [...pages].sort();
  pages = Array.from({ length: MAX }, (_, i) => sorted[Math.floor((i * sorted.length) / MAX)]);
  sampled = true;
}
if (!pages.length) { console.log("✓ 화면 깨짐 점검: 대상 HTML 없음(건너뜀)"); process.exit(0); }

// ---- Chrome 찾기 ----
const chromeCandidates = [
  process.env.CHROME_BIN,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium", "/usr/bin/chromium-browser",
].filter(Boolean);
const chromeBin = chromeCandidates.find((p) => fs.existsSync(p));
if (!chromeBin) {
  const msg = "Chrome을 찾지 못했습니다(CHROME_BIN으로 경로를 지정할 수 있습니다).";
  if (flag("require")) { console.error(`❌ ${msg}`); process.exit(1); }
  console.log(`⚠ 화면 깨짐 점검 건너뜀: ${msg}`);
  process.exit(0);
}

// ---- 정적 서버 ----
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
  ".ico": "image/x-icon", ".woff2": "font/woff2", ".woff": "font/woff", ".xml": "application/xml", ".txt": "text/plain; charset=utf-8",
};
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const abs = path.join(root, p);
  if (!abs.startsWith(root) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) { res.writeHead(404); res.end("not found"); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(abs)] || "application/octet-stream" });
  fs.createReadStream(abs).pipe(res);
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const origin = `http://127.0.0.1:${server.address().port}`;

// ---- Chrome 실행·DevTools 연결 ----
const userDir = fs.mkdtempSync(path.join(os.tmpdir(), "layout-check-"));
const chrome = spawn(chromeBin, [
  "--headless=new", "--remote-debugging-port=0", `--user-data-dir=${userDir}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--disable-extensions", "--hide-scrollbars", "--mute-audio", "about:blank",
], { stdio: ["ignore", "ignore", "pipe"] });
const wsUrl = await new Promise((resolve, reject) => {
  let buf = "";
  const t = setTimeout(() => reject(new Error("Chrome 시작 시간 초과")), 20000);
  chrome.stderr.on("data", (d) => {
    buf += d.toString();
    const m = buf.match(/DevTools listening on (ws:\/\/\S+)/);
    if (m) { clearTimeout(t); resolve(m[1]); }
  });
  chrome.on("exit", () => reject(new Error("Chrome이 바로 종료됐습니다")));
});
const cleanup = () => { try { chrome.kill(); } catch {} try { server.close(); } catch {} try { fs.rmSync(userDir, { recursive: true, force: true }); } catch {} };
process.on("exit", cleanup);

const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let nextId = 1;
const pending = new Map();
const listeners = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
  } else if (msg.method) listeners.forEach((l) => l(msg));
};
const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
});

// ---- 페이지 안에서 실행할 점검 ----
const PAGE_CHECK = `(() => {
  const W = ${WIDTH};
  const out = { overflow: null, stray: [], squeezed: [], image: [] };
  const de = document.documentElement;
  const widest = Math.max(de.scrollWidth, document.body ? document.body.scrollWidth : 0);
  if (widest > W + 1) {
    const wide = [];
    for (const e of document.body.querySelectorAll("*")) {
      const cs = getComputedStyle(e);
      if (cs.position === "fixed" || cs.display === "none") continue;
      const r = e.getBoundingClientRect();
      if (r.width && r.right > W + 1) {
        // 가로 스크롤 가능한 부모 안에 있으면(표 래퍼 등) 페이지 폭에는 영향이 없다.
        let p = e.parentElement, clipped = false;
        while (p && p !== document.body) {
          const o = getComputedStyle(p).overflowX;
          if (o === "auto" || o === "scroll" || o === "hidden" || o === "clip") { clipped = true; break; }
          p = p.parentElement;
        }
        if (!clipped) wide.push(e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\\s+/)[0] : ""));
      }
      if (wide.length >= 3) break;
    }
    if (wide.length || widest > W + 1) out.overflow = { scrollWidth: widest, elements: wide };
    // 전부 잘려 있어 페이지 폭에는 영향이 없다면 문서 폭만 같은 값인지 한 번 더 확인
    if (out.overflow && !wide.length && de.scrollWidth <= W + 1) out.overflow = null;
  }
  const main = document.querySelector("main");
  if (main) {
    const ok = new Set(["DIV", "SECTION", "ARTICLE", "NAV", "ASIDE", "HEADER", "FOOTER", "FORM", "SCRIPT", "STYLE", "TEMPLATE", "NOSCRIPT", "DETAILS"]);
    for (const c of main.children) {
      if (ok.has(c.tagName)) continue;
      if (c.tagName === "P" && c.classList.contains("muted") && /최종 검토일/.test(c.textContent)) continue;
      out.stray.push(c.tagName.toLowerCase() + ": " + c.textContent.trim().slice(0, 30));
    }
  }
  const seen = new Set();
  for (const e of document.body.querySelectorAll("*")) {
    if (["SCRIPT", "STYLE", "SVG", "PATH"].includes(e.tagName.toUpperCase())) continue;
    const own = [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").replace(/\\s+/g, " ").trim();
    if (own.length < 14) continue;
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(e);
    if (cs.visibility === "hidden" || cs.writingMode !== "horizontal-tb") continue;
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.5 || 20;
    // 글자 수에 비해 폭이 지나치게 좁고(80px 미만) 줄 수가 많은(한 줄당 4자 이하) 경우
    const lines = r.height / lh;
    if (r.width < 80 && lines >= 5 && own.length / lines <= 4) {
      const key = e.tagName + e.className;
      if (seen.has(key)) continue;
      seen.add(key);
      out.squeezed.push(e.tagName.toLowerCase() + (e.className && typeof e.className === "string" ? "." + e.className.trim().split(/\\s+/)[0] : "") + " " + Math.round(r.width) + "px: " + own.slice(0, 24));
      if (out.squeezed.length >= 3) break;
    }
  }
  for (const i of document.images) {
    if (i.complete && i.naturalWidth === 0 && (i.currentSrc || i.getAttribute("src"))) out.image.push(i.getAttribute("src"));
  }
  out.image = out.image.slice(0, 3);
  return out;
})()`;

const BLOCK = ["*googlesyndication.com*", "*doubleclick.net*", "*googletagmanager.com*", "*google-analytics.com*", "*googleadservices.com*", "*adtrafficquality.google*"];
const results = [];
const queue = [...pages];

const worker = async () => {
  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Page.enable", {}, sessionId);
  await send("Network.enable", {}, sessionId);
  await send("Network.setBlockedURLs", { urls: BLOCK }, sessionId);
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 812, deviceScaleFactor: 1, mobile: true }, sessionId);
  while (queue.length) {
    const page = queue.shift();
    const errors = [];
    const l = (msg) => {
      if (msg.sessionId !== sessionId) return;
      if (msg.method === "Runtime.exceptionThrown") errors.push(msg.params.exceptionDetails.exception?.description?.split("\n")[0] || msg.params.exceptionDetails.text);
    };
    listeners.push(l);
    try {
      await send("Runtime.enable", {}, sessionId);
      const loaded = new Promise((resolve) => {
        const h = (msg) => { if (msg.sessionId === sessionId && msg.method === "Page.loadEventFired") { listeners.splice(listeners.indexOf(h), 1); resolve(); } };
        listeners.push(h);
        setTimeout(resolve, 15000);
      });
      await send("Page.navigate", { url: `${origin}/${page}` }, sessionId);
      await loaded;
      await new Promise((r) => setTimeout(r, 1500));
      const { result } = await send("Runtime.evaluate", { expression: PAGE_CHECK, returnByValue: true }, sessionId);
      results.push({ page, ...result.value, errors });
    } catch (e) {
      results.push({ page, fatal: String(e.message || e) });
    }
    listeners.splice(listeners.indexOf(l), 1);
  }
  await send("Target.closeTarget", { targetId });
};

const started = Date.now();
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pages.length) }, worker));

// ---- 결과 ----
let bad = 0;
const lines = [];
for (const r of results.sort((a, b) => a.page.localeCompare(b.page))) {
  const skip = new Set(allowlist[r.page] || []);
  const found = [];
  if (r.fatal) found.push(`열기 실패: ${r.fatal}`);
  if (r.overflow && !skip.has("overflow")) found.push(`가로 스크롤(문서 폭 ${r.overflow.scrollWidth}px > ${WIDTH}px): ${r.overflow.elements.join(", ") || "원인 요소 불명"}`);
  if (r.stray?.length && !skip.has("stray")) found.push(`본문 밖에 뜬 요소: ${r.stray.join(" | ")}`);
  if (r.squeezed?.length && !skip.has("squeezed")) found.push(`눌려서 세로로 쌓인 글자: ${r.squeezed.join(" | ")}`);
  if (r.image?.length && !skip.has("image")) found.push(`불러오지 못한 이미지: ${r.image.join(", ")}`);
  if (found.length) { bad++; lines.push(`  ✗ ${r.page}\n${found.map((f) => `      - ${f}`).join("\n")}`); }
}
const secs = Math.round((Date.now() - started) / 1000);
cleanup();
if (bad) {
  console.error(`❌ 화면 깨짐 점검: ${results.length}페이지 중 ${bad}페이지에서 문제 발견 (폭 ${WIDTH}px, ${secs}초)`);
  console.error(lines.join("\n"));
  console.error("\n의도한 예외라면 scripts/lib/layout-allowlist.json 에 { \"페이지.html\": [\"overflow\"|\"stray\"|\"squeezed\"|\"image\"] } 로 적으세요.");
  process.exit(1);
}
console.log(`✓ 화면 깨짐 점검: 정상 (검사한 페이지 ${results.length}개${sampled ? " — 표본, 전체는 --all" : ""}, 폭 ${WIDTH}px, ${secs}초)`);
process.exit(0);
