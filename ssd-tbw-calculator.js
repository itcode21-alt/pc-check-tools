(() => {
  // 용량(GB) 기준 일반적인 소비자용 NVMe TBW 추정값 (TLC 기준, 제품별 실제 값은 스펙시트 확인)
  const estimatedTbwByCapacity = { 250: 150, 500: 300, 1000: 600, 2000: 1200, 4000: 2400 };

  // 쿠팡파트너스 Open API로 미리 생성한 용량대별 딥링크입니다.
  const shopLinksByCapacity = {
    500: "https://link.coupang.com/a/frP4p7QVUG",
    1000: "https://link.coupang.com/a/frP4vau85c",
    2000: "https://link.coupang.com/a/frP4AiRd36",
    4000: "https://link.coupang.com/a/frP4Fi6NeC",
  };

  const shopLinkFor = (capacityGb) => {
    // 교체 추천은 현재 용량 이상 중 가장 가까운 링크로 연결 (250GB 사용자는 500GB 추천)
    const tiers = Object.keys(shopLinksByCapacity).map(Number).sort((a, b) => a - b);
    const tier = tiers.find((t) => t >= capacityGb) || tiers[tiers.length - 1];
    return shopLinksByCapacity[tier];
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("tbw-form");
    if (!form) return;

    const result = document.getElementById("tbw-result");
    const percentEl = document.getElementById("tbw-percent");
    const usedEl = document.getElementById("tbw-used");
    const totalEl = document.getElementById("tbw-total");
    const yearsEl = document.getElementById("tbw-years");
    const noteEl = document.getElementById("tbw-note");
    const shopWrap = document.getElementById("tbw-shop-wrap");
    const shopLink = document.getElementById("tbw-shop-link");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const capacity = Number(document.getElementById("tbw-capacity").value);
      const specValue = document.getElementById("tbw-spec").value;
      const tbw = specValue === "auto" ? (estimatedTbwByCapacity[capacity] || 600) : Number(specValue);
      const written = Math.max(0, Number(document.getElementById("tbw-written").value) || 0);
      const dailyGb = Number(document.getElementById("tbw-daily").value);

      const percent = Math.min(999, (written / tbw) * 100);
      const remainingTb = tbw - written;
      const yearsLeft = remainingTb > 0 ? remainingTb / ((dailyGb * 365) / 1000) : 0;

      percentEl.textContent = percent.toFixed(1);
      usedEl.textContent = written.toLocaleString();
      totalEl.textContent = tbw.toLocaleString();

      if (remainingTb <= 0) {
        yearsEl.textContent = "보증 쓰기량(TBW) 초과";
        noteEl.textContent = "제조사 보증 쓰기량을 이미 넘긴 상태입니다. 당장 고장 나는 것은 아니지만, 중요한 데이터는 지금 백업하고 교체를 준비하는 것이 안전합니다.";
        shopWrap.hidden = false;
      } else if (percent >= 80) {
        yearsEl.textContent = `약 ${yearsLeft.toFixed(1)}년 (현재 사용 패턴 기준)`;
        noteEl.textContent = "TBW의 80% 이상을 사용했습니다. 데이터 백업 주기를 앞당기고 교체 시기를 검토해 보세요.";
        shopWrap.hidden = false;
      } else {
        yearsEl.textContent = yearsLeft > 30 ? "30년 이상 (사실상 수명 걱정 없음)" : `약 ${yearsLeft.toFixed(1)}년 (현재 사용 패턴 기준)`;
        noteEl.textContent = "현재 사용 패턴이라면 TBW 기준으로는 여유가 충분합니다. 갑작스러운 고장에 대비한 기본 백업만 유지하면 됩니다.";
        shopWrap.hidden = true;
      }
      shopLink.href = shopLinkFor(capacity);

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
