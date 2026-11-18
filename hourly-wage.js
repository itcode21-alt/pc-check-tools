/* 시급·월급·연봉 환산 계산기 — 월 환산 시간과 최저임금 비교.
   월 환산 시간 = (1주 소정근로시간 + 주휴시간) × 365 ÷ 7 ÷ 12 (반올림). 주 40시간이면 209시간.
   주휴시간: 주 15시간 이상이면 주 40시간 이상 8시간, 미만은 (주 소정근로시간 ÷ 40 × 8시간). 최저임금은 rates-2026.js. 참고용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ItsvcHourly = factory();
})(typeof self !== "undefined" ? self : this, function () {
  function monthlyHours(weekly, withHoliday) {
    var holiday = withHoliday && weekly >= 15 ? (weekly >= 40 ? 8 : (weekly / 40) * 8) : 0;
    return Math.round((weekly + holiday) * (365 / 7 / 12));
  }
  function init() {
    var R = typeof window !== "undefined" ? window.ITSVC_RATES_2026 : null;
    var form = document.getElementById("hw-form");
    if (!form || !R) return;
    var $ = function (id) { return document.getElementById(id); };
    var won = function (n) { return Math.round(n).toLocaleString("ko-KR") + "원"; };
    var num = function (el) { return Number(String(el.value).replace(/[^\d]/g, "")) || 0; };
    $("hw-amount").addEventListener("input", function (e) {
      var v = String(e.target.value).replace(/[^\d]/g, "");
      e.target.value = v ? Number(v).toLocaleString("ko-KR") : "";
    });
    var labels = { hourly: "시급 (원)", month: "월급 (세전, 원)", year: "연봉 (세전, 원)" };
    $("hw-mode").addEventListener("change", function () { $("hw-amount-label").textContent = labels[$("hw-mode").value]; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("hw-error"); err.hidden = true;
      var amount = num($("hw-amount"));
      var weekly = Number($("hw-weekly").value);
      if (amount <= 0) { err.textContent = "금액을 입력해 주세요."; err.hidden = false; return; }
      if (!(weekly > 0 && weekly <= 68)) { err.textContent = "1주 소정근로시간은 0 초과 68 이하로 입력해 주세요."; err.hidden = false; return; }
      var withHoliday = $("hw-holiday").value === "1";
      var hours = monthlyHours(weekly, withHoliday);
      var mode = $("hw-mode").value, hourly, monthly;
      if (mode === "hourly") { hourly = amount; monthly = Math.floor(amount * hours); }
      else { monthly = mode === "year" ? Math.floor(amount / 12) : amount; hourly = Math.floor(monthly / hours); }
      var mw = R.minimumWage, minMonthly = mw.hourly * hours;
      var ok = hourly >= mw.hourly;
      $("hw-hourly").textContent = won(hourly);
      $("hw-monthly").textContent = won(monthly);
      $("hw-yearly").textContent = won(monthly * 12);
      $("hw-hours").textContent = hours + "시간";
      $("hw-min").textContent = ok
        ? "2026년 최저임금(시간급 " + mw.hourly.toLocaleString("ko-KR") + "원) 이상입니다. 이 근로시간 기준 최저임금 월 환산액은 " + won(minMonthly) + "입니다."
        : "2026년 최저임금(시간급 " + mw.hourly.toLocaleString("ko-KR") + "원)보다 낮게 계산됩니다. 이 근로시간 기준 최저임금 월 환산액은 " + won(minMonthly) + "입니다. 월급에 포함된 수당·시급 구성을 다시 확인해 보세요.";
      $("hw-min").className = ok ? "muted" : "sal-error";
      $("hw-result").hidden = false;
      $("hw-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", function () { $("hw-result").hidden = true; $("hw-error").hidden = true; });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  return { monthlyHours: monthlyHours };
});
