import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const today = "2026-07-16";

const context = {};
vm.createContext(context);
let dataSrc = fs.readFileSync(path.join(root, "data.js"), "utf8")
  .replace("window.SITE_DATA = ", "globalThis.SITE_DATA = ");
vm.runInContext(dataSrc, context);
const data = context.SITE_DATA;

const codeToFile = {};
data.errorCodes.forEach((c) => { codeToFile[c.code.toUpperCase()] = c.detailPage || c.link; });

const guideTitles = {
  "hardware-gaming-reboot.html": "게임 중 재부팅 가이드",
  "hardware-overheat-shutdown.html": "과열로 인한 강제 종료 가이드",
  "windows-app-not-launching.html": "앱 실행 불가 가이드",
  "windows-bsod-critical-process.html": "Critical Process Died 가이드",
  "hardware-nvme-delay.html": "NVMe 인식 지연 가이드",
  "windows-auto-repair-loop.html": "자동 복구 루프 가이드",
  "hardware-usb-not-detected.html": "USB 미인식 가이드",
  "windows-startup-slow.html": "시작 속도 저하 가이드",
  "hardware-wifi-disconnect.html": "Wi-Fi 연결 끊김 가이드",
  "hardware-no-display.html": "화면 미출력 가이드"
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

// Per-event-ID editorial content: page metadata, a genuine 2-sentence interpretation,
// and real FAQ pairs. Written by hand per ID rather than derived mechanically from the
// terse data.js arrays, so each page reads as an edited article, not a template dump.
const eventCopy = {
  "1074": {
    file: "event-user32-1074.html",
    title: "User32 이벤트 1074 계획된 종료·재시작 확인",
    eyebrow: "종료·재시작",
    interpretation: "1074는 Windows가 종료나 재시작 요청을 받았을 때 남기는 정보 기록입니다. Kernel-Power 41처럼 갑작스러운 전원 차단을 뜻하는 이벤트가 아니므로, 먼저 요청한 프로세스와 사용자를 확인해야 합니다.",
    additional: "Windows Update나 설치 프로그램이 재시작을 요청한 경우에는 정상적인 기록일 수 있습니다. 반대로 예상하지 못한 프로세스가 반복해서 요청한다면 최근 설치 항목과 보안 로그를 함께 비교하세요.",
    faqs: [
      { q: "1074가 있으면 PC 고장인가요?", a: "아닙니다. 사용자의 종료·재시작이나 Windows Update 같은 계획된 동작도 1074를 남깁니다. 프로세스 이름과 발생 시각을 실제 작업과 비교해야 합니다." },
      { q: "1074와 Kernel-Power 41을 같이 봐야 하나요?", a: "네. 1074는 종료 요청 주체를, 41은 정상 종료되지 않은 결과를 보여줍니다. 두 기록의 시각을 비교하면 계획된 재시작과 갑작스러운 전원 차단을 구분하는 데 도움이 됩니다." }
    ]
  },
  "1002": {
    file: "event-application-hang-1002.html",
    title: "Application Hang 이벤트 1002 프로그램 멈춤 점검",
    eyebrow: "응용 프로그램",
    interpretation: "1002는 프로그램이 일정 시간 응답하지 않아 Windows가 멈춤 상태로 기록한 이벤트입니다. Application Error 1000처럼 예외로 종료된 기록과는 다르므로, 멈춤이 시작된 작업과 회복 여부를 먼저 확인해야 합니다.",
    additional: "한 앱에서만 반복되면 앱 설정·플러그인·오버레이를 우선 확인하고, 여러 앱이 같은 시간대에 멈추면 그래픽 드라이버·저장장치·메모리 사용량을 비교하세요.",
    faqs: [
      { q: "1002는 RAM 고장을 의미하나요?", a: "아닙니다. 앱 자체의 대기, 저장장치 지연, 그래픽 드라이버, 플러그인 충돌 등 여러 원인이 가능합니다. 여러 앱에서 무작위로 반복되는지부터 비교하세요." },
      { q: "1000과 1002는 어떻게 구분하나요?", a: "1000은 처리하지 못한 예외로 앱이 종료된 기록이고, 1002는 응답 없음 상태가 이어진 기록입니다. 1000은 예외 코드·모듈을, 1002는 멈춤 시점·작업·반복 빈도를 확인하세요." }
    ]
  },
  "1026": {
    file: "event-dotnet-runtime-1026.html",
    title: ".NET Runtime 이벤트 1026 앱 예외 점검",
    eyebrow: "응용 프로그램",
    interpretation: ".NET Runtime 1026는 .NET으로 실행되는 프로그램에서 처리되지 않은 예외가 발생했다는 기록입니다. 이벤트만으로 .NET을 무조건 삭제·재설치하기보다 대상 앱과 예외 유형을 먼저 확인해야 합니다.",
    additional: "같은 앱에서만 반복되면 해당 앱의 런타임 버전·플러그인·설정 범위를, 여러 .NET 앱에서 발생하면 공용 런타임과 Windows 업데이트 상태를 비교하세요.",
    faqs: [
      { q: "1026이 뜨면 .NET을 다시 설치해야 하나요?", a: "항상 그렇지는 않습니다. 예외 유형과 대상 앱이 요구하는 .NET 버전을 먼저 확인하고, 공식 설치 파일의 복구 또는 업데이트를 우선 검토하세요." },
      { q: "0xC0000005가 함께 보이면 RAM 문제인가요?", a: "아닙니다. 잘못된 메모리 접근은 앱 버그·플러그인·드라이버에서도 발생할 수 있습니다. 같은 앱에서만 반복되는지와 여러 앱의 충돌 여부를 함께 비교하세요." }
    ]
  },
  "6008": {
    file: "event-eventlog-6008.html",
    title: "EventLog 6008 비정상 종료 기록 확인",
    eyebrow: "종료·재부팅",
    interpretation: "6008은 원인이 아니라 이전 종료가 정상 절차를 거치지 못했다는 결과 기록입니다. Kernel-Power 41과 같은 순간을 서로 다른 방식으로 남기는 경우가 많아, 둘 중 하나만 보고 판단하기보다 함께 비교해야 합니다.",
    additional: "블루스크린이나 강제 종료가 있었던 기억이 없는데도 반복된다면, 절전 모드 전환이나 자동 업데이트 재부팅과 겹쳤을 가능성도 확인해보세요. 실제 작업 중 피해(파일 손상, 저장 실패)가 있었는지가 조치 필요 여부를 가르는 기준입니다.",
    faqs: [
      { q: "6008과 Kernel-Power 41 중 어느 것을 먼저 확인해야 하나요?", a: "같은 종료를 서로 다른 방식으로 기록한 것이라 우선순위가 있는 것은 아닙니다. 두 기록의 시각과 그 앞뒤로 남은 다른 하드웨어 이벤트를 함께 보는 것이 원인 파악에 더 도움이 됩니다." },
      { q: "이 이벤트만 반복되고 실제 문제는 없는데 괜찮나요?", a: "사용에 지장이 없다면 급하게 조치할 필요는 없습니다. 다만 저장 중 전원이 꺼지거나 화면이 멈춘 뒤 강제 종료한 기억이 있다면, 그 원인부터 살펴보는 것이 안전합니다." }
    ]
  },
  "1001": {
    file: "event-wer-1001.html",
    title: "Windows Error Reporting 1001 원인과 확인 순서",
    eyebrow: "오류 보고",
    interpretation: "1001은 블루스크린, 앱 충돌, 하드웨어 오류가 Windows 오류 보고 시스템에 등록됐다는 기록입니다. 이벤트 자체가 블루스크린을 의미하지는 않으므로, 세부 정보의 보고 유형(Report Type)을 먼저 확인해 정확한 원인을 구분해야 합니다.",
    additional: "이 이벤트 자체는 문제를 해결하지 않고 기록만 남기므로, 반복되는 보고 유형과 대상 프로그램을 정리해두면 이후 같은 증상이 발생했을 때 원인을 훨씬 빠르게 좁힐 수 있습니다.",
    faqs: [
      { q: "1001 이벤트가 뜨면 블루스크린이 있었다는 뜻인가요?", a: "아닙니다. 블루스크린 외에도 앱 충돌이나 하드웨어 오류 보고로 기록될 수 있습니다. 이벤트 세부 정보의 보고 유형을 확인하면 정확한 원인을 구분할 수 있습니다." },
      { q: "덤프 파일이 없는데도 이 이벤트가 남을 수 있나요?", a: "네, 일부 환경에서는 전체 메모리 덤프 생성이 비활성화되어 있어도 오류 보고 자체는 별도로 기록될 수 있습니다." }
    ]
  },
  "51": {
    file: "event-disk-51.html",
    title: "Disk 이벤트 51 페이징 지연 점검",
    eyebrow: "저장장치",
    interpretation: "51은 페이징 작업 중 저장장치 입출력이 지연됐다는 경고 기록입니다. 심각도가 오류(7)보다 낮게 분류되지만, 반복 빈도가 늘어난다면 같은 저장장치 문제의 초기 신호일 수 있습니다.",
    additional: "가벼운 작업에서는 거의 나타나지 않다가 대용량 파일 작업이나 여러 프로그램을 동시에 켰을 때만 나타난다면, 저장장치 자체보다 시스템 자원(RAM) 부족이 배경일 수 있습니다.",
    faqs: [
      { q: "51은 이벤트 7보다 덜 심각한 건가요?", a: "경고(warning) 수준으로 분류되지만, 반복되면 7과 마찬가지로 저장장치 상태 저하의 초기 신호일 수 있습니다. 등급보다 반복 빈도를 우선 확인하세요." },
      { q: "메모리 사용량이 높을 때만 뜨는 이유는 무엇인가요?", a: "페이지 파일에 접근하는 순간 디스크 응답이 느리면 기록되므로, 메모리가 부족해 페이징이 잦아지는 상황에서 더 자주 나타날 수 있습니다." }
    ]
  },
  "55": {
    file: "event-ntfs-55.html",
    title: "Ntfs 이벤트 55 파일 시스템 손상 점검",
    eyebrow: "저장장치",
    interpretation: "55는 NTFS 파일 시스템 구조에서 손상이 감지됐다는 기록으로, 비정상 종료나 저장장치 자체 문제로 발생할 수 있습니다. 복구 명령을 실행하기 전에 데이터를 백업하는 것이 우선입니다.",
    additional: "손상 범위가 넓다면 검사 중 일부 파일이나 폴더가 복구되지 못하고 사라질 수 있으므로, chkdsk를 실행하기 전 접근 가능한 파일부터 우선 백업해두는 순서를 지키세요.",
    faqs: [
      { q: "55가 뜨면 항상 디스크 검사를 실행해야 하나요?", a: "검사 전에 먼저 중요한 데이터를 백업하세요. 물리적으로 불안정한 디스크에서는 쓰기 부하가 큰 검사 자체가 추가 부담이 될 수 있습니다." },
      { q: "재부팅했더니 디스크 검사가 자동으로 실행됐는데 정상인가요?", a: "네, NTFS 손상이 감지되면 Windows가 다음 부팅 시 검사를 자동으로 예약하는 경우가 있습니다. 검사가 끝날 때까지 강제로 종료하지 마세요." }
    ]
  },
  "153": {
    file: "event-disk-153.html",
    title: "Disk 이벤트 153 재시도 기록 점검",
    eyebrow: "저장장치",
    interpretation: "153은 디스크 입출력 작업이 재시도됐다는 기록으로, 일시적 지연일 수도 있고 연결 문제의 초기 단서일 수도 있습니다. 이벤트 7·129와 같은 디스크에서 함께 늘어나는지 확인하는 것이 핵심입니다.",
    additional: "같은 디스크에서 재시도 횟수가 눈에 띄게 늘어나는 추세라면, 지금 당장 문제가 없어 보여도 여유 있을 때 백업 주기를 앞당기는 것이 안전합니다.",
    faqs: [
      { q: "153만 있고 7이나 129는 없는데 괜찮은가요?", a: "153 단독이라면 일시적 재시도일 가능성이 있습니다. 다만 게임 로딩이나 파일 복사 중 실제로 느려지는 증상이 함께 있다면 계속 관찰하세요." },
      { q: "외장 저장장치에서도 153이 흔한가요?", a: "네, USB 연결은 케이블·허브 상태에 따라 내장 저장장치보다 이 기록이 더 자주 남을 수 있습니다." }
    ]
  },
  "17": {
    file: "event-whea-logger-17.html",
    title: "WHEA-Logger 17 PCIe 수정된 오류 점검",
    eyebrow: "하드웨어 오류",
    interpretation: "17은 PCIe 계열 하드웨어 오류가 발생했지만 자체적으로 수정되어 시스템이 계속 실행됐다는 기록입니다. 수정됐다고 안심하기보다 반복 횟수가 늘어나는지를 지켜봐야 합니다.",
    additional: "이 기록이 뜨는 시점에 온도나 부하가 유난히 높았는지 비교해보면, 냉각 문제인지 장치 자체의 노후화인지 힌트를 얻을 수 있습니다.",
    faqs: [
      { q: "17은 수정된 오류라던데 무시해도 되나요?", a: "수정되어 시스템이 계속 실행됐다는 뜻이지만, 반복 횟수가 늘어난다면 PCIe 장치나 드라이버 문제가 진행 중일 수 있으므로 지켜봐야 합니다." },
      { q: "GPU와 NVMe 중 어느 쪽부터 확인해야 하나요?", a: "이벤트 세부 정보의 버스 위치(Bus)와 장치 ID를 확인하면 어떤 장치와 연관됐는지 특정할 수 있습니다." }
    ]
  },
  "19": {
    file: "event-whea-logger-19.html",
    title: "WHEA-Logger 19 수정된 하드웨어 오류 점검",
    eyebrow: "하드웨어 오류",
    interpretation: "19는 CPU, 메모리, PCIe 상태에서 수정된 하드웨어 오류가 보고됐다는 기록입니다. WHEA 18(수정 불가능한 치명적 오류)로 악화되기 전 신호일 수 있어 반복 패턴을 눈여겨봐야 합니다.",
    additional: "기본 설정으로 되돌린 뒤에도 계속 반복된다면 오버클럭이나 설정 문제가 아니라 부품 자체의 한계일 가능성을 열어두고 교차 테스트를 계획하세요.",
    faqs: [
      { q: "19와 18의 차이는 무엇인가요?", a: "18은 수정할 수 없는 치명적 오류이고, 19는 수정되어 시스템이 계속 실행된 오류입니다. 19가 반복되며 늘어난다면 18로 악화되기 전 신호로 볼 수 있습니다." },
      { q: "절전 복귀 뒤에만 나타나면 괜찮은가요?", a: "절전 관련 전압 전환 과정의 일시적 현상일 수 있지만, 반복된다면 BIOS의 전원 관리 설정을 점검해보세요." }
    ]
  },
  "20": {
    file: "event-whea-logger-20.html",
    title: "WHEA-Logger 20 치명적 하드웨어 오류 점검",
    eyebrow: "하드웨어 오류",
    interpretation: "20은 치명적 하드웨어 오류가 보고됐다는 기록으로, 오류 레코드에 표시된 구성 요소를 확인해 CPU·메모리·PCIe 장치 중 어디와 관련됐는지 좁혀야 합니다.",
    additional: "치명적으로 분류되어 있어도 시스템이 몇 차례 더 정상 부팅됐다면 즉시 부품을 교체하기보다 재현 조건을 먼저 기록하는 편이 낫습니다.",
    faqs: [
      { q: "20이 뜨면 바로 블루스크린이 되나요?", a: "항상 그런 것은 아니지만, 치명적 오류로 분류되어 블루스크린 직전이나 직후에 함께 기록되는 경우가 많습니다." },
      { q: "오류 레코드의 구성 요소는 어디서 확인하나요?", a: "이벤트 뷰어의 자세히 탭에서 XML 보기를 선택하면 영향받은 하드웨어 구성 요소 정보를 확인할 수 있습니다." }
    ]
  },
  "46": {
    file: "event-whea-logger-46.html",
    title: "WHEA-Logger 46 메모리 계층 오류 점검",
    eyebrow: "하드웨어 오류",
    interpretation: "46은 메모리 계층을 포함한 치명적 하드웨어 오류로 나타날 수 있는 기록입니다. RAM 자체뿐 아니라 메모리 컨트롤러나 XMP·EXPO 설정, 보드 접촉 문제도 원인이 될 수 있습니다.",
    additional: "메모리 모듈을 한 개씩 장착해 슬롯을 바꿔가며 테스트하면, 모듈 불량인지 특정 슬롯의 접촉 문제인지를 비교적 빠르게 구분할 수 있습니다.",
    faqs: [
      { q: "46은 메모리만 관련된 오류인가요?", a: "메모리 계층(Cache Hierarchy)을 포함할 수 있지만 CPU 캐시 문제로도 나타날 수 있어 메모리 전용 문제로 단정할 수 없습니다." },
      { q: "XMP를 껐는데도 발생하면 어떻게 해야 하나요?", a: "기본 속도에서도 반복된다면 모듈이나 슬롯 자체, 혹은 CPU의 메모리 컨트롤러 문제일 가능성을 열어두고 부품을 교차 테스트하세요." }
    ]
  },
  "162": {
    file: "event-volmgr-162.html",
    title: "Volmgr 162 랜덤 종료·재부팅 점검",
    eyebrow: "종료·재부팅",
    interpretation: "162는 볼륨 관리자가 크래시 덤프 파일을 만드는 데 실패했다는 기록이지만, 실제로는 예기치 않은 재부팅이나 랜덤한 전원 꺼짐과 함께 나타나는 경우가 많아 종료 원인을 좁히는 단서로 쓰입니다. 이벤트 자체가 원인이 아니라 종료 시점의 부산물인 경우가 대부분입니다.",
    additional: "며칠은 멀쩡하다가 한 번씩 몰아서 재현되는 패턴이라면, 덤프 생성 실패보다 전원 공급 자체의 간헐적 불안정을 먼저 의심하는 것이 낫습니다. 같은 시각의 Kernel-Power 41, WHEA 이벤트와 함께 놓고 봐야 정확한 원인에 가까워집니다.",
    faqs: [
      { q: "Volmgr 162가 뜨면 저장장치가 고장난 건가요?", a: "저장장치 자체보다는 예기치 않은 종료 시점에 덤프 파일 생성이 실패했다는 기록에 가깝습니다. 저장장치 문제로 단정하기보다 같은 시각의 다른 이벤트(Kernel-Power, WHEA)를 함께 확인하세요." },
      { q: "랜덤하게 며칠 간격으로 재현되는데 이 이벤트와 관련이 있나요?", a: "네, 흔한 조합입니다. PSU나 전원 커넥터처럼 온도·진동에 따라 간헐적으로 나타나는 하드웨어 원인일 때 이 이벤트가 함께 기록되는 경우가 많습니다." }
    ]
  },
  "15": {
    file: "event-tpm-15.html",
    title: "TPM 15 하드웨어 오류 점검",
    eyebrow: "보안·부팅",
    interpretation: "TPM 15는 TPM(보안 칩) 드라이버가 하드웨어에서 복구할 수 없는 오류를 감지했다는 기록으로, BitLocker나 Windows Hello 같은 TPM 기반 기능이 정상 동작하지 않을 수 있습니다. 소프트웨어 설정보다 BIOS 펌웨어나 TPM 모듈 자체의 문제일 가능성이 큽니다.",
    additional: "메인보드에 TPM이 내장되어 있다면(fTPM/PTT) 대개 BIOS 펌웨어 업데이트로 해결되는 경우가 많고, 별도 TPM 모듈을 헤더에 꽂는 방식이라면 접촉 불량부터 확인하는 것이 순서입니다.",
    faqs: [
      { q: "TPM 15가 뜨면 윈도우 11을 못 쓰게 되나요?", a: "당장 부팅이 안 되지는 않지만, BitLocker·Windows Hello처럼 TPM에 의존하는 기능이 제한될 수 있습니다. BIOS 업데이트로 해결되는 경우가 많으니 먼저 시도해보세요." },
      { q: "TPM을 초기화하면 데이터가 사라지나요?", a: "TPM 지우기(초기화) 자체가 드라이브 데이터를 지우지는 않지만, BitLocker로 암호화되어 있다면 복구 키가 없을 경우 접근이 막힐 수 있으니 반드시 복구 키를 먼저 백업하세요." }
    ]
  },
  "4266": {
    file: "event-tcpip-4266.html",
    title: "Tcpip 4266 네트워크 스택 오류 점검",
    eyebrow: "네트워크",
    interpretation: "Tcpip 4266은 TCP/IP 네트워크 스택이 연결이나 소켓을 처리하는 과정에서 오류를 기록한 이벤트입니다. 이벤트 ID만으로 랜카드 고장을 확정할 수 없으므로, 일반 탭의 오류 문장과 XML의 인터페이스·주소·오류 코드를 함께 확인해야 합니다.",
    additional: "VPN이나 가상 어댑터를 연결한 뒤에만 나타나는지, 게임·대용량 전송·원격 접속처럼 연결 수가 늘어나는 상황에서 반복되는지를 구분하면 드라이버 문제와 네트워크 경로 문제를 나누는 데 도움이 됩니다.",
    faqs: [
      { q: "4266이 뜨면 랜카드를 교체해야 하나요?", a: "아닙니다. 네트워크 드라이버, VPN·보안 필터, 공유기, 케이블 등도 같은 기록을 만들 수 있습니다. 실제 연결 끊김과 이벤트 시각이 일치하는지부터 확인하세요." },
      { q: "4266과 4199는 같은 오류인가요?", a: "같은 Tcpip 원본이지만 의미는 다를 수 있습니다. 4199는 IP 주소 충돌이 핵심이고, 4266은 세부 오류 문장과 XML을 확인해야 처리 과정의 문제를 구분할 수 있습니다." }
    ]
  },
  "30": {
    file: "event-tpm-30.html",
    title: "TPM 30 보안 칩 상태 기록 점검",
    eyebrow: "보안·부팅",
    interpretation: "TPM 30은 TPM 공급자 또는 관리 구성 요소가 보안 칩의 상태·키·기능을 처리하는 과정에서 남기는 기록입니다. Windows Hello나 BitLocker에 실제 문제가 있는지, 아니면 단발성 상태 기록인지 먼저 나눠야 합니다.",
    additional: "메인보드 교체나 BIOS 업데이트 뒤 시작됐다면 Intel PTT·AMD fTPM을 포함한 펌웨어 설정을 확인하세요. TPM을 초기화하는 조치는 복구 키를 확보한 뒤 마지막 단계로 남겨두는 편이 안전합니다.",
    faqs: [
      { q: "TPM 30이 있으면 TPM 고장인가요?", a: "그렇지 않습니다. 이벤트의 세부 오류 상태와 Windows Hello·BitLocker 기능 장애가 함께 있는지 확인해야 합니다. 단발성 기록만으로 칩 고장을 판단하지 마세요." },
      { q: "TPM을 바로 초기화해도 되나요?", a: "BitLocker 복구 키와 다른 로그인 방법을 먼저 확보해야 합니다. 키를 확인하지 않은 상태에서 TPM을 지우면 암호화된 드라이브나 PIN 로그인에 문제가 생길 수 있습니다." }
    ]
  },
  "154": {
    file: "event-disk-154.html",
    title: "Disk 154 저장장치 하드웨어 I/O 오류 점검",
    eyebrow: "저장장치",
    interpretation: "Disk 154는 디스크 입출력 작업이 하드웨어 오류로 실패했다는 기록입니다. 서버·FC 저장장치에서는 어댑터와 스토리지 배열 사이의 통신 문제로도 발생하며, 일반 PC에서는 디스크·컨트롤러·케이블·슬롯을 하나의 경로로 보고 확인해야 합니다.",
    additional: "파일이 열리고 PC가 다시 정상처럼 보여도 반복되는 I/O 오류는 데이터 손실로 이어질 수 있습니다. 복구 명령보다 중요한 파일을 다른 저장장치에 먼저 복사하고, 이벤트의 디스크 번호·LBA·포트 정보를 보존하세요.",
    faqs: [
      { q: "154가 한 번만 발생해도 디스크를 교체해야 하나요?", a: "한 번의 기록만으로 교체를 확정하지는 않습니다. SMART·제조사 진단 결과와 7·11·129·153·Ntfs 이벤트의 반복 여부를 함께 확인하세요. 다만 백업은 바로 해두는 것이 안전합니다." },
      { q: "레지스트리에서 디스크 시간 제한을 늘리면 해결되나요?", a: "시간 제한을 늘리는 것은 원인인 연결·컨트롤러·장치 오류를 해결하지 못할 수 있습니다. 백업과 저장 경로 점검을 먼저 진행하고, 서버 환경이면 저장장치 제조사 지침을 따르세요." }
    ]
  },
  "4199": {
    file: "event-tcpip-4199.html",
    title: "Tcpip 4199 IP 주소 충돌 점검",
    eyebrow: "네트워크",
    interpretation: "Tcpip 4199는 Windows가 네트워크에서 같은 IP 주소가 중복 사용되고 있음을 감지했다는 기록입니다. Microsoft 설명처럼 DHCP 주소를 받는 과정의 중복 감지로도 나타날 수 있으므로, 일반 탭에 표시된 충돌 주소와 상대 하드웨어 주소를 먼저 기록하세요.",
    additional: "한 번 발생했지만 인터넷과 로컬 네트워크가 정상이라면 일시적인 DHCP·절전 복귀 상황일 수 있습니다. 반복적인 끊김이나 IP 충돌 알림이 있을 때만 공유기 임대 목록과 고정 IP 구성을 함께 점검하세요.",
    faqs: [
      { q: "4199는 해킹이나 악성코드 증거인가요?", a: "아닙니다. IP 주소 중복 감지를 기록하는 네트워크 이벤트입니다. 공유기 DHCP, 고정 IP, VPN·가상 어댑터 구성에서도 발생할 수 있으므로 보안 문제로 단정하지 마세요." },
      { q: "4199가 반복되면 무엇부터 확인하나요?", a: "이벤트의 충돌 IP를 기록한 뒤 ipconfig /all에서 DHCP·고정 IP 여부를 확인하고, 공유기 DHCP 임대 목록과 비교하세요. VPN을 끈 상태나 다른 공유기에서 재현되는지도 확인하면 범위를 줄일 수 있습니다." }
    ]
  },
  "36": {
    file: "event-volsnap-36.html",
    title: "volsnap 36 섀도 복사본 저장 공간 한도 점검",
    eyebrow: "백업·복원",
    interpretation: "volsnap 36은 볼륨 섀도 복사본이 지정된 저장 영역 한도 때문에 중단됐다는 기록입니다. 일반 디스크 여유 공간이 많아도 복원 지점과 백업이 사용하는 전용 한도가 부족할 수 있어 두 값을 분리해 확인해야 합니다.",
    additional: "시스템 복원 지점이나 백업이 꼭 필요한 PC라면 기존 복사본을 지우기 전에 대체 백업이 정상인지 확인하세요. 저장장치 오류가 같은 시각에 있으면 공간만 늘리기보다 디스크 경로와 VSS 상태를 함께 점검해야 합니다.",
    faqs: [
      { q: "C 드라이브 여유 공간이 많은데 왜 36이 발생하나요?", a: "섀도 복사본은 일반 여유 공간과 별도로 최대 사용량이 설정될 수 있습니다. vssadmin list shadowstorage로 원본 볼륨의 할당 한도와 사용량을 확인하세요." },
      { q: "vssadmin delete shadows /all을 실행해도 되나요?", a: "기존 시스템 복원 지점과 백업 복사본을 모두 지울 수 있으므로 무심코 실행하면 안 됩니다. 복구 계획과 대체 백업을 확인한 뒤 필요한 대상만 처리하세요." }
    ]
  },
  "100": {
    file: "event-winsrvext-100.html",
    title: "winsrvext 100 세션·서버 구성 요소 기록 확인",
    eyebrow: "세션·서버 구성",
    interpretation: "winsrvext 100은 Windows 서버·세션 관련 확장 구성 요소가 작업 중 남기는 기록입니다. 이 원본은 Windows 버전과 서버 역할에 따라 세부 메시지가 달라질 수 있어, 이벤트 ID만 보지 말고 일반 탭과 XML의 Message·Task·세션 정보를 함께 봐야 합니다.",
    additional: "원격 데스크톱 연결 끊김이나 로그인 지연이 없다면 단발성 정보성 기록일 가능성도 있습니다. 실제 기능 장애가 있을 때만 TerminalServices·서비스 이벤트와 같은 시각을 비교해 원인을 좁히세요.",
    faqs: [
      { q: "winsrvext 100이 있으면 서버나 하드웨어가 고장난 건가요?", a: "아닙니다. 서버·원격 세션 구성 요소의 상태 기록일 수 있습니다. 실제 원격 접속·로그온·세션 장애와 반복 시각이 일치하는지 확인해야 합니다." },
      { q: "일반 탭에서 특별한 설명이 보이지 않으면 어떻게 하나요?", a: "자세히 탭의 XML 보기에서 Provider, Task, Message, 세션·컴퓨터 역할 관련 필드를 복사해 함께 분석하세요. 이 이벤트는 ID만으로 의미를 확정하기 어렵습니다." }
    ]
  },
  "10110": {
    file: "event-driverframeworks-10110.html",
    title: "DriverFrameworks-UserMode 10110 사용자 모드 드라이버 장애 점검",
    eyebrow: "장치 드라이버",
    interpretation: "10110은 사용자 모드 드라이버를 호스팅하던 프로세스에 문제가 생겨 하나 이상의 장치가 잠시 중단될 수 있음을 기록합니다. USB·오디오·HID·블루투스 장치가 실제로 끊겼는지와 XML의 UMDF 오류 정보를 함께 확인해야 합니다.",
    additional: "10110만으로 메인보드나 장치 자체 고장을 확정하기는 어렵습니다. 같은 시각의 10111에서 장치 이름과 InstanceId를 찾으면 점검 대상을 장치 하나로 좁힐 수 있습니다.",
    faqs: [
      { q: "10110이 있으면 USB 장치가 고장난 건가요?", a: "아닙니다. 드라이버·제조사 유틸리티·USB 허브·절전 설정도 원인이 될 수 있습니다. 실제 끊김이 있는지와 10111의 장치 정보를 함께 확인하세요." },
      { q: "XML에서 무엇을 봐야 하나요?", a: "LifetimeId, Problem, ExitCode와 같은 UMDF 호스트 정보를 기록하고, 같은 시각 10111의 FriendlyName·InstanceId·RestartCount와 연결해 해석하세요." }
    ]
  },
  "10111": {
    file: "event-driverframeworks-10111.html",
    title: "DriverFrameworks-UserMode 10111 장치 오프라인 점검",
    eyebrow: "장치 드라이버",
    interpretation: "10111은 사용자 모드 드라이버 충돌로 특정 장치가 오프라인이 되었고 Windows가 장치를 다시 시작하려 했다는 기록입니다. 일반 탭의 장치 이름과 XML의 InstanceId·RestartCount가 가장 중요한 단서입니다.",
    additional: "헤드셋·웹캠·키보드·마우스처럼 HID나 오디오 장치에서 자주 체감되지만, 장치 종류에 따라 원인이 달라집니다. 장치와 포트·케이블·드라이버를 차례로 분리해 확인하세요.",
    faqs: [
      { q: "10111과 10110은 어떻게 다른가요?", a: "10110은 UMDF 호스트 프로세스 문제를, 10111은 그 결과 오프라인이 된 장치와 재시작 시도를 보여줍니다. 두 이벤트를 한 쌍으로 보면 장치를 찾기 쉽습니다." },
      { q: "재부팅 후 장치가 다시 작동하면 무시해도 되나요?", a: "단발성이라면 관찰할 수 있지만, RestartCount가 늘거나 같은 장치가 반복해서 끊기면 드라이버·펌웨어·전원 관리를 점검하세요." }
    ]
  },
  "2004": {
    file: "event-resource-exhaustion-2004.html",
    title: "Resource-Exhaustion-Detector 2004 가상 메모리 부족 점검",
    eyebrow: "메모리·성능",
    interpretation: "2004는 Windows가 시스템의 가상 메모리·커밋 한도가 부족한 상태를 진단했다는 경고입니다. 이벤트 설명에 당시 상위 커밋 사용 프로세스가 표시될 수 있으므로, RAM 사용률만 보지 말고 커밋 크기와 페이지 파일을 함께 확인해야 합니다.",
    additional: "특정 프로그램을 오래 실행할수록 커밋 사용량이 계속 증가한다면 앱이나 플러그인의 누수를 의심할 수 있습니다. 여러 프로그램에서 동시에 발생하면 페이지 파일과 시스템 여유 공간부터 확인하세요.",
    faqs: [
      { q: "2004가 뜨면 RAM을 추가해야 하나요?", a: "반드시 그렇지는 않습니다. 특정 프로그램의 가상 메모리 누수나 페이지 파일 제한이 원인일 수 있습니다. 이벤트가 지목한 프로세스의 커밋 사용량을 먼저 확인하세요." },
      { q: "작업 관리자에서 어떤 값을 봐야 하나요?", a: "성능 탭의 메모리 항목에서 커밋 사용량과 커밋 한도를 확인하세요. 프로세스 탭의 메모리 열만으로는 가상 메모리 고갈 원인을 놓칠 수 있습니다." }
    ]
  },
  "6005": {
    file: "event-eventlog-6005.html",
    title: "EventLog 6005 Windows 시작 시각 확인",
    eyebrow: "시작·종료 기록",
    interpretation: "6005는 Windows 이벤트 로그 서비스가 시작되었음을 기록하는 정보성 이벤트입니다. 보통 부팅 시각을 확인하는 기준점으로 사용하며, 오류나 비정상 종료를 의미하지 않습니다.",
    additional: "재부팅 원인을 찾을 때는 6005 하나보다 6008·Kernel-Power 41·User32 1074를 함께 시간순으로 배열하는 것이 효과적입니다.",
    faqs: [
      { q: "6005가 매번 기록되는 것이 정상인가요?", a: "네. Windows가 부팅하거나 이벤트 로그 서비스를 시작할 때 기록될 수 있습니다. 기능 장애 없이 정상 부팅할 때마다 보인다면 일반적인 정보성 기록입니다." },
      { q: "6005로 부팅 시간을 알 수 있나요?", a: "대략적인 이벤트 로그 서비스 시작 시각을 확인할 수 있습니다. 정확한 전원 인가 시각과는 차이가 있을 수 있으므로 다른 시작 이벤트와 함께 비교하세요." }
    ]
  },
  "6006": {
    file: "event-eventlog-6006.html",
    title: "EventLog 6006 정상 종료 여부 확인",
    eyebrow: "시작·종료 기록",
    interpretation: "6006은 Windows 이벤트 로그 서비스가 종료 절차에서 중지되었음을 기록하는 정보성 이벤트입니다. 6006이 있고 6008이 없다면 정상 종료에 가까운 패턴으로 볼 수 있지만, 이벤트 하나만으로 전원 상태를 확정하지는 않습니다.",
    additional: "갑작스러운 전원 차단이나 강제 종료가 있었다면 6006 없이 6008·Kernel-Power 41이 남을 수 있습니다. 종료 요청 주체는 User32 1074에서 함께 확인하세요.",
    faqs: [
      { q: "6006은 오류 이벤트인가요?", a: "아닙니다. 정상 종료 또는 이벤트 로그 서비스 중지 과정에서 남는 정보성 기록입니다. 실제 문제는 6006이 없는 비정상 종료와 주변 이벤트에서 찾아야 합니다." },
      { q: "6006과 6008을 함께 보면 무엇을 알 수 있나요?", a: "6006은 정상 종료 과정의 기록이고 6008은 이전 종료가 정상적이지 않았다는 사후 기록입니다. 두 이벤트의 존재 여부와 시각을 비교하면 종료 패턴을 구분하는 데 도움이 됩니다." }
    ]
  },
  "7000": {
    file: "event-service-7000.html",
    title: "Service Control Manager 7000 서비스 시작 실패 점검",
    eyebrow: "서비스",
    interpretation: "7000은 Windows 서비스가 시작되지 못했다는 기록입니다. 서비스 이름을 먼저 확인해 어떤 프로그램에 속하는지 파악하는 것이 무작정 삭제하는 것보다 안전합니다.",
    additional: "여러 서비스가 동시에 실패한다면 특정 프로그램 하나의 문제가 아니라 최근 업데이트나 보안 프로그램의 차단 때문일 수 있으니 함께 확인하세요.",
    faqs: [
      { q: "이 서비스가 뭔지 모르는데 삭제해도 되나요?", a: "삭제보다 먼저 서비스 이름으로 검색해 어떤 프로그램에 속하는지 확인하세요. 알 수 없는 서비스를 임의로 삭제하면 다른 기능이 함께 멈출 수 있습니다." },
      { q: "매번 부팅할 때마다 뜨는데 성능에 영향이 있나요?", a: "실제 기능 장애가 없다면 즉시 영향은 적지만, 반복 기록이 계속 쌓인다면 관련 프로그램을 재설치해 정리하는 것을 권장합니다." }
    ]
  },
  "7001": {
    file: "event-service-7001.html",
    title: "Service Control Manager 7001 의존 서비스 실패 점검",
    eyebrow: "서비스",
    interpretation: "7001은 의존하는 다른 서비스가 시작되지 않아 현재 서비스도 함께 시작하지 못했다는 기록입니다. 이벤트 설명에 표시된 의존 서비스 이름을 먼저 확인해야 합니다.",
    additional: "실패한 의존 서비스를 서비스 관리자에서 수동으로 먼저 시작해보면, 그 서비스만의 문제인지 연쇄적인 문제인지 확인할 수 있습니다.",
    faqs: [
      { q: "의존 서비스가 무엇인지 어떻게 확인하나요?", a: "이벤트 설명에 실패한 의존 서비스 이름이 함께 표시됩니다. 서비스 관리자(services.msc)에서 해당 서비스의 상태와 시작 유형을 확인하세요." },
      { q: "7000과 7001이 같이 뜨면 어느 것이 원인인가요?", a: "먼저 발생한 7000의 서비스가 실패의 시작점일 가능성이 큽니다. 두 이벤트의 시각과 서비스 이름을 비교해 순서를 확인하세요." }
    ]
  },
  "7009": {
    file: "event-service-7009.html",
    title: "Service Control Manager 7009 서비스 응답 시간 초과 점검",
    eyebrow: "서비스",
    interpretation: "7009는 서비스가 제한 시간 안에 연결되지 못했다는 기록입니다. 서비스 자체보다 디스크·네트워크 병목처럼 지연을 유발하는 원인을 먼저 찾는 것이 중요합니다.",
    additional: "네트워크 드라이브나 원격 저장소에 의존하는 서비스라면, 연결 상태부터 확인하는 것이 응답 지연 문제를 더 빠르게 좁히는 방법입니다.",
    faqs: [
      { q: "제한 시간을 늘리면 해결되나요?", a: "레지스트리로 제한 시간을 늘리는 방법이 알려져 있지만, 이는 증상을 늦출 뿐 지연의 근본 원인(디스크·네트워크 병목)을 해결하지는 못합니다." },
      { q: "부팅이 느린 것과 관련이 있나요?", a: "네, 부팅 지연의 흔한 동반 기록입니다. 같은 시간대의 디스크·네트워크 이벤트를 함께 확인하세요." }
    ]
  },
  "7011": {
    file: "event-service-7011.html",
    title: "Service Control Manager 7011 서비스 제어 요청 시간 초과 점검",
    eyebrow: "서비스",
    interpretation: "7011은 서비스 제어 요청이 시간 안에 응답하지 않았다는 기록으로, 종료나 재부팅이 지연되는 증상과 함께 나타나는 경우가 많습니다.",
    additional: "매번 종료할 때마다 반복된다면, 최근 설치한 프로그램의 백그라운드 서비스를 하나씩 비활성화하며 원인을 좁혀보세요.",
    faqs: [
      { q: "종료가 오래 걸리는 것도 이 이벤트 때문인가요?", a: "네, 서비스가 응답 없이 종료 절차를 막고 있으면 시스템 종료·재부팅이 지연되고 이 이벤트가 함께 기록될 수 있습니다." },
      { q: "서비스를 강제로 삭제해도 되나요?", a: "마지막 수단으로 남겨두세요. 먼저 클린 부팅에서 재현되는지 확인하고, 관련 프로그램을 업데이트하거나 재설치하는 방법을 우선 시도하세요." }
    ]
  },
  "7023": {
    file: "event-service-7023.html",
    title: "Service Control Manager 7023 서비스 오류 종료 점검",
    eyebrow: "서비스",
    interpretation: "7023은 서비스가 자체 오류 코드를 반환하며 종료됐다는 기록입니다. 이벤트 설명 끝에 표시되는 오류 코드를 서비스 이름과 함께 확인하면 원인을 좁힐 수 있습니다.",
    additional: "동일한 오류 코드가 반복된다면 해당 코드를 서비스 이름과 함께 검색해 알려진 해결책이 있는지 먼저 확인하는 것이 효율적입니다.",
    faqs: [
      { q: "오류 코드는 어디서 확인하나요?", a: "이벤트 설명 마지막 부분에 서비스가 반환한 오류 코드가 표시됩니다. 이 코드를 서비스 이름과 함께 검색하면 원인을 좁힐 수 있습니다." },
      { q: "오류 코드 없이 서비스만 재시작해도 되나요?", a: "임시로 동작할 수는 있지만 재발 원인을 놓칠 수 있습니다. 오류 코드를 먼저 기록한 뒤 재시작하세요." }
    ]
  },
  "7031": {
    file: "event-service-7031.html",
    title: "Service Control Manager 7031 서비스 비정상 종료 점검",
    eyebrow: "서비스",
    interpretation: "7031은 서비스가 예기치 않게 종료됐고 Windows가 재시작 같은 복구 작업을 예약했다는 기록입니다. 반복 횟수가 늘어나는지가 조치 필요 여부를 가르는 기준입니다.",
    additional: "복구 동작이 예약됐다는 것은 Windows가 문제를 인지하고 있다는 뜻이므로, 반복 여부를 지켜보되 급하게 시스템 파일을 손대지 마세요.",
    faqs: [
      { q: "Windows가 자동으로 재시작한다는데 기다리면 되나요?", a: "예약된 복구 작업이 있다면 잠시 기다려볼 수 있습니다. 다만 반복 횟수가 계속 늘어난다면 관련 프로그램을 재설치하는 것이 안전합니다." },
      { q: "Application Error 1000과 함께 뜨면 어떤 관계인가요?", a: "같은 프로그램의 충돌을 서비스 관점과 응용 프로그램 관점에서 각각 기록한 것일 수 있습니다. 두 기록의 시각과 대상 프로그램을 비교하세요." }
    ]
  },
  "7034": {
    file: "event-service-7034.html",
    title: "Service Control Manager 7034 서비스 예기치 않은 종료 점검",
    eyebrow: "서비스",
    interpretation: "7034는 서비스가 예기치 않게 종료됐지만 자동 복구 동작 정보 없이 기록된 경우입니다. 사용하지 않는 서비스인지 먼저 확인한 뒤 관련 여부를 판단하는 것이 좋습니다.",
    additional: "특정 시점(업데이트 직후 등)부터 이 기록이 시작됐다면, 그 변경 사항을 되돌려보는 것이 가장 빠른 확인 방법입니다.",
    faqs: [
      { q: "7031과 7034의 차이는 무엇인가요?", a: "7031은 Windows가 복구 동작(재시작 등)을 예약했다는 정보가 함께 기록되고, 7034는 그런 복구 정보 없이 단순 종료만 기록된 경우입니다." },
      { q: "이 서비스를 사용하지 않는다면 무시해도 되나요?", a: "실제로 사용하지 않는 기능의 서비스라면 큰 영향은 없습니다. 다만 최근 설치한 프로그램과 관련이 있다면 업데이트나 재설치를 고려하세요." }
    ]
  },
  "10016": {
    file: "event-distributedcom-10016.html",
    title: "DistributedCOM 10016 권한 경고 확인",
    eyebrow: "COM 구성 요소",
    interpretation: "10016은 특정 COM 구성 요소가 요청한 로컬 실행·활성화 권한을 받지 못했다는 경고입니다. 정상적으로 동작하는 PC에서도 매우 흔하게 쌓이는 기록으로, 대개 긴급하지 않습니다.",
    additional: "이 경고만으로 성능 저하나 오작동이 실제로 있는지 판단할 수는 없으므로, 체감 증상이 없다면 굳이 원인을 찾아 없앨 필요는 없습니다.",
    faqs: [
      { q: "이 오류를 그냥 무시해도 되나요?", a: "대부분의 경우 그렇습니다. 이벤트 뷰어에 자주 쌓이는 경고이지만 실제 프로그램 동작에 문제가 없다면 별도 조치가 필요하지 않습니다." },
      { q: "인터넷에 있는 DCOM 권한 수정 방법을 따라 해도 되나요?", a: "실제 기능 장애가 없다면 권장하지 않습니다. 컴포넌트 서비스의 권한 값을 잘못 변경하면 다른 프로그램의 정상 동작에 영향을 줄 수 있습니다." },
      { q: "왜 이렇게 자주 기록되나요?", a: "Windows의 기본 권한 설계상 일부 앱 구성 요소가 로컬 실행 권한을 요청했다가 거부되는 경우가 흔해서, 정상적으로 동작하는 PC에서도 자주 쌓이는 경향이 있습니다." }
    ]
  },
  "1014": {
    file: "event-dns-1014.html",
    title: "DNS Client Events 1014 이름 확인 지연 점검",
    eyebrow: "네트워크",
    interpretation: "1014는 DNS 이름 확인 요청이 제한 시간 안에 응답하지 않았다는 기록입니다. 특정 사이트만 느리게 열리는 증상과 함께 나타나는 경우가 많아, 공유기와 DNS 서버 상태를 먼저 비교해야 합니다.",
    additional: "재택근무나 화상회의 중 특정 사이트 접속이 자주 느려진다면, DNS 서버를 공용 DNS(예: 8.8.8.8)로 바꿔 비교해보는 것도 방법입니다.",
    faqs: [
      { q: "특정 사이트만 느리게 열리면 이 이벤트 때문인가요?", a: "DNS 확인 지연은 특정 도메인에만 영향을 줄 수 있습니다. 다른 사이트는 정상인데 한 곳만 느리다면 해당 서버 자체의 문제일 가능성도 있습니다." },
      { q: "공유기를 재시작하면 해결되나요?", a: "일시적인 DNS 캐시·경로 문제라면 공유기 재시작으로 해결되는 경우가 많습니다. 반복된다면 DNS 서버 주소를 변경해 비교해보세요." }
    ]
  },
  "27": {
    file: "event-e2fexpress-27.html",
    title: "e2fexpress 27 유선 네트워크 링크 끊김 점검",
    eyebrow: "네트워크",
    interpretation: "27은 Intel 유선 네트워크 어댑터의 링크가 끊기거나 연결 상태가 바뀌었을 때 드라이버가 남기는 기록입니다. 케이블·포트 접촉과 어댑터 전원 관리 설정을 먼저 확인하세요.",
    additional: "유선 연결인데도 특정 위치에서만 발생한다면 전자기 간섭보다는 케이블 길이나 허브를 경유하는 연결 방식을 먼저 의심해보세요.",
    faqs: [
      { q: "무선 와이파이에서도 이 이벤트가 뜨나요?", a: "이 이벤트는 주로 유선(이더넷) 어댑터 드라이버에서 발생합니다. 무선 어댑터라면 다른 드라이버 원본으로 기록됩니다." },
      { q: "절전 복귀 뒤에만 발생하면 어떻게 확인하나요?", a: "어댑터 전원 관리 설정에서 '전원 절약을 위해 이 장치를 끌 수 있음' 옵션을 해제한 뒤 재현 여부를 비교해보세요." }
    ]
  },
  "32": {
    file: "event-e2fexpress-32.html",
    title: "e2fexpress 32 유선 네트워크 상태 오류 점검",
    eyebrow: "네트워크",
    interpretation: "32는 유선 네트워크 드라이버가 링크나 장치 상태 문제를 보고한 기록입니다. 케이블·포트뿐 아니라 드라이버 버전과 공유기와의 속도 협상 문제도 함께 확인해야 합니다.",
    additional: "협상된 링크 속도가 예상보다 낮게 고정된다면 케이블 규격(Cat5e/Cat6)이나 포트 자체의 노후화도 원인이 될 수 있습니다.",
    faqs: [
      { q: "케이블을 바꿨는데도 계속되면 무엇을 확인해야 하나요?", a: "케이블 외에 공유기 포트, 어댑터 드라이버 버전, 절전 설정도 함께 확인해야 합니다. 다른 포트나 다른 케이블로 완전히 교차해보세요." },
      { q: "이벤트 27과 32는 같은 문제인가요?", a: "같은 어댑터 드라이버(e2fexpress)가 남기는 기록이지만 세부 상태는 다를 수 있습니다. 이벤트 원문의 구체적인 상태 설명을 함께 확인하세요." }
    ]
  },
  "219": {
    file: "event-kernel-pnp-219.html",
    title: "Kernel-PnP 219 드라이버 로드 지연 점검",
    eyebrow: "장치 드라이버",
    interpretation: "219는 장치 드라이버가 시작 과정에서 로드되지 않았거나 지연됐다는 기록입니다. 장치 관리자에서 해당 장치가 정상으로 표시된다면 실제 기능 문제가 없는 경우가 많습니다.",
    additional: "재부팅 한 번으로 사라지고 이후 재현되지 않는다면 크게 걱정할 필요는 없습니다. 같은 장치에서 반복된다면 드라이버를 제조사 최신 버전으로 교체해보세요.",
    faqs: [
      { q: "이 이벤트가 뜨면 장치가 고장난 건가요?", a: "아닙니다. 드라이버 로드가 지연되거나 일시적으로 실패한 기록일 뿐, 장치 관리자에서 해당 장치가 정상으로 표시된다면 기능상 문제는 없는 경우가 많습니다." },
      { q: "빠른 시작을 끄면 도움이 되나요?", a: "일부 USB·블루투스 장치는 빠른 시작(Fast Startup) 때문에 드라이버 초기화가 꼬이는 경우가 있어, 끄고 재현 여부를 비교해볼 수 있습니다." }
    ]
  }
};

const buildFaqSchema = (faqs) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a }
  }))
});

let generated = 0;
const refreshDetailPages = new Set(["1074", "1002", "1026", "4266", "30", "154", "4199", "36", "100", "10110", "10111", "2004", "6005", "6006"]);
for (const evt of data.eventViewerCodes) {
  if (evt.detailPage && !refreshDetailPages.has(evt.id)) continue;
  const copy = eventCopy[evt.id];
  if (!copy) throw new Error(`이벤트 ${evt.id}에 대한 콘텐츠가 정의되지 않았습니다.`);

  const url = `https://itsvc.co.kr/${copy.file}`;
  const description = evt.summary;

  const techArticleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: copy.title,
    description,
    url,
    mainEntityOfPage: url,
    inLanguage: "ko-KR",
    dateModified: today,
    author: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: "https://itsvc.co.kr/about.html" },
    publisher: { "@type": "Organization", name: "PC 윈도우 진단 센터", url: "https://itsvc.co.kr/" }
  };
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: "https://itsvc.co.kr/" },
      { "@type": "ListItem", position: 2, name: "가이드", item: "https://itsvc.co.kr/guides.html" },
      { "@type": "ListItem", position: 3, name: copy.title, item: url }
    ]
  };
  const faqSchema = buildFaqSchema(copy.faqs);

  const conditions = (evt.conditions || []).map((c) => `          <li>${escapeHtml(c)}</li>`).join("\n");
  const causes = (evt.causes || []).map((c) => `          <li>${escapeHtml(c)}</li>`).join("\n");
  const checkSuffixes = [
    "되돌리기 쉬운 항목부터 확인해 위험 없이 범위를 줄입니다.",
    "첫 확인 결과와 비교해 원인 후보를 좁힙니다.",
    "앞 단계에서 해결되지 않을 때 다음 원인을 검증합니다."
  ];
  const checks = (evt.checks || []).map((c, i) =>
    `          <li><strong>${escapeHtml(c)}</strong> — ${checkSuffixes[Math.min(i, checkSuffixes.length - 1)]}</li>`
  ).join("\n");
  const warnings = (evt.warnings || []).map((w) => `<p>${escapeHtml(w)}</p>`).join("\n");

  const relatedCodeLinks = (evt.relatedCodes || [])
    .map((code) => {
      const file = codeToFile[code.toUpperCase()];
      if (!file) return null;
      return `<a href="${escapeHtml(file)}">${escapeHtml(code)} 오류 코드 확인하기</a>`;
    })
    .filter(Boolean);
  const relatedGuideLinks = (evt.relatedGuides || [])
    .map((g) => `<a href="${escapeHtml(g)}">${escapeHtml(guideTitles[g] || "관련 가이드 보기")}</a>`);
  const refs = [...relatedCodeLinks, ...relatedGuideLinks];

  const faqList = copy.faqs.map((f) => `          <li><strong>${escapeHtml(f.q)}</strong> ${escapeHtml(f.a)}</li>`).join("\n");

  const html = `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(copy.title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="author" content="itcode21-alt">
  <link rel="canonical" href="${url}">
  <script type="application/ld+json">${JSON.stringify(techArticleSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>
  <script type="application/ld+json">${JSON.stringify(faqSchema)}</script>
  <meta property="og:title" content="${escapeHtml(copy.title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary_large_image">
  <meta property="og:image" content="https://itsvc.co.kr/assets/pc-check-hero.jpg">
  <meta property="og:image:alt" content="PC 상태를 점검하는 진단 화면 일러스트">
  <link rel="stylesheet" href="style.css?v=evtx-ext-label-20260803c">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9907102461716567" crossorigin="anonymous"></script>
</head>
<body>
  <a class="skip-link" href="#content">본문 바로가기</a>
  <header class="site-header compact">
    <div class="brand"><a class="brand-mark" href="index.html" aria-label="홈으로 이동">PC</a><div><p class="eyebrow">${escapeHtml(copy.eyebrow)}</p><h1>${escapeHtml(evt.source)} ${escapeHtml(evt.id)}</h1></div></div>
    <nav class="nav" aria-label="주요 메뉴"><a href="index.html">홈</a><a href="diagnostic.html">진단</a><a href="guides.html" aria-current="page">가이드</a><a href="games-diagnostic.html">게임</a><a href="contact.html">문의</a></nav>
    <div class="site-search" data-site-search>
      <input type="search" class="site-search-input" placeholder="증상, 오류코드, 게임 오류 검색" aria-label="사이트 검색" data-site-search-input autocomplete="off">
      <div class="site-search-results" data-site-search-results hidden></div>
    </div>
  </header>
  <main id="content" class="page article">
    <article class="section">
      <p class="eyebrow">EVENT ID ${escapeHtml(evt.id)}</p>
      <h2>${escapeHtml(copy.title)}</h2>
      <p class="lead">${escapeHtml(evt.summary)}</p>
      <p>${escapeHtml(copy.interpretation)}</p>
      <p>${escapeHtml(copy.additional)}</p>
      <h3>발생 조건</h3>
      <ul class="mini-list">
${conditions}
      </ul>
      <h3>가능성 높은 원인</h3>
      <ul class="mini-list">
${causes}
      </ul>
      <h3>점검 순서</h3>
      <ol class="mini-list">
${checks}
      </ol>
      ${warnings ? `<div class="callout"><strong>주의사항</strong>\n${warnings}</div>` : ""}
      ${refs.length ? `<h3>관련 코드·가이드</h3>\n      <div class="link-list">${refs.join("")}</div>` : ""}
      <h3>자주 묻는 질문</h3>
      <ul class="mini-list">
${faqList}
      </ul>
      <p class="muted">최종 검토일: ${today}</p>
      <p><a href="diagnostic.html#diagnostic-event">이벤트 뷰어 진단 도구에서 확인하기</a></p>
    </article>
  </main>
  <footer class="site-footer">
    <p>© <span data-year></span> PC 윈도우 진단 센터</p>
    <p class="footer-links"><a href="about.html">소개</a> · <a href="editorial-policy.html">작성 기준</a> · <a href="privacy.html">개인정보처리방침</a> · <a href="terms.html">이용약관</a> · <a href="games-diagnostic.html">게임</a> · <a href="contact.html">문의</a></p>
  </footer>
  <script defer src="site.js?v=site-shell-20260730"></script>
  <script defer src="search-index.js"></script>
  <script defer src="search.js"></script>
</body>
</html>
`;

  fs.writeFileSync(path.join(root, copy.file), html);
  generated++;
  console.log(`생성 완료: ${copy.file}`);
}

console.log(`총 ${generated}개 이벤트 페이지 생성 완료.`);
