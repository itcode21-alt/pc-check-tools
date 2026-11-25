"""원격 점검 신청 접수 기록(JSONL). 접수번호 발급, 중복 제출 방지, Telegram 전송 상태 관리, 보관 기간 정리를 맡는다.

원본은 ai-service/data(gitignore)에만 있고 파일 권한은 0600이다. 로그에는 이 파일의 내용(이름·연락처)을 남기지 않는다.
"""
import hashlib
import json
import os
import re
import secrets
import threading
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

from text_safety import clean, clean_multiline

DEFAULT_STORAGE_PATH = Path(__file__).resolve().parent / "data" / "remote-requests.jsonl"
DEFAULT_RETENTION_DAYS = 90
MAX_ATTEMPTS = 8
_lock = threading.Lock()
PREFERRED = {"phone": "전화", "kakao": "카카오톡", "email": "이메일"}


class InvalidRequest(ValueError):
    def __init__(self, field: str):
        super().__init__(field)
        self.field = field


def storage_path() -> Path:
    return Path(os.environ.get("REMOTE_REQUEST_STORAGE_PATH", DEFAULT_STORAGE_PATH))


def retention_days() -> int:
    return max(1, int(os.environ.get("REMOTE_REQUEST_RETENTION_DAYS", DEFAULT_RETENTION_DAYS)))


def normalize_phone(value) -> str:
    digits = re.sub(r"[^\d+]", "", str(value or ""))
    if digits.startswith("+82"):
        digits = "0" + digits[3:]
    digits = re.sub(r"\D", "", digits)
    if re.fullmatch(r"01[016789]\d{7,8}", digits):
        body = digits[3:]
        return f"{digits[:3]}-{body[:-4]}-{body[-4:]}"
    if re.fullmatch(r"0\d{1,2}\d{7,8}", digits):
        area = digits[:2] if digits.startswith("02") else digits[:3]
        body = digits[len(area):]
        return f"{area}-{body[:-4]}-{body[-4:]}"
    raise InvalidRequest("phone")


def validate_fields(name, phone, email, preferred, consent) -> dict:
    """접수 폼 값을 검증·정규화한다. 문제가 있는 항목 이름만 InvalidRequest로 알린다(입력값은 되돌려 주지 않는다)."""
    cleaned_name = clean(name, 40)
    if not cleaned_name:
        raise InvalidRequest("name")
    if consent is not True:
        raise InvalidRequest("consent")
    cleaned_email = clean(email, 100) if email else ""
    if cleaned_email and not re.fullmatch(r"[^@\s]{1,64}@[^@\s]{1,255}\.[^@\s]{2,}", cleaned_email):
        raise InvalidRequest("email")
    if preferred not in PREFERRED:
        raise InvalidRequest("preferredContact")
    if preferred == "email" and not cleaned_email:
        raise InvalidRequest("email")
    return {"name": cleaned_name, "phone": normalize_phone(phone), "email": cleaned_email, "preferredContact": preferred}


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _read(path: Path) -> list:
    if not path.exists():
        return []
    records = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            records.append(json.loads(line))
        except ValueError:
            continue
    return records


def _write(path: Path, records: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text("".join(json.dumps(r, ensure_ascii=False, separators=(",", ":")) + "\n" for r in records), encoding="utf-8")
    os.chmod(tmp, 0o600)
    tmp.replace(path)


def idem_hash(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:24]


def create(fields: dict, diagnostic_summary: str, analysis_ref: str, idempotency_key: str, notify: bool = True):
    """새 접수를 저장한다. 같은 중복 방지 키가 이미 있으면 기존 접수를 돌려준다. (기록, 중복 여부)."""
    path = storage_path()
    cutoff = _now() - timedelta(days=retention_days())
    key_hash = idem_hash(idempotency_key)
    with _lock:
        records = [r for r in _read(path) if (r.get("createdAt") or "") >= cutoff.isoformat(timespec="seconds")]
        for existing in records:
            if existing.get("idemKey") == key_hash:
                return existing, True
        record = {
            "requestId": "ri_" + secrets.token_hex(5),
            "createdAt": _now().isoformat(timespec="seconds"),
            "idemKey": key_hash,
            **fields,
            "diagnosticSummary": clean_multiline(diagnostic_summary, 4000),
            "analysisRef": analysis_ref,
            # 알림 채널(Telegram)을 쓰지 않으면 접수 기록만 보관하는 "stored" 상태로 두고 재전송 대상에서 제외한다.
            "notificationStatus": "pending" if notify else "stored",
            "attempts": 0,
            "consentVersion": "2026-11-26",
        }
        records.append(record)
        _write(path, records)
    return record, False


def mark(request_id: str, status: str, error_code: Optional[str] = None) -> None:
    path = storage_path()
    with _lock:
        records = _read(path)
        for r in records:
            if r.get("requestId") == request_id:
                r["notificationStatus"] = status
                r["attempts"] = int(r.get("attempts", 0)) + 1
                r["lastAttemptAt"] = _now().isoformat(timespec="seconds")
                if error_code:
                    r["lastError"] = clean(error_code, 40)
                else:
                    r.pop("lastError", None)
        _write(path, records)


def pending(limit: int = 20) -> list:
    with _lock:
        rows = [r for r in _read(storage_path())
                if r.get("notificationStatus") == "pending" and int(r.get("attempts", 0)) < MAX_ATTEMPTS]
    return rows[:limit]


def delete(request_id: str) -> bool:
    """운영자가 고객의 삭제 요청을 처리할 때 쓰는 함수(접수번호 기준)."""
    path = storage_path()
    with _lock:
        records = _read(path)
        kept = [r for r in records if r.get("requestId") != request_id]
        if len(kept) == len(records):
            return False
        _write(path, kept)
    return True


def recent(limit: int = 50) -> list:
    """운영자 확인용 최근 접수 목록(최신순). 알림 채널 없이 접수를 확인할 때 쓴다."""
    with _lock:
        rows = _read(storage_path())
    rows.sort(key=lambda r: r.get("createdAt", ""), reverse=True)
    keep = ("requestId", "createdAt", "name", "phone", "email", "preferredContact", "diagnosticSummary", "notificationStatus")
    return [{k: r.get(k) for k in keep} for r in rows[:max(1, min(limit, 200))]]
