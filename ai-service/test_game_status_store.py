"""game_status_store 회귀 테스트. 실행: python test_game_status_store.py (pytest도 가능)

중복 신고가 걸러지는지, 시간 창이 맞는지, 파일에 IP 같은 값이 남지 않는지 확인한다.
"""
import json
import os
import tempfile
from pathlib import Path

import game_status_store as S


def _use_tmp():
    path = Path(tempfile.mkdtemp()) / "game-status.json"
    os.environ["GAME_STATUS_STORAGE_PATH"] = str(path)
    S._reset_for_tests()
    return path


def test_report_counts_and_dedupes_same_client():
    _use_tmp()
    now = 1_000_000.0
    first = S.report("starcraft2", "1.2.3.4", now)
    again = S.report("starcraft2", "1.2.3.4", now + 60)
    other = S.report("starcraft2", "5.6.7.8", now + 120)
    assert first == {"last_hour": 1, "last_day": 1, "counted": True}
    assert again["counted"] is False and again["last_hour"] == 1
    assert other["counted"] is True and other["last_hour"] == 2


def test_same_client_counts_again_after_30_minutes_and_per_game():
    _use_tmp()
    now = 1_000_000.0
    S.report("lol", "1.2.3.4", now)
    assert S.report("valorant", "1.2.3.4", now + 1)["counted"] is True
    assert S.report("lol", "1.2.3.4", now + S.DEDUPE_SECONDS + 1)["counted"] is True


def test_time_windows():
    _use_tmp()
    now = 1_000_000.0
    S.report("maplestory", "a", now - 2 * S.HOUR)
    S.report("maplestory", "b", now - 10)
    assert S.counts("maplestory", now) == {"last_hour": 1, "last_day": 2}
    assert S.counts("maplestory", now + S.DAY + 1) == {"last_hour": 0, "last_day": 0}
    assert S.counts("fconline", now) == {"last_hour": 0, "last_day": 0}


def test_rejects_unknown_game():
    _use_tmp()
    for bad in ("", "../etc", "unknown", None, 3):
        try:
            S.report(bad, "a")
        except ValueError:
            continue
        raise AssertionError(f"{bad!r} 검증이 빠졌습니다")


def test_file_has_only_timestamps_and_survives_reload():
    path = _use_tmp()
    now = 1_000_000.0
    S.report("poe2", "203.0.113.77", now)
    text = path.read_text(encoding="utf-8")
    assert "203.0.113.77" not in text
    assert json.loads(text) == {"poe2": [now]}
    S._reset_for_tests()
    assert S.counts("poe2", now + 5)["last_hour"] == 1


def test_games_match_site_pages():
    root = Path(__file__).resolve().parent.parent
    pages = {p.stem[len("game-"):] for p in root.glob("game-*.html")} - {"common"}
    assert pages == set(S.GAMES), pages ^ set(S.GAMES)


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            fn()
            print("ok", name)
