// == PAGE 3 — DASHBOARD ================================
// 3-phase progressive render: stats → rankings → charts+table
// Cetak ringkasan dashboard (stat kad + jadual program sahaja)
function printDashRingkasan(){
  var pgEl=document.getElementById('pg-dashboard');
  if(!pgEl){toast('Tiada data dashboard','er');return;}
  // Bina window cetak
  var stats=document.querySelector('.sgrid');
  var progTbl=document.getElementById('prog-tbl-wrap');
  var ts=document.getElementById('dash-ts');
  var statsHTML=stats?stats.outerHTML:'';
  var tblHTML=progTbl?progTbl.outerHTML:'';
  var tsText=ts?ts.textContent:'';
  var now=new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});
  var w=window.open('','_blank');
  if(!w){toast('Sila benarkan popup untuk cetak','er');return;}
  w.document.write('<!DOCTYPE html><html lang="ms"><head><meta charset="UTF-8">'
    +'<title>Ringkasan Dashboard UPBM SUBIS</title>'
    +'<style>body{font-family:Arial,sans-serif;font-size:12px;color:#222;padding:1.5rem;}'
    +'.sgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1rem;}'
    +'.sc{background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:.6rem .8rem;display:flex;align-items:center;gap:.5rem;}'
    +'.sico{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:.8rem;}'
    +'.snum{font-size:1.4rem;font-weight:900;color:#222;line-height:1;}'
    +'.slbl{font-size:.55rem;font-weight:600;color:#888;text-transform:uppercase;margin-top:.1rem;}'
    +'.ir{background:rgba(192,57,43,.09);}.ig{background:rgba(39,174,96,.08);}'
    +'.ib{background:rgba(52,152,219,.08);}.io{background:rgba(230,126,34,.08);}'
    +'table{width:100%;border-collapse:collapse;font-size:11px;margin-top:1rem;}'
    +'thead th{background:#c0392b;color:#fff;padding:.4rem .5rem;text-align:left;font-size:10px;text-transform:uppercase;}'
    +'tbody tr{border-bottom:1px solid #eee;}'
    +'tbody td{padding:.35rem .5rem;color:#555;}'
    +'.ptbl-status{display:inline-block;padding:.1rem .4rem;border-radius:10px;font-size:9px;font-weight:700;}'
    +'.s-aktif{background:rgba(39,174,96,.1);color:#1e8449;}.s-draft{background:#fef9e7;color:#b7770d;}.s-tutup{background:#fdf2f2;color:#c0392b;}'
    +'h1{font-size:14px;font-weight:900;margin-bottom:.2rem;}'
    +'.btn-fs,.ch-fs-btn,.cbtn,.btn{display:none!important;}'
    +'@media print{body{padding:0;}.no-print{display:none!important;}}'
    +'</style></head><body>'
    +'<div style="text-align:center;border-bottom:2px solid #c0392b;padding-bottom:.7rem;margin-bottom:.8rem;">'
    +'<h1>UPBM SUBIS — Ringkasan Dashboard</h1>'
    +'<div style="font-size:10px;color:#888;">'+now+(tsText?' &nbsp;|&nbsp; '+tsText:'')+'</div></div>'
    +statsHTML
    +'<h2 style="font-size:12px;font-weight:800;margin:.8rem 0 .3rem;border-left:3px solid #c0392b;padding-left:.5rem;">SENARAI PROGRAM</h2>'
    +tblHTML
    +'</body></html>');
  w.document.close();
  w.focus();
  setTimeout(function(){w.print();},400);
}

// Toggle expandable sections dalam dashboard
function _togDashSection(bodyId, btnId){
  var body=document.getElementById(bodyId);
  var btn=document.getElementById(btnId);
  if(!body)return;
  var isClosed=body.classList.contains('cls');
  body.classList.toggle('cls',!isClosed);
  if(btn)btn.textContent=isClosed?'▲ TUTUP':'▼ BUKA';
}

function _updateDashTimestamp(){
  var el=document.getElementById('dash-ts');
  if(!el) return;
  var now=new Date();
  var hh=String(now.getHours()).padStart(2,'0'), mm=String(now.getMinutes()).padStart(2,'0');
  el.textContent='Dikemaskini: '+hh+':'+mm;
}
async function loadDash(bust, silent){
  if(bust)cBust();
  if(!silent) showOv('MEMUATKAN DASHBOARD...');
  try{
    var r=await run('getAllDataGS');
    var pg=(r&&r.programs)?r.programs:[];
    var py=(r&&r.penyertaan)?r.penyertaan:[];
    var pc=(r&&r.pencapaian)?r.pencapaian:[];
    _aP=py;_aPnc=pc;_aPg=pg;

    // Phase 1 — kad statistik DIKIRA oleh rebuildDash() (bertapis, lalai Teras sahaja).
    // Jangan tulis kiraan mentah di sini: ia berlumba dengan rebuildDash() dan boleh menimpa nilai bertapis.
    buildMarkahGrid();
    _updateDashTimestamp();
    if(!silent) hideOv(); // release overlay early

    // Reset all filters on fresh load
    resetDashFilters(true); // true = silent (no rebuildDash yet, called below)

    // Phase 2+3 — rankings, charts, table
    requestAnimationFrame(function(){
      rebuildDash();
    });
  }catch(e){
    if(silent){ console.warn('loadDash(silent) gagal, diabaikan senyap:', e.message); }
    else{ hideOv(); toast('Gagal: '+e.message,'er'); }
  }
}

// ISU 4: Kedudukan keutamaan tempat — guna untuk susun rekod Pencapaian sebelum diproses,
// supaya kredit Pelibatan fallback (Step 2b) sentiasa melekat pada pencapaian TERBAIK peserta
// itu untuk program tersebut, bukan ikut turutan rekod dlm pangkalan data (non-deterministic).
function _tempatRank(t){
  t=(t||'').toUpperCase();
  if(t.indexOf('PERTAMA')>-1) return 1;
  if(t.indexOf('KEDUA')>-1) return 2;
  if(t.indexOf('KETIGA')>-1) return 3;
  if(t.indexOf('KEEMPAT')>-1) return 4;
  if(t.indexOf('BERSAMA')>-1) return 4.5;
  if(t.indexOf('KELIMA')>-1) return 5;
  return 99;
}
// ISU 7: Skop dedup Pelibatan — 'PROGRAM' (1 kredit setiap program, tak kira kategori) ialah
// polisi rasmi semasa yang dipersetujui. Tukar ke 'KATEGORI' jika dasar berubah kelak supaya
// 1 kredit diberi bagi SETIAP kategori dalam program yang sama — tanpa gali semula logik dedup.
var PELIBATAN_DEDUP_SCOPE='PROGRAM';
// == POLISI AKTIVITI LUAR (Projek 7) — SATU tempat untuk menukar dasar markah ==========
// Aktiviti luar = tidak semua sekolah menyertai. Kredit Pelibatan (mis. 17 mata KEBANGSAAN hanya kerana berdaftar)
// boleh memberi kelebihan kuantiti kepada sekolah yang lebih banyak menyertai, jadi lalai: PENCAPAIAN sahaja.
//   pelibatan : 'TIADA' (lalai; aktiviti luar dikira pada pencapaian sahaja) | 'SETENGAH' (50%) | 'PENUH'
//   had       : maksimum mata aktiviti luar bagi setiap sekolah/peserta/guru (null = tiada had)
var LUAR_POLISI={pelibatan:'TIADA', had:null};
var LUAR_FAKTOR_PELIBATAN={TIADA:0, SETENGAH:0.5, PENUH:1};
var _dashJenis=''; // jenis aktiviti Dashboard: '' = Teras sahaja (lalai, ranking rasmi) | 'LUAR' | 'SEMUA' (komprehensif)
function _pelibatanDedupKey(k, progId, kat){
  return PELIBATAN_DEDUP_SCOPE==='KATEGORI' ? (progId+'|'+kat+'|'+k) : (progId+'|'+k);
}

function getSkor(pc, field, py, pg){
  // py  = penyertaan rows (_aP)
  // pg  = program list (_aPg) — needed for Peringkat of penyertaan entries
  var sc={};
  var bSeen={}; // berkumpulan dedup
  // ISU 4: susun ikut keutamaan tempat (Pertama→Kelima→lain) supaya pemprosesan deterministik
  pc=(pc||[]).slice().sort(function(a,b){
    var ra=_tempatRank(a['Tempat']), rb=_tempatRank(b['Tempat']);
    if(ra!==rb) return ra-rb;
    return String(a['Kategori']||'').localeCompare(String(b['Kategori']||''));
  });

  // Build progId → Peringkat map from program list
  var progPer={}, progKat={}, luarSet={};
  (pg||[]).forEach(function(p){ progPer[p['ID']]=(p['Peringkat']||'SEKOLAH').toUpperCase(); progKat[p['ID']]=(p['Kategori']||'INDIVIDU').toUpperCase(); if(p['Aktiviti Luar']===true) luarSet[p['ID']]=1; });

  // Helper — bina kunci unik & nama paparan
  function _entityKey(p){
    if(field==='Nama Sekolah') return p['Nama Sekolah']||'';
    if(field==='Nama Peserta'){
      var kp=p['No KP Peserta']||'';
      var nm=p['Nama Peserta']||'';
      return kp ? 'KP:'+kp : nm+'|'+(p['Nama Sekolah']||'');
    }
    if(field==='Nama Guru'){
      var kpg=p['No KP Guru']||'';
      var nmg=p['Nama Guru']||'';
      return kpg ? 'KP:'+kpg : nmg+'|'+(p['Nama Sekolah']||'');
    }
    return p[field]||'';
  }
  function _displayName(p){
    if(field==='Nama Sekolah') return p['Nama Sekolah']||'';
    if(field==='Nama Peserta') return p['Nama Peserta']||'';
    if(field==='Nama Guru')    return p['Nama Guru']||'';
    return p[field]||'';
  }

  // == Step 1: Pencapaian (placement marks) =====================
  (pc||[]).forEach(function(p){
    // Skip rekod tanpa nama entiti — elak nama sekolah terpapar dalam ranking peserta/guru
    if(field==='Nama Peserta' && !p['Nama Peserta']) return;
    if(field==='Nama Guru'    && !p['Nama Guru'])    return;
    var k=_entityKey(p); if(!k) return;
    var disp=_displayName(p);
    var sek=p['Nama Sekolah']||'';
    var per=(p['Peringkat']||'SEKOLAH').toUpperCase();
    var pts=mPts(per, p['Tempat']);
    var kat=(p['Kategori']||'INDIVIDU').toUpperCase();
    var progKey=(p['Program ID']||p['Nama Program'])||'';

    // Dedup untuk Sekolah, Guru dan Peserta:
    // P: 'tempat' SENGAJA DIBUANG dari kunci dedup — data sudah disusun ikut
    // kedudukan terbaik dahulu (_tempatRank di atas), jadi kunci hanya prog+kat+entiti
    // memastikan HANYA kedudukan TERBAIK per peserta/guru/sekolah dikira, walaupun ada
    // >1 baris pencapaian (kedudukan berlainan) untuk entiti sama akibat kesilapan input.
    // Sebelum ini 'tempat' turut dalam kunci — 2 kedudukan berbeza untuk orang sama
    // dikira DUA-DUA (markah bertindih/inflated).
    if(field==='Nama Sekolah'){
      var dk=progKey+'|'+kat+'|'+k;
      if(bSeen[dk]) return; bSeen[dk]=1;
    } else if(field==='Nama Guru'){
      // Guru: unik per prog+kat+sekolah+guru
      var dk2=progKey+'|'+kat+'|'+sek+'|'+k;
      if(bSeen[dk2]) return; bSeen[dk2]=1;
    } else if(field==='Nama Peserta'){
      // Peserta: unik per prog+kat+peserta
      var dk3=progKey+'|'+kat+'|'+k;
      if(bSeen[dk3]) return; bSeen[dk3]=1;
    }


    if(!sc[k]) sc[k]={total:0,totalPenc:0,totalPel:0,detail:[],display:disp,sekolah:sek};
    sc[k].total+=pts;
    sc[k].totalPenc+=pts;
    sc[k].detail.push({
      prog:p['Nama Program'], progId:progKey, tempat:p['Tempat'], per:per, pts:pts, kat:kat,
      sek:sek, pes:p['Nama Peserta'], guru:p['Nama Guru'], luar:!!luarSet[progKey]
    });
  });

  // == Step 2: Pelibatan (markah asas untuk SEMUA yang berdaftar — ditambah, bukan gantian, kepada markah pencapaian) ==
  var bSeenPy={}; // berkumpulan dedup for pelibatan — dikongsi antara sumber Penyertaan & Pencapaian supaya tiada kiraan berganda
  function _grantPelibatan(p, per, progId, progNm){
    if(field==='Nama Peserta' && !p['Nama Peserta']) return;
    if(field==='Nama Guru'    && !p['Nama Guru'])    return;
    var k=_entityKey(p); if(!k) return;
    var disp=_displayName(p);
    var sek=p['Nama Sekolah']||'';

    // Berkumpulan: only count sekolah once per program (ISU 7: skop dedup ditentukan PELIBATAN_DEDUP_SCOPE)
    var _katDk=(p['Kategori']||progKat[progId]||'INDIVIDU').toUpperCase();
    var dedupKey=_pelibatanDedupKey(k, progId, _katDk);
    if(bSeenPy[dedupKey]) return; bSeenPy[dedupKey]=1;

    // JADUAL 6: auto-assign PELIBATAN I bila peserta tak dapat tempat (Sekolah = 0 mata, tiada opsyen Pelibatan)
    var pts=mPts(per,'PELIBATAN I');
    // Projek 7: kredit Pelibatan bagi aktiviti luar ikut LUAR_POLISI.pelibatan (entri tetap dicipta, 0 mata, supaya penyertaan kelihatan)
    var _luar=!!luarSet[progId];
    if(_luar){ var _f=LUAR_FAKTOR_PELIBATAN[LUAR_POLISI.pelibatan]; pts=Math.round(pts*(_f==null?1:_f)); }

    if(!sc[k]) sc[k]={total:0,totalPenc:0,totalPel:0,detail:[],display:disp,sekolah:sek};
    sc[k].total+=pts;
    sc[k].totalPel+=pts;
    var _kat2=_katDk;
    sc[k].detail.push({
      prog:progNm||progId, progId:progId,
      tempat:'PELIBATAN I', per:per, pts:pts, kat:_kat2,
      sek:sek, pes:p['Nama Peserta'], guru:p['Nama Guru'], luar:_luar
    });
  }
  // Sumber utama: jadual Penyertaan (pendaftaran)
  (py||[]).forEach(function(p){
    var progId=p['Program ID']||'';
    var per=progPer[progId]||'SEKOLAH';
    _grantPelibatan(p, per, progId, p['Nama Program']);
  });
  // Sumber fallback: jadual Pencapaian — jamin peserta/guru/sekolah yang ADA tempat tapi
  // TIADA rekod pendaftaran Penyertaan (data tak lengkap) tetap dapat kredit Pelibatan.
  // bSeenPy dikongsi, jadi entiti yang sudah dikira dari Penyertaan tak dikira dua kali.
  (pc||[]).forEach(function(p){
    var progId=(p['Program ID']||p['Nama Program'])||'';
    var per=(p['Peringkat']||progPer[progId]||'SEKOLAH').toUpperCase();
    _grantPelibatan(p, per, progId, p['Nama Program']);
  });

  // Projek 7: had mata aktiviti luar bagi setiap entiti (null = tiada had). Lebihan ditolak dari pencapaian dahulu, kemudian pelibatan.
  if(LUAR_POLISI.had!=null){
    Object.keys(sc).forEach(function(k){
      var e=sc[k], ls=0; e.detail.forEach(function(d){ if(d.luar) ls+=d.pts; });
      if(ls>LUAR_POLISI.had){
        var ex=ls-LUAR_POLISI.had, dp=Math.min(ex,e.totalPenc);
        e.totalPenc-=dp; e.totalPel-=(ex-dp); e.total-=ex; e.luarDipotong=ex;
      }
    });
  }
  return sc;
}

// Semak sama ada entiti (peserta/guru/sekolah) ada sekurang-kurangnya satu markah PENCAPAIAN (tempat sebenar, bukan Pelibatan)
function _hasPenc(e){
  return (e.detail||[]).some(function(x){
    var t=String(x.tempat||'');
    return t.indexOf('PELIBATAN')<0 && t!=='PENYERTAAN';
  });
}
function _pencBadge(e){
  return _hasPenc(e)
    ?'<span style="display:inline-flex;align-items:center;gap:2px;font-size:.52rem;font-weight:800;color:#1e8449;background:rgba(39,174,96,.14);border-radius:20px;padding:.05rem .34rem;margin-left:.32rem;white-space:nowrap;">🏆 PENCAPAIAN</span>'
    :'';
}
// Kumpulan type ranking berasaskan entiti sekolah — subtajuk nama sekolah tak perlu diulang untuk ini
function _isSekType(t){ return t==='sek'||t==='sekPenc'||t==='sekPel'; }
function buildRank(elId,scores,limit,moreBtnId,type){
  var el=document.getElementById(elId);
  type=type||elId.replace('rk-','');
  var sorted=Object.entries(scores).sort(function(a,b){return b[1].total-a[1].total;});
  if(!sorted.length){
    el.innerHTML='<div class="empty"><div class="ei">—</div><h3>Tiada pencapaian</h3></div>';
    var bn=document.getElementById(moreBtnId);if(bn)bn.style.display='none'; return;
  }
  var wrap=document.createElement('div'); wrap.className='rl';
  sorted.slice(0,limit).forEach(function(e,i){
    var c=i===0?'r1':i===1?'r2':i===2?'r3':'rX';
    var div=document.createElement('div'); div.className='rit';
    var disp=e[1].display||e[0];
    var sek=e[1].sekolah||'';
    var subHtml=(!_isSekType(type)&&sek)?'<div class="rsub">· '+sek+'</div>':'';
    div.innerHTML='<div class="rbg '+c+'">'+(i+1)+'</div><div class="rn">'+disp+_pencBadge(e[1])+subHtml+'</div><div class="rs">'+e[1].total+' PT</div>';
    (function(nm,tp){div.addEventListener('click',function(){showDet(nm,tp);});})(e[0],type);
    wrap.appendChild(div);
  });
  el.innerHTML=''; el.appendChild(wrap);
  var btn=document.getElementById(moreBtnId);
  if(btn){
    btn.style.display=sorted.length>limit?'block':'none';
    if(sorted.length>limit) btn.textContent='LIHAT SELANJUTNYA ('+sorted.length+') ▼';
  }
}

function moreRank(type){
  // Normalise long form → short key used in _rk
  var _typeMap={sekolah:'sek',peserta:'pes',guru:'guru',sek:'sek',pes:'pes',pesAda:'pesAda',pesTiada:'pesTiada',sekPenc:'sekPenc',sekPel:'sekPel',guruAda:'guruAda',guruTiada:'guruTiada'};
  type=_typeMap[type]||type;
  var sc=_rk[type]||{};
  var sorted=Object.entries(sc).sort(function(a,b){return b[1].total-a[1].total;});
  var titles={sek:'🏆 RANKING SEKOLAH — KESELURUHAN',pes:'🧑‍🎓 RANKING PESERTA',guru:'👨‍🏫 RANKING GURU',pesAda:'🏆 RANKING PESERTA — ADA PENCAPAIAN',pesTiada:'📋 RANKING PESERTA — TIADA PENCAPAIAN',sekPenc:'🎖️ RANKING SEKOLAH — PENCAPAIAN SAHAJA',sekPel:'📋 RANKING SEKOLAH — PELIBATAN SAHAJA',guruAda:'🏆 RANKING GURU — ADA PENCAPAIAN',guruTiada:'📋 RANKING GURU — TIADA PENCAPAIAN'};
  document.getElementById('more-tit').textContent=titles[type]||'RANKING';
  if(!sorted.length){
    document.getElementById('more-body').innerHTML='<div class="empty"><div class="ei">—</div><h3>Tiada data</h3></div>';
    openMo('mo-more'); return;
  }
  var el=document.createElement('div'); el.className='rl';
  sorted.forEach(function(e,i){
    var c=i===0?'r1':i===1?'r2':i===2?'r3':'rX';
    var div=document.createElement('div'); div.className='rit';
    var disp=e[1].display||e[0];
    var sek=e[1].sekolah||'';
    var _tp=type||'sek';
    var subHtml=(!_isSekType(_tp)&&sek)?'<div class="rsub">· '+sek+'</div>':'';
    div.innerHTML='<div class="rbg '+c+'">'+(i+1)+'</div><div class="rn">'+disp+_pencBadge(e[1])+subHtml+'</div><div class="rs">'+e[1].total+' PT</div>';
    (function(nm,tp){div.addEventListener('click',function(){showDet(nm,tp);});})(e[0],type);
    el.appendChild(div);
  });
  // Store data for search filtering
  _moreData=sorted; _moreData._type=type;
  // Clear search input
  var si=document.getElementById('more-srch'); if(si){si.value='';}
  var cl=document.getElementById('more-srch-clear'); if(cl){cl.style.display='none';}
  var cnt=document.getElementById('more-srch-count'); if(cnt){cnt.textContent='';}
  document.getElementById('more-body').innerHTML=''; document.getElementById('more-body').appendChild(el);
  openMo('mo-more');
}
function showDet(nm,type){
  var sc=_rk[type]||{};var d=sc[nm];if(!d){toast('Tiada data','in');return;}
  document.getElementById('det-tit').textContent='📊 '+(d.display||nm);
  var _katColor={'INDIVIDU':'#1a6fa6','INDIVIDU LELAKI':'#1a6fa6','INDIVIDU PEREMPUAN':'#b5006e','BERKUMPULAN':'#1a7a4a','BERKUMPULAN LELAKI':'#1a7a4a','BERKUMPULAN PEREMPUAN':'#6d28a0','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  // Kumpulkan baris Berkumpulan/Keseluruhan yang sama (prog+kat+tempat) supaya
  // peserta-peserta dipapar bersama dalam satu blok
  var _grouped=[], _gSeen={};
  d.detail.forEach(function(x){
    var isBK=x.kat==='BERKUMPULAN LELAKI'||x.kat==='BERKUMPULAN PEREMPUAN'||x.kat==='BERKUMPULAN'||x.kat==='KESELURUHAN';
    if(isBK){
      var gk=x.prog+'|'+x.kat+'|'+x.tempat;
      if(!_gSeen[gk]){_gSeen[gk]=_grouped.length;_grouped.push(Object.assign({},x,{pesList:x.pes?[x.pes]:[]}));}
      else{if(x.pes&&_grouped[_gSeen[gk]].pesList.indexOf(x.pes)<0)_grouped[_gSeen[gk]].pesList.push(x.pes);}
    } else {
      _grouped.push(Object.assign({},x,{pesList:x.pes?[x.pes]:[]}));
    }
  });
  // Gabungkan baris Pelibatan ke dalam baris Pencapaian program yang sama (satu baris utama + subskrip Pelibatan)
  // Kunci padanan guna progId (bukan nama program) — elak pertembungan bila 2 program berbeza kebetulan sama nama.
  // Markah Pelibatan sekolah cuma SATU setiap program (tak kira berapa kategori), jadi ia dilekatkan pada
  // baris Pencapaian PERTAMA sahaja bagi progId itu; baris Pencapaian lain (kategori/tempat lain, progId sama)
  // kekal tanpa subskrip — sebab markah Pelibatan program itu sudah diwakili sekali di baris pertama.
  var _pelMap={};
  _grouped.forEach(function(x){
    if(String(x.tempat||'').indexOf('PELIBATAN')>-1) _pelMap[x.progId||(x.prog+'|'+x.per)]=x;
  });
  var _final=[];
  _grouped.forEach(function(x){
    if(String(x.tempat||'').indexOf('PELIBATAN')>-1) return; // dilayan sebagai subskrip, bukan baris sendiri
    var pk=x.progId||(x.prog+'|'+x.per);
    var pel=_pelMap[pk];
    if(pel){ x=Object.assign({},x,{pelibatan:pel}); delete _pelMap[pk]; }
    _final.push(x);
  });
  // Pelibatan yang tiada padanan pencapaian (tiada tempat langsung) kekal sebagai baris sendiri
  Object.keys(_pelMap).forEach(function(k){ _final.push(_pelMap[k]); });
  document.getElementById('det-body').innerHTML=
    '<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:800;color:var(--red);margin-bottom:.62rem;">JUMLAH: '+d.total+' MATA</div>'
    +_final.map(function(x){
      var katLabel=x.kat||'INDIVIDU';
      var katCol=_katColor[katLabel]||'#555';
      var isPenyertaan=x.tempat==='PENYERTAAN'||String(x.tempat||'').indexOf('PELIBATAN')>-1;
      var isBK=katLabel==='BERKUMPULAN LELAKI'||katLabel==='BERKUMPULAN PEREMPUAN'||katLabel==='BERKUMPULAN'||katLabel==='KESELURUHAN';
      // Badge kategori — papar bawah nama program, tidak papar untuk PENYERTAAN
      var katBadge=(!isPenyertaan)
        ?'<span style="display:inline-block;font-size:.53rem;font-weight:800;color:#fff;background:'+katCol+';border-radius:20px;padding:.07rem .36rem;margin-top:.22rem;">'+katLabel+'</span>'
        :'';
      var pesHtml='';
      if(isBK&&x.pesList&&x.pesList.length){
        pesHtml='<div style="display:flex;flex-wrap:wrap;gap:.2rem;margin-top:.25rem;">'
          +x.pesList.map(function(nm){return '<span style="font-size:.6rem;background:rgba(0,0,0,.07);border-radius:20px;padding:.05rem .3rem;">👤 '+nm+'</span>';}).join('')
          +'</div>';
      }
      // Subskrip kecil markah Pelibatan di bawah dpt — hanya bila program ada tempat pencapaian DAN markah pelibatan berasingan
      var pelSub=x.pelibatan
        ?'<div style="font-size:.56rem;color:var(--g5);font-weight:700;margin-top:.12rem;">+'+x.pelibatan.pts+' '+x.pelibatan.tempat+'</div>'
        :'';
      return '<div class="di"><div class="dk">'+x.tempat+'</div>'
        +'<div class="db"><div class="dpg">'+x.prog+'</div>'
        +(katBadge?'<div>'+katBadge+'</div>':'')
        +'<div class="dsb">'+x.per+(x.sek?' &bull; '+x.sek:'')+((!isBK&&x.pes)?' &bull; '+x.pes:'')+(x.guru?' &bull; '+x.guru:'')+'</div>'
        +pesHtml
        +'</div>'
        +'<div><div class="dpt">+'+x.pts+'</div>'+pelSub+'</div></div>';
    }).join('');
  openMo('mo-det');
}

function buildPenc(pc,limit){
  var el=document.getElementById('dash-penc');
  if(!pc.length){
    el.innerHTML='<div class="empty"><div class="ei">🏅</div><h3>Tiada pencapaian</h3></div>';
    var bn=document.getElementById('btn-mp');if(bn)bn.style.display='none'; return;
  }
  var bp={};
  pc.forEach(function(p){var k=p['Nama Program']||'';if(!k)return;if(!bp[k])bp[k]=[];bp[k].push(p);});
  var keys=Object.keys(bp);
  _morepBp=bp; _morepKeys=keys;
  el.innerHTML=''; el.appendChild(renderPencNameList(bp,keys.slice(0,limit)));
  var btnEl=document.getElementById('btn-mp');
  if(btnEl){
    btnEl.style.display=keys.length>limit?'block':'none';
    if(keys.length>limit) btnEl.textContent='LIHAT SELANJUTNYA ('+keys.length+') ▼';
  }
}

function renderPencNameList(bp,keys){
  var wrap=document.createElement('div'); wrap.className='pnm-list';
  keys.forEach(function(prog){
    var items=bp[prog]||[];
    var row=document.createElement('div'); row.className='pnm-row';
    row.innerHTML='<span class="pnm-nm">🏅 '+prog+'</span>'
      +'<span class="pnm-cnt">'+items.length+' pencapaian ›</span>';
    (function(nm,en){
      row.addEventListener('click',function(){showPencDet(nm,en);});
    })(prog,items);
    wrap.appendChild(row);
  });
  return wrap;
}

function showPencDet(progNm,items){
  document.getElementById('podium-tit').textContent='🏅 '+progNm;
  document.getElementById('podium-body').innerHTML='';
  document.getElementById('podium-body').appendChild(buildPodium(items));
  openMo('mo-podium');
}

function buildPodium(items){
  var wrap=document.createElement('div'); wrap.className='podium-wrap';
  // Group by peringkat
  var byPer={};
  items.forEach(function(e){
    var p=(e['Peringkat']||'SEKOLAH').toUpperCase();
    if(!byPer[p])byPer[p]=[];byPer[p].push(e);
  });
  var perList=PER_ORDER.filter(function(p){return byPer[p];});
  Object.keys(byPer).forEach(function(p){if(perList.indexOf(p)<0)perList.push(p);});

  perList.forEach(function(per){
    var en=byPer[per];
    // Collect entries by tempat key (dedup sekolah per tempat)
    var byT={};
    en.forEach(function(e){
      var tk=(e['Tempat']||'').toUpperCase();
      if(!byT[tk])byT[tk]=[];
      var alreadyHasSek=byT[tk].some(function(x){return (x['Nama Sekolah']||'')===(e['Nama Sekolah']||'');});
      if(!alreadyHasSek)byT[tk].push(e);
    });

    // Peringkat pill header
    var perHdr=document.createElement('div'); perHdr.className='podium-per-hdr';
    perHdr.textContent=per; wrap.appendChild(perHdr);

    // Define podium slots — visual order: 2nd | 1st | 3rd
    var SLOTS=[
      {tk:'TEMPAT KEDUA',  cls:'podium-2', medal:'🥈', h:68},
      {tk:'TEMPAT PERTAMA',cls:'podium-1', medal:'🥇', h:95},
      {tk:'TEMPAT KETIGA', cls:'podium-3', medal:'🥉', h:50}
    ];
    var hasPodiumData=SLOTS.some(function(s){return byT[s.tk]&&byT[s.tk].length;});

    if(hasPodiumData){
      var stage=document.createElement('div'); stage.className='podium-stage';
      SLOTS.forEach(function(slot){
        var e2=(byT[slot.tk]||[])[0];
        var col=document.createElement('div'); col.className='podium-col';
        if(e2){col.style.cursor='pointer';col.setAttribute('role','button');col.setAttribute('tabindex','0');}
        var blk=document.createElement('div'); blk.className='podium-block '+slot.cls;
        blk.style.height=slot.h+'px';
        blk.innerHTML='<span class="podium-medal">'+slot.medal+'</span>';
        col.appendChild(blk);
        var base=document.createElement('div'); base.className='podium-base';
        if(e2){
          var detHtml=(e2['Nama Peserta']?'<div class="podium-sub" style="margin-top:.15rem;">'+e2['Nama Peserta']+'</div>':'')
            +(e2['Nama Guru']?'<div class="podium-sub" style="font-size:.55rem;color:var(--g5);">'+e2['Nama Guru']+'</div>':'');
          base.innerHTML='<div class="podium-pos">'+slot.tk.replace('TEMPAT ','')+'</div>'
            +'<div class="podium-nm">'+(e2['Nama Sekolah']||'—')+'</div>'
            +'<div class="podium-det" style="overflow:hidden;max-height:0;opacity:0;transition:max-height .3s ease,opacity .25s;">'+detHtml+'</div>'
            +'<div class="podium-pts">+'+mPts(per,slot.tk)+' mata</div>';
          (function(b,c){
            var toggle=function(){
              var d=b.querySelector('.podium-det');
              var open=d.style.maxHeight&&d.style.maxHeight!=='0px';
              d.style.maxHeight=open?'0':'150px';
              d.style.opacity=open?'0':'1';
            };
            c.addEventListener('click',toggle);
            c.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggle();}});
          })(base,col);
        }else{
          base.innerHTML='<div class="podium-pos">'+slot.tk.replace('TEMPAT ','')+'</div>'
            +'<div class="podium-nm" style="color:var(--g4);">—</div>';
        }
        col.appendChild(base); stage.appendChild(col);
      });
      wrap.appendChild(stage);
    }

    // Rest: KEEMPAT, KELIMA, and anything else not on the podium
    var podiumKeys=['TEMPAT PERTAMA','TEMPAT KEDUA','TEMPAT KETIGA'];
    var restKeys=['TEMPAT KEEMPAT','TEMPAT KELIMA'];
    Object.keys(byT).forEach(function(tk){if(podiumKeys.indexOf(tk)<0&&restKeys.indexOf(tk)<0)restKeys.push(tk);});
    var hasRest=restKeys.some(function(tk){return byT[tk]&&byT[tk].length;});
    if(hasRest){
      var restDiv=document.createElement('div'); restDiv.className='podium-rest';
      restKeys.forEach(function(tk){
        (byT[tk]||[]).forEach(function(e2){
          var row=document.createElement('div'); row.className='podium-rest-row';
          row.style.cursor='pointer'; row.setAttribute('role','button'); row.setAttribute('tabindex','0');
          row.style.webkitTapHighlightColor='transparent';
          var pesertaHtml=e2['Nama Peserta']?'<div class="podium-rest-sub" style="display:none;">'+e2['Nama Peserta']+'</div>':'';
          var guruHtml=e2['Nama Guru']?'<div class="podium-rest-sub" style="display:none;color:var(--g5);">'+e2['Nama Guru']+'</div>':'';
          row.innerHTML='<span class="podium-rest-pos">'+tk.replace('TEMPAT ','')+'</span>'
            +'<div style="flex:1;"><div class="podium-rest-nm">'+(e2['Nama Sekolah']||'—')+'</div>'
            +pesertaHtml+guruHtml
            +'</div>'
            +'<span class="podium-rest-pts">+'+mPts(per,tk)+'</span>';
          var toggleRow=function(){
            var subs=row.querySelectorAll('.podium-rest-sub');
            var open=subs.length&&subs[0].style.display!=='none';
            subs.forEach(function(el){el.style.display=open?'none':'block';});
          };
          row.addEventListener('click',toggleRow);
          row.addEventListener('keydown',function(ev){if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggleRow();}});
          restDiv.appendChild(row);
        });
      });
      wrap.appendChild(restDiv);
    }
    // Spacer
    var sp=document.createElement('div'); sp.style.marginBottom='.85rem'; wrap.appendChild(sp);
  });

  if(!perList.length){
    wrap.innerHTML='<div class="empty"><div class="ei">🏅</div><h3>Tiada pencapaian direkod</h3></div>';
  }
  return wrap;
}
function morePenc(){
  var bp={};_aPnc.forEach(function(p){var k=p['Nama Program']||'';if(!k)return;if(!bp[k])bp[k]=[];bp[k].push(p);});
  var keys=Object.keys(bp);
  // Store for search
  _morepBp=bp; _morepKeys=keys;
  // Clear search
  var si=document.getElementById('morep-srch'); if(si){si.value='';}
  var cl=document.getElementById('morep-srch-clear'); if(cl){cl.style.display='none';}
  var cnt=document.getElementById('morep-srch-count'); if(cnt){cnt.textContent='';}
  var body=document.getElementById('morep-body');
  if(!keys.length){
    body.innerHTML='<div class="empty"><div class="ei">🏅</div><h3>Tiada pencapaian</h3></div>';
  }else{
    body.innerHTML=''; body.appendChild(renderPencNameList(bp,keys));
  }
  openMo('mo-morep');
}

function uniByProg(py){
  var c={},seen={};
  py.forEach(function(p){var k=(p['Program ID']||'')+'|'+(p['Nama Sekolah']||'');if(seen[k])return;seen[k]=1;var pr=p['Nama Program']||'LAIN-LAIN';c[pr]=(c[pr]||0)+1;});
  return c;
}
function uniSek(py){
  var c={},seen={};
  py.forEach(function(p){var k=(p['Program ID']||'')+'|'+(p['Nama Sekolah']||'');if(seen[k])return;seen[k]=1;var sk=p['Nama Sekolah']||'LAIN-LAIN';c[sk]=(c[sk]||0)+1;});
  return c;
}
var _barData={};
document.addEventListener('click',function(e){
  var t=e.target.closest?e.target.closest('[data-bar-open]'):null;
  if(t){openBarList(t.dataset.barOpen);}
});
var _barListData=[];
function openBarList(id){
  var d=_barData[id]; if(!d)return;
  _barListData=d.all;
  var titles={'ch-prog':'📊 PENYERTAAN MENGIKUT PROGRAM','ch-sek':'🏫 PENYERTAAN MENGIKUT SEKOLAH'};
  document.getElementById('bar-list-tit').textContent=titles[id]||'SENARAI PENUH';
  var si=document.getElementById('bar-list-srch'); if(si){si.value='';}
  var cl=document.getElementById('bar-list-srch-clear'); if(cl){cl.style.display='none';}
  var cnt=document.getElementById('bar-list-srch-count'); if(cnt){cnt.textContent='';}
  renderBarList(_barListData);
  openMo('mo-bar-list');
}
function renderBarList(data){
  var el=document.getElementById('bar-list-body'); if(!el)return;
  var mx=data.length?data[0][1]:1;
  if(!data.length){el.innerHTML='<div class="empty"><div class="ei">📊</div><h3>Tiada data</h3></div>';return;}
  el.innerHTML='<div class="bcc">'+data.map(function(e,i){
    return '<div class="br"><div class="bl" title="'+e[0]+'"><span style="font-size:.6rem;color:var(--g5);margin-right:.3rem;">'+(i+1)+'.</span>'+e[0].slice(0,22)+(e[0].length>22?'…':'')+'</div>'
      +'<div class="bt"><div class="bf" style="width:'+(e[1]/mx*100).toFixed(1)+'%;background:var(--red);"></div></div>'
      +'<div class="bv">'+e[1]+'</div></div>';
  }).join('')+'</div>';
}
function filterBarList(q){
  var cl=document.getElementById('bar-list-srch-clear');
  var cnt=document.getElementById('bar-list-srch-count');
  if(cl)cl.style.display=q?'block':'none';
  var lq=q.toLowerCase().trim();
  var filtered=lq?_barListData.filter(function(e){return e[0].toLowerCase().indexOf(lq)>=0;}):_barListData;
  if(cnt)cnt.textContent=lq?'('+filtered.length+' daripada '+_barListData.length+')':'';
  renderBarList(filtered);
}
function clearBarListSrch(){
  var si=document.getElementById('bar-list-srch'); if(si){si.value='';}
  filterBarList('');
}
function buildBar(id,counts,color){
  var el=document.getElementById(id);
  var all=Object.entries(counts).sort(function(a,b){return b[1]-a[1];});
  _barData[id]={all:all,color:color};
  renderBar(id,5);
}
function renderBar(id,limit){
  var el=document.getElementById(id); if(!el)return;
  var d=_barData[id]; if(!d)return;
  var all=d.all, color=d.color;
  if(!all.length){el.innerHTML='<div class="empty"><div class="ei">📊</div><h3>Tiada data</h3></div>';return;}
  var en=limit?all.slice(0,limit):all;
  var mx=all[0][1]||1;
  var html='<div class="bcc">'+en.map(function(e){
    var lbl=e[0]||'—';
    return '<div class="br"><div class="bl" title="'+lbl+'">'+lbl+'</div>'
      +'<div class="bt"><div class="bf" style="width:'+(e[1]/mx*100).toFixed(1)+'%;background:'+color+';"></div></div>'
      +'<div class="bv">'+e[1]+'</div></div>';
  }).join('')+'</div>';
  var btnId='btn-bar-'+id;
  if(all.length>5&&(!limit||limit<all.length)){
    html+='<button class="btn bs bsm" style="width:100%;margin-top:.45rem;" id="'+btnId+'" data-bar-open="'+id+'">LIHAT SELANJUTNYA ('+all.length+') ▼</button>';
  }
  el.innerHTML=html;
}
function filtTable(){
  var f=document.getElementById('filt-pg').value;
  renderTable(f?_aP.filter(function(p){return p['Nama Program']===f;}):_aP);
}
// Virtualized table — renders max 150 rows to keep DOM light
var _tbData=[], _tbPage=0, _tbPageSize=100;
function renderTable(data){_tbData=data;_tbPage=0;_renderTablePage();}
function tableNav(dir){
  var maxP=Math.ceil(_tbData.length/_tbPageSize)-1;
  _tbPage=Math.max(0,Math.min(_tbPage+dir,maxP));
  _renderTablePage();
}
function _renderTablePage(){
  var tb=document.getElementById('dash-tb');
  var nav=document.getElementById('dash-tb-nav');
  var info=document.getElementById('dash-tb-info');
  var prev=document.getElementById('dash-tb-prev');
  var next=document.getElementById('dash-tb-next');
  if(!_tbData.length){
    tb.innerHTML='<tr><td colspan="6"><div class="empty"><div class="ei">📭</div><h3>Tiada data</h3></div></td></tr>';
    if(nav)nav.style.display='none'; return;
  }
  var start=_tbPage*_tbPageSize, end=Math.min(start+_tbPageSize,_tbData.length);
  var frag=document.createDocumentFragment();
  for(var i=start;i<end;i++){
    var p=_tbData[i],tr=document.createElement('tr');
    tr.innerHTML='<td><strong>'+esc(p['Nama Program']||'—')+'</strong></td><td>'+esc(p['Nama Sekolah']||'—')+'</td><td>'+esc(p['Nama Guru']||'—')+'</td><td>'+esc(p['Nama Peserta']||'—')+'</td><td>'+esc(p['Jantina Peserta']||'—')+'</td><td>'+fd(p['Tarikh Daftar'])+'</td>';
    frag.appendChild(tr);
  }
  tb.innerHTML='';tb.appendChild(frag);
  var totalPages=Math.ceil(_tbData.length/_tbPageSize);
  if(totalPages>1){
    if(nav){nav.classList.remove('tb-nav-hidden');nav.classList.add('tb-nav-show');}
    if(info)info.textContent='Halaman '+(_tbPage+1)+' / '+totalPages+' &nbsp;('+( start+1)+'–'+end+' daripada '+_tbData.length+' rekod)';
    if(prev)prev.disabled=(_tbPage===0);
    if(next)next.disabled=(_tbPage>=totalPages-1);
  }else{
    if(nav){nav.classList.add('tb-nav-hidden');nav.classList.remove('tb-nav-show');}
  }
}

