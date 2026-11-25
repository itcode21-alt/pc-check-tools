"""IP 기준 슬라이딩 윈도우 속도 제한과 실제 클라이언트 IP 판별.

ai.itsvc.co.kr은 Cloudflare Tunnel(cloudflared)이 127.0.0.1로 연결해 주므로, 소켓 주소가 루프백일 때만
CF-Connecting-IP / X-Forwarded-For를 믿는다. 루프백이 아닌 곳에서 온 요청이 이 헤더를 직접 넣어도 무시한다.
저장소는 프로세스 메모리다. uvicorn 워커가 1개인 현재 구성에서만 정확하며, 워커를 늘리면 공유 저장소가 필요하다.
"""
import ipaddress
import threading
import time
from typing import Optional, Tuple

_LOOPBACK = {"127.0.0.1", "::1", "localhost"}


def _valid_ip(text: Optional[str]) -> Optional[str]:
    if not text:
        return None
    try:
        return str(ipaddress.ip_address(text.strip()))
    except ValueError:
        return None


def client_ip(request) -> str:
    socket_ip = request.client.host if getattr(request, "client", None) else ""
    if socket_ip in _LOOPBACK:
        for header in ("cf-connecting-ip", "x-forwarded-for"):
            raw = request.headers.get(header)
            if raw:
                ip = _valid_ip(raw.split(",")[0])
                if ip:
                    return ip
    return _valid_ip(socket_ip) or "unknown"


def mask_ip(ip: str) -> str:
    """로그에 남길 때 쓰는 마스킹(IPv4 마지막 옥텟, IPv6 뒤쪽을 가린다)."""
    if "." in ip:
        return ".".join(ip.split(".")[:3] + ["x"])
    if ":" in ip:
        return ":".join(ip.split(":")[:3] + ["x"])
    return "unknown"


class SlidingWindowLimiter:
    def __init__(self, max_hits: int, window_sec: int):
        self.max_hits = max_hits
        self.window_sec = window_sec
        self._hits: dict = {}
        self._lock = threading.Lock()

    def check(self, key: str, now: Optional[float] = None) -> Tuple[bool, int]:
        """허용되면 (True, 0)을 돌려주며 호출을 1회로 센다. 초과면 (False, 다시 시도까지 남은 초)."""
        current = time.monotonic() if now is None else now
        with self._lock:
            hits = [t for t in self._hits.get(key, []) if current - t < self.window_sec]
            if len(hits) >= self.max_hits:
                self._hits[key] = hits
                return False, max(1, int(self.window_sec - (current - hits[0])))
            hits.append(current)
            self._hits[key] = hits
            if len(self._hits) > 5000:
                for stale in [k for k, v in self._hits.items() if not v or current - v[-1] >= self.window_sec]:
                    self._hits.pop(stale, None)
            return True, 0
