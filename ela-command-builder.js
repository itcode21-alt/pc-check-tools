// 증상별 PowerShell 수집 명령 만들기. 이벤트 로그 해석기(event-log-analyzer.html, en/ 포함)와
// 진단 도구의 이벤트 뷰어 탭(diagnostic.html)이 함께 쓴다. 마크업은 각 페이지가 갖고, 이 파일은
// 명령 생성과 화면 연결(id: ela-ps, ela-ps-symptom/days/max/from/to/range-note/desc/cmd/copy)만 맡는다.
(function () {
  "use strict";

  var LANG = typeof document !== "undefined" && document.documentElement && document.documentElement.lang === "en" ? "en" : "ko";
  var T = function (ko, en) { return LANG === "en" ? en : ko; };

  // ids가 없으면 중대·오류·경고(Level 1~3)만 모은다.
  var PS_PRESETS = [
    { label: T("갑자기 재부팅되거나 꺼짐", "Sudden restarts or power-offs"), logs: ["System"], ids: [41, 6008, 1001, 1074, 6005, 6006, 17, 18, 19, 20, 46, 47],
      desc: T("비정상 종료(41·6008), 블루스크린(1001), 정상 종료·시작(1074·6005·6006), WHEA 하드웨어 오류를 모읍니다.",
        "Collects abnormal shutdowns (41, 6008), blue screens (1001), normal shutdown/start (1074, 6005, 6006) and WHEA hardware errors.") },
    { label: T("블루스크린", "Blue screens"), logs: ["System"], ids: [1001, 41, 6008, 17, 18, 19, 20, 46, 47, 7, 11, 51, 153, 154, 157],
      desc: T("BugCheck(1001)와 그 전후에 자주 함께 남는 하드웨어·디스크 오류를 모읍니다.",
        "Collects BugCheck (1001) and the hardware and disk errors that often appear around it.") },
    { label: T("디스크 오류·멈춤·느려짐", "Disk errors, freezes, slowness"), logs: ["System"], ids: [7, 9, 11, 15, 51, 52, 55, 57, 98, 129, 137, 140, 153, 154, 157, 158, 41],
      desc: T("Disk·Ntfs·storahci·stornvme 계열의 입출력 오류, 재시도, 고장 예측 기록을 모읍니다.",
        "Collects I/O errors, retries and failure-prediction records from Disk, Ntfs, storahci and stornvme.") },
    { label: T("화면 깜빡임·그래픽 멈춤", "Screen flicker, graphics freezes"), logs: ["System"], ids: [4101, 141, 153, 1001, 41],
      desc: T("그래픽 드라이버 복구(4101), GPU 오류(141·nvlddmkm 153), 재시작 기록을 모읍니다.",
        "Collects graphics driver recovery (4101), GPU errors (141, nvlddmkm 153) and restart records.") },
    { label: T("절전·복귀 문제", "Sleep and resume problems"), logs: ["System"], ids: [1, 42, 107, 109, 172, 566, 41, 6008],
      desc: T("절전 진입·복귀(Power-Troubleshooter 1, Kernel-Power 42·107·109)와 비정상 종료를 모읍니다.",
        "Collects sleep entry/resume (Power-Troubleshooter 1, Kernel-Power 42, 107, 109) and abnormal shutdowns.") },
    { label: T("장치 인식·드라이버 문제", "Device recognition and driver problems"), logs: ["System", "Microsoft-Windows-Kernel-PnP/Configuration"], ids: [219, 411, 7026],
      desc: T("Kernel-PnP 219·411(장치 시작 문제), SCM 7026(부팅 드라이버 로드 실패)을 모읍니다. 411은 Kernel-PnP/Configuration 로그에 남습니다.",
        "Collects Kernel-PnP 219 and 411 (device start problems) and SCM 7026 (boot driver failed to load). 411 is written to the Kernel-PnP/Configuration log.") },
    { label: T("부팅·종료가 느림", "Slow boot or shutdown"), logs: ["Microsoft-Windows-Diagnostics-Performance/Operational"], ids: [100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 200, 201, 202, 203],
      desc: T("부팅 시간(100)과 시작을 지연시킨 항목(101~110), 종료 시간(200)과 종료를 지연시킨 항목(201~203)을 모읍니다. 이 이벤트들은 시스템 로그가 아니라 Diagnostics-Performance/Operational 로그에 남습니다.",
        "Collects boot time (100) and items that delayed start-up (101–110), shutdown time (200) and items that delayed shutdown (201–203). These events are written to the Diagnostics-Performance/Operational log, not the System log.") },
    { label: T("Wi-Fi 연결 끊김·실패", "Wi-Fi drops and failures"), logs: ["System", "Microsoft-Windows-WLAN-AutoConfig/Operational"], ids: [8001, 8002, 8003, 10002],
      desc: T("무선 연결 성공(8001)·실패(8002)·해제(8003)와 어댑터 관련 기록을 모읍니다. 연결 기록은 WLAN-AutoConfig/Operational 로그에 남습니다.",
        "Collects wireless connection success (8001), failure (8002), disconnection (8003) and adapter records. Connection records are written to the WLAN-AutoConfig/Operational log.") },
    { label: T("업데이트·프로그램 설치 실패", "Update and program install failures"), logs: ["System", "Application"], ids: [20, 31, 11708, 1033],
      desc: T("Windows 업데이트 다운로드·설치 실패(31·20)와 Windows Installer 설치 실패(11708), 설치 결과 상태(1033)를 모읍니다.",
        "Collects Windows Update download/install failures (31, 20), Windows Installer failures (11708) and the install result status (1033).") },
    { label: T("프로그램이 자꾸 종료됨", "Programs keep closing"), logs: ["Application"], ids: [1000, 1002, 1026, 1001],
      desc: T("응용 프로그램 오류(1000), 응답 없음(1002), .NET 오류(1026), 오류 보고(1001)를 모읍니다.",
        "Collects application errors (1000), not-responding (1002), .NET errors (1026) and error reports (1001).") },
    { label: T("오류·경고 전체 (System + Application)", "All errors and warnings (System + Application)"), logs: ["System", "Application"], ids: null,
      desc: T("ID를 가리지 않고 중대·오류·경고 수준만 모읍니다. 증상을 모를 때 쓰세요.",
        "Collects only Critical, Error and Warning levels regardless of ID. Use it when you do not know the symptom.") }
  ];
  var PS_DAYS = [1, 3, 7, 14, 30];
  var PS_MAX = [50, 100, 300, 500];

  // range가 있으면 {from, to}(YYYY-MM-DD, 종료일 포함)로 기간을 직접 지정한다. 형식이 다르면 days를 쓴다.
  var ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
  function dayAfter(iso) {
    return new Date(Date.parse(iso + "T00:00:00Z") + 86400000).toISOString().slice(0, 10);
  }
  function validRange(range) {
    return !!(range && ISO_DATE.test(range.from) && ISO_DATE.test(range.to) && !isNaN(Date.parse(range.from + "T00:00:00Z")) &&
      !isNaN(Date.parse(range.to + "T00:00:00Z")) && range.from <= range.to);
  }

  function buildCommand(preset, days, max, range) {
    var time = validRange(range)
      ? "StartTime=[datetime]'" + range.from + "'; EndTime=[datetime]'" + dayAfter(range.to) + "'"
      : "StartTime=(Get-Date).AddDays(-" + days + ")";
    var filter = "LogName=" + preset.logs.map(function (l) { return "'" + l + "'"; }).join(",") + "; " +
      (preset.ids ? "Id=" + preset.ids.join(",") : "Level=1,2,3") + "; " + time;
    return "Get-WinEvent -FilterHashtable @{" + filter + "} -MaxEvents " + max +
      " -ErrorAction SilentlyContinue | Format-List TimeCreated, ProviderName, Id";
  }

  function initCommandBuilder() {
    var box = document.getElementById("ela-ps");
    var sel = document.getElementById("ela-ps-symptom");
    var daysEl = document.getElementById("ela-ps-days");
    var maxEl = document.getElementById("ela-ps-max");
    var out = document.getElementById("ela-ps-cmd");
    var desc = document.getElementById("ela-ps-desc");
    var copy = document.getElementById("ela-ps-copy");
    if (!box || !sel || !daysEl || !maxEl || !out) return;
    var opt = function (el, value, label, selected) {
      var o = document.createElement("option");
      o.value = value; o.textContent = label; if (selected) o.selected = true;
      el.appendChild(o);
    };
    PS_PRESETS.forEach(function (p, i) { opt(sel, i, p.label, false); });
    PS_DAYS.forEach(function (d) { opt(daysEl, d, T("최근 " + d + "일", "Last " + d + (d === 1 ? " day" : " days")), d === 3); });
    PS_MAX.forEach(function (m) { opt(maxEl, m, T("최대 " + m + "건", "Up to " + m), m === 100); });
    var fromEl = document.getElementById("ela-ps-from");
    var toEl = document.getElementById("ela-ps-to");
    var rangeNote = document.getElementById("ela-ps-range-note");
    var update = function () {
      var preset = PS_PRESETS[+sel.value];
      var range = fromEl && toEl ? { from: fromEl.value, to: toEl.value } : null;
      var useRange = validRange(range);
      daysEl.disabled = useRange;
      out.textContent = buildCommand(preset, +daysEl.value, +maxEl.value, useRange ? range : null);
      if (desc) desc.textContent = preset.desc;
      if (rangeNote) {
        var half = !!(range && (range.from || range.to) && !(range.from && range.to));
        var reversed = !!(range && range.from && range.to && range.from > range.to);
        rangeNote.textContent = useRange ? T("기간 직접 지정을 사용 중입니다(종료일 포함). 지우면 위의 \"기간\" 선택으로 돌아갑니다.", "A custom date range is in use (end date included). Clear it to go back to the “Period” choice above.")
          : reversed ? T("시작일이 종료일보다 늦어서 적용하지 않았습니다.", "The start date is later than the end date, so it was not applied.")
          : half ? T("시작일과 종료일을 모두 고르면 적용됩니다.", "It applies once both a start and an end date are chosen.") : "";
      }
    };
    [sel, daysEl, maxEl, fromEl, toEl].forEach(function (el) { if (el) el.addEventListener("change", update); });
    if (copy) {
      copy.addEventListener("click", function () {
        var done = function () { copy.textContent = T("복사했습니다", "Copied"); setTimeout(function () { copy.textContent = T("명령 복사", "Copy command"); }, 1800); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(out.textContent).then(done, function () {});
      });
    }
    update();
    box.hidden = false;
  }


  var api = { PS_PRESETS: PS_PRESETS, PS_DAYS: PS_DAYS, PS_MAX: PS_MAX, validRange: validRange, buildCommand: buildCommand, initCommandBuilder: initCommandBuilder };
  if (typeof window !== "undefined") window.ElaCommandBuilder = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})();
