(() => {
  // 데스크탑·노트북 전원·화면·부팅 자가진단 (2026-11-21)
  // 질문 흐름은 아래 NODES 한 곳에서 관리합니다. 결과 안내는 사이트의 기존 가이드
  // (hardware-no-power, hardware-no-display 등)에 있는 점검 순서만 요약해 연결합니다.
  // 입력은 브라우저에서만 처리되며 어디로도 전송하지 않습니다.
  const KAKAO_URL = "https://pf.kakao.com/_xgExbWX/chat";

  const VISIT = "visit"; // 윈도우까지 켜지지 않는 증상
  const REMOTE = "remote"; // 윈도우가 실행되는 증상

  const NODES = {
    start: {
      q: "어떤 컴퓨터인가요?",
      hint: "노트북과 데스크탑은 전원 경로와 점검 방법이 달라서 먼저 나눕니다.",
      options: [
        { t: "데스크탑 (본체를 따로 쓰는 PC)", next: "dstart" },
        { t: "노트북", next: "lstart" },
      ],
    },
    dstart: {
      q: "전원 버튼을 눌렀을 때 어떻게 되나요?",
      hint: "가장 가까운 상황 하나를 고르세요.",
      options: [
        { t: "팬도 LED도 전혀 반응이 없다", next: "standby" },
        { t: "팬이 돌고 불도 들어오는데 모니터에 화면이 없다", next: "cable" },
        { t: "켜졌다가 몇 초 만에 꺼지거나, 켜졌다 꺼지기를 반복한다", next: "recent" },
        { t: "화면은 나오는데 윈도우로 들어가지 못한다", next: "bootmsg" },
        { t: "윈도우는 쓰는데 가끔 갑자기 꺼지거나 재부팅된다", next: "load" },
      ],
    },


    // ── 노트북 ─────────────────────────────────────────────
    lstart: {
      q: "노트북이 어떤 상태인가요?",
      options: [
        { t: "어댑터를 꽂아도 충전 불빛이 안 들어오고 안 켜진다", next: "r_lnoled" },
        { t: "충전 불빛은 들어오는데 전원이 안 켜진다", next: "r_lled" },
        { t: "켜진 것 같은데(팬 소리·불빛) 화면이 안 나온다", next: "lscreen" },
        { t: "윈도우로 들어가지 못한다", next: "bootmsg" },
        { t: "윈도우는 켜지는데 충전이 안 되거나 배터리가 빨리 닳는다", next: "lbatt" },
        { t: "윈도우는 쓰는데 가끔 갑자기 꺼지거나 재부팅된다", next: "load" },
      ],
    },
    r_lnoled: {
      mode: VISIT,
      title: "어댑터에서 노트북까지 전원이 들어오는지부터 확인합니다",
      lead: "충전 불빛이 없다면 콘센트, 어댑터와 케이블, 충전 단자, 그리고 배터리가 완전히 방전된 상태인지를 순서대로 봅니다.",
      tries: [
        "멀티탭을 빼고 벽면 콘센트에 직접 꽂아 봅니다.",
        "어댑터 케이블이 꺾이거나 어댑터 본체가 심하게 뜨겁지 않은지, 어댑터에 표시등이 있다면 켜지는지 봅니다.",
        "충전 단자(전용 단자 또는 USB-C)에 먼지가 끼었거나 헐거워 흔들리지 않는지 봅니다. 다른 정품 어댑터가 있다면 전압·출력 규격이 같은지 확인한 뒤 바꿔 꽂아 봅니다. USB-C 충전은 어댑터 출력이 부족하면 충전이 안 될 수 있습니다.",
        "배터리가 완전히 방전됐다면 어댑터를 꽂은 채 잠시 두었다가 켜 봅니다.",
      ],
      warn: "어댑터나 본체가 뜨겁거나 타는 냄새가 나는 경우, 본체 바닥이 부풀거나 터치패드가 들뜬 경우(배터리 부풀음 가능성)에는 어댑터를 연결하지 말고 문의해 주세요.",
      guides: [{ href: "hardware-laptop-battery-not-charging.html", t: "노트북 배터리 충전 안 됨 (윈도우가 켜질 때의 점검)" }],
    },
    r_lled: {
      mode: VISIT,
      title: "충전은 되는데 켜지지 않으면 잔류 전원 방전과 화면 여부를 먼저 봅니다",
      lead: "충전 불빛이 들어온다면 어댑터 경로는 일단 동작하는 것입니다. 노트북이 멈춘 상태에 걸려 있거나, 켜졌는데 화면만 안 나오는 경우를 먼저 가릅니다.",
      tries: [
        "어댑터와 USB 장치 등 주변기기를 모두 뽑고, 전원 버튼을 약 30초 길게 눌렀다가 놓습니다. 제조사마다 시간과 방법이 다르니 설명서의 '전원 리셋' 항목도 확인하세요.",
        "그 상태에서 어댑터만 다시 꽂고 전원을 켜 봅니다.",
        "켜지는 소리나 팬 회전, 키보드 불빛이 있는지 봅니다. 있다면 화면만 안 나오는 것일 수 있으니 외부 모니터를 연결해 봅니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때" }],
    },
    lscreen: {
      q: "HDMI 같은 단자로 외부 모니터를 연결하면 화면이 나오나요?",
      hint: "외부 모니터가 없거나 연결할 수 없다면 두 번째를 고르세요.",
      options: [
        { t: "외부 모니터에는 화면이 나온다", next: "r_lpanel" },
        { t: "안 나온다 (또는 연결해 볼 수 없다)", next: "r_lnoout" },
      ],
    },
    r_lpanel: {
      mode: VISIT,
      title: "그래픽은 동작하고, 내장 화면 쪽을 의심합니다",
      lead: "외부 모니터에 나온다면 본체의 영상 출력은 살아 있다는 뜻이라, 출력 전환 설정이나 내장 화면(패널·화면 케이블)을 먼저 봅니다.",
      tries: [
        "Fn 키 조합으로 밝기를 올려 보고, Windows 키+P로 '내장 화면만' 또는 '복제' 같은 출력 모드를 바꿔 봅니다.",
        "어두운 곳에서 화면에 손전등을 비춰 글자가 희미하게 보이면 화면 백라이트 쪽 문제일 수 있습니다(일반 점검이며 확정은 아닙니다).",
        "이상이 없으면 화면 케이블·패널 점검은 분해가 필요하므로 직접 하기보다 맡기는 편이 안전합니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때" }],
    },
    r_lnoout: {
      mode: VISIT,
      title: "외부 화면에도 안 나오면 메모리·그래픽·메인보드 쪽을 봅니다",
      lead: "내장·외부 어디에도 영상이 없다면 화면 문제가 아니라 본체 쪽 문제일 가능성이 큽니다.",
      tries: [
        "어댑터와 주변기기를 모두 뽑고 전원 버튼을 약 30초 눌러 잔류 전원을 방전한 뒤 다시 켜 봅니다.",
        "메모리 덮개가 따로 있어 쉽게 열리는 모델이라면 전원·배터리를 분리한 뒤 메모리를 다시 꽂아 볼 수 있습니다. 덮개가 없는 모델은 분해가 필요하니 직접 하지 마세요.",
        "그래도 같다면 메모리·그래픽·메인보드 점검이 필요해 맡기는 편이 안전합니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때" }],
    },
    lbatt: {
      q: "배터리가 어떤 증상인가요?",
      options: [
        { t: "어댑터를 꽂아도 충전이 안 된다('충전 중 아님' 등)", next: "r_lcharge" },
        { t: "충전은 되는데 사용 시간이 예전보다 많이 짧아졌다", next: "r_ldrain" },
      ],
    },
    r_lcharge: {
      mode: REMOTE,
      title: "어댑터·포트·드라이버·충전 한도 설정을 나눠 확인합니다",
      lead: "배터리가 고장났다고 단정하기 전에 어댑터, 충전 포트, 배터리 드라이버, 제조사 유틸리티의 충전 한도 설정을 먼저 나눠 봅니다.",
      tries: [
        "다른 정품 어댑터·케이블이 있다면 바꿔 연결해 봅니다.",
        "제조사 유틸리티(Lenovo Vantage, Dell Power Manager 등)에서 충전 한도가 낮게 설정되어 있지 않은지 봅니다.",
        "장치 관리자에서 배터리 항목의 'Microsoft ACPI 규격 준수 제어 방법 배터리'를 제거하고 재부팅해 다시 잡히는지 봅니다.",
        "관리자 권한 명령 프롬프트에서 powercfg /batteryreport를 실행해 설계 용량 대비 완전 충전 용량을 확인합니다.",
      ],
      guides: [{ href: "hardware-laptop-battery-not-charging.html", t: "노트북 배터리 충전 안 됨 해결 가이드" }],
    },
    r_ldrain: {
      mode: REMOTE,
      title: "배터리 노후인지, 설정·프로그램 문제인지 나눕니다",
      lead: "충전은 정상인데 빨리 닳는다면 배터리 자체의 노후, 백그라운드 프로그램, 화면 밝기·전원 설정을 나눠 봅니다.",
      tries: [
        "설정 > 시스템 > 전원 및 배터리에서 배터리를 많이 쓰는 앱을 확인합니다.",
        "powercfg /batteryreport로 최대 용량이 설계 용량 대비 얼마나 줄었는지 확인합니다. 크게 줄었다면 배터리 교체를 고려합니다.",
        "화면 밝기를 낮추고 절전 설정을 확인합니다. 게이밍 노트북은 배터리 사용 중 내장 그래픽으로 전환하는 설정을 봅니다.",
      ],
      guides: [{ href: "hardware-laptop-battery-drains-fast.html", t: "노트북 배터리 빨리 닳음 가이드" }],
    },

    // ── 완전 무반응 ─────────────────────────────────────────
    standby: {
      q: "전원 코드를 꽂고 PSU(파워) 뒷면 스위치를 켠 상태에서, 메인보드의 작은 대기 전원 LED가 켜져 있나요?",
      hint: "본체 옆판을 열어야 보입니다. 모든 메인보드에 있는 것은 아닙니다. 열기 어렵다면 '모르겠다'를 고르세요.",
      options: [
        { t: "켜져 있다", next: "r_pwrsw" },
        { t: "꺼져 있다", next: "r_nostandby" },
        { t: "그런 LED가 없거나 확인하기 어렵다", next: "r_nostandby" },
      ],
    },
    r_pwrsw: {
      mode: VISIT,
      title: "대기 전원은 들어오는데 버튼에 반응이 없습니다",
      lead: "PSU에서 메인보드까지 대기 전원은 오고 있으니, 전원 버튼 신호가 메인보드로 전달되는 경로를 먼저 의심합니다.",
      tries: [
        "전원 코드를 뽑고 케이스 앞면 전원 스위치 선이 메인보드 전면 패널 핀(PANEL, F_PANEL, JFP1 등으로 표기)의 PWR SW 위치에 제대로 꽂혀 있는지 확인합니다.",
        "버튼 쪽 문제인지 가르는 방법(핀을 직접 접촉시켜 보는 방법)은 가이드의 전면 패널 항목에 사진과 함께 있습니다. 전원이 연결된 상태에서 하는 점검이므로 순서를 읽고 진행하세요.",
        "이 방법으로도 켜지지 않으면 PSU나 메인보드 쪽을 의심하게 됩니다. 이때부터는 같은 규격의 정상 부품으로 바꿔 보는 테스트가 필요합니다.",
      ],
      guides: [{ href: "hardware-no-power.html", t: "전원 반응 없음 해결 가이드 (전면 패널·대기 전원 LED 항목)" }],
    },
    r_nostandby: {
      mode: VISIT,
      title: "본체로 전원이 제대로 들어오고 있는지부터 확인합니다",
      lead: "대기 전원 LED도 없다면 콘센트부터 PSU까지의 경로, 또는 PSU 자체를 먼저 봅니다. 부품 교체보다 연결 상태 확인이 먼저입니다.",
      tries: [
        "멀티탭을 거치지 말고 벽면 콘센트에 전원 코드를 직접 꽂아 보고, 가능하면 다른 전원 코드로 바꿔 꽂아 봅니다.",
        "PSU 뒷면 스위치가 켜져(I) 있는지 확인합니다.",
        "전원 코드를 뽑은 뒤 옆판을 열어 24핀 메인 전원과 CPU 보조전원(4핀·8핀) 케이블이 끝까지 꽂혀 있는지 다시 눌러 확인합니다.",
        "부품을 새로 달았거나 청소한 직후부터 안 켜졌다면, 그때 만진 케이블과 부품부터 되돌려 봅니다.",
      ],
      warn: "타는 냄새, 연기, 스파크가 있었다면 전원을 다시 연결하지 말고 문의해 주세요.",
      guides: [{ href: "hardware-no-power.html", t: "전원 반응 없음 해결 가이드 (24핀·8핀 재체결 사진)" }],
    },

    // ── 팬은 도는데 화면 없음 ────────────────────────────────
    cable: {
      q: "모니터 케이블이 어디에 꽂혀 있나요?",
      hint: "본체 뒷면에서 확인합니다. 그래픽카드는 보통 아래쪽 슬롯에 포트가 모여 있고, 메인보드 포트는 윗부분에 있습니다.",
      options: [
        { t: "그래픽카드가 따로 있는데, 케이블이 메인보드 쪽 포트에 꽂혀 있다", next: "r_wrongport" },
        { t: "그래픽카드 포트에 꽂혀 있다 (또는 그래픽카드가 없는 PC다)", next: "debug" },
      ],
    },
    r_wrongport: {
      mode: REMOTE,
      title: "케이블이 메인보드 포트에 꽂혀 있을 수 있습니다",
      lead: "그래픽카드를 달았다면 모니터 케이블은 그래픽카드 포트에 꽂아야 합니다. 메인보드 포트에 꽂으면 BIOS 화면까지는 나오다가 윈도우에서 화면이 꺼지는 경우도 있습니다.",
      tries: [
        "PC를 끄고 모니터 케이블을 그래픽카드 쪽 포트로 옮겨 꽂은 뒤 다시 켭니다.",
        "그래도 안 나오면 케이블 양쪽 끝을 다시 꽂고, 모니터 입력 소스(HDMI1, DP1 등)가 연결한 포트와 맞는지 모니터 메뉴에서 확인합니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때" }],
    },
    debug: {
      q: "메인보드에 CPU·DRAM·VGA·BOOT 같은 디버그 LED가 있고, 그중 하나가 켜진 채 멈춰 있나요?",
      hint: "디버그 LED는 일부 메인보드에만 있습니다. 정상 부팅 중에는 순서대로 깜빡이다 꺼지고, 문제가 있는 단계에서 멈춥니다.",
      options: [
        { t: "예, 하나가 켜진 채 멈춰 있다", next: "r_debugled" },
        { t: "아니오, 없거나 확인하기 어렵다", next: "r_noled" },
      ],
    },
    r_debugled: {
      mode: VISIT,
      title: "멈춘 LED가 가리키는 부품부터 확인합니다",
      lead: "LED 이름은 어느 단계에서 막혔는지를 알려 주는 단서입니다. 표기와 의미는 제조사마다 조금 다르니 메인보드 설명서도 함께 보세요.",
      tries: [
        "CPU: CPU 장착 상태와 CPU 보조전원(4핀·8핀) 연결을 봅니다.",
        "DRAM: 메모리를 모두 뺐다가 한 개씩 다른 슬롯에 꽂아 가며 켜 봅니다. 접점의 먼지도 닦아 줍니다.",
        "VGA: 그래픽카드를 슬롯에 다시 꽂고 보조전원 케이블을 확인합니다. CPU에 내장 그래픽이 있다면 그래픽카드를 빼고 메인보드 포트로 시험해 볼 수 있습니다.",
        "BOOT: 부팅용 SSD·HDD의 전원과 데이터 케이블, 인식 여부를 BIOS에서 확인합니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때 (디버그 LED 항목)" }],
    },
    r_noled: {
      mode: VISIT,
      title: "모니터·케이블 → 메모리·그래픽카드 접촉 순서로 확인합니다",
      lead: "단서가 없을 때는 바꾸기 쉬운 것부터 확인하는 것이 시간을 아낍니다.",
      tries: [
        "다른 케이블이나 다른 모니터로 바꿔 연결해 모니터·케이블 문제인지 먼저 가립니다.",
        "전원 코드를 뽑고 메모리와 그래픽카드를 슬롯에서 뺐다가 먼지를 닦고 다시 단단히 꽂습니다. 그래픽카드 보조전원도 확인합니다.",
        "메모리가 여러 개라면 한 개만 꽂고 켜 보는 것을 슬롯별로 반복합니다.",
      ],
      guides: [{ href: "hardware-no-display.html", t: "전원은 켜지는데 화면이 안 나올 때" }],
    },

    // ── 켜졌다 바로 꺼짐 ─────────────────────────────────────
    recent: {
      q: "최근에 부품을 달거나 바꿨나요? 본체를 청소하거나 옮긴 일도 포함합니다.",
      options: [
        { t: "예, 최근에 만진 부품이나 케이블이 있다", next: "r_recentwork" },
        { t: "아니오, 아무것도 건드린 적이 없다", next: "r_loopnowork" },
      ],
    },
    r_recentwork: {
      mode: VISIT,
      title: "방금 만진 부품의 장착 상태를 먼저 의심합니다",
      lead: "작업 직후부터 생긴 증상이라면 새 부품 자체보다 장착 불량이나 케이블 연결 실수인 경우를 먼저 봅니다.",
      tries: [
        "전원 코드를 뽑고, 최근에 만진 부품과 케이블을 원래대로 되돌려 켜 봅니다.",
        "CPU·쿨러·메모리 1개(필요하면 그래픽카드)만 남긴 최소 구성으로 켜 보고, 켜지면 부품을 하나씩 다시 붙여 가며 어느 단계에서 꺼지는지 봅니다.",
        "메인보드를 케이스에 고정하는 받침(스탠드오프)이 메인보드 구멍 위치와 어긋나 있지 않은지 확인합니다. 구멍이 없는 자리에 받침이 있으면 합선될 수 있습니다.",
        "AMD CPU에 별매 쿨러를 달았다면 쿨러 고정 압력과 장착 상태를 점검하는 가이드를 참고하세요.",
      ],
      guides: [
        { href: "hardware-no-power.html", t: "전원 반응 없음 해결 가이드 (부품 장착 직후 항목)" },
        { href: "hardware-amd-cpu-cooler-pressure-no-post.html", t: "사제 CPU 쿨러 장착 후 POST 실패 점검 가이드" },
      ],
    },
    r_loopnowork: {
      mode: VISIT,
      title: "과열 보호, 메모리 접촉, 파워 상태를 순서대로 봅니다",
      lead: "건드린 적이 없는데 켜졌다 꺼진다면 과열로 인한 보호 종료, 메모리 접촉 불량, 노후한 PSU가 흔한 후보입니다. 어느 쪽인지는 아래 확인으로 좁힙니다.",
      tries: [
        "켜지는 몇 초 동안 CPU 쿨러 팬이 실제로 도는지 봅니다. 먼지가 쌓여 있다면 전원을 끄고 제거합니다.",
        "메모리를 뺐다가 접점을 닦고 다시 꽂거나, 한 개씩 꽂아 켜 봅니다.",
        "BIOS 설정이 꼬였을 수 있어, 화면이 나오는 상태라면 기본값을 불러와 봅니다.",
        "PSU를 오래 썼다면 정상 PSU로 바꿔 보는 테스트가 확실하지만, 이 단계는 직접 하기보다 맡기는 편이 안전합니다.",
      ],
      warn: "타는 냄새가 나거나 PSU에서 이상한 소리가 나면 전원을 연결하지 말고 문의해 주세요.",
      guides: [
        { href: "hardware-overheat-shutdown.html", t: "쓰다가 갑자기 꺼질 때 · 발열인지 전원인지 가르기" },
        { href: "bios-boot-guide.html", t: "부팅이 안 될 때 BIOS 확인 순서·기본값 불러오기" },
      ],
    },

    // ── 윈도우로 못 들어감 ───────────────────────────────────
    bootmsg: {
      q: "화면에 어떤 모습이 나오나요?",
      options: [
        { t: "BOOTMGR is missing 또는 부팅 장치를 찾을 수 없다는 문구", next: "r_bootmgr" },
        { t: "'자동 복구를 준비하는 중'이 계속 반복된다", next: "r_repairloop" },
        { t: "메인보드 로고에서 오래 멈추거나 BIOS 설정 화면으로만 들어간다", next: "r_biosstop" },
        { t: "파란 화면(블루스크린)에 오류 코드가 뜬다", next: "r_bsod" },
      ],
    },
    r_bootmgr: {
      mode: VISIT,
      title: "부팅 장치를 찾지 못하는 상태입니다",
      lead: "BIOS에서 부팅 디스크가 보이는지, 부팅 순서가 맞는지부터 확인합니다. 디스크가 BIOS에서도 안 보이면 연결이나 디스크 자체를 의심합니다.",
      tries: [
        "BIOS 화면에서 SSD·HDD가 목록에 보이는지 확인합니다.",
        "보인다면 부팅 순서 첫 번째가 윈도우가 설치된 디스크인지 확인합니다. USB 같은 다른 장치가 첫 번째면 뽑아 봅니다.",
        "보이지 않으면 전원을 끄고 디스크의 전원·데이터 케이블(M.2라면 장착 상태)을 확인합니다. 중요한 자료가 있다면 포맷하거나 재설치하기 전에 먼저 상담하세요.",
      ],
      guides: [
        { href: "windows-bootmgr-missing.html", t: "BOOTMGR is missing 오류 원인과 해결 순서" },
        { href: "bios-boot-guide.html", t: "부팅이 안 될 때 BIOS 확인 순서" },
      ],
    },
    r_repairloop: {
      mode: VISIT,
      title: "윈도우 자동 복구가 끝나지 않고 반복됩니다",
      lead: "업데이트나 갑작스러운 종료 뒤 부팅 파일이 손상되었거나 디스크에 문제가 있을 때 나타납니다. 복구 환경에서 시도할 수 있는 순서는 가이드에 정리되어 있습니다.",
      tries: [
        "가이드의 순서대로 복구 환경에서 시작 복구와 부팅 관련 점검을 진행합니다.",
        "복구 과정에서 디스크가 인식되지 않거나 반복해서 실패한다면 디스크 상태를 의심합니다. 자료 백업이 필요한지 먼저 판단하세요.",
      ],
      guides: [{ href: "windows-auto-repair-loop.html", t: "윈도우 자동 복구 루프 해결 가이드" }],
    },
    r_biosstop: {
      mode: VISIT,
      title: "BIOS 단계에서 디스크 인식과 설정을 확인합니다",
      lead: "메인보드 로고에서 멈추거나 BIOS로만 들어가는 증상은 부팅 디스크 인식, 부팅 순서, 설정 초기화 여부를 먼저 봅니다.",
      tries: [
        "BIOS에서 부팅 디스크가 보이는지와 부팅 순서를 확인합니다.",
        "기본값 불러오기(Load Optimized Defaults)로 설정을 되돌려 봅니다. 방법은 가이드에 있습니다.",
        "USB 저장장치와 외장 하드를 모두 뽑고 다시 켜 봅니다.",
      ],
      guides: [{ href: "bios-boot-guide.html", t: "부팅이 안 될 때 BIOS 확인 순서·기본값 불러오기" }],
    },
    r_bsod: {
      mode: REMOTE,
      title: "블루스크린 코드를 먼저 확인하세요",
      lead: "화면에 나온 정지 코드(예: 0x0000007B, CRITICAL_PROCESS_DIED)가 원인을 좁히는 가장 좋은 단서입니다.",
      tries: [
        "화면의 정지 코드나 문구를 사진으로 남겨 둡니다.",
        "아래 해석기에 코드를 넣어 의미와 점검 순서를 확인합니다.",
      ],
      guides: [{ href: "bluescreen-code-finder.html", t: "블루스크린 코드 해석기" }],
    },

    // ── 윈도우 사용 중 갑자기 꺼짐 ───────────────────────────
    load: {
      q: "갑자기 꺼지거나 재부팅되는 때는 주로 언제인가요?",
      options: [
        { t: "게임이나 영상 편집처럼 무거운 작업을 할 때", next: "r_heavy" },
        { t: "가벼운 작업 중이거나 놀려 둘 때도 그렇다", next: "r_idle" },
      ],
    },
    r_heavy: {
      mode: REMOTE,
      title: "부하가 걸릴 때만 꺼지면 발열과 전원 공급을 의심합니다",
      lead: "CPU·그래픽카드 온도가 높아져 보호 종료되거나, 부하 때 PSU가 전력을 감당하지 못하는 경우가 있습니다. 먼저 온도를 보며 재현해 봅니다.",
      tries: [
        "작업 중 CPU·그래픽카드 온도를 모니터링 프로그램으로 보면서 꺼지기 직전 온도를 기록합니다.",
        "본체 먼지와 쿨러 팬 회전을 점검합니다.",
        "온도가 높지 않은데도 꺼진다면 PSU 용량과 사용 연수를 확인합니다.",
      ],
      guides: [
        { href: "hardware-gaming-reboot.html", t: "게임 중 재부팅 원인 점검" },
        { href: "hardware-overheat-shutdown.html", t: "쓰다가 갑자기 꺼질 때 · 발열인지 전원인지 가르기" },
      ],
    },
    r_idle: {
      mode: REMOTE,
      title: "이벤트 로그에서 정상 종료가 아니었는지부터 확인합니다",
      lead: "아무 때나 꺼진다면 윈도우 이벤트 로그의 Kernel-Power 41 기록과 함께 나온 다른 오류를 보면 원인 방향을 좁힐 수 있습니다.",
      tries: [
        "이벤트 뷰어에서 꺼진 시각 전후의 Kernel-Power 41과 WHEA 관련 기록을 확인합니다.",
        "진단 도구에 이벤트 로그를 넣으면 반복되는 기록을 정리해 줍니다.",
        "로그만으로 원인이 갈리지 않으면 메모리 접촉, PSU 상태 같은 하드웨어 점검으로 넘어갑니다.",
      ],
      guides: [
        { href: "event-kernel-power-41.html", t: "Kernel-Power 41 원인과 점검 순서" },
        { href: "diagnostic.html", t: "진단 도구 (이벤트 로그 분석)" },
      ],
    },
  };

  const CTA = {
    [VISIT]: {
      lead: "윈도우까지 켜지지 않는 단계에서 막혔다면 원격 연결을 쓰기 어렵습니다. 직접 확인해도 해결되지 않으면 방문 점검을 문의해 주세요. 노트북은 접수 가능 여부와 요금을 먼저 문의해 주세요.",
      price: "방문 출장비 3만원 (고양·파주 4만원, 인천 검단·청라·김포 기준) · 요금 기준은 요금 안내 페이지에서 확인할 수 있습니다.",
    },
    [REMOTE]: {
      lead: "윈도우가 실행되는 증상이라 원격 점검으로 먼저 원인을 확인해 볼 수 있습니다.",
      price: "원격 점검 2만원 · 30분 안에 원인을 찾지 못하면 비용을 받지 않습니다.",
    },
  };

  const root = document.querySelector("[data-boot-check]");
  if (!root) return;
  const stage = root.querySelector("[data-stage]");
  const trail = root.querySelector("[data-trail]");
  const backBtn = root.querySelector("[data-back]");
  const resetBtn = root.querySelector("[data-reset]");

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // 지나온 선택: [{ q, a }], 현재 노드 id
  let history = [];
  let current = "start";

  function renderTrail() {
    if (!history.length) {
      trail.hidden = true;
      trail.innerHTML = "";
      return;
    }
    trail.hidden = false;
    trail.innerHTML = "<strong>고른 답</strong><ol>" + history.map((h) => `<li>${esc(h.a)}</li>`).join("") + "</ol>";
  }

  function renderQuestion(node) {
    const hint = node.hint ? `<p class="muted">${esc(node.hint)}</p>` : "";
    const opts = node.options
      .map((o, i) => `<button type="button" class="bc-option" data-idx="${i}">${esc(o.t)}</button>`)
      .join("");
    stage.innerHTML = `<h3 tabindex="-1" data-focus>${esc(node.q)}</h3>${hint}<div class="bc-options">${opts}</div>`;
    stage.querySelectorAll(".bc-option").forEach((btn) => {
      btn.addEventListener("click", () => {
        const o = node.options[Number(btn.dataset.idx)];
        history.push({ id: current, a: o.t });
        current = o.next;
        render();
      });
    });
  }

  function renderResult(node) {
    const cta = CTA[node.mode];
    const tries = node.tries.map((t) => `<li>${esc(t)}</li>`).join("");
    const guides = node.guides.map((g) => `<a href="${esc(g.href)}">${esc(g.t)}</a>`).join("");
    const warn = node.warn ? `<div class="callout"><strong>이럴 땐 직접 하지 마세요</strong><p>${esc(node.warn)}</p></div>` : "";
    const remoteLink = node.mode === REMOTE ? `<a class="btn secondary" href="remote-support.html">원격 점검 안내</a>` : "";
    stage.innerHTML = `
      <p class="eyebrow">진단 결과</p>
      <h3 tabindex="-1" data-focus>${esc(node.title)}</h3>
      <p>${esc(node.lead)}</p>
      <h4>직접 해볼 수 있는 순서</h4>
      <ol class="mini-list">${tries}</ol>
      ${warn}
      <h4>자세한 방법은 이 가이드에</h4>
      <div class="link-list">${guides}</div>
      <div class="card bc-cta">
        <h4>직접 해결이 어려우면</h4>
        <p>${esc(cta.lead)}</p>
        <p class="muted">${esc(cta.price)}</p>
        <div class="button-row">
          <a class="btn primary" href="${KAKAO_URL}" target="_blank" rel="noopener noreferrer">카카오톡으로 증상 보내기</a>
          ${remoteLink}
          <a class="btn secondary" href="pricing.html">요금 안내</a>
        </div>
      </div>`;
  }

  function render() {
    const node = NODES[current];
    if (node.options) renderQuestion(node);
    else renderResult(node);
    renderTrail();
    backBtn.disabled = history.length === 0;
    resetBtn.hidden = history.length === 0;
    const focusEl = stage.querySelector("[data-focus]");
    if (focusEl && history.length) focusEl.focus({ preventScroll: false });
  }

  backBtn.addEventListener("click", () => {
    const last = history.pop();
    if (last) current = last.id;
    render();
  });
  resetBtn.addEventListener("click", () => {
    history = [];
    current = "start";
    render();
  });

  render();
})();
