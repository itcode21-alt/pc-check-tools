// "함께 볼 가이드" 데이터 검증: node tests/related-guides-tests.mjs
// 페이지를 추가·삭제·크게 고친 뒤에는 `node scripts/build-related-guides.mjs`로 related-guides.js를 다시 만들어야 이 검사를 통과한다.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(ROOT, "related-guides.js"), "utf8"), ctx);
const { links, titles } = ctx.window.RELATED_GUIDES;
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const sources = Object.keys(links);
assert.ok(sources.length > 300, "연결된 페이지가 너무 적음: " + sources.length);

const inbound = new Map();
for (const [src, list] of Object.entries(links)) {
  assert.ok(fs.existsSync(path.join(ROOT, src)), "없는 출처 페이지 " + src);
  assert.ok(list.length >= 1 && list.length <= 3, `${src} 링크 수 ${list.length}`);
  assert.equal(new Set(list).size, list.length, `${src} 중복 링크`);
  for (const t of list) {
    assert.notEqual(t, src, `${src} 자기 자신 링크`);
    assert.ok(fs.existsSync(path.join(ROOT, t)), `${src} → 없는 페이지 ${t}`);
    assert.ok(titles[t] && titles[t].length >= 3, `${t} 제목 없음`);
    inbound.set(t, (inbound.get(t) || 0) + 1);
  }
}

// 저품질 방지: 링크 대상은 모두 광고가 붙어 있고 noindex가 아니며 도구·정책 페이지가 아니다.
const noAds = JSON.parse(read("scripts/lib/no-ads-pages.json"));
const tool = new Set([...(noAds.pages || []), ...(noAds.sideAdsPages || [])]);
for (const t of inbound.keys()) {
  const h = read(t);
  assert.ok(/adsbygoogle\.js/.test(h), `${t}: 광고 없는(본문이 짧은) 페이지로는 연결하지 않는다`);
  assert.ok(!/<meta[^>]+name=["']robots["'][^>]*noindex/i.test(h), `${t}: noindex 페이지`);
  assert.ok(!tool.has(t), `${t}: 도구 페이지`);
}

// 한 페이지로 링크가 몰리지 않는다
assert.ok(Math.max(...inbound.values()) <= 12, "받은 링크 상한 초과");

// 공용 스크립트가 이 데이터를 쓰고, 이미 관련 글이 있는 페이지는 건너뛰며, 클릭을 측정한다
const cta = read("repair-cta.js");
assert.ok(/related-guides\.js/.test(cta) && /\.related-guide-grid, \.related-guides/.test(cta) && /related_click/.test(cta));

// 같은 입력이면 같은 결과(무작위 없음): 다시 만들어 비교
const before = fs.readFileSync(path.join(ROOT, "related-guides.js"), "utf8");
const { execFileSync } = await import("node:child_process");
execFileSync("node", [path.join(ROOT, "scripts/build-related-guides.mjs")], { stdio: "pipe" });
const after = fs.readFileSync(path.join(ROOT, "related-guides.js"), "utf8");
assert.equal(after, before, "데이터가 오래됐거나 생성이 결정적이지 않음 — node scripts/build-related-guides.mjs 실행 후 커밋");

console.log(`related-guides 검증 통과 (출처 ${sources.length}개, 대상 ${inbound.size}개)`);
