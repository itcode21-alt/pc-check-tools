/* 지역가입자(프리랜서·자영업자 등) 국민연금·건강보험·장기요양 보험료 계산기.
   요율·재산등급표·상하한은 rates-2026.js 의 regional 항목에서만 읽는다(이 파일에 숫자 상수를 두지 않는다).
   근거: 국민건강보험법 제69조제5항(월 보험료 = 소득월액×보험료율 + 재산점수×점수당 금액),
   제71조제2항(소득월액 = 연 소득÷12), 시행규칙 제44조·별표 8, 시행령 별표 4, 노인장기요양보험법 제9조.
   세대 단위 합산, 주택 대출금 제외, 보험료 경감, 소득 조정 신청은 반영하지 않는 참고용 근사 계산이다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rates-2026.js"));
  else root.ItsvcRegional = factory(root.ITSVC_RATES_2026);
})(typeof self !== "undefined" ? self : this, function (R) {
  const G = R.regional;
  const floorTo = (n, unit) => Math.floor(n / unit) * unit;

  // 재산금액(원) → { grade, score }. 기본공제 후 0원 이하이면 0점.
  function propertyScore(baseWon) {
    if (!(baseWon > 0)) return { grade: 0, score: 0 };
    const man = baseWon / 10000; // 별표 4는 만원 단위, "~ 이하"는 경계값 포함
    for (let i = 0; i < G.propertyGrades.length; i++) {
      const [upper, score] = G.propertyGrades[i];
      if (man <= upper) return { grade: i + 1, score };
    }
    return { grade: 60, score: G.propertyGrades[59][1] };
  }

  function calculate(i) {
    const n = (k) => Math.max(Number(i[k]) || 0, 0);
    // 1) 소득월액
    const financial = n("interestDividend") > G.financialIncomeExempt ? n("interestDividend") : 0;
    const incomeYear = n("business") + n("otherIncome") + financial + (n("wage") + n("pension")) * G.wageAndPensionRatio;
    let incomeMonth = incomeYear / 12;
    const floorApplied = incomeMonth <= G.minIncomeMonthly;
    if (floorApplied) incomeMonth = G.minMonthly / G.healthRate;
    const incomePremium = incomeMonth * G.healthRate;

    // 2) 재산 보험료: 소유 재산세 과세표준 + (주택 미소유 시) 임차 평가액 − 기본공제
    const rentEval = i.ownsHouse ? 0 : (n("deposit") + n("monthlyRent") * G.rentMonthlyMultiplier) * G.rentRatio;
    const propertyAmount = n("propertyTaxBase") + rentEval;
    const base = propertyAmount - G.propertyDeduction;
    const { grade, score } = propertyScore(base);
    const propertyPremium = score * G.pointValue;

    // 3) 건강보험·장기요양 (월 보험료 하한·상한 적용)
    const raw = incomePremium + propertyPremium;
    let health = floorTo(raw, 10);
    let limit = "";
    if (health < G.minMonthly) { health = G.minMonthly; limit = "하한"; }
    if (health > G.maxMonthly) { health = G.maxMonthly; limit = "상한"; }
    const care = floorTo(health * R.longTermCare.rateOfHealth, 10);

    // 4) 국민연금: 직접 입력한 기준소득월액이 없으면 (사업소득+근로소득)÷12
    const np = R.nationalPension;
    const npIncome = n("pensionBase") > 0 ? n("pensionBase") : (n("business") + n("wage")) / 12;
    const npBase = npIncome > 0 ? Math.min(Math.max(floorTo(npIncome, np.baseUnit), np.baseMin), np.baseMax) : 0;
    const pension = floorTo(npBase * G.pensionRate, 10);

    return {
      incomeMonth: Math.round(incomeMonth), floorApplied, incomePremium: Math.floor(incomePremium),
      rentEval: Math.round(rentEval), propertyAmount: Math.round(propertyAmount), grade, score,
      propertyPremium: Math.floor(propertyPremium), health, limit, care, npBase, pension,
      total: health + care + pension,
    };
  }

  /* ───── 화면 연결 ───── */
  function init() {
    const $ = (id) => document.getElementById(id);
    const form = $("reg-form");
    if (!form) return;
    const won = (v) => Math.round(v).toLocaleString("ko-KR") + "원";
    const num = (el) => Number(String(el.value).replace(/[^\d]/g, "")) || 0;
    document.querySelectorAll("input[data-comma]").forEach((el) => el.addEventListener("input", () => {
      const v = String(el.value).replace(/[^\d]/g, ""); el.value = v ? Number(v).toLocaleString("ko-KR") : "";
    }));
    const sync = () => { $("reg-rent-box").hidden = $("reg-owns").value === "1"; };
    $("reg-owns").addEventListener("change", sync); sync();
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const r = calculate({
        business: num($("reg-business")), wage: num($("reg-wage")), pension: num($("reg-pension")),
        interestDividend: num($("reg-fin")), otherIncome: num($("reg-other")),
        ownsHouse: $("reg-owns").value === "1", propertyTaxBase: num($("reg-prop")),
        deposit: num($("reg-deposit")), monthlyRent: num($("reg-rent")), pensionBase: num($("reg-npbase")),
      });
      $("reg-total").textContent = won(r.total);
      $("reg-health").textContent = won(r.health);
      $("reg-care").textContent = won(r.care);
      $("reg-np").textContent = won(r.pension);
      const lines = [
        "소득월액 " + won(r.incomeMonth) + (r.floorApplied ? " (소득월액이 28만원 이하라 하한 기준 적용)" : "") + " → 소득 보험료 " + won(r.incomePremium),
        "재산 평가액 " + won(r.propertyAmount) + (r.rentEval ? " (임차 평가액 " + won(r.rentEval) + " 포함)" : "") +
          " → 기본공제 1억원 후 " + (r.score ? r.grade + "등급 " + r.score + "점" : "0점") + " → 재산 보험료 " + won(r.propertyPremium),
        r.limit ? "건강보험료에 월별 보험료 " + r.limit + "액이 적용됐습니다." : "",
        "국민연금 기준소득월액 " + (r.npBase ? won(r.npBase) : "없음(소득이 없으면 납부예외 대상일 수 있음)"),
      ].filter(Boolean);
      $("reg-detail").textContent = "";
      lines.forEach((t) => { const li = document.createElement("li"); li.textContent = t; $("reg-detail").appendChild(li); });
      $("reg-result").hidden = false;
      $("reg-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", () => { $("reg-result").hidden = true; setTimeout(sync, 0); });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { calculate, propertyScore };
});
