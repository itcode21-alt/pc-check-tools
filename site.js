(() => {
  // 정적 페이지마다 반복된 메뉴를 한 곳에서 보완한다. 새 메뉴는 모든 페이지에 같은 순서로 추가된다.
  document.querySelectorAll(".nav").forEach((nav) => {
    const existingPages = new Set(Array.from(nav.querySelectorAll("a")).map((link) => new URL(link.href, location.href).pathname.split("/").pop() || "index.html"));
    const contactLink = Array.from(nav.querySelectorAll("a")).find((link) => (new URL(link.href, location.href).pathname.split("/").pop() || "index.html") === "contact.html");
    [
      { href: "news.html", label: "뉴스" },
      { href: "sitemap.html", label: "사이트맵" },
    ].forEach((item) => {
      if (existingPages.has(item.href)) return;
      const link = document.createElement("a");
      link.href = item.href;
      link.textContent = item.label;
      nav.insertBefore(link, contactLink || null);
    });
  });

  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = new Date().getFullYear();
  });

  const currentPage = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav a").forEach((link) => {
    const linkPage = new URL(link.href, location.href).pathname.split("/").pop() || "index.html";
    if (linkPage === currentPage) {
      link.classList.add("is-current");
      link.setAttribute("aria-current", "page");
    }
  });
})();
