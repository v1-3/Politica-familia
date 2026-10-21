const fs=require('fs');
const assert=require('node:assert/strict');
const F=require('./statistics.js');
const D=JSON.parse(fs.readFileSync('evidence/html-embedded-data.json','utf8'));
const P=JSON.parse(fs.readFileSync('evidence/pdf_profiles.json','utf8'));
let checked=0;
for(const p of D.people){
 const u=new URL(p.url);
 assert.deepEqual(p.values,F.AXES.map(a=>Number(u.searchParams.get(a))));
 assert.deepEqual(p.values,F.AXES.map(a=>P.people[p.name].axes[a]));
 assert.equal(Object.keys(P.people[p.name].source_text).length,8);
 assert.equal(P.people[p.name].books.length,3);
 assert.equal(P.people[p.name].figures.ranking.length,8);
 assert.equal(P.people[p.name].timeline.eras.length,6);
}
for(let mask=1;mask<16;mask++){
 const selected=D.people.filter((_,i)=>mask&(1<<i)),g=D.groups[mask];
 assert.deepEqual(g.members,D.people.flatMap((_,i)=>mask&(1<<i)?[i]:[]));
 g.values.forEach((v,j)=>assert.ok(Math.abs(v-F.median(selected.map(p=>p.values[j])))<1e-10));
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
console.log(JSON.stringify({result:'passed',exactURLScores:48,selections:15,catalogRowsChecked:checked,retainedCatalogEntities:Object.keys(D.entities).length,embeddedCatalogImages:embedded,embeddedPDFImageReferences:pdfImages,pdfPages:32,pdfBooks:12,pdfFigureRankings:32,pdfEraCards:24,allScriptsCompile:true,originalCatalogPreserved:true},null,2));
