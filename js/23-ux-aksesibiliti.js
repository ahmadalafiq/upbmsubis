// == UX & KEBOLEHCAPAIAN (audit pra-main) ======================================
// Lapisan tambahan tanpa mengubah logik: ARIA modal, ESC, perangkap fokus, label<->medan, elemen klik boleh dicapai papan kekunci,
// jalur luar talian, pintasan "langkau ke kandungan".
(function(){
  // ESC / klik latar hanya untuk modal yang SELAMAT ditutup (tiada data belum disimpan, atau draf disimpan automatik)
  var ESC_TUTUP = {
    'mo-daftar-prog': function(){ if(typeof tutupDaftarProgram==='function') tutupDaftarProgram(); else closeMo('mo-daftar-prog'); },
    'mo-peny':        function(){ if(typeof penyModalTutupUser==='function') penyModalTutupUser(); else closeMo('mo-peny'); },
    'mo-cfm':         function(){ var b=document.getElementById('cfm-batal'); if(b) b.click(); else closeMo('mo-cfm'); },
    'mo-lihat':'c','mo-rum':'c','mo-det':'c','mo-salinan':'c','mo-tugasan':'c','mo-pengesahan':'c'
  };
  var LATAR_TUTUP = {'mo-lihat':1,'mo-rum':1,'mo-det':1,'mo-tugasan':1};

  function _teratas(){
    var best=null,z=-1;
    Array.prototype.forEach.call(document.querySelectorAll('.mo.on'),function(m){ var v=parseInt(m.style.zIndex||'0',10); if(v>=z){z=v;best=m;} });
    return best;
  }
  function _tutup(m){
    var f=ESC_TUTUP[m.id]; if(!f) return false;
    if(f==='c') closeMo(m.id); else f();
    return true;
  }
  // -- ARIA pada modal -----------------------------------------------------------
  function ariaModal(m){
    var md=m.querySelector('.md'); if(!md||md.getAttribute('role')) return;
    md.setAttribute('role','dialog'); md.setAttribute('aria-modal','true');
    var h=m.querySelector('.mh'); if(h){ if(!h.id) h.id=m.id+'-judul'; md.setAttribute('aria-labelledby',h.id); }
  }
  // -- Label <-> medan ---------------------------------------------------------------
  var _lblN=0;
  function pautkanLabel(root){
    Array.prototype.forEach.call((root||document).querySelectorAll('.fi > label:not([for])'),function(l){
      var c=l.parentNode.querySelector('input:not([type=hidden]),select,textarea'); if(!c) return;
      if(!c.id) c.id='ux-f'+(++_lblN);
      l.setAttribute('for',c.id);
    });
  }
  // -- Elemen klik bukan-butang boleh dicapai papan kekunci ----------------------------------
  function jadikanButang(root){
    Array.prototype.forEach.call((root||document).querySelectorAll('div[onclick],span[onclick],li[onclick],td[onclick],.psc'),function(e){
      if(e.getAttribute('role')||e.tagName==='BUTTON'||e.tagName==='A') return;
      e.setAttribute('role','button'); if(!e.hasAttribute('tabindex')) e.setAttribute('tabindex','0');
    });
  }
  function semuaPatch(root){ try{pautkanLabel(root);}catch(e){} try{jadikanButang(root);}catch(e){} }

  // -- Kekunci global ---------------------------------------------------------------------
  document.addEventListener('keydown',function(e){
    var m=_teratas();
    if(e.key==='Escape' && m){ if(_tutup(m)){ e.preventDefault(); } return; }
    // Aktifkan role=button dengan Enter / Space
    if((e.key==='Enter'||e.key===' ') && e.target && e.target.getAttribute && e.target.getAttribute('role')==='button' && e.target.tagName!=='BUTTON'){
      e.preventDefault(); e.target.click(); return;
    }
    // Perangkap fokus dalam modal teratas
    if(e.key==='Tab' && m){
      var f=Array.prototype.filter.call(m.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([type=hidden]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'),function(x){ return x.offsetParent!==null; });
      if(!f.length) return;
      var a=document.activeElement, first=f[0], last=f[f.length-1];
      if(!m.contains(a)){ first.focus(); e.preventDefault(); }
      else if(e.shiftKey && a===first){ last.focus(); e.preventDefault(); }
      else if(!e.shiftKey && a===last){ first.focus(); e.preventDefault(); }
    }
  });
  // Klik pada latar (bukan kandungan) menutup modal lihat sahaja
  document.addEventListener('mousedown',function(e){
    var t=e.target; if(t&&t.classList&&t.classList.contains('mo')&&t.classList.contains('on')&&LATAR_TUTUP[t.id]) _tutup(t);
  });

  // -- Pembalut openMo: ARIA + label sebelum modal dipaparkan ---------------------------------
  if(typeof openMo==='function'){
    var _om=openMo;
    openMo=function(id){ var el=document.getElementById(id); if(el){ ariaModal(el); semuaPatch(el); } return _om.apply(this,arguments); };
  }

  // -- Jalur luar talian -----------------------------------------------------------------
  function jalur(){
    var b=document.getElementById('ux-offline');
    if(!b){ b=document.createElement('div'); b.id='ux-offline'; b.setAttribute('role','alert'); document.body.appendChild(b); }
    if(navigator.onLine===false){ b.textContent='⚠ Tiada sambungan internet — perubahan belum disimpan akan dihantar apabila sambungan pulih.'; b.classList.add('on'); }
    else if(b.classList.contains('on')){ b.textContent='✓ Sambungan pulih.'; setTimeout(function(){ b.classList.remove('on'); },1800); }
  }
  window.addEventListener('offline',jalur); window.addEventListener('online',jalur);

  // -- Pintasan langkau + live region toast ------------------------------------------------
  function init(){
    if(!document.querySelector('.ux-skip')){
      var a=document.createElement('a'); a.className='ux-skip'; a.href='#'; a.textContent='Langkau ke kandungan';
      a.onclick=function(ev){ ev.preventDefault(); var pg=document.querySelector('.pg.on'); if(pg){ pg.setAttribute('tabindex','-1'); pg.focus(); } };
      document.body.insertBefore(a,document.body.firstChild);
    }
    var tc=document.getElementById('tc'); if(tc){ tc.setAttribute('aria-live','polite'); tc.setAttribute('aria-atomic','false'); }
    Array.prototype.forEach.call(document.querySelectorAll('.mo'),ariaModal);
    semuaPatch(document);
    // Kandungan dinamik: proses nod baharu (debounce)
    var t=null;
    if(window.MutationObserver) new MutationObserver(function(){ clearTimeout(t); t=setTimeout(function(){ semuaPatch(document); },400); }).observe(document.body,{childList:true,subtree:true});
    if(navigator.onLine===false) jalur();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
})();
