import re, json, sys, io

sys.stdout.reconfigure(encoding='utf-8')

with open('data.js', encoding='utf-8') as f:
    text = f.read()

start = text.index('errorCodes: [') + len('errorCodes: [')
# find matching end: the array closes with "\n  ],\n  symptoms:"
end = text.index('\n  ],\n  symptoms:')
body = text[start:end]

# split into records on the top-level "    {" boundaries
records_raw = re.split(r'\n    \{\n', body)
entries = []
for rec in records_raw:
    m_code = re.search(r'code:\s*"([^"]*)"', rec)
    if not m_code:
        continue
    m_title = re.search(r'title:\s*"([^"]*)"', rec)
    m_link = re.search(r'link:\s*"([^"]*)"', rec)
    m_rel = re.search(r'relatedSymptom:\s*"([^"]*)"', rec)
    entries.append({
        'code': m_code.group(1),
        'title': m_title.group(1) if m_title else '',
        'link': m_link.group(1) if m_link else '',
        'relatedSymptom': m_rel.group(1) if m_rel else '',
    })

print(f"total entries: {len(entries)}")
no_rel = [e for e in entries if not e['relatedSymptom']]
print(f"entries missing relatedSymptom: {len(no_rel)}")
for e in no_rel[:20]:
    print("  MISSING:", e['code'], e['link'])

is_device = lambda e: 'device-manager-code' in e['link'] or 'device-manager-codes.html' in e['link']

groups = {}
for e in entries:
    groups.setdefault(e['relatedSymptom'], []).append(e)

print()
for k in sorted(groups, key=lambda k: -len(groups[k])):
    devs = sum(1 for e in groups[k] if is_device(e))
    print(f"{k or '(none)'}: total={len(groups[k])} device={devs} nondevice={len(groups[k])-devs}")

with open('scripts/entries.json', 'w', encoding='utf-8') as f:
    json.dump(entries, f, ensure_ascii=False, indent=1)
