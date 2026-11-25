"""업로드된 .dmp / .evtx 파일을 분석기에 넘기기 전에 거르는 검사와 표준 오류 응답.

파일은 메모리에서만 읽으므로 서버에는 Windows 폴더 권한 문제가 생기지 않는다. 그 오류는 브라우저가 파일을
읽는 순간(업로드 전)에 나므로 화면 쪽에서 막고, 서버는 읽은 내용이 비었거나 중간에 끊겼는지를 코드로 구분한다.
파일명은 저장·경로에 쓰지 않는다(확장자만 검사).
"""
from fastapi.responses import JSONResponse

EMPTY_MESSAGE = "빈 파일이거나 Windows 폴더 권한 때문에 파일을 읽지 못했습니다. 파일을 바탕화면에 복사한 뒤 다시 업로드해 주세요."
TRUNCATED_MESSAGE = "파일이 중간에 끊겼거나 너무 작아 분석할 수 없습니다. 파일을 다시 복사해 업로드해 주세요."
INCOMPLETE_MESSAGE = "업로드가 중간에 끊겨 분석하지 않았습니다. 네트워크 상태를 확인하고 다시 업로드해 주세요."

MIN_DUMP_BYTES = 256
MIN_EVTX_BYTES = 4096


class UploadError(Exception):
    def __init__(self, code: str, message: str, status: int = 422):
        super().__init__(code)
        self.code = code
        self.message = message
        self.status = status


def error_response(code: str, message: str, status: int, **extra) -> JSONResponse:
    # 기존 화면이 읽는 detail(문자열)과 새 오류 객체를 함께 내려보낸다. 파일 내용이나 파일명은 담지 않는다.
    body = {"ok": False, "error": {"code": code, "message": message}, "detail": message}
    body.update(extra)
    return JSONResponse(body, status_code=status)


def check_extension(filename, ext: str) -> None:
    if not (filename or "").lower().endswith(ext):
        raise UploadError("UNSUPPORTED_EXTENSION", f"확장자가 {ext}인 파일만 지원합니다.", 400)


def check_content(data: bytes, kind: str) -> None:
    """kind는 'dump' 또는 'evtx'. 비어 있거나 너무 작으면 UploadError."""
    if len(data) == 0:
        raise UploadError("DUMP_EMPTY" if kind == "dump" else "EVTX_EMPTY", EMPTY_MESSAGE, 422)
    minimum = MIN_DUMP_BYTES if kind == "dump" else MIN_EVTX_BYTES
    if len(data) < minimum:
        raise UploadError("DUMP_TRUNCATED" if kind == "dump" else "EVTX_TRUNCATED", TRUNCATED_MESSAGE, 422)


async def read_upload(upload, limit: int) -> bytes:
    """업로드 본문을 limit+1바이트까지 읽는다. 끊김·읽기 실패는 UPLOAD_INCOMPLETE로 통일한다."""
    try:
        return await upload.read(limit + 1)
    except PermissionError as exc:
        raise UploadError("DUMP_PERMISSION_DENIED", EMPTY_MESSAGE, 422) from exc
    except (OSError, RuntimeError, ValueError) as exc:
        raise UploadError("UPLOAD_INCOMPLETE", INCOMPLETE_MESSAGE, 400) from exc
