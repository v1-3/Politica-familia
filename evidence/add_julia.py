"""Register Julia's exact supplied URL scores before extending the catalog."""
from pathlib import Path
import json

path = Path(__file__).resolve().parent / 'html-embedded-data.json'
data = json.loads(path.read_text(encoding='utf-8'))
if any(p['name'] == 'Julia' for p in data['people']):
    raise SystemExit('Julia is already registered')
data['people'].append({
    'name': 'Julia', 'color': '#b23c99',
    'values': [48.8, 50.8, 85.5, 33.8, 71.3, 28.7, 56.5, 60.3, 45, 23, 8, 43.8],
    'url': 'https://12axes.vercel.app/results?est=48.8&rep=50.8&pod=85.5&imi=33.8&dip=71.3&int=28.7&eco=56.5&con=60.3&com=45&rel=23&mor=8&tec=43.8&religion=protestant',
    'catalogMatches': False,
})
path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
