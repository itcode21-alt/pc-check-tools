(() => {
  const routes = {
    slow: { title: "체감 속도 저하: RAM과 SSD를 먼저 확인", summary: "웹·문서·프로그램 실행이 느린 증상은 RAM 부족 또는 저장장치 여유 공간 부족에서 먼저 체감되는 경우가 많습니다.", checks: ["작업 관리자에서 메모리 사용률과 시작 프로그램을 확인하세요.", "C 드라이브 여유 공간과 SSD 건강 상태를 확인하세요.", "RAM이 8GB 이하라면 증설 가능 여부를 먼저 확인하세요."], links: [["RAM 증설 가능 여부 확인", "ram-upgrade-checker.html"], ["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html"], ["SSD 수명 계산기", "ssd-tbw-calculator.html"]] },
    game: { title: "게임 성능 저하: 데스크톱과 노트북의 순서가 다릅니다", summary: "데스크톱은 그래픽카드·파워·RAM을, 노트북은 발열·RAM·SSD·전원 설정을 먼저 구분해야 합니다.", checks: ["데스크톱 그래픽카드 교체 전에는 파워 용량과 보조전원 커넥터를 확인하세요.", "노트북은 그래픽카드가 교체 불가한 모델이 많으므로 RAM·SSD 증설과 발열 관리부터 확인하세요.", "업그레이드 전 게임 중 재부팅이나 화면 꺼짐이 있다면 고장 점검을 먼저 하세요."], links: [["그래픽카드 업그레이드 가이드", "gpu-upgrade-guide.html"], ["파워 용량 계산기", "psu-calculator.html"], ["게임 중 재부팅 점검", "hardware-gaming-reboot.html"]] },
    storage: { title: "저장공간 부족: SSD 증설 또는 교체를 검토", summary: "저장공간 부족은 업데이트 실패와 체감 성능 저하로 이어질 수 있습니다. 현재 SSD의 상태와 슬롯을 먼저 확인하세요.", checks: ["중요한 파일을 백업하고 현재 데이터 증가량을 계산하세요.", "M.2와 2.5인치 SATA 중 추가 장착 가능한 규격을 제조사 매뉴얼에서 확인하세요.", "기존 SSD 교체 시에는 운영체제 복제보다 백업·새 설치가 더 적합한지 판단하세요."], links: [["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html"], ["백업 저장공간 계산기", "backup-storage-calculator.html"], ["SSD 수명 계산기", "ssd-tbw-calculator.html"]] },
    blackout: { title: "화면 꺼짐·재부팅: 업그레이드보다 원인 점검이 먼저", summary: "블랙아웃과 재부팅은 그래픽카드·파워·발열·드라이버 문제일 수 있어 부품을 바로 구매하기보다 안정성 점검이 우선입니다.", checks: ["이벤트 뷰어의 Kernel-Power, WHEA, Display 이벤트를 확인하세요.", "그래픽카드 보조전원과 파워 용량·연식을 확인하세요.", "온도와 드라이버를 점검한 뒤에도 문제가 반복될 때 교체를 검토하세요."], links: [["이벤트 로그 분석", "diagnostic.html#diagnostic-event"], ["파워 용량 계산기", "psu-calculator.html"], ["화면 꺼짐·블랙아웃 가이드", "hardware-no-display.html"]] },
    boot: { title: "부팅 실패: 업그레이드보다 복구·진단이 우선", summary: "윈도우 진입 불가는 저장장치·부팅 설정·시스템 파일 문제일 수 있습니다. 원인을 확인하기 전 부품 교체를 권하지 않습니다.", checks: ["BIOS에서 저장장치 인식과 부팅 순서를 확인하세요.", "자동 복구·명령어 가이드로 시스템 파일과 디스크를 점검하세요.", "SSD가 인식되지 않거나 오류가 반복될 때만 교체·증설을 검토하세요."], links: [["윈도우 복구 명령어", "windows-repair-tools-guide.html"], ["NVMe 인식 지연 가이드", "hardware-nvme-delay.html"], ["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html"]] },
  };
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("upgrade-form");
    if (!form) return;
    const result = document.getElementById("upgrade-result");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const device = document.getElementById("upgrade-device").value;
      const goal = document.getElementById("upgrade-goal").value;
      const ram = document.getElementById("upgrade-ram").value;
      const route = routes[goal];
      document.getElementById("upgrade-title").textContent = route.title;
      document.getElementById("upgrade-summary").textContent = device === "laptop" && goal === "game" ? "노트북은 대부분 그래픽카드를 교체할 수 없습니다. RAM·SSD·발열 상태를 우선 확인하세요." : route.summary;
      const checks = [...route.checks];
      if (ram === "8" && (goal === "slow" || goal === "game")) checks.unshift("현재 RAM이 8GB 이하라면 RAM 증설 여부를 우선 확인하세요.");
      document.getElementById("upgrade-checks").innerHTML = checks.map((check) => `<li>${check}</li>`).join("");
      document.getElementById("upgrade-links").innerHTML = route.links.map(([label, url]) => `<a href="${url}">${label}</a>`).join("");
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
