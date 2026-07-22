# itsvc.co.kr SSH 배포 체크리스트

**마지막 배포**: 2026-07-23 (현재 main 브랜치는 원격과 동기화 완료)

## 배포 전 확인 사항

### 1단계: 코드 품질 검사
- [ ] `data.js` 문법 확인: `node -e "new Function(require('fs').readFileSync('data.js','utf8'))"`
- [ ] `games-data.js` 문법 확인: `node -e "new Function(require('fs').readFileSync('games-data.js','utf8'))"`
- [ ] 깨진 링크 검사: `node scripts/check-links.mjs`
- [ ] 검색 인덱스 최신화: `node scripts/build-search-index.mjs`
- [ ] Git 상태 확인: `git status` (변경 없어야 함)

### 2단계: 콘텐츠 검증
- [ ] 새 오류코드 또는 증상 추가 시 `data.js` 확인
- [ ] `relatedSymptom` 링크가 실제로 존재하는 페이지와 일치
- [ ] 새 페이지 추가 시 `sitemap.xml`에 URL 등록
- [ ] `error-codes-index.html`에 링크 추가 (해당하는 경우)
- [ ] 모바일 화면 확인 (계산기 입력값, 버튼 크기, 여백)

### 3단계: 배포 실행
```bash
cd /Users/itpanda/Documents/ITSVC/pc-check-tools

# 변경 사항 확인
git status

# main 브랜치에 커밋
git add .
git commit -m "배포: [변경 사항 요약]"

# SSH 원격으로 푸시
git push origin main
```

### 4단계: 배포 후 검증 (필수)
- [ ] GitHub Pages 반영 대기 (약 2-5분)
- [ ] `https://itsvc.co.kr/` 메인 페이지 확인
- [ ] 최근 추가된 페이지 접근 확인
- [ ] 헤더 검색 기능 테스트
- [ ] 진단 도구 AI 기능 테스트 (ai.itsvc.co.kr 확인)
- [ ] `/api/health` 엔드포인트 상태 확인

### 5단계: 배포 기록
배포 완료 후 다음 정보를 기록:
- 배포 일시: 
- 커밋 ID: `git rev-parse --short HEAD`
- 변경 내용:
- 검증 결과:

---

## SSH 원격 설정 확인
```bash
git remote -v
# 예상 출력:
# origin	git@github.com:itcode21-alt/pc-check-tools.git (fetch)
# origin	git@github.com:itcode21-alt/pc-check-tools.git (push)
```

## AI 서버 배포 (별도 진행)
```bash
cd ai-service/
./deploy.sh
```

---

## 주의사항

1. **캐시버스팅**: `data.js` 또는 `games-data.js`를 변경했으면 반드시 `build-search-index.mjs`를 실행하고, 필요시 `style.css`에서 버전 번호를 올려야 할 수도 있습니다.

2. **Cloudflare 캐싱**: itsvc.co.kr은 Cloudflare를 통해 캐싱되므로, 반영이 지연될 수 있습니다. 캐시 무효화가 필요하면 Cloudflare 대시보드에서 진행하세요.

3. **민감한 정보**:
   - `.env`의 API 키는 버전 관리에 포함되지 않습니다 (`.gitignore` 처리)
   - 하지만 공개 브라우저 코드에 API 키를 넣지 않도록 주의하세요

4. **배포 롤백**: 문제 발생 시 마지막 정상 커밋을 확인하고 해당 파일만 복구하세요.
