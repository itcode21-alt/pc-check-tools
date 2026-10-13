"""캡처 이미지를 assets/ 에 jpg + webp 로 저장하고 페이지에 붙일 <img> 코드를 출력한다.

사용법 (사이트 루트에서):
  python -I scripts/import-capture.py NAME --clipboard --alt "화면 설명"
  python -I scripts/import-capture.py NAME --file C:\\경로\\capture.png --alt "화면 설명"
  python -I scripts/import-capture.py --watch          # 클립보드에 새 캡처가 올 때마다 이름을 물어 저장

Win+Shift+S 로 영역을 캡처하면 클립보드에 이미지가 올라간다.
NAME 은 확장자 없는 파일명 (예: cmd-sfc-scannow-result).
"""
import argparse
import hashlib
import sys
import time
from pathlib import Path

from PIL import Image, ImageGrab

sys.stdout.reconfigure(encoding="utf-8")
ASSETS = Path(__file__).resolve().parent.parent / "assets"
MAX_WIDTH = 1000


def grab_clipboard():
    img = ImageGrab.grabclipboard()
    if isinstance(img, list):  # 파일 복사 상태
        img = Image.open(img[0]) if img else None
    return img if isinstance(img, Image.Image) else None


def save(img, name, alt, max_width):
    if not name.replace("-", "").replace("_", "").isalnum() or name != name.lower():
        sys.exit(f"NAME 은 소문자·숫자·하이픈만 사용: {name}")
    img = img.convert("RGB")
    if img.width > max_width:
        img = img.resize((max_width, round(img.height * max_width / img.width)), Image.LANCZOS)
    jpg, webp = ASSETS / f"{name}.jpg", ASSETS / f"{name}.webp"
    if jpg.exists() or webp.exists():
        sys.exit(f"이미 존재함(덮어쓰지 않음): {name}")
    img.save(jpg, "JPEG", quality=88, optimize=True)
    img.save(webp, "WEBP", quality=82, method=6)
    w, h = img.size
    print(f"저장: {jpg.name} / {webp.name}  ({w}x{h}, {jpg.stat().st_size // 1024}KB / {webp.stat().st_size // 1024}KB)")
    print("\n붙일 코드:")
    print(
        f'<a href="assets/{name}.jpg" target="_blank" rel="noopener" class="guide-image-link">'
        f'<img src="assets/{name}.webp" alt="{alt or "(alt 설명 필요)"}" loading="lazy" '
        f'width="{w}" height="{h}" class="guide-image"></a>'
    )


def watch(max_width):
    print("감시 시작: Win+Shift+S 로 캡처하면 이름을 묻습니다. 종료는 Ctrl+C.")
    last = None
    while True:
        img = grab_clipboard()
        if img is not None:
            digest = hashlib.md5(img.tobytes()).hexdigest()
            if digest != last:
                last = digest
                print(f"\n새 캡처 감지 ({img.width}x{img.height})")
                name = input("파일명(건너뛰려면 Enter): ").strip()
                if name:
                    alt = input("alt 설명: ").strip()
                    save(img, name, alt, max_width)
        time.sleep(1)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("name", nargs="?")
    p.add_argument("--clipboard", action="store_true")
    p.add_argument("--file")
    p.add_argument("--alt", default="")
    p.add_argument("--watch", action="store_true")
    p.add_argument("--max-width", type=int, default=MAX_WIDTH)
    a = p.parse_args()
    if a.watch:
        return watch(a.max_width)
    if not a.name or not (a.clipboard or a.file):
        p.error("NAME 과 --clipboard 또는 --file 이 필요합니다")
    img = grab_clipboard() if a.clipboard else Image.open(a.file)
    if img is None:
        sys.exit("클립보드에 이미지가 없습니다. Win+Shift+S 로 먼저 캡처하세요.")
    save(img, a.name, a.alt, a.max_width)


if __name__ == "__main__":
    main()
