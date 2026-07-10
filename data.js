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
    },
    {
      code: "0x000000C2",
      title: "BAD_POOL_CALLER",
      summary: "잘못된 메모리 풀 호출이 있을 때 보일 수 있는 블루스크린 코드입니다.",
      causes: ["드라이버 결함", "메모리 충돌", "커널 모드 소프트웨어"],
      checks: ["최근 드라이버 변경 확인", "메모리 테스트", "보안 프로그램 영향 확인"],
      link: "error-code-0x000000c2.html",
      detailPage: "error-code-0x000000c2.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["c2", "000000c2", "0xc2"]
    },
    {
      code: "0x000000ED",
      title: "UNMOUNTABLE_BOOT_VOLUME",
      summary: "부팅 볼륨을 마운트하지 못할 때 보일 수 있는 코드입니다.",
      causes: ["디스크 파일시스템 손상", "부팅 파티션 문제", "저장장치 연결 불안정"],
      checks: ["디스크 연결 확인", "복구 환경 진입", "부팅 파티션 점검"],
      link: "error-code-0x000000ed.html",
      detailPage: "error-code-0x000000ed.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["ed", "000000ed", "0xed"]
    },
    {
      code: "0x000000F7",
      title: "DRIVER_OVERRAN_STACK_BUFFER",
      summary: "드라이버가 스택 버퍼를 초과했을 때 보일 수 있는 코드입니다.",
      causes: ["드라이버 버그", "호환성 문제", "보안 차단"],
      checks: ["최근 드라이버 제거/교체", "안전 모드 재현 확인", "업데이트 기록 점검"],
      link: "error-code-0x000000f7.html",
      detailPage: "error-code-0x000000f7.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["f7", "000000f7", "0xf7"]
    },
    {
      code: "0x000000D8",
      title: "REFERENCE_BY_POINTER",
      summary: "유효하지 않은 참조 포인터를 사용했을 때 보일 수 있는 코드입니다.",
      causes: ["드라이버 결함", "커널 모드 충돌", "메모리 손상"],
      checks: ["최근 설치한 드라이버 확인", "메모리 검사", "안전 모드에서 재현 확인"],
      link: "error-code-0x000000d8.html",
      detailPage: "error-code-0x000000d8.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["d8", "000000d8", "0xd8"]
    },
    {
      code: "0x0000009C",
      title: "MACHINE_CHECK_EXCEPTION",
      summary: "하드웨어가 심각한 내부 오류를 보고할 때 보일 수 있습니다.",
      causes: ["CPU/메모리 안정성", "전원 공급 불안정", "오버클럭"],
      checks: ["오버클럭 해제", "온도와 전원 점검", "메모리 재장착"],
      link: "error-code-0x0000009c.html",
      detailPage: "error-code-0x0000009c.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["9c", "0000009c", "0x9c"]
    },
    {
      code: "0x00000077",
      title: "KERNEL_STACK_INPAGE_ERROR",
      summary: "커널 스택을 읽는 과정에서 저장장치 접근 문제가 생길 때 보일 수 있습니다.",
      causes: ["디스크 오류", "케이블/슬롯 문제", "페이지 파일 문제"],
      checks: ["디스크 상태 점검", "연결 상태 확인", "페이지 파일/가상 메모리 확인"],
      link: "error-code-0x00000077.html",
      detailPage: "error-code-0x00000077.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["77", "00000077", "0x77"]
    },
    {
      code: "0x0000003A",
      title: "KERNEL_DATA_INPAGE_ERROR",
      summary: "커널 데이터 페이지를 읽지 못할 때 나타날 수 있는 오류입니다.",
      causes: ["저장장치 문제", "메모리 문제", "전원 불안정"],
      checks: ["디스크 검사", "메모리 테스트", "전원/케이블 점검"],
      link: "error-code-0x0000003a.html",
      detailPage: "error-code-0x0000003a.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["3a", "0000003a", "0x3a"]
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
      code: "0x000000BE",
      title: "ATTEMPTED_WRITE_TO_READONLY_MEMORY",
      summary: "읽기 전용 메모리에 쓰기를 시도할 때 보일 수 있는 코드입니다.",
      causes: ["드라이버 오류", "메모리 충돌", "커널 모드 소프트웨어 문제"],
      checks: ["최근 드라이버 제거/재설치", "메모리 테스트", "보안 프로그램 영향 확인"],
      link: "error-code-0x000000be.html",
      detailPage: "error-code-0x000000be.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["be", "000000be", "0xbe"]
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
    },
    {
      id: "update-fail-loop",
      title: "업데이트 반복 실패",
      summary: "윈도우 업데이트가 계속 실패하고 다시 시도하는 경우",
      causes: ["업데이트 캐시 손상", "보안 정책 충돌", "디스크 여유 부족"],
      checks: ["업데이트 기록 확인", "임시 파일 정리", "복구 옵션 점검"],
      link: "windows-update-fail-loop.html"
    },
    {
      id: "startup-slow",
      title: "부팅 속도 저하",
      summary: "전원은 켜지지만 바탕화면까지 너무 오래 걸리는 경우",
      causes: ["시작 프로그램 과다", "디스크 지연", "드라이버 초기화 지연"],
      checks: ["시작 프로그램 점검", "디스크 상태 확인", "최근 설치 프로그램 확인"],
      link: "windows-startup-slow.html"
    },
    {
      id: "taskbar-freeze",
      title: "작업표시줄 멈춤",
      summary: "작업표시줄이나 시작 메뉴가 반응하지 않는 경우",
      causes: ["탐색기 셸 문제", "시작 메뉴 구성 손상", "알림 영역 충돌"],
      checks: ["탐색기 재시작", "최근 셸 확장 확인", "업데이트 상태 점검"],
      link: "windows-taskbar-freeze.html"
    },
    {
      id: "wifi-disconnect",
      title: "와이파이 끊김",
      summary: "무선 인터넷이 자주 끊기거나 다시 연결되는 경우",
      causes: ["무선 드라이버", "절전 설정", "공유기 신호 불안정"],
      checks: ["드라이버 재설치", "절전 옵션 확인", "다른 네트워크 시험"],
      link: "hardware-wifi-disconnect.html"
    },
    {
      id: "overheat-shutdown",
      title: "과열로 전원 꺼짐",
      summary: "온도가 올라가면 갑자기 꺼지거나 재부팅되는 경우",
      causes: ["쿨링 부족", "먼지 누적", "전원부 불안정"],
      checks: ["온도 로그 확인", "팬/방열 상태 점검", "부하 테스트 재현"],
      link: "hardware-overheat-shutdown.html"
    },
    {
      id: "sound-not-working",
      title: "소리 안 남",
      summary: "스피커나 이어폰에서 소리가 나오지 않는 경우",
      causes: ["출력 장치 오류", "드라이버 문제", "볼륨/음소거 설정"],
      checks: ["출력 장치 확인", "사운드 드라이버 점검", "다른 포트/장치 시험"],
      link: "hardware-sound-not-working.html"
    },
    {
      id: "sleep-resume-fail",
      title: "절전 복귀 실패",
      summary: "절전에서 깨어날 때 화면이 멈추거나 블루스크린이 나는 경우",
      causes: ["전원 상태 전환 드라이버", "USB/네트워크 장치", "BIOS 전원 설정"],
      checks: ["절전 후 재현 여부 확인", "최근 연결 장치 분리", "전원 관리 설정 점검"],
      link: "windows-sleep-resume-fail.html"
    },
    {
      id: "no-power",
      title: "전원 반응 없음",
      summary: "전원 버튼을 눌러도 팬이나 LED가 거의 반응하지 않는 경우",
      causes: ["PSU 문제", "전면 패널 버튼", "24핀/8핀 전원 연결"],
      checks: ["전원 케이블 확인", "24핀·8핀 재체결", "전면 패널 연결 점검"],
      link: "hardware-no-power.html"
    }
  ],
  boardParts: [
    {
      id: "cpu",
      label: "CPU Socket",
      shortLabel: "CPU",
      position: { x: 32, y: 33 },
      hitbox: { w: 16, h: 10 },
      summary: "부팅, 복귀, 전원 안정성과 함께 보는 핵심 부위",
      symptoms: ["자동 복구 루프", "Critical Process Died", "절전 복귀 실패"],
      codes: ["0x000000EF", "0x0000009F", "0x0000001A"],
      note: "전원 상태 전환과 시스템 안정성을 함께 보세요."
    },
    {
      id: "cooler",
      label: "CPU Cooling Fan",
      shortLabel: "쿨러",
      position: { x: 58, y: 31 },
      hitbox: { w: 16, h: 10 },
      summary: "온도와 부하가 높은 순간의 꺼짐을 먼저 확인",
      symptoms: ["게임 중 재부팅", "과열로 전원 꺼짐"],
      codes: ["0x0000009C", "0x00000116", "0x000000EA"],
      note: "온도 로그와 팬 회전 상태를 함께 보세요."
    },
    {
      id: "ram",
      label: "RAM Slots",
      shortLabel: "RAM",
      position: { x: 89, y: 46 },
      hitbox: { w: 14, h: 10 },
      summary: "블루스크린과 불안정 재부팅이 잘 드러나는 부위",
      symptoms: ["Critical Process Died", "화면 미출력", "게임 중 재부팅"],
      codes: ["0x0000001A", "0x00000050", "0x0000000A"],
      note: "재장착과 교차 테스트가 우선입니다."
    },
    {
      id: "gpu",
      label: "GPU",
      shortLabel: "GPU",
      position: { x: 26, y: 59 },
      hitbox: { w: 16, h: 10 },
      summary: "화면 출력과 게임 부하 문제가 모이는 부위",
      symptoms: ["화면 미출력", "게임 중 재부팅"],
      codes: ["0x00000116", "0x000000EA", "0x000000BE"],
      note: "케이블, 보조전원, 드라이버를 함께 봐야 합니다."
    },
    {
      id: "m2",
      label: "M.2 SSD Slots",
      shortLabel: "M.2",
      position: { x: 88, y: 69 },
      hitbox: { w: 15, h: 10 },
      summary: "부팅 지연과 저장장치 읽기 실패가 자주 연결됩니다",
      symptoms: ["NVMe 인식 지연", "자동 복구 루프", "부팅 속도 저하"],
      codes: ["0x0000007B", "0x00000077", "0x0000003A"],
      note: "슬롯 접촉과 펌웨어 확인이 중요합니다."
    },
    {
      id: "sata",
      label: "SATA Connectors",
      shortLabel: "SATA",
      position: { x: 88, y: 80 },
      hitbox: { w: 14, h: 10 },
      summary: "구형 저장장치와 장치 추가 문제를 볼 때 유용",
      symptoms: ["자동 복구 루프", "프린터 추가 멈춤"],
      codes: ["0x80070002", "0x80004005", "0x00000077"],
      note: "케이블과 포트가 헐거운지 먼저 봅니다."
    },
    {
      id: "rear-io",
      label: "Rear I/O Ports",
      shortLabel: "I/O",
      position: { x: 14, y: 41 },
      hitbox: { w: 16, h: 10 },
      summary: "USB, 오디오, 네트워크 같은 외부 장치 문제를 먼저 보는 곳",
      symptoms: ["USB 미인식", "와이파이 끊김", "소리 안 남"],
      codes: ["0x80070005", "0x80004005", "0x0000009F"],
      note: "허브보다 본체 직결 테스트가 빠릅니다."
    },
    {
      id: "psu",
      label: "PSU",
      shortLabel: "PSU",
      position: { x: 61, y: 92 },
      hitbox: { w: 18, h: 10 },
      summary: "전원 반응 없음과 갑작스런 꺼짐을 연결해 보는 부위",
      symptoms: ["전원 반응 없음", "과열로 전원 꺼짐", "게임 중 재부팅"],
      codes: ["0x0000009C", "0x000000EA", "0x0000001A"],
      note: "파워 스위치와 케이블 연결을 먼저 점검하세요."
    }
  ],
  symptomDetails: {
    "auto-repair": {
      badge: "부팅",
      subtitle: "부팅 단계에서 멈출 때 가장 먼저 보는 증상",
      intro: [
        "자동 복구 루프는 윈도우가 스스로 문제를 고치려다가 같은 지점에서 다시 멈추는 상태입니다. 화면에는 복구가 진행되는 것처럼 보이지만, 실제로는 부팅 파일, 디스크 상태, 최근 업데이트 중 하나가 막혀 있는 경우가 많습니다.",
        "이 증상은 단순한 소프트웨어 오류처럼 보여도 저장장치 문제와 함께 나타나는 일이 많습니다. 그래서 복구 메뉴를 반복해서 누르기보다, 외장 장치 분리와 부팅 구성 확인을 먼저 하는 편이 효율적입니다.",
        "아래 내용은 어떤 부분을 먼저 확인해야 하는지, 그리고 왜 그 순서로 확인해야 하는지를 함께 설명합니다."
      ],
      warnings: [
        "자동 복구 화면이 매번 같은 지점에서 멈춘다.",
        "업데이트 이후부터 시작이 안 된다.",
        "USB, 외장 SSD, SD카드가 꽂혀 있으면 더 자주 실패한다."
      ],
      checks: [
        {
          title: "외장 장치부터 분리",
          why: "외장 저장장치나 USB 허브가 부팅 순서를 흔들거나 복구 환경을 방해할 수 있습니다.",
          how: "모든 USB 장치와 외장 저장장치를 빼고 다시 시작해 보세요."
        },
        {
          title: "복구 메뉴에서 안전 모드 확인",
          why: "안전 모드가 열리면 윈도우 자체보다 드라이버나 최근 설치 프로그램 쪽 가능성이 높아집니다.",
          how: "고급 옵션에서 안전 모드 진입이 가능한지 확인하세요."
        },
        {
          title: "디스크와 부팅 정보 점검",
          why: "부팅 파일과 저장장치가 모두 정상이어야 자동 복구가 끝까지 진행됩니다.",
          how: "부팅 장치 인식, BCD, 디스크 건강 상태를 차례로 봅니다."
        },
        {
          title: "최근 변경 내용 되짚기",
          why: "업데이트 직후나 프로그램 설치 직후라면 원인 추적이 훨씬 빨라집니다.",
          how: "최근 설치한 업데이트, 드라이버, 보안 프로그램을 먼저 떠올려 보세요."
        }
      ],
      deeper: [
        {
          heading: "부팅 파일 손상과 업데이트 충돌",
          text: "자동 복구 루프는 흔히 부팅 파일이 깨졌을 때 보이지만, 실제 현장에서는 업데이트가 끝난 직후에 생기는 경우가 많습니다. 업데이트가 시스템 파일을 건드린 뒤 복구가 반복되면, 같은 화면이 반복되어도 원인은 파일 자체보다 변경 과정일 수 있습니다."
        },
        {
          heading: "저장장치 오류가 함께 있을 때",
          text: "디스크가 불안정하면 복구가 시작되더라도 중간에 끊깁니다. SMART 경고, 읽기 오류, 느린 인식이 함께 보이면 윈도우를 다시 설치하기 전에 저장장치를 먼저 점검해야 합니다."
        }
      ],
      decision: [
        {
          heading: "재설치보다 먼저 확인할 것",
          text: "안전 모드가 열리면 재설치보다 드라이버와 최근 업데이트부터 확인하는 편이 좋습니다. 반대로 안전 모드도 안 들어가면 저장장치와 부팅 파일 쪽 비중을 더 높게 봐야 합니다."
        },
        {
          heading: "바로 전문가 도움을 고려할 경우",
          text: "부팅 장치가 불안정하게 잡히거나 SMART 경고가 함께 보이면, 작업을 오래 끌기보다 데이터를 먼저 지키는 방향이 우선입니다."
        }
      ],
      examples: [
        "업데이트 후 재부팅할 때만 복구가 반복됨",
        "외장 SSD를 꽂으면 복구 화면이 더 자주 나타남",
        "안전 모드에만 들어가면 바탕화면까지는 뜸"
      ],
      mistakes: [
        "복구 화면만 계속 반복해서 눌러 보는 것",
        "부팅 장치 확인 전에 윈도우 재설치부터 시도하는 것",
        "외장 장치가 꽂힌 상태를 그대로 두는 것"
      ],
      faq: [
        {
          q: "바로 재설치해도 되나요?",
          a: "대부분은 재설치 전에 부팅 파일과 디스크 상태를 먼저 보는 편이 좋습니다. 저장장치 문제라면 재설치 후에도 같은 문제가 반복될 수 있습니다."
        },
        {
          q: "안전 모드가 열리면 무엇을 봐야 하나요?",
          a: "최근 설치한 드라이버, 보안 프로그램, 업데이트 기록을 먼저 확인하세요. 이 경우 하드웨어보다 변경 이력이 더 중요한 단서가 됩니다."
        }
      ]
    },
    "bsod-critical-process": {
      badge: "블루스크린",
      subtitle: "부팅 중 중단될 때 원인을 좁히는 페이지",
      intro: [
        "Critical Process Died는 윈도우가 꼭 필요한 핵심 프로세스를 유지하지 못할 때 나타납니다. 보통은 한 번만 뜨고 끝나지 않고, 재부팅할 때마다 반복되는 경우가 많아 사용자를 가장 불안하게 만드는 증상 중 하나입니다.",
        "원인은 드라이버 충돌, 시스템 파일 손상, 저장장치 오류처럼 서로 겹쳐 보일 수 있습니다. 그래서 단순히 오류 코드만 보는 대신, 최근에 바뀐 부분과 함께 확인해야 실제 원인을 빨리 좁힐 수 있습니다.",
        "이 페이지는 블루스크린이 떴을 때 무엇부터 확인해야 하는지, 그리고 어떤 조합이면 저장장치보다 드라이버 쪽을 먼저 의심해야 하는지 설명합니다."
      ],
      warnings: [
        "같은 블루스크린이 부팅마다 반복된다.",
        "업데이트 직후부터 증상이 시작됐다.",
        "안전 모드에서는 조금 더 버틴다."
      ],
      checks: [
        {
          title: "최근 드라이버와 보안 프로그램 확인",
          why: "핵심 프로세스가 종료되는 문제는 드라이버나 커널 훅이 원인일 수 있습니다.",
          how: "최근 설치한 그래픽, 칩셋, 보안 프로그램을 떠올려 보세요."
        },
        {
          title: "디스크 상태와 여유 공간 확인",
          why: "시스템 파일을 읽지 못하면 같은 블루스크린이 반복됩니다.",
          how: "디스크 건강 상태와 남은 저장 공간을 함께 확인하세요."
        },
        {
          title: "안전 모드에서 재현 여부 확인",
          why: "안전 모드에서만 버티면 시작 프로그램이나 드라이버 영향이 큽니다.",
          how: "기본 드라이버 상태에서 같은 증상이 나는지 봅니다."
        }
      ],
      deeper: [
        {
          heading: "시스템 파일보다 먼저 볼 것",
          text: "파일 손상만 생각하기 쉽지만, 실제로는 최근 장치 드라이버가 핵심 프로세스와 충돌하는 경우가 많습니다. 특히 그래픽, 저장장치, 네트워크 드라이버가 바뀐 뒤라면 업데이트 복원보다 드라이버 정리가 먼저일 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "같은 코드가 반복될 때",
          text: "반복되는 코드가 같다면 우연한 충돌보다 특정 드라이버나 저장장치 계열 문제를 먼저 의심하는 편이 맞습니다."
        },
        {
          heading: "코드가 바뀌어도 불안정할 때",
          text: "다른 BSOD 코드가 섞여 나오면 메모리와 전원 안정성까지 함께 보는 것이 좋습니다."
        }
      ],
      examples: [
        "게임 실행 뒤 다시 재부팅하면 같은 블루스크린이 뜸",
        "안전 모드에서는 버티지만 일반 부팅에서만 멈춤"
      ],
      mistakes: [
        "블루스크린 코드만 보고 바로 재설치하는 것",
        "최근 설치한 보안 프로그램을 빼놓는 것"
      ],
      faq: [
        {
          q: "메모리 문제와 어떻게 구분하나요?",
          a: "메모리 문제는 다른 BSOD 코드와 함께 바뀌어 나타나는 경우가 많고, 블루스크린 자체가 랜덤하게 바뀌기도 합니다. 같은 코드가 반복되면 드라이버나 파일 손상 쪽을 더 먼저 봅니다."
        }
      ]
    },
    "explorer-freeze": {
      badge: "탐색기",
      subtitle: "우클릭과 폴더 열기에서 자주 멈출 때",
      intro: [
        "탐색기 멈춤은 윈도우 셸이 폴더를 열거나 우클릭 메뉴를 그리는 과정에서 응답을 잃을 때 생깁니다. 파일이 많아서 느린 경우도 있지만, 실제로는 셸 확장, 미리 보기, 네트워크 드라이브 같은 주변 요소가 원인인 경우가 많습니다.",
        "증상이 탐색기에서만 반복된다면 전체 윈도우가 아닌 셸 구성 요소를 먼저 점검하는 것이 좋습니다. 특히 최근 설치한 압축 프로그램, 클라우드 동기화 프로그램, 우클릭 메뉴 추가 도구가 단서가 됩니다.",
        "이 가이드는 폴더 문제와 프로그램 충돌을 구분해 보는 데 초점을 맞춥니다."
      ],
      warnings: [
        "특정 폴더를 열 때만 멈춘다.",
        "우클릭 메뉴가 뜨기 전에 오래 멈춘다.",
        "미리 보기 창을 켜면 더 느려진다."
      ],
      checks: [
        {
          title: "최근 추가한 셸 확장 확인",
          why: "우클릭 메뉴나 미리 보기 확장은 탐색기와 밀접하게 붙어 있습니다.",
          how: "최근 설치한 압축 프로그램, 백업 도구, 클라우드 유틸리티를 떠올려 보세요."
        },
        {
          title: "대용량 폴더와 네트워크 드라이브 분리",
          why: "느린 경로가 하나만 있어도 전체 탐색기가 멈춘 것처럼 보일 수 있습니다.",
          how: "문제가 나는 폴더와 네트워크 위치를 잠시 떼어 놓고 재현 여부를 봅니다."
        },
        {
          title: "썸네일과 미리 보기 확인",
          why: "이미지나 영상이 많은 폴더는 미리 보기 생성에서 멈추는 경우가 있습니다.",
          how: "미리 보기 창을 끈 상태와 켠 상태를 비교해 보세요."
        }
      ],
      deeper: [
        {
          heading: "폴더가 아니라 확장 메뉴일 수 있음",
          text: "같은 폴더라도 우클릭을 할 때만 멈춘다면 파일 자체보다 셸 확장 충돌일 가능성이 높습니다. 탐색기는 정상으로 보이지만, 메뉴를 만드는 확장 프로그램이 뒤에서 시간을 잡아먹는 경우가 있습니다."
        }
      ],
      decision: [
        {
          heading: "특정 폴더만 느릴 때",
          text: "한 폴더에서만 멈춘다면 셸 확장보다 파일 수, 미리 보기, 네트워크 드라이브 쪽을 먼저 보는 것이 빠릅니다."
        },
        {
          heading: "우클릭에서만 멈출 때",
          text: "우클릭 직후에만 멈춘다면 압축 프로그램이나 클라우드 동기화 유틸리티처럼 메뉴를 붙이는 프로그램을 먼저 확인하세요."
        }
      ],
      examples: [
        "특정 폴더에서만 회전 아이콘이 오래 돌아감",
        "오른쪽 클릭 순간 프로그램이 잠시 멈춤"
      ],
      mistakes: [
        "파일 개수만 원인으로 단정하는 것",
        "네트워크 드라이브를 계속 연결해 둔 채 확인하는 것"
      ],
      faq: [
        {
          q: "재부팅하면 바로 괜찮아지는데 문제 아닌가요?",
          a: "재부팅 후 잠시 괜찮아지는 것은 셸 확장 충돌에서도 자주 보입니다. 반복된다면 임시 현상으로 넘기지 말고 어떤 폴더나 프로그램에서 시작되는지 봐야 합니다."
        }
      ]
    },
    "printer-add-freeze": {
      badge: "프린터",
      subtitle: "장치 추가 단계가 끝까지 안 갈 때",
      intro: [
        "프린터 추가 멈춤은 드라이버 설치, 스풀러 서비스, 네트워크 설정이 서로 맞물려 있을 때 자주 생깁니다. 프린터 자체가 아니라 주변 소프트웨어가 멈추는 경우도 많아서 원인이 하나로 보이지 않을 수 있습니다.",
        "특히 회사용 프린터, 무선 프린터, 오래된 제조사 드라이버는 설치 방식 차이 때문에 더 잘 꼬입니다. 그래서 먼저 연결 방식과 기존 장치 정리 여부를 확인해야 합니다.",
        "이 페이지는 프린터를 새로 추가할 때 어디서 막히는지 기준을 나눠 볼 수 있게 구성했습니다."
      ],
      warnings: [
        "장치 찾기 화면에서 오래 멈춘다.",
        "같은 프린터를 여러 번 추가하려고 했다.",
        "네트워크 프린터만 유독 안 된다."
      ],
      checks: [
        {
          title: "제조사 드라이버부터 확인",
          why: "기본 드라이버보다 제조사 패키지가 필요한 모델이 있습니다.",
          how: "프린터 제조사에서 제공하는 최신 드라이버가 있는지 확인하세요."
        },
        {
          title: "기존 장치와 스풀러 상태 점검",
          why: "오래된 프린터 항목이 남아 있으면 추가 단계에서 충돌이 납니다.",
          how: "기존 장치 목록과 인쇄 스풀러 상태를 함께 봅니다."
        },
        {
          title: "연결 방식 변경",
          why: "무선 연결이 꼬였는지, USB 연결이 꼬였는지를 구분할 수 있습니다.",
          how: "가능하면 다른 연결 방식으로 한 번 시험해 보세요."
        }
      ],
      deeper: [
        {
          heading: "드라이버와 장치 목록이 꼬일 때",
          text: "프린터는 같은 장치라도 드라이버와 포트가 달라지면 다른 장치처럼 취급됩니다. 그래서 추가가 멈출 때는 본체보다 남아 있는 이전 항목, 포트 설정, 스풀러를 먼저 보는 것이 빠릅니다."
        }
      ],
      decision: [
        {
          heading: "USB는 되는데 네트워크가 안 될 때",
          text: "유선이나 무선 경로만 문제라면 장치 자체보다 네트워크 등록, 포트, 스풀러를 우선 확인하는 것이 좋습니다."
        },
        {
          heading: "장치 목록이 계속 남을 때",
          text: "삭제해도 같은 프린터가 다시 나타난다면 이전 드라이버와 포트를 정리한 뒤 다시 추가해 보세요."
        }
      ],
      examples: [
        "같은 프린터를 삭제해도 다시 추가가 안 됨",
        "무선 프린터 검색에서 계속 멈춤"
      ],
      mistakes: [
        "프린터 전원만 여러 번 껐다 켜는 것",
        "드라이버 파일만 다시 받으면 끝난다고 보는 것"
      ],
      faq: [
        {
          q: "USB 연결로는 되는데 무선 연결만 안 됩니다.",
          a: "무선 네트워크 설정이나 포트 등록 문제일 가능성이 높습니다. 장치 자체보다 연결 경로를 먼저 점검하세요."
        }
      ]
    },
    "gaming-reboot": {
      badge: "전원",
      subtitle: "게임처럼 부하가 걸릴 때만 재부팅될 때",
      intro: [
        "게임 중 재부팅은 부하가 올라갈 때만 문제를 드러내는 대표적인 증상입니다. 평소에는 멀쩡해 보여도 전원 공급, 온도, 그래픽 드라이버가 한계에 닿으면 갑자기 꺼질 수 있습니다.",
        "이 증상은 소프트웨어보다 하드웨어 신호가 더 강하게 드러나는 편이라, 온도와 파워 용량을 먼저 보는 것이 중요합니다. 특히 업그레이드 이후 시작됐다면 전원과 쿨링 설계를 함께 확인해야 합니다.",
        "아래 항목은 재부팅이 반복되는 원인을 체계적으로 나눠 보는 데 도움이 됩니다."
      ],
      warnings: [
        "게임 실행 직후 또는 몇 분 뒤에만 재부팅된다.",
        "오버클럭을 켜면 더 빨리 꺼진다.",
        "팬 소음과 발열이 급격히 올라간다."
      ],
      checks: [
        {
          title: "온도와 전력부터 확인",
          why: "부하 상황에서만 꺼진다면 발열과 전원 부족 가능성이 큽니다.",
          how: "CPU/GPU 온도와 파워 용량, 보조전원 연결을 함께 봅니다."
        },
        {
          title: "그래픽 드라이버 재설치",
          why: "화면 출력 장치가 멈추면 시스템이 전체 재부팅으로 이어질 수 있습니다.",
          how: "안정 버전 드라이버로 다시 설치해 보세요."
        },
        {
          title: "오버클럭/튜닝 해제",
          why: "불안정한 전압이나 메모리 세팅이 원인일 수 있습니다.",
          how: "XMP/EXPO와 CPU/GPU 튜닝 값을 기본으로 돌려봅니다."
        }
      ],
      deeper: [
        {
          heading: "게임에서만 멈추는 이유",
          text: "게임은 CPU, GPU, 메모리, 디스크를 동시에 많이 씁니다. 평소에는 괜찮다가 게임에서만 꺼진다면, 단순 윈도우 문제가 아니라 전력부족이나 냉각 한계가 드러난 것일 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "오버클럭이 켜져 있다면",
          text: "오버클럭 상태에서만 재부팅된다면 먼저 기본값으로 돌려 안정성부터 확인해야 합니다."
        },
        {
          heading: "온도는 정상인데 꺼진다면",
          text: "온도보다 전원 공급이 더 의심되며, 파워 용량과 보조전원 연결 상태를 더 봐야 합니다."
        }
      ],
      examples: [
        "게임 로딩 화면에서 갑자기 꺼짐",
        "부하가 높아질수록 재부팅 빈도 증가"
      ],
      mistakes: [
        "게임만 삭제하고 끝내는 것",
        "전원부와 쿨링을 확인하지 않는 것"
      ],
      faq: [
        {
          q: "데스크톱인데도 전원 부족이 있나요?",
          a: "있습니다. 파워 용량이 부족하거나 노후되었거나, 그래픽카드 보조전원이 불안정하면 같은 증상이 날 수 있습니다."
        }
      ]
    },
    "no-display": {
      badge: "화면",
      subtitle: "전원은 들어오는데 화면이 안 뜰 때",
      intro: [
        "화면 미출력은 모니터 문제처럼 보여도 실제로는 케이블, 그래픽카드, 메모리 접촉 문제인 경우가 많습니다. 전원이 돌아가는 소리는 나지만 화면만 검다면 출력 경로를 차례대로 확인해야 합니다.",
        "이 증상은 단순히 선 하나만 바꿔보는 것으로 끝나지 않습니다. 입력 소스, 그래픽 포트, 램 재장착, 내장그래픽 여부를 함께 확인해야 원인을 좁힐 수 있습니다.",
        "부팅음이 들리는지, 팬은 도는지, LED가 어떻게 바뀌는지 같이 보면 더 빨리 판단할 수 있습니다."
      ],
      warnings: [
        "팬은 돌지만 화면만 검다.",
        "모니터 입력을 바꿔도 반응이 없다.",
        "램을 빼면 경고음이 나오는데 꽂으면 조용하다."
      ],
      checks: [
        {
          title: "케이블과 입력 소스 확인",
          why: "모니터 입력이 잘못되거나 케이블이 느슨해도 같은 증상입니다.",
          how: "HDMI/DP 케이블과 모니터 입력을 먼저 바꿔 봅니다."
        },
        {
          title: "그래픽카드와 메모리 재장착",
          why: "접촉 불량은 전원은 들어와도 출력만 안 되는 상황을 만듭니다.",
          how: "전원을 끄고 슬롯과 보조전원을 다시 확인하세요."
        },
        {
          title: "내장그래픽으로 분리 테스트",
          why: "그래픽카드가 원인인지 메인보드/메모리 쪽인지 구분할 수 있습니다.",
          how: "가능하면 내장그래픽 출력으로 한 번 시험해 보세요."
        }
      ],
      deeper: [
        {
          heading: "화면은 안 뜨는데 부팅은 되는 경우",
          text: "화면이 없다고 해서 항상 메인보드 고장은 아닙니다. 그래픽카드 출력 문제나 메모리 접촉 때문에 화면만 안 나오는 경우도 많아, 교차 테스트가 중요합니다."
        }
      ],
      decision: [
        {
          heading: "팬은 도는데 화면만 없을 때",
          text: "전원 반응은 있고 경고음도 없다면 케이블과 출력 포트부터 확인하고, 그 다음 그래픽카드 재장착으로 넘어가세요."
        },
        {
          heading: "경고음이 있을 때",
          text: "비프음이 난다면 메모리 접촉이 원인일 가능성이 높아, 램 교차 테스트가 더 우선입니다."
        }
      ],
      examples: [
        "전원 LED는 켜지는데 로고도 안 보임",
        "한 번은 뜨고 재부팅 후부터 안 뜸"
      ],
      mistakes: [
        "모니터만 계속 바꾸는 것",
        "램이나 그래픽카드 접촉 점검을 빼는 것"
      ],
      faq: [
        {
          q: "본체에서 경고음이 나는데도 화면이 안 뜹니다.",
          a: "경고음이 있다면 메모리나 그래픽 초기화가 문제일 가능성이 큽니다. 메모리 재장착부터 확인하는 것이 좋습니다."
        }
      ]
    },
    "nvme-delay": {
      badge: "저장장치",
      subtitle: "부팅이 느리거나 SSD 인식이 늦을 때",
      intro: [
        "NVMe 인식 지연은 부팅 초기에 저장장치가 늦게 잡히거나 아예 한 번씩 놓치는 상황에서 보입니다. SSD 자체가 느린 것이 아니라 슬롯, 펌웨어, 전원 관리가 얽혀 있는 경우가 많습니다.",
        "이 증상은 체감 속도 문제처럼 보여도 실제로는 부팅 안정성과 연결됩니다. 그래서 저장장치 상태와 메인보드 설정을 같이 봐야 합니다.",
        "특정 재부팅에서만 느리다면 접촉, 발열, 펌웨어 순으로 확인하는 것이 좋습니다."
      ],
      warnings: [
        "첫 부팅만 유난히 오래 걸린다.",
        "재부팅하면 가끔 SSD가 늦게 잡힌다.",
        "윈도우 들어가서도 디스크가 잠시 멈춘 듯하다."
      ],
      checks: [
        {
          title: "SMART와 건강 상태 확인",
          why: "읽기 실패와 지연은 디스크 상태의 초기 신호일 수 있습니다.",
          how: "디스크 건강, 온도, 오류 수치를 함께 보세요."
        },
        {
          title: "슬롯과 케이블 교차 확인",
          why: "NVMe 슬롯 접촉이나 SATA 케이블 문제로도 지연이 생깁니다.",
          how: "다른 슬롯이나 다른 케이블로 바꿔 보세요."
        },
        {
          title: "BIOS 저장장치 모드 확인",
          why: "인식 모드나 부팅 순서가 꼬이면 시작이 늦어질 수 있습니다.",
          how: "BIOS에서 저장장치 모드와 부팅 순서를 다시 봅니다."
        }
      ],
      deeper: [
        {
          heading: "디스크가 늦게 잡히는 이유",
          text: "저장장치가 느리다는 말은 실제 성능보다 초기 인식이나 전원 관리가 불안정하다는 뜻일 때가 많습니다. 같은 SSD라도 슬롯 위치, 발열, 펌웨어 버전에 따라 증상이 달라질 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "SMART가 정상일 때",
          text: "건강 수치가 좋아도 첫 부팅만 늦다면 슬롯 접촉이나 BIOS 설정 쪽을 먼저 보세요."
        },
        {
          heading: "부팅마다 증상이 바뀔 때",
          text: "가끔 잡히고 가끔 놓친다면 저장장치 자체보다 초기 전원 공급과 연결 상태를 더 의심해야 합니다."
        }
      ],
      examples: [
        "부팅 첫 화면에서 오래 멈춤",
        "재부팅할 때만 디스크가 늦게 보임"
      ],
      mistakes: [
        "윈도우만 재설치하고 저장장치는 그대로 두는 것",
        "온도와 슬롯 상태를 같이 보지 않는 것"
      ],
      faq: [
        {
          q: "SMART가 정상인데도 지연이 있습니다.",
          a: "그렇다면 슬롯 접촉, 펌웨어, 전원 관리 설정을 더 봐야 합니다. 건강 수치만으로는 초기 인식 문제를 놓칠 수 있습니다."
        }
      ]
    },
    "usb-not-detected": {
      badge: "USB",
      subtitle: "USB 장치가 아예 안 잡힐 때",
      intro: [
        "USB 미인식은 포트가 물리적으로 손상됐을 수도 있지만, 전력 부족이나 드라이버 문제처럼 소프트웨어적인 원인도 섞여 있습니다. 그래서 단순히 다른 기기를 꽂아보는 것보다 더 넓게 봐야 합니다.",
        "특히 허브, 전면 포트, 외장 하드처럼 전원 요구가 큰 장치에서 더 자주 나타납니다. 같은 장치가 다른 포트에서는 되는지부터 확인하면 원인을 빠르게 좁힐 수 있습니다.",
        "이 증상은 장치 관리자 상태와 물리 포트를 함께 보아야 합니다."
      ],
      warnings: [
        "특정 포트만 안 된다.",
        "허브를 끼우면 더 자주 끊긴다.",
        "장치 관리자에는 잠깐 보였다가 사라진다."
      ],
      checks: [
        {
          title: "다른 포트와 허브 제거",
          why: "물리 포트 문제인지 전력 문제인지 가장 먼저 가를 수 있습니다.",
          how: "허브를 빼고 본체의 다른 포트에 직접 꽂아 보세요."
        },
        {
          title: "장치 관리자 확인",
          why: "인식은 했지만 드라이버가 실패한 경우가 있습니다.",
          how: "알 수 없는 장치나 느낌표가 있는지 확인합니다."
        },
        {
          title: "전력과 절전 설정 점검",
          why: "USB 절전 옵션이 장치를 끊어 버리는 경우가 있습니다.",
          how: "전원 관리와 USB 선택적 절전 기능을 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "전력보다 드라이버일 수도 있음",
          text: "외장 HDD나 캡처 장치처럼 전력을 많이 쓰는 장치일수록 포트 문제처럼 보이지만, 실제로는 드라이버와 전원 관리 설정이 원인인 경우도 많습니다."
        }
      ],
      decision: [
        {
          heading: "다른 PC에서는 잘 될 때",
          text: "장치 자체는 정상일 가능성이 높고, 현재 PC의 절전 설정이나 드라이버 문제를 먼저 봐야 합니다."
        },
        {
          heading: "허브를 쓰고 있을 때",
          text: "허브를 거칠수록 전력과 신호가 흔들릴 수 있으니, 먼저 본체 직결 테스트를 해보세요."
        }
      ],
      examples: [
        "외장 SSD는 되는데 USB 메모리만 안 됨",
        "전면 포트는 안 되고 후면 포트는 정상"
      ],
      mistakes: [
        "포트만 바꾸고 장치 관리자를 안 보는 것",
        "허브를 계속 거친 상태로 테스트하는 것"
      ],
      faq: [
        {
          q: "다른 PC에서는 되는데 내 PC에서만 안 됩니다.",
          a: "그렇다면 포트, 전원 관리, 드라이버 설정 쪽 가능성이 큽니다. 장치 자체보다 현재 PC 설정을 먼저 보세요."
        }
      ]
    },
    "update-fail-loop": {
      badge: "업데이트",
      subtitle: "업데이트가 반복 실패하고 다시 시도될 때",
      intro: [
        "업데이트 반복 실패는 다운로드 자체가 안 되는 경우도 있지만, 설치 단계에서만 계속 되돌아가는 경우가 더 흔합니다. 이럴 때는 서버 문제로 넘기기보다 캐시, 권한, 남은 공간부터 보는 편이 빠릅니다.",
        "업데이트 기록에 같은 코드가 반복되면 윈도우 구성요소가 막혀 있을 가능성이 높습니다. 반대로 코드가 바뀌며 실패한다면 디스크 여유나 보안 정책, 서비스 충돌도 같이 봐야 합니다.",
        "이 페이지는 업데이트가 어디서 반복되는지에 따라 점검 순서를 나눠서 설명합니다."
      ],
      warnings: [
        "같은 업데이트를 여러 번 다시 시도한다.",
        "재부팅 후에도 바로 실패가 반복된다.",
        "디스크 공간이 거의 없거나 임시 파일이 많다."
      ],
      checks: [
        {
          title: "업데이트 기록과 코드 확인",
          why: "반복되는 실패는 같은 구성요소가 계속 막히고 있다는 신호입니다.",
          how: "설치 실패 코드와 반복되는 업데이트 이름을 먼저 적어 두세요."
        },
        {
          title: "임시 파일과 캐시 정리",
          why: "업데이트 캐시가 손상되면 같은 파일을 계속 다시 받다가 실패할 수 있습니다.",
          how: "디스크 정리와 업데이트 캐시 초기화를 순서대로 해보세요."
        },
        {
          title: "보안 프로그램과 정책 확인",
          why: "업데이트가 보안 프로그램이나 회사 정책에 막히는 경우도 있습니다.",
          how: "잠시 비활성화하거나 관리 정책이 걸려 있는지 확인합니다."
        }
      ],
      deeper: [
        {
          heading: "실패 코드보다 패턴이 더 중요할 때",
          text: "같은 코드가 반복되면 캐시와 서비스 문제일 가능성이 높고, 매번 다른 코드가 나오면 공간 부족이나 전원 끊김, 정책 충돌처럼 바깥 조건을 더 봐야 합니다."
        },
        {
          heading: "업데이트가 부팅 문제를 남길 때",
          text: "실패 후 재부팅이 되지 않으면 자동 복구 루프로 이어질 수 있으므로, 단순히 다시 누르기보다 복구 지점을 남겨두고 상태를 확인하는 것이 좋습니다."
        }
      ],
      decision: [
        {
          heading: "같은 코드가 계속 뜰 때",
          text: "업데이트 파일이나 서비스가 꼬였을 가능성이 높아 초기화와 캐시 정리를 먼저 해야 합니다."
        },
        {
          heading: "다른 코드가 번갈아 뜰 때",
          text: "디스크 공간, 전원 안정성, 백신/보안 정책처럼 외부 조건을 함께 확인하세요."
        }
      ],
      examples: [
        "설치 100% 직후에 되돌아가며 실패",
        "업데이트 기록에 같은 번호가 여러 번 남음"
      ],
      mistakes: [
        "실패 코드 없이 재시도만 반복하는 것",
        "공간이 부족한데도 큰 파일을 그대로 두는 것"
      ],
      faq: [
        {
          q: "업데이트를 일시 중지했다가 다시 하면 나아지나요?",
          a: "일시적으로 나아질 수는 있지만, 같은 패턴이 반복되면 캐시나 서비스 문제를 다시 봐야 합니다."
        }
      ]
    },
    "startup-slow": {
      badge: "부팅",
      subtitle: "바탕화면이 뜨기까지 시간이 길어질 때",
      intro: [
        "부팅 속도 저하는 전원이 켜지는 것과 윈도우가 완전히 준비되는 것을 분리해서 봐야 합니다. 전원은 바로 켜지는데 바탕화면만 늦다면 시작 프로그램, 디스크, 로그인 후 실행 항목이 더 중요합니다.",
        "특정 업데이트나 프로그램을 넣은 뒤부터 느려졌다면, 단순한 체감 저하가 아니라 시작 단계에서 기다리는 항목이 늘어났을 수 있습니다.",
        "이 증상은 부팅 실패와 달리 결국은 들어가지만 오래 걸린다는 점이 핵심입니다."
      ],
      warnings: [
        "전원은 켜지는데 로그인 후 오래 멈춘다.",
        "바탕화면이 뜬 뒤에도 한동안 아이콘이 안 보인다.",
        "재부팅할 때마다 걸리는 시간이 조금씩 다르다."
      ],
      checks: [
        {
          title: "시작 프로그램 정리",
          why: "부팅 직후 동시에 올라오는 항목이 많으면 체감이 크게 느려집니다.",
          how: "자동 실행 앱과 백그라운드 프로그램을 먼저 줄여 보세요."
        },
        {
          title: "디스크 지연 확인",
          why: "저장장치가 느리면 로그인 단계부터 전체가 늦어집니다.",
          how: "SMART 상태와 첫 부팅 지연 여부를 함께 봅니다."
        },
        {
          title: "업데이트 후 변화 확인",
          why: "부팅 스크립트나 드라이버가 바뀌면 로그인 뒤 지연이 생길 수 있습니다.",
          how: "최근 설치한 업데이트와 드라이버를 떠올려 보세요."
        }
      ],
      deeper: [
        {
          heading: "로그인 전과 후를 구분하기",
          text: "전원 버튼을 누른 직후가 느린지, 로그인한 뒤가 느린지에 따라 원인이 달라집니다. 로그인 후만 느리면 프로그램과 서비스 비중이 더 높습니다."
        }
      ],
      decision: [
        {
          heading: "로그인 후만 느릴 때",
          text: "자동 실행 항목과 백그라운드 동기화 프로그램을 먼저 줄여 보세요."
        },
        {
          heading: "전원 켠 직후부터 느릴 때",
          text: "저장장치 인식이나 BIOS 초기화 쪽을 먼저 확인하는 편이 맞습니다."
        }
      ],
      examples: [
        "암호 입력 후 바탕화면이 1분 이상 늦게 뜸",
        "작업표시줄이 한참 뒤에야 반응함"
      ],
      mistakes: [
        "부팅 지연을 그냥 체감 문제로 넘기는 것",
        "시작 프로그램을 전혀 보지 않는 것"
      ],
      faq: [
        {
          q: "안전 모드에서는 빠른데 일반 부팅만 느립니다.",
          a: "이 경우는 시작 프로그램이나 드라이버 충돌 가능성이 더 높습니다."
        }
      ]
    },
    "taskbar-freeze": {
      badge: "작업표시줄",
      subtitle: "시작 메뉴와 알림 영역이 멈출 때",
      intro: [
        "작업표시줄 멈춤은 탐색기 셸이 화면 아래쪽 UI를 그리다가 응답을 잃는 현상입니다. 일반적인 창은 열리지만 시작 메뉴나 알림 영역만 멈추는 경우가 많아, 전체 윈도우보다 셸 구성 문제로 보는 편이 맞습니다.",
        "최근 설치한 시작 메뉴 수정 도구, 우클릭 확장, 스킨 변경 도구가 있으면 더 의심해야 합니다.",
        "증상이 자주 풀렸다 다시 멈춘다면 임시 캐시와 셸 확장을 함께 봐야 합니다."
      ],
      warnings: [
        "시작 메뉴를 눌러도 바로 안 열린다.",
        "오른쪽 알림 아이콘이 늦게 반응한다.",
        "탐색기는 살아 있는데 작업표시줄만 굳는다."
      ],
      checks: [
        {
          title: "탐색기 재시작",
          why: "작업표시줄은 탐색기와 같이 움직이므로 셸만 재시작해도 풀릴 수 있습니다.",
          how: "작업 관리자에서 Explorer를 다시 시작해 보세요."
        },
        {
          title: "최근 셸 확장 확인",
          why: "메뉴를 붙이는 프로그램이 응답을 잡아먹는 경우가 많습니다.",
          how: "최근 설치한 꾸미기 도구, 압축 도구, 시작 메뉴 변경 도구를 확인합니다."
        },
        {
          title: "업데이트와 로그 확인",
          why: "업데이트 후 셸 구성 파일이 꼬이면 같은 증상이 반복됩니다.",
          how: "최근 업데이트 직후부터인지 기록을 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "탐색기 전체와 작업표시줄은 다를 수 있음",
          text: "창 탐색이 괜찮은데 아래 메뉴만 멈춘다면 전체 윈도우 문제보다 셸 확장이나 시작 메뉴 컴포넌트를 먼저 보는 것이 맞습니다."
        }
      ],
      decision: [
        {
          heading: "시작 메뉴만 멈출 때",
          text: "시작 메뉴 관련 앱이나 셸 확장이 원인일 수 있어, 최근 설치한 인터페이스 도구부터 빼보세요."
        },
        {
          heading: "알림 영역만 늦을 때",
          text: "네트워크, 보안, 동기화 아이콘이 뒤늦게 뜨면 백그라운드 서비스 지연을 함께 봐야 합니다."
        }
      ],
      examples: [
        "작업표시줄이 회색으로 멈췄다가 풀림",
        "시작 메뉴가 누를 때마다 5초 이상 지연"
      ],
      mistakes: [
        "탐색기만 재시작하고 원인을 끝낸다고 보는 것",
        "최근 설치 프로그램을 빼놓는 것"
      ],
      faq: [
        {
          q: "작업표시줄이 멈추면 재부팅만 해야 하나요?",
          a: "재부팅이 임시로 풀어줄 수는 있지만, 반복되면 셸 확장과 업데이트 기록을 먼저 보는 것이 좋습니다."
        }
      ]
    },
    "wifi-disconnect": {
      badge: "네트워크",
      subtitle: "무선 인터넷이 자꾸 끊길 때",
      intro: [
        "와이파이 끊김은 공유기 신호 문제처럼 보여도 실제로는 드라이버와 절전 설정이 더 큰 원인일 수 있습니다. 같은 장소에서만 끊기는지, 다른 네트워크에서도 끊기는지 구분하면 방향이 빨라집니다.",
        "특히 노트북에서는 전원 모드 변화만으로도 무선 어댑터가 잠깐씩 내려갈 수 있습니다. 이럴 때는 신호 세기보다 절전 옵션을 먼저 봐야 합니다.",
        "끊김이 몇 초마다 반복되는지, 아니면 특정 시간대에만 생기는지도 중요한 단서입니다."
      ],
      warnings: [
        "몇 분마다 연결이 끊겼다 다시 붙는다.",
        "유선은 괜찮은데 무선만 불안정하다.",
        "절전 후에 더 자주 끊긴다."
      ],
      checks: [
        {
          title: "무선 드라이버 점검",
          why: "어댑터 드라이버가 불안정하면 연결이 살아나도 금방 끊길 수 있습니다.",
          how: "제조사 드라이버로 다시 설치해 보세요."
        },
        {
          title: "전원 관리와 절전 해제",
          why: "절전 전환이 어댑터를 끊어 버리면 불안정하게 보입니다.",
          how: "무선 어댑터의 전원 절약 옵션을 확인합니다."
        },
        {
          title: "공유기/채널과 거리 확인",
          why: "신호 간섭이나 채널 충돌도 반복 끊김을 만듭니다.",
          how: "다른 네트워크나 다른 위치에서 재현되는지 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "무선만 끊기고 유선은 안정적일 때",
          text: "네트워크 전체보다 무선 어댑터와 전원 관리가 우선 의심 대상입니다. 같은 인터넷 회선이라도 무선 전용 문제일 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "절전 후에만 끊길 때",
          text: "전원 관리 옵션이 원인일 가능성이 높아 드라이버 설정을 먼저 점검하세요."
        },
        {
          heading: "어느 장소에서든 끊길 때",
          text: "공유기보다 무선 어댑터 자체나 드라이버를 더 우선해서 봐야 합니다."
        }
      ],
      examples: [
        "유튜브를 보다 갑자기 끊김",
        "잠깐 화면을 끄면 다시 연결이 불안정해짐"
      ],
      mistakes: [
        "공유기만 재부팅하고 끝내는 것",
        "절전 옵션을 안 보는 것"
      ],
      faq: [
        {
          q: "다른 기기는 멀쩡한데 내 PC만 끊깁니다.",
          a: "그렇다면 공유기보다 PC의 무선 드라이버와 전원 설정을 먼저 보세요."
        }
      ]
    },
    "overheat-shutdown": {
      badge: "전원",
      subtitle: "부하가 걸리면 갑자기 꺼질 때",
      intro: [
        "과열로 전원이 꺼지는 문제는 팬이 돈다고 끝이 아닙니다. 먼지, 써멀 상태, 방열판 접촉, 전원부 온도가 함께 영향을 줍니다.",
        "특히 게임, 영상 인코딩, 압축 해제처럼 부하가 걸릴 때만 꺼진다면 온도와 전력 공급을 같이 봐야 합니다.",
        "재부팅 직후에는 멀쩡한데 조금 쓰다 꺼진다면 냉각 능력이 부족할 가능성이 큽니다."
      ],
      warnings: [
        "소음이 커지고 나서 꺼진다.",
        "여름철이나 실내 온도가 높을 때 더 심하다.",
        "부하가 낮을 때는 괜찮다."
      ],
      checks: [
        {
          title: "온도 로그 확인",
          why: "부하 직전의 최고 온도가 중요합니다.",
          how: "CPU와 GPU 온도가 어디까지 올라가는지 확인합니다."
        },
        {
          title: "먼지와 쿨링 상태 점검",
          why: "먼지와 막힌 통풍구는 냉각 효율을 크게 떨어뜨립니다.",
          how: "팬, 방열판, 흡기/배기 통로를 살펴보세요."
        },
        {
          title: "전원부와 파워 용량 확인",
          why: "온도처럼 보여도 전원 공급이 꺼지는 경우가 있습니다.",
          how: "파워 용량과 보조전원 연결도 같이 봅니다."
        }
      ],
      deeper: [
        {
          heading: "꺼지는 시점이 매번 비슷한가",
          text: "비슷한 부하에서 늘 꺼진다면 쿨링 한계가 가까운 것이고, 들쭉날쭉하면 전원부나 접촉 상태도 함께 의심해야 합니다."
        }
      ],
      decision: [
        {
          heading: "온도 기록이 높게 잡힐 때",
          text: "냉각 문제로 보고 팬, 써멀, 통풍부터 손보는 편이 맞습니다."
        },
        {
          heading: "온도는 정상인데 꺼질 때",
          text: "파워나 메인보드 전원부, 보조전원 연결 상태를 더 봐야 합니다."
        }
      ],
      examples: [
        "게임 로딩 중 전원이 바로 꺼짐",
        "인코딩 시작 후 10분쯤 지나면 꺼짐"
      ],
      mistakes: [
        "팬만 돌면 쿨링이 충분하다고 보는 것",
        "전원 문제를 아예 제외하는 것"
      ],
      faq: [
        {
          q: "온도는 낮은데도 꺼집니다.",
          a: "그렇다면 파워, 메인보드 전원부, 보조전원 연결 상태를 먼저 확인하세요."
        }
      ]
    },
    "sound-not-working": {
      badge: "오디오",
      subtitle: "소리가 전혀 안 나거나 장치가 바뀔 때",
      intro: [
        "소리 문제는 스피커가 고장난 것처럼 보여도 실제로는 출력 장치 선택이 바뀌었거나 드라이버가 꼬인 경우가 많습니다. 이어폰과 스피커, HDMI 오디오가 서로 바뀌어 들어가면 소리가 사라진 것처럼 느껴질 수 있습니다.",
        "오디오가 아예 안 들리는지, 특정 앱에서만 안 들리는지도 구분해야 합니다. 앱 문제와 시스템 문제는 점검 순서가 다릅니다.",
        "설정 화면에서 보이는 출력 장치와 실제 연결된 장치를 맞춰 보는 것이 첫걸음입니다."
      ],
      warnings: [
        "볼륨은 켜져 있는데 소리만 없다.",
        "이어폰을 꽂으면 장치가 바뀐다.",
        "앱마다 들리거나 안 들리는 패턴이 다르다."
      ],
      checks: [
        {
          title: "출력 장치 확인",
          why: "기본 출력이 바뀌면 소리가 사라진 것처럼 보입니다.",
          how: "스피커, 이어폰, 모니터 오디오 중 무엇이 선택됐는지 확인하세요."
        },
        {
          title: "오디오 드라이버 점검",
          why: "장치가 잡히지 않으면 드라이버 문제일 수 있습니다.",
          how: "제조사 드라이버로 다시 설치해 보세요."
        },
        {
          title: "포트와 앱별 재현 확인",
          why: "헤드폰 단자나 특정 앱만 문제인지 나누면 원인이 좁혀집니다.",
          how: "다른 포트와 다른 앱에서 소리를 시험해 보세요."
        }
      ],
      deeper: [
        {
          heading: "장치는 보이는데 소리만 없을 때",
          text: "출력 장치가 보인다고 끝이 아닙니다. 음소거, 앱 볼륨, 향상 기능 충돌이 함께 있으면 실제로는 아무 소리도 안 날 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "장치가 자꾸 바뀔 때",
          text: "기본 출력 장치 설정과 연결 포트를 다시 맞추세요."
        },
        {
          heading: "특정 앱만 안 들릴 때",
          text: "시스템 전체보다 앱별 볼륨과 오디오 출력 지정 문제를 먼저 확인해야 합니다."
        }
      ],
      examples: [
        "유튜브는 안 들리는데 시스템 소리는 들림",
        "모니터를 바꾸면 소리 출력이 사라짐"
      ],
      mistakes: [
        "볼륨 아이콘만 보고 끝내는 것",
        "출력 장치가 바뀐 사실을 놓치는 것"
      ],
      faq: [
        {
          q: "이어폰을 꽂았는데도 소리가 안 납니다.",
          a: "기본 출력 장치와 장치 인식 상태를 먼저 확인하고, 다른 포트로도 시험해 보세요."
        }
      ]
    },
    "sleep-resume-fail": {
      badge: "절전",
      subtitle: "절전에서 복귀할 때 화면이 멈추거나 오류가 날 때",
      intro: [
        "절전 복귀 실패는 단순한 화면 꺼짐과 다릅니다. 잠자기 상태에서 돌아오는 순간 전원 관리 드라이버가 장치를 다시 깨우지 못하면 화면이 멈추거나 블루스크린으로 이어질 수 있습니다.",
        "이 증상은 노트북과 데스크톱 모두에서 보이지만, USB 장치나 네트워크 어댑터가 많은 환경에서 더 자주 드러납니다. 그래서 복귀 직후에만 재현되는지, 연결 장치를 바꾸면 나아지는지를 먼저 봐야 합니다.",
        "절전은 잘 들어가는데 복귀만 안 되는지, 아니면 아예 재부팅까지 이어지는지 구분하면 원인을 더 빨리 좁힐 수 있습니다."
      ],
      warnings: [
        "절전 후 화면이 검은 채 멈춘다.",
        "복귀 직후 블루스크린이 뜬다.",
        "USB나 네트워크 장치를 꽂으면 더 심해진다."
      ],
      checks: [
        {
          title: "절전 직후 재현 여부",
          why: "바로 깨어날 때만 문제면 전원 상태 전환이 핵심입니다.",
          how: "절전 후 1분 이내와 오래 지난 뒤를 나눠 확인하세요."
        },
        {
          title: "최근 연결 장치 제거",
          why: "USB 허브, 도킹 스테이션, 네트워크 장치가 복귀를 방해할 수 있습니다.",
          how: "새로 꽂은 장치를 빼고 다시 시험해 보세요."
        },
        {
          title: "전원 관리와 BIOS 설정",
          why: "깊은 절전 설정이 복귀 실패를 더 자주 만듭니다.",
          how: "고급 전원 설정과 BIOS의 절전 관련 옵션을 확인합니다."
        }
      ],
      deeper: [
        {
          heading: "블루스크린과 그냥 멈춤을 구분하기",
          text: "복귀 직후 화면이 멈추는지, 아니면 특정 코드와 함께 블루스크린이 나는지에 따라 보는 항목이 달라집니다. 0x0000009F가 보이면 전원 상태 전환 드라이버 쪽 가능성을 더 높게 봐야 합니다."
        },
        {
          heading: "노트북과 데스크톱의 차이",
          text: "노트북은 배터리와 전원 절전 정책이, 데스크톱은 USB 장치와 네트워크 어댑터가 더 큰 변수가 될 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "절전 후에만 멈출 때",
          text: "전원 관리 드라이버와 주변 장치의 절전 설정을 먼저 점검하세요."
        },
        {
          heading: "복귀 직후 블루스크린이 뜰 때",
          text: "최근 장치 드라이버와 0x0000009F 같은 전원 상태 오류를 함께 확인해야 합니다."
        }
      ],
      examples: [
        "절전은 되는데 깨우면 화면이 검은 채 멈춤",
        "잠깐 후에 0x0000009F 블루스크린이 뜸"
      ],
      mistakes: [
        "강제 종료만 반복하는 것",
        "절전 설정을 전혀 안 보는 것"
      ],
      faq: [
        {
          q: "절전만 문제고 재부팅은 괜찮습니다.",
          a: "그렇다면 저장장치보다 전원 상태 전환 드라이버나 주변 장치 쪽 가능성이 높습니다."
        }
      ]
    },
    "no-power": {
      badge: "전원",
      subtitle: "전원 버튼을 눌러도 거의 반응이 없을 때",
      intro: [
        "전원 반응 없음은 윈도우 문제가 아니라 가장 하드웨어적인 문제에 가깝습니다. 팬이 아예 돌지 않거나 LED만 잠깐 깜빡이고 꺼진다면 전원 공급, 전면 패널, 메인보드 연결을 먼저 확인해야 합니다.",
        "이 증상은 부품 하나만의 문제로 보이기 쉽지만, 실제로는 24핀 ATX 전원이나 8핀 EPS 전원이 살짝 빠져 있어도 생깁니다. 따라서 부품 교체보다 연결 상태 점검이 먼저입니다.",
        "전원 버튼을 눌렀을 때 소리가 나는지, LED가 반응하는지, 완전 무반응인지부터 정확히 나눠 보세요."
      ],
      warnings: [
        "팬이 한 번도 돌지 않는다.",
        "전원 LED가 잠깐만 깜빡인다.",
        "본체에서 전기 냄새나 타는 냄새가 난다."
      ],
      checks: [
        {
          title: "전원 케이블과 멀티탭 확인",
          why: "외부 전원 공급이 끊겨 있으면 아무 반응도 없습니다.",
          how: "벽면 콘센트와 PSU 전원 스위치를 먼저 확인하세요."
        },
        {
          title: "24핀과 8핀 재체결",
          why: "메인보드 전원 연결이 살짝만 느슨해도 부팅이 안 됩니다.",
          how: "전원을 끄고 24핀 ATX와 8핀 EPS를 다시 꽂아 보세요."
        },
        {
          title: "전면 패널 버튼과 케이스 선 점검",
          why: "버튼 접점이나 프런트 패널 선이 빠져도 반응이 없습니다.",
          how: "메인보드의 PWR SW 연결 상태를 확인합니다."
        }
      ],
      deeper: [
        {
          heading: "PSU 문제와 버튼 문제를 나누기",
          text: "버튼을 눌렀을 때 LED는 켜지지만 바로 꺼지는 경우와, 아예 무반응인 경우는 보는 순서가 다릅니다. 후자는 파워 연결이나 PSU 자체를 더 먼저 의심해야 합니다."
        }
      ],
      decision: [
        {
          heading: "LED도 안 켜질 때",
          text: "PSU 스위치, 콘센트, 24핀과 8핀 연결을 먼저 보세요."
        },
        {
          heading: "잠깐 켜졌다 꺼질 때",
          text: "전원부나 쇼트 가능성까지 고려해야 하며, 부품 재장착을 조심스럽게 진행해야 합니다."
        }
      ],
      examples: [
        "전원 버튼을 눌러도 팬이 1초도 안 돈다",
        "LED만 잠깐 켜졌다가 바로 꺼짐"
      ],
      mistakes: [
        "무작정 파워만 교체하는 것",
        "전면 패널 선을 안 보는 것"
      ],
      faq: [
        {
          q: "전원은 들어오는데 화면만 안 뜨는 건가요?",
          a: "그 경우는 전원 반응 없음과 다릅니다. 이 페이지는 본체가 거의 켜지지 않는 상황을 기준으로 봐야 합니다."
        }
      ]
    }
  }
};
