import fs from "node:fs";
import path from "node:path";

// 매달 패치 데이 이후 새 KB 이슈를 windows-update-tracker.html의
// "이번 달 이슈" 섹션 최상단에 추가하고, 기존 최신 항목은 그대로 아래로 밀려난다.
//
// 사용법: 아래 NEW_ISSUE 객체를 채운 뒤 `node scripts/add-update-issue.mjs` 실행.
// status: "investigating" | "workaround" | "resolved" (복수 선택 시 배열)

const root = path.resolve(import.meta.dirname, "..");
const filePath = path.join(root, "windows-update-tracker.html");

const NEW_ISSUE = {
  kb: "KB0000000",
  date: "2026-00-00",
  os: "Windows 11",
  statuses: ["investigating"], // investigating | workaround | resolved
  items: [
    // "이슈 설명 문장을 여기에 채우세요."
  ],
  sourceLabel: "Microsoft Support: 문서 제목",
  sourceUrl: "https://support.microsoft.com/..."
};

const statusLabel = {
  investigating: { cls: "update-status--investigating", text: "조사중" },
  workaround: { cls: "update-status--workaround", text: "워크어라운드 있음" },
  resolved: { cls: "update-status--resolved", text: "해결됨" }
};

function buildCardHtml({ kb, date, os, statuses, items, sourceLabel, sourceUrl }) {
  const badges = statuses.map(s => {
    const { cls, text } = statusLabel[s];
    return `<span class="update-status ${cls}">${text}</span>`;
  }).join("\n          ");
  const listItems = items.map(i => `<li>${i}</li>`).join("\n            ");
  return `        <div class="update-issue-card">
          <div class="update-issue-head"><h4>${kb}</h4><span class="update-issue-date">${date} · ${os}</span></div>
          ${badges}
          <ul class="mini-list">
            ${listItems}
          </ul>
          <p class="muted">출처: <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">${sourceLabel}</a></p>
        </div>
`;
}

function main() {
  if (NEW_ISSUE.kb === "KB0000000") {
    console.log("NEW_ISSUE 객체를 실제 값으로 채운 뒤 다시 실행하세요.");
    process.exit(1);
  }

  let html = fs.readFileSync(filePath, "utf8");
  const anchor = '        <h3>이번 달 이슈 (';

  const anchorIdx = html.indexOf(anchor);
  if (anchorIdx === -1) {
    console.error('앵커("이번 달 이슈 (")를 찾지 못했습니다. 파일 구조가 변경되었는지 확인하세요.');
    process.exit(1);
  }

  // "이번 달 이슈 (...)" 제목 줄 전체를 새 달로 교체
  const headingEnd = html.indexOf("</h3>", anchorIdx) + "</h3>".length;
  const month = NEW_ISSUE.date.slice(0, 7).replace("-", "년 ") + "월";
  const newHeading = `        <h3>이번 달 이슈 (${month})</h3>`;
  html = html.slice(0, anchorIdx) + newHeading + html.slice(headingEnd);

  // 새 카드 삽입 (제목 다음, 기존 첫 카드 앞)
  const insertPos = anchorIdx + newHeading.length;
  const cardHtml = "\n" + buildCardHtml(NEW_ISSUE);
  html = html.slice(0, insertPos) + cardHtml + html.slice(insertPos);

  // dateModified / 최종 검토일 갱신
  const today = new Date().toISOString().slice(0, 10);
  html = html.replace(/"dateModified":"[\d-]+"/, `"dateModified":"${today}"`);
  html = html.replace(/최종 검토일: [\d-]+/, `최종 검토일: ${today}`);

  fs.writeFileSync(filePath, html);
  console.log(`✓ ${NEW_ISSUE.kb} 카드를 추가했습니다. (${filePath})`);
  console.log("  - style.css의 update-issue-card 스타일이 적용됩니다.");
  console.log("  - 필요하면 이전 최신 항목을 '지난 이슈' 섹션으로 수동 이동하세요.");
  console.log("  - JSON-LD FAQPage 질문을 갱신할 필요가 있는지도 확인하세요.");
}

main();
