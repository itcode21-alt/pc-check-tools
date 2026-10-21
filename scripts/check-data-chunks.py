"""data.js(원본)와 분할 파일(data-*.js)의 항목이 서로 일치하는지 점검한다.

배경: scripts/split-data.mjs 는 data.js 를 유일한 원본으로 두고 data-error-codes.js 등 분할 파일을 파생한다.
data.js 만 고치고 split-data.mjs 를 다시 돌리지 않으면 분할 파일이 낡는다. Node 없이도 이 불일치를 잡기 위한 점검이다.

보는 것: 각 카테고리의 항목 식별자(오류 코드의 code, 증상·이벤트의 id) 목록이 data.js 와 분할 파일에서 같은가.
보지 않는 것: 항목 안의 모든 필드 값(data.js 는 JS 객체 리터럴이라 표준 JSON 으로 읽을 수 없음).

사용법 (사이트 루트에서):
  python -X utf8 scripts/check-data-chunks.py          # 어긋나면 종료 코드 1
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (data.js 의 최상위 키, 식별자 필드, 분할 파일)
CATEGORIES = [
    ("errorCodes", "code", "data-error-codes.js"),
    ("symptoms", "id", "data-symptoms.js"),
    ("eventViewerCodes", "id", "data-event-codes.js"),
]


def load_chunk(path):
    """분할 파일은 Object.assign(window.SITE_DATA || {}, {...}); 형태의 표준 JSON 이다."""
    text = path.read_text(encoding="utf-8")
    start = text.find("|| {},")
    if start < 0:
        raise ValueError("Object.assign(window.SITE_DATA || {}, ...) 형태가 아닙니다")
    i = text.find("{", start + 6)
    j = text.rfind("});")
    return json.loads(text[i : j + 1])


def top_level_blocks(text):
    """data.js 의 '  키: ' 로 시작하는 최상위 블록 경계를 찾는다."""
    marks = [(m.start(), m.group(1)) for m in re.finditer(r"^  (\w+):", text, flags=re.M)]
    blocks = {}
    for idx, (pos, key) in enumerate(marks):
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(text)
        blocks[key] = text[pos:end]
    return blocks


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    data_text = (ROOT / "data.js").read_text(encoding="utf-8")
    blocks = top_level_blocks(data_text)
    problems = []
    for key, field, chunk_name in CATEGORIES:
        if key not in blocks:
            problems.append(f"data.js 에서 '{key}' 블록을 찾지 못했습니다(형식이 바뀌었을 수 있음)")
            continue
        in_js = re.findall(r"^\s{4,8}" + field + r': "([^"]+)"', blocks[key], flags=re.M)
        chunk = load_chunk(ROOT / chunk_name)
        in_chunk = [item[field] for item in chunk[key]]
        a, b = set(in_js), set(in_chunk)
        print(f"{key}: data.js {len(in_js)}개(고유 {len(a)}) / {chunk_name} {len(in_chunk)}개(고유 {len(b)})")
        if not in_js:
            problems.append(f"{key}: data.js 에서 항목을 하나도 읽지 못했습니다(점검 불가)")
        if a - b:
            problems.append(f"{key}: data.js 에만 있음 {sorted(a - b)[:5]} 등 {len(a - b)}개 -> split-data.mjs 를 다시 실행하세요")
        if b - a:
            problems.append(f"{key}: {chunk_name} 에만 있음 {sorted(b - a)[:5]} 등 {len(b - a)}개 -> data.js 와 어긋남")
        if len(in_js) != len(in_chunk):
            problems.append(f"{key}: 항목 수가 다릅니다({len(in_js)} vs {len(in_chunk)})")
    if problems:
        print(f"\n어긋난 곳 {len(problems)}건:")
        for item in problems:
            print("  -", item)
        return 1
    print("\n어긋난 곳 없음")
    return 0


if __name__ == "__main__":
    sys.exit(main())
