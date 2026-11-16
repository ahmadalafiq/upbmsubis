// == PAGE 1 — PROGRAM =================================
function getKatChecked(wrapId){
  return Array.from(document.querySelectorAll('#'+wrapId+' input[type=checkbox]:checked')).map(function(c){return c.value;});
}
// Kategori TERBUKA INDIVIDU / TERBUKA BERKUMPULAN adalah eksklusif antara satu sama lain dan dengan kategori biasa
function handleKatCheck(cb, wrapId){
  var isTrb=cb.value==='TERBUKA INDIVIDU'||cb.value==='TERBUKA BERKUMPULAN';
  if(isTrb && cb.checked){
    // Mana-mana TERBUKA dipilih — uncheck semua kategori bukan-TERBUKA
    document.querySelectorAll('#'+wrapId+' input[type=checkbox]').forEach(function(c){
      if(c.value!=='TERBUKA INDIVIDU'&&c.value!=='TERBUKA BERKUMPULAN') c.checked=false;
    });
  } else if(!isTrb && cb.checked){
    document.querySelectorAll('#'+wrapId+' input[value="TERBUKA INDIVIDU"],#'+wrapId+' input[value="TERBUKA BERKUMPULAN"]').forEach(function(c){c.checked=false;});
  }
  if(wrapId==='e-kat-wrap'&&typeof _curPny!=='undefined'&&_curPny){
    var _nk=Array.from(document.querySelectorAll('#e-kat-wrap input[type=checkbox]:checked')).map(function(c){return c.value;});
    if(_nk.length)renderPcForm(_curPny,_curPnc||[],_nk.join(','));
  }
}

async function daftarProgram(){
  if(_sesi && _sesi.role === 'guru'){
    toast('Guru tidak dibenarkan mendaftar program.','er'); return;
  }
  var n=gv('p-nama'),pen=gv('p-pengelola'),kod=gv('p-kod'),bid=gv('p-bidang'),
      per=gv('p-per'),tar=gv('p-tarikh'),tem=gv('p-tempat'),sta=gv('p-status');
  var katList=getKatChecked('p-kat-wrap');
  var luar=!!(document.getElementById('p-luar')||{}).checked;
  if(!n||!pen||!bid||!per||!tar||!tem){toast('Sila lengkapkan semua medan','er');return;}
  if(!kod){toast('Sila masukkan Kod Sekolah Penganjur','er');return;}
  if(!katList.length){toast('Sila pilih sekurang-kurangnya 1 kategori','er');return;}
  showOv('MENDAFTAR PROGRAM...'); setBtn('btn-daftar',true);
  try{
    var r=await run('daftarProgramGS',{nama:n,pengelola:pen,kodPengelola:kod,bidang:bid,kategori:katList,peringkat:per,tarikh:tar,tempat:tem,status:sta,aktivitiLuar:luar});
    if(r&&r.ok){toast('Program berjaya didaftarkan','ok');clearPF();await loadProgs(true);}
    else toast((r&&r.msg)||'Ralat','er');
  }catch(e){toast('Ralat: '+e.message,'er');}
  finally{hideOv();setBtn('btn-daftar',false);}
}
function clearPF(){
  ['p-nama','p-pengelola','p-kod','p-bidang','p-per','p-tarikh','p-tempat'].forEach(function(id){document.getElementById(id).value='';});
  document.getElementById('p-status').value='AKTIF';
  var _pl=document.getElementById('p-luar'); if(_pl) _pl.checked=false;
  // Reset kategori checkboxes to default (Individu L + P)
  document.querySelectorAll('#p-kat-wrap input[type=checkbox]').forEach(function(cb){
    cb.checked=(cb.value==='INDIVIDU LELAKI'||cb.value==='INDIVIDU PEREMPUAN');
  });
}

async function loadProgs(bust, silent){
  if(bust)cBust();
  var el=document.getElementById('prog-list');
  if(!silent){
    el.innerHTML='<div class="ld"><div class="sp"></div>Memuatkan...</div>';
    setBtn('btn-rp',true);
  }
  try{
    var r=await run('getAllDataGS');
    var d=(r&&r.programs)?r.programs:[];
    var pny=(r&&r.penyertaan)?r.penyertaan:[];
    var pc=(r&&r.pencapaian)?r.pencapaian:[];
    _aP=pny; _aPnc=pc; _aPg=d;
    d.forEach(function(p){
      var rows=pny.filter(function(x){return x['Program ID']===p['ID'];});
      var sek={},guru={},pes={};
      rows.forEach(function(x){
        if(x['Kod Sekolah'])sek[x['Kod Sekolah']]=1;
        var gk=x['No KP Guru']||x['Nama Guru']; if(gk&&x['Nama Guru'])guru[gk]=1;
        var pk=x['No KP Peserta']||x['Nama Peserta'];
        var kat=x['Kategori Penyertaan']||'';
        if(pk&&x['Nama Peserta']&&kat&&kat!=='GURU')pes[pk]=1;
      });
      p._pnyCount=Object.keys(pes).length; // peserta unik
      p._sekCount=Object.keys(sek).length;
      p._guruCount=Object.keys(guru).length;
      // Tanda ⚠ pada kad jika ada kategori penyertaan tidak sepadan dengan kategori program
      p._katAsing=_getKatAsing(_progKatList(p), rows);
      p._katMismatch=p._katAsing.length>0;
    });
    _allProg=d;
    populateMonthFilt(d);
    _updateStabCounts(d);
    applyProgFilt();
  }catch(e2){
    if(silent){ console.warn('loadProgs(silent) gagal, diabaikan senyap:', e2.message); }
    else{
      var msg2 = e2.message||'';
      var isAuth = msg2.indexOf('permission')>=0||msg2.indexOf('RLS')>=0||msg2.indexOf('row-level security')>=0||msg2.indexOf('JWT')>=0;
      document.getElementById('prog-list').innerHTML=
        '<div class="empty"><div class="ei">'+(isAuth?'🔐':'⚠')+'</div>'
        +'<h3>'+(isAuth?'Kebenaran Pangkalan Data Diperlukan':'Gagal: '+msg2)+'</h3>'
        +(isAuth?'<p style="font-size:.8rem;color:#666;max-width:340px;margin:.5rem auto;">Akses ke pangkalan data Supabase disekat. Sila semak dasar <b>Row Level Security (RLS)</b> untuk jadual berkaitan, atau hubungi admin sistem.</p>':'')
        +'</div>';
    }
  }
  finally{ if(!silent) setBtn('btn-rp',false); }
}

function populateMonthFilt(progs){
  var sel=document.getElementById('flt-bulan'); if(!sel)return;
  var months={};
  progs.forEach(function(p){
    if(!p['Tarikh'])return;
    var d=new Date(p['Tarikh']); if(isNaN(d))return;
    var key=d.getFullYear()+'-'+(d.getMonth()+1);
    var lbl=MTHS[d.getMonth()]+' '+d.getFullYear();
    months[key]=lbl;
  });
  // Sort month keys newest first
  var keys=Object.keys(months).sort().reverse();
  // Rebuild options
  sel.innerHTML='<option value="">📅 SEMUA BULAN</option>';
  keys.forEach(function(k){
    var o=document.createElement('option'); o.value=k; o.textContent=months[k];
    sel.appendChild(o);
  });
}

var _activeStab='AKTIF';
function _setStab(status){
  _activeStab=status;
  ['aktif','tutup','semua'].forEach(function(k){
    var t=document.getElementById('stab-'+k);
    if(t)t.className='stab'+(status===(k==='semua'?'':k.toUpperCase())?' on-'+k:'');
  });
  applyProgFilt();
}
function _updateStabCounts(progs){
  var ca=0,ct=0;
  progs.forEach(function(p){
    var s=(p['Status']||'').toUpperCase();
    if(s==='AKTIF'||s==='DRAFT')ca++;
    else if(s==='TUTUP')ct++;
  });
  var sa=document.getElementById('stab-ct-a'); if(sa)sa.textContent=ca;
  var st=document.getElementById('stab-ct-t'); if(st)st.textContent=ct;
  var ss=document.getElementById('stab-ct-s'); if(ss)ss.textContent=progs.length;
}
function applyProgFilt(){
  var nama  =document.getElementById('flt-nama')&&document.getElementById('flt-nama').value.trim().toUpperCase();
  var bulan =document.getElementById('flt-bulan')&&document.getElementById('flt-bulan').value;
  var bidang=document.getElementById('flt-bidang')&&document.getElementById('flt-bidang').value;
  var clrBtn=document.getElementById('btn-flt-clr');
  if(clrBtn)clrBtn.style.display=(nama||bulan||bidang)?'block':'none';
  var filtered=_allProg.filter(function(p){
    if(nama&&(p['Nama Program']||'').toUpperCase().indexOf(nama)===-1)return false;
    if(bulan){var d=new Date(p['Tarikh']);if(isNaN(d))return false;var k=d.getFullYear()+'-'+(d.getMonth()+1);if(k!==bulan)return false;}
    if(bidang&&(p['Bidang']||'').toUpperCase()!==bidang.toUpperCase())return false;
    if(_activeStab){
      var s=(p['Status']||'').toUpperCase();
      if(_activeStab==='AKTIF'&&s!=='AKTIF'&&s!=='DRAFT')return false;
      if(_activeStab==='TUTUP'&&s!=='TUTUP')return false;
    }
    return true;
  });
  renderProgList(filtered);
}
function clearProgFilt(){
  ['flt-nama','flt-bulan','flt-bidang'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var clrBtn=document.getElementById('btn-flt-clr');if(clrBtn)clrBtn.style.display='none';
  applyProgFilt();
}

function renderProgList(progs){
  var el=document.getElementById('prog-list');
  _updateStabCounts(_allProg);
  if(!progs.length){
    el.innerHTML='<div class="empty"><div class="ei">📭</div><h3>Tiada program</h3></div>';
    return;
  }
  // Sort by date closest first (ascending from today, then past)
  var now=Date.now();
  var sorted=progs.slice().sort(function(a,b){
    var da=new Date(a['Tarikh']||0), db=new Date(b['Tarikh']||0);
    var ta=da.getTime()||0, tb=db.getTime()||0;
    // Future/today first, then past — within each group sort ascending
    var fa=ta>=now, fb=tb>=now;
    if(fa&&!fb)return -1; if(!fa&&fb)return 1;
    return ta-tb;
  });
  // Group by month
  var groups={}, order=[];
  sorted.forEach(function(p){
    var d=new Date(p['Tarikh']||'');
    var key=isNaN(d)?'Tarikh Tidak Ditetapkan':(MTHS[d.getMonth()]+' '+d.getFullYear());
    if(!groups[key]){groups[key]=[];order.push(key);}
    groups[key].push(p);
  });
  el.innerHTML='';
  order.forEach(function(month){
    var hdr=document.createElement('div'); hdr.className='pmonth-hdr';
    hdr.textContent='📅 '+month+' ('+groups[month].length+')';
    el.appendChild(hdr);
    var grid=document.createElement('div'); grid.className='pgrid';
    groups[month].forEach(function(p){
      if((p['Status']||'').toUpperCase()==='TUTUP'){
        grid.appendChild(tutupRow(p));
      } else {
        grid.appendChild(progCard(p));
      }
    });
    el.appendChild(grid);
  });
  // Selepas semua kad dibina, apply lastAccess pada kad terlibat sahaja
  if(window._lastAccess){
    Object.keys(window._lastAccess).forEach(function(pid){
      var strip=document.getElementById('le-'+pid);
      if(strip){strip.innerHTML=_fmtAccess(window._lastAccess[pid]);strip.classList.add('on');}
    });
  }
}

function progCard(p){
  var sc=p['Status']==='AKTIF'?'sA':p['Status']==='TUTUP'?'sT':'sD';
  var div=document.createElement('div'); div.className='pc';
  div.setAttribute('data-prog-id', p['ID']||'');
  div.setAttribute('data-status', p['Status']||'');

  // Bina pill kategori — warna unik per jenis
  var katMap={'INDIVIDU LELAKI':'kil','INDIVIDU PEREMPUAN':'kip','BERKUMPULAN LELAKI':'kbl','BERKUMPULAN PEREMPUAN':'kbp','KESELURUHAN':'kks','TERBUKA INDIVIDU':'kil','TERBUKA BERKUMPULAN':'kbl','TERBUKA':'kks'};
  var katList=(p['Kategori']||'').split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean);
  var katHtml=katList.map(function(k){
    var cls=katMap[k]||'kil';
    var lbl=k.replace('INDIVIDU ','IND ').replace('BERKUMPULAN ','BRK ');
    return '<span class="pc-kat-pill '+cls+'">'+lbl+'</span>';
  }).join('');

  // Strip last-access — _trackAccess akan isi kad berkenaan apabila butang ditekan
  var _leHtml='<div class="last-edit-strip" id="le-'+p['ID']+'"></div>';

  // Tentukan butang mengikut role
  var _isAdmin = _sesi && _sesi.role==='admin';
  var _isPKK   = _sesi && _sesi.role==='pkk';
  var _isGuru  = _sesi && _sesi.role==='guru';
  var _ownKod  = _sesi ? String(_sesi.kodSekolah||'').toUpperCase().trim() : '';
  var _progKod = String(p['Kod Pengelola']||'').toUpperCase().trim();
  var _canEdit = _isAdmin || (_isPKK && _ownKod && _ownKod===_progKod);
  var _btnHtml = '<button class="btn bs bsm btn-lihat">👁 DATA</button>';
  if(_canEdit) _btnHtml += '<button class="btn bw bsm btn-edit">✏ EDIT</button>';
  if(_isAdmin) _btnHtml += '<button class="btn bd bsm btn-padam">🗑 PADAM</button>';
  if(!_isGuru) _btnHtml += '<button class="btn bi bsm btn-rum">📄 RUMUSAN</button>';
  if(!_isGuru) _btnHtml += '<button class="btn bg bsm btn-xlsx">📥 EXCEL</button>';

  div.innerHTML=
    '<div class="pc-top">'
      +'<div class="fx ic" style="gap:.32rem;"><div class="stag '+sc+'">'+p['Status']+'</div>'
      +(p._katMismatch?'<span class="pc-kat-warn" title="⚠ Kategori penyertaan tidak sepadan: '+esc((p._katAsing||[]).join(', '))+'">!</span>':'')
      +(p['Aktiviti Luar']===true?'<span class="luar-tag" title="Aktiviti Luar — tidak semua sekolah menyertai">🌐 LUAR</span>':'')
      +'</div>'
      +'<span class="pc-bidang">'+p['Bidang']+'</span>'
    +'</div>'
    +'<h3>'+p['Nama Program']+'</h3>'
    +(katHtml?'<div class="pc-kat">'+katHtml+'</div>':'')
    +'<div class="pmeta">'
      +'<div class="pmi">🎯 '+p['Peringkat']+'</div>'
      +'<div class="pmi">📅 '+fd(p['Tarikh'])+'</div>'
      +(p['Tempat']?'<div class="pmi pmi-full">📍 '+p['Tempat']+'</div>':'')
    +'</div>'
    +'<div class="pc-stats">'
      +'<div class="pc-stat"><strong>'+(p._sekCount||0)+'</strong> sekolah</div>'
      +'<div class="pc-stat" style="color:var(--g3);">|</div>'
      +'<div class="pc-stat"><strong>'+(p._pnyCount||0)+'</strong> peserta</div>'
      +'<div class="pc-stat" style="color:var(--g3);">|</div>'
      +'<div class="pc-stat"><strong>'+(p._guruCount||0)+'</strong> guru</div>'
    +'</div>'
    +_leHtml
    +'<div class="pc-err" id="pc-err-'+p['ID']+'" style="display:none;"></div>'
    +'<div class="pc-btns">'+_btnHtml+'</div>';

  var ps=JSON.parse(JSON.stringify(p));
  div.querySelector('.btn-lihat').addEventListener('click',function(){
    hidePcErr(ps['ID']);
    if(!_sesi){showPcErr(ps['ID'],'Sila log masuk dahulu untuk melihat data.');return;}
    _trackAccess(ps['ID'],'👁 DATA');
    reqLihat(ps['ID'],ps['Nama Program']);
  });
  if(_canEdit) div.querySelector('.btn-edit').addEventListener('click',function(){
    hidePcErr(ps['ID']);
    _trackAccess(ps['ID'],'✏ EDIT');reqEdit(ps);
  });
  if(_isAdmin) div.querySelector('.btn-padam').addEventListener('click',function(){
    hidePcErr(ps['ID']);
    reqPadam(ps['ID'],ps['Nama Program'],ps['Kod Pengelola']||'');
  });
  if(!_isGuru){
    div.querySelector('.btn-rum').addEventListener('click',function(){
      hidePcErr(ps['ID']);
      if(!_sesi){showPcErr(ps['ID'],'Sila log masuk dahulu untuk melihat rumusan.');return;}
      _trackAccess(ps['ID'],'📄 RUMUSAN');reqRum(ps['ID'],ps['Status']);
    });
    div.querySelector('.btn-xlsx').addEventListener('click',function(){
      hidePcErr(ps['ID']);
      if(!_sesi){showPcErr(ps['ID'],'Sila log masuk dahulu untuk muat turun Excel.');return;}
      _trackAccess(ps['ID'],'📥 EXCEL');reqXlsx(ps);
    });
  }
  return div;
}

function tutupRow(p){
  var isAdmin=_sesi&&_sesi.role==='admin';
  var div=document.createElement('div'); div.className='trow';
  div.setAttribute('data-prog-id',p['ID']||'');
  var ps=JSON.parse(JSON.stringify(p));
  var meta=[p['Bidang'],p['Peringkat'],fd(p['Tarikh'])].filter(Boolean).join(' · ');
  // Butang asas — semua pengguna
  var btns='<button class="trow-btn btn-lihat">👁 DATA</button>'
    +'<button class="trow-btn btn-rum">📄</button>'
    +'<button class="trow-btn btn-xlsx">📥</button>';
  // Butang EDIT & PADAM — admin sahaja
  if(isAdmin){
    btns='<button class="trow-btn trow-btn-edit btn-edit">✏ EDIT</button>'+btns
      +'<button class="trow-btn btn-padam" style="color:var(--red);border-color:rgba(192,57,43,.3);">🗑</button>';
  }
  // Last access strip
  var leHtml='<div class="last-edit-strip" id="le-'+p['ID']+'"></div>';
  div.innerHTML=
    '<div class="trow-dot"></div>'
    +'<div class="trow-body">'
      +'<div class="trow-title">'+p['Nama Program']+(p._katMismatch?' <span class="pc-kat-warn" title="⚠ Kategori penyertaan tidak sepadan: '+esc((p._katAsing||[]).join(', '))+'">!</span>':'')+(p['Aktiviti Luar']===true?' <span class="luar-tag">🌐 LUAR</span>':'')+'</div>'
      +'<div class="trow-meta">'+meta+'</div>'
      +leHtml
    +'</div>'
    +'<div class="trow-btns">'+btns+'</div>';
  div.querySelector('.btn-lihat').addEventListener('click',function(){_trackAccess(ps['ID'],'👁 DATA');reqLihat(ps['ID'],ps['Nama Program']);});
  div.querySelector('.btn-rum').addEventListener('click',function(){_trackAccess(ps['ID'],'📄 RUMUSAN');reqRum(ps['ID'],ps['Status']);});
  div.querySelector('.btn-xlsx').addEventListener('click',function(){_trackAccess(ps['ID'],'📥 EXCEL');reqXlsx(ps);});
  if(isAdmin){
    div.querySelector('.btn-edit').addEventListener('click',function(){_trackAccess(ps['ID'],'✏ EDIT');reqEdit(ps);});
    div.querySelector('.btn-padam').addEventListener('click',function(){reqPadam(ps['ID'],ps['Nama Program'],ps['Kod Pengelola']||'');});
  }
  return div;
}

// LIHAT
function reqLihat(id,nm){
  if(!_sesi){showPcErr(id,'Sila log masuk dahulu untuk melihat data.');return;}
  lihatPeny(id,nm);
}
async function lihatPeny(pid,nm){
  showOv('MEMUATKAN...');
  try{
    // P: Sentiasa fetch fresh terus dari server (sama macam getRumusanGS).
    // SEBAB: cache _aP global boleh jadi stale/tidak lengkap (contohnya selepas
    // tukar tab atau tapisan tahun berbeza), menyebabkan penapisan tempatan
    // x['Program ID']===pid pulangkan kosong walaupun data sebenar wujud di
    // Supabase (RUMUSAN yang fetch fresh tetap tepat, tapi DATA tunjuk kosong).
    var r=await run('getPenyertaanByProgramGS',pid);
    var d=(r&&r.data)?r.data:[];
    document.getElementById('lihat-tit').textContent='📋 PENYERTAAN — '+nm;
    if(!d.length){
      document.getElementById('lihat-body').innerHTML='<div class="empty"><div class="ei">📭</div><h3>Tiada penyertaan</h3></div>';
      openMo('mo-lihat'); return;
    }
    _checkKatMismatch(pid, d);
    var _progKatForLihat=_progKatList((_allProg||[]).filter(function(p){return p['ID']===pid;})[0]);
    // Group by sekolah
    var sekMap={}, sekOrder=[];
    d.forEach(function(p){
      var sk=p['Nama Sekolah']||'—';
      if(!sekMap[sk]){sekMap[sk]={kod:p['Kod Sekolah']||'—',rows:[]};sekOrder.push(sk);}
      sekMap[sk].rows.push(p);
    });
    var wrap=document.createElement('div');
    wrap.innerHTML='<div style="font-size:.7rem;color:var(--g5);font-weight:600;margin-bottom:.65rem;">'+sekOrder.length+' sekolah &bull; '+(function(){var u={};d.forEach(function(p){var k=p['No KP Peserta']||p['Nama Peserta'];if(k&&p['Nama Peserta'])u[k]=1;});return Object.keys(u).length;}())+'  peserta unik &bull; '+d.length+' rekod</div>';
    var list=document.createElement('div'); list.className='sek-list';
    sekOrder.forEach(function(sk){
      var info=sekMap[sk];
      var _skAsing=_getKatAsing(_progKatForLihat, info.rows);
      var _skWarnHtml=_skAsing.length?'<span class="sek-hdr-warn" title="⚠ Kategori tidak sepadan: '+esc(_skAsing.join(', '))+'">!</span>':'';
      var row=document.createElement('div'); row.className='sek-row';
      var hdr=document.createElement('div'); hdr.className='sek-hdr';
      hdr.innerHTML='<div><div class="sek-hdr-nm">🏫 '+sk+_skWarnHtml+'</div>'
        +'<div class="sek-hdr-meta">Kod: '+info.kod +' &bull; '+(function(rws){var u={};rws.forEach(function(p){if((p['Kategori Penyertaan']||'').toUpperCase()==='GURU')return;var k=p['No KP Peserta']||p['Nama Peserta'];if(k&&p['Nama Peserta'])u[k]=1;});return Object.keys(u).length;})(info.rows)+'  peserta</div></div>'
        +'<div class="sek-hdr-right">'
        +'<span class="sek-chevron">▼</span></div>';
      var body=document.createElement('div'); body.className='sek-body';
      // Peserta list inside
      var uPes={};
      info.rows.forEach(function(p){if((p['Kategori Penyertaan']||'').toUpperCase()==='GURU')return;var k=p['No KP Peserta']||p['Nama Peserta'];if(k&&!uPes[k])uPes[k]=p;});
      var uGuru={};
      info.rows.forEach(function(p){var k=p['No KP Guru']||p['Nama Guru'];if(k&&!uGuru[k])uGuru[k]=p;});
      var pesHtml=Object.values(uPes).map(function(p){
        return '<div style="display:flex;align-items:center;gap:.5rem;padding:.22rem 0;border-bottom:1px solid var(--g1);">'
          +'<span style="font-size:.8rem;">🧑‍🎓</span>'
          +'<div style="flex:1;"><div style="font-size:.72rem;font-weight:700;color:var(--g8);">'+(p['Nama Peserta']||'—')+'</div>'
          +'<div style="font-size:.62rem;color:var(--g5);">'+(p['Jantina Peserta']||'')+(p['Bangsa Peserta']?' &bull; '+p['Bangsa Peserta']:'')+'</div></div>'
          +'</div>';
      }).join('');
      var guruHtml=Object.values(uGuru).map(function(g){
        return '<div style="display:flex;align-items:center;gap:.5rem;padding:.22rem 0;border-bottom:1px solid var(--g1);">'
          +'<span style="font-size:.8rem;">👨‍🏫</span>'
          +'<div style="flex:1;"><div style="font-size:.72rem;font-weight:700;color:var(--g8);">'+(g['Nama Guru']||'—')+'</div>'
          +'<div style="font-size:.62rem;color:var(--g5);">'+(g['Jantina Guru']||'')+(g['Bangsa Guru']?' &bull; '+g['Bangsa Guru']:'')+'</div></div>'
          +'</div>';
      }).join('');
      body.innerHTML='<div style="margin-bottom:.5rem;">'
        +'<div style="font-size:.62rem;font-weight:800;color:var(--g5);text-transform:uppercase;margin-bottom:.25rem;">GURU ('+Object.keys(uGuru).length+')</div>'
        +guruHtml+'</div>'
        +'<div style="margin-bottom:.7rem;">'
        +'<div style="font-size:.62rem;font-weight:800;color:var(--g5);text-transform:uppercase;margin-bottom:.25rem;">PESERTA ('+Object.keys(uPes).length+')</div>'
        +pesHtml+'</div>'
        +'<div class="sek-btn-row">'
        +'<button class="btn-edit-sek">✏️ EDIT PENYERTAAN</button>'
        +'<button class="btn-del-sek">🗑 PADAM PENYERTAAN</button>'
        +'</div>';
      // Edit & Delete button handlers
      (function(sekNm,progId,progNm,kodSek){
        body.querySelector('.btn-edit-sek').addEventListener('click',function(){
          reqEditSek(progId,progNm,sekNm,kodSek);
        });
        body.querySelector('.btn-del-sek').addEventListener('click',function(){
          reqPadamSek(progId,progNm,sekNm,kodSek);
        });
      })(sk,pid,nm,info.kod);
      // Toggle accordion
      hdr.addEventListener('click',function(){
        var isOpen=body.classList.contains('open');
        body.classList.toggle('open',!isOpen);
        hdr.classList.toggle('open',!isOpen);
        var chev=hdr.querySelector('.sek-chevron');
        if(chev)chev.classList.toggle('open',!isOpen);
      });
      row.appendChild(hdr); row.appendChild(body);
      list.appendChild(row);
    });
    wrap.appendChild(list);
    document.getElementById('lihat-body').innerHTML='';
    document.getElementById('lihat-body').appendChild(wrap);
    openMo('mo-lihat');
    setTimeout(_patchPadamSekBtns, 50);
  }catch(e){toast('Gagal: '+e.message,'er'); showPcErr(pid, 'Gagal memuatkan data: '+e.message);}
  finally{hideOv();}
}

function reqPadamSek(progId,progNm,sekNm,kodSek){
  // Dapatkan program untuk semak kod pengelola
  var prog=(_allProg||[]).filter(function(p){return p['ID']===progId;})[0];
  var progPengKod = prog ? String(prog['Kod Pengelola']||'').toUpperCase() : '';

  // Semak akses dari sesi
  if(!canPadamSek(kodSek, progPengKod)){
    toast('Anda tidak dibenarkan memadam penyertaan ini.','er');
    return;
  }
  askConfirm('🗑 PADAM PENYERTAAN','⚠ Padam SEMUA penyertaan '+sekNm+' dari program ini?\nTindakan tidak boleh dibuat alik.',function(){padamSekPeny(progId,progNm,sekNm,kodSek);});
}

async function padamSekPeny(progId,progNm,sekNm,kodSek){
  showOv('MEMADAM PENYERTAAN...');
  try{
    // Use kemaskiniPenyertaanSekolahGS with rows=[] to wipe sekolah entries
    var r=await run('kemaskiniPenyertaanSekolahGS',{programId:progId,kodSekolah:kodSek,rows:[]});
    if(r&&r.ok){
      toast(sekNm+' dipadam dari penyertaan','ok');
      closeMo('mo-lihat');
    }else toast((r&&r.msg)||'Ralat','er');
  }catch(e){toast('Ralat: '+e.message,'er');}
  finally{hideOv();}
}

// Khas ADMIN: butang EDIT dalam modal lihat sekolah (dari bullet tab Penyertaan) —
// guna semula logik akses & flow yang sama dengan reqEditSek() di Pengelola.
function _editSekolahDariBullet(progId, progNm, sekNm, kodSek){
  var prog=(_allProg||[]).filter(function(p){return p['ID']===progId;})[0];
  var progPengKod = prog ? String(prog['Kod Pengelola']||'').toUpperCase() : '';
  if(!canPadamSek(kodSek, progPengKod)){
    toast('Anda tidak dibenarkan mengedit penyertaan ini.','er');
    return;
  }
  closeMo('mo-srch');
  setTimeout(function(){
    if(!prog){ toast('Data program tidak dijumpai.','er'); return; }
    _curProg = prog;
    _openPenyertaanEdit(prog, kodSek, sekNm);
  }, 220);
}

function reqEditSek(progId,progNm,sekNm,kodSek){
  // Semak akses — sama dengan canPadamSek
  var prog=(_allProg||[]).filter(function(p){return p['ID']===progId;})[0];
  var progPengKod = prog ? String(prog['Kod Pengelola']||'').toUpperCase() : '';
  if(!canPadamSek(kodSek, progPengKod)){
    toast('Anda tidak dibenarkan mengedit penyertaan ini.','er');
    return;
  }
  // Tutup modal lihat dahulu, kemudian buka modal penyertaan dalam mod edit
  closeMo('mo-lihat');
  // Tunggu sedikit untuk animasi tutup, kemudian buka edit penyertaan
  setTimeout(function(){
    // Cari program dari senarai
    if(!prog){ toast('Data program tidak dijumpai.','er'); return; }
    // Set _curProg supaya modal penyertaan tahu program yang dipilih
    _curProg = prog;
    // Buka modal penyertaan dengan data sedia ada untuk sekolah ini
    _openPenyertaanEdit(prog, kodSek, sekNm);
  }, 220);
}

async function _openPenyertaanEdit(prog, kodSek, sekNm){
  showOv('MEMUATKAN DATA PENYERTAAN...');
  try{
    // 1. Pindah ke tab peserta dahulu (tanpa loadProgsForPeny — kita urus sendiri)
    _doShowPage('peserta');

    // 2. Muatkan semua data dengan callback — pastikan _aP & _progForPny sedia
    await new Promise(function(resolve){
      loadProgsForPeny(false, resolve);
    });

    // 3. Pastikan prog ini ada dalam _progForPny walaupun bukan AKTIF
    if(!_progForPny) _progForPny = [];
    if(!_progForPny.find(function(p){ return p['ID']===prog['ID']; })){
      _progForPny.push(prog);
    }

    // 4. Cari data penyertaan sekolah ini dari _aP (sudah dimuatkan)
    var existing = _aP.filter(function(x){
      return x['Program ID']===prog['ID'] &&
             String(x['Kod Sekolah']||'').toUpperCase()===String(kodSek||'').toUpperCase();
    });

    // 5. Jika tiada dalam cache, fetch terus
    if(!existing.length){
      var r = await run('getPenyertaanByProgramGS', prog['ID']);
      var all = (r&&r.data)?r.data:[];
      existing = all.filter(function(x){
        return String(x['Kod Sekolah']||'').toUpperCase()===String(kodSek||'').toUpperCase();
      });
      if(existing.length){
        existing.forEach(function(row){
          var dup=_aP.some(function(x){return x['ID']===row['ID'];});
          if(!dup) _aP.push(row);
        });
      }
    }

    hideOv();
    if(!existing.length){
      toast('Tiada data penyertaan untuk sekolah ini.','in');
      return;
    }

    // 6. Jalankan prefill — data sudah sedia
    _prefillPenyertaanEdit(prog, kodSek, sekNm, existing);

  }catch(e){
    hideOv();
    toast('Ralat: '+e.message,'er');
  }
}

function _prefillPenyertaanEdit(prog, kodSek, sekNm, rows){
  // Langkah 1: Pilih program — panggil pilihProg() terus
  var cardEl = document.querySelector('.psc[data-pid="'+prog['ID']+'"]');
  pilihProg(prog['ID'], prog['Nama Program'], cardEl || null);

  // Langkah 2: pilihProg() sinkron — terus pilih sekolah dan buka borang
  // Guna setTimeout kecil untuk beri masa DOM render dropdown sekolah
  setTimeout(function(){
    // Set dropdown sekolah
    var selEl = document.getElementById('daf-sek-select');
    if(selEl) selEl.value = kodSek;
    _syncDafSekDisplay();

    // Set hidden fields
    var kodH = document.getElementById('daf-kod');
    var sekH = document.getElementById('daf-sek');
    if(kodH) kodH.value = kodSek;
    if(sekH) sekH.value = sekNm;

    // Langkah 3: onSekSelect akan detect rekod, aktif Mod Kemaskini, prefill & buka borang
    onSekSelect(kodSek);

    // Scroll ke borang
    setTimeout(function(){
      var fw = document.getElementById('peny-form-wrap');
      if(fw && fw.style.display !== 'none'){
        fw.scrollIntoView({behavior:'smooth', block:'start'});
      } else {
        var sbEl = document.getElementById('sbox-sekolah');
        if(sbEl) sbEl.scrollIntoView({behavior:'smooth', block:'nearest'});
      }
    }, 300);
  }, 200);
}

// EDIT
function reqEdit(p){
  if(!_sesi){toast('Sila log masuk dahulu','er');return;}
  var ownKod = String(_sesi.kodSekolah||'').toUpperCase().trim();
  var progKod = String(p['Kod Pengelola']||'').toUpperCase().trim();
  if(_sesi.role==='admin' || (_sesi.role==='pkk' && ownKod && ownKod===progKod)){
    openEdit(p);
  } else {
    toast('Akses ditolak. Hanya PKK sekolah pengelola atau Admin boleh mengemaskini.','er');
  }
}
async function openEdit(p){
  // PEMBETULAN SEDERHANA #1: Pastikan _aP sudah dimuatkan sebelum buka modal edit
  if(!_aP||!_aP.length){
    showOv('MEMUATKAN DATA...');
    try{ await loadProgsForPeny(false); }catch(e){}
    hideOv();
  }
  eId=p['ID'];eNm=p['Nama Program'];
  var _katRaw=p['Kategori']||'INDIVIDU LELAKI,INDIVIDU PEREMPUAN';
  var _katList=_katRaw.split(',').map(function(k){return k.trim().toUpperCase();});
  eKat=_katRaw;
  // Populate checkboxes
  document.querySelectorAll('#e-kat-wrap input[type=checkbox]').forEach(function(cb){
    cb.checked=_katList.indexOf(cb.value)>=0;
  });
  document.getElementById('e-id').value=p['ID'];
  document.getElementById('e-nama').value=p['Nama Program'];
  document.getElementById('e-pen').value=p['Pengelola'];
  document.getElementById('e-kod').value=p['Kod Pengelola']||'';
  document.getElementById('e-bidang').value=p['Bidang'];
  // e-kat removed (now uses checkboxes)
  document.getElementById('e-per').value=p['Peringkat']||'SEKOLAH';
  document.getElementById('e-tarikh').value=p['Tarikh']?String(p['Tarikh']).split('T')[0]:'';
  document.getElementById('e-tempat').value=p['Tempat'];
  document.getElementById('e-status').value=p['Status'];
  var _el=document.getElementById('e-luar'); if(_el) _el.checked=(p['Aktiviti Luar']===true);
  document.getElementById('pc-ld').style.display='flex';
  document.getElementById('pc-form').style.display='none';
  openMo('mo-edit');
  try{
    var r=await run('getEditDataGS',p['ID']);
    _curPny=(r&&r.penyertaan)?r.penyertaan:[];
    _curPnc=(r&&r.pencapaian)?r.pencapaian:[];
    var _prog4Pnc=(_aPg||[]).find(function(p){return p['ID']===eId;})||{};
    var _katRaw4=_prog4Pnc['Kategori']||eKat||'INDIVIDU LELAKI,INDIVIDU PEREMPUAN';
    renderPcForm(_curPny,_curPnc,_katRaw4);
  }catch(e){document.getElementById('pc-ld').innerHTML='<span style="color:var(--red);">Gagal: '+e.message+'</span>';}
}
function onEKat(){} // kategori kini dari checkbox

