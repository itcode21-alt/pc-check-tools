"""upload_guard 회귀 테스트: 0바이트·너무 작은 파일·확장자·읽기 실패/끊김이 분석기 전에 걸러지는지 확인한다."""
import asyncio

import upload_guard as G


def _raises(code, fn, *args):
    try:
        fn(*args)
    except G.UploadError as exc:
        assert exc.code == code, (exc.code, code)
        return exc
    raise AssertionError(f"{code} 가 발생해야 한다")


class _Upload:
    def __init__(self, data=b"", error=None):
        self.data, self.error = data, error

    async def read(self, size):
        if self.error:
            raise self.error
        return self.data[:size]


def test_empty_and_tiny_files_are_blocked():
    exc = _raises("DUMP_EMPTY", G.check_content, b"", "dump")
    assert "Windows 폴더 권한" in exc.message and exc.status == 422
    _raises("EVTX_EMPTY", G.check_content, b"", "evtx")
    _raises("DUMP_TRUNCATED", G.check_content, b"MDMP" + b"\0" * 10, "dump")
    _raises("EVTX_TRUNCATED", G.check_content, b"ElfFile\0" + b"\0" * 100, "evtx")
    G.check_content(b"MDMP" + b"\0" * 400, "dump")


def test_extension_check_ignores_case_and_rejects_others():
    G.check_extension("A.DMP", ".dmp")
    _raises("UNSUPPORTED_EXTENSION", G.check_extension, "a.exe", ".dmp")
    _raises("UNSUPPORTED_EXTENSION", G.check_extension, "", ".dmp")
    _raises("UNSUPPORTED_EXTENSION", G.check_extension, "../../etc/passwd", ".dmp")


def test_read_errors_become_standard_codes():
    for error, code in ((PermissionError("denied"), "DUMP_PERMISSION_DENIED"), (OSError("io"), "UPLOAD_INCOMPLETE"), (RuntimeError("disconnect"), "UPLOAD_INCOMPLETE")):
        try:
            asyncio.run(G.read_upload(_Upload(error=error), 100))
        except G.UploadError as exc:
            assert exc.code == code
        else:
            raise AssertionError(code)
    assert asyncio.run(G.read_upload(_Upload(b"abc"), 100)) == b"abc"


def test_error_response_has_code_and_legacy_detail_without_file_data():
    resp = G.error_response("DUMP_EMPTY", G.EMPTY_MESSAGE, 422)
    body = resp.body.decode("utf-8")
    assert resp.status_code == 422 and '"code":"DUMP_EMPTY"' in body.replace(" ", "") and '"detail"' in body


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
