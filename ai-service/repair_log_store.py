"""작업자가 직접 입력하는 수리 사례 기록.

증상 → 처음 의심한 부품 → 실제 원인 → 해결 방법을 정해진 보기에서 골라 저장한다.
고객을 알아볼 수 있는 정보는 받지 않는다. 자유 입력(한 줄 메모)은 저장 전에 연락처·이메일 등을 가린다.
원본은 서버의 data 폴더에만 두고 Git에는 올리지 않는다. 사이트에는 집계 결과만 쓴다.
"""

import json
import os
import re
import uuid
from collections import Counter
from datetime import datetime, timedelta, timezone
from pathlib import Path

from inquiry_store import redact_inquiry

SEOUL_TIMEZONE = timezone(timedelta(hours=9))
DEFAULT_STORAGE_PATH = Path(__file__).resolve().parent / "data" / "repair-log.jsonl"
NOTE_MAX_LENGTH = 200

DEVICES = {
    "desktop": "데스크톱",
    "laptop": "노트북",
    "mini": "일체형·미니PC",
}

SYMPTOMS = {
    "no-display": "화면이 안 나옴",
    "artifacts": "화면 깨짐·줄·깜빡임",
    "game-crash": "게임·작업 중 꺼짐·재부팅",
    "bsod": "블루스크린",
    "no-boot": "부팅 안 됨·무한 재부팅",
    "no-power": "전원이 안 켜짐",
    "freeze": "멈춤·느려짐",
    "storage": "저장장치 인식 안 됨·끊김",
    "heat-noise": "발열·소음",
    "network": "인터넷·네트워크",
    "peripheral": "USB·소리·주변기기",
    "other": "기타",
}

PARTS = {
    "gpu": "그래픽카드",
    "ram": "메모리",
    "board": "메인보드",
    "psu": "파워",
    "storage": "저장장치",
    "cpu": "CPU·쿨러",
    "cable": "케이블·포트",
    "display": "모니터·주변기기",
    "software": "윈도우·드라이버",
    "unknown": "모름",
}

FIXES = {
    "replace": "부품 교체",
    "reseat": "재장착·청소",
    "cable": "케이블·포트 변경",
    "setting": "설정·BIOS 변경",
    "driver": "드라이버·업데이트",
    "reinstall": "윈도우 재설치",
    "unresolved": "해결 못 함",
}

RECURRENCE = {
    "none": "재발 없음 확인",
    "recurred": "재발함",
    "unchecked": "아직 모름",
}

_ID_PATTERN = re.compile(r"^[0-9a-f]{12}$")


def _storage_path() -> Path:
    return Path(os.environ.get("REPAIR_LOG_STORAGE_PATH", DEFAULT_STORAGE_PATH))


def _choice(value, allowed: dict, label: str) -> str:
    if not isinstance(value, str) or value not in allowed:
        raise ValueError(f"{label} 값을 보기에서 골라 주세요.")
    return value


def _note(value) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        raise ValueError("메모는 글자로 입력해 주세요.")
    text = redact_inquiry(re.sub(r"\s+", " ", value))
    return text[:NOTE_MAX_LENGTH]


def _read_all() -> list[dict]:
    path = _storage_path()
    if not path.exists():
        return []
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(record, dict) and _ID_PATTERN.match(str(record.get("id", ""))):
            records.append(record)
    return records


def _write_all(records: list[dict]) -> None:
    path = _storage_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    body = "".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) + "\n" for r in records)
    temporary_path.write_text(body, encoding="utf-8")
    os.chmod(temporary_path, 0o600)
    temporary_path.replace(path)


def options() -> dict:
    """입력 화면이 그리는 보기 목록."""
    return {
        "devices": DEVICES,
        "symptoms": SYMPTOMS,
        "parts": PARTS,
        "fixes": FIXES,
        "recurrence": RECURRENCE,
        "note_max_length": NOTE_MAX_LENGTH,
    }


def add_case(data: dict) -> dict:
    """사례 한 건을 검증해 저장하고 저장된 기록을 돌려준다."""
    if not isinstance(data, dict):
        raise ValueError("입력 형식이 올바르지 않습니다.")
    record = {
        "id": uuid.uuid4().hex[:12],
        "recorded_at": datetime.now(SEOUL_TIMEZONE).isoformat(timespec="seconds"),
        "device": _choice(data.get("device"), DEVICES, "기기 종류"),
        "symptom": _choice(data.get("symptom"), SYMPTOMS, "증상"),
        "suspected": _choice(data.get("suspected"), PARTS, "처음 의심한 부품"),
        "cause": _choice(data.get("cause"), PARTS, "실제 원인"),
        "fix": _choice(data.get("fix"), FIXES, "해결 방법"),
        "recurrence": _choice(data.get("recurrence", "unchecked"), RECURRENCE, "재발 여부"),
        "note": _note(data.get("note")),
    }
    records = _read_all()
    records.append(record)
    _write_all(records)
    return record


def recent_cases(limit: int = 20) -> list[dict]:
    records = _read_all()
    return list(reversed(records[-max(1, min(limit, 200)):]))


def update_recurrence(case_id: str, recurrence: str) -> bool:
    """나중에 재발 여부를 확인했을 때 그 값만 바꾼다."""
    _choice(recurrence, RECURRENCE, "재발 여부")
    records = _read_all()
    for record in records:
        if record["id"] == case_id:
            record["recurrence"] = recurrence
            _write_all(records)
            return True
    return False


def delete_case(case_id: str) -> bool:
    records = _read_all()
    kept = [r for r in records if r["id"] != case_id]
    if len(kept) == len(records):
        return False
    _write_all(kept)
    return True


def stats() -> dict:
    """증상별 실제 원인 건수와, 처음 의심이 빗나간 건수를 집계한다. 메모는 포함하지 않는다."""
    records = _read_all()
    by_symptom: dict[str, dict] = {}
    for record in records:
        symptom = record.get("symptom")
        cause = record.get("cause")
        if symptom not in SYMPTOMS or cause not in PARTS:
            continue
        entry = by_symptom.setdefault(symptom, {
            "label": SYMPTOMS[symptom], "total": 0, "causes": Counter(),
            "suspected_wrong": 0, "unresolved": 0,
        })
        entry["total"] += 1
        if record.get("fix") == "unresolved":
            entry["unresolved"] += 1
            continue
        entry["causes"][cause] += 1
        suspected = record.get("suspected")
        if suspected in PARTS and suspected not in ("unknown", cause):
            entry["suspected_wrong"] += 1
    result = []
    for symptom, entry in sorted(by_symptom.items(), key=lambda item: -item[1]["total"]):
        result.append({
            "symptom": symptom,
            "label": entry["label"],
            "total": entry["total"],
            "unresolved": entry["unresolved"],
            "suspected_wrong": entry["suspected_wrong"],
            "causes": [
                {"part": part, "label": PARTS[part], "count": count}
                for part, count in entry["causes"].most_common()
            ],
        })
    return {"total": len(records), "symptoms": result}
