// rss.xml(scripts/generate-rss.mjs)이 dateModified가 바뀐 콘텐츠 페이지와 함께
// 갱신됐는지 검사합니다.
//
// 배경: generate-rss.mjs는 sitemap.xml/search-index.js와 달리 pre-commit 훅이나
// CI 어디에도 걸려있지 않아서, 2026-09-17 이후 일주일 넘게 콘텐츠가 계속 추가됐는데도
// rss.xml만 그대로 정체돼 있던 것이 뒤늦게 발견됐다(2026-09-24). 이 스크립트는
// check-asset-versions.mjs와 같은 패턴(--staged / --base=<ref>)으로, dateModified가
// 바뀐 HTML이 커밋에 포함됐는데 rss.xml은 함께 바뀌지 않았다면 경고한다.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// generate-rss.mjs의 excluded 목록과 동일하게 맞춘다.
const excluded = new Set([
  "404.html",
  "admin.html",
  "admin-local.html",
  "community-cases-admin.html",
  "search-results.html",
]);

const staged = process.argv.includes("--staged");
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const base = baseArg ? baseArg.slice("--base=".length) : null;

if (!staged && !base) {
  console.log("사용법: node scripts/check-rss-freshness.mjs --staged  (또는 --base=<ref>)");
  process.exit(0);
}

const diffRange = staged ? "--cached" : `${base}..HEAD`;
const changedFiles = execSync(`git diff ${diffRange} --name-only`, { cwd: root, encoding: "utf-8" })
  .split("\n")
  .filter(Boolean);

const changedContentPages = changedFiles.filter(
  (f) => f.endsWith(".html") && !excluded.has(f) && readdirSyncSafe(f)
);

function readdirSyncSafe(f) {
  // 삭제된 파일(diff에는 있지만 워킹트리에 없음)은 대상에서 제외한다.
  try {
    readFileSync(join(root, f), "utf-8");
    return true;
  } catch {
    return false;
  }
}

const pagesWithDateModifiedChange = changedContentPages.filter((f) => {
  try {
    const diff = execSync(`git diff ${diffRange} -- "${f}"`, { cwd: root, encoding: "utf-8" });
    // diff의 추가된(+) 줄에 dateModified가 있으면 콘텐츠 발행일이 바뀐 것으로 본다.
    return /^\+.*"dateModified":"\d{4}-\d{2}-\d{2}"/m.test(diff);
  } catch {
    return false;
  }
});

if (pagesWithDateModifiedChange.length === 0) {
  console.log("✓ rss.xml 갱신 필요 없음 (dateModified가 바뀐 페이지 없음)");
  process.exit(0);
}

if (changedFiles.includes("rss.xml")) {
  console.log(`✓ rss.xml 갱신 확인됨 (dateModified 변경 ${pagesWithDateModifiedChange.length}개 페이지와 함께 커밋됨)`);
  process.exit(0);
}

console.log(`\n⚠️  dateModified가 바뀐 페이지 ${pagesWithDateModifiedChange.length}개가 이번 변경에 포함돼 있지만, rss.xml은 함께 갱신되지 않았습니다.`);
console.log(`   대상: ${pagesWithDateModifiedChange.slice(0, 8).join(", ")}${pagesWithDateModifiedChange.length > 8 ? ` 외 ${pagesWithDateModifiedChange.length - 8}개` : ""}`);
console.log(`   -> node scripts/generate-rss.mjs 실행 후 rss.xml도 함께 커밋하세요.`);
process.exitCode = 1;
