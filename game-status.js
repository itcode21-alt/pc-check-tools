// 게임 오류 페이지의 "나도 지금 안 돼요" 신고 위젯.
// 같은 시간대에 신고가 몰리는지 보여 줘서 서버·점검 쪽인지 내 PC 쪽인지 가늠하게 돕는다.
// 방문자 신고 수일 뿐 공식 서버 상태가 아니며, 서버에 연결되지 않으면 위젯을 표시하지 않는다.
(function () {
  "use strict";
  var match = location.pathname.match(/(?:^|\/)game-([a-z0-9]+)\.html$/);
  if (!match || match[1] === "common") return;
  var game = match[1];
  var lead = document.querySelector("main .lead");
  if (!lead) return;

  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var override = local ? new URLSearchParams(location.search).get("statusApi") : null;
  var API = override && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(override) ? override : "https://ai.itsvc.co.kr";
  var BUSY_THRESHOLD = 3;
  var REPORT_GAP_MS = 30 * 60 * 1000;
  var STORE_KEY = "itsvc-game-status-" + game;

  // 2026-11-11에 열리는 것을 확인한 공식 사이트만 연결한다.
  var OFFICIAL = {
    aion2: "https://aion2.plaync.com/",
    blackdesert: "https://www.kr.playblackdesert.com/",
    dfo: "https://df.nexon.com/",
    fconline: "https://fconline.nexon.com/",
    lol: "https://support.riotgames.com/",
    lostark: "https://lostark.game.onstove.com/",
    maplestory: "https://maplestory.nexon.com/",
    poe2: "https://poe2.kakaogames.com/home",
    suddenattack: "https://sa.nexon.com/",
    valorant: "https://playvalorant.com/"
  };

  function request(path, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 6000);
    options = options || {};
    options.signal = controller.signal;
    return fetch(API + path, options).then(function (response) {
      clearTimeout(timer);
      if (!response.ok) throw new Error("status " + response.status);
      return response.json();
    }, function (error) { clearTimeout(timer); throw error; });
  }

  function reportedRecently() {
    try { return Date.now() - Number(localStorage.getItem(STORE_KEY) || 0) < REPORT_GAP_MS; } catch (e) { return false; }
  }

  function build() {
    if (!document.getElementById("game-status-style")) {
      var style = document.createElement("style");
      style.id = "game-status-style";
      style.textContent =
        ".game-status{margin:18px 0;padding:16px 18px;border:1px solid var(--line,#dadce0);border-radius:12px}" +
        ".game-status h3{margin:0 0 6px;font-size:1.05rem}" +
        ".game-status p{margin:0 0 10px}" +
        ".game-status-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}" +
        ".game-status button{min-height:42px;padding:0 16px;border:1px solid var(--line,#dadce0);border-radius:8px;background:#1f2937;color:#fff;font:inherit;font-weight:700;cursor:pointer}" +
        ".game-status button:disabled{opacity:.55;cursor:default}" +
        ".game-status-count{font-weight:700}" +
        ".game-status-note{color:var(--text-secondary,#5f6368);font-size:.9rem;margin:10px 0 0}";
      document.head.appendChild(style);
    }
    var box = document.createElement("section");
    box.className = "game-status";
    box.setAttribute("aria-labelledby", "game-status-title");
    box.innerHTML =
      '<h3 id="game-status-title">지금 접속이나 실행이 안 되나요?</h3>' +
      "<p>같은 시간에 여러 명이 겪고 있으면 서버·점검 쪽일 가능성이 있고, 나만 그렇다면 내 PC나 네트워크부터 확인하는 편이 빠릅니다.</p>" +
      '<div class="game-status-row"><button type="button">나도 지금 안 돼요</button><span class="game-status-count" aria-live="polite"></span></div>' +
      '<p class="game-status-verdict" aria-live="polite" style="margin:10px 0 0"></p>' +
      '<p class="game-status-note">이 페이지 방문자가 누른 신고 수이며 공식 서버 상태가 아닙니다. 신고할 때 게임 이름만 전송되며, 접속 주소는 기록으로 남기지 않습니다.</p>';
    return box;
  }

  function render(box, data) {
    box.querySelector(".game-status-count").textContent =
      "최근 1시간 " + data.last_hour + "건 · 24시간 " + data.last_day + "건";
    var verdict = box.querySelector(".game-status-verdict");
    verdict.textContent = "";
    if (data.last_hour >= BUSY_THRESHOLD) {
      verdict.appendChild(document.createTextNode("최근 1시간에 여러 명이 신고했습니다. PC를 건드리기 전에 공식 공지와 점검 일정을 먼저 확인하세요. "));
      if (OFFICIAL[game]) {
        var link = document.createElement("a");
        link.href = OFFICIAL[game];
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = "공식 사이트 열기";
        verdict.appendChild(link);
      }
    } else {
      verdict.textContent = "최근 1시간 신고가 거의 없습니다. 서버 문제가 아닐 수 있으니 아래 점검 순서를 먼저 해 보세요.";
    }
  }

  request("/api/game-status?game=" + encodeURIComponent(game)).then(function (data) {
    var box = build();
    var button = box.querySelector("button");
    if (reportedRecently()) { button.disabled = true; button.textContent = "신고했습니다"; }
    button.addEventListener("click", function () {
      button.disabled = true;
      request("/api/game-status/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ game: game })
      }).then(function (result) {
        try { localStorage.setItem(STORE_KEY, String(Date.now())); } catch (e) {}
        button.textContent = "신고했습니다";
        render(box, result);
      }, function () {
        button.disabled = false;
        box.querySelector(".game-status-verdict").textContent = "지금은 신고를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.";
      });
    });
    render(box, data);
    lead.insertAdjacentElement("afterend", box);
  }, function () { /* 서버에 연결되지 않으면 위젯을 표시하지 않는다 */ });
})();
