"""telegram_notifier·remote_request_store 회귀 테스트: 전송 성공, 장애 시 접수 보존(pending)과 재전송, 개인정보·토큰 비노출."""
import json
import logging
import os
import tempfile
from pathlib import Path

import remote_request_store as S
import telegram_notifier as N
from testutil_fakes import fake_telegram

TOKEN = "123456:SECRET-TOKEN-VALUE"


def _env(server):
    os.environ["REMOTE_REQUEST_STORAGE_PATH"] = str(Path(tempfile.mkdtemp()) / "r.jsonl")
    os.environ["TELEGRAM_BOT_TOKEN"] = TOKEN
    os.environ["TELEGRAM_ADMIN_CHAT_ID"] = "99999"
    os.environ["TELEGRAM_API_BASE"] = server.url


def _record(key="key-12345678"):
    fields = S.validate_fields("홍길동", "010 1234 5678", "user@example.com", "phone", True)
    record, dup = S.create(fields, "원인 추정: 그래픽 드라이버 <b>충돌</b> 가능성\n근거 로그: 버그체크 코드: 0x116", "ref123", key)
    assert not dup
    return record


def test_message_contains_contact_and_server_summary_without_markup():
    server = fake_telegram()
    _env(server)
    record = _record()
    assert N.notify_record(record) is True
    sent = json.loads(server.requests[0]["body"])
    text = sent["text"]
    assert "홍길동" in text and "010-1234-5678" in text and record["requestId"] in text and "0x116" in text
    assert "parse_mode" not in sent and "<b>" not in text            # Markdown/HTML 해석 없음, 태그 제거
    assert TOKEN in server.requests[0]["path"] and TOKEN not in text   # 토큰은 URL에만, 메시지에는 없음
    assert S.pending() == []
    server.stop()


def test_failure_keeps_record_pending_then_retry_sends(caplog=None):
    server = fake_telegram()
    server.mode = "down"
    _env(server)
    records_logged = []

    class _Capture(logging.Handler):
        def emit(self, record):
            records_logged.append(record.getMessage())

    handler = _Capture()
    logging.getLogger("itsvc.ai.telegram").addHandler(handler)
    record = _record()
    assert N.notify_record(record) is False
    pend = S.pending()
    assert len(pend) == 1 and pend[0]["notificationStatus"] == "pending" and pend[0]["lastError"].startswith("TELEGRAM_HTTP_5")
    assert not any(TOKEN in m or "010-1234-5678" in m or "홍길동" in m for m in records_logged)   # 로그에 비밀값·개인정보 없음
    server.mode = "ok"
    assert N.retry_pending_once() == 1
    assert S.pending() == []
    stored = json.loads(Path(os.environ["REMOTE_REQUEST_STORAGE_PATH"]).read_text(encoding="utf-8").splitlines()[0])
    assert stored["notificationStatus"] == "sent"
    logging.getLogger("itsvc.ai.telegram").removeHandler(handler)
    server.stop()


def test_not_configured_returns_code_without_calling():
    os.environ.pop("TELEGRAM_BOT_TOKEN", None)
    ok, err = N.send_text("x")
    assert ok is False and err == "TELEGRAM_NOT_CONFIGURED"


def test_duplicate_submission_returns_existing_record():
    server = fake_telegram()
    _env(server)
    first = _record("same-key-12345")
    fields = S.validate_fields("홍길동", "010-1234-5678", None, "phone", True)
    second, dup = S.create(fields, "다른 요약", "ref", "same-key-12345")
    assert dup is True and second["requestId"] == first["requestId"]
    assert len(Path(os.environ["REMOTE_REQUEST_STORAGE_PATH"]).read_text(encoding="utf-8").splitlines()) == 1
    server.stop()


def test_validation_and_phone_normalization():
    assert S.normalize_phone("+82 10-1234-5678") == "010-1234-5678"
    assert S.normalize_phone("01012345678") == "010-1234-5678"
    for bad in ("", "123", "abcdefg", "010-12"):
        try:
            S.normalize_phone(bad)
        except S.InvalidRequest:
            continue
        raise AssertionError(bad)
    for args in (("", "010-1234-5678", None, "phone", True), ("a", "010-1234-5678", None, "phone", False),
                 ("a", "010-1234-5678", "bad", "phone", True), ("a", "010-1234-5678", None, "email", True), ("a", "010-1234-5678", None, "fax", True)):
        try:
            S.validate_fields(*args)
        except S.InvalidRequest:
            continue
        raise AssertionError(args)


def test_delete_by_request_id():
    server = fake_telegram()
    _env(server)
    record = _record()
    assert S.delete(record["requestId"]) is True and S.delete(record["requestId"]) is False
    server.stop()


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
