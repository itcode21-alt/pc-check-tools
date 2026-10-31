"""동의한 사용자의 로그 분석 결과를 익명화 요약으로만 보관한다.

원본 로그·덤프·이벤트 메시지 본문은 받지도 저장하지도 않는다. 종류별로 허용한 필드만 검증해 통과한
값만 남기고, 나머지는 버린다. 보관 기간은 90일이며 만료된 기록은 다음 저장 때 정리한다.
"""

import json
import os
import re
import threading
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

from inquiry_store import REDACTION_PATTERNS

SEOUL_TIMEZONE = timezone(timedelta(hours=9))
DEFAULT_RETENTION_DAYS = 90
DEFAULT_STORAGE_PATH = Path(__file__).resolve().parent / "data" / "log-improvement.jsonl"

MAX_EVENTS = 5000
MAX_ALERTS = 12
MAX_RULES = 12
MAX_PAYLOAD_BYTES = 400 * 1024

SAMPLE_KINDS = ("event", "hwinfo", "minidump")
HWINFO_SOURCES = ("hwinfo", "crystaldiskinfo", "dxdiag", "msinfo32", "generic")

_LOCK = threading.Lock()
_SOURCE_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._\-]{0,63}$")
_RULE_RE = re.compile(r"^R\d{1,2}$")
_ENUM_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9 ._\-]{0,39}$")
_VERSION_RE = re.compile(r"^[A-Za-z0-9._\-]{1,40}$")
_HEX_RE = re.compile(r"^(0x)?[0-9A-Fa-f]{1,16}$")
_MODULE_RE = re.compile(r"^[A-Za-z0-9._\-]{1,64}$")
_BUILD_RE = re.compile(r"^[0-9.]{1,32}$")
_NAME_RE = re.compile(r"^[A-Z0-9_]{1,80}$")


def _int(value: Any, low: int, high: int) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or not low <= value <= high:
        raise ValueError("허용 범위를 벗어난 숫자입니다.")
    return value


def _redact(text: str) -> str:
    for pattern, replacement in REDACTION_PATTERNS:
        text = pattern.sub(replacement, text)
    return text


def _rules(raw: Any) -> list[dict]:
    if not isinstance(raw, list):
        return []
    rules = []
    for item in raw[:MAX_RULES]:
        if isinstance(item, dict) and _RULE_RE.match(str(item.get("k", ""))):
            rules.append({"k": item["k"], "n": _int(item.get("n", 1), 0, 100000)})
    return rules


def _sanitize_event(data: dict) -> dict:
    events = data.get("events")
    if not isinstance(events, list) or not events:
        raise ValueError("이벤트 목록이 비어 있습니다.")
    clean = []
    for item in events[:MAX_EVENTS]:
        if not isinstance(item, dict):
            continue
        source = item.get("s")
        if not isinstance(source, str) or not _SOURCE_RE.match(source):
            continue
        try:
            row = {
                "i": _int(item.get("i"), 0, 65535),
                "s": source,
                "l": _int(item.get("l", 0), 0, 5),
                # 첫 이벤트를 0으로 둔 상대 초. 실제 날짜·시각은 받지 않는다.
                "t": _int(item.get("t", 0), 0, 10**8),
            }
            if "b" in item:
                row["b"] = _int(item["b"], 0, 2**32 - 1)
            if "p" in item:
                row["p"] = _int(item["p"], 0, 1)
            # WHEA 오류 유형·원본처럼 짧은 열거형 값만 받는다(자유 문장은 받지 않는다).
            for key in ("et", "es"):
                value = item.get(key)
                if isinstance(value, str) and _ENUM_RE.match(value):
                    row[key] = value
        except ValueError:
            continue
        clean.append(row)
    if not clean:
        raise ValueError("유효한 이벤트가 없습니다.")
    version = str(data.get("rulesVersion", ""))
    return {
        "events": clean,
        "boots": _int(data.get("boots", 0), 0, 100000),
        "rules": _rules(data.get("rules")),
        "rulesVersion": version if _VERSION_RE.match(version) else "",
    }


def _sanitize_hwinfo(data: dict) -> dict:
    source = data.get("source")
    if source not in HWINFO_SOURCES:
        raise ValueError("지원하지 않는 로그 종류입니다.")
    max_temp = data.get("maxTemp")
    if max_temp is not None:
        if isinstance(max_temp, bool) or not isinstance(max_temp, (int, float)) or not -50 <= max_temp <= 200:
            raise ValueError("온도 범위를 벗어났습니다.")
        max_temp = round(float(max_temp), 1)
    alerts = []
    for item in (data.get("alerts") or [])[:MAX_ALERTS]:
        if not isinstance(item, dict):
            continue
        title = item.get("title")
        severity = item.get("severity")
        if isinstance(title, str) and title.strip():
            alerts.append({"severity": severity if severity in ("high", "medium", "low", "info") else "info",
                           "title": _redact(title.strip())[:80]})
    return {"source": source, "maxTemp": max_temp, "alerts": alerts}


def sanitize_dump_result(result: dict) -> dict:
    """서버가 만든 덤프 분석 결과에서 코드·모듈명 같은 허용 필드만 남긴다."""
    clean: dict = {}
    code = str(result.get("stopCode") or "")
    if _HEX_RE.match(code):
        clean["stopCode"] = code.lower().removeprefix("0x")
    name = str(result.get("stopCodeName") or "")
    if _NAME_RE.match(name):
        clean["stopCodeName"] = name
    module = str(result.get("faultingModule") or "")
    if _MODULE_RE.match(module):
        clean["faultingModule"] = module
    build = str(result.get("osBuild") or "")
    if _BUILD_RE.match(build):
        clean["osBuild"] = build
    for key in ("dumpFormat", "dumpKind", "arch"):
        value = str(result.get(key) or "")
        if re.match(r"^[A-Za-z0-9_\-]{1,24}$", value):
            clean[key] = value
    if not clean:
        raise ValueError("저장할 분석 결과가 없습니다.")
    return clean


def sanitize_sample(kind: str, data: Any) -> dict:
    if kind not in SAMPLE_KINDS:
        raise ValueError("지원하지 않는 종류입니다.")
    if not isinstance(data, dict):
        raise ValueError("데이터 형식이 올바르지 않습니다.")
    if len(json.dumps(data, ensure_ascii=False)) > MAX_PAYLOAD_BYTES:
        raise ValueError("데이터가 너무 큽니다.")
    if kind == "event":
        return _sanitize_event(data)
    if kind == "hwinfo":
        return _sanitize_hwinfo(data)
    return sanitize_dump_result(data)


def _storage_path() -> Path:
    return Path(os.environ.get("AI_IMPROVEMENT_STORAGE_PATH", DEFAULT_STORAGE_PATH))


def _retention_days() -> int:
    return max(1, int(os.environ.get("AI_IMPROVEMENT_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)))


def _recorded_at(line: str) -> Optional[datetime]:
    try:
        return datetime.fromisoformat(str(json.loads(line)["recorded_at"]))
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def _append(record: dict) -> None:
    path = _storage_path()
    now = datetime.now(SEOUL_TIMEZONE)
    cutoff = now - timedelta(days=_retention_days())
    record["recorded_at"] = now.isoformat(timespec="seconds")
    line = json.dumps(record, ensure_ascii=False, separators=(",", ":"))
    with _LOCK:
        path.parent.mkdir(parents=True, exist_ok=True)
        if path.exists():
            lines = path.read_text(encoding="utf-8").splitlines()
            # 가장 오래된 줄이 만료됐을 때만 전체를 다시 쓴다. 평소에는 한 줄만 덧붙인다.
            first = _recorded_at(lines[0]) if lines else None
            if first is not None and first < cutoff:
                kept = [value for value in lines if (_recorded_at(value) or cutoff) >= cutoff]
                temporary = path.with_suffix(f"{path.suffix}.tmp")
                temporary.write_text("\n".join(kept + [line]) + "\n", encoding="utf-8")
                os.chmod(temporary, 0o600)
                temporary.replace(path)
                return
        else:
            path.touch(mode=0o600)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")


def store_sample(kind: str, data: Any) -> str:
    """검증을 통과한 익명화 요약을 저장하고 기록 ID를 돌려준다."""
    clean = sanitize_sample(kind, data)
    sample_id = uuid.uuid4().hex[:12]
    _append({"id": sample_id, "kind": kind, "data": clean})
    return sample_id


def store_feedback(kind: str, helpful: bool, rules: Any = None, sample_id: Optional[str] = None) -> None:
    """엄지 피드백 한 건. 자유 입력은 받지 않는다."""
    if kind not in SAMPLE_KINDS:
        raise ValueError("지원하지 않는 종류입니다.")
    record = {
        "kind": "feedback",
        "for": kind,
        "helpful": bool(helpful),
        "rules": [item["k"] for item in _rules([{"k": key} for key in (rules or [])])],
    }
    if sample_id and re.match(r"^[0-9a-f]{12}$", sample_id):
        record["sample_id"] = sample_id
    _append(record)
