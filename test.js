/* Node test harness for the numerology engine.
 * Run:  node test.js
 * Validates the engine against the documented math, internal invariants,
 * and a frozen regression on a neutral example name.
 * (The engine was also validated offline against the original application's
 * reference charts; those name-specific fixtures are kept out of this repo.) */
var E = require('./engine.js');

var pass = 0, fail = 0;
function ok(name, cond, extra) {
  if (cond) { pass++; console.log('  ok  ' + name); }
  else { fail++; console.log('  FAIL ' + name + (extra ? '  -> ' + extra : '')); }
}
function eq(name, got, want) {
  ok(name + '  (got ' + JSON.stringify(got) + ', want ' + JSON.stringify(want) + ')',
     JSON.stringify(got) === JSON.stringify(want));
}

var NAME = 'EXAMPLE NAME';   // neutral example used throughout

console.log('\n=== 1. Letter -> number cipher ===');
eq('A -> 01',  E.name2num('A'),  '000000000001');
eq('AB',       E.name2num('AB').slice(-4), '0102');
eq('Z -> 26',  E.name2num('Z'),  '000000000026');
eq('CAB',      E.name2num('CAB'), '000000030102');
eq('spaces skipped', E.name2num('A B'), '000000000102');
eq('left-padded to >= 12', E.name2num('A').length >= 12, true);

console.log('\n=== 2. BASING digital-root (notes pages 2-5) ===');
function b1(s){ return E.basing(s,1)[1]; }
eq('B1(69873)=6', b1('69873'), '6');
eq('B1(277058)=2', b1('277058'), '2');
eq('B1(346931)=8', b1('346931'), '8');
eq('B1(79765)=7', b1('79765'), '7');
eq('B1(29784)=3', b1('29784'), '3');
eq('B1(2375720760)=3', b1('2375720760'), '3');
eq('B1(6384)=3', b1('6384'), '3');
eq('B1(6294)=3', b1('6294'), '3');
eq('B1(47632)=4', b1('47632'), '4');

console.log('\n=== 3. Name number = base-12 ===');
var nn = E.name2num(NAME);
var L = E.basing(nn, 12);
eq('base-12 reduction has 12 digits', L[12].length, 12);

console.log('\n=== 4. Pyramid sizes (notes pages 6-7) ===');
var sn = E.stringNum(nn);
var triDigits = 0;
for (var z = 1; z <= 12; z++) triDigits += sn.firstLevels[z].length;
eq('numerology triangle = 78 digits', triDigits, 78);
eq('NUM_STRING length = 365', sn.numString.length, 365);
ok('NUM_STRING starts with birth zero', sn.numString.charAt(0) === '0');
eq('pyramid (pre birth) = 364 digit-counts',
   sn.values.reduce(function(a,b){return a+b;},0), 364);

console.log('\n=== 5. Talent scores invariants ===');
var r = E.analyze(NAME);
eq('values total = 365', r.values.reduce(function(a,b){return a+b;},0), 365);
ok('scores ~ per-mille (sum near 1000)',
   Math.abs(r.scores.reduce(function(a,b){return a+b;},0) - 1000) <= 12,
   'sum=' + r.scores.reduce(function(a,b){return a+b;},0));
ok('every digit score = round(count*1000/365)',
   r.values.every(function(v,i){ return r.scores[i] === Math.floor(v*1000/365+0.5); }));
ok('spoke mirrors digit 5', r.spoke[5].digit===5 && r.spoke[6].digit===5);
ok('spoke mirrors digit 0', r.spoke[0].digit===0 && r.spoke[11].digit===0);

console.log('\n=== 6. Ranking (dominant -> subordinant) ===');
ok('ranked descending by count',
   r.ranked.every(function(x,i){ return i===0 || r.ranked[i-1].count >= x.count; }));
ok('ranked has 10 entries', r.ranked.length === 10);

console.log('\n=== 7. Centroid / soul angle ===');
ok('soul angle in [0,360)', r.soulAngle >= 0 && r.soulAngle < 360, r.soulAngle);
ok('quadrant resolved', !!r.quadrant.name);

console.log('\n=== 8. Bands (6 colour groups) ===');
eq('6 bands', r.bands.length, 6);
eq('band counts total = 365', r.bands.reduce(function(a,e){return a+e.count;},0), 365);

console.log('\n=== 9. Determinism / case-insensitivity ===');
eq('case-insensitive', E.analyze(NAME.toLowerCase()).scores, r.scores);
eq('punctuation ignored', E.analyze('EXAMPLE-NAME').scores, r.scores);

console.log('\n=== 10. Evolution kernel & pillars ===');
var evY = E.evolution(r, 'year');
var evA = E.evolution(r, 'age');
ok('year series returns rows', evY.rows.length > 0);
ok('age series returns rows', evA.rows.length > 0);
ok('column order is 9..0', JSON.stringify(evY.order) === JSON.stringify([9,8,7,6,5,4,3,2,1,0]));
ok('age axis ticks 0/30/60/90', JSON.stringify(evA.ticks.map(function(t){return t.label;})) === JSON.stringify([0,30,60,90]));
ok('year axis ticks Jan..Dec', evY.ticks.length === 12 && evY.ticks[0].label === 'JAN');
ok('kernel weight positive', E.kernelWeight(45) > 0);
var evA_other = E.evolution(E.analyze(NAME,{month:9,day:28}),'age');
ok('age series differs by birth date',
   JSON.stringify(evA.rows[20].ts) !== JSON.stringify(evA_other.rows[20].ts));
ok('soul angle date-independent',
   E.analyze(NAME,{month:9,day:28}).soulAngle === r.soulAngle);

console.log('\n=== 11. Frozen regression (locks engine behaviour) ===');
// Captured from the engine for the neutral name above. Any drift here means
// the math changed and should be reviewed.
eq('nameNum',    r.nameNum, '0524011316120514011305');
eq('base-12',    L[12], '121038022621');
eq('values',     r.values, [44,57,58,49,41,25,22,27,24,18]);
eq('scores',     r.scores, [121,156,159,134,112,68,60,74,66,49]);
eq('soul angle', r.soulAngle, 62);
eq('ranked',     r.ranked.map(function(x){return x.digit;}), [2,1,3,0,4,7,5,8,6,9]);

console.log('\n----- ' + NAME + ' full result -----');
console.log('name number :', r.nameNum);
console.log('digit scores:', r.scores.join(' '));
console.log('ranked      :', r.ranked.map(function(x){return x.digit+':'+x.score;}).join('  '));
console.log('soul angle  :', r.soulAngle, '(' + r.quadrant.name + ')');

console.log('\n========================================');
console.log('   ' + pass + ' passed, ' + fail + ' failed');
console.log('========================================\n');
process.exit(fail ? 1 : 0);
