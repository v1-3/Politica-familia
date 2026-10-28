"""Add Jucimar and Lucca to the embedded data (everything that needs only their 12 scores).

Catalog matches (per-person scores, group rankings, books) need the pinned 12axes
catalog files, which are fetched by extend-family-catalog.py and were not available
when these two people were added. Their groups therefore carry exact medians and
catalog context but `matches: null`; the page offers the match and book sections
only for people with catalog data.
"""
from pathlib import Path
from statistics import median, mean
import json

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'evidence/html-embedded-data.json'
KEYS = ['est', 'rep', 'pod', 'imi', 'dip', 'int', 'eco', 'con', 'com', 'rel', 'mor', 'tec']
NEW = [
    ('Jucimar', '#9b1c1c', [61.7, 79.7, 48.7, 40.8, 59.2, 52, 22.8, 30.5, 31.2, 50, 55, 49.5]),
    ('Lucca', '#4b5563', [47, 53.8, 35, 64.3, 67.5, 57.5, 60.5, 36, 54.3, 23.8, 15.5, 55.5]),
]

def url(values, religion=None):
    u = 'https://12axes.vercel.app/results?' + '&'.join(f'{k}={v:g}' for k, v in zip(KEYS, values))
    return u + (f'&religion={religion}' if religion else '')

d = json.loads(DATA.read_text(encoding='utf-8'))
if any(p['name'] == 'Jucimar' for p in d['people']):
    raise SystemExit('already added')
catalog_people = len(d['people'])
for name, color, values in NEW:
    d['people'].append({'name': name, 'color': color, 'values': values, 'url': url(values, 'catholic'), 'catalogMatches': False})
count = len(d['people'])
medians = d['source']['catalogMedians']
for mask in range(1 << catalog_people, 1 << count):
    idx = [i for i in range(count) if mask & (1 << i)]
    vals = [median(d['people'][i]['values'][j] for i in idx) for j in range(12)]
    dist = [abs(v - m) for v, m in zip(vals, medians)]
    d['groups'][str(mask)] = {'members': idx, 'values': vals, 'matches': None, 'unusual': max(range(12), key=lambda j: dist[j]),
                              'typical': min(range(12), key=lambda j: dist[j]), 'tension': None, 'url': url(vals)}
d['stats'] = []
for j in range(12):
    v = [p['values'][j] for p in d['people']]
    mid = median(v)
    d['stats'].append({'median': mid, 'mean': mean(v), 'mad': median([abs(x - mid) for x in v]), 'min': min(v), 'max': max(v),
                       'middle': sorted(v)[(count - 1) // 2:count // 2 + 1], 'range': max(v) - min(v),
                       'without': [median(v[:i] + v[i + 1:]) for i in range(count)]})
d['source']['catalogPeople'] = catalog_people
d['source']['extensionOffline'] = {'date': '2026-10-27', 'people': [n for n, _, _ in NEW], 'groups': (1 << count) - (1 << catalog_people),
    'note': 'Jucimar and Lucca were added from their supplied results URLs and PDFs. Their catalog match scores were not calculated because the pinned catalog was unavailable; run extend-family-catalog.py with network access to add them.'}
d['family']['note'] = 'Family median of the first six people, the only ones with catalog matches.'
DATA.write_text(json.dumps(d, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(count, len(d['groups']))
