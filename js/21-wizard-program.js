// == WIZARD DAFTAR PROGRAM (W1) ================================================
// Lapisan PAPARAN sahaja: semua ID elemen & fungsi sedia ada (daftarProgram, clearPF, handleKatCheck, psRender, agToggle...) kekal.
// Wizard cuma sorok/tunjuk kumpulan medan (kelas wz-hide) + semakan per langkah. Backend tidak disentuh.
// Pautan "Guna borang biasa" = jalan balik. Mod Edit Program kekal borang 1 halaman.
var _WZ_LANGKAH = ['Asas','Penganjur','Sekolah','Kategori','Jadual','Semak'];
var _wz = {on:true, step:1, inited:false};
var _WZ_PREF = 'upbm_wz_program';

function _wzEl(id){ return document.getElementById(id); }
function _wzFi(id){ var e=_wzEl(id); return e ? (e.closest('.fi')||e) : null; }
// Kumpulan elemen bagi setiap langkah (elemen .fi pembungkus)
function _wzKumpulan(){
  return {
    1:[_wzFi('p-nama'),_wzFi('p-bidang'),_wzFi('p-per')],
    2:[_wzFi('p-agensi'),_wzFi('p-pengelola'),_wzFi('p-kod')],
    3:[_wzEl('p-sek-box')],
    4:[_wzFi('p-kat-wrap'),_wzFi('p-luar')],
    5:[_wzFi('p-tarikh'),_wzFi('p-tempat'),_wzFi('p-status')]
  };
}
function _wzPapar(){
  var k=_wzKumpulan();
  for(var n=1;n<=5;n++){ (k[n]||[]).forEach(function(el){ if(el) el.classList.toggle('wz-hide', _wz.on && _wz.step!==n); }); }
  var nav=_wzEl('wz-nav'), bar=_wzEl('wz-bar'), rk=_wzEl('wz-ringkas'), btn=_wzEl('btn-daftar'), alt=_wzEl('wz-alt');
  var rowBtn=btn?btn.parentNode:null;
  if(bar) bar.style.display=_wz.on?'block':'none';
  if(nav) nav.style.display=_wz.on?'flex':'none';
  if(rowBtn) rowBtn.style.display=(!_wz.on||_wz.step===6)?'':'none';
  if(rk) rk.style.display=(_wz.on&&_wz.step===6)?'block':'none';
  if(alt) alt.textContent=_wz.on?'Guna borang biasa':'Guna panduan langkah demi langkah';
  if(_wz.on){
    var h='<div style="display:flex;gap:.3rem;margin-bottom:.35rem;">';
    for(var i=1;i<=6;i++){ h+='<div style="flex:1;height:5px;border-radius:3px;background:'+(i<=_wz.step?'var(--red)':'var(--g2)')+';"></div>'; }
    h+='</div><div style="font-size:.72rem;font-weight:800;color:var(--g8);">Langkah '+_wz.step+' / 6 — '+_WZ_LANGKAH[_wz.step-1].toUpperCase()+'</div>';
    if(bar) bar.innerHTML=h;
    var b=_wzEl('wz-back'), nx=_wzEl('wz-next');
    if(b) b.style.visibility=_wz.step>1?'visible':'hidden';
    if(nx) nx.style.display=_wz.step<6?'':'none';
    if(_wz.step===6) _wzRingkas();
  }
}
function _wzV(id){ var e=_wzEl(id); return e?String(e.value||'').trim():''; }
// Semakan ringkas per langkah (logik penuh kekal dalam daftarProgram)
function _wzSemak(n){
  if(n===1){ if(!_wzV('p-nama')||!_wzV('p-bidang')||!_wzV('p-per')) return 'Sila isi Nama Program, Bidang dan Peringkat.'; }
  if(n===2){ if(!_wzV('p-pengelola')) return (typeof agIsOn==='function'&&agIsOn('p'))?'Sila taip nama agensi luar.':'Sila isi Unit / Nama pengelola.';
             if(!_wzV('p-kod')) return 'Sila isi Kod Sekolah Penganjur.'; }
  if(n===3){ if(typeof psMod==='function'&&psMod('p')==='PILIH'&&typeof psGet==='function'&&psGet('p').length===0) return "Pilih sekurang-kurangnya 1 sekolah, atau pilih 'Sekolah mendaftar sendiri kemudian'."; }
  if(n===4){ if(typeof getKatChecked==='function'&&!getKatChecked('p-kat-wrap').length) return 'Sila pilih sekurang-kurangnya 1 kategori.'; }
  if(n===5){ if(!_wzV('p-tarikh')||!_wzV('p-tempat')) return 'Sila isi Tarikh dan Tempat.'; }
  return '';
}
function _wzRingkas(){
  var rk=_wzEl('wz-ringkas'); if(!rk) return;
  var ag=(typeof agIsOn==='function'&&agIsOn('p'));
  var sek=(typeof psMod==='function'&&psMod('p')==='PILIH')?(psGet('p').length+' sekolah dijemput'):'Sekolah mendaftar sendiri kemudian';
  var kat=(typeof getKatChecked==='function'?getKatChecked('p-kat-wrap'):[]).join(', ')||'—';
  var tar=_wzV('p-tarikh'); try{ if(tar&&typeof fd==='function') tar=fd(tar); }catch(e){}
  var luar=!!(_wzEl('p-luar')&&_wzEl('p-luar').checked);
  var rows=[
    [1,'Nama Program',_wzV('p-nama')],[1,'Bidang',_wzV('p-bidang')],[1,'Peringkat',_wzV('p-per')],
    [2,'Penganjur',_wzV('p-pengelola')+(ag?' (Agensi luar)':'')+' — '+_wzV('p-kod')],
    [3,'Sekolah menyertai',sek],[4,'Kategori',kat],[4,'Aktiviti luar',luar?'Ya':'Tidak'],
    [5,'Tarikh',tar],[5,'Tempat',_wzV('p-tempat')],[5,'Status',_wzV('p-status')]
  ];
  var h='<div style="border:1.5px solid var(--g2);border-radius:var(--r);padding:.5rem .75rem;margin-top:.4rem;">'
       +'<div style="font-size:.66rem;font-weight:800;color:var(--g5);text-transform:uppercase;margin-bottom:.3rem;">Semak sebelum daftar</div>';
  rows.forEach(function(r){
    h+='<div style="display:flex;gap:.5rem;align-items:baseline;padding:.2rem 0;border-top:1px solid var(--g1);font-size:.74rem;">'
      +'<div style="width:130px;flex-shrink:0;color:var(--g5);font-weight:700;">'+esc(r[1])+'</div>'
      +'<div style="flex:1;font-weight:700;color:var(--g8);word-break:break-word;">'+esc(r[2]||'—')+'</div>'
      +'<a href="#" style="font-size:.62rem;font-weight:800;color:var(--red);text-decoration:none;" onclick="wzKe('+r[0]+');return false;">UBAH</a></div>';
  });
  rk.innerHTML=h+'</div>';
}
function wzKe(n){ _wz.step=Math.max(1,Math.min(6,n)); _wzPapar(); _wzScroll(); }
function _wzScroll(){ var c=_wzEl('card-daftar-prog'); if(c&&c.scrollIntoView) try{c.scrollIntoView({block:'start',behavior:'smooth'});}catch(e){} }
function wzNext(){
  var m=_wzSemak(_wz.step);
  if(m){ if(typeof toast==='function') toast(m,'er'); return; }
  if(_wz.step<6) wzKe(_wz.step+1);
}
function wzBack(){ if(_wz.step>1) wzKe(_wz.step-1); }
function wzToggle(on){
  _wz.on=(typeof on==='boolean')?on:!_wz.on;
  try{ localStorage.setItem(_WZ_PREF,_wz.on?'on':'off'); }catch(e){}
  if(_wz.on) _wz.step=1;
  _wzPapar();
}
function wzReset(){ _wz.step=1; _wzPapar(); }

function wzInit(){
  var card=_wzEl('card-daftar-prog'), btn=_wzEl('btn-daftar');
  if(!card||!btn||_wz.inited) return;
  _wz.inited=true;
  try{ if(localStorage.getItem(_WZ_PREF)==='off') _wz.on=false; }catch(e){}
  var rowBtn=btn.parentNode;
  var bar=document.createElement('div'); bar.id='wz-bar'; bar.style.cssText='margin:.2rem 0 .8rem;';
  var fg=card.querySelector('.fg'); fg.parentNode.insertBefore(bar,fg);
  var rk=document.createElement('div'); rk.id='wz-ringkas'; rk.style.display='none';
  rowBtn.parentNode.insertBefore(rk,rowBtn);
  var nav=document.createElement('div'); nav.id='wz-nav'; nav.style.cssText='display:flex;align-items:center;gap:.5rem;margin-top:.7rem;flex-wrap:wrap;';
  nav.innerHTML='<button type="button" class="btn bs" id="wz-back" onclick="wzBack()">◀ KEMBALI</button>'
    +'<button type="button" class="btn bp" id="wz-next" onclick="wzNext()">SETERUSNYA ▶</button>';
  rowBtn.parentNode.insertBefore(nav,rowBtn);
  var alt=document.createElement('a'); alt.id='wz-alt'; alt.href='#';
  alt.style.cssText='display:inline-block;margin-top:.6rem;font-size:.66rem;font-weight:700;color:var(--g5);';
  alt.onclick=function(){ wzToggle(); return false; };
  rowBtn.parentNode.appendChild(alt);
  _wzPapar();
}
wzInit();
