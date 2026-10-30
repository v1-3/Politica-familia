"""Verify online/standalone parity and every extracted asset without a server."""
from pathlib import Path
import base64,hashlib,json,re,subprocess
ROOT=Path(__file__).resolve().parent
offline=(ROOT/'family-atlas.html').read_text(encoding='utf-8')
online=(ROOT/'site/index.html').read_text(encoding='utf-8')
assert (ROOT/'site/family-atlas-offline.html').read_bytes()==(ROOT/'family-atlas.html').read_bytes()
scripts=re.findall(r'<script src="([^"]+)"',online)
assert len(scripts)==1
script=(ROOT/'site'/scripts[0]).read_text(encoding='utf-8')
sources=json.loads(re.search(r'const sources=(\{[^;]+\});',script)[1])
assert set(sources)=={'embedded-data','pdf-data'}
references=set()
def compare(a,b):
    if isinstance(a,dict):
        assert a.keys()==b.keys()
        for k in a:compare(a[k],b[k])
    elif isinstance(a,list):
        assert len(a)==len(b)
        for x,y in zip(a,b):compare(x,y)
    elif isinstance(a,str) and a.startswith('data:') and ';base64,' in a:
        expected=base64.b64decode(a.split(';base64,',1)[1])
        assert b.startswith('assets/') and '..' not in b
        assert (ROOT/'site'/b).read_bytes()==expected,b
        assert Path(b).stem==hashlib.sha256(expected).hexdigest()[:20]
        references.add(b)
    else:assert a==b
for identifier,url in sources.items():
    original=json.loads(re.search(r'<script type="application/json" id="'+identifier+r'">([\s\S]*?)</script>',offline)[1])
    served=json.loads((ROOT/'site'/url).read_text(encoding='utf-8'))
    compare(original,served)
for asset in re.findall(r'assets/[a-f0-9]{20}\.[a-z0-9]+',online+script):
    assert (ROOT/'site'/asset).is_file(),asset
assert ';base64,' not in online
# Compare unchanged source evidence and supplied scores against the reviewed revision.
baseline=json.loads(subprocess.check_output(['git','show','HEAD:evidence/html-embedded-data.json'],cwd=ROOT))
current=json.loads((ROOT/'evidence/html-embedded-data.json').read_text(encoding='utf-8'))
assert [(p['name'],p['url'],p['values']) for p in baseline['people']]==[(p['name'],p['url'],p['values']) for p in current['people']]
pdf_before=subprocess.check_output(['git','show','HEAD:evidence/pdf_profiles.json'],cwd=ROOT)
previous_reports=json.loads(pdf_before)['people']
current_reports=json.loads((ROOT/'evidence/pdf_profiles.json').read_text(encoding='utf-8'))['people']
assert all(current_reports[name]==report for name,report in previous_reports.items())
assert current_reports['Julia']['axes']==dict(zip(['est','rep','pod','imi','dip','int','eco','con','com','rel','mor','tec'],next(p['values'] for p in current['people'] if p['name']=='Julia')))
print(json.dumps({'result':'passed','onlineJSONParity':True,'uniqueVerifiedMediaAssets':len(references),'originalScoresAndPDFsUnchanged':True,'onlineHTMLBytes':len(online.encode())},indent=2))
