"""retrieval 정확 매칭 회귀 테스트. 실행: python test_retrieval.py (pytest도 가능)

실제 kb/knowledge-base.json 대신 합성 문서만 쓴다(KB를 다시 만들어도 결과가 흔들리지 않게).
핵심은 블루스크린에서 흔한 짧은 표기(0x7B, 0x1A, 0x10E)가 오류코드로 인식되고, 그 숫자가
이벤트 ID(7, 1, 10)로 잘못 새지 않는 것이다. 예전 정규식은 0x 뒤 4자리 이상만 코드로 봐서
0x7B를 물으면 이벤트 ID 7번 문서가 1위로 나왔다.
"""
import json
import tempfile
from pathlib import Path

import retrieval


def err(code, title, aliases=()):
    return {"id": "errorcode-" + code.lower(), "category": "error_code", "code": code, "title": title,
            "summary": title, "causes": [], "checks": [], "aliases": list(aliases)}


def event(event_id, source):
    return {"id": f"event-{source.lower()}-{event_id}", "category": "event_id", "eventId": str(event_id),
            "source": source, "summary": f"{source} {event_id} 기록", "causes": [], "checks": []}


DOCS = [
    err("0x0000007B", "INACCESSIBLE_BOOT_DEVICE"),
    err("0x0000001A", "MEMORY_MANAGEMENT"),
    err("0x00000050", "PAGE_FAULT_IN_NONPAGED_AREA"),
    err("0x0000000A", "IRQL_NOT_LESS_OR_EQUAL"),
    err("0x0000010E", "VIDEO_MEMORY_MANAGEMENT_INTERNAL"),
    err("0x00000124", "WHEA_UNCORRECTABLE_ERROR"),
    err("0xC000021A", "Critical System Process 종료", aliases=["c000021a", "0xc000021a"]),
    event(7, "Disk"),
    event(1, "Kernel-General"),
    event(10, "WinMgmt"),
    event(41, "Kernel-Power"),
]


def make_kb():
    tmp = Path(tempfile.mkdtemp()) / "kb.json"
    tmp.write_text(json.dumps({"siteName": "t", "siteUrl": "https://t", "documents": DOCS}, ensure_ascii=False), encoding="utf-8")
    return retrieval.KnowledgeBase(tmp)


KB = make_kb()


def codes_of(results):
    return [r.get("code") or r["id"] for r in results]


def test_short_hex_forms_match_full_codes():
    for query, want in [("0x7B", "0x0000007B"), ("0x1A", "0x0000001A"), ("0x50", "0x00000050"),
                        ("0xA", "0x0000000A"), ("0x10E", "0x0000010E"), ("0x124", "0x00000124"),
                        ("0X7b", "0x0000007B")]:
        assert codes_of(KB.search(query))[0] == want, (query, codes_of(KB.search(query)))


def test_short_form_digits_do_not_leak_into_event_ids():
    # 0x7B, 0x1A, 0x10E의 숫자 부분 7/1/10이 이벤트 ID 문서로 잡히면 안 된다.
    for query in ["0x7B", "0x1A", "0x10E", "블루스크린 0x7B 부팅 안됨"]:
        assert all(r["category"] != "event_id" for r in KB.search(query)), query


def test_full_and_long_forms_still_work():
    assert codes_of(KB.search("0x0000007B"))[0] == "0x0000007B"
    assert codes_of(KB.search("0x0000007b error"))[0] == "0x0000007B"
    assert codes_of(KB.search("블루스크린 0x0000010E 발생"))[0] == "0x0000010E"
    assert codes_of(KB.search("0xC000021A"))[0] == "0xC000021A"
    assert codes_of(KB.search("c000021a"))[0] == "0xC000021A"


def test_event_id_queries_still_match():
    assert KB.search("이벤트 41")[0]["eventId"] == "41"
    assert KB.search("Kernel-Power 41 재부팅")[0]["eventId"] == "41"


def test_code_and_event_id_in_one_query_return_both():
    res = KB.search("0x7B 이벤트 41", top_k=5)
    got = {(r["category"], r.get("code") or r.get("eventId")) for r in res}
    assert ("error_code", "0x0000007B") in got and ("event_id", "41") in got, got


def test_code_glued_to_letters_is_not_a_code():
    # 영숫자에 붙은 0x는 코드가 아니다(예전엔 4자리 이상일 때만 이런 오탐이 가능했다).
    assert retrieval.CODE_PATTERN.findall("abc0x7Bdef") == []
    assert retrieval.CODE_PATTERN.findall("코드0x7B입니다") == ["0x7B"]


if __name__ == "__main__":
    failed = 0
    for name, fn in sorted(globals().items()):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print("OK  ", name)
            except AssertionError as exc:
                failed += 1
                print("FAIL", name, exc)
    raise SystemExit(1 if failed else 0)
