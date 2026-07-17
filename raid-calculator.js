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

  // SHR/SHR-2는 시놀로지의 실제 동작을 근사한 값입니다. 정확한 수치는 시놀로지 공식
  // RAID 계산기(synology.com)에서 다시 한번 확인하는 것을 권장합니다.
  const shrUsable = (disksAsc, redundancy) => {
    let remaining = disksAsc.slice();
    let usable = 0;
    let wasted = 0;
    while (true) {
      const active = remaining.filter((d) => d > 0);
      const k = active.length;
      if (k === 0) break;
      const segment = Math.min(...active);
      const minNeeded = redundancy === 2 ? 4 : 2;
      if (k < minNeeded) {
        wasted += segment * k;
      } else if (redundancy === 2) {
        usable += segment * (k - 2);
      } else if (k >= 3) {
        usable += segment * (k - 1);
      } else {
        usable += segment; // k === 2, 단일 보호는 미러로 처리
      }
      remaining = remaining.map((d) => (d > 0 ? d - segment : d));
    }
    return { usable, wasted };
  };

  const calc = (level, disks) => {
    const count = disks.length;
    const min = Math.min(...disks);
    const total = disks.reduce((a, b) => a + b, 0);
    const mixed = new Set(disks).size > 1;

    switch (level) {
      case "0":
        return { usable: mixed ? min * count : total, fault: "0개 — 어떤 디스크든 1개 고장 시 전체 데이터 손실", minOk: count >= 2 };
      case "1":
        return { usable: min, fault: `${count - 1}개 (복사본이 1개라도 남아 있으면 유지)`, minOk: count >= 2 };
      case "5":
        return { usable: min * (count - 1), fault: "1개", minOk: count >= 3, minMsg: "RAID 5는 디스크가 최소 3개 필요합니다." };
      case "6":
        return { usable: min * (count - 2), fault: "2개", minOk: count >= 4, minMsg: "RAID 6는 디스크가 최소 4개 필요합니다." };
      case "10":
        return {
          usable: (count / 2) * min,
          fault: "최소 1개 보장 (미러 쌍마다 1개씩, 최대 절반)",
          minOk: count >= 4 && count % 2 === 0,
          minMsg: "RAID 10은 짝수 개(최소 4개)의 디스크가 필요합니다.",
        };
      case "shr": {
        const { usable, wasted } = shrUsable([...disks].sort((a, b) => a - b), 1);
        return { usable, wasted, fault: "1개", minOk: count >= 2, isShr: true };
      }
      case "shr2": {
        const { usable, wasted } = shrUsable([...disks].sort((a, b) => a - b), 2);
        return { usable, wasted, fault: "2개", minOk: count >= 4, minMsg: "SHR-2는 디스크가 최소 4개 필요합니다.", isShr: true };
      }
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

    const parseMixed = (text) =>
      text
        .split(",")
        .map((v) => Number(v.trim()))
        .filter((v) => Number.isFinite(v) && v > 0);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const level = document.getElementById("raid-level").value;
      const capacity = Number(document.getElementById("raid-capacity").value);
      const mixedInput = document.getElementById("raid-mixed").value.trim();
      const mixedDisks = mixedInput ? parseMixed(mixedInput) : [];
      const usingMixed = mixedDisks.length >= 2;
      const count = usingMixed ? mixedDisks.length : Math.max(2, Math.min(24, Number(document.getElementById("raid-count").value) || 2));
      const disks = usingMixed ? mixedDisks : Array(count).fill(capacity);
      const maxCapacity = Math.max(...disks);

      const r = calc(level, disks);
      if (!r.minOk) {
        usableEl.textContent = "—";
        overheadEl.textContent = "—";
        faultEl.textContent = "—";
        noteEl.textContent = r.minMsg || "이 구성으로는 해당 RAID 레벨을 만들 수 없습니다.";
        shopLink.href = shopLinkFor(maxCapacity);
        result.hidden = false;
        return;
      }

      const total = disks.reduce((a, b) => a + b, 0);
      const overhead = total - r.usable;
      usableEl.textContent = `약 ${r.usable.toFixed(1).replace(/\.0$/, "")}TB (전체 ${total}TB 중)`;
      overheadEl.textContent = overhead > 0 ? `${overhead.toFixed(1).replace(/\.0$/, "")}TB` : "없음 (보호 기능 없음)";
      faultEl.textContent = r.fault;

      const mixedNonShr = usingMixed && !r.isShr && new Set(disks).size > 1;
      if (level === "0") {
        noteEl.textContent = "RAID 0은 속도는 빠르지만 보호가 전혀 없습니다. 중요한 데이터 보관용 NAS에는 권장하지 않습니다.";
      } else if (r.isShr) {
        noteEl.textContent = usingMixed
          ? "SHR은 용량이 다른 디스크를 섞어도 낭비를 최소화합니다. 위 수치는 시놀로지의 실제 동작을 근사한 값이며, 정확한 수치는 시놀로지 공식 RAID 계산기에서 한번 더 확인하세요."
          : "디스크 용량이 모두 같다면 SHR의 실사용 용량은 RAID 5/6와 동일합니다. SHR의 진짜 장점은 용량이 다른 디스크를 섞을 때 나타납니다 — 위 '혼합 구성 직접 입력'에 예: 4,4,8,12 처럼 입력해 비교해 보세요.";
      } else if (mixedNonShr) {
        const wasted = total - Math.min(...disks) * count;
        noteEl.textContent = `일반 RAID는 모든 디스크를 가장 작은 디스크 용량에 맞춰 구성하므로, 큰 디스크의 남는 용량(약 ${wasted.toFixed(1).replace(/\.0$/, "")}TB)은 사용되지 않습니다. 용량이 다른 디스크를 섞을 계획이라면 SHR·SHR-2를 권장합니다.`;
      } else if (maxCapacity >= 8 && level === "5") {
        noteEl.textContent = "8TB 이상 대용량 디스크로 RAID 5를 구성하면 고장 후 재구성(리빌드) 중 두 번째 고장 위험이 커집니다. RAID 6도 함께 검토해 보세요.";
      } else {
        noteEl.textContent = "동일 모델·동일 용량 디스크로 구성하는 것이 일반적인 RAID의 원칙입니다.";
      }
      shopLink.href = shopLinkFor(maxCapacity);
      result.hidden = false;
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });
})();
