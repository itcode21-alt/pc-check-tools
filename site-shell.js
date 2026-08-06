/* 공용 헤더·푸터 삽입 — #site-header/#site-footer가 있는 페이지에서만 동작.
   site.js(내비 드롭다운 강화, data-year 채우기)와 search.js(검색창 동작)가
   이 스크립트보다 나중에 실행되도록 <script> 순서를 지켜야 한다. */
(() => {
  const headerRoot = document.getElementById("site-header");
  if (headerRoot) {
    headerRoot.outerHTML = `
      <a class="skip-link" href="#content">본문 바로가기</a>
      <header class="site-header">
        <div class="brand">
          <a class="brand-mark" href="./" aria-label="홈으로 이동">PC</a>
          <div><h1>PC 윈도우 진단 센터</h1></div>
        </div>
        <nav class="nav" aria-label="주요 메뉴"><a href="./">홈</a><a href="diagnostic.html">진단</a><a href="guides.html">가이드</a><a href="pc-recommendation.html">PC 추천</a></nav>
        <div class="site-search" data-site-search>
          <input type="search" class="site-search-input" placeholder="증상, 오류코드, 게임 오류 검색" aria-label="사이트 검색" data-site-search-input autocomplete="off">
          <div class="site-search-results" data-site-search-results hidden></div>
        </div>
      </header>
    `;
  }

  const footerRoot = document.getElementById("site-footer");
  if (footerRoot) {
    footerRoot.outerHTML = `
      <footer class="site-footer">
        <p>© <span data-year></span> PC 윈도우 진단 센터</p>
        <p class="footer-links"><a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a> · <a href="games-diagnostic.html">게임</a> · <a href="community-cases.html">해결 사례</a> · <a href="contact.html">문의</a></p>
      </footer>
    `;
  }
})();
