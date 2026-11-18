-- 해결 사례 기록 항목 추가(결과·태그·운영자 코멘트). 코드를 배포하기 전에 한 번만 실행합니다.
-- npx wrangler d1 execute itsvc-community-cases --remote --file=./migrations/001_case_fields.sql
ALTER TABLE community_cases ADD COLUMN category TEXT;
ALTER TABLE community_cases ADD COLUMN result TEXT;
ALTER TABLE community_cases ADD COLUMN symptom TEXT;
ALTER TABLE community_cases ADD COLUMN cause TEXT;
ALTER TABLE community_cases ADD COLUMN fix TEXT;
ALTER TABLE community_cases ADD COLUMN operator_comment TEXT;
