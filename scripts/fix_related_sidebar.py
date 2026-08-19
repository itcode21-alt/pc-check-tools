import re, json, glob, sys

sys.stdout.reconfigure(encoding='utf-8')

with open('scripts/entries.json', encoding='utf-8') as f:
    entries = json.load(f)

by_code = {e['code']: e for e in entries}
by_code_ci = {e['code'].lower(): e for e in entries}
groups = {}
for e in entries:
    groups.setdefault(e['relatedSymptom'], []).append(e)

def is_device(e):
    return 'device-manager-code' in e['link'] or 'device-manager-codes.html' in e['link']

def label(e):
    return e['code']

def build_list(entries_list, limit):
    items = []
    for e in entries_list[:limit]:
        items.append(f'        <li><a href="{e["link"]}">{label(e)}</a></li>')
    return items

files = sorted(glob.glob('error-code-*.html'))
print(f"candidate files: {len(files)}")

DRY_RUN = '--apply' not in sys.argv

changed = 0
skipped_no_self = []
skipped_no_sidebar = []

primary_header_re = re.compile(r'<h4>(?:🔗 비슷한 오류|🔗 비슷한 장치 코드)</h4>\s*<ul>.*?</ul>', re.S)
secondary_header_re = re.compile(r'<h4>(?:⚠️ 관련 장치 코드|⚠️ 관련 블루스크린)</h4>\s*<ul>.*?</ul>', re.S)

for fp in files:
    with open(fp, encoding='utf-8') as f:
        html = f.read()

    m = re.search(r'data-error-code-page="([^"]*)"', html)
    if not m:
        skipped_no_self.append(fp)
        continue
    self_code = m.group(1)
    self_entry = by_code.get(self_code) or by_code_ci.get(self_code.lower())
    if not self_entry:
        skipped_no_self.append(fp)
        continue

    if not primary_header_re.search(html) and not secondary_header_re.search(html):
        skipped_no_sidebar.append(fp)
        continue

    group = groups.get(self_entry['relatedSymptom'], [])
    self_is_device = is_device(self_entry)

    same_type = [e for e in group if is_device(e) == self_is_device and e['code'] != self_entry['code']]
    other_type = [e for e in group if is_device(e) != self_is_device]

    primary_header_text = '🔗 비슷한 장치 코드' if self_is_device else '🔗 비슷한 오류'
    secondary_header_text = '⚠️ 관련 블루스크린' if self_is_device else '⚠️ 관련 장치 코드'

    primary_items = build_list(same_type, 5)
    secondary_items = build_list(other_type, 4)

    if primary_items:
        new_primary = f'<h4>{primary_header_text}</h4>\n      <ul>\n' + '\n'.join(primary_items) + '\n      </ul>'
        html2 = primary_header_re.sub(lambda m_: new_primary, html, count=1)
    else:
        html2 = primary_header_re.sub('', html, count=1)

    if secondary_items:
        new_secondary = f'<h4>{secondary_header_text}</h4>\n      <ul>\n' + '\n'.join(secondary_items) + '\n      </ul>'
        html3 = secondary_header_re.sub(lambda m_: new_secondary, html2, count=1)
    else:
        html3 = secondary_header_re.sub('', html2, count=1)

    if html3 != html:
        changed += 1
        if DRY_RUN and changed <= 5:
            print(f"\n=== {fp} (self={self_code}, group={self_entry['relatedSymptom']}) ===")
            print(f"  primary({primary_header_text}): {[e['code'] for e in same_type[:5]]}")
            print(f"  secondary({secondary_header_text}): {[e['code'] for e in other_type[:4]]}")
        if not DRY_RUN:
            with open(fp, 'w', encoding='utf-8') as f:
                f.write(html3)

print(f"\nwould change: {changed} files" if DRY_RUN else f"\nchanged: {changed} files")
print(f"skipped (no self match): {len(skipped_no_self)} -> {skipped_no_self}")
print(f"skipped (no sidebar block): {len(skipped_no_sidebar)} -> {skipped_no_sidebar}")
