/* 4대보험 계산기(직장가입자) — 근로자·사업주 부담액.
   요율·상하한은 rates-2026.js, 계산식은 salary-calculator.js(ItsvcSalary.calculate)를 그대로 쓴다.
   근로자와 사업주가 같은 금액을 내는 항목(국민연금·건강보험·장기요양·고용보험 실업급여분)만 계산하고,
   사업주만 내는 고용안정·직업능력개발사업(사업 규모별)과 산재보험(업종별)은 계산하지 않는다. 참고용. */
(function () {
  function init() {
    var R = window.ITSVC_RATES_2026, S = window.ItsvcSalary;
    var form = document.getElementById("si-form");
    if (!form || !R || !S) return;
    var $ = function (id) { return document.getElementById(id); };
    var won = function (n) { return Math.round(n).toLocaleString("ko-KR") + "원"; };
    var num = function (el) { return Number(String(el.value).replace(/[^\d]/g, "")) || 0; };
    var pct = function (x) { return String(Math.round(x * 100000) / 1000) + "%"; };
    ["si-amount", "si-nontax"].forEach(function (id) {
      $(id).addEventListener("input", function (e) {
        var v = String(e.target.value).replace(/[^\d]/g, "");
        e.target.value = v ? Number(v).toLocaleString("ko-KR") : "";
      });
    });
    $("si-mode").addEventListener("change", function () {
      $("si-amount-label").textContent = $("si-mode").value === "year" ? "연봉 (세전, 원)" : "월급 (세전, 원)";
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("si-error"); err.hidden = true;
      var amount = num($("si-amount"));
      if (amount <= 0) { err.textContent = "금액을 입력해 주세요."; err.hidden = false; return; }
      var monthly = $("si-mode").value === "year" ? Math.floor(amount / 12) : amount;
      var d = S.calculate({ monthlyGross: monthly, nonTaxable: num($("si-nontax")), family: 1, children: 0 }).deductions;
      var rows = [
        ["국민연금", d.pension, pct(R.nationalPension.employeeRate) + " (기준소득월액 " + (R.nationalPension.baseMin / 10000) + "만~" + (R.nationalPension.baseMax / 10000) + "만원 범위)"],
        ["건강보험", d.health, pct(R.healthInsurance.employeeRate)],
        ["장기요양보험", d.care, "건강보험료 × " + pct(R.longTermCare.rateOfHealth)],
        ["고용보험(실업급여분)", d.employment, pct(R.employmentInsurance.employeeRate)]
      ];
      var sum = rows.reduce(function (t, r) { return t + r[1]; }, 0);
      $("si-body").innerHTML = rows.map(function (r) {
        return "<tr><th scope=\"row\">" + r[0] + "</th><td>" + won(r[1]) + "</td><td>" + won(r[1]) + "</td><td>" + won(r[1] * 2) + "</td><td class=\"sal-why\">" + r[2] + "</td></tr>";
      }).join("") + "<tr><th scope=\"row\">합계</th><td><strong>" + won(sum) + "</strong></td><td><strong>" + won(sum) + "</strong></td><td><strong>" + won(sum * 2) + "</strong></td><td class=\"sal-why\">-</td></tr>";
      $("si-worker").textContent = won(sum);
      $("si-employer").textContent = won(sum);
      $("si-worker-rate").textContent = monthly > 0 ? "월급 대비 약 " + (Math.round(sum / monthly * 1000) / 10).toFixed(1) + "%" : "";
      $("si-year").textContent = won(sum * 12);
      $("si-result").hidden = false;
      $("si-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", function () { $("si-result").hidden = true; $("si-error").hidden = true; });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
