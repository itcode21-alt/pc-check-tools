#!/usr/bin/env python3
"""A/S 센터 데이터(data/as-centers.json)를 검증하고, 이 데이터를 쓰는 페이지를 갱신한다.

단일 원본: data/as-centers.json
  - centers[] : A/S 센터(연락처·운영시간·방문/택배 주소·접수 방법·출처·확인일·상태)
  - brands[]  : 브랜드(국내 유통사, 시리얼 위치, 정품 조회 링크, 접수 센터 id 목록)

이 스크립트가 하는 일
  1. 데이터 검증(필수 항목, 상태값, 링크 형식, 센터 id 참조, 확인일, 전화번호 형식). 오류가 있으면 종료 코드 1.
  2. parts-support.html 의 '브랜드별 국내 접수 경로'와 '센터 연락처 요약'을 데이터에서 다시 생성
     (<!-- AS-ROUTES:START/END -->, <!-- AS-CENTERS:START/END --> 사이).
  3. as-center-finder.html 이 읽는 데이터 파일의 캐시 버전(내용 해시)을 갱신.
여러 번 실행해도 결과가 같다. 파일의 줄바꿈(CRLF/LF)은 보존한다.

사용: python3 scripts/build-as-centers.py          (검증 + 페이지 갱신)
      python3 scripts/build-as-centers.py --check  (검증만, 파일은 바꾸지 않음 — CI용)
"""
import datetime
import hashlib
import html
import json
import re
import sys
from pathlib import Path

try:
    sys.stdout.reconfigure(encoding="utf-8")  # Windows 콘솔(cp949)에서 한글·특수문자 출력 오류 방지
except Exception:
    pass
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "as-centers.json"
PARTS = ROOT / "parts-support.html"
FINDER = ROOT / "as-center-finder.html"
STATUS = {"ok": "확인됨", "chk": "접수 전 재확인"}
STALE_DAYS = 180
TEL_RE = re.compile(r"\d{2,4}-\d{3,4}(-\d{4})?")


def esc(s):
    return html.escape(s, quote=False)


def read(p):
    raw = p.read_bytes().decode("utf-8")
    return raw.replace("\r\n", "\n"), ("\r\n" if "\r\n" in raw else "\n")


def write(p, t, e):
    p.write_bytes(t.replace("\n", e).encode("utf-8"))


def validate(doc):
    errors, warnings = [], []
    today = datetime.date.today()
    cids = set()
    for c in doc["centers"]:
        cid = c.get("id", "?")
        if cid in cids:
            errors.append(f"센터 id 중복: {cid}")
        cids.add(cid)
        for k in ("name", "status", "brands", "tel", "hours", "visit", "parcel", "notes", "links", "source", "checked"):
            if k not in c:
                errors.append(f"센터 {cid}: '{k}' 항목이 없습니다")
        if c.get("status") not in STATUS:
            errors.append(f"센터 {cid}: status는 ok/chk 중 하나여야 합니다")
        if c.get("status") == "ok":
            if not c.get("source"):
                errors.append(f"센터 {cid}: '확인됨'인데 출처(source)가 없습니다")
            if not (c.get("tel") or c.get("parcel") or c.get("visit")):
                errors.append(f"센터 {cid}: '확인됨'인데 연락처·주소가 모두 비어 있습니다")
        for l in c.get("links", []):
            if not str(l.get("url", "")).startswith("https://") and not str(l.get("url", "")).startswith("http://"):
                errors.append(f"센터 {cid}: 링크 형식 오류 {l}")
        for t in c.get("tel", []):
            if not TEL_RE.search(t):
                warnings.append(f"센터 {cid}: 전화번호 형식을 확인하세요 → {t}")
        try:
            d = datetime.date.fromisoformat(c.get("checked", ""))
            if (today - d).days > STALE_DAYS:
                warnings.append(f"센터 {cid}: 확인일이 {(today - d).days}일 지났습니다({d}) — 다시 확인하세요")
        except ValueError:
            errors.append(f"센터 {cid}: 확인일 형식 오류 {c.get('checked')!r}")
    bids = set()
    for b in doc["brands"]:
        bid = b.get("id", "?")
        if bid in bids:
            errors.append(f"브랜드 id 중복: {bid}")
        bids.add(bid)
        for k in ("name", "who", "centers", "lookup", "where", "how", "categories"):
            if k not in b:
                errors.append(f"브랜드 {bid}: '{k}' 항목이 없습니다")
        for cat in b.get("categories", []):
            if cat not in doc.get("categories", []):
                errors.append(f"브랜드 {bid}: 정의되지 않은 카테고리 '{cat}'")
        if b.get("status") not in (None, "ok", "chk"):
            errors.append(f"브랜드 {bid}: status는 ok/chk 중 하나여야 합니다")
        for cid in b.get("centers", []):
            if cid not in cids:
                errors.append(f"브랜드 {bid}: 존재하지 않는 센터 id '{cid}'")
        if not b.get("centers") and b.get("status") not in STATUS:
            errors.append(f"브랜드 {bid}: 센터가 없으면 status(ok/chk)를 직접 지정해야 합니다")
        for l in b.get("lookup", []):
            if not str(l.get("url", "")).startswith("http"):
                errors.append(f"브랜드 {bid}: 조회 링크 형식 오류 {l}")
    used = {cid for b in doc["brands"] for cid in b.get("centers", [])}
    for cid in cids - used:
        warnings.append(f"센터 {cid}: 어떤 브랜드에서도 참조하지 않습니다")
    return errors, warnings


def brand_status(doc, b):
    if b.get("status") in STATUS:
        return b["status"]
    if b.get("centers"):
        cs = {c["id"]: c for c in doc["centers"]}
        return "ok" if all(cs[i]["status"] == "ok" for i in b["centers"]) else "chk"
    return b["status"]


def a(url, text):
    return f'<a href="{html.escape(url)}" target="_blank" rel="noopener noreferrer">{esc(text)}</a>'


def route_li(doc, cs, b):
    st = brand_status(doc, b)
    links, seen = [], set()
    for l in b["lookup"]:
        if l["url"] not in seen:
            seen.add(l["url"]); links.append(a(l["url"], l["label"]))
    for cid in b["centers"]:
        first = (cs[cid]["links"] or [None])[0]
        if first and first["url"] not in seen:
            seen.add(first["url"]); links.append(a(first["url"], first["label"]))
    srcs = []
    for cid in b["centers"]:
        if cs[cid]["source"] not in srcs:
            srcs.append(cs[cid]["source"])
    meta = ("출처: " + " · ".join(srcs) + " · ") if srcs else ""
    meta += f"확인일 {doc['updated']}"
    more = f' <a href="as-center-finder.html#{html.escape(b["id"])}">센터 연락처·주소 보기</a>' if b["centers"] else ""
    cats = " · ".join(b["categories"])
    return (
        f'        <li><b class="brand">{esc(b["name"])}<span class="badge {st}">{STATUS[st]}</span></b>'
        f'<span class="who">{esc(cats)} · 국내 유통사: {esc(b["who"])}</span>{esc(b["how"])}{more}'
        f'<span class="links">{" · ".join(links)}</span><span class="meta">{esc(meta)}</span></li>'
    )


def routes_html(doc):
    cs = {c["id"]: c for c in doc["centers"]}
    out = []
    for cat in doc["categories"]:
        group = [b for b in doc["brands"] if b["categories"][0] == cat]
        if not group:
            continue
        out.append(f'        <li class="ps-group"><h4>{esc(cat)}</h4></li>')
        out.extend(route_li(doc, cs, b) for b in group)
    return "\n".join(out)


def centers_html(doc):
    out = []
    for c in doc["centers"]:
        parts = []
        if c["tel"]:
            parts.append("전화 " + " / ".join(c["tel"]))
        if c["hours"]:
            parts.append("운영시간 " + c["hours"])
        parts.append("택배 주소 " + c["parcel"] if c["parcel"] else "택배 주소는 공식 안내에 없음")
        if c["visit"] and c["visit"] != c["parcel"]:
            parts.append("방문 주소 " + c["visit"])
        out.append(
            f'        <li><b>{esc(c["name"])}<span class="badge {c["status"]}">{STATUS[c["status"]]}</span></b>'
            f'{esc(" · ".join(parts))} <a href="as-center-finder.html#center-{html.escape(c["id"])}">상세·지도·복사</a></li>'
        )
    return "\n".join(out)


def replace_between(text, name, body):
    start, end = f"<!-- {name}:START -->", f"<!-- {name}:END -->"
    i, j = text.index(start) + len(start), text.index(end)
    return text[:i] + "\n" + body + "\n        " + text[j:]


def main():
    check_only = "--check" in sys.argv
    doc = json.loads(DATA.read_text(encoding="utf-8"))
    errors, warnings = validate(doc)
    for w in warnings:
        print("경고:", w)
    for er in errors:
        print("오류:", er)
    if errors:
        print(f"검증 실패 — 오류 {len(errors)}건")
        sys.exit(1)
    print(f"검증 통과 — 센터 {len(doc['centers'])}곳, 브랜드 {len(doc['brands'])}종, 경고 {len(warnings)}건")
    if check_only:
        return

    # parts-support.html
    t, e = read(PARTS)
    new = replace_between(t, "AS-ROUTES", routes_html(doc))
    new = replace_between(new, "AS-CENTERS", centers_html(doc))
    if new != t:
        write(PARTS, new, e)
        print("parts-support.html 갱신")

    # as-center-finder.html: 데이터 파일 캐시 버전 = 내용 해시
    # 줄바꿈(CRLF/LF) 차이로 해시가 달라지지 않도록 LF로 정규화해서 계산한다(Windows 작업 폴더와 CI가 같은 값을 얻도록).
    digest = hashlib.sha1(DATA.read_bytes().replace(b"\r\n", b"\n")).hexdigest()[:10]
    t, e = read(FINDER)
    new = re.sub(r'(data/as-centers\.json\?v=)[A-Za-z0-9-]*', rf"\g<1>{digest}", t)
    if new != t:
        write(FINDER, new, e)
        print("as-center-finder.html 데이터 버전 →", digest)


if __name__ == "__main__":
    main()
