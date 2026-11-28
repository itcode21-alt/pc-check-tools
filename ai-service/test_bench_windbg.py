"""bench_windbg 비교 로직 회귀 테스트(합성 입력만 사용, cdb·덤프 불필요)."""
import bench_windbg as B

WIN = """
BUGCHECK_CODE:  133
BUGCHECK_P1: 1
BUGCHECK_P2: 1e00
BUGCHECK_P3: fffff80389dc43c8
BUGCHECK_P4: 0
PROCESS_NAME:  System
SYMBOL_NAME:  nvlddmkm+e34e3
IMAGE_NAME:  nvlddmkm.sys
FAILURE_BUCKET_ID:  0x133_ISR_nvlddmkm!unknown_function
"""


def ours(**kw):
    base = {"stopCode": 0x133, "params": [1, 0x1E00, 0xFFFFF80389DC43C8, 0], "process": "System", "module": "nvlddmkm.sys",
            "symbol": None, "bucket": "0x133_ISR_nvlddmkm!unknown_function"}
    base.update(kw)
    return base


def test_parse_windbg_reads_the_fields():
    w = B.parse_windbg(WIN)
    assert w["stopCode"] == 0x133 and w["params"] == [1, 0x1E00, 0xFFFFF80389DC43C8, 0]
    assert w["process"] == "System" and w["image"] == "nvlddmkm.sys" and w["bucket"].startswith("0x133_ISR")


def test_symbol_split_handles_module_only_and_function_forms():
    assert B.split_symbol("nt!MiMakePageAvoidRead+b6") == ("nt", "MiMakePageAvoidRead")
    assert B.split_symbol("nvlddmkm+e34e3") == ("nvlddmkm", None)
    assert B.split_symbol("nt!ST_STORE<SM_TRAITS>::StDmPageError+135") == ("nt", "ST_STORE<SM_TRAITS>::StDmPageError")
    assert B.split_symbol(None) is None


def test_all_fields_match_for_the_verified_0x133_case():
    c = B.compare(ours(), B.parse_windbg(WIN))
    assert c == {"stopCode": "일치", "params": "일치", "process": "일치", "module": "일치", "symbol": "일치", "bucket": "일치"}


def test_missing_wrong_and_unavailable_are_told_apart():
    w = B.parse_windbg(WIN)
    assert B.compare(ours(bucket=None), w)["bucket"] == "미생성"
    assert B.compare(ours(bucket="0x133_DPC_x!y"), w)["bucket"] == "불일치"
    assert B.compare(ours(), B.parse_windbg("BUGCHECK_CODE: 133"))["bucket"] == "비교불가"


def test_truncated_process_name_counts_as_match_but_other_names_do_not():
    w = B.parse_windbg(WIN.replace("PROCESS_NAME:  System", "PROCESS_NAME:  FSD-Win64-Shipping.exe"))
    assert B.compare(ours(process="FSD-Win64-Ship"), w)["process"] == "일치"
    assert B.compare(ours(process="cpuz.exe"), w)["process"] == "불일치"


def test_no_blame_matches_when_windbg_points_to_kernel_or_cpu():
    kernel = B.parse_windbg(WIN.replace("nvlddmkm.sys", "ntkrnlmp.exe"))
    assert B.compare(ours(module=None), kernel)["module"] == "일치"
    cpu = B.parse_windbg(WIN.replace("nvlddmkm.sys", "AuthenticAMD.sys"))
    assert B.compare(ours(module=None), cpu)["module"] == "일치"
    assert B.compare(ours(module="mfesec.sys"), cpu)["module"] == "불일치"


def test_summary_rates_separate_missing_from_wrong():
    w = B.parse_windbg(WIN)
    rows = [{"cmp": B.compare(ours(), w)}, {"cmp": B.compare(ours(bucket=None), w)}, {"cmp": B.compare(ours(bucket="x"), w)}]
    s = B.summarize(rows)["bucket"]
    assert (s["일치"], s["미생성"], s["불일치"]) == (1, 1, 1)
    assert abs(s["일치율"] - 1 / 3) < 1e-9 and abs(s["정밀도"] - 0.5) < 1e-9


def test_microsoft_system_driver_blame_is_listed_as_intentional_not_missing():
    afd = B.parse_windbg(WIN.replace("nvlddmkm.sys", "afd.sys"))
    assert B.compare(ours(module=None), afd)["module"] == "의도"
    third = B.parse_windbg(WIN.replace("nvlddmkm.sys", "mfesec.sys"))
    assert B.compare(ours(module=None), third)["module"] == "미생성"   # 외부 드라이버를 놓친 것은 진짜 미생성
    rows = [{"cmp": B.compare(ours(module=None), afd)}]
    s = B.summarize(rows)["module"]
    assert s["의도"] == 1 and s["일치율"] is None
