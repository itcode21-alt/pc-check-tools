import fs from "node:fs";

const files = fs.readdirSync(".").filter((file) => file.endsWith(".html") && !/^(admin|community-cases-admin|admin-local|404)\.html$/.test(file));
const links = [
  ["editorial-policy.html", "작성 기준"],
  ["terms.html", "이용약관"],
  ["contact.html", "문의"],
];

let changed = 0;
for (const file of files) {
  let html = fs.readFileSync(file, "utf8");
  const footerMatch = html.match(/<footer\b[\s\S]*?<\/footer>/i);
  if (!footerMatch) continue;
  let footer = footerMatch[0];
  const paragraphMatches = [...footer.matchAll(/<p\b[^>]*>[\s\S]*?<\/p>/gi)];
  if (!paragraphMatches.length) continue;
  let copyright = paragraphMatches[0][0];
  let footerLinks = paragraphMatches.find((match) => /class=["']footer-links["']/.test(match[0]))?.[0] || "";

  for (const [href, label] of links) {
    const anchor = new RegExp(`<a\\s+href=["']${href.replace(".", "\\.")}["'][^>]*>[^<]*<\\/a>`, "i");
    const match = copyright.match(anchor);
    if (match) {
      copyright = copyright.replace(new RegExp(`\\s*·\\s*${anchor.source}`, "i"), "");
      if (!footerLinks) footerLinks = `<p class="footer-links"></p>`;
      if (!footerLinks.includes(`href="${href}"`) && !footerLinks.includes(`href='${href}'`)) {
        footerLinks = footerLinks.replace("</p>", `${match[0]}</p>`);
      }
    }
  }

  if (footerLinks) {
    const existing = new Set([...footerLinks.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]));
    for (const [href, label] of links) {
      if (!existing.has(href)) footerLinks = footerLinks.replace("</p>", ` · <a href="${href}">${label}</a></p>`);
    }
    footerLinks = footerLinks.replace(/<\/a>\s*<a/g, "</a> · <a");
  }

  const updatedParagraphs = paragraphMatches.map((match, index) => {
    if (index === 0) return copyright;
    if (className(match[0]) === "footer-links") return footerLinks;
    return match[0];
  });
  if (!footerLinks && paragraphMatches.length === 1) updatedParagraphs.push(`<p class="footer-links">${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join(" · ")}</p>`);
  let cursor = 0;
  for (const originalParagraph of paragraphMatches) {
    footer = footer.replace(originalParagraph, updatedParagraphs[cursor++]);
  }
  if (!paragraphMatches.some((match) => className(match[0]) === "footer-links") && footerLinks) footer = footer.replace("</footer>", `${footerLinks}</footer>`);
  html = html.replace(footerMatch[0], footer);
  if (html !== fs.readFileSync(file, "utf8")) {
    fs.writeFileSync(file, html);
    changed += 1;
  }
}

function className(paragraph) {
  return /class=["']footer-links["']/.test(paragraph) ? "footer-links" : "";
}

console.log(`푸터 링크 위치를 정리한 파일: ${changed}개`);
