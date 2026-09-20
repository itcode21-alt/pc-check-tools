"""minidump_parser._extract 회귀 테스트.

minidump 라이브러리 0.0.24는 mf.exception.exception_records[0].ExceptionRecord, 모듈의
baseaddress/size/versioninfo, 열거형 ExceptionCode를 쓴다. 예전 코드는 옛 속성 이름을
가정해서 사용자 모드 덤프(게임·앱 크래시)가 전부 "파싱 실패"로 끝났고, 헤더의 시각도
NumberOfStreams(오프셋 8)를 읽고 있었다.
"""
import enum
import struct
from types import SimpleNamespace as NS

import minidump_parser as mp


class _Code(enum.Enum):
    EXCEPTION_ACCESS_VIOLATION = 0xC0000005


class _Arch(enum.Enum):
    INTEL = 0
    AMD64 = 9


def _module(name, base, size):
    return NS(name=name, baseaddress=base, size=size, versioninfo=None)


def _mf(code, info, address, modules, arch=_Arch.INTEL, enum_code=False):
    record = NS(
        ExceptionCode=_Code.EXCEPTION_ACCESS_VIOLATION if enum_code else code,
        ExceptionCode_raw=code,
        ExceptionAddress=address,
        ExceptionInformation=info,
        NumberParameters=len(info),
    )
    return NS(
        exception=NS(exception_records=[NS(ExceptionRecord=record)]),
        modules=NS(modules=modules),
        sysinfo=NS(MajorVersion=10, MinorVersion=0, BuildNumber=26200, ProcessorArchitecture=arch),
    )


def _header(ts):
    return b"MDMP" + struct.pack("<IIIII", 0xA793, 13, 32, 0, ts)


def test_application_dump_reports_exception_not_stop_code():
    mf = _mf(0xC0000005, [1, 0xFFFFFFF8], 0x190689, [_module("C:\\Game\\game.exe", 0x180000, 0x500000)], enum_code=True)
    r = mp._extract(mf, _header(1789366474))
    assert r["dumpKind"] == "application"
    assert "stopCode" not in r  # 접근 위반의 첫 인자 1(쓰기)이 STOP 0x1로 오인되면 안 된다
    assert r["exceptionCode"] == "0xc0000005" and r["exceptionName"] == "ACCESS_VIOLATION"
    assert r["faultingModule"] == "game.exe" and r["processName"] == "game.exe"
    assert "쓰기" in r["exceptionDetail"] and "0xfffffff8" in r["exceptionDetail"]
    assert r["arch"] == "x86" and r["osBuild"] == "10.0.26200"


def test_crash_time_comes_from_header_timestamp_offset_20():
    r = mp._extract(_mf(0xC0000005, [0, 0], 0x1000, []), _header(1789366474))
    assert r["crashTime"].startswith("2026-09-14")


def test_fault_address_outside_modules_is_explained():
    r = mp._extract(_mf(0xC00001A5, [], 0x5C61C1C2, [_module("a.exe", 0x400000, 0x1000)]), _header(1))
    assert "faultingModule" not in r and "faultingModuleNote" in r


def test_kernel_minidump_still_reports_stop_code():
    mods = [_module("ntoskrnl.exe", 0xFFFFF80000000000, 0x1000000), _module("nvlddmkm.sys", 0xFFFFF80100000000, 0x2000000)]
    r = mp._extract(_mf(0x80000003, [0x116, 1, 2, 3], 0xFFFFF80100000100, mods, arch=_Arch.AMD64), _header(1))
    assert r["dumpKind"] == "kernel"
    assert r["stopCode"] == "0x116" and r["faultingModule"] == "nvlddmkm.sys" and r["arch"] == "x64"


def test_module_count_is_full_even_when_list_is_truncated():
    mods = [_module(f"m{i}.dll", 0x1000 * i, 0x800) for i in range(1, 121)]
    r = mp._extract(_mf(0xC0000005, [0, 0], 0x1, mods), _header(1))
    assert r["moduleCount"] == 120 and len(r["modules"]) == 80
