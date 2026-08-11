#!/usr/bin/env node
// 이벤트 뷰어(102개)·증상(67개) 상세 페이지의 SEO/접근성/콘텐츠 정합성을 점검합니다.
// 사용법: node scripts/audit-event-symptom-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

global.window = {};
eval(fs.readFileSync("data.js", "utf8"));
const data = global.window.SITE_DATA;

const issues = [];
const flag = (file, category, message) => issues.push({ file, category, message });

const auditPage = (file, category) => {
  if (!fs.existsSync(file)) {
    flag(file, "콘텐츠 정합성", "data.js가 가리키는 페이지 파일이 존재하지 않음");
    return;
  }
  const html = fs.readFileSync(file, "utf8");

  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  const h1Matches = [...html.matchAll(/<h1\b/g)];
  const h2Matches = [...html.matchAll(/<h2\b/g)];
  const ogTitleMatch = html.match(/property="og:title" content="([^"]*)"/);
  const ogDescMatch = html.match(/property="og:description" content="([^"]*)"/);
  const langMatch = html.match(/<html lang="([^"]*)"/);
  const faqBlockMatch = html.match(/"@type":"FAQPage","mainEntity":(\[.*?\])\}<\/script>/s);

  if (!titleMatch || !titleMatch[1].trim()) flag(file, "SEO", "title 태그가 없거나 비어 있음");
  if (!descMatch || !descMatch[1].trim()) flag(file, "SEO", "meta description이 없거나 비어 있음");
  else if (descMatch[1].length > 160) flag(file, "SEO", `meta description이 너무 김 (${descMatch[1].length}자)`);
  else if (descMatch[1].length < 20) flag(file, "SEO", `meta description이 너무 짧음 (${descMatch[1].length}자)`);
  if (!canonicalMatch) flag(file, "SEO", "canonical 태그 없음");
  else {
    const expected = `https://itsvc.co.kr/${file}`;
    if (canonicalMatch[1] !== expected) flag(file, "SEO", `canonical이 실제 파일명과 불일치: ${canonicalMatch[1]}`);
  }
  if (!ogTitleMatch) flag(file, "SEO", "og:title 없음");
  if (!ogDescMatch) flag(file, "SEO", "og:description 없음");

  if (!langMatch || langMatch[1] !== "ko") flag(file, "접근성", `lang 속성 누락 또는 비정상 (${langMatch ? langMatch[1] : "없음"})`);
  if (h1Matches.length === 0) flag(file, "접근성", "h1 태그 없음");
  else if (h1Matches.length > 1) flag(file, "접근성", `h1 태그가 ${h1Matches.length}개 (중복)`);
  if (h2Matches.length === 0) flag(file, "접근성", "h2 태그 없음 (본문 제목 누락)");

  if (faqBlockMatch) {
    try {
      const faqData = JSON.parse(faqBlockMatch[1]);
      const faqListMatch = html.match(/<h3 id="faq">[\s\S]*?<ul class="mini-list">([\s\S]*?)<\/ul>/);
      const faqCountInHtml = faqListMatch ? (faqListMatch[1].match(/<li>/g) || []).length : null;
      if (faqCountInHtml !== null && faqData.length !== faqCountInHtml) {
        flag(file, "콘텐츠 정합성", `FAQ 스키마(${faqData.length}개)와 본문 FAQ(${faqCountInHtml}개) 개수 불일치`);
      }
    } catch {
      flag(file, "SEO", "FAQPage JSON-LD 파싱 실패 (문법 오류)");
    }
  }

  if (/undefined|\bNaN\b|\{\{|TODO|<<<|>>>/.test(html)) {
    flag(file, "콘텐츠 정합성", "템플릿 아티팩트 의심 문자열 발견");
  }

  const emptyLinks = [...html.matchAll(/<a\b[^>]*>(\s*)<\/a>/g)];
  if (emptyLinks.length) flag(file, "접근성", `텍스트가 비어 있는 <a> 태그 ${emptyLinks.length}개`);
};

// --- 이벤트 뷰어 페이지 ---
const seenEventPages = new Set();
for (const ev of data.eventViewerCodes) {
  if (!ev.detailPage || seenEventPages.has(ev.detailPage)) continue;
  seenEventPages.add(ev.detailPage);
  auditPage(ev.detailPage, "event");
}

// --- 증상 상세 페이지 (h1은 축약된 표현을 쓰는 경우가 있어 title 텍스트 존재 여부는 검사하지 않음) ---
for (const sym of data.symptoms) {
  if (!sym.link) continue;
  auditPage(sym.link, "symptom");
}

const byCategory = {};
for (const issue of issues) {
  byCategory[issue.category] = byCategory[issue.category] || [];
  byCategory[issue.category].push(issue);
}

console.log(`\n이벤트 뷰어 페이지 ${seenEventPages.size}개 + 증상 페이지 ${data.symptoms.length}개 점검 완료. 발견된 이슈: ${issues.length}건\n`);
for (const [category, list] of Object.entries(byCategory)) {
  console.log(`## ${category} (${list.length}건)`);
  for (const issue of list) console.log(`  - ${issue.file}: ${issue.message}`);
  console.log("");
}
if (issues.length === 0) console.log("문제 없음.");
