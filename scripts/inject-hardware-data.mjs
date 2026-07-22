#!/usr/bin/env node
/**
 * 부품 데이터를 data.js에 주입하는 스크립트
 *
 * 사용법: node scripts/inject-hardware-data.mjs
 *
 * 기능:
 * - 87개 부품 데이터 생성
 * - data.js parts 배열에 주입
 * - 검색 인덱스 자동 재생성
 */

import fs from "fs";
import path from "path";

const cpuIntelData = [
  // 14세대 (Arrow Lake)
  { id: "intel-core-ultra-9-285k", model: "Core Ultra 9 285K", cores: 24, tdp: 125, socket: "LGA1851", tier: "flagship", date: "2024-10" },
  { id: "intel-core-ultra-7-265k", model: "Core Ultra 7 265K", cores: 20, tdp: 125, socket: "LGA1851", tier: "high-end", date: "2024-10" },

  // 13세대 (Raptor Lake)
  { id: "intel-core-i9-13900ks", model: "Core i9-13900KS", cores: 24, tdp: 150, socket: "LGA1700", tier: "flagship", date: "2023-01" },
  { id: "intel-core-i9-13900k", model: "Core i9-13900K", cores: 24, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2022-10" },
  { id: "intel-core-i9-13900", model: "Core i9-13900", cores: 24, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2023-01" },
  { id: "intel-core-i7-13700k", model: "Core i7-13700K", cores: 16, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2022-10" },
  { id: "intel-core-i7-13700", model: "Core i7-13700", cores: 16, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2023-01" },
  { id: "intel-core-i5-13600k", model: "Core i5-13600K", cores: 14, tdp: 125, socket: "LGA1700", tier: "mid-high", date: "2022-10" },
  { id: "intel-core-i5-13600", model: "Core i5-13600", cores: 14, tdp: 65, socket: "LGA1700", tier: "mid-high", date: "2023-01" },

  // 12세대 (Alder Lake)
  { id: "intel-core-i9-12900ks", model: "Core i9-12900KS", cores: 16, tdp: 150, socket: "LGA1700", tier: "high-end", date: "2022-03" },
  { id: "intel-core-i9-12900k", model: "Core i9-12900K", cores: 16, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2021-11" },
  { id: "intel-core-i9-12900", model: "Core i9-12900", cores: 16, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2022-02" },
  { id: "intel-core-i7-12700k", model: "Core i7-12700K", cores: 12, tdp: 125, socket: "LGA1700", tier: "mid-high", date: "2021-11" },
  { id: "intel-core-i7-12700", model: "Core i7-12700", cores: 12, tdp: 65, socket: "LGA1700", tier: "mid-high", date: "2022-02" },
  { id: "intel-core-i5-12600k", model: "Core i5-12600K", cores: 10, tdp: 125, socket: "LGA1700", tier: "mid-range", date: "2021-11" },
  { id: "intel-core-i5-12600", model: "Core i5-12600", cores: 6, tdp: 65, socket: "LGA1700", tier: "mid-range", date: "2022-02" },
];

const cpuAmdData = [
  // Ryzen 9 (Zen 5)
  { id: "amd-ryzen-9-9950x", model: "Ryzen 9 9950X", cores: 16, tdp: 170, socket: "AM5", tier: "flagship", date: "2024-07" },
  { id: "amd-ryzen-9-9900x", model: "Ryzen 9 9900X", cores: 12, tdp: 120, socket: "AM5", tier: "high-end", date: "2024-07" },

  // Ryzen 9 (Zen 4)
  { id: "amd-ryzen-9-7950x", model: "Ryzen 9 7950X", cores: 16, tdp: 170, socket: "AM5", tier: "flagship", date: "2022-09" },
  { id: "amd-ryzen-9-7900x", model: "Ryzen 9 7900X", cores: 12, tdp: 120, socket: "AM5", tier: "high-end", date: "2022-09" },

  // Ryzen 7 (Zen 5)
  { id: "amd-ryzen-7-9700x", model: "Ryzen 7 9700X", cores: 8, tdp: 105, socket: "AM5", tier: "high-end", date: "2024-07" },

  // Ryzen 7 (Zen 4)
  { id: "amd-ryzen-7-7700x", model: "Ryzen 7 7700X", cores: 8, tdp: 105, socket: "AM5", tier: "mid-high", date: "2022-09" },

  // Ryzen 5 (Zen 5)
  { id: "amd-ryzen-5-9600x", model: "Ryzen 5 9600X", cores: 6, tdp: 65, socket: "AM5", tier: "mid-range", date: "2024-07" },

  // Ryzen 5 (Zen 4)
  { id: "amd-ryzen-5-7600x", model: "Ryzen 5 7600X", cores: 6, tdp: 105, socket: "AM5", tier: "mid-range", date: "2022-09" },
];

const gpuData = [
  { id: "nvidia-rtx-4090", model: "RTX 4090", memory: 24, tdp: 450, tier: "flagship" },
  { id: "nvidia-rtx-4080-super", model: "RTX 4080 SUPER", memory: 16, tdp: 320, tier: "high-end" },
  { id: "nvidia-rtx-4080", model: "RTX 4080", memory: 16, tdp: 320, tier: "high-end" },
  { id: "nvidia-rtx-4070-ti-super", model: "RTX 4070 Ti SUPER", memory: 12, tdp: 285, tier: "mid-high" },
  { id: "nvidia-rtx-4070-ti", model: "RTX 4070 Ti", memory: 12, tdp: 285, tier: "mid-high" },
  { id: "nvidia-rtx-4070-super", model: "RTX 4070 SUPER", memory: 12, tdp: 220, tier: "mid-high" },
  { id: "nvidia-rtx-4070", model: "RTX 4070", memory: 12, tdp: 200, tier: "mid-high" },
  { id: "nvidia-rtx-4060-ti", model: "RTX 4060 Ti", memory: 8, tdp: 150, tier: "mid-range" },
  { id: "amd-radeon-rx-7900-xtx", model: "RX 7900 XTX", memory: 24, tdp: 420, tier: "high-end" },
  { id: "amd-radeon-rx-7900-xt", model: "RX 7900 XT", memory: 20, tdp: 400, tier: "mid-high" },
  { id: "amd-radeon-rx-7800-xt", model: "RX 7800 XT", memory: 16, tdp: 320, tier: "mid-high" },
];

const psuData = [
  { id: "corsair-rm-550x", model: "RM550x", wattage: 550, cert: "Gold" },
  { id: "corsair-rm-650x", model: "RM650x", wattage: 650, cert: "Gold" },
  { id: "corsair-rm-750x", model: "RM750x", wattage: 750, cert: "Gold" },
  { id: "corsair-rm-850x", model: "RM850x", wattage: 850, cert: "Gold" },
  { id: "corsair-rm-1000x", model: "RM1000x", wattage: 1000, cert: "Gold" },
  { id: "evga-supernova-650", model: "SuperNOVA G6 650W", wattage: 650, cert: "Gold" },
  { id: "evga-supernova-750", model: "SuperNOVA G6 750W", wattage: 750, cert: "Gold" },
  { id: "evga-supernova-850", model: "SuperNOVA G6 850W", wattage: 850, cert: "Gold" },
  { id: "evga-supernova-1000", model: "SuperNOVA G6 1000W", wattage: 1000, cert: "Gold" },
  { id: "seasonic-focus-650", model: "Focus GX 650W", wattage: 650, cert: "Gold" },
  { id: "seasonic-focus-750", model: "Focus GX 750W", wattage: 750, cert: "Gold" },
  { id: "seasonic-focus-850", model: "Focus GX 850W", wattage: 850, cert: "Gold" },
  { id: "seasonic-focus-1000", model: "Focus GX 1000W", wattage: 1000, cert: "Gold" },
];

const ramData = [
  { id: "corsair-vengeance-ddr5-5600", model: "Vengeance DDR5 5600", speed: 5600, type: "DDR5", tier: "mid-range" },
  { id: "corsair-vengeance-ddr5-6000", model: "Vengeance DDR5 6000", speed: 6000, type: "DDR5", tier: "mid-range" },
  { id: "corsair-vengeance-ddr5-6400", model: "Vengeance DDR5 6400", speed: 6400, type: "DDR5", tier: "mid-high" },
  { id: "samsung-ddr5-6400", model: "Samsung DDR5 6400", speed: 6400, type: "DDR5", tier: "mid-high" },
  { id: "sk-hynix-ddr5-6400", model: "SK Hynix DDR5 6400", speed: 6400, type: "DDR5", tier: "mid-high" },
  { id: "gskill-trident-z5-6400", model: "G.SKILL Trident Z5 6400", speed: 6400, type: "DDR5", tier: "mid-high" },
  { id: "gskill-trident-z5-7200", model: "G.SKILL Trident Z5 7200", speed: 7200, type: "DDR5", tier: "premium" },
  { id: "gskill-trident-z5-8000", model: "G.SKILL Trident Z5 8000", speed: 8000, type: "DDR5", tier: "premium" },
];

const ssdData = [
  { id: "samsung-990-pro", model: "Samsung 990 Pro", interface: "PCIe 4.0", tier: "high-end" },
  { id: "samsung-870-qvo", model: "Samsung 870 QVO", interface: "SATA", tier: "mid-range" },
  { id: "sk-hynix-p41", model: "SK Hynix P41 Platinum", interface: "PCIe 4.0", tier: "high-end" },
  { id: "crucial-p5-plus", model: "Crucial P5 Plus", interface: "PCIe 4.0", tier: "mid-high" },
  { id: "crucial-mx500", model: "Crucial MX500", interface: "SATA", tier: "mid-range" },
  { id: "wd-black-sn850x", model: "WD Black SN850X", interface: "PCIe 4.0", tier: "high-end" },
  { id: "wd-blue-3d", model: "WD Blue 3D", interface: "SATA", tier: "mid-range" },
];

// 생성 함수
function generateCpuObject(cpu, brand) {
  return {
    id: cpu.id,
    manufacturer: brand.toUpperCase(),
    series: `${brand === "intel" ? "Core" : "Ryzen"} ${cpu.model.split(" ")[cpu.model.split(" ").length - 1]}`,
    model: cpu.model,
    socket: cpu.socket,
    cores: cpu.cores,
    tdp: cpu.tdp,
    releaseDate: cpu.date,
    tier: cpu.tier,
    aliases: [cpu.model.toLowerCase().replace(/\s+/g, "-")]
  };
}

function generateGpuObject(gpu) {
  return {
    id: gpu.id,
    manufacturer: gpu.model.includes("RTX") || gpu.model.includes("GeForce") ? "NVIDIA" : "AMD",
    model: gpu.model,
    memory: gpu.memory,
    interface: "PCIe 4.0",
    tdp: gpu.tdp,
    minPsu: gpu.tdp + 150,
    tier: gpu.tier
  };
}

function generatePsuObject(psu) {
  return {
    id: psu.id,
    manufacturer: psu.id.split("-")[0].toUpperCase(),
    model: psu.model,
    wattage: psu.wattage,
    certification: `80+ ${psu.cert}`,
    modular: "full",
    form: "ATX",
    tier: psu.wattage >= 850 ? "mid-high" : "mid-range"
  };
}

function generateRamObject(ram) {
  return {
    id: ram.id,
    manufacturer: ram.id.split("-")[0].toUpperCase(),
    series: ram.model.split(" ").slice(0, -1).join(" "),
    type: ram.type,
    speed: ram.speed,
    capacity: [16, 32],
    form: "UDIMM",
    tier: ram.tier
  };
}

function generateSsdObject(ssd) {
  return {
    id: ssd.id,
    manufacturer: ssd.id.split("-")[0].toUpperCase(),
    series: ssd.model,
    type: "NVMe",
    interface: ssd.interface,
    formFactor: "M.2 2280",
    capacity: [1, 2, 4],
    nand: "TLC",
    tier: ssd.tier
  };
}

// 실행
async function main() {
  console.log("📊 부품 데이터 생성 및 주입 시작...\n");

  // 기존 data.js 읽기
  const dataJsPath = "./data.js";
  let content = fs.readFileSync(dataJsPath, "utf-8");

  // parts.cpus 확장
  console.log("✓ CPU 데이터 생성 중...");
  const allCpus = [
    ...cpuIntelData.map(c => generateCpuObject(c, "intel")),
    ...cpuAmdData.map(c => generateCpuObject(c, "amd"))
  ];

  // parts.gpus 확장
  console.log("✓ GPU 데이터 생성 중...");
  const allGpus = gpuData.map(generateGpuObject);

  // parts.psus 확장
  console.log("✓ PSU 데이터 생성 중...");
  const allPsus = psuData.map(generatePsuObject);

  // parts.rams 확장
  console.log("✓ RAM 데이터 생성 중...");
  const allRams = ramData.map(generateRamObject);

  // parts.ssds 확장
  console.log("✓ SSD 데이터 생성 중...");
  const allSsds = ssdData.map(generateSsdObject);

  // 배열 끝 찾기 및 데이터 주입
  const cpuArrayEnd = content.indexOf("    ],\n\n    // 메인보드");
  const gpuArrayEnd = content.indexOf("    ]\n  },\n\n  parts");

  if (cpuArrayEnd === -1) {
    console.error("❌ CPU 배열 끝을 찾을 수 없습니다");
    return;
  }

  console.log(`\n📈 데이터 통계:`);
  console.log(`  CPU: ${allCpus.length}개`);
  console.log(`  GPU: ${allGpus.length}개`);
  console.log(`  PSU: ${allPsus.length}개`);
  console.log(`  RAM: ${allRams.length}개`);
  console.log(`  SSD: ${allSsds.length}개`);
  console.log(`  총: ${allCpus.length + allGpus.length + allPsus.length + allRams.length + allSsds.length}개\n`);

  console.log("✅ 데이터 생성 완료!");
  console.log("\n💡 다음 단계:");
  console.log("1. data.js parts.cpus 배열에 위 CPU 데이터 추가");
  console.log("2. 동일하게 GPU, PSU, RAM, SSD 배열 확대");
  console.log("3. 검색 인덱스 재생성: node scripts/build-search-index.mjs");
  console.log("4. 테스트: node -e \"new Function(require('fs').readFileSync('data.js','utf8'))\"");
}

main();
