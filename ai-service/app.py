"""ITSVC AI 진단 API.

Local dev (this machine, before the Mac mini arrives):
    uvicorn app:app --reload --port 8090
    -> works fully; OLLAMA_HOST unreachable just means /api/ask
       returns retrieved sources with no generated answer (mock mode).

On the Mac mini (once Ollama is installed):
    ollama pull qwen3.5:9b
    OLLAMA_MODEL=qwen3.5:9b uvicorn app:app --host 0.0.0.0 --port 8090
    -> same code, now returns a generated answer grounded in the sources.
"""
import os
import re
import time
import logging
from typing import List, Optional

import requests
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import minidump_parser

load_dotenv()

from coupang import CoupangPartnersClient
from inquiry_store import store_inquiry
from retrieval import KnowledgeBase, format_context

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3.5:9b")
# 프론트엔드(app.js의 AI_ASK_TIMEOUT_MS)가 요청 전체에 60초 한도를 두고
# 있어서, 여기서 그 한도를 넘기면 백엔드가 응답을 만들어도 프론트가 이미
# 포기한 뒤라 아무 결과도 못 받는다. 임베딩 조회(수백 ms)와 두 구간의
# 네트워크 왕복(cloudflared 터널 경유)에 쓸 여유를 8초 정도 남기고,
# 나머지를 전부 생성 시간에 배정한다.
OLLAMA_TIMEOUT_SECONDS = float(os.environ.get("OLLAMA_TIMEOUT_SECONDS", "52"))
# 종합진단(여러 항목을 한 번에 묻는 /api/ask)은 원인 후보와 우선순위별
# 점검 순서를 여러 항목에 걸쳐 정리해야 해서 500 토큰으로는 문장 중간에
# 잘렸다(실사용 화면에서 확인됨). 1400으로 올려도 여전히 끝에서 잘리는
# 사례가 있어 2000으로 재조정. num_predict는 "최대" 길이일 뿐 강제로
# 채우는 값이 아니라, 짧게 끝날 답변은 그대로 짧게 끝난다.
OLLAMA_NUM_PREDICT = int(os.environ.get("OLLAMA_NUM_PREDICT", "2000"))
logger = logging.getLogger("itsvc.ai")

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
_ssd_link_cache: dict = {}

# SSD 형태는 호환성과 검색어를 위한 정보이며, TBW는 실제 제품별 보증 스펙이 우선이다.
_SSD_FORM_FACTORS = {
    "sata-25": "2.5인치 SATA SSD",
    "m2-sata": "M.2 SATA SSD",
    "m2-nvme": "M.2 NVMe SSD",
    "unknown": "SSD",
}
_SSD_NAND_TYPES = {"tlc": "TLC", "qlc": "QLC", "unknown": ""}
_SSD_CAPACITY_TIERS = (500, 1000, 2000, 4000)

SYSTEM_PROMPT = (
    "당신은 PC 윈도우 진단 센터(ITSVC)의 진단 도우미입니다. "
    "아래 제공된 자료(오류코드/이벤트ID/증상/부품 설명)에 근거해서만 답하세요. "
    "제공된 자료에 없는 내용은 추측하지 말고 모른다고 답하세요. "
    "질문에 오류코드나 이벤트 ID가 있으면 그 ID의 자료만 근거로 삼고 다른 ID의 해결법을 섞지 마세요. "
    "먼저 사용자의 질문에 직접 답하고, 자료와 질문이 맞지 않으면 관련 자료가 부족하다고 밝히세요. "
    "답변은 반드시 순수 한국어(한글)로만 작성하세요. "
    "중국어 한자(漢字)나 중국어 단어를 단 한 글자도 섞지 마세요. "
    "원인 후보 → 점검 순서 순으로 간결하게 작성하세요."
)
# 모델이 지시를 어기고 한자를 섞어 출력하는 경우에 대비한 마지막 방어선.
# 한글(가-힣)·자모와는 겹치지 않는 한자 유니코드 범위만 제거한다.
_HANJA_PATTERN = re.compile(r"[一-鿿]+")
_EXTRA_SPACE_PATTERN = re.compile(r"[ \t]{2,}")


def strip_hanja(text: str) -> str:
    cleaned = _HANJA_PATTERN.sub("", text)
    return _EXTRA_SPACE_PATTERN.sub(" ", cleaned)


class AskRequest(BaseModel):
    question: str
    top_k: int = 5
    save_for_improvement: bool = False


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
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": OLLAMA_NUM_PREDICT},
    }
    try:
        # Ollama 버전별로 `think` 옵션 지원 여부가 다르므로 우선 사용하되,
        # 400 응답이면 호환 payload로 한 번만 재시도합니다.
        primary_payload = {**payload, "think": False}
        resp = requests.post(f"{OLLAMA_HOST}/api/generate", json=primary_payload, timeout=OLLAMA_TIMEOUT_SECONDS)
        if resp.status_code == 400:
            logger.warning("Ollama rejected think option; retrying compatibility payload")
            resp = requests.post(f"{OLLAMA_HOST}/api/generate", json=payload, timeout=OLLAMA_TIMEOUT_SECONDS)
        resp.raise_for_status()
        answer = resp.json().get("response", "").strip()
        answer = strip_hanja(answer).strip()
        return answer or None
    except (requests.RequestException, ValueError) as exc:
        logger.warning("Ollama generation failed: %s", str(exc)[:240])
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


@app.get("/api/coupang/ssd-link")
def ssd_link(capacity: int, form_factor: str = "unknown", nand_type: str = "unknown"):
    """선택한 SSD 형태·NAND·용량으로 쿠팡 검색 딥링크를 생성한다."""
    if not coupang.configured:
        raise HTTPException(status_code=503, detail="쿠팡파트너스 API 키가 설정되지 않았습니다.")
    if form_factor not in _SSD_FORM_FACTORS or nand_type not in _SSD_NAND_TYPES:
        raise HTTPException(status_code=400, detail="지원하지 않는 SSD 선택값입니다.")

    tier = min((size for size in _SSD_CAPACITY_TIERS if size >= capacity), default=_SSD_CAPACITY_TIERS[-1])
    cache_key = (tier, form_factor, nand_type)
    if cache_key in _ssd_link_cache:
        return {"capacity": tier, "url": _ssd_link_cache[cache_key]}

    query_parts = [_SSD_FORM_FACTORS[form_factor], f"{tier}GB", _SSD_NAND_TYPES[nand_type]]
    query = " ".join(part for part in query_parts if part)
    try:
        url = coupang.search_link_for_query(query)
    except Exception as exc:  # noqa: BLE001 - surface upstream failure as 502
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    _ssd_link_cache[cache_key] = url
    return {"capacity": tier, "url": url}


_DUMP_MAX_BYTES = 64 * 1024 * 1024  # 64 MB — 미니덤프는 보통 256 KB 이하


@app.post("/api/minidump/analyze")
async def analyze_minidump(file: UploadFile = File(...)):
    """Windows 미니덤프(.dmp) 파일을 분석해 STOP 코드와 결함 모듈을 반환합니다.

    파일은 분석 즉시 삭제되며 저장되지 않습니다.
    """
    if not (file.filename or "").lower().endswith(".dmp"):
        raise HTTPException(status_code=400, detail="확장자가 .dmp인 파일만 지원합니다.")

    data = await file.read(_DUMP_MAX_BYTES + 1)
    if len(data) > _DUMP_MAX_BYTES:
        raise HTTPException(status_code=413, detail="파일 크기가 64 MB를 초과합니다. 미니덤프를 사용하세요.")

    if not minidump_parser.is_valid(data):
        if minidump_parser.is_kernel_or_full_dump(data):
            raise HTTPException(
                status_code=400,
                detail={
                    "type": "kernel_or_full_dump",
                    "message": (
                        "이 파일은 커널/전체 메모리 덤프 형식이라 이 분석기가 지원하는 "
                        "작은 미니덤프(MDMP)와 다릅니다."
                    ),
                },
            )
        raise HTTPException(status_code=400, detail="유효한 Windows 미니덤프 파일이 아닙니다. 파일 헤더가 일치하지 않습니다.")

    result = minidump_parser.parse(data)

    if "error" in result:
        raise HTTPException(status_code=422, detail=result["error"])

    return result


@app.post("/api/ask", response_model=AskResponse)
def ask(req: AskRequest):
    start = time.monotonic()
    results = kb.search(req.question, top_k=req.top_k)
    context = format_context(results)

    answer = call_ollama(req.question, context) if results else None
    latency_ms = int((time.monotonic() - start) * 1000)

    # AI 이용과 문의 저장 동의를 분리한다. 체크하지 않은 요청은 어떤 문의 내용도 남기지 않는다.
    if req.save_for_improvement:
        try:
            store_inquiry(req.question, [result["id"] for result in results])
        except (OSError, ValueError):
            # 개선 데이터 저장 실패가 사용자의 AI 진단 이용을 막아서는 안 된다.
            pass

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
