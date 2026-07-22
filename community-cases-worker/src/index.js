const ALLOWED_ORIGIN = "https://itsvc.co.kr";
const COOKIE_NAME = "itsvc_admin_session";
const SESSION_TTL_SECONDS = 60 * 60 * 8;
const MAX_TITLE = 120;
const MAX_BODY = 1200;
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const PERSONAL_INFO_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?<!\d)01[016789][ -]?\d{3,4}[ -]?\d{4}(?!\d)/,
  /(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/,
  /[A-Z]:\\Users\\[^\\\s]+/i,
  /(?:제품\s*키|serial|serial number|일련번호)\s*[:=]/i,
];

const adminPage = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>ITSVC 관리자</title><style>body{margin:0;background:#f5f8f9;color:#102a38;font:16px/1.6 system-ui,sans-serif}.wrap{width:min(1080px,calc(100% - 40px));margin:48px auto}.panel{padding:28px;border:1px solid #d9e5e8;border-radius:16px;background:#fff;box-shadow:0 12px 30px #102a3810}h1,h2,h3,p{margin-top:0}.eyebrow{color:#087ea4;font-weight:800;font-size:.8rem;letter-spacing:.1em}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.stat{padding:18px;border:1px solid #d9e5e8;border-radius:12px;background:#fff}.stat strong{display:block;font-size:1.7rem}.case{margin-top:14px;padding:20px;border:1px solid #d9e5e8;border-radius:12px}.case p{white-space:pre-wrap}.row{display:flex;gap:10px;flex-wrap:wrap}.field{display:grid;gap:7px;margin:14px 0;font-weight:700}input{min-height:42px;box-sizing:border-box;padding:9px 12px;border:1px solid #b9cdd3;border-radius:8px;font:inherit}button{min-height:42px;padding:0 16px;border:0;border-radius:8px;background:#102a38;color:#fff;font:inherit;font-weight:700;cursor:pointer}button.secondary{background:#e8eff1;color:#102a38}.muted{color:#5e7079}.error{color:#b43c2b;font-weight:700}@media(max-width:720px){.grid{grid-template-columns:repeat(2,1fr)}.wrap{width:min(100% - 28px,1080px);margin:24px auto}}</style></head><body><main class="wrap"><section class="panel" id="login"><p class="eyebrow">ITSVC ADMIN</p><h1>사이트 운영 관리</h1><p class="muted">관리자 토큰은 Worker에서 서명 세션으로 교환되며 브라우저 저장소에 보관하지 않습니다.</p><form id="login-form"><label class="field">관리자 토큰<input type="password" id="token" autocomplete="off" required></label><button>로그인</button><p id="login-message" class="error"></p></form></section><section id="dashboard" hidden><div class="panel"><div class="row" style="justify-content:space-between"><div><p class="eyebrow">OPERATIONS</p><h1>운영 대시보드</h1></div><button class="secondary" id="logout">로그아웃</button></div><div class="grid" id="stats"></div></div><section class="panel" style="margin-top:20px"><div class="row" style="justify-content:space-between"><div><h2>해결 사례 검토</h2><p class="muted">개인정보·광고·위험한 조작을 확인한 뒤 승인하세요.</p></div><button class="secondary" id="refresh">새로고침</button></div><div id="cases"></div></section><section class="panel" style="margin-top:20px"><h2>콘텐츠 운영</h2><p class="muted">콘텐츠 수정은 GitHub 변경 제안과 검토를 거쳐 배포합니다. 링크·출처·검토일 점검 기능은 다음 단계에서 이 화면에 추가합니다.</p><div class="row"><a href="https://github.com/itcode21-alt/pc-check-tools" target="_blank" rel="noopener">저장소 열기</a><a href="https://itsvc.co.kr/editorial-policy.html" target="_blank" rel="noopener">작성 기준 확인</a></div></section></section></main><script>const $=s=>document.querySelector(s);const api=(p,o={})=>fetch(p,{credentials:'same-origin',headers:{'content-type':'application/json',...(o.headers||{})},...o}).then(async r=>{const d=await r.json().catch(()=>({}));if(!r.ok)throw Error(d.message||'요청에 실패했습니다.');return d});const esc=s=>String(s||'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));async function load(){const [overview,queue]=await Promise.all([api('/admin/overview'),api('/admin/cases?status=pending')]);$('#stats').innerHTML=[['대기 사례',overview.counts.pending],['공개 사례',overview.counts.approved],['반려 사례',overview.counts.rejected],['최근 7일 제출',overview.recent_submissions]].map(([t,v])=>'<article class="stat"><span class="muted">'+t+'</span><strong>'+v+'</strong></article>').join('');$('#cases').innerHTML=queue.cases.length?queue.cases.map(x=>'<article class="case" data-id="'+esc(x.id)+'"><p class="eyebrow">'+esc(x.created_at)+'</p><h3>'+esc(x.title)+'</h3><p>'+esc(x.body)+'</p>'+(x.page_url?'<p><a href="'+esc(x.page_url)+'" target="_blank" rel="noopener">관련 페이지 확인 →</a></p>':'')+'<label class="field">검토 메모<input maxlength="300" placeholder="선택: 반려 사유 또는 검토 메모"></label><div class="row"><button data-status="approved">승인·공개</button><button class="secondary" data-status="rejected">반려</button></div></article>').join(''):'<p class="muted">검토 대기 사례가 없습니다.</p>'}async function session(){try{await load();$('#login').hidden=true;$('#dashboard').hidden=false}catch(e){}}$('#login-form').onsubmit=async e=>{e.preventDefault();try{await api('/admin/session',{method:'POST',body:JSON.stringify({token:$('#token').value})});$('#token').value='';await session()}catch(err){$('#login-message').textContent=err.message}};$('#refresh').onclick=()=>load();$('#logout').onclick=async()=>{await api('/admin/logout',{method:'POST'});location.reload()};$('#cases').onclick=async e=>{const b=e.target.closest('button[data-status]');if(!b)return;const c=b.closest('[data-id]');b.disabled=true;try{await api('/admin/cases/'+c.dataset.id,{method:'PATCH',body:JSON.stringify({status:b.dataset.status,note:c.querySelector('input').value})});await load()}catch(err){alert(err.message);b.disabled=false}};session();</script></body></html>`;

function json(body, status = 200, origin = ALLOWED_ORIGIN, extraHeaders = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": origin, "vary": "Origin", ...extraHeaders } });
}

function cors(request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== ALLOWED_ORIGIN) return null;
  return origin || ALLOWED_ORIGIN;
}

function cleanText(value) { return String(value || "").trim().replace(/\r\n?/g, "\n"); }
function hasPersonalInfo(value) { return PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(value)); }
function isSafePageUrl(value) { try { const url = new URL(value); return url.origin === ALLOWED_ORIGIN && url.pathname.endsWith(".html"); } catch { return !value; } }
function base64url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""); }
function fromBase64url(value) { const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4); return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0)); }
async function sign(value, secret) { const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return base64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)))); }
function equal(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let index = 0; index < a.length; index += 1) diff |= a.charCodeAt(index) ^ b.charCodeAt(index); return diff === 0; }
async function createSession(env) { const payload = base64url(encoder.encode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS }))); return `${payload}.${await sign(payload, env.ADMIN_SESSION_SECRET)}`; }
async function hasSession(request, env) { const value = request.headers.get("Cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1); if (!value || !env.ADMIN_SESSION_SECRET) return false; const [payload, signature] = value.split("."); if (!payload || !signature || !equal(signature, await sign(payload, env.ADMIN_SESSION_SECRET))) return false; try { return JSON.parse(decoder.decode(fromBase64url(payload))).exp > Math.floor(Date.now() / 1000); } catch { return false; } }
async function audit(env, action, targetType, targetId, detail = null) { await env.DB.prepare("INSERT INTO admin_audit_logs (id, action, target_type, target_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), action, targetType, targetId, detail, new Date().toISOString()).run(); }
function adminResponse(body, status = 200, extraHeaders = {}) { return new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow", ...extraHeaders } }); }

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = cors(request);
    if (url.pathname === "/admin") return adminResponse(adminPage);
    if (url.pathname === "/admin/session" && request.method === "POST") {
      const input = await request.json().catch(() => ({}));
      if (!env.ADMIN_TOKEN || !env.ADMIN_SESSION_SECRET || !equal(cleanText(input.token), env.ADMIN_TOKEN)) return json({ message: "관리자 토큰이 올바르지 않습니다." }, 401, origin || ALLOWED_ORIGIN);
      const session = await createSession(env);
      return json({ message: "로그인했습니다." }, 200, origin || ALLOWED_ORIGIN, { "set-cookie": `${COOKIE_NAME}=${session}; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=${SESSION_TTL_SECONDS}` });
    }
    if (url.pathname === "/admin/logout" && request.method === "POST") return json({ message: "로그아웃했습니다." }, 200, origin || ALLOWED_ORIGIN, { "set-cookie": `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/admin; Max-Age=0` });
    if (url.pathname.startsWith("/admin/")) {
      if (!(await hasSession(request, env))) return json({ message: "관리자 로그인이 필요합니다." }, 401, origin || ALLOWED_ORIGIN);
      if (url.pathname === "/admin/overview" && request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending, SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved, SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) AS rejected, SUM(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 ELSE 0 END) AS recent_submissions FROM community_cases").all();
        return json({ counts: results[0] || { pending: 0, approved: 0, rejected: 0 }, recent_submissions: results[0]?.recent_submissions || 0 }, 200, origin || ALLOWED_ORIGIN);
      }
      if (url.pathname === "/admin/cases" && request.method === "GET") {
        const status = ["pending", "approved", "rejected"].includes(url.searchParams.get("status")) ? url.searchParams.get("status") : "pending";
        const { results } = await env.DB.prepare("SELECT * FROM community_cases WHERE status = ? ORDER BY created_at ASC LIMIT 100").bind(status).all();
        return json({ cases: results || [] }, 200, origin || ALLOWED_ORIGIN);
      }
      if (request.method === "PATCH" && /^\/admin\/cases\/[\w-]+$/.test(url.pathname)) {
        const input = await request.json().catch(() => ({}));
        if (!["approved", "rejected"].includes(input.status)) return json({ message: "승인 또는 반려 상태를 선택해 주세요." }, 400, origin || ALLOWED_ORIGIN);
        const id = url.pathname.split("/").pop();
        const note = cleanText(input.note).slice(0, 300) || null;
        await env.DB.prepare("UPDATE community_cases SET status = ?, reviewed_at = ?, reviewed_note = ? WHERE id = ?").bind(input.status, new Date().toISOString(), note, id).run();
        await audit(env, input.status, "community_case", id, note);
        return json({ message: "검토 상태를 저장했습니다." }, 200, origin || ALLOWED_ORIGIN);
      }
      return json({ message: "찾을 수 없는 관리자 요청입니다." }, 404, origin || ALLOWED_ORIGIN);
    }
    if (!origin) return json({ message: "허용되지 않은 출처입니다." }, 403, ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, PATCH, OPTIONS", "access-control-allow-headers": "Content-Type", "access-control-max-age": "86400", "vary": "Origin" } });
    if (request.method === "GET" && url.pathname === "/cases") {
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 30);
      const { results } = await env.DB.prepare("SELECT id, title, body, page_url, created_at FROM community_cases WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?").bind(limit).all();
      return json({ cases: results || [] }, 200, origin);
    }
    if (request.method === "POST" && url.pathname === "/cases") {
      const input = await request.json().catch(() => ({}));
      const title = cleanText(input.title); const body = cleanText(input.body); const pageUrl = cleanText(input.page_url);
      if (input.website || input.consent !== "on") return json({ message: "제출 내용을 다시 확인해 주세요." }, 400, origin);
      if (title.length < 8 || title.length > MAX_TITLE || body.length < 80 || body.length > MAX_BODY) return json({ message: "문제 요약은 8~120자, 해결 과정은 80~1,200자로 작성해 주세요." }, 400, origin);
      if (!isSafePageUrl(pageUrl)) return json({ message: "관련 페이지는 itsvc.co.kr의 페이지 주소만 입력할 수 있습니다." }, 400, origin);
      if (hasPersonalInfo(`${title}\n${body}\n${pageUrl}`)) return json({ message: "개인정보로 보이는 내용이 있습니다. 이메일·전화번호·IP·사용자 폴더·제품 키·일련번호를 지운 뒤 제출해 주세요." }, 400, origin);
      const id = crypto.randomUUID(); const createdAt = new Date().toISOString();
      await env.DB.prepare("INSERT INTO community_cases (id, title, body, page_url, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").bind(id, title, body, pageUrl || null, createdAt).run();
      return json({ id, message: "검토 대기 상태로 저장되었습니다." }, 201, origin);
    }
    return json({ message: "찾을 수 없는 요청입니다." }, 404, origin);
  },
};
