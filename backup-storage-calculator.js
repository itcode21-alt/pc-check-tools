(() => {
  // 판매 용량보다 실제 필요 공간이 작아도 급격한 데이터 증가를 대비해 한 단계 큰 용량을 권장합니다.
  const storageTiersTb = [1, 2, 4, 8, 12, 16];
  const formatCapacity = (gb) => (gb >= 1000 ? `${(gb / 1000).toFixed(gb % 1000 ? 1 : 0)}TB` : `${Math.ceil(gb)}GB`);

  // ai-service(/api/coupang/backup-link)가 권장 용량(TB)으로 실시간 검색
  // 딥링크를 만들어준다. 실패하면 일반 쿠팡 검색 URL로 대체한다.
  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 5000;
  const staticShopLinkFor = (tierTb) => `https://www.coupang.com/np/search?q=${encodeURIComponent(`외장하드 ${tierTb}TB`)}`;
  const shopLinkFor = async (tierTb) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
      const res = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/backup-link?capacity=${tierTb}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return staticShopLinkFor(tierTb);
      const data = await res.json();
      return data.url || staticShopLinkFor(tierTb);
    } catch {
      return staticShopLinkFor(tierTb);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("backup-form");
    if (!form) return;

    const result = document.getElementById("backup-result");
    const projectedEl = document.getElementById("backup-projected");
    const requiredEl = document.getElementById("backup-required");
    const recommendEl = document.getElementById("backup-recommend");
    const noteEl = document.getElementById("backup-note");
    const shopLink = document.getElementById("backup-shop-link");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const currentGb = Math.max(1, Number(document.getElementById("backup-current").value) || 0);
      const monthlyGrowthGb = Math.max(0, Number(document.getElementById("backup-growth").value) || 0);
      const years = Number(document.getElementById("backup-years").value);
      const copies = Number(document.getElementById("backup-copies").value);
      const projectedGb = currentGb + monthlyGrowthGb * years * 12;
      const requiredGb = projectedGb * copies * 1.2;
      const tierTb = storageTiersTb.find((tier) => tier * 1000 >= requiredGb) || Math.ceil(requiredGb / 1000);

      projectedEl.textContent = formatCapacity(projectedGb);
      requiredEl.textContent = `${formatCapacity(requiredGb)} (${copies}개 사본·20% 여유 포함)`;
      recommendEl.textContent = `${tierTb}TB 이상`;
      noteEl.textContent = copies === 1
        ? "사본이 1개뿐이면 저장장치 고장이나 랜섬웨어 발생 시 복구가 어려울 수 있습니다. 중요한 자료는 최소 2개 사본을 유지하세요."
        : "용량 계산은 충분해도 같은 장소에만 보관하면 화재·분실·랜섬웨어에 함께 영향을 받을 수 있습니다. 사본 1개는 분리 보관하세요.";

      shopLink.href = staticShopLinkFor(tierTb);
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      shopLink.href = await shopLinkFor(tierTb);
    });
  });
})();
