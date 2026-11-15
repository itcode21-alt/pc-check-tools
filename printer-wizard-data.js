/* 프린터 오류 해결 마법사 데이터 — 질문(q-*)과 해결 순서(r-*).
   화면(printer-wizard.js)과 정적 목록 생성(scripts/build-printer-wizard.mjs)이 같은 데이터를 쓴다.
   근거: Microsoft 지원 문서(오프라인 프린터 문제 해결, 인쇄 스풀러 서비스 오류, 대기열에 걸린 인쇄 작업)와
   이 사이트의 기존 프린터 가이드. 공식 문서로 확인하지 못한 레지스트리 우회 등은 넣지 않는다. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PRINTER_WIZARD = factory();
})(typeof self !== "undefined" ? self : this, function () {
  const MS = "https://support.microsoft.com/en-us/windows/hardware/printer/";
  const Q_PATH = "설정 > Bluetooth 및 장치 > 프린터 및 스캐너 (Windows 10은 설정 > 장치 > 프린터 및 스캐너)";
  const QUEUE_FLAGS = "프린터를 선택하고 '인쇄 대기열 열기'를 누른 뒤 위쪽 '프린터' 메뉴에서 '오프라인으로 프린터 사용'과 '인쇄 일시 중지'가 체크돼 있으면 해제합니다.";
  const SPOOLER_RESTART = "Win+R → services.msc → 목록에서 Print Spooler를 찾아 우클릭 → '다시 시작'합니다.";
  const CMD = [
    "net stop spooler",
    'del /Q /F /S "%systemroot%\\System32\\spool\\PRINTERS\\*.*"',
    "net start spooler",
  ].join("\n");

  const nodes = {
    "q-root": {
      type: "q", title: "프린터에서 어떤 문제가 생겼나요?",
      options: [
        { label: "프린터가 '오프라인'으로 표시돼요", to: "q-offline" },
        { label: "인쇄를 눌렀는데 대기열에서 멈추거나 문서가 안 지워져요", to: "q-queue" },
        { label: "프린터를 추가·검색할 수 없거나 추가하다가 멈춰요", to: "r-add" },
        { label: "공유 프린터에 연결이 안 돼요 (0x0000011b, 0x00000709 등)", to: "r-shared" },
        { label: "'인쇄 스풀러' 서비스가 실행되지 않는다는 오류가 떠요", to: "r-spooler" },
        { label: "인쇄는 되는데 줄이 생기거나 흐리거나 번져요", to: "q-quality" },
        { label: "용지가 걸리거나 급지가 안 돼요", to: "r-jam" },
      ],
    },
    "q-offline": {
      type: "q", title: "프린터를 어떻게 연결해서 쓰나요?",
      options: [
        { label: "USB 케이블로 연결했어요", to: "r-offline-usb" },
        { label: "Wi-Fi 또는 유선 네트워크(LAN)로 연결했어요", to: "r-offline-net" },
      ],
    },
    "q-queue": {
      type: "q", title: "어떤 문서가 안 나가나요?",
      options: [
        { label: "어떤 문서를 인쇄해도 안 나가요", to: "r-queue-all" },
        { label: "특정 문서(파일) 하나만 안 나가요", to: "r-queue-one" },
      ],
    },
    "q-quality": {
      type: "q", title: "어떤 종류의 프린터인가요?",
      options: [
        { label: "잉크젯 (잉크 카트리지·잉크 탱크)", to: "r-quality-ink" },
        { label: "레이저 (토너 카트리지)", to: "r-quality-laser" },
      ],
    },

    "r-offline-usb": {
      type: "r", title: "USB 프린터가 오프라인일 때",
      summary: "프린터 자체보다 대기열 설정이나 스풀러 상태 때문에 오프라인으로 표시되는 경우가 많습니다.",
      steps: [
        "프린터 전원을 끄고 1분쯤 기다렸다가 다시 켭니다. USB 케이블을 뽑았다 다시 꽂고, USB 허브를 쓰고 있다면 PC 본체의 포트에 직접 연결합니다.",
        "'" + Q_PATH + "'에서 " + QUEUE_FLAGS,
        "대기열에 남은 문서가 있으면 모두 취소합니다.",
        SPOOLER_RESTART,
        "그래도 오프라인이면 프린터를 제거한 뒤 제조사 홈페이지의 최신 드라이버로 다시 설치합니다. 윈도우 기본 드라이버로 잡히는 모델은 제조사 패키지가 필요할 수 있습니다.",
      ],
      links: [["windows-printer-offline.html", "프린터 오프라인·연결 안 될 때 해결 가이드"]],
      ms: [[MS + "troubleshooting-offline-printer-problems-in-windows", "Microsoft: 오프라인 프린터 문제 해결"]],
      next: { label: "대기열에 문서가 계속 남아요", to: "r-queue-all" },
    },
    "r-offline-net": {
      type: "r", title: "네트워크(Wi-Fi·LAN) 프린터가 오프라인일 때",
      summary: "프린터의 IP 주소가 바뀌었거나 공유기와의 연결이 끊긴 경우가 흔합니다.",
      steps: [
        "프린터 전원을 껐다 켠 뒤 프린터 화면(또는 설정 메뉴)에서 Wi-Fi 연결 상태와 IP 주소를 확인합니다.",
        "PC와 프린터가 같은 공유기(같은 네트워크)에 연결돼 있는지 확인합니다. 게스트 Wi-Fi나 2.4GHz·5GHz 분리 환경이면 프린터가 붙은 쪽에 PC도 맞춥니다.",
        "프린터 속성의 '포트' 탭에서 윈도우가 쓰는 IP와 프린터가 지금 쓰는 IP를 비교합니다. 다르면 '포트 구성'에서 IP를 바꿔 줍니다. 재발을 막으려면 공유기에서 프린터 IP를 고정(DHCP 예약)해 두세요.",
        "'" + Q_PATH + "'에서 " + QUEUE_FLAGS,
        SPOOLER_RESTART,
        "계속 안 되면 프린터를 제거하고 '원하는 프린터가 목록에 없습니다' → 'TCP/IP 주소 또는 호스트 이름으로 프린터 추가'로 IP를 직접 입력해 다시 추가합니다.",
      ],
      links: [["windows-printer-offline.html", "프린터 오프라인·연결 안 될 때 해결 가이드"]],
      ms: [[MS + "troubleshooting-offline-printer-problems-in-windows", "Microsoft: 오프라인 프린터 문제 해결"]],
      next: { label: "대기열에 문서가 계속 남아요", to: "r-queue-all" },
    },
    "r-queue-all": {
      type: "r", title: "인쇄 대기열이 걸려서 아무것도 안 나갈 때",
      summary: "대기열에 손상된 작업이 남아 있으면 뒤따르는 문서도 모두 막힙니다. 작업 파일을 비우면 대부분 풀립니다.",
      steps: [
        "프린터 전원을 끄고 60초 이상 기다렸다가 켠 뒤 PC도 한 번 재시작합니다. 이것만으로 풀리는 경우가 많습니다.",
        "'" + Q_PATH + "'에서 프린터의 인쇄 대기열을 열고 남은 문서를 모두 취소합니다. 취소가 안 되고 계속 남아 있다면 다음 단계로 갑니다.",
        "관리자 권한으로 명령 프롬프트를 열어 아래 세 줄을 순서대로 실행합니다. 스풀러를 멈추고 작업 파일을 비운 뒤 다시 시작하는 명령입니다.",
        "PRINTERS 폴더 안의 파일만 지우는 명령이며 폴더 자체를 삭제하면 안 됩니다. 실행 후 프린터를 다시 인쇄해 봅니다.",
      ],
      cmd: CMD,
      links: [["hardware-print-spooler-stuck.html", "프린터 인쇄 대기열 걸림 해결 가이드"], ["event-print-spooler-372.html", "Print Spooler 이벤트 372 원인과 점검 순서"]],
      ms: [[MS + "fix-print-job-stuck-in-queue-errors-in-windows", "Microsoft: 대기열에 걸린 인쇄 작업 해결"]],
      next: { label: "스풀러가 아예 시작되지 않아요", to: "r-spooler" },
    },
    "r-queue-one": {
      type: "r", title: "특정 문서 하나만 인쇄가 안 될 때",
      summary: "프린터나 윈도우 문제가 아니라 그 문서의 인쇄 데이터가 문제일 수 있습니다.",
      steps: [
        "같은 프린터로 다른 문서(예: 메모장에 글자 몇 줄)를 인쇄해 봅니다. 그것이 나가면 프린터는 정상이고 문서가 원인입니다.",
        "문제 문서를 다른 프로그램으로 열어 인쇄하거나, 'PDF로 인쇄(저장)'한 뒤 그 PDF를 인쇄해 봅니다.",
        "문서에 큰 이미지나 특수 글꼴이 많다면 이미지를 줄이거나 글꼴을 바꿔 저장한 뒤 다시 시도합니다.",
        "대기열에 이 문서가 멈춘 채 남아 있다면 취소한 뒤 스풀러를 재시작합니다. 안 지워지면 '대기열 걸림' 순서로 넘어가세요.",
      ],
      links: [["hardware-print-spooler-stuck.html", "프린터 인쇄 대기열 걸림 해결 가이드"]],
      ms: [],
      next: { label: "어떤 문서도 안 나가요", to: "r-queue-all" },
    },
    "r-add": {
      type: "r", title: "프린터를 추가·검색할 수 없거나 추가 중 멈출 때",
      summary: "오래된 프린터 항목, 드라이버 충돌, 스풀러 상태가 자주 원인입니다.",
      steps: [
        "목록에 같은 프린터가 중복으로 남아 있으면 모두 제거합니다. 이전에 추가하다 멈춘 항목이 충돌을 일으킵니다.",
        SPOOLER_RESTART,
        "제조사 홈페이지에서 모델명으로 최신 드라이버를 받아 먼저 설치합니다. 기본 드라이버로는 추가가 안 되는 모델이 있습니다.",
        "무선 연결이 꼬였다면 USB로 연결해 추가해 보고, 반대로 USB가 안 되면 네트워크 연결을 시험합니다.",
        "네트워크 프린터가 검색되지 않으면 '원하는 프린터가 목록에 없습니다' → 'TCP/IP 주소 또는 호스트 이름으로 프린터 추가'를 선택해 프린터 IP를 직접 입력합니다. IP는 프린터 화면이나 설정 출력 용지에서 확인합니다.",
      ],
      links: [["windows-printer-add-freeze.html", "프린터 추가 중 멈춤 해결 가이드"], ["error-code-print-spooler-not-responding.html", "인쇄 스풀러 서비스 응답 없음"]],
      ms: [],
      next: { label: "스풀러 오류가 떠요", to: "r-spooler" },
    },
    "r-shared": {
      type: "r", title: "공유 프린터에 연결이 안 될 때 (0x0000011b·0x00000709 등)",
      summary: "다른 PC에 연결된 프린터를 네트워크로 쓰는 환경에서 업데이트 이후 자주 생기는 문제입니다. 원인이 여러 가지라 안전한 확인부터 순서대로 합니다.",
      steps: [
        "프린터가 연결된 PC(호스트)가 켜져 있고 프린터가 '공유'로 설정돼 있는지 확인합니다. 호스트에서 프린터 이름을 바꾸었거나 공유를 껐다 켰다면 공유 이름이 달라졌을 수 있습니다.",
        "내 PC에서 문제의 프린터를 제거합니다. 그리고 파일 탐색기 주소창에 \\\\호스트PC이름 을 입력해 열린 목록에서 프린터를 더블클릭해 다시 연결합니다. IP나 별칭 대신 호스트의 실제 컴퓨터 이름을 쓰면 풀리는 경우가 있습니다.",
        "호스트 PC와 내 PC 모두 Windows 업데이트를 최신으로 맞춥니다. 한쪽만 업데이트된 상태에서 연결 방식 차이로 오류가 나는 경우가 있습니다.",
        "제조사 홈페이지에서 내 PC(클라이언트)에도 해당 프린터 드라이버를 먼저 설치한 뒤 다시 연결해 봅니다.",
        "호스트 PC에서 스풀러를 재시작하고, 호스트에서는 인쇄가 정상인지 먼저 확인합니다. 호스트에서도 안 되면 공유 문제가 아니라 프린터 자체 문제입니다.",
        "인터넷에 도는 '레지스트리 값을 바꿔 인쇄 보안을 낮추는' 우회 방법은 보안을 약하게 만들므로 먼저 시도하지 마세요. 위 단계로 해결되지 않으면 이 방법 대신 프린터를 네트워크 IP(TCP/IP 포트)로 직접 추가하는 방식을 먼저 고려하는 것이 안전합니다.",
      ],
      links: [["error-code-0x00000709.html", "0x00000709 프린터 기본 설정 오류 해결"], ["error-code-print-spooler-not-responding.html", "인쇄 스풀러 서비스 응답 없음"]],
      ms: [],
      next: { label: "스풀러 오류가 떠요", to: "r-spooler" },
    },
    "r-spooler": {
      type: "r", title: "인쇄 스풀러 서비스가 실행되지 않을 때",
      summary: "스풀러가 멈추면 프린터 추가, 인쇄, 오프라인 표시까지 연쇄로 문제가 생깁니다.",
      steps: [
        "Win+R → services.msc → Print Spooler를 더블클릭해 '시작 유형'이 '자동'인지 확인하고 상태가 '중지됨'이면 '시작'을 누릅니다.",
        "시작이 바로 꺼지거나 오류가 나면 같은 서비스 목록에서 Remote Procedure Call(RPC)이 '실행 중'인지 확인합니다. 스풀러는 이 서비스에 의존합니다.",
        "스풀러를 중지한 뒤 C:\\Windows\\System32\\spool\\PRINTERS 폴더 안의 파일을 모두 삭제하고 다시 시작합니다(폴더 자체는 삭제하지 않습니다). 아래 명령으로 한 번에 할 수 있습니다.",
        "스풀러가 반복해서 멈추면 오래되거나 중복된 프린터 드라이버가 원인인 경우가 많습니다. 쓰지 않는 프린터와 드라이버를 제거하고 제조사의 최신 드라이버만 남깁니다.",
      ],
      cmd: CMD,
      links: [["error-code-print-spooler-not-responding.html", "인쇄 스풀러 서비스 응답 없음"], ["event-print-spooler-372.html", "Print Spooler 이벤트 372"]],
      ms: [[MS + "fix-print-spooler-service-not-running-errors-in-windows", "Microsoft: 인쇄 스풀러 서비스 오류 해결"]],
      next: null,
    },
    "r-quality-ink": {
      type: "r", title: "잉크젯 인쇄 품질 문제 (줄·흐림·번짐)",
      summary: "소프트웨어보다 헤드 막힘, 잉크 상태, 용지 설정이 원인인 경우가 많습니다.",
      steps: [
        "프린터 메뉴나 제조사 프로그램의 '노즐 체크(노즐 패턴 인쇄)'를 출력해 끊기거나 빠진 선이 있는지 봅니다.",
        "선이 끊겨 있으면 '헤드 청소'를 한두 번 실행하고 다시 노즐 체크를 합니다. 청소를 반복하면 잉크가 많이 소모되니 두 번 이상 효과가 없으면 멈춥니다.",
        "잉크 잔량과 카트리지 장착 상태를 확인합니다. 호환·재생 잉크는 인식 문제나 색 번짐을 일으킬 수 있습니다.",
        "인쇄 설정의 '용지 종류'와 '인쇄 품질'이 실제 용지와 맞는지 확인합니다. 일반 용지에 사진 용지 설정으로 인쇄하면 번질 수 있습니다.",
        "오래 사용하지 않았다면 잉크가 굳었을 수 있습니다. 청소를 여러 번 해도 같다면 제조사 서비스 점검이 필요합니다.",
      ],
      links: [], ms: [], next: null,
    },
    "r-quality-laser": {
      type: "r", title: "레이저 인쇄 품질 문제 (줄·얼룩·흐림)",
      summary: "토너와 드럼 같은 소모품 상태가 가장 흔한 원인입니다.",
      steps: [
        "토너 잔량을 확인하고, 토너 카트리지를 꺼내 좌우로 가볍게 흔든 뒤 다시 장착합니다. 토너가 한쪽으로 뭉치면 흐리게 나올 수 있습니다.",
        "줄이나 얼룩이 매 장 같은 위치에 반복되면 토너 카트리지나 드럼 같은 소모품 문제일 가능성이 큽니다.",
        "내부에 용지 가루나 토너가 묻어 있지 않은지 전원을 끈 상태에서 확인합니다. 열이 남아 있을 수 있으니 식은 뒤 만집니다.",
        "용지가 눅눅하거나 규격이 맞지 않는지 확인하고 새 용지로 시험해 봅니다.",
        "소모품을 바꿔도 같으면 제조사 서비스 점검이 필요합니다.",
      ],
      links: [], ms: [], next: null,
    },
    "r-jam": {
      type: "r", title: "용지 걸림·급지 불량",
      summary: "무리하게 잡아당기면 찢어진 조각이 남아 반복 걸림의 원인이 됩니다.",
      steps: [
        "프린터 전원을 끄고 전원 케이블을 뽑습니다.",
        "용지함, 뒷덮개, 카트리지 주변 순서로 열어 걸린 용지를 용지가 나아가는 방향으로 천천히 당겨 제거합니다.",
        "손전등으로 내부를 비춰 찢어진 용지 조각이 남아 있지 않은지 확인합니다.",
        "용지를 새것으로 바꾸고 장수를 너무 많이 넣지 않습니다. 가장자리를 가지런히 하고 구겨졌거나 눅눅한 용지는 빼 둡니다. 용지 가이드가 용지 폭에 맞는지도 확인합니다.",
        "같은 증상이 반복되면 급지 롤러가 마모됐을 수 있어 제조사 서비스 점검이 필요합니다.",
      ],
      links: [], ms: [], next: null,
    },
  };
  return { start: "q-root", nodes };
});
