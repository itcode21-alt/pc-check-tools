(() => {
  // ai-service(/api/coupang/ups-link)가 실시간으로 딥링크를 만들어주므로,
  // 아래 정적 링크는 그 요청이 실패했을 때만 쓰이는 fallback입니다.
  const shopLinksByVa = {
    650: "https://link.coupang.com/a/fsDys80jwO",
    1000: "https://link.coupang.com/a/fsDyyf4fOS",
    1500: "https://link.coupang.com/a/fsDyDtrMOW",
    2000: "https://link.coupang.com/a/fsDyILRGjA",
  };
  const vaSteps = [650, 1000, 1500, 2000, 3000];
  const staticShopLinkFor = (va) => {
    const tiers = Object.keys(shopLinksByVa).map(Number).sort((a, b) => a - b);
    const tier = tiers.find((t) => t >= va) || tiers[tiers.length - 1];
    return shopLinksByVa[tier];
  };
  const roundUpToStep = (value) => vaSteps.find((step) => step >= value) || Math.ceil(value / 500) * 500;

  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 5000;
  const shopLinkFor = async (va) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
      const res = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/ups-link?va=${va}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return staticShopLinkFor(va);
      const data = await res.json();
      return data.url || staticShopLinkFor(va);
    } catch {
      return staticShopLinkFor(va);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("ups-form");
    if (!form) return;
    const result = document.getElementById("ups-result");
    const loadEl = document.getElementById("ups-load");
    const vaEl = document.getElementById("ups-va");
    const wattEl = document.getElementById("ups-watt");
    const noteEl = document.getElementById("ups-note");
    const shopLink = document.getElementById("ups-shop-link");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const pcWatt = Number(document.getElementById("ups-pc").value);
      const monitorCount = Math.max(0, Number(document.getElementById("ups-monitor-count").value) || 0);
      const monitorWatt = Number(document.getElementById("ups-monitor-watt").value);
      const extraWatt = Math.max(0, Number(document.getElementById("ups-extra").value) || 0);

      const totalWatt = pcWatt + monitorCount * monitorWatt + extraWatt;
      const va = roundUpToStep((totalWatt / 0.6) * 1.3);
      const ratedWatt = Math.round(va * 0.6);

      loadEl.textContent = totalWatt.toLocaleString();
      vaEl.textContent = `${va.toLocaleString()}VA`;
      wattEl.textContent = ratedWatt.toLocaleString();

      if (totalWatt / 0.6 > 2500) {
        noteEl.textContent = "연결 부하가 큰 편입니다. 단일 UPS보다 랙형·용량 확장이 가능한 제품이나 다중 UPS 구성을 검토해 보세요.";
      } else {
        noteEl.textContent = "일반 가정용 콘센트형 UPS로 충분히 커버되는 범위입니다.";
      }
      shopLink.href = staticShopLinkFor(va);

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      shopLink.href = await shopLinkFor(va);
    });
  });
})();
