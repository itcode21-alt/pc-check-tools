"""서버가 추출한 분석 요약(근거 정보)에 서명한 토큰.

분석 API는 파일을 저장하지 않으므로, 클라이언트가 AI 요약·접수에 임의의 로그를 끼워 넣지 못하게
서버가 직접 추출한 '근거 정보'에 HMAC 서명을 붙여 돌려주고 이후 요청에서 그 서명을 검증한다.
토큰은 원본 파일이 아니라 정지 코드·결함 모듈·이벤트 집계처럼 짧은 요약만 담으며 1시간 뒤 만료된다.
ANALYSIS_TOKEN_SECRET(32자 이상)이 없으면 프로세스마다 임시 비밀값을 만들어(재시작하면 기존 토큰 무효) 쓴다.
"""
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from text_safety import clean

TOKEN_TTL_SEC = int(os.environ.get("ANALYSIS_TOKEN_TTL_SEC", "3600"))
MAX_TOKEN_CHARS = 12000
_EPHEMERAL = secrets.token_bytes(32)


def _secret() -> bytes:
    configured = os.environ.get("ANALYSIS_TOKEN_SECRET", "")
    if len(configured) >= 32:
        return configured.encode("utf-8")
    return _EPHEMERAL


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("ascii").rstrip("=")


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _sign(body: str) -> str:
    return _b64(hmac.new(_secret(), body.encode("ascii"), hashlib.sha256).digest())


def issue(kind: str, facts: dict, ttl: Optional[int] = None) -> str:
    payload = {"v": 1, "k": kind, "f": facts, "exp": int(time.time()) + (ttl or TOKEN_TTL_SEC), "n": secrets.token_hex(6)}
    body = _b64(json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8"))
    return f"{body}.{_sign(body)}"


def verify(token) -> Optional[dict]:
    """서명과 만료를 검증하고 payload를 돌려준다. 실패하면 None."""
    if not isinstance(token, str) or len(token) > MAX_TOKEN_CHARS or token.count(".") != 1:
        return None
    body, sig = token.split(".")
    try:
        if not hmac.compare_digest(sig, _sign(body)):
            return None
        payload = json.loads(_unb64(body).decode("utf-8"))
    except (ValueError, UnicodeError):
        return None
    if not isinstance(payload, dict) or payload.get("v") != 1 or payload.get("exp", 0) < time.time():
        return None
    if payload.get("k") not in ("dump", "evtx", "summary") or not isinstance(payload.get("f"), dict):
        return None
    return payload


def fingerprint(tokens) -> str:
    """접수 기록에 남기는 분석 식별용 짧은 해시(토큰 내용은 저장하지 않는다)."""
    joined = "|".join(sorted(t.split(".")[-1] for t in tokens if isinstance(t, str)))
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()[:16]


# ── 분석 결과에서 근거 정보 추출 ─────────────────────────────────────────────
def facts_from_dump(result: dict) -> dict:
    facts = {}
    for key, limit in (("stopCode", 12), ("stopCodeName", 60), ("stopCodeDesc", 160), ("faultingModule", 80),
                       ("faultingModuleDesc", 200), ("faultingModuleBasis", 200), ("osBuild", 30), ("crashTime", 40), ("dumpKind", 20),
                       ("exceptionCode", 14), ("exceptionName", 60), ("exceptionDesc", 160), ("processName", 60), ("arch", 10)):
        value = result.get(key)
        if value not in (None, ""):
            facts[key] = clean(value, limit)
    return facts


def facts_from_evtx(result: dict) -> dict:
    facts = {"totalEvents": int(result.get("totalEvents") or 0)}
    window = result.get("timeRange") or {}
    facts["timeRange"] = [clean(window.get("start"), 40), clean(window.get("end"), 40)]
    facts["topEvents"] = [
        {"provider": clean(e.get("provider"), 60), "id": int(e.get("id") or 0), "count": int(e.get("count") or 0)}
        for e in (result.get("topEvents") or [])[:6] if isinstance(e, dict)
    ]
    facts["notable"] = [
        {"provider": clean(e.get("provider"), 60), "id": int(e.get("id") or 0), "count": int(e.get("count") or 0), "label": clean(e.get("label"), 80)}
        for e in (result.get("notable") or [])[:8] if isinstance(e, dict)
    ]
    whea = result.get("wheaById") or {}
    facts["wheaById"] = {clean(k, 6): int(v) for k, v in list(whea.items())[:6] if isinstance(v, (int, float))}
    facts["bugchecks"] = [clean(b.get("code"), 12) for b in (result.get("bugchecks") or [])[:5] if isinstance(b, dict)]
    facts["findings"] = [clean(f.get("title"), 120) for f in (result.get("findings") or [])[:5] if isinstance(f, dict)]
    return facts
