import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root, "data.js"), "utf8"), context);
const data = context.window.SITE_DATA;

const escapeHtml = (value) => String(value || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const addAuthorMeta = (html) => html.includes('name="author"')
  ? html
  : html.replace("  <link rel=\"canonical\"", "  <meta name=\"author\" content=\"itcode21-alt\">\n  <link rel=\"canonical\"");

const addArticleSchema = (html, { headline, description, url }) => {
  if (html.includes('data-generated-article-schema')) return html;
  const schema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "ko-KR",
    dateModified: "2026-07-13",
    author: {
      "@type": "Organization",
      name: "PC 윈도우 진단 센터",
      url: "https://itsvc.co.kr/about.html"
    },
    publisher: {
      "@type": "Organization",
      name: "PC 윈도우 진단 센터",
      url: "https://itsvc.co.kr/"
    }
  };
  const block = `  <script type="application/ld+json" data-generated-article-schema>\n    ${JSON.stringify(schema)}\n  </script>\n`;
  if (html.includes("  <link rel=\"stylesheet\"")) {
    return html.replace("  <link rel=\"stylesheet\"", `${block}  <link rel=\"stylesheet\"`);
  }
  return html.replace("</head>", `\n${block}</head>`);
};

const symptomFallback = (symptom, details) => {
  const intro = (details.intro || []).slice(0, 3).map((item) => `        <p>${escapeHtml(item)}</p>`).join("\n");
  const warnings = (details.warnings || []).map((item) => `          <li>${escapeHtml(item)}</li>`).join("\n");
  const checks = (details.checks || []).map((item) => `          <li><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.why)} ${escapeHtml(item.how)}</li>`).join("\n");
  const deeper = (details.deeper || []).map((item) => `        <h4>${escapeHtml(item.heading)}</h4>\n        <p>${escapeHtml(item.text)}</p>`).join("\n");
  const decisions = (details.decision || []).map((item) => `          <li><strong>${escapeHtml(item.heading)}</strong> — ${escapeHtml(item.text)}</li>`).join("\n");
  const mistakes = (details.mistakes || []).map((item) => `          <li>${escapeHtml(item)}</li>`).join("\n");
  const faq = (details.faq || []).slice(0, 2).map((item) => `          <li><strong>${escapeHtml(item.q)}</strong> ${escapeHtml(item.a)}</li>`).join("\n");
  return `
      <!-- STATIC_FALLBACK_START -->
      <article class="static-detail-fallback">
        <p class="eyebrow">${escapeHtml(details.badge || "증상별 가이드")}</p>
        <h2>${escapeHtml(symptom.title)} 원인과 점검 순서</h2>
        <p class="lead">${escapeHtml(symptom.summary)}</p>
${intro}
        ${warnings ? `<h3>이 가이드가 필요한 상황</h3>\n        <ul class="mini-list">\n${warnings}\n        </ul>` : ""}
        <h3>먼저 확인할 항목</h3>
        <ol class="mini-list">
${checks}
        </ol>
        ${deeper ? `<h3>원인을 더 정확히 나누는 방법</h3>\n${deeper}` : ""}
        ${decisions ? `<h3>확인 결과에 따른 다음 단계</h3>\n        <ul class="mini-list">\n${decisions}\n        </ul>` : ""}
        ${mistakes ? `<h3>피해야 할 실수</h3>\n        <ul class="mini-list">\n${mistakes}\n        </ul>` : ""}
        <h3>자주 묻는 질문</h3>
        <ul class="mini-list">
${faq}
        </ul>
        <p><a href="diagnostic.html">진단 도구에서 증상과 오류 코드 함께 확인하기</a></p>
      </article>
      <!-- STATIC_FALLBACK_END -->
    `;
};

const getCodeTopic = (code) => {
  const value = String(code.code || "").toUpperCase();
  const text = `${code.title} ${code.summary}`;
  if (/WHEA|MACHINE_CHECK|UNCORRECTABLE|하드웨어/i.test(text) || ["0X00000124", "0X0000009C"].includes(value)) return "hardware";
  if (/0X00000116|0X000000EA/.test(value)) return "graphics";
  if (/0X0000001A|0X00000050|0X00000019|0X000000BE|0X000000D8/.test(value)) return "memory";
  if (/0X0000007B|0X0000007A|0X00000077|0X00000024|0X000000ED/.test(value)) return "storage";
  if (/0X000000D1|0X0000009F|0X000000C2|0X000000C4|0X000000F7/.test(value)) return "driver";
  if (/0X800F|0X8007|0XC1900101/.test(value)) return "update";
  if (/0XC000021A|0XC000000F|0XC0000225/.test(value)) return "boot";
  return "general";
};

const topicCopy = {
  hardware: {
    interpretation: "이 계열은 CPU, 메모리, PCIe 장치, 메인보드 전원 또는 냉각처럼 시스템 안정성에 영향을 주는 영역에서 나타날 수 있습니다. 코드 하나로 부품을 확정하지 말고 기본 클럭 상태와 발생 작업을 비교해야 합니다.",
    caution: "오버클럭과 XMP·EXPO를 기본값으로 되돌리고, 과열·타는 냄새·반복 재부팅이 있으면 장시간 부하 테스트를 중단하세요.",
    next: "기본 설정에서도 반복되면 온도와 WHEA 이벤트를 기록한 뒤 CPU, RAM, GPU를 한 번에 바꾸지 말고 한 영역씩 교차 점검하세요."
  },
  graphics: {
    interpretation: "그래픽 계열 정지는 드라이버 복구 실패뿐 아니라 GPU 온도, 보조전원, 오버클럭, 특정 앱의 하드웨어 가속에서도 발생합니다. 화면이 돌아왔는지와 시스템 전체가 재부팅됐는지를 먼저 구분하세요.",
    caution: "드라이버를 여러 버전으로 연속 덮어쓰기보다 현재 버전과 발생 조건을 기록한 뒤 안정 버전 하나로 비교하세요.",
    next: "화면 깨짐이나 고온이 동반되면 부하 테스트보다 냉각과 전원 연결을 먼저 확인하고, 정상 온도에서도 반복되면 다른 출력 경로와 GPU를 교차합니다."
  },
  memory: {
    interpretation: "메모리 관련 코드는 RAM 자체뿐 아니라 잘못된 메모리 주소를 사용한 드라이버, 페이지 파일, 저장장치 오류와 함께 나타날 수 있습니다. 코드가 매번 바뀌는지도 중요한 단서입니다.",
    caution: "메모리 검사가 한 번 통과했다고 즉시 정상으로 단정하지 말고 XMP·EXPO 해제 상태와 모듈별 결과를 비교하세요.",
    next: "모듈을 한 개씩 기본 속도로 장착해 슬롯을 교차하고, 안전 모드와 클린 부팅에서 같은 작업이 재현되는지 확인하세요."
  },
  storage: {
    interpretation: "저장장치 계열 오류는 Windows가 필요한 데이터를 제때 읽지 못했거나 파일 시스템과 장치 연결에 문제가 생겼다는 단서입니다. 물리 장치 상태와 논리 파일 시스템을 분리해 봐야 합니다.",
    caution: "SMART 경고, 읽기 실패, Disk 7·129·153 반복이 있으면 복구 명령보다 중요한 파일 백업을 먼저 진행하세요.",
    next: "백업 후 케이블·포트·M.2 슬롯을 교차하고 제조사 진단과 펌웨어를 확인한 뒤 파일 시스템 검사를 계획하세요."
  },
  driver: {
    interpretation: "드라이버 계열 오류는 커널에서 장치가 잘못된 메모리 또는 전원 상태를 사용했을 가능성을 보여줍니다. 최근 추가한 장치와 업데이트 시점을 기준으로 범위를 줄이는 것이 효율적입니다.",
    caution: "모든 드라이버를 한꺼번에 갱신하면 어떤 변경이 영향을 줬는지 확인하기 어려우므로 한 항목씩 변경하세요.",
    next: "안전 모드에서 멈추지 않는다면 최근 드라이버와 장치를 하나씩 되돌리고 장치 관리자와 같은 시각의 이벤트 원본을 함께 확인하세요."
  },
  update: {
    interpretation: "업데이트·설치 코드는 파일 누락, 구성 요소 저장소, 서비스, 권한, 여유 공간 중 작업이 중단된 지점을 나타냅니다. 실패 비율과 업데이트 기록의 세부 코드를 함께 봐야 합니다.",
    caution: "시스템 폴더 권한 변경이나 레지스트리 정리 도구 사용보다 저장 공간, 네트워크, 서비스 상태를 먼저 확인하세요.",
    next: "같은 코드가 반복되면 Windows Update 기록과 DISM·SFC 결과를 저장하고 설치 미디어의 버전이 현재 Windows와 맞는지 확인하세요."
  },
  boot: {
    interpretation: "부팅 계열 코드는 시스템 드라이브, 부팅 구성 또는 핵심 Windows 프로세스를 정상적으로 읽지 못했다는 뜻입니다. 복구 명령 전에 BIOS에서 장치가 안정적으로 보이는지 확인해야 합니다.",
    caution: "디스크가 간헐적으로 사라지거나 소음·읽기 오류가 있으면 자동 복구를 반복하지 말고 백업 가능성부터 확인하세요.",
    next: "복구 환경에서도 같은 문제가 이어지면 저장장치 연결과 건강 상태를 확인한 뒤 시작 복구, 최근 업데이트 제거, 부팅 구성 복구 순서로 진행하세요."
  },
  general: {
    interpretation: "오류 코드는 고장 부품을 확정하는 판정이 아니라 발생 시점과 함께 원인 범위를 좁히는 단서입니다. 최근 변경, 반복 조건, 안전 모드 재현 여부를 함께 기록하세요.",
    caution: "원인이 확인되지 않은 상태에서 초기화, 레지스트리 수정, 시스템 파일 수동 교체를 먼저 진행하지 마세요.",
    next: "같은 코드가 반복되면 이벤트 로그와 장치 상태를 보존하고, 코드가 계속 달라지면 메모리·전원·온도처럼 시스템 전체 안정성을 확인하세요."
  }
};

const errorFallback = (code) => {
  const guidance = topicCopy[getCodeTopic(code)] || topicCopy.general;
  const causes = (code.causes || []).map((item) => `          <li>${escapeHtml(item)}</li>`).join("\n");
  const checks = (code.checks || []).map((item, index) => `          <li><strong>${escapeHtml(item)}</strong> — ${index === 0 ? "되돌리기 쉬운 항목부터 확인해 위험 없이 범위를 줄입니다." : index === 1 ? "첫 확인 결과와 비교해 소프트웨어와 하드웨어 가능성을 나눕니다." : "앞 단계에서 해결되지 않을 때 다음 원인 후보를 검증합니다."}</li>`).join("\n");
  return `
      <!-- STATIC_FALLBACK_START -->
      <article class="static-detail-fallback">
        <p class="eyebrow">에러 코드 상세</p>
        <h2>${escapeHtml(code.code)} · ${escapeHtml(code.title)}</h2>
        <p class="lead">${escapeHtml(code.summary)}</p>
        <h3>이 코드를 어떻게 해석해야 하나요?</h3>
        <p>${escapeHtml(guidance.interpretation)}</p>
        <p><strong>먼저 기록할 내용:</strong> ${escapeHtml(code.code)}가 발생한 시각, 직전에 실행한 작업, 최근 설치한 드라이버·업데이트, 재부팅 뒤 같은 코드가 반복되는지를 적어 두세요.</p>
        <h3>가능성 높은 원인</h3>
        <ul class="mini-list">
${causes}
        </ul>
        <h3>첫 점검 항목</h3>
        <ol class="mini-list">
${checks}
        </ol>
        <h3>데이터와 시스템을 보호하는 주의사항</h3>
        <p>${escapeHtml(guidance.caution)}</p>
        <h3>앞 단계로 해결되지 않을 때</h3>
        <p>${escapeHtml(guidance.next)}</p>
        <p>복구, 초기화, 드라이버 제거처럼 되돌리기 어려운 작업 전에는 중요한 파일을 다른 물리 저장장치나 신뢰할 수 있는 백업 위치에 보관하세요.</p>
        <p><a href="${escapeHtml(code.relatedSymptom || "diagnostic.html")}">관련 증상 가이드 확인하기</a></p>
      </article>
      <!-- STATIC_FALLBACK_END -->
    `;
};

const replaceRootContent = (html, attribute, value, fallback) => {
  const pattern = new RegExp(`(<section class="section" ${attribute}="${value}">)[\\s\\S]*?(</section>)`);
  if (!pattern.test(html)) throw new Error(`렌더링 영역을 찾지 못했습니다: ${attribute}=${value}`);
  return html.replace(pattern, `$1${fallback}$2`);
};

for (const symptom of data.symptoms) {
  const file = path.join(root, symptom.link);
  let html = fs.readFileSync(file, "utf8");
  html = addAuthorMeta(html);
  html = addArticleSchema(html, {
    headline: `${symptom.title} 원인과 점검 순서`,
    description: symptom.summary,
    url: `${data.siteUrl}/${symptom.link}`
  });
  html = replaceRootContent(html, "data-symptom-detail-page", symptom.id, symptomFallback(symptom, data.symptomDetails[symptom.id]));
  fs.writeFileSync(file, html);
}

for (const code of data.errorCodes) {
  const fileName = code.detailPage || code.link;
  if (!fileName || !fileName.startsWith("error-code-")) continue;
  const file = path.join(root, fileName);
  let html = fs.readFileSync(file, "utf8");
  html = addAuthorMeta(html);
  html = addArticleSchema(html, {
    headline: `${code.code} ${code.title} 원인과 점검 순서`,
    description: code.summary,
    url: `${data.siteUrl}/${fileName}`
  });
  html = replaceRootContent(html, "data-error-code-page", code.code, errorFallback(code));
  fs.writeFileSync(file, html);
}

console.log(`정적 본문 생성 완료: 증상 ${data.symptoms.length}개, 오류 코드 ${data.errorCodes.length}개`);
