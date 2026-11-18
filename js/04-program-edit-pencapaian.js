// == Dirty flag — aktif semula butang simpan apabila ada perubahan selepas simpan ==
var _editSaved = false;
function _onEditChange(){
  if(!_editSaved) return;
  // Ada perubahan selepas simpan — aktifkan semula butang
  var simpanBtn = document.getElementById('btn-edit-simpan');
  if(simpanBtn && simpanBtn.disabled){
    simpanBtn.textContent = '💾 SIMPAN PROGRAM';
    simpanBtn.style.background = '';
    simpanBtn.disabled = false;
  }
  // Buang butang tutup lama jika ada
  var tb = document.querySelector('#mo-edit-foot .btn-tutup-edit');
  if(tb) tb.remove();
  _editSaved = false;
}

// == Simpan kemaskini program ==================================================
async function saveEdit(){
  var id   = document.getElementById('e-id').value.trim();
  var nama = document.getElementById('e-nama').value.trim();
  var pen  = document.getElementById('e-pen').value.trim();
  var kod  = document.getElementById('e-kod').value.trim().toUpperCase();
  var bid  = document.getElementById('e-bidang').value;
  var per  = document.getElementById('e-per').value;
  var tar  = document.getElementById('e-tarikh').value;
  var tem  = document.getElementById('e-tempat').value.trim();
  var sta  = document.getElementById('e-status').value;
  var luar = !!(document.getElementById('e-luar')||{}).checked;

  if(!nama){ toast('Nama program tidak boleh kosong','er'); return; }
  if(!pen){  toast('Nama pengelola tidak boleh kosong','er'); return; }
  if(!tar){  toast('Tarikh program tidak boleh kosong','er'); return; }
  if(!tem){  toast('Tempat program tidak boleh kosong','er'); return; }

  var katList = Array.from(
    document.querySelectorAll('#e-kat-wrap input[type=checkbox]:checked')
  ).map(function(cb){ return cb.value; });
  if(!katList.length){ toast('Pilih sekurang-kurangnya satu kategori','er'); return; }

  showOv('MENYIMPAN PROGRAM...');
  try{
    var r = await run('kemaskiniProgramGS',{
      id:           id,
      nama:         nama,
      pengelola:    pen,
      kodPengelola: kod,
      bidang:       bid,
      kategori:     katList,
      peringkat:    per,
      tarikh:       tar,
      tempat:       tem,
      status:       sta,
      aktivitiLuar: luar,
    });
    if(r&&r.ok){
      toast('Program berjaya dikemaskini ✓','ok');
      try{ if(typeof psSimpanEdit==='function') await psSimpanEdit(id); }
      catch(e3){ toast('Program disimpan, tetapi senarai sekolah gagal dikemaskini: '+e3.message,'er'); }
      _editSaved = true;
      cBust();
      await loadProgs(true);
      // Kemas butang simpan
      var simpanBtn = document.getElementById('btn-edit-simpan');
      if(simpanBtn){ simpanBtn.textContent='✓ DISIMPAN'; simpanBtn.style.background='#27ae60'; simpanBtn.disabled=true; }
      // Tambah butang tutup jika belum ada
      var ef = document.getElementById('mo-edit-foot');
      if(ef && !ef.querySelector('.btn-tutup-edit')){
        var tb = document.createElement('button');
        tb.className = 'btn bs btn-tutup-edit';
        tb.textContent = '✕ TUTUP';
        tb.onclick = function(){
          closeMo('mo-edit');
          setTimeout(function(){
            var b = document.querySelector('#mo-edit-foot .btn-tutup-edit');
            if(b) b.remove();
            var sb2 = document.getElementById('btn-edit-simpan');
            if(sb2){ sb2.textContent='💾 SIMPAN PROGRAM'; sb2.style.background=''; sb2.disabled=false; }
            _editSaved = false;
          }, 400);
        };
        ef.insertBefore(tb, ef.firstChild);
      }
    } else {
      toast('Gagal: '+(r&&r.msg?r.msg:'Ralat tidak diketahui'),'er');
    }
  }catch(e){ toast('Ralat: '+e.message,'er'); }
  finally{ hideOv(); }
}
function renderPcForm(pny,pnc,katRaw){
  _pps={};_gps={};
  pny.forEach(function(p){
    var sk=p['Nama Sekolah'];if(!sk)return;
    var kat2=p['Kategori Penyertaan']||'';
    var key=sk+'||'+kat2;
    if(!_pps[key])_pps[key]=[];if(!_gps[key])_gps[key]=[];
    if(p['Nama Peserta']&&!_pps[key].find(function(x){return x.n===p['Nama Peserta'];}))_pps[key].push({n:p['Nama Peserta'],kp:p['No KP Peserta']||''});
    if(p['Nama Guru']&&!_gps[key].find(function(x){return x.n===p['Nama Guru'];}))_gps[key].push({n:p['Nama Guru'],kp:p['No KP Guru']||''});
    if(!_pps[sk])_pps[sk]=[];if(!_gps[sk])_gps[sk]=[];
    if(p['Nama Peserta']&&!_pps[sk].find(function(x){return x.n===p['Nama Peserta'];}))_pps[sk].push({n:p['Nama Peserta'],kp:p['No KP Peserta']||''});
    if(p['Nama Guru']&&!_gps[sk].find(function(x){return x.n===p['Nama Guru'];}))_gps[sk].push({n:p['Nama Guru'],kp:p['No KP Guru']||''});
  });
  var katList=(katRaw||'INDIVIDU LELAKI,INDIVIDU PEREMPUAN').split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean);
  var sekS={};pny.forEach(function(p){if(p['Nama Sekolah'])sekS[p['Nama Sekolah']]=true;});
  // Sekolah ditick tetapi belum ada penyertaan: tersenarai, ditanda amaran (peserta/guru tiada sehingga mereka daftar penyertaan)
  var _belumPny={}, _belumSen=[];
  (typeof _pcTicked!=='undefined'?_pcTicked:[]).forEach(function(t){
    if(!t||!t.nama_sekolah) return;
    if(!sekS[t.nama_sekolah]){ _belumPny[t.nama_sekolah]=true; _belumSen.push(t.nama_sekolah); }
    sekS[t.nama_sekolah]=true;
  });
  var seks=Object.keys(sekS);
  if(!seks.length){
    document.getElementById('pc-form').innerHTML='<div class="empty" style="padding:.7rem;"><h3>Tiada penyertaan direkod</h3></div>';
    document.getElementById('pc-ld').style.display='none';
    document.getElementById('pc-form').style.display='block';
    return;
  }

  // Kategorikan: individu, berkumpulan, keseluruhan
  var katInd=katList.filter(function(k){return k.indexOf('INDIVIDU')>=0&&k!=='TERBUKA INDIVIDU';});
  var katBrk=katList.filter(function(k){return k.indexOf('BERKUMPULAN')>=0&&k!=='TERBUKA BERKUMPULAN';});
  var katKsl=katList.filter(function(k){return k==='KESELURUHAN';});
  var katTrbInd=katList.filter(function(k){return k==='TERBUKA INDIVIDU'||k==='TERBUKA';});
  var katTrbBrk=katList.filter(function(k){return k==='TERBUKA BERKUMPULAN';});

  // Bina borang bersepadu - semua kategori dalam satu paparan
  var html='';

  // == BAHAGIAN 1: INDIVIDU ==
  if(katInd.length){
    html+='<div style="background:rgba(41,128,185,.06);border:1.5px solid rgba(41,128,185,.2);border-radius:var(--r);padding:.7rem;margin-bottom:.9rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:#2980b9;margin-bottom:.6rem;">👤 INDIVIDU</div>';
    katInd.forEach(function(kat){
      var exForKat={};
      pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){exForKat[p['Tempat']]=p;});
      html+='<div style="margin-bottom:.6rem;">';
      html+='<div style="font-size:.65rem;font-weight:800;color:#2980b9;text-transform:uppercase;margin-bottom:.4rem;padding:.18rem .48rem;background:rgba(41,128,185,.1);border-radius:4px;display:inline-block;">'+kat+'</div>';
      getTPT(kat).forEach(function(t){
        var e=exForKat[t.l]||{};
        var so='<option value="">— PILIH SEKOLAH —</option>';
        seks.forEach(function(s){so+='<option value="'+esc(s)+'"'+(e['Nama Sekolah']===s?' selected':'')+'>'+s+(_belumPny[s]?' ⚠ BELUM DAFTAR PENYERTAAN':'')+'</option>';});
        var katKey=kat.replace(/\s/g,'-');
        var po='<option value="">— PILIH PESERTA —</option>';
        var ss=e['Nama Sekolah']||'';
        var pKey=ss+'||'+kat;
        (_pps[pKey]||_pps[ss]||[]).forEach(function(ps){po+='<option value="'+ps.n+'|'+ps.kp+'"'+(e['Nama Peserta']===ps.n?' selected':'')+'>'+ps.n+'</option>';});
        var go='<option value="">— PILIH GURU —</option>';
        (_gps[ss]||[]).forEach(function(g){go+='<option'+(e['Nama Guru']===g.n?' selected':'')+'>'+g.n+'</option>';});
        html+='<div class="pcs" style="background:#fff;border:1px solid var(--g2);border-radius:var(--r);padding:.6rem;margin-bottom:.45rem;">'
          +'<div class="pct" style="font-size:.62rem;color:var(--g6);">'+t.l+'</div>'
          +'<div class="fg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.45rem;">'
          +'<div class="fi"><label>SEKOLAH</label><select id="pc-s-'+katKey+'-'+t.k+'" onchange="rPGKat(\''+kat+'\',\''+t.k+'\');updateMarkah(\''+kat+'\',\''+t.k+'\');_autoFillBrkKsl();">'+so+'</select></div>'
          +'<div class="fi"><label>PESERTA</label><div class="chkd" id="pc-p-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>GURU</label><div class="chkd" id="pc-g-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>MARKAH AUTO</label><input type="text" readonly id="pc-m-'+katKey+'-'+t.k+'" style="background:var(--g1);color:var(--red);font-weight:800;" placeholder="—" value="'+(e['Nama Sekolah']?mPts(gv('e-per')||'SEKOLAH',t.l)+' mata':'')+'"></div>'
          +'</div></div>';
      });
      html+='</div>';
    });
    html+='</div>';
  }

  // == BAHAGIAN 2: BERKUMPULAN (auto-isi) ==
  if(katBrk.length){
    html+='<div style="background:rgba(39,174,96,.06);border:1.5px solid rgba(39,174,96,.2);border-radius:var(--r);padding:.7rem;margin-bottom:.9rem;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem;flex-wrap:wrap;gap:.4rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:#27ae60;">👥 BERKUMPULAN</div>'
      +'<button class="btn bi bsm" onclick="_autoFillBrkKsl()" style="font-size:.62rem;">⚡ AUTO-ISI SEMULA</button>'
      +'</div>'
      +'<div class="iok" style="margin-bottom:.6rem;font-size:.68rem;">💡 Auto-isi berdasarkan jumlah markah individu. Anda boleh kemaskini secara manual.</div>';
    katBrk.forEach(function(kat){
      var exForKat={};
      pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){exForKat[p['Tempat']]=p;});
      html+='<div style="margin-bottom:.6rem;">';
      html+='<div style="font-size:.65rem;font-weight:800;color:#27ae60;text-transform:uppercase;margin-bottom:.4rem;padding:.18rem .48rem;background:rgba(39,174,96,.1);border-radius:4px;display:inline-block;">'+kat+'</div>';
      getTPT(kat).forEach(function(t){
        var e=exForKat[t.l]||{};
        var so='<option value="">— PILIH SEKOLAH —</option>';
        seks.forEach(function(s){so+='<option value="'+esc(s)+'"'+(e['Nama Sekolah']===s?' selected':'')+'>'+s+(_belumPny[s]?' ⚠ BELUM DAFTAR PENYERTAAN':'')+'</option>';});
        var katKey=kat.replace(/\s/g,'-');
        var go='<option value="">— PILIH GURU —</option>';
        var ss=e['Nama Sekolah']||'';
        (_gps[ss]||[]).forEach(function(g){go+='<option'+(e['Nama Guru']===g.n?' selected':'')+'>'+g.n+'</option>';});
        html+='<div class="pcs" style="background:#fff;border:1px solid rgba(39,174,96,.2);border-radius:var(--r);padding:.6rem;margin-bottom:.45rem;">'
          +'<div class="pct" style="font-size:.62rem;color:var(--g6);">'+t.l+'</div>'
          +'<div class="fg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.45rem;">'
          +'<div class="fi"><label>SEKOLAH</label><select id="pc-s-'+katKey+'-'+t.k+'" onchange="rPGKat(\''+kat+'\',\''+t.k+'\');updateMarkah(\''+kat+'\',\''+t.k+'\');">'+so+'</select></div>'
          +'<div class="fi"><label>GURU</label><div class="chkd" id="pc-g-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>MARKAH AUTO</label><input type="text" readonly id="pc-m-'+katKey+'-'+t.k+'" style="background:var(--g1);color:#27ae60;font-weight:800;" placeholder="—" value="'+(e['Nama Sekolah']?mPts(gv('e-per')||'SEKOLAH',t.l)+' mata':'')+'"></div>'
          +'</div></div>';
      });
      html+='</div>';
    });
    html+='</div>';
  }

  // == BAHAGIAN 3: KESELURUHAN (auto-isi) ==
  if(katKsl.length){
    html+='<div style="background:rgba(192,57,43,.05);border:1.5px solid rgba(192,57,43,.18);border-radius:var(--r);padding:.7rem;margin-bottom:.9rem;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.5rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:var(--red);">🏆 KESELURUHAN</div>'
      +'<div style="display:flex;align-items:center;gap:.4rem;">'
      +'<span style="font-size:.62rem;color:var(--g6);font-weight:700;">Kira daripada:</span>'
      +'<select id="ksl-sumber" style="font-size:.62rem;padding:.18rem .5rem;border-radius:5px;border:1.5px solid var(--g3);background:#fff;font-weight:700;cursor:pointer;" onchange="_autoFillBrkKsl()">'
      +'<option value="IND_BRK" selected>Individu + Kumpulan</option>'
      +'<option value="BRK">Kumpulan sahaja</option>'
      +'</select>'
      +'</div></div>'
      +'<div class="iok" style="margin-bottom:.6rem;font-size:.67rem;">💡 Auto-isi berdasarkan pilihan sumber di atas.</div>';
    katKsl.forEach(function(kat){
      var exForKat={};
      pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){exForKat[p['Tempat']]=p;});
      getTPT(kat).forEach(function(t){
        var e=exForKat[t.l]||{};
        var so='<option value="">— PILIH SEKOLAH —</option>';
        seks.forEach(function(s){so+='<option value="'+esc(s)+'"'+(e['Nama Sekolah']===s?' selected':'')+'>'+s+(_belumPny[s]?' ⚠ BELUM DAFTAR PENYERTAAN':'')+'</option>';});
        var katKey=kat.replace(/\s/g,'-');
        var go='<option value="">— PILIH GURU —</option>';
        var ss=e['Nama Sekolah']||'';
        (_gps[ss]||[]).forEach(function(g){go+='<option'+(e['Nama Guru']===g.n?' selected':'')+'>'+g.n+'</option>';});
        html+='<div class="pcs" style="background:#fff;border:1px solid rgba(192,57,43,.18);border-radius:var(--r);padding:.6rem;margin-bottom:.45rem;">'
          +'<div class="pct">'+t.l+'</div>'
          +'<div class="fg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.45rem;">'
          +'<div class="fi"><label>SEKOLAH</label><select id="pc-s-'+katKey+'-'+t.k+'" onchange="rPGKat(\''+kat+'\',\''+t.k+'\');updateMarkah(\''+kat+'\',\''+t.k+'\');">'+so+'</select></div>'
          +'<div class="fi"><label>GURU</label><div class="chkd" id="pc-g-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>MARKAH AUTO</label><input type="text" readonly id="pc-m-'+katKey+'-'+t.k+'" style="background:var(--g1);color:var(--red);font-weight:800;" placeholder="—" value="'+(e['Nama Sekolah']?mPts(gv('e-per')||'SEKOLAH',t.l)+' mata':'')+'"></div>'
          +'</div></div>';
      });
    });
    html+='</div>';
  }

  // == BAHAGIAN 4: TERBUKA INDIVIDU (ada peserta) ==
  if(katTrbInd.length){
    html+='<div style="background:rgba(230,126,34,.06);border:1.5px solid rgba(230,126,34,.2);border-radius:var(--r);padding:.7rem;margin-bottom:.9rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:#e67e22;margin-bottom:.6rem;">🎯 TERBUKA INDIVIDU</div>'
      +'<div class="iok" style="margin-bottom:.6rem;font-size:.67rem;">💡 Markah auto-kira berdasarkan peringkat program. Pilih peserta untuk setiap tempat.</div>';
    katTrbInd.forEach(function(kat){
      var exForKat={};
      pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){exForKat[p['Tempat']]=p;});
      getTPT(kat).forEach(function(t){
        var e=exForKat[t.l]||{};
        var so='<option value="">-- PILIH SEKOLAH --</option>';
        seks.forEach(function(s){so+='<option value="'+esc(s)+'"'+(e['Nama Sekolah']===s?' selected':'')+'>'+s+(_belumPny[s]?' ⚠ BELUM DAFTAR PENYERTAAN':'')+'</option>';});
        var katKey=kat.replace(/\s/g,'-');
        var po='<option value="">-- PILIH PESERTA --</option>';
        var ss=e['Nama Sekolah']||'';
        var pKey=ss+'||'+kat;
        (_pps[pKey]||_pps[ss]||[]).forEach(function(p){po+='<option value="'+p.n+'|'+p.kp+'"'+(e['Nama Peserta']===p.n?' selected':'')+'>'+p.n+'</option>';});
        var go='<option value="">-- PILIH GURU --</option>';
        (_gps[pKey]||_gps[ss]||[]).forEach(function(g){go+='<option'+(e['Nama Guru']===g.n?' selected':'')+'>'+g.n+'</option>';});
        var autoMarkah=mPts(gv('e-per')||'SEKOLAH',t.l);
        var exMarkah=e['Markah']!==undefined&&e['Markah']!==''?e['Markah']:autoMarkah;
        html+='<div class="pcs" style="background:#fff;border:1px solid rgba(230,126,34,.2);border-radius:var(--r);padding:.6rem;margin-bottom:.45rem;">'
          +'<div class="pct">'+t.l+'</div>'
          +'<div class="fg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.45rem;">'
          +'<div class="fi"><label>SEKOLAH</label><select id="pc-s-'+katKey+'-'+t.k+'" onchange="rPGKat(\''+kat+'\',\''+t.k+'\');">'+so+'</select></div>'
          +'<div class="fi"><label>PESERTA</label><div class="chkd" id="pc-p-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>GURU</label><div class="chkd" id="pc-g-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>MARKAH AUTO</label><input type="text" readonly id="pc-m-'+katKey+'-'+t.k+'" style="background:var(--g1);color:#e67e22;font-weight:800;" value="'+exMarkah+'"></div>'
          +'</div></div>';
      });
    });
    html+='</div>';
  }

  // == BAHAGIAN 5: TERBUKA BERKUMPULAN (markah sekolah dikira sekali) ==
  if(katTrbBrk.length){
    html+='<div style="background:rgba(211,84,0,.06);border:1.5px solid rgba(211,84,0,.25);border-radius:var(--r);padding:.7rem;margin-bottom:.9rem;">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:.6rem;flex-wrap:wrap;gap:.4rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;color:#d35400;">👥 TERBUKA BERKUMPULAN</div>'
      +'</div>'
      +'<div class="iok" style="margin-bottom:.6rem;font-size:.68rem;">💡 Markah sekolah dikira SEKALI sahaja walaupun ada berbilang peserta.</div>';
    katTrbBrk.forEach(function(kat){
      var exForKat={};
      pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){exForKat[p['Tempat']]=p;});
      html+='<div style="margin-bottom:.6rem;">';
      getTPT(kat).forEach(function(t){
        var e=exForKat[t.l]||{};
        var so='<option value="">— PILIH SEKOLAH —</option>';
        seks.forEach(function(s){so+='<option value="'+esc(s)+'"'+(e['Nama Sekolah']===s?' selected':'')+'>'+s+(_belumPny[s]?' ⚠ BELUM DAFTAR PENYERTAAN':'')+'</option>';});
        var katKey=kat.replace(/\s/g,'-');
        var go='<option value="">— PILIH GURU —</option>';
        var ss=e['Nama Sekolah']||'';
        (_gps[ss]||[]).forEach(function(g){go+='<option'+(e['Nama Guru']===g.n?' selected':'')+'>'+g.n+'</option>';});
        html+='<div class="pcs" style="background:#fff;border:1px solid rgba(211,84,0,.2);border-radius:var(--r);padding:.6rem;margin-bottom:.45rem;">'
          +'<div class="pct" style="font-size:.62rem;color:var(--g6);">'+t.l+'</div>'
          +'<div class="fg" style="grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:.45rem;">'
          +'<div class="fi"><label>SEKOLAH</label><select id="pc-s-'+katKey+'-'+t.k+'" onchange="rPGKat(\''+kat+'\',\''+t.k+'\');updateMarkah(\''+kat+'\',\''+t.k+'\');">'+so+'</select></div>'
          +'<div class="fi"><label>GURU</label><div class="chkd" id="pc-g-'+katKey+'-'+t.k+'"></div></div>'
          +'<div class="fi"><label>MARKAH AUTO</label><input type="text" readonly id="pc-m-'+katKey+'-'+t.k+'" style="background:var(--g1);color:#d35400;font-weight:800;" placeholder="—" value="'+(e['Nama Sekolah']?mPts(gv('e-per')||'SEKOLAH',t.l)+' mata':'')+'"></div>'
          +'</div></div>';
      });
      html+='</div>';
    });
    html+='</div>';
  }

  if(_belumSen.length){
    html='<div class="iwarn" style="font-size:.72rem;margin-bottom:.8rem;line-height:1.5;">⚠ <b>'+_belumSen.length+' sekolah ditick belum mendaftar penyertaan</b>: '
      +_belumSen.map(function(n){return esc(n);}).join(', ')
      +'.<br>Sekolah ini tersenarai dalam pilihan SEKOLAH, tetapi peserta &amp; guru hanya muncul selepas guru/PKK sekolah itu mendaftar penyertaan bagi program ini.</div>'+html;
  }
  document.getElementById('pc-form').innerHTML=html;
  document.getElementById('pc-ld').style.display='none';
  document.getElementById('pc-form').style.display='block';
  _pcKatList=katList;_pcSeks=seks;_pcPny=pny;_pcPnc=pnc;

  // Init semua checkbox dropdown peserta & guru dengan data sedia ada
  katList.forEach(function(kat){
    var isBerk=kat.indexOf('BERKUMPULAN')>=0,isKsel=kat==='KESELURUHAN',isTrbBrk=kat==='TERBUKA BERKUMPULAN';
    // Kumpul SEMUA rekod per tempat (boleh berbilang peserta)
    var exForKat={};
    pnc.filter(function(p){return (p['Kategori']||'').toUpperCase()===kat;}).forEach(function(p){
      var tpt=p['Tempat'];if(!tpt)return;
      if(!exForKat[tpt])exForKat[tpt]=[];
      exForKat[tpt].push(p);
    });
    getTPT(kat).forEach(function(t){
      var katKey=kat.replace(/\s/g,'-');
      var rows=exForKat[t.l]||[];
      var e=rows[0]||{};
      var ss=e['Nama Sekolah']||'';
      var pKey=ss+'||'+kat;
      // Guru dropdown — baca dari semua rekod, gabung unik
      var gWrap=document.getElementById('pc-g-'+katKey+'-'+t.k);
      if(gWrap){
        var guruItems=(_gps[ss]||[]).map(function(g){return{val:g.n+'|'+g.kp,lbl:g.n};});
        // Guru disimpan sebagai "A | B | C" dalam rekod pertama; No KP Guru turut disimpan sejajar ("kp1 | kp2 | kp3")
        var guruRaw=e['Nama Guru']||'';
        var guruKpRaw=e['No KP Guru']||'';
        var guruNames=guruRaw?guruRaw.split('|').map(function(g){return g.trim();}).filter(Boolean):[];
        var guruKps=guruKpRaw?guruKpRaw.split('|').map(function(g){return g.trim();}):[];
        var selGuru=guruNames.map(function(nm,idx){
          var found=(_gps[ss]||[]).find(function(g){return g.n===nm;});
          return nm+'|'+(found?found.kp:(guruKps[idx]||''));
        });
        _chkdBuild(gWrap.id, guruItems, selGuru, '— PILIH GURU —');
      }
      // Peserta dropdown — kumpul semua nama unik dari semua rekod tempat ini
      // TERBUKA BERKUMPULAN tidak ada dropdown peserta (layani seperti BERKUMPULAN)
      if(!isBerk&&!isKsel&&!isTrbBrk){
        var pWrap=document.getElementById('pc-p-'+katKey+'-'+t.k);
        if(pWrap){
          var pesItems=(_pps[pKey]||_pps[ss]||[]).map(function(p){return{val:p.n+'|'+p.kp,lbl:p.n};});
          // Kumpul semua peserta dari semua rows untuk tempat ini
          var selPesVal=[];
          rows.forEach(function(row){
            if(!row['Nama Peserta'])return;
            var found=(_pps[pKey]||_pps[ss]||[]).find(function(p){return p.n===row['Nama Peserta'];});
            var v=found?found.n+'|'+found.kp:row['Nama Peserta']+'|'+(row['No KP Peserta']||'');
            if(selPesVal.indexOf(v)<0)selPesVal.push(v);
          });
          _chkdBuild(pWrap.id, pesItems, selPesVal, '— PILIH PESERTA —');
        }
      }
    });
  });

  // Fill markah for pre-selected & auto-fill berkumpulan/keseluruhan jika ada data
  katList.forEach(function(kat){
    getTPT(kat).forEach(function(t){
      var katKey=kat.replace(/\s/g,'-');
      var se=document.getElementById('pc-s-'+katKey+'-'+t.k);
      if(se&&se.value)updateMarkah(kat,t.k);
    });
  });
  // Auto-fill berkumpulan dan keseluruhan jika individu sudah ada data
  _autoFillBrkKsl();
}

// Auto-fill berkumpulan dan keseluruhan berdasarkan markah individu
// _brkPesList = { 'BERKUMPULAN LELAKI': { 'Sek A': [{n,kp},...] }, ... }
var _brkPesList={};
function _autoFillBrkKsl(){
  var per=(gv('e-per')||'SEKOLAH').toUpperCase();

  // Kira skor sekolah dari individu yang sudah diisi
  var sekScoresL={}, sekScoresP={}, sekScoresAll={};
  // Kumpul peserta per sekolah mengikut jantina dari data penyertaan (_pcPny)
  var pesBySecL={}, pesBySecP={};
  (_pcPny||[]).forEach(function(p){
    var sk=p['Nama Sekolah'];if(!sk)return;
    var jan=(p['Jantina Peserta']||'').toUpperCase();
    var pes=p['Nama Peserta'];var kp=p['No KP Peserta']||'';
    if(!pes)return;
    if(jan==='LELAKI'){
      if(!pesBySecL[sk])pesBySecL[sk]=[];
      if(!pesBySecL[sk].find(function(x){return x.n===pes;}))pesBySecL[sk].push({n:pes,kp:kp});
    } else if(jan==='PEREMPUAN'){
      if(!pesBySecP[sk])pesBySecP[sk]=[];
      if(!pesBySecP[sk].find(function(x){return x.n===pes;}))pesBySecP[sk].push({n:pes,kp:kp});
    }
  });

  // Kira bilangan pencapaian (tempat 1/2/3) per sekolah untuk tiebreaker
  var sekPencL={}, sekPencP={}, sekPencAll={};
  var _pencTempat=['TEMPAT PERTAMA','TEMPAT KEDUA','TEMPAT KETIGA'];

  // Dari borang individu yang sedang diisi
  _pcKatList.filter(function(k){return k.indexOf('INDIVIDU')>=0;}).forEach(function(indKat){
    var isLelaki=indKat.indexOf('LELAKI')>=0;
    var katKey=indKat.replace(/\s/g,'-');
    getTPT(indKat).forEach(function(t){
      var se=document.getElementById('pc-s-'+katKey+'-'+t.k);
      if(se&&se.value){
        var sek=se.value;
        var pts=mPts(per,t.l);
        var isPenc=_pencTempat.indexOf(t.l)>=0;
        var isJohan=t.l==='TEMPAT PERTAMA';
        if(isLelaki){
          sekScoresL[sek]=(sekScoresL[sek]||0)+pts;
          if(isPenc)sekPencL[sek]=(sekPencL[sek]||0)+1;
          if(isJohan)sekPencL['_johan_'+sek]=(sekPencL['_johan_'+sek]||0)+1;
        } else {
          sekScoresP[sek]=(sekScoresP[sek]||0)+pts;
          if(isPenc)sekPencP[sek]=(sekPencP[sek]||0)+1;
          if(isJohan)sekPencP['_johan_'+sek]=(sekPencP['_johan_'+sek]||0)+1;
        }
        sekScoresAll[sek]=(sekScoresAll[sek]||0)+pts;
        if(isPenc)sekPencAll[sek]=(sekPencAll[sek]||0)+1;
        if(isJohan)sekPencAll['_johan_'+sek]=(sekPencAll['_johan_'+sek]||0)+1;
      }
    });
  });

  // Simpan senarai peserta untuk digunakan semasa _collectPencEntries
  _brkPesList={};
  _pcKatList.filter(function(k){return k==='BERKUMPULAN LELAKI';}).forEach(function(kat){
    _brkPesList[kat]=pesBySecL;
  });
  _pcKatList.filter(function(k){return k==='BERKUMPULAN PEREMPUAN';}).forEach(function(kat){
    _brkPesList[kat]=pesBySecP;
  });
  _pcKatList.filter(function(k){return k==='KESELURUHAN';}).forEach(function(kat){
    // Gabung lelaki + perempuan per sekolah
    var pesBySecAll={};
    Object.keys(pesBySecL).forEach(function(sk){
      if(!pesBySecAll[sk])pesBySecAll[sk]=[];
      pesBySecL[sk].forEach(function(p){if(!pesBySecAll[sk].find(function(x){return x.n===p.n;}))pesBySecAll[sk].push(p);});
    });
    Object.keys(pesBySecP).forEach(function(sk){
      if(!pesBySecAll[sk])pesBySecAll[sk]=[];
      pesBySecP[sk].forEach(function(p){if(!pesBySecAll[sk].find(function(x){return x.n===p.n;}))pesBySecAll[sk].push(p);});
    });
    _brkPesList[kat]=pesBySecAll;
  });
  // PEMBETULAN: TERBUKA BERKUMPULAN — isi peserta dari data penyertaan (_pcPny)
  // Sebelum ini blok ini tiada, menyebabkan peserta tidak disimpan dalam
  // sheet PENCAPAIAN dan tidak muncul dalam ranking dashboard.
  _pcKatList.filter(function(k){return k==='TERBUKA BERKUMPULAN';}).forEach(function(kat){
    var pesBySecTrb={};
    (_pcPny||[]).forEach(function(r){
      var sk=r['Nama Sekolah']; if(!sk) return;
      var nm=r['Nama Peserta']; var kp=r['No KP Peserta']||'';
      var katPny=(r['Kategori Penyertaan']||'').toUpperCase();
      // Skip rekod guru atau baris tanpa nama peserta
      if(!nm||katPny==='GURU') return;
      if(!pesBySecTrb[sk]) pesBySecTrb[sk]=[];
      // Elak peserta berganda dalam sekolah yang sama
      if(!pesBySecTrb[sk].find(function(x){return x.n===nm;})){
        pesBySecTrb[sk].push({n:nm, kp:kp});
      }
    });
    _brkPesList[kat]=pesBySecTrb;
  });

  // Fill berkumpulan lelaki dari skor individu lelaki
  _pcKatList.filter(function(k){return k==='BERKUMPULAN LELAKI';}).forEach(function(kat){
    _fillBrkFromScores(kat,sekScoresL,per,sekPencL);
  });
  // Fill berkumpulan perempuan dari skor individu perempuan
  _pcKatList.filter(function(k){return k==='BERKUMPULAN PEREMPUAN';}).forEach(function(kat){
    _fillBrkFromScores(kat,sekScoresP,per,sekPencP);
  });
  // Fill keseluruhan — bergantung pada pilihan sumber
  _pcKatList.filter(function(k){return k==='KESELURUHAN';}).forEach(function(kat){
    var sumberEl = document.getElementById('ksl-sumber');
    var sumber = sumberEl ? sumberEl.value : 'IND_BRK';

    var kslScores, kslPenc;
    if(sumber === 'BRK'){
      // Kira hanya daripada berkumpulan lelaki + berkumpulan perempuan
      var brkScores={}, brkPenc={};
      _pcKatList.filter(function(k){return k.indexOf('BERKUMPULAN')>=0;}).forEach(function(bKat){
        var bKatKey=bKat.replace(/\s/g,'-');
        getTPT(bKat).forEach(function(t){
          var se=document.getElementById('pc-s-'+bKatKey+'-'+t.k);
          if(se&&se.value){
            var sek=se.value;
            var pts=mPts(per,t.l);
            brkScores[sek]=(brkScores[sek]||0)+pts;
            var isPenc=['TEMPAT PERTAMA','TEMPAT KEDUA','TEMPAT KETIGA'].indexOf(t.l)>=0;
            if(isPenc)brkPenc[sek]=(brkPenc[sek]||0)+1;
            if(t.l==='TEMPAT PERTAMA')brkPenc['_johan_'+sek]=(brkPenc['_johan_'+sek]||0)+1;
          }
        });
      });
      kslScores = brkScores; kslPenc = brkPenc;
    } else {
      // IND_BRK: individu + berkumpulan (asal)
      kslScores = sekScoresAll; kslPenc = sekPencAll;
    }
    _fillBrkFromScores(kat, kslScores, per, kslPenc);
  });
}

function _fillBrkFromScores(kat,sekScores,per,sekPencCount){
  if(!Object.keys(sekScores).length)return;
  // Sort: 1) mata tertinggi  2) seri → bilangan pencapaian (1+2+3) terbanyak
  //        3) masih seri → bilangan Johan (Tempat Pertama) terbanyak
  var sorted=Object.entries(sekScores).sort(function(a,b){
    // Tiebreaker 1: jumlah mata
    if(b[1]!==a[1])return b[1]-a[1];
    // Tiebreaker 2: bilangan pencapaian (tempat 1+2+3)
    var pa=(sekPencCount&&sekPencCount[a[0]])||0;
    var pb=(sekPencCount&&sekPencCount[b[0]])||0;
    if(pb!==pa)return pb-pa;
    // Tiebreaker 3: bilangan Johan (Tempat Pertama) sahaja
    var ja=(sekPencCount&&sekPencCount['_johan_'+a[0]])||0;
    var jb=(sekPencCount&&sekPencCount['_johan_'+b[0]])||0;
    return jb-ja;
  });
  var katKey=kat.replace(/\s/g,'-');
  var tptMap={t1:0,t2:1,t3:2,t4:3,t5:4};
  getTPT(kat).forEach(function(t){
    var se=document.getElementById('pc-s-'+katKey+'-'+t.k);
    if(!se)return;
    var idx=tptMap[t.k]||0;
    var entry=sorted[idx];
    if(!entry)return;
    se.value=entry[0];
    updateMarkah(kat,t.k);
    // Auto-fill guru
    var ge=document.getElementById('pc-g-'+katKey+'-'+t.k);
    if(ge){
      var gList=_gps[entry[0]]||[];
      if(gList.length){
        ge.innerHTML='<option value="">— PILIH GURU —</option>'+gList.map(function(g){return '<option>'+g.n+'</option>';}).join('');
        ge.value=gList[0]?gList[0].n:'';
      }
    }
  });
}

