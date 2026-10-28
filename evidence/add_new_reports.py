"""Extract the Jucimar and Lucca reports and append them to pdf_profiles.json.

Same method as add_miguel_report.py (October 27, 2026 report format). Earlier
reports are not modified. Usage: python add_new_reports.py <dir with juci.pdf and lucca.pdf>
"""
from pathlib import Path
from pypdf import PdfReader
import pdfplumber, json, re, sys

BASE = Path(__file__).resolve().parent
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path('/mnt/user-data/uploads')
AXIS_ORDER = ['est', 'rep', 'pod', 'imi', 'dip', 'int', 'eco', 'con', 'com', 'rel', 'mor', 'tec']
CATS = r'(Activism|Political theory|Politics|Religion|Philosophy|Business|Economics|Intellectual life)'

def norm(t): return re.sub(r'\s+', ' ', t).strip()
def pattern(t): return r'\s+'.join(re.escape(x) for x in t.split())

def build(slug, name, filename, values, cfg):
    source = SRC / filename
    reader = PdfReader(source)
    pages, placements, raw_pages = {}, {}, []
    with pdfplumber.open(source) as pdf:
        for n, page in enumerate(reader.pages, 1):
            ids, imgs = {}, []
            for i, im in enumerate(page.images, 1):
                path = BASE / 'assets' / f'{slug}-p{n}-{i}{Path(im.name).suffix}'
                path.write_bytes(im.data)
                ids[im.indirect_reference.idnum] = path.relative_to(BASE).as_posix()
                imgs.append({'path': ids[im.indirect_reference.idnum], 'width': im.image.width, 'height': im.image.height})
            pages[n] = page.extract_text()
            raw_pages.append({'page': n, 'text': pages[n], 'images': imgs})
            placements[n] = {
                'images': [{'path': ids[im['stream'].objid], 'x': round(im['x0'], 2), 'y': round(im['top'], 2),
                            'width': round(im['width'], 2), 'height': round(im['height'], 2)} for im in pdf.pages[n - 1].images],
                'links': [str(a.get_object().get('/A', {}).get('/URI')) for a in page.get('/Annots', []) if a.get_object().get('/A', {}).get('/URI')]}
    imgs = lambda p: [i['path'] for i in placements[p]['images']]

    def item(nm, score, page, image=None, **d):
        o = {'name': nm, 'source_page': page, **d}
        if score is not None: o['match'] = score
        if image: o['image'] = image
        return o

    def dimensions(names, page, stride=1, offset=1):
        out, cursor = [], 0
        for i, (dim, nm) in enumerate(zip(['political', 'social', 'economic'], names)):
            m = re.compile(pattern(nm) + r'\s+(\d+)%').search(pages[page], cursor)
            assert m, nm
            cursor = m.end()
            f = {'dimension': dim}
            if stride == 2: f['flag'] = imgs(page)[offset + i * stride + 1]
            out.append(item(nm, int(m[1]), page, imgs(page)[offset + i * stride], **f))
        return out

    def featured(page, heading, stop, kind, idx, flag=False):
        text = pages[page].split(heading + '\n')[1]
        if stop: text = text.split(stop)[0]
        lines = text.strip().splitlines()
        f = {'kind': kind, 'subtitle': lines[2], 'description': norm(' '.join(lines[3:]))}
        if flag: f['flag'] = imgs(page)[idx + 1]
        return item(lines[1], int(lines[0].split('%')[0]), page, imgs(page)[idx], **f)

    p = {'name': name, 'source_pdf': filename, 'original_file': filename, 'generated_date': '2026-10-27',
         'axes': dict(zip(AXIS_ORDER, values)), 'axis_source': 'User-supplied results URL', 'source_text': pages,
         'ideology': item(cfg['ideology'][0], cfg['ideology'][1], 1, group=cfg['ideology'][2], description=norm(pages[1].split('MATCH\n')[-1])),
         'report_sentence': norm(pages[1].split('— A SENTENCE THAT DESCRIBES YOU\n')[1].split('TOP MATCH')[0]),
         'pdf_axis_labels': {x.split(' ', 1)[0]: x.split(' ', 1)[1] for x in pages[2].splitlines()
                             if x.split(' ', 1)[0] in ['Structure', 'Economy', 'Representation', 'Control', 'Power', 'Trade', 'Immigration', 'Religion', 'Diplomacy', 'Morality', 'Intervention', 'Technology'] and ('%' in x or 'Balanced' in x)},
         'distinctiveness': {'source_page': 2, 'text': norm(pages[2].split('What sets you apart\n')[1])}}
    c = cfg['countries']
    p['countries'] = {'featured': [featured(3, 'PRESENT-DAY', 'Also close, by dimension', 'present', 0), featured(3, 'HISTORICAL', None, 'historical', 4)],
                      'dimensions': dimensions(c['dims'], 3), 'furthest': c['furthest'], 'source_page': 3}
    body = pages[5].split('The closest figures to your results\n')[1].split('Further reading')[0]
    rank = [item(norm(m[2]), int(m[4]), 5, imgs(5)[i], rank=int(m[1]), category=m[3])
            for i, m in enumerate(re.finditer(r'(\d{2})\s+(.+?)\s+' + CATS + r'\s+(\d+)%', body, re.S))]
    assert len(rank) == 8, rank
    hl = pages[4].split('Figures closest to you\n')[1].split('Also close, by dimension')[0].strip().splitlines()
    f = cfg['figures']
    p['figures'] = {'featured': item(hl[1], int(hl[0].split('%')[0]), 4, imgs(4)[0], subtitle=hl[2], description=norm(' '.join(hl[3:]))),
                    'ranking': rank, 'dimensions': dimensions(f['dims'], 4), 'furthest': f['furthest'], 'source_page': 4}
    links = placements[5]['links']
    p['books'] = [{'author': a, 'title': t, 'year': y, 'author_match': s, 'image': imgs(5)[8 + i], 'image_kind': 'author_portrait',
                   'source_url': links[i], 'url': re.sub(r'&tag=[^&]+', '', links[i]), 'source_page': 5} for i, (a, t, y, s) in enumerate(cfg['books'])]
    pt = cfg['parties']
    p['parties'] = {'featured': [featured(6, 'ACTIVE PARTY', 'Also close, by dimension', 'active', 0, True), featured(6, 'HISTORICAL PARTY', None, 'historical', 8, True)],
                    'dimensions': dimensions(pt['dims'], 6, stride=2, offset=2), 'furthest': pt['furthest'], 'source_page': 6}
    vl = pages[7].split('Your values\n')[1].strip().splitlines()
    p['values'] = [item(vl[i + 1], None, 7, category=vl[i].title()) for i in range(0, len(vl), 2)]
    assert len(p['values']) == 6
    p['timeline'] = None
    body = pages[8].split('Other ideologies\n')[1].split('THE IDEOLOGY FURTHEST')[0]
    others = cfg['others']; close = []
    for i, (g, nm) in enumerate(others):
        s = re.search(pattern(nm) + r'\s+', body).end()
        e = re.search(pattern(others[i + 1][0]) + r'\s+' + pattern(others[i + 1][1]), body).start() if i < 2 else len(body)
        close.append(item(nm, None, 8, group=g, description=norm(body[s:e])))
    far = pages[8].split('THE IDEOLOGY FURTHEST FROM YOU ')[1].split('Political compass')[0]
    fg, fn = cfg['far_ideology']
    p['other_ideologies'] = {'close': close, 'furthest': item(fn, None, 8, group=fg, description=norm(far.split(fg)[1])), 'source_page': 8}
    p['compass'] = {'classification': cfg['compass'], 'source_page': 8, 'coordinates': None,
                    'note': 'Report contains a qualitative compass graphic; coordinates are not supplied in extracted text.'}
    p['discrepancies'] = ['No numerical discrepancy identified: PDF dominant-pole percentages are rounded, while near-centre values are labeled Balanced. Exact URL scores retained.',
                          'The October 27 report has a values summary on page 7 instead of the timeline used in the October 17 reports.']
    raw = {'source': filename, 'page_count': len(raw_pages), 'pages': raw_pages, 'placements': placements}
    (BASE / f'pdf-{slug}-raw.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding='utf-8')
    (BASE / f'pdf-{slug}.txt').write_text('\n\n'.join(f'=== PAGE {n} ===\n{t}' for n, t in pages.items()), encoding='utf-8')
    print(name, {k: len(placements[k]['images']) for k in placements})
    return p

JUCIMAR = dict(
  ideology=('Liberal Centrism', 93.8, 'Center'),
  countries=dict(dims=['Washington, D.C. (United States)', 'Panama', 'Macau (China)'], furthest=['North Korea', 'Khmer Rouge Cambodia (Pol Pot)', 'Fascist Italy (Mussolini)']),
  figures=dict(dims=['Anders Fogh Rasmussen', 'Richard Rasmussen', 'Jerome Powell'], furthest=['Pol Pot', 'Joseph Stalin', 'Joseph Goebbels']),
  books=[('Luiz Felipe Pondé', 'Guia politicamente incorreto da filosofia', 2012, 92), ('Al Gore', 'An Inconvenient Truth', 2006, 84), ('Thomas Paine', 'Common Sense', 1776, 77)],
  parties=dict(dims=['Social Democratic Party (PSD)', 'Social Democratic Party (PSD)', 'Forza Italia (FI)'], furthest=['Red Army', "Workers' Party of Korea (WPK)", 'Falange Española']),
  others=[('Center', 'Pragmatic Liberalism'), ('Center', 'Federalism'), ('Right', 'Conservative Liberalism')],
  far_ideology=('Radical Left', 'Stalinist Socialism'), compass='Center-right with Moderate social values')
LUCCA = dict(
  ideology=('Christian Conservatism', 90.8, 'Right'),
  countries=dict(dims=['Croatia', 'Old Swiss Confederacy', 'Oregon (United States)'], furthest=['Soviet Union (USSR)', 'Khmer Rouge Cambodia (Pol Pot)', 'Paris Commune']),
  figures=dict(dims=['Andrzej Duda', 'Dom Bertrand', 'Matteo Salvini'], furthest=['Subcomandante Marcos', 'Élisée Reclus', 'Ezra Heywood']),
  books=[('Jordan Peterson', '12 Rules for Life', 2018, 94), ('Dom Bertrand', 'Environmentalist Psychosis: Ecoterrorists Want to End Your Business', 2012, 90), ('Thomas Aquinas', 'Summa Theologica', 1274, 89)],
  parties=dict(dims=['Freedom Party of Austria (FPÖ)', "Brothers of Italy (Fratelli d'Italia)", 'Makhnovists (Revolutionary Insurgent Army of Ukraine)'], furthest=['Democratic Socialists of America (DSA)', 'Libertarian Party', 'EZLN (Zapatista Army of National Liberation)']),
  others=[('Right', 'Conservatism'), ('Right', 'Alt-Lite'), ('Right', 'Pragmatic Conservatism')],
  far_ideology=('Anarchist', 'Techno-Communism'), compass='Center-right with Strongly traditionalist social values')

profiles = json.loads((BASE / 'pdf_profiles.json').read_text(encoding='utf-8'))
profiles['people']['Jucimar'] = build('jucimar', 'Jucimar', 'juci.pdf', [61.7, 79.7, 48.7, 40.8, 59.2, 52, 22.8, 30.5, 31.2, 50, 55, 49.5], JUCIMAR)
profiles['people']['Lucca'] = build('lucca', 'Lucca', 'lucca.pdf', [47, 53.8, 35, 64.3, 67.5, 57.5, 60.5, 36, 54.3, 23.8, 15.5, 55.5], LUCCA)
profiles['metadata']['generated_dates'] = sorted({x['generated_date'] for x in profiles['people'].values()})
(BASE / 'pdf_profiles.json').write_text(json.dumps(profiles, ensure_ascii=False, indent=2), encoding='utf-8')
