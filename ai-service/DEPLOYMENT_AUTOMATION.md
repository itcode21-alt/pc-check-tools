# AI 서버 배포 자동화 가이드

**작성일**: 2026-07-23  
**상태**: 구현 완료  
**대상**: Mac mini 운영자

---

## 개요

itsvc.co.kr의 정적 페이지와 AI 서버(ai.itsvc.co.kr)는 별도로 배포됩니다:

| 구성요소 | 배포 위치 | 자동화 | 관리 |
|---------|---------|------|-----|
| **정적 페이지** | GitHub Pages | ✅ 자동 (gh-pages) | 자동 |
| **AI 서버** | Mac mini (8090포트) | ✅ 자동 (watch-and-deploy) | 수동 설정 |

---

## 구현된 자동화

### 1. GitHub Actions (자동 검증)

**파일**: `.github/workflows/validate-and-deploy.yml`

정적 페이지 배포 시 자동 실행:
- ✅ JavaScript 문법 검사 (data.js, games-data.js, app.js)
- ✅ 깨진 링크 검사
- ✅ 검색 인덱스 재생성 (필요 시)
- ✅ Sitemap 완성도 검증
- ✅ AI 서버 변경 감지 (알림 생성)

**파일**: `.github/workflows/health-check.yml`

매일 00:00 UTC (09:00 KST) 실행:
- ✅ 사이트 상태 확인 (HTTP 200)
- ✅ AI API 헬스 체크 (`/api/health`)
- ✅ 검색 인덱스 로드 확인
- ⚠️ 문제 발생 시 이슈 자동 생성

### 2. Mac mini 자동 배포 스크립트

**파일**: `ai-service/watch-and-deploy.sh`

주기적으로 다음을 수행:
1. GitHub에서 최신 코드 가져오기 (5분마다)
2. ai-service/ 폴더 변경사항 감지
3. 변경 시 `./deploy.sh` 자동 실행
4. 배포 결과 로그 기록

**로그 파일**: `/tmp/ai-service-watch.log`

---

## 설정 방법

### Step 1: 스크립트 권한 설정
```bash
chmod +x /Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/watch-and-deploy.sh
chmod +x /Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/deploy.sh
```

### Step 2: launchd 자동 실행 설정

**Option A: 사용자 세션 시작 시 실행** (권장)

```bash
# launchd plist 파일 복사
cp /Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/launchd/kr.co.itsvc.ai-service-watch.plist \
   ~/Library/LaunchAgents/

# 권한 설정
chmod 644 ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist

# 로드
launchctl load ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist
```

**Option B: 시스템 부팅 시 자동 실행** (고급)

```bash
# 시스템 level의 launchd 설정 (root 권한 필요)
sudo cp /Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/launchd/kr.co.itsvc.ai-service.plist \
   /Library/LaunchDaemons/

sudo chown root:wheel /Library/LaunchDaemons/kr.co.itsvc.ai-service.plist
sudo launchctl load /Library/LaunchDaemons/kr.co.itsvc.ai-service.plist
```

### Step 3: 상태 확인

```bash
# 등록된 서비스 확인
launchctl list | grep kr.co.itsvc

# 로그 확인
tail -f /tmp/ai-service-watch.log

# 수동 실행 테스트
/Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/watch-and-deploy.sh
```

---

## 배포 흐름도

```
GitHub Push (main 브랜치)
    ↓
GitHub Actions (validate-and-deploy.yml)
    ├─ 정적 페이지 검증
    │  ├─ JS 문법 검사 ✓
    │  ├─ 링크 검증 ✓
    │  ├─ 검색 인덱스 갱신 ✓
    │  └─ Sitemap 검증 ✓
    │
    ├─ GitHub Pages 배포 (자동)
    │
    └─ AI 서버 변경 감지
        └─ Mac mini의 watch-and-deploy.sh가 감지
            ├─ ai-service/ 변경사항 확인
            ├─ deploy.sh 자동 실행
            │  ├─ git pull
            │  ├─ pip install
            │  ├─ 프로세스 정리
            │  └─ launchd 재시작
            │
            └─ 배포 결과
                ├─ 성공: /api/health 응답 확인
                └─ 실패: 로그에 기록, 수동 개입 필요
```

---

## 모니터링

### 자동 모니터링 (GitHub Actions)

매일 00:00 UTC 자동 실행:

```bash
# 1. 사이트 상태 확인
curl -I https://itsvc.co.kr
# → HTTP 200

# 2. AI API 확인
curl https://ai.itsvc.co.kr/api/health
# → {"status": "ok"}

# 3. 검색 인덱스 확인
curl https://itsvc.co.kr/search-index.js | head -c 100
# → window.SEARCH_INDEX = {...}
```

**문제 발생 시**: 자동 이슈 생성 (Issues 탭에서 확인)

### 수동 모니터링 (Mac mini)

```bash
# 1. 감시 스크립트 상태 확인
ps aux | grep watch-and-deploy.sh

# 2. 최근 로그 확인
tail -100 /tmp/ai-service-watch.log

# 3. 배포 이력 조회
grep "Deployment" /tmp/ai-service-watch.log

# 4. 에러 확인
tail -100 /tmp/ai-service-watch-error.log
```

---

## 배포 시나리오

### 시나리오 1: 정적 페이지만 변경 (오류코드 추가 등)

```
1. GitHub에 push
   ↓
2. GitHub Actions 검증 (JS, 링크, 검색 인덱스 자동 생성)
   ↓
3. GitHub Pages 자동 배포
   ↓
4. itsvc.co.kr 반영 (2-5분)
   ↓
5. AI 서버는 변경 없음
   → watch-and-deploy.sh는 변경사항 감지 안 함
```

### 시나리오 2: AI 서버 코드만 변경 (app.py 버그 수정)

```
1. ai-service/ 폴더의 파일 변경
   ↓
2. GitHub에 push
   ↓
3. GitHub Actions 검증
   ├─ 정적 페이지 검증 ✓
   └─ "AI server changed" 알림 생성
   ↓
4. Mac mini의 watch-and-deploy.sh가 5분 이내 감지
   ↓
5. 자동으로 deploy.sh 실행
   ├─ git pull
   ├─ pip install
   ├─ 프로세스 정리
   └─ launchd 재시작
   ↓
6. ai.itsvc.co.kr 자동 업데이트
   ↓
7. /api/health 정상 응답 확인
```

### 시나리오 3: 정적 페이지 + AI 서버 동시 변경

```
1. 두 영역 모두 변경
   ↓
2. GitHub Actions 자동 검증
   ├─ 정적 페이지 검증 ✓
   ├─ GitHub Pages 배포
   └─ AI 서버 변경 알림
   ↓
3. 병렬로 두 가지 배포 진행
   ├─ 정적: itsvc.co.kr (2-5분)
   └─ AI: Mac mini에서 자동 (5-10분)
```

---

## 장애 대응

### 문제 1: watch-and-deploy.sh가 작동 안 함

**확인**:
```bash
ps aux | grep watch-and-deploy
launchctl list | grep kr.co.itsvc.ai-service-watch
```

**해결**:
```bash
# 1. 스크립트 권한 확인
ls -la /Users/itpanda/Documents/ITSVC/pc-check-tools/ai-service/watch-and-deploy.sh
# → rwxr-xr-x (755)

# 2. launchd 재로드
launchctl unload ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist
sleep 1
launchctl load ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist

# 3. 로그 확인
tail -50 /tmp/ai-service-watch.log
```

### 문제 2: AI 서버 배포는 되는데 변경사항 반영 안 됨

**확인**:
```bash
# 1. 배포가 성공했는지 확인
grep "Deployment successful" /tmp/ai-service-watch.log

# 2. 프로세스 상태 확인
lsof -i :8090

# 3. API 응답 확인
curl -v http://localhost:8090/api/health
```

**해결**:
```bash
# 1. 프로세스 재시작
launchctl kickstart -k "gui/$(id -u)/kr.co.itsvc.ai-service"

# 2. 포트 확인 및 정리
lsof -i :8090 | awk 'NR>1 {print $2}' | xargs kill -9

# 3. 수동 배포 실행
cd /Users/itpanda/Documents/ITSVC/pc-check-tools
./ai-service/deploy.sh
```

### 문제 3: GitHub Actions health-check이 실패 이슈를 생성

**확인**:
1. GitHub 저장소 → Issues 탭에서 "⚠️ Health Check Failed" 이슈 확인
2. 해당 이슈에 원인 상세히 기록됨

**해결**:
- AI API 다운: Mac mini에서 `./ai-service/deploy.sh` 실행
- 사이트 다운: GitHub Pages 상태 확인 (github.com/status)
- 검색 인덱스 오류: 수동으로 `node scripts/build-search-index.mjs` 실행 후 푸시

---

## 배포 기록 및 성공 지표

### 로그 파일 위치

| 파일 | 용도 | 위치 |
|------|------|------|
| watch 로그 | 감시 및 배포 실행 기록 | `/tmp/ai-service-watch.log` |
| watch 에러 | 스크립트 에러 | `/tmp/ai-service-watch-error.log` |
| AI 서버 로그 | 서버 실행 로그 | `/tmp/ai-service.log` |

### 성공 지표

```bash
# 배포 성공 확인
grep "✅ Deployment successful" /tmp/ai-service-watch.log

# 최근 배포 시각 확인
tail -5 /tmp/ai-service-watch.log

# 배포 빈도 확인
grep "Deployment" /tmp/ai-service-watch.log | wc -l
```

---

## 자동화 구현 체크리스트

- [x] GitHub Actions 워크플로우 작성
  - [x] `validate-and-deploy.yml` — 코드 검증 및 배포
  - [x] `health-check.yml` — 매일 상태 확인

- [x] Mac mini 감시 스크립트 작성
  - [x] `watch-and-deploy.sh` — 주기적 폴링 및 자동 배포
  - [x] `kr.co.itsvc.ai-service-watch.plist` — launchd 설정

- [ ] 추가 개선 항목
  - [ ] Slack/Discord 웹훅 연동 (배포 알림)
  - [ ] 배포 실패 시 자동 롤백
  - [ ] 배포 성공률 대시보드

---

## 다음 단계

### 즉시 (오늘)
1. Mac mini에서 설정 실행
```bash
chmod +x ./ai-service/watch-and-deploy.sh ./ai-service/deploy.sh
cp ./ai-service/launchd/kr.co.itsvc.ai-service-watch.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/kr.co.itsvc.ai-service-watch.plist
```

2. 상태 확인
```bash
sleep 10 && tail -20 /tmp/ai-service-watch.log
```

### 이번주
1. 테스트 배포 (작은 변경사항으로)
2. 로그 모니터링
3. 배포 성공 확인

### 이번달
1. 자동 배포 5회 이상 검증
2. 문제 발생 시 로그 분석 및 개선
3. Slack 웹훅 연동 검토

---

**마지막 업데이트**: 2026-07-23  
**배포 자동화 상태**: ✅ 구현 완료, 수동 설정 대기 중

Mac mini에서 위의 설정을 완료하면 자동화가 시작됩니다!
