// == PAGE 2 — PENYERTAAN (Borang Bersepadu) ===================
// _penyData: { guruList: [...], pesList: [...] }
// setiap peserta: { id, nama, kp, jantina, bangsa, kategori:[...] }
// setiap guru: { id, nama, kp, bangsa, jantina, tel }
var _progForPny=[], _selKatList=[], _penyData={guruList:[],pesList:[]}, _pGCnt=0, _pPCnt=0;

// == AUTO-SAVE DRAF PENYERTAAN ===================================
var _penyAutoSaveTimer=null;
function _penyAutoSave(){
  if(!selId) return;
  if(!_sesi) return; // jangan simpan draf jika tiada sesi aktif
  try{
    var kod=document.getElementById('daf-kod').value.trim();
    var sek=document.getElementById('daf-sek').value.trim();
    var draft={selId:selId,selNm:selNm,kod:kod,sek:sek,penyData:_penyData,
               selKatList:_selKatList,pGCnt:_pGCnt,pPCnt:_pPCnt,ts:Date.now(),
               noKP:_sesi.noKP||''}; // T1: ikat draf kepada sesi semasa
    sessionStorage.setItem('upbm_peny_draft',JSON.stringify(draft));
  }catch(e){}
}
function _startPenyAutoSave(){
  clearInterval(_penyAutoSaveTimer);
  _penyAutoSaveTimer=setInterval(_penyAutoSave,30000); // 30 saat
}
function _stopPenyAutoSave(keepDraft){
  clearInterval(_penyAutoSaveTimer);
  if(keepDraft) return; // idle-logout: biar draf kekal untuk dipulihkan selepas log masuk semula
  try{sessionStorage.removeItem('upbm_peny_draft');}catch(e){}
}
function _checkPenyDraft(){
  // T3: jangan semak draf jika tiada sesi aktif
  if(!_sesi) return;
  // T5: jika modal draf sudah terbuka, jangan buka lagi
  var moEl=document.getElementById('mo-draft');
  if(moEl&&moEl.classList.contains('on')) return;
  try{
    var raw=sessionStorage.getItem('upbm_peny_draft');
    if(!raw) return;
    var draft=JSON.parse(raw);
    if(!draft||!draft.selId||(Date.now()-draft.ts)>4*60*60*1000){sessionStorage.removeItem('upbm_peny_draft');return;}
    // T1: buang draf jika bukan kepunyaan sesi semasa
    if(draft.noKP && _sesi.noKP && draft.noKP !== _sesi.noKP){
      sessionStorage.removeItem('upbm_peny_draft');
      return;
    }
    // P1-B: Modal 3 pilihan — Sambung, Reset, Buang
    var age=Math.round((Date.now()-(draft.ts||Date.now()))/60000);
    var ageStr=age<60?age+' minit lepas':Math.round(age/60)+' jam lepas';
    var msg='Program: "'+draft.selNm+'"'+'\n'
      +'Sekolah: '+(draft.sek||draft.kod||'—')+'\n'
      +'Disimpan: '+ageStr+'\n\n'
      +'▶ SAMBUNG — teruskan dari tempat anda berhenti\n'
      +'↺ RESET — kosongkan borang, pilih program semula\n'
      +'🗑 BUANG — padam draf ini';
    document.getElementById('draft-msg').textContent=msg;
    window._pendingDraft=draft;
    openMo('mo-draft');
  }catch(e){}
}
function _draftSambung(){
  closeMo('mo-draft');
  if(window._pendingDraft){_restorePenyDraft(window._pendingDraft);window._pendingDraft=null;}
}
function _draftReset(){
  closeMo('mo-draft');
  try{sessionStorage.removeItem('upbm_peny_draft');}catch(e){}
  window._pendingDraft=null;
  resetPeny();
  toast('Draf dipadam — pilih program untuk bermula.','ok');
}
function _draftBuang(){
  closeMo('mo-draft');
  try{sessionStorage.removeItem('upbm_peny_draft');}catch(e){}
  window._pendingDraft=null;
  toast('Draf dipadam.','ok');
}
function _restorePenyDraft(draft){
  selId=draft.selId; selNm=draft.selNm; isEdit=false; editKod='';
  _syncBatalBtn();
  _selKatList=draft.selKatList||[];
  _penyData=draft.penyData||{guruList:[],pesList:[]};
  _pGCnt=draft.pGCnt||0; _pPCnt=draft.pPCnt||0;
  document.querySelectorAll('.psc').forEach(function(c){c.classList.remove('on');});
  var progCard=document.querySelector('.psc[data-pid="'+selId+'"]');
  if(progCard) progCard.classList.add('on');
  document.getElementById('sel-name').textContent=selNm;
  document.getElementById('sel-info').style.display='block';
  document.getElementById('sel-edit-info').style.display='none';
  document.getElementById('sbox-sekolah').style.display='block';
  // Set hidden inputs
  _populateDafSekDropdown(); // NOTA: fungsi ini sengaja no-op (lihat definisi) — nilai sekolah diisi terus melalui input tersembunyi di bawah, bukan dropdown
  if(draft.kod){
    var ke=document.getElementById('daf-kod'); if(ke) ke.value=draft.kod;
    var selEl=document.getElementById('daf-sek-select'); if(selEl) selEl.value=draft.kod;
    _syncDafSekDisplay();
  }
  if(draft.sek){var se=document.getElementById('daf-sek');if(se)se.value=draft.sek;}
  document.getElementById('peny-form-wrap').style.display='block';
  _buildKatLegend();
  renderMainGuruList();
  renderMainPesList();
  _startPenyAutoSave();
  toast('Draf dipulihkan \u2014 semak sekolah & data sebelum hantar \u2713','ok');
}

async function loadProgsForPeny(bust, _doneCallback, silent){
  if(bust)cBust();
  var el=document.getElementById('peny-pilih');
  if(!silent) el.innerHTML='<div class="ld"><div class="sp"></div></div>';
  try{
    var r=await run('getAllDataGS');
    var allProg=(r&&r.programs)?r.programs:[];
    var allPny=(r&&r.penyertaan)?r.penyertaan:[];
    var allPnc=(r&&r.pencapaian)?r.pencapaian:[];
    _aP=allPny; _aPnc=allPnc; _aPg=allProg;
    var aktif=allProg.filter(function(p){return p['Status']==='AKTIF';});
    _progForPny=aktif;
    var bulanSel=document.getElementById('peny-flt-bulan');
    if(bulanSel){
      var mths={};
      aktif.forEach(function(p){
        if(!p['Tarikh'])return;
        var d=new Date(p['Tarikh']); if(isNaN(d))return;
        var key=d.getFullYear()+'-'+(d.getMonth()+1);
        mths[key]=MTHS[d.getMonth()]+' '+d.getFullYear();
      });
      var mkeys=Object.keys(mths).sort().reverse();
      bulanSel.innerHTML='<option value="">📅 SEMUA BULAN</option>';
      mkeys.forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=mths[k];bulanSel.appendChild(o);});
    }
    renderPenyList(aktif);
    if(typeof _doneCallback === 'function') _doneCallback();
  }catch(e){
    if(silent){ console.warn('loadProgsForPeny(silent) gagal, diabaikan senyap:', e.message); }
    else{ document.getElementById('peny-pilih').innerHTML='<div style="padding:1rem;color:var(--red);font-size:.74rem;">⚠ '+e.message+'</div>'; }
  }
}

var _penyView = 'kad'; // 'kad' atau 'senarai'

function setPenyView(v){
  _penyView = v;
  document.getElementById('peny-vtog-kad').classList.toggle('on', v==='kad');
  document.getElementById('peny-vtog-senarai').classList.toggle('on', v==='senarai');
  // FIX 1: Toggle class pada container supaya table layout betul
  var pp = document.getElementById('peny-pilih');
  if(pp) pp.classList.toggle('psa-list', v==='senarai');
  applyPenyFilt();
}

function applyPenyFilt(){
  var bulan=(document.getElementById('peny-flt-bulan')||{}).value||'';
  var bidang=(document.getElementById('peny-flt-bidang')||{}).value||'';
  var srch=((document.getElementById('peny-srch')||{}).value||'').trim().toLowerCase();
  var filtered=_progForPny.filter(function(p){
    if(bulan){var d=new Date(p['Tarikh']||'');if(isNaN(d))return false;var k=d.getFullYear()+'-'+(d.getMonth()+1);if(k!==bulan)return false;}
    if(bidang&&(p['Bidang']||'').toUpperCase()!==bidang.toUpperCase())return false;
    if(srch){
      var hay=((p['Nama Program']||'')+'|'+(p['Bidang']||'')+'|'+(p['Tempat']||'')+'|'+(p['Peringkat']||'')).toLowerCase();
      if(hay.indexOf(srch)<0) return false;
    }
    return true;
  });
  renderPenyList(filtered);
}

function renderPenyList(list){
  var el=document.getElementById('peny-pilih');
  el.innerHTML='';
  var srch=((document.getElementById('peny-srch')||{}).value||'').trim();
  if(!list.length){el.innerHTML='<div style="padding:1rem;font-size:.74rem;color:var(--g5);">📭 Tiada program'+(srch?' untuk "'+esc(srch)+'"':'')+'</div>';return;}
  // Tandakan program yang sudah ada rekod dari sekolah user (jika ada)
  var userKod=(document.getElementById('daf-kod')||{}).value||'';
  var hasRecSet={};
  if(userKod&&_aP&&_aP.length){
    _aP.forEach(function(r){
      if(String(r['Kod Sekolah']||'').toUpperCase()===userKod.toUpperCase()) hasRecSet[r['Program ID']||r['Nama Program']]=true;
    });
  }
  var isAdmin = !!(_sesi && _sesi.role==='admin');
  var pnyCountMap={};
  if(isAdmin && _aP && _aP.length){
    _aP.forEach(function(r){
      if(r['Kategori Penyertaan']==='GURU') return;
      var pid=r['Program ID']; if(!pid) return;
      pnyCountMap[pid]=(pnyCountMap[pid]||0)+1;
    });
  }
  if(_penyView==='senarai'){
    var tbl=document.createElement('table');
    tbl.style.cssText='width:100%;border-collapse:collapse;font-size:.73rem;';
    tbl.innerHTML='<thead><tr style="background:var(--g1);position:sticky;top:0;z-index:1;"><th style="padding:.42rem .6rem;text-align:left;font-size:.6rem;font-weight:800;color:var(--g5);">PROGRAM</th><th style="padding:.42rem .6rem;text-align:left;font-size:.6rem;font-weight:800;color:var(--g5);white-space:nowrap;">BIDANG</th><th style="padding:.42rem .6rem;text-align:left;font-size:.6rem;font-weight:800;color:var(--g5);white-space:nowrap;">TARIKH</th><th style="padding:.42rem .6rem;text-align:center;font-size:.6rem;font-weight:800;color:var(--g5);white-space:nowrap;">STATUS</th></tr></thead>';
    var tbody=document.createElement('tbody');
    list.forEach(function(p){
      var hasRec=hasRecSet[p['ID']]||hasRecSet[p['Nama Program']];
      var tr=document.createElement('tr');
      tr.style.cssText='cursor:pointer;border-bottom:1px solid var(--g2);transition:background .12s;'+(selId===p['ID']?'background:rgba(192,57,43,.07);':'');
      var stBg=p['Status']==='AKTIF'?'#e8f5e9':'#fef9e7';
      var stCl=p['Status']==='AKTIF'?'#27ae60':'#b7770d';
      tr.innerHTML='<td style="padding:.42rem .6rem;font-weight:700;color:var(--g8);">'+hlMatch(esc(p['Nama Program']),srch)+(hasRec?'&nbsp;<span style="font-size:.55rem;background:#e8f5e9;color:#27ae60;border-radius:20px;padding:.08rem .35rem;font-weight:800;">\u2713 ADA REKOD</span>':'')+(isAdmin?'&nbsp;<span style="font-size:.55rem;background:#eef2ff;color:#4338ca;border-radius:20px;padding:.08rem .35rem;font-weight:800;">👥 '+(pnyCountMap[p['ID']]||0)+'</span>':'')+'</td>'
        +'<td style="padding:.42rem .6rem;color:var(--g5);">'+(p['Bidang']||'\u2014')+'</td>'
        +'<td style="padding:.42rem .6rem;color:var(--g5);">'+(p['Tarikh']?fd(p['Tarikh']):'\u2014')+'</td>'
        +'<td style="padding:.42rem .6rem;text-align:center;"><span style="font-size:.55rem;font-weight:800;padding:.1rem .38rem;border-radius:20px;background:'+stBg+';color:'+stCl+';">'+p['Status']+'</span></td>';
      tr.setAttribute('data-pid', p['ID']);
      (function(pid,pnm,cel){cel.addEventListener('click',function(){
        // FIX 1: Highlight baris terpilih dalam mod senarai
        var tbl=cel.closest('table'); if(tbl) tbl.querySelectorAll('tr').forEach(function(r){r.classList.remove('psc-sel');});
        cel.classList.add('psc-sel');
        pilihProg(pid,pnm,cel);
      });})(p['ID'],p['Nama Program'],tr);
      // Tandakan baris aktif jika program ini sudah dipilih
      if(selId===p['ID']) tr.classList.add('psc-sel');
      tbody.appendChild(tr);
    });
    tbl.appendChild(tbody);
    el.appendChild(tbl);
  } else {
    list.forEach(function(p){
      var hasRec=hasRecSet[p['ID']]||hasRecSet[p['Nama Program']];
      var card=document.createElement('div');
      card.className='psc'+(selId===p['ID']?' on':'');
      card.setAttribute('data-pid', p['ID']);
      card.innerHTML='<h4>'+hlMatch(esc(p['Nama Program']),srch)+(hasRec?'&nbsp;<span style="font-size:.55rem;background:#e8f5e9;color:#27ae60;border-radius:20px;padding:.08rem .35rem;font-weight:800;">✓ ADA REKOD</span>':'')+'</h4>'
        +(isAdmin?'<div style="margin:.15rem 0 .1rem;"><span style="font-size:.55rem;background:#eef2ff;color:#4338ca;border-radius:20px;padding:.08rem .35rem;font-weight:800;">👥 '+(pnyCountMap[p['ID']]||0)+' penyertaan</span></div>':'')
        +'<p>'+esc(p['Bidang']||'')+' &bull; '+esc(p['Kategori']||'')+' &bull; '+esc(p['Peringkat']||'')+(p['Tarikh']?' &bull; '+fd(p['Tarikh']):'')+'</p>';
      (function(pid,pnm,cel){cel.addEventListener('click',function(){pilihProg(pid,pnm,cel);});})(p['ID'],p['Nama Program'],card);
      el.appendChild(card);
    });
  }
}

function pilihProg(id,nm,cardEl){
  selId=id; selNm=nm; isEdit=false; editKod='';
  _syncBatalBtn();
  document.querySelectorAll('.psc').forEach(function(c){c.classList.remove('on');});
  if(cardEl) cardEl.classList.add('on');
  document.getElementById('sel-name').textContent=nm;
  document.getElementById('sel-info').style.display='block';
  document.getElementById('sel-edit-info').style.display='none';
  var prog=(_progForPny||[]).find(function(p){return p['ID']===id;});
  var katRaw=prog?prog['Kategori']||'':'INDIVIDU LELAKI,INDIVIDU PEREMPUAN';
  _selKatList=katRaw.split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean);
  document.getElementById('sbox-sekolah').style.display='block';
  document.getElementById('peny-form-wrap').style.display='none';
  _penyData={guruList:[],pesList:[]};
  _pGCnt=0; _pPCnt=0;
  // Reset medan sekolah
  _populateDafSekDropdown(); // NOTA: fungsi ini sengaja no-op (lihat definisi) — nilai sekolah diisi terus melalui input tersembunyi di bawah, bukan dropdown
  var selEl=document.getElementById('daf-sek-select');
  // PEMBETULAN KRITIKAL #1: Guru/PKK — auto-pilih sekolah sendiri dan buka borang terus
  var _autoKod = (_sesi && (_sesi.role==='guru'||_sesi.role==='pkk') && _sesi.kodSekolah) ? _sesi.kodSekolah : '';
  if(selEl){ selEl.value = _autoKod || ''; }
  _syncDafSekDisplay();
  var kodH=document.getElementById('daf-kod'); if(kodH) kodH.value='';
  var sekH=document.getElementById('daf-sek'); if(sekH) sekH.value='';
  var ks=document.getElementById('kod-stat');
  // Semak jika ada rekod penyertaan untuk program ini — tunjuk status
  if(_aP && _aP.length){
    var allSekWithRec=_uniq((_aP||[]).filter(function(r){return r['Program ID']===id||r['Nama Program']===nm;}).map(function(r){return r['Kod Sekolah']||'';})).filter(Boolean);
    if(allSekWithRec.length){
      if(ks) ks.innerHTML='<div class="iwarn" id="ks-pilih-sek-notice">✏️ Program ini sudah ada <strong>'+allSekWithRec.length+' sekolah</strong> yang mendaftar. Pilih sekolah anda — jika sudah ada rekod, <strong>Mod Kemaskini</strong> akan diaktifkan.</div>';
    } else {
      if(ks) ks.innerHTML='<div class="iok">📋 Program dipilih. Pilih sekolah anda untuk mulakan pendaftaran baharu.</div>';
    }
  } else {
    if(ks) ks.innerHTML='';
  }
  // Ciri khas ADMIN: papar bullet senarai sekolah yang menyertai program ini
  var aSekEl=document.getElementById('peny-admin-sekolah-list');
  if(aSekEl){
    if(_sesi && _sesi.role==='admin' && _aP && _aP.length){
      var rowsProg=(_aP||[]).filter(function(r){return r['Program ID']===id && r['Kategori Penyertaan']!=='GURU';});
      var bySek={};
      rowsProg.forEach(function(r){
        var kd=r['Kod Sekolah']||'';
        if(!kd) return;
        if(!bySek[kd]) bySek[kd]={nama:r['Nama Sekolah']||kd, bil:0};
        bySek[kd].bil++;
      });
      var kodList=Object.keys(bySek).sort(function(a,b){return bySek[a].nama.localeCompare(bySek[b].nama);});
      if(kodList.length){
        aSekEl.innerHTML='<div style="font-size:.62rem;font-weight:800;color:var(--g5);margin-bottom:.35rem;">🏫 SEKOLAH YANG MENYERTAI ('+kodList.length+')</div>'
          +'<div style="display:flex;flex-wrap:wrap;gap:.35rem;">'
          +kodList.map(function(kd){
            return '<button type="button" class="btn bs bsm" style="border-radius:20px;" onclick="_lihatSekolahDlmProgram(\''+kd+'\',\''+id+'\',\''+esc(nm).replace(/'/g,"\\'")+'\')">'
              +esc(bySek[kd].nama)+' <span style="opacity:.7;">('+bySek[kd].bil+')</span></button>';
          }).join('')
          +'</div>';
      } else {
        aSekEl.innerHTML='';
      }
    } else {
      aSekEl.innerHTML='';
    }
  }
  // PEMBETULAN KRITIKAL #1: Jika guru/pkk, panggil onSekSelect secara auto (selId sudah diset)
  if(_autoKod && selEl && selEl.value===_autoKod){
    onSekSelect(_autoKod);
  }
  // Scroll ke bahagian sekolah
  var sbEl=document.getElementById('sbox-sekolah');
  if(sbEl) setTimeout(function(){sbEl.scrollIntoView({behavior:'smooth',block:'nearest'});},120);
  _startPenyAutoSave();
}

// Khas ADMIN: papar data penyertaan satu sekolah dalam program terpilih (bila bullet diklik)
function _lihatSekolahDlmProgram(kodSekolah, progId, progNama){
  var rows=(_aP||[]).filter(function(r){return r['Program ID']===progId && r['Kod Sekolah']===kodSekolah;});
  if(!rows.length){toast('Tiada data dijumpai.','er');return;}
  var namaSekolah=rows[0]['Nama Sekolah']||kodSekolah;

  // Kumpul guru unik
  var guruSeen={}, guruList=[];
  rows.forEach(function(r){
    if(r['Kategori Penyertaan']==='GURU' || r['Nama Guru']){
      var gk=(r['No KP Guru']||r['Nama Guru']);
      if(gk && !guruSeen[gk]){ guruSeen[gk]=1; guruList.push(r['Nama Guru']+(r['No Tel Guru']?' — '+r['No Tel Guru']:'')); }
    }
  });

  // Senarai peserta (bukan baris GURU sahaja)
  var pesRows=rows.filter(function(r){return r['Kategori Penyertaan']!=='GURU' && r['Nama Peserta'];});

  var html='<div style="margin-bottom:.6rem;font-size:.72rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;">'
    +'<div><b>'+esc(progNama)+'</b><br><span style="color:var(--g5);">'+esc(namaSekolah)+' ('+kodSekolah+')</span></div>'
    +'<button type="button" class="btn bp bsm" style="white-space:nowrap;" onclick="_editSekolahDariBullet(\''+progId+'\',\''+esc(progNama).replace(/'/g,"\\'")+'\',\''+esc(namaSekolah).replace(/'/g,"\\'")+'\',\''+kodSekolah+'\')">✏️ EDIT</button>'
    +'</div>';
  if(guruList.length){
    html+='<div style="font-size:.65rem;font-weight:800;color:var(--g5);margin:.4rem 0 .2rem;">👨‍🏫 GURU PENGIRING</div>'
      +'<ul style="margin:0 0 .5rem 1.1rem;padding:0;font-size:.72rem;">'+guruList.map(function(g){return '<li>'+esc(g)+'</li>';}).join('')+'</ul>';
  }
  html+='<div style="font-size:.65rem;font-weight:800;color:var(--g5);margin:.4rem 0 .2rem;">🧑‍🎓 PESERTA ('+pesRows.length+')</div>';
  if(pesRows.length){
    html+='<table style="width:100%;border-collapse:collapse;font-size:.71rem;">'
      +'<thead><tr style="background:var(--g1);"><th style="text-align:left;padding:.3rem .4rem;">Nama</th><th style="text-align:left;padding:.3rem .4rem;">Kategori</th></tr></thead><tbody>'
      +pesRows.map(function(r){return '<tr style="border-bottom:1px solid var(--g2);"><td style="padding:.3rem .4rem;">'+esc(r['Nama Peserta'])+'</td><td style="padding:.3rem .4rem;color:var(--g5);">'+esc(r['Kategori Penyertaan'])+'</td></tr>';}).join('')
      +'</tbody></table>';
  } else {
    html+='<p style="font-size:.71rem;color:var(--g5);">Tiada peserta direkodkan.</p>';
  }

  document.getElementById('srch-q').textContent = namaSekolah;
  document.getElementById('srch-body').innerHTML = html;
  openMo('mo-srch');
}

function _buildKatLegend(){
  var el=document.getElementById('peny-kat-legend');
  if(!el)return;
  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  el.innerHTML=_selKatList.filter(function(k){return k!=='KESELURUHAN';}).map(function(k){
    var c=colors[k]||'#555';
    return '<span style="background:'+c+';color:#fff;border-radius:20px;padding:.15rem .6rem;font-size:.62rem;font-weight:800;">'+k+'</span>';
  }).join('');
}

function addMainGuru(){
  _pGCnt++;
  var id='mg-'+_pGCnt;
  var g={id:id,nama:'',kp:'',bangsa:'',jantina:'',tel:''};
  _penyData.guruList.push(g);
  renderMainGuruList();
}

function removeMainGuru(id){
  _penyData.guruList=_penyData.guruList.filter(function(g){return g.id!==id;});
  renderMainGuruList();
}

function _getGuruSyorFromAP(kodSekolah){
  // Kumpul guru unik dari _aP — HANYA untuk sekolah dipilih (tiada fallback
  // ke semua sekolah, elak dedah data guru sekolah lain).
  var seen={}, list=[];
  var kodUp=String(kodSekolah||'').toUpperCase().trim();
  if(!kodUp) return list;
  (_aP||[]).forEach(function(r){
    if(String(r['Kod Sekolah']||'').toUpperCase().trim()!==kodUp) return;
    var kp=String(r['No KP Guru']||'').trim();
    var nm=String(r['Nama Guru']||'').trim();
    if(!nm) return;
    var key=kp||nm;
    if(!seen[key]){seen[key]=1;list.push({nama:nm,kp:kp,bangsa:String(r['Bangsa Guru']||'').trim(),jantina:String(r['Jantina Guru']||'').trim(),tel:String(r['No Tel Guru']||'').trim()});}
  });
  list.sort(function(a,b){return a.nama.localeCompare(b.nama);});
  return list;
}

function _getPesSyorFromAP(kodSekolah){
  // HANYA untuk sekolah dipilih (tiada fallback ke semua sekolah).
  var seen={}, list=[];
  var kodUp=String(kodSekolah||'').toUpperCase().trim();
  if(!kodUp) return list;
  (_aP||[]).forEach(function(r){
    if(String(r['Kod Sekolah']||'').toUpperCase().trim()!==kodUp) return;
    var kp=String(r['No KP Peserta']||'').trim();
    var nm=String(r['Nama Peserta']||'').trim();
    var kat=String(r['Kategori Penyertaan']||'').toUpperCase();
    if(!nm||kat==='GURU') return;
    var key=kp||nm;
    if(!seen[key]){seen[key]=1;list.push({nama:nm,kp:kp,jantina:String(r['Jantina Peserta']||'').trim(),bangsa:String(r['Bangsa Peserta']||'').trim()});}
  });
  list.sort(function(a,b){return a.nama.localeCompare(b.nama);});
  return list;
}

// Cache syor guru — elak hantar JSON besar dalam HTML attribute
var _syorGuruCache = {};
var _syorPesCache = {};

function renderMainGuruList(){
  var el=document.getElementById('main-guru-list');
  if(!el)return;
  if(!_penyData.guruList.length){el.innerHTML='<div style="font-size:.72rem;color:var(--g5);padding:.4rem;">Tiada guru ditambah. Klik + TAMBAH GURU.</div>';return;}
  var kodSek=(document.getElementById('daf-kod')||{}).value||'';
  var syorGuru=_getGuruSyorFromAP(kodSek);
  // Simpan dalam cache global — indexed by kp||nama
  _syorGuruCache = {};
  syorGuru.forEach(function(sg){ _syorGuruCache[sg.kp||sg.nama]=sg; });
  el.innerHTML='';
  _penyData.guruList.forEach(function(g,i){
    var div=document.createElement('div');
    div.className='ri'; div.id='row-'+g.id;
    // Tentukan key terpilih berdasarkan kp atau nama guru semasa
    var selKey = g.kp || g.nama || '';
    var syorHtml=syorGuru.length
      ? '<div class="fi full" style="margin-bottom:.1rem;">'
        +'<label>Pilih Guru (rekod lepas)</label>'
        +'<select style="text-transform:none;" onchange="pickGuruFromSyor(\''+g.id+'\',this.value)">'
        +'<option value="">— Isikan dari rekod lepas, atau taip nama di bawah —</option>'
        +syorGuru.map(function(sg){
          var sgKey=sg.kp||sg.nama;
          var isSel=(selKey && sgKey===selKey)?'selected':'';
          return '<option value="'+esc(sgKey)+'" '+isSel+'>'+esc(sg.nama)+(sg.kp?' ('+sg.kp+')':'')+'</option>';
        }).join('')
        +'</select></div>'
      : '';
    div.innerHTML='<div class="rih"><span>\uD83D\uDC68\u200D\uD83C\uDFEB GURU #'+(i+1)+'</span><button class="btn bd bsm" onclick="removeMainGuru(\''+g.id+'\')">PADAM</button></div>'
      +'<div class="fg">'
      +syorHtml
      +'<div class="fi"><label>Nama Guru</label><input type="text" class="gn nc-off" id="gn-'+g.id+'" value="'+esc(g.nama)+'" placeholder="Nama penuh guru" autocomplete="off" oninput="saveGuru(\''+g.id+'\',\'nama\',this.value)" onchange="saveGuru(\''+g.id+'\',\'nama\',this.value)"></div>'
      +'<div class="fi"><label>No. KP</label><input type="text" class="nc" id="gkp-'+g.id+'" value="'+esc(g.kp)+'" placeholder="000000-00-0000" maxlength="14" inputmode="numeric" autocomplete="off" oninput="fmtKP(this);saveGuru(\''+g.id+'\',\'kp\',this.value)" onchange="saveGuru(\''+g.id+'\',\'kp\',this.value)"></div>'
      +'<div class="fi"><label>Bangsa</label><select id="gbg-'+g.id+'" onchange="saveGuru(\''+g.id+'\',\'bangsa\',this.value)">'+bangOpt(g.bangsa)+'</select></div>'
      +'<div class="fi"><label>Jantina</label><select id="gjn-'+g.id+'" onchange="saveGuru(\''+g.id+'\',\'jantina\',this.value)">'+janOpt(g.jantina)+'</select></div>'
      +'<div class="fi"><label>No. Tel</label><div style="display:flex;align-items:center;background:var(--g1);border:1.5px solid var(--bd);border-radius:var(--r);overflow:hidden;"><span style="padding:0 .5rem;font-size:.78rem;font-weight:700;color:var(--g5);border-right:1.5px solid var(--bd);white-space:nowrap;line-height:2.2rem;">+60</span><input type="tel" id="gtel-'+g.id+'" class="nc" style="border:none;border-radius:0;background:transparent;flex:1;min-width:0;" value="'+esc(normTel(g.tel))+'" placeholder="1X-XXXXXXXX" maxlength="11" inputmode="numeric" oninput="fmtTel(this)" onchange="saveGuru(\''+g.id+'\',\'tel\',\'+60\'+this.value.replace(/\\D/g,\'\'))"></div></div>'
      +'</div>';
    el.appendChild(div);
  });
}

function pickGuruFromSyor(gid, key){
  if(!key) return;
  var found=_syorGuruCache[key];
  if(!found) return;
  var g=_penyData.guruList.find(function(x){return x.id===gid;});
  if(!g) return;
  g.nama=found.nama; g.kp=found.kp; g.bangsa=found.bangsa; g.jantina=found.jantina; g.tel=found.tel;
  renderMainGuruList();
}


// == FORMAT NO TELEFON ========================================================
// Helper: pastikan nombor telefon dipaparkan dengan +60 (untuk Excel, cetak, paparan)
function _fmtTel60(v){
  if(!v) return '—';
  var s = String(v).trim().replace(/\s/g,'');
  if(!s || s === '—') return '—';
  // Jika sudah ada +60 atau +6, kekalkan
  if(s.startsWith('+60')) return s;
  if(s.startsWith('+6')) return '+60' + s.slice(2);
  // Jika bermula 60X (tanpa +)
  if(/^60[1-9]/.test(s)) return '+' + s;
  // Jika bermula 0 (format tempatan lama)
  if(s.startsWith('0')) return '+6' + s;
  // Angka sahaja tanpa prefix
  return '+60' + s.replace(/\D/g,'');
}

// Input hanya bahagian selepas +60 (tanpa 0 pertama)
// Simpan sebagai +601X-XXXXXXX atau +601X-XXXX-XXXX
function fmtTel(inp){
  var digits = inp.value.replace(/\D/g,'');
  if(digits.length > 11) digits = digits.slice(0,11);
  inp.value = digits;
}

// Normalize tel untuk papar dalam input (buang +60 prefix, kekalkan baki)
function normTel(v){
  if(!v) return '';
  var s = String(v).replace(/\s/g,'');
  // Buang +60 atau 60 di hadapan
  if(s.startsWith('+60')) s = s.slice(3);
  else if(s.startsWith('60')) s = s.slice(2);
  // Buang 0 pertama jika ada (cth: 0123 → 123)
  if(s.startsWith('0')) s = s.slice(1);
  return s.replace(/\D/g,'');
}

// == FORMAT NO KP =============================================================
// Auto-format: xxxxxx-xx-xxxx | kekalkan format asal | 12 digit sahaja
function fmtKP(inp){
  // Simpan kedudukan kursor
  var pos = inp.selectionStart;
  var raw = inp.value;
  // Buang semua bukan digit
  var digits = raw.replace(/\D/g,'');
  // Had 12 digit
  if(digits.length > 12) digits = digits.slice(0,12);
  // Format semula: xxxxxx-xx-xxxx
  var fmt = '';
  if(digits.length <= 6)       fmt = digits;
  else if(digits.length <= 8)  fmt = digits.slice(0,6)+'-'+digits.slice(6);
  else                         fmt = digits.slice(0,6)+'-'+digits.slice(6,8)+'-'+digits.slice(8);
  // Kira kedudukan kursor baharu
  var dashsBefore = (raw.slice(0,pos).match(/-/g)||[]).length;
  var dashsAfter  = (fmt.slice(0,pos).match(/-/g)||[]).length;
  inp.value = fmt;
  var newPos = Math.min(pos + (dashsAfter - dashsBefore), fmt.length);
  try{ inp.setSelectionRange(newPos, newPos); }catch(e){}
}

// Normalisasi KP untuk simpan: kekalkan format xxxxxx-xx-xxxx
function normKP(v){
  if(!v) return '';
  var digits = String(v).replace(/\D/g,'');
  if(digits.length !== 12) return String(v); // kekalkan as-is jika tidak 12 digit
  return digits.slice(0,6)+'-'+digits.slice(6,8)+'-'+digits.slice(8);
}

function saveGuru(id,field,val){
  var g=_penyData.guruList.find(function(x){return x.id===id;});
  if(!g)return;
  if(field==='kp') g[field]=normKP(val);
  else if(field==='tel') g[field]=val?(val.startsWith('+60')?val:'+60'+val.replace(/\D/g,'')):'';
  else if(field==='nama') g[field]=(val||'').toUpperCase();
  else g[field]=val;
}

function addMainPes(){
  _pPCnt++;
  var id='mp-'+_pPCnt;
  var p={id:id,nama:'',kp:'',jantina:'',bangsa:'',kategori:[]};
  _penyData.pesList.push(p);
  renderMainPesList();
}

// Auto-assign kategori berdasarkan jantina peserta dan kategori program
function _autoAssignKatByJantina(pesId, jantina){
  var p=_penyData.pesList.find(function(x){return x.id===pesId;});
  if(!p) return;
  var jan=(jantina||'').toUpperCase();
  if(!jan) return;
  // Kategori program yang sesuai dengan jantina
  var katTunjuk=_selKatList.filter(function(k){return k!=='KESELURUHAN';});
  var matched=katTunjuk.filter(function(k){
    if(k==='TERBUKA INDIVIDU'||k==='TERBUKA BERKUMPULAN'||k==='TERBUKA') return false;
    if(k.indexOf('LELAKI')>=0) return jan==='LELAKI';
    if(k.indexOf('PEREMPUAN')>=0) return jan==='PEREMPUAN';
    return false;
  });
  // Hanya assign jika ada padanan dan tiada kategori dipilih lagi
  if(matched.length && !p.kategori.length){
    p.kategori=matched.slice();
    renderMainPesList();
  }
}

function removeMainPes(id){
  _penyData.pesList=_penyData.pesList.filter(function(p){return p.id!==id;});
  renderMainPesList();
}

