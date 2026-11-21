// == SASARAN SEKOLAH (SR / SM) BAGI PROGRAM ===========================================
// Program boleh disasarkan kepada Sekolah Rendah (SR), Sekolah Menengah (SM) atau kedua-duanya (lalai). Disimpan di programs.sasaran ('SR' | 'SM' | 'SR,SM').
// Dikuatkuasakan di pelayan (hantar_penyertaan_sekolah menolak sekolah di luar sasaran; admin dikecualikan) dan dipaparkan/ditapis di klien.
var _SAS_ID = {p:{sr:'p-sas-sr',sm:'p-sas-sm'}, e:{sr:'e-sas-sr',sm:'e-sas-sm'}};
function sasGet(pre){
  var m=_SAS_ID[pre], sr=document.getElementById(m.sr), sm=document.getElementById(m.sm);
  var a=!!(sr&&sr.checked), b=!!(sm&&sm.checked);
  return (a&&b)?'SR,SM':(a?'SR':(b?'SM':''));
}
function sasSet(pre,v){
  var m=_SAS_ID[pre], sr=document.getElementById(m.sr), sm=document.getElementById(m.sm); v=String(v||'SR,SM').toUpperCase();
  if(sr) sr.checked=(v.indexOf('SR')>=0); if(sm) sm.checked=(v.indexOf('SM')>=0);
}
function sasReset(pre){ sasSet(pre,'SR,SM'); }
function sasJenisKod(kod){ return String(kod||'').charAt(1).toUpperCase()==='E'?'SM':'SR'; }   // kod sekolah huruf ke-2 'E' = SM
function sasProg(pid){
  var r='SR,SM'; (typeof _aPg!=='undefined'?_aPg:[]).forEach(function(p){ if(p['ID']===pid) r=p['Sasaran']||'SR,SM'; });
  if(r==='SR,SM' && typeof _progForPny!=='undefined') (_progForPny||[]).forEach(function(p){ if(p['ID']===pid) r=p['Sasaran']||'SR,SM'; });
  return r;
}
function sasOk(kod,sasaran){ return String(sasaran||'SR,SM').indexOf(sasJenisKod(kod))>=0; }
// Sekolah yang boleh dipilih bagi program yang sedang dipilih pada tab Penyertaan (admin: semua)
function _sasOkSek(kod){
  if(typeof _sesi!=='undefined' && _sesi && _sesi.role==='admin') return true;
  var pid=(typeof selId!=='undefined')?selId:''; if(!pid) return true;
  return sasOk(kod,sasProg(pid));
}
function sasTeks(v){ v=String(v||'SR,SM'); return v==='SR'?'Sekolah Rendah sahaja':(v==='SM'?'Sekolah Menengah sahaja':'Sekolah Rendah & Menengah'); }
