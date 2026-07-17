"""Ollama 임베딩 모델 래퍼.

sentence-transformers/torch 같은 무거운 의존성을 새로 설치하지 않고,
이미 돌아가는 Ollama에 임베딩 모델만 하나 추가로 받아서(`ollama pull nomic-embed-text`)
의미 기반 검색을 붙이기 위한 얇은 래퍼입니다.

Ollama에 임베딩 모델이 없거나 응답이 안 되면 호출측에서 감지해서
기존 bigram 키워드 검색으로 조용히 폴백해야 합니다 (이 모듈은 예외를 그대로 던짐).
"""
import os

import requests

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = os.environ.get("EMBED_MODEL", "nomic-embed-text")
EMBED_TIMEOUT_SECONDS = float(os.environ.get("EMBED_TIMEOUT_SECONDS", "10"))


def embed(text: str) -> list[float]:
    """텍스트 하나를 임베딩 벡터로 변환합니다. 실패 시 예외를 던집니다."""
    resp = requests.post(
        f"{OLLAMA_HOST}/api/embeddings",
        json={"model": EMBED_MODEL, "prompt": text},
        timeout=EMBED_TIMEOUT_SECONDS,
    )
    resp.raise_for_status()
    data = resp.json()
    vector = data.get("embedding")
    if not vector:
        raise RuntimeError(f"임베딩 응답에 embedding 필드가 없습니다: {data}")
    return vector


def cosine(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a) ** 0.5
    norm_b = sum(y * y for y in b) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)
