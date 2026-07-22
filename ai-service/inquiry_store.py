"""선택 동의한 AI 문의를 사이트 자료 개선용으로 익명화해 보관한다."""

import json
import os
import re
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable, Optional


SEOUL_TIMEZONE = timezone(timedelta(hours=9))
DEFAULT_RETENTION_DAYS = 90
DEFAULT_STORAGE_PATH = Path(__file__).resolve().parent / "data" / "ai-inquiries.jsonl"

# 문의 원문에 섞이기 쉬운 직접 식별정보와 기기 식별 경로를 저장 전에 치환한다.
REDACTION_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE), "[이메일 가림]"),
    (re.compile(r"(?<!\d)(?:01[016789])[- .]?\d{3,4}[- .]?\d{4}(?!\d)"), "[전화번호 가림]"),
    (re.compile(r"(?<!\d)(?:\d{1,3}\.){3}\d{1,3}(?!\d)"), "[IP 주소 가림]"),
    (re.compile(r"(?i)\b[A-Z]:\\Users\\[^\\\s]+"), r"C:\\Users\\[사용자명 가림]"),
    (re.compile(r"(?i)/Users/[^/\s]+"), "/Users/[사용자명 가림]"),
    (re.compile(r"(?i)(사용자(?:명)?|이름|성명|컴퓨터\s*이름|장치\s*이름)\s*[:=]\s*[^,\n]+"), r"\1: [가림]"),
)


def redact_inquiry(question: str) -> str:
    """저장 목적에 불필요한 식별 가능 문자열을 제거하고 공백을 정리한다."""
    redacted = question.strip()
    for pattern, replacement in REDACTION_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return re.sub(r"[ \t]{2,}", " ", redacted)


def _parse_recorded_at(record: dict) -> Optional[datetime]:
    try:
        return datetime.fromisoformat(str(record["recorded_at"]))
    except (KeyError, TypeError, ValueError):
        return None


def _retained_lines(lines: Iterable[str], cutoff: datetime) -> list[str]:
    retained: list[str] = []
    for line in lines:
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue
        recorded_at = _parse_recorded_at(record)
        if recorded_at is not None and recorded_at >= cutoff:
            retained.append(json.dumps(record, ensure_ascii=False, separators=(",", ":")))
    return retained


def store_inquiry(question: str, source_ids: list[str]) -> None:
    """익명화된 문의와 답변에 사용된 사이트 문서 ID만 보관한다."""
    storage_path = Path(os.environ.get("AI_INQUIRY_STORAGE_PATH", DEFAULT_STORAGE_PATH))
    retention_days = max(1, int(os.environ.get("AI_INQUIRY_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)))
    now = datetime.now(SEOUL_TIMEZONE)
    cutoff = now - timedelta(days=retention_days)
    record = {
        "recorded_at": now.isoformat(timespec="seconds"),
        "question": redact_inquiry(question),
        "source_ids": source_ids,
    }

    storage_path.parent.mkdir(parents=True, exist_ok=True)
    retained: list[str] = []
    if storage_path.exists():
        retained = _retained_lines(storage_path.read_text(encoding="utf-8").splitlines(), cutoff)
    retained.append(json.dumps(record, ensure_ascii=False, separators=(",", ":")))

    temporary_path = storage_path.with_suffix(f"{storage_path.suffix}.tmp")
    temporary_path.write_text("\n".join(retained) + "\n", encoding="utf-8")
    os.chmod(temporary_path, 0o600)
    temporary_path.replace(storage_path)
