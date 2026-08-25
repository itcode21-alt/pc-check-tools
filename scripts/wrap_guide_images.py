import re, glob, sys

sys.stdout.reconfigure(encoding='utf-8')

IMG_RE = re.compile(r'<img\s+([^>]*?class="guide-image"[^>]*?)>')
SRC_RE = re.compile(r'src="([^"]+)"')

changed = 0
already_wrapped = 0
for fp in glob.glob('*.html'):
    with open(fp, encoding='utf-8') as f:
        html = f.read()

    def repl(m):
        global already_wrapped
        attrs = m.group(1)
        full = m.group(0)
        src_m = SRC_RE.search(attrs)
        if not src_m:
            return full
        src = src_m.group(1)
        return f'<a href="{src}" target="_blank" rel="noopener" class="guide-image-link">{full}</a>'

    # skip if already wrapped (idempotency check)
    if 'guide-image-link' in html:
        already_wrapped += 1
        continue

    new_html = IMG_RE.sub(repl, html)
    if new_html != html:
        changed += 1
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(new_html)

print(f"changed: {changed} files, already wrapped (skipped): {already_wrapped}")
