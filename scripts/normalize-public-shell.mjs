import fs from "node:fs";

const files = fs.readdirSync(".").filter((file) => file.endsWith(".html") && !/^(admin|404)\b/.test(file));
const searchMarkup = `    <div class="site-search" data-site-search>\n      <input type="search" class="site-search-input" placeholder="증상, 오류코드, 게임 오류 검색" aria-label="사이트 검색" data-site-search-input autocomplete="off">\n      <div class="site-search-results" data-site-search-results hidden></div>\n    </div>`;
const footerLinks = [
  ["about.html", "소개"],
  ["editorial-policy.html", "작성 기준"],
  ["privacy.html", "개인정보처리방침"],
  ["terms.html", "이용약관"],
  ["contact.html", "문의"],
];

let changed = 0;
for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const original = html;

  if (html.includes("<header") && !html.includes("data-site-search")) {
    html = html.replace("</header>", `${searchMarkup}\n  </header>`);
  }

  if (html.includes("data-site-search") && !html.includes("search-index.js")) {
    html = html.replace("</body>", `  <script defer src="search-index.js"></script><script defer src="search.js"></script>\n</body>`);
  }

  const footer = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (footer) {
    let updatedFooter = footer[0];
    const missing = footerLinks.filter(([href]) => !updatedFooter.includes(`href="${href}"`));
    if (missing.length) {
      const additions = missing.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" · ");
      if (updatedFooter.includes("class=\"footer-links\"")) {
        updatedFooter = updatedFooter.replace(/(<p\s+class="footer-links"[^>]*>)[\s\S]*?(<\/p>)/i, `$1${additions}$2`);
      } else {
        updatedFooter = updatedFooter.replace("</footer>", `<p class="footer-links">${additions}</p></footer>`);
      }
      html = html.replace(footer[0], updatedFooter);
    }
  }

  if (html !== original) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

console.log(`공개 페이지 공통 셸을 정리한 파일: ${changed}개`);
