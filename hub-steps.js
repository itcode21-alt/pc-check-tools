/* 게임 허브: 점검 순서(<ol>)를 단계 카드로 바꾸는 화면 보강 스크립트.
   원본 HTML(크롤러용)은 그대로 두고, 화면에서만 단계 카드·체크·진행 표시를 입힌다.
   서버로 보내거나 저장하는 값은 없다(새로고침하면 처음 상태). */
(function () {
  "use strict";
  var cards = document.querySelectorAll(".game-err-card");
  if (!cards.length) return;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  Array.prototype.forEach.call(cards, function (card, ci) {
    try {
      var head = Array.prototype.filter.call(card.querySelectorAll("h4"), function (h) { return h.textContent.trim() === "점검 순서"; })[0];
      if (!head) return;
      var ol = head.nextElementSibling;
      if (!ol || ol.tagName !== "OL") return;
      var steps = [];
      var ok = true;
      Array.prototype.forEach.call(ol.children, function (li) {
        if (li.tagName !== "LI") return;
        var strong = li.querySelector(":scope > strong");
        if (!strong) { ok = false; return; }
        var title = strong.innerHTML.replace(/^\s*\d+\s*단계\s*[-–:]\s*/, "").replace(/:\s*$/, "").trim();
        var tag = "";
        var m = title.match(/\s*\(([^()]*)\)\s*$/);
        if (m) { tag = m[1]; title = title.slice(0, m.index).trim(); }
        var clone = li.cloneNode(true);
        clone.removeChild(clone.querySelector("strong"));
        var lines = clone.innerHTML.split(/<br\s*\/?>/i).map(function (s) { return s.trim(); }).filter(Boolean);
        steps.push({ title: title, tag: tag, lines: lines });
      });
      if (!ok || !steps.length) return;

      var wrap = document.createElement("div");
      wrap.className = "hub-steps-wrap";
      var progress = document.createElement("p");
      progress.className = "hub-progress";
      progress.setAttribute("aria-live", "polite");
      var newOl = document.createElement("ol");
      newOl.className = "hub-steps";
      var note = document.createElement("p");
      note.className = "hub-allnote";
      note.hidden = true;
      note.textContent = "모두 해봤는데도 같다면 아래 참고 자료를 보거나 오류 문구를 적어 고객센터에 문의하세요.";

      steps.forEach(function (s, si) {
        var li = document.createElement("li");
        li.className = "hub-step";
        var id = "hs-" + ci + "-" + si;
        li.innerHTML =
          '<div class="hub-step-head"><span class="hub-step-num" aria-hidden="true">' + (si + 1) + '</span>' +
          '<span class="hub-step-title">' + s.title + (s.tag ? ' <span class="hub-step-tag">' + esc(s.tag) + '</span>' : "") + '</span></div>' +
          (s.lines.length ? '<ul class="hub-step-lines">' + s.lines.map(function (l) { return "<li>" + l + "</li>"; }).join("") + "</ul>" : "") +
          '<label class="hub-step-done" for="' + id + '"><input type="checkbox" id="' + id + '"> <span>이 단계를 해봤어요</span></label>';
        newOl.appendChild(li);
      });

      var items = newOl.children;
      function refresh() {
        var done = 0, current = -1;
        Array.prototype.forEach.call(items, function (li, i) {
          var checked = li.querySelector("input").checked;
          li.classList.toggle("is-done", checked);
          if (checked) done++; else if (current < 0) current = i;
        });
        Array.prototype.forEach.call(items, function (li, i) { li.classList.toggle("is-current", i === current); });
        progress.innerHTML = "순서대로 해보고, 해결되면 거기서 멈추세요 · <b>" + done + " / " + items.length + "단계</b> 확인";
        note.hidden = done !== items.length;
      }
      newOl.addEventListener("change", refresh);
      wrap.appendChild(progress);
      wrap.appendChild(newOl);
      wrap.appendChild(note);
      ol.replaceWith(wrap);
      refresh();
    } catch (e) { /* 실패해도 원본 목록이 그대로 남는다 */ }
  });
})();
