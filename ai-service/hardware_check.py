"""수집 스크립트(collect-pc-logs.ps1)가 만든 hardware.json을 해석한다.

로그·덤프가 "무슨 일이 있었는지"를 알려준다면, 여기서는 "지금 하드웨어가 어떤 상태인지"를 본다.
GPU의 PCIe 링크 폭 저하나 디스크 건강 경고처럼 그 자체로 강한 사실은 종합 판단의 독립 근거로 쓰인다.
"""
from datetime import date, datetime
from typing import Optional

SCHEMA = "itsvc-collect-v1"
_GEN = {1: "Gen1", 2: "Gen2", 3: "Gen3", 4: "Gen4", 5: "Gen5", 6: "Gen6"}
_DDR = {26: "DDR4", 34: "DDR5", 24: "DDR3"}


def _int(v):
    return v if isinstance(v, int) and not isinstance(v, bool) else None


def _num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def _as_list(v):
    if v is None:
        return []
    return v if isinstance(v, list) else [v]


def _text(v, limit=80):
    return str(v)[:limit] if v is not None else ""


def analyze(hw: dict) -> dict:
    if not isinstance(hw, dict) or hw.get("schema") != SCHEMA:
        raise ValueError("itsvc 수집 스크립트가 만든 hardware.json이 아닙니다.")

    findings, signals, next_evidence = [], {}, []

    def add(level, title, detail):
        findings.append({"level": level, "title": title, "detail": detail})

    # ── 그래픽카드 PCIe 링크 ────────────────────────────────────────
    gpus = []
    for g in _as_list(hw.get("gpu")):
        if not isinstance(g, dict):
            continue
        name = _text(g.get("name"))
        link = g.get("link") if isinstance(g.get("link"), dict) else {}
        cw, mw = _int(link.get("currentWidth")), _int(link.get("maxWidth"))
        cs, ms = _int(link.get("currentSpeed")), _int(link.get("maxSpeed"))
        gpus.append(name)
        if cw and mw and cw < mw:
            signals["gpuLinkDegraded"] = True
            signals["gpuLinkText"] = f"x{cw}/x{mw}"
            add("critical", f"{name}: PCIe 링크 폭이 x{cw}로 협상됨(최대 x{mw})",
                "슬롯 접촉 불량·라이저 케이블·슬롯 배선 문제의 직접 증거입니다. 일부 그래픽카드는 유휴 때 폭을 줄이기도 하므로, "
                "게임·벤치마크 등 부하를 건 상태에서 GPU-Z의 Bus Interface를 다시 확인하세요.")
        elif cw and mw:
            signals["gpuLinkText"] = f"x{cw}/x{mw}"
        if cs and ms and cs < ms:
            add("info", f"{name}: 현재 링크 속도 {_GEN.get(cs, cs)} (최대 {_GEN.get(ms, ms)})",
                "유휴 상태의 절전으로 낮아지는 것이 정상입니다. 부하를 걸었는데도 낮으면 슬롯·케이블 문제일 수 있습니다.")

    # ── 디스크 ──────────────────────────────────────────────────────
    detail_seen = False
    for d in _as_list(hw.get("disks")):
        if not isinstance(d, dict):
            continue
        model = _text(d.get("model"))
        health, oper = _text(d.get("health")), _text(d.get("operational"))
        wear, temp = _num(d.get("wear")), _num(d.get("temperature"))
        re_u, we_u = _num(d.get("readErrorsUncorrected")), _num(d.get("writeErrorsUncorrected"))
        if wear is not None or temp is not None:
            detail_seen = True
        if health and health.lower() != "healthy":
            signals["diskFailing"] = True
            add("critical", f"{model}: 디스크 상태 '{health}'", "Windows가 이 디스크를 정상으로 보지 않습니다. 중요한 자료를 먼저 백업하세요.")
        elif oper and oper.lower() not in ("ok", ""):
            add("warning", f"{model}: 동작 상태 '{oper}'", "디스크 관리와 SMART 도구로 상태를 다시 확인하세요.")
        if (re_u or 0) > 0 or (we_u or 0) > 0:
            signals["diskFailing"] = True
            add("critical", f"{model}: 복구되지 않은 읽기/쓰기 오류 기록", "저장장치 불량 신호입니다. 백업 후 교체를 검토하세요.")
        if wear is not None and wear >= 90:
            signals["diskFailing"] = True
            add("warning", f"{model}: 마모율 {wear:g}%", "SSD 수명이 거의 소진됐습니다.")
        bus = _text(d.get("busType")).lower()
        media = _text(d.get("mediaType")).lower()
        if temp is not None and temp >= (55 if media == "hdd" else 70):
            add("warning", f"{model}: 온도 {temp:g}℃", "방열·통풍을 점검하세요(과열은 속도 저하·오류로 이어집니다).")
    if _as_list(hw.get("disks")) and not detail_seen:
        next_evidence.append("디스크 SMART 상세(마모율·온도·오류 수)를 읽지 못했습니다. 관리자 권한 PowerShell로 수집 스크립트를 다시 실행하세요.")

    # ── 메모리 ──────────────────────────────────────────────────────
    mem = [m for m in _as_list(hw.get("memory")) if isinstance(m, dict)]
    if mem:
        caps = [_int(m.get("capacityGB")) or 0 for m in mem]
        signals["ramTotalGB"] = sum(caps)
        if len(set(caps)) > 1:
            signals["mixedDimms"] = True
            add("info", "용량이 다른 메모리 모듈이 섞여 있음", f"모듈 구성: {' + '.join(f'{c}GB' for c in caps)}. 듀얼채널·호환성 문제가 생길 수 있어 메모리 오류가 의심되면 같은 규격 모듈로 교차 테스트하세요.")
        for m in mem[:1]:
            cfg, rated = _int(m.get("configuredSpeed")), _int(m.get("speed"))
            ddr = _DDR.get(_int(m.get("smbiosType")))
            if cfg and ddr == "DDR4" and cfg > 3200 or cfg and ddr == "DDR5" and cfg > 5600:
                signals["xmpLikely"] = True
                add("info", f"메모리가 {ddr}-{cfg}로 동작 중(XMP/EXPO 프로파일일 가능성)", "메모리 관련 오류가 의심되면 BIOS에서 프로파일을 끄고 기본 클럭으로 재현 여부를 확인하세요.")
            if cfg and rated and cfg < rated:
                add("info", f"메모리가 정격({rated})보다 낮은 {cfg}로 동작 중", "XMP/EXPO가 꺼져 있거나 모듈 혼용으로 낮춰졌을 수 있습니다.")

    # ── 덤프·전원 설정 ──────────────────────────────────────────────
    cc = hw.get("crashControl") if isinstance(hw.get("crashControl"), dict) else {}
    if _int(cc.get("dumpType")) == 0:
        signals["dumpDisabled"] = True
        add("warning", "블루스크린 덤프 생성이 꺼져 있음", "다음 크래시부터 원인 분석 자료가 남지 않습니다. 시작 및 복구에서 '작은 메모리 덤프' 이상으로 켜세요.")
        next_evidence.append("덤프 생성이 꺼져 있습니다. 시작 및 복구 설정에서 켠 뒤 다음 증상 때 다시 수집하세요.")
    if _int(cc.get("autoReboot")) == 1 and _int(cc.get("minidumpCount")) == 0:
        add("info", "자동 재시작이 켜져 있고 저장된 미니덤프가 없음", "블루스크린 없이 꺼지는 증상이라면 전원·과열 쪽을, 블루스크린이 났는데 덤프가 없다면 덤프 설정·저장 공간을 확인하세요.")

    power = hw.get("power") if isinstance(hw.get("power"), dict) else {}
    aspm = _int(power.get("aspmAC"))
    if aspm in (1, 2):
        signals["aspmOn"] = True
        add("info", "PCIe 링크 상태 전원 관리(ASPM)가 켜져 있음", "그래픽 출력이 끊기는 증상이 있다면 이 설정을 '해제'로 바꿔 재현 여부를 확인하세요.")
    if _int(power.get("fastStartup")) == 1:
        add("info", "빠른 시작(Fast Startup)이 켜져 있음", "재부팅이 아닌 종료 후 켰을 때만 증상이 나타난다면 빠른 시작을 끄고 확인하세요.")

    bios = hw.get("bios") if isinstance(hw.get("bios"), dict) else {}
    bdate = None
    try:
        bdate = datetime.strptime(str(bios.get("date")), "%Y-%m-%d").date() if bios.get("date") else None
    except ValueError:
        bdate = None
    coll = None
    try:
        coll = datetime.fromisoformat(str(hw.get("collectedAt", "")).replace("Z", "+00:00")).date()
    except ValueError:
        coll = date.today()
    if bdate:
        age = (coll - bdate).days / 365.25
        signals["biosAgeYears"] = round(age, 1)
        if age >= 2:
            add("info", f"BIOS가 {age:.1f}년 전 버전({bios.get('version')}, {bios.get('date')})", "PCIe·메모리 호환성 패치가 나왔을 수 있습니다. 제조사 최신 BIOS를 확인하세요.")

    # 요약(보고서용)
    cpu = _as_list(hw.get("cpu"))
    os_ = hw.get("os") if isinstance(hw.get("os"), dict) else {}
    board = hw.get("board") if isinstance(hw.get("board"), dict) else {}
    summary = {
        "os": f"{_text(os_.get('caption'))} (빌드 {_text(os_.get('build'))})".strip(),
        "cpu": _text(cpu[0].get("name")) if cpu and isinstance(cpu[0], dict) else "",
        "gpu": gpus,
        "ram": (f"{sum(_int(m.get('capacityGB')) or 0 for m in mem)}GB (" + " + ".join(f"{_int(m.get('capacityGB'))}GB" for m in mem) + ")") if mem else "",
        "board": f"{_text(board.get('manufacturer'))} {_text(board.get('product'))}".strip(),
        "bios": f"{_text(bios.get('version'))} ({_text(bios.get('date'))})" if bios else "",
        "uptimeHours": _num(os_.get("uptimeHours")),
        "disks": [f"{_text(d.get('model'))} {_int(d.get('sizeGB'))}GB {_text(d.get('busType'))}" for d in _as_list(hw.get("disks")) if isinstance(d, dict)],
    }
    order = {"critical": 0, "warning": 1, "info": 2}
    findings.sort(key=lambda f: order.get(f["level"], 3))
    return {"summary": summary, "findings": findings, "signals": signals, "nextEvidence": next_evidence,
            "notes": [str(n)[:200] for n in _as_list(hw.get("notes"))][:10], "isAdmin": bool(hw.get("isAdmin"))}
