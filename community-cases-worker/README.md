# 해결 사례 Worker·D1 배포

1. Cloudflare에서 D1 데이터베이스를 만듭니다.
   ```bash
   cd community-cases-worker
   npx wrangler d1 create itsvc-community-cases
   ```
2. 출력된 `database_id`를 `wrangler.toml`의 `REPLACE_WITH_D1_DATABASE_ID`에 넣습니다.
3. 스키마를 적용합니다.
   ```bash
   npx wrangler d1 execute itsvc-community-cases --remote --file=./schema.sql
   ```
4. 관리자 로그인 토큰과 세션 서명 비밀값을 저장합니다. 두 값 모두 브라우저 코드나 Git 저장소에 넣지 않습니다.
   ```bash
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put ADMIN_SESSION_SECRET
   ```
5. Worker를 배포하고 커스텀 도메인 `community-api.itsvc.co.kr`을 연결합니다.
   ```bash
   npx wrangler deploy
   ```
6. 루트의 `community-cases-config.js`에 Worker 주소를 입력해 정적 사이트와 연결합니다. 검토는 Worker의 `/admin` 화면에서 진행합니다. 로그인 토큰은 한 번만 전송되고, 이후에는 8시간 만료의 HTTP 전용 세션 쿠키를 사용합니다.

## 관리자 화면 및 검토 API

- 관리자 화면: `https://<worker-url>/admin`
- 로그인: `POST /admin/session` 본문 `{"token":"<ADMIN_TOKEN>"}`
- 로그아웃: `POST /admin/logout`
- 운영 요약: `GET /admin/overview`
- 대기 목록: `GET /admin/cases?status=pending`
- 상태 변경: `PATCH /admin/cases/{id}` 본문 `{"status":"approved"}` 또는 `{"status":"rejected"}`
- 로그인 이후의 관리자 API는 HTTP 전용 세션 쿠키가 필요하며, 상태 변경 내역은 `admin_audit_logs`에 기록됩니다.

정적 사이트의 `community-cases-admin.html`은 Worker 관리자 화면으로 이동하는 안내 페이지입니다. 공개 사이트 JavaScript에는 관리자 토큰 또는 세션 비밀값을 넣으면 안 됩니다. 운영 환경에서는 Cloudflare Access로 `/admin` 접근을 추가 제한하는 방식을 권장합니다.
