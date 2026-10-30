"""Independent NumPy audit of the pinned catalog and every stored combination."""
from pathlib import Path
import json
from urllib.parse import urlparse, parse_qs
import numpy as np

ROOT=Path(__file__).resolve().parent
read=lambda p:json.loads(p.read_text(encoding='utf-8'))
D=read(ROOT/'evidence/html-embedded-data.json')
CACHE=ROOT/'evidence/catalog-snapshot'/D['source']['commit']
AX=['estrutura','representacao','poder','imigracao','diplomacia','intervencao','economia','controle','comercio','religiao','moral','tecnologia']
SPEC={'ideologies':('ideology','ideologyId'),'countries':('countries','countryId'),'personalities':('personality','personalityId'),'parties':('parties','partyId')}
catalog={}
for kind,(stem,identifier) in SPEC.items():
    vectors={p[identifier]:[p['vector'][a] for a in AX] for p in read(CACHE/(stem+'-profiles.json'))}
    names={e['id']:e for e in read(CACHE/'en'/(kind+'.json'))}
    for raw in read(CACHE/(kind+'.json')):
        catalog[kind+'/'+raw['id']]={**raw,**names.get(raw['id'],{}),'vector':vectors[raw['id']],'kind':kind,'pt':raw}
keys=list(catalog); ki={k:i for i,k in enumerate(keys)}
targets=np.array([catalog[k]['vector'] for k in keys])
round1=lambda x:np.floor(np.asarray(x)*10+.5)/10

def score(user,axes=None):
    u=np.asarray(user,dtype=float);t=targets
    if axes is not None:u=u[axes];t=t[:,axes]
    delta=abs(t-u);uc=u-50;tc=t-50
    axis=np.maximum(0,1-(delta/50)**2)
    axis*=np.where(uc*tc<0,1-.45*np.tanh(abs(uc)/25)*np.tanh(abs(tc)/25),1)
    aug=len(u)*64
    direction=50+50*((tc*uc).sum(1)+aug)/np.sqrt(((uc*uc).sum()+aug)*((tc*tc).sum(1)+aug))
    intensity=100-2*abs(abs(uc).mean()-abs(tc).mean(1))
    worst=100*np.maximum(0,1-(delta.max(1)/100)**2.5)
    return round1(np.clip(.42*100*axis.mean(1)+.33*direction+.18*intensity+.07*worst,0,100))

SELECT={'catholic','protestant','orthodox','judaism','islam','buddhism','hinduism'}
def allowed(e,pref):
    r=set(e.get('religions') or []);p=set((pref or '').split(','))
    if 'christianity' in p:p|={'catholic','protestant','orthodox'}
    if not r:return True
    if 'other' in p and (not r&SELECT or p=={'other'}):return not r&SELECT
    if 'only' in r:return bool(r&p) if r&SELECT else pref is None
    return pref is None or bool(r&p) or not r&SELECT

people=D['people']; X=np.array([p['values'] for p in people])
prefs=[parse_qs(urlparse(p['url']).query).get('religion',[None])[0] for p in people]
individual=np.array([score(v) for v in X])
axes={'Political':list(range(12)),'Social':[1,10,9,6,7,8,3,2,11],'Economic':[6,7,8]}
occupations={'Political':{'politico','teorico','ativista'},'Social':{'filosofo','religioso','intelectual','ativista'},'Economic':{'politico','economista','empresario'}}
subscores={label:np.array([score(v,idx) for v in X]) for label,idx in axes.items()}
books={b['personalityId']:b for b in read(CACHE/'books.json')}
medians=np.median([e['vector'] for e in catalog.values() if e['kind']=='ideologies'],axis=0)
assert np.allclose(medians,D['source']['catalogMedians'])
numeric=dimensions=0
for k,e in D['entities'].items():
    assert np.array_equal(individual[:,ki[k]],e['personScores']),k
    for language,src in [('pt',catalog[k]['pt']),('en',catalog[k])]:
        for field in ['name','category','role','description','period']:
            if field in src:assert e['i18n'][language][field]==src[field],(k,language,field)
    numeric+=len(people)
assert len(D['groups'])==2**len(people)-1
for mask,g in D['groups'].items():
    ids=[i for i in range(len(people)) if int(mask)&(1<<i)]
    assert ids==g['members']
    median=np.median(X[ids],axis=0);assert np.allclose(median,g['values'])
    v=round1(median);syn=score(v);inds=individual[ids]
    floors=inds.min(0);mids=np.median(inds,axis=0);means=inds.mean(0)
    eligible=[k for k in keys if all(allowed(catalog[k],prefs[i]) for i in ids)]
    distances=round1(abs(v-medians))
    assert g['typicalAxes']==np.flatnonzero(distances==distances.min()).tolist()
    assert g['unusualAxes']==np.flatnonzero(distances==distances.max()).tolist()
    for mode,cats in g['matches'].items():
        rank=lambda k:(-floors[ki[k]],-mids[ki[k]],-means[ki[k]],catalog[k]['name']) if mode=='shared' else (-syn[ki[k]],catalog[k]['name'])
        ranked=sorted(eligible,key=rank)
        pools={kind:[k for k in ranked if catalog[k]['kind']==kind] for kind in SPEC}
        expected={**pools,'countries':[k for k in pools['countries'] if not catalog[k].get('historical')],'historical':[k for k in pools['countries'] if catalog[k].get('historical')],'parties':[k for k in pools['parties'] if not catalog[k].get('historical')],'historicalParties':[k for k in pools['parties'] if catalog[k].get('historical')],'leaders':[k for k in pools['personalities'] if catalog[k]['category']=='politico']}
        fields={}
        for k in pools['personalities']:fields.setdefault(catalog[k]['category'],k)
        expected['fields']=list(fields.values())[:8]
        expected['books']=[k for k in pools['personalities'] if catalog[k]['id'] in books][:12]
        expected['distant']=sum([list(reversed(pools[k]))[:3] for k in SPEC],[])
        for category,rows in cats.items():
            if category=='dimensions':continue
            assert [r['key'] for r in rows]==expected[category][:len(rows)],(mask,mode,category)
            for r in rows:
                j=ki[r['key']]
                assert np.allclose([r['floor'],r['medianPerson'],r['meanPerson'],r['synthetic']],[floors[j],mids[j],means[j],syn[j]],atol=1e-10),(mask,mode,category,r['key'])
                if category=='books':assert r['titles']==books[catalog[r['key']]['id']]['title']
                numeric+=4
        excluded={'personalities':{expected['personalities'][0]},'countries':{expected['countries'][0],expected['historical'][0]},'parties':{expected['parties'][0],expected['historicalParties'][0]}}
        for label,idx in axes.items():
            sub=subscores[label][ids].min(0) if mode=='shared' else score(v,idx)
            for row,kind in zip(cats['dimensions'][label],['personalities','countries','parties']):
                values=(floors if mode=='shared' else syn) if kind=='personalities' else sub
                candidates=[k for k in pools[kind] if k not in excluded[kind] and (kind!='personalities' or catalog[k]['category'] in occupations[label])]
                winner=min(candidates,key=lambda k:(-values[ki[k]],catalog[k]['name']))
                assert row=={'key':winner,'score':values[ki[winner]]},(mask,mode,label,kind)
                excluded[kind].add(winner);dimensions+=1
    if len(ids)==1:
        candidates={k for k in pools['personalities'][:8]+list(fields.values()) if catalog[k]['id'] in books}
        want=sorted(candidates,key=rank)[:3]
        actual=people[ids[0]]['matches']['books']
        assert [b['authorId'] for b in actual]==[catalog[k]['id'] for k in want]
        assert [b['score'] for b in actual]==[syn[ki[k]] for k in want]

# Classical MDS equals centered PCA for these Euclidean RMS distances.
centered=(X-X.mean(0))/np.sqrt(12)
U,s,_=np.linalg.svd(centered,full_matrices=False)
exact=np.linalg.norm(centered[:,None]-centered[None,:],axis=2)
geometry={}
for dims in [2,3]:
    coords=U[:,:dims]*s[:dims]
    approx=np.linalg.norm(coords[:,None]-coords[None,:],axis=2)
    geometry[str(dims)]={'retainedVariationPercent':float(100*(s[:dims]**2).sum()/(s**2).sum()),'normalizedDistanceError':float(np.sqrt(((exact-approx)**2).sum()/(exact**2).sum()))}
result={'catalogCommit':D['source']['commit'],'combinations':len(D['groups']),'numericChecks':numeric,'dimensionEntries':dimensions,'localization':'passed','geometryAllNine':geometry}
(ROOT/'evidence/refresh-validation.json').write_text(json.dumps(result,indent=2)+'\n',encoding='utf-8')
print(json.dumps(result,indent=2))
