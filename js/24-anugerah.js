// == ANUGERAH (ADMIN SAHAJA) ====================================================
// Rubrik Emas/Perak/Gangsa (semua sekolah) + Tempat 1-5 (sekolah SR/SM, guru SR/SM).
// Pengiraan & kawalan akses di pelayan (RPC anugerah_keputusan / anugerah_config_simpan — menolak bukan admin).
// Halaman ini hanya memaparkan, membolehkan admin melaras rubrik, pratonton & eksport. Lihat RUBRIK_ANUGERAH.md.
var _ag = {data:null, tab:'kat', filt:'semua', q:'', memuat:false};
var AG_LALAI = {
  normalisasi_peratusan:0.9,
  kategori:{berat:{mata:30,placements:10,program:20,peserta:15,bidang:10,kemenjadian:5,kualiti:10},mod:'MUTLAK',
    ambang:{emas:75,perak:55,gangsa:35},peratus:{emas:15,perak:25,gangsa:30},
    syarat:{emas:{placements:3,program:8},perak:{placements:1,program:5},gangsa:{placements:0,program:3}}},
  top:{berat:{mata:55,placements:20,program:10,peserta:5,bidang:5,kemenjadian:5,kualiti:0},bilangan:5,skor_minimum:20},
  guru:{berat:{mata:50,placements:15,program:15,peserta:10,bidang:5,kualiti:5},bilangan:5,skor_minimum:20}
};
var AG_LABEL = {mata:'Mata pencapaian',placements:'Bil. tempat 1–5',program:'Bil. program disertai',peserta:'Bil. peserta',bidang:'Kepelbagaian bidang',kemenjadian:'Kadar kemenjadian',kualiti:'Kelengkapan data'};
var AG_TAB = [['kat','🏅 Emas · Perak · Gangsa'],['sr','🏫 Sekolah Rendah (1–5)'],['sm','🏛 Sekolah Menengah (1–5)'],['gsr','👩‍🏫 Guru SR (1–5)'],['gsm','👨‍🏫 Guru SM (1–5)']];

function _agAdmin(){ return !!(typeof _sesi!=='undefined' && _sesi && _sesi.role==='admin'); }
function _agTahun(){ var t=(typeof _selTahun!=='undefined')?_selTahun:null; return (t && t!=='SEMUA' && Number(t))?Number(t):new Date().getFullYear(); }
function _agFmt(n,d){ n=Number(n); return isFinite(n)?n.toFixed(d==null?1:d):'—'; }
function _agPrefix(s,p){ return String(s||'').toUpperCase(); }

// -- Muat keputusan -------------------------------------------------------------
async function loadAnugerah(pratonton){
  if(!_agAdmin()) return;
  var host=document.getElementById('ag-hasil'); if(!host) return;
  _ag.memuat=true;
  host.innerHTML=ldInline('Mengira keputusan anugerah...');
  try{
    var cfg = pratonton ? _agBacaForm() : null;
    var r = await run('anugerahGS',{tahun:_agTahun(), config:cfg});
    _ag.data = r.data;
    if(!pratonton || !document.getElementById('ag-rubrik').innerHTML) _agRenderRubrik(r.data.config);
    _agRenderSemua();
    if(pratonton) toast('Pratonton dikira dengan rubrik pada borang (belum disimpan).','in');
  }catch(e){
    host.innerHTML='<div class="iwarn" style="font-size:.78rem;">⚠ '+esc(e.message)+'</div>';
  }finally{ _ag.memuat=false; }
}

// -- Borang rubrik ------------------------------------------------------------------
function _agInp(id,val,min,max,step,w){ return '<input type="number" id="'+id+'" value="'+esc(val)+'" min="'+min+'" max="'+max+'" step="'+(step||1)+'" style="width:'+(w||'70px')+';text-align:center;" oninput="_agKemasJumlah()">'; }
function _agBaris(bah,cfg,kunci){
  var b=cfg[bah].berat, h='';
  kunci.forEach(function(k){ h+='<div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.2rem 0;"><label for="ag-w-'+bah+'-'+k+'" style="margin:0;flex:1;">'+AG_LABEL[k]+'</label>'+_agInp('ag-w-'+bah+'-'+k,b[k]==null?0:b[k],0,100)+'</div>'; });
  return h+'<div id="ag-jml-'+bah+'" style="text-align:right;font-size:.74rem;font-weight:800;margin-top:.3rem;"></div>';
}
function _agRenderRubrik(c){
  var k=c.kategori, K7=['mata','placements','program','peserta','bidang','kemenjadian','kualiti'], G6=['mata','placements','program','peserta','bidang','kualiti'];
  var h='<details class="card mb2" id="ag-det" open><summary style="cursor:pointer;font-weight:800;font-size:.8rem;">⚙ RUBRIK PEMARKAHAN <span style="font-weight:600;color:var(--g6);">(boleh dilaras — pratonton dahulu sebelum simpan)</span></summary>'
   +'<div class="ag-grid" style="margin-top:.8rem;">'
   // Kategori
   +'<div class="ag-box"><div class="ag-h">🏅 Emas · Perak · Gangsa</div>'+_agBaris('kategori',c,K7)
   +'<div style="margin-top:.5rem;"><label for="ag-mod" style="margin:0;">Kaedah kategori</label>'
   +'<select id="ag-mod" onchange="_agKemasMod()"><option value="MUTLAK"'+(k.mod==='MUTLAK'?' selected':'')+'>MUTLAK — ikut ambang skor</option><option value="PERCENTILE"'+(k.mod==='PERCENTILE'?' selected':'')+'>PERCENTILE — ikut peratus sekolah</option></select></div>'
   +'<div id="ag-ambang" style="margin-top:.4rem;">'
   +_agPasang('Emas ≥ skor','ag-amb-emas',k.ambang.emas)+_agPasang('Perak ≥ skor','ag-amb-perak',k.ambang.perak)+_agPasang('Gangsa ≥ skor','ag-amb-gangsa',k.ambang.gangsa)+'</div>'
   +'<div id="ag-peratus" style="margin-top:.4rem;display:none;">'
   +_agPasang('Emas (% teratas)','ag-pct-emas',k.peratus.emas)+_agPasang('Perak (% seterusnya)','ag-pct-perak',k.peratus.perak)+_agPasang('Gangsa (% seterusnya)','ag-pct-gangsa',k.peratus.gangsa)+'</div>'
   +'<div class="ag-h2">Syarat minimum (turun satu tahap jika tidak dipenuhi)</div>'
   +['emas','perak','gangsa'].map(function(t){ return '<div style="display:flex;align-items:center;gap:.4rem;font-size:.72rem;padding:.15rem 0;"><b style="width:52px;text-transform:uppercase;">'+t+'</b> tempat ≥ '+_agInp('ag-sy-'+t+'-plc',k.syarat[t].placements,0,99,1,'52px')+' program ≥ '+_agInp('ag-sy-'+t+'-prog',k.syarat[t].program,0,999,1,'52px')+'</div>'; }).join('')
   +'</div>'
   // Top sekolah
   +'<div class="ag-box"><div class="ag-h">🏫 Tempat 1–5 Sekolah (SR &amp; SM berasingan)</div>'+_agBaris('top',c,K7)
   +_agPasang('Bilangan tempat','ag-top-bil',c.top.bilangan,1,10)+_agPasang('Skor minimum layak','ag-top-min',c.top.skor_minimum,0,100)
   +'<div class="ag-nota">Skor dibandingkan dengan sekolah terbaik dalam kohort (SR/SM) bagi setiap ukuran.</div></div>'
   // Guru
   +'<div class="ag-box"><div class="ag-h">👩‍🏫 Tempat 1–5 Guru (SR &amp; SM berasingan)</div>'+_agBaris('guru',c,G6)
   +_agPasang('Bilangan tempat','ag-guru-bil',c.guru.bilangan,1,10)+_agPasang('Skor minimum layak','ag-guru-min',c.guru.skor_minimum,0,100)
   +'<div class="ag-nota">Guru dikreditkan penuh bagi setiap pencapaian yang dibimbing (guru pengiring dipecah). Kelengkapan data = No. KP, jantina, bangsa &amp; telefon guru.</div></div>'
   +'</div>'
   +'<div style="margin-top:.7rem;font-size:.7rem;color:var(--g6);line-height:1.5;">Normalisasi kategori: setiap ukuran dibandingkan dengan persentil ke-'+_agInp('ag-norm',Math.round((c.normalisasi_peratusan||0.9)*100),50,100,1,'56px')+' kohort (dihadkan 100%). Mata dianggar (jika markah BAHAGIAN/NEGERI tiada): tempat '
   +'1=' + (c.mata_ganti&&c.mata_ganti.tempat?c.mata_ganti.tempat['1']:11) + ' … 5=' + (c.mata_ganti&&c.mata_ganti.tempat?c.mata_ganti.tempat['5']:7) + ' × pengganda peringkat (Bahagian ×'+((c.mata_ganti&&c.mata_ganti.peringkat&&c.mata_ganti.peringkat.BAHAGIAN)||1.2)+', Negeri ×'+((c.mata_ganti&&c.mata_ganti.peringkat&&c.mata_ganti.peringkat.NEGERI)||1.5)+').</div>'
   +'<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.8rem;">'
   +'<button type="button" class="btn bp" id="ag-btn-pra" onclick="agPratonton()">▶ PRATONTON</button>'
   +'<button type="button" class="btn bs" id="ag-btn-simpan" onclick="agSimpan()">💾 SIMPAN RUBRIK</button>'
   +'<button type="button" class="btn bs" onclick="agLalai()">↺ NILAI LALAI</button>'
   +'<button type="button" class="btn bs" onclick="agMuatTersimpan()">⟲ RUBRIK TERSIMPAN</button></div></details>';
  document.getElementById('ag-rubrik').innerHTML=h;
  _agKemasJumlah(); _agKemasMod();
}
function _agPasang(lbl,id,val,min,max){ return '<div style="display:flex;align-items:center;justify-content:space-between;gap:.5rem;padding:.15rem 0;font-size:.72rem;"><label for="'+id+'" style="margin:0;flex:1;">'+lbl+'</label>'+_agInp(id,val==null?0:val,min==null?0:min,max==null?100:max,1,'62px')+'</div>'; }
function _agKemasMod(){
  var m=document.getElementById('ag-mod'); if(!m) return;
  document.getElementById('ag-ambang').style.display=(m.value==='MUTLAK')?'block':'none';
  document.getElementById('ag-peratus').style.display=(m.value==='PERCENTILE')?'block':'none';
}
function _agKemasJumlah(){
  ['kategori','top','guru'].forEach(function(b){
    var j=0; Array.prototype.forEach.call(document.querySelectorAll('[id^="ag-w-'+b+'-"]'),function(i){ j+=Number(i.value)||0; });
    var e=document.getElementById('ag-jml-'+b); if(!e) return;
    e.textContent='Jumlah: '+j+' / 100'+(j===100?' ✓':' ✗'); e.style.color=(j===100)?'#1e8449':'var(--red)';
  });
}
function _agN(id,def){ var e=document.getElementById(id); var v=e?Number(e.value):NaN; return isFinite(v)?v:def; }
function _agBacaForm(){
  function berat(b,keys){ var o={}; keys.forEach(function(k){ o[k]=_agN('ag-w-'+b+'-'+k,0); }); return o; }
  var K7=['mata','placements','program','peserta','bidang','kemenjadian','kualiti'], G6=['mata','placements','program','peserta','bidang','kualiti'];
  function sy(t){ return {placements:_agN('ag-sy-'+t+'-plc',0),program:_agN('ag-sy-'+t+'-prog',0)}; }
  return {
    normalisasi_peratusan: Math.min(1,Math.max(0.5,_agN('ag-norm',90)/100)),
    kategori:{berat:berat('kategori',K7), mod:(document.getElementById('ag-mod')||{}).value||'MUTLAK',
      ambang:{emas:_agN('ag-amb-emas',75),perak:_agN('ag-amb-perak',55),gangsa:_agN('ag-amb-gangsa',35)},
      peratus:{emas:_agN('ag-pct-emas',15),perak:_agN('ag-pct-perak',25),gangsa:_agN('ag-pct-gangsa',30)},
      syarat:{emas:sy('emas'),perak:sy('perak'),gangsa:sy('gangsa')}},
    top:{berat:berat('top',K7),bilangan:_agN('ag-top-bil',5),skor_minimum:_agN('ag-top-min',20)},
    guru:{berat:berat('guru',G6),bilangan:_agN('ag-guru-bil',5),skor_minimum:_agN('ag-guru-min',20)}
  };
}
function _agSahJumlah(){
  var ok=true;
  ['kategori','top','guru'].forEach(function(b){ var j=0; Array.prototype.forEach.call(document.querySelectorAll('[id^="ag-w-'+b+'-"]'),function(i){ j+=Number(i.value)||0; }); if(j!==100) ok=false; });
  if(!ok) toast('Jumlah berat bagi setiap bahagian mesti tepat 100.','er');
  return ok;
}
async function agPratonton(){ if(!_agSahJumlah()) return; btnBusy('ag-btn-pra',true,'Mengira...'); try{ await loadAnugerah(true); } finally{ btnBusy('ag-btn-pra',false); } }
async function agSimpan(){
  if(!_agSahJumlah()) return;
  askConfirm('💾 SIMPAN RUBRIK','Rubrik ini akan menjadi lalai untuk semua pengiraan anugerah. Teruskan?',async function(){
    btnBusy('ag-btn-simpan',true,'Menyimpan...');
    try{ await run('anugerahSimpanGS',{config:_agBacaForm()}); toast('Rubrik disimpan.','ok'); await loadAnugerah(false); }
    catch(e){ toast('Gagal menyimpan: '+e.message,'er'); }
    finally{ btnBusy('ag-btn-simpan',false); }
  });
}
function agLalai(){ _agRenderRubrik(JSON.parse(JSON.stringify(AG_LALAI))); toast('Nilai lalai dimuatkan ke borang (tekan PRATONTON / SIMPAN).','in'); }
function agMuatTersimpan(){ document.getElementById('ag-rubrik').innerHTML=''; loadAnugerah(false); }

// -- Paparan keputusan ------------------------------------------------------------------
function _agBadge(k){
  var m={EMAS:['🥇 EMAS','#7a5b00','#fff0b8'],PERAK:['🥈 PERAK','#4a5560','#e4e8ec'],GANGSA:['🥉 GANGSA','#7a3b12','#f6dfcc'],TIADA:['—','#6c757d','#f1f3f5']}[k]||['—','#6c757d','#f1f3f5'];
  return '<span style="display:inline-block;padding:.1rem .55rem;border-radius:20px;font-size:.68rem;font-weight:800;background:'+m[2]+';color:'+m[1]+';">'+m[0]+'</span>';
}
function _agMedal(n){ return n===1?'🥇':n===2?'🥈':n===3?'🥉':String(n); }
function _agRenderSemua(){
  var d=_ag.data; if(!d) return;
  var r=d.ringkasan, h='';
  h+='<div class="ag-cards">'
    +[['EMAS',r.emas],['PERAK',r.perak],['GANGSA',r.gangsa],['TIADA',r.tiada]].map(function(x){ return '<div class="ag-card">'+_agBadge(x[0])+'<div class="ag-num">'+x[1]+'</div><div class="ag-sub">sekolah</div></div>'; }).join('')
    +'<div class="ag-card"><div class="ag-sub">Jumlah sekolah dinilai</div><div class="ag-num">'+r.jumlah_sekolah+'</div><div class="ag-sub">'+r.tiada_penyertaan+' tiada penyertaan</div></div></div>';
  h+=_agNota(d);
  h+='<div class="ag-tabs" role="tablist">'+AG_TAB.map(function(t){ return '<button type="button" role="tab" aria-selected="'+(_ag.tab===t[0])+'" class="ag-tab'+(_ag.tab===t[0]?' on':'')+'" onclick="agTab(\''+t[0]+'\')">'+t[1]+'</button>'; }).join('')+'</div>';
  h+='<div id="ag-isi"></div>';
  h+='<div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:.9rem;"><button type="button" class="btn bp" onclick="agEksport()">⬇ EKSPORT EXCEL</button>'
    +'<span style="font-size:.68rem;color:var(--g6);align-self:center;">Tahun '+d.tahun+' — keputusan ialah cadangan berasaskan data; semak Nota Data sebelum diumumkan.</span></div>';
  document.getElementById('ag-hasil').innerHTML=h;
  _agRenderIsi();
}
function _agNota(d){
  var a=d.amaran, r=d.ringkasan, n=[];
  n.push('<b>'+a.baris_pencapaian+'</b> baris pencapaian dikira sebagai unit unik: keputusan berkumpulan dikira <b>sekali</b> (bukan setiap peserta).');
  if(a.baris_keseluruhan_dikecualikan>0) n.push(a.baris_keseluruhan_dikecualikan+' baris kategori KESELURUHAN dikecualikan (agregat, markah tiada).');
  if(a.unit_markah_dianggar>0) n.push('<b>'+a.unit_markah_dianggar+'</b> keputusan tiada markah (Bahagian/Negeri) — mata <b>dianggar</b> mengikut jadual rubrik. Lengkapkan markah rasmi jika ada.');
  if(a.pencapaian_guru_berganda>0) n.push(a.pencapaian_guru_berganda+' baris pencapaian mempunyai lebih seorang guru — setiap guru dikreditkan penuh.');
  if(a.pencapaian_tanpa_guru>0) n.push(a.pencapaian_tanpa_guru+' baris pencapaian <b>tiada nama guru</b> — tidak dikira untuk guru.');
  if(a.guru_tanpa_kp>0) n.push(a.guru_tanpa_kp+' guru tiada No. KP sah — dikenal pasti melalui nama sahaja.');
  if(a.baris_penyertaan_tanpa_peserta>0) n.push(a.baris_penyertaan_tanpa_peserta+' baris penyertaan hanya guru (tiada peserta) — tidak dikira sebagai peserta.');
  if(r.tidak_konsisten>0) n.push('<b>'+r.tidak_konsisten+'</b> sekolah ada pencapaian tetapi tiada rekod penyertaan — semak data.');
  return '<details class="card mb2" style="font-size:.72rem;"><summary style="cursor:pointer;font-weight:800;">🧾 NOTA DATA (${n} perkara)</summary><ul style="margin:.5rem 0 0 1.1rem;line-height:1.6;">'.replace('${n}',n.length)+n.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul></details>';
}
function agTab(t){ _ag.tab=t; Array.prototype.forEach.call(document.querySelectorAll('.ag-tab'),function(b){ var on=b.getAttribute('onclick').indexOf("'"+t+"'")>=0; b.classList.toggle('on',on); b.setAttribute('aria-selected',on); }); _agRenderIsi(); }
function agFilt(f){ _ag.filt=f; _agRenderIsi(); }
function agCari(q){ _ag.q=String(q||'').toLowerCase(); _agRenderIsi(true); }

function _agTblTop(arr,jenisTeks,guru,min){
  if(!arr.length) return '<div class="empty" style="padding:1rem;"><div class="ei">📭</div><h3>Tiada yang melepasi skor minimum ('+min+')</h3></div>';
  var kira={}; arr.forEach(function(x){ kira[x.kedudukan]=(kira[x.kedudukan]||0)+1; });
  var h='<div class="tw"><table class="ag-tbl"><caption style="text-align:left;font-size:.7rem;color:var(--g6);padding:.3rem 0;">'+jenisTeks+' — skor minimum layak: '+min+'. Seri dipecahkan oleh: tempat pertama, mata, program.</caption><thead><tr><th>#</th><th>'+(guru?'Guru':'Sekolah')+'</th>'+(guru?'<th>Sekolah</th>':'')+'<th>Skor</th><th>Mata</th><th>Tempat 1</th><th>Tempat 1–5</th><th>Program</th><th>Peserta</th></tr></thead><tbody>';
  arr.forEach(function(x){
    h+='<tr><td style="font-size:1rem;">'+_agMedal(x.kedudukan)+(kira[x.kedudukan]>1?' <span title="Seri" style="font-size:.6rem;color:var(--red);font-weight:800;">SERI</span>':'')+'</td><td><b>'+esc(x.nama)+'</b>'+(x.tanpa_kp?' <span title="Tiada No. KP sah" style="color:#b9770e;">⚠</span>':'')+'</td>'
      +(guru?'<td>'+esc(x.sekolah||'—')+'</td>':'')+'<td><b>'+_agFmt(x.skor)+'</b></td><td>'+_agFmt(x.mata,0)+'</td><td>'+x.t1+'</td><td>'+x.placements+'</td><td>'+x.prog+'</td><td>'+x.peserta+'</td></tr>';
  });
  return h+'</tbody></table></div>';
}
function _agRenderIsi(kekalCari){
  var d=_ag.data, host=document.getElementById('ag-isi'); if(!d||!host) return;
  var c=d.config, t=_ag.tab, h='';
  if(t==='kat'){
    var f=_ag.filt, q=_ag.q;
    var rows=d.sekolah.filter(function(s){ return (f==='semua'||s.kategori===f.toUpperCase()) && (!q||String(s.nama).toLowerCase().indexOf(q)>=0||String(s.kod).toLowerCase().indexOf(q)>=0); });
    h+='<div style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center;margin-bottom:.6rem;">'
      +['semua','emas','perak','gangsa','tiada'].map(function(x){ return '<button type="button" class="btn bsm '+(_ag.filt===x?'bp':'bs')+'" onclick="agFilt(\''+x+'\')">'+x.toUpperCase()+'</button>'; }).join('')
      +'<input type="search" id="ag-cari" placeholder="Cari sekolah..." value="'+esc(_ag.q)+'" oninput="agCari(this.value)" style="flex:1;min-width:140px;" aria-label="Cari sekolah"></div>';
    h+='<div class="tw"><table class="ag-tbl"><caption style="text-align:left;font-size:.7rem;color:var(--g6);padding:.3rem 0;">'+rows.length+' sekolah. Kaedah: '+esc(c.kategori.mod)+'. Skor 0–100 (SR dan SM dibandingkan dalam kohort masing-masing).</caption>'
      +'<thead><tr><th>#</th><th>Sekolah</th><th>Jenis</th><th>Skor</th><th>Kategori</th><th>Mata</th><th>T1–5</th><th>Prog.</th><th>Peserta</th><th>Bidang</th><th>Data</th></tr></thead><tbody>';
    rows.forEach(function(s){
      h+='<tr><td>'+s.kedudukan_kat+'</td><td><b>'+esc(s.nama)+'</b> <span style="color:var(--g6);font-size:.62rem;">'+esc(s.kod)+'</span>'
        +(s.turun?' <span title="Diturunkan kerana syarat minimum tidak dipenuhi (asal: '+esc(s.kategori_asal)+')" style="color:#b9770e;font-size:.64rem;font-weight:800;">⬇ turun dari '+esc(s.kategori_asal)+'</span>':'')
        +(s.tidak_konsisten?' <span title="Ada pencapaian tetapi tiada rekod penyertaan" style="color:var(--red);font-size:.64rem;font-weight:800;">⚠ semak data</span>':'')+'</td>'
        +'<td>'+s.jenis+'</td><td><b>'+_agFmt(s.skor_kat)+'</b></td><td>'+_agBadge(s.kategori)+'</td><td>'+_agFmt(s.mata,0)+(s.mata_dianggar>0?'<span title="'+s.mata_dianggar+' keputusan markah dianggar" style="color:#b9770e;">*</span>':'')+'</td><td>'+s.placements+'</td><td>'+s.prog+'</td><td>'+s.peserta+'</td><td>'+s.bidang+'</td><td>'+Math.round((s.kualiti||0)*100)+'%</td></tr>';
    });
    host.innerHTML=h+'</tbody></table></div>';
    if(kekalCari){ var ci=document.getElementById('ag-cari'); if(ci){ ci.focus(); ci.setSelectionRange(ci.value.length,ci.value.length); } }
    return;
  }
  if(t==='sr') h=_agTblTop(d.top_sekolah.SR,'Sekolah Rendah',false,c.top.skor_minimum);
  if(t==='sm') h=_agTblTop(d.top_sekolah.SM,'Sekolah Menengah',false,c.top.skor_minimum);
  if(t==='gsr') h=_agTblTop(d.top_guru.SR,'Guru Sekolah Rendah',true,c.guru.skor_minimum);
  if(t==='gsm') h=_agTblTop(d.top_guru.SM,'Guru Sekolah Menengah',true,c.guru.skor_minimum);
  host.innerHTML=h;
}

// -- Eksport Excel -------------------------------------------------------------------------
function agEksport(){
  var d=_ag.data; if(!d){ toast('Tiada data untuk dieksport.','er'); return; }
  if(typeof XLSX==='undefined'){ toast('Pustaka Excel tidak dimuatkan. Semak sambungan internet.','er'); return; }
  var c=d.config, wb=XLSX.utils.book_new();
  var rub=[['ANUGERAH UPBM SUBIS — TAHUN '+d.tahun],[],['Bahagian','Ukuran','Berat (%)']];
  ['kategori','top','guru'].forEach(function(b){ Object.keys(c[b].berat).forEach(function(k){ rub.push([b==='kategori'?'Emas/Perak/Gangsa':b==='top'?'Tempat 1-5 Sekolah':'Tempat 1-5 Guru',AG_LABEL[k]||k,c[b].berat[k]]); }); });
  rub.push([],['Kaedah kategori',c.kategori.mod],['Ambang (Emas/Perak/Gangsa)',c.kategori.ambang.emas+' / '+c.kategori.ambang.perak+' / '+c.kategori.ambang.gangsa],
    ['Syarat Emas (tempat >= / program >=)',c.kategori.syarat.emas.placements+' / '+c.kategori.syarat.emas.program],['Syarat Perak',c.kategori.syarat.perak.placements+' / '+c.kategori.syarat.perak.program],['Syarat Gangsa',c.kategori.syarat.gangsa.placements+' / '+c.kategori.syarat.gangsa.program],
    ['Skor minimum sekolah / guru',c.top.skor_minimum+' / '+c.guru.skor_minimum]);
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(rub),'Rubrik');
  var kat=[['#','Kod','Sekolah','Jenis','Skor','Kategori','Kategori asal','Mata','Tempat 1','Tempat 1-5','Program','Peserta','Bidang','Kelengkapan data %']];
  d.sekolah.forEach(function(s){ kat.push([s.kedudukan_kat,s.kod,s.nama,s.jenis,s.skor_kat,s.kategori,s.kategori_asal,s.mata,s.t1,s.placements,s.prog,s.peserta,s.bidang,Math.round((s.kualiti||0)*100)]); });
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(kat),'Emas-Perak-Gangsa');
  function top(arr,guru){ var o=[['Tempat',guru?'Guru':'Sekolah'].concat(guru?['Sekolah']:[],['Skor','Mata','Tempat 1','Tempat 1-5','Program','Peserta'])]; arr.forEach(function(x){ o.push([x.kedudukan,x.nama].concat(guru?[x.sekolah]:[],[x.skor,x.mata,x.t1,x.placements,x.prog,x.peserta])); }); return o; }
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(top(d.top_sekolah.SR,false)),'Sekolah Rendah 1-5');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(top(d.top_sekolah.SM,false)),'Sekolah Menengah 1-5');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(top(d.top_guru.SR,true)),'Guru SR 1-5');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(top(d.top_guru.SM,true)),'Guru SM 1-5');
  XLSX.writeFile(wb,'Anugerah_UPBM_Subis_'+d.tahun+'.xlsx');
}
