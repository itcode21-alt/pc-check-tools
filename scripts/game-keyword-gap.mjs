// 게임 오류 검색어 갭 점검: 자동완성/연관 검색어를 수집해 사이트에 없는 질의를 docs/game-keyword-gap.md 로 기록한다.
// 사용: node scripts/game-keyword-gap.mjs   (네트워크 필요, 약 3~5분)
// 수집 엔진: 네이버 자동완성, 구글 자동완성, 유튜브 자동완성, DuckDuckGo 자동완성 (Bing/다음/줌/네이트는 응답 없음 확인됨)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seeds = JSON.parse(fs.readFileSync(path.join(root, 'docs/game-keyword-seeds.json'), 'utf8'));
const OUT = path.join(root, 'docs/game-keyword-gap.md');
const STATE = path.join(root, 'docs/game-keyword-gap-state.json');
const enc = encodeURIComponent;
const UA = { 'User-Agent': 'Mozilla/5.0' };

const engines = {
  naver: async q => {
    const d = await j(`https://ac.search.naver.com/nx/ac?q=${enc(q)}&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8&st=100`);
    return (d.items?.[0] || []).map(x => x[0]);
  },
  google: async q => (await j(`https://suggestqueries.google.com/complete/search?client=firefox&hl=ko&q=${enc(q)}`))[1] || [],
  youtube: async q => {
    const t = await (await fetch(`https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&hl=ko&q=${enc(q)}`, { headers: UA, signal: AbortSignal.timeout(10000) })).text();
    const m = t.match(/\((\[.*\])\)/s); return m ? (JSON.parse(m[1])[1] || []).map(x => x[0]) : [];
  },
  duckduckgo: async q => ((await j(`https://duckduckgo.com/ac/?q=${enc(q)}&type=list`))[1] || []),
};
async function j(u) { const r = await fetch(u, { headers: UA, signal: AbortSignal.timeout(10000) }); return r.json(); }

// 1) 수집
const found = new Map(); // query -> {game, engines:Set}
const jobs = [];
for (const [g, id] of Object.entries(seeds.games)) for (const s of seeds.suffixes) jobs.push([g, id, `${g} ${s}`]);
let engineOk = Object.fromEntries(Object.keys(engines).map(k => [k, 0]));
let idx = 0;
async function worker() {
  while (idx < jobs.length) {
    const [g, id, q] = jobs[idx++];
    for (const [name, fn] of Object.entries(engines)) {
      try { for (const r of await fn(q)) { const k = r.trim(); if (!k) continue; const e = found.get(k) || { game: id, alias: g, engines: new Set() }; e.engines.add(name); found.set(k, e); engineOk[name]++; } } catch {}
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
if (found.size < 200) { console.error('수집량 부족(' + found.size + ') — 네트워크 차단 가능성. 기록하지 않음'); process.exit(2); }

// 2) 사이트 코퍼스
let txt = fs.readFileSync(path.join(root, 'games-data.js'), 'utf8');
for (const f of fs.readdirSync(root)) if (/^(game-|error-code-).*\.html$/.test(f) || f === 'games-diagnostic.html') txt += ' ' + fs.readFileSync(path.join(root, f), 'utf8').replace(/<[^>]+>/g, ' ');
const norm = s => s.replace(/\s+/g, '').toLowerCase();
const corpus = norm(txt);

// 3) 대조
const ERR = /오류|에러|error|실행|접속|튕|렉|랙|프레임|강제|로그인|설치|패치|안\s?됨|안\s?돼|안\s?나|끊|멈춤|먹통|팅김|코드|\d{3,}|해결/;
const GEN = new Set('오류 에러 코드 오류코드 에러코드 에러번호 오류번호 해결 해결법 방법 실행 안됨 안돼 안될때 발생 접속 설치 패치 로그인 튕김 강제종료 렉 프레임 드랍 화면 안나옴 문제 원인 이유 디시 후기 error'.split(' '));
const noise = new Set(seeds.noise_tokens);
const aliases = Object.keys(seeds.games).sort((a, b) => b.length - a.length);
const gaps = [];
let total = 0, covered = 0;
for (const [q, v] of found) {
  if (!ERR.test(q)) continue;
  const g = aliases.find(a => norm(q).startsWith(norm(a)));
  if (!g) continue;
  const key = q.replace(g, ' ').trim().split(/\s+/).filter(t => t && !GEN.has(t));
  if (key.some(t => noise.has(t))) continue;
  total++;
  if (key.every(t => corpus.includes(norm(t)))) covered++;
  else gaps.push({ q, game: v.game, engines: [...v.engines].sort(), code: key.some(t => /\d/.test(t) || /^0x/i.test(t)), key });
}
gaps.sort((a, b) => (b.code - a.code) || (b.engines.length - a.engines.length) || a.q.localeCompare(b.q, 'ko'));

// 4) 이전 실행과 비교해 신규 표시
let prev = {}; try { prev = JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch {}
const prevSet = new Set(prev.gaps || []);
const today = new Date().toISOString().slice(0, 10);
const fresh = gaps.filter(g => !prevSet.has(g.q));
fs.writeFileSync(STATE, JSON.stringify({ date: today, gaps: gaps.map(g => g.q) }, null, 0));

const row = g => `| ${g.q} | ${g.game} | ${g.engines.join('·')} | ${g.key.join(' ')} |`;
const head = '| 검색어 | 게임 | 엔진 | 사이트에 없는 단어 |\n|---|---|---|---|';
const md = `# 게임 오류 검색어 갭 점검

마지막 점검: ${today} · 수집 ${found.size}건 · 오류 관련 ${total}건 중 사이트에 있는 것 ${covered}건, 누락 후보 ${gaps.length}건 · 이번에 새로 나온 후보 ${fresh.length}건
엔진별 수집 횟수: ${Object.entries(engineOk).map(([k, n]) => k + ' ' + n).join(', ')}

방법: 게임명×오류 접미어 조합을 각 엔진 자동완성에 넣고, 나온 문구의 핵심 단어가 games-data.js·game-*.html·error-code-*.html 본문에 있는지 확인한다. 단어 단위 일치라서 같은 단어가 다른 맥락에 있으면 "있음"으로 잘못 판단될 수 있고, 게임 밖 말(캐릭터 이름 등)이 섞일 수 있다. 추가 전 공식 문서로 확인한다. 자동완성 순위는 검색량이 아니라 인기도 신호다.

## 이번에 새로 나온 후보 (${fresh.length})
${fresh.length ? head + '\n' + fresh.slice(0, 80).map(row).join('\n') : '없음'}

## 코드·번호가 있는 누락 후보 (우선 확인)
${head}
${gaps.filter(g => g.code).slice(0, 120).map(row).join('\n')}

## 그 외 누락 후보 (상위 80)
${head}
${gaps.filter(g => !g.code).slice(0, 80).map(row).join('\n')}
`;
fs.writeFileSync(OUT, md);
console.log(JSON.stringify({ collected: found.size, total, covered, gaps: gaps.length, fresh: fresh.length, engineOk }));
