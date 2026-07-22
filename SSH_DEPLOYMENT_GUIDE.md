# itsvc.co.kr SSH 배포 가이드

**작성일**: 2026-07-23  
**최종 업데이트**: 2026-07-23  
**상태**: 배포 준비 완료 ✓

---

## 빠른 시작 (Quick Start)

```bash
cd /Users/itpanda/Documents/ITSVC/pc-check-tools

# 1단계: 상태 확인
git status
git log --oneline -3

# 2단계: 변경사항 검증
node -e "new Function(require('fs').readFileSync('data.js','utf8'))" && echo '✓ data.js'
node -e "new Function(require('fs').readFileSync('games-data.js','utf8'))" && echo '✓ games-data.js'
node scripts/check-links.mjs

# 3단계: 커밋 및 푸시
git add .
git commit -m "배포: [변경 설명]"
git push origin main

# 4단계: 배포 확인 (GitHub Pages 반영까지 2-5분 대기)
# https://itsvc.co.kr 접속 후 변경 사항 확인
```

---

## SSH 원격 설정 확인

### 현재 설정 상태 ✓
```bash
$ git remote -v
origin	git@github.com:itcode21-alt/pc-check-tools.git (fetch)
origin	git@github.com:itcode21-alt/pc-check-tools.git (push)
```

**설정 완료**: SSH 키 기반 인증이 활성화되어 있으므로 `git push` 시 암호 입력이 불필요합니다.

### SSH 키 재설정 (문제 발생 시)
```bash
# SSH 키 생성
ssh-keygen -t ed25519 -C "itcode21@gmail.com"

# SSH 에이전트 시작
eval "$(ssh-agent -s)"

# 개인 키 추가
ssh-add ~/.ssh/id_ed25519

# GitHub에 공개 키 등록
# 1. ~/.ssh/id_ed25519.pub 내용 복사
# 2. GitHub Settings → SSH and GPG keys → New SSH key
# 3. 붙여넣기 후 저장
```

---

## 배포 체크리스트

모든 배포 전에 다음 순서대로 점검하세요:

### 체크 1: 코드 품질 (5분)
```bash
# 1-1. JavaScript 문법 검사
node -e "new Function(require('fs').readFileSync('data.js','utf8'))"
node -e "new Function(require('fs').readFileSync('games-data.js','utf8'))"
node -e "new Function(require('fs').readFileSync('app.js','utf8'))"

# 1-2. 깨진 링크 검사
node scripts/check-links.mjs

# 1-3. 검색 인덱스 갱신 (data.js 변경 시 필수)
node scripts/build-search-index.mjs

# 1-4. Git 상태 확인
git status  # 변경 없어야 함 (커밋 전)
```

### 체크 2: 콘텐츠 검증 (10분)
- [ ] **새 오류코드 추가 시**
  - `data.js`의 `errorCodes` 배열 확인
  - `error-codes-index.html`에 링크 추가
  - `sitemap.xml`에 URL 추가
  - `relatedSymptom`이 실제 페이지와 일치

- [ ] **새 페이지 추가 시**
  - `guides.html` 또는 `tools.html`에 링크 추가
  - 모바일 화면 테스트 (375px 너비)
  - 계산기: 입력값 범위 검증, 결과 문구 확인

- [ ] **게임 오류 수정 시**
  - `games-data.js`에서 해당 게임 데이터 확인
  - 최신 패치 정보 반영 여부

### 체크 3: 배포 실행 (2분)
```bash
# 현재 브랜치 확인
git branch  # * main 이어야 함

# 커밋 메시지 작성 (명확하게)
# 예: "기능: AI 진단 시간 초과 문제 해결"
# 예: "콘텐츠: Windows 11 24H2 업데이트 오류 추가"
# 예: "버그: 검색 인덱스 중복 항목 제거"

git add .
git commit -m "배포: [변경 설명]"
git push origin main

# 푸시 확인
git log --oneline -1  # 최신 커밋 확인
```

### 체크 4: 배포 후 검증 (10분) ★ 필수

**GitHub Pages 반영 대기**: 약 2-5분

```bash
# 4-1. 메인 페이지 접속
# https://itsvc.co.kr

# 4-2. 최근 변경사항 확인
# - 새 오류코드: 검색창에서 찾기
# - 새 페이지: 가이드/도구 섹션에서 확인
# - 링크: 클릭해서 페이지 로드 확인

# 4-3. 진단 도구 동작 확인
# https://itsvc.co.kr/diagnostic
# - "증상" 탭에서 검색 기능 테스트
# - AI 진단 테스트 (ai.itsvc.co.kr 연결 확인)

# 4-4. 계산기 테스트 (변경된 계산기만)
# https://itsvc.co.kr/psu-calculator.html 등
# - 입력값 입력
# - 결과 출력 확인

# 4-5. 검색 기능 테스트
# 헤더 검색창에서 새로운 오류코드나 증상 검색
```

### 체크 5: 배포 기록 (1분)
```markdown
## 배포 기록

**배포 일시**: 2026-07-23 14:30  
**브랜치**: main  
**커밋**: abc1234d...  
**변경 내용**:
- 오류코드 0x12345678 추가
- Windows 11 24H2 업데이트 정보 추가

**검증 결과**:
- ✓ 검색 기능 동작
- ✓ 진단 도구 AI 응답 확인
- ✓ 모바일 화면 (iPhone SE 기준)
- ✓ Cloudflare 캐시 반영 (약 3분)

**이슈 발견**: 없음
**다음 확인**: 수요일 콘텐츠 보완 일정 예정
```

---

## 배포 후 문제 발생 시

### 증상 1: GitHub Pages에 반영되지 않음
```bash
# 1. 커밋이 main 브랜치에 있는지 확인
git log --oneline -3

# 2. GitHub에 푸시되었는지 확인
git branch -v  # origin/main과 비교

# 3. 강제 푸시 (이전 커밋이 손실되지 않는 경우에만)
git push -u origin main

# 4. GitHub Actions 상태 확인
# GitHub 저장소 → Actions → 최신 워크플로우 확인
# https://github.com/itcode21-alt/pc-check-tools/actions
```

### 증상 2: Cloudflare 캐시 문제
GitHub Pages에는 반영되었으나 itsvc.co.kr에서 이전 버전이 보일 때:

```bash
# 수동 캐시 무효화 (Cloudflare 대시보드)
# 1. Cloudflare 로그인
# 2. itsvc.co.kr 선택
# 3. Caching → Purge Cache → Purge Everything
# 재시작: 약 1분
```

### 증상 3: 검색 인덱스 오류
검색창에서 새로운 오류코드가 나타나지 않을 때:

```bash
# 검색 인덱스 재생성
node scripts/build-search-index.mjs

# 재커밋 및 푸시
git add search-index.js
git commit -m "배포: 검색 인덱스 갱신"
git push origin main
```

### 증상 4: JavaScript 오류 (브라우저 콘솔)
- [ ] `app.js` 또는 `data.js` 문법 오류 확인
- [ ] 브라우저 개발자 도구 → Console에서 오류 메시지 확인
- [ ] 해당 파일 수정 후 다시 배포

### 증상 5: AI 진단 기능 안 됨
- [ ] ai.itsvc.co.kr 서버 상태 확인
- [ ] `/api/health` 엔드포인트 테스트: `curl https://ai.itsvc.co.kr/api/health`
- [ ] `app.js`에서 규칙 기반 폴백으로 자동 전환됨 (사이트는 정상 작동)

---

## 주간 배포 스케줄

### 월요일 - 품질 점검
- 상위 유입 페이지 확인 (Search Console)
- 내부 링크 검증
- 404 에러 페이지 모니터링

### 수요일 - 콘텐츠 보완
- 반복 문의 오류코드 추가
- 증상 페이지 업데이트
- 새 가이드 출시

### 금요일 - 기능/수익 점검
- 계산기 입력값·결과 검증
- 모바일 화면 테스트
- 제휴 링크 성능 분석

### 배포 타이밍
- **일반 콘텐츠**: 즉시 배포 (검증 후)
- **AI 서버 변경**: 별도 일정 조율
- **주요 기능**: 화요일/목요일 (사용자 활동이 적을 때)

---

## 파일별 배포 영향도

| 파일 | 영향 범위 | 배포 필수 검사 |
|------|---------|--------------|
| `data.js` | 높음 (전체 진단) | 문법 + 링크 + 검색 인덱스 |
| `games-data.js` | 중간 (게임 진단) | 문법 + 게임 페이지 링크 |
| `app.js` | 높음 (UI 동작) | 문법 + 모바일 테스트 |
| `style.css` | 중간 (스타일) | 모바일 화면 + 접근성 |
| HTML 페이지 | 낮음 (개별 페이지) | 링크 + sitemap.xml |
| `search-index.js` | 중간 (검색) | 자동 생성 (수정 금지) |
| `sitemap.xml` | 낮음 (SEO) | SEO 영향도 낮음 |

---

## AI 서버 배포 (별도 진행)

정적 페이지 배포와는 별개로 진행:

```bash
cd ai-service/

# 1. 변경사항 확인
git status

# 2. Python 의존성 확인
pip install -r requirements.txt

# 3. 로컬 테스트
python app.py  # localhost:5000 시작

# 4. 배포
./deploy.sh

# 5. 상태 확인
curl https://ai.itsvc.co.kr/api/health
```

---

## 자동화 권장사항 (구현 예정)

### GitHub Actions 워크플로우
현재: 수동 배포  
목표: 커밋 시 자동 검증 + 배포

```yaml
# .github/workflows/deploy.yml (예시)
name: Deploy
on: [push]
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate JS
        run: |
          node -e "new Function(require('fs').readFileSync('data.js','utf8'))"
      - name: Check links
        run: node scripts/check-links.mjs
      - name: Build search index
        run: node scripts/build-search-index.mjs
  # GitHub Pages 자동 배포 (기본 설정)
```

---

## 배포 히스토리

| 날짜 | 커밋 | 변경사항 | 상태 |
|-----|------|---------|------|
| 2026-07-23 | 70b4ead | 네비게이션 드롭다운 중복 링크 제거 | ✓ 완료 |
| 2026-07-21 | 20a87a0 | data.js/app.js 캐시버스팅 버전 파편화 해소 | ✓ 완료 |
| 2026-07-21 | b7a015e | 업데이트 트래커 배지 색상 가독성, Gemini 스크립트 개선 | ✓ 완료 |
| 2026-07-20 | 9d98bf7 | 오류코드 7개 데이터 보강 | ✓ 완료 |

---

## 참고 문서

- **배포 체크리스트**: `DEPLOYMENT_CHECKLIST.md`
- **미구현 기능**: `UNIMPLEMENTED_FEATURES.md`
- **보완 콘텐츠**: `SUPPLEMENTARY_CONTENT.md`
- **운영 계획**: `ITSVC_OPERATIONS_PLAN.md`
- **운영 매뉴얼**: `OPERATIONS.md`

---

## 연락처 및 지원

### SSH 키 문제
```bash
ssh -T git@github.com  # GitHub 연결 테스트
```

### 배포 실패
1. 커밋 ID 확인: `git log --oneline -1`
2. GitHub Actions 상태 확인: `itcode21-alt/pc-check-tools/actions`
3. 이전 커밋으로 롤백: `git revert [커밋ID]`

### AI 서버 문제
```bash
cd ai-service/
tail -f logs/app.log  # 서버 로그 확인
curl -v https://ai.itsvc.co.kr/api/health  # 헬스 체크
```

---

**마지막 갱신**: 2026-07-23 by Claude Code  
**배포 상태**: ✅ 준비 완료
