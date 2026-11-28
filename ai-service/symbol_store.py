"""Microsoft 심볼 서버에서 모듈 이미지(PE)를 받아 디스크에 캐시한다.

호출 스택을 정확히 복원하려면 크래시 때 올라와 있던 모듈의 이미지가 필요하다(덤프에는 이미지가 없다).
서버에 보내는 것은 모듈 파일 이름·TimeDateStamp·SizeOfImage뿐이다(심볼 서버의 공개 파일 식별자). 덤프 내용과 사용자 정보는 보내지 않는다.

안전장치: 호스트는 msdl.microsoft.com 하나로 고정, 이름·식별자는 형식을 검사한 값만 쓰고, 받은 파일은 PE 머리의
TimeDateStamp·SizeOfImage가 요청과 같을 때만 저장한다. 크기·시간·하루 내려받기 횟수에 상한이 있고, 없는 파일은 며칠간 다시 묻지 않는다.
SYMBOL_FETCH_ENABLED=0 이면 어떤 통신도 하지 않는다(캐시에 있는 이미지만 쓴다).
"""
import logging
import os
import re
import struct
import threading
import time
import urllib.error
import urllib.request
from pathlib import Path
from typing import Optional

logger = logging.getLogger("itsvc.ai.symbols")

SERVER = "https://msdl.microsoft.com/download/symbols"
_NAME_RE = re.compile(r"^[A-Za-z0-9_][A-Za-z0-9_.\-]{0,63}$")
MAX_IMAGE_BYTES = 80 * 1024 * 1024
MISSING_TTL_SEC = 3 * 24 * 3600
FETCH_ATTEMPTS = 3                                  # 일시적 실패(네트워크 오류·5xx·429)는 이 횟수까지 시도(하루 상한은 이미지당 1회로 셈)
FETCH_BACKOFF_SEC = 0.6
_TRANSIENT_HTTP = frozenset({408, 425, 429, 500, 502, 503, 504})

_lock = threading.Lock()
_day = {"date": None, "count": 0}
_key_locks: dict = {}


def _cfg():
    return {
        "enabled": os.environ.get("SYMBOL_FETCH_ENABLED", "1") != "0",
        "dir": Path(os.environ.get("SYMBOL_CACHE_DIR") or (Path(__file__).resolve().parent / "data" / "symcache")),
        "max_mb": int(os.environ.get("SYMBOL_CACHE_MAX_MB", "1500")),
        "daily_cap": int(os.environ.get("SYMBOL_DAILY_FETCH_CAP", "300")),
        "timeout": float(os.environ.get("SYMBOL_HTTP_TIMEOUT_SEC", "15")),
    }


def valid_id(name: str, timestamp: int, size: int) -> bool:
    return bool(isinstance(name, str) and _NAME_RE.match(name) and isinstance(timestamp, int) and 0 <= timestamp <= 0xFFFFFFFF
                and isinstance(size, int) and 0 < size <= 0x10000000)


def image_key(timestamp: int, size: int) -> str:
    return f"{timestamp:08X}{size:x}"


def _paths(name: str, timestamp: int, size: int):
    base = _cfg()["dir"] / name.lower() / image_key(timestamp, size)
    return base / name.lower(), base / ".missing"


def _pe_matches(data: bytes, timestamp: int, size: int) -> bool:
    try:
        if data[:2] != b"MZ":
            return False
        nt = struct.unpack_from("<I", data, 0x3C)[0]
        if data[nt:nt + 4] != b"PE\0\0":
            return False
        ts = struct.unpack_from("<I", data, nt + 8)[0]
        opt = nt + 0x18
        return ts == timestamp and struct.unpack_from("<I", data, opt + 0x38)[0] == size
    except (struct.error, IndexError):
        return False


def cached(name: str, timestamp: int, size: int) -> Optional[bytes]:
    """캐시에 있는 이미지(없으면 None). 통신하지 않는다."""
    if not valid_id(name, timestamp, size):
        return None
    path, _ = _paths(name, timestamp, size)
    try:
        data = path.read_bytes()
    except OSError:
        return None
    return data if _pe_matches(data, timestamp, size) else None


def _allow_new_download(cap: int) -> bool:
    today = time.strftime("%Y-%m-%d")
    with _lock:
        if _day["date"] != today:
            _day["date"], _day["count"] = today, 0
        if _day["count"] >= cap:
            return False
        _day["count"] += 1
        return True


def _evict(limit_mb: int):
    root = _cfg()["dir"]
    try:
        files = [(p.stat().st_atime, p.stat().st_size, p) for p in root.rglob("*") if p.is_file() and p.name != ".missing"]
    except OSError:
        return
    total = sum(s for _, s, _ in files)
    for _, size, p in sorted(files):
        if total <= limit_mb * 1024 * 1024:
            break
        try:
            p.unlink()
            total -= size
        except OSError:
            pass


def fetch(name: str, timestamp: int, size: int, deadline: Optional[float] = None) -> Optional[bytes]:
    """이미지를 돌려준다(캐시 → 심볼 서버). 없거나 실패하면 None. deadline은 time.monotonic() 기준 마감 시각."""
    if not valid_id(name, timestamp, size):
        return None
    hit = cached(name, timestamp, size)
    if hit is not None:
        return hit
    cfg = _cfg()
    if not cfg["enabled"]:
        return None
    path, missing = _paths(name, timestamp, size)
    try:
        if missing.exists() and time.time() - missing.stat().st_mtime < MISSING_TTL_SEC:
            return None
    except OSError:
        pass
    key = f"{name.lower()}/{image_key(timestamp, size)}"
    with _lock:
        klock = _key_locks.setdefault(key, threading.Lock())
    with klock:
        hit = cached(name, timestamp, size)   # 기다리는 동안 다른 요청이 받아 둔 경우
        if hit is not None:
            return hit
        if not _allow_new_download(cfg["daily_cap"]):
            logger.warning("symbol daily fetch cap reached")
            return None
        url = f"{SERVER}/{name.lower()}/{image_key(timestamp, size)}/{name.lower()}"
        data = None
        last = None
        for attempt in range(FETCH_ATTEMPTS):
            remaining = None if deadline is None else deadline - time.monotonic()
            if remaining is not None and remaining <= 0.5:
                break
            timeout = cfg["timeout"] if remaining is None else max(1.0, min(cfg["timeout"], remaining))
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "itsvc-symbol-client/1.0"})
                with urllib.request.urlopen(req, timeout=timeout) as resp:
                    chunks, got = [], 0
                    while True:
                        chunk = resp.read(1 << 20)
                        if not chunk:
                            break
                        got += len(chunk)
                        if got > MAX_IMAGE_BYTES or (deadline is not None and time.monotonic() > deadline + 5):
                            raise ValueError("too large or too slow")
                        chunks.append(chunk)
                    data = b"".join(chunks)
                break
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    _mark_missing(missing)
                    return None
                last = f"HTTP {e.code}"
                if e.code not in _TRANSIENT_HTTP:
                    break
            except ValueError as e:
                last = str(e)
                break   # 너무 크거나 느린 것은 다시 해도 같다
            except (urllib.error.URLError, OSError, TimeoutError) as e:
                last = type(e).__name__
            # 일시적 실패(네트워크 오류·서버 5xx·429): 잠깐 쉬었다가 다시 시도한다. 실패는 기록하지 않아 다음 요청에서도 시도한다.
            if attempt + 1 < FETCH_ATTEMPTS:
                wait = FETCH_BACKOFF_SEC * (attempt + 1)
                if deadline is not None and deadline - time.monotonic() < wait + 1.5:
                    break
                time.sleep(wait)
        if data is None:
            if last:
                logger.warning("symbol fetch failed for %s: %s", name.lower(), last)
            return None
        if not _pe_matches(data, timestamp, size):
            _mark_missing(missing)
            return None
        try:
            path.parent.mkdir(parents=True, exist_ok=True)
            tmp = path.with_suffix(path.suffix + ".part")
            tmp.write_bytes(data)
            tmp.replace(path)
        except OSError:
            pass
        _evict(cfg["max_mb"])
        return data


def _mark_missing(marker: Path):
    try:
        marker.parent.mkdir(parents=True, exist_ok=True)
        marker.touch()
    except OSError:
        pass
