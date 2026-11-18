// == AGENSI LUAR (penganjur bukan sekolah) =====================================
// Tick "Dianjurkan oleh agensi luar": Nama pengelola = teks bebas (nama agensi), Kod Penganjur = Y044 (PPD SUBIS) automatik.
// Tiada medan/DB baharu: dalam mod Edit, status tick dikesan daripada kod=Y044 & nama bukan "PPD SUBIS".
// Dipakai oleh Daftar Program (prefix 'p') & Edit Program (prefix 'e').
var _AG_KOD = 'Y044', _AG_NAMA = 'PPD SUBIS';
var _AG_ID = {p:{cb:'p-agensi',pen:'p-pengelola',kod:'p-kod'}, e:{cb:'e-agensi',pen:'e-pen',kod:'e-kod'}};

function agIsOn(pre){ var m=_AG_ID[pre], c=m&&document.getElementById(m.cb); return !!(c&&c.checked); }
function agToggle(pre){
  var m=_AG_ID[pre]; if(!m) return;
  var cb=document.getElementById(m.cb), pen=document.getElementById(m.pen), kod=document.getElementById(m.kod);
  if(!cb||!pen||!kod) return;
  if(cb.checked){
    // buang nama sekolah/PPD yang mungkin terisi supaya pengguna taip nama agensi
    var v=String(pen.value||'').trim().toUpperCase();
    var adaSek=(typeof _SEKOLAH_STATIK!=='undefined'?_SEKOLAH_STATIK:[]).some(function(s){return s&&String(s.nama).toUpperCase()===v;});
    if(adaSek) pen.value='';
    kod.value=_AG_KOD; kod.readOnly=true; kod.style.background='var(--g1)';
    pen.placeholder='Nama agensi luar...';
    ['sug-p-pengelola','sug-p-kod'].forEach(function(id){var d=document.getElementById(id); if(d){d.innerHTML='';d.classList.remove('on');}});
    if(pen.focus && pre==='p') pen.focus();
  } else {
    kod.readOnly=false; kod.style.background='';
    pen.placeholder='Nama pengelola';
    if(String(kod.value||'').toUpperCase()===_AG_KOD && String(pen.value||'').trim().toUpperCase()!==_AG_NAMA) kod.value='';
  }
  var h=document.getElementById(pre+'-agensi-info'); if(h) h.style.display=cb.checked?'block':'none';
  if(pre==='e' && typeof _onEditChange==='function') _onEditChange();
}
// Edit: kesan tick daripada data sedia ada (kod Y044 tetapi nama bukan PPD SUBIS)
function agSync(pre){
  var m=_AG_ID[pre], cb=document.getElementById(m.cb), pen=document.getElementById(m.pen), kod=document.getElementById(m.kod);
  if(!cb||!pen||!kod) return;
  var on=String(kod.value||'').toUpperCase()===_AG_KOD && String(pen.value||'').trim()!=='' && String(pen.value).trim().toUpperCase()!==_AG_NAMA;
  cb.checked=on;
  kod.readOnly=on; kod.style.background=on?'var(--g1)':''; pen.placeholder=on?'Nama agensi luar...':'Nama pengelola';
  var h=document.getElementById(pre+'-agensi-info'); if(h) h.style.display=on?'block':'none';
}
function agReset(pre){
  var m=_AG_ID[pre], cb=document.getElementById(m.cb); if(!cb) return;
  cb.checked=false; agToggle(pre);
}
