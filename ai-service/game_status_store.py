"""게임 페이지 방문자의 "나도 지금 안 돼요" 신고를 시간대별로 센다.

공식 서버 상태가 아니라 이 사이트 방문자의 신고 수다. 저장하는 것은 게임별 신고 시각뿐이고,
IP는 저장하지 않는다. 중복 신고를 막는 데 쓰는 값은 실행 중인 메모리에만 두고 파일에 쓰지 않는다.
"""

import hashlib
import json
import os
import secrets
import threading
import time
from pathlib import Path

DEFAULT_STORAGE_PATH = Path(__file__).resolve().parent / "data" / "game-status.json"
HOUR = 3600
DAY = 24 * HOUR
DEDUPE_SECONDS = 30 * 60
MAX_PER_GAME = 5000

# game-*.html 페이지 이름과 같은 값만 받는다.
GAMES = frozenset({
    "aion2", "apex", "battlegrounds", "battlenet", "blackdesert", "dfo", "diablo4", "fconline",
    "lineageclassic", "lol", "lostark", "maplestory", "minecraft", "overwatch2", "poe2", "roblox",
    "specialforce", "starcraft2", "steam", "suddenattack", "valorant",
})

_lock = threading.Lock()
_salt = secrets.token_bytes(16)
_recent_reporters: dict = {}
_state = None


def _storage_path() -> Path:
    return Path(os.environ.get("GAME_STATUS_STORAGE_PATH", DEFAULT_STORAGE_PATH))


def _load() -> dict:
    global _state
    if _state is None:
        try:
            raw = json.loads(_storage_path().read_text(encoding="utf-8"))
        except (OSError, ValueError):
            raw = {}
        _state = {
            game: [float(t) for t in times if isinstance(t, (int, float))]
            for game, times in raw.items()
            if game in GAMES and isinstance(times, list)
        } if isinstance(raw, dict) else {}
    return _state


def _save(state: dict) -> None:
    path = _storage_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary_path = path.with_suffix(f"{path.suffix}.tmp")
    temporary_path.write_text(json.dumps(state, separators=(",", ":")), encoding="utf-8")
    os.chmod(temporary_path, 0o600)
    temporary_path.replace(path)


def _prune(state: dict, now: float) -> None:
    for game in list(state):
        kept = [t for t in state[game] if now - t < DAY][-MAX_PER_GAME:]
        if kept:
            state[game] = kept
        else:
            del state[game]


def _counts(times: list, now: float) -> dict:
    return {
        "last_hour": sum(1 for t in times if now - t < HOUR),
        "last_day": sum(1 for t in times if now - t < DAY),
    }


def _check_game(game) -> str:
    if not isinstance(game, str) or game not in GAMES:
        raise ValueError("지원하지 않는 게임입니다.")
    return game


def counts(game: str, now: float = None) -> dict:
    game = _check_game(game)
    now = time.time() if now is None else now
    with _lock:
        return _counts(_load().get(game, []), now)


def report(game: str, client: str, now: float = None) -> dict:
    """신고 한 건을 더하고 현재 건수를 돌려준다. 같은 사람이 30분 안에 다시 누르면 세지 않는다."""
    game = _check_game(game)
    now = time.time() if now is None else now
    key = hashlib.sha256(_salt + f"{game}|{client}".encode("utf-8")).hexdigest()
    with _lock:
        state = _load()
        for old_key in [k for k, t in _recent_reporters.items() if now - t >= DEDUPE_SECONDS]:
            _recent_reporters.pop(old_key, None)
        counted = key not in _recent_reporters
        if counted:
            _recent_reporters[key] = now
            state.setdefault(game, []).append(now)
            _prune(state, now)
            _save(state)
        result = _counts(state.get(game, []), now)
    result["counted"] = counted
    return result


def _reset_for_tests() -> None:
    global _state
    with _lock:
        _state = None
        _recent_reporters.clear()
