# 부품 데이터 중복 제거 시스템

## 📋 개요

부품 데이터를 계속 추가할 때 **중복이 자동으로 제거**되는 시스템입니다.

---

## 🔍 중복 감지 방식

### **ID 기반 고유성**

```javascript
// 각 부품은 고유한 ID를 가짐
{
  id: "intel-i9-13900ks",     // ← 유일 식별자
  manufacturer: "Intel",
  model: "i9-13900KS",
  ...
}
```

### **작동 원리**

```
1회차 실행:
  기존 데이터: CPU [cpu-1, cpu-2, ..., cpu-26]
  새 데이터:   CPU [cpu-27, cpu-28, ..., cpu-66]
  결과:        CPU [cpu-1 ~ cpu-66] ✅ (40개 추가)

2회차 실행:
  기존 데이터: CPU [cpu-1 ~ cpu-66]
  새 데이터:   CPU [cpu-27, cpu-28, ..., cpu-66] (같은 데이터)
  결과:        CPU [cpu-1 ~ cpu-66] ✅ (0개 추가, 40개 중복 감지)

3회차 실행:
  기존 데이터: CPU [cpu-1 ~ cpu-66]
  새 데이터:   CPU [cpu-67, cpu-68, ...] (새로운 데이터)
  결과:        CPU [cpu-1 ~ cpu-N] ✅ (새 부품만 추가)
```

---

## 📊 중복 제거 알고리즘

### **Step 1: ID 맵 생성**
```javascript
// 기존 데이터를 ID 맵으로 변환 (O(n) 시간에 조회)
const existingMap = new Map(
  existing.map(item => [item.id, item])
);
// { "intel-i9-13900ks": {...}, "amd-ryzen-9-7950x": {...}, ... }
```

### **Step 2: 병합**
```javascript
newData.forEach(item => {
  if (existingMap.has(item.id)) {
    // 이미 있으면: 새 데이터로 덮어씀 (업데이트)
    updated++;
  } else {
    // 없으면: 새로 추가
    added++;
  }
  existingMap.set(item.id, item);
});
```

### **Step 3: 통계**
```
추가됨:   40개 (새 부품)
업데이트: 0개 (기존 부품 갱신)
중복:     0개 (중복된 ID 없음)
```

---

## 🚀 사용 방법

### **부품 데이터 추가 (안전함)**

```bash
# 언제든지 실행 가능 - 중복이 자동 제거됨
node scripts/add-hardware-to-datajs.mjs

# 중복 확인 (선택사항)
node scripts/merge-hardware-data.mjs
```

### **예제: 3번 반복 실행**

```bash
$ node scripts/add-hardware-to-datajs.mjs
✓ CPU 데이터 추가됨: 16개
✓ GPU 데이터 추가됨: 9개
✓ PSU 데이터 추가됨: 7개
✅ 부품 데이터 통합 완료!

$ node scripts/add-hardware-to-datajs.mjs  # 2번째 실행
# 같은 ID 감지 → 자동 덮어씀
✅ 중복 제거됨

$ node scripts/add-hardware-to-datajs.mjs  # 3번째 실행
# 여전히 안전함
✅ 중복 제거됨
```

---

## 📈 자동 감시 (Mac mini)

### **GitHub 변경 감지 시**

```
data.js 또는 scripts/ 변경
    ↓
Mac mini watch (5분마다)
    ├─ 부품 데이터 추가 스크립트 실행
    ├─ 중복 제거 체크 자동 실행  ← NEW!
    ├─ 검색 인덱스 재생성
    └─ 웹사이트 배포
```

### **watch-and-deploy.sh의 새 로직**

```bash
# 부품 데이터 변경 감지 시
log "📝 Running hardware data update..."
node scripts/add-hardware-to-datajs.mjs

log "🔄 Checking for duplicate parts..."
node scripts/merge-hardware-data.mjs  # 중복 확인 및 제거

log "✅ Duplicate check completed (중복 제거됨)"
```

---

## 🛡️ 안전성 보장

### **중복이 절대 생기지 않는 이유**

| 시나리오 | 처리 방식 | 결과 |
|---------|---------|------|
| **같은 데이터 2번 추가** | ID로 감지 → 덮어씀 | ✅ 안전 |
| **일부만 다른 데이터** | 기존 ID는 유지, 새 ID는 추가 | ✅ 안전 |
| **스크립트 여러 번 실행** | 매번 중복 확인 | ✅ 안전 |
| **자동 배포 중 중복** | watch-and-deploy.sh가 자동 처리 | ✅ 안전 |

---

## 📊 통계 예제

### **첫 실행 (초기 부품 데이터)**
```
✓ CPUS
  📊 추가: 16개, 업데이트: 0개, 중복: 0개
  💾 총 42개

✓ GPUS
  📊 추가: 9개, 업데이트: 0개, 중복: 0개
  💾 총 12개

✓ PSUS
  📊 추가: 7개, 업데이트: 0개, 중복: 0개
  💾 총 9개
```

### **두 번째 실행 (같은 데이터)**
```
✓ CPUS
  📊 추가: 0개, 업데이트: 16개, 중복: 0개
  💾 총 42개 (변화 없음)

✓ GPUS
  📊 추가: 0개, 업데이트: 9개, 중복: 0개
  💾 총 12개 (변화 없음)
```

### **세 번째 실행 (새로운 부품 추가)**
```
✓ CPUS
  📊 추가: 5개, 업데이트: 16개, 중복: 0개
  💾 총 47개 (5개 증가)
```

---

## 🎯 주요 특징

✅ **중복 방지**: ID 기반 자동 감지  
✅ **업데이트 지원**: 같은 ID면 최신 데이터로 갱신  
✅ **다중 실행 안전**: 몇 번 실행해도 괜찮음  
✅ **자동 통합**: watch-and-deploy.sh에서 자동 실행  
✅ **통계 제공**: 추가/업데이트/중복 명확히 표시  
✅ **무중단**: 기존 데이터 손실 없음

---

## 💡 팁

### **새 부품 추가할 때**
```bash
# 1. 새 부품을 scripts/integrate-quality-parts.mjs에 추가
# 2. 실행
node scripts/add-hardware-to-datajs.mjs

# 3. 결과 확인 (자동으로 중복 제거됨)
git diff data.js
```

### **대량 추가할 때**
```bash
# 여러 번 실행해도 안전 - 중복이 자동 제거됨
for i in {1..5}; do
  node scripts/add-hardware-to-datajs.mjs
done
```

---

## 📝 기술 상세

### **데이터 구조**
```javascript
// data.js 구조
{
  parts: {
    cpus: [
      { id: "unique-cpu-1", ... },
      { id: "unique-cpu-2", ... }
    ],
    gpus: [
      { id: "unique-gpu-1", ... }
    ]
  }
}

// ← ID는 항상 고유함
```

### **시간 복잡도**
- 중복 감지: O(n) (ID 맵 생성)
- 병합: O(m) (새 데이터 순회)
- 전체: O(n + m) - 매우 효율적

### **메모리 사용**
- ID 맵: O(n) (기존 데이터 크기만큼)
- 안전: 100개 부품 = < 10KB

---

## 🚀 자동화 완성

이제 부품 데이터는:
- ✅ **매번 안전하게 추가** (중복 제거)
- ✅ **자동으로 감지** (watch-and-deploy.sh)
- ✅ **통계 제공** (추가/업데이트/중복)
- ✅ **무제한 확장** (중복 없이)

**부품 데이터 확대는 이제 자동화되고 안전합니다!** 🎊
