// == BULK DAFTAR PESERTA/GURU VIA EXCEL ==========================
function muatTurunTemplatXlsx(){
  if(typeof XLSX==='undefined'){toast('Sila tunggu, memuatkan...','in');return;}
  if(!_selKatList.length){toast('Sila pilih program dahulu sebelum muat turun templat.','er');return;}
  var wb=XLSX.utils.book_new();

  var pesRows=[['NAMA PESERTA','NO. KP','JANTINA','BANGSA','KATEGORI']];
  pesRows.push(['CONTOH: AHMAD BIN ALI','010101-13-0001','LELAKI','BUMIPUTERA', _selKatList[0]||'']);
  var wsPes=XLSX.utils.aoa_to_sheet(pesRows);
  wsPes['!cols']=[{wch:28},{wch:16},{wch:12},{wch:14},{wch:28}];
  _xlTeksLajur(wsPes,'B',2,302);   // NO. KP: teks (0 pendahulu tak hilang bila ditaip)
  XLSX.utils.book_append_sheet(wb,wsPes,'PESERTA');

  var guruRows=[['NAMA GURU','NO. KP','JANTINA','BANGSA','NO. TEL']];
  guruRows.push(['CONTOH: SITI BINTI HASSAN','850101-13-5678','PEREMPUAN','MELAYU','0191234567']);
  var wsGuru=XLSX.utils.aoa_to_sheet(guruRows);
  wsGuru['!cols']=[{wch:28},{wch:16},{wch:12},{wch:14},{wch:16}];
  _xlTeksLajur(wsGuru,'B',2,302);  // NO. KP
  _xlTeksLajur(wsGuru,'E',2,302);  // NO. TEL
  XLSX.utils.book_append_sheet(wb,wsGuru,'GURU');

  var panduanRows=[
    ['PANDUAN ISI TEMPLAT'],[''],
    ['1. Jangan tukar nama sheet (PESERTA / GURU) atau susunan lajur.'],
    ['2. Padam baris CONTOH sebelum isi data sebenar.'],
    ['3. JANTINA: LELAKI atau PEREMPUAN sahaja.'],
    ['4. KATEGORI mesti sama ejaan dengan senarai di bawah (jika lebih dari satu, asingkan dengan koma).'],
    ['5. No. KP boleh isi dengan/tanpa sengkang (-), sistem akan format automatik.'],
    ['6. Lajur NO. KP dan NO. TEL telah ditetapkan sebagai TEKS — taip seperti biasa; angka 0 di hadapan tidak akan hilang.'],
    [''],['KATEGORI SAH UNTUK PROGRAM INI:'],
  ];
  _selKatList.forEach(function(k){panduanRows.push([k]);});
  var wsPanduan=XLSX.utils.aoa_to_sheet(panduanRows);
  wsPanduan['!cols']=[{wch:50}];
  XLSX.utils.book_append_sheet(wb,wsPanduan,'PANDUAN');

  XLSX.writeFile(wb,'Templat_Penyertaan.xlsx');
  toast('Templat Excel dimuat turun ✓','ok');
}

function onXlsxFileSelected(ev){
  var file=ev.target.files && ev.target.files[0];
  ev.target.value='';
  if(!file) return;
  if(typeof XLSX==='undefined'){toast('Sila tunggu, memuatkan...','in');return;}
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var wb=XLSX.read(e.target.result,{type:'array'});
      _prosesBulkXlsx(wb);
    }catch(err){
      toast('Gagal baca fail Excel: '+err.message,'er');
    }
  };
  reader.readAsArrayBuffer(file);
}

function _prosesBulkXlsx(wb){
  if(!_selKatList.length){toast('Sila pilih program dahulu sebelum muat naik Excel.','er');return;}
  var errors=[];
  var pesBaru=[], guruBaru=[];
  var katSahSet={}; _selKatList.forEach(function(k){katSahSet[k.toUpperCase()]=true;});

  var wsPes=wb.Sheets['PESERTA'];
  if(wsPes){
    var rowsPes=XLSX.utils.sheet_to_json(wsPes,{header:1,blankrows:false});
    for(var i=1;i<rowsPes.length;i++){
      var r=rowsPes[i]; if(!r||!r.length) continue;
      var nama=String(r[0]||'').trim();
      if(!nama || nama.toUpperCase().indexOf('CONTOH')===0) continue;
      var kpRaw=_kpSel(r[1]);
      var jantina=String(r[2]||'').trim().toUpperCase();
      var bangsa=String(r[3]||'').trim().toUpperCase();
      var katRaw=String(r[4]||'').trim();
      var baris=i+1;

      var kp=normKP(kpRaw);
      if(kpRaw && !/^\d{6}-\d{2}-\d{4}$/.test(kp)){
        errors.push('Peserta baris '+baris+' ("'+nama+'"): No. KP tidak sah — '+kpRaw);
      }
      if(jantina && jantina!=='LELAKI' && jantina!=='PEREMPUAN'){
        errors.push('Peserta baris '+baris+' ("'+nama+'"): Jantina mesti LELAKI/PEREMPUAN, dapat "'+jantina+'"');
      }
      var katList=katRaw.split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean);
      var katTakSah=katList.filter(function(k){return !katSahSet[k];});
      if(katTakSah.length){
        errors.push('Peserta baris '+baris+' ("'+nama+'"): Kategori tidak sah — '+katTakSah.join(', '));
      }
      if(!katList.length){
        errors.push('Peserta baris '+baris+' ("'+nama+'"): Kategori kosong');
      }

      _pPCnt++;
      pesBaru.push({id:'mp-'+_pPCnt, nama:nama.toUpperCase(), kp:kp, jantina:jantina, bangsa:bangsa, kategori:katList.filter(function(k){return katSahSet[k];})});
    }
  } else {
    errors.push('Sheet "PESERTA" tidak dijumpai dalam fail — pastikan guna templat rasmi.');
  }

  var wsGuru=wb.Sheets['GURU'];
  if(wsGuru){
    var rowsGuru=XLSX.utils.sheet_to_json(wsGuru,{header:1,blankrows:false});
    for(var j=1;j<rowsGuru.length;j++){
      var rg=rowsGuru[j]; if(!rg||!rg.length) continue;
      var namaG=String(rg[0]||'').trim();
      if(!namaG || namaG.toUpperCase().indexOf('CONTOH')===0) continue;
      var kpG=normKP(_kpSel(rg[1]));
      var jantinaG=String(rg[2]||'').trim().toUpperCase();
      var bangsaG=String(rg[3]||'').trim().toUpperCase();
      var telRaw=String(rg[4]||'').replace(/\D/g,'');
      var tel=telRaw?(telRaw.indexOf('60')===0?'+'+telRaw:'+60'+telRaw.replace(/^0/,'')):'';
      var barisG=j+1;
      if(rg[1] && !/^\d{6}-\d{2}-\d{4}$/.test(kpG)){
        errors.push('Guru baris '+barisG+' ("'+namaG+'"): No. KP tidak sah — '+rg[1]);
      }
      _pGCnt++;
      guruBaru.push({id:'mg-'+_pGCnt, nama:namaG.toUpperCase(), kp:kpG, jantina:jantinaG, bangsa:bangsaG, tel:tel});
    }
  }

  if(!pesBaru.length && !guruBaru.length){
    toast('Tiada data sah dijumpai dalam fail. Semak templat & cuba lagi.','er');
    return;
  }

  // SEMAKAN PENDUA (16 Nov 2026): No. KP sah yang sudah ada dalam senarai borang ATAU berulang dalam fail
  // tidak ditambah sebagai baris baharu (elak kiraan penyertaan berganda). Untuk peserta, kategori baharu
  // digabungkan ke baris sedia ada (seorang murid boleh berada dalam beberapa kategori). Baris tanpa
  // No. KP sah tidak boleh disemak dan sentiasa ditambah.
  var dupInfo=[];
  var _kpSah=function(k){return /^\d{6}-\d{2}-\d{4}$/.test(k||'');};
  var idxPes={}, idxGuru={};
  _penyData.pesList.forEach(function(x){var k=normKP(x.kp||'');if(_kpSah(k)&&!idxPes[k])idxPes[k]=x;});
  _penyData.guruList.forEach(function(x){var k=normKP(x.kp||'');if(_kpSah(k)&&!idxGuru[k])idxGuru[k]=x;});
  var pesTambah=[], guruTambah=[], pesGabung=0;
  pesBaru.forEach(function(x){
    if(_kpSah(x.kp) && idxPes[x.kp]){
      var ada=idxPes[x.kp], kt=ada.kategori||[], tambahKat=false;
      x.kategori.forEach(function(k){ if(kt.indexOf(k)<0){ kt=kt.concat([k]); tambahKat=true; } });
      ada.kategori=kt; if(tambahKat) pesGabung++;
      dupInfo.push('Peserta "'+x.nama+'" ('+x.kp+') sudah ada — tidak ditambah semula'+(tambahKat?' (kategori digabungkan)':''));
    } else { pesTambah.push(x); if(_kpSah(x.kp)) idxPes[x.kp]=x; }
  });
  guruBaru.forEach(function(x){
    if(_kpSah(x.kp) && idxGuru[x.kp]){
      dupInfo.push('Guru "'+x.nama+'" ('+x.kp+') sudah ada — tidak ditambah semula');
    } else { guruTambah.push(x); if(_kpSah(x.kp)) idxGuru[x.kp]=x; }
  });

  _penyData.pesList = _penyData.pesList.concat(pesTambah);
  _penyData.guruList = _penyData.guruList.concat(guruTambah);
  renderMainPesList();
  renderMainGuruList();

  var ringkasan=pesTambah.length+' peserta & '+guruTambah.length+' guru berjaya dimuat naik.';
  var catatan=[];
  if(errors.length){
    catatan.push('⚠ '+errors.length+' amaran — sila semak & betulkan dalam senarai sebelum hantar:\n\n• '+errors.slice(0,10).join('\n• ')+(errors.length>10?'\n...dan '+(errors.length-10)+' lagi.':''));
  }
  if(dupInfo.length){
    catatan.push('ℹ '+dupInfo.length+' baris pendua (No. KP sama) dilangkau'+(pesGabung?', '+pesGabung+' peserta dikemas kini kategori':'')+':\n\n• '+dupInfo.slice(0,10).join('\n• ')+(dupInfo.length>10?'\n...dan '+(dupInfo.length-10)+' lagi.':''));
  }
  if(catatan.length){
    alert(ringkasan+'\n\n'+catatan.join('\n\n'));
  } else {
    toast(ringkasan+' ✓','ok');
  }
}

function renderMainPesList(){
  var el=document.getElementById('main-pes-list');
  if(!el)return;
  if(!_penyData.pesList.length){el.innerHTML='<div style="font-size:.72rem;color:var(--g5);padding:.4rem;">Tiada peserta ditambah. Klik + TAMBAH PESERTA.</div>';return;}
  var kodSek=(document.getElementById('daf-kod')||{}).value||'';
  var syorPes=_getPesSyorFromAP(kodSek);
  // Simpan dalam cache global
  _syorPesCache = {};
  syorPes.forEach(function(sp){ _syorPesCache[sp.kp||sp.nama]=sp; });
  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  var katForChk=_selKatList.filter(function(k){return k!=='KESELURUHAN';});
  el.innerHTML='';
  _penyData.pesList.forEach(function(p,i){
    var div=document.createElement('div');
    div.className='ri'; div.id='row-'+p.id;
    var chkHtml=katForChk.map(function(k){
      var c=colors[k]||'#555';
      var checked=p.kategori.indexOf(k)>=0?' checked':'';
      return '<label style="display:flex;align-items:center;gap:.3rem;cursor:pointer;font-size:.7rem;font-weight:700;padding:.2rem .5rem;border-radius:20px;border:2px solid '+(checked?c:'#dee2e6')+';background:'+(checked?c:'#fff')+';color:'+(checked?'#fff':'#555')+';transition:.15s;" class="kat-pill-lbl">'
        +'<input type="checkbox" style="display:none;" value="'+k+'"'+checked+' onchange="saveKatPes(\''+p.id+'\',\''+k+'\',this.checked,this)">'
        +k.replace('INDIVIDU ','IND. ').replace('BERKUMPULAN ','BRK. ')
        +'</label>';
    }).join('');
    // Tentukan key terpilih berdasarkan kp atau nama peserta semasa
    var selKey = p.kp || p.nama || '';
    var syorHtml=syorPes.length
      ? '<div class="fi full" style="margin-bottom:.1rem;">'
        +'<label>Pilih Peserta (rekod lepas)</label>'
        +'<select style="text-transform:none;" onchange="pickPesFromSyor(\''+p.id+'\',this.value)">'
        +'<option value="">— Isikan dari rekod lepas, atau taip nama di bawah —</option>'
        +syorPes.map(function(sp){
          var spKey=sp.kp||sp.nama;
          var isSel=(selKey && spKey===selKey)?'selected':'';
          return '<option value="'+esc(spKey)+'" '+isSel+'>'+esc(sp.nama)+(sp.kp?' ('+sp.kp+')':'')+'</option>';
        }).join('')
        +'</select></div>'
      : '';
    div.innerHTML='<div class="rih"><span>\uD83E\uDDD1\u200D\uD83C\uDF93 PESERTA #'+(i+1)+'</span><button class="btn bd bsm" onclick="removeMainPes(\''+p.id+'\')">PADAM</button></div>'
      +'<div class="fg">'
      +syorHtml
      +'<div class="fi"><label>Nama Peserta</label><input type="text" class="nc-off" id="pn-'+p.id+'" value="'+esc(p.nama)+'" placeholder="Nama penuh peserta" autocomplete="off" oninput="savePes(\''+p.id+'\',\'nama\',this.value)"></div>'
      +'<div class="fi"><label>No. KP</label><input type="text" class="nc" id="pkp-'+p.id+'" value="'+esc(p.kp)+'" placeholder="000000-00-0000" maxlength="14" inputmode="numeric" autocomplete="off" oninput="fmtKP(this);savePes(\''+p.id+'\',\'kp\',this.value)"></div>'
      +'<div class="fi"><label>Jantina</label><select id="pjn-'+p.id+'" onchange="savePes(\''+p.id+'\',\'jantina\',this.value);_autoAssignKatByJantina(\''+p.id+'\',this.value);">'+janOpt(p.jantina)+'</select></div>'
      +'<div class="fi"><label>Bangsa</label><select id="pbg-'+p.id+'" onchange="savePes(\''+p.id+'\',\'bangsa\',this.value)">'+bangOpt(p.bangsa)+'</select></div>'
      +'</div>'
      +(katForChk.length?'<div style="display:flex;gap:.35rem;flex-wrap:wrap;margin-top:.5rem;padding:.4rem;background:var(--g1);border-radius:var(--r);"><span style="font-size:.6rem;font-weight:800;color:var(--g5);margin-right:.2rem;align-self:center;">KATEGORI:</span>'+chkHtml+'</div>':'');
    el.appendChild(div);
  });
}

function pickPesFromSyor(pid, key){
  if(!key) return;
  var found=_syorPesCache[key];
  if(!found) return;
  var p=_penyData.pesList.find(function(x){return x.id===pid;});
  if(!p) return;
  p.nama=found.nama; p.kp=found.kp; p.jantina=found.jantina; p.bangsa=found.bangsa;
  // Auto-assign kategori berdasarkan jantina
  _autoAssignKatByJantina(pid, found.jantina);
  renderMainPesList();
}

function savePes(id,field,val){
  var p=_penyData.pesList.find(function(x){return x.id===id;});
  if(!p)return;
  if(field==='kp') p[field]=normKP(val);
  else if(field==='nama') p[field]=(val||'').toUpperCase();
  else p[field]=val;
}

function saveKatPes(id,kat,checked,inp){
  var p=_penyData.pesList.find(function(x){return x.id===id;});
  if(!p)return;
  var isTrb=kat==='TERBUKA INDIVIDU'||kat==='TERBUKA BERKUMPULAN';
  if(checked){
    if(isTrb){
      // TERBUKA (Individu/Berkumpulan) eksklusif — buang semua kategori bukan-TERBUKA
      p.kategori=p.kategori.filter(function(k){return k==='TERBUKA INDIVIDU'||k==='TERBUKA BERKUMPULAN';});
      if(p.kategori.indexOf(kat)<0) p.kategori.push(kat);
    } else {
      // Kategori biasa — buang semua TERBUKA
      p.kategori=p.kategori.filter(function(k){return k!=='TERBUKA INDIVIDU'&&k!=='TERBUKA BERKUMPULAN'&&k!=='TERBUKA';});
      if(p.kategori.indexOf(kat)<0) p.kategori.push(kat);
    }
    // Re-render semua pill dalam row ini supaya visual ikut logik eksklusif
    renderMainPesList();
    return;
  } else {
    p.kategori=p.kategori.filter(function(k){return k!==kat;});
  }
  // Update pill visual sahaja (untuk uncheck biasa)
  var lbl=inp.closest('label');
  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  var c=colors[kat]||'#555';
  lbl.style.background='#fff'; lbl.style.color='#555'; lbl.style.borderColor='#dee2e6';
}

function bangOpt(sel){
  return ['','MELAYU','CINA','INDIA','KADAZAN','IBAN','BIDAYUH','ORANG ULU','BAJAU','LAIN-LAIN']
    .map(function(b){return '<option value="'+b+'"'+(sel===b?' selected':'')+'>'+( b||'—')+'</option>';}).join('');
}
function janOpt(sel){
  return ['','LELAKI','PEREMPUAN']
    .map(function(j){return '<option value="'+j+'"'+(sel===j?' selected':'')+'>'+( j||'—')+'</option>';}).join('');
}

function semakPeny(){
  // Validate
  if(!selId){toast('Sila pilih program','er');return;}
  var kod=document.getElementById('daf-kod').value.trim();
  var sk=document.getElementById('daf-sek').value.trim();
  if(!kod){toast('Sila masukkan Kod Sekolah','er');return;}
  if(!sk){toast('Sila masukkan Nama Sekolah','er');return;}
  // == SEMAKAN AKSES: Guru hanya boleh hantar untuk sekolah sendiri
  if(_sesi && _sesi.role==='guru'){
    if(!_checkPenyAkses(kod)){
      toast('Kod Sekolah tidak sepadan dengan akaun anda ('+(_sesi.kodSekolah||'—')+').','er');
      return;
    }
  }
  // Sync current form values
  _syncFormValues();
  // Check guru
  var guruFilled=_penyData.guruList.filter(function(g){return g.nama.trim();});
  if(!guruFilled.length){toast('❌ Langkah 3: Sila isi sekurang-kurangnya 1 guru pengiring','er');return;}
  // Semak medan wajib guru
  for(var gi=0;gi<guruFilled.length;gi++){
    var gx=guruFilled[gi];
    var gLabel='Guru #'+(gi+1)+' ('+gx.nama+')';
    if(!gx.kp||gx.kp.replace(/\D/g,'').length<12){toast('❌ '+gLabel+': No. Kad Pengenalan tidak lengkap','er');return;}
    if(!gx.jantina){toast('❌ '+gLabel+': Sila pilih Jantina','er');return;}
    if(!gx.bangsa){toast('❌ '+gLabel+': Sila pilih Bangsa','er');return;}
    var telDigits=(gx.tel||'').replace(/\D/g,'');
    if(telDigits.length<9){toast('❌ '+gLabel+': No. Telefon wajib diisi','er');return;}
  }
  // Check peserta
  var pesFilled=_penyData.pesList.filter(function(p){return p.nama.trim();});
  if(!pesFilled.length){toast('❌ Langkah 4: Sila isi sekurang-kurangnya 1 peserta','er');return;}
  // Semak medan wajib peserta
  for(var pi=0;pi<pesFilled.length;pi++){
    var px=pesFilled[pi];
    var pLabel='Peserta #'+(pi+1)+' ('+px.nama+')';
    if(!px.kp||px.kp.replace(/\D/g,'').length<12){toast('❌ '+pLabel+': No. Kad Pengenalan tidak lengkap','er');return;}
    if(!px.jantina){toast('❌ '+pLabel+': Sila pilih Jantina','er');return;}
    if(!px.bangsa){toast('❌ '+pLabel+': Sila pilih Bangsa','er');return;}
  }
  // Semak No. KP pendua antara peserta (elak peserta hilang senyap semasa dipaparkan/dihantar)
  var kpSeen={};
  for(var pdi=0;pdi<pesFilled.length;pdi++){
    var pdx=pesFilled[pdi];
    var kpKey=pdx.kp.replace(/\D/g,'');
    if(kpSeen[kpKey]){
      toast('❌ No. KP "'+pdx.kp+'" untuk peserta "'+pdx.nama+'" sama dengan peserta "'+kpSeen[kpKey]+'". Sila semak semula.','er');
      return;
    }
    kpSeen[kpKey]=pdx.nama;
  }
  // Semak nama pendua tanpa KP diisi (jarang berlaku sebab KP wajib, tapi sebagai lapisan kedua)
  var namaSeen={};
  for(var ndi=0;ndi<pesFilled.length;ndi++){
    var ndx=pesFilled[ndi];
    var namaKey=ndx.nama.trim().toUpperCase();
    if(namaSeen[namaKey] && namaSeen[namaKey]!==ndx.kp){
      toast('❌ Nama peserta "'+ndx.nama+'" berulang dengan No. KP berbeza. Sila semak ejaan/nama.','er');
      return;
    }
    namaSeen[namaKey]=ndx.kp;
  }
  // Check kategori
  var noKat=pesFilled.filter(function(p){return !p.kategori.length;});
  if(noKat.length){toast('❌ Langkah 4: Pilih kategori untuk peserta "'+noKat[0].nama+'"','er');return;}

  // Build preview by kategori — semua peserta dengan kategori sah
  var byKat={};
  var skippedGuru=[];
  pesFilled.forEach(function(p){
    // Tapis rekod guru tambahan (kategori='GURU') — bukan peserta sebenar
    var katSah=p.kategori.filter(function(k){return k&&k!=='GURU';});
    if(!katSah.length){skippedGuru.push(p.nama);return;}
    katSah.forEach(function(k){
      if(!byKat[k])byKat[k]=[];
      byKat[k].push(p);
    });
  });

  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  var html='';
  // Info sekolah
  html+='<div style="background:var(--rp);border:1px solid rgba(192,57,43,.18);border-radius:var(--r);padding:.75rem .9rem;margin-bottom:.9rem;">'
    +'<div style="font-family:Montserrat,sans-serif;font-size:.82rem;font-weight:900;color:var(--red);">🏫 '+sk+'</div>'
    +'<div style="font-size:.68rem;color:var(--g6);margin-top:.2rem;">Program: <strong>'+selNm+'</strong> &nbsp;|&nbsp; Kod: '+kod+'</div>'
    +'</div>';

  // Guru list
  html+='<div style="margin-bottom:.8rem;">'
    +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:800;color:var(--g7);margin-bottom:.4rem;border-left:3px solid var(--red);padding-left:.5rem;">GURU PENGIRING</div>';
  guruFilled.forEach(function(g){
    html+='<div style="display:flex;align-items:center;gap:.5rem;padding:.28rem .5rem;border-bottom:1px dashed var(--g1);font-size:.73rem;">'
      +'<span>👨‍🏫</span><strong>'+g.nama+'</strong>'
      +(g.jantina?'<span style="color:var(--g5);">'+g.jantina+'</span>':'')
      +(g.bangsa?'<span style="color:var(--g5);">'+g.bangsa+'</span>':'')+'</div>';
  });
  html+='</div>';

  // Per kategori — ikut susunan _selKatList
  _selKatList.forEach(function(k){
    var pesInKat=byKat[k]||[];
    var c=colors[k]||'#555';
    // Untuk BERKUMPULAN, tunjukkan nota
    var isGrp=k.indexOf('BERKUMPULAN')>=0;
    var isAll=k==='KESELURUHAN';
    html+='<div style="margin-bottom:.8rem;border:1.5px solid '+c+';border-radius:var(--r);overflow:hidden;">'
      +'<div style="background:'+c+';color:#fff;padding:.38rem .7rem;font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;">'+k+' &nbsp;('+pesInKat.length+' peserta)</div>';
    if(isGrp){
      html+='<div style="padding:.3rem .7rem;font-size:.65rem;color:var(--g6);background:#f0fff4;border-bottom:1px solid #c8f0d8;">ℹ️ Ahli kumpulan yang turut serta dalam kategori ini</div>';
    }
    if(isAll){
      html+='<div style="padding:.3rem .7rem;font-size:.65rem;color:var(--g6);background:#fff8f0;border-bottom:1px solid #fde8cc;">ℹ️ Semua peserta yang mewakili sekolah dalam kategori keseluruhan</div>';
    }
    if(!pesInKat.length){
      html+='<div style="padding:.5rem .7rem;font-size:.72rem;color:var(--g5);">— Tiada peserta dalam kategori ini —</div>';
    } else {
      pesInKat.forEach(function(p,i){
        html+='<div style="display:flex;align-items:center;gap:.5rem;padding:.28rem .7rem;border-bottom:1px dashed var(--g1);font-size:.73rem;background:'+(i%2===0?'#fff':'#fafafa')+'">'
          +'<span style="font-family:Montserrat,sans-serif;font-size:.6rem;font-weight:800;color:'+c+';min-width:18px;">'+(i+1)+'</span>'
          +'<span style="font-size:.8rem;">'+(p.jantina==='PEREMPUAN'?'👧':'👦')+'</span>'
          +'<strong style="flex:1;">'+p.nama+'</strong>'
          +(p.jantina?'<span style="font-size:.65rem;color:var(--g6);">'+p.jantina+'</span>':'')
          +(p.bangsa?'<span style="font-size:.65rem;color:var(--g6);">'+p.bangsa+'</span>':'')
          +'</div>';
      });
    }
    html+='</div>';
  });

  if(skippedGuru.length){
    html+='<div style="background:#fef9e7;border:1px solid #f9e79f;border-radius:var(--r);padding:.6rem .8rem;font-size:.72rem;color:#784212;margin-top:.5rem;">'
      +'⚠ <strong>'+skippedGuru.length+' peserta tidak disertakan</strong> kerana nama sama dengan nama guru: '
      +skippedGuru.map(function(n){return '<strong>'+n+'</strong>';}).join(', ')+'</div>';
  }
  document.getElementById('pengesahan-body').innerHTML=html;
  openMo('mo-pengesahan');
}

function _syncFormValues(){
  // PEMBETULAN KRITIKAL #2: Guna ID spesifik bukan indeks positional
  // (dropdown syor menyebabkan allSel[0] bukan Bangsa lagi)
  _penyData.guruList.forEach(function(g){
    var row=document.getElementById('row-'+g.id);
    if(!row)return;
    var txtInputs=row.querySelectorAll('input[type=text]');
    if(txtInputs[0])g.nama=(txtInputs[0].value||'').trim().toUpperCase();
    if(txtInputs[1])g.kp=(txtInputs[1].value||'').trim();
    var telEl=row.querySelector('input[type=tel]');
    if(telEl)g.tel=telEl.value?'+60'+telEl.value.replace(/\D/g,''):'';
    // Guna ID — tidak bergantung pada indeks positional
    var bgEl=document.getElementById('gbg-'+g.id);
    var jnEl=document.getElementById('gjn-'+g.id);
    if(bgEl)g.bangsa=bgEl.value;
    if(jnEl)g.jantina=jnEl.value;
  });
  // Sync peserta: input[type=text] → Nama[0], KP[1] | guna ID untuk Jantina & Bangsa
  // NOTA: p.kategori TIDAK disentuh di sini — ia diurus oleh saveKatPes (onchange)
  // Membaca semula dari DOM boleh MEROSAKKAN kategori jika DOM belum stabil
  _penyData.pesList.forEach(function(p){
    var row=document.getElementById('row-'+p.id);
    if(!row)return;
    var allInputs=row.querySelectorAll('input[type=text]');
    if(allInputs[0])p.nama=(allInputs[0].value||'').trim().toUpperCase();
    if(allInputs[1])p.kp=(allInputs[1].value||'').trim();
    // Guna ID — tidak bergantung pada indeks positional
    var jnEl=document.getElementById('pjn-'+p.id);
    var bgEl=document.getElementById('pbg-'+p.id);
    if(jnEl)p.jantina=jnEl.value;
    if(bgEl)p.bangsa=bgEl.value;
    // p.kategori dikekalkan sebagaimana disimpan oleh saveKatPes — JANGAN padam/baca semula dari DOM
  });
}

async function hantarPeny(){
  var kod=document.getElementById('daf-kod').value.trim();
  var sk=document.getElementById('daf-sek').value.trim();
  _syncFormValues();
  var guruFilled=_penyData.guruList.filter(function(g){return g.nama.trim();});
  var pesFilled=_penyData.pesList.filter(function(p){return p.nama.trim();});

  // Lapisan keselamatan kedua: sekat hantar jika ada No. KP peserta pendua
  // (elak peserta hilang senyap semasa dipaparkan selepas hantar)
  var _kpSeenSend={};
  for(var _sdi=0;_sdi<pesFilled.length;_sdi++){
    var _sdx=pesFilled[_sdi];
    var _kpKeySend=(_sdx.kp||'').replace(/\D/g,'');
    if(_kpKeySend && _kpSeenSend[_kpKeySend]){
      toast('❌ No. KP "'+_sdx.kp+'" untuk peserta "'+_sdx.nama+'" sama dengan peserta "'+_kpSeenSend[_kpKeySend]+'". Sila betulkan sebelum hantar.','er');
      return;
    }
    if(_kpKeySend) _kpSeenSend[_kpKeySend]=_sdx.nama;
  }

  var allRows=[];
  pesFilled.forEach(function(p){
    var katSah=p.kategori.filter(function(k){return k&&k!=='GURU';});
    if(!katSah.length)return;
    var g=guruFilled[0]||{nama:'',kp:'',bangsa:'',jantina:'',tel:''};
    katSah.forEach(function(k){
      allRows.push([selId,selNm,kod,sk,k,g.nama,g.kp,g.bangsa,g.jantina,g.tel,p.nama,p.kp,p.jantina,p.bangsa]);
    });
  });
  for(var gi=1;gi<guruFilled.length;gi++){
    var eg=guruFilled[gi];
    if(!eg.nama.trim())continue;
    allRows.push([selId,selNm,kod,sk,'GURU',eg.nama,eg.kp,eg.bangsa,eg.jantina,eg.tel,'','','','']);
  }

  if(!allRows.length){toast('Tiada data untuk dihantar','er');return;}
  var fn=isEdit?'kemaskiniPenyertaanSekolahGS':'hantarPenyertaanGS';
  var payload=isEdit
    ?{programId:selId,programNama:selNm,kodSekolah:editKod,namaSekolah:sk,rows:allRows}
    :{programId:selId,programNama:selNm,kodSekolah:kod,namaSekolah:sk,rows:allRows};

  showOv(isEdit?'MENGEMASKINI...':'MENGHANTAR...');
  setBtn('btn-hantar',true);
  try{
    var r=await run(fn,payload);
    if(r&&r.ok){
      toast(r.msg||'Penyertaan berjaya dihantar','ok');
      closeMo('mo-pengesahan');
      resetPeny();
      hideOv(); setBtn('btn-hantar',false);
      // Papar modal salinan penyertaan untuk cetak/simpan PDF
      _salinanPayload=payload; _salinanRows=allRows; // simpan untuk muatTurunSalinan()
      buildSalinanPortal(payload, allRows);
      openMo('mo-salinan');
      return;
    } else {
      toast((r&&r.msg)||'Ralat semasa menghantar','er');
    }
  }catch(e){toast('Ralat: '+e.message,'er');}
  finally{hideOv();setBtn('btn-hantar',false);}
}

