"""crash_verdict 회귀 테스트. 실행: python test_crash_verdict.py (pytest도 가능)

실제 사용자 파일 대신 합성 입력만 쓴다. 판단 엔진이 (1) 출처가 하나뿐일 때 과신하지 않고,
(2) 시각이 겹칠 때만 확정 수준으로 올리고, (3) 여러 유형의 사례를 가려내는지 확인한다.
"""
from datetime import datetime, timedelta, timezone

import crash_verdict as V
import hardware_check as HC
import shutdown_tracker as ST

T0 = datetime(2026, 9, 18, 7, 54, tzinfo=timezone.utc)


def dump(code, minutes_ago=None, uptime=None, gpu=("NVIDIA",), when=None):
    t = when if when is not None else (T0 - timedelta(days=2, minutes=minutes_ago or 0))
    return {"stopCode": hex(code), "crashTime": t.isoformat(), "uptimeMinutes": uptime,
            "gpuDrivers": list(gpu), "cpuCount": 32}


def storm(kind="cpu-x16", count=12000, start=T0, minutes=20, quality=1.2):
    return {"eventId": 17, "count": count, "roleKind": kind, "role": "CPU 직결 PCIe x16 슬롯(주로 그래픽카드)" if kind == "cpu-x16" else "PCIe 장치",
            "bdf": "00:01.0", "peakPerMinute": 2000, "linkQualityHits": int(count * quality),
            "correctable": [{"bit": 0, "name": "Receiver Error(수신 오류)", "count": count}], "uncorrectable": [],
            "bursts": [{"start": start.isoformat(), "end": (start + timedelta(minutes=minutes)).isoformat(), "count": count}]}


def evtx(devices=(), cats=None, start=T0, minutes=23, bugchecks=(), kp41=()):
    return {"timeRange": {"start": start.isoformat(), "end": (start + timedelta(minutes=minutes)).isoformat()},
            "wheaDevices": list(devices), "categoryCounts": cats or {}, "bugchecks": list(bugchecks), "kernelPower41": list(kp41)}


def top(v):
    return v["scores"][0]["key"] if v["scores"] else None


def test_link_storm_with_display_dumps_but_no_time_overlap_is_not_confirmed():
    dumps = [dump(0x116, 10, 2.4), dump(0x116, 60, 1.3), dump(0x116, 90, 30.7), dump(0x133, 200, 6.9)]
    v = V.build(dumps, evtx([storm()]))
    assert top(v) == "gpu_link"
    assert v["confidence"] == "중간", v["confidence"]          # 시각이 안 겹치면 '높음'을 주지 않는다
    assert not v["timeLinked"]
    assert "겹치지 않아" in v["headline"]
    assert any("다음 크래시" in t for t in v["nextEvidence"])
    assert any("부팅 후" in e for e in v["evidence"])          # 짧은 부팅 후 경과 시간 지적


def test_time_overlap_raises_confidence_to_high():
    crash = T0 + timedelta(minutes=12)
    v = V.build([dump(0x116, when=crash), dump(0x116, when=crash + timedelta(days=1))], evtx([storm()]))
    assert v["timeLinked"] and v["confidence"] == "높음", (v["confidence"], v["timeLinked"])
    assert top(v) == "gpu_link"
    assert "유력" in v["headline"]


def test_log_crash_event_inside_burst_counts_as_link():
    inside = (T0 + timedelta(minutes=5)).isoformat()
    v = V.build([dump(0x116, 500)], evtx([storm()], kp41=[{"time": inside, "bugcheckCode": None}]))
    assert v["timeLinked"]


def test_display_dumps_only_never_claims_hardware_link():
    v = V.build([dump(0x116, 10), dump(0x116, 500), dump(0x116, 900)], None)
    assert top(v) == "gpu_driver"
    assert v["confidence"] != "높음"
    assert "링크 불안정" not in v["headline"]
    assert any("이벤트 로그" in t for t in v["nextEvidence"])


def test_storm_on_non_gpu_slot_points_to_pcie_device_not_gpu():
    v = V.build([], evtx([storm(kind="chipset")]))
    assert top(v) == "pcie_device"
    assert not any(c["title"].startswith("그래픽카드 슬롯") for c in v["causes"][:1])


def test_memory_pattern():
    v = V.build([dump(0x1A, 10, gpu=()), dump(0x1A, 500, gpu=()), dump(0x4E, 900, gpu=())], None)
    assert top(v) == "memory"


def test_storage_pattern_uses_events_and_codes():
    v = V.build([dump(0x7A, 10, gpu=())], evtx(cats={"storage": 40}))
    assert top(v) == "storage"
    assert v["confidence"] in ("중간", "낮음")


def test_fatal_whea_points_to_cpu_hw():
    fatal = {"eventId": 18, "count": 3, "roleKind": "other", "role": "PCIe 루트 포트", "bdf": "00:1c.0",
             "peakPerMinute": 1, "linkQualityHits": 0, "correctable": [], "uncorrectable": [{"bit": 4, "name": "x", "count": 3}], "bursts": []}
    v = V.build([dump(0x124, 10, gpu=())], evtx([fatal]))
    assert top(v) == "cpu_hw"


def test_unexplained_power_loss_points_to_power():
    kp = [{"time": (T0 + timedelta(minutes=i)).isoformat(), "bugcheckCode": None} for i in range(6)]
    v = V.build([], evtx(kp41=kp))
    assert top(v) == "power"


def test_weak_or_empty_input_is_info_not_a_guess():
    for args in ([[], None], [[], evtx()], [[dump(0x999999, 10, gpu=())], None]):
        v = V.build(*args)
        assert v["confidence"] == "낮음"
        assert v["level"] in ("info", "warning")


def test_garbage_input_does_not_raise():
    bad = [{"stopCode": "zzz"}, {}, {"stopCode": None, "crashTime": "not-a-date", "uptimeMinutes": "x"}]
    v = V.build(bad, {"timeRange": {"start": "bad"}, "wheaDevices": [{"count": "x"}], "bugchecks": [{"time": None}]})
    assert "headline" in v


def test_small_storm_below_threshold_is_ignored():
    v = V.build([dump(0x116, 10)], evtx([storm(count=40)]))
    assert top(v) == "gpu_driver"


def test_filtered_single_provider_log_asks_for_full_system_log():
    e = evtx([storm()])
    e.update({"totalEvents": 12000, "distinctProviders": 1})
    v = V.build([dump(0x116, 10)], e)
    assert any("시스템 로그 전체" in t for t in v["nextEvidence"])
    e["distinctProviders"] = 25
    v = V.build([dump(0x116, 10)], e)
    assert not any("시스템 로그 전체" in t for t in v["nextEvidence"])


# ── 종료 재구성(shutdown_tracker) ─────────────────────────────────────────
def _m(minutes):
    return T0 + timedelta(minutes=minutes)


def test_tracker_reconstructs_crash_time_uptime_and_precursors():
    boots = [_m(0), _m(100)]                       # 두 번째 부팅이 종료 후 재부팅
    all_times = [_m(i) for i in range(0, 91, 5)] + [_m(100), _m(101)]   # 마지막 기록 = 90분
    prec = [(_m(85), "pcie_gpu"), (_m(87), "pcie_gpu"), (_m(60), "display")]   # 60분 것은 10분 창 밖
    sd = ST.derive([{"t": _m(103), "code": None, "power_button": False, "source": "kp41"}], boots, all_times, prec)
    assert len(sd) == 1
    assert sd[0]["time"] == _m(90) and sd[0]["uptimeMinutes"] == 90.0
    assert sd[0]["kind"] == "power-cut"
    assert sd[0]["precursors"] == {"pcie_gpu": 2}


def test_tracker_dedupes_41_and_6008_and_marks_bsod():
    u = [{"t": _m(103), "code": None, "power_button": False, "source": "6008"},
         {"t": _m(104), "code": 0x116, "power_button": False, "source": "kp41"}]
    sd = ST.derive(u, [_m(0), _m(100)], [_m(i) for i in range(0, 91, 10)], [])
    assert len(sd) == 1 and sd[0]["kind"] == "bsod" and sd[0]["code"] == 0x116


def _sd_evtx(n, gpu=0, none=0, kinds=None, consistent=False, storms=True):
    e = evtx([storm()] if storms else [])
    e["shutdownSummary"] = {"count": n, "perDay": 1.5, "spanDays": 4.0, "kinds": kinds or {"power-cut": n},
                            "medianUptimeMin": 40.0, "uptimeConsistent": consistent, "hourKst": [0] * 24,
                            "withPrecursor": ({"pcie_gpu": gpu} if gpu else {}), "noPrecursor": none}
    return e


def test_shutdowns_preceded_by_gpu_link_errors_give_high_confidence_without_dumps():
    v = V.build([], _sd_evtx(6, gpu=5))
    assert top(v) == "gpu_link" and v["timeLinked"] and v["confidence"] == "높음"
    assert any("직전 10분" in e for e in v["evidence"])


def test_shutdowns_without_precursors_point_to_power_not_link():
    v = V.build([], _sd_evtx(6, gpu=0, none=6, consistent=True, storms=False))
    assert top(v) in ("power", "thermal")
    assert any("직전 오류 기록 없이" in e for e in v["evidence"])


def test_storm_unrelated_to_shutdowns_is_not_called_the_cause():
    v = V.build([], _sd_evtx(5, gpu=0, none=5))
    assert v["confidence"] != "높음"
    assert any("근거는 약합니다" in e for e in v["evidence"])


def test_user_forced_power_button_shutdowns_are_not_power_evidence():
    e = evtx([])
    e["shutdownSummary"] = {"count": 4, "perDay": 0.1, "spanDays": 40.0, "kinds": {"power-button": 4},
                            "medianUptimeMin": 900.0, "uptimeConsistent": False, "hourKst": [0] * 24,
                            "withPrecursor": {}, "noPrecursor": 4}
    v = V.build([], e)
    assert top(v) != "power" or v["confidence"] == "낮음"


# ── 하드웨어 사실 · 증상 문진 ────────────────────────────────────────────
def _hw(**over):
    hw = {"schema": "itsvc-collect-v1", "collectedAt": "2026-09-19T05:00:00Z", "isAdmin": True,
          "os": {"caption": "Windows 11 Pro", "build": "26200", "uptimeHours": 10},
          "bios": {"version": "F65", "date": "2025-10-28"}, "cpu": [{"name": "CPU"}],
          "memory": [{"capacityGB": 16, "speed": 3200, "configuredSpeed": 3200, "smbiosType": 26}] * 2,
          "gpu": [{"name": "GPU", "link": {"currentSpeed": 4, "maxSpeed": 4, "currentWidth": 16, "maxWidth": 16}}],
          "disks": [{"model": "SSD", "mediaType": "SSD", "busType": "NVMe", "health": "Healthy", "operational": "OK", "sizeGB": 500, "wear": 5, "temperature": 40}],
          "power": {"aspmAC": 0}, "crashControl": {"dumpType": 3, "autoReboot": 1, "minidumpCount": 2}}
    hw.update(over)
    return hw


def test_hardware_rejects_foreign_json():
    try:
        HC.analyze({"hello": "world"})
    except ValueError:
        return
    raise AssertionError("다른 JSON을 받아들이면 안 된다")


def test_hardware_healthy_pc_has_no_critical_findings():
    r = HC.analyze(_hw())
    assert not [f for f in r["findings"] if f["level"] == "critical"]
    assert not r["signals"].get("gpuLinkDegraded")


def test_gpu_link_width_drop_is_direct_evidence():
    r = HC.analyze(_hw(gpu=[{"name": "GPU", "link": {"currentSpeed": 4, "maxSpeed": 4, "currentWidth": 8, "maxWidth": 16}}]))
    assert r["signals"]["gpuLinkDegraded"] and r["findings"][0]["level"] == "critical"
    v = V.build([dump(0x116, 10)], None, hardware=r)
    assert top(v) == "gpu_link"
    assert any("링크 폭" in e for e in v["evidence"])


def test_idle_link_speed_drop_alone_is_only_informational():
    r = HC.analyze(_hw(gpu=[{"name": "GPU", "link": {"currentSpeed": 1, "maxSpeed": 4, "currentWidth": 16, "maxWidth": 16}}]))
    assert not r["signals"].get("gpuLinkDegraded")
    assert all(f["level"] == "info" for f in r["findings"] if "링크 속도" in f["title"])


def test_failing_disk_dominates_storage_hypothesis():
    r = HC.analyze(_hw(disks=[{"model": "SSD", "mediaType": "SSD", "busType": "SATA", "health": "Warning", "operational": "OK", "sizeGB": 500, "wear": 96}]))
    assert r["signals"]["diskFailing"]
    v = V.build([dump(0x7A, 10, gpu=())], None, hardware=r)
    assert top(v) == "storage" and v["confidence"] in ("중간", "높음")


def test_dump_disabled_is_reported_and_requests_action():
    r = HC.analyze(_hw(crashControl={"dumpType": 0, "autoReboot": 1, "minidumpCount": 0}))
    assert r["signals"]["dumpDisabled"] and any("덤프" in t for t in r["nextEvidence"])


def test_missing_smart_details_ask_for_admin_run():
    r = HC.analyze(_hw(disks=[{"model": "SSD", "mediaType": "SSD", "busType": "NVMe", "health": "Healthy", "operational": "OK", "sizeGB": 500}]))
    assert any("관리자" in t for t in r["nextEvidence"])


def test_symptoms_shift_priors_but_never_create_a_diagnosis_alone():
    v = V.build([], None, symptoms={"types": ["power-off", "load"], "perDay": 2})
    assert v["confidence"] == "낮음" and v["scores"] == []            # 문진만으로는 진단하지 않는다
    assert any("증상 문진" in e for e in v["evidence"])
    kp = [{"time": (T0 + timedelta(minutes=i)).isoformat(), "bugcheckCode": None} for i in range(4)]
    base = V.build([], evtx(kp41=kp))
    with_sym = V.build([], evtx(kp41=kp), symptoms={"types": ["power-off"]})
    get = lambda v, k: next(s["score"] for s in v["scores"] if s["key"] == k)
    assert get(with_sym, "power") > get(base, "power")


def test_screen_symptom_supports_gpu_hypotheses_when_evidence_exists():
    v = V.build([dump(0x116, 10), dump(0x116, 500)], None, symptoms={"types": ["screen-off"]})
    assert top(v) == "gpu_driver"


def test_low_quality_bits_reduce_storm_weight():
    strong = V.build([], evtx([storm(quality=1.2)]))
    weak = V.build([], evtx([storm(quality=0.05)]))
    assert strong["scores"][0]["score"] > weak["scores"][0]["score"]


def test_application_dumps_are_not_counted_as_bsod_dumps():
    app = {"dumpKind": "application", "processName": "game.exe", "exceptionCode": "0xc0000005", "crashTime": "2026-09-14T06:14:34+00:00"}
    v = V.build([dump(0x116, 10), app], None)
    assert v["context"]["dumpCount"] == 1
    assert any("프로그램 크래시 덤프 1개" in e for e in v["evidence"])


def test_single_tdr_dump_is_not_described_as_repeating():
    v = V.build([dump(0x116, 10)], None)
    assert "반복되고" not in v["headline"] and "덤프 1건" in v["headline"]
    assert "반복되고" in V.build([dump(0x116, 10), dump(0x116, 500)], None)["headline"]


def _ef(name, same=True, **kw):
    d = dump(0xEF, **kw)
    d["crashProcess"] = {"name": name, "sameAsParam1": same}
    return d


def test_critical_process_died_adds_evidence_and_steps_without_changing_ranking():
    plain = V.build([dump(0xEF, 5), dump(0xEF, 60)], None)
    v = V.build([_ef("csrss.exe", when=T0 - timedelta(days=2, minutes=5)), _ef("csrss.exe", when=T0 - timedelta(days=2, minutes=60))], None)
    text = " ".join(v["evidence"])
    assert "csrss.exe 2건" in text and "같은 프로세스(csrss.exe)가 덤프 2개에서 반복" in text
    assert any("DISM /Online" in s for s in v["steps"])
    assert [c["title"] for c in v["causes"]] == [c["title"] for c in plain["causes"]]
    assert not any("DISM /Online" in s for s in plain["steps"])


def test_unconfirmed_process_is_labeled_as_running_process():
    v = V.build([_ef("wininit.exe", same=False)], None)
    text = " ".join(v["evidence"])
    assert "wininit.exe 1건" in text and "크래시 당시 실행 중이던 프로세스" in text


def test_weak_verdict_still_shows_critical_process_steps():
    v = V.build([_ef("lsass.exe")], None)
    assert v["causes"] == [] and any("sfc /scannow" in s for s in v["steps"])


def test_dump_outside_log_window_is_flagged_even_without_pcie_storm():
    d = dump(0x1A, when=T0 - timedelta(days=90))
    v = V.build([d], evtx(cats={"storage": 5}))
    text = " ".join(v["evidence"])
    assert "이벤트 로그 기록 기간" in text and "밖입니다" in text
    assert any("앞뒤 하루" in x for x in v["nextEvidence"])
    inside = V.build([dump(0x1A, when=T0 + timedelta(minutes=5))], evtx(cats={"storage": 5}))
    assert "밖입니다" not in " ".join(inside["evidence"])


def test_sudden_power_loss_without_precursor_does_not_single_out_psu():
    # 실제 사례(샘플 PC)는 CPU 불량이었는데 예전 판정은 전원공급장치만 높게 봤다. 같은 증거는 PSU·CPU·보드와 모두 맞는다.
    ev = evtx()
    ev["shutdownSummary"] = {"count": 18, "kinds": {"power-cut": 18}, "noPrecursor": 16, "withPrecursor": {}, "spanDays": 7, "perDay": 2.6}
    v = V.build([], ev)
    keys = [x["key"] for x in v["scores"]]
    assert "power" in keys and "cpu_hw" in keys
    assert "구분할 수 없어" in v["headline"]
    assert any(c["title"].startswith("CPU") for c in v["causes"])
    assert any("다른 CPU" in x for x in v["steps"])


def _kernel_dump(code, uptime=None, days=0):
    d = dump(code, uptime=uptime, when=T0 - timedelta(days=days))
    d["stackModules"] = []   # 호출 스택을 읽었고 외부 드라이버는 없음
    d["stackExternalModules"] = []
    return d


def test_varied_bugcheck_codes_without_a_culprit_point_to_memory():
    # 실제 메모리 불량 사례: 0x7E·0x1E·0x1A가 번갈아 나오고 모두 커널 안에서 발생, 외부 드라이버 없음
    v = V.build([_kernel_dump(0x7E, 0.3, 3), _kernel_dump(0x1E, 21599, 2), _kernel_dump(0x1A, 0.3, 1)], None)
    assert v["scores"][0]["key"] == "memory"
    assert "서로 다르고" in " ".join(v["evidence"])
    # 같은 코드가 반복되면 이 규칙을 쓰지 않는다
    same = V.build([_kernel_dump(0x1A, 1, 3), _kernel_dump(0x1A, 1, 2), _kernel_dump(0x1A, 1, 1)], None)
    assert "서로 다르고" not in " ".join(same["evidence"])


def test_variant_code_counts_as_its_base_code():
    d = dump(0x1000007E)
    assert V._code(d) == 0x7E


def _cut(h_kst, up, day):
    t = datetime(2026, 8, day, h_kst, 0, tzinfo=timezone(timedelta(hours=9))).astimezone(timezone.utc)
    return {"time": t.isoformat(), "loggedAt": t.isoformat(), "kind": "power-cut", "code": None, "uptimeMinutes": up, "precursors": {}}


def test_early_boot_and_routine_power_cuts_are_not_counted_as_psu_evidence():
    cuts = [_cut(18, 2000, 3), _cut(18, 2100, 10), _cut(17, 2200, 17), _cut(14, 0.1, 18)]
    ev = evtx()
    ev["shutdownSummary"] = {"count": 4, "kinds": {"power-cut": 4}, "noPrecursor": 4, "withPrecursor": {}, "spanDays": 20}
    ev["shutdowns"] = cuts
    ev["notable"] = [{"provider": "volmgr", "id": 162, "count": 2}]
    v = V.build([], ev)
    text = " ".join(v["evidence"])
    assert "부팅 후 2분 안에 꺼졌습니다" in text and "volmgr 162가 2건" in text
    assert "전원 불량 근거에서 뺐습니다" in text
    assert "power" not in [s["key"] for s in v["scores"]]


def test_repeated_bucket_and_memory_manager_location_are_reported():
    def kd(code, bucket, symbol, days):
        d = _kernel_dump(code, 5, days)
        d["failureBucket"], d["faultingSymbol"] = bucket, symbol
        return d
    v = V.build([kd(0x1A, "0x1a_3453_nt!MiDeleteFinalPageTables", "nt!MiDeleteFinalPageTables+0x20a", 3),
                 kd(0x1A, "0x1a_3453_nt!MiDeleteFinalPageTables", "nt!MiDeleteFinalPageTables+0x20a", 2)], None)
    text = " ".join(v["evidence"])
    assert "같은 실패 버킷(0x1a_3453_nt!MiDeleteFinalPageTables)이 덤프 2개에서 반복" in text
    assert "메모리 관리자(nt!Mi" in text and "드라이버가 원인이라는 근거는 아닙니다" in text
    one = V.build([kd(0x1A, "0x1a_3453_nt!MiX", "nt!MiX+0x1", 1)], None)
    assert "메모리 관리자" not in " ".join(one["evidence"])   # 1개만으로는 쓰지 않는다


if __name__ == "__main__":
    tests = [(n, f) for n, f in sorted(globals().items()) if n.startswith("test_") and callable(f)]
    failed = 0
    for name, fn in tests:
        try:
            fn()
            print("PASS", name)
        except Exception as exc:  # noqa: BLE001 - 테스트 러너
            failed += 1
            print("FAIL", name, "->", repr(exc))
    print(f"{len(tests) - failed}/{len(tests)} passed")
    raise SystemExit(1 if failed else 0)
