import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const run = promisify(execFile);
const root = join(import.meta.dirname, "..");
const host = process.env.ADMIN_HOST || "127.0.0.1";
const port = Number(process.env.ADMIN_PORT || 8833);
const token = process.env.ADMIN_TOKEN;

if (!token) {
  console.error("ADMIN_TOKEN 환경변수가 필요합니다.");
  process.exit(1);
}

async function git(...args) {
  const result = await run("git", args, { cwd: root, timeout: 30000 });
  return result.stdout.trim();
}

async function countFiles(directory) {
  try { return (await readdir(directory, { withFileTypes: true })).filter((entry) => entry.isFile()).length; }
  catch { return 0; }
}

async function catalog() {
  const games = (await readFile(join(root, "games-data.js"), "utf8")).match(/game:\s*["']([^"']+)/g) || [];
  const uniqueGames = [...new Set(games.map((value) => value.replace(/^game:\s*["']|["']$/g, "")))];
  const inbox = join(root, "data", "inbox");
  return {
    targets: { pcErrors: "PC 오류코드·증상", gameErrors: `게임 오류 (${uniqueGames.length}개 게임)`, windowsUpdates: "Windows 업데이트 이슈" },
    registeredGames: uniqueGames,
    inbox: {
      pcErrors: await countFiles(join(inbox, "pc-errors")),
      gameErrors: await countFiles(join(inbox, "game-errors")),
      windowsUpdates: await countFiles(join(inbox, "windows-updates"))
    },
    rule: "기존 데이터 fingerprint와 일치하는 항목은 저장하지 않습니다."
  };
}

async function json(response, status, value) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

async function body(request) {
  let value = "";
  for await (const chunk of request) value += chunk;
  return JSON.parse(value || "{}");
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${host}:${port}`);
  if (url.pathname === "/" && request.method === "GET") {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(await readFile(join(root, "admin-local.html"), "utf8"));
    return;
  }
  if (request.headers.authorization !== `Bearer ${token}`) return json(response, 401, { error: "인증이 필요합니다." });

  try {
    if (url.pathname === "/api/status" && request.method === "GET") {
      return json(response, 200, { branch: await git("branch", "--show-current"), commit: await git("log", "-1", "--pretty=format:%h %s"), changes: await git("status", "--short") });
    }
    if (url.pathname === "/api/sync" && request.method === "POST") {
      const changes = await git("status", "--porcelain");
      if (changes) return json(response, 409, { error: "로컬 변경사항이 있어 동기화를 중단했습니다.", changes });
      await git("fetch", "origin", "main");
      const before = await git("rev-parse", "HEAD");
      await git("rebase", "origin/main");
      const after = await git("rev-parse", "HEAD");
      return json(response, 200, { message: before === after ? "이미 최신 상태입니다." : "GitHub 최신 내용을 받았습니다.", commit: await git("log", "-1", "--pretty=format:%h %s") });
    }
    if (url.pathname === "/api/check" && request.method === "POST") {
      const required = ["index.html", "sitemap.xml", "robots.txt", "ads.txt", "CNAME"];
      const missing = required.filter((file) => !existsSync(join(root, file)));
      const syntaxFiles = ["app.js", "data.js", "games-data.js", "site.js", "search.js"];
      const syntax = [];
      for (const file of syntaxFiles) {
        try { await run("node", ["--check", file], { cwd: root, timeout: 30000 }); syntax.push(`${file}: 통과`); }
        catch (error) { syntax.push(`${file}: 실패 - ${error.stderr || error.message}`); }
      }
      const diff = await git("diff", "--check");
      return json(response, missing.length || syntax.some((item) => item.includes("실패")) || diff ? 422 : 200, { missing, syntax, diff: diff || "통과" });
    }
    if (url.pathname === "/api/deploy" && request.method === "POST") {
      const input = await body(request);
      if (!/^[\w가-힣 .,:;()\-]{3,100}$/.test(input.message || "")) return json(response, 400, { error: "커밋 메시지를 3~100자의 일반 문장으로 입력하세요." });
      await git("fetch", "origin", "main");
      if (await git("status", "--porcelain")) return json(response, 409, { error: "로컬 변경사항이 있습니다. 먼저 내용을 확인하세요." });
      await git("rebase", "origin/main");
      await git("push", "origin", "main");
      return json(response, 200, { message: "GitHub에 반영했습니다." });
    }
    if (url.pathname === "/api/production" && request.method === "GET") {
      const urls = ["https://itsvc.co.kr/", "https://itsvc.co.kr/sitemap.xml", "https://itsvc.co.kr/ads.txt"];
      const checks = await Promise.all(urls.map(async (target) => ({ url: target, status: (await run("curl", ["-L", "-sS", "-o", "/dev/null", "-w", "%{http_code}", target], { timeout: 30000 })).stdout.trim() })));
      return json(response, 200, checks);
    }
    if (url.pathname === "/api/catalog" && request.method === "GET") return json(response, 200, await catalog());
    if (url.pathname === "/api/prepare-inbox" && request.method === "POST") {
      for (const folder of ["pc-errors", "game-errors", "windows-updates"]) await mkdir(join(root, "data", "inbox", folder), { recursive: true });
      await writeFile(join(root, "data", "inbox", ".gitkeep"), "새 자료는 검토 후 Git에 반영합니다.\n");
      return json(response, 200, { message: "수집 대기 폴더를 준비했습니다.", catalog: await catalog() });
    }
    if (url.pathname === "/api/collect" && request.method === "POST") {
      const input = await body(request);
      if (!["pc-errors", "game-errors", "windows-updates"].includes(input.type)) return json(response, 400, { error: "수집 항목을 선택하세요." });
      const result = await run("node", [join(root, "scripts/collect-sources.mjs"), `--type=${input.type}`], { cwd: root, timeout: 180000 });
      return json(response, 200, JSON.parse(result.stdout));
    }
    return json(response, 404, { error: "경로를 찾을 수 없습니다." });
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
}

createServer(handle).listen(port, host, () => console.log(`ITSVC 관리자: http://${host}:${port}`));
