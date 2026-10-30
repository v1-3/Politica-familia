"""Import Julia's Portuguese PDF, retaining literal text, images and source provenance."""
from pathlib import Path
import json, re, urllib.request, concurrent.futures, importlib.util, hashlib
from pypdf import PdfReader
import pdfplumber

BASE=Path(__file__).resolve().parent
ROOT=BASE.parent
SOURCE=Path('C:/Users/victo/Downloads/12axes-relatorio-2026-10-30.pdf')
COMMIT='eec01a457e8d677ca9588ac6db0e1c562272d4ee'
CACHE=BASE/'catalog-snapshot'/COMMIT
RAW='https://raw.githubusercontent.com/RomanCypherpunk/12axes/'+COMMIT
def norm(s): return re.sub(r'\s+',' ',s).strip()
files=[k+'.json' for k in ['ideologies','countries','personalities','parties']]+['ideology-profiles.json','countries-profiles.json','personality-profiles.json','parties-profiles.json']+['i18n/en/'+k+'.json' for k in ['ideologies','countries','personalities','parties']]
def fetch(name):
    dest=CACHE/name; dest.parent.mkdir(parents=True,exist_ok=True)
    if not dest.exists(): dest.write_bytes(urllib.request.urlopen(RAW+'/backend/src/main/resources/data/'+name,timeout=40).read())
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: list(pool.map(fetch,files))
english={}; catalogs={}
for kind in ['ideologies','countries','personalities','parties']:
    catalogs[kind]=json.loads((CACHE/(kind+'.json')).read_text(encoding='utf-8'))
    translated={x['id']:x for x in json.loads((CACHE/('i18n/en/'+kind+'.json')).read_text(encoding='utf-8'))}
    for obj in catalogs[kind]:
        en=translated.get(obj['id'],{})
        for key in ['name','description','category','role']:
            if obj.get(key) and en.get(key): english[norm(obj[key])]=norm(en[key])
reader=PdfReader(SOURCE); pages={i+1:p.extract_text() for i,p in enumerate(reader.pages)}
placements={}; links={}
with pdfplumber.open(SOURCE) as doc:
    for n,page in enumerate(reader.pages,1):
        ids={}
        for i,im in enumerate(page.images,1):
            path=BASE/'assets'/f'julia-p{n}-{i}{Path(im.name).suffix}'
            path.write_bytes(im.data); ids[im.indirect_reference.idnum]=path.relative_to(BASE).as_posix()
        placements[n]=[ids[im['stream'].objid] for im in doc.pages[n-1].images]
        links[n]=[str(a.get_object().get('/A',{}).get('/URI')) for a in page.get('/Annots',[]) if a.get_object().get('/A',{}).get('/URI')]
def item(name,score,page,image=None,**kw):
    obj={'name':name,'source_page':page,**kw}
    if score is not None: obj['match']=score
    if image: obj['image']=image
    return obj
def feature(page,start,end,kind,index,flag=False):
    lines=pages[page].split(start+'\n')[1].split(end)[0].strip().splitlines()
    extra={'kind':kind,'subtitle':lines[2],'description':norm(' '.join(lines[3:])),'language':'pt'}
    if flag: extra['flag']=placements[page][index+1]
    return item(lines[1],int(lines[0].split('%')[0]),page,placements[page][index],**extra)
def dims(names,page,offset=1,stride=1):
    out=[]
    for i,(dimension,name) in enumerate(zip(['political','social','economic'],names)):
        score=int(re.search(re.escape(name).replace(r'\ ',r'\s+')+r'\s+(\d+)%',pages[page])[1])
        out.append(item(name,score,page,placements[page][offset+i*stride],dimension=dimension))
        if stride==2: out[-1]['flag']=placements[page][offset+i*stride+1]
    return out
data=json.loads((BASE/'html-embedded-data.json').read_text(encoding='utf-8'))
person=next(p for p in data['people'] if p['name']=='Julia')
keys=['est','rep','pod','imi','dip','int','eco','con','com','rel','mor','tec']
p={'name':'Julia','source_pdf':SOURCE.name,'original_file':SOURCE.name,'generated_date':'2026-10-30','source_language':'pt','axes':dict(zip(keys,person['values'])),'axis_source':person['url'],'source_text':pages}
p['ideology']=item('Liberalismo New Deal',89,1,group='Centro',description=norm(pages[1].split('MATCH\n')[-1]),language='pt')
p['report_sentence']=norm(pages[1].split('UMA FRASE QUE TE DESCREVE\n')[1].split('TOP MATCH')[0])
p['distinctiveness']={'source_page':2,'text':norm(pages[2].split('O que te distingue\n')[1])}
p['countries']={'featured':[feature(3,'PAÍS ATUAL','Também próximos, por dimensão','present',0),feature(3,'EXPERIÊNCIA HISTÓRICA','\0','historical',4)],'dimensions':dims(['Reino da Hungria','Tanzânia','Mongólia'],3),'furthest':['New Hampshire (Estados Unidos)','Território Livre (Makhnovshchina)','Aragão e Catalunha Anarquistas'],'source_page':3}
body=pages[5].split('Os mais próximos dos seus resultados\n')[1].split('Para ler')[0]
rank=[item(norm(m[2]),int(m[4]),5,placements[5][i],rank=int(m[1]),category=m[3]) for i,m in enumerate(re.finditer(r'(\d{2})\s+(.+?)\s+(Religião|Política)\s+(\d+)%',body,re.S))]
assert len(rank)==8
p['figures']={'featured':feature(4,'Personalidades mais próximas de você','Também próximos, por dimensão','personality',0),'ranking':rank,'dimensions':dims(['Jorge I da Grã-Bretanha','Tomás de Aquino','Lachlan Macquarie'],4),'furthest':['Subcomandante Marcos','Ezra Heywood','Satoshi Nakamoto'],'source_page':4}
books=[('João Calvino','As Institutas da Religião Cristã',1536,93),('Jorge I da Grã-Bretanha','Cartas de Estado e Instruções Ministeriais',1727,91),('Marco Aurélio','Meditações',180,90)]
p['books']=[dict(author=a,title=t,year=y,author_match=s,image=placements[5][8+i],image_kind='author_portrait',source_url=links[5][i],url=re.sub(r'&tag=[^&]+','',links[5][i]),source_page=5) for i,(a,t,y,s) in enumerate(books)]
p['parties']={'featured':[feature(6,'PARTIDO ATUAL','Também próximos, por dimensão','active',0,True),feature(6,'PARTIDO HISTÓRICO','\0','historical',8,True)],'dimensions':dims(['Populares','Democracia Cristã (DC)','Partido Democrático Progressista (DPP)'],6,2,2),'furthest':['Partido Libertário','Socialistas Democráticos da América (DSA)','EZLN (Exército Zapatista de Libertação Nacional)'],'source_page':6}
vl=pages[7].split('Seus valores\n')[1].strip().splitlines()
p['values']=[item(vl[i+1],None,7,category=vl[i].title()) for i in range(0,len(vl),2)]; p['timeline']=None
body=pages[8].split('Outras ideologias\n')[1].split('A IDEOLOGIA MAIS DISTANTE')[0]
chunks=body.split('Direita\n')[1:]
names=['Imperialismo Federalista','Estoicismo','Conservadorismo Paternalista']
p['other_ideologies']={'close':[item(n,None,8,group='Direita',description=norm(c)[len(n):].strip(),language='pt') for n,c in zip(names,chunks)],'furthest':item('Criptoanarquismo',None,8,group='Libertário',description=norm(pages[8].split('Criptoanarquismo Libertário\n')[1].split('Bússola política')[0]),language='pt'),'source_page':8}
p['compass']={'classification':'Centrista com valores sociais Fortemente tradicionalistas','source_page':8,'coordinates':None}
english.update({
 p['report_sentence']:'I want a patriotic nation of faith, with a strong federal government regulating banks, protected unions, social security and global leadership.',
 p['distinctiveness']['text']:'Most unusual position: Religion. 81% of ideologies lean less religious than you. Most common position: Economy, near the center like the catalog. Internal tension: Multiculturalism + Traditionalism; only 14 of 274 ideologies combine these positions. Examples: Cameralism, Christian Democracy and Mutualism, plus 11 others.',
 'Centro':'Center','Direita':'Right','Libertário':'Libertarian','Religião':'Religion','Política':'Politics','Política Externa':'Foreign policy','Economia':'Economy','Imigração':'Immigration','Sociedade':'Society','Tecnologia':'Technology',
 'Governo forte':'Strong government','Militarismo':'Militarism','Liberalismo Social':'Social Liberalism','Pluralismo':'Pluralism','Tradicionalismo religioso':'Religious traditionalism','Equilíbrio tecnológico':'Technological balance',
 'Centrista com valores sociais Fortemente tradicionalistas':'Centrist with strongly traditionalist social values',
 'As Institutas da Religião Cristã':'Institutes of the Christian Religion','Cartas de Estado e Instruções Ministeriais':'State Letters and Ministerial Instructions','Meditações':'Meditations',
 'Marco Aurélio':'Marcus Aurelius','República presidencialista descentralizada':'Decentralized presidential republic','Monarquia feudal-parlamentar':'Feudal-parliamentary monarchy','Reformador protestante':'Protestant reformer','Partido':'Party','Brasil':'Brazil','Estados Unidos do New Deal':'New Deal United States'
})
# The PDF's country overview shortens the upstream description. Translate its exact wording.
english[p['countries']['featured'][0]['description']]='A presidential republic with competitive elections and a strong civil society, Kenya has a 2010 constitution devolving power to 47 counties, a service and technology economy including M-Pesa, ethnic tensions and recent protests against taxes.'
# Match sentence fragments and names to the source translation by normalized text.
def walk(obj):
    if isinstance(obj,dict):
        if obj.get('description'):
            lookup=norm(obj['description']).replace(' A compatibilidade indica proximidade entre suas respostas e esse perfil.','')
            assert lookup in english, ('Missing description translation',obj['name'],lookup)
            obj['description_en']=english[lookup]
        for k,v in obj.items():
            if k not in ['source_text','description','description_en']: walk(v)
    elif isinstance(obj,list):
        for v in obj:walk(v)
walk(p)
profiles=json.loads((BASE/'pdf_profiles.json').read_text(encoding='utf-8')); profiles['people']['Julia']=p
profiles['metadata']['generated_dates']=sorted({x['generated_date'] for x in profiles['people'].values()})
(BASE/'pdf_profiles.json').write_text(json.dumps(profiles,ensure_ascii=False,indent=2),encoding='utf-8')
(BASE/'pdf-julia.txt').write_text('\n\n'.join(f'PAGE {n}\n{t}' for n,t in pages.items()),encoding='utf-8')
used=set()
def collect(x):
    if isinstance(x,str):
        used.add(x)
        used.update(x.split(' · '))
    elif isinstance(x,dict):
        for k,v in x.items():
            if k not in ['source_text','description','description_en']:collect(v)
    elif isinstance(x,list):
        for v in x:collect(v)
collect(p)
mapping={s:english[s] for s in used if s in english}
(ROOT/'julia-report-locale.js').write_text('const JULIA_REPORT_EN='+json.dumps(mapping,ensure_ascii=False)+';\n',encoding='utf-8')
print(json.dumps({'pages':len(pages),'imagePlacements':{n:len(v) for n,v in placements.items()},'translations':len(mapping)},ensure_ascii=False))
