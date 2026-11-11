"""repair_log_store 회귀 테스트. 실행: python test_repair_log_store.py (pytest도 가능)

보기 밖의 값이 거부되는지, 메모의 연락처가 가려지는지, 집계가 맞는지 확인한다.
"""
import json
import os
import tempfile
from pathlib import Path

import repair_log_store as S


def _use_tmp():
    path = Path(tempfile.mkdtemp()) / "repair-log.jsonl"
    os.environ["REPAIR_LOG_STORAGE_PATH"] = str(path)
    return path


def _case(**overrides):
    base = {"device": "desktop", "symptom": "artifacts", "suspected": "gpu", "cause": "ram",
            "fix": "replace", "recurrence": "none", "note": "메모리 검사 도중 멈춤"}
    base.update(overrides)
    return base


def test_add_and_read_back():
    path = _use_tmp()
    record = S.add_case(_case())
    stored = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines()]
    assert len(stored) == 1 and stored[0]["id"] == record["id"]
    assert stored[0]["cause"] == "ram" and stored[0]["note"] == "메모리 검사 도중 멈춤"
    assert oct(path.stat().st_mode & 0o777) == "0o600"


def test_rejects_values_outside_choices():
    _use_tmp()
    for field in ("device", "symptom", "suspected", "cause", "fix", "recurrence"):
        try:
            S.add_case(_case(**{field: "<script>"}))
        except ValueError:
            continue
        raise AssertionError(f"{field} 검증이 빠졌습니다")
    assert S.recent_cases() == []


def test_note_is_redacted_and_trimmed():
    _use_tmp()
    record = S.add_case(_case(note="홍길동 010-1234-5678 hong@example.com 방문\n\n" + "가" * 400))
    assert "010-1234-5678" not in record["note"] and "hong@example.com" not in record["note"]
    assert "\n" not in record["note"] and len(record["note"]) <= S.NOTE_MAX_LENGTH


def test_stats_counts_causes_and_wrong_first_guess():
    _use_tmp()
    S.add_case(_case())                                  # 그래픽카드 의심 → 메모리
    S.add_case(_case(suspected="ram"))                   # 의심이 맞음
    S.add_case(_case(suspected="unknown", cause="gpu"))  # 의심 없음
    S.add_case(_case(fix="unresolved"))                  # 해결 못 함: 원인 집계 제외
    S.add_case(_case(symptom="storage", suspected="cable", cause="psu"))
    data = S.stats()
    assert data["total"] == 5
    artifacts = next(s for s in data["symptoms"] if s["symptom"] == "artifacts")
    assert artifacts["total"] == 4 and artifacts["unresolved"] == 1
    assert {c["part"]: c["count"] for c in artifacts["causes"]} == {"ram": 2, "gpu": 1}
    assert artifacts["suspected_wrong"] == 1
    assert "note" not in json.dumps(data)


def test_update_recurrence_and_delete():
    _use_tmp()
    first = S.add_case(_case(recurrence="unchecked"))
    second = S.add_case(_case())
    assert S.update_recurrence(first["id"], "none") is True
    assert S.update_recurrence("000000000000", "none") is False
    assert S.delete_case(second["id"]) is True
    assert S.delete_case(second["id"]) is False
    remaining = S.recent_cases()
    assert len(remaining) == 1 and remaining[0]["recurrence"] == "none"


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
