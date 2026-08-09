(() => {
  // ai-service(/api/coupang/monitor-link)가 실시간으로 딥링크를 만들어주므로,
  // 아래 정적 링크는 그 요청이 실패했을 때만 쓰이는 fallback입니다.
  const shopLinks = {
    fhd: "https://link.coupang.com/a/frQIS3Q6XA",
    qhd: "https://link.coupang.com/a/frQIYakgXA",
    uhd: "https://link.coupang.com/a/frQI3cSdcy",
    gaming: "https://link.coupang.com/a/frQI8hxvuC",
  };

  const AI_SERVICE_BASE_URL = "https://ai.itsvc.co.kr";
  const AI_SERVICE_TIMEOUT_MS = 5000;
  const dynamicShopLink = async (type) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), AI_SERVICE_TIMEOUT_MS);
      const res = await fetch(`${AI_SERVICE_BASE_URL}/api/coupang/monitor-link?type=${type}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!res.ok) return shopLinks[type];
      const data = await res.json();
      return data.url || shopLinks[type];
    } catch {
      return shopLinks[type];
    }
  };

  const gradeOf = (ppi) => {
    if (ppi < 90) return { label: "낮음 — 픽셀이 눈에 띄기 쉬움", cls: "low" };
    if (ppi < 110) return { label: "표준 — 100% 배율에 적합", cls: "std" };
    if (ppi < 140) return { label: "선명함", cls: "sharp" };
    return { label: "고밀도 — 125~150% 배율 권장", cls: "hidpi" };
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("mon-form");
    if (!form) return;
    const result = document.getElementById("mon-result");
    const ppiEl = document.getElementById("mon-ppi");
    const gradeEl = document.getElementById("mon-grade");
    const distEl = document.getElementById("mon-distance");
    const noteEl = document.getElementById("mon-note");
    const shopLink = document.getElementById("mon-shop-link");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const size = Math.max(10, Math.min(65, Number(document.getElementById("mon-size").value) || 27));
      const [w, h] = document.getElementById("mon-res").value.split("x").map(Number);
      const use = document.getElementById("mon-use").value;

      const ppi = Math.sqrt(w * w + h * h) / size;
      // 일반 시력 기준 픽셀 격자가 구분되지 않는 최소 거리(인치) ≈ 3438 / PPI
      const distanceCm = (3438 / ppi) * 2.54;

      const grade = gradeOf(ppi);
      ppiEl.textContent = ppi.toFixed(0);
      gradeEl.textContent = grade.label;
      distEl.textContent = `약 ${Math.round(distanceCm)}cm 이상`;

      if (grade.cls === "low") {
        noteEl.textContent = "이 조합은 픽셀 밀도가 낮아 글자 가장자리가 거칠게 보일 수 있습니다. 같은 크기라면 더 높은 해상도를 고려해 보세요.";
      } else if (grade.cls === "hidpi" && use === "office") {
        noteEl.textContent = "고밀도 조합입니다. 윈도우에서 배율을 125~150%로 설정하면 선명하고 읽기 편합니다.";
      } else if (use === "game" && w >= 3840) {
        noteEl.textContent = "4K 게임은 그래픽카드 부담이 큽니다. 상위급 그래픽카드가 아니라면 QHD 고주사율 조합이 체감 성능이 더 좋을 수 있습니다.";
      } else {
        noteEl.textContent = "일반적인 시청 거리(사무 기준 50~70cm)에서 무난하게 쓸 수 있는 조합입니다.";
      }

      let type = "fhd";
      let label = "FHD 모니터 찾아보기";
      if (use === "game") {
        type = "gaming";
        label = "게이밍 모니터(144Hz 이상) 찾아보기";
      } else if (w >= 3840) {
        type = "uhd";
        label = "4K 모니터 찾아보기";
      } else if (w >= 2560) {
        type = "qhd";
        label = "QHD 모니터 찾아보기";
      }
      shopLink.href = shopLinks[type];
      shopLink.textContent = label;

      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
      shopLink.href = await dynamicShopLink(type);
    });
  });
})();
