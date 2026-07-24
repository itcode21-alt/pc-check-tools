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
  { id: 'gigabyte-b760m-ds3h-ax',      query: '기가바이트 B760M DS3H AX 메인보드',       minPrice: 60000 },
  { id: 'asrock-b760m-pro-rs-wifi',     query: '애즈락 B760M Pro RS WiFi 메인보드',       minPrice: 60000 },
  { id: 'asrock-b650m-pro-rs-wifi',     query: '애즈락 B650M Pro RS WiFi 메인보드',       minPrice: 60000 },
  { id: 'gigabyte-b650m-ds3h',          query: '기가바이트 B650M DS3H 메인보드',           minPrice: 80000 },
  { id: 'msi-mpg-b760',                 query: 'MSI MPG B760 EDGE WIFI 메인보드',          minPrice: 120000 },
  { id: 'gigabyte-b650-aorus-elite-ax', query: '기가바이트 B650 AORUS ELITE AX 메인보드', minPrice: 150000 },
  { id: 'asrock-z790-pro-rs-wifi',      query: '애즈락 Z790 Pro RS WiFi 메인보드',         minPrice: 150000 },
  { id: 'gigabyte-z790-aorus-elite-ax', query: '기가바이트 Z790 AORUS ELITE AX 메인보드', minPrice: 180000 },
  { id: 'asrock-x670e-pro-rs',          query: '애즈락 X670E Pro RS 메인보드',             minPrice: 180000 },
  { id: 'msi-mpg-b850',                 query: 'MSI MPG B850 EDGE WIFI 메인보드',          minPrice: 200000 },
  { id: 'asus-rog-strix-z790',          query: 'ASUS ROG STRIX Z790-E GAMING 메인보드',    minPrice: 300000 },
  { id: 'asus-rog-crosshair-x970',      query: 'ASUS ROG CROSSHAIR X970 HERO 메인보드',    minPrice: 400000 },
  { id: 'asus-rog-maximus-z890',        query: 'ASUS ROG MAXIMUS Z890 APEX 메인보드',      minPrice: 500000 },
];

async function fetchLowestPrice(query, minPrice) {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=10&sort=asc`;
  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': CLIENT_ID,
      'X-Naver-Client-Secret': CLIENT_SECRET,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (!data.items || data.items.length === 0) return null;

  // 최솟값 기준 필터: minPrice 미만 제거 + 최솟값 3배 초과 이상치 제거
  const prices = data.items
    .map(item => parseInt(item.lprice, 10))
    .filter(p => p >= minPrice);
  if (prices.length === 0) return null;

  const minP = Math.min(...prices);
  const filtered = prices.filter(p => p <= minP * 2);
  return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
}

async function main() {
  const results = {};

  for (const mb of MOTHERBOARDS) {
    try {
      const price = await fetchLowestPrice(mb.query, mb.minPrice);
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
