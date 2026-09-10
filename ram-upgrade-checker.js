(() => {
  // ai-service(/api/coupang/ram-link)가 기기 종류·DDR 세대로 실시간 검색
  // 딥링크를 만들어준다. 응답이 실패하면 아래 표의 딥링크로 대체한다.
  //
  // 이 표는 검색 URL이 아니라 파트너스가 발급한 딥링크다(직접 트래킹
  // 파라미터를 붙이면 쿠팡이 오류 페이지를 띄우므로 그렇게 하면 안 되고,
  // API가 발급해준 주소를 그대로 박아둔 것 — PSU 계산기와 같은 방식).
  // 순수 검색 URL은 추적이 안 붙어 수수료가 0원이라 fallback으로 쓰지 않는다
  // (2026-09-10에 터널 장애로 전 카테고리가 검색 URL로 돌던 일이 있었다).
  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 5000;
  const STATIC_SHOP_LINKS = {
    "desktop:ddr4": "https://link.coupang.com/a/gV2jgBGuNo",
    "desktop:ddr5": "https://link.coupang.com/a/gV2jtDDPs4",
    "desktop:unknown": "https://link.coupang.com/a/gV10UqukxM",
    "laptop:ddr4": "https://link.coupang.com/a/gV2jLFEhQy",
    "laptop:ddr5": "https://link.coupang.com/a/gV2jSF7ONw",
    "laptop:unknown": "https://link.coupang.com/a/gV2jZdxUd2",
  };
  const staticShopLinkFor = (device, ddr) => {
    const deviceKey = device === "laptop" ? "laptop" : "desktop";
    const ddrKey = ddr === "ddr4" || ddr === "ddr5" ? ddr : "unknown";
    return STATIC_SHOP_LINKS[`${deviceKey}:${ddrKey}`] || STATIC_SHOP_LINKS["desktop:unknown"];
  };
  const shopLinkFor = async (device, ddr) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
      const res = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/ram-link?device=${device}&ddr=${ddr}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return staticShopLinkFor(device, ddr);
      const data = await res.json();
      return data.url || staticShopLinkFor(device, ddr);
    } catch {
      return staticShopLinkFor(device, ddr);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ram-form");
    if (!form) return;
    const shopWrap = document.getElementById("ram-shop-wrap");
    const shopLink = document.getElementById("ram-shop-link");
    const affiliateNote = document.getElementById("ram-affiliate-note");
    form.addEventListener("submit", async (event) => {
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

      shopWrap.hidden = true;
      affiliateNote.hidden = true;
      if (slot === "free" || slot === "replace") {
        shopLink.href = staticShopLinkFor(device, ddr);
        shopWrap.hidden = false;
        affiliateNote.hidden = false;
        shopLink.href = await shopLinkFor(device, ddr);
      }
    });
  });
})();
