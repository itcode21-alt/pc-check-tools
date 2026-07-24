#!/usr/bin/env node
/**
 * 네이버 쇼핑 API로 메인보드 최저가를 조회하고 prices.json을 갱신합니다.
 *
 * 사용법:
 *   NAVER_CLIENT_ID=xxx NAVER_CLIENT_SECRET=yyy node fetch-prices.js
 *
 * GitHub Actions secrets에 NAVER_CLIENT_ID / NAVER_CLIENT_SECRET 등록 후
 * .github/workflows/update-prices.yml로 자동 실행됩니다.
 */

const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('오류: NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 설정하세요.');
  process.exit(1);
}

const MOTHERBOARDS = [
  { id: 'gigabyte-b760m-ds3h-ax',      query: '기가바이트 B760M DS3H AX DDR5' },
  { id: 'asrock-b760m-pro-rs-wifi',     query: '애즈락 B760M Pro RS WiFi' },
  { id: 'asrock-b650m-pro-rs-wifi',     query: '애즈락 B650M Pro RS WiFi' },
  { id: 'gigabyte-b650m-ds3h',          query: '기가바이트 B650M DS3H DDR5' },
  { id: 'msi-mpg-b760',                 query: 'MSI MPG B760 EDGE WIFI DDR5' },
  { id: 'gigabyte-b650-aorus-elite-ax', query: '기가바이트 B650 AORUS ELITE AX' },
  { id: 'asrock-z790-pro-rs-wifi',      query: '애즈락 Z790 Pro RS WiFi' },
  { id: 'gigabyte-z790-aorus-elite-ax', query: '기가바이트 Z790 AORUS ELITE AX' },
  { id: 'asrock-x670e-pro-rs',          query: '애즈락 X670E Pro RS' },
  { id: 'msi-mpg-b850',                 query: 'MSI MPG B850 EDGE WIFI' },
  { id: 'asus-rog-strix-z790',          query: 'ASUS ROG STRIX Z790-E GAMING WIFI' },
  { id: 'asus-rog-crosshair-x970',      query: 'ASUS ROG CROSSHAIR X970 HERO' },
  { id: 'asus-rog-maximus-z890',        query: 'ASUS ROG MAXIMUS Z890 APEX' },
];

async function fetchLowestPrice(query) {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=5&sort=asc`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  const prices = data.items
    .map(item => parseInt(item.lprice, 10))
    .filter(p => p > 10000); // 1만원 미만 이상치 제거
  if (prices.length === 0) return null;

  // 최솟값 3배 초과 이상치 제거 후 평균
  const minP = Math.min(...prices);
  const filtered = prices.filter(p => p <= minP * 3);
  return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
}

async function main() {
  const results = {};

  for (const mb of MOTHERBOARDS) {
    try {
      const price = await fetchLowestPrice(mb.query);
      if (price) {
        results[mb.id] = price;
        console.log(`✓ ${mb.id}: ${price.toLocaleString()}원`);
      } else {
        console.log(`- ${mb.id}: 결과 없음`);
      }
    } catch (err) {
      console.error(`✗ ${mb.id}: ${err.message}`);
    }
    await new Promise(r => setTimeout(r, 200)); // 레이트 제한 방지
  }

  const now = new Date();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kst = new Date(now.getTime() + kstOffset);
  const updated = kst.toISOString().replace('Z', '+09:00');

  const output = {
    updated,
    source: 'Naver Shopping',
    parts: { motherboards: results },
  };

  const outputPath = path.join(__dirname, 'prices.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf8');
  console.log(`\nprices.json 저장 완료 (${Object.keys(results).length}/${MOTHERBOARDS.length}개 업데이트)`);
}

main();
