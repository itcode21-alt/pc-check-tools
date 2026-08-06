/* 검색 핵심 로직 공유 모듈 — 헤더 검색창(search.js)과 전체 검색 결과 페이지
   (search-results.html)가 동일한 매칭·정렬 규칙을 쓰도록 분리했다.
   search-index.js보다 뒤, search.js/search-results.html보다 앞에 로드할 것. */
window.siteSearchQuery = (() => {
  const normalize = (value) => String(value || "")
    .toLowerCase()
    .replace(/[._/·,:()[\]-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // "부팅이 안되요"/"충전이 안돼요"처럼 구어체로 검색해도 색인에 쓰인
  // "안됨" 표기와 매칭되도록 흔한 활용형을 정규화한다. 구체적인 형태부터
  // 순서대로 치환해야 넓은 패턴이 먼저 먹어치우지 않는다.
  const COLLOQUIAL_MAP = [
    [/안\s?되나요/g, "안됨"],
    [/안\s?돼나요/g, "안됨"],
    [/안\s?되네요/g, "안됨"],
    [/안\s?됩니다/g, "안됨"],
    [/안\s?되요/g, "안됨"],
    [/안\s?돼요/g, "안됨"],
    [/안\s?되고/g, "안됨"],
    [/안\s?돼/g, "안됨"],
    [/안\s?되/g, "안됨"],
  ];
  const applyColloquial = (value) => COLLOQUIAL_MAP.reduce((acc, [re, rep]) => acc.replace(re, rep), value);

  // 조사가 붙은 검색어("부팅이", "화면을")도 매칭되도록, 토큰 끝의 흔한
  // 조사를 뗀 변형도 함께 시도한다. 긴 조사부터 검사해야 짧은 조사가
  // 잘못 먼저 잘려나가지 않는다(예: "부터"를 "터"보다 먼저 검사).
  const PARTICLES = ["에서", "부터", "까지", "이랑", "하고", "으로", "에게", "한테", "보다", "마저", "조차", "이나", "은", "는", "이", "가", "을", "를", "도", "만", "의", "에", "로", "과", "와"]
    .sort((a, b) => b.length - a.length);
  const stripParticle = (token) => {
    for (const p of PARTICLES) {
      if (token.length > p.length + 1 && token.endsWith(p)) return token.slice(0, -p.length);
    }
    return null;
  };

  // query와 index를 받아 관련도 점수 내림차순으로 정렬된 전체 매칭 결과를
  // 반환한다(개수 제한 없음 — 몇 개만 쓸지는 호출하는 쪽이 정한다).
  return function siteSearchQuery(query, index) {
    const rawTokens = normalize(applyColloquial(query)).split(" ").filter(Boolean);
    if (!rawTokens.length) return [];
    const tokenVariants = rawTokens.map((t) => {
      const stripped = stripParticle(t);
      return stripped ? [t, stripped] : [t];
    });
    const scored = [];
    for (const item of index) {
      const title = normalize(item.t);
      const searchable = normalize(`${item.t} ${item.k}`);
      let ok = true;
      let score = 0;
      for (const variants of tokenVariants) {
        let best = -1;
        for (const v of variants) {
          if (title === v) best = Math.max(best, 100);
          else if (title.startsWith(v)) best = Math.max(best, 50);
          else if (title.includes(v)) best = Math.max(best, 20);
          else if (searchable.includes(v)) best = Math.max(best, 5);
        }
        if (best < 0) { ok = false; break; }
        score += best;
      }
      if (ok) scored.push({ item, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.item);
  };
})();
