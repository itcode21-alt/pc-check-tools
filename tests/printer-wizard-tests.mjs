// 프린터 마법사 데이터 무결성 검증: node tests/printer-wizard-tests.mjs
import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const W = require("../printer-wizard-data.js");
const ids = Object.keys(W.nodes);

assert.ok(W.nodes[W.start], "시작 노드 없음");
const reach = new Set([W.start]), queue = [W.start];
while (queue.length) {
  const n = W.nodes[queue.shift()];
  const targets = n.type === "q" ? n.options.map((o) => o.to) : n.next ? [n.next.to] : [];
  for (const t of targets) {
    assert.ok(W.nodes[t], `끊어진 분기: ${t}`);
    if (!reach.has(t)) { reach.add(t); queue.push(t); }
  }
}
assert.deepEqual(ids.filter((i) => !reach.has(i)), [], "시작에서 도달할 수 없는 노드");

for (const id of ids) {
  const n = W.nodes[id];
  assert.ok(n.title, `${id} 제목`);
  if (n.type === "q") {
    assert.ok(n.options.length >= 2, `${id} 선택지`);
    n.options.forEach((o) => assert.ok(o.label && o.to));
  } else {
    assert.ok(n.summary && n.steps.length >= 3, `${id} 요약·단계`);
    for (const [href] of n.links) assert.ok(existsSync(new URL("../" + href, import.meta.url)), `${id}: 없는 사이트 링크 ${href}`);
    for (const [href] of n.ms) assert.ok(/^https:\/\/support\.microsoft\.com\//.test(href), `${id}: 공식 링크 형식`);
  }
}
// 증상 진입점은 q-root 선택지로 모두 닿아야 한다
const roots = W.nodes[W.start].options.map((o) => o.to);
assert.ok(roots.length >= 6);
// 위험한 안내가 들어가지 않았는지: 레지스트리 키 이름을 직접 안내하지 않는다
assert.ok(!JSON.stringify(W).includes("RpcAuthnLevelPrivacyEnabled"));
console.log(`printer-wizard: ${ids.length} nodes, all assertions passed`);
