// Builds search-index.js (window.SEARCH_INDEX) from data.js + games-data.js for the
// site-wide header search. Kept separate from data.js/games-data.js (which are heavy
// and only loaded on pages that need the full diagnostic tool) so every page — including
// simple static pages — can load a small, fast index.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const dataSrc = readFileSync(join(root, "data.js"), "utf-8");
const dataWindow = {};
// eslint-disable-next-line no-new-func
new Function("window", dataSrc)(dataWindow);
const DATA = dataWindow.SITE_DATA;

const gamesSrc = readFileSync(join(root, "games-data.js"), "utf-8");
// eslint-disable-next-line no-new-func
const gamesExports = new Function(`${gamesSrc}\nreturn { gameErrors, gameBrands };`)();
const { gameErrors } = gamesExports;

const GAME_SLUGS = {
  "발로란트": "valorant",
  "리그 오브 레전드": "lol",
  "로스트아크": "lostark",
  "배틀그라운드": "pubg",
  "검은사막": "blackdesert",
  "오버워치 2": "overwatch2",
  "메이플스토리": "maplestory",
  "던전앤파이터": "dfo",
  "디아블로 4": "diablo4",
};

const entries = [];

const addEntry = (title, url, category, keywordParts) => {
  if (!title || !url) return;
  const keywords = [title, ...keywordParts].filter(Boolean).join(" ").toLowerCase().slice(0, 200);
  entries.push({ t: title, u: url, c: category, k: keywords });
};

for (const item of DATA.errorCodes || []) {
  addEntry(`${item.code} ${item.title}`, item.detailPage || item.link, "오류코드", [
    item.summary,
    ...(item.aliases || []),
  ]);
}

for (const item of DATA.symptoms || []) {
  addEntry(item.title, item.link, "증상", [item.summary, ...(item.keywords || [])]);
}

for (const item of DATA.eventViewerCodes || []) {
  addEntry(`이벤트 ID ${item.id} · ${item.source}`, item.detailPage, "이벤트", [item.summary]);
}

for (const item of gameErrors || []) {
  const slug = GAME_SLUGS[item.game];
  if (!slug) continue;
  addEntry(`${item.game} - ${item.title}`, `games-diagnostic.html?game=${slug}`, "게임 오류", [
    item.errorCode,
    item.overview,
  ]);
}

const MANUAL_PAGES = [
  ["진단 도구", "diagnostic.html", "증상, 오류 코드, 로그, 이벤트 뷰어로 원인을 찾습니다."],
  ["장치 관리자 오류 코드 모음", "device-manager-codes.html", "노란 느낌표 코드 10 12 14 18 22 29 32 37 38 40 48 52 드라이버 BIOS 장치 시작 오류"],
  ["권한·인증 오류 안내", "security-access-errors.html", "0x80070522 0x80090016 0x8009030d 0x8009030e TPM BitLocker 회사 학교 계정 제어된 폴더 액세스 랜섬웨어 방지"],
  ["증상별 가이드 모음", "guides.html", "증상별 상세 점검 가이드 전체 목록"],
  ["계산 도구 모음", "tools.html", "업그레이드 RAM 메모리 파워 PSU UPS SSD RAID 모니터 백업 계산기"],
  ["PC·노트북 업그레이드 진단", "upgrade.html", "PC 노트북 RAM SSD 그래픽카드 파워 업그레이드"],
  ["RAM 증설 가능 여부 확인", "ram-upgrade-checker.html", "메모리 슬롯 납땜 DDR4 DDR5 SO-DIMM 증설"],
  ["파워(Power Supply Unit, PSU) 용량 계산기", "psu-calculator.html", "파워서플라이 PSU 용량 비교 계산"],
  ["UPS 용량 계산기", "ups-calculator.html", "무정전전원장치 용량 계산"],
  ["SSD 수명(TBW) 계산기", "ssd-tbw-calculator.html", "SSD 총 쓰기량 수명 계산"],
  ["NAS·RAID 용량 계산기", "raid-calculator.html", "RAID SHR 실사용 용량 계산"],
  ["모니터 PPI·시청거리 계산기", "monitor-calculator.html", "모니터 픽셀 밀도 시청거리 계산"],
  ["백업 저장공간 계산기", "backup-storage-calculator.html", "외장 하드 NAS 클라우드 백업 용량 계산"],
  ["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html", "M.2 NVMe SATA SSD 교체 증설 슬롯 백업 복제"],
  ["그래픽카드 업그레이드 가이드", "gpu-upgrade-guide.html", "GPU 그래픽카드 파워 보조전원 케이스 PCIe 업그레이드"],
  ["노트북 업그레이드 가이드", "laptop-upgrade-guide.html", "노트북 RAM SSD 슬롯 납땜 메모리 업그레이드"],
  ["게임 오류 진단 센터", "games-diagnostic.html", "발로란트 롤 배그 로스트아크 게임 오류"],
  ["이벤트 뷰어 확인·복사 방법", "event-viewer-guide.html", "이벤트 ID 원본 XML 복사 방법"],
  ["메모리(RAM) 검사 방법", "memory-test-guide.html", "Windows 메모리 진단 MemTest86+ 무료 RAM 오류 블루스크린"],
  ["그래픽 드라이버 재설치 방법", "graphics-driver-guide.html", "DDU 무료 그래픽 드라이버 롤백 클린 설치 화면 깜빡임 게임 종료"],
  ["BIOS·부팅 순서 확인 방법", "bios-boot-guide.html", "BIOS UEFI Windows Boot Manager SSD 인식 부팅 불가 기본값 초기화"],
  ["유선·무선 네트워크 연결 확인 방법", "network-connection-guide.html", "랜 인터넷 안됨 IP DNS Wi-Fi 네트워크 초기화 드라이버"],
  ["해결 사례 공유", "community-cases.html", "PC 윈도우 오류 해결 사례 익명 공유 검토 댓글 커뮤니티"],
  ["이번 달 Windows 업데이트 이슈", "windows-update-tracker.html", "KB 업데이트 알려진 이슈 트래커"],
  ["소개", "about.html", "사이트 소개"],
  ["문의", "contact.html", "문의하기"],
];
for (const [title, url, keywords] of MANUAL_PAGES) {
  addEntry(title, url, "페이지", [keywords]);
}

const out = `// 자동 생성 파일입니다 — scripts/build-search-index.mjs로 재생성하세요.\nwindow.SEARCH_INDEX = ${JSON.stringify(entries)};\n`;
writeFileSync(join(root, "search-index.js"), out, "utf-8");
console.log(`search-index.js 생성 완료: 항목 ${entries.length}개`);
