"""실제 uvicorn 서버를 띄워 새 API 전체를 시험하는 통합 테스트(가짜 Ollama·Telegram 서버 사용).

실행: python test_api_integration.py   (ai-service 폴더의 가상환경 python으로)
확인 항목: 업로드 차단 코드, AI 요약 성공/timeout/잘못된 JSON fallback, 동일 IP 6번째 호출 429(Ollama 미호출),
접수 성공·Telegram 1회 전송·중복 제출 방지, Telegram 장애 시 접수 보존과 재전송, 개인정보·비밀값 비노출.
"""
import json
import os
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests

import analysis_token
from testutil_fakes import fake_ollama, fake_telegram

SECRET = "integration-secret-" + "x" * 30
TOKEN = "777:INTEGRATION-BOT-TOKEN"
PHONE = "010-9876-5432"


def _free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


class Server:
    def __init__(self, ollama, telegram):
        self.port = _free_port()
        self.dir = Path(tempfile.mkdtemp())
        env = dict(os.environ, OLLAMA_HOST=ollama.url, OLLAMA_TIMEOUT_MS="800", AI_RATE_LIMIT_MAX="5", ANALYSIS_TOKEN_SECRET=SECRET,
                   TELEGRAM_BOT_TOKEN=TOKEN, TELEGRAM_ADMIN_CHAT_ID="42", TELEGRAM_API_BASE=telegram.url, TELEGRAM_RETRY_INTERVAL_SEC="1",
                   REMOTE_REQUEST_STORAGE_PATH=str(self.dir / "remote.jsonl"), AI_INQUIRY_STORAGE_PATH=str(self.dir / "inq.jsonl"),
                   AI_IMPROVEMENT_STORAGE_PATH=str(self.dir / "imp.jsonl"), PYTHONWARNINGS="ignore")
        self.log = open(self.dir / "server.log", "w+")
        self.proc = subprocess.Popen([sys.executable, "-m", "uvicorn", "app:app", "--host", "127.0.0.1", "--port", str(self.port)],
                                     cwd=str(Path(__file__).parent), env=env, stdout=self.log, stderr=subprocess.STDOUT)
        self.base = f"http://127.0.0.1:{self.port}"
        for _ in range(120):
            try:
                if requests.get(self.base + "/api/health", timeout=1).ok:
                    return
            except requests.RequestException:
                time.sleep(0.5)
        raise RuntimeError("서버가 시작되지 않았습니다")

    def logs(self):
        self.log.flush()
        return Path(self.log.name).read_text(encoding="utf-8", errors="ignore")

    def stop(self):
        self.proc.terminate()
        self.proc.wait(timeout=10)


def _tokens(kind="dump"):
    os.environ["ANALYSIS_TOKEN_SECRET"] = SECRET
    return [analysis_token.issue(kind, {"stopCode": "0x116", "stopCodeName": "VIDEO_TDR_FAILURE", "faultingModule": "nvlddmkm.sys"})]


def _post_ai(srv, tokens, ip):
    return requests.post(srv.base + "/api/analysis/ai-summary", json={"analysisTokens": tokens}, headers={"CF-Connecting-IP": ip}, timeout=15)


def _form(name="홍길동", key="idem-12345678", **extra):
    body = {"name": name, "phone": PHONE, "email": "user@example.com", "preferredContact": "phone", "consent": True,
            "idempotencyKey": key, "analysisTokens": _tokens()}
    body.update(extra)
    return body


def main():
    ollama, telegram = fake_ollama(), fake_telegram()
    srv = Server(ollama, telegram)
    results = []
    try:
        # 1) 업로드 차단 ---------------------------------------------------------
        def upload(name, data):
            return requests.post(srv.base + "/api/minidump/analyze", files={"file": (name, data)}, timeout=15)
        r = upload("x.dmp", b"")
        assert r.status_code == 422 and r.json()["error"]["code"] == "DUMP_EMPTY" and "권한" in r.json()["detail"], r.text
        r = upload("x.exe", b"MDMP" + b"\0" * 500)
        assert r.status_code == 400 and r.json()["error"]["code"] == "UNSUPPORTED_EXTENSION"
        r = upload("x.dmp", b"MDMP" + b"\0" * 20)
        assert r.status_code == 422 and r.json()["error"]["code"] == "DUMP_TRUNCATED"
        r = requests.post(srv.base + "/api/evtx/analyze", files={"file": ("a.evtx", b"")}, timeout=15)
        assert r.status_code == 422 and r.json()["error"]["code"] == "EVTX_EMPTY"
        r = requests.post(srv.base + "/api/evtx/analyze", files={"file": ("a.txt", b"x" * 5000)}, timeout=15)
        assert r.status_code == 400
        results.append("업로드 차단(0바이트·확장자·너무 작은 파일) OK")

        # 2) AI 요약: 성공 / timeout / 잘못된 JSON ---------------------------------
        tokens = _tokens()
        r = _post_ai(srv, tokens, "203.0.113.10")
        body = r.json()
        assert r.status_code == 200 and body["fallback"] is False and len(body["summary"]["selfCheck"]) == 2, r.text
        assert any("0x116" in e for e in body["evidence"]) and any("nvlddmkm.sys" in e for e in body["evidence"])
        assert "summaryToken" in body and "원인 추정" in body["diagnosticSummary"]
        ollama.mode = "slow"
        ollama.delay = 3
        started = time.monotonic()
        r = _post_ai(srv, tokens, "203.0.113.11")
        assert r.status_code == 200 and r.json()["fallback"] is True and r.json()["fallbackReason"] == "OLLAMA_TIMEOUT", r.text
        assert time.monotonic() - started < 3, "timeout fallback이 deadline을 넘겼습니다"
        ollama.mode = "badjson"
        r = _post_ai(srv, tokens, "203.0.113.12")
        assert r.status_code == 200 and r.json()["fallback"] is True and r.json()["fallbackReason"] == "OLLAMA_BAD_JSON"
        ollama.mode = "ok"
        r = _post_ai(srv, ["위조.토큰"], "203.0.113.13")
        assert r.status_code == 400 and r.json()["error"]["code"] == "INVALID_ANALYSIS"
        results.append("AI 요약 성공·5초 deadline fallback·잘못된 JSON fallback·위조 토큰 거부 OK")

        # 3) 동일 IP 6번째 호출 429 + Ollama 미호출 --------------------------------
        before = len(ollama.requests)
        for i in range(5):
            assert _post_ai(srv, tokens, "198.51.100.50").status_code == 200
        calls_after_five = len(ollama.requests)
        assert calls_after_five == before + 5
        r = _post_ai(srv, tokens, "198.51.100.50")
        assert r.status_code == 429 and r.json()["error"]["code"] == "RATE_LIMITED" and r.json()["retryAfterSec"] > 0
        assert len(ollama.requests) == calls_after_five, "429인데 Ollama가 호출됐습니다"
        assert _post_ai(srv, tokens, "198.51.100.51").status_code == 200   # 다른 IP는 영향 없음
        results.append("동일 IP 6번째 AI 호출 429(Ollama 미호출) OK")

        # 4) 원격 점검 접수: 성공·Telegram 1회·중복 방지 ---------------------------
        ai = _post_ai(srv, tokens, "192.0.2.77").json()
        form = _form(summaryToken=ai["summaryToken"])
        form["diagnosticSummary"] = "클라이언트가 보낸 가짜 요약 — 무시되어야 함"
        r = requests.post(srv.base + "/api/remote-inspection-requests", json=form, headers={"CF-Connecting-IP": "192.0.2.77"}, timeout=15)
        assert r.status_code == 201 and r.json()["ok"] and r.json()["requestId"].startswith("ri_"), r.text
        request_id = r.json()["requestId"]
        time.sleep(1.0)
        assert len(telegram.requests) == 1, len(telegram.requests)
        sent = json.loads(telegram.requests[0]["body"])["text"]
        assert PHONE in sent and "홍길동" in sent and request_id in sent and "0x116" in sent and "가짜 요약" not in sent
        dup = requests.post(srv.base + "/api/remote-inspection-requests", json=form, headers={"CF-Connecting-IP": "192.0.2.77"}, timeout=15)
        assert dup.status_code == 200 and dup.json()["requestId"] == request_id and dup.json()["duplicate"] is True
        time.sleep(0.5)
        assert len(telegram.requests) == 1, "중복 제출로 알림이 다시 갔습니다"
        bad = requests.post(srv.base + "/api/remote-inspection-requests", json=_form(name="", key="idem-aaaaaaaa"), timeout=15)
        assert bad.status_code == 422 and bad.json()["error"]["code"] == "INVALID_INPUT"
        bad2 = requests.post(srv.base + "/api/remote-inspection-requests", json=_form(consent=False, key="idem-bbbbbbbb"), timeout=15)
        assert bad2.status_code == 422 and bad2.json()["field"] == "consent"
        nokey = requests.post(srv.base + "/api/remote-inspection-requests", json=dict(_form(), idempotencyKey=""), timeout=15)
        assert nokey.status_code == 422
        noanalysis = requests.post(srv.base + "/api/remote-inspection-requests", json=_form(analysisTokens=[], key="idem-cccccccc"), timeout=15)
        assert noanalysis.status_code == 400 and noanalysis.json()["error"]["code"] == "INVALID_ANALYSIS"
        results.append("접수 성공·서버 재생성 요약·Telegram 1회·중복 제출 방지·입력 검증 OK")

        # 5) Telegram 장애 → 접수 보존·pending → 복구 후 재전송 ----------------------
        telegram.mode = "down"
        r5 = requests.post(srv.base + "/api/remote-inspection-requests", json=_form(key="idem-down-0001"), headers={"CF-Connecting-IP": "192.0.2.78"}, timeout=20)
        assert r5.status_code == 201, r5.text
        down_id = r5.json()["requestId"]
        time.sleep(1.5)
        stored = [json.loads(x) for x in Path(srv.dir / "remote.jsonl").read_text(encoding="utf-8").splitlines()]
        entry = next(x for x in stored if x["requestId"] == down_id)
        assert entry["notificationStatus"] == "pending" and entry["phone"] == PHONE
        telegram.mode = "ok"
        for _ in range(15):
            time.sleep(1)
            stored = [json.loads(x) for x in Path(srv.dir / "remote.jsonl").read_text(encoding="utf-8").splitlines()]
            if next(x for x in stored if x["requestId"] == down_id)["notificationStatus"] == "sent":
                break
        else:
            raise AssertionError("복구 뒤 재전송이 되지 않았습니다")
        results.append("Telegram 장애 시 접수 보존(pending)·복구 후 재전송 OK")

        # 6) 응답·서버 로그에 비밀값·개인정보가 없는지 --------------------------------
        logs = srv.logs()
        assert TOKEN not in logs and SECRET not in logs and PHONE not in logs and "user@example.com" not in logs and "홍길동" not in logs
        for resp in (r5, bad, bad2, noanalysis):
            assert TOKEN not in resp.text and PHONE not in resp.text
        results.append("서버 로그·응답에 Telegram 토큰·서명 비밀값·연락처 없음 OK")
    finally:
        srv.stop()
        ollama.stop()
        telegram.stop()
    print("\n".join(results))
    print("ALL INTEGRATION CHECKS PASSED")


if __name__ == "__main__":
    main()
