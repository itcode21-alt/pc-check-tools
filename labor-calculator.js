/* 퇴직금·주휴수당 계산기 — 계산 로직과 화면 연결.
   법정 산식만 사용하며 요율·세율 상수는 없다.
   - 퇴직금: 근로자퇴직급여 보장법 제8조(계속근로연수 1년에 대하여 30일분 이상의 평균임금),
     평균임금은 근로기준법 제2조제1항제6호(산정사유 발생일 이전 3개월간 지급된 임금 총액 ÷ 그 기간의 총일수).
     상여금·연차수당 3/12 가산은 고용노동부 행정해석에서 일반적으로 쓰는 방식이다.
   - 주휴수당: 근로기준법 제55조·같은 법 시행령 제30조(1주 소정근로시간 15시간 이상, 소정근로일 개근).
     1주 소정근로시간이 40시간 미만이면 (주 소정근로시간 ÷ 40 × 8시간) × 시급 으로 비례 계산하는
     고용노동부 지침을 따른다. 참고용이며 실제 지급액과 다를 수 있다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./rates-2026.js"));
  else root.ItsvcLabor = factory(root.ITSVC_RATES_2026);
})(typeof self !== "undefined" ? self : this, function (RATES) {
  const DAY = 86400000;
  const utc = (y, m, d) => Date.UTC(y, m, d);
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return utc(y, m - 1, d); };
  const addMonths = (ms, n) => {
    const d = new Date(ms); let y = d.getUTCFullYear(), m = d.getUTCMonth() + n, day = d.getUTCDate();
    y += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
    const last = new Date(utc(y, m + 1, 0)).getUTCDate();
    return utc(y, m, Math.min(day, last));
  };
  const days = (a, b) => Math.round((b - a) / DAY);

  // 퇴직금. start/lastDay: "YYYY-MM-DD" (입사일, 마지막 근무일)
  function severance({ start, lastDay, wages3m, annualBonus = 0, annualLeavePay = 0, weeklyHours = 40 }) {
    const s = parse(start), last = parse(lastDay);
    const leave = last + DAY; // 퇴직일 = 마지막 근무일 다음 날
    const tenureDays = days(s, leave); // 입사일 포함 ~ 마지막 근무일 포함
    const from = addMonths(leave, -3);
    const periodDays = days(from, leave); // 퇴직일 이전 3개월의 총일수
    const eligible = tenureDays >= 365 && weeklyHours >= 15;
    const extra = (annualBonus * 3) / 12 + (annualLeavePay * 3) / 12;
    const avgDaily = (wages3m + extra) / periodDays;
    const pay = Math.floor((avgDaily * 30 * tenureDays) / 365);
    return { tenureDays, periodDays, avgDaily: Math.floor(avgDaily * 100) / 100, eligible, pay,
      years: Math.floor(tenureDays / 365), restDays: tenureDays % 365 };
  }

  // 퇴직소득세(소득세만, 지방소득세 제외). 국세청 계산방법(2020년 이후 퇴직분) 기준이며 기준표는 rates-2026.js.
  // 근속연수: 총 근속월수(1월 미만 일수는 1월)를 12로 나눠 1년 미만 끝수는 1년으로 올린다(국세청 서식 작성요령).
  function retirementTax({ pay, start, lastDay }) {
    const T = RATES && RATES.retirementTax;
    if (!T) return null;
    const s = parse(start), leave = parse(lastDay) + DAY;
    const sd = new Date(s), ed = new Date(leave);
    let months = (ed.getUTCFullYear() - sd.getUTCFullYear()) * 12 + (ed.getUTCMonth() - sd.getUTCMonth());
    if (ed.getUTCDate() < sd.getUTCDate()) months -= 1;
    if (leave > addMonths(s, months)) months += 1;
    const years = Math.max(1, Math.ceil(months / 12));
    const tier = (list, v) => list.find((t) => v <= t.upTo);
    const td = tier(T.tenureDeduction, years);
    const tenureDeduction = td.base + (years - td.from) * td.perYear;
    const converted = Math.max(0, ((pay - tenureDeduction) * 12) / years);
    const cd = tier(T.convertedDeduction, converted);
    const convertedDeduction = Math.min(converted, cd.base + (converted - cd.from) * cd.rate);
    const taxBase = Math.max(0, converted - convertedDeduction);
    const br = T.brackets.find((b) => taxBase <= b[0]);
    const convertedTax = Math.max(0, taxBase * br[1] - br[2]);
    const tax = Math.floor((convertedTax / 12) * years);
    return { years, tenureDeduction, converted, convertedDeduction, taxBase, rate: br[1], convertedTax, tax };
  }

  // 주휴수당. hourly: 시급, weeklyHours: 1주 소정근로시간, fullAttendance: 소정근로일 개근 여부
  function weeklyHoliday({ hourly, weeklyHours, fullAttendance = true, weeksPerMonth = 365 / 7 / 12 }) {
    const eligible = weeklyHours >= 15 && fullAttendance;
    const holidayHours = weeklyHours >= 40 ? 8 : (weeklyHours / 40) * 8;
    const weekly = eligible ? Math.floor(holidayHours * hourly) : 0;
    const workPay = Math.floor(weeklyHours * hourly);
    const monthlyHours = (weeklyHours + (eligible ? holidayHours : 0)) * weeksPerMonth;
    return { eligible, holidayHours, weekly, workPay, weeklyTotal: workPay + weekly,
      monthly: Math.floor((workPay + weekly) * weeksPerMonth), monthlyHours: Math.round(monthlyHours * 100) / 100 };
  }

  /* ───── 화면 연결 ───── */
  function init() {
    const $ = (id) => document.getElementById(id);
    const won = (n) => Math.round(n).toLocaleString("ko-KR") + "원";
    const num = (el) => Number(String(el.value).replace(/[^\d]/g, "")) || 0;
    const comma = (el) => { const v = String(el.value).replace(/[^\d]/g, ""); el.value = v ? Number(v).toLocaleString("ko-KR") : ""; };
    document.querySelectorAll("input[data-comma]").forEach((el) => el.addEventListener("input", () => comma(el)));
    const err = (m) => { const e = $("lab-error"); e.textContent = m; e.hidden = !m; return !m; };

    const sev = $("sev-form");
    if (sev) {
      sev.addEventListener("submit", (e) => {
        e.preventDefault();
        const start = $("sev-start").value, last = $("sev-last").value;
        if (!start || !last) return err("입사일과 마지막 근무일을 입력해 주세요.");
        if (parse(last) < parse(start)) return err("마지막 근무일이 입사일보다 빠릅니다.");
        if (!num($("sev-wages"))) return err("퇴직 전 3개월 임금 총액을 입력해 주세요.");
        err("");
        const r = severance({ start, lastDay: last, wages3m: num($("sev-wages")), annualBonus: num($("sev-bonus")),
          annualLeavePay: num($("sev-leave")), weeklyHours: Number($("sev-hours").value) || 40 });
        $("sev-pay").textContent = r.eligible ? won(r.pay) : "지급 대상이 아닐 수 있음";
        $("sev-tenure").textContent = `${r.years}년 ${r.restDays}일`;
        $("sev-avg").textContent = won(r.avgDaily);
        $("sev-period").textContent = `3개월 · ${r.periodDays}일`;
        $("sev-detail").innerHTML =
          `<li>계속근로기간: ${r.tenureDays.toLocaleString("ko-KR")}일</li>` +
          `<li>퇴직금 = 1일 평균임금 × 30일 × ${r.tenureDays}일 ÷ 365일</li>`;
        const tx = r.eligible ? retirementTax({ pay: r.pay, start, lastDay: last }) : null;
        $("sev-tax-box").hidden = !tx;
        $("sev-tax").textContent = tx ? won(tx.tax) : "-";
        $("sev-tax-years").textContent = tx ? tx.years + "년" : "-";
        if (tx) {
          $("sev-tax-detail").innerHTML =
            `<li>세법상 근속연수: ${tx.years}년 (1년 미만 끝수는 1년으로 올림)</li>` +
            `<li>근속연수공제: ${won(tx.tenureDeduction)}</li>` +
            `<li>환산급여 = (${won(r.pay)} − ${won(tx.tenureDeduction)}) × 12 ÷ ${tx.years}년 = ${won(tx.converted)}</li>` +
            `<li>환산급여공제: ${won(tx.convertedDeduction)}</li>` +
            `<li>과세표준: ${won(tx.taxBase)} (기본세율 ${Math.round(tx.rate * 100)}% 구간)</li>` +
            `<li>환산산출세액: ${won(tx.convertedTax)} → 산출세액 = 환산산출세액 ÷ 12 × ${tx.years}년 = ${won(tx.tax)}</li>`;
        }
        $("sev-note").textContent = r.eligible ? "" :
          "계속근로기간이 1년 미만이거나 주 15시간 미만이면 법정 퇴직금 지급 대상이 아닙니다. 위 금액은 참고용 계산값입니다.";
        $("sev-result").hidden = false;
        $("sev-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      sev.addEventListener("reset", () => { $("sev-result").hidden = true; err(""); });
    }

    const wk = $("wk-form");
    if (wk) {
      wk.addEventListener("submit", (e) => {
        e.preventDefault();
        const hourly = num($("wk-hourly")), hours = Number($("wk-hours").value);
        if (!hourly) return err("시급을 입력해 주세요.");
        if (!(hours > 0 && hours <= 68)) return err("1주 소정근로시간을 확인해 주세요.");
        err("");
        const r = weeklyHoliday({ hourly, weeklyHours: hours, fullAttendance: $("wk-attend").value === "1" });
        $("wk-weekly").textContent = r.eligible ? won(r.weekly) : "0원 (지급 요건 미충족)";
        $("wk-hours-out").textContent = r.holidayHours.toFixed(2).replace(/\.?0+$/, "") + "시간" + (r.eligible ? "" : " (미적용)");
        $("wk-total").textContent = won(r.weeklyTotal);
        $("wk-month").textContent = won(r.monthly);
        $("wk-month-hours").textContent = r.monthlyHours.toLocaleString("ko-KR") + "시간";
        $("wk-detail").innerHTML =
          `<li>1주 근로 임금: ${won(r.workPay)}${r.eligible ? "" : " · 요건 미충족으로 주휴시간 미적용"}</li>` +
          `<li>월 환산은 1개월 ≈ 365÷7÷12주 기준입니다.</li>`;
        $("wk-result").hidden = false;
        $("wk-result").scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
      wk.addEventListener("reset", () => { $("wk-result").hidden = true; err(""); });
    }
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }
  return { severance, weeklyHoliday, retirementTax };
});
