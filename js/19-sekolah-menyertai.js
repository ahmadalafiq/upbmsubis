// == SEKOLAH MENYERTAI PROGRAM (projek 16) =====================================
// (1) Widget "Sekolah yang menyertai": Daftar Program (prefix 'p') & Edit Program (prefix 'e').
//     Tick = JEMPUTAN sahaja; sekolah lain masih boleh mendaftar sendiri. Sekolah pengelola TIDAK ditick automatik.
// (2) Modal amaran selepas login (guru & PKK): program ditugaskan belum dihantar + data penyertaan tidak lengkap.
// (3) _pcTicked: senarai sekolah ditick yang dibaca oleh renderPcForm (pencapaian).
// Backend: jadual program_sekolah + RPC tetapkan_sekolah_program / senarai_sekolah_program / semakan_selepas_login.

var _pcTicked = [];                 // [{kod_sekolah,nama_sekolah,ada_penyertaan}] bagi program yang sedang diedit
var _psSel = {p:{}, e:{}};          // kod -> true
var _psMode = {p:'KEMUDIAN'};       // Daftar Program: 'KEMUDIAN' | 'PILIH'
var _psEdit = {loaded:false, progId:'', asal:''};

function _psBox(pre){ return document.getElementById(pre+'-sek-box'); }
function _psSenarai(){
  return (typeof _SEKOLAH_STATIK!=='undefined'?_SEKOLAH_STATIK:[]).filter(function(s){return s&&s.kod&&s.nama;})
    .slice().sort(function(a,b){return String(a.nama).localeCompare(String(b.nama));});
}
function psMod(pre){ return pre==='p' ? (_psMode.p||'KEMUDIAN') : 'PILIH'; }
function psGet(pre){
  if(pre==='p' && _psMode.p!=='PILIH') return [];
  return Object.keys(_psSel[pre]||{}).sort();
}
function psReset(pre){
  _psSel[pre]={};
  if(pre==='p') _psMode.p='KEMUDIAN';
  psRender(pre);
}
function _psKemasBil(pre){
  var el=document.getElementById(pre+'-sek-bil');
  if(el) el.textContent=Object.keys(_psSel[pre]||{}).length+' sekolah dipilih';
}
function psRender(pre){
  var box=_psBox(pre); if(!box) return;
  var h='<label>🏫 Sekolah yang menyertai</label>';
  if(pre==='p'){
    h+='<div style="display:flex;flex-direction:column;gap:.3rem;margin:.2rem 0 .5rem;">'
      +'<label class="kat-chk"><input type="radio" name="p-sek-mod" value="KEMUDIAN"'+(_psMode.p!=='PILIH'?' checked':'')+' onchange="psSetMod(\'p\',this.value)"> Sekolah mendaftar sendiri kemudian</label>'
      +'<label class="kat-chk"><input type="radio" name="p-sek-mod" value="PILIH"'+(_psMode.p==='PILIH'?' checked':'')+' onchange="psSetMod(\'p\',this.value)"> Saya pilih sekolah sekarang</label>'
      +'</div>';
  } else {
    h+='<div style="font-size:.66rem;color:var(--g6);margin-bottom:.4rem;">Tanda sekolah yang dijemput menyertai program ini. Biarkan kosong jika sekolah mendaftar sendiri. Sekolah yang tidak ditanda masih boleh mendaftar sendiri.</div>';
  }
  var tunjuk=(pre==='e')||_psMode.p==='PILIH';
  h+='<div id="'+pre+'-sek-panel" style="display:'+(tunjuk?'block':'none')+';">';
  if(tunjuk){
    h+='<input type="text" id="'+pre+'-sek-cari" placeholder="Cari sekolah..." oninput="psCari(\''+pre+'\',this.value)" style="width:100%;margin-bottom:.4rem;">'
      +'<div style="display:flex;flex-wrap:wrap;gap:.3rem;margin-bottom:.4rem;">'
      +'<button type="button" class="btn bs bsm" onclick="psKumpulan(\''+pre+'\',\'SR\')">SEMUA SR</button>'
      +'<button type="button" class="btn bs bsm" onclick="psKumpulan(\''+pre+'\',\'SM\')">SEMUA SM</button>'
      +'<button type="button" class="btn bs bsm" onclick="psKumpulan(\''+pre+'\',\'SEMUA\')">SEMUA</button>'
      +'<button type="button" class="btn bs bsm" onclick="psKumpulan(\''+pre+'\',\'KOSONG\')">KOSONGKAN</button>'
      +'<span id="'+pre+'-sek-bil" style="font-size:.68rem;font-weight:800;color:var(--g6);align-self:center;margin-left:.3rem;"></span></div>'
      +'<div id="'+pre+'-sek-chk" style="max-height:220px;overflow-y:auto;border:1px solid var(--g2);border-radius:var(--r);padding:.35rem .5rem;display:flex;flex-direction:column;gap:.15rem;">';
    _psSenarai().forEach(function(s){
      var jenis=(typeof _jenisSekolah==='function')?_jenisSekolah(s.nama):'SR';
      h+='<label class="kat-chk" data-q="'+esc(String(s.nama).toLowerCase()+' '+String(s.kod).toLowerCase())+'" data-j="'+jenis+'" style="margin:0;">'
        +'<input type="checkbox" value="'+esc(s.kod)+'"'+(_psSel[pre][s.kod]?' checked':'')+' onchange="psToggle(\''+pre+'\',this)"> '
        +esc(s.nama)+' <span style="opacity:.55;font-size:.62rem;">'+jenis+'</span></label>';
    });
    h+='</div>';
  }
  h+='</div>';
  box.innerHTML=h;
  _psKemasBil(pre);
}
function psSetMod(pre,v){
  if(pre!=='p') return;
  _psMode.p=(v==='PILIH')?'PILIH':'KEMUDIAN';
  psRender('p');
}
function psToggle(pre,cb){
  if(cb.checked) _psSel[pre][cb.value]=true; else delete _psSel[pre][cb.value];
  _psKemasBil(pre);
}
function psCari(pre,q){
  q=String(q||'').toLowerCase().trim();
  var box=document.getElementById(pre+'-sek-chk'); if(!box) return;
  Array.prototype.forEach.call(box.querySelectorAll('label[data-q]'),function(l){
    l.style.display=(!q||l.getAttribute('data-q').indexOf(q)>=0)?'':'none';
  });
}
function psKumpulan(pre,g){
  var sel={};
  if(g!=='KOSONG'){
    _psSenarai().forEach(function(s){
      var j=(typeof _jenisSekolah==='function')?_jenisSekolah(s.nama):'SR';
      if(g==='SEMUA'||g===j) sel[s.kod]=true;
    });
    // kekalkan pilihan sedia ada bagi kumpulan lain
    Object.keys(_psSel[pre]||{}).forEach(function(k){ sel[k]=true; });
  }
  _psSel[pre]=sel;
  psRender(pre);
}

// -- Edit Program: muat & simpan senarai sekolah ditick --
async function psMuatEdit(progId){
  _psSel.e={}; _psEdit={loaded:false,progId:progId,asal:''}; _pcTicked=[];
  var box=_psBox('e');
  if(box) box.innerHTML='<label>🏫 Sekolah yang menyertai</label><div style="font-size:.72rem;color:var(--g6);">Memuatkan...</div>';
  try{
    var r=await run('getSekolahProgramGS',progId);
    var d=(r&&r.data)||[];
    _pcTicked=d;
    d.forEach(function(x){ if(x.kod_sekolah) _psSel.e[x.kod_sekolah]=true; });
    _psEdit.loaded=true; _psEdit.asal=Object.keys(_psSel.e).sort().join(',');
    psRender('e');
  }catch(e){
    if(box) box.innerHTML='<label>🏫 Sekolah yang menyertai</label><div class="iwarn" style="font-size:.7rem;">Senarai sekolah tidak dapat dimuatkan ('+esc(String(e&&e.message||e))+'). Hanya Pengelola program atau Admin boleh menetapkan sekolah.</div>';
  }
}
// Pulang null jika tiada perubahan / tidak dimuatkan (elak padam senarai tanpa sengaja)
async function psSimpanEdit(progId){
  if(!_psEdit.loaded || _psEdit.progId!==progId) return null;
  var kini=psGet('e'), kiniStr=kini.join(',');
  if(kiniStr===_psEdit.asal) return null;
  var r=await run('tetapkanSekolahProgramGS',{programId:progId,kodSekolah:kini});
  _psEdit.asal=kiniStr;
  var nm={}; (typeof _SEKOLAH_STATIK!=='undefined'?_SEKOLAH_STATIK:[]).forEach(function(s){nm[s.kod]=s.nama;});
  var ada={}; (typeof _curPny!=='undefined'&&_curPny?_curPny:[]).forEach(function(p){ if(p['Kod Sekolah']) ada[String(p['Kod Sekolah']).toUpperCase()]=true; });
  _pcTicked=kini.map(function(k){return {kod_sekolah:k,nama_sekolah:nm[k]||k,ada_penyertaan:!!ada[String(k).toUpperCase()]};});
  toast('Sekolah menyertai dikemaskini ('+kini.length+'). Sekolah baharu muncul dalam Pencapaian apabila modal dibuka semula.','ok');
  return r;
}

// == BUTANG "DATA" (lihatPeny): sekolah ditick yang belum mendaftar penyertaan ==
// Pulang elemen DOM; dipanggil dari lihatPeny() dengan senarai {kod_sekolah,nama_sekolah,ada_penyertaan:false}
function psBlokBelumDaftar(arr,pid){
  var own=String((typeof _sesi!=='undefined'&&_sesi&&_sesi.kodSekolah)||'').toUpperCase().trim();
  var box=document.createElement('div');
  box.style.cssText='margin-top:.8rem;border:1.5px solid #f5d98b;background:#fffdf3;border-radius:var(--r);padding:.55rem .7rem;';
  var h='<div style="font-size:.66rem;font-weight:800;color:#8a5a00;text-transform:uppercase;margin-bottom:.35rem;">⚠ Ditick, belum daftar penyertaan ('+arr.length+')</div>';
  arr.forEach(function(t){
    h+='<div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;padding:.28rem 0;border-top:1px solid #f5e6b3;">'
      +'<div style="flex:1;min-width:160px;font-size:.74rem;font-weight:700;color:var(--g8);">🏫 '+esc(t.nama_sekolah||t.kod_sekolah)
      +' <span style="font-size:.62rem;font-weight:600;color:var(--g6);">Kod: '+esc(t.kod_sekolah||'—')+'</span></div>'
      +'<span style="background:#fff3cd;color:#7a5b00;border-radius:20px;padding:.1rem .5rem;font-size:.62rem;font-weight:700;">Perlu daftar penyertaan</span>'
      +((own&&pid&&String(t.kod_sekolah||'').toUpperCase().trim()===own)
        ?'<button type="button" class="btn bp bsm" data-pid="'+esc(pid)+'" onclick="closeMo(\'mo-lihat\');_tgBuka(this.getAttribute(\'data-pid\'))">DAFTAR PENYERTAAN →</button>':'')
      +'</div>';
  });
  box.innerHTML=h;
  return box;
}

// == MODAL AMARAN SELEPAS LOGIN ================================================
var _tgData = null;
var _TG_ISU = {
  guru_kp:'Guru: No. KP tidak lengkap', guru_jantina:'Guru: jantina kosong', guru_bangsa:'Guru: bangsa kosong',
  guru_tel:'Guru: No. Telefon tidak lengkap', peserta_kp:'Peserta: No. KP tidak lengkap',
  peserta_jantina:'Peserta: jantina kosong', peserta_bangsa:'Peserta: bangsa kosong'
};
function _tgIsuHtml(isu){
  var c=[];
  if(isu.tiada_guru) c.push('Tiada guru pengiring');
  if(isu.tiada_peserta) c.push('Tiada peserta');
  Object.keys(_TG_ISU).forEach(function(k){ if(isu[k]>0) c.push(_TG_ISU[k]+' ('+isu[k]+')'); });
  return c.map(function(t){
    return '<span style="display:inline-block;background:#fff3cd;color:#7a5b00;border-radius:20px;padding:.1rem .5rem;font-size:.62rem;font-weight:700;margin:.1rem .2rem .1rem 0;">'+esc(t)+'</span>';
  }).join('');
}
function _tgRender(d){
  var tg=d.tugasan||[], tl=d.tidak_lengkap||[], h='';
  if(d.nama_sekolah) h+='<div style="font-size:.74rem;color:var(--g6);margin-bottom:.7rem;">🏫 '+esc(d.nama_sekolah)+'</div>';
  if(tg.length){
    h+='<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:var(--red);margin-bottom:.4rem;">📌 PROGRAM YANG SEKOLAH ANDA DITUGASKAN ('+tg.length+')</div>';
    tg.forEach(function(p){
      var tarikh=p.tarikh?(typeof fd==='function'?fd(p.tarikh):esc(String(p.tarikh))):'';
      h+='<div style="border:1.5px solid rgba(192,57,43,.25);border-radius:var(--r);padding:.6rem .75rem;margin-bottom:.5rem;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;">'
        +'<div style="flex:1;min-width:200px;"><div style="font-weight:800;font-size:.8rem;">'+esc(p.nama_program)+'</div>'
        +'<div style="font-size:.66rem;color:var(--g6);margin-top:.15rem;">'+[p.pengelola,p.bidang,tarikh,p.tempat].filter(Boolean).map(function(x){return esc(String(x));}).join(' • ')+'</div></div>'
        +'<button type="button" class="btn bp bsm" data-pid="'+esc(p.program_id)+'" onclick="_tgBuka(this.getAttribute(\'data-pid\'))">LENGKAPKAN →</button></div>';
    });
  }
  if(tl.length){
    h+='<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:#8a5a00;margin:.8rem 0 .4rem;">⚠ DATA PENYERTAAN TIDAK LENGKAP ('+tl.length+' program)</div>';
    tl.forEach(function(p){
      h+='<div style="border:1.5px solid #f5d98b;background:#fffdf3;border-radius:var(--r);padding:.6rem .75rem;margin-bottom:.5rem;display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;">'
        +'<div style="flex:1;min-width:200px;"><div style="font-weight:800;font-size:.8rem;">'+esc(p.nama_program)+'</div>'
        +'<div style="margin-top:.2rem;">'+_tgIsuHtml(p.isu||{})+'</div>'
        +(p.tel_format>0?'<div style="font-size:.62rem;color:var(--g6);margin-top:.15rem;">'+p.tel_format+' nombor telefon akan diseragamkan automatik apabila anda simpan.</div>':'')+'</div>'
        +'<button type="button" class="btn bp bsm" data-pid="'+esc(p.program_id)+'" onclick="_tgBuka(this.getAttribute(\'data-pid\'))">BETULKAN →</button></div>';
    });
  }
  document.getElementById('tg-body').innerHTML=h;
}
async function semakTugasanSelepasLogin(percubaan){
  if(!_sesi || !_sesi.token) return;
  if(_sesi.role!=='guru' && _sesi.role!=='pkk') return;
  var key='upbm_tugasan_'+String(_sesi.token).slice(-12);
  try{ if(sessionStorage.getItem(key)) return; }catch(e){}
  // Jangan bertindih dengan modal lain yang sedang dibuka (cth. profil/claim) — cuba semula sebentar lagi
  if(typeof _moOpenCount!=='undefined' && _moOpenCount>0){
    if((percubaan||0)<3) setTimeout(function(){ semakTugasanSelepasLogin((percubaan||0)+1); }, 4000);
    return;
  }
  try{
    var r=await run('semakanSelepasLoginGS',{});
    try{ sessionStorage.setItem(key,'1'); }catch(e){}
    if(!(r&&r.ok&&r.data)) return;
    var d=r.data;
    if(!(d.tugasan&&d.tugasan.length) && !(d.tidak_lengkap&&d.tidak_lengkap.length)) return;
    _tgData=d; _tgRender(d); openMo('mo-tugasan');
  }catch(e){ console.warn('semakTugasanSelepasLogin gagal (diabaikan):', e&&e.message); }
}
// Buka borang penyertaan (program + sekolah sendiri sudah dipilih; data sedia ada dipra-isi oleh aliran sedia ada)
async function _tgBuka(pid){
  closeMo('mo-tugasan');
  // Modal DAFTAR PENYERTAAN dibuka di atas halaman semasa (tiada tukar halaman)
  penyModalMuat('Membuka borang penyertaan...', false);
  try{
    await new Promise(function(resolve){ loadProgsForPeny(false, resolve); });
    var prog=(_progForPny||[]).find(function(p){return p['ID']===pid;});
    if(!prog){ penyModalTutup(true); toast('Program tidak ditemui dalam senarai penyertaan. Sila pilih program secara manual.','er'); return; }
    var card=null;
    Array.prototype.forEach.call(document.querySelectorAll('.psc'),function(c){ if(c.getAttribute('data-pid')===pid) card=c; });
    pilihProg(prog['ID'],prog['Nama Program'],card);
  }catch(e){ penyModalTutup(true); toast('Ralat membuka borang: '+(e&&e.message||e),'er'); }
}
// Pemula: bina widget Daftar Program (senarai sekolah dibina bila mod "pilih" dipilih)
psRender('p');
