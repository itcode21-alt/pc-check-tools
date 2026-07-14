// games-data.js
const gameErrors = [
  {
    id: "valorant-error-59",
    game: "발로란트",
    category: "런처/설치",
    errorCode: "Error 59",
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
      
      "**4단계 - 관리자 권한 실행:**\n① Riot Client.exe 또는 Valorant.exe 우클릭\n② '관리자 권한으로 실행' 선택\n③ 사용자 계정 컨트롤(UAC) 승인\n④ 게임 실행 시도",
      
      "**5단계 - 타사 보안 프로그램 확인:**\n① Norton, McAfee, AVG 등 타사 백신 일시 중지\n② 또는 해당 프로그램 설정에서 Riot Client 예외 추가\n③ 게임 진행 중에도 게임과 충돌하지 않는지 확인"
    ],
    
    symptoms: ["게임 실행 버튼 클릭 후 오류 메시지", "Riot Client 반응 없음", "검은 화면 표시"],
    
    resolution: {
      timeRequired: "10-20분",
      difficulty: "중상",
      successRate: "94%",
      requiresRestart: true
    },
    
    userCases: [
      {
        username: "초롱이",
        platform: "Windows 11",
        issue: "3주일 전 Windows 11 업데이트 후 갑자기 Error 59 발생",
        whatTried: "Riot Client 재설치, 캐시 삭제",
        solution: "Vanguard 드라이버 완전 제거 후 재설치",
        result: "해결됨 ✅",
        timeline: "약 15분"
      },
      {
        username: "아키",
        platform: "Windows 10",
        issue: "Norton 백신 설치 후 Valorant 실행 오류",
        whatTried: "Riot Client 재부팅",
        solution: "Norton 설정에서 Valorant.exe, Vanguard 드라이버 예외 추가",
        result: "해결됨 ✅",
        timeline: "약 5분"
      }
    ],
    
    relatedErrors: ["런처 오류", "시작 오류"],
    keywords: ["발로란트", "Error 59", "VAN 오류", "Vanguard", "게임 실행 안됨"],
    lastUpdated: "2024-07-14"
  },

  {
    id: "lol-client-crash",
    game: "리그 오브 레전드",
    category: "클라이언트",
    errorCode: "클라이언트 크래시",
    title: "롤 클라이언트 자동 종료",
    
    overview: "롤 클라이언트가 시작 중 또는 실행 중 갑자기 종료되는 현상입니다. GPU 드라이버 부적합, 메모리 부족, 클라이언트 파일 손상이 주요 원인입니다.",
    
    causes: [
      "Nvidia/AMD 그래픽 드라이버가 너무 오래되어 최신 클라이언트 미지원",
      "RAM 8GB 이상 필요하나 부족하거나 다른 프로그램이 메모리 과점유",
      "League of Legends 클라이언트 설치 파일 손상",
      "임시 캐시 파일 누적으로 인한 메모리 부족",
      "Windows 업데이트와 클라이언트 버전 충돌"
    ],
    
    solutions: [
      "**1단계 - 그래픽 드라이버 업데이트:**\n① Nvidia 또는 AMD 공식 사이트 접속\n② 본인 GPU 모델 선택 후 최신 드라이버 다운로드\n③ 드라이버 설치 시 '완전 설치' 선택\n④ 설치 완료 후 재부팅",
      
      "**2단계 - 클라이언트 캐시 삭제:**\n① League of Legends 종료 확인\n② 파일 탐색기 → 주소창에 '%localappdata%' 입력\n③ Riot Games → League of Legends → Caches 폴더 삭제\n④ 클라이언트 재실행 (캐시 자동 재생성)",
      
      "**3단계 - 클라이언트 파일 검증:**\n① Riot Client 실행 → 설정(톱니바퀴)\n② 'League of Legends' 찾기\n③ '게임 데이터 확인' 또는 '수리' 옵션 실행\n④ 손상된 파일 재다운로드 진행",
      
      "**4단계 - 배경 프로세스 종료:**\n① 작업 관리자 열기 (Ctrl+Shift+Esc)\n② '성능' 탭 → 메모리 사용량 확인\n③ 불필요한 앱(Discord, Chrome 등) 종료\n④ 메모리 확보 후 클라이언트 실행",
      
      "**5단계 - 호환성 모드 실행:**\n① LeagueClient.exe 우클릭 → 속성\n② '호환성' 탭 → 이전 버전 Windows 호환성 체크\n③ 'Windows 10' 또는 'Windows 8' 선택 후 테스트\n④ 효과 없으면 취소"
    ],
    
    symptoms: ["클라이언트 시작 후 5-30초 내 종료", "아무 오류 메시지 없이 닫힘", "검은 창만 나타났다 사라짐"],
    
    resolution: {
      timeRequired: "15-30분",
      difficulty: "중",
      successRate: "89%",
      requiresRestart: true
    },
    
    userCases: [
      {
        username: "바보야",
        platform: "Windows 11 + RTX 3060",
        issue: "클라이언트 시작 직후 항상 크래시",
        whatTried: "클라이언트 재설치, 메모리 정리",
        solution: "Nvidia 드라이버를 2년 된 버전에서 최신으로 업데이트",
        result: "해결됨 ✅",
        timeline: "약 20분"
      },
      {
        username: "게이밍유저",
        platform: "Windows 10 + GTX 1660",
        issue: "Chrome과 Discord 켠 상태에서 크래시",
        whatTried: "클라이언트 수리",
        solution: "배경 앱 종료로 RAM 2GB 확보 → 정상 작동",
        result: "해결됨 ✅",
        timeline: "약 2분"
      }
    ],
    
    relatedErrors: ["런처 오류", "메모리 부족"],
    keywords: ["롤", "클라이언트", "크래시", "종료", "실행 오류"],
    lastUpdated: "2024-07-14"
  },

  {
    id: "lostark-connection-timeout",
    game: "로스트아크",
    category: "접속/네트워크",
    errorCode: "Connection Timeout",
    title: "로스트아크 접속 타임아웃",
    
    overview: "로스트아크 게임 서버 연결이 끊어져 '접속할 수 없습니다' 또는 '연결 시간 초과' 오류가 나타나는 상태입니다. ISP 차단, 라우터 문제, 방화벽 차단이 주요 원인입니다.",
    
    causes: [
      "인터넷 제공자(ISP)에서 게임 포트 차단 또는 대역폭 제한",
      "Windows Defender 방화벽이 게임 프로세스 차단",
      "공유기(라우터)의 UPnP 미활성화 또는 QoS 제한",
      "Wi-Fi 불안정성으로 인한 연결 끊김 (유선 권장)",
      "게임 서버 점검 중이거나 IP 대역대 차단"
    ],
    
    solutions: [
      "**1단계 - 방화벽 예외 추가:**\n① Windows Defender → '방화벽 및 네트워크 보호' 열기\n② '앱이 방화벽을 통해 통신하도록 허용'\n③ 'LostArk.exe' 검색 후 체크 (없으면 찾아보기로 추가)\n④ 비공개/공개 모두 체크 후 확인",
      
      "**2단계 - 라우터 포트 포워딩 설정:**\n① 라우터 관리자 페이지 접속 (주로 192.168.0.1 또는 192.168.1.1)\n② 포트 포워딩 설정 찾기\n③ 로스트아크 포트 범위 추가 (일반적으로 TCP/UDP 3306-3310, 6112)\n④ 로그인하는 PC의 로컬 IP 지정\n⑤ 설정 저장 및 라우터 재부팅",
      
      "**3단계 - ISP 포트 차단 확인:**\n① ISP 고객센터 전화 (SKT, KT, LG U+ 등)\n② 로스트아크 관련 포트 차단 여부 문의\n③ 필요시 포트 개방 요청\n④ VPN 사용으로 임시 우회 테스트 (속도 저하 주의)",
      
      "**4단계 - 유선 연결로 변경:**\n① Wi-Fi에서 LAN 케이블 유선 연결로 변경\n② 유선 연결 후 게임 실행\n③ 문제 해결 확인 (네트워크 안정성 개선)\n④ 지속적으로 끊기면 ISP 기술지원 요청",
      
      "**5단계 - 게임 클라이언트 완전 재설치:**\n① 제어판 → 프로그램 제거 → Lost Ark 선택\n② C:\\Games\\LostArk (또는 설치 경로) 폴더도 수동 삭제\n③ 공식 래처 또는 스팀에서 재다운로드\n④ 설치 완료 후 재부팅"
    ],
    
    symptoms: ["서버 선택 후 '접속할 수 없습니다' 메시지", "게임 로딩 중 갑자기 오류", "로그인은 되지만 게임 입장 불가"],
    
    resolution: {
      timeRequired: "20-40분",
      difficulty: "상",
      successRate: "78%",
      requiresISPContact: true
    },
    
    userCases: [
      {
        username: "로제",
        platform: "Windows 10 + Wi-Fi",
        issue: "저녁 시간에만 주기적으로 접속 끊김 (피크 타임)",
        whatTried: "방화벽 해제, 클라이언트 재설치",
        solution: "Wi-Fi에서 유선 LAN으로 변경 + 라우터 QoS 설정 조정",
        result: "해결됨 ✅",
        timeline: "약 30분"
      },
      {
        username: "유저명",
        platform: "Windows 11 + 유선",
        issue: "게임 시작 직후 항상 Connection Timeout",
        whatTried: "게임 재설치",
        solution: "ISP(LG U+)에 연락 → 포트 차단 해제 후 정상",
        result: "해결됨 ✅",
        timeline: "약 2시간 (ISP 처리 시간 포함)"
      }
    ],
    
    relatedErrors: ["네트워크 오류", "서버 연결 실패"],
    keywords: ["로스트아크", "접속", "타임아웃", "연결 안됨", "네트워크"],
    lastUpdated: "2024-07-14"
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
