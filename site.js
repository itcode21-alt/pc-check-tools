(() => {
  // 모든 정적 페이지의 메뉴 순서와 하위 항목을 한 곳에서 관리합니다.
  // 새 페이지를 메뉴에 추가할 때는 아래 배열에만 넣고, 상단 메뉴 HTML을 개별 수정하지 않습니다.
  const navigation = [
    { href: "index.html", label: "홈" },
    {
      href: "diagnostic.html",
      label: "진단",
      children: [
        ["증상으로 찾기", "diagnostic.html#diagnostic-symptom"],
        ["오류코드로 찾기", "diagnostic.html#diagnostic-code"],
        ["이벤트 로그 분석", "diagnostic.html#diagnostic-event"],
        ["하드웨어 로그 분석", "diagnostic.html#diagnostic-log"],
        ["AI 진단", "diagnostic.html#diagnostic-ai"],
      ],
    },
    {
      href: "tools.html",
      label: "도구",
      children: [
        ["PC 조합 빌더", "pc-builder.html"],
        ["PC 추천받기", "pc-recommendation.html"],
        ["파워 용량 계산", "psu-calculator.html"],
        ["SSD 수명(TBW)", "ssd-tbw-calculator.html"],
        ["백업 저장공간", "backup-storage-calculator.html"],
        ["UPS 용량", "ups-calculator.html"],
        ["NAS·RAID 용량", "raid-calculator.html"],
        ["모니터 PPI", "monitor-calculator.html"],
      ],
    },
    {
      href: "guides.html",
      label: "가이드",
      children: [
        ["증상별 가이드", "guides.html"],
        ["진단 명령어", "windows-repair-tools-guide.html"],
        ["이벤트 뷰어 확인", "event-viewer-guide.html"],
        ["전체 오류 코드", "error-codes-index.html"],
        ["SSD 교체·추가 설치", "ssd-upgrade-guide.html"],
        ["그래픽카드 업그레이드", "gpu-upgrade-guide.html"],
        ["노트북 업그레이드", "laptop-upgrade-guide.html"],
      ],
    },
    { href: "games-diagnostic.html", label: "게임", children: [["게임 오류 진단", "games-diagnostic.html"], ["게임별 오류 모음", "games-diagnostic.html#game-select"]] },
    { href: "news.html", label: "뉴스", children: [["업데이트 이슈", "windows-update-tracker.html"], ["뉴스 전체", "news.html"]] },
    { href: "contact.html", label: "문의" },
  ];

  const currentPage = location.pathname.split("/").pop() || "index.html";
  const pageOf = (href) => new URL(href, location.href).pathname.split("/").pop() || "index.html";
  const isCurrent = (href) => pageOf(href) === currentPage;

  const renderNavigation = () => {
    document.querySelectorAll(".nav").forEach((nav) => {
      nav.innerHTML = navigation.map((item) => {
        if (!item.children) {
          return `<a href="${item.href}"${isCurrent(item.href) ? ' class="is-current" aria-current="page"' : ""}>${item.label}</a>`;
        }

        const hasCurrentChild = isCurrent(item.href) || item.children.some(([, href]) => isCurrent(href));
        const uniqueChildren = item.children.filter(([, href]) => pageOf(href) !== pageOf(item.href));
        const links = [[`${item.label} 홈`, item.href], ...uniqueChildren]
          .map(([label, href]) => `<a href="${href}"${isCurrent(href) ? ' class="is-current" aria-current="page"' : ""}>${label}</a>`)
          .join("");
        return `<details class="nav-dropdown${hasCurrentChild ? " is-current" : ""}"><summary>${item.label}<span aria-hidden="true">⌄</span></summary><div class="nav-dropdown-panel">${links}</div></details>`;
      }).join("");

      nav.addEventListener("toggle", (event) => {
        if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
        nav.querySelectorAll("details[open]").forEach((dropdown) => {
          if (dropdown !== event.target) dropdown.open = false;
        });
      }, true);
    });
    document.addEventListener("click", (event) => {
      document.querySelectorAll(".nav details[open]").forEach((dropdown) => {
        if (!dropdown.closest(".nav")?.contains(event.target)) dropdown.open = false;
      });
    });
  };

  const addFooterSitemapLink = () => {
    document.querySelectorAll(".footer-links").forEach((footerLinks) => {
      if (Array.from(footerLinks.querySelectorAll("a")).some((link) => pageOf(link.href) === "sitemap.html")) return;
      footerLinks.insertAdjacentHTML("beforeend", ' · <a href="sitemap.html">사이트맵</a>');
    });
  };

  renderNavigation();
  addFooterSitemapLink();
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
})();
