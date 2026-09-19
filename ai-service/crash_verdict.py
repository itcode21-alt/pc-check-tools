"""덤프(.dmp) 분석 결과와 이벤트 로그(.evtx) 분석 결과를 엮어 종합 판단을 만든다.

규칙 기반이다. 단일 신호로 부품을 확정하지 않고, 서로 다른 출처의 신호가 겹칠 때만
"유력"이라고 표현한다. 판단의 근거(evidence)와 한계(limitations)를 항상 함께 돌려준다.
"""
from collections import Counter
from typing import Optional

DISPLAY_CODES = {0x116, 0x117, 0x119, 0x113}

GPU_LINK_STEPS = [
    "BIOS에서 그래픽카드 슬롯(PCIe x16)의 링크 속도를 Auto에서 한 단계 낮은 세대(예: Gen5 → Gen4, 안 되면 Gen3)로 고정한 뒤 오류가 줄어드는지 확인합니다. 줄어들면 신호 품질 문제로 좁혀집니다.",
    "그래픽카드를 슬롯에서 뽑아 금색 접점을 닦고 다시 끝까지 꽂습니다. 수직 장착용 라이저 케이블을 쓰고 있다면 빼고 메인보드 슬롯에 직결해 다시 확인합니다.",
    "메인보드 BIOS를 최신 버전으로 올립니다(CPU 마이크로코드·PCIe 호환성 패치 포함).",
    "가능하면 다른 그래픽카드로, 또는 이 그래픽카드를 다른 PC에 꽂아 같은 오류가 나는지 교차 테스트합니다. 카드를 바꿔도 같은 슬롯에서 오류가 계속되면 CPU·메인보드 쪽, 카드가 바뀌면 그래픽카드 쪽입니다.",
    "위 방법으로도 오류가 남으면 판매처·제조사 A/S를 받으세요. 결과 화면을 텍스트로 저장해 함께 전달하면 증상 설명에 도움이 됩니다.",
]
DRIVER_STEPS = [
    "DDU로 기존 그래픽 드라이버를 완전히 제거한 뒤 제조사 최신 드라이버를 새로 설치합니다.",
    "HDMI/DP 케이블과 모니터 포트를 바꿔 보고, 전원 옵션의 'PCI Express 링크 상태 전원 관리'를 끕니다.",
    "이벤트 뷰어의 WHEA-Logger 이벤트가 같은 시각에 남아 있는지 확인합니다(있으면 하드웨어 쪽으로 무게가 실립니다).",
    "GPU 온도와 VRAM 사용량을 모니터링하면서 같은 작업을 재현해 봅니다.",
]


def _code(d: dict):
    try:
        return int(str(d.get("stopCode", "")), 16)
    except ValueError:
        return None


def build(dumps: list, evtx: Optional[dict]) -> dict:
    n = len(dumps)
    codes = Counter()
    for d in dumps:
        c = _code(d)
        if c is not None:
            codes[c] += 1
    display_n = sum(v for c, v in codes.items() if c in DISPLAY_CODES)
    dpc_n = codes.get(0x133, 0)
    whea_fatal_dumps = codes.get(0x124, 0)
    gpu_vendors = sorted({v for d in dumps for v in (d.get("gpuDrivers") or [])})
    cpu_count = next((d.get("cpuCount") for d in dumps if d.get("cpuCount")), None)

    storms, gpu_storms, fatal = [], [], []
    if evtx:
        for w in evtx.get("wheaDevices", []):
            if w.get("eventId") == 17 and w.get("count", 0) >= 100:
                storms.append(w)
                if w.get("roleKind") == "cpu-x16":
                    gpu_storms.append(w)
            if w.get("eventId") in (18, 20) or w.get("uncorrectable"):
                fatal.append(w)

    evidence, limitations = [], [
        "덤프는 헤더(버그체크 코드·매개변수)만 읽었고, 호출 스택 기반의 원인 드라이버 분석(WinDbg !analyze)은 하지 않았습니다.",
        "이벤트 로그에 포함된 기간 밖의 상황은 알 수 없습니다.",
        "규칙 기반 추정이라 부품 고장을 확정하지는 않습니다. 교차 테스트로 확인하세요.",
    ]

    if n:
        parts = ", ".join(f"0x{c:X} {v}건" for c, v in codes.most_common())
        evidence.append(f"덤프 {n}개의 버그체크: {parts}")
    if display_n:
        evidence.append(f"그래픽 관련 버그체크(0x116 계열)가 덤프 {n}개 중 {display_n}개 — 그래픽 드라이버가 응답하지 못했고 TDR 복구도 실패했습니다.")
    if gpu_vendors:
        evidence.append(f"덤프에서 확인된 그래픽 드라이버: {', '.join(gpu_vendors)}")
    if dpc_n:
        evidence.append(f"DPC 감시자 위반(0x133) {dpc_n}건 — 드라이버 처리 지연이 누적된 경우입니다.")
    for w in storms:
        bits = ", ".join(f"{b['name']} {b['count']:,}건" for b in w["correctable"][:4])
        evidence.append(f"이벤트 로그: {w['role']}({w['bdf']})에서 수정된 PCIe 오류 {w['count']:,}건, 최고 분당 {w['peakPerMinute']}건. 내역: {bits}")

    causes, steps, guides = [], [], []
    headline, confidence, level = "", "낮음", "info"

    if gpu_storms and display_n:
        level = "critical"
        confidence = "높음" if display_n >= 2 else "중간"
        headline = "그래픽카드가 꽂힌 CPU 직결 PCIe 슬롯의 링크 불안정이 화면 신호 끊김(TDR 실패)의 유력한 원인입니다."
        causes = [
            {"title": "그래픽카드 슬롯 접촉·라이저 케이블·PCIe 신호 품질", "likelihood": "높음",
             "reasons": ["같은 슬롯에서 수신 오류·재전송 오류가 대량으로 반복됨(링크 신호 품질 문제의 전형적인 패턴)",
                         "그래픽 TDR 실패 덤프가 같은 기간에 반복됨"]},
            {"title": "그래픽카드 자체 결함", "likelihood": "중간",
             "reasons": ["링크 오류는 카드 쪽 송수신부 문제로도 생길 수 있어 교차 테스트가 필요합니다."]},
            {"title": "CPU의 PCIe 컨트롤러·메인보드 슬롯", "likelihood": "중간",
             "reasons": ["이 슬롯은 칩셋이 아니라 CPU에 직결돼 있어 CPU나 슬롯 쪽 문제일 수도 있습니다."]},
            {"title": "그래픽 드라이버", "likelihood": "낮음",
             "reasons": ["링크 오류가 먼저 발생하고 있어 드라이버 재설치만으로는 근본 해결이 어려울 가능성이 큽니다."]},
        ]
        steps = GPU_LINK_STEPS
        guides = [["그래픽 드라이버 응답 없음·신호없음 가이드", "windows-display-driver-crash.html"],
                  ["WHEA-Logger 17 (PCIe 수정된 오류)", "event-whea-logger-17.html"],
                  ["VIDEO_TDR_FAILURE (0x116)", "error-code-0x00000116.html"]]
        if dpc_n:
            evidence.append("0x133(DPC 지연)은 링크 정체로 드라이버 처리가 밀리면서 나타나는 이차 증상일 수 있습니다(확정 아님).")
    elif gpu_storms:
        level = "warning"
        confidence = "중간"
        headline = "그래픽카드 슬롯의 PCIe 링크 오류가 대량으로 발생하고 있습니다. 아직 크래시가 없더라도 링크가 불안정한 상태입니다."
        causes = [
            {"title": "그래픽카드 슬롯 접촉·라이저 케이블·PCIe 신호 품질", "likelihood": "높음",
             "reasons": ["같은 슬롯에서 링크 품질 오류가 반복됨"]},
            {"title": "그래픽카드·CPU PCIe 컨트롤러·메인보드 슬롯", "likelihood": "중간", "reasons": ["교차 테스트로 구분해야 합니다."]},
        ]
        steps = GPU_LINK_STEPS
        guides = [["WHEA-Logger 17 (PCIe 수정된 오류)", "event-whea-logger-17.html"]]
    elif storms:
        level = "warning"
        confidence = "중간"
        headline = "PCIe 링크 오류가 대량으로 기록됐습니다. 오류가 난 장치(슬롯)를 확인하세요."
        causes = [{"title": "해당 PCIe 장치(SSD·확장 카드 등)의 접촉·링크 품질", "likelihood": "중간",
                   "reasons": [f"{w['role']}({w['bdf']})에서 수정된 오류 {w['count']:,}건" for w in storms[:2]]}]
        steps = ["오류가 난 장치를 다시 장착하고 접점을 확인합니다.", "BIOS·칩셋 드라이버를 최신으로 올립니다.", "다른 슬롯으로 옮겨 오류가 따라가는지 확인합니다."]
        guides = [["WHEA-Logger 17 (PCIe 수정된 오류)", "event-whea-logger-17.html"]]
    elif fatal or whea_fatal_dumps:
        level = "critical"
        confidence = "중간"
        headline = "치명적 하드웨어 오류 기록이 있습니다. CPU·메모리·PCIe 장치 하드웨어 점검이 필요합니다."
        causes = [{"title": "CPU·메모리·메인보드 하드웨어 결함", "likelihood": "중간", "reasons": ["WHEA 치명적 오류 기록 또는 0x124 덤프"]}]
        steps = ["오버클럭·XMP 설정을 끄고 재현 여부를 확인합니다.", "MemTest86으로 메모리를 검사합니다.", "온도와 전원 공급을 점검하고 A/S를 검토합니다."]
        guides = [["WHEA_UNCORRECTABLE_ERROR (0x124)", "error-code-0x00000124.html"], ["WHEA-Logger 18", "event-whea-logger-18.html"]]
    elif display_n:
        level = "warning"
        confidence = "중간" if display_n >= 2 else "낮음"
        headline = "그래픽 드라이버 응답 실패(TDR)가 반복되고 있습니다. 이벤트 로그가 없어 하드웨어 링크 문제 여부는 판단하지 못했습니다."
        causes = [
            {"title": "그래픽 드라이버 오류·충돌", "likelihood": "중간", "reasons": ["0x116 계열 덤프가 반복됨"]},
            {"title": "케이블·PCIe 절전 설정·발열·전원", "likelihood": "중간", "reasons": ["출력이 끊기는 경우 흔한 원인"]},
            {"title": "그래픽카드 자체 결함", "likelihood": "낮음", "reasons": ["위 항목을 모두 배제한 뒤 의심"]},
        ]
        steps = DRIVER_STEPS + ["이벤트 로그(.evtx)를 함께 올리면 PCIe 링크 오류 여부를 확인해 더 정확히 좁힐 수 있습니다."]
        guides = [["그래픽 드라이버 응답 없음·신호없음 가이드", "windows-display-driver-crash.html"],
                  ["VIDEO_TDR_FAILURE (0x116)", "error-code-0x00000116.html"]]
    elif n and len(codes) >= 3:
        level = "warning"
        confidence = "낮음"
        headline = "덤프의 버그체크 코드가 매번 다릅니다. 특정 드라이버보다 메모리·전원·발열 같은 전체 안정성 문제를 먼저 의심하세요."
        causes = [{"title": "메모리(RAM)·전원·발열", "likelihood": "중간", "reasons": ["서로 다른 코드가 반복됨"]}]
        steps = ["MemTest86으로 메모리를 검사합니다.", "오버클럭·XMP를 끄고 재현 여부를 확인합니다.", "파워 용량과 온도를 점검합니다."]
        guides = [["메모리 검사 가이드", "memory-test-guide.html"]]
    else:
        headline = "업로드한 자료만으로는 뚜렷한 원인 패턴이 확인되지 않았습니다."
        steps = ["같은 증상이 반복될 때 새로 생긴 덤프와 이벤트 로그를 함께 올려 비교하세요."]

    return {
        "headline": headline, "level": level, "confidence": confidence,
        "causes": causes, "steps": steps, "evidence": evidence,
        "limitations": limitations, "guides": guides,
        "context": {"dumpCount": n, "cpuCount": cpu_count, "hasEvtx": bool(evtx)},
    }
