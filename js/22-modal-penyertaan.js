// == MODAL DAFTAR / EDIT PENYERTAAN ============================================
// Borang penyertaan (sel-info, sbox-sekolah, peny-form-wrap) dialihkan ke dalam #mo-peny (ID kekal — semua fungsi sedia ada berfungsi).
// Halaman Penyertaan hanya menyimpan pemilih program; klik program -> modal DAFTAR PENYERTAAN.
// Edit penyertaan (butang DATA -> EDIT / modal tugasan) membuka modal EDIT PENYERTAAN di atas halaman SEMASA; selesai/tutup -> kekal pada halaman sebelumnya.
var _penyModalInited = false;

function penyModalAktif(){ var m=document.getElementById('mo-peny'); return !!(m&&m.classList.contains('on')); }
function penyModalJudul(){
  var e=document.getElementById('peny-modal-judul'); if(!e) return;
  var nm=(typeof selNm!=='undefined'&&selNm)?(' — '+selNm):'';
  e.textContent=((typeof isEdit!=='undefined'&&isEdit)?'✏️ EDIT PENYERTAAN':'📝 DAFTAR PENYERTAAN')+nm;
}
// Buka modal dengan penunjuk memuatkan DALAM modal (sebelum data sedia)
function penyModalMuat(msg, modEdit){
  var b=document.getElementById('peny-modal-body'), ld=document.getElementById('peny-modal-ld'), m=document.getElementById('peny-modal-ld-msg');
  if(m) m.textContent=msg||'Memuatkan...';
  if(ld) ld.style.display='flex';
  if(b) b.classList.add('peny-muat');
  var j=document.getElementById('peny-modal-judul'); if(j) j.textContent=modEdit?'✏️ EDIT PENYERTAAN':'📝 DAFTAR PENYERTAAN';
  openMoOnce('mo-peny');
}
function penyModalBuka(){
  var b=document.getElementById('peny-modal-body'), ld=document.getElementById('peny-modal-ld');
  if(ld) ld.style.display='none';
  if(b) b.classList.remove('peny-muat');
  penyModalJudul();
  openMoOnce('mo-peny');
  if(typeof _resetIdleTimer==='function') _resetIdleTimer();
}
// skipReset: tutup sahaja (dipanggil juga daripada resetPeny — elak gelung)
function penyModalTutup(skipReset){
  var b=document.getElementById('peny-modal-body'), ld=document.getElementById('peny-modal-ld');
  if(ld) ld.style.display='none';
  if(b) b.classList.remove('peny-muat');
  if(penyModalAktif()) closeMo('mo-peny');
}
// Butang TUTUP pengguna: edit -> sahkan buang perubahan; daftar baharu -> simpan draf & tutup
function penyModalTutupUser(){
  if(typeof isEdit!=='undefined' && isEdit){
    askConfirm('✕ TUTUP EDIT PENYERTAAN','Perubahan yang belum dihantar akan hilang. Tutup?',function(){ resetPeny(); });
    return;
  }
  try{ if(typeof _penyAutoSave==='function') _penyAutoSave(); }catch(e){}
  penyModalTutup(true);
  if(typeof selId!=='undefined' && selId && typeof toast==='function') toast('Draf disimpan automatik — buka semula untuk menyambung.','in');
}

function penyModalInit(){
  if(_penyModalInited) return;
  var body=document.getElementById('peny-modal-body'); if(!body||!document.getElementById('peny-form-wrap')) return;
  _penyModalInited=true;
  // Alihkan bahagian borang (ID kekal) ke dalam modal
  ['sel-info','sbox-sekolah','peny-form-wrap'].forEach(function(id){ var el=document.getElementById(id); if(el) body.appendChild(el); });
  // Modal pengesahan mesti di peringkat body (jika tidak, tersembunyi bila halaman Penyertaan tidak aktif)
  var pg=document.getElementById('mo-pengesahan'); if(pg) document.body.appendChild(pg);
  // Kemas tajuk bila mod KEMASKINI diaktifkan (sel-edit-info dipaparkan oleh onSekSelect)
  var se=document.getElementById('sel-edit-info');
  if(se && window.MutationObserver){ new MutationObserver(penyModalJudul).observe(se,{attributes:true,attributeFilter:['style']}); }
}
penyModalInit();

// -- Sambung ke fungsi sedia ada ------------------------------------------------
(function(){
  if(typeof pilihProg==='function'){
    var _pilihAsal=pilihProg;
    pilihProg=function(){ var r=_pilihAsal.apply(this,arguments); penyModalBuka(); return r; };
  }
  if(typeof _restorePenyDraft==='function'){
    var _restoreAsal=_restorePenyDraft;
    _restorePenyDraft=function(){ var r=_restoreAsal.apply(this,arguments); penyModalBuka(); return r; };
  }
  if(typeof resetPeny==='function'){
    var _resetAsal=resetPeny;
    resetPeny=function(){ var r=_resetAsal.apply(this,arguments); penyModalTutup(true); return r; };
  }
})();
