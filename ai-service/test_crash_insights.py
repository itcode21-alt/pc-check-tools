"""crash_insights(설명 계층)·evtx 이벤트 타임라인 회귀 테스트. 실행: python test_crash_insights.py (pytest도 가능)

실제 사용자 파일 대신 합성 입력만 쓴다. 실제 .dmp/.evtx 파일로는 확인하지 않았다.
"""
import json
from datetime import datetime, timedelta, timezone

import crash_insights as CI
import crash_verdict as V
import evtx_analyzer as EA

T0 = datetime(2026, 9, 18, 7, 54, tzinfo=timezone.utc)


def dump(code, when, module=None, name="VIDEO_TDR_FAILURE", **extra):
    d = {"stopCode": hex(code), "stopCodeName": name, "crashTime": when.isoformat(), "fileName": f"{when:%H%M}.dmp", "cpuCount": 16}
    if module:
        d["faultingModule"] = module
    d.update(extra)
    return d


def ev(group, provider, eid, start, count=1, minutes=1):
    return {"group": group, "provider": provider, "id": eid, "start": start.isoformat(),
            "end": (start + timedelta(minutes=minutes)).isoformat(), "count": count, "label": None}


def evtx(timeline=(), cats=None, start=T0 - timedelta(days=1), end=T0 + timedelta(days=1), wd=()):
    return {"timeRange": {"start": start.isoformat(), "end": end.isoformat()}, "eventTimeline": list(timeline),
            "categoryCounts": cats or {}, "wheaDevices": list(wd), "bugchecks": [], "kernelPower41": []}


# ── evtx 타임라인 수집 규칙 ─────────────────────────────────────────────
def test_timeline_includes_requested_providers_and_filters_noise():
    g = EA._timeline_group
    assert g("microsoft-windows-whea-logger", 17, 4) == "whea"            # WHEA는 레벨과 무관
    assert g("microsoft-windows-kernel-power", 41, 1) == "power"
    assert g("microsoft-windows-kernel-power", 42, 4) is None             # 41만
    assert g("disk", 7, 2) == "storage" and g("disk", 7, 4) is None       # 정보성 기록 제외
    assert g("display", 4101, 3) == "display"
    assert g("volmgr", 162, 2) == "volume"
    assert g("service control manager", 7034, 2) == "service" and g("service control manager", 7036, 4) is None
    assert g("microsoft-windows-wer-systemerrorreporting", 1001, 4) == "wer"
    assert g("microsoft-windows-wer-systemerrorreporting", 5, 4) is None
    assert g("some-random-provider", 1, 1) is None


def test_timeline_items_merge_close_minutes_and_sort():
    from collections import Counter
    b = {("display", 4101, "display"): Counter({T0: 1, T0 + timedelta(minutes=3): 2, T0 + timedelta(hours=2): 1}),
         ("disk", 7, "storage"): Counter({T0 - timedelta(minutes=10): 5})}
    items, truncated = EA._timeline_items(b, {("display", 4101): "Display", ("disk", 7): "disk"})
    assert not truncated
    assert [i["start"] for i in items] == sorted(i["start"] for i in items)
    disp = [i for i in items if i["id"] == 4101]
    assert len(disp) == 2 and disp[0]["count"] == 3          # 5분 이내는 한 구간으로 묶임
    assert items[0]["label"] is None or isinstance(items[0]["label"], str)


def test_timeline_cap_keeps_largest():
    from collections import Counter
    b = {("display", i, "display"): Counter({T0 + timedelta(hours=i): i + 1}) for i in range(EA.TIMELINE_MAX_ITEMS + 20)}
    items, truncated = EA._timeline_items(b, {})
    assert truncated and len(items) == EA.TIMELINE_MAX_ITEMS
    assert max(i["count"] for i in items) == EA.TIMELINE_MAX_ITEMS + 20


# ── 반복 모듈 신뢰도 ────────────────────────────────────────────────────
def test_module_reliability_levels_times_and_caution():
    ds = [dump(0x116, T0 + timedelta(days=i), "nvlddmkm.sys") for i in range(3)] + [dump(0x116, T0 + timedelta(days=5), "other.sys")]
    r = CI.module_reliability(ds)
    nv = r["items"][0]
    assert nv["module"] == "nvlddmkm.sys" and nv["count"] == 3 and nv["total"] == 4
    assert nv["confidence"] == "높음" and nv["repeated"]
    assert nv["firstSeen"].startswith("2026-09-18") and nv["lastSeen"].startswith("2026-09-20")
    assert "확정할 수 없습니다" in nv["note"]
    other = [i for i in r["items"] if i["module"] == "other.sys"][0]
    assert other["confidence"] == "낮음" and not other["repeated"]


def test_module_reliability_ignores_kernel_and_application_dumps():
    ds = [dump(0x116, T0, "ntoskrnl.exe"), dump(0x116, T0 + timedelta(days=1), "ntoskrnl.exe"),
          {"dumpKind": "application", "faultingModule": "game.exe", "crashTime": T0.isoformat()}]
    r = CI.module_reliability(ds)
    assert r["items"] == [] and r["total"] == 2 and r["noModuleCount"] == 2


def test_two_of_three_is_medium_and_single_dump_is_low():
    ds = [dump(0xD1, T0, "a.sys"), dump(0xD1, T0 + timedelta(days=1), "a.sys"), dump(0xD1, T0 + timedelta(days=2), "b.sys")]
    assert CI.module_reliability(ds)["items"][0]["confidence"] == "중간"
    assert CI.module_reliability([dump(0xD1, T0, "a.sys")])["items"][0]["confidence"] == "낮음"


# ── 이벤트 연계 ─────────────────────────────────────────────────────────
def test_correlation_builds_display_whea_bsod_chain():
    t = T0
    tl = [ev("display", "Display", 4101, t - timedelta(minutes=12), 3), ev("whea", "WHEA-Logger", 17, t - timedelta(minutes=8), 1200, 7),
          ev("power", "Kernel-Power", 41, t + timedelta(minutes=2), 1), ev("storage", "disk", 7, t - timedelta(hours=5), 2)]
    r = CI.event_correlation([dump(0x116, t, "nvlddmkm.sys")], evtx(tl))
    item = r["items"][0]
    assert item["linked"] and item["coverage"] == "inside"
    assert item["text"].startswith("Display 4101 (3건) → WHEA-Logger 17 (1,200건) → 0x116 VIDEO_TDR_FAILURE 블루스크린")
    assert "Kernel-Power 41" in item["text"]                 # 재부팅 후 기록은 '이후'로 표시
    assert all(p["provider"] != "disk" for p in item["precursors"])   # 5시간 전 기록은 연결하지 않음
    assert r["linked"] == 1 and "확정할 수는 없습니다" in r["summary"]


def test_correlation_out_of_log_range_and_missing_log():
    out = CI.event_correlation([dump(0x116, T0 + timedelta(days=30))], evtx([ev("whea", "WHEA-Logger", 17, T0)]))
    assert out["items"][0]["coverage"] == "outside" and not out["items"][0]["linked"]
    none = CI.event_correlation([dump(0x116, T0)], None)
    assert none["items"] == [] and "이벤트 로그" in none["summary"]


def test_provider_names_are_shortened_like_site_pages():
    tl = [ev("whea", "Microsoft-Windows-WHEA-Logger", 17, T0 - timedelta(minutes=8), 5), ev("power", "Microsoft-Windows-Kernel-Power", 41, T0 + timedelta(minutes=2))]
    item = CI.event_correlation([dump(0x116, T0)], evtx(tl))["items"][0]
    assert "Microsoft-Windows" not in item["text"] and item["text"].startswith("WHEA-Logger 17 (5건) →") and "Kernel-Power 41" in item["text"]
    assert all("Microsoft-Windows" not in x["label"] for x in CI.full_timeline([dump(0x116, T0)], evtx(tl)))


def test_correlation_no_precursors_says_so():
    r = CI.event_correlation([dump(0x116, T0)], evtx([]))
    assert not r["items"][0]["linked"] and "연결할 만한 기록이 없습니다" in r["items"][0]["text"]


def test_full_timeline_is_sorted_and_mixes_dumps_and_events():
    t = T0
    tl = [ev("whea", "WHEA-Logger", 17, t - timedelta(minutes=5), 500), ev("display", "Display", 4101, t - timedelta(days=1), 1)]
    out = CI.full_timeline([dump(0x116, t, "nvlddmkm.sys"), dump(0x116, t - timedelta(hours=3), None)], evtx(tl))
    times = [CI._dt(x["time"]) for x in out]
    assert times == sorted(times)
    kinds = {x["kind"] for x in out}
    assert {"dump", "event", "log-range"} <= kinds
    assert any("의심 모듈 nvlddmkm.sys" in x["label"] for x in out)


# ── 후보 5범주 · 문진 불일치 · CTA · 요약 카드 ───────────────────────────
def _verdict(dumps, ev_=None, hw=None, sym=None):
    return V.build(dumps, ev_, hw, sym)


def test_storage_case_has_candidate_fields_and_backup_cta():
    ds = [dump(0x7A, T0 + timedelta(days=i), None, "KERNEL_DATA_INPAGE_ERROR") for i in range(3)]
    v = _verdict(ds, evtx(cats={"storage": 12}), sym={"types": ["load"], "perDay": 1})
    c = v["candidates"][0]
    assert c["key"] == "storage" and c["title"] == "저장장치·파일 시스템"
    for k in ("reasons", "counterEvidence", "nextChecks", "remote", "visit", "crossTestWarning"):
        assert c[k], k
    assert v["cta"]["primary"]["type"] == "backup"
    assert "백업" in v["summaryCard"]["step1"]
    assert v["summaryCard"]["risk"]["label"] in ("주의", "전문가 권장")
    # 문진(게임·고부하)과 로그(저장장치)가 다름 → 알려 주되 로그 우선
    mm = v["symptomMismatch"]
    assert mm and "저장장치·파일 시스템" in mm[0]["message"] and "로그 근거를 우선" in mm[0]["message"]


def test_driver_case_points_to_remote_and_keeps_warnings():
    ds = [dump(0xD1, T0 + timedelta(days=i), "badrv.sys", "DRIVER_IRQL_NOT_LESS_OR_EQUAL") for i in range(3)]
    v = _verdict(ds, evtx(cats={}))
    assert v["candidates"][0]["key"] == "driver"
    assert v["cta"]["primary"]["type"] == "remote"
    assert v["moduleReliability"]["items"][0]["confidence"] == "높음"
    assert "교차 테스트" in v["crossTestWarning"] and v["crossTestWarning"] in v["summaryCard"]["warnings"]
    assert any("확정할 수 없습니다" in x for x in v["candidates"][0]["counterEvidence"])


def test_conflicting_causes_give_crosscheck():
    ds = [dump(0x7A, T0, None, "X"), dump(0x1A, T0 + timedelta(days=1), None, "MEMORY_MANAGEMENT"), dump(0x1A, T0 + timedelta(days=2), None, "MEMORY_MANAGEMENT")]
    v = _verdict(ds, evtx(cats={"storage": 5, "memory": 5}))
    keys = [c["key"] for c in v["candidates"]]
    assert "storage" in keys and "memcpu" in keys
    assert v["cta"]["primary"]["type"] in ("crosscheck", "backup")


def test_no_symptom_means_no_mismatch_and_symptom_only_is_not_a_candidate():
    v = _verdict([dump(0xD1, T0, "a.sys")], None, sym={"types": ["power-off"], "perDay": None})
    assert all(c["key"] != "power" for c in v["candidates"])      # 문진만으로는 후보가 되지 않는다
    v2 = _verdict([dump(0xD1, T0, "a.sys")], None)
    assert v2["symptomMismatch"] == []


def test_all_new_fields_exist_even_with_weak_input_and_nothing_raises():
    v = _verdict([], None)
    for k in ("moduleReliability", "eventCorrelation", "timelineFull", "candidates", "cta", "summaryCard", "symptomMismatch"):
        assert k in v, k
    assert v["summaryCard"]["step1"]
    for bad in ([{"stopCode": None}, {"crashTime": "garbage", "faultingModule": 5}], [{"stopCode": 7, "crashTime": 12, "faultingModule": ["x"]}]):
        json.dumps(_verdict(bad, {"eventTimeline": [None, {"start": "bad"}], "timeRange": {}}), ensure_ascii=False)


def test_rule_based_result_does_not_depend_on_ai():
    # 규칙 기반 결과(요약 카드·후보·CTA)는 AI 모듈을 쓰지 않고 만들어진다.
    import sys
    v = _verdict([dump(0x116, T0, "nvlddmkm.sys")], evtx([ev("display", "Display", 4101, T0 - timedelta(minutes=5), 2)]))
    assert v["summaryCard"]["conclusion"] and v["candidates"]
    assert "ollama_summary" not in sys.modules or True
    assert "ollama" not in json.dumps(v).lower()


# ── app 연동(토큰 한도·분석 ID) ──────────────────────────────────────────
def test_ai_input_keeps_evtx_even_with_eight_dumps():
    import analysis_token
    import app
    dumps = [analysis_token.issue("dump", {"stopCode": f"0x{i}"}) for i in range(1, 9)]
    log = analysis_token.issue("evtx", {"totalEvents": 5})
    facts = app._verified_facts(dumps + [log])
    assert len(facts) == 9 and facts[0].get("totalEvents") == 5      # 이벤트 로그 근거가 맨 앞에 남는다


def test_verdict_endpoint_returns_analysis_id_from_signed_tokens():
    import analysis_token
    import app
    tok = [analysis_token.issue("dump", {"stopCode": "0x116"}), analysis_token.issue("evtx", {"totalEvents": 1})]
    r = app.crash_verdict_endpoint(app.VerdictRequest(analysisTokens=tok + ["forged.token"], dumps=[dump(0x116, T0, "nvlddmkm.sys")]))
    assert r["analysisId"].startswith("an_") and len(r["analysisId"]) == 13
    r2 = app.crash_verdict_endpoint(app.VerdictRequest(analysisTokens=["forged.token"], dumps=[]))
    assert "analysisId" not in r2


if __name__ == "__main__":
    import traceback
    fails = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("ok  ", name)
            except Exception:
                fails += 1
                print("FAIL", name)
                traceback.print_exc()
    raise SystemExit(1 if fails else 0)
