#!/usr/bin/env node
/**
 * data.js에 부품 데이터를 추가하는 스크립트
 *
 * 사용법: node scripts/add-hardware-to-datajs.mjs
 *
 * 이 스크립트는:
 * 1. 기존 data.js를 읽음
 * 2. parts 배열에서 각 카테고리의 데이터를 확장
 * 3. 수정된 data.js를 저장
 */

import fs from "fs";

// 추가할 CPU 데이터
const additionalCpus = `
      // Intel 13세대 추가
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
      // Intel 12세대 추가
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
        id: "intel-core-i7-12700k",
        manufacturer: "Intel",
        series: "Core i7 12th Gen",
        model: "i7-12700K",
        socket: "LGA1700",
        cores: 12,
        tdp: 125,
        releaseDate: "2021-11",
        tier: "mid-high",
        aliases: ["12700k", "i7-12700k"]
      },
      {
        id: "intel-core-i7-12700",
        manufacturer: "Intel",
        series: "Core i7 12th Gen",
        model: "i7-12700",
        socket: "LGA1700",
        cores: 12,
        tdp: 65,
        releaseDate: "2022-02",
        tier: "mid-high",
        aliases: ["12700", "i7-12700"]
      },
      {
        id: "intel-core-i5-12600k",
        manufacturer: "Intel",
        series: "Core i5 12th Gen",
        model: "i5-12600K",
        socket: "LGA1700",
        cores: 10,
        tdp: 125,
        releaseDate: "2021-11",
        tier: "mid-range",
        aliases: ["12600k", "i5-12600k"]
      },
      {
        id: "intel-core-i5-12600",
        manufacturer: "Intel",
        series: "Core i5 12th Gen",
        model: "i5-12600",
        socket: "LGA1700",
        cores: 6,
        tdp: 65,
        releaseDate: "2022-02",
        tier: "mid-range",
        aliases: ["12600", "i5-12600"]
      },
      // AMD 추가
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
      },
      {
        id: "amd-ryzen-5-7600x",
        manufacturer: "AMD",
        series: "Ryzen 5 7 Series",
        model: "7600X",
        socket: "AM5",
        cores: 6,
        tdp: 105,
        releaseDate: "2022-09",
        tier: "mid-range",
        aliases: ["7600x", "ryzen-5-7600x"]
      }
`;

// 추가할 GPU 데이터
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
        id: "nvidia-rtx-4070",
        manufacturer: "NVIDIA",
        series: "GeForce RTX 40",
        model: "RTX 4070",
        memory: 12,
        interface: "PCIe 4.0",
        tdp: 200,
        powerConnectors: { "8pin": 1 },
        minPsu: 650,
        slotWidth: 2.0,
        length: 290,
        tier: "mid-high",
        releaseDate: "2023-04"
      },
      {
        id: "nvidia-rtx-4060-ti",
        manufacturer: "NVIDIA",
        series: "GeForce RTX 40",
        model: "RTX 4060 Ti",
        memory: 8,
        interface: "PCIe 4.0",
        tdp: 150,
        powerConnectors: { "8pin": 1 },
        minPsu: 550,
        slotWidth: 2.0,
        length: 280,
        tier: "mid-range",
        releaseDate: "2023-05"
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
      },
      {
        id: "amd-radeon-rx-7800-xt",
        manufacturer: "AMD",
        series: "Radeon RX 7800",
        model: "RX 7800 XT",
        memory: 16,
        interface: "PCIe 4.0",
        tdp: 320,
        powerConnectors: { "8pin": 2 },
        minPsu: 750,
        slotWidth: 2.5,
        length: 300,
        tier: "mid-high",
        releaseDate: "2023-09"
      }
`;

// 추가할 PSU 데이터
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
        id: "corsair-rm-750x",
        manufacturer: "Corsair",
        series: "RM Series",
        model: "RM750x",
        wattage: 750,
        certification: "80+ Gold",
        modular: "full",
        form: "ATX",
        connections: { "24pin": 1, "8pin": 2, "pcie8pin": 3 },
        tier: "mid-high",
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
      },
      {
        id: "evga-supernova-750",
        manufacturer: "EVGA",
        series: "SuperNOVA G6",
        model: "750 G6",
        wattage: 750,
        certification: "80+ Gold",
        modular: "full",
        form: "ATX",
        connections: { "24pin": 1, "8pin": 2, "pcie8pin": 4 },
        tier: "mid-high",
        releaseDate: "2023-06"
      }
`;

// 실행
async function main() {
  try {
    console.log("📝 data.js 수정 중...\n");

    let content = fs.readFileSync("./data.js", "utf-8");
    let modified = false;

    // CPUs 배열에 데이터 추가
    if (content.includes("      ]")) {
      const cpuEndIndex = content.indexOf("    ],\n\n    // 메인보드");
      if (cpuEndIndex !== -1) {
        content = content.slice(0, cpuEndIndex) + "," + additionalCpus + "\n    ],\n\n    // 메인보드" + content.slice(cpuEndIndex + "    ],\n\n    // 메인보드".length);
        modified = true;
        console.log("✓ CPU 데이터 추가됨");
      }
    }

    // GPUs 배열에 데이터 추가
    const gpuEndIndex = content.indexOf("    ],\n\n    // PSU");
    if (gpuEndIndex !== -1) {
      content = content.slice(0, gpuEndIndex) + "," + additionalGpus + "\n    ],\n\n    // PSU" + content.slice(gpuEndIndex + "    ],\n\n    // PSU".length);
      modified = true;
      console.log("✓ GPU 데이터 추가됨");
    }

    // PSUs 배열에 데이터 추가
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
    } else {
      console.error("❌ 수정 위치를 찾을 수 없습니다");
    }
  } catch (error) {
    console.error("❌ 오류:", error.message);
  }
}

main();
