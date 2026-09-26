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
        ["PSU 테스터기 사용법", "psu-tester-guide.html"],
        ["UPS 용량 계산", "ups-calculator.html"],
        ["SSD 수명(TBW)", "ssd-tbw-calculator.html"],
        ["RAID 용량 계산", "raid-calculator.html"],
        ["백업 용량 계산", "backup-storage-calculator.html"],
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
        { group: "진단 도구" },
        ["진단 명령어", "windows-repair-tools-guide.html"],
        ["이벤트 뷰어 확인", "event-viewer-guide.html"],
        ["전체 오류 코드", "error-codes-index.html"],
        { group: "부품 업그레이드 가이드" },
        ["BIOS·부팅 순서", "bios-boot-guide.html"],
        ["그래픽 드라이버 재설치", "graphics-driver-guide.html"],
        ["메모리(RAM) 검사", "memory-test-guide.html"],
        ["네트워크 연결 확인", "network-connection-guide.html"],
        ["SSD SMART 건강 확인", "ssd-smart-health-guide.html"],
        ["SSD 교체·추가 설치", "ssd-upgrade-guide.html"],
        ["그래픽카드 업그레이드", "gpu-upgrade-guide.html"],
        ["노트북 업그레이드", "laptop-upgrade-guide.html"],
        { group: "커뮤니티" },
        ["해결 사례 공유", "community-cases.html"],
      ],
    },
    {
      href: "games-diagnostic.html",
      label: "게임",
      children: [
        { group: "인기 게임" },
        ["발로란트", "game-valorant.html"],
        ["리그 오브 레전드", "game-lol.html"],
        ["배틀그라운드", "game-battlegrounds.html"],
        ["오버워치 2", "game-overwatch2.html"],
        ["로스트아크", "game-lostark.html"],
        ["메이플스토리", "game-maplestory.html"],
        ["패스 오브 엑자일 2", "game-poe2.html"],
        ["아이온2", "game-aion2.html"],
        ["스타크래프트2", "game-starcraft2.html"],
        ["스페셜포스", "game-specialforce.html"],
        ["리니지 클래식", "game-lineageclassic.html"],
        ["로블록스", "game-roblox.html"],
      ],
    },
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

        const hasCurrentChild = isCurrent(item.href) || item.children.some((child) => Array.isArray(child) && isCurrent(child[1]));
        const uniqueChildren = item.children.filter((child) => !Array.isArray(child) || pageOf(child[1]) !== pageOf(item.href));
        const links = [[`${item.label} 홈`, item.href], ...uniqueChildren]
          .map((child) => {
            if (!Array.isArray(child)) return `<span class="nav-dropdown-group">${child.group}</span>`;
            const [label, href] = child;
            return `<a href="${href}"${isCurrent(href) ? ' class="is-current" aria-current="page"' : ""}>${label}</a>`;
          })
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

  // 모바일 폭에서 상단 메뉴 항목이 늘어나며 헤더가 여러 줄로 길게 줄바꿈되던 문제를
  // 줄이기 위해, 좁은 화면에서는 메뉴를 햄버거 토글 버튼 뒤로 접는다. 데스크톱에서는
  // CSS(@media)가 버튼을 숨기고 .nav를 항상 펼쳐 보여주므로 동작에 영향이 없다.
  const setupMobileNavToggle = () => {
    document.querySelectorAll(".site-header").forEach((header) => {
      const nav = header.querySelector(".nav");
      if (!nav || header.querySelector(".nav-toggle")) return;

      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-toggle";
      toggle.setAttribute("aria-label", "메뉴 열기");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"></span>';
      nav.before(toggle);

      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
      });
    });

    const closeAllMobileNavs = () => {
      document.querySelectorAll(".nav.is-open").forEach((nav) => {
        nav.classList.remove("is-open");
        const toggle = nav.closest(".site-header")?.querySelector(".nav-toggle");
        if (toggle) {
          toggle.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.setAttribute("aria-label", "메뉴 열기");
        }
      });
    };

    document.addEventListener("click", (event) => {
      document.querySelectorAll(".nav.is-open").forEach((nav) => {
        if (!nav.closest(".site-header")?.contains(event.target)) closeAllMobileNavs();
      });
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAllMobileNavs();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 680) closeAllMobileNavs();
    });
  };

  const addFooterSitemapLink = () => {
    document.querySelectorAll(".footer-links").forEach((footerLinks) => {
      if (Array.from(footerLinks.querySelectorAll("a")).some((link) => pageOf(link.href) === "sitemap.html")) return;
      footerLinks.insertAdjacentHTML("beforeend", ' · <a href="sitemap.html">사이트맵</a>');
    });
  };

  // 카카오톡 공유는 카카오 디벨로퍼스에 앱을 등록하고 JS 키를 발급받아야 해서
  // (사이트 소유자 계정으로만 가능한 외부 서비스 가입) 여기서는 대신 브라우저
  // 표준 기능만으로 구현한다: 모바일 등 지원 브라우저에서는 navigator.share()로
  // OS 공유 시트를 띄우면 카카오톡이 설치돼 있으면 그 목록에 자동으로 뜨고,
  // 지원하지 않는 환경(주로 데스크톱)에서는 링크 복사 버튼만 남긴다.
  const EXCLUDED_SHARE_PAGES = new Set(["404.html", "admin.html", "admin-local.html", "community-cases-admin.html"]);
  const addShareBar = () => {
    if (EXCLUDED_SHARE_PAGES.has(currentPage)) return;
    document.querySelectorAll(".site-footer").forEach((footer) => {
      if (footer.previousElementSibling?.classList?.contains("share-bar")) return;
      const supportsNativeShare = typeof navigator.share === "function";
      const bar = document.createElement("div");
      bar.className = "share-bar";
      bar.innerHTML = `
        <span class="share-bar-label">이 페이지가 도움이 되셨다면 공유해보세요</span>
        ${supportsNativeShare ? '<button type="button" class="share-btn" data-share-native>📤 공유하기</button>' : ""}
        <button type="button" class="share-btn" data-share-copy>🔗 링크 복사</button>
      `;
      footer.before(bar);

      bar.querySelector("[data-share-native]")?.addEventListener("click", () => {
        navigator.share({ title: document.title, url: location.href }).catch(() => {});
      });
      const copyBtn = bar.querySelector("[data-share-copy]");
      copyBtn?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(location.href);
        } catch {
          const helper = document.createElement("textarea");
          helper.value = location.href;
          helper.style.position = "fixed";
          helper.style.opacity = "0";
          document.body.append(helper);
          helper.select();
          document.execCommand("copy");
          helper.remove();
        }
        const original = copyBtn.textContent;
        copyBtn.textContent = "✅ 복사됨";
        copyBtn.classList.add("is-copied");
        setTimeout(() => {
          copyBtn.textContent = original;
          copyBtn.classList.remove("is-copied");
        }, 1800);
      });
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
      // 문구는 구매 링크 "아래"에 와야 한다(운영자 요청). 링크 목록이 있으면
      // 목록 다음에, 없으면 링크가 들어 있는 문단 다음에 붙인다.
      (link.closest(".link-list") || link.parentElement)?.after(note);
    });
  };

  renderNavigation();
  setupMobileNavToggle();
  addFooterSitemapLink();
  addShareBar();
  addAffiliateDisclosures();
  new MutationObserver(addAffiliateDisclosures).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = new Date().getFullYear(); });
})();
