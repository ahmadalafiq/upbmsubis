// == DASHBOARD BIDANG FILTER ==================================
var _dashBidang = 'semua'; // 'semua' | 'sukan' | 'koku'
var BIDANG_SUKAN = ['SUKAN'];
var BIDANG_KOKU  = ['SENI','BAHASA','STEM','PBB'];

function setDashBidang(mode){
  _dashBidang = mode;
  // Update button styles
  ['semua','sukan','koku'].forEach(function(m){
    var btn = document.getElementById('dbf-'+m);
    if(!btn) return;
    btn.className = (m===mode) ? 'btn bs bsm' : 'btn bw bsm';
    if(m===mode) btn.style.fontWeight='800'; else btn.style.fontWeight='';
  });
  rebuildDash();
}

function filterByBidang(arr, field){
  // arr = programs array; field = 'Bidang'
  if(_dashBidang==='semua') return arr;
  var bidangSel = document.getElementById('df-bidang');
  var bVal = bidangSel ? bidangSel.value.toUpperCase() : '';
  if(_dashBidang==='sukan') return arr.filter(function(p){return (p[field]||'').toUpperCase()==='SUKAN';});
  if(_dashBidang==='koku')  return arr.filter(function(p){return BIDANG_KOKU_LIST.indexOf((p[field]||'').toUpperCase())>=0;});
  // specific: filter by exact bidang value from select
  if(bVal) return arr.filter(function(p){return (p[field]||'').toUpperCase()===bVal;});
  return arr;
}

function filterPnyByBidang(pny, pg){
  if(_dashBidang==='semua') return pny;
  var bidangSel = document.getElementById('df-bidang');
  var bVal = bidangSel ? bidangSel.value.toUpperCase() : '';
  var allowed;
  if(_dashBidang==='sukan') allowed = BIDANG_SUKAN;
  else if(_dashBidang==='koku') allowed = BIDANG_KOKU_LIST;
  else if(bVal) allowed = [bVal];
  else return pny;
  // Build set of program IDs that match bidang
  var okIds = {};
  (pg||[]).forEach(function(p){
    if(allowed.indexOf((p['Bidang']||'').toUpperCase()) >= 0) okIds[p['ID']]=1;
  });
  return pny.filter(function(r){ return okIds[r['Program ID']]; });
}

function filterPncByBidang(pnc, pg){
  if(_dashBidang==='semua') return pnc;
  var bidangSel = document.getElementById('df-bidang');
  var bVal = bidangSel ? bidangSel.value.toUpperCase() : '';
  var allowed;
  if(_dashBidang==='sukan') allowed = BIDANG_SUKAN;
  else if(_dashBidang==='koku') allowed = BIDANG_KOKU_LIST;
  else if(bVal) allowed = [bVal];
  else return pnc;
  var okNms = {};
  (pg||[]).forEach(function(p){
    if(allowed.indexOf((p['Bidang']||'').toUpperCase()) >= 0) okNms[p['Nama Program']]=1;
  });
  return pnc.filter(function(r){ return okNms[r['Nama Program']]; });
}

function rebuildDash(){
  // Apply all active filters
  var pg  = _dfFilterProgs(_aPg);
  var py  = _dfFilterPny(_aP, _aPg);
  var pc  = _dfFilterPnc(_aPnc, _aPg);

  // Stats
  var uSekProg={}, uPes={};
  py.forEach(function(p){
    uSekProg[(p['Program ID']||'')+'|'+(p['Nama Sekolah']||'')]=1;
    var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&p['Nama Peserta'])uPes[pk]=1;
  });
  animateCounter(document.getElementById('st-pg'), pg.length);
  animateCounter(document.getElementById('st-ak'), pg.filter(function(p){return p['Status']==='AKTIF';}).length);
  animateCounter(document.getElementById('st-py'), Object.keys(uSekProg).length);
  animateCounter(document.getElementById('st-ps'), Object.keys(uPes).length);

  // Rankings
  var rk = {};
  rk.sek  = getSkor(pc,'Nama Sekolah', py, pg);
  rk.pes  = getSkor(pc,'Nama Peserta',  py, pg);
  rk.guru = getSkor(pc,'Nama Guru',     py, pg);
  // Pecahkan ranking peserta ikut status pencapaian (rujuk objek skor yang sama, tiada duplikasi data)
  rk.pesAda={}; rk.pesTiada={};
  Object.keys(rk.pes).forEach(function(k){
    if(_hasPenc(rk.pes[k])) rk.pesAda[k]=rk.pes[k]; else rk.pesTiada[k]=rk.pes[k];
  });
  // Pecahkan ranking guru ikut status pencapaian — corak sama seperti pesAda/pesTiada
  rk.guruAda={}; rk.guruTiada={};
  Object.keys(rk.guru).forEach(function(k){
    if(_hasPenc(rk.guru[k])) rk.guruAda[k]=rk.guru[k]; else rk.guruTiada[k]=rk.guru[k];
  });
  // ISU 3 (dibetulkan): Ranking Sekolah — Pencapaian sahaja / Pelibatan sahaja kini EKSKLUSIF,
  // konsisten dgn logik pesAda/pesTiada di atas — sekolah yang ADA pencapaian (totalPenc>0) tidak lagi
  // turut terpapar dalam ranking "Pelibatan Sahaja" walaupun ia juga ada markah pelibatan.
  rk.sekPenc={}; rk.sekPel={};
  Object.keys(rk.sek).forEach(function(k){
    var totPenc = rk.sek[k].totalPenc||0;
    var totPel  = rk.sek[k].totalPel||0;
    if(totPenc>0){
      rk.sekPenc[k]=Object.assign({}, rk.sek[k], {total: totPenc});
    } else if(totPel>0){
      rk.sekPel[k]=Object.assign({}, rk.sek[k], {total: totPel});
    }
  });
  _rk = rk;
  // Simpan set penuh (tanpa tapisan) untuk semua ranking — toggle SEMUA/SR/SM bertindak di atas set ini
  _rkFull = {sek: rk.sek, pes: rk.pes, guru: rk.guru, pesAda: rk.pesAda, pesTiada: rk.pesTiada, sekPenc: rk.sekPenc, sekPel: rk.sekPel, guruAda: rk.guruAda, guruTiada: rk.guruTiada};
  _renderRkType('sek');
  _renderRkType('pes');
  _renderRkType('guru');
  _renderRkType('pesAda');
  _renderRkType('pesTiada');
  _renderRkType('sekPenc');
  _renderRkType('sekPel');
  _renderRkType('guruAda');
  _renderRkType('guruTiada');
  buildPanelLuar();
  buildPenc(pc, 3);

  // Original charts
  buildBar('ch-prog', uniByProg(py), '#c0392b');
  buildBar('ch-sek',  uniSek(py),    '#922b21');

  // New charts
  buildChartBidang(py, pg);
  buildChartDonut(pg);
  buildChartTrend(py, pg);
  buildChartJantina(py, pg);

  // Program table with status badge
  buildProgTable(pg, py);

  // Dropdown filter for data table
  var sel = document.getElementById('filt-pg');
  if(sel){
    sel.innerHTML = '<option value="">SEMUA PROGRAM</option>';
    pg.forEach(function(p){
      var o = document.createElement('option');
      o.value = p['Nama Program']; o.textContent = p['Nama Program'];
      sel.appendChild(o);
    });
  }
  renderTable(py);

  // Update sekolah filter dropdown with current data
  _updateSekolahFilter(py);

  // Widget sekolah belum ada rekod
  buildSekTiadaRekod(py, pg);
}

// == WIDGET: SEKOLAH BELUM ADA REKOD =================================
function buildSekTiadaRekod(py, pg){
  var wrap = document.getElementById('sek-tiada-wrap');
  var badge = document.getElementById('sek-tiada-badge');
  if(!wrap) return;

  // Kumpul sekolah yang ADA rekod — dari penyertaan (peserta) atau sebagai pengelola program
  var adaRekod = {};
  // 1. Sekolah yang ada rekod penyertaan (peserta/guru)
  (py||[]).forEach(function(r){
    var kod = String(r['Kod Sekolah']||'').toUpperCase().trim();
    if(kod) adaRekod[kod] = true;
  });
  // 2. Sekolah yang menjadi pengelola program
  (pg||[]).forEach(function(p){
    var kod = String(p['Kod Pengelola']||'').toUpperCase().trim();
    if(kod) adaRekod[kod] = true;
  });

  // Senarai semua sekolah statik yang TIADA rekod
  var tiada = _SEKOLAH_STATIK.filter(function(s){
    return !adaRekod[s.kod.toUpperCase()];
  });

  // Kemaskini badge
  if(badge){
    if(tiada.length){ badge.textContent=tiada.length; badge.style.display='inline'; }
    else { badge.style.display='none'; }
  }

  if(!tiada.length){
    wrap.innerHTML='<div style="text-align:center;padding:1.2rem;font-size:.78rem;color:var(--g5);">✅ Semua sekolah telah mempunyai rekod dalam sistem.</div>';
    return;
  }

  // Kumpulkan mengikut jenis sekolah
  var grpSK=[], grpSJK=[], grpSMK=[];
  tiada.forEach(function(s){
    var k=s.kod.charAt(1);
    if(k==='E') grpSMK.push(s);
    else if(s.nama.indexOf('SJK')===0) grpSJK.push(s);
    else grpSK.push(s);
  });

  function mkGrpHtml(label, icon, list, color){
    if(!list.length) return '';
    return '<div style="margin-bottom:.75rem;">'
      +'<div style="font-size:.63rem;font-weight:800;color:'+color+';text-transform:uppercase;letter-spacing:.5px;margin-bottom:.4rem;display:flex;align-items:center;gap:.35rem;">'+icon+' '+label+' <span style="background:'+color+';color:#fff;border-radius:20px;padding:.05rem .4rem;font-size:.55rem;">'+list.length+'</span></div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:.35rem;">'
      +list.map(function(s){
        return '<div style="background:#fff;border:1.5px solid var(--g2);border-radius:8px;padding:.45rem .65rem;display:flex;flex-direction:column;gap:.1rem;">'
          +'<div style="font-size:.72rem;font-weight:700;color:var(--g8);">'+s.nama+'</div>'
          +'<div style="font-size:.6rem;color:var(--g5);font-weight:600;">'+s.kod+'</div>'
          +'</div>';
      }).join('')
      +'</div></div>';
  }

  var totalLabel = '<div style="font-size:.72rem;color:var(--g6);margin-bottom:.75rem;padding:.5rem .7rem;background:var(--rp);border-radius:8px;border:1px solid rgba(192,57,43,.15);">'
    +'⚠️ <strong>'+tiada.length+' sekolah</strong> daripada '+_SEKOLAH_STATIK.length+' belum mempunyai sebarang rekod penyertaan atau program dalam sistem.'
    +'</div>';

  wrap.innerHTML = totalLabel
    + mkGrpHtml('Sekolah Kebangsaan', '🏫', grpSK, '#2980b9')
    + mkGrpHtml('Sekolah Jenis Kebangsaan (Cina)', '🏫', grpSJK, '#8e44ad')
    + mkGrpHtml('Sekolah Menengah', '🏫', grpSMK, '#27ae60');
}

