from pathlib import Path
from pypdf import PdfReader
import pdfplumber,json
BASE=Path(__file__).resolve().parent
all={}
for person in ['Victor','Veranice','Osmar','Isadora']:
    file=Path('C:/Users/victo/Desktop')/(person+'.pdf')
    r=PdfReader(file)
    p=pdfplumber.open(file)
    all[person]={}
    for n in range(1,9):
        images={im.indirect_reference.idnum:str(Path('assets')/f'{person.lower()}-p{n}-{i}{Path(im.name).suffix}').replace('\\','/') for i,im in enumerate(r.pages[n-1].images,1)}
        all[person][n]={'images':[{'path':images[im['stream'].objid],'x':round(im['x0'],2),'y':round(im['top'],2),'width':round(im['width'],2),'height':round(im['height'],2)} for im in p.pages[n-1].images], 'links':[str(a.get_object().get('/A',{}).get('/URI')) for a in r.pages[n-1].get('/Annots',[]) if a.get_object().get('/A',{}).get('/URI')]}
    print(person,[(n,len(x['images'])) for n,x in all[person].items()])
(BASE/'pdf_placements.json').write_text(json.dumps(all,ensure_ascii=False,indent=2),encoding='utf-8')
