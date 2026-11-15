/* 대출 원리금 상환 계산기 — 계산 로직과 화면 연결.
   금융 산식만 사용하며 요율·세율 상수는 없다. 월 이자는 연이율 ÷ 12 를 기준으로
   원 미만을 버리고(금융기관별 처리 방식이 달라 실제와 몇 원 차이가 날 수 있음),
   마지막 회차에서 남은 원금을 모두 갚아 합계를 맞춘다.
   방식: equal-payment(원리금균등), equal-principal(원금균등), bullet(만기일시) */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ItsvcLoan = factory();
})(typeof self !== "undefined" ? self : this, function () {
  // principal: 원, annualRate: % (예: 4.5), months: 총 개월, graceMonths: 거치(이자만 내는) 개월
  function schedule({ principal, annualRate, months, graceMonths = 0, method }) {
    const r = annualRate / 100 / 12;
    const rows = [];
    let balance = principal;
    const grace = method === "bullet" ? months : Math.min(graceMonths, months - 1);
    const n = months - grace; // 원금을 갚는 회차 수
    const annuity = method === "equal-payment"
      ? (r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n)))
      : 0;
    const fixedPrincipal = Math.floor(principal / (n || 1));
    for (let i = 1; i <= months; i++) {
      const interest = Math.floor(balance * r);
      let pr = 0;
      if (method === "bullet") pr = i === months ? balance : 0;
      else if (i <= grace) pr = 0;
      else if (i === months) pr = balance; // 마지막 회차에 잔액 정리
      else if (method === "equal-payment") pr = Math.floor(annuity) - interest;
      else pr = fixedPrincipal;
      if (pr > balance) pr = balance;
      if (pr < 0) pr = 0;
      balance -= pr;
      rows.push({ no: i, principal: pr, interest, payment: pr + interest, balance });
    }
    const totalInterest = rows.reduce((s, x) => s + x.interest, 0);
    return { rows, totalInterest, totalPayment: principal + totalInterest,
      first: rows[0].payment, last: rows[rows.length - 1].payment };
  }

  function init() {
    const $ = (id) => document.getElementById(id);
    const form = $("loan-form");
    if (!form) return;
    const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
    const num = (el) => Number(String(el.value).replace(/[^\d]/g, "")) || 0;
    const comma = (el) => { const v = String(el.value).replace(/[^\d]/g, ""); el.value = v ? Number(v).toLocaleString("ko-KR") : ""; };
    $("loan-amount").addEventListener("input", (e) => comma(e.target));
    const err = (m) => { const e = $("lab-error"); e.textContent = m; e.hidden = !m; return !m; };
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const principal = num($("loan-amount"));
      const rate = parseFloat($("loan-rate").value);
      const unit = $("loan-unit").value;
      const term = Number($("loan-term").value);
      const months = unit === "year" ? Math.round(term * 12) : Math.round(term);
      const grace = Math.max(0, Math.round(Number($("loan-grace").value) || 0));
      const method = $("loan-method").value;
      if (!principal) return err("대출 금액을 입력해 주세요.");
      if (!(rate >= 0 && rate <= 100)) return err("연 이자율을 0~100 사이로 입력해 주세요.");
      if (!(months >= 1 && months <= 600)) return err("대출 기간은 1개월에서 600개월(50년) 사이로 입력해 주세요.");
      if (method !== "bullet" && grace >= months) return err("거치 기간은 전체 기간보다 짧아야 합니다.");
      err("");
      const r = schedule({ principal, annualRate: rate, months, graceMonths: grace, method });
      $("loan-main").textContent = method === "equal-payment" && grace === 0
        ? won(r.first) : method === "bullet" ? "월 이자 " + won(r.first) : "첫 달 " + won(r.first);
      $("loan-sub").textContent = method === "equal-principal"
        ? "마지막 달 " + won(r.last) : method === "bullet" ? "만기 상환 " + won(r.last) : "";
      $("loan-interest").textContent = won(r.totalInterest);
      $("loan-total").textContent = won(r.totalPayment);
      $("loan-body").innerHTML = r.rows.map((x) =>
        `<tr><th scope="row">${x.no}</th><td>${won(x.payment)}</td><td>${won(x.principal)}</td><td>${won(x.interest)}</td><td>${won(x.balance)}</td></tr>`).join("");
      $("loan-result").hidden = false;
      $("loan-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    form.addEventListener("reset", () => { $("loan-result").hidden = true; err(""); });
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { schedule };
});
