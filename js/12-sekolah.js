// == SENARAI SEKOLAH STATIK (dari fail rasmi) =======================
var _SEKOLAH_STATIK = [
  {kod:'YCC4402',nama:'SJK(C) CHEE MUNG'},
  {kod:'YCC4403',nama:'SJK(C) CHIN NAM'},
  {kod:'YCC4404',nama:'SJK(C) CHUNG HUA SUNGAI LUMUT'},
  {kod:'YCC4401',nama:'SJK(C) CHUNG HUA SIBUTI'},
  {kod:'YBB4412',nama:'SK BATU NIAH'},
  {kod:'YBB4408',nama:'SK BATU TELLINGAI'},
  {kod:'YBA4407',nama:'SK BEKENU'},
  {kod:'YBA4405',nama:'SK BELIAU AHAD'},
  {kod:'YBB4401',nama:'SK BELIAU ISA'},
  {kod:'YBB4423',nama:'SK KELAPA SAWIT NO 1'},
  {kod:'YBB4426',nama:'SK KELAPA SAWIT NO 2'},
  {kod:'YBB4427',nama:'SK KELAPA SAWIT NO 3'},
  {kod:'YBA4402',nama:'SK KELAPA SAWIT NO 4'},
  {kod:'YBB4429',nama:'SK KELAPA SAWIT NO 5'},
  {kod:'YBA4417',nama:'SK KELURU TENGAH'},
  {kod:'YBA4406',nama:'SK KITA'},
  {kod:'YBA4403',nama:'SK KAMPUNG ANGUS'},
  {kod:'YBB4418',nama:'SK KAMPUNG BULAU'},
  {kod:'YBB4406',nama:'SK KAMPUNG BUNGAI'},
  {kod:'YBB4403',nama:'SK KAMPUNG IRAN'},
  {kod:'YBB4416',nama:'SK KAMPUNG KUALA SIBUTI'},
  {kod:'YBA4404',nama:'SK KAMPUNG MASJID'},
  {kod:'YBA4411',nama:'SK KAMPUNG SELANYAU'},
  {kod:'YBB4421',nama:'SK KAMPUNG SUBAK'},
  {kod:'YBB4411',nama:'SK KAMPUNG TARIKAN'},
  {kod:'YBB4422',nama:'SK KAMPUNG TEGAGENG'},
  {kod:'YBA4412',nama:'SK RANCANGAN SEPUPOK'},
  {kod:'YBB4404',nama:'SK RUMAH BARAT'},
  {kod:'YBB4430',nama:'SK RUMAH ESSAU'},
  {kod:'YBB4407',nama:'SK RUMAH GOYANG'},
  {kod:'YBA4415',nama:'SK RUMAH MENTALI'},
  {kod:'YBB4413',nama:'SK RUMAH RANGGONG'},
  {kod:'YBB4405',nama:'SK RUMAH TINGGI'},
  {kod:'YBA4413',nama:'SK RUMAH UNDI'},
  {kod:'YBB4419',nama:'SK SUNGAI BAKAS'},
  {kod:'YBB4415',nama:'SK SUNGAI LAMAUS'},
  {kod:'YBB4409',nama:'SK SUNGAI MANONG'},
  {kod:'YBB4414',nama:'SK SUNGAI SAEH'},
  {kod:'YBB4425',nama:'SK SUNGAI SEBATU'},
  {kod:'YBB4410',nama:'SK SUNGAI TANGAP'},
  {kod:'YBA4414',nama:'SK SUAI 1'},
  {kod:'YBA4416',nama:'SK TANJUNG BELIPAT'},
  {kod:'YBA4408',nama:'SK TAWAKAL SATAP'},
  {kod:'YBA4410',nama:'SK ULU SATAP'},
  {kod:'YEE4301',nama:'SMK BAKONG'},
  {kod:'YEA4402',nama:'SMK BEKENU'},
  {kod:'YEE4401',nama:'SMK LUAR BANDAR MIRI'},
  {kod:'YEA4401',nama:'SMK SUAI'},
  {kod:'YEB4401',nama:'SMK SUBIS'},
  {kod:'Y044',nama:'PPD SUBIS'}
];
// _sekExtraDb: sekolah baharu yang ditambah semasa sesi (belum ada dalam senarai statik)
var _sekExtraDb = [];

// == SENARAI SEKOLAH KANONIK (Supabase) =========================
// _SEKOLAH_STATIK di atas kekal sebagai senarai benih/fallback permulaan.
// loadSekolahMaster() memuat senarai SEBENAR dari jadual `sekolah` dan MENGGANTI
// kandungan _SEKOLAH_STATIK secara in-place (bukan tukar rujukan pembolehubah) —
// supaya semua fungsi sedia ada (_getSekSuggestions, _buildSekKodMap, dropdown
// sekolah, dsb.) yang sudah rujuk _SEKOLAH_STATIK terus dapat data terkini
// tanpa perlu diubah satu-satu.
var _sekolahMasterLoaded = false;
async function loadSekolahMaster(){
  try{
    var r = await run('getSekolahListGS');
    if(r && r.ok && r.data && r.data.length){
      _SEKOLAH_STATIK.length = 0;
      r.data.forEach(function(s){ if(s.kod&&s.nama) _SEKOLAH_STATIK.push({kod:s.kod, nama:s.nama}); });
      _sekKodMap = null; // batalkan cache lama supaya _buildSekKodMap() bina semula
      _sekolahMasterLoaded = true;
      // Segar semula dropdown yang mungkin sudah terpapar
      _populateDafSekDropdown();
    }
  }catch(e){
    console.warn('loadSekolahMaster gagal (guna senarai statik sedia ada):', e);
  }
}

// == JENIS SEKOLAH: SR (Rendah) / SM (Menengah) ================
// Rujuk kod sekolah dalam _SEKOLAH_STATIK (+ _sekExtraDb): huruf ke-2 kod 'E' = Menengah.
var _sekKodMap = null;
function _buildSekKodMap(){
  if(_sekKodMap) return _sekKodMap;
  _sekKodMap = {};
  _SEKOLAH_STATIK.forEach(function(s){ _sekKodMap[String(s.nama||'').toUpperCase().trim()] = s.kod; });
  (_sekExtraDb||[]).forEach(function(s){ _sekKodMap[String(s.nama||'').toUpperCase().trim()] = s.kod; });
  return _sekKodMap;
}
function _jenisSekolah(namaSekolah){
  var nm = String(namaSekolah||'').toUpperCase().trim();
  if(!nm) return 'SR';
  var kod = _buildSekKodMap()[nm];
  if(kod) return kod.charAt(1)==='E' ? 'SM' : 'SR';
  // Fallback ikut corak nama bila sekolah tiada dalam senarai statik (mis. sekolah baharu belum disegerak)
  if(/^SMK\b|SEKOLAH MENENGAH/.test(nm)) return 'SM';
  return 'SR';
}
// Tapis objek skor ranking (dari getSkor) ikut jenis sekolah entiti (rujuk .sekolah setiap entri)
function _filterSkorByJenis(scores, jenis){
  if(!jenis || jenis==='SEMUA') return scores;
  var out={};
  Object.keys(scores||{}).forEach(function(k){
    if(_jenisSekolah(scores[k].sekolah)===jenis) out[k]=scores[k];
  });
  return out;
}
// State semasa toggle SEMUA/SR/SM bagi setiap kad ranking
var _rkJenisFilter = {sek:'SEMUA', pes:'SEMUA', guru:'SEMUA', pesAda:'SEMUA', pesTiada:'SEMUA', sekPenc:'SEMUA', sekPel:'SEMUA', guruAda:'SEMUA', guruTiada:'SEMUA'};
var _rkFull = {sek:{}, pes:{}, guru:{}, pesAda:{}, pesTiada:{}, sekPenc:{}, sekPel:{}, guruAda:{}, guruTiada:{}};
var _rkElMap = {
  sek:['rk-sek','btn-ms'], pes:['rk-pes','btn-mps'], guru:['rk-guru','btn-mg'],
  pesAda:['rk-pes-ada','btn-mpsa'], pesTiada:['rk-pes-tiada','btn-mpst'],
  sekPenc:['rk-sek-penc','btn-mska'], sekPel:['rk-sek-pel','btn-mskt'],
  guruAda:['rk-guru-ada','btn-mga'], guruTiada:['rk-guru-tiada','btn-mgt']
};
function _renderRkType(type){
  var cfg=_rkElMap[type]; if(!cfg) return;
  var jenis=_rkJenisFilter[type]||'SEMUA';
  var filtered=_filterSkorByJenis(_rkFull[type]||{}, jenis);
  _rk[type]=filtered; // supaya moreRank() dan showDet() guna set yang sama dgn tapisan semasa
  buildRank(cfg[0], filtered, 5, cfg[1], type);
}
function _setRkJenis(type, jenis, btnEl){
  _rkJenisFilter[type]=jenis;
  if(btnEl && btnEl.parentNode){
    Array.prototype.forEach.call(btnEl.parentNode.children, function(b){ b.classList.remove('on'); });
    btnEl.classList.add('on');
  }
  _renderRkType(type);
}

// == SEKOLAH (tab Penyertaan) — autocomplete ikut corak tab Pengelola =======
// Medan kekal teks bebas + cadangan, nilai kod sebenar disimpan dlm #daf-sek-select (hidden).
function onSugSekPeny(q){
  var drop=document.getElementById('sug-daf-sek'); if(!drop)return;
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
    el.addEventListener('mousedown',function(){pickSekPeny(decodeURIComponent(el.dataset.sugKod),decodeURIComponent(el.dataset.sugSek));});
  });
  drop.classList.add('on');
}
function pickSekPeny(kod,nama){
  var hid=document.getElementById('daf-sek-select'); if(hid) hid.value=kod;
  var vis=document.getElementById('daf-sek-search'); if(vis) vis.value=nama+' ('+kod+')';
  hideSug('sug-daf-sek');
  onSekSelect(kod);
}
// Segerak paparan teks input drpd nilai kod tersembunyi — dipanggil selepas
// kod diset secara program (draf, auto-pilih guru/pkk, dsb.)
function _syncDafSekDisplay(){
  var hid=document.getElementById('daf-sek-select'); var vis=document.getElementById('daf-sek-search');
  if(!hid||!vis) return;
  var kod=hid.value||'';
  if(!kod){ vis.value=''; return; }
  var nama=_getNamaSekolahByKod(kod);
  vis.value = nama ? (nama+' ('+kod+')') : kod;
}

function onSekSelect(kod){
  kod = String(kod||'').toUpperCase().trim();
  var sel=document.getElementById('daf-sek-select');
  var kodHidden=document.getElementById('daf-kod');
  var sekHidden=document.getElementById('daf-sek');
  var ks=document.getElementById('kod-stat');
  if(!kod){
    if(kodHidden) kodHidden.value='';
    if(sekHidden) sekHidden.value='';
    if(ks) ks.innerHTML='';
    document.getElementById('peny-form-wrap').style.display='none';
    document.getElementById('sel-edit-info').style.display='none';
    return;
  }
  var found=_SEKOLAH_STATIK.filter(function(s){return s.kod===kod;})[0];
  var nama=found?found.nama:kod;
  if(kodHidden) kodHidden.value=kod;
  if(sekHidden) sekHidden.value=nama;
  // Semak ada rekod sedia ada untuk sekolah + program ini
  if(selId && _aP && _aP.length){
    var ex=_aP.filter(function(p){return (p['Program ID']===selId||p['Nama Program']===selNm)&&String(p['Kod Sekolah']||'').toUpperCase()===kod.toUpperCase();});
    if(ex.length){
      // MOD KEMASKINI
      isEdit=true; editKod=kod.toUpperCase();
      _syncBatalBtn();
      document.getElementById('sel-edit-info').style.display='flex';
      var eksKat=_uniq(ex.map(function(r){return r['Kategori Penyertaan']||'';})).filter(Boolean);
      if(ks) ks.innerHTML='<div class="iwarn">✏️ <strong>Mod Kemaskini Aktif</strong> — '+esc(nama)+' sudah ada rekod untuk program ini (<strong>'+eksKat.join(', ')+'</strong>). Data guru dan peserta diisi semula.</div>';
      _checkKatMismatch(selId, ex);
      _prefillFromExisting(ex);
    } else {
      // PENDAFTARAN BAHARU
      isEdit=false; editKod='';
      _syncBatalBtn();
      document.getElementById('sel-edit-info').style.display='none';
      if(ks) ks.innerHTML='<div class="iok">✅ <strong>Pendaftaran Baharu</strong> — '+esc(nama)+'. Tiada rekod untuk program ini. Isi maklumat guru dan peserta.</div>';
      _penyData={guruList:[],pesList:[]}; _pGCnt=0; _pPCnt=0;
      _showPenyForm();
    }
  } else {
    isEdit=false; editKod='';
    _syncBatalBtn();
    document.getElementById('sel-edit-info').style.display='none';
    if(ks) ks.innerHTML='<div class="iok">✅ Sekolah dipilih: <strong>'+esc(nama)+'</strong>. Isi maklumat guru dan peserta.</div>';
    _penyData={guruList:[],pesList:[]}; _pGCnt=0; _pPCnt=0;
    _showPenyForm();
  }
  // Kemaskini dropdown guru & peserta mengikut sekolah yang dipilih
  renderMainGuruList(); renderMainPesList();
}

// == AUTOCOMPLETE — Kod & Nama Sekolah =======================
function _getSekSuggestions(){
  // Gabungkan: senarai statik + data dari _aP + tambahan baharu
  var seen={}, list=[];
  // 1. Senarai statik — prioriti
  _SEKOLAH_STATIK.forEach(function(s){
    var key=s.kod+'|'+s.nama;
    if(!seen[key]){seen[key]=1;list.push({nama:s.nama,kod:s.kod});}
  });
  // 2. Data dari rekod penyertaan (_aP) — mungkin ada sekolah lain
  (_aP||[]).forEach(function(p){
    var sk=String(p['Nama Sekolah']||'').toUpperCase().trim(), kd=String(p['Kod Sekolah']||'').toUpperCase().trim();
    if(!sk)return;
    var key=kd+'|'+sk;
    if(!seen[key]){seen[key]=1;list.push({nama:sk,kod:kd});}
  });
  // 3. Sekolah baharu yang ditambah semasa sesi
  _sekExtraDb.forEach(function(s){
    var key=s.kod+'|'+s.nama;
    if(!seen[key]){seen[key]=1;list.push({nama:s.nama,kod:s.kod});}
  });
  return list;
}

// Cari nama sekolah berdasarkan kod (dari senarai statik atau extra)
function _getNamaSekolahByKod(kod){
  var k=(kod||'').toUpperCase().trim();
  var found=_SEKOLAH_STATIK.filter(function(s){return s.kod===k;})[0];
  if(found) return found.nama;
  found=_sekExtraDb.filter(function(s){return s.kod===k;})[0];
  if(found) return found.nama;
  // Cuba dari _aP
  var rec=(_aP||[]).filter(function(p){return String(p['Kod Sekolah']||'').toUpperCase()===k;})[0];
  return rec ? (rec['Nama Sekolah']||'') : '';
}

function hideSug(id){
  setTimeout(function(){var d=document.getElementById(id);if(d)d.classList.remove('on');},200);
}

// == Suggestion helpers untuk borang PENDAFTARAN PROGRAM (p-pengelola / p-kod) ==
// Cadangkan padanan dari senarai sekolah kanonik supaya nama pengelola tidak
// duplikat akibat variasi ejaan. Medan kekal teks bebas (bukan dropdown ketat)
// sebab sesetengah penganjur bukan sekolah (cth: PPD SUBIS).
function onSugKodProg(q){
  if(typeof agIsOn==='function'&&agIsOn('p')) return;
  var drop=document.getElementById('sug-p-kod'); if(!drop)return;
  var v=(q||'').trim();
  if(!v){drop.innerHTML='';drop.classList.remove('on');return;}
  var lv=v.toLowerCase();
  var items=_getSekSuggestions().filter(function(s){
    return s.kod.toLowerCase().indexOf(lv)>-1||s.nama.toLowerCase().indexOf(lv)>-1;
  }).slice(0,6);
  if(!items.length){drop.innerHTML='';drop.classList.remove('on');return;}
  drop.innerHTML=items.map(function(s){
    return '<div class="sug-item" data-sug-kod="'+encodeURIComponent(s.kod)+'" data-sug-sek="'+encodeURIComponent(s.nama)+'"><span class="sug-item-ico">🔑</span><span>'+s.kod+' — '+s.nama+'</span></div>';
  }).join('');
  drop.querySelectorAll('.sug-item').forEach(function(el){
    el.addEventListener('mousedown',function(){pickSugProg(decodeURIComponent(el.dataset.sugKod),decodeURIComponent(el.dataset.sugSek));});
  });
  drop.classList.add('on');
}
function onSugPengelolaProg(q){
  if(typeof agIsOn==='function'&&agIsOn('p')) return;
  var drop=document.getElementById('sug-p-pengelola'); if(!drop)return;
  var v=(q||'').trim();
  if(!v){drop.innerHTML='';drop.classList.remove('on');return;}
  var lv=v.toLowerCase();
  var items=_getSekSuggestions().filter(function(s){
    return s.nama.toLowerCase().indexOf(lv)>-1;
  }).slice(0,6);
  if(!items.length){drop.innerHTML='';drop.classList.remove('on');return;}
  drop.innerHTML=items.map(function(s){
    return '<div class="sug-item" data-sug-kod="'+encodeURIComponent(s.kod)+'" data-sug-sek="'+encodeURIComponent(s.nama)+'"><span class="sug-item-ico">🏫</span><span>'+s.nama+'</span></div>';
  }).join('');
  drop.querySelectorAll('.sug-item').forEach(function(el){
    el.addEventListener('mousedown',function(){pickSugProg(decodeURIComponent(el.dataset.sugKod),decodeURIComponent(el.dataset.sugSek));});
  });
  drop.classList.add('on');
}
function pickSugProg(kod,nama){
  var ki=document.getElementById('p-kod'); if(ki)ki.value=kod;
  var pi=document.getElementById('p-pengelola'); if(pi)pi.value=nama;
  hideSug('sug-p-kod'); hideSug('sug-p-pengelola');
}

// == Suggestion helpers untuk borang DAFTAR AKAUN ============
// Fungsi lama (_populateDafSekDropdown / onDafSekSelect / onDafKodSekIn / onDafSugKod / onDafSugSek)
// dibuang — digantikan sepenuhnya oleh autocomplete di atas. Kekalkan sebagai no-op
// supaya panggilan sedia ada di tempat lain (jika ada) tidak ranap.
function _populateDafSekDropdown(){}
function onDafSekSelect(){}

