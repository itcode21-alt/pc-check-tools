// games-data.js
const gameErrors = [
  {
    id: "valorant-error-59",
    relatedErrorCodePage: "error-code-vanguard-error.html",
    game: "발로란트",
    category: "런처/설치",
    errorCode: "Error 59 (VAN 오류)",
    title: "VAN 오류 - 게임 실행 불가",

    overview: "발로란트의 Vanguard 안티치트 드라이버 오류로 게임 시작이 불가능한 상태입니다. 드라이버 손상, 보안 소프트웨어 충돌, 관리자 권한 부족이 주요 원인입니다.",

    causes: [
      "Vanguard 드라이버가 손상되거나 완전히 설치되지 않아 안티치트 검사 실패",
      "Windows Defender 또는 타사 안티바이러스가 Vanguard 드라이버 차단",
      "최신 Windows 업데이트 후 드라이버 호환성 문제 발생",
      "Riot Client 게임 파일이 손상되어 VAN 검증 실패",
      "표준 사용자 계정으로 실행하여 관리자 권한 부족"
    ],

    solutions: [
      "**1단계 - Vanguard 재설치 (권장):**\n① 제어판 → '프로그램 제거' 접속\n② 'Riot Vanguard' 검색 및 선택 → 제거\n③ Riot Client 완전 종료\n④ Valorant 실행 → 자동 재설치 시작\n⑤ 설치 완료 후 재부팅",
      "**2단계 - 방화벽 예외 추가:**\n① Windows Defender 열기 → '방화벽 및 네트워크 보호'\n② '앱이 방화벽을 통해 통신하도록 허용' 클릭\n③ 'Riot Client.exe' 찾아 체크\n④ Vanguard 드라이버도 검색하여 예외 추가",
      "**3단계 - 게임 파일 검증:**\n① Riot Client 실행 → 오른쪽 위 톱니바퀴(설정) 클릭\n② '게임' 탭 → Valorant 선택\n③ '게임 데이터 재설치' 또는 '수리' 옵션 실행\n④ 전체 파일 재다운로드 진행 (시간 소요)",
      "**4단계 - 관리자 권한 실행:**\n① Riot Client.exe 또는 Valorant.exe 우클릭\n② '관리자 권한으로 실행' 선택\n③ 사용자 계정 컨트롤(UAC) 승인",
      "**5단계 - 타사 보안 프로그램 확인:**\n① Norton, McAfee, AVG 등 타사 백신 일시 중지\n② 또는 해당 프로그램 설정에서 Riot Client·Vanguard 예외 추가"
    ],

    officialSource: { title: "Riot Support: Error Codes and Solutions in VALORANT", url: "https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant" },
    communityReports: [
      { summary: "풀린 IT 블로그에 정리된 뱅가드 오류코드(43, 57, 59, 70, 79, 102, 185 등) 모음. 코드별로 원인이 갈리므로 정확한 코드를 먼저 확인하는 것이 중요합니다.", url: "https://it.pulin.co.kr/%EB%B0%9C%EB%A1%9C%EB%9E%80%ED%8A%B8-%EC%98%A4%EB%A5%98%EC%BD%94%EB%93%9C-%EC%A0%95%EB%A6%AC%EB%B1%85%EA%B0%80%EB%93%9C-43-57-59-70-79-102-185-%EC%99%B8-%EB%8B%A4%EC%88%98/" }
    ],
    keywords: ["발로란트", "Error 59", "VAN 오류", "Vanguard", "게임 실행 안됨"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "valorant-install-corrupt",
    game: "발로란트",
    category: "설치/패치",
    errorCode: "설치 파일 손상",
    title: "패치 다운로드 중단 및 파일 손상 오류",

    overview: "패치 다운로드가 특정 퍼센트에서 멈추거나, 다운로드 완료 후에도 '파일이 손상되었습니다' 오류로 실행이 안 되는 경우입니다.",

    causes: [
      "다운로드 도중 네트워크가 끊겨 패치 파일 일부가 손상된 경우",
      "디스크 여유 공간 부족으로 패치 파일이 불완전하게 기록된 경우",
      "보안 프로그램이 패치 파일을 검역소로 격리한 경우",
      "이전 설치 잔여 파일과 새 패치 파일이 충돌하는 경우"
    ],

    solutions: [
      "**1단계 - Riot Client 재시작:**\n① Riot Client 완전 종료(작업 관리자에서 프로세스 확인)\n② 재실행 후 패치 자동 재개 확인",
      "**2단계 - 디스크 공간 확보:**\n① 설치 드라이브에 최소 10GB 이상 여유 공간 확보\n② 불필요한 파일 정리 후 재시도",
      "**3단계 - 게임 데이터 복구:**\n① Riot Client 설정 → Valorant → '게임 데이터 재설치' 실행\n② 손상된 파일만 선택적으로 재다운로드",
      "**4단계 - 보안 프로그램 확인:**\n① 백신의 최근 격리 목록에서 Valorant/Riot 관련 파일이 있는지 확인\n② 격리 해제 후 재시도"
    ],

    officialSource: { title: "Riot Support: Error Codes and Solutions in VALORANT", url: "https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant" },
    communityReports: [],
    keywords: ["발로란트", "패치 오류", "설치 실패", "파일 손상"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "lol-client-crash",
    relatedErrorCodePage: "error-code-lol-patch-error.html",
    game: "리그 오브 레전드",
    category: "클라이언트",
    errorCode: "클라이언트 크래시",
    title: "롤 클라이언트 자동 종료",

    overview: "롤 클라이언트가 시작 중 또는 실행 중 갑자기 종료되는 현상입니다. GPU 드라이버 부적합, 메모리 부족, 클라이언트 파일 손상이 주요 원인입니다.",

    causes: [
      "Nvidia/AMD 그래픽 드라이버가 오래되어 최신 클라이언트와 호환되지 않는 경우",
      "권장 메모리보다 부족하거나 다른 프로그램이 메모리를 과점유하는 경우",
      "League of Legends 클라이언트 설치 파일이 손상된 경우",
      "임시 캐시 파일이 누적되어 메모리 부족을 유발하는 경우"
    ],

    solutions: [
      "**1단계 - 그래픽 드라이버 업데이트:**\n① Nvidia/AMD 공식 사이트에서 GPU 모델에 맞는 최신 드라이버 다운로드\n② '완전 설치'로 진행 후 재부팅",
      "**2단계 - 클라이언트 캐시 삭제:**\n① League of Legends 완전 종료\n② 탐색기 주소창에 %localappdata% 입력\n③ Riot Games → League of Legends → Caches 폴더 삭제 후 재실행",
      "**3단계 - 게임 데이터 복구(라이엇 정비소):**\n① Riot Client 설정(톱니바퀴) → League of Legends\n② '게임 데이터 확인/수리' 실행하여 손상 파일 자동 복구",
      "**4단계 - 배경 프로세스 종료:**\n① Ctrl+Shift+Esc로 작업 관리자 실행\n② 메모리 사용량이 큰 불필요한 프로그램 종료 후 재시도"
    ],

    officialSource: { title: "Riot Support: League Error Codes and Solutions", url: "https://support.riotgames.com/ko-kr/league-of-legends/performance/league-error-codes-and-solutions" },
    communityReports: [
      { summary: "OP.GG 톡피지지에 정리된 신 클라이언트 비정상 종료 대응법. 라이엇 정비소(Riot Repair Tool)로 재패치를 강제 수행하는 절차를 안내합니다.", url: "https://talk.op.gg/s/lol/tip/1461463/%EB%A1%A4-%EC%8B%A0-%ED%81%B4%EB%9D%BC%EC%9D%B4%EC%96%B8%ED%8A%B8-%EB%B9%84%EC%A0%95%EC%83%81%EC%A0%81%EC%9D%B8-%EC%98%A4%EB%A5%98-%ED%95%B4%EA%B2%B0%EB%B2%95" }
    ],
    keywords: ["롤", "클라이언트", "크래시", "종료", "실행 오류"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "lol-patch-stuck",
    game: "리그 오브 레전드",
    category: "설치/패치",
    errorCode: "패치 진행 불가",
    title: "패치가 완료되지 않거나 무한 로딩되는 문제",

    overview: "업데이트 진행률이 특정 지점에서 멈추거나 '패치가 완료되지 않았습니다' 메시지가 반복되는 경우입니다.",

    causes: [
      "서버와 클라이언트 간 패치 데이터 불일치",
      "인터넷 연결이 패치 도중 불안정해진 경우",
      "이전 패치의 잔여 파일이 새 패치와 충돌하는 경우"
    ],

    solutions: [
      "**1단계 - 클라이언트 재시작:**\n① 클라이언트를 완전히 종료 후 재실행\n② 인터넷 연결 상태 확인",
      "**2단계 - 라이엇 정비소(Riot Repair Tool) 사용:**\n① Riot Client 설정에서 복구 도구 실행\n② 관리자 권한으로 실행 필수 (우클릭 → 관리자 권한 실행)\n③ 언어를 Korean, 지역을 Korea로 설정 후 재패치 강제 수행(Force Repatch) 체크\n④ PC 사양에 따라 10~30분 이상 소요될 수 있음",
      "**3단계 - 재설치:**\n① 위 방법으로도 해결되지 않으면 클라이언트 완전 삭제 후 재설치"
    ],

    officialSource: { title: "Riot Support: Patching Issues", url: "https://support-leagueoflegends.riotgames.com/hc/en-us/articles/202969434-Patching-Issues" },
    communityReports: [
      { summary: "브런치에 정리된 마법공학 정비소(현재는 라이엇 정비소로 통합) 사용법과 재패치 강제 수행 절차.", url: "https://brunch.co.kr/@programdownload/10" }
    ],
    keywords: ["롤", "패치 오류", "업데이트 안됨", "무한로딩"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "lostark-connection-timeout",
    relatedErrorCodePage: "error-code-lostark-error.html",
    game: "로스트아크",
    category: "접속/네트워크",
    errorCode: "Connection Timeout",
    title: "로스트아크 접속 타임아웃",

    overview: "로스트아크 게임 서버 연결이 끊어져 '접속할 수 없습니다' 또는 '연결 시간 초과' 오류가 나타나는 상태입니다. ISP 차단, 라우터 문제, 방화벽 차단이 주요 원인입니다.",

    causes: [
      "Windows Defender 방화벽이 게임 프로세스를 차단하는 경우",
      "공유기(라우터)의 UPnP 미활성화 또는 QoS 제한",
      "Wi-Fi 연결 불안정 (유선 연결 권장)",
      "게임 서버 점검 중이거나 일시적 네트워크 장애"
    ],

    solutions: [
      "**1단계 - 방화벽 예외 추가:**\n① Windows Defender → '방화벽 및 네트워크 보호'\n② '앱이 방화벽을 통해 통신하도록 허용'\n③ LOSTARK.exe 검색 후 비공개/공개 모두 체크",
      "**2단계 - 유선 연결로 변경:**\n① Wi-Fi 대신 LAN 케이블로 유선 연결\n② 재접속 시도",
      "**3단계 - 클라이언트/런처 재시작:**\n① 작업 관리자에서 로스트아크·STOVE 클라이언트 프로세스를 모두 종료\n② STOVE 런처를 다시 실행한 뒤 게임 시작",
      "**4단계 - STOVE 검사 및 재설치:**\n① STOVE 런처의 '검사하기' 기능으로 파일 무결성 확인\n② 문제가 지속되면 STOVE·로스트아크 순서로 재설치"
    ],

    officialSource: null,
    communityReports: [
      { summary: "로아 인벤에 공유된 강제종료(튕김) 대응 정리 게시글. 클라이언트만 따로 강제 종료한 뒤 STOVE로 전환해 재시작하는 방법을 안내합니다.", url: "https://m.inven.co.kr/board/lostark/4821/83796" },
      { summary: "로스트아크 공식 Q&A 게시판에 올라온 '서버에 접속할 수 없습니다' 사례와 운영진·유저 답변.", url: "https://m-lostark.game.onstove.com/Library/Qa/Views/137949" }
    ],
    keywords: ["로스트아크", "접속", "타임아웃", "연결 안됨", "네트워크"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "lostark-gpu-driver-crash",
    relatedErrorCodePage: "error-code-lostark-error.html",
    game: "로스트아크",
    category: "그래픽/성능",
    errorCode: "게임 중 강제 종료",
    title: "그래픽 드라이버 충돌로 인한 크래시·렉",

    overview: "그래픽 드라이버 업데이트 이후 없던 렉이 생기거나, 특정 그래픽 효과가 몰리는 구간에서 게임이 강제 종료되는 경우입니다.",

    causes: [
      "그래픽 드라이버가 최신 게임 버전과 호환되지 않는 경우",
      "그래픽카드 오버클럭 설정이 불안정한 경우",
      "가상 메모리(페이지 파일)가 부족한 경우",
      "이전 크래시 리포트 파일이 계속 충돌을 유발하는 경우"
    ],

    solutions: [
      "**1단계 - 그래픽 드라이버 클린 재설치:**\n① 그래픽카드 제조사 최신 드라이버 다운로드\n② 기존 드라이버 완전 제거 후 재설치, 오버클럭은 순정값으로 되돌리기",
      "**2단계 - 가상 메모리 조정:**\n① 시스템 속성 → 고급 → 성능 옵션 → 가상 메모리\n② 권장 크기의 2배 수준으로 늘려 재부팅",
      "**3단계 - DirectX 최신화:**\n① Microsoft 공식 DirectX 최신 런타임 설치",
      "**4단계 - 크래시 리포트 파일 정리:**\n① 게임 설치 폴더에서 crashreport 관련 파일을 삭제(완전 삭제가 꺼려지면 휴지통으로 이동)"
    ],

    officialSource: null,
    communityReports: [
      { summary: "루리웹 사용자가 정리한 크래시 대응 시도 목록: 드라이버 순정화, 가상메모리 증설, 프레임생성 끄기, DirectX 최신 패치 등.", url: "https://m.ruliweb.com/family/4442/board/186738/read/5629" },
      { summary: "퀘이사존 그래픽카드 게시판의 실제 사례. 그래픽 드라이버 삭제 후 재설치로 해결된 사례가 반복적으로 보고됩니다.", url: "https://quasarzone.com/bbs/qf_vga/views/5032749" }
    ],
    keywords: ["로스트아크", "그래픽 드라이버", "크래시", "렉"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "pubg-crash-after-logo",
    relatedErrorCodePage: "error-code-easyanticheat-error.html",
    game: "배틀그라운드",
    category: "실행/설치",
    errorCode: "실행 중 비정상 종료",
    title: "PUBG 로고 화면 이후 크래시",

    overview: "게임을 실행하면 PUBG 로고까지는 뜨지만 이후 바로 비정상 종료되는 문제입니다. 공식 지원 문서에서도 대표적인 실행 오류로 안내하고 있습니다.",

    causes: [
      "게임 파일이 손상되었거나 최신 패치가 불완전하게 적용된 경우",
      "그래픽 드라이버가 오래된 경우",
      "백신·보안 프로그램이 실행 파일을 차단하는 경우",
      "메모리 부족(특히 저사양 PC)"
    ],

    solutions: [
      "**1단계 - 파일 무결성 검사:**\n① Steam 라이브러리에서 PUBG 우클릭 → 속성 → 로컬 파일 → '게임 파일 무결성 검사'",
      "**2단계 - 그래픽 드라이버 최신화:**\n① Nvidia/AMD 공식 사이트에서 최신 드라이버 설치",
      "**3단계 - 저사양 메모리 옵션:**\n① Steam 라이브러리 → PUBG 속성 → 시작 옵션에 -lowmemory 입력 후 재시작(RAM이 부족한 환경에서 크래시가 줄었다는 보고가 있음)",
      "**4단계 - 보안 프로그램 예외 추가:**\n① 백신 프로그램에서 TslGame.exe, PUBG.exe를 예외로 등록"
    ],

    officialSource: { title: "PUBG Support: Game crashes after the PUBG logo appears", url: "https://support.pubg.com/hc/en-us/articles/115004141033-Game-crashes-after-the-PUBG-logo-appears" },
    communityReports: [],
    keywords: ["배틀그라운드", "PUBG", "크래시", "실행 오류"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "pubg-lag-fps-drop",
    game: "배틀그라운드",
    category: "그래픽/성능",
    errorCode: "렉 · 프레임 드랍",
    title: "권장 사양 이상에서도 발생하는 렉과 프레임 드랍",

    overview: "권장 사양을 충족하는 PC에서도 순간적인 렉(순단)과 프레임 드랍이 발생하는 경우로, 네트워크·메모리·백그라운드 프로그램이 복합적으로 얽혀 있는 경우가 많습니다.",

    causes: [
      "다른 프로그램의 백그라운드 메모리 점유",
      "Windows의 게임 바(Game Bar)·Game DVR 오버레이가 리소스를 점유하는 경우",
      "가상 메모리 설정이 시스템 권장값보다 낮은 경우",
      "네트워크 대역폭을 다른 기기·프로그램이 점유하는 경우"
    ],

    solutions: [
      "**1단계 - Windows 게임 바·DVR 끄기:**\n① 설정 → 게임 → Xbox Game Bar를 끄고, Game DVR도 함께 비활성화",
      "**2단계 - 가상 메모리 조정:**\n① 시스템 속성 → 고급 → 성능 옵션에서 Windows 권장 가상 메모리 크기로 재설정",
      "**3단계 - 백그라운드 프로그램 정리:**\n① 게임 실행 전 불필요한 프로그램(브라우저, 다운로드 프로그램 등) 종료",
      "**4단계 - 저사양 메모리 옵션:**\n① -lowmemory 시작 옵션 적용 후 비교 테스트"
    ],

    officialSource: { title: "PUBG 공식: 프레임 드랍 및 순단 현상(렉) 안내", url: "https://kakaogames.oqupie.com/portals/2215/articles/51780" },
    communityReports: [
      { summary: "배틀그라운드 인벤 팁과노하우 게시판에 정리된 렉·프레임드랍 완화 설정 모음.", url: "https://www.inven.co.kr/board/battlegrounds/5074/3234" }
    ],
    keywords: ["배틀그라운드", "PUBG", "렉", "프레임 드랍"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "blackdesert-login-stuck-onedrive",
    game: "검은사막",
    category: "접속/실행",
    errorCode: "로딩 화면 멈춤",
    title: "접속 로딩 화면에서 멈추고 진입이 안 되는 문제",

    overview: "게임 접속을 위한 로딩 화면은 뜨지만 그 이후로 진행되지 않는 경우입니다. 펄어비스 공식 FAQ에 등록된 사례로, OneDrive 폴더 동기화가 원인인 경우가 있습니다.",

    causes: [
      "게임 관련 폴더가 OneDrive와 동기화되며 파일 접근이 지연되는 경우",
      "런처 또는 게임 클라이언트 파일이 손상된 경우",
      "네트워크 연결이 불안정한 경우"
    ],

    solutions: [
      "**1단계 - OneDrive 동기화 일시 중지 (공식 안내):**\n① 작업 표시줄의 OneDrive 아이콘 실행\n② 톱니바퀴 → '동기화 일시 중지' → 2시간 선택\n③ 설정 후 게임 재접속 시도",
      "**2단계 - 런처에서 클라이언트 복구:**\n① 검은사막 런처의 설정에서 '게임 복구/검사' 기능 실행",
      "**3단계 - 오류 보고 후 1:1 문의:**\n① 위 방법으로 해결되지 않으면 게임 내 오류 보고 기능으로 고유 ID를 생성해 펄어비스 고객센터에 문의"
    ],

    officialSource: { title: "펄어비스 공식 FAQ: 게임 접속을 위한 로딩 화면이 노출되지만 접속이 안 되는 경우", url: "https://support.pearlabyss.com/launcher/ko-KR/Faq/Home/Detail?_faqNo=238" },
    communityReports: [],
    keywords: ["검은사막", "로딩 멈춤", "접속 불가", "OneDrive"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "blackdesert-fps-drop-optimization",
    game: "검은사막",
    category: "그래픽/성능",
    errorCode: "프레임 드랍",
    title: "전투·혼잡 지역에서의 프레임 드랍",

    overview: "평상시에는 괜찮다가 전투나 사람이 몰리는 지역에서 프레임이 급격히 떨어지는 경우로, 미니맵·UI 렌더링 부하가 원인 중 하나로 자주 지목됩니다.",

    causes: [
      "2D 미니맵 등 UI 요소가 프레임 저하를 유발하는 경우",
      "그래픽 옵션 중 자동 최적화·저전력 옵션이 오히려 프레임을 제한하는 경우",
      "많은 캐릭터가 몰리는 구간에서 렌더링 부하가 급증하는 경우"
    ],

    solutions: [
      "**1단계 - 전투집중모드 활용:**\n① 설정 → UI 편집모드 → 전투집중모드 켜기\n② 필요한 인터페이스(채팅창, 미니맵 등)만 선택적으로 표시",
      "**2단계 - 성능 옵션 조정:**\n① 그래픽 설정에서 '자동 프레임 최적화'와 '저전력' 옵션을 끄고 '성능 최적화'는 켜기",
      "**3단계 - 그래픽 옵션 하단 최적화 설정 적용:**\n① 그래픽 설정 가장 아래의 최적화 설정 항목을 모두 적용"
    ],

    officialSource: null,
    communityReports: [
      { summary: "검은사막 인벤 팁과노하우 게시판의 프레임 최적화 정리글. 미니맵과 UI 렌더링이 프레임 저하의 주요 원인으로 지목됩니다.", url: "https://www.inven.co.kr/board/black/3584/1643" }
    ],
    keywords: ["검은사막", "프레임 드랍", "최적화", "렉"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "overwatch2-server-connection-failed",
    relatedErrorCodePage: "error-code-battlenet-error.html",
    game: "오버워치 2",
    category: "접속/네트워크",
    errorCode: "게임 서버 연결 실패",
    title: "\"게임 서버 연결 실패... 재시도 중\" 메시지",

    overview: "배틀넷에서 게임은 실행되지만 서버 연결에 반복적으로 실패하는 경우로, 블리자드 공식 고객지원 문서에 등록된 대표 오류입니다.",

    causes: [
      "네트워크 연결이 불안정하거나 일시적으로 끊긴 경우",
      "라우터·모뎀의 네트워크 설정 문제",
      "방화벽·보안 프로그램이 배틀넷 통신을 차단하는 경우",
      "블리자드 서버 측 일시적 장애"
    ],

    solutions: [
      "**1단계 - 네트워크 재설정:**\n① 공유기 재부팅\n② 유선 연결로 전환해 안정성 확인",
      "**2단계 - 배틀넷 앱 복구:**\n① 배틀넷 데스크톱 앱 → 설정 → '게임 설치/업데이트' → 스캔 및 복구 실행",
      "**3단계 - 방화벽 예외 등록:**\n① 방화벽에서 배틀넷·오버워치 실행 파일을 예외로 추가",
      "**4단계 - 블리자드 서버 상태 확인:**\n① 반복되면 블리자드 공식 서비스 상태 페이지에서 서버 점검 여부 확인"
    ],

    officialSource: { title: "블리자드 고객지원: 오버워치2 내 \"게임 서버 연결 실패... 재시도 중\" 메시지", url: "https://kr.battle.net/support/ko/article/143436" },
    communityReports: [],
    keywords: ["오버워치2", "서버 연결 실패", "재시도 중"],
    lastUpdated: "2026-07-14"
  },

  {
    id: "overwatch2-loading-stuck",
    game: "오버워치 2",
    category: "실행/로딩",
    errorCode: "로딩 화면 고착",
    title: "게임 진입 화면에서 멈추는 문제",

    overview: "배틀넷에서 게임을 실행했지만 '게임에 참가하는 중' 등 로딩 화면에서 진행되지 않는 경우입니다.",

    causes: [
      "네트워크 연결 상태가 불안정한 경우",
      "게임 파일 일부가 손상된 경우",
      "그래픽 드라이버가 오래된 경우",
      "백그라운드 프로그램이 리소스·네트워크 대역폭을 과점유하는 경우"
    ],

    solutions: [
      "**1단계 - 게임 파일 검사 및 복구:**\n① 배틀넷 앱에서 오버워치 2 선택 → 옵션 → '스캔 및 복구' 실행",
      "**2단계 - 그래픽 드라이버 업데이트:**\n① 그래픽카드 제조사 최신 드라이버로 업데이트",
      "**3단계 - 백그라운드 프로세스 정리:**\n① 작업 관리자에서 불필요한 프로그램 종료 후 재시도",
      "**4단계 - 명령줄 인수 추가(커뮤니티 팁):**\n① 배틀넷 게임 설정 → 오버워치 2 → 추가 명령줄 인수에 --tank_WorkerThreadCount 2 -thread 2 -d3d11 입력 후 테스트"
    ],

    officialSource: { title: "블리자드 고객지원: 오버워치 2 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/41969" },
    communityReports: [
      { summary: "오버워치 인벤 질문과 답변 게시판에 올라온 배틀넷 앱 무한로딩 사례와 유저 답변.", url: "https://www.inven.co.kr/board/overwatch/4676/38237" }
    ],
    keywords: ["오버워치2", "로딩 고착", "진입 안됨"],
    lastUpdated: "2026-07-14"
  }
];

const gameSymptoms = [
  {
    id: "game-crash",
    name: "게임 자동 종료",
    games: ["발로란트", "롤", "로스트아크", "배틀그라운드"],
    description: "게임 시작 중이나 진행 중 갑자기 튕김"
  },
  {
    id: "game-lag",
    name: "심한 렉 (Lag)",
    games: ["로스트아크", "검은사막", "오버워치 2"],
    description: "프레임 드롭, 끊김 현상 반복"
  },
  {
    id: "fps-drop",
    name: "프레임 드롭 (FPS 저하)",
    games: ["발로란트", "롤", "배틀그라운드", "오버워치 2"],
    description: "게임 중 갑자기 프레임이 떨어짐"
  },
  {
    id: "connection-lost",
    name: "연결 끊김",
    games: ["로스트아크", "검은사막", "오버워치 2"],
    description: "게임 중 서버 연결이 끊어짐"
  }
];

const gameBrands = [
  { id: "valorant", name: "발로란트", developer: "라이엇 게임즈" },
  { id: "lol", name: "리그 오브 레전드", developer: "라이엇 게임즈" },
  { id: "lostark", name: "로스트아크", developer: "스마일게이트 RPG" },
  { id: "battlegrounds", name: "배틀그라운드", developer: "크래프톤" },
  { id: "blackdesert", name: "검은사막", developer: "펄 어비스" },
  { id: "maplestory", name: "메이플스토리", developer: "넥슨" },
  { id: "dfo", name: "던전앤파이터", developer: "넥슨" },
  { id: "overwatch2", name: "오버워치 2", developer: "블리자드" },
  { id: "diablo4", name: "디아블로 4", developer: "블리자드" }
];
