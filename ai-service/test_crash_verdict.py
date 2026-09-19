"""crash_verdict 회귀 테스트. 실행: python test_crash_verdict.py (pytest도 가능)

실제 사용자 파일 대신 합성 입력만 쓴다. 판단 엔진이 (1) 출처가 하나뿐일 때 과신하지 않고,
(2) 시각이 겹칠 때만 확정 수준으로 올리고, (3) 여러 유형의 사례를 가려내는지 확인한다.
"""
from datetime import datetime, timedelta, timezone

import crash_verdict as V

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


def test_low_quality_bits_reduce_storm_weight():
    strong = V.build([], evtx([storm(quality=1.2)]))
    weak = V.build([], evtx([storm(quality=0.05)]))
    assert strong["scores"][0]["score"] > weak["scores"][0]["score"]


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
