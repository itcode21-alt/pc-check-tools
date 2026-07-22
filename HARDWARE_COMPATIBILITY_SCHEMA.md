# 부품 호환성 데이터 스키마

**작성일**: 2026-07-23  
**상태**: 설계 단계  
**용도**: 업그레이드 영역 통합 진단 기능의 기초 데이터

---

## 목표

itsvc.co.kr의 사용자가 본인 PC의 부품 호환성을 한눈에 파악할 수 있도록 다음을 제공:

1. **내 PC 기본 정보 입력** → 제조사, 모델, 사양
2. **업그레이드 가능 영역 자동 분석** → RAM, SSD, 그래픽카드, 파워
3. **구체적인 호환 부품 제시** → 구매 조건 필터링
4. **제휴 링크 제시** → Coupang 등에서 조건에 맞는 부품 검색

---

## 데이터 구조 (data.js 추가)

### 1. 부품 정보 (parts 배열)

```javascript
window.SITE_DATA = {
  // ... 기존 errorCodes, symptoms ...

  // 신규 추가
  parts: {
    // CPU 정보
    cpus: [
      {
        id: "intel-i7-13700k",
        manufacturer: "Intel",
        series: "Core i7 13th Gen",
        model: "i7-13700K",
        socket: "LGA1700",
        cores: 16,
        tdp: 125,  // 기본 TDP (W)
        releaseDate: "2022-10",
        tier: "high-end",
        aliases: ["13700k", "13700", "i7-13700K", "arrow-lake"]
      },
      // ... 더 많은 CPU
    ],

    // 메인보드 정보
    motherboards: [
      {
        id: "asus-rog-strix-z790",
        manufacturer: "ASUS",
        series: "ROG STRIX Z790",
        model: "Z790-E GAMING WIFI",
        chipset: "Z790",
        socket: "LGA1700",
        ramSlots: 2,
        maxRam: 192,  // GB
        nvmeSlots: 5,
        nvmeTypes: ["M.2 NVMe"],  // M.2 SATA 지원 여부 포함
        sataSlots: 4,
        pcie: {
          "5.0": 2,  // PCIe 5.0 슬롯 수
          "4.0": 2,
          "3.0": 2
        },
        powerConnectors: {
          "cpu24pin": true,
          "cpu8pin": true,
          "pcie8pin": 2,  // 8-pin x2 = 16-pin 지원
          "pcie12vhpwr": true  // 12VHPWR 지원 여부
        },
        supportedRamTypes: ["DDR5"],  // DDR4, DDR5 등
        ramOCSupport: true,
        storageType: ["NVMe", "SATA"],
        releaseDate: "2022-10",
        tier: "high-end"
      },
      // ... 더 많은 메인보드
    ],

    // RAM 정보
    rams: [
      {
        id: "corsair-vengeance-ddr5-6000",
        manufacturer: "Corsair",
        series: "Vengeance",
        type: "DDR5",
        speed: 6000,  // MHz
        capacity: [16, 32],  // 용량 선택지
        cas: 30,
        voltage: 1.4,  // V
        form: "UDIMM",  // UDIMM, SODIMM
        tier: "mid-range",
        releaseDate: "2023-01"
      },
      // ... 더 많은 RAM
    ],

    // SSD 정보
    ssds: [
      {
        id: "samsung-990-pro",
        manufacturer: "Samsung",
        series: "990 Pro",
        type: "NVMe",
        interface: "PCIe 4.0",
        formFactor: "M.2 2280",
        capacity: [1, 2, 4],  // TB
        nand: "TLC",
        totalBytesWritten: {  // TBW 스펙
          "1TB": 600,
          "2TB": 1200,
          "4TB": 2400
        },
        speed: {
          read: 7100,  // MB/s
          write: 6000
        },
        tier: "high-end",
        releaseDate: "2022-10"
      },
      // ... 더 많은 SSD
    ],

    // 그래픽카드 정보
    gpus: [
      {
        id: "nvidia-rtx-4090",
        manufacturer: "NVIDIA",
        series: "GeForce RTX 40 Series",
        model: "RTX 4090",
        memory: 24,  // GB
        interface: "PCIe 4.0",
        tdp: 450,  // W
        powerConnectors: {
          "8pin": 3,  // 8-pin x3 = 권장
          "12vhpwr": true  // 12VHPWR 지원 여부
        },
        minPsu: 850,  // 권장 최소 파워 (W)
        slotWidth: 2.5,  // 슬롯 너비 (듀얼/트리플)
        length: 370,  // mm
        tier: "flagship",
        releaseDate: "2022-10"
      },
      // ... 더 많은 그래픽카드
    ],

    // 파워 서플라이 정보
    psus: [
      {
        id: "corsair-rm850x",
        manufacturer: "Corsair",
        series: "RM Series",
        model: "RM850x",
        wattage: 850,  // W
        certification: "80+ Gold",
        efficiency: 90,  // %
        modular: "full",  // full, semi, non
        form: "ATX",
        connections: {
          "24pin": 1,
          "8pin": 2,
          "6pin": 0,
          "pcie8pin": 4,  // 8-pin PCIe 포트 수
          "pcie6pin": 2,
          "12vhpwr": 1  // 12VHPWR 포트 지원
        },
        fanless: false,
        fanlessPowerLimit: null,  // 팬리스 모드 와트
        tier: "mid-high",
        releaseDate: "2023-01"
      },
      // ... 더 많은 파워
    ],

    // CPU 쿨러 정보
    coolers: [
      {
        id: "noctua-nh-u12s",
        manufacturer: "Noctua",
        series: "NH-U Series",
        model: "NH-U12S",
        type: "tower",  // tower, AIO-240, AIO-280, AIO-360
        tdp: 180,  // W (최대 방열량)
        socketSupport: ["LGA1700", "AM5"],  // 호환 소켓
        height: 158,  // mm (케이스 높이 최소값)
        noiseLevel: 18.3,  // dB
        pricing: "premium",
        tier: "high-end"
      },
      // ... 더 많은 쿨러
    ],

    // PC 모델별 호환성 정보
    pcModels: [
      {
        id: "dell-xps-13-9370",
        manufacturer: "Dell",
        series: "XPS 13",
        model: "9370",
        releaseYear: 2018,
        form: "laptop",
        specs: {
          cpu: "Intel 8th Gen (Core i5/i7)",
          ram: {
            slots: 1,
            type: "LPDDR3",
            maxCapacity: 16
          },
          storage: {
            slots: 1,
            type: "M.2 NVMe",
            interface: "PCIe 3.0"
          }
        },
        upgradeCapability: {
          cpu: false,
          ram: false,  // 솔더링됨
          storage: true,
          gpu: false,
          power: false  // 노트북 내장
        },
        thermalDesign: "fanless",
        maxTdpAllowed: 28,  // W
        commonIssues: [
          "thermal-throttling",
          "ssd-upgrade-compatibility",
          "display-brightness"
        ]
      },
      // ... 더 많은 PC 모델
    ]
  }
}
```

---

## 구현 단계

### Phase 1: 데이터 구조 정의 (완료)
- [x] 부품 테이블 정의
- [x] 필드별 정규화
- [x] 호환성 매칭 로직 설계

### Phase 2: 핵심 부품 데이터 입력 (진행 중)
- [ ] CPU 100개 (Intel/AMD 최신 세대)
- [ ] 메인보드 50개 (Z790, AM5, X870 등)
- [ ] RAM 30개 (DDR4, DDR5)
- [ ] SSD 40개 (SATA, NVMe 3.0/4.0/5.0)
- [ ] 그래픽카드 50개 (RTX/RX 최신)
- [ ] 파워 30개 (500W~1200W)

### Phase 3: 호환성 매칭 로직 (계획)
- [ ] app.js에 부품 호환성 검사 함수 작성
- [ ] 업그레이드 가능 여부 판정 알고리즘
- [ ] 권장 부품 제시 로직

### Phase 4: UI 업데이트 (계획)
- [ ] "내 PC 업그레이드 진단" 페이지 작성
- [ ] 부품 입력 폼 (모델/사양)
- [ ] 호환성 결과 표시
- [ ] Coupang 링크 동적 생성

---

## 데이터 수집 계획

### 자동 수집 (스크립트)
```bash
# 부품 정보 자동 크롤링 (공식 사이트)
# 1. Intel/AMD CPU 스펙: ark.intel.com, amd.com
# 2. 메인보드: ASUS, MSI, GIGABYTE 공식 사양 페이지
# 3. SSD: Samsung, SK Hynix, Micron 공식 스펙
# 4. GPU: NVIDIA, AMD 공식 스펙
```

### 수동 입력 우선순위
1. **높음**: 상위 200개 부품 (사용자 80%)
2. **중간**: 추가 300개 부품
3. **낮음**: 구 세대/틈새 부품

---

## 호환성 매칭 규칙

### CPU ↔ 메인보드
```javascript
isCompatible(cpu, motherboard) {
  // 1. 소켓 확인
  if (cpu.socket !== motherboard.socket) return false;

  // 2. 세대 호환성 (예: 12세대는 H670, Z670 필요)
  if (!motherboard.supportedCpuGenerations.includes(cpu.generation)) {
    return false;
  }

  // 3. TDP 확인 (VRM 쿨링 능력)
  if (cpu.tdp > motherboard.maxCpuTdp) {
    return { compatible: true, warning: "고발열 CPU" };
  }

  return true;
}
```

### SSD ↔ 메인보드
```javascript
isCompatible(ssd, motherboard) {
  // 1. M.2 슬롯 존재
  if (ssd.type === "NVMe" && motherboard.nvmeSlots === 0) {
    return false;
  }

  // 2. PCIe 세대 확인
  if (ssd.interface === "PCIe 5.0" && 
      !motherboard.pcie["5.0"]) {
    return { compatible: true, fallback: "PCIe 4.0로 작동" };
  }

  return true;
}
```

### 그래픽카드 ↔ 파워
```javascript
isCompatible(gpu, psu) {
  // 1. 파워 용량 확인
  totalSystemPower = systemBasePower + gpu.tdp;
  if (totalSystemPower > psu.wattage * 0.85) {  // 85% 이용
    return false;
  }

  // 2. 파워 커넥터 확인
  if (gpu.powerConnectors["12vhpwr"] && 
      !psu.connections["12vhpwr"]) {
    return { compatible: false, reason: "12VHPWR 미지원" };
  }

  return true;
}
```

---

## 사용 사례

### 사용자 플로우
```
1. "내 PC는 Dell XPS 13 9370입니다"
   ↓
2. 시스템이 PC 모델에서 자동 인식
   - CPU: Intel i7-8550U
   - RAM: 16GB LPDDR3 (솔더링, 업그레이드 불가)
   - SSD: 512GB M.2 NVMe (업그레이드 가능)
   - GPU: Intel Iris Plus (내장, 교체 불가)
   ↓
3. 업그레이드 가능 여부 제시
   ✓ SSD 교체 가능 (512GB → 1TB/2TB)
   ✗ RAM 업그레이드 불가 (솔더링됨)
   ✗ CPU 교체 불가 (노트북)
   ✗ 그래픽카드 교체 불가 (내장)
   ↓
4. SSD 추천
   - PCIe 3.0 NVMe 필요
   - 길이 제한: 80mm 이하 (얇은 노트북)
   - 추천: Samsung 970 EVO, SK Hynix PC401 등
   ↓
5. Coupang 제휴 링크
   - "Samsung 970 EVO 1TB 검색" 링크 제공
   - 가격 비교, 구매 유도
```

---

## 데이터 갱신 주기

| 항목 | 주기 | 방법 |
|------|------|------|
| CPU/GPU | 분기 | 새 세대 출시 시 수동 추가 |
| 메인보드 | 분기 | 신규 칩셋 출시 시 추가 |
| SSD/RAM | 월간 | 신규 모델 추가, 가격 갱신 |
| 호환성 규칙 | 월간 | 사용자 피드백 기반 수정 |

---

## 파일 위치

- **데이터**: `data.js` (window.SITE_DATA.parts)
- **로직**: `app.js` (CompatibilityChecker 클래스)
- **UI**: `upgrade-diagnostic.html` (신규 페이지)
- **스타일**: `style.css` (부품 카드, 호환성 표시)

---

## 다음 단계

### 즉시 (오늘-내일)
1. 부품 데이터 구조를 `data.js`에 추가
2. Intel/AMD 최신 CPU 20개 입력
3. 메인보드 5-10개 입력

### 이번주
1. 상위 50개 부품 데이터 입력
2. 호환성 매칭 함수 작성 (app.js)
3. 기본 호환성 테스트

### 이번달
1. 200개 부품 데이터 입력 완료
2. UI 프로토타입 (upgrade-diagnostic.html)
3. Coupang 링크 연동
4. 사용자 테스트

---

**상태**: 설계 완료, 데이터 입력 예정  
**담당**: 기술 리더, 콘텐츠 팀  
**예상 기간**: 2-4주
