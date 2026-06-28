/* =====================================================================
 * NUMEROLOGY CHARTS — NAMEMAN
 * Every chart is generated from the engine result with pure geometry.
 * Each function returns an SVG/HTML string for v-html binding.
 * All renderers accept an optional theme (DARK default / LIGHT).
 * ===================================================================== */
(function (root) {
  'use strict';
  var E = root.NumEngine || (typeof require !== 'undefined' && require('./engine.js'));
  var DE = Math.PI / 180;
  var H = Math.sin(15 * DE);              // sin 15deg = 0.258819

  // ---- themes --------------------------------------------------------
  var THEMES = {
    dark: {
      bg: '#0b0b14', ink: '#cfd2e0', muted: '#8a8fa8', grid: '#23233a',
      track: '#1b1b28', rimText: '#000', innerZone: '#11111b',
      blackZone: '#05050a', sun: '#ffffff', sunInk: '#000', edge: '#000',
      pillarBg: '#0b0b14'
    },
    light: {
      bg: '#ffffff', ink: '#2a2d3a', muted: '#8a8fa8', grid: '#dfe0ee',
      track: '#ececf5', rimText: '#222', innerZone: '#e7e8f3',
      blackZone: '#cfd0e0', sun: '#ffffff', sunInk: '#000', edge: '#222',
      pillarBg: '#f6f6fc'
    }
  };
  function theme(opt) {
    if (opt && opt.theme && THEMES[opt.theme]) return THEMES[opt.theme];
    if (typeof opt === 'string' && THEMES[opt]) return THEMES[opt];
    return THEMES.dark;
  }

  /* ---- SOUL STAR : the planet wheel ------------------------------- */
  function starChart(r, opt) {
    var T = theme(opt);
    var MX = 320, MY = 256;
    var MAX = r.maxScore || 1;
    var M = 0.22 * 190 / MAX;             // scaling: largest planet -> 41.8px
    var s = [];
    s.push('<svg viewBox="0 0 640 512" class="starsvg" xmlns="http://www.w3.org/2000/svg">');
    s.push('<rect x="0" y="0" width="640" height="512" fill="' + T.bg + '"/>');

    // coloured rim annulus: 12 arcs (mirror rainbow), one per sector
    var rimOuter = 232, rimInner = 204;
    for (var j = 0; j < 12; j++) {
      var a0 = (30 * j - 90) * DE, a1 = (30 * j + 30 - 90) * DE;
      s.push('<path d="' + annulusPath(MX, MY, rimInner, rimOuter, a0, a1) +
             '" fill="' + E.SPOKE_COLORS[j] + '" opacity="0.92"/>');
    }
    // inner "black" zone (talents < 100 hide inside it)
    var blackR = 100 * M * (1 / H + 1);
    s.push('<circle cx="' + MX + '" cy="' + MY + '" r="' + rimInner +
           '" fill="' + T.innerZone + '" stroke="' + T.grid + '" stroke-width="1"/>');
    s.push('<circle cx="' + MX + '" cy="' + MY + '" r="' + blackR.toFixed(2) +
           '" fill="' + T.blackZone + '" stroke="' + T.grid + '" stroke-width="1"/>');

    // 12 spokes (sector boundaries)
    for (var k = 0; k < 12; k++) {
      var ang = (30 * k) * DE;
      s.push('<line x1="' + MX + '" y1="' + MY + '" x2="' + (rimInner * Math.sin(ang) + MX).toFixed(1) +
             '" y2="' + (MY - rimInner * Math.cos(ang)).toFixed(1) +
             '" stroke="rgba(128,128,128,.35)" stroke-width="1"/>');
    }
    // rim digit labels at sector centre
    for (var n = 0; n < 12; n++) {
      var ad = (15 + 30 * n) * DE;
      s.push('<text x="' + (190 * Math.sin(ad) + MX).toFixed(1) + '" y="' +
             (MY - 190 * Math.cos(ad) + 4).toFixed(1) + '" fill="' + T.rimText +
             '" font-size="13" font-weight="bold" text-anchor="middle">' + E.SPOKE_DIGIT[n] + '</text>');
    }
    // planets
    for (var p = 0; p < 12; p++) {
      var A = (15 + 30 * p);
      var R = r.spoke[p].score * M;
      var RA = R / H;
      var px = RA * Math.sin(A * DE) + MX;
      var py = MY - RA * Math.cos(A * DE);
      s.push('<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" r="' +
             Math.max(R * 0.95, 0.5).toFixed(1) + '" fill="' + E.SPOKE_COLORS[p] +
             '" stroke="' + T.edge + '" stroke-width="1.5"/>');
      if (R * 0.95 > 9)
        s.push('<text x="' + px.toFixed(1) + '" y="' + (py + 4).toFixed(1) +
               '" text-anchor="middle" font-size="11" font-weight="bold" fill="#111">' +
               r.spoke[p].score + '</text>');
    }
    // white sun at centroid + soul angle
    var sunX = r.centroid.x * M + MX, sunY = r.centroid.y * M + MY;
    var sunR = Math.max(Math.sqrt(r.centroid.totArea) / 4 * M, 6);
    s.push('<circle cx="' + sunX.toFixed(1) + '" cy="' + sunY.toFixed(1) + '" r="' + sunR.toFixed(1) +
           '" fill="' + T.sun + '" stroke="' + T.edge + '" stroke-width="2" opacity="0.96"/>');
    s.push('<text x="' + sunX.toFixed(1) + '" y="' + (sunY + 4).toFixed(1) +
           '" text-anchor="middle" font-size="12" font-weight="bold" fill="' + T.sunInk + '">' + r.soulAngle + '°</text>');
    s.push('<circle cx="' + MX + '" cy="' + MY + '" r="' + rimInner +
           '" fill="none" stroke="' + T.edge + '" stroke-width="2"/>');
    s.push('</svg>');
    return s.join('');
  }

  function annulusPath(cx, cy, r0, r1, a0, a1) {
    function pt(r, a){ return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
    var large = (a1 - a0) % (2 * Math.PI) > Math.PI ? 1 : 0;
    var A = pt(r1, a0), B = pt(r1, a1), C = pt(r0, a1), D = pt(r0, a0);
    return 'M' + A[0].toFixed(2) + ' ' + A[1].toFixed(2) +
           ' A' + r1 + ' ' + r1 + ' 0 ' + large + ' 1 ' + B[0].toFixed(2) + ' ' + B[1].toFixed(2) +
           ' L' + C[0].toFixed(2) + ' ' + C[1].toFixed(2) +
           ' A' + r0 + ' ' + r0 + ' 0 ' + large + ' 0 ' + D[0].toFixed(2) + ' ' + D[1].toFixed(2) + ' Z';
  }

  /* ---- RANKED TALENTS : dominant -> subordinant bars --------------- */
  function rankChart(r, opt) {
    var T = theme(opt);
    var max = r.ranked[0].score || 1;
    var W = 360, rowH = 26, pad = 70;
    var s = ['<svg viewBox="0 0 ' + (W + pad) + ' ' + (r.ranked.length * rowH + 10) +
             '" class="barsvg" xmlns="http://www.w3.org/2000/svg">'];
    r.ranked.forEach(function (t, i) {
      var y = i * rowH + 6, bw = (t.score / max) * W;
      s.push('<text x="2" y="' + (y + 15) + '" font-size="12" fill="' + T.ink + '">#' + (i + 1) + '</text>');
      s.push('<rect x="26" y="' + y + '" width="18" height="18" rx="3" fill="' +
             E.DIGIT_COLORS[t.digit] + '" stroke="' + T.edge + '"/>');
      s.push('<text x="35" y="' + (y + 14) + '" font-size="12" font-weight="bold" text-anchor="middle" fill="#111">' + t.digit + '</text>');
      s.push('<rect x="50" y="' + (y + 2) + '" width="' + bw.toFixed(1) + '" height="14" rx="3" fill="' + E.DIGIT_COLORS[t.digit] + '"/>');
      s.push('<text x="' + (54 + bw).toFixed(1) + '" y="' + (y + 14) + '" font-size="12" fill="' + T.ink + '">' + t.score + '</text>');
    });
    s.push('</svg>');
    return s.join('');
  }

  /* ---- BANDS : 6 colour-group bars (dimension OR element naming) ---- */
  function bandChart(r, mode, opt) {
    var T = theme(opt);
    var key = mode === 'dimension' ? 'dimension' : 'element';
    var max = Math.max.apply(null, r.bands.map(function (e) { return e.score; })) || 1;
    var barX = 124, W = 250, rowH = 34;
    var s = ['<svg viewBox="0 0 ' + (barX + W + 96) + ' ' + (r.bands.length * rowH + 8) +
             '" class="barsvg" xmlns="http://www.w3.org/2000/svg">'];
    r.bands.forEach(function (e, i) {
      var y = i * rowH + 6, bw = (e.score / max) * W;
      s.push('<rect x="2" y="' + (y + 5) + '" width="14" height="14" rx="3" fill="' + e.color + '" stroke="' + T.edge + '"/>');
      s.push('<text x="22" y="' + (y + 17) + '" font-size="11" fill="' + T.ink + '">' + e[key] + '</text>');
      s.push('<rect x="' + barX + '" y="' + (y + 4) + '" width="' + bw.toFixed(1) + '" height="18" rx="4" fill="' + e.color + '" stroke="' + T.edge + '" stroke-width="0.5"/>');
      s.push('<text x="' + (barX + 4 + bw).toFixed(1) + '" y="' + (y + 18) + '" font-size="12" fill="' + T.ink +
             '">' + e.score + '  <tspan fill="' + T.muted + '">(' + (e.sectors || e.digits).join(',') + ')</tspan></text>');
    });
    s.push('</svg>');
    return s.join('');
  }

  /* ---- TRAIT TABLE : LOVES / POWERS per band ----------------------- */
  function traitTable(r) {
    var rows = r.bands.map(function (b) {
      var sz = 10 + Math.round(b.score / 1000 * 26);
      return '<tr>' +
        '<td class="tcirc"><span class="dot" style="width:' + sz + 'px;height:' + sz + 'px;background:' + b.color + '"></span></td>' +
        '<td class="tdim">' + b.dimension + '<br><small>' + b.element + ' · ' + b.score + '</small></td>' +
        '<td class="tlove">' + b.loves.join(' · ') + '</td>' +
        '<td class="tpow">' + b.powers.join(' · ') + '</td></tr>';
    }).join('');
    return '<table class="traits"><thead><tr><th></th><th>Dimension</th><th>Loves</th><th>Powers</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ---- SCALE GAUGES : every digit on the 0..1000 scale ------------- */
  function scaleChart(r, opt) {
    var T = theme(opt);
    var W = 300, rowH = 24;
    var s = ['<svg viewBox="0 0 ' + (W + 90) + ' ' + (10 * rowH + 8) + '" class="barsvg" xmlns="http://www.w3.org/2000/svg">'];
    for (var d = 0; d < 10; d++) {
      var y = d * rowH + 6, bw = (r.scores[d] / 1000) * W;
      s.push('<text x="2" y="' + (y + 14) + '" font-size="12" font-weight="bold" fill="' + E.DIGIT_COLORS[d] + '">' + d + '</text>');
      s.push('<rect x="20" y="' + (y + 2) + '" width="' + W + '" height="14" rx="3" fill="' + T.track + '"/>');
      s.push('<rect x="20" y="' + (y + 2) + '" width="' + bw.toFixed(1) + '" height="14" rx="3" fill="' + E.DIGIT_COLORS[d] + '"/>');
      s.push('<text x="' + (24 + W) + '" y="' + (y + 14) + '" font-size="11" fill="' + T.ink + '">' + r.scores[d] + '</text>');
    }
    var x100 = 20 + (100 / 1000) * W;
    s.push('<line x1="' + x100.toFixed(1) + '" y1="2" x2="' + x100.toFixed(1) + '" y2="' + (10 * rowH) +
           '" stroke="' + T.muted + '" stroke-dasharray="3 3"/>');
    s.push('<text x="' + x100.toFixed(1) + '" y="' + (10 * rowH + 6) + '" font-size="9" fill="' + T.muted + '" text-anchor="middle">100</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- PILLARS : the tall grey "Future Development" graphs ---------
   * mode 'age'  -> AGE axis (0/30/60/90), date-driven path.
   * mode 'year' -> calendar axis (Jan..Dec).
   * Each row is a black-edged bar; grey fill = karmic shade
   * (lighter = more karmic help); coloured cap = birth profile. Columns
   * left->right are digits 9 8 7 6 5 4 3 2 1 0.
   * ------------------------------------------------------------------ */
  function pillarChart(r, mode, opt) {
    var T = theme(opt);
    var ev = E.evolution(r, mode);
    var cols = 10, colW = 56, top = 30, plotH = 380, left = 34, capH = 12;
    var W = left + cols * colW + 34, Hh = top + plotH + 18;
    var maxTs = ev.maxTs || 1;
    var rowH = plotH / ev.rows.length;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="evosvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect x="0" y="0" width="' + W + '" height="' + Hh + '" fill="' + T.pillarBg + '"/>');

    // column headers (the digit, in its colour) + coloured cap
    ev.order.forEach(function (d, c) {
      var cx = left + c * colW + colW / 2;
      var capHalf = (ev.cap[d] / maxTs) * (colW * 0.46);
      s.push('<rect x="' + (cx - capHalf).toFixed(1) + '" y="' + (top - capH) + '" width="' + (2 * capHalf).toFixed(1) +
             '" height="' + capH + '" fill="' + E.DIGIT_COLORS[d] + '" stroke="' + T.edge + '" stroke-width="0.5"/>');
      s.push('<text x="' + cx + '" y="16" text-anchor="middle" font-size="13" font-weight="bold" fill="' + E.DIGIT_COLORS[d] + '">' + d + '</text>');
    });

    // axis gridlines + labels (both sides)
    ev.ticks.forEach(function (t) {
      var gy = top + t.pos * plotH;
      s.push('<line x1="' + left + '" y1="' + gy.toFixed(1) + '" x2="' + (W - 28) + '" y2="' + gy.toFixed(1) + '" stroke="' + T.grid + '"/>');
      s.push('<text x="4" y="' + (gy + 4).toFixed(1) + '" font-size="9" fill="' + T.muted + '">' + t.label + '</text>');
      s.push('<text x="' + (W - 24) + '" y="' + (gy + 4).toFixed(1) + '" font-size="9" fill="' + T.muted + '">' + t.label + '</text>');
    });

    // the pillars: stacked black-edged grey lozenges
    ev.rows.forEach(function (row, i) {
      var y = top + i * rowH;
      ev.order.forEach(function (d, c) {
        var cx = left + c * colW + colW / 2;
        var half = (row.ts[d] / maxTs) * (colW * 0.46);
        if (half < 0.3) return;
        var shade = Math.round(row.karma[d] * 42.5);     // karma*42.5 grey
        // black edge (full width) then grey inner (2px inset)
        s.push('<rect x="' + (cx - half).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (2 * half).toFixed(1) +
               '" height="' + (rowH + 0.6).toFixed(2) + '" fill="' + T.edge + '"/>');
        var inner = half - 1.5;
        if (inner > 0)
          s.push('<rect x="' + (cx - inner).toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (2 * inner).toFixed(1) +
                 '" height="' + (rowH + 0.6).toFixed(2) + '" fill="rgb(' + shade + ',' + shade + ',' + shade + ')"/>');
      });
    });

    // KARMIC HELP legend
    var lx = left, ly = Hh - 4;
    s.push('<text x="' + lx + '" y="' + ly + '" font-size="9" fill="' + T.muted + '">KARMIC HELP:  less</text>');
    for (var g = 1; g <= 5; g++)
      s.push('<rect x="' + (lx + 86 + g * 12) + '" y="' + (ly - 8) + '" width="12" height="8" fill="rgb(' +
             (g * 42.5) + ',' + (g * 42.5) + ',' + (g * 42.5) + ')" stroke="' + T.grid + '"/>');
    s.push('<text x="' + (lx + 162) + '" y="' + ly + '" font-size="9" fill="' + T.muted + '">more</text>');
    s.push('</svg>');
    return s.join('');
  }

  // ---- colour helpers for tube shading -----------------------------
  function parseRgb(c){ var m=/(\d+)\D+(\d+)\D+(\d+)/.exec(c); return m?[+m[1],+m[2],+m[3]]:[128,128,128]; }
  function shadeRgb(c,f){ // f>0 lighten toward white, f<0 darken toward black
    var p=parseRgb(c);
    return 'rgb('+p.map(function(v){return Math.round(f>=0? v+(255-v)*f : v*(1+f));}).join(',')+')';
  }

  // common: smooth path through points [[x,y]...]
  function smooth(pts){
    if(!pts.length) return '';
    var d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);
    for(var i=1;i<pts.length;i++){
      var p0=pts[i-1],p1=pts[i],mx=(p0[0]+p1[0])/2;
      d+=' C'+mx.toFixed(1)+' '+p0[1].toFixed(1)+' '+mx.toFixed(1)+' '+p1[1].toFixed(1)+' '+p1[0].toFixed(1)+' '+p1[1].toFixed(1);
    }
    return d;
  }

  /* ---- LIFE STREAM : additive streamgraph (the shape of your life) --
   * Horizontal time axis; total thickness = sum of all 10 talents at that
   * moment; strands stacked inside-out (biggest in the middle).
   * ------------------------------------------------------------------ */
  function lifeStream(r, mode, opt){
    var T=theme(opt);
    var ev=E.evolution(r, mode);
    var left=34, right=14, top=16, bot=24, W=680, plotW=W-left-right, plotH=300, Hh=top+plotH+bot;
    // inside-out stacking order by mean strength (biggest centred)
    var means=[]; for(var d=0;d<10;d++){var s=0; ev.rows.forEach(function(row){s+=row.ts[d];}); means.push([d,s]);}
    means.sort(function(a,b){return b[1]-a[1];});
    var order=[]; means.forEach(function(m,i){ if(i%2===0) order.push(m[0]); else order.unshift(m[0]); });
    var maxTot=0; ev.rows.forEach(function(row){var t=0; for(var d=0;d<10;d++)t+=row.ts[d]; if(t>maxTot)maxTot=t;});
    var vs=(plotH*0.92)/(maxTot||1), mid=top+plotH/2;
    var n=ev.rows.length, x=function(i){return left + (i/(n-1))*plotW;};
    var s=['<svg viewBox="0 0 '+W+' '+Hh+'" class="evosvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect width="'+W+'" height="'+Hh+'" fill="'+T.pillarBg+'"/>');
    // axis
    ev.ticks.forEach(function(t){ var gx=left+t.pos*plotW;
      s.push('<line x1="'+gx.toFixed(1)+'" y1="'+top+'" x2="'+gx.toFixed(1)+'" y2="'+(top+plotH)+'" stroke="'+T.grid+'" opacity=".5"/>');
      s.push('<text x="'+gx.toFixed(1)+'" y="'+(Hh-8)+'" font-size="9" fill="'+T.muted+'" text-anchor="middle">'+t.label+'</text>');
    });
    // cumulative offsets per sample
    var base=[]; for(var i=0;i<n;i++){var tot=0; for(var d2=0;d2<10;d2++)tot+=ev.rows[i].ts[d2]; base.push(mid-tot*vs/2);}
    var acc=base.slice();
    order.forEach(function(d){
      var topPts=[],botPts=[];
      for(var i=0;i<n;i++){ var y0=acc[i], y1=acc[i]+ev.rows[i].ts[d]*vs; topPts.push([x(i),y0]); botPts.push([x(i),y1]); acc[i]=y1; }
      var path=smooth(topPts)+' L'+botPts[n-1][0].toFixed(1)+' '+botPts[n-1][1].toFixed(1)+' '+
               smooth(botPts.slice().reverse()).slice(1)+' Z';
      s.push('<path d="'+path+'" fill="'+E.DIGIT_COLORS[d]+'" stroke="'+shadeRgb(E.DIGIT_COLORS[d],-0.35)+'" stroke-width="0.5" opacity="0.95"/>');
    });
    s.push('<text x="'+left+'" y="11" font-size="10" fill="'+T.muted+'">'+(mode==='age'?'birth →':'Jan →')+' the shape of your life ('+(mode==='age'?'age':'year')+')</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- LIFE CABLE : 10 talent strands braided as 3-D tubes ---------
   * Each digit is a rounded tube; thickness = its strength over time;
   * tubes weave with a per-strand phase and are shaded cylindrically.
   * ------------------------------------------------------------------ */
  function lifeCable(r, mode, opt){
    var T=theme(opt);
    var ev=E.evolution(r, mode);
    var left=34, right=14, top=14, bot=24, W=680, plotW=W-left-right, plotH=300, Hh=top+plotH+bot;
    var maxTs=ev.maxTs||1, n=ev.rows.length, mid=top+plotH/2;
    var x=function(i){return left+(i/(n-1))*plotW;};
    var thick=(plotH*0.16)/maxTs;            // per-strand thickness scale
    var amp=plotH*0.22, turns=1.6;   // weave is decorative; only thickness encodes strength
    var s=['<svg viewBox="0 0 '+W+' '+Hh+'" class="evosvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<defs>');
    for(var d=0;d<10;d++){
      var c=E.DIGIT_COLORS[d];
      s.push('<linearGradient id="g'+d+'" x1="0" y1="0" x2="0" y2="1">'+
        '<stop offset="0%" stop-color="'+shadeRgb(c,0.55)+'"/>'+
        '<stop offset="42%" stop-color="'+c+'"/>'+
        '<stop offset="100%" stop-color="'+shadeRgb(c,-0.45)+'"/></linearGradient>');
    }
    s.push('</defs>');
    s.push('<rect width="'+W+'" height="'+Hh+'" fill="'+T.pillarBg+'"/>');
    ev.ticks.forEach(function(t){ var gx=left+t.pos*plotW;
      s.push('<line x1="'+gx.toFixed(1)+'" y1="'+top+'" x2="'+gx.toFixed(1)+'" y2="'+(top+plotH)+'" stroke="'+T.grid+'" opacity=".35"/>');
      s.push('<text x="'+gx.toFixed(1)+'" y="'+(Hh-8)+'" font-size="9" fill="'+T.muted+'" text-anchor="middle">'+t.label+'</text>');
    });
    // build strands; draw back-to-front by phase so they appear to weave
    var strands=[];
    for(var d3=0;d3<10;d3++){
      var phase=d3/10*Math.PI*2;
      var topPts=[],botPts=[],depth=0;
      for(var i=0;i<n;i++){
        var pos=ev.rows[i].pos;
        var cy=mid+amp*Math.sin(pos*Math.PI*2*turns+phase);
        var half=Math.max(ev.rows[i].ts[d3]*thick/2,0.6);
        topPts.push([x(i),cy-half]); botPts.push([x(i),cy+half]);
        depth+=Math.cos(pos*Math.PI*2*turns+phase);
      }
      strands.push({d:d3,topPts:topPts,botPts:botPts,depth:depth});
    }
    strands.sort(function(a,b){return a.depth-b.depth;}); // smaller (further) first
    strands.forEach(function(st){
      var path=smooth(st.topPts)+' L'+st.botPts[n-1][0].toFixed(1)+' '+st.botPts[n-1][1].toFixed(1)+' '+
               smooth(st.botPts.slice().reverse()).slice(1)+' Z';
      s.push('<path d="'+path+'" fill="url(#g'+st.d+')" stroke="'+shadeRgb(E.DIGIT_COLORS[st.d],-0.5)+'" stroke-width="0.6" opacity="0.96"/>');
    });
    s.push('<text x="'+left+'" y="11" font-size="10" fill="'+T.muted+'">'+(mode==='age'?'birth →':'Jan →')+' your life as a braided cable of talents</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- YEAR MANDALA : the raw 365-digit ring as a calendar wheel ----
   * Calendar day J (0..364) sits at angle J/365 from top; the digit shown
   * is NUM_STRING[(J+11) mod 365] (the standard ring mapping).
   * Birthday is starred; months ring the outside.
   * ------------------------------------------------------------------ */
  function yearMandala(r, opt) {
    var T = theme(opt);
    var S = 460, cx = S / 2, cy = S / 2, rIn = 90, rOut = 198;
    var ns = r.numString;
    var s = ['<svg viewBox="0 0 ' + S + ' ' + S + '" class="starsvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect width="' + S + '" height="' + S + '" fill="' + T.bg + '"/>');
    // 365 day ticks
    for (var J = 0; J < 365; J++) {
      var dig = +ns.charAt((J + 11) % 365);
      var a0 = (J / 365 * 360 - 90) * DE, a1 = ((J + 1) / 365 * 360 - 90) * DE;
      s.push('<path d="' + annulusPath(cx, cy, rIn, rOut, a0, a1) + '" fill="' + E.DIGIT_COLORS[dig] + '"/>');
    }
    // month boundaries + labels
    var MO = [0,31,59,90,120,151,181,212,243,273,304,334];
    for (var m = 0; m < 12; m++) {
      var ma = (MO[m] / 365 * 360 - 90) * DE;
      s.push('<line x1="' + (cx + rIn * Math.cos(ma)).toFixed(1) + '" y1="' + (cy + rIn * Math.sin(ma)).toFixed(1) +
             '" x2="' + (cx + (rOut + 14) * Math.cos(ma)).toFixed(1) + '" y2="' + (cy + (rOut + 14) * Math.sin(ma)).toFixed(1) +
             '" stroke="' + T.bg + '" stroke-width="1.5"/>');
      var la = ((MO[m] + 15) / 365 * 360 - 90) * DE, lr = rOut + 24;
      s.push('<text x="' + (cx + lr * Math.cos(la)).toFixed(1) + '" y="' + (cy + lr * Math.sin(la) + 3).toFixed(1) +
             '" font-size="10" fill="' + T.ink + '" text-anchor="middle">' + E.MONTH_NAMES[m].slice(0,3) + '</text>');
    }
    // birthday star
    var bJ = MO[(r.monthNum || 1) - 1] + (r.dayNum - 1);
    var ba = (bJ / 365 * 360 - 90) * DE;
    s.push('<circle cx="' + (cx + (rOut + 2) * Math.cos(ba)).toFixed(1) + '" cy="' + (cy + (rOut + 2) * Math.sin(ba)).toFixed(1) +
           '" r="6" fill="' + T.sun + '" stroke="' + T.edge + '" stroke-width="1.5"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rIn + '" fill="' + T.bg + '" stroke="' + T.grid + '"/>');
    s.push('<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="13" font-weight="bold" fill="' + T.ink + '">' + r.name.split(' ')[0] + '</text>');
    s.push('<text x="' + cx + '" y="' + (cy + 14) + '" text-anchor="middle" font-size="10" fill="' + T.muted + '">365-day fingerprint</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- SOUL COMPASS : a focused dial for the soul angle ------------- */
  function soulCompass(r, opt) {
    var T = theme(opt);
    var S = 380, cx = S/2, cy = S/2, rIn = 110, rOut = 150;
    var s = ['<svg viewBox="0 0 ' + S + ' ' + S + '" class="starsvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect width="' + S + '" height="' + S + '" fill="' + T.bg + '"/>');
    // 12-arc mirror-rainbow rim (same palette as the star)
    for (var j = 0; j < 12; j++) {
      var a0 = (30*j - 90)*DE, a1 = (30*j+30 - 90)*DE;
      s.push('<path d="' + annulusPath(cx, cy, rIn, rOut, a0, a1) + '" fill="' + E.SPOKE_COLORS[j] + '" opacity="0.9"/>');
    }
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rIn + '" fill="' + T.innerZone + '" stroke="' + T.grid + '"/>');
    // quadrant cross + labels
    var quads = [['0°', 0], ['90°', 90], ['180°', 180], ['270°', 270]];
    quads.forEach(function (q) {
      var a = (q[1] - 90) * DE;
      s.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + rIn * Math.cos(a)).toFixed(1) + '" y2="' + (cy + rIn * Math.sin(a)).toFixed(1) + '" stroke="' + T.grid + '"/>');
      s.push('<text x="' + (cx + (rIn - 14) * Math.cos(a)).toFixed(1) + '" y="' + (cy + (rIn - 14) * Math.sin(a) + 3).toFixed(1) + '" font-size="10" fill="' + T.muted + '" text-anchor="middle">' + q[0] + '</text>');
    });
    // needle to soul angle
    var na = (r.soulAngle - 90) * DE, nl = rIn - 6;
    s.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + nl * Math.cos(na)).toFixed(1) + '" y2="' + (cy + nl * Math.sin(na)).toFixed(1) + '" stroke="' + T.ink + '" stroke-width="3"/>');
    s.push('<circle cx="' + (cx + nl * Math.cos(na)).toFixed(1) + '" cy="' + (cy + nl * Math.sin(na)).toFixed(1) + '" r="6" fill="' + T.sun + '" stroke="' + T.edge + '" stroke-width="1.5"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="5" fill="' + T.ink + '"/>');
    s.push('<text x="' + cx + '" y="' + (cy + 34) + '" text-anchor="middle" font-size="22" font-weight="bold" fill="' + T.ink + '">' + r.soulAngle + '°</text>');
    s.push('<text x="' + cx + '" y="' + (cy + 50) + '" text-anchor="middle" font-size="11" fill="' + T.muted + '">' + r.quadrant.name + '</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- RADAR : overlay several talent profiles --------------------- */
  function radarChart(series, opt) {
    var T = theme(opt);
    var S = 420, cx = S/2, cy = S/2, R = 150, n = 10;
    var s = ['<svg viewBox="0 0 ' + S + ' ' + S + '" class="starsvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect width="' + S + '" height="' + S + '" fill="' + T.bg + '"/>');
    function pt(d, frac){ var a = (d/n*360 - 90)*DE; return [cx + R*frac*Math.cos(a), cy + R*frac*Math.sin(a)]; }
    // grid rings + axes
    [0.25,0.5,0.75,1].forEach(function (g) {
      var poly = []; for (var d=0; d<n; d++){ var p=pt(d,g); poly.push(p[0].toFixed(1)+','+p[1].toFixed(1)); }
      s.push('<polygon points="' + poly.join(' ') + '" fill="none" stroke="' + T.grid + '"/>');
    });
    for (var d=0; d<n; d++){ var p=pt(d,1.12), q=pt(d,1);
      s.push('<line x1="' + cx + '" y1="' + cy + '" x2="' + q[0].toFixed(1) + '" y2="' + q[1].toFixed(1) + '" stroke="' + T.grid + '"/>');
      s.push('<text x="' + p[0].toFixed(1) + '" y="' + (p[1]+3).toFixed(1) + '" font-size="11" font-weight="bold" text-anchor="middle" fill="' + E.DIGIT_COLORS[d] + '">' + d + '</text>');
    }
    var maxScore = 0; series.forEach(function (se){ se.scores.forEach(function (v){ if(v>maxScore)maxScore=v; }); });
    maxScore = maxScore || 1;
    series.forEach(function (se){
      var poly = []; for (var d=0; d<n; d++){ var p=pt(d, se.scores[d]/maxScore); poly.push(p[0].toFixed(1)+','+p[1].toFixed(1)); }
      s.push('<polygon points="' + poly.join(' ') + '" fill="' + se.stroke + '" fill-opacity="0.14" stroke="' + se.stroke + '" stroke-width="2"/>');
    });
    s.push('</svg>');
    return s.join('');
  }

  /* ---- PYRAMID EXPLAINER : the build, step by step (HTML) ----------- */
  function pyramidExplainer(r) {
    var nn = E.name2num(r.name);
    // step 2: numerology triangle (firstLevels), 78 digits
    var tri = [];
    for (var z = 1; z <= 12; z++) {
      var digs = r.firstLevels[z].split('').map(function (c) {
        return '<span class="td" style="background:' + E.DIGIT_COLORS[+c] + '">' + c + '</span>';
      }).join('');
      tri.push('<div class="trow"><span class="tlbl">L' + z + '</span>' + digs + '</div>');
    }
    // step 3: the 3-D pyramid, drawn as one coherent SVG (scales to width,
    // single gentle tilt so it never squashes per-row like a CSS-3D stack).
    var maxN = 78, cw = 480 / maxN, rh = 14, padTop = 6, PW = 480, PH = padTop + 12 * rh + 4;
    var psvg = ['<svg viewBox="0 0 ' + PW + ' ' + PH + '" class="pyrsvg" xmlns="http://www.w3.org/2000/svg">'];
    psvg.push('<defs><filter id="pyrsh" x="-4%" y="-4%" width="108%" height="118%">' +
      '<feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#000" flood-opacity="0.35"/></filter></defs>');
    psvg.push('<g filter="url(#pyrsh)">');
    for (var k = 0; k < 12; k++) {
      var flat = r.triangle[k].join('');             // T(k+1) digits, apex at top
      var nC = flat.length, rowW = nC * cw, x0 = (PW - rowW) / 2, y = padTop + k * rh;
      for (var c = 0; c < nC; c++) {
        psvg.push('<rect x="' + (x0 + c * cw).toFixed(2) + '" y="' + y.toFixed(2) +
          '" width="' + (cw - 0.7).toFixed(2) + '" height="' + (rh - 3) +
          '" rx="1" fill="' + E.DIGIT_COLORS[+flat.charAt(c)] + '" stroke="rgba(0,0,0,.25)" stroke-width="0.4"/>');
      }
    }
    psvg.push('</g></svg>');
    var pyramid = '<div class="pyr3d">' + psvg.join('') + '</div>';
    // step 5: counts -> scores
    var counts = r.values.map(function (v, d) {
      return '<span class="cnt" style="border-color:' + E.DIGIT_COLORS[d] + '"><b style="color:' +
             E.DIGIT_COLORS[d] + '">' + d + '</b> ' + v + ' → ' + r.scores[d] + '</span>';
    }).join('');
    return '' +
      '<div class="pstep"><span class="pn">1</span><b>Name to digits</b> (A=01 to Z=26, glued, then folded to level 12)' +
        '<div class="mono pmono">' + nn + '</div></div>' +
      '<div class="pstep"><span class="pn">2</span><b>Numerology Triangle</b>: level 1 to level 12 (L1…L12, 78 digits)' +
        '<div class="triangle">' + tri.join('') + '</div></div>' +
      '<div class="pstep"><span class="pn">3</span><b>3-D Pyramid</b>: each row spawns its own triangle ' +
        '(Σ = 364 digits, +1 birth-zero = 365)' + pyramid + '</div>' +
      '<div class="pstep"><span class="pn">4</span><b>Count each digit</b> in the 365, then ×1000/365' +
        '<div class="cnts">' + counts + '</div></div>';
  }

  /* ---- MUSIC & STARS : the numerology circle + chromatic notes ------
   * Faithful to the "Music and the Numerology Circle" diagram:
   *  - 12 sectors hold the digits 0,0,1,2,3,4,5,5,6,7,8,9 (0 & 5 are twin
   *    sectors at top and bottom).
   *  - the 12 chromatic notes sit at the sector EDGES, B at the top, F at the
   *    bottom, going clockwise B C C# D D# E F F# G G# A A#.
   *  - white keys (no #) are white circles; black keys (#) are dark circles.
   *  - B and F are dual-nature (the 0 and 5 keys, both black & white).
   * ------------------------------------------------------------------ */
  function musicChart(r, opt) {
    var T = theme(opt);
    var S = 460, cx = S/2, cy = S/2 + 6, rIn = 92, rOut = 182;
    function pt(deg, rr){ var a = deg*DE; return [cx + rr*Math.sin(a), cy - rr*Math.cos(a)]; }
    // 12 chromatic notes at the sector edges, clockwise from the top
    var NOTES = [
      {n:'B',black:false,dual:true}, {n:'C',black:false}, {n:'C#',black:true},
      {n:'D',black:false}, {n:'D#',black:true}, {n:'E',black:false},
      {n:'F',black:false,dual:true}, {n:'F#',black:true}, {n:'G',black:false},
      {n:'G#',black:true}, {n:'A',black:false}, {n:'A#',black:true}
    ];
    var s = ['<svg viewBox="0 0 ' + S + ' ' + S + '" class="starsvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<rect width="' + S + '" height="' + S + '" fill="' + T.bg + '"/>');
    // 12 coloured sectors with the digit at each sector centre
    for (var j = 0; j < 12; j++) {
      var a0 = (30*j - 90)*DE, a1 = (30*j + 30 - 90)*DE;
      s.push('<path d="' + annulusPath(cx, cy, rIn, rOut, a0, a1) + '" fill="' + E.SPOKE_COLORS[j] + '" opacity="0.92"/>');
      var dp = pt(15 + 30*j, rIn + 22);
      s.push('<text x="' + dp[0].toFixed(1) + '" y="' + (dp[1]+4).toFixed(1) +
             '" text-anchor="middle" font-size="13" font-weight="bold" fill="#111">' + E.SPOKE_DIGIT[j] + '</text>');
    }
    // centre: meditating figure + 7-chakra spine (red root -> violet crown)
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="' + rIn + '" fill="' + T.innerZone + '" stroke="' + T.grid + '"/>');
    s.push('<circle cx="' + cx + '" cy="' + (cy-32) + '" r="12" fill="#6b6b7a"/>');
    s.push('<path d="M' + (cx-38) + ' ' + (cy+42) + ' Q' + cx + ' ' + (cy-16) + ' ' + (cx+38) + ' ' + (cy+42) + ' Z" fill="#6b6b7a" opacity="0.85"/>');
    var spine = [E.COLORS.red,E.COLORS.orange,E.COLORS.yellow,E.COLORS.green,E.COLORS.blue,E.COLORS.blue,E.COLORS.purple];
    for (var c = 0; c < 7; c++)
      s.push('<circle cx="' + cx + '" cy="' + (cy+38-c*12) + '" r="3.2" fill="' + spine[c] + '" stroke="#222" stroke-width="0.5"/>');
    // the 12 notes at the sector edges
    NOTES.forEach(function(note, e){
      var p = pt(30*e, (rIn + rOut)/2);
      var rad = note.black ? 11 : 13;
      var fill = note.black ? '#15151c' : '#ffffff';
      var ink  = note.black ? '#fff' : '#111';
      s.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + rad +
             '" fill="' + fill + '" stroke="#000" stroke-width="1.4"' + (note.dual ? ' stroke-dasharray="3 2"' : '') + '/>');
      if (note.dual)  // dual nature: a black half on a white key
        s.push('<path d="M' + p[0].toFixed(1) + ' ' + (p[1]-rad).toFixed(1) + ' A' + rad + ' ' + rad + ' 0 0 0 ' +
               p[0].toFixed(1) + ' ' + (p[1]+rad).toFixed(1) + ' Z" fill="#15151c"/>');
      s.push('<text x="' + p[0].toFixed(1) + '" y="' + (p[1]+ (note.black?3:4)).toFixed(1) +
             '" text-anchor="middle" font-size="' + (note.black?9:12) + '" font-weight="bold" fill="' +
             (note.dual ? '#111' : ink) + '">' + note.n + '</text>');
    });
    s.push('<text x="' + cx + '" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="' + T.ink + '">Music &amp; the Numerology Circle</text>');
    s.push('<text x="' + cx + '" y="' + (S-20) + '" text-anchor="middle" font-size="10" fill="' + T.muted + '">12 sectors (0 &amp; 5 are twin sectors) · a white + a black key at each edge</text>');
    s.push('<text x="' + cx + '" y="' + (S-7) + '" text-anchor="middle" font-size="10" fill="' + T.muted + '">B (top) &amp; F (bottom) are dual-nature keys</text>');
    s.push('</svg>');
    return s.join('');
  }

  /* ---- DELTA BARS : a letter's contribution to each talent --------- */
  function deltaBars(deltas, opt) {
    var T = theme(opt);
    var n = 10, rowH = 24, cx = 150, half = 130, W = cx + half + 44, Hh = n * rowH + 6;
    var maxAbs = Math.max.apply(null, deltas.map(function (x) { return Math.abs(x); })) || 1;
    var s = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="barsvg" xmlns="http://www.w3.org/2000/svg">'];
    s.push('<line x1="' + cx + '" y1="2" x2="' + cx + '" y2="' + (n * rowH) + '" stroke="' + T.grid + '"/>');
    for (var d = 0; d < n; d++) {
      var y = d * rowH + 5, val = deltas[d], w = (Math.abs(val) / maxAbs) * half;
      var x = val >= 0 ? cx : cx - w;
      s.push('<text x="6" y="' + (y + 14) + '" font-size="11" font-weight="bold" fill="' + E.DIGIT_COLORS[d] + '">' + d + '</text>');
      s.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + Math.max(w, 0.6).toFixed(1) +
             '" height="14" rx="2" fill="' + (val >= 0 ? E.DIGIT_COLORS[d] : T.muted) + '"/>');
      if (val !== 0)
        s.push('<text x="' + (val >= 0 ? cx + w + 4 : cx - w - 4).toFixed(1) + '" y="' + (y + 13) +
               '" font-size="10" fill="' + T.ink + '" text-anchor="' + (val >= 0 ? 'start' : 'end') + '">' +
               (val > 0 ? '+' : '') + val + '</text>');
    }
    s.push('</svg>');
    return s.join('');
  }

  /* ---- AGE PROFILE : talent mix at one age (for the scrubber) ------- */
  function ageProfile(ts, maxTs, opt) {
    var T = theme(opt);
    var n = 10, rowH = 24, barX = 28, barW = 240, W = barX + barW + 60, Hh = n * rowH + 6;
    var top = ts.indexOf(Math.max.apply(null, ts));
    var s = ['<svg viewBox="0 0 ' + W + ' ' + Hh + '" class="barsvg" xmlns="http://www.w3.org/2000/svg">'];
    for (var d = 0; d < n; d++) {
      var y = d * rowH + 5, w = (ts[d] / (maxTs || 1)) * barW;
      s.push('<text x="4" y="' + (y + 15) + '" font-size="11" font-weight="bold" fill="' + E.DIGIT_COLORS[d] + '">' + d + '</text>');
      s.push('<rect x="' + barX + '" y="' + (y + 2) + '" width="' + barW + '" height="15" rx="3" fill="' + T.track + '"/>');
      s.push('<rect x="' + barX + '" y="' + (y + 2) + '" width="' + w.toFixed(1) + '" height="15" rx="3" fill="' +
             E.DIGIT_COLORS[d] + '"' + (d === top ? ' stroke="' + T.ink + '" stroke-width="1.5"' : '') + '/>');
      s.push('<text x="' + (barX + barW + 6) + '" y="' + (y + 15) + '" font-size="10" fill="' + T.ink + '">' + Math.round(ts[d]) + '</text>');
    }
    s.push('</svg>');
    return s.join('');
  }

  /* ---- WRITTEN READING : narrative paragraphs ---------------------- */
  function readingHtml(r) {
    return E.reading(r).map(function (p) {
      return '<div class="rdg"><h3>' + p.title + '</h3><p>' + p.text + '</p></div>';
    }).join('');
  }

  /* ---- TRIANGLE : the 78-digit numerology triangle ----------------- */
  function triangleHtml(r) {
    var rows = [];
    for (var z = 1; z <= 12; z++) {
      var digs = r.firstLevels[z].split('').map(function (c) {
        return '<span class="td" style="background:' + E.DIGIT_COLORS[+c] + '">' + c + '</span>';
      }).join('');
      rows.push('<div class="trow"><span class="tlbl">L' + z + '</span>' + digs + '</div>');
    }
    return '<div class="triangle">' + rows.join('') + '</div>';
  }

  var api = {
    starChart: starChart, rankChart: rankChart, bandChart: bandChart,
    traitTable: traitTable, scaleChart: scaleChart,
    pillarChart: pillarChart, triangleHtml: triangleHtml,
    lifeStream: lifeStream, lifeCable: lifeCable,
    yearMandala: yearMandala, soulCompass: soulCompass,
    radarChart: radarChart, pyramidExplainer: pyramidExplainer,
    readingHtml: readingHtml, musicChart: musicChart,
    deltaBars: deltaBars, ageProfile: ageProfile,
    THEMES: THEMES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.NumCharts = api;
})(typeof window !== 'undefined' ? window : globalThis);
