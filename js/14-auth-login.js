// == SISTEM LOGIN ============================================================

var _sesi = null; // {role, nama, kodSekolah, namaSekolah, emel}

// == Tab switch ==============================================
function lgTab(tab){
  ['login','daftar'].forEach(function(t){
    document.getElementById('lgtab-'+t).classList.toggle('on', t===tab);
    document.getElementById('lgp-'+t).classList.toggle('on', t===tab);
  });
  lgClearMsg();
  // PEMBETULAN: isi dropdown sekolah bila tab Daftar Akaun dibuka
  if(tab==='daftar') _populateDafSekDropdown();
}

function lgClearMsg(){
  ['lg-err','lg-warn','lg-info','daf-err','daf-ok'].forEach(function(id){
    var el=document.getElementById(id);
    if(el){el.style.display='none';el.textContent='';}
  });
}

function lgMsg(id, msg){
  var el=document.getElementById(id);
  if(el){el.textContent=msg;el.style.display='block';}
}

function lgToggleAdmin(){
  var box = document.getElementById('lg-admin-box');
  var isOpen = box.style.display !== 'none';
  box.style.display = isOpen ? 'none' : 'block';
  // Update toggle label
  var lnk = document.getElementById('lg-admin-lnk');
  lnk.textContent = isOpen ? '🔑 Log masuk sebagai Admin' : '← Kembali ke log masuk biasa';
  // Update KP label hint
  var kpWrap = document.getElementById('lg-kp-wrap');
  if(kpWrap){
    var hint = kpWrap.querySelector('.hint');
    if(hint) hint.textContent = isOpen ? 'Masukkan No. KP yang didaftarkan' : 'No. KP anda (untuk rekod admin)';
  }
  lgClearMsg();
}

// == Step dots ===============================================
function lgDot(step){
  document.getElementById('lgdot-1').className='lg-dot'+(step>1?' done':' on');
  document.getElementById('lgdot-2').className='lg-dot'+(step===2?' on':'');
}

function lgResetStep(){
  lgClearMsg();
  document.getElementById('lg-s1').style.display='block';
  document.getElementById('lg-s2').style.display='none';
  document.getElementById('lg-kp').value='';
  var kp2El = document.getElementById('lg-kp2'); if(kp2El) kp2El.value='';
  lgDot(1);
}

// == Step 1: Cari akaun ======================================
async function lgCariAkaun(){
  lgClearMsg();
  var kp = document.getElementById('lg-kp').value.trim();
  if(!kp){lgMsg('lg-err','Sila masukkan No. KP.');return;}

  var adminBox = document.getElementById('lg-admin-box');
  var isAdminMode = adminBox && adminBox.style.display !== 'none';
  var adminKod = isAdminMode ? document.getElementById('lg-admin-kod').value.trim() : '';

  // Jika mod admin, terus sahkan tanpa PIN step (1 panggilan)
  if(isAdminMode && adminKod){
    document.getElementById('lg-btn-cari').disabled=true;
    showOv('MENGESAHKAN...');
    try{
      var r = await run('loginGS',{noKP:kp, adminKod:adminKod, checkOnly:true});
      hideOv();
      if(!r.ok){lgMsg('lg-err',r.msg);return;}
      if(r.skipPin){r.noKP=kp;_mulakanSesi(r);return;}
    }catch(e){hideOv();lgMsg('lg-err','Ralat: '+e.message);}
    finally{document.getElementById('lg-btn-cari').disabled=false;}
    return;
  }

  // Semak sama ada field PIN sudah diisi (pengguna isi terus tanpa menekan seterusnya)
  var pinVal = document.getElementById('lg-pin').value.trim();

  document.getElementById('lg-btn-cari').disabled=true;
  showOv('MENYEMAK AKAUN...');
  try{
    // Jika PIN sudah diisi, gabungkan ke 1 panggilan sahaja
    if(pinVal && pinVal.length===6){
      var r2 = await run('loginGS',{noKP:kp, pin:pinVal});
      hideOv();
      if(!r2||!r2.ok){
        // Mungkin akaun tiada atau PIN salah — check dulu
        if(r2&&r2.status==='TUNGGU'){lgMsg('lg-warn','⏳ '+r2.msg);return;}
        if(r2&&r2.status==='TIADA'){lgMsg('lg-err',r2.msg);setTimeout(function(){lgTab('daftar');},1800);return;}
        // PIN salah — tunjuk step 2 untuk cuba semula
        lgMsg('lg-err', r2.msg||'PIN salah. Sila cuba semula.');
        document.getElementById('lg-pin').value='';
      } else {
        r2.noKP=kp; _mulakanSesi(r2); return;
      }
    }

    // Tanpa PIN — checkOnly untuk tunjuk nama & step 2
    var r = await run('loginGS',{noKP:kp, checkOnly:true});
    hideOv();
    if(!r.ok){
      if(r.status==='TUNGGU')      lgMsg('lg-warn','⏳ '+r.msg);
      else if(r.status==='TIADA'){ lgMsg('lg-err',r.msg); setTimeout(function(){lgTab('daftar');},1800); }
      else                         lgMsg('lg-err',r.msg);
      return;
    }
    if(r.skipPin){r.noKP=kp;_mulakanSesi(r);return;}
    // Tunjuk nama + minta PIN
    var roleLabel = r.role==='admin'?'Admin':r.role==='pkk'?'PKK':'Guru';
    document.getElementById('lg-found-name').textContent = r.nama||'—';
    document.getElementById('lg-found-meta').innerHTML =
      (r.namaSekolah||'') +
      '<span class="lg-role-tag lg-role-'+r.role+'">'+roleLabel+'</span>';
    window._lgTmp = {kp:kp};
    document.getElementById('lg-s1').style.display='none';
    document.getElementById('lg-s2').style.display='block';
    lgDot(2);
    setTimeout(function(){document.getElementById('lg-pin').focus();},100);
  }catch(e){
    hideOv();
    lgMsg('lg-err','Ralat: '+e.message);
  } finally {
    document.getElementById('lg-btn-cari').disabled=false;
  }
}

// == Step 2: Sahkan PIN & masuk ==============================
async function lgMasuk(){
  lgClearMsg();
  if(!window._lgTmp){lgMsg('lg-err','Sesi tamat. Sila mula semula.');lgResetStep();return;}
  var pin = document.getElementById('lg-pin').value.trim();
  if(!pin){lgMsg('lg-err','Sila masukkan PIN.');return;}
  if(pin.length!==6){lgMsg('lg-err','PIN mestilah 6 digit.');return;}

  var kp = window._lgTmp.kp;
  showOv('MENGESAHKAN PIN...');
  try{
    var r = await run('loginGS',{noKP:kp, pin:pin});
    hideOv();
    if(!r||!r.ok){
      lgMsg('lg-err', r.msg||'PIN salah. Sila cuba semula.');
      document.getElementById('lg-pin').value='';
      document.getElementById('lg-pin').focus();
      return;
    }
    r.noKP = kp;
    _mulakanSesi(r);
  }catch(e){
    hideOv();
    lgMsg('lg-err','Ralat: '+e.message);
  }
}

// == Mulakan sesi ============================================
async function _mulakanSesi(data){
  _sesi = {
    role:        data.role,
    nama:        data.nama||'',
    kodSekolah:  data.kodSekolah||'',
    namaSekolah: data.namaSekolah||'',
    noKP:        data.noKP||'',
    token:       data.token||'',
    loginTime:   Date.now()
  };
  // Simpan dalam sessionStorage (mungkin belum ada token lagi jika data.token kosong)
  try{ sessionStorage.setItem('upbm_sesi', JSON.stringify(_sesi)); }catch(e){}

  // Fasa T1 migrasi sistem token: dapatkan token sesi sebenar HANYA jika belum ada
  // (cth. login_via_google() dah sertakan token terus — elak panggilan berganda/sia-sia)
  if(_sesi.noKP && !_sesi.token){
    try{
      var rTok = await sb.rpc('_set_session_token', {p_no_kp: _sesi.noKP});
      if(!rTok.error && rTok.data){
        _sesi.token = rTok.data;
        try{ sessionStorage.setItem('upbm_sesi', JSON.stringify(_sesi)); }catch(e){}
      }
    }catch(e){ console.error('Gagal dapatkan token sesi:', e); }
  }

  // Tab ni dibuka via window.open() dari tab/iframe asal (cth: Google Sites, sebab Google
  // OAuth tolak dimuatkan dalam iframe bersarang) — beritahu boleh tutup tab, sesi akan
  // disegerakkan automatik ke tab asal (localStorage sama origin dikongsi Supabase JS).
  if(window.opener){
    try{
      var _bnrId = 'bnr-opener-ok';
      if(!document.getElementById(_bnrId)){
        document.body.insertAdjacentHTML('afterbegin',
          '<div id="'+_bnrId+'" style="position:fixed;top:0;left:0;right:0;z-index:99999;background:#27ae60;color:#fff;text-align:center;padding:.5rem 2.2rem;font-size:.75rem;font-weight:700;">'
          +'✓ Log masuk berjaya! Anda boleh tutup tab ini dan kembali ke tab/laman asal.'
          +'<button onclick="document.getElementById(\''+_bnrId+'\').remove()" style="position:absolute;right:.5rem;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;line-height:1;padding:.2rem .4rem;">×</button>'
          +'</div>');
        setTimeout(function(){ var b=document.getElementById(_bnrId); if(b) b.remove(); }, 8000);
      }
    }catch(e){}
  }

  // Reset panel AI supaya papar ucapan penuh (bukan amaran pre-login) bila dibuka semula
  if(typeof _aiOpened !== 'undefined' && _aiOpened){
    _aiOpened = false;
    var aiBodyEl = document.getElementById('ai-body');
    if(aiBodyEl) aiBodyEl.innerHTML='';
  }

  // Tunjuk app, sembunyikan login
  document.body.classList.add('loggedin');
  var nav = document.querySelector('nav');
  if(nav) nav.style.display = '';

  // Kemas kini nav
  _refreshNavUser();

  // Segar semula senarai sekolah kanonik (mungkin admin baru kemaskini)
  loadSekolahMaster();

  // Tunjuk/sembunyikan tab mengikut role
  _applyRoleUI();

  // Default view mengikut peranan — tidak bergantung pada tab aktif sesi sebelumnya
  // (mengelakkan paparan sisa cth. tab AKAUN admin masih terpapar bila guru log masuk)
  var defaultPg = _sesi.role==='admin' ? 'akaun' : (_sesi.role==='pkk' ? 'dashboard' : 'peserta');
  _doShowPage(defaultPg);

  // Projek 16: modal amaran (guru & PKK) — program ditugaskan belum dihantar / data tidak lengkap
  if(typeof wzHintDraf==='function') wzHintDraf();
  if(typeof semakTugasanSelepasLogin==='function') setTimeout(function(){ semakTugasanSelepasLogin(0); }, 1500);
}

// == PROFIL SAYA: kemaskini nama & No.Tel SENDIRI (sekolah/peranan hanya oleh admin) ==============
var _pfAsal = null;
function _pfNamaVal(){ return String((document.getElementById('pf-nama')||{}).value||'').replace(/\s+/g,' ').trim().toUpperCase(); }
function _pfMaskKP(kp){ var d=String(kp||'').replace(/\D/g,''); return d.length===12 ? '••••••-••-'+d.slice(8) : '••••'; }
async function openProfil(){
  if(!_sesi) return;
  var ld=document.getElementById('pf-ld'), bd=document.getElementById('pf-body');
  document.getElementById('pf-err').textContent=''; document.getElementById('pf-simpan').disabled=true; _pfAsal=null;
  ld.textContent='Memuatkan profil...'; ld.style.display='block'; bd.style.display='none';
  openMo('mo-profil');
  try{
    var r = await run('profilSayaGS',{});
    if(!(r&&r.ok&&r.data)) throw new Error((r&&r.msg)||'Gagal memuatkan profil.');
    var d=r.data;
    _pfAsal = {nama:String(d.nama||'').trim().toUpperCase(), tel:normTel(d.tel)};
    document.getElementById('pf-nama').value = d.nama||'';
    document.getElementById('pf-tel').value  = _pfAsal.tel;
    document.getElementById('pf-kp').textContent   = _pfMaskKP(d.noKP);
    document.getElementById('pf-role').textContent = d.role==='admin'?'Admin':d.role==='pkk'?'PKK':'Guru';
    document.getElementById('pf-sek').textContent  = d.namaSekolah||'—';
    ld.style.display='none'; bd.style.display='block';
  }catch(e){ ld.textContent='Gagal memuatkan profil: '+(e&&e.message?e.message:e); }
}
function _pfOnChange(){
  if(!_pfAsal) return;
  var tel=normTel((document.getElementById('pf-tel')||{}).value);
  document.getElementById('pf-simpan').disabled = !(_pfNamaVal()!==_pfAsal.nama || tel!==_pfAsal.tel);
}
async function simpanProfil(){
  if(!_pfAsal) return;
  var err=document.getElementById('pf-err'), btn=document.getElementById('pf-simpan'); err.textContent='';
  var nama=_pfNamaVal(), tel=normTel((document.getElementById('pf-tel')||{}).value);
  if(nama.length<3||nama.length>100){ err.textContent='Nama mesti 3 hingga 100 aksara.'; return; }
  if(/[<>&"`{}\\]/.test(nama)){ err.textContent='Nama mengandungi aksara yang tidak dibenarkan.'; return; }
  if(!/^[1-9][0-9]{7,9}$/.test(tel)){ err.textContent='No. telefon tidak sah. Contoh: 123456789 (tanpa 0 di hadapan).'; return; }
  var ubahNama = nama!==_pfAsal.nama, ubahTel = tel!==_pfAsal.tel;
  if(!ubahNama && !ubahTel){ closeMo('mo-profil'); return; }
  btn.disabled=true;
  try{
    var r = await run('kemaskiniProfilGS',{nama:ubahNama?nama:null, noTel:ubahTel?('+60'+tel):null});
    if(!(r&&r.ok)) throw new Error((r&&r.msg)||'Gagal menyimpan profil.');
    if(r.nama && _sesi){
      _sesi.nama = r.nama;
      try{ sessionStorage.setItem('upbm_sesi', JSON.stringify(_sesi)); }catch(e){}
      var nn=document.getElementById('nav-user-name'); if(nn) nn.textContent=_sesi.nama||'—';
    }
    toast('Profil berjaya dikemas kini ✓','ok'); closeMo('mo-profil');
  }catch(e){ err.textContent=(e&&e.message)?e.message:String(e); btn.disabled=false; }
}

function _refreshNavUser(){
  if(!_sesi) return;
  var wrap = document.getElementById('nav-user-wrap');
  wrap.style.display='flex';
  document.getElementById('nav-user-name').textContent = _sesi.nama||'—';
  document.getElementById('nav-user-sub').textContent  = _sesi.namaSekolah||(_sesi.role==='admin'?'Admin':'—');
  var tag = document.getElementById('nav-role-tag');
  var roleLabel = _sesi.role==='admin'?'Admin':_sesi.role==='pkk'?'PKK':'Guru';
  tag.textContent = roleLabel;
  tag.className = 'lg-role-tag lg-role-'+_sesi.role;
  initTahunSel(); // muat senarai tahun dan papar dropdown
}

function _applyRoleUI(){
  if(!_sesi) return;
  var isAdmin = _sesi.role==='admin';
  var isGuru  = _sesi.role==='guru';
  var isPKK   = _sesi.role==='pkk';
  // Tab Akaun — Admin sahaja
  document.getElementById('nt-akaun').style.display = isAdmin ? '' : 'none';
  var _ntAg = document.getElementById('nt-anugerah'); if(_ntAg) _ntAg.style.display = isAdmin ? '' : 'none';
  var _bnAg = document.getElementById('bnav-anugerah'); if(_bnAg) _bnAg.style.display = isAdmin ? 'flex' : 'none';
  // Borang daftar program — sembunyikan untuk Guru, tunjuk untuk PKK dan Admin
  var cardDaftar = document.getElementById('card-daftar-prog');
  if(cardDaftar) cardDaftar.style.display = isGuru ? 'none' : '';
  // Auto-isi maklumat penyertaan jika Guru atau PKK
  if(_sesi.role==='guru' || _sesi.role==='pkk'){
    var kodEl = document.getElementById('daf-kod');
    var sekEl = document.getElementById('daf-sek');
    if(kodEl && !kodEl.value && _sesi.kodSekolah) kodEl.value = _sesi.kodSekolah;
    if(sekEl && !sekEl.value && _sesi.namaSekolah) sekEl.value = _sesi.namaSekolah;
    // PEMBETULAN KRITIKAL #1: Set nilai dropdown daf-sek-select supaya sekolah guru/pkk terpilih.
    // onSekSelect TIDAK dipanggil di sini — tiada program dipilih lagi semasa log masuk.
    // Auto-pilih sekolah + buka borang berlaku dalam pilihProg() selepas guru pilih program.
    var selEl = document.getElementById('daf-sek-select');
    if(selEl && _sesi.kodSekolah) selEl.value = _sesi.kodSekolah;
    _syncDafSekDisplay();
  }
}

// == Log keluar (dengan semakan borang aktif) =================
// Dipanggil oleh butang "Keluar" — elak kehilangan draf tanpa sedar
function lgKeluarConfirm(){
  if(_isPenyFormAktif()){
    _tunjukDialogTinggal(function(){ lgKeluar(); });
    return;
  }
  lgKeluar();
}

// == Log keluar ==============================================
// idleMode=true: dipanggil oleh idle-timer (log keluar automatik akibat tidak aktif).
// Dalam kes ini draf borang penyertaan TIDAK dipadam supaya boleh dipulihkan
// (ditawarkan semula via _checkPenyDraft) selepas user log masuk semula.
function lgKeluar(idleMode){
  // Tamatkan sesi Google Sign-In juga (kalau ada) — tak ganggu kalau tiada sesi Google
  try{ sb.auth.signOut(); }catch(e){}

  // 0. Tutup semua modal yang terbuka & reset scroll lock
  document.querySelectorAll('.mo.on').forEach(function(el){ el.classList.remove('on'); });
  _moOpenCount=0;
  document.body.classList.remove('modal-open');

  // T2: Hentikan autosave. Padam draf HANYA jika ini bukan log keluar automatik akibat idle —
  // idle-logout mesti kekalkan draf sebagai jaring keselamatan data peserta yang belum dihantar.
  _stopPenyAutoSave(idleMode===true);
  window._pendingDraft=null;

  // PEMBETULAN: Kosongkan borang/draf penyertaan dalam memori + DOM — TAPI bukan semasa
  // idle-logout, kerana resetPeny() turut memadam draf tersimpan (via _stopPenyAutoSave).
  if(idleMode!==true){
    resetPeny();
  }

  // 1. Kosongkan sesi & cache
  _sesi = null;
  window._lgTmp = null;
  _C = {};
  // PEMBETULAN KRITIKAL #3: Buang hanya kunci spesifik — bukan clear() semua storage
  // clear() akan padam sesi semua tab dan data tidak berkaitan (upbm_view, dll)
  try{
    if(idleMode===true){
      try{sessionStorage.removeItem('upbm_sesi');}catch(e){} // kekalkan upbm_peny_draft
    }else{
      ['upbm_sesi','upbm_peny_draft','upbm_prog_draft'].forEach(function(k){ try{sessionStorage.removeItem(k);}catch(e){} });
      try{ if(typeof clearPF==='function') clearPF(); }catch(e){}
    }
    ['upbm_sesi','upbm_peny_draft','upbm_sek_extra'].forEach(function(k){ try{localStorage.removeItem(k);}catch(e){} });
  }catch(e){}

  // 2. Kosongkan semua .pin-inp (sweep by class)
  document.querySelectorAll('.pin-inp').forEach(function(el){ el.value = ''; });

  // 3. Kosongkan input KP & semua input login by ID
  ['lg-kp','lg-pin','lg-admin-kod','daf-nama','daf-kp','daf-tel',
   'daf-kodsek','daf-kodsek-search','daf-nmsek','daf-pin','daf-pin2'].forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = '';
  });

  // 4. Reset mesej ralat — .pin-err by class + IDs
  document.querySelectorAll('.pin-err').forEach(function(el){
    el.textContent = ''; el.style.display = 'none';
  });
  ['lg-err','lg-warn','lg-info','daf-err','daf-ok'].forEach(function(id){
    var el = document.getElementById(id);
    if(el){ el.textContent = ''; el.style.display = 'none'; }
  });

  // 5. Sembunyikan nav secara eksplisit
  var nav = document.querySelector('nav');
  if(nav) nav.style.display = 'none';

  // 6. Reset checkbox & admin box
  var chk = document.getElementById('lg-admin-chk');
  var box = document.getElementById('lg-admin-box');
  if(chk) chk.checked = false;
  if(box) box.style.display = 'none';

  // 7. Tunjuk skrin login — buang loggedin, CSS handle paparan
  document.body.classList.remove('loggedin');
  lgResetStep();
  lgTab('login');

  // 8. Fokus semula ke No. KP
  setTimeout(function(){
    var kp = document.getElementById('lg-kp');
    if(kp) kp.focus();
  }, 50);
}

// == Daftar akaun ============================================

