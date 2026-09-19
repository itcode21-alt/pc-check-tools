"""덤프(.dmp) 분석 결과와 이벤트 로그(.evtx) 분석 결과를 엮어 종합 판단을 만든다.

규칙 기반 점수 엔진이다. 신호(덤프의 버그체크 코드, 이벤트 로그의 PCIe/디스크/전원 이벤트,
부팅 후 경과 시간)마다 가설별 가중치를 더하고, 가설의 점수 비중으로 가능성을, 서로 다른 출처가
얼마나 맞물리는지(그리고 시각이 겹치는지)로 근거 일치도를 정한다. 단일 신호로 부품을 확정하지
않으며, 판단 근거·한계·"더 정확히 하려면 필요한 자료"를 함께 돌려준다.
"""
import math
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Optional

# ── 가설 ────────────────────────────────────────────────────────────────
HYPOTHESES = {
    "gpu_link": "그래픽카드 슬롯 접촉·라이저 케이블·PCIe 링크 신호 품질",
    "gpu_hw": "그래픽카드 자체 결함",
    "cpu_slot": "CPU의 PCIe 컨트롤러·메인보드 슬롯",
    "gpu_driver": "그래픽 드라이버 오류·충돌",
    "pcie_device": "오류가 난 PCIe 장치(SSD·확장 카드)의 접촉·링크 품질",
    "storage": "저장장치(SSD/HDD)·케이블·컨트롤러",
    "memory": "메모리(RAM)·XMP/오버클럭 설정",
    "power": "전원공급장치(PSU)·전원 공급 불안정",
    "cpu_hw": "CPU·메인보드 하드웨어 결함",
    "driver_generic": "특정 드라이버·소프트웨어 충돌",
}

DISPLAY_CODES = {0x116, 0x117, 0x119, 0x113, 0xEA}

_GPU = {"gpu_driver": 1.0, "gpu_hw": 0.6, "gpu_link": 0.6}
_DRV = {"driver_generic": 0.9}
CODE_WEIGHTS = {
    0x116: _GPU, 0x117: _GPU, 0x113: _GPU,
    0x119: {"gpu_driver": 0.9, "gpu_hw": 0.6, "gpu_link": 0.4},
    0xEA: {"gpu_driver": 1.0, "gpu_hw": 0.4},
    0x133: {"driver_generic": 0.7, "storage": 0.5, "gpu_driver": 0.3},
    0x124: {"cpu_hw": 1.2, "memory": 0.5}, 0x9C: {"cpu_hw": 1.2},
    0x101: {"cpu_hw": 1.0, "power": 0.4},
    0x1A: {"memory": 1.2}, 0x4E: {"memory": 1.2}, 0x2E: {"memory": 1.0},
    0x12B: {"memory": 1.0, "cpu_hw": 0.5}, 0x80: {"memory": 0.8, "cpu_hw": 0.5},
    0x50: {"memory": 0.9, "driver_generic": 0.6, "storage": 0.3},
    0xA: {"driver_generic": 0.9, "memory": 0.5}, 0xD1: {"driver_generic": 1.0, "memory": 0.4},
    0x139: {"driver_generic": 0.7, "memory": 0.6}, 0x109: {"driver_generic": 0.7, "memory": 0.6},
    0x13A: {"driver_generic": 0.7, "memory": 0.6},
    0x7A: {"storage": 1.2}, 0x77: {"storage": 1.2}, 0x24: {"storage": 1.2}, 0x7B: {"storage": 1.2},
    0xED: {"storage": 1.2}, 0xF4: {"storage": 1.0, "driver_generic": 0.3}, 0x154: {"storage": 1.1},
    0xEF: {"storage": 0.6, "driver_generic": 0.5},
    0x9F: {"power": 0.8, "driver_generic": 0.6},
    0xA5: {"cpu_hw": 0.6, "driver_generic": 0.6},
}
for _c in (0x19, 0x1E, 0x3B, 0x7E, 0x8E, 0xF7, 0xBE, 0xC2, 0xC4, 0xC5, 0xCE, 0xD5, 0xD8, 0xDE, 0xFC, 0xC000021A):
    CODE_WEIGHTS.setdefault(_c, _DRV)

SHORT_UPTIME_MIN = 10.0          # 부팅 후 이 시간 안에 난 크래시는 "부팅 직후 재현"으로 본다
BURST_LEAD = timedelta(minutes=10)   # 폭주 구간 시작 전 이 시간 안의 크래시까지 연관으로 본다
BURST_TAIL = timedelta(minutes=10)

STEPS = {
    "gpu_link": [
        "BIOS에서 그래픽카드 슬롯(PCIe x16)의 링크 속도를 Auto에서 한 단계 낮은 세대(예: Gen5 → Gen4, 안 되면 Gen3)로 고정한 뒤 오류가 줄어드는지 확인합니다. 줄어들면 신호 품질 문제로 좁혀집니다.",
        "그래픽카드를 슬롯에서 뽑아 금색 접점을 닦고 다시 끝까지 꽂습니다. 수직 장착용 라이저 케이블을 쓰고 있다면 빼고 메인보드 슬롯에 직결해 다시 확인합니다.",
        "메인보드 BIOS를 최신 버전으로 올립니다(CPU 마이크로코드·PCIe 호환성 패치 포함).",
        "가능하면 다른 그래픽카드로, 또는 이 그래픽카드를 다른 PC에 꽂아 같은 오류가 나는지 교차 테스트합니다. 카드를 바꿔도 같은 슬롯에서 오류가 계속되면 CPU·메인보드 쪽, 카드가 바뀌면 그래픽카드 쪽입니다.",
        "위 방법으로도 오류가 남으면 판매처·제조사 A/S를 받으세요. 결과 화면을 텍스트로 저장해 함께 전달하면 증상 설명에 도움이 됩니다.",
    ],
    "gpu_driver": [
        "DDU로 기존 그래픽 드라이버를 완전히 제거한 뒤 제조사 최신 드라이버를 새로 설치합니다.",
        "HDMI/DP 케이블과 모니터 포트를 바꿔 보고, 전원 옵션의 'PCI Express 링크 상태 전원 관리'를 끕니다.",
        "GPU 온도와 VRAM 사용량을 모니터링하면서 같은 작업을 재현해 봅니다.",
        "그래도 반복되면 이벤트 뷰어의 WHEA-Logger 기록을 확인해 하드웨어 링크 문제 여부를 가립니다.",
    ],
    "pcie_device": [
        "오류가 난 장치(SSD·확장 카드)를 뽑았다가 다시 장착하고 접점을 확인합니다.",
        "BIOS·칩셋 드라이버를 최신으로 올립니다.",
        "다른 슬롯으로 옮겨 오류가 장치를 따라가는지 슬롯에 남는지 확인합니다.",
    ],
    "storage": [
        "CrystalDiskInfo로 SSD/HDD 상태(SMART)를 확인하고, 중요한 자료는 먼저 백업합니다.",
        "SATA/전원 케이블을 다시 꽂고, NVMe라면 장착 상태와 방열판 접촉을 확인합니다.",
        "SSD 펌웨어와 스토리지 드라이버를 최신으로 올린 뒤 chkdsk를 실행합니다.",
    ],
    "memory": [
        "BIOS에서 XMP/EXPO·오버클럭을 끄고 기본 클럭으로 재현 여부를 확인합니다.",
        "MemTest86으로 메모리를 여러 패스 검사합니다.",
        "램을 한 개씩 꽂아가며 특정 모듈·슬롯에서만 오류가 나는지 확인합니다.",
    ],
    "power": [
        "파워 정격 용량과 그래픽카드 권장 용량을 비교하고, 보조전원 케이블 연결 상태를 확인합니다.",
        "전원 케이블·멀티탭·벽면 콘센트를 바꿔 재현 여부를 확인합니다.",
        "가능하면 다른 파워로 교차 테스트합니다.",
    ],
    "cpu_hw": [
        "오버클럭·XMP 설정을 끄고 재현 여부를 확인합니다.",
        "CPU 온도와 쿨러 장착 상태를 점검하고 BIOS를 최신으로 올립니다.",
        "MemTest86로 메모리도 함께 검사한 뒤, 계속되면 A/S를 받으세요.",
    ],
    "driver_generic": [
        "최근 설치·업데이트한 드라이버와 프로그램을 확인해 제거·롤백해 봅니다.",
        "안전 모드에서 재현되는지 확인해 드라이버 문제인지 가립니다.",
        "덤프가 매번 같은 드라이버를 가리키는지 WinDbg로 정밀 분석합니다.",
    ],
}
STEPS["gpu_hw"] = STEPS["gpu_link"]
STEPS["cpu_slot"] = STEPS["gpu_link"]

GUIDES = {
    "gpu_link": [["그래픽 드라이버 응답 없음·신호없음 가이드", "windows-display-driver-crash.html"],
                 ["WHEA-Logger 17 (PCIe 수정된 오류)", "event-whea-logger-17.html"],
                 ["VIDEO_TDR_FAILURE (0x116)", "error-code-0x00000116.html"]],
    "gpu_driver": [["그래픽 드라이버 응답 없음·신호없음 가이드", "windows-display-driver-crash.html"],
                   ["VIDEO_TDR_FAILURE (0x116)", "error-code-0x00000116.html"]],
    "pcie_device": [["WHEA-Logger 17 (PCIe 수정된 오류)", "event-whea-logger-17.html"]],
    "storage": [["Disk 7 (불량 블록)", "event-disk-7.html"], ["Ntfs 55 (파일 시스템 손상)", "event-ntfs-55.html"]],
    "memory": [["메모리 검사 가이드", "memory-test-guide.html"]],
    "power": [["Kernel-Power 41", "event-kernel-power-41.html"]],
    "cpu_hw": [["WHEA_UNCORRECTABLE_ERROR (0x124)", "error-code-0x00000124.html"], ["WHEA-Logger 18", "event-whea-logger-18.html"]],
    "driver_generic": [["블루스크린 증상 가이드", "diagnostic.html#diagnostic-symptom"]],
}
GUIDES["gpu_hw"] = GUIDES["gpu_link"]
GUIDES["cpu_slot"] = GUIDES["gpu_link"]

# 최상위 가설별 표제(확신도 높음/중간 표현, 낮음 표현)
HEADLINES = {
    "gpu_link": ("그래픽카드가 꽂힌 CPU 직결 PCIe 슬롯의 링크 불안정이 화면 신호 끊김(TDR 실패)의 유력한 원인입니다.",
                 "그래픽카드가 꽂힌 CPU 직결 PCIe 슬롯의 링크 불안정이 화면 신호 끊김(TDR 실패)의 원인으로 의심됩니다."),
    "gpu_hw": ("그래픽카드 또는 그 슬롯의 하드웨어 문제가 유력합니다.", "그래픽카드 하드웨어 문제가 의심됩니다."),
    "cpu_slot": ("CPU의 PCIe 컨트롤러 또는 메인보드 슬롯 문제가 유력합니다.", "CPU의 PCIe 컨트롤러 또는 메인보드 슬롯 문제가 의심됩니다."),
    "gpu_driver": ("그래픽 드라이버 응답 실패(TDR)가 반복되고 있으며, 드라이버·설정 쪽 원인이 유력합니다.",
                   "그래픽 드라이버 응답 실패(TDR)가 반복되고 있습니다. 하드웨어 링크 문제 여부는 이 자료만으로 판단하지 못했습니다."),
    "pcie_device": ("PCIe 링크 오류가 대량으로 기록됐습니다. 오류가 난 장치(슬롯)의 접촉·링크 문제가 유력합니다.",
                    "PCIe 링크 오류가 대량으로 기록됐습니다. 오류가 난 장치(슬롯)를 확인하세요."),
    "storage": ("저장장치(SSD/HDD) 또는 그 연결에 문제가 있을 가능성이 큽니다.", "저장장치 관련 오류가 확인됩니다. 저장장치 상태를 먼저 점검하세요."),
    "memory": ("메모리(RAM) 또는 메모리 설정 문제가 유력합니다.", "메모리 관련 오류 패턴이 보입니다. 메모리 검사를 먼저 해 보세요."),
    "power": ("전원 공급 불안정으로 인한 예기치 않은 종료 가능성이 큽니다.", "예기치 않은 종료 기록이 있어 전원 공급 문제를 의심할 수 있습니다."),
    "cpu_hw": ("치명적 하드웨어 오류 기록이 있습니다. CPU·메모리·메인보드 하드웨어 점검이 필요합니다.",
               "하드웨어 오류 기록이 있습니다. CPU·메모리·메인보드를 점검하세요."),
    "driver_generic": ("특정 드라이버·소프트웨어 충돌이 원인일 가능성이 있습니다.", "뚜렷한 하드웨어 신호는 없고 드라이버·소프트웨어 충돌이 의심됩니다."),
}


def _dt(v):
    if not v:
        return None
    try:
        return datetime.fromisoformat(v)
    except (TypeError, ValueError):
        return None


def _code(d: dict):
    try:
        return int(str(d.get("stopCode", "")), 16)
    except ValueError:
        return None


_KST = timezone(timedelta(hours=9))


def _fmt(dt):
    """사이트 이용자 대부분이 한국이라 한국 시간(KST)으로 표기한다."""
    return dt.astimezone(_KST).strftime("%Y-%m-%d %H:%M") + " KST"


class _Scores:
    def __init__(self):
        self.score = defaultdict(float)
        self.reasons = defaultdict(list)
        self.sources = defaultdict(set)

    def add(self, hyp, w, source, reason=None):
        if w <= 0:
            return
        self.score[hyp] += w
        self.sources[hyp].add(source)
        if reason and reason not in self.reasons[hyp]:
            self.reasons[hyp].append(reason)


def build(dumps: list, evtx: Optional[dict]) -> dict:
    n = len(dumps)
    sc = _Scores()
    evidence: list = []
    next_evidence: list = []
    timeline: list = []

    # ── 덤프 신호 ────────────────────────────────────────────────────
    codes = Counter()
    for d in dumps:
        c = _code(d)
        if c is not None:
            codes[c] += 1
    display_n = sum(v for c, v in codes.items() if c in DISPLAY_CODES)
    gpu_vendors = sorted({v for d in dumps for v in (d.get("gpuDrivers") or [])})
    cpu_count = next((d.get("cpuCount") for d in dumps if d.get("cpuCount")), None)

    for c, cnt in codes.items():
        factor = min(2.5, 1.0 + 0.5 * (cnt - 1))
        for hyp, w in CODE_WEIGHTS.get(c, {"driver_generic": 0.3}).items():
            reason = f"버그체크 0x{c:X}가 덤프 {cnt}개에서 확인됨" if w >= 0.6 else None
            sc.add(hyp, w * factor, "dump", reason)

    if n:
        parts = ", ".join(f"0x{c:X} {v}건" for c, v in codes.most_common())
        evidence.append(f"덤프 {n}개의 버그체크: {parts}")
    if display_n:
        evidence.append(f"그래픽 관련 버그체크(0x116 계열)가 덤프 {n}개 중 {display_n}개 — 그래픽 드라이버가 응답하지 못했고 TDR 복구도 실패했습니다.")
    if gpu_vendors:
        evidence.append(f"덤프에서 확인된 그래픽 드라이버: {', '.join(gpu_vendors)}")

    # 발생 시각·부팅 후 경과 시간
    dump_times = []
    for d in dumps:
        t = _dt(d.get("crashTime"))
        if t:
            dump_times.append(t)
            up = d.get("uptimeMinutes")
            c = _code(d)
            label = f"덤프 크래시 0x{c:X}" if c is not None else "덤프 크래시"
            if isinstance(up, (int, float)):
                label += f" (부팅 후 {up:g}분)"
            timeline.append({"time": t.isoformat(), "kind": "dump", "label": label})
    uptimes = [d.get("uptimeMinutes") for d in dumps if isinstance(d.get("uptimeMinutes"), (int, float))]
    short = [u for u in uptimes if u <= SHORT_UPTIME_MIN]
    persistent = bool(uptimes) and len(short) >= 2 or (len(uptimes) >= 2 and len(short) / len(uptimes) >= 0.5)
    if uptimes and short:
        evidence.append(
            f"크래시 {len(uptimes)}건 중 {len(short)}건이 부팅 후 {SHORT_UPTIME_MIN:g}분 안에 발생했습니다"
            f"(부팅 후 경과: {', '.join(f'{u:g}분' for u in sorted(uptimes))}). "
            + ("시간이 지나며 쌓이는 문제(누수·발열)보다 부팅 직후부터 재현되는 지속적인 조건(링크·연결·설정)에 무게가 실립니다."
               if persistent else "일부는 부팅 직후에 발생했습니다."))

    # ── 이벤트 로그 신호 ─────────────────────────────────────────────
    storms, gpu_storms, fatal = [], [], []
    log_start = log_end = None
    log_crashes = []
    if evtx:
        rng = evtx.get("timeRange") or {}
        log_start, log_end = _dt(rng.get("start")), _dt(rng.get("end"))
        if log_start and log_end:
            timeline.append({"time": log_start.isoformat(), "kind": "log-start", "label": "이벤트 로그 기록 시작"})
            timeline.append({"time": log_end.isoformat(), "kind": "log-end", "label": "이벤트 로그 기록 끝"})
        for item in (evtx.get("bugchecks") or []) + (evtx.get("kernelPower41") or []):
            t = _dt(item.get("time"))
            if t:
                log_crashes.append(t)
                timeline.append({"time": t.isoformat(), "kind": "log-crash", "label": "로그에 기록된 비정상 종료"})

        for w in evtx.get("wheaDevices", []):
            cnt = w.get("count", 0)
            if w.get("eventId") == 17 and cnt >= 100:
                storms.append(w)
                mag = min(3.0, 1.0 + math.log10(cnt / 100.0))
                quality = (w.get("linkQualityHits", 0) / cnt) if cnt else 0
                if quality < 0.3:
                    mag *= 0.5
                bits = ", ".join(f"{b['name']} {b['count']:,}건" for b in (w.get("correctable") or [])[:4])
                evidence.append(f"이벤트 로그: {w['role']}({w['bdf']})에서 수정된 PCIe 오류 {cnt:,}건, 최고 분당 {w.get('peakPerMinute')}건. 내역: {bits}")
                if w.get("roleKind") == "cpu-x16":
                    gpu_storms.append(w)
                    sc.add("gpu_link", 2.0 * mag, "evtx", "같은 슬롯에서 수신 오류·재전송 오류가 대량으로 반복됨(링크 신호 품질 문제의 전형적인 패턴)")
                    sc.add("gpu_hw", 1.0 * mag, "evtx", "링크 오류는 카드 쪽 송수신부 문제로도 생길 수 있어 교차 테스트가 필요합니다.")
                    sc.add("cpu_slot", 1.0 * mag, "evtx", "이 슬롯은 칩셋이 아니라 CPU에 직결돼 있어 CPU나 슬롯 쪽 문제일 수도 있습니다.")
                else:
                    sc.add("pcie_device", 2.0 * mag, "evtx", f"{w['role']}({w['bdf']})에서 수정된 오류 {cnt:,}건")
                for b in w.get("bursts", [])[:3]:
                    s0, e0 = _dt(b.get("start")), _dt(b.get("end"))
                    if s0:
                        timeline.append({"time": s0.isoformat(), "kind": "burst", "label": f"PCIe 오류 폭주 시작 ({b.get('count'):,}건)"})
            if w.get("eventId") in (18, 20) or w.get("uncorrectable"):
                fatal.append(w)
                sc.add("cpu_hw", min(3.0, 2.0 + math.log10(max(cnt, 1))), "evtx", "치명적/수정 불가 하드웨어 오류(WHEA) 기록")

        cats = evtx.get("categoryCounts") or {}
        for key, base, cap, hyp, label in (
            ("storage", 1.0, 2.5, "storage", "디스크·NTFS 관련 오류 이벤트"),
            ("memory", 1.2, 2.5, "memory", "메모리 관련 WHEA 오류 이벤트"),
            ("display", 0.8, 2.0, "gpu_driver", "디스플레이/그래픽 드라이버 오류 이벤트"),
        ):
            cnt = cats.get(key, 0)
            if cnt:
                sc.add(hyp, min(cap, base + 0.5 * math.log10(cnt + 1) * 2), "evtx", f"{label} {cnt}건")
                evidence.append(f"이벤트 로그: {label} {cnt:,}건")
        kp_unexplained = [k for k in (evtx.get("kernelPower41") or []) if not k.get("bugcheckCode")]
        if len(kp_unexplained) > 0:
            sc.add("power", min(2.5, 1.0 + 0.6 * math.log10(len(kp_unexplained) + 1) * 2), "evtx",
                   f"블루스크린 없이 전원이 끊긴 기록(Kernel-Power 41) {len(kp_unexplained)}건")
            evidence.append(f"이벤트 로그: 블루스크린 없이 예기치 않게 종료된 기록 {len(kp_unexplained)}건")

    # ── 시간 정합: 덤프/로그 크래시가 오류 폭주 구간과 겹치는가 ──────────
    windows = []
    for w in gpu_storms + [s for s in storms if s not in gpu_storms]:
        for b in w.get("bursts", []):
            s0, e0 = _dt(b.get("start")), _dt(b.get("end"))
            if s0 and e0:
                windows.append((s0 - BURST_LEAD, e0 + BURST_TAIL))

    def _linked(times):
        return [t for t in times if t.tzinfo is not None and any(a <= t <= b for a, b in windows)] if windows else []

    linked = _linked(dump_times) + _linked(log_crashes)
    time_linked = bool(linked)
    overlap_window = bool(log_start and log_end and dump_times and
                          any(log_start - timedelta(minutes=5) <= t <= log_end + timedelta(minutes=5) for t in dump_times))
    if storms and dump_times and log_start and log_end:
        if time_linked:
            evidence.append(f"덤프·로그 크래시 {len(linked)}건이 PCIe 오류 폭주 구간 전후 10분 안에 있습니다 — 폭주와 크래시가 시간상 연결됩니다.")
            for hyp in ("gpu_link", "pcie_device"):
                if hyp in sc.score:
                    sc.add(hyp, 1.5, "time", "크래시 시각이 오류 폭주 구간과 겹침")
        elif not overlap_window:
            last_dump = max(dump_times)
            gap = log_start - last_dump
            rel = ("이후" if gap.total_seconds() > 0 else "이전")
            days = abs(gap.total_seconds()) / 86400
            evidence.append(
                f"이벤트 로그 기록({_fmt(log_start)} ~ {_fmt(log_end)})은 가장 늦은 덤프({_fmt(last_dump)})보다 약 {days:.1f}일 {rel}입니다. "
                "같은 슬롯의 링크 문제가 이후에도 지속된다는 근거이지, 각 크래시 직전에 오류 폭주가 있었다는 직접 근거는 아닙니다.")
            next_evidence.append("다음 크래시 직후 이벤트 로그(.evtx)를 다시 내보내 올려 주세요. 크래시 직전에 PCIe 오류가 폭주했는지 확인되면 원인을 확정 수준으로 좁힐 수 있습니다.")
        else:
            evidence.append("이벤트 로그 기간 안에 덤프 크래시가 있으나 PCIe 오류 폭주 구간과는 10분 이상 떨어져 있습니다.")
    if persistent:
        for hyp in ("gpu_link", "gpu_hw", "cpu_slot", "pcie_device", "power"):
            if sc.score.get(hyp):
                sc.add(hyp, 0.5, "time", "부팅 직후에도 크래시가 재현됨(누적형이 아닌 지속 조건형)")

    if evtx is None and display_n:
        next_evidence.append("이벤트 로그(.evtx)를 함께 올리면 PCIe 링크 오류 여부를 확인해 하드웨어 문제와 드라이버 문제를 가릴 수 있습니다.")
    if n == 1:
        next_evidence.append("같은 증상 때의 덤프를 3개 이상 올리면 반복되는 패턴을 더 신뢰할 수 있습니다.")
    if evtx and not n:
        next_evidence.append("같은 증상 때 생성된 덤프(.dmp)를 함께 올리면 크래시 종류까지 엮어 판단합니다.")

    # ── 순위·확신도 ──────────────────────────────────────────────────
    ranked = sorted(sc.score.items(), key=lambda kv: -kv[1])
    total = sum(v for _, v in ranked) or 1.0
    limitations = [
        "덤프는 헤더(버그체크 코드·매개변수)와 드라이버 목록만 읽었고, 호출 스택 기반의 원인 드라이버 분석(WinDbg !analyze)은 하지 않았습니다.",
        "이벤트 로그에 포함된 기간 밖의 상황은 알 수 없습니다.",
        "점수는 규칙 기반 추정치이며 부품 고장 확률이 아닙니다. 교차 테스트로 확인하세요.",
    ]

    if not ranked or ranked[0][1] < 1.0:
        return {
            "headline": "업로드한 자료만으로는 뚜렷한 원인 패턴이 확인되지 않았습니다.", "level": "info", "confidence": "낮음",
            "causes": [], "steps": ["같은 증상이 반복될 때 새로 생긴 덤프와 이벤트 로그를 함께 올려 비교하세요."],
            "evidence": evidence, "limitations": limitations, "guides": [], "nextEvidence": next_evidence,
            "timeline": _sorted_timeline(timeline), "scores": [], "timeLinked": time_linked,
            "context": {"dumpCount": n, "cpuCount": cpu_count, "hasEvtx": bool(evtx)},
        }

    top, top_score = ranked[0]
    share = top_score / total
    srcs = sc.sources[top]
    cross = ("dump" in srcs and "evtx" in srcs)
    if cross and share >= 0.3 and time_linked:
        confidence = "높음"
    elif (cross and share >= 0.3) or (share >= 0.4 and top_score >= 4.0):
        confidence = "중간"
    else:
        confidence = "낮음"
    # 같은 출처만으로는 '높음'을 주지 않는다.
    level = "critical" if (confidence == "높음" or top_score >= 6.0 and top in ("gpu_link", "cpu_hw", "pcie_device")) else ("warning" if top_score >= 2.5 else "info")

    def _like(s):
        r = s / total
        return "높음" if r >= 0.35 else ("중간" if r >= 0.15 else "낮음")

    causes = []
    for hyp, s in ranked[:5]:
        reasons = list(sc.reasons[hyp])
        if not reasons:
            reasons = ["관련 신호가 약하게 확인됨"]
        causes.append({"title": HYPOTHESES[hyp], "likelihood": _like(s), "reasons": reasons[:4]})

    # 확정 표현은 '높음', 또는 두 출처가 맞물리고 시각도 겹칠 때만 쓴다.
    idx = 0 if (confidence == "높음" or (confidence == "중간" and cross and time_linked)) else 1
    headline = HEADLINES[top][idx]
    if top == "gpu_link" and cross and not time_linked and dump_times and log_start:
        headline += " (로그 기록 시각이 크래시와 겹치지 않아 확정 수준은 아닙니다.)"

    steps = list(STEPS.get(top, []))
    seen = set(steps)
    for hyp, s in ranked[1:4]:
        if s / total >= 0.2 and STEPS.get(hyp):
            extra = STEPS[hyp][0]
            if extra not in seen:
                steps.append(f"[함께 확인 · {HYPOTHESES[hyp]}] {extra}")
                seen.add(extra)
    guides = []
    for hyp, _ in ranked[:3]:
        for g in GUIDES.get(hyp, []):
            if g not in guides:
                guides.append(g)

    return {
        "headline": headline, "level": level, "confidence": confidence,
        "causes": causes, "steps": steps, "evidence": evidence,
        "limitations": limitations, "guides": guides[:4], "nextEvidence": next_evidence,
        "timeline": _sorted_timeline(timeline),
        "scores": [{"key": h, "title": HYPOTHESES[h], "score": round(s, 1), "share": round(s / total * 100)} for h, s in ranked[:6]],
        "timeLinked": time_linked,
        "context": {"dumpCount": n, "cpuCount": cpu_count, "hasEvtx": bool(evtx)},
    }


def _sorted_timeline(items):
    def key(x):
        t = _dt(x["time"])
        return t.timestamp() if t else 0
    return sorted(items, key=key)
