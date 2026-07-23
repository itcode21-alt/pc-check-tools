(() => {
  // 대표 소비전력(W)은 제조사 공식 TDP/보드 파워 기준 참고값입니다.
  const cpuOptions = [
    { label: "인텔 i3 / 라이젠 5 논-X (65W급)", watt: 65 },
    { label: "인텔 i5 (65~125W급)", watt: 100 },
    { label: "인텔 i5-K / 라이젠 7 (105~125W급)", watt: 125 },
    { label: "인텔 i7 (65~125W급)", watt: 125 },
    { label: "인텔 i7-K / 라이젠 9 (105~170W급)", watt: 170 },
    { label: "인텔 i9-K (125~253W급)", watt: 253 },
    { label: "라이젠 X3D 상위 (120~140W급)", watt: 140 },
    { label: "인텔 코어 Ultra 5 (65~125W급)", watt: 125 },
    { label: "인텔 코어 Ultra 7 (65~125W급)", watt: 125 },
    { label: "인텔 코어 Ultra 9 (125~250W급)", watt: 250 },
    { label: "라이젠 9000시리즈 (65~120W급, 9600X~9900X)", watt: 120 },
    { label: "라이젠 9000 상위/X3D (120~230W급, 9950X·9800X3D)", watt: 230 },
  ];

  // GPU 보드 파워(TPD)는 브랜드별 공식 스펙시트 대표값입니다. 세부 모델별 실제 값은 다를 수 있습니다.
  const gpuOptions = [
    { label: "내장 그래픽 / 그래픽카드 없음", watt: 0 },
    { label: "GTX 1050 Ti / 1060 (75~120W급)", watt: 120 },
    { label: "GTX 1070 / 1080 / RX 580 (150~185W급)", watt: 185 },
    { label: "RTX 2060 / 2070 (160~215W급)", watt: 215 },
    { label: "RTX 2080(Ti) / RX 5700 XT (225~260W급)", watt: 260 },
    { label: "RTX 3050 / 3060 (130~170W급)", watt: 170 },
    { label: "RTX 3060 Ti / 3070 / RX 6600·6700 XT (200~230W급)", watt: 230 },
    { label: "RTX 3070 Ti / 3080 / RX 6800 XT (290~320W급)", watt: 320 },
    { label: "RTX 3080 Ti / 3090(Ti) / RX 6900 XT (350~450W급)", watt: 450 },
    { label: "RTX 4060 / RX 7600 (115~165W급)", watt: 165 },
    { label: "RTX 4060 Ti (160W급)", watt: 160 },
    { label: "RTX 4070 / RX 7700 XT (200~245W급)", watt: 245 },
    { label: "RTX 4070 Ti(Super) / RX 7800 XT (263~285W급)", watt: 285 },
    { label: "RTX 4080(Super) / RX 7900 XT (315~320W급)", watt: 320 },
    { label: "RTX 4090 / RX 7900 XTX (355~450W급)", watt: 450 },
    { label: "RTX 5070 / 5070 Ti (220~300W급)", watt: 300 },
    { label: "RTX 5080 / 5090 (360~575W급)", watt: 575 },
  ];

  const psuSteps = [450, 500, 550, 600, 650, 700, 750, 800, 850, 1000, 1200];
  const roundUpToStep = (value) => psuSteps.find((step) => step >= value) || Math.ceil(value / 50) * 50;

  // 쿠팡파트너스 링크 생성 페이지에서 발급한 link.coupang.com/a/... 딥링크입니다.
  // 용량대별로 별도 링크를 만들면 아래 표에 항목을 추가해 더 정확히 매칭할 수 있습니다.
  // (예: watt <= 550 -> 550W 파워 상품 링크, watt <= 750 -> 750W 링크 ...)
  const CP = "AF9550237";
  const cpUrl = (q, sub) => `https://www.coupang.com/np/search?q=${encodeURIComponent(q)}&partnerCode=${CP}&subId=itsvc-${sub}`;
  const COUPANG_WATT_LINKS = [
    { maxWatt: 500,  url: cpUrl("파워서플라이 450W 500W", "psu") },
    { maxWatt: 600,  url: cpUrl("파워서플라이 550W 600W", "psu") },
    { maxWatt: 700,  url: cpUrl("파워서플라이 650W 700W", "psu") },
    { maxWatt: 800,  url: cpUrl("파워서플라이 750W 800W", "psu") },
    { maxWatt: 900,  url: cpUrl("파워서플라이 850W 900W", "psu") },
    { maxWatt: 1000, url: cpUrl("파워서플라이 1000W", "psu") },
  ];
  const COUPANG_DEFAULT_LINK = cpUrl("파워서플라이 1200W", "psu");

  // Mac mini에 ai-service를 배포한 뒤 실제 주소로 바꾸세요 (예: "https://ai.itsvc.co.kr").
  // 비어 있으면 정적 링크(COUPANG_WATT_LINKS/DEFAULT)만 사용합니다.
  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 2500;

  const fillSelect = (select, options) => {
    select.innerHTML = options
      .map((opt, i) => `<option value="${i}">${opt.label}</option>`)
      .join("");
  };

  const staticShopLink = (watt) => {
    const tier = COUPANG_WATT_LINKS.find((entry) => watt <= entry.maxWatt);
    return (tier && tier.url) || COUPANG_DEFAULT_LINK;
  };

  const buildShopLink = async (watt) => {
    if (!AI_SERVICE_BASE_URL) return staticShopLink(watt);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
      const res = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/psu-link?watt=${watt}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return staticShopLink(watt);
      const data = await res.json();
      return data.url || staticShopLink(watt);
    } catch {
      return staticShopLink(watt);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const cpuSelect = document.getElementById("psu-cpu");
    const gpuSelect = document.getElementById("psu-gpu");
    if (!cpuSelect || !gpuSelect) return;

    fillSelect(cpuSelect, cpuOptions);
    fillSelect(gpuSelect, gpuOptions);
    gpuSelect.value = String(gpuOptions.findIndex((opt) => opt.label.startsWith("RTX 4070 /")));

    const form = document.getElementById("psu-form");
    const result = document.getElementById("psu-result");
    const loadEl = document.getElementById("psu-load");
    const recommendEl = document.getElementById("psu-recommend");
    const noteEl = document.getElementById("psu-note");
    const compatibilityEl = document.getElementById("psu-compatibility");
    const shopLink = document.getElementById("psu-shop-link");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const cpu = cpuOptions[Number(cpuSelect.value)];
      const gpu = gpuOptions[Number(gpuSelect.value)];
      const ssdCount = Math.max(0, Number(document.getElementById("psu-ssd").value) || 0);
      const hddCount = Math.max(0, Number(document.getElementById("psu-hdd").value) || 0);
      const overclock = document.getElementById("psu-oc").value === "1";
      const currentPsuWatt = Number(document.getElementById("psu-current").value);

      const baseline = 60 + ssdCount * 5 + hddCount * 10;
      const componentLoad = cpu.watt + gpu.watt + baseline;
      let recommended = componentLoad * 1.3;
      if (overclock) recommended *= 1.15;
      const finalWatt = roundUpToStep(recommended);

      loadEl.textContent = Math.round(componentLoad);
      recommendEl.textContent = finalWatt;
      noteEl.textContent = overclock
        ? "오버클럭·고성능 XMP 사용을 반영해 추가 여유분을 더한 값입니다."
        : "기본 안전 마진(30%)만 반영한 값입니다.";
      if (!currentPsuWatt) {
        compatibilityEl.textContent = "현재 장착한 파워 용량을 모르면 정격 라벨의 W 값을 확인한 뒤 다시 비교해 보세요.";
      } else if (currentPsuWatt < finalWatt) {
        compatibilityEl.textContent = `현재 ${currentPsuWatt}W는 계산된 권장 용량보다 낮습니다. 파워 교체 또는 구성 조정을 검토하세요.`;
      } else if (currentPsuWatt < finalWatt * 1.15) {
        compatibilityEl.textContent = `현재 ${currentPsuWatt}W는 사용할 수 있는 범위지만 여유가 크지 않습니다. 고부하·노후화·추가 업그레이드 시 재검토하세요.`;
      } else {
        compatibilityEl.textContent = `현재 ${currentPsuWatt}W는 계산된 권장 용량을 충족합니다. 보조전원 커넥터와 파워 상태도 함께 확인하세요.`;
      }
      shopLink.href = staticShopLink(finalWatt);
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });

      shopLink.href = await buildShopLink(finalWatt);
    });
  });
})();
