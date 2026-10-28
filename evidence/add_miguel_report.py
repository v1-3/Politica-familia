"""Extract Miguel's supplied report and append it without changing earlier reports."""
from pathlib import Path
from pypdf import PdfReader
import pdfplumber
import json
import re

BASE = Path(__file__).resolve().parent
SOURCE = Path('C:/Users/victo/Downloads/12axes-report-2026-10-27.pdf')
reader = PdfReader(SOURCE)
pages = {}
placements = {}
raw_pages = []
with pdfplumber.open(SOURCE) as pdf:
    for n, page in enumerate(reader.pages, 1):
        image_ids = {}
        images = []
        for i, im in enumerate(page.images, 1):
            path = BASE / 'assets' / f'miguel-p{n}-{i}{Path(im.name).suffix}'
            path.write_bytes(im.data)
            relative = path.relative_to(BASE).as_posix()
            image_ids[im.indirect_reference.idnum] = relative
            images.append({'path': relative, 'width': im.image.width, 'height': im.image.height})
        pages[n] = page.extract_text()
        raw_pages.append({'page': n, 'text': pages[n], 'images': images})
        placements[n] = {
            'images': [{'path': image_ids[im['stream'].objid], 'x': round(im['x0'], 2),
                        'y': round(im['top'], 2), 'width': round(im['width'], 2),
                        'height': round(im['height'], 2)} for im in pdf.pages[n - 1].images],
            'links': [str(a.get_object().get('/A', {}).get('/URI'))
                      for a in page.get('/Annots', []) if a.get_object().get('/A', {}).get('/URI')]
        }

def norm(text):
    return re.sub(r'\s+', ' ', text).strip()

def pattern(text):
    return r'\s+'.join(re.escape(x) for x in text.split())

def images(page):
    return [im['path'] for im in placements[page]['images']]

def item(name, score, page, image=None, **details):
    out = {'name': name, 'source_page': page, **details}
    if score is not None:
        out['match'] = score
    if image:
        out['image'] = image
    return out

def dimensions(names, page, stride=1, offset=1):
    result = []
    for i, (dimension, name) in enumerate(zip(['political', 'social', 'economic'], names)):
        score = re.search(pattern(name) + r'\s+(\d+)%', pages[page])
        assert score, name
        image_index = offset + i * stride
        fields = {'dimension': dimension}
        if stride == 2:
            fields['flag'] = images(page)[image_index + 1]
        result.append(item(name, int(score[1]), page, images(page)[image_index], **fields))
    return result

def featured(page, heading, stop, kind, image_index, flag=False):
    text = pages[page].split(heading + '\n')[1]
    if stop:
        text = text.split(stop)[0]
    lines = text.strip().splitlines()
    fields = {'kind': kind, 'subtitle': lines[2], 'description': norm(' '.join(lines[3:]))}
    if flag:
        fields['flag'] = images(page)[image_index + 1]
    return item(lines[1], int(lines[0].split('%')[0]), page, images(page)[image_index], **fields)

axis_order = ['est', 'rep', 'pod', 'imi', 'dip', 'int', 'eco', 'con', 'com', 'rel', 'mor', 'tec']
miguel = {
    'name': 'Miguel', 'source_pdf': str(SOURCE), 'original_file': SOURCE.name,
    'generated_date': '2026-10-27',
    'axes': dict(zip(axis_order, [55, 55, 65, 65, 76.7, 31.7, 60, 55, 50, 72.5, 42.5, 41.7])),
    'axis_source': 'User-supplied results URL', 'source_text': pages,
    'ideology': item('Machiavellian Republicanism', 91.1, 1, group='Center', description=norm(pages[1].split('MATCH\n')[-1])),
    'report_sentence': norm(pages[1].split('— A SENTENCE THAT DESCRIBES YOU\n')[1].split('TOP MATCH')[0]),
    'pdf_axis_labels': {x.split(' ', 1)[0]: x.split(' ', 1)[1] for x in pages[2].splitlines()
                        if x.split(' ', 1)[0] in ['Structure', 'Economy', 'Representation', 'Control', 'Power', 'Trade', 'Immigration', 'Religion', 'Diplomacy', 'Morality', 'Intervention', 'Technology']
                        and ('%' in x or 'Balanced' in x)},
    'distinctiveness': {'source_page': 2, 'text': norm(pages[2].split('What sets you apart\n')[1])}
}
miguel['countries'] = {
    'featured': [featured(3, 'PRESENT-DAY', 'Also close, by dimension', 'present', 0), featured(3, 'HISTORICAL', None, 'historical', 4)],
    'dimensions': dimensions(['France', 'Mongolia', 'Mexico'], 3),
    'furthest': ['Medieval Iceland (Commonwealth)', 'Vichy France', 'Zapatista Chiapas (Mexico)'], 'source_page': 3
}
body = pages[5].split('The closest figures to your results\n')[1].split('Further reading')[0]
ranking = [item(norm(m[2]), int(m[4]), 5, images(5)[i], rank=int(m[1]), category=m[3])
           for i, m in enumerate(re.finditer(r'(\d{2})\s+(.+?)\s+(Activism|Political theory|Politics|Religion|Philosophy|Business|Economics|Intellectual life)\s+(\d+)%', body, re.S))]
assert len(ranking) == 8
hero_lines = pages[4].split('Figures closest to you\n')[1].split('Also close, by dimension')[0].strip().splitlines()
miguel['figures'] = {
    'featured': item(hero_lines[1], int(hero_lines[0].split('%')[0]), 4, images(4)[0], subtitle=hero_lines[2], description=norm(' '.join(hero_lines[3:]))),
    'ranking': ranking, 'dimensions': dimensions(['Henry Kissinger', 'Linus Torvalds', 'Maximilien Robespierre'], 4),
    'furthest': ['Ezra Heywood', 'Chase Oliver', 'Satoshi Nakamoto'], 'source_page': 4
}
books = [('Henry Kissinger', 'Diplomacy', 1994, 88), ('Maximilien Robespierre', 'Virtue and Terror', 1794, 88), ('Niccolò Machiavelli', 'The Prince', 1532, 87)]
miguel['books'] = [{'author': author, 'title': title, 'year': year, 'author_match': score, 'image': images(5)[8 + i], 'image_kind': 'author_portrait', 'source_url': placements[5]['links'][i], 'url': re.sub(r'&tag=[^&]+', '', placements[5]['links'][i]), 'source_page': 5} for i, (author, title, year, score) in enumerate(books)]
miguel['parties'] = {
    'featured': [featured(6, 'ACTIVE PARTY', 'Also close, by dimension', 'active', 0, True), featured(6, 'HISTORICAL PARTY', None, 'historical', 8, True)],
    'dimensions': dimensions(['Azov Battalion', 'Institutional Revolutionary Party (PRI)', 'Liberal Party of Canada'], 6, stride=2, offset=2),
    'furthest': ['Libertarian Party', 'EZLN (Zapatista Army of National Liberation)', 'Democratic Socialists of America (DSA)'], 'source_page': 6
}
value_lines = pages[7].split('Your values\n')[1].strip().splitlines()
miguel['values'] = [item(value_lines[i + 1], None, 7, category=value_lines[i].title()) for i in range(0, len(value_lines), 2)]
assert len(miguel['values']) == 6
# This newer report has values on page 7 instead of a timeline. No eras are inferred.
miguel['timeline'] = None
others = [('Right', 'Secular Conservatism'), ('Center', 'Tridemism'), ('Center', 'Securitarian Democracy')]
body = pages[8].split('Other ideologies\n')[1].split('THE IDEOLOGY FURTHEST')[0]
close = []
for i, (group, name) in enumerate(others):
    start = re.search(pattern(name) + r'\s+', body).end()
    end = re.search(pattern(others[i + 1][0]) + r'\s+' + pattern(others[i + 1][1]), body).start() if i < 2 else len(body)
    close.append(item(name, None, 8, group=group, description=norm(body[start:end])))
far = pages[8].split('THE IDEOLOGY FURTHEST FROM YOU ')[1].split('Political compass')[0]
miguel['other_ideologies'] = {'close': close, 'furthest': item('Crypto-Anarchism', None, 8, group='Libertarian', description=norm(far.split('Libertarian')[1])), 'source_page': 8}
miguel['compass'] = {'classification': 'Centrist with Moderate social values', 'source_page': 8, 'coordinates': None, 'note': 'Report contains a qualitative compass graphic; coordinates are not supplied in extracted text.'}
miguel['discrepancies'] = ['No numerical discrepancy identified: PDF dominant-pole percentages are rounded, while near-centre values are labeled Balanced. Exact URL scores retained.', 'The October 27 report has a values summary on page 7 instead of the timeline used in the October 17 reports.']

raw = {'source': str(SOURCE), 'page_count': len(raw_pages), 'pages': raw_pages, 'placements': placements}
(BASE / 'pdf-miguel-raw.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding='utf-8')
(BASE / 'pdf-miguel.txt').write_text('\n\n'.join(f'=== PAGE {n} ===\n{text}' for n, text in pages.items()), encoding='utf-8')
profiles = json.loads((BASE / 'pdf_profiles.json').read_text(encoding='utf-8'))
profiles['people']['Miguel'] = miguel
profiles['metadata']['generated_dates'] = sorted({p['generated_date'] for p in profiles['people'].values()})
(BASE / 'pdf_profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'person': 'Miguel', 'pages': len(pages), 'figures': len(ranking), 'books': len(books), 'values': len(miguel['values']), 'images': sum(len(p['images']) for p in raw_pages)}))
