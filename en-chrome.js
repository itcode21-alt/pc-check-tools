// 영문판(en/) 공통 헤더: 한국어 페이지의 site.js가 하는 일(고정 브랜드, 드롭다운 메뉴, 모바일 햄버거)을 영문 전용으로 가볍게 한다.
// (영문 방문자에게는 출장·원격 지원과 카카오톡 문의를 보여주지 않는다.)
// 메뉴 항목은 아래 navigation 한 곳에서만 관리한다. 정적 HTML의 <nav class="nav">는 스크립트가 없을 때의 대체이며 바꾸지 않는다.
(() => {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const brand = header.querySelector(".brand");
  if (brand && !brand.querySelector(".brand-name")) {
    const home = brand.querySelector(".brand-mark")?.getAttribute("href") || "/en/";
    brand.querySelector("h1")?.classList.add("brand-title-seo");
    brand.querySelector(".eyebrow")?.classList.add("brand-title-seo");
    brand.insertAdjacentHTML("beforeend", `<a class="brand-name" href="${home}"><span class="brand-name-main">PC Windows Diagnostic Center</span><span class="brand-sub">IT Panda</span></a>`);
  }

  const navigation = [
    { href: "/en/", label: "Event ID guide" },
    {
      label: "Self-check",
      children: [
        ["Storage & data", "/en/pc-storage-check.html"],
        ["Input & sound", "/en/pc-input-check.html"],
        ["Internet", "/en/pc-network-check.html"],
        ["Slow & noisy PC", "/en/pc-slow-check.html"],
        ["Screen", "/en/pc-display-check.html"],
        ["PC won't turn on", "/en/pc-boot-check.html"],
        ["Windows & programs", "/en/pc-software-check.html"],
      ],
    },
    {
      label: "Tools",
      children: [
        ["Event log analyzer", "/en/event-log-analyzer.html"],
        ["SSD health check", "/en/ssd-health-check.html"],
      ],
    },
    { href: "/", label: "한국어 사이트", ko: true },
  ];

  const here = location.pathname.replace(/index\.html$/, "");
  const isCurrent = (href) => new URL(href, location.href).pathname.replace(/index\.html$/, "") === here;
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const link = (href, label, extra = "") => `<a href="${href}"${extra}${isCurrent(href) ? ' class="is-current" aria-current="page"' : ""}>${esc(label)}</a>`;

  const nav = header.querySelector(".nav");
  if (nav) {
    nav.innerHTML = navigation.map((item) => {
      if (!item.children) return link(item.href, item.label, item.ko ? ' hreflang="ko" lang="ko"' : "");
      const hasCurrent = item.children.some((c) => isCurrent(c[1]));
      const links = item.children.map((c) => link(c[1], c[0])).join("");
      return `<details class="nav-dropdown${hasCurrent ? " is-current" : ""}"><summary>${esc(item.label)}<span aria-hidden="true">⌄</span></summary><div class="nav-dropdown-panel">${links}</div></details>`;
    }).join("");

    // 한 번에 하나의 드롭다운만 열고, 바깥을 누르면 닫는다.
    nav.addEventListener("toggle", (event) => {
      if (!(event.target instanceof HTMLDetailsElement) || !event.target.open) return;
      nav.querySelectorAll("details[open]").forEach((d) => { if (d !== event.target) d.open = false; });
    }, true);
    document.addEventListener("click", (event) => {
      nav.querySelectorAll("details[open]").forEach((d) => { if (!d.contains(event.target)) d.open = false; });
    });

    // 모바일: 메뉴를 햄버거 버튼 뒤로 접는다(한국어 페이지와 같은 .nav-toggle 스타일).
    if (!header.querySelector(".nav-toggle")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-toggle";
      toggle.setAttribute("aria-label", "Open menu");
      toggle.setAttribute("aria-expanded", "false");
      toggle.innerHTML = '<span class="nav-toggle-icon" aria-hidden="true"></span>';
      nav.before(toggle);
      const close = () => {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      };
      toggle.addEventListener("click", () => {
        const open = nav.classList.toggle("is-open");
        toggle.classList.toggle("is-open", open);
        toggle.setAttribute("aria-expanded", String(open));
        toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      });
      document.addEventListener("click", (event) => {
        if (nav.classList.contains("is-open") && !header.contains(event.target)) close();
        if (event.target.closest && event.target.closest(".nav a[href]")) {
          close();
          nav.querySelectorAll("details[open]").forEach((d) => d.removeAttribute("open"));
        }
      });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") close(); });
      window.addEventListener("resize", () => { if (window.innerWidth > 680) close(); });
    }
  }
})();
