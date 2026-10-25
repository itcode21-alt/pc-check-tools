// 정보 수준(information) 이벤트 79건을 묶어 설명하는 그룹 페이지의 편집 내용.
//
// 개별 상세 페이지를 만들면 "정상 기록입니다" 한 줄짜리 얇은 페이지가 79개 생기므로,
// 이벤트 뷰어에서 함께 보이는 기록끼리 묶어 한 페이지에서 "정상인지, 언제 걱정할지"를 설명한다.
// 표의 각 줄(의미·확인할 때)은 data.js의 해당 이벤트 항목에서 그대로 가져온다 —
// 그래서 여기에는 새 기술 주장을 넣지 않고, 묶음 단위의 설명과 FAQ만 쓴다.
// members는 data.js의 "source id" 형식이다(source는 data.js에 적힌 그대로).

export const groups = [
  {
    file: "event-info-boot.html",
    eyebrow: "부팅 기록",
    short: "부팅 때마다 남는 정보 기록",
    title: "부팅 때마다 남는 정보 기록 — Kernel-Boot·Kernel-General·EventLog 6009",
    desc: "Kernel-Boot 18·25·27·30·32·238, Kernel-General 15·16·20·24·25, EventLog 6009 같은 부팅 정보 기록의 뜻과, 이 기록이 실제 문제의 단서가 되는 드문 경우를 정리했습니다.",
    lead: "이벤트 뷰어의 시스템 로그를 열면 부팅 직후 정보(Information) 수준 기록이 줄줄이 남아 있습니다. 대부분은 부팅 구성과 시간을 보고하는 정상 기록이며, 이 기록이 있다는 사실만으로 PC에 문제가 있다고 볼 수 없습니다.",
    intro: [
      "이 묶음은 부팅 옵션, 펌웨어가 알려 준 부팅 시간, 시스템 시간 초기화, 레지스트리 유지 관리 같은 기록입니다. 값을 읽어야 의미가 생기는 기록이라, 평소에는 지나쳐도 됩니다.",
      "실제로 쓸 일이 생기는 때는 두 가지입니다. 부팅이 느려서 펌웨어 단계가 긴지 보고 싶을 때(Kernel-Boot 30), 부팅 시각이 어긋나 보일 때(Kernel-Boot 238, Kernel-General 25)입니다."
    ],
    members: [
      "Kernel-Boot 18", "Kernel-Boot 25", "Kernel-Boot 27", "Kernel-Boot 30", "Kernel-Boot 32", "Kernel-Boot 238",
      "Kernel-General 15", "Kernel-General 16", "Kernel-General 20", "Kernel-General 24", "Kernel-General 25",
      "EventLog 6009", "Subsys-SMSS 17", "Wininit 23", "Wininit 24", "Wininit 25"
    ],
    judge: [
      "같은 시각에 오류(Error)·경고(Warning) 수준 기록이 없으면 이 묶음은 무시해도 됩니다.",
      "시각이 어긋나 보이면 Kernel-General 25의 Success 값과 RTC 오류 코드, Kernel-Boot 238의 펌웨어 시간을 보고 BIOS 시계와 메인보드 배터리(CMOS)를 확인합니다.",
      "부팅이 느리면 Kernel-Boot 30의 펌웨어 단계 시간을 다른 날과 비교하고, BitLocker PIN 입력 때문이라면 Kernel-Boot 32의 값이 0이 아닌지 봅니다.",
      "Wininit 23·24·25는 부팅 앱 롤백 방지 기능의 기록입니다. HRESULT나 Win32Error가 성공(0)이 아닐 때만 확인합니다."
    ],
    faqs: [
      ["부팅 때마다 이런 기록이 남는데 PC가 고장 난 건가요?", "아닙니다. 정보 수준 기록은 정상 부팅 과정을 보고하는 것이며, 오류를 뜻하지 않습니다. 같은 시각의 오류·경고 기록과 실제 증상이 있을 때만 단서로 씁니다."],
      ["Kernel-Boot 153도 이 묶음인가요?", "아닙니다. Kernel-Boot 153은 가상화 기반 보안 사용 기록이라 별도 묶음(VBS·보안 기록 페이지)에서 설명합니다. 디스크 153이나 그래픽 드라이버 153과는 원본이 다릅니다."]
    ],
    related: ["event-eventlog-6005.html", "event-eventlog-6013.html", "event-kernel-boot-20.html", "event-kernel-boot-247.html", "event-diagnostics-performance-100.html"]
  },
  {
    file: "event-info-security-vbs.html",
    eyebrow: "보안 기능 기록",
    short: "가상화 기반 보안·TPM 정보 기록",
    title: "가상화 기반 보안(VBS)·Credential Guard·TPM 정보 기록 정리",
    desc: "Hyper-V-Hypervisor, IsolatedUserMode, Wininit 12·14·18·19, LsaSrv 6156, TPM-WMI 1025·1282, Directory-Services-SAM 같은 보안 기능 정보 기록이 정상인지 판단하는 방법입니다.",
    lead: "메모리 무결성(VBS·HVCI), Windows Hello, TPM, Credential Guard가 켜진 PC는 부팅할 때마다 보안 기능이 시작됐다는 정보 기록을 남깁니다. 기록이 많이 보여도 정상 동작의 증거입니다.",
    intro: [
      "Hyper-V-Hypervisor 1이 부팅 때마다 보이는 것은 하이퍼바이저가 정상 시작됐다는 뜻이며, 메모리 무결성(VBS)이나 WSL2·가상 머신 기능을 쓰면 남습니다. 가상 머신을 안 쓰더라도 VBS 때문에 보일 수 있습니다.",
      "값이 0으로 적힌 항목(예: LsaSrv 6156, Wininit 14)은 해당 기능의 조건을 충족하지 않거나 쓰지 않는다는 뜻이지 오류가 아닙니다. 이 묶음에서 실제로 확인할 가치가 있는 값은 아래 '걱정해야 하는 때'에 정리했습니다."
    ],
    members: [
      "Hyper-V-Hypervisor 1", "Hyper-V-Hypervisor 2", "Hyper-V-Hypervisor 129", "Hyper-V-Hypervisor 156", "Hyper-V-Hypervisor 165",
      "IsolatedUserMode 1", "IsolatedUserMode 2", "IsolatedUserMode 3", "IsolatedUserMode 5",
      "Kernel-Boot 153", "Wininit 12", "Wininit 14", "Wininit 18", "Wininit 19", "LsaSrv 6156", "HAL 16",
      "TPM-WMI 1025", "TPM-WMI 1046", "TPM-WMI 1282", "TPM 18",
      "Directory-Services-SAM 16962", "Directory-Services-SAM 16977", "Directory-Services-SAM 16983"
    ],
    judge: [
      "Hyper-V-Hypervisor 129의 Problems 값이 0x0이 아니면 BIOS의 IOMMU·가상화 설정을 확인합니다.",
      "IsolatedUserMode 1·5의 status가 STATUS_SUCCESS가 아닐 때만 해당 Trustlet(예: Windows Hello 관련 NgcIso.exe)을 확인합니다.",
      "IsolatedUserMode 3의 flags에 HvciEnabled가 있으면 메모리 무결성이 켜진 상태입니다. 호환되지 않는 드라이버 때문에 메모리 무결성을 끈 경우 이 flags가 달라집니다.",
      "Wininit 19·23·25는 HRESULT, Wininit 24는 Win32Error가 성공(0)이 아닐 때만 확인합니다.",
      "TPM 관련 오류(경고·오류 수준)가 따로 있을 때만 tpm.msc로 상태를 확인합니다. BitLocker 복구 키를 확보하기 전에 TPM을 초기화하지 마세요.",
      "Directory-Services-SAM 기록은 Windows의 기본 보안 강화·감사 동작입니다. 암호 정책을 점검하는 경우가 아니면 볼 필요가 없습니다."
    ],
    faqs: [
      ["Hyper-V를 쓰지 않는데 Hyper-V-Hypervisor 기록이 남아요.", "메모리 무결성(VBS)이나 WSL2·샌드박스처럼 하이퍼바이저를 쓰는 기능이 켜져 있으면 가상 머신을 직접 쓰지 않아도 부팅 때마다 남습니다. 끄고 싶다면 Windows 기능과 메모리 무결성 설정을 확인하세요."],
      ["LsaSrv 6156이나 Wininit 14의 값이 0인데 괜찮은가요?", "괜찮습니다. 값 0은 Credential Guard를 자동 사용하는 조건(가상화 기반 보안 하드웨어 요건, 도메인 가입 여부, 라이선스)을 충족하지 않거나 쓰지 않는다는 뜻입니다. Credential Guard를 쓰려는 환경일 때만 각 값을 확인하세요."],
      ["Kernel-Boot 153이 보이는데 디스크 오류인가요?", "아닙니다. 원본이 Kernel-Boot인 153은 가상화 기반 보안이 사용 설정되어 있다는 부팅 보안 기록입니다. Disk 153(입출력 재시도)이나 nvlddmkm 153(그래픽)과는 무관합니다."]
    ],
    related: ["event-tpm-15.html", "event-tpm-30.html", "event-tpm-wmi-1801.html", "event-hal-15.html", "event-security-1102.html"]
  },
  {
    file: "event-info-network.html",
    eyebrow: "네트워크 기록",
    short: "네트워크 서비스·어댑터 정보 기록",
    title: "DHCP·HttpService·Wi-Fi·랜 어댑터 정보 기록 정리",
    desc: "Dhcp-Client 50036·50037·50103~50106, DHCPv6-Client 51046·51047·51057, HttpService 111~114, Netwtw08 7021·7025·7026, e1rexpress 32, BTHUSB 18이 정상인지 판단하는 방법입니다.",
    lead: "네트워크 서비스와 어댑터 드라이버는 시작·종료 때마다 정보 기록을 남깁니다. 시작/종료 기록이 짝지어 반복되는 것은 정상이고, 실제 연결 끊김과 같은 시각에 있을 때만 단서가 됩니다.",
    intro: [
      "Dhcp-Client와 DHCPv6-Client 기록은 서비스가 시작되거나 종료될 때마다 한 줄씩 남습니다. 종료 때는 50103~50106처럼 여러 줄이 연달아 나오는데, 종료 절차의 단계별 기록이라 많아 보여도 정상입니다.",
      "HttpService 111~114는 프로그램이 로컬 웹 서버 기능을 켜고 끌 때(UPnP 장치 검색 서비스 등) 남습니다. Status가 0x0이면 성공입니다."
    ],
    members: [
      "Dhcp-Client 50036", "Dhcp-Client 50037", "Dhcp-Client 50103", "Dhcp-Client 50104", "Dhcp-Client 50105", "Dhcp-Client 50106",
      "DHCPv6-Client 51046", "DHCPv6-Client 51047", "DHCPv6-Client 51057",
      "HttpService 111", "HttpService 112", "HttpService 113", "HttpService 114",
      "Netwtw08 7021", "Netwtw08 7025", "Netwtw08 7026", "e1rexpress 32", "BTHUSB 18"
    ],
    judge: [
      "인터넷이 실제로 끊기지 않았다면 이 묶음은 무시해도 됩니다.",
      "IP 주소를 받지 못하는 증상이면 이 묶음이 아니라 DHCP-Client 1001 같은 오류·경고 기록과 ipconfig /all의 IPv4 주소·게이트웨이를 확인하세요.",
      "Wi-Fi가 끊길 때는 Netwtw08 기록의 발생 시각을 실제 끊김과 맞춰 보고, 제조사 무선 드라이버와 전원 관리 설정을 확인합니다.",
      "유선 랜이 끊길 때는 e1rexpress 32 기록의 시각을 대조하고, 다른 케이블·스위치 포트와 최신 제조사 드라이버로 교차 확인합니다.",
      "HttpService 112·113의 Status가 0x0이 아닐 때만 해당 URL과 프로세스를 확인합니다.",
      "블루투스 장치가 실제로 끊기거나 페어링에 실패할 때만 BTHUSB 18의 장치 주소·상태를 XML에서 확인하고 다른 USB 포트와 교차 테스트합니다."
    ],
    faqs: [
      ["종료할 때 Dhcp-Client 기록이 여러 줄 나와요.", "정상입니다. 50103~50106은 종료 알림 등록, 종료 알림 수신, 요청 처리 루프 종료, DHCPv6 서비스 종료 대기 같은 종료 절차의 단계별 기록입니다."],
      ["Netwtw08 기록이 있는데 무선 카드가 불량인가요?", "정보 수준 기록만으로는 무선 카드 불량을 단정할 수 없습니다. 실제 Wi-Fi 끊김이 반복되고 그 시각에 같은 기록이 겹칠 때만 드라이버와 전원 관리를 점검하세요."],
      ["e1rexpress 32와 e2fexpress 32는 같은 건가요?", "원본이 다른 기록입니다. e2fexpress 32는 별도 페이지에서 설명하며, 이 묶음의 e1rexpress 32는 정보 수준 기록입니다."]
    ],
    related: ["event-dhcp-client-1001.html", "event-wlan-autoconfig-10002.html", "event-e1rexpress-27.html", "event-e2fexpress-32.html", "hardware-wifi-disconnect.html"]
  },
  {
    file: "event-info-power-time-update.html",
    eyebrow: "전원·시간·업데이트 기록",
    short: "전원·시간·로그온·업데이트 정보 기록",
    title: "Kernel-Power 107·187·566·130·131, Time-Service, Winlogon, WindowsUpdateClient 정보 기록",
    desc: "절전·재개, 시간 동기화, 로그온·로그오프, Windows Update 상태를 알리는 정보 수준 기록이 정상인지, 어떤 기록과 함께 봐야 하는지 정리했습니다.",
    lead: "이 묶음은 비정상 종료나 업데이트 실패를 판단할 때 보조 단서로 쓰는 정보 기록입니다. 단독으로는 문제를 뜻하지 않으며, 41·6008·20·25 같은 결과 기록과 시각을 맞춰 볼 때 가치가 생깁니다.",
    intro: [
      "Kernel-Power 107·187·566은 전원 상태 전환과 정책 처리를 알리는 정보 기록입니다. 전원 공급 장치(PSU) 고장을 뜻하지 않으며, 비정상 종료를 판단할 때는 Kernel-Power 41·EventLog 6008과 사용자 작업 시각을 함께 봅니다.",
      "Kernel-Power 130·131은 절전(S3) 진입·복귀에 펌웨어가 걸린 시간을 남깁니다. 오류가 아니라 시간 값이며, 복귀가 느리게 느껴질 때 다른 날과 비교하는 용도입니다."
    ],
    members: [
      "Microsoft-Windows-Kernel-Power 107", "Microsoft-Windows-Kernel-Power 187", "Microsoft-Windows-Kernel-Power 566",
      "Kernel-Power 130", "Kernel-Power 131",
      "Time-Service 35", "Microsoft-Windows-Time-Service 37",
      "Microsoft-Windows-Winlogon 7001", "Microsoft-Windows-Winlogon 7002",
      "Microsoft-Windows-WindowsUpdateClient 19", "Microsoft-Windows-WindowsUpdateClient 43", "Microsoft-Windows-WindowsUpdateClient 44"
    ],
    judge: [
      "재부팅·블루스크린이 실제로 있었다면 Kernel-Power 41, EventLog 6008과 시간순으로 비교합니다. 정보 기록만 반복되면 전원 부품을 교체하지 않습니다.",
      "절전 복귀가 느리면 Kernel-Power 131의 FullResume 값을 다른 날과 비교하고, 복귀 뒤 화면·네트워크가 돌아오지 않으면 그래픽·네트워크 드라이버와 Kernel-Power 172를 함께 확인합니다.",
      "시계가 실제로 틀릴 때만 w32tm /query /status로 마지막 동기화 상태를 확인합니다. Time-Service 기록만으로 메인보드 배터리나 RTC 고장을 판단하지 마세요.",
      "Winlogon 7001·7002는 Service Control Manager의 7001과 원본이 다릅니다. 로그인 지연이나 예상하지 못한 로그오프가 있을 때만 주변 이벤트와 비교합니다.",
      "WindowsUpdateClient 19·43·44는 결과 코드(ResultCode)가 없는 정보 기록이면 실패가 아닙니다. 실제 실패는 설정의 Windows Update 기록과 WindowsUpdateClient 20·25·31 같은 후속 기록으로 판단합니다.",
      "WHEA-Logger 19와 WindowsUpdateClient 19는 번호만 같습니다. 원본을 먼저 확인하세요."
    ],
    faqs: [
      ["Kernel-Power 107·187·566이 많이 보이는데 파워가 문제인가요?", "아닙니다. 정상적인 전원 상태 전환·정책 처리 기록입니다. 비정상 종료 증거(41·6008)가 없고 실제 증상이 없다면 조치하지 않아도 됩니다."],
      ["WindowsUpdateClient 44가 있으면 업데이트가 실패한 건가요?", "아닙니다. 44는 업데이트 설치 또는 재부팅 후 상태를 갱신한 기록입니다. 결과 코드가 없는 정보 기록을 실패로 해석하지 마세요."],
      ["절전 복귀 기록(131)의 시간이 길면 부품 고장인가요?", "값만으로는 단정할 수 없습니다. 체감 복귀 지연이 있을 때 다른 날 값과 비교하고, 그래픽·네트워크 드라이버와 전원 계획을 함께 확인하세요."]
    ],
    related: ["event-kernel-power-41.html", "event-eventlog-6008.html", "event-power-sleep-wake.html", "event-windowsupdateclient-20.html", "event-time-service-134.html"]
  },
  {
    file: "event-info-devices.html",
    eyebrow: "장치·드라이버 기록",
    short: "장치·드라이버·백업 구성 요소 정보 기록",
    title: "DriverFrameworks·volsnap 33·FilterManager·TPM-WMI·Sandboxie 정보 기록",
    desc: "UMDF 드라이버(DriverFrameworks-UserMode 10000·10002·10100), volsnap 33, FilterManager 1·6, TPM-WMI 1038·1041, Win32k 267, SbieDrv 1101 정보 기록의 의미와 확인 기준을 정리했습니다.",
    lead: "장치 드라이버와 파일 시스템 필터, 백업(VSS) 구성 요소도 연결·로드될 때 정보 기록을 남깁니다. 실제 장치 오류나 디스크 지연이 있을 때만 어떤 드라이버가 끼어 있는지 보는 단서로 씁니다.",
    intro: [
      "FilterManager 6은 파일 시스템 필터 드라이버가 로드되어 등록됐다는 기록입니다. 백신, 클라우드 동기화(CldFlt), 샌드박스(SbieDrv) 같은 프로그램이 있으면 그 수만큼 부팅 때 남습니다. DeviceName으로 어떤 드라이버가 디스크 입출력에 끼어드는지 알 수 있습니다.",
      "DriverFrameworks-UserMode 10000·10002·10100은 USB·오디오·HID 같은 장치의 사용자 모드 드라이버가 시작되거나 상태를 갱신할 때 남습니다. 장치가 실제로 끊기지 않으면 정상 연결 기록입니다."
    ],
    members: [
      "Microsoft-Windows-DriverFrameworks-UserMode 10000", "Microsoft-Windows-DriverFrameworks-UserMode 10002", "Microsoft-Windows-DriverFrameworks-UserMode 10100",
      "volsnap 33", "FilterManager 1", "FilterManager 6", "SbieDrv 1101",
      "Microsoft-Windows-TPM-WMI 1038", "Microsoft-Windows-TPM-WMI 1041", "Win32k 267"
    ],
    judge: [
      "장치가 실제로 끊기거나 기능이 중단될 때만 XML의 DeviceName·InstanceId·Status를 확인하고, 같은 시각의 DriverFrameworks 10110·10111과 장치 관리자의 노란색 오류를 비교합니다.",
      "volsnap 33은 정보 이벤트입니다. 백업·복원 지점이 실패하지 않는다면 복원 지점을 임의로 삭제하지 마세요. 같은 시각에 volsnap 36·Disk·Ntfs 오류가 있는지 비교합니다.",
      "디스크 지연이나 블루스크린이 있을 때는 FilterManager 6의 DeviceName에 낯선 서드파티 필터 드라이버가 있는지 보고, 잠시 제거해 비교하는 것을 후보에 넣을 수 있습니다.",
      "Sandboxie(SbieDrv)를 쓰지 않는다면 제거 여부를 확인하세요. 게임·디스크 지연 증상이 있을 때만 제거해 비교합니다.",
      "TPM-WMI 1038·1041은 BitLocker·Windows Hello·보안 부팅 문제가 동반될 때만 tpm.msc와 XML의 Result·Status를 확인합니다. 복구 키를 확보하기 전에는 TPM을 초기화하지 마세요."
    ],
    faqs: [
      ["FilterManager 기록이 많은데 디스크가 느려지는 원인인가요?", "로드 기록 자체는 문제가 아닙니다. 다만 디스크 지연·블루스크린이 있다면 서드파티 필터 드라이버(백신·클라우드 동기화·샌드박스)가 의심 후보가 될 수 있어, DeviceName으로 확인한 뒤 잠시 제거해 비교해 볼 수 있습니다."],
      ["volsnap 33이 보이는데 저장장치가 고장난 건가요?", "아닙니다. 볼륨 섀도 복사본과 VSS 저장 영역 상태를 알리는 정보 이벤트입니다. 같은 시각에 volsnap 36, Disk, Ntfs 오류가 있을 때만 저장장치를 의심하세요."],
      ["DriverFrameworks 10100이 반복돼요.", "부팅·절전 복귀·장치 연결 직후의 정상 초기화일 수 있습니다. 실제 장치 끊김과 같은 시각에 반복될 때만 장치 이름과 상태 코드를 확인하세요."]
    ],
    related: ["event-driverframeworks-10110.html", "event-volsnap-36.html", "event-vss-8193.html", "event-tpm-30.html", "hardware-usb-not-detected.html"]
  }
];
