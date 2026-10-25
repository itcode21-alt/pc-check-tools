// 정보 수준 이벤트 79건의 그룹 상세 페이지(event-info-*.html)를 만들고,
// data.js의 해당 항목 detailPage를 그룹 페이지로 연결한다(이미 연결돼 있으면 건드리지 않음).
//
//   node scripts/generate-event-group-pages.mjs
//   node scripts/split-data.mjs && node scripts/build-search-index.mjs   # 이어서 파생 파일 갱신
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { groups } from "./event-group-content.mjs";

const root = path.resolve(import.meta.dirname, "..");
const SITE = "https://itsvc.co.kr";
const today = new Date().toISOString().slice(0, 10);

const referenceHtml = fs.readFileSync(path.join(root, "index.html"), "utf8");
const assetRef = (asset) => {
  const m = referenceHtml.match(new RegExp(`="(${asset.replace(".", "\\.")}(?:\\?v=[a-zA-Z0-9-]+)?)"`));
  return m ? m[1] : asset;
};
const STYLE = assetRef("style.css");
const SITE_JS = assetRef("site.js");
const SEARCH_INDEX = assetRef("search-index.js");

const esc = (v) => String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

const dataPath = path.join(root, "data.js");
let dataSrc = fs.readFileSync(dataPath, "utf8");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(dataSrc.replace("window.SITE_DATA = ", "globalThis.SITE_DATA = "), ctx);
const events = ctx.SITE_DATA.eventViewerCodes;
const byKey = new Map(events.map((e) => [`${e.source} ${e.id}`, e]));

// 모든 멤버가 data.js에 있고 한 그룹에만 속하는지 확인한다.
const seen = new Map();
for (const g of groups) {
  for (const key of g.members) {
    if (!byKey.has(key)) throw new Error(`data.js에 없는 항목: ${key} (${g.file})`);
    if (seen.has(key)) throw new Error(`두 그룹에 중복: ${key}`);
    seen.set(key, g.file);
  }
  for (const rel of g.related) if (!fs.existsSync(path.join(root, rel))) throw new Error(`없는 관련 페이지: ${rel} (${g.file})`);
}

const shortSource = (s) => s.replace(/^Microsoft-Windows-/, "");
const firstSentence = (text) => text;

function renderGroup(g) {
  const url = `${SITE}/${g.file}`;
  const rows = g.members.map((key) => {
    const e = byKey.get(key);
    const check = (e.checks && e.checks[0]) || "";
    return `            <tr><th scope="row">${esc(shortSource(e.source))} ${esc(e.id)}</th><td>${esc(firstSentence(e.summary))}</td><td>${esc(check)}</td></tr>`;
  }).join("\n");
  const siblings = groups.filter((x) => x.file !== g.file);

  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: g.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  const articleSchema = { "@context": "https://schema.org", "@type": "TechArticle", headline: g.title, description: g.desc, url, mainEntityOfPage: url, inLanguage: "ko-KR", dateModified: today,
    author: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: `${SITE}/about.html` }, publisher: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: `${SITE}/` } };
  const crumbSchema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
    { "@type": "ListItem", position: 1, name: "홈", item: `${SITE}/` },
    { "@type": "ListItem", position: 2, name: "가이드", item: `${SITE}/guides.html` },
    { "@type": "ListItem", position: 3, name: g.title, item: url } ] };

  return `<!doctype html>
<html lang="ko">
<head><script async src="https://www.googletagmanager.com/gtag/js?id=G-EQK19KNQR6"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-EQK19KNQR6');</script>
  <meta charset="utf-8">
  <link rel="icon" href="favicon.ico" sizes="32x32"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="apple-touch-icon" href="assets/apple-touch-icon.png"><link rel="manifest" href="manifest.json">
  <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#1f2937">
  <title>${esc(g.title)}</title>
  <meta name="description" content="${esc(g.desc)}">
  <meta name="author" content="아이티에스">
  <link rel="canonical" href="${url}">
  <script type="application/ld+json">${JSON.stringify(articleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(crumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <meta property="og:title" content="${esc(g.title)}">
  <meta property="og:description" content="${esc(g.desc)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="${SITE}/assets/pc-check-hero.jpg">
  <meta property="og:image:alt" content="PC 상태를 점검하는 진단 화면 일러스트">
  <link rel="stylesheet" href="${STYLE}">
</head>
<body>
  <a class="skip-link" href="#content">본문 바로가기</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="./" aria-label="홈으로 이동">PC</a><div><p class="eyebrow">${esc(g.eyebrow)}</p><h1>정보 수준 이벤트 정리</h1></div></div>
    <nav class="nav" aria-label="주요 메뉴"><a href="./">홈</a><a href="diagnostic.html">진단</a><a href="guides.html" aria-current="page">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>
    <div class="site-search" data-site-search>
      <input type="search" class="site-search-input" placeholder="증상, 오류코드, 게임 오류 검색" aria-label="사이트 검색" data-site-search-input autocomplete="off">
      <div class="site-search-results" data-site-search-results hidden></div>
    </div>
  </header>
<nav class="breadcrumb" aria-label="현재 위치"><div class="breadcrumb-inner"><a href="./">홈</a><span class="bc-sep" aria-hidden="true">/</span><a href="guides.html">가이드</a><span class="bc-sep" aria-hidden="true">/</span><a href="event-codes-index.html">전체 이벤트 코드 목록</a><span class="bc-sep" aria-hidden="true">/</span><span aria-current="page">${esc(g.short)}</span></div></nav>
  <main id="content" class="page article article-cols">
    <div class="toc" id="page-toc">
      <h4>📑 목차</h4>
      <ul id="toc-list"><!-- ui-init.js가 동적으로 채움 --></ul>
      <div class="toc-progress">
        <div class="toc-progress-bar">
          <div class="toc-progress-fill"></div>
        </div>
      </div>
    </div>
    <article class="section">
      <p class="eyebrow">정보(INFORMATION) 수준 이벤트 ${g.members.length}건</p>
      <h2>${esc(g.title)}</h2>
      <p class="lead">${esc(g.lead)}</p>
${g.intro.map((p) => `      <p>${esc(p)}</p>`).join("\n")}
      <h3>이 페이지에서 설명하는 기록</h3>
      <div class="table-wrap" style="overflow-x:auto">
        <table>
          <thead><tr><th scope="col">원본·ID</th><th scope="col">의미</th><th scope="col">확인할 때</th></tr></thead>
          <tbody>
${rows}
          </tbody>
        </table>
      </div>
      <h3>걱정해야 하는 때</h3>
      <ul class="mini-list">
${g.judge.map((j) => `          <li>${esc(j)}</li>`).join("\n")}
      </ul>
      <div class="callout"><strong>주의사항</strong>
<p>정보 수준 기록 하나만으로 부품 고장이나 보안 사고를 판단하지 마세요. 같은 시각의 오류·경고 기록과 실제 증상(끊김, 재부팅, 느려짐)이 함께 있을 때만 단서로 씁니다.</p></div>
      <h3>함께 볼 만한 기록·가이드</h3>
      <div class="link-list">${g.related.map((f) => `<a href="${f}">${esc(labelOf(f))}</a>`).join("")}<a href="event-viewer-guide.html">이벤트 뷰어 확인 가이드</a><a href="event-log-analyzer.html">이벤트 로그 해석기</a></div>
      <h3>자주 묻는 질문</h3>
      <ul class="mini-list">
${g.faqs.map(([q, a]) => `          <li><strong>${esc(q)}</strong> ${esc(a)}</li>`).join("\n")}
      </ul>
      <p class="muted">이 페이지는 이벤트 뷰어에서 실제로 확인되는 정보 수준 기록을 기준으로 정리했으며, 개별 항목마다 Microsoft의 공식 설명 문서가 있는 것은 아닙니다. 최종 검토일: ${today}</p>
      <p><a href="diagnostic.html#diagnostic-event">이벤트 뷰어 진단 도구에서 확인하기</a></p>
    </article>
    <div class="sidebar" id="page-sidebar">
      <h4>🔗 다른 정보 기록 묶음</h4>
      <ul>
${siblings.map((s) => `        <li><a href="${s.file}">${esc(s.short)}</a></li>`).join("\n")}
      </ul>
      <h4>📅 관련 가이드</h4>
      <ul>
        <li><a href="event-viewer-guide.html">이벤트 뷰어 가이드</a></li>
        <li><a href="event-codes-index.html">전체 이벤트 코드 목록</a></li>
        <li><a href="event-log-analyzer.html">이벤트 로그 해석기</a></li>
      </ul>
    </div>
  </main>
  <footer class="site-footer">
    <p>© <span data-year></span> PC 윈도우 진단 센터</p>
    <p class="footer-links"><a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a> · <a href="games-diagnostic.html">게임</a> · <a href="nas-diagnostic.html">NAS</a> · <a href="community-cases.html">해결 사례</a> · <a href="contact.html">문의</a> · <a href="https://blog.naver.com/itcode21" target="_blank" rel="noopener">블로그</a></p>
  </footer>
  <script defer src="${SITE_JS}"></script>
  <script defer src="${SEARCH_INDEX}"></script>
  <script defer src="ui-init.js"></script>
  <script defer src="search-core.js"></script>
  <script defer src="search.js"></script>
</body>
</html>
`;
}

function labelOf(file) {
  const m = file.match(/^event-(.+)\.html$/);
  const hit = events.find((e) => e.detailPage === file);
  if (hit) return `${shortSource(hit.source)} ${hit.id}`;
  return file.replace(/\.html$/, "");
}

for (const g of groups) fs.writeFileSync(path.join(root, g.file), renderGroup(g));

// ── data.js: 그룹 멤버의 detailPage를 그룹 페이지로 연결 ──
let changed = 0;
for (const [key, file] of seen) {
  const e = byKey.get(key);
  const idStart = dataSrc.indexOf(`id: "${e.id}", source: "${e.source}"`);
  if (idStart < 0) throw new Error(`data.js에서 위치를 못 찾음: ${key}`);
  const blockEnd = dataSrc.indexOf("\n    }", idStart);
  let block = dataSrc.slice(idStart, blockEnd);
  const orig = block;
  if (/detailPage: "[^"]*"/.test(block)) {
    block = block.replace(/detailPage: "[^"]*"/, `detailPage: "${file}"`);
  } else {
    block = block.replace(/(relatedCodes: \[[^\]]*\], relatedGuides: \[[^\]]*\])/, `$1, detailPage: "${file}"`);
  }
  if (block === orig && !block.includes(`detailPage: "${file}"`)) throw new Error(`detailPage를 넣지 못함: ${key}`);
  if (block !== orig) { dataSrc = dataSrc.slice(0, idStart) + block + dataSrc.slice(blockEnd); changed++; }
}
fs.writeFileSync(dataPath, dataSrc);
console.log(`그룹 페이지 ${groups.length}개 생성, 연결한 이벤트 ${seen.size}건 (data.js 수정 ${changed}건)`);
