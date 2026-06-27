/* =====================================================================
 * NUMEROLOGY ENGINE — NAMEMAN
 * ---------------------------------------------------------------------
 * Pure, DOM-free math. Works in the browser (window.NumEngine) and in
 * Node (module.exports) so the same code is used by the app AND the tests.
 *
 * The algorithm:
 *   1. NAME -> NUMBER     : A=01..Z=26, ordinal, 2-digit, concatenated.
 *   2. NAME NUMBER        : left-pad concatenation to >= 12 digits.
 *   3. BASING(s, level)   : generalised digital-root. For each base Z
 *                           (1..level) fold the last Z digits onto the
 *                           rest (add as numbers) until length <= Z.
 *   4. NUMEROLOGY TRIANGLE: FIRST_LEVELS(Z) = base-Z of the name number,
 *                           Z = 1..12  -> 1+2+..+12 = 78 digits.
 *   5. 3D PYRAMID         : for each triangle row, build its own triangle
 *                           -> SECOND_LEVELS. Sum of triangular numbers
 *                           1..12 = 364 digits.  +1 "birth zero" = 365.
 *   6. TALENTS            : VALUES[d] = count of digit d in the 365-digit
 *                           pyramid (the leading birth-zero counts for 0).
 *                           score[d] = round(VALUES[d] * 1000 / 365).
 *   7. STAR / PLANETS     : 12 spokes (digit 0 and 5 are mirrored) at
 *                           angles 15+30*j; radius proportional to score;
 *                           centre distance = radius / sin15 so each
 *                           circle kisses the walls of its 30-deg sector.
 *   8. CENTROID / SUN     : area-weighted (pi*R^2) balance point of the 12
 *                           talent circles -> soul angle (0..360) -> quadrant.
 *   9. EVOLUTION          : 1/distance kernel smoothing of the 365-ring,
 *                           read at every "day", giving each digit a curve.
 * ===================================================================== */
(function (root) {
  'use strict';

  var PI = 3.141592654;            // truncated value used for parity
  var DE = PI / 180;

  // ---- Int(): truncate toward -infinity. All our inputs are >= 0. ----
  function vbInt(x) { return Math.floor(x); }
  // Int(x*1000/365 + .5) rounding used throughout for scores.
  function score1000(count) { return vbInt(count * 1000 / 365 + 0.5); }

  /* ----------------------------------------------------------------
   * BASING(START_STR, LEVEL)  ->  { 1: s1, 2: s2, ... LEVEL: sLevel }
   * The basing reduction, char for char.
   * ---------------------------------------------------------------- */
  function basing(startStr, level) {
    var levels = {};
    for (var Z = 1; Z <= level; Z++) {
      var S = startStr;
      var L = S.length;
      while (L > Z) {
        var sLeft = S.substring(0, L - Z);   // Left(S, L - Z)
        var sRight = S.substring(L - Z);      // Right(S, Z)
        var L1 = Z;
        if (sLeft.length > L1) L1 = sLeft.length;
        var result2 = '';
        var carry = 0;
        for (var Z1 = 1; Z1 <= L1; Z1++) {
          var num1 = 0, num2 = 0;
          if (Z1 <= sRight.length) num1 = +sRight.charAt(sRight.length - Z1) || 0;
          if (Z1 <= sLeft.length) num2 = +sLeft.charAt(sLeft.length - Z1) || 0;
          var answer = num1 + num2 + carry;
          var result1 = String(answer);
          result2 = result1.charAt(result1.length - 1) + result2;
          carry = 0;
          if (result1.length > 1) carry = +result1.substring(0, result1.length - 1);
        }
        if (carry > 0) {
          var rc = String(carry);
          result2 = rc.charAt(rc.length - 1) + result2;  // keep only the last carry digit
        }
        S = result2;
        L = S.length;
      }
      levels[Z] = S;
    }
    return levels;
  }

  /* ----------------------------------------------------------------
   * NAME2NUM : "CAB" -> "030102", padded left to >= 12 digits.
   * ---------------------------------------------------------------- */
  function name2num(name) {
    name = String(name).toUpperCase();
    var nameNum = '';
    for (var i = 0; i < name.length; i++) {
      var v = name.charCodeAt(i) - 64;       // A=1 .. Z=26
      if (v < 1 || v > 26) continue;          // skip spaces / punctuation
      var s = String(v);
      if (s.length === 1) s = '0' + s;
      nameNum += s;
    }
    if (nameNum.length > 0) {
      while (nameNum.length < 12) nameNum = '0' + nameNum;
    }
    return nameNum;
  }

  /* ----------------------------------------------------------------
   * STRING_NUM : build the pyramid, count digits -> VALUES, NUM_STRING.
   * Returns the raw VALUES (BEFORE the +1 birth zero) plus structures.
   * ---------------------------------------------------------------- */
  function stringNum(nameNum) {
    var values = [0,0,0,0,0,0,0,0,0,0];
    var firstLevels = basing(nameNum, 12);           // FIRST_LEVELS(1..12)
    var secondLevels = {};                            // "Z1,Z" -> string
    var triangle = [];                               // pretty triangle rows
    for (var Z = 1; Z <= 12; Z++) {
      var lv = basing(firstLevels[Z], Z);
      var rowSet = [];
      for (var Z1 = 1; Z1 <= Z; Z1++) {
        var s = lv[Z1];
        secondLevels[Z1 + ',' + Z] = s;
        rowSet.push(s);
        for (var Z2 = 1; Z2 <= Z1; Z2++) {
          var ch = s.charAt(Z2 - 1);                 // Mid(s, Z2, 1)
          var j = ch === '' ? 0 : +ch;
          values[j]++;
        }
      }
      triangle.push(rowSet);
    }
    var numString = '0';                              // leading birth zero
    for (var Za = 1; Za <= 12; Za++) {
      for (var Zb = 1; Zb <= Za; Zb++) {
        var s2 = secondLevels[Zb + ',' + Za];
        for (var Zc = 1; Zc <= Zb; Zc++) numString += s2.charAt(Zc - 1);
      }
    }
    return {
      values: values,
      numString: numString,
      firstLevels: firstLevels,
      secondLevels: secondLevels,
      triangle: triangle
    };
  }

  /* ----------------------------------------------------------------
   * ARCTAN(x, y) : 4-quadrant angle in radians.
   * ---------------------------------------------------------------- */
  function arctan(x, y) {
    if (Math.abs(x) < 0.000001) x = 0;
    if (x === 0 && y === 0) return 0;
    if (x === 0 && y > 0) return PI / 2;
    if (x === 0 && y < 0) return 1.5 * PI;
    if (x > 0 && y === 0) return 0;
    if (x < 0 && y === 0) return PI;
    if (x < 0 && y < 0) return PI + Math.atan(y / x);
    if (x < 0 && y > 0) return PI + Math.atan(y / x);
    if (x > 0 && y < 0) return 2 * PI + Math.atan(y / x);
    return Math.atan(y / x);
  }

  // 12-spoke mapping of the 10 digits (digit 5 and 0 are mirrored).
  // index j -> source digit
  var SPOKE_DIGIT = [0,1,2,3,4,5,5,6,7,8,9,0];

  /* ----------------------------------------------------------------
   * CALC_CENTER : area-weighted centroid of 12 circles whose radii are
   * the scaled CEN[] values, placed at angles 15+30*j.
   * cen = array of 12 radii.  Returns {centX, centY, totArea}.
   * ---------------------------------------------------------------- */
  function calcCenter(cen) {
    var H = Math.sin(15 * DE);
    var totArea = 0, xT = 0, yT = 0;
    for (var j = 0; j < 12; j++) {
      var A = 15 + 30 * j;
      var S = Math.sin(A * DE), C = Math.cos(A * DE);
      var R = cen[j];
      var area = PI * R * R;
      totArea += area;
      var RA = R / H;
      xT += (RA * S) * area;
      yT += (RA * C) * area;
    }
    return {
      centX: totArea ? xT / totArea : 0,
      centY: totArea ? -yT / totArea : 0,
      totArea: totArea
    };
  }

  // Quadrant of the "projection pattern" from the soul angle (deg).
  // Page 9 only specifies the angle's quadrant (cross at 0/90/180/270);
  // it carries no season/zodiac names, so quadrants are labelled neutrally.
  function quadrant(angleDeg) {
    var a = ((angleDeg % 360) + 360) % 360;
    var idx = Math.floor(a / 90) % 4;
    var names = ['Quadrant I', 'Quadrant II', 'Quadrant III', 'Quadrant IV'];
    var ranges = ['0° to 90°', '90° to 180°', '180° to 270°', '270° to 360°'];
    return { name: names[idx], range: ranges[idx], index: idx };
  }

  // Calendar: day-of-year angle.
  var MONTH_OFFSET = [0,0,31,59,90,120,151,181,212,243,273,304,334]; // 1-indexed
  var MONTH_NAMES = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                     'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  function dateAngle(monthNum, dayNum) {
    // Add a fixed 11-day offset, then the day of month.
    return MONTH_OFFSET[monthNum] + 11 + dayNum;
  }

  /* ----------------------------------------------------------------
   * Kernel used by EVOLUTION / CENTROIDS / SOUL_STAR.
   * A=1, B=0.349191862 ; weight of a ring day at angular separation
   * theta is 1/distance, distance from law of cosines between radii
   * A and A+B separated by theta.
   * ---------------------------------------------------------------- */
  var KA = 1, KB = 0.349191862;
  function kernelWeight(thetaDeg) {
    var d = KA * KA + (KA + KB) * (KA + KB)
          - 2 * KA * (KA + KB) * Math.cos(thetaDeg * DE);
    return Math.pow(1 / d, 0.5);   // 1/distance
  }

  // Compute TIME_SIZES_MULT (normaliser) so the kernel reproduces VALUES
  // at the birth angle. values = VALUES array (after +1 birth zero).
  function timeMult(numString, angle, values) {
    var mult = [0,0,0,0,0,0,0,0,0,0];
    for (var z1 = 0; z1 <= 364; z1++) {
      var val = +numString.charAt(z1);
      var theta = Math.abs(angle - z1) / 365 * 360;
      mult[val] += kernelWeight(theta);
    }
    for (var z = 0; z <= 9; z++) if (mult[z] > 0) mult[z] = values[z] / mult[z];
    return mult;
  }

  // TIME_SIZES at observation day "obs" (0..364 ring index).
  function timeSizesAt(numString, obs, mult) {
    var ts = [0,0,0,0,0,0,0,0,0,0];
    for (var z1 = 0; z1 <= 364; z1++) {
      var val = +numString.charAt(z1);
      var theta = Math.abs(obs - z1) / 365 * 360;
      ts[val] += kernelWeight(theta);
    }
    for (var z = 0; z <= 9; z++) ts[z] *= mult[z];
    return ts;
  }

  // KARMA shade index (1..5) from EVOLUTION, comparing v to v0 (digit0) & v5.
  function karmaOf(v, v0, v5) {
    var k = 1;
    if (v0 >= v) k = 1;
    if (v5 > v0 && v0 >= v) k = 2;
    if (v > v0 && v > v5) k = 3;
    if (v0 > v5 && v5 >= v) k = 4;
    if (v5 >= v && v > v0) k = 5;
    if (v0 === v5 && v === v5) k = 5;
    return 6 - k;
  }

  /* ================================================================
   * analyze(name, [opts]) -> full result object
   * opts: { month: 1..12, day: 1..31 }  (defaults Jan 1)
   * ================================================================ */
  function analyze(name, opts) {
    opts = opts || {};
    var monthNum = opts.month || 1;
    var dayNum = opts.day || 1;
    var angle = dateAngle(monthNum, dayNum);

    var nameNum = name2num(name);
    var sn = stringNum(nameNum);
    var rawValues = sn.values.slice();      // counts in the 364 pyramid digits
    var values = sn.values.slice();
    values[0] += 1;                          // PLOT: VALUES(0) = VALUES(0) + 1

    // scores (parts per thousand) for digits 0..9
    var scores = values.map(score1000);
    var maxScore = Math.max.apply(null, scores);

    // 12-spoke (planet) values + colours
    var spoke = [];
    for (var j = 0; j < 12; j++) {
      var d = SPOKE_DIGIT[j];
      spoke.push({ index: j, digit: d, score: scores[d], angle: 15 + 30 * j });
    }

    // ranked talents (bubble sort, descending, stable on ties)
    var sort = [];
    for (var z = 0; z < 10; z++) sort.push([z, values[z]]);
    for (var a = 0; a < 10; a++) {
      for (var b = 0; b < 9; b++) {
        if (sort[b + 1][1] > sort[b][1]) {
          var t = sort[b + 1]; sort[b + 1] = sort[b]; sort[b] = t;
        }
      }
    }
    var ranked = sort.map(function (r) {
      return { digit: r[0], count: r[1], score: score1000(r[1]) };
    });

    // centroid / soul angle  (CEN = VALUES mapped to 12 spokes, scaled)
    var cen = [];
    for (var k = 0; k < 12; k++) cen.push(score1000(values[SPOKE_DIGIT[k]]));
    var cc = calcCenter(cen);
    var printAngle = arctan(cc.centX, cc.centY) * 180 / PI + 90;
    printAngle = vbInt(printAngle + 0.5);
    if (printAngle >= 360) printAngle -= 360;
    if (printAngle < 0) printAngle += 360;

    // 6 colour bands. Each band has a DIMENSION name, an ELEMENT name and
    // its LOVES / POWERS trait words.
    // purple{0}, blue{1,9}, green{2,8}, yellow{3,7}, orange{4,6}, red{5}
    var bands = BANDS.map(function (b) {
      var total = b.digits.reduce(function (s, d) { return s + values[d]; }, 0);
      return {
        color: b.color, digits: b.digits,
        dimension: b.dimension, element: b.element,
        loves: b.loves, powers: b.powers,
        count: total, score: score1000(total)
      };
    });

    return {
      name: name,
      nameNum: nameNum,
      angle: angle,
      monthNum: monthNum,
      monthName: MONTH_NAMES[monthNum - 1],
      dayNum: dayNum,
      numString: sn.numString,
      triangle: sn.triangle,
      firstLevels: sn.firstLevels,
      rawValues: rawValues,
      values: values,
      scores: scores,
      maxScore: maxScore,
      spoke: spoke,
      ranked: ranked,
      bands: bands,
      centroid: { x: cc.centX, y: cc.centY, totArea: cc.totArea },
      soulAngle: printAngle,
      quadrant: quadrant(printAngle)
    };
  }

  // digit -> band index (0 purple .. 5 red), mirror pairs share a band
  var DIGIT_BAND = [0, 1, 2, 3, 4, 5, 4, 3, 2, 1];

  /* ----------------------------------------------------------------
   * reading(result) -> a written narrative, in the source's own
   * vocabulary (SOULAR SYSTEM / TALENTS / DIMENSIONS / ELEMENTS /
   * FEELINGS vs FORCES / LOVES vs POWERS / magnetic direction).
   * Returns [{ title, text }] paragraphs.
   * ---------------------------------------------------------------- */
  function reading(result) {
    var R = result, P = [];
    var bandOf = function (d) { return R.bands[DIGIT_BAND[d]]; };
    var top = R.ranked[0], top2 = R.ranked[1], top3 = R.ranked[2];
    var low = R.ranked[9], low2 = R.ranked[8];
    var first = R.name.split(/\s+/)[0] || R.name;

    // dominant band (strongest colour group)
    var domBand = R.bands.slice().sort(function (a, b) { return b.score - a.score; })[0];
    var subBand = R.bands.slice().sort(function (a, b) { return a.score - b.score; })[0];

    P.push({ title: 'Your Soular System', text:
      'The name ' + R.name.toUpperCase() + ' holds a Soular System of ten talents. ' +
      'Each one works like a planet with its own weight, drawn from a 365-digit pattern your ' +
      'name produces, one digit for every day of the year. The brighter a talent, the more it ' +
      'shapes who you are. Your strongest is talent ' + top.digit + ' (' +
      DIGIT_DIMENSION[top.digit].toLowerCase() + ', ' + DIGIT_ELEMENT[top.digit].toLowerCase() +
      '), which scores ' + top.score + ' out of 1000.' });

    P.push({ title: 'Dominant Talents: Your Forces', text:
      'Your dominant talents are ' + top.digit + ', ' + top2.digit + ' and ' + top3.digit + '. ' +
      'Talent ' + top.digit + ' gives you powers of ' + bandOf(top.digit).powers.join(', ').toLowerCase() +
      '. Talent ' + top2.digit + ' adds ' + bandOf(top2.digit).powers.join(', ').toLowerCase() + '. ' +
      'These are the Forces of your name, the active gifts you lead with.' });

    P.push({ title: 'Subordinant Talents: Quiet Ground', text:
      'Talents ' + low.digit + ' and ' + low2.digit + ' sit lowest, at ' + low.score + ' and ' + low2.score +
      '. On the wheel, anything under 100 stays inside the dark inner zone. These are hidden or ' +
      'still-forming talents rather than weaknesses. Your ' + bandOf(low.digit).element.toLowerCase() +
      ' nature is understated here, an area to grow into rather than rely on.' });

    P.push({ title: 'Feelings and Loves', text:
      'Your most present colour is ' + domBand.dimension.toLowerCase() + ', the ' +
      domBand.element.toLowerCase() + ' element, which scores ' + domBand.score + '. On the receptive ' +
      'side, your Feelings, this draws you toward ' + domBand.loves.join(', ').toLowerCase() +
      '. Your least present colour is the ' + subBand.dimension.toLowerCase() + ' band.' });

    P.push({ title: 'Soul Angle and Magnetic Direction', text:
      'The balance point of all your talents is the white sun at the centre of the wheel. ' +
      'It sits at a soul angle of ' + R.soulAngle + '°, which places your projection pattern in ' +
      R.quadrant.name + ' (' + R.quadrant.range + '). This is your magnetic direction. ' +
      'Your name sets it on its own. Your birth date does not move it. It only changes how your ' +
      'talents rise and fall across the years.' });

    return P;
  }

  // ---- Compatibility between two analyses ---------------------------
  // Pearson correlation of the 10 talent-score vectors -> 0..100 closeness
  // (100 = identical profile, 50 = unrelated, 0 = opposite). Plus the
  // circular gap between soul angles and the shared dominant talents.
  function compare(a, b) {
    var sa = a.scores, sb = b.scores, n = 10;
    var ma = 0, mb = 0, i;
    for (i = 0; i < n; i++) { ma += sa[i]; mb += sb[i]; }
    ma /= n; mb /= n;
    var dot = 0, va = 0, vb = 0;
    for (i = 0; i < n; i++) { var da = sa[i] - ma, db = sb[i] - mb; dot += da * db; va += da * da; vb += db * db; }
    var r = (va && vb) ? dot / Math.sqrt(va * vb) : 0;
    var closeness = Math.round(((r + 1) / 2) * 100);
    var ad = Math.abs(a.soulAngle - b.soulAngle); if (ad > 180) ad = 360 - ad;
    var topA = a.ranked.slice(0, 3).map(function (x) { return x.digit; });
    var topB = b.ranked.slice(0, 3).map(function (x) { return x.digit; });
    var shared = topA.filter(function (d) { return topB.indexOf(d) > -1; });
    return { closeness: closeness, correlation: r, angleDelta: ad, shared: shared };
  }

  /* ----------------------------------------------------------------
   * EVOLUTION / "Future Development" pillar series.  Faithful to the two
   * the two evolution charts:
   *   mode 'age'  -> J = 0..90,  ring = (J + ANGLE) mod 365   (date-driven!)
   *                 axis = AGE, gridlines at 30/60/90.
   *   mode 'year' -> J = 0..364, ring = (J + 11)   mod 365    (calendar)
   *                 axis = months Jan..Dec.
   * Both share the birth-day normaliser MULT (so the date also tilts the
   * calendar magnitudes). Each row carries the 10 widths (ts) + karma shade.
   * pos is the 0..1 coordinate down the time axis.
   * ---------------------------------------------------------------- */
  function evolution(result, mode, samples) {
    mode = mode || 'year';
    var values = result.values;
    var numString = result.numString;
    var angle = result.angle;
    var mult = timeMult(numString, angle, values);

    var jMax = (mode === 'age') ? 90 : 364;
    var offset = (mode === 'age') ? angle : 11;
    if (!samples) samples = (mode === 'age') ? 91 : 183;

    var rows = [];
    var maxTs = 0;
    for (var i = 0; i < samples; i++) {
      var J = Math.round(i * jMax / (samples - 1));
      var ring = (J + offset) % 365;
      var ts = timeSizesAt(numString, ring, mult);
      var karma = [];
      for (var d = 0; d <= 9; d++) {
        karma.push(karmaOf(ts[d], ts[0], ts[5]));
        if (ts[d] > maxTs) maxTs = ts[d];
      }
      rows.push({ J: J, pos: J / jMax, ts: ts, karma: karma });
    }
    // axis ticks
    var ticks = [];
    if (mode === 'age') {
      [0, 30, 60, 90].forEach(function (a) { ticks.push({ pos: a / 90, label: a }); });
    } else {
      for (var m = 0; m < 12; m++)
        ticks.push({ pos: MONTH_OFFSET[m + 1] / 365, label: MONTH_NAMES[m].slice(0, 3) });
    }
    // birth profile = first row (the coloured cap)
    return {
      mode: mode, rows: rows, maxTs: maxTs, ticks: ticks,
      cap: rows[0].ts.slice(), mult: mult,
      // column order, left -> right: 9 8 7 6 5 4 3 2 1 0
      order: [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    };
  }

  // Colour palette (matches SET_COLORS RGB values exactly).
  var COLORS = {
    red:    'rgb(255,102,102)',
    orange: 'rgb(255,179,102)',
    yellow: 'rgb(255,255,102)',
    green:  'rgb(153,255,128)',
    blue:   'rgb(102,178,255)',
    purple: 'rgb(178,102,255)'
  };
  // colour for digit 0..9 (mirror rainbow): 0 P,1 B,2 G,3 Y,4 O,5 R,6 O,7 Y,8 G,9 B
  var DIGIT_COLORS = [
    COLORS.purple, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.orange,
    COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green, COLORS.blue
  ];
  // colour for the 12 spokes: adds mirror endpoints (5->red, 0->purple).
  var SPOKE_COLORS = [
    COLORS.purple, COLORS.blue, COLORS.green, COLORS.yellow, COLORS.orange,
    COLORS.red, COLORS.red, COLORS.orange, COLORS.yellow, COLORS.green,
    COLORS.blue, COLORS.purple
  ];

  // The six colour bands. DIMENSIONS / ELEMENTS / LOVES / POWERS taxonomy,
  // transcribed verbatim from the printed NAMEMAN report.
  var BANDS = [
    { color: COLORS.purple, digits: [0],    dimension: 'SPIRITUAL',
      element: 'VOID',  loves: ['Peace','Contentment','Simplicity'],
      powers: ['Originality','Innovation','Wisdom'] },
    { color: COLORS.blue,   digits: [1, 9], dimension: 'INTUITIONAL',
      element: 'SPACE', loves: ['Empathy','Insight','Understanding'],
      powers: ['Initiative','Motivation','Inspiration'] },
    { color: COLORS.green,  digits: [2, 8], dimension: 'INTELLECTUAL',
      element: 'AIR',   loves: ['Inquiry','Knowledge','Learning'],
      powers: ['Leadership','Analysis','Organization'] },
    { color: COLORS.yellow, digits: [3, 7], dimension: 'SENSUAL',
      element: 'FIRE',  loves: ['Perceptiveness','Appreciation','Sensitivity'],
      powers: ['Creativity','Artistry','Business'] },
    { color: COLORS.orange, digits: [4, 6], dimension: 'ENERGETIC',
      element: 'WATER', loves: ['Conquest','Challenge','Passion'],
      powers: ['Work','Energy','Action'] },
    { color: COLORS.red,    digits: [5],    dimension: 'PHYSICAL',
      element: 'EARTH', loves: ['Desire','Fame','Prestige'],
      powers: ['Strength','Ambition','Domination'] }
  ];
  // digit -> dimension / element name (for labels & tooltips)
  var DIGIT_DIMENSION = ['SPIRITUAL','INTUITIONAL','INTELLECTUAL','SENSUAL','ENERGETIC',
                         'PHYSICAL','ENERGETIC','SENSUAL','INTELLECTUAL','INTUITIONAL'];
  var DIGIT_ELEMENT   = ['VOID','SPACE','AIR','FIRE','WATER',
                         'EARTH','WATER','FIRE','AIR','SPACE'];

  var api = {
    PI: PI, DE: DE,
    BANDS: BANDS, DIGIT_DIMENSION: DIGIT_DIMENSION, DIGIT_ELEMENT: DIGIT_ELEMENT,
    vbInt: vbInt, score1000: score1000,
    basing: basing, name2num: name2num, stringNum: stringNum,
    arctan: arctan, calcCenter: calcCenter, dateAngle: dateAngle,
    quadrant: quadrant, kernelWeight: kernelWeight,
    analyze: analyze, evolution: evolution, compare: compare, reading: reading,
    DIGIT_BAND: DIGIT_BAND,
    SPOKE_DIGIT: SPOKE_DIGIT, COLORS: COLORS,
    DIGIT_COLORS: DIGIT_COLORS, SPOKE_COLORS: SPOKE_COLORS,
    MONTH_NAMES: MONTH_NAMES
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumEngine = api;

})(typeof window !== 'undefined' ? window : globalThis);
