'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const stats = require('./statistics.js');

function close(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from expected ${expected}`);
}
function profile(value) { return Array(12).fill(value); }
function separation(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

// Robust summaries, including a deliberately extreme observation and small n.
assert.equal(stats.mean([]), null);
assert.equal(stats.median([]), null);
assert.equal(stats.axisStats([]).n, 0);
assert.equal(stats.axisStats([]).leaveOneOutMedianMaxShift, null);
assert.equal(stats.axisStats([42]).median, 42);
assert.equal(stats.axisStats([42]).iqr, 0);
assert.equal(stats.axisStats([42]).leaveOneOutMedianMaxShift, null);
assert.equal(stats.median([0, 2, 4, 100]), 3);
assert.equal(stats.mean([0, 2, 4, 100]), 26.5);
assert.equal(stats.quantile([0, 2, 4, 100], 0.25), 1.5);
assert.equal(stats.quantile([0, 2, 4, 100], 0.75), 28);
assert.equal(stats.quantile([0, 10], 0.25), 2.5);
assert.equal(stats.quantile([10, 0], 1), 10);
assert.equal(stats.axisStats([0, 2, 4, 100]).mad, 2);
assert.equal(stats.axisStats([0, 2, 4, 100]).spread, 100);
assert.equal(stats.axisStats([0, 2, 4, 100]).leaveOneOutMedianMaxShift, 1);
assert.equal(stats.axisStats([0, 100]).leaveOneOutMedianMaxShift, 50);
assert.throws(() => stats.mean([0, NaN]), TypeError);
assert.throws(() => stats.quantile([0], 2), RangeError);
const unsorted = [8, 2, 4];
stats.axisStats(unsorted);
assert.deepEqual(unsorted, [8, 2, 4]);

// Distances use every axis, preserve the original 0–100 scale, and distinguish L1/RMS.
assert.equal(stats.meanAbsoluteDistance(profile(0), profile(100)), 100);
assert.equal(stats.rmsDistance(profile(0), profile(100)), 100);
const singleAxis = profile(0);
singleAxis[0] = 12;
assert.equal(stats.meanAbsoluteDistance(profile(0), singleAxis), 1);
close(stats.rmsDistance(profile(0), singleAxis), Math.sqrt(12));
assert.equal(stats.meanAbsoluteDistance(profile(41), profile(41)), 0);
assert.throws(() => stats.pairwise([[1, 2]]), RangeError);
assert.throws(() => stats.pairwise([profile(101)]), RangeError);
assert.throws(() => stats.pairwise([profile(null)]), TypeError);
assert.deepEqual(stats.pairwise([]).rms, []);
assert.deepEqual(stats.pairwise([profile(50)]).rms, [[0]]);

// Medoid always denotes an actual profile, explicitly retaining ties.
assert.equal(stats.medoid([]), null);
const people = [
  { id: 'a', scores: profile(10) },
  { id: 'b', scores: profile(20) },
  { id: 'c', scores: profile(90) }
];
assert.equal(stats.medoid(people).profile, people[1]);
assert.equal(stats.medoid(people).sumDistance, 80);
assert.equal(stats.medoid(people).averageDistance, 40);
assert.deepEqual(stats.medoid(people.slice(0, 2)).tiedIds, ['a', 'b']);
assert.equal(stats.medoid(people.slice(0, 1)).averageDistance, 0);
assert.equal(stats.summarizeProfiles(people).axes.est.median, 20);
const keyed = Object.fromEntries(stats.AXES.map(axis => [axis, 50]));
assert.equal(stats.rmsDistance({ name: 'keyed', scores: keyed }, profile(50)), 0);

// Empty, singleton, two-point, and identical-profile geometry is well defined.
assert.deepEqual(stats.classicalMDS([]).coordinates, []);
assert.equal(stats.classicalMDS([]).explainedPercent, 0);
assert.deepEqual(stats.classicalMDS([profile(30)]).coordinates, [[0, 0]]);
assert.equal(stats.classicalMDS([profile(30)]).degenerate, true);
const identical = stats.classicalMDS([profile(30), profile(30)]);
assert.deepEqual(identical.coordinates, [[0, 0], [0, 0]]);
assert.equal(identical.explainedPercent, 100);
assert.equal(identical.stress, 0);
const two = stats.classicalMDS([profile(10), profile(70)]);
close(separation(...two.coordinates), 60);
close(two.coordinates[0][0] + two.coordinates[1][0], 0);
close(two.explainedPercent, 100);
close(two.stress, 0);

// A planar right triangle preserves all distances, regardless of translation.
const triangle = [profile(20), profile(20), profile(20)];
triangle[1][0] += 12;
triangle[2][1] += 16;
const embedded = stats.classicalMDS(triangle);
const shifted = stats.classicalMDS(triangle.map(row => row.map(value => value + 30)));
close(embedded.explainedPercent, 100);
close(embedded.stress, 0);
for (let i = 0; i < triangle.length; i++) {
  for (let j = 0; j < triangle.length; j++) {
    close(embedded.projectedDistances[i][j], embedded.distances[i][j]);
    close(embedded.distances[i][j], shifted.distances[i][j]);
    close(embedded.projectedDistances[i][j], shifted.projectedDistances[i][j]);
  }
}

// A regular tetrahedron has three equal components: two dimensions retain 2/3.
const tetrahedron = [
  [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]
].map(point => point.map(value => value * 10 + 50).concat(Array(9).fill(50)));
const tetra = stats.classicalMDS(tetrahedron);
close(tetra.explainedPercent, 200 / 3);
assert.ok(tetra.stress > 0);
const tetra3=stats.classicalMDS(tetrahedron,3);
close(tetra3.explainedPercent,100);
close(tetra3.stress,0);
for(let i=0;i<4;i++)for(let j=0;j<4;j++)close(tetra3.projectedDistances[i][j],tetra3.distances[i][j]);
assert.deepEqual(stats.classicalMDS([profile(30),profile(30)],3).coordinates,[[0,0,0],[0,0,0]]);
close(tetra.negativeEigenvalueMagnitude, 0);
const originalSquaredTotal = tetra.distances.flat().reduce((sum, value) => sum + value * value, 0);
const projectedSquaredTotal = tetra.projectedDistances.flat().reduce((sum, value) => sum + value * value, 0);
close(100 * projectedSquaredTotal / originalSquaredTotal, tetra.explainedPercent);

// Real input is valid for all selection sizes; original RMS distances are returned.
const family = JSON.parse(fs.readFileSync('evidence/html-embedded-data.json','utf8')).people.map(p=>({id:p.name,scores:p.values}));
// Compass depth is traditionalism only: religion cannot change any coordinate.
const neutral=stats.compassCoordinates(profile(50));
assert.deepEqual(neutral,{right:50,authority:50,traditional:50});
const progressive=profile(50);progressive[10]=100;
close(stats.compassCoordinates(progressive).traditional,0);
const traditional=profile(50);traditional[10]=0;
close(stats.compassCoordinates(traditional).traditional,100);
for(const person of family){
 const coordinates=stats.compassCoordinates(person);
 for(const religion of [0,25,50,75,100]){
  const changed=[...person.scores];changed[9]=religion;
  assert.deepEqual(stats.compassCoordinates(changed),coordinates);
 }
}
const juliaCompass=stats.compassCoordinates(family.find(p=>p.id==='Julia'));
close(juliaCompass.right,41.98);close(juliaCompass.authority,185.9/3);
close(juliaCompass.traditional,92);
close(stats.compassCoordinates(family.find(p=>p.id==='Victor')).traditional,88.1);
close(stats.compassCoordinates(family.find(p=>p.id==='Rafael')).traditional,36.9);
for (let mask = 0; mask < (1 << family.length); mask++) {
  const selected = family.filter((_, i) => mask & (1 << i));
  const result = stats.classicalMDS(selected);
  assert.equal(result.coordinates.length, selected.length);
  assert.ok(result.coordinates.flat().every(Number.isFinite));
  assert.ok(result.explainedPercent >= 0 && result.explainedPercent <= 100);
  assert.deepEqual(result.distances, stats.pairwise(selected).rms);
  if (selected.length && selected.length < 4) close(result.explainedPercent, 100);
  const three=stats.classicalMDS(selected,3);
  assert.ok(three.coordinates.every(p=>p.length===3&&p.every(Number.isFinite)));
  assert.deepEqual(three.distances,result.distances);
  assert.ok(three.explainedPercent+1e-8>=result.explainedPercent);
  assert.ok(three.stress<=result.stress+1e-8);
  if(selected.length&&selected.length<5)close(three.explainedPercent,100);
}
close(stats.classicalMDS(family,3).explainedPercent,81.2417178289819);
close(stats.classicalMDS(family,3).stress,.18065666747387774);
assert.throws(()=>stats.classicalMDS(family,0),RangeError);
assert.throws(()=>stats.classicalMDS(family,2.5),RangeError);
assert.throws(() => stats.mdsFromDistances([[0, 1], [2, 0]]), RangeError);
assert.throws(() => stats.mdsFromDistances([[0, -1], [-1, 0]]), RangeError);

// The browser build exposes the same API without depending on a module loader.
const browser = {};
vm.createContext(browser);
vm.runInContext(fs.readFileSync(require.resolve('./statistics.js'), 'utf8'), browser);
assert.equal(browser.FamilyStats.median([1, 5, 9]), 5);

console.log(`FamilyStats: robust summaries, distance matrices, medoids, MDS, all ${1 << family.length} family selection states, and browser export passed.`);
console.log(JSON.stringify({ familyMedoid: stats.medoid(family).id, familyMDSExplainedPercent: stats.classicalMDS(family).explainedPercent, familyMDSStress: stats.classicalMDS(family).stress }, null, 2));
