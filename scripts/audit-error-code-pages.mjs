#!/usr/bin/env node
// 156개 오류 코드 중 개별 상세 페이지가 있는 파일들의 콘텐츠 정합성/SEO/접근성을 점검합니다.
// 사용법: node scripts/audit-error-code-pages.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
process.chdir(root);

global.window = {};
eval(fs.readFileSync("data.js", "utf8"));
const data = global.window.SITE_DATA;

const normalizeCode = (code) => String(code || "").toUpperCase().replace(/^0X/, "0x");

const pageToEntry = new Map();
for (const ec of data.errorCodes) {
  const page = ec.detailPage || ec.link;
  if (page && page.endsWith(".html")) pageToEntry.set(page, ec);
}

const isHexCode = (code) => /^0x[0-9a-f]+$/i.test(code);

const files = fs.readdirSync(root).filter((f) => /^error-code-.*\.html$/.test(f));

const issues = [];
const flag = (file, category, message) => issues.push({ file, category, message });

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const entry = pageToEntry.get(file);

  // --- 기본 구조 ---
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const canonicalMatch = html.match(/<link rel="canonical" href="([^"]*)"/);
  const h1Matches = [...html.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)];
  const h2Matches = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)];
  const ogTitleMatch = html.match(/property="og:title" content="([^"]*)"/);
  const ogDescMatch = html.match(/property="og:description" content="([^"]*)"/);
  const langMatch = html.match(/<html lang="([^"]*)"/);
  const dataPageMatch = html.match(/data-error-code-page="([^"]*)"/);
  const techArticleMatch = html.match(/"@type":"TechArticle"[^}]*"headline":"([^"]*)"/);
  const faqBlockMatch = html.match(/"@type":"FAQPage","mainEntity":(\[.*?\])\}<\/script>/s);
  const reviewDateMatch = html.match(/최종 검토일:\s*([0-9-]+)/);

  // 1) 필수 SEO 태그 존재 여부
  if (!titleMatch || !titleMatch[1].trim()) flag(file, "SEO", "title 태그가 없거나 비어 있음");
  if (!descMatch || !descMatch[1].trim()) flag(file, "SEO", "meta description이 없거나 비어 있음");
  else if (descMatch[1].length > 160) flag(file, "SEO", `meta description이 너무 김 (${descMatch[1].length}자)`);
  else if (descMatch[1].length < 20) flag(file, "SEO", `meta description이 너무 짧음 (${descMatch[1].length}자)`);
  if (!canonicalMatch) flag(file, "SEO", "canonical 태그 없음");
  else {
    const expected = `https://itsvc.co.kr/${file}`;
    if (canonicalMatch[1] !== expected) flag(file, "SEO", `canonical이 실제 파일명과 불일치: ${canonicalMatch[1]} (기대값 ${expected})`);
  }
  if (!ogTitleMatch) flag(file, "SEO", "og:title 없음");
  if (!ogDescMatch) flag(file, "SEO", "og:description 없음");
  if (!techArticleMatch) flag(file, "SEO", "TechArticle 구조화 데이터(headline) 없음");

  // 2) 접근성
  if (!langMatch || langMatch[1] !== "ko") flag(file, "접근성", `lang 속성 누락 또는 비정상 (${langMatch ? langMatch[1] : "없음"})`);
  if (h1Matches.length === 0) flag(file, "접근성", "h1 태그 없음");
  else if (h1Matches.length > 1) flag(file, "접근성", `h1 태그가 ${h1Matches.length}개 (중복)`);
  if (h2Matches.length === 0) flag(file, "접근성", "h2 태그 없음 (본문 제목 누락)");

  // 3) data.js 항목과 대조 (detailPage/link 필드로 실제 매칭)
  if (!entry) {
    flag(file, "콘텐츠 정합성", "data.js에 이 페이지를 가리키는 errorCodes 항목이 없음 — 고아 페이지 (검색/관련 코드에서 노출 안 될 가능성)");
  } else {
    const expectedCode = entry.code;
    const compareValue = isHexCode(expectedCode) ? expectedCode.toUpperCase() : expectedCode;
    const sources = {
      title: titleMatch?.[1] || "",
      description: descMatch?.[1] || "",
      h1: h1Matches[0]?.[1] || "",
      h2: h2Matches[0]?.[1] || "",
      ogTitle: ogTitleMatch?.[1] || "",
      dataPageAttr: dataPageMatch?.[1] || "",
      techArticleHeadline: techArticleMatch?.[1] || "",
    };
    for (const [key, value] of Object.entries(sources)) {
      if (!value) continue;
      const haystack = isHexCode(expectedCode) ? value.toUpperCase() : value;
      if (!haystack.includes(compareValue)) {
        flag(file, "콘텐츠 정합성", `${key}에 코드/제목("${expectedCode}")이 포함되어 있지 않음: "${value.slice(0, 60)}"`);
      }
    }

    // 페이지 안에 data.js 항목의 title 핵심 키워드(코드명 뒤 영문 약어)가 등장하는지 대략 확인
    const titleKeyword = (entry.title || "").split(/[·\s]/).find((w) => /^[A-Z_]{4,}$/.test(w));
    if (titleKeyword && !html.includes(titleKeyword)) {
      flag(file, "콘텐츠 정합성", `data.js title의 핵심 키워드 "${titleKeyword}"가 페이지 본문에 없음`);
    }
  }

  // 5) FAQ 구조화 데이터와 실제 노출된 FAQ 텍스트 개수 비교
  if (faqBlockMatch) {
    try {
      const faqData = JSON.parse(faqBlockMatch[1]);
      const faqCountInSchema = faqData.length;
      const faqListMatch = html.match(/<h3 id="faq">[\s\S]*?<ul class="mini-list">([\s\S]*?)<\/ul>/);
      const faqCountInHtml = faqListMatch ? (faqListMatch[1].match(/<li>/g) || []).length : 0;
      if (faqCountInHtml && faqCountInSchema !== faqCountInHtml) {
        flag(file, "콘텐츠 정합성", `FAQ 스키마(${faqCountInSchema}개)와 본문 FAQ(${faqCountInHtml}개) 개수 불일치`);
      }
    } catch {
      flag(file, "SEO", "FAQPage JSON-LD 파싱 실패 (문법 오류)");
    }
  }

  // 6) 리뷰일 존재 여부 (콘텐츠 신선도 신호)
  if (!reviewDateMatch) flag(file, "콘텐츠 정합성", "최종 검토일 표기 없음");

  // 7) 템플릿 아티팩트 / 깨진 텍스트 흔적
  if (/undefined|\bNaN\b|\{\{|TODO|<<<|>>>/.test(html)) {
    flag(file, "콘텐츠 정합성", "템플릿 아티팩트 의심 문자열 발견 (undefined/NaN/TODO 등)");
  }

  // 8) 이미지 alt (있는 경우만)
  const imgTags = [...html.matchAll(/<img\b[^>]*>/g)];
  for (const [tag] of imgTags) {
    if (!/\balt="[^"]*"/.test(tag)) flag(file, "접근성", `alt 속성 없는 img 태그: ${tag.slice(0, 80)}`);
  }

  // 9) 빈 링크 텍스트
  const emptyLinks = [...html.matchAll(/<a\b[^>]*>(\s*)<\/a>/g)];
  if (emptyLinks.length) flag(file, "접근성", `텍스트가 비어 있는 <a> 태그 ${emptyLinks.length}개`);
}

// --- 결과 출력 ---
const byCategory = {};
for (const issue of issues) {
  byCategory[issue.category] = byCategory[issue.category] || [];
  byCategory[issue.category].push(issue);
}

console.log(`\n총 ${files.length}개 오류 코드 페이지 점검 완료. 발견된 이슈: ${issues.length}건\n`);
for (const [category, list] of Object.entries(byCategory)) {
  console.log(`## ${category} (${list.length}건)`);
  for (const issue of list) {
    console.log(`  - ${issue.file}: ${issue.message}`);
  }
  console.log("");
}

if (issues.length === 0) {
  console.log("문제 없음.");
}
