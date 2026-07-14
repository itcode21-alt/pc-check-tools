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
,
  {
    id: "maplestory-error-recovery",
    game: "메이플스토리",
    category: "실행/설치",
    errorCode: "로그인·패치·실행 실패",
    title: "넥슨 에러복구프로그램으로 해결하는 로그인·패치·실행 오류",

    overview: "넥슨 로그인이 실패하거나, 넥슨 모듈 패치·게임 실행 및 패치 도중 오류가 발생하는 경우입니다. 넥슨은 이런 증상 전반을 위한 공식 에러복구프로그램을 제공하고 있습니다.",

    causes: [
      "넥슨 모듈(플러그인) 패치가 불완전하게 적용된 경우",
      "이전 실행 중이던 메이플 관련 프로세스가 남아 충돌하는 경우",
      "DNS 캐시가 오래되어 로그인 서버 접속이 지연되는 경우",
      "넥슨 게임매니저나 관련 구성 요소가 손상된 경우"
    ],

    solutions: [
      "**1단계 - 넥슨 에러복구프로그램 실행 (공식 권장):**\n① 넥슨 고객센터 다운로드 페이지에서 에러복구프로그램(NexonRepair.exe)을 받으세요.\n② 실행 전 작업 중인 다른 프로그램을 저장하세요.\n③ 실행하면 자동으로 복구가 진행됩니다.\n④ 완료 후 메이플스토리 홈페이지에서 다시 게임을 실행하세요.",
      "**2단계 - 남은 프로세스 강제 종료:**\n① 작업 관리자(Ctrl+Shift+Esc) 실행\n② 프로세스 목록에서 메이플 관련 실행 파일을 찾아 강제 종료\n③ 메이플스토리를 다시 실행",
      "**3단계 - DNS 캐시 초기화:**\n① Windows 키+R → cmd 입력 후 실행\n② ipconfig /flushdns 명령어 입력\n③ 다시 로그인 시도",
      "**4단계 - 지정PC 서비스 이용 중이라면:**\n① 에러복구프로그램 설치 후 지정PC 재등록이 필요할 수 있습니다."
    ],

    officialSource: { title: "넥슨 고객센터: 에러복구프로그램", url: "https://help.nexon.com/download/restore" },
    communityReports: [
      { summary: "메이플스토리 인벤 질문과 답변 게시판에 올라온 실행 오류 사례와 유저 답변 모음.", url: "https://www.inven.co.kr/board/maple/5974/4471421" }
    ],
    keywords: ["메이플스토리", "로그인 실패", "패치 오류", "실행 안됨", "에러복구프로그램"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "maplestory-wifi-disconnect",
    game: "메이플스토리",
    category: "접속/네트워크",
    errorCode: "무선랜 연결 시 튕김",
    title: "Wi-Fi(무선랜)로 접속할 때만 반복되는 튕김 현상",

    overview: "유튜브 등 다른 인터넷 사용은 멀쩡한데 메이플스토리만 반복적으로 튕기는 경우로, 무선 어댑터의 절전·모드 설정이 원인인 경우가 커뮤니티에서 자주 보고됩니다.",

    causes: [
      "무선랜 어댑터의 절전 관리 옵션이 켜져 있어 연결이 끊기는 경우",
      "무선 모드(802.11 표준)가 공유기와 맞지 않는 경우",
      "무선 신호 자체가 불안정한 환경인 경우"
    ],

    solutions: [
      "**1단계 - 무선랜 어댑터 설정 변경 (커뮤니티 검증 방법):**\n① 장치 관리자 → 네트워크 어댑터 → 사용 중인 무선랜 어댑터 우클릭 → 속성\n② 고급 탭에서 무선 모드를 IEEE 802.11b/g/n으로 변경\n③ 전원 관리 탭에서 '전원 절약을 위해 이 장치를 끌 수 있음' 체크 해제",
      "**2단계 - 유선 연결로 전환:**\n① 가능하다면 LAN 케이블로 유선 연결해 재현 여부 확인",
      "**3단계 - 넥슨 에러복구프로그램 실행:**\n① 위 설정으로도 반복되면 에러복구프로그램을 먼저 실행해보세요.",
      "**4단계 - 공유기 재시작:**\n① 공유기를 재부팅한 뒤 재접속 시도"
    ],

    officialSource: null,
    communityReports: [
      { summary: "메이플스토리 인벤 팁과노하우 게시판에 정리된 무선랜카드 연결 시 튕김 현상 해결법.", url: "https://www.inven.co.kr/board/maple/2304/33396" }
    ],
    keywords: ["메이플스토리", "와이파이", "튕김", "무선랜", "접속 끊김"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "dnf-runtime-error",
    game: "던전앤파이터",
    category: "실행/설치",
    errorCode: "런타임 오류 (Runtime Error)",
    title: "던전앤파이터 실행 중 런타임 오류 발생",

    overview: "던전앤파이터 실행 중 런타임 오류(runtime error)가 발생하는 경우로, 넥슨 공식 FAQ에 등록된 대표 오류입니다. 프로그램 충돌이나 메모리 부족이 주요 원인으로 안내되고 있습니다.",

    causes: [
      "그래픽카드에 맞지 않는 드라이버 설치 또는 드라이버 중복 설치",
      "PC 사양과 맞지 않는 그래픽 설정 적용",
      "시작 프로그램·백그라운드 프로세스의 메모리 과점유",
      "바이러스·악성코드 감염",
      "설치/패치 과정에서 클라이언트가 손상되었거나 레지스트리를 임의로 조작한 경우"
    ],

    solutions: [
      "**1단계 - 그래픽 드라이버 재설치 (공식 권장):**\n① 기존 그래픽 드라이버를 완전히 삭제\n② 그래픽카드 제조사 최신 드라이버 재설치\n③ 별도 그래픽 설정을 적용하지 않은 기본 상태로 게임 실행",
      "**2단계 - 불필요한 프로그램 정리:**\n① 작업 관리자(Ctrl+Alt+Del) → 시작 앱에서 불필요한 프로그램 '사용 안 함'\n② 프로세스 탭에서 불필요한 프로그램 종료",
      "**3단계 - 바이러스·악성코드 검사:**\n① 최신 업데이트된 백신으로 정밀 검사 및 치료 진행",
      "**4단계 - 클라이언트 재설치:**\n① 위 방법으로도 반복되면 게임을 완전히 삭제한 뒤 재설치"
    ],

    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [],
    keywords: ["던전앤파이터", "던파", "런타임 오류", "실행 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "dnf-black-screen-stuck",
    game: "던전앤파이터",
    category: "실행/설치",
    errorCode: "실행 후 검은 화면 고착",
    title: "실행하면 검은 화면만 나오고 다음으로 넘어가지 않음",

    overview: "던전앤파이터를 실행했을 때 검은 화면만 나오고 그 이후로 진행되지 않는 경우로, 그래픽 설정이나 PC·그래픽 메모리 부족이 넥슨 공식 FAQ에서 안내하는 주요 원인입니다.",

    causes: [
      "그래픽 관련 가속 설정(DirectDraw, Direct3D, AGP 텍스쳐 가속)이 꺼져 있는 경우",
      "그래픽 드라이버가 최신이 아니거나 설정이 임의로 변경된 경우",
      "PC 또는 그래픽 메모리가 부족한 경우"
    ],

    solutions: [
      "**1단계 - DXDIAG로 그래픽 가속 설정 확인 (공식 권장):**\n① 시작 메뉴에서 'DXDIAG' 검색 후 실행\n② 디스플레이 탭에서 DirectDraw 가속, Direct3D 가속, AGP 텍스쳐 가속이 모두 사용 설정되어 있는지 확인\n③ 사용되지 않는 항목이 있으면 그래픽 드라이버 재설치 후 다시 확인",
      "**2단계 - 그래픽 드라이버 초기화 후 재설치:**\n① NVIDIA·RADEON·intel 그래픽 드라이버 설정을 임의로 조정한 적이 있다면 모두 초기화\n② 드라이버 재설치 후 재시도",
      "**3단계 - 던전앤파이터 화면 모드 설정 변경 (공식 팁):**\n① 메모장에서 C:\\Users\\(윈도우계정명)\\AppData\\LocalLow\\DNF\\DNF.cfg 파일 열기\n② CONFIG_COMMON_SCREEN_MODE=2를 CONFIG_COMMON_SCREEN_MODE=3으로 변경\n③ 저장 후 게임 재시작"
    ],

    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [],
    keywords: ["던전앤파이터", "던파", "검은 화면", "실행 안됨", "먹통"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "diablo4-fenris-app-error",
    game: "디아블로 4",
    category: "실행/설치",
    errorCode: "Fenris 오류 · 응용 프로그램 오류",
    title: "게임 실행 시 Fenris 오류 또는 응용 프로그램 오류로 실행 불가",

    overview: "디아블로 4를 실행하면 Fenris 오류나 응용 프로그램 오류가 발생하며 게임이 열리지 않는 경우입니다. 블리자드 공식 포럼에서 안내하는 대표적인 실행 실패 유형입니다.",

    causes: [
      "그래픽카드 드라이버가 손상되었거나 최신 게임 버전과 호환되지 않는 경우",
      "게임 파일 일부가 손상된 경우",
      "그래픽 드라이버나 운영체제가 오래되어 호환성 문제가 발생하는 경우"
    ],

    solutions: [
      "**1단계 - 그래픽 드라이버 클린 재설치 (공식 권장):**\n① DDU(Display Driver Uninstaller) 또는 AMD Cleanup Utility로 기존 드라이버를 완전히 삭제\n② 그래픽카드 제조사 최신 드라이버 재설치",
      "**2단계 - 복구 도구 실행:**\n① Battle.net 앱에서 디아블로 4 선택 → 옵션 → 스캔 및 복구 실행으로 손상된 게임 파일 복구",
      "**3단계 - 드라이버·운영체제 업데이트:**\n① Windows 업데이트를 최신 상태로 유지\n② 칩셋·그래픽 드라이버를 모두 최신 버전으로 업데이트",
      "**4단계 - 재설치:**\n① 위 방법이 모두 실패하면 게임을 완전히 삭제한 뒤 재설치"
    ],

    officialSource: { title: "블리자드 고객지원: 디아블로 IV 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/360013" },
    communityReports: [],
    keywords: ["디아블로4", "디아블로 IV", "Fenris", "응용 프로그램 오류", "실행 안됨"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "diablo4-code-395002",
    game: "디아블로 4",
    category: "접속/네트워크",
    errorCode: "코드 395002",
    title: "로그인 시도가 반복되어 계정이 일시 잠기는 코드 395002",

    overview: "로그인을 여러 번 반복 시도했을 때 서버가 계정 자격 증명을 검증하지 못하며 나타나는 인증 오류입니다. 확장팩 출시 등으로 서버가 몰릴 때 특히 자주 보고됩니다.",

    causes: [
      "짧은 시간 안에 로그인을 반복 시도해 일시적으로 잠금 처리된 경우",
      "서버 접속이 몰려 인증 처리가 지연되는 경우",
      "Battle.net 런처의 캐시 파일이 손상된 경우",
      "무선 네트워크 연결이 불안정한 경우"
    ],

    solutions: [
      "**1단계 - 잠시 대기 후 재시도:**\n① 반복 로그인 시도로 인한 일시 잠금이므로 몇 분 정도 기다린 뒤 다시 시도하세요.",
      "**2단계 - Battle.net 캐시 삭제:**\n① Battle.net 런처 설정에서 캐시 삭제 옵션 실행\n② 컴퓨터와 런처를 모두 재시작",
      "**3단계 - 계정 상태 확인:**\n① 웹 브라우저로 Battle.net 계정에 직접 로그인해 계정 제한이나 결제 문제가 없는지 확인",
      "**4단계 - 유선 네트워크로 전환:**\n① Wi-Fi 대신 유선(이더넷) 연결로 바꿔 재접속 시도"
    ],

    officialSource: null,
    communityReports: [
      { summary: "디아블로4 인벤 자유 게시판에 올라온 코드 395002 오류 사례와 유저 답변.", url: "https://www.inven.co.kr/board/diablo4/6025/9610" }
    ],
    keywords: ["디아블로4", "코드 395002", "로그인 실패", "계정 잠김"],
    lastUpdated: "2026-07-15"
  },
  {
    id: "valorant-van51",
    game: "발로란트",
    category: "런처/설치",
    errorCode: "VAN 51",
    title: "VAN 51 오류로 게임 실행 불가",

    overview: "발로란트 실행 시 VAN 51 오류가 발생하며 게임이 켜지지 않는 경우입니다. VAN으로 시작하는 코드는 Vanguard 안티치트 드라이버가 현재 시스템 설정과 맞지 않을 때 나타납니다.",

    causes: ["Vanguard 드라이버가 정상적으로 초기화되지 않은 경우", "라이엇 클라이언트나 Vanguard가 관리자 권한 없이 실행된 경우", "최근 Windows 업데이트로 드라이버 호환성이 깨진 경우", "이전에 설치된 Vanguard 잔여 파일이 새 설치와 충돌하는 경우"],

    solutions: ["**1단계 - PC 재부팅 (공식 1순위 조치):**\n① 발로란트·라이엇 클라이언트를 모두 종료\n② PC를 완전히 재부팅한 뒤 다시 실행", "**2단계 - 관리자 권한으로 재실행:**\n① 라이엇 클라이언트·Vanguard를 관리자 권한으로 실행\n② 사용자 계정 컨트롤(UAC) 승인", "**3단계 - Vanguard 제거 후 자동 재설치:**\n① 제어판에서 'Riot Vanguard' 제거\n② 발로란트를 다시 실행하면 자동으로 재설치됨", "**4단계 - 그래도 안 되면 문의:**\n① 라이엇 공식 지원 페이지 하단의 문의하기로 오류 코드와 함께 접수"],

    officialSource: { title: "VALORANT 고객지원: 오류 코드", url: "https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant" },
    communityReports: [
      { summary: "발로란트 에러 코드 51에 대한 원인과 단계별 해결 가이드.", url: "https://bo3.gg/ko/valorant/articles/error-51-fix-in-valorant-detailed-guide" }
    ],
    keywords: ["발로란트", "VAN51", "뱅가드", "실행 불가"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "valorant-ping-lag",
    game: "발로란트",
    category: "그래픽/성능",
    errorCode: "핑 튐 · 네트워크 렉",
    title: "핑이 순간적으로 치솟거나 판정이 늦는 네트워크 렉",

    overview: "평균 핑은 낮은데 순간적으로 핑이 치솟거나 패킷이 누락되어 적이 순간이동하거나 판정이 늦게 반영되는 증상입니다. 그래픽 옵션보다 네트워크 안정성 문제인 경우가 대부분입니다.",

    causes: ["무선(Wi-Fi) 연결에서 신호 간섭으로 핑이 튀는 경우", "게임 중 다운로드·클라우드 동기화가 대역폭을 점유하는 경우", "공유기 상태가 오래되어 일시적으로 불안정한 경우", "자동 매치로 먼 지역 서버가 선택된 경우"],

    solutions: ["**1단계 - 유선 연결로 전환:**\n① 랜선으로 유선 연결해 무선 신호 간섭 제거", "**2단계 - 배경 작업 종료:**\n① 다운로드, 클라우드 동기화, 스트리밍 프로그램을 게임 중 종료", "**3단계 - 공유기 재시작:**\n① 공유기 전원을 껐다 켜서 상태 초기화", "**4단계 - 서버 지역 확인:**\n① 게임 내 서버 선택에서 가장 가까운 지역으로 고정"],

    officialSource: null,
    communityReports: [
      { summary: "발로란트 핑 튐·패킷 손실·네트워크 렉을 진단하고 낮추는 방법을 정리한 글.", url: "https://rakusungji.com/entry/%EB%B0%9C%EB%A1%9C%EB%9E%80%ED%8A%B8-%ED%95%91-%EB%82%AE%EC%B6%94%EB%8A%94-%EB%B0%A9%EB%B2%95-%EB%A0%89-%EC%97%86%EC%9D%B4-%EC%BE%8C%EC%A0%81%ED%95%98%EA%B2%8C-%ED%94%8C%EB%A0%88%EC%9D%B4%ED%95%98%EB%8A%94-%EC%84%A4%EC%A0%95" }
    ],
    keywords: ["발로란트", "핑", "렉", "네트워크", "지연"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "valorant-graphics-driver-crash",
    game: "발로란트",
    category: "그래픽/성능",
    errorCode: "그래픽 드라이버 충돌",
    title: "\"그래픽 드라이버 충돌이 발생했습니다\" 크래시",

    overview: "게임 도중 그래픽 드라이버 충돌 메시지와 함께 발로란트가 강제 종료되는 증상입니다. 라이엇은 드라이버 재설치와 프레임 제한을 기본 대응으로 안내하고 있습니다.",

    causes: ["그래픽 드라이버가 오래되었거나 손상된 경우", "그래픽카드 오버클럭이나 램 오버클럭(XMP)이 불안정한 경우", "GeForce Experience 등 오버레이 프로그램과 충돌하는 경우", "드물게 그래픽카드 자체의 하드웨어 결함인 경우"],

    solutions: ["**1단계 - 그래픽 드라이버 재설치 (공식 권장):**\n① DDU로 기존 드라이버를 완전히 제거\n② 그래픽카드 제조사 최신 드라이버 재설치", "**2단계 - 인게임 프레임 제한:**\n① 설정에서 최대 프레임을 모니터 주사율 수준으로 제한", "**3단계 - 오버클럭 해제:**\n① 램 XMP·그래픽카드 오버클럭을 순정값으로 되돌리기", "**4단계 - 오버레이 프로그램 제거:**\n① GeForce Experience 등 오버레이 프로그램을 제거한 뒤 재현 여부 확인"],

    officialSource: { title: "VALORANT Support: Troubleshooting Game Crashes", url: "https://support.riotgames.com/en-us/valorant/support-tools/troubleshooting-game-crashes-in-valorant" },
    communityReports: [],
    keywords: ["발로란트", "그래픽 드라이버", "충돌", "크래시"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lol-server-connection",
    game: "리그 오브 레전드",
    category: "접속/네트워크",
    errorCode: "서버에 연결할 수 없습니다",
    title: "\"서버에 연결할 수 없습니다\" 접속 오류",

    overview: "클라이언트 로그인이나 게임 진입 시 서버 연결에 실패하는 경우로, 라이엇 공식 지원 문서에서 DNS·IPv6·TCP/IP 설정을 기본 점검 항목으로 안내하고 있습니다.",

    causes: ["공용 DNS가 아닌 통신사 DNS 응답이 불안정한 경우", "IPv6가 활성화되어 IPv4 기반 클라이언트와 간헐적으로 충돌하는 경우", "TCP/IP 설정이 변경되어 연결이 불안정한 경우"],

    solutions: ["**1단계 - 기본 조치:**\n① 클라이언트를 완전히 종료 후 재부팅\n② 인터넷 연결 상태 확인", "**2단계 - 공용 DNS로 변경:**\n① 네트워크 어댑터 설정에서 DNS를 8.8.8.8 등 공용 DNS로 변경", "**3단계 - IPv6 비활성화:**\n① 네트워크 어댑터 속성에서 인터넷 프로토콜 버전 6(IPv6) 체크 해제", "**4단계 - TCP/IP 초기화:**\n① 명령 프롬프트(관리자)에서 netsh winsock reset 입력 후 재부팅"],

    officialSource: { title: "Riot Games Support: Basic Connections Troubleshooting Guide", url: "https://support.riotgames.com/en-us/league-of-legends/connectivity/basic-connections-troubleshooting-guide" },
    communityReports: [
      { summary: "롤 서버 연결 불가 오류에 대한 인벤 질문과 답변 게시판 사례.", url: "https://www.inven.co.kr/board/lol/2772/2295" }
    ],
    keywords: ["롤", "서버 연결 불가", "PVP.net", "접속 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lol-firewall-block",
    game: "리그 오브 레전드",
    category: "접속/네트워크",
    errorCode: "방화벽 차단으로 인한 연결 실패",
    title: "방화벽·백신 프로그램이 롤 서버 연결을 차단하는 문제",

    overview: "Windows Defender 방화벽이나 타사 백신이 리그 오브 레전드의 서버 통신을 차단해 접속·패치가 진행되지 않는 경우입니다.",

    causes: ["방화벽이 클라이언트·게임 실행 파일을 차단 목록에 올린 경우", "타사 백신이 실시간 감시로 통신을 가로채는 경우", "네트워크 어댑터 드라이버가 오래되어 연결이 불안정한 경우"],

    solutions: ["**1단계 - 방화벽 임시 비활성화 테스트:**\n① Windows Defender 방화벽을 잠시 끄고 실행해 재현 여부 확인\n② 정상 작동하면 다시 켜고 롤 실행 파일을 예외로 추가", "**2단계 - 백신 예외 등록:**\n① 사용 중인 백신 프로그램에서 리그 오브 레전드 설치 폴더를 예외로 등록", "**3단계 - 네트워크 어댑터 드라이버 업데이트:**\n① 장치 관리자 → 네트워크 어댑터 → 드라이버 업데이트 실행"],

    officialSource: { title: "Riot Games Support: Advanced Connections Troubleshooting Guide", url: "https://support.riotgames.com/en-us/league-of-legends/connectivity/advanced-connections-troubleshooting-guide" },
    communityReports: [],
    keywords: ["롤", "방화벽", "백신", "연결 차단"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lol-audio-not-working",
    game: "리그 오브 레전드",
    category: "그래픽/성능",
    errorCode: "인게임 소리 안 나옴",
    title: "픽창·인게임에서 소리가 나오지 않는 문제",

    overview: "다른 프로그램은 소리가 정상인데 롤 클라이언트나 인게임에서만 소리가 안 나오는 경우로, 볼륨 설정이나 오디오 장치 설정이 원인인 경우가 많습니다.",

    causes: ["인게임 마스터 볼륨이 100일 때 오디오 장치와 충돌하는 경우", "설정에서 소리 옵션이 꺼져 있는 경우", "전면 패널 오디오 단자 설정이 원인인 경우"],

    solutions: ["**1단계 - 마스터 볼륨 조정:**\n① 인게임 설정에서 마스터 볼륨을 100에서 99로 낮춰보기", "**2단계 - 소리 설정 확인:**\n① 클라이언트 우측 상단 설정에서 소리 옵션이 켜져 있는지 확인", "**3단계 - 전면 패널 오디오 설정 변경:**\n① 사운드 설정에서 전면 패널 오디오 감지를 '사용 안 함'으로 변경 후 재확인"],

    officialSource: { title: "League of Legends Support: Voice Chat Troubleshooting", url: "https://support.riotgames.com/en-us/league-of-legends/performance/league-voice-chat-troubleshooting" },
    communityReports: [
      { summary: "롤 인게임 소리가 안 들리는 문제의 간단 해결법을 정리한 인벤 게시글.", url: "https://www.inven.co.kr/board/lol/2778/69614" }
    ],
    keywords: ["롤", "소리 안남", "오디오", "인게임"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lostark-crash-security-conflict",
    game: "로스트아크",
    category: "그래픽/성능",
    errorCode: "게임 중 강제 종료",
    title: "이유 없이 반복되는 강제 종료(튕김·강종)",

    overview: "특별한 조작 없이도 게임이 갑자기 강제 종료되는 증상으로, 보안 프로그램 충돌이나 블루투스 모듈 등 커뮤니티에서 여러 원인이 확인된 사례입니다.",

    causes: ["보안 프로그램(게임가드, 백신)이 게임 프로세스와 충돌하는 경우", "메인보드 내장 블루투스 모듈이 간섭을 일으키는 경우", "방화벽이 로스트아크 통신을 일부 차단하는 경우", "윈도우 버전 호환성 문제(특정 빌드에서 접속 중 종료)"],

    solutions: ["**1단계 - 보안 프로그램 예외 등록:**\n① 백신의 '바이러스 및 위협 방지'에서 로스트아크 게임 폴더를 예외로 등록", "**2단계 - 블루투스 모듈 끄기:**\n① 장치 관리자에서 내장 블루투스 어댑터를 비활성화한 뒤 재현 여부 확인", "**3단계 - 방화벽 허용 프로그램 추가:**\n① 방화벽 설정의 허용 프로그램 목록에 로스트아크 실행 파일 추가", "**4단계 - Windows 업데이트 확인:**\n① Windows를 최신 버전으로 업데이트한 뒤 재현 여부 확인"],

    officialSource: null,
    communityReports: [
      { summary: "로스트아크 인벤에 정리된 게임중 강제종료(튕김) 문제 해결 방법 공유 글.", url: "https://m.inven.co.kr/board/lostark/4821/83796" },
      { summary: "로스트아크 인벤 팁과 노하우 게시판의 '이유없이 튕기고 강종' 대응 필독 글.", url: "https://www.inven.co.kr/board/lostark/4821/74252" }
    ],
    keywords: ["로스트아크", "강제종료", "튕김", "강종"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lostark-stove-login-error",
    game: "로스트아크",
    category: "접속/실행",
    errorCode: "STOVE 로그인 오류",
    title: "STOVE 클라이언트 로그인이 안 되는 문제",

    overview: "로스트아크 실행에 필요한 STOVE 클라이언트에서 로그인이 반복적으로 실패하는 경우입니다. 홈페이지 경유 로그인이나 일회용 로그인으로 우회하는 방법이 커뮤니티에서 공유되고 있습니다.",

    causes: ["STOVE 클라이언트 자체의 일시적 로그인 오류", "여러 로그인 수단(넷마블·페이스북·네이버 등) 계정 연동 문제", "STOVE 클라이언트가 완전히 종료되지 않은 상태로 남아있는 경우"],

    solutions: ["**1단계 - 홈페이지 경유 로그인:**\n① 로스트아크 공식 홈페이지에서 먼저 로그인 후 'GAME START' 클릭", "**2단계 - 일회용 로그인 이용:**\n① STOVE 앱 우측 상단 메뉴 → 보안설정 → 일회용 로그인으로 접속", "**3단계 - STOVE 클라이언트 완전 종료 후 재시도:**\n① 작업 관리자에서 STOVE 관련 프로세스를 모두 종료한 뒤 다시 로그인"],

    officialSource: null,
    communityReports: [
      { summary: "STOVE 오류로 로그인이 안 될 때의 대처 팁을 정리한 로스트아크 인벤 게시글.", url: "https://www.inven.co.kr/board/lostark/4821/85675" }
    ],
    keywords: ["로스트아크", "스토브", "로그인 오류", "STOVE"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "lostark-graphics-glitch",
    game: "로스트아크",
    category: "그래픽/성능",
    errorCode: "화면 깨짐",
    title: "로딩 화면이나 인게임 화면이 깨져 보이는 문제",

    overview: "특정 화면에서 그래픽이 깨지거나 노이즈가 보이는 증상으로, 그래픽카드 상태나 해상도 설정, 그래픽 옵션이 원인인 경우가 많습니다.",

    causes: ["그래픽카드 상태가 불안정하거나 드라이버가 오래된 경우", "모니터 자체 불량으로 다른 화면에서도 깨짐이 나타나는 경우", "21:9 등 와이드 해상도 설정이 잘못 적용된 경우", "그림자·파티클 등 그래픽 옵션이 시스템과 맞지 않는 경우"],

    solutions: ["**1단계 - 다른 화면(바탕화면)과 비교:**\n① 바탕화면에서도 깨짐이 보이면 모니터·케이블 문제이므로 그쪽부터 점검", "**2단계 - 해상도 설정 확인:**\n① 전체화면 해상도와 모니터 비율(21:9 등)이 올바르게 설정되어 있는지 확인", "**3단계 - 그래픽 옵션 조정:**\n① 그림자 품질을 낮추고 파티클 최적화를 켜서 재현 여부 확인", "**4단계 - 그래픽 드라이버 업데이트:**\n① 그래픽카드 제조사 최신 드라이버로 업데이트 후 재시도"],

    officialSource: null,
    communityReports: [
      { summary: "로스트아크 화면깨짐 현상에 대한 원인 진단과 대처법을 다룬 Q&A 게시글.", url: "https://lostark.game.onstove.com/Library/Qa/Views/128897" }
    ],
    keywords: ["로스트아크", "화면 깨짐", "그래픽 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "pubg-easyanticheat-error",
    game: "배틀그라운드",
    category: "런처/설치",
    errorCode: "EasyAntiCheat 오류",
    title: "안티치트 오류로 게임이 켜지지 않는 문제",

    overview: "배틀그라운드 실행 시 안티치트(EasyAntiCheat) 오류로 게임 자체가 켜지지 않거나 실행 중 튕기는 경우입니다. 드라이버 충돌이나 손상된 게임 파일이 주요 원인입니다.",

    causes: ["그래픽·보안 드라이버가 안티치트와 충돌하는 경우", "다른 게임의 보안 모듈이 동시에 실행되어 충돌하는 경우", "게임 파일 일부가 손상된 경우"],

    solutions: ["**1단계 - 보안 프로그램 정리:**\n① 백신이나 다른 게임의 보안 모듈을 모두 종료한 뒤 실행", "**2단계 - 게임 파일 무결성 검사:**\n① Steam 라이브러리에서 배틀그라운드 우클릭 → 속성 → 로컬 파일 → 게임 파일 무결성 검사", "**3단계 - 관리자 권한으로 실행:**\n① 게임 실행 파일을 관리자 권한으로 실행", "**4단계 - 안티치트 재설치:**\n① 위 방법으로 해결되지 않으면 게임을 완전히 삭제한 뒤 재설치해 안티치트도 함께 재설치되도록 진행"],

    officialSource: null,
    communityReports: [
      { summary: "배틀그라운드 안티치트 오류 해결 방법을 정리한 글.", url: "https://mbuddy100.com/%EB%B0%B0%EA%B7%B8-%EC%95%88%ED%8B%B0%EC%B9%98%ED%8A%B8-%EC%98%A4%EB%A5%98-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EB%B2%95-%EC%B4%9D%EC%A0%95%EB%A6%AC/" }
    ],
    keywords: ["배틀그라운드", "PUBG", "이지안티치트", "실행 불가"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "pubg-update-download-fail",
    game: "배틀그라운드",
    category: "런처/설치",
    errorCode: "업데이트/다운로드 실패",
    title: "\"게임 클라이언트를 업데이트해야 합니다\" 메시지와 함께 접속 불가",

    overview: "스팀 업데이트가 정상적으로 진행되지 않아 접속이 막히는 경우로, 무결성 검사나 캐시 정리로 해결되는 경우가 많습니다.",

    causes: ["스팀 업데이트 파일이 다운로드 도중 손상된 경우", "스팀 다운로드 캐시가 오래되어 충돌하는 경우", "런처 실행 파일 자체에 문제가 생긴 경우"],

    solutions: ["**1단계 - 게임 파일 무결성 검사:**\n① Steam 라이브러리 → 배틀그라운드 우클릭 → 속성 → 로컬 파일 → 게임 파일 무결성 검사", "**2단계 - 스팀 다운로드 캐시 지우기:**\n① Steam 설정 → 다운로드 → 다운로드 캐시 지우기 실행", "**3단계 - 런처 수동 다운로드:**\n① 런처 오류가 지속되면 런처를 수동으로 다시 받아 설치", "**4단계 - 재설치:**\n① 위 방법으로도 해결되지 않으면 완전히 삭제 후 재설치"],

    officialSource: null,
    communityReports: [
      { summary: "배틀그라운드 클라이언트 업데이트 관련 오류 메시지 해결 방법 안내 게시글.", url: "https://www.inven.co.kr/board/battlegrounds/5177/1996" }
    ],
    keywords: ["배틀그라운드", "PUBG", "업데이트 실패", "다운로드 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "pubg-mouse-input-lag",
    game: "배틀그라운드",
    category: "그래픽/성능",
    errorCode: "마우스 인풋랙",
    title: "프레임 드랍 시 마우스·키보드 반응이 늦는 인풋랙",

    overview: "프레임이 떨어지는 순간 마우스나 키보드 입력이 무시되거나 끊기는 현상으로, 마우스 폴링 속도나 프레임 제한 설정, DRM 프로그램이 원인으로 지목되고 있습니다.",

    causes: ["마우스 폴링 속도가 높아 시스템 부하와 겹치는 경우", "수직 동기화 설정이 인풋랙을 증가시키는 경우", "Fasoo DRM 등 백그라운드 프로그램이 클릭 지연을 유발하는 경우"],

    solutions: ["**1단계 - 마우스 폴링 속도 조정:**\n① 마우스 소프트웨어에서 폴링 속도를 125Hz로 낮춰 재현 여부 확인", "**2단계 - 프레임 제한 설정:**\n① 수직 동기화 대신 인게임 최대 프레임을 모니터 주사율에 맞춰 제한", "**3단계 - Fasoo DRM 제거:**\n① 관련 DRM 프로그램을 제거한 뒤 클릭 지연 개선 여부 확인"],

    officialSource: null,
    communityReports: [
      { summary: "배그 마우스 반응 속도 저하 문제에 대한 배틀그라운드 인벤 질문 게시글.", url: "https://www.inven.co.kr/board/battlegrounds/5046/32478" }
    ],
    keywords: ["배틀그라운드", "PUBG", "마우스 렉", "인풋랙"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "blackdesert-patch-file-fail",
    game: "검은사막",
    category: "런처/설치",
    errorCode: "패치 파일 적용 실패",
    title: "\"패치 파일 적용에 실패하였습니다\" 오류로 실행 불가",

    overview: "검은사막 패치 적용 도중 실패 메시지가 뜨며 실행이 막히는 경우로, 펄어비스 공식 FAQ에서 네트워크·보안 프로그램·디스크 공간을 주요 점검 항목으로 안내하고 있습니다.",

    causes: ["무선(Wi-Fi) 네트워크 환경에서 패치 파일이 불안정하게 받아지는 경우", "VPN·프록시가 패치 서버 접속을 방해하는 경우", "백신이 검은사막·EasyAntiCheat 설치 폴더를 차단하는 경우", "설치 드라이브 여유 공간이 60GB 미만인 경우"],

    solutions: ["**1단계 - 유선 네트워크로 전환 (공식 권장):**\n① Wi-Fi 대신 유선 연결로 바꿔 패치 재시도", "**2단계 - VPN·프록시 해제:**\n① 사용 중인 VPN·프록시를 모두 끈 뒤 재시도", "**3단계 - 백신 예외 등록:**\n① 검은사막 설치 폴더와 C:\\Program Files (x86)\\EasyAntiCheat 폴더를 백신 예외로 등록", "**4단계 - 디스크 공간 확보:**\n① 설치 드라이브에 60GB 이상 여유 공간 확보 후 재시도"],

    officialSource: { title: "펄어비스 고객센터: 패치 파일 적용 실패 안내", url: "https://support.pearlabyss.com/launcher/ko-KR/Faq/Home/Detail?_faqNo=242" },
    communityReports: [],
    keywords: ["검은사막", "패치 실패", "실행 불가", "업데이트 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "blackdesert-crash-report",
    game: "검은사막",
    category: "그래픽/성능",
    errorCode: "비정상 강제 종료",
    title: "플레이 중 클라이언트가 갑자기 종료되는 문제",

    overview: "검은사막 플레이 도중 클라이언트가 예고 없이 종료되는 증상입니다. 펄어비스는 오류 보고 기능을 통한 로그 제출을 공식 대응 절차로 안내하고 있습니다.",

    causes: ["그래픽 드라이버가 오래되어 시작 시 종료로 이어지는 경우", "게임 파일 일부가 손상된 경우", "특정 콘텐츠(대규모 전투 등)에서 메모리 부하가 급증하는 경우"],

    solutions: ["**1단계 - 오류 보고 기능 사용 (공식 절차):**\n① 검은사막 런처 우측 하단 '오류 보고' 클릭 → 오류 유형 선택 → 상황 기재 후 전송", "**2단계 - 그래픽 드라이버 업데이트:**\n① 그래픽카드 제조사 최신 드라이버로 업데이트", "**3단계 - 게임 파일 무결성 검사:**\n① 런처의 게임 복구/검사 기능으로 손상 파일 확인", "**4단계 - 고객센터 문의:**\n① 반복되면 '설치/실행' 카테고리로 1:1 문의 접수"],

    officialSource: { title: "펄어비스 고객센터: 비정상 강제종료 안내", url: "https://support.pearlabyss.com/launcher/ko-KR/Faq/Home/Detail?_faqNo=249" },
    communityReports: [],
    keywords: ["검은사막", "강제종료", "크래시", "튕김"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "blackdesert-steam-account-error",
    game: "검은사막",
    category: "접속/실행",
    errorCode: "스팀 계정 소유 오류",
    title: "\"로그인한 스팀 계정은 검은사막 온라인을 소유하고 있지 않습니다\" 메시지",

    overview: "스팀을 통해 검은사막에 접속하려 할 때, 로그인한 스팀 계정에 게임이 등록되어 있지 않아 나타나는 안내 메시지입니다.",

    causes: ["스팀 계정에 검은사막이 구매·등록되어 있지 않은 경우", "여러 스팀 계정을 사용 중이라 다른 계정으로 로그인된 경우"],

    solutions: ["**1단계 - 로그인 계정 확인:**\n① 현재 스팀에 로그인된 계정이 검은사막을 구매한 계정이 맞는지 확인", "**2단계 - 스팀 계정 전환:**\n① 스팀에서 로그아웃 후 검은사막을 보유한 계정으로 다시 로그인", "**3단계 - 고객센터 문의:**\n① 정상 계정인데도 반복되면 펄어비스 고객센터로 문의"],

    officialSource: null,
    communityReports: [],
    keywords: ["검은사막", "스팀", "계정 오류", "소유하고 있지 않습니다"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "overwatch2-update-infinite-loop",
    game: "오버워치 2",
    category: "런처/설치",
    errorCode: "업데이트 무한 반복",
    title: "배틀넷 앱에서 업데이트가 끝나지 않고 반복되는 문제",

    overview: "배틀넷 앱에서 오버워치 2 업데이트가 완료되지 않고 계속 '업데이트 중' 상태로 반복되는 증상입니다. 설치 드라이브 변경 직후 자주 보고됩니다.",

    causes: ["설치 드라이브를 변경한 직후 업데이트가 특정 지점에서 멈추는 경우", "배틀넷 앱 캐시가 손상된 경우", "네트워크 연결이 불안정해 다운로드가 반복 재시도되는 경우"],

    solutions: ["**1단계 - 배틀넷 앱 캐시 삭제:**\n① 배틀넷 앱 설정 → 게임 설치/업데이트 → 스캔 및 복구 실행", "**2단계 - 배틀넷 앱 재시작:**\n① 배틀넷 앱을 완전히 종료 후 재실행하여 업데이트 재개", "**3단계 - 네트워크 안정성 확인:**\n① 유선 연결로 전환한 뒤 업데이트 재시도", "**4단계 - 재설치:**\n① 위 방법으로도 반복되면 게임을 완전히 삭제한 뒤 재설치"],

    officialSource: { title: "블리자드 고객지원: 오버워치 2 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/41969" },
    communityReports: [
      { summary: "오버워치2 무한 업데이트 문제에 대한 블리자드 포럼 질문 스레드.", url: "https://kr.forums.blizzard.com/ko/blizzard/t/%EC%98%A4%EB%B2%84%EC%9B%8C%EC%B9%982-%EB%AC%B4%ED%95%9C-%EC%97%85%EB%8D%B0%EC%9D%B4%ED%8A%B8-%EC%A7%88%EB%AC%B8/9347" }
    ],
    keywords: ["오버워치2", "업데이트 무한반복", "설치 실패"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "overwatch2-voice-chat-not-working",
    game: "오버워치 2",
    category: "그래픽/성능",
    errorCode: "음성 채팅 안 됨",
    title: "팀원 목소리가 안 들리거나 마이크가 인식되지 않는 문제",

    overview: "게임 내 음성 채팅이나 마이크가 작동하지 않는 증상으로, 네트워크·설정·드라이버 문제가 복합적으로 얽혀 있는 경우가 많습니다.",

    causes: ["마이크나 헤드셋이 음소거 상태인 경우", "네트워크 장비 문제로 음성 서버 연결이 불안정한 경우", "게임 설정 파일이 손상된 경우", "마이크 장치의 시스템 이름이 인식되지 않는 경우"],

    solutions: ["**1단계 - 기본 확인:**\n① 헤드셋·마이크 음소거 여부와 볼륨 확인", "**2단계 - 네트워크 장비 재부팅:**\n① 모뎀·공유기를 재부팅해 음성 서버 연결 재시도", "**3단계 - 게임 설정 초기화:**\n① 문서 폴더의 Overwatch 설정 폴더를 삭제한 뒤 재실행", "**4단계 - 마이크 장치명 변경:**\n① 마이크 입력 장치의 시스템 이름을 'Microphone'으로 변경"],

    officialSource: { title: "Blizzard Support: Overwatch 2 Voice Chat Troubleshooting", url: "https://kr.battle.net/support/ko/article/26042" },
    communityReports: [],
    keywords: ["오버워치2", "음성채팅", "마이크 오류", "보이스 안됨"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "overwatch2-frame-drop",
    game: "오버워치 2",
    category: "그래픽/성능",
    errorCode: "프레임 드랍 · 랙 스파이크",
    title: "특정 구간에서 반복되는 프레임 드랍과 랙 스파이크",

    overview: "전투 중 특정 구간에서 프레임이 급격히 떨어지거나 순간적으로 멈추는(랙 스파이크) 증상입니다. Windows 업데이트, 백그라운드 프로세스, 그래픽 설정이 주요 변수로 지목됩니다.",

    causes: ["svchost 등 백그라운드 프로세스가 자원을 과점유하는 경우", "멀웨어가 하드웨어 자원을 소모해 쓰로틀링을 유발하는 경우", "그래픽 옵션이나 렌더링 스케일 설정이 낮아 오히려 병목이 생기는 경우"],

    solutions: ["**1단계 - 백그라운드 프로세스 확인:**\n① 작업 관리자에서 자원을 많이 쓰는 프로세스 확인 후 종료", "**2단계 - 악성코드 검사:**\n① 최신 백신으로 정밀 검사 진행", "**3단계 - 그래픽 설정 조정:**\n① 그래픽 옵션을 중 이상으로 설정하고 렌더링 스케일을 100 이상으로 조정", "**4단계 - 그래픽 드라이버 업데이트:**\n① 최신 드라이버로 업데이트 후 재현 여부 확인"],

    officialSource: { title: "Blizzard Support: Overwatch 2 Technical Troubleshooting", url: "https://kr.battle.net/support/ko/article/39980" },
    communityReports: [
      { summary: "오버워치2 프레임 드랍을 직접 해결한 과정을 정리한 인벤 게시글.", url: "https://www.inven.co.kr/board/overwatch/4680/5889" }
    ],
    keywords: ["오버워치2", "프레임 드랍", "랙 스파이크", "끊김"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "maplestory-install-ngm-error",
    game: "메이플스토리",
    category: "런처/설치",
    errorCode: "게임 설치 중 문제 발생 (NGM 오류)",
    title: "넥슨 게임 매니저(NGM) 설치 오류로 게임을 설치할 수 없음",

    overview: "메이플스토리 설치 과정에서 넥슨 게임 매니저 관련 오류로 설치가 진행되지 않는 경우입니다. 넥슨 공식 고객센터에 등록된 안내 사례입니다.",

    causes: ["넥슨 게임 매니저 구성 요소가 손상된 경우", "이전 설치 잔여 파일이 새 설치와 충돌하는 경우", "공식 홈페이지가 아닌 경로로 설치 파일을 받은 경우"],

    solutions: ["**1단계 - 공식 설치 파일로 재설치:**\n① 메이플스토리 공식 홈페이지에서 최신 설치 파일을 다시 받기", "**2단계 - 넥슨 게임 매니저 재설치:**\n① 제어판 → 프로그램 추가/제거에서 넥슨 게임 매니저 삭제 후 공식 홈페이지에서 재설치", "**3단계 - 에러복구프로그램 실행:**\n① 넥슨 에러복구프로그램(NexonRepair.exe) 실행", "**4단계 - 고객센터 문의:**\n① 반복되면 넥슨 고객센터 1:1 문의로 로그 제출"],

    officialSource: { title: "넥슨 고객센터: 게임 설치 중 문제가 발생했어요 (NGM 오류 포함)", url: "https://cs.nexon.com/helpBoard/popuphelpview/12591" },
    communityReports: [],
    keywords: ["메이플스토리", "설치 오류", "NGM", "넥슨 게임 매니저"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "maplestory-lag-optimization",
    game: "메이플스토리",
    category: "그래픽/성능",
    errorCode: "렉 · 프레임 드랍",
    title: "고사양 PC에서도 발생하는 렉과 프레임 드랍",

    overview: "권장 사양 이상의 PC에서도 메이플스토리 플레이 중 렉과 프레임 드랍이 발생하는 경우로, 그래픽 설정과 Windows 전원 옵션이 원인으로 자주 지목됩니다.",

    causes: ["실행 파일의 전체화면 최적화 설정이 시스템과 맞지 않는 경우", "Windows 그래픽 성능 설정이 '고성능'이 아닌 경우", "프로세스 우선순위가 낮게 설정된 경우", "특정 Windows 버전(24H2 등)에서 호환성 문제가 보고된 경우"],

    solutions: ["**1단계 - 전체화면 최적화 설정 변경:**\n① MapleStory.exe 속성 → 호환성 탭에서 전체 화면 최적화 사용 안 함 체크", "**2단계 - Windows 그래픽 성능 설정:**\n① 설정 → 시스템 → 디스플레이 → 그래픽에서 메이플스토리를 추가하고 '고성능'으로 지정", "**3단계 - 프로세스 우선순위 조정:**\n① 작업 관리자 → 세부 정보에서 메이플스토리 우선순위를 '높음'으로 변경", "**4단계 - NVIDIA 제어판 설정:**\n① 3D 설정 관리에서 메이플스토리를 추가하고 최대 프레임 속도 제한을 해제"],

    officialSource: null,
    communityReports: [
      { summary: "고사양 컴퓨터에서도 프레임 드랍과 심한 렉을 겪는 사용자를 위한 인벤 정리글.", url: "https://www.inven.co.kr/board/maple/2304/46019" }
    ],
    keywords: ["메이플스토리", "렉", "프레임 드랍", "최적화"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "maplestory-launch-unresponsive",
    game: "메이플스토리",
    category: "접속/실행",
    errorCode: "실행 후 무반응",
    title: "게임을 실행해도 화면이 뜨지 않고 응답이 없는 문제",

    overview: "게임 아이콘을 눌러도 실행 화면이 뜨지 않거나, 뜬 상태에서 그대로 멈춰 응답이 없는 증상입니다.",

    causes: ["이전에 실행된 메이플 관련 프로세스가 남아있는 경우", "그래픽·네트워크 드라이버가 오래된 경우", "게임 클라이언트 파일이 일부 손상된 경우"],

    solutions: ["**1단계 - 잔여 프로세스 종료:**\n① 작업 관리자에서 메이플 관련 프로세스를 모두 강제 종료 후 재실행", "**2단계 - 드라이버 업데이트:**\n① 그래픽·네트워크 드라이버를 최신 버전으로 업데이트", "**3단계 - 에러복구프로그램 실행:**\n① 넥슨 에러복구프로그램으로 클라이언트 복구", "**4단계 - 재설치:**\n① 위 방법으로도 안 되면 게임을 삭제한 뒤 공식 홈페이지에서 재설치"],

    officialSource: null,
    communityReports: [
      { summary: "메이플스토리 접속 실행 무반응 문제에 대한 인벤 자유게시판 필독 글.", url: "https://www.inven.co.kr/board/maple/5974/4593977" }
    ],
    keywords: ["메이플스토리", "실행 무반응", "먹통", "실행 안됨"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "dnf-download-fail-error3",
    game: "던전앤파이터",
    category: "런처/설치",
    errorCode: "파일 다운로드에 실패하였습니다 -3",
    title: "\"파일 다운로드에 실패하였습니다 -3\" 또는 접속 실패 메시지",

    overview: "던전앤파이터 접속 시 파일 다운로드 실패나 접속 실패 메시지가 뜨는 경우로, 넥슨 공식 FAQ에 등록된 대표 오류입니다.",

    causes: ["일시적인 PC 불안정", "백신 프로그램에 의한 클라이언트 차단", "모바일 핫스팟·VPN 등 네트워크 우회 접속"],

    solutions: ["**1단계 - 통합 플러그인 재설치 (공식 권장):**\n① 던전앤파이터 자료실에서 통합 플러그인을 다시 설치", "**2단계 - PC 재부팅 및 프로그램 정리:**\n① PC를 재부팅하고 불필요한 프로그램을 종료한 뒤 재실행", "**3단계 - 백신 확인:**\n① DNF.exe 파일이 백신의 실시간 검사·정밀 검사에 의해 삭제되지 않았는지 확인", "**4단계 - 정상 네트워크로 접속:**\n① 모바일 핫스팟이나 VPN을 끄고 일반 네트워크로 재접속"],

    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [],
    keywords: ["던전앤파이터", "던파", "다운로드 실패", "접속 실패"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "dnf-lag-frame-drop",
    game: "던전앤파이터",
    category: "그래픽/성능",
    errorCode: "튕김 · 끊김(렉)",
    title: "플레이 중 반복되는 튕김과 렉 현상",

    overview: "던전앤파이터 플레이 중 화면이 끊기거나 튕기는 현상으로, 2D 게임 특성상 내장 그래픽 사용 시 더 자주 발생한다고 공식·커뮤니티 모두 안내하고 있습니다.",

    causes: ["내장 그래픽으로 실행되어 전용 그래픽카드를 활용하지 못하는 경우", "수직 동기화나 프레임 제한 설정이 모니터 주사율과 맞지 않는 경우", "그래픽·메인보드 드라이버가 오래된 경우"],

    solutions: ["**1단계 - 전용 그래픽카드로 실행:**\n① NVIDIA·AMD 제어판에서 던전앤파이터가 전용 그래픽카드로 실행되도록 설정", "**2단계 - 수직 동기화·프레임 설정 조정:**\n① 수직 동기화를 끄고 프레임 제한을 모니터 주사율에 맞춰 조정", "**3단계 - 드라이버 업데이트:**\n① 그래픽 드라이버와 메인보드 드라이버를 모두 최신 버전으로 업데이트", "**4단계 - 고객센터 문의:**\n① 반복되면 넥슨 고객센터에 1:1 문의 접수"],

    officialSource: { title: "던전앤파이터 고객센터: 튕김/끊김(렉) FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=7" },
    communityReports: [],
    keywords: ["던전앤파이터", "던파", "렉", "튕김", "프레임 드랍"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "dnf-launcher-download-fail",
    game: "던전앤파이터",
    category: "런처/설치",
    errorCode: "런처를 받는데 실패했습니다",
    title: "\"런처를 받는데 실패했습니다\" 메시지로 실행 불가",

    overview: "게임 시작 버튼을 눌렀을 때 런처 다운로드 자체가 실패하는 경우로, 넥슨 공식 FAQ는 윈도우 사용자 계정 컨트롤(UAC) 설정을 원인으로 안내하고 있습니다.",

    causes: ["사용자 계정 컨트롤(UAC) 알림 수준이 높게 설정되어 권한 충돌이 발생하는 경우"],

    solutions: ["**1단계 - 사용자 계정 컨트롤 설정 변경 (공식 해결법):**\n① 제어판 → 모든 제어판 항목 → 사용자 계정\n② 사용자 계정 컨트롤 설정 변경 → 알림 조건을 '알리지 않음(제일 낮은 단계)'으로 설정\n③ 설정 후 PC 재부팅", "**2단계 - 재부팅 후 재시도:**\n① 재부팅 후 다시 게임 시작 버튼으로 실행", "**3단계 - 원격 지원 이용:**\n① 위 방법으로도 안 되면 넥슨 원격 지원 서비스로 PC 점검 요청"],

    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [],
    keywords: ["던전앤파이터", "던파", "런처 실패", "실행 안됨"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "diablo4-code-315306",
    game: "디아블로 4",
    category: "접속/네트워크",
    errorCode: "코드 315306",
    title: "\"유효한 디아블로4 라이선스를 찾을 수 없습니다\" 코드 315306",

    overview: "게임 접속 시 라이선스를 찾을 수 없다는 코드 315306 오류가 뜨는 경우로, 서버 접속자가 몰리거나 서버가 아직 안정화되지 않았을 때 주로 보고됩니다.",

    causes: ["서버 접속자가 한 번에 몰려 인증 처리가 지연되는 경우", "신규 확장팩·시즌 출시 직후 서버가 아직 안정화되지 않은 경우", "Battle.net 로그인 지역 설정이 계정과 맞지 않는 경우"],

    solutions: ["**1단계 - 잠시 대기 후 재접속:**\n① 서버 혼잡이 원인인 경우가 많아 몇 분 뒤 다시 로그인 시도", "**2단계 - 디아블로 IV 검사 및 복구:**\n① Battle.net 앱에서 디아블로 4 선택 → 검사 및 복구 실행", "**3단계 - 로그인 지역 확인:**\n① Battle.net 데스크톱 앱의 로그인 지역 설정이 올바른지 확인", "**4단계 - 기기 재시작:**\n① PC(또는 콘솔)를 완전히 재시작한 뒤 재접속"],

    officialSource: null,
    communityReports: [
      { summary: "디아블로4 오류코드 315306 해결방법을 정리한 인벤 팁과 노하우 게시글.", url: "https://www.inven.co.kr/board/diablo4/6023/5957" }
    ],
    keywords: ["디아블로4", "코드 315306", "라이선스", "접속 오류"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "diablo4-update-infinite-loop",
    game: "디아블로 4",
    category: "런처/설치",
    errorCode: "업데이트 무한 반복",
    title: "패치 후 실행 버튼이 계속 업데이트로 바뀌는 무한 반복 문제",

    overview: "패치 이후 플레이 버튼을 눌러도 실행되지 않고 계속 업데이트 상태로 돌아가는 증상으로, 블리자드 포럼에 다수 보고된 사례입니다.",

    causes: ["런처의 업데이트 확인 절차가 특정 단계에서 멈추는 경우", "런처 캐시가 손상되어 최신 버전 인식에 실패하는 경우", "네트워크 연결이 불안정해 패치 파일 검증이 반복 실패하는 경우"],

    solutions: ["**1단계 - 자동 업데이트 설정 확인:**\n① 런처 설정에서 '자동 업데이트 적용 금지'가 켜져 있다면 해제", "**2단계 - 시간을 두고 재시도:**\n① 몇 분 정도 기다린 뒤 실행 버튼을 다시 클릭", "**3단계 - 캐시 삭제 후 재시작:**\n① Battle.net 런처 설정에서 캐시 삭제 후 컴퓨터와 런처 재시작", "**4단계 - 재설치:**\n① 위 방법으로도 반복되면 게임을 완전히 삭제한 뒤 재설치"],

    officialSource: { title: "블리자드 고객지원: 디아블로 IV 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/360013" },
    communityReports: [
      { summary: "패치 후 게임 실행 불가 무한반복 문제에 대한 디아블로4 공식 포럼 스레드.", url: "https://kr.forums.blizzard.com/ko/d4/t/%ED%8C%A8%EC%B9%98%ED%9B%84-%EA%B2%8C%EC%9E%84%EC%8B%A4%ED%96%89%EB%B6%88%EA%B0%80-%EB%AC%B4%ED%95%9C%EB%B0%98%EB%B3%B5%EC%A4%91/17414" }
    ],
    keywords: ["디아블로4", "업데이트 무한반복", "패치 후 실행불가"],
    lastUpdated: "2026-07-15"
  },

  {
    id: "diablo4-frame-drop",
    game: "디아블로 4",
    category: "그래픽/성능",
    errorCode: "프레임 드랍 · 렉",
    title: "특정 구간이나 알트탭 이후 발생하는 프레임 드랍",

    overview: "전투가 몰리는 구간이나 알트탭(Alt+Tab) 이후 프레임이 급격히 떨어지는 증상으로, 그래픽 설정과 크로스플레이 옵션이 주요 변수로 지목됩니다.",

    causes: ["그래픽 드라이버가 최신이 아닌 경우", "크로스플레이 설정이 켜져 있어 불필요한 지연이 발생하는 경우", "그림자·안개·입자 품질 등 그래픽 옵션이 시스템 사양보다 높게 설정된 경우"],

    solutions: ["**1단계 - 그래픽 드라이버 업데이트 (공식 권장):**\n① 그래픽카드 제조사 최신 드라이버로 업데이트", "**2단계 - 크로스플레이 옵션 끄기:**\n① 설정 → 소셜 → 크로스플레이 관련 옵션을 모두 비활성화", "**3단계 - 그래픽 옵션 조정:**\n① 그림자·안개·입자 품질을 중간 이하로 낮춰 재현 여부 확인", "**4단계 - 그래픽 설정 초기화:**\n① 메인 메뉴 → 설정 → 기본값으로 재설정 후 다시 조정"],

    officialSource: { title: "블리자드 고객지원: 디아블로 IV 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/333525" },
    communityReports: [
      { summary: "고사양 PC에서도 프레임 드랍이 발생할 때의 해결 후기를 정리한 디아블로4 인벤 게시글.", url: "https://www.inven.co.kr/board/diablo4/6023/1398" }
    ],
    keywords: ["디아블로4", "프레임 드랍", "렉", "알트탭"],
    lastUpdated: "2026-07-15"
  },
  {
    id: "valorant-matchmaking-fail",
    game: "발로란트",
    category: "접속/네트워크",
    errorCode: "매치메이킹 진입 불가",
    title: "\"매치메이킹에 참가할 수 없습니다\" 오류로 게임을 시작할 수 없음",
    overview: "대기열에 진입하려 할 때 매치메이킹 오류로 게임을 시작할 수 없는 경우입니다. 클라이언트 통신이나 게임 파일 문제로 발생하는 경우가 많습니다.",
    causes: [
      "라이엇 클라이언트와 서버 간 통신이 일시적으로 끊긴 경우",
      "게임 파일 일부가 오래되었거나 손상된 경우",
      "방화벽·백신이 클라이언트 통신을 차단하는 경우"
    ],
    solutions: [
      "**1단계 - 클라이언트 재시작:**\n① 발로란트·라이엇 클라이언트를 모두 종료 후 재실행",
      "**2단계 - 게임 파일 확인:**\n① 라이엇 클라이언트 설정에서 게임 데이터 재설치/복구 실행",
      "**3단계 - 방화벽·백신 확인:**\n① 방화벽·백신에서 발로란트·라이엇 클라이언트 통신이 차단되어 있지 않은지 확인"
    ],
    officialSource: { title: "VALORANT 고객지원: 오류 코드", url: "https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant" },
    communityReports: [
      { summary: "발로란트 매치메이킹 진입 불가 오류에 대한 원인과 해결 가이드.", url: "https://bo3.gg/ko/valorant/articles/valorant-could-not-enter-matchmaking-error-explained-how-to-fix-it" }
    ],
    keywords: [
      "발로란트",
      "매치메이킹",
      "대기열",
      "실행 불가"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "valorant-launch-no-error",
    game: "발로란트",
    category: "런처/설치",
    errorCode: "오류 메시지 없이 실행 안됨",
    title: "아무 오류 메시지 없이 게임이 실행되지 않는 문제",
    overview: "클릭해도 로딩 화면조차 뜨지 않고, 오류 메시지도 표시되지 않은 채 조용히 실행이 실패하는 경우입니다. 원인을 특정할 단서가 적어 단계별 점검이 필요합니다.",
    causes: [
      "Vanguard 드라이버가 백그라운드에서 멈춰 있는 경우",
      "그래픽 드라이버나 Windows가 오래된 경우",
      "이전 프로세스가 완전히 종료되지 않은 채 남아있는 경우"
    ],
    solutions: [
      "**1단계 - 잔여 프로세스 확인:**\n① 작업 관리자에서 VALORANT·Riot·Vanguard 관련 프로세스가 남아있으면 모두 종료 후 재시도",
      "**2단계 - PC 재부팅:**\n① 재부팅 후 관리자 권한으로 재실행",
      "**3단계 - 드라이버·Windows 업데이트:**\n① 그래픽 드라이버와 Windows를 최신 버전으로 업데이트"
    ],
    officialSource: { title: "VALORANT Support: Comprehensive Troubleshooting Guide", url: "https://bo3.gg/ko/valorant/articles/valorant-wont-launch-and-doesnt-show-an-error-message-a-comprehensive-troubleshooting-guide" },
    communityReports: [],
    keywords: [
      "발로란트",
      "실행 안됨",
      "무반응",
      "오류 메시지 없음"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "valorant-account-appeal",
    game: "발로란트",
    category: "기타",
    errorCode: "계정 정지 이의 제기",
    title: "계정 정지·제재를 받았을 때 이의를 제기하는 방법",
    overview: "부정행위 탐지나 신고 누적으로 계정이 정지된 경우, 라이엇 공식 지원 페이지를 통해 이의를 제기할 수 있습니다.",
    causes: [
      "부정행위 탐지 시스템(Vanguard)에 의한 자동 제재",
      "다른 플레이어의 신고 누적",
      "계정 도용으로 인한 비정상 활동 탐지"
    ],
    solutions: [
      "**1단계 - 제재 사유 확인:**\n① 라이엇 계정으로 로그인 후 받은 이메일이나 클라이언트 공지에서 제재 사유 확인",
      "**2단계 - 공식 지원 페이지에서 이의 제기:**\n① 라이엇 고객지원 페이지에서 계정 관련 문의로 이의 제기 접수",
      "**3단계 - 계정 도용이 의심될 때:**\n① 비밀번호를 즉시 변경하고 계정 보안(2단계 인증) 설정"
    ],
    officialSource: { title: "Riot Games Support", url: "https://support.riotgames.com/valorant" },
    communityReports: [],
    keywords: [
      "발로란트",
      "계정 정지",
      "제재",
      "이의제기"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lol-graphics-texture-glitch",
    game: "리그 오브 레전드",
    category: "그래픽/성능",
    errorCode: "그래픽 텍스처 깨짐",
    title: "게임 중 화면이 순간적으로 깨졌다가 돌아오는 문제",
    overview: "플레이 중 화면 일부가 갑자기 깨지거나 노이즈가 생겼다가 곧바로 정상으로 돌아오는 증상으로, 그래픽 드라이버 문제가 주요 원인으로 지목됩니다.",
    causes: [
      "그래픽 드라이버가 손상되었거나 최신 게임 버전과 맞지 않는 경우",
      "이전 드라이버 잔여 파일이 새 드라이버와 충돌하는 경우"
    ],
    solutions: [
      "**1단계 - 드라이버 클린 재설치:**\n① 드라이버 제거 도구로 기존 그래픽 드라이버를 완전히 삭제\n② 재부팅 후 최신 드라이버 재설치",
      "**2단계 - 재현 여부 확인:**\n① 재설치 후 같은 상황에서 재현되는지 확인",
      "**3단계 - 고객센터 문의:**\n① 반복되면 라이엇 고객지원에 상황을 기록해 문의"
    ],
    officialSource: null,
    communityReports: [
      { summary: "롤 그래픽 깨짐 현상 해결 방법을 정리한 게시글.", url: "https://keyzard.org/tt/views/momet_711" }
    ],
    keywords: [
      "롤",
      "그래픽 깨짐",
      "텍스처",
      "화면 오류"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lol-slow-download-patch",
    game: "리그 오브 레전드",
    category: "런처/설치",
    errorCode: "다운로드·패치 속도 저하",
    title: "패치 다운로드 속도가 비정상적으로 느린 문제",
    overview: "인터넷 속도는 정상인데 롤 패치나 재설치 다운로드만 유독 느린 경우로, 클라이언트의 트래픽 분산 전송 설정이 원인인 경우가 많습니다.",
    causes: [
      "트래픽 분산 전송 기술 설정이 오히려 속도를 저하시키는 경우",
      "자동 오류 보고 기능이 백그라운드에서 자원을 사용하는 경우",
      "비관리자 권한으로 실행되어 일부 파일 접근이 느려지는 경우"
    ],
    solutions: [
      "**1단계 - 트래픽 분산 전송 기술 끄기:**\n① 클라이언트 우측 상단 톱니바퀴 → 트래픽 분산 전송 기술 허용 체크 해제 후 재시작",
      "**2단계 - 자동 오류 보고 끄기:**\n① 설정 → 일반에서 자동 오류 보고를 끄고 재실행",
      "**3단계 - 관리자 권한으로 실행:**\n① 클라이언트를 관리자 권한으로 실행"
    ],
    officialSource: null,
    communityReports: [
      { summary: "롤 재설치·패치 다운로드 속도를 빠르게 하는 방법을 정리한 글.", url: "https://heravos.com/446" }
    ],
    keywords: [
      "롤",
      "다운로드 느림",
      "패치 속도",
      "재설치"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lol-graphics-device-reset-fail",
    game: "리그 오브 레전드",
    category: "그래픽/성능",
    errorCode: "그래픽 장치를 초기화할 수 없습니다",
    title: "\"그래픽 장치를 초기화할 수 없습니다\" 오류로 게임이 종료됨",
    overview: "게임 진입 중 그래픽 장치 초기화 실패 메시지와 함께 클라이언트나 게임이 종료되는 증상입니다.",
    causes: [
      "그래픽 드라이버가 손상되었거나 오래된 경우",
      "다른 프로그램이 그래픽 리소스를 점유하고 있는 경우",
      "그래픽 설정이 하드웨어와 맞지 않는 경우"
    ],
    solutions: [
      "**1단계 - 그래픽 드라이버 재설치:**\n① 그래픽카드 제조사 최신 드라이버로 재설치",
      "**2단계 - 백그라운드 프로그램 종료:**\n① 화면 녹화·오버레이 프로그램 등을 종료한 뒤 재시도",
      "**3단계 - 그래픽 설정 낮추기:**\n① 인게임 그래픽 설정을 낮춰 재현 여부 확인"
    ],
    officialSource: null,
    communityReports: [
      { summary: "\"그래픽 장치를 초기화할 수 없습니다\" 오류에 대한 인벤 제보 게시판 글.", url: "https://www.inven.co.kr/board/lol/2786/15098" }
    ],
    keywords: [
      "롤",
      "그래픽 장치 초기화 실패",
      "종료",
      "크래시"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lostark-known-content-crash",
    game: "로스트아크",
    category: "그래픽/성능",
    errorCode: "특정 콘텐츠 진입 시 비정상 종료",
    title: "특정 던전·레이드 진입 시에만 반복되는 강제 종료",
    overview: "특정 섬이나 레이드 구간에 진입할 때만 클라이언트가 비정상 종료되는 증상으로, 스마일게이트는 공식 '알려진 이슈' 게시판을 통해 진행 상황을 안내하고 있습니다.",
    causes: [
      "특정 콘텐츠의 일시적인 서버·클라이언트 동기화 문제",
      "해당 구간의 특수 연출·이펙트 처리 중 발생하는 버그"
    ],
    solutions: [
      "**1단계 - 공식 알려진 이슈 확인 (권장):**\n① 로스트아크 공식 홈페이지 공지사항의 '알려진 이슈' 게시글에서 동일 현상이 보고되었는지 확인",
      "**2단계 - 재접속 시도:**\n① 캐릭터 선택 화면으로 이동한 뒤 다시 접속",
      "**3단계 - 고객센터 제보:**\n① 반복되면 발생 시각과 콘텐츠명을 정리해 고객센터에 제보"
    ],
    officialSource: { title: "로스트아크 공지사항: 알려진 이슈 안내", url: "https://lostark.game.onstove.com/News/Notice/Views/13482" },
    communityReports: [
      { summary: "군단장 레이드 중 갑자기 튕기는 현상에 대한 Q&A 게시글.", url: "https://m-lostark.game.onstove.com/Library/Qa/Views/146354" }
    ],
    keywords: [
      "로스트아크",
      "레이드 튕김",
      "특정 콘텐츠",
      "강제종료"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lostark-crystal-payment-error",
    game: "로스트아크",
    category: "기타",
    errorCode: "로얄 크리스탈 결제 오류",
    title: "로얄 크리스탈 충전 시 결제가 완료되지 않는 문제",
    overview: "캐시샵에서 로얄 크리스탈을 충전할 때 결제 수단에 따라 오류가 발생하는 경우로, 결제 플랫폼별 문제인 경우가 많습니다.",
    causes: [
      "특정 결제 수단(모빌리언스 등)에서만 발생하는 결제 오류",
      "결제 서비스 제공사 변경으로 사용 가능한 결제 수단이 바뀐 경우",
      "월 결제 한도를 초과한 경우"
    ],
    solutions: [
      "**1단계 - 다른 결제 수단으로 시도:**\n① 오류가 나는 결제 수단 대신 다른 결제 수단으로 재시도",
      "**2단계 - 월 결제 한도 확인:**\n① 이번 달 결제 한도를 초과하지 않았는지 확인",
      "**3단계 - 고객센터 문의:**\n① 반복되면 결제 코드와 함께 STOVE 고객센터에 문의"
    ],
    officialSource: null,
    communityReports: [
      { summary: "로얄 크리스탈 결제 오류(관련코드 6449)에 대한 인벤 팁 게시글.", url: "https://www.inven.co.kr/board/lostark/4821/85587" }
    ],
    keywords: [
      "로스트아크",
      "결제 오류",
      "로얄 크리스탈",
      "캐시샵"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "lostark-server-connect-fail-g0x9",
    game: "로스트아크",
    category: "접속/실행",
    errorCode: "서버에 접속할 수 없습니다",
    title: "\"서버에 접속할 수 없습니다. 게임을 종료합니다\" 메시지",
    overview: "캐릭터 선택 후 게임 시작 시 서버 접속 실패 메시지와 함께 종료되는 경우로, 필수 런타임 구성 요소 누락이 원인인 경우가 있습니다.",
    causes: [
      "Visual C++ Redistributable 구성 요소가 누락되었거나 손상된 경우",
      "일시적인 네트워크 불안정",
      "클라이언트 파일 일부 손상"
    ],
    solutions: [
      "**1단계 - Visual C++ Redistributable 설치:**\n① Microsoft 공식 사이트에서 Visual Studio 2015-2022 Redistributable을 받아 설치 후 재부팅",
      "**2단계 - 재접속 시도:**\n① 클라이언트를 완전히 종료 후 재접속",
      "**3단계 - 게임 파일 복구:**\n① STOVE 클라이언트의 파일 검증/복구 기능 실행"
    ],
    officialSource: null,
    communityReports: [
      { summary: "서버 접속 실패 메시지(G0x9 등)에 대한 로스트아크 인벤 질문과 답변.", url: "https://www.inven.co.kr/board/lostark/4822/122544" }
    ],
    keywords: [
      "로스트아크",
      "서버 접속 실패",
      "게임 종료",
      "접속 오류"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "pubg-matchmaking-reconnect-fail",
    game: "배틀그라운드",
    category: "접속/네트워크",
    errorCode: "매치메이킹 실패 · 재접속 오류",
    title: "매치메이킹 실패 메시지나 튕김 후 재접속이 안 되는 문제",
    overview: "로비에서 매치메이킹이 실패했다는 메시지가 뜨거나, 게임 중 튕긴 뒤 재접속 버튼이 나타나지 않는 경우입니다.",
    causes: [
      "인벤토리 정보 동기화 문제로 매치메이킹이 실패하는 경우",
      "게임 종료 직후 서버 측 세션 처리가 지연되는 경우",
      "클라이언트가 최신 버전으로 업데이트되지 않은 경우"
    ],
    solutions: [
      "**1단계 - 게임 재시작:**\n① 게임을 완전히 종료한 뒤 클라이언트 업데이트를 확인하고 재시작",
      "**2단계 - 잠시 대기 후 재접속:**\n① 튕긴 직후 바로 재접속 버튼이 없다면 몇 분 기다린 뒤 재시도",
      "**3단계 - 고객센터 문의:**\n① 반복되면 로비 화면 스크린샷과 함께 고객센터에 문의"
    ],
    officialSource: null,
    communityReports: [
      { summary: "배틀그라운드 게임 매칭 오류 해결 방안 안내 게시글.", url: "https://www.inven.co.kr/board/battlegrounds/5121/539" }
    ],
    keywords: [
      "배틀그라운드",
      "PUBG",
      "매치메이킹 실패",
      "재접속 오류"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "pubg-sound-not-working",
    game: "배틀그라운드",
    category: "그래픽/성능",
    errorCode: "사운드 오류",
    title: "총소리·발소리 등 게임 사운드가 들리지 않거나 이상하게 들리는 문제",
    overview: "게임 내 사운드가 아예 안 들리거나 왜곡되어 들리는 증상으로, Windows 오디오 형식·공간 음향 설정이 주요 원인으로 지목됩니다.",
    causes: [
      "오디오 기본 형식이 게임과 맞지 않는 경우",
      "공간 음향 기능이 게임 사운드와 충돌하는 경우",
      "사운드 드라이버가 오래된 경우"
    ],
    solutions: [
      "**1단계 - 오디오 형식 변경:**\n① 제어판 → 소리 → 재생 장치 속성 → 고급에서 16bit, 44100Hz(CD 음질)로 변경",
      "**2단계 - 공간 음향 끄기:**\n① 재생 장치 속성 → 공간 음향에서 공간 음향 형식을 끔으로 설정",
      "**3단계 - 사운드 드라이버 업데이트:**\n① PC 제조사 사이트에서 최신 사운드 드라이버 설치 후 재부팅"
    ],
    officialSource: null,
    communityReports: [
      { summary: "배틀그라운드 사운드가 아예 안 들리는 문제를 자체 해결한 인벤 게시글.", url: "https://www.inven.co.kr/board/battlegrounds/5046/35926" }
    ],
    keywords: [
      "배틀그라운드",
      "PUBG",
      "사운드 오류",
      "소리 안남"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "blackdesert-pearl-payment-error",
    game: "검은사막",
    category: "기타",
    errorCode: "펄(캐시) 결제 오류",
    title: "펄 상품 결제 금액이 잘못 청구되거나 결제가 완료되지 않는 문제",
    overview: "펄어비스 캐시샵에서 펄 상품을 결제할 때 금액이 다르게 청구되거나 결제가 정상 처리되지 않는 경우입니다.",
    causes: [
      "결제 수단·기프트카드 가격 설정 오류",
      "결제 서버 일시적 오류"
    ],
    solutions: [
      "**1단계 - 결제 내역 확인:**\n① 결제 완료 메일이나 결제 내역에서 실제 청구 금액 확인",
      "**2단계 - 1:1 문의로 환불 요청:**\n① 펄어비스 고객센터 1:1 문의로 환불 요청 (처리까지 3~5일 소요)",
      "**3단계 - 전화 상담:**\n① 급한 경우 펄어비스 고객센터(1661-8572)로 전화 문의"
    ],
    officialSource: { title: "펄어비스 고객센터", url: "https://support.pearlabyss.com/blackdesert_kr" },
    communityReports: [],
    keywords: [
      "검은사막",
      "펄",
      "결제 오류",
      "환불"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "blackdesert-gpu-not-detected",
    game: "검은사막",
    category: "그래픽/성능",
    errorCode: "그래픽카드 인식 안됨",
    title: "런처가 외장 그래픽카드를 인식하지 못하고 내장 그래픽으로 실행되는 문제",
    overview: "런처나 게임이 외장 그래픽카드 대신 내장 그래픽으로 실행되어 성능이 크게 떨어지는 증상입니다. 펄어비스 공식 FAQ에 등록된 해결법이 있습니다.",
    causes: [
      "런처의 그래픽 카드 설정이 내장 그래픽으로 지정된 경우",
      "전원 관리 옵션이 '고성능'이 아닌 경우",
      "GameOptionLauncher.txt의 GPU 설정값이 잘못된 경우"
    ],
    solutions: [
      "**1단계 - 런처에서 그래픽 카드 직접 선택 (공식 권장):**\n① 검은사막 런처 우측 상단 설정(톱니바퀴) → 그래픽 카드를 NVIDIA·AMD 등 외장 카드로 선택",
      "**2단계 - Windows 전원 옵션 변경:**\n① 전원 관리 옵션을 '고성능'으로 설정",
      "**3단계 - 설정 파일 직접 수정:**\n① 내 문서 → Black Desert → GameOptionLauncher.txt에서 launcherGpu 값 수정 후 저장"
    ],
    officialSource: { title: "펄어비스 고객센터: 검은사막 런처 실행 오류 안내", url: "https://support.pearlabyss.com/launcher/ko-KR/Faq/Home/Detail?_faqNo=323" },
    communityReports: [],
    keywords: [
      "검은사막",
      "그래픽카드 인식 안됨",
      "내장 그래픽",
      "런처"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "pubg-file-integrity-fail",
    game: "배틀그라운드",
    category: "런처/설치",
    errorCode: "게임 파일 무결성 오류로 실행 실패",
    title: "실행 시 게임 파일이 손상되었다는 메시지와 함께 실행되지 않는 문제",
    overview: "업데이트 이후나 비정상 종료 이후 게임 파일 일부가 손상되어 실행 자체가 되지 않는 경우로, 스팀의 파일 무결성 검사로 해결되는 경우가 많습니다.",
    causes: [
      "업데이트 도중 비정상 종료로 일부 파일이 손상된 경우",
      "백신 프로그램이 게임 파일 일부를 격리하거나 삭제한 경우"
    ],
    solutions: [
      "**1단계 - 스팀 파일 무결성 검사:**\n① 스팀 라이브러리에서 배틀그라운드 우클릭 → 속성 → 로컬 파일 → 게임 파일 무결성 검사 실행",
      "**2단계 - 백신 예외 등록:**\n① 백신 프로그램에서 배틀그라운드 설치 폴더를 예외로 등록",
      "**3단계 - 재설치:**\n① 위 방법으로 해결되지 않으면 게임을 완전히 삭제 후 재설치"
    ],
    officialSource: null,
    communityReports: [
      { summary: "배틀그라운드 실행 오류 시 파일 무결성 검사로 해결한 사례를 정리한 인벤 게시글.", url: "https://www.inven.co.kr/board/battlegrounds/5046/35926" }
    ],
    keywords: [
      "배틀그라운드",
      "PUBG",
      "파일 무결성",
      "실행 실패"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "diablo4-item-recovery-request",
    game: "디아블로 4",
    category: "기타",
    errorCode: "아이템·재화 소실 복구 요청",
    title: "버그나 오류로 아이템·재화가 사라졌을 때 복구를 요청하는 방법",
    overview: "서버 오류나 버그로 인해 아이템이나 골드가 소실된 경우, 블리자드 고객지원을 통해 복구를 요청할 수 있습니다.",
    causes: [
      "서버 오류로 거래·창고 이동 중 아이템이 소실된 경우",
      "게임 버그로 재화가 정상 반영되지 않은 경우"
    ],
    solutions: [
      "**1단계 - 소실 상황 기록:**\n① 소실 시점, 아이템 이름, 상황을 최대한 구체적으로 기록",
      "**2단계 - 고객지원 문의 접수 (공식 절차):**\n① 블리자드 고객지원 페이지에서 디아블로 IV 선택 후 아이템 복구 관련 문의 접수",
      "**3단계 - 처리 결과 확인:**\n① 접수 후 안내받은 처리 기간 동안 대기하고 결과를 이메일로 확인"
    ],
    officialSource: { title: "블리자드 고객지원: 디아블로 IV", url: "https://kr.support.blizzard.com/ko/games/diablo-iv" },
    communityReports: [],
    keywords: [
      "디아블로4",
      "아이템 소실",
      "복구 요청",
      "고객지원"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "blackdesert-account-suspension-appeal",
    game: "검은사막",
    category: "기타",
    errorCode: "계정 이용 제한 이의 신청",
    title: "계정 제재를 받았을 때 이의를 신청하는 절차",
    overview: "이용약관·운영정책 위반으로 계정이 제재된 경우, 통보받은 날로부터 15일 이내에 이의를 신청할 수 있습니다.",
    causes: [
      "이용약관·운영정책 위반으로 GM 조사 후 제재가 적용된 경우",
      "제3자 신고가 접수되어 제재로 이어진 경우"
    ],
    solutions: [
      "**1단계 - 제재 통보 내용 확인:**\n① 이메일이나 게임 내 공지로 받은 제재 사유와 기간 확인",
      "**2단계 - 15일 이내 이의 신청 (공식 절차):**\n① 홈페이지 고객센터 1:1 문의를 통해 이용제한 관련 이의 신청 접수",
      "**3단계 - 대면 상담 이용:**\n① 필요하면 고객상담실 대면센터를 방문해 상담"
    ],
    officialSource: { title: "검은사막 한국 운영정책", url: "https://www.kr.playblackdesert.com/Policy/policy/index/?policyNo=14" },
    communityReports: [],
    keywords: [
      "검은사막",
      "계정 정지",
      "이용 제한",
      "이의신청"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "overwatch2-long-queue-time",
    game: "오버워치 2",
    category: "접속/네트워크",
    errorCode: "매치메이킹 대기시간 과다",
    title: "매치메이킹 대기시간이 비정상적으로 길어지는 문제",
    overview: "특정 역할군이나 랭크에서 매치메이킹 대기시간이 지나치게 길어지는 증상으로, 평판 점수나 그룹 플레이 설정이 영향을 줄 수 있습니다.",
    causes: [
      "평판 점수가 낮아 유사한 평판의 플레이어를 찾는 데 시간이 걸리는 경우",
      "파티 내 랭크 차이가 커서 별도 대기열로 분류되는 경우",
      "네트워크 연결 상태가 좋지 않은 경우"
    ],
    solutions: [
      "**1단계 - 네트워크 상태 확인:**\n① 유선 연결로 전환하고 공유기를 재시작해 연결 상태 개선",
      "**2단계 - 파티 구성 확인:**\n① 파티원과 랭크 차이가 크면 대기열이 길어질 수 있음을 감안하고 필요시 솔로 큐 이용",
      "**3단계 - 공식 상태 확인:**\n① 블리자드 고객지원 페이지에서 대기열 관련 안내 확인"
    ],
    officialSource: { title: "블리자드 고객지원: 오버워치 2의 높은 대기열 시간", url: "https://kr.support.blizzard.com/ko/article/46646" },
    communityReports: [],
    keywords: [
      "오버워치2",
      "매치메이킹",
      "대기시간",
      "큐"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "overwatch2-black-screen-crash",
    game: "오버워치 2",
    category: "그래픽/성능",
    errorCode: "검은 화면 · 그래픽 크래시",
    title: "실행 중 화면이 검게 변하며 멈추거나 튕기는 문제",
    overview: "게임 실행 중이나 로딩 도중 화면이 검게 변하며 응답하지 않거나 튕기는 증상입니다. 서드파티 오버레이 프로그램이 원인인 경우가 자주 보고됩니다.",
    causes: [
      "Razer Chroma 등 서드파티 주변기기 소프트웨어와의 충돌",
      "게임 파일 손상",
      "저사양 CPU(듀얼코어 등)에서 발생하는 호환성 문제"
    ],
    solutions: [
      "**1단계 - 서드파티 소프트웨어 제거:**\n① Razer Chroma 등 RGB·주변기기 소프트웨어를 제거한 뒤 재현 여부 확인",
      "**2단계 - 게임 파일 복구:**\n① 배틀넷 앱에서 스캔 및 복구 실행",
      "**3단계 - 그래픽 설정 조정:**\n① 프레임을 59FPS 이하로 제한하고 동적 렌더 스케일을 꺼서 테스트"
    ],
    officialSource: { title: "블리자드 고객지원: 오버워치 2 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/26054" },
    communityReports: [
      { summary: "오버워치2 검은 화면 멈춤 해결 방법을 정리한 포럼 스레드.", url: "https://kr.forums.blizzard.com/ko/overwatch/t/%EC%98%A4%EB%B2%84%EC%9B%8C%EC%B9%982-%EA%B2%80%EC%9D%80%ED%99%94%EB%A9%B4-%EB%A9%88%EC%B6%A4-%ED%95%B4%EA%B2%B0-%EB%B0%A9%EB%B2%95-%ED%95%B4%EC%99%B8%EC%82%AC%EC%9D%B4%ED%8A%B8-%EC%9D%B8%EC%9A%A9/50921" }
    ],
    keywords: [
      "오버워치2",
      "검은화면",
      "그래픽 크래시",
      "멈춤"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "overwatch2-account-suspension-appeal",
    game: "오버워치 2",
    category: "기타",
    errorCode: "계정 정지 이의 제기",
    title: "계정이 정지되었을 때 이의를 제기하는 절차",
    overview: "부정행위 탐지나 신고로 계정이 정지된 경우, 블리자드 공식 지원 페이지를 통해 이의를 제기할 수 있습니다.",
    causes: [
      "부정행위 탐지 시스템에 의한 제재",
      "다른 플레이어 신고 누적",
      "계정 도용으로 인한 비정상 활동"
    ],
    solutions: [
      "**1단계 - 제재 사유 확인 (공식 절차):**\n① 이메일 통지 내용을 확인해 위반 사항 파악",
      "**2단계 - 이의 제기 접수:**\n① Battle.net 계정으로 로그인 후 고객지원 → 계정 제재/정지 관련 이의 제기 페이지에서 접수",
      "**3단계 - 계정 도용이 의심될 때:**\n① 별도의 계정 도용 안내 절차에 따라 비밀번호 변경과 보안 설정 진행"
    ],
    officialSource: { title: "블리자드 고객지원: 계정 정지 또는 정지", url: "https://kr.battle.net/support/ko/article/20182" },
    communityReports: [],
    keywords: [
      "오버워치2",
      "계정 정지",
      "제재",
      "이의제기"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "maplestory-cash-charge-error",
    game: "메이플스토리",
    category: "기타",
    errorCode: "넥슨캐시 충전 오류",
    title: "넥슨캐시를 충전했는데 지급되지 않거나 오류가 발생하는 문제",
    overview: "넥슨캐시 결제 후 캐시가 지급되지 않거나 충전 중 오류가 발생하는 경우로, 결제 수단에 따라 지급 시점이 다를 수 있습니다.",
    causes: [
      "가상계좌 등 결제 수단에 따라 지급까지 시간이 걸리는 경우(최대 72시간)",
      "짧은 시간 내 반복 결제 시도로 보안 차단이 걸린 경우",
      "결제가 정상적으로 완료되지 않은 경우"
    ],
    solutions: [
      "**1단계 - 지급 대기 시간 확인:**\n① 결제 수단별 지급 소요 시간(보통 30분, 가상계좌 최대 72시간)을 확인하고 대기",
      "**2단계 - 차단 기간 확인:**\n① 오류 메시지에 표시된 차단 기간이 있다면 해당 기간이 지난 뒤 재시도",
      "**3단계 - 고객센터 문의:**\n① 충전창 전체화면 스크린샷과 결제 시각·수단을 준비해 넥슨 고객센터에 문의"
    ],
    officialSource: { title: "넥슨 고객센터: 넥슨캐시 충전 중 오류/문제가 발생했어요", url: "https://cs.nexon.com/helpBoard/popuphelpview/12608" },
    communityReports: [],
    keywords: [
      "메이플스토리",
      "넥슨캐시",
      "충전 오류",
      "결제"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "maplestory-gpu-driver-pixel-glitch",
    game: "메이플스토리",
    category: "그래픽/성능",
    errorCode: "그래픽카드 드라이버 관련 화면 픽셀 깨짐",
    title: "화면 픽셀이 깨지거나 엔비디아 제어판 접근이 거부되는 문제",
    overview: "특정 그래픽 드라이버 버전에서 화면 픽셀이 깨지거나 NVIDIA 제어판 접근이 거부되는 증상이 보고되고 있습니다.",
    causes: [
      "NVIDIA 제어판의 이미지 스케일링 설정이 게임과 충돌하는 경우",
      "그래픽 드라이버가 최신이 아니거나 손상된 경우",
      "디스플레이 어댑터가 2개 이상 활성화되어 충돌하는 경우"
    ],
    solutions: [
      "**1단계 - 이미지 스케일링 끄기:**\n① NVIDIA 제어판 → 3D 설정 관리에서 이미지 스케일링 비활성화",
      "**2단계 - 디스플레이 어댑터 확인:**\n① 장치 관리자에서 디스플레이 어댑터가 2개 이상이면 하나를 사용 안 함으로 설정",
      "**3단계 - 드라이버 완전 재설치:**\n① 기존 드라이버를 완전히 제거한 뒤 최신 버전으로 재설치"
    ],
    officialSource: { title: "넥슨 고객센터: 그래픽 드라이버 설치 버전에 문제가 있다는 문구", url: "https://cs.nexon.com/helpBoard/popuphelpview/22405" },
    communityReports: [
      { summary: "화면 픽셀 깨짐과 엔비디아 제어판 액세스 거부 현상에 대한 인벤 팁 게시글.", url: "https://www.inven.co.kr/board/maple/2304/43407" }
    ],
    keywords: [
      "메이플스토리",
      "그래픽카드",
      "픽셀 깨짐",
      "드라이버"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "maplestory-account-restriction",
    game: "메이플스토리",
    category: "기타",
    errorCode: "계정 이용 제한 문의",
    title: "계정이 제재·이용 제한되었을 때 문의하는 방법",
    overview: "운영정책 위반으로 계정 이용이 제한된 경우, 넥슨 고객센터를 통해 사유 확인과 이의 신청을 진행할 수 있습니다.",
    causes: [
      "이용약관·운영정책 위반으로 제재가 적용된 경우",
      "비정상적인 접근으로 보안상 계정이 잠긴 경우"
    ],
    solutions: [
      "**1단계 - 제재 사유 확인:**\n① 게임 실행 시 표시되는 제재 안내나 이메일에서 사유와 기간 확인",
      "**2단계 - 고객센터 1:1 문의:**\n① 넥슨 고객센터를 통해 제재 사유에 대한 소명 및 이의 신청 접수",
      "**3단계 - 계정 보안 점검:**\n① 본인 계정이 아닌 접근이 의심되면 비밀번호 변경과 추가 인증 설정"
    ],
    officialSource: null,
    communityReports: [],
    keywords: [
      "메이플스토리",
      "계정 제재",
      "이용 제한",
      "이의신청"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "dnf-cash-charge-error",
    game: "던전앤파이터",
    category: "기타",
    errorCode: "넥슨캐시 충전 오류",
    title: "넥슨캐시 충전 시 오류가 발생하거나 캐시가 지급되지 않는 문제",
    overview: "던전앤파이터 캐시 충전 중 오류가 발생하거나, 결제 후에도 캐시가 지급되지 않는 경우입니다.",
    causes: [
      "결제 정보를 여러 번 잘못 입력해 비정상 결제 시도로 분류된 경우",
      "짧은 시간 내 반복 결제로 보안 차단이 걸린 경우",
      "결제 수단별 지급 소요 시간이 남아있는 경우"
    ],
    solutions: [
      "**1단계 - 차단 기간 확인:**\n① 오류 팝업에 표시된 차단 적용 기간을 확인하고 해당 기간 이후 재시도",
      "**2단계 - 지급 대기:**\n① 결제 수단에 따라 최대 30분~72시간까지 지급이 지연될 수 있으므로 대기",
      "**3단계 - 고객센터 문의:**\n① 결제 시각·수단·스크린샷을 준비해 넥슨 고객센터에 문의"
    ],
    officialSource: { title: "넥슨 고객센터: 넥슨캐시 충전 중 오류/문제가 발생했어요", url: "https://cs.nexon.com/helpBoard/popuphelpview/12608" },
    communityReports: [],
    keywords: [
      "던전앤파이터",
      "던파",
      "넥슨캐시",
      "결제 오류"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "dnf-gpu-driver-glitch",
    game: "던전앤파이터",
    category: "그래픽/성능",
    errorCode: "그래픽 카드 드라이버 화면 깨짐",
    title: "NVIDIA 그래픽카드 사용 시 화면이 깨져 보이는 문제",
    overview: "특정 NVIDIA 드라이버 버전에서 던전앤파이터 실행 중 화면이 깨지는 증상이 보고되고 있습니다.",
    causes: [
      "그래픽 드라이버 중복 설치 또는 버전 호환성 문제",
      "PC 사양과 맞지 않는 그래픽 설정이 적용된 경우"
    ],
    solutions: [
      "**1단계 - 드라이버 완전 재설치:**\n① 기존 드라이버를 완전히 삭제한 뒤 최신 버전 재설치, 별도 설정 없이 실행",
      "**2단계 - 드라이버 설정 초기화:**\n① NVIDIA 제어판에서 임의로 변경한 3D 설정을 모두 기본값으로 초기화",
      "**3단계 - Windows·DirectX 업데이트:**\n① Windows와 DirectX를 최신 버전으로 업데이트"
    ],
    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [
      { summary: "NVIDIA 카드 사용자 화면깨짐 해결방법을 정리한 루리웹 게시글.", url: "https://bbs.ruliweb.com/game/2230/read/5449636" }
    ],
    keywords: [
      "던전앤파이터",
      "던파",
      "그래픽카드",
      "화면 깨짐"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "dnf-launch-fail-korean-id",
    game: "던전앤파이터",
    category: "런처/설치",
    errorCode: "게임 실행에 실패하였습니다 - -1",
    title: "한글 ID 이용 시 \"게임 실행에 실패하였습니다 - -1\" 메시지가 뜨는 문제",
    overview: "한글로 된 넥슨 ID를 이용 중일 때 게임 접속이 제한되며 나타나는 넥슨 공식 FAQ 등록 오류입니다.",
    causes: [
      "한글 ID로 게임에 접속하려는 경우 접속이 제한되는 정책"
    ],
    solutions: [
      "**1단계 - 고객센터에 영문 ID 변경 요청 (공식 해결법):**\n① 넥슨 고객센터에 현재 ID와 변경을 원하는 영문 ID 1~5순위를 함께 접수",
      "**2단계 - 변경 완료 후 재접속:**\n① 안내받은 영문 ID로 변경 완료 후 다시 게임 실행"
    ],
    officialSource: { title: "던전앤파이터 고객센터: 설치/접속/실행 오류 FAQ", url: "https://df.nexon.com/customer/faq?cat1=20&cat2=6" },
    communityReports: [],
    keywords: [
      "던전앤파이터",
      "던파",
      "한글 ID",
      "실행 실패"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "diablo4-gpu-crash-freeze",
    game: "디아블로 4",
    category: "그래픽/성능",
    errorCode: "그래픽카드 크래시 · 화면 멈춤",
    title: "플레이 중 화면이 꺼지거나 멈추며 시스템이 다운되는 문제",
    overview: "장시간 플레이 중 화면이 꺼지거나 멈추는 증상으로, 발열이나 NVIDIA Reflex 설정이 원인으로 지목되고 있습니다.",
    causes: [
      "그래픽카드 발열이 누적되어 일정 시간 후 화면이 꺼지는 경우",
      "NVIDIA Reflex를 '활성화+부스터'로 설정한 경우",
      "그래픽 드라이버가 최신이 아닌 경우"
    ],
    solutions: [
      "**1단계 - NVIDIA Reflex 설정 변경:**\n① 그래픽 설정에서 NVIDIA Reflex를 '활성화'로만 두거나 꺼서 재현 여부 확인",
      "**2단계 - 그래픽 드라이버 재설치:**\n① 그래픽카드 제조사 최신 드라이버로 재설치",
      "**3단계 - 발열 상태 점검:**\n① GPU 온도를 모니터링 프로그램으로 확인하고 쿨링 상태 점검",
      "**4단계 - 수직 동기화 끄기:**\n① 게임 설정에서 수직 동기화를 꺼서 재현 여부 확인"
    ],
    officialSource: { title: "블리자드 고객지원: 디아블로 IV 기술 문제 해결", url: "https://kr.battle.net/support/ko/article/333524" },
    communityReports: [
      { summary: "그래픽카드 오류 관련 튕김(Fenris, 포탈 튕김 등) 대응 팁을 정리한 인벤 게시글.", url: "https://www.inven.co.kr/board/diablo4/6023/7394" }
    ],
    keywords: [
      "디아블로4",
      "그래픽카드",
      "화면 멈춤",
      "크래시"
    ],
    lastUpdated: "2026-07-15"
  },
  {
    id: "diablo4-account-suspension-appeal",
    game: "디아블로 4",
    category: "기타",
    errorCode: "계정 정지 이의 제기",
    title: "계정이 정지되거나 영구 정지되었을 때 이의를 제기하는 절차",
    overview: "게임 수정 소프트웨어 사용 등으로 계정이 정지되거나 영구 정지된 경우, 블리자드 공식 절차에 따라 이의를 제기할 수 있습니다.",
    causes: [
      "게임 수정 소프트웨어(핵, 매크로 등) 사용 탐지",
      "부정 거래·어뷰징 탐지",
      "계정 도용으로 인한 비정상 활동"
    ],
    solutions: [
      "**1단계 - 제재 사유 확인 (공식 절차):**\n① Battle.net 계정으로 로그인 후 이메일 통지 내용에서 위반 사항 확인",
      "**2단계 - 이의 제기 접수:**\n① 블리자드 고객지원 → 계정·앱·샵 → 계정 제재/정지 관련 이의 제기 메뉴에서 정지된 게임 선택 후 접수",
      "**3단계 - 본인 인증:**\n① 휴대전화 본인인증을 거쳐 이의 제기 완료"
    ],
    officialSource: { title: "블리자드 고객지원: 디아블로 IV 정지 또는 영구 정지 이의 제기", url: "https://kr.support.blizzard.com/ko/article/333832" },
    communityReports: [],
    keywords: [
      "디아블로4",
      "계정 정지",
      "영구 정지",
      "이의제기"
    ],
    lastUpdated: "2026-07-15"
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
