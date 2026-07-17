"""쿠팡파트너스 Open API 딥링크 생성 클라이언트.

이 모듈은 서버(ai-service)에서만 import 되어야 합니다.
ACCESS/SECRET KEY는 절대 클라이언트(브라우저) 코드에 넣지 마세요.
"""
import hashlib
import hmac
import os
from datetime import datetime, timezone
from typing import List
from urllib.parse import urlencode

import requests

API_HOST = "https://api-gateway.coupang.com"
DEEPLINK_PATH = "/v2/providers/affiliate_open_api/apis/openapi/v1/deeplink"


def _signed_headers(method: str, path: str, query: str, access_key: str, secret_key: str) -> dict:
    signed_date = datetime.now(timezone.utc).strftime("%y%m%d") + "T" + datetime.now(timezone.utc).strftime("%H%M%S") + "Z"
    message = signed_date + method + path + query
    signature = hmac.new(secret_key.encode(), message.encode(), hashlib.sha256).hexdigest()
    authorization = (
        f"CEA algorithm=HmacSHA256, access-key={access_key}, "
        f"signed-date={signed_date}, signature={signature}"
    )
    return {"Authorization": authorization, "Content-Type": "application/json;charset=UTF-8"}


class CoupangPartnersClient:
    def __init__(self, access_key: str = None, secret_key: str = None):
        self.access_key = access_key or os.environ.get("COUPANG_ACCESS_KEY")
        self.secret_key = secret_key or os.environ.get("COUPANG_SECRET_KEY")

    @property
    def configured(self) -> bool:
        return bool(self.access_key and self.secret_key)

    def create_deeplinks(self, urls: List[str]) -> List[dict]:
        """일반 coupang.com URL(최대 5개)을 link.coupang.com 추적 링크로 변환합니다."""
        if not self.configured:
            raise RuntimeError("COUPANG_ACCESS_KEY / COUPANG_SECRET_KEY가 설정되지 않았습니다.")
        if not urls:
            return []

        body = {"coupangUrls": urls[:5]}
        headers = _signed_headers("POST", DEEPLINK_PATH, "", self.access_key, self.secret_key)
        resp = requests.post(f"{API_HOST}{DEEPLINK_PATH}", json=body, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get("data", [])

    def search_link_for_query(self, query: str) -> str:
        """검색어 하나로 즉시 사용 가능한 딥링크 하나를 반환합니다."""
        search_url = f"https://www.coupang.com/np/search?{urlencode({'q': query})}"
        results = self.create_deeplinks([search_url])
        if results and results[0].get("shortenUrl"):
            return results[0]["shortenUrl"]
        raise RuntimeError(f"딥링크 생성 실패: {results}")
