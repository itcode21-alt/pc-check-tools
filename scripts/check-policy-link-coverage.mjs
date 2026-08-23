// 실제 방문자에게 개인정보처리방침 링크·제휴 고지 문구가 "정말로" 보이는지 검사합니다.
//
// 배경: 2026-08-19에 laptop-bios-entry-guide.html, laptop-external-monitor-flicker.html이
// <div id="site-footer"></div>(빈 껍데기)만 두고 app.js를 아예 안 불러오고 있어서,
// 개인정보처리방침·이용약관 링크가 방문자에게 영구히 안 보이는 상태로 방치돼 있었습니다.
// gpu-upgrade-guide.html, ssd-upgrade-guide.html도 같은 이유로 쿠팡 제휴 링크에
// 정식 수수료 고지("쿠팡 파트너스 활동의 일환으로...") 없이 구식 문구만 남아 있었습니다.
// app.js가 로드되면 런타임에 footer-links와 제휴 고지를 자동으로 채우지만(app.js 참고),
// app.js를 안 불러오는 "독립형" 가이드/도구 페이지가 늘어날 때마다 같은 사고가
// 조용히 반복될 수 있어 커밋 전에 잡아내는 검사를 추가합니다.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

// 관리자·리다이렉트 전용 페이지는 정책 링크가 없어도 됩니다(노출 대상이 아님).
const EXCLUDE = new Set([
  "404.html",
  "admin.html",
  "admin-local.html",
  "community-cases-admin.html",
]);

let errors = [];

for (const file of htmlFiles) {
  if (EXCLUDE.has(file)) continue;
  const content = readFileSync(join(root, file), "utf-8");
  const isNoindex = /name="robots"\s+content="[^"]*noindex/i.test(content);
  if (isNoindex) continue; // 검색 노출 대상이 아닌 페이지(리다이렉트 스텁 등)는 제외

  const loadsAppJs = /src="app\.js/.test(content);
  const hasStaticPrivacyLink = /href="privacy\.html"/.test(content);

  if (!loadsAppJs && !hasStaticPrivacyLink) {
    errors.push(
      `${file}: app.js도 안 불러오고 privacy.html 정적 링크도 없음 — 방문자에게 개인정보처리방침이 영구히 안 보일 수 있음`
    );
  }

  const hasCoupangLink = /coupang\.com/.test(content);
  const hasDisclosureText = content.includes("쿠팡 파트너스");
  if (hasCoupangLink && !loadsAppJs && !hasDisclosureText) {
    errors.push(
      `${file}: 쿠팡 제휴 링크가 있는데 app.js도 안 불러오고 정식 고지 문구("쿠팡 파트너스")도 없음`
    );
  }
}

if (errors.length > 0) {
  console.log(`❌ 정책 링크/제휴 고지 노출 문제 ${errors.length}건 발견:`);
  errors.forEach((e) => console.log("   -", e));
  process.exit(1);
}

console.log(`✓ 정책 링크·제휴 고지 노출 정상 (검사한 페이지 ${htmlFiles.length - EXCLUDE.size}개 안팎)`);
