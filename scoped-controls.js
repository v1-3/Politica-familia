// Section selections are independent. The page-wide controls reset all of them.
const allMask=()=>(1<<D.people.length)-1;
// Some people were added from their PDFs and URLs without catalog scores; matches and books need those scores.
const hasCatalog=i=>D.people[i].catalogMatches!==false;
const catalogMask=()=>D.people.reduce((m,_,i)=>hasCatalog(i)?m|(1<<i):m,0);
const scopeAll=scope=>scope==='geometry'?allMask():catalogMask();
const sectionGroups=scope=>Object.entries(D.groups).filter(([,g])=>scope==='geometry'||g.matches);
S.sections={geometry:{mask:0},matches:{mask:0},books:{mask:0,mode:'median',threshold:0}};
const sectionTitles={geometry:'Geometry',matches:'Matches',books:'Books'};
function inSection(scope,fn){
 const saved={mask:S.mask,mode:S.mode,threshold:S.threshold};
 S.mask=S.sections[scope].mask;
 if(scope==='books'){S.mode=S.sections.books.mode;S.threshold=S.sections.books.threshold;}
 try{return fn();}finally{Object.assign(S,saved);}
}
function renderSectionSelector(scope){
 const mask=S.sections[scope].mask,host=$(scope==='matches'?'matches-selection-controls':scope+'-selection'),names=D.people.filter((_,i)=>mask&(1<<i)).map(p=>p.name);
 host.innerHTML=`<div class="section-selector-label"><strong>Include in ${scope==='geometry'?'these graphs':scope==='matches'?'these matches':'this reading list'}</strong><span class="section-scope-caption" aria-live="polite">${names.length?esc(names.join(' + ')):'No people selected'} · independent selection</span></div><div class="people-filter" role="group" aria-label="${sectionTitles[scope]} people">${D.people.map((p,i)=>`<button class="person-pill" data-scope="${scope}" data-scope-person="${i}" aria-pressed="${!!(mask&(1<<i))}" ${scope!=='geometry'&&!hasCatalog(i)?'disabled title="No catalog scores for this person. See the PDF reports section."':''} style="--color:${p.color}"><span class="person-check" aria-hidden="true">✓</span>${esc(p.name)}</button>`).join('')}</div><div class="scope-actions"><label class="sr-only" for="${scope}-combination">${sectionTitles[scope]} combination</label><select id="${scope}-combination" data-scope-combination="${scope}"><option value="0">No one selected</option>${sectionGroups(scope).sort((a,b)=>b[1].members.length-a[1].members.length||Number(a[0])-Number(b[0])).map(([key,g])=>`<option value="${key}" ${Number(key)===mask?'selected':''}>${Number(key)===scopeAll(scope)?'Everyone':g.members.map(i=>esc(D.people[i].name)).join(' + ')}</option>`).join('')}</select><button class="link-button" data-scope="${scope}" data-scope-all>Everyone</button><button class="link-button" data-scope="${scope}" data-scope-clear>Clear</button></div>${scope!=='geometry'&&catalogMask()!==allMask()?`<p class="note scope-limit"><strong>${esc(D.people.filter((_,i)=>!hasCatalog(i)).map(p=>p.name).join(' + '))}</strong> <span>${scope==='matches'?'No catalog scores yet, so left out of these matches.':'No catalog scores yet, so left out of this reading list.'}</span> <span>Their original PDF results are in the PDF reports section.</span></p>`:''}`;
 host.querySelector('select').value=String(mask);
}
const emptyScope=scope=>`<div class="no-results"><h3>Choose people for ${scope==='geometry'?'these graphs':scope==='matches'?'these matches':'this reading list'}.</h3><p>Select any individual, group or everyone using the buttons above.</p></div>`;
const originalGeometry=renderGeometry;
let geometryResizeTimer;
window.addEventListener('resize',()=>{clearTimeout(geometryResizeTimer);geometryResizeTimer=setTimeout(()=>renderGeometry(),120);});
renderGeometry=function(){renderSectionSelector('geometry');inSection('geometry',()=>{if(!S.mask){$('radar-chart').innerHTML=emptyScope('geometry');['radar-legend','distance-map','distance-matrix','map-quality'].forEach(id=>$(id).innerHTML='');return;}originalGeometry();});};
const originalHero=renderHero;
renderHero=function(){inSection('matches',originalHero);};
const originalMatches=renderMatches;
renderMatches=function(){renderSectionSelector('matches');inSection('matches',()=>{document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===S.mode)));$('threshold-value').textContent=pct(S.threshold,0);if(!S.mask){$('matches-selection').textContent='No people selected for these matches';$('match-grid').innerHTML=emptyScope('matches');['mode-explanation','category-tabs','catalog-note','profile-context','individual-results'].forEach(id=>$(id).innerHTML='');$('show-more').hidden=true;return;}originalMatches();});};
const originalBooks=renderBooks;
renderBooks=function(){renderSectionSelector('books');inSection('books',()=>{document.querySelectorAll('[data-book-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bookMode===S.mode)));$('book-threshold-value').textContent=pct(S.threshold,0);$('books-scope-note').textContent=S.mask?`${selectedNames()} · ${S.mode==='median'?'Authors ranked against the median of this combination.':'Authors ranked by their lowest fit among these people.'} Images are author portraits.`:'Choose at least one person above.';if(!S.mask){$('book-grid').innerHTML=emptyScope('books');return;}originalBooks();});};
selectionReason=function(){const n=members().length;return n===1?'One person selected. Their original scores are shown unchanged.':n===2?'With two people, the median is their average. It does not resist a single outlier.':n%2?`For each axis, take the middle of the ${n} selected scores.`:`For each axis, average the middle two of the ${n} selected scores.`;};
const originalSelection=renderSelection;
const compactCompass=renderCompass;
renderCompass=function(){compactCompass();$('median-explanation').textContent='';};
renderAxisDetail=function(){if(!S.mask)return;const j=S.axis,a=D.axes[j],s=stats(j);$('axis-detail').innerHTML=`<strong>${esc(a.label)}: ${pct(s.median,2)} ${esc(a.leftPole)} / ${pct(100-s.median,2)} ${esc(a.rightPole)}</strong>${sortedValues(j)}<p>Median ${fmt(s.median,2)} · Mean ${fmt(s.mean,2)} · Range ${fmt(s.range)} percentage points.</p>`;};
const compactMatches=renderMatches;
renderMatches=function(){compactMatches();if(S.sections.matches.mask)$('mode-explanation').textContent=S.mode==='shared'?'Ranked by the lowest compatibility among the selected people.':'Ranked against the selected group’s median profile.';};
renderSelection=function(){originalSelection();$('selected-content').hidden=false;['graph','axes','pairs','reports'].forEach(id=>$(id).hidden=!S.mask);$('empty-selection').hidden=!!(S.mask||Object.values(S.sections).some(x=>x.mask));$('selection-caption').textContent='Resets all section groups · compass, axes and PDFs follow this selection';};
renderAll=function(){renderSelection();renderGeometry();renderHero();renderMatches();renderBooks();if(S.mask){renderCompass();renderAxes();renderPairs();renderReports();}};
selectMask=function(mask){S.mask=mask;S.sections.geometry.mask=mask;S.sections.matches.mask=mask&catalogMask();S.sections.books.mask=mask&catalogMask();S.limit=6;S.pair=null;renderAll();};
function selectSectionMask(scope,mask){S.sections[scope].mask=mask;if(scope==='geometry')renderGeometry();if(scope==='matches'){S.limit=6;renderHero();renderMatches();}if(scope==='books')renderBooks();renderSelection();}
const originalAxes=renderAxes;
renderAxes=function(){
 originalAxes();
 document.querySelectorAll('#axes-plot .plot-row').forEach(row=>{
  const j=Number(row.querySelector('[data-axis]').dataset.axis),s=stats(j),field=row.querySelector('.plot-field'),medianMarker=field.querySelector('.plot-dot.median'),el=document.createElement('i');
  const nextRow=8+members().length*12;
  if(medianMarker)medianMarker.style.top=nextRow+'px';
  el.className='plot-mean';el.style.left=(100-s.mean)+'%';el.style.top=(nextRow+(medianMarker?12:0))+'px';el.title='Mean: '+pct(s.mean,2)+' '+D.axes[j].leftPole;
  field.style.height=Math.max(70,nextRow+(medianMarker?26:14))+'px';field.appendChild(el);
 });
};
function exportSelection(){
 const scopeData=Object.fromEntries(Object.entries(S.sections).map(([scope,state])=>[scope,inSection(scope,()=>({people:selectedProfiles().map(p=>({name:p.name,values:p.values,url:p.url})),mode:S.mode,minimum:S.threshold,statistics:F.summarizeProfiles(selectedProfiles()),matches:group()?.matches??null}))]));
 const payload={title:'12 Axes family comparison · current selections',sources:D.source,axes:D.axes,pageSelection:selectedProfiles().map(p=>({name:p.name,values:p.values,url:p.url})),sections:scopeData};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='family-selected-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const conciseAxes=renderAxes;
renderAxes=function(){conciseAxes();$('axes-caption').textContent=selectedNames();const note=$('axes-plot').querySelector(':scope > .note');if(note)note.textContent='Dots: people · diamond: median · ring: mean';const tableNote=$('axes-table').querySelector(':scope > .note');if(tableNote)tableNote.textContent='Scores: % of the named pole. Differences: percentage points.';};
init=function(){
 S.mask=allMask();S.sections.geometry.mask=S.mask;S.sections.matches.mask=S.sections.books.mask=catalogMask();
 $('combination').innerHTML='<option value="0">No one selected</option>'+Object.entries(D.groups).sort((a,b)=>b[1].members.length-a[1].members.length||Number(a[0])-Number(b[0])).map(([mask,g])=>`<option value="${mask}">${Number(mask)===allMask()?'Everyone':g.members.map(i=>esc(D.people[i].name)).join(' + ')}</option>`).join('');
 $('source-provenance').innerHTML=`Public catalog snapshot ${esc(D.source.date)}, commit ${ext(D.source.repository,D.source.commit.slice(0,8))}. ${Object.entries(D.source.catalogSizes).map(([k,v])=>v+' '+k).join(' · ')}. Median vectors are rounded to one decimal only for source compatibility matching; displayed medians and graph coordinates use full precision.`;
 $('source-links').innerHTML=D.people.map(p=>ext(p.url,p.name)).join('')+ext(D.source.repository,'Source catalog');
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-scope-person'))selectSectionMask(b.dataset.scope,S.sections[b.dataset.scope].mask^(1<<Number(b.dataset.scopePerson)));
  else if(b.hasAttribute('data-scope-all'))selectSectionMask(b.dataset.scope,scopeAll(b.dataset.scope));
  else if(b.hasAttribute('data-scope-clear'))selectSectionMask(b.dataset.scope,0);
  else if(b.hasAttribute('data-person'))selectMask(S.mask^(1<<Number(b.dataset.person)));
  else if(b.hasAttribute('data-mode')){S.mode=b.dataset.mode;S.limit=6;renderHero();renderMatches();}
  else if(b.hasAttribute('data-book-mode')){S.sections.books.mode=b.dataset.bookMode;renderBooks();}
  else if(b.hasAttribute('data-category')){S.category=b.dataset.category;S.limit=6;renderMatches();}
  else if(b.hasAttribute('data-view')){S.view=b.dataset.view;renderAxes();}
  else if(b.hasAttribute('data-axis')){S.axis=Number(b.dataset.axis);renderAxisDetail();$('axis-detail').scrollIntoView({behavior:'smooth',block:'nearest'});}
  else if(b.hasAttribute('data-pair')){S.pair=b.dataset.pair;renderPairs();}
  else if(b.hasAttribute('data-report')){S.reportTab=b.dataset.report;renderReports();}
 });
 document.addEventListener('change',e=>{if(e.target.hasAttribute('data-scope-combination'))selectSectionMask(e.target.dataset.scopeCombination,Number(e.target.value));});
 ['select-all','empty-all'].forEach(id=>$(id).addEventListener('click',()=>selectMask(allMask())));$('clear-all').addEventListener('click',()=>selectMask(0));
 $('combination').addEventListener('change',e=>selectMask(Number(e.target.value)));
 $('show-median').addEventListener('change',e=>{S.showMedian=e.target.checked;if(S.mask){renderCompass();renderAxes();}});
 $('sort-axes').addEventListener('change',e=>{S.sort=e.target.value;if(S.mask)renderAxes();});
 $('match-search').addEventListener('input',e=>{S.query=e.target.value;S.limit=6;renderMatches();});
 $('threshold').addEventListener('input',e=>{S.threshold=Number(e.target.value);S.limit=6;renderMatches();});
 $('book-threshold').addEventListener('input',e=>{S.sections.books.threshold=Number(e.target.value);renderBooks();});
 $('show-more').addEventListener('click',()=>{S.limit+=6;renderMatches();});
 $('radar-average').addEventListener('change',renderGeometry);$('map-edges').addEventListener('change',renderGeometry);
 $('export-selection').addEventListener('click',exportSelection);$('print').addEventListener('click',()=>window.print());
 document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){const box=e.target.parentElement;e.target.hidden=true;box.classList.add('image-missing');const f=box.querySelector('.image-fallback');if(f)f.hidden=false;}},true);
 renderAll();
};
