// ===== CHECKBOX MULTI-SELECT DROPDOWN HELPERS =====
function _chkdBuild(id, items, selected, placeholder){
  var el=document.getElementById(id);
  if(!el)return;
  var norm=items.map(function(x){return typeof x==='string'?{val:x,lbl:x}:x;});
  var selArr=Array.isArray(selected)?selected.slice():[];
  var btnId=id+'-btn', panelId=id+'-panel', tagsId=id+'-tags', srchId=id+'-srch';
  // Simpan dalam memori pada elemen wrapper
  el._chkdNorm=norm;
  el._chkdSel=selArr;
  el._chkdPlaceholder=placeholder;
  // Buang panel lama dari body jika ada (rebuild)
  var oldPanel=document.getElementById(panelId);
  if(oldPanel&&oldPanel.parentNode===document.body)document.body.removeChild(oldPanel);
  // Bina butang + tags dalam wrapper .chkd
  el.innerHTML=''
    +'<button type="button" class="chkd-btn" id="'+btnId+'" onclick="_chkdToggle(\''+id+'\')">'
    +'<span class="chkd-lbl" id="'+id+'-lbl">'+placeholder+'</span>'
    +'<span class="chkd-arr">▼</span>'
    +'</button>'
    +'<div class="chkd-tags" id="'+tagsId+'"></div>';
  // Bina panel dan teleport ke document.body — transform modal tidak mempengaruhi fixed
  var panel=document.createElement('div');
  panel.className='chkd-panel';
  panel.id=panelId;
  panel.setAttribute('data-chkd-id',id);
  panel.innerHTML='<div class="chkd-srch"><input id="'+srchId+'" type="text" placeholder="Cari..." oninput="_chkdFilter(\''+id+'\')" autocomplete="off"></div>'
    +'<div id="'+id+'-list"></div>';
  document.body.appendChild(panel);
  _chkdRenderList(id, norm, selArr);
  _chkdUpdateTags(id, norm, selArr, placeholder);
  // Daftar listener tutup-luar sekali sahaja
  if(!window._chkdOutside){
    window._chkdOutside=true;
    document.addEventListener('click',function(ev){
      document.querySelectorAll('.chkd-panel.on').forEach(function(p){
        var cid=p.getAttribute('data-chkd-id');
        var btn2=document.getElementById(cid+'-btn');
        var wrap=btn2?btn2.closest('.chkd'):null;
        if(!p.contains(ev.target)&&!(wrap&&wrap.contains(ev.target))){
          p.classList.remove('on');
          if(btn2)btn2.classList.remove('on');
        }
      });
    },true);
  }
}
function _chkdRenderList(id, norm, selArr){
  var srch=(document.getElementById(id+'-srch')||{}).value||'';
  var listEl=document.getElementById(id+'-list');if(!listEl)return;
  var filtered=norm.filter(function(x){return !srch||x.lbl.toLowerCase().indexOf(srch.toLowerCase())>=0;});
  if(!filtered.length){listEl.innerHTML='<div class="chkd-empty">Tiada pilihan</div>';return;}
  listEl.innerHTML='';
  filtered.forEach(function(x){
    var chk=selArr.indexOf(x.val)>=0;
    var div=document.createElement('div');
    div.className='chkd-item'+(chk?' checked':'');
    div.innerHTML='<input type="checkbox" '+(chk?'checked':'')+' value="'+x.val.replace(/"/g,'&quot;')+'"><span>'+x.lbl+'</span>';
    div.querySelector('input').addEventListener('change',function(ev){
      ev.stopPropagation();
      var v=this.value;
      var idx=selArr.indexOf(v);
      if(this.checked){if(idx<0)selArr.push(v);}else{if(idx>=0)selArr.splice(idx,1);}
      div.className='chkd-item'+(this.checked?' checked':'');
      _chkdUpdateTags(id, norm, selArr, '');
    });
    listEl.appendChild(div);
  });
}
function _chkdFilter(id){
  var el=document.getElementById(id);if(!el)return;
  _chkdRenderList(id, el._chkdNorm||[], el._chkdSel||[]);
}
function _chkdToggle(id){
  var panel=document.getElementById(id+'-panel');
  var btn=document.getElementById(id+'-btn');
  if(!panel||!btn)return;
  var open=panel.classList.contains('on');
  // Tutup semua panel lain
  document.querySelectorAll('.chkd-panel.on').forEach(function(p){
    if(p.id!==id+'-panel'){
      var cid=p.getAttribute('data-chkd-id');
      var b=document.getElementById(cid+'-btn');
      p.classList.remove('on');
      if(b)b.classList.remove('on');
    }
  });
  if(!open){
    // Panel sudah di body — getBoundingClientRect tepat, tiada transform mengganggu
    var r=btn.getBoundingClientRect();
    var w=Math.max(r.width,220);
    var left=r.left;
    if(left+w>window.innerWidth-8)left=window.innerWidth-w-8;
    if(left<4)left=4;
    panel.style.top=(r.bottom+2)+'px';
    panel.style.left=left+'px';
    panel.style.width=w+'px';
    panel.style.maxHeight='220px';
  }
  panel.classList.toggle('on',!open);
  if(btn)btn.classList.toggle('on',!open);
  if(!open){
    var si=document.getElementById(id+'-srch');
    if(si){si.value='';_chkdFilter(id);si.focus({preventScroll:true});}
  }
}
function _chkdUpdateTags(id, norm, selArr, placeholder){
  var el=document.getElementById(id);
  var ph=placeholder||(el&&el._chkdPlaceholder)||'— PILIH —';
  var lbl=document.getElementById(id+'-lbl');
  var tagsEl=document.getElementById(id+'-tags');
  if(!lbl||!tagsEl)return;
  if(!selArr.length){
    lbl.textContent=ph;
    tagsEl.innerHTML='';
    return;
  }
  lbl.textContent=selArr.length+' dipilih';
  tagsEl.innerHTML='';
  selArr.forEach(function(v){
    var item=(el&&el._chkdNorm||norm||[]).find(function(x){return x.val===v;})||{val:v,lbl:v};
    var tag=document.createElement('span');tag.className='chkd-tag';
    tag.innerHTML=item.lbl+'<span class="chkd-tag-x" title="Buang">✕</span>';
    tag.querySelector('.chkd-tag-x').addEventListener('click',function(ev){
      ev.stopPropagation();
      var idx=selArr.indexOf(v);if(idx>=0)selArr.splice(idx,1);
      _chkdUpdateTags(id, el?el._chkdNorm:norm, selArr, ph);
      // uncheck in list
      var listEl=document.getElementById(id+'-list');
      if(listEl){var cb=listEl.querySelector('input[value="'+v.replace(/"/g,'\\"')+'"]');if(cb){cb.checked=false;cb.closest('.chkd-item').className='chkd-item';}}
    });
    tagsEl.appendChild(tag);
  });
}
function _chkdGetSel(id){
  // Baca dari memori (_chkdSel) — bukan dari DOM yang mungkin tertapis/filtered
  var el=document.getElementById(id);
  return (el&&el._chkdSel)?el._chkdSel.slice():[];
}


function rPGKat(kat,k){
  var katKey=kat.replace(/\s/g,'-');
  var sekEl=document.getElementById('pc-s-'+katKey+'-'+k); if(!sekEl)return;
  var sek=sekEl.value;
  var isBerk=kat.indexOf('BERKUMPULAN')>=0,isKsel=kat==='KESELURUHAN',isTrbBrk=kat==='TERBUKA BERKUMPULAN';
  var pWrap=document.getElementById('pc-p-'+katKey+'-'+k);
  var gWrap=document.getElementById('pc-g-'+katKey+'-'+k);
  var pKey=sek+'||'+kat;
  if(pWrap&&!isBerk&&!isKsel&&!isTrbBrk){
    var pesItems=(_pps[pKey]||_pps[sek]||[]).map(function(p){return{val:p.n+'|'+p.kp,lbl:p.n};});
    _chkdBuild(pWrap.id, pesItems, [], '— PILIH PESERTA —');
  }
  if(gWrap){
    var guruItems=(_gps[sek]||[]).map(function(g){return{val:g.n+'|'+g.kp,lbl:g.n};});
    _chkdBuild(gWrap.id, guruItems, [], '— PILIH GURU —');
  }
  updateMarkah(kat,k);
}

function updateMarkah(kat,k){
  var katKey=kat.replace(/\s/g,'-');
  var se=document.getElementById('pc-s-'+katKey+'-'+k);
  var me=document.getElementById('pc-m-'+katKey+'-'+k);
  if(!me)return;
  var per=(gv('e-per')||'SEKOLAH').toUpperCase();
  var tpt=getTPT(kat).find(function(t){return t.k===k;});
  if(se&&se.value&&tpt){
    me.value=mPts(per,tpt.l)+' mata';
    me.style.color='var(--red)';
  } else {
    me.value='—';
    me.style.color='var(--g5)';
  }
}

// Kumpul semua entri pencapaian dari borang
function _collectPencEntries(){
  var per=gv('e-per');
  var allEntries=[];
  var savedKat=[];
  (_pcKatList.length?_pcKatList:['INDIVIDU LELAKI']).forEach(function(kat){
    var isBerk=kat.indexOf('BERKUMPULAN')>=0;
    var isKsel=kat==='KESELURUHAN';
    var isTrbBrk=kat==='TERBUKA BERKUMPULAN';
    getTPT(kat).forEach(function(t){
      var katKey=kat.replace(/\s/g,'-');
      var se=document.getElementById('pc-s-'+katKey+'-'+t.k);if(!se)return;
      var sek=se.value;if(!sek)return;
      var markah=mPts(per,t.l);
      // Baca guru (boleh berbilang) — val format "nama|kp", pisahkan & gabung sejajar
      var gWrap=document.getElementById('pc-g-'+katKey+'-'+t.k);
      var guruSelVals=gWrap?_chkdGetSel(gWrap.id):[];
      var guruNm=guruSelVals.map(function(v){return (v.split('|')[0]||'').trim();}).join(' | ');
      var guruKp=guruSelVals.map(function(v){return (v.split('|')[1]||'').trim();}).join(' | ');
      if(!isBerk&&!isKsel&&!isTrbBrk){
        // Individu/Terbuka: satu entri per peserta yang dipilih
        var pWrap=document.getElementById('pc-p-'+katKey+'-'+t.k);
        var pesSelVals=pWrap?_chkdGetSel(pWrap.id):[];
        if(pesSelVals.length){
          pesSelVals.forEach(function(pv){
            var parts=pv.split('|');var pes=parts[0]||'';var kp=parts[1]||'';
            allEntries.push({kategori:kat,sekolah:sek,peserta:pes,kpPeserta:kp,guru:guruNm,kpGuru:guruKp,tempat:t.l,markah:markah});
          });
        } else {
          allEntries.push({kategori:kat,sekolah:sek,peserta:'',kpPeserta:'',guru:guruNm,kpGuru:guruKp,tempat:t.l,markah:markah});
        }
      } else {
        // Berkumpulan/Keseluruhan/Terbuka Berkumpulan: satu entri per peserta dari senarai agregat; markah sekolah dikira sekali
        var pesList=(_brkPesList[kat]&&_brkPesList[kat][sek])||[];
        if(pesList.length){
          pesList.forEach(function(p,pi){
            allEntries.push({
              kategori:kat, sekolah:sek, peserta:p.n, kpPeserta:p.kp,
              guru:guruNm, kpGuru:guruKp, tempat:t.l, markah:markah,
              _brkMain:(pi===0) // hanya entri PERTAMA dikira untuk markah sekolah
            });
          });
        } else {
          // Tiada peserta — sekolah tetap dapat markah tapi peserta tidak muncul dalam ranking
          allEntries.push({kategori:kat,sekolah:sek,peserta:'',kpPeserta:'',guru:guruNm,kpGuru:guruKp,tempat:t.l,markah:markah,_brkMain:true});
        }
      }
      if(savedKat.indexOf(kat)<0)savedKat.push(kat);
    });
  });
  return {entries:allEntries,savedKat:savedKat,per:per};
}

// Tunjuk paparan pengesahan sebelum simpan
function savePenc(){
  var col=_collectPencEntries();
  if(!col.entries.length){toast('Tiada pencapaian diisi','er');return;}
  _buildPencConfirm(col);
}

function _buildPencConfirm(col){
  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  var katColors={'INDIVIDU LELAKI':'rgba(41,128,185,.08)','INDIVIDU PEREMPUAN':'rgba(233,30,140,.06)','BERKUMPULAN LELAKI':'rgba(39,174,96,.08)','BERKUMPULAN PEREMPUAN':'rgba(142,68,173,.07)','KESELURUHAN':'rgba(192,57,43,.06)','TERBUKA':'rgba(230,126,34,.08)','TERBUKA INDIVIDU':'rgba(230,126,34,.08)','TERBUKA BERKUMPULAN':'rgba(211,84,0,.08)'};

  // Kumpulkan entri mengikut kategori
  var byKat={};
  col.entries.forEach(function(e){
    if(!byKat[e.kategori])byKat[e.kategori]=[];
    byKat[e.kategori].push(e);
  });

  var html='<div style="font-size:.72rem;color:var(--g6);margin-bottom:.8rem;">Sila semak semua pencapaian sebelum menyimpan. Rekod lama akan digantikan.</div>';

  col.savedKat.forEach(function(kat){
    var items=byKat[kat]||[];
    var c=colors[kat]||'#555';
    var bg=katColors[kat]||'rgba(0,0,0,.03)';
    var isBerk=kat.indexOf('BERKUMPULAN')>=0;
    var isKsel=kat==='KESELURUHAN';
    var isBK=isBerk||isKsel;
    // Untuk semua kategori: kumpulkan peserta mengikut (tempat+sekolah) — satu baris per tempat per sekolah
    var displayItems=[];
    var grouped={};var groupOrder=[];
    items.forEach(function(e){
      var key=e.tempat+'||'+e.sekolah;
      if(!grouped[key]){grouped[key]={tempat:e.tempat,sekolah:e.sekolah,guru:e.guru,markah:e.markah,pesertaList:[]};groupOrder.push(key);}
      if(e.peserta)grouped[key].pesertaList.push(e.peserta);
    });
    groupOrder.forEach(function(k){displayItems.push(grouped[k]);});
    // Kira bilangan sekolah unik
    var sekCount=displayItems.length;
    html+='<div style="margin-bottom:.75rem;border:1.5px solid '+c+';border-radius:var(--r);overflow:hidden;">'
      +'<div style="background:'+c+';color:#fff;padding:.38rem .7rem;font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;">'+kat+' ('+sekCount+' rekod)</div>';
    if(!displayItems.length){
      html+='<div style="padding:.5rem .7rem;font-size:.72rem;color:var(--g6);">— Tiada rekod —</div>';
    } else {
      displayItems.forEach(function(e,i){
        html+='<div style="padding:.35rem .7rem;border-bottom:1px dashed var(--g1);font-size:.72rem;background:'+(i%2===0?'#fff':bg)+'">'
          +'<div style="display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;">'
          +'<span style="font-family:Montserrat,sans-serif;font-size:.58rem;font-weight:900;color:'+c+';min-width:60px;">'+e.tempat+'</span>'
          +'<strong style="flex:1;min-width:90px;">'+e.sekolah+'</strong>'
          +(e.guru?'<span style="color:var(--g6);font-size:.65rem;">👨‍🏫 '+e.guru+'</span>':'')
          +'<span style="color:var(--red);font-weight:800;font-size:.68rem;white-space:nowrap;">+'+e.markah+' mata</span>'
          +'</div>'
          +(e.pesertaList&&e.pesertaList.length
            ?'<div style="display:flex;flex-wrap:wrap;gap:.22rem;margin-top:.3rem;padding-left:66px;">'
              +e.pesertaList.map(function(nm){return '<span style="font-size:.6rem;background:rgba(0,0,0,.06);border-radius:20px;padding:.06rem .32rem;">👤 '+nm+'</span>';}).join('')
              +'</div>'
            :'')
          +'</div>';
      });
    }
    html+='</div>';
  });

  // Jumlah keseluruhan markah per sekolah
  // Markah sekolah dikira SEKALI sahaja per (kategori+tempat+sekolah) — walaupun banyak peserta dipilih
  var sekTotal={};
  var _mSeen={};
  col.entries.forEach(function(e){
    var mKey=e.kategori+'|'+e.tempat+'|'+e.sekolah;
    if(_mSeen[mKey])return;
    _mSeen[mKey]=1;
    sekTotal[e.sekolah]=(sekTotal[e.sekolah]||0)+e.markah;
  });
  var sekArr=Object.entries(sekTotal).sort(function(a,b){return b[1]-a[1];});
  if(sekArr.length){
    html+='<div style="background:var(--rp);border:1px solid rgba(192,57,43,.15);border-radius:var(--r);padding:.65rem .85rem;margin-top:.5rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.68rem;font-weight:900;color:var(--red);margin-bottom:.4rem;">📊 RINGKASAN MARKAH SEKOLAH</div>';
    sekArr.forEach(function(s,i){
      html+='<div style="display:flex;justify-content:space-between;font-size:.7rem;padding:.15rem 0;border-bottom:1px dashed rgba(192,57,43,.1);">'
        +'<span style="font-weight:700;">'+(i+1)+'. '+s[0]+'</span>'
        +'<span style="color:var(--red);font-weight:800;">'+s[1]+' mata</span>'
        +'</div>';
    });
    html+='</div>';
  }

  // Bina modal pengesahan pencapaian
  var mo=document.getElementById('mo-penc-confirm');
  if(!mo){
    mo=document.createElement('div');
    mo.id='mo-penc-confirm';
    mo.className='mo';
    mo.innerHTML='<div class="md md-m">'
      +'<div class="mh">✅ PENGESAHAN PENCAPAIAN</div>'
      +'<div id="penc-confirm-body" style="max-height:62vh;overflow-y:auto;"></div>'
      +'<div class="mt2 fx gu" id="mo-penc-confirm-foot" style="flex-wrap:wrap;">'
      +'<button class="btn bg" id="btn-penc-sahkan" onclick="doSavePenc()">💾 SIMPAN PENCAPAIAN</button>'
      +'<button class="btn bs" onclick="closeMo(\'mo-penc-confirm\')">✏ KEMBALI KEMASKINI</button>'
      +'</div></div>';
    document.body.appendChild(mo);
    // P1-A: Backdrop click-to-close dinyahaktifkan pada modal dinamik juga.
  }
  document.getElementById('penc-confirm-body').innerHTML=html;
  // Simpan col untuk digunakan semasa doSavePenc
  window._pendingPencCol=col;
  openMo('mo-penc-confirm');
}

async function doSavePenc(){
  var col=window._pendingPencCol;
  if(!col||!col.entries.length){toast('Tiada pencapaian','er');return;}
  var per=col.per;
  var _ok=false; // flag untuk finally — elak r scoping issue
  setBtn('btn-penc-sahkan',true);
  showOv('MENYIMPAN PENCAPAIAN...');
  try{
    var r=await run('simpanPencapaianGS',{programId:eId,programNama:eNm,peringkat:per,kategoriList:col.savedKat,entries:col.entries});
    if(r&&r.ok){
      _ok=true;
      toast('Pencapaian disimpan ✓','ok');
      // Kemaskini _pcPnc (borang semasa) dan _aPnc (cache global untuk dashboard)
      var mapped=col.entries.map(function(e){return {'Kategori':e.kategori,'Nama Sekolah':e.sekolah,'Nama Peserta':e.peserta,'Nama Guru':e.guru,'Tempat':e.tempat,'Peringkat':per,'Program ID':eId,'Nama Program':eNm};});
      _pcPnc=mapped;
      // Kemaskini _aPnc — buang rekod lama bagi program ini, tambah yang baru
      _aPnc=(_aPnc||[]).filter(function(e){return e['Program ID']!==eId;}).concat(mapped);
      // Kemas butang simpan
      var _savBtn=document.getElementById('btn-penc-sahkan');
      if(_savBtn){
        _savBtn.textContent='✓ DISIMPAN';
        _savBtn.style.background='#27ae60';
        _savBtn.disabled=true;
      }
      // Tambah butang tutup menggunakan id yang betul
      var _ef=document.getElementById('mo-penc-confirm-foot');
      if(_ef&&!_ef.querySelector('.btn-tutup-penc')){
        var _tbtn=document.createElement('button');
        _tbtn.className='btn bs btn-tutup-penc';
        _tbtn.textContent='✕ TUTUP';
        _tbtn.onclick=function(){
          closeMo('mo-penc-confirm');
          setTimeout(function(){
            var b=document.querySelector('#mo-penc-confirm-foot .btn-tutup-penc');if(b)b.remove();
            var simpanBtn=document.getElementById('btn-penc-sahkan');
            if(simpanBtn){simpanBtn.textContent='💾 SIMPAN PENCAPAIAN';simpanBtn.style.background='';simpanBtn.disabled=false;}
          },400);
        };
        _ef.insertBefore(_tbtn,_ef.firstChild);
      }
    } else toast((r&&r.msg)||'Ralat','er');
  }catch(e){toast('Ralat: '+e.message,'er');}
  finally{hideOv();if(!_ok)setBtn('btn-penc-sahkan',false);}
}

// PADAM
function reqPadam(id,nm,kp){
  if(!_sesi){toast('Sila log masuk dahulu','er');return;}
  if(_sesi.role!=='admin'){toast('Akses ditolak. Hanya Admin boleh memadam program.','er');return;}
  askConfirm('🗑 PADAM PROGRAM','⚠ Padam "'+nm+'"?\nSemua data penyertaan dan pencapaian akan dipadam. Tindakan tidak boleh dibuat alik.',function(){padamProg(id);});
}
async function padamProg(id){
  showOv('MEMADAM...');
  try{var r=await run('padamProgramGS',{id:id});if(r&&r.ok){toast('Program dipadam','ok');setTimeout(function(){loadProgs(true);},1500);}else toast((r&&r.msg)||'Ralat','er');}
  catch(e){toast('Ralat: '+e.message,'er');}finally{hideOv();}
}

// RUMUSAN
function reqRum(id,status){
  if(!_sesi){toast('Sila log masuk dahulu','er');return;}
  if(_sesi.role!=='admin' && _sesi.role!=='pkk'){toast('Akses ditolak. Hanya Admin atau PKK boleh melihat rumusan.','er');return;}
  doRumusan(id,status);
}
async function doRumusan(pid,status){
  // Modal dibuka serta-merta; penunjuk memuatkan dalam badan modal
  var _rb=document.getElementById('rum-body'); if(_rb) _rb.innerHTML=ldInline('Memuatkan rumusan...');
  openMoOnce('mo-rum');
  try{
    var r=await run('getRumusanGS',pid);
    if(!r||!r.ok){toast((r&&r.msg)||'Gagal','er'); closeMo('mo-rum'); return;}
    // Cari data program dari senarai tempatan
    var prog=(_allProg||[]).find(function(p){return p['ID']===pid;});
    if(!prog){
      // Cuba dapatkan dari getAllDataGS jika _allProg kosong
      var rd=await run('getAllDataGS');
      prog=((rd&&rd.programs)||[]).find(function(p){return p['ID']===pid;})||{};
      _allProg=(rd&&rd.programs)||_allProg||[];
    }
    buildRum(prog,r.penyertaan||[],r.pencapaian||[],status==='TUTUP');
  }catch(e){toast('Ralat: '+e.message,'er'); closeMo('mo-rum');}
}
function buildRum(prog,pny,pnc,isTutup){
  // == Deduplicate ==========================================
  var uSek={},uG={},uPs={};
  pny.forEach(function(p){
    if(p['Nama Sekolah'])uSek[p['Nama Sekolah']]=1;
    var gk=p['No KP Guru']||p['Nama Guru']; if(gk)uG[gk]=p['Nama Guru']||gk;
    var pk=p['No KP Peserta']||p['Nama Peserta']; if(pk)uPs[pk]=p['Nama Peserta']||pk;
  });
  var nSek=Object.keys(uSek).length, nG=Object.keys(uG).length, nPs=Object.keys(uPs).length;
  var now=new Date();
  var printDate=now.toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});
  var per=(prog['Peringkat']||'SEKOLAH').toUpperCase();

  // == Screen view (modal) =================================
  var scr='';

  // Header
  scr+='<div class="rsec" style="text-align:center;border-bottom:2px solid var(--red);padding-bottom:10pt;margin-bottom:12pt;">'
    +'<div class="rum-logo"><img src="'+LOGO_URL+'" alt="Logo" style="max-height:56px;max-width:160px;object-fit:contain;"></div>'
    +'<div style="font-family:Montserrat,sans-serif;font-size:1.15rem;font-weight:900;color:var(--red);">'+prog['Nama Program']+'</div>'
    +'<div style="font-size:.8rem;color:var(--g6);margin-top:3px;">'+prog['Pengelola']+' &nbsp;|&nbsp; '+prog['Bidang']+' &nbsp;|&nbsp; '+(prog['Kategori']||'INDIVIDU')+'</div>'
    +'</div>';

  // 1. Maklumat
  scr+='<div class="rsec"><div class="rtit">1. Maklumat Program</div>'
    +[['Nama Program',prog['Nama Program']],['Pengelola',prog['Pengelola']],
      ['Bidang',prog['Bidang']],['Kategori',prog['Kategori']||'INDIVIDU'],
      ['Peringkat',prog['Peringkat']],['Tarikh',fd(prog['Tarikh'])],
      ['Tempat',prog['Tempat']],['Status',prog['Status']]]
    .map(function(r){return '<div class="rrow"><span class="rk">'+r[0]+'</span><span class="rv">'+r[1]+'</span></div>';}).join('')
    +'</div>';

  // 2. Statistik
  scr+='<div class="rsec"><div class="rtit">2. Statistik Penyertaan</div>'
    +'<div class="rrow"><span class="rk">Jumlah Sekolah</span><span class="rv">'+nSek+'</span></div>'
    +'<div class="rrow"><span class="rk">Jumlah Guru (unik)</span><span class="rv">'+nG+'</span></div>'
    +'<div class="rrow"><span class="rk">Jumlah Peserta (unik)</span><span class="rv">'+nPs+'</span></div>'
    +'<div class="rrow"><span class="rk">Jumlah Rekod</span><span class="rv">'+pny.length+'</span></div>'
    +'</div>';

  // 3. Pencapaian (after statistik — always)
  // Format diselaraskan dengan EDIT - PENCAPAIAN: kumpul mengikut Kategori → Tempat → Sekolah, peserta sebagai pills
  if(pnc.length){
    scr+='<div class="rsec"><div class="rtit">3. Pencapaian</div>';
    var _katColors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c','BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad','KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
    var _katBg={'INDIVIDU LELAKI':'rgba(41,128,185,.08)','INDIVIDU PEREMPUAN':'rgba(233,30,140,.06)','BERKUMPULAN LELAKI':'rgba(39,174,96,.08)','BERKUMPULAN PEREMPUAN':'rgba(142,68,173,.07)','KESELURUHAN':'rgba(192,57,43,.06)','TERBUKA':'rgba(230,126,34,.08)','TERBUKA INDIVIDU':'rgba(230,126,34,.08)','TERBUKA BERKUMPULAN':'rgba(211,84,0,.08)'};
    var _katOrder2=['INDIVIDU LELAKI','INDIVIDU PEREMPUAN','BERKUMPULAN LELAKI','BERKUMPULAN PEREMPUAN','KESELURUHAN','TERBUKA INDIVIDU','TERBUKA BERKUMPULAN','TERBUKA'];
    // Kumpul mengikut kategori
    var _pncByKat={};
    pnc.forEach(function(e){
      var kat=(e['Kategori']||'UMUM').toUpperCase();
      if(!_pncByKat[kat])_pncByKat[kat]=[];
      _pncByKat[kat].push(e);
    });
    var _katList2=_katOrder2.concat(Object.keys(_pncByKat).filter(function(k){return _katOrder2.indexOf(k)<0;}))
      .filter(function(k){return _pncByKat[k]&&_pncByKat[k].length;});
    _katList2.forEach(function(kat){
      var items=_pncByKat[kat];
      var c=_katColors[kat]||'#555';
      var bg=_katBg[kat]||'rgba(0,0,0,.03)';
      // Kumpul peserta mengikut (tempat + sekolah) — satu baris per tempat per sekolah
      var grouped={};var groupOrder=[];
      items.forEach(function(e){
        var key=(e['Tempat']||'')+'||'+(e['Nama Sekolah']||'');
        if(!grouped[key]){
          grouped[key]={tempat:(e['Tempat']||'').toUpperCase(),sekolah:e['Nama Sekolah']||'',guru:e['Nama Guru']||'',peringkat:(e['Peringkat']||per).toUpperCase(),markah:0,pesertaList:[]};
          groupOrder.push(key);
        }
        grouped[key].markah=mPts(grouped[key].peringkat,grouped[key].tempat);
        if(e['Nama Peserta'])grouped[key].pesertaList.push(e['Nama Peserta']);
      });
      var displayItems=groupOrder.map(function(k){return grouped[k];});
      scr+='<div style="margin-bottom:.75rem;border:1.5px solid '+c+';border-radius:var(--r);overflow:hidden;">'
        +'<div style="background:'+c+';color:#fff;padding:.38rem .7rem;font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;">'+kat+' ('+displayItems.length+' rekod)</div>';
      displayItems.forEach(function(e,i){
        scr+='<div style="padding:.35rem .7rem;border-bottom:1px dashed var(--g1);font-size:.72rem;background:'+(i%2===0?'#fff':bg)+'">'
          +'<div style="display:flex;align-items:center;flex-wrap:wrap;gap:.4rem;">'
          +'<span style="font-family:Montserrat,sans-serif;font-size:.58rem;font-weight:900;color:'+c+';min-width:60px;">'+e.tempat+'</span>'
          +'<strong style="flex:1;min-width:90px;">'+e.sekolah+'</strong>'
          +(e.guru?'<span style="color:var(--g6);font-size:.65rem;">👨‍🏫 '+e.guru+'</span>':'')
          +'<span style="color:var(--red);font-weight:800;font-size:.68rem;white-space:nowrap;">+'+e.markah+' mata</span>'
          +'</div>'
          +(e.pesertaList&&e.pesertaList.length
            ?'<div style="display:flex;flex-wrap:wrap;gap:.22rem;margin-top:.3rem;padding-left:66px;">'
              +e.pesertaList.map(function(nm){return '<span style="font-size:.6rem;background:rgba(0,0,0,.06);border-radius:20px;padding:.06rem .32rem;">👤 '+nm+'</span>';}).join('')
              +'</div>'
            :'')
          +'</div>';
      });
      scr+='</div>';
    });
    scr+='</div>';
  }

  // 4. Demografi Keseluruhan
  scr+='<div class="rsec"><div class="rtit">4. Analisis Demografi Keseluruhan</div>'
    +'<div class="dgrid">'
    +dBox('Jantina Guru',cntBy(uniqGuru(pny),'Jantina Guru'))
    +dBox('Jantina Peserta',cntBy(uniqPes(pny),'Jantina Peserta'))
    +dBoxBJ('Bangsa & Jantina — Guru',uniqGuru(pny),'Bangsa Guru','Jantina Guru')
    +dBoxBJ('Bangsa & Jantina — Peserta',uniqPes(pny),'Bangsa Peserta','Jantina Peserta')
    +'</div></div>';

  // 5. Demografi Per Sekolah
  scr+='<div class="rsec"><div class="rtit">5. Demografi Mengikut Sekolah</div>';
  Object.keys(uSek).forEach(function(sk){
    var sp=pny.filter(function(p){return p['Nama Sekolah']===sk;});
    scr+='<div style="margin-bottom:.7rem;border:1px solid var(--g2);border-radius:var(--r);padding:.7rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.7rem;font-weight:800;color:var(--g8);margin-bottom:.45rem;">'+sk+'</div>'
      +'<div class="dgrid">'
      +dBox('Jantina Guru',cntBy(uniqGuru(sp),'Jantina Guru'))
      +dBox('Jantina Peserta',cntBy(uniqPes(sp),'Jantina Peserta'))
      +dBoxBJ('Bangsa & Jantina — Guru',uniqGuru(sp),'Bangsa Guru','Jantina Guru')
      +dBoxBJ('Bangsa & Jantina — Peserta',uniqPes(sp),'Bangsa Peserta','Jantina Peserta')
      +'</div></div>';
  });
  scr+='</div>';

  document.getElementById('rum-tit').textContent='📄 RUMUSAN: '+prog['Nama Program'];
  document.getElementById('rum-body').innerHTML=scr;
  document.getElementById('btn-csv').style.display='inline-flex';
  window._rumPny=pny; window._rumProg=prog; window._rumPnc=pnc;

  // == Build dedicated print portal (separate from modal) ==
  buildPrintPortal(prog,pny,pnc,isTutup,nSek,nG,nPs,per,printDate);

  openMoOnce('mo-rum');
}

