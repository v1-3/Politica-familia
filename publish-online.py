"""Build the GitHub Pages edition from the independently usable offline HTML."""
from pathlib import Path
import base64, hashlib, json, re, shutil
ROOT=Path(__file__).resolve().parent
OUT=ROOT/'site'
ASSETS=OUT/'assets'
ASSETS.mkdir(exist_ok=True)
html=(ROOT/'family-atlas.html').read_text(encoding='utf-8')
used=set()
def save(payload,extension):
    name=hashlib.sha256(payload).hexdigest()[:20]+'.'+extension
    used.add(name)
    path=ASSETS/name
    if not path.exists():path.write_bytes(payload)
    return 'assets/'+name
def asset(match):
    mime,encoded=match.group(1),match.group(2)
    extension={'image/svg+xml':'svg','image/jpeg':'jpg','image/png':'png','image/webp':'webp','font/woff2':'woff2','application/font-woff':'woff'}.get(mime,'bin')
    return save(base64.b64decode(encoded),extension)
html=re.sub(r'data:([^;"\s]+);base64,([A-Za-z0-9+/=]+)',asset,html)
payloads={}
def json_script(m):
    identifier=m[1];payloads[identifier]=save(m[2].encode(),'json')
    return f'<script type="application/json" id="{identifier}"></script>'
html=re.sub(r'<script type="application/json" id="(embedded-data|pdf-data)">([\s\S]*?)</script>',json_script,html)
# Execute application scripts only after their JSON is available; display errors accessibly.
scripts=re.findall(r'<script>([\s\S]*?)</script>',html)
html=re.sub(r'<script>[\s\S]*?</script>','',html)
js='\n'.join(scripts)
bootstrap='''(async()=>{try{const sources=SOURCES;await Promise.all(Object.entries(sources).map(async([id,url])=>{const r=await fetch(url);if(!r.ok)throw new Error('Data request failed');document.getElementById(id).textContent=await r.text();}));APP\n}catch(error){console.error(error);document.getElementById('loading-status').textContent='Could not load the atlas. Reload to retry. / Não foi possível carregar. Recarregue para tentar novamente.';}})();'''.replace('SOURCES',json.dumps(payloads)).replace('APP',js)
script_url=save(bootstrap.encode(),'js')
html=html.replace('</body>',f'<script src="{script_url}" defer></script></body>')
html=html.replace('<main id="main">','<p id="loading-status" role="status" style="padding:1rem;text-align:center">Loading / Carregando…</p><main id="main" inert>')
html=html.replace('</footer>','<p class="offline-download"><a href="family-atlas-offline.html" download>Download offline edition / Baixar versão off-line</a></p></footer>')
(OUT/'index.html').write_text(html,encoding='utf-8')
shutil.copyfile(ROOT/'family-atlas.html',OUT/'family-atlas-offline.html')
# Remove only obsolete, verified content-addressed build outputs in this folder.
# Unknown or modified files are retained; source/evidence files are never touched.
asset_root=ASSETS.resolve()
asset_root.relative_to(ROOT.resolve())
for path in ASSETS.iterdir():
    if path.name in used or not path.is_file() or not re.fullmatch(r'[a-f0-9]{20}\.[a-z0-9]+',path.name):continue
    resolved=path.resolve()
    if resolved.parent==asset_root and hashlib.sha256(path.read_bytes()).hexdigest()[:20]==path.stem:
        path.unlink()
print(json.dumps({'onlineHTMLBytes':len(html.encode()),'offlineBytes':(ROOT/'family-atlas.html').stat().st_size,'assets':len(list(ASSETS.iterdir()))}))
