(() => {
  // 쿠팡파트너스 Open API로 미리 생성한 디스크 용량대별 딥링크입니다.
  const shopLinksByCapacity = {
    4: "https://link.coupang.com/a/frQIygtbc4",
    8: "https://link.coupang.com/a/frQIDmXVe0",
    12: "https://link.coupang.com/a/frQIIUZKTc",
    16: "https://link.coupang.com/a/frQIN1YmRg",
  };
  const shopLinkFor = (capacityTb) => {
    const tiers = Object.keys(shopLinksByCapacity).map(Number).sort((a, b) => a - b);
    const tier = tiers.find((t) => t >= capacityTb) || tiers[tiers.length - 1];
    return shopLinksByCapacity[tier];
  };

  const calc = (level, count, capacity) => {
    switch (level) {
      case "0":
        return { usable: count * capacity, fault: "0개 — 어떤 디스크든 1개 고장 시 전체 데이터 손실", minOk: count >= 2 };
      case "1":
        return { usable: capacity, fault: `${count - 1}개 (복사본이 1개라도 남아 있으면 유지)`, minOk: count >= 2 };
      case "5":
        return { usable: (count - 1) * capacity, fault: "1개", minOk: count >= 3, minMsg: "RAID 5는 디스크가 최소 3개 필요합니다." };
      case "6":
        return { usable: (count - 2) * capacity, fault: "2개", minOk: count >= 4, minMsg: "RAID 6는 디스크가 최소 4개 필요합니다." };
      case "10":
        return {
          usable: (count / 2) * capacity,
          fault: "최소 1개 보장 (미러 쌍마다 1개씩, 최대 절반)",
          minOk: count >= 4 && count % 2 === 0,
          minMsg: "RAID 10은 짝수 개(최소 4개)의 디스크가 필요합니다.",
        };
      default:
        return null;
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("raid-form");
    if (!form) return;
    const result = document.getElementById("raid-result");
    const usableEl = document.getElementById("raid-usable");
    const overheadEl = document.getElementById("raid-overhead");
    const faultEl = document.getElementById("raid-fault");
    const noteEl = document.getElementById("raid-note");
    const shopLink = document.getElementById("raid-shop-link");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const level = document.getElementById("raid-level").value;
      const count = Math.max(2, Math.min(24, Number(document.getElementById("raid-count").value) || 2));
      const capacity = Number(document.getElementById("raid-capacity").value);

      const r = calc(level, count, capacity);
      if (!r.minOk) {
        usableEl.textContent = "—";
        overheadEl.textContent = "—";
        faultEl.textContent = "—";
        noteEl.textContent = r.minMsg || "이 구성으로는 해당 RAID 레벨을 만들 수 없습니다.";
        shopLink.href = shopLinkFor(capacity);
        result.hidden = false;
        return;
      }

      const total = count * capacity;
      const overhead = total - r.usable;
      usableEl.textContent = `약 ${r.usable}TB (전체 ${total}TB 중)`;
      overheadEl.textContent = overhead > 0 ? `${overhead}TB` : "없음 (보호 기능 없음)";
      faultEl.textContent = r.fault;

      if (level === "0") {
        noteEl.textContent = "RAID 0은 속도는 빠르지만 보호가 전혀 없습니다. 중요한 데이터 보관용 NAS에는 권장하지 않습니다.";
      } else if (capacity >= 8 && level === "5") {
        noteEl.textContent = "8TB 이상 대용량 디스크로 RAID 5를 구성하면 고장 후 재구성(리빌드) 중 두 번째 고장 위험이 커집니다. RAID 6도 함께 검토해 보세요.";
      } else {
        noteEl.textContent = "동일 모델·동일 용량 디스크로 구성하는 것이 원칙이며, 용량이 다르면 가장 작은 디스크 기준으로 계산됩니다.";
      }
      shopLink.href = shopLinkFor(capacity);
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
