// Shared orthographic renderer. MDS uses fitted coordinates; the compass uses
// explicit 0–100 dimensions. Rotation never changes the underlying values.
const cubeView={owner:'map',host:'distance-map',mode:'3d',yaw:-1.94,pitch:1.2,zoom:1,minimum:2,embedding:null,people:[],drag:null};
const compassCube={owner:'compass',host:'compass-chart',mode:'3d',yaw:-.9,pitch:1,zoom:1,minimum:1,extent:50,axes:true,embedding:null,people:[],drag:null};
const cubeStates={map:cubeView,compass:compassCube};
const geometryWith2D=renderGeometry,compassWith2D=renderCompass;
function cubeRotate(point,state){
 const [x,y,z]=point,cy=Math.cos(state.yaw),sy=Math.sin(state.yaw),cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
 const xx=x*cy+z*sy,zz=-x*sy+z*cy;
 return [xx,y*cp-zz*sp,y*sp+zz*cp];
}
// The original eight-region economic/authority palette, smoothly interpolated.
// The custom social dimension adds a pink-to-ochre tint, not a new ideology taxonomy.
function cubeRegionColor([x,y,z]){
 const c=4*(x+1),r=4*(1-y),weights=spectrum.map(s=>Math.exp(-((c-s.c)**2+(r-s.r)**2)/(2*1.7**2))),total=weights.reduce((a,b)=>a+b,0),rgb=[0,0,0];
 spectrum.forEach((s,i)=>hsl(s.h??hue(s.color),s.s,Math.min(s.l,60)).forEach((v,j)=>rgb[j]+=v*weights[i]/total));
 const tint=z<0?[210,62,132]:[181,135,81],amount=Math.abs(z)*.24;
 return `rgb(${rgb.map((v,j)=>Math.round(v*(1-amount)+tint[j]*amount)).join(',')})`;
}
function cubeRegionFaces(state,project){
 const faces=[];
 for(let axis=0;axis<3;axis++)for(const side of [-1,1]){
  const normal=[0,0,0];normal[axis]=side;
  // Paint the rear walls so all markers remain visible inside the colored volume.
  if(cubeRotate(normal,state)[2]>0)continue;
  const other=[0,1,2].filter(j=>j!==axis),n=14;
  for(let u=0;u<n;u++)for(let v=0;v<n;v++){
   const point=(a,b)=>{const p=[0,0,0];p[axis]=side;p[other[0]]=-1+2*a/n;p[other[1]]=-1+2*b/n;return p;};
   const center=point(u+.5,v+.5),ps=[point(u,v),point(u+1,v),point(u+1,v+1),point(u,v+1)].map(project),color=cubeRegionColor(center);
   faces.push({depth:project(center).z,svg:`<polygon points="${ps.map(p=>`${p.x},${p.y}`).join(' ')}" fill="${color}" stroke="${color}" stroke-width=".5"/>`});
  }
 }
 return `<defs><filter id="compass-region-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="2"/></filter></defs><g class="cube-region" filter="url(#compass-region-soft)" aria-hidden="true">${faces.sort((a,b)=>a.depth-b.depth).map(f=>f.svg).join('')}</g>`;
}
function cubeAxisLabels(state,project,corners){
 const names=[[rp('Economic left','Esquerda econômica'),rp('Economic right','Direita econômica')],[rp('Libertarian','Libertário'),rp('Authoritarian','Autoritário')],[rp('Progressive','Progressista'),rp('Traditional','Tradicional')]];
 const labels=[];let lines='';
 for(let axis=0;axis<3;axis++){
  const ends=[-1,1].map(side=>{const p=[0,0,0];p[axis]=side;return project(p);});
  lines+=`<line x1="${ends[0].x}" y1="${ends[0].y}" x2="${ends[1].x}" y2="${ends[1].y}" stroke="${['#4389d1','#c47720','#a569d5'][axis]}" stroke-width="2"/>`;
  ends.forEach((p,i)=>{
   const dx=p.x-280,dy=p.y-240,len=Math.hypot(dx,dy)||1,ux=dx/len,uy=dy/len;
   const reach=Math.max(...corners.map(c=>(c.x-280)*ux+(c.y-240)*uy))+38;
   labels.push({p,text:names[axis][i],x:Math.max(105,Math.min(455,280+ux*reach)),y:Math.max(32,Math.min(438,240+uy*reach))});
  });
 }
 // Separate neighboring pole labels after projection, including near-edge views.
 labels.sort((a,b)=>a.y-b.y);
 for(let pass=0;pass<3;pass++)for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){
  const a=labels[i],b=labels[j];if(Math.abs(a.x-b.x)<165&&Math.abs(a.y-b.y)<46){a.y=Math.max(25,a.y-12);b.y=Math.min(450,b.y+12);}
 }
 return lines+labels.map(l=>{
  const words=l.text.split(/\s+/),split=words.length>1?Math.ceil(words.length/2):words.length,rows=[words.slice(0,split).join(' '),words.slice(split).join(' ')].filter(Boolean);
  return `<line class="cube-axis-leader" x1="${l.p.x}" y1="${l.p.y}" x2="${l.x}" y2="${l.y}"/><text class="cube-axis" x="${l.x}" y="${l.y}" text-anchor="middle">${rows.map((row,i)=>`<tspan x="${l.x}" dy="${i?28:0}">${esc(row)}</tspan>`).join('')}</text>`;
 }).join('');
}
function cubeDraw(state){
 const m=state.embedding,ps=state.people;if(!m||ps.length<state.minimum)return;
 const svg=$(state.host).querySelector('.cube-svg');if(!svg)return;
 const extent=state.extent||Math.max(...m.coordinates.flat().map(Math.abs),1e-8);
 const project=p=>{const q=cubeRotate(p,state);return {x:280+q[0]*116*state.zoom,y:240-q[1]*116*state.zoom,z:q[2]};};
 const corners=Array.from({length:8},(_,i)=>project([i&1?1:-1,i&2?1:-1,i&4?1:-1]));
 let content=state.axes?cubeRegionFaces(state,project):'';
 corners.forEach((p,i)=>[1,2,4].forEach(bit=>{if(!(i&bit)){const q=corners[i|bit];content+=`<line class="cube-edge" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"/>`;}}));
 if(state.axes)content+=cubeAxisLabels(state,project,corners);
 const points=m.coordinates.map((p,i)=>({...project(p.map(v=>v/extent)),i,p:ps[i]}));
 if(state.owner==='map'&&$('map-edges').checked)points.forEach((p,i)=>points.slice(i+1).forEach(q=>{content+=`<line class="cube-connection" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"><title>${esc(p.p.name)} – ${esc(q.p.name)}: ${fmt(m.distances[i][q.i],2)} ${rp('points RMS','pontos RMS')}</title></line>`;}));
 const compact=$(state.host).clientWidth<400,radius=compact?26:16;
 points.sort((a,b)=>a.z-b.z).forEach(p=>{
  const label=p.p.median?'':p.p.name.charAt(0).toLocaleUpperCase(),title=p.p.description||p.p.name;
  const marker=p.p.median?`<path d="M${p.x} ${p.y-12}l12 12-12 12-12-12z" fill="var(--forest)" stroke="var(--surface)" stroke-width="2"/>`:`<circle cx="${p.x}" cy="${p.y}" r="${radius}" fill="${p.p.color}" stroke="var(--surface)" stroke-width="2"/><text class="cube-number${compact?' cube-number-large':''}" x="${p.x}" y="${p.y+(compact?11:6)}" text-anchor="middle">${esc(label)}</text>`;
  content+=`<g data-cube-person="${esc(p.p.name)}"><title>${esc(title)}</title>${marker}</g>`;
 });
 svg.querySelector('.cube-scene').innerHTML=content;
}
function cubePose(action,state){
 if(action==='left')state.yaw-=.2;if(action==='right')state.yaw+=.2;
 if(action==='up')state.pitch-=.2;if(action==='down')state.pitch+=.2;
 if(action==='in')state.zoom=Math.min(2.5,state.zoom+.15);
 if(action==='out')state.zoom=Math.max(.65,state.zoom-.15);
 if(action==='reset')Object.assign(state,state.owner==='map'?{yaw:-1.94,pitch:1.2,zoom:1}:{yaw:-.9,pitch:1,zoom:1});
 cubeDraw(state);
}
function cubeControls(state){
 let host=$(state.owner+'-view-controls');
 if(!host){host=document.createElement('p');host.id=state.owner+'-view-controls';$(state.host).before(host);}
 host.className='cube-view-controls';host.hidden=state.people.length<state.minimum;
 host.innerHTML=`<span class="segments" role="group" aria-label="${rp('Graph dimensions','Dimensões do gráfico')}">${['2d','3d'].map(mode=>`<button type="button" data-cube-mode="${mode}" aria-pressed="${state.mode===mode}">${mode.toUpperCase()}</button>`).join('')}</span>${state.mode==='3d'?`<span class="note cube-hint">${rp('Drag to rotate · pinch or scroll to zoom · double-click to reset.','Arraste para girar · pince ou role para ampliar · clique duas vezes para redefinir.')}</span>`:''}`;
 host.onclick=e=>{const button=e.target.closest('[data-cube-mode]');if(!button)return;state.mode=button.dataset.cubeMode;state.owner==='map'?renderGeometry():renderCompass();};
}
function cubeMount(state,label){
 const host=$(state.host);host.hidden=false;
 host.innerHTML=`<svg class="cube-svg" viewBox="0 0 560 480" tabindex="0" role="group" aria-label="${esc(label)}"><title>${esc(label)}</title><g class="cube-scene"></g></svg><ul class="cube-legend">${state.people.map(p=>`<li><span style="--color:${p.color}" class="cube-swatch${p.median?' median-swatch':''}"></span>${esc(p.name)}</li>`).join('')}</ul>`;
 const svg=host.querySelector('svg');
 const pointers=new Map();let pinchDistance=null;
 const distance=()=>{const [a,b]=[...pointers.values()];return a&&b?Math.hypot(a.x-b.x,a.y-b.y):null;};
 svg.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;e.preventDefault();svg.setPointerCapture(e.pointerId);svg.focus({preventScroll:true});
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  state.drag=pointers.size===1?{id:e.pointerId,x:e.clientX,y:e.clientY}:null;pinchDistance=distance();
 });
 svg.addEventListener('selectstart',e=>e.preventDefault());
 svg.addEventListener('dblclick',()=>cubePose('reset',state));
 svg.addEventListener('wheel',e=>{
  e.preventDefault();const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?svg.clientHeight:1);
  state.zoom=Math.max(.65,Math.min(2.5,state.zoom*Math.exp(-Math.max(-240,Math.min(240,delta))*.0015)));cubeDraw(state);
 },{passive:false});
 svg.addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;
  pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pointers.size>1){const next=distance();if(pinchDistance>0&&next>0)state.zoom=Math.max(.65,Math.min(2.5,state.zoom*next/pinchDistance));pinchDistance=next;cubeDraw(state);return;}
  const d=state.drag;if(!d||d.id!==e.pointerId)return;
  state.yaw+=(e.clientX-d.x)*.009;state.pitch+=(e.clientY-d.y)*.009;d.x=e.clientX;d.y=e.clientY;cubeDraw(state);
 });
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>svg.addEventListener(type,e=>{
  pointers.delete(e.pointerId);pinchDistance=distance();
  const remaining=[...pointers.entries()][0];state.drag=pointers.size===1?{id:remaining[0],...remaining[1]}:null;
 }));
 svg.addEventListener('keydown',e=>{const action={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'}[e.key];if(action){e.preventDefault();cubePose(action,state);}});
 state.drag=null;cubeDraw(state);
}
renderGeometry=function(){
 geometryWith2D();cubeView.people=inSection('geometry',selectedProfiles);cubeControls(cubeView);
 if(cubeView.mode!=='3d'||cubeView.people.length<2){cubeView.embedding=null;return;}
 cubeView.embedding=F.classicalMDS(cubeView.people,3);
 cubeMount(cubeView,rp('Interactive 3D similarity map. Drag or use arrow keys to rotate. Exact distances are below.','Mapa interativo de semelhança em 3D. Arraste ou use as setas para girar. Distâncias exatas abaixo.'));
 const m=cubeView.embedding;
 $('map-quality').textContent=rp(`This 3D view retains ${fmt(m.explainedPercent,1)}% of the squared-distance variation. Exact distances are below.`,`Esta vista 3D preserva ${fmt(m.explainedPercent,1)}% da variação das distâncias ao quadrado. Distâncias exatas abaixo.`);
};
renderCompass=function(){
 compassWith2D();if(!S.mask)return;
 const ps=selectedProfiles().map(p=>({...p}));
 if(S.showMedian&&ps.length>1)ps.push({name:rp('Selected median','Mediana selecionada'),values:group().values,color:'var(--forest)',median:true});
 compassCube.people=ps;cubeControls(compassCube);
 $('compass-legend').hidden=compassCube.mode==='3d';$('spectrum-legend').hidden=compassCube.mode==='3d';
 let note=$('compass-third-axis');if(!note){note=document.createElement('div');note.id='compass-third-axis';$('compass-chart').after(note);}
 note.hidden=compassCube.mode!=='3d';
 if(compassCube.mode!=='3d'){compassCube.embedding=null;return;}
 const coords=ps.map(p=>F.compassCoordinates(p));
 const axisNames=[rp('Economic right','Direita econômica'),rp('Authority','Autoridade'),rp('Traditionalism','Tradicionalismo')];
 ps.forEach((p,i)=>{const q=coords[i];p.description=`${p.name} · ${axisNames[0]}: ${fmt(q.right,2)} · ${axisNames[1]}: ${fmt(q.authority,2)} · ${axisNames[2]}: ${fmt(q.traditional,2)}`;});
 compassCube.embedding={coordinates:coords.map(q=>[q.right-50,q.authority-50,q.traditional-50])};
 cubeMount(compassCube,rp('Interactive 3D political compass. X: economic right. Y: authority. Depth: progressive to traditional. Drag or use arrow keys to rotate.','Bússola política interativa em 3D. X: direita econômica. Y: autoridade. Profundidade: progressista a tradicional. Arraste ou use as setas para girar.'));
 note.innerHTML=`<ul class="cube-region-key">${spectrum.map(s=>`<li><i style="--color:${cubeRegionColor([s.c/4-1,1-s.r/4,0])}"></i>${esc(uiText(s.name))}</li>`).join('')}</ul><div class="cube-tint-key" aria-hidden="true"></div><div class="cube-tint-labels"><span>${rp('Progressive','Progressista')}</span><span>${rp('Traditional','Tradicional')}</span></div><p class="note">${rp('Colors blend the original compass regions. Depth uses traditionalism: 100 minus the progressive score.','As cores combinam as regiões da bússola original. A profundidade usa o tradicionalismo: 100 menos a pontuação progressista.')}</p>`;
 $('compass-table').innerHTML=`<table><caption class="note">${rp('Exact coordinates · 0–100 scale','Coordenadas exatas · escala de 0 a 100')}</caption><thead><tr><th>${rp('Person','Pessoa')}</th>${axisNames.map(n=>`<th class="num">${n}</th>`).join('')}</tr></thead><tbody>${ps.map((p,i)=>{const q=coords[i];return `<tr${p.median?' class="median-row"':''}><th scope="row">${esc(p.name)}</th>${[q.right,q.authority,q.traditional].map(v=>`<td class="num">${fmt(v,2)}</td>`).join('')}</tr>`;}).join('')}</tbody></table>`;
 $('compass-table').tabIndex=0;
};
let compassResizeTimer;window.addEventListener('resize',()=>{clearTimeout(compassResizeTimer);compassResizeTimer=setTimeout(()=>{if(D&&S.mask)renderCompass();},120);});
