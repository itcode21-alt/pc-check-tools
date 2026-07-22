#!/usr/bin/env node
import fs from "fs";

const additionalCpus = `
      {
        id: "intel-core-i9-13900ks",
        manufacturer: "Intel",
        series: "Core i9 13th Gen",
        model: "i9-13900KS",
        socket: "LGA1700",
        cores: 24,
        tdp: 150,
        releaseDate: "2023-01",
        tier: "flagship",
        aliases: ["13900ks", "i9-13900ks"]
      },
      {
        id: "intel-core-i9-13900",
        manufacturer: "Intel",
        series: "Core i9 13th Gen",
        model: "i9-13900",
        socket: "LGA1700",
        cores: 24,
        tdp: 65,
        releaseDate: "2023-01",
        tier: "high-end",
        aliases: ["13900", "i9-13900"]
      },
      {
        id: "intel-core-i7-13700",
        manufacturer: "Intel",
        series: "Core i7 13th Gen",
        model: "i7-13700",
        socket: "LGA1700",
        cores: 16,
        tdp: 65,
        releaseDate: "2023-01",
        tier: "high-end",
        aliases: ["13700", "i7-13700"]
      },
      {
        id: "intel-core-i9-12900ks",
        manufacturer: "Intel",
        series: "Core i9 12th Gen",
        model: "i9-12900KS",
        socket: "LGA1700",
        cores: 16,
        tdp: 150,
        releaseDate: "2022-03",
        tier: "high-end",
        aliases: ["12900ks", "i9-12900ks"]
      },
      {
        id: "intel-core-i9-12900",
        manufacturer: "Intel",
        series: "Core i9 12th Gen",
        model: "i9-12900",
        socket: "LGA1700",
        cores: 16,
        tdp: 65,
        releaseDate: "2022-02",
        tier: "high-end",
        aliases: ["12900", "i9-12900"]
      },
      {
        id: "amd-ryzen-9-7950x",
        manufacturer: "AMD",
        series: "Ryzen 9 7 Series",
        model: "7950X",
        socket: "AM5",
        cores: 16,
        tdp: 170,
        releaseDate: "2022-09",
        tier: "flagship",
        aliases: ["7950x", "ryzen-9-7950x"]
      },
      {
        id: "amd-ryzen-9-7900x",
        manufacturer: "AMD",
        series: "Ryzen 9 7 Series",
        model: "7900X",
        socket: "AM5",
        cores: 12,
        tdp: 120,
        releaseDate: "2022-09",
        tier: "high-end",
        aliases: ["7900x", "ryzen-9-7900x"]
      },
      {
        id: "amd-ryzen-7-7700x",
        manufacturer: "AMD",
        series: "Ryzen 7 7 Series",
        model: "7700X",
        socket: "AM5",
        cores: 8,
        tdp: 105,
        releaseDate: "2022-09",
        tier: "mid-high",
        aliases: ["7700x", "ryzen-7-7700x"]
      }
`;

const additionalGpus = `
      {
        id: "nvidia-rtx-4080",
        manufacturer: "NVIDIA",
        series: "GeForce RTX 40",
        model: "RTX 4080",
        memory: 16,
        interface: "PCIe 4.0",
        tdp: 320,
        powerConnectors: { "8pin": 2 },
        minPsu: 750,
        slotWidth: 2.5,
        length: 320,
        tier: "high-end",
        releaseDate: "2022-11"
      },
      {
        id: "nvidia-rtx-4070-ti",
        manufacturer: "NVIDIA",
        series: "GeForce RTX 40",
        model: "RTX 4070 Ti",
        memory: 12,
        interface: "PCIe 4.0",
        tdp: 285,
        powerConnectors: { "8pin": 2 },
        minPsu: 700,
        slotWidth: 2.5,
        length: 320,
        tier: "mid-high",
        releaseDate: "2023-01"
      },
      {
        id: "amd-radeon-rx-7900-xt",
        manufacturer: "AMD",
        series: "Radeon RX 7900",
        model: "RX 7900 XT",
        memory: 20,
        interface: "PCIe 4.0",
        tdp: 400,
        powerConnectors: { "8pin": 2 },
        minPsu: 800,
        slotWidth: 2.5,
        length: 320,
        tier: "mid-high",
        releaseDate: "2023-12"
      }
`;

const additionalPsus = `
      {
        id: "corsair-rm-550x",
        manufacturer: "Corsair",
        series: "RM Series",
        model: "RM550x",
        wattage: 550,
        certification: "80+ Gold",
        modular: "full",
        form: "ATX",
        connections: { "24pin": 1, "8pin": 2, "pcie8pin": 2 },
        tier: "mid-range",
        releaseDate: "2023-01"
      },
      {
        id: "corsair-rm-650x",
        manufacturer: "Corsair",
        series: "RM Series",
        model: "RM650x",
        wattage: 650,
        certification: "80+ Gold",
        modular: "full",
        form: "ATX",
        connections: { "24pin": 1, "8pin": 2, "pcie8pin": 3 },
        tier: "mid-range",
        releaseDate: "2023-01"
      },
      {
        id: "evga-supernova-650",
        manufacturer: "EVGA",
        series: "SuperNOVA G6",
        model: "650 G6",
        wattage: 650,
        certification: "80+ Gold",
        modular: "full",
        form: "ATX",
        connections: { "24pin": 1, "8pin": 2, "pcie8pin": 3 },
        tier: "mid-range",
        releaseDate: "2023-06"
      }
`;

async function main() {
  try {
    console.log("📝 data.js 수정 중...\n");

    let content = fs.readFileSync("./data.js", "utf-8");
    let modified = false;

    const cpuEndIndex = content.indexOf("    ],\n\n    // 메인보드");
    if (cpuEndIndex !== -1) {
      content = content.slice(0, cpuEndIndex) + "," + additionalCpus + "\n    ],\n\n    // 메인보드" + content.slice(cpuEndIndex + "    ],\n\n    // 메인보드".length);
      modified = true;
      console.log("✓ CPU 데이터 추가됨");
    }

    const gpuEndIndex = content.indexOf("    ],\n\n    // PSU");
    if (gpuEndIndex !== -1) {
      content = content.slice(0, gpuEndIndex) + "," + additionalGpus + "\n    ],\n\n    // PSU" + content.slice(gpuEndIndex + "    ],\n\n    // PSU".length);
      modified = true;
      console.log("✓ GPU 데이터 추가됨");
    }

    const psuEndIndex = content.indexOf("    ]\n  }\n}");
    if (psuEndIndex !== -1) {
      content = content.slice(0, psuEndIndex) + "," + additionalPsus + "\n    ]\n  }\n}" + content.slice(psuEndIndex + "    ]\n  }\n}".length);
      modified = true;
      console.log("✓ PSU 데이터 추가됨");
    }

    if (modified) {
      fs.writeFileSync("./data.js", content);
      console.log("\n✅ data.js 수정 완료!");
      console.log("\n📋 다음 단계:");
      console.log("1. 문법 검사: node -e \"new Function(require('fs').readFileSync('data.js','utf8'))\"");
      console.log("2. 검색 인덱스 재생성: node scripts/build-search-index.mjs");
      console.log("3. 깨진 링크 확인: node scripts/check-links.mjs");
    }
  } catch (error) {
    console.error("❌ 오류:", error.message);
  }
}

main();
