// Keep the important distinctions, without repeating full explanations on every card.
scoreLabel=function(){return S.mode==='shared'?rp('Minimum individual fit','Mínimo individual'):rp('Median-profile fit','Perfil mediano');};
const compactMatchCards=renderMatches;
renderMatches=function(){
 compactMatchCards();if(!S.mask)return;
 const filters=[...new Set(members().map(i=>new URL(D.people[i].url).searchParams.get('religion')).filter(Boolean))];
 const names={catholic:rp('Catholic','Católico'),protestant:rp('Protestant','Protestante'),orthodox:rp('Orthodox','Ortodoxo')};
 $('catalog-note').textContent=rp('Up to 24 matches per category','Até 24 correspondências por categoria')+(filters.length?' · '+rp('Filters: ','Filtros: ')+filters.map(f=>names[f]||f).join(' + '):'');
};
const compactReports=renderReports;
renderReports=function(){
 compactReports();if(!S.mask)return;
 $('report-note').textContent=rp('Original PDFs · historical scores','PDFs originais · pontuações históricas');
 document.querySelectorAll('#report-content .report-description,#report-content .report-summary').forEach(node=>{
  const details=document.createElement('details'),summary=document.createElement('summary');
  details.className='report-extra';summary.textContent=node.classList.contains('report-description')?rp('Description','Descrição'):rp('Summary','Resumo');
  node.before(details);details.append(summary,node);
 });
};
const compactAxisCards=renderAxes;
renderAxes=function(){
 compactAxisCards();
 const single=members().length===1;
 $('axes-caption').textContent=single?rp('Original scores','Pontuações originais'):rp('Group median · individual scores below','Mediana do grupo · pontuações individuais abaixo');
 document.querySelectorAll('.median-tag').forEach(node=>node.textContent=single?rp('Original score','Pontuação original'):rp('Group median','Mediana do grupo'));
};
UI_COPY['Median profile']=['Group median','Mediana do grupo'];
UI_COPY['Shared matches']=['Individual minimum','Mínimo individual'];
UI_COPY['Minimum for every person']=['Minimum fit (%)','Compatibilidade mínima (%)'];
UI_COPY['Minimum author fit for each person']=['Minimum author fit (%)','Compatibilidade mínima do autor (%)'];
UI_COPY['A geometry of your differences.']=['Your 12 axes','Seus 12 eixos'];
UI_COPY['Compatible with your combination.']=['Matches','Correspondências'];
UI_COPY['Read the ideas behind the matches.']=['Books','Livros'];
UI_COPY['The original results, side by side.']=['Original reports','Relatórios originais'];
UI_COPY['How far apart are your profiles?']=['Profile distances','Distâncias entre perfis'];
UI_COPY['Center = 0%, outer ring = 100% of each named pole. A larger shape does not mean a stronger or better ideology.']=['Center 0% · edge 100%','Centro 0% · borda 100%'];
UI_COPY['Closer points mean more similar test answers across all 12 axes. Horizontal and vertical directions have no political meaning.']=['Closer = more similar across all 12 axes','Mais perto = mais semelhante nos 12 eixos'];
