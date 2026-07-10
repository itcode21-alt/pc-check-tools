# AdSense 신청 전 계정 연결 항목

사이트 콘텐츠와 공개 정책 페이지에는 적용하지 않는 운영용 메모입니다.

## 실제 계정 값이 있어야 완료할 수 있는 항목

1. AdSense에서 사이트를 추가한 뒤 발급된 `ca-pub-숫자16자리` 검토 코드를 모든 페이지의 `<head>`에 추가합니다.
2. 실제 게시자 ID에서 `ca-`를 제외한 `pub-숫자16자리`를 사용해 도메인 루트의 `ads.txt`를 아래 형식으로 설정합니다.

```text
google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0
```

3. EEA, 영국, 스위스 방문자에게 광고를 제공할 경우 AdSense의 `개인정보 보호 및 메시지`에서 Google CMP를 설정하고 TCF 2.3 메시지를 게시합니다.

## 현재 GitHub Pages 주소에서 주의할 점

- 공개 사이트는 `https://itsvc.co.kr/` 경로에 있습니다.
- 프로젝트의 `ads.txt`는 `/pc-check-tools/ads.txt`에서 열리지만, 도메인 루트 `/ads.txt`는 현재 404입니다.
- 실제 신청에는 소유한 사용자 지정 도메인을 GitHub Pages에 연결하고 그 도메인 루트에서 `ads.txt`가 HTTP 200으로 열리게 하는 구성이 가장 명확합니다.
- 사용자 지정 도메인을 연결하면 `data.js`, canonical URL, sitemap, robots.txt의 기준 주소도 해당 도메인으로 일괄 변경해야 합니다.

가짜 게시자 ID나 다른 계정의 ID는 사용하지 않습니다.
