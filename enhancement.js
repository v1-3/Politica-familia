// Extensions retain the supplied page's complete catalog and its source provenance.
const PDF = JSON.parse(document.getElementById('pdf-data').textContent);
const F = FamilyStats;
S.reportTab = 'overview';
const selectedProfiles = () => members().map(i => D.people[i]);
const robustAxes = () => D.axes.map((a,j) => ({...F.axisStats(selectedProfiles().map(p=>p.values[j])), axis:a, j}));
const reportCats = [['overview','Overview'],['countries','Countries'],['figures','Figures & leaders'],['books','Original books'],['parties','Parties'],['timeline','Timeline'],['ideologies','Ideologies'],['source','Full report text']];

function renderGeometry(){
 if(!S.mask)return;
 const ps=selectedProfiles(), summaries=robustAxes(), averages=$('radar-average').checked&&ps.length>1;
 const cx=360,cy=260,r=175,at=(j,v,extra=0)=>{const t=-Math.PI/2+j*Math.PI/6;return[cx+Math.cos(t)*(r*v/100+extra),cy+Math.sin(t)*(r*v/100+extra)];};
 const polygon=values=>values.map((v,j)=>at(j,v).map(x=>x.toFixed(2)).join(',')).join(' ');
 const compact=$('radar-chart').clientWidth<560;
 let svg=`<svg viewBox="${compact?'145 45 430 430':'0 0 720 535'}" role="img" aria-labelledby="radar-title radar-desc"><title id="radar-title">Twelve-axis comparison for ${esc(selectedNames())}</title><desc id="radar-desc">Each spoke measures the named pole from zero at the center to one hundred at the edge. Individual profiles are colored; the median is dark green and the mean is dashed brown.</desc>`;
 [25,50,75,100].forEach(v=>{svg+=`<polygon points="${polygon(Array(12).fill(v))}" fill="${v===100?'#f4f3eb':'none'}" stroke="#deddd1" stroke-width="1"/>`;});
 // Draw rings in descending order so the outer fill cannot cover the inner rings.
 const sectorColors=['#528de0','#d88b38','#28a185','#ad78d4'];
 D.axes.forEach((_,j)=>{const a=at(j,100),b=at((j+1)%12,100);svg+=`<polygon points="${cx},${cy} ${a.join(',')} ${b.join(',')}" fill="${sectorColors[Math.floor(j/3)]}" fill-opacity=".14" stroke="none"/>`;});
 [25,50,75].forEach(v=>{svg+=`<polygon points="${polygon(Array(12).fill(v))}" fill="none" stroke="#deddd1"/>`;});
 const labels=['Federal','Democratic','Security-focused','Assimilationist','Militarist','Non-interventionist','Public economy','Planned economy','Protectionist','Irreligious','Progressive','Pro-technology'];
 D.axes.forEach((a,j)=>{const p=at(j,100),l=at(j,100,compact?22:35),anchor=compact?'middle':Math.abs(l[0]-cx)<8?'middle':l[0]>cx?'start':'end';svg+=`<line x1="${cx}" y1="${cy}" x2="${p[0]}" y2="${p[1]}" stroke="#deddd1"/><text class="radar-axis-label" x="${l[0]}" y="${l[1]+4}" text-anchor="${anchor}" fill="#203c2e" font-size="${compact?19:16}" font-weight="600">${compact?j+1:esc(labels[j])}</text>`;});
 [0,25,50,75,100].forEach(v=>svg+=`<text x="${cx+6}" y="${cy-r*v/100-4}" font-size="12" fill="#77776b">${v}</text>`);
 ps.forEach(p=>{svg+=`<polygon points="${polygon(p.values)}" fill="${p.color}" fill-opacity=".04" stroke="${p.color}" stroke-width="2.3"><title>${esc(p.name)}</title></polygon>`;p.values.forEach((v,j)=>{const q=at(j,v);svg+=`<circle cx="${q[0]}" cy="${q[1]}" r="3.3" fill="${p.color}"><title>${esc(p.name)} · ${esc(D.axes[j].leftPole)}: ${pct(v)}</title></circle>`;});});
 if(averages)svg+=`<polygon points="${polygon(summaries.map(s=>s.mean))}" fill="none" stroke="#9d531c" stroke-dasharray="7 5" stroke-width="2.4"/><polygon points="${polygon(summaries.map(s=>s.median))}" fill="none" stroke="#102e24" stroke-width="3.2"/>`;
 $('radar-chart').innerHTML=svg+'</svg>'+(compact?'<ol class="radar-axis-key">'+labels.map(label=>`<li>${esc(label)}</li>`).join('')+'</ol>':'');
 $('radar-legend').innerHTML=members().map(i=>`<span>${dot(i)}${esc(D.people[i].name)}</span>`).join('')+(averages?'<span><i class="line-swatch" style="color:#102e24"></i>Median</span><span><i class="line-swatch dashed" style="color:#9d531c"></i>Mean</span>':'');
 const m=F.classicalMDS(ps), xs=m.coordinates.map(p=>p[0]), ys=m.coordinates.map(p=>p[1]);
 const dx=Math.max(...xs)-Math.min(...xs),dy=Math.max(...ys)-Math.min(...ys),scale=Math.min(dx?440/dx:Infinity,dy?235/dy:Infinity);
 const k=Number.isFinite(scale)?scale:1,midX=(Math.max(...xs)+Math.min(...xs))/2,midY=(Math.max(...ys)+Math.min(...ys))/2;
 const points=m.coordinates.map((p,i)=>({x:320+(p[0]-midX)*k,y:210-(p[1]-midY)*k,p:ps[i]}));
 const mapCompact=$('distance-map').clientWidth<560;
 let map=`<svg viewBox="0 0 640 430" role="img" aria-labelledby="map-title map-desc"><title id="map-title">Geometric distance map for ${esc(selectedNames())}</title><desc id="map-desc">Two-dimensional projection of root-mean-square score differences. Distances and projection quality appear below.</desc><defs><pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse"><circle cx="15" cy="15" r="1" fill="#d7dbd0"/></pattern></defs><rect x="25" y="25" width="590" height="380" rx="20" fill="url(#map-grid)"/>`;
 if($('map-edges').checked)points.forEach((p,i)=>points.slice(i+1).forEach((q,h)=>map+=`<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke="#a2b19d" stroke-width="1.5"><title>${esc(p.p.name)} – ${esc(q.p.name)}: ${fmt(m.distances[i][i+h+1],2)} points RMS</title></line>`));
 const used=[];
 points.forEach((q,i)=>{const width=q.p.name.length*(mapCompact?14:10)+22,height=mapCompact?43:33,candidates=[[20,-50],[20,18],[-width-20,-50],[-width-20,18],[-width/2,-64],[-width/2,24]];let best=null;
 candidates.forEach(([a,b],rank)=>{const rect={x:q.x+a,y:q.y+b,w:width,h:height};let cost=rank;
 if(rect.x<26||rect.x+width>614||rect.y<25||rect.y+height>405)cost+=10000;
 const intersect=(r,t)=>Math.max(0,Math.min(r.x+r.w,t.x+t.w)-Math.max(r.x,t.x))*Math.max(0,Math.min(r.y+r.h,t.y+t.h)-Math.max(r.y,t.y));
 used.forEach(r=>cost+=intersect(r,rect)*10);points.forEach(p=>cost+=intersect(rect,{x:p.x-12,y:p.y-12,w:24,h:24})*10);
 if(!best||cost<best.cost)best={...rect,cost};});used.push(best);
 map+=`<g><circle cx="${q.x}" cy="${q.y}" r="17" fill="${q.p.color}" stroke="#fbf9f3" stroke-width="3"/><text x="${q.x}" y="${q.y+5}" text-anchor="middle" fill="white" font-size="15" font-weight="700">${i+1}</text><rect x="${best.x}" y="${best.y}" width="${width}" height="${height}" rx="6" fill="#fbf9f3" stroke="${q.p.color}" stroke-opacity=".3"/><text x="${best.x+width/2}" y="${best.y+23}" text-anchor="middle" font-size="17" fill="${q.p.color}" font-weight="600">${esc(q.p.name)}</text></g>`;
 });
 if($('distance-map').clientWidth<560&&ps.length>1){
  const left=Math.min(...points.map(p=>p.x-20),...used.map(b=>b.x))-28,right=Math.max(...points.map(p=>p.x+20),...used.map(b=>b.x+b.w))+28;
  const top=Math.min(...points.map(p=>p.y-20),...used.map(b=>b.y))-28,bottom=Math.max(...points.map(p=>p.y+20),...used.map(b=>b.y+b.h))+28;
  map=map.replace('viewBox="0 0 640 430"',`viewBox="${left} ${top} ${right-left} ${bottom-top}"`);
 }
 if(mapCompact)map=map.replaceAll('font-size="17"','font-size="24"');
 $('distance-map').innerHTML=map+'</svg>';
 $('distance-map').hidden=ps.length<2;
 $('map-quality').textContent=ps.length===1?'One profile selected. Add another person to create a distance.':`This 2D view retains ${fmt(m.explainedPercent,1)}% of the squared-distance variation. ${ps.length<4?'All selected distances fit in two dimensions.':'Some separation is compressed; the exact table is authoritative.'}`;
 $('distance-matrix').innerHTML=ps.length<2?'':`<table><caption class="note">Exact RMS distance · percentage points · lower means closer</caption><thead><tr><th>Person</th>${ps.map((p,i)=>`<th class="num" title="${esc(p.name)}">${i+1}</th>`).join('')}</tr></thead><tbody>${ps.map((p,i)=>`<tr><th>${i+1}. ${esc(p.name)}</th>${m.distances[i].map((v,j)=>`<td class="num distance-cell" style="background:rgba(16,46,36,${i===j?0:(1-v/100)*.14})">${i===j?'—':fmt(v,2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}

let pdfThumb=(e,kind='portrait')=>e.image?`<img class="report-thumb ${kind==='flag'?'flag':''}" loading="lazy" decoding="async" src="${esc(e.image)}" alt="${esc(e.author||e.name||'Source report image')}${kind==='portrait'?' · source portrait':''}">`:'';
function pdfItem(e,options={}){
 const title=e.title||e.name||'',score=e.author_match??e.match,meta=[e.category,e.subtitle,e.dates,e.period,e.year,e.author].filter(Boolean).join(' · ');
 return `<article class="report-item"><div class="report-item-head">${pdfThumb(e,options.kind||'portrait')}<div><h5>${e.rank?String(e.rank).padStart(2,'0')+'. ':''}${esc(title)}</h5>${score!=null?`<div class="match-number">${pct(score)} ${e.author_match!=null?'author fit':'catalog fit'}</div>`:''}${e.dimension?`<div class="small-label">${esc(e.dimension)}</div>`:''}</div></div>${meta?`<p class="subtle">${esc(meta)}</p>`:''}${e.description?`<details><summary>Source description</summary><p>${esc(e.description)}</p></details>`:''}${e.url?`<p>${ext(e.url,'Book details')}</p>`:''}${options.page!==false?`<div class="source-page">PDF · page ${e.source_page||options.sourcePage||''}</div>`:''}</article>`;
}
function reportBody(p){
 if(S.reportTab==='overview')return `<div class="small-label">Original top ideology</div><h4>${esc(p.ideology.name)} · ${pct(p.ideology.match)}</h4><p class="compact-description">${esc(p.ideology.group)}</p><details class="compact-description"><summary>Source description</summary><p>${esc(p.ideology.description)}</p></details><h4>Closest country</h4>${pdfItem(p.countries.featured[0],{kind:'flag'})}<h4>Closest figure</h4>${pdfItem(p.figures.featured)}<h4>Closest era</h4><p class="compact-description">${esc(p.timeline.closest_era)} · ${pct(p.timeline.match)}</p><h4>Compass classification in PDF</h4><p class="compact-description">${esc(p.compass.classification)}</p><details class="compact-description"><summary>Generated summary & distinctive axes</summary><p class="small-label">Source-generated statement, page 1</p><blockquote class="report-quote">${esc(p.report_sentence)}</blockquote><p>${esc(p.distinctiveness.text)}</p></details>`;
 if(S.reportTab==='countries'||S.reportTab==='parties'){const v=p[S.reportTab];return v.featured.map(e=>`<h4>${esc(e.kind==='present'?'Present-day country':e.kind==='active'?'Active party':e.kind==='historical'?'Historical match':e.kind)}</h4>${pdfItem(e,{kind:'flag'})}`).join('')+'<h4>By dimension</h4>'+v.dimensions.map(e=>pdfItem(e,{kind:'flag'})).join('')+`<h4>Furthest in the report</h4><p class="compact-description">${v.furthest.map(esc).join(' · ')}</p>`;}
 if(S.reportTab==='figures')return p.figures.ranking.map(e=>pdfItem(e)).join('')+'<h4>By dimension</h4>'+p.figures.dimensions.map(e=>pdfItem(e)).join('')+`<h4>Furthest in the report</h4><p class="compact-description">${p.figures.furthest.map(esc).join(' · ')}</p>`;
 if(S.reportTab==='books')return p.books.map(e=>pdfItem(e)).join('');
 if(S.reportTab==='timeline')return `<p class="compact-description">Closest era: <strong>${esc(p.timeline.closest_era)}</strong> · ${pct(p.timeline.match)}</p>`+p.timeline.eras.map(e=>`<div class="report-era"><h4>${esc(e.name)}</h4><p class="subtle">${esc(e.period)}</p>${e.entities.map(x=>pdfItem(x,{page:false})).join('')}</div>`).join('')+'<p class="source-page">PDF · page 7. Era matches are the report’s catalog grouping, not a historical forecast.</p>';
 if(S.reportTab==='ideologies')return `<h4>Top match</h4>${pdfItem({...p.ideology})}<h4>Other close ideologies</h4>${p.other_ideologies.close.map(e=>pdfItem(e)).join('')}<h4>Furthest ideology</h4>${pdfItem(p.other_ideologies.furthest)}`;
 return Object.entries(p.source_text).map(([page,text])=>`<details><summary>Page ${esc(page)}</summary><div class="original-text">${esc(text)}</div></details>`).join('');
}
function renderReports(){
 if(!S.mask)return;
 $('report-tabs').innerHTML=reportCats.map(([id,label])=>`<button data-report="${id}" aria-pressed="${S.reportTab===id}">${label}</button>`).join('');
 $('report-note').textContent=S.reportTab==='books'?'Original three books per selected person. Scores refer to the author; the images are author portraits. The group reading list above uses the selected matching method.':S.reportTab==='source'?'Full extracted text from all eight pages of each selected report. Expand any page to inspect the source wording.':'These are the supplied reports’ original matches and rounded percentages. Group matches above come from the HTML’s preserved catalog snapshot and can differ. Similarity is a test result, not an endorsement or a definitive personal label.';
 $('report-content').innerHTML=`<div class="report-columns" style="--columns:${members().length}">${members().map(i=>{const p=D.people[i],r=PDF.people[p.name];return `<article class="report-person" style="--person-color:${p.color}"><h3>${dot(i)}${esc(p.name)}</h3><p class="profile-meta">${esc(p.name)}.pdf · October 17, 2026<br>${ext(p.url,'Original online result')}</p>${reportBody(r)}</article>`;}).join('')}</div>`;
}

