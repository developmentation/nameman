/* =====================================================================
 * NAMEMAN CLASSIC SHEET  —  a faithful single-page reproduction of the
 * original printed NAMEMAN chart, rendered as one SVG and exported as a
 * landscape PDF. Shared by v1 and v2. Depends on window.NumEngine + jsPDF.
 * ===================================================================== */
(function (root) {
  'use strict';
  var E = root.NumEngine;
  var DE = Math.PI / 180, H = Math.sin(15 * DE);

  // Classic palette (matched to the original printout).
  var DC = {0:'#B388E6',1:'#5B9BD5',9:'#5B9BD5',2:'#7ED957',8:'#7ED957',
            3:'#FCE94F',7:'#FCE94F',4:'#FBB264',6:'#FBB264',5:'#F4675B'};
  var BANDCOL = ['#B388E6','#5B9BD5','#7ED957','#FCE94F','#FBB264','#F4675B'];
  function col(d){ return DC[d] || '#B388E6'; }
  function esc(t){ return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function arcP(cx,cy,r,a0,a1){ var p=function(a){var rad=(a-90)*DE;return [cx+r*Math.cos(rad),cy+r*Math.sin(rad)];};
    var A=p(a0),B=p(a1),large=(a1-a0)>180?1:0;
    return 'M '+A[0].toFixed(1)+' '+A[1].toFixed(1)+' A '+r+' '+r+' 0 '+large+' 1 '+B[0].toFixed(1)+' '+B[1].toFixed(1); }
  var FW = 'font-weight="700"';

  function legend(s, title, x, y, names){
    s.push('<text x="'+x+'" y="'+y+'" font-size="16" '+FW+'>'+title+'</text>');
    for(var i=0;i<6;i++){
      var ry = y + 12 + i*20;
      s.push('<rect x="'+x+'" y="'+ry+'" width="20" height="16" fill="'+BANDCOL[i]+'" stroke="#000" stroke-width="1"/>');
      s.push('<text x="'+(x+26)+'" y="'+(ry+13)+'" font-size="13" '+FW+'>'+names[i]+'</text>');
    }
  }

  function bigWheel(s, res, cx, cy, Rrim){
    var MAX = res.maxScore || 1, rMax = Rrim/(1/H + 1);
    // coloured rim
    for(var i=0;i<12;i++){
      s.push('<path d="'+arcP(cx,cy,Rrim+8,i*30+1.2,i*30+28.8)+'" fill="none" stroke="'+col(res.spoke[i].digit)+'" stroke-width="15"/>');
    }
    // sector divider spokes (clearly visible)
    for(var k=0;k<12;k++){ var ra=k*30*DE; s.push('<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+Rrim*Math.sin(ra)).toFixed(1)+'" y2="'+(cy-Rrim*Math.cos(ra)).toFixed(1)+'" stroke="#7b7b7b" stroke-width="1.4"/>'); }
    s.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+Rrim+'" fill="none" stroke="#000" stroke-width="2"/>');
    // black "hidden" disc (talents < 100)
    var blackR = Math.min(Rrim-2, Rrim*100/MAX);
    s.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+blackR.toFixed(1)+'" fill="#000"/>');
    // planets + area-weighted sun
    var sx=0,sy=0,sw=0, P=[];
    for(var j=0;j<12;j++){
      var A=15+30*j, rad=A*DE, val=res.spoke[j].score, dg=res.spoke[j].digit;
      var r=(val/MAX)*rMax, dist=r/H, x=cx+dist*Math.sin(rad), y=cy-dist*Math.cos(rad);
      sw+=r*r; sx+=r*r*x; sy+=r*r*y;
      P.push({x:x,y:y,r:r*0.88,c:col(dg)});
    }
    P.forEach(function(p){ s.push('<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="'+Math.max(p.r,1).toFixed(1)+'" fill="'+p.c+'" stroke="#000" stroke-width="1.5"/>'); });
    var sunx=sw?sx/sw:cx, suny=sw?sy/sw:cy;
    s.push('<circle cx="'+sunx.toFixed(1)+'" cy="'+suny.toFixed(1)+'" r="24" fill="#fff" stroke="#000" stroke-width="1.5"/>');
    s.push('<text x="'+sunx.toFixed(1)+'" y="'+(suny+5).toFixed(1)+'" text-anchor="middle" font-size="17" '+FW+'>'+res.soulAngle+'°</text>');
    // rim digit labels (just outside the ring)
    for(var n=0;n<12;n++){ var a2=(15+30*n)*DE; s.push('<text x="'+(cx+(Rrim+14)*Math.sin(a2)).toFixed(1)+'" y="'+(cy-(Rrim+14)*Math.cos(a2)+5).toFixed(1)+'" text-anchor="middle" font-size="15" '+FW+'>'+res.spoke[n].digit+'</text>'); }
  }

  function miniWheel(s, res, cx, cy, R){
    for(var i=0;i<12;i++){ s.push('<path d="'+arcP(cx,cy,R,i*30+1.5,i*30+28.5)+'" fill="none" stroke="'+col(res.spoke[i].digit)+'" stroke-width="7"/>'); }
    for(var k=0;k<12;k++){ var ra=k*30*DE; s.push('<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+(R-4)*Math.sin(ra)).toFixed(1)+'" y2="'+(cy-(R-4)*Math.cos(ra)).toFixed(1)+'" stroke="#bdbdbd" stroke-width="0.8"/>'); }
    // seated figure glyph
    s.push('<circle cx="'+cx+'" cy="'+(cy-14)+'" r="9" fill="#b6b6b6"/>');
    s.push('<path d="M'+(cx-24)+' '+(cy+22)+' Q'+cx+' '+(cy-8)+' '+(cx+24)+' '+(cy+22)+' Z" fill="#b6b6b6"/>');
    s.push('<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="none" stroke="#000" stroke-width="1.5"/>');
  }

  function talentTable(s, res, x, y){
    s.push('<text x="'+(x+44)+'" y="'+y+'" font-size="13" '+FW+' text-anchor="middle">DOMINANT</text>');
    s.push('<text x="'+(x+44)+'" y="'+(y+15)+'" font-size="13" '+FW+' text-anchor="middle">TALENTS</text>');
    res.ranked.forEach(function(t,i){
      var ry = y + 28 + i*23;
      s.push('<text x="'+x+'" y="'+(ry+13)+'" font-size="13" '+FW+'>'+t.digit+'</text>');
      s.push('<rect x="'+(x+16)+'" y="'+ry+'" width="56" height="18" fill="'+col(t.digit)+'" stroke="#000" stroke-width="1"/>');
      s.push('<text x="'+(x+44)+'" y="'+(ry+14)+'" font-size="13" '+FW+' text-anchor="middle">'+t.score+'</text>');
    });
    var by = y + 28 + 10*23 + 6;
    s.push('<text x="'+(x+44)+'" y="'+by+'" font-size="13" '+FW+' text-anchor="middle">SUBORDINANT</text>');
    s.push('<text x="'+(x+44)+'" y="'+(by+15)+'" font-size="13" '+FW+' text-anchor="middle">TALENTS</text>');
  }

  // one Future-Development pillar chart
  function pillars(s, res, mode, x, y, w, h){
    var ev = E.evolution(res, mode), order = ev.order, maxTs = ev.maxTs || 1;
    var axisW = 30, colArea = w - axisW*2, cw = colArea/10, top = y + 16, plotH = h - 22;
    // column headers (digits) + coloured caps
    for(var c=0;c<10;c++){
      var d = order[c], cxp = x + axisW + c*cw + cw/2;
      s.push('<text x="'+cxp+'" y="'+(y+10)+'" text-anchor="middle" font-size="11" '+FW+'>'+d+'</text>');
      var capHalf = (ev.cap[d]/maxTs)*(cw*0.42);
      s.push('<rect x="'+(cxp-capHalf).toFixed(1)+'" y="'+(top-5)+'" width="'+(2*capHalf).toFixed(1)+'" height="5" fill="'+col(d)+'" stroke="#000" stroke-width="0.4"/>');
    }
    // axis ticks
    ev.ticks.forEach(function(t){
      var gy = top + t.pos*plotH;
      s.push('<line x1="'+(x+axisW)+'" y1="'+gy.toFixed(1)+'" x2="'+(x+axisW+colArea)+'" y2="'+gy.toFixed(1)+'" stroke="#000" stroke-width="0.5"/>');
      s.push('<text x="'+(x+axisW-3)+'" y="'+(gy+3).toFixed(1)+'" text-anchor="end" font-size="8" '+FW+'>'+t.label+'</text>');
      s.push('<text x="'+(x+axisW+colArea+3)+'" y="'+(gy+3).toFixed(1)+'" font-size="8" '+FW+'>'+t.label+'</text>');
    });
    // stacked grey lozenges
    var rows = ev.rows, step = Math.max(1, Math.round(rows.length/46)), rh = plotH/(rows.length/step);
    for(var i=0;i<rows.length;i+=step){
      var ry = top + (i/rows.length)*plotH;
      for(var cc=0;cc<10;cc++){
        var dd = order[cc], cx2 = x + axisW + cc*cw + cw/2;
        var half = (rows[i].ts[dd]/maxTs)*(cw*0.42);
        if(half < 0.4) continue;
        var g = Math.round(rows[i].karma[dd]*42.5);
        s.push('<rect x="'+(cx2-half).toFixed(1)+'" y="'+ry.toFixed(1)+'" width="'+(2*half).toFixed(1)+'" height="'+(rh+0.6).toFixed(2)+'" fill="rgb('+g+','+g+','+g+')"/>');
      }
    }
  }

  function rightPanel(s, res, divx, W, Hh){
    var pw = W - divx, cxp = divx + pw/2;
    s.push('<text x="'+cxp+'" y="38" text-anchor="middle" font-size="17" '+FW+'>NAMEMAN SHOWS THE <tspan text-decoration="underline">SOULAR-SYSTEM</tspan> HIDDEN IN YOUR NAME</text>');
    var top = 56, foot = 86, rowH = (Hh - top - foot)/6;
    var lovesX = divx + 150, c1 = divx + 305, c2 = divx + 392, powX = divx + 545;
    var maxS = Math.max.apply(null, res.bands.map(function(b){return b.score;})) || 1;
    res.bands.forEach(function(b,i){
      var ry = top + i*rowH, cy = ry + rowH/2;
      if(i>0) s.push('<line x1="'+divx+'" y1="'+ry+'" x2="'+W+'" y2="'+ry+'" stroke="#000" stroke-width="1.5"/>');
      // loves / powers words
      b.loves.forEach(function(wrd,j){ s.push('<text x="'+lovesX+'" y="'+(cy-22+j*24)+'" text-anchor="middle" font-size="19" '+FW+'>'+esc(wrd.toUpperCase())+'</text>'); });
      b.powers.forEach(function(wrd,j){ s.push('<text x="'+powX+'" y="'+(cy-22+j*24)+'" text-anchor="middle" font-size="19" '+FW+'>'+esc(wrd.toUpperCase())+'</text>'); });
      // two circles sized by the band's two sector-digit scores
      var lv = res.scores[b.sectors[1]], rv = res.scores[b.sectors[0]];
      var rl = 13 + (lv/maxS)*30, rr = 13 + (rv/maxS)*30;
      s.push('<circle cx="'+c1+'" cy="'+cy+'" r="'+rl.toFixed(1)+'" fill="'+BANDCOL[i]+'" stroke="#000" stroke-width="1.2"/>');
      s.push('<circle cx="'+c2+'" cy="'+cy+'" r="'+rr.toFixed(1)+'" fill="'+BANDCOL[i]+'" stroke="#000" stroke-width="1.2"/>');
    });
    // footer
    s.push('<text x="'+cxp+'" y="'+(Hh-34)+'" text-anchor="middle" font-size="30" '+FW+'>NAMEMAN <tspan font-size="20" font-weight="500">WHERE NAMES COME TO LIFE</tspan></text>');
    s.push('<text x="'+(divx+12)+'" y="'+(Hh-14)+'" font-size="11" '+FW+'>*REGISTERED TRADEMARK</text>');
    s.push('<text x="'+(W-12)+'" y="'+(Hh-14)+'" text-anchor="end" font-size="11" '+FW+'>© NAMEMAN</text>');
  }

  function sheet(res){
    var W=1322, Hh=1046, DIVX=664, s=[];
    s.push('<svg viewBox="0 0 '+W+' '+Hh+'" xmlns="http://www.w3.org/2000/svg" font-family="Arial, Helvetica, sans-serif">');
    s.push('<rect width="'+W+'" height="'+Hh+'" fill="#ffffff"/>');
    s.push('<rect x="4" y="4" width="'+(W-8)+'" height="'+(Hh-8)+'" fill="none" stroke="#000" stroke-width="3"/>');
    s.push('<line x1="'+DIVX+'" y1="4" x2="'+DIVX+'" y2="'+(Hh-4)+'" stroke="#000" stroke-width="3"/>');
    // left header
    var mc = res.monthName.charAt(0)+res.monthName.slice(1).toLowerCase();
    s.push('<text x="20" y="34" font-size="22" '+FW+'>'+esc(mc.toUpperCase())+' '+res.dayNum+'</text>');
    s.push('<text x="335" y="40" font-size="30" font-weight="800" text-anchor="middle">'+esc(res.name.toUpperCase())+'</text>');
    miniWheel(s,res,594,116,56);
    s.push('<text x="594" y="36" font-size="15" '+FW+' text-anchor="middle">SOULAR *</text>');
    s.push('<text x="594" y="192" font-size="15" '+FW+' text-anchor="middle">SYSTEM</text>');
    legend(s,'DIMENSIONS',20,60,['SPIRITUAL','INTUITIONAL','INTELLECTUAL','SENSUAL','ENERGETIC','PHYSICAL']);
    legend(s,'ELEMENTS',20,392,['VOID','SPACE','AIR','FIRE','WATER','EARTH']);
    bigWheel(s,res,352,286,184);
    talentTable(s,res,566,250);
    s.push('<text x="232" y="520" font-size="18" '+FW+' text-anchor="middle">LOVES</text>');
    s.push('<text x="452" y="520" font-size="18" '+FW+' text-anchor="middle">POWERS</text>');
    s.push('<text x="20" y="540" font-size="12.5" '+FW+'>FUTURE DEVELOPMENT :   WIDER PATHS INDICATE TIMES OF GREATER OPPORTUNITIES</text>');
    pillars(s,res,'age',  18, 548, 626, 210);
    pillars(s,res,'year', 18, 770, 626, 232);
    // karmic help legend
    var kx=232, ky=1018;
    s.push('<text x="'+(kx-6)+'" y="'+(ky+1)+'" text-anchor="end" font-size="10" '+FW+'>KARMIC HELP</text>');
    for(var g=1;g<=5;g++){ var gg=Math.round(g*42.5); s.push('<rect x="'+(kx+g*16)+'" y="'+(ky-8)+'" width="16" height="10" fill="rgb('+gg+','+gg+','+gg+')" stroke="#000" stroke-width="0.4"/>'); }
    s.push('<text x="'+(kx+8)+'" y="'+(ky+12)+'" text-anchor="end" font-size="9" '+FW+'>LESS</text>');
    s.push('<text x="'+(kx+5*16+22)+'" y="'+(ky+12)+'" font-size="9" '+FW+'>MORE</text>');
    rightPanel(s,res,DIVX,W,Hh);
    s.push('</svg>');
    return s.join('');
  }

  function svgToPng(svg, scale){
    return new Promise(function(resolve,reject){
      var vb=/viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg), vw=+vb[1], vh=+vb[2];
      var sized=svg.replace('<svg ','<svg width="'+vw+'" height="'+vh+'" ');
      var url=URL.createObjectURL(new Blob([sized],{type:'image/svg+xml;charset=utf-8'}));
      var img=new Image(), t=setTimeout(function(){done();reject(new Error('classic svg timeout'));},10000);
      function done(){clearTimeout(t);URL.revokeObjectURL(url);}
      img.onload=function(){ try{ var sc=scale||2.2, c=document.createElement('canvas'); c.width=Math.round(vw*sc); c.height=Math.round(vh*sc);
        var x=c.getContext('2d'); x.fillStyle='#fff'; x.fillRect(0,0,c.width,c.height); x.drawImage(img,0,0,c.width,c.height);
        done(); resolve({data:c.toDataURL('image/jpeg',0.95), aspect:vh/vw}); }catch(e){ done(); reject(e); } };
      img.onerror=function(){ done(); reject(new Error('classic svg image error')); };
      img.src=url;
    });
  }

  async function download(res, filename){
    if(!root.jspdf) { return false; }
    var im = await svgToPng(sheet(res), 2.4);
    var jsPDF = root.jspdf.jsPDF, pdf = new jsPDF('l','mm','a4');
    var pw=pdf.internal.pageSize.getWidth(), ph=pdf.internal.pageSize.getHeight(), m=6;
    var iw=pw-2*m, ih=iw*im.aspect; if(ih>ph-2*m){ ih=ph-2*m; iw=ih/im.aspect; }
    pdf.addImage(im.data,'JPEG',(pw-iw)/2,(ph-ih)/2,iw,ih);
    pdf.save(filename || ('NAMEMAN - '+res.name+'.pdf'));
    return true;
  }

  root.NumClassic = { sheet: sheet, download: download, svgToPng: svgToPng };
})(typeof window !== 'undefined' ? window : globalThis);
