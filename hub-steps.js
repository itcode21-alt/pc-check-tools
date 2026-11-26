/* 게임 허브: 점검 순서(<ol>)를 단계 카드로 바꾸는 화면 보강 스크립트.
   원본 HTML(크롤러용)은 그대로 두고, 화면에서만 단계 카드·체크·진행 표시를 입힌다.
   서버로 보내거나 저장하는 값은 없다(새로고침하면 처음 상태). */
(function () {
  "use strict";

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }


  /* 윈도우 기본 기능 "따라 하는 방법" (Windows 10/11 공통 화면 기준, 11 기준 이름 우선).
     게임 안쪽 화면은 여기에 넣지 않는다(확인된 것만 각 단계 본문에 직접 적는다). */
  var HOWTO = [
    { id: "taskmgr", title: "작업 관리자 열고 프로그램 끝내기", re: /작업 관리자/,
      steps: ["키보드에서 Ctrl + Shift + Esc를 동시에 누릅니다. 작업 관리자가 열립니다.", "창이 작게 보이면 왼쪽 아래의 '자세히'를 누릅니다.", "'프로세스' 탭에서 끝내려는 프로그램(게임, 런처, 오버레이 프로그램 등)을 한 번 눌러 선택합니다.", "오른쪽 아래(또는 위쪽)의 '작업 끝내기'를 누릅니다.", "같은 프로그램 항목이 여러 줄이면 모두 같은 방법으로 끝냅니다."],
      note: "이름을 모르는 윈도우 시스템 프로그램은 끝내지 마세요." },
    { id: "cmd-admin", title: "관리자 권한으로 명령 프롬프트 열기", re: /명령 프롬프트 ?\(관리자\)|(명령 프롬프트|cmd).*관리자|관리자.*(명령 프롬프트|cmd)/,
      steps: ["시작 버튼 옆 검색창에 cmd를 입력합니다.", "검색 결과의 '명령 프롬프트'를 마우스 오른쪽 버튼으로 눌러 '관리자 권한으로 실행'을 선택합니다(오른쪽 패널에 보이는 '관리자 권한으로 실행'을 눌러도 됩니다).", "'이 앱이 디바이스를 변경할 수 있도록 허용하시겠습니까?' 창에서 '예'를 누릅니다.", "창 제목에 '관리자: 명령 프롬프트'라고 보이는지 확인합니다.", "단계에 적힌 명령을 그대로 입력(또는 복사해 Ctrl + V)하고 Enter를 누릅니다."] },
    { id: "admin", title: "관리자 권한으로 실행하기", re: /관리자 권한/, skipIf: ["cmd-admin"],
      steps: ["바탕화면이나 시작 메뉴에서 실행하려는 프로그램(게임 런처 등)의 아이콘을 찾습니다.", "아이콘을 마우스 오른쪽 버튼으로 누릅니다.", "'관리자 권한으로 실행'을 누릅니다. 시작 메뉴에서는 '자세히 → 관리자 권한으로 실행'에 있을 수 있습니다.", "'이 앱이 디바이스를 변경할 수 있도록 허용하시겠습니까?' 창이 뜨면 '예'를 누릅니다."] },
    { id: "compat", title: "호환성 탭 설정하기", re: /호환성/,
      steps: ["게임이나 런처의 실행 파일(.exe)을 찾습니다. 바로가기 아이콘이라면 마우스 오른쪽 버튼 → '파일 위치 열기'로 원본 파일을 찾습니다.", "실행 파일을 마우스 오른쪽 버튼으로 눌러 '속성'을 선택합니다.", "위쪽의 '호환성' 탭을 누릅니다.", "이 단계 설명에 맞게 항목을 켜거나 끕니다(예: '전체 화면 최적화 사용 안 함', '관리자 권한으로 이 프로그램 실행').", "'적용'을 누르고 '확인'을 눌러 닫은 뒤 게임을 다시 실행합니다."] },
    { id: "gpu-driver", title: "그래픽 드라이버 최신으로 업데이트하기", re: /(그래픽(카드)?|GPU) ?드라이버/,
      steps: ["먼저 그래픽카드 이름을 확인합니다. Ctrl + Shift + Esc로 작업 관리자를 열고 '성능' 탭 → 왼쪽 'GPU' 항목을 누르면 오른쪽 위에 모델명이 보입니다.", "NVIDIA는 NVIDIA app(또는 GeForce Experience), AMD는 AMD Software: Adrenalin Edition, Intel은 Intel 드라이버 및 지원 도우미가 설치돼 있으면 열어 드라이버 업데이트를 확인합니다.", "해당 프로그램이 없으면 제조사 공식 사이트의 드라이버 다운로드 페이지에서 내 그래픽카드 모델에 맞는 최신 드라이버를 받아 설치합니다.", "NVIDIA 설치 화면에서 '사용자 지정' → '클린 설치 수행'을 체크하면 이전 설정을 초기화하고 설치합니다(선택 사항).", "설치가 끝나면 컴퓨터를 '다시 시작'한 뒤 게임을 실행합니다."],
      note: "노트북은 제조사 지원 페이지에 별도 드라이버가 있는 경우도 있습니다." },
    { id: "wired", title: "유선(LAN 케이블) 연결로 바꾸기", re: /유선|LAN 케이블|이더넷/,
      steps: ["공유기(또는 벽의 인터넷 단자)와 PC의 LAN 포트를 LAN 케이블로 연결합니다.", "작업 표시줄 오른쪽 아래의 네트워크 아이콘을 눌러 Wi-Fi를 끕니다(Windows 11은 빠른 설정 창의 Wi-Fi 버튼).", "네트워크 아이콘이 모니터 모양(유선) 등으로 바뀌었는지 확인하고, 인터넷 브라우저로 사이트가 열리는지 확인합니다.", "게임을 다시 실행해 증상이 사라졌는지 봅니다."] },
    { id: "av-exception", title: "Windows 보안에서 게임 폴더 예외 추가하기", re: /(백신|보안 프로그램|Defender).*(예외|제외)|예외 (등록|추가)/,
      steps: ["시작 버튼을 누르고 'Windows 보안'을 검색해 실행합니다.", "'바이러스 및 위협 방지'를 누릅니다.", "'바이러스 및 위협 방지 설정' 아래의 '설정 관리'를 누릅니다.", "아래로 내려 '제외'의 '제외 추가 또는 제거'를 누릅니다.", "'제외 사항 추가' → '폴더'를 고르고 게임이 설치된 폴더를 선택합니다.", "알약·V3 같은 다른 백신은 해당 프로그램 설정의 '예외' 메뉴에서 같은 폴더를 등록합니다(메뉴 이름은 프로그램마다 다릅니다)."],
      note: "예외로 등록한 폴더는 검사하지 않으니, 공식 경로로 설치한 게임 폴더에만 사용하세요." },
    { id: "firewall", title: "방화벽에서 앱 허용하기", re: /방화벽/,
      steps: ["시작 버튼을 누르고 'Windows 보안'을 검색해 실행합니다.", "'방화벽 및 네트워크 보호'를 누릅니다.", "'방화벽에서 앱 허용'을 누릅니다.", "'설정 변경'을 누르고(관리자 확인 창에서 '예') '다른 앱 허용...' → '찾아보기'로 게임이나 런처의 .exe 파일을 선택해 '추가'합니다.", "목록에서 해당 앱의 '개인'과 '공용' 칸에 체크하고 '확인'을 누릅니다."] },
    { id: "winupdate", title: "Windows 업데이트 확인하기", re: /(Windows|윈도우) ?업데이트/,
      steps: ["시작 버튼 → '설정'(톱니바퀴)을 누릅니다.", "'Windows 업데이트'를 누릅니다(Windows 10은 '업데이트 및 보안 → Windows 업데이트').", "'업데이트 확인'을 누르고 설치가 끝날 때까지 기다립니다.", "'지금 다시 시작'이 보이면 눌러 재시작한 뒤 게임을 실행합니다."] },
    { id: "flushdns", title: "DNS 캐시 초기화하기", re: /flushdns|DNS 캐시/,
      steps: ["시작 버튼 옆 검색창에 cmd를 입력하고 '명령 프롬프트'를 엽니다.", "검은 창에 ipconfig /flushdns 를 입력하고 Enter를 누릅니다.", "'DNS 확인자 캐시를 플러시했습니다.' 메시지가 나오면 끝입니다.", "게임을 다시 접속해 봅니다."] },
    { id: "cmd", title: "명령 프롬프트 열고 명령 입력하기", re: /명령 프롬프트|(^|[^A-Za-z])cmd([^A-Za-z]|$)|CMD/, skipIf: ["flushdns", "cmd-admin"],
      steps: ["키보드에서 윈도우 키 + R을 누르고 cmd를 입력한 뒤 Enter를 누릅니다.", "검은 창이 열리면 단계에 적힌 명령을 그대로 입력(또는 복사해 Ctrl + V)하고 Enter를 누릅니다.", "결과 글자가 나오면 내용을 확인합니다. 창은 확인이 끝난 뒤 X로 닫습니다."] },
    { id: "cleanboot", title: "클린 부팅으로 충돌 프로그램 찾기", re: /클린 부팅|msconfig/,
      steps: ["키보드에서 윈도우 키 + R을 누르고 msconfig를 입력한 뒤 Enter를 누릅니다.", "'시스템 구성' 창의 '서비스' 탭에서 'Microsoft 서비스 숨기기'에 체크한 뒤 '모두 사용 안 함'을 누릅니다.", "'시작프로그램' 탭의 '작업 관리자 열기'를 눌러, 시작프로그램 항목을 하나씩 선택하고 '사용 안 함'을 누릅니다.", "작업 관리자를 닫고 '시스템 구성'의 '확인'을 눌러 '다시 시작'합니다.", "게임이 정상이면 방금 끈 프로그램 중에 원인이 있습니다. 확인이 끝나면 msconfig → '일반' 탭 → '일반 시작'을 선택하고 다시 시작해 원래대로 되돌립니다."],
      note: "'Microsoft 서비스 숨기기'에 체크하지 않고 모두 끄면 윈도우 필수 기능까지 꺼질 수 있습니다." },
    { id: "power", title: "전원 설정을 성능 위주로 바꾸기", re: /전원 (옵션|관리|계획)|고성능 (전원|모드)|최고 성능/,
      steps: ["Windows 11: 시작 → '설정' → '시스템' → '전원 및 배터리'에서 '전원 모드'를 '최고 성능'으로 바꿉니다(노트북은 충전기를 연결해야 선택지가 보일 수 있습니다).", "Windows 10: 시작 → '제어판' → '하드웨어 및 소리' → '전원 옵션'에서 '고성능'을 선택합니다. 보이지 않으면 '추가 요금제 표시'를 누릅니다.", "설정을 바꾼 뒤 게임을 다시 실행해 봅니다."] },
    { id: "gfx-perf", title: "Windows 그래픽 성능을 '고성능'으로 지정하기", re: /그래픽 성능|고성능 그래픽/,
      steps: ["시작 버튼 → '설정' → '시스템' → '디스플레이'를 누릅니다.", "아래로 내려 '그래픽'을 누릅니다.", "'앱 추가'(데스크톱 앱)에서 '찾아보기'를 눌러 게임의 .exe 파일을 선택하고 추가합니다.", "목록에 생긴 게임 항목을 누르고 '옵션' → '고성능'을 선택한 뒤 '저장'합니다."] },
    { id: "disk", title: "디스크 여유 공간 확인하고 정리하기", re: /디스크 정리|여유 공간|디스크 공간/,
      steps: ["키보드에서 윈도우 키 + E로 파일 탐색기를 열고 왼쪽 '내 PC'를 누릅니다.", "게임이 설치된 드라이브의 막대 아래에서 'xx GB 사용 가능'을 확인합니다.", "부족하면 시작 버튼 옆 검색창에 '디스크 정리'를 입력해 실행하고, 드라이브를 고른 뒤 '삭제할 파일'에서 '임시 파일' 등을 체크하고 '확인' → '파일 삭제'를 누릅니다."] },
    { id: "devmgr", title: "장치 관리자 열기", re: /장치 관리자/,
      steps: ["시작 버튼을 마우스 오른쪽 버튼으로 누르거나 윈도우 키 + X를 누릅니다.", "목록에서 '장치 관리자'를 누릅니다.", "이 단계에 적힌 항목(예: 디스플레이 어댑터, 네트워크 어댑터)을 더블클릭해 펼칩니다.", "장치를 마우스 오른쪽 버튼으로 눌러 '속성'을 선택하고, 단계에 적힌 탭(예: 전원 관리)으로 이동합니다."] },
    { id: "steam-verify", title: "Steam에서 게임 파일 무결성 검사하기", re: /무결성 검사/, only: /Steam|스팀/,
      steps: ["Steam을 열고 위쪽 '라이브러리'를 누릅니다.", "목록에서 해당 게임을 마우스 오른쪽 버튼으로 눌러 '속성'을 선택합니다.", "왼쪽 '설치된 파일'(구버전은 '로컬 파일')을 누릅니다.", "'게임 파일 무결성 검사'를 누르고 완료될 때까지 기다립니다(몇 분 걸릴 수 있습니다)."] },
    { id: "restart", title: "컴퓨터 '다시 시작'하는 방법", re: /재부팅|컴퓨터를 (다시 시작|재시작)|PC를 (다시 시작|재시작)/,
      steps: ["시작 버튼을 누르고 오른쪽 아래 전원 아이콘을 누릅니다.", "'시스템 종료'가 아니라 '다시 시작'을 선택합니다.", "다시 켜지면 게임을 처음부터 실행합니다."],
      note: "빠른 시작이 켜진 PC는 '시스템 종료' 후 다시 켜도 완전히 초기화되지 않을 수 있어 '다시 시작'이 확실합니다." },
    { id: "reinstall", not: /드라이버/, title: "프로그램 삭제 후 다시 설치하기", re: /(삭제|제거)(한 뒤|한 후|하고|해서|하여|후)|재설치(해|하세요|하여|합니다|를 진행)/,
      note: "Steam·Battle.net·Epic 같은 플랫폼의 게임은 그 플랫폼 앱의 라이브러리에서 해당 게임의 메뉴를 열어 '제거(삭제)'를 선택하는 편이 안전합니다.",
      steps: ["삭제 전에 게임 설정이나 저장 파일이 필요하면 따로 복사해 둡니다.", "시작 버튼 → '설정' → '앱' → '설치된 앱'(Windows 10은 '앱 및 기능')을 엽니다.", "목록에서 해당 프로그램을 찾아 '⋯' → '제거'(Windows 10은 항목을 눌러 '제거')를 누르고 안내를 따릅니다.", "컴퓨터를 '다시 시작'합니다.", "공식 홈페이지나 플랫폼에서 최신 설치 파일을 받아 설치하고, 같은 증상이 있는지 확인합니다."] },
    { id: "vpn", title: "VPN·프록시 끄기", re: /VPN|프록시/,
      steps: ["VPN 프로그램을 쓰고 있다면 그 프로그램에서 '연결 끊기'를 누릅니다.", "시작 버튼 → '설정' → '네트워크 및 인터넷' → 'VPN'에서 연결된 항목이 있으면 '연결 끊기'를 누릅니다.", "같은 '네트워크 및 인터넷'의 '프록시'에서 '수동 프록시 설정'의 '프록시 서버 사용'이 켜져 있으면 끕니다.", "게임을 다시 접속해 봅니다."] }
  ];

  function howtoFor(step) {
    var text = step.title + " " + step.lines.join(" ");
    var plain = text.replace(/<[^>]+>/g, " ");
    var picked = [], ids = {};
    HOWTO.forEach(function (h) {
      if (picked.length >= 3) return;
      if (!h.re.test(plain)) return;
      if (h.only && !h.only.test(plain)) return;
      if (h.not && h.not.test(plain)) return;
      if (h.skipIf && h.skipIf.some(function (k) { return ids[k]; })) return;
      ids[h.id] = true;
      picked.push(h);
    });
    return picked;
  }
  function howtoHtml(h) {
    return '<details class="hub-howto"><summary>따라 하는 방법 · ' + esc(h.title) + '</summary><ol>' +
      h.steps.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("") + "</ol>" +
      (h.note ? '<p class="hub-howto-note">' + esc(h.note) + "</p>" : "") +
      '<p class="hub-howto-base">윈도우 기본 기능 설명입니다. 화면 이름은 Windows 버전에 따라 조금 다를 수 있습니다.</p></details>';
  }

  var seq = 0;
  function enhanceCard(card, ci) {
    if (card.getAttribute("data-hub-steps") === "1") return;
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
          ((/공식 안내|이용자 안내/.test(s.tag)) ? "" : howtoFor(s).map(howtoHtml).join("")) +
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
      card.setAttribute("data-hub-steps", "1");
    } catch (e) { /* 실패해도 원본 목록이 그대로 남는다 */ }
  }

  /* 허브 페이지: 오류 카드마다 변환. 게임 진단 센터 같은 동적 화면은 ITSVC_HubSteps.enhance(요소)를 호출한다. */
  window.ITSVC_HubSteps = {
    enhance: function (root) {
      if (!root) return;
      root.removeAttribute("data-hub-steps");
      enhanceCard(root, "d" + (seq++));
    }
  };
  var cards = document.querySelectorAll(".game-err-card");
  Array.prototype.forEach.call(cards, function (card, ci) { enhanceCard(card, ci); });
})();
