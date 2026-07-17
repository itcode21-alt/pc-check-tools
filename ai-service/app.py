"""ITSVC AI 진단 API.

Local dev (this machine, before the Mac mini arrives):
    uvicorn app:app --reload --port 8090
    -> works fully; OLLAMA_HOST unreachable just means /api/ask
       returns retrieved sources with no generated answer (mock mode).

On the Mac mini (once Ollama is installed):
    ollama pull qwen3:8b
    OLLAMA_MODEL=qwen3:8b uvicorn app:app --host 0.0.0.0 --port 8090
    -> same code, now returns a generated answer grounded in the sources.
"""
import os
import time
from typing import List, Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

from coupang import CoupangPartnersClient
from retrieval import KnowledgeBase, format_context

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:8b")
OLLAMA_TIMEOUT_SECONDS = float(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "20"))

app = FastAPI(title="ITSVC AI 진단 API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://itsvc.co.kr", "http://localhost:8811"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

kb = KnowledgeBase()
coupang = CoupangPartnersClient()
_psu_link_cache: dict = {}

SYSTEM_PROMPT = (
    "당신은 PC 윈도우 진단 센터(ITSVC)의 진단 도우미입니다. "
    "아래 제공된 자료(오류코드/이벤트ID/증상/부품 설명)에 근거해서만 답하세요. "
    "제공된 자료에 없는 내용은 추측하지 말고 모른다고 답하세요. "
    "답변은 한국어로, 원인 후보 → 점검 순서 순으로 간결하게 작성하세요."
)


class AskRequest(BaseModel):
    question: str
    top_k: int = 5


class Source(BaseModel):
    id: str
    category: str
    title: Optional[str] = None
    detailPage: Optional[str] = None
    score: float


class AskResponse(BaseModel):
    answer: Optional[str]
    sources: List[Source]
    generated: bool
    latency_ms: int


def call_ollama(question: str, context: str) -> Optional[str]:
    prompt = f"{SYSTEM_PROMPT}\n\n[참고 자료]\n{context}\n\n[사용자 질문]\n{question}"
    try:
        resp = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=OLLAMA_TIMEOUT_SECONDS,
        )
        resp.raise_for_status()
        return resp.json().get("response", "").strip() or None
    except requests.RequestException:
        return None


@app.get("/api/health")
def health():
    ollama_up = False
    try:
        r = requests.get(f"{OLLAMA_HOST}/api/tags", timeout=2)
        ollama_up = r.ok
    except requests.RequestException:
        pass
    return {"kb_documents": len(kb.documents), "ollama_reachable": ollama_up, "model": OLLAMA_MODEL}


@app.get("/api/coupang/psu-link")
def psu_link(watt: int):
    if not coupang.configured:
        raise HTTPException(status_code=503, detail="쿠팡파트너스 API 키가 설정되지 않았습니다.")
    tier = min((s for s in (450, 500, 550, 600, 650, 700, 750, 800, 850, 1000, 1200) if s >= watt), default=1200)
    if tier in _psu_link_cache:
        return {"watt": tier, "url": _psu_link_cache[tier]}
    try:
        url = coupang.search_link_for_query(f"파워서플라이 {tier}W 80plus")
    except Exception as exc:  # noqa: BLE001 - surface upstream failure as 502
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    _psu_link_cache[tier] = url
    return {"watt": tier, "url": url}


@app.post("/api/ask", response_model=AskResponse)
def ask(req: AskRequest):
    start = time.monotonic()
    results = kb.search(req.question, top_k=req.top_k)
    context = format_context(results)

    answer = call_ollama(req.question, context) if results else None
    latency_ms = int((time.monotonic() - start) * 1000)

    return AskResponse(
        answer=answer,
        sources=[
            Source(
                id=r["id"],
                category=r["category"],
                title=r.get("title") or r.get("summary"),
                detailPage=r.get("detailPage"),
                score=r["score"],
            )
            for r in results
        ],
        generated=answer is not None,
        latency_ms=latency_ms,
    )
