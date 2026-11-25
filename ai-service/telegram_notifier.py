"""관리자 Telegram 봇으로 원격 점검 신청을 알린다.

- 토큰·채팅 ID는 환경 변수(TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID)에서만 읽고 응답·로그·브라우저에 내보내지 않는다.
- parse_mode를 쓰지 않아 접수 내용이 Markdown/HTML로 해석되지 않으며, 제어문자도 제거한다.
- 실패 시 오류 '코드'만 돌려준다(요청 URL에 토큰이 들어 있어 예외 문자열을 로그에 남기지 않는다).
"""
import logging
import os
import threading
import time
from typing import Optional, Tuple

import requests

import remote_request_store as store
from text_safety import clean, clean_multiline

logger = logging.getLogger("itsvc.ai.telegram")
MAX_MESSAGE = 3800


def configured() -> bool:
    return bool(os.environ.get("TELEGRAM_BOT_TOKEN")) and bool(os.environ.get("TELEGRAM_ADMIN_CHAT_ID"))


def format_message(record: dict) -> str:
    contact = store.PREFERRED.get(record.get("preferredContact"), "")
    lines = [
        "[itsvc.co.kr 원격 점검 신청]",
        f"접수번호: {record['requestId']}",
        f"고객명: {clean(record.get('name'), 40)}",
        f"연락처: {clean(record.get('phone'), 20)}",
        f"이메일: {clean(record.get('email'), 100) or '(없음)'}",
        f"선호 연락: {contact}",
        "",
        "[진단 요약]",
        clean_multiline(record.get("diagnosticSummary"), 3000),
        "",
        f"분석 참조: {clean(record.get('analysisRef'), 20)}",
    ]
    return "\n".join(lines)[:MAX_MESSAGE]


def send_text(text: str, *, post=None) -> Tuple[bool, Optional[str]]:
    """(성공 여부, 실패 코드). 재시도는 1회."""
    if not configured():
        return False, "TELEGRAM_NOT_CONFIGURED"
    base = os.environ.get("TELEGRAM_API_BASE", "https://api.telegram.org").rstrip("/")
    url = f"{base}/bot{os.environ['TELEGRAM_BOT_TOKEN']}/sendMessage"
    payload = {"chat_id": os.environ["TELEGRAM_ADMIN_CHAT_ID"], "text": text[:MAX_MESSAGE], "disable_web_page_preview": True}
    sender = post or requests.post
    error = "TELEGRAM_ERROR"
    for attempt in range(2):
        try:
            resp = sender(url, json=payload, timeout=5)
            if resp.status_code == 200:
                return True, None
            error = f"TELEGRAM_HTTP_{resp.status_code}"
        except requests.Timeout:
            error = "TELEGRAM_TIMEOUT"
        except requests.RequestException:
            error = "TELEGRAM_UNREACHABLE"
        if attempt == 0:
            time.sleep(0.3)
    return False, error


def notify_record(record: dict, *, post=None) -> bool:
    """접수 기록 하나를 전송하고 결과를 저장소에 남긴다."""
    ok, error = send_text(format_message(record), post=post)
    store.mark(record["requestId"], "sent" if ok else "pending", None if ok else error)
    if not ok:
        logger.warning("remote request %s notification pending (%s)", record["requestId"], error)
    return ok


def retry_pending_once(*, post=None) -> int:
    sent = 0
    for record in store.pending():
        if notify_record(record, post=post):
            sent += 1
    return sent


_thread_started = False


def start_retry_loop(interval_sec: int = 0) -> None:
    """pending 접수를 주기적으로 다시 보내는 데몬 스레드를 한 번만 시작한다."""
    global _thread_started
    if _thread_started:
        return
    _thread_started = True
    interval_sec = interval_sec or int(os.environ.get("TELEGRAM_RETRY_INTERVAL_SEC", "60"))

    def loop():
        while True:
            time.sleep(interval_sec)
            try:
                if configured():
                    retry_pending_once()
            except Exception:  # 재전송 루프는 어떤 오류로도 죽지 않는다.
                logger.exception("telegram retry loop error")

    threading.Thread(target=loop, name="telegram-retry", daemon=True).start()
