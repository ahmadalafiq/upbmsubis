// == Semak akses penyertaan (Guru: sekolah sendiri sahaja) ===
function _checkPenyAkses(kodSekolahInput){
  if(!_sesi) return false;
  if(_sesi.role==='admin'||_sesi.role==='pkk') return true;
  // Guru — semak sekolah sendiri
  var inputUpper = String(kodSekolahInput||'').toUpperCase().trim();
  var sesiUpper  = String(_sesi.kodSekolah||'').toUpperCase().trim();
  return inputUpper === sesiUpper;
}

// == Semak akses padam penyertaan sekolah lain ==============
function canPadamSek(kodSekolah, programPengelolaKod){
  if(!_sesi) return false;
  if(_sesi.role==='admin') return true;
  var ownSek = String(_sesi.kodSekolah||'').toUpperCase().trim();
  var inputSek = String(kodSekolah||'').toUpperCase().trim();
  // Guru dan PKK boleh padam sekolah sendiri
  if(ownSek && inputSek === ownSek) return true;
  // PKK sekolah pengelola boleh padam sekolah lain dalam program yang dikelola
  if(_sesi.role==='pkk'){
    var progKod = String(programPengelolaKod||'').toUpperCase().trim();
    if(ownSek && progKod && progKod === ownSek) return true;
  }
  return false;
}

// == Notifikasi ralat pada kad program ===========================
function showPcErr(progId, msg){
  var el = document.getElementById('pc-err-'+progId);
  if(!el) return;
  el.textContent = '⚠ ' + msg;
  el.style.display = 'flex';
  // Hilang selepas 5 saat
  setTimeout(function(){ el.style.display = 'none'; }, 5000);
}
function hidePcErr(progId){
  var el = document.getElementById('pc-err-'+progId);
  if(el) el.style.display = 'none';
}
// Normalisasi senarai kategori rasmi sesuatu program (buang KESELURUHAN — bukan kategori sebenar)
function _progKatList(prog){
  return ((prog&&prog['Kategori'])||'').split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean).filter(function(k){return k!=='KESELURUHAN';});
}
// Pulangkan senarai kategori "asing" (ada dalam rows tapi tiada dalam progKatList)
function _getKatAsing(progKatList, rows){
  if(!progKatList||!progKatList.length||!rows||!rows.length) return [];
  var asing={};
  rows.forEach(function(r){
    var k=String(r['Kategori Penyertaan']||'').toUpperCase().trim();
    if(!k||k==='GURU'||k==='KESELURUHAN') return;
    if(progKatList.indexOf(k)<0) asing[k]=true;
  });
  return Object.keys(asing);
}
// Semak sama ada kategori penyertaan (rows) sepadan dengan kategori rasmi program.
// Jika ada kategori "asing" (tiada dalam senarai kategori program), papar notifikasi pada kad program.
function _checkKatMismatch(progId, rows){
  if(!progId || !rows || !rows.length) return false;
  var prog=(_allProg||[]).filter(function(p){return p['ID']===progId;})[0];
  if(!prog) return false;
  var senarai=_getKatAsing(_progKatList(prog), rows);
  if(senarai.length){
    showPcErr(progId, 'Kategori penyertaan ('+senarai.join(', ')+') tidak sepadan dengan kategori program ini. Sila semak semula.');
    toast('⚠ Kategori penyertaan ('+senarai.join(', ')+') tidak sepadan dengan kategori program "'+(prog['Nama Program']||'')+'".','er');
    return true;
  }
  return false;
}


// == Mulakan dari sessionStorage (kalau ada sesi sebelum ini) =
var _SESI_TTL_MS = 8 * 60 * 60 * 1000; // 8 jam
function _initSesiDariStorage(){
  try{
    var s = sessionStorage.getItem('upbm_sesi');
    if(s){
      var data = JSON.parse(s);
      if(data && data.role){
        // Semak expiry — jika loginTime ada dan sudah melebihi 8 jam, buang sesi
        if(data.loginTime && (Date.now() - data.loginTime) > _SESI_TTL_MS){
          sessionStorage.removeItem('upbm_sesi');
          return false;
        }
        _mulakanSesi(data);
        return true;
      }
    }
  }catch(e){}
  return false;
}

// == PATCH: Semak akses sebelum hantar penyertaan ============
// Ganti semakPeny untuk tambah semakan Guru
var _origSemakPeny = typeof semakPeny === 'function' ? semakPeny : null;

// == PATCH: Sembunyikan/tunjuk butang padam sekolah mengikut role =
// Dipanggil selepas render lihat data modal
function _patchPadamSekBtns(){
  // Get current program's pengelola kod for PKK check
  var progPengKod = '';
  if(typeof _curProg!=='undefined' && _curProg) progPengKod = String(_curProg['Kod Pengelola']||'').toUpperCase();

  // Helper: dapatkan kod sekolah dari row
  function _getKodFromRow(btn){
    var row = btn.closest('.sek-row');
    if(!row) return '';
    var kodEl = row.querySelector('.sek-hdr-meta');
    if(!kodEl) return '';
    var m = kodEl.textContent.match(/Kod:\s*(\S+)/);
    return m ? m[1] : '';
  }
  // Patch butang PADAM
  document.querySelectorAll('.btn-del-sek').forEach(function(btn){
    var kod = _getKodFromRow(btn);
    if(!canPadamSek(kod, progPengKod)){
      btn.disabled = true;
      btn.textContent = '🔒 Tiada Akses';
      btn.style.cssText = 'opacity:.4;cursor:not-allowed;background:var(--g2);color:var(--g6);border:none;padding:.22rem .55rem;font-size:.62rem;font-weight:700;border-radius:var(--r);';
    }
  });
  // Patch butang EDIT — akses sama seperti padam
  document.querySelectorAll('.btn-edit-sek').forEach(function(btn){
    var kod = _getKodFromRow(btn);
    if(!canPadamSek(kod, progPengKod)){
      btn.disabled = true;
      btn.textContent = '🔒 Tiada Akses';
      btn.style.cssText = 'opacity:.4;cursor:not-allowed;background:var(--g2);color:var(--g6);border:none;padding:.22rem .55rem;font-size:.62rem;font-weight:700;border-radius:var(--r);';
    }
  });
}

// == IDLE TIMER — log keluar automatik selepas tidak aktif ===================
(function(){
  var IDLE_MS = 5 * 60 * 1000;      // 5 minit — keadaan biasa
  var IDLE_MS_FORM = 15 * 60 * 1000; // 15 minit — semasa borang penyertaan (ramai peserta) sedang diisi
  var _idleTimer = null;
  function _resetIdleTimer(){
    clearTimeout(_idleTimer);
    // Hanya jalankan jika pengguna sedang log masuk
    if(!document.body.classList.contains('loggedin')) return;
    // PEMBETULAN: panjangkan had idle bila borang penyertaan sedang aktif diisi —
    // sesi isi data ramai peserta biasanya ambil masa lebih 5 minit.
    var formAktif = ((typeof _isPenyFormAktif === 'function') && _isPenyFormAktif()) || ((typeof wzProgAktif === 'function') && wzProgAktif());
    var ms = formAktif ? IDLE_MS_FORM : IDLE_MS;
    _idleTimer = setTimeout(function(){
      if(document.body.classList.contains('loggedin')){
        toast('Sesi tamat kerana tidak aktif. Sila log masuk semula — draf borang anda disimpan.','in');
        // PEMBETULAN KRITIKAL: guna lgKeluar(true) — mod idle — supaya draf borang
        // penyertaan TIDAK dipadam dan boleh dipulihkan selepas log masuk semula.
        setTimeout(function(){ lgKeluar(true); }, 1200);
      }
    }, ms);
  }
  // PEMBETULAN: tambah 'input' & 'change' — sesetengah papan kekunci maya (mobile)
  // tidak sentiasa lepaskan event 'keydown' semasa menaip, menyebabkan timer tidak reset
  // walaupun user sebenarnya aktif menaip/memilih dropdown.
  ['mousemove','mousedown','keydown','input','change','touchstart','scroll','click'].forEach(function(ev){
    document.addEventListener(ev, _resetIdleTimer, {passive:true});
  });
  // Mula semak apabila log masuk (body.loggedin)
  var _bodyObserver = new MutationObserver(function(){
    if(document.body.classList.contains('loggedin')){
      _resetIdleTimer();
    } else {
      clearTimeout(_idleTimer);
    }
  });
  _bodyObserver.observe(document.body, {attributes:true, attributeFilter:['class']});
  // PEMBETULAN MINOR #4: Ekspos _resetIdleTimer supaya boleh dipanggil dari luar IIFE
  // (contoh: selepas modal dibuka/ditutup untuk reset timer idle)
  window._resetIdleTimer = _resetIdleTimer;
})();

// == INIT ====================================================
// INIT — klien Supabase sedia serta-merta (tiada handshake tak segerak diperlukan)
// == GOOGLE SIGN-IN & CLAIM AKAUN =================================
function loginGoogle(){
  // PEMBETULAN: guna URL bersih (origin+pathname) — window.location.href boleh
  // bawa '#' tertinggal, sebabkan Supabase tambah '#access_token=...' jadi '##access_token=...'
  // yang gagal di-parse oleh Supabase JS client (sesi tak dikesan lepas redirect balik).
  var cleanUrl = window.location.origin + window.location.pathname;

  // PEMBETULAN: Google (accounts.google.com) TOLAK dimuatkan dalam iframe bersarang
  // (403 — langkah keselamatan Google elak clickjacking kata laluan). Kalau app ni
  // dibuka dalam iframe (cth: embed Google Sites), redirect OAuth biasa akan gagal.
  // Elak dgn buka log masuk Google dalam TAB BAHARU — bukan redirect dalam iframe.
  var dalamIframe = (window.self !== window.top);

  if(dalamIframe){
    sb.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: cleanUrl,
        skipBrowserRedirect: true,
        queryParams: { hd: 'moe-dl.edu.my' }
      }
    }).then(function(r){
      if(r.error){ lgMsg('lg-err','Gagal sambung ke Google: '+r.error.message); return; }
      if(r.data && r.data.url){
        window.open(r.data.url, '_blank');
        lgMsg('lg-err', '');
        toast('Log masuk Google dibuka dalam tab baharu. Selepas selesai, kembali ke tab ini — sesi akan disegerakkan automatik.', 'in');
      }
    });
    return;
  }

  sb.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: cleanUrl,
      // 'hd' cuma menapis akaun yang dipaparkan dalam pemilih Google — BUKAN sekatan
      // keselamatan sebenar (boleh dipintas). Sekatan sebenar disemak di server (RPC).
      queryParams: { hd: 'moe-dl.edu.my' }
    }
  }).then(function(r){
    if(r.error) lgMsg('lg-err','Gagal sambung ke Google: '+r.error.message);
  });
}

function _initGoogleAuth(){
  sb.auth.onAuthStateChange(function(event, session){
    if(event === 'SIGNED_IN' && session){
      _semakSesiGoogle(session);
    }
  });
  // Semak juga sesi sedia ada (kes lepas redirect OAuth, sebelum event sempat tercetus)
  sb.auth.getSession().then(function(r){
    if(r.data && r.data.session) _semakSesiGoogle(r.data.session);
  });
}

var _gSemakBusy = false; // single-flight: onAuthStateChange(SIGNED_IN) DAN getSession() memanggil fungsi ini serentak
async function _semakSesiGoogle(session){
  // sudah log masuk (No.KP/PIN atau Google sedia ada) ATAU semakan lain sedang berjalan — elak konflik.
  // Tanpa _gSemakBusy, login_via_google dipanggil 2x serentak; setiap panggilan MEMUTAR token sesi
  // (hanya 1 token sah bagi setiap pengguna), jadi token yg diterima dahulu terbatal → "Akses ditolak - sesi tidak sah".
  if(_sesi || _gSemakBusy) return;
  _gSemakBusy = true;
  try{
    var r = await sb.rpc('login_via_google');
    if(r.error){
      // PEMBETULAN: domain emel ditolak oleh server (atau ralat lain) — log keluar
      // sesi Google supaya tak tersangkut, dan tunjuk mesej jelas di skrin log masuk.
      console.error(r.error);
      try{ await sb.auth.signOut(); }catch(e){}
      lgMsg('lg-err', r.error.message || 'Akaun Google ini tidak dibenarkan.');
      return;
    }
    var u = (r.data||[])[0];
    if(u){
      _mulakanSesi({role:u.role, nama:u.nama, kodSekolah:u.kod_sekolah, namaSekolah:u.nama_sekolah, noKP:u.no_kp, token:u.session_token});
    } else {
      // Belum pernah diikat — minta sahkan No.KP+PIN sedia ada
      var emel = session.user && session.user.email || '';
      document.getElementById('claim-emel').textContent = emel;
      document.getElementById('claim-err').textContent = '';
      document.getElementById('claim-nokp').value = '';
      document.getElementById('claim-pin').value = '';
      document.getElementById('claim-err2').textContent = '';
      document.getElementById('claim-role').value = 'guru';
      document.getElementById('claim-nama').value = '';
      document.getElementById('claim-nokp2').value = '';
      document.getElementById('claim-tel').value = '';
      document.getElementById('claim-sek-search').value = '';
      document.getElementById('claim-kodsek').value = '';
      document.getElementById('claim-nmsek').value = '';
      _toggleClaimMod('sedia');
      openMo('mo-claim');
    }
  }catch(e){ console.error(e); }
  finally{ _gSemakBusy = false; }
}

async function claimAkaunGoogle(){
  var noKP = document.getElementById('claim-nokp').value.trim();
  var pin  = document.getElementById('claim-pin').value.trim();
  var errEl = document.getElementById('claim-err');
  errEl.textContent = '';
  if(!noKP || !pin){ errEl.textContent = 'Sila isi No. KP dan PIN.'; return; }
  try{
    var r = await sb.rpc('claim_akaun_google', {p_no_kp: noKP, p_pin: pin});
    if(r.error){ errEl.textContent = r.error.message.replace(/^.*: /,''); return; }
    var u = (r.data||[])[0];
    if(!u){ errEl.textContent = 'No.KP atau PIN tidak sepadan.'; return; }
    closeMo('mo-claim');
    toast('Akaun berjaya diikat ke Google!','ok');
    _mulakanSesi({role:u.role, nama:u.nama, kodSekolah:u.kod_sekolah, namaSekolah:u.nama_sekolah, noKP:u.no_kp, token:u.session_token});
  }catch(e){ errEl.textContent = 'Ralat: '+e.message; }
}

// Togol antara mod "sahkan akaun sedia ada" vs "daftar akaun baharu" dalam modal claim
function _toggleClaimMod(mod){
  var elSedia = document.getElementById('claim-mod-sedia');
  var elBaharu = document.getElementById('claim-mod-baharu');
  if(mod === 'baharu'){
    elSedia.style.display = 'none';
    elBaharu.style.display = '';
  } else {
    elBaharu.style.display = 'none';
    elSedia.style.display = '';
  }
}

// Autocomplete sekolah khas untuk borang daftar-baharu-via-Google (guna semula senarai sedia ada)
function onSugClaimSek(q){
  var drop=document.getElementById('sug-claim-sek'); if(!drop)return;
  var v=(q||'').trim();
  if(!v){drop.innerHTML='';drop.classList.remove('on');return;}
  var lv=v.toLowerCase();
  var items=_getSekSuggestions().filter(function(s){
    return s.kod.toLowerCase().indexOf(lv)>-1||s.nama.toLowerCase().indexOf(lv)>-1;
  }).sort(function(a,b){return a.nama.localeCompare(b.nama);}).slice(0,8);
  if(!items.length){drop.innerHTML='<div class="sug-item" style="cursor:default;color:var(--g5);">Tiada sekolah sepadan</div>';drop.classList.add('on');return;}
  drop.innerHTML=items.map(function(s){
    return '<div class="sug-item" data-sug-kod="'+encodeURIComponent(s.kod)+'" data-sug-sek="'+encodeURIComponent(s.nama)+'"><span class="sug-item-ico">🏫</span><span>'+esc(s.nama)+' ('+esc(s.kod)+')</span></div>';
  }).join('');
  drop.querySelectorAll('.sug-item[data-sug-kod]').forEach(function(el){
    el.addEventListener('mousedown',function(){pickClaimSek(decodeURIComponent(el.dataset.sugKod),decodeURIComponent(el.dataset.sugSek));});
  });
  drop.classList.add('on');
}
function pickClaimSek(kod,nama){
  document.getElementById('claim-kodsek').value = kod;
  document.getElementById('claim-nmsek').value = nama;
  document.getElementById('claim-sek-search').value = nama+' ('+kod+')';
  hideSug('sug-claim-sek');
}

// Daftar akaun BAHARU terus via Google — TIADA PIN diperlukan (Google jadi kaedah log masuk)
async function daftarAkaunGoogleBaru(){
  var role = document.getElementById('claim-role').value;
  var nama = document.getElementById('claim-nama').value.trim();
  var noKP = document.getElementById('claim-nokp2').value.trim();
  var tel = document.getElementById('claim-tel').value.trim();
  var kodSek = document.getElementById('claim-kodsek').value;
  var nmSek = document.getElementById('claim-nmsek').value;
  var errEl = document.getElementById('claim-err2');
  errEl.textContent = '';
  if(!nama || !noKP || !tel || !kodSek){ errEl.textContent = 'Sila lengkapkan semua ruangan.'; return; }
  try{
    var r = await sb.rpc('daftar_akaun_google', {
      p_no_kp: noKP, p_nama: nama.toUpperCase(), p_role: role,
      p_kod_sekolah: kodSek, p_nama_sekolah: nmSek, p_no_tel: '+60'+tel
    });
    if(r.error){ errEl.textContent = r.error.message.replace(/^.*: /,''); return; }
    closeMo('mo-claim');
    toast('Permohonan berjaya dihantar. Kelulusan admin biasanya 1-2 hari bekerja.','ok');
    try{ await sb.auth.signOut(); }catch(e){}
  }catch(e){ errEl.textContent = 'Ralat: '+e.message; }
}

function _initApp(){
  if(!sb){
    document.getElementById('prog-list').innerHTML =
      '<div class="empty"><div class="ei">⚠</div><h3>Gagal sambung ke Supabase. Sila muat semula.</h3></div>';
    return;
  }

  // Memulakan Supabase Realtime Subscription untuk penyelarasan data 2 hala
  _initRealtimeSync();

  // Cuba pulihkan sesi dari sessionStorage
  _initSesiDariStorage();
  // Sesi Google Sign-In (kalau ada) — semak & layan claim/log masuk automatik
  _initGoogleAuth();
  // PEMBETULAN: pra-isi dropdown sekolah di skrin Daftar Akaun sejak awal
  _populateDafSekDropdown();
  // Muat senarai sekolah kanonik sebenar dari DB (gantikan senarai statik bila tersedia)
  loadSekolahMaster();
  // CSS pada body.loggedin kawat semua paparan — tiada manipulasi DOM diperlukan
}
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded', _initApp);
} else {
  _initApp();
}

// ================================================================
// UI PATCH JS — UPBM SUBIS
// ================================================================

