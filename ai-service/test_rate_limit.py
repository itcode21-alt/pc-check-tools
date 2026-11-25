"""rate_limit 회귀 테스트: 동일 IP 5회 허용·6번째 차단, 루프백에서만 프록시 헤더 신뢰."""
from types import SimpleNamespace as NS

import rate_limit as R


def _req(socket_ip, **headers):
    return NS(client=NS(host=socket_ip), headers=headers)


def test_sixth_call_is_blocked_with_retry_after():
    limiter = R.SlidingWindowLimiter(5, 3600)
    for i in range(5):
        assert limiter.check("1.2.3.4", now=100.0 + i)[0] is True
    allowed, retry = limiter.check("1.2.3.4", now=110.0)
    assert allowed is False and 0 < retry <= 3600
    assert limiter.check("5.6.7.8", now=110.0)[0] is True          # 다른 IP는 영향 없음
    assert limiter.check("1.2.3.4", now=100.0 + 3601)[0] is True   # 윈도우가 지나면 다시 허용


def test_proxy_headers_trusted_only_from_loopback():
    assert R.client_ip(_req("127.0.0.1", **{"cf-connecting-ip": "203.0.113.9"})) == "203.0.113.9"
    assert R.client_ip(_req("127.0.0.1", **{"x-forwarded-for": "198.51.100.7, 10.0.0.1"})) == "198.51.100.7"
    assert R.client_ip(_req("198.51.100.20", **{"cf-connecting-ip": "203.0.113.9"})) == "198.51.100.20"  # 위조 헤더 무시
    assert R.client_ip(_req("127.0.0.1", **{"cf-connecting-ip": "not-an-ip"})) == "127.0.0.1"


def test_mask_ip():
    assert R.mask_ip("203.0.113.9") == "203.0.113.x"
    assert R.mask_ip("2001:db8:1:2::9").endswith(":x")


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
