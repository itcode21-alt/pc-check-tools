// data.js·HTML에서 파생되는 산출물이 원본과 어긋났는지 검사합니다.
//
// 배경(2026-10-15): kb/knowledge-base.json(맥미니 AI 답변의 검색 자료)이 2026-08-07 이후 두 달
// 갱신되지 않아 배포된 AI 서버가 문서 335개만 알고 있었다(실제 사이트는 433개). 같은 날 다시
// 만들었는데도 몇 시간 뒤 다른 세션의 가이드 보강으로 문서 15개가 또 낡았다. RSS는 커밋 전에
// 갱신 여부를 검사하지만(check-rss-freshness.mjs) KB에는 그런 장치가 없었다.
//
// 사용법
//   node scripts/check-derived-freshness.mjs            KB를 항상 검사 (어긋나면 실패)
//   node scripts/check-derived-freshness.mjs --staged   data.js/KB/생성기가 커밋에 포함될 때만 검사(훅용)
//   node scripts/check-derived-freshness.mjs --sitemap  사이트맵 lastmod도 비교해 알려줌(경고만, 실패 안 함)
//
// 사이트맵은 git 이력으로 lastmod를 계산하고 전체 이력을 읽느라 약 8초 걸려 훅에서 돌리지
// 않는다. 또 지금 커밋하려는 변경은 아직 이력에 없어 커밋 전에는 정확히 비교할 수 없으므로,
// 커밋 뒤에 직접 돌려 보는 점검용이다.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const staged = args.includes("--staged");
const withSitemap = args.includes("--sitemap");

const git = (...a) => execFileSync("git", a, { cwd: root, encoding: "utf8" });
const tmp = mkdtempSync(join(tmpdir(), "itsvc-derived-"));
let failed = false;

// ── KB ────────────────────────────────────────────────────────────────────
const KB_TRIGGERS = ["data.js", "kb/knowledge-base.json", "scripts/build-kb.mjs"];
const stagedFiles = staged ? git("diff", "--cached", "--name-only").split("\n").filter(Boolean) : [];
if (staged && !stagedFiles.some((f) => KB_TRIGGERS.includes(f))) {
  console.log("✓ KB 신선도: data.js·KB 변경 없음(건너뜀)");
} else {
  const fresh = join(tmp, "kb.json");
  execFileSync("node", ["scripts/build-kb.mjs", "--out", fresh], { cwd: root, stdio: "ignore" });
  const pick = (path) => {
    const j = JSON.parse(readFileSync(path, "utf8"));
    return { siteName: j.siteName, siteUrl: j.siteUrl, documents: j.documents }; // generatedAt(생성 시각)은 비교 제외
  };
  const want = pick(fresh);
  const have = pick(join(root, "kb/knowledge-base.json"));
  const byId = (docs) => new Map(docs.map((d) => [d.id, JSON.stringify(d)]));
  const w = byId(want.documents);
  const h = byId(have.documents);
  const missing = [...w.keys()].filter((id) => !h.has(id));
  const extra = [...h.keys()].filter((id) => !w.has(id));
  const changed = [...w.keys()].filter((id) => h.has(id) && w.get(id) !== h.get(id));
  if (missing.length || extra.length || changed.length) {
    failed = true;
    console.error(`❌ kb/knowledge-base.json이 data.js와 어긋나 있습니다 (추가 필요 ${missing.length}, 삭제 필요 ${extra.length}, 내용 변경 ${changed.length}).`);
    console.error("   AI 답변이 낡은 정보를 근거로 삼게 됩니다. node scripts/build-kb.mjs 실행 후 KB도 함께 커밋하세요.");
    console.error("   (급하게 우회해야 한다면 git commit --no-verify)");
  } else {
    console.log(`✓ KB 신선도: data.js와 일치 (문서 ${want.documents.length}개)`);
  }
}

// ── 사이트맵(경고만) ───────────────────────────────────────────────────────
if (withSitemap) {
  const fresh = join(tmp, "sitemap.xml");
  execFileSync("node", ["scripts/generate-sitemap.mjs", "--out", fresh], { cwd: root, stdio: "ignore" });
  const read = (p) => new Map([...readFileSync(p, "utf8").matchAll(/<loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?/g)].map((m) => [m[1], m[2] || ""]));
  const want = read(fresh);
  const have = read(join(root, "sitemap.xml"));
  const diff = [...want].filter(([loc, mod]) => have.get(loc) !== mod);
  if (diff.length) {
    console.warn(`⚠️  sitemap.xml lastmod가 현재 이력과 ${diff.length}개 URL에서 다릅니다. node scripts/generate-sitemap.mjs 로 갱신하세요.`);
  } else {
    console.log(`✓ 사이트맵 신선도: 일치 (${want.size}개 URL)`);
  }
}

process.exit(failed ? 1 : 0);
