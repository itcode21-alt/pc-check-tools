// Builds search-index.js (window.SEARCH_INDEX) from data.js + games-data.js for the
// site-wide header search. Kept separate from data.js/games-data.js (which are heavy
// and only loaded on pages that need the full diagnostic tool) so every page — including
// simple static pages — can load a small, fast index.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
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
  "Steam": "steam",
  "Battle.net": "battlenet",
  "PC 게임 공통": "common",
  "서든어택": "suddenattack",
  "FC 온라인": "fconline",
  "패스 오브 엑자일 2": "poe2",
  "아이온2": "aion2",
  "마인크래프트": "minecraft",
  "에이펙스 레전드": "apex",
  "스타크래프트2": "starcraft2",
  "스페셜포스": "specialforce",
  "리니지 클래식": "lineageclassic",
  "로블록스": "roblox",
};

const entries = [];

const addEntry = (title, url, category, keywordParts) => {
  if (!title || !url) return;
  // 200자 제한 때문에 키워드가 많은 항목(화면 미출력, 전원 반응 없음 등)은
  // 뒤에 추가한 키워드가 색인에서 조용히 잘려나가고 있었다(2026-08-07 발견).
  // 실제 최장 항목이 434자라 500자로 넉넉히 올림 — 항목당 몇백 바이트
  // 수준이라 파일 크기에 미치는 영향은 미미하다.
  const keywords = [title, ...keywordParts].filter(Boolean).join(" ").toLowerCase().slice(0, 500);
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
  ["진단 도구", "diagnostic.html", "증상, 오류 코드, 로그, 이벤트 뷰어로 원인을 찾습니다. 로그 분석 하드웨어 정보 로그 dxdiag msinfo32 CrystalDiskInfo HWiNFO hwinfo 이벤트 뷰어 evtx 분석"],
  ["하드웨어 정보 로그 분석 (dxdiag·msinfo32·CrystalDiskInfo·HWiNFO)", "diagnostic.html#diagnostic-log", "진단 도구 로그 분석 고급 진단 로그 분석기 하드웨어 로그 분석 hwinfo hwinfo 로그 분석기 에이치더블유인포 dxdiag msinfo32 crystaldiskinfo 크리스탈디스크인포 사양 확인 온도 전압 SMART 디스크 상태 csv 파일 업로드 붙여넣기 분석"],
  ["이벤트 로그 분석기 (.evtx 파일 첨부, 진단 도구 이벤트 뷰어 탭)", "diagnostic.html#diagnostic-event", "이벤트 로그 분석기 이벤트 뷰어 분석 evtx 파일 첨부 이벤트 ID 원본 진단 도구 로그 분석 이벤트 ID 원본으로 찾기 이벤트 id 찾기"],
  ["증상으로 원인 찾기 (진단 도구 증상 탭)", "diagnostic.html#diagnostic-symptom", "진단 도구 증상 탭 보이는 문제로 찾기 증상으로 찾기 증상 선택 원인 점검 순서"],
  ["오류 코드 직접 입력해서 찾기 (진단 도구 오류 코드 탭)", "diagnostic.html#diagnostic-code", "진단 도구 오류 코드 탭 코드 직접 입력 블루스크린 코드 윈도우 오류 코드 0x 검색"],
  ["PC 부품 이미지에서 선택해 진단 (진단 도구 PC 부품 탭)", "diagnostic.html#diagnostic-parts", "진단 도구 PC 부품 탭 이미지에서 선택 메인보드 부품 그림 부품 선택 진단"],
  ["AI에게 물어보기 (진단 도구)", "diagnostic.html#diagnostic-ai", "진단 도구 AI 질문 AI에게 물어보기 자유롭게 질문하기 증상 설명 챗봇 상담"],
  ["장치 관리자 오류 코드 모음", "device-manager-codes.html", "노란 느낌표 코드 10 12 14 18 22 29 32 37 38 40 48 52 드라이버 BIOS 장치 시작 오류"],
  ["권한·인증 오류 안내", "security-access-errors.html", "0x80070522 0x80090016 0x8009030d 0x8009030e TPM BitLocker 회사 학교 계정 제어된 폴더 액세스 랜섬웨어 방지"],
  ["Windows 오류 코드 상세", "common-error-codes.html", "0x80072ee2 0x80072ee7 0x8007045d 서버 시간 초과 DNS 저장장치 I/O 오류"],
  ["증상별 가이드 모음", "guides.html", "증상별 상세 점검 가이드 전체 목록"],
  ["전체 이벤트 코드 목록", "event-codes-index.html", "이벤트 뷰어 이벤트 ID 원본 전체 목록 Disk Ntfs WHEA Kernel-Power Service Security TPM 저장장치 하드웨어 오류"],
  ["계산 도구 모음", "tools.html", "업그레이드 RAM 메모리 파워 PSU UPS SSD RAID 모니터 백업 계산기"],
  ["PC·노트북 업그레이드 진단", "upgrade.html", "PC 노트북 RAM SSD 그래픽카드 파워 업그레이드"],
  ["부품 선택 업그레이드 진단", "upgrade-diagnostic.html", "CPU 메인보드 GPU RAM SSD PSU 부품 선택 업그레이드 전력 계산"],
  ["PC 부품 호환성 검사기", "parts-compatibility.html", "CPU 메인보드 소켓 GPU 파워 RAM DDR5 SSD NVMe 호환성 검사 업그레이드"],
  ["PC 추천받기", "pc-recommendation.html", "PC 추천 게임용 사무용 영상편집 예산별 사양 가이드"],
  ["RAM 증설 가능 여부 확인", "ram-upgrade-checker.html", "메모리 슬롯 납땜 DDR4 DDR5 SO-DIMM 증설"],
  ["파워(Power Supply Unit, PSU) 용량 계산기", "psu-calculator.html", "파워서플라이 PSU 용량 비교 계산"],
  ["UPS 용량 계산기", "ups-calculator.html", "무정전전원장치 용량 계산"],
  ["SSD 수명(TBW) 계산기", "ssd-tbw-calculator.html", "SSD 총 쓰기량 수명 계산"],
  ["NAS·RAID 용량 계산기", "raid-calculator.html", "RAID SHR 실사용 용량 계산"],
  ["모니터 PPI·시청거리 계산기", "monitor-calculator.html", "모니터 픽셀 밀도 시청거리 계산"],
  ["백업 저장공간 계산기", "backup-storage-calculator.html", "외장 하드 NAS 클라우드 백업 용량 계산"],
  ["장치 관리자 오류 코드 찾기", "device-manager-code-finder.html", "장치 관리자 노란 느낌표 코드 43 45 10 28 31 PowerShell ConfigManagerErrorCode 붙여넣기 해석"],
  ["이벤트 로그 붙여넣기 해석기", "event-log-analyzer.html", "이벤트 로그 분석기 이벤트로그 분석 이벤트 뷰어 분석 로그 분석기 로그 해석 이벤트 뷰어 로그 XML 텍스트 붙여넣기 원본 이벤트 ID 해석 Get-WinEvent PowerShell 수집 명령 재부팅 직전 기록 CSV"],
  ["미니덤프(.dmp)·이벤트 로그(.evtx) 분석기", "minidump-analyzer.html", "미니덤프 분석기 덤프 분석 블루스크린 BSOD dmp minidump evtx 이벤트 로그 분석기 STOP 코드 WHEA 원인 후보 파일 업로드 분석"],
  ["SSD 교체·추가 설치 가이드", "ssd-upgrade-guide.html", "M.2 NVMe SATA SSD 교체 증설 슬롯 백업 복제"],
  ["그래픽카드 업그레이드 가이드", "gpu-upgrade-guide.html", "GPU 그래픽카드 파워 보조전원 케이스 PCIe 업그레이드"],
  ["노트북 업그레이드 가이드", "laptop-upgrade-guide.html", "노트북 RAM SSD 슬롯 납땜 메모리 업그레이드"],
  ["게임 오류 진단 센터", "games-diagnostic.html", "발로란트 롤 배그 로스트아크 게임 오류"],
  ["이벤트 뷰어 확인·복사 방법", "event-viewer-guide.html", "이벤트 ID 원본 XML 복사 방법"],
  ["WindowsUpdateClient 이벤트 20", "event-windowsupdateclient-20.html", "Windows Update 실패 KB 오류 코드 여유 공간 네트워크 업데이트 설치 실패"],
  ["Windows 클린 부팅 방법", "windows-clean-boot-guide.html", "Windows 11 10 msconfig 비Microsoft 서비스 시작 앱 게임 프로그램 충돌 설치 오류 백그라운드"],
  ["메모리(RAM) 검사 방법", "memory-test-guide.html", "Windows 메모리 진단 MemTest86+ 무료 RAM 오류 블루스크린"],
  ["NVIDIA App 설치 오류 0xE6000000 해결 방법", "hardware-nvidia-app-install-error.html", "이 장치는 귀하의 시스템 구성을 지원하지 않습니다 GTX 900 10 시리즈 Maxwell Pascal 레거시 드라이버 지포스 익스피리언스"],
  ["그래픽 드라이버 재설치 방법", "graphics-driver-guide.html", "DDU 무료 그래픽 드라이버 롤백 클린 설치 화면 깜빡임 게임 종료"],
  ["BIOS·부팅 순서 확인 방법", "bios-boot-guide.html", "BIOS 바이오스 UEFI Windows Boot Manager SSD 인식 부팅 불가 기본값 초기화 CMOS Settings Wrong CMOS checksum error CR2032 날짜 시간 초기화"],
  ["노트북 브랜드별 BIOS 진입 방법", "laptop-bios-entry-guide.html", "노트북 BIOS 바이오스 진입 방법 삼성 LG 레노버 Lenovo HP Dell ASUS Acer MSI Toshiba F2 F10 F12 Delete Esc UEFI 부팅 메뉴"],
  ["유선·무선 네트워크 연결 확인 방법", "network-connection-guide.html", "랜 인터넷 안됨 IP DNS Wi-Fi 네트워크 초기화 드라이버"],
  ["해결 사례 공유", "community-cases.html", "PC 윈도우 오류 해결 사례 익명 공유 검토 댓글 커뮤니티"],
  ["뉴스", "news.html", "Windows 업데이트 저장장치 공간 누수 공식 이슈 사이트 소식"],
  ["이번 달 Windows 업데이트 이슈", "windows-update-tracker.html", "KB 업데이트 알려진 이슈 트래커"],
  ["Windows 11 저장장치 공간 누수", "windows-storage-space-leak.html", "CapabilityAccessManager.db-wal C 드라이브 저장공간 감소 KB5095093 시스템 파일 누수"],
  ["파워서플라이(PSU) 테스터기로 전압 불량 확인하는 방법", "psu-tester-guide.html", "PSU 테스터기 전압 확인 ATX 허용 오차 그린선 쇼트 테스트 전원 버튼 여러 번 눌러야 켜짐 5VSB 불안정 리플 노이즈"],
  ["소개", "about.html", "사이트 소개"],
  ["문의", "contact.html", "문의하기"],
];
for (const [title, url, keywords] of MANUAL_PAGES) {
  addEntry(title, url, "페이지", [keywords]);
}

// 위 목록에 없는 HTML 페이지를 제목·설명으로 자동 색인한다. 새 페이지를 만들고 이 목록에 넣는 것을
// 잊어도 검색에서 빠지지 않게 하기 위함이다(2026-10-24 점검에서 37개 페이지가 색인에 없었다).
// 관리·정책·결과 페이지는 검색 대상이 아니므로 제외한다.
const AUTO_SKIP = new Set(["404.html", "admin.html", "admin-local.html", "community-cases-admin.html", "search-results.html", "sitemap.html", "privacy.html", "terms.html", "editorial-policy.html", "index.html"]);
const indexedFiles = new Set(entries.map((e) => e.u.split("#")[0].split("?")[0]));
const decodeEntities = (v) => v.replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
// 제목·설명에 사용자가 흔히 쓰는 말이 없는 페이지는 여기에 보충 키워드를 둔다.
const AUTO_EXTRA = {
  "nas-diagnostic.html": "NAS 진단 시놀로지 Synology 문제 해결",
  "pc-builder.html": "PC 조립 견적 조합 부품 선택 호환성 빌더",
};
let autoAdded = 0;
for (const file of readdirSync(root).filter((f) => f.endsWith(".html")).sort()) {
  if (AUTO_SKIP.has(file) || indexedFiles.has(file)) continue;
  const html = readFileSync(join(root, file), "utf-8");
  const rawTitle = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
  if (!rawTitle) continue;
  const title = decodeEntities(rawTitle).replace(/\s*\|\s*PC 윈도우 진단 센터\s*$/, "").trim();
  const description = decodeEntities((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
  addEntry(title, file, "페이지", [description, AUTO_EXTRA[file]]);
  autoAdded++;
}
console.log(`자동 색인 페이지 ${autoAdded}개`);

const out = `// 자동 생성 파일입니다 — scripts/build-search-index.mjs로 재생성하세요.\nwindow.SEARCH_INDEX = ${JSON.stringify(entries)};\n`;
writeFileSync(join(root, "search-index.js"), out, "utf-8");
console.log(`search-index.js 생성 완료: 항목 ${entries.length}개`);

// 장치 관리자 오류 코드 찾기(device-manager-code-finder.html)용 요약 데이터.
// data-error-codes.js(약 700KB) 전체를 불러오지 않도록 "코드 N" 항목만 골라 작게 만든다.
// 이 파일은 build-search-index.mjs 실행 때마다 같이 재생성된다(콘텐츠 루틴 파이프라인에 포함).
const dmCodes = (DATA.errorCodes || [])
  .filter((e) => /^코드 \d+$/.test(e.code))
  .map((e) => ({
    n: Number(e.code.replace("코드 ", "")),
    t: e.title,
    s: e.summary || e.overview || "",
    c: (e.causes || []).slice(0, 3),
    k: (e.checks || []).slice(0, 3),
    p: e.detailPage || e.link || "",
    r: e.relatedSymptom || "",
    o: e.officialSource || null,
  }))
  .sort((a, b) => a.n - b.n);
writeFileSync(
  join(root, "device-manager-lookup.js"),
  `// 자동 생성 파일입니다 — scripts/build-search-index.mjs로 재생성하세요.\nwindow.DEVICE_MANAGER_CODES = ${JSON.stringify(dmCodes)};\n`,
  "utf-8"
);
console.log(`device-manager-lookup.js 생성 완료: 코드 ${dmCodes.length}개`);
