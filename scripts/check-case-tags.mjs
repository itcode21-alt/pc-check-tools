#!/usr/bin/env node
// 해결 사례 태그 목록 일치 검사.
// community-cases-tags.json(원본) ↔ ai-service/repair_log_store.py(SYMPTOMS·PARTS→cause·FIXES) ↔ community-cases.html 선택지.
import fs from "node:fs";

const tags = JSON.parse(fs.readFileSync("community-cases-tags.json", "utf8"));
const py = fs.readFileSync("ai-service/repair_log_store.py", "utf8");
const html = fs.readFileSync("community-cases.html", "utf8");
const problems = [];

function pyDict(name) {
  const m = py.match(new RegExp(`^${name} = \\{([\\s\\S]*?)^\\}`, "m"));
  if (!m) { problems.push(`repair_log_store.py 에서 ${name} 를 찾지 못했습니다.`); return {}; }
  return Object.fromEntries([...m[1].matchAll(/"([\w-]+)":\s*"([^"]+)"/g)].map((x) => [x[1], x[2]]));
}
const same = (a, b) => JSON.stringify(Object.entries(a)) === JSON.stringify(Object.entries(b));
for (const [group, name] of [["symptom", "SYMPTOMS"], ["cause", "PARTS"], ["fix", "FIXES"]]) {
  if (!same(tags[group], pyDict(name))) problems.push(`${group}: 태그 JSON 과 repair_log_store.py ${name} 가 다릅니다.`);
}
// 사이트 폼: 해당 select 의 option 이 JSON 과 같아야 한다(fix 는 '해결 못 함'을 결과 항목으로 대신하므로 제외).
for (const [group, skip] of [["result", []], ["cause", []], ["fix", ["unresolved"]]]) {
  const sel = html.match(new RegExp(`<select name="${group}"[^>]*>([\\s\\S]*?)</select>`));
  if (!sel) { problems.push(`community-cases.html 에 ${group} 선택 상자가 없습니다.`); continue; }
  const got = Object.fromEntries([...sel[1].matchAll(/<option value="([\w-]+)">([^<]+)<\/option>/g)].map((x) => [x[1], x[2]]));
  const want = Object.fromEntries(Object.entries(tags[group]).filter(([k]) => !skip.includes(k)));
  if (!same(got, want)) problems.push(`${group}: community-cases.html 선택지가 태그 JSON 과 다릅니다.`);
}
if (problems.length) { console.error("❌ 사례 태그 불일치\n- " + problems.join("\n- ")); process.exit(1); }
console.log("✓ 사례 태그 일치 (JSON · repair_log_store.py · community-cases.html)");
