(async()=>{try{const sources={"embedded-data": "assets/1ea2a2482ac105ff3b3c.json", "pdf-data": "assets/76779e11a182e6f22af0.json"};await Promise.all(Object.entries(sources).map(async([id,url])=>{const r=await fetch(url);if(!r.ok)throw new Error('Data request failed');document.getElementById(id).textContent=await r.text();}));/* FamilyStats — equal-weight comparisons for twelve 0–100 questionnaire axes.
 * Plain JavaScript: window.FamilyStats in a browser; require('./statistics.js') in Node.
 * No profile is automatically omitted or described as an outlier.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FamilyStats = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var AXES = Object.freeze(['est', 'rep', 'pod', 'imi', 'dip', 'int', 'eco', 'con', 'com', 'rel', 'mor', 'tec']);

  function finiteValues(values) {
    if (!Array.isArray(values)) throw new TypeError('Expected an array of finite numbers.');
    values.forEach(function (value) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new TypeError('All values must be finite numbers; missing values are not silently discarded.');
      }
    });
    return values;
  }

  function mean(values) {
    finiteValues(values);
    return values.length ? values.reduce(function (sum, value) { return sum + value; }, 0) / values.length : null;
  }

  // R / NumPy default: linear interpolation between sorted observations, h=(n-1)p.
  function quantile(values, probability) {
    finiteValues(values);
    if (typeof probability !== 'number' || !Number.isFinite(probability) || probability < 0 || probability > 1) {
      throw new RangeError('Quantile probability must be between 0 and 1.');
    }
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var position = (sorted.length - 1) * probability;
    var lower = Math.floor(position);
    var upper = Math.ceil(position);
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
  }

  function median(values) { return quantile(values, 0.5); }

  function axisStats(values) {
    finiteValues(values);
    var n = values.length;
    if (!n) {
      return {
        n: 0, mean: null, median: null, q1: null, q3: null, iqr: null,
        mad: null, min: null, max: null, spread: null,
        leaveOneOutMedianMaxShift: null, leaveOneOutMedians: []
      };
    }
    var center = median(values);
    var q1 = quantile(values, 0.25);
    var q3 = quantile(values, 0.75);
    var low = Math.min.apply(null, values);
    var high = Math.max.apply(null, values);
    var omissions = n > 1 ? values.map(function (_, omitted) {
      return median(values.filter(function (__, index) { return index !== omitted; }));
    }) : [];
    return {
      n: n,
      mean: mean(values),
      median: center,
      q1: q1,
      q3: q3,
      iqr: q3 - q1,
      // Raw median absolute deviation, not the 1.4826 normal-consistency scaling.
      mad: median(values.map(function (value) { return Math.abs(value - center); })),
      min: low,
      max: high,
      spread: high - low,
      leaveOneOutMedianMaxShift: omissions.length ? Math.max.apply(null, omissions.map(function (value) { return Math.abs(value - center); })) : null,
      leaveOneOutMedians: omissions
    };
  }

  function scoresOf(profile) {
    var candidate = Array.isArray(profile) ? profile : profile && (profile.scores || profile.values || profile);
    var scores = Array.isArray(candidate) ? candidate.slice() : candidate && AXES.map(function (axis) { return candidate[axis]; });
    if (!Array.isArray(scores) || scores.length !== AXES.length) throw new RangeError('Each profile must contain exactly twelve axis scores.');
    finiteValues(scores);
    scores.forEach(function (value) {
      if (value < 0 || value > 100) throw new RangeError('Axis scores must be between 0 and 100.');
    });
    return scores;
  }

  function validateProfiles(profiles) {
    if (!Array.isArray(profiles)) throw new TypeError('Expected an array of profiles.');
    return profiles.map(scoresOf);
  }

  function profileId(profile, index) {
    return profile && !Array.isArray(profile) && (profile.id != null ? profile.id : profile.name != null ? profile.name : String(index)) || String(index);
  }

  function meanAbsoluteDistance(a, b) {
    var left = scoresOf(a);
    var right = scoresOf(b);
    return left.reduce(function (sum, value, index) { return sum + Math.abs(value - right[index]); }, 0) / AXES.length;
  }

  function rmsDistance(a, b) {
    var left = scoresOf(a);
    var right = scoresOf(b);
    return Math.sqrt(left.reduce(function (sum, value, index) { return sum + Math.pow(value - right[index], 2); }, 0) / AXES.length);
  }

  function matrix(n, value) {
    return Array.from({ length: n }, function () { return Array(n).fill(value); });
  }

  function pairwise(profiles) {
    var scores = validateProfiles(profiles);
    var n = scores.length;
    var absolute = matrix(n, 0);
    var rms = matrix(n, 0);
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var absoluteSum = 0;
        var squareSum = 0;
        for (var k = 0; k < AXES.length; k++) {
          var delta = scores[i][k] - scores[j][k];
          absoluteSum += Math.abs(delta);
          squareSum += delta * delta;
        }
        absolute[i][j] = absolute[j][i] = absoluteSum / AXES.length;
        rms[i][j] = rms[j][i] = Math.sqrt(squareSum / AXES.length);
      }
    }
    return { n: n, ids: profiles.map(profileId), meanAbsolute: absolute, rms: rms };
  }

  function medoid(profiles) {
    var comparisons = pairwise(profiles);
    if (!profiles.length) return null;
    var sums = comparisons.meanAbsolute.map(function (row) { return row.reduce(function (sum, value) { return sum + value; }, 0); });
    var minimum = Math.min.apply(null, sums);
    var tied = sums.map(function (sum, index) { return Math.abs(sum - minimum) <= 1e-10 ? index : -1; }).filter(function (index) { return index >= 0; });
    var index = tied[0];
    return {
      index: index,
      id: comparisons.ids[index],
      profile: profiles[index],
      sumDistance: sums[index],
      averageDistance: profiles.length > 1 ? sums[index] / (profiles.length - 1) : 0,
      tiedIndices: tied,
      tiedIds: tied.map(function (i) { return comparisons.ids[i]; }),
      sums: sums
    };
  }

  function summarizeProfiles(profiles) {
    var scores = validateProfiles(profiles);
    var axes = {};
    AXES.forEach(function (axis, index) {
      axes[axis] = axisStats(scores.map(function (profile) { return profile[index]; }));
    });
    return { n: profiles.length, axes: axes };
  }

  // Jacobi rotations for the small real symmetric Gram matrix.
  function eigenSymmetric(input) {
    var n = input.length;
    var a = input.map(function (row) { return row.slice(); });
    var vectors = matrix(n, 0);
    for (var i = 0; i < n; i++) vectors[i][i] = 1;
    var scale = Math.max(1, ...a.flat().map(Math.abs));
    var tolerance = 1e-12 * scale;
    var limit = Math.max(1, 100 * n * n);
    for (var iteration = 0; iteration < limit; iteration++) {
      var p = 0;
      var q = 0;
      var largest = 0;
      for (i = 0; i < n; i++) {
        for (var j = i + 1; j < n; j++) {
          if (Math.abs(a[i][j]) > largest) { largest = Math.abs(a[i][j]); p = i; q = j; }
        }
      }
      if (largest <= tolerance) break;
      var offDiagonal = a[p][q];
      var tau = (a[q][q] - a[p][p]) / (2 * offDiagonal);
      var t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
      var c = 1 / Math.sqrt(1 + t * t);
      var s = t * c;
      a[p][p] -= t * offDiagonal;
      a[q][q] += t * offDiagonal;
      a[p][q] = a[q][p] = 0;
      for (var k = 0; k < n; k++) {
        if (k !== p && k !== q) {
          var kp = a[k][p];
          var kq = a[k][q];
          a[k][p] = a[p][k] = c * kp - s * kq;
          a[k][q] = a[q][k] = s * kp + c * kq;
        }
        var vp = vectors[k][p];
        var vq = vectors[k][q];
        vectors[k][p] = c * vp - s * vq;
        vectors[k][q] = s * vp + c * vq;
      }
    }
    return Array.from({ length: n }, function (_, index) {
      var vector = vectors.map(function (row) { return row[index]; });
      // Stable signs; axes remain arbitrary and may rotate when the selection changes.
      var anchor = vector.reduce(function (best, value, at) { return Math.abs(value) > Math.abs(vector[best]) ? at : best; }, 0);
      if (vector[anchor] < 0) vector = vector.map(function (value) { return -value; });
      return { value: Math.abs(a[index][index]) < tolerance ? 0 : a[index][index], vector: vector };
    }).sort(function (left, right) { return right.value - left.value; });
  }

  function mdsFromDistances(distances, dimensions) {
    dimensions = dimensions === undefined ? 2 : dimensions;
    if (!Number.isInteger(dimensions) || dimensions < 1 || dimensions > 12) throw new RangeError('Dimensions must be an integer between 1 and 12.');
    if (!Array.isArray(distances)) throw new TypeError('Expected a square distance matrix.');
    var n = distances.length;
    distances.forEach(function (row, i) {
      finiteValues(row);
      if (row.length !== n) throw new RangeError('Distance matrix must be square.');
      row.forEach(function (distance, j) {
        if (distance < 0) throw new RangeError('Distances must be nonnegative.');
        if (i === j && distance !== 0) throw new RangeError('Distance matrix diagonal must be zero.');
      });
    });
    distances.forEach(function (row, i) {
      row.forEach(function (distance, j) {
        if (Math.abs(distance - distances[j][i]) > 1e-10) throw new RangeError('Distance matrix must be symmetric.');
      });
    });
    var squared = distances.map(function (row) { return row.map(function (distance) { return distance * distance; }); });
    var rowMeans = squared.map(mean);
    var grandMean = mean(rowMeans) || 0;
    var gram = squared.map(function (row, i) {
      return row.map(function (value, j) { return -0.5 * (value - rowMeans[i] - rowMeans[j] + grandMean); });
    });
    var eigens = eigenSymmetric(gram);
    var positive = eigens.map(function (eigen) { return Math.max(0, eigen.value); });
    var totalVariance = positive.reduce(function (sum, value) { return sum + value; }, 0);
    var retainedVariance = positive.slice(0, dimensions).reduce(function (sum, value) { return sum + value; }, 0);
    var coordinates = Array.from({ length: n }, function (_, index) {
      return Array.from({length: dimensions}, function (_, dimension) {
        return eigens[dimension] ? eigens[dimension].vector[index] * Math.sqrt(positive[dimension]) : 0;
      });
    });
    var projectedDistances = matrix(n, 0);
    var residualSum = 0;
    var originalSum = 0;
    for (var i = 0; i < n; i++) {
      for (var j = i + 1; j < n; j++) {
        var projected = Math.hypot.apply(Math, coordinates[i].map(function (value, d) { return value - coordinates[j][d]; }));
        projectedDistances[i][j] = projectedDistances[j][i] = projected;
        residualSum += Math.pow(distances[i][j] - projected, 2);
        originalSum += Math.pow(distances[i][j], 2);
      }
    }
    return {
      n: n,
      dimensions: dimensions,
      coordinates: coordinates,
      distances: distances.map(function (row) { return row.slice(); }),
      projectedDistances: projectedDistances,
      eigenvalues: eigens.map(function (eigen) { return eigen.value; }),
      totalVariance: totalVariance,
      retainedVariance: retainedVariance,
      explainedPercent: totalVariance > 0 ? Math.max(0, Math.min(100, 100 * retainedVariance / totalVariance)) : n ? 100 : 0,
      stress: originalSum > 0 ? Math.sqrt(residualSum / originalSum) : 0,
      degenerate: totalVariance === 0,
      negativeEigenvalueMagnitude: eigens.reduce(function (sum, eigen) { return sum + Math.max(0, -eigen.value); }, 0)
    };
  }

  function compassCoordinates(profile) {
    var values = scoresOf(profile);
    return {
      right: .6 * (100 - values[6]) + .4 * (100 - values[7]),
      authority: (values[2] + 100 - values[1] + 100 - values[0]) / 3,
      traditional: 100 - values[10]
    };
  }

  function classicalMDS(profiles, dimensions) {
    var comparisons = pairwise(profiles);
    var embedding = mdsFromDistances(comparisons.rms, dimensions);
    embedding.ids = comparisons.ids;
    embedding.meanAbsoluteDistances = comparisons.meanAbsolute;
    return embedding;
  }

  return Object.freeze({
    AXES: AXES,
    mean: mean,
    median: median,
    quantile: quantile,
    axisStats: axisStats,
    scoresOf: scoresOf,
    summarizeProfiles: summarizeProfiles,
    meanAbsoluteDistance: meanAbsoluteDistance,
    rmsDistance: rmsDistance,
    pairwise: pairwise,
    medoid: medoid,
    mdsFromDistances: mdsFromDistances,
    classicalMDS: classicalMDS,
    compassCoordinates: compassCoordinates
  });
}));

'use strict';
let D;
const S={mask:15,mode:'median',category:'countries',view:'bars',sort:'original',showMedian:true,limit:6,threshold:0,query:'',axis:0,pair:null};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(v,d=1)=>Number(v).toLocaleString('en-US',{maximumFractionDigits:d});
const pct=(v,d=1)=>fmt(v,d)+'%';
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const median=a=>{const b=[...a].sort((x,y)=>x-y),m=Math.floor(b.length/2);return b.length%2?b[m]:(b[m-1]+b[m])/2;};
const group=()=>D.groups[String(S.mask)];
const members=()=>group()?.members??[];
const selectedNames=()=>members().map(i=>D.people[i].name).join(' + ');
const projection=v=>({right:.6*(100-v[6])+.4*(100-v[7]),authority:(v[2]+100-v[1]+100-v[0])/3,traditional:100-v[10]});
const dot=i=>`<i class="dot" style="--color:${D.people[i].color}" aria-hidden="true"></i>`;
const ext=(url,label)=>`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const fields={politico:'Politics',intelectual:'Intellectuals',empresario:'Business',filosofo:'Philosophy',ativista:'Activism',teorico:'Theory',economista:'Economics',religioso:'Religion'};
const categories=[['countries','Countries'],['leaders','Leaders'],['ideologies','Ideologies'],['personalities','All personalities'],['fields','By field'],['parties','Parties'],['historical','Historical states'],['historicalParties','Historical parties'],['distant','Distant matches']];
const spectrum=[
 {name:'Radical Left',color:'#830214',bg:'#ECD5D8',s:85,l:74,c:1,r:1},
 {name:'Left',color:'#035732',bg:'#D5ECE2',s:65,l:72,c:1,r:4.5},
 {name:'Center',color:'#4B5058',bg:'#DDE0E3',s:10,l:80,c:4,r:4.5},
 {name:'Right',color:'#2D4778',bg:'#D6E0F2',s:90,l:77,c:7,r:4.5},
 {name:'Far-Right',color:'#001743',bg:'#D5DAE6',s:85,l:66,c:7,r:1},
 {name:'Third Position',color:'#4B2A63',bg:'#E2D5EC',s:65,l:78,c:4,r:1},
 {name:'Libertarian',color:'#946201',bg:'#F0E4C8',h:47,s:90,l:68,c:6.5,r:7.5},
 {name:'Anarchist',color:'#2B2B2B',bg:'#E2DFD8',s:0,l:76,c:1.5,r:7.5}
];
function hue(hex){let [r,g,b]=hex.match(/\w\w/g).map(x=>parseInt(x,16)/255);const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d)return 0;return ((mx===r?(g-b)/d+(g<b?6:0):mx===g?(b-r)/d+2:(r-g)/d+4)*60)%360;}
function hsl(h,s,l){s/=100;l/=100;const a=s*Math.min(l,1-l),f=n=>{const k=(n+h/30)%12;return Math.round(255*(l-a*Math.max(-1,Math.min(k-3,9-k,1))));};return[f(0),f(8),f(4)];}
function cellColor(c,r){const weights=spectrum.map(s=>Math.exp(-((c-s.c)**2+(r-s.r)**2)/(2*1.7**2))),total=weights.reduce((a,b)=>a+b,0);const rgb=[0,0,0];spectrum.forEach((s,i)=>hsl(s.h??hue(s.color),s.s,s.l).forEach((v,j)=>rgb[j]+=v*weights[i]/total));return`rgb(${rgb.map(Math.round).join(',')})`;}
function visual(e,eager=false){
 if(e.kind==='ideologies'){const sp=spectrum.find(s=>s.name===e.category)||spectrum[2];return`<div class="visual ideology-art" style="--art-color:${sp.color};--art-bg:${sp.bg}"><svg viewBox="0 0 80 80" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="40" cy="40" r="30"/><path d="M40 4v72M4 40h72M18 18l44 44M18 62l44-44"/><path d="M40 16l12 24-12 24-12-24z" fill="currentColor" fill-opacity=".2"/></svg><span>${esc(e.category)}</span></div>`;}
 const initials=e.name.split(/\s+/).filter(Boolean).map(v=>v[0]).slice(0,2).join('');
 return`<div class="visual ${esc(e.assetKind)}${e.localAsset?'':' image-missing'}">${e.localAsset?`<img src="${esc(e.localAsset)}" alt="${esc(e.assetKind==='flag'?e.name+' flag':e.assetKind==='logo'?e.name+' logo':e.name)}" loading="${eager?'eager':'lazy'}" decoding="async">`:''}<span class="image-fallback" ${e.localAsset?'hidden':''}>${esc(initials)}</span></div>`;
}
function rowScore(r){return S.mode==='shared'?r.floor:r.synthetic;}
function scoreLabel(){return S.mode==='shared'?(members().length===1?'individual fit':'minimum fit for everyone'):'fit to the median profile';}
function personScores(e){const low=Math.min(...members().map(i=>e.personScores[i]));return`<div class="person-scores">${members().map(i=>`<div class="person-score ${e.personScores[i]===low?'lowest':''}"><span>${dot(i)}${esc(D.people[i].name)}</span><strong>${pct(e.personScores[i])}</strong></div>`).join('')}</div>`;}
function stats(j){const v=members().map(i=>D.people[i].values[j]),m=median(v);return{values:v,median:m,mean:mean(v),mad:median(v.map(x=>Math.abs(x-m))),min:Math.min(...v),max:Math.max(...v),range:Math.max(...v)-Math.min(...v)};}
function selectionReason(){return members().length===4?'For each axis, average the middle two of the four scores.':members().length===3?'For each axis, take the middle of the three selected scores.':members().length===2?'With two people, the median is their average. It does not resist a single outlier.':'One person selected. Their original scores are shown unchanged.';}
function renderSelection(){}
function renderHero(){
 if(!S.mask){$('hero-result').innerHTML='<div class="hero-top"><p class="eyebrow">YOUR COMPARISON</p><h3>Choose your people.</h3><p class="muted">Select one person, a pair, a trio or the whole family.</p></div>';return;}
 const r=group().matches[S.mode],top=r.ideologies[0],e=D.entities[top.key],sp=spectrum.find(s=>s.name===e.category)||spectrum[2];
 $('hero-result').innerHTML=`<div class="hero-top"><p class="eyebrow">${S.mode==='shared'?'TOP SHARED CATALOG MATCH':'TOP MEDIAN-PROFILE CATALOG MATCH'}</p><div class="hero-match"><div class="score-ring" style="--score:${rowScore(top)};--ring:${sp.color}"><span>${fmt(rowScore(top))}<small>%</small></span></div><div><h3 style="color:${sp.color}">${esc(e.name)}</h3><p>${esc(scoreLabel())}</p></div></div></div><div class="hero-images">${[['countries','Country'],['leaders','Leader']].map(([k,label])=>{const x=r[k][0],en=D.entities[x.key];return`<div class="hero-image-item">${visual(en,true)}<div><small>${label} · ${pct(rowScore(x))}</small><strong>${esc(en.name)}</strong></div></div>`;}).join('')}</div><div class="hero-bottom">${esc(selectedNames())} · ${S.mode==='shared'?'lowest individual score':'synthetic median profile'}</div>`;
}
function labelBoxes(points){const used=[];return points.map(p=>{const w=p.name.length*7+19,h=25;const candidates=[[14,-35],[14,12],[-w-14,-35],[-w-14,12],[-w/2,-52],[-w/2,26],[24,-12],[-w-24,-12]];let best;
 candidates.forEach(([dx,dy],n)=>{const b={x:p.x+dx,y:p.y+dy,w,h},overlap=(a,c)=>Math.max(0,Math.min(a.x+a.w,c.x+c.w)-Math.max(a.x,c.x))*Math.max(0,Math.min(a.y+a.h,c.y+c.h)-Math.max(a.y,c.y));let cost=n*.1;
 if(b.x<70||b.x+w>530||b.y<70||b.y+h>530)cost+=10000;
 used.forEach(a=>cost+=overlap(a,b)*3);points.forEach(q=>cost+=overlap(b,{x:q.x-10,y:q.y-10,w:20,h:20})*5);
 if(!best||cost<best.cost)best={...b,cost};});used.push(best);return best;});}
function renderCompass(){
 const g=group(),pts=members().map(i=>({id:String(i),name:D.people[i].name,color:D.people[i].color,...projection(D.people[i].values)}));
 if(S.showMedian&&members().length>1)pts.push({id:'median',name:'Median',color:'#102e24',...projection(g.values)});
 pts.forEach(p=>{p.x=70+p.right*4.6;p.y=70+(100-p.authority)*4.6;});
 const labels=labelBoxes(pts);let cells='';for(let r=0;r<9;r++)for(let c=0;c<9;c++)cells+=`<rect x="${70+c*460/9}" y="${70+r*460/9}" width="${460/9+.2}" height="${460/9+.2}" fill="${cellColor(c,r)}"/>`;
 const regions=[['Radical left',145,124],['Third position',300,124],['Far-right',455,124],['Left',145,353],['Center',300,353],['Right',455,353],['Anarchist',175,477],['Libertarian',425,477]].map(([t,x,y])=>`<text x="${x}" y="${y}" text-anchor="middle" font-size="12" fill="#222" opacity=".55">${t}</text>`).join('');
 const ticks=[0,25,50,75,100].map(n=>`<text x="${70+n*4.6}" y="553" text-anchor="middle" font-size="10" fill="#5b5a55">${n}</text><text x="53" y="${74+(100-n)*4.6}" text-anchor="end" font-size="10" fill="#5b5a55">${n}</text>`).join('');
 const pointSVG=pts.map((p,i)=>{const b=labels[i],lx=Math.max(b.x,Math.min(p.x,b.x+b.w)),ly=Math.max(b.y,Math.min(p.y,b.y+b.h));return`<g data-compass-person="${p.id}" data-right="${p.right}" data-authority="${p.authority}"><title>${esc(p.name)}: economic right ${pct(p.right,2)}, authority ${pct(p.authority,2)}</title><path d="M${p.x} ${p.y}L${lx} ${ly}" stroke="${p.color}" stroke-width="1.2"/>${p.id==='median'?`<path data-marker="median" d="M${p.x} ${p.y-8}l8 8-8 8-8-8z" fill="${p.color}" stroke="#fbf9f3" stroke-width="2.5"/>`:`<circle data-marker="person" cx="${p.x}" cy="${p.y}" r="7" fill="${p.color}" stroke="#fbf9f3" stroke-width="2.5"/>`}<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="5" fill="#fbf9f3" fill-opacity=".96" stroke="${p.color}" stroke-opacity=".25"/><text x="${b.x+b.w/2}" y="${b.y+17}" text-anchor="middle" font-size="12" font-weight="600" fill="${p.color}">${esc(p.name)}</text></g>`;}).join('');
 $('compass-chart').innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 620" role="img" aria-labelledby="compass-title compass-desc" style="font-family:Arial,sans-serif"><title id="compass-title">Political compass for ${esc(selectedNames())}</title><desc id="compass-desc">Economic right increases from left to right. Authority increases from bottom to top. Points use the original formulas. Exact scores appear in the adjacent table.</desc><defs><clipPath id="compass-clip"><rect x="70" y="70" width="460" height="460" rx="14"/></clipPath></defs><text x="300" y="31" text-anchor="middle" fill="#102e24" font-size="15" font-weight="600">Authoritarian</text><text x="300" y="49" text-anchor="middle" fill="#5b5a55" font-size="10">Authority ↑</text><g clip-path="url(#compass-clip)">${cells}${regions}<path d="M300 70v460M70 300h460" stroke="#ffffff" stroke-opacity=".7" stroke-width="1.5"/></g><rect x="70" y="70" width="460" height="460" rx="14" fill="none" stroke="#102e2420"/>${ticks}<text x="70" y="578" text-anchor="start" fill="#102e24" font-size="14" font-weight="600">Left</text><text x="530" y="578" text-anchor="end" fill="#102e24" font-size="14" font-weight="600">Right</text><text x="300" y="578" text-anchor="middle" fill="#5b5a55" font-size="10">Economic right →</text><text x="300" y="607" text-anchor="middle" fill="#102e24" font-size="15" font-weight="600">Libertarian</text>${pointSVG}</svg>`;
 $('compass-legend').innerHTML=members().map(i=>`<span>${dot(i)}${esc(D.people[i].name)}</span>`).join('')+(S.showMedian&&members().length>1?'<span><i class="diamond"></i>Selected median</span>':'');
 $('group-title').textContent=members().length===D.people.length?'The whole family':selectedNames();$('median-explanation').textContent=selectionReason();
 const rows=members().map(i=>({name:D.people[i].name,i,values:D.people[i].values}));if(S.showMedian&&members().length>1)rows.push({name:'Median',i:-1,values:g.values});
 $('compass-table').innerHTML=`<table><thead><tr><th>Profile</th><th class="num">Economic right</th><th class="num">Authority</th><th class="num">Traditionalist</th></tr></thead><tbody>${rows.map(p=>{const q=projection(p.values);return`<tr class="${p.i===-1?'median-row':''}"><td>${p.i>=0?dot(p.i):'<i class="diamond"></i>'}${esc(p.name)}</td><td class="num">${pct(q.right,2)}</td><td class="num">${pct(q.authority,2)}</td><td class="num">${pct(q.traditional,2)}</td></tr>`;}).join('')}</tbody></table>`;
 $('social-chart').innerHTML='<div class="social-track" aria-hidden="true"></div>'+rows.map(p=>{const q=projection(p.values);return`<div class="social-row"><span>${esc(p.name)}</span><div class="social-line"><i class="social-marker ${p.i<0?'median':''}" style="left:${q.traditional}%;--color:${p.i<0?'#102e24':D.people[p.i].color}"></i></div><strong>${pct(q.traditional,2)}</strong></div>`;}).join('');
 $('spectrum-legend').innerHTML=spectrum.map(s=>`<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('');
 const ss=D.axes.map((_,j)=>({...stats(j),j})),low=[...ss].sort((a,b)=>a.range-b.range)[0],high=[...ss].sort((a,b)=>b.range-a.range)[0],pairs=pairData();
 $('insights').innerHTML=members().length===1?`<div class="insight"><small>ONE PROFILE SELECTED</small><h3>${esc(selectedNames())}</h3><p>Select another person to compare differences.</p></div>`:`<div class="insight"><small>CLOSEST AXIS</small><h3>${esc(D.axes[low.j].label)}</h3><p>${fmt(low.range)} percentage point range among the selected people.</p></div><div class="insight"><small>WIDEST DIFFERENCE</small><h3>${esc(D.axes[high.j].label)}</h3><p>${fmt(high.range)} percentage points. Every individual stays visible.</p></div><div class="insight"><small>CLOSEST PAIR</small><h3>${esc(pairs[0].names)}</h3><p>${fmt(pairs[0].gap,2)} percentage points apart on average.</p></div>`;
}
function sortedValues(j,values=members().map(i=>({name:D.people[i].name,value:D.people[i].values[j]}))){const list=[...values].sort((a,b)=>a.value-b.value),n=list.length;return`<div class="sorted-values">${list.map((x,i)=>`<span class="sorted-value ${i===Math.floor(n/2)||(!(n%2)&&i===n/2-1)?'middle':''}">${esc(x.name)} ${fmt(x.value,2)}</span>`).join('')}</div>`;}
function renderAxisDetail(){if(!S.mask)return;const j=S.axis,a=D.axes[j],s=stats(j);$('axis-detail').innerHTML=`<strong>${esc(a.label)}: ${pct(s.median,2)} ${esc(a.leftPole)} / ${pct(100-s.median,2)} ${esc(a.rightPole)}</strong><p>${esc(selectionReason())} Highlighted values determine the median. Individual values below measure ${esc(a.leftPole)}.</p>${sortedValues(j)}<p>Median ${fmt(s.median,2)} · Mean ${fmt(s.mean,2)} · MAD ${fmt(s.mad,2)} · Range ${fmt(s.range)} percentage points.</p>`;}
function renderAxes(){
 const order=D.axes.map((_,i)=>i);if(S.sort!=='original')order.sort((a,b)=>(S.sort==='largest'?-1:1)*(stats(a).range-stats(b).range));
 $('axes-caption').textContent=`${selectedNames()}. The main bars show ${members().length===1?'the original profile':'the selected median'}; each person’s score stays visible.`;
 $('axes-bars').innerHTML=order.map(j=>{const a=D.axes[j],s=stats(j),m=s.median;return`<article class="axis-card"><div class="axis-heading"><strong>${esc(a.label)}</strong><span class="axis-number">${String(j+1).padStart(2,'0')}</span></div><div class="pole-titles"><span>${esc(a.leftPole)}</span><span>${esc(a.rightPole)}</span></div><div class="axis-percentages"><span class="axis-value" style="color:${a.leftColor}">${fmt(m,2)}<small>%</small></span><span class="median-tag">${members().length===1?'Original':'Selected'}<br>${members().length===1?'score':'median'}</span><span class="axis-value" style="color:${a.rightColor}">${fmt(100-m,2)}<small>%</small></span></div><div class="diverging" role="img" aria-label="${pct(m,2)} ${esc(a.leftPole)}, ${pct(100-m,2)} ${esc(a.rightPole)}"><i style="left:${m>=50?100-m:50}%;width:${Math.abs(m-50)}%;background:${m>=50?a.leftColor:a.rightColor}"></i></div>${members().map(i=>`<div class="mini-person"><span>${dot(i)}${esc(D.people[i].name)}</span><div class="mini-track" title="${esc(D.people[i].name)}: ${pct(D.people[i].values[j])} ${esc(a.leftPole)}"><i style="left:${100-D.people[i].values[j]}%;--color:${D.people[i].color}"></i></div><strong>${pct(D.people[i].values[j])}</strong></div>`).join('')}<div class="axis-meta"><span>Values = ${esc(a.leftPole)} %</span><span>Range ${fmt(s.range)}</span></div></article>`;}).join('');
 $('axes-bars').hidden=false;renderAxisDetail();
}
function card(r,rank){const e=D.entities[r.key],type=e.kind==='personalities'?(fields[e.category]||'Personality'):e.kind==='ideologies'?e.category:e.kind==='countries'?(e.historical?'Historical state':'Country / territory'):(e.historical?'Historical party':'Political party');const subtitle=e.role||e.displayCategory||e.category;return`<article class="match-card" data-match="${esc(r.key)}"><div class="card-image">${visual(e)}<span class="card-rank">${S.category==='fields'?esc(fields[e.category]||'Field'):S.category==='distant'?'LOW COMPATIBILITY':'MATCH '+String(rank).padStart(2,'0')}</span></div><div class="card-body"><div class="card-category">${esc(type)}</div><h3 class="card-title">${esc(e.name)}</h3><p class="card-subtitle">${esc(subtitle===type?'':subtitle)}${e.period?' · '+esc(e.period):''}${e.lifespan?' · '+esc(e.lifespan):''}</p><div class="card-score"><strong>${pct(rowScore(r))}</strong><span>${esc(scoreLabel())}</span></div>${personScores(e)}<div class="card-footer"><span>Lowest individual: ${pct(r.floor)}</span>${ext(e.reference||e.source,'Source')}</div></div></article>`;}
function renderMatches(){
 if(!S.mask)return;
 $('matches-selection').textContent=selectedNames();
 document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===S.mode)));
 $('mode-explanation').innerHTML=S.mode==='shared'?`<strong>A match has to work for everyone selected.</strong> Each candidate is ranked by the lowest individual compatibility. ${members().length===1?'With one person selected, this is their individual score.':'The cards show who sets that minimum.'}`:`<strong>Matches to one synthetic median profile.</strong> These use the middle of your selected axis scores. A high median fit can still be low for an individual, so every card also shows each person’s score.`;
 $('category-tabs').innerHTML=categories.map(([key,label])=>`<button data-category="${key}" aria-pressed="${S.category===key}">${label}</button>`).join('');
 const retained=group().matches[S.mode][S.category],q=S.query.trim().toLocaleLowerCase(),rows=retained.filter(r=>{const e=D.entities[r.key];return r.floor>=S.threshold&&(!q||[e.name,e.category,e.role,fields[e.category]||'',JSON.stringify(e.i18n||{})].join(' ').toLocaleLowerCase().includes(q));});
 let note=S.category==='distant'?'Three of the least compatible profiles from each source catalog.':S.category==='fields'?'The best match in each of eight fields.':`The top ${retained.length} retained matches from the full source catalog.`;
 note+=` ${rows.length} match your filters. Search and the minimum filter apply to this match category. Books have a separate minimum filter.`;

 $('catalog-note').textContent=note;
 $('threshold-value').textContent=pct(S.threshold,0);
 $('match-grid').innerHTML=rows.length?rows.slice(0,S.limit).map((r,i)=>card(r,retained.indexOf(r)+1)).join(''):'<div class="no-results"><h3>No retained matches meet these filters.</h3><p>Lower the minimum or clear the search. Results outside the retained list are not searched.</p></div>';
 $('show-more').hidden=rows.length<=S.limit;$('show-more').textContent=`Show ${Math.min(6,Math.max(0,rows.length-S.limit))} more matches ↓`;
 renderContext();renderIndividual();
}
function renderContext(){
 const g=group(),dims=g.matches[S.mode].dimensions,unusual=D.axes[g.unusual],typical=D.axes[g.typical],t=g.tension;
 $('profile-context').innerHTML=`<div class="context-panel"><h3>A wider view of your results.</h3><p class="note">Separate ${S.mode==='shared'?'minimum individual':'median-profile'} fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.</p><div class="dimension-grid">${Object.entries(dims).map(([name,rows])=>`<div class="dimension-column"><h4>${esc(name)} matches</h4><p class="note">${name==='Political'?'All 12 axes':name==='Social'?'9 social and institutional axes':'Economy, control and trade'}</p>${rows.map(r=>{const e=D.entities[r.key];return`<div class="dimension-entry">${visual(e)}<div><strong>${esc(e.name)}</strong><small>${e.kind==='personalities'?'Personality':e.kind==='countries'?'Country / state':'Party'}</small></div><b>${pct(r.score)}</b></div>`;}).join('')}</div>`).join('')}</div><div class="context-notes"><p><strong>The median’s most unusual axis:</strong> ${esc(unusual.label)}, ${fmt(Math.abs(g.values[g.unusual]-D.source.catalogMedians[g.unusual]),2)} points from the ideology catalog’s median. <strong>Most typical:</strong> ${esc(typical.label)}. This compares with catalog entries, not the population.</p><p>${t?`<strong>A distinctive combination:</strong> ${esc(t.poles.join(' + '))}. Only ${t.count} of ${t.total} source ideologies share the median’s side on both axes. This is a catalog observation, not a conflict or diagnosis.`:`<strong>A balanced combination:</strong> The source’s distinctive-pole rule did not identify a rare pair for this median profile. All twelve dimensions remain available above.`}</p></div></div>`;
}
function renderIndividual(){const cats=[['ideologies','Ideology'],['countries','Country'],['leaders','Leader'],['parties','Party']];$('individual-results').innerHTML=`<table><thead><tr><th>Person</th>${cats.map(([,label])=>`<th>${label}</th>`).join('')}<th>Original result</th></tr></thead><tbody>${members().map(i=>{const p=D.people[i],g=D.groups[String(1<<i)];return`<tr><td>${dot(i)}${esc(p.name)}</td>${cats.map(([key])=>{const r=g.matches.shared[key][0];return`<td>${esc(D.entities[r.key].name)}<br><span class="muted">${pct(r.floor)}</span></td>`;}).join('')}<td>${ext(p.url,'Open result')}</td></tr>`;}).join('')}</tbody></table><p class="note">Individual rows retain that person’s own original recommendation filter. Group lists require eligibility for every selected person.</p>`;}
function renderBooks(){if(!S.mask)return;const rows=group().matches[S.mode].books.filter(r=>r.floor>=S.threshold);$('book-grid').innerHTML=rows.length?rows.map(r=>{const e=D.entities[r.key];return`<article class="book-card"><div class="book-portrait">${visual(e)}<span>${esc(e.name)}</span></div><div class="book-body"><h3>${esc(r.title)}</h3><p class="note">${esc(e.name)} · ${esc(r.year)}</p><div class="card-score"><strong>${pct(rowScore(r))}</strong><span>${S.mode==='shared'?'minimum author fit':'author fit to median'}</span></div>${personScores(e)}<div class="card-footer"><span>Source catalog book</span>${ext(r.bookSource,'Details')}</div></div></article>`;}).join(''):'<div class="no-results"><h3>No retained books meet the minimum.</h3><p>Lower the author-fit minimum in this section to restore the reading list.</p></div>';}
function pairData(){const rows=[];members().forEach((a,n)=>members().slice(n+1).forEach(b=>{const gaps=D.people[a].values.map((v,j)=>Math.abs(v-D.people[b].values[j]));rows.push({key:`${a}-${b}`,a,b,names:D.people[a].name+' + '+D.people[b].name,gap:mean(gaps),gaps});}));return rows.sort((a,b)=>a.gap-b.gap);}
function renderPairs(){const pairs=pairData();if(!pairs.length){$('pair-area').innerHTML='<div class="no-results"><h3>Select at least two people.</h3><p>Each pair will show its average gap and the differences on every axis.</p></div>';return;}if(!pairs.some(p=>p.key===S.pair))S.pair=pairs[0].key;const p=pairs.find(p=>p.key===S.pair);$('pair-area').innerHTML=`<div class="pair-list">${pairs.map(r=>`<button data-pair="${r.key}" class="pair-button" aria-pressed="${r.key===S.pair}"><span>${esc(r.names)}</span><strong>${fmt(r.gap,2)}</strong><small>percentage point gap</small></button>`).join('')}</div><div class="pair-detail"><h3>${esc(p.names)}</h3><p>Axis-by-axis distance. A zero means identical scores on that axis.</p>${p.gaps.map((gap,j)=>`<div class="gap-row"><span>${esc(D.axes[j].label)}</span><div><i style="width:${gap}%"></i></div><strong>${fmt(gap)}</strong></div>`).join('')}</div>`;}
function renderAll(){renderSelection();renderHero();if(!S.mask)return;renderCompass();renderAxes();renderMatches();renderBooks();renderPairs();}
function selectMask(mask){S.mask=mask;S.limit=6;S.pair=null;renderAll();}
function init(){}
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
 ps.forEach(p=>{svg+=`<polygon class="radar-profile" points="${polygon(p.values)}" fill="${p.color}" fill-opacity=".04" stroke="${p.color}" stroke-width="3"><title>${esc(p.name)}</title></polygon>`;p.values.forEach((v,j)=>{const q=at(j,v);svg+=`<circle class="radar-point" cx="${q[0]}" cy="${q[1]}" r="3.3" fill="${p.color}"><title>${esc(p.name)} · ${esc(D.axes[j].leftPole)}: ${pct(v)}</title></circle>`;});});
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
 $('distance-matrix').innerHTML=ps.length<2?'':`<table style="--distance-columns:${ps.length}"><caption class="note">Exact RMS distance · percentage points · lower means closer</caption><thead><tr><th>Person</th>${ps.map((p,i)=>`<th class="num" title="${esc(p.name)}">${i+1}</th>`).join('')}</tr></thead><tbody>${ps.map((p,i)=>`<tr><th>${i+1}. ${esc(p.name)}</th>${m.distances[i].map((v,j)=>`<td class="num distance-cell" style="background:rgba(16,46,36,${i===j?0:(1-v/100)*.14})">${i===j?'—':fmt(v,2)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
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

// Translate rendered interface text, including results inserted after a selection changes.
const UI_COPY = {
 'The 108 scores are preserved exactly from the nine supplied URLs.':'As 108 pontuações foram preservadas exatamente dos nove links fornecidos.',
 'Read the supplied reports in English or Portuguese. Each result identifies its person, report date and source page.':'Leia os relatórios em português ou inglês. Cada resultado identifica a pessoa, a data do relatório e a página de origem.',
 'Matches use the pinned public catalog from October 18, 2026. All nine people and their combinations were calculated from the same snapshot; these are not fresh live rankings.':'As correspondências usam o catálogo de 18 de outubro de 2026. Todas as nove pessoas e suas combinações foram calculadas com a mesma versão; não são classificações atualizadas em tempo real.',
 'For every candidate, take the lowest individual compatibility among the selected people. Rank that minimum highest first. Ties use the median individual score, then the mean, then the name. Each card shows all selected individual scores.':'Para cada candidato, usa-se a menor compatibilidade individual entre as pessoas selecionadas. Os maiores mínimos aparecem primeiro. Empates são resolvidos pela mediana individual, depois pela média e pelo nome. Cada cartão mostra todas as pontuações individuais selecionadas.',
 'Median-profile mode scores the synthetic vector of selected axis medians. It is a different question. The minimum-score filter still requires every selected person to pass.':'O modo de mediana pontua o perfil calculado com as medianas dos eixos selecionados. O filtro mínimo continua exigindo que todas as pessoas selecionadas alcancem o valor definido.',
 'All 511 nonempty selections have been computed against the full source catalogs. The page retains the top 24 matches per category and method, eight field winners and 12 books. Search operates on those retained matches.':'As 511 seleções não vazias foram calculadas nos catálogos completos. A página preserva as 24 primeiras correspondências por categoria e método, oito vencedores por área e 12 livros. A busca considera apenas essas correspondências preservadas.',
 'Both match methods honor the original recommendation filter of every selected person. Osmar’s, Miguel’s, Jucimar’s and Lucca’s links specify Catholic; Julia’s specifies Protestant; the other links specify none. The source’s exclusion and exclusivity rules are retained. This describes a filter, not an inferred religious identity.':'Os dois métodos respeitam o filtro original de recomendações de cada pessoa. Os links de Osmar, Miguel, Jucimar e Lucca especificam católico; o de Julia especifica protestante; os demais não especificam filtro. As regras de exclusão e exclusividade da fonte são preservadas. Isso descreve um filtro, não uma identidade religiosa inferida.',
 'The compass is an illustrative projection. Matching uses the full 12-axis scoring formula: 42% per-axis similarity, 33% direction, 18% intensity, 7% worst-axis agreement. Matches are not probabilities or endorsements.':'A bússola é uma projeção ilustrativa. As correspondências usam a fórmula completa dos 12 eixos: 42% similaridade por eixo, 33% direção, 18% intensidade e 7% concordância no pior eixo. As pontuações não são probabilidades nem endossos.',
 'Individual rows retain that person’s own original recommendation filter. Group lists require eligibility for every selected person.':'Cada linha individual mantém o filtro original daquela pessoa. Nas listas do grupo, o candidato precisa ser elegível para todas as pessoas selecionadas.',
 'A geometry of your differences.':['Compare all 12 political axes.','Compare os 12 eixos políticos.'],
 'Compatible with your combination.':['Matches for the selected people.','Correspondências para as pessoas selecionadas.'],
 'Read the ideas behind the matches.':['Group reading list','Lista de leitura do grupo'],
 'Choose any combination below. The radar shows scores; the distance map shows separation.':['Select people below. The radar compares their scores on each axis. The map summarizes the differences between their profiles.','Selecione as pessoas abaixo. O radar compara suas pontuações em cada eixo. O mapa resume as diferenças entre os perfis.'],
 'Center = 0%, outer ring = 100% of each named pole. A larger shape does not mean a stronger or better ideology.':['Each label names the position measured from 0% at the center to 100% at the outer ring. Area does not measure political strength or quality.','Cada rótulo indica a posição medida de 0% no centro a 100% no anel externo. A área não mede força ou qualidade política.'],
 'Closer points mean more similar test answers across all 12 axes. Horizontal and vertical directions have no political meaning.':['Closer points indicate more similar scores across the 12 axes. The map directions do not represent left, right, authority or freedom.','Pontos próximos indicam pontuações mais semelhantes nos 12 eixos. As direções do mapa não representam esquerda, direita, autoridade ou liberdade.'],
 'Map: classical multidimensional scaling of root-mean-square (RMS) gaps. It is a two-dimensional approximation; use the table for exact gaps. All axes have equal weight. Selecting a different group may rotate or reposition the map.':['The map approximates the differences in two dimensions. The table shows the exact RMS score gaps in percentage points, with equal weight for every axis. Changing the group can rotate or reposition the map.','O mapa aproxima as diferenças em duas dimensões. A tabela mostra as distâncias RMS exatas em pontos percentuais, com peso igual para cada eixo. Mudar o grupo pode girar ou reposicionar o mapa.'],
 'Median profile':['Match to the group median','Correspondência com a mediana do grupo'],
 'Shared matches':['Best minimum individual match','Melhor correspondência individual mínima'],
 'Minimum for every person':['Minimum individual compatibility','Compatibilidade individual mínima'],
 'Minimum author fit for each person':['Minimum individual author compatibility','Compatibilidade individual mínima com o autor'],
 'The 12-axis radar':'Radar dos 12 eixos', 'How far apart are your profiles?':'Qual é a distância entre os perfis?',
 'ALL 12 AXES, ONE SHAPE':'OS 12 EIXOS EM UM GRÁFICO', 'Median & mean':'Mediana e média', 'Connections':'Conexões',
 'Geometry':'Geometria','Compass':'Bússola','12 axes':'12 eixos','Matches':'Correspondências','Books':'Livros','PDF reports':'Relatórios PDF',
 'Print / PDF ↗':'Imprimir / PDF ↗','FAMILY EDITION':'EDIÇÃO FAMÍLIA','Skip to content':'Ir para o conteúdo',
 'Federal':'Federalista','Democratic':'Democrático','Security-focused':'Foco em segurança','Assimilationist':'Assimilacionista','Militarist':'Militarista','Non-interventionist':'Não intervencionista','Public economy':'Economia pública','Planned economy':'Economia planejada','Protectionist':'Protecionista','Irreligious':'Irreligioso','Progressive':'Progressista','Pro-technology':'Pró-tecnologia',
 'Median':'Mediana','Mean':'Média','Arithmetic mean':'Média aritmética','Everyone':'Todos','Clear':'Limpar','No one selected':'Ninguém selecionado','No people selected':'Nenhuma pessoa selecionada',
 'Include in these graphs':'Incluir nestes gráficos','Include in these matches':'Incluir nestas correspondências','Include in this reading list':'Incluir nesta lista de leitura',
 'Set people across the page':'Definir pessoas para toda a página','Resets all section groups · compass, axes and PDFs follow this selection':'Redefine todos os grupos · bússola, eixos e PDFs seguem esta seleção',
 'Choose at least one person.':'Selecione pelo menos uma pessoa.','Select everyone':'Selecionar todos','Select people below':'Selecione as pessoas abaixo',
 'Choose a family combination':'Escolher uma combinação da família','Show selected median':'Mostrar mediana da seleção',
 'YOUR POSITIONS, ON THE ORIGINAL SCALE':'SUAS POSIÇÕES NA ESCALA ORIGINAL','The political compass.':'A bússola política.',
 'Economic left to right. Libertarian to authoritarian. Each point keeps its exact coordinates.':'Da esquerda à direita econômica. Do libertário ao autoritário. Cada ponto mantém suas coordenadas exatas.',
 'SELECTED PROFILES':'PERFIS SELECIONADOS','Social values':'Valores sociais','Traditionalist':'Tradicionalista',
 'The median point is the projection of the selected axis medians. It is not the average of these dots.':'O ponto da mediana é a projeção das medianas dos eixos selecionados. Não é a média destes pontos.',
 'How the compass is calculated':'Como a bússola é calculada',
 'Economic right = 60% private economy + 40% free market. Authority = the average of security, autocracy and unitary scores. Traditionalism = 100 minus the progressive score. These are the original 12 Axes formulas.':'Direita econômica = 60% economia privada + 40% livre mercado. Autoridade = média das pontuações de segurança, autocracia e unitarismo. Tradicionalismo = 100 menos a pontuação progressista. Estas são as fórmulas originais do 12 Axes.',
 'The eight-region color map follows the original site. The graph is a summary; the complete 12-axis profile determines matches.':'O mapa de oito regiões segue o site original. O gráfico é um resumo; o perfil completo dos 12 eixos determina as correspondências.',
 'ALL TWELVE DIMENSIONS':'AS DOZE DIMENSÕES','Where you agree. Where you differ.':'Concordâncias e diferenças.','Sort axes':'Ordenar eixos','Original order':'Ordem original','Largest differences':'Maiores diferenças','Closest agreement':'Maior concordância','Original bars':'Barras originais','Compare':'Comparar','Values':'Valores',
 'IDEAS, PLACES, PEOPLE & PARTIES':'IDEIAS, LUGARES, PESSOAS E PARTIDOS','Show more matches ↓':'Mostrar mais correspondências ↓','Compare each person’s individual top matches':'Comparar as principais correspondências de cada pessoa',
 'YOUR GROUP’S READING LIST':'LISTA DE LEITURA DO GRUPO','Books from the original catalog, ranked by their authors’ compatibility with the selected people.':'Livros do catálogo original, ordenados pela compatibilidade dos autores com as pessoas selecionadas.',
 'Author portraits, not book covers':'Retratos dos autores; não são capas de livros','PERSON TO PERSON':'PESSOA A PESSOA','Compare the connections.':'Compare as conexões.',
 'Average absolute gap across 12 equally weighted axes. Smaller means closer test profiles.':'Diferença absoluta média nos 12 eixos, com pesos iguais. Valores menores indicam perfis mais próximos.',
 'Countries':'Países','Leaders':'Líderes','Ideologies':'Ideologias','All personalities':'Todas as personalidades','By field':'Por área','Parties':'Partidos','Historical states':'Estados históricos','Historical parties':'Partidos históricos','Distant matches':'Correspondências mais distantes',
 'Politics':'Política','Intellectuals':'Intelectuais','Business':'Negócios','Philosophy':'Filosofia','Activism':'Ativismo','Theory':'Teoria','Economics':'Economia','Religion':'Religião',
 'Radical Left':'Esquerda radical','Left':'Esquerda','Center':'Centro','Right':'Direita','Far-Right':'Extrema direita','Third Position':'Terceira posição','Libertarian':'Libertário','Anarchist':'Anarquista',
 'PRESERVED FROM THE EIGHT PDF REPORTS':'PRESERVADO DOS OITO RELATÓRIOS PDF','The original results, side by side.':'Os resultados originais, lado a lado.',
 'Explore the supplied reports from October 17, 2026. Each card remains attached to its person and source page.':['Read the reports from October 17, 2026 in English or Portuguese. Each result identifies its person and source page.','Leia os relatórios de 17 de outubro de 2026 em português ou inglês. Cada resultado identifica a pessoa e a página de origem.'],
 'Overview':'Visão geral','Figures & leaders':'Personalidades e líderes','Original books':'Livros originais','Timeline':'Linha do tempo','Full report text':'Texto integral do relatório',
 'Sources, filters & calculation details':'Fontes, filtros e cálculos','Source snapshot':'Versão da fonte','Shared compatibility':'Compatibilidade compartilhada','Original recommendation filters':'Filtros originais de recomendação',
 'Download current selections ↓':'Baixar seleções atuais ↓','Download full catalog & all combinations ↓':'Baixar catálogo completo e todas as combinações ↓','Source catalog':'Catálogo de origem',
 'Swipe the chart sideways to read all twelve spokes →':'Deslize o gráfico para ler os doze eixos →',
 'Select any individual, group or everyone using the buttons above.':'Selecione uma pessoa, um grupo ou todos nos botões acima.',
 'Choose at least one person above.':'Selecione pelo menos uma pessoa acima.',
 'YOUR FAMILY’S RESULTS, TOGETHER':'OS RESULTADOS DA FAMÍLIA, JUNTOS','Different perspectives.':'Perspectivas diferentes.','Find your common ground.':'Encontre pontos em comum.',
 'Explore your matches ↓':'Explorar correspondências ↓','Compare the geometry ↗':'Comparar os gráficos ↗',
 'Compare nine individual results. Select any combination to discover the ideas, places and people that fit your group.':'Compare nove resultados individuais. Selecione qualquer combinação para descobrir as ideias, lugares e pessoas com perfis semelhantes ao grupo.'
};
const UI_PHRASES = {
 'Dots: people · diamond: median · ring: mean':'Pontos: pessoas · losango: mediana · anel: média',
 'Scores: % of the named pole. Differences: percentage points.':'Pontuações: % do polo indicado. Diferenças: pontos percentuais.',
 'Separate ':'Compatibilidades separadas de ','minimum individual':'mínimo individual','median-profile':'perfil mediano',
 'fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'usando os conjuntos de eixos de cada dimensão da fonte. São independentes do filtro mínimo acima.',
 ' matches':' correspondências','The median’s most unusual axis:':'Eixo mais incomum da mediana:','Most typical:':'Mais típico:',
 'points from the ideology catalog’s median.':'pontos da mediana do catálogo de ideologias.',
 'This compares with catalog entries, not the population.':'A comparação é com os registros do catálogo, não com a população.',
 'A distinctive combination:':'Uma combinação distintiva:','Only ':'Apenas ',' source ideologies share the median’s side on both axes. This is a catalog observation, not a conflict or diagnosis.':' ideologias da fonte estão do mesmo lado da mediana em ambos os eixos. É uma observação do catálogo, não um conflito ou diagnóstico.',
 'A balanced combination:':'Uma combinação equilibrada:',
 'The source’s distinctive-pole rule did not identify a rare pair for this median profile. All twelve dimensions remain available above.':'A regra de polos distintivos da fonte não identificou um par raro neste perfil mediano. As doze dimensões continuam disponíveis acima.',
 'Median vectors are rounded to one decimal only for source compatibility matching; displayed medians and graph coordinates use full precision.':'Os vetores medianos são arredondados a uma casa decimal apenas no cálculo de compatibilidade com a fonte; as medianas exibidas e as coordenadas usam a precisão completa.',
 '9 family members · 511 possible combinations · 12 axes · images included offline':'9 familiares · 511 combinações possíveis · 12 eixos · imagens disponíveis off-line',
 'Structure':'Estrutura','Representation':'Representação','Power':'Poder','Immigration':'Imigração','Diplomacy':'Diplomacia','Intervention':'Intervenção','Economy':'Economia','Control':'Controle','Trade':'Comércio','Morality':'Moralidade','Technology':'Tecnologia','Government':'Governo','Society':'Sociedade',
 'Democracy':'Democracia','Autocracy':'Autocracia','Security':'Segurança','Liberty':'Liberdade','Assimilation':'Assimilação','Multiculturalism':'Multiculturalismo','Pacifist':'Pacifista','Nationalist':'Nacionalista','Unitary':'Unitário','Public':'Pública','Private':'Privada','Planning':'Planejamento','Free market':'Livre mercado','Protectionism':'Protecionismo','Globalism':'Globalismo','Religious':'Religioso','Biology':'Biologia',
 'Geometry combination':'Combinação dos gráficos','Matches combination':'Combinação das correspondências','Books combination':'Combinação dos livros','Geometry people':'Pessoas nos gráficos','Matches people':'Pessoas nas correspondências','Books people':'Pessoas nos livros','Scrollable radar chart':'Gráfico radar com rolagem',
 'Search names, categories or roles':'Buscar nomes, categorias ou funções','Search matches':'Buscar correspondências','Search':'Buscar','Selected median':'Mediana da seleção','The whole family':'Toda a família','Economic right':'Direita econômica','Authority':'Autoridade','Profile':'Perfil',
 'Left end = 100% of the left pole. Right end = 100% of the right pole. Colored dots show people; the diamond shows the selected median; the brown ring shows the mean. The line spans the selected people.':'Extremo esquerdo = 100% do polo esquerdo. Extremo direito = 100% do polo direito. Os pontos coloridos representam as pessoas; o losango é a mediana e o anel marrom é a média. A linha cobre a amplitude das pontuações selecionadas.',
 'Original':'Original','Selected':'Selecionada','score':'pontuação','median':'mediana','Explain':'Explicar','Values =':'Valores =',
 'Show ':'Mostrar ',' more matches ↓':' correspondências adicionais ↓','MATCH ':'CORRESPONDÊNCIA ','LOW COMPATIBILITY':'BAIXA COMPATIBILIDADE',
 'Historical state':'Estado histórico','Country / territory':'País / território','Political party':'Partido político','Historical party':'Partido histórico',
 'Independent family comparison based on':'Comparação independente da família baseada em',
 'October 17, 2026':'17 de outubro de 2026',
 'Matches to one synthetic median profile.':'Correspondências com um perfil mediano calculado.',
 'These use the middle of your selected axis scores. A high median fit can still be low for an individual, so every card also shows each person’s score.':'Usam a mediana das pontuações selecionadas em cada eixo. Uma compatibilidade alta com a mediana pode ser baixa para uma pessoa; por isso, cada cartão também mostra as pontuações individuais.',
 'A match has to work for everyone selected.':'Uma correspondência precisa funcionar para todas as pessoas selecionadas.',
 'Each candidate is ranked by the lowest individual compatibility.':'Cada candidato é ordenado pela menor compatibilidade individual.',
 'With one person selected, this is their individual score.':'Com uma pessoa selecionada, esta é sua pontuação individual.',
 'The cards show who sets that minimum.':'Os cartões mostram quem determina esse mínimo.',
 'Search and the minimum filter apply to this match category. Books have their own people and minimum below.':'A busca e o filtro mínimo se aplicam a esta categoria. Os livros têm seleção de pessoas e mínimo próprios abaixo.',
 'The selected original Catholic recommendation filter is included.':'O filtro católico original de recomendações da seleção está incluído.',
 'Three of the least compatible profiles from each source catalog.':'Três dos perfis menos compatíveis de cada catálogo de origem.',
 'The best match in each of eight fields.':'A melhor correspondência em cada uma das oito áreas.',
 'retained matches from the full source catalog.':'correspondências preservadas do catálogo completo.',
 'match your filters.':'atendem aos filtros.','The top ':'As primeiras ',
 'No retained matches meet these filters.':'Nenhuma correspondência preservada atende a estes filtros.',
 'Lower the minimum or clear the search. Results outside the retained list are not searched.':'Reduza o mínimo ou limpe a busca. A busca considera apenas a lista preservada.',
 'No retained books meet the minimum.':'Nenhum livro preservado atende ao mínimo.',
 'Lower the author-fit minimum in this section to restore the reading list.':'Reduza a compatibilidade mínima com o autor nesta seção para recuperar a lista.',
 'One profile selected. Add another person to create a distance.':'Um perfil selecionado. Adicione outra pessoa para calcular a distância.',
 'This 2D view retains ':'Esta projeção 2D preserva ',
 '% of the squared-distance variation.':'% da variação das distâncias ao quadrado.',
 'All selected distances fit in two dimensions.':'Todas as distâncias selecionadas cabem em duas dimensões.',
 'Some separation is compressed; the exact table is authoritative.':'Parte da separação foi comprimida; consulte a tabela para os valores exatos.',
 'Exact RMS distance · percentage points · lower means closer':'Distância RMS exata · pontos percentuais · menor indica maior proximidade',
 'Source description':'Descrição original','Book details':'Detalhes do livro','Original online result':'Resultado original on-line',
 'Original top ideology':'Principal ideologia no original','Closest country':'País mais próximo','Closest figure':'Personalidade mais próxima','Closest era':'Época mais próxima','Compass classification in PDF':'Classificação na bússola do PDF',
 'Generated summary & distinctive axes':'Resumo gerado e eixos distintivos','Source-generated statement, page 1':'Declaração gerada pela fonte, página 1',
 'Present-day country':'País atual','Active party':'Partido ativo','Historical match':'Correspondência histórica','By dimension':'Por dimensão','Furthest in the report':'Mais distante no relatório','Top match':'Principal correspondência','Other close ideologies':'Outras ideologias próximas','Furthest ideology':'Ideologia mais distante',
 'author fit':'compatibilidade com o autor','catalog fit':'compatibilidade no catálogo','PDF · page ':'PDF · página ',
 'Original three books per selected person. Scores refer to the author; the images are author portraits. The group reading list above uses the selected matching method.':'Os três livros originais de cada pessoa selecionada. As pontuações se referem ao autor; as imagens são seus retratos. A lista de leitura do grupo acima usa o método selecionado.',
 'Full extracted text from all eight pages of each selected report. Expand any page to inspect the source wording.':'Texto integral extraído das oito páginas de cada relatório selecionado. Abra uma página para consultar a redação original no idioma da fonte.',
 'These are the supplied reports’ original matches and rounded percentages. Group matches above come from the HTML’s preserved catalog snapshot and can differ. Similarity is a test result, not an endorsement or a definitive personal label.':'Estas são as correspondências originais e as porcentagens arredondadas dos relatórios. As correspondências do grupo acima usam o catálogo preservado do HTML e podem diferir. A similaridade é um resultado do teste, não um endosso ou rótulo pessoal definitivo.',
 'A wider view of your results.':'Outras perspectivas dos resultados.','All 12 axes':'Todos os 12 eixos','9 social and institutional axes':'9 eixos sociais e institucionais','Economy, control and trade':'Economia, controle e comércio',
 'Political':'Política','Social':'Social','Economic':'Econômica','Personality':'Personalidade','Country / state':'País / Estado','Party':'Partido','Person':'Pessoa','Ideology':'Ideologia',
 'Original result':'Resultado original','Open result':'Abrir resultado','Source catalog book':'Livro do catálogo original','Details':'Detalhes','Source':'Fonte','Lowest individual:':'Menor compatibilidade individual:',
 'minimum author fit':'menor compatibilidade com o autor','author fit to median':'compatibilidade do autor com a mediana',
 'Select at least two people.':'Selecione pelo menos duas pessoas.','Each pair will show its average gap and the differences on every axis.':'Cada dupla mostra sua diferença média e as diferenças em cada eixo.',
 'Axis-by-axis distance. A zero means identical scores on that axis.':'Distância eixo a eixo. Zero significa pontuações idênticas naquele eixo.',
 'percentage point gap':'pontos percentuais de diferença','point range':'pontos de amplitude','Axis / left pole':'Eixo / polo esquerdo',
 'All percentages measure the named left pole. The opposite score is 100 minus that value. Gaps and MAD are percentage points.':'Todas as porcentagens medem o polo esquerdo indicado. A pontuação oposta é 100 menos esse valor. Diferenças e desvio absoluto mediano (MAD) são expressos em pontos percentuais.',
 'independent selection':'seleção independente','Authors ranked against the median of this combination.':'Autores ordenados pela compatibilidade com a mediana desta combinação.',
 'Authors ranked by their lowest fit among these people.':'Autores ordenados pela menor compatibilidade individual entre estas pessoas.',
 'Images are author portraits.':'As imagens são retratos dos autores.','individual fit':'compatibilidade individual','minimum fit for everyone':'menor compatibilidade individual','fit to the median profile':'compatibilidade com o perfil mediano',
 'lowest individual score':'menor pontuação individual','synthetic median profile':'perfil mediano calculado','Country':'País','Leader':'Líder',
 'TOP SHARED CATALOG MATCH':'MELHOR CORRESPONDÊNCIA COMPARTILHADA','TOP MEDIAN-PROFILE CATALOG MATCH':'MELHOR CORRESPONDÊNCIA COM A MEDIANA',
 'No people selected for these matches':'Nenhuma pessoa selecionada para estas correspondências','Choose people for these graphs.':'Selecione pessoas para estes gráficos.','Choose people for these matches.':'Selecione pessoas para estas correspondências.','Choose people for this reading list.':'Selecione pessoas para esta lista de leitura.',
 'For each axis, take the middle of the three selected scores.':'Em cada eixo, use a pontuação central das três selecionadas.',
 'With two people, the median is their average. It does not resist a single outlier.':'Com duas pessoas, a mediana é sua média e é sensível a um valor extremo.',
 'One person selected. Their original scores are shown unchanged.':'Uma pessoa selecionada. Suas pontuações originais são exibidas sem alteração.',
 'points RMS':'pontos RMS','percentage points':'pontos percentuais','Mean:':'Média:','Median:':'Mediana:',
 'Public catalog snapshot':'Versão do catálogo público','commit':'commit','Page ':'Página ','Source page':'Página de origem','Compatibility':'Compatibilidade','Range':'Amplitude','Gap':'Diferença','Author':'Autor','Read more':'Ler mais'
};
UI_COPY['The supplied PDFs preserve original descriptions, page-by-page text, figures, books, and timelines or values in the report section. Their rounded results are kept separate from the catalog’s recomputed group matches.']='Os PDFs fornecidos preservam descrições originais, o texto página por página, figuras, livros e linhas do tempo ou valores na seção de relatórios. Seus resultados arredondados ficam separados das correspondências recalculadas do catálogo.';
UI_COPY['The graphs, medians and compatibility lists update with your selection.']='Os gráficos, as medianas e as listas de compatibilidade são atualizados conforme sua seleção.';
Object.assign(UI_PHRASES,{
 'No catalog scores yet, so left out of these matches.':'Ainda sem pontuações do catálogo; ficam fora destas correspondências.',
 'No catalog scores yet, so left out of this reading list.':'Ainda sem pontuações do catálogo; ficam fora desta lista de leitura.',
 'Their original PDF results are in the PDF reports section.':'Os resultados originais em PDF estão na seção de relatórios.',
 'No catalog scores for this person. See the PDF reports section.':'Esta pessoa não tem pontuações do catálogo. Veja a seção de relatórios em PDF.',
 'Ranked by the lowest compatibility among the selected people.':'Ordenado pela menor compatibilidade entre as pessoas selecionadas.',
 'Ranked against the selected group’s median profile.':'Ordenado pela compatibilidade com o perfil mediano do grupo selecionado.',
 'Separate median-profile fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'As correspondências com a mediana são calculadas separadamente para cada dimensão, usando os eixos definidos pela fonte. O filtro mínimo acima não se aplica aqui.',
 'Separate minimum individual fits using the source’s dimension-specific axis sets. These are independent of the minimum filter above.':'A menor compatibilidade individual é calculada separadamente para cada dimensão, usando os eixos definidos pela fonte. O filtro mínimo acima não se aplica aqui.',
 'Third position with Strongly traditionalist social values':'Terceira posição com valores sociais fortemente tradicionalistas',
 'Centrist with Traditionalist social values':'Centro com valores sociais tradicionalistas','Right with Traditionalist social values':'Direita com valores sociais tradicionalistas','Centrist with Moderate social values':'Centro com valores sociais moderados',
 'Book matching method':'Método de compatibilidade dos livros',
 'The main bars show the selected median; each person’s score stays visible.':'As visualizações mostram a mediana da seleção e as pontuações individuais.',
 'CLOSEST AXIS':'EIXO COM MAIOR CONCORDÂNCIA','WIDEST DIFFERENCE':'MAIOR DIFERENÇA','CLOSEST PAIR':'DUPLA MAIS PRÓXIMA',
 'percentage point range among the selected people.':'pontos percentuais de amplitude entre as pessoas selecionadas.',
 'percentage points. Every individual stays visible.':'pontos percentuais. Todas as pontuações individuais continuam visíveis.',
 'percentage points apart on average.':'pontos percentuais de diferença, em média.',
 'The main bars show the selected median; each person’s score stays visible.':'As visualizações mostram a mediana da seleção e as pontuações individuais.',
 'Highlighted values determine the median. Individual values below measure':'Os valores destacados determinam a mediana. Os valores individuais abaixo medem',
 'Median':'Mediana','Mean':'Média','Federal':'Federalista','Militarist':'Militarista','Non-interventionist':'Não intervencionista','Irreligious':'Irreligioso','Progressive':'Progressista','Traditionalist':'Tradicionalista',
 'Political matches':'Correspondências políticas','Social matches':'Correspondências sociais','Economic matches':'Correspondências econômicas',
 'Search these matches':'Buscar nestas correspondências','Axis view':'Visualização dos eixos','Match category':'Categoria de correspondências','Compatibility method':'Método de compatibilidade','Original report category':'Categoria dos relatórios originais',
 'Default people; changing these resets all section selections':'Seleção geral; alterá-la redefine as seleções de todas as seções',
 'Twelve-axis comparison for':'Comparação dos doze eixos de',
 'Each spoke measures the named pole from zero at the center to one hundred at the edge. Individual profiles are colored; the median is dark green and the mean is dashed brown.':'Cada eixo mede o polo indicado de zero no centro a cem na borda. Os perfis individuais são coloridos; a mediana tem linha contínua e a média tem linha tracejada.',
 'Geometric distance map for':'Mapa de distâncias entre os perfis de',
 'Two-dimensional projection of root-mean-square score differences. Distances and projection quality appear below.':'Projeção em duas dimensões das diferenças RMS entre pontuações. As distâncias exatas e a qualidade da projeção aparecem abaixo.',
 'Political compass for':'Bússola política de',
 'Economic right increases from left to right. Authority increases from bottom to top. Points use the original formulas. Exact scores appear in the adjacent table.':'A direita econômica aumenta da esquerda para a direita. A autoridade aumenta de baixo para cima. Os pontos usam as fórmulas originais. As pontuações exatas estão na tabela.',
 'Authoritarian':'Autoritário','Authority ↑':'Autoridade ↑','Economic right →':'Direita econômica →',
 ' of ':' de '
});
for(let n=4;n<=9;n++){UI_PHRASES[n%2?`For each axis, take the middle of the ${n} selected scores.`:`For each axis, average the middle two of the ${n} selected scores.`]=n%2?`Em cada eixo, use a pontuação central das ${n} selecionadas.`:`Em cada eixo, calcule a média das duas pontuações centrais das ${n} selecionadas.`;}
let uiLanguage=localStorage.getItem('family-language')||'en';
const uiOriginal=new WeakMap();
UI_COPY['Matches use the reviewed catalog from October 28, 2026. All nine people and their combinations use the same version; original PDFs retain their historical results.']='As correspondências usam o catálogo revisado de 28 de outubro de 2026. As nove pessoas e suas combinações usam a mesma versão; os PDFs originais preservam os resultados históricos.';
UI_COPY['Select people in the floating bar. Every section compares the same group.']='Selecione as pessoas na barra flutuante. Todas as seções comparam o mesmo grupo.';
UI_COPY['Select people in the floating bar.']='Selecione as pessoas na barra flutuante.';
UI_COPY['People included throughout the page']='Pessoas incluídas em toda a página';
UI_COPY['Search and the minimum filter apply to this match category. Books have a separate minimum filter.']='A busca e o filtro mínimo se aplicam a esta categoria. Os livros têm um filtro mínimo separado.';
const uiAttributes=new WeakMap();
const uiPhraseMap={...Object.fromEntries(Object.entries(UI_COPY).filter(([,v])=>typeof v==='string')),...UI_PHRASES};
const uiPhrasePattern=new RegExp('(?<![A-Za-z])(?:'+Object.keys(uiPhraseMap).sort((a,b)=>b.length-a.length).map(k=>k.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')(?![A-Za-z])','g');
function uiText(raw){
 const trim=raw.trim(),entry=UI_COPY[trim];
 if(entry){const value=Array.isArray(entry)?entry[uiLanguage==='pt'?1:0]:(uiLanguage==='pt'?entry:trim);return raw.replace(trim,value);}
 if(uiLanguage!=='pt')return raw;
 let text=raw;
 // Match against the original English text once: translated output is never retranslated.
 text=text.replace(uiPhrasePattern,match=>uiPhraseMap[match]);
 return text;
}
function translateInterface(){
 uiObserver.disconnect();
 const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest('script,style,#page-preferences,#report-content,#report-note,.original-text,.report-quote,.report-item details p,.book-body h3,.card-title,.dimension-entry strong,.hero-match h3,.hero-image-item strong,.book-portrait>span,.report-item h5')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 while(walk.nextNode()){
  const node=walk.currentNode,previous=uiOriginal.get(node);
  const raw=previous&&node.nodeValue===previous.rendered?previous.raw:node.nodeValue;
  const rendered=uiText(raw);if(node.nodeValue!==rendered)node.nodeValue=rendered;
  uiOriginal.set(node,{raw,rendered});
 }
 document.querySelectorAll('[aria-label],[placeholder],[title]').forEach(el=>{
  const saved=uiAttributes.get(el)||{};
  for(const attr of ['aria-label','placeholder','title']){if(!el.hasAttribute(attr))continue;const value=el.getAttribute(attr),prior=saved[attr],raw=prior&&value===prior.rendered?prior.raw:value,rendered=uiText(raw);el.setAttribute(attr,rendered);saved[attr]={raw,rendered};}
  uiAttributes.set(el,saved);
 });
 document.documentElement.lang=uiLanguage==='pt'?'pt-BR':'en';
 document.getElementById('language-toggle').textContent=uiLanguage==='pt'?'English':'Português';
 document.getElementById('theme-toggle').textContent=document.documentElement.dataset.theme==='dark'?(uiLanguage==='pt'?'Modo claro':'Light mode'):(uiLanguage==='pt'?'Modo escuro':'Dark mode');
 uiObserver.observe(document.body,{childList:true,subtree:true,characterData:true});
}
const uiObserver=new MutationObserver(records=>{
 // Rotation only redraws already-localized SVG titles and numeric point labels.
 // Avoid rescanning every text node on the page on each pointer movement.
 if(records.every(record=>record.target instanceof Element&&record.target.closest('.cube-scene')))return;
 translateInterface();
});
const preferences=document.createElement('div');preferences.id='page-preferences';preferences.innerHTML='<button type="button" id="language-toggle">Português</button><button type="button" id="theme-toggle">Dark mode</button>';
document.querySelector('.nav').append(preferences);
document.documentElement.dataset.theme=localStorage.getItem('family-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
document.getElementById('language-toggle').addEventListener('click',()=>{uiLanguage=uiLanguage==='en'?'pt':'en';localStorage.setItem('family-language',uiLanguage);if(D&&S.mask)renderReports();translateInterface();});
document.getElementById('theme-toggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';localStorage.setItem('family-theme',document.documentElement.dataset.theme);translateInterface();});
translateInterface();

// Exact Portuguese translations for structured report fields. Original PDF text is retained separately.
const REPORT_PT={
 'Libertarian Party':'Partido Libertário','Makhnovists (Revolutionary Insurgent Army of Ukraine)':'Makhnovistas (Exército Insurgente Revolucionário da Ucrânia)','New Party (NOVO)':'Partido Novo (NOVO)','Imperial Rule Assistance Association (Taisei Yokusankai)':'Associação de Assistência ao Governo Imperial (Taisei Yokusankai)','Red Army':'Exército Vermelho','EZLN (Zapatista Army of National Liberation)':'EZLN (Exército Zapatista de Libertação Nacional)','Bolsheviks':'Bolcheviques',
 'Techno-Fascism':'Tecnofascismo','Green Centrism':'Centrismo verde','Conservative Liberalism':'Liberalismo conservador','Fascism':'Fascismo','National Socialism':'Nacional-socialismo','British Fascism':'Fascismo britânico','Progressive Libertarianism':'Libertarianismo progressista','Constitutional Monarchism':'Monarquismo constitucional','Centrism':'Centrismo','Bioconservatism':'Bioconservadorismo','Right-Wing Pragmatism':'Pragmatismo de direita','Aristocratic Liberalism':'Liberalismo aristocrático','Liberal Developmentalism':'Desenvolvimentismo liberal','Techno-Socialism':'Tecnossocialismo','Liberal Centrism':'Centrismo liberal','Nordic Social Democracy':'Social-democracia nórdica','Kantian Republicanism':'Republicanismo kantiano',
 'Center':'Centro','Left':'Esquerda','Right':'Direita','Radical Left':'Esquerda radical','Libertarian':'Libertário','Third Position':'Terceira posição',
 'Bosnia and Herzegovina':'Bósnia e Herzegovina','Weimar Republic':'República de Weimar','North Macedonia':'Macedônia do Norte','Kingdom of Sardinia':'Reino da Sardenha','Ecuador':'Equador','Ba\'athist Iraq':'Iraque baathista',"Atatürk's Turkey":'Turquia de Atatürk','Viceroyalty of New Spain':'Vice-Reino da Nova Espanha','Nazi Germany (Third Reich)':'Alemanha nazista (Terceiro Reich)','Fascist Italy (Mussolini)':'Itália fascista (Mussolini)','Switzerland':'Suíça','Lebanon':'Líbano','Canada':'Canadá','Khmer Rouge Cambodia (Pol Pot)':'Camboja do Khmer Vermelho (Pol Pot)','North Korea':'Coreia do Norte','Soviet Union (USSR)':'União Soviética (URSS)','Australia':'Austrália','Bolivia':'Bolívia','Mongolia':'Mongólia','Czechia':'Tchéquia','Rwanda':'Ruanda','Madrid (Spain)':'Madri (Espanha)','Kingdom of Saxony':'Reino da Saxônia',
 'Chinese Communist Party':'Partido Comunista Chinês',"Iraqi Ba'ath Party":'Partido Baath iraquiano','Nazi Party (NSDAP)':'Partido Nazista (NSDAP)','British Union of Fascists (BUF)':'União Britânica de Fascistas (BUF)','Brazilian Integralist Action (AIB)':'Ação Integralista Brasileira (AIB)','Democratic Party of Korea (DPK)':'Partido Democrático da Coreia (DPK)','Imperial House of Japan':'Casa Imperial do Japão','House of Al Thani':'Casa de Al Thani','Progressives (PP)':'Progressistas (PP)','Liberal Party of the Empire (Luzias)':'Partido Liberal do Império (Luzias)','Conservative Party (Tories)':'Partido Conservador (Tories)','Social Democratic Party (PSD)':'Partido Social Democrático (PSD)',"People's Party (PP)":'Partido Popular (PP)','National Democratic Union (UDN)':'União Democrática Nacional (UDN)','Brazilian Social Democracy Party (PSDB)':'Partido da Social Democracia Brasileira (PSDB)','Radical Party (Third Republic)':'Partido Radical (Terceira República)','Renaissance':'Renascimento (Renaissance)',
 'Antiquity':'Antiguidade','Middle Ages':'Idade Média','Early modern era':'Idade Moderna','19th century':'Século XIX','20th century':'Século XX','21st century':'Século XXI','Until 476':'Até 476','476 to 1500':'476 a 1500','1500 to 1800':'1500 a 1800','1800 to 1900':'1800 a 1900','1900 to 2000':'1900 a 2000','Since 2000':'Desde 2000','Current':'Atual',
 'Portuguese Empire':'Império Português','House of Tudor':'Casa de Tudor','Jacobins':'Jacobinos','Charles X Gustav':'Carlos X Gustavo','House of Bonaparte':'Casa de Bonaparte','Napoleonic Empire':'Império Napoleônico','Epicurus':'Epicuro','Democritus':'Demócrito','Heraclitus':'Heráclito','Cicero':'Cícero','Republican Rome':'Roma republicana','Renaissance Florence':'Florença renascentista','Baron of Mauá':'Barão de Mauá','Count of Cavour':'Conde de Cavour','Baron of Rio Branco':'Barão do Rio Branco','Constantine the Great':'Constantino, o Grande','Diogenes of Sinope':'Diógenes de Sinope','Christopher Columbus':'Cristóvão Colombo',
 'The Futurist Manifesto':'Manifesto Futurista','The Doctrine of Fascism':'A Doutrina do Fascismo','Discourse to the Youth of Spain':'Discurso à juventude da Espanha','Memoirs: Every Step Must Be a Goal':'Memórias: cada passo deve ser um objetivo','What Is a Nation?':'O que é uma nação?','The Federalist Papers':'Os Artigos Federalistas','Prosperity Through Competition':'Prosperidade pela concorrência','Principles of Economics':'Princípios de economia','Revolution':'Revolução','Perpetual Peace':'À paz perpétua',
 'Politics':'Política','Political theory':'Teoria política','Intellectual life':'Vida intelectual','Philosophy':'Filosofia','Business':'Negócios','Economics':'Economia','Religion':'Religião','political':'Política','social':'Social','economic':'Econômica',
 'One-party industrial socialism':'Socialismo industrial de partido único','Racial-expansionist totalitarianism':'Totalitarismo racial e expansionista','Supervised ethnoconfessional federation':'Federação etnoconfessional sob supervisão internacional','Unstable parliamentary republic':'República parlamentar instável','Multiethnic parliamentary republic':'República parlamentar multiétnica','Constitutional-reformist monarchy':'Monarquia constitucional reformista','Presidential republic':'República presidencialista','Party':'Partido','Movement':'Movimento','Dynastic house':'Casa dinástica','Brazil':'Brasil','Spain':'Espanha','Taiwan':'Taiwan','Empire of Brazil':'Império do Brasil','French Third Republic':'Terceira República Francesa','Brazil (Vargas Era)':'Brasil (Era Vargas)',
 'Multicultural-extractive monarchy':'Monarquia multicultural de economia extrativa','Plurinational-popular republic':'República plurinacional popular','Mercantile-patronage republic':'República mercantil e de mecenato','Technocratic-financial region':'Região tecnocrática e financeira','Authoritarian-militarist monarchy':'Monarquia autoritária e militarista','Catholic thalassocratic monarchy':'Monarquia católica de domínio marítimo',"Authoritarian Ba'athist republic":'República baathista autoritária','Liberal-rentier monarchy':'Monarquia liberal rentista','Liberal-conservative region':'Região liberal-conservadora','Post-communist democracy':'Democracia pós-comunista','Constitutional-industrial monarchy':'Monarquia constitucional industrial','Senatorial-expansionist republic':'República senatorial expansionista','Authoritarian developmental state':'Estado desenvolvimentista autoritário','Liberal-secular republic':'República liberal e secular','Single-party Kemalist republic':'República kemalista de partido único',
 'Poet':'Poeta','Naturalist':'Naturalista','Economist and statesman':'Economista e estadista','Propaganda Minister':'Ministro da Propaganda','Dictator':'Ditador','British fascist politician':'Político fascista britânico','First Emperor of China':'Primeiro imperador da China','Theorist of Spanish national syndicalism':'Teórico do nacional-sindicalismo espanhol','Statesman':'Estadista','Philosopher':'Filósofo','Economist':'Economista','Conservationist':'Conservacionista','Industrial Magnate and Head of Krupp Group':'Magnata industrial e dirigente do Grupo Krupp','Industrialist and banker':'Industrial e banqueiro','Diplomat and foreign minister':'Diplomata e ministro das Relações Exteriores','Statesman and scientist':'Estadista e cientista','President of Argentina':'Presidente da Argentina','King of Sweden':'Rei da Suécia','Statesman and philosopher':'Estadista e filósofo','Prime Minister of the Kingdom of Sardinia':'Primeiro-ministro do Reino da Sardenha','Pre-Socratic philosopher':'Filósofo pré-socrático','Greek philosopher and founder of Epicureanism':'Filósofo grego e fundador do epicurismo','Marshal and president of Brazil':'Marechal e presidente do Brasil','Founder of the Mongol Empire':'Fundador do Império Mongol','Statesman and military leader':'Estadista e líder militar','President of the Republic and Gaullist Leader':'Presidente da República e líder gaullista','Entrepreneur':'Empresário','Federal deputy':'Deputado federal','Florentine ruler and patron':'Governante florentino e mecenas','Writer':'Escritor','Biologist and TV host':'Biólogo e apresentador de televisão','Economist and diplomat':'Economista e diplomata','President of Paraguay':'Presidente do Paraguai','Former judge and politician':'Ex-juiz e político','Investor':'Investidor',
 'Centrist with Moderate social values':'Centro com valores sociais moderados','Centrist with Traditionalist social values':'Centro com valores sociais tradicionalistas','Right with Traditionalist social values':'Direita com valores sociais tradicionalistas','Third position with Strongly traditionalist social values':'Terceira posição com valores sociais fortemente tradicionalistas',
 'I want a strong, totalitarian state that uses digital surveillance and artificial intelligence to secure the order and unity of the nation.':'Quero um Estado forte e totalitário que use vigilância digital e inteligência artificial para garantir a ordem e a unidade da nação.',
 'I want a gradual energy transition within the market and democracy, without anti-capitalist rupture or climate denial.':'Quero uma transição energética gradual dentro do mercado e da democracia, sem ruptura anticapitalista nem negacionismo climático.',
 'I want a society that unites the free market with tradition and institutions, changing prudently within the frame of liberal democracy.':'Quero uma sociedade que una o livre mercado à tradição e às instituições, mudando com prudência dentro da democracia liberal.',
 "Federalism":"Federalismo",
 "Pragmatic Liberalism":"Liberalismo pragmático",
 "Stalinist Socialism":"Socialismo stalinista",
 "Liberalism":"Liberalismo",
 "Democracy":"Democracia",
 "Neutrality":"Neutralidade",
 "Moderate":"Moderado",
 "Civic Integration":"Integração cívica",
 "Argentina":"Argentina",
 "Panama":"Panamá",
 "Macau (China)":"Macau (China)",
 "Washington, D.C. (United States)":"Washington, D.C. (Estados Unidos)",
 "Polish-Lithuanian Commonwealth":"Comunidade Polaco-Lituana",
 "Brazil Union (UNIÃO)":"União Brasil (UNIÃO)",
 "German Democratic Party (DDP)":"Partido Democrático Alemão (DDP)",
 "Forza Italia (FI)":"Força Itália (FI)",
 "Falange Española":"Falange Espanhola",
 "Workers' Party of Korea (WPK)":"Partido dos Trabalhadores da Coreia (WPK)",
 "Federal republic with market reforms":"República federal com reformas de mercado",
 "Former Car Wash judge · 1972–":"Ex-juiz da Lava Jato · 1972–",
 "Noble republic with an elected king · 1569–1795":"República nobiliárquica com rei eleito · 1569–1795",
 "Party · 1918–1933 · Weimar Republic":"Partido · 1918–1933 · República de Weimar",
 "Pol Pot":"Pol Pot",
 "Joseph Stalin":"Josef Stálin",
 "Joseph Goebbels":"Joseph Goebbels",
 "An Inconvenient Truth":"Uma Verdade Inconveniente",
 "Common Sense":"Senso Comum",
 "Al Gore":"Al Gore",
 "I want a fiscally responsible liberal democracy, open to the world, far from heavy statism and libertarian radicalism.":"Quero uma democracia liberal fiscalmente responsável, aberta ao mundo e distante tanto do estatismo pesado quanto do radicalismo libertário.",
 "Center-right with Moderate social values":"Centro-direita com valores sociais moderados",
 "Christian Conservatism":"Conservadorismo cristão",
 "Conservatism":"Conservadorismo",
 "Alt-Lite":"Alt-Lite",
 "Pragmatic Conservatism":"Conservadorismo pragmático",
 "Techno-Communism":"Tecnocomunismo",
 "Anarchist":"Anarquista",
 "Defensive Militarism":"Militarismo defensivo",
 "Pragmatism":"Pragmatismo",
 "Religious Conservatism":"Conservadorismo religioso",
 "Armenia":"Armênia",
 "Croatia":"Croácia",
 "Old Swiss Confederacy":"Antiga Confederação Suíça",
 "Oregon (United States)":"Oregon (Estados Unidos)",
 "Kingdom of Bavaria":"Reino da Baviera",
 "Canadian psychologist · 1962–":"Psicólogo canadense · 1962–",
 "Constitutional-Catholic monarchy · 1805–1918":"Monarquia constitucional-católica · 1805–1918",
 "National-diasporic republic":"República nacional-diaspórica",
 "Party · 1945–1965 · Brazil (Vargas Era)":"Partido · 1945–1965 · Brasil (Era Vargas)",
 "Christian Democracy (DC)":"Democracia Cristã (DC)",
 "Social Democratic Party (historical PSD)":"Partido Social Democrático (PSD histórico)",
 "Freedom Party of Austria (FPÖ)":"Partido da Liberdade da Áustria (FPÖ)",
 "Brothers of Italy (Fratelli d'Italia)":"Irmãos da Itália (Fratelli d'Italia)",
 "Soviet Union (USSR)":"União Soviética (URSS)",
 "Paris Commune":"Comuna de Paris",
 "Subcomandante Marcos":"Subcomandante Marcos",
 "Élisée Reclus":"Élisée Reclus",
 "Ezra Heywood":"Ezra Heywood",
 "12 Rules for Life":"12 Regras para a Vida",
 "Environmentalist Psychosis: Ecoterrorists Want to End Your Business":"Psicose ambientalista: ecoterroristas querem acabar com o seu negócio",
 "Summa Theologica":"Suma Teológica",
 "I want a society faithful to Christian morals and faith, protecting family, life and inherited customs against the erosion of the times.":"Quero uma sociedade fiel à moral e à fé cristãs, que proteja a família, a vida e os costumes herdados contra a erosão dos tempos.",
 "Center-right with Strongly traditionalist social values":"Centro-direita com valores sociais fortemente tradicionalistas",
 "Catholic-bureaucratic viceroyalty":"Vice-reino católico-burocrático",
 "French-speaking federal province":"Província federal francófona",
 "Federal-institutional district":"Distrito federal-institucional",
 "Presidential republic and service economy":"República presidencialista e economia de serviços",
 "Hyper-open recreational region":"Região recreativa hiperaberta",
 "Federal Reserve Chair (2018–2026)":"Presidente do Federal Reserve (2018–2026)",
 "Philosopher and writer":"Filósofo e escritor",
 "Podcaster and Comedian":"Podcaster e humorista",
 "Businessman and politician":"Empresário e político",
 "Politician":"Político",
 "Thinker":"Pensador",
 "Catholic-touristic parliamentary republic":"República parlamentarista católico-turística",
 "Customary cantonal confederation":"Confederação cantonal consuetudinária",
 "Psychologist and essayist":"Psicólogo e ensaísta",
 "Former President of Poland":"Ex-presidente da Polônia",
 "Monarchist pretender":"Pretendente monarquista",
 "Political strategist":"Estrategista político",
 "Physicist and astronomer":"Físico e astrônomo",
 "Theologian and philosopher":"Teólogo e filósofo"
};
const REPORT_DESCRIPTIONS_PT={
 'Techno-Fascism':'Corrente que une o autoritarismo totalitário do fascismo à vigilância digital, à inteligência artificial e ao controle tecnológico da população, usando a técnica para garantir a ordem e a unidade nacional.',
 'Green Centrism':'Vertente centrista que prioriza a sustentabilidade, a transição energética gradual, a regulação ambiental e a prudência tecnológica. Busca conciliar proteção climática, mercados e instituições democráticas, sem ruptura anticapitalista.',
 'Conservative Liberalism':'Síntese que une o livre mercado e as liberdades econômicas à valorização da tradição, da ordem e das instituições, defendendo mudanças prudentes e estabilidade social dentro da democracia liberal.',
 'Fascism':'Doutrina ultranacionalista de renascimento nacional que rejeita o liberalismo e o marxismo, exalta o Estado totalitário e a liderança de um chefe único, vê a ação e a violência como meios de regeneração e trata a nação como uma religião secular. Possui variantes além do regime italiano que lhe deu o nome.',
 'National Socialism':'Variante alemã do fascismo baseada no racismo, no antissemitismo e no expansionismo. Uniu o totalitarismo, o culto a Hitler e a ideia de uma raça superior, culminando na Segunda Guerra Mundial e no Holocausto.',
 'British Fascism':'Fascismo de Oswald Mosley e da União Britânica de Fascistas: líder único, camisas-negras e Estado corporativo, com um império autárquico, nacionalismo britânico, antissemitismo e oposição ao liberalismo e ao comunismo.',
 'Progressive Libertarianism':'Vertente que busca a igualdade de gênero por meio da liberdade individual e do mercado, em vez do Estado, defendendo a autonomia, a igualdade de direitos e o fim das restrições legais às escolhas das mulheres.',
 'Constitutional Monarchism':'Defesa da monarquia como símbolo de unidade e continuidade, com o rei subordinado à constituição e ao parlamento. Une tradição e estabilidade institucional à democracia representativa e ao Estado de direito.',
 'Centrism':'Posição política que busca equilíbrio entre esquerda e direita, valorizando a moderação, o pragmatismo e o consenso. Combina elementos de diferentes correntes para evitar extremos e favorecer reformas graduais.',
 'Bioconservatism':'Posição contrária à manipulação genética e ao aprimoramento tecnológico do corpo humano. Defende limites éticos à ciência em nome da dignidade, da natureza humana e da prudência em relação ao futuro.',
 'Right-Wing Pragmatism':'Vertente pragmática que prioriza o ajuste fiscal, a estabilidade econômica e a governabilidade por meio de coalizões amplas. Aceita reformas de mercado e concessões políticas em nome de resultados de curto e médio prazo.',
 'Aristocratic Liberalism':'Liberalismo anterior à democracia de massas: garante a liberdade civil, a propriedade, a imprensa livre e um Estado enxuto, mas restringe o voto a proprietários instruídos, temendo que a soberania popular ilimitada destrua as liberdades que pretende proteger.',
 'Liberal Developmentalism':'Modelo dos Tigres Asiáticos — Singapura, Coreia do Sul, Taiwan e Hong Kong. Defende o livre mercado, o comércio exterior e a iniciativa privada como motores do crescimento, combinados com um Estado tecnocrático ativo no planejamento de infraestrutura, educação e industrialização estratégica, sem protecionismo fechado ou controle autoritário rígido.',
 'Techno-Socialism':'Corrente que une a ditadura do proletariado ao aceleracionismo tecnológico. Defende um partido revolucionário, planejamento orientado por dados, automação e propriedade coletiva para conduzir a transição ao comunismo.',
 'Liberal Centrism':'Vertente centrista favorável ao mercado que combina responsabilidade fiscal, democracia liberal, abertura internacional moderada e reforma institucional. Rejeita tanto o estatismo amplo quanto o radicalismo libertário como programa político.',
 'Nordic Social Democracy':'Modelo escandinavo que combina negociação coletiva entre sindicatos, empregadores e Estado, um sistema universal de bem-estar financiado por impostos elevados e uma economia de mercado aberta e exportadora, com forte consenso social e baixa desigualdade.',
 'Kantian Republicanism':'Filosofia política de Kant que fundamenta a legitimidade do Estado na autonomia da razão e no Estado de direito. Defende um republicanismo representativo moderado e uma federação de Estados livres como caminho para a paz perpétua.',
 'China':'Estado socialista de partido único que combina o controle político absoluto do Partido Comunista com uma economia de mercado dirigida pelo Estado, tornando-se uma potência industrial, tecnológica e geopolítica global.',
 'Nazi Germany (Third Reich)':'Regime totalitário liderado por Hitler. O Terceiro Reich impôs uma ditadura racista e expansionista, culto ao líder e um Estado policial, sendo responsável pela Segunda Guerra Mundial e pelo genocídio do Holocausto.',
 'Bosnia and Herzegovina':'Estado formado após o Acordo de Dayton e dividido entre a Federação Croata-Bosníaca e a República Sérvia. O relatório destaca a presidência étnica tripartite, um alto representante internacional, vetos étnicos e a candidatura à União Europeia.',
 'Weimar Republic':'Primeira democracia alemã, a República de Weimar reuniu parlamentarismo, representação proporcional e intensa vida cultural. Foi enfraquecida por crises econômicas e instabilidade política que abriram caminho ao nazismo.',
 'North Macedonia':'República parlamentar dos Bálcãs que mudou de nome em 2019 para encerrar a disputa com a Grécia e ingressou na OTAN em 2020. O relatório menciona as negociações de adesão à União Europeia, os bloqueios da Bulgária, a minoria albanesa de 25% e uma economia de baixa renda.',
 'Kingdom of Sardinia':'Estado piemontês liderado pela Casa de Saboia que promulgou o Estatuto Albertino, modernizou a infraestrutura e a diplomacia e liderou a unificação italiana.',
 'Ecuador':'República andina dolarizada desde 2000. O relatório descreve o governo de Daniel Noboa, a declaração de conflito armado interno contra o crime organizado e o emprego de militares nas ruas e prisões; também registra a rejeição de bases militares estrangeiras em um referendo de 2025.',
 'Filippo Tommaso Marinetti':'Poeta italiano que fundou o futurismo, exaltando a velocidade, a máquina, a guerra e a ruptura com o passado. Aproximou-se do fascismo, unindo vanguarda artística e nacionalismo revolucionário.',
 'Charles Darwin':'Naturalista britânico que formulou a teoria da evolução por seleção natural em A origem das espécies. Revolucionou a compreensão científica da vida, defendeu a observação empírica e o gradualismo contra dogmas estabelecidos. Suas ideias foram depois apropriadas de forma distorcida por ideologias sociais que ele próprio não endossou.',
 'Ludwig Erhard':'Considerado o pai do milagre econômico alemão, implantou a economia social de mercado ordoliberal, combinando concorrência regulada, estabilidade monetária e proteção social. Mais tarde governou como chanceler da Alemanha.',
 'Chinese Communist Party':'Partido governante único desde 1949. Combina leninismo e controle estatal da política, dos meios de comunicação e da internet com economia de mercado dirigida pelo Estado, planejamento industrial, nacionalismo e modernização tecnológica.',
 "Iraqi Ba'ath Party":'Ramo iraquiano do Partido Baath, no poder de 1968 a 2003 sob al-Bakr e Saddam Hussein. Ditadura de partido único com culto ao líder, nacionalismo árabe, economia petrolífera estatal, guerras contra o Irã e o Kuwait e repressão a curdos e xiitas.',
 'Kuomintang (KMT)':'Partido nacionalista chinês fundado em 1912, que governou Taiwan sob lei marcial até 1987. O relatório o descreve como principal oposição, defensor do Consenso de 1992, de laços econômicos mais próximos com a China, da economia de mercado e dos Três Princípios do Povo de Sun Yat-sen.',
 'Radical Party (Third Republic)':'Partido Republicano, Radical e Radical-Socialista, eixo da Terceira República Francesa. Defendia a laicidade da lei de 1905, a escola pública, a pequena propriedade, o imposto de renda, o parlamentarismo e a assimilação republicana. Participou da Frente Popular e dos governos de Herriot e Daladier.',
 "People's Party (PP)":'Principal partido de centro-direita da Espanha, associado a Aznar, Rajoy e Feijóo. Defende a economia de mercado, a unidade espanhola contra o separatismo, a monarquia e a integração europeia, com conservadorismo social moderado.',
 'National Democratic Union (UDN)':'Oposição liberal-conservadora a Vargas e ao trabalhismo entre 1945 e 1965. Defendia a livre iniciativa, o anticomunismo e o combate à corrupção, teve Carlos Lacerda como uma de suas principais vozes e apoiou o golpe de 1964.',
 'Brazilian Social Democracy Party (PSDB)':'Fundado em 1988 por dissidentes do MDB. Governou com Fernando Henrique Cardoso, associado ao Plano Real, às privatizações e à responsabilidade fiscal. O relatório o descreve como partido centrista em declínio, favorável a reformas e à abertura comercial.',
 'Liberal Party of the Empire (Luzias)':'Partido do Império do Brasil conhecido como Luzias. Defendia autonomia provincial, limites ao Poder Moderador, parlamentarismo, livre comércio e imprensa, imigração europeia e abolição gradual, com sufrágio baseado na propriedade.',
 "Argentina":"República federal presidencialista, a Argentina de Javier Milei, desde 2023, persegue contenção fiscal, desregulamentação e privatizações, mantendo serviços públicos e alinhando-se aos Estados Unidos e a Israel, em ruptura com o peronismo.",
 "Polish-Lithuanian Commonwealth":"União da Polônia e da Lituânia de 1569 a 1795, a Comunidade Polaco-Lituana foi uma república nobiliárquica com rei eleito, Sejm e liberum veto, tolerância religiosa incomum e vasto território multiétnico, até ser dividida entre Rússia, Prússia e Áustria.",
 "Sérgio Moro":"Ex-juiz federal, Moro conduziu a Operação Lava Jato, a maior investigação de corrupção do Brasil, que atingiu a petroleira estatal Petrobras; depois foi ministro da Justiça de Bolsonaro até renunciar e, em 2026, disputa o governo do Paraná.",
 "Brazil Union (UNIÃO)":"Partido de centro-direita criado em 2022 pela fusão de DEM e PSL, núcleo do centrão e hoje em federação com o PP. Defende a economia de mercado, o agronegócio e um conservadorismo moral moderado, com ministros no governo Lula e vínculos com o Congresso.",
 "German Democratic Party (DDP)":"Partido liberal de esquerda da República de Weimar, com Hugo Preuss, Theodor Wolff e Walther Rathenau. Defendeu a Constituição de 1919, a democracia parlamentar, a economia de mercado com responsabilidade social, os direitos civis e a reconciliação europeia, até desaparecer em 1933.",
 "Pragmatic Liberalism":"Liberalismo que defende a democracia, os direitos individuais e a economia de mercado, mas testa cada política com evidências: aceita regulação, rede de proteção e intervenção pontual quando corrigem falhas de mercado, como na Terceira Via de Clinton.",
 "Federalism":"Doutrina que organiza o Estado por meio da divisão constitucional de poderes entre um governo central e unidades regionais autônomas, como cantões ou estados, com competências próprias, tribunais independentes e freios mútuos contra a concentração excessiva de poder.",
 "Stalinist Socialism":"Modelo soviético consolidado por Stálin, marcado por industrialização acelerada, coletivização agrícola, planejamento central rígido, liderança personalista e repressão política em massa.",
 "Christian Conservatism":"Corrente que fundamenta a política na moral e na tradição cristãs, defendendo a família, a vida e os valores religiosos dentro da democracia, com ênfase na preservação dos costumes e do patrimônio cultural do povo.",
 "Armenia":"República semipresidencialista no Cáucaso, a Armênia combina identidade nacional cristã e rivalidade histórica com o Azerbaijão e a Turquia, buscando equilíbrio entre Rússia, Ocidente e Irã.",
 "Kingdom of Bavaria":"Reino do sul da Alemanha, aliado à Confederação Germânica e depois ao Império Alemão, marcado por forte identidade católica, conservadorismo e autonomia regional.",
 "Jordan Peterson":"Psicólogo canadense, Peterson tornou-se referência do conservadorismo cultural liberal, criticando o progressismo identitário e defendendo a responsabilidade individual, a tradição, a liberdade de expressão e a ordem simbólica.",
 "Christian Democracy (DC)":"Pequeno partido democrata-cristão centrado na família, na defesa da vida desde a concepção e na fé cristã na vida pública, com economia moderada e proteção social, conhecido pelas candidaturas presidenciais de Eymael.",
 "Social Democratic Party (historical PSD)":"Partido de centro-direita fundado em 1945 por interventores de Vargas, com base rural e oligárquica. Aliado ao PTB nos governos de 1945 a 1964, teve Dutra e Juscelino Kubitschek e defendeu o desenvolvimento, a ordem constitucional e a conciliação.",
 "Conservatism":"Tradição política que valoriza a ordem, os costumes, a família e as instituições consolidadas, preferindo a mudança gradual e prudente à ruptura, com base na experiência histórica e no ceticismo diante das utopias.",
 "Alt-Lite":"Ramo da direita radical nacionalista e antiglobalista, que enfatiza a identidade cultural, a crítica à imigração e a oposição ao politicamente correto, sem adotar posições de base racial.",
 "Pragmatic Conservatism":"Conservadorismo que protege instituições, família e ordem sem rigidez doutrinária: admite reformas graduais e concessões para conservar o essencial, na linha de Burke e Disraeli, em vez de restaurar um passado idealizado.",
 "Techno-Communism":"Corrente que combina a etapa final do comunismo com a aceleração tecnológica, usando automação e IA para superar a escassez, o trabalho necessário e a propriedade privada."
};
const REPORT_DISTINCT_PT={
 Victor:'Posição mais incomum: Diplomacia. Segundo o relatório, 98% das ideologias do catálogo são menos militaristas. Posição mais típica: Religião, próxima à mediana do catálogo.',
 Veranice:'Posição mais incomum: Tecnologia. Segundo o relatório, 82% das ideologias são menos orientadas ao polo biológico. Posição mais típica: Imigração, no centro. Combinação destacada: irreligiosidade e tradicionalismo, presente em 24 das 271 ideologias do catálogo.',
 Osmar:'Posição mais incomum: Comércio. Segundo o relatório, 91% das ideologias são menos globalistas. Posição mais típica: Representação, próxima à mediana. Combinação destacada: pacifismo e nacionalismo; nenhuma ideologia do catálogo reúne os dois polos.',
 Isadora:'Posição mais incomum: Tecnologia. Segundo o relatório, 88% das ideologias são menos orientadas ao polo biológico. Posição mais típica: Diplomacia, próxima à mediana. Combinação destacada: segurança e livre mercado, presente em 12 das 271 ideologias do catálogo.',
 "Jucimar":"Posição mais incomum: Economia. Segundo o relatório, 87% das ideologias são menos orientadas ao polo privado. Posição mais típica: Intervenção, no centro, assim como o catálogo.",
 "Lucca":"Posição mais incomum: Religião. Segundo o relatório, 81% das ideologias são menos religiosas. Posição mais típica: Economia, na mediana do catálogo. Combinação destacada: liberdade e militarismo, presente em apenas 6 das 274 ideologias do catálogo do relatório."
};

// Rafael's October 26 report uses a values summary in place of the earlier timeline.
Object.assign(REPORT_PT,{
 'Machiavellian Republicanism':'Republicanismo maquiaveliano',
 'Malthusian Environmentalism':'Ambientalismo malthusiano',
 'Lassallean Socialism':'Socialismo lassalliano',
 'Tridemism':'Tridemismo',
 'Authoritarian Neoliberalism':'Neoliberalismo autoritário',
 'Far-Right':'Extrema direita',
 'France':'França','Quebec (Canada)':'Quebec (Canadá)',
 'First French Republic':'Primeira República Francesa','Kingdom of Naples':'Reino de Nápoles',
 'Socialist Yugoslavia':'Iugoslávia socialista',"Pinochet's Chile":'Chile de Pinochet',
 'Grand Duchy of Tuscany':'Grão-Ducado da Toscana','Bahrain':'Bahrein',
 'Social-republican republic':'República social e republicana',
 'Self-managed federal socialism':'Socialismo federal autogestionário',
 'Revolutionary Jacobin republic':'República jacobina revolucionária',
 'Absolutist-traditionalist monarchy':'Monarquia absolutista e tradicionalista',
 'Party for Freedom (PVV)':'Partido pela Liberdade (PVV)',
 'Social Democrats (S)':'Social-Democratas (S)',
 'Knights Templar':'Cavaleiros Templários','House of Al Nahyan':'Casa de Al Nahyan',
 'Charter of Carnaro':'Carta de Carnaro','Reflections on Violence':'Reflexões sobre a violência',
 'The Tragedy of the Commons':'A tragédia dos comuns',
 'Activism':'Ativismo','Activist':'Ativista','Ecologist':'Ecólogo',
 'Software engineer':'Engenheiro de software','Sociologist':'Sociólogo',
 'Armed organization':'Organização armada','Coined the term alt-right':'Criou o termo alt-right',
 '1969–present':'1969–presente',
 'Foreign Policy':'Política externa','Economy':'Economia','Immigration':'Imigração',
 'Society':'Sociedade','Technology':'Tecnologia',
 'Confederalism':'Confederalismo','Nationalism':'Nacionalismo','Distributism':'Distributismo',
 'Ethnic Nationalism':'Nacionalismo étnico',
 'Irreligious Moderate Progressivism':'Progressismo moderado irreligioso',
 'Technological Balance':'Equilíbrio tecnológico',
 'Centrist with Progressive social values':'Centro com valores sociais progressistas',
 'I want to protect republican liberty through laws and popular participation, restrain elite domination, and preserve collective independence.':'Quero proteger a liberdade republicana por meio das leis e da participação popular, conter a dominação das elites e preservar a independência coletiva.'
});
Object.assign(REPORT_DESCRIPTIONS_PT,{
 'Machiavellian Republicanism':'Corrente republicana inspirada nos Discursos sobre a primeira década de Tito Lívio, de Maquiavel. Defende a liberdade cívica por meio das leis, da participação popular e do conflito regulado entre grupos sociais, admitindo medidas excepcionais para preservar a república.',
 'Malthusian Environmentalism':'Corrente ambiental inspirada em Garrett Hardin que relaciona a pressão populacional ao esgotamento dos recursos comuns. Defende limites de uso desses recursos impostos coletivamente e políticas para conter o crescimento populacional.',
 'Lassallean Socialism':'Corrente socialista que busca emancipar os trabalhadores por meio do próprio Estado nacional, com sufrágio universal, cooperativas de produtores financiadas com recursos públicos e recusa explícita da via revolucionária.',
 'Tridemism':'Doutrina republicana de Sun Yat-sen, articulada nos Três Princípios do Povo: nacionalismo, democracia e bem-estar do povo. Seu programa previa tutela política transitória, soberania popular e reformas sociais e econômicas.',
 'Authoritarian Neoliberalism':'Regime que introduz políticas radicais de livre mercado sob uma ditadura militar, com privatizações, abertura comercial e economistas da Escola de Chicago, restringindo sindicatos, partidos e opositores em nome da ordem e do anticomunismo.',
 'France':'República semipresidencial europeia que combina uma forte tradição republicana e secular, um amplo Estado de bem-estar social, uma economia mista e um papel diplomático, cultural e militar de destaque na União Europeia e no mundo.',
 'Socialist Yugoslavia':'Federação socialista liderada por Tito que adotou a autogestão dos trabalhadores e uma trajetória independente de Moscou, reunindo diferentes povos sob um partido único até se fragmentar em guerras na década de 1990.',
 'Richard Spencer':'Ativista norte-americano que popularizou o termo alt-right e defende o nacionalismo branco identitário e um Estado etnicamente homogêneo, posições supremacistas amplamente repudiadas dentro e fora dos Estados Unidos.',
 'Les Identitaires':'Movimento francês de extrema direita identitária, fundado em 2002 como Bloc Identitaire e presidido por Fabrice Robert. O relatório descreve sua defesa da remigração, sua oposição à imigração e ao islã e a promoção de uma Europa de identidades étnicas; sua ala jovem foi dissolvida em 2021.'
});
REPORT_DISTINCT_PT.Rafael='Posição mais incomum: Estrutura. Segundo o relatório, 84% das ideologias do catálogo são menos federalistas. Posição mais típica: Controle, próxima à mediana do catálogo. Combinação destacada: federalismo e militarismo, presente em 20 das 274 ideologias do catálogo.';
Object.assign(REPORT_PT,{
 'United Kingdom':'Reino Unido','Mexico':'México',
 'Liberal-financial monarchy':'Monarquia liberal-financeira',
 'Senatorial-expansionist republic':'República senatorial-expansionista',
 'Medieval Iceland (Commonwealth)':'Islândia medieval (Comunidade Livre)',
 'Vichy France':'França de Vichy','Zapatista Chiapas (Mexico)':'Chiapas zapatista (México)',
 'President of Ukraine':'Presidente da Ucrânia','Niccolò Machiavelli':'Nicolau Maquiavel',
 'Diplomacy':'Diplomacia','Virtue and Terror':'Virtude e terror','The Prince':'O príncipe',
 'Liberal Democratic Party (LDP)':'Partido Liberal Democrata (LDP)',
 'Japan':'Japão','Kingdom of Italy':'Reino da Itália',
 'Italian Liberals (Giolitti)':'Liberais italianos (Giolitti)',
 'Azov Battalion':'Batalhão Azov',
 'Institutional Revolutionary Party (PRI)':'Partido Revolucionário Institucional (PRI)',
 'Liberal Party of Canada':'Partido Liberal do Canadá',
 'Democratic Socialists of America (DSA)':'Socialistas Democráticos da América (DSA)',
 'Political Neutrality':'Neutralidade política','Militarism':'Militarismo',
 'Social Liberalism':'Liberalismo social','Cultural Integration':'Integração cultural',
 'Secular Moderate':'Moderação secular','Technological Caution':'Cautela tecnológica',
 'Secular Conservatism':'Conservadorismo secular','Securitarian Democracy':'Democracia securitária',
 'Crypto-Anarchism':'Criptoanarquismo','Diplomat':'Diplomata','Revolutionary':'Revolucionário',
 'Philosopher and diplomat':'Filósofo e diplomata','Theorist':'Teórico',
 'Poet and leader of the Regency of Carnaro':'Poeta e líder da Regência de Carnaro',
 'Popular-integrationist republic':'República popular-integracionista'
});
Object.assign(REPORT_DESCRIPTIONS_PT,{
 'United Kingdom':'Monarquia parlamentar, o Reino Unido tem uma longa tradição liberal e democrática, uma economia de mercado e um forte setor financeiro, mantendo influência global após deixar a União Europeia no processo conhecido como Brexit.',
 'Republican Rome':'República aristocrática da Antiguidade, Roma equilibrava cônsules, Senado e tribunos da plebe em um sistema misto de magistraturas eletivas. Expandiu-se pelo Mediterrâneo com legiões de cidadãos e um forte culto à virtude cívica.',
 'Volodymyr Zelensky':'Presidente da Ucrânia, Zelensky passou de ator a estadista e tornou-se símbolo da resistência nacional à invasão russa, defendendo a democracia, a soberania e a aproximação de seu país com o Ocidente.',
 'Liberal Democratic Party (LDP)':'Partido conservador que governa o Japão quase sem interrupção desde 1955. Defende a aliança com os Estados Unidos, o desenvolvimento liderado pelas empresas, o nacionalismo cultural moderado e a revisão da Constituição pacifista, com facções internas e vínculos empresariais.',
 'Italian Liberals (Giolitti)':'Liberais do Reino da Itália liderados por Giovanni Giolitti, que governou cinco vezes. Defendiam o parlamentarismo, o sufrágio masculino de 1912, a neutralidade estatal nos conflitos trabalhistas, a nacionalização das ferrovias e dos seguros, o protecionismo industrial e a conquista da Líbia.',
 'Secular Conservatism':'Vertente conservadora que defende a ordem, a tradição e as instituições sem fundamentá-las na religião. Sustenta valores culturais e estabilidade social com argumentos seculares, históricos e pragmáticos.',
 'Securitarian Democracy':'Doutrina de democracia militante que autoriza um Estado democrático a restringir os inimigos da própria democracia, proibindo partidos contrários ao sistema, monitorando extremistas e mantendo o serviço militar obrigatório e a segurança reforçada para defender a ordem constitucional.',
 'Crypto-Anarchism':'Corrente que usa criptografia e tecnologias digitais para garantir privacidade, liberdade e transações além do controle estatal, buscando enfraquecer a vigilância e a autoridade por meios tecnológicos.'
});
REPORT_DISTINCT_PT.Miguel='Posição mais incomum: Diplomacia. Segundo o relatório, 83% das ideologias do catálogo são menos militaristas. Posição mais típica: Moralidade, na mediana do catálogo. Combinação destacada: assimilação e irreligiosidade, presente em 31 das 274 ideologias do catálogo.';

const JULIA_REPORT_EN={"EZLN (Exército Zapatista de Libertação Nacional)": "EZLN (Zapatista Army of National Liberation)", "Partido": "Party", "Cartas de Estado e Instruções Ministeriais": "State Letters and Ministerial Instructions", "Tomás de Aquino": "Thomas Aquinas", "Território Livre (Makhnovshchina)": "Free Territory (Makhnovshchina)", "Imigração": "Immigration", "Militarismo": "Militarism", "Subcomandante Marcos": "Subcomandante Marcos", "Brasil": "Brazil", "Direita": "Right", "Estoicismo": "Stoicism", "Reino da Hungria": "Kingdom of Hungary", "Republicanos": "Republicans", "Monarquia feudal-parlamentar": "Feudal-parliamentary monarchy", "Mongólia": "Mongolia", "Harry S. Truman": "Harry S. Truman", "Democracia Cristã (DC)": "Christian Democracy (DC)", "As Institutas da Religião Cristã": "Institutes of the Christian Religion", "Meditações": "Meditations", "Satoshi Nakamoto": "Satoshi Nakamoto", "Aragão e Catalunha Anarquistas": "Anarchist Aragon and Catalonia", "Libertário": "Libertarian", "Criptoanarquismo": "Crypto-Anarchism", "Conservadorismo Paternalista": "Paternalistic Conservatism", "Marco Aurélio": "Marcus Aurelius", "Religião": "Religion", "Lachlan Macquarie": "Lachlan Macquarie", "Socialistas Democráticos da América (DSA)": "Democratic Socialists of America (DSA)", "Sua posição mais incomum Religião 81% das ideologias puxam menos que você para religioso. Irreligioso Religioso Mediana das ideologias Você Sua posição mais comum Economia No centro Você fica no centro em Economia, e o catálogo também. É onde seu perfil menos se distingue. Público Privado Mediana das ideologias Você Sua tensão interna Multicultura + Tradicionalista Só 14 de 274 ideologias juntam essas duas posições. Cameralismo Democracia Cristã Mutualismo +11": "Most unusual position: Religion. 81% of ideologies lean less religious than you. Most common position: Economy, near the center like the catalog. Internal tension: Multiculturalism + Traditionalism; only 14 of 274 ideologies combine these positions. Examples: Cameralism, Christian Democracy and Mutualism, plus 11 others.", "República presidencialista descentralizada": "Decentralized presidential republic", "Partido Democrático Progressista (DPP)": "Democratic Progressive Party (DPP)", "Equilíbrio tecnológico": "Technological balance", "Populares": "Populares", "Reino da Escócia": "Kingdom of Scotland", "Política Externa": "Foreign policy", "Tecnologia": "Technology", "Partido Democrata (era New Deal)": "Democratic Party (New Deal era)", "Tradicionalismo religioso": "Religious traditionalism", "Benjamin Disraeli": "Benjamin Disraeli", "Partido Libertário": "Libertarian Party", "Reformador protestante": "Protestant reformer", "Richard Nixon": "Richard Nixon", "Pluralismo": "Pluralism", "Quênia": "Kenya", "Liberalismo Social": "Social Liberalism", "Centro": "Center", "João Calvino": "John Calvin", "Liberalismo New Deal": "New Deal Liberalism", "Jorge I da Grã-Bretanha": "George I of Great Britain", "Governo forte": "Strong government", "Quero uma nação patriota e de fé, com governo federal forte regulando bancos, sindicatos protegidos, seguridade social e liderança no mundo.": "I want a patriotic nation of faith, with a strong federal government regulating banks, protected unions, social security and global leadership.", "Imperialismo Federalista": "Federalist Imperialism", "New Hampshire (Estados Unidos)": "New Hampshire (United States)", "Política": "Politics", "Tanzânia": "Tanzania", "Ezra Heywood": "Ezra Heywood", "Centrista com valores sociais Fortemente tradicionalistas": "Centrist with strongly traditionalist social values", "Estados Unidos do New Deal": "New Deal United States", "Sociedade": "Society", "Economia": "Economy"};

const rp=(en,pt)=>uiLanguage==='pt'?pt:en;
const rt=value=>{const text=String(value??'');if(uiLanguage!=='pt')return JULIA_REPORT_EN[text]||text.split(' · ').map(part=>JULIA_REPORT_EN[part]||part).join(' · ');return (REPORT_PT[text]||text.split(' · ').map(part=>REPORT_PT[part]||part).join(' · ')).replace(/\bBC\b/g,'a.C.');};
const reportEntity=e=>Object.values(D.entities).find(x=>x.name===(e.name||e.author));
const reportDescription=e=>!e.description?'':e.language==='pt'?(uiLanguage==='pt'?e.description:e.description_en):uiLanguage==='pt'?(REPORT_DESCRIPTIONS_PT[e.name]||''):(e.description||'').replace(/ Compatibility indicates how close your answers are to this profile\./g,'');
pdfThumb=function(e,kind='portrait'){const src=e.image||e.flag;return src?`<img class="report-thumb ${kind==='flag'?'flag':''}" loading="lazy" decoding="async" src="${esc(src)}" alt="${esc(rt(e.author||e.name||rp('Report image','Imagem do relatório')))}">`:'';};
pdfItem=function(e,options={}){
 if(!e||!(e.title||e.name))return '';
 const title=rt(e.title||e.name),score=e.author_match??e.match,entity=reportEntity(e),description=reportDescription(e);
 const meta=[e.group,e.category,e.subtitle,e.dates,e.period,e.year,e.author].filter(v=>v!=null&&v!=='').map(rt);
 const catalogDetail=entity&&(entity.role||entity.category),context=options.context!==false&&!description&&catalogDetail?`${rp('Catalog context','Contexto do catálogo')}: ${rt(catalogDetail)}${entity.lifespan?' · '+rt(entity.lifespan):''}.`:'';
 const dimension=e.dimension?rp({political:'Political dimension',social:'Social dimension',economic:'Economic dimension'}[e.dimension]||e.dimension,{political:'Dimensão política',social:'Dimensão social',economic:'Dimensão econômica'}[e.dimension]||e.dimension):'';
 const dimensionText=e.dimension?rp({political:'Compares the political axis set used by the source.',social:'Compares the social and institutional axes used by the source.',economic:'Compares economy, control and trade.'}[e.dimension]||'',{political:'Compara o conjunto de eixos políticos usado pela fonte.',social:'Compara os eixos sociais e institucionais usados pela fonte.',economic:'Compara economia, controle e comércio.'}[e.dimension]||''):'';
 const page=e.source_page||options.sourcePage;
 return `<article class="report-item"><div class="report-item-head">${pdfThumb(e,options.kind||'portrait')}<div><h5>${e.rank?String(e.rank).padStart(2,'0')+'. ':''}${esc(title)}</h5>${score!=null?`<div class="match-number">${pct(score)} · ${e.author_match!=null?rp('author compatibility','compatibilidade com o autor'):rp('compatibility in the report','compatibilidade no relatório')}</div>`:''}${dimension?`<div class="small-label">${esc(dimension)}</div>`:''}</div></div>${meta.length?`<p class="report-metadata">${meta.map(esc).join(' · ')}</p>`:''}${description?`<p class="report-description">${esc(description)}</p>`:''}${context?`<p class="report-context">${esc(context)}</p>`:''}${dimensionText?`<p class="report-context">${esc(dimensionText)}</p>`:''}${e.author?`<p class="report-context">${rp('The percentage measures the author’s profile, not the book’s content.','A porcentagem mede o perfil do autor, não o conteúdo do livro.')}</p>`:''}${e.url?`<p>${ext(e.url,rp('Book details','Detalhes do livro'))}</p>`:''}${page&&options.page!==false?`<div class="source-page">${rp('Source: report, page','Fonte: relatório, página')} ${esc(page)}</div>`:''}</article>`;
};
function reportDistinct(p){return `<div class="report-summary"><h4>${rp('Summary generated by the original test','Resumo gerado pelo teste original')}</h4><blockquote class="report-quote">${esc(rt(p.report_sentence))}</blockquote><h4>${rp('Distinctive axes in the report','Eixos destacados no relatório')}</h4><p>${esc(uiLanguage==='pt'?(REPORT_DISTINCT_PT[p.name]||p.distinctiveness.text):rt(p.distinctiveness.text))}</p><small>${rp('Source: pages 1–2. These are the test’s statements.','Fonte: páginas 1–2. Estas são as afirmações do teste.')}</small></div>`;}
function reportValues(p){return `<h4>${rp('Values in the report','Valores no relatório')}</h4>${p.values.map(e=>pdfItem(e,{context:false})).join('')}`;}
function reportPanel(p,tab){
 if(tab==='overview')return `<div class="small-label">${rp('Top ideology in the report','Principal ideologia no relatório')}</div>${pdfItem(p.ideology)}<h4>${rp('Closest country','País mais próximo')}</h4>${pdfItem(p.countries.featured[0],{kind:'flag'})}<h4>${rp('Closest figure','Personalidade mais próxima')}</h4>${pdfItem(p.figures.featured)}<div class="report-summary">${p.timeline?`<h4>${rp('Closest era','Época mais próxima')}</h4><p>${esc(rt(p.timeline.closest_era))} · ${pct(p.timeline.match)}</p>`:''}<h4>${rp('Compass classification in the report','Classificação na bússola do relatório')}</h4><p>${esc(rt(p.compass.classification))}</p></div>${reportDistinct(p)}`;
 if(tab==='countries'||tab==='parties'){const v=p[tab];return v.featured.map(e=>`<h4>${rp(e.kind==='present'?'Present-day country':e.kind==='active'?'Active party':'Historical match',e.kind==='present'?'País atual':e.kind==='active'?'Partido ativo':'Correspondência histórica')}</h4>${pdfItem(e,{kind:'flag'})}`).join('')+`<h4>${rp('Matches by dimension','Correspondências por dimensão')}</h4>`+v.dimensions.map(e=>pdfItem(e,{kind:'flag'})).join('')+reportFurthest(v.furthest);}
 if(tab==='figures')return p.figures.ranking.map(e=>pdfItem(e)).join('')+`<h4>${rp('Matches by dimension','Correspondências por dimensão')}</h4>`+p.figures.dimensions.map(e=>pdfItem(e)).join('')+reportFurthest(p.figures.furthest);
 if(tab==='books')return p.books.map(e=>pdfItem(e)).join('');
 if(tab==='timeline')return p.values?reportValues(p):`<p>${rp('Closest era','Época mais próxima')}: <strong>${esc(rt(p.timeline.closest_era))}</strong> · ${pct(p.timeline.match)}</p>`+p.timeline.eras.map(e=>`<div class="report-era"><h4>${esc(rt(e.name))}</h4><p class="report-metadata">${esc(rt(e.period))}</p>${e.entities.map(x=>pdfItem(x)).join('')}</div>`).join('');
 if(tab==='ideologies')return `<h4>${rp('Top match','Principal correspondência')}</h4>${pdfItem(p.ideology)}<h4>${rp('Other close ideologies','Outras ideologias próximas')}</h4>${p.other_ideologies.close.map(e=>pdfItem(e)).join('')}<h4>${rp('Most distant ideology','Ideologia mais distante')}</h4>${pdfItem(p.other_ideologies.furthest)}`;
 const pageLabels=[rp('Profile and summary','Perfil e resumo'),rp('Distinctive axes','Eixos destacados'),rp('Countries','Países'),rp('Featured figure','Personalidade em destaque'),rp('Figures and books','Personalidades e livros'),rp('Parties','Partidos'),p.values?rp('Values','Valores'):rp('Timeline','Linha do tempo'),rp('Ideologies','Ideologias')];
 return Object.entries(p.source_text).map(([page,text])=>{const n=Number(page),content=n===1?pdfItem(p.ideology)+reportDistinct(p):n===2?reportDistinct(p):n===3?reportPanel(p,'countries'):n===4?pdfItem(p.figures.featured)+p.figures.dimensions.map(e=>pdfItem(e)).join(''):n===5?reportPanel(p,'figures')+reportPanel(p,'books'):n===6?reportPanel(p,'parties'):n===7?reportPanel(p,'timeline'):reportPanel(p,'ideologies');return `<details class="report-page"><summary>${rp('Page','Página')} ${esc(page)} — ${pageLabels[n-1]||''}</summary><div class="report-page-content">${content}</div><details class="report-literal"><summary>${rp('Literal PDF text (original language)','Texto literal do PDF (idioma original)')}</summary><div class="original-text" lang="en">${esc(text)}</div></details></details>`;}).join('');
}
function reportFurthest(names){return `<div class="report-summary"><h4>${rp('Most distant in the report','Mais distantes no relatório')}</h4><ul>${names.map(name=>`<li>${esc(rt(name))}</li>`).join('')}</ul></div>`;}
reportBody=function(p){return reportPanel(p,S.reportTab);};
renderReports=function(){
 if(!S.mask)return;
 const hasValues=members().some(i=>PDF.people[D.people[i].name]?.values),hasTimeline=members().some(i=>PDF.people[D.people[i].name]?.timeline);
 $('report-tabs').innerHTML=reportCats.map(([id,label])=>`<button data-report="${id}" aria-pressed="${S.reportTab===id}">${id==='source'?rp('Report by page','Relatório por página'):id==='timeline'?hasValues?(hasTimeline?rp('Timeline & values','Linha do tempo e valores'):rp('Values','Valores')):rp('Timeline','Linha do tempo'):esc(label)}</button>`).join('');
 $('report-note').textContent=rp('Results from the supplied PDFs. Descriptions are shown below each item; additional catalog context is labeled. Original scores are preserved.','Resultados dos PDFs fornecidos. As descrições aparecem abaixo de cada item; o contexto adicional do catálogo está identificado. As pontuações originais foram preservadas.');
 $('report-content').innerHTML=`<div class="report-columns" style="--columns:${members().length}">${members().map(i=>{const p=D.people[i],r=PDF.people[p.name];if(!r)return `<article class="report-person" style="--person-color:${p.color}"><h3>${dot(i)}${esc(p.name)}</h3><p>${rp('Added from the original result link. No PDF was supplied. Charts, comparisons and books include this profile.','Adicionada pelo link do resultado original. Nenhum PDF foi fornecido. Gráficos, comparações e livros incluem este perfil.')}</p>${ext(p.url,rp('Original online result','Resultado original on-line'))}</article>`;const date=new Intl.DateTimeFormat(uiLanguage==='pt'?'pt-BR':'en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'}).format(new Date(r.generated_date+'T00:00:00Z')),filename=r.original_file||(r.source_pdf||p.name+'.pdf').split(/[\\/]/).pop();return `<article class="report-person" style="--person-color:${p.color}"><h3>${dot(i)}${esc(p.name)}</h3><p class="profile-meta">${esc(filename)} · ${esc(date)}<br>${ext(p.url,rp('Original online result','Resultado original on-line'))}</p>${reportBody(r)}</article>`;}).join('')}</div>`;
};

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
 host.className='note cube-hint';host.hidden=state.people.length<state.minimum;
 host.textContent=rp('Drag to rotate · pinch or scroll to zoom · double-click to reset.','Arraste para girar · pince ou role para ampliar · clique duas vezes para redefinir.');
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

Promise.resolve(JSON.parse(document.getElementById('embedded-data').textContent)).then(data=>{D=data;init();const a=document.querySelector('a[download="family-comparison-data.json"]');a.href=URL.createObjectURL(new Blob([JSON.stringify(D,(k,v)=>k==='localAsset'?undefined:v)],{type:'application/json'}));}).catch(err=>{console.error('Comparison failed to load',err);$('load-error').hidden=false;});

}catch(error){console.error(error);document.getElementById('loading-status').textContent='Could not load the atlas. Reload to retry. / Não foi possível carregar. Recarregue para tentar novamente.';}})();