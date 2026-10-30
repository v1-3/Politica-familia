// One person selection drives every section; matching methods remain independent.
const allMask=()=>(1<<D.people.length)-1;
S.sections={geometry:{mask:0},matches:{mask:0},books:{mask:0,mode:'median',threshold:0}};
function inSection(scope,fn){
 const saved={mask:S.mask,mode:S.mode,threshold:S.threshold};
 if(scope==='books'){S.mode=S.sections.books.mode;S.threshold=S.sections.books.threshold;}
 try{return fn();}finally{Object.assign(S,saved);}
}
const emptyScope=scope=>`<div class="no-results"><h3>Choose people for ${scope==='geometry'?'these graphs':scope==='matches'?'these matches':'this reading list'}.</h3><p>Select people in the floating bar.</p></div>`;
const originalGeometry=renderGeometry;
let geometryResizeTimer;
window.addEventListener('resize',()=>{clearTimeout(geometryResizeTimer);geometryResizeTimer=setTimeout(()=>renderGeometry(),120);});
renderGeometry=function(){inSection('geometry',()=>{if(!S.mask){$('radar-chart').innerHTML=emptyScope('geometry');['radar-legend','distance-map','distance-matrix','map-quality'].forEach(id=>$(id).innerHTML='');return;}originalGeometry();});};
const originalHero=renderHero;
renderHero=function(){inSection('matches',originalHero);};
const originalMatches=renderMatches;
renderMatches=function(){inSection('matches',()=>{document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===S.mode)));$('threshold-value').textContent=pct(S.threshold,0);if(!S.mask){$('matches-selection').textContent='No people selected for these matches';$('match-grid').innerHTML=emptyScope('matches');['mode-explanation','category-tabs','catalog-note','profile-context','individual-results'].forEach(id=>$(id).innerHTML='');$('show-more').hidden=true;return;}originalMatches();});};
const originalBooks=renderBooks;
renderBooks=function(){inSection('books',()=>{document.querySelectorAll('[data-book-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.bookMode===S.mode)));$('book-threshold-value').textContent=pct(S.threshold,0);$('books-scope-note').textContent=S.mask?`${selectedNames()} · ${S.mode==='median'?'Authors ranked against the median of this combination.':'Authors ranked by their lowest fit among these people.'} Images are author portraits.`:'Choose at least one person above.';if(!S.mask){$('book-grid').innerHTML=emptyScope('books');return;}originalBooks();});};
selectionReason=function(){const n=members().length;return n===1?'One person selected. Their original scores are shown unchanged.':n===2?'With two people, the median is their average. It does not resist a single outlier.':n%2?`For each axis, take the middle of the ${n} selected scores.`:`For each axis, average the middle two of the ${n} selected scores.`;};
const compactCompass=renderCompass;
renderCompass=function(){compactCompass();$('median-explanation').textContent='';};
renderAxisDetail=function(){};
const compactMatches=renderMatches;
renderMatches=function(){compactMatches();if(S.sections.matches.mask)$('mode-explanation').textContent=S.mode==='shared'?'Ranked by the lowest compatibility among the selected people.':'Ranked against the selected group’s median profile.';};
renderSelection=function(){
 const host=$('people-filter');
 if(!host.children.length)host.innerHTML=D.people.map((p,i)=>`<button type="button" class="person-pill" data-person="${i}" aria-pressed="false" style="--color:${p.color}"><span class="person-check" aria-hidden="true">✓</span>${esc(p.name)}</button>`).join('');
 host.querySelectorAll('[data-person]').forEach(b=>b.setAttribute('aria-pressed',String(!!(S.mask&(1<<Number(b.dataset.person))))));
 host.setAttribute('aria-label',rp('People included throughout the page','Pessoas incluídas em toda a página'));
 $('selected-content').hidden=!S.mask;['graph','axes','reports'].forEach(id=>$(id).hidden=!S.mask);$('empty-selection').hidden=!!S.mask;
 $('show-median').disabled=members().length<2;
};
renderAll=function(){renderSelection();renderGeometry();renderHero();renderMatches();renderBooks();if(S.mask){renderCompass();renderAxes();renderReports();}};
selectMask=function(mask){
 const oldScroll=window.scrollY,barBottom=document.querySelector('.selection-shell').getBoundingClientRect().bottom;
 const anchor=[...document.querySelectorAll('section[id]')].filter(node=>!node.hidden&&node.getBoundingClientRect().top<=barBottom+24).pop();
 const offset=anchor?.getBoundingClientRect().top;
 S.mask=mask;Object.values(S.sections).forEach(section=>section.mask=mask);S.limit=6;S.pair=null;renderAll();
 requestAnimationFrame(()=>window.scrollTo({top:anchor&&!anchor.hidden?window.scrollY+anchor.getBoundingClientRect().top-offset:oldScroll,behavior:'instant'}));
};
function exportSelection(){
 const scopeData=Object.fromEntries(Object.entries(S.sections).map(([scope,state])=>[scope,inSection(scope,()=>({people:selectedProfiles().map(p=>({name:p.name,values:p.values,url:p.url})),mode:S.mode,minimum:S.threshold,statistics:F.summarizeProfiles(selectedProfiles()),matches:group()?.matches??null}))]));
 const payload={title:'12 Axes family comparison · current selections',sources:D.source,axes:D.axes,pageSelection:selectedProfiles().map(p=>({name:p.name,values:p.values,url:p.url})),sections:scopeData};
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='family-selected-comparison.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
const conciseAxes=renderAxes;
renderAxes=function(){conciseAxes();$('axes-caption').textContent=selectedNames();};
init=function(){
 S.mask=allMask();Object.values(S.sections).forEach(section=>section.mask=S.mask);S.view='bars';
 $('source-provenance').innerHTML=`Public catalog snapshot ${esc(D.source.date)}, commit ${ext(D.source.repository,D.source.commit.slice(0,8))}. ${Object.entries(D.source.catalogSizes).map(([k,v])=>v+' '+k).join(' · ')}. Median vectors are rounded to one decimal only for source compatibility matching; displayed medians and graph coordinates use full precision.`;
 $('source-links').innerHTML=D.people.map(p=>ext(p.url,p.name)).join('')+ext(D.source.repository,'Source catalog');
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-person'))selectMask(S.mask^(1<<Number(b.dataset.person)));
  else if(b.hasAttribute('data-mode')){S.mode=b.dataset.mode;S.limit=6;renderHero();renderMatches();}
  else if(b.hasAttribute('data-book-mode')){S.sections.books.mode=b.dataset.bookMode;renderBooks();}
  else if(b.hasAttribute('data-category')){S.category=b.dataset.category;S.limit=6;renderMatches();}
  else if(b.hasAttribute('data-report')){S.reportTab=b.dataset.report;renderReports();}
 });
 $('show-median').addEventListener('change',e=>{S.showMedian=e.target.checked;if(S.mask){renderCompass();renderAxes();}});
 $('sort-axes').addEventListener('change',e=>{S.sort=e.target.value;if(S.mask)renderAxes();});
 $('match-search').addEventListener('input',e=>{S.query=e.target.value;S.limit=6;renderMatches();});
 $('threshold').addEventListener('input',e=>{S.threshold=Math.max(0,Math.min(100,Number(e.target.value)||0));e.target.value=S.threshold;S.limit=6;renderMatches();});
 $('book-threshold').addEventListener('input',e=>{S.sections.books.threshold=Math.max(0,Math.min(100,Number(e.target.value)||0));e.target.value=S.sections.books.threshold;renderBooks();});
 $('show-more').addEventListener('click',()=>{S.limit+=6;renderMatches();});
 $('radar-average').addEventListener('change',renderGeometry);$('map-edges').addEventListener('change',renderGeometry);
 $('export-selection').addEventListener('click',exportSelection);$('print').addEventListener('click',()=>window.print());
 document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){const box=e.target.parentElement;e.target.hidden=true;box.classList.add('image-missing');const f=box.querySelector('.image-fallback');if(f)f.hidden=false;}},true);
 renderAll();
};
