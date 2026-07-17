#!/usr/bin/env python3
"""Search Console 쿼리 데이터로 콘텐츠 갭 후보를 찾습니다.

사용법:
  1. Google Search Console > 실적(Performance) > 쿼리 탭에서 CSV로 내보내기
     (기간은 최근 3개월 권장, 열: Query, Clicks, Impressions, CTR, Position)
  2. python3 analyze-search-console.py <내보낸 CSV 경로>

Naver Datalab API 없이도 동작하도록, 사이트에 실제로 유입되는 검색어(Search Console
자체 데이터)를 data.js의 기존 콘텐츠와 대조해서 아래 두 유형의 후보를 찾습니다:
  - 노출은 많은데 클릭이 거의 없는 쿼리 (제목/설명이 검색 의도와 안 맞을 가능성)
  - 8~20위권이라 콘텐츠를 보강하면 1페이지 진입 가능성이 있는 쿼리
그리고 이미 존재하는 페이지 제목과 겹치는 쿼리는 "이미 커버됨"으로 표시해 제외합니다.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_JS = ROOT / "data.js"

MIN_IMPRESSIONS = 20
LOW_CTR_THRESHOLD = 0.02
STRIKING_DISTANCE_MIN = 8
STRIKING_DISTANCE_MAX = 20


def load_existing_titles() -> list[str]:
    """data.js에서 title/summary 텍스트를 뽑아 '이미 다루는 주제' 목록으로 사용합니다."""
    text = DATA_JS.read_text(encoding="utf-8")
    titles = re.findall(r'title:\s*"([^"]+)"', text)
    summaries = re.findall(r'summary:\s*"([^"]+)"', text)
    return [t.lower() for t in titles + summaries]


def is_covered(query: str, existing_texts: list[str]) -> bool:
    """쿼리 토큰의 과반 이상이 '같은 문서 하나'에 함께 등장할 때만 커버된 것으로 봅니다.
    문서를 가리지 않고 흔한 단어("오류", "코드" 등)가 여기저기서 하나씩 걸리는 것을
    커버로 오인하지 않도록, 반드시 단일 문서 내 동시 등장 비율로 판단합니다."""
    tokens = [t for t in re.split(r"\s+", query.lower()) if len(t) >= 2]
    if not tokens:
        return False
    for text in existing_texts:
        hits = sum(1 for t in tokens if t in text)
        if hits / len(tokens) >= 0.6:
            return True
    return False


def read_csv_rows(csv_path: Path) -> list[dict]:
    with csv_path.open(encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            # Search Console 내보내기 열 이름이 언어 설정에 따라 다를 수 있어 유연하게 매칭
            normalized = {k.strip().lower(): v for k, v in row.items()}
            rows.append(normalized)
        return rows


def to_number(value: str) -> float:
    if not value:
        return 0.0
    cleaned = value.replace(",", "").replace("%", "").strip()
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"파일을 찾을 수 없습니다: {csv_path}")
        sys.exit(1)

    rows = read_csv_rows(csv_path)
    existing_texts = load_existing_titles()

    low_ctr_candidates = []
    striking_distance_candidates = []

    for row in rows:
        query = row.get("query") or row.get("쿼리") or ""
        if not query:
            continue
        impressions = to_number(row.get("impressions") or row.get("노출수") or "0")
        clicks = to_number(row.get("clicks") or row.get("클릭수") or "0")
        ctr = to_number(row.get("ctr") or row.get("클릭률") or "0")
        position = to_number(row.get("position") or row.get("평균 게재순위") or "0")

        if impressions < MIN_IMPRESSIONS:
            continue
        if is_covered(query, existing_texts):
            continue

        if ctr < LOW_CTR_THRESHOLD * 100 and clicks < impressions * LOW_CTR_THRESHOLD:
            low_ctr_candidates.append((query, impressions, clicks, position))

        if STRIKING_DISTANCE_MIN <= position <= STRIKING_DISTANCE_MAX:
            striking_distance_candidates.append((query, impressions, clicks, position))

    print(f"분석한 쿼리 수: {len(rows)}\n")

    print(f"=== 노출은 많은데 클릭이 적은 쿼리 (제목/설명 점검 후보, {len(low_ctr_candidates)}건) ===")
    for query, impressions, clicks, position in sorted(low_ctr_candidates, key=lambda x: -x[1])[:20]:
        print(f"  {query!r:40s} 노출 {int(impressions):>6} | 클릭 {int(clicks):>4} | 평균순위 {position:.1f}")

    print(f"\n=== 8~20위권, 콘텐츠 보강 시 1페이지 가능성 있는 쿼리 ({len(striking_distance_candidates)}건) ===")
    for query, impressions, clicks, position in sorted(striking_distance_candidates, key=lambda x: -x[1])[:20]:
        print(f"  {query!r:40s} 노출 {int(impressions):>6} | 클릭 {int(clicks):>4} | 평균순위 {position:.1f}")


if __name__ == "__main__":
    main()
