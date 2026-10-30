/* FamilyStats — equal-weight comparisons for twelve 0–100 questionnaire axes.
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
