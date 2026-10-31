"""improvement_store 회귀 테스트. 실행: python test_improvement_store.py (pytest도 가능)

동의한 사용자의 요약만 저장되는지, 허용하지 않은 필드·개인정보가 걸러지는지, 90일이 지난 기록이 정리되는지 확인한다.
"""
import json
import os
import tempfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

import improvement_store as S


def _use_tmp(name="log.jsonl"):
    path = Path(tempfile.mkdtemp()) / name
    os.environ["AI_IMPROVEMENT_STORAGE_PATH"] = str(path)
    return path


def _lines(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]


def test_event_sample_keeps_only_allowed_fields():
    path = _use_tmp()
    sample_id = S.store_sample("event", {
        "events": [
            {"i": 41, "s": "Microsoft-Windows-Kernel-Power", "l": 1, "t": 0, "b": 0, "p": 0,
             "message": "PC-HONG 사용자 hong@example.com", "computer": "HONG-PC"},
            {"i": 18, "s": "Microsoft-Windows-WHEA-Logger", "l": 2, "t": 30, "et": "Cache Hierarchy", "es": "MCE"},
            {"i": 4101, "s": "C:\\Users\\hong\\x", "l": 3, "t": 5},  # 원본 이름 형식이 아니라 버려진다
        ],
        "boots": 3, "rules": [{"k": "R3", "n": 2}, {"k": "evil", "n": 1}], "rulesVersion": "combo-20261031",
    })
    record = _lines(path)[0]
    assert record["id"] == sample_id and record["kind"] == "event"
    events = record["data"]["events"]
    assert len(events) == 2
    assert set(events[0]) == {"i", "s", "l", "t", "b", "p"}
    assert events[1]["et"] == "Cache Hierarchy"
    text = path.read_text(encoding="utf-8")
    assert "hong" not in text.lower() and "message" not in text and "computer" not in text
    assert record["data"]["rules"] == [{"k": "R3", "n": 2}]
    assert record["data"]["rulesVersion"] == "combo-20261031"


def test_event_sample_rejects_empty_and_bad_kind():
    _use_tmp()
    for kind, data in (("event", {"events": []}), ("event", {"events": [{"i": "x", "s": "A"}]}),
                       ("nope", {}), ("event", "text")):
        try:
            S.store_sample(kind, data)
        except ValueError:
            continue
        raise AssertionError(f"{kind} {data} 는 거부돼야 한다")


def test_hwinfo_sample_redacts_and_limits():
    path = _use_tmp()
    S.store_sample("hwinfo", {
        "source": "hwinfo", "maxTemp": 93.456,
        "alerts": [{"severity": "high", "title": "CPU 온도 93°C (user@example.com)"}] * 20,
    })
    data = _lines(path)[0]["data"]
    assert data["maxTemp"] == 93.5 and len(data["alerts"]) == S.MAX_ALERTS
    assert "example.com" not in path.read_text(encoding="utf-8")
    try:
        S.store_sample("hwinfo", {"source": "secret", "maxTemp": 1})
    except ValueError:
        return
    raise AssertionError("허용하지 않은 로그 종류는 거부돼야 한다")


def test_dump_result_keeps_codes_only():
    clean = S.sanitize_dump_result({
        "stopCode": "0x0000009F", "stopCodeName": "DRIVER_POWER_STATE_FAILURE", "faultingModule": "nvlddmkm.sys",
        "osBuild": "26100.1", "dumpFormat": "mdmp", "processName": "C:\\Users\\hong\\app.exe",
        "modules": ["a"], "crashTime": "2026-09-18T07:54:00",
    })
    assert clean == {"stopCode": "0000009f", "stopCodeName": "DRIVER_POWER_STATE_FAILURE",
                     "faultingModule": "nvlddmkm.sys", "osBuild": "26100.1", "dumpFormat": "mdmp"}


def test_feedback_is_minimal():
    path = _use_tmp()
    S.store_feedback("event", True, ["R3", "bad"], "0123456789ab")
    S.store_feedback("hwinfo", False, None, "not-an-id")
    first, second = _lines(path)
    assert first["helpful"] is True and first["rules"] == ["R3"] and first["sample_id"] == "0123456789ab"
    assert second["helpful"] is False and "sample_id" not in second


def test_expired_records_are_pruned_on_write():
    path = _use_tmp()
    old = (datetime.now(timezone(timedelta(hours=9))) - timedelta(days=91)).isoformat(timespec="seconds")
    path.write_text(json.dumps({"recorded_at": old, "kind": "feedback", "helpful": True}) + "\n", encoding="utf-8")
    S.store_feedback("event", True)
    records = _lines(path)
    assert len(records) == 1 and records[0]["recorded_at"] != old


def test_payload_size_limit():
    _use_tmp()
    big = {"events": [{"i": 1, "s": "A", "l": 1, "t": 1, "et": "x" * 39}] * 5000, "pad": "y" * S.MAX_PAYLOAD_BYTES}
    try:
        S.store_sample("event", big)
    except ValueError:
        return
    raise AssertionError("큰 요청은 거부돼야 한다")


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
