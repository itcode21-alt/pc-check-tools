"""analysis_token 회귀 테스트: 서명·만료·위조 검증과 근거 정보 추출 시 개인정보성 값이 빠지는지 확인한다."""
import time

import analysis_token as T


def test_issue_and_verify_roundtrip():
    token = T.issue("dump", {"stopCode": "0x116"})
    payload = T.verify(token)
    assert payload and payload["k"] == "dump" and payload["f"]["stopCode"] == "0x116"


def test_tampering_expiry_and_garbage_are_rejected():
    token = T.issue("dump", {"stopCode": "0x116"})
    body, sig = token.split(".")
    assert T.verify(body + "." + sig[:-2] + "AA") is None
    assert T.verify("x" + token) is None
    assert T.verify(T.issue("dump", {"a": 1}, ttl=-5)) is None
    assert T.verify("abc") is None and T.verify(None) is None and T.verify("a.b.c") is None
    assert T.verify("a" * 20000 + ".b") is None
    # 다른 비밀값으로 서명한 토큰은 통과하지 못한다.
    import os
    os.environ["ANALYSIS_TOKEN_SECRET"] = "s" * 40
    other = T.issue("dump", {"stopCode": "0x1"})
    os.environ["ANALYSIS_TOKEN_SECRET"] = "t" * 40
    assert T.verify(other) is None
    os.environ.pop("ANALYSIS_TOKEN_SECRET")


def test_facts_exclude_paths_and_personal_names():
    facts = T.facts_from_dump({"stopCode": "0x116", "faultingModule": "nvlddmkm.sys", "modules": ["C:\\Users\\hong\\a.dll"], "computerName": "HONG-PC", "stopParams": ["0x1"]})
    assert "modules" not in facts and "computerName" not in facts and facts["faultingModule"] == "nvlddmkm.sys"
    ev = T.facts_from_evtx({"totalEvents": 5, "topEvents": [{"provider": "<b>x</b>", "id": 41, "count": 2}], "computer": "HONG-PC", "wheaById": {"17": 3}})
    assert "computer" not in ev and "<" not in ev["topEvents"][0]["provider"]


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
