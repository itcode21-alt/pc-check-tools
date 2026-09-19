"""이벤트 로그(.evtx) 분석: 이벤트 집계, WHEA(PCIe) 오류 폭주 탐지, 주요 이벤트 정리.

결과에는 컴퓨터 이름·사용자 이름 같은 식별 정보를 담지 않는다(집계값만 반환).
"""
import re
from collections import Counter
from datetime import timedelta

import evtx_reader

WHEA = "microsoft-windows-whea-logger"

# (제공자 소문자, 이벤트 ID) -> (설명, 심각도, 사이트 상세 페이지)
KNOWN_EVENTS = {
    ("microsoft-windows-kernel-power", 41): ("예기치 않은 재부팅·전원 끊김(Kernel-Power 41)", "critical", "event-kernel-power-41.html"),
    ("eventlog", 6008): ("이전 시스템 종료가 예기치 않게 이루어짐(EventLog 6008)", "warning", "event-eventlog-6008.html"),
    ("microsoft-windows-wer-systemerrorreporting", 1001): ("블루스크린 발생 기록(BugCheck 1001)", "critical", "event-bugcheck-1001.html"),
    ("display", 4101): ("디스플레이 드라이버 응답 없음 후 복구(Display 4101)", "warning", "event-display-4101.html"),
    ("nvlddmkm", 153): ("NVIDIA 그래픽 드라이버 오류(nvlddmkm 153)", "warning", "event-nvlddmkm-153.html"),
    ("disk", 7): ("디스크 불량 블록 오류(Disk 7)", "critical", "event-disk-7.html"),
    ("disk", 11): ("디스크 컨트롤러 오류(Disk 11)", "critical", "event-disk-11.html"),
    ("disk", 51): ("디스크 페이징 I/O 오류(Disk 51)", "warning", "event-disk-51.html"),
    ("disk", 153): ("디스크 I/O 재시도(Disk 153)", "warning", "event-disk-153.html"),
    ("ntfs", 55): ("NTFS 파일 시스템 구조 손상(Ntfs 55)", "critical", "event-ntfs-55.html"),
    ("ntfs", 98): ("NTFS 볼륨 상태 점검(Ntfs 98)", "info", "event-ntfs-140.html"),
    ("ntfs", 140): ("NTFS 쓰기 실패(Ntfs 140)", "warning", "event-ntfs-140.html"),
    ("volmgr", 162): ("덤프 파일 생성 실패(Volmgr 162)", "warning", "event-volmgr-162.html"),
    ("storahci", 129): ("SATA 컨트롤러 재설정(storahci 129)", "warning", "event-storahci-129.html"),
    ("microsoft-windows-whea-logger", 17): ("수정된 PCIe 오류(WHEA-Logger 17)", "warning", "event-whea-logger-17.html"),
    ("microsoft-windows-whea-logger", 18): ("치명적 하드웨어 오류(WHEA-Logger 18)", "critical", "event-whea-logger-18.html"),
    ("microsoft-windows-whea-logger", 19): ("수정된 하드웨어 오류(WHEA-Logger 19)", "warning", "event-whea-logger-19.html"),
    ("microsoft-windows-whea-logger", 20): ("치명적 하드웨어 오류(WHEA-Logger 20)", "critical", "event-whea-logger-20.html"),
    ("microsoft-windows-whea-logger", 46): ("메모리 계층 오류(WHEA-Logger 46)", "critical", "event-whea-logger-46.html"),
    ("microsoft-windows-whea-logger", 47): ("메모리 수정 오류(WHEA-Logger 47)", "warning", "event-whea-logger-47.html"),
    ("application error", 1000): ("프로그램 비정상 종료(Application Error 1000)", "info", "event-application-error-1000.html"),
}

# 판단 엔진이 쓰는 범주(제공자 소문자, ID) -> 범주. 제공자 전체를 범주로 묶는 규칙은 PROVIDER_CATEGORY.
EVENT_CATEGORY = {
    ("disk", 7): "storage", ("disk", 11): "storage", ("disk", 51): "storage", ("disk", 153): "storage",
    ("disk", 154): "storage", ("ntfs", 55): "storage", ("ntfs", 98): "storage", ("ntfs", 140): "storage",
    ("storahci", 129): "storage", ("stornvme", 129): "storage", ("volmgr", 161): "storage",
    ("display", 4101): "display",
    ("microsoft-windows-whea-logger", 46): "memory", ("microsoft-windows-whea-logger", 47): "memory",
    ("microsoft-windows-whea-logger", 18): "cpu_hw", ("microsoft-windows-whea-logger", 19): "cpu_hw",
    ("microsoft-windows-whea-logger", 20): "cpu_hw",
    ("microsoft-windows-kernel-power", 41): "power", ("eventlog", 6008): "power",
}
PROVIDER_CATEGORY = {"nvlddmkm": "display", "amdkmdag": "display", "amdkmdap": "display", "atikmpag": "display"}

# PCIe AER 비트 이름
CORRECTABLE_BITS = {
    0: "Receiver Error(수신 오류)",
    6: "Bad TLP(잘못된 패킷)",
    7: "Bad DLLP(잘못된 링크 계층 패킷)",
    8: "REPLAY_NUM Rollover(재전송 횟수 초과)",
    12: "Replay Timer Timeout(재전송 타임아웃)",
    13: "Advisory Non-Fatal Error",
    14: "Corrected Internal Error",
    15: "Header Log Overflow",
}
UNCORRECTABLE_BITS = {
    4: "Data Link Protocol Error",
    5: "Surprise Down",
    12: "Poisoned TLP",
    13: "Flow Control Protocol Error",
    14: "Completion Timeout",
    15: "Completer Abort",
    16: "Unexpected Completion",
    17: "Receiver Overflow",
    18: "Malformed TLP",
    19: "ECRC Error",
    20: "Unsupported Request",
    21: "ACS Violation",
    22: "Uncorrectable Internal Error",
}
# 링크 신호 품질(물리·데이터 링크 계층) 문제를 뜻하는 수정 가능 오류 비트
LINK_QUALITY_BITS = {0, 6, 7, 8, 12}

VENDORS = {
    0x8086: "Intel", 0x1022: "AMD", 0x1002: "AMD(ATI)", 0x10DE: "NVIDIA", 0x10EC: "Realtek",
    0x144D: "Samsung", 0x15B7: "SanDisk/WD", 0x1987: "Phison", 0xC0A9: "Micron/Crucial",
    0x1C5C: "SK hynix", 0x1E0F: "KIOXIA", 0x14C3: "MediaTek", 0x8087: "Intel",
}

_BUGCHECK_RE = re.compile(r"0x([0-9a-fA-F]{8})\s*\(")


def _pcie_role(vendor: int, bus: int, dev: int, fn: int):
    """루트 포트의 (Bus:Device:Function)으로 슬롯 종류를 추정한다."""
    if bus != 0:
        return "endpoint", f"PCIe 장치(Bus {bus}) — 슬롯에 꽂힌 장치 자체의 링크 오류"
    if vendor == 0x8086:
        if dev == 1:
            return "cpu-x16", "CPU 직결 PCIe x16 슬롯(주로 그래픽카드)"
        if dev == 6:
            return "cpu-m2", "CPU 직결 M.2/PCIe x4 슬롯"
        if dev in (0x1B, 0x1C, 0x1D):
            return "chipset", "칩셋(PCH) 연결 PCIe 슬롯·M.2"
    if vendor == 0x1022:
        if dev == 1 and fn == 1:
            return "cpu-x16", "CPU 직결 PCIe x16 슬롯(주로 그래픽카드)"
        if dev == 1 and fn == 2:
            return "cpu-m2", "CPU 직결 M.2/PCIe 슬롯"
    return "other", "PCIe 루트 포트"


def _int(v, default=0):
    """손상된 레코드에서 숫자 필드가 문자열 등으로 디코딩돼도 안전하게 정수로 바꾼다."""
    return v if isinstance(v, int) and not isinstance(v, bool) else default


def _bits(value: int, table: dict):
    return [b for b in table if value & (1 << b)]


def _minute(dt):
    return dt.replace(second=0, microsecond=0)


def _bursts(minute_counts: Counter, gap_minutes: int = 2, top: int = 5):
    if not minute_counts:
        return []
    mins = sorted(minute_counts)
    groups, cur = [], [mins[0]]
    for m in mins[1:]:
        if m - cur[-1] <= timedelta(minutes=gap_minutes):
            cur.append(m)
        else:
            groups.append(cur)
            cur = [m]
    groups.append(cur)
    out = [{"start": g[0].isoformat(), "end": (g[-1] + timedelta(minutes=1)).isoformat(),
            "count": sum(minute_counts[m] for m in g)} for g in groups]
    out.sort(key=lambda b: -b["count"])
    return out[:top]


def _want(provider: str, event_id: int) -> bool:
    p = provider.lower()
    return (p == WHEA
            or (p == "microsoft-windows-wer-systemerrorreporting" and event_id == 1001)
            or (p == "microsoft-windows-kernel-power" and event_id == 41))


def analyze(data: bytes) -> dict:
    stats: dict = {}
    counts: Counter = Counter()
    levels: Counter = Counter()
    first = last = None
    total = 0

    category_counts: Counter = Counter()
    whea_by_id: Counter = Counter()
    devices: dict = {}
    bugchecks: list = []
    kp41: list = []

    for r in evtx_reader.iter_records(data, want_data=_want, stats=stats):
        total += 1
        prov = r.provider.lower()
        counts[(prov, r.event_id, r.provider)] += 1
        cat = EVENT_CATEGORY.get((prov, r.event_id)) or PROVIDER_CATEGORY.get(prov)
        if cat:
            category_counts[cat] += 1
        if r.level is not None:
            levels[r.level] += 1
        if r.time is not None:
            first = r.time if first is None or r.time < first else first
            last = r.time if last is None or r.time > last else last

        if prov == WHEA and r.data:
            whea_by_id[r.event_id] += 1
            d = r.data
            vendor = d.get("VendorID")
            if isinstance(vendor, int) and not isinstance(vendor, bool):
                key = (vendor, _int(d.get("DeviceID"), None), _int(d.get("Bus")), _int(d.get("Device")),
                       _int(d.get("Function")), r.event_id)
                dev = devices.get(key)
                if dev is None:
                    dev = devices[key] = {"count": 0, "corr": Counter(), "uncorr": Counter(), "first": r.time, "last": r.time,
                                          "minutes": Counter(), "raw_status": Counter()}
                dev["count"] += 1
                if r.time:
                    dev["first"] = r.time if dev["first"] is None else min(dev["first"], r.time)
                    dev["last"] = r.time if dev["last"] is None else max(dev["last"], r.time)
                    dev["minutes"][_minute(r.time)] += 1
                cs = d.get("CorrectableErrorStatus") or 0
                us = d.get("UncorrectableErrorStatus") or 0
                if isinstance(cs, int):
                    for b in _bits(cs, CORRECTABLE_BITS):
                        dev["corr"][b] += 1
                if isinstance(us, int):
                    for b in _bits(us, UNCORRECTABLE_BITS):
                        dev["uncorr"][b] += 1
        elif prov == "microsoft-windows-wer-systemerrorreporting" and r.event_id == 1001 and r.data:
            for v in r.data.values():
                m = _BUGCHECK_RE.search(v) if isinstance(v, str) else None
                if m:
                    bugchecks.append({"time": r.time.isoformat() if r.time else None, "code": "0x" + m.group(1).upper().lstrip("0").rjust(1, "0")})
                    break
        elif prov == "microsoft-windows-kernel-power" and r.event_id == 41 and r.data:
            code = r.data.get("BugcheckCode")
            kp41.append({"time": r.time.isoformat() if r.time else None,
                         "bugcheckCode": hex(code) if isinstance(code, int) and code else None})

    # ── 이벤트 집계 ──
    top_events = []
    for (prov, eid, display), n in counts.most_common(12):
        info = KNOWN_EVENTS.get((prov, eid))
        top_events.append({"provider": display, "id": eid, "count": n,
                           "label": info[0] if info else None, "detailPage": info[2] if info else None})
    notable = []
    for (prov, eid, display), n in counts.items():
        info = KNOWN_EVENTS.get((prov, eid))
        if info:
            notable.append({"provider": display, "id": eid, "count": n, "label": info[0],
                            "severity": info[1], "detailPage": info[2]})
    order = {"critical": 0, "warning": 1, "info": 2}
    notable.sort(key=lambda e: (order[e["severity"]], -e["count"]))
    # nvlddmkm 같은 제공자는 ID와 무관하게 GPU 드라이버 오류로 따로 표시
    for (prov, eid, display), n in counts.items():
        if prov == "nvlddmkm" and (prov, eid) not in KNOWN_EVENTS:
            notable.append({"provider": display, "id": eid, "count": n, "label": "NVIDIA 그래픽 드라이버 이벤트(nvlddmkm)",
                            "severity": "warning", "detailPage": "event-nvlddmkm-153.html"})

    # ── WHEA 장치별 요약 ──
    whea_devices = []
    for (vendor, device_id, bus, dev_no, fn, eid), dev in devices.items():
        kind, role = _pcie_role(vendor, bus or 0, dev_no or 0, fn or 0)
        minutes = dev["minutes"]
        peak_min, peak = (max(minutes.items(), key=lambda kv: kv[1]) if minutes else (None, 0))
        link_hits = sum(n for b, n in dev["corr"].items() if b in LINK_QUALITY_BITS)
        span_min = max(1.0, ((dev["last"] - dev["first"]).total_seconds() / 60.0)) if dev["first"] and dev["last"] else 1.0
        whea_devices.append({
            "eventId": eid,
            "vendorId": hex(vendor), "vendorName": VENDORS.get(vendor, "알 수 없음"),
            "deviceId": hex(device_id) if isinstance(device_id, int) else None,
            "bdf": f"{(bus or 0):02x}:{(dev_no or 0):02x}.{(fn or 0)}",
            "roleKind": kind, "role": role,
            "count": dev["count"],
            "first": dev["first"].isoformat() if dev["first"] else None,
            "last": dev["last"].isoformat() if dev["last"] else None,
            "perMinuteAvg": round(dev["count"] / span_min, 1),
            "peakPerMinute": peak, "peakMinute": peak_min.isoformat() if peak_min else None,
            "correctable": [{"bit": b, "name": CORRECTABLE_BITS[b], "count": n} for b, n in dev["corr"].most_common()],
            "uncorrectable": [{"bit": b, "name": UNCORRECTABLE_BITS[b], "count": n} for b, n in dev["uncorr"].most_common()],
            "linkQualityHits": link_hits,
            "bursts": _bursts(minutes),
        })
    whea_devices.sort(key=lambda x: -x["count"])

    # ── 이벤트 로그 단독으로 말할 수 있는 관찰 ──
    findings = []
    for w in whea_devices:
        if w["eventId"] == 17 and w["count"] >= 100:
            findings.append({
                "level": "critical" if w["count"] >= 1000 else "warning",
                "title": f"PCIe 링크 오류 폭주 — {w['role']} ({w['bdf']})",
                "detail": (f"수정된 PCIe 오류(WHEA-Logger 17)가 {w['count']:,}건 기록됐습니다"
                           f"(평균 분당 {w['perMinuteAvg']}건, 최고 분당 {w['peakPerMinute']}건). "
                           "수정된 오류라 시스템은 계속 동작하지만, 링크 신호가 불안정하다는 뜻입니다."),
            })
        elif w["eventId"] in (18, 20) or w["uncorrectable"]:
            findings.append({"level": "critical", "title": f"치명적/수정 불가 하드웨어 오류 — {w['role']} ({w['bdf']})",
                             "detail": f"WHEA-Logger {w['eventId']} 이벤트가 {w['count']}건 기록됐습니다. 하드웨어 자체 점검이 필요한 수준입니다."})
    for e in notable:
        if e["severity"] == "critical" and e["provider"].lower() != WHEA:
            findings.append({"level": "critical", "title": f"{e['label']} {e['count']}건", "detail": "이벤트 뷰어에서 발생 시각을 확인하세요.",
                             "detailPage": e["detailPage"]})

    return {
        "totalEvents": total,
        "skippedRecords": stats.get("skipped", 0),
        "truncated": bool(stats.get("truncated")),
        "timeRange": {"start": first.isoformat() if first else None, "end": last.isoformat() if last else None},
        "levelCounts": {str(k): v for k, v in sorted(levels.items())},
        "topEvents": top_events,
        "notable": notable[:15],
        "categoryCounts": dict(category_counts),
        "wheaTotal": sum(whea_by_id.values()),
        "wheaById": {str(k): v for k, v in sorted(whea_by_id.items())},
        "wheaDevices": whea_devices[:8],
        "bugchecks": bugchecks[:20],
        "kernelPower41": kp41[:20],
        "findings": findings,
    }
