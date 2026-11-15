/* 연봉 실수령액 계산기 — 계산 로직과 화면 연결.
   요율·세율·간이세액표는 rates-2026.js 에서만 읽는다(이 파일에 숫자 상수를 두지 않는다).
   참고용 근사 계산이며 실제 급여와 차이가 날 수 있다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rates-2026.js"));
  else root.ItsvcSalary = factory(root.ITSVC_RATES_2026);
})(typeof self !== "undefined" ? self : this, function (R) {
  // 부동소수점 오차(예: 2800000*0.009 = 25199.999…)로 한 단위 낮게 잘리지 않도록 아주 작은 보정을 더한다.
  const floorTo = (n, unit) => Math.floor(n / unit + 1e-9) * unit;

  // 간이세액표: 월 과세급여(원), 공제대상가족 수(본인 포함), 8세~20세 자녀 수 → 월 소득세(원)
  function incomeTaxMonthly(taxableMonthly, family, children) {
    const T = R.incomeTax;
    const k = taxableMonthly / 1000; // 천원
    const fam = Math.max(1, Math.floor(family));
    const col = (n) => 2 + Math.min(n, 11) - 1; // 가족 n명 열 인덱스
    const rowTax = (n) => {
      if (k < T.table[0][0]) return 0;
      let base;
      if (k < 10000) {
        const row = T.table.find((r) => k >= r[0] && k < r[1]);
        base = row ? row[col(n)] : 0;
      } else {
        base = T.topRow[Math.min(n, 11) - 1];
        if (k > 10000) {
          const seg = T.overTop.find((s) => k <= s.upTo);
          base += Math.floor(seg.base + (k - seg.from) * 1000 * seg.ratio * seg.rate);
        }
      }
      return base;
    };
    let tax;
    if (fam <= 11) tax = rowTax(fam);
    else tax = rowTax(11) - (rowTax(10) - rowTax(11)) * (fam - 11); // 별표 비고 4
    const c = T.childDeduction;
    const n = Math.max(0, Math.floor(children));
    const ded = n === 0 ? 0 : n === 1 ? c.one : c.two + (n - 2) * c.extraPerChild;
    return Math.max(0, floorTo(tax - ded, 10));
  }

  // monthlyGross: 월 총급여(비과세 포함), nonTaxable: 월 비과세액
  function calculate({ monthlyGross, nonTaxable = 0, family = 1, children = 0 }) {
    const nt = Math.min(Math.max(nonTaxable, 0), monthlyGross);
    const taxable = Math.max(monthlyGross - nt, 0);
    const np = R.nationalPension;
    const base = taxable === 0 ? 0 : Math.min(Math.max(floorTo(taxable, np.baseUnit), np.baseMin), np.baseMax);
    const pension = floorTo(base * np.employeeRate, 10);
    const health = floorTo(taxable * R.healthInsurance.employeeRate, 10);
    const care = floorTo(health * R.longTermCare.rateOfHealth, 10);
    const employment = floorTo(taxable * R.employmentInsurance.employeeRate, 10);
    const incomeTax = incomeTaxMonthly(taxable, family, children);
    const localTax = floorTo(incomeTax * R.localIncomeTaxRate, 10);
    const total = pension + health + care + employment + incomeTax + localTax;
    return {
      monthlyGross, nonTaxable: nt, taxable,
      deductions: { pension, health, care, employment, incomeTax, localTax },
      totalDeduction: total,
      net: monthlyGross - total,
      annualNet: (monthlyGross - total) * 12,
    };
  }

  /* ───── 화면 연결 ───── */
  function init() {
    const $ = (id) => document.getElementById(id);
    const form = $("sal-form");
    if (!form) return;
    const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
    const num = (el) => Number(String(el.value).replace(/[^\d]/g, "")) || 0;
    const comma = (el) => {
      const v = String(el.value).replace(/[^\d]/g, "");
      el.value = v ? Number(v).toLocaleString("ko-KR") : "";
    };
    ["sal-amount", "sal-nontax"].forEach((id) => $(id).addEventListener("input", (e) => comma(e.target)));
    $("sal-mode").addEventListener("change", () => {
      $("sal-amount-label").textContent = $("sal-mode").value === "year" ? "연봉 (세전, 원)" : "월급 (세전, 원)";
    });
    const rows = [
      ["pension", "국민연금"], ["health", "건강보험"], ["care", "장기요양보험"],
      ["employment", "고용보험"], ["incomeTax", "소득세"], ["localTax", "지방소득세"],
    ];
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const amount = num($("sal-amount"));
      const err = $("sal-error");
      err.hidden = true;
      if (amount <= 0) { err.textContent = "금액을 입력해 주세요."; err.hidden = false; return; }
      const monthly = $("sal-mode").value === "year" ? Math.floor(amount / 12) : amount;
      const family = Math.min(Math.max(num($("sal-family")) || 1, 1), 20);
      let kids = num($("sal-kids"));
      if (kids > family - 1) kids = Math.max(family - 1, 0);
      const r = calculate({ monthlyGross: monthly, nonTaxable: num($("sal-nontax")), family, children: kids });
      $("sal-net").textContent = won(r.net);
      $("sal-annual-net").textContent = won(r.annualNet);
      $("sal-gross").textContent = won(r.monthlyGross);
      $("sal-total").textContent = won(r.totalDeduction);
      $("sal-body").innerHTML = rows
        .map(([k, n]) => `<tr><th scope="row">${n}</th><td>${won(r.deductions[k])}</td><td>${won(r.deductions[k] * 12)}</td></tr>`)
        .join("");
      $("sal-kids-note").textContent = kids !== num($("sal-kids"))
        ? "자녀 수는 부양가족 수(본인 포함)를 넘을 수 없어 " + kids + "명으로 계산했습니다."
        : "";
      $("sal-result").hidden = false;
      $("sal-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", () => { $("sal-result").hidden = true; $("sal-error").hidden = true; });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { calculate, incomeTaxMonthly };
});
