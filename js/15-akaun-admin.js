// == Panel Akaun (Admin) =====================================
var _akaunData = [];
var _akaunFilt = 'semua';
var _akaunRoleFilt = 'semua';
var _akaunSekFilt = 'semua';
var _akaunSearchQ = '';
var _akaunGroupBySek = false;

async function loadAkaun(bust, silent){
  if(bust) cBust();
  if(!silent) document.getElementById('akaun-list').innerHTML='<div class="ld"><div class="sp"></div>Memuatkan...</div>';
  try{
    var r = await run('getAkaunListGS');
    _akaunData = (r&&r.data)||[];
    _populateAkFiltSek();
    renderAkaun();
  }catch(e){
    if(silent){ console.warn('loadAkaun(silent) gagal, diabaikan senyap:', e.message); }
    else{ document.getElementById('akaun-list').innerHTML='<div class="empty"><div class="ei">⚠</div><h3>Gagal memuatkan: '+esc(e.message)+'</h3></div>'; }
  }
}

function akFilt(f){
  _akaunFilt = f;
  ['semua','tunggu','aktif'].forEach(function(x){
    var el=document.getElementById('ak-filt-'+x);
    if(el) el.style.fontWeight = x===f?'800':'400';
  });
  renderAkaun();
}

// == Tapisan mengikut peranan (role) ==========================
function akFiltRole(v){
  _akaunRoleFilt = v||'semua';
  renderAkaun();
}

// == Tapisan mengikut sekolah ==================================
function akFiltSek(v){
  _akaunSekFilt = v||'semua';
  renderAkaun();
}

// == Isi dropdown tapisan sekolah berdasarkan data akaun semasa ==
function _populateAkFiltSek(){
  var sel = document.getElementById('ak-filt-sek');
  if(!sel) return;
  var curVal = sel.value||'semua';
  var seen = {}, list = [];
  _akaunData.forEach(function(a){
    var kod = String(a.kodSekolah||'').trim();
    var nama = String(a.namaSekolah||'').trim();
    if(!kod && !nama) return;
    var key = kod+'||'+nama;
    if(!seen[key]){ seen[key]=1; list.push({kod:kod, nama:nama}); }
  });
  list.sort(function(x,y){ return x.nama.localeCompare(y.nama); });
  var opts = '<option value="semua">🏫 SEMUA SEKOLAH</option>';
  list.forEach(function(s){
    opts += '<option value="'+esc(s.kod)+'">'+esc(s.nama)+(s.kod?' ('+esc(s.kod)+')':'')+'</option>';
  });
  sel.innerHTML = opts;
  // Kekalkan pilihan sebelumnya jika masih wujud dalam senarai baharu
  if(list.some(function(s){return s.kod===curVal;}) || curVal==='semua') sel.value = curVal;
  else { sel.value='semua'; _akaunSekFilt='semua'; }
}

// == Carian teks bebas (nama / No.KP / sekolah) ===============
function akCari(v){
  _akaunSearchQ = (v||'').trim();
  var clr = document.getElementById('ak-cari-clear');
  if(clr) clr.style.display = _akaunSearchQ ? 'block' : 'none';
  renderAkaun();
}
function akCariClear(){
  var inp = document.getElementById('ak-cari');
  if(inp) inp.value='';
  akCari('');
}

// == Togol paparan kumpulan mengikut sekolah ==================
function akToggleGroup(){
  _akaunGroupBySek = !_akaunGroupBySek;
  var btn = document.getElementById('ak-grp-btn');
  if(btn){
    btn.classList.toggle('bs', !_akaunGroupBySek);
    btn.style.background = _akaunGroupBySek ? 'var(--red)' : '';
    btn.style.color = _akaunGroupBySek ? '#fff' : '';
  }
  renderAkaun();
}

function _akaunCardHtml(a){
  var statCls = a.status==='AKTIF'?'stat-aktif':a.status==='TUNGGU'?'stat-tunggu':'stat-tolak';
  var cardCls = a.status==='TUNGGU'?'tunggu':a.status==='TOLAK'?'tolak':'';
  var roleOpts = ['guru','pkk','admin'].map(function(r){
    return '<option value="'+r+'"'+(a.role===r?' selected':'')+'>'+r+'</option>';
  }).join('');
  var btns = '';
  if(a.status==='TUNGGU'){
    btns += '<select id="role-sel-'+a.noKP.replace(/\D/g,'')+'" style="font-size:.65rem;padding:.28rem .5rem;border-radius:6px;border:1.5px solid var(--g3);">'+roleOpts+'</select>';
    btns += '<button class="btn bsm" style="background:#27ae60;color:#fff;font-size:.63rem;" onclick="akLulus(\''+a.noKP+'\')">✅ Lulus</button>';
    btns += '<button class="btn bsm" style="background:#e74c3c;color:#fff;font-size:.63rem;" onclick="akTolak(\''+a.noKP+'\')">✗ Tolak</button>';
  } else if(a.status==='AKTIF'){
    btns += '<select id="role-sel-'+a.noKP.replace(/\D/g,'')+'" style="font-size:.65rem;padding:.28rem .5rem;border-radius:6px;border:1.5px solid var(--g3);">'+roleOpts+'</select>';
    btns += '<button class="btn bs bsm" style="font-size:.63rem;" onclick="akTukarRole(\''+a.noKP+'\')">✏ Kemaskini Role</button>';
    btns += '<button class="btn bsm" style="background:#8e44ad;color:#fff;font-size:.63rem;" onclick="akResetPin(\''+a.noKP+'\',\''+esc(a.nama)+'\')">🔑 Reset PIN</button>';
    btns += '<button class="btn bsm" style="background:#e74c3c;color:#fff;font-size:.63rem;" onclick="akNyahaktif(\''+a.noKP+'\')">🚫 Nyahaktif</button>';
  } else {
    btns += '<button class="btn bs bsm" style="font-size:.63rem;" onclick="akAktifSemula(\''+a.noKP+'\')">✅ Aktif Semula</button>';
    btns += '<button class="btn bsm" style="background:#8e44ad;color:#fff;font-size:.63rem;" onclick="akResetPin(\''+a.noKP+'\',\''+esc(a.nama)+'\')">🔑 Reset PIN</button>';
  }
  btns += '<button class="btn bs bsm" style="font-size:.63rem;" onclick="akEditMaklumat(\''+a.noKP+'\')">✏ Edit Maklumat</button>';
  return '<div class="akaun-card '+cardCls+'">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:.5rem;flex-wrap:wrap;">'
    +'<div>'
    +'<div class="akaun-name">'+esc(a.nama)
    +' <span class="lg-role-tag lg-role-'+a.role+'">'+a.role+'</span>'
    +' <span class="akaun-stat '+statCls+'">'+a.status+'</span></div>'
    +'<div class="akaun-meta">📋 '+esc(a.namaSekolah)+' ('+esc(a.kodSekolah)+')'
    +' &nbsp;|&nbsp; 🪪 '+esc(String(a.noKP))+'</div>'
    +(a.noTel?'<div class="akaun-meta">📞 '+esc(a.noTel)+(a.tarikh?' &nbsp;|&nbsp; 📅 Daftar: '+a.tarikh:'')+'</div>':'')
    +'</div>'
    +'</div>'
    +'<div class="akaun-actions">'+btns+'</div>'
    +'</div>';
}

function renderAkaun(){
  var q = _akaunSearchQ.toLowerCase();
  var list = _akaunData.filter(function(a){
    if(_akaunFilt!=='semua' && (a.status||'').toLowerCase()!==_akaunFilt) return false;
    if(_akaunRoleFilt!=='semua' && (a.role||'').toLowerCase()!==_akaunRoleFilt) return false;
    if(_akaunSekFilt!=='semua' && String(a.kodSekolah||'').trim()!==_akaunSekFilt) return false;
    if(q){
      var hay = (String(a.nama||'')+' '+String(a.noKP||'')+' '+String(a.namaSekolah||'')+' '+String(a.kodSekolah||'')).toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  });
  var cntEl = document.getElementById('ak-cari-count');
  if(cntEl) cntEl.textContent = (q||_akaunRoleFilt!=='semua'||_akaunSekFilt!=='semua') ? (list.length+' akaun ditemui') : '';
  if(!list.length){
    document.getElementById('akaun-list').innerHTML='<div class="empty"><div class="ei">👥</div><h3>Tiada akaun dalam kategori ini</h3></div>';
    return;
  }
  // Sort: TUNGGU dulu
  list.sort(function(a,b){
    var ord={'TUNGGU':0,'AKTIF':1,'TOLAK':2};
    return (ord[a.status]||1)-(ord[b.status]||1);
  });

  if(!_akaunGroupBySek){
    document.getElementById('akaun-list').innerHTML = list.map(_akaunCardHtml).join('');
    return;
  }

  // == Paparan dikumpulkan mengikut sekolah ==
  var groups = {}, order = [];
  list.forEach(function(a){
    var kod = String(a.kodSekolah||'').trim();
    var nama = String(a.namaSekolah||'—').trim()||'—';
    var key = kod+'||'+nama;
    if(!groups[key]){ groups[key]={kod:kod, nama:nama, items:[]}; order.push(key); }
    groups[key].items.push(a);
  });
  order.sort(function(x,y){ return groups[x].nama.localeCompare(groups[y].nama); });
  var html = order.map(function(key){
    var g = groups[key];
    return '<div style="margin-bottom:1rem;">'
      + '<div style="display:flex;align-items:center;gap:.4rem;font-size:.68rem;font-weight:800;'
      + 'color:var(--red);background:var(--rp);padding:.35rem .7rem;border-radius:8px;margin-bottom:.4rem;'
      + 'text-transform:uppercase;letter-spacing:.3px;">'
      + '🏫 '+esc(g.nama)+(g.kod?' ('+esc(g.kod)+')':'')
      + ' <span style="margin-left:auto;background:#fff;color:var(--red);padding:.05rem .5rem;border-radius:10px;font-size:.62rem;">'+g.items.length+' akaun</span>'
      + '</div>'
      + g.items.map(_akaunCardHtml).join('')
      + '</div>';
  }).join('');
  document.getElementById('akaun-list').innerHTML = html;
}

async function _akKemaskini(noKP, status, role){
  showOv('MENGEMASKINI...');
  try{
    var r = await run('kemaskiniAkaunGS',{noKP:noKP, status:status, role:role});
    hideOv();
    if(r&&r.ok){ toast('Akaun dikemaskini','ok'); loadAkaun(true); }
    else toast((r&&r.msg)||'Ralat','er');
  }catch(e){ hideOv(); toast('Ralat: '+e.message,'er'); }
}

function akResetPin(noKP, nama){
  var existing = document.getElementById('mo-reset-pin');
  if(existing) _closeDynMo('mo-reset-pin');

  var mo = document.createElement('div');
  mo.className = 'mo on'; mo.id = 'mo-reset-pin';
  mo.innerHTML = '<div class="md" style="max-width:400px;">'
    +'<div class="mh">🔑 Reset PIN — '+esc(nama)+'</div>'
    +'<div class="mb">'
    +'<div style="font-size:.72rem;color:var(--g6);margin-bottom:.9rem;">'
    +'Tetapkan PIN baharu untuk akaun ini. PIN baharu akan dipaparkan selepas reset — '
    +'<strong>maklumkan PIN kepada pengguna secara terus.</strong>'
    +'</div>'
    +'<div style="background:var(--g1);border-radius:var(--r);padding:.7rem .8rem;margin-bottom:.9rem;">'
    +'<label style="font-size:.6rem;font-weight:800;color:var(--g6);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:.35rem;">'
    +'PIN Baharu (kosongkan untuk jana rawak 6 digit)</label>'
    +'<input type="text" id="reset-pin-val" placeholder="cth: 123456" maxlength="6" inputmode="numeric"'
    +' style="width:100%;padding:.45rem .65rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:1.1rem;font-family:monospace;letter-spacing:4px;text-align:center;box-sizing:border-box;">'
    +'<div style="font-size:.58rem;color:var(--g6);margin-top:.25rem;">Mesti 6 digit angka, atau biarkan kosong untuk jana rawak</div>'
    +'</div>'
    +'<div id="reset-pin-err" style="display:none;background:#fdf2f2;border:1px solid #f5c6c6;border-radius:var(--r);padding:.4rem .65rem;font-size:.68rem;color:var(--red);margin-bottom:.6rem;"></div>'
    +'<div id="reset-pin-result" style="display:none;"></div>'
    +'<div id="reset-pin-btns" style="display:flex;gap:.5rem;justify-content:flex-end;">'
    +'<button class="btn bs" onclick="_closeDynMo(\'mo-reset-pin\')" style="font-size:.72rem;">Tutup</button>'
    +'<button class="btn" style="background:#8e44ad;color:#fff;font-size:.72rem;" onclick="akConfirmReset(\''+noKP+'\')">🔑 Reset PIN</button>'
    +'</div>'
    +'</div></div>';
  _openDynMo(mo);
  setTimeout(function(){ document.getElementById('reset-pin-val').focus(); }, 100);
}

async function akConfirmReset(noKP){
  var pinInput = document.getElementById('reset-pin-val');
  var pinVal   = pinInput ? pinInput.value.trim() : '';
  var errEl    = document.getElementById('reset-pin-err');

  if(pinVal && !/^\d{6}$/.test(pinVal)){
    errEl.textContent = 'PIN mestilah tepat 6 digit angka.';
    errEl.style.display = 'block'; return;
  }
  errEl.style.display = 'none';

  showOv('MENETAPKAN PIN BAHARU...');
  try{
    var r = await run('resetPinGS', {noKP:noKP, pin:pinVal||''});
    hideOv();
    if(r && r.ok){
      // Papar PIN baharu dalam modal
      document.getElementById('reset-pin-btns').style.display = 'none';
      document.getElementById('reset-pin-result').innerHTML =
        '<div style="background:#e8f8f0;border:1.5px solid #a9dfbf;border-radius:var(--r);padding:.75rem .9rem;margin-bottom:.8rem;text-align:center;">'
        +'<div style="font-size:.65rem;font-weight:800;color:#1e8449;text-transform:uppercase;letter-spacing:.4px;margin-bottom:.35rem;">✅ PIN Berjaya Ditetapkan</div>'
        +'<div style="font-size:2rem;font-family:monospace;font-weight:900;letter-spacing:8px;color:#1a5276;padding:.25rem 0;">'+esc(r.pinBaharu||pinVal)+'</div>'
        +'<div style="font-size:.62rem;color:var(--g6);margin-top:.3rem;">Maklumkan PIN ini kepada pengguna secara terus.</div>'
        +'</div>'
        +'<div style="text-align:right;">'
        +'<button class="btn" style="font-size:.72rem;" onclick="_closeDynMo(\'mo-reset-pin\');loadAkaun(true);">✓ Selesai</button>'
        +'</div>';
      document.getElementById('reset-pin-result').style.display = 'block';
    } else {
      errEl.textContent = (r&&r.msg)||'Ralat semasa reset PIN.';
      errEl.style.display = 'block';
    }
  }catch(e){
    hideOv();
    errEl.textContent = 'Ralat: ' + e.message;
    errEl.style.display = 'block';
  }
}

// =======================================================
// EDIT MAKLUMAT PENGGUNA (admin) — nama, sekolah, no telefon
// =======================================================
function akEditMaklumat(noKP){
  var a = (_akaunData||[]).find(function(x){ return String(x.noKP)===String(noKP); });
  if(!a){ toast('Akaun tidak dijumpai','er'); return; }
  var existing = document.getElementById('mo-edit-maklumat');
  if(existing) _closeDynMo('mo-edit-maklumat');

  var sekNamaSemasa = a.kodSekolah ? (_getNamaSekolahByKod(a.kodSekolah)||'') : '';
  var sekDisplaySemasa = a.kodSekolah ? (sekNamaSemasa ? sekNamaSemasa+' ('+a.kodSekolah+')' : a.kodSekolah) : '';

  var mo = document.createElement('div');
  mo.className = 'mo on'; mo.id = 'mo-edit-maklumat';
  mo.innerHTML = '<div class="md" style="max-width:440px;">'
    +'<div class="mh">✏ Edit Maklumat — '+esc(a.nama)+'</div>'
    +'<div class="mb">'
    +'<div class="fi full" style="margin-bottom:.6rem;"><label>Nama Penuh</label>'
    +'<input type="text" id="edm-nama" value="'+esc(a.nama)+'" style="width:100%;padding:.45rem .65rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.78rem;box-sizing:border-box;text-transform:uppercase;"></div>'
    +'<div class="fi full" style="margin-bottom:.6rem;position:relative;"><label>Sekolah</label>'
    +'<input type="text" id="edm-sekolah-search" value="'+esc(sekDisplaySemasa)+'" placeholder="Taip nama atau kod sekolah..." autocomplete="off"'
    +' style="width:100%;padding:.45rem .65rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.78rem;box-sizing:border-box;"'
    +' oninput="onSugEdmSek(this.value)" onfocus="onSugEdmSek(this.value)" onblur="hideSug(\'sug-edm-sekolah\')">'
    +'<div class="sug-drop" id="sug-edm-sekolah"></div>'
    +'<input type="hidden" id="edm-sekolah" value="'+esc(a.kodSekolah||'')+'"></div>'
    +'<div class="fi full" style="margin-bottom:.6rem;"><label>No. Telefon</label>'
    +'<input type="tel" id="edm-tel" value="'+esc(a.noTel||'')+'" placeholder="0128887272" style="width:100%;padding:.45rem .65rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.78rem;box-sizing:border-box;"></div>'
    +'<div id="edm-err" style="display:none;background:#fdf2f2;border:1px solid #f5c6c6;border-radius:var(--r);padding:.4rem .65rem;font-size:.68rem;color:var(--red);margin-bottom:.6rem;"></div>'
    +'<div style="display:flex;gap:.5rem;justify-content:flex-end;">'
    +'<button class="btn bs" onclick="_closeDynMo(\'mo-edit-maklumat\')" style="font-size:.72rem;">Tutup</button>'
    +'<button class="btn" style="font-size:.72rem;" onclick="akSimpanMaklumat(\''+noKP+'\')">✓ Simpan</button>'
    +'</div></div></div>';
  _openDynMo(mo);
  setTimeout(function(){ var i=document.getElementById('edm-nama'); if(i) i.focus(); },100);
}

// Autocomplete sekolah dalam modal Edit Maklumat (Akaun)
function onSugEdmSek(q){
  var drop=document.getElementById('sug-edm-sekolah'); if(!drop)return;
  var v=(q||'').trim();
  if(!v){drop.innerHTML='';drop.classList.remove('on');return;}
  var lv=v.toLowerCase();
  var items=_getSekSuggestions().filter(function(s){
    return s.kod.toLowerCase().indexOf(lv)>-1||s.nama.toLowerCase().indexOf(lv)>-1;
  }).sort(function(a,b){return a.nama.localeCompare(b.nama);}).slice(0,8);
  if(!items.length){drop.innerHTML='<div class="sug-item" style="cursor:default;color:var(--g6);">Tiada sekolah sepadan</div>';drop.classList.add('on');return;}
  drop.innerHTML=items.map(function(s){
    return '<div class="sug-item" data-sug-kod="'+encodeURIComponent(s.kod)+'" data-sug-sek="'+encodeURIComponent(s.nama)+'"><span class="sug-item-ico">🏫</span><span>'+esc(s.nama)+' ('+esc(s.kod)+')</span></div>';
  }).join('');
  drop.querySelectorAll('.sug-item[data-sug-kod]').forEach(function(el){
    el.addEventListener('mousedown',function(){
      var kod=decodeURIComponent(el.dataset.sugKod), nama=decodeURIComponent(el.dataset.sugSek);
      var hid=document.getElementById('edm-sekolah'); if(hid) hid.value=kod;
      var vis=document.getElementById('edm-sekolah-search'); if(vis) vis.value=nama+' ('+kod+')';
      hideSug('sug-edm-sekolah');
    });
  });
  drop.classList.add('on');
}

async function akSimpanMaklumat(noKP){
  var nama = (document.getElementById('edm-nama').value||'').trim();
  var kodSel = document.getElementById('edm-sekolah').value;
  var noTel = (document.getElementById('edm-tel').value||'').trim();
  var errEl = document.getElementById('edm-err');
  if(!nama){ errEl.textContent='Nama tidak boleh kosong.'; errEl.style.display='block'; return; }
  errEl.style.display='none';
  var namaSekolah = '';
  if(kodSel){
    var found = _getSekSuggestions().find(function(s){ return s.kod===kodSel; });
    namaSekolah = found ? found.nama : '';
  }
  showOv('MENGEMASKINI MAKLUMAT...');
  try{
    var payload = {noKP:noKP, nama:nama, noTel:noTel};
    if(kodSel){ payload.kodSekolah = kodSel; payload.namaSekolah = namaSekolah; }
    var r = await run('kemaskiniMaklumatPenggunaGS', payload);
    hideOv();
    if(r&&r.ok){
      toast(r.msg||'Maklumat dikemaskini','ok');
      _closeDynMo('mo-edit-maklumat');
      loadAkaun(true);
    } else {
      errEl.textContent = (r&&r.msg)||'Ralat semasa kemaskini.'; errEl.style.display='block';
    }
  }catch(e){ hideOv(); errEl.textContent='Ralat: '+e.message; errEl.style.display='block'; }
}

// =======================================================
// SENARAI SEKOLAH — panel pengurusan (admin sahaja)
// Jadual `sekolah` di Supabase ialah RUJUKAN UTAMA nama & kod sekolah
// yang digunakan di seluruh sistem (dropdown penyertaan, autocomplete
// pendaftaran program, dsb.) — elak duplikat akibat variasi ejaan.
// =======================================================
var _sekolahList = [];
var _sekolahCariQ = '';

async function bukaSenaraiSekolah(){
  if(!_sesi || _sesi.role!=='admin'){ toast('Akses ditolak. Hanya Admin boleh urus senarai sekolah.','er'); return; }
  var existing = document.getElementById('mo-sekolah');
  if(existing) _closeDynMo('mo-sekolah');

  var mo = document.createElement('div');
  mo.className = 'mo on'; mo.id = 'mo-sekolah';
  mo.innerHTML = '<div class="md" style="max-width:560px;">'
    +'<div class="mh">🏫 Senarai Sekolah (Rujukan Utama)</div>'
    +'<div class="mb">'
    +'<div style="font-size:.68rem;color:var(--g6);margin-bottom:.8rem;">Senarai ini menjadi rujukan utama nama &amp; kod sekolah di seluruh sistem. Gunakan sini untuk tambah sekolah baharu atau betulkan ejaan nama sekolah sedia ada — pembetulan akan disegerakkan ke semua rekod berkaitan.</div>'
    +'<div style="display:flex;gap:.4rem;margin-bottom:.6rem;">'
    +'<input type="text" id="sek-cari-inp" placeholder="Cari kod atau nama sekolah..." oninput="sekCari(this.value)" style="flex:1;padding:.45rem .65rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.74rem;">'
    +'<button class="btn bsm" style="background:#27ae60;color:#fff;" onclick="sekMulaTambah()">➕ TAMBAH</button>'
    +'</div>'
    +'<div id="sek-seed-wrap" style="display:none;background:#fff8f0;border:1px solid #fde8cc;border-radius:var(--r);padding:.55rem .7rem;margin-bottom:.6rem;font-size:.66rem;color:#7d5a1f;">'
    +'Jadual sekolah masih kosong. <button class="btn bsm" style="background:#e67e22;color:#fff;margin-left:.3rem;font-size:.6rem;" onclick="sekSeedAwal()">🌱 ISI DARI SENARAI SEDIA ADA ('+_SEKOLAH_STATIK.length+' sekolah)</button>'
    +'</div>'
    +'<div id="sek-tambah-wrap" style="display:none;background:var(--g1);border-radius:var(--r);padding:.65rem .75rem;margin-bottom:.7rem;">'
    +'<div style="display:flex;gap:.4rem;flex-wrap:wrap;">'
    +'<input type="text" id="sek-baru-kod" placeholder="Kod (cth: Y044)" style="flex:1;min-width:110px;padding:.4rem .6rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.72rem;text-transform:uppercase;">'
    +'<input type="text" id="sek-baru-nama" placeholder="Nama sekolah" style="flex:2;min-width:160px;padding:.4rem .6rem;border:1.5px solid var(--g3);border-radius:var(--r);font-size:.72rem;text-transform:uppercase;">'
    +'</div>'
    +'<div id="sek-tambah-err" style="display:none;color:var(--red);font-size:.65rem;margin-top:.4rem;"></div>'
    +'<div style="display:flex;gap:.4rem;justify-content:flex-end;margin-top:.5rem;">'
    +'<button class="btn bs bsm" onclick="document.getElementById(\'sek-tambah-wrap\').style.display=\'none\';">Batal</button>'
    +'<button class="btn bsm" style="background:#27ae60;color:#fff;" onclick="sekSimpanTambah()">✓ Simpan</button>'
    +'</div></div>'
    +'<div id="sek-list" style="max-height:50vh;overflow-y:auto;"><div class="ld"><div class="sp"></div>Memuatkan...</div></div>'
    +'<div class="mt2"><button class="btn bs bsm" onclick="_closeDynMo(\'mo-sekolah\')">TUTUP</button></div>'
    +'</div></div>';
  _openDynMo(mo);
  _muatSenaraiSekolah();
}

async function _muatSenaraiSekolah(){
  var el = document.getElementById('sek-list'); if(!el) return;
  try{
    var r = await run('getSekolahListGS');
    _sekolahList = (r && r.ok && r.data) ? r.data : [];
    var seedWrap = document.getElementById('sek-seed-wrap');
    if(seedWrap) seedWrap.style.display = _sekolahList.length ? 'none' : 'block';
    _renderSenaraiSekolah();
  }catch(e){
    el.innerHTML = '<div class="empty"><div class="ei">⚠</div><h3>Gagal muat senarai sekolah</h3><p style="font-size:.68rem;color:var(--g6);">'+esc(e.message)+'</p></div>';
  }
}

async function sekSeedAwal(){
  showOv('MENGISI SENARAI SEKOLAH...');
  try{
    var r = await run('seedSekolahGS', {senarai:_SEKOLAH_STATIK});
    hideOv();
    if(r&&r.ok){
      toast(r.msg||'Senarai sekolah diisi','ok');
      await _muatSenaraiSekolah();
      loadSekolahMaster();
    } else {
      toast((r&&r.msg)||'Ralat semasa mengisi senarai','er');
    }
  }catch(e){ hideOv(); toast('Ralat: '+e.message,'er'); }
}

function sekCari(q){ _sekolahCariQ = (q||'').toLowerCase(); _renderSenaraiSekolah(); }

function _renderSenaraiSekolah(){
  var el = document.getElementById('sek-list'); if(!el) return;
  var q = _sekolahCariQ;
  var list = _sekolahList.filter(function(s){
    if(!q) return true;
    return s.kod.toLowerCase().indexOf(q)>-1 || s.nama.toLowerCase().indexOf(q)>-1;
  }).sort(function(a,b){ return a.nama.localeCompare(b.nama); });
  if(!list.length){
    el.innerHTML = '<div class="empty"><div class="ei">🏫</div><h3>Tiada sekolah dijumpai</h3><p style="font-size:.68rem;color:var(--g6);">Jadual sekolah mungkin masih kosong — guna butang TAMBAH untuk mula, atau muat naik senarai sedia ada.</p></div>';
    return;
  }
  el.innerHTML = list.map(function(s){
    var kodSafe = esc(s.kod);
    return '<div class="di" id="sek-row-'+kodSafe+'" style="align-items:center;">'
      +'<div class="db" style="flex:1;">'
      +'<span style="font-family:monospace;font-weight:800;color:var(--red);font-size:.68rem;">'+kodSafe+'</span> '
      +'<span class="sek-nama-disp" style="font-size:.74rem;font-weight:700;color:var(--g8);">'+esc(s.nama)+'</span>'
      +'</div>'
      +'<button class="btn bs bsm" style="font-size:.62rem;" onclick="sekMulaEdit(\''+kodSafe+'\')">✏ Edit</button>'
      +'</div>';
  }).join('');
}

function sekMulaTambah(){
  var w = document.getElementById('sek-tambah-wrap');
  w.style.display = 'block';
  document.getElementById('sek-tambah-err').style.display='none';
  setTimeout(function(){ var i=document.getElementById('sek-baru-kod'); if(i) i.focus(); },80);
}

async function sekSimpanTambah(){
  var kod = (document.getElementById('sek-baru-kod').value||'').trim();
  var nama = (document.getElementById('sek-baru-nama').value||'').trim();
  var errEl = document.getElementById('sek-tambah-err');
  if(!kod||!nama){ errEl.textContent='Sila isi kod dan nama sekolah.'; errEl.style.display='block'; return; }
  errEl.style.display='none';
  showOv('MENAMBAH SEKOLAH...');
  try{
    var r = await run('tambahSekolahGS',{kod:kod, nama:nama});
    hideOv();
    if(r&&r.ok){
      toast(r.msg||'Sekolah ditambah','ok');
      document.getElementById('sek-tambah-wrap').style.display='none';
      document.getElementById('sek-baru-kod').value=''; document.getElementById('sek-baru-nama').value='';
      await _muatSenaraiSekolah();
      loadSekolahMaster(); // segar senarai rujukan utama di seluruh app
    } else {
      errEl.textContent = (r&&r.msg)||'Ralat semasa menambah sekolah.'; errEl.style.display='block';
    }
  }catch(e){ hideOv(); errEl.textContent='Ralat: '+e.message; errEl.style.display='block'; }
}

function sekMulaEdit(kod){
  var row = document.getElementById('sek-row-'+kod); if(!row) return;
  var s = _sekolahList.find(function(x){return x.kod===kod;}); if(!s) return;
  row.innerHTML = '<div class="db" style="flex:1;display:flex;gap:.4rem;align-items:center;">'
    +'<span style="font-family:monospace;font-weight:800;color:var(--red);font-size:.68rem;">'+esc(kod)+'</span>'
    +'<input type="text" id="sek-edit-nama-'+kod+'" value="'+esc(s.nama)+'" style="flex:1;padding:.32rem .5rem;border:1.5px solid var(--red);border-radius:6px;font-size:.72rem;text-transform:uppercase;">'
    +'</div>'
    +'<button class="btn bs bsm" style="font-size:.62rem;" onclick="_renderSenaraiSekolah()">✕</button>'
    +'<button class="btn bsm" style="background:#27ae60;color:#fff;font-size:.62rem;" onclick="sekSimpanEdit(\''+kod+'\')">✓ Simpan</button>';
  setTimeout(function(){ var i=document.getElementById('sek-edit-nama-'+kod); if(i){i.focus();i.select();} },80);
}

async function sekSimpanEdit(kod){
  var input = document.getElementById('sek-edit-nama-'+kod);
  var namaBaru = (input&&input.value||'').trim();
  if(!namaBaru){ toast('Nama sekolah tidak boleh kosong','er'); return; }
  showOv('MENGEMASKINI...');
  try{
    var r = await run('kemaskiniSekolahGS',{kod:kod, nama:namaBaru});
    hideOv();
    if(r&&r.ok){
      toast(r.msg||'Sekolah dikemaskini','ok');
      await _muatSenaraiSekolah();
      loadSekolahMaster(); // segar senarai rujukan utama di seluruh app
    } else {
      toast((r&&r.msg)||'Ralat semasa kemaskini','er');
      _renderSenaraiSekolah();
    }
  }catch(e){ hideOv(); toast('Ralat: '+e.message,'er'); }
}

function akLulus(noKP){
  var id = noKP.replace(/\D/g,'');
  var sel = document.getElementById('role-sel-'+id);
  var role = sel ? sel.value : 'guru';
  _akKemaskini(noKP,'AKTIF',role);
}function akTolak(noKP){ _akKemaskini(noKP,'TOLAK',null); }
function akNyahaktif(noKP){ _akKemaskini(noKP,'TOLAK',null); }
function akAktifSemula(noKP){ _akKemaskini(noKP,'AKTIF',null); }
function akTukarRole(noKP){
  var id = noKP.replace(/\D/g,'');
  var sel = document.getElementById('role-sel-'+id);
  var role = sel ? sel.value : null;
  _akKemaskini(noKP,'AKTIF',role);
}

