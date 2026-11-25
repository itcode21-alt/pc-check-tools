"""테스트용 가짜 Ollama·Telegram 서버(표준 라이브러리만 사용)."""
import json
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VALID_SUMMARY = {
    "cause": "그래픽 드라이버가 충돌해 Windows가 보호를 위해 재시작했을 가능성이 큽니다.",
    "selfCheck": ["최근 설치한 그래픽 드라이버를 제조사 공식 버전으로 다시 설치하세요.", "Windows 업데이트를 완료한 뒤 같은 증상이 반복되는지 확인하세요."],
    "remoteInspection": "반복되거나 부팅이 어려우면 원격 점검을 신청해 주세요.",
    "confidence": "medium",
    "disclaimer": "참고용 자동 요약이며 최종 진단은 추가 점검이 필요합니다.",
}


class FakeServer:
    """mode를 바꿔 가며 성공·지연·오류 응답을 흉내 낸다. requests에 받은 요청이 쌓인다."""

    def __init__(self, handler_factory):
        self.mode = "ok"
        self.requests = []
        self.delay = 3.0
        outer = self

        class Handler(BaseHTTPRequestHandler):
            def log_message(self, *args):
                pass

            def do_POST(self):
                length = int(self.headers.get("Content-Length") or 0)
                body = self.rfile.read(length).decode("utf-8") if length else ""
                outer.requests.append({"path": self.path, "body": body, "headers": dict(self.headers)})
                handler_factory(outer, self, body)

        self.httpd = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    @property
    def url(self):
        return f"http://127.0.0.1:{self.port}"

    def stop(self):
        self.httpd.shutdown()


def _send(handler, status, payload):
    data = payload if isinstance(payload, bytes) else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(data)))
    handler.end_headers()
    handler.wfile.write(data)


def _ollama(server, handler, body):
    mode = server.mode
    if mode == "slow":
        time.sleep(server.delay)
    if mode == "http500":
        return _send(handler, 500, {"error": "boom"})
    if mode == "badjson":
        return _send(handler, 200, {"message": {"content": "이건 JSON이 아닙니다"}})
    if mode == "empty":
        return _send(handler, 200, {"message": {"content": ""}})
    if mode == "badschema":
        return _send(handler, 200, {"message": {"content": json.dumps({"cause": "하나.", "selfCheck": ["하나만"], "remoteInspection": "원격", "confidence": "high"}, ensure_ascii=False)}})
    if mode == "unsafe":
        bad = dict(VALID_SUMMARY, selfCheck=["PowerShell에서 sfc /scannow 를 실행하세요.", VALID_SUMMARY["selfCheck"][1]])
        return _send(handler, 200, {"message": {"content": json.dumps(bad, ensure_ascii=False)}})
    return _send(handler, 200, {"message": {"content": json.dumps(VALID_SUMMARY, ensure_ascii=False)}})


def _telegram(server, handler, body):
    if server.mode == "down":
        return _send(handler, 502, {"ok": False})
    return _send(handler, 200, {"ok": True})


def fake_ollama():
    return FakeServer(_ollama)


def fake_telegram():
    return FakeServer(_telegram)
