// == MODAL & UTILS ==================================
var _zTop=900; // PEMBETULAN: dulu 250 — lebih rendah dari #pg-login (z-index:800), sebabkan
                // modal (cth. mo-claim lepas Google sign-in) terbuka tapi tersembunyi DI BELAKANG
                // skrin log masuk. Kini 900 supaya modal sentiasa di atas #pg-login.
var _moOpenCount=0;
var _moFocusStack=[]; // P1-C: fokus stack
function openMo(id){
  var el=document.getElementById(id);
  if(!el)return;
  // P1-C: simpan fokus semasa
  _moFocusStack.push(document.activeElement||document.body);
  el.style.zIndex=++_zTop;
  el.classList.add('on');
  var md=el.querySelector('.md');
  if(md){
    md.scrollTop=0;
    var inner=md.querySelector('div[style*="overflow-y"]');
    if(inner)inner.scrollTop=0;
  }
  // Fokus ke elemen pertama yang boleh difokus
  setTimeout(function(){
    var focusable=el.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
    if(focusable.length) focusable[0].focus();
  },50);
  _moOpenCount++;
  document.body.classList.add('modal-open');
}
function closeMo(id){
  var el=document.getElementById(id);
  if(!el)return;
  el.classList.remove('on');
  // P1-C: pulihkan fokus
  var prevFocus=_moFocusStack.pop();
  if(prevFocus&&prevFocus.focus){setTimeout(function(){try{prevFocus.focus();}catch(e){}},50);}
  _moOpenCount=Math.max(0,_moOpenCount-1);
  if(_moOpenCount===0){
    document.body.classList.remove('modal-open');
    document.body.style.overflow='';
    document.documentElement.style.overflow='';
  }
}
// PEMBETULAN: modal dinamik (dibina guna document.createElement, cth. mo-reset-pin,
// mo-edit-maklumat, mo-sekolah) — guna helper ini supaya turut kunci skrol latar
// belakang, konsisten dengan openMo()/closeMo() untuk modal statik.
function _openDynMo(el){
  if(!el) return;
  document.body.appendChild(el);
  el.style.zIndex=++_zTop;
  _moOpenCount++;
  document.body.classList.add('modal-open');
}
function _closeDynMo(id){
  var el=document.getElementById(id);
  if(el) el.remove();
  _moOpenCount=Math.max(0,_moOpenCount-1);
  if(_moOpenCount===0){
    document.body.classList.remove('modal-open');
    document.body.style.overflow='';
    document.documentElement.style.overflow='';
  }
}
// P1-A: Backdrop click-to-close DINYAHAKTIFKAN — modal hanya ditutup melalui butang Tutup.
function gv(id){return document.getElementById(id).value.trim();}
function ej(s){return String(s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");}
function cntBy(arr,key){var c={};arr.forEach(function(i){var k=i[key]||'—';c[k]=(c[k]||0)+1;});return c;}
function uniqGuru(pny){var u={};pny.forEach(function(r){var k=r['No KP Guru']||r['Nama Guru'];if(k&&r['Nama Guru'])u[k]=r;});return Object.values(u);}
function uniqPes(pny){var u={};pny.forEach(function(r){var k=r['No KP Peserta']||r['Nama Peserta'];if(k&&r['Nama Peserta'])u[k]=r;});return Object.values(u);}
function fd(d){if(!d)return '—';var dt=new Date(d);return isNaN(dt)?String(d):dt.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});}
function _trackAccess(pid, action){
  if(!_sesi)return;
  if(!window._lastAccess) window._lastAccess={};
  var now=new Date().toISOString();
  var roleMap={admin:'Admin',pkk:'PKK',guru:'Guru'};
  window._lastAccess[pid]={
    by:_sesi.nama||_sesi.role||'—',
    role:roleMap[_sesi.role]||_sesi.role||'',
    action:action,
    at:now
  };
  // Update strip pada kad berkenaan sahaja
  var strip=document.getElementById('le-'+pid);
  if(strip){strip.innerHTML=_fmtAccess(window._lastAccess[pid]);strip.classList.add('on');}
}
function _fmtAccess(info){
  if(!info||!info.at)return '';
  var dt=new Date(info.at);
  var pad=function(n){return n<10?'0'+n:n;};
  var tStr=pad(dt.getDate())+'/'+pad(dt.getMonth()+1)+'/'+dt.getFullYear()+' '+pad(dt.getHours())+':'+pad(dt.getMinutes());
  return '👁 <strong>'+(info.by||'—')+'</strong>'+(info.role?' ('+info.role+')':'')+' &bull; '+(info.action||'')+'&nbsp;&bull;&nbsp;'+tStr;
}
function toast(msg,type){
  type=type||'in';var c=document.getElementById('tc');
  var el=document.createElement('div');el.className='toast '+type;
  el.innerHTML='<span>'+(type==='ok'?'✓':type==='er'?'✗':'ℹ')+'</span>'+msg;
  c.appendChild(el);setTimeout(function(){if(el.parentNode)el.remove();},3200);
}

// == FUNGSI CARIAN ===================================
var _srchTimer=null;
function toggleReveal(btn){
  if(btn.dataset.shown==='1'){
    btn.textContent=btn.dataset.label||btn.textContent.split(':')[0];
    btn.dataset.shown='0';
    // Restore original label
    if(btn.dataset.origLabel) btn.innerHTML=btn.dataset.origLabel;
  } else {
    if(!btn.dataset.origLabel) btn.dataset.origLabel=btn.innerHTML;
    btn.innerHTML='<span style="font-family:monospace;font-weight:700;letter-spacing:.5px;">'+esc(btn.dataset.secret)+'</span> <span style="font-size:.65em;opacity:.7;">(klik sembunyikan)</span>';
    btn.dataset.shown='1';
  }
}

// Carian header dibuang — fungsi carian dipindah ke modal sahaja

function openSrchDetProg(p){
  var pnc=(_aPnc||[]).filter(function(e){return e['Nama Program']===p['Nama Program'];});
  var pny=(_aP||[]).filter(function(r){return r['Nama Program']===p['Nama Program'];});
  // Unique pes/guru
  var uGuru={}, uPes={};
  pny.forEach(function(r){
    var gk=r['No KP Guru']||r['Nama Guru'];if(gk&&r['Nama Guru'])uGuru[gk]=r;
    var pk=r['No KP Peserta']||r['Nama Peserta'];if(pk&&r['Nama Peserta'])uPes[pk]=r;
  });
  var gList=Object.values(uGuru), pList=Object.values(uPes);
  var uSek={}; pny.forEach(function(r){if(r['Nama Sekolah'])uSek[r['Nama Sekolah']]=1;});
  var now=new Date(); var printDate=now.toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});
  var html='';
  html+='<div style="text-align:center;border-bottom:2px solid var(--red);padding-bottom:.9rem;margin-bottom:1rem;">'
    +'<div class="rum-logo"><img src="'+LOGO_URL+'" alt="" style="max-height:48px;object-fit:contain;"></div>'
    +'<div style="font-family:Montserrat,sans-serif;font-size:1.1rem;font-weight:900;color:var(--red);">'+p['Nama Program']+'</div>'
    +'<div style="font-size:.72rem;color:var(--g5);margin-top:.2rem;">'+p['Bidang']+' &bull; '+p['Peringkat']+' &bull; '+(p['Kategori']||'INDIVIDU')+'</div>'
    +'</div>';
  html+='<div class="rsec"><div class="rtit">1. Maklumat Program</div>'
    +[['Pengelola',p['Pengelola']],['Peringkat',p['Peringkat']],['Tarikh',fd(p['Tarikh'])],['Tempat',p['Tempat']||'—'],['Status',p['Status']],['Sekolah',Object.keys(uSek).length],['Peserta (unik)',pList.length],['Guru (unik)',gList.length]]
    .map(function(r){return '<div class="rrow"><span class="rk">'+r[0]+'</span><span class="rv">'+r[1]+'</span></div>';}).join('')
    +'</div>';
  // Pencapaian
  if(pnc.length){
    html+='<div class="rsec"><div class="rtit">2. Pencapaian</div>';
    var byT={};
    pnc.forEach(function(e){var tk=(e['Tempat']||'').toUpperCase();if(!byT[tk])byT[tk]=[];byT[tk].push(e);});
    TPT_STANDARD.forEach(function(t){
      if(!byT[t.l])return;
      byT[t.l].forEach(function(e){
        var per=(e['Peringkat']||'SEKOLAH').toUpperCase();
        var m=mPts(per,t.l);
        html+='<div class="rrow"><span class="rk" style="color:var(--red);">'+t.l+'</span>'
          +'<span class="rv"><strong>'+(e['Nama Sekolah']||'—')+'</strong>'
          +(e['Nama Peserta']?'<div style="font-size:.65rem;color:var(--g6);">🧑‍🎓 '+e['Nama Peserta']+'</div>':'')
          +(e['Nama Guru']?'<div style="font-size:.65rem;color:var(--g5);">👨‍🏫 '+e['Nama Guru']+'</div>':'')
          +'</span></div>';
      });
    });
    html+='</div>';
  }
  // Peserta list (compact)
  if(pList.length){
    html+='<div class="rsec"><div class="rtit">3. Peserta ('+pList.length+')</div>';
    html+='<div style="display:flex;flex-wrap:wrap;gap:.28rem;padding:.3rem 0;">';
    pList.forEach(function(ps){
      html+='<span style="font-size:.65rem;background:var(--g1);border-radius:20px;padding:.12rem .42rem;">'+ps['Nama Peserta']+'</span>';
    });
    html+='</div></div>';
  }
  // Demografi
  if(pny.length){
    html+='<div class="rsec"><div class="rtit">4. Demografi</div>'
      +'<div class="dgrid">'
      +dBox('Jantina Guru',cntBy(uniqGuru(pny),'Jantina Guru'))
      +dBox('Jantina Peserta',cntBy(uniqPes(pny),'Jantina Peserta'))
      +'</div></div>';
  }
  document.getElementById('sdet-inner').innerHTML=html;
  buildSdetPrint('prog',{p:p,pnc:pnc,pny:pny,gList:gList,pList:pList,uSek:uSek,printDate:printDate});
  openMo('mo-sdet');
}

// == UNIFIED PRINT BUILDER ======================================
function buildSdetPrint(type,d){
  var out=''; var LF='https://drive.google.com/thumbnail?id=16W_2I2bcuea1YwDnya0v-M94AGB-A1A3&sz=w800';
  var secT=function(t){return '<div style="font-family:Montserrat,sans-serif;font-size:9pt;font-weight:900;color:#c0392b;border-left:3pt solid #c0392b;padding-left:6pt;margin:10pt 0 5pt;text-transform:uppercase;">'+t+'</div>';};
  var rowH=function(k,v){return '<div style="display:flex;border-bottom:0.4pt solid #eee;padding:3pt 0;font-size:8.5pt;"><span style="color:#777;min-width:110pt;font-weight:600;flex-shrink:0;">'+k+'</span><span style="font-weight:700;color:#111;">'+v+'</span></div>';};
  var hdr=function(title,sub1,sub2){
    return '<div style="text-align:center;padding-bottom:8pt;margin-bottom:10pt;border-bottom:2pt solid #c0392b;">'
      +'<div style="margin-bottom:5pt;"><img src="'+LF+'" alt="" style="max-height:52px;max-width:170px;object-fit:contain;"></div>'
      +'<div style="font-family:Montserrat,sans-serif;font-size:13pt;font-weight:900;color:#c0392b;">'+title+'</div>'
      +(sub1?'<div style="font-size:8.5pt;color:#666;margin-top:2pt;">'+sub1+'</div>':'')
      +'<div style="font-size:7.5pt;color:#aaa;margin-top:3pt;">Dicetak: '+d.printDate+'</div>'
      +'</div>';
  };

  if(type==='sek'){
    var sekNm=d.sekNm,rows=d.rows,allPnc=d.allPnc,gList=d.gList,pList=d.pList;
    var progOrder=d.progOrder, progMap=d.progMap, kod=d.kod;
    out+=hdr(sekNm,'Kod: '+kod+' &nbsp;|&nbsp; '+progOrder.length+' Program &nbsp;|&nbsp; '+pList.length+' Peserta &nbsp;|&nbsp; '+gList.length+' Guru');
    // Per-program collation
    progOrder.forEach(function(pr,pi){
      var pd=progMap[pr]; var pPnc=pd.pnc; var info=pd.progInfo;
      var pgGuru={}, pgPes={};
      pd.rows.forEach(function(p){
        var gk=p['No KP Guru']||p['Nama Guru'];if(gk&&p['Nama Guru'])pgGuru[gk]=p;
        var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&p['Nama Peserta'])pgPes[pk]=p;
      });
      var pgGL=Object.values(pgGuru), pgPL=Object.values(pgPes);
      out+=secT((pi+1)+'. '+pr);
      out+='<div style="font-size:8pt;color:#555;margin-bottom:4pt;">'+(info['Peringkat']||'—')+(info['Tarikh']?' &bull; '+fd(info['Tarikh']):'')+(info['Tempat']?' &bull; '+info['Tempat']:'')+'</div>';
      if(pPnc.length){
        out+='<table style="width:100%;border-collapse:collapse;margin-bottom:5pt;font-size:8pt;">'
          +'<thead><tr><th style="background:#c0392b;color:#fff;padding:2.5pt 5pt;text-align:left;font-size:7pt;">Tempat</th>'
          +'<th style="background:#c0392b;color:#fff;padding:2.5pt 5pt;text-align:left;font-size:7pt;">Peserta</th>'
          +'<th style="background:#c0392b;color:#fff;padding:2.5pt 5pt;text-align:left;font-size:7pt;">Guru</th>'
          +'<th style="background:#c0392b;color:#fff;padding:2.5pt 5pt;text-align:center;font-size:7pt;">Mata</th>'
          +'</tr></thead><tbody>';
        pPnc.forEach(function(e,i){
          var per=(e['Peringkat']||'SEKOLAH').toUpperCase();
          out+='<tr style="background:'+(i%2===0?'#fff':'#fdf2f2')+'">'
            +'<td style="padding:2pt 5pt;border:0.3pt solid #eee;font-weight:700;color:#c0392b;">'+e['Tempat']+'</td>'
            +'<td style="padding:2pt 5pt;border:0.3pt solid #eee;">'+( e['Nama Peserta']||'—')+'</td>'
            +'<td style="padding:2pt 5pt;border:0.3pt solid #eee;color:#777;">'+( e['Nama Guru']||'—')+'</td>'
            +'<td style="padding:2pt 5pt;border:0.3pt solid #eee;text-align:center;font-weight:900;color:#c0392b;">'+mPts(per,e['Tempat'])+'</td></tr>';
        });
        out+='</tbody></table>';
      }
      // Peserta+Guru in 2-col
      out+='<table style="width:100%;border-collapse:separate;border-spacing:4pt;margin-bottom:2pt;font-size:7.5pt;">'
        +'<tr>'
        +'<td style="width:50%;vertical-align:top;background:#f8f9fa;border-radius:3pt;padding:4pt;">'
        +'<div style="font-weight:800;color:#c0392b;margin-bottom:2pt;font-size:7pt;text-transform:uppercase;">Peserta ('+pgPL.length+')</div>'
        +pgPL.map(function(p,i){return '<div style="padding:1.5pt 0;border-bottom:0.3pt solid #eee;">'+p['Nama Peserta']+(p['Jantina Peserta']?' <span style="color:#888;">'+p['Jantina Peserta']+'</span>':'')+'</div>';}).join('')
        +'</td>'
        +'<td style="width:50%;vertical-align:top;background:#f8f9fa;border-radius:3pt;padding:4pt;">'
        +'<div style="font-weight:800;color:#c0392b;margin-bottom:2pt;font-size:7pt;text-transform:uppercase;">Guru ('+pgGL.length+')</div>'
        +pgGL.map(function(g,i){return '<div style="padding:1.5pt 0;border-bottom:0.3pt solid #eee;">'+g['Nama Guru']+(g['Jantina Guru']?' <span style="color:#888;">'+g['Jantina Guru']+'</span>':'')+'</div>';}).join('')
        +'</td>'
        +'</tr></table>';
    });
    // Demografi
    out+='<div style="page-break-before:auto;margin-top:8pt;">'+secT('Demografi Keseluruhan');
    out+='<table style="width:100%;border-collapse:separate;border-spacing:4pt;font-size:8pt;">'
      +'<tr>'
      +'<td style="width:50%;vertical-align:top;background:#fdf2f2;border-radius:3pt;padding:5pt;">'
      +'<div style="font-weight:800;color:#c0392b;margin-bottom:3pt;font-size:7pt;text-transform:uppercase;">Jantina Guru</div>'
      +Object.entries(cntBy(uniqGuru(rows),'Jantina Guru')).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:1.5pt 0;border-bottom:0.3pt solid #fde8e8;"><span>'+e[0]+'</span><span style="font-weight:700;color:#c0392b;">'+e[1]+'</span></div>';}).join('')
      +'</td>'
      +'<td style="width:50%;vertical-align:top;background:#fdf2f2;border-radius:3pt;padding:5pt;">'
      +'<div style="font-weight:800;color:#c0392b;margin-bottom:3pt;font-size:7pt;text-transform:uppercase;">Jantina Peserta</div>'
      +Object.entries(cntBy(uniqPes(rows),'Jantina Peserta')).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:1.5pt 0;border-bottom:0.3pt solid #fde8e8;"><span>'+e[0]+'</span><span style="font-weight:700;color:#c0392b;">'+e[1]+'</span></div>';}).join('')
      +'</td></tr></table></div>';

  }else if(type==='pes'){
    var pesNm=d.pesNm,sekNm=d.sekNm,rows=d.rows,allPnc=d.allPnc,progOrder=d.progOrder,progMap=d.progMap,info=d.info,totalPts=d.totalPts;
    out+=hdr('🧑‍🎓 '+pesNm,'Sekolah: '+sekNm+(totalPts?' &nbsp;|&nbsp; Jumlah Mata: '+totalPts:''));
    out+=secT('1. Maklumat Peserta');
    out+=rowH('No. KP',info['No KP Peserta']||'—')+rowH('Jantina',info['Jantina Peserta']||'—')+rowH('Bangsa',info['Bangsa Peserta']||'—')+rowH('Sekolah',sekNm);
    out+=secT('2. Penyertaan mengikut Program');
    progOrder.forEach(function(pr,pi){
      var pd=progMap[pr]; var pPnc=pd.pnc; var info2=pd.progInfo;
      out+='<div style="margin-bottom:5pt;padding:4pt 6pt;border:0.5pt solid #ddd;border-radius:3pt;page-break-inside:avoid;">'
        +'<div style="font-size:8pt;font-weight:700;color:#1a1a2e;">'+pr+'</div>'
        +'<div style="font-size:7.5pt;color:#777;">'+(info2['Peringkat']||'—')+(info2['Tarikh']?' &bull; '+fd(info2['Tarikh']):'')+'</div>';
      if(pPnc.length){
        out+='<div style="margin-top:3pt;">';
        pPnc.forEach(function(e){
          var per=(e['Peringkat']||'SEKOLAH').toUpperCase();
          var m=mPts(per,e['Tempat']||'');
          out+='<span style="background:#c0392b;color:#fff;border-radius:20pt;padding:1.5pt 6pt;font-size:7pt;font-weight:700;margin-right:3pt;">'+e['Tempat']+' +'+m+'pt</span>';
        });
        out+='</div>';
      }
      out+='</div>';
    });

  }else if(type==='guru'){
    var guruNm=d.guruNm,sekNm=d.sekNm,rows=d.rows,allPnc=d.allPnc,progOrder=d.progOrder,progMap=d.progMap,info=d.info,totalPts=d.totalPts;
    out+=hdr('👨‍🏫 '+guruNm,'Sekolah: '+sekNm+(totalPts?' &nbsp;|&nbsp; Jumlah Mata: '+totalPts:''));
    out+=secT('1. Maklumat Guru');
    out+=rowH('No. KP',info['No KP Guru']||'—')+rowH('Jantina',info['Jantina Guru']||'—')+rowH('Bangsa',info['Bangsa Guru']||'—')+rowH('No. Tel',_fmtTel60(info['No Tel Guru']))+rowH('Sekolah',sekNm);
    out+=secT('2. Penyertaan mengikut Program');
    progOrder.forEach(function(pr,pi){
      var pd=progMap[pr]; var pPnc=pd.pnc; var info2=pd.progInfo;
      var pgPes={};
      pd.rows.forEach(function(p){var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&p['Nama Peserta'])pgPes[pk]=p;});
      var pgPL=Object.values(pgPes);
      out+='<div style="margin-bottom:5pt;padding:4pt 6pt;border:0.5pt solid #ddd;border-radius:3pt;page-break-inside:avoid;">'
        +'<div style="font-size:8pt;font-weight:700;color:#1a1a2e;">'+pr+'</div>'
        +'<div style="font-size:7.5pt;color:#777;">'+(info2['Peringkat']||'—')+(info2['Tarikh']?' &bull; '+fd(info2['Tarikh']):'')+'</div>';
      if(pgPL.length)out+='<div style="font-size:7.5pt;color:#555;margin-top:2pt;">Peserta: '+pgPL.map(function(p){return p['Nama Peserta'];}).join(', ')+'</div>';
      if(pPnc.length){
        out+='<div style="margin-top:3pt;">';
        pPnc.forEach(function(e){
          var per=(e['Peringkat']||'SEKOLAH').toUpperCase();
          var m=mPts(per,e['Tempat']||'');
          out+='<span style="background:#c0392b;color:#fff;border-radius:20pt;padding:1.5pt 6pt;font-size:7pt;font-weight:700;margin-right:3pt;">'+e['Tempat']+' +'+m+'pt</span>';
        });
        out+='</div>';
      }
      out+='</div>';
    });

  }else if(type==='prog'){
    var p2=d.p,pnc=d.pnc,pny=d.pny,gList=d.gList,pList=d.pList,uSek=d.uSek;
    var nSek=Object.keys(uSek).length;
    out+=hdr(p2['Nama Program'],p2['Bidang']+' &bull; '+p2['Peringkat']+' &bull; '+(p2['Kategori']||'INDIVIDU'));
    out+=secT('1. Maklumat Program');
    [['Pengelola',p2['Pengelola']],['Peringkat',p2['Peringkat']],['Tarikh',fd(p2['Tarikh'])],['Tempat',p2['Tempat']||'—'],['Status',p2['Status']],['Sekolah',nSek],['Peserta (unik)',pList.length],['Guru (unik)',gList.length]]
      .forEach(function(r){out+=rowH(r[0],r[1]);});
    if(pnc.length){
      out+=secT('2. Pencapaian');
      out+='<table style="width:100%;border-collapse:collapse;font-size:8pt;">'
        +'<thead><tr><th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Tempat</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Sekolah</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Peserta</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Guru</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:center;font-size:7pt;">Mata</th>'
        +'</tr></thead><tbody>';
      var byT2={};
      pnc.forEach(function(e){var tk=(e['Tempat']||'').toUpperCase();if(!byT2[tk])byT2[tk]=[];byT2[tk].push(e);});
      var ri=0;
      TPT_STANDARD.forEach(function(t){
        (byT2[t.l]||[]).forEach(function(e){
          var per=(e['Peringkat']||'SEKOLAH').toUpperCase();
          out+='<tr style="background:'+(ri%2===0?'#fff':'#fdf2f2')+'">'
            +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;font-weight:700;color:#c0392b;">'+t.l+'</td>'
            +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;font-weight:700;">'+(e['Nama Sekolah']||'—')+'</td>'
            +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;">'+(e['Nama Peserta']||'—')+'</td>'
            +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;color:#777;">'+(e['Nama Guru']||'—')+'</td>'
            +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;text-align:center;font-weight:900;color:#c0392b;">'+mPts(per,t.l)+'</td></tr>';
          ri++;
        });
      });
      out+='</tbody></table>';
    }
    // Peserta table
    if(pList.length){
      out+=secT('3. Senarai Peserta ('+pList.length+')');
      out+='<table style="width:100%;border-collapse:collapse;font-size:8pt;">'
        +'<thead><tr><th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Nama Peserta</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:left;font-size:7pt;">Sekolah</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:center;font-size:7pt;">Jantina</th>'
        +'<th style="background:#c0392b;color:#fff;padding:3pt 5pt;text-align:center;font-size:7pt;">Bangsa</th>'
        +'</tr></thead><tbody>';
      pList.forEach(function(p,i){
        out+='<tr style="background:'+(i%2===0?'#fff':'#fdf2f2')+'">'
          +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;font-weight:700;">'+p['Nama Peserta']+'</td>'
          +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;">'+(p['Nama Sekolah']||'—')+'</td>'
          +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;text-align:center;">'+(p['Jantina Peserta']||'—')+'</td>'
          +'<td style="padding:2.5pt 5pt;border:0.3pt solid #eee;text-align:center;">'+(p['Bangsa Peserta']||'—')+'</td></tr>';
      });
      out+='</tbody></table>';
    }
    // Demografi
    out+=secT('4. Demografi');
    out+='<table style="width:100%;border-collapse:separate;border-spacing:4pt;font-size:8pt;"><tr>'
      +'<td style="width:50%;vertical-align:top;background:#fdf2f2;border-radius:3pt;padding:5pt;">'
      +'<div style="font-weight:800;color:#c0392b;margin-bottom:3pt;font-size:7pt;text-transform:uppercase;">Jantina Peserta</div>'
      +Object.entries(cntBy(uniqPes(pny),'Jantina Peserta')).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:1.5pt 0;border-bottom:0.3pt solid #fde8e8;"><span>'+e[0]+'</span><span style="font-weight:700;color:#c0392b;">'+e[1]+'</span></div>';}).join('')
      +'</td>'
      +'<td style="width:50%;vertical-align:top;background:#fdf2f2;border-radius:3pt;padding:5pt;">'
      +'<div style="font-weight:800;color:#c0392b;margin-bottom:3pt;font-size:7pt;text-transform:uppercase;">Jantina Guru</div>'
      +Object.entries(cntBy(uniqGuru(pny),'Jantina Guru')).map(function(e){return '<div style="display:flex;justify-content:space-between;padding:1.5pt 0;border-bottom:0.3pt solid #fde8e8;"><span>'+e[0]+'</span><span style="font-weight:700;color:#c0392b;">'+e[1]+'</span></div>';}).join('')
      +'</td></tr></table>';
  }

  document.getElementById('sdet-print-portal').innerHTML=out;
}

function printSdet(){
  var p=document.getElementById('sdet-print-portal');
  if(!p||!p.innerHTML.trim()){toast('Tiada data untuk cetak','er');return;}
  p.style.display='block';
  window.print();
  p.style.display='none';
}

// == MODAL SEARCH — Ranking ===================================
var _moreData=[]; // full sorted ranking array stored when modal opens

function filterMore(q){
  var cl=document.getElementById('more-srch-clear');
  if(cl) cl.style.display=q?'block':'none';
  var lq=(q||'').toLowerCase().trim();
  var el=document.createElement('div'); el.className='rl';
  var filtered=lq?_moreData.filter(function(e){return e[0].toLowerCase().indexOf(lq)>-1;}):_moreData;
  var cnt=document.getElementById('more-srch-count');
  if(cnt) cnt.textContent=lq?(filtered.length+' daripada '+_moreData.length+' rekod ditemui'):'';
  if(!filtered.length){
    document.getElementById('more-body').innerHTML='<div class="empty"><div class="ei">🔍</div><h3>Tiada hasil</h3></div>';
    return;
  }
  var _type=_moreData._type||'sek';
  filtered.forEach(function(e,i){
    // find original rank
    var origRank=_moreData.indexOf(e);
    var c=origRank===0?'r1':origRank===1?'r2':origRank===2?'r3':'rX';
    var div=document.createElement('div'); div.className='rit';
    var disp=e[1].display||e[0];
    var sek=e[1].sekolah||'';
    var subHtml=(!_isSekType(_type)&&sek)?'<div class="rsub">· '+sek+'</div>':'';
    div.innerHTML='<div class="rbg '+c+'">'+(origRank+1)+'</div><div class="rn">'+disp+subHtml+'</div><div class="rs">'+e[1].total+' PT</div>';
    (function(nm,tp){div.addEventListener('click',function(){showDet(nm,tp);});})(e[0],_type);
    el.appendChild(div);
  });
  document.getElementById('more-body').innerHTML='';
  document.getElementById('more-body').appendChild(el);
}

function clearMoreSrch(){
  var inp=document.getElementById('more-srch');
  if(inp){inp.value='';inp.focus();}
  filterMore('');
}

// == MODAL SEARCH — Pencapaian =================================
var _morepBp={}; // full bp map stored when modal opens
var _morepKeys=[]; // full keys list

function filterMorep(q){
  var cl=document.getElementById('morep-srch-clear');
  if(cl) cl.style.display=q?'block':'none';
  var lq=(q||'').toLowerCase().trim();
  var cnt=document.getElementById('morep-srch-count');
  var filtered=lq?_morepKeys.filter(function(k){
    // Match program name, or any school/peserta/guru inside
    if(k.toLowerCase().indexOf(lq)>-1) return true;
    var rows=_morepBp[k]||[];
    return rows.some(function(r){
      return (r['Nama Sekolah']||'').toLowerCase().indexOf(lq)>-1
          || (r['Nama Peserta']||'').toLowerCase().indexOf(lq)>-1
          || (r['Nama Guru']||'').toLowerCase().indexOf(lq)>-1;
    });
  }):_morepKeys;
  if(cnt) cnt.textContent=lq?(filtered.length+' daripada '+_morepKeys.length+' program ditemui'):'';
  var body2=document.getElementById('morep-body');
  if(!filtered.length){
    body2.innerHTML='<div class="empty"><div class="ei">🔍</div><h3>Tiada hasil untuk "'+q+'"</h3></div>';
  }else{
    body2.innerHTML=''; body2.appendChild(renderPencNameList(_morepBp,filtered));
  }
}

function clearMorepSrch(){
  var inp=document.getElementById('morep-srch');
  if(inp){inp.value='';inp.focus();}
  filterMorep('');
}

