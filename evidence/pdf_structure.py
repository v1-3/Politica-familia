from pathlib import Path
import json,re

BASE=Path(__file__).resolve().parent
raw=json.loads((BASE/'pdf_raw.json').read_text(encoding='utf-8'))
placements=json.loads((BASE/'pdf_placements.json').read_text(encoding='utf-8'))

CONFIG={
 'Victor':{
  'axes':[6.8,19.8,76.7,98.3,94.5,10.2,63.8,79,79.2,63.4,11.9,93.9],
  'group':'Third Position','ideology':'Techno-Fascism','match':98.0,
  'countries':['China',"Ba\'athist Iraq","Atatürk's Turkey",'Viceroyalty of New Spain','Nazi Germany (Third Reich)'],
  'country_furthest':['Switzerland','Lebanon','Canada'],
  'figure_dims':['Joseph Goebbels','Oswald Mosley','Floriano Peixoto'],
  'figure_furthest':['Diogenes of Sinope','Randolph Bourne','Ezra Heywood'],
  'books':[('Filippo Tommaso Marinetti','The Futurist Manifesto',1909,96),('Benito Mussolini','The Doctrine of Fascism',1932,95),('Ramiro Ledesma Ramos','Discourse to the Youth of Spain',1935,94)],
  'parties':['Chinese Communist Party','Nazi Party (NSDAP)','British Union of Fascists (BUF)','Brazilian Integralist Action (AIB)',"Iraqi Ba'ath Party"],
  'party_furthest':['Libertarian Party','Makhnovists (Revolutionary Insurgent Army of Ukraine)','New Party (NOVO)'],
  'timeline':[[('Qin Shi Huang','259–210 a.C.'),('Constantine the Great','272–337')],[('Portuguese Empire','1415–1822'),('House of Tudor','1485–1603')],[('Jacobins','1789–1794'),('Charles X Gustav','1622–1660')],[('House of Bonaparte','1804–1870'),('Napoleonic Empire','1804–1815')],[("Iraqi Ba'ath Party",'1968–2003'),('Filippo Tommaso Marinetti','1876–1944')],[('Kim Jong Un','1984–'),('Xi Jinping','1953–')]],
  'era':('20th century',95),
  'other':[('Third Position','Fascism'),('Third Position','National Socialism'),('Third Position','British Fascism')],
  'furthest':('Libertarian','Progressive Libertarianism'),
  'compass':'Third position with Strongly traditionalist social values'
 },
 'Veranice':{
  'axes':[48.8,65,51.7,49.2,25.8,47.8,35.3,68,47.8,75,34.2,33.3],
  'group':'Center','ideology':'Green Centrism','match':90.1,
  'countries':['Bosnia and Herzegovina','Mongolia','Bolivia','Rwanda','Weimar Republic'],
  'country_furthest':['Fascist Italy (Mussolini)','Nazi Germany (Third Reich)',"Ba'athist Iraq"],
  'figure_dims':['Ernest Renan','Jacques Chirac','Genghis Khan'],
  'figure_furthest':['Zakhar Prilepin','Adolf Hitler','Joseph Goebbels'],
  'books':[('Ernest Renan','What Is a Nation?',1882,91),('James Madison','The Federalist Papers',1788,90),('Jacques Chirac','Memoirs: Every Step Must Be a Goal',2009,90)],
  'parties':['Kuomintang (KMT)','Democratic Party of Korea (DPK)','Imperial House of Japan','House of Al Thani','Radical Party (Third Republic)'],
  'party_furthest':['Imperial Rule Assistance Association (Taisei Yokusankai)','Nazi Party (NSDAP)','Red Army'],
  'timeline':[[('Epicurus','341–270 a.C.'),('Democritus','c. 460–c. 370 a.C.')],[('Filippo Brunelleschi','1377–1446'),('Dante Alighieri','1265–1321')],[('Benjamin Franklin','1706–1790'),('Montesquieu','1689–1755')],[('Charles Darwin','1809–1882'),('Ernest Renan','1823–1892')],[('William Beveridge','1879–1963'),('Machado de Assis','1839–1908')],[('Bosnia and Herzegovina','Current'),('Jacques Chirac','1932–2019')]],
  'era':('21st century',89),
  'other':[('Center','Constitutional Monarchism'),('Center','Centrism'),('Center','Bioconservatism')],
  'furthest':('Third Position','Fascism'),
  'compass':'Centrist with Traditionalist social values'
 },
 'Osmar':{
  'axes':[25,60,40,59.5,30,27,27,26.3,18.7,49.2,27,50],
  'group':'Right','ideology':'Conservative Liberalism','match':93.1,'religion':'catholic',
  'countries':['North Macedonia','Madrid (Spain)','Liechtenstein','Hong Kong (China)','Kingdom of Sardinia'],
  'country_furthest':['Khmer Rouge Cambodia (Pol Pot)','North Korea','Soviet Union (USSR)'],
  'figure_dims':['Santiago Peña','Richard Rasmussen','Jeff Bezos'],
  'figure_furthest':['Subcomandante Marcos','Jean Meslier','Pol Pot'],
  'books':[('Ludwig Erhard','Prosperity Through Competition',1957,94),('Carl Menger','Principles of Economics',1871,92),('Roberto Campos','A Lanterna na Popa',1994,91)],
  'parties':["People's Party (PP)",'Progressives (PP)','Liberal Party of the Empire (Luzias)','Conservative Party (Tories)','National Democratic Union (UDN)'],
  'party_furthest':['EZLN (Zapatista Army of National Liberation)','Bolsheviks','Red Army'],
  'timeline':[[('Cicero','106–43 a.C.'),('Republican Rome','509–27 a.C.')],[('Renaissance Florence','1115–1532'),('Lorenzo de’ Medici','1449–1492')],[('Kingdom of Sardinia','1720–1861'),('Montesquieu','1689–1755')],[('Baron of Mauá','1813–1889'),('Count of Cavour','1810–1861')],[('Ludwig Erhard','1897–1977'),('Carl Menger','1840–1921')],[('Santiago Peña','1978–'),('North Macedonia','Current')]],
  'era':('21st century',92),
  'other':[('Right','Right-Wing Pragmatism'),('Right','Aristocratic Liberalism'),('Right','Liberal Developmentalism')],
  'furthest':('Radical Left','Techno-Socialism'),
  'compass':'Right with Traditionalist social values'
 },
 'Isadora':{
  'axes':[45,54.7,65.3,44.2,42.5,56.2,39.5,30.5,39.5,80.3,50,25],
  'group':'Center','ideology':'Green Centrism','match':86.9,
  'countries':['Ecuador','Czechia','Australia','Kingdom of Saxony','Weimar Republic'],
  'country_furthest':['Fascist Italy (Mussolini)',"Ba'athist Iraq",'Nazi Germany (Third Reich)'],
  'figure_dims':['Arthur Schopenhauer','Emmanuel Macron','Montesquieu'],
  'figure_furthest':['Zakhar Prilepin','Christopher Columbus','Adolf Hitler'],
  'books':[('Emmanuel Macron','Revolution',2016,87),('Immanuel Kant','Perpetual Peace',1795,86),('James Madison','The Federalist Papers',1788,86)],
  'parties':['Brazilian Social Democracy Party (PSDB)','Social Democratic Party (PSD)','Renaissance','Reform UK','Liberal Party of the Empire (Luzias)'],
  'party_furthest':['Imperial Rule Assistance Association (Taisei Yokusankai)','Falange Española','Nazi Party (NSDAP)'],
  'timeline':[[('Epicurus','341–270 a.C.'),('Heraclitus','c. 535–c. 475 a.C.')],[('Filippo Brunelleschi','1377–1446'),('Lorenzo de’ Medici','1449–1492')],[('George Washington','1732–1799'),('Montesquieu','1689–1755')],[('Charles Darwin','1809–1882'),('Arthur Schopenhauer','1788–1860')],[('Machado de Assis','1839–1908'),('Aldo Leopold','1887-1948')],[('Ecuador','Current'),('Warren Buffett','1930–')]],
  'era':('21st century',87),
  'other':[('Center','Liberal Centrism'),('Left','Nordic Social Democracy'),('Center','Kantian Republicanism')],
  'furthest':('Third Position','National Socialism'),
  'compass':'Centrist with Moderate social values'
 }
}

def norm(s):return re.sub(r'\s+',' ',s).strip()
def pattern(s):return r'\s+'.join(re.escape(x) for x in s.split())
def item(name,score,page,image=None,**kw):
    d={'name':name,'source_page':page,**kw}
    if score is not None:d['match']=score
    if image:d['image']=image
    return d

out={'metadata':{'source':'User-supplied 12 Axes PDF reports','generated_date':'2026-10-17','review':'Extracted text and image placements; representative rendered pages inspected','score_authority':'Exact axis scores come from user-supplied result URLs. PDF axis labels are rounded and often replace near-centre values with Balanced.','caveat':'Catalog similarities are source results, not independently verified political claims, personal beliefs, diagnoses, or endorsements. Book compatibility refers to the author profile.','axis_order':['est','rep','pod','imi','dip','int','eco','con','com','rel','mor','tec']},'people':{}}
for name,c in CONFIG.items():
    pages={p['page']:p['text'] for p in raw[name]['pages']}
    imgs=lambda p:[x['path'] for x in placements[name][str(p)]['images']]
    d={'name':name,'source_pdf':raw[name]['source'],'generated_date':'2026-10-17','axes':dict(zip(out['metadata']['axis_order'],c['axes'])),'axis_source':'User-supplied results URL','source_text':pages}
    if 'religion' in c:d['declared_religion_url']=c['religion']
    d['ideology']=item(c['ideology'],c['match'],1,group=c['group'],description=norm(pages[1].split('MATCH\n')[-1]))
    d['report_sentence']=norm(pages[1].split('— A SENTENCE THAT DESCRIBES YOU\n')[1].split('TOP MATCH')[0])
    d['pdf_axis_labels']={x.split(' ',1)[0]:x.split(' ',1)[1] for x in pages[2].splitlines() if x.split(' ',1)[0] in ['Structure','Economy','Representation','Control','Power','Trade','Immigration','Religion','Diplomacy','Morality','Intervention','Technology'] and ('%' in x or 'Balanced' in x)}
    d['distinctiveness']={'source_page':2,'text':norm(pages[2].split('What sets you apart\n')[1])}
    # Two featured countries, three dimensional matches, and furthest matches.
    countrytext=pages[3]
    current=countrytext.split('PRESENT-DAY\n')[1].split('Also close, by dimension')[0]
    historical=countrytext.split('HISTORICAL\n')[1]
    featured=[]
    for typ,text,idx,imgidx in [('present',current,0,0),('historical',historical,4,4)]:
        lines=text.strip().splitlines()
        score=int(lines[0].split('%')[0]);assert lines[1]==c['countries'][idx]
        featured.append(item(c['countries'][idx],score,3,imgs(3)[imgidx],kind=typ,subtitle=lines[2],description=norm(' '.join(lines[3:]))))
    dims=[]
    for i,dimension in enumerate(['political','social','economic']):
        nm=c['countries'][i+1]
        match=re.search(pattern(nm)+r'\s+(\d+)%',countrytext)
        assert match,(name,nm)
        dims.append(item(nm,int(match[1]),3,imgs(3)[i+1],dimension=dimension))
    d['countries']={'featured':featured,'dimensions':dims,'furthest':c['country_furthest'],'source_page':3}
    # Full ordered figure list and individual featured profile.
    figurebody=pages[5].split('The closest figures to your results\n')[1].split('Further reading')[0]
    figures=[]
    for i,m in enumerate(re.finditer(r'(\d{2})\s+(.+?)\s+(Political theory|Politics|Religion|Philosophy|Business|Economics|Intellectual life)\s+(\d+)%',figurebody,re.S)):
        figures.append(item(norm(m[2]),int(m[4]),5,imgs(5)[i],rank=int(m[1]),category=m[3]))
    assert len(figures)==8,(name,figures)
    featuredtext=pages[4].split('Figures closest to you\n')[1].split('Also close, by dimension')[0].strip().splitlines()
    assert norm(featuredtext[1])==figures[0]['name']
    hero=item(figures[0]['name'],int(featuredtext[0].split('%')[0]),4,imgs(4)[0],subtitle=featuredtext[2],description=norm(' '.join(featuredtext[3:])))
    dims=[]
    for i,dimension in enumerate(['political','social','economic']):
        nm=c['figure_dims'][i];m=re.search(pattern(nm)+r'\s+(\d+)%',pages[4]);assert m,(name,nm)
        dims.append(item(nm,int(m[1]),4,imgs(4)[i+1],dimension=dimension))
    d['figures']={'featured':hero,'ranking':figures,'dimensions':dims,'furthest':c['figure_furthest'],'source_page':4}
    # Books use author portraits, not cover images, in all four reports.
    links=placements[name]['5']['links']
    assert len(links)==3
    d['books']=[{'author':author,'title':title,'year':year,'author_match':score,'image':imgs(5)[8+i],'image_kind':'author_portrait','source_url':links[i],'url':re.sub(r'&tag=[^&]+','',links[i]),'source_page':5} for i,(author,title,year,score) in enumerate(c['books'])]
    partytext=pages[6]
    current=partytext.split('ACTIVE PARTY\n')[1].split('Also close, by dimension')[0]
    historical=partytext.split('HISTORICAL PARTY\n')[1]
    featured=[]
    for typ,text,idx,imgidx in [('active',current,0,0),('historical',historical,4,8)]:
        lines=text.strip().splitlines()
        score=int(lines[0].split('%')[0]);assert lines[1]==c['parties'][idx],(name,lines,c['parties'][idx])
        featured.append(item(c['parties'][idx],score,6,imgs(6)[imgidx],flag=imgs(6)[imgidx+1],kind=typ,subtitle=lines[2],description=norm(' '.join(lines[3:]))))
    dims=[]
    for i,dimension in enumerate(['political','social','economic']):
        nm=c['parties'][i+1];m=re.search(pattern(nm)+r'\s+(\d+)%',partytext);assert m,(name,nm)
        dims.append(item(nm,int(m[1]),6,imgs(6)[i*2+2],flag=imgs(6)[i*2+3],dimension=dimension))
    d['parties']={'featured':featured,'dimensions':dims,'furthest':c['party_furthest'],'source_page':6}
    eras=[('Antiquity','Until 476'),('Middle Ages','476 to 1500'),('Early modern era','1500 to 1800'),('19th century','1800 to 1900'),('20th century','1900 to 2000'),('21st century','Since 2000')]
    d['timeline']={'closest_era':c['era'][0],'match':c['era'][1],'source_page':7,'eras':[{'name':era,'period':period,'entities':[item(nm,None,7,imgs(7)[i*2+j],dates=dates) for j,(nm,dates) in enumerate(c['timeline'][i])]} for i,(era,period) in enumerate(eras)]}
    body=pages[8].split('Other ideologies\n')[1].split('THE IDEOLOGY FURTHEST')[0]
    others=[]
    for i,(group,nm) in enumerate(c['other']):
        start=re.search(pattern(nm)+r'\s+',body).end()
        end=re.search(pattern(c['other'][i+1][0])+r'\s+'+pattern(c['other'][i+1][1]),body).start() if i<2 else len(body)
        others.append(item(nm,None,8,group=group,description=norm(body[start:end])))
    farbody=pages[8].split('THE IDEOLOGY FURTHEST FROM YOU ')[1].split('Political compass')[0]
    farstart=re.search(pattern(c['furthest'][0])+r'\s+',farbody).end()
    d['other_ideologies']={'close':others,'furthest':item(c['furthest'][1],None,8,group=c['furthest'][0],description=norm(farbody[farstart:])),'source_page':8}
    d['compass']={'classification':c['compass'],'source_page':8,'coordinates':None,'note':'Report contains a qualitative compass graphic; coordinates are not supplied in extracted text.'}
    d['discrepancies']=['No numerical discrepancy identified: PDF dominant-pole percentages are rounded, while near-centre values are labeled Balanced. Exact URL scores retained.']
    out['people'][name]=d
(BASE/'pdf_profiles.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8')
print('Wrote',BASE/'pdf_profiles.json')
print({n:{'figures':len(v['figures']['ranking']),'books':len(v['books']),'timeline':sum(len(e['entities']) for e in v['timeline']['eras'])} for n,v in out['people'].items()})
