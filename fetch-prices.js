#!/usr/bin/env node
/**
 * 네이버 쇼핑 API로 모든 부품 최저가를 조회하고 prices.json을 갱신합니다.
 *
 * 사용법:
 *   NAVER_CLIENT_ID=xxx NAVER_CLIENT_SECRET=yyy node fetch-prices.js
 */

const fs = require('fs');
const path = require('path');

const CLIENT_ID = process.env.NAVER_CLIENT_ID;
const CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('오류: NAVER_CLIENT_ID와 NAVER_CLIENT_SECRET 환경변수를 설정하세요.');
  process.exit(1);
}

const PARTS = {
  cpus: [
    { id: 'intel-core-ultra-9-285k',  query: '인텔 코어 울트라 9 285K 프로세서',  minPrice: 550000 },
    { id: 'intel-core-ultra-5-245k',  query: '인텔 코어 울트라 5 245K 프로세서',  minPrice: 350000 },
    { id: 'intel-core-i9-13900k',     query: '인텔 코어 i9-13900K 프로세서',      minPrice: 580000 },
    { id: 'intel-core-i9-13900ks',    query: '인텔 코어 i9-13900KS 프로세서',     minPrice: 650000 },
    { id: 'intel-core-i9-13900',      query: '인텔 코어 i9-13900 프로세서',       minPrice: 450000 },
    { id: 'intel-core-i7-13700k',     query: '인텔 코어 i7-13700K 프로세서',      minPrice: 320000 },
    { id: 'intel-core-i7-13700',      query: '인텔 코어 i7-13700 프로세서',       minPrice: 260000 },
    { id: 'intel-core-i5-13600k',     query: '인텔 코어 i5-13600K 프로세서',      minPrice: 230000 },
    { id: 'intel-core-i9-12900k',     query: '인텔 코어 i9-12900K 프로세서',      minPrice: 380000 },
    { id: 'intel-core-i9-12900ks',    query: '인텔 코어 i9-12900KS 프로세서',     minPrice: 450000 },
    { id: 'intel-core-i9-12900',      query: '인텔 코어 i9-12900 프로세서',       minPrice: 320000 },
    { id: 'intel-core-i7-12700k',     query: '인텔 코어 i7-12700K 프로세서',      minPrice: 230000 },
    { id: 'intel-core-i7-12700',      query: '인텔 코어 i7-12700 프로세서',       minPrice: 180000 },
    { id: 'intel-core-i5-12600k',     query: '인텔 코어 i5-12600K 프로세서',      minPrice: 160000 },
    { id: 'intel-core-i5-12600',      query: '인텔 코어 i5-12600 프로세서',       minPrice: 110000 },
    { id: 'intel-core-i3-14100f',     query: '인텔 코어 i3-14100F 프로세서',      minPrice: 65000  },
    { id: 'intel-core-i3-14100',      query: '인텔 코어 i3-14100 프로세서',       minPrice: 75000  },
    { id: 'intel-core-i3-13100f',     query: '인텔 코어 i3-13100F 프로세서',      minPrice: 58000  },
    { id: 'intel-core-i3-13100',      query: '인텔 코어 i3-13100 프로세서',       minPrice: 65000  },
    { id: 'amd-ryzen-9-9950x',        query: 'AMD 라이젠 9 9950X 프로세서',       minPrice: 600000 },
    { id: 'amd-ryzen-9-9900x',        query: 'AMD 라이젠 9 9900X 프로세서',       minPrice: 420000 },
    { id: 'amd-ryzen-9-7950x',        query: 'AMD 라이젠 9 7950X 프로세서',       minPrice: 500000 },
    { id: 'amd-ryzen-9-7900x',        query: 'AMD 라이젠 9 7900X 프로세서',       minPrice: 380000 },
    { id: 'amd-ryzen-9-7950x3d',      query: 'AMD 라이젠 9 7950X3D 프로세서',     minPrice: 600000 },
    { id: 'amd-ryzen-9-7900x3d',      query: 'AMD 라이젠 9 7900X3D 프로세서',     minPrice: 450000 },
    { id: 'amd-ryzen-7-7700x',        query: 'AMD 라이젠 7 7700X 프로세서',       minPrice: 260000 },
    { id: 'amd-ryzen-5-7600x',        query: 'AMD 라이젠 5 7600X 프로세서',       minPrice: 180000 },
    { id: 'amd-ryzen-5-7500f',        query: 'AMD 라이젠 5 7500F 프로세서',       minPrice: 150000 },
    { id: 'amd-ryzen-5-8600g',        query: 'AMD 라이젠 5 8600G 프로세서',       minPrice: 170000 },
    { id: 'amd-ryzen-5-8500g',        query: 'AMD 라이젠 5 8500G 프로세서',       minPrice: 140000 },
  ],
  motherboards: [
    { id: 'gigabyte-a620m-ds3h',          query: '기가바이트 A620M DS3H 메인보드',            minPrice: 60000  },
    { id: 'msi-pro-a620m-e',              query: 'MSI PRO A620M-E 메인보드',                  minPrice: 58000  },
    { id: 'msi-pro-b760m-p',              query: 'MSI PRO B760M-P DDR5 메인보드',             minPrice: 75000  },
    { id: 'asrock-a620m-pro-rs',          query: '애즈락 A620M Pro RS 메인보드',              minPrice: 65000  },
    { id: 'gigabyte-b760m-ds3h-ax',       query: '기가바이트 B760M DS3H AX 메인보드',        minPrice: 82000  },
    { id: 'asrock-b760m-pro-rs-wifi',     query: '애즈락 B760M Pro RS WiFi 메인보드',        minPrice: 88000  },
    { id: 'asrock-b650m-pro-rs-wifi',     query: '애즈락 B650M Pro RS WiFi 메인보드',        minPrice: 75000  },
    { id: 'gigabyte-b650m-ds3h',          query: '기가바이트 B650M DS3H 메인보드',            minPrice: 85000  },
    { id: 'msi-mpg-b760',                 query: 'MSI MPG B760 EDGE WIFI 메인보드',           minPrice: 155000 },
    { id: 'gigabyte-b650-aorus-elite-ax', query: '기가바이트 B650 AORUS ELITE AX 메인보드',  minPrice: 185000 },
    { id: 'asrock-z790-pro-rs-wifi',      query: '애즈락 Z790 Pro RS WiFi 메인보드',          minPrice: 170000 },
    { id: 'gigabyte-z790-aorus-elite-ax', query: '기가바이트 Z790 AORUS ELITE AX 메인보드',  minPrice: 200000 },
    { id: 'asrock-x670e-pro-rs',          query: '애즈락 X670E Pro RS 메인보드',              minPrice: 220000 },
    { id: 'msi-mpg-b850',                 query: 'MSI MPG B850 EDGE WIFI 메인보드',           minPrice: 215000 },
    { id: 'asus-rog-strix-z790',          query: 'ASUS ROG STRIX Z790-E GAMING 메인보드',     minPrice: 320000 },
    { id: 'asus-rog-crosshair-x970',      query: 'ASUS ROG CROSSHAIR X970 HERO 메인보드',     minPrice: 420000 },
    { id: 'asus-rog-maximus-z890',        query: 'ASUS ROG MAXIMUS Z890 APEX 메인보드',       minPrice: 550000 },
  ],
  rams: [
    { id: 'corsair-vengeance-ddr5-6000',    query: '커세어 베전스 DDR5 6000 32GB 램',     minPrice: 55000 },
    { id: 'corsair-vengeance-32gb-ddr5',    query: '커세어 베전스 DDR5 32GB 램',          minPrice: 55000 },
    { id: 'corsair-vengeance-64gb-ddr5',    query: '커세어 베전스 DDR5 64GB 램',          minPrice: 100000 },
    { id: 'samsung-ddr5-6400',              query: '삼성 DDR5-6400 16GB 램 메모리',       minPrice: 28000 },
    { id: 'gskill-ddr5-7600',               query: 'G.Skill Trident Z5 DDR5-7600 32GB 램', minPrice: 120000 },
    { id: 'gskill-trident-32gb-ddr5',       query: 'G.Skill Trident Z5 DDR5 32GB 램',    minPrice: 70000 },
    { id: 'kingston-fury-32gb-ddr5',        query: '킹스턴 Fury Beast DDR5 32GB 램',      minPrice: 50000 },
    { id: 'sk-hynix-lapis-ddr5-4800',       query: '하이닉스 라피스 DDR5-4800 16GB 램',   minPrice: 22000 },
    { id: 'sk-hynix-lapis-ddr5-5600',       query: '하이닉스 라피스 DDR5-5600 16GB 램',   minPrice: 26000 },
    { id: 'sk-hynix-lapis-pro-ddr5-6000',   query: '하이닉스 라피스 프로 DDR5-6000 16GB 램', minPrice: 32000 },
    { id: 'crucial-pro-ddr5-5600',          query: '마이크론 크루셜 Pro DDR5-5600 16GB 램',  minPrice: 26000 },
    { id: 'crucial-pro-ddr5-6000',          query: '마이크론 크루셜 Pro DDR5-6000 16GB 램',  minPrice: 30000 },
    { id: 'samsung-ddr5-4800',              query: '삼성 DDR5-4800 UDIMM 16GB 메모리',     minPrice: 22000 },
    { id: 'samsung-ddr5-5600',              query: '삼성 DDR5-5600 UDIMM 16GB 메모리',     minPrice: 26000 },
    { id: 'teamgroup-elite-ddr5-4800',      query: '팀그룹 Elite DDR5 4800 16GB 메모리 램', minPrice: 20000 },
    { id: 'teamgroup-vulcan-ddr5-5600',     query: '팀그룹 T-Force Vulcan DDR5 5600 32GB 램', minPrice: 40000 },
    { id: 'teamgroup-vulcan-ddr5-6000',     query: '팀그룹 T-Force Vulcan DDR5 6000 32GB 램', minPrice: 45000 },
    { id: 'gskill-ripjaws-s5-ddr5-5600',    query: 'G.Skill Ripjaws S5 DDR5 5600 32GB 램',   minPrice: 45000 },
    { id: 'kingston-fury-renegade-ddr5-6000', query: '킹스턴 Fury Renegade DDR5 6000 32GB 램', minPrice: 55000 },
  ],
  ssds: [
    { id: 'samsung-990-pro',              query: '삼성 990 Pro NVMe SSD 1TB',      minPrice: 95000  },
    { id: 'sk-hynix-p41-platinum',        query: '하이닉스 P41 Platinum SSD 1TB',  minPrice: 82000  },
    { id: 'sk-hynix-platinum-p44-pro',    query: '하이닉스 Platinum P44 Pro SSD 1TB', minPrice: 85000 },
    { id: 'crucial-p5-plus',              query: '크루셜 P5 Plus NVMe SSD 1TB',    minPrice: 65000  },
    { id: 'crucial-p3-plus',              query: '크루셜 P3 Plus NVMe SSD 1TB',    minPrice: 38000  },
    { id: 'wd-black-sn850x',              query: 'WD Black SN850X NVMe SSD 1TB',   minPrice: 105000 },
    { id: 'wd-blue-sn580',               query: 'WD Blue SN580 NVMe SSD 1TB',      minPrice: 48000  },
    { id: 'wd-blue-sata',                query: 'WD Blue SATA SSD 1TB',            minPrice: 35000  },
    { id: 'adata-xpg-gammix-s70-blade',  query: 'ADATA XPG GAMMIX S70 Blade SSD 1TB', minPrice: 90000 },
    { id: 'adata-legend-960-max',        query: 'ADATA Legend 960 Max SSD 1TB',    minPrice: 55000  },
    { id: 'adata-legend-800',            query: 'ADATA Legend 800 NVMe SSD 1TB',   minPrice: 35000  },
    { id: 'kingston-kc3000',             query: '킹스턴 KC3000 NVMe SSD 1TB',      minPrice: 80000  },
    { id: 'kingston-nv2',                query: '킹스턴 NV2 NVMe SSD 1TB',         minPrice: 35000  },
    { id: 'seagate-firecuda-530',        query: '씨게이트 FireCuda 530 SSD 1TB',    minPrice: 105000 },
    { id: 'samsung-870-evo',             query: '삼성 870 EVO SATA SSD 1TB',       minPrice: 50000  },
    { id: 'kioxia-exceria-pro',          query: '키오시아 Exceria Pro NVMe SSD 1TB', minPrice: 90000 },
    { id: 'kioxia-exceria-g2',           query: '키오시아 Exceria G2 NVMe SSD 1TB',  minPrice: 30000 },
    { id: 'teamgroup-mp44',              query: '팀그룹 MP44 NVMe SSD 1TB',        minPrice: 55000  },
    { id: 'samsung-980-pro',             query: '삼성 980 Pro NVMe SSD 1TB',       minPrice: 65000  },
  ],
  psus: [
    { id: 'corsair-rm-550x',                  query: '커세어 RM550x 파워',               minPrice: 80000  },
    { id: 'corsair-rm-650x',                  query: '커세어 RM650x 파워',               minPrice: 95000  },
    { id: 'corsair-rm-750x',                  query: '커세어 RM750x 파워',               minPrice: 110000 },
    { id: 'corsair-rm-850x',                  query: '커세어 RM850x 파워',               minPrice: 135000 },
    { id: 'corsair-rm-1000x',                 query: '커세어 RM1000x 파워',              minPrice: 165000 },
    { id: 'seasonic-focus-gx-550',            query: '시소닉 Focus GX-550 파워',         minPrice: 88000  },
    { id: 'seasonic-focus-gx-650',            query: '시소닉 Focus GX-650 파워',         minPrice: 100000 },
    { id: 'seasonic-focus-gx-1000',           query: '시소닉 Focus GX-1000 파워',        minPrice: 170000 },
    { id: 'seasonic-focus-1000-gold',         query: '시소닉 Focus Gold 1000W 파워',     minPrice: 155000 },
    { id: 'superflower-leadex-iii-750',       query: '슈퍼플라워 Leadex III Gold 750W 파워', minPrice: 80000 },
    { id: 'superflower-leadex-v-850',         query: '슈퍼플라워 Leadex V Gold 850W 파워',  minPrice: 105000 },
    { id: 'cooler-master-mwe-gold-850',       query: '쿨러마스터 MWE Gold 850W V2 파워', minPrice: 80000  },
    { id: 'fsp-hydro-g-pro-850',             query: 'FSP Hydro G Pro 850W 파워',        minPrice: 88000  },
    { id: 'fsp-cannon-pro-750',              query: 'FSP Cannon Pro 750W 파워',          minPrice: 65000  },
    { id: 'fsp-hexa-85-pro-500',             query: 'FSP Hexa 85+ Pro 500W 파워',       minPrice: 38000  },
    { id: 'zalman-megamax-600',              query: '잘만 MegaMax 600W 파워',            minPrice: 33000  },
    { id: 'zalman-megamax-750',              query: '잘만 MegaMax 750W 파워',            minPrice: 50000  },
    { id: 'zalman-terramax-ii-850',          query: '잘만 TeraMax II 850W 파워',         minPrice: 75000  },
    { id: 'micronics-performance-ii-500',    query: '마이크로닉스 Performance II 500W 파워', minPrice: 33000 },
    { id: 'micronics-performance-ii-750',    query: '마이크로닉스 Performance II 750W 파워', minPrice: 58000 },
    { id: 'micronics-classic-ii-850',        query: '마이크로닉스 Classic II 850W 파워', minPrice: 75000  },
    { id: 'micronics-master-ii-1000',        query: '마이크로닉스 Master II 1000W 파워', minPrice: 110000 },
    { id: 'be-quiet-pure-power-11-fm-650',   query: 'be quiet! Pure Power 11 FM 650W 파워', minPrice: 72000 },
    { id: 'enermax-maxpro-700',              query: '에너맥스 MaxPro 700W 파워',         minPrice: 48000  },
    { id: 'enermax-revolution-d-f-750',      query: '에너맥스 Revolution D.F. 750W 파워', minPrice: 80000 },
  ],
  gpus: [
    { id: 'asus-rtx-4090-rog-strix-oc',    query: 'ASUS ROG Strix RTX 4090 OC 그래픽카드',         minPrice: 800000 },
    { id: 'msi-rtx-4090-gaming-x-trio',    query: 'MSI RTX 4090 Gaming X Trio 그래픽카드',          minPrice: 800000 },
    { id: 'gigabyte-rtx-4090-gaming-oc',   query: '기가바이트 RTX 4090 Gaming OC 그래픽카드',       minPrice: 800000 },
    { id: 'gigabyte-rtx-4080s-gaming-oc',  query: '기가바이트 RTX 4080 SUPER Gaming OC 그래픽카드', minPrice: 480000 },
    { id: 'asus-rtx-4080s-dual-oc',        query: 'ASUS Dual RTX 4080 SUPER OC 그래픽카드',         minPrice: 480000 },
    { id: 'msi-rtx-4080s-gaming-x-trio',   query: 'MSI RTX 4080 SUPER Gaming X Trio 그래픽카드',    minPrice: 480000 },
    { id: 'msi-rtx-4070ti-gaming-x-trio',  query: 'MSI RTX 4070 Ti Gaming X Trio 그래픽카드',       minPrice: 330000 },
    { id: 'gigabyte-rtx-4070ti-gaming-oc', query: '기가바이트 RTX 4070 Ti Gaming OC 그래픽카드',    minPrice: 330000 },
    { id: 'asus-rtx-4070-dual-oc',         query: 'ASUS Dual RTX 4070 OC 그래픽카드',               minPrice: 240000 },
    { id: 'gigabyte-rtx-4070-eagle-oc',    query: '기가바이트 RTX 4070 Eagle OC 그래픽카드',         minPrice: 240000 },
    { id: 'msi-rtx-4070-ventus-3x',        query: 'MSI RTX 4070 Ventus 3X OC 그래픽카드',           minPrice: 240000 },
    { id: 'gigabyte-rtx-4060ti-gaming-oc', query: '기가바이트 RTX 4060 Ti Gaming OC 그래픽카드',    minPrice: 190000 },
    { id: 'msi-rtx-4060ti-gaming-x',       query: 'MSI RTX 4060 Ti Gaming X 그래픽카드',            minPrice: 190000 },
    { id: 'asus-rtx-4060-dual-oc',         query: 'ASUS Dual RTX 4060 OC 그래픽카드',               minPrice: 170000 },
    { id: 'msi-rtx-4060-ventus-2x',        query: 'MSI RTX 4060 Ventus 2X OC 그래픽카드',           minPrice: 170000 },
    { id: 'gigabyte-rtx-4060-eagle-oc',    query: '기가바이트 RTX 4060 Eagle OC 그래픽카드',         minPrice: 170000 },
    { id: 'sapphire-rx-7900xtx-nitro-plus',query: '사파이어 RX 7900 XTX NITRO+ 그래픽카드',         minPrice: 420000 },
    { id: 'asus-rx-7900xtx-strix-oc',      query: 'ASUS ROG Strix RX 7900 XTX OC 그래픽카드',      minPrice: 420000 },
    { id: 'sapphire-rx-7800xt-pulse',      query: '사파이어 RX 7800 XT PULSE 그래픽카드',            minPrice: 220000 },
    { id: 'asus-rx-7800xt-dual-oc',        query: 'ASUS Dual RX 7800 XT OC 그래픽카드',             minPrice: 220000 },
  ],
};

async function fetchLowestPrice(query, minPrice) {
  const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20&sort=sim`;
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
    .filter(p => p >= minPrice);
  if (prices.length === 0) return null;

  const minP = Math.min(...prices);
  const filtered = prices.filter(p => p <= minP * 2);
  return Math.round(filtered.reduce((a, b) => a + b, 0) / filtered.length);
}

async function main() {
  const results = {};
  let total = 0, success = 0;

  for (const [cat, parts] of Object.entries(PARTS)) {
    results[cat] = {};
    console.log(`\n[${cat}]`);
    for (const part of parts) {
      total++;
      try {
        const price = await fetchLowestPrice(part.query, part.minPrice);
        if (price) {
          results[cat][part.id] = price;
          success++;
          console.log(`  ✓ ${part.id}: ${price.toLocaleString()}원`);
        } else {
          console.log(`  - ${part.id}: 결과 없음`);
        }
      } catch (err) {
        console.error(`  ✗ ${part.id}: ${err.message}`);
      }
      await new Promise(r => setTimeout(r, 150));
    }
  }

  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const output = {
    updated: kst.toISOString().replace('Z', '+09:00'),
    source: 'Naver Shopping',
    parts: results,
  };

  fs.writeFileSync(path.join(__dirname, 'prices.json'), JSON.stringify(output, null, 2), 'utf8');
  console.log(`\n완료: ${success}/${total}개 업데이트`);
}

main();
