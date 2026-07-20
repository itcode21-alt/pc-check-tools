(() => {
  const routes = {
    slow: {
      title: "체감 속도 저하: RAM과 SSD를 먼저 확인",
      summary: "웹·문서·프로그램 실행이 느린 경우는 메모리 부족, 시작 프로그램, SSD 여유 공간·상태에서 먼저 차이가 나는 경우가 많습니다.",
      checks: ["작업 관리자에서 메모리 사용률과 시작 프로그램을 확인하세요.", "C 드라이브 여유 공간과 SSD 건강 상태를 확인하세요."],
      links: [["RAM 증설 가능 여부 확인", "ram-upgrade-checker.html"], ["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html"], ["SSD SMART·건강 상태 확인", "ssd-smart-health-guide.html"]],
    },
    game: {
      title: "게임 성능 저하: 기기 종류에 따라 순서가 다릅니다",
      summary: "데스크톱은 그래픽카드·파워·RAM을, 노트북은 발열·RAM·SSD·전원 설정을 먼저 구분해야 합니다.",
      checks: ["게임 중 재부팅이나 화면 꺼짐이 있다면 새 부품 구매보다 안정성 점검을 먼저 하세요.", "그래픽카드 교체 전에는 현재 파워 용량과 보조전원 커넥터를 확인하세요."],
      links: [["그래픽카드 업그레이드 가이드", "gpu-upgrade-guide.html"], ["파워 용량 계산기", "psu-calculator.html"], ["게임 중 재부팅 점검", "hardware-gaming-reboot.html"]],
    },
    storage: {
      title: "저장공간 부족: SSD 증설 또는 교체를 검토",
      summary: "저장공간 부족은 업데이트 실패와 체감 성능 저하로 이어질 수 있습니다. 슬롯·규격·백업 계획을 먼저 확인하세요.",
      checks: ["중요한 파일을 백업하고 현재 데이터 증가량을 계산하세요.", "M.2와 2.5인치 SATA 중 추가 장착 가능한 규격을 제조사 매뉴얼에서 확인하세요."],
      links: [["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html"], ["백업 저장공간 계산기", "backup-storage-calculator.html"], ["SSD 수명 계산기", "ssd-tbw-calculator.html"]],
    },
    blackout: {
      title: "화면 꺼짐·재부팅: 업그레이드보다 원인 점검이 먼저",
      summary: "블랙아웃과 재부팅은 그래픽카드·파워·발열·드라이버 문제일 수 있습니다. 부품을 바로 구매하지 말고 안정성부터 확인하세요.",
      checks: ["이벤트 뷰어의 Kernel-Power, WHEA, Display 이벤트를 확인하세요.", "그래픽카드 보조전원·파워 연식·온도와 드라이버를 함께 점검하세요."],
      links: [["이벤트 로그 분석", "diagnostic.html#diagnostic-event"], ["파워 용량 계산기", "psu-calculator.html"], ["화면 꺼짐·블랙아웃 가이드", "hardware-no-display.html"]],
    },
    boot: {
      title: "부팅 실패: 업그레이드보다 복구·진단이 우선",
      summary: "Windows 진입 불가는 저장장치·부팅 설정·시스템 파일 문제일 수 있습니다. 원인을 확인하기 전 부품 교체를 권하지 않습니다.",
      checks: ["BIOS에서 저장장치 인식과 부팅 순서를 확인하세요.", "자동 복구·명령어 가이드로 시스템 파일과 디스크를 점검하세요."],
      links: [["BIOS·부팅 순서 확인", "bios-boot-guide.html"], ["윈도우 복구 명령어", "windows-repair-tools-guide.html"], ["NVMe 인식 지연 가이드", "hardware-nvme-delay.html"]],
    },
  };

  const hardwareChecks = [
    "작업 관리자(Ctrl+Shift+Esc) → 성능에서 RAM 용량·SSD 종류를 확인합니다.",
    "무료 HWiNFO의 Summary 또는 Sensors에서 CPU·그래픽카드·온도 정보를 확인합니다.",
    "정확한 모델명으로 제조사 지원 페이지의 사양표·서비스 매뉴얼을 확인합니다.",
  ];

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upgrade-form");
    if (!form) return;
    const result = document.getElementById("upgrade-result");
    const deviceField = document.getElementById("upgrade-device");
    const powerField = document.getElementById("upgrade-power-field");
    const powerInput = document.getElementById("upgrade-power");
    const renderDeviceFields = () => {
      const laptop = deviceField.value === "laptop";
      powerField.hidden = laptop;
      powerInput.disabled = laptop;
      if (laptop) powerInput.value = "unknown";
    };
    renderDeviceFields();
    deviceField.addEventListener("change", renderDeviceFields);

    form.addEventListener("reset", () => window.setTimeout(() => {
      renderDeviceFields();
      result.hidden = true;
    }));
    document.getElementById("upgrade-print").addEventListener("click", () => window.print());

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const device = deviceField.value;
      const goal = document.getElementById("upgrade-goal").value;
      const ram = document.getElementById("upgrade-ram").value;
      const ramSlot = document.getElementById("upgrade-ram-slot").value;
      const ssdSlot = document.getElementById("upgrade-ssd-slot").value;
      const power = powerInput.value;
      const route = routes[goal];
      const checks = [...route.checks];
      const verify = [];
      let decision = "업그레이드 전 확인 필요";

      if (goal === "blackout" || goal === "boot") decision = "고장 점검 우선";
      if (ram === "8" && ["slow", "game"].includes(goal)) checks.unshift("현재 RAM이 8GB 이하라면 RAM 증설 가능 여부를 우선 확인하세요.");
      if (ram === "16" && goal === "slow") checks.unshift("RAM이 16GB라면 단순 증설보다 시작 프로그램·SSD 여유 공간을 먼저 확인하세요.");
      if (ram === "32" && ["slow", "game"].includes(goal)) checks.unshift("RAM이 32GB 이상이면 RAM 증설 효과가 작을 수 있어 사용률과 GPU·SSD 병목을 먼저 확인하세요.");
      if (ramSlot === "soldered") checks.push("납땜 메모리만 있는 모델은 RAM 증설보다 SSD·설정·발열 관리 가능성을 확인하세요.");
      if (ramSlot === "unknown" || ram === "unknown") verify.push(hardwareChecks[0]);
      if (ssdSlot === "free") checks.push("추가 SSD를 장착할 수 있다면 기존 Windows SSD를 유지한 채 저장공간부터 늘릴 수 있습니다.");
      if (ssdSlot === "replace") checks.push("기존 SSD를 교체해야 한다면 백업과 운영체제 이전·새 설치 중 어떤 방식이 맞는지 먼저 결정하세요.");
      if (ssdSlot === "none") checks.push("SSD 교체·추가가 어려운 기기는 외장 저장장치나 데이터 정리로 여유 공간을 확보하는 방법도 검토하세요.");
      if (ssdSlot === "unknown") verify.push("제조사 매뉴얼에서 M.2 규격·길이와 2.5인치 장착 공간을 확인합니다.");

      if (device === "laptop") {
        checks.unshift("노트북은 대부분 그래픽카드 교체가 불가능합니다. RAM·SSD·발열과 전원 설정을 우선 확인하세요.");
        verify.push("하판 라벨 또는 시스템 정보에서 세부 모델명을 확인하고, 보증·분해 안내를 먼저 읽습니다.");
      } else if (goal === "game" && power !== "checked") {
        checks.push("그래픽카드 구매 전 파워 정격 용량, PCIe 보조전원, 케이스 장착 길이를 확인하세요.");
        verify.push("파워 라벨의 정격 용량과 PCIe 6+2핀·12V-2x6 보조전원 수를 확인합니다.");
      }
      if (power === "unknown" && device === "desktop") verify.push("케이스 측면을 열기 어렵다면 파워 라벨 사진이나 조립 사양서로 용량을 확인합니다.");
      if (!verify.length) verify.push("현재 구성 정보를 확인했다면 제조사 매뉴얼과 목표 부품의 규격을 한 항목씩 비교하세요.");
      verify.push(hardwareChecks[1], hardwareChecks[2]);

      document.getElementById("upgrade-decision").textContent = decision;
      document.getElementById("upgrade-decision").className = `upgrade-decision ${decision === "고장 점검 우선" ? "is-diagnostic" : ""}`;
      document.getElementById("upgrade-title").textContent = route.title;
      document.getElementById("upgrade-summary").textContent = device === "laptop" && goal === "game" ? "노트북은 GPU 교체가 어려운 경우가 대부분입니다. RAM·SSD·발열 상태부터 확인한 뒤 모델별 업그레이드 가능 범위를 판단하세요." : route.summary;
      document.getElementById("upgrade-checks").innerHTML = checks.map((check) => `<li>${check}</li>`).join("");
      document.getElementById("upgrade-verify").innerHTML = [...new Set(verify)].map((check) => `<li>${check}</li>`).join("");
      document.getElementById("upgrade-links").innerHTML = route.links.map(([label, url]) => `<a href="${url}">${label}</a>`).join("");
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
