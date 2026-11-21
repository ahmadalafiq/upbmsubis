// == MODAL KERJA: tukar KANDUNGAN, bukan modal ======================================
// Apabila satu modal kerja (DATA, Rumusan, Edit Program, Daftar/Edit Penyertaan, Daftar Program) sudah terbuka dan fungsi lain
// membuka modal kerja lain, bingkai & latar kekal — hanya kandungan bertukar (tiada animasi tutup+buka bertindih, tiada kelip latar,
// kunci skrol/bilangan modal/fokus asal dikekalkan). Dialog sebenar (pengesahan, PIN, dsb.) masih bertindih seperti biasa.
var _WS_MODAL = {'mo-lihat':1,'mo-rum':1,'mo-edit':1,'mo-peny':1,'mo-daftar-prog':1};
var _ws = {tutupId:'', tutupT:0, kembali:null};
function _wsLain(id){
  var r=null; Array.prototype.forEach.call(document.querySelectorAll('.mo.on'),function(m){ if(_WS_MODAL[m.id] && m.id!==id) r=m; });
  return r;
}
(function(){
  var _om=openMo, _cm=closeMo;
  // rekod modal kerja yang baru ditutup (fungsi lama biasanya closeMo(A) kemudian openMo(B) dalam satu giliran)
  closeMo=function(id){ var el=document.getElementById(id), adaOn=!!(el&&el.classList.contains('on')); var r=_cm.apply(this,arguments); if(_WS_MODAL[id]&&adaOn){ _ws.tutupId=id; _ws.tutupT=Date.now(); } return r; };
  openMo=function(id){
    if(!_WS_MODAL[id]) return _om.apply(this,arguments);
    var el=document.getElementById(id); if(el&&el.classList.contains('on')) return _om.apply(this,arguments);
    var lain=_wsLain(id), baru=(!lain && _ws.tutupId && _ws.tutupId!==id && (Date.now()-_ws.tutupT)<150);
    if(!lain && !baru) return _om.apply(this,arguments);
    // --- PERTUKARAN KANDUNGAN ---
    var b=document.body; b.classList.add('ws-swap');
    if(lain){
      lain.classList.remove('on');                        // tutup tanpa menyentuh kiraan modal / kunci skrol / tindanan fokus
      var r=_om.apply(this,arguments);                    // buka baharu (kiraan +1, fokus ditolak)
      _moOpenCount=Math.max(0,_moOpenCount-1);            // modal lama sudah diganti -> kiraan bersih tidak berubah
      if(_moFocusStack.length>1) _moFocusStack.pop();      // kekalkan fokus asal (pencetus pertama) untuk dipulihkan semasa tutup akhir
    } else { var r=_om.apply(this,arguments); }
    if(el){ el.classList.add('ws-in'); setTimeout(function(){ el.classList.remove('ws-in'); },220); }
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ b.classList.remove('ws-swap'); }); });
    return r;
  };
})();
