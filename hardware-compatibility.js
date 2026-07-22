/**
 * 부품 호환성 검사 클래스
 *
 * 사용법:
 *   const checker = new HardwareCompatibility(window.SITE_DATA);
 *   const result = checker.checkCpuMotherboard("intel-core-i9-13900k", "asus-rog-strix-z790");
 */

class HardwareCompatibility {
  constructor(siteData) {
    this.data = siteData || {};
    this.parts = this.data.parts || {};
  }

  /**
   * CPU와 메인보드 호환성 검사
   * @param {string} cpuId - CPU ID
   * @param {string} motherboardId - 메인보드 ID
   * @returns {Object} { compatible: boolean, issues: string[], warnings: string[] }
   */
  checkCpuMotherboard(cpuId, motherboardId) {
    const result = {
      compatible: true,
      issues: [],
      warnings: [],
      details: {}
    };

    const cpu = this.findPart("cpus", cpuId);
    const mb = this.findPart("motherboards", motherboardId);

    if (!cpu || !mb) {
      result.compatible = false;
      result.issues.push("CPU 또는 메인보드 정보를 찾을 수 없습니다.");
      return result;
    }

    result.details.cpu = cpu;
    result.details.motherboard = mb;

    // 1. 소켓 확인
    if (cpu.socket !== mb.socket) {
      result.compatible = false;
      result.issues.push(
        `소켓 불일치: CPU는 ${cpu.socket}, 메인보드는 ${mb.socket}`
      );
      return result;
    }

    // 2. RAM 타입 호환성
    if (
      mb.supportedRamTypes &&
      !mb.supportedRamTypes.includes("DDR5")
    ) {
      result.warnings.push("이 메인보드는 DDR4만 지원합니다. DDR5 구매 시 주의하세요.");
    }

    // 3. CPU TDP 확인 (VRM 안정성)
    const maxCpuTdp = mb.maxCpuTdp || 200; // 기본값
    if (cpu.tdp > maxCpuTdp) {
      result.warnings.push(
        `고발열 CPU: ${cpu.tdp}W (메인보드 권장: ${maxCpuTdp}W 이하)`
      );
    }

    // 4. PCIe 5.0 지원 확인
    if (!mb.pcie || !mb.pcie["5.0"]) {
      result.warnings.push("이 메인보드는 PCIe 5.0을 지원하지 않습니다. 최신 GPU 구매 시 PCIe 4.0 모드로 작동합니다.");
    }

    // 5. 12VHPWR 지원 확인
    if (!mb.powerConnectors || !mb.powerConnectors.pcie12vhpwr) {
      result.warnings.push("이 메인보드는 12VHPWR을 지원하지 않습니다. RTX 4090 등 최신 고성능 GPU 구매 시 전력 연결에 주의하세요.");
    }

    return result;
  }

  /**
   * GPU와 파워 호환성 검사
   * @param {string} gpuId - GPU ID
   * @param {string} psuId - 파워 ID
   * @param {number} basePower - 시스템 기본 전력 (W, 기본값 100)
   * @returns {Object} { compatible: boolean, issues: string[], warnings: string[] }
   */
  checkGpuPsu(gpuId, psuId, basePower = 100) {
    const result = {
      compatible: true,
      issues: [],
      warnings: [],
      details: {}
    };

    const gpu = this.findPart("gpus", gpuId);
    const psu = this.findPart("psus", psuId);

    if (!gpu || !psu) {
      result.compatible = false;
      result.issues.push("GPU 또는 파워 정보를 찾을 수 없습니다.");
      return result;
    }

    result.details.gpu = gpu;
    result.details.psu = psu;

    // 1. 전체 전력 확인
    const totalPower = basePower + gpu.tdp + (gpu.cpuTdp || 0);
    const safeThreshold = psu.wattage * 0.85; // 파워 용량의 85%를 안전 범위로 설정

    if (totalPower > safeThreshold) {
      result.compatible = false;
      result.issues.push(
        `전력 부족: 필요 ${totalPower}W > 안전 범위 ${safeThreshold}W (파워 ${psu.wattage}W의 85%)`
      );
    } else if (totalPower > psu.wattage * 0.7) {
      result.warnings.push(
        `높은 전력 사용: 필요 ${totalPower}W (파워 용량의 ${(totalPower / psu.wattage * 100).toFixed(0)}%)`
      );
    }

    // 2. 전력 커넥터 확인
    if (gpu.powerConnectors) {
      if (gpu.powerConnectors["12vhpwr"]) {
        if (!psu.connections || !psu.connections["12vhpwr"]) {
          result.compatible = false;
          result.issues.push(
            "GPU가 12VHPWR을 필요로 하지만, 파워가 12VHPWR을 지원하지 않습니다."
          );
        }
      }

      if (gpu.powerConnectors["8pin"]) {
        const needed = gpu.powerConnectors["8pin"];
        const available = (psu.connections && psu.connections["pcie8pin"]) || 0;
        if (available < needed) {
          result.compatible = false;
          result.issues.push(
            `8-pin 포트 부족: GPU 필요 ${needed}개, 파워 제공 ${available}개`
          );
        }
      }
    }

    // 3. 권장 파워 확인
    if (gpu.minPsu && psu.wattage < gpu.minPsu) {
      result.warnings.push(
        `권장 파워 미달: 권장 ${gpu.minPsu}W, 선택한 파워 ${psu.wattage}W`
      );
    }

    return result;
  }

  /**
   * SSD와 메인보드 호환성 검사
   * @param {string} ssdId - SSD ID
   * @param {string} motherboardId - 메인보드 ID
   * @returns {Object} { compatible: boolean, issues: string[], warnings: string[] }
   */
  checkSsdMotherboard(ssdId, motherboardId) {
    const result = {
      compatible: true,
      issues: [],
      warnings: [],
      details: {}
    };

    const ssd = this.findPart("ssds", ssdId);
    const mb = this.findPart("motherboards", motherboardId);

    if (!ssd || !mb) {
      result.compatible = false;
      result.issues.push("SSD 또는 메인보드 정보를 찾을 수 없습니다.");
      return result;
    }

    result.details.ssd = ssd;
    result.details.motherboard = mb;

    // 1. M.2 슬롯 확인
    if (ssd.type === "NVMe") {
      if (!mb.nvmeSlots || mb.nvmeSlots === 0) {
        result.compatible = false;
        result.issues.push("메인보드가 M.2 NVMe 슬롯을 지원하지 않습니다.");
        return result;
      }

      // 2. PCIe 세대 호환성
      const ssdPcie = ssd.interface.match(/PCIe (\d\.\d)/)?.[1];
      if (ssdPcie === "5.0" && (!mb.pcie || !mb.pcie["5.0"])) {
        result.warnings.push(
          "SSD가 PCIe 5.0이지만, 메인보드는 PCIe 4.0 이하입니다. PCIe 4.0 모드로 작동하면 성능 저하가 있을 수 있습니다."
        );
      }
    }

    return result;
  }

  /**
   * RAM과 메인보드 호환성 검사
   * @param {string} ramId - RAM ID
   * @param {string} motherboardId - 메인보드 ID
   * @returns {Object} { compatible: boolean, issues: string[], warnings: string[] }
   */
  checkRamMotherboard(ramId, motherboardId) {
    const result = {
      compatible: true,
      issues: [],
      warnings: [],
      details: {}
    };

    const ram = this.findPart("rams", ramId);
    const mb = this.findPart("motherboards", motherboardId);

    if (!ram || !mb) {
      result.compatible = false;
      result.issues.push("RAM 또는 메인보드 정보를 찾을 수 없습니다.");
      return result;
    }

    result.details.ram = ram;
    result.details.motherboard = mb;

    // 1. RAM 타입 확인
    if (
      mb.supportedRamTypes &&
      !mb.supportedRamTypes.includes(ram.type)
    ) {
      result.compatible = false;
      result.issues.push(
        `RAM 타입 불일치: 선택한 RAM은 ${ram.type}, 메인보드는 ${mb.supportedRamTypes.join("/")} 지원`
      );
    }

    // 2. 슬롯 수 확인
    if (mb.ramSlots) {
      result.details.maxModules = Math.min(ram.capacity.length, mb.ramSlots);
      if (mb.ramSlots < 2 && ram.capacity.includes(16)) {
        result.warnings.push(
          "메인보드의 RAM 슬롯이 1개만 있습니다. 32GB 이상 확장 시 제약이 있을 수 있습니다."
        );
      }
    }

    // 3. 최대 용량 확인
    if (mb.maxRam && ram.capacity[ram.capacity.length - 1] > mb.maxRam) {
      result.warnings.push(
        `최대 용량 확인: 메인보드 지원 최대 ${mb.maxRam}GB, 선택한 RAM은 더 큰 용량도 지원합니다.`
      );
    }

    return result;
  }

  /**
   * 부품 ID로 부품 정보 검색
   * @param {string} category - 부품 카테고리 (cpus, motherboards, rams 등)
   * @param {string} id - 부품 ID
   * @returns {Object|null} 부품 객체 또는 null
   */
  findPart(category, id) {
    if (!this.parts[category]) return null;
    return this.parts[category].find((part) => part.id === id) || null;
  }

  /**
   * 카테고리의 모든 부품 조회
   * @param {string} category - 부품 카테고리
   * @returns {Array} 부품 배열
   */
  getAllParts(category) {
    return this.parts[category] || [];
  }

  /**
   * 소켓별 CPU 필터링
   * @param {string} socket - 소켓 (LGA1700, AM5 등)
   * @returns {Array} 해당 소켓의 CPU 배열
   */
  getCpusBySocket(socket) {
    return this.getAllParts("cpus").filter((cpu) => cpu.socket === socket);
  }

  /**
   * 소켓별 메인보드 필터링
   * @param {string} socket - 소켓
   * @returns {Array} 해당 소켓의 메인보드 배열
   */
  getMotherboardsBySocket(socket) {
    return this.getAllParts("motherboards").filter((mb) => mb.socket === socket);
  }

  /**
   * 성능 티어별 부품 필터링
   * @param {string} category - 부품 카테고리
   * @param {string} tier - 티어 (mid-range, high-end, premium 등)
   * @returns {Array} 해당 티어의 부품 배열
   */
  getPartsByTier(category, tier) {
    return this.getAllParts(category).filter((part) => part.tier === tier);
  }
}

// 글로벌 변수에 노출
window.HardwareCompatibility = HardwareCompatibility;
