"""Extract Rafael's supplied report and append it without changing earlier reports."""
from pathlib import Path
from pypdf import PdfReader
import pdfplumber
import json
import re

BASE = Path(__file__).resolve().parent
SOURCE = Path('C:/Users/victo/Downloads/12axes-report-2026-10-26.pdf')
reader = PdfReader(SOURCE)
pages = {}
placements = {}
raw_pages = []
with pdfplumber.open(SOURCE) as pdf:
    for n, page in enumerate(reader.pages, 1):
        image_ids = {}
        images = []
        for i, im in enumerate(page.images, 1):
            path = BASE / 'assets' / f'rafael-p{n}-{i}{Path(im.name).suffix}'
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
rafael = {
    'name': 'Rafael', 'source_pdf': str(SOURCE), 'original_file': SOURCE.name,
    'generated_date': '2026-10-26',
    'axes': dict(zip(axis_order, [84.3, 50.1, 47.2, 91.2, 69.3, 39.9, 61.3, 61.1, 73.2, 99.1, 63.1, 56])),
    'axis_source': 'User-supplied results URL', 'source_text': pages,
    'ideology': item('Machiavellian Republicanism', 83.8, 1, group='Center', description=norm(pages[1].split('MATCH\n')[-1])),
    'report_sentence': norm(pages[1].split('— A SENTENCE THAT DESCRIBES YOU\n')[1].split('TOP MATCH')[0]),
    'pdf_axis_labels': {x.split(' ', 1)[0]: x.split(' ', 1)[1] for x in pages[2].splitlines()
                        if x.split(' ', 1)[0] in ['Structure', 'Economy', 'Representation', 'Control', 'Power', 'Trade', 'Immigration', 'Religion', 'Diplomacy', 'Morality', 'Intervention', 'Technology']
                        and ('%' in x or 'Balanced' in x)},
    'distinctiveness': {'source_page': 2, 'text': norm(pages[2].split('What sets you apart\n')[1])}
}
rafael['countries'] = {
    'featured': [featured(3, 'PRESENT-DAY', 'Also close, by dimension', 'present', 0), featured(3, 'HISTORICAL', None, 'historical', 4)],
    'dimensions': dimensions(['Quebec (Canada)', 'First French Republic', 'Kingdom of Naples'], 3),
    'furthest': ["Pinochet's Chile", 'Grand Duchy of Tuscany', 'Bahrain'], 'source_page': 3
}
body = pages[5].split('The closest figures to your results\n')[1].split('Further reading')[0]
ranking = [item(norm(m[2]), int(m[4]), 5, images(5)[i], rank=int(m[1]), category=m[3])
           for i, m in enumerate(re.finditer(r'(\d{2})\s+(.+?)\s+(Activism|Political theory|Politics|Religion|Philosophy|Business|Economics|Intellectual life)\s+(\d+)%', body, re.S))]
assert len(ranking) == 8
hero_lines = pages[4].split('Figures closest to you\n')[1].split('Also close, by dimension')[0].strip().splitlines()
rafael['figures'] = {
    'featured': item(hero_lines[1], int(hero_lines[0].split('%')[0]), 4, images(4)[0], subtitle=hero_lines[2], description=norm(' '.join(hero_lines[3:]))),
    'ranking': ranking, 'dimensions': dimensions(["Gabriele D'Annunzio", 'Linus Torvalds', 'Mustafa Kemal Atatürk'], 4),
    'furthest': ['Juan Bautista Alberdi', 'Ron Paul', 'Chase Oliver'], 'source_page': 4
}
books = [("Gabriele D'Annunzio", 'Charter of Carnaro', 1920, 87), ('Georges Sorel', 'Reflections on Violence', 1908, 83), ('Garrett Hardin', 'The Tragedy of the Commons', 1968, 82)]
rafael['books'] = [{'author': author, 'title': title, 'year': year, 'author_match': score, 'image': images(5)[8 + i], 'image_kind': 'author_portrait', 'source_url': placements[5]['links'][i], 'url': re.sub(r'&tag=[^&]+', '', placements[5]['links'][i]), 'source_page': 5} for i, (author, title, year, score) in enumerate(books)]
rafael['parties'] = {
    'featured': [featured(6, 'ACTIVE PARTY', 'Also close, by dimension', 'active', 0, True), featured(6, 'HISTORICAL PARTY', None, 'historical', 8, True)],
    'dimensions': dimensions(['Party for Freedom (PVV)', 'Social Democrats (S)', 'Al-Qaeda'], 6, stride=2, offset=2),
    'furthest': ['Knights Templar', 'House of Al Nahyan', 'Libertarian Party'], 'source_page': 6
}
value_lines = pages[7].split('Your values\n')[1].strip().splitlines()
rafael['values'] = [item(value_lines[i + 1], None, 7, category=value_lines[i].title()) for i in range(0, len(value_lines), 2)]
assert len(rafael['values']) == 6
# This newer report has values on page 7 instead of a timeline. No eras are inferred.
rafael['timeline'] = None
others = [('Center', 'Malthusian Environmentalism'), ('Left', 'Lassallean Socialism'), ('Center', 'Tridemism')]
body = pages[8].split('Other ideologies\n')[1].split('THE IDEOLOGY FURTHEST')[0]
close = []
for i, (group, name) in enumerate(others):
    start = re.search(pattern(name) + r'\s+', body).end()
    end = re.search(pattern(others[i + 1][0]) + r'\s+' + pattern(others[i + 1][1]), body).start() if i < 2 else len(body)
    close.append(item(name, None, 8, group=group, description=norm(body[start:end])))
far = pages[8].split('THE IDEOLOGY FURTHEST FROM YOU ')[1].split('Political compass')[0]
rafael['other_ideologies'] = {'close': close, 'furthest': item('Authoritarian Neoliberalism', None, 8, group='Far-Right', description=norm(far.split('Far-Right')[1])), 'source_page': 8}
rafael['compass'] = {'classification': 'Centrist with Progressive social values', 'source_page': 8, 'coordinates': None, 'note': 'Report contains a qualitative compass graphic; coordinates are not supplied in extracted text.'}
rafael['discrepancies'] = ['No numerical discrepancy identified: PDF dominant-pole percentages are rounded, while near-centre values are labeled Balanced. Exact URL scores retained.', 'The October 26 report has a values summary on page 7 instead of the timeline used in the October 17 reports.']

raw = {'source': str(SOURCE), 'page_count': len(raw_pages), 'pages': raw_pages, 'placements': placements}
(BASE / 'pdf-rafael-raw.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding='utf-8')
(BASE / 'pdf-rafael.txt').write_text('\n\n'.join(f'=== PAGE {n} ===\n{text}' for n, text in pages.items()), encoding='utf-8')
profiles = json.loads((BASE / 'pdf_profiles.json').read_text(encoding='utf-8'))
profiles['people']['Rafael'] = rafael
profiles['metadata']['generated_dates'] = sorted({p['generated_date'] for p in profiles['people'].values()})
(BASE / 'pdf_profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'person': 'Rafael', 'pages': len(pages), 'figures': len(ranking), 'books': len(books), 'values': len(rafael['values']), 'images': sum(len(p['images']) for p in raw_pages)}))
