import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = {};
vm.createContext(context);
const dataSrc = fs.readFileSync(path.join(root, "data.js"), "utf8")
  .replace("window.SITE_DATA = ", "globalThis.SITE_DATA = ");
vm.runInContext(dataSrc, context);
const data = context.SITE_DATA;

const escapeAttr = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll('"', "&quot;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

const shell = (entry) => {
  const fileName = entry.detailPage;
  const code = entry.code;
  const heading = `${code} · ${entry.title}`;
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeAttr(heading)} | PC 윈도우 진단 센터</title>
  <meta name="description" content="${escapeAttr(`${code} — ${entry.summary}`)}">
  <meta name="author" content="아이티에스">
  <link rel="canonical" href="${data.siteUrl}/${fileName}">
  <meta property="og:title" content="${escapeAttr(heading)} | PC 윈도우 진단 센터">
  <meta property="og:description" content="${escapeAttr(entry.summary)}">
  <link rel="stylesheet" href="style.css?v=mdtab-center-20261002">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9907102461716567" crossorigin="anonymous"></script>
</head>
<body>
  <a class="skip-link" href="#content">본문 바로가기</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="index.html" aria-label="홈으로 이동">PC</a><div><p class="eyebrow">에러 코드</p><h1>${escapeAttr(code)}</h1></div></div>
    <nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html" aria-current="page">가이드</a></nav>
  </header>
  <main id="content" class="page article">
    <section class="section" data-error-code-page="${escapeAttr(code)}"></section>
  </main>
  <footer class="site-footer">
    <p>© <span data-year></span> PC 윈도우 진단 센터</p>
    <p class="footer-links"><a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a></p>
  </footer>
  <script defer src="data.js?v=error-codes-20261013"></script>
  <script defer src="app.js?v=nav-evlog-20261026"></script>
  <script defer src="search-index.js?v=error-codes-20261013"></script>
  <script defer src="search.js"></script>
</body>
</html>
`;
};

let created = 0;
for (const entry of data.errorCodes) {
  const fileName = entry.detailPage;
  if (!fileName || !fileName.startsWith("error-code-")) continue;
  const filePath = path.join(root, fileName);
  if (fs.existsSync(filePath)) continue;
  fs.writeFileSync(filePath, shell(entry));
  created++;
  console.log(`✓ 생성: ${fileName}`);
}

console.log(`\n완료: ${created}개 파일 생성됨 (본문은 generate-static-fallbacks.mjs가 data.js에서 채웁니다)`);
