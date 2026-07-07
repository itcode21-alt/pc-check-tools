window.SITE_DATA = {
  siteName: "PC 윈도우 진단 센터",
  siteUrl: "https://YOUR-DOMAIN.com",
  symptoms: [
    {
      id: "auto-repair",
      title: "자동 복구 루프",
      summary: "부팅 과정에서 자동 복구가 반복되는 경우",
      causes: ["부팅 파일 손상", "최근 업데이트 충돌", "저장장치 오류"],
      checks: ["외장 장치 분리", "안전 모드 진입", "복구 옵션 확인"],
      link: "windows-auto-repair-loop.html"
    },
    {
      id: "bsod-critical-process",
      title: "Critical Process Died 블루스크린",
      summary: "부팅 중 블루스크린이 반복되는 경우",
      causes: ["드라이버 충돌", "시스템 파일 손상", "디스크 오류"],
      checks: ["최근 설치 드라이버 확인", "디스크 상태 점검", "안전 모드 복구"],
      link: "windows-bsod-critical-process.html"
    },
    {
      id: "explorer-freeze",
      title: "탐색기 멈춤",
      summary: "파일 탐색기가 응답하지 않거나 멈추는 경우",
      causes: ["셸 확장 충돌", "대용량 폴더", "네트워크 드라이브"],
      checks: ["최근 추가 프로그램 확인", "우클릭 메뉴 점검", "대상 폴더 분리"],
      link: "windows-explorer-freeze.html"
    },
    {
      id: "printer-add-freeze",
      title: "프린터 추가 멈춤",
      summary: "프린터 장치 추가 단계에서 멈추는 경우",
      causes: ["드라이버 충돌", "스풀러 문제", "네트워크 설정"],
      checks: ["제조사 드라이버 점검", "연결 방식 변경", "기존 장치 정리"],
      link: "windows-printer-add-freeze.html"
    },
    {
      id: "gaming-reboot",
      title: "게임 중 재부팅",
      summary: "게임이나 부하 상황에서만 재부팅되는 경우",
      causes: ["전원 공급 부족", "발열", "그래픽 드라이버"],
      checks: ["온도 확인", "파워 용량 점검", "드라이버 재설치"],
      link: "hardware-gaming-reboot.html"
    },
    {
      id: "no-display",
      title: "화면 미출력",
      summary: "전원은 들어오지만 화면이 출력되지 않는 경우",
      causes: ["케이블 문제", "모니터 입력 오류", "램 접촉"],
      checks: ["케이블 교차 테스트", "입력 소스 점검", "그래픽 포트 확인"],
      link: "hardware-no-display.html"
    },
    {
      id: "nvme-delay",
      title: "NVMe 인식 지연",
      summary: "부팅이 느리거나 SSD 인식이 지연되는 경우",
      causes: ["슬롯 접촉", "펌웨어", "BIOS 설정"],
      checks: ["다른 슬롯 확인", "펌웨어 점검", "디스크 건강 상태 확인"],
      link: "hardware-nvme-delay.html"
    },
    {
      id: "usb-not-detected",
      title: "USB 미인식",
      summary: "USB 장치가 아예 인식되지 않는 경우",
      causes: ["포트 고장", "전력 부족", "드라이버 문제"],
      checks: ["다른 포트 테스트", "허브 제거", "장치 관리자 확인"],
      link: "hardware-usb-not-detected.html"
    }
  ]
};
