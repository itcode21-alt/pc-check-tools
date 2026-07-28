import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";
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
    return json(response, 404, { error: "경로를 찾을 수 없습니다." });
  } catch (error) {
    return json(response, 500, { error: error.message });
  }
}

createServer(handle).listen(port, host, () => console.log(`ITSVC 관리자: http://${host}:${port}`));
