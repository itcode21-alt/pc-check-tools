const ALLOWED_ORIGIN = "https://itsvc.co.kr";
const MAX_TITLE = 120;
const MAX_BODY = 1200;
const PERSONAL_INFO_PATTERNS = [
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
  /(?<!\d)01[016789][ -]?\d{3,4}[ -]?\d{4}(?!\d)/,
  /(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)/,
  /[A-Z]:\\Users\\[^\\\s]+/i,
  /(?:제품\s*키|serial|serial number|일련번호)\s*[:=]/i,
];

function json(body, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": origin, "vary": "Origin" } });
}

function cors(request) {
  const origin = request.headers.get("Origin");
  if (origin && origin !== ALLOWED_ORIGIN) return null;
  return origin || ALLOWED_ORIGIN;
}

function cleanText(value) {
  return String(value || "").trim().replace(/\r\n?/g, "\n");
}

function isSafePageUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.origin === ALLOWED_ORIGIN && url.pathname.endsWith(".html");
  } catch { return false; }
}

function hasPersonalInfo(value) {
  return PERSONAL_INFO_PATTERNS.some((pattern) => pattern.test(value));
}

function requireAdmin(request, env) {
  return Boolean(env.ADMIN_TOKEN) && request.headers.get("Authorization") === `Bearer ${env.ADMIN_TOKEN}`;
}

export default {
  async fetch(request, env) {
    const origin = cors(request);
    if (!origin) return json({ message: "허용되지 않은 출처입니다." }, 403, ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { headers: { "access-control-allow-origin": origin, "access-control-allow-methods": "GET, POST, PATCH, OPTIONS", "access-control-allow-headers": "Authorization, Content-Type", "access-control-max-age": "86400", "vary": "Origin" } });
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/cases") {
      const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 12, 1), 30);
      const { results } = await env.DB.prepare("SELECT id, title, body, page_url, created_at FROM community_cases WHERE status = 'approved' ORDER BY created_at DESC LIMIT ?").bind(limit).all();
      return json({ cases: results || [] }, 200, origin);
    }

    if (request.method === "POST" && url.pathname === "/cases") {
      const input = await request.json().catch(() => ({}));
      const title = cleanText(input.title);
      const body = cleanText(input.body);
      const pageUrl = cleanText(input.page_url);
      if (input.website || input.consent !== "on") return json({ message: "제출 내용을 다시 확인해 주세요." }, 400, origin);
      if (title.length < 8 || title.length > MAX_TITLE || body.length < 80 || body.length > MAX_BODY) return json({ message: "문제 요약은 8~120자, 해결 과정은 80~1,200자로 작성해 주세요." }, 400, origin);
      if (!isSafePageUrl(pageUrl)) return json({ message: "관련 페이지는 itsvc.co.kr의 페이지 주소만 입력할 수 있습니다." }, 400, origin);
      if (hasPersonalInfo(`${title}\n${body}\n${pageUrl}`)) return json({ message: "개인정보로 보이는 내용이 있습니다. 이메일·전화번호·IP·사용자 폴더·제품 키·일련번호를 지운 뒤 제출해 주세요." }, 400, origin);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await env.DB.prepare("INSERT INTO community_cases (id, title, body, page_url, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)").bind(id, title, body, pageUrl || null, createdAt).run();
      return json({ id, message: "검토 대기 상태로 저장되었습니다." }, 201, origin);
    }

    if (request.method === "GET" && url.pathname === "/admin/cases") {
      if (!requireAdmin(request, env)) return json({ message: "관리자 인증이 필요합니다." }, 401, origin);
      const status = ["pending", "approved", "rejected"].includes(url.searchParams.get("status")) ? url.searchParams.get("status") : "pending";
      const { results } = await env.DB.prepare("SELECT * FROM community_cases WHERE status = ? ORDER BY created_at ASC LIMIT 100").bind(status).all();
      return json({ cases: results || [] }, 200, origin);
    }

    if (request.method === "PATCH" && /^\/admin\/cases\/[\w-]+$/.test(url.pathname)) {
      if (!requireAdmin(request, env)) return json({ message: "관리자 인증이 필요합니다." }, 401, origin);
      const input = await request.json().catch(() => ({}));
      if (!["approved", "rejected"].includes(input.status)) return json({ message: "승인 또는 반려 상태를 선택해 주세요." }, 400, origin);
      const id = url.pathname.split("/").pop();
      await env.DB.prepare("UPDATE community_cases SET status = ?, reviewed_at = ?, reviewed_note = ? WHERE id = ?").bind(input.status, new Date().toISOString(), cleanText(input.note).slice(0, 300) || null, id).run();
      return json({ message: "검토 상태를 저장했습니다." }, 200, origin);
    }
    return json({ message: "찾을 수 없는 요청입니다." }, 404, origin);
  },
};
