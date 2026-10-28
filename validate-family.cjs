const fs=require('fs');
const assert=require('node:assert/strict');
const F=require('./statistics.js');
const D=JSON.parse(fs.readFileSync('evidence/html-embedded-data.json','utf8'));
const P=JSON.parse(fs.readFileSync('evidence/pdf_profiles.json','utf8'));
let checked=0;
const count=D.people.length, selectionCount=(1<<count)-1;
const catalogCount=D.people.filter(p=>p.catalogMatches!==false).length, catalogSelections=(1<<catalogCount)-1;
assert.equal(count,8);assert.equal(catalogCount,8);
assert.ok(D.people.every(p=>p.matches&&p.catalogMatches!==false));
assert.deepEqual(D.people.find(p=>p.name==='Jucimar').values,[61.7,79.7,48.7,40.8,59.2,52,22.8,30.5,31.2,50,55,49.5]);
assert.deepEqual(D.people.find(p=>p.name==='Lucca').values,[47,53.8,35,64.3,67.5,57.5,60.5,36,54.3,23.8,15.5,55.5]);
for(const n of ['Jucimar','Lucca'])assert.equal(new URL(D.people.find(p=>p.name===n).url).searchParams.get('religion'),'catholic');
assert.deepEqual(D.people.find(p=>p.name==='Miguel').values,[55,55,65,65,76.7,31.7,60,55,50,72.5,42.5,41.7]);
assert.equal(new URL(D.people.find(p=>p.name==='Miguel').url).searchParams.get('religion'),'catholic');
assert.deepEqual(D.people.find(p=>p.name==='Rafael').values,[84.3,50.1,47.2,91.2,69.3,39.9,61.3,61.1,73.2,99.1,63.1,56]);
assert.equal(Object.keys(D.groups).length,selectionCount);
for(const p of D.people){
 const u=new URL(p.url);
 assert.deepEqual(p.values,F.AXES.map(a=>Number(u.searchParams.get(a))));
 assert.deepEqual(p.values,F.AXES.map(a=>P.people[p.name].axes[a]));
 assert.equal(Object.keys(P.people[p.name].source_text).length,8);
 assert.equal(P.people[p.name].books.length,3);
 assert.equal(P.people[p.name].figures.ranking.length,8);
 const report=P.people[p.name];
 if(report.timeline)assert.equal(report.timeline.eras.length,6);
 else assert.ok(report.values,'Newer reports preserve their values section');
}
for(const e of Object.values(D.entities)){
 assert.equal(e.personScores.length,catalogCount,e.name);
 assert.ok(e.personScores.every(s=>Number.isFinite(s)&&s>=0&&s<=100),e.name);
}
for(let mask=1;mask<=selectionCount;mask++){
 const selected=D.people.filter((_,i)=>mask&(1<<i)),g=D.groups[mask];
 assert.deepEqual(g.members,D.people.flatMap((_,i)=>mask&(1<<i)?[i]:[]));
 g.values.forEach((v,j)=>assert.ok(Math.abs(v-F.median(selected.map(p=>p.values[j])))<1e-10));
 if(mask>catalogSelections){assert.equal(g.matches,null);continue;}
 for(const mode of ['shared','median'])for(const [category,rows] of Object.entries(g.matches[mode])){
  if(category==='dimensions')continue;
  assert.ok(Array.isArray(rows));
  for(const r of rows){
   assert.ok(D.entities[r.key],r.key);
   const e=D.entities[r.key],scores=g.members.map(i=>e.personScores[i]);
   assert.ok(Math.abs(r.floor-Math.min(...scores))<1e-8);
   assert.ok(Number.isFinite(r.synthetic)&&r.synthetic>=0&&r.synthetic<=100);
   checked++;
  }
 }
}
const html=fs.readFileSync('family-atlas.html','utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
for(const [,attrs,code] of scripts){if(attrs.includes('application/json'))JSON.parse(code);else new (require('vm').Script)(code);}
assert.equal(scripts.length,4);
const finalD=JSON.parse(scripts.find(s=>s[1].includes('embedded-data'))[2]);
assert.deepEqual(finalD,D);
const reportD=JSON.parse(scripts.find(s=>s[1].includes('pdf-data'))[2]);
let pdfImages=0;function checkImages(x){if(Array.isArray(x))x.forEach(checkImages);else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x)){if(['image','flag'].includes(k)){assert.ok(v.startsWith('data:image/'));pdfImages++;}else checkImages(v);}}checkImages(reportD);
const embedded=Object.values(D.entities).filter(e=>e.localAsset?.startsWith('data:image/')).length;
const reports=Object.values(P.people);
console.log(JSON.stringify({result:'passed',exactURLScores:count*12,selections:selectionCount,catalogSelections,catalogRowsChecked:checked,retainedCatalogEntities:Object.keys(D.entities).length,embeddedCatalogImages:embedded,embeddedPDFImageReferences:pdfImages,pdfPages:reports.reduce((n,p)=>n+Object.keys(p.source_text).length,0),pdfBooks:reports.reduce((n,p)=>n+p.books.length,0),pdfFigureRankings:reports.reduce((n,p)=>n+p.figures.ranking.length,0),pdfEraCards:reports.reduce((n,p)=>n+(p.timeline?.eras.length||0),0),allScriptsCompile:true},null,2));
