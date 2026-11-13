// 낡은 내용 점검(읽기 전용). 파일을 고치지 않고 보고만 한다.
//
// 배경(2026-11-12 점검): 지원 종료일이 지난 Windows 버전을 "종료를 앞두고"라고 쓴 문장이
// 한 달 가까이 남아 있었고, 죽은 외부 링크 4개와 오류 코드 목록 누락 3개도 사람이 볼 때까지
// 아무 검사에도 걸리지 않았다. 같은 종류를 매주 찾아 주간 감사 보고에 싣기 위한 스크립트다.
//
//   node scripts/audit-stale-content.mjs            # ① 지난 날짜+미래형 표현 ② 목록 누락
//   node scripts/audit-stale-content.mjs --links    # ③ 외부 링크 응답까지 확인(1~3분)
//
// ①은 후보를 넓게 잡는다. 과거 사실을 서술한 문장이 섞일 수 있으므로 사람이 읽고 판단한다.
import { execFile } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkLinks = process.argv.includes("--links");
const SKIP = new Set(["admin.html", "admin-local.html", "community-cases-admin.html", "404.html"]);
const pages = readdirSync(root).filter((f) => f.endsWith(".html") && !SKIP.has(f)).sort();
const read = (f) => readFileSync(join(root, f), "utf8");

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
const visibleText = (html) => decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, " ").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ");

// ① 이미 지난 날짜를 앞으로 올 일처럼 쓴 문장
const now = new Date();
const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
// "2026년 10월 13일"과 "2026-10-13" 두 표기를 모두 본다. 문장 경계는 마침표 뒤 공백으로 잡는다(날짜 안의 점·하이픈과 구분).
const DATE = /(?:(?!\. ).){0,90}(20\d\d)(?:년\s*|-)(\d{1,2})(?:월\s*|-)(\d{1,2})일?(?:(?!\. ).){0,90}/g;
const FUTURE = /예정|까지 지원|지원됩니다|출시됩니다|종료됩니다|끝납니다|배포될|시작됩니다|앞두고|임박/;
const stale = new Map();
for (const file of pages) {
  const html = read(file);
  // 본문과 검색 결과에 보이는 설명을 함께 본다.
  const meta = [...html.matchAll(/<meta[^>]+(?:name="description"|property="og:description")[^>]+content="([^"]*)"/g)].map((m) => decode(m[1])).join(" . ");
  // 페이지 맨 아래의 검토일 표기는 본문 날짜가 아니므로 뺀다.
  const body = visibleText(html).replace(/최종 검토일:\s*\d{4}-\d{2}-\d{2}/g, ". ");
  for (const m of `${body} . ${meta}`.matchAll(DATE)) {
    const when = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
    const sentence = m[0].trim();
    if (when < today && FUTURE.test(sentence) && !stale.has(sentence)) stale.set(sentence, { file, date: when.toISOString().slice(0, 10) });
  }
}
console.log(`## 지난 날짜를 미래형으로 쓴 문장 후보: ${stale.size}건`);
for (const [sentence, { file, date }] of stale) console.log(`- ${file} (${date}) "${sentence.slice(0, 150)}"`);
if (!stale.size) console.log("없음");

// ② 목록 누락
const indexHtml = read("error-codes-index.html");
const codePages = pages.filter((f) => f.startsWith("error-code-"));
const missingFromIndex = codePages.filter((f) => !indexHtml.includes(`href="${f}"`));
console.log(`\n## 오류 코드 전체 목록(error-codes-index.html)에 없는 오류 코드 페이지: ${missingFromIndex.length}건 (전체 ${codePages.length}개)`);
missingFromIndex.forEach((f) => console.log(`- ${f}`));

const sitemap = read("sitemap.xml");
const missingFromSitemap = pages.filter((f) => {
  const html = read(f);
  if (/<meta[^>]+name="robots"[^>]+noindex/i.test(html) || /http-equiv="refresh"/i.test(html)) return false;
  const loc = f === "index.html" ? "https://itsvc.co.kr/</loc>" : `https://itsvc.co.kr/${f}</loc>`;
  return !sitemap.includes(loc);
});
console.log(`\n## 색인 대상인데 sitemap.xml에 없는 페이지: ${missingFromSitemap.length}건`);
missingFromSitemap.slice(0, 20).forEach((f) => console.log(`- ${f}`));

// ③ 외부 링크
if (!checkLinks) {
  console.log("\n## 외부 링크: 확인하지 않음(--links를 붙이면 확인)");
} else {
  const sources = new Map();
  for (const file of pages) {
    const html = read(file).replace(/<script[\s\S]*?<\/script>/g, "");
    for (const m of html.matchAll(/<a[^>]+href="(https?:\/\/[^"#]+)/g)) {
      const url = decode(m[1]);
      if (/itsvc\.co\.kr|coupang\.com/.test(url)) continue;
      if (!sources.has(url)) sources.set(url, file);
    }
  }
  const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
  // curl을 쓰는 이유: 클라우드 실행 환경의 프록시 설정을 그대로 따른다.
  const probe = (url) => new Promise((resolve) => {
    execFile("curl", ["-s", "-o", "/dev/null", "-L", "--max-redirs", "6", "-m", "20", "-A", UA, "-w", "%{http_code}", url], { timeout: 30000 }, (error, stdout) => {
      // curl 종료 코드 6은 도메인 자체가 조회되지 않는 경우다(프록시 차단은 56이라 여기에 걸리지 않는다).
      if (error && error.code === 6) return resolve("NXDOMAIN");
      resolve(String(stdout || "").trim() || "000");
    });
  });
  const urls = [...sources.keys()];
  const results = new Array(urls.length);
  let next = 0;
  await Promise.all(Array.from({ length: 12 }, async () => {
    while (next < urls.length) { const i = next++; results[i] = await probe(urls[i]); }
  }));
  const gone = urls.filter((u, i) => ["404", "410", "NXDOMAIN"].includes(results[i]));
  const ok = results.filter((c) => c === "200").length;
  console.log(`\n## 외부 링크 ${urls.length}개: 정상 ${ok}개, 없어짐(404·410·도메인 없음) ${gone.length}개, 판단 불가 ${urls.length - ok - gone.length}개`);
  gone.forEach((u) => console.log(`- [${results[urls.indexOf(u)]}] ${sources.get(u)} → ${u.slice(0, 140)}`));
  console.log("판단 불가는 로그인 필요·자동 접속 차단·실행 환경에서 막힌 도메인이라 죽었다는 뜻이 아니다. 없어짐만 보고 대상이다.");
}
