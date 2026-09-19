"""예기치 않은 종료(Kernel-Power 41 / EventLog 6008)를 부팅 시점·직전 기록과 함께 재구성한다.

Kernel-Power 41은 "종료된 순간"이 아니라 그 다음 부팅 때 기록된다. 그래서 실제 종료 시각은
'그 부팅 직전에 남은 마지막 이벤트 시각'으로 추정하고, 그 시각 이전 10분 동안 어떤 종류의
기록(PCIe 오류, 그래픽 드라이버, 디스크, 열 제한 등)이 있었는지를 종료마다 대조한다.
같은 전조가 종료마다 반복되는지가 원인 판단에서 가장 강한 시간 근거가 된다.
"""
from bisect import bisect_left, bisect_right
from collections import Counter
from datetime import timedelta, timezone
from statistics import median, pstdev

PRECURSOR_WINDOW = timedelta(minutes=10)
BOOT_LOOKBACK = timedelta(minutes=30)
DEDUPE_WINDOW = timedelta(minutes=15)
_KST = timezone(timedelta(hours=9))


def derive(unexpected, boots, all_times, precursors):
    """종료 목록을 만든다.

    unexpected: [{"t": datetime, "code": int|None, "power_button": bool, "source": "kp41"|"6008"}]
    boots: 부팅 시작 마커 시각들, all_times: 모든 이벤트 시각, precursors: [(시각, 범주)]
    """
    boots = sorted(boots)
    all_times = sorted(all_times)
    precursors = sorted(precursors, key=lambda p: p[0])
    pt = [p[0] for p in precursors]

    merged = []
    for u in sorted(unexpected, key=lambda x: x["t"]):
        if merged and (u["t"] - merged[-1]["t"]) <= DEDUPE_WINDOW:
            if merged[-1]["source"] != "kp41" and u["source"] == "kp41":
                merged[-1] = u
            continue
        merged.append(u)

    out = []
    for u in merged:
        b_idx = bisect_right(boots, u["t"]) - 1
        boot = boots[b_idx] if b_idx >= 0 and u["t"] - boots[b_idx] <= BOOT_LOOKBACK else None
        crash = None
        if boot is not None:
            i = bisect_left(all_times, boot - timedelta(seconds=1)) - 1
            crash = all_times[i] if i >= 0 else None
        ref = crash if crash is not None else u["t"] - timedelta(minutes=2)

        uptime = None
        if crash is not None:
            j = bisect_right(boots, crash) - 1
            if j >= 0:
                d = crash - boots[j]
                if timedelta(0) <= d <= timedelta(days=30):
                    uptime = round(d.total_seconds() / 60.0, 1)

        lo = bisect_right(pt, ref - PRECURSOR_WINDOW)
        hi = bisect_right(pt, ref + timedelta(seconds=60))
        pre = Counter(c for _t, c in precursors[lo:hi])

        if u.get("code"):
            kind = "bsod"
        elif u.get("power_button"):
            kind = "power-button"
        elif u["source"] == "kp41":
            kind = "power-cut"
        else:
            kind = "unknown"
        out.append({"time": ref, "loggedAt": u["t"], "kind": kind, "code": u.get("code") or None,
                    "uptimeMinutes": uptime, "precursors": dict(pre), "approximate": crash is None})
    return out


def summarize(shutdowns, span_days):
    n = len(shutdowns)
    if not n:
        return {"count": 0}
    kinds = Counter(s["kind"] for s in shutdowns)
    ups = [s["uptimeMinutes"] for s in shutdowns if s["uptimeMinutes"] is not None]
    med = round(median(ups), 1) if ups else None
    consistent = False
    if len(ups) >= 3 and med:
        mean = sum(ups) / len(ups)
        consistent = mean > 0 and (pstdev(ups) / mean) < 0.5
    hours = [0] * 24
    for s in shutdowns:
        hours[s["time"].astimezone(_KST).hour] += 1
    with_pre = Counter()
    for s in shutdowns:
        for cat in s["precursors"]:
            with_pre[cat] += 1
    return {
        "count": n,
        "perDay": round(n / span_days, 1) if span_days >= 1 else None,
        "spanDays": round(span_days, 1),
        "kinds": dict(kinds),
        "medianUptimeMin": med,
        "uptimeConsistent": consistent,
        "hourKst": hours,
        "withPrecursor": dict(with_pre),
        "noPrecursor": sum(1 for s in shutdowns if not s["precursors"]),
    }


def to_json(shutdowns, limit=40):
    """최근 종료부터 limit개를 JSON 직렬화 가능한 dict로 바꾼다."""
    rows = []
    for s in shutdowns[-limit:]:
        rows.append({"time": s["time"].isoformat(), "loggedAt": s["loggedAt"].isoformat(), "kind": s["kind"],
                     "code": hex(s["code"]) if s["code"] else None, "uptimeMinutes": s["uptimeMinutes"],
                     "precursors": s["precursors"], "approximate": s["approximate"]})
    return rows
