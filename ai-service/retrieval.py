"""Keyword-based retrieval over kb/knowledge-base.json.

No embedding model required, so this runs identically on this dev machine
and later on the Mac mini. Two matching strategies combined:
  1. Exact lookup for error codes / event IDs mentioned in the query
     (these are the highest-signal tokens in this domain).
  2. Korean-friendly character-bigram TF-IDF cosine similarity as a
     fallback/ranking signal for free-text symptom descriptions.

If semantic embeddings are added later (Phase 3+), this module's
`search()` signature can stay the same and just get a smarter scorer
behind it.
"""
import json
import math
import re
from collections import Counter
from pathlib import Path

KB_PATH = Path(__file__).resolve().parent.parent / "kb" / "knowledge-base.json"

CODE_PATTERN = re.compile(r"0x[0-9a-fA-F]{4,10}|c0000[0-9a-fA-F]{3,4}", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"(?<!\d)\d{1,5}(?!\d)")


def _normalize_code(value: str) -> str:
    v = value.lower().lstrip("0x").lstrip("0") or "0"
    return v


def _bigrams(text: str) -> Counter:
    cleaned = re.sub(r"\s+", " ", text.strip().lower())
    if len(cleaned) < 2:
        return Counter([cleaned]) if cleaned else Counter()
    return Counter(cleaned[i:i + 2] for i in range(len(cleaned) - 1))


def _doc_text(doc: dict) -> str:
    parts = [
        doc.get("title", ""),
        doc.get("summary", ""),
        doc.get("overview", ""),
        " ".join(c["text"] for c in doc.get("causes", []) if isinstance(c, dict)),
        " ".join(doc.get("checks", [])),
        " ".join(doc.get("conditions", [])),
        " ".join(doc.get("aliases", [])),
        doc.get("source", ""),
    ]
    return " ".join(p for p in parts if p)


class KnowledgeBase:
    def __init__(self, path: Path = KB_PATH):
        raw = json.loads(path.read_text(encoding="utf-8"))
        self.site_name = raw.get("siteName")
        self.site_url = raw.get("siteUrl")
        self.documents = raw["documents"]
        self.by_id = {d["id"]: d for d in self.documents}

        self._doc_bigrams = [_bigrams(_doc_text(d)) for d in self.documents]
        df = Counter()
        for bg in self._doc_bigrams:
            df.update(bg.keys())
        n_docs = max(len(self.documents), 1)
        self._idf = {gram: math.log(1 + n_docs / (1 + count)) for gram, count in df.items()}
        self._doc_norms = [self._vector_norm(bg) for bg in self._doc_bigrams]

    def _vector_norm(self, bigram_counts: Counter) -> float:
        return math.sqrt(sum((count * self._idf.get(g, 0)) ** 2 for g, count in bigram_counts.items())) or 1.0

    def _cosine(self, query_bg: Counter, doc_index: int) -> float:
        doc_bg = self._doc_bigrams[doc_index]
        dot = sum(query_bg[g] * self._idf.get(g, 0) * doc_bg[g] * self._idf.get(g, 0) for g in query_bg if g in doc_bg)
        q_norm = self._vector_norm(query_bg)
        d_norm = self._doc_norms[doc_index]
        if q_norm == 0 or d_norm == 0:
            return 0.0
        return dot / (q_norm * d_norm)

    def _exact_matches(self, query: str) -> list[dict]:
        hits = []
        codes = {_normalize_code(m) for m in CODE_PATTERN.findall(query)}
        numbers = {m for m in NUMBER_PATTERN.findall(query)}
        for doc in self.documents:
            if doc["category"] == "error_code":
                doc_code = _normalize_code(doc["code"])
                aliases = {_normalize_code(a) for a in doc.get("aliases", [])}
                if doc_code in codes or (aliases & codes):
                    hits.append(doc)
            elif doc["category"] == "event_id" and doc.get("eventId") in numbers:
                hits.append(doc)
        return hits

    def search(self, query: str, top_k: int = 5) -> list[dict]:
        exact = self._exact_matches(query)
        exact_ids = {d["id"] for d in exact}

        query_bg = _bigrams(query)
        scored = []
        for i, doc in enumerate(self.documents):
            if doc["id"] in exact_ids:
                continue
            score = self._cosine(query_bg, i)
            if score > 0:
                scored.append((score, doc))
        scored.sort(key=lambda pair: pair[0], reverse=True)

        results = [{"score": 1.0, "match": "exact", **d} for d in exact]
        results += [{"score": round(s, 4), "match": "keyword", **d} for s, d in scored[: max(0, top_k - len(exact))]]
        return results[:top_k]


def format_context(results: list[dict]) -> str:
    """Render retrieved docs as compact context for an LLM prompt."""
    blocks = []
    for r in results:
        if r["category"] == "error_code":
            causes = ", ".join(c["text"] for c in r.get("causes", [])[:3])
            blocks.append(f"[오류코드 {r['code']}] {r['title']}\n원인: {causes}\n점검: {'; '.join(r.get('checks', [])[:3])}")
        elif r["category"] == "event_id":
            causes = ", ".join(c["text"] for c in r.get("causes", [])[:3])
            blocks.append(f"[이벤트 ID {r['eventId']} · {r['source']}] {r['summary']}\n원인: {causes}")
        elif r["category"] == "symptom":
            causes = ", ".join(c["text"] for c in r.get("causes", [])[:3])
            blocks.append(f"[증상: {r['title']}] {r['summary']}\n원인: {causes}")
        elif r["category"] == "component":
            blocks.append(f"[부품: {r['title']}] {r['summary']}")
    return "\n\n".join(blocks)
