"""종합 판단(crash_verdict)에 덧붙이는 설명 계층.

crash_verdict가 만든 점수·근거를 사용자가 이해할 수 있는 형태로 풀어 준다.
  - 반복 모듈 신뢰도, 덤프 전후 이벤트 연계, 통합 타임라인
  - 원인 후보 5범주(판단 근거·반대 근거·다음 확인·원격/방문 안내)
  - 문진과 로그의 불일치, 조건별 CTA, 일반인용 요약 카드

전부 규칙 기반이며 AI를 쓰지 않는다. 덤프·로그만으로 부품 고장을 확정하지 않으므로, 모든 후보에는
"교차 테스트 전 교체 금지" 경고와 불확실성(반대 근거)을 함께 담는다.
"""
from collections import Counter
from datetime import datetime, timedelta, timezone
from typing import Optional

KERNEL_MODULES = {"ntoskrnl.exe", "ntkrnlmp.exe", "ntkrnlpa.exe", "ntkrpamp.exe"}

LEAD = timedelta(minutes=30)   # 덤프 발생 전 이 시간 안의 기록을 "전조"로 본다
TAIL = timedelta(minutes=10)   # 덤프 발생 후 이 시간 안의 기록(재부팅 후 기록 등)은 "이후"로 본다

MODULE_CAUTION = ("이 모듈은 오류가 감지된 위치 또는 후보일 뿐 실제 고장 원인이라고 확정할 수 없습니다. "
                  "다른 드라이버·메모리·하드웨어 문제가 특정 모듈로 나타나기도 합니다.")
CROSS_TEST_WARNING = ("부품을 교체하기 전에 다른 부품·다른 PC로 교차 테스트해 원인을 먼저 확인하세요. "
                      "덤프와 로그만으로 부품 고장을 확정할 수 없습니다.")

GROUP_LABEL = {"whea": "WHEA-Logger", "power": "Kernel-Power", "storage": "디스크", "display": "디스플레이",
               "volume": "볼륨 관리자", "service": "서비스 제어 관리자", "wer": "오류 보고"}

CATEGORIES = {
    "driver": {
        "title": "드라이버·소프트웨어", "hyps": ("driver_generic", "gpu_driver"),
        "remote": ("가능", "드라이버 재설치·업데이트와 설정 확인은 원격 점검으로 진행할 수 있습니다."),
        "visit": ("보통 필요 없음", "소프트웨어 점검으로 해결되는 경우가 많습니다."),
    },
    "memcpu": {
        "title": "메모리·CPU 안정성", "hyps": ("memory", "cpu_hw"),
        "remote": ("일부 가능", "BIOS 설정 확인과 메모리 검사 안내는 원격으로 도울 수 있지만, 모듈 교차 테스트·교체는 직접 확인이 필요합니다."),
        "visit": ("필요할 수 있음", "메모리를 한 개씩 꽂아 보는 교차 테스트는 PC를 직접 열어야 합니다."),
    },
    "gpu": {
        "title": "그래픽카드·PCIe·라이저", "hyps": ("gpu_link", "gpu_hw", "cpu_slot", "pcie_device"),
        "remote": ("일부 가능", "드라이버와 BIOS의 PCIe 링크 속도 설정은 원격으로 확인할 수 있지만, 재장착·라이저 제거·교차 테스트는 직접 해야 합니다."),
        "visit": ("필요할 수 있음", "슬롯 접촉·라이저 케이블·다른 카드로의 교차 테스트는 PC를 직접 점검해야 합니다."),
    },
    "storage": {
        "title": "저장장치·파일 시스템", "hyps": ("storage",),
        "remote": ("일부 가능", "상태(SMART) 확인과 백업 안내는 원격으로 가능하지만, 케이블·장치 교체는 직접 해야 합니다."),
        "visit": ("필요할 수 있음", "장치 상태가 나쁘면 교체와 데이터 복구 상담이 필요할 수 있습니다."),
    },
    "power": {
        "title": "전원·발열", "hyps": ("power", "thermal"),
        "remote": ("일부 가능", "온도·이벤트 기록 확인은 원격으로 가능하지만, 파워 교차 테스트·청소는 직접 해야 합니다."),
        "visit": ("필요할 수 있음", "전원공급장치 교체 테스트와 쿨링 점검은 PC를 직접 열어야 합니다."),
    },
}
_HYP_TO_CAT = {h: k for k, c in CATEGORIES.items() for h in c["hyps"]}

# 문진 항목이 자연스럽게 설명되는 범주. 여기에 없는 범주가 로그에서 가장 강하면 불일치로 알린다.
# (bsod·reboot·early는 거의 모든 원인에서 나타나는 증상이라 비교하지 않는다.)
SYMPTOM_FITS = {
    "screen-off": {"gpu", "driver", "power"},
    "power-off": {"power", "memcpu", "gpu"},
    "load": {"gpu", "power", "memcpu", "driver"},
    "freeze": {"storage", "memcpu", "power", "driver"},
}
SYMPTOM_LABELS = {"screen-off": "화면만 꺼지고 소리·동작은 계속됨", "power-off": "전원이 갑자기 꺼짐(블루스크린 없음)",
                  "load": "게임·고부하 작업 중에만 발생", "freeze": "멈춤·심한 느려짐"}


def _dt(v) -> Optional[datetime]:
    if not v or not isinstance(v, str):
        return None
    try:
        d = datetime.fromisoformat(v)
    except ValueError:
        return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _code_hex(d: dict) -> Optional[str]:
    c = d.get("stopCode")
    return c.upper().replace("0X", "0x") if isinstance(c, str) and c else None


def _bsod(dumps):
    return [d for d in dumps if isinstance(d, dict) and d.get("dumpKind") != "application"]


# ── 1. 반복 모듈 신뢰도 ────────────────────────────────────────────────────
def module_reliability(dumps: list) -> dict:
    bs = _bsod(dumps)
    total = len(bs)
    groups: dict = {}
    for d in bs:
        m = d.get("faultingModule")
        if not isinstance(m, str) or not m or m.lower() in KERNEL_MODULES:
            continue
        g = groups.setdefault(m.lower(), {"module": m, "times": [], "count": 0, "codes": Counter(), "candidate": False})
        g["count"] += 1
        t = _dt(d.get("crashTime"))
        if t:
            g["times"].append(t)
        code = _code_hex(d)
        if code:
            g["codes"][code] += 1
        if d.get("faultingModuleBasis"):
            g["candidate"] = True
    items = []
    for g in groups.values():
        share = g["count"] / total if total else 0.0
        if g["count"] >= 3 and share >= 0.6:
            level = "높음"
        elif g["count"] >= 2 and share >= 0.4:
            level = "중간"
        else:
            level = "낮음"
        times = sorted(g["times"])
        items.append({
            "module": g["module"], "count": g["count"], "total": total, "sharePercent": round(share * 100),
            "firstSeen": times[0].isoformat() if times else None, "lastSeen": times[-1].isoformat() if times else None,
            "repeated": g["count"] >= 2, "confidence": level, "candidate": g["candidate"],
            "codes": [f"{c} ×{n}" for c, n in g["codes"].most_common(4)],
            "note": MODULE_CAUTION,
        })
    items.sort(key=lambda x: (-x["count"], x["module"].lower()))
    return {"total": total, "items": items, "caution": MODULE_CAUTION,
            "noModuleCount": total - sum(g["count"] for g in groups.values())}


# ── 2. 덤프 전후 이벤트 연계 ───────────────────────────────────────────────
def _merge_events(events: list) -> list:
    """같은 (제공자, ID)의 구간을 하나로 합쳐 건수 합계·첫 시각·끝 시각으로 만든다."""
    merged: dict = {}
    for e in events:
        key = (e.get("provider"), e.get("id"), e.get("group"))
        s, en = _dt(e.get("start")), _dt(e.get("end"))
        if not s:
            continue
        m = merged.get(key)
        if m is None:
            merged[key] = {"provider": e.get("provider"), "id": e.get("id"), "group": e.get("group"),
                           "count": int(e.get("count") or 0), "start": s, "end": en or s}
        else:
            m["count"] += int(e.get("count") or 0)
            m["start"] = min(m["start"], s)
            m["end"] = max(m["end"], en or s)
    return sorted(merged.values(), key=lambda x: x["start"])


def _event_out(e: dict) -> dict:
    return {"provider": e["provider"], "id": e["id"], "group": e["group"], "count": e["count"],
            "time": e["start"].isoformat(), "label": f"{e['provider']} {e['id']} ({e['count']:,}건)"}


def event_correlation(dumps: list, evtx: Optional[dict]) -> dict:
    bs = [d for d in _bsod(dumps) if _dt(d.get("crashTime"))]
    if not evtx:
        return {"items": [], "linked": 0, "total": len(bs), "summary": "이벤트 로그(.evtx)가 없어 덤프 전후 기록을 연결하지 못했습니다."}
    timeline = [e for e in (evtx.get("eventTimeline") or []) if isinstance(e, dict)]
    rng = evtx.get("timeRange") or {}
    log_start, log_end = _dt(rng.get("start")), _dt(rng.get("end"))
    items, linked = [], 0
    for d in sorted(bs, key=lambda x: _dt(x.get("crashTime"))):
        t = _dt(d["crashTime"])
        code = _code_hex(d)
        name = d.get("stopCodeName")
        head = {"fileName": d.get("fileName"), "time": t.isoformat(), "stopCode": code, "stopCodeName": name,
                "faultingModule": d.get("faultingModule")}
        if log_start and log_end and not (log_start - timedelta(minutes=5) <= t <= log_end + timedelta(minutes=5)):
            items.append({**head, "coverage": "outside", "precursors": [], "after": [], "linked": False,
                          "text": "이 덤프는 이벤트 로그 기록 기간 밖이라 전후 기록을 연결하지 못했습니다."})
            continue
        before_raw, after_raw = [], []
        for e in timeline:
            s = _dt(e.get("start"))
            if not s:
                continue
            if t - LEAD <= s <= t + timedelta(minutes=1) and e.get("group") not in ("power", "wer"):
                before_raw.append(e)
            elif t - timedelta(minutes=1) <= s <= t + TAIL and e.get("group") in ("power", "wer"):
                after_raw.append(e)
        before = _merge_events(before_raw)
        if len(before) > 6:
            before = sorted(sorted(before, key=lambda x: -x["count"])[:6], key=lambda x: x["start"])
        after = _merge_events(after_raw)
        crash_label = (code or "덤프") + (" " + name if name else "") + " 블루스크린"
        chain = [f"{e['provider']} {e['id']} ({e['count']:,}건)" for e in before] + [crash_label]
        text = " → ".join(chain)
        if after:
            text += " (이후 " + ", ".join(f"{e['provider']} {e['id']}" for e in after) + " 기록)"
        has = bool(before)
        linked += 1 if has else 0
        items.append({**head, "coverage": "inside", "precursors": [_event_out(e) for e in before],
                      "after": [_event_out(e) for e in after], "linked": has,
                      "text": text if has else f"덤프 발생 전 {int(LEAD.total_seconds() // 60)}분 안에 연결할 만한 기록이 없습니다."})
    if not items:
        summary = "발생 시각이 확인되는 덤프가 없어 이벤트와 연결하지 못했습니다."
    else:
        summary = (f"덤프 {len(items)}개 중 {linked}개에서 발생 전 {int(LEAD.total_seconds() // 60)}분 안에 관련 기록이 있습니다. "
                   "시간상 가까울 뿐 한 기록이 다른 기록의 원인이라고 확정할 수는 없습니다.")
    return {"items": items, "linked": linked, "total": len(items), "summary": summary}


# ── 3. 통합 타임라인 ───────────────────────────────────────────────────────
def full_timeline(dumps: list, evtx: Optional[dict], cap: int = 100) -> list:
    out = []
    dump_times = []
    for d in dumps:
        if not isinstance(d, dict):
            continue
        t = _dt(d.get("crashTime"))
        if not t:
            continue
        app = d.get("dumpKind") == "application"
        if not app:
            dump_times.append(t)
        code = _code_hex(d)
        if app:
            label = f"프로그램 크래시 덤프 — {d.get('processName') or d.get('fileName') or '알 수 없음'}"
        else:
            stop_name = d.get("stopCodeName")
            label = ("블루스크린 " + (code or "") + (" " + stop_name if stop_name else "")).strip()
            if d.get("faultingModule") and d["faultingModule"].lower() not in KERNEL_MODULES:
                label += f" · 의심 모듈 {d['faultingModule']}"
        out.append({"time": t.isoformat(), "kind": "app-dump" if app else "dump", "group": "dump", "label": label,
                    "fileName": d.get("fileName")})
    if evtx:
        rng = evtx.get("timeRange") or {}
        for key, label in (("start", "이벤트 로그 기록 시작"), ("end", "이벤트 로그 기록 끝")):
            t = _dt(rng.get(key))
            if t:
                out.append({"time": t.isoformat(), "kind": "log-range", "group": "log", "label": label})
        events = [e for e in (evtx.get("eventTimeline") or []) if isinstance(e, dict) and _dt(e.get("start"))]
        if dump_times:
            near = [e for e in events if any(t - LEAD <= _dt(e["start"]) <= t + TAIL for t in dump_times)]
            rest = sorted((e for e in events if e not in near), key=lambda e: -int(e.get("count") or 0))[:15]
            chosen = near + rest
        else:
            chosen = sorted(events, key=lambda e: -int(e.get("count") or 0))[:40]
        for e in chosen:
            out.append({"time": e["start"], "end": e.get("end"), "kind": "event", "group": e.get("group"),
                        "label": f"{e.get('provider')} {e.get('id')} — {int(e.get('count') or 0):,}건", "count": int(e.get("count") or 0)})
    out.sort(key=lambda x: _dt(x["time"]) or datetime.min.replace(tzinfo=timezone.utc))
    return out[:cap]


# ── 4. 원인 후보 5범주 ─────────────────────────────────────────────────────
def _counter_evidence(cat: str, dumps, evtx, hardware, rel) -> list:
    out = []
    has_evtx, has_hw = bool(evtx), bool(hardware)
    cats = (evtx or {}).get("categoryCounts") or {}
    hsig = (hardware or {}).get("signals") or {}
    whea = (evtx or {}).get("wheaDevices") or []
    n = len(_bsod(dumps))
    if cat == "driver":
        if not has_evtx:
            out.append("이벤트 로그가 없어 드라이버 문제인지 하드웨어 문제인지 교차 확인하지 못했습니다.")
        if n == 1:
            out.append("덤프가 1개뿐이라 같은 드라이버가 반복되는지 확인하지 못했습니다.")
        elif n >= 2 and not any(i["repeated"] for i in rel["items"]):
            out.append("덤프마다 지목된 모듈이 달라, 특정 드라이버가 반복된다는 근거는 없습니다.")
        if any(w.get("eventId") in (18, 20) or w.get("uncorrectable") or (w.get("eventId") == 17 and w.get("count", 0) >= 100) for w in whea):
            out.append("하드웨어 계열 오류(WHEA) 기록이 함께 있어 드라이버만의 문제로 단정하기 어렵습니다.")
        out.append("덤프에 나온 모듈은 오류가 감지된 위치·후보일 뿐 원인이라고 확정할 수 없습니다.")
    elif cat == "memcpu":
        if has_evtx and not cats.get("memory"):
            out.append("메모리 관련 WHEA 오류 기록(46·47)이 로그에 없습니다.")
        out.append("버그체크 코드만으로는 메모리 불량과 드라이버 오류를 구분하기 어렵습니다.")
    elif cat == "gpu":
        if not has_evtx:
            out.append("이벤트 로그가 없어 PCIe 링크 오류 기록을 확인하지 못했습니다.")
        elif not any(w.get("eventId") == 17 and w.get("count", 0) >= 100 for w in whea):
            out.append("PCIe 링크 오류(WHEA 17)가 대량으로 기록된 흔적은 없습니다.")
        if has_hw and not hsig.get("gpuLinkDegraded"):
            out.append("하드웨어 수집에서 그래픽카드 링크 저하는 확인되지 않았습니다(수집 시점의 상태만 반영).")
        out.append("같은 그래픽 오류(TDR)는 드라이버 문제로도 생겨, 하드웨어 문제로 단정할 수 없습니다.")
    elif cat == "storage":
        if has_evtx and not cats.get("storage"):
            out.append("디스크·NTFS 오류 이벤트가 로그에 없습니다.")
        if has_hw and not hsig.get("diskFailing"):
            out.append("하드웨어 수집에서 저장장치 건강 경고는 확인되지 않았습니다.")
        if not has_hw:
            out.append("하드웨어 정보(hardware.json)가 없어 저장장치 상태(SMART)를 확인하지 못했습니다.")
    elif cat == "power":
        ss = (evtx or {}).get("shutdownSummary") or {}
        if has_evtx and not ss.get("count"):
            out.append("이벤트 로그에 예기치 않은 종료(Kernel-Power 41) 기록이 없습니다.")
        out.append("이 분석에는 온도 측정값이 없어 과열 여부는 직접 확인되지 않았습니다.")
    return out


def candidates(scores, dumps, evtx, hardware, rel, steps: dict) -> list:
    """scores: crash_verdict._Scores(score·reasons·sources). 증상(문진)만으로 점수를 받은 가설은 제외한다."""
    cat_score: dict = {}
    for h, v in scores.score.items():
        if v <= 0 or not (scores.sources[h] - {"symptom"}):
            continue
        cat = _HYP_TO_CAT.get(h)
        if cat:
            cat_score[cat] = cat_score.get(cat, 0.0) + v
    total = sum(cat_score.values())
    out = []
    for cat, sc_val in sorted(cat_score.items(), key=lambda kv: -kv[1]):
        meta = CATEGORIES[cat]
        members = sorted((h for h in meta["hyps"] if scores.score.get(h, 0) > 0 and scores.sources[h] - {"symptom"}),
                         key=lambda h: -scores.score[h])
        reasons, srcs = [], set()
        for h in members:
            srcs |= scores.sources[h] - {"symptom"}
            for r in scores.reasons[h]:
                if r not in reasons:
                    reasons.append(r)
        share = sc_val / total if total else 0.0
        likelihood = "높음" if (share >= 0.45 and sc_val >= 3.0 and len(srcs) >= 2) else ("중간" if share >= 0.2 and sc_val >= 1.0 else "낮음")
        nxt, seen = [], set()
        for h in members:
            for s in steps.get(h, [])[:3]:
                if s not in seen:
                    nxt.append(s)
                    seen.add(s)
        out.append({
            "key": cat, "title": meta["title"], "likelihood": likelihood, "sharePercent": round(share * 100),
            "evidenceSources": sorted(srcs),
            "reasons": (reasons or ["관련 신호가 약하게 확인됨"])[:4],
            "counterEvidence": _counter_evidence(cat, dumps, evtx, hardware, rel),
            "nextChecks": nxt[:3],
            "remote": {"label": meta["remote"][0], "text": meta["remote"][1]},
            "visit": {"label": meta["visit"][0], "text": meta["visit"][1]},
            "crossTestWarning": CROSS_TEST_WARNING,
        })
    return out


# ── 5. 문진과 로그의 불일치 ────────────────────────────────────────────────
def symptom_mismatch(symptoms: Optional[dict], cands: list) -> list:
    types = [t for t in ((symptoms or {}).get("types") or []) if t in SYMPTOM_FITS]
    if not types or not cands:
        return []
    top = cands[0]
    if top["likelihood"] == "낮음" or top["key"] not in CATEGORIES:
        return []
    out = []
    for t in types:
        if top["key"] not in SYMPTOM_FITS[t]:
            out.append({"symptom": t, "symptomLabel": SYMPTOM_LABELS[t], "logCategory": top["key"], "logCategoryTitle": top["title"],
                        "message": (f"문진에서는 '{SYMPTOM_LABELS[t]}'(이)라고 답하셨지만, 로그에서는 {top['title']} 쪽 근거가 더 강하게 확인됩니다. "
                                    "문진만으로 원인을 확정하지 않고 실제 로그 근거를 우선했습니다.")})
    return out


# ── 6. 조건별 CTA ──────────────────────────────────────────────────────────
CTA_TEXT = {
    "remote": ("원격 점검 신청", "드라이버·설정 쪽 가능성이 높습니다. 원격으로 드라이버와 설정을 함께 점검해 볼 수 있습니다."),
    "crosscheck": ("전문가 교차 점검", "여러 원인 후보가 비슷하게 나와 이 결과만으로 좁히기 어렵습니다. 부품 교체 전에 교차 점검을 권합니다."),
    "visit": ("방문 점검 안내", "하드웨어 쪽 가능성이 있어 PC를 직접 열어 확인하는 점검이 필요할 수 있습니다."),
    "backup": ("백업 먼저", "저장장치·데이터 손상 가능성이 있습니다. 어떤 점검보다 중요한 파일의 백업을 먼저 하세요."),
}


def cta(cands: list, hardware: Optional[dict], evtx: Optional[dict]) -> dict:
    hsig = (hardware or {}).get("signals") or {}
    cats = (evtx or {}).get("categoryCounts") or {}
    by_key = {c["key"]: c for c in cands}
    storage = by_key.get("storage")
    backup = bool(hsig.get("diskFailing")) or bool(storage and storage["sharePercent"] >= 30 and (cats.get("storage") or storage["likelihood"] != "낮음"))
    kinds = []
    if cands:
        top = cands[0]
        second = cands[1] if len(cands) > 1 else None
        conflict = bool(second and second["sharePercent"] >= 0.75 * top["sharePercent"] and top["key"] != second["key"]
                        and second["likelihood"] != "낮음")
        if conflict:
            kinds.append("crosscheck")
        elif top["key"] == "driver":
            kinds.append("remote")
        elif top["key"] in ("memcpu", "gpu", "power") and top["likelihood"] != "낮음":
            kinds.append("visit")
        elif top["key"] == "storage":
            kinds.append("remote" if not backup else "visit")
    if backup:
        kinds.insert(0, "backup")
    if not kinds:
        kinds.append("remote")
    ordered = []
    for k in kinds:
        if k not in ordered:
            ordered.append(k)
    items = [{"type": k, "title": CTA_TEXT[k][0], "text": CTA_TEXT[k][1]} for k in ordered]
    return {"primary": items[0], "also": items[1:]}


# ── 7. 일반인용 요약 카드 ──────────────────────────────────────────────────
_RISK = {"critical": ("전문가 권장", "하드웨어 점검이 필요한 신호가 있어 전문가 확인을 권합니다."),
         "warning": ("주의", "원인을 좁히는 점검이 필요한 상태입니다. 같은 증상이 반복되면 점검을 미루지 마세요."),
         "info": ("낮음", "뚜렷한 위험 신호는 확인되지 않았습니다. 증상이 반복되는지 지켜보세요.")}


def summary_card(verdict: dict, cands: list, cta_info: dict, mismatches: list) -> dict:
    steps = [s for s in (verdict.get("steps") or []) if isinstance(s, str)]
    backup = cta_info["primary"]["type"] == "backup" or any(i["type"] == "backup" for i in cta_info["also"])
    todo = []
    if backup:
        todo.append("중요한 파일(문서·사진 등)을 다른 저장장치나 클라우드에 먼저 백업하세요.")
    todo.extend(steps)
    todo = todo or ["같은 증상이 다시 생기면 새로 만들어진 덤프와 이벤트 로그를 함께 올려 비교하세요."]
    level = verdict.get("level") or "info"
    risk_label, risk_text = _RISK.get(level, _RISK["info"])
    if backup and risk_label == "낮음":
        risk_label, risk_text = _RISK["warning"]
    primary = cta_info["primary"]
    if cands:
        remote = cands[0]["remote"]
    else:
        remote = {"label": "일부 가능", "text": "자료가 부족해 지금은 판단하기 어렵습니다. 원격 점검으로 추가 자료를 함께 확인할 수 있습니다."}
    repeats = {
        "remote": "같은 증상이 계속되면 이 결과를 저장해 원격 점검을 신청하세요.",
        "crosscheck": "같은 증상이 계속되면 부품을 바꾸기 전에 전문가 교차 점검을 받으세요.",
        "visit": "같은 증상이 계속되면 PC를 직접 점검받는 방문 점검을 상담하세요.",
        "backup": "같은 증상이 계속되면 백업을 마친 뒤 저장장치 점검을 받으세요.",
    }[primary["type"]]
    return {
        "conclusion": verdict.get("headline"), "confidence": verdict.get("confidence"),
        "step1": todo[0], "step2": todo[1] if len(todo) > 1 else None, "ifRepeats": repeats,
        "risk": {"label": risk_label, "text": risk_text}, "remote": remote,
        "warnings": ([m["message"] for m in mismatches[:1]] + [CROSS_TEST_WARNING]),
    }


def derive(verdict: dict, dumps: list, evtx: Optional[dict], hardware: Optional[dict], symptoms: Optional[dict], scores, steps: dict) -> dict:
    """crash_verdict.build()의 결과에 설명 계층을 덧붙여 돌려준다. 어떤 입력에도 예외를 내지 않는다."""
    try:
        rel = module_reliability(dumps)
        cands = candidates(scores, dumps, evtx, hardware, rel, steps)
        mism = symptom_mismatch(symptoms, cands)
        cta_info = cta(cands, hardware, evtx)
        verdict.update({
            "moduleReliability": rel,
            "eventCorrelation": event_correlation(dumps, evtx),
            "timelineFull": full_timeline(dumps, evtx),
            "candidates": cands,
            "symptomMismatch": mism,
            "cta": cta_info,
            "summaryCard": summary_card(verdict, cands, cta_info, mism),
            "crossTestWarning": CROSS_TEST_WARNING,
        })
    except Exception:  # 설명 계층 실패가 기존 종합 판단을 막지 않게 한다.
        import logging
        logging.getLogger(__name__).exception("crash insights failed")
    return verdict
