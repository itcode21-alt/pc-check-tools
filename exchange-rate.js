/* 환율 계산기 — 금액을 다른 통화로 환산하고, 환전 수수료율을 반영해 실제로 받는 금액(또는 필요한 금액)을 가늠한다.
   환율은 Frankfurter(api.frankfurter.dev, 키 없는 공개 환율 API)의 최신 기준환율을 방문자 브라우저가 직접 조회한다.
   Frankfurter는 이를 "각 출처가 하루에 한 번 또는 몇 번 발표하는 기준환율"이라고 설명한다(2026-11-26 확인).
   은행·환전소의 매매기준율, 현찰 사실 때·파실 때 환율, 카드 해외결제 환율과는 다르다.
   조회 요청에는 통화 코드만 들어가고 사용자가 입력한 금액·수수료율은 어디로도 보내지 않는다.
   수수료는 환산한 금액에서 차감하는 방식(받는 금액 = 금액 × 환율 × (1 − 수수료율))으로 단순 계산한다. 참고용. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.ItsvcExchange = factory();
})(typeof self !== "undefined" ? self : this, function () {
  var API = "https://api.frankfurter.dev/v1/latest?base=USD";
  // Frankfurter가 제공하는 통화 30종(2026-11-26 /v1/currencies 확인). 표시 순서는 자주 쓰는 통화 먼저.
  var CURRENCIES = [
    ["KRW", "대한민국 원", 0], ["USD", "미국 달러", 2], ["JPY", "일본 엔", 0], ["EUR", "유로", 2], ["CNY", "중국 위안", 2],
    ["GBP", "영국 파운드", 2], ["AUD", "호주 달러", 2], ["CAD", "캐나다 달러", 2], ["CHF", "스위스 프랑", 2], ["HKD", "홍콩 달러", 2],
    ["SGD", "싱가포르 달러", 2], ["THB", "태국 바트", 2], ["PHP", "필리핀 페소", 2], ["IDR", "인도네시아 루피아", 0], ["MYR", "말레이시아 링깃", 2],
    ["INR", "인도 루피", 2], ["NZD", "뉴질랜드 달러", 2], ["TRY", "튀르키예 리라", 2], ["MXN", "멕시코 페소", 2], ["BRL", "브라질 헤알", 2],
    ["ZAR", "남아프리카공화국 랜드", 2], ["SEK", "스웨덴 크로나", 2], ["NOK", "노르웨이 크로네", 2], ["DKK", "덴마크 크로네", 2], ["PLN", "폴란드 즐로티", 2],
    ["CZK", "체코 코루나", 2], ["HUF", "헝가리 포린트", 0], ["ILS", "이스라엘 셰켈", 2], ["ISK", "아이슬란드 크로나", 0], ["RON", "루마니아 레우", 2]
  ].map(function (c) { return { code: c[0], name: c[1], digits: c[2] }; });
  var BY_CODE = {};
  CURRENCIES.forEach(function (c) { BY_CODE[c.code] = c; });

  // rates: USD 1단위 기준 통화별 환율({ KRW: 1345.4, JPY: 159.32, ... }). USD 자신은 1로 본다.
  function rateOf(rates, code) {
    if (code === "USD") return 1;
    var r = rates && rates[code];
    return typeof r === "number" && isFinite(r) && r > 0 ? r : null;
  }
  // from 통화 1단위가 to 통화 몇 단위인지. 없는 통화면 null.
  function crossRate(rates, from, to) {
    if (from === to) return 1;
    var a = rateOf(rates, from), b = rateOf(rates, to);
    return a && b ? b / a : null;
  }
  // 금액 → 받는 금액. feePct는 환산 금액에서 차감하는 수수료율(0 이상 100 미만).
  function convert(amount, rate, feePct) {
    var fee = feePct || 0;
    var gross = amount * rate;
    var feeAmount = gross * fee / 100;
    return { gross: gross, fee: feeAmount, net: gross - feeAmount };
  }
  // 받고 싶은 금액 → 내야 하는 금액(수수료를 받는 금액에서 차감하는 방식의 역산).
  function required(target, rate, feePct) {
    var fee = feePct || 0;
    var perUnit = rate * (1 - fee / 100);
    return perUnit > 0 ? target / perUnit : NaN;
  }
  // 자주 쓰는 통화(바로가기 버튼). 원화 상대가 가장 흔해서 선택한 통화를 외화 쪽에 두고 반대편은 원화로 맞춘다.
  var QUICK = [["USD", "달러"], ["JPY", "엔"], ["EUR", "유로"], ["CNY", "위안"], ["GBP", "파운드"], ["AUD", "호주 달러"], ["CAD", "캐나다 달러"], ["THB", "바트"], ["HKD", "홍콩 달러"], ["SGD", "싱가포르 달러"]];
  // 방향은 유지한다: 원화가 받는 쪽이면 외화는 바꿀 쪽에, 원화가 바꿀 쪽이면 외화는 받을 쪽에 둔다. 원화가 없으면 외화를 바꿀 쪽, 원화를 받을 쪽으로 둔다.
  function quickPick(from, to, code) {
    if (code === "KRW") return { from: from, to: to };
    if (from === "KRW") return { from: "KRW", to: code };
    return { from: code, to: "KRW" };
  }
  function validate(o) {
    if (!(o.amount > 0) || !isFinite(o.amount)) return "금액을 0보다 크게 입력하세요.";
    if (o.amount > 1e13) return "금액이 너무 큽니다.";
    if (!(o.rate > 0) || !isFinite(o.rate)) return "환율을 확인하세요. 조회에 실패했다면 '직접 입력'을 선택하세요.";
    if (o.feePct != null && (!(o.feePct >= 0) || !(o.feePct < 100))) return "수수료율은 0 이상 100 미만으로 입력하세요.";
    return "";
  }
  function fmt(value, code) {
    var d = BY_CODE[code] ? BY_CODE[code].digits : 2;
    return value.toLocaleString("ko-KR", { minimumFractionDigits: d, maximumFractionDigits: d });
  }
  // 환율 표시: 큰 값은 소수 둘째 자리, 작은 값은 유효숫자 4자리 정도
  function fmtRate(r) {
    if (r >= 100) return r.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    if (r >= 1) return r.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
    return r.toLocaleString("ko-KR", { maximumSignificantDigits: 4 });
  }

  function init() {
    var form = document.getElementById("fx-form");
    if (!form) return;
    var $ = function (id) { return document.getElementById(id); };
    var fromSel = $("fx-from"), toSel = $("fx-to"), srcSel = $("fx-source");
    CURRENCIES.forEach(function (c) {
      [fromSel, toSel].forEach(function (sel) {
        var o = document.createElement("option"); o.value = c.code; o.textContent = c.code + " · " + c.name; sel.appendChild(o);
      });
    });
    fromSel.value = "USD"; toSel.value = "KRW";

    var quickBox = $("fx-quick");
    QUICK.forEach(function (q) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "game-filter-btn"; b.setAttribute("data-code", q[0]); b.setAttribute("aria-pressed", "false");
      b.textContent = q[1] + " " + q[0];
      quickBox.appendChild(b);
    });
    function syncQuick() {
      quickBox.querySelectorAll("button").forEach(function (b) {
        var on = b.getAttribute("data-code") === fromSel.value || b.getAttribute("data-code") === toSel.value;
        b.classList.toggle("is-active", on); b.setAttribute("aria-pressed", String(on));
      });
    }
    quickBox.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("button[data-code]");
      if (!b) return;
      var p = quickPick(fromSel.value, toSel.value, b.getAttribute("data-code"));
      fromSel.value = p.from; toSel.value = p.to; $("fx-manual").value = "";
      refreshRate(); if (srcSel.value === "manual") onSourceChange(); syncQuick();
    });

    var state = { rates: null, date: "", loading: false };
    function setStatus(text, isError) {
      var s = $("fx-status"); s.textContent = text; s.className = isError ? "sal-error" : "muted";
    }
    function load() {
      if (state.loading) return;
      state.loading = true; setStatus("기준환율을 조회하는 중입니다…", false);
      var ctrl = typeof AbortController === "function" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
      fetch(API, ctrl ? { signal: ctrl.signal } : undefined).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }).then(function (j) {
        if (!j || !j.rates || !j.date) throw new Error("응답 형식");
        state.rates = j.rates; state.date = j.date;
        setStatus("기준환율 조회 완료 · 기준일 " + j.date + " (Frankfurter 제공 기준환율)", false);
        refreshRate();
      }).catch(function () {
        state.rates = null; state.date = "";
        srcSel.value = "manual"; onSourceChange();
        setStatus("기준환율을 불러오지 못했습니다. '직접 입력'으로 환율을 넣어 계산하세요.", true);
      }).then(function () { clearTimeout(timer); state.loading = false; });
    }
    function currentAutoRate() {
      return state.rates ? crossRate(state.rates, fromSel.value, toSel.value) : null;
    }
    function refreshRate() {
      var r = currentAutoRate();
      var line = $("fx-rate-line");
      if (srcSel.value === "auto") {
        line.textContent = r ? "1 " + fromSel.value + " = " + fmtRate(r) + " " + toSel.value + (state.date ? " (기준일 " + state.date + ")" : "") : "기준환율이 없습니다.";
        if (r && !$("fx-manual").value) $("fx-manual").placeholder = fmtRate(r);
      }
    }
    function onSourceChange() {
      var manual = srcSel.value === "manual";
      $("fx-manual-wrap").hidden = !manual;
      $("fx-rate-line").hidden = manual;
      if (manual) {
        var r = currentAutoRate();
        if (r && !$("fx-manual").value) $("fx-manual").value = String(Math.round(r * 1e6) / 1e6);
      } else refreshRate();
    }
    srcSel.addEventListener("change", onSourceChange);
    [fromSel, toSel].forEach(function (s) { s.addEventListener("change", function () { $("fx-manual").value = ""; refreshRate(); if (srcSel.value === "manual") onSourceChange(); syncQuick(); }); });
    $("fx-swap").addEventListener("click", function () {
      var a = fromSel.value; fromSel.value = toSel.value; toSel.value = a; $("fx-manual").value = ""; refreshRate();
      if (srcSel.value === "manual") onSourceChange();
      syncQuick();
    });
    $("fx-reload").addEventListener("click", load);
    // 계산 방식에 따라 금액 칸이 어느 통화 기준인지 안내를 바꾼다.
    form.querySelectorAll('input[name="fx-mode"]').forEach(function (r) {
      r.addEventListener("change", function () {
        $("fx-amount-label").textContent = form.querySelector('input[name="fx-mode"]:checked').value === "required" ? "금액 (받을 통화 기준)" : "금액 (바꿀 통화 기준)";
      });
    });

    function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var err = $("fx-error"); err.hidden = true;
      var mode = form.querySelector('input[name="fx-mode"]:checked').value;
      var from = fromSel.value, to = toSel.value;
      var amount = Number($("fx-amount").value);
      var feePct = $("fx-fee").value === "" ? 0 : Number($("fx-fee").value);
      var rate = srcSel.value === "manual" ? Number($("fx-manual").value) : currentAutoRate();
      var msg = validate({ amount: amount, rate: rate, feePct: feePct });
      if (msg) { err.textContent = msg; err.hidden = false; $("fx-result").hidden = true; return; }
      var out = $("fx-result"); out.hidden = false; out.textContent = "";
      var hero = el("div", "card calc-hero");
      var stats = el("div", "hero-stats");
      function stat(label, value) { var d = el("div", "hero-stat"); d.appendChild(el("span", null, label)); d.appendChild(el("b", null, value)); stats.appendChild(d); }
      if (mode === "convert") {
        var c = convert(amount, rate, feePct);
        hero.appendChild(el("p", "hero-label", fmt(amount, from) + " " + from + "을(를) 바꾸면 받는 금액(수수료 반영)"));
        hero.appendChild(el("p", "hero-main", fmt(c.net, to) + " " + to));
        hero.appendChild(el("p", "hero-sub", "환산 금액 " + fmt(c.gross, to) + " " + to + (feePct ? " − 수수료 " + fmt(c.fee, to) + " " + to : "")));
        stat("적용 환율", "1 " + from + " = " + fmtRate(rate) + " " + to);
        stat("반대 방향", "1 " + to + " = " + fmtRate(1 / rate) + " " + from);
        stat("수수료율", feePct + "%");
      } else {
        var need = required(amount, rate, feePct);
        hero.appendChild(el("p", "hero-label", fmt(amount, to) + " " + to + "을(를) 받으려면 필요한 금액(수수료 반영)"));
        hero.appendChild(el("p", "hero-main", fmt(need, from) + " " + from));
        hero.appendChild(el("p", "hero-sub", "수수료가 없다면 " + fmt(amount / rate, from) + " " + from));
        stat("적용 환율", "1 " + from + " = " + fmtRate(rate) + " " + to);
        stat("반대 방향", "1 " + to + " = " + fmtRate(1 / rate) + " " + from);
        stat("수수료율", feePct + "%");
      }
      if (from === "JPY" || to === "JPY") {
        var yenRate = from === "JPY" ? rate : 1 / rate;
        var other = from === "JPY" ? to : from;
        stat("엔화 100엔당", fmtRate(yenRate * 100) + " " + other);
      }
      hero.appendChild(stats);
      var src = srcSel.value === "manual" ? "직접 입력한 환율을 썼습니다." : "Frankfurter 기준환율(기준일 " + state.date + ")을 썼습니다.";
      hero.appendChild(el("p", "muted", src + " 은행·환전소의 실제 적용 환율(현찰 살 때·팔 때), 카드 해외결제 환율과 다를 수 있어 참고용으로만 보세요."));
      out.appendChild(hero);
      out.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    form.addEventListener("reset", function () {
      setTimeout(function () { $("fx-result").hidden = true; $("fx-error").hidden = true; fromSel.value = "USD"; toSel.value = "KRW"; srcSel.value = "auto"; onSourceChange(); syncQuick(); }, 0);
    });
    onSourceChange();
    syncQuick();
    load();
  }
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
  }
  return { QUICK: QUICK, quickPick: quickPick, CURRENCIES: CURRENCIES, crossRate: crossRate, convert: convert, required: required, validate: validate, fmt: fmt, fmtRate: fmtRate, API: API };
});
