# PC 윈도우 진단 미니사이트 v2

정적 HTML/CSS/JS 기반의 배포용 미니사이트입니다. 윈도우 PC 증상별 검색 유입, 진단 흐름, 애드센스 기본 페이지, 서치콘솔 제출 구조를 포함합니다.

## 포함 파일

- `index.html`
- `diagnostic.html`
- `guides.html`
- 증상별 SEO 페이지 16개
- `about.html`, `privacy.html`, `contact.html`
- `data.js`, `app.js`, `style.css`
- `sitemap.xml`, `robots.txt`, `ads.txt`

## 배포 전 교체할 값

1. 필요하면 GitHub Pages 주소를 실제 커스텀 도메인으로 변경
2. `ads.txt`의 `pub-XXXXXXXXXXXXXXXX`을 실제 애드센스 게시자 ID로 변경
3. 필요하면 문의 이메일 주소를 실제 주소로 추가

## 추천 호스팅

가장 비용 효율적인 조합은 아래입니다.

- 보유 도메인
- Cloudflare DNS
- Cloudflare Pages 무료 호스팅

정적 사이트이므로 별도 서버 비용 없이 운영할 수 있습니다.

## 운영 팁

- 메인 페이지에는 진단 도구와 대표 가이드를 함께 노출합니다.
- 각 증상 페이지에서 관련 페이지로 내부 링크를 연결합니다.
- 광고는 본문 흐름을 해치지 않는 위치에 배치합니다.
- 서치콘솔에 `sitemap.xml`을 제출합니다.

## 배포 순서

1. 압축 해제 또는 저장소 업로드
2. 실제 도메인으로 전체 치환
3. 호스팅 서비스에 연결
4. 구글 서치콘솔 등록
5. `sitemap.xml` 제출
6. `ads.txt` 확인

## 참고

이 패키지는 WordPress처럼 관리 화면을 가진 동적 사이트가 아니라, 파일 기반 정적 사이트입니다. 수정은 파일 편집 후 재배포 방식으로 진행합니다.
