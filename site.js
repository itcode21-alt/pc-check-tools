(() => {
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
