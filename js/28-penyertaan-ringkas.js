// == BORANG PENYERTAAN: bar kemajuan melekat, jadual peserta, tampal dari Excel =============
// Lapisan paparan di atas _penyData / renderMainGuruList / renderMainPesList (semua logik & pengesahan sedia ada kekal).
//  * Bar kemajuan melekat di atas borang: guru x/y, peserta x/y, bilangan isu + lompat ke isu (rujukan: peraturan semakPeny)
//  * Peserta dipaparkan sebagai baris jadual (skrin lebar); baris bermasalah ditanda (ri-isu) beserta medan merah
//  * Tampal terus daripada Excel (Nama [Tab] No.KP [Tab] Jantina [Tab] Bangsa) ke ruang Nama/No. KP peserta
var _ppIdx = 0, _ppT = null;
function _ppD(v){ return String(v||'').replace(/\D/g,''); }

// Senarai isu (cermin peraturan semakPeny tetapi tanpa toast)
function penyIsu(){
  var D=(typeof _penyData!=='undefined'&&_penyData)?_penyData:{guruList:[],pesList:[]}, isu=[];
  var g=(D.guruList||[]).filter(function(x){return (x.nama||'').trim();}), p=(D.pesList||[]).filter(function(x){return (x.nama||'').trim();});
  var gOk=0, pOk=0, kp={};
  g.forEach(function(x,i){
    var t=[]; if(_ppD(x.kp).length<12) t.push('No. KP tidak lengkap'); if(!x.jantina) t.push('jantina'); if(!x.bangsa) t.push('bangsa'); if(_ppD(x.tel).length<9) t.push('No. telefon');
    if(t.length) isu.push({id:x.id,jenis:'guru',teks:'Guru #'+(i+1)+' '+x.nama+': '+t.join(', ')}); else gOk++;
  });
  p.forEach(function(x){ var k=_ppD(x.kp); if(k.length===12) kp[k]=(kp[k]||0)+1; });
  p.forEach(function(x,i){
    var t=[]; if(_ppD(x.kp).length<12) t.push('No. KP tidak lengkap'); else if(kp[_ppD(x.kp)]>1) t.push('No. KP berulang'); if(!x.jantina) t.push('jantina'); if(!x.bangsa) t.push('bangsa'); if(!(x.kategori||[]).length) t.push('kategori');
    if(t.length) isu.push({id:x.id,jenis:'peserta',teks:'Peserta #'+(i+1)+' '+x.nama+': '+t.join(', ')}); else pOk++;
  });
  return {g:g.length,gOk:gOk,p:p.length,pOk:pOk,isu:isu,sedia:(g.length>0&&p.length>0&&isu.length===0)};
}
function penyProgres(){
  var wrap=document.getElementById('peny-form-wrap'), bar=document.getElementById('peny-progress');
  if(!wrap) return;
  if(!bar){ bar=document.createElement('div'); bar.id='peny-progress'; bar.className='pp-bar'; bar.setAttribute('role','status'); bar.setAttribute('aria-live','polite'); wrap.insertBefore(bar,wrap.firstChild); }
  var s=penyIsu(), nm=(typeof selNm!=='undefined'&&selNm)?selNm:'', sek=((document.getElementById('daf-sek')||{}).value||'').trim();
  var kelas=function(ok,jml){ return jml===0?'bad':(ok===jml?'ok':'warn'); };
  var h='<div class="pp-ctx">📚 <b>'+esc(nm||'—')+'</b>'+(sek?' · 🏫 '+esc(sek):'')+((typeof isEdit!=='undefined'&&isEdit)?' · <span class="pp-edit">✏ Mod kemaskini</span>':'')+'</div>'
    +'<div class="pp-chips"><span class="pp-chip '+kelas(s.gOk,s.g)+'">👨‍🏫 Guru '+s.gOk+'/'+s.g+'</span>'
    +'<span class="pp-chip '+kelas(s.pOk,s.p)+'">🧑‍🎓 Peserta '+s.pOk+'/'+s.p+'</span>'
    +(s.sedia?'<span class="pp-chip ok">✓ Sedia untuk disemak &amp; dihantar</span>'
      :(s.isu.length?'<button type="button" class="pp-chip warn pp-isu" onclick="penyLompatIsu()">⚠ '+s.isu.length+' isu — klik untuk lompat ›</button>'
        :'<span class="pp-chip bad">Tambah sekurang-kurangnya 1 guru dan 1 peserta</span>'))+'</div>';
  if(bar.getAttribute('data-h')!==h){ bar.innerHTML=h; bar.setAttribute('data-h',h); }
  // tanda baris & medan
  var peta={}; s.isu.forEach(function(x){ peta[x.id]=x.teks; });
  Array.prototype.forEach.call(document.querySelectorAll('#main-guru-list .ri, #main-pes-list .ri'),function(r){
    var id=String(r.id||'').replace(/^row-/,''), t=peta[id], kosong=!r.querySelector('input[id^="pn-"], input[id^="gn-"]')||!((r.querySelector('input[id^="pn-"], input[id^="gn-"]')||{}).value||'').trim();
    r.classList.toggle('ri-isu',!!t&&!kosong); r.classList.toggle('ri-kosong',kosong);
    if(t&&!kosong) r.setAttribute('title',t); else r.removeAttribute('title');
  });
  _ppHeader();
}
function _ppHeader(){
  var list=document.getElementById('main-pes-list'); if(!list||document.getElementById('peny-pes-head')) return;
  var hd=document.createElement('div'); hd.id='peny-pes-head'; hd.className='pp-head'; hd.setAttribute('aria-hidden','true');
  hd.innerHTML='<span>#</span><span>Nama peserta</span><span>No. KP</span><span>Jantina</span><span>Bangsa</span><span>Kategori</span><span></span>';
  list.parentNode.insertBefore(hd,list);
}
function penyLompatIsu(){
  var s=penyIsu(); if(!s.isu.length) return;
  _ppIdx=(_ppIdx+1)%s.isu.length; var x=s.isu[_ppIdx], r=document.getElementById('row-'+x.id); if(!r) return;
  try{ r.scrollIntoView({block:'center',behavior:'smooth'}); }catch(e){ r.scrollIntoView(); }
  var f=Array.prototype.filter.call(r.querySelectorAll('input[type=text],select'),function(i){ return !String(i.value||'').trim() || (i.id&&/kp-/.test(i.id)&&_ppD(i.value).length<12); })[0];
  if(f){ try{ f.focus({preventScroll:true}); }catch(e){ f.focus(); } f.classList.add('pp-bad'); setTimeout(function(){ f.classList.remove('pp-bad'); },2500); }
  r.classList.add('ri-lompat'); setTimeout(function(){ r.classList.remove('ri-lompat'); },1600);
}

// -- Tampal daripada Excel -----------------------------------------------------------------------------------------------------------
var _PP_BANGSA=['MELAYU','CINA','INDIA','KADAZAN','IBAN','BIDAYUH','ORANG ULU','BAJAU','LAIN-LAIN'];
function _ppJantina(v){ v=String(v||'').trim().toUpperCase(); if(/^(L|LELAKI|LAKI|MALE|M)$/.test(v)) return 'LELAKI'; if(/^(P|PEREMPUAN|FEMALE|F|WANITA)$/.test(v)) return 'PEREMPUAN'; return ''; }
function _ppBangsa(v){
  v=String(v||'').trim().toUpperCase(); if(!v) return '';
  var al={'CHINESE':'CINA','TIONGHOA':'CINA','MALAY':'MELAYU','INDIAN':'INDIA','LAIN':'LAIN-LAIN','LAINLAIN':'LAIN-LAIN','LAIN LAIN':'LAIN-LAIN','OTHERS':'LAIN-LAIN','OTHER':'LAIN-LAIN'};
  if(al[v]) v=al[v]; return _PP_BANGSA.indexOf(v)>=0?v:'';
}
function penyTampal(rowId, teks){
  var baris=String(teks||'').split(/\r?\n/).map(function(l){return l.replace(/\s+$/,'');}).filter(function(l){return l.trim();});
  if(baris.length && /\bNAMA\b/i.test(baris[0]) && /\bKP\b|KAD/i.test(baris[0])) baris.shift();   // buang tajuk lajur
  if(!baris.length) return 0;
  var maks=200, dipotong=baris.length>maks; baris=baris.slice(0,maks);
  var D=_penyData, kini=D.pesList.find(function(x){return x.id===rowId;}), n=0;
  baris.forEach(function(l,i){
    var c=l.split('\t'); var nama=(c[0]||'').trim(); if(!nama) return;
    var p;
    if(i===0 && kini && !(kini.nama||'').trim()) p=kini;
    else { _pPCnt++; p={id:'mp-'+_pPCnt,nama:'',kp:'',jantina:'',bangsa:'',kategori:[]}; D.pesList.push(p); }
    p.nama=nama.toUpperCase(); p.kp=normKP((c[1]||'').trim()); p.jantina=_ppJantina(c[2]); p.bangsa=_ppBangsa(c[3]);
    if(p.jantina && typeof _selKatList!=='undefined'){   // kategori mengikut jantina (peraturan sama seperti _autoAssignKatByJantina)
      var m=_selKatList.filter(function(k){ return k!=='KESELURUHAN'&&k.indexOf('TERBUKA')<0&&((k.indexOf('LELAKI')>=0&&p.jantina==='LELAKI')||(k.indexOf('PEREMPUAN')>=0&&p.jantina==='PEREMPUAN')); });
      if(m.length) p.kategori=m.slice();
    }
    n++;
  });
  renderMainPesList();
  if(typeof toast==='function') toast(n+' peserta ditampal daripada Excel'+(dipotong?' (had '+maks+' baris)':'')+'. Semak medan yang ditanda.','ok');
  return n;
}
document.addEventListener('paste',function(e){
  var t=e.target; if(!t||!t.id||!/^(pn|pkp)-/.test(t.id)) return;
  var cd=e.clipboardData||window.clipboardData; if(!cd) return;
  var teks=cd.getData('text'); if(!/[\n\t]/.test(String(teks).trim())) return;   // satu nilai biasa -> tampal lazim
  e.preventDefault(); penyTampal(t.id.replace(/^(pn|pkp)-/,''),teks);
},true);

// -- Pasang ----------------------------------------------------------------------------------------------------------------------------------------------
(function(){
  var _g=(typeof renderMainGuruList==='function')?renderMainGuruList:null, _p=(typeof renderMainPesList==='function')?renderMainPesList:null;
  if(_g) renderMainGuruList=function(){ var r=_g.apply(this,arguments); try{ penyProgres(); }catch(e){} return r; };
  if(_p) renderMainPesList=function(){ var r=_p.apply(this,arguments); try{ penyProgres(); }catch(e){} return r; };
  var w=document.getElementById('peny-form-wrap');
  if(w){ ['input','change'].forEach(function(ev){ w.addEventListener(ev,function(){ clearTimeout(_ppT); _ppT=setTimeout(function(){ try{ penyProgres(); }catch(e){} },160); },true); }); }
  if(typeof penyModalBuka==='function'){ var _b=penyModalBuka; penyModalBuka=function(){ var r=_b.apply(this,arguments); setTimeout(function(){ try{ penyProgres(); }catch(e){} },80); return r; }; }
  try{ penyProgres(); }catch(e){}
})();
