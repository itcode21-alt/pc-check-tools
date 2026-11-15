/* 프린터 오류 해결 마법사 화면. 질문 → 해결 순서를 한 단계씩 보여 준다.
   데이터는 printer-wizard-data.js. 주소의 #해시(예: #r-queue-all)로 각 단계에 바로 연결된다.
   입력값이나 선택은 서버로 전송·저장하지 않는다. */
(function () {
  "use strict";
  var W = window.PRINTER_WIZARD;
  var root = document.getElementById("pw-root");
  if (!W || !root) return;
  var nodes = W.nodes;
  var started = false;
  var current = "";

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function link(href, text, ext) {
    var a = el("a", "", text);
    a.href = href;
    if (ext) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    return a;
  }
  // 클릭하면 즉시 그리고 주소 해시도 바꾼다(브라우저 뒤로 가기·딥링크 지원). 같은 노드는 다시 그리지 않는다.
  function go(id) { location.hash = id; renderNode(id); }

  function nav(isRoot) {
    var row = el("div", "button-row");
    row.style.marginTop = "16px";
    if (!isRoot) {
      var back = el("button", "btn secondary", "← 이전");
      back.type = "button";
      back.addEventListener("click", function () { if (history.length > 1) history.back(); else go(W.start); });
      row.appendChild(back);
      var home = el("button", "btn secondary", "처음부터");
      home.type = "button";
      home.addEventListener("click", function () { go(W.start); });
      row.appendChild(home);
    }
    return row;
  }

  function renderNode(id) {
    var n = nodes[id] || nodes[W.start];
    if (!nodes[id]) id = W.start;
    if (id === current) return;
    current = id;
    root.textContent = "";
    var h = el("h3", "", n.title);
    h.tabIndex = -1;
    root.appendChild(h);

    if (n.type === "q") {
      var list = el("div", "pw-options");
      n.options.forEach(function (o) {
        var b = el("button", "btn pw-option", o.label);
        b.type = "button";
        b.addEventListener("click", function () { go(o.to); });
        list.appendChild(b);
      });
      root.appendChild(list);
      root.appendChild(nav(id === W.start));
    } else {
      root.appendChild(el("p", "lead", n.summary));
      root.appendChild(el("h4", "", "이 순서대로 해보세요"));
      var ol = el("ol", "mini-list");
      n.steps.forEach(function (s) { ol.appendChild(el("li", "", s)); });
      root.appendChild(ol);
      if (n.cmd) {
        root.appendChild(el("p", "muted", "관리자 권한 명령 프롬프트(시작 메뉴에서 'cmd' 검색 → 관리자 권한으로 실행)에서 실행:"));
        var pre = el("pre"); var code = el("code", "", n.cmd); pre.appendChild(code);
        pre.style.overflowX = "auto";
        root.appendChild(pre);
      }
      if (n.links.length || n.ms.length) {
        root.appendChild(el("h4", "", "자세한 가이드"));
        var ul = el("ul", "mini-list");
        n.links.forEach(function (l) { var li = el("li"); li.appendChild(link(l[0], l[1])); ul.appendChild(li); });
        n.ms.forEach(function (l) { var li = el("li"); li.appendChild(link(l[0], l[1], true)); ul.appendChild(li); });
        root.appendChild(ul);
      }
      if (n.next) {
        var nb = el("button", "btn", "해결되지 않았나요? → " + n.next.label);
        nb.type = "button";
        nb.addEventListener("click", function () { go(n.next.to); });
        var wrap = el("div", "button-row"); wrap.style.marginTop = "12px"; wrap.appendChild(nb);
        root.appendChild(wrap);
      }
      root.appendChild(el("p", "muted", "위 순서로도 해결되지 않으면 이 페이지 아래의 원격점검 안내로 문의해 주세요. 증상과 시도한 내용을 알려 주시면 더 빨리 확인할 수 있습니다."));
      root.appendChild(nav(false));
    }
    if (started) { root.scrollIntoView({ behavior: "smooth", block: "start" }); h.focus({ preventScroll: true }); }
    started = true;
  }

  function fromHash() {
    var id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    renderNode(nodes[id] ? id : W.start);
  }
  window.addEventListener("hashchange", fromHash);
  fromHash();
})();
