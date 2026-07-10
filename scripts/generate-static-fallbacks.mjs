import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), context);
const data = context.window.SITE_DATA;

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const addAuthorMeta = (html) => html.includes('name="author"')
  ? html
  : html.replace("  <link rel=\"canonical\"", "  <meta name=\"author\" content=\"itcode21-alt\">\n  <link rel=\"canonical\"");

const addArticleSchema = (html, { headline, description, url }) => {
  if (html.includes('data-generated-article-schema')) return html;
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "ko-KR",
    dateModified: "2026-07-10",
    author: {
      "@type": "Organization",
      name: "PC 윈도우 진단 센터",
      url: "https://itcode21-alt.github.io/pc-check-tools/about.html"
    },
    publisher: {
      "@type": "Organization",
      name: "PC 윈도우 진단 센터",
      url: "https://itcode21-alt.github.io/pc-check-tools/"
    }
  };
  const block = `  <script type="application/ld+json" data-generated-article-schema>\n    ${JSON.stringify(schema)}\n  </script>\n`;
  if (html.includes("  <link rel=\"stylesheet\"")) {
    return html.replace("  <link rel=\"stylesheet\"", `${block}  <link rel=\"stylesheet\"`);
  }
  return html.replace("</head>", `\n${block}</head>`);
};

const symptomFallback = (symptom, details) => {
  const intro = (details.intro || []).slice(0, 3).map((item) => `        <p>${escapeHtml(item)}</p>`).join("\n");
  const checks = (details.checks || []).map((item) => `          <li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.why)} ${escapeHtml(item.how)}</li>`).join("\n");
  const faq = (details.faq || []).slice(0, 2).map((item) => `          <li><strong>${escapeHtml(item.q)}</strong> ${escapeHtml(item.a)}</li>`).join("\n");
  return `
      <!-- STATIC_FALLBACK_START -->
      <article class="static-detail-fallback">
        <p class="eyebrow">${escapeHtml(details.badge || "증상별 가이드")}</p>
        <h2>${escapeHtml(symptom.title)} 원인과 점검 순서</h2>
        <p class="lead">${escapeHtml(symptom.summary)}</p>
${intro}
        <p class="editorial-meta"><a href="about.html">itcode21-alt 작성·검토</a> · 최근 수정 2026-07-10 · <a href="editorial-policy.html">작성 기준 보기</a></p>
        <h3>먼저 확인할 항목</h3>
        <ol class="mini-list">
${checks}
        </ol>
        <h3>자주 묻는 질문</h3>
        <ul class="mini-list">
${faq}
        </ul>
        <p><a href="diagnostic.html">진단 도구에서 증상과 오류 코드 함께 확인하기</a></p>
      </article>
      <!-- STATIC_FALLBACK_END -->
    `;
};

const errorFallback = (code) => {
  const causes = (code.causes || []).map((item) => `          <li>${escapeHtml(item)}</li>`).join("\n");
  const checks = (code.checks || []).map((item) => `          <li>${escapeHtml(item)}</li>`).join("\n");
  return `
      <!-- STATIC_FALLBACK_START -->
      <article class="static-detail-fallback">
        <p class="eyebrow">에러 코드 상세</p>
        <h2>${escapeHtml(code.code)} · ${escapeHtml(code.title)}</h2>
        <p class="lead">${escapeHtml(code.summary)}</p>
        <p>오류 코드는 원인을 확정하는 판정이 아니라 점검 범위를 좁히는 단서입니다. 발생 직전 작업과 최근 드라이버·업데이트 변경을 함께 기록하세요.</p>
        <p class="editorial-meta"><a href="about.html">itcode21-alt 작성·검토</a> · 최근 수정 2026-07-10 · <a href="editorial-policy.html">작성 기준 보기</a></p>
        <h3>가능성 높은 원인</h3>
        <ul class="mini-list">
${causes}
        </ul>
        <h3>첫 점검 항목</h3>
        <ol class="mini-list">
${checks}
        </ol>
        <p>복구, 초기화, 드라이버 제거 전에는 중요한 파일을 다른 저장장치에 백업하세요.</p>
        <p><a href="${escapeHtml(code.relatedSymptom || "diagnostic.html")}">관련 증상 가이드 확인하기</a></p>
      </article>
      <!-- STATIC_FALLBACK_END -->
    `;
};

const replaceRootContent = (html, attribute, value, fallback) => {
  const pattern = new RegExp(`(<section class="section" ${attribute}="${value}">)[\\s\\S]*?(</section>)`);
  if (!pattern.test(html)) throw new Error(`렌더링 영역을 찾지 못했습니다: ${attribute}=${value}`);
  return html.replace(pattern, `$1${fallback}$2`);
};

for (const symptom of data.symptoms) {
  const file = path.join(root, symptom.link);
  let html = fs.readFileSync(file, "utf8");
  html = addAuthorMeta(html);
  html = addArticleSchema(html, {
    headline: `${symptom.title} 원인과 점검 순서`,
    description: symptom.summary,
    url: `${data.siteUrl}/${symptom.link}`
  });
  html = replaceRootContent(html, "data-symptom-detail-page", symptom.id, symptomFallback(symptom, data.symptomDetails[symptom.id]));
  fs.writeFileSync(file, html);
}

for (const code of data.errorCodes) {
  const fileName = code.detailPage || code.link;
  if (!fileName || !fileName.startsWith("error-code-")) continue;
  const file = path.join(root, fileName);
  let html = fs.readFileSync(file, "utf8");
  html = addAuthorMeta(html);
  html = addArticleSchema(html, {
    headline: `${code.code} ${code.title} 원인과 점검 순서`,
    description: code.summary,
    url: `${data.siteUrl}/${fileName}`
  });
  html = replaceRootContent(html, "data-error-code-page", code.code, errorFallback(code));
  fs.writeFileSync(file, html);
}

console.log(`정적 본문 생성 완료: 증상 ${data.symptoms.length}개, 오류 코드 ${data.errorCodes.length}개`);
