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

## 사례 기록 항목 추가(2026-11 업데이트)

기존 DB에 결과·원인·해결 방식·증상·카테고리·운영자 코멘트 열을 추가합니다. **코드를 배포하기 전에** 한 번만 실행합니다(이미 실행했다면 "duplicate column" 오류가 나므로 다시 실행하지 않습니다).

```bash
cd community-cases-worker
npx wrangler d1 execute itsvc-community-cases --remote --file=./migrations/001_case_fields.sql
npx wrangler deploy
```

- 태그 목록 원본은 저장소 루트의 `community-cases-tags.json`입니다. Worker가 값을 검증하고, 사이트 폼과 운영자 수리 기록(`ai-service/repair_log_store.py`)이 같은 키를 씁니다. 목록을 바꾸면 `node scripts/check-case-tags.mjs`로 세 곳이 맞는지 확인합니다.
- 공개 API: `GET /cases?category=&result=&cause=&fix=&symptom=&limit=&offset=`, `GET /cases/stats`(태그별 공개 사례 수).
- 관리자 화면에서 승인 전에 항목·운영자 코멘트를 고칠 수 있고, 공개 중인 사례도 상태 필터로 열어 항목만 저장할 수 있습니다.

## 관리자 화면 및 검토 API

- 관리자 화면: `https://<worker-url>/admin`
- 로그인: `POST /admin/session` 본문 `{"token":"<ADMIN_TOKEN>"}`
- 로그아웃: `POST /admin/logout`
- 운영 요약: `GET /admin/overview`
- 대기 목록: `GET /admin/cases?status=pending`
- 상태 변경·항목 수정: `PATCH /admin/cases/{id}` 본문 `{"status":"approved"|"rejected"(생략하면 항목만 저장), "category", "result", "symptom", "cause", "fix", "operator_comment", "note"}`
- 로그인 이후의 관리자 API는 HTTP 전용 세션 쿠키가 필요하며, 상태 변경 내역은 `admin_audit_logs`에 기록됩니다.

정적 사이트의 `community-cases-admin.html`은 Worker 관리자 화면으로 이동하는 안내 페이지입니다. 공개 사이트 JavaScript에는 관리자 토큰 또는 세션 비밀값을 넣으면 안 됩니다. 운영 환경에서는 Cloudflare Access로 `/admin` 접근을 추가 제한하는 방식을 권장합니다.
