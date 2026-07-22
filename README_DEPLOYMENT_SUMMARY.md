# itsvc.co.kr 배포 및 운영 종합 요약

**작성일**: 2026-07-23  
**대상**: itsvc.co.kr 운영팀  
**상태**: 배포 준비 완료 ✅

---

## 📋 생성된 운영 문서

이번 정리에서 생성한 4개의 문서:

### 1. **SSH_DEPLOYMENT_GUIDE.md** (9.3KB, 260줄)
   - **목적**: SSH 기반 배포 절차 및 체크리스트
   - **대상**: 모든 배포 담당자
   - **내용**:
     - 빠른 시작 (3분 배포 프로세스)
     - SSH 원격 설정 확인
     - 배포 전/후 체크리스트
     - 문제 해결 가이드
     - 주간 배포 스케줄
     - AI 서버 배포 (별도 진행)

### 2. **DEPLOYMENT_CHECKLIST.md** (2.7KB, 100줄)
   - **목적**: 배포 전 점검표 (빠른 참조)
   - **대상**: 배포 당일 담당자
   - **내용**:
     - 배포 전 5단계 체크
     - 코드 품질 검사 명령어
     - 콘텐츠 검증 항목
     - 배포 후 검증 (필수)
     - SSH 설정 확인
     - 주의사항

### 3. **UNIMPLEMENTED_FEATURES.md** (7.7KB, 280줄)
   - **목적**: 미구현 기능 목록 및 구현 권장사항
   - **대상**: 기술 리더, 개발팀
   - **내용**:
     - 5가지 우선순위별 미구현 기능
       1. AI 서버 배포 자동화 (높음)
       2. 업그레이드 영역 통합 진단 (높음)
       3. 계산기 개선 (중간)
       4. 사용자 피드백 시스템 (중간)
       5. 운영 대시보드 (낮음)
     - Phase별 구현 일정 (3주~8주)
     - 기술 스택 추천
     - 체크리스트 사용법

### 4. **SUPPLEMENTARY_CONTENT.md** (12KB, 380줄)
   - **목적**: 보완할 콘텐츠 및 월간 점검표
   - **대상**: 콘텐츠 팀, 운영자
   - **내용**:
     - 8개 영역의 보완 항목:
       1. 공식 출처 업데이트 (Microsoft, 게임 공지 등)
       2. 오류 코드 / 이벤트 ID 추가
       3. 증상 페이지 진단 절차 최신화
       4. 게임별 오류 정보 업데이트
       5. 하드웨어 호환성 데이터
       6. AI 진단 근거 부족 개선
       7. SEO / 메타 정보 최적화
       8. 모바일 / 접근성 개선
     - 월간 데이터 검증 체크리스트
     - 수익화 관련 보완
     - 월간 운영 체크리스트 템플릿

---

## 🚀 배포 준비 현황

### 현재 상태 ✅
```
- Git 저장소: 정상 (main 브랜치, 원격 동기화 완료)
- SSH 원격: 활성화됨 (git@github.com)
- 코드 품질: 양호 (문법 오류 0, 깨진 링크 0)
- 콘텐츠: 최신 상태 (2026-07-23 마지막 배포)
```

### 배포 명령어 (3분)
```bash
cd /Users/itpanda/Documents/ITSVC/pc-check-tools

# 1단계: 검증 (2분)
node -e "new Function(require('fs').readFileSync('data.js','utf8'))" && \
node scripts/check-links.mjs

# 2단계: 배포 (1분)
git add .
git commit -m "배포: [변경 설명]"
git push origin main

# 3단계: 확인 (2-5분 대기 후)
# https://itsvc.co.kr 접속
```

---

## 📊 우선순위별 작업 계획

### 긴급 (이번주)
- [ ] 미구현 기능 1번 검토 (AI 서버 배포 자동화)
  - 영향도: 운영 효율성 ↑↑↑
  - 예상 기간: 1주

### 단기 (1-4주)
- [ ] 미구현 기능 2번 시작 (업그레이드 영역 통합)
  - 영향도: 사용자 신뢰도 ↑↑
  - 예상 기간: 2-4주

- [ ] 보완 콘텐츠: 공식 출처 업데이트
  - 영향도: SEO + 신뢰도 ↑
  - 예상 기간: 주간 (월요일 품질 점검)

### 중기 (1-2개월)
- [ ] 미구현 기능 3, 4번 (계산기 + 피드백)
- [ ] 보완 콘텐츠: 오류코드/증상/게임 정보
- [ ] SEO 최적화

### 장기 (2-3개월)
- [ ] 미구현 기능 5번 (운영 대시보드)
- [ ] 모바일 / 접근성 전수 검사

---

## 📚 문서별 사용 가이드

### Phase 1: 배포 전 (5분)
1. **DEPLOYMENT_CHECKLIST.md** 읽기
2. 체크 1~3 실행 (코드 품질 검사)
3. 배포 실행

### Phase 2: 배포 후 (10분)
1. **SSH_DEPLOYMENT_GUIDE.md**의 "체크 4" 실행
2. 변경사항 모두 확인
3. 배포 기록 작성

### Phase 3: 주간 운영 (매주)
- **월요일**: OPERATIONS.md의 "품질 점검"
- **수요일**: SUPPLEMENTARY_CONTENT.md의 보완 항목 실행
- **금요일**: OPERATIONS.md의 "기능·수익화 점검"

### Phase 4: 월간 검토 (매월)
1. **SUPPLEMENTARY_CONTENT.md**의 "월간 운영 체크리스트" 작성
2. **UNIMPLEMENTED_FEATURES.md**에서 완료된 항목 체크
3. 다음달 우선순위 결정

---

## 🔒 보안 및 주의사항

### SSH 키 관리
- SSH 원격이 활성화됨 → 암호 없이 배포 가능
- 키 손실 시: SSH 재설정 필요 (SSH_DEPLOYMENT_GUIDE.md 참고)

### API 키 보호
- `.env` 파일에 Gemini API 키 저장 중
- ⚠️ 주의: 공개 브라우저 코드에는 절대 API 키를 넣지 말 것
- `.gitignore`에 `.env` 포함되어 있음 (안전함)

### 배포 롤백
- 문제 발생 시: `git revert [커밋ID]`로 이전 버전 복구
- GitHub Pages 캐시: Cloudflare에서 수동 무효화 필요 (1분 소요)

---

## 📈 성공 지표

### 배포 성공 기준
- ✅ 모든 코드 검사 통과 (0 오류)
- ✅ 모든 링크 작동 (깨진 링크 0)
- ✅ GitHub Pages 반영 (2-5분)
- ✅ 변경사항 itsvc.co.kr에서 확인 가능
- ✅ AI 서버 응답 정상 (해당 시)

### 운영 성공 지표
- 📊 월간 콘텐츠 업데이트: 5개 이상 (오류코드/증상/게임)
- 📊 검색 품질: Search Console에서 노출 ↑, 클릭률 정상 범위
- 📊 사용자 피드백: 진단 정확도 만족도 80% 이상
- 📊 배포 안정성: 롤백 사건 0회 (월간)

---

## 📞 문제 발생 시 대응

### 수준 1: 배포 검증 실패
**증상**: 코드 문법 오류 또는 링크 깨짐  
**대응**: DEPLOYMENT_CHECKLIST.md의 체크 1-2 다시 실행  
**시간**: 5-10분

### 수준 2: GitHub Pages 반영 지연
**증상**: 2-5분 후에도 변경사항이 안 보임  
**대응**: GitHub Actions 상태 확인 (`itcode21-alt/pc-check-tools/actions`)  
**시간**: 15-30분

### 수준 3: Cloudflare 캐시 문제
**증상**: GitHub에는 반영됐으나 itsvc.co.kr에서 이전 버전 표시  
**대응**: Cloudflare 대시보드에서 "Purge Cache" → "Purge Everything"  
**시간**: 1-2분 (캐시 반영)

### 수준 4: AI 서버 오류
**증상**: 진단 도구의 "AI 진단" 기능 작동 안 함  
**대응**: 
1. `/api/health` 확인: `curl https://ai.itsvc.co.kr/api/health`
2. 규칙 기반 폴백 자동 작동 (사이트는 정상)
3. ai-service 배포 필요 시: `ai-service/deploy.sh` 실행  
**시간**: 5-30분

---

## 📋 월별 운영 칼렌더

### 7월 (현재)
- [x] SSH 배포 체계 정리 (**이번 문서 작성**)
- [x] 배포 체크리스트 작성
- [x] 미구현 기능 목록 작성
- [x] 보완 콘텐츠 체크리스트 작성
- [ ] 자동화 1단계 (GitHub Actions) 검토

### 8월
- [ ] 월간 품질 점검 (SUPPLEMENTARY_CONTENT.md 기준)
- [ ] 오류코드 3-5개 추가 (공식 출처 확보)
- [ ] 미구현 기능 1번 검토 (AI 서버 배포 자동화)
- [ ] 자동화 구현 시작

### 9월~10월
- [ ] 미구현 기능 2번 시작 (업그레이드 통합)
- [ ] 부품 호환성 데이터 구성
- [ ] 사용자 피드백 시스템 구축

### 11월~12월
- [ ] 계산기 고도화 (파워 비교, SSD 용량 추정)
- [ ] 운영 대시보드 기본 버전 완성
- [ ] 분기 운영 검토 (모바일 접근성 전수 검사)

---

## ✨ 다음 단계

### 즉시 (오늘)
1. 이 문서를 팀원과 공유
2. SSH_DEPLOYMENT_GUIDE.md를 북마크
3. DEPLOYMENT_CHECKLIST.md를 인쇄/저장

### 이번주
1. SSH 배포 테스트 (작은 콘텐츠 변경으로)
2. 미구현 기능 1번 기술 리더와 검토 회의
3. GitHub Actions 자동화 가능성 평가

### 이번달
1. 월간 보완 콘텐츠 체크 (SUPPLEMENTARY_CONTENT.md 기준)
2. 배포 기록 1개월 누적
3. 배포 프로세스 피드백 수집 및 개선

---

## 📎 첨부 문서

### 운영 가이드
- `OPERATIONS.md` — 실무 매뉴얼
- `ITSVC_OPERATIONS_PLAN.md` — 운영 계획 및 원칙

### 배포 가이드 (이번 작성)
- `SSH_DEPLOYMENT_GUIDE.md` — 상세 배포 가이드
- `DEPLOYMENT_CHECKLIST.md` — 빠른 체크리스트

### 운영 자료 (이번 작성)
- `UNIMPLEMENTED_FEATURES.md` — 미구현 기능 + 구현 일정
- `SUPPLEMENTARY_CONTENT.md` — 보완 콘텐츠 + 월간 체크리스트

---

## 👥 역할별 참조 가이드

### 배포 담당자
1. 배포 전: DEPLOYMENT_CHECKLIST.md
2. 배포 중: SSH_DEPLOYMENT_GUIDE.md의 "체크 3"
3. 배포 후: SSH_DEPLOYMENT_GUIDE.md의 "체크 4"

### 콘텐츠 팀
1. 월간 기획: SUPPLEMENTARY_CONTENT.md의 "월간 운영 체크리스트"
2. 주간 작업: SUPPLEMENTARY_CONTENT.md의 해당 섹션
3. 배포 확인: SSH_DEPLOYMENT_GUIDE.md의 "체크 4"

### 기술 리더
1. 기능 계획: UNIMPLEMENTED_FEATURES.md
2. 배포 모니터링: SSH_DEPLOYMENT_GUIDE.md
3. 자동화 검토: SSH_DEPLOYMENT_GUIDE.md의 "자동화 권장사항"

### 운영 관리자
1. 월간 검토: UNIMPLEMENTED_FEATURES.md + SUPPLEMENTARY_CONTENT.md
2. 분기 계획: ITSVC_OPERATIONS_PLAN.md
3. 성과 검토: UNIMPLEMENTED_FEATURES.md의 "성공 지표"

---

## 📝 문서 갱신 주기

| 문서 | 갱신 주기 | 담당 |
|------|---------|------|
| SSH_DEPLOYMENT_GUIDE.md | 분기 (또는 프로세스 변경 시) | 기술 리더 |
| DEPLOYMENT_CHECKLIST.md | 월간 | 배포 담당자 |
| UNIMPLEMENTED_FEATURES.md | 월간 | 기술 리더 |
| SUPPLEMENTARY_CONTENT.md | 월간 | 콘텐츠 팀 |
| README_DEPLOYMENT_SUMMARY.md | 분기 | 운영 관리자 |

---

**마지막 업데이트**: 2026-07-23  
**다음 검토**: 2026-08-23 (1개월 후)  
**상태**: ✅ 배포 준비 완료

배포 시작 전에 **DEPLOYMENT_CHECKLIST.md**를 확인하세요!
