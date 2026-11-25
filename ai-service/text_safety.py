"""외부 입력(로그에서 뽑은 문자열, 접수 폼 값)을 무해화하는 공통 함수."""
import re

_ANSI = re.compile(r"\x1b\[[0-9;?]*[ -/]*[@-~]|\x1b[@-_]")
_CONTROL = re.compile(r"[\x00-\x08\x0b-\x1f\x7f-\x9f​-‏‪-‮⁦-⁩]")
_TAGS = re.compile(r"<[^>]*>?")


def clean(value, max_len=200):
    """제어문자·ANSI escape·HTML 태그를 제거하고 공백을 정리해 max_len으로 자른다."""
    if value is None:
        return ""
    text = str(value)
    text = _ANSI.sub(" ", text)
    text = _CONTROL.sub(" ", text)
    text = _TAGS.sub(" ", text)
    text = text.replace("<", " ").replace(">", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len]


def clean_multiline(value, max_len=4000):
    """줄바꿈은 유지하고 나머지는 clean과 같은 방식으로 정리한다."""
    if value is None:
        return ""
    lines = [clean(line, 400) for line in str(value).splitlines()]
    return "\n".join(line for line in lines if line)[:max_len]
