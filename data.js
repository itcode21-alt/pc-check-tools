window.SITE_DATA = {
  siteName: "PC 윈도우 진단 센터",
  siteUrl: "https://itcode21-alt.github.io/pc-check-tools",
  errorCodes: [
    {
      code: "0xC000021A",
      title: "Critical System Process 종료",
      summary: "부팅 또는 로그인 과정에서 시스템 프로세스가 비정상 종료될 때 자주 보이는 코드입니다.",
      causes: ["시스템 파일 손상", "드라이버 충돌", "최근 업데이트 문제"],
      checks: ["안전 모드 진입 가능 여부 확인", "최근 설치 업데이트 검토", "시스템 복구 옵션 점검"],
      link: "error-code-0xc000021a.html",
      detailPage: "error-code-0xc000021a.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["c000021a", "0xc000021a"]
    },
    {
      code: "0x0000007B",
      title: "INACCESSIBLE_BOOT_DEVICE",
      summary: "저장장치나 부팅 경로를 읽지 못할 때 주로 연결되는 코드입니다.",
      causes: ["부팅 디스크 연결 문제", "BIOS/UEFI 설정", "저장장치 드라이버 문제"],
      checks: ["디스크 연결 상태 확인", "BIOS 부팅 순서 점검", "최근 저장장치 변경 내역 확인"],
      link: "error-code-0x0000007b.html",
      detailPage: "error-code-0x0000007b.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["7b", "0000007b", "0x7b"]
    },
    {
      code: "0x0000001A",
      title: "MEMORY_MANAGEMENT",
      summary: "메모리 관리 오류로 표시되며 램, 드라이버, 저장장치 문제와 함께 나타날 수 있습니다.",
      causes: ["램 불안정", "드라이버 충돌", "디스크 오류"],
      checks: ["메모리 재장착 또는 교차 테스트", "최근 드라이버 제거/재설치", "디스크 상태 점검"],
      link: "error-code-0x0000001a.html",
      detailPage: "error-code-0x0000001a.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["1a", "0000001a", "0x1a"]
    },
    {
      code: "0x00000050",
      title: "PAGE_FAULT_IN_NONPAGED_AREA",
      summary: "메모리나 드라이버가 잘못된 주소를 참조할 때 보일 수 있는 코드입니다.",
      causes: ["드라이버 문제", "램 불안정", "손상된 시스템 파일"],
      checks: ["최근 장치 드라이버 확인", "메모리 검사", "시스템 파일 복구"],
      link: "error-code-0x00000050.html",
      detailPage: "error-code-0x00000050.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["50", "00000050", "0x50"]
    },
    {
      code: "0x80070002",
      title: "파일을 찾을 수 없음",
      summary: "업데이트, 설치, 복구 과정에서 필요한 파일을 찾지 못할 때 연결되는 코드입니다.",
      causes: ["누락된 설치 파일", "경로 오류", "업데이트 캐시 문제"],
      checks: ["업데이트 캐시 정리", "설치 파일 다시 받기", "경로와 권한 점검"],
      link: "error-code-0x80070002.html",
      detailPage: "error-code-0x80070002.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80070002", "0x80070002"]
    },
    {
      code: "0x80070057",
      title: "매개 변수가 올바르지 않음",
      summary: "설치나 업데이트, 시스템 명령 실행 시 입력값이 맞지 않을 때 보일 수 있습니다.",
      causes: ["설정 값 오류", "손상된 업데이트 구성", "지원하지 않는 옵션"],
      checks: ["최근 변경 설정 되돌리기", "업데이트 재시도", "명령어 입력값 점검"],
      link: "error-code-0x80070057.html",
      detailPage: "error-code-0x80070057.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80070057", "0x80070057"]
    },
    {
      code: "0x800F0922",
      title: "Windows 업데이트 실패",
      summary: "업데이트 설치 단계에서 실패가 반복될 때 함께 보이는 코드입니다.",
      causes: ["시스템 예약 파티션 부족", "VPN/프록시 영향", "업데이트 구성 문제"],
      checks: ["저장 공간과 복구 파티션 확인", "VPN/프록시 해제", "업데이트 캐시 점검"],
      link: "error-code-0x800f0922.html",
      detailPage: "error-code-0x800f0922.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["800f0922", "0x800f0922"]
    },
    {
      code: "0x80070005",
      title: "Access Denied",
      summary: "권한 부족으로 파일이나 설정에 접근하지 못할 때 보일 수 있습니다.",
      causes: ["관리자 권한 부족", "보안 소프트웨어 차단", "정책 제한"],
      checks: ["관리자 권한으로 다시 실행", "보안 프로그램 임시 확인", "폴더 권한 점검"],
      link: "error-code-0x80070005.html",
      detailPage: "error-code-0x80070005.html",
      relatedSymptom: "windows-printer-add-freeze.html",
      aliases: ["80070005", "0x80070005"]
    },
    {
      code: "0x80004005",
      title: "Unspecified error",
      summary: "원인이 한 번에 특정되지 않을 때 자주 보이는 포괄적 오류 코드입니다.",
      causes: ["손상된 캐시", "보안 차단", "네트워크/권한 문제"],
      checks: ["최근 변경 사항 되돌리기", "캐시와 임시 파일 정리", "권한/네트워크 점검"],
      link: "error-code-0x80004005.html",
      detailPage: "error-code-0x80004005.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80004005", "0x80004005"]
    },
    {
      code: "0xC000000F",
      title: "부팅 정보 읽기 실패",
      summary: "부팅 장치나 BCD 정보를 읽지 못할 때 연결될 수 있는 코드입니다.",
      causes: ["부트 레코드 손상", "저장장치 연결 불량", "펌웨어 설정"],
      checks: ["디스크 연결 확인", "복구 환경 진입", "부팅 구성 점검"],
      link: "error-code-0xc000000f.html",
      detailPage: "error-code-0xc000000f.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["c000000f", "0xc000000f"]
    },
    {
      code: "0x000000EF",
      title: "CRITICAL_PROCESS_DIED",
      summary: "핵심 시스템 프로세스가 종료될 때 보이는 블루스크린 코드입니다.",
      causes: ["시스템 파일 손상", "드라이버 충돌", "디스크 오류"],
      checks: ["안전 모드 진입 시도", "시스템 파일 복구", "디스크 상태 점검"],
      link: "error-code-0x000000ef.html",
      detailPage: "error-code-0x000000ef.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["ef", "000000ef", "0xef"]
    },
    {
      code: "0x000000D1",
      title: "DRIVER_IRQL_NOT_LESS_OR_EQUAL",
      summary: "드라이버가 허용되지 않는 메모리 영역에 접근할 때 보일 수 있는 코드입니다.",
      causes: ["불안정한 드라이버", "메모리 충돌", "보안 소프트웨어 충돌"],
      checks: ["최근 드라이버 업데이트 확인", "안전 모드에서 재현 여부 확인", "메모리 검사 실행"],
      link: "error-code-0x000000d1.html",
      detailPage: "error-code-0x000000d1.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["d1", "000000d1", "0xd1"]
    },
    {
      code: "0x0000009F",
      title: "DRIVER_POWER_STATE_FAILURE",
      summary: "절전/복귀 또는 종료 과정에서 드라이버가 전원 상태 전환을 못 할 때 연결됩니다.",
      causes: ["전원 관리 드라이버", "절전 관련 장치", "USB/네트워크 장치"],
      checks: ["절전 해제 후 재현 여부 확인", "장치 관리자 전원 설정 점검", "최근 연결 장치 분리"],
      link: "error-code-0x0000009f.html",
      detailPage: "error-code-0x0000009f.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["9f", "0000009f", "0x9f"]
    },
    {
      code: "0x00000116",
      title: "VIDEO_TDR_FAILURE",
      summary: "그래픽 카드 응답이 늦어져 화면 복구에 실패할 때 자주 보이는 코드입니다.",
      causes: ["그래픽 드라이버", "GPU 발열", "전원 공급 불안정"],
      checks: ["그래픽 드라이버 재설치", "온도 확인", "전원 케이블 점검"],
      link: "error-code-0x00000116.html",
      detailPage: "error-code-0x00000116.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["116", "00000116", "0x116"]
    },
    {
      code: "0x00000133",
      title: "DPC_WATCHDOG_VIOLATION",
      summary: "저장장치나 드라이버 반응 지연이 일정 시간 이상 이어질 때 보일 수 있습니다.",
      causes: ["SSD/스토리지 드라이버", "펌웨어", "시스템 지연"],
      checks: ["저장장치 펌웨어 점검", "드라이버 최신화", "최근 연결 장치 확인"],
      link: "error-code-0x00000133.html",
      detailPage: "error-code-0x00000133.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["133", "00000133", "0x133"]
    },
    {
      code: "0x0000003B",
      title: "SYSTEM_SERVICE_EXCEPTION",
      summary: "시스템 서비스 단계에서 예외가 발생했을 때 보일 수 있는 코드입니다.",
      causes: ["시스템 파일 손상", "드라이버 충돌", "메모리 문제"],
      checks: ["최근 업데이트 확인", "시스템 파일 검사", "메모리 테스트"],
      link: "error-code-0x0000003b.html",
      detailPage: "error-code-0x0000003b.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["3b", "0000003b", "0x3b"]
    },
    {
      code: "0x000000EA",
      title: "THREAD_STUCK_IN_DEVICE_DRIVER",
      summary: "그래픽 드라이버나 디바이스 드라이버가 응답하지 않을 때 연결됩니다.",
      causes: ["GPU 드라이버", "과도한 발열", "하드웨어 응답 지연"],
      checks: ["드라이버 재설치", "온도 확인", "부하 테스트 후 재현 여부 확인"],
      link: "error-code-0x000000ea.html",
      detailPage: "error-code-0x000000ea.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["ea", "000000ea", "0xea"]
    },
    {
      code: "0x0000007E",
      title: "SYSTEM_THREAD_EXCEPTION_NOT_HANDLED",
      summary: "시스템 스레드에서 처리되지 않은 예외가 발생할 때 보일 수 있습니다.",
      causes: ["그래픽/칩셋 드라이버", "시스템 파일 손상", "호환성 문제"],
      checks: ["최근 드라이버 점검", "업데이트 직후 여부 확인", "안전 모드 재현 확인"],
      link: "error-code-0x0000007e.html",
      detailPage: "error-code-0x0000007e.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["7e", "0000007e", "0x7e"]
    },
    {
      code: "0x0000000A",
      title: "IRQL_NOT_LESS_OR_EQUAL",
      summary: "드라이버가 잘못된 메모리에 접근할 때 자주 보이는 코드입니다.",
      causes: ["드라이버 문제", "메모리 불안정", "보안 프로그램 충돌"],
      checks: ["최근 설치 드라이버 확인", "메모리 테스트", "보안 프로그램 분리 확인"],
      link: "error-code-0x0000000a.html",
      detailPage: "error-code-0x0000000a.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["a", "0a", "0000000a", "0x0a", "0x0000000a"]
    },
    {
      code: "0x00000024",
      title: "NTFS_FILE_SYSTEM",
      summary: "NTFS 파일 시스템 손상이나 디스크 문제와 함께 보일 수 있습니다.",
      causes: ["파일시스템 손상", "디스크 오류", "갑작스러운 전원 종료"],
      checks: ["디스크 상태 점검", "중요 파일 백업", "복구 도구 실행"],
      link: "error-code-0x00000024.html",
      detailPage: "error-code-0x00000024.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["24", "00000024", "0x24"]
    },
    {
      code: "0x000000F4",
      title: "CRITICAL_OBJECT_TERMINATION",
      summary: "핵심 시스템 객체가 예기치 않게 종료될 때 연결됩니다.",
      causes: ["저장장치 문제", "부팅 파일 손상", "시스템 예외"],
      checks: ["저장장치 연결 점검", "복구 환경 진입", "최근 변경 사항 확인"],
      link: "error-code-0x000000f4.html",
      detailPage: "error-code-0x000000f4.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["f4", "000000f4", "0xf4"]
    },
    {
      code: "0x00000019",
      title: "BAD_POOL_HEADER",
      summary: "메모리 풀 구조가 손상되었을 때 보일 수 있는 블루스크린 코드입니다.",
      causes: ["메모리 충돌", "드라이버 오류", "시스템 파일 손상"],
      checks: ["최근 설치 드라이버 확인", "메모리 검사", "시스템 복원 시도"],
      link: "error-code-0x00000019.html",
      detailPage: "error-code-0x00000019.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["19", "00000019", "0x19"]
    },
    {
      code: "0x000000A5",
      title: "ACPI_BIOS_ERROR",
      summary: "ACPI/BIOS 호환성 문제와 함께 나타날 수 있는 코드입니다.",
      causes: ["BIOS 설정 문제", "펌웨어 호환성", "메인보드 전원 관리 오류"],
      checks: ["BIOS 기본값 확인", "펌웨어 업데이트 검토", "최근 하드웨어 변경 내역 확인"],
      link: "error-code-0x000000a5.html",
      detailPage: "error-code-0x000000a5.html",
      relatedSymptom: "hardware-no-display.html",
      aliases: ["a5", "000000a5", "0xa5"]
    },
    {
      code: "0x00000074",
      title: "BAD_SYSTEM_CONFIG_INFO",
      summary: "부팅 구성 정보가 손상되었을 때 보일 수 있는 코드입니다.",
      causes: ["BCD 손상", "레지스트리 문제", "업데이트 실패"],
      checks: ["복구 환경 진입", "부팅 구성 점검", "최근 시스템 변경 확인"],
      link: "error-code-0x00000074.html",
      detailPage: "error-code-0x00000074.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["74", "00000074", "0x74"]
    },
    {
      code: "0xC0000225",
      title: "부팅 장치를 찾을 수 없음",
      summary: "부팅에 필요한 장치를 찾지 못할 때 보일 수 있는 오류입니다.",
      causes: ["BCD 손상", "디스크 연결 문제", "부팅 순서 변경"],
      checks: ["디스크 인식 상태 확인", "BIOS 부팅 순서 점검", "복구 옵션 실행"],
      link: "error-code-0xc0000225.html",
      detailPage: "error-code-0xc0000225.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["c0000225", "0xc0000225"]
    },
    {
      code: "0x80070570",
      title: "파일이 손상되었거나 읽을 수 없음",
      summary: "설치나 복사 과정에서 파일 손상이나 읽기 실패가 생길 때 보일 수 있습니다.",
      causes: ["설치 파일 손상", "디스크 불량", "압축 해제 오류"],
      checks: ["파일을 다시 받기", "디스크 검사", "다른 저장소에 저장"],
      link: "error-code-0x80070570.html",
      detailPage: "error-code-0x80070570.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["80070570", "0x80070570"]
    }
  ],
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
