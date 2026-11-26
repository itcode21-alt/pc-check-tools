"""개인정보 안내 문구와 실제 동작(코드 상수)이 어긋나지 않는지 확인하는 테스트. 실행: python test_privacy_consistency.py

화면·방침에 적은 보관 기간·만료 시간·횟수 제한이 코드의 기본값과 같은지, 그리고 쓰지 않는 외부 알림(Telegram)을
방침이 '쓰지 않는다'고 적고 있는지, 미니덤프 분석기가 서버로 보내는 파일 종류가 방침에 빠짐없이 적혔는지 본다.
"""
import os
import re
from pathlib import Path

import analysis_token
import improvement_store
import remote_request_store
import symbol_store
import telegram_notifier

SITE = Path(__file__).resolve().parent.parent
PRIVACY = (SITE / "privacy.html").read_text(encoding="utf-8")
ANALYZER = (SITE / "minidump-analyzer.html").read_text(encoding="utf-8")
TERMS = (SITE / "terms.html").read_text(encoding="utf-8")


def _text(html: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))


def test_retention_days_in_policy_match_code():
    assert remote_request_store.DEFAULT_RETENTION_DAYS == 90 and improvement_store.DEFAULT_RETENTION_DAYS == 90
    assert "접수일로부터 90일" in _text(PRIVACY)
    assert "수집일로부터 90일" in _text(PRIVACY)
    # 분석 화면의 개선 활용 문구와 원격 접수 동의 문구도 같은 기간
    assert "90일 뒤 삭제" in ANALYZER and "접수 후 90일이 지나면 삭제" in ANALYZER


def test_signed_value_lifetime_in_policy_matches_code():
    assert analysis_token.TOKEN_TTL_SEC == 3600
    assert "1시간" in _text(PRIVACY) and "1시간 동안" in ANALYZER


def test_ai_rate_limit_in_policy_matches_code():
    os.environ.pop("AI_RATE_LIMIT_MAX", None)
    os.environ.pop("AI_RATE_LIMIT_WINDOW_SEC", None)
    import importlib
    import app
    importlib.reload(app)
    assert (app._ai_limiter.max_hits, app._ai_limiter.window_sec) == (5, 3600)
    assert "시간당 5회" in _text(PRIVACY) and "시간당 5회" in ANALYZER


def test_telegram_is_off_by_default_and_not_promised_anywhere():
    for key in ("TELEGRAM_BOT_TOKEN", "TELEGRAM_ADMIN_CHAT_ID"):
        os.environ.pop(key, None)
    assert telegram_notifier.configured() is False
    assert "현재는 Telegram 등 외부 메신저로 전달하지 않습니다" in _text(PRIVACY)
    for name, html in (("분석 화면", ANALYZER), ("이용약관", TERMS)):
        assert "텔레그램" not in html and "Telegram" not in html, f"{name}에 Telegram 언급이 남아 있음"


def test_policy_lists_every_file_type_the_analyzer_uploads():
    # 분석 화면이 서버로 보내는 파일 종류(.dmp·.evtx·hardware.json)를 방침이 모두 적고, 브라우저 처리 문구에서 예외로 밝힌다.
    policy = _text(PRIVACY)
    assert ".dmp·.evtx·hardware.json" in policy
    assert "Cloudflare" in policy
    assert "분석 시작" in policy and "분석 시작" in ANALYZER
    assert "분석 서버" in policy and "분석 서버(Cloudflare 터널 경유)" in ANALYZER


def test_export_and_share_statements_match_features():
    policy = _text(PRIVACY)
    assert "서버로 전송되지 않습니다" in policy and "카카오톡 상담용 요약" in policy
    assert "분석 결과를 링크로 공유하는 기능은 현재 제공하지 않습니다" in policy
    # 공유 링크 기능이 실제로 없어야 위 문장이 참이다.
    assert "share-link" not in ANALYZER and "공유 링크" not in ANALYZER


def test_symbol_server_traffic_is_disclosed_and_matches_code():
    from urllib.parse import urlparse
    host = urlparse(symbol_store.SERVER).hostname
    assert host == "msdl.microsoft.com"
    policy = _text(PRIVACY)
    assert host in policy and "Microsoft 심볼 서버" in policy
    assert "파일 이름·TimeDateStamp·SizeOfImage" in policy and "덤프 내용" in policy
    assert "msdl.microsoft.com" in ANALYZER and "TimeDateStamp" in ANALYZER
    # 정책이 '자동'이라고 적었으므로 기본 설정은 켜짐이어야 한다(끄면 방침 문구도 고친다).
    os.environ.pop("SYMBOL_FETCH_ENABLED", None)
    assert symbol_store._cfg()["enabled"] is True and "작은 메모리 덤프를 분석할 때 자동" in policy


if __name__ == "__main__":
    import traceback
    fails = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("ok  ", name)
            except Exception:
                fails += 1
                print("FAIL", name)
                traceback.print_exc()
    raise SystemExit(1 if fails else 0)
