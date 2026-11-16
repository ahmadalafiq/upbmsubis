// == FORCE HURUF BESAR — semua medan input teks pengguna ditukar ke UPPERCASE secara automatik ==
// Dikecualikan: PIN (mesti kekal nombor asal), email, nombor, tel, tarikh, dan medan tersembunyi/kata laluan.
(function(){
  var EXCLUDE_TYPES = {password:1,email:1,date:1,hidden:1,checkbox:1,radio:1,file:1,range:1,color:1,month:1,week:1,time:1};
  function _shouldSkip(el){
    if(!el || (el.tagName!=='INPUT' && el.tagName!=='TEXTAREA')) return true;
    var type=(el.type||'text').toLowerCase();
    if(EXCLUDE_TYPES[type]) return true;
    if(/pin/i.test(el.id||'')) return true; // medan PIN (nombor 6-digit) — jangan uppercase
    return false;
  }
  document.addEventListener('input', function(e){
    var el=e.target;
    if(_shouldSkip(el)) return;
    var upper=el.value.toUpperCase();
    if(upper!==el.value){
      var s=el.selectionStart, en=el.selectionEnd;
      el.value=upper;
      try{ el.setSelectionRange(s,en); }catch(ex){}
    }
  }, true);
})();

// == SUPABASE REALTIME (2-HALA SYNC — SENYAP DI BELAKANG TABIR) ===============
// P12: Sebelum ini SETIAP perubahan (mana-mana sekolah/program) trigger reload
// PENUH (spinner/overlay) untuk SEMUA pengguna online — punca skrin "sentiasa
// memuatkan semula" bila ramai akses serentak. Sekarang: kumpul perubahan
// dalam queue, kemaskini data DI BELAKANG TABIR (tanpa spinner/overlay, tanpa
// reset scroll), dan tangguh sepenuhnya jika pengguna sedang isi borang/modal.
var _realtimeBustTimer = null;
var _realtimeQueue = [];

function _initRealtimeSync() {
  if (!sb) return;

  function _queueChange(payload) {
    _realtimeQueue.push(payload);
    clearTimeout(_realtimeBustTimer);
    _realtimeBustTimer = setTimeout(_flushRealtimeQueueSilently, 2000); // 2 saat — kumpul burst jadi 1 kemaskini
  }

  function _flushRealtimeQueueSilently() {
    var batch = _realtimeQueue.splice(0, _realtimeQueue.length);
    if (!batch.length) return;

    // Tangguh sepenuhnya (bukan buang) jika borang/modal aktif — proses lepas ditutup
    if (document.getElementById('ov').classList.contains('on') ||
        (document.querySelector('.pg.on')||{}).id==='pg-peserta' && _isPenyFormAktif() ||
        (document.querySelector('.pg.on')||{}).id==='pg-pengelola' && document.getElementById('mo-edit').classList.contains('on')) {
      _realtimeQueue = batch.concat(_realtimeQueue);
      clearTimeout(_realtimeBustTimer);
      _realtimeBustTimer = setTimeout(_flushRealtimeQueueSilently, 2000);
      return;
    }

    cBust(); // kosongkan cache klien untuk fetch akan datang
    var activePg = (document.querySelector('.pg.on')||{}).id||'';
    var scrollY = window.scrollY;

    function _restoreScroll(){ requestAnimationFrame(function(){ window.scrollTo({top: scrollY}); }); }

    // silent=true -> tiada spinner/overlay/reset UI, data dikemaskini terus di belakang tabir
    if(activePg==='pg-dashboard'){ loadDash(false, true); _restoreScroll(); }
    else if(activePg==='pg-pengelola'){ loadProgs(false, true); _restoreScroll(); }
    else if(activePg==='pg-peserta'){ loadProgsForPeny(false, null, true); _restoreScroll(); }
    else if(activePg==='pg-akaun'){ loadAkaun(false, true); _restoreScroll(); }
  }

  sb.channel('db-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: TBL_PROGRAM }, _queueChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: TBL_PENYERTAAN }, _queueChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: TBL_PENCAPAIAN }, _queueChange)
    .subscribe(function(status) {
      console.log('Status Realtime Supabase:', status);
    });
}

var LOGO_URL='https://drive.google.com/thumbnail?id=16W_2I2bcuea1YwDnya0v-M94AGB-A1A3&sz=w400';
var LOGO_FULL='https://drive.google.com/thumbnail?id=16W_2I2bcuea1YwDnya0v-M94AGB-A1A3&sz=w800';
var selId='',selNm='',isEdit=false,editKod='';
var _salinanPayload=null,_salinanRows=null; // simpan data hantar terakhir untuk MUAT TURUN PDF (fallback bila window.print() disekat, cth: embed Google Sites)
var gCnt=0,pCnt=0;
var eId='',eNm='',eKat='INDIVIDU';
var _pps={},_gps={},_curPny=[],_curPnc=[];
var pAct=null,markahOpen=false;
var _rk={sek:{},pes:{},guru:{}};
var _aP=[],_aPnc=[],_aPg=[],_allProg=[],_allPny=[];
var _selTahun = new Date().getFullYear(); // tahun aktif, default tahun semasa

// == GLOBAL HELPER — HTML escape (selamat untuk semua innerHTML) ==============
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
// hlMatch — highlight padanan carian dalam teks (digunakan oleh renderPenyList)
function hlMatch(str,q){
  if(!str||!q) return str||'';
  var re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
  return String(str).replace(re,'<mark style="background:#fff3cd;color:#333;border-radius:2px;padding:0 1px;">$1</mark>');
}

// JADUAL 6: MARKAH PELIBATAN — Sekolah tiada opsyen Pelibatan (0), Zon & Daerah digabung sebagai satu peringkat DAERAH
var MARKAH={
   SEKOLAH:     {PERTAMA:8,  KEDUA:7,  KETIGA:6, KEEMPAT:5, BERSAMA:6, KELIMA:4, PELIBATAN1:0,  PELIBATAN2:0,  PELIBATAN3:0},
  DAERAH:      {PERTAMA:11, KEDUA:10,  KETIGA:9, KEEMPAT:8, BERSAMA:9, KELIMA:7, PELIBATAN1:11, PELIBATAN2:8,  PELIBATAN3:4},
  BAHAGIAN:    {PERTAMA:14, KEDUA:13, KETIGA:12, KEEMPAT:11, BERSAMA:12, KELIMA:10, PELIBATAN1:12, PELIBATAN2:9,  PELIBATAN3:5},
  NEGERI:      {PERTAMA:14, KEDUA:13, KETIGA:12, KEEMPAT:11, BERSAMA:12, KELIMA:10, PELIBATAN1:14, PELIBATAN2:10, PELIBATAN3:6},
  KEBANGSAAN:  {PERTAMA:17, KEDUA:16, KETIGA:15, KEEMPAT:14, BERSAMA:15, KELIMA:13, PELIBATAN1:17, PELIBATAN2:12, PELIBATAN3:8},
  ANTARABANGSA:{PERTAMA:20, KEDUA:19, KETIGA:18, KEEMPAT:17, BERSAMA:18, KELIMA:16, PELIBATAN1:20, PELIBATAN2:15, PELIBATAN3:10}
};
var PER_ORDER=['ANTARABANGSA','KEBANGSAAN','NEGERI','BAHAGIAN','DAERAH','SEKOLAH'];
var TPT_STANDARD=[{k:'t1',l:'TEMPAT PERTAMA'},{k:'t2',l:'TEMPAT KEDUA'},{k:'t3',l:'TEMPAT KETIGA'},{k:'t4',l:'TEMPAT KEEMPAT'},{k:'t5',l:'TEMPAT KELIMA'}];
var TPT_TERBUKA=[{k:'t1',l:'TEMPAT PERTAMA'},{k:'t2',l:'TEMPAT KEDUA'},{k:'t3',l:'TEMPAT KETIGA'},{k:'t4',l:'TEMPAT KEEMPAT'},{k:'t5',l:'TEMPAT KELIMA'}];
function getTPT(kat){ var k=String(kat||'').toUpperCase(); return (k==='TERBUKA INDIVIDU'||k==='TERBUKA BERKUMPULAN'||k==='TERBUKA') ? TPT_TERBUKA : TPT_STANDARD; }
var DAYS=['Ahad','Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu'];
var MTHS=['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogs','Sep','Okt','Nov','Dis'];

// ISU 5: Normalisasi label Peringkat + amaran bila tak sepadan — elak fallback senyap ke skala SEKOLAH (yang zerokan Pelibatan)
var PERINGKAT_ALIAS={
  'BAHAGIAN SABAH SARAWAK':'BAHAGIAN','ZON':'DAERAH','ZON DAERAH':'DAERAH','DAERAH ZON':'DAERAH',
  'MALAYSIA':'KEBANGSAAN','KEBANGSAAN MALAYSIA':'KEBANGSAAN','DUNIA':'ANTARABANGSA','ANTARABANGSA DUNIA':'ANTARABANGSA'
};
var _peringkatWarnings=[]; // label Peringkat tak dikenali — semak di sini untuk audit data (window._peringkatWarnings)
function _normPeringkat(per){
  var p=(per||'').toUpperCase().trim();
  if(MARKAH[p]) return p;
  var stripped=p.replace(/[().\/]/g,' ').replace(/\s+/g,' ').trim();
  if(MARKAH[stripped]) return stripped;
  if(PERINGKAT_ALIAS[stripped]) return PERINGKAT_ALIAS[stripped];
  for(var key in PERINGKAT_ALIAS){ if(stripped.indexOf(key)>-1) return PERINGKAT_ALIAS[key]; }
  // Tak sepadan langsung selepas normalisasi — rekod amaran, guna DAERAH sebagai fallback (bukan SEKOLAH yg zerokan Pelibatan)
  if(p && _peringkatWarnings.indexOf(p)<0) _peringkatWarnings.push(p);
  return 'DAERAH';
}
function mPts(per,tempat){
  var perN=_normPeringkat(per);
  var m=MARKAH[perN]||MARKAH.DAERAH, t=(tempat||'').toUpperCase();
  if(t.indexOf('PERTAMA')>-1)return m.PERTAMA;
  if(t.indexOf('KEDUA')>-1)return m.KEDUA;
  if(t.indexOf('KETIGA')>-1)return m.KETIGA;
  if(t.indexOf('KEEMPAT')>-1)return m.KEEMPAT;
  if(t.indexOf('BERSAMA')>-1)return m.BERSAMA;
  if(t.indexOf('KELIMA')>-1)return m.KELIMA;
  // JADUAL 6: Pelibatan III/II diperiksa dahulu (elak 'PELIBATAN III' silap sepadan dgn 'PELIBATAN I')
  if(t==='PELIBATAN III'||t.indexOf('PELIBATAN III')>-1)return m.PELIBATAN3;
  if(t==='PELIBATAN II'||t.indexOf('PELIBATAN II')>-1)return m.PELIBATAN2;
  if(t==='PELIBATAN I'||t.indexOf('PELIBATAN I')>-1)return m.PELIBATAN1;
  return m.PELIBATAN1;
}

// == CLIENT CACHE (in-memory, 3 minit TTL) ============
var _C={};
function cGet(k){var e=_C[k];return(e&&Date.now()-e.t<180000)?e.v:null;}
function cSet(k,v){_C[k]={v:v,t:Date.now()};}
function cBust(){_C={};}

// ── PEMILIH TAHUN ────────────────────────────────────────────────────────────
function onTahunChange(){
  var v = document.getElementById('sel-tahun').value;
  _selTahun = v || new Date().getFullYear();
  cBust();
  loadProgs(true);
  loadProgsForPeny(true);
  loadDash(true);
}

async function initTahunSel(){
  try{
    var r = await run('getTahunListGS');
    var list = (r && r.list) || [];
    var curY = new Date().getFullYear();
    if(list.indexOf(curY) < 0) list.unshift(curY);
    var sel = document.getElementById('sel-tahun');
    sel.innerHTML = '';
    var optSemua = document.createElement('option');
    optSemua.value = 'SEMUA'; optSemua.textContent = '— SEMUA TAHUN —';
    if(!_sesi || _sesi.role !== 'admin') optSemua.style.display = 'none';
    sel.appendChild(optSemua);
    list.forEach(function(y){
      var o = document.createElement('option');
      o.value = y; o.textContent = y;
      if(Number(y) === Number(_selTahun)) o.selected = true;
      sel.appendChild(o);
    });
    sel.value = String(_selTahun);
    document.getElementById('tahun-sel-wrap').style.display = 'flex';
  }catch(e){
    console.warn('initTahunSel gagal:', e);
  }
}
var RFN={getProgramsGS:1,getAllDataGS:1,getRumusanGS:1,getPenyertaanByProgramGS:1,getEditDataGS:1,getTahunListGS:1};

// Fungsi tulis sensitif yang memerlukan semakan role di server
var _WRITE_FNS = {
  daftarProgramGS:1, kemaskiniProgramGS:1, padamProgramGS:1,
  simpanPencapaianGS:1, hantarPenyertaanGS:1, kemaskiniPenyertaanSekolahGS:1,
  resetPinGS:1, kemaskiniAkaunGS:1,
  tambahSekolahGS:1, kemaskiniSekolahGS:1, seedSekolahGS:1, kemaskiniMaklumatPenggunaGS:1
};

function run(fn,payload){
  // Suntik maklumat pemanggil untuk semakan sisi server pada fungsi tulis
  if(_WRITE_FNS[fn] && _sesi){
    payload = payload || {};
    if(_sesi.role === 'admin' && !_sesi.kodSekolah){
      payload.callerIsAdmin = true;
    } else {
      payload.callerNoKP = _sesi.noKP || '';
    }
  }
  // Suntik tahun aktif ke dalam panggilan getAllDataGS
  if(fn === 'getAllDataGS'){
    payload = payload || {};
    payload.tahun = _selTahun;
  }
  var ck=fn+(payload!=null?JSON.stringify(payload):'');
  if(RFN[fn]){
    var h=cGet(ck);
    if(h)return Promise.resolve(h);
  }
  return new Promise(function(res,rej){
    // Timeout 60 saat — elak spinner tergantung jika Supabase tidak balas
    var tOut=setTimeout(function(){
      rej(new Error('Masa tamat (60s). Sila semak sambungan dan cuba lagi.'));
    },60000);
    _supaDispatch(fn, payload!=null?payload:{})
      .then(function(v){
        clearTimeout(tOut);
        var r=v||{ok:true};
        if(RFN[fn])cSet(ck,r); else cBust();
        res(r);
      })
      .catch(function(e){
        clearTimeout(tOut);
        var msg=e&&e.message?e.message:String(e);
        if(msg.toLowerCase().indexOf('jwt')>=0||msg.toLowerCase().indexOf('permission denied')>=0||msg.indexOf('row-level security')>=0){
          msg='Akses pangkalan data ditolak. Sila semak konfigurasi RLS/Policy Supabase anda.';
        }
        rej(new Error(msg));
      });
  });
}

// == CLOCK ============================================
(function tick(){
  var n=new Date();
  var hh=String(n.getHours()).padStart(2,'0'),mm=String(n.getMinutes()).padStart(2,'0'),ss=String(n.getSeconds()).padStart(2,'0');
  document.getElementById('nct').textContent=hh+':'+mm+':'+ss;
  document.getElementById('ncd').textContent=DAYS[n.getDay()]+', '+n.getDate()+' '+MTHS[n.getMonth()]+' '+n.getFullYear();
  setTimeout(tick,1000);
})();

// == OVERLAY ==========================================
function showOv(m){document.getElementById('ov-msg').textContent=m||'SILA TUNGGU SEBENTAR...';document.getElementById('ov').classList.add('on');document.body.classList.add('modal-open');}
function hideOv(){document.getElementById('ov').classList.remove('on');if(_moOpenCount===0)document.body.classList.remove('modal-open');}
function setBtn(id,d){var b=document.getElementById(id);if(b)b.disabled=d;}

// == NAV ==============================================

// Semak sama ada borang penyertaan sedang aktif diisi
function _isPenyFormAktif(){
  // Borang aktif jika: (1) tab peserta sedang aktif, (2) program dipilih, (3) sekolah dipilih, (4) borang dipapar
  var pgPeserta = document.getElementById('pg-peserta');
  if(!pgPeserta || !pgPeserta.classList.contains('on')) return false;
  var formWrap = document.getElementById('peny-form-wrap');
  if(!formWrap || formWrap.style.display==='none') return false;
  var selNama = document.getElementById('sel-name');
  if(!selNama || !selNama.textContent.trim()) return false;
  var kodEl = document.getElementById('daf-kod');
  if(!kodEl || !kodEl.value.trim()) return false;
  return true;
}

// Paparkan dialog pengesahan tinggalkan penyertaan
// pgTujuOrFn: nama tab (string) untuk _doShowPage, ATAU fungsi callback (cth. utk logout)
function _tunjukDialogTinggal(pgTujuOrFn){
  var progName = (document.getElementById('sel-name')||{}).textContent || 'ini';
  var nameEl = document.getElementById('tinggal-prog-name');
  if(nameEl) nameEl.textContent = progName;

  // Tetapkan tindakan butang
  document.getElementById('tinggal-btn-terus').onclick = function(){
    closeMo('mo-tinggal');
  };
  document.getElementById('tinggal-btn-pergi').onclick = function(){
    closeMo('mo-tinggal');
    // Reset penyertaan dulu, kemudian teruskan
    resetPeny();
    if(typeof pgTujuOrFn === 'function') pgTujuOrFn();
    else _doShowPage(pgTujuOrFn);
  };

  openMo('mo-tinggal');
}

// Pelaksana sebenar tukar tab (tanpa semakan)
function _doShowPage(pg){
  // P11: Tutup semua modal sebelum tukar tab
  document.querySelectorAll('.mo.on').forEach(function(m){m.classList.remove('on');});
  _moOpenCount=0;
  if(typeof _moFocusStack!=='undefined')_moFocusStack=[];
  document.body.classList.remove('modal-open');
  document.body.style.overflow='';
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
  document.querySelectorAll('.nt').forEach(function(t){t.classList.remove('on');});
  var pgEl=document.getElementById('pg-'+pg); if(pgEl) pgEl.classList.add('on');
  var ntEl=document.querySelector('[data-pg="'+pg+'"]'); if(ntEl)ntEl.classList.add('on');
  bnavSet(pg);
  _resetTabFilters(pg);
  if(pg==='pengelola')loadProgs(false);
  if(pg==='peserta'){loadProgsForPeny(false);setTimeout(_checkPenyDraft,800);}
  if(pg==='dashboard')loadDash(false);
  if(pg==='akaun')loadAkaun(false);
}

function showPage(pg){
  // Semak jika user cuba keluar dari tab penyertaan ketika borang sedang diisi
  var semasa = (document.querySelector('.pg.on')||{}).id||'';
  if(semasa === 'pg-peserta' && pg !== 'peserta' && _isPenyFormAktif()){
    _tunjukDialogTinggal(pg);
    return;
  }
  _doShowPage(pg);
}

// Reset semua filter dan UI elements apabila tukar ke tab tertentu
function _resetTabFilters(pg){
  if(pg==='pengelola'){
    var fb=document.getElementById('flt-bulan');
    var fbd=document.getElementById('flt-bidang');
    var clr=document.getElementById('btn-flt-clr');
    if(fb)fb.value='';
    if(fbd)fbd.value='';
    if(clr)clr.style.display='none';
    if(typeof applyProgFilt==='function')applyProgFilt();
  }
  if(pg==='peserta'){
    var pb=document.getElementById('peny-flt-bulan');
    var pbd=document.getElementById('peny-flt-bidang');
    var psr=document.getElementById('peny-srch');
    if(pb)pb.value='';
    if(pbd)pbd.value='';
    if(psr){psr.value='';}
    if(typeof applyPenyFilt==='function')applyPenyFilt();
  }
  if(pg==='dashboard'){
    // Reset bidang filter ke keseluruhan
    if(typeof setDashBidang==='function')setDashBidang('semua');
  }
  if(pg==='akaun'){
    // Reset akaun filter ke semua
    if(typeof akFilt==='function')akFilt('semua');
    var akc=document.getElementById('ak-cari');
    if(akc){akc.value=''; if(typeof akCari==='function')akCari('');}
  }
}

// == MARKAH TOGGLE ====================================
function togMarkah(){
  markahOpen=!markahOpen;
  var b=document.getElementById('mb-body'),btn=document.getElementById('mb-btn');
  b.classList.toggle('cls',!markahOpen);
  btn.textContent=markahOpen?'▲ TUTUP':'▼ BUKA';
}
function buildMarkahGrid(){
  document.getElementById('mgrid').innerHTML=
    ['SEKOLAH','DAERAH','BAHAGIAN','NEGERI','KEBANGSAAN','ANTARABANGSA'].map(function(p){
      var m=MARKAH[p];
      return '<div class="mcard"><div class="mp">'+p+'</div>'
        +[['PERTAMA','TEMPAT PERTAMA'],['KEDUA','TEMPAT KEDUA'],['KETIGA','TEMPAT KETIGA'],['KEEMPAT','TEMPAT KEEMPAT'],['KELIMA','TEMPAT KELIMA']]
        .map(function(t){return '<div class="mr"><span>'+t[1]+'</span><span>'+m[t[0]]+'PT</span></div>';}).join('')
        +'</div>';
    }).join('');
}

// == PIN ==============================================
// == CUSTOM CONFIRM (ganti window.confirm() yang disekat dalam iframe) =======
function askConfirm(title, msg, onYes, onNo) {
  document.getElementById('cfm-tit').textContent = title;
  document.getElementById('cfm-msg').textContent = msg;
  document.getElementById('cfm-ok').onclick = function() { closeMo('mo-cfm'); onYes(); };
  document.getElementById('cfm-batal').onclick = function() {
    closeMo('mo-cfm');
    if(typeof onNo === 'function') onNo();
  };
  openMo('mo-cfm');
}

function askPin(tit,desc,cb){
  document.getElementById('pin-tit').textContent=tit;
  document.getElementById('pin-desc').textContent=desc;
  document.getElementById('pin-inp').value='';
  document.getElementById('pin-err').textContent='';
  pAct=cb; openMo('mo-pin');
  setTimeout(function(){document.getElementById('pin-inp').focus();},180);
}
async function doPin(){
  var pin=document.getElementById('pin-inp').value.trim();
  if(!pin){document.getElementById('pin-err').textContent='Sila masukkan PIN';return;}
  document.getElementById('pin-err').textContent='';
  showOv('MENGESAHKAN PIN...');
  try{
    var r=await run('verifyPinGS',{pin:pin});
    hideOv();
    if(r&&r.ok){closeMo('mo-pin');if(pAct)pAct(r.role,r.kod,pin);pAct=null;}
    else document.getElementById('pin-err').textContent=(r&&r.msg)||'PIN tidak sah.';
  }catch(e){hideOv();document.getElementById('pin-err').textContent='Ralat: '+e.message;}
}

