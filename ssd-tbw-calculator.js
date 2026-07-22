(() => {
  // 제조사 TBW를 모를 때 쓰는 보수적 추정값입니다. 실제 보증 TBW는 제품 스펙시트가 우선입니다.
  const estimatedTbwByNand = {
    tlc: { 250: 150, 500: 300, 1000: 600, 2000: 1200, 4000: 2400 },
    qlc: { 250: 50, 500: 100, 1000: 200, 2000: 400, 4000: 800 },
    unknown: { 250: 100, 500: 200, 1000: 400, 2000: 800, 4000: 1600 },
  };

  const nandLabels = { tlc: "TLC", qlc: "QLC", unknown: "NAND 모름" };
  const formFactorLabels = {
    "sata-25": "2.5인치 SATA",
    "m2-sata": "M.2 SATA",
    "m2-nvme": "M.2 NVMe",
    unknown: "SSD 형태 모름",
  };
  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 2500;

  const getEstimatedTbw = (capacity, nandType) => {
    const estimates = estimatedTbwByNand[nandType] || estimatedTbwByNand.unknown;
    return estimates[capacity] || estimates[1000];
  };

  const getShopLink = async ({ capacity, formFactor, nandType }) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
    try {
      const params = new URLSearchParams({
        capacity: String(capacity),
        form_factor: formFactor,
        nand_type: nandType,
      });
      const response = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/ssd-link?${params}`, { signal: controller.signal });
      if (!response.ok) return null;
      const data = await response.json();
      return data.url || null;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("tbw-form");
    if (!form) return;

    const result = document.getElementById("tbw-result");
    const percentEl = document.getElementById("tbw-percent");
    const usedEl = document.getElementById("tbw-used");
    const totalEl = document.getElementById("tbw-total");
    const yearsEl = document.getElementById("tbw-years");
    const estimateEl = document.getElementById("tbw-estimate");
    const noteEl = document.getElementById("tbw-note");
    const shopWrap = document.getElementById("tbw-shop-wrap");
    const shopLink = document.getElementById("tbw-shop-link");
    const affiliateNote = document.getElementById("tbw-affiliate-note");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const capacity = Number(document.getElementById("tbw-capacity").value);
      const formFactor = document.getElementById("tbw-form-factor").value;
      const nandType = document.getElementById("tbw-nand-type").value;
      const specValue = document.getElementById("tbw-spec").value;
      const estimatedTbw = getEstimatedTbw(capacity, nandType);
      const tbw = specValue === "auto" ? estimatedTbw : Number(specValue);
      const written = Math.max(0, Number(document.getElementById("tbw-written").value) || 0);
      const dailyGb = Number(document.getElementById("tbw-daily").value);

      const percent = Math.min(999, (written / tbw) * 100);
      const remainingTb = tbw - written;
      const yearsLeft = remainingTb > 0 ? remainingTb / ((dailyGb * 365) / 1000) : 0;

      percentEl.textContent = percent.toFixed(1);
      usedEl.textContent = written.toLocaleString();
      totalEl.textContent = tbw.toLocaleString();
      estimateEl.textContent = specValue === "auto"
        ? `제조사 TBW를 모름으로 선택해 ${nandLabels[nandType]} · ${capacity >= 1000 ? `${capacity / 1000}TB` : `${capacity}GB`} 기준 추정값 ${estimatedTbw.toLocaleString()}TBW를 적용했습니다.`
        : `제조사 TBW ${tbw.toLocaleString()}TBW를 적용했습니다. NAND 선택값은 교체용 SSD 검색 조건에 사용합니다.`;

      let showShop = false;
      if (remainingTb <= 0) {
        yearsEl.textContent = "보증 쓰기량(TBW) 초과";
        noteEl.textContent = "제조사 보증 쓰기량을 이미 넘긴 상태입니다. 당장 고장 나는 것은 아니지만, 중요한 데이터는 지금 백업하고 교체를 준비하는 것이 안전합니다.";
        showShop = true;
      } else if (percent >= 80) {
        yearsEl.textContent = `약 ${yearsLeft.toFixed(1)}년 (현재 사용 패턴 기준)`;
        noteEl.textContent = "TBW의 80% 이상을 사용했습니다. 데이터 백업 주기를 앞당기고 교체 시기를 검토해 보세요.";
        showShop = true;
      } else {
        yearsEl.textContent = yearsLeft > 30 ? "30년 이상 (사실상 수명 걱정 없음)" : `약 ${yearsLeft.toFixed(1)}년 (현재 사용 패턴 기준)`;
        noteEl.textContent = "현재 사용 패턴이라면 TBW 기준으로는 여유가 충분합니다. 갑작스러운 고장에 대비한 기본 백업만 유지하면 됩니다.";
      }

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });

      shopWrap.hidden = true;
      affiliateNote.hidden = true;
      if (!showShop) return;

      shopLink.textContent = `${formFactorLabels[formFactor]} · ${nandLabels[nandType]} SSD 찾아보기`;
      const shopUrl = await getShopLink({ capacity, formFactor, nandType });
      if (!shopUrl) return;
      shopLink.href = shopUrl;
      shopWrap.hidden = false;
      affiliateNote.hidden = false;
    });
  });
})();
