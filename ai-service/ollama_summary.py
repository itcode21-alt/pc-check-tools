"""분석 근거 정보를 Ollama로 일반인용 요약(원인 1문장·자가 조치 2단계·원격 점검 권유)으로 바꾼다.

- 전체 요청 deadline(기본 5초)을 넘기면 fallback을 돌려준다(연결·TLS·본문 읽기 포함, 별도 스레드 + future.result(timeout)).
- timeout·연결 실패·4xx/5xx·빈 응답·JSON 스키마 오류·안전성 검증 실패는 모두 같은 fallback 형태로 통일한다.
- 로그에서 나온 문자열은 사용자 message로만 보내고 system 지시로 올리지 않으며, text_safety.clean으로 먼저 무해화한다.
"""
import json
import logging
import os
import re
import time
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
from typing import Optional

import requests

from prompts.bs_summary_ko import SYSTEM_PROMPT
from text_safety import clean

logger = logging.getLogger("itsvc.ai.summary")

DEFAULT_DISCLAIMER = "참고용 자동 요약이며 최종 진단은 추가 점검이 필요합니다."
FALLBACK_SUMMARY = {
    "cause": "자동 요약 서버에 연결되지 않아 원인을 확정할 수 없습니다.",
    "selfCheck": [
        "최근 설치한 드라이버·프로그램을 제거하고 Windows 업데이트를 확인하세요.",
        "중요 파일을 백업한 뒤 같은 블루스크린이 반복되는지 기록하세요.",
    ],
    "remoteInspection": "아래 원격 점검 신청을 작성하면 전문가가 분석 결과를 확인합니다.",
    "confidence": "unknown",
    "disclaimer": "자동 진단이 완료되지 않았습니다.",
}
_ALLOWED_KEYS = {"cause", "selfCheck", "remoteInspection", "confidence", "disclaimer"}
# 위험한 명령·비밀값·지시문처럼 보이는 표현은 응답에 있으면 안전성 검증 실패로 처리한다.
_UNSAFE = re.compile(
    r"powershell|\bcmd(\.exe)?\b|regedit|reg\s+(add|delete)|\bdism\b|\bsfc\b|\bdel\s+/|\brmdir\b|format\s+[a-z]:|rm\s+-rf|"
    r"\bcurl\b|\bwget\b|https?://|api[_ -]?key|secret|\btoken\b|password|비밀번호|\[REDACTED\]|"
    r"ignore (all |the )?previous|이전 지시|시스템 프롬프트|system prompt|<\s*/?\s*(script|iframe|img)|javascript:|\bsudo\b",
    re.IGNORECASE,
)
_executor = ThreadPoolExecutor(max_workers=4, thread_name_prefix="ollama-summary")


def _config():
    return {
        "host": os.environ.get("OLLAMA_BASE_URL") or os.environ.get("OLLAMA_HOST", "http://localhost:11434"),
        "model": os.environ.get("OLLAMA_SUMMARY_MODEL") or os.environ.get("OLLAMA_MODEL", "qwen3.5:9b"),
        "timeout_ms": int(os.environ.get("OLLAMA_TIMEOUT_MS", "5000")),
        "max_chars": int(os.environ.get("OLLAMA_MAX_LOG_CHARS", "20000")),
    }


def build_log_text(facts_list, max_chars: Optional[int] = None) -> str:
    """서명 검증을 통과한 근거 정보를 줄 단위 텍스트로 만든다. 값은 모두 clean 처리."""
    limit = max_chars or _config()["max_chars"]
    lines = []
    for facts in facts_list:
        if "stopCode" in facts or "faultingModule" in facts or "exceptionCode" in facts:
            lines.append("[미니덤프]")
            for key, label in (("dumpKind", "덤프 종류"), ("stopCode", "정지 코드"), ("stopCodeName", "정지 코드 이름"), ("stopCodeDesc", "정지 코드 설명"),
                               ("faultingModule", "결함 모듈"), ("faultingModuleDesc", "결함 모듈 설명"), ("stackExternalModules", "호출 스택의 외부 드라이버"), ("stackFrames", "복원한 호출 스택(최근 호출 먼저)"), ("processName", "프로세스"),
                               ("exceptionCode", "예외 코드"), ("exceptionName", "예외 이름"), ("osBuild", "OS 빌드"), ("crashTime", "발생 시각")):
                if facts.get(key):
                    lines.append(f"{label}: {clean(facts[key], 200)}")
        elif "totalEvents" in facts:
            lines.append("[이벤트 로그]")
            lines.append(f"총 이벤트: {int(facts.get('totalEvents') or 0)}")
            for e in facts.get("notable", []):
                lines.append(f"주요: {clean(e.get('provider'), 60)} ID {int(e.get('id') or 0)} × {int(e.get('count') or 0)} ({clean(e.get('label'), 80)})")
            for code, cnt in (facts.get("wheaById") or {}).items():
                lines.append(f"WHEA-Logger {clean(code, 6)} × {int(cnt)}")
            for code in facts.get("bugchecks", []):
                lines.append(f"버그체크 기록: {clean(code, 12)}")
            for title in facts.get("findings", []):
                lines.append(f"관찰: {clean(title, 120)}")
    return "\n".join(lines)[:limit]


def evidence_lines(facts_list) -> list:
    """AI와 무관하게 서버가 추출한 사실만으로 만드는 '근거 로그' 목록(화면·접수 요약 표시용)."""
    out = []
    for facts in facts_list:
        if facts.get("stopCode"):
            name = f" ({facts['stopCodeName']})" if facts.get("stopCodeName") else ""
            out.append(f"버그체크 코드: {facts['stopCode']}{name}")
        if facts.get("faultingModule"):
            out.append(f"문제 모듈: {facts['faultingModule']}")
        if facts.get("exceptionCode"):
            out.append(f"예외: {facts['exceptionCode']} {facts.get('exceptionName', '')}".strip())
        if facts.get("crashTime"):
            out.append(f"발생 시각: {facts['crashTime']}")
        for e in facts.get("notable", [])[:6]:
            out.append(f"Event {e.get('provider')} ID {e.get('id')} — {int(e.get('count') or 0):,}건")
        for code, cnt in (facts.get("wheaById") or {}).items():
            out.append(f"WHEA-Logger {code} — {int(cnt):,}건")
        for code in facts.get("bugchecks", [])[:3]:
            out.append(f"이벤트 로그 속 버그체크: {code}")
    seen, unique = set(), []
    for line in out:
        if line not in seen:
            seen.add(line)
            unique.append(line)
    return unique[:14]


def _sentence_count(text: str) -> int:
    parts = [p for p in re.split(r"(?<=[.!?。])\s+", text.strip()) if p]
    return len(parts)


def validate_summary(raw) -> Optional[dict]:
    """모델이 돌려준 객체가 스키마·길이·안전성 규칙을 모두 만족하면 정제한 요약을, 아니면 None을 돌려준다."""
    if not isinstance(raw, dict) or not set(raw) <= _ALLOWED_KEYS:
        return None
    cause, checks, remote = raw.get("cause"), raw.get("selfCheck"), raw.get("remoteInspection")
    if not (isinstance(cause, str) and isinstance(remote, str) and isinstance(checks, list) and len(checks) == 2):
        return None
    if not all(isinstance(c, str) for c in checks):
        return None
    cause, remote = cause.strip(), remote.strip()
    checks = [c.strip() for c in checks]
    if not cause or len(cause) > 200 or _sentence_count(cause) != 1:
        return None
    if not remote or len(remote) > 200 or any(not c or len(c) > 200 for c in checks):
        return None
    confidence = raw.get("confidence")
    if confidence not in ("low", "medium", "high"):
        return None
    disclaimer = raw.get("disclaimer") if isinstance(raw.get("disclaimer"), str) and 0 < len(raw["disclaimer"]) <= 120 else DEFAULT_DISCLAIMER
    for text in (cause, remote, disclaimer, *checks):
        if _UNSAFE.search(text) or re.search(r"[<>]", text):
            return None
    return {"cause": cause, "selfCheck": checks, "remoteInspection": remote, "confidence": confidence, "disclaimer": disclaimer}


def fallback(reason: str) -> dict:
    return {"fallback": True, "fallbackReason": reason, "summary": dict(FALLBACK_SUMMARY, selfCheck=list(FALLBACK_SUMMARY["selfCheck"]))}


def _call(host, model, log_text, timeout_sec, post):
    payload = {
        "model": model,
        "stream": False,
        "format": "json",
        "think": False,
        "options": {"temperature": 0.1, "num_predict": 500},
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": "분석 로그:\n" + log_text},
        ],
    }
    resp = post(f"{host.rstrip('/')}/api/chat", json=payload, timeout=timeout_sec + 1)
    if resp.status_code == 400 and "think" in resp.text.lower():
        payload.pop("think")
        resp = post(f"{host.rstrip('/')}/api/chat", json=payload, timeout=timeout_sec + 1)
    return resp.status_code, resp.text


def summarize(facts_list, *, post=None) -> dict:
    """검증된 근거 정보 목록으로 요약을 만든다. 항상 {fallback, fallbackReason?, summary} 형태를 돌려준다."""
    cfg = _config()
    log_text = build_log_text(facts_list, cfg["max_chars"])
    if not log_text.strip():
        return fallback("NO_LOG")
    timeout_sec = max(0.2, cfg["timeout_ms"] / 1000.0)
    future = _executor.submit(_call, cfg["host"], cfg["model"], log_text, timeout_sec, post or requests.post)
    started = time.monotonic()
    try:
        status, body = future.result(timeout=timeout_sec)
    except FutureTimeout:
        future.cancel()
        logger.warning("ollama summary deadline exceeded (%d ms)", cfg["timeout_ms"])
        return fallback("OLLAMA_TIMEOUT")
    except requests.Timeout:
        return fallback("OLLAMA_TIMEOUT")
    except requests.RequestException:
        return fallback("OLLAMA_UNREACHABLE")
    except Exception:  # 어떤 예외도 사용자 화면의 오류로 번지지 않게 한다.
        logger.exception("ollama summary unexpected failure")
        return fallback("OLLAMA_ERROR")
    if status >= 400:
        logger.warning("ollama summary HTTP %s in %d ms", status, int((time.monotonic() - started) * 1000))
        return fallback("OLLAMA_HTTP_ERROR")
    try:
        content = (json.loads(body).get("message") or {}).get("content", "")
    except (ValueError, AttributeError):
        return fallback("OLLAMA_BAD_JSON")
    content = re.sub(r"<think>.*?</think>", "", content or "", flags=re.S).strip()
    if not content:
        return fallback("OLLAMA_EMPTY")
    try:
        parsed = json.loads(content)
    except ValueError:
        return fallback("OLLAMA_BAD_JSON")
    cleaned = validate_summary(parsed)
    if cleaned is None:
        return fallback("OLLAMA_SCHEMA_OR_UNSAFE")
    return {"fallback": False, "summary": cleaned}


def diagnostic_summary(result: dict, evidence: list, max_chars: int = 4000) -> str:
    """접수·표시용 진단 요약 문자열을 서버 쪽 값만으로 만든다."""
    summary = result["summary"]
    lines = []
    if result.get("fallback"):
        lines.append(f"자동 요약 실패({result.get('fallbackReason')}). 원본 분석 결과를 전문가 점검 대상으로 접수합니다.")
    else:
        lines.append(f"원인 추정: {summary['cause']}")
        lines.append("자가 조치: " + " / ".join(f"{i}) {s}" for i, s in enumerate(summary["selfCheck"], 1)))
    if evidence:
        lines.append("근거 로그: " + " · ".join(evidence))
    return "\n".join(lines)[:max_chars]
