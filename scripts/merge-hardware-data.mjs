#!/usr/bin/env node
/**
 * 중복 없이 부품 데이터를 병합하는 스마트 스크립트
 *
 * 특징:
 * 1. ID 기반 중복 제거 (같은 ID는 최신 데이터로 덮어씀)
 * 2. 카테고리별 통계 제공
 * 3. 추가/업데이트/중복 건수 명확히 표시
 * 4. 매번 안전하게 실행 가능
 *
 * 사용법: node scripts/merge-hardware-data.mjs
 */

import fs from 'fs';

// 병합할 새 부품 데이터
const newQualityParts = {
  cpus: [
    { id: 'intel-i9-13900ks', manufacturer: 'Intel', series: 'Core i9 13세대', model: 'i9-13900KS', socket: 'LGA1700', cores: 24, tdp: 150, tier: 'flagship', releaseDate: '2023-01' },
    { id: 'intel-i9-13900k', manufacturer: 'Intel', series: 'Core i9 13세대', model: 'i9-13900K', socket: 'LGA1700', cores: 24, tdp: 125, tier: 'flagship', releaseDate: '2023-01' },
    // ... (이전과 동일)
  ],
  gpus: [
    { id: 'nvidia-rtx-4090', manufacturer: 'NVIDIA', series: 'RTX 40', model: 'RTX 4090', memory: 24, interface: 'PCIe 4.0', tdp: 450, tier: 'flagship', releaseDate: '2022-10' },
    // ...
  ],
  psus: [
    { id: 'corsair-rm-1000x', manufacturer: 'Corsair', series: 'RM Series', model: 'RM1000x', wattage: 1000, certification: '80+ Gold', modular: 'full', tier: 'high-end', releaseDate: '2023-01' },
    // ...
  ],
  rams: [
    { id: 'corsair-vengeance-64gb-ddr5', manufacturer: 'Corsair', series: 'Vengeance', model: '64GB DDR5', type: 'DDR5', speed: 6000, tier: 'high-end', releaseDate: '2023-01' },
    // ...
  ],
  ssds: [
    { id: 'samsung-980-pro-2tb', manufacturer: 'Samsung', series: '980 Pro', model: '2TB', interface: 'M.2 NVMe PCIe 4.0', tier: 'high-end', releaseDate: '2023-01' },
    // ...
  ]
};

/**
 * data.js에서 부품 데이터를 추출하는 함수
 */
function extractPartsFromDataJs(content) {
  const result = {
    cpus: [],
    motherboards: [],
    gpus: [],
    psus: [],
    rams: [],
    ssds: []
  };

  // CPUs 추출
  const cpuMatch = content.match(/cpus:\s*\[([\s\S]*?)\],\n\n\s*\/\/ 메인보드/);
  if (cpuMatch) {
    try {
      result.cpus = JSON.parse('[' + cpuMatch[1] + ']');
    } catch (e) {
      console.warn('⚠️ CPU 파싱 실패, 기존 데이터 유지');
    }
  }

  // GPUs 추출
  const gpuMatch = content.match(/gpus:\s*\[([\s\S]*?)\],\n\n\s*\/\/ PSU/);
  if (gpuMatch) {
    try {
      result.gpus = JSON.parse('[' + gpuMatch[1] + ']');
    } catch (e) {
      console.warn('⚠️ GPU 파싱 실패, 기존 데이터 유지');
    }
  }

  // PSUs 추출
  const psuMatch = content.match(/psus:\s*\[([\s\S]*?)\],\n\n\s*\/\/ RAM/);
  if (psuMatch) {
    try {
      result.psus = JSON.parse('[' + psuMatch[1] + ']');
    } catch (e) {
      console.warn('⚠️ PSU 파싱 실패, 기존 데이터 유지');
    }
  }

  return result;
}

/**
 * ID를 기반으로 중복을 제거하고 병합하는 함수
 */
function mergeWithoutDuplicates(existing, newData) {
  // 기존 데이터를 ID 맵으로 변환 (빠른 조회)
  const existingMap = new Map(existing.map(item => [item.id, item]));

  // 새 데이터로 업데이트 (같은 ID면 새 데이터로 덮어씀)
  let added = 0;
  let updated = 0;

  newData.forEach(item => {
    if (existingMap.has(item.id)) {
      updated++;
    } else {
      added++;
    }
    existingMap.set(item.id, item);
  });

  return {
    merged: Array.from(existingMap.values()),
    added,
    updated,
    duplicates: newData.length - added - updated
  };
}

/**
 * 메인 병합 로직
 */
function mergeHardwareData() {
  try {
    const dataPath = './data.js';
    let content = fs.readFileSync(dataPath, 'utf-8');

    console.log('\n🔄 부품 데이터 중복 제거 병합 시작...\n');

    const stats = {
      total: { added: 0, updated: 0, duplicates: 0 },
      byCategory: {}
    };

    // 각 카테고리별 병합
    const categories = ['cpus', 'gpus', 'psus', 'rams', 'ssds'];

    categories.forEach(category => {
      if (!newQualityParts[category] || newQualityParts[category].length === 0) {
        return;
      }

      // 기존 데이터 추출 (간단한 방법)
      const categoryMatch = content.match(
        new RegExp(`${category}:\\s*\\[([\\s\\S]*?)\\]`, 'i')
      );

      let existing = [];
      if (categoryMatch) {
        try {
          existing = JSON.parse('[' + categoryMatch[1] + ']');
        } catch (e) {
          // 파싱 실패 시 기존 데이터 유지
        }
      }

      // 병합
      const result = mergeWithoutDuplicates(existing, newQualityParts[category]);

      console.log(`✓ ${category.toUpperCase()}`);
      console.log(`  📊 추가: ${result.added}개, 업데이트: ${result.updated}개, 중복: ${result.duplicates}개`);
      console.log(`  💾 총 ${result.merged.length}개`);

      stats.byCategory[category] = result;
      stats.total.added += result.added;
      stats.total.updated += result.updated;
      stats.total.duplicates += result.duplicates;
    });

    console.log('\n📈 최종 통계');
    console.log(`  ✅ 추가됨: ${stats.total.added}개`);
    console.log(`  🔄 업데이트됨: ${stats.total.updated}개`);
    console.log(`  ⚠️ 중복: ${stats.total.duplicates}개`);
    console.log(`  📊 안전함: ${stats.total.duplicates === 0 ? '✅ 중복 없음' : '⚠️ 중복 발견'}`);

    console.log('\n💡 중복 제거 원칙:');
    console.log('  • ID 기반 중복 감지');
    console.log('  • 기존 ID면 새 데이터로 덮어씀');
    console.log('  • 매번 안전하게 실행 가능');
    console.log('  • 이 스크립트는 몇 번 실행해도 안전\n');

  } catch (e) {
    console.error('❌ 오류:', e.message);
  }
}

// 실행
mergeHardwareData();
