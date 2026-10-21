"""생성기를 돌린 뒤 작업 폴더가 git HEAD 와 얼마나 달라졌는지 마크다운으로 요약한다.

.github/workflows/measure-regeneration.yml 이 사용한다. 파일을 고치거나 커밋하지 않고 읽기만 한다.
목적: "생성기를 다시 돌리면 현재 페이지가 얼마나 달라지는가"를 숫자로 보는 것(docs/DATA_SOURCE_DESIGN.md 의 후보 B).

사용법 (사이트 루트에서, 생성기를 돌린 뒤):
  python -X utf8 scripts/summarize-regeneration-diff.py            # 마크다운을 표준출력으로
  python -X utf8 scripts/summarize-regeneration-diff.py --top 30   # 변화가 큰 파일 30개까지 표시
"""
import argparse
import re
import subprocess
import sys

CAPTURE_MARK = "guide-image-link"


def git(*args):
    return subprocess.run(["git", *args], capture_output=True, text=True, encoding="utf-8", errors="replace").stdout


def category(name):
    if re.fullmatch(r"error-code-.*\.html", name):
        return "오류 코드 페이지"
    if re.fullmatch(r"event-.*\.html", name):
        return "이벤트 페이지"
    if re.fullmatch(r"game-.*\.html", name):
        return "게임 페이지"
    if name.endswith(".html"):
        return "증상·가이드 등 기타 HTML"
    if name.endswith((".js", ".json", ".xml")):
        return "데이터·색인 파일"
    return "기타"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--top", type=int, default=20)
    ap.add_argument(
        "--paths",
        nargs="*",
        default=["*.html", "*.js", "*.json", "*.xml"],
        help="비교할 경로 패턴(기본: 생성기가 만드는 HTML·데이터·색인). scripts/, docs/ 같은 도구·문서는 제외한다",
    )
    args = ap.parse_args()
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")

    numstat = git("diff", "--numstat", "HEAD", "--", *args.paths)
    rows = []
    for line in numstat.splitlines():
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        add, dele, name = parts
        if add == "-" or dele == "-":  # 바이너리
            continue
        rows.append((name, int(add), int(dele)))

    untracked = [n for n in git("ls-files", "--others", "--exclude-standard", "--", *args.paths).splitlines() if n]

    out = []
    out.append("# 생성기 재실행 측정 결과\n")
    out.append("작업 폴더를 커밋하지 않고 `git diff HEAD`만 읽은 결과다. 이 결과로 저장소가 바뀌지 않는다.\n")

    if not rows and not untracked:
        out.append("**변경 없음.** 생성기를 다시 돌려도 어떤 파일도 달라지지 않는다.")
        print("\n".join(out))
        return

    total_add = sum(r[1] for r in rows)
    total_del = sum(r[2] for r in rows)
    out.append(f"- 달라지는 추적 파일: **{len(rows)}개** (추가 {total_add}줄, 삭제 {total_del}줄)")
    out.append(f"- 새로 생기는 파일: **{len(untracked)}개**" + (f" — {', '.join(untracked[:5])}" if untracked else ""))

    by_cat = {}
    for name, a, d in rows:
        c = by_cat.setdefault(category(name), [0, 0, 0])
        c[0] += 1
        c[1] += a
        c[2] += d
    out.append("\n## 종류별\n")
    out.append("| 종류 | 달라지는 파일 | 추가 줄 | 삭제 줄 |")
    out.append("|---|---|---|---|")
    for cat, (n, a, d) in sorted(by_cat.items(), key=lambda kv: -kv[1][0]):
        out.append(f"| {cat} | {n} | {a} | {d} |")

    # 캡처(guide-image-link)를 잃는 페이지: HEAD 에는 있고 작업 폴더에는 없는 경우
    lost = []
    for name, _, _ in rows:
        if not name.endswith(".html"):
            continue
        head = git("show", f"HEAD:{name}")
        try:
            with open(name, encoding="utf-8") as fh:
                now = fh.read()
        except OSError:
            continue
        before, after = head.count(CAPTURE_MARK), now.count(CAPTURE_MARK)
        if after < before:
            lost.append((name, before, after))
    out.append("\n## 캡처를 잃는 페이지\n")
    if lost:
        out.append(f"**{len(lost)}개 페이지**가 지금 가진 캡처(`{CAPTURE_MARK}`)를 잃는다. 생성기를 그대로 돌리면 사라지는 수작업이다.\n")
        out.append("| 페이지 | 지금 | 다시 생성 후 |")
        out.append("|---|---|---|")
        for name, b, a in lost[:50]:
            out.append(f"| {name} | {b} | {a} |")
    else:
        out.append("없음.")

    # 변화량이 적은 파일 vs 큰 파일의 분포(수작업 구간이 클수록 변화가 커진다)
    changed = sorted((a + d for _, a, d in rows))
    if changed:
        def pct(p):
            return changed[min(len(changed) - 1, int(len(changed) * p))]
        out.append("\n## 파일별 변화량(추가+삭제 줄)의 분포\n")
        out.append(f"- 최소 {changed[0]}, 중앙값 {pct(0.5)}, 90% 지점 {pct(0.9)}, 최대 {changed[-1]}")

    out.append(f"\n## 변화가 큰 파일 상위 {args.top}\n")
    out.append("| 파일 | 추가 | 삭제 |")
    out.append("|---|---|---|")
    for name, a, d in sorted(rows, key=lambda r: -(r[1] + r[2]))[: args.top]:
        out.append(f"| {name} | {a} | {d} |")

    print("\n".join(out))


if __name__ == "__main__":
    main()
