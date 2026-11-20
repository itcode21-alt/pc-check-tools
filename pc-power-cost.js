/* PC 전기요금·소비전력 계산기 — 월 사용 전력량(kWh)과 전력량요금 추정.
   단가는 한국전력 주택용 전력(저압) 요금표의 전력량요금(원/kWh)이다. 2026-11-20에 한전 요금표 페이지에서 확인한
   적용 기준은 2023-11-09 개정분이며, 기후환경요금·연료비조정요금·부가가치세·전력산업기반기금은 포함하지 않는다.
   누진 구간 단가를 직접 고르거나 고지서의 단가를 입력하게 한 한계 비용 추정이다. 참고용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ItsvcPcPower = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var TIERS = { "1": 120.0, "2": 214.6, "3": 307.3 };
  // 하루를 부하·유휴·꺼 둔 시간(나머지)으로 나눈다. 꺼 둔 시간에도 standbyW(콘센트 측정값)만큼 쓴다고 본다.
  function usage(o) {
    var standbyW = o.standbyW || 0;
    var standbyH = Math.max(0, 24 - o.loadH - o.idleH);
    var load = (o.loadW * o.loadH) / 1000, idle = (o.idleW * o.idleH) / 1000, standby = (standbyW * standbyH) / 1000;
    var daily = load + idle + standby;
    return { daily: daily, monthly: daily * o.days, yearly: daily * o.days * 12,
      parts: { load: load * o.days, idle: idle * o.days, standby: standby * o.days },
      // 유휴 시간을 모두 꺼 둔 상태로 바꾸면 줄어드는 월 사용량(꺼 둔 상태에서도 standbyW는 그대로 쓴다)
      idleToOffMonthly: Math.max(0, ((o.idleW - standbyW) * o.idleH) / 1000) * o.days };
  }
  function init() {
    var form = document.getElementById("pw-form");
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var won = function (n) { return Math.round(n).toLocaleString("ko-KR") + "원"; };
    var kwh = function (n) { return (Math.round(n * 10) / 10).toLocaleString("ko-KR") + " kWh"; };
    $("pw-tier").addEventListener("change", function () { $("pw-custom-wrap").hidden = $("pw-tier").value !== "custom"; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("pw-error"); err.hidden = true;
      var o = {
        loadW: Number($("pw-loadw").value) || 0, loadH: Number($("pw-loadh").value) || 0,
        idleW: Number($("pw-idlew").value) || 0, idleH: Number($("pw-idleh").value) || 0,
        standbyW: Number($("pw-standbyw").value) || 0,
        days: Number($("pw-days").value) || 0
      };
      if (o.loadH + o.idleH > 24) { err.textContent = "하루 사용 시간의 합은 24시간을 넘을 수 없습니다."; err.hidden = false; return; }
      if (o.days < 1 || o.days > 31) { err.textContent = "월 사용 일수는 1~31 사이로 입력해 주세요."; err.hidden = false; return; }
      if (o.loadW + o.idleW <= 0) { err.textContent = "소비전력(W)을 입력해 주세요."; err.hidden = false; return; }
      var t = $("pw-tier").value, price = t === "custom" ? Number($("pw-custom").value) || 0 : TIERS[t];
      if (!(price > 0)) { err.textContent = "전력량요금 단가(원/kWh)를 입력해 주세요."; err.hidden = false; return; }
      var u = usage(o);
      var monthCost = u.monthly * price;
      $("pw-month-cost").textContent = won(monthCost);
      $("pw-day-cost").textContent = "하루 약 " + won(u.daily * price);
      $("pw-year-cost").textContent = won(u.yearly * price);
      $("pw-month-kwh").textContent = kwh(u.monthly);
      $("pw-year-kwh").textContent = kwh(u.yearly);
      $("pw-price").textContent = price.toLocaleString("ko-KR") + "원/kWh";
      var pct = function (x) { return u.monthly > 0 ? Math.round((x / u.monthly) * 100) + "%" : "0%"; };
      $("pw-share").textContent = "부하 " + pct(u.parts.load) + " · 유휴 " + pct(u.parts.idle) + (o.standbyW > 0 ? " · 꺼 둔 대기 " + pct(u.parts.standby) : "");
      var save = $("pw-save"), yearSave = u.idleToOffMonthly * 12 * price;
      save.hidden = !(yearSave >= 1);
      if (!save.hidden) save.textContent = "유휴 시간(하루 " + o.idleH + "시간)을 PC를 끈 상태로 바꾸면 연 " + kwh(u.idleToOffMonthly * 12) + ", 약 " + won(yearSave) + "을 줄일 수 있습니다(전력량요금 기준).";
      $("pw-result").hidden = false;
      $("pw-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", function () { $("pw-result").hidden = true; $("pw-error").hidden = true; $("pw-custom-wrap").hidden = true; });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  return { usage: usage, TIERS: TIERS };
});
