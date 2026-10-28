from pathlib import Path
from pypdf import PdfReader
import json

BASE=Path(__file__).resolve().parent
BASE.mkdir(exist_ok=True)
(BASE/'assets').mkdir(exist_ok=True)
summary={}
for person in ['Victor','Veranice','Osmar','Isadora']:
    source=Path('C:/Users/victo/Desktop')/(person+'.pdf')
    reader=PdfReader(source)
    pages=[]
    for page_i,page in enumerate(reader.pages,1):
        body=page.extract_text()
        images=[]
        for image_i,img in enumerate(page.images,1):
            path=BASE/'assets'/f'{person.lower()}-p{page_i}-{image_i}{Path(img.name).suffix}'
            path.write_bytes(img.data)
            images.append({'path':str(path.relative_to(BASE)), 'width':img.image.width,'height':img.image.height})
        pages.append({'page':page_i,'text':body,'images':images})
    summary[person]={'source':str(source),'page_count':len(pages),'pages':pages}
    (BASE/f'pdf-{person.lower()}.txt').write_text('\n\n'.join(f'=== PAGE {p["page"]} ===\n{p["text"]}' for p in pages),encoding='utf-8')
(BASE/'pdf_raw.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({n:{'pages':v['page_count'],'images':sum(len(p['images']) for p in v['pages']),'text_characters':sum(len(p['text']) for p in v['pages'])} for n,v in summary.items()}))
