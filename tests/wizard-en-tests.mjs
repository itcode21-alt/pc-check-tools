// 영어 자가진단 데이터에 한국어가 남아 있지 않은지, 한국어·영어 결과 노드 수가 같은지 확인: node tests/wizard-en-tests.mjs
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const hangul = /[가-힣]/;
// 한국 서비스 전용이라 영어판에 일부러 두지 않은 결과 노드(카카오톡 PC·공동인증서)
const KO_ONLY = { software: ["kq", "r_cert", "r_kakao"] };
for (const k of ["boot", "display", "input", "network", "slow", "software", "storage"]) {
  const load = (f) => { const c = { window: {} }; vm.runInNewContext(fs.readFileSync(f, "utf8"), c); return c.window.ITSVC_WIZARD.nodes; };
  const ko = load(`wizard-${k}.js`);
  const en = load(`wizard-${k}-en.js`);
  const skip = new Set(KO_ONLY[k] || []);
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ko).filter((id) => !skip.has(id)).sort(), `${k}: 한국어·영어 노드 목록이 다름`);
  const walk = (o, path) => {
    if (typeof o === "string") { assert.ok(!hangul.test(o), `${k}-en: 한국어가 남음 @ ${path}: ${o.slice(0, 50)}`); return; }
    if (Array.isArray(o)) o.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (o && typeof o === "object") for (const [key, v] of Object.entries(o)) walk(v, `${path}.${key}`);
  };
  walk(en, "nodes");
  for (const [id, nd] of Object.entries(ko)) {
    if (skip.has(id)) continue;
    if (nd.steps) assert.equal((en[id].steps || []).length, nd.steps.length, `${k}: ${id} 단계 수가 다름`);
    if (nd.options && !nd.options.some((o) => skip.has(o.next))) assert.equal((en[id].options || []).length, nd.options.length, `${k}: ${id} 선택지 수가 다름`);
    for (const o of en[id].options || []) if (o.next) assert.ok(en[o.next], `${k}-en: ${id} → 없는 노드 ${o.next}`);   // 한국 전용 질문은 영어판이 바로 결과로 연결해도 된다
  }
}
console.log("wizard 영어판 검증 통과");
