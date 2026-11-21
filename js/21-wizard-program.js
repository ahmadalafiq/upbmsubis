// == WIZARD DAFTAR PROGRAM (W1) — dalam MODAL ===================================
// Klik "+ DAFTAR PROGRAM" -> modal #mo-daftar-prog (wizard 6 langkah). Lapisan PAPARAN sahaja: semua ID elemen & fungsi sedia ada kekal.
// Ketahanan tamat masa:
//  (a) Draf auto-simpan ke sessionStorage (upbm_prog_draft) — kekal selepas log keluar idle, dipulihkan bila modal dibuka semula.
//  (b) Had idle dipanjangkan (15 min) semasa modal terbuka (lihat js/16).
//  (c) ID program stabil (wzId) -> "cuba lagi" selamat: jika permintaan sebelum itu sebenarnya berjaya, ralat "duplicate" dianggap berjaya.
//  (d) Mesej ralat dalam modal (sesi tamat / rangkaian) — borang & draf TIDAK dikosongkan.
var _WZ_LANGKAH = ['Asas','Penganjur','Sekolah','Kategori','Jadual','Semak'];
var _wz = {on:true, step:1, inited:false, id:'', timer:null, owner:''};
var _WZ_PREF = 'upbm_wz_program', _WZ_DRAF = 'upbm_prog_draft', _WZ_DRAF_TTL = 24*60*60*1000;
var _WZ_MEDAN = ['p-nama','p-bidang','p-per','p-pengelola','p-kod','p-tarikh','p-tempat','p-status'];

function _wzEl(id){ return document.getElementById(id); }
function _wzFi(id){ var e=_wzEl(id); return e ? (e.closest('.fi')||e) : null; }
function _wzV(id){ var e=_wzEl(id); return e?String(e.value||'').trim():''; }
function wzProgAktif(){ var m=_wzEl('mo-daftar-prog'); return !!(m&&m.classList.contains('on')); }
function wzId(){
  if(!_wz.id){ _wz.id=(typeof crypto!=='undefined'&&crypto.randomUUID)?crypto.randomUUID():(Date.now()+'-'+Math.random().toString(36).slice(2)); }
  return _wz.id;
}

// -- Paparan langkah --------------------------------------------------------
function _wzKumpulan(){
  return {
    1:[_wzFi('p-nama'),_wzFi('p-bidang'),_wzFi('p-per')],
    2:[_wzFi('p-agensi'),_wzFi('p-pengelola'),_wzFi('p-kod')],
    3:[_wzEl('p-sek-box')],
    4:[_wzFi('p-kat-wrap'),_wzFi('p-sasaran'),_wzFi('p-luar')],
    5:[_wzFi('p-tarikh'),_wzFi('p-tempat'),_wzFi('p-status')]
  };
}
function _wzPapar(){
  var k=_wzKumpulan();
  for(var n=1;n<=5;n++){ (k[n]||[]).forEach(function(el){ if(el) el.classList.toggle('wz-hide', _wz.on && _wz.step!==n); }); }
  var nav=_wzEl('wz-nav'), bar=_wzEl('wz-bar'), rk=_wzEl('wz-ringkas'), btn=_wzEl('btn-daftar'), alt=_wzEl('wz-alt');
  var rowBtn=btn?btn.parentNode:null;
  if(bar) bar.style.display=_wz.on?'block':'none';
  if(nav) nav.style.display=_wz.on?'flex':'none';
  if(rowBtn) rowBtn.style.display=(!_wz.on||_wz.step===6)?'':'none';
  if(rk) rk.style.display=(_wz.on&&_wz.step===6)?'block':'none';
  if(alt) alt.textContent=_wz.on?'Guna borang biasa':'Guna panduan langkah demi langkah';
  if(_wz.on){
    var h='<div style="display:flex;gap:.3rem;margin-bottom:.35rem;">';
    for(var i=1;i<=6;i++){
      var balik=(i<_wz.step);
      h+='<div'+(balik?' role="button" tabindex="0" onclick="wzKe('+i+')" title="Kembali ke langkah '+i+' — '+_WZ_LANGKAH[i-1]+'" aria-label="Kembali ke langkah '+i+'"':' aria-hidden="true"')
        +' style="flex:1;height:'+(balik?'8px':'5px')+';border-radius:4px;background:'+(i<=_wz.step?'var(--red)':'var(--g2)')+';'+(balik?'cursor:pointer;':'')+'"></div>';
    }
    h+='</div><div style="font-size:.72rem;font-weight:800;color:var(--g8);">Langkah '+_wz.step+' / 6 — '+_WZ_LANGKAH[_wz.step-1].toUpperCase()+'</div>';
    if(bar) bar.innerHTML=h;
    var b=_wzEl('wz-back'), nx=_wzEl('wz-next');
    if(b) b.style.visibility=_wz.step>1?'visible':'hidden';
    if(nx) nx.style.display=_wz.step<6?'':'none';
    if(_wz.step===6) _wzRingkas();
  }
}
function _wzSemak(n){
  if(n===1){ if(!_wzV('p-nama')||!_wzV('p-bidang')||!_wzV('p-per')) return 'Sila isi Nama Program, Bidang dan Peringkat.'; }
  if(n===2){ if(!_wzV('p-pengelola')) return (typeof agIsOn==='function'&&agIsOn('p'))?'Sila taip nama agensi luar.':'Sila isi Unit / Nama pengelola.';
             if(!_wzV('p-kod')) return 'Sila isi Kod Sekolah Penganjur.'; }
  if(n===3){ if(typeof psMod==='function'&&psMod('p')==='PILIH'&&typeof psGet==='function'&&psGet('p').length===0) return "Pilih sekurang-kurangnya 1 sekolah, atau pilih 'Sekolah mendaftar sendiri kemudian'."; }
  if(n===4){ if(typeof getKatChecked==='function'&&!getKatChecked('p-kat-wrap').length) return 'Sila pilih sekurang-kurangnya 1 kategori.';
             if(typeof sasGet==='function'&&!sasGet('p')) return 'Pilih sekurang-kurangnya satu sasaran sekolah (SR / SM).'; }
  if(n===5){ if(!_wzV('p-tarikh')||!_wzV('p-tempat')) return 'Sila isi Tarikh dan Tempat.'; }
  return '';
}
function _wzRingkas(){
  var rk=_wzEl('wz-ringkas'); if(!rk) return;
  var ag=(typeof agIsOn==='function'&&agIsOn('p'));
  var sek=(typeof psMod==='function'&&psMod('p')==='PILIH')?(psGet('p').length+' sekolah dijemput'):'Sekolah mendaftar sendiri kemudian';
  var kat=(typeof getKatChecked==='function'?getKatChecked('p-kat-wrap'):[]).join(', ')||'—';
  var tar=_wzV('p-tarikh'); try{ if(tar&&typeof fd==='function') tar=fd(tar); }catch(e){}
  var luar=!!(_wzEl('p-luar')&&_wzEl('p-luar').checked);
  var rows=[
    [1,'Nama Program',_wzV('p-nama')],[1,'Bidang',_wzV('p-bidang')],[1,'Peringkat',_wzV('p-per')],
    [2,'Penganjur',_wzV('p-pengelola')+(ag?' (Agensi luar)':'')+' — '+_wzV('p-kod')],
    [3,'Sekolah menyertai',sek],[4,'Kategori',kat],[4,'Sasaran sekolah',(typeof sasTeks==='function'&&typeof sasGet==='function')?sasTeks(sasGet('p')):'—'],[4,'Aktiviti luar',luar?'Ya':'Tidak'],
    [5,'Tarikh',tar],[5,'Tempat',_wzV('p-tempat')],[5,'Status',_wzV('p-status')]
  ];
  var h='<div style="border:1.5px solid var(--g2);border-radius:var(--r);padding:.5rem .75rem;margin-top:.4rem;">'
       +'<div style="font-size:.66rem;font-weight:800;color:var(--g6);text-transform:uppercase;margin-bottom:.3rem;">Semak sebelum daftar</div>';
  rows.forEach(function(r){
    h+='<div style="display:flex;gap:.5rem;align-items:baseline;padding:.2rem 0;border-top:1px solid var(--g1);font-size:.74rem;">'
      +'<div style="width:130px;flex-shrink:0;color:var(--g6);font-weight:700;">'+esc(r[1])+'</div>'
      +'<div style="flex:1;font-weight:700;color:var(--g8);word-break:break-word;">'+esc(r[2]||'—')+'</div>'
      +'<a href="#" style="font-size:.62rem;font-weight:800;color:var(--red);text-decoration:none;" onclick="wzKe('+r[0]+');return false;">UBAH</a></div>';
  });
  rk.innerHTML=h+'</div>';
}
function wzKe(n){ _wz.step=Math.max(1,Math.min(6,n)); _wzPapar(); _wzScroll(); wzSimpanDraf(true); }
function _wzScroll(){ var b=_wzEl('wz-body'); if(b) b.scrollTop=0; }
// Medan wajib yang kosong bagi langkah n (untuk penanda inline)
function _wzIdSalah(n){
  var ids=[];
  var map={1:['p-nama','p-bidang','p-per'],2:['p-pengelola','p-kod'],5:['p-tarikh','p-tempat']};
  (map[n]||[]).forEach(function(id){ if(!_wzV(id)) ids.push(id); });
  if(n===4 && typeof getKatChecked==='function' && !getKatChecked('p-kat-wrap').length) ids.push('p-kat-wrap');
  if(n===4 && typeof sasGet==='function' && !sasGet('p')) ids.push('p-sasaran');
  if(n===3 && ids.length===0 && typeof psMod==='function' && psMod('p')==='PILIH' && psGet('p').length===0) ids.push('p-sek-box');
  return ids;
}
function _wzTandaSalah(ids){
  var first=null;
  ids.forEach(function(id){
    var e=_wzEl(id); if(!e) return;
    var t=(e.tagName==='INPUT'||e.tagName==='SELECT'||e.tagName==='TEXTAREA')?e:e;
    t.classList.add('inp-err'); if(!first) first=e;
    var off=function(){ t.classList.remove('inp-err'); t.removeEventListener('input',off); t.removeEventListener('change',off); };
    t.addEventListener('input',off); t.addEventListener('change',off);
  });
  if(first){ try{ (first.focus&&first.tagName!=='DIV')?first.focus():first.scrollIntoView({block:'center'}); }catch(e){} }
}
function wzNext(){
  wzMsgBuang();
  var m=_wzSemak(_wz.step);
  if(m){ _wzTandaSalah(_wzIdSalah(_wz.step)); if(typeof toast==='function') toast(m,'er'); return; }
  if(_wz.step<6) wzKe(_wz.step+1);
}
function wzBack(){ wzMsgBuang(); if(_wz.step>1) wzKe(_wz.step-1); }
function wzToggle(on){
  _wz.on=(typeof on==='boolean')?on:!_wz.on;
  try{ localStorage.setItem(_WZ_PREF,_wz.on?'on':'off'); }catch(e){}
  if(_wz.on) _wz.step=1;
  _wzPapar();
}

// -- Mesej ralat dalam modal -------------------------------------------------
function wzMsg(t){ var e=_wzEl('wz-err'); if(!e) return; e.textContent='⚠ '+t; e.style.display='block'; }
function wzMsgBuang(){ var e=_wzEl('wz-err'); if(e) e.style.display='none'; }

// -- Draf (sessionStorage) ----------------------------------------------------
function _wzKosong(){
  return !_WZ_MEDAN.some(function(id){ var v=_wzV(id); return v && !(id==='p-status'&&v==='AKTIF'); });
}
function wzSimpanDraf(segera){
  if(!segera){ clearTimeout(_wz.timer); _wz.timer=setTimeout(function(){ wzSimpanDraf(true); },500); return; }
  clearTimeout(_wz.timer);
  try{
    if(!_sesi || _wzKosong()){ sessionStorage.removeItem(_WZ_DRAF); wzHintDraf(); return; }
    var f={}; _WZ_MEDAN.forEach(function(id){ f[id]=_wzV(id); });
    var kat=[]; Array.prototype.forEach.call(document.querySelectorAll('#p-kat-wrap input[type=checkbox]'),function(c){ if(c.checked) kat.push(c.value); });
    var d={v:1,kp:_sesi.noKP||'',id:wzId(),step:_wz.step,f:f,ag:(typeof agIsOn==='function'&&agIsOn('p')),
           luar:!!(_wzEl('p-luar')&&_wzEl('p-luar').checked),kat:kat,sas:(typeof sasGet==='function')?sasGet('p'):'SR,SM',
           mod:(typeof psMod==='function'?psMod('p'):'KEMUDIAN'),sek:(typeof psGet==='function'?Object.keys(_psSel.p||{}):[]),t:Date.now()};
    sessionStorage.setItem(_WZ_DRAF,JSON.stringify(d));
    wzHintDraf();
  }catch(e){}
}
function _wzBacaDraf(){
  try{
    var s=sessionStorage.getItem(_WZ_DRAF); if(!s) return null;
    var d=JSON.parse(s);
    if(!d||d.v!==1||!_sesi||d.kp!==(_sesi.noKP||'')||(Date.now()-d.t)>_WZ_DRAF_TTL){ sessionStorage.removeItem(_WZ_DRAF); return null; }
    return d;
  }catch(e){ return null; }
}
function wzPadamDraf(){ try{ sessionStorage.removeItem(_WZ_DRAF); }catch(e){} wzHintDraf(); }
function wzHintDraf(){
  var h=_wzEl('wz-hint'); if(!h) return;
  var d=_wzBacaDraf();
  if(d){ h.textContent='📝 Draf belum selesai ('+(d.f['p-nama']||'tanpa nama')+') — klik DAFTAR PROGRAM untuk sambung.'; h.style.display='block'; }
  else h.style.display='none';
}
function wzPulihDraf(d){
  _wz.id=d.id||'';
  _WZ_MEDAN.forEach(function(id){ var e=_wzEl(id); if(e) e.value=d.f[id]||''; });
  var cbAg=_wzEl('p-agensi'); if(cbAg){ cbAg.checked=!!d.ag; if(typeof agToggle==='function') agToggle('p');
    // agToggle mungkin mengosongkan nama/kod — tetapkan semula nilai draf
    _wzEl('p-pengelola').value=d.f['p-pengelola']||''; _wzEl('p-kod').value=d.f['p-kod']||''; }
  Array.prototype.forEach.call(document.querySelectorAll('#p-kat-wrap input[type=checkbox]'),function(c){ c.checked=(d.kat||[]).indexOf(c.value)>=0; });
  var l=_wzEl('p-luar'); if(l) l.checked=!!d.luar;
  if(typeof sasSet==='function') sasSet('p',d.sas||'SR,SM');
  _psSel.p={}; (d.sek||[]).forEach(function(k){ _psSel.p[k]=true; }); _psMode.p=(d.mod==='PILIH')?'PILIH':'KEMUDIAN'; psRender('p');
  _wz.step=Math.max(1,Math.min(6,d.step||1));
}

// -- Buka / tutup modal -------------------------------------------------------
function bukaDaftarProgram(){
  if(_sesi&&_sesi.role==='guru'){ toast('Guru tidak dibenarkan mendaftar program.','er'); return; }
  wzMsgBuang();
  // Pengguna berbeza pada tab yang sama: jangan bocorkan data borang pengguna terdahulu
  var kpIni=(_sesi&&_sesi.noKP)||'';
  if(_wz.owner && _wz.owner!==kpIni && typeof clearPF==='function') clearPF();
  _wz.owner=kpIni;
  var d=_wzBacaDraf();
  if(d && !_wz.id){ wzPulihDraf(d); if(typeof toast==='function') toast('Draf dipulihkan — sambung dari langkah '+_wz.step+'.','in'); }
  else if(d){ /* sudah dalam memori (modal ditutup & dibuka semula) */ }
  _wzPapar();
  openMo('mo-daftar-prog');
  if(typeof _resetIdleTimer==='function') _resetIdleTimer();
}
function tutupDaftarProgram(){ wzSimpanDraf(true); closeMo('mo-daftar-prog'); }
function wzMulaBaru(){
  if(!_wzKosong() && !confirm('Padam draf dan mula baharu?')) return;
  if(typeof clearPF==='function') clearPF(); else wzReset();
}
// dipanggil oleh clearPF (selepas berjaya daftar / KOSONGKAN)
function wzReset(){ _wz.step=1; _wz.id=''; wzPadamDraf(); wzMsgBuang(); _wzPapar(); }

function wzInit(){
  var modal=_wzEl('mo-daftar-prog'), btn=_wzEl('btn-daftar'), body=_wzEl('wz-body');
  if(!modal||!btn||!body||_wz.inited) return;
  _wz.inited=true;
  try{ if(localStorage.getItem(_WZ_PREF)==='off') _wz.on=false; }catch(e){}
  var rowBtn=btn.parentNode, foot=_wzEl('wz-foot');
  var bar=document.createElement('div'); bar.id='wz-bar'; bar.style.cssText='margin:.2rem 0 .8rem;';
  body.insertBefore(bar,body.firstChild);
  var rk=document.createElement('div'); rk.id='wz-ringkas'; rk.style.display='none';
  body.appendChild(rk);
  var nav=document.createElement('div'); nav.id='wz-nav'; nav.style.cssText='display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;';
  nav.innerHTML='<button type="button" class="btn bs" id="wz-back" onclick="wzBack()">◀ KEMBALI</button>'
    +'<button type="button" class="btn bp" id="wz-next" onclick="wzNext()">SETERUSNYA ▶</button>';
  foot.insertBefore(nav,rowBtn);
  var alt=document.createElement('a'); alt.id='wz-alt'; alt.href='#';
  alt.style.cssText='display:inline-block;margin-top:.5rem;font-size:.66rem;font-weight:700;color:var(--g6);';
  alt.onclick=function(){ wzToggle(); return false; };
  foot.insertBefore(alt,foot.lastElementChild);
  // auto-simpan draf pada setiap perubahan dalam modal
  ['input','change','click'].forEach(function(ev){ modal.addEventListener(ev,function(){ wzSimpanDraf(false); },true); });
  // Enter dalam medan teks -> langkah seterusnya (kecuali di langkah 6 / pilihan / butang)
  modal.addEventListener('keydown',function(e){
    if(e.key!=='Enter'||!_wz.on||_wz.step>=6) return;
    var t=e.target; if(!t||t.tagName!=='INPUT'||t.type==='checkbox'||t.type==='radio'||t.type==='button') return;
    if(t.id&&t.id.indexOf('-sek-cari')>=0) return;   // carian sekolah
    e.preventDefault(); wzNext();
  });
  var er=_wzEl('wz-err'); if(er) er.setAttribute('role','alert');
  _wzPapar(); wzHintDraf();
}
wzInit();
