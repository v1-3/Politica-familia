"""Extend the retained family snapshot with Miguel and every new group.

Catalog JSON and Java reference implementations in evidence/catalog-snapshot
are pinned to d66d8747950045077770a89dfa565d173bb60964. Original groups are
kept byte-for-byte at the JSON-value level. No live ranking API is used.
"""
from pathlib import Path
from statistics import median, mean
import base64
import concurrent.futures
import json
import math
import mimetypes
import urllib.request
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / 'evidence/catalog-snapshot'
DATA = ROOT / 'evidence/html-embedded-data.json'
COMMIT = 'd66d8747950045077770a89dfa565d173bb60964'
SOURCE = 'https://github.com/RomanCypherpunk/12axes/tree/' + COMMIT
RAW = 'https://raw.githubusercontent.com/RomanCypherpunk/12axes/' + COMMIT
AXES = ['estrutura', 'representacao', 'poder', 'imigracao', 'diplomacia', 'intervencao', 'economia', 'controle', 'comercio', 'religiao', 'moral', 'tecnologia']
KEYS = ['est', 'rep', 'pod', 'imi', 'dip', 'int', 'eco', 'con', 'com', 'rel', 'mor', 'tec']
KINDS = {'ideologies': ('ideology-profiles.json', 'ideologyId'), 'countries': ('countries-profiles.json', 'countryId'), 'personalities': ('personality-profiles.json', 'personalityId'), 'parties': ('parties-profiles.json', 'partyId')}
DIMENSIONS = {'Political': list(range(12)), 'Social': [1, 10, 9, 6, 7, 8, 3, 2, 11], 'Economic': [6, 7, 8]}
SELECTABLE = {'catholic', 'protestant', 'orthodox', 'judaism', 'islam', 'buddhism', 'hinduism'}

def ensure_cache():
    """Fetch pinned calculation inputs locally; these upstream files are not site outputs."""
    files = [f'{kind}.json' for kind in KINDS] + [p[0] for p in KINDS.values()] + ['books.json']
    files += [f'en/{kind}.json' for kind in KINDS]
    for name in files:
        path = CACHE/name
        if path.exists():
            continue
        path.parent.mkdir(parents=True, exist_ok=True)
        relative = 'i18n/'+name if name.startswith('en/') else name
        with urllib.request.urlopen(RAW+'/backend/src/main/resources/data/'+relative, timeout=30) as response:
            path.write_bytes(response.read())

def load(path):
    return json.loads(path.read_text(encoding='utf-8'))

def round1(x):
    return math.floor(x * 10 + 0.5) / 10

def compatibility(user, target, axes=range(12)):
    uv, tv = [user[j] for j in axes], [target[j] for j in axes]
    n = len(uv)
    axis = 0
    for u, t in zip(uv, tv):
        similarity = max(0, 1 - ((u - t) / 50) ** 2)
        if (u - 50) * (t - 50) < 0:
            similarity *= 1 - 0.45 * math.tanh(abs(u - 50) / 25) * math.tanh(abs(t - 50) / 25)
        axis += similarity
    axis *= 100 / n
    u, t = [v - 50 for v in uv], [v - 50 for v in tv]
    augment = n * 64
    direction = 50 + 50 * (sum(a*b for a,b in zip(u,t)) + augment) / math.sqrt((sum(a*a for a in u)+augment)*(sum(b*b for b in t)+augment))
    magnitude = 100 - 2 * abs(sum(map(abs,u))/n - sum(map(abs,t))/n)
    outlier = 100 * max(0, 1 - (max(abs(a-b) for a,b in zip(uv,tv))/100)**2.5)
    return round1(max(0, min(100, 0.42*axis + 0.33*direction + 0.18*magnitude + 0.07*outlier)))

def allows(religions, preference):
    if not religions:
        return True
    preferred = ['catholic', 'protestant', 'orthodox'] if preference == 'christianity' else [preference] if preference else []
    matches = any(r in preferred for r in religions)
    if 'only' in religions:
        return matches if any(r in SELECTABLE for r in religions) else preference is None
    return preference is None or matches or not any(r in SELECTABLE for r in religions)

def result_url(values):
    return 'https://12axes.vercel.app/results?' + '&'.join(f'{k}={v:g}' for k,v in zip(KEYS,values))

def context(values, data, catalog):
    distances = [abs(v-m) for v,m in zip(values,data['source']['catalogMedians'])]
    result = {'unusual': max(range(12), key=lambda j: distances[j]), 'typical': min(range(12), key=lambda j: distances[j]), 'tension': None}
    best = 0
    for i in range(12):
        for j in range(i+1,12):
            a,b = values[i]-50, values[j]-50
            if min(abs(a),abs(b)) < 15:
                continue
            xs,ys = [p['vector'][i] for p in catalog], [p['vector'][j] for p in catalog]
            mx,my = mean(xs),mean(ys)
            denom = math.sqrt(sum((x-mx)**2 for x in xs)*sum((y-my)**2 for y in ys))
            corr = sum((x-mx)*(y-my) for x,y in zip(xs,ys))/denom if denom else 0
            if abs(corr)<.45 or (a*b>0)==(corr>0):
                continue
            count = sum((x-50)*a>0 and abs(x-50)>=10 and (y-50)*b>0 and abs(y-50)>=10 for x,y in zip(xs,ys))
            score = abs(corr)*(1-count/len(xs))
            if score>best:
                best=score
                result['tension']={'axes':[i,j], 'poles':[data['axes'][k]['leftPole' if values[k]>50 else 'rightPole'] for k in [i,j]], 'count':count, 'total':len(xs)}
    return result

def main():
    ensure_cache()
    data = load(DATA)
    original_people = [p for p in data['people'] if p['name'] != 'Miguel']
    original_count = len(original_people)
    original_limit = 1 << original_count
    original_groups = {str(i): data['groups'][str(i)] for i in range(1,original_limit)}
    original_entities = data['entities']
    miguel = {'name':'Miguel', 'color':'#737f20', 'values':[55,55,65,65,76.7,31.7,60,55,50,72.5,42.5,41.7]}
    miguel['url'] = result_url(miguel['values']) + '&religion=catholic'
    data['people'] = original_people + [miguel]
    count = len(data['people'])
    limit = 1 << count
    catalogs = {}
    all_entities = {}
    for kind,(profiles_file,id_field) in KINDS.items():
        profiles = {p[id_field]:p['vector'] for p in load(CACHE/profiles_file)}
        translations = {p['id']:p for p in load(CACHE/'en'/f'{kind}.json')}
        catalogs[kind] = []
        for raw in load(CACHE/f'{kind}.json'):
            meta = {**raw, **translations.get(raw['id'],{})}
            vector = profiles.get(meta['id']) or meta.get('vector') or {}
            meta['vector'] = [vector.get(a,50) for a in AXES]
            meta['kind'] = kind
            meta['key'] = kind + '/' + meta['id']
            meta['scores'] = [compatibility(p['values'], meta['vector']) for p in data['people']]
            catalogs[kind].append(meta)
            all_entities[meta['key']] = meta
    # Independent regression check: every retained individual score must match.
    checked = 0
    for key,entity in original_entities.items():
        assert entity['personScores'][:original_count] == all_entities[key]['scores'][:original_count], key
        entity['personScores'] = all_entities[key]['scores']
        checked += original_count
    books = {b['personalityId']:b for b in load(CACHE/'books.json')}
    needed = set(original_entities)
    preferences = [parse_qs(urlparse(p['url']).query).get('religion',[None])[0] for p in data['people']]
    def group_for(mask):
        indices = [i for i in range(count) if mask & (1<<i)]
        values = [median([data['people'][i]['values'][j] for i in indices]) for j in range(12)]
        # The published matcher receives one-decimal vectors, using Java round.
        matching_values = [round1(x) for x in values]
        eligible = {kind:[e for e in entries if all(allows(e.get('religions'),preferences[i]) for i in indices)] for kind,entries in catalogs.items()}
        row_by_key = {}
        for entries in eligible.values():
            for e in entries:
                scores = [e['scores'][i] for i in indices]
                row_by_key[e['key']] = {'key':e['key'],'floor':min(scores),'medianPerson':median(scores),'meanPerson':mean(scores),'synthetic':compatibility(matching_values,e['vector'])}
        def order(e, mode, distant=False):
            row = row_by_key[e['key']]
            if mode=='shared':
                metrics = (row['floor'],row['medianPerson'],row['meanPerson'])
            else:
                metrics = (row['synthetic'],)
            return tuple(x if distant else -x for x in metrics)+(e['name'],)
        result = {'members':indices,'values':values,'matches':{},**context(values,data,catalogs['ideologies']),'url':result_url(values)}
        for mode in ['shared','median']:
            sorted_by_kind = {kind:sorted(entries,key=lambda e:order(e,mode)) for kind,entries in eligible.items()}
            pick = lambda entries,n=24:[dict(row_by_key[e['key']]) for e in entries[:n]]
            matches = {
                'ideologies':pick(sorted_by_kind['ideologies']),
                'countries':pick([e for e in sorted_by_kind['countries'] if not e.get('historical')]),
                'historical':pick([e for e in sorted_by_kind['countries'] if e.get('historical')]),
                'leaders':pick([e for e in sorted_by_kind['personalities'] if e['category']=='politico']),
                'personalities':pick(sorted_by_kind['personalities']),
                'parties':pick([e for e in sorted_by_kind['parties'] if not e.get('historical')]),
                'historicalParties':pick([e for e in sorted_by_kind['parties'] if e.get('historical')]),
            }
            field_winners = {}
            for e in sorted_by_kind['personalities']:
                field_winners.setdefault(e['category'], e)
            matches['fields'] = pick(list(field_winners.values()),8)
            matches['distant'] = sum([pick(list(reversed(entries)),3) for entries in sorted_by_kind.values()],[])
            matches['books'] = [{**row_by_key[e['key']], 'title':books[e['id']]['title']['en'],'year':books[e['id']]['year'],'bookSource':SOURCE+'/backend/src/main/resources/data/books.json'} for e in sorted_by_kind['personalities'] if e['id'] in books][:12]
            matches['dimensions'] = {}
            for label,axes in DIMENSIONS.items():
                rows = []
                for kind in ['personalities','countries','parties']:
                    def dim_score(e):
                        return min(compatibility(data['people'][i]['values'],e['vector'],axes) for i in indices) if mode=='shared' else compatibility(matching_values,e['vector'],axes)
                    winner = min(eligible[kind],key=lambda e:(-dim_score(e),e['name']))
                    rows.append({'key':winner['key'],'score':dim_score(winner)})
                matches['dimensions'][label]=rows
            for category,rows in matches.items():
                for row in (sum(rows.values(),[]) if category=='dimensions' else rows):
                    needed.add(row['key'])
            result['matches'][mode] = matches
        return result
    # Verify the original ranking order and all scores, allowing only machine epsilon.
    def equivalent(a,b):
        if isinstance(a,(float,int)) and isinstance(b,(float,int)):
            return abs(a-b)<1e-9
        if isinstance(a,dict) and isinstance(b,dict):
            return a.keys()==b.keys() and all(equivalent(a[k],b[k]) for k in a)
        if isinstance(a,list) and isinstance(b,list):
            return len(a)==len(b) and all(equivalent(x,y) for x,y in zip(a,b))
        return a==b
    for mask in range(1,original_limit):
        regenerated=group_for(mask)
        for mode in ['shared','median']:
            for category,rows in original_groups[str(mask)]['matches'][mode].items():
                assert equivalent(rows,regenerated['matches'][mode][category]), (mask,mode,category)
    print(json.dumps({'verifiedRetainedIndividualScores':checked,'verifiedOriginalGroups':len(original_groups)}),flush=True)
    data['groups'] = {**original_groups,**{str(mask):group_for(mask) for mask in range(original_limit,limit)}}
    def entity_for(meta):
        kind = meta['kind']
        fields = ['id','name','category'] + (['role','lifespan'] if kind=='personalities' else ['countryId'] if kind=='ideologies' else ['historical','period']+(['countryId'] if kind=='parties' else []))
        entry = {key:meta[key] for key in fields if key in meta}
        prefix = {'countries':'flag','personalities':'image','parties':'logo'}.get(kind)
        entry.update(kind=kind,asset=meta.get(prefix+'Path') if prefix else None,reference=meta.get(prefix+'SourceUrl') if prefix else None,source=SOURCE+'/backend/src/main/resources/data/'+kind+'.json',personScores=meta['scores'],assetKind={'countries':'flag','personalities':'portrait','parties':'logo','ideologies':'ideology'}[kind])
        return entry
    for key in sorted(needed):
        if key not in original_entities:
            original_entities[key] = entity_for(all_entities[key])
    # Only new retained images are fetched, then embedded to preserve offline use.
    image_dir = CACHE/'assets'
    image_dir.mkdir(exist_ok=True)
    def image_for(key):
        e = original_entities[key]
        if e.get('localAsset') or not e.get('asset'):
            return None
        asset = e['asset']
        path = image_dir/asset.lstrip('/').replace('/','_')
        if not path.exists():
            try:
                with urllib.request.urlopen(RAW+'/frontend/public'+asset,timeout=30) as response:
                    path.write_bytes(response.read())
            except Exception as error:
                return {'key':key,'error':str(error)}
        e['localAsset']='data:'+mimetypes.guess_type(path.name)[0]+';base64,'+base64.b64encode(path.read_bytes()).decode('ascii')
        return None
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        errors=[v for v in pool.map(image_for,sorted(needed)) if v]
    # Individual catalog summary retains the source's separate recommendation view.
    def individual_summary(values,indices):
        eligible={kind:[e for e in entries if all(allows(e.get('religions'),preferences[i]) for i in indices)] for kind,entries in catalogs.items()}
        scored={kind:sorted([(compatibility(values,e['vector']),e) for e in entries],key=lambda x:(-x[0],x[1]['name'])) for kind,entries in eligible.items()}
        def item(score,e,dimension=None,score_population=None):
            entry={k:v for k,v in entity_for(e).items() if k not in ['kind','personScores','assetKind']}
            entry['score']=score
            population=score_population or [s for s,_ in scored[e['kind']]]
            entry['percentile']=round1(100*sum(s<score for s in population)/len(population))
            if dimension: entry['dimension']=dimension
            return entry
        summary={}
        for category,kind,historical,n in [('ideologies','ideologies',None,12),('countries','countries',False,10),('historical','countries',True,10),('personalities','personalities',None,12),('parties','parties',False,8),('historicalParties','parties',True,8)]:
            summary[category]=[item(s,e) for s,e in scored[kind] if historical is None or bool(e.get('historical'))==historical][:n]
        summary['distant']={kind:[item(s,e) for s,e in sorted(rows,key=lambda x:(x[0],x[1]['name']))[:3]] for kind,rows in scored.items()}
        winners={}
        for s,e in scored['personalities']: winners.setdefault(e['category'],(s,e))
        summary['fields']=[item(s,e) for s,e in winners.values()]
        candidates={e['id']:(s,e) for s,e in scored['personalities'] if e['id'] in {p['id'] for p in summary['personalities']+summary['fields']} and e['id'] in books}
        summary['books']=[{'title':books[e['id']]['title']['en'],'author':e['name'],'authorId':e['id'],'year':books[e['id']]['year'],'score':s,'reference':e.get('imageSourceUrl'),'source':SOURCE+'/backend/src/main/resources/data/books.json'} for s,e in sorted(candidates.values(),key=lambda x:(-x[0],x[1]['name']))[:3]]
        summary['dimensions']={}
        for kind,exclude in [('personalities',[summary['personalities'][0]['id']]),('countries',[summary['countries'][0]['id'],summary['historical'][0]['id']]),('parties',[summary['parties'][0]['id'],summary['historicalParties'][0]['id']])]:
            matches=[]
            for label,axes in DIMENSIONS.items():
                rows=sorted([(compatibility(values,e['vector'],axes),e) for e in eligible[kind] if e['id'] not in exclude],key=lambda x:(-x[0],x[1]['name']))
                s,e=rows[0]
                matches.append(item(s,e,label,[s for s,e in rows]))
                exclude.append(e['id'])
            summary['dimensions'][kind]=matches
        return summary
    miguel['matches']=individual_summary(miguel['values'],[count-1])
    miguel['catalogContext']=context(miguel['values'],data,catalogs['ideologies'])
    values=data['groups'][str(limit-1)]['values']
    data['family']={**data['family'],'values':values,'url':result_url(values),'matches':individual_summary([round1(v) for v in values],list(range(count))), 'catalogContext':context(values,data,catalogs['ideologies'])}
    data['stats']=[]
    for j in range(12):
        v=[p['values'][j] for p in data['people']]
        mid=median(v)
        middle=sorted(v)[(count-1)//2:count//2+1]
        data['stats'].append({'median':mid,'mean':mean(v),'mad':median([abs(x-mid) for x in v]),'min':min(v),'max':max(v),'middle':middle,'range':max(v)-min(v),'without':[median(v[:i]+v[i+1:]) for i in range(count)]})
    data['source']['method']='The previous 31 family combinations are retained. Miguel and the 32 combinations containing him were calculated on October 27, 2026 from the same pinned published catalog and scoring formula. All six supplied score vectors remain unchanged; these are offline catalog matches, not fresh live rankings.'
    data['source']['extension']={'date':'2026-10-27','person':'Miguel','newCombinations':original_limit,'preservedCombinations':len(original_groups),'scoringReference':SOURCE+'/backend/src/main/java/com/twelveaxes/service/ProfileMatchScorer.java','verifiedRetainedScores':checked}
    assert {str(i):data['groups'][str(i)] for i in range(1,original_limit)}==original_groups
    DATA.write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    print(json.dumps({'people':len(data['people']),'groups':len(data['groups']),'entities':len(data['entities']),'images':sum(bool(e.get('localAsset')) for e in data['entities'].values()),'imageErrors':errors},ensure_ascii=False),flush=True)

if __name__=='__main__':
    main()
