import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const today = "2026-07-16";

const context = {};
vm.createContext(context);
let gamesSrc = fs.readFileSync(path.join(root, "games-data.js"), "utf8");
gamesSrc = gamesSrc
  .replace("const gameErrors = ", "globalThis.gameErrors = ")
  .replace("const gameBrands = ", "globalThis.gameBrands = ");
vm.runInContext(gamesSrc, context);
const gameErrors = context.gameErrors;
const gameBrands = context.gameBrands;

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const formatSolution = (text) => escapeHtml(text)
  .replace(/\n/g, "<br>")
  .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

// slug -> extra editorial copy (intro + FAQ). Written per game, not derived from raw data,
// so each hub page reads as an edited guide rather than a template dump.
const gameCopy = {
  valorant: {
    intro: "발로란트는 라이엇 게임즈의 커널 레벨 안티치트 'Vanguard'가 부팅 시점부터 함께 동작하기 때문에, 다른 게임보다 실행 오류가 보안 프로그램이나 시스템 드라이버와 얽히는 경우가 많습니다. 아래는 자주 보고되는 오류의 원인과 해결 순서입니다.",
    faqs: [
      { q: "Vanguard를 삭제하면 오류가 사라지나요?", a: "Vanguard는 발로란트 실행에 필수인 안티치트 드라이버라 삭제하면 게임 자체가 실행되지 않습니다. 오류가 있다면 삭제보다 재설치로 손상된 드라이버를 복구하는 것이 올바른 접근입니다." },
      { q: "재설치나 예외 추가 후에는 꼭 재부팅해야 하나요?", a: "Vanguard 드라이버는 부팅 시점에 커널 레벨로 로드되므로, 재설치나 서비스 상태 변경 후에는 재부팅해야 변경 사항이 실제로 적용되는 경우가 많습니다." },
      { q: "백신을 꺼두는 게 안전한가요?", a: "원인 확인을 위해 일시적으로 끄는 것은 괜찮지만, 확인이 끝나면 반드시 다시 켜고 Riot Client·Vanguard를 예외 목록에 추가하는 방식으로 바꾸는 것을 권장합니다." }
    ]
  },
  lol: {
    intro: "리그 오브 레전드는 클라이언트와 실제 게임 실행 파일이 분리되어 있어, 오류가 클라이언트 단계·패치 단계·인게임 단계 중 어디에서 발생했는지 먼저 구분하는 것이 점검의 시작입니다.",
    faqs: [
      { q: "클라이언트만 재설치하면 되나요, 전체 재설치가 필요한가요?", a: "클라이언트 로그인·업데이트 단계에서만 문제가 있다면 클라이언트 재설치로 충분한 경우가 많습니다. 인게임 크래시까지 함께 발생한다면 게임 파일 전체 재설치나 복구를 함께 진행하세요." },
      { q: "그래픽 드라이버가 최신인데도 크래시가 나는 이유는 무엇인가요?", a: "최신 드라이버가 특정 게임 버전과 호환성 문제를 일으키는 경우가 있습니다. 최신 버전과 제조사가 안정 버전으로 안내하는 버전을 함께 비교해보는 것이 안전합니다." },
      { q: "핫픽스 직후에만 발생하는 오류는 어떻게 확인하나요?", a: "패치 노트에서 알려진 이슈(Known Issues)를 먼저 확인하고, 같은 증상을 보고하는 다른 이용자가 있는지 공식 커뮤니티에서 검색해보는 것이 빠릅니다." }
    ]
  },
  lostark: {
    intro: "로스트아크는 온라인 접속 부하와 그래픽 렌더링 부하가 동시에 크기 때문에, 접속 오류(서버·네트워크)와 실행 중 크래시(그래픽·드라이버)를 구분해서 접근해야 원인을 빠르게 좁힐 수 있습니다.",
    faqs: [
      { q: "Connection Timeout이 뜨면 항상 제 인터넷 문제인가요?", a: "아닙니다. 서버 점검이나 특정 시간대 접속자 폭주로도 같은 메시지가 나타날 수 있습니다. 공식 공지의 점검 일정을 먼저 확인한 뒤 개인 네트워크 문제인지 구분하세요." },
      { q: "그래픽 옵션을 낮추면 크래시가 줄어드나요?", a: "그래픽 드라이버 충돌로 인한 크래시라면 옵션을 낮춰도 근본 원인은 남아있을 수 있습니다. 옵션 조정과 함께 그래픽 드라이버를 안정 버전으로 재설치해 비교해보세요." }
    ]
  },
  battlegrounds: {
    intro: "배틀그라운드는 권장 사양을 충족해도 특정 맵이나 교전 구간에서 프레임 드랍이 발생하는 경우가 많아, 하드웨어 성능 부족보다 설정·드라이버 조합 문제인 경우가 흔합니다.",
    faqs: [
      { q: "권장 사양을 넘는데도 렉이 걸리는 이유는 무엇인가요?", a: "맵 로딩 방식, 백그라운드 프로세스, 스토리지 속도, 네트워크 지연이 복합적으로 작용하는 경우가 많습니다. 그래픽 옵션 하나씩 조정하며 어떤 설정이 영향을 주는지 비교해보세요." },
      { q: "로고 화면에서 크래시가 나면 그래픽카드 문제인가요?", a: "그래픽카드 자체보다 드라이버 버전 호환성이나 게임 파일 손상이 더 흔한 원인입니다. 파일 무결성 검사와 드라이버 재설치를 먼저 시도해보세요." }
    ]
  },
  blackdesert: {
    intro: "검은사막은 로딩 화면 멈춤이 OneDrive 동기화 같은 외부 소프트웨어와 얽히는 특이한 사례가 보고되어, 게임 자체보다 시스템 환경 점검이 우선인 경우가 있습니다.",
    faqs: [
      { q: "OneDrive가 왜 게임 로딩에 영향을 주나요?", a: "게임 폴더가 OneDrive 동기화 대상 경로에 포함되어 있으면, 파일 접근 시점에 동기화 프로세스와 충돌해 로딩이 지연되거나 멈출 수 있습니다. 게임 폴더를 동기화 제외 목록에 추가하면 개선되는 사례가 있습니다." },
      { q: "혼잡 지역에서만 프레임이 떨어지는 이유는 무엇인가요?", a: "다른 캐릭터와 이펙트가 몰리는 구간은 CPU·GPU 부하가 급격히 늘어나는 지점입니다. 그래픽 옵션 중 캐릭터·이펙트 표시 관련 항목을 우선 낮춰 비교해보세요." }
    ]
  },
  maplestory: {
    intro: "메이플스토리는 넥슨이 제공하는 자체 에러복구프로그램이 따로 있어, 수동으로 파일을 손대기보다 이 도구를 먼저 활용하는 것이 권장되는 경우가 많습니다.",
    faqs: [
      { q: "에러복구프로그램은 어디서 받나요?", a: "넥슨 공식 고객센터 또는 메이플스토리 공식 홈페이지의 다운로드·지원 항목에서 받을 수 있습니다. 실행 오류가 있다면 재설치보다 이 프로그램을 먼저 실행해보는 것이 빠릅니다." },
      { q: "무선랜에서만 접속이 튕기는 이유는 무엇인가요?", a: "무선 연결은 유선보다 순간적인 신호 끊김에 취약해 패킷 손실이 잦습니다. 가능하다면 유선 연결로 재현 여부를 비교하고, 무선 공유기의 절전 설정도 함께 확인하세요." }
    ]
  },
  dfo: {
    intro: "던전앤파이터는 오래된 클라이언트 구조상 비주얼 C++ 같은 런타임 라이브러리와의 호환성 문제가 실행 오류의 흔한 원인으로 보고됩니다.",
    faqs: [
      { q: "실행 후 검은 화면에서 멈추면 그래픽카드 문제인가요?", a: "그래픽카드 자체보다 호환 모드 설정이나 오래된 런타임 라이브러리 문제가 더 흔합니다. 게임 실행 파일의 호환성 설정과 런타임 재설치를 먼저 확인하세요." },
      { q: "런타임 오류는 게임을 재설치하면 해결되나요?", a: "게임 재설치보다 해당 런타임 라이브러리(Visual C++ 재배포 패키지 등)를 최신 버전으로 재설치하는 것이 더 직접적인 해결책인 경우가 많습니다." }
    ]
  },
  overwatch2: {
    intro: "오버워치 2는 배틀넷 클라이언트를 경유해 실행되기 때문에, 게임 자체의 문제인지 배틀넷 연결 문제인지부터 구분하는 것이 점검의 첫 단계입니다.",
    faqs: [
      { q: "배틀넷은 정상인데 게임만 연결이 안 되는 이유는 무엇인가요?", a: "배틀넷 로그인과 게임 서버 접속은 별도 단계입니다. 게임 자체 서버 점검이나 방화벽이 게임 실행 파일만 차단하는 경우가 흔하니, 방화벽 예외 목록을 확인하세요." },
      { q: "로딩 화면에서 멈추면 항상 서버 문제인가요?", a: "서버 문제 외에도 셰이더 캐시 손상이나 로컬 파일 손상으로 같은 증상이 나타날 수 있습니다. 공식 서버 상태를 먼저 확인한 뒤 게임 파일 검사를 진행하세요." }
    ]
  },
  diablo4: {
    intro: "디아블로 4는 상시 온라인 연결이 필요한 구조라, 로그인 실패를 반복 시도하는 것이 오히려 계정 잠금으로 이어지는 경우가 있어 주의가 필요합니다.",
    faqs: [
      { q: "로그인이 안 될 때 계속 재시도해도 되나요?", a: "짧은 시간에 반복 로그인을 시도하면 보안 시스템이 이를 이상 행동으로 인식해 계정을 일시 잠글 수 있습니다. 몇 차례 실패했다면 시간을 두고 공식 서버 상태부터 확인하세요." },
      { q: "Fenris 오류는 하드웨어 문제인가요?", a: "Fenris 오류는 대부분 응용 프로그램 충돌이나 파일 손상과 관련이 있으며, 하드웨어 고장을 직접 의미하지는 않습니다. 게임 파일 검사와 재설치를 먼저 시도해보세요." }
    ]
  }
};

const buildFaqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a }
  }))
});

const renderErrorSection = (error) => {
  const causes = (error.causes || []).map((c) => `          <li>${escapeHtml(c)}</li>`).join("\n");
  const solutions = (error.solutions || []).map((s) => `          <li>${formatSolution(s)}</li>`).join("\n");
  const refs = [];
  if (error.relatedErrorCodePage) {
    refs.push(`<a href="${escapeHtml(error.relatedErrorCodePage)}">Windows 드라이버·설치 쪽 원인까지 확인하기 →</a>`);
  }
  if (error.officialSource) {
    refs.push(`<a href="${escapeHtml(error.officialSource.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(error.officialSource.title)}</a>`);
  }
  const communityItems = (error.communityReports || []).map((r) =>
    `<li><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">커뮤니티 사례 보기</a> — ${escapeHtml(r.summary)}</li>`
  ).join("\n");

  return `
      <h3 id="${escapeHtml(error.id)}">${escapeHtml(error.title)} · ${escapeHtml(error.errorCode)}</h3>
      <p class="eyebrow">${escapeHtml(error.category || "")}</p>
      <p>${escapeHtml(error.overview)}</p>
      <h4>가능한 원인</h4>
      <ul class="mini-list">
${causes}
      </ul>
      <h4>점검 순서</h4>
      <ol class="mini-list">
${solutions}
      </ol>
      ${refs.length ? `<h4>참고 자료</h4>\n      <div class="link-list">${refs.join("")}</div>` : ""}
      ${communityItems ? `<h4>커뮤니티에서 확인된 사례</h4>\n      <ul class="mini-list">\n${communityItems}\n      </ul>` : ""}`;
};

for (const brand of gameBrands) {
  const errors = gameErrors.filter((e) => e.game === brand.name);
  if (errors.length === 0) continue;
  const copy = gameCopy[brand.id];
  if (!copy) throw new Error(`게임 소개/FAQ 콘텐츠가 없습니다: ${brand.id}`);

  const url = `https://itsvc.co.kr/game-${brand.id}.html`;
  const title = `${brand.name} 오류 모음 | 원인과 해결 방법`;
  const description = `${brand.name}에서 자주 발생하는 오류 ${errors.length}가지의 원인과 단계별 해결 방법을 정리합니다.`;

  const techArticleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: `${brand.name} 오류 모음과 점검 순서`,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "ko-KR",
    dateModified: today,
    author: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: "https://itsvc.co.kr/about.html" },
    publisher: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: "https://itsvc.co.kr/" }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://itsvc.co.kr/" },
      { "@type": "ListItem", position: 2, name: "게임 오류 진단 센터", item: "https://itsvc.co.kr/games-diagnostic.html" },
      { "@type": "ListItem", position: 3, name: brand.name, item: url }
    ]
  };
  const faqSchema = buildFaqSchema(copy.faqs);

  const toc = errors.map((e) => `          <li><a href="#${escapeHtml(e.id)}">${escapeHtml(e.title)} (${escapeHtml(e.errorCode)})</a></li>`).join("\n");
  const sections = errors.map(renderErrorSection).join("\n");
  const faqList = copy.faqs.map((f) => `          <li><strong>${escapeHtml(f.q)}</strong> ${escapeHtml(f.a)}</li>`).join("\n");

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="itcode21-alt">
  <link rel="canonical" href="${url}">
  <script type="application/ld+json">${JSON.stringify(techArticleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="https://itsvc.co.kr/assets/pc-check-hero.jpg">
  <meta property="og:image:alt" content="PC 상태를 점검하는 진단 화면 일러스트">
  <link rel="stylesheet" href="style.css?v=editorial-refresh-20260716">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9907102461716567" crossorigin="anonymous"></script>
</head>
<body>
  <a class="skip-link" href="#content">본문 바로가기</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="index.html" aria-label="홈으로 이동">PC</a><div><p class="eyebrow">게임 오류</p><h1>${escapeHtml(brand.name)}</h1></div></div>
    <nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html">가이드</a><a href="games-diagnostic.html" aria-current="page">게임</a><a href="contact.html">문의</a></nav>
  </header>
  <main id="content" class="page article">
    <article class="section">
      <p class="eyebrow">GAME ERROR FIX · ${escapeHtml(brand.developer)}</p>
      <h2>${escapeHtml(brand.name)} 오류 모음 — 원인과 해결 방법</h2>
      <p class="lead">${escapeHtml(copy.intro)}</p>
      <h3>바로 이동</h3>
      <ul class="mini-list">
${toc}
      </ul>
${sections}
      <h3>자주 묻는 질문</h3>
      <ul class="mini-list">
${faqList}
      </ul>
      <p class="muted">최종 검토일: ${today}</p>
      <p><a href="games-diagnostic.html?game=${escapeHtml(brand.id)}">진단 도구에서 ${escapeHtml(brand.name)} 오류 검색하기</a></p>
    </article>
  </main>
  <footer class="site-footer">
    <p>© <span data-year></span> PC 윈도우 진단 센터</p>
    <p class="footer-links"><a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a> · <a href="games-diagnostic.html">게임</a> · <a href="contact.html">문의</a></p>
  </footer>
  <script defer src="site.js?v=site-shell-20260711"></script>
</body>
</html>
`;

  const file = path.join(root, `game-${brand.id}.html`);
  fs.writeFileSync(file, html);
  console.log(`생성 완료: game-${brand.id}.html (오류 ${errors.length}개)`);
}
