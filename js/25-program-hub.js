// == PAPARAN PROGRAM BAHARU — Pengelola & Penyertaan ===============================
// Satu komponen senarai dikongsi: senarai padat + panel butiran, 1 CTA utama setiap baris, aksi lain dalam menu ⋯.
// LAPISAN PAPARAN sahaja: semua tindakan memanggil fungsi sedia ada (reqLihat, reqEdit, reqRum, reqXlsx, reqPadam,
// _tgBuka, _openPenyertaanEdit, _restorePenyDraft). Boleh kembali ke paparan lama (butang "Lama").
// Data: _aPg (program) & _aP (penyertaan) yang dimuat oleh loadProgs / loadProgsForPeny; status sekolah sendiri: RPC semakan_selepas_login.
var _PH_PREF = 'upbm_ph_view';
var _ph = {
  view: 'baru',
  pengelola: {root:'ph-pengelola', f:{q:'', tab:'AKTIF', bidang:'', bulan:'', per:'', isih:'tarikh'}, sel:'', n:25},
  peserta:   {root:'ph-peserta',   f:{q:'', tab:'',      bidang:'', bulan:'', per:'', isih:'tarikh'}, sel:'', n:25, auto:true},
  tugas: null, tugasMuat: false, dimuat: false
};
var _PH_BULAN = ['Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogo','Sep','Okt','Nov','Dis'];

function _phOwn(){ return String((_sesi&&_sesi.kodSekolah)||'').toUpperCase().trim(); }
function _phRole(){ return (_sesi&&_sesi.role)||''; }
function _phProgs(){ return (typeof _aPg!=='undefined'&&_aPg&&_aPg.length)?_aPg:((typeof _allProg!=='undefined'&&_allProg)?_allProg:[]); }
function _phTop(el){ while(el&&el.parentNode&&!(el.parentNode.classList&&el.parentNode.classList.contains('pg'))) el=el.parentNode; return el; }
function _phTarikh(p){ var d=new Date(p['Tarikh']); return isNaN(d)?null:d; }
function _phHari(p){
  var d=_phTarikh(p); if(!d) return null;
  var t=new Date(); t.setHours(0,0,0,0); d.setHours(0,0,0,0);
  return Math.round((d-t)/86400000);
}
function _phHariTeks(n){ if(n===null) return ''; if(n>0) return n+' hari lagi'; if(n===0) return 'Hari ini'; return 'Sudah lepas'; }
function _phBulanKey(p){ var d=_phTarikh(p); return d?(d.getFullYear()+'-'+(d.getMonth()+1)):''; }

// -- Statistik per program daripada _aP (sekali setiap render) ------------------------------------
function _phStats(){
  var map={}, own=_phOwn();
  (typeof _aP!=='undefined'?_aP:[]).forEach(function(x){
    var pid=x['Program ID']; if(!pid) return;
    var s=map[pid]||(map[pid]={sek:{},pes:{},guru:{},own:0,sekN:{}});
    var ks=x['Kod Sekolah']; if(ks){ s.sek[ks]=1; if(!s.sekN[ks]) s.sekN[ks]={nama:x['Nama Sekolah']||ks,pes:{},guru:{}}; }
    var gk=x['No KP Guru']||x['Nama Guru']; if(gk&&x['Nama Guru']){ s.guru[gk]=1; if(ks) s.sekN[ks].guru[gk]=1; }
    var pk=x['No KP Peserta']||x['Nama Peserta'], kat=x['Kategori Penyertaan']||'';
    if(pk&&x['Nama Peserta']&&kat&&kat!=='GURU'){ s.pes[pk]=1; if(ks) s.sekN[ks].pes[pk]=1; }
    if(own && String(ks||'').toUpperCase()===own) s.own++;
  });
  return map;
}
function _phInfo(p,S){
  var s=S[p['ID']]||{sek:{},pes:{},guru:{},own:0,sekN:{}};
  var rows=(typeof _aP!=='undefined'?_aP:[]).filter(function(x){return x['Program ID']===p['ID'];});
  var asing=[]; try{ asing=_getKatAsing(_progKatList(p),rows)||[]; }catch(e){}
  var hari=_phHari(p), issues=[];
  if(p['Status']==='DRAFT') issues.push('Draf — belum diaktifkan');
  if(asing.length) issues.push('Kategori penyertaan tidak sepadan: '+asing.join(', '));
  if(p['Status']==='AKTIF' && hari!==null && hari<0) issues.push('Tarikh sudah lepas — pertimbang tutup program');
  return {sek:Object.keys(s.sek).length, pes:Object.keys(s.pes).length, guru:Object.keys(s.guru).length, own:s.own, sekN:s.sekN, hari:hari, issues:issues, asing:asing};
}

// -- Status penyertaan sekolah sendiri (guru/PKK) ------------------------------------------------
function _phDraf(){ try{ var d=JSON.parse(sessionStorage.getItem('upbm_peny_draft')||'null'); return (d&&_sesi&&d.noKP===_sesi.noKP)?d:null; }catch(e){ return null; } }
function _phStatusSendiri(pid,info){
  if(!_phOwn()) return '';
  var tl=_ph.tugas&&_ph.tugas.tl&&_ph.tugas.tl[pid], tg=_ph.tugas&&_ph.tugas.tg&&_ph.tugas.tg[pid];
  if(info.own>0) return tl?'TIDAK_LENGKAP':'DIHANTAR';
  var d=_phDraf(); if(d&&d.selId===pid) return 'DRAF';
  return tg?'TUGASAN':'BELUM';
}
var _PH_ST_TEKS={TUGASAN:'📌 Ditugaskan',TIDAK_LENGKAP:'⚠ Perlu dibetulkan',DRAF:'📝 Draf',DIHANTAR:'✅ Dihantar',BELUM:'Belum daftar'};
var _PH_CTA={TUGASAN:'DAFTAR',BELUM:'DAFTAR',DRAF:'SAMBUNG',DIHANTAR:'KEMASKINI',TIDAK_LENGKAP:'BETULKAN'};
async function _phMuatTugas(){
  if(_ph.tugas || _ph.tugasMuat || !_sesi || !_phOwn() || (_phRole()!=='guru'&&_phRole()!=='pkk')) return;   // sudah dimuat / sedang dimuat -> jangan ulang
  _ph.tugasMuat=true;
  try{
    var r=await run('semakanSelepasLoginGS',{});
    var d=(r&&r.ok&&r.data)||{}, tg={}, tl={};
    (d.tugasan||[]).forEach(function(x){ tg[x.program_id]=1; });
    (d.tidak_lengkap||[]).forEach(function(x){ tl[x.program_id]=1; });
    _ph.tugas={tg:tg,tl:tl};
  }catch(e){ _ph.tugas={tg:{},tl:{}}; }
  finally{ _ph.tugasMuat=false; }
  phRender('peserta');
}

// -- Penapis & isihan --------------------------------------------------------------------------------
function _phLulus(p,info,st,m){
  var f=_ph[m].f, q=f.q.toLowerCase();
  if(q && [p['Nama Program'],p['Bidang'],p['Pengelola'],p['Tempat'],p['Peringkat']].join(' ').toLowerCase().indexOf(q)<0) return false;
  if(f.bidang && p['Bidang']!==f.bidang) return false;
  if(f.per && p['Peringkat']!==f.per) return false;
  if(f.bulan && _phBulanKey(p)!==f.bulan) return false;
  var tab=f.tab;
  if(m==='pengelola'){
    if(tab==='PERLU') return info.issues.length>0;
    if(tab==='SEMUA'||!tab) return true;
    return p['Status']===tab;
  }
  // penyertaan
  if(tab==='TUGAS') return st==='TUGASAN'||st==='TIDAK_LENGKAP'||st==='DRAF';
  if(tab==='TERBUKA') return p['Status']==='AKTIF' && st!=='DIHANTAR';
  if(tab==='DIHANTAR') return st==='DIHANTAR'||st==='TIDAK_LENGKAP';
  if(tab==='AKTIF') return p['Status']==='AKTIF';
  return true;
}
function _phIsih(a,b,m){
  var k=_ph[m].f.isih;
  if(k==='nama') return String(a.p['Nama Program']).localeCompare(String(b.p['Nama Program']));
  if(k==='ramai') return b.i.pes-a.i.pes;
  var da=_phTarikh(a.p), db=_phTarikh(b.p), t=new Date(); t.setHours(0,0,0,0);
  if(k==='baharu') return (db||0)-(da||0);
  // tarikh terdekat: akan datang dahulu (menaik), kemudian yang lepas (terbaru dahulu)
  var fa=da&&da>=t, fb=db&&db>=t;
  if(fa&&fb) return da-db; if(fa) return -1; if(fb) return 1; return (db||0)-(da||0);
}

// -- Render ------------------------------------------------------------------------------------------------
function _phSusun(m){
  var S=_phStats(), items=[];
  _phProgs().forEach(function(p){ var i=_phInfo(p,S); items.push({p:p,i:i,st:(m==='peserta')?_phStatusSendiri(p['ID'],i):''}); });
  return items;
}
function phRender(m){
  if(!m){ phRender('pengelola'); phRender('peserta'); return; }
  var root=document.getElementById(_ph[m].root); if(!root||_ph.view!=='baru') return;
  if(!_ph.dimuat){ root.innerHTML='<div class="ph-list">'+ldInline('Memuatkan senarai program...')+'</div>'; return; }
  if(m==='peserta') _phMuatTugas();
  var all=_phSusun(m), f=_ph[m].f, own=_phOwn(), peran=_phRole();
  // tab lalai
  // tab lalai dikira semula selagi pengguna belum memilih sendiri (tugasan dimuat tak segerak)
  if(m==='peserta' && (_ph.peserta.auto || !f.tab)){ var adaTugas=all.some(function(x){return x.st==='TUGASAN'||x.st==='TIDAK_LENGKAP'||x.st==='DRAF';}); f.tab=own?(adaTugas?'TUGAS':'TERBUKA'):'AKTIF'; }
  var h='';
  // bar paparan
  h+='<div class="ph-bar"><div class="ph-view" role="group" aria-label="Pilih paparan"><button type="button" class="on">✨ Baharu</button><button type="button" onclick="phPaparan(\'lama\')">Lama</button></div>'
    +(m==='peserta'?'<button type="button" class="btn bs bsm" onclick="if(typeof openLaporanSekolah===\'function\')openLaporanSekolah();else toast(\'Modul laporan belum dimuatkan\',\'er\');">📄 LAPORAN SEKOLAH</button>':'')
    +'<button type="button" class="btn bs bsm" onclick="phMuatSemula(\''+m+'\')" title="Muat semula data">↻ MUAT SEMULA</button></div>';
  // chip / tab
  var chips;
  var cnt=function(fn){ return all.filter(fn).length; };
  if(m==='pengelola'){
    chips=[['AKTIF','Aktif',cnt(function(x){return x.p['Status']==='AKTIF';})],['DRAFT','Draf',cnt(function(x){return x.p['Status']==='DRAFT';})],['TUTUP','Tutup',cnt(function(x){return x.p['Status']==='TUTUP';})],['SEMUA','Semua',all.length],['PERLU','⚠ Perlu tindakan',cnt(function(x){return x.i.issues.length>0;})]];
  } else if(own){
    chips=[['TUGAS','📌 Tugas saya',cnt(function(x){return x.st==='TUGASAN'||x.st==='TIDAK_LENGKAP'||x.st==='DRAF';})],['TERBUKA','Terbuka',cnt(function(x){return x.p['Status']==='AKTIF'&&x.st!=='DIHANTAR';})],['DIHANTAR','✅ Dihantar',cnt(function(x){return x.st==='DIHANTAR'||x.st==='TIDAK_LENGKAP';})],['SEMUA','Semua',all.length]];
  } else {
    chips=[['AKTIF','Aktif',cnt(function(x){return x.p['Status']==='AKTIF';})],['SEMUA','Semua',all.length]];
  }
  h+='<div class="ph-chips" role="tablist">'+chips.map(function(c){ return '<button type="button" role="tab" aria-selected="'+(f.tab===c[0])+'" class="ph-chip'+(f.tab===c[0]?' on':'')+(c[0]==='PERLU'?' warn':'')+'" onclick="phTab(\''+m+'\',\''+c[0]+'\')">'+c[1]+' <b>'+c[2]+'</b></button>'; }).join('')+'</div>';
  // penapis
  var bid={},per={},bln={};
  all.forEach(function(x){ if(x.p['Bidang']) bid[x.p['Bidang']]=1; if(x.p['Peringkat']) per[x.p['Peringkat']]=1; var k=_phBulanKey(x.p); if(k) bln[k]=1; });
  var opt=function(o,cur,lbl){ return '<option value="">'+lbl+'</option>'+o.map(function(v){return '<option value="'+esc(v[0])+'"'+(cur===v[0]?' selected':'')+'>'+esc(v[1])+'</option>';}).join(''); };
  var bk=Object.keys(bln).sort().map(function(k){ var y=k.split('-'); return [k,_PH_BULAN[Number(y[1])-1]+' '+y[0]]; });
  h+='<div class="ph-filters"><input type="search" id="ph-q-'+m+'" placeholder="Cari program, bidang, tempat..." value="'+esc(f.q)+'" oninput="phCari(\''+m+'\',this.value)" aria-label="Cari program">'
    +'<select onchange="phSet(\''+m+'\',\'bidang\',this.value)" aria-label="Bidang">'+opt(Object.keys(bid).sort().map(function(v){return [v,v];}),f.bidang,'Semua bidang')+'</select>'
    +'<select onchange="phSet(\''+m+'\',\'per\',this.value)" aria-label="Peringkat">'+opt(Object.keys(per).sort().map(function(v){return [v,v];}),f.per,'Semua peringkat')+'</select>'
    +'<select onchange="phSet(\''+m+'\',\'bulan\',this.value)" aria-label="Bulan">'+opt(bk,f.bulan,'Semua bulan')+'</select>'
    +'<select onchange="phSet(\''+m+'\',\'isih\',this.value)" aria-label="Isih">'+[['tarikh','Isih: Tarikh terdekat'],['baharu','Isih: Terbaru'],['nama','Isih: Nama'],['ramai','Isih: Peserta terbanyak']].map(function(o){return '<option value="'+o[0]+'"'+(f.isih===o[0]?' selected':'')+'>'+o[1]+'</option>';}).join('')+'</select></div>';
  // senarai
  var rows=all.filter(function(x){ return _phLulus(x.p,x.i,x.st,m); }).sort(function(a,b){ return _phIsih(a,b,m); });
  var tunjuk=rows.slice(0,_ph[m].n);
  var list='';
  if(!rows.length) list='<div class="empty" style="padding:1.4rem;"><div class="ei">📭</div><h3>Tiada program sepadan</h3><p style="font-size:.74rem;color:var(--g6);">Ubah penapis atau carian.</p></div>';
  tunjuk.forEach(function(x){ list+=_phBaris(x,m,peran); });
  if(rows.length>tunjuk.length) list+='<button type="button" class="btn bs ph-more-btn" onclick="phLagi(\''+m+'\')">Papar lagi ('+(rows.length-tunjuk.length)+')</button>';
  h+='<div class="ph-wrap"><div><div class="ph-list" id="ph-list-'+m+'" aria-label="Senarai program ('+rows.length+')">'+list+'</div></div><aside class="ph-detail" id="ph-detail-'+m+'" aria-label="Butiran program"></aside></div>';
  // kekalkan fokus carian
  var aktif=document.activeElement, kekal=(aktif&&aktif.id==='ph-q-'+m)?aktif.selectionStart:null;
  root.innerHTML=h;
  if(kekal!==null){ var qi=document.getElementById('ph-q-'+m); if(qi){ qi.focus(); try{qi.setSelectionRange(kekal,kekal);}catch(e){} } }
  _phDetail(m, rows);
}
function _phBaris(x,m,peran){
  var p=x.p, i=x.i, id=esc(p['ID']), sel=(_ph[m].sel===p['ID']);
  var hari=(p['Status']!=='TUTUP')?_phHariTeks(i.hari):'';
  var cta;
  if(m==='pengelola') cta='<button type="button" class="btn bp bsm" onclick="event.stopPropagation();phAksi(\'data\',\''+id+'\')">👁 DATA</button>';
  else if(_phOwn()) cta='<button type="button" class="btn '+((x.st==='DIHANTAR')?'bs':'bp')+' bsm" onclick="event.stopPropagation();phAksi(\'cta\',\''+id+'\')" '+(p['Status']!=='AKTIF'&&x.st==='BELUM'?'disabled title="Program tidak aktif"':'')+'>'+_PH_CTA[x.st||'BELUM']+'</button>';
  else cta='<button type="button" class="btn bp bsm" onclick="event.stopPropagation();phAksi(\'cta\',\''+id+'\')">DAFTAR</button>';
  var st=(m==='peserta'&&_phOwn())?'<span class="ph-st s-'+x.st+'">'+_PH_ST_TEKS[x.st]+'</span>':((m==='pengelola'&&p['Status']!=='AKTIF')?'<span class="ph-st s-BELUM">'+esc(p['Status'])+'</span>':'');
  return '<div class="ph-row st-'+esc(p['Status'])+(sel?' sel':'')+'" role="button" tabindex="0" data-pid="'+id+'" onclick="phPilih(\''+m+'\',\''+id+'\')">'
    +'<div><div class="ph-title">'+esc(p['Nama Program'])+' '+st+'</div>'
    +'<div class="ph-sub"><span class="ph-tag">'+esc(p['Bidang']||'—')+'</span><span>'+esc(p['Peringkat']||'')+'</span><span>📅 '+esc(fd(p['Tarikh']))+'</span>'+(hari?'<span class="ph-due'+(i.hari<0?' lepas':'')+'">'+hari+'</span>':'')+'<span>📍 '+esc(p['Tempat']||'—')+'</span>'+(p['Aktiviti Luar']===true?'<span title="Aktiviti luar">🌐</span>':'')+'</div></div>'
    +'<div class="ph-metrics" title="Sekolah · Peserta"><span>🏫 '+i.sek+'</span><span>👤 '+i.pes+'</span>'+(i.issues.length?'<span class="ph-warn" title="'+esc(i.issues.join('; '))+'">⚠ '+i.issues.length+'</span>':'')+'</div>'
    +'<div class="ph-act">'+cta+'<button type="button" class="ph-more" aria-haspopup="menu" aria-label="Lagi tindakan" onclick="event.stopPropagation();phMenu(event,\''+id+'\',\''+m+'\')">⋯</button></div></div>';
}

// -- Panel butiran ----------------------------------------------------------------------------------------------
function _phDetail(m,rows){
  var el=document.getElementById('ph-detail-'+m); if(!el) return;
  var sel=_ph[m].sel, x=null;
  if(sel) (rows||[]).forEach(function(r){ if(r.p['ID']===sel) x=r; });
  if(!x){ el.classList.remove('buka'); el.innerHTML='<div class="empty" style="padding:1.2rem;"><div class="ei">👈</div><h3>Pilih program</h3><p style="font-size:.74rem;color:var(--g6);">Klik mana-mana program untuk melihat butiran dan tindakan.</p></div>'; return; }
  var p=x.p, i=x.i, peran=_phRole(), own=_phOwn();
  var boleh=(peran==='admin')||(peran==='pkk'&&own&&own===String(p['Kod Pengelola']||'').toUpperCase().trim());
  var kat=[]; try{ kat=_progKatList(p)||[]; }catch(e){}
  var h='<button type="button" class="btn bs bsm ph-tutup-detail" onclick="phTutupDetail(\''+m+'\')">← Kembali ke senarai</button>'
    +'<h2>'+esc(p['Nama Program'])+'</h2><div><span class="ph-st s-'+(p['Status']==='AKTIF'?'DIHANTAR':'BELUM')+'">'+esc(p['Status'])+'</span> <span class="ph-tag">'+esc(p['Bidang']||'—')+'</span> <span class="ph-tag">'+esc(p['Peringkat']||'')+'</span></div>'
    +(i.issues.length?'<div class="ph-issues">'+i.issues.map(function(t){return '<span class="ph-issue">⚠ '+esc(t)+'</span>';}).join('')+'</div>':'')
    +'<dl class="ph-kv"><dt>Penganjur</dt><dd>'+esc(p['Pengelola']||'—')+' <span style="color:var(--g6);font-weight:600;">('+esc(p['Kod Pengelola']||'—')+')</span></dd>'
    +'<dt>Tarikh</dt><dd>'+esc(fd(p['Tarikh']))+(i.hari!==null?' <span class="ph-due'+(i.hari<0?' lepas':'')+'">· '+_phHariTeks(i.hari)+'</span>':'')+'</dd>'
    +'<dt>Tempat</dt><dd>'+esc(p['Tempat']||'—')+'</dd>'
    +'<dt>Kategori</dt><dd>'+esc(kat.join(', ')||'—')+'</dd>'
    +(p['Aktiviti Luar']===true?'<dt>Jenis</dt><dd>🌐 Aktiviti luar (tidak semua sekolah menyertai)</dd>':'')+'</dl>'
    +'<div class="ph-kpi"><div><b>'+i.sek+'</b><span>sekolah</span></div><div><b>'+i.pes+'</b><span>peserta</span></div><div><b>'+i.guru+'</b><span>guru</span></div></div>';
  // status sekolah sendiri
  if(own){ var st=_phStatusSendiri(p['ID'],i); h+='<div style="margin:.5rem 0;font-size:.76rem;"><b>Sekolah anda:</b> <span class="ph-st s-'+st+'">'+_PH_ST_TEKS[st]+'</span></div>'; }
  // sekolah menyertai (10 teratas)
  var sk=Object.keys(i.sekN).map(function(k){ return {n:i.sekN[k].nama,p:Object.keys(i.sekN[k].pes).length,g:Object.keys(i.sekN[k].guru).length}; }).sort(function(a,b){return b.p-a.p;});
  if(sk.length) h+='<div style="font-size:.7rem;font-weight:800;margin-top:.5rem;">Sekolah menyertai ('+sk.length+')</div><div class="ph-sekl">'+sk.slice(0,12).map(function(s){return '<div><span>'+esc(s.n)+'</span><span style="white-space:nowrap;color:var(--g6);">👤 '+s.p+' · 🧑‍🏫 '+s.g+'</span></div>';}).join('')+(sk.length>12?'<div style="color:var(--g6);">… dan '+(sk.length-12)+' lagi — lihat DATA</div>':'')+'</div>';
  // tindakan
  var pid=esc(p['ID']), a='';
  if(own){ var s2=_phStatusSendiri(p['ID'],i); a+='<button type="button" class="btn bp" onclick="phAksi(\'cta\',\''+pid+'\')" '+(p['Status']!=='AKTIF'&&s2==='BELUM'?'disabled':'')+'>'+_PH_CTA[s2]+' PENYERTAAN</button>'; }
  else if(peran==='admin') a+='<button type="button" class="btn bp" onclick="phAksi(\'cta\',\''+pid+'\')">+ DAFTAR PENYERTAAN</button>';
  a+='<button type="button" class="btn bs" onclick="phAksi(\'data\',\''+pid+'\')">👁 Lihat data</button>';
  if(peran!=='guru'){ a+='<button type="button" class="btn bs" onclick="phAksi(\'rum\',\''+pid+'\')">📄 Rumusan</button><button type="button" class="btn bs" onclick="phAksi(\'xlsx\',\''+pid+'\')">📥 Excel</button>'; }
  if(boleh) a+='<button type="button" class="btn bw" onclick="phAksi(\'edit\',\''+pid+'\')">✏ Edit program</button>';
  h+='<div class="ph-acts">'+a+'</div>';
  if(peran==='admin') h+='<div style="margin-top:.8rem;"><button type="button" class="btn bd bsm" onclick="phAksi(\'padam\',\''+pid+'\')">🗑 Padam program</button></div>';
  el.innerHTML=h;
}

// -- Tindakan -------------------------------------------------------------------------------------------------------
function _phProg(pid){ var r=null; _phProgs().forEach(function(p){ if(p['ID']===pid) r=p; }); return r; }
function phAksi(a,pid){
  var p=_phProg(pid); if(!p) return; phTutupMenu();
  if(!_sesi){ toast('Sila log masuk dahulu.','er'); return; }
  if(a==='data'){ _trackAccess(pid,'👁 DATA'); return reqLihat(pid,p['Nama Program']); }
  if(a==='rum'){ _trackAccess(pid,'📄 RUMUSAN'); return reqRum(pid,p['Status']); }
  if(a==='xlsx'){ _trackAccess(pid,'📥 EXCEL'); return reqXlsx(JSON.parse(JSON.stringify(p))); }
  if(a==='edit'){ _trackAccess(pid,'✏ EDIT'); return reqEdit(JSON.parse(JSON.stringify(p))); }
  if(a==='padam'){ return reqPadam(pid,p['Nama Program'],p['Kod Pengelola']||''); }
  if(a==='cta'){
    var own=_phOwn(), st=_phStatusSendiri(pid,_phInfo(p,_phStats()));
    if(!own || st==='BELUM' || st==='TUGASAN') return _tgBuka(pid);                        // DAFTAR (admin: pilih sekolah dalam modal)
    if(st==='DRAF'){ var d=_phDraf(); if(d&&typeof _restorePenyDraft==='function') return _restorePenyDraft(d); return _tgBuka(pid); }
    var nm=''; (typeof _SEKOLAH_STATIK!=='undefined'?_SEKOLAH_STATIK:[]).forEach(function(s){ if(String(s.kod).toUpperCase()===own) nm=s.nama; });
    return _openPenyertaanEdit(JSON.parse(JSON.stringify(p)), _sesi.kodSekolah, nm||(_sesi.namaSekolah||''));   // KEMASKINI / BETULKAN
  }
}
function phPilih(m,pid){ _ph[m].sel=pid; phRender(m); var d=document.getElementById('ph-detail-'+m); if(d&&window.matchMedia&&window.matchMedia('(max-width:999px)').matches){ d.classList.add('buka'); d.scrollTop=0; } }
function phTutupDetail(m){ var d=document.getElementById('ph-detail-'+m); if(d) d.classList.remove('buka'); }
function phTab(m,t){ _ph[m].f.tab=t; _ph[m].auto=false; _ph[m].n=25; phRender(m); }
function phSet(m,k,v){ _ph[m].f[k]=v; _ph[m].n=25; phRender(m); }
var _phCariT=null;
function phCari(m,v){ _ph[m].f.q=v; _ph[m].n=25; clearTimeout(_phCariT); _phCariT=setTimeout(function(){ phRender(m); },180); }
function phLagi(m){ _ph[m].n+=25; phRender(m); }
async function phMuatSemula(m){
  try{ _ph.tugasMuat=false; _ph.tugas=null; await (m==='pengelola'?loadProgs(true,true):new Promise(function(r){ loadProgsForPeny(true,r,true); })); }catch(e){}
  phRender(m); toast('Data dimuat semula.','ok');
}

// -- Menu ⋯ ----------------------------------------------------------------------------------------------------------------
function phTutupMenu(){ var e=document.getElementById('ph-menu'); if(e) e.remove(); }
function phMenu(ev,pid,m){
  phTutupMenu(); var p=_phProg(pid); if(!p) return;
  var peran=_phRole(), own=_phOwn(), boleh=(peran==='admin')||(peran==='pkk'&&own&&own===String(p['Kod Pengelola']||'').toUpperCase().trim());
  var items=[['👁 Lihat data','data']];
  if(peran!=='guru'){ items.push(['📄 Rumusan','rum'],['📥 Eksport Excel','xlsx']); }
  if(boleh) items.push(['✏ Edit program','edit']);
  if(peran==='admin') items.push(['🗑 Padam program','padam','bahaya']);
  var mn=document.createElement('div'); mn.id='ph-menu'; mn.className='ph-menu'; mn.setAttribute('role','menu');
  mn.innerHTML=items.map(function(it){ return '<button type="button" role="menuitem" class="'+(it[2]||'')+'" onclick="phAksi(\''+it[1]+'\',\''+esc(pid)+'\')">'+it[0]+'</button>'; }).join('');
  document.body.appendChild(mn);
  var r=ev.currentTarget.getBoundingClientRect(), w=mn.offsetWidth, hh=mn.offsetHeight;
  mn.style.left=Math.max(6,Math.min(window.innerWidth-w-6,r.right-w))+'px';
  mn.style.top=((r.bottom+hh+8>window.innerHeight)?Math.max(6,r.top-hh-4):r.bottom+4)+'px';
  var b=mn.querySelector('button'); if(b) b.focus();
}
document.addEventListener('click',function(e){ if(!(e.target.closest&&(e.target.closest('#ph-menu')||e.target.closest('.ph-more')))) phTutupMenu(); });
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') phTutupMenu();
  var t=e.target;
  if((e.key==='ArrowDown'||e.key==='ArrowUp') && t&&t.classList&&t.classList.contains('ph-row')){
    var n=e.key==='ArrowDown'?t.nextElementSibling:t.previousElementSibling; if(n&&n.classList.contains('ph-row')){ n.focus(); e.preventDefault(); }
  }
});

// -- Pasang / tukar paparan -----------------------------------------------------------------------------------------------------
function phPaparan(v){
  _ph.view=(v==='lama')?'lama':'baru';
  try{ localStorage.setItem(_PH_PREF,_ph.view); }catch(e){}
  _phPasang();
  if(_ph.view==='baru') phRender();
}
function _phPasang(){
  [['pengelola','prog-list'],['peserta','peny-pilih']].forEach(function(c){
    var m=c[0], lama=_phTop(document.getElementById(c[1])), root=document.getElementById(_ph[m].root);
    if(!root && lama){ root=document.createElement('div'); root.id=_ph[m].root; lama.parentNode.insertBefore(root,lama); }
    if(lama) lama.style.display=(_ph.view==='baru')?'none':'';
    if(root){
      root.style.display=(_ph.view==='baru')?'':'none';
      if(_ph.view==='lama'){ var b=document.getElementById('ph-kembali-'+m); if(!b&&lama){ b=document.createElement('div'); b.id='ph-kembali-'+m; b.className='ph-bar'; b.innerHTML='<div class="ph-view"><button type="button" onclick="phPaparan(\'baru\')">✨ Baharu</button><button type="button" class="on">Lama</button></div>'; lama.parentNode.insertBefore(b,lama); } if(b) b.style.display=''; }
      else { var b2=document.getElementById('ph-kembali-'+m); if(b2) b2.style.display='none'; }
    }
  });
}
(function(){
  try{ if(localStorage.getItem(_PH_PREF)==='lama') _ph.view='lama'; }catch(e){}
  // render semula bila data program dimuat / disegerak
  if(typeof applyProgFilt==='function'){ var _a=applyProgFilt; applyProgFilt=function(){ var r=_a.apply(this,arguments); _ph.dimuat=true; try{ phRender('pengelola'); phRender('peserta'); }catch(e){ console.warn('phRender:',e); } return r; }; }
  if(typeof renderPenyList==='function'){ var _b=renderPenyList; renderPenyList=function(){ var r=_b.apply(this,arguments); _ph.dimuat=true; try{ phRender('peserta'); phRender('pengelola'); }catch(e){ console.warn('phRender:',e); } return r; }; }
  // selepas penyertaan dihantar / modal ditutup: segarkan data & status
  if(typeof resetPeny==='function'){ var _c=resetPeny; resetPeny=function(){ var r=_c.apply(this,arguments); setTimeout(function(){ _ph.tugasMuat=false; _ph.tugas=null; try{ loadProgsForPeny(true,function(){ phRender(); },true); }catch(e){} },700); return r; }; }
  _phPasang();
})();
