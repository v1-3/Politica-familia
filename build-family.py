from pathlib import Path
import json, base64, mimetypes, re

root=Path(__file__).parent
base=(root/'source-template.html').read_text(encoding='utf-8')
data=json.loads((root/'evidence/html-embedded-data.json').read_text(encoding='utf-8'))
# Keep the editable data authoritative; the template supplies the original layout.
base=re.sub(r'(<script\b[^>]*id="embedded-data"[^>]*>)[\s\S]*?(</script>)',lambda m:m[1]+json.dumps(data,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+m[2],base,count=1)
pdf=json.loads((root/'evidence/pdf_profiles.json').read_text(encoding='utf-8'))

def embed(obj):
    if isinstance(obj,dict):
        for k,v in list(obj.items()):
            if k in ('image','flag') and isinstance(v,str) and v.startswith('assets/'):
                p=root/'evidence'/v
                if not p.is_file(): raise FileNotFoundError(p)
                obj[k]='data:'+mimetypes.guess_type(p.name)[0]+';base64,'+base64.b64encode(p.read_bytes()).decode()
            elif k=='source_pdf': obj[k]=Path(v).name
            else: embed(v)
    elif isinstance(obj,list):
        for v in obj: embed(v)
embed(pdf)
base=base.replace('<title>12 Axes — Family Comparison</title>','<title>12 Axes — Family Atlas</title>')
base=re.sub(r'<title>.*?</title>','<title>12 Axes — Family Atlas</title>',base,count=1)
base=base.replace('<circle data-marker="person" cx="${p.x}" cy="${p.y}" r="7" fill="${p.color}" stroke="#fbf9f3" stroke-width="2.5"/>','<circle data-marker="person" cx="${p.x}" cy="${p.y}" r="11" fill="${p.color}" stroke="#fbf9f3" stroke-width="2.5"/><text class="person-initial" x="${p.x}" y="${p.y}" dy=".35em" text-anchor="middle" fill="white" font-size="12" font-weight="700">${esc(p.name.charAt(0).toUpperCase())}</text>')
base=base.replace('</style>','\n'+(root/'enhancement.css').read_text(encoding='utf-8')+'\n'+(root/'glass.css').read_text(encoding='utf-8')+'\n'+(root/'compact.css').read_text(encoding='utf-8')+'\n</style>',1)
base=base.replace('<a href="#graph">Compass</a>','<a href="#geometry">Geometry</a><a href="#graph">Compass</a>')
base=base.replace('<a href="#books">Books</a>','<a href="#books">Books</a><a href="#reports">PDF reports</a>')
base=base.replace('Compare the graph ↗','Compare the geometry ↗').replace('href="#graph" class="btn"','href="#geometry" class="btn"')
base=base.replace('class="btn" href="#graph"','class="btn" href="#geometry"')
base=base.replace('4 family members · 15 possible combinations · 12 independent axes','4 family members · 15 possible combinations · 12 axes · images included offline')
base=base.replace('Victor, Veranice, Osmar and Isadora','Victor, Veranice, Osmar, Isadora, Rafael, Miguel, Jucimar, Lucca and Julia')
base=base.replace('Compare four individual results.','Compare nine individual results.')
base=base.replace('4 family members · 15 possible combinations','9 family members · 511 possible combinations')
base=base.replace('All 15 nonempty selections','All 511 nonempty selections')
base=base.replace('The 48 scores are preserved exactly from the four supplied URLs.','The 108 scores are preserved exactly from the nine supplied URLs.')
base=base.replace('Osmar’s link specifies Catholic; the other links specify none.','Osmar’s, Miguel’s, Jucimar’s and Lucca’s links specify Catholic; Julia’s specifies Protestant; the other links specify none.')
base=base.replace("if(S.mask&4)note+=' Osmar’s original Catholic recommendation filter is included.';", '')
base=base.replace("members().length===4?'The whole family'","members().length===D.people.length?'The whole family'")
hero=re.search(r'<section class="wrap hero">[\s\S]*?</section>',base).group()
base=base.replace(hero,'',1)
hero=hero.replace('<h1>','<h2>').replace('</h1>','</h2>')
base=base.replace('<main id="main">','<main id="main">\n'+(root/'enhancement.html').read_text(encoding='utf-8'),1)
base=base.replace('<div id="selected-content">','<div id="selected-content">\n'+hero,1)
base=re.sub(r'<section class="wrap section" id="method">[\s\S]*?</section>',(root/'reports-section.html').read_text(encoding='utf-8'),base,count=1)
base=base.replace('<div id="mode-explanation"','<div id="matches-selection-controls" class="section-selection"></div><div id="mode-explanation"',1)
base=base.replace('<div id="book-grid"','<div id="books-selection" class="section-selection"></div><div class="book-method-controls"><div class="segments" role="group" aria-label="Book matching method"><button data-book-mode="median" aria-pressed="true">Median profile</button><button data-book-mode="shared" aria-pressed="false">Shared matches</button></div><label class="threshold">Minimum author fit for each person <input id="book-threshold" type="range" min="0" max="100" step="1" value="0"><output id="book-threshold-value">0%</output></label></div><p id="books-scope-note" class="note"></p><div id="book-grid"',1)
base=base.replace('Who’s in the comparison?','Set people across the page')
base=re.sub(r'<p[^>]*>The median point is the projection of the selected axis medians\. It is not the average of these dots\.</p>','',base)
base=base.replace('People included in all graphs and matches','Default people; changing these resets all section selections')
base=base.replace('Search and the minimum filter apply to this category; the minimum also filters books.','Search and the minimum filter apply to this match category. Books have a separate minimum filter.')
base=base.replace('Lower the minimum compatibility above to restore the reading list.','Lower the author-fit minimum in this section to restore the reading list.')
base=base.replace('<a href="#" download="family-comparison-data.json">','<button id="export-selection" class="btn small">Download current selections ↓</button><br><a href="#" download="family-comparison-data.json">')
base=base.replace('Original descriptions and questions are not reproduced.','The supplied PDFs preserve original descriptions, page-by-page text, figures, books, and timelines or values in the report section. Their rounded results are kept separate from the catalog’s recomputed group matches.')
base=base.replace('Matches were recomputed from the published data because the live API was unavailable.','Matches use the reviewed catalog from October 28, 2026. All nine people and their combinations use the same version; original PDFs retain their historical results.')
base=base.replace("[e.name,e.category,e.role,fields[e.category]||'']", "[e.name,e.category,e.role,fields[e.category]||'',JSON.stringify(e.i18n||{})]")
base=base.replace('const subtitle=e.role||e.category;', 'const subtitle=e.role||e.displayCategory||e.category;')
base=base.replace('Download the comparison data ↓','Download full catalog & all combinations ↓')
base=base.replace('each person’s score stays visible.','each person’s score stays visible.').replace('Colored dots show people; the diamond shows the selected median.','Colored dots show people; the diamond shows the selected median; the brown ring shows the mean.')
base=base.replace("mode:'shared',category:'countries',view:'bars'","mode:'median',category:'countries',view:'bars'")
# The floating bar is the only person picker. Keep the axis display in original-bars mode.
base=re.sub(r'<div class="selection-shell"[^\n]+', '<div class="selection-shell" id="selection"><div class="selection"><div id="people-filter" class="people-filter" role="group" aria-label="People included throughout the page"></div></div></div>',base,count=1)
base=re.sub(r'<div class="segments" role="group" aria-label="Axis view">.*?</div>','',base,count=1)
base=re.sub(r'<div id="(?:geometry-selection|matches-selection-controls|books-selection)" class="section-selection"></div>','',base)
base=re.sub(r'<button[^>]*id="empty-all"[^>]*>.*?</button>','',base)
base=base.replace('Choose any combination below. The radar shows scores; the distance map shows separation.','Select people in the floating bar. Every section compares the same group.')
base=re.sub(r"(?m)^ \$\('axes-(?:plot|table)'\)\.innerHTML=.*\n",'',base)
base=re.sub(r"(?m)^ \['bars','plot','table'\]\.forEach.*\n"," $('axes-bars').hidden=false;renderAxisDetail();\n",base)
base=re.sub(r'<div id="axes-(?:plot|table)"[^>]*></div>','',base)
base=re.sub(r'<section class="wrap section" id="pairs">.*?</section>','',base,count=1)
base=re.sub(r'<div id="axis-detail"[^>]*></div>','',base,count=1)
base=base.replace('id="threshold" type="range"','id="threshold" type="number"').replace('id="book-threshold" type="range"','id="book-threshold" type="number"')
base=re.sub(r'<button data-axis="\$\{j\}" aria-label="Explain .*?</button>', '<strong>${esc(a.label)}</strong>',base)
base=base.replace('<button data-axis="${j}">Range ${fmt(s.range)} · Explain ↗</button>','<span>Range ${fmt(s.range)}</span>')
base=re.sub(r'function renderSelection\(\)\{.*?\n\}','function renderSelection(){}',base,count=1,flags=re.S)
base=base.replace("${S.mode==='shared'?'TOP SHARED IDEOLOGY':'TOP MEDIAN-PROFILE IDEOLOGY'}","${S.mode==='shared'?'TOP SHARED CATALOG MATCH':'TOP MEDIAN-PROFILE CATALOG MATCH'}")
needle="Promise.resolve(JSON.parse(document.getElementById('embedded-data').textContent))"
base=re.sub(r'function renderLab\(reset=false\)\{[^\n]*\}\r?\n','',base,count=1)
old_init_start=base.index('function init(){')
old_init_end=base.index(needle,old_init_start)
# init remains declared for the clean replacement in scoped-controls.js.
base=base[:old_init_start]+'function init(){}\n'+base[old_init_end:]
base=base.replace(needle,'\n'.join((root/name).read_text(encoding='utf-8') for name in ['enhancement.js','scoped-controls.js','preferences.js','report-locale.js','julia-report-locale.js','report-view.js','catalog-ui.js','geometry-3d.js','compact-ui.js'])+'\n'+needle)
# Put evidence and the standalone statistics library before the page script.
logic_start=base.rfind('<script>')
if logic_start<0: raise RuntimeError('Could not locate page script')
extra='<script type="application/json" id="pdf-data">'+json.dumps(pdf,ensure_ascii=False,separators=(',',':')).replace('</','<\\/')+'</script>\n<script>'+(root/'statistics.js').read_text(encoding='utf-8')+'</script>\n'
base=base[:logic_start]+extra+base[logic_start:]
out=root/'site';out.mkdir(exist_ok=True)
base=re.sub(r'(?m)^[ \t]+$','',base)
(out/'index.html').write_text(base,encoding='utf-8')
(root/'family-atlas.html').write_text(base,encoding='utf-8')
(root/'index.html').write_text(base,encoding='utf-8')
print(json.dumps({'file':str(root/'family-atlas.html'),'bytes':len(base.encode()),'reports':len(pdf['people']),'embedded_pdf_images':base.count('report-thumb')}))
exec(compile((root/'publish-online.py').read_text(encoding='utf-8'),str(root/'publish-online.py'),'exec'))
