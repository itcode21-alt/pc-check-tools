# 보완할 자료 및 콘텐츠 체크리스트

**문서 작성일**: 2026-07-23  
**주기**: 월간 운영 검토 (매월 첫 월요일)

---

## 1. 공식 출처 업데이트 필요

### 1-1. Microsoft 문서 변경 추적

#### 현재 상태
- `data.js`의 오류 코드들이 `officialSource` 필드를 가지고 있음
- Microsoft Learn의 Bug Check 문서 URL이 주소 변경될 수 있음

#### 체크할 항목
- [ ] **Bug Check 문서 주소 변경**: Microsoft Learn에서 주기적으로 URL 정리
  - 예: `https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x...`
  - 작업: 분기별로 상위 20개 오류코드 링크 재확인

- [ ] **Windows 업데이트 관련 문서**: 월간 Patch Tuesday 이후
  - Microsoft Security Update Guide 추가
  - 영향받는 오류코드 업데이트

- [ ] **게임별 공식 공지**: 월간 게임 업데이트 추적
  - LoL (Patch notes), Lost Ark (공식 홈페이지), Black Desert (공지사항) 등
  - `games-data.js`의 링크 갱신

### 1-2. 구현 방법
```javascript
// data.js 예시 - 현재 구조
{
  code: "0x0000007E",
  title: "SYSTEM_THREAD_EXCEPTION_NOT_HANDLED",
  officialSource: {
    title: "Microsoft Learn: Bug Check 0x7E",
    url: "https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7e--system-thread-exception-not-handled"
  }
}

// 개선 제안: 업데이트 추적 메타데이터
{
  code: "0x0000007E",
  officialSources: [
    {
      title: "Microsoft Learn: Bug Check 0x7E",
      url: "https://learn.microsoft.com/...",
      lastVerified: "2026-07-23", // 새 필드
      updateFrequency: "monthly" // 추적 주기 표시
    },
    {
      title: "Windows Driver Kit Documentation",
      url: "https://learn.microsoft.com/...",
      lastVerified: "2026-07-23"
    }
  ]
}
```

---

## 2. 콘텐츠 영역별 보완 항목

### 2-1. 오류 코드 / 이벤트 ID

#### 누락된 오류 코드
다음 코드들은 사용자 문의가 있으나 아직 상세 페이지가 없을 수 있습니다:

- [ ] **0x000000D4** (DRIVER_IRQL_NOT_LESS_OR_EQUAL)
  - 현황: 상세 페이지 확인 필요
  - 원인: 드라이버 호환성, 메모리 오류, 하드웨어 결함

- [ ] **0x000000FA** (FATAL_HUB_ERROR)
  - 현황: USB 허브 오류 페이지 필요
  - 연결: 하드웨어-usb-not-detected.html과 연동

- [ ] **0x00000B4** (DRIVER_VERIFIER_DETECTED_VIOLATION)
  - 현황: 드라이버 검증 도구 관련 설명 필요

#### 이벤트 ID 추가
- [ ] **Event ID 11** (Disk) - "The driver detected a controller error"
- [ ] **Event ID 62** (NVIDIA/AMD GPU 드라이버)
- [ ] **Event ID 219** (Kernel-PnP) - "The Plug and Play device installation service"

#### 체크사항
- [ ] `data.js`의 `errorCodes` 배열에 해당 항목 추가
- [ ] `error-codes-index.html`에 링크 추가
- [ ] `sitemap.xml` 업데이트
- [ ] 검색 인덱스 재생성: `node scripts/build-search-index.mjs`

---

### 2-2. 증상(Symptom) / 진단 가이드

#### 콘텐츠 공백
현재 `symptoms` 배열의 `link` 필드를 참고하면, 다음 증상은 페이지가 있으나 진단 절차가 최신화되지 않았을 가능성이 있습니다:

- [ ] **Explorer가 응답 없음** (`windows-explorer-freeze.html`)
  - 추가: 파일 탐색기 캐시 초기화
  - 추가: Windows Search 인덱싱 비활성화 옵션

- [ ] **네트워크 드라이브 응답 안 함** (`hardware-explorer-network-drive-freeze.html`)
  - 추가: SMB 1.0 비활성화 확인
  - 추가: 방화벽 예외 설정

- [ ] **게임 연결 오류** (`windows-game-connection-error.html`)
  - 추가: VPN/프록시 확인
  - 추가: Xbox Live 서비스 상태 확인 링크

- [ ] **Windows 업데이트 실패 루프** (`windows-update-fail-loop.html`)
  - 추가: Windows Update 트러블슈터 도구
  - 추가: DISM 복구 명령어 (고급 사용자용)

---

### 2-3. 게임별 오류 정보

#### 업데이트가 필요한 게임
최근 게임 업데이트로 인한 새 오류 코드 추가:

- [ ] **Valorant**: Anti-cheat 엔진(Vanguard) 업데이트로 인한 새 오류
  - 현황: `error-code-vanguard-error.html` 존재
  - 보완: 최신 Vanguard 버전 호환성 체크 로직

- [ ] **Lost Ark**: 서비스 지역별 서버 오류
  - 현황: `game-lostark.html` 존재
  - 보완: 지역 선택에 따른 오류 필터링

- [ ] **Black Desert**: 런처 업데이트 오류
  - 현황: `game-blackdesert.html` 존재
  - 보완: 런처 캐시 초기화 방법

### 2-4. 하드웨어 관련 콘텐츠

#### 부품별 호환성 정보 부족

**CPU/메인보드 호환성**
- [ ] Intel 14세대(Arrow Lake) 및 AMD Ryzen 5 9세대 추가
  - 작업: `data.js`의 `parts` 배열에 소켓 정보 추가
  - 예: `socket: "LGA1700"`, `socket: "AM5"`

**그래픽카드 전력 연결**
- [ ] RTX 4090 / RTX 5090 등 고전력 카드의 12VHPWR 커넥터 정보
  - 작업: `psu-calculator.html` 개선
  - 추가: "12VHPWR 호환 전원공급장치" 필터

**메모리 타입**
- [ ] DDR5 메모리 초기화 문제 정보
  - 페이지: 새로 작성 필요
  - 내용: "DDR5 인식 안 됨", "DDR5 메모리 오류" 진단

**냉각 솔루션**
- [ ] 인텔 LGA1700 K 시리즈 CPU 발열 문제
  - 페이지: `hardware-overheat-shutdown.html` 보강
  - 추가: 인텔 과열 설정 (PL1/PL2) 조정 방법

---

## 3. AI 진단 관련 보완

### 3-1. 근거 부족 답변 개선

#### 현재 문제
사용자가 "이 답변 잘못됐어요" 피드백을 자주 하는 증상들:

- [ ] **"여러 문제가 섞여 있을 수 있습니다"** 로만 답변하는 경우
  - 목표: Gemini API를 사용해 구체적 순위 제시
  - 예: "80% 드라이버, 15% 하드웨어, 5% 소프트웨어"

- [ ] **검색 실패** - 데이터베이스에 없는 증상
  - 목표: 유사한 증상 제시 (fuzzy matching)
  - 구현: `scripts/enrich-symptoms-with-gemini.mjs` 활용

- [ ] **게임별 오류를 일반 오류와 혼동**
  - 목표: 게임 선택 시 일반 오류 필터링
  - 구현: `app.js`에서 `gameErrors` 우선 검색

### 3-2. 스크립트 개선

#### `enrich-symptoms-with-gemini.mjs` 현황
```bash
# 현재 상태 확인
node scripts/enrich-symptoms-with-gemini.mjs --help
```

- [ ] **하드쿼터 감지**: 현재 구현됨 (커밋 `b7a015e`에서 개선됨)
- [ ] **API 토큰 수 최적화**: 입력 토큰 수를 줄이기 위한 프롬프트 개선
- [ ] **배치 처리**: 모든 증상을 한 번에 처리하는 모드 추가

---

## 4. SEO / 검색 최적화

### 4-1. 메타 정보 업데이트

#### 페이지 제목 및 설명
다음 페이지들의 메타 태그(`<title>`, `<meta name="description">`)는 Google Search Console의 "높은 노출 / 낮은 클릭률" 페이지입니다:

- [ ] `error-codes-index.html` - 제목 너무 길 가능성
- [ ] `guides.html` - 설명 부족, 모호함
- [ ] `tools.html` - 각 도구별 설명 필요

#### 체크 방법
```bash
# 1. Google Search Console에서 확인
# - Performance > Queries > CTR 낮은 페이지 확인

# 2. 로컬 검사
# grep -E '<title>|<meta name="description"' *.html | head -20
```

### 4-2. 내부 링크 최적화

- [ ] **고아 페이지** (다른 페이지에서 링크되지 않는 페이지) 확인
  ```bash
  node scripts/check-links.mjs --orphaned
  ```

- [ ] **연결 강도 분석**: 상위 10개 페이지 간 상호 링크 확인
  - 목표: "오류 코드" → "증상" → "해결 가이드" 경로 명확화

---

## 5. 모바일 / 접근성 개선

### 5-1. 반응형 화면

다음 요소들은 모바일에서 테스트 필요:

- [ ] **계산기 입력 필드**: 숫자 키보드 활성화 확인
  - 현황: `psu-calculator.html`, `ssd-tbw-calculator.html` 등
  - 확인: `<input type="number">` 올바르게 사용 중인가?

- [ ] **카드 레이아웃**: 좁은 화면에서 여백 확인
  - 목표: 2칼럼 → 1칼럼 자동 전환

- [ ] **모달/팝업**: 모바일에서 닫기 버튼 접근성

### 5-2. 접근성 (WCAG 2.1 AA)

- [ ] **색상 대비**: 특히 진단 결과 카드 배경색
  - 도구: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

- [ ] **키보드 네비게이션**: Tab 키로 모든 인터랙티브 요소 접근 가능
  - 확인: 진단 도구의 탭 순서

- [ ] **스크린 리더 호환성**
  - 확인 대상: 진단 결과, 계산기 출력

---

## 6. 데이터 정확성 검증

### 6-1. 월간 데이터 샘플 검증

- [ ] **상위 10개 오류코드**: 원인과 해결 방법 재검증
  - 데이터 출처: Google Search Console의 상위 검색어

- [ ] **게임 오류 데이터**: 최신 패치 반영
  - 주기: 월간 게임 패치 후

- [ ] **하드웨어 부품**: 새 세대 추가
  - 예: CPU, GPU, 메모리 새 모델

### 6-2. 검증 체크리스트

```bash
# 1. data.js 문법
node -e "new Function(require('fs').readFileSync('data.js','utf8'))"

# 2. games-data.js 문법
node -e "new Function(require('fs').readFileSync('games-data.js','utf8'))"

# 3. 링크 검증
node scripts/check-links.mjs

# 4. 검색 인덱스 최신화
node scripts/build-search-index.mjs

# 5. 오류 코드 검증 (커스텀 스크립트 필요)
node scripts/validate-data-consistency.mjs # 미구현 - 추가 권장
```

---

## 7. 수익화 관련 보완

### 7-1. Coupang 제휴 링크

- [ ] **링크 주변 고지**: 모든 Coupang 링크 위에 "이 페이지의 링크를 통한 구매시 일부 수익이 발생합니다" 표시
  - 현황: 일부 페이지에서만 표시됨 가능성

- [ ] **제휴 상태**: 만료된 계약 확인
  - 체크: `coupang.py`에 설정된 `AFFILIATE_ID` 유효성

- [ ] **조건 적절성**: 다음 경우 제휴 링크 제거 검토
  - 이탈률이 높은 페이지
  - 사용자 신뢰도가 낮은 결과(피드백 부정적)

### 7-2. Google AdSense

- [ ] **광고 배치 검토**
  - 목표: 광고가 진단 흐름을 방해하지 않기
  - 확인: 모바일에서 광고가 콘텐츠를 가리는지 여부

- [ ] **금지된 콘텐츠**: 광고 정책 위반 여부 확인
  - 보안 관련 수상한 도구 광고 차단
  - 사기/악성 광고 신고

---

## 8. 월간 운영 체크리스트 (사용 템플릿)

```markdown
### 2026년 08월 보완 현황

**수행자**: [이름]  
**완료일**: YYYY-MM-DD

#### 공식 출처 (1-1)
- [x] Microsoft Learn 링크 20개 확인
  - 깨진 링크: 0개
  - URL 변경: 0개

#### 오류 코드 (2-1)
- [ ] 누락된 오류 코드: 확인 필요
  - 추가된 코드: [코드 목록]
  
#### 증상 (2-2)
- [ ] Explorer 응답 없음 - 진단 절차 업데이트
  - 추가 항목: [항목]

#### 게임 (2-3)
- [ ] Valorant Vanguard 업데이트 반영
  
#### 하드웨어 (2-4)
- [ ] Intel 14세대 CPU 추가
- [ ] RTX 5090 호환성 정보 추가

#### AI 진단 (3-1)
- [ ] 근거 부족 답변 개선
  - Gemini API 개선 안: [설명]

#### SEO (4-1)
- [ ] 높은 노출/낮은 클릭 페이지 3개 개선
- [ ] 내부 링크 최적화

#### 모바일 (5-1)
- [ ] 계산기 입력 필드 테스트
- [ ] 모바일 화면 비율 확인

#### 데이터 검증 (6-1)
- [ ] 상위 10개 오류코드 재검증
- [ ] 깨진 링크: 0개

#### 수익화 (7-1)
- [ ] Coupang 고지 문구 확인
- [ ] 제휴 링크 이탈률 검토

**다음달 우선 작업**: [항목]
```

---

## 사용 방법

1. **월간 운영 회의 전** (매월 첫주)
   - 이 문서를 읽고 확인 상황 체크
   
2. **주간 작업** (매주 수요일 콘텐츠 보완)
   - 상단 섹션부터 차례대로 작업
   
3. **배포 전** (배포 체크리스트와 함께)
   - 새 콘텐츠 추가 시 이 문서의 해당 항목 체크
   
4. **월말 리뷰**
   - 완료된 항목 기록
   - 다음달 우선순위 결정

이 문서는 분기별로 갱신하세요.
