"""Normalize refreshed source summaries and localized book metadata."""
from pathlib import Path
import json
root=Path(__file__).resolve().parent
path=root/'evidence/html-embedded-data.json'
d=json.loads(path.read_text(encoding='utf-8'))
cache=root/'evidence/catalog-snapshot'/d['source']['commit']
for kind in ['ideologies','countries','personalities','parties']:
    for lang,folder in [('pt',cache),('en',cache/'en')]:
        for raw in json.loads((folder/(kind+'.json')).read_text(encoding='utf-8')):
            e=d['entities'].get(kind+'/'+raw['id'])
            if e and 'category' in raw:e['i18n'][lang]['category']=raw['category']
for e in d['entities'].values():
    if 'category' in e['i18n']['pt']:
        e['i18n']['en'].setdefault('category',e['i18n']['pt']['category'])
books={b['personalityId']:b for b in json.loads((root/'evidence/catalog-snapshot'/d['source']['commit']/'books.json').read_text(encoding='utf-8'))}
for p in d['people']+[d['family']]:
    for b in p['matches']['books']:
        b['titles']=books[b['authorId']]['title']
d['source']['method']='All nine supplied profiles and all 511 combinations were recalculated from the reviewed October 28, 2026 catalog. Personality areas use all twelve axes and occupation groups; country and party dimensions use the source axis subsets. Every selected person must allow each candidate. Rankings use English names for deterministic ties; translated names do not change scores.'
path.write_text(json.dumps(d,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
