"""Cross-check PDF scores with the original source's current vectors and scorer."""
from pathlib import Path
import json, importlib.util, urllib.request, math, hashlib
ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('catalog',ROOT/'extend-family-catalog.py'); calc=importlib.util.module_from_spec(spec);spec.loader.exec_module(calc)
commit='eec01a457e8d677ca9588ac6db0e1c562272d4ee'
cache=ROOT/'evidence/catalog-snapshot'/commit
raw='https://raw.githubusercontent.com/RomanCypherpunk/12axes/'+commit
source_checks={}
for name in ['ProfileMatchScorer','ReligionFilter','CountryDimensionMatcherService','PartyDimensionMatcherService']:
    body=urllib.request.urlopen(raw+'/backend/src/main/java/com/twelveaxes/service/'+name+'.java',timeout=30).read()
    (cache/(name+'.java')).write_bytes(body)
    old=ROOT/'evidence/catalog-snapshot'/(name+'.java')
    source_checks[name]=old.exists() and old.read_bytes().replace(b'\r\n',b'\n')==body.replace(b'\r\n',b'\n')
p=json.loads((ROOT/'evidence/pdf_profiles.json').read_text(encoding='utf8'))['people']['Julia']; values=list(p['axes'].values())
lookup={}; rankings={}
for kind,(filename,idfield) in calc.KINDS.items():
    profiles={e[idfield]:e['vector'] for e in json.loads((cache/filename).read_text(encoding='utf8'))}
    rows=[]
    for obj in json.loads((cache/(kind+'.json')).read_text(encoding='utf8')):
        vector=profiles.get(obj['id']) or obj.get('vector') or {}
        obj['score']=calc.compatibility(values,[vector.get(a,50) for a in calc.AXES]);obj['v']=[vector.get(a,50) for a in calc.AXES]
        lookup[(kind,obj['name'])]=obj
        if calc.allows(obj.get('religions'),'protestant'):rows.append(obj)
    rankings[kind]=[{'name':x['name'],'score':x['score']} for x in sorted(rows,key=lambda x:-x['score'])[:8]]
checks=[]
for kind,items in [('ideologies',[p['ideology']]),('countries',p['countries']['featured']+p['countries']['dimensions']),('personalities',p['figures']['ranking']+p['figures']['dimensions']),('parties',p['parties']['featured']+p['parties']['dimensions'])]:
    for item in items:
        obj=lookup[(kind,item['name'])]
        indices=calc.DIMENSIONS[item['dimension'].title()] if 'dimension' in item and kind!='personalities' else range(12)
        score=calc.compatibility(values,obj['v'],indices)
        checks.append({'kind':kind,'name':item['name'],'pdf':item['match'],'source':score,'roundedMatch':math.floor(score+0.5)==item['match']})
out={'commit':commit,'sourceFilesIdenticalToOlderUnversionedSnapshot':source_checks,'scoringReview':'Current scorer retains the reviewed 0.42/0.33/0.18/0.07 weighted formula, direction augmentation radius 8, and one-decimal rounding. ReligionFilter adds multiple selections; the single Protestant filter retains the same behavior.','scores':checks,'eligibleTopEight':rankings,'allRoundedScoresMatch':all(c['roundedMatch'] for c in checks)}
(ROOT/'evidence/julia-report-check.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(out,ensure_ascii=False))
