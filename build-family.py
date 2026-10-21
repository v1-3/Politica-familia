from pathlib import Path
import json, base64, mimetypes, re

root=Path(__file__).parent
base=Path(r'C:\Users\victo\Desktop\family-12axes.html').read_text(encoding='utf-8')
pdf=json.loads((root/'evidence/pdf_profiles.json').read_text(encoding='utf-8'))

def embed(obj):
    if isinstance(obj,dict):
        for k,v in list(obj.items()):
            if k in ('image','flag') and isinstance(v,str) and v.startswith('assets/'):
                p=root/'evidence'/v
                if not p.is_file(): raise FileNotFoundError(p)
                obj[k]='data:'+mimetypes.guess_type(p.name)[0]+';base64,'+base64.b64encode(p.read_bytes()).decode()
            elif k=='source_pdf': obj[k]=obj['name']+'.pdf'
            else: embed(v)
    elif isinstance(obj,list):
        for v in obj: embed(v)
embed(pdf)
base=base.replace('<title>12 Axes — Family Comparison</title>','<title>12 Axes — Family Atlas</title>')
base=re.sub(r'<title>.*?</title>','<title>12 Axes — Family Atlas</title>',base,count=1)
base=base.replace('</style>','\n'+(root/'enhancement.css').read_text(encoding='utf-8')+'\n</style>',1)
base=base.replace('<a href="#graph">Compass</a>','<a href="#geometry">Geometry</a><a href="#graph">Compass</a>')
base=base.replace('<a href="#books">Books</a>','<a href="#books">Books</a><a href="#reports">PDF reports</a>')
base=base.replace('Compare the graph ↗','Compare the geometry ↗').replace('href="#graph" class="btn"','href="#geometry" class="btn"')
base=base.replace('class="btn" href="#graph"','class="btn" href="#geometry"')
base=base.replace('4 family members · 15 possible combinations · 12 independent axes','4 family members · 15 possible combinations · 12 axes · images included offline')
hero=re.search(r'<section class="wrap hero">[\s\S]*?</section>',base).group()
base=base.replace(hero,'',1)
hero=hero.replace('<h1>','<h2>').replace('</h1>','</h2>')
base=base.replace('<main id="main">','<main id="main">\n'+(root/'enhancement.html').read_text(encoding='utf-8'),1)
base=base.replace('<div id="selected-content">','<div id="selected-content">\n'+hero,1)
base=re.sub(r'<section class="wrap section" id="method">[\s\S]*?</section>',(root/'reports-section.html').read_text(encoding='utf-8'),base,count=1)
base=base.replace('<div id="mode-explanation"','<div id="matches-selection-controls" class="section-selection"></div><div id="mode-explanation"',1)
base=base.replace('<div id="book-grid"','<div id="books-selection" class="section-selection"></div><div class="book-method-controls"><div class="segments" role="group" aria-label="Book matching method"><button data-book-mode="median" aria-pressed="true">Median profile</button><button data-book-mode="shared" aria-pressed="false">Shared matches</button></div><label class="threshold">Minimum author fit for each person <input id="book-threshold" type="range" min="0" max="100" step="1" value="0"><output id="book-threshold-value">0%</output></label></div><p id="books-scope-note" class="note"></p><div id="book-grid"',1)
base=base.replace('Who’s in the comparison?','Set people across the page')
base=base.replace('People included in all graphs and matches','Default people; changing these resets all section selections')
base=base.replace('Search and the minimum filter apply to this category; the minimum also filters books.','Search and the minimum filter apply to this match category. Books have their own people and minimum below.')
base=base.replace('Lower the minimum compatibility above to restore the reading list.','Lower the author-fit minimum in this section to restore the reading list.')
base=base.replace('<a href="#" download="family-comparison-data.json">','<button id="export-selection" class="btn small">Download current selections ↓</button><br><a href="#" download="family-comparison-data.json">')
base=base.replace('Original descriptions and questions are not reproduced.','The supplied PDFs preserve original descriptions, eight-page text, figures, books and timelines in the report section. Their rounded results are kept separate from the catalog’s recomputed group matches.')
base=base.replace('Matches were recomputed from the published data because the live API was unavailable.','The original HTML states that its matches were recomputed from a pinned public catalog because its live API was unavailable. This edition retains those precomputed matches; it does not claim a fresh live ranking.')
base=base.replace('Download the comparison data ↓','Download full catalog & all combinations ↓')
base=base.replace('each person’s score stays visible.','each person’s score stays visible.').replace('Colored dots show people; the diamond shows the selected median.','Colored dots show people; the diamond shows the selected median; the brown ring shows the mean.')
base=base.replace("mode:'shared',category:'countries',view:'bars'","mode:'median',category:'countries',view:'plot'")
base=base.replace("${S.mode==='shared'?'TOP SHARED IDEOLOGY':'TOP MEDIAN-PROFILE IDEOLOGY'}","${S.mode==='shared'?'TOP SHARED CATALOG MATCH':'TOP MEDIAN-PROFILE CATALOG MATCH'}")
needle="Promise.resolve(JSON.parse(document.getElementById('embedded-data').textContent))"
base=re.sub(r'function renderLab\(reset=false\)\{[^\n]*\}\r?\n','',base,count=1)
old_init_start=base.index('function init(){')
old_init_end=base.index(needle,old_init_start)
# init remains declared for the clean replacement in scoped-controls.js.
base=base[:old_init_start]+'function init(){}\n'+base[old_init_end:]
base=base.replace(needle,(root/'enhancement.js').read_text(encoding='utf-8')+'\n'+(root/'scoped-controls.js').read_text(encoding='utf-8')+'\n'+needle)
# Put evidence and the standalone statistics library before the page script.
logic_start=base.rfind('<script>')
if logic_start<0: raise RuntimeError('Could not locate page script')
extra='<script type="application/json" id="pdf-data">'+json.dumps(pdf,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>\n<script>'+(root/'statistics.js').read_text(encoding='utf-8')+'</script>\n'
base=base[:logic_start]+extra+base[logic_start:]
out=root/'site';out.mkdir(exist_ok=True)
(out/'index.html').write_text(base,encoding='utf-8')
(root/'family-atlas.html').write_text(base,encoding='utf-8')
print(json.dumps({'file':str(root/'family-atlas.html'),'bytes':len(base.encode()),'reports':len(pdf['people']),'embedded_pdf_images':base.count('report-thumb')}))
