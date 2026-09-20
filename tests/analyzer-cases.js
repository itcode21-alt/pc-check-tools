// 분석기 자체 점검 케이스. 각 케이스는 fixtures/ 의 샘플 파일을 분석기에 올리고 결과 화면 텍스트를 검사한다.
//   has  : 결과에 이 내용이 있어야 함      not : 결과에 이 내용이 없어야 함      count: 이 내용이 정확히 n번 나와야 함
// 샘플은 모두 합성했거나(hw_*, ms_*, dx_*, cdi_*, ev_*) 실제 로그에서 개인 식별 값을 지워 잘라 낸 것(hw_ko_real_*)이다.
// 새 오류를 고칠 때는 그 오류를 재현하는 샘플과 케이스를 하나 추가해 다시 생기지 않게 한다.
window.ANALYZER_CASES = (() => {
  const cases = [];
  const add = (name, desc, kind, files, expect, format) => cases.push({ name, desc, kind, files: [].concat(files), expect, format });
  const garbled = ["not", /\uFFFD/];

  // ── HWiNFO: 인코딩·날짜 형식 ───────────────────────────────────────────────
  const hwCommon = (extra = []) => [
    ["has", /CPU 온도 최대 84\.0°C · 평균 70\.[78]°C/],
    ["has", /Thermal Throttling \(HTC\) \[Yes\/No\] 10회/],
    ["has", /AMD Ryzen 5 7600X/], ["has", /NVIDIA GeForce RTX 4070/],
    ["has", /최고값 시각[^A-Za-z]{0,20}11:59:48/],
    ["not", /시간 열 확인 불가/], garbled, ...extra,
  ];
  add("hwinfo/en-us-utf8bom", "영문 Windows, M/D/YYYY 날짜, UTF-8 BOM (예전에는 0개 측정값으로 읽힘)", "log", "hw_en_us_utf8bom.csv", hwCommon(), "HWiNFO");
  add("hwinfo/en-uk-ansi", "영국식 DD/MM/YYYY, windows-1252 저장 (°C가 한글로 잘못 해석되던 문제)", "log", "hw_en_uk_ansi.csv", hwCommon(), "HWiNFO");
  add("hwinfo/en-iso", "ISO 날짜", "log", "hw_en_iso_utf8.csv", hwCommon(), "HWiNFO");
  add("hwinfo/en-us-12h", "12시간제(AM/PM) 시간", "log", "hw_en_us12_utf8bom.csv", hwCommon(), "HWiNFO");
  add("hwinfo/ko-cp949", "한글판, D.M.YYYY 날짜, 전체 CP949, 예/아니요 값", "log", "hw_ko_cp949.csv", [
    ["has", /CPU 온도 최대 84\.0°C/], ["has", /열 조절 \(HTC\) \[Yes\/No\] 10회/], ["has", /AMD Ryzen 5 7600X/], ["not", /시간 열 확인 불가/], garbled,
  ], "HWiNFO");
  add("hwinfo/ko-mixed-utf8-cp949", "한글판 실제 형식: 머리글은 UTF-8, 값은 CP949가 섞임", "log", "hw_ko_mixed.csv", [
    ["has", /CPU 온도 최대 84\.0°C/], ["has", /열 조절 \(HTC\) \[Yes\/No\] 10회/], ["not", /시간 열 확인 불가/], garbled,
  ], "HWiNFO");

  // ── HWiNFO: 판단 정확도 ────────────────────────────────────────────────────
  add("hwinfo/clean-stop-not-power-cut", "꼬리 행이 있는 로그는 '갑자기 끊겼다'고 해석하면 안 됨", "log", "hw_en_iso_utf8.csv", [
    ["has", /로그가 정상적으로 종료 저장되었습니다/], ["not", /순간 전원 차단/], ["not", /정상 범위인 채로 로그가 끊겼습니다/],
  ], "HWiNFO");
  add("hwinfo/abrupt-end", "꼬리 행 없이 정상 온도에서 끊긴 로그는 전원 차단 가능성을 알림", "log", "hw_abrupt_en.csv", [
    ["has", /온도·전력이 정상 범위인 채로 로그가 끊겼습니다/], ["not", /정상적으로 종료 저장/],
  ], "HWiNFO");
  add("hwinfo/heat-per-device", "CPU·GPU·VRM·칩셋이 뜨거우면 부품별로 진단과 조치가 갈림", "log", "hw_hot.csv", [
    ["has", /CPU 발열이 기준을 넘었습니다/], ["has", /그래픽카드 발열이 기준을 넘었습니다/], ["has", /메인보드 전원부\(VRM\) 발열이 기준을 넘었습니다/], ["has", /칩셋\/메인보드 발열이 기준을 넘었습니다/],
    ["has", /공기 방향도 확인하세요/], ["has", /카드 팬 앞을 케이블 뭉치/], ["has", /핫스팟이 코어보다 19°C 높아/], ["not", /SSD 온도가 높게 기록되었습니다/], ["not", /HDD 온도가 높게 기록되었습니다/],
    ["not", /발열이 1순위 원인 후보입니다/],
  ], "HWiNFO");

  // ── HWiNFO: 실제 로그에서 잘라 낸 샘플(한글판, CPU + NVMe SSD + HDD, 꼬리 행 있음) ─────────
  add("hwinfo/real-device-names", "CPU 이름을 무선랜 이름으로 읽던 문제, 장치 이름은 꼬리 출처 행에서", "log", "hw_ko_real_footer.csv", [
    ["has", /CPU\s*AMD Ryzen 9 5900X/], ["has", /NVIDIA GeForce GTX 1050 Ti/], ["has", /GIGABYTE X470 AORUS GAMING 7 WIFI/], ["not", /Intel Wireless-AC/],
  ], "HWiNFO");
  add("hwinfo/real-ssd-not-cpu", "디스크 온도 3은 CPU가 아니라 SSD 센서임을 밝히고 SSD 조치를 안내", "log", "hw_ko_real_footer.csv", [
    ["has", /SSD 온도가 높게 기록되었습니다/], ["has", /SAMSUNG MZVLB512HBJQ-00A00 \[C:\]의 "디스크 온도 3" 최대 84\.0°C·평균 83\.0°C/],
    ["has", /CPU 온도가 아니라 저장장치 자체 센서/], ["has", /그래픽카드 아래 슬롯/], ["has", /CPU와 그래픽카드 사이/],
    ["not", /발열이 1순위 원인 후보입니다/], ["not", /CPU 쿨러 밀착 상태와 써멀구리스/],
  ], "HWiNFO");
  add("hwinfo/real-no-keyword-false-positive", "센서 이름의 WHEA·Error 문구로 경고하지 않음", "log", "hw_ko_real_footer.csv", [
    ["not", /WHEA 관련 문구/], ["not", /메모리\/시스템 안정성 점검/], ["not", /드라이버 반응 확인/], ["not", /온도 또는 냉각 점검/],
  ], "HWiNFO");
  add("hwinfo/real-gpu-single-card", "GPU 온도 열이 하나뿐이면 코어/핫스팟 카드를 두 번 만들지 않음", "log", "hw_ko_real_footer.csv", [
    ["has", /GPU 코어 온도\s*최대/], ["not", /GPU 핫스팟\s+최대/],
  ], "HWiNFO");
  add("hwinfo/real-hdd-hidden-behind-ssd", "SSD가 더 뜨거워도 뜨거운 HDD를 따로 잡아 HDD 조치 안내", "log", "hw_ko_real_hdd_hot.csv", [
    ["has", /SSD 온도가 높게 기록되었습니다/], ["has", /HDD 온도가 높게 기록되었습니다/], ["has", /ST2000VN004-2E4164 \[D:\]/], ["has", /앞쪽 드라이브 베이/],
  ], "HWiNFO");

  // ── dxdiag ────────────────────────────────────────────────────────────────
  add("dxdiag/en-utf16", "영문 dxdiag: 그래픽 항목이 컴퓨터 이름이 아님, 메모리·서명 문제 인식, 컴퓨터 이름 마스킹", "log", "dx_en_utf16.txt", [
    ["has", /NVIDIA GeForce RTX 4070/], ["has", /32768MB RAM/], ["has", /설치된 메모리 일부를 Windows가 인식하지 못합니다/], ["has", /not digitally signed/], ["not", /DESKTOP-K3J9QP2/], garbled,
  ], "dxdiag");
  add("dxdiag/ko-cp949", "한글판 dxdiag(CP949) 라벨 인식", "log", "dx_ko_cp949.txt", [
    ["has", /NVIDIA GeForce RTX 4070/], ["has", /디스플레이 탭 1/], ["has", /디지털 서명이 없습니다/], ["not", /DESKTOP-K3J9QP2/], garbled,
  ], "dxdiag");
  add("dxdiag/ko-utf16", "한글판 dxdiag(UTF-16)", "log", "dx_ko_utf16.txt", [["has", /NVIDIA GeForce RTX 4070/], ["has", /디스플레이 탭 1/], garbled], "dxdiag");
  add("dxdiag/en-ansi-ok", "영문 ANSI 저장, 문제 없는 Notes", "log", "dx_en_ok_ansi.txt", [["has", /NVIDIA GeForce RTX 4070/], ["not", /dxdiag가 .*문제를 보고했습니다/]], "dxdiag");
  add("dxdiag/healthy-no-alerts", "정상 로그에는 경고·결론이 없음", "log", "dx_healthy.txt", [
    ["has", /이 로그에서는 이상 신호가 없습니다/], ["not", /주의 신호가 감지되었습니다/], ["not", /설치된 메모리 일부/],
  ], "dxdiag");
  add("dxdiag/trap-words-no-alerts", "boot·failed·WHEA·error 같은 단어가 들어 있어도 정상이면 경고하지 않음", "log", "dx_trap.txt", [
    ["has", /이 로그에서는 이상 신호가 없습니다/], ["not", /주의 신호가 감지되었습니다/], ["not", /메모리\/시스템 안정성 점검/], ["not", /부팅 관련 항목 확인/], ["not", /드라이버 반응 확인/],
  ], "dxdiag");
  add("dxdiag/dual-gpu-cable", "내장 그래픽에만 화면 출력이 있고 외장 카드는 출력 없음 → 케이블 위치 안내", "log", "dx_dual.txt", [["has", /외장 그래픽카드에 모니터가 연결되어 있지 않은/]], "dxdiag");
  add("dxdiag/basic-display-adapter", "Microsoft Basic Display Adapter → 전용 드라이버 없음", "log", "dx_basic.txt", [["has", /그래픽카드 전용 드라이버가 설치되지 않았습니다/]], "dxdiag");

  // ── msinfo32 ──────────────────────────────────────────────────────────────
  add("msinfo32/en-utf16", "영문 msinfo32: 탭 구분 항목, 레거시 BIOS, 문제 장치 2개(코드 28·43)", "log", "ms_en_utf16.txt", [
    ["has", /BIOS 모드가 레거시\(CSM\)입니다/], ["has", /장치 관리자에 오류가 있는 장치가 2개 있습니다/], ["has", /코드 28/], ["has", /코드 43/], ["has", /설치된 메모리 일부를 Windows가 인식하지 못합니다/], ["not", /DESKTOP-K3J9QP2/], garbled,
  ], "msinfo32");
  add("msinfo32/ko-utf16", "한글판 msinfo32(UTF-16): 한글 라벨", "log", "ms_ko_utf16.txt", [
    ["has", /BIOS 모드가 레거시/], ["has", /코드 28/], ["has", /코드 43/], ["has", /ASUSTeK COMPUTER INC\. ROG STRIX B650-A GAMING WIFI/], garbled,
  ], "msinfo32");
  add("msinfo32/ko-utf8", "한글판 msinfo32(UTF-8)", "log", "ms_ko_utf8.txt", [["has", /BIOS 모드가 레거시/], ["has", /장치 관리자에 오류가 있는 장치가 2개/], garbled], "msinfo32");
  add("msinfo32/healthy-no-alerts", "정상 로그에는 경고가 없음", "log", "ms_healthy.txt", [["has", /이 로그에서는 이상 신호가 없습니다/], ["not", /주의 신호가 감지되었습니다/]], "msinfo32");
  add("msinfo32/trap-words-no-alerts", "Boot·failed·Error Reporting 같은 문구가 있어도 경고하지 않음", "log", "ms_trap.txt", [
    ["has", /이 로그에서는 이상 신호가 없습니다/], ["not", /주의 신호가 감지되었습니다/], ["not", /부팅 관련 항목 확인/], ["not", /드라이버 반응 확인/], ["not", /메모리\/시스템 안정성 점검/],
  ], "msinfo32");
  add("msinfo32/32bit-memory", "32비트 Windows는 메모리 제한을 고장으로 보지 않음", "log", "ms_32bit.txt", [["has", /32비트 Windows라 메모리를 다 쓰지 못합니다/], ["not", /Windows가 인식하지 못합니다/]], "msinfo32");
  add("msinfo32/gpu-code43", "그래픽카드의 코드 43은 카드·전원·슬롯 점검", "log", "ms_full_gpu43.txt", [["has", /그래픽카드가 오류 코드 43으로 중지되었습니다/], ["has", /Secure Boot가 꺼져 있습니다/]], "msinfo32");

  // ── CrystalDiskInfo ───────────────────────────────────────────────────────
  const cdiBad = (lang) => [
    ["has", /대기 중인 불량 섹터\(Current Pending\)가 3개/], ["has", /Critical Warning 값이 1/], ["has", /UltraDMA CRC 오류 120건/], ["has", /수명 96%를 소진/],
    ["has", lang === "ko" ? /건강 주의 4%/ : /건강 Caution 4%/], ["has", /저장장치 2\(WDC WD10EZEX-08WN4A0\) 확인 필요/], garbled,
  ];
  add("crystaldiskinfo/en-utf8-bad", "이상 있는 NVMe + HDD + CRC(케이블) 구분", "log", "cdi_en_bad_utf8.txt", cdiBad("en"), "CrystalDiskInfo");
  add("crystaldiskinfo/en-utf16-bad", "UTF-16 저장", "log", "cdi_en_bad_utf16.txt", cdiBad("en"), "CrystalDiskInfo");
  add("crystaldiskinfo/ko-cp949-bad", "한글판(CP949), 예전에는 '회전'이 깨지던 인코딩", "log", "cdi_ko_bad_cp949.txt", cdiBad("ko"), "CrystalDiskInfo");
  add("crystaldiskinfo/ko-utf16-bad", "한글판(UTF-16)", "log", "cdi_ko_bad_utf16.txt", cdiBad("ko"), "CrystalDiskInfo");
  add("crystaldiskinfo/healthy-no-false-alarm", "정상 디스크에 'Read Error Rate' 항목이 있어도 경고하지 않음", "log", "cdi_en_healthy_utf16.txt", [
    ["has", /SMART 지표에서 이상이 보이지 않습니다/], ["not", /저장장치 확인 필요/], ["not", /주의 신호가 감지되었습니다/],
  ], "CrystalDiskInfo");
  add("crystaldiskinfo/ko-healthy", "한글판 정상 로그의 사용 시간·건강 상태 읽기", "log", "cdi_ko_healthy_utf16.txt", [
    ["has", /건강 좋음 97%/], ["has", /사용 3,456시간/], ["not", /저장장치 확인 필요/],
  ], "CrystalDiskInfo");
  add("crystaldiskinfo/hot-hdd", "HDD 61℃ → HDD 위치 조언", "log", "cdi_hot_hdd.txt", [["has", /온도가 61°C입니다/], ["has", /앞쪽 흡기 팬/]], "CrystalDiskInfo");

  // ── 여러 종류를 한꺼번에 ──────────────────────────────────────────────────
  add("log/mixed-batch", "dxdiag+msinfo32+CrystalDiskInfo+HWiNFO를 한 번에 올리면 파일마다 종류를 알아봄", "log",
    ["dx_en_utf16.txt", "ms_ko_utf16.txt", "cdi_ko_bad_cp949.txt", "hw_ko_real_footer.csv"], [
      ["has", /4개 파일을 각각 분석했습니다/], ["has", /파일 1 · dx_en_utf16\.txt/], ["has", /파일 4 · hw_ko_real_footer\.csv/], ["has", /AMD Ryzen 9 5900X/], ["has", /BIOS 모드가 레거시/], ["has", /Critical Warning 값이 1/],
    ], "dxdiag");

  // ── 이벤트 뷰어 분석기(텍스트·XML) ─────────────────────────────────────────
  add("event/ko-text", "한글 이벤트 뷰어 복사본: 3개 이벤트, '위험'을 치명적으로, 오후 시각 읽기", "event", "ev_ko.txt", [
    ["has", /3개의 서로 다른 이벤트가 발견되었습니다/], ["has", /치명적 1건 · 오류 1건 · 경고 1건/], ["has", /26\. 9\. 18\. 오후 5:17 ~ 26\. 9\. 18\. 오후 5:21/], ["not", /위험 1건/],
  ]);
  add("event/ko-cp949", "CP949로 저장한 텍스트", "event", "ev_ko_cp949.txt", [["has", /3개의 서로 다른 이벤트가 발견되었습니다/], ["has", /치명적 1건 · 오류 1건 · 경고 1건/], garbled]);
  add("event/en-text", "영문 복사본: M/D/YYYY h:mm AM/PM", "event", "ev_en.txt", [
    ["has", /2개의 서로 다른 이벤트가 발견되었습니다/], ["has", /(치명적 1건 · 경고 1건|경고 1건 · 치명적 1건)/], ["has", /26\. 9\. 18\. 오후 5:17 ~ 26\. 9\. 18\. 오후 5:19/],
  ]);
  add("event/xml", "XML 2건(그래픽 드라이버 nvlddmkm 인식)", "event", "ev_two.xml", [["has", /2개의 서로 다른 이벤트가 발견되었습니다/], ["has", /nvlddmkm/], ["not", /사이트에 등록되지 않은 이벤트입니다/]]);
  add("event/multi-file", "형식이 다른 3개 파일을 합쳐 5종, Kernel-Power 41은 3회로 합산", "event", ["ev_ko.txt", "ev_en.txt", "ev_two.xml"], [
    ["has", /파일 3개/], ["has", /5개의 서로 다른 이벤트가 발견되었습니다/], ["has", /Kernel-Power[^0-9]{0,30}3회/], ["has", /치명적 3건 · 오류 2건 · 경고 2건/],
  ]);
  // ── 시간축 종합 리포트(HWiNFO + 이벤트 + 덤프를 한 시각으로) ──────────────────────
  // 시간대와 무관하도록 이벤트는 로컬 시각 텍스트로, HWiNFO는 로컬 시각 그대로 만들었다(덤프는 서버가 필요해 제외).
  add("timeline/heat-before-shutdown", "종료 직전 CPU가 97℃ → 고온 동반, HWiNFO 기록이 사건 시각에 끊김, WHEA는 고온 때 몰림, Display는 무관", "timeline", ["tl_heat.csv", "tl_events.txt"], [
    ["has", /HWiNFO 로그 1개 · 이벤트 9건 · 덤프 0개/], ["has", /예기치 않은 종료 뒤 재부팅\(Kernel-Power 41\)/], ["has", /종료 직전 고온이 확인됩니다/],
    ["has", /HWiNFO 기록이 이 시각\(16:59:28\)에 그대로 끊겼습니다/], ["has", /CPU 온도\s*최대 97\.0°C\s*97\.0°C\s*기준 초과/],
    ["has", /WHEA-Logger 17\(3건\), Display 4101\(1건\)/], ["has", /WHEA-Logger 17 3건 · CPU 온도 [0-9.]+°C\(로그 평균 [0-9.]+°C\) — 온도가 높을 때 몰려서 발생/],
    ["has", /Display 4101 3건 · GPU 코어 온도 59\.0°C\(로그 평균 59\.0°C\) — 평소 온도와 차이가 없음/], ["not", /NaN|undefined/],
  ]);
  add("timeline/clean-no-heat-no-sag", "온도·전압이 정상인 채 끊김 → 열·전압 원인 가능성 낮음", "timeline", ["tl_clean.csv", "tl_events.txt"], [
    ["has", /종료 직전 온도·전압·제한 플래그에 이상이 없습니다/], ["has", /순간 전원 차단/], ["not", /종료 직전 고온이 확인됩니다/],
  ]);
  add("timeline/voltage-sag", "종료 직전 12V가 10.6V로 처짐 → 전원 쪽 의심", "timeline", ["tl_sag.csv", "tl_events.txt"], [
    ["has", /종료 직전 전원 레일 전압이 처졌습니다/], ["has", /\+12V 레일\s*최저 10\.[56]\d*V/], ["not", /종료 직전 고온이 확인됩니다/],
  ]);
  add("timeline/hwinfo-only", "이벤트가 없으면 사건을 만들지 않고 안내", "timeline", ["tl_heat.csv"], [["has", /재부팅·블루스크린 사건을 찾지 못했습니다/], ["has", /HWiNFO 로그 1개 · 이벤트 0건/]]);
  add("timeline/events-only", "HWiNFO 없이 이벤트만 → 사건은 표시하고 온도는 비교 불가 안내", "timeline", ["tl_events.txt"], [["has", /예기치 않은 종료 뒤 재부팅/], ["has", /HWiNFO 로그를 올리지 않아 이 시각의 온도·전압은 알 수 없습니다/]]);
  add("timeline/timezone-hint", "HWiNFO가 9시간 어긋나 있으면 보정을 제안", "timeline", ["tl_heat_tz9.csv", "tl_events.txt"], [
    ["has", /HWiNFO 시각이 사건과 겹치지 않습니다/], ["has", /-9시간 옮기면 사건과 겹칩니다/], ["has", /기록 범위 밖이라 이 시각의 온도·전압은 비교할 수 없습니다/],
  ]);
  // 실제 PC 로그(2026-07-30 20:17에 꺼진 사례)에서 잘라 낸 HWiNFO 마지막 100행 + 그 시각의 이벤트.
  // 기대값은 원본 CSV에서 파이썬으로 따로 계산한 값(사건 직전 2분의 최대·최저·마지막 값)과 같다.
  add("timeline/real-cut-log", "실제 로그: HWiNFO가 20:17:47에 끊기고 Kernel-Power 41은 20:18:01 → 직전 2분 수치가 원본과 일치", "timeline", ["tl_real_tail.csv", "tl_real_events.txt"], [
    ["has", /HWiNFO 로그 1개 · 이벤트 4건/], ["has", /2026\. 7\. 30\. 20:14:27 ~ 2026\. 7\. 30\. 20:17:58 사이/],
    ["has", /HWiNFO 기록이 이 시각\(20:17:47\)에 그대로 끊겼습니다/], ["has", /사건 직전 2분\(20:15:47~20:17:47\)/],
    ["has", /CPU 온도\s*최대 76\.2°C\s*68\.6°C\s*정상 범위/], ["has", /GPU 코어 온도\s*최대 68\.9°C\s*68\.8°C/],
    ["has", /\+12V 레일\s*최저 12\.076V\s*12\.172V/], ["has", /\+5V 레일\s*최저 5\.060V\s*5\.100V/], ["has", /GPU 12V 입력 전압\s*최저 12\.145V\s*12\.149V/],
    ["has", /종료 직전 온도·전압·제한 플래그에 이상이 없습니다/], ["not", /종료 직전 고온이 확인됩니다/], ["not", /전원 레일 전압이 처졌습니다/],
  ]);
  // 인쇄용 보고서(사용자/장소·메모 포함, 조작 버튼 제거)와 진단 카트 → AI 프롬프트
  add("timeline/print-report", "인쇄용 HTML에 제목·사용자/장소·메모·판정·그래프가 있고 조작 버튼은 없음", "timeline-print", ["tl_heat.csv", "tl_events.txt"], [
    ["has", /PC 진단 시간축 종합 리포트/], ["has", /사용자\/장소: 테스트 사용자 · 사무실/], ["has", /메모: 게임 중 재부팅/], ["has", /종료 직전 고온이 확인됩니다/],
    ["has", /부품 고장을 확정하지 않으며/], ["not", /리포트 텍스트 복사|인쇄·PDF 저장|카트에 담아/],
  ]);
  add("timeline/cart-to-ai-prompt", "카트에 담으면 AI 프롬프트에 사건별 판정·직전 2분 수치·끊김 여부가 들어감", "timeline-cart", ["tl_heat.csv", "tl_events.txt"], [
    ["has", /카트배지=1/], ["has", /시간축 종합 리포트 · 사건 1건/], ["has", /시간축 종합 리포트'는 HWiNFO·이벤트 로그·덤프를 같은 시각으로/],
    ["has", /"kind":"timeline-report"/], ["has", /종료 직전 고온이 확인됩니다/], ["has", /CPU 온도 최대 97(?:\.0)?°C\(기준 초과\)/], ["has", /"hwinfoLogEndedAtIncident":true/], ["has", /WHEA-Logger 17 3건/],
  ]);
  return cases;
})();
