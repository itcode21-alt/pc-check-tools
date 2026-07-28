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
        ["미니덤프 분석", "diagnostic.html#diagnostic-minidump"],
      ],
    },
    {
      href: "tools.html",
      label: "업그레이드·도구",
      children: [
        ["PC 조합 빌더", "pc-builder.html"],
        ["PC 추천받기", "pc-recommendation.html"],
        ["업그레이드 진단", "upgrade.html"],
        ["RAM 증설 확인", "ram-upgrade-checker.html"],
        ["파워 용량 계산", "psu-calculator.html"],
        ["SSD 수명(TBW)", "ssd-tbw-calculator.html"],
        ["모니터 PPI", "monitor-calculator.html"],
        ["미니덤프 분석", "minidump-analyzer.html"],
      ],
    },
    {
      href: "guides.html",
      label: "가이드",
      children: [
        ["증상별 가이드", "guides.html"],
        ["PC 초보자 가이드", "beginner-guide.html"],
        ["진단 명령어", "windows-repair-tools-guide.html"],
        ["이벤트 뷰어 확인", "event-viewer-guide.html"],
        ["전체 오류 코드", "error-codes-index.html"],
        ["BIOS·부팅 순서", "bios-boot-guide.html"],
        ["그래픽 드라이버 재설치", "graphics-driver-guide.html"],
        ["메모리(RAM) 검사", "memory-test-guide.html"],
        ["네트워크 연결 확인", "network-connection-guide.html"],
        ["SSD SMART 건강 확인", "ssd-smart-health-guide.html"],
        ["SSD 교체·추가 설치", "ssd-upgrade-guide.html"],
        ["그래픽카드 업그레이드", "gpu-upgrade-guide.html"],
        ["노트북 업그레이드", "laptop-upgrade-guide.html"],
        ["해결 사례 공유", "community-cases.html"],
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

  const addAffiliateDisclosures = () => {
    const disclosureText = "이 포스팅은 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
    document.querySelectorAll('a[href*="coupang.com"]').forEach((link) => {
      const scope = link.closest(".card, .section, .static-detail-fallback, article") || link.parentElement;
      if (!scope || scope.querySelector(".affiliate-disclosure")) return;
      const oldNote = Array.from(scope.querySelectorAll("p")).find((node) => node.textContent.includes("규격 확인 후 아래 링크로 구매하시면 사이트 운영에 도움이 됩니다."));
      if (oldNote) {
        oldNote.className = "affiliate-disclosure";
        oldNote.textContent = `${disclosureText} 규격 확인 후 구매 링크를 이용해 주세요.`;
        return;
      }
      const note = document.createElement("p");
      note.className = "affiliate-disclosure";
      note.textContent = disclosureText;
      (link.closest(".link-list") || link.parentElement)?.before(note);
    });
  };

  renderNavigation();
  addFooterSitemapLink();
  addAffiliateDisclosures();
  new MutationObserver(addAffiliateDisclosures).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
})();
