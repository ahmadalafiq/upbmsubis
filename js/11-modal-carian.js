// == MODAL & UTILS ==================================
var _zTop=900; // PEMBETULAN: dulu 250 — lebih rendah dari #pg-login (z-index:800), sebabkan
                // modal (cth. mo-claim lepas Google sign-in) terbuka tapi tersembunyi DI BELAKANG
                // skrin log masuk. Kini 900 supaya modal sentiasa di atas #pg-login.
var _moOpenCount=0;
var _moFocusStack=[]; // P1-C: fokus stack
function openMo(id){
  var el=document.getElementById(id);
  if(!el)return;
  // P1-C: simpan fokus semasa
  _moFocusStack.push(document.activeElement||document.body);
  el.style.zIndex=++_zTop;
  el.classList.add('on');
  var md=el.querySelector('.md');
  if(md){
    md.scrollTop=0;
    var inner=md.querySelector('div[style*="overflow-y"]');
    if(inner)inner.scrollTop=0;
  }
  // Fokus ke elemen pertama yang boleh difokus
  setTimeout(function(){
    var focusable=el.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
    if(focusable.length) focusable[0].focus();
  },50);
  _moOpenCount++;
  document.body.classList.add('modal-open');
}
function closeMo(id){
  var el=document.getElementById(id);
  if(!el)return;
  el.classList.remove('on');
  // P1-C: pulihkan fokus
  var prevFocus=_moFocusStack.pop();
  if(prevFocus&&prevFocus.focus){setTimeout(function(){try{prevFocus.focus();}catch(e){}},50);}
  _moOpenCount=Math.max(0,_moOpenCount-1);
  if(_moOpenCount===0){
    document.body.classList.remove('modal-open');
    document.body.style.overflow='';
    document.documentElement.style.overflow='';
  }
}
// PEMBETULAN: modal dinamik (dibina guna document.createElement, cth. mo-reset-pin,
// mo-edit-maklumat, mo-sekolah) — guna helper ini supaya turut kunci skrol latar
// belakang, konsisten dengan openMo()/closeMo() untuk modal statik.
function _openDynMo(el){
  if(!el) return;
  document.body.appendChild(el);
  el.style.zIndex=++_zTop;
  _moOpenCount++;
  document.body.classList.add('modal-open');
}
function _closeDynMo(id){
  var el=document.getElementById(id);
  if(el) el.remove();
  _moOpenCount=Math.max(0,_moOpenCount-1);
  if(_moOpenCount===0){
    document.body.classList.remove('modal-open');
    document.body.style.overflow='';
    document.documentElement.style.overflow='';
  }
}
// P1-A: Backdrop click-to-close DINYAHAKTIFKAN — modal hanya ditutup melalui butang Tutup.
function gv(id){return document.getElementById(id).value.trim();}
function cntBy(arr,key){var c={};arr.forEach(function(i){var k=i[key]||'—';c[k]=(c[k]||0)+1;});return c;}
function uniqGuru(pny){var u={};pny.forEach(function(r){var k=r['No KP Guru']||r['Nama Guru'];if(k&&r['Nama Guru'])u[k]=r;});return Object.values(u);}
function uniqPes(pny){var u={};pny.forEach(function(r){var k=r['No KP Peserta']||r['Nama Peserta'];if(k&&r['Nama Peserta'])u[k]=r;});return Object.values(u);}
function fd(d){if(!d)return '—';var dt=new Date(d);return isNaN(dt)?String(d):dt.toLocaleDateString('ms-MY',{day:'2-digit',month:'short',year:'numeric'});}
function _trackAccess(pid, action){
  if(!_sesi)return;
  if(!window._lastAccess) window._lastAccess={};
  var now=new Date().toISOString();
  var roleMap={admin:'Admin',pkk:'PKK',guru:'Guru'};
  window._lastAccess[pid]={
    by:_sesi.nama||_sesi.role||'—',
    role:roleMap[_sesi.role]||_sesi.role||'',
    action:action,
    at:now
  };
  // Update strip pada kad berkenaan sahaja
  var strip=document.getElementById('le-'+pid);
  if(strip){strip.innerHTML=_fmtAccess(window._lastAccess[pid]);strip.classList.add('on');}
}
function _fmtAccess(info){
  if(!info||!info.at)return '';
  var dt=new Date(info.at);
  var pad=function(n){return n<10?'0'+n:n;};
  var tStr=pad(dt.getDate())+'/'+pad(dt.getMonth()+1)+'/'+dt.getFullYear()+' '+pad(dt.getHours())+':'+pad(dt.getMinutes());
  return '👁 <strong>'+(info.by||'—')+'</strong>'+(info.role?' ('+info.role+')':'')+' &bull; '+(info.action||'')+'&nbsp;&bull;&nbsp;'+tStr;
}
function toast(msg,type){
  type=type||'in';var c=document.getElementById('tc');
  var el=document.createElement('div');el.className='toast '+type;
  el.innerHTML='<span>'+(type==='ok'?'✓':type==='er'?'✗':'ℹ')+'</span>'+msg;
  c.appendChild(el);setTimeout(function(){if(el.parentNode)el.remove();},3200);
}

// == FUNGSI CARIAN ===================================

// Carian header dibuang — fungsi carian dipindah ke modal sahaja

// == UNIFIED PRINT BUILDER ======================================

function printSdet(){
  var p=document.getElementById('sdet-print-portal');
  if(!p||!p.innerHTML.trim()){toast('Tiada data untuk cetak','er');return;}
  p.style.display='block';
  window.print();
  p.style.display='none';
}

// == MODAL SEARCH — Ranking ===================================
var _moreData=[]; // full sorted ranking array stored when modal opens

function filterMore(q){
  var cl=document.getElementById('more-srch-clear');
  if(cl) cl.style.display=q?'block':'none';
  var lq=(q||'').toLowerCase().trim();
  var el=document.createElement('div'); el.className='rl';
  var filtered=lq?_moreData.filter(function(e){return e[0].toLowerCase().indexOf(lq)>-1;}):_moreData;
  var cnt=document.getElementById('more-srch-count');
  if(cnt) cnt.textContent=lq?(filtered.length+' daripada '+_moreData.length+' rekod ditemui'):'';
  if(!filtered.length){
    document.getElementById('more-body').innerHTML='<div class="empty"><div class="ei">🔍</div><h3>Tiada hasil</h3></div>';
    return;
  }
  var _type=_moreData._type||'sek';
  filtered.forEach(function(e,i){
    // find original rank
    var origRank=_moreData.indexOf(e);
    var c=origRank===0?'r1':origRank===1?'r2':origRank===2?'r3':'rX';
    var div=document.createElement('div'); div.className='rit';
    var disp=e[1].display||e[0];
    var sek=e[1].sekolah||'';
    var subHtml=(!_isSekType(_type)&&sek)?'<div class="rsub">· '+sek+'</div>':'';
    div.innerHTML='<div class="rbg '+c+'">'+(origRank+1)+'</div><div class="rn">'+disp+subHtml+'</div><div class="rs">'+e[1].total+' PT</div>';
    (function(nm,tp){div.addEventListener('click',function(){showDet(nm,tp);});})(e[0],_type);
    el.appendChild(div);
  });
  document.getElementById('more-body').innerHTML='';
  document.getElementById('more-body').appendChild(el);
}

function clearMoreSrch(){
  var inp=document.getElementById('more-srch');
  if(inp){inp.value='';inp.focus();}
  filterMore('');
}

// == MODAL SEARCH — Pencapaian =================================
var _morepBp={}; // full bp map stored when modal opens
var _morepKeys=[]; // full keys list

function filterMorep(q){
  var cl=document.getElementById('morep-srch-clear');
  if(cl) cl.style.display=q?'block':'none';
  var lq=(q||'').toLowerCase().trim();
  var cnt=document.getElementById('morep-srch-count');
  var filtered=lq?_morepKeys.filter(function(k){
    // Match program name, or any school/peserta/guru inside
    if(k.toLowerCase().indexOf(lq)>-1) return true;
    var rows=_morepBp[k]||[];
    return rows.some(function(r){
      return (r['Nama Sekolah']||'').toLowerCase().indexOf(lq)>-1
          || (r['Nama Peserta']||'').toLowerCase().indexOf(lq)>-1
          || (r['Nama Guru']||'').toLowerCase().indexOf(lq)>-1;
    });
  }):_morepKeys;
  if(cnt) cnt.textContent=lq?(filtered.length+' daripada '+_morepKeys.length+' program ditemui'):'';
  var body2=document.getElementById('morep-body');
  if(!filtered.length){
    body2.innerHTML='<div class="empty"><div class="ei">🔍</div><h3>Tiada hasil untuk "'+q+'"</h3></div>';
  }else{
    body2.innerHTML=''; body2.appendChild(renderPencNameList(_morepBp,filtered));
  }
}

function clearMorepSrch(){
  var inp=document.getElementById('morep-srch');
  if(inp){inp.value='';inp.focus();}
  filterMorep('');
}

