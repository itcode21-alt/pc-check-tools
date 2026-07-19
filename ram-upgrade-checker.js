(() => {
  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ram-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const device = document.getElementById("ram-device").value;
      const current = Number(document.getElementById("ram-current").value);
      const slot = document.getElementById("ram-slot").value;
      const ddr = document.getElementById("ram-ddr").value;
      const title = document.getElementById("ram-title");
      const summary = document.getElementById("ram-summary");
      const checks = [];
      if (slot === "soldered") { title.textContent = "추가 RAM 증설이 어려운 구성입니다"; summary.textContent = "납땜 메모리만 있는 모델은 일반적인 RAM 교체·증설이 불가능할 수 있습니다."; checks.push("제조사 매뉴얼에서 별도 SO-DIMM 슬롯이 있는지 다시 확인하세요.", "RAM 증설 대신 SSD 여유 공간 확보, 시작 프로그램 정리, 필요 시 기기 교체를 검토하세요."); }
      else if (slot === "free") { title.textContent = "빈 슬롯을 이용한 증설 가능성을 확인하세요"; summary.textContent = "빈 슬롯이 있다면 같은 DDR 세대와 맞는 규격의 메모리를 추가하는 방식이 가장 간단합니다."; checks.push(`${device === "laptop" ? "SO-DIMM" : "DIMM"} 규격과 DDR 세대를 확인하세요.`, "기존 메모리와 용량·속도가 다른 경우 동작 속도와 듀얼 채널 조건을 확인하세요."); }
      else if (slot === "replace") { title.textContent = "기존 메모리 교체 방식으로 검토하세요"; summary.textContent = "빈 슬롯이 없으면 현재 메모리를 더 큰 용량의 모듈로 교체해야 할 수 있습니다."; checks.push("제조사 최대 지원 용량과 슬롯당 최대 용량을 확인하세요.", "교체 전 현재 메모리의 규격·개수·장착 위치를 사진으로 기록하세요."); }
      else { title.textContent = "모델명으로 확장 가능 여부를 먼저 확인하세요"; summary.textContent = "슬롯과 납땜 여부를 모르면 메모리를 구매하기 전에 제조사 지원 페이지에서 모델별 사양을 확인해야 합니다."; checks.push("노트북 하판을 열기 전 보증 조건과 서비스 매뉴얼을 확인하세요.", "작업 관리자 > 성능 > 메모리에서 사용 중인 슬롯 수를 참고하되, 최종 판단은 제조사 사양표로 하세요."); }
      if (current <= 8) checks.unshift("현재 8GB 이하라면 여러 프로그램·브라우저 탭·게임을 함께 사용할 때 RAM 부족이 체감될 수 있습니다.");
      if (ddr === "unknown") checks.push("DDR 세대를 모르면 메모리 구매를 보류하고 현재 장착 규격을 먼저 확인하세요.");
      document.getElementById("ram-checks").innerHTML = checks.map((check) => `<li>${check}</li>`).join("");
      document.getElementById("ram-result").hidden = false;
      document.getElementById("ram-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
