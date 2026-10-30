// Localized catalog metadata is keyed by stable IDs; rankings never depend on UI language.
function localizeCatalog(){
 for(const e of Object.values(D.entities))for(const field of ['name','role','description','period']){
  const value=e.i18n?.[uiLanguage]?.[field]??e.i18n?.en?.[field];if(value!=null)e[field]=value;
 }
 for(const e of Object.values(D.entities))e.displayCategory=e.i18n?.[uiLanguage]?.category||e.category;
 for(const g of Object.values(D.groups))for(const mode of ['shared','median'])for(const b of g.matches[mode].books)b.title=b.titles?.[uiLanguage]||b.titles?.en||b.title;
}
const catalogInit=init;
init=function(){localizeCatalog();catalogInit();document.getElementById('main').inert=false;const loading=document.getElementById('loading-status');if(loading)loading.remove();};
document.getElementById('language-toggle').addEventListener('click',()=>{if(D){localizeCatalog();renderAll();translateInterface();}});
scoreLabel=function(){return S.mode==='shared'?rp('Lowest fit among selected people','Menor compatibilidade entre as pessoas selecionadas'):rp("Fit to the group's median profile",'Compatibilidade com o perfil mediano do grupo');};
const catalogCard=card;
card=function(row,rank){
 const e=D.entities[row.key],html=catalogCard(row,rank);
 return e.description?html.replace('<div class="card-footer">',`<details class="catalog-description"><summary>${rp('About this profile','Sobre este perfil')}</summary><p>${esc(e.description)}</p></details><div class="card-footer">`):html;
};
renderContext=function(){
 const g=group(),dims=g.matches[S.mode].dimensions;
 const areaNames={Political:rp('Political figures','Personalidades políticas'),Social:rp('Social thinkers and activists','Pensadores e ativistas sociais'),Economic:rp('Economic figures','Personalidades da economia')};
 const labels=indices=>indices.map(j=>uiText(D.axes[j].label)).join(rp(' and ',' e '));
 const typical=g.typicalAxes||[g.typical],unusual=g.unusualAxes||[g.unusual];
 const t=g.tension;
 $('profile-context').innerHTML=`<div class="context-panel"><h3>${rp('Matches by area','Correspondências por área')}</h3><div class="dimension-grid">${Object.entries(dims).map(([name,rows])=>`<div class="dimension-column"><h4>${areaNames[name]}</h4><p class="note">${rp('Personalities: all 12 axes.','Personalidades: os 12 eixos.')} ${name==='Political'?rp('Countries and parties: all 12 axes.','Países e partidos: os 12 eixos.'):name==='Social'?rp('Countries and parties: 9 social axes.','Países e partidos: 9 eixos sociais.'):rp('Countries and parties: economy, control and trade.','Países e partidos: economia, controle e comércio.')}</p>${rows.map(r=>{const e=D.entities[r.key];return `<div class="dimension-entry">${visual(e)}<div><strong>${esc(e.name)}</strong><small>${e.kind==='personalities'?rp('Personality','Personalidade'):e.kind==='countries'?rp('Country / state','País / Estado'):rp('Party','Partido')}</small></div><b>${pct(r.score)}</b></div>`;}).join('')}</div>`).join('')}</div><div class="context-notes"><p><strong>${rp('Furthest from the catalog median:','Mais distante da mediana do catálogo:')}</strong> ${esc(labels(unusual))}${unusual.length>1?rp(' (tie)',' (empate)'):''}. <strong>${rp('Closest:','Mais próximo:')}</strong> ${esc(labels(typical))}${typical.length>1?rp(' (tie)',' (empate)'):''}.</p><p>${t?`${rp('Rare axis combination:','Combinação rara de eixos:')} ${esc(t.poles.map(uiText).join(' + '))}. ${t.count} / ${t.total} ${rp('catalog ideologies.','ideologias do catálogo.')}`:rp('No rare axis combination identified.','Nenhuma combinação rara de eixos identificada.')}</p></div></div>`;
};
const catalogMatches=renderMatches;
renderMatches=function(){catalogMatches();inSection('matches',()=>{
 if(!S.mask)return;
 const filters=[...new Set(members().map(i=>new URL(D.people[i].url).searchParams.get('religion')).filter(Boolean))];
 const names={catholic:rp('Catholic','Católico'),protestant:rp('Protestant','Protestante'),orthodox:rp('Orthodox','Ortodoxo')};
 if(filters.length)$('catalog-note').textContent+=' '+rp('Recommendation filters: ','Filtros de recomendações: ')+filters.map(x=>names[x]||x).join(' + ')+'.';
});};
const catalogBooks=renderBooks;
renderBooks=function(){catalogBooks();inSection('books',()=>{
 if(members().length!==1)return;
 const p=D.people[members()[0]];
 $('book-grid').insertAdjacentHTML('beforeend',`<details class="original-book-list"><summary>${rp('Original-test selection: 3 books','Seleção do teste original: 3 livros')}</summary><p>${rp('Current catalog; author scores. Separate from the expanded list and historical PDF.','Catálogo atual; pontuações dos autores. Separada da lista ampliada e do PDF histórico.')}</p>${p.matches.books.map(b=>`<p><strong>${esc(b.titles?.[uiLanguage]||b.title)}</strong> — ${esc(D.entities['personalities/'+b.authorId]?.name||b.author)} · ${pct(b.score)}</p>`).join('')}</details>`);
});};
