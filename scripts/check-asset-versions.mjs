// 모든 HTML 페이지가 같은 공유 JS/CSS 파일을 항상 같은 방식(같은 ?v= 버전 문자열,
// 또는 항상 버전 없이)으로 불러오는지 검사합니다.
//
// 배경: 이 사이트는 app.js/style.css/site.js/data.js 같은 파일을 260개 이상의 정적
// HTML 페이지가 각자 <script src="...?v=...">로 캐시 버스팅합니다. 실제 파일을 고칠
// 때마다 "모든 HTML의 버전 문자열도 함께 올린다"는 규칙을 지켜야 하는데, 페이지 수가
// 많다 보니 일부만 갱신되고 나머지는 예전 버전 문자열이 남는 사고가 반복됐습니다.
// (site.js, data.js, games-data.js, search.js에서 실제로 발견됨 — 2026-07-31 점검)
//
// 이 스크립트는 두 가지를 확인합니다.
//   1. 같은 파일(app.js 등)을 참조하는 <script>/<link> 태그가 페이지마다 서로 다른
//      버전 문자열(또는 버전 유무)을 쓰고 있지 않은지 — 전체 사이트에서 정확히
//      "한 가지 참조 형태"만 존재해야 합니다.
//   2. (--staged 옵션) 커밋에 app.js/style.css/site.js/data.js 등 자산 파일 자체의
//      변경이 포함돼 있는데, 어떤 HTML의 버전 문자열도 함께 바뀌지 않았다면 경고합니다.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = readdirSync(root).filter((f) => f.endsWith(".html"));

// src="..." / href="..." 안에 있는 .js 또는 .css 참조 전체(버전 쿼리 포함)를 그대로 추출합니다.
// 파일명 전체를 속성값 단위로 매칭하므로 "data.js"와 "games-data.js" 같은 부분 문자열
// 충돌이 생기지 않습니다.
const ASSET_REF = /(?:src|href)="([a-zA-Z0-9._-]+\.(?:js|css)(?:\?v=[a-zA-Z0-9-]+)?)"/g;

// 참조 형태 -> 파일명(버전 제외) 매핑
const refsByAsset = new Map(); // assetName -> Map(refString -> Set(htmlFile))

for (const file of htmlFiles) {
  const content = readFileSync(join(root, file), "utf-8");
  for (const match of content.matchAll(ASSET_REF)) {
    const ref = match[1];
    const assetName = ref.split("?")[0];
    if (!refsByAsset.has(assetName)) refsByAsset.set(assetName, new Map());
    const refs = refsByAsset.get(assetName);
    if (!refs.has(ref)) refs.set(ref, new Set());
    refs.get(ref).add(file);
  }
}

let hasInconsistency = false;
for (const [asset, refs] of refsByAsset) {
  if (refs.size <= 1) continue;
  hasInconsistency = true;
  console.log(`\n❌ ${asset} — 페이지마다 참조 방식이 다릅니다:`);
  for (const [ref, files] of refs) {
    const list = [...files];
    const preview = list.slice(0, 5).join(", ") + (list.length > 5 ? ` 외 ${list.length - 5}개` : "");
    console.log(`   "${ref}" (${list.length}개 파일): ${preview}`);
  }
}

if (!hasInconsistency) {
  console.log(`✓ 자산 참조 일관성: 정상 (검사한 파일 ${htmlFiles.length}개, 자산 ${refsByAsset.size}종)`);
}

// 변경분에 자산 파일 자체 수정이 포함돼 있는데 어떤 HTML의 버전 문자열도 같이
// 바뀌지 않았다면 경고합니다.
//   --staged        : 로컬 pre-commit 훅용. 스테이징 영역(git diff --cached) 기준.
//   --base=<ref>     : CI용. <ref>..HEAD 커밋 범위 기준 (예: --base=HEAD~1).
const staged = process.argv.includes("--staged");
const baseArg = process.argv.find((arg) => arg.startsWith("--base="));
const base = baseArg ? baseArg.slice("--base=".length) : null;

if (staged || base) {
  const diffRange = staged ? "--cached" : `${base}..HEAD`;
  const changedFiles = execSync(`git diff ${diffRange} --name-only`, { cwd: root, encoding: "utf-8" })
    .split("\n")
    .filter(Boolean);
  const changedAssets = [...refsByAsset.keys()].filter((asset) => changedFiles.includes(asset));

  for (const asset of changedAssets) {
    const versionedRefs = [...refsByAsset.get(asset).keys()].filter((ref) => ref.includes("?v="));
    if (versionedRefs.length === 0) continue; // 이 자산은 버전 없이 쓰는 게 정상 패턴
    const htmlTouchesVersion = changedFiles
      .filter((f) => f.endsWith(".html"))
      .some((f) => {
        try {
          const diff = execSync(`git diff ${diffRange} -- "${f}"`, { cwd: root, encoding: "utf-8" });
          return diff.includes(`${asset}?v=`);
        } catch {
          return false;
        }
      });
    if (!htmlTouchesVersion) {
      hasInconsistency = true;
      console.log(`\n⚠️  ${asset} 파일이 이번 변경에서 수정됐지만, 어떤 HTML의 캐시 버전 문자열도 함께 바뀌지 않았습니다.`);
      console.log(`   -> HTML의 "${asset}?v=..." 문자열을 새 값으로 올려야 사용자가 최신 버전을 받습니다.`);
    }
  }
}

process.exitCode = hasInconsistency ? 1 : 0;
