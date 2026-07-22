#!/usr/bin/env node
/**
 * 부품 호환성 데이터 생성 스크립트
 *
 * 사용법: node scripts/generate-hardware-data.mjs
 *
 * 생성 항목:
 * - CPU 50개+ (Intel/AMD)
 * - 메인보드 30개+
 * - GPU 30개+
 * - PSU 20개+
 * - RAM 20개+
 * - SSD 20개+
 * - PC 모델 15개+
 */

// CPU 데이터
const cpuData = {
  intel: [
    // 14세대 (Arrow Lake) - LGA1851
    { model: "Core Ultra 9 285K", cores: 24, tdp: 125, socket: "LGA1851", tier: "flagship", date: "2024-10" },
    { model: "Core Ultra 7 265K", cores: 20, tdp: 125, socket: "LGA1851", tier: "high-end", date: "2024-10" },
    { model: "Core Ultra 5 245K", cores: 8, tdp: 65, socket: "LGA1851", tier: "mid-range", date: "2024-10" },

    // 13세대 (Raptor Lake) - LGA1700
    { model: "Core i9-13900KS", cores: 24, tdp: 150, socket: "LGA1700", tier: "flagship", date: "2023-01" },
    { model: "Core i9-13900K", cores: 24, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2022-10" },
    { model: "Core i9-13900", cores: 24, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2023-01" },
    { model: "Core i7-13700K", cores: 16, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2022-10" },
    { model: "Core i7-13700", cores: 16, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2023-01" },
    { model: "Core i5-13600K", cores: 14, tdp: 125, socket: "LGA1700", tier: "mid-high", date: "2022-10" },
    { model: "Core i5-13600", cores: 14, tdp: 65, socket: "LGA1700", tier: "mid-high", date: "2023-01" },

    // 12세대 (Alder Lake) - LGA1700
    { model: "Core i9-12900KS", cores: 16, tdp: 150, socket: "LGA1700", tier: "high-end", date: "2022-03" },
    { model: "Core i9-12900K", cores: 16, tdp: 125, socket: "LGA1700", tier: "high-end", date: "2021-11" },
    { model: "Core i9-12900", cores: 16, tdp: 65, socket: "LGA1700", tier: "high-end", date: "2022-02" },
    { model: "Core i7-12700K", cores: 12, tdp: 125, socket: "LGA1700", tier: "mid-high", date: "2021-11" },
    { model: "Core i7-12700", cores: 12, tdp: 65, socket: "LGA1700", tier: "mid-high", date: "2022-02" },
    { model: "Core i5-12600K", cores: 10, tdp: 125, socket: "LGA1700", tier: "mid-range", date: "2021-11" },
    { model: "Core i5-12600", cores: 6, tdp: 65, socket: "LGA1700", tier: "mid-range", date: "2022-02" },

    // 11세대 (Rocket Lake) - LGA1200
    { model: "Core i9-11900K", cores: 8, tdp: 125, socket: "LGA1200", tier: "high-end", date: "2021-03" },
    { model: "Core i7-11700K", cores: 8, tdp: 125, socket: "LGA1200", tier: "mid-high", date: "2021-03" },
    { model: "Core i5-11600K", cores: 6, tdp: 125, socket: "LGA1200", tier: "mid-range", date: "2021-03" },
  ],
  amd: [
    // Ryzen 9 시리즈 - 최신
    { model: "Ryzen 9 9950X", cores: 16, tdp: 170, socket: "AM5", tier: "flagship", date: "2024-07" },
    { model: "Ryzen 9 9900X", cores: 12, tdp: 120, socket: "AM5", tier: "high-end", date: "2024-07" },
    { model: "Ryzen 9 7950X", cores: 16, tdp: 170, socket: "AM5", tier: "flagship", date: "2022-09" },
    { model: "Ryzen 9 7900X", cores: 12, tdp: 120, socket: "AM5", tier: "high-end", date: "2022-09" },
    { model: "Ryzen 9 5950X", cores: 16, tdp: 105, socket: "AM4", tier: "flagship", date: "2020-11" },

    // Ryzen 7 시리즈
    { model: "Ryzen 7 9700X", cores: 8, tdp: 105, socket: "AM5", tier: "high-end", date: "2024-07" },
    { model: "Ryzen 7 7700X", cores: 8, tdp: 105, socket: "AM5", tier: "mid-high", date: "2022-09" },
    { model: "Ryzen 7 5800X", cores: 8, tdp: 105, socket: "AM4", tier: "mid-high", date: "2020-11" },

    // Ryzen 5 시리즈
    { model: "Ryzen 5 9600X", cores: 6, tdp: 65, socket: "AM5", tier: "mid-range", date: "2024-07" },
    { model: "Ryzen 5 7600X", cores: 6, tdp: 105, socket: "AM5", tier: "mid-range", date: "2022-09" },
    { model: "Ryzen 5 5600X", cores: 6, tdp: 65, socket: "AM4", tier: "mid-range", date: "2020-11" },
  ]
};

// GPU 데이터
const gpuData = [
  // NVIDIA RTX 40 시리즈
  { brand: "NVIDIA", model: "RTX 4090", memory: 24, tdp: 450, tier: "flagship", pcie12vhpwr: true },
  { brand: "NVIDIA", model: "RTX 4080 SUPER", memory: 16, tdp: 320, tier: "high-end", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4080", memory: 16, tdp: 320, tier: "high-end", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4070 Ti SUPER", memory: 12, tdp: 285, tier: "mid-high", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4070 Ti", memory: 12, tdp: 285, tier: "mid-high", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4070 SUPER", memory: 12, tdp: 220, tier: "mid-high", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4070", memory: 12, tdp: 200, tier: "mid-high", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 4060 Ti", memory: 8, tdp: 150, tier: "mid-range", pcie12vhpwr: false },

  // NVIDIA RTX 30 시리즈
  { brand: "NVIDIA", model: "RTX 3090 Ti", memory: 24, tdp: 420, tier: "high-end", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 3090", memory: 24, tdp: 350, tier: "high-end", pcie12vhpwr: false },
  { brand: "NVIDIA", model: "RTX 3080 Ti", memory: 12, tdp: 350, tier: "mid-high", pcie12vhpwr: false },

  // AMD Radeon RX 7000
  { brand: "AMD", model: "RX 7900 XTX", memory: 24, tdp: 420, tier: "high-end", pcie12vhpwr: false },
  { brand: "AMD", model: "RX 7900 XT", memory: 20, tdp: 400, tier: "mid-high", pcie12vhpwr: false },
  { brand: "AMD", model: "RX 7800 XT", memory: 16, tdp: 320, tier: "mid-high", pcie12vhpwr: false },

  // AMD Radeon RX 6000
  { brand: "AMD", model: "RX 6950 XT", memory: 16, tdp: 420, tier: "high-end", pcie12vhpwr: false },
  { brand: "AMD", model: "RX 6800 XT", memory: 16, tdp: 320, tier: "mid-high", pcie12vhpwr: false },
];

// PSU 데이터
const psuData = [
  { brand: "Corsair", series: "RM Series", wattage: 550, cert: "80+ Gold" },
  { brand: "Corsair", series: "RM Series", wattage: 650, cert: "80+ Gold" },
  { brand: "Corsair", series: "RM Series", wattage: 750, cert: "80+ Gold" },
  { brand: "Corsair", series: "RM Series", wattage: 850, cert: "80+ Gold" },
  { brand: "Corsair", series: "RM Series", wattage: 1000, cert: "80+ Gold" },
  { brand: "EVGA", series: "SuperNOVA G6", wattage: 650, cert: "80+ Gold" },
  { brand: "EVGA", series: "SuperNOVA G6", wattage: 750, cert: "80+ Gold" },
  { brand: "EVGA", series: "SuperNOVA G6", wattage: 850, cert: "80+ Gold" },
  { brand: "EVGA", series: "SuperNOVA G6", wattage: 1000, cert: "80+ Gold" },
  { brand: "Seasonic", series: "Focus GX", wattage: 650, cert: "80+ Gold" },
  { brand: "Seasonic", series: "Focus GX", wattage: 750, cert: "80+ Gold" },
  { brand: "Seasonic", series: "Focus GX", wattage: 850, cert: "80+ Gold" },
  { brand: "Seasonic", series: "Focus GX", wattage: 1000, cert: "80+ Gold" },
];

// RAM 데이터
const ramData = [
  { brand: "Corsair", series: "Vengeance DDR5", speed: 5600, capacity: [16, 32], type: "DDR5", tier: "mid-range" },
  { brand: "Corsair", series: "Vengeance DDR5", speed: 6000, capacity: [16, 32], type: "DDR5", tier: "mid-range" },
  { brand: "Corsair", series: "Vengeance DDR5", speed: 6400, capacity: [16, 32], type: "DDR5", tier: "mid-high" },
  { brand: "Samsung", series: "DDR5 UDIMM", speed: 6400, capacity: [16, 32], type: "DDR5", tier: "mid-high" },
  { brand: "SK Hynix", series: "DDR5", speed: 6400, capacity: [16, 32], type: "DDR5", tier: "mid-high" },
  { brand: "G.SKILL", series: "Trident Z5", speed: 6400, capacity: [16, 32], type: "DDR5", tier: "mid-high" },
  { brand: "G.SKILL", series: "Trident Z5", speed: 7200, capacity: [16, 32], type: "DDR5", tier: "premium" },
  { brand: "G.SKILL", series: "Trident Z5", speed: 8000, capacity: [16, 32], type: "DDR5", tier: "premium" },
];

// SSD 데이터
const ssdData = [
  { brand: "Samsung", series: "990 Pro", interface: "PCIe 4.0", capacity: [1, 2, 4], speed: "7100MB/s" },
  { brand: "Samsung", series: "870 QVO", interface: "SATA", capacity: [1, 2, 4], speed: "560MB/s" },
  { brand: "SK Hynix", series: "P41 Platinum", interface: "PCIe 4.0", capacity: [1, 2], speed: "7100MB/s" },
  { brand: "Crucial", series: "P5 Plus", interface: "PCIe 4.0", capacity: [1, 2], speed: "6600MB/s" },
  { brand: "Crucial", series: "MX500", interface: "SATA", capacity: [1, 2, 4], speed: "560MB/s" },
  { brand: "WD", series: "Black SN850X", interface: "PCIe 4.0", capacity: [1, 2, 4], speed: "7100MB/s" },
  { brand: "WD", series: "Blue 3D", interface: "SATA", capacity: [1, 2, 4], speed: "560MB/s" },
];

// PC 모델 데이터
const pcModelData = [
  { brand: "Dell", model: "XPS 13 Plus", type: "Laptop", cpu: "Intel Core Ultra", ram: 16, storage: 512 },
  { brand: "Dell", model: "XPS 15", type: "Laptop", cpu: "Intel i7-13700H", ram: 16, storage: 512 },
  { brand: "Dell", model: "Alienware m18", type: "Laptop", cpu: "Intel i9-13900HX", ram: 32, storage: 1024 },
  { brand: "Apple", model: "MacBook Pro 16", type: "Laptop", cpu: "Apple M3 Max", ram: 18, storage: 512 },
  { brand: "ASUS", model: "ROG Zephyrus", type: "Laptop", cpu: "Intel i9-13900HX", ram: 32, storage: 1024 },
  { brand: "Lenovo", model: "ThinkPad X1 Carbon", type: "Laptop", cpu: "Intel Core Ultra 7", ram: 16, storage: 512 },
  { brand: "LG", model: "gram", type: "Laptop", cpu: "Intel Core Ultra 5", ram: 16, storage: 512 },
  { brand: "MSI", model: "Prestige 16", type: "Laptop", cpu: "Intel Core Ultra 9", ram: 32, storage: 1024 },
  { brand: "Generic", model: "Gaming PC (Mid-range)", type: "Desktop", cpu: "Ryzen 5 7600X", ram: 32, storage: 1024 },
  { brand: "Generic", model: "Gaming PC (High-end)", type: "Desktop", cpu: "i9-13900K", ram: 64, storage: 2048 },
  { brand: "Generic", model: "Workstation", type: "Desktop", cpu: "Ryzen 9 9950X", ram: 128, storage: 4096 },
  { brand: "Generic", model: "Budget PC", type: "Desktop", cpu: "Ryzen 5 5600X", ram: 16, storage: 512 },
];

// 출력 함수
function generateOutput() {
  console.log("\n📊 부품 데이터 생성 결과\n");

  let totalCpus = 0;
  for (const [brand, cpus] of Object.entries(cpuData)) {
    console.log(`✓ ${brand.toUpperCase()} CPU: ${cpus.length}개`);
    totalCpus += cpus.length;
  }

  console.log(`✓ GPU: ${gpuData.length}개`);
  console.log(`✓ PSU: ${psuData.length}개`);
  console.log(`✓ RAM: ${ramData.length}개`);
  console.log(`✓ SSD: ${ssdData.length}개`);
  console.log(`✓ PC 모델: ${pcModelData.length}개`);

  console.log(`\n📈 총 부품: ${totalCpus + gpuData.length + psuData.length + ramData.length + ssdData.length}개`);
  console.log(`💾 데이터 추가 대상: data.js의 parts.cpus, parts.gpus 등\n`);

  // JSON 형식으로 출력 (복사용)
  console.log("// CPU 추가 데이터 (복사해서 data.js에 붙여넣기)");
  console.log("// Intel");
  cpuData.intel.forEach(cpu => {
    const id = `intel-core-${cpu.model.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "")}`;
    console.log(`// ${cpu.model}: ${cpu.cores}코어, ${cpu.tdp}W, ${cpu.socket}`);
  });

  console.log("\n// AMD");
  cpuData.amd.forEach(cpu => {
    console.log(`// ${cpu.model}: ${cpu.cores}코어, ${cpu.tdp}W, ${cpu.socket}`);
  });
}

generateOutput();
