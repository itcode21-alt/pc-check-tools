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
4. 관리자 토큰을 저장합니다. 토큰은 브라우저 코드나 Git 저장소에 넣지 않습니다.
   ```bash
   npx wrangler secret put ADMIN_TOKEN
   ```
5. Worker를 배포하고 커스텀 도메인 `community-api.itsvc.co.kr`을 연결합니다.
   ```bash
   npx wrangler deploy
   ```
6. 루트의 `community-cases-config.js`에 Worker 주소를 입력해 정적 사이트와 연결합니다.

## 검토 API

- 대기 목록: `GET /admin/cases?status=pending`
- 상태 변경: `PATCH /admin/cases/{id}` 본문 `{"status":"approved"}` 또는 `{"status":"rejected"}`
- 두 요청 모두 `Authorization: Bearer <ADMIN_TOKEN>` 헤더가 필요합니다.

관리자 검토 화면은 토큰을 노출하지 않는 별도 내부 도구에서 호출하세요. 공개 사이트 JavaScript에는 관리자 토큰을 넣으면 안 됩니다.
