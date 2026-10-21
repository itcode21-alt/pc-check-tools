# 메인 화면 "이번 달 Windows 업데이트 이슈" 자동 갱신

메인 화면(`index.html`)의 이 영역은 사람이 고치지 않아도 최신 상태가 되도록 자동으로 갱신된다.

## 동작
- `scripts/update-home-issues.py`가 Microsoft Learn 한국어 "Windows 11 25H2 알려진 문제" 표(요약, 원래 업데이트, 상태, 마지막 업데이트)를 읽는다.
- 마지막 업데이트가 가장 최근인 3건을 카드로 만들어 `index.html`의 마커 사이(`HOME_ISSUES_INTRO_*`, `HOME_ISSUES_GRID_*`)에 넣는다.
- 제목, 상태, 해결 KB, 날짜는 Microsoft 공식 한국어 문구를 그대로 쓴다. 직접 번역하거나 지어내지 않는다.
- `.github/workflows/update-home-issues.yml`이 매일 한국 시간 05:00과 10:00에 실행하고, 내용이 바뀐 경우에만 `index.html`을 커밋한다. 수동 실행은 Actions 탭의 "Run workflow".

## 수동으로 돌려 보기
```bash
python -X utf8 scripts/update-home-issues.py --dry-run   # 결과만 출력
python -X utf8 scripts/update-home-issues.py             # index.html 갱신
```

## 실패했을 때
- 페이지를 못 읽거나 표 구조가 바뀌어 항목을 하나도 못 뽑으면 `index.html`은 그대로 두고 워크플로가 **실패**로 표시된다. 기존 카드는 유지된다.
- `index.html`의 마커 주석(`HOME_ISSUES_*`)을 지우면 스크립트가 중단된다.

## 알아 둘 점
- 이 자동화는 **메인 카드만** 갱신한다. `windows-update-tracker.html`의 상세 설명과 `news.html`은 계속 사람이 보강한다. 새 문제가 카드에 보이면 트래커 페이지에도 설명을 추가해야 한다.
- 카드는 25H2 페이지를 기준으로 한다(24H2, 26H2에도 해당하는 문제가 같은 페이지에 표시된다). 다른 버전에만 해당하는 문제는 별도 페이지에 있다.
- 카드 문구는 Microsoft의 한국어 자동 번역을 포함한다. 어색한 표현이 있어도 공식 문구를 우선한다.
