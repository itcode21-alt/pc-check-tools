# ITSVC 진단 자료 수집기

Windows 10/11에서 최근 7일간의 이벤트 뷰어 기록과 블루스크린 관련 파일을 원하는 폴더에 저장하는 로컬 도구입니다.

## 수집 항목

- `event-logs/System.evtx`
- `event-logs/Application.evtx`
- `event-logs/Setup.evtx`
- `event-summary.csv`: 시간, 로그 이름, 원본, 이벤트 ID, 수준, 메시지 요약
- `minidumps/Minidump`: 최근 7일간의 `C:\Windows\Minidump\*.dmp`
- `minidumps/LiveKernelReports`: 최근 7일간의 `.dmp`, `.wer`, `.xml`
- `collection-report.txt`: 수집 기준과 결과, 개인정보 주의사항

## 사용 방법

1. `Run-ITSVC-Log-Collector.cmd`를 실행합니다.
2. 진단 자료를 저장할 폴더를 선택합니다.
3. 생성된 `itsvc-diagnostic-날짜-시간` 폴더를 확인합니다.
4. 사이트 분석기에는 필요한 파일만 선택해 올립니다.

관리자 권한이 없는 경우 일부 이벤트 로그나 덤프가 복사되지 않을 수 있습니다. 이때는 파일을 우클릭한 뒤 **관리자 권한으로 실행**해 보세요.

## 개인정보 안내

이벤트 로그와 미니덤프에는 Windows 사용자 이름, 컴퓨터 이름, 프로그램 경로, 문서 경로가 포함될 수 있습니다. 공유하기 전에 `event-summary.csv`와 덤프 파일의 포함 정보를 확인하세요. 이 도구는 수집한 파일을 자동으로 인터넷에 전송하지 않습니다.

## EXE 패키징

현재 저장소에는 검토와 수정이 쉬운 PowerShell 원본과 CMD 실행기가 포함되어 있습니다. Windows에서 테스트가 끝난 뒤 PS2EXE 또는 Inno Setup으로 설치형 EXE를 만들 수 있습니다. EXE로 포장하더라도 실제 수집 항목과 개인정보 안내는 동일하게 유지해야 합니다.
