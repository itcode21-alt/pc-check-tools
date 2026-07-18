window.SITE_DATA = {
  siteName: "PC 윈도우 진단 센터",
  siteUrl: "https://itsvc.co.kr",
  errorCodes: [
    {
      code: "0xC000021A",
      title: "Critical System Process 종료",
      overview: "csrss.exe나 winlogon.exe 같은 핵심 시스템 프로세스가 예기치 않게 종료되면 운영체제 전체가 더 이상 정상 동작을 보장할 수 없다고 판단해 강제로 블루스크린을 띄웁니다. 로그인 화면 직전이나 직후에 자주 나타나며, 재부팅해도 같은 지점에서 반복되는 경우가 많습니다.",
      summary: "csrss.exe나 winlogon.exe 같은 핵심 시스템 프로세스가 예기치 않게 종료되면 운영체제 전체가 더 이상 정상 동작을 보장할 수 없다고 판단해 강제로 블루스크린을 띄웁니다.",
      causes: ["그래픽 드라이버나 로그인 관련 셸 확장이 손상되어 로그인 프로세스가 강제로 죽는 경우", "최근 윈도우 업데이트가 시스템 파일 일부를 덮어쓰면서 필수 프로세스와 충돌하는 경우", "맬웨어나 신뢰할 수 없는 프로그램이 시스템 프로세스 메모리 영역을 건드리는 경우", "디스크 배드섹터로 인해 csrss.exe, winlogon.exe 실행 파일 자체가 손상된 경우", "타사 보안 소프트웨어가 시스템 프로세스를 오탐지해 강제로 종료시키는 경우"],
      checks: ["안전 모드로 부팅이 되는지 먼저 확인하세요. 안전 모드에서는 정상이라면 최근 설치한 드라이버나 프로그램이 원인일 가능성이 큽니다.", "설정 > 업데이트 및 보안에서 최근 설치된 업데이트 날짜를 확인하고, 증상이 그 시점부터 시작됐다면 업데이트 제거를 시도하세요.", "명령 프롬프트에서 sfc /scannow를 실행해 손상된 시스템 파일을 검사하고 복구합니다.", "최근 설치한 보안 프로그램이 있다면 일시적으로 비활성화한 뒤 재부팅해 재현 여부를 확인하세요.", "위 방법으로도 해결되지 않으면 복구 환경(고급 옵션)에서 시스템 복원 지점을 이용해 이전 상태로 되돌리는 것을 고려하세요."],
      link: "error-code-0xc000021a.html",
      detailPage: "error-code-0xc000021a.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["c000021a", "0xc000021a"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xC000021A WINLOGON_FATAL_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc000021a--winlogin-fatal-error"}
    },
    {
      code: "0x0000007B",
      title: "INACCESSIBLE_BOOT_DEVICE",
      overview: "윈도우가 부팅 파티션이 있는 저장장치를 인식하지 못하거나 접근에 실패했을 때 나타나는 대표적인 부팅 오류입니다. 하드웨어를 교체하거나 BIOS 설정을 바꾼 직후에 특히 자주 발생합니다.",
      summary: "윈도우가 부팅 파티션이 있는 저장장치를 인식하지 못하거나 접근에 실패했을 때 나타나는 대표적인 부팅 오류입니다.",
      causes: ["SATA/NVMe 케이블이 느슨하거나 슬롯 접촉이 불량해 부팅 디스크를 찾지 못하는 경우", "BIOS/UEFI에서 저장장치 컨트롤러 모드(AHCI/RAID)를 최근에 변경한 경우", "저장장치 드라이버가 손상되었거나 업데이트 후 호환되지 않게 바뀐 경우", "디스크 파티션의 부팅 관련 정보(BCD)가 손상되어 부팅 경로를 찾지 못하는 경우", "메인보드를 교체하거나 디스크를 다른 시스템에서 옮겨온 경우 드라이버 불일치로 발생하는 경우"],
      checks: ["PC 전원을 끄고 저장장치와 메인보드를 연결하는 케이블(또는 M.2 슬롯 장착 상태)을 다시 확인하세요.", "BIOS로 진입해 저장장치 컨트롤러 모드가 최근에 바뀌었는지 확인하고, 바뀌었다면 원래 설정으로 되돌려 보세요.", "설치 미디어로 부팅해 복구 환경에서 bootrec /fixmbr, bootrec /fixboot 명령으로 부팅 정보를 복구합니다.", "디스크 관리 도구나 제조사 진단 툴로 디스크 상태(배드섹터, 온도, S.M.A.R.T)를 점검하세요.", "최근 하드웨어를 변경했다면 변경 전 상태로 되돌려서 같은 증상이 재현되는지 확인해 원인을 좁히세요."],
      link: "error-code-0x0000007b.html",
      detailPage: "error-code-0x0000007b.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["7b", "0000007b", "0x7b"],
      communityCases: [{"title": "윈도우10 → 11 업그레이드 우회로 해결한 사례", "summary": "새로 조립한 PC에 윈도우 11을 USB로 직접 설치했을 때 계속 이 오류가 발생했던 사례가 있습니다. 드라이버 재설치, 복구 명령어, BIOS 설정 변경까지 다양한 시도를 했지만 해결되지 않았는데, 결국 윈도우 10을 먼저 설치한 뒤 온라인으로 윈도우 11까지 업그레이드하는 방식으로 우회해서 해결했습니다.", "insight": "정확한 원인은 명확하지 않지만, USB로 최신 윈도우를 바로 설치하는 과정에서 특정 하드웨어 조합에 문제가 생길 수 있습니다."}, {"title": "바이오스(CMOS) 초기화로 해결한 사례", "summary": "오버클럭 설정을 건드린 직후 이 오류가 발생한 사례도 있었는데, CMOS 배터리를 잠시 분리했다가 다시 끼워 바이오스 설정을 초기화하는 것으로 해결됐습니다.", "insight": "최근 오버클럭이나 BIOS 설정을 변경한 직후 이 오류가 나타났다면, 원인이 저장장치 자체보다 불안정해진 시스템 설정에 있을 수 있습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x7B INACCESSIBLE_BOOT_DEVICE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7b--inaccessible-boot-device"}
    },
    {
      code: "0x0000001E",
      title: "KMODE_EXCEPTION_NOT_HANDLED",
      overview: "커널 모드에서 실행 중이던 프로그램이 예외를 일으켰는데 그 예외를 처리할 핸들러가 없어서 나타나는 코드입니다. 이벤트 뷰어의 Kernel-Power(41) 이벤트 세부 정보에서 BugcheckCode 값이 30(10진수)으로 표시된다면 이 코드(0x1E, 16진수 1E=10진수 30)를 가리킵니다. 드라이버 결함이 가장 흔한 원인이지만, 램 자체의 하드웨어 결함으로도 발생할 수 있습니다.",
      summary: "커널 모드 프로그램이 처리되지 않은 예외를 일으켰을 때 나타나는 코드로, 드라이버 결함이나 램 하드웨어 결함이 흔한 원인입니다.",
      causes: ["그래픽·저장장치·네트워크 등 특정 드라이버가 손상되었거나 최신 윈도우 빌드와 호환되지 않는 경우", "램 모듈이 불안정하거나 슬롯 접촉이 불량한 경우", "램 오버클럭(XMP)이 시스템 안정성 한계를 넘은 경우", "디스크 오류로 인해 커널이 참조하는 파일이 손상된 경우", "타사 보안·튜닝 소프트웨어가 커널 모드에서 충돌하는 경우"],
      checks: ["이벤트 뷰어(eventvwr.msc)에서 이 코드 발생 직전 어떤 드라이버나 서비스가 관여했는지 확인하세요.", "장치 관리자에서 최근 설치·업데이트한 드라이버를 확인하고 이전 버전으로 롤백해 보세요.", "메모리 진단 도구(mdsched.exe) 또는 MemTest86·TM5로 램 상태를 점검하세요.", "BIOS에서 XMP나 오버클럭 설정을 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "명령 프롬프트에서 sfc /scannow와 chkdsk /f 를 실행해 시스템 파일과 디스크 오류를 점검하세요."],
      link: "error-code-0x0000001e.html",
      detailPage: "error-code-0x0000001e.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["1e", "0000001e", "0x1e", "30", "bugcheckcode30"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x1E KMODE_EXCEPTION_NOT_HANDLED","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x1e--kmode-exception-not-handled"}
    },
    {
      code: "0x0000001A",
      title: "MEMORY_MANAGEMENT",
      overview: "메모리 관리자가 페이지 테이블이나 메모리 할당 과정에서 예상치 못한 상태를 발견했을 때 나타나는 코드입니다. 램 자체의 불량뿐 아니라 드라이버의 메모리 오용도 흔한 원인입니다.",
      summary: "메모리 관리자가 페이지 테이블이나 메모리 할당 과정에서 예상치 못한 상태를 발견했을 때 나타나는 코드입니다.",
      causes: ["램 모듈이 물리적으로 불안정하거나 슬롯 접촉이 불량한 경우", "듀얼 채널 구성 시 서로 다른 규격의 램을 혼용해 타이밍이 맞지 않는 경우", "그래픽이나 네트워크 드라이버가 메모리를 잘못 참조하는 경우", "디스크 오류로 인해 페이징 파일(가상 메모리)이 손상된 경우", "램 오버클럭이나 XMP 프로파일 설정이 시스템 안정성 한계를 넘은 경우"],
      checks: ["메모리 진단 도구(mdsched.exe 또는 MemTest86)를 실행해 램 자체의 불량 여부를 확인하세요.", "램을 한 개씩 꽂아가며 재부팅해 특정 모듈이나 슬롯에서만 문제가 재현되는지 확인하세요.", "BIOS에서 XMP나 오버클럭 설정을 끄고 기본 클럭으로 되돌린 뒤 증상이 사라지는지 확인하세요.", "최근 설치하거나 업데이트한 드라이버가 있다면 제거 후 재현 여부를 확인하세요.", "디스크 검사(chkdsk)를 실행해 페이징 파일이 저장된 디스크에 오류가 없는지 점검하세요."],
      link: "error-code-0x0000001a.html",
      detailPage: "error-code-0x0000001a.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["1a", "0000001a", "0x1a"],
      communityCases: [{"title": "램 오버클럭(XMP) 낮춰서 해결한 사례", "summary": "새로 조립한 PC에서 게임 중 반복적으로 이 블루스크린이 발생했던 사례가 있습니다. 램 자체는 정상으로 테스트됐지만, XMP로 설정된 고클럭(3600MHz)이 실제로는 불안정했던 것이 원인이었고, 클럭을 3200~3400MHz로 낮춘 뒤 재현되지 않았습니다.", "insight": "메모리 진단 도구를 통과해도 XMP/오버클럭 설정 자체가 불안정의 원인일 수 있습니다. 기본 클럭에서 안정적이라면 XMP 프로파일을 의심해보세요."}, {"title": "SFC로 시스템 파일 복구해 해결한 사례", "summary": "램과 디스크 모두 정상으로 진단됐는데도 이 블루스크린이 반복됐던 사례에서는, sfc /scannow 명령이 손상된 시스템 파일을 발견해 복구한 뒤로 더 이상 블루스크린이 발생하지 않았습니다.", "insight": "이름은 '메모리 관리' 오류지만 실제 원인이 하드웨어가 아니라 손상된 시스템 파일인 경우도 있습니다. 하드웨어 교체를 고려하기 전에 SFC 결과를 먼저 확인해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x1A MEMORY_MANAGEMENT","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x1a--memory-management"}
    },
    {
      code: "0x00000050",
      title: "PAGE_FAULT_IN_NONPAGED_AREA",
      overview: "시스템이 메모리에 상주해야 할 데이터를 찾지 못하고 디스크에서 읽으려다 실패했을 때 나타납니다. 드라이버 결함과 램 불량이 가장 흔한 두 원인으로 꼽힙니다.",
      summary: "시스템이 메모리에 상주해야 할 데이터를 찾지 못하고 디스크에서 읽으려다 실패했을 때 나타납니다.",
      causes: ["최근 설치한 드라이버가 메모리 주소를 잘못 참조하는 경우", "램 모듈 접촉 불량이나 물리적 결함이 있는 경우", "바이러스 백신 등 커널 모드로 동작하는 보안 소프트웨어와의 충돌", "디스크 캐시나 파일 시스템 손상으로 필요한 데이터를 읽지 못하는 경우", "메모리 오버클럭으로 인한 불안정"],
      checks: ["장치 관리자에서 최근 업데이트되거나 설치된 드라이버(특히 그래픽, 네트워크, 저장장치)를 확인하고 이전 버전으로 롤백해 보세요.", "메모리 진단 도구로 램 상태를 점검하고, 가능하면 램을 하나씩 꽂아 테스트해 보세요.", "최근 설치한 보안 프로그램을 임시로 제거하거나 비활성화한 뒤 재현 여부를 확인하세요.", "명령 프롬프트에서 chkdsk /f 를 실행해 디스크 오류를 점검하고 수정하세요.", "오버클럭 설정이 있다면 기본값으로 되돌린 뒤 안정성이 개선되는지 확인하세요."],
      link: "error-code-0x00000050.html",
      detailPage: "error-code-0x00000050.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["50", "00000050", "0x50"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x50 PAGE_FAULT_IN_NONPAGED_AREA","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x50--page-fault-in-nonpaged-area"},
      communityCases: [{"title": "램 교체로 해결한 사례", "summary": "드라이버 롤백, 메모리 진단 도구, chkdsk까지 다 시도했지만 이 블루스크린이 며칠 간격으로 반복됐던 사례가 있습니다. Windows 자체 메모리 진단에서는 이상이 없었지만 MemTest86으로 여러 시간 검사하자 램 한 개에서 오류가 확인됐고, 해당 램을 교체한 뒤로는 재발하지 않았습니다.", "insight": "Windows 메모리 진단 도구는 짧은 시간 안에 끝나는 만큼 간헐적인 불량을 놓칠 수 있습니다. 계속 반복된다면 MemTest86처럼 더 오래, 더 여러 패스로 검사하는 도구로 다시 확인해보세요."}],
    },
    {
      code: "0x80070002",
      title: "파일을 찾을 수 없음",
      overview: "윈도우 업데이트나 설치, 복구 과정에서 필요한 파일을 찾지 못했을 때 표시되는 오류입니다. 업데이트 캐시가 손상되었거나 경로 설정이 꼬였을 때 자주 나타납니다.",
      summary: "윈도우 업데이트나 설치, 복구 과정에서 필요한 파일을 찾지 못했을 때 표시되는 오류입니다.",
      causes: ["윈도우 업데이트 캐시(SoftwareDistribution 폴더)가 손상된 경우", "시스템 날짜/시간이 잘못 설정되어 업데이트 서버 인증에 실패하는 경우", "이전에 중단된 업데이트나 설치 작업의 잔여 파일이 충돌하는 경우", "그룹 정책이나 레지스트리 설정이 업데이트 경로를 잘못 가리키는 경우", "디스크 여유 공간 부족으로 임시 파일을 만들지 못하는 경우"],
      checks: ["서비스 창(services.msc)에서 Windows Update 서비스를 중지한 뒤 SoftwareDistribution 폴더 이름을 바꾸고 서비스를 다시 시작해 캐시를 초기화하세요.", "설정에서 날짜와 시간이 정확한지, 시간대가 올바른지 확인하세요.", "디스크 정리 도구로 임시 파일과 이전 업데이트 잔여 파일을 정리하세요.", "저장 공간이 최소 10GB 이상 남아있는지 확인하세요.", "그래도 반복되면 Windows Update 문제 해결사(트러블슈터)를 실행해 자동 진단을 받아보세요."],
      link: "error-code-0x80070002.html",
      detailPage: "error-code-0x80070002.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80070002", "0x80070002"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_FILE_NOT_FOUND","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x80070057",
      title: "매개 변수가 올바르지 않음",
      overview: "설치나 업데이트, 명령 실행 시 시스템이 받은 입력값이나 설정값을 처리할 수 없을 때 나타나는 오류입니다. 겉보기엔 단순해 보이지만 실제 원인은 다양할 수 있습니다.",
      summary: "설치나 업데이트, 명령 실행 시 시스템이 받은 입력값이나 설정값을 처리할 수 없을 때 나타나는 오류입니다.",
      causes: ["업데이트 구성 파일이나 레지스트리 값이 손상된 경우", "디스크 파티션 형식(MBR/GPT)이 설치 방식과 맞지 않는 경우", "USB 설치 미디어 제작 시 파일 시스템(FAT32/NTFS) 설정이 잘못된 경우", "그룹 정책에서 지원하지 않는 옵션을 강제로 지정한 경우", "백업/복원 도구에서 지정한 경로나 옵션 형식이 맞지 않는 경우"],
      checks: ["최근 변경한 설정이나 정책이 있다면 기본값으로 되돌려 보세요.", "설치 미디어를 사용 중이라면 공식 미디어 생성 도구로 새로 만들어 보세요.", "디스크 관리에서 대상 디스크의 파티션 형식을 확인하고 설치 방식(UEFI/레거시)과 일치하는지 점검하세요.", "업데이트 재시도 전에 SoftwareDistribution 캐시를 정리해 구성 파일을 초기화하세요.", "명령어를 직접 입력하는 작업이었다면 옵션 철자와 형식을 다시 확인하세요."],
      link: "error-code-0x80070057.html",
      detailPage: "error-code-0x80070057.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80070057", "0x80070057"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_INVALID_PARAMETER","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x800F0922",
      title: "Windows 업데이트 실패",
      overview: "업데이트 설치 마지막 단계에서 실패가 반복될 때 나타나는 코드로, 시스템 예약 파티션 용량 부족이나 VPN/프록시 네트워크 설정이 흔한 원인입니다.",
      summary: "업데이트 설치 마지막 단계에서 실패가 반복될 때 나타나는 코드로, 시스템 예약 파티션 용량 부족이나 VPN/프록시 네트워크 설정이 흔한 원인입니다.",
      causes: ["시스템 예약 파티션(System Reserved) 여유 공간이 부족한 경우", "VPN이나 프록시 설정이 업데이트 서버 연결을 방해하는 경우", "이전 업데이트 실패 잔여 파일이 새 업데이트와 충돌하는 경우", ".NET Framework 관련 구성 요소가 손상된 경우", "디스크 여유 공간이 전체적으로 부족한 경우"],
      checks: ["디스크 관리에서 시스템 예약 파티션 용량을 확인하세요. 여유가 거의 없다면 파티션 확장이 필요할 수 있습니다.", "VPN이나 프록시를 사용 중이라면 임시로 해제한 뒤 업데이트를 다시 시도하세요.", "디스크 정리로 최소 10~15GB 이상의 여유 공간을 확보하세요.", "Windows Update 문제 해결사를 실행해 자동으로 손상된 구성 요소를 점검하세요.", "반복 실패한다면 업데이트 어시스턴트를 이용해 수동으로 최신 버전을 재설치해 보세요."],
      link: "error-code-0x800f0922.html",
      detailPage: "error-code-0x800f0922.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["800f0922", "0x800f0922"],
      officialSource: {"title":"Microsoft Learn: Error code 0x800f0922 when installing Windows updates","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/error-0x800f0922-installing-windows-updates"}
    },
    {
      code: "0x80070005",
      title: "Access Denied",
      overview: "관리자 권한이 필요한 작업을 일반 권한으로 시도했거나, 보안 소프트웨어가 접근을 차단했을 때 나타나는 권한 오류입니다.",
      summary: "관리자 권한이 필요한 작업을 일반 권한으로 시도했거나, 보안 소프트웨어가 접근을 차단했을 때 나타나는 권한 오류입니다.",
      causes: ["관리자 권한 없이 시스템 파일이나 설정에 접근하려 한 경우", "보안 소프트웨어(백신, 방화벽)가 해당 프로그램의 접근을 차단한 경우", "폴더나 파일의 소유권이 다른 계정으로 되어 있는 경우", "그룹 정책으로 특정 기능에 대한 접근이 제한된 경우", "사용자 계정 컨트롤(UAC) 설정이 지나치게 엄격한 경우"],
      checks: ["해당 프로그램이나 명령 프롬프트를 마우스 우클릭 후 '관리자 권한으로 실행'으로 다시 시도하세요.", "보안 프로그램을 임시로 비활성화한 뒤 같은 작업을 재현해 차단 여부를 확인하세요.", "문제되는 폴더나 파일을 우클릭 > 속성 > 보안 탭에서 현재 계정의 권한을 확인하고 필요시 소유권을 가져오세요.", "회사나 학교 PC라면 그룹 정책으로 제한된 기능인지 관리자에게 확인하세요.", "UAC 설정을 기본값으로 되돌린 뒤 다시 시도해 보세요."],
      link: "error-code-0x80070005.html",
      detailPage: "error-code-0x80070005.html",
      relatedSymptom: "windows-printer-add-freeze.html",
      aliases: ["80070005", "0x80070005"],
      communityCases: [{"title": "드라이브 압축 해제로 해결한 사례", "summary": "마이크로소프트 스토어 앱 설치가 이 오류로 계속 실패했던 사례가 있습니다. 관리자 권한, 폴더 권한 부여 등 일반적인 방법으로는 해결되지 않았는데, 앱을 설치하려던 보조 드라이브에 걸려 있던 NTFS 압축(디스크 공간 절약) 기능을 해제한 뒤 정상적으로 설치됐습니다.", "insight": "C 드라이브가 아닌 다른 드라이브에 앱이나 프로그램을 설치할 때 이 오류가 난다면, 그 드라이브에 압축 기능이 켜져 있지 않은지 확인해보세요."}],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_ACCESS_DENIED","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x80004005",
      title: "Unspecified error",
      overview: "구글의 다른 코드처럼 특정 원인 하나로 좁혀지지 않는 포괄적인 오류 코드입니다. 캐시 손상, 권한 문제, 네트워크 문제 등 여러 상황에서 공통으로 나타날 수 있습니다.",
      summary: "구글의 다른 코드처럼 특정 원인 하나로 좁혀지지 않는 포괄적인 오류 코드입니다.",
      causes: ["임시 파일이나 캐시가 손상되어 프로그램이 정상 동작을 못 하는 경우", "보안 소프트웨어가 특정 동작을 차단한 경우", "네트워크 드라이브나 공유 폴더 접근 권한이 꼬인 경우", "레지스트리 값이 손상되었거나 이전 설치 잔여물이 남아있는 경우", "타사 프로그램과의 호환성 문제"],
      checks: ["최근에 설치했거나 변경한 프로그램/설정이 있다면 먼저 되돌려 보세요.", "브라우저나 앱 캐시, 임시 파일을 정리한 뒤 다시 실행해 보세요.", "보안 프로그램을 임시로 비활성화하고 재현 여부를 확인하세요.", "네트워크 드라이브 문제라면 연결을 끊었다가 다시 매핑해 보세요.", "문제 프로그램을 완전히 제거한 뒤 재설치해 레지스트리 잔여물을 정리하세요."],
      link: "error-code-0x80004005.html",
      detailPage: "error-code-0x80004005.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["80004005", "0x80004005"],
      officialSource: {"title":"Microsoft Learn: Error 0x80004005","url":"https://learn.microsoft.com/en-us/answers/questions/5831913/0x80004005-error"}
    },
    {
      code: "0xC000000F",
      title: "부팅 정보 읽기 실패",
      overview: "윈도우가 부팅에 필요한 BCD(Boot Configuration Data) 정보를 읽지 못했을 때 나타나는 오류로, 부팅 자체가 되지 않는 심각한 증상으로 이어집니다.",
      summary: "윈도우가 부팅에 필요한 BCD(Boot Configuration Data) 정보를 읽지 못했을 때 나타나는 오류로, 부팅 자체가 되지 않는 심각한 증상으로 이어집니다.",
      causes: ["부트 레코드(BCD)가 손상되거나 삭제된 경우", "저장장치 케이블이나 슬롯 접촉이 불량한 경우", "듀얼 부팅 구성 중 다른 운영체제 설치가 부팅 정보를 덮어쓴 경우", "정전이나 강제 종료로 부팅 파일이 손상된 경우", "메인보드 펌웨어(BIOS/UEFI) 설정이 최근 변경된 경우"],
      checks: ["저장장치 연결 상태를 물리적으로 다시 확인하세요.", "설치 미디어로 부팅해 복구 환경으로 진입한 뒤 bootrec /rebuildbcd 명령으로 부팅 정보를 재생성하세요.", "듀얼 부팅 환경이라면 최근 설치한 다른 운영체제가 부팅 정보를 바꿨는지 확인하세요.", "BIOS/UEFI 설정에서 부팅 순서와 모드(UEFI/레거시)가 원래대로인지 점검하세요.", "복구로도 해결되지 않으면 시스템 복원 지점이나 백업을 통한 복구를 고려하세요."],
      link: "error-code-0xc000000f.html",
      detailPage: "error-code-0xc000000f.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["c000000f", "0xc000000f"],
      officialSource: {"title":"Microsoft Learn: Windows startup issues troubleshooting","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/windows-boot-issues-troubleshooting"}
    },
    {
      code: "0x000000EF",
      title: "CRITICAL_PROCESS_DIED",
      overview: "윈도우 핵심 프로세스가 예기치 않게 종료되며 나타나는 블루스크린으로, 0xC000021A와 증상이 유사하지만 커널 레벨에서 발생한다는 차이가 있습니다.",
      summary: "윈도우 핵심 프로세스가 예기치 않게 종료되며 나타나는 블루스크린으로, 0xC000021A와 증상이 유사하지만 커널 레벨에서 발생한다는 차이가 있습니다.",
      causes: ["시스템 파일이 손상되어 핵심 프로세스가 비정상 종료되는 경우", "최근 설치한 드라이버가 커널 프로세스와 충돌하는 경우", "디스크 오류로 필요한 시스템 파일을 읽지 못하는 경우", "맬웨어 감염으로 시스템 프로세스가 강제 종료되는 경우", "업데이트 도중 강제 종료되어 파일이 일부만 반영된 경우"],
      checks: ["안전 모드 부팅이 가능한지 확인하고, 가능하다면 최근 설치 항목부터 점검하세요.", "명령 프롬프트에서 sfc /scannow와 DISM /Online /Cleanup-Image /RestoreHealth를 차례로 실행하세요.", "디스크 상태를 chkdsk로 점검하세요.", "최근 설치한 드라이버나 프로그램을 제거한 뒤 재현 여부를 확인하세요.", "백신 프로그램으로 전체 검사를 실행해 맬웨어 감염 여부를 확인하세요."],
      link: "error-code-0x000000ef.html",
      detailPage: "error-code-0x000000ef.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["ef", "000000ef", "0xef"],
      communityCases: [{"title": "보조 하드디스크 제거로 해결한 사례", "summary": "부팅 드라이브(SSD)가 재부팅 후 인식되지 않으면서 이 블루스크린이 반복됐던 사례가 있습니다. SSD 자체는 여러 진단에서 정상으로 나왔는데, 시스템에 함께 연결되어 있던 오래된 보조 하드디스크(HDD)를 완전히 분리한 뒤 문제가 사라졌습니다. 상태가 나빠진 보조 디스크가 SATA 컨트롤러 전체를 물고 늘어지면서 부팅 드라이브까지 응답하지 않게 만들었던 것으로 보입니다.", "insight": "부팅 드라이브 자체는 정상으로 진단되는데도 이 오류가 반복된다면, 함께 연결된 다른 저장장치(특히 오래된 보조 하드디스크)를 하나씩 분리해보며 원인을 좁혀보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xEF CRITICAL_PROCESS_DIED","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xef--critical-process-died"}
    },
    {
      code: "0x000000D1",
      title: "DRIVER_IRQL_NOT_LESS_OR_EQUAL",
      overview: "드라이버가 자신에게 허용되지 않은 높은 인터럽트 수준에서 메모리에 접근하려 할 때 발생하는 코드로, 대부분 특정 드라이버 하나가 원인입니다.",
      summary: "드라이버가 자신에게 허용되지 않은 높은 인터럽트 수준에서 메모리에 접근하려 할 때 발생하는 코드로, 대부분 특정 드라이버 하나가 원인입니다.",
      causes: ["네트워크, 그래픽, 사운드 등 특정 드라이버가 최신 윈도우 빌드와 호환되지 않는 경우", "드라이버 설치 파일 자체가 손상된 경우", "보안 소프트웨어가 드라이버 동작을 간섭하는 경우", "램 불안정으로 드라이버가 잘못된 메모리 주소를 참조하는 경우", "USB 허브나 외장 장치의 드라이버 충돌"],
      checks: ["블루스크린 화면이나 이벤트 뷰어에서 어떤 드라이버 파일(.sys)이 언급되는지 확인하세요.", "해당 드라이버를 제조사 최신 버전으로 재설치하거나, 최근 업데이트했다면 이전 버전으로 되돌리세요.", "안전 모드에서 재현되지 않는다면 특정 드라이버가 원인일 가능성이 높습니다.", "메모리 진단 도구로 램 상태를 점검하세요.", "최근 연결한 외장 장치(USB, 프린터 등)를 분리한 뒤 재현 여부를 확인하세요."],
      link: "error-code-0x000000d1.html",
      detailPage: "error-code-0x000000d1.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["d1", "000000d1", "0xd1"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xD1 DRIVER_IRQL_NOT_LESS_OR_EQUAL","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xd1--driver-irql-not-less-or-equal"}
    },
    {
      code: "0x0000009F",
      title: "DRIVER_POWER_STATE_FAILURE",
      overview: "절전 모드 진입이나 복귀, 혹은 종료 과정에서 특정 드라이버가 전원 상태 전환 요청에 제때 응답하지 못할 때 나타나는 코드입니다.",
      summary: "절전 모드 진입이나 복귀, 혹은 종료 과정에서 특정 드라이버가 전원 상태 전환 요청에 제때 응답하지 못할 때 나타나는 코드입니다.",
      causes: ["네트워크 어댑터나 USB 장치의 절전 관련 드라이버가 응답하지 않는 경우", "전원 관리 설정이 하드웨어와 맞지 않게 구성된 경우", "그래픽 드라이버가 절전 복귀 시 초기화에 실패하는 경우", "최근 연결한 외장 장치가 절전 신호를 제대로 처리하지 못하는 경우", "바이오스 전원 관리 설정과 윈도우 전원 옵션이 충돌하는 경우"],
      checks: ["절전 모드에서 복귀한 직후에만 증상이 나타나는지 확인하세요.", "장치 관리자에서 네트워크 어댑터의 전원 관리 탭에 있는 '전원 절약을 위해 이 장치를 끌 수 있음' 옵션을 해제해 보세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요.", "최근 연결한 USB 장치를 분리한 뒤 절전 모드 진입/복귀를 테스트하세요.", "전원 옵션에서 절전 모드 대신 최대 절전 모드나 화면 끄기만 사용하도록 임시로 바꿔 재현 여부를 확인하세요."],
      link: "error-code-0x0000009f.html",
      detailPage: "error-code-0x0000009f.html",
      relatedSymptom: "windows-sleep-resume-fail.html",
      aliases: ["9f", "0000009f", "0x9f"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x9F DRIVER_POWER_STATE_FAILURE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x9f--driver-power-state-failure"}
    },
    {
      code: "0x00000116",
      title: "VIDEO_TDR_FAILURE",
      overview: "그래픽 드라이버가 정해진 시간 안에 응답하지 못해 윈도우가 강제로 드라이버를 재시작(TDR)하려다 실패했을 때 나타나는 코드로, 게임이나 고사양 작업 중 자주 발생합니다.",
      summary: "그래픽 드라이버가 정해진 시간 안에 응답하지 못해 윈도우가 강제로 드라이버를 재시작(TDR)하려다 실패했을 때 나타나는 코드로, 게임이나 고사양 작업 중 자주 발생합니다.",
      causes: ["그래픽 드라이버 자체의 버그나 최신 게임과의 호환성 문제", "GPU가 부하 상황에서 과도하게 발열되는 경우", "그래픽카드 보조 전원 케이블 연결이 불안정한 경우", "GPU 오버클럭 설정이 안정성 한계를 넘은 경우", "오래된 그래픽 드라이버와 최신 윈도우 업데이트의 충돌"],
      checks: ["그래픽 드라이버를 완전히 제거(DDU 등 클린 제거 도구 사용)한 뒤 최신 버전으로 재설치하세요.", "GPU 온도를 모니터링 프로그램으로 확인하고, 부하 시 과열되는지 점검하세요.", "그래픽카드 보조 전원 케이블(6핀/8핀)이 완전히 꽂혀 있는지 확인하세요.", "GPU나 CPU를 오버클럭했다면 기본 클럭으로 되돌려 재현 여부를 확인하세요.", "다른 게임이나 벤치마크 프로그램에서도 같은 증상이 나오는지 확인해 특정 게임 문제인지 하드웨어 문제인지 구분하세요."],
      link: "error-code-0x00000116.html",
      detailPage: "error-code-0x00000116.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["116", "00000116", "0x116"],
      communityCases: [{"title": "PCIe 라이저 케이블 교체로 해결한 사례", "summary": "그래픽카드를 세로로 거치하기 위해 PCIe 라이저 케이블을 사용한 뒤부터 이 블루스크린이 반복됐던 사례가 있습니다. 드라이버나 그래픽카드 자체의 문제가 아니라, 라이저 케이블이 PCIe 4.0(Gen4) x16 대역폭의 신호를 안정적으로 전달하지 못해 생긴 간섭이 원인이었습니다. BIOS에서 PCIe 슬롯 속도를 한 단계 낮춘 뒤(Gen4 → Gen3, 또는 x16 → x8) 문제가 사라졌습니다.", "insight": "그래픽카드를 라이저 케이블로 연결한 구성(세로 거치, 확장형 케이스 등)에서 이 오류가 나타난다면, 케이블 자체의 신호 품질 문제일 수 있습니다. BIOS에서 PCIe 슬롯 속도를 한 단계 낮춰서 재현 여부를 확인해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x116 VIDEO_TDR_FAILURE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x116---video-tdr-failure"}
    },
    {
      code: "0x00000133",
      title: "DPC_WATCHDOG_VIOLATION",
      overview: "시스템이 정해진 시간 안에 지연 프로시저 호출(DPC)을 처리하지 못했을 때 나타나는 코드로, 저장장치나 드라이버의 응답 지연이 주요 원인입니다.",
      summary: "시스템이 정해진 시간 안에 지연 프로시저 호출(DPC)을 처리하지 못했을 때 나타나는 코드로, 저장장치나 드라이버의 응답 지연이 주요 원인입니다.",
      causes: ["SSD나 NVMe 저장장치의 펌웨어가 오래되었거나 버그가 있는 경우", "저장장치 드라이버가 최신 윈도우 빌드와 호환되지 않는 경우", "USB 장치나 카드리더의 드라이버 응답 지연", "메인보드 칩셋 드라이버가 오래된 경우", "디스크 자체의 물리적 결함으로 응답이 느려지는 경우"],
      checks: ["저장장치 제조사 홈페이지에서 최신 펌웨어가 있는지 확인하고 업데이트하세요.", "저장장치 컨트롤러 드라이버와 메인보드 칩셋 드라이버를 최신 버전으로 업데이트하세요.", "최근 연결한 USB 장치나 카드리더를 분리한 뒤 재현 여부를 확인하세요.", "디스크 상태 점검 도구(제조사 툴 또는 CrystalDiskInfo 등)로 건강 상태를 확인하세요.", "문제가 반복되면 저장장치를 다른 슬롯이나 포트에 연결해 슬롯 자체의 문제인지 확인하세요."],
      link: "error-code-0x00000133.html",
      detailPage: "error-code-0x00000133.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["133", "00000133", "0x133"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x133 DPC_WATCHDOG_VIOLATION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x133-dpc-watchdog-violation"}
    },
    {
      code: "0x0000003B",
      title: "SYSTEM_SERVICE_EXCEPTION",
      overview: "시스템 서비스를 처리하는 도중 예상치 못한 예외가 발생했을 때 나타나는 코드로, 드라이버 결함이나 시스템 파일 손상이 흔한 원인입니다.",
      summary: "시스템 서비스를 처리하는 도중 예상치 못한 예외가 발생했을 때 나타나는 코드로, 드라이버 결함이나 시스템 파일 손상이 흔한 원인입니다.",
      causes: ["그래픽이나 오디오 등 특정 드라이버의 버그", "시스템 파일 일부가 손상된 경우", "최근 윈도우 업데이트와 기존 드라이버 간의 호환성 문제", "램 불안정으로 인한 잘못된 메모리 접근", "보안 소프트웨어와 시스템 서비스 간의 충돌"],
      checks: ["이벤트 뷰어에서 블루스크린 발생 직전 어떤 드라이버나 서비스가 관여했는지 확인하세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하고 복구하세요.", "최근 업데이트된 드라이버를 이전 버전으로 되돌려 재현 여부를 확인하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "보안 프로그램을 임시로 비활성화한 뒤 증상이 사라지는지 확인하세요."],
      link: "error-code-0x0000003b.html",
      detailPage: "error-code-0x0000003b.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["3b", "0000003b", "0x3b"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x3B SYSTEM_SERVICE_EXCEPTION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x3b--system-service-exception"}
    },
    {
      code: "0x000000EA",
      title: "THREAD_STUCK_IN_DEVICE_DRIVER",
      overview: "그래픽 드라이버나 특정 디바이스 드라이버가 응답 없이 무한 대기 상태에 빠졌을 때 나타나는 코드로, 고사양 그래픽 작업 중 자주 나타납니다.",
      summary: "그래픽 드라이버나 특정 디바이스 드라이버가 응답 없이 무한 대기 상태에 빠졌을 때 나타나는 코드로, 고사양 그래픽 작업 중 자주 나타납니다.",
      causes: ["그래픽 드라이버가 고부하 상황에서 응답을 멈추는 경우", "GPU 과열로 하드웨어 자체가 응답 지연을 일으키는 경우", "오래되었거나 손상된 그래픽 드라이버 파일", "그래픽카드 전원 공급 불안정", "다중 모니터 구성에서 드라이버가 동기화에 실패하는 경우"],
      checks: ["그래픽 드라이버를 클린 재설치(DDU 도구로 완전 제거 후 재설치)하세요.", "GPU 온도를 모니터링해 부하 시 과열 여부를 확인하세요.", "그래픽카드 보조 전원 연결과 파워 용량이 충분한지 점검하세요.", "다중 모니터를 사용 중이라면 하나만 연결한 상태에서 재현 여부를 확인하세요.", "다른 그래픽 집약적 작업(게임, 영상 편집)에서도 동일하게 발생하는지 확인하세요."],
      link: "error-code-0x000000ea.html",
      detailPage: "error-code-0x000000ea.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["ea", "000000ea", "0xea"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xEA THREAD_STUCK_IN_DEVICE_DRIVER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xea--thread-stuck-in-device-driver"},
      communityCases: [{"title": "그래픽카드 교체로 해결한 사례", "summary": "DDU로 드라이버를 클린 재설치하고, 보조 전원과 파워 용량까지 확인했는데도 고사양 게임에서만 이 코드가 반복됐던 사례가 있습니다. GPU 온도는 정상 범위였지만 다른 PC에 그래픽카드를 옮겨 테스트하니 똑같은 증상이 재현되어 그래픽카드 자체의 결함으로 확인됐고, 교체 후 완전히 해결됐습니다.", "insight": "드라이버 재설치와 전원·온도 점검을 모두 마쳤는데도 특정 그래픽 작업에서만 반복된다면, 그래픽카드를 다른 시스템에서 테스트해 하드웨어 자체의 문제인지 먼저 확인해보세요."}]
    },
    {
      code: "0x0000007E",
      title: "SYSTEM_THREAD_EXCEPTION_NOT_HANDLED",
      overview: "시스템 스레드에서 처리되지 않은 예외가 발생했을 때 나타나며, 주로 그래픽이나 칩셋 드라이버의 결함, 혹은 업데이트 직후 호환성 문제로 발생합니다.",
      summary: "시스템 스레드에서 처리되지 않은 예외가 발생했을 때 나타나며, 주로 그래픽이나 칩셋 드라이버의 결함, 혹은 업데이트 직후 호환성 문제로 발생합니다.",
      causes: ["그래픽이나 칩셋 드라이버가 최신 업데이트와 호환되지 않는 경우", "시스템 파일이 손상된 경우", "타사 프로그램이 시스템 스레드와 충돌하는 경우", "램이나 저장장치의 물리적 불안정", "오버클럭 설정으로 인한 시스템 불안정"],
      checks: ["업데이트 직후부터 증상이 시작됐는지 확인하고, 그렇다면 관련 드라이버를 재설치하세요.", "안전 모드에서 재현 여부를 확인해 드라이버 문제인지 구분하세요.", "sfc /scannow로 시스템 파일을 점검하세요.", "최근 설치한 타사 프로그램을 제거한 뒤 재현 여부를 확인하세요.", "오버클럭 설정이 있다면 기본값으로 되돌리세요."],
      link: "error-code-0x0000007e.html",
      detailPage: "error-code-0x0000007e.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["7e", "0000007e", "0x7e"],
      communityCases: [{"title": "문제 드라이버 파일 직접 삭제로 해결한 사례", "summary": "AMD OverDrive 관련 드라이버(AODDRIVER2.sys)가 원인으로 지목됐지만, 설치 프로그램이 손상되어 제어판에서 일반적인 방법으로는 제거할 수 없었던 사례가 있습니다. 시스템 폴더에서 해당 드라이버 파일을 직접 찾아 삭제한 뒤 정상적으로 부팅됐습니다.", "insight": "원인 드라이버를 찾았는데도 제어판에서 제거가 안 된다면, 설치 프로그램 자체가 손상됐을 수 있습니다. 이 경우 드라이버 파일을 직접 삭제해야 할 수도 있지만, 시스템 파일을 직접 다루는 작업이라 신중하게 진행해야 합니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x7E SYSTEM_THREAD_EXCEPTION_NOT_HANDLED","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7e--system-thread-exception-not-handled"}
    },
    {
      code: "0x0000000A",
      title: "IRQL_NOT_LESS_OR_EQUAL",
      overview: "드라이버나 커널 모드 코드가 자신에게 허용되지 않은 메모리 주소에 접근했을 때 나타나는 대표적인 블루스크린 코드입니다.",
      summary: "드라이버나 커널 모드 코드가 자신에게 허용되지 않은 메모리 주소에 접근했을 때 나타나는 대표적인 블루스크린 코드입니다.",
      causes: ["최근 설치하거나 업데이트한 드라이버의 결함", "램 모듈의 물리적 불안정", "보안 프로그램과 커널 모드 드라이버 간의 충돌", "오버클럭으로 인한 시스템 불안정", "손상된 시스템 파일"],
      checks: ["최근 설치한 드라이버 목록을 확인하고, 문제 시점과 일치하는 항목을 제거하거나 롤백하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "보안 프로그램을 임시로 비활성화한 뒤 재현 여부를 확인하세요.", "오버클럭 설정을 기본값으로 되돌리세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요."],
      link: "error-code-0x0000000a.html",
      detailPage: "error-code-0x0000000a.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["a", "0a", "0000000a", "0x0a", "0x0000000a"],
      communityCases: [{"title": "안티치트 프로그램 충돌로 해결한 사례", "summary": "특정 게임을 종료한 직후에만 이 블루스크린이 반복됐던 사례가 있습니다. 드라이버 업데이트, 메모리 검사, sfc 검사까지 해도 해결되지 않았는데, 알고 보니 서로 다른 두 게임에서 각각 설치한 안티치트 프로그램(라이엇 뱅가드, 이지 안티치트)이 백그라운드에서 함께 실행되며 충돌을 일으키고 있었습니다. 둘 중 하나를 완전히 제거한 뒤 재발하지 않았습니다.", "insight": "특정 게임 실행·종료 시점에만 반복된다면 드라이버보다 안티치트 프로그램 간의 충돌을 의심해보세요. 여러 게임의 안티치트가 동시에 설치되어 있다면 특히 그렇습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xA IRQL_NOT_LESS_OR_EQUAL","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xa--irql-not-less-or-equal"},
      plainExplanation: "'드라이버'는 그래픽카드·랜카드 같은 부품과 윈도우가 서로 대화할 수 있게 해주는 프로그램이고, '메모리(램)'는 컴퓨터가 작업 중 정보를 잠시 올려두는 부품입니다. 이 코드는 그 드라이버 중 하나가 허락되지 않은 방식으로 메모리에 접근하려다 윈도우가 안전을 위해 스스로 멈춘 것입니다. 대부분 특정 드라이버나 램 자체의 문제이며, 아래 순서대로 하나씩 확인하면 됩니다."
    },
    {
      code: "0x00000024",
      title: "NTFS_FILE_SYSTEM",
      overview: "NTFS 파일 시스템 드라이버가 디스크에서 오류를 발견했을 때 나타나는 코드로, 갑작스러운 전원 종료 후 자주 발생합니다.",
      summary: "NTFS 파일 시스템 드라이버가 디스크에서 오류를 발견했을 때 나타나는 코드로, 갑작스러운 전원 종료 후 자주 발생합니다.",
      causes: ["디스크 파일 시스템 구조 자체가 손상된 경우", "갑작스러운 정전이나 강제 종료로 파일 시스템이 비정상 종료된 경우", "디스크 배드섹터나 물리적 결함", "디스크 컨트롤러 드라이버 문제", "외장 디스크를 안전하게 제거하지 않고 분리한 경우"],
      checks: ["중요한 파일을 먼저 백업하세요. 파일 시스템 손상은 데이터 유실 위험이 있습니다.", "명령 프롬프트에서 chkdsk /f /r 을 실행해 디스크 오류를 검사하고 복구하세요.", "디스크 진단 도구로 배드섹터나 S.M.A.R.T 상태를 확인하세요.", "외장 디스크라면 항상 '안전하게 제거' 기능을 사용해 분리하세요.", "디스크 컨트롤러 드라이버를 최신 버전으로 업데이트하세요."],
      link: "error-code-0x00000024.html",
      detailPage: "error-code-0x00000024.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["24", "00000024", "0x24"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x24 NTFS_FILE_SYSTEM","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x24--ntfs-file-system"}
    },
    {
      code: "0x000000F4",
      title: "CRITICAL_OBJECT_TERMINATION",
      overview: "핵심 시스템 프로세스나 스레드 객체가 예기치 않게 종료되었을 때 나타나는 코드로, 저장장치 문제와 함께 발생하는 경우가 많습니다.",
      summary: "핵심 시스템 프로세스나 스레드 객체가 예기치 않게 종료되었을 때 나타나는 코드로, 저장장치 문제와 함께 발생하는 경우가 많습니다.",
      causes: ["부팅 디스크의 연결 불량이나 물리적 결함", "부팅 관련 시스템 파일의 손상", "저장장치 드라이버 문제", "전원 공급 불안정으로 인한 저장장치 접근 실패", "최근 시스템 설정 변경으로 인한 충돌"],
      checks: ["저장장치 연결 상태를 물리적으로 확인하세요.", "복구 환경으로 진입해 시스템 파일 복구를 시도하세요.", "저장장치 진단 도구로 디스크 상태를 점검하세요.", "최근 변경한 시스템 설정이 있다면 되돌려 보세요.", "파워 서플라이 용량과 케이블 연결 상태를 점검하세요."],
      link: "error-code-0x000000f4.html",
      detailPage: "error-code-0x000000f4.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["f4", "000000f4", "0xf4"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xF4 CRITICAL_OBJECT_TERMINATION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf4--critical-object-termination"}
    },
    {
      code: "0x00000019",
      title: "BAD_POOL_HEADER",
      overview: "메모리 풀의 구조 정보가 손상되었을 때 나타나는 블루스크린 코드로, 드라이버 오류나 램 문제가 주요 원인입니다.",
      summary: "메모리 풀의 구조 정보가 손상되었을 때 나타나는 블루스크린 코드로, 드라이버 오류나 램 문제가 주요 원인입니다.",
      causes: ["드라이버가 메모리 풀을 잘못 다루는 경우", "램 모듈의 물리적 결함", "보안 프로그램과의 충돌", "시스템 파일 손상", "오버클럭으로 인한 메모리 불안정"],
      checks: ["최근 설치한 드라이버를 확인하고 제거 또는 롤백해 보세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "시스템 복원 지점이 있다면 이전 상태로 되돌려 보세요.", "보안 프로그램을 임시로 비활성화한 뒤 재현 여부를 확인하세요.", "오버클럭 설정을 기본값으로 되돌리세요."],
      link: "error-code-0x00000019.html",
      detailPage: "error-code-0x00000019.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["19", "00000019", "0x19"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x19 BAD_POOL_HEADER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x19--bad-pool-header"}
    },
    {
      code: "0x000000A5",
      title: "ACPI_BIOS_ERROR",
      overview: "메인보드의 ACPI/BIOS가 윈도우가 기대하는 표준을 완전히 지원하지 않을 때 나타나는 코드로, 오래되었거나 호환성이 낮은 메인보드에서 자주 발생합니다.",
      summary: "메인보드의 ACPI/BIOS가 윈도우가 기대하는 표준을 완전히 지원하지 않을 때 나타나는 코드로, 오래되었거나 호환성이 낮은 메인보드에서 자주 발생합니다.",
      causes: ["BIOS/UEFI 펌웨어가 오래되어 ACPI 표준을 완전히 지원하지 못하는 경우", "BIOS 설정 중 전원 관리 관련 항목이 잘못 구성된 경우", "최근 하드웨어(그래픽카드, 램 등)를 교체한 뒤 호환성 문제가 생긴 경우", "바이오스 기본값에서 임의로 변경한 고급 설정이 충돌하는 경우", "메인보드 제조사의 알려진 펌웨어 버그"],
      checks: ["메인보드 제조사 홈페이지에서 BIOS/UEFI 최신 펌웨어를 확인하고 업데이트하세요.", "BIOS를 기본값(Load Default/Optimized Defaults)으로 초기화한 뒤 재부팅해 보세요.", "최근 교체한 하드웨어가 있다면 제거하고 이전 상태로 재현 여부를 확인하세요.", "전원 관리 관련 BIOS 설정(예: ErP, C-State)을 기본값으로 되돌려 보세요.", "메인보드 제조사 공식 포럼이나 지원 페이지에서 같은 증상의 사례가 있는지 확인하세요."],
      link: "error-code-0x000000a5.html",
      detailPage: "error-code-0x000000a5.html",
      relatedSymptom: "hardware-no-display.html",
      aliases: ["a5", "000000a5", "0xa5"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xA5 ACPI_BIOS_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xa5--acpi-bios-error"}
    },
    {
      code: "0x00000074",
      title: "BAD_SYSTEM_CONFIG_INFO",
      overview: "부팅 구성 정보나 레지스트리 정보가 손상되었을 때 나타나는 코드로, 업데이트 실패 후 자주 나타납니다.",
      summary: "부팅 구성 정보나 레지스트리 정보가 손상되었을 때 나타나는 코드로, 업데이트 실패 후 자주 나타납니다.",
      causes: ["부팅 구성 데이터(BCD)의 손상", "레지스트리 하이브 파일의 손상", "업데이트 도중 강제 종료로 구성 정보가 일부만 반영된 경우", "디스크 오류로 구성 파일을 읽지 못하는 경우", "최근 시스템 설정 변경으로 인한 충돌"],
      checks: ["복구 환경으로 진입해 bootrec 명령으로 부팅 구성 정보를 재생성하세요.", "시스템 복원 지점이 있다면 이전 상태로 되돌려 보세요.", "디스크 검사(chkdsk)로 저장장치 오류 여부를 점검하세요.", "최근 실패한 업데이트가 있다면 업데이트 캐시를 정리한 뒤 재시도하세요.", "복구로도 해결되지 않으면 시스템 복구 도구나 재설치를 고려하세요."],
      link: "error-code-0x00000074.html",
      detailPage: "error-code-0x00000074.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["74", "00000074", "0x74"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x74 BAD_SYSTEM_CONFIG_INFO","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x74--bad-system-config-info"}
    },
    {
      code: "0xC0000225",
      title: "부팅 장치를 찾을 수 없음",
      overview: "윈도우가 부팅에 필요한 장치 자체를 찾지 못했을 때 나타나는 오류로, BCD 손상이나 디스크 연결 문제, 부팅 순서 변경이 주요 원인입니다.",
      summary: "윈도우가 부팅에 필요한 장치 자체를 찾지 못했을 때 나타나는 오류로, BCD 손상이나 디스크 연결 문제, 부팅 순서 변경이 주요 원인입니다.",
      causes: ["부팅 구성 데이터(BCD)가 손상되거나 삭제된 경우", "저장장치 케이블 연결이 불량한 경우", "BIOS에서 부팅 순서가 다른 장치로 바뀐 경우", "디스크 파티션이 손상되었거나 삭제된 경우", "새 디스크를 추가한 뒤 BIOS가 잘못된 장치를 부팅 대상으로 지정한 경우"],
      checks: ["BIOS로 진입해 부팅 순서에서 올바른 디스크가 1순위로 지정되어 있는지 확인하세요.", "저장장치 케이블 연결 상태를 물리적으로 점검하세요.", "설치 미디어로 부팅해 복구 환경에서 bootrec /rebuildbcd를 실행하세요.", "디스크 관리 도구로 부팅 파티션이 정상적으로 보이는지 확인하세요.", "최근 디스크를 추가했다면 제거한 뒤 재현 여부를 확인하세요."],
      link: "error-code-0xc0000225.html",
      detailPage: "error-code-0xc0000225.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["c0000225", "0xc0000225"],
      officialSource: {"title":"Microsoft Learn: Windows startup issues troubleshooting","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/windows-boot-issues-troubleshooting"}
    },
    {
      code: "0x80070570",
      title: "파일이 손상되었거나 읽을 수 없음",
      overview: "설치나 복사 과정에서 파일이 손상되었거나 읽어올 수 없을 때 나타나는 오류로, 설치 미디어 문제나 디스크 불량이 흔한 원인입니다.",
      summary: "설치나 복사 과정에서 파일이 손상되었거나 읽어올 수 없을 때 나타나는 오류로, 설치 미디어 문제나 디스크 불량이 흔한 원인입니다.",
      causes: ["설치 파일 자체가 다운로드 중 손상된 경우", "USB 설치 미디어의 불량이나 손상", "대상 디스크의 배드섹터", "압축 해제 도중 오류가 발생한 경우", "램 불안정으로 파일 복사 중 데이터가 손상되는 경우"],
      checks: ["설치 파일이나 이미지를 공식 출처에서 다시 받아보세요.", "USB 설치 미디어를 다른 USB 포트나 다른 USB 메모리로 새로 만들어 보세요.", "대상 디스크의 상태를 chkdsk나 진단 도구로 점검하세요.", "다른 저장장치(외장하드 등)에 파일을 저장한 뒤 다시 시도해 보세요.", "메모리 진단 도구로 램 상태를 점검하세요."],
      link: "error-code-0x80070570.html",
      detailPage: "error-code-0x80070570.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["80070570", "0x80070570"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1300-1699) — ERROR_FILE_CORRUPT","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1300-1699-"}
    },
    {
      code: "0x000000C2",
      title: "BAD_POOL_CALLER",
      overview: "드라이버나 커널 모드 소프트웨어가 메모리 풀을 잘못된 방식으로 호출했을 때 나타나는 코드로, 특정 드라이버의 결함이 주요 원인입니다.",
      summary: "드라이버나 커널 모드 소프트웨어가 메모리 풀을 잘못된 방식으로 호출했을 때 나타나는 코드로, 특정 드라이버의 결함이 주요 원인입니다.",
      causes: ["최근 설치한 드라이버의 버그", "보안 소프트웨어와 커널 모드 코드 간의 충돌", "램 불안정", "시스템 파일 손상", "타사 프로그램의 잘못된 메모리 관리"],
      checks: ["이벤트 뷰어에서 오류 발생 직전 관련된 드라이버 파일을 확인하세요.", "최근 설치한 드라이버나 프로그램을 제거해 재현 여부를 확인하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "보안 프로그램을 임시로 비활성화한 뒤 테스트해 보세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요."],
      link: "error-code-0x000000c2.html",
      detailPage: "error-code-0x000000c2.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["c2", "000000c2", "0xc2"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xC2 BAD_POOL_CALLER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc2--bad-pool-caller"}
    },
    {
      code: "0x000000ED",
      title: "UNMOUNTABLE_BOOT_VOLUME",
      overview: "윈도우가 부팅 볼륨을 마운트(연결)하는 데 실패했을 때 나타나는 코드로, 디스크 파일 시스템 손상이나 저장장치 연결 불안정이 주요 원인입니다.",
      summary: "윈도우가 부팅 볼륨을 마운트(연결)하는 데 실패했을 때 나타나는 코드로, 디스크 파일 시스템 손상이나 저장장치 연결 불안정이 주요 원인입니다.",
      causes: ["부팅 파티션의 파일 시스템 손상", "저장장치 케이블이나 슬롯 접촉 불량", "디스크 배드섹터", "갑작스러운 전원 종료로 파일 시스템이 손상된 경우", "저장장치 드라이버 문제"],
      checks: ["저장장치 연결 상태를 물리적으로 확인하세요.", "복구 환경에서 chkdsk /r 명령으로 파일 시스템 오류를 검사하고 복구하세요.", "디스크 진단 도구로 배드섹터나 S.M.A.R.T 상태를 확인하세요.", "복구 환경에서 bootrec 명령으로 부팅 정보를 재구성해 보세요.", "중요 데이터는 가능하다면 다른 매체로 미리 백업해 두세요."],
      link: "error-code-0x000000ed.html",
      detailPage: "error-code-0x000000ed.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["ed", "000000ed", "0xed"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xED UNMOUNTABLE_BOOT_VOLUME","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xed--unmountable-boot-volume"},
      communityCases: [{"title": "SSD 교체로 해결한 사례", "summary": "케이블 재연결, chkdsk /r, bootrec로 부팅 정보 재구성까지 모두 시도했지만 며칠 뒤 같은 코드로 다시 부팅이 안 됐던 사례가 있습니다. S.M.A.R.T 진단에서 재할당된 섹터 수치가 계속 증가하고 있는 것이 확인돼 저장장치 자체의 물리적 노후화로 판단, 데이터를 백업한 뒤 SSD를 새 제품으로 교체하고 윈도우를 재설치해 해결했습니다.", "insight": "복구 명령으로 매번 넘어가더라도 같은 코드가 재발한다면, S.M.A.R.T 진단으로 재할당 섹터나 배드섹터 수치가 늘고 있는지 확인하세요. 수치가 계속 증가한다면 복구보다 교체와 백업을 우선해야 합니다."}]
    },
    {
      code: "0x000000F7",
      title: "DRIVER_OVERRAN_STACK_BUFFER",
      overview: "드라이버가 자신에게 할당된 스택 버퍼 크기를 초과해 데이터를 기록했을 때 나타나는 코드로, 드라이버 버그가 직접적인 원인입니다.",
      summary: "드라이버가 자신에게 할당된 스택 버퍼 크기를 초과해 데이터를 기록했을 때 나타나는 코드로, 드라이버 버그가 직접적인 원인입니다.",
      causes: ["특정 드라이버의 버퍼 오버런 버그", "오래된 드라이버와 최신 윈도우 빌드 간의 호환성 문제", "보안 소프트웨어의 드라이버 후킹 충돌", "손상된 드라이버 설치 파일", "타사 유틸리티 프로그램의 저수준 드라이버 결함"],
      checks: ["최근 설치하거나 업데이트한 드라이버를 확인하고 제거 또는 롤백하세요.", "안전 모드에서 재현 여부를 확인해 드라이버 문제인지 좁혀보세요.", "제조사 홈페이지에서 해당 드라이버의 최신 버전을 다시 설치해 보세요.", "보안 프로그램을 임시로 비활성화한 뒤 테스트해 보세요.", "최근 설치한 저수준 유틸리티(오버클럭 툴, 모니터링 툴 등)를 제거해 보세요."],
      link: "error-code-0x000000f7.html",
      detailPage: "error-code-0x000000f7.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["f7", "000000f7", "0xf7"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xF7 DRIVER_OVERRAN_STACK_BUFFER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf7--driver-overran-stack-buffer"}
    },
    {
      code: "0x000000D8",
      title: "DRIVER_USED_EXCESSIVE_PTES",
      overview: "유효하지 않은 참조 포인터를 사용해 객체 참조 카운트가 잘못되었을 때 나타나는 코드로, 드라이버 결함이나 커널 모드 충돌이 주요 원인입니다.",
      summary: "유효하지 않은 참조 포인터를 사용해 객체 참조 카운트가 잘못되었을 때 나타나는 코드로, 드라이버 결함이나 커널 모드 충돌이 주요 원인입니다.",
      causes: ["드라이버가 이미 해제된 객체를 참조하려 하는 경우", "커널 모드 소프트웨어 간의 충돌", "메모리 손상으로 포인터 값이 변질된 경우", "오래된 드라이버와 최신 시스템 간의 호환성 문제", "보안 소프트웨어의 저수준 후킹 충돌"],
      checks: ["최근 설치한 드라이버나 커널 모드 프로그램을 확인하고 제거해 보세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "안전 모드에서 재현 여부를 확인하세요.", "보안 프로그램을 임시로 비활성화한 뒤 테스트해 보세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요."],
      link: "error-code-0x000000d8.html",
      detailPage: "error-code-0x000000d8.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["d8", "000000d8", "0xd8"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xD8 DRIVER_USED_EXCESSIVE_PTES","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xd8--driver-used-excessive-ptes"}
    },
    {
      code: "0x0000009C",
      title: "MACHINE_CHECK_EXCEPTION",
      overview: "CPU나 메모리 등 하드웨어가 스스로 심각한 내부 오류를 감지해 시스템에 보고했을 때 나타나는 코드로, 오버클럭이나 전원 불안정이 흔한 원인입니다.",
      summary: "CPU나 메모리 등 하드웨어가 스스로 심각한 내부 오류를 감지해 시스템에 보고했을 때 나타나는 코드로, 오버클럭이나 전원 불안정이 흔한 원인입니다.",
      causes: ["CPU나 램의 오버클럭 설정이 안정성 한계를 넘은 경우", "전원 공급이 불안정하거나 파워 용량이 부족한 경우", "CPU나 메인보드의 물리적 결함", "발열로 인한 하드웨어 스로틀링 오류", "램 접촉 불량"],
      checks: ["오버클럭 설정을 모두 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "CPU와 시스템 전반의 온도를 모니터링 프로그램으로 확인하세요.", "파워 서플라이 용량이 시스템 사양에 충분한지 확인하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "램을 재장착하거나 슬롯을 바꿔 접촉 상태를 점검하세요."],
      link: "error-code-0x0000009c.html",
      detailPage: "error-code-0x0000009c.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["9c", "0000009c", "0x9c"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x9C MACHINE_CHECK_EXCEPTION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x9c--machine-check-exception"},
      communityCases: [{"title": "CPU 교체로 해결한 사례", "summary": "오버클럭을 전혀 하지 않은 기본 클럭 상태에서도 이 코드가 몇 주에 걸쳐 불규칙하게 반복됐던 사례가 있습니다. 파워서플라이 교체, 램 재장착, 온도 점검까지 모두 진행했지만 해결되지 않았고, 결국 CPU를 교체한 뒤로는 한 번도 재발하지 않았습니다.", "insight": "오버클럭을 하지 않았는데도 MACHINE_CHECK_EXCEPTION이 반복된다면, 전원과 온도 점검을 마친 뒤에는 CPU 자체의 결함도 배제하지 않는 것이 좋습니다."}]
    },
    {
      code: "0x00000077",
      title: "KERNEL_STACK_INPAGE_ERROR",
      overview: "커널 스택 데이터를 디스크에서 읽어오는 과정에서 실패했을 때 나타나는 코드로, 디스크 오류나 케이블 문제가 흔한 원인입니다.",
      summary: "커널 스택 데이터를 디스크에서 읽어오는 과정에서 실패했을 때 나타나는 코드로, 디스크 오류나 케이블 문제가 흔한 원인입니다.",
      causes: ["디스크 배드섹터나 물리적 결함", "저장장치 케이블이나 슬롯 접촉 불량", "페이지 파일(가상 메모리)이 저장된 영역의 손상", "갑작스러운 전원 종료로 인한 디스크 손상", "저장장치 드라이버 문제"],
      checks: ["디스크 상태를 chkdsk나 제조사 진단 도구로 점검하세요.", "저장장치 케이블 연결 상태를 물리적으로 확인하세요.", "가상 메모리(페이지 파일) 설정을 확인하고 필요시 다른 드라이브로 옮겨보세요.", "중요 데이터는 미리 백업해 두는 것이 안전합니다.", "저장장치 드라이버를 최신 버전으로 업데이트하세요."],
      link: "error-code-0x00000077.html",
      detailPage: "error-code-0x00000077.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["77", "00000077", "0x77"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x77 KERNEL_STACK_INPAGE_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x77--kernel-stack-inpage-error"}
    },
    {
      code: "0x000000BE",
      title: "ATTEMPTED_WRITE_TO_READONLY_MEMORY",
      overview: "드라이버나 커널 모드 코드가 읽기 전용으로 보호된 메모리 영역에 쓰기를 시도했을 때 나타나는 코드로, 드라이버 결함이 주요 원인입니다.",
      summary: "드라이버나 커널 모드 코드가 읽기 전용으로 보호된 메모리 영역에 쓰기를 시도했을 때 나타나는 코드로, 드라이버 결함이 주요 원인입니다.",
      causes: ["최근 설치한 드라이버의 메모리 보호 위반", "커널 모드 소프트웨어 간의 충돌", "램 불안정으로 인한 메모리 손상", "보안 소프트웨어의 저수준 후킹 충돌", "손상된 드라이버 설치 파일"],
      checks: ["최근 설치하거나 업데이트한 드라이버를 확인하고 제거 또는 롤백하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "안전 모드에서 재현 여부를 확인하세요.", "보안 프로그램을 임시로 비활성화한 뒤 테스트해 보세요.", "제조사 홈페이지에서 해당 드라이버를 최신 버전으로 재설치해 보세요."],
      link: "error-code-0x000000be.html",
      detailPage: "error-code-0x000000be.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["be", "000000be", "0xbe"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xBE ATTEMPTED_WRITE_TO_READONLY_MEMORY","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xbe--attempted-write-to-readonly-memory"}
    },
    {
      code: "0x0000007A",
      title: "KERNEL_DATA_INPAGE_ERROR",
      overview: "커널 데이터를 디스크에서 읽어오는 도중 실패했을 때 나타나는 코드로, 저장장치나 메모리, 전원 문제가 복합적으로 얽혀 있을 수 있습니다.",
      summary: "커널 데이터를 디스크에서 읽어오는 도중 실패했을 때 나타나는 코드로, 저장장치나 메모리, 전원 문제가 복합적으로 얽혀 있을 수 있습니다.",
      causes: ["저장장치의 배드섹터나 물리적 결함", "램 모듈의 불안정", "전원 공급 불안정", "저장장치 케이블 접촉 불량", "갑작스러운 전원 종료로 인한 파일 시스템 손상"],
      checks: ["디스크 검사(chkdsk)로 저장장치 오류 여부를 점검하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "저장장치와 전원 케이블 연결 상태를 물리적으로 확인하세요.", "파워 서플라이 용량이 충분한지 확인하세요.", "중요 데이터는 미리 백업해 두세요."],
      link: "error-code-0x0000007a.html",
      detailPage: "error-code-0x0000007a.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["7a", "0000007a", "0x7a"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x7A KERNEL_DATA_INPAGE_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7a--kernel-data-inpage-error"}
    },
    {
      code: "0x00000124",
      title: "WHEA_UNCORRECTABLE_ERROR",
      summary: "CPU, 메모리, 메인보드, 전원 공급 장치가 수정할 수 없는 하드웨어 오류를 보고할 때 나타날 수 있습니다.",
      causes: ["CPU·GPU 과열", "오버클럭 또는 XMP 불안정", "전원 공급과 메인보드 문제"],
      checks: ["오버클럭과 XMP/EXPO 기본값 복원", "온도와 전원 로그 확인", "메모리·CPU·GPU를 따로 부하 테스트"],
      link: "error-code-0x00000124.html",
      detailPage: "error-code-0x00000124.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["124", "00000124", "0x124"],
      communityCases: [{"title": "그래픽카드 교체로 해결한 사례", "summary": "AMD 라데온 그래픽카드로 바꾼 뒤부터 게임 중 이 오류로 반복적으로 재부팅됐던 사례가 있습니다. 드라이버를 이전 버전으로 롤백해도 증상이 계속됐는데, 예전에 쓰던 다른 모델(GTX 1050 Ti)로 그래픽카드 자체를 바꿔 끼운 뒤로는 오류가 완전히 사라졌습니다.", "insight": "드라이버 문제처럼 보이는 증상이 실제로는 그래픽카드 자체의 결함인 경우가 있습니다. 드라이버 롤백이나 재설치로도 해결되지 않는다면 그래픽카드 자체를 의심해볼 필요가 있습니다."}, {"title": "CPU 교체로 해결한 사례", "summary": "이벤트 뷰어의 시스템 로그에서 이 코드와 함께 WHEA-Logger 이벤트 18번이 반복적으로 기록되는 경우, CPU 자체의 하드웨어 결함일 가능성이 높습니다. 오버클럭 해제, 메모리 교차 테스트, 온도·전원 점검을 모두 진행했지만 해결되지 않다가 CPU를 교체한 뒤에야 문제가 해결된 사례가 있습니다.", "insight": "이벤트 뷰어에서 WHEA-Logger 18번이 이 코드와 같은 시각에 반복 기록된다면, 드라이버나 설정보다 CPU 자체의 결함을 먼저 의심해보는 것이 좋습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x124 WHEA_UNCORRECTABLE_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x124---whea-uncorrectable-error"}
    },
    {
      code: "0x00000139",
      title: "KERNEL_SECURITY_CHECK_FAILURE",
      summary: "윈도우 커널의 중요한 데이터 구조가 손상되었거나 예상과 다르게 바뀌었을 때 나타날 수 있습니다.",
      causes: ["호환되지 않는 드라이버", "메모리 손상", "시스템 파일과 보안 프로그램 충돌"],
      checks: ["최근 설치한 드라이버 확인", "안전 모드 재현 여부 확인", "Windows 메모리 진단과 시스템 파일 검사"],
      link: "error-code-0x00000139.html",
      detailPage: "error-code-0x00000139.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["139", "00000139", "0x139"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x139 KERNEL_SECURITY_CHECK_FAILURE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x139--kernel-security-check-failure"}
    },
    {
      code: "0x000000C4",
      title: "DRIVER_VERIFIER_DETECTED_VIOLATION",
      summary: "Driver Verifier가 드라이버의 잘못된 동작을 발견했을 때 발생하는 블루스크린 코드입니다.",
      causes: ["불안정한 장치 드라이버", "베타 드라이버 또는 튜닝 도구", "검증 설정이 계속 활성화됨"],
      checks: ["최근 드라이버 변경 시점 확인", "안전 모드에서 문제 드라이버 제거", "검증기 설정을 확인한 뒤 재부팅"],
      link: "error-code-0x000000c4.html",
      detailPage: "error-code-0x000000c4.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["c4", "000000c4", "0xc4"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xC4 DRIVER_VERIFIER_DETECTED_VIOLATION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xc4--driver-verifier-detected-violation"}
    },
    {
      code: "0x800F081F",
      title: "원본 파일을 찾을 수 없음",
      summary: "Windows 기능 추가나 복구 과정에서 필요한 구성 요소 원본을 찾지 못할 때 보이는 코드입니다.",
      causes: ["Windows 구성 요소 저장소 손상", "잘못된 설치 미디어 경로", "업데이트 서버 또는 정책 문제"],
      checks: ["DISM 복구 결과 확인", "Windows Update와 프록시 설정 점검", "정확한 Windows 설치 미디어 지정"],
      link: "error-code-0x800f081f.html",
      detailPage: "error-code-0x800f081f.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["800f081f", "0x800f081f"],
      officialSource: {"title":"Microsoft Learn: Fix Windows Update errors (DISM source files)","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors"}
    },
    {
      code: "0x80070422",
      title: "필요한 서비스가 비활성화됨",
      summary: "Windows Update나 관련 서비스가 중지 또는 비활성화되어 작업을 진행하지 못할 때 나타날 수 있습니다.",
      causes: ["Windows Update 서비스 중지", "최적화 도구가 서비스를 변경", "정책 또는 보안 프로그램의 차단"],
      checks: ["서비스 상태 확인", "시작 유형을 기본값과 비교", "업데이트 문제 해결사와 이벤트 로그 확인"],
      link: "error-code-0x80070422.html",
      detailPage: "error-code-0x80070422.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80070422", "0x80070422"],
      officialSource: {"title":"Microsoft Learn: Windows Update error code list","url":"https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference"}
    },
    {
      code: "0x80070070",
      title: "디스크 공간 부족",
      summary: "Windows 업데이트, 앱 설치, 임시 파일 생성에 필요한 여유 공간이 부족할 때 나타나는 코드입니다.",
      causes: ["시스템 드라이브 여유 공간 부족", "업데이트 임시 파일 누적", "복구 파티션 공간 부족"],
      checks: ["C 드라이브 여유 공간 확인", "임시 파일과 이전 업데이트 정리", "대용량 파일을 다른 드라이브로 이동"],
      link: "error-code-0x80070070.html",
      detailPage: "error-code-0x80070070.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80070070", "0x80070070"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_DISK_FULL","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0xC1900101",
      title: "업데이트 드라이버 호환성 실패",
      summary: "Windows 기능 업데이트 중 드라이버가 설치 또는 롤백 단계에서 충돌할 때 자주 보이는 코드입니다.",
      causes: ["저장장치·그래픽 드라이버 충돌", "외장 장치 드라이버", "오래된 BIOS 또는 제조사 유틸리티"],
      checks: ["외장 장치 분리", "장치 관리자 드라이버 업데이트 또는 제거", "업데이트 로그와 호환성 결과 확인"],
      link: "error-code-0xc1900101.html",
      detailPage: "error-code-0xc1900101.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["c1900101", "0xc1900101"],
      officialSource: {"title":"Microsoft Learn: Windows 10 upgrade resolution procedures","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/setup-upgrade-and-drivers/windows-10-upgrade-resolution-procedures"}
    },
    {
      code: "0x80240034",
      title: "WU_E_UNKNOWN 알 수 없는 업데이트 오류",
      overview: "윈도우 업데이트 클라이언트가 다운로드나 설치 과정에서 분류되지 않은 오류를 만났을 때 표시되는 포괄적인 코드입니다. 원인이 한 가지로 좁혀지지 않아 캐시, 서비스, 구성 요소 저장소를 순서대로 점검해야 합니다.",
      summary: "윈도우 업데이트 클라이언트가 다운로드나 설치 과정에서 분류되지 않은 오류를 만났을 때 표시되는 포괄적인 코드입니다.",
      causes: ["업데이트 캐시(SoftwareDistribution)가 손상되어 다운로드나 설치 목록을 제대로 읽지 못하는 경우", "Windows Update 관련 서비스(wuauserv, bits, cryptsvc) 중 하나가 중지되었거나 손상된 경우", "구성 요소 저장소(WinSxS)에 손상된 항목이 남아있는 경우", "이전 업데이트 설치가 중간에 중단되어 잔여 파일이 충돌하는 경우", "보안 소프트웨어가 업데이트 프로세스의 파일 접근을 차단하는 경우"],
      checks: ["Windows Update 문제 해결사를 먼저 실행해 자동으로 진단받아 보세요.", "명령 프롬프트(관리자)에서 wuauserv, bits, cryptsvc 서비스를 각각 net stop/net start로 재시작하세요.", "SoftwareDistribution과 catroot2 폴더 이름을 바꾼 뒤 업데이트를 다시 시도하세요.", "DISM /Online /Cleanup-Image /RestoreHealth 명령으로 구성 요소 저장소를 복구하세요.", "그래도 반복되면 업데이트 어시스턴트로 최신 버전을 수동 설치해 보세요."],
      link: "error-code-0x80240034.html",
      detailPage: "error-code-0x80240034.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80240034", "0x80240034", "wu_e_unknown"],
      officialSource: {"title":"Microsoft Learn: Windows Update error code list — WU_E_DOWNLOAD_FAILED","url":"https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference"}
    },
    {
      code: "0x8024402C",
      title: "WU_E_PT_WINHTTP_NAME_NOT_RESOLVED 서버 연결 실패",
      overview: "윈도우 업데이트 클라이언트가 마이크로소프트 업데이트 서버의 주소를 확인(DNS)하지 못했을 때 나타나는 오류입니다. 네트워크 연결 자체보다 이름 확인이나 프록시 설정이 원인인 경우가 많습니다.",
      summary: "윈도우 업데이트 클라이언트가 마이크로소프트 업데이트 서버의 주소를 확인(DNS)하지 못했을 때 나타나는 오류입니다.",
      causes: ["DNS 서버가 응답하지 않거나 잘못된 DNS 주소가 설정된 경우", "VPN이나 프록시 설정이 업데이트 서버 접속을 가로막는 경우", "회사/학교 네트워크의 방화벽이 업데이트 관련 포트를 차단하는 경우", "네트워크 어댑터 드라이버가 불안정해 간헐적으로 연결이 끊기는 경우", "hosts 파일에 업데이트 서버 도메인이 잘못 등록된 경우"],
      checks: ["다른 웹사이트는 정상 접속되는지 확인해 전체 네트워크 문제인지 좁혀보세요.", "명령 프롬프트에서 ipconfig /flushdns로 DNS 캐시를 지운 뒤 다시 시도하세요.", "VPN이나 프록시를 사용 중이라면 임시로 해제하고 업데이트를 재시도하세요.", "네트워크 어댑터 속성에서 DNS 서버를 8.8.8.8 같은 공용 DNS로 임시 변경해 재현 여부를 확인하세요.", "회사망이라면 네트워크 관리자에게 업데이트 서버 도메인이 차단됐는지 확인을 요청하세요."],
      link: "error-code-0x8024402c.html",
      detailPage: "error-code-0x8024402c.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["8024402c", "0x8024402c"],
      officialSource: {"title":"Microsoft Learn: Windows Update error code list — WU_E_PT_WINHTTP_NAME_NOT_RESOLVED","url":"https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference"}
    },
    {
      code: "0x80073712",
      title: "구성 요소 저장소 손상 오류",
      overview: "업데이트 설치에 필요한 시스템 파일이 저장된 구성 요소 저장소(WinSxS)의 일부가 손상되었을 때 나타나는 오류입니다. 반복적인 업데이트 실패의 대표적인 원인 중 하나입니다.",
      summary: "업데이트 설치에 필요한 시스템 파일이 저장된 구성 요소 저장소(WinSxS)의 일부가 손상되었을 때 나타나는 오류입니다.",
      causes: ["이전 업데이트가 비정상 종료되어 구성 요소 저장소 항목이 일부만 기록된 경우", "디스크 오류로 저장소 파일 자체가 손상된 경우", "타사 시스템 최적화 프로그램이 시스템 파일을 임의로 삭제한 경우", "오래 방치된 시스템에서 여러 번의 업데이트 누적으로 저장소 정합성이 깨진 경우", "바이러스나 맬웨어 감염으로 시스템 파일이 변조된 경우"],
      checks: ["명령 프롬프트(관리자)에서 DISM /Online /Cleanup-Image /ScanHealth로 손상 여부를 먼저 확인하세요.", "손상이 확인되면 DISM /Online /Cleanup-Image /RestoreHealth로 복구를 진행하세요 (인터넷 연결 필요).", "복구 후 sfc /scannow를 실행해 시스템 파일 전체를 다시 검사하세요.", "디스크 상태를 chkdsk로 점검해 물리적 오류가 없는지 확인하세요.", "복구가 반복 실패하면 설치 미디어의 install.wim을 소스로 지정해 DISM 복구를 다시 시도하세요."],
      link: "error-code-0x80073712.html",
      detailPage: "error-code-0x80073712.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80073712", "0x80073712"],
      officialSource: {"title":"Microsoft Learn: Fix Windows Update errors (component store repair)","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors"}
    },
    {
      code: "0x8007232B",
      title: "DNS 이름을 확인할 수 없음",
      overview: "업데이트 서버나 활성화 서버의 도메인 이름을 DNS가 확인하지 못했을 때 나타나는 오류입니다. 업데이트뿐 아니라 윈도우 정품 인증, 스토어 접속 실패와 함께 나타나기도 합니다.",
      summary: "업데이트 서버나 활성화 서버의 도메인 이름을 DNS가 확인하지 못했을 때 나타나는 오류입니다.",
      causes: ["DNS 서버가 응답하지 않거나 설정이 잘못된 경우", "공유기나 모뎀의 DNS 캐시가 오래되어 최신 주소를 반영하지 못하는 경우", "VPN이나 사설 DNS 확장 프로그램이 이름 확인을 방해하는 경우", "네트워크 어댑터 드라이버 문제로 DNS 질의 자체가 실패하는 경우", "회사·공용 와이파이의 DNS 필터링 정책에 걸리는 경우"],
      checks: ["명령 프롬프트에서 ipconfig /flushdns 로 DNS 캐시를 초기화한 뒤 재시도하세요.", "네트워크 어댑터 설정에서 DNS 서버를 8.8.8.8, 1.1.1.1 같은 공용 DNS로 바꿔 재현 여부를 확인하세요.", "공유기를 재시작해 공유기 자체의 DNS 캐시를 초기화하세요.", "VPN이나 DNS 관련 브라우저 확장 프로그램을 임시로 비활성화하세요.", "다른 네트워크(모바일 핫스팟 등)에서도 같은 오류가 나는지 확인해 네트워크 문제인지 PC 문제인지 구분하세요."],
      link: "error-code-0x8007232b.html",
      detailPage: "error-code-0x8007232b.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["8007232b", "0x8007232b"],
      officialSource: {"title":"Microsoft Learn: Activation error 0x8007232B — DNS name does not exist","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/licensing-and-activation/activation-error-0x8007232b-dns-name-does-not-exist"}
    },
    {
      code: "0x800f0821",
      title: "업데이트 패키지 설치 실패",
      overview: "다운로드까지는 완료됐지만 실제 설치 단계에서 패키지 적용에 실패했을 때 나타나는 코드입니다. 시스템 파일 손상이나 다른 프로세스의 리소스 점유가 흔한 원인입니다.",
      summary: "다운로드까지는 완료됐지만 실제 설치 단계에서 패키지 적용에 실패했을 때 나타나는 코드입니다.",
      causes: ["설치 대상 시스템 파일이 다른 프로세스에 의해 사용 중인 경우", "구성 요소 저장소나 레지스트리 일부가 손상된 경우", "업데이트 패키지 자체가 다운로드 중 손상된 경우", "디스크 여유 공간 부족", "이전 실패한 설치의 잔여 상태가 남아있는 경우"],
      checks: ["PC를 재부팅한 뒤 업데이트를 다시 시도해 리소스 점유 상태를 초기화하세요.", "SoftwareDistribution 폴더를 초기화(이름 변경)한 뒤 재시도하세요.", "DISM /Online /Cleanup-Image /RestoreHealth로 구성 요소 저장소를 점검하세요.", "디스크 여유 공간을 최소 10GB 이상 확보하세요.", "반복 실패 시 업데이트 어시스턴트로 수동 설치를 시도해 보세요."],
      link: "error-code-0x800f0821.html",
      detailPage: "error-code-0x800f0821.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["800f0821", "0x800f0821"],
      officialSource: {"title":"Microsoft Learn: Fix Windows Update errors","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/fix-windows-update-errors"}
    },
    {
      code: "0x8024a105",
      title: "업데이트 다운로드 실패",
      overview: "업데이트 파일을 서버에서 내려받는 도중 연결이 끊기거나 검증에 실패했을 때 나타나는 코드입니다. 네트워크 불안정과 캐시 손상이 주요 원인입니다.",
      summary: "업데이트 파일을 서버에서 내려받는 도중 연결이 끊기거나 검증에 실패했을 때 나타나는 코드입니다.",
      causes: ["다운로드 도중 네트워크 연결이 불안정해진 경우", "이전에 받아둔 캐시 파일이 손상되어 검증에 실패하는 경우", "디스크 여유 공간 부족으로 다운로드가 중단되는 경우", "보안 소프트웨어가 다운로드 파일을 검역소로 이동시키는 경우", "절전 모드로 전환되어 다운로드가 중단되는 경우"],
      checks: ["네트워크 연결 상태(유선/무선)를 확인하고 가능하면 유선으로 다시 시도하세요.", "SoftwareDistribution 폴더를 초기화해 캐시를 다시 받도록 하세요.", "디스크 여유 공간을 확인하고 부족하면 정리하세요.", "보안 프로그램의 최근 검역 항목에 업데이트 관련 파일이 있는지 확인하세요.", "업데이트가 진행되는 동안 절전 모드로 전환되지 않도록 전원 설정을 조정하세요."],
      link: "error-code-0x8024a105.html",
      detailPage: "error-code-0x8024a105.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["8024a105", "0x8024a105"],
      officialSource: {"title":"Microsoft Learn: Troubleshoot Windows Update download errors","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/troubleshoot-windows-update-download-errors"}
    },
    {
      code: "0x80070020",
      title: "파일이 다른 프로세스에서 사용 중",
      overview: "업데이트나 설치가 필요로 하는 파일을 다른 프로그램이나 프로세스가 이미 점유하고 있어 접근이 거부될 때 나타나는 오류입니다.",
      summary: "업데이트나 설치가 필요로 하는 파일을 다른 프로그램이나 프로세스가 이미 점유하고 있어 접근이 거부될 때 나타나는 오류입니다.",
      causes: ["백신 프로그램이 실시간 검사 중 해당 파일을 잠근 경우", "이전에 실행된 설치 프로세스가 완전히 종료되지 않은 경우", "다른 사용자 세션이나 백그라운드 서비스가 같은 파일을 사용 중인 경우", "클라우드 동기화 프로그램(원드라이브 등)이 파일을 동기화 중인 경우", "이전 업데이트 재부팅이 완료되지 않은 상태에서 새로 시도한 경우"],
      checks: ["PC를 완전히 재부팅한 뒤 다시 시도하세요 (백그라운드 프로세스 정리 효과).", "작업 관리자에서 백신, 클라우드 동기화 프로그램을 잠시 종료하고 재시도하세요.", "다른 사용자 계정이 로그인되어 있다면 로그아웃한 뒤 진행하세요.", "안전 모드에서 설치나 업데이트를 다시 시도해 다른 프로세스 간섭을 배제해 보세요.", "반복되면 어떤 프로세스가 파일을 점유하는지 리소스 모니터로 확인해 보세요."],
      link: "error-code-0x80070020.html",
      detailPage: "error-code-0x80070020.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80070020", "0x80070020"],
      officialSource: {"title":"Microsoft Learn: Windows Update error code list — InstallFileLocked","url":"https://learn.microsoft.com/en-us/windows/deployment/update/windows-update-error-reference"}
    },
    {
      code: "0x8007000e",
      title: "메모리 또는 시스템 리소스 부족",
      overview: "업데이트나 프로그램 실행에 필요한 메모리 또는 시스템 리소스가 부족할 때 나타나는 오류로, 실제 램 부족뿐 아니라 가상 메모리 설정 문제로도 발생할 수 있습니다.",
      summary: "업데이트나 프로그램 실행에 필요한 메모리 또는 시스템 리소스가 부족할 때 나타나는 오류로, 실제 램 부족뿐 아니라 가상 메모리 설정 문제로도 발생할 수 있습니다.",
      causes: ["실행 중인 프로그램이 많아 실제 사용 가능한 메모리가 부족한 경우", "가상 메모리(페이지 파일) 크기가 너무 작게 설정된 경우", "디스크 여유 공간 부족으로 페이지 파일을 확장하지 못하는 경우", "메모리 누수가 있는 백그라운드 프로세스가 실행 중인 경우", "32비트 프로그램이 메모리 주소 공간 한계에 도달한 경우"],
      checks: ["작업 관리자에서 불필요한 프로그램을 종료한 뒤 다시 시도하세요.", "설정에서 가상 메모리(페이지 파일) 크기가 시스템 관리 크기로 되어 있는지 확인하세요.", "디스크 여유 공간을 확보해 페이지 파일이 확장될 수 있도록 하세요.", "재부팅 후 다른 프로그램 없이 바로 업데이트나 작업을 시도해 보세요.", "메모리 진단 도구로 램 자체에 문제가 없는지 확인하세요."],
      link: "error-code-0x8007000e.html",
      detailPage: "error-code-0x8007000e.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["8007000e", "0x8007000e"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_OUTOFMEMORY","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x800705b4",
      title: "작업 시간 초과",
      overview: "업데이트나 특정 작업이 정해진 시간 안에 완료되지 못하고 시간 초과로 중단됐을 때 나타나는 오류입니다. 느린 네트워크나 시스템 응답 지연이 주요 원인입니다.",
      summary: "업데이트나 특정 작업이 정해진 시간 안에 완료되지 못하고 시간 초과로 중단됐을 때 나타나는 오류입니다.",
      causes: ["네트워크 속도가 느리거나 불안정해 다운로드가 지연되는 경우", "디스크 응답 속도가 느려 파일 처리가 지연되는 경우", "백그라운드에서 다른 무거운 작업이 동시에 실행되고 있는 경우", "서버 측 응답이 느린 시간대에 접속한 경우", "보안 소프트웨어의 검사로 인해 처리 속도가 느려진 경우"],
      checks: ["네트워크 상태를 확인하고 가능하면 더 안정적인 연결(유선 등)로 다시 시도하세요.", "다른 무거운 프로그램을 종료한 뒤 작업을 다시 시도하세요.", "디스크 상태(특히 HDD의 경우 조각모음, SSD의 경우 여유 공간)를 점검하세요.", "시간대를 바꿔(예: 트래픽이 적은 새벽 시간) 다시 시도해 보세요.", "보안 프로그램의 실시간 검사를 일시적으로 낮춘 뒤 재시도해 보세요."],
      link: "error-code-0x800705b4.html",
      detailPage: "error-code-0x800705b4.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["800705b4", "0x800705b4"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1300-1699) — ERROR_TIMEOUT","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1300-1699-"}
    },
    {
      code: "0x80070003",
      title: "지정된 경로를 찾을 수 없음",
      overview: "설치나 업데이트, 파일 접근 시 시스템이 지정된 경로 자체를 찾지 못했을 때 나타나는 오류로, 경로 손상이나 이동된 폴더가 주요 원인입니다.",
      summary: "설치나 업데이트, 파일 접근 시 시스템이 지정된 경로 자체를 찾지 못했을 때 나타나는 오류로, 경로 손상이나 이동된 폴더가 주요 원인입니다.",
      causes: ["설치 대상 폴더가 삭제되었거나 다른 위치로 이동된 경우", "레지스트리에 등록된 경로 정보가 최신 상태와 맞지 않는 경우", "네트워크 드라이브 연결이 끊겨 경로에 접근할 수 없는 경우", "경로 이름에 시스템이 처리하지 못하는 특수 문자가 포함된 경우", "이전 업데이트나 설치 과정에서 폴더 구조가 일부 손상된 경우"],
      checks: ["오류 메시지에 표시된 경로가 실제로 존재하는지 탐색기에서 확인하세요.", "네트워크 드라이브라면 연결이 살아있는지 확인하고 다시 매핑해 보세요.", "SoftwareDistribution 캐시를 초기화한 뒤 업데이트를 다시 시도하세요.", "sfc /scannow로 시스템 파일과 경로 관련 손상을 점검하세요.", "가능하다면 문제 프로그램을 제거 후 재설치해 경로 정보를 새로 등록하세요."],
      link: "error-code-0x80070003.html",
      detailPage: "error-code-0x80070003.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80070003", "0x80070003"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_PATH_NOT_FOUND","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x800704CF",
      title: "이 네트워크에 연결되어 있지 않습니다",
      overview: "네트워크 어댑터가 활성화되어 있지 않거나 물리적으로 연결이 끊긴 상태에서 인터넷 관련 작업을 시도했을 때 나타나는 오류입니다. 케이블이 꽂혀 있어도 어댑터가 비활성화되어 있으면 같은 메시지가 나타날 수 있습니다.",
      summary: "네트워크 어댑터가 활성화되어 있지 않거나 물리적으로 연결이 끊긴 상태에서 인터넷 관련 작업을 시도했을 때 나타나는 오류입니다.",
      causes: ["이더넷 케이블이 느슨하게 꽂혀 있거나 손상된 경우", "네트워크 어댑터가 장치 관리자에서 비활성화되어 있는 경우", "무선 어댑터의 비행기 모드가 켜져 있는 경우", "네트워크 드라이버가 손상되었거나 최근 업데이트로 문제가 생긴 경우", "공유기나 스위치 포트 자체의 고장"],
      checks: ["작업 표시줄의 네트워크 아이콘에서 비행기 모드가 꺼져 있는지 확인하세요.", "장치 관리자에서 네트워크 어댑터가 활성화 상태인지 확인하고, 비활성화되어 있다면 사용으로 전환하세요.", "이더넷 케이블이라면 다른 케이블이나 다른 포트로 교체해 재현 여부를 확인하세요.", "네트워크 드라이버를 제조사 최신 버전으로 재설치해 보세요.", "다른 기기를 같은 케이블/포트에 연결해 공유기나 스위치 쪽 문제인지 구분하세요."],
      link: "error-code-0x800704cf.html",
      detailPage: "error-code-0x800704cf.html",
      relatedSymptom: "hardware-wifi-disconnect.html",
      aliases: ["800704cf", "0x800704cf"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1000-1299) — network error range","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-"}
    },
    {
      code: "0x80070035",
      title: "네트워크 경로를 찾을 수 없음",
      overview: "공유 폴더나 네트워크 드라이브에 접근하려 할 때 지정한 경로 자체를 찾지 못해 나타나는 오류입니다. 파일 탐색기에서 \\\\컴퓨터명\\공유폴더 형태로 접근할 때 자주 발생합니다.",
      summary: "공유 폴더나 네트워크 드라이브에 접근하려 할 때 지정한 경로 자체를 찾지 못해 나타나는 오류입니다.",
      causes: ["대상 컴퓨터의 전원이 꺼져 있거나 같은 네트워크에 있지 않은 경우", "공유 폴더 설정 자체가 비활성화되어 있거나 삭제된 경우", "네트워크 검색이나 파일 공유 기능이 꺼져 있는 경우", "방화벽이 파일 공유 관련 포트를 차단하는 경우", "컴퓨터 이름이나 IP 주소가 변경되어 기존 경로가 유효하지 않은 경우"],
      checks: ["대상 컴퓨터가 켜져 있고 같은 네트워크(같은 공유기)에 연결되어 있는지 확인하세요.", "설정 > 네트워크 및 인터넷 > 공유 옵션에서 네트워크 검색과 파일 공유가 켜져 있는지 확인하세요.", "컴퓨터 이름 대신 IP 주소로 직접 접근을 시도해 경로 문제인지 이름 확인 문제인지 구분하세요.", "방화벽에서 파일 및 프린터 공유 규칙이 허용되어 있는지 확인하세요.", "대상 폴더의 공유 설정을 다시 확인하고 필요하면 공유를 재설정하세요."],
      link: "error-code-0x80070035.html",
      detailPage: "error-code-0x80070035.html",
      relatedSymptom: "windows-explorer-freeze.html",
      aliases: ["80070035", "0x80070035"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_BAD_NETPATH","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "0x80070718",
      title: "IP 주소를 가져올 수 없음",
      overview: "DHCP 서버로부터 IP 주소를 할당받지 못했을 때 나타나는 오류로, 공유기의 DHCP 기능 문제나 네트워크 혼잡이 흔한 원인입니다.",
      summary: "DHCP 서버로부터 IP 주소를 할당받지 못했을 때 나타나는 오류로, 공유기의 DHCP 기능 문제나 네트워크 혼잡이 흔한 원인입니다.",
      causes: ["공유기의 DHCP 서버 기능이 꺼져 있거나 오류가 발생한 경우", "네트워크에 연결된 기기가 많아 할당 가능한 IP 주소가 소진된 경우", "네트워크 어댑터의 IP 설정이 잘못 구성된 경우", "이전에 할당받은 IP 주소가 충돌을 일으키는 경우", "네트워크 드라이버 문제로 DHCP 요청 자체가 실패하는 경우"],
      checks: ["공유기를 재시작해 DHCP 서버 기능을 초기화하세요.", "명령 프롬프트(관리자)에서 ipconfig /release 후 ipconfig /renew를 실행해 IP를 다시 요청하세요.", "네트워크 어댑터 속성에서 IP 주소를 자동으로 받도록 설정되어 있는지 확인하세요.", "공유기 관리 화면에서 DHCP 주소 범위와 현재 연결된 기기 수를 확인하세요.", "네트워크 드라이버를 최신 버전으로 업데이트한 뒤 다시 시도하세요."],
      link: "error-code-0x80070718.html",
      detailPage: "error-code-0x80070718.html",
      relatedSymptom: "hardware-wifi-disconnect.html",
      aliases: ["80070718", "0x80070718"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1700-3999) — network/quota error range","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1700-3999-"}
    },
    {
      code: "0x80072EFD",
      title: "서버에 연결할 수 없음",
      overview: "앱이나 서비스가 원격 서버에 접속을 시도했지만 연결 자체가 이루어지지 않을 때 나타나는 오류입니다. 스토어 앱, 계정 로그인, 업데이트 확인 등 다양한 상황에서 공통으로 나타납니다.",
      summary: "앱이나 서비스가 원격 서버에 접속을 시도했지만 연결 자체가 이루어지지 않을 때 나타나는 오류입니다.",
      causes: ["인터넷 연결이 완전히 끊겼거나 매우 불안정한 경우", "방화벽이나 보안 소프트웨어가 해당 앱의 인터넷 접근을 차단하는 경우", "프록시나 VPN 설정이 잘못되어 연결이 가로막히는 경우", "시스템 날짜/시간이 틀려 보안 인증서 검증에 실패하는 경우", "일시적인 서버 측 장애"],
      checks: ["다른 웹사이트나 앱이 정상적으로 인터넷에 연결되는지 먼저 확인하세요.", "방화벽/보안 프로그램에서 해당 앱이 인터넷 접근을 차단당하고 있지 않은지 확인하세요.", "VPN이나 프록시를 사용 중이라면 잠시 해제하고 다시 시도하세요.", "설정에서 날짜, 시간, 시간대가 정확한지 확인하세요.", "시간을 두고 다시 시도해 일시적인 서버 문제였는지 확인하세요."],
      link: "error-code-0x80072efd.html",
      detailPage: "error-code-0x80072efd.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["80072efd", "0x80072efd"],
      officialSource: {"title":"Microsoft Learn: Troubleshoot Windows Update download errors","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/installing-updates-features-roles/troubleshoot-windows-update-download-errors"}
    },
    {
      code: "0x80070490",
      title: "요소를 찾을 수 없음 (네트워크 어댑터)",
      overview: "네트워크 설정을 변경하거나 어댑터 정보를 읽으려 할 때 시스템이 참조하려는 구성 요소를 찾지 못해 나타나는 오류입니다. 네트워크 어댑터 드라이버나 프로토콜 스택 손상과 관련이 깊습니다.",
      summary: "네트워크 설정을 변경하거나 어댑터 정보를 읽으려 할 때 시스템이 참조하려는 구성 요소를 찾지 못해 나타나는 오류입니다.",
      causes: ["네트워크 어댑터 드라이버가 일부 손상된 경우", "TCP/IP 프로토콜 스택 구성이 손상된 경우", "최근 네트워크 관련 업데이트 이후 설정 값이 꼬인 경우", "네트워크 어댑터를 물리적으로 제거했다가 다시 연결한 뒤 잔여 구성이 남은 경우", "타사 VPN 클라이언트가 설치한 가상 어댑터와의 충돌"],
      checks: ["명령 프롬프트(관리자)에서 netsh winsock reset 명령으로 네트워크 스택을 초기화하세요.", "이어서 netsh int ip reset 명령으로 TCP/IP 설정을 초기화한 뒤 재부팅하세요.", "장치 관리자에서 네트워크 어댑터를 제거한 뒤 재부팅해 자동으로 재설치되게 하세요.", "최근 설치한 VPN 클라이언트가 있다면 제거 후 재현 여부를 확인하세요.", "네트워크 어댑터 드라이버를 제조사 최신 버전으로 재설치하세요."],
      link: "error-code-0x80070490.html",
      detailPage: "error-code-0x80070490.html",
      relatedSymptom: "hardware-wifi-disconnect.html",
      aliases: ["80070490", "0x80070490"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1000-1299) — ERROR_NOT_FOUND","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-"}
    },
    {
      code: "0x8007274C",
      title: "네트워크 요청 시간 초과",
      overview: "서버로 보낸 요청이 정해진 시간 안에 응답을 받지 못했을 때 나타나는 오류로, 네트워크 지연이나 서버 응답 지연이 주요 원인입니다.",
      summary: "서버로 보낸 요청이 정해진 시간 안에 응답을 받지 못했을 때 나타나는 오류로, 네트워크 지연이나 서버 응답 지연이 주요 원인입니다.",
      causes: ["인터넷 속도가 느리거나 순간적으로 끊기는 경우", "공유기나 모뎀의 응답이 느린 경우", "동시에 여러 기기나 프로그램이 네트워크 대역폭을 과도하게 사용하는 경우", "DNS 응답이 느려 요청 자체가 지연되는 경우", "서버 측의 일시적인 응답 지연"],
      checks: ["다른 웹사이트도 느리게 열리는지 확인해 전체 네트워크 문제인지 좁혀보세요.", "공유기를 재시작해 응답 속도가 개선되는지 확인하세요.", "네트워크를 많이 쓰는 다른 프로그램(다운로드, 스트리밍 등)을 종료한 뒤 재시도하세요.", "DNS 서버를 공용 DNS(8.8.8.8 등)로 바꿔 재현 여부를 확인하세요.", "시간을 두고 다시 시도해 서버 측 문제였는지 확인하세요."],
      link: "error-code-0x8007274c.html",
      detailPage: "error-code-0x8007274c.html",
      relatedSymptom: "windows-update-fail-loop.html",
      aliases: ["8007274c", "0x8007274c"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (10000-11999) — WSAETIMEDOUT","url":"https://learn.microsoft.com/en-us/windows/win32/winsock/windows-sockets-error-codes-2"}
    },
    {
      code: "0x800704B3",
      title: "원격 프로시저 호출(RPC)이 실패했습니다",
      overview: "네트워크로 연결된 다른 컴퓨터나 서비스와 통신하는 데 필요한 RPC(원격 프로시저 호출)가 실패했을 때 나타나는 오류입니다. 프린터 공유, 원격 관리 작업 등에서 자주 나타납니다.",
      summary: "네트워크로 연결된 다른 컴퓨터나 서비스와 통신하는 데 필요한 RPC(원격 프로시저 호출)가 실패했을 때 나타나는 오류입니다.",
      causes: ["RPC 관련 윈도우 서비스(RPC, DCOM 서버 프로세스 실행기)가 중지된 경우", "방화벽이 RPC 통신에 필요한 포트를 차단하는 경우", "대상 컴퓨터와의 네트워크 연결이 불안정한 경우", "네트워크 프로필이 공용으로 설정되어 있어 통신이 제한되는 경우", "도메인/워크그룹 설정 불일치"],
      checks: ["서비스 관리자(services.msc)에서 Remote Procedure Call(RPC) 서비스가 실행 중인지 확인하세요.", "방화벽 설정에서 원격 관리나 파일/프린터 공유 관련 규칙이 허용되어 있는지 확인하세요.", "네트워크 프로필이 '개인'으로 설정되어 있는지 확인하세요 (공용 네트워크는 일부 통신이 제한됩니다).", "대상 컴퓨터와의 기본 네트워크 연결(ping)이 정상인지 확인하세요.", "두 컴퓨터가 같은 워크그룹이나 도메인에 속해 있는지 확인하세요."],
      link: "error-code-0x800704b3.html",
      detailPage: "error-code-0x800704b3.html",
      relatedSymptom: "windows-printer-add-freeze.html",
      aliases: ["800704b3", "0x800704b3"],
      officialSource: {"title":"Microsoft Learn: System Error Codes (1000-1299) — network path error range","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--1000-1299-"}
    },
    {
      code: "0x80070102",
      title: "네트워크 장치가 연결되지 않음",
      overview: "네트워크 어댑터나 케이블이 시스템에서 인식되지 않을 때 나타나는 오류로, 물리적 연결 문제나 드라이버 미인식이 주요 원인입니다.",
      summary: "네트워크 어댑터나 케이블이 시스템에서 인식되지 않을 때 나타나는 오류로, 물리적 연결 문제나 드라이버 미인식이 주요 원인입니다.",
      causes: ["네트워크 케이블이나 USB 랜카드가 느슨하게 연결된 경우", "네트워크 어댑터 드라이버가 설치되지 않았거나 손상된 경우", "메인보드의 내장 랜(LAN) 포트 자체가 고장난 경우", "USB 허브를 통한 연결에서 전력 부족으로 장치가 제대로 인식되지 않는 경우", "BIOS에서 내장 랜 기능이 비활성화되어 있는 경우"],
      checks: ["케이블과 어댑터 연결 상태를 물리적으로 다시 확인하세요.", "장치 관리자에서 네트워크 어댑터가 목록에 정상적으로 보이는지 확인하세요.", "보이지 않는다면 제조사 홈페이지에서 랜 드라이버를 다시 받아 설치하세요.", "USB 랜카드라면 허브를 거치지 않고 메인보드에 직접 연결해 보세요.", "BIOS에서 내장 랜(LAN) 컨트롤러가 활성화되어 있는지 확인하세요."],
      link: "error-code-0x80070102.html",
      detailPage: "error-code-0x80070102.html",
      relatedSymptom: "hardware-wifi-disconnect.html",
      aliases: ["80070102", "0x80070102"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — WAIT_TIMEOUT","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "코드 10",
      title: "이 장치를 시작할 수 없습니다 (코드 10)",
      overview: "장치 관리자에서 특정 하드웨어가 정상적으로 시작되지 못했을 때 나타나는 가장 흔한 오류입니다. 원인이 광범위해서 오디오, 네트워크, USB 장치 등 어떤 하드웨어에서든 나타날 수 있습니다.",
      summary: "장치 관리자에서 특정 하드웨어가 정상적으로 시작되지 못했을 때 나타나는 가장 흔한 오류입니다.",
      causes: ["드라이버 버전이 오래되었거나 현재 윈도우 버전과 호환되지 않는 경우", "장치 드라이버 설치 파일이 손상된 경우", "BIOS/UEFI에서 해당 장치 관련 기능(예: 온보드 사운드, 내장 카메라)이 비활성화된 경우", "전원 관리 설정이 장치를 완전히 끄고 다시 켜지 못하는 경우", "하드웨어 자체의 물리적 결함이나 접촉 불량"],
      checks: ["장치 관리자에서 해당 장치를 제거한 뒤 '하드웨어 변경 사항 검색'으로 재설치해 보세요.", "제조사 홈페이지에서 최신 드라이버를 받아 클린 설치해 보세요.", "BIOS에서 관련 장치 기능이 비활성화되어 있지 않은지 확인하세요.", "장치 속성의 전원 관리 탭에서 '전원 절약을 위해 이 장치를 끌 수 있음' 옵션을 해제해 보세요.", "다른 포트나 슬롯에 연결해 물리적 접촉 문제인지 확인하세요."],
      link: "error-code-device-manager-code-10.html",
      detailPage: "error-code-device-manager-code-10.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["code10", "코드10", "device-manager-code-10"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 43",
      title: "Windows에서 이 장치를 중지했습니다 (코드 43)",
      overview: "드라이버가 장치에서 하드웨어 오류나 문제를 감지해 윈도우에 보고했을 때 나타나는 코드로, 그래픽카드나 USB 장치에서 특히 자주 나타납니다. 소프트웨어 문제일 수도 있지만 하드웨어 결함의 신호인 경우도 많습니다.",
      summary: "드라이버가 장치에서 하드웨어 오류나 문제를 감지해 윈도우에 보고했을 때 나타나는 코드로, 그래픽카드나 USB 장치에서 특히 자주 나타납니다.",
      causes: ["그래픽카드가 과열되거나 전원 공급이 불안정한 경우", "USB 장치가 순간적으로 과전류를 발생시켜 컨트롤러가 안전을 위해 차단한 경우", "드라이버 버그로 장치 초기화에 실패하는 경우", "펌웨어가 오래되어 최신 드라이버와 호환되지 않는 경우", "하드웨어 자체의 결함(그래픽카드 고장, USB 컨트롤러 손상 등)"],
      checks: ["장치를 다른 포트나 슬롯에 연결해 재현되는지 확인하세요.", "그래픽카드라면 드라이버를 완전히 제거(DDU 등)한 뒤 최신 버전으로 재설치하세요.", "USB 장치라면 다른 PC에서도 같은 증상이 나오는지 확인해 장치 자체 결함인지 구분하세요.", "온도와 전원 공급 상태를 점검하세요 (특히 그래픽카드 보조 전원).", "제조사 펌웨어 업데이트가 있는지 확인하고 적용해 보세요."],
      link: "error-code-device-manager-code-43.html",
      detailPage: "error-code-device-manager-code-43.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["code43", "코드43", "device-manager-code-43"],
      communityCases: [{"title": "파워서플라이 교체로 해결한 사례", "summary": "RTX 2070에서 코드 43이 발생해 드라이버 재설치, DDU 클린 설치, PCIe 슬롯 교체까지 시도했지만 해결되지 않았던 사례가 있습니다. 자가 진단 도구로는 파워서플라이가 정상으로 나왔지만, 커뮤니티에서는 오래되고 품질이 낮은 파워서플라이 자체를 의심해보라고 권했고, 실제로 파워서플라이를 교체한 뒤 문제가 해결됐습니다.", "insight": "전원 공급 장치는 테스트 도구에서 이상 없다고 나와도 실제로는 불안정한 경우가 있습니다."}, {"title": "램 슬롯 분리 테스트로 해결한 사례", "summary": "RMA로 교체받은 그래픽카드에서 코드 43과 함께 화면에 줄이 가는 증상이 나타났는데, 커뮤니티에서는 그래픽카드 자체보다 램(RAM) 문제일 가능성을 짚었습니다. 서로 다른 시기에 구매한 메모리 키트를 함께 꽂아 쓰고 있었던 것이 원인일 수 있다는 조언에 따라 메모리 키트를 하나씩 분리해서 테스트하는 방법이 제안됐습니다.", "insight": "그래픽 관련 오류라고 해서 반드시 그래픽카드만의 문제는 아닐 수 있습니다."}],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 28",
      title: "이 장치에 대한 드라이버가 설치되어 있지 않습니다 (코드 28)",
      overview: "윈도우가 해당 하드웨어를 인식했지만 이를 제어할 드라이버를 찾지 못했을 때 나타나는 코드입니다. 새 하드웨어를 처음 연결했거나 윈도우를 새로 설치한 직후 자주 나타납니다.",
      summary: "윈도우가 해당 하드웨어를 인식했지만 이를 제어할 드라이버를 찾지 못했을 때 나타나는 코드입니다.",
      causes: ["새로 설치한 윈도우에 기본 제공되지 않는 전용 드라이버가 필요한 경우", "인터넷 연결 없이 설치해 자동 드라이버 검색이 이루어지지 않은 경우", "제조사 드라이버 설치 프로그램이 도중에 실패한 경우", "너무 오래되었거나 반대로 너무 최신인 운영체제와 하드웨어 조합", "드라이버 설치 파일 자체가 손상된 경우"],
      checks: ["장치 관리자에서 노란 느낌표가 있는 장치를 확인하고, 하드웨어 ID로 제조사와 모델을 특정하세요.", "제조사 공식 홈페이지에서 정확한 모델명의 드라이버를 다운로드해 설치하세요.", "Windows Update에서 선택적 업데이트에 관련 드라이버가 있는지 확인하세요.", "인터넷에 연결한 상태에서 '하드웨어 변경 사항 검색'을 다시 실행해 보세요.", "다운로드한 드라이버 설치 파일이 완전한지 다시 받아서 재시도하세요."],
      link: "error-code-device-manager-code-28.html",
      detailPage: "error-code-device-manager-code-28.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["code28", "코드28", "device-manager-code-28"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 39",
      title: "드라이버가 손상되었거나 누락되었습니다 (코드 39)",
      overview: "장치를 제어해야 할 드라이버 파일 자체가 손상되었거나 누락되어 윈도우가 로드하지 못할 때 나타나는 코드입니다. 오디오나 저장장치 컨트롤러에서 자주 보고됩니다.",
      summary: "장치를 제어해야 할 드라이버 파일 자체가 손상되었거나 누락되어 윈도우가 로드하지 못할 때 나타나는 코드입니다.",
      causes: ["드라이버 파일이 디스크 오류나 강제 종료로 손상된 경우", "맬웨어 감염으로 드라이버 파일이 변조되거나 삭제된 경우", "레지스트리에서 드라이버 참조 경로가 잘못된 경우", "다른 프로그램이 드라이버 파일을 잘못 덮어쓴 경우", "시스템 파일 손상이 드라이버 로드 과정에 영향을 준 경우"],
      checks: ["명령 프롬프트에서 sfc /scannow를 실행해 손상된 시스템 파일을 복구하세요.", "장치 관리자에서 해당 드라이버를 완전히 제거한 뒤 재설치하세요.", "백신 프로그램으로 전체 검사를 실행해 맬웨어 감염 여부를 확인하세요.", "제조사 홈페이지에서 드라이버를 새로 받아 클린 설치하세요.", "디스크 상태를 chkdsk로 점검해 물리적 오류가 없는지 확인하세요."],
      link: "error-code-device-manager-code-39.html",
      detailPage: "error-code-device-manager-code-39.html",
      relatedSymptom: "hardware-sound-not-working.html",
      aliases: ["code39", "코드39", "device-manager-code-39"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 31",
      title: "이 장치가 제대로 작동하고 있지 않습니다 (코드 31)",
      overview: "드라이버는 로드됐지만 장치가 필요한 정보를 제공하지 못해 정상 동작하지 않을 때 나타나는 코드입니다. 리소스 충돌이나 구형 드라이버가 흔한 원인입니다.",
      summary: "드라이버는 로드됐지만 장치가 필요한 정보를 제공하지 못해 정상 동작하지 않을 때 나타나는 코드입니다.",
      causes: ["다른 장치와 하드웨어 리소스(IRQ 등)가 충돌하는 경우", "드라이버가 오래되어 현재 시스템 구성과 맞지 않는 경우", "장치가 절전 상태에서 제대로 복귀하지 못하는 경우", "메인보드 칩셋 드라이버가 오래된 경우", "장치 자체의 초기화 실패"],
      checks: ["장치 관리자에서 리소스 탭(있는 경우)으로 다른 장치와의 충돌 여부를 확인하세요.", "메인보드 칩셋 드라이버를 최신 버전으로 업데이트하세요.", "장치 드라이버를 제거 후 재부팅해 자동 재설치를 유도하세요.", "절전 모드에서 복귀한 직후에만 발생하는지 확인해 전원 관리 설정을 점검하세요.", "가능하다면 다른 슬롯이나 포트로 장치를 옮겨 재현 여부를 확인하세요."],
      link: "error-code-device-manager-code-31.html",
      detailPage: "error-code-device-manager-code-31.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["code31", "코드31", "device-manager-code-31"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 34",
      title: "장치에 필요한 설정 정보를 확인할 수 없습니다 (코드 34)",
      overview: "윈도우가 장치를 초기화하는 데 필요한 리소스 설정 값을 자동으로 판단하지 못했을 때 나타나는 코드로, 오래된 하드웨어나 레거시 장치에서 종종 나타납니다.",
      summary: "윈도우가 장치를 초기화하는 데 필요한 리소스 설정 값을 자동으로 판단하지 못했을 때 나타나는 코드로, 오래된 하드웨어나 레거시 장치에서 종종 나타납니다.",
      causes: ["레거시(플러그 앤 플레이를 완전히 지원하지 않는) 하드웨어인 경우", "BIOS 설정이 장치가 요구하는 리소스와 맞지 않는 경우", "드라이버가 자동 설정 값을 지원하지 않아 수동 설정이 필요한 경우", "다른 장치와 IRQ나 메모리 주소가 겹치는 경우", "매우 오래된 드라이버가 최신 시스템과 호환되지 않는 경우"],
      checks: ["장치 제조사에 해당 모델이 현재 윈도우 버전을 공식 지원하는지 확인하세요.", "BIOS를 기본값으로 초기화한 뒤 재시도해 보세요.", "장치 속성의 리소스 탭에서 수동으로 설정을 조정할 수 있는지 확인하세요 (고급 사용자용).", "다른 PCI/PCIe 슬롯에 장치를 옮겨 리소스 충돌 여부를 확인하세요.", "구형 하드웨어라면 최신 윈도우 대신 호환 모드 설치나 장치 교체를 고려하세요."],
      link: "error-code-device-manager-code-34.html",
      detailPage: "error-code-device-manager-code-34.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["code34", "코드34", "device-manager-code-34"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 19",
      title: "레지스트리 정보가 손상되어 장치를 시작할 수 없습니다 (코드 19)",
      overview: "장치 시작에 필요한 구성 정보가 레지스트리에 불완전하거나 손상된 형태로 저장되어 있을 때 나타나는 코드입니다. 드라이버를 여러 번 재설치해도 같은 문제가 반복될 수 있습니다.",
      summary: "장치 시작에 필요한 구성 정보가 레지스트리에 불완전하거나 손상된 형태로 저장되어 있을 때 나타나는 코드입니다.",
      causes: ["이전 드라이버 제거 과정이 불완전하게 끝나 레지스트리에 잔여 항목이 남은 경우", "레지스트리 정리 도구가 필요한 항목까지 잘못 삭제한 경우", "시스템 파일이나 레지스트리 하이브 손상", "여러 버전의 드라이버가 충돌하며 설치된 경우", "맬웨어가 레지스트리를 변조한 경우"],
      checks: ["장치 관리자에서 '드라이버 소프트웨어 삭제'를 체크하고 완전히 제거한 뒤 재부팅하세요.", "제조사의 전용 드라이버 클린업 도구가 있다면 사용해 잔여 항목을 정리하세요.", "sfc /scannow와 DISM 복구 명령으로 시스템 파일 손상을 점검하세요.", "레지스트리를 직접 수정하기보다 시스템 복원 지점을 활용하는 것이 더 안전합니다.", "백신 프로그램으로 맬웨어 감염 여부를 확인하세요."],
      link: "error-code-device-manager-code-19.html",
      detailPage: "error-code-device-manager-code-19.html",
      relatedSymptom: "windows-auto-repair-loop.html",
      aliases: ["code19", "코드19", "device-manager-code-19"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 41",
      title: "드라이버 로드는 됐지만 장치를 찾을 수 없습니다 (코드 41)",
      overview: "드라이버 자체는 정상적으로 로드됐지만 실제 하드웨어를 찾지 못할 때 나타나는 코드로, 마지막으로 장치를 제거했을 때 드라이버가 완전히 언로드되지 않은 경우 흔히 발생합니다.",
      summary: "드라이버 자체는 정상적으로 로드됐지만 실제 하드웨어를 찾지 못할 때 나타나는 코드로, 마지막으로 장치를 제거했을 때 드라이버가 완전히 언로드되지 않은 경우 흔히 발생합니다.",
      causes: ["장치를 안전하게 제거하지 않고 물리적으로 뽑은 경우", "USB 장치가 절전 모드 진입 중 강제로 연결이 끊긴 경우", "드라이버와 장치 펌웨어 버전이 맞지 않는 경우", "USB 허브를 통한 연결에서 전력 부족으로 장치가 순간적으로 사라진 경우", "가상화 소프트웨어가 장치를 다른 세션으로 전달하며 충돌한 경우"],
      checks: ["장치를 물리적으로 분리한 뒤 다시 연결해 재인식을 시도하세요.", "PC를 완전히 재부팅해 드라이버 상태를 초기화하세요.", "USB 허브를 거치지 않고 메인보드에 직접 연결해 전력 문제를 배제해 보세요.", "장치 관리자에서 숨겨진 장치 표시를 켜고, 중복 등록된 이전 항목을 제거하세요.", "제조사 최신 드라이버와 펌웨어로 업데이트해 보세요."],
      link: "error-code-device-manager-code-41.html",
      detailPage: "error-code-device-manager-code-41.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["code41", "코드41", "device-manager-code-41"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "오류 1603",
      title: "설치 중 치명적 오류가 발생했습니다 (오류 1603)",
      overview: "MSI(Windows Installer) 기반 설치 프로그램이 설치 도중 원인을 특정하기 어려운 치명적 오류를 만났을 때 나타나는 코드입니다. 실제로는 권한, 잔여 파일, 서비스 문제 등 다양한 원인이 이 하나의 코드로 뭉뚱그려 보고됩니다.",
      summary: "MSI(Windows Installer) 기반 설치 프로그램이 설치 도중 원인을 특정하기 어려운 치명적 오류를 만났을 때 나타나는 코드입니다.",
      causes: ["이전 버전이 완전히 제거되지 않고 잔여 파일이나 레지스트리가 남아있는 경우", "설치 대상 폴더나 레지스트리 키에 대한 접근 권한이 부족한 경우", "Windows Installer 서비스 자체가 중지되었거나 손상된 경우", "설치 파일이 다운로드 중 손상되었거나 불완전한 경우", "보안 소프트웨어가 설치 프로세스의 파일 쓰기를 차단하는 경우"],
      checks: ["제조사의 전용 제거 도구(클린업 툴)로 이전 버전 잔여물을 완전히 정리한 뒤 재설치하세요.", "설치 파일을 마우스 우클릭 후 '관리자 권한으로 실행'으로 다시 시도하세요.", "서비스 관리자(services.msc)에서 Windows Installer 서비스가 실행 중인지 확인하세요.", "설치 파일을 공식 홈페이지에서 다시 받아 무결성을 확인한 뒤 재시도하세요.", "보안 프로그램을 임시로 비활성화한 뒤 설치를 다시 진행해 보세요."],
      link: "error-code-1603.html",
      detailPage: "error-code-1603.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["1603", "error1603", "오류1603"],
      communityCases: [{"title": "윈도우 재설치로 해결한 사례", "summary": "그래픽카드를 새로 산 뒤 드라이버 설치할 때마다 이 오류가 발생했던 사례가 있습니다. 드라이버 제거·재설치, DISM, 파워쉘 스캔까지 구글에서 찾을 수 있는 모든 방법을 시도했지만 소용없었는데, 결국 윈도우를 새로 설치한 뒤에야 해결됐습니다. 하드웨어를 교체하면서 윈도우 정품 인증이 풀린 상태였던 것이 원인이었던 것으로 보입니다.", "insight": "메인보드나 그래픽카드 같은 주요 부품을 교체한 직후 설치 오류가 반복된다면, 인증 상태가 꼬였을 가능성도 점검해볼 필요가 있습니다."}],
      officialSource: {"title":"Microsoft Learn: MSI installation error 1603","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/application-management/msi-installation-error-1603"}
    },
    {
      code: "오류 1618",
      title: "다른 설치가 진행 중입니다 (오류 1618)",
      overview: "이미 다른 Windows Installer 작업이 진행 중이라 새 설치나 제거를 시작할 수 없을 때 나타나는 오류입니다. 실제로는 이전 설치가 멈춰 있거나 비정상 종료된 잔여 프로세스인 경우가 많습니다.",
      summary: "이미 다른 Windows Installer 작업이 진행 중이라 새 설치나 제거를 시작할 수 없을 때 나타나는 오류입니다.",
      causes: ["이전 설치/제거 작업이 완전히 끝나지 않고 백그라운드에 남아있는 경우", "여러 설치 프로그램을 동시에 실행한 경우", "이전 설치가 오류로 중단되며 Installer 프로세스가 종료되지 않은 경우", "자동 업데이트 프로그램이 백그라운드에서 Installer를 점유하고 있는 경우", "시스템 재부팅이 필요한 이전 작업이 완료되지 않은 경우"],
      checks: ["작업 관리자에서 msiexec.exe 프로세스가 실행 중인지 확인하고, 있다면 종료 후 재시도하세요.", "PC를 재부팅한 뒤 다른 프로그램 없이 설치를 다시 시도하세요.", "백그라운드 업데이트 프로그램(스토어, 자동 업데이트 유틸리티 등)을 일시 종료하세요.", "동시에 여러 설치 프로그램을 실행하지 말고 하나씩 순서대로 진행하세요.", "반복되면 시스템을 재부팅해 대기 중인 설치 작업을 완료시킨 뒤 다시 시도하세요."],
      link: "error-code-1618.html",
      detailPage: "error-code-1618.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["1618", "error1618", "오류1618"],
      officialSource: {"title":"Microsoft Learn: MsiExec.exe error codes — ERROR_INSTALL_ALREADY_RUNNING","url":"https://learn.microsoft.com/en-us/windows/win32/msi/error-codes"}
    },
    {
      code: "오류 2503",
      title: "이 설치 패키지를 열 수 없습니다 (오류 2503)",
      overview: "설치 프로그램을 실행하는 계정에 임시 폴더나 설치 관련 권한이 부족할 때 나타나는 오류로, 관리자 계정에서도 UAC나 폴더 권한 설정에 따라 발생할 수 있습니다.",
      summary: "설치 프로그램을 실행하는 계정에 임시 폴더나 설치 관련 권한이 부족할 때 나타나는 오류로, 관리자 계정에서도 UAC나 폴더 권한 설정에 따라 발생할 수 있습니다.",
      causes: ["임시 폴더(%TEMP%)에 대한 쓰기 권한이 없는 경우", "사용자 계정 컨트롤(UAC) 설정이 설치 프로그램의 권한 요청을 막는 경우", "설치 파일이 저장된 폴더나 드라이브의 권한이 제한된 경우", "그룹 정책으로 소프트웨어 설치가 제한된 경우", "임시 폴더 용량이 가득 찬 경우"],
      checks: ["설치 파일을 관리자 권한으로 실행해 보세요 (마우스 우클릭 > 관리자 권한으로 실행).", "%TEMP% 폴더의 파일과 폴더 속성에서 현재 계정의 쓰기 권한을 확인하세요.", "임시 파일을 정리해 %TEMP% 폴더에 충분한 여유 공간을 확보하세요.", "설치 파일을 C 드라이브 등 권한 문제가 적은 위치로 옮긴 뒤 다시 실행해 보세요.", "회사/학교 PC라면 그룹 정책으로 설치가 제한된 것은 아닌지 관리자에게 확인하세요."],
      link: "error-code-2503.html",
      detailPage: "error-code-2503.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["2503", "error2503", "오류2503"],
      officialSource: {"title":"Microsoft Learn: Windows Installer error messages","url":"https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages"}
    },
    {
      code: "오류 2502",
      title: "이 설치 패키지를 열 수 없습니다 (오류 2502)",
      overview: "오류 2503과 함께 자주 나타나는 코드로, Windows Installer가 임시 설치 폴더를 초기화하지 못했을 때 발생합니다. 두 오류는 원인과 해결 방법이 거의 동일합니다.",
      summary: "오류 2503과 함께 자주 나타나는 코드로, Windows Installer가 임시 설치 폴더를 초기화하지 못했을 때 발생합니다.",
      causes: ["임시 폴더 권한이나 소유권이 잘못 설정된 경우", "이전 설치 실패로 임시 폴더에 잠긴 파일이 남아있는 경우", "사용자 프로필이 손상되었거나 임시 폴더 경로가 유효하지 않은 경우", "보안 소프트웨어가 임시 폴더 접근을 차단하는 경우", "디스크 여유 공간 부족"],
      checks: ["%TEMP% 폴더로 이동해 파일 속성에서 소유자와 권한을 현재 계정으로 재설정하세요.", "임시 폴더 안의 이전 설치 잔여 파일을 정리하세요.", "설치 프로그램을 관리자 권한으로 다시 실행해 보세요.", "보안 프로그램을 임시로 비활성화한 뒤 재시도하세요.", "디스크 여유 공간을 확인하고 부족하면 정리하세요."],
      link: "error-code-2502.html",
      detailPage: "error-code-2502.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["2502", "error2502", "오류2502"],
      officialSource: {"title":"Microsoft Learn: Windows Installer error messages","url":"https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages"}
    },
    {
      code: "오류 0x80070643",
      title: "설치 중 오류가 발생했습니다 (0x80070643)",
      overview: "주로 .NET Framework나 특정 재배포 패키지 설치 도중 나타나는 오류로, 구성 요소 손상이나 이전 설치 실패의 잔여 상태가 원인인 경우가 많습니다.",
      summary: "주로 .NET Framework나 특정 재배포 패키지 설치 도중 나타나는 오류로, 구성 요소 손상이나 이전 설치 실패의 잔여 상태가 원인인 경우가 많습니다.",
      causes: [".NET Framework 구성 요소가 손상된 경우", "이전 설치나 업데이트가 실패한 채로 남아있는 경우", "관련 윈도우 업데이트가 누락된 경우", "레지스트리에 손상된 설치 기록이 남아있는 경우", "디스크 오류로 설치 파일 일부가 손상된 경우"],
      checks: [".NET Framework 복구 도구(마이크로소프트 공식 .NET Framework Repair Tool)를 실행해 보세요.", "Windows Update에서 관련 누락된 업데이트가 있는지 확인하고 설치하세요.", "제어판의 Windows 기능 켜기/끄기에서 .NET Framework를 껐다가 다시 켜 보세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요.", "설치 로그 파일을 확인해 구체적으로 어떤 구성 요소에서 실패했는지 확인하세요."],
      link: "error-code-80070643.html",
      detailPage: "error-code-80070643.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["80070643", "0x80070643"],
      officialSource: {"title":"Microsoft Learn: MSI installation error 1603 (0x643)","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-server/application-management/msi-installation-error-1603"}
    },
    {
      code: "오류 1935",
      title: "어셈블리 구성 요소 설치 중 오류 (오류 1935)",
      overview: "설치 프로그램이 .NET이나 Visual C++ 재배포 패키지 같은 어셈블리 구성 요소를 설치하는 과정에서 실패했을 때 나타나는 오류입니다.",
      summary: "설치 프로그램이 .NET이나 Visual C++ 재배포 패키지 같은 어셈블리 구성 요소를 설치하는 과정에서 실패했을 때 나타나는 오류입니다.",
      causes: ["Visual C++ 재배포 패키지나 .NET Framework가 손상된 경우", "Windows Installer 서비스가 손상된 경우", "시스템 파일 손상으로 구성 요소 등록에 실패하는 경우", "보안 소프트웨어가 구성 요소 설치를 차단하는 경우", "디스크 배드섹터로 파일 일부가 손상된 경우"],
      checks: ["제어판에서 기존 Visual C++ 재배포 패키지를 제거한 뒤 최신 버전을 다시 설치하세요.", ".NET Framework를 복구하거나 재설치해 보세요.", "sfc /scannow와 DISM 복구 명령으로 시스템 파일을 점검하세요.", "보안 프로그램을 임시로 비활성화한 뒤 재시도하세요.", "디스크 상태를 chkdsk로 점검하세요."],
      link: "error-code-1935.html",
      detailPage: "error-code-1935.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["1935", "error1935", "오류1935"],
      officialSource: {"title":"Microsoft Learn: Windows Installer error messages","url":"https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages"}
    },
    {
      code: "오류 0x80070005 (설치)",
      title: "설치 관리자에게 액세스가 거부되었습니다",
      overview: "프로그램 설치나 제거 시 관리자 권한 부족이나 보안 정책으로 접근이 거부될 때 나타나는 오류입니다. 일반 오류 0x80070005와 원인은 비슷하지만 설치 상황에 특화되어 나타납니다.",
      summary: "프로그램 설치나 제거 시 관리자 권한 부족이나 보안 정책으로 접근이 거부될 때 나타나는 오류입니다.",
      causes: ["설치 프로그램을 관리자 권한 없이 실행한 경우", "설치 대상 폴더의 소유권이나 권한이 제한된 경우", "그룹 정책으로 소프트웨어 설치가 제한된 경우", "보안 소프트웨어가 설치 프로그램의 시스템 변경을 차단한 경우", "사용자 계정 컨트롤(UAC) 설정이 지나치게 엄격한 경우"],
      checks: ["설치 파일을 마우스 우클릭 후 '관리자 권한으로 실행'으로 다시 시도하세요.", "설치 대상 폴더(주로 Program Files)의 권한을 확인하세요.", "회사/학교 PC라면 그룹 정책으로 설치가 제한됐는지 확인하세요.", "보안 프로그램을 임시로 비활성화한 뒤 설치를 재시도하세요.", "UAC 설정을 기본값으로 되돌린 뒤 다시 시도해 보세요."],
      link: "error-code-install-access-denied.html",
      detailPage: "error-code-install-access-denied.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["install-access-denied", "설치액세스거부"],
      officialSource: {"title":"Microsoft Learn: System Error Codes — ERROR_ACCESS_DENIED","url":"https://learn.microsoft.com/en-us/windows/win32/debug/system-error-codes--0-499-"}
    },
    {
      code: "오류 1719",
      title: "Windows Installer 서비스를 사용할 수 없습니다 (오류 1719)",
      overview: "프로그램 설치나 제거에 필요한 Windows Installer 서비스 자체에 접근할 수 없을 때 나타나는 오류로, 서비스가 중지됐거나 레지스트리 등록이 손상된 경우 발생합니다.",
      summary: "프로그램 설치나 제거에 필요한 Windows Installer 서비스 자체에 접근할 수 없을 때 나타나는 오류로, 서비스가 중지됐거나 레지스트리 등록이 손상된 경우 발생합니다.",
      causes: ["Windows Installer 서비스가 중지되어 있거나 비활성화된 경우", "msiexec.exe 실행 파일의 레지스트리 등록이 손상된 경우", "그룹 정책으로 Windows Installer 사용이 제한된 경우", "타사 프로그램이 Windows Installer 서비스를 변경한 경우", "시스템 파일 손상으로 서비스가 제대로 초기화되지 않는 경우"],
      checks: ["서비스 관리자(services.msc)에서 Windows Installer 서비스 상태를 확인하고 시작으로 설정하세요.", "명령 프롬프트(관리자)에서 msiexec /unregister 후 msiexec /regserver를 실행해 재등록하세요.", "그룹 정책 편집기에서 Windows Installer 관련 제한 설정이 있는지 확인하세요.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요.", "그래도 해결되지 않으면 시스템 복원 지점을 이용해 이전 상태로 되돌려 보세요."],
      link: "error-code-1719.html",
      detailPage: "error-code-1719.html",
      relatedSymptom: "windows-install-failure.html",
      aliases: ["1719", "error1719", "오류1719"],
      officialSource: {"title":"Microsoft Learn: Windows Installer error messages","url":"https://learn.microsoft.com/en-us/windows/win32/msi/windows-installer-error-messages"}
    },
    {
      code: "0xc0000142",
      title: "응용 프로그램을 정상적으로 시작하지 못했습니다 (0xc0000142)",
      overview: "프로그램이 실행되는 과정에서 필요한 초기화 작업을 완료하지 못했을 때 나타나는 매우 흔한 오류입니다. DLL 충돌이나 손상된 사용자 프로필, 그래픽 드라이버 문제가 대표적인 원인입니다.",
      summary: "프로그램이 실행되는 과정에서 필요한 초기화 작업을 완료하지 못했을 때 나타나는 매우 흔한 오류입니다.",
      causes: ["프로그램이 의존하는 DLL 파일이 손상되었거나 버전이 맞지 않는 경우", "그래픽 드라이버가 오래되었거나 프로그램과 호환되지 않는 경우", "바이러스 백신이 프로그램의 정상적인 초기화 과정을 차단하는 경우", "사용자 프로필이나 임시 폴더에 문제가 있는 경우", "프로그램 설치 파일 자체가 손상된 경우"],
      checks: ["PC를 재부팅한 뒤 프로그램을 다시 실행해 보세요.", "그래픽 드라이버를 제조사 최신 버전으로 업데이트하세요.", "백신 프로그램을 임시로 비활성화한 뒤 재시도해 보세요.", "프로그램을 관리자 권한으로 실행해 보세요.", "문제가 계속되면 프로그램을 완전히 제거한 뒤 재설치해 보세요."],
      link: "error-code-c0000142.html",
      detailPage: "error-code-c0000142.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["c0000142", "0xc0000142"],
      officialSource: {"title":"Microsoft Learn: Application Failed to Initialize (0xc0000142)","url":"https://learn.microsoft.com/en-us/archive/blogs/winsdk/what-is-up-with-the-application-failed-to-initialize-properly-0xc0000142-error"}
    },
    {
      code: "0xc000007b",
      title: "응용 프로그램을 정상적으로 시작하지 못했습니다 (0xc000007b)",
      overview: "32비트와 64비트 구성 요소가 서로 맞지 않을 때 나타나는 대표적인 오류입니다. 게임이나 오래된 프로그램을 실행할 때 특히 자주 나타나며, DLL 파일의 아키텍처 불일치가 핵심 원인입니다.",
      summary: "32비트와 64비트 구성 요소가 서로 맞지 않을 때 나타나는 대표적인 오류입니다.",
      causes: ["32비트용 DLL과 64비트용 프로그램이 섞여 있는 경우", "Visual C++ 재배포 패키지가 누락되었거나 손상된 경우", "DirectX 구성 요소가 오래되었거나 손상된 경우", ".NET Framework가 손상된 경우", "프로그램 설치 파일 자체가 손상되었거나 불완전하게 설치된 경우"],
      checks: ["Visual C++ 재배포 패키지(x86, x64 버전 모두)를 최신 버전으로 재설치하세요.", "DirectX 최종 사용자 런타임을 마이크로소프트 공식 사이트에서 다시 설치하세요.", ".NET Framework를 복구하거나 재설치해 보세요.", "프로그램을 완전히 제거한 뒤 관리자 권한으로 재설치하세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요."],
      link: "error-code-c000007b.html",
      detailPage: "error-code-c000007b.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["c000007b", "0xc000007b"],
      officialSource: {"title":"Microsoft Learn: Diagnosing STATUS_INVALID_IMAGE_FORMAT","url":"https://learn.microsoft.com/en-us/archive/blogs/dsvc/diagnosing-status_invalid_image_format-c000007b-errors"}
    },
    {
      code: "0xc0000005",
      title: "액세스 위반 오류 (0xc0000005)",
      overview: "프로그램이 접근 권한이 없는 메모리 영역에 접근을 시도했을 때 나타나는 오류입니다. 프로그램 버그, 손상된 파일, 메모리 문제, 보안 소프트웨어 충돌 등 다양한 원인이 있습니다.",
      summary: "프로그램이 접근 권한이 없는 메모리 영역에 접근을 시도했을 때 나타나는 오류입니다.",
      causes: ["프로그램 자체의 메모리 접근 버그", "램 모듈이 불안정하거나 손상된 경우", "보안 소프트웨어가 프로그램의 메모리 접근을 잘못 차단하는 경우", "프로그램 설치 파일이나 실행 파일이 손상된 경우", "다른 프로그램과의 DLL 충돌"],
      checks: ["메모리 진단 도구로 램 상태를 점검하세요.", "보안 프로그램을 임시로 비활성화한 뒤 재시도해 보세요.", "프로그램을 완전히 제거한 뒤 최신 버전으로 재설치하세요.", "다른 프로그램을 모두 종료한 상태에서 다시 실행해 DLL 충돌 여부를 확인하세요.", "윈도우와 해당 프로그램을 모두 최신 버전으로 업데이트하세요."],
      link: "error-code-c0000005.html",
      detailPage: "error-code-c0000005.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["c0000005", "0xc0000005"],
      officialSource: {"title":"Microsoft Learn: Access Violation C0000005","url":"https://learn.microsoft.com/en-us/shows/inside/c0000005"}
    },
    {
      code: "MSVCP140.dll 오류",
      title: "MSVCP140.dll이 없어서 프로그램을 시작할 수 없습니다",
      overview: "Visual C++ 재배포 패키지에 포함된 런타임 라이브러리 파일이 없거나 손상되었을 때 나타나는 오류로, 게임이나 여러 프로그램에서 공통으로 요구하는 파일이라 매우 자주 발생합니다.",
      summary: "Visual C++ 재배포 패키지에 포함된 런타임 라이브러리 파일이 없거나 손상되었을 때 나타나는 오류로, 게임이나 여러 프로그램에서 공통으로 요구하는 파일이라 매우 자주 발생합니다.",
      causes: ["Visual C++ 재배포 패키지가 설치되어 있지 않은 경우", "설치된 재배포 패키지가 손상되었거나 버전이 맞지 않는 경우", "다른 프로그램을 제거하는 과정에서 공유 DLL 파일이 함께 삭제된 경우", "인터넷에서 개별적으로 받은 DLL 파일을 잘못된 위치에 넣은 경우", "시스템 파일 손상"],
      checks: ["마이크로소프트 공식 홈페이지에서 Visual C++ 재배포 패키지(x86, x64 모두)를 새로 받아 설치하세요.", "기존에 설치된 재배포 패키지가 있다면 먼저 제거한 뒤 깨끗하게 재설치하세요.", "DLL 파일을 인터넷에서 개별적으로 받아 넣는 방법은 권장하지 않습니다 — 출처가 불분명한 파일은 보안 위험이 있습니다.", "sfc /scannow로 시스템 파일 손상 여부를 점검하세요.", "문제가 되는 프로그램을 재설치해 필요한 구성 요소를 함께 설치하세요."],
      link: "error-code-msvcp140.html",
      detailPage: "error-code-msvcp140.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["msvcp140", "msvcp140dll"],
      officialSource: {"title":"Microsoft Learn: Latest supported Visual C++ Redistributable downloads","url":"https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist"}
    },
    {
      code: "이 앱이 PC에서 실행되지 않습니다",
      title: "이 앱이 사용자의 PC에서 실행되지 않습니다",
      overview: "프로그램의 아키텍처(32비트/64비트)가 현재 시스템과 맞지 않거나, 윈도우 버전 호환성 문제로 실행이 차단될 때 나타나는 메시지입니다.",
      summary: "프로그램의 아키텍처(32비트/64비트)가 현재 시스템과 맞지 않거나, 윈도우 버전 호환성 문제로 실행이 차단될 때 나타나는 메시지입니다.",
      causes: ["32비트 전용 프로그램을 지원하지 않는 환경에서 실행하려는 경우 (드물게)", "프로그램이 요구하는 윈도우 버전보다 낮거나 호환되지 않는 버전을 사용 중인 경우", "다운로드한 설치 파일이 손상되었거나 위조된 경우", "스마트스크린이나 보안 정책이 실행을 차단한 경우", "그룹 정책으로 특정 프로그램 실행이 제한된 경우"],
      checks: ["프로그램 공식 홈페이지에서 시스템 요구 사항(윈도우 버전, 32/64비트)을 확인하세요.", "설치 파일을 다시 받아 무결성을 확인한 뒤 재설치하세요.", "메시지가 뜬 파일을 우클릭 > 속성에서 '차단 해제' 옵션이 있다면 체크하세요.", "윈도우를 최신 버전으로 업데이트한 뒤 다시 시도하세요.", "회사/학교 PC라면 그룹 정책으로 제한된 프로그램인지 확인하세요."],
      link: "error-code-app-cant-run-on-pc.html",
      detailPage: "error-code-app-cant-run-on-pc.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["app-cant-run-on-pc", "이앱이실행되지않습니다"],
      officialSource: {"title":"Microsoft 지원: Make older apps compatible with Windows","url":"https://support.microsoft.com/en-us/windows/make-older-apps-or-programs-compatible-with-the-latest-version-of-windows-783d6dd7-b439-bdb0-0490-54eea0f45938"}
    },
    {
      code: "브라우저 응답 없음",
      title: "브라우저가 응답하지 않습니다",
      overview: "크롬, 엣지 등 브라우저가 멈추거나 '응답 없음' 상태가 되는 증상으로, 확장 프로그램 충돌이나 과도한 탭, 캐시 문제가 흔한 원인입니다.",
      summary: "크롬, 엣지 등 브라우저가 멈추거나 '응답 없음' 상태가 되는 증상으로, 확장 프로그램 충돌이나 과도한 탭, 캐시 문제가 흔한 원인입니다.",
      causes: ["너무 많은 탭이나 확장 프로그램이 동시에 실행되어 메모리를 과도하게 사용하는 경우", "특정 확장 프로그램이 브라우저와 충돌하는 경우", "브라우저 캐시나 프로필 데이터가 손상된 경우", "그래픽 하드웨어 가속 기능이 시스템과 맞지 않는 경우", "특정 웹페이지의 스크립트가 무한 반복되며 리소스를 소모하는 경우"],
      checks: ["작업 관리자에서 브라우저 프로세스를 종료한 뒤 다시 실행해 보세요.", "불필요한 탭과 확장 프로그램을 정리하세요.", "확장 프로그램을 모두 비활성화한 뒤 하나씩 다시 켜서 원인을 찾아보세요.", "브라우저 설정에서 캐시와 방문 기록을 정리해 보세요.", "브라우저 설정에서 하드웨어 가속 기능을 꺼 보고 재현 여부를 확인하세요."],
      link: "error-code-browser-not-responding.html",
      detailPage: "error-code-browser-not-responding.html",
      relatedSymptom: "windows-browser-not-responding.html",
      aliases: ["browser-not-responding", "브라우저응답없음"],
      officialSource: {"title":"Google Chrome 고객센터: Fix Chrome if it crashes","url":"https://support.google.com/chrome/answer/142063"}
    },
    {
      code: "Aw Snap 오류",
      title: "이런! 페이지 로드 중 문제가 발생했습니다 (Aw, Snap!)",
      overview: "크롬 기반 브라우저에서 특정 탭이 크래시하며 나타나는 오류 화면으로, 메모리 부족이나 확장 프로그램, GPU 드라이버 문제가 흔한 원인입니다.",
      summary: "크롬 기반 브라우저에서 특정 탭이 크래시하며 나타나는 오류 화면으로, 메모리 부족이나 확장 프로그램, GPU 드라이버 문제가 흔한 원인입니다.",
      causes: ["시스템 메모리가 부족해 탭 프로세스가 강제 종료된 경우", "특정 확장 프로그램이 페이지와 충돌하는 경우", "그래픽 드라이버가 오래되어 하드웨어 가속 렌더링에 실패하는 경우", "브라우저 프로필이나 캐시가 손상된 경우", "해당 웹페이지 자체의 스크립트 오류나 과도한 리소스 사용"],
      checks: ["다른 탭을 정리해 메모리 여유를 확보한 뒤 새로고침해 보세요.", "확장 프로그램을 모두 끄고 재현되는지 확인하세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요.", "브라우저를 최신 버전으로 업데이트하세요.", "새 프로필(사용자)을 만들어 같은 문제가 재현되는지 확인해 보세요."],
      link: "error-code-aw-snap.html",
      detailPage: "error-code-aw-snap.html",
      relatedSymptom: "windows-browser-not-responding.html",
      aliases: ["aw-snap", "aw스냅"],
      officialSource: {"title":"Google Chrome 고객센터: 페이지 로드 오류","url":"https://support.google.com/chrome/answer/6098869"}
    },
    {
      code: "0xc0000022",
      title: "응용 프로그램을 정상적으로 시작하지 못했습니다 (0xc0000022)",
      overview: "프로그램 실행에 필요한 권한이 거부되어 시작하지 못할 때 나타나는 오류입니다. 보안 정책이나 파일 권한 문제가 주요 원인입니다.",
      summary: "프로그램 실행에 필요한 권한이 거부되어 시작하지 못할 때 나타나는 오류입니다.",
      causes: ["프로그램 실행 파일이나 폴더의 권한이 제한된 경우", "그룹 정책으로 특정 프로그램 실행이 차단된 경우", "보안 소프트웨어가 실행 권한을 차단하는 경우", "사용자 계정 컨트롤(UAC) 설정 문제", "프로그램이 손상되어 필요한 권한 요청 자체가 실패하는 경우"],
      checks: ["프로그램을 관리자 권한으로 실행해 보세요.", "실행 파일이 있는 폴더의 보안 속성에서 현재 계정 권한을 확인하세요.", "보안 프로그램을 임시로 비활성화한 뒤 재시도해 보세요.", "회사/학교 PC라면 그룹 정책으로 제한된 프로그램인지 확인하세요.", "프로그램을 재설치해 권한 관련 파일을 새로 등록하세요."],
      link: "error-code-c0000022.html",
      detailPage: "error-code-c0000022.html",
      relatedSymptom: "windows-app-not-launching.html",
      aliases: ["c0000022", "0xc0000022"],
      officialSource: {"title":"Microsoft Learn: STATUS_ACCESS_DENIED (0xc0000022)","url":"https://learn.microsoft.com/en-us/answers/questions/3997486/failed-to-start-with-the-following-error-0xc000002"}
    },
    {
      code: "뱅가드 오류",
      title: "라이엇 뱅가드(Vanguard) 오류로 게임이 실행되지 않음",
      overview: "발로란트와 리그 오브 레전드가 공용으로 사용하는 안티치트 프로그램 '라이엇 뱅가드'가 정상적으로 시작되지 않아 게임 실행이 막히는 증상입니다. VAN으로 시작하는 오류 코드와 함께 나타나는 경우가 많고, 뱅가드 서비스 자체가 꺼져 있거나 다른 프로그램과 충돌하는 것이 주요 원인입니다.",
      summary: "발로란트와 리그 오브 레전드가 공용으로 사용하는 안티치트 프로그램 '라이엇 뱅가드'가 정상적으로 시작되지 않아 게임 실행이 막히는 증상입니다.",
      causes: ["뱅가드 커널 서비스(vgc)가 실행되지 않은 상태인 경우", "다른 보안 프로그램이나 가상화 소프트웨어가 뱅가드와 충돌하는 경우", "뱅가드 설치가 손상되었거나 최신 버전이 아닌 경우", "PC를 재부팅하지 않고 여러 번 게임을 재시작한 경우", "보안 프로그램이 뱅가드 드라이버 설치 자체를 차단한 경우"],
      checks: ["작업 관리자의 '서비스' 탭에서 vgc 서비스가 '중지됨'으로 표시되어 있는지 확인하고, 중지되어 있다면 마우스 우클릭으로 시작하세요.", "PC를 완전히 재부팅한 뒤 다시 접속을 시도해보세요.", "제어판에서 라이엇 뱅가드를 완전히 제거한 뒤 게임 클라이언트를 다시 실행해 새로 설치되게 하세요.", "타사 보안 프로그램이나 가상화 소프트웨어(VMware, VPN 등)를 임시로 종료한 뒤 재시도하세요.", "그래도 해결되지 않으면 라이엇 공식 지원 페이지의 뱅가드 직접 제거 가이드를 참고하세요."],
      link: "error-code-vanguard-error.html",
      detailPage: "error-code-vanguard-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["vanguard-error", "뱅가드오류", "van오류"],
      communityCases: [{"title": "vgc 서비스 수동 시작으로 해결한 사례", "summary": "발로란트 접속이 갑자기 안 되거나 뱅가드 오류가 반복될 때, 작업 관리자의 서비스 탭에서 'vgc' 서비스가 중지된 상태였던 경우가 많았습니다. 마우스 우클릭으로 서비스를 다시 시작한 뒤 곧바로 정상 접속됐습니다.", "insight": "뱅가드 오류가 났을 때 재설치부터 하기보다, 먼저 vgc 서비스 상태를 확인하는 게 훨씬 빠른 해결책인 경우가 많습니다."}],
      officialSource: {"title":"Riot 지원: VALORANT 오류 코드 및 해결 방법","url":"https://support.riotgames.com/ko/valorant/performance/error-codes-and-solutions-in-valorant"}
    },
    {
      code: "이지 안티치트 오류",
      title: "EasyAntiCheat 오류로 게임 실행 불가 (배틀그라운드 등)",
      overview: "배틀그라운드, 에이펙스 레전드 등 여러 게임이 공용으로 사용하는 EasyAntiCheat(EAC) 서비스가 초기화에 실패하거나 게임 파일과 충돌할 때 나타나는 오류입니다.",
      summary: "배틀그라운드, 에이펙스 레전드 등 여러 게임이 공용으로 사용하는 EasyAntiCheat(EAC) 서비스가 초기화에 실패하거나 게임 파일과 충돌할 때 나타나는 오류입니다.",
      causes: ["EasyAntiCheat 서비스가 설치되지 않았거나 손상된 경우", "게임 파일 일부가 손상되어 EAC 서명 검증에 실패하는 경우", "다른 게임의 안티치트 프로그램과 충돌하는 경우", "Windows가 최신 업데이트 상태가 아닌 경우", "보안 프로그램이 EAC 서비스를 오탐지해 차단하는 경우"],
      checks: ["게임 설치 폴더의 EasyAntiCheat 하위 폴더에서 EasyAntiCheat_Setup.exe를 관리자 권한으로 실행해 복구를 시도하세요.", "게임 런처에서 파일 무결성 검사(파일 확인/복구) 기능을 실행하세요.", "Windows를 최신 버전으로 업데이트하세요.", "다른 안티치트 기반 게임을 모두 종료한 뒤 재시도하세요.", "보안 프로그램의 최근 차단/격리 목록에 EAC 관련 파일이 있는지 확인하세요."],
      link: "error-code-easyanticheat-error.html",
      detailPage: "error-code-easyanticheat-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["easyanticheat-error", "이지안티치트오류", "eac오류"],
      officialSource: {"title":"Easy Anti-Cheat 공식 지원","url":"https://www.easy.ac/support/articles"}
    },
    {
      code: "배틀넷 연결 오류",
      title: "배틀넷 오류로 오버워치 등이 실행되지 않음 (BLZBNTBNA0000)",
      overview: "블리자드 게임(오버워치, 디아블로 등)을 실행할 때 배틀넷 클라이언트가 서버와 연결하지 못해 나타나는 오류입니다. 코드 뒤에 붙는 숫자에 따라 원인이 조금씩 다르지만, 대부분 네트워크나 캐시 문제입니다.",
      summary: "블리자드 게임(오버워치, 디아블로 등)을 실행할 때 배틀넷 클라이언트가 서버와 연결하지 못해 나타나는 오류입니다.",
      causes: ["배틀넷 클라이언트의 캐시 파일이 손상된 경우", "라우터나 방화벽이 배틀넷 서버 연결을 차단하는 경우", "DNS 서버 응답이 불안정한 경우", "VPN이나 프록시가 연결을 방해하는 경우", "일시적인 배틀넷 서버 측 장애"],
      checks: ["배틀넷 클라이언트를 완전히 종료한 뒤 Battle.net 폴더 안의 Cache 폴더를 삭제하고 재시작하세요.", "공유기를 재시작해 네트워크 연결을 초기화하세요.", "DNS 서버를 공용 DNS(8.8.8.8 등)로 바꿔 재현 여부를 확인하세요.", "VPN을 사용 중이라면 임시로 해제한 뒤 재시도하세요.", "블리자드 공식 서버 상태 페이지에서 현재 장애 여부를 확인하세요."],
      link: "error-code-battlenet-error.html",
      detailPage: "error-code-battlenet-error.html",
      relatedSymptom: "windows-game-connection-error.html",
      aliases: ["battlenet-error", "배틀넷오류", "blzbntbna"],
      officialSource: {"title":"블리자드 고객지원: Battle.net 연결 문제 해결","url":"https://kr.battle.net/support/ko/article/99037"}
    },
    {
      code: "로스트아크 실행 오류",
      title: "로스트아크 게임이 실행되지 않거나 튕김",
      overview: "스마일게이트 런처를 통해 로스트아크를 실행할 때 게임이 시작되지 않거나, 로딩 중 강제 종료되는 증상입니다. 런처 캐시 손상이나 그래픽 드라이버 문제가 흔한 원인입니다.",
      summary: "스마일게이트 런처를 통해 로스트아크를 실행할 때 게임이 시작되지 않거나, 로딩 중 강제 종료되는 증상입니다.",
      causes: ["스마일게이트 런처의 캐시나 설정 파일이 손상된 경우", "그래픽 드라이버가 오래되었거나 게임과 호환되지 않는 경우", "게임 파일 일부가 손상된 경우", "백신 프로그램이 게임 실행 파일을 오탐지해 차단하는 경우", "Windows나 DirectX 구성 요소가 오래된 경우"],
      checks: ["런처에서 로그아웃 후 재로그인하거나, 런처를 완전히 재설치해보세요.", "그래픽 드라이버를 제조사 최신 버전으로 업데이트하세요.", "런처의 '치료' 또는 '파일 검사' 기능으로 게임 파일 무결성을 점검하세요.", "백신 프로그램에서 로스트아크 실행 파일이 격리되지 않았는지 확인하세요.", "DirectX 최종 사용자 런타임을 다시 설치해보세요."],
      link: "error-code-lostark-error.html",
      detailPage: "error-code-lostark-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["lostark-error", "로스트아크실행오류"],
      officialSource: {"title":"로스트아크 공식 고객센터","url":"https://lostark.support.onstove.com/hc/ko"}
    },
    {
      code: "메이플스토리 실행 오류",
      title: "메이플스토리가 실행되지 않거나 로그인 후 튕김",
      overview: "넥슨 런처를 통해 메이플스토리를 실행할 때 게임이 켜지지 않거나, 로그인 직후 튕기는 증상입니다. 런처나 게임 파일 손상, 호환성 문제가 흔한 원인입니다.",
      summary: "넥슨 런처를 통해 메이플스토리를 실행할 때 게임이 켜지지 않거나, 로그인 직후 튕기는 증상입니다.",
      causes: ["넥슨 런처 캐시가 손상된 경우", "게임 실행 파일이 최신 패치와 맞지 않는 경우", "호환성 모드나 관리자 권한 설정이 잘못된 경우", "백신/보안 프로그램이 게임 실행을 차단하는 경우", "그래픽 드라이버 호환성 문제"],
      checks: ["넥슨 런처를 완전히 종료한 뒤 다시 실행해보세요.", "게임 실행 파일의 속성에서 호환성 모드나 관리자 권한 설정을 기본값으로 되돌려보세요.", "런처의 파일 복구 기능을 실행하세요.", "보안 프로그램의 실시간 검사에서 메이플스토리 관련 파일이 차단되지 않았는지 확인하세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요."],
      link: "error-code-maplestory-error.html",
      detailPage: "error-code-maplestory-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["maplestory-error", "메이플스토리실행오류"],
      officialSource: {"title":"넥슨 에러복구프로그램","url":"https://help.nexon.com/download/restore"}
    },
    {
      code: "리그오브레전드 패치 오류",
      title: "리그 오브 레전드 클라이언트 패치/설치 오류",
      overview: "롤 클라이언트가 업데이트를 받아오지 못하거나, 패치 도중 멈추는 증상입니다. 클라이언트 캐시 손상이나 네트워크 문제가 흔한 원인입니다.",
      summary: "롤 클라이언트가 업데이트를 받아오지 못하거나, 패치 도중 멈추는 증상입니다.",
      causes: ["클라이언트 캐시나 로그 파일이 손상된 경우", "네트워크 연결이 불안정해 패치 파일을 다 받지 못하는 경우", "디스크 여유 공간이 부족한 경우", "보안 프로그램이 패치 프로세스를 방해하는 경우", "이전 패치가 비정상 종료되어 잔여 파일이 충돌하는 경우"],
      checks: ["클라이언트를 완전히 종료한 뒤 재시작해 패치를 다시 시도하세요.", "게임 설치 폴더 안의 Config, Logs 폴더를 정리한 뒤 재시도하세요 (백업 후 진행 권장).", "디스크 여유 공간을 확인하고 부족하면 정리하세요.", "보안 프로그램을 임시로 비활성화한 뒤 재시도하세요.", "그래도 안 되면 클라이언트를 완전히 삭제한 뒤 공식 홈페이지에서 새로 설치하세요."],
      link: "error-code-lol-patch-error.html",
      detailPage: "error-code-lol-patch-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["lol-patch-error", "롤패치오류", "리그오브레전드패치오류"],
      officialSource: {"title":"Riot 지원: League of Legends 패치 문제 해결","url":"https://support.riotgames.com/ko/league-of-legends/client/patching-issues"}
    },
    {
      code: "서든어택 넷프로텍트 오류",
      title: "서든어택 넷프로텍트(보안 프로그램) 오류로 실행 불가",
      overview: "서든어택을 실행할 때 보안 프로그램(넷프로텍트)이 정상적으로 로드되지 않아 게임이 실행되지 않는 증상입니다.",
      summary: "서든어택을 실행할 때 보안 프로그램(넷프로텍트)이 정상적으로 로드되지 않아 게임이 실행되지 않는 증상입니다.",
      causes: ["넷프로텍트 드라이버가 손상되었거나 미설치 상태인 경우", "다른 보안 프로그램과 충돌하는 경우", "Windows 업데이트 이후 호환성이 깨진 경우", "관리자 권한 없이 게임을 실행한 경우", "이전 설치 잔여 파일이 새 설치와 충돌하는 경우"],
      checks: ["게임을 관리자 권한으로 실행해보세요.", "넷프로텍트를 제거한 뒤 게임을 재실행해 새로 설치되게 하세요.", "다른 보안 프로그램(백신 등)을 임시로 비활성화한 뒤 재시도하세요.", "Windows를 최신 버전으로 업데이트하세요.", "게임을 완전히 삭제한 뒤 넥슨 런처를 통해 새로 설치해보세요."],
      link: "error-code-suddenattack-error.html",
      detailPage: "error-code-suddenattack-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["suddenattack-error", "서든어택넷프로텍트오류"],
      officialSource: {"title":"넥슨 서든어택 고객센터","url":"https://cs.nexon.com/helpboard/nexon?gamecode=156"}
    },
    {
      code: "FC 온라인 실행 오류",
      title: "FC 온라인(피파) 게임이 실행되지 않음",
      overview: "넥슨 런처를 통해 FC 온라인을 실행할 때 게임이 켜지지 않거나 로딩 중 멈추는 증상입니다. 런처 캐시나 그래픽 드라이버 호환성 문제가 흔한 원인입니다.",
      summary: "넥슨 런처를 통해 FC 온라인을 실행할 때 게임이 켜지지 않거나 로딩 중 멈추는 증상입니다.",
      causes: ["넥슨 런처 캐시가 손상된 경우", "그래픽 드라이버가 오래되었거나 호환되지 않는 경우", "게임 파일 일부가 손상된 경우", "백신 프로그램이 실행 파일을 차단하는 경우", "해상도나 그래픽 설정이 현재 모니터와 맞지 않는 경우"],
      checks: ["넥슨 런처를 재시작하거나 재설치해보세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요.", "런처의 파일 검사/복구 기능을 실행하세요.", "백신 프로그램의 차단 목록을 확인하세요.", "게임 설정 파일(옵션 관련)을 초기화한 뒤 재시도하세요."],
      link: "error-code-fconline-error.html",
      detailPage: "error-code-fconline-error.html",
      relatedSymptom: "windows-game-launch-error.html",
      aliases: ["fconline-error", "fc온라인실행오류"],
      officialSource: {"title":"넥슨 FC 온라인 고객센터","url":"https://cs.nexon.com/helpboard/nexon?gamecode=329"}
    },
    {
      code: "코드 24",
      title: "이 장치가 존재하지 않거나 작동하지 않거나 모든 드라이버가 설치되어 있지 않습니다 (코드 24)",
      overview: "블루투스 어댑터를 포함한 장치가 제거 대기 상태이거나 드라이버가 제대로 로드되지 않을 때 장치 관리자에 나타나는 코드입니다. 블루투스 장치가 검색 목록에 아예 나타나지 않을 때 자주 함께 보입니다.",
      summary: "블루투스 어댑터를 포함한 장치가 제거 대기 상태이거나 드라이버가 제대로 로드되지 않을 때 장치 관리자에 나타나는 코드입니다. 블루투스 장치가 검색 목록에 아예 나타나지 않을 때 자주 함께 보입니다.",
      causes: ["장치를 방금 제거했거나 제거 대기 중인 경우", "드라이버가 손상되었거나 버전이 맞지 않는 경우", "USB 절전 설정으로 어댑터 전원이 꺼진 경우", "BIOS에서 내장 블루투스가 비활성화된 경우"],
      checks: ["장치를 재부팅한 뒤 장치 관리자에서 다시 검색하세요.", "드라이버를 제거한 뒤 제조사 사이트에서 최신 버전을 재설치하세요.", "USB 허브의 절전 관리 옵션에서 전원 절약을 해제하세요.", "노트북이라면 BIOS/기능 키에서 블루투스가 켜져 있는지 확인하세요."],
      link: "error-code-device-manager-code-24.html",
      detailPage: "error-code-device-manager-code-24.html",
      relatedSymptom: "hardware-bluetooth-not-found.html",
      aliases: ["코드24", "device-manager-code-24"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "코드 45",
      title: "이 하드웨어 장치가 현재 연결되어 있지 않습니다 (코드 45)",
      overview: "이전에 연결했던 블루투스 장치가 현재 시스템에 연결되어 있지 않을 때 나타나는 코드입니다. 장치 자체보다 드라이버가 이전 연결 기록만 남긴 상태인 경우가 많습니다.",
      summary: "이전에 연결했던 블루투스 장치가 현재 시스템에 연결되어 있지 않을 때 나타나는 코드입니다. 장치 자체보다 드라이버가 이전 연결 기록만 남긴 상태인 경우가 많습니다.",
      causes: ["장치가 물리적으로 분리되었거나 페어링이 해제된 경우", "드라이버 잔여 항목이 남아 있는 경우", "다른 USB 포트로 옮긴 뒤 이전 항목이 남는 경우"],
      checks: ["장치 관리자에서 숨겨진 장치 표시를 켜고 이전 항목을 제거하세요.", "블루투스 장치를 페어링 목록에서 삭제한 뒤 다시 등록하세요.", "블루투스 어댑터 드라이버를 재설치하세요."],
      link: "error-code-device-manager-code-45.html",
      detailPage: "error-code-device-manager-code-45.html",
      relatedSymptom: "hardware-bluetooth-not-found.html",
      aliases: ["코드45", "device-manager-code-45"],
      officialSource: {"title":"Microsoft 지원: Device Manager error codes","url":"https://support.microsoft.com/en-us/windows/hardware/drivers/error-codes-in-device-manager-in-windows"}
    },
    {
      code: "탐색기 시작 실패 (검은 화면)",
      title: "로그인 후 탐색기(Explorer.exe)가 시작되지 않아 검은 화면만 나옴",
      overview: "로그인은 정상적으로 되지만 바탕화면과 작업표시줄을 그리는 explorer.exe 프로세스가 시작되지 않아 검은 화면 상태로 멈추는 증상입니다. 그래픽 드라이버보다 셸 프로세스 자체의 문제인 경우가 많습니다.",
      summary: "로그인은 정상적으로 되지만 바탕화면과 작업표시줄을 그리는 explorer.exe 프로세스가 시작되지 않아 검은 화면 상태로 멈추는 증상입니다. 그래픽 드라이버보다 셸 프로세스 자체의 문제인 경우가 많습니다.",
      causes: ["explorer.exe 실행 파일이나 관련 설정이 손상된 경우", "최근 설치한 프로그램이 시작 프로그램에서 셸과 충돌하는 경우", "디스플레이 드라이버 초기화가 지연되는 경우", "사용자 프로필이 손상된 경우"],
      checks: ["작업 관리자(Ctrl+Shift+Esc)에서 파일 > 새 작업으로 explorer.exe를 직접 실행해보세요.", "안전 모드로 부팅해 같은 증상이 재현되는지 확인하세요.", "그래픽 드라이버를 최신 버전으로 업데이트하세요.", "최근 설치한 프로그램을 안전 모드에서 제거해보세요."],
      link: "error-code-explorer-black-screen.html",
      detailPage: "error-code-explorer-black-screen.html",
      relatedSymptom: "windows-black-screen-after-login.html",
      aliases: ["explorer-black-screen", "로그인후검은화면"],
      officialSource: {"title":"Microsoft Learn: Black screen after sign in","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/shell-experience/scenario-guide-black-screen-after-sign-in"}
    },
    {
      code: "셸 확장 충돌 (작업표시줄 멈춤)",
      title: "셸 확장 프로그램 충돌로 작업표시줄과 시작 메뉴가 멈춤",
      overview: "우클릭 메뉴를 추가하는 압축 프로그램, 클라우드 동기화 도구, 시작 메뉴 커스터마이징 도구 등이 탐색기 셸과 충돌하면 작업표시줄이나 시작 메뉴만 멈추는 증상으로 나타납니다.",
      summary: "우클릭 메뉴를 추가하는 압축 프로그램, 클라우드 동기화 도구, 시작 메뉴 커스터마이징 도구 등이 탐색기 셸과 충돌하면 작업표시줄이나 시작 메뉴만 멈추는 증상으로 나타납니다.",
      causes: ["최근 설치한 셸 확장(우클릭 메뉴 추가 프로그램)이 충돌하는 경우", "시작 메뉴/작업표시줄을 변경하는 서드파티 도구와의 충돌", "탐색기 캐시나 아이콘 캐시가 손상된 경우"],
      checks: ["최근 설치한 프로그램(압축, 클라우드 동기화, 꾸미기 도구)을 하나씩 제거해보세요.", "작업 관리자에서 탐색기(Windows 탐색기)를 다시 시작해보세요.", "아이콘 캐시를 삭제한 뒤 재부팅하세요.", "ShellExView 같은 도구로 서드파티 셸 확장을 확인하고 비활성화해보세요."],
      link: "error-code-shell-extension-conflict.html",
      detailPage: "error-code-shell-extension-conflict.html",
      relatedSymptom: "windows-taskbar-freeze.html",
      aliases: ["shell-extension-conflict", "작업표시줄멈춤"],
      officialSource: {"title":"Microsoft 지원: Explorer shell extension hangs","url":"https://support.microsoft.com/en-us/topic/fix-the-explorer-exe-process-stops-responding-hangs-when-you-use-windows-explorer-that-hosts-a-shell-extension-that-was-created-by-using-mfc-4d8f8a87-94fc-0874-756a-5c6db8023133"}
    },
    {
      code: "TiWorker.exe 디스크 100%",
      title: "Windows 모듈 설치 관리자(TiWorker.exe)로 인한 디스크 사용률 100%",
      overview: "Windows 업데이트를 설치하거나 정리하는 TiWorker.exe 프로세스가 백그라운드에서 디스크 압축·정리 작업을 하면서 디스크 사용률이 100%에 가깝게 오래 유지되는 증상입니다.",
      summary: "Windows 업데이트를 설치하거나 정리하는 TiWorker.exe 프로세스가 백그라운드에서 디스크 압축·정리 작업을 하면서 디스크 사용률이 100%에 가깝게 오래 유지되는 증상입니다.",
      causes: ["대규모 누적 업데이트 설치 후 정리 작업이 진행 중인 경우", "백그라운드 업데이트 정리 작업이 예상보다 오래 걸리는 경우", "디스크(특히 HDD)의 처리 속도가 느린 경우"],
      checks: ["작업 관리자에서 TiWorker.exe의 디스크 사용량과 진행 여부를 확인하세요.", "일반적으로 몇 시간 내 자연히 끝나므로, 강제 종료보다 완료를 기다려보세요.", "디스크 정리 도구로 이전 업데이트 파일을 정리해 보세요.", "반복해서 오래 지속된다면 SFC/DISM으로 시스템 파일 상태를 점검하세요."],
      link: "error-code-tiworker-disk-100.html",
      detailPage: "error-code-tiworker-disk-100.html",
      relatedSymptom: "windows-disk-usage-100.html",
      aliases: ["tiworker-disk-100", "디스크사용률100"],
      officialSource: {"title":"Microsoft Learn: Windows Modules Installer high disk usage","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/superfetch-sysmain-service-spikes-cpu"}
    },
    {
      code: "SysMain 디스크 100%",
      title: "SysMain(Superfetch) 서비스로 인한 디스크 사용률 100%",
      overview: "자주 쓰는 프로그램을 미리 메모리에 올려두는 SysMain(구 Superfetch) 서비스가 특히 HDD 환경에서 디스크를 과도하게 사용해 전체 시스템이 느려지는 증상으로 나타날 수 있습니다.",
      summary: "자주 쓰는 프로그램을 미리 메모리에 올려두는 SysMain(구 Superfetch) 서비스가 특히 HDD 환경에서 디스크를 과도하게 사용해 전체 시스템이 느려지는 증상으로 나타날 수 있습니다.",
      causes: ["HDD에서 SysMain의 예측 캐싱 작업이 디스크에 부담을 주는 경우", "디스크가 이미 조각화되었거나 여유 공간이 부족한 경우", "SSD 환경에서 불필요하게 서비스가 계속 활성화된 경우"],
      checks: ["작업 관리자에서 서비스 호스트 중 SysMain의 디스크 사용량을 확인하세요.", "services.msc에서 SysMain 서비스를 임시로 중지해 증상이 나아지는지 확인하세요.", "SSD를 사용 중이라면 SysMain을 비활성화해도 무방한 경우가 많습니다.", "디스크 조각 모음/최적화를 실행해보세요."],
      link: "error-code-sysmain-disk-100.html",
      detailPage: "error-code-sysmain-disk-100.html",
      relatedSymptom: "windows-disk-usage-100.html",
      aliases: ["sysmain-disk-100", "superfetch디스크100"],
      officialSource: {"title":"Microsoft Learn: SuperFetch (SysMain) service CPU spikes","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/superfetch-sysmain-service-spikes-cpu"}
    },
    {
      code: "네트워크 드라이브 탐색기 멈춤",
      title: "네트워크 드라이브나 공유 폴더 탐색 시 탐색기가 멈춤",
      overview: "탐색기가 네트워크 드라이브나 공유 폴더의 파일 목록, 썸네일을 가져오려다 응답이 없는 서버나 끊긴 연결 때문에 전체 창이 멈추는 증상입니다. 로컬 폴더는 정상인지 먼저 구분하는 것이 중요합니다.",
      summary: "탐색기가 네트워크 드라이브나 공유 폴더의 파일 목록, 썸네일을 가져오려다 응답이 없는 서버나 끊긴 연결 때문에 전체 창이 멈추는 증상입니다. 로컬 폴더는 정상인지 먼저 구분하는 것이 중요합니다.",
      causes: ["연결이 끊긴 네트워크 드라이브가 여전히 매핑되어 있는 경우", "공유 폴더 서버가 응답하지 않는 경우", "썸네일 미리보기 생성이 대용량 폴더에서 지연되는 경우"],
      checks: ["연결이 끊긴 네트워크 드라이브의 연결을 해제해보세요.", "로컬 폴더에서는 탐색기가 정상인지 비교해보세요.", "폴더 옵션에서 '항상 아이콘 표시, 축소판 그림 표시 안 함'을 켜서 재현 여부를 확인하세요.", "공유 폴더가 있는 기기나 NAS의 상태를 점검하세요."],
      link: "error-code-explorer-network-drive-freeze.html",
      detailPage: "error-code-explorer-network-drive-freeze.html",
      relatedSymptom: "windows-explorer-freeze.html",
      aliases: ["explorer-network-drive-freeze", "네트워크드라이브탐색기멈춤"],
      officialSource: {"title":"Microsoft Learn: Applications freeze accessing network drive files","url":"https://learn.microsoft.com/en-us/troubleshoot/windows-client/performance/applications-freeze-concurrently-access-file-network-drive"}
    },
    {
      code: "Windows Audio 서비스 응답 없음",
      title: "Windows Audio 서비스가 중지되거나 응답하지 않아 소리가 나오지 않음",
      overview: "소리 아이콘에 X 표시가 뜨거나 오디오 장치 자체는 정상인데 Windows Audio 서비스가 멈춰 있거나 중지되어 있어 전체 사운드가 나오지 않는 증상입니다. 드라이버 문제와는 원인이 다릅니다.",
      summary: "소리 아이콘에 X 표시가 뜨거나 오디오 장치 자체는 정상인데 Windows Audio 서비스가 멈춰 있거나 중지되어 있어 전체 사운드가 나오지 않는 증상입니다. 드라이버 문제와는 원인이 다릅니다.",
      causes: ["Windows Audio 서비스가 중지되었거나 시작에 실패한 경우", "관련 서비스(Windows Audio Endpoint Builder)가 함께 중지된 경우", "최근 업데이트 이후 서비스 설정이 초기화된 경우"],
      checks: ["services.msc에서 Windows Audio, Windows Audio Endpoint Builder 서비스 상태와 시작 유형을 확인하세요.", "두 서비스를 모두 자동으로 설정하고 시작해보세요.", "오디오 문제 해결사를 실행해보세요.", "그래도 안 되면 재부팅 후 서비스 상태를 다시 확인하세요."],
      link: "error-code-windows-audio-service-stopped.html",
      detailPage: "error-code-windows-audio-service-stopped.html",
      relatedSymptom: "hardware-sound-not-working.html",
      aliases: ["windows-audio-service-stopped", "오디오서비스응답없음"],
      officialSource: {"title":"Microsoft 지원: Fix sound or audio problems in Windows","url":"https://support.microsoft.com/en-us/windows/fix-sound-or-audio-problems-in-windows-73025246-b61c-40fb-671a-2535c7cd56c8"}
    },
    {
      code: "최신 대기 모드 절전 복귀 실패",
      title: "최신 대기 모드(Modern Standby/S0ix)에서 절전 복귀 실패",
      overview: "전통적인 S3 절전 대신 최신 대기 모드(Modern Standby)를 쓰는 노트북에서, 화면을 닫았다 열어도 화면이 켜지지 않거나 배터리가 절전 중에도 빠르게 소모되는 증상입니다. 일반 절전 복귀 실패와 원인 계층이 다릅니다.",
      summary: "전통적인 S3 절전 대신 최신 대기 모드(Modern Standby)를 쓰는 노트북에서, 화면을 닫았다 열어도 화면이 켜지지 않거나 배터리가 절전 중에도 빠르게 소모되는 증상입니다. 일반 절전 복귀 실패와 원인 계층이 다릅니다.",
      causes: ["최신 대기 모드 지원 드라이버(네트워크, 그래픽)가 최신이 아닌 경우", "백그라운드 앱이 절전 중에도 계속 깨어있어 완전한 저전력 상태로 못 들어가는 경우", "제조사의 전원 관리 유틸리티와 Windows 전원 옵션이 충돌하는 경우"],
      checks: ["명령 프롬프트에서 powercfg /a로 최신 대기 모드 지원 여부를 확인하세요.", "powercfg /sleepstudy 보고서로 절전 중 깨어난 원인을 확인하세요.", "네트워크 어댑터와 칩셋 드라이버를 최신 버전으로 업데이트하세요.", "제조사 전원 관리 유틸리티가 최신인지 확인하세요."],
      link: "error-code-modern-standby-resume-fail.html",
      detailPage: "error-code-modern-standby-resume-fail.html",
      relatedSymptom: "windows-sleep-resume-fail.html",
      aliases: ["modern-standby-resume-fail", "최신대기모드절전복귀실패"],
      officialSource: {"title":"Microsoft Learn: Modern Standby","url":"https://learn.microsoft.com/en-us/windows-hardware/design/device-experiences/modern-standby"}
    },
    {
      code: "인쇄 스풀러 서비스 응답 없음",
      title: "인쇄 스풀러(Print Spooler) 서비스가 응답하지 않아 프린터 추가가 멈춤",
      overview: "프린터를 추가하거나 인쇄할 때 내부적으로 동작하는 인쇄 스풀러 서비스가 멈추거나 응답하지 않으면, 프린터 추가 화면이 검색 중 상태로 멈추거나 인쇄 대기열이 쌓이는 증상이 나타납니다.",
      summary: "프린터를 추가하거나 인쇄할 때 내부적으로 동작하는 인쇄 스풀러 서비스가 멈추거나 응답하지 않으면, 프린터 추가 화면이 검색 중 상태로 멈추거나 인쇄 대기열이 쌓이는 증상이 나타납니다.",
      causes: ["스풀러 서비스가 중지되었거나 손상된 스풀 파일이 쌓인 경우", "손상된 프린터 드라이버가 스풀러를 함께 멈추게 하는 경우", "대기열에 오래된 인쇄 작업이 남아 있는 경우"],
      checks: ["services.msc에서 Print Spooler 서비스를 재시작해보세요.", "C:\\Windows\\System32\\spool\\PRINTERS 폴더의 대기 파일을 정리한 뒤 서비스를 다시 시작하세요.", "최근 설치한 프린터 드라이버를 제거하고 다시 설치해보세요.", "여러 프린터가 있다면 하나씩 제거하며 어떤 드라이버가 원인인지 좁혀보세요."],
      link: "error-code-print-spooler-not-responding.html",
      detailPage: "error-code-print-spooler-not-responding.html",
      relatedSymptom: "windows-printer-add-freeze.html",
      aliases: ["print-spooler-not-responding", "인쇄스풀러응답없음"],
      officialSource: {"title":"Microsoft 지원: Fix print spooler service not running errors","url":"https://support.microsoft.com/en-us/windows/hardware/printer/fix-print-spooler-service-not-running-errors-in-windows"}
    },
    {
      code: "스팀 서버 연결 실패",
      title: "스팀(Steam)이 서버에 연결하지 못해 로그인이나 상점 접속이 안 됨",
      overview: "스팀 클라이언트가 로그인 중이나 상점 접속 중 서버 연결에 실패하는 증상으로, 스팀 서버 자체 장애이거나 로컬 네트워크·방화벽 설정이 원인인 경우로 나뉩니다.",
      summary: "스팀 클라이언트가 로그인 중이나 상점 접속 중 서버 연결에 실패하는 증상으로, 스팀 서버 자체 장애이거나 로컬 네트워크·방화벽 설정이 원인인 경우로 나뉩니다.",
      causes: ["스팀 서버 측 일시적 장애", "방화벽이나 백신이 스팀 클라이언트 연결을 차단하는 경우", "스팀 설정 파일(ClientRegistry.blob 등)이 손상된 경우", "DNS 응답이 불안정한 경우"],
      checks: ["Steam 공식 서버 상태 페이지에서 장애 여부를 먼저 확인하세요.", "스팀을 완전히 종료한 뒤 관리자 권한으로 재시작해보세요.", "방화벽에서 스팀 클라이언트가 허용되어 있는지 확인하세요.", "공용 DNS(8.8.8.8 등)로 바꿔 재현 여부를 확인하세요."],
      link: "error-code-steam-connection-fail.html",
      detailPage: "error-code-steam-connection-fail.html",
      relatedSymptom: "windows-game-connection-error.html",
      aliases: ["steam-connection-fail", "스팀서버연결실패"],
      officialSource: {"title":"Steam 공식 지원: 네트워크 연결 문제 해결","url":"https://help.steampowered.com/en/faqs/view/669A-2F68-D1D1-A5EC"}
    },
    {
      code: "0x0000002E",
      title: "DATA_BUS_ERROR",
      overview: "시스템 메모리, CPU 캐시, 혹은 시스템 버스에서 패리티(홀짝 검증) 오류가 감지되었을 때 나타나는 코드로, 마이크로소프트 공식 문서에서도 '거의 대부분 하드웨어 문제'로 명시하는 대표적인 물리적 결함형 블루스크린입니다. 램 자체의 불량, CPU L2 캐시 오류, 그래픽카드 VRAM 불량이 3대 주요 원인으로 꼽히며, 드라이버가 존재하지 않는 물리 주소(0x8로 시작하는 주소 영역 등)에 접근을 시도할 때도 동일한 코드가 나타날 수 있습니다. 윈도우 재설치나 드라이버 업데이트 같은 소프트웨어적 조치만으로는 해결되지 않는 경우가 대부분이라, 처음부터 하드웨어 진단을 우선순위에 두는 것이 효율적입니다.",
      summary: "시스템 메모리나 캐시, 버스에서 패리티(데이터 무결성) 오류가 감지되었을 때 나타나는 코드로, 마이크로소프트도 '거의 대부분 하드웨어 문제'로 분류하는 대표적인 물리적 결함형 블루스크린입니다.",
      causes: ["램 모듈 자체가 불량이거나 슬롯 접촉이 불량해 데이터 전송 중 패리티 오류가 발생하는 경우", "메인보드의 L2 캐시나 메모리 컨트롤러가 물리적으로 손상된 경우", "그래픽카드의 비디오 램(VRAM)이 불량하거나 발열로 열화된 경우", "최근 하드웨어를 추가하거나 교체한 뒤 슬롯·핀 접촉이 불완전한 경우", "드라이버가 존재하지 않는 물리 주소 영역에 접근을 시도하는 경우", "메인보드 전원부나 칩셋이 노후화되어 버스 신호 무결성이 떨어지는 경우"],
      checks: ["메모리 진단 도구(mdsched.exe 또는 MemTest86)로 램 상태를 여러 패스에 걸쳐 점검하세요.", "램을 한 개씩 꽂아가며 재부팅해 특정 모듈이나 슬롯에서만 오류가 재현되는지 확인하세요.", "최근 추가하거나 교체한 하드웨어가 있다면 제거한 뒤 재현 여부를 확인하세요.", "그래픽카드를 사용 중이라면 다른 그래픽카드로 교체 테스트해 VRAM 불량 여부를 좁혀보세요.", "이벤트 뷰어나 블루스크린 덤프 파일(*.dmp)에서 오류를 일으킨 모듈 주소를 확인하면 원인 추적 속도를 높일 수 있습니다.", "위 방법으로도 원인이 좁혀지지 않으면 서비스센터나 전문 업체에서 메인보드 자체의 하드웨어 진단을 받아보세요."],
      link: "error-code-0x0000002e.html",
      detailPage: "error-code-0x0000002e.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["2e", "0000002e", "0x2e"],
      communityCases: [{"title": "MemTest86로 불량 램을 찾아 교체해 해결한 사례", "summary": "특별한 이유 없이 DATA_BUS_ERROR 블루스크린이 반복됐던 사례가 있습니다. MemTest86으로 여러 시간에 걸쳐 검사한 결과 램 두 개 중 하나에서만 수백 개의 오류가 발견됐고, 해당 램만 교체한 뒤로는 블루스크린이 완전히 사라졌습니다.", "insight": "DATA_BUS_ERROR는 겉보기엔 원인을 알 수 없는 경우가 많지만, 실제로는 램 한 개만 불량이어도 발생할 수 있습니다. 램을 한꺼번에 테스트하기보다 하나씩 분리해서 여러 패스에 걸쳐 테스트해보는 것이 원인을 찾는 데 효과적입니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x2E DATA_BUS_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x2e--data-bus-error"}
    },
    {
      code: "0x00000080",
      title: "NMI_HARDWARE_FAILURE",
      overview: "NMI(Non-Maskable Interrupt, 무시할 수 없는 인터럽트) 신호가 발생해 시스템이 강제로 정지했을 때 나타나는 코드로, 이름 그대로 하드웨어 자체의 심각한 오류를 의미하는 경우가 대부분입니다. 마이크로소프트 문서에 따르면 복구 불가능한 내부 칩셋 오류, 시스템 메모리의 패리티·ECC 오류, 시스템·주변기기 버스에서 감지된 데이터 손상이 대표적인 트리거로 꼽힙니다. 서버나 워크스테이션급 메인보드는 물리적인 NMI 스위치나 디버그 헤더를 갖춘 경우가 있어, 실수로 눌리거나 접촉되며 같은 코드가 발생하기도 합니다. 다만 일반 데스크톱에서는 램 불량이 압도적으로 흔한 트리거로 보고됩니다.",
      summary: "NMI(무시할 수 없는 인터럽트) 신호가 발생해 시스템이 강제로 정지했을 때 나타나는 코드로, 하드웨어 자체의 심각한 오류를 의미하는 경우가 대부분입니다.",
      causes: ["램이 불량하거나 규격이 맞지 않아 패리티·ECC 오류가 발생하는 경우", "메인보드 칩셋이나 시스템 버스에서 복구 불가능한 내부 오류가 감지된 경우", "PCIe 슬롯이나 확장 카드(그래픽카드, 사운드카드 등)의 접촉 불량", "전원 공급이 불안정해 하드웨어가 순간적으로 오작동하는 경우", "메인보드의 NMI 스위치나 디버그 헤더가 실수로 눌리거나 오작동한 경우(일부 서버·워크스테이션 보드)", "케이스 내부 정전기나 접지 불량으로 순간적인 전기 신호 이상이 발생하는 경우"],
      checks: ["메모리 진단 도구로 램 상태를 점검하고, 가능하면 램을 하나씩 꽂아 테스트하세요.", "모든 확장 카드와 케이블을 재장착해 접촉 불량이 없는지 확인하세요.", "파워 서플라이 용량과 케이블 연결 상태를 점검하세요.", "최근 추가한 하드웨어가 있다면 제거한 뒤 재현 여부를 확인하세요.", "이벤트 뷰어에서 WHEA 관련 오류 로그가 함께 기록되는지 확인해 어떤 하드웨어가 오류를 보고했는지 좁혀보세요.", "메인보드 매뉴얼에서 NMI/디버그 헤더 위치를 확인해 실수로 점퍼나 스위치가 눌린 상태는 아닌지 점검하세요."],
      link: "error-code-0x00000080.html",
      detailPage: "error-code-0x00000080.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["80", "00000080", "0x80"],
      communityCases: [{"title": "MemTest86로 불량 램 슬롯을 특정해 해결한 사례", "summary": "몇 주간 불규칙하게 NMI_HARDWARE_FAILURE 블루스크린이 발생했던 사례가 있습니다. MemTest86을 돌려보니 특정 슬롯에 꽂힌 램에서만 수백 개의 오류가 나왔고, 해당 램을 교체한 뒤로 블루스크린이 완전히 멈췄습니다.", "insight": "많은 NMI 오류가 램이 완전히 고장 나서가 아니라 슬롯 접촉 불량이나 특정 모듈만의 불량 때문에 발생합니다. 우선 램을 재장착해보고, 그래도 반복되면 MemTest86으로 스틱별로 나눠 테스트해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x80 NMI_HARDWARE_FAILURE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x80--nmi-hardware-failure"}
    },
    {
      code: "0x0000007F",
      title: "UNEXPECTED_KERNEL_MODE_TRAP",
      overview: "CPU가 자체적으로 처리할 수 없는 하드웨어 예외(더블 폴트 등)를 만났을 때 나타나는 코드로, 오버클럭으로 인한 CPU 불안정이나 과열, 메인보드 전원부 문제가 대표적인 원인입니다. 소프트웨어 버그보다 프로세서 자체의 물리적 한계나 전력 공급 불안정과 직접 연결되는 경우가 많아, 다른 블루스크린보다 하드웨어 원인일 가능성이 상대적으로 높은 코드로 꼽힙니다. 특히 블루스크린 화면이나 덤프의 첫 번째 매개변수 값이 8(더블 폴트)로 표시된다면 CPU나 메인보드의 물리적 결함을 강하게 시사합니다.",
      summary: "CPU가 처리할 수 없는 하드웨어 예외를 만났을 때 나타나는 코드로, 오버클럭으로 인한 CPU 불안정이나 과열이 대표적인 원인입니다.",
      causes: ["CPU나 램의 오버클럭 설정이 시스템 안정성 한계를 넘은 경우", "CPU 쿨링이 부족해 부하 시 과열로 오작동하는 경우", "메인보드 전원부(VRM)가 CPU에 안정적인 전압을 공급하지 못하는 경우", "CPU 자체의 물리적 결함이나 소켓 핀 접촉 불량", "램 불안정으로 CPU가 잘못된 명령어나 데이터를 처리하게 되는 경우", "메인보드 바이오스가 오래되어 특정 CPU 세대의 전력 관리(C-State 등)를 제대로 지원하지 못하는 경우"],
      checks: ["오버클럭 설정을 모두 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "CPU 온도를 모니터링 프로그램으로 확인하고, 쿨러 장착 상태와 서멀 그리스 상태를 점검하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "CPU를 재장착해 소켓 핀 접촉 상태를 확인하세요(무리한 힘을 주지 않도록 주의).", "가능하다면 다른 메인보드나 CPU로 교차 테스트해 부품 자체의 결함인지 좁혀보세요.", "블루스크린 화면이나 덤프 분석에서 매개변수(Parameter 1)가 8(더블 폴트)로 나온다면 CPU·메인보드 하드웨어 결함 가능성을 우선적으로 의심하세요."],
      link: "error-code-0x0000007f.html",
      detailPage: "error-code-0x0000007f.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["7f", "0000007f", "0x7f"],
      communityCases: [{"title": "새로 추가한 사운드카드의 드라이버 재설치로 해결한 사례", "summary": "사운드카드를 새로 장착한 직후부터 이 블루스크린이 반복됐던 사례가 있습니다. GPU·CPU 온도는 모두 정상 범위였는데, 새로 설치한 사운드카드의 드라이버를 완전히 제거하고 제조사 최신 버전으로 재설치한 뒤 문제가 사라졌습니다.", "insight": "온도가 정상이라도 오버클럭이나 발열만 의심하지 말고, 최근 추가한 하드웨어의 드라이버 자체를 먼저 점검해보는 것이 좋습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x7F UNEXPECTED_KERNEL_MODE_TRAP","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x7f--unexpected-kernel-mode-trap"}
    },
    {
      code: "0x00000101",
      title: "CLOCK_WATCHDOG_TIMEOUT",
      overview: "멀티코어 CPU에서 특정 코어가 정해진 시간 안에 시스템 인터럽트에 응답하지 못했을 때 나타나는 코드입니다. 오버클럭이나 CPU 자체의 불안정, 오래된 바이오스 펌웨어가 흔한 원인으로 꼽힙니다. 이 오류는 실제로 응답하지 않은 코어 번호가 매개변수에 함께 기록되므로, 이벤트 뷰어나 덤프 분석 시 어떤 코어가 문제였는지 특정할 수 있다는 점이 다른 CPU 관련 블루스크린과의 차이점입니다.",
      summary: "멀티코어 CPU에서 특정 코어가 정해진 시간 안에 시스템 인터럽트에 응답하지 못했을 때 나타나는 코드입니다.",
      causes: ["CPU 오버클럭 설정이 특정 코어에서만 불안정을 일으키는 경우", "CPU 쿨링 부족으로 특정 코어가 스로틀링되며 응답이 지연되는 경우", "바이오스/UEFI 펌웨어가 오래되어 최신 CPU 전원 관리를 제대로 지원하지 못하는 경우", "CPU 자체의 코어 결함이나 물리적 손상", "전원 관리 관련 드라이버나 칩셋 드라이버가 오래된 경우", "CPU 소켓 자체의 물리적 결함으로 특정 코어에만 전력·신호가 불안정하게 공급되는 경우"],
      checks: ["오버클럭 설정을 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "메인보드 제조사 홈페이지에서 최신 바이오스/UEFI 펌웨어로 업데이트하세요.", "CPU 온도와 쿨러 장착 상태를 점검하세요.", "칩셋 드라이버와 전원 관리 드라이버를 최신 버전으로 업데이트하세요.", "CPU 부하 테스트 도구(예: Prime95, Cinebench)로 특정 코어에서만 오류가 나는지 확인해 하드웨어 결함 여부를 좁혀보세요.", "가능하다면 BIOS에서 문제 코어만 비활성화(코어 분리)해 재현되는지 테스트하면 하드웨어 결함 코어를 특정하는 데 도움이 됩니다."],
      link: "error-code-0x00000101.html",
      detailPage: "error-code-0x00000101.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["101", "00000101", "0x101"],
      communityCases: [{"title": "CPU 언더볼팅으로 해결한 사례", "summary": "새로 조립한 PC에서 부하가 걸릴 때마다 CLOCK_WATCHDOG_TIMEOUT 블루스크린이 발생했던 사례가 있습니다. CPU에 순간적으로 전압이 부족해지는 것이 원인으로 지목됐고, 오버클럭을 기본값으로 초기화해도 재발해 CPU 코어 전압을 소폭 낮추는(언더볼팅) 방식으로 안정화한 뒤 재발하지 않았습니다.", "insight": "이 오류는 전압이 '높아서'가 아니라 특정 부하 상황에서 순간적으로 전압이 부족해질 때도 발생할 수 있습니다. 오버클럭 초기화로 해결되지 않는다면 전압 관련 BIOS 설정과 파워서플라이 상태까지 점검해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x101 CLOCK_WATCHDOG_TIMEOUT","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x101---clock-watchdog-timeout"}
    },
    {
      code: "0x0000012B",
      title: "FAULTY_HARDWARE_CORRUPTED_PAGE",
      overview: "윈도우 메모리 관리자가 하드웨어에 의해 손상된 메모리 페이지를 발견했을 때 나타나는 코드로, WHEA_UNCORRECTABLE_ERROR(0x124)와 마찬가지로 하드웨어 자체의 결함을 직접 가리키는 블루스크린입니다. 마이크로소프트 문서에 따르면 매개변수 3, 4가 모두 0이면 메모리 관리자가 0으로 채워져 있어야 할 페이지에서 단일 비트 오류를 발견한 경우이고, 두 값이 0이 아니면 압축 저장소 관리자가 물리 메모리 손상으로 페이지 압축 해제에 실패한 경우입니다. 대부분 램의 단일 비트 오류나 드라이버의 잘못된 DMA(직접 메모리 접근) 동작이 원인입니다.",
      summary: "윈도우 메모리 관리자가 하드웨어에 의해 손상된 메모리 페이지를 발견했을 때 나타나는 코드로, 램의 단일 비트 오류가 흔한 원인입니다.",
      causes: ["램 모듈에 물리적 결함이 있어 특정 비트가 손상되는 경우", "드라이버나 장치가 DMA(직접 메모리 접근)를 잘못 수행해 물리 메모리를 손상시키는 경우", "메인보드나 장치 펌웨어가 전원 전환 과정에서 메모리를 잘못 덮어쓰는 경우", "램 오버클럭(XMP/EXPO)이 안정성 한계를 넘은 경우", "오래된 램이나 서로 다른 규격의 램을 혼용해 타이밍이 불안정한 경우", "바이러스 백신이나 보안 소프트웨어가 메모리를 스캔하는 과정에서 손상된 페이지를 건드려 블루스크린으로 이어지는 경우"],
      checks: ["메모리 진단 도구(mdsched.exe 또는 MemTest86)로 여러 패스에 걸쳐 램 상태를 점검하세요.", "BIOS에서 XMP/EXPO나 오버클럭 설정을 해제하고 기본 클럭으로 되돌린 뒤 재현 여부를 확인하세요.", "램을 한 개씩 꽂아가며 재부팅해 특정 모듈이 원인인지 확인하세요.", "최근 설치하거나 업데이트한 드라이버(특히 저장장치, 그래픽, 네트워크)를 점검하세요.", "이벤트 뷰어에서 WHEA-Logger 관련 이벤트를 확인해 어떤 하드웨어가 오류를 보고했는지 좁혀보세요.", "덤프 분석 시 매개변수 3·4가 0인지 아닌지 확인하면 단순 램 불량인지, 장치의 DMA 오작동인지 원인 범위를 좁힐 수 있습니다."],
      link: "error-code-0x0000012b.html",
      detailPage: "error-code-0x0000012b.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["12b", "0000012b", "0x12b"],
      communityCases: [{"title": "램 증설로 해결한 사례", "summary": "게임 중 이 블루스크린이 반복됐던 사례에서, 램 진단 도구로는 특별한 이상이 발견되지 않았습니다. 당시 시스템 램이 게임 실행 중 거의 소진되는 상태였는데, 램을 추가로 증설한 뒤 더 이상 블루스크린이 발생하지 않았습니다.", "insight": "이 오류는 램 불량뿐 아니라 메모리 부족 상황에서 페이지 처리 과정의 문제로도 발생할 수 있습니다. 램 진단이 정상으로 나온다면 메모리 사용량과 여유 공간도 함께 확인해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x12B FAULTY_HARDWARE_CORRUPTED_PAGE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x12b---faulty-hardware-corrupted-page"}
    },
    {
      code: "0x000000F2",
      title: "HARDWARE_INTERRUPT_STORM",
      overview: "특정 하드웨어 장치가 인터럽트 신호를 계속 활성 상태로 유지해 시스템이 다른 작업을 처리하지 못하고 멈춰버렸을 때 나타나는 코드입니다. 마이크로소프트 정의상 레벨 트리거 인터럽트 신호가 계속 활성(asserted) 상태로 유지되는 상황을 뜻하며, 시스템이 이를 치명적으로 판단해 즉시 하드 행(bus lock) 처리하는 것이 특징입니다. 장치나 슬롯의 하드웨어 결함, 혹은 두 장치 간 IRQ 충돌이 흔한 원인으로 꼽힙니다.",
      summary: "특정 하드웨어 장치가 인터럽트 신호를 계속 활성 상태로 유지해 시스템이 멈춰버렸을 때 나타나는 코드입니다.",
      causes: ["특정 확장 카드나 주변장치가 인터럽트 신호를 계속 보내는 하드웨어 결함이 있는 경우", "두 개 이상의 장치가 같은 IRQ 리소스를 두고 충돌하는 경우", "PCIe 슬롯이나 카드 접촉 불량으로 신호가 불안정하게 유지되는 경우", "오래되었거나 손상된 장치 드라이버가 인터럽트를 잘못 처리하는 경우", "메인보드 자체의 인터럽트 컨트롤러 결함", "BIOS의 레거시 인터럽트 라우팅 설정이 최신 하드웨어와 맞지 않는 경우"],
      checks: ["최근 추가하거나 교체한 확장 카드·주변장치가 있다면 하나씩 제거해 재현 여부를 확인하세요.", "장치 관리자에서 리소스(IRQ) 충돌이 있는지 확인하세요.", "모든 카드와 케이블을 재장착해 접촉 상태를 점검하세요.", "의심되는 장치의 드라이버를 최신 버전으로 업데이트하거나 재설치하세요.", "원인이 좁혀지지 않으면 확장 카드를 다른 슬롯으로 옮겨 재현 여부를 확인하세요.", "BIOS/UEFI를 최신 버전으로 업데이트해 인터럽트 라우팅 관련 알려진 버그가 수정되었는지 확인하세요."],
      link: "error-code-0x000000f2.html",
      detailPage: "error-code-0x000000f2.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["f2", "000000f2", "0xf2"],
      communityCases: [{"title": "보조 하드디스크 캐디 분리로 해결한 사례", "summary": "두 번째 하드디스크를 캐디에 장착해 추가한 직후부터 이 블루스크린이 반복됐던 사례가 있습니다. 캐디의 특정 핀이 광학 드라이브 상태를 계속 BIOS에 알리는 신호를 보내면서 인터럽트가 끊이지 않고 발생한 것이 원인이었고, 캐디를 분리한 뒤 문제가 사라졌습니다.", "insight": "최근 추가한 저장장치나 확장 카드가 있다면, 드라이버 문제보다 하드웨어 자체가 인터럽트 신호를 계속 보내고 있는 것은 아닌지 의심해볼 필요가 있습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xF2 HARDWARE_INTERRUPT_STORM","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xf2--hardware-interrupt-storm"}
    },
    {
      code: "0x00000117",
      title: "VIDEO_TDR_TIMEOUT_DETECTED",
      overview: "그래픽 드라이버가 GPU 응답을 기다리다 시간 초과(TDR)로 복구를 시도했지만 완전히 회복하지 못했을 때 나타나는 코드로, 0x116(VIDEO_TDR_FAILURE)과 원인이 유사한 GPU 관련 블루스크린입니다. 0x116과 달리 이 코드는 TDR(Timeout Detection and Recovery) 복구 절차 자체가 시간 초과로 실패했음을 명시적으로 가리켜, 드라이버 재시작으로도 GPU가 응답을 회복하지 못했다는 더 심각한 신호로 해석됩니다. 그래픽카드 과열이나 전원 불안정, 오버클럭이 흔한 원인입니다.",
      summary: "그래픽 드라이버가 GPU 응답을 기다리다 시간 초과(TDR)로 복구를 시도했지만 완전히 회복하지 못했을 때 나타나는 코드입니다.",
      causes: ["GPU가 고부하 상황에서 과도하게 발열되는 경우", "그래픽카드 보조 전원 케이블 연결이 불안정한 경우", "GPU나 VRAM 오버클럭 설정이 안정성 한계를 넘은 경우", "그래픽 드라이버 자체의 버그나 특정 게임·프로그램과의 호환성 문제", "그래픽카드가 물리적으로 노후화되어 열화된 경우", "레지스트리의 TDR 관련 타임아웃 값(TdrDelay 등)이 너무 짧게 설정되어 정상적인 고부하 작업까지 시간 초과로 처리되는 경우"],
      checks: ["그래픽 드라이버를 DDU 같은 클린 제거 도구로 완전히 제거한 뒤 최신 버전으로 재설치하세요.", "GPU 온도를 모니터링 프로그램으로 확인하고, 쿨러와 서멀 패드 상태를 점검하세요.", "그래픽카드 보조 전원 케이블이 완전히 꽂혀 있는지 확인하세요.", "GPU나 VRAM을 오버클럭했다면 기본 클럭으로 되돌려 재현 여부를 확인하세요.", "가능하다면 다른 그래픽카드로 교체 테스트해 하드웨어 자체의 결함인지 좁혀보세요.", "고사양 렌더링·딥러닝 작업이 잦다면 레지스트리의 TdrDelay 값을 신중하게 늘려 정상 작업이 시간 초과로 오인되지 않는지 확인해보세요(변경 전 백업 필수)."],
      link: "error-code-0x00000117.html",
      detailPage: "error-code-0x00000117.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["117", "00000117", "0x117"],
      communityCases: [{"title": "그래픽 드라이버 클린 재설치로 해결한 사례", "summary": "고사양 게임 실행 중 이 블루스크린이 반복됐던 사례가 있습니다. GPU 온도와 전원 케이블 연결에는 문제가 없었는데, 그래픽 드라이버를 DDU로 완전히 제거한 뒤 최신 버전으로 재설치하자 더 이상 재현되지 않았습니다.", "insight": "TDR 관련 블루스크린은 하드웨어보다 드라이버 자체의 잔여 파일이나 손상이 원인인 경우도 많습니다. 온도·전원에 문제가 없다면 드라이버 클린 재설치를 먼저 시도해보는 것이 좋습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x117 VIDEO_TDR_TIMEOUT_DETECTED","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x117---video-tdr-timeout-detected"}
    },
    {
      code: "0x00000079",
      title: "MISMATCHED_HAL",
      overview: "윈도우가 사용하는 HAL(하드웨어 추상화 계층)과 커널의 버전이나 구성이 서로 일치하지 않을 때 나타나는 코드로, 메인보드나 CPU를 교체한 직후 부팅 과정에서 자주 발생합니다. 마이크로소프트 문서에서는 이 코드가 싱글 프로세서용 HAL과 멀티프로세서 커널의 조합, 혹은 그 반대인 경우를 명시적으로 언급하고 있어, 하드웨어 구성 변경 이력이 있는 시스템에서 특히 주의 깊게 살펴봐야 할 코드입니다. 대부분 시스템 파일 손상보다는 하드웨어 구성 변경과 직접 관련이 있습니다.",
      summary: "윈도우가 사용하는 HAL과 커널의 버전이나 구성이 일치하지 않을 때 나타나는 코드로, 메인보드나 CPU를 교체한 직후 자주 발생합니다.",
      causes: ["메인보드나 CPU를 교체한 뒤 기존 윈도우 설치와 새 하드웨어 구성이 맞지 않는 경우", "싱글 프로세서용 HAL이 설치된 시스템에 멀티프로세서 CPU를 장착한 경우(또는 그 반대)", "Ntoskrnl.exe나 Hal.dll 파일을 수동으로 교체하거나 손상시킨 경우", "부팅 구성 데이터(BCD)가 새 하드웨어 구성을 반영하지 못한 경우", "바이오스/UEFI 설정에서 CPU 관련 모드가 최근 변경된 경우", "클론(복제)된 디스크를 사양이 다른 PC로 옮겨 설치한 경우"],
      checks: ["최근 메인보드나 CPU를 교체했다면, 가능하면 이전 하드웨어로 정상 부팅되는지 먼저 확인하세요.", "복구 환경에서 sfc /scannow로 시스템 파일 손상 여부를 점검하세요.", "BIOS/UEFI 설정에서 CPU 관련 옵션이 최근 변경되었는지 확인하고 기본값으로 되돌려 보세요.", "복구로 해결되지 않으면 새 하드웨어에 맞춰 윈도우를 재설치하는 것을 고려하세요.", "윈도우 재설치 전 중요한 데이터는 반드시 백업해 두세요.", "클론(복제)된 디스크를 사용 중이라면, 클론이 아닌 새 설치로 전환하는 것이 근본적인 해결책이 될 수 있습니다."],
      link: "error-code-0x00000079.html",
      detailPage: "error-code-0x00000079.html",
      relatedSymptom: "hardware-no-display.html",
      aliases: ["79", "00000079", "0x79"],
      communityCases: [{"title": "메인보드 교체 후 재설치로 해결한 사례", "summary": "메인보드를 새 제품으로 교체한 뒤 이전 윈도우가 설치된 디스크를 그대로 연결했더니 이 블루스크린이 발생했던 사례가 있습니다. 복구 환경에서 시스템 파일 복구를 시도해도 해결되지 않았고, 결국 새 하드웨어에 맞춰 윈도우를 새로 설치한 뒤에야 정상적으로 부팅됐습니다.", "insight": "메인보드나 CPU를 완전히 교체한 경우, 기존 설치를 복구하려 하기보다 처음부터 새로 설치하는 편이 더 빠르고 확실한 해결책이 될 수 있습니다."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x79 MISMATCHED_HAL","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x79--mismatched-hal"}
    },
    {
      code: "0x000000FE",
      title: "BUGCODE_USB_DRIVER",
      overview: "USB 드라이버나 연결된 USB 장치에서 처리할 수 없는 오류가 발생했을 때 나타나는 코드입니다. 마이크로소프트 드라이버 문서 기준으로도 USB 컨트롤러 자체의 결함, 손상된 드라이버, 연결 장치의 하드웨어 결함 세 가지로 원인을 나누고 있어, 장치·포트·드라이버를 순서대로 소거하며 점검하는 접근이 효율적입니다. 장치 자체의 하드웨어 결함이나 USB 컨트롤러의 불안정이 흔한 원인으로 꼽힙니다.",
      summary: "USB 드라이버나 연결된 USB 장치에서 처리할 수 없는 오류가 발생했을 때 나타나는 코드로, 장치 자체의 하드웨어 결함이 흔한 원인입니다.",
      causes: ["연결된 USB 장치(외장하드, 키보드, 허브 등) 자체에 하드웨어 결함이 있는 경우", "USB 포트나 컨트롤러가 물리적으로 손상되었거나 접촉 불량인 경우", "USB 드라이버가 손상되었거나 최신 윈도우 빌드와 호환되지 않는 경우", "여러 USB 장치를 허브에 과도하게 연결해 전력 공급이 불안정한 경우", "메인보드 칩셋 드라이버가 오래되어 USB 컨트롤러 동작이 불안정한 경우", "정전기(ESD)로 인해 USB 컨트롤러 칩이 손상된 경우"],
      checks: ["연결된 모든 USB 장치를 분리한 뒤 하나씩 다시 연결해 어떤 장치가 원인인지 좁혀보세요.", "USB 장치를 다른 포트(가능하면 메인보드 후면 포트)에 연결해 재현 여부를 확인하세요.", "장치 관리자에서 USB 컨트롤러 드라이버를 최신 버전으로 업데이트하세요.", "메인보드 칩셋 드라이버를 제조사 홈페이지에서 최신 버전으로 업데이트하세요.", "USB 허브를 사용 중이라면 허브 없이 메인보드에 직접 연결해 전력 공급 문제인지 확인하세요.", "정전기 방지 조치 없이 USB 장치를 자주 탈부착했다면, 컨트롤러 손상 가능성을 염두에 두고 다른 시스템에서도 같은 장치가 오작동하는지 교차 확인하세요."],
      link: "error-code-0x000000fe.html",
      detailPage: "error-code-0x000000fe.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["fe", "000000fe", "0xfe"],
      communityCases: [{"title": "USB 선택적 절전 기능 해제로 해결한 사례", "summary": "특정 USB 캡처 장치를 사용할 때마다 이 블루스크린이 반복됐던 사례가 있습니다. 장치와 드라이버를 여러 번 재설치해도 해결되지 않았는데, 전원 옵션에서 'USB 선택적 절전 모드'를 해제한 뒤 문제가 사라졌습니다.", "insight": "USB 관련 블루스크린이 장치를 오래 사용한 뒤에만 발생한다면 절전 관련 설정을, 사용 시작부터 바로 발생한다면 드라이버나 포트 자체를 먼저 의심해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0xFE BUGCODE_USB_DRIVER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0xfe--bugcode-usb-driver"}
    },
    {
      code: "0x0000005C",
      title: "HAL_INITIALIZATION_FAILED",
      overview: "윈도우 부팅이나 절전 모드 복귀 과정에서 HAL(하드웨어 추상화 계층)이 초기화에 실패했을 때 나타나는 코드로, 대부분 하드웨어 자체의 문제나 장치 드라이버 결함과 관련이 있습니다. 특히 절전 모드(Sleep/Hibernate) 복귀 시점에 반복된다면 전원 관리와 관련된 특정 드라이버나 펌웨어의 초기화 실패일 가능성이 높고, 부팅 초기 단계에서 발생한다면 하드웨어 자체의 초기화 실패일 가능성이 더 큽니다.",
      summary: "윈도우 부팅이나 절전 모드 복귀 과정에서 HAL이 초기화에 실패했을 때 나타나는 코드로, 하드웨어 자체의 문제와 관련이 있는 경우가 많습니다.",
      causes: ["메인보드나 CPU 등 핵심 하드웨어가 최근 변경되어 기존 시스템 구성과 맞지 않는 경우", "바이오스/UEFI 펌웨어가 오래되어 최신 하드웨어를 완전히 지원하지 못하는 경우", "특정 드라이버가 절전 모드 복귀 시 초기화에 실패하는 경우", "저장장치나 램의 접촉 불량으로 부팅 초기 단계에서 오류가 발생하는 경우", "전원 공급 불안정으로 하드웨어 초기화가 중간에 중단되는 경우", "펌웨어(UEFI) 보안 부팅(Secure Boot) 설정과 하드웨어 구성이 맞지 않는 경우"],
      checks: ["메인보드 제조사 홈페이지에서 최신 바이오스/UEFI 펌웨어로 업데이트하세요.", "저장장치와 램의 연결 상태를 물리적으로 다시 확인하세요.", "절전 모드 복귀 시에만 발생한다면, 전원 옵션에서 절전 모드 대신 화면 끄기만 사용하도록 임시로 바꿔 재현 여부를 확인하세요.", "최근 변경한 하드웨어가 있다면 이전 상태로 되돌려 재현 여부를 확인하세요.", "파워 서플라이 용량과 케이블 연결 상태를 점검하세요.", "Secure Boot을 일시적으로 비활성화해 재현 여부를 확인해보고, 관련이 있다면 펌웨어 설정을 재구성하거나 업데이트하세요."],
      link: "error-code-0x0000005c.html",
      detailPage: "error-code-0x0000005c.html",
      relatedSymptom: "hardware-no-display.html",
      aliases: ["5c", "0000005c", "0x5c"],
      communityCases: [{"title": "HPET 활성화로 해결한 사례", "summary": "절전 모드에서 복귀할 때마다 이 블루스크린이 반복됐던 사례가 있습니다. 바이오스/UEFI에서 HPET(고정밀 이벤트 타이머) 관련 설정을 확인해 활성화한 뒤로 절전 모드 복귀 시 블루스크린이 더 이상 발생하지 않았습니다.", "insight": "절전 모드 복귀 시에만 반복되는 이 오류는 하드웨어 고장이 아니라 타이머 관련 바이오스 설정 때문인 경우가 있습니다. 하드웨어를 교체하기 전에 바이오스의 전원·타이머 관련 옵션을 먼저 점검해보세요."}],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x5C HAL_INITIALIZATION_FAILED","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x5c--hal-initialization-failed"}
    },
    {
      code: "0x00000154",
      title: "UNEXPECTED_STORE_EXCEPTION",
      overview: "커널 메모리 저장소(Store) 구성 요소가 예기치 않은 예외를 감지했을 때 나타나는 코드로, 저장장치(SSD/NVMe)의 펌웨어나 컨트롤러 드라이버 문제와 관련이 깊습니다. Windows 10/11에서 새로 추가된 비교적 최신 블루스크린 코드로, 0x1E(KMODE_EXCEPTION_NOT_HANDLED)와 함께 나타나는 경우도 있습니다.",
      summary: "커널 메모리 저장소 구성 요소가 예기치 않은 예외를 감지했을 때 나타나는 코드로, 저장장치 펌웨어나 컨트롤러 드라이버 문제와 관련이 깊습니다.",
      causes: ["SSD·NVMe 저장장치의 펌웨어가 오래되었거나 버그가 있는 경우", "저장장치 컨트롤러 드라이버가 손상되었거나 최신 윈도우 빌드와 호환되지 않는 경우", "디스크 배드섹터나 파일 시스템 손상으로 저장소 구성 요소가 잘못된 데이터를 읽는 경우", "저장장치 전원 관리(절전) 설정이 불안정하게 동작하는 경우", "메인보드 칩셋 드라이버가 오래되어 저장장치 통신이 불안정한 경우"],
      checks: ["저장장치 제조사 홈페이지에서 최신 펌웨어가 있는지 확인하고 업데이트하세요.", "저장장치 컨트롤러 드라이버와 메인보드 칩셋 드라이버를 최신 버전으로 업데이트하세요.", "명령 프롬프트에서 chkdsk /f 를 실행해 디스크 오류를 점검하고 수정하세요.", "전원 옵션에서 저장장치 절전(선택적 USB 절전 포함) 설정을 임시로 꺼서 재현 여부를 확인하세요.", "제조사 진단 툴(예: CrystalDiskInfo)로 S.M.A.R.T 상태와 재할당 섹터 수를 확인하세요."],
      link: "error-code-0x00000154.html",
      detailPage: "error-code-0x00000154.html",
      relatedSymptom: "hardware-nvme-delay.html",
      aliases: ["154", "00000154", "0x154"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x154 UNEXPECTED_STORE_EXCEPTION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x154--unexpected-store-exception"}
    },
    {
      code: "0x00000109",
      title: "CRITICAL_STRUCTURE_CORRUPTION",
      overview: "커널이 중요한 커널 코드나 데이터 구조가 변조된 것을 감지했을 때 나타나는 코드입니다. 드라이버가 커널 영역을 잘못 수정했거나, 램 불량으로 메모리 내용이 깨졌거나, 타사 보안 프로그램이 커널을 강제로 수정하려다 발생하는 경우가 흔합니다. Windows 11에서는 VBS(가상화 기반 보안)가 강화되면서 발생 빈도가 이전 OS보다 높아진 코드이기도 합니다.",
      summary: "커널이 중요한 커널 코드나 데이터 구조가 변조된 것을 감지했을 때 나타나는 코드로, 드라이버의 커널 영역 침범이나 메모리 손상이 흔한 원인입니다.",
      causes: ["오작동하는 드라이버가 커널 코드나 데이터 영역을 잘못 수정한 경우", "메인보드 램이 불안정하거나 오버클럭 설정이 시스템 안정성 한계를 넘은 경우", "타사 백신·보안 프로그램이 커널 메모리를 강제로 수정하려다 충돌하는 경우", "Windows 11의 VBS(가상화 기반 보안)·코어 격리 기능과 특정 드라이버가 호환되지 않는 경우", "악성코드가 커널 영역에 침투를 시도한 경우"],
      checks: ["장치 관리자에서 최근 설치·업데이트한 드라이버를 확인하고 이전 버전으로 롤백해 보세요.", "메모리 진단 도구(mdsched.exe 또는 MemTest86)로 램 상태를 점검하세요.", "BIOS에서 XMP나 오버클럭 설정을 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "설정 > 개인 정보 및 보안 > Windows 보안 > 장치 보안에서 코어 격리(메모리 무결성)를 임시로 꺼서 특정 드라이버와의 충돌인지 확인하세요.", "최근 설치한 보안 프로그램을 임시로 비활성화한 뒤 증상이 사라지는지 확인하세요."],
      link: "error-code-0x00000109.html",
      detailPage: "error-code-0x00000109.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["109", "00000109", "0x109"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x109 CRITICAL_STRUCTURE_CORRUPTION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x109---critical-structure-corruption"}
    },
    {
      code: "0x0000009E",
      title: "USER_MODE_HEALTH_MONITOR",
      overview: "csrss.exe처럼 핵심적인 사용자 모드 프로세스를 커널이 주기적으로 감시(헬스 체크)하다가, 해당 프로세스가 정상적으로 응답하지 않는다고 판단했을 때 나타나는 코드입니다. 0xC000021A·0xEF(CRITICAL_PROCESS_DIED)와 증상이 비슷하지만, 프로세스가 완전히 죽은 게 아니라 '응답 없음' 상태로 판정됐다는 차이가 있습니다.",
      summary: "핵심 사용자 모드 프로세스가 정상적으로 응답하지 않는다고 커널이 판단했을 때 나타나는 코드로, CRITICAL_PROCESS_DIED와 증상이 비슷합니다.",
      causes: ["그래픽 드라이버나 로그인 관련 셸 확장이 응답 없음 상태에 빠진 경우", "보안 소프트웨어가 핵심 프로세스의 응답을 지연시키는 경우", "디스크 병목이나 배드섹터로 인해 프로세스가 필요한 리소스를 제때 읽지 못하는 경우", "최근 윈도우 업데이트가 시스템 프로세스와 충돌하는 경우", "맬웨어가 시스템 프로세스 동작을 방해하는 경우"],
      checks: ["안전 모드로 부팅해 정상 동작 여부를 확인하세요. 정상이라면 최근 설치한 드라이버나 프로그램을 의심하세요.", "명령 프롬프트에서 sfc /scannow를 실행해 손상된 시스템 파일을 검사하고 복구합니다.", "디스크 상태 점검 도구로 배드섹터나 응답 지연이 있는지 확인하세요.", "최근 설치한 보안 프로그램을 임시로 비활성화한 뒤 재현 여부를 확인하세요.", "이벤트 뷰어에서 이 코드 발생 직전 어떤 서비스나 프로세스가 관여했는지 확인하세요."],
      link: "error-code-0x0000009e.html",
      detailPage: "error-code-0x0000009e.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["9e", "0000009e", "0x9e"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x9E USER_MODE_HEALTH_MONITOR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x9e--user-mode-health-monitor"}
    },
    {
      code: "0x00000119",
      title: "VIDEO_SCHEDULER_INTERNAL_ERROR",
      overview: "그래픽 드라이버를 관리하는 비디오 스케줄러가 치명적인 오류를 감지했을 때 나타나는 코드로, 0x116(VIDEO_TDR_FAILURE)·0x117(VIDEO_TDR_TIMEOUT_DETECTED)과 함께 GPU 관련 블루스크린의 대표 코드로 꼽힙니다. 그래픽 드라이버가 커널의 잘못되거나 손상된 메모리 주소에 접근하면서 명령 제출에 실패할 때 흔히 발생합니다.",
      summary: "그래픽 드라이버를 관리하는 비디오 스케줄러가 치명적인 오류를 감지했을 때 나타나는 코드로, GPU 드라이버나 하드웨어 문제와 관련이 깊습니다.",
      causes: ["그래픽 드라이버가 오래되었거나 손상된 경우", "그래픽카드가 슬롯에 제대로 장착되지 않았거나 접촉 불량인 경우", "GPU 과열이나 전력 공급 불안정으로 명령 처리가 실패하는 경우", "램 불량으로 그래픽 드라이버가 잘못된 메모리 주소에 접근하는 경우", "그래픽카드나 노트북에 물리적 충격(낙하 등)이 가해진 직후 발생하는 경우"],
      checks: ["그래픽 드라이버를 제조사(NVIDIA/AMD/Intel) 홈페이지에서 완전히 제거(DDU 등) 후 최신 버전으로 재설치하세요.", "그래픽카드가 PCIe 슬롯에 제대로 장착되어 있는지 다시 확인하세요.", "GPU 온도와 팬 동작을 모니터링해 과열 여부를 확인하세요.", "메모리 진단 도구로 램 상태를 점검하세요.", "파워 서플라이 용량과 그래픽카드 보조 전원 케이블 연결 상태를 확인하세요."],
      link: "error-code-0x00000119.html",
      detailPage: "error-code-0x00000119.html",
      relatedSymptom: "hardware-gaming-reboot.html",
      aliases: ["119", "00000119", "0x119"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x119 VIDEO_SCHEDULER_INTERNAL_ERROR","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x119---video-scheduler-internal-error"}
    },
    {
      code: "0x0000013A",
      title: "KERNEL_MODE_HEAP_CORRUPTION",
      overview: "커널 모드 힙 관리자가 메모리 힙의 손상을 감지했을 때 나타나는 코드로, 사용 후 해제(use-after-free)나 버퍼 오버플로 같은 드라이버 결함, 또는 램 자체의 하드웨어 결함이 흔한 원인입니다. 0x139(KERNEL_SECURITY_CHECK_FAILURE)와 마찬가지로 커널 메모리 손상 계열의 블루스크린입니다.",
      summary: "커널 모드 힙 관리자가 메모리 힙의 손상을 감지했을 때 나타나는 코드로, 드라이버의 메모리 오용이나 램 결함이 흔한 원인입니다.",
      causes: ["특정 드라이버가 이미 해제된 메모리를 다시 사용하거나 버퍼 범위를 벗어나 쓰는 경우", "메인보드 램이 불안정하거나 접촉 불량인 경우", "램 오버클럭(XMP)이 시스템 안정성 한계를 넘은 경우", "타사 보안 프로그램이나 튜닝 도구가 커널 메모리를 잘못 다루는 경우", "최근 설치한 드라이버가 최신 윈도우 빌드와 호환되지 않는 경우"],
      checks: ["장치 관리자에서 최근 설치·업데이트한 드라이버를 확인하고 이전 버전으로 롤백해 보세요.", "메모리 진단 도구(mdsched.exe 또는 MemTest86)로 램 상태를 점검하세요.", "BIOS에서 XMP나 오버클럭 설정을 기본값으로 되돌린 뒤 재현 여부를 확인하세요.", "최근 설치한 보안·튜닝 프로그램을 임시로 제거한 뒤 재현 여부를 확인하세요.", "덤프 파일을 BlueScreenView 등으로 열어 어떤 드라이버(.sys)가 함께 표시되는지 확인하세요."],
      link: "error-code-0x0000013a.html",
      detailPage: "error-code-0x0000013a.html",
      relatedSymptom: "windows-bsod-critical-process.html",
      aliases: ["13a", "0000013a", "0x13a"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x13A KERNEL_MODE_HEAP_CORRUPTION","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x13a--kernel-mode-heap-corruption"}
    },
    {
      code: "0x00000144",
      title: "BUGCODE_USB3_DRIVER",
      overview: "USB 3.0(xHCI) 컨트롤러 스택이 USB 클라이언트의 잘못된 동작을 감지했거나, USB 3.0 컨트롤러·펌웨어 자체에 심각한 문제가 발생했을 때 나타나는 코드입니다. USB 3.0으로 연결된 부팅 장치의 하드웨어 결함으로 발생하는 경우도 있습니다.",
      summary: "USB 3.0(xHCI) 컨트롤러 스택에서 심각한 오류가 발생했을 때 나타나는 코드로, USB 3.0 컨트롤러·펌웨어나 연결 장치의 결함과 관련이 깊습니다.",
      causes: ["USB 3.0으로 연결된 장치(외장하드, 허브 등) 자체에 하드웨어 결함이 있는 경우", "메인보드의 USB 3.0(xHCI) 컨트롤러 드라이버가 오래되었거나 손상된 경우", "메인보드·노트북의 USB 관련 BIOS/UEFI 펌웨어가 오래된 경우", "USB 허브에 장치를 과도하게 연결해 전력 공급이 불안정한 경우", "정전기(ESD)로 인해 USB 3.0 컨트롤러 칩이 손상된 경우"],
      checks: ["연결된 모든 USB 3.0 장치를 분리한 뒤 하나씩 다시 연결해 어떤 장치가 원인인지 좁혀보세요.", "메인보드 제조사 홈페이지에서 칩셋·USB 컨트롤러 드라이버와 BIOS/UEFI 펌웨어를 최신 버전으로 업데이트하세요.", "장치를 USB 2.0 포트에 연결했을 때도 같은 문제가 재현되는지 확인해 USB 3.0 컨트롤러 자체의 문제인지 좁혀보세요.", "USB 허브를 사용 중이라면 허브 없이 메인보드에 직접 연결해 전력 공급 문제인지 확인하세요.", "문제가 특정 USB 부팅 장치에서만 발생한다면 해당 장치를 다른 시스템에서도 테스트해 장치 자체의 결함인지 확인하세요."],
      link: "error-code-0x00000144.html",
      detailPage: "error-code-0x00000144.html",
      relatedSymptom: "hardware-usb-not-detected.html",
      aliases: ["144", "00000144", "0x144"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x144 BUGCODE_USB3_DRIVER","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x144--bugcode-usb3-driver"}
    },
    {
      code: "0x00000164",
      title: "WIN32K_CRITICAL_FAILURE",
      overview: "화면 표시와 입력을 담당하는 Win32k(윈도우 관리·그래픽 서브시스템)가 치명적인 오류를 만났을 때 나타나는 코드입니다. 그래픽 드라이버 결함이나 디스플레이 관련 시스템 파일 손상과 관련이 깊고, 로그인 직후나 화면 전환 시점에 반복되며 부팅 루프로 이어지는 경우도 보고됩니다.",
      summary: "화면 표시와 입력을 담당하는 Win32k 서브시스템이 치명적인 오류를 만났을 때 나타나는 코드로, 그래픽 드라이버 결함이 흔한 원인입니다.",
      causes: ["그래픽 드라이버가 손상되었거나 최신 윈도우 빌드와 호환되지 않는 경우", "디스플레이·윈도우 관리 관련 시스템 파일이 손상된 경우", "다중 모니터 구성이나 배율(스케일링) 설정 변경 직후 발생하는 경우", "최근 윈도우 업데이트가 그래픽 서브시스템과 충돌하는 경우", "원격 데스크톱이나 화면 녹화 소프트웨어의 가상 디스플레이 드라이버 충돌"],
      checks: ["그래픽 드라이버를 제조사 홈페이지에서 완전히 제거(DDU 등) 후 최신 버전으로 재설치하세요.", "명령 프롬프트에서 sfc /scannow를 실행해 손상된 시스템 파일을 검사하고 복구합니다.", "안전 모드로 부팅이 되는지 확인하세요. 안전 모드에서 정상이라면 그래픽 드라이버나 최근 설치한 프로그램을 의심하세요.", "다중 모니터나 화면 배율 설정을 최근에 바꿨다면 이전 설정으로 되돌려 재현 여부를 확인하세요.", "부팅 루프가 발생한다면 복구 환경(고급 옵션)에서 최근 업데이트 제거를 시도하세요."],
      link: "error-code-0x00000164.html",
      detailPage: "error-code-0x00000164.html",
      relatedSymptom: "windows-black-screen-after-login.html",
      aliases: ["164", "00000164", "0x164"],
      officialSource: {"title":"Microsoft Learn: Bug Check 0x164 WIN32K_CRITICAL_FAILURE","url":"https://learn.microsoft.com/en-us/windows-hardware/drivers/debugger/bug-check-0x164--win32k-critical-failure"}
    }
  ],
  symptoms: [
    {
      id: "auto-repair",
      title: "자동 복구 루프",
      overview: "부팅할 때 윈도우 로고 대신 \"자동 복구를 준비하는 중\" 화면이 뜬 채로 무한로딩에 걸리거나, 복구를 시도한 뒤 다시 같은 화면으로 돌아오는 것을 반복하는 증상입니다. 부팅에 필요한 파일이나 설정이 손상되어 윈도우가 정상 부팅과 복구 시도를 계속 오가는 상태로 보면 됩니다. 업데이트 직후나 비정상 종료 직후에 특히 자주 발생합니다.",
      summary: "부팅 시 \"자동 복구를 준비하는 중\" 화면에서 무한로딩에 걸리거나 복구 화면으로 계속 돌아오는 경우",
      keywords: ["부팅 안됨", "복구 화면", "자동복구", "부팅 루프", "재부팅 반복", "무한로딩", "자동복구 준비중 멈춤", "복구화면 반복", "바이오스 로그 화면이후 진입불가", "바이오스 이후 윈도우 안됨"],
      causes: [
        "부팅에 필요한 시스템 파일(BCD, 부트 섹터 등)이 손상되었거나 누락된 경우",
        "최근 설치한 윈도우 업데이트가 부팅 과정과 충돌하는 경우",
        "저장장치의 배드섹터나 파일 시스템 손상으로 부팅 관련 파일을 읽지 못하는 경우",
        "복구 시도 중 외장 USB·외장하드가 연결되어 있어 부팅 우선순위가 꼬이는 경우",
        "최근 설치한 드라이버나 프로그램이 부팅 초기 단계에서 충돌하는 경우"
      ],
      checks: [
        "연결된 모든 외장 USB 장치(USB, 외장하드, 프린터 등)를 분리한 뒤 재부팅해 재현 여부를 확인하세요.",
        "무한로딩이 오래 지속된다면 강제로 전원을 꺼서 복구 화면을 중단시킨 뒤, 같은 방식으로 2~3회 재부팅해 고급 옵션(복구 환경)까지 진입하세요.",
        "고급 옵션 진입 후 명령 프롬프트에서 bootrec /fixmbr, bootrec /fixboot, bootrec /rebuildbcd 순서로 부팅 정보를 복구하세요.",
        "최근 설치한 업데이트가 있다면 고급 옵션 > 업데이트 제거에서 최근 업데이트를 제거해보세요.",
        "위 방법으로 해결되지 않으면 고급 옵션의 시스템 복원으로 증상이 시작되기 전 시점으로 되돌리는 것을 고려하세요."
      ],
      link: "windows-auto-repair-loop.html"
    },
    {
      id: "bsod-critical-process",
      title: "Critical Process Died 블루스크린",
      summary: "부팅 중 블루스크린이 반복되는 경우",
      keywords: ["블루스크린", "파란 화면", "bsod", "청화면"],
      causes: ["드라이버 충돌", "시스템 파일 손상", "디스크 오류"],
      checks: ["최근 설치 드라이버 확인", "디스크 상태 점검", "안전 모드 복구"],
      link: "windows-bsod-critical-process.html"
    },
    {
      id: "explorer-freeze",
      title: "탐색기 멈춤",
      summary: "파일 탐색기가 응답하지 않거나 멈추는 경우",
      keywords: ["익스플로러 멈춤", "파일탐색기 안됨", "폴더 안열림", "탐색기 먹통"],
      causes: ["셸 확장 충돌", "대용량 폴더", "네트워크 드라이브"],
      checks: ["최근 추가 프로그램 확인", "우클릭 메뉴 점검", "대상 폴더 분리"],
      link: "windows-explorer-freeze.html"
    },
    {
      id: "printer-add-freeze",
      title: "프린터 추가 멈춤",
      summary: "프린터 장치 추가 단계에서 멈추는 경우",
      keywords: ["프린터 설치 안됨", "프린터 검색 안됨", "프린터 추가 안됨"],
      causes: ["드라이버 충돌", "스풀러 문제", "네트워크 설정"],
      checks: ["제조사 드라이버 점검", "연결 방식 변경", "기존 장치 정리"],
      link: "windows-printer-add-freeze.html"
    },
    {
      id: "gaming-reboot",
      title: "게임 중 재부팅",
      summary: "게임이나 부하 상황에서만 재부팅되거나, 게임 중 모니터만 꺼지는 경우",
      keywords: ["게임하다 꺼짐", "게임중 다운", "게임중 블루스크린", "갑자기 재부팅", "사용중 다운", "tm5", "메모리 진단", "안정성 오류", "memtest", "램 불안정", "메모리 검사시 하드웨어적 문제", "게임할때만 재부팅", "게임중 모니터 꺼짐", "게임중 화면 꺼짐"],
      causes: ["전원 공급 부족", "발열", "그래픽 드라이버", "램(RAM)이 불안정한 경우 — TestMem5(TM5)나 MemTest86에서 치명적 오류(Error)는 없지만 경고성 안정성 오류가 여러 개 나온다면 XMP/오버클럭 설정이나 램 자체 한계를 의심할 수 있습니다", "Windows 메모리 진단 도구에서 \"하드웨어 문제가 발견되었습니다\"라고 뜨는 경우 — 램 자체의 물리적 결함일 가능성이 높습니다", "PC 전체가 재부팅되지 않고 모니터 신호만 끊기는 경우 — GPU 드라이버의 TDR(응답 없음 감지 및 복구) 타임아웃이나 그래픽카드 과부하가 원인일 수 있습니다"],
      checks: ["온도 확인", "파워 용량 점검", "드라이버 재설치", "TM5나 MemTest86에서 안정성 오류가 다수 나왔다면 BIOS에서 XMP/오버클럭을 끄고 기본 클럭으로 되돌린 뒤 같은 테스트를 다시 돌려 오류가 줄어드는지 확인하세요.", "Windows 메모리 진단(mdsched.exe)에서 하드웨어 문제가 확인됐다면, 램을 한 개씩 꽂아가며 재부팅해 어떤 모듈에서 문제가 재현되는지 좁혀보세요.", "본체는 계속 켜져 있는데 모니터만 꺼진다면, 그래픽 드라이버를 완전히 제거(DDU) 후 재설치하고 GPU 온도·전원 케이블을 함께 확인하세요."],
      link: "hardware-gaming-reboot.html"
    },
    {
      id: "no-display",
      title: "화면 미출력",
      overview: "PC 본체의 전원은 정상적으로 인가되지만, 모니터 화면에 아무것도 표시되지 않거나 \"신호 없음\" 메시지가 나타나는 증상입니다. 모니터와 PC 간의 연결 문제, 모니터 자체의 설정 오류, PC 내부의 그래픽카드나 메모리 접촉 불량 등 다양한 원인으로 발생할 수 있습니다. 특히 PC를 이동했거나 새 부품을 장착한 직후에 흔히 발생합니다.",
      summary: "PC 전원은 인가되지만 모니터에 화면이 출력되지 않고 \"신호 없음\" 메시지만 나타나는 경우",
      keywords: ["모니터 안나옴", "화면 안나옴", "화면 안켜짐", "블랙스크린", "신호없음", "모니터 안켜짐"],
      causes: [
        "HDMI·DP·DVI·VGA 등 모니터와 그래픽카드를 연결하는 영상 케이블이 완전히 삽입되지 않았거나 손상된 경우",
        "모니터의 입력 소스가 현재 PC와 연결된 포트(예: HDMI1, DP1)와 다르게 설정되어 있는 경우",
        "그래픽카드가 메인보드 슬롯에 제대로 장착되지 않았거나 먼지로 접촉 불량이 생긴 경우",
        "램(RAM) 모듈이 슬롯에 제대로 장착되지 않았거나 먼지로 접촉 불량이 생긴 경우",
        "메인보드나 파워서플라이 이상으로 그래픽카드에 전원이 제대로 공급되지 않는 경우"
      ],
      checks: [
        "모니터와 PC의 전원 케이블이 콘센트와 각 기기에 단단히 연결되어 있는지, 전원 버튼이 켜져 있는지 확인하세요. 모니터 전원 LED가 정상적으로 들어오는지도 함께 확인하세요.",
        "모니터와 그래픽카드를 연결하는 영상 케이블을 양쪽 모두 완전히 분리했다가 다시 단단히 연결하세요. 가능하면 다른 케이블로 교체해 증상이 사라지는지 확인하세요.",
        "모니터의 OSD(화면 표시) 메뉴를 열어 현재 PC와 연결된 포트(예: HDMI1, DP1)가 올바르게 선택되어 있는지 확인하고, 필요하면 변경하세요.",
        "PC 전원을 완전히 끄고 케이블을 분리한 뒤 케이스를 열어 그래픽카드와 램 모듈을 슬롯에서 분리했다가 먼지를 제거하고 다시 단단히 장착하세요. 그래픽카드 보조 전원 케이블도 함께 확인하세요.",
        "CPU에 내장 그래픽 기능이 있고 메인보드에 영상 출력 포트가 있다면, 그래픽카드를 분리한 뒤 모니터를 메인보드 포트에 연결해 화면이 나오는지 확인하세요. 그래픽카드 문제인지 메인보드 문제인지 구분하는 데 도움이 됩니다."
      ],
      link: "hardware-no-display.html"
    },
    {
      id: "nvme-delay",
      title: "NVMe 인식 지연",
      overview: "부팅할 때 저장장치를 찾는 데 오래 걸리거나, BIOS에는 저장장치가 표시되지만 실제로 정상 사용 가능한 상태인지 확인하기 어려운 경우를 함께 다룹니다. BIOS 인식은 슬롯에 물리적으로 연결됐다는 것만 확인해줄 뿐, 파티션이 정상인지·읽기쓰기가 가능한지는 별도로 확인해야 합니다. 슬롯 접촉 불량, 펌웨어 문제, 디스크 자체의 초기 상태 이상이 흔한 원인입니다.",
      summary: "부팅이 느리거나 SSD 인식이 지연되는 경우, 또는 BIOS엔 뜨지만 실제 사용 가능한지 확인이 안 되는 경우",
      keywords: ["ssd 인식 안됨", "부팅 느림", "디스크 인식 지연", "저장장치 인식되나 사용가능한지 확인불가", "바이오스 인식되나", "디스크 초기화 안됨", "인식은 되는데"],
      causes: [
        "M.2 슬롯에 저장장치가 완전히 삽입되지 않았거나 고정 나사가 풀려 접촉이 불안정한 경우",
        "저장장치 펌웨어가 오래되어 초기화나 인식 속도가 느린 경우",
        "BIOS의 저장장치 컨트롤러 모드(AHCI/RAID)나 부팅 우선순위 설정이 맞지 않는 경우",
        "BIOS에서는 인식되지만 파티션이 없거나 초기화되지 않아 윈도우 디스크 관리에서 \"할당되지 않음\"으로 표시되는 경우",
        "저장장치 자체의 초기 불량이나 배드섹터로 정상적인 읽기·쓰기가 되지 않는 경우"
      ],
      checks: [
        "PC 전원을 끄고 M.2 저장장치가 슬롯에 완전히 삽입되어 고정 나사로 고정되어 있는지 다시 확인하세요.",
        "저장장치 제조사 홈페이지에서 최신 펌웨어가 있는지 확인하고 업데이트하세요.",
        "BIOS에서 저장장치가 인식되는지 먼저 확인한 뒤, 부팅이 안 된다면 컨트롤러 모드(AHCI/RAID) 설정을 확인하세요.",
        "윈도우 설치 화면이나 디스크 관리(diskmgmt.msc)에서 해당 디스크가 \"온라인\"·\"정상\" 상태인지, 파티션이 잡혀 있는지 확인하세요. \"할당되지 않음\"으로만 표시된다면 초기화가 필요한 상태입니다.",
        "CrystalDiskInfo 같은 진단 도구로 S.M.A.R.T 상태와 정상/주의/경고 여부를 확인해 실제 사용 가능한 상태인지 판단하세요."
      ],
      link: "hardware-nvme-delay.html"
    },
    {
      id: "usb-not-detected",
      title: "USB 미인식",
      summary: "USB 장치가 아예 인식되지 않거나, 부팅 직후 키보드·마우스가 먹통이 되면서 자동 재부팅되는 경우",
      keywords: ["usb 안됨", "usb 인식 안됨", "포트 안됨", "usb랜", "usb 랜카드", "랜카드 인식 안됨", "usb 이더넷 안됨", "키보드 마우스 먹통", "부팅후 키보드 마우스 안됨", "usb 먹통 재부팅"],
      causes: ["포트 고장", "전력 부족", "드라이버 문제", "USB-랜(이더넷) 어댑터 자체의 드라이버가 설치되지 않았거나 최신 윈도우 빌드와 호환되지 않는 경우", "USB 컨트롤러(칩셋) 드라이버가 손상되어 부팅 직후 모든 USB 장치가 한꺼번에 응답을 멈추고, 이어서 시스템이 자동 재부팅되는 경우"],
      checks: ["다른 포트 테스트", "허브 제거", "장치 관리자 확인", "장치 관리자에서 USB-랜 어댑터가 느낌표나 알 수 없는 장치로 표시되는지 확인하고, 제조사 홈페이지에서 드라이버를 받아 설치하세요.", "키보드·마우스가 먹통이 되며 재부팅된다면, 메인보드 칩셋·USB 컨트롤러 드라이버를 제조사 홈페이지에서 최신 버전으로 재설치하고 무선 수신기 대신 유선으로 연결해 재현되는지 확인하세요."],
      link: "hardware-usb-not-detected.html"
    },
    {
      id: "update-fail-loop",
      title: "업데이트 반복 실패",
      summary: "윈도우 업데이트가 계속 실패하고 다시 시도하는 경우",
      keywords: ["업데이트 안됨", "업데이트 실패", "윈도우 업데이트 오류"],
      causes: ["업데이트 캐시 손상", "보안 정책 충돌", "디스크 여유 부족"],
      checks: ["업데이트 기록 확인", "임시 파일 정리", "복구 옵션 점검"],
      link: "windows-update-fail-loop.html"
    },
    {
      id: "win11-upgrade-blocked",
      title: "윈도우11 업그레이드·설치 안 됨",
      summary: "윈도우 10에서 11로 업그레이드가 시작되지 않거나 설치 도중 막히는 경우",
      keywords: ["윈도우11 설치 안됨", "업그레이드 안됨", "win11 설치"],
      causes: ["TPM 2.0 또는 보안 부팅 미충족", "지원 목록에 없는 CPU", "저장공간 또는 파티션 부족"],
      checks: ["PC 상태 확인 앱 결과 확인", "TPM·보안 부팅 설정 확인", "미디어 만들기 도구로 재설치 시도"],
      link: "windows-11-upgrade-blocked.html"
    },
    {
      id: "gpu-not-detected",
      title: "그래픽카드 인식 안 됨",
      summary: "장착한 그래픽카드가 장치 관리자·화면 출력에서 인식되지 않는 경우",
      keywords: ["그래픽카드 안잡힘", "gpu 인식 안됨", "그래픽카드 안뜸"],
      causes: ["PCIe 슬롯 접촉 불량", "보조전원(6/8핀) 연결 불량", "드라이버 손상 또는 충돌", "카드 자체 고장"],
      checks: ["카드 재장착 및 슬롯 교체", "보조전원 케이블 확인", "장치 관리자에서 코드·느낌표 확인", "드라이버 완전 제거 후 재설치"],
      link: "hardware-gpu-not-detected.html"
    },
    {
      id: "screen-flicker",
      title: "화면 깜빡임·떨림",
      summary: "모니터나 노트북 화면이 주기적으로 깜빡이거나 떨리는 경우, 또는 1~2초씩 순간적으로 블랙아웃되거나 로그인 후 화면이 깨지는 경우",
      keywords: ["화면 떨림", "모니터 깜빡임", "화면 지지직", "모니터 블랙아웃", "화면 순간 꺼짐", "로그인후 화면 깨짐", "화면 깨짐"],
      causes: ["그래픽 드라이버 문제", "주사율 설정 불일치", "영상 케이블 연결 불량", "적응형 밝기·절전 설정", "그래픽카드나 케이블 접촉이 불안정해 1~2초씩 신호가 끊겼다가 돌아오는 경우 — 지속적인 깜빡임과 달리 짧은 블랙아웃은 접촉 불량 쪽을 먼저 의심하는 것이 좋습니다"],
      checks: ["드라이버 업데이트 또는 롤백", "주사율 설정 확인", "케이블 재연결·교체", "안전 모드에서 재현 여부 확인", "짧은 블랙아웃이 반복된다면 그래픽카드를 슬롯에서 분리했다가 다시 장착하고, 보조 전원 케이블이 완전히 꽂혀 있는지 확인하세요."],
      link: "hardware-screen-flicker.html"
    },
    {
      id: "activation-error",
      title: "윈도우 정품 인증 오류",
      summary: "윈도우가 정품 인증되지 않거나 인증 화면에서 오류가 반복되는 경우",
      keywords: ["정품인증 안됨", "인증 오류", "라이선스 오류"],
      causes: ["하드웨어 교체로 디지털 라이선스 불일치", "제품 키가 다른 기기에 연결됨", "인증 서버 연결 실패", "에디션·라이선스 불일치"],
      checks: ["설정 > 정품 인증에서 정확한 오류 코드 확인", "정품 인증 문제 해결사 실행", "Microsoft 계정 연결 여부 확인", "네트워크·DNS 연결 확인"],
      link: "windows-activation-error.html"
    },
    {
      id: "printer-offline",
      title: "프린터 오프라인·연결 안 됨",
      summary: "이미 설치된 프린터가 오프라인으로 표시되거나 인쇄가 전송되지 않는 경우",
      keywords: ["프린터 안됨", "인쇄 안됨", "프린터 연결 끊김"],
      causes: ["인쇄 스풀러(Print Spooler) 서비스 중단", "네트워크·USB 연결 끊김", "프린터 절전 모드", "기본 프린터 설정 오류"],
      checks: ["인쇄 스풀러 서비스 재시작", "프린터 전원·케이블·와이파이 연결 확인", "기본 프린터로 다시 설정", "프린터 드라이버 재설치"],
      link: "windows-printer-offline.html"
    },
    {
      id: "ms-account-login-fail",
      title: "마이크로소프트 계정 로그인 안 됨",
      summary: "Microsoft 계정으로 윈도우나 스토어에 로그인이 안 되거나 반복 실패하는 경우",
      keywords: ["마이크로소프트 로그인 안됨", "계정 로그인 실패", "로그인 오류"],
      causes: ["비밀번호·2단계 인증 확인 필요", "계정 보안 잠금", "시스템 시간·시간대 오류", "캐시된 자격 증명 충돌", "Microsoft 서비스 장애"],
      checks: ["웹브라우저에서 계정 로그인 시도", "시스템 시간·시간대 확인", "자격 증명 관리자 캐시 삭제", "Microsoft 서비스 상태 페이지 확인"],
      link: "windows-ms-account-login-fail.html"
    },
    {
      id: "update-network-broken",
      title: "업데이트 후 인터넷·네트워크 안 됨",
      summary: "윈도우 업데이트 이후 인터넷 연결이 안 되거나 네트워크 어댑터 자체가 사라지는 경우",
      keywords: ["업데이트후 인터넷 안됨", "와이파이 안잡힘", "네트워크 어댑터 사라짐"],
      causes: ["네트워크 드라이버가 업데이트로 손상되거나 호환되지 않는 버전으로 교체됨", "장치 관리자에서 네트워크 어댑터 자체가 사라짐", "VPN·보안 소프트웨어의 네트워크 필터와 충돌", "DNS·프록시 설정 초기화"],
      checks: ["장치 관리자에서 네트워크 어댑터 인식 여부 확인", "네트워크 어댑터 드라이버 롤백 또는 재설치", "netsh winsock reset 등 네트워크 초기화", "VPN·보안 프로그램 임시 비활성화 후 재현 확인"],
      link: "windows-update-network-broken.html"
    },
    {
      id: "startup-slow",
      title: "부팅 속도 저하",
      summary: "전원은 켜지지만 바탕화면까지 너무 오래 걸리는 경우",
      keywords: ["부팅 느림", "켜지는데 오래걸림", "로딩 오래걸림"],
      causes: ["시작 프로그램 과다", "디스크 지연", "드라이버 초기화 지연"],
      checks: ["시작 프로그램 점검", "디스크 상태 확인", "최근 설치 프로그램 확인"],
      link: "windows-startup-slow.html"
    },
    {
      id: "taskbar-freeze",
      title: "작업표시줄 멈춤",
      summary: "작업표시줄이나 시작 메뉴가 반응하지 않는 경우",
      keywords: ["작업표시줄 안눌림", "시작메뉴 안됨", "작업표시줄 먹통"],
      causes: ["탐색기 셸 문제", "시작 메뉴 구성 손상", "알림 영역 충돌"],
      checks: ["탐색기 재시작", "최근 셸 확장 확인", "업데이트 상태 점검"],
      link: "windows-taskbar-freeze.html"
    },
    {
      id: "wifi-disconnect",
      title: "와이파이 끊김",
      summary: "무선 인터넷이 자주 끊기거나, 유선랜은 IP를 받아오는데도 실제 인터넷 연결이 안 되는 경우",
      keywords: ["와이파이 끊김", "인터넷 끊김", "와이파이 자꾸 끊김", "유선랜 연결안됨", "유선랜 인터넷 안됨", "ip는 받아오는데", "인터넷 안됨"],
      causes: ["무선 드라이버", "절전 설정", "공유기 신호 불안정", "유선랜의 경우 IP는 정상적으로 할당받지만 게이트웨이·DNS 응답이 없어 실제 인터넷 접속이 안 되는 경우 — 공유기·모뎀 쪽 문제이거나 랜카드 드라이버가 손상된 경우가 흔합니다"],
      checks: ["드라이버 재설치", "절전 옵션 확인", "다른 네트워크 시험", "명령 프롬프트에서 ipconfig /release, ipconfig /renew로 IP를 재할당받고, 그래도 안 되면 ipconfig /flushdns로 DNS 캐시를 초기화하세요. 다른 기기를 같은 케이블·포트에 연결해 공유기·모뎀 쪽 문제인지 랜카드 쪽 문제인지 구분하세요."],
      link: "hardware-wifi-disconnect.html"
    },
    {
      id: "overheat-shutdown",
      title: "과열로 전원 꺼짐",
      overview: "온도가 올라가면 갑자기 꺼지거나 재부팅되는 경우와, 부하·온도와 상관없이 랜덤하게 전원이 꺼지는 경우를 함께 다룹니다. 특히 잘 작동할 때는 1~2주씩 아무 문제가 없다가, 한번 증상이 시작되면 며칠 동안 수시로 꺼지는 \"버스트\" 패턴이라면 과열보다는 PSU(파워서플라이) 내부 부품의 노후화나 전원 커넥터 접촉 불량처럼 온도·습도·미세한 진동에 따라 간헐적으로 나타나는 하드웨어 원인일 가능성이 큽니다.",
      summary: "온도가 올라가면 꺼지거나, 부하와 상관없이 랜덤하게(며칠씩 몰아서) 전원이 꺼지는 경우",
      keywords: ["뜨거워서 꺼짐", "갑자기 꺼짐", "발열로 꺼짐", "사용중 다운", "온도 올라가면 꺼짐", "랜덤하게 전원이 꺼짐", "수시로 전원이 꺼짐", "간헐적으로 전원 꺼짐", "며칠은 괜찮다가"],
      causes: [
        "쿨링(공랭/수랭) 성능이 부족하거나 먼지가 쌓여 부하 시 온도가 과도하게 올라가는 경우",
        "CPU·케이스 팬에 먼지가 끼어 회전이 느려지거나 일부만 작동하는 경우",
        "PSU 내부 커패시터가 노후화되어, 온도나 부하 변화에 따라 간헐적으로 전압을 유지하지 못하는 경우 — 특정 기간 멀쩡하다가 한번씩 몰아서 꺼지는 패턴의 흔한 원인입니다",
        "24핀·CPU 보조전원 커넥터가 완전히 고정되지 않아, 진동이나 온도 변화로 접촉이 순간적으로 끊기는 경우",
        "메인보드 전원부(VRM)가 노후화되었거나 불량인 경우"
      ],
      checks: [
        "HWiNFO 등으로 CPU·GPU 온도를 기록해, 꺼지는 시점이 실제로 고온과 겹치는지 먼저 확인하세요.",
        "케이스를 열어 CPU 쿨러와 케이스 팬에 먼지가 쌓였는지 확인하고 청소하세요.",
        "온도와 상관없이 랜덤하게 꺼진다면(유휴 상태에서도 발생), 24핀과 CPU 보조전원 케이블을 껐다 켠 뒤 다시 눌러 완전히 고정되어 있는지 확인하세요.",
        "이벤트 뷰어(eventvwr.msc)에서 꺼진 시각 직전에 Kernel-Power(이벤트 ID 41)나 다른 경고가 기록되어 있는지 확인해, 정상 종료가 아닌 갑작스러운 전원 차단이었는지 확인하세요.",
        "PSU 사용 연수가 오래됐고 위 점검으로 원인을 찾지 못했다면, 다른 정상 PSU로 교체해 같은 패턴(며칠 정상 → 며칠 불안정)이 재현되는지 테스트하세요."
      ],
      link: "hardware-overheat-shutdown.html"
    },
    {
      id: "sound-not-working",
      title: "소리가 나오지 않음",
      summary: "스피커나 이어폰에서 소리가 나오지 않는 경우",
      keywords: ["소리 안남", "스피커 안됨", "사운드 안됨", "이어폰 소리 안남"],
      causes: ["출력 장치 오류", "드라이버 문제", "볼륨/음소거 설정"],
      checks: ["출력 장치 확인", "사운드 드라이버 점검", "다른 포트/장치 시험"],
      link: "hardware-sound-not-working.html"
    },
    {
      id: "sleep-resume-fail",
      title: "절전 복귀 실패",
      overview: "절전(잠자기)에서 깨어날 때 화면이 멈추거나 블루스크린이 나는 경우와, 사용하지 않는 야간·유휴 시간대에 PC가 저절로 꺼져 있는 경우를 함께 다룹니다. 두 증상 모두 근본적으로는 윈도우의 전원 관리(절전/최대 절전 모드) 설정이나 예약된 작업과 관련이 깊습니다. 야간에 꺼져 있었다면, 절전에 들어간 뒤 정상적으로 깨어나지 못한 것인지 아니면 예약된 재시작·최대 절전 모드로 인한 것인지부터 구분하는 것이 중요합니다.",
      summary: "절전에서 깨어날 때 화면이 멈추거나, 야간·유휴 시간대에 PC가 저절로 꺼져 있는 경우",
      keywords: ["절전모드 안깨어남", "슬립 후 멈춤", "잠자기 모드 오류", "야간에 꺼짐", "야간에 한번씩 꺼짐", "밤에 꺼짐", "자다가 꺼짐", "자동으로 꺼짐", "새벽에 꺼짐"],
      causes: [
        "전원 상태 전환(절전/복귀)을 처리하는 드라이버가 최신 윈도우 빌드와 호환되지 않는 경우",
        "USB·네트워크 장치가 절전 중 웨이크업 신호를 잘못 보내 복귀에 실패하거나 재부팅을 유발하는 경우",
        "BIOS/UEFI의 전원 관리 설정(빠른 시작, S3/모던 스탠바이 등)이 하드웨어와 맞지 않는 경우",
        "윈도우 업데이트의 활성 시간(사용 시간) 설정이 실제 사용 패턴과 달라, 야간에 업데이트 설치 후 자동 재시작되는 경우",
        "절전 대신 최대 절전 모드(하이버네이트)로 전환되도록 설정되어 있어, 화면상으로는 \"꺼진 것\"처럼 보이는 경우"
      ],
      checks: [
        "절전 후 바로 복귀에 실패하는지, 시간이 오래 지난 뒤에만 실패하는지 재현 조건을 먼저 구분하세요.",
        "최근 연결한 USB 장치나 네트워크 어댑터를 분리한 뒤 재현 여부를 확인하세요.",
        "설정 > Windows 업데이트 > 사용 시간 편집에서, 실제로 PC를 쓰지 않는 야간 시간대가 활성 시간으로 잘못 잡혀 있지 않은지 확인하세요.",
        "설정 > 전원 및 절전에서 절전/최대 절전 모드 시간과, 전원 단추 동작이 의도한 대로 설정되어 있는지 확인하세요.",
        "명령 프롬프트(관리자 권한)에서 powercfg /lastwake 를 실행해 마지막으로 시스템을 깨우거나 종료로 이끈 원인이 무엇인지 확인하세요."
      ],
      link: "windows-sleep-resume-fail.html"
    },
    {
      id: "no-power",
      title: "전원 반응 없음",
      overview: "전원 버튼을 눌러도 팬이나 LED가 전혀 반응하지 않는 경우와, 여러 번 눌러야 그제서야 전원이 들어오는 경우를 함께 다룹니다. 완전히 무반응이라면 전원 공급 자체가 끊긴 것이고, 여러 번 눌러야 켜진다면 신호는 전달되지만 접점이나 전원 공급이 불안정한 상태로 보는 것이 맞습니다. 두 경우 모두 원인은 PSU, 전원 케이블 연결, 케이스 전원 스위치 쪽에서 찾는 경우가 많습니다.",
      summary: "전원 버튼을 눌러도 팬·LED가 반응하지 않거나, 여러 번 눌러야 겨우 켜지는 경우",
      keywords: ["전원 안켜짐", "켜지지 않음", "전원버튼 반응없음", "팬 안돌아감", "사용중 다운", "전원스위치 여러번", "여러번 눌러야 켜짐", "전원버튼 눌러야 켜짐", "간헐적 전원"],
      causes: [
        "24핀·8핀(CPU 보조전원) 케이블이 메인보드에 완전히 꽂히지 않았거나 헐거워진 경우",
        "케이스 전원 스위치 자체가 오래 사용해 마모되어, 눌러도 접점이 바로 붙지 않는 경우",
        "케이스 전면 패널 스위치 케이블(PWR_SW)이 메인보드 헤더에서 헐거워졌거나 잘못 꽂힌 경우",
        "PSU(파워서플라이)의 대기전력 공급이 약해지거나 노후화되어 첫 신호에 바로 반응하지 못하는 경우",
        "벽면 콘센트·멀티탭 연결이나 PSU 뒷면 스위치 자체의 접촉이 불안정한 경우"
      ],
      checks: [
        "PSU 뒷면 전원 스위치가 켜져 있는지, 전원 케이블이 콘센트와 PSU에 단단히 꽂혀 있는지 먼저 확인하세요.",
        "케이스를 열어 24핀 메인 전원 케이블과 CPU 보조전원(4핀·8핀) 케이블이 메인보드에 완전히 꽂혀 있는지 다시 눌러 확인하세요.",
        "케이스 전면 패널의 전원 스위치 케이블을 메인보드 PWR_SW 핀에서 분리한 뒤, 드라이버 끝으로 핀 2개를 살짝 접촉시켜 바로 켜지는지 확인하세요. 바로 켜지면 케이스 스위치 자체의 마모나 배선 문제입니다.",
        "여러 번 눌러야 켜지는 증상이 최근 들어 심해졌다면 PSU 사용 연수를 확인하고, 가능하면 다른 정상 PSU로 교체해 재현되는지 테스트하세요.",
        "다른 콘센트나 멀티탭으로 바꿔 연결해 전원 공급 경로 자체의 문제인지 확인하세요."
      ],
      link: "hardware-no-power.html"
    },
    {
      id: "black-screen-after-login",
      title: "로그인 후 검은 화면",
      summary: "로그인은 되지만 바탕화면 대신 검은 화면이나 마우스 포인터만 보이거나, 아이콘은 보이는데 클릭이 안 되고 로딩 표시만 도는 경우",
      keywords: ["로그인후 검은화면", "바탕화면 안뜸", "검은 화면만 보임", "마우스 클릭 불가", "로딩 동그라미", "아이콘만 나오고 멈춤", "바탕화면 먹통"],
      causes: ["탐색기 실행 지연", "그래픽 드라이버", "출력 모드 오류", "탐색기(explorer.exe)는 실행됐지만 응답 없음 상태에 빠져 아이콘은 보여도 클릭이 전혀 반응하지 않는 경우"],
      checks: ["그래픽 드라이버 재설정", "탐색기 다시 실행", "외부 모니터 분리", "Ctrl+Shift+Esc로 작업 관리자를 띄운 뒤(화면이 안 보여도 반응할 수 있습니다) explorer.exe를 찾아 다시 시작해보세요."],
      link: "windows-black-screen-after-login.html"
    },
    {
      id: "disk-usage-100",
      title: "디스크 사용률 100%",
      summary: "작업 관리자에서 디스크가 계속 100%로 표시되고 PC가 느려지는 경우",
      keywords: ["디스크 100%", "컴퓨터 느려짐", "pc 느림"],
      causes: ["백그라운드 작업", "저장장치 지연", "메모리 부족"],
      checks: ["프로세스별 사용량 확인", "응답 시간 점검", "디스크 건강 상태 확인"],
      link: "windows-disk-usage-100.html"
    },
    {
      id: "gpu-coil-whine",
      title: "그래픽카드 고주파 소음",
      overview: "게임이나 고사양 작업 중 그래픽카드에서 \"삐-\", \"지지직\" 같은 고주파 소음이 나는 증상입니다. 대부분은 코일 위스파(코일 노이즈)라고 불리는 현상으로, 전류가 그래픽카드의 인덕터(코일)를 지나며 코일이 미세하게 진동해 나는 소리입니다. 고장의 직접적인 신호는 아니지만, 소음의 세기와 발생 조건에 따라 정상 범위인지 점검이 필요한 상태인지 구분할 필요가 있습니다.",
      summary: "게임·고사양 작업 중 그래픽카드에서 삐- 또는 지지직 하는 고주파 소음이 나는 경우",
      keywords: ["그래픽카드 소음", "고주파 소음", "코일 노이즈", "코일 위스파", "그래픽카드 삐소리", "gpu 소음", "그래픽카드 지지직", "언더볼팅", "파워리밋", "코일노이즈 as", "코일노이즈 교환 기준"],
      causes: [
        "코일 위스파(coil whine) — 전류가 그래픽카드 인덕터를 통과하며 코일이 미세하게 진동해 소리가 나는 현상으로, 대부분의 그래픽카드에서 정도 차이만 있을 뿐 흔하게 나타납니다",
        "프레임이 매우 높게(수백 fps) 나오는 가벼운 게임에서 GPU에 순간적으로 부하가 튈 때 더 크게 들리는 경우",
        "전원 공급이 불안정하거나 파워서플라이 자체의 효율이 낮아 전류 리플이 커서 소음이 도드라지는 경우",
        "그래픽카드 방열판의 팬 베어링이 마모되어 코일 소음과 팬 소음이 섞여 더 거슬리게 들리는 경우",
        "드물게는 카드 자체의 전원부(VRM) 불량으로 평소보다 소음이 급격히 커지거나 성능 저하·재부팅이 함께 나타나는 경우"
      ],
      checks: [
        "소음이 항상 나는지, 특정 게임·특정 프레임 구간에서만 나는지 먼저 구분하세요. fps 제한(수직동기 또는 프레임 제한 기능)을 걸어 GPU 부하를 낮췄을 때 소음이 줄어드는지 확인하세요.",
        "소음과 함께 성능 저하, 화면 깨짐, 재부팅처럼 다른 이상 증상이 동반되는지 확인하세요. 소음만 있고 다른 증상이 없다면 대부분 정상 범위의 코일 노이즈입니다.",
        "그래픽카드 팬이 함께 원인일 수 있으니, 부하를 걸지 않은 상태(유휴 시)에서도 소리가 나는지, 팬 자체에서 나는 소리인지 코일에서 나는 소리인지 위치를 좁혀보세요.",
        "다른 정상 PSU가 있다면 교체해 전원 공급 쪽 문제인지 확인하고, 파워서플라이의 정격 용량이 그래픽카드 권장 사양에 충분한지 점검하세요.",
        "MSI 애프터버너 같은 도구로 코어 전압을 낮추는 언더볼팅을 시도하거나, 파워 리밋(전력 제한)을 몇 % 낮춰보세요. 전류 변화 폭이 줄어들면 코일 진동과 소음도 함께 줄어드는 경우가 많습니다.",
        "소음이 최근 들어 눈에 띄게 커졌거나 성능 저하·화면 이상이 함께 나타난다면, 정상적인 코일 노이즈 범위를 벗어난 것일 수 있으니 제조사 A/S 문의를 고려하세요. 다만 코일 노이즈 단독으로는 대부분 무상 교환 대상이 아니라는 점을 미리 알아두세요(자세한 기준은 아래 참고)."
      ],
      link: "hardware-gpu-coil-whine.html"
    },
    {
      id: "bluetooth-not-found",
      title: "블루투스 장치 미검색",
      summary: "이어폰, 키보드, 마우스가 검색 목록에 나타나지 않는 경우",
      keywords: ["블루투스 안잡힘", "블루투스 검색 안됨", "이어폰 연결 안됨"],
      causes: ["페어링 모드", "검색 범위 설정", "블루투스 드라이버"],
      checks: ["장치 페어링 모드 확인", "검색 설정 변경", "드라이버 재설치"],
      link: "hardware-bluetooth-not-found.html"
    },
    {
      id: "app-not-launching",
      title: "앱 실행 불가",
      summary: "프로그램을 눌러도 열리지 않거나 실행 직후 바로 종료되는 경우",
      keywords: ["프로그램 실행 안됨", "앱 안켜짐", "프로그램 꺼짐"],
      causes: ["앱 데이터 손상", "권한 문제", "필수 구성 요소 누락"],
      checks: ["오류 기록 확인", "앱 복구 또는 초기화", "재설치 전 데이터 확인"],
      link: "windows-app-not-launching.html"
    },
    {
      id: "browser-not-responding",
      title: "브라우저 응답 없음",
      summary: "크롬, 엣지 등 브라우저가 멈추거나 페이지 로드 중 오류가 나는 경우",
      keywords: ["브라우저 멈춤", "크롬 멈춤", "웹페이지 안열림"],
      causes: ["과도한 탭·확장 프로그램", "확장 프로그램 충돌", "캐시·프로필 손상"],
      checks: ["작업 관리자에서 브라우저 재시작", "확장 프로그램 하나씩 비활성화", "캐시·방문 기록 정리"],
      link: "windows-browser-not-responding.html"
    },
    {
      id: "install-failure",
      title: "프로그램 설치 실패",
      summary: "설치 프로그램이 중간에 멈추거나 오류 코드와 함께 실패하는 경우",
      keywords: ["설치 안됨", "설치 오류"],
      causes: ["Windows Installer 서비스 오류", "이전 설치 잔여 파일", "설치 권한 부족"],
      checks: ["Windows Installer 서비스 재시작", "임시 설치 파일 정리", "관리자 권한으로 재실행"],
      link: "windows-install-failure.html"
    },
    {
      id: "game-launch-error",
      title: "게임 실행 오류",
      summary: "게임 클라이언트나 안티치트 드라이버 문제로 게임이 실행되지 않는 경우",
      keywords: ["게임 실행 안됨", "게임 안켜짐", "게임 튕김"],
      causes: ["안티치트 드라이버 미설치·충돌", "게임 파일 손상", "클라이언트 패치 실패"],
      checks: ["안티치트 드라이버 재설치", "게임 파일 무결성 검사", "클라이언트 재설치"],
      link: "windows-game-launch-error.html"
    },
    {
      id: "game-connection-error",
      title: "게임 서버 연결 오류",
      summary: "게임 런처나 클라이언트가 서버에 연결하지 못하는 경우",
      keywords: ["게임 서버 연결 안됨", "게임 접속 안됨", "핑 오류"],
      causes: ["런처 캐시 손상", "방화벽·라우터 차단", "DNS·VPN 간섭"],
      checks: ["런처 캐시 삭제", "공유기 재시작", "DNS 변경 또는 VPN 해제"],
      link: "windows-game-connection-error.html"
    }
  ],
  boardParts: [
    {
      id: "cpu",
      label: "CPU Socket",
      shortLabel: "CPU",
      position: { x: 87, y: 33 },
      hitbox: { w: 19, h: 10 },
      summary: "부팅, 절전 복귀, 전원 안정성과 관련된 핵심 부품입니다.",
      symptoms: ["자동 복구 루프", "Critical Process Died", "절전 복귀 실패"],
      codes: ["0x000000EF", "0x0000009F", "0x0000001A"],
      note: "전원 상태 전환과 시스템 안정성을 함께 보세요."
    },
    {
      id: "eps-power",
      label: "8-pin EPS Power",
      shortLabel: "EPS",
      position: { x: 17, y: 15 },
      hitbox: { w: 22, h: 11 },
      summary: "CPU 보조 전원 연결 불량과 높은 부하에서 발생하는 재부팅을 확인하는 부위입니다.",
      symptoms: ["전원 반응 없음", "게임 중 재부팅", "과열로 전원 꺼짐"],
      codes: ["0x0000009C", "0x00000124", "0x000000EA"],
      cases: [
        "전원 버튼을 누르면 팬이 잠깐 돌다가 바로 꺼짐",
        "게임이나 렌더링처럼 CPU 부하가 올라갈 때 재부팅됨",
        "CPU 또는 메인보드 교체 뒤 부팅이 시작되지 않음"
      ],
      note: "CPU용 EPS 케이블인지 확인하고, 그래픽카드용 PCIe 케이블과 혼용하지 마세요."
    },
    {
      id: "atx-power",
      label: "24-pin ATX Power",
      shortLabel: "24핀",
      position: { x: 90, y: 42 },
      hitbox: { w: 20, h: 11 },
      summary: "메인보드 전체의 전원 공급과 갑작스러운 무반응·재부팅을 확인하는 부위입니다.",
      symptoms: ["전원 반응 없음", "게임 중 재부팅", "화면 미출력"],
      codes: ["0x0000009C", "0x00000124", "0x000000A5"],
      cases: [
        "전원 LED만 켜지고 화면과 팬이 정상적으로 시작되지 않음",
        "케이블을 건드리거나 케이스를 이동한 뒤 부팅 상태가 달라짐",
        "부하가 걸리는 순간 시스템이 꺼지거나 WHEA 계열 오류가 기록됨"
      ],
      note: "24핀 커넥터의 걸쇠가 끝까지 잠겼는지 확인하고, 파워 모듈러 케이블은 PSU 본체와 세트인지 확인하세요."
    },
    {
      id: "cooler",
      label: "CPU Cooling Fan",
      shortLabel: "쿨러",
      position: { x: 50, y: 10 },
      hitbox: { w: 22, h: 10 },
      summary: "온도와 부하가 높아질 때 발생하는 전원 꺼짐을 확인하는 부품입니다.",
      symptoms: ["게임 중 재부팅", "과열로 전원 꺼짐"],
      codes: ["0x0000009C", "0x00000116", "0x000000EA"],
      note: "온도 로그와 팬 회전 상태를 함께 보세요."
    },
    {
      id: "ram",
      label: "RAM Slots",
      shortLabel: "RAM",
      position: { x: 91, y: 20 },
      hitbox: { w: 16, h: 10 },
      summary: "블루스크린과 불규칙한 재부팅의 원인이 될 수 있는 부품입니다.",
      symptoms: ["Critical Process Died", "화면 미출력", "게임 중 재부팅"],
      codes: ["0x0000001A", "0x00000050", "0x0000000A"],
      note: "재장착과 교차 테스트가 우선입니다."
    },
    {
      id: "gpu",
      label: "GPU",
      shortLabel: "GPU",
      position: { x: 90, y: 55 },
      hitbox: { w: 20, h: 13 },
      summary: "화면 출력 오류와 게임 실행 중 발생하는 문제를 확인하는 부품입니다.",
      symptoms: ["화면 미출력", "게임 중 재부팅"],
      codes: ["0x00000116", "0x000000EA", "0x000000BE"],
      note: "케이블, 보조전원, 드라이버를 함께 봐야 합니다."
    },
    {
      id: "m2",
      label: "M.2 SSD Slots",
      shortLabel: "M.2",
      position: { x: 17, y: 45 },
      hitbox: { w: 21, h: 10 },
      summary: "부팅 지연과 저장장치 읽기 실패가 자주 연결되는 부위입니다.",
      symptoms: ["NVMe 인식 지연", "자동 복구 루프", "부팅 속도 저하"],
      codes: ["0x0000007B", "0x00000077", "0x0000007A"],
      note: "슬롯 접촉과 펌웨어 확인이 중요합니다."
    },
    {
      id: "sata",
      label: "SATA Connectors",
      shortLabel: "SATA",
      position: { x: 89, y: 74 },
      hitbox: { w: 18, h: 10 },
      summary: "SATA 저장장치의 연결 및 인식 문제를 확인하는 부위입니다.",
      symptoms: ["자동 복구 루프", "프린터 추가 멈춤"],
      codes: ["0x80070002", "0x80004005", "0x00000077"],
      note: "케이블과 포트가 헐거운지 먼저 봅니다."
    },
    {
      id: "rear-io",
      label: "CMOS Battery (CR2032)",
      shortLabel: "CMOS",
      position: { x: 18, y: 65 },
      hitbox: { w: 20, h: 10 },
      summary: "BIOS 설정 초기화와 부팅 장치 인식 문제를 함께 확인하는 부품입니다.",
      symptoms: ["부팅 속도 저하", "NVMe 인식 지연", "전원 반응 없음"],
      codes: ["0x000000A5", "0x0000007B", "0x80070057"],
      note: "전원을 완전히 분리한 뒤 배터리 교체와 BIOS 설정을 확인하세요."
    },
    {
      id: "psu",
      label: "PSU",
      shortLabel: "PSU",
      position: { x: 18, y: 84 },
      hitbox: { w: 19, h: 11 },
      summary: "전원 무반응과 갑작스러운 시스템 종료를 확인하는 부품입니다.",
      symptoms: ["전원 반응 없음", "과열로 전원 꺼짐", "게임 중 재부팅"],
      codes: ["0x0000009C", "0x000000EA", "0x0000001A"],
      note: "파워 스위치와 케이블 연결을 먼저 점검하세요."
    }
  ],
  eventViewerCodes: [
    {
      id: "41", source: "Kernel-Power", level: "critical", urgency: "repeat-check",
      summary: "Windows가 정상 종료 절차를 거치지 못한 뒤 다시 시작되었음을 기록합니다. 파워서플라이 고장을 단독으로 확정하는 이벤트는 아닙니다.",
      conditions: ["전원 차단 또는 강제 종료 뒤", "게임·렌더링 중 갑작스러운 재부팅", "절전 복귀 실패 뒤"],
      causes: ["사용자 강제 종료", "과열 또는 전원 불안정", "드라이버·메모리 오류로 인한 멈춤"],
      checks: ["발생 직전 작업과 온도 기록", "같은 시각의 WHEA·BugCheck 이벤트 확인", "24핀·EPS·GPU 전원과 메모리 기본 설정 점검"],
      warnings: ["반복되고 저장 중 전원이 꺼진다면 먼저 중요한 파일을 백업하세요.", "이벤트 41만으로 PSU를 교체하지 마세요."],
      relatedCodes: ["0x00000124", "0x0000009F"], relatedGuides: ["hardware-gaming-reboot.html", "hardware-overheat-shutdown.html"], detailPage: "event-kernel-power-41.html"
    },
    {
      id: "6008", source: "EventLog", level: "error", urgency: "repeat-check",
      summary: "이전 시스템 종료가 예상하지 못한 방식으로 끝났음을 나타내는 사후 기록입니다.",
      conditions: ["정전·강제 종료 뒤", "블루스크린 뒤 자동 재부팅", "시스템 멈춤 뒤 전원 버튼 사용"],
      causes: ["비정상 종료 결과", "전원 공급 중단", "커널 또는 드라이버 멈춤"],
      checks: ["같은 시각 직전의 오류 확인", "신뢰성 모니터에서 중단 원인 비교", "Kernel-Power 41과 BugCheck 1001 동반 여부 확인"],
      warnings: ["원인이 아니라 종료 결과를 기록한 경우가 많습니다."], relatedCodes: ["0x00000124"], relatedGuides: ["hardware-gaming-reboot.html"], detailPage: "event-eventlog-6008.html"
    },
    {
      id: "1000", source: "Application Error", level: "error", urgency: "driver",
      summary: "응용 프로그램이 예외를 처리하지 못하고 종료되었을 때 충돌 모듈과 예외 코드를 남깁니다.",
      conditions: ["앱 실행 직후 종료", "특정 기능 사용 중 반복 충돌"], causes: ["손상된 앱 파일", "플러그인·오버레이 충돌", "그래픽 또는 런타임 구성 요소 문제"],
      checks: ["오류 응용 프로그램 이름과 오류 모듈 기록", "앱 업데이트·복구", "클린 부팅에서 재현 여부 확인"], warnings: ["시스템 전체 고장으로 단정하지 마세요."],
      relatedCodes: ["0xC0000005", "0x80070005"], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-application-error-1000.html"
    },
    {
      id: "1001", source: "Windows Error Reporting", level: "error", urgency: "repeat-check",
      summary: "블루스크린, 앱 충돌 또는 장치 오류가 Windows 오류 보고에 등록된 기록입니다.",
      conditions: ["블루스크린 자동 재부팅 뒤", "앱 충돌 보고 생성 뒤"], causes: ["BugCheck 발생", "응용 프로그램 장애", "하드웨어 오류 보고"],
      checks: ["BugcheckCode와 매개 변수 확인", "덤프 파일 생성 여부 확인", "같은 시각의 Kernel-Power·WHEA 확인"], warnings: ["보고 유형을 확인하기 전에는 블루스크린으로 단정하지 마세요."],
      relatedCodes: ["0x000000EF", "0x00000124"], relatedGuides: ["windows-bsod-critical-process.html"], detailPage: "event-wer-1001.html"
    },
    {
      id: "7", source: "Disk", level: "error", urgency: "backup",
      summary: "저장장치에서 읽을 수 없는 블록이 감지되었음을 알리는 기록입니다.", conditions: ["파일 복사 지연", "부팅 중 디스크 접근", "특정 파일을 열 때 멈춤"],
      causes: ["배드 섹터 또는 NAND 오류", "케이블·슬롯 접촉 문제", "컨트롤러 문제"], checks: ["중요 파일 즉시 백업", "SMART·제조사 진단 확인", "케이블·포트 교차 점검"],
      warnings: ["검사나 복구 명령보다 데이터 백업을 먼저 진행하세요."], relatedCodes: ["0x0000007A", "0x00000077"], relatedGuides: ["hardware-nvme-delay.html"], detailPage: "event-disk-7.html"
    },
    {
      id: "51", source: "Disk", level: "warning", urgency: "backup",
      summary: "페이징 작업 중 저장장치 입출력 오류가 발생했음을 나타냅니다.", conditions: ["대용량 작업 중 멈춤", "페이지 파일 접근 중 지연"], causes: ["디스크 응답 지연", "케이블·전원 불안정", "저장장치 상태 저하"],
      checks: ["백업 후 SMART 확인", "SATA 케이블·M.2 장착 상태 점검", "이벤트 7·129·153 동반 여부 확인"], warnings: ["반복될수록 데이터 손실 위험이 커질 수 있습니다."], relatedCodes: ["0x0000007A"], relatedGuides: ["hardware-nvme-delay.html"], detailPage: "event-disk-51.html"
    },
    {
      id: "55", source: "Ntfs", level: "error", urgency: "backup",
      summary: "NTFS 파일 시스템 구조에서 손상이 감지되었음을 나타냅니다.", conditions: ["부팅 후 디스크 검사 안내", "파일·폴더 접근 오류"], causes: ["비정상 종료", "저장장치 오류", "파일 시스템 메타데이터 손상"],
      checks: ["중요 데이터 백업", "디스크 건강 상태 확인", "백업 후 chkdsk 검사 계획"], warnings: ["고장 징후가 있으면 쓰기 작업이 많은 복구를 먼저 실행하지 마세요."], relatedCodes: ["0x00000024", "0x000000ED"], relatedGuides: ["windows-auto-repair-loop.html"], detailPage: "event-ntfs-55.html"
    },
    {
      id: "129", source: "storahci", level: "warning", urgency: "backup",
      summary: "저장장치 요청이 시간 안에 끝나지 않아 컨트롤러가 장치를 재설정한 기록입니다.", conditions: ["몇 초간 시스템 멈춤", "NVMe·SATA 응답 지연", "부팅이 간헐적으로 느림"],
      causes: ["SSD 펌웨어·컨트롤러 문제", "전원 관리 호환성", "케이블·슬롯 또는 장치 상태"], checks: ["동일 시각 이벤트 153 확인", "SSD 펌웨어와 건강 상태 확인", "전원 관리·칩셋 드라이버 점검"],
      warnings: ["반복되면 먼저 백업하고 저장장치 교차 테스트를 준비하세요."], relatedCodes: ["0x00000133", "0x0000007A"], relatedGuides: ["hardware-nvme-delay.html"], detailPage: "event-storahci-129.html"
    },
    {
      id: "153", source: "Disk", level: "warning", urgency: "backup",
      summary: "디스크 입출력 작업이 재시도되었음을 나타내며 일시적 지연 또는 연결 문제의 단서가 됩니다.", conditions: ["복사 중 속도 급락", "게임 로딩 중 멈춤"], causes: ["장치 응답 지연", "케이블·포트 문제", "필터 드라이버 영향"],
      checks: ["발생 디스크 번호 확인", "이벤트 129·7 동반 여부 확인", "백업 후 연결과 SMART 점검"], warnings: ["반복되면 단순 성능 문제로 넘기지 마세요."], relatedCodes: ["0x0000007A"], relatedGuides: ["hardware-nvme-delay.html"], detailPage: "event-disk-153.html"
    },
    {
      id: "17", source: "WHEA-Logger", level: "warning", urgency: "repeat-check",
      summary: "PCIe 계열 하드웨어 오류가 수정되어 시스템이 계속 실행된 기록입니다.", conditions: ["GPU·NVMe 부하 중", "절전 복귀 뒤"], causes: ["PCIe 링크 불안정", "장치 펌웨어·드라이버", "오버클럭 또는 전원 관리"],
      checks: ["장치 ID와 버스 위치 확인", "BIOS·칩셋·장치 펌웨어 확인", "기본 클럭에서 반복 여부 점검"], warnings: ["수정된 오류라도 반복 횟수가 늘면 점검이 필요합니다."], relatedCodes: ["0x00000124"], relatedGuides: ["hardware-gaming-reboot.html"], detailPage: "event-whea-logger-17.html"
    },
    {
      id: "18", source: "WHEA-Logger", level: "error", urgency: "backup",
      summary: "CPU, 메모리 또는 인터커넥트에서 수정할 수 없는 하드웨어 오류가 보고된 기록입니다.", conditions: ["부하 중 재부팅", "유휴 상태에서 갑작스러운 멈춤", "오버클럭 적용 상태"],
      causes: ["CPU 코어·캐시 불안정", "메모리·Infinity Fabric 불안정", "전원·온도 또는 BIOS 설정"], checks: ["중요 데이터 백업", "XMP·EXPO·오버클럭 해제", "오류 유형과 APIC ID를 기록해 부품별 교차 테스트"],
      warnings: ["반복되면 장시간 부하 테스트보다 백업과 기본 설정 복원이 우선입니다."], relatedCodes: ["0x00000124", "0x0000009C"], relatedGuides: ["hardware-gaming-reboot.html", "hardware-overheat-shutdown.html"], detailPage: "event-whea-logger-18.html"
    },
    {
      id: "19", source: "WHEA-Logger", level: "warning", urgency: "repeat-check",
      summary: "수정된 하드웨어 오류가 보고된 기록으로 CPU·메모리·PCIe 상태를 함께 봐야 합니다.", conditions: ["부하 전환 중", "절전 복귀 뒤"], causes: ["일시적 전압·클럭 불안정", "BIOS 설정", "장치 링크 오류"],
      checks: ["오류 구성 요소 확인", "기본 BIOS 설정에서 재현 여부 확인", "반복 횟수와 작업 조건 기록"], warnings: ["단발성보다 반복 패턴이 중요합니다."], relatedCodes: ["0x00000124"], relatedGuides: ["hardware-gaming-reboot.html"], detailPage: "event-whea-logger-19.html"
    },
    {
      id: "20", source: "WHEA-Logger", level: "error", urgency: "backup",
      summary: "치명적 하드웨어 오류가 보고되었으며 오류 레코드의 구성 요소 확인이 필요합니다.", conditions: ["블루스크린 또는 재부팅 직전"], causes: ["CPU·메모리·PCIe 장치 오류", "전원·열 불안정"],
      checks: ["백업", "오류 레코드와 같은 시각 이벤트 확인", "기본 설정에서 부품별 테스트"], warnings: ["반복되면 사용을 줄이고 원인 부품을 분리 점검하세요."], relatedCodes: ["0x00000124"], relatedGuides: ["hardware-gaming-reboot.html"], detailPage: "event-whea-logger-20.html"
    },
    {
      id: "46", source: "WHEA-Logger", level: "error", urgency: "backup",
      summary: "메모리 계층을 포함한 치명적 하드웨어 오류 기록으로 나타날 수 있습니다.", conditions: ["메모리 부하 중", "부팅·절전 복귀 중"], causes: ["RAM·메모리 컨트롤러 불안정", "XMP·EXPO 설정", "보드·CPU 접촉 문제"],
      checks: ["중요 데이터 백업", "메모리 기본 속도 복원", "모듈과 슬롯 교차 테스트"], warnings: ["오류가 반복되면 메모리 검사 결과만으로 정상 판정하지 마세요."], relatedCodes: ["0x0000001A", "0x00000124"], relatedGuides: ["hardware-gaming-reboot.html"], detailPage: "event-whea-logger-46.html"
    },
    {
      id: "4101", source: "Display", level: "warning", urgency: "driver",
      summary: "그래픽 드라이버가 응답하지 않아 Windows가 드라이버를 복구한 기록입니다.", conditions: ["화면 깜빡임", "게임 중 검은 화면", "브라우저·영상 재생 중 멈춤"], causes: ["그래픽 드라이버 충돌", "GPU 과열·전원 불안정", "오버클럭·하드웨어 가속 문제"],
      checks: ["드라이버 버전과 발생 앱 기록", "GPU 온도·보조전원 확인", "안정 버전 드라이버에서 재현 비교"], warnings: ["화면 깨짐이나 타는 냄새가 있으면 부하 테스트를 중단하세요."], relatedCodes: ["0x00000116", "0x000000EA"], relatedGuides: ["hardware-no-display.html"], detailPage: "event-display-4101.html"
    },
    {
      id: "219", source: "Kernel-PnP", level: "warning", urgency: "driver",
      summary: "장치 드라이버가 시작 과정에서 로드되지 않았거나 지연되었음을 나타냅니다.", conditions: ["부팅 직후", "USB·블루투스 장치 연결 뒤"], causes: ["장치 드라이버 누락·충돌", "빠른 시작 영향", "분리된 장치의 잔여 서비스"],
      checks: ["장치 인스턴스와 드라이버 이름 확인", "장치 관리자 상태 확인", "제조사 드라이버 재설치"], warnings: ["문제 장치가 정상 작동하면 단발성 기록은 지켜볼 수 있습니다."], relatedCodes: ["0x0000009F"], relatedGuides: ["hardware-usb-not-detected.html"], detailPage: "event-kernel-pnp-219.html"
    },
    {
      id: "7000", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "Windows 서비스가 시작되지 못했음을 나타냅니다.", conditions: ["부팅 직후", "앱 또는 장치 서비스 시작 시"], causes: ["서비스 파일 누락", "권한·계정 문제", "제거된 프로그램 잔여 항목"], checks: ["서비스 이름과 오류 문구 확인", "관련 앱·드라이버 상태 확인", "필요 서비스인지 판단 후 복구"], warnings: ["서비스를 무작정 비활성화하지 마세요."], relatedCodes: ["0x80070422"], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-service-7000.html"
    },
    {
      id: "7001", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "의존하는 다른 서비스가 시작되지 않아 현재 서비스도 시작할 수 없음을 나타냅니다.", conditions: ["부팅 또는 앱 시작 시"], causes: ["선행 서비스 실패", "서비스 구성 손상"], checks: ["설명에 표시된 의존 서비스 확인", "7000·7023 이벤트와 시간 비교", "관련 앱 복구"], warnings: ["의존성 레지스트리를 임의 수정하지 마세요."], relatedCodes: ["0x80070422"], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-service-7001.html"
    },
    {
      id: "7009", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "서비스가 제한 시간 안에 연결되지 못했음을 나타냅니다.", conditions: ["부팅 지연", "앱 시작 지연"], causes: ["서비스 응답 지연", "디스크·네트워크 병목", "손상된 앱 구성"], checks: ["서비스 이름 확인", "같은 시간 디스크·네트워크 이벤트 확인", "앱 업데이트·복구"], warnings: ["시간 제한 값을 먼저 늘리기보다 지연 원인을 찾으세요."], relatedCodes: [], relatedGuides: ["windows-startup-slow.html"], detailPage: "event-service-7009.html"
    },
    {
      id: "7011", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "서비스 제어 요청이 시간 안에 응답하지 않았음을 나타냅니다.", conditions: ["종료·부팅 지연", "장치 서비스 멈춤"], causes: ["서비스 교착", "저장장치 지연", "드라이버 응답 문제"], checks: ["서비스 이름 기록", "디스크 129·153 동반 여부 확인", "클린 부팅에서 재현 확인"], warnings: ["서비스 강제 삭제는 마지막 수단입니다."], relatedCodes: ["0x00000133"], relatedGuides: ["windows-startup-slow.html"], detailPage: "event-service-7011.html"
    },
    {
      id: "7023", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "서비스가 자체 오류 코드를 반환하며 종료된 기록입니다.", conditions: ["기능 실행 실패", "부팅 중 서비스 중단"], causes: ["서비스 구성·파일 손상", "권한 또는 의존성 문제"], checks: ["이벤트 설명의 오류 코드 확인", "관련 서비스 의존성 확인", "앱 또는 Windows 구성 요소 복구"], warnings: ["오류 코드 없이 서비스만 재시작하면 재발 원인을 놓칠 수 있습니다."], relatedCodes: ["0x80070005"], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-service-7023.html"
    },
    {
      id: "7031", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "서비스가 예기치 않게 종료되었고 Windows가 재시작 같은 복구 작업을 예약한 기록입니다.", conditions: ["앱·네트워크 기능이 갑자기 중단"], causes: ["서비스 충돌", "관련 모듈·드라이버 오류"], checks: ["서비스 이름과 종료 횟수 확인", "Application Error 1000 동반 여부 확인", "관련 프로그램 복구"], warnings: ["반복 횟수가 증가할 때 조치하세요."], relatedCodes: [], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-service-7031.html"
    },
    {
      id: "7034", source: "Service Control Manager", level: "error", urgency: "driver",
      summary: "서비스가 예기치 않게 종료되었지만 자동 복구 동작 정보가 없는 기록입니다.", conditions: ["특정 기능 갑작스러운 종료"], causes: ["서비스 자체 충돌", "업데이트·구성 불일치"], checks: ["서비스 이름과 관련 앱 확인", "최근 업데이트 비교", "반복 여부 기록"], warnings: ["사용하지 않는 서비스인지 먼저 확인하세요."], relatedCodes: [], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-service-7034.html"
    },
    {
      id: "10016", source: "DistributedCOM", level: "warning", urgency: "info",
      summary: "특정 COM 구성 요소가 요청한 로컬 실행 또는 활성화 권한을 받지 못했다는 기록입니다. 정상 PC에서도 흔하며 대개 긴급하지 않습니다.", conditions: ["부팅·로그인·앱 실행 중 단발성"], causes: ["Windows 기본 권한 설계", "앱 구성 요소의 제한된 요청"], checks: ["실제 기능 장애가 함께 있는지 확인", "같은 CLSID가 반복되는지 기록", "문제가 없다면 관찰"], warnings: ["인터넷의 레지스트리·DCOM 권한 변경을 그대로 따라 하지 마세요."], relatedCodes: ["0x80070005"], relatedGuides: ["windows-app-not-launching.html"], detailPage: "event-distributedcom-10016.html"
    },
    {
      id: "162", source: "Volmgr", level: "error", urgency: "repeat-check",
      summary: "볼륨 관리자가 크래시 덤프 파일을 만드는 데 실패했다는 기록으로, 실제로는 예기치 않은 종료·재부팅과 함께 나타나는 경우가 많습니다.", conditions: ["갑작스러운 재부팅이나 강제 종료 뒤", "랜덤하게(며칠 간격으로) 전원이 꺼진 뒤"], causes: ["전원 공급(PSU) 불안정", "메인보드 칩셋 드라이버가 오래된 경우", "덤프 파일을 저장할 디스크 공간이나 페이지 파일 설정이 부족한 경우"], checks: ["같은 시각의 Kernel-Power(41)·WHEA 이벤트를 함께 확인하세요.", "메인보드 제조사 홈페이지에서 칩셋 드라이버를 최신 버전으로 업데이트하세요.", "설정 > 시스템 > 정보 > 고급 시스템 설정에서 가상 메모리(페이지 파일) 크기가 충분한지 확인하세요."], warnings: ["이 이벤트 자체가 원인을 확정하지는 않습니다 — 함께 나타난 다른 하드웨어 이벤트와 비교하세요."], relatedCodes: ["0x00000124"], relatedGuides: ["hardware-overheat-shutdown.html", "hardware-no-power.html"], detailPage: "event-volmgr-162.html"
    },
    {
      id: "15", source: "TPM", level: "error", urgency: "driver",
      summary: "TPM(보안 칩) 장치 드라이버가 TPM 하드웨어에서 복구할 수 없는 오류를 감지했다는 기록으로, BitLocker나 Windows Hello 같은 TPM 기반 기능을 쓸 수 없게 됩니다.", conditions: ["부팅 또는 로그인 중", "BitLocker·Windows Hello 사용 시도 중"], causes: ["메인보드 BIOS/UEFI 펌웨어가 오래되어 TPM 모듈과 호환성 문제가 있는 경우", "TPM 펌웨어 자체의 결함이나 초기화 실패", "메인보드의 TPM 모듈(내장 또는 별도 헤더 장착형) 접촉 불량"], checks: ["메인보드 제조사 홈페이지에서 최신 BIOS/UEFI 펌웨어로 업데이트하세요.", "tpm.msc를 실행해 TPM 상태를 확인하고, 필요하면 TPM 지우기(초기화)를 시도하세요.", "별도 TPM 모듈을 장착하는 메인보드라면 모듈이 헤더에 완전히 꽂혀 있는지 확인하세요."], warnings: ["TPM 지우기(초기화)는 BitLocker로 암호화된 드라이브의 복구 키를 반드시 먼저 백업한 뒤 진행하세요."], relatedCodes: [], relatedGuides: ["windows-11-upgrade-blocked.html"], detailPage: "event-tpm-15.html"
    },
    {
      id: "1014", source: "DNS Client Events", level: "warning", urgency: "driver",
      summary: "DNS 이름 확인 요청이 제한 시간 안에 응답하지 않았음을 나타냅니다.", conditions: ["웹사이트가 늦게 열림", "와이파이 전환 직후"], causes: ["DNS 서버 지연", "공유기·회선 문제", "VPN·보안 프로그램 영향"], checks: ["다른 사이트·장치에서도 재현되는지 확인", "공유기와 DNS 응답 비교", "VPN·보안 필터 점검"], warnings: ["인터넷이 정상이고 단발성이면 하드웨어 고장으로 보지 마세요."], relatedCodes: [], relatedGuides: ["hardware-wifi-disconnect.html"], detailPage: "event-dns-1014.html"
    },
    {
      id: "27", source: "e2fexpress", level: "warning", urgency: "driver",
      summary: "Intel 유선 네트워크 어댑터의 링크가 끊기거나 드라이버가 연결 변화를 기록한 경우가 많습니다.", conditions: ["랜 연결 끊김", "절전 복귀 뒤 네트워크 없음"], causes: ["케이블·공유기 포트", "어댑터 전원 관리", "네트워크 드라이버"], checks: ["이벤트 설명의 링크 상태 확인", "케이블·포트 교차", "전원 관리와 제조사 드라이버 점검"], warnings: ["원본 이름은 어댑터 모델에 따라 달라질 수 있습니다."], relatedCodes: ["0x0000009F"], relatedGuides: ["hardware-wifi-disconnect.html"], detailPage: "event-e2fexpress-27.html"
    },
    {
      id: "32", source: "e2fexpress", level: "warning", urgency: "driver",
      summary: "유선 네트워크 드라이버가 링크 또는 장치 상태 문제를 보고한 기록으로 나타날 수 있습니다.", conditions: ["부팅 후 네트워크 연결 지연", "대용량 전송 중 끊김"], causes: ["랜 케이블·포트", "드라이버·절전 설정", "공유기 협상 문제"], checks: ["이벤트 원문과 어댑터 이름 확인", "링크 속도·케이블 비교", "드라이버와 절전 설정 점검"], warnings: ["이벤트 ID만 같고 원본이 다르면 의미도 달라질 수 있습니다."], relatedCodes: [], relatedGuides: ["hardware-wifi-disconnect.html"], detailPage: "event-e2fexpress-32.html"
    }
  ],
  symptomDetails: {
    "auto-repair": {
      badge: "부팅",
      subtitle: "윈도우가 복구 화면으로 계속 돌아오는 경우",
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
        },
        {
          q: "복구 화면에서 '초기 상태로 되돌리기'를 하면 데이터가 지워지나요?",
          a: "옵션에 따라 다릅니다. '내 파일 유지'를 선택하면 개인 파일은 남고 앱만 제거되며, '모두 제거'를 선택하면 개인 파일까지 삭제되므로 반드시 확인 후 진행해야 합니다."
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
        },
        {
          q: "블루스크린이 뜬 직후 재부팅하면 저절로 괜찮아지기도 하는데 그냥 둬도 되나요?",
          a: "한 번으로 끝나지 않고 반복된다면 원인이 남아있는 것이므로, 발생 직후 이벤트 뷰어에서 오류 코드를 기록해 두는 것이 좋습니다."
        },
        {
          q: "메모리(RAM) 문제인지 어떻게 확인하나요?",
          a: "Windows 메모리 진단 도구(mdsched.exe)를 실행하면 재부팅 시 자동으로 메모리 검사를 진행할 수 있습니다."
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
        },
        {
          q: "탐색기가 멈추면 항상 재부팅해야 하나요?",
          a: "작업 관리자에서 '탐색기' 프로세스만 다시 시작해도 대부분 해결되며, 재부팅 없이 빠르게 복구할 수 있습니다."
        },
        {
          q: "특정 폴더에서만 멈추는 경우는 원인이 다른가요?",
          a: "네, 특정 폴더에서만 멈춘다면 해당 폴더 내 파일 인덱싱이나 미리보기 생성 문제일 가능성이 높아 인덱싱 옵션을 점검해야 합니다."
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
        },
        {
          q: "프린터 드라이버를 재설치하면 기존 설정이 사라지나요?",
          a: "네, 재설치 시 용지함·품질 설정 등 커스텀 설정은 초기화되므로 재설치 전 설정값을 메모해두는 것이 좋습니다."
        },
        {
          q: "무선 프린터와 유선 프린터는 점검 방법이 다른가요?",
          a: "무선 프린터는 네트워크 연결 상태를 먼저 확인해야 하고, 유선 프린터는 USB 포트나 케이블 손상 여부를 우선 점검해야 합니다."
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
        },
        {
          q: "재부팅 없이 화면만 꺼졌다가 돌아오는 것도 같은 원인인가요?",
          a: "전원 공급 문제보다는 그래픽 드라이버 크래시일 가능성이 높으며, 이벤트 뷰어에서 그래픽 드라이버 관련 오류를 확인해야 합니다."
        },
        {
          q: "그래픽카드를 바꾸지 않고도 확인할 수 있는 방법이 있나요?",
          a: "전원 공급 장치(PSU)의 여유 용량과 케이블 연결 상태를 먼저 확인하는 것이 비용 없이 점검할 수 있는 방법입니다."
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
        },
        {
          q: "모니터 전원 LED는 켜져 있는데 화면만 안 나오면 모니터 문제인가요?",
          a: "다른 PC나 케이블로 교차 테스트를 해보면 모니터와 본체 중 어느 쪽 문제인지 구분할 수 있습니다."
        },
        {
          q: "그래픽카드를 뺐다 끼워도 될까요?",
          a: "전원을 완전히 차단한 뒤 정전기 방지 조치를 하고 진행해야 하며, 익숙하지 않다면 무리해서 시도하지 않는 것이 안전합니다."
        }
      ],
      communityCases: [{
        title: "그래픽카드 교체로 해결한 사례",
        summary: "케이블 교체, 램 재장착, 내장그래픽 분리 테스트까지 다 해봐도 화면이 나오지 않던 사례가 있습니다. 그래픽카드를 다른 PC에 꽂아봤더니 그 PC에서도 출력이 되지 않아 그래픽카드 자체의 고장으로 확인됐고, 새 그래픽카드로 교체한 뒤 정상적으로 화면이 나왔습니다.",
        insight: "케이블·슬롯·메모리 점검을 모두 마쳤는데도 화면이 안 나온다면, 그래픽카드를 다른 PC에서 테스트해 보거나 다른 그래픽카드를 임시로 꽂아 교차 확인하는 것이 원인을 확정하는 가장 빠른 방법입니다."
      }]
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
        },
        {
          q: "SSD 펌웨어 업데이트가 실제로 도움이 되나요?",
          a: "제조사에서 배포하는 펌웨어 업데이트에는 인식 지연이나 호환성 버그 수정이 포함되는 경우가 많아 도움이 될 수 있습니다."
        },
        {
          q: "M.2 슬롯 위치에 따라 속도가 달라지나요?",
          a: "메인보드에 따라 특정 M.2 슬롯이 CPU가 아닌 칩셋을 경유해 대역폭을 공유하는 경우가 있어, 설명서에서 권장 슬롯을 확인하는 것이 좋습니다."
        }
      ],
      communityCases: [{
        title: "SSD 교체로 해결한 사례",
        summary: "슬롯을 바꾸고 BIOS 저장장치 모드까지 다시 설정해도 부팅 때마다 인식이 불규칙하게 늦어지던 사례가 있습니다. SMART 수치는 계속 정상으로 나왔지만, 다른 SSD로 교체하자 지연이 완전히 사라져 기존 SSD 컨트롤러의 노후화나 결함으로 추정됐습니다.",
        insight: "SMART가 정상이라고 해서 지연의 원인에서 완전히 배제할 수는 없습니다. 슬롯·케이블·BIOS 설정을 모두 확인했는데도 반복된다면, 여유 SSD로 교체 테스트를 해보는 것이 좋습니다."
      }]
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
        },
        {
          q: "USB 허브를 거치면 인식이 더 잘 안 되나요?",
          a: "허브를 거치면 전력 공급이 부족해질 수 있으므로, 문제가 있다면 본체 포트에 직접 연결해 재현 여부를 확인하는 것이 좋습니다."
        },
        {
          q: "특정 포트에서만 인식이 안 되는 경우는 무엇을 확인해야 하나요?",
          a: "해당 포트가 USB 2.0인지 3.0인지, 장치관리자에서 해당 포트 컨트롤러에 오류 표시(느낌표)가 있는지 확인해야 합니다."
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
        },
        {
          q: "업데이트를 계속 재시도하면 언젠가 성공하나요?",
          a: "일부는 재시도만으로 해결되지만, 반복 실패한다면 문제 해결사나 구성 요소 정리 없이는 같은 오류가 계속될 가능성이 높습니다."
        },
        {
          q: "업데이트 대기 중인 상태에서 강제 종료해도 되나요?",
          a: "설치 진행 중 강제 종료는 시스템 파일 손상 위험이 있으므로, 진행률이 멈춘 것이 확실할 때만 재부팅하는 것이 안전합니다."
        }
      ]
    },
    "win11-upgrade-blocked": {
      badge: "업그레이드",
      subtitle: "윈도우 10에서 11로 업그레이드가 시작되지 않거나 도중에 막힐 때",
      intro: [
        "윈도우 11 업그레이드가 안 되는 경우는 크게 두 가지입니다. 하나는 '이 PC에서 Windows 11을 실행할 수 없습니다' 같은 메시지와 함께 업그레이드 자체가 시작되지 않는 경우이고, 다른 하나는 다운로드·설치는 진행되다가 특정 단계에서 되돌아가는 경우입니다.",
        "첫 번째는 대부분 하드웨어 요구사항(TPM 2.0, 보안 부팅, 지원 CPU 목록) 중 하나를 충족하지 못해서 발생하고, 두 번째는 저장공간 부족이나 드라이버·주변기기 호환성 문제인 경우가 많습니다.",
        "이 페이지는 어느 단계에서 막히는지에 따라 확인할 항목을 나눠서 설명합니다."
      ],
      warnings: [
        "설정에서 업그레이드 항목 자체가 보이지 않는다.",
        "PC 상태 확인 앱이 '이 PC는 Windows 11을 실행할 수 없습니다'라고 표시한다.",
        "다운로드 후 설치가 특정 %에서 되돌아간다."
      ],
      checks: [
        {
          title: "PC 상태 확인 앱으로 정확한 사유 확인",
          why: "업그레이드가 막히는 이유가 TPM인지 CPU인지 저장공간인지에 따라 대응 방법이 완전히 다릅니다.",
          how: "Microsoft의 PC 상태 확인(PC Health Check) 앱을 설치해 실행하면 구체적으로 어떤 항목이 미충족인지 알려줍니다."
        },
        {
          title: "TPM 2.0과 보안 부팅 설정 확인",
          why: "TPM이 메인보드에 있어도 BIOS/UEFI에서 비활성화되어 있으면 미지원으로 표시됩니다.",
          how: "BIOS/UEFI로 진입해 TPM(또는 Intel PTT, AMD fTPM)과 Secure Boot 항목이 켜져 있는지 확인하세요."
        },
        {
          title: "저장공간과 파티션 방식 확인",
          why: "업그레이드는 기존 시스템을 보관하면서 진행되므로 평소보다 훨씬 많은 여유 공간이 필요합니다.",
          how: "최소 64GB 이상 여유 공간을 확보하고, 디스크가 GPT/UEFI 방식인지(MBR이면 변환 필요) 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "CPU가 지원 목록에 없을 때",
          text: "TPM과 보안 부팅을 모두 켜도 안 된다면 CPU 세대가 Microsoft의 공식 지원 목록(대략 8세대 이후 인텔, Ryzen 2000 시리즈 이후)에 없는 경우입니다. 이 경우 레지스트리 우회로 설치는 가능하지만 이후 업데이트 지원이 제한될 수 있어 신중해야 합니다."
        },
        {
          heading: "설치가 특정 %에서 되돌아갈 때",
          text: "요구사항은 충족했는데 설치 도중 실패하고 이전 버전으로 롤백된다면, 대개 호환되지 않는 드라이버나 주변기기, 또는 손상된 업데이트 캐시가 원인입니다. 미디어 만들기 도구로 설치 파일을 새로 받아 시도하면 캐시 문제는 배제할 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "TPM·CPU 요구사항 미충족일 때",
          text: "BIOS에서 TPM/Secure Boot를 켜는 것으로 해결되면 그대로 진행하고, CPU 자체가 목록에 없다면 우회 설치보다 현재 버전(윈도우 10)을 지원 종료 시점까지 유지하는 것도 합리적인 선택입니다."
        },
        {
          heading: "요구사항은 충족했는데 설치가 실패할 때",
          text: "저장공간을 늘리고 미디어 만들기 도구로 재시도해 보고, 특정 드라이버(그래픽, 저장장치 컨트롤러)를 최신 버전으로 업데이트한 뒤 다시 시도하세요."
        }
      ],
      examples: [
        "설정 > Windows 업데이트에 업그레이드 항목 자체가 나타나지 않음",
        "PC 상태 확인 앱에 'TPM 2.0을 지원하지 않습니다' 표시",
        "설치 진행률이 60~70%대에서 이전 버전으로 되돌아감"
      ],
      mistakes: [
        "TPM/CPU 요구사항을 확인하지 않고 무작정 우회 설치부터 시도하는 것",
        "저장공간을 확인하지 않고 설치 파일부터 반복 다운로드하는 것",
        "설치 실패 후 롤백 로그를 확인하지 않고 같은 방법을 반복하는 것"
      ],
      faq: [
        {
          q: "TPM 2.0이 없는 PC에서도 꼭 설치해야 하나요?",
          a: "필수는 아닙니다. Microsoft가 명시한 요구사항이므로, 없는 상태에서 우회 설치하면 이후 업데이트나 지원에서 제한이 있을 수 있다는 점을 감안해야 합니다."
        },
        {
          q: "메인보드에 TPM이 있는데도 인식이 안 됩니다.",
          a: "많은 메인보드가 TPM 관련 기능(Intel PTT, AMD fTPM)을 기본적으로 꺼둔 상태로 출고됩니다. BIOS/UEFI의 보안 또는 고급 설정 메뉴에서 활성화 여부를 확인하세요."
        },
        {
          q: "업그레이드 대신 새로 설치하면 문제가 해결되나요?",
          a: "하드웨어 요구사항 미충족이 원인이라면 새로 설치해도 같은 검사에 걸립니다. 다만 캐시나 드라이버 충돌이 원인이었다면 미디어 만들기 도구로 새로 설치하는 편이 더 확실할 수 있습니다."
        }
      ]
    },
    "gpu-not-detected": {
      badge: "그래픽",
      subtitle: "장착한 그래픽카드가 인식되지 않을 때",
      intro: [
        "그래픽카드를 새로 달았거나 케이스를 옮긴 뒤 화면이 아예 안 나오거나, 장치 관리자에는 보이는데 성능이 내장 그래픽 수준밖에 안 나오는 경우가 대표적인 '인식 안 됨' 증상입니다.",
        "가장 흔한 원인은 거창한 고장이 아니라 슬롯 접촉 불량이나 보조전원 연결 실수입니다. 드라이버 문제로 넘어가기 전에 물리적 연결부터 확인하는 것이 순서입니다.",
        "이 페이지는 화면이 아예 안 나오는 경우와, 화면은 나오지만 장치 관리자에서 제대로 인식이 안 되는 경우를 나눠서 설명합니다."
      ],
      warnings: [
        "모니터 케이블을 메인보드가 아닌 그래픽카드 포트에 꽂았는데도 화면이 안 나온다.",
        "장치 관리자에 그래픽카드가 느낌표나 알 수 없는 장치로 표시된다.",
        "카드를 장착한 뒤 성능이 내장 그래픽 수준으로만 나온다."
      ],
      checks: [
        {
          title: "카드 재장착 및 슬롯 교체",
          why: "PCIe 슬롯 접촉 불량이 가장 흔한 원인이며, 카드를 완전히 분리했다가 다시 장착하는 것만으로 해결되는 경우가 많습니다.",
          how: "전원을 끄고 카드를 완전히 분리한 뒤 슬롯의 이물질을 확인하고 다시 장착하세요. 메인보드에 슬롯이 여러 개라면 다른 슬롯에도 시도해 보세요."
        },
        {
          title: "보조전원 케이블 확인",
          why: "6핀·8핀 보조전원이 절반만 꽂히거나 연결되지 않으면 카드가 부팅되지 않거나 불안정하게 인식됩니다.",
          how: "PSU와 카드 사이 보조전원 커넥터가 끝까지 완전히 꽂혔는지 딸깍 소리가 날 때까지 확인하세요."
        },
        {
          title: "장치 관리자에서 인식 상태 확인",
          why: "화면은 내장 그래픽으로 나오더라도 장치 관리자에서 카드 자체는 확인할 수 있어 소프트웨어 문제인지 하드웨어 문제인지 구분됩니다.",
          how: "디스플레이 어댑터 항목에서 카드 이름 옆에 느낌표나 코드가 있는지, 아예 목록에 없는지 확인하세요."
        },
        {
          title: "드라이버 완전 제거 후 재설치",
          why: "이전 그래픽카드 드라이버가 남아 있으면 새 카드와 충돌해 인식에 실패할 수 있습니다.",
          how: "DDU(Display Driver Uninstaller) 같은 도구로 기존 드라이버를 안전 모드에서 완전히 제거한 뒤 제조사 최신 드라이버를 새로 설치하세요."
        }
      ],
      deeper: [
        {
          heading: "화면이 아예 안 나올 때",
          text: "모니터 케이블을 그래픽카드 포트에 꽂았는데도 신호가 없다면 카드 장착 상태나 보조전원을 먼저 의심해야 합니다. 메인보드 포트에 꽂으면 화면이 나온다면 카드가 인식되지 않고 있다는 뜻입니다."
        },
        {
          heading: "장치 관리자에는 보이는데 성능이 이상할 때",
          text: "카드 자체는 인식되지만 드라이버가 제대로 로드되지 않으면 3D 성능이 크게 떨어지거나 특정 프로그램에서만 인식하지 못하는 경우가 있습니다. 이때는 드라이버 재설치가 우선입니다."
        }
      ],
      decision: [
        {
          heading: "물리적 연결 문제일 때",
          text: "재장착과 보조전원 확인으로 해결되면 그대로 사용하면 되고, 다른 슬롯에서는 인식되는데 특정 슬롯에서만 안 된다면 메인보드 슬롯 자체의 문제일 수 있습니다."
        },
        {
          heading: "연결은 정상인데 계속 안 될 때",
          text: "다른 시스템에서도 같은 카드가 인식되지 않는다면 카드 자체의 고장 가능성이 높으므로 재설치보다 카드 교차 테스트를 우선하세요."
        }
      ],
      examples: [
        "그래픽카드 장착 직후 화면이 아예 안 나옴",
        "장치 관리자에 그래픽카드가 느낌표와 함께 표시됨",
        "다른 PC에 꽂았을 때도 인식되지 않음"
      ],
      mistakes: [
        "보조전원 연결 확인 없이 드라이버부터 재설치하는 것",
        "모니터 케이블이 메인보드 포트에 꽂혀 있는 걸 모르고 카드 고장으로 단정하는 것",
        "카드 재장착 전에 운영체제부터 재설치하는 것"
      ],
      faq: [
        {
          q: "화면은 나오는데 게임 성능이 너무 낮아요. 이것도 인식 안 된 건가요?",
          a: "네, 그래픽카드가 아닌 내장 그래픽으로 출력되고 있을 가능성이 높습니다. 모니터 케이블이 그래픽카드 포트에 꽂혀 있는지, 장치 관리자에 카드가 정상 표시되는지 확인하세요."
        },
        {
          q: "다른 그래픽카드를 안 써봤는데 고장인지 어떻게 알 수 있나요?",
          a: "같은 슬롯에서 다른 카드가 정상 인식되면 슬롯은 정상이고 원래 카드가 의심됩니다. 반대로 다른 카드도 같은 증상이면 슬롯이나 보조전원, 파워서플라이 쪽을 더 봐야 합니다."
        }
      ]
    },
    "screen-flicker": {
      badge: "그래픽",
      subtitle: "화면이 주기적으로 깜빡이거나 떨릴 때",
      intro: [
        "화면 깜빡임은 화면이 아예 안 나오는 것과 달리, 정상적으로 보이다가 순간적으로 어두워지거나 줄무늬가 지나가는 증상입니다. 원인은 소프트웨어(드라이버·주사율)와 하드웨어(케이블·패널) 양쪽에 걸쳐 있습니다.",
        "가장 먼저 구분해야 할 것은 특정 프로그램에서만 발생하는지, 바탕화면에서도 발생하는지입니다. 특정 프로그램에서만 발생하면 드라이버·주사율 문제일 가능성이 크고, 항상 발생하면 케이블이나 하드웨어 쪽 비중이 높아집니다.",
        "이 페이지는 소프트웨어 설정부터 하드웨어 점검까지 순서대로 안내합니다."
      ],
      warnings: [
        "특정 게임이나 영상 재생 중에만 깜빡인다.",
        "바탕화면에서도 항상 깜빡이거나 줄무늬가 보인다.",
        "케이블을 건드리면 깜빡임이 심해지거나 사라진다."
      ],
      checks: [
        {
          title: "그래픽 드라이버 업데이트 또는 롤백",
          why: "드라이버 버전에 따라 특정 프로그램에서 깜빡임이 발생하는 알려진 문제가 있을 수 있습니다.",
          how: "최신 드라이버로 업데이트해 재현 여부를 확인하고, 최근 업데이트 이후 시작됐다면 이전 버전으로 롤백해 비교하세요."
        },
        {
          title: "주사율 설정 확인",
          why: "모니터가 지원하지 않는 주사율로 설정되어 있으면 화면이 불안정하게 깜빡일 수 있습니다.",
          how: "디스플레이 설정에서 새로 고침 빈도가 모니터 공식 지원 사양과 일치하는지 확인하세요."
        },
        {
          title: "영상 케이블 재연결·교체",
          why: "HDMI·DP 케이블 연결이 헐겁거나 손상되면 신호가 끊기면서 깜빡임으로 나타납니다.",
          how: "케이블 양쪽을 다시 꽂아보고, 여유분이 있다면 다른 케이블로 교체해 재현 여부를 확인하세요."
        },
        {
          title: "적응형 밝기·절전 설정 끄기",
          why: "노트북의 자동 밝기 조절 기능이 밝기를 계속 바꾸면서 깜빡이는 것처럼 보일 수 있습니다.",
          how: "전원 옵션에서 적응형 밝기(화면 밝기 자동 조절) 기능을 꺼서 재현 여부를 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "특정 프로그램에서만 깜빡일 때",
          text: "게임이나 특정 앱에서만 깜빡인다면 해당 프로그램의 전체 화면 최적화 설정이나 그래픽 드라이버의 특정 기능(가변 주사율 등)과 충돌하는 경우가 많습니다."
        },
        {
          heading: "노트북 화면 자체의 문제일 때",
          text: "외부 모니터에 연결했을 때는 문제가 없고 노트북 내장 화면에서만 깜빡인다면 디스플레이 패널이나 연결 케이블(플렉스 케이블) 노후화를 의심해야 합니다."
        }
      ],
      decision: [
        {
          heading: "설정 변경으로 해결될 때",
          text: "주사율 조정이나 적응형 밝기를 끄는 것으로 해결되면 소프트웨어·설정 문제였던 것이므로 그대로 사용하면 됩니다."
        },
        {
          heading: "케이블 교체로도 해결되지 않을 때",
          text: "다른 케이블, 다른 포트에서도 계속 깜빡인다면 모니터나 그래픽카드, 노트북 패널 자체의 하드웨어 점검이 필요합니다."
        }
      ],
      examples: [
        "게임 실행 중에만 화면이 순간적으로 어두워짐",
        "노트북 화면 각도를 바꾸면 깜빡임이 심해짐",
        "외부 모니터 연결 시에는 문제없음"
      ],
      mistakes: [
        "주사율 설정을 확인하지 않고 바로 모니터 교체를 고려하는 것",
        "케이블 상태를 점검하지 않고 드라이버만 계속 재설치하는 것"
      ],
      faq: [
        {
          q: "노트북 화면 각도를 바꾸면 깜빡임이 심해지는데 왜 그런가요?",
          a: "화면과 본체를 잇는 연결 케이블이 눌리거나 헐거워졌을 가능성이 있습니다. 이 경우 소프트웨어 문제가 아니라 하드웨어 점검(서비스센터 방문)이 필요합니다."
        },
        {
          q: "외부 모니터는 괜찮은데 노트북 화면만 깜빡여요.",
          a: "그래픽카드나 드라이버보다 노트북 자체의 디스플레이 패널이나 연결부 쪽 문제일 가능성이 높습니다."
        }
      ]
    },
    "activation-error": {
      badge: "정품 인증",
      subtitle: "윈도우 정품 인증이 안 되거나 오류가 반복될 때",
      intro: [
        "정품 인증 오류는 크게 두 가지 상황으로 나뉩니다. 이전에 정상적으로 인증되어 있었는데 하드웨어를 교체한 뒤 인증이 풀린 경우와, 처음부터 제품 키나 라이선스 자체에 문제가 있는 경우입니다.",
        "메인보드를 교체했다면 디지털 라이선스가 이전 하드웨어 정보에 묶여 있어서 자동으로 재인증되지 않는 경우가 가장 흔합니다. 이때는 제품 키를 새로 입력하는 것보다 Microsoft 계정 연결 여부를 먼저 확인하는 것이 빠릅니다.",
        "이 페이지는 정확한 오류 코드를 먼저 확인한 뒤, 상황별로 점검 순서를 나눠서 설명합니다."
      ],
      warnings: [
        "설정 > 정품 인증 화면에 오류 코드나 '해당 없음'이 표시된다.",
        "최근 메인보드나 CPU를 교체한 적이 있다.",
        "같은 제품 키로 다른 PC에서도 윈도우를 설치한 적이 있다."
      ],
      checks: [
        {
          title: "정확한 오류 코드 확인",
          why: "오류 코드에 따라 원인이 완전히 다르기 때문에, '안 된다'는 상태보다 정확한 코드를 먼저 확인해야 합니다.",
          how: "설정 > 시스템 > 정품 인증에서 표시되는 오류 코드와 문구를 그대로 기록하세요."
        },
        {
          title: "정품 인증 문제 해결사 실행",
          why: "Microsoft가 제공하는 문제 해결사가 흔한 원인(하드웨어 변경, 라이선스 불일치)을 자동으로 진단해줍니다.",
          how: "정품 인증 설정 화면에서 '문제 해결' 버튼을 눌러 안내에 따라 진행하세요."
        },
        {
          title: "Microsoft 계정 연결 여부 확인",
          why: "디지털 라이선스가 Microsoft 계정에 연결되어 있으면 하드웨어를 교체해도 문제 해결사를 통해 재인증이 가능합니다.",
          how: "설정에서 현재 계정이 Microsoft 계정으로 로그인되어 있는지, 이전에 라이선스를 연결해 둔 적이 있는지 확인하세요."
        },
        {
          title: "네트워크·DNS 연결 확인",
          why: "인증 서버에 연결하지 못하면 정상적인 라이선스도 일시적으로 인증되지 않은 것처럼 표시될 수 있습니다.",
          how: "인터넷 연결 상태를 확인하고, DNS 문제가 의심되면 공용 DNS(8.8.8.8 등)로 바꿔 재시도하세요."
        }
      ],
      deeper: [
        {
          heading: "하드웨어 교체 후 인증이 풀렸을 때",
          text: "메인보드 교체는 윈도우 입장에서 '다른 PC'로 인식되는 가장 큰 변경입니다. Microsoft 계정에 라이선스가 연결되어 있었다면 문제 해결사에서 '최근 이 장치의 하드웨어를 변경했습니다'를 선택해 재인증할 수 있습니다."
        },
        {
          heading: "제품 키 자체에 문제가 있을 때",
          text: "중고 PC나 저가로 구매한 키의 경우, 이미 다른 기기에서 사용 중이거나 볼륨 라이선스(기업용)여서 개인 재설치에 사용할 수 없는 경우가 있습니다. 이 경우 문제 해결사로는 해결되지 않습니다."
        }
      ],
      decision: [
        {
          heading: "하드웨어 변경이 원인일 때",
          text: "Microsoft 계정 연결과 문제 해결사만으로 대부분 해결됩니다. 별도로 제품 키를 다시 구매할 필요는 없습니다."
        },
        {
          heading: "문제 해결사로도 안 될 때",
          text: "제품 키의 출처(정식 구매 여부)를 다시 확인해야 하며, 특히 저가로 구매한 키라면 유효성 자체를 의심해야 합니다."
        }
      ],
      examples: [
        "메인보드 교체 후 정품 인증이 '해당 없음'으로 표시됨",
        "설치 직후부터 특정 오류 코드와 함께 인증이 안 됨",
        "인터넷에 연결되어 있는데도 인증 서버 연결 오류가 뜸"
      ],
      mistakes: [
        "오류 코드를 확인하지 않고 무작정 제품 키를 재입력하는 것",
        "Microsoft 계정 연결 여부를 확인하지 않고 재설치부터 시도하는 것",
        "출처가 불분명한 제품 키의 유효성을 의심하지 않는 것"
      ],
      faq: [
        {
          q: "메인보드만 바꿨는데 왜 인증이 풀리나요?",
          a: "윈도우의 디지털 라이선스는 하드웨어 정보(특히 메인보드)를 기준으로 활성화 상태를 기억합니다. 메인보드가 바뀌면 다른 PC로 인식되어 재인증이 필요합니다."
        },
        {
          q: "Microsoft 계정에 연결해두지 않았으면 어떻게 하나요?",
          a: "이 경우 문제 해결사의 자동 재인증이 어려울 수 있어, 정품 제품 키를 가지고 있다면 직접 입력하거나 Microsoft 고객센터 문의가 필요할 수 있습니다."
        }
      ]
    },
    "printer-offline": {
      badge: "프린터",
      subtitle: "이미 설치된 프린터가 오프라인으로 표시될 때",
      intro: [
        "이 증상은 프린터를 처음 설치하는 과정에서 막히는 것과는 다릅니다. 어제까지 잘 되던 프린터가 갑자기 '오프라인'으로 표시되거나 인쇄 대기열에서 진행되지 않는 경우입니다.",
        "가장 흔한 원인은 인쇄 스풀러 서비스가 멈췄거나, 프린터가 절전 모드로 들어가 연결이 끊긴 경우입니다. 드라이버를 재설치하기 전에 이 두 가지부터 확인하면 대부분 빠르게 해결됩니다.",
        "네트워크 프린터(와이파이)와 USB 직결 프린터는 원인이 조금씩 다르므로 연결 방식에 따라 나눠서 확인하는 것이 좋습니다."
      ],
      warnings: [
        "프린터 상태 표시가 '오프라인'으로 바뀌어 있다.",
        "인쇄를 눌러도 대기열에만 쌓이고 진행되지 않는다.",
        "프린터 전원은 켜져 있는데 컴퓨터에서 연결이 안 된 것처럼 표시된다."
      ],
      checks: [
        {
          title: "인쇄 스풀러 서비스 재시작",
          why: "인쇄 작업을 관리하는 스풀러 서비스가 멈추면 프린터가 정상이어도 오프라인으로 표시됩니다.",
          how: "서비스(services.msc)에서 Print Spooler를 찾아 재시작하거나, 정지 상태라면 시작으로 바꾸세요."
        },
        {
          title: "프린터 전원·연결 상태 확인",
          why: "프린터가 절전 모드에 들어갔거나 와이파이·USB 연결이 끊기면 오프라인으로 표시됩니다.",
          how: "프린터 전원을 껐다 켜고, 네트워크 프린터라면 같은 와이파이에 연결되어 있는지 프린터 자체 화면에서 확인하세요."
        },
        {
          title: "기본 프린터로 다시 설정",
          why: "오프라인 모드로 잘못 전환되어 있거나 다른 프린터가 기본으로 설정되어 있으면 인쇄가 엉뚱한 곳으로 전송될 수 있습니다.",
          how: "설정 > 프린터에서 '오프라인 프린터 사용' 옵션이 켜져 있는지 확인하고, 해당 프린터를 기본 프린터로 다시 지정하세요."
        },
        {
          title: "프린터 드라이버 재설치",
          why: "드라이버가 최근 업데이트와 충돌하면 정상 연결 상태에서도 오프라인으로 오인식될 수 있습니다.",
          how: "프린터를 제거한 뒤 제조사 최신 드라이버로 다시 설치하세요."
        }
      ],
      deeper: [
        {
          heading: "네트워크(와이파이) 프린터일 때",
          text: "공유기를 재시작했거나 프린터의 IP 주소가 바뀌면 컴퓨터가 이전 주소로 계속 연결을 시도해 오프라인으로 표시될 수 있습니다. 프린터 속성의 포트 설정에서 IP 주소가 현재와 일치하는지 확인하세요."
        },
        {
          heading: "USB 직결 프린터일 때",
          text: "USB 포트나 케이블 접촉 불량도 같은 증상을 만듭니다. 다른 USB 포트에 꽂아보고, 허브를 거치지 않고 본체에 직접 연결해 재현 여부를 확인하세요."
        }
      ],
      decision: [
        {
          heading: "스풀러 재시작으로 해결될 때",
          text: "일시적인 서비스 오류였던 것이므로 그대로 사용하면 되지만, 반복된다면 스풀러를 자동 재시작하도록 서비스 복구 옵션을 설정해두면 편합니다."
        },
        {
          heading: "IP·연결 문제로 반복될 때",
          text: "네트워크 프린터라면 공유기에서 프린터에 고정 IP를 할당해두면 IP 변경으로 인한 오프라인 표시를 예방할 수 있습니다."
        }
      ],
      examples: [
        "공유기를 재시작한 뒤부터 프린터가 오프라인으로 표시됨",
        "인쇄 대기열에 문서가 쌓이기만 하고 출력되지 않음",
        "다른 PC에서는 정상 인쇄되는데 이 PC에서만 오프라인으로 뜸"
      ],
      mistakes: [
        "스풀러 서비스 상태를 확인하지 않고 드라이버부터 재설치하는 것",
        "네트워크 프린터의 IP 주소 변경 가능성을 확인하지 않는 것",
        "오프라인 프린터 사용 옵션이 켜져 있는 걸 모르고 계속 재부팅만 하는 것"
      ],
      faq: [
        {
          q: "프린터는 정상인데 왜 컴퓨터에서만 오프라인으로 뜨나요?",
          a: "인쇄 스풀러 서비스 문제이거나, 컴퓨터가 기억하고 있는 프린터 주소(IP 또는 포트)가 실제와 달라졌을 가능성이 높습니다."
        },
        {
          q: "다른 PC에서는 잘 되는데 제 PC에서만 안 됩니다.",
          a: "이 경우 프린터 자체보다 해당 PC의 스풀러 서비스나 드라이버, 저장된 포트 설정 문제일 가능성이 큽니다."
        }
      ]
    },
    "ms-account-login-fail": {
      badge: "계정",
      subtitle: "Microsoft 계정으로 로그인이 안 되거나 반복 실패할 때",
      intro: [
        "이 증상은 윈도우 정품 인증 문제와는 다릅니다. 정품 인증은 되어 있지만 Microsoft 계정 자체에 로그인이 안 되거나, 로그인 화면에서 비밀번호를 입력해도 계속 튕기는 경우입니다.",
        "가장 먼저 확인할 것은 이 PC만의 문제인지, 계정 자체의 문제인지 구분하는 것입니다. 웹브라우저에서 같은 계정으로 로그인해보면 범위를 빠르게 좁힐 수 있습니다.",
        "이 페이지는 계정 자체 문제와 PC(윈도우) 쪽 문제로 나눠서 점검 순서를 설명합니다."
      ],
      warnings: [
        "로그인 화면에서 비밀번호를 입력해도 계속 실패한다.",
        "2단계 인증 코드가 오지 않거나 인증 후에도 로그인이 안 된다.",
        "웹브라우저에서는 같은 계정으로 정상 로그인된다."
      ],
      checks: [
        {
          title: "웹브라우저에서 로그인 시도",
          why: "브라우저에서 정상 로그인되면 계정 자체는 문제없고 윈도우(이 PC) 쪽 설정이 원인이라는 뜻입니다.",
          how: "account.microsoft.com에 같은 계정으로 로그인해 정상 여부를 먼저 확인하세요."
        },
        {
          title: "시스템 시간·시간대 확인",
          why: "PC의 시간이 실제 시간과 크게 어긋나면 보안 인증 절차가 실패해 로그인이 막힐 수 있습니다.",
          how: "설정에서 시간을 자동으로 설정하도록 되어 있는지, 시간대가 정확한지 확인하세요."
        },
        {
          title: "자격 증명 관리자 캐시 삭제",
          why: "이전에 저장된 로그인 정보가 바뀐 비밀번호와 충돌하면 계속 로그인에 실패할 수 있습니다.",
          how: "제어판의 자격 증명 관리자에서 Microsoft 계정 관련 항목을 제거한 뒤 다시 로그인하세요."
        },
        {
          title: "Microsoft 서비스 상태 확인",
          why: "Microsoft 쪽 서비스 장애로 일시적으로 로그인이 안 되는 경우도 있어, PC 문제가 아닐 수도 있습니다.",
          how: "Microsoft 365 상태 페이지나 커뮤니티에서 같은 시간대 장애 보고가 있는지 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "2단계 인증 문제일 때",
          text: "인증 앱의 시간이 PC와 어긋나 있으면 코드가 계속 틀린 것으로 처리될 수 있습니다. 인증 앱과 PC 모두 자동 시간 동기화를 켜두면 대부분 해결됩니다."
        },
        {
          heading: "계정 보안 확인이 뜰 때",
          text: "평소와 다른 위치·기기에서 로그인을 시도하면 Microsoft가 추가 본인 확인을 요구할 수 있습니다. 이 경우 등록된 이메일이나 전화번호로 코드를 받아 진행해야 합니다."
        }
      ],
      decision: [
        {
          heading: "브라우저에서도 로그인이 안 될 때",
          text: "계정 자체의 문제이므로 Microsoft 계정 복구 절차를 진행해야 하며, PC 설정을 바꿔도 해결되지 않습니다."
        },
        {
          heading: "브라우저에서는 되는데 PC에서만 안 될 때",
          text: "시간 동기화와 자격 증명 캐시부터 확인하고, 그래도 안 되면 윈도우에서 계정을 제거한 뒤 다시 추가하는 것을 고려하세요."
        }
      ],
      examples: [
        "비밀번호는 맞는데 로그인 화면에서 계속 튕김",
        "2단계 인증 코드를 입력해도 다시 로그인 화면으로 돌아감",
        "웹브라우저의 Microsoft 계정 페이지에서는 정상 로그인됨"
      ],
      mistakes: [
        "시스템 시간이 맞는지 확인하지 않고 비밀번호만 계속 재설정하는 것",
        "브라우저에서 먼저 확인하지 않고 바로 PC를 초기화하는 것"
      ],
      faq: [
        {
          q: "비밀번호를 새로 설정했는데도 계속 로그인이 안 됩니다.",
          a: "PC에 저장된 이전 로그인 정보(자격 증명 캐시)가 남아있을 수 있습니다. 자격 증명 관리자에서 관련 항목을 정리한 뒤 다시 시도해 보세요."
        },
        {
          q: "2단계 인증 코드가 계속 틀렸다고 나옵니다.",
          a: "인증 앱과 PC의 시간이 어긋나 있을 가능성이 높습니다. 두 기기 모두 자동 시간 동기화가 켜져 있는지 확인하세요."
        }
      ]
    },
    "update-network-broken": {
      badge: "업데이트",
      subtitle: "윈도우 업데이트 이후 인터넷·네트워크가 안 될 때",
      intro: [
        "이 증상은 와이파이가 가끔 끊기는 것과는 다릅니다. 업데이트를 설치하고 재부팅한 직후부터 인터넷이 아예 안 되거나, 장치 관리자에 있던 네트워크 어댑터 자체가 사라진 것처럼 보이는 경우입니다.",
        "가장 흔한 원인은 업데이트가 네트워크 드라이버를 기본 드라이버로 되돌리거나, 서드파티 드라이버와 호환되지 않는 버전으로 덮어쓰는 경우입니다. 유선(이더넷)과 무선(와이파이) 중 어느 쪽이 안 되는지에 따라 확인 순서가 달라집니다.",
        "이 페이지는 장치 관리자에서 어댑터가 보이는지 여부를 기준으로 원인을 나눠서 설명합니다."
      ],
      warnings: [
        "업데이트·재부팅 직후부터 인터넷이 전혀 안 된다.",
        "장치 관리자의 네트워크 어댑터 목록에 있던 항목이 사라졌다.",
        "다른 기기는 같은 공유기에 정상 연결된다."
      ],
      checks: [
        {
          title: "장치 관리자에서 어댑터 인식 여부 확인",
          why: "어댑터가 아예 안 보이는지, 느낌표와 함께 남아있는지에 따라 원인과 해결 방법이 완전히 달라집니다.",
          how: "장치 관리자 > 네트워크 어댑터 항목에서 이더넷·와이파이 어댑터가 표시되는지, 알 수 없는 장치로 남아있는지 확인하세요."
        },
        {
          title: "네트워크 어댑터 드라이버 롤백 또는 재설치",
          why: "업데이트가 설치한 새 드라이버가 문제라면, 이전 버전으로 되돌리거나 제조사 드라이버로 재설치하는 것이 가장 빠른 해결책입니다.",
          how: "장치 관리자에서 어댑터 속성 > 드라이버 탭 > 이전 드라이버로 롤백을 시도하고, 옵션이 없다면 제조사 사이트에서 최신 드라이버를 받아 재설치하세요."
        },
        {
          title: "네트워크 스택 초기화",
          why: "드라이버는 정상인데 설정 값이 꼬여 있으면 winsock·IP 스택 초기화로 해결되는 경우가 많습니다.",
          how: "명령 프롬프트(관리자)에서 netsh winsock reset과 netsh int ip reset을 차례로 실행한 뒤 재부팅하세요."
        },
        {
          title: "VPN·보안 프로그램 임시 비활성화",
          why: "VPN이나 보안 소프트웨어의 네트워크 필터 드라이버가 업데이트와 충돌하면 정상 어댑터도 연결에 실패할 수 있습니다.",
          how: "VPN 클라이언트나 서드파티 보안 프로그램을 임시로 제거하거나 비활성화한 뒤 재현 여부를 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "어댑터 자체가 사라졌을 때",
          text: "장치 관리자에 어댑터가 아예 없다면 드라이버 설정보다 드라이버 자체가 제거된 경우입니다. '숨겨진 장치 표시'를 켜서 회색으로 남아있는 항목이 있는지 확인하고, 있다면 제거 후 재부팅해 자동 재설치를 유도하세요."
        },
        {
          heading: "유선은 되는데 무선만 안 될 때",
          text: "이더넷은 정상인데 와이파이만 안 된다면 무선 어댑터 드라이버 문제일 가능성이 높고, 반대로 둘 다 안 된다면 네트워크 스택 전체나 보안 소프트웨어 쪽 문제일 가능성이 큽니다."
        }
      ],
      decision: [
        {
          heading: "드라이버 롤백·재설치로 해결될 때",
          text: "업데이트가 배포한 드라이버 자체가 문제였던 것이므로, 이후 자동 업데이트로 드라이버가 다시 덮어써지지 않도록 드라이버 자동 업데이트를 잠시 차단해두는 것도 방법입니다."
        },
        {
          heading: "그래도 해결되지 않을 때",
          text: "해당 업데이트를 제거(이전 버전으로 롤백)한 뒤 재현 여부를 확인하고, 같은 업데이트에서 다른 사용자들도 같은 문제를 보고했는지 확인하세요."
        }
      ],
      examples: [
        "업데이트 후 재부팅하니 와이파이 목록 자체가 안 보임",
        "장치 관리자에 '알 수 없는 장치'로 네트워크 어댑터가 표시됨",
        "유선 랜은 되는데 와이파이만 계속 연결 안 됨으로 표시됨"
      ],
      mistakes: [
        "어댑터가 실제로 사라졌는지 확인하지 않고 공유기부터 재설정하는 것",
        "드라이버 롤백을 시도하지 않고 바로 윈도우를 재설치하는 것",
        "VPN·보안 프로그램의 영향을 배제하지 않고 하드웨어 고장으로 단정하는 것"
      ],
      faq: [
        {
          q: "업데이트 제거(롤백)를 하면 인터넷이 다시 되나요?",
          a: "네트워크 드라이버 자체가 업데이트로 바뀐 경우라면 업데이트 제거로 이전 상태로 돌아가 해결되는 경우가 많습니다. 다만 이후 같은 업데이트가 다시 설치되지 않도록 임시로 차단해두는 것이 좋습니다."
        },
        {
          q: "다른 기기는 같은 와이파이에 잘 연결되는데 제 PC만 안 됩니다.",
          a: "공유기 문제가 아니라 이 PC의 네트워크 드라이버나 어댑터 자체의 문제일 가능성이 높습니다. 장치 관리자에서 어댑터 상태부터 확인하세요."
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
        },
        {
          q: "시작 프로그램을 모두 꺼도 괜찮나요?",
          a: "보안 프로그램이나 드라이버 관련 항목은 남겨두고, 불필요한 업데이트 도우미나 알림 프로그램 위주로 끄는 것이 안전합니다."
        },
        {
          q: "SSD로 교체하면 부팅 속도가 확실히 빨라지나요?",
          a: "HDD 대비 부팅 속도가 크게 개선되는 경우가 많지만, 시작 프로그램이 지나치게 많다면 SSD로 바꿔도 지연이 남을 수 있습니다."
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
        },
        {
          q: "작업표시줄만 멈추고 다른 프로그램은 정상 작동하는데 재부팅해야 하나요?",
          a: "탐색기(explorer.exe) 프로세스만 재시작하면 재부팅 없이 복구되는 경우가 많습니다."
        },
        {
          q: "알림 영역 아이콘이 사라지는 것도 같은 문제인가요?",
          a: "네, 작업표시줄 관련 프로세스가 불안정할 때 함께 나타나는 증상으로, 탐색기 재시작으로 함께 해결되는 경우가 많습니다."
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
        },
        {
          q: "유선으로 바꾸면 확실히 해결되나요?",
          a: "무선 신호나 드라이버 문제가 원인이라면 유선 연결로 우회할 수 있지만, 근본 원인 해결을 원한다면 무선 드라이버와 공유기 설정을 점검해야 합니다."
        },
        {
          q: "공유기를 재부팅하면 왜 일시적으로 좋아지나요?",
          a: "공유기 내부 메모리나 연결 세션이 초기화되며 일시적으로 안정화되지만, 원인이 남아있다면 재발할 수 있습니다."
        }
      ],
      communityCases: [{
        title: "무선랜카드 교체로 해결한 사례",
        summary: "드라이버 재설치, 절전 옵션 해제, 공유기 채널 변경까지 다 해봐도 몇 분마다 연결이 끊기던 사례가 있습니다. 다른 기기는 같은 공유기에서 안정적으로 연결됐고, 결국 내장 무선랜카드 자체의 결함으로 확인되어 M.2 무선랜카드를 새 제품으로 교체한 뒤 끊김이 사라졌습니다.",
        insight: "드라이버와 전원 설정을 다 점검했는데도 유독 이 PC에서만 반복된다면, 같은 공유기에서 다른 기기는 안정적인지 먼저 비교해보고 무선랜카드 자체의 하드웨어 결함도 의심해볼 필요가 있습니다."
      }]
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
        },
        {
          q: "그냥 방치하면 하드웨어가 고장 나나요?",
          a: "과열로 인한 강제 종료가 반복되면 부품 수명에 영향을 줄 수 있어, 방치하지 말고 쿨링 상태를 점검하는 것이 좋습니다."
        },
        {
          q: "노트북과 데스크탑의 점검 방법이 다른가요?",
          a: "노트북은 통풍구 먼지와 받침대 사용 여부를, 데스크탑은 케이스 팬 배치와 서멀 그리스 상태를 우선 점검해야 합니다."
        }
      ],
      communityCases: [{
        title: "CPU 쿨러 교체로 해결한 사례",
        summary: "먼지 청소와 서멀 그리스 재도포까지 했는데도 특정 부하(인코딩, 게임)에서 반복적으로 전원이 꺼지던 사례가 있습니다. 온도 로그를 보니 부하가 걸리자마자 순식간에 임계 온도까지 치솟았고, 오래된 쿨러의 히트파이프 성능이 저하된 것으로 확인되어 새 쿨러로 교체한 뒤 온도가 안정되며 재발하지 않았습니다.",
        insight: "먼지 청소와 서멀 재도포로도 온도가 잡히지 않는다면, 쿨러 자체(특히 오래 사용한 히트파이프 방식)의 냉각 성능 저하를 의심해볼 필요가 있습니다."
      }]
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
        },
        {
          q: "재생 장치가 여러 개면 소리가 안 날 수도 있나요?",
          a: "네, 기본 재생 장치가 실제 사용 중인 장치와 다르게 지정되어 있으면 소리가 나지 않을 수 있어 기본 장치 설정을 확인해야 합니다."
        },
        {
          q: "드라이버를 재설치하면 이전 설정이 사라지나요?",
          a: "이퀄라이저나 음향 효과 등 커스텀 설정은 초기화될 수 있으므로, 재설치 전 설정을 기록해두는 것이 좋습니다."
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
        },
        {
          q: "절전 모드를 아예 쓰지 않는 게 나을까요?",
          a: "완전히 끄기보다는 원인을 점검해 해결하는 것이 배터리·전력 절약 측면에서 유리하며, 절전을 끄는 것은 임시방편으로만 권장합니다."
        },
        {
          q: "그래픽 드라이버 문제인지는 어떻게 확인하나요?",
          a: "이벤트 뷰어에서 절전 복귀 시점에 그래픽 드라이버 관련 오류(예: 0x0000009F)가 기록되어 있는지 확인하면 원인을 좁힐 수 있습니다."
        }
      ]
    },
    "gpu-coil-whine": {
      badge: "소음",
      subtitle: "게임이나 고사양 작업 중 그래픽카드에서 고주파 소음이 날 때",
      intro: [
        "게임 중 그래픽카드에서 \"삐-\" 또는 \"지지직\" 하는 고주파 소음이 들리면 고장부터 의심하기 쉽지만, 대부분은 코일 위스파(coil whine)라고 불리는 정상적인 전기적 현상입니다. 전류가 그래픽카드 인덕터(코일)를 지나며 코일이 미세하게 진동해 나는 소리로, 정도의 차이만 있을 뿐 거의 모든 그래픽카드에서 어느 정도는 발생합니다.",
        "관건은 이 소음이 \"정상 범위\"인지, 아니면 \"점검이 필요한 신호\"인지를 구분하는 것입니다. 소음만 있고 성능·화면에 다른 이상이 전혀 없다면 대부분 신경 쓰지 않아도 되는 수준이고, 최근 들어 갑자기 커졌거나 다른 증상이 동반된다면 점검 대상입니다.",
        "특히 프레임이 매우 높게 나오는 가벼운 게임(로딩 화면, 메뉴 화면 등)에서 GPU가 초당 수백 프레임을 그리려고 하면서 부하가 순간적으로 튈 때 소음이 더 크게 들리는 경우가 흔합니다."
      ],
      warnings: [
        "소음이 최근 들어 눈에 띄게 커졌다.",
        "소음과 함께 성능 저하나 화면 깨짐이 나타난다.",
        "소음과 함께 재부팅이나 블랙아웃이 동반된다."
      ],
      checks: [
        {
          title: "발생 조건 좁히기",
          why: "항상 나는지, 특정 상황에서만 나는지에 따라 정상 범위 여부가 갈립니다.",
          how: "가벼운 게임(높은 fps)에서 프레임 제한을 걸어 GPU 부하를 낮췄을 때 소음이 줄어드는지 확인하세요."
        },
        {
          title: "동반 증상 확인",
          why: "소음 단독이면 대부분 정상, 다른 증상이 겹치면 점검 대상입니다.",
          how: "성능 저하, 화면 깨짐, 재부팅처럼 다른 이상이 함께 나타나는지 확인하세요."
        },
        {
          title: "소음 위치 구분",
          why: "코일 소음과 팬 소음은 원인과 대응이 다릅니다.",
          how: "부하를 걸지 않은 유휴 상태에서도 소리가 나는지, 팬 자체 소음인지 코일 소음인지 위치를 좁혀보세요."
        },
        {
          title: "언더볼팅·파워 리밋으로 완화 시도",
          why: "전류 변화 폭을 줄이면 코일 진동과 소음이 함께 줄어드는 경우가 많습니다.",
          how: "MSI 애프터버너 같은 도구로 코어 전압을 낮추거나 파워 리밋을 몇 % 낮춰본 뒤 소음 변화를 비교하세요."
        }
      ],
      deeper: [
        {
          heading: "코일 위스파는 왜 생기나요",
          text: "전류가 인덕터(코일)를 통과할 때 코일 내부의 도선이 자기장의 영향으로 미세하게 진동하면서 소리가 납니다. 특히 전력 변화가 빠르고 클수록(높은 fps, GPU 부하 급변) 더 크게 들립니다. 카드 설계나 개체별 편차에 따라 소음 정도가 다를 수 있습니다."
        },
        {
          heading: "전원 공급과의 관계",
          text: "파워서플라이의 효율이 낮거나 전류 리플이 크면 같은 그래픽카드라도 소음이 더 도드라질 수 있습니다. 정격 용량이 넉넉하고 효율 등급이 높은 PSU로 바꾸면 줄어드는 경우가 있습니다."
        },
        {
          heading: "언더볼팅·파워 리밋으로 소음 줄이기",
          text: "언더볼팅(코어 전압을 낮추는 것)이나 파워 리밋(전력 사용량 상한을 낮추는 것)을 적용하면 GPU에 흐르는 전류의 변화 폭이 줄어들어 코일 진동과 발열, 팬 소음이 함께 줄어드는 경우가 많습니다. MSI 애프터버너 같은 무료 도구로 코어 전압-클럭 곡선을 낮추거나 파워 리밋 슬라이더를 90% 안팎으로 내려 시험해보세요. 적절한 범위 내의 언더볼팅은 성능 손실이 거의 없거나 미미하면서 소음·발열만 줄이는 경우가 많습니다."
        },
        {
          heading: "제조사 A/S(무상 교환) 판단 기준",
          text: "코일 노이즈는 대부분의 제조사가 \"정상적인 전기적 현상\"으로 분류하며, 소음 자체만으로는 성능이나 수명에 영향을 주지 않는다는 이유로 무상 교환·환불 대상에서 제외하는 경우가 많습니다. 특정 데시벨(dB) 수치를 공개적으로 명시한 제조사는 확인되지 않으며, 대신 일부 유통사·서비스센터는 문제 제품을 동일 모델의 정상 제품과 나란히 놓고 일정 거리(예: 약 30cm)에서 비교 청취해 \"확연히 차이가 나는 수준\"인지를 판단하는 방식을 씁니다. 즉 절대적인 dB 기준이 아니라 같은 모델 대비 상대적으로 비정상적으로 심한지가 핵심 판단 기준입니다."
        }
      ],
      decision: [
        {
          heading: "소음만 있고 다른 증상이 없을 때",
          text: "대부분 정상 범위의 코일 노이즈입니다. 신경 쓰인다면 프레임 제한이나 언더볼팅·파워 리밋 조정으로 불필요한 GPU 부하 변화를 줄이는 정도로 충분합니다."
        },
        {
          heading: "소음이 갑자기 커지거나 다른 증상이 동반될 때",
          text: "전원부(VRM) 불량이나 카드 자체의 이상일 수 있으니, 다른 PSU로 교체 테스트를 해보고 개선되지 않으면 제조사 A/S를 고려하세요."
        },
        {
          heading: "A/S(무상 교환)를 문의하기 전에",
          text: "코일 노이즈 단독으로는 대부분 무상 교환 대상이 아니므로, 문의 전에 동영상으로 소음을 녹음해두고 성능 저하·화면 이상 등 동반 증상이 있는지 함께 정리해두면 접수·판단이 더 수월합니다. 정확한 처리 기준은 구매처(제조사 또는 유통사)의 공식 A/S 정책을 직접 확인하는 것이 가장 정확합니다."
        }
      ],
      examples: [
        "메뉴 화면처럼 fps가 매우 높게 나올 때만 삐- 소리가 남",
        "특정 게임 로딩 화면에서만 지지직 소리가 잠깐 남"
      ],
      mistakes: [
        "소음만으로 바로 카드가 고장났다고 단정하는 것",
        "동반 증상(성능 저하, 화면 깨짐) 없이도 무조건 A/S부터 맡기는 것",
        "특정 데시벨을 넘으면 무조건 무상 교환된다고 확신하는 것 — 그런 공개된 절대 기준은 없습니다"
      ],
      faq: [
        {
          q: "코일 노이즈가 있으면 그래픽카드 수명에 영향이 있나요?",
          a: "일반적인 코일 노이즈는 정상적인 전기적 현상으로, 카드 수명이나 성능에 영향을 주지 않습니다. 다만 소음이 급격히 커지거나 다른 이상 증상이 동반된다면 별개로 점검이 필요합니다."
        },
        {
          q: "프레임 제한을 걸면 소음이 줄어드나요?",
          a: "많은 경우 도움이 됩니다. 불필요하게 높은 fps로 GPU에 급격한 부하 변화가 생기는 것을 줄이면 코일 진동도 함께 줄어드는 경향이 있습니다."
        },
        {
          q: "언더볼팅이나 파워 리밋 조정이 그래픽카드에 무리를 주지 않나요?",
          a: "적절한 범위 내의 언더볼팅·파워 리밋 하향은 오히려 전압·발열 스트레스를 줄이는 방향이라 카드에 무리를 주지 않습니다. 반대로 전압을 높이는 오버볼팅과는 다르니 혼동하지 마세요."
        },
        {
          q: "몇 데시벨(dB) 이상이면 제조사에서 무상 교환해주나요?",
          a: "공개적으로 명시된 절대적인 dB 기준을 두는 제조사는 확인되지 않습니다. 대부분은 코일 노이즈 자체를 정상 현상으로 보고, 동일 모델 대비 \"확연히\" 심한 수준인지를 비교 청취로 판단하는 방식을 씁니다. 정확한 기준은 구매처의 공식 A/S 정책을 직접 문의하는 것이 가장 정확합니다."
        },
        {
          q: "새로 산 그래픽카드인데 소음이 나면 반품해야 하나요?",
          a: "코일 노이즈 자체는 대부분의 그래픽카드에서 정도 차이로 나타나는 정상 현상이라 반품 사유가 되기는 어렵습니다. 다만 유독 심하게 거슬리는 수준이라면 판매처의 소음 관련 정책을 확인해보세요."
        }
      ]
    },
    "black-screen-after-login": {
      badge: "화면",
      subtitle: "로그인은 끝났는데 바탕화면이 나타나지 않을 때",
      intro: [
        "로그인 후 검은 화면은 윈도우가 완전히 부팅되지 않은 상태와 구분해야 합니다. 마우스 포인터가 움직이거나 Ctrl+Alt+Delete 화면이 열린다면 시스템 자체는 작동하고 있지만, 바탕화면을 담당하는 Windows 탐색기나 그래픽 출력 경로가 정상적으로 이어지지 않았을 가능성이 큽니다.",
        "업데이트 직후, 그래픽 드라이버 교체 후, 외부 모니터를 사용한 뒤에 특히 잘 나타납니다. 화면이 검다고 곧바로 저장장치 고장이나 윈도우 재설치를 결정하기보다, 키 입력 반응과 작업 관리자 실행 여부로 소프트웨어 문제인지 먼저 나누는 것이 안전합니다.",
        "Microsoft가 안내하는 그래픽 드라이버 재설정, 화면 출력 모드 확인, 탐색기 재시작 순서에 맞춰 확인하면 데이터에 손대지 않고도 원인을 좁힐 수 있습니다. 각 단계 후 화면이 돌아오는지 확인하고 한 번에 여러 설정을 바꾸지 마세요."
      ],
      warnings: [
        "로그인 소리는 들리지만 바탕화면과 작업표시줄이 보이지 않는다.",
        "검은 화면 위에서 마우스 포인터만 움직인다.",
        "외부 모니터를 연결하거나 업데이트한 뒤부터 시작됐다."
      ],
      checks: [
        {
          title: "화면과 키 입력 반응 구분",
          why: "Ctrl+Alt+Delete가 열리면 모니터 신호 단절보다 탐색기나 드라이버 문제일 가능성이 높습니다.",
          how: "Ctrl+Alt+Delete를 눌러 보안 화면이 열리는지 확인하고, 반응이 없으면 케이블과 모니터 입력 소스를 먼저 점검하세요."
        },
        {
          title: "그래픽 드라이버 즉시 재설정",
          why: "절전 복귀나 업데이트 과정에서 그래픽 드라이버만 멈춘 경우 화면 출력이 다시 살아날 수 있습니다.",
          how: "Windows+Ctrl+Shift+B를 한 번 누릅니다. 짧은 알림음이나 화면 깜빡임이 나타난 뒤 10초 정도 기다리세요."
        },
        {
          title: "Windows 탐색기 다시 실행",
          why: "explorer.exe가 시작되지 않으면 로그인은 끝나도 바탕화면, 아이콘, 작업표시줄이 나타나지 않습니다.",
          how: "Ctrl+Shift+Esc로 작업 관리자를 열고 새 작업 실행에서 explorer.exe를 입력합니다. 이미 실행 중이면 Windows 탐색기를 다시 시작하세요."
        },
        {
          title: "출력 모드와 외부 화면 분리",
          why: "윈도우가 보이지 않는 두 번째 모니터로 화면을 보내고 있을 수 있습니다.",
          how: "외부 모니터와 도킹 장치를 빼고 Windows+P를 눌러 PC 화면만 모드로 전환해 봅니다. 케이블도 다른 포트로 교차 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "안전 모드에서는 정상일 때",
          text: "안전 모드에서 바탕화면이 정상이라면 그래픽 드라이버, 시작 프로그램, 셸 확장 영향이 큽니다. 최근 그래픽 드라이버를 업데이트했다면 장치 관리자에서 이전 드라이버로 되돌리거나 PC 제조사가 제공한 안정 버전을 설치하는 편이 좋습니다."
        },
        {
          heading: "검은 화면과 부팅 실패의 차이",
          text: "제조사 로고부터 아무것도 보이지 않으면 이 가이드보다 화면 미출력 가이드가 맞습니다. 로그인 화면은 보였고 로그인 이후에만 검어졌다면 윈도우 셸과 사용자 환경을 먼저 확인해야 합니다."
        }
      ],
      decision: [
        {
          heading: "탐색기 실행으로 복구될 때",
          text: "하드웨어 교체보다 시작 프로그램과 손상된 셸 확장을 정리하고 시스템 파일 검사를 진행하세요. 다음 로그인에서도 반복되는지 확인해야 합니다."
        },
        {
          heading: "화면 깜빡임과 블루스크린이 동반될 때",
          text: "그래픽 드라이버와 GPU 안정성을 함께 점검하세요. 0x00000116이나 0x000000EA가 기록되면 그래픽 장치 관련 상세 페이지를 우선 확인합니다."
        }
      ],
      examples: [
        "로그인 암호 입력 후 포인터만 보이고 작업표시줄은 나타나지 않음",
        "노트북을 외부 모니터에서 분리한 다음 내장 화면이 검게 유지됨",
        "그래픽 드라이버 업데이트 후 첫 재부팅부터 검은 화면이 반복됨"
      ],
      mistakes: [
        "화면이 검다는 이유만으로 바로 윈도우를 초기화하는 것",
        "외부 모니터와 도킹 장치를 연결한 채 원인을 판단하는 것",
        "드라이버를 여러 버전 연속 설치하고 재현 여부를 확인하지 않는 것"
      ],
      faq: [
        {
          q: "마우스 포인터가 보이면 그래픽카드는 정상인가요?",
          a: "기본 출력은 되고 있다는 단서지만 그래픽 드라이버가 완전히 정상이라는 뜻은 아닙니다. 탐색기 실행 여부와 드라이버 재설정 반응을 함께 확인하세요."
        },
        {
          q: "작업 관리자도 열리지 않으면 어떻게 하나요?",
          a: "외부 화면과 케이블을 분리한 뒤 복구 환경의 안전 모드로 들어가 보세요. 안전 모드도 보이지 않으면 화면 미출력 가이드에 따라 하드웨어 출력 경로를 확인하는 편이 맞습니다."
        },
        {
          q: "안전 모드로는 들어가지는데 일반 모드는 검은 화면이면 뭘 의심해야 하나요?",
          a: "안전 모드에서는 기본 드라이버만 로드되므로, 일반 모드에서만 문제가 생긴다면 그래픽 드라이버나 시작 프로그램 충돌을 우선 의심해야 합니다."
        }
      ]
    },
    "disk-usage-100": {
      badge: "성능",
      subtitle: "디스크가 계속 바쁘고 클릭 반응이 늦을 때",
      intro: [
        "작업 관리자의 디스크 사용률 100%는 저장 공간이 꽉 찼다는 뜻이 아닙니다. 디스크가 처리할 수 있는 작업 시간이 모두 사용 중이라는 의미로, 전송량이 낮아도 응답이 지연되면 100%로 표시될 수 있습니다. 따라서 숫자 하나만 보고 SSD나 HDD를 바로 교체해서는 안 됩니다.",
        "윈도우 업데이트, 검색 인덱싱, 백신 검사처럼 정상적인 백그라운드 작업도 잠시 사용률을 높입니다. 반면 수십 분 동안 사용률이 내려가지 않고 응답 시간이 길거나 디스크 오류가 기록된다면 저장장치 상태, 메모리 부족, 드라이버 문제를 더 자세히 봐야 합니다.",
        "이 가이드는 어떤 프로세스가 디스크를 사용하는지 확인한 다음, 일시적인 작업인지 반복되는 장애 신호인지 구분하도록 구성했습니다. 중요한 파일이 있는 PC에서 오류가 의심되면 검사보다 백업을 먼저 진행하세요."
      ],
      warnings: [
        "전송 속도는 낮은데 활성 시간만 계속 100%다.",
        "프로그램을 열 때 수십 초씩 멈추고 디스크 응답 시간이 크게 오른다.",
        "이벤트 로그에 Disk, Ntfs, storahci 관련 경고가 반복된다."
      ],
      checks: [
        {
          title: "사용 프로세스와 지속 시간 확인",
          why: "업데이트나 백신 검사처럼 원인이 분명한 일시적 사용량은 기다리면 내려가지만, 원인 없는 지속 사용은 추가 점검이 필요합니다.",
          how: "작업 관리자에서 디스크 열을 정렬하고 10분 정도 관찰합니다. 프로세스 이름, 읽기·쓰기 속도, 사용률이 내려가는 시점을 기록하세요."
        },
        {
          title: "리소스 모니터에서 파일 경로 확인",
          why: "같은 프로세스라도 어떤 파일을 반복해서 읽는지 알아야 업데이트, 동기화, 가상 메모리 문제를 구분할 수 있습니다.",
          how: "리소스 모니터의 디스크 탭에서 총 바이트와 응답 시간을 확인합니다. 클라우드 동기화 폴더나 업데이트 파일이 반복되는지도 봅니다."
        },
        {
          title: "여유 공간과 메모리 사용량 점검",
          why: "시스템 드라이브 공간이나 메모리가 부족하면 페이지 파일 사용이 늘어 디스크가 계속 바빠질 수 있습니다.",
          how: "저장소 설정에서 임시 파일을 정리하고 시스템 드라이브 여유 공간을 확보합니다. 메모리가 90% 이상인지도 함께 확인하세요."
        },
        {
          title: "건강 상태와 오류 기록 확인",
          why: "읽기 재시도나 컨트롤러 오류는 낮은 전송량에서도 활성 시간을 100%로 만들 수 있습니다.",
          how: "제조사 진단 도구와 이벤트 뷰어를 확인합니다. SMART 경고나 반복되는 디스크 오류가 있으면 중요한 파일부터 다른 저장장치에 백업하세요."
        }
      ],
      deeper: [
        {
          heading: "HDD와 SSD에서 해석이 다른 이유",
          text: "HDD는 작은 파일을 여러 곳에서 읽을 때 헤드 이동 때문에 쉽게 100%에 도달합니다. SSD는 일반 작업에서 계속 100%가 유지된다면 펌웨어, 열로 인한 속도 저하, 여유 공간 부족, 저장장치 오류를 더 주의해서 봐야 합니다."
        },
        {
          heading: "서비스를 무작정 끄기 전에",
          text: "검색 인덱싱이나 SysMain을 영구적으로 끄면 당장은 사용률이 내려가도 검색과 앱 실행 성능이 나빠질 수 있습니다. 먼저 해당 서비스가 실제 원인인지 확인하고, 일시 중지 후 재현 여부를 비교해야 합니다."
        }
      ],
      decision: [
        {
          heading: "특정 프로세스가 분명할 때",
          text: "앱의 업데이트, 동기화, 캐시 설정을 먼저 조정하세요. 정상 작업이 끝난 뒤에도 같은 프로세스가 계속 디스크를 점유하는지 확인합니다."
        },
        {
          heading: "프로세스가 없는데 100%일 때",
          text: "응답 시간, 이벤트 로그, SMART 상태를 우선 확인하세요. 소음이나 멈춤이 동반되는 HDD라면 추가 검사를 반복하기보다 백업이 먼저입니다."
        }
      ],
      examples: [
        "부팅 직후 Windows Update가 끝날 때까지 100%였다가 정상으로 내려감",
        "메모리 사용량이 95%를 넘을 때 페이지 파일 읽기와 쓰기가 급증함",
        "전송량은 1MB/s 미만인데 응답 시간이 수천 ms로 올라가 PC가 멈춤"
      ],
      mistakes: [
        "디스크 100%를 저장 공간 100%와 같은 뜻으로 해석하는 것",
        "원인 확인 없이 여러 윈도우 서비스를 한꺼번에 사용 중지하는 것",
        "SMART 경고가 있는데 성능 검사와 재부팅을 계속 반복하는 것"
      ],
      faq: [
        {
          q: "부팅 직후 몇 분만 100%인 것도 고장인가요?",
          a: "업데이트, 백신 검사, 시작 앱이 끝난 뒤 내려간다면 정상 범위일 수 있습니다. 지속 시간과 어떤 프로세스가 사용했는지를 함께 보세요."
        },
        {
          q: "SSD로 바꾸면 무조건 해결되나요?",
          a: "HDD의 기계적 지연은 크게 줄어들 수 있지만 메모리 부족, 동기화 앱, 손상된 드라이버가 원인이면 SSD에서도 반복될 수 있습니다. 원인을 먼저 구분하는 편이 좋습니다."
        },
        {
          q: "디스크 사용량이 100%인데 눈에 보이는 원인 프로세스가 없으면 어떻게 하나요?",
          a: "리소스 모니터(resmon.exe)의 디스크 탭에서 응답 시간이 긴 프로세스를 확인하면 작업 관리자보다 더 구체적으로 원인을 좁힐 수 있습니다."
        }
      ]
    },
    "bluetooth-not-found": {
      badge: "블루투스",
      subtitle: "장치가 검색 목록에 나타나지 않거나 페어링되지 않을 때",
      intro: [
        "블루투스 장치 미검색은 PC 어댑터 고장보다 장치가 페어링 모드에 들어가지 않았거나 이미 다른 휴대폰에 연결된 경우가 더 흔합니다. 이어폰과 키보드는 전원이 켜진 상태와 페어링 대기 상태가 다르므로 제조사 안내에 맞는 버튼 조작이 필요합니다.",
        "Windows 11에서는 블루투스 장치 검색 범위 설정에 따라 일부 장치가 목록에 늦게 나타날 수 있습니다. 비행기 모드, 거리, 배터리, 기존 페어링 기록을 먼저 정리한 뒤에도 검색되지 않을 때 드라이버와 서비스를 확인하는 순서가 효율적입니다.",
        "USB 블루투스 동글을 사용한다면 허브 전력 부족과 포트 간섭도 변수입니다. 본체 포트에 직접 연결하고 다른 USB 3.x 장치와 거리를 둔 상태에서 다시 검색해 보세요."
      ],
      warnings: [
        "블루투스 켜기 버튼 자체가 설정에서 사라졌다.",
        "장치는 보이지만 연결을 누르면 바로 실패한다.",
        "절전 복귀 후 어댑터가 장치 관리자에서 사라진다."
      ],
      checks: [
        {
          title: "장치의 페어링 모드 확인",
          why: "전원만 켜진 장치는 주변 검색에 노출되지 않을 수 있고, 다른 기기에 연결 중이면 PC가 찾지 못합니다.",
          how: "다른 휴대폰의 블루투스를 잠시 끄고 장치 표시등이 페어링 패턴으로 깜빡이는지 확인하세요. 장치와 PC를 1m 이내에 둡니다."
        },
        {
          title: "Windows 검색 범위와 비행기 모드 확인",
          why: "검색 설정이 제한되어 있거나 비행기 모드가 켜져 있으면 정상 장치도 표시되지 않습니다.",
          how: "설정의 Bluetooth 및 장치에서 Bluetooth를 껐다 켜고, 장치 검색 설정을 고급으로 바꾼 뒤 다시 추가합니다."
        },
        {
          title: "기존 등록을 삭제하고 다시 연결",
          why: "오래된 인증 키나 중단된 페어링 기록이 남으면 장치가 보여도 연결에 실패할 수 있습니다.",
          how: "기존 장치를 제거한 뒤 PC와 블루투스 장치를 모두 재시작하고 처음부터 페어링합니다."
        },
        {
          title: "어댑터 드라이버와 절전 설정 점검",
          why: "Bluetooth 항목이 사라지거나 절전 후 반복된다면 어댑터 드라이버와 전원 관리가 핵심입니다.",
          how: "장치 관리자에서 Bluetooth 어댑터의 느낌표를 확인하고 드라이버 업데이트, 재설치, 이전 버전 복원을 순서대로 시험합니다. 제조사 드라이버를 우선 사용하세요."
        }
      ],
      deeper: [
        {
          heading: "장치가 안 보이는 경우와 연결 실패의 차이",
          text: "목록에 전혀 보이지 않으면 페어링 모드, 검색 범위, 어댑터 상태를 먼저 봅니다. 목록에는 있지만 연결만 실패하면 기존 등록 정보, 배터리, 다른 기기와의 연결, 지원 프로필 문제를 더 우선해서 확인합니다."
        },
        {
          heading: "블루투스 버튼이 사라졌을 때",
          text: "빠른 설정에 버튼이 없는 것과 장치 관리자에서 어댑터 자체가 없는 것은 다릅니다. 장치 관리자에서 보기의 숨김 장치 표시를 확인하고, USB 동글이라면 다른 본체 포트에 직접 연결해 하드웨어 인식 여부를 먼저 판단하세요."
        }
      ],
      decision: [
        {
          heading: "다른 휴대폰에서는 검색될 때",
          text: "블루투스 장치보다 PC의 검색 설정, 어댑터 드라이버, 기존 페어링 기록을 중심으로 점검하세요."
        },
        {
          heading: "어떤 기기에서도 검색되지 않을 때",
          text: "장치가 페어링 모드인지와 배터리 상태를 다시 확인합니다. 초기화 방법이 있는 제품은 제조사 절차에 따라 초기화한 뒤 시험하세요."
        }
      ],
      examples: [
        "이어폰이 휴대폰에 자동 연결되어 PC 검색 목록에는 나타나지 않음",
        "Windows 업데이트 후 Bluetooth 켜기 메뉴와 어댑터가 함께 사라짐",
        "USB 동글을 허브에서 본체 포트로 옮기자 검색이 정상화됨"
      ],
      mistakes: [
        "전원이 켜진 상태를 페어링 모드로 착각하는 것",
        "기존 연결 기록을 남긴 채 연결 버튼만 반복해서 누르는 것",
        "노트북 제조사 드라이버를 확인하지 않고 임의 드라이버를 여러 번 설치하는 것"
      ],
      faq: [
        {
          q: "블루투스 이어폰이 휴대폰에는 연결되는데 PC에는 안 보입니다.",
          a: "이어폰이 휴대폰에 이미 연결되어 있을 가능성이 큽니다. 휴대폰 블루투스를 잠시 끄고 이어폰을 명시적으로 페어링 모드에 넣은 뒤 PC에서 다시 검색하세요."
        },
        {
          q: "업데이트 후 블루투스가 사라졌습니다.",
          a: "장치 관리자에서 어댑터 상태를 확인하고 드라이버 롤백 또는 PC 제조사 최신 드라이버 설치를 시험하세요. 어댑터가 전혀 보이지 않으면 완전 종료 후 다시 켜는 과정도 필요할 수 있습니다."
        },
        {
          q: "블루투스 이어폰은 되는데 마우스만 안 잡히는 경우도 같은 원인인가요?",
          a: "장치별로 드라이버나 프로파일이 다를 수 있어, 특정 장치만 문제라면 해당 장치의 펌웨어·배터리 상태를 우선 점검해야 합니다."
        }
      ]
    },
    "app-not-launching": {
      badge: "프로그램",
      subtitle: "앱을 눌러도 반응이 없거나 실행 직후 종료될 때",
      intro: [
        "앱 실행 불가는 아이콘을 눌러도 아무 반응이 없는 경우, 로고가 잠깐 보인 뒤 닫히는 경우, 오류 창이 나타나는 경우로 나눠야 합니다. 겉보기에는 비슷하지만 실행 파일 차단, 사용자 설정 손상, 필수 구성 요소 누락처럼 원인이 서로 다릅니다.",
        "특정 앱 하나만 열리지 않는다면 윈도우 전체 문제보다 해당 앱의 데이터와 설치 상태를 먼저 확인합니다. 여러 앱이 동시에 열리지 않거나 관리자 도구까지 실행되지 않는다면 계정 권한, 시스템 파일, 보안 프로그램의 차단 기록을 더 주의해서 봐야 합니다.",
        "재설치는 유용한 방법이지만 사용자 데이터와 손상된 설정이 그대로 남거나 필요한 런타임이 빠져 있으면 해결되지 않습니다. 오류 문구와 이벤트 기록을 먼저 남긴 뒤 복구, 초기화, 재설치 순서로 진행하는 편이 안전합니다."
      ],
      warnings: [
        "실행 직후 오류 창 없이 프로세스가 종료된다.",
        "0x80070005 같은 권한 오류가 함께 표시된다.",
        "여러 앱이 같은 시점부터 동시에 열리지 않는다."
      ],
      checks: [
        {
          title: "증상 범위와 오류 문구 기록",
          why: "앱 하나의 문제인지 계정이나 시스템 전체 문제인지에 따라 점검 방향이 완전히 달라집니다.",
          how: "오류 창을 캡처하고 작업 관리자에서 프로세스가 잠시 나타나는지 확인합니다. 다른 기본 앱도 실행해 범위를 비교하세요."
        },
        {
          title: "완전 종료 후 일반 권한으로 재실행",
          why: "백그라운드에 멈춘 프로세스나 업데이트 대기 상태가 새 실행을 막을 수 있습니다.",
          how: "작업 관리자에서 해당 앱 프로세스를 끝내고 PC를 재시작합니다. 항상 관리자 권한으로 실행하기보다 먼저 일반 권한에서 시험하세요."
        },
        {
          title: "앱 복구와 초기화 구분",
          why: "복구는 데이터 보존을 우선하지만 초기화는 앱 설정과 로그인 정보를 지울 수 있습니다.",
          how: "설정의 설치된 앱에서 복구를 먼저 사용합니다. 초기화 전에는 앱 내부 파일, 계정 정보, 라이선스 복구 방법을 확인하세요."
        },
        {
          title: "재설치 전 구성 요소와 차단 기록 확인",
          why: "Visual C++ 런타임, .NET, 그래픽 구성 요소가 누락됐거나 보안 프로그램이 파일을 격리했다면 앱만 다시 설치해도 반복됩니다.",
          how: "앱 제작사의 시스템 요구 사항과 보안 기록, 이벤트 뷰어의 응용 프로그램 오류를 확인한 뒤 공식 설치 파일로 재설치합니다."
        }
      ],
      deeper: [
        {
          heading: "새 사용자 계정에서 확인하는 이유",
          text: "새 로컬 계정에서는 앱이 열린다면 윈도우 전체보다 기존 사용자 프로필의 설정, 캐시, 권한 문제가 유력합니다. 이 경우 시스템 초기화보다 앱 설정 폴더와 계정별 시작 항목을 점검하는 것이 부담이 적습니다."
        },
        {
          heading: "이벤트 뷰어에서 볼 항목",
          text: "Windows 로그의 응용 프로그램에서 앱 이름과 같은 시간대의 오류를 찾습니다. 오류 모듈 이름이 그래픽 드라이버, 런타임 DLL, 앱 자체 파일 중 무엇인지에 따라 업데이트 또는 재설치 대상을 좁힐 수 있습니다."
        }
      ],
      decision: [
        {
          heading: "앱 하나만 열리지 않을 때",
          text: "해당 앱의 복구, 캐시, 플러그인, 공식 요구 사항을 먼저 확인하세요. 윈도우 초기화나 광범위한 설정 변경은 뒤로 미루는 편이 좋습니다."
        },
        {
          heading: "여러 앱과 설정 화면까지 열리지 않을 때",
          text: "시스템 파일 검사와 새 사용자 계정 시험을 진행하고, 최근 업데이트와 보안 프로그램 변경 이력을 함께 확인하세요."
        }
      ],
      examples: [
        "앱 로고가 1초 정도 나타난 뒤 오류 메시지 없이 닫힘",
        "업데이트 후 특정 플러그인을 사용하는 앱만 실행되지 않음",
        "새 사용자 계정에서는 정상인데 기존 계정에서만 0x80070005가 표시됨"
      ],
      mistakes: [
        "오류 메시지를 기록하지 않고 바로 앱을 삭제하는 것",
        "사용자 데이터 위치를 확인하지 않은 채 초기화 버튼을 누르는 것",
        "비공식 설치 파일이나 DLL 다운로드 사이트에서 파일을 덮어쓰는 것"
      ],
      faq: [
        {
          q: "관리자 권한으로 실행하면 해결되나요?",
          a: "권한 문제를 구분하는 일시적인 시험으로는 쓸 수 있지만 항상 관리자 권한으로 실행하는 것은 해결책이 아닙니다. 0x80070005가 반복되면 폴더 권한과 보안 차단 기록을 확인하세요."
        },
        {
          q: "삭제 후 재설치해도 똑같습니다.",
          a: "사용자 설정 폴더가 남아 있거나 필수 런타임과 드라이버가 원인일 수 있습니다. 공식 제거 절차, 요구 구성 요소, 이벤트 오류 모듈을 확인한 뒤 다시 설치하세요."
        },
        {
          q: "관리자 권한으로 실행하면 항상 해결되나요?",
          a: "권한 문제로 인한 실행 실패는 해결되지만, 파일 손상이나 종속성 누락이 원인이라면 관리자 권한만으로는 해결되지 않을 수 있습니다."
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
        },
        {
          q: "전원 버튼 LED가 깜빡이기만 하는 것도 같은 문제인가요?",
          a: "깜빡임 패턴은 메인보드가 자체 진단 결과를 알리는 신호인 경우가 많아, 메인보드 설명서에서 LED 코드의 의미를 먼저 확인하는 것이 좋습니다."
        },
        {
          q: "파워서플라이(PSU)만 교체하면 확실히 해결되나요?",
          a: "PSU 자체 고장이 원인이라면 해결되지만, 메인보드나 CMOS 배터리 문제일 수도 있어 교체 전 다른 원인을 함께 점검하는 것이 좋습니다."
        }
      ],
      communityCases: [{
        title: "파워서플라이(PSU) 교체로 해결한 사례",
        summary: "24핀·8핀을 재체결하고 전면 패널 선까지 다시 연결해도 전원이 전혀 들어오지 않던 사례가 있습니다. 여유분으로 가지고 있던 다른 PSU를 임시로 연결하자 바로 정상적으로 켜져 기존 PSU의 고장으로 확인됐고, 새 제품으로 교체한 뒤 완전히 해결됐습니다.",
        insight: "케이블 연결과 전면 패널 점검까지 마쳤는데도 완전 무반응이라면, 여유 PSU나 파워 테스터로 교체 테스트를 해보는 것이 원인을 가장 빠르게 좁히는 방법입니다."
      }]
    },
    "browser-not-responding": {
      badge: "브라우저",
      subtitle: "탭이나 창이 멈추거나 응답 없음 상태가 될 때",
      intro: [
        "브라우저 응답 없음은 운영체제 자체의 오류라기보다 브라우저 프로세스가 메모리나 스크립트 처리에서 막히는 현상입니다. 탭이 많거나 확장 프로그램이 많을수록 재현 빈도가 높아집니다.",
        "Aw, Snap 같은 페이지 크래시 메시지는 브라우저 전체가 아니라 해당 탭의 렌더러 프로세스만 죽은 경우가 많아, 다른 탭이 멀쩡한지부터 확인하는 것이 좋습니다.",
        "같은 증상이 특정 사이트에서만 반복되는지, 아니면 브라우저 전체에서 나타나는지 구분하면 원인을 더 빨리 좁힐 수 있습니다."
      ],
      warnings: [
        "탭이나 창을 눌러도 한동안 반응이 없다.",
        "특정 페이지에서 Aw, Snap 오류가 자주 뜬다.",
        "브라우저를 새로 켜도 금방 다시 멈춘다."
      ],
      checks: [
        {
          title: "작업 관리자에서 프로세스 종료",
          why: "브라우저 자체 작업 관리자(Shift+Esc, 크롬 기준)로 어떤 탭이 메모리를 많이 쓰는지 먼저 확인할 수 있습니다.",
          how: "응답 없는 탭이나 확장 프로그램 프로세스만 골라 종료해 보세요."
        },
        {
          title: "확장 프로그램 점검",
          why: "확장 프로그램 충돌이 응답 없음의 흔한 원인입니다.",
          how: "확장 프로그램을 모두 끈 뒤 하나씩 다시 켜서 원인을 좁혀 보세요."
        },
        {
          title: "캐시와 하드웨어 가속 확인",
          why: "손상된 캐시나 맞지 않는 그래픽 가속 설정이 렌더링 멈춤으로 이어질 수 있습니다.",
          how: "설정에서 캐시를 정리하고, 하드웨어 가속을 꺼서 재현 여부를 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "탭 크래시와 브라우저 전체 멈춤은 다름",
          text: "Aw, Snap처럼 탭 하나만 크래시 화면이 뜨는 경우와 브라우저 창 전체가 응답 없음이 되는 경우는 원인이 다를 수 있어, 다른 탭이 정상인지부터 확인해야 합니다."
        }
      ],
      decision: [
        {
          heading: "특정 사이트에서만 반복될 때",
          text: "해당 사이트의 스크립트나 광고 콘텐츠가 원인일 가능성이 높으므로 확장 프로그램(광고 차단 등) 유무를 함께 확인하세요."
        },
        {
          heading: "브라우저 전체가 느려질 때",
          text: "탭 개수, 확장 프로그램, 캐시 상태를 먼저 점검하고 필요하면 새 프로필로 재현 여부를 확인하세요."
        }
      ],
      examples: [
        "탭을 10개 이상 열어두면 브라우저가 멈춘다",
        "뉴스 사이트에서 유독 Aw, Snap 오류가 자주 뜬다"
      ],
      mistakes: [
        "재부팅만 반복하고 확장 프로그램은 확인하지 않는 것",
        "탭 개수를 줄이지 않고 캐시만 정리하는 것"
      ],
      faq: [
        {
          q: "브라우저를 재설치하면 해결되나요?",
          a: "재설치 전에 확장 프로그램 비활성화와 캐시 정리부터 시도해 보는 것이 좋습니다. 대부분 이 단계에서 원인이 좁혀집니다."
        },
        {
          q: "시크릿(비공개) 모드에서는 안 멈추는데 이것도 확장 프로그램 문제인가요?",
          a: "네, 시크릿 모드는 기본적으로 확장 프로그램이 비활성화되므로 시크릿 모드에서 정상이라면 확장 프로그램 충돌 가능성이 높습니다."
        },
        {
          q: "새 프로필을 만들면 기존 즐겨찾기가 사라지나요?",
          a: "새 프로필은 별도로 생성되므로 기존 프로필의 즐겨찾기는 그대로 남으며, 필요하면 나중에 데이터를 옮길 수 있습니다."
        }
      ]
    },
    "install-failure": {
      badge: "설치",
      subtitle: "설치 프로그램이 중간에 멈추거나 오류로 실패할 때",
      intro: [
        "설치 실패는 프로그램이 실행되지 않는 것과는 다른 문제입니다. Windows Installer 서비스, 이전 설치의 잔여 파일, 권한 문제가 겹치면서 설치 자체가 완료되지 못하는 경우가 대부분입니다.",
        "같은 오류 코드라도 새 프로그램 설치 중인지, 업데이트나 재설치 중인지에 따라 먼저 볼 항목이 달라집니다.",
        "설치 로그(%TEMP% 폴더의 MSI 로그)를 확인하면 정확히 어느 단계에서 멈췄는지 파악하는 데 도움이 됩니다."
      ],
      warnings: [
        "설치 진행률이 중간에 멈추고 오류 코드가 뜬다.",
        "다른 설치가 진행 중이라는 메시지가 반복된다.",
        "설치 패키지를 열 수 없다는 메시지가 뜬다."
      ],
      checks: [
        {
          title: "Windows Installer 서비스 재시작",
          why: "이 서비스가 멈춰 있거나 충돌하면 어떤 설치도 정상적으로 끝나지 않습니다.",
          how: "services.msc에서 Windows Installer 서비스 상태를 확인하고 재시작하세요."
        },
        {
          title: "이전 설치 잔여 파일 정리",
          why: "제거되지 않은 이전 버전 파일이 새 설치와 충돌할 수 있습니다.",
          how: "제어판에서 이전 버전을 완전히 제거한 뒤 임시 설치 파일을 정리하고 다시 시도하세요."
        },
        {
          title: "관리자 권한과 백신 예외",
          why: "권한 부족이나 백신 프로그램의 차단이 설치 중간에 실패로 이어질 수 있습니다.",
          how: "설치 파일을 관리자 권한으로 실행하고, 필요하면 백신 예외에 잠시 추가해 보세요."
        }
      ],
      deeper: [
        {
          heading: "MSI 로그로 실패 지점 확인하기",
          text: "설치가 반복해서 같은 지점에서 실패한다면 로그 파일에서 어떤 구성 요소나 조건에서 멈추는지 확인하는 것이 가장 정확합니다."
        }
      ],
      decision: [
        {
          heading: "특정 프로그램에서만 실패할 때",
          text: "해당 프로그램의 종속 구성 요소(런타임, 어셈블리)가 손상되었을 가능성이 높으니 재배포 패키지를 다시 설치해 보세요."
        },
        {
          heading: "모든 설치에서 반복될 때",
          text: "Windows Installer 서비스나 시스템 계정 권한 문제일 수 있어 시스템 파일 점검이 먼저입니다."
        }
      ],
      examples: [
        "설치 도중 오류 1603과 함께 진행이 멈춘다",
        "설치 패키지를 열 수 없다는 오류(2502/2503)가 뜬다"
      ],
      mistakes: [
        "같은 설치 파일을 원인 확인 없이 반복 실행하는 것",
        "임시 파일 정리 없이 재설치만 반복하는 것"
      ],
      faq: [
        {
          q: "설치 오류마다 원인이 다 다른가요?",
          a: "코드에 따라 세부 원인은 다르지만, Windows Installer 서비스 상태와 잔여 파일 정리는 대부분의 설치 오류에서 공통적으로 먼저 확인할 항목입니다."
        },
        {
          q: "설치 오류 코드를 몰라도 해결할 수 있나요?",
          a: "오류 코드가 없어도 관리자 권한 실행, 백신 예외 등록, 임시 파일 정리 같은 공통 조치로 상당수 설치 오류가 해결됩니다."
        },
        {
          q: "재설치 전에 기존 프로그램을 완전히 지워야 하나요?",
          a: "이전 설치가 비정상 종료된 경우 잔여 파일이 충돌을 일으킬 수 있어, 제어판의 제거 기능과 함께 남은 폴더를 확인해 정리하는 것이 좋습니다."
        }
      ]
    },
    "game-launch-error": {
      badge: "게임 실행",
      subtitle: "게임 클라이언트나 안티치트가 실행을 막을 때",
      intro: [
        "게임 실행 오류는 대부분 게임 자체보다 안티치트 드라이버(뱅가드, 이지안티치트, 넷프로텍트 등)나 클라이언트 패치 과정에서 발생합니다. 게임 파일 손상보다 이 계층의 문제가 먼저인 경우가 많습니다.",
        "패치 도중 실패하는지, 실행 자체가 안 되는지, 실행 중 튕기는지에 따라 점검 순서가 달라집니다.",
        "여러 게임이 같은 안티치트를 쓰는 경우, 한 게임에서 문제가 생기면 같은 안티치트를 쓰는 다른 게임도 영향을 받을 수 있습니다."
      ],
      warnings: [
        "실행 버튼을 눌러도 게임이 뜨지 않는다.",
        "안티치트 관련 오류 메시지가 뜬다.",
        "패치 중 진행률이 멈추거나 실패한다."
      ],
      checks: [
        {
          title: "안티치트 드라이버 재설치",
          why: "안티치트 드라이버가 손상되거나 최신 상태가 아니면 게임 실행 자체가 막힙니다.",
          how: "게임 공식 지원 페이지의 안티치트 재설치 도구를 받아 다시 설치하세요."
        },
        {
          title: "게임 파일 무결성 검사",
          why: "패치 도중 손상된 파일이 실행이나 패치 실패로 이어질 수 있습니다.",
          how: "게임 런처의 파일 검증/복구 기능으로 손상 파일을 다시 받으세요."
        },
        {
          title: "보안 프로그램 예외 등록",
          why: "백신이나 방화벽이 안티치트 드라이버 설치를 막는 경우가 흔합니다.",
          how: "게임과 안티치트 실행 파일을 백신 예외 목록에 추가한 뒤 재시도하세요."
        }
      ],
      deeper: [
        {
          heading: "안티치트와 게임 클라이언트 구분하기",
          text: "안티치트 오류 메시지가 뜬다면 게임 파일보다 드라이버 설치 상태를 먼저 봐야 하며, 게임 자체 재설치는 마지막 단계로 미루는 것이 좋습니다."
        }
      ],
      decision: [
        {
          heading: "설치 직후부터 실행이 안 될 때",
          text: "안티치트 드라이버가 제대로 설치되지 않았을 가능성이 높으니 재설치 도구를 먼저 사용하세요."
        },
        {
          heading: "잘 되다가 갑자기 안 될 때",
          text: "최근 Windows 업데이트나 보안 프로그램 업데이트와 시점이 겹치는지 확인하세요."
        }
      ],
      examples: [
        "라이엇 뱅가드 오류로 발로란트가 실행되지 않는다",
        "이지안티치트 오류로 배틀그라운드가 실행되지 않는다"
      ],
      mistakes: [
        "안티치트 상태 확인 없이 게임만 재설치하는 것",
        "백신 예외 등록 없이 재설치를 반복하는 것"
      ],
      faq: [
        {
          q: "게임을 완전히 삭제하고 다시 깔아야 하나요?",
          a: "대부분 안티치트 드라이버 재설치나 파일 무결성 검사로 해결되며, 전체 재설치는 이 단계들을 시도한 뒤에도 안 될 때 고려하는 것이 좋습니다."
        },
        {
          q: "안티치트 프로그램을 아예 삭제해도 되나요?",
          a: "안티치트는 게임 실행에 필수적인 경우가 많아 삭제보다는 재설치나 예외 설정으로 접근하는 것이 안전합니다."
        },
        {
          q: "그래픽 드라이버를 최신 버전으로 유지하면 대부분 해결되나요?",
          a: "실행 오류의 상당수는 드라이버·백신·안티치트 충돌에서 비롯되므로 드라이버 최신화만으로 해결되지 않는다면 백신 예외 설정을 함께 점검해야 합니다."
        }
      ]
    },
    "game-connection-error": {
      badge: "게임 연결",
      subtitle: "런처나 클라이언트가 서버에 연결하지 못할 때",
      intro: [
        "게임 서버 연결 오류는 인터넷 연결 자체가 끊긴 것과는 다릅니다. 다른 사이트는 잘 되는데 특정 게임 런처만 서버에 접속하지 못하는 경우가 대부분입니다.",
        "런처 캐시 손상, 방화벽·라우터의 포트 차단, DNS 응답 지연이 흔한 원인입니다. VPN을 쓰고 있다면 그 자체가 연결을 방해할 수도 있습니다.",
        "다른 게임이나 기기에서도 같은 서버에 연결이 안 되는지 확인하면, 내 PC 문제인지 서버 쪽 문제인지 빠르게 구분할 수 있습니다."
      ],
      warnings: [
        "런처가 서버에 연결 중에서 멈춘다.",
        "특정 게임에서만 연결 오류가 반복된다.",
        "같은 시간대에 여러 번 재시도해도 실패한다."
      ],
      checks: [
        {
          title: "런처 캐시 삭제",
          why: "손상된 캐시 파일이 연결 시도 자체를 실패하게 만들 수 있습니다.",
          how: "런처를 완전히 종료한 뒤 캐시 폴더를 삭제하고 다시 실행하세요."
        },
        {
          title: "공유기 재시작과 DNS 변경",
          why: "라우터의 임시 오류나 불안정한 DNS 응답이 연결 실패로 이어질 수 있습니다.",
          how: "공유기를 재시작하고, 필요하면 공용 DNS(8.8.8.8 등)로 바꿔 재현 여부를 확인하세요."
        },
        {
          title: "VPN·공식 서버 상태 확인",
          why: "VPN이 연결을 방해하거나, 서버 자체 장애일 수 있습니다.",
          how: "VPN을 잠시 끄고 재시도하고, 게임 공식 서버 상태 페이지에서 장애 여부를 확인하세요."
        }
      ],
      deeper: [
        {
          heading: "내 PC 문제인지 서버 문제인지 구분하기",
          text: "같은 시간에 다른 사람도 같은 게임에서 연결 오류를 겪고 있다면 서버 측 장애일 가능성이 높으므로, 개인 네트워크 설정을 더 건드릴 필요는 없습니다."
        }
      ],
      decision: [
        {
          heading: "내 PC에서만 반복될 때",
          text: "런처 캐시 삭제와 공유기 재시작을 먼저 시도하고, DNS·VPN 설정을 함께 점검하세요."
        },
        {
          heading: "여러 사람이 동시에 겪을 때",
          text: "서버 측 장애일 가능성이 높으니 공식 서버 상태 페이지를 먼저 확인하세요."
        }
      ],
      examples: [
        "배틀넷 오류(BLZBNTBNA0000)로 오버워치가 실행되지 않는다",
        "런처가 서버 연결 중 상태에서 몇 분째 멈춰 있다"
      ],
      mistakes: [
        "서버 장애 여부 확인 없이 네트워크 설정만 계속 바꾸는 것",
        "VPN 사용 여부를 확인하지 않는 것"
      ],
      faq: [
        {
          q: "인터넷은 되는데 게임만 연결이 안 됩니다.",
          a: "그렇다면 일반 네트워크 문제보다 런처 캐시나 해당 게임 서버 상태를 먼저 의심해야 합니다."
        },
        {
          q: "다른 게임은 잘 되는데 특정 게임만 연결이 안 되면 인터넷 문제는 아닌가요?",
          a: "인터넷 자체보다는 해당 게임 서버 상태나 방화벽의 게임별 예외 설정 문제일 가능성이 높습니다."
        },
        {
          q: "VPN을 쓰면 연결 오류가 줄어드나요?",
          a: "일부 지역 접속 문제에는 도움이 될 수 있지만, 게임사 약관상 VPN 사용이 제한되는 경우도 있어 먼저 공식 안내를 확인하는 것이 좋습니다."
        }
      ]
    }
  }
};
