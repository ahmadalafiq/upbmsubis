// == Auto PDF Salinan Penyertaan ===============================================
async function janaPdfSalinanPenyertaan(payload, allRows){
  try{
    var { PDFDocument, rgb, StandardFonts } = PDFLib;
    var pdfDoc   = await PDFDocument.create();
    var fB = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    var fR = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // == Warna =============================================================
    var cRed   = rgb(0.75,0.22,0.17);
    var cRedDk = rgb(0.55,0.10,0.07);
    var cRedLt = rgb(0.98,0.92,0.92);
    var cBlue  = rgb(0.10,0.45,0.70);
    var cBluLt = rgb(0.91,0.95,0.98);
    var cDark  = rgb(0.13,0.13,0.13);
    var cGry   = rgb(0.42,0.42,0.42);
    var cLGry  = rgb(0.95,0.95,0.95);
    var cLine  = rgb(0.88,0.88,0.88);
    var cWht   = rgb(1,1,1);
    var cBluTxt= rgb(0.10,0.45,0.70);

    // == Dimensi A4 ========================================================
    var PW=595, PH=842, LM=20, RM=20, TM=15, BM=18;
    var AW = PW-LM-RM; // ~555pt lebar bergunaan

    // == Lajur: BIL | NAMA | KATEGORI | NO.KP | JANTINA | TEL/BANGSA ======
    var CW = { bil:18, nama:148, kat:120, kp:90, jan:62, last:117 };
    // CW.bil+nama+kat+kp+jan+last = 18+148+120+90+62+117 = 555 ✓
    var CX = {
      bil:  LM,
      nama: LM+18,
      kat:  LM+18+148,
      kp:   LM+18+148+120,
      jan:  LM+18+148+120+90,
      last: LM+18+148+120+90+62
    };

    var page, Y;

    function newPage(){
      page = pdfDoc.addPage([PW,PH]);
      Y = PH - TM;
    }
    newPage();

    // == Helpers ===========================================================
    function dt(txt, x, y, sz, font, col){
      if(txt===null||txt===undefined) txt='';
      page.drawText(String(txt), {x:x,y:y,size:sz,font:font||fR,color:col||cDark,
        maxWidth: PW-x-RM+2});
    }
    function dr(x,y,w,h,col,op){
      page.drawRectangle({x:x,y:y,width:w,height:h,color:col,opacity:op===undefined?1:op});
    }
    function dl(y2,col,thick){
      page.drawLine({start:{x:LM,y:y2},end:{x:PW-RM,y:y2},thickness:thick||0.4,color:col||cLine});
    }
    function chk(need){ if(Y<BM+need){ newPage(); } }

    // wrap teks ke max 2 baris
    function wrap(text, maxW, sz, font){
      font = font||fR;
      text = String(text||'');
      if(font.widthOfTextAtSize(text,sz)<=maxW) return [text];
      var words=text.split(' '), l1='', l2='';
      for(var i=0;i<words.length;i++){
        var t=l1?l1+' '+words[i]:words[i];
        if(font.widthOfTextAtSize(t,sz)<=maxW){l1=t;}
        else{l2=words.slice(i).join(' ');break;}
      }
      if(l2){ while(l2.length>1&&font.widthOfTextAtSize(l2,sz)>maxW) l2=l2.slice(0,-1)+'...'; }
      return l2?[l1,l2]:[l1||text];
    }

    // == HEADER MERAH =====================================================
    dr(0,PH-56,PW,56,cRed);
    dr(0,PH-70,PW,14,cRedDk);
    dt('SALINAN PENYERTAAN', LM, PH-36, 17, fB, cWht);
    dt('UPBM SUBIS  -  Sistem Pengurusan Bakat dan Minat', LM, PH-52, 7.5, fR, rgb(0.88,0.88,0.88));
    var dStr=new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});
    var dW=fR.widthOfTextAtSize(dStr,8);
    dt(dStr, PW-RM-dW, PH-36, 8, fR, rgb(0.88,0.88,0.88));
    Y = PH - 80;

    // == INFO PROGRAM =====================================================
    dt('PROGRAM', LM, Y, 6.5, fB, cGry); Y-=13;
    var pNm=String(payload.programNama||payload.programId||'-');
    var pLn=wrap(pNm, AW, 11, fB);
    pLn.forEach(function(l){dt(l,LM,Y,11,fB,cDark);Y-=14;});
    dl(Y+3,cLine,0.5); Y-=7;

    dt('SEKOLAH: '+(payload.namaSekolah||'-')+' ('+( payload.kodSekolah||'-')+')', LM, Y, 8, fR, cGry); Y-=12;

    // Definisikan filteredRows untuk kegunaan dalam fungsi ini
    var _salinanProgKats2=(_selKatList&&_selKatList.length)
      ?_selKatList.filter(function(k){return k!=='KESELURUHAN';})
      :null;
    var filteredRows=(allRows||[]).filter(function(r){
      var rk=r[4]||'';
      if(rk==='GURU') return true;
      if(!_salinanProgKats2||!_salinanProgKats2.length) return true;
      return _salinanProgKats2.indexOf(rk)>=0;
    });

    var katSet={};
    filteredRows.forEach(function(r){if(r[4]&&r[4]!=='GURU')katSet[r[4]]=true;});
    var katListStr=Object.keys(katSet).join(' | ');
    if(katListStr){ dt('KATEGORI: '+katListStr, LM, Y, 7.5, fR, cGry); Y-=12; }

    dl(Y+3,cRed,1); Y-=10;

    // == FUNGSI JADUAL ====================================================
    function drawSekHeader(label, col, colLt){
      chk(60);
      // Bar warna kiri
      dr(LM, Y-4, 4, 16, col);
      // Latar cerah
      dr(LM+4, Y-4, AW-4, 16, colLt);
      dt(label, LM+10, Y+3, 8.5, fB, col);
      Y-=22;
    }

    function drawTblHeader(c4){
      // Header row gelap
      dr(LM, Y-4, AW, 15, rgb(0.20,0.20,0.20));
      var hdrs=[['BIL',CX.bil+2],['NAMA',CX.nama+3],['KATEGORI',CX.kat+3],
                ['NO. KP',CX.kp+3],['JANTINA',CX.jan+3],[c4,CX.last+3]];
      hdrs.forEach(function(h){ dt(h[0],h[1],Y+1,6.5,fB,cWht); });
      // Garisan bawah header
      dl(Y-4,rgb(0.20,0.20,0.20),1);
      Y-=17;
    }

    function drawDataRow(bil, nama, kat, kp, jan, last, rowIdx){
      var namaLn = wrap(nama, CW.nama-4, 7.5, fB);
      var katLn  = wrap(kat,  CW.kat-4,  7,   fR);
      var rows   = Math.max(namaLn.length, katLn.length);
      var rH     = rows>1 ? 24 : 14;
      chk(rH+6);
      // Belang
      if(rowIdx%2===0) dr(LM, Y-rH+10, AW, rH, cLGry);
      // Garisan bawah baris
      dl(Y-rH+10, cLine, 0.3);
      // BIL
      var bilW=fB.widthOfTextAtSize(String(bil),7);
      dt(bil, CX.bil+(CW.bil-bilW)/2, Y, 7, fB, cGry);
      // NAMA (bold baris 1, biasa baris 2)
      dt(namaLn[0], CX.nama+3, Y, 7.5, fB, cDark);
      if(namaLn[1]) dt(namaLn[1], CX.nama+3, Y-11, 7, fR, cDark);
      // KATEGORI (biru, 2 baris)
      dt(katLn[0],  CX.kat+3,  Y, 7, fR, cBluTxt);
      if(katLn[1])  dt(katLn[1], CX.kat+3, Y-10, 6.5, fR, cBluTxt);
      // NO. KP
      dt(kp||'-',   CX.kp+3,  Y, 7.5, fR, cDark);
      // JANTINA
      dt(jan||'-',  CX.jan+3, Y, 7.5, fR, cDark);
      // TEL/BANGSA
      dt(last||'-', CX.last+3,Y, 7.5, fR, cDark);
      Y -= rH;
    }

    // == KUMPUL DATA GURU =================================================
    var guruInfoMap={}, guruKatMap={};
    (allRows||[]).forEach(function(r){
      var gk=r[6]||r[5]; if(!gk) return;
      if(!guruInfoMap[gk]) guruInfoMap[gk]={nama:r[5]||'',kp:r[6]||'',jan:r[8]||'',tel:r[9]||''};
      if(!guruKatMap[gk])  guruKatMap[gk]={};
      if(r[4]&&r[4]!=='GURU') guruKatMap[gk][r[4]]=true;
    });
    var guruArr=Object.keys(guruInfoMap).map(function(k){
      var g=guruInfoMap[k];
      return {nama:g.nama,kp:g.kp,jan:g.jan,tel:g.tel,
              kat:Object.keys(guruKatMap[k]||{}).join(', ')||'-'};
    });

    // == JADUAL GURU ======================================================
    if(guruArr.length){
      drawSekHeader('GURU PENGIRING  ('+guruArr.length+')', cRed, cRedLt);
      drawTblHeader('NO. TEL');
      guruArr.forEach(function(g,i){ drawDataRow(i+1,g.nama,g.kat,g.kp,g.jan,g.tel,i); });
      Y-=10;
    }

    // == KUMPUL DATA PESERTA ===============================================
    var pesInfoMap={}, pesKatMap={}, pesByKat={};
    (allRows||[]).forEach(function(r){
      if(!r[10]) return;
      var pk=r[11]||r[10];
      if(!pesInfoMap[pk]) pesInfoMap[pk]={nama:r[10],kp:r[11]||'',jan:r[12]||'',bangsa:r[13]||''};
      if(!pesKatMap[pk])  pesKatMap[pk]={};
      var k=r[4]||''; if(k&&k!=='GURU') pesKatMap[pk][k]=true;
      if(!pesByKat[k]) pesByKat[k]=[];
      if(!pesByKat[k].find(function(x){return (x.kp||x.nama)===(r[11]||r[10]);})){
        pesByKat[k].push({nama:r[10],kp:r[11]||'',jan:r[12]||'',bangsa:r[13]||'',
          kat: Object.keys(pesKatMap[pk]).join(', ')||k});
      }
    });

    // Kemas kategori peserta selepas semua rows diproses
    Object.keys(pesByKat).forEach(function(k){
      pesByKat[k].forEach(function(p){
        var pk=p.kp||p.nama;
        p.kat=Object.keys(pesKatMap[pk]||{}).join(', ')||k;
      });
    });

    // == JADUAL PESERTA IKUT KATEGORI ======================================
    var katOrder=(typeof _selKatList!=='undefined'&&_selKatList.length)?_selKatList:Object.keys(pesByKat);
    katOrder.forEach(function(kat){
      var list=pesByKat[kat];
      if(!list||!list.length) return;
      drawSekHeader('PESERTA - '+kat+'  ('+list.length+')', cBlue, cBluLt);
      drawTblHeader('BANGSA');
      list.forEach(function(p,i){ drawDataRow(i+1,p.nama,p.kat,p.kp,p.jan,p.bangsa,i); });
      Y-=10;
    });

    // == FOOTER SETIAP HALAMAN =============================================
    var pages=pdfDoc.getPages(), tot=pages.length;
    pages.forEach(function(pg,pi){
      pg.drawLine({start:{x:LM,y:BM+8},end:{x:PW-RM,y:BM+8},thickness:0.4,color:cLine});
      pg.drawText('UPBM SUBIS  -  Salinan Penyertaan  -  Muka '+(pi+1)+'/'+tot,
        {x:LM,y:BM-2,size:7,font:fR,color:cGry});
      var sk=payload.namaSekolah||'';
      var skW=fR.widthOfTextAtSize(sk,7);
      pg.drawText(sk,{x:PW-RM-skW,y:BM-2,size:7,font:fR,color:cGry});
    });

    // == SIMPAN & MUAT TURUN ===============================================
    var bytes=await pdfDoc.save();
    var blob=new Blob([bytes],{type:'application/pdf'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    var nm=(payload.namaSekolah||payload.kodSekolah||'sekolah').replace(/\s+/g,'_');
    var pr=(payload.programNama||'program').replace(/\s+/g,'_').substring(0,30);
    a.href=url; a.download='PENYERTAAN_'+pr+'_'+nm+'.pdf';
    a.click(); URL.revokeObjectURL(url);
    toast('PDF salinan penyertaan dimuat turun.','ok');
  }catch(e){
    console.warn('janaPdfSalinanPenyertaan error:',e);
    toast('PDF tidak dapat dijana: '+e.message,'er');
  }
}
// =======================================================
// SALINAN PENYERTAAN — modal + cetak/PDF
// =======================================================
function buildSalinanPortal(payload, allRows){
  var progNama = payload.programNama||payload.programId||'-';
  var nmSek    = payload.namaSekolah||'-';
  var kodSek   = payload.kodSekolah||'-';
  var tarikh   = new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});

  // Set document.title untuk nama fail PDF
  var safeNm = 'PENYERTAAN - '+String(nmSek||'').replace(/[^a-zA-Z0-9 _()-]/g,' ')
    +' - '+String(progNama||'').replace(/[^a-zA-Z0-9 _()-]/g,' ');
  document.title = safeNm.replace(/  +/g,' ').substring(0,100);

  // Filter allRows kepada kategori program sahaja
  var _salinanProgKats=(_selKatList&&_selKatList.length)
    ?_selKatList.filter(function(k){return k!=='KESELURUHAN';})
    :null;
  var filteredRows=(allRows||[]).filter(function(r){
    var rk=r[4]||'';
    if(rk==='GURU') return true;
    if(!_salinanProgKats||!_salinanProgKats.length) return true;
    return _salinanProgKats.indexOf(rk)>=0;
  });

  // == Kumpul guru ========================================================
  var guruMap={}, guruKat={};
  filteredRows.forEach(function(r){
    var gk=r[6]||r[5]; if(!gk) return;
    if(!guruMap[gk]) guruMap[gk]={nama:r[5]||'',kp:r[6]||'',jan:r[8]||'',tel:r[9]||''};
    if(!guruKat[gk]) guruKat[gk]={};
    if(r[4]&&r[4]!=='GURU') guruKat[gk][r[4]]=true;
  });
  var guruArr=Object.keys(guruMap).map(function(k){
    var g=guruMap[k];
    g.kat=Object.keys(guruKat[k]||{}).join(', ')||'';
    return g;
  });

  // == Kumpul peserta =====================================================
  var pesMap={}, pesKat={}, pesByKat={};
  filteredRows.forEach(function(r){
    if(!r[10]) return;
    var pk=r[11]||r[10];
    if(!pesMap[pk]) pesMap[pk]={nama:r[10],kp:r[11]||'',jan:r[12]||'',bangsa:r[13]||''};
    if(!pesKat[pk]) pesKat[pk]={};
    var k=r[4]||''; if(!k||k==='GURU') return;
    pesKat[pk][k]=true;
    if(!pesByKat[k]) pesByKat[k]=[];
    if(!pesByKat[k].find(function(x){return (x.kp||x.nama)===pk;}))
      pesByKat[k].push(pesMap[pk]);
  });
  Object.keys(pesByKat).forEach(function(k){
    pesByKat[k].forEach(function(p){
      var pk=p.kp||p.nama;
      p.kat=Object.keys(pesKat[pk]||{}).join(', ')||k;
    });
  });
  // Ikut susunan _selKatList jika ada, jika tidak ikut data
  var katOrder=(_salinanProgKats&&_salinanProgKats.length)
    ?_salinanProgKats.filter(function(k){return pesByKat[k]&&pesByKat[k].length;})
    :Object.keys(pesByKat);

  var katSet={};
  filteredRows.forEach(function(r){if(r[4]&&r[4]!=='GURU')katSet[r[4]]=true;});

  // == Warna kategori (sama dengan semakPeny) =============================
  var colors={'INDIVIDU LELAKI':'#2980b9','INDIVIDU PEREMPUAN':'#e91e8c',
    'BERKUMPULAN LELAKI':'#27ae60','BERKUMPULAN PEREMPUAN':'#8e44ad',
    'KESELURUHAN':'#c0392b','TERBUKA':'#e67e22','TERBUKA INDIVIDU':'#e67e22','TERBUKA BERKUMPULAN':'#d35400'};
  var RED='#BF3829';


  // == Bina HTML — gaya semakPeny =========================================
  var h='<div style="font-family:\'Open Sans\',sans-serif;font-size:.85rem;color:#222;padding:.75rem;">';

  // Header tarikh
  h+='<div style="text-align:right;font-size:.68rem;color:#888;margin-bottom:.5rem;">'+esc(tarikh)+'</div>';

  // Card sekolah + program (sama dengan pengesahan)
  h+='<div style="background:#fdf2f2;border:1px solid rgba(192,57,43,.18);border-radius:8px;padding:.75rem .9rem;margin-bottom:.9rem;">'
    +'<div style="font-family:Montserrat,sans-serif;font-size:.82rem;font-weight:900;color:#c0392b;">🏫 '+esc(nmSek)+'</div>'
    +'<div style="font-size:.68rem;color:#666;margin-top:.2rem;">Program: <strong>'+esc(progNama)+'</strong> &nbsp;|&nbsp; Kod: '+esc(kodSek)+'</div>'
    +'<div style="font-size:.65rem;color:#888;margin-top:.15rem;">Kategori: <strong>'+Object.keys(katSet).join(' | ')+'</strong></div>'
    +'</div>';

  // Guru (gaya pengesahan — list dengan border-left merah)
  if(guruArr.length){
    h+='<div style="margin-bottom:.8rem;">'
      +'<div style="font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:800;color:#555;margin-bottom:.4rem;border-left:3px solid #c0392b;padding-left:.5rem;">GURU PENGIRING</div>';
    guruArr.forEach(function(g){
      h+='<div style="display:flex;align-items:center;gap:.5rem;padding:.28rem .5rem;border-bottom:1px dashed #eee;font-size:.73rem;">'
        +'<span>👨‍🏫</span><strong>'+esc(g.nama)+'</strong>'
        +(g.jan?'<span style="color:#888;font-size:.65rem;">'+esc(g.jan)+'</span>':'')
        +(g.kp?'<span style="color:#aaa;font-size:.63rem;">'+esc(g.kp)+'</span>':'')
        +(g.tel?'<span style="color:#888;font-size:.65rem;margin-left:auto;">'+esc(g.tel)+'</span>':'')
        +'</div>';
    });
    h+='</div>';
  }

  // Peserta per kategori (sama persis dengan semakPeny)
  katOrder.forEach(function(kat){
    var list=pesByKat[kat];
    if(!list||!list.length) return;
    var c=colors[kat]||'#555';
    var isGrp=kat.indexOf('BERKUMPULAN')>=0;
    var isAll=kat==='KESELURUHAN';
    h+='<div style="margin-bottom:.8rem;border:1.5px solid '+c+';border-radius:8px;overflow:hidden;">'
      +'<div style="background:'+c+';color:#fff;padding:.38rem .7rem;font-family:Montserrat,sans-serif;font-size:.72rem;font-weight:900;">'+esc(kat)+' &nbsp;('+list.length+' peserta)</div>';
    if(isGrp){
      h+='<div style="padding:.3rem .7rem;font-size:.65rem;color:#666;background:#f0fff4;border-bottom:1px solid #c8f0d8;">&#8505; Ahli kumpulan yang turut serta dalam kategori ini</div>';
    }
    if(isAll){
      h+='<div style="padding:.3rem .7rem;font-size:.65rem;color:#666;background:#fff8f0;border-bottom:1px solid #fde8cc;">&#8505; Semua peserta yang mewakili sekolah</div>';
    }
    list.forEach(function(p,i){
      h+='<div style="display:flex;align-items:center;gap:.5rem;padding:.28rem .7rem;border-bottom:1px dashed #eee;font-size:.73rem;background:'+(i%2===0?'#fff':'#fafafa')+'">'
        +'<span style="font-family:Montserrat,sans-serif;font-size:.6rem;font-weight:800;color:'+c+';min-width:18px;">'+(i+1)+'</span>'
        +'<span style="font-size:.8rem;">'+(p.jan==='PEREMPUAN'?'👧':'👦')+'</span>'
        +'<strong style="flex:1;">'+esc(p.nama)+'</strong>'
        +(p.kp?'<span style="font-size:.63rem;color:#aaa;">'+esc(p.kp)+'</span>':'')
        +(p.jan?'<span style="font-size:.65rem;color:#888;">'+esc(p.jan)+'</span>':'')
        +(p.bangsa?'<span style="font-size:.65rem;color:#888;">'+esc(p.bangsa)+'</span>':'')
        +'</div>';
    });
    h+='</div>';
  });

  // Footer
  h+='<div style="margin-top:.75rem;padding-top:.5rem;border-top:.5pt solid #eee;'
    +'display:flex;justify-content:space-between;font-size:.62rem;color:#aaa;">'
    +'<span>UPBM SUBIS - Salinan Penyertaan</span>'
    +'<span>'+esc(nmSek)+'</span></div>';

  h+='</div>';

  // Bina versi print — tambah header SALINAN PENYERTAAN di bahagian atas
  var printHeader='<div style="background:#BF3829;color:#fff;padding:10pt 14pt 8pt;margin-bottom:0;">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;">'
    +'<span style="font-family:Montserrat,sans-serif;font-size:15pt;font-weight:900;letter-spacing:.3pt;">SALINAN PENYERTAAN</span>'
    +'<span style="font-size:8pt;opacity:.85;">'+esc(tarikh)+'</span>'
    +'</div></div>'
    +'<div style="background:#8B1A12;padding:2pt 14pt;margin-bottom:10pt;">'
    +'<span style="font-size:7pt;color:rgba(255,255,255,.75);">UPBM SUBIS</span></div>';

  // Tukar unit rem kepada pt untuk print, dan buang padding luar (pakai header)
  var hp=h
    .replace('<div style="text-align:right;font-size:.68rem;color:#888;margin-bottom:.5rem;">'+esc(tarikh)+'</div>','')
    .replace(/\.85rem/g,'9pt').replace(/\.82rem/g,'9pt').replace(/\.8rem/g,'8.5pt')
    .replace(/\.75rem/g,'8pt').replace(/\.73rem/g,'8pt').replace(/\.72rem/g,'7.5pt')
    .replace(/\.7rem/g,'7.5pt').replace(/\.68rem/g,'7pt').replace(/\.65rem/g,'7pt')
    .replace(/\.63rem/g,'6.5pt').replace(/\.62rem/g,'6.5pt').replace(/\.6rem/g,'6pt');
  hp=printHeader+hp;

  document.getElementById('salinan-body').innerHTML=h;
  document.getElementById('salinan-print-portal').innerHTML=hp;
}

function cetakSalinan(){
  // Sembunyikan portal lain supaya tidak ikut cetak
  var pp=document.getElementById('print-portal');
  var ps=document.getElementById('sdet-print-portal');
  var ppOld=pp?pp.style.display:'';
  var psOld=ps?ps.style.display:'';
  if(pp) pp.style.display='none';
  if(ps) ps.style.display='none';
  // Paparkan hanya salinan portal
  var p=document.getElementById('salinan-print-portal');
  p.style.display='block';
  try{
    // window.print() disekat secara senyap dalam sesetengah konteks iframe
    // bersarang (cth: app di-embed dalam Google Sites tanpa allow-modals).
    // Bungkus dengan try/catch supaya kegagalan itu KELIHATAN, bukan senyap.
    window.print();
  }catch(e){
    console.warn('cetakSalinan: window.print() gagal —', e);
    toast('Cetak/Simpan PDF tidak disokong dalam paparan ini (cth: dibuka melalui Google Sites). Sila guna butang "MUAT TURUN PDF" atau buka aplikasi ini melalui pautan terus.','er');
  }finally{
    p.style.display='none';
    // Pulihkan portal lain
    if(pp) pp.style.display=ppOld;
    if(ps) ps.style.display=psOld;
  }
}

// Alternatif "CETAK / SIMPAN PDF" — jana PDF sebenar & muat turun terus (Blob + <a download>).
// Tidak bergantung pada window.print(), jadi ia tetap berfungsi walaupun app di-embed
// dalam iframe bersarang (Google Sites) yang menyekat modal/print browser.
function muatTurunSalinan(){
  if(!_salinanPayload || !_salinanRows){
    toast('Tiada data penyertaan untuk dimuat turun. Sila hantar semula penyertaan.','er');
    return;
  }
  janaPdfSalinanPenyertaan(_salinanPayload, _salinanRows);
}
// =======================================================

// Tunjuk/sorok butang "Batal Kemaskini" ikut status isEdit semasa
function _syncBatalBtn(){
  var b = document.getElementById('btn-batal-kemaskini');
  if(b) b.style.display = isEdit ? 'inline-block' : 'none';
}

// Batal kemaskini — kembali ke keadaan asal (pilih sekolah semula), buang draf berubah
function batalKemaskiniPeny(){
  askConfirm('✕ BATAL KEMASKINI','Apa-apa perubahan yang belum dihantar akan hilang. Teruskan batal?',function(){
    var simpanSelId=selId, simpanSelNm=selNm;
    resetPeny();
    toast('Kemaskini dibatalkan.','in');
    // Kembali ke senarai pilih sekolah bagi program yang sama (bukan terus ke senarai program)
    if(simpanSelId){ pilihProg(simpanSelId, simpanSelNm); }
  });
}

function resetPeny(){
  selId='';selNm='';isEdit=false;editKod='';
  _syncBatalBtn();
  _penyData={guruList:[],pesList:[]};_pGCnt=0;_pPCnt=0;_selKatList=[];
  _stopPenyAutoSave();
  ['daf-sek','daf-kod'].forEach(function(id){var el=document.getElementById(id);if(el)el.value='';});
  var dsSel=document.getElementById('daf-sek-select');if(dsSel)dsSel.value='';
  var dsSrch=document.getElementById('daf-sek-search');if(dsSrch)dsSrch.value='';
  var dsNm=document.getElementById('daf-nmsek');if(dsNm)dsNm.value='';
  window._pendingDraft=null; // P11
  var ks=document.getElementById('kod-stat');if(ks)ks.innerHTML='';
  document.getElementById('sel-info').style.display='none';
  document.getElementById('sel-edit-info').style.display='none';
  document.getElementById('sbox-sekolah').style.display='none';
  document.getElementById('peny-form-wrap').style.display='none';
  document.getElementById('main-guru-list').innerHTML='';
  document.getElementById('main-pes-list').innerHTML='';
  document.querySelectorAll('.psc').forEach(function(c){c.classList.remove('on');});
  loadProgsForPeny(true);
}

function onKodIn(){
  try{
  var kod=document.getElementById('daf-kod').value.trim();
  var el=document.getElementById('kod-stat');
  if(!kod){el.innerHTML='';return;}
  // Auto-fill nama sekolah dari senarai statik jika belum diisi
  var sekEl=document.getElementById('daf-sek');
  if(sekEl && !sekEl.value.trim()){
    var autoNama=_getNamaSekolahByKod(kod);
    if(autoNama) sekEl.value=autoNama;
  }
  var _prefillCalled=false;
  if(kod===ADMIN){el.innerHTML='<div class="iok">\uD83D\uDD11 PIN Admin \u2014 akses penuh. Borang dibuka.</div>';}
  else if(!selId){
    var namaSek=sekEl?sekEl.value.trim():'';
    if(namaSek){
      el.innerHTML='<div class="iok">\u2705 Kod diterima: <strong>'+namaSek+'</strong>. Pilih program di atas untuk teruskan.</div>';
    } else {
      el.innerHTML='<div class="iok">\uD83D\uDD11 Kod diterima. Pilih program di atas untuk teruskan.</div>';
    }
    return;
  }
  else if(selId&&_aP.length){
    var ex=_aP.filter(function(p){return p['Program ID']===selId&&String(p['Kod Sekolah']||'').toUpperCase()===kod.toUpperCase();});
    if(ex.length){
      var sk=ex[0]['Nama Sekolah']||'';
      var eksKat=_uniq(ex.map(function(r){return r['Kategori Penyertaan']||'';})).filter(Boolean);
      el.innerHTML='<div class="iwarn">\u26A0 Mod kemaskini aktif \u2014 penyertaan sedia ada bagi <strong>'+eksKat.join(', ')+'</strong> akan digantikan. Semak semula data sebelum hantar.</div>';
      document.getElementById('daf-sek').value=sk;
      document.getElementById('sel-edit-info').style.display='flex';
      isEdit=true; editKod=kod.toUpperCase();
      _syncBatalBtn();
      _checkKatMismatch(selId, ex);
      _prefillFromExisting(ex);
      _prefillCalled=true;
    } else {
      el.innerHTML='<div class="iok">\u2705 Kod sah \u2014 pendaftaran baharu. Borang dibuka.</div>';
      isEdit=false; editKod='';
      _syncBatalBtn();
      document.getElementById('sel-edit-info').style.display='none';
    }
  } else if(selId&&!_aP.length){
    el.innerHTML='<div class="iok">\u2705 Kod diterima. Borang dibuka.</div>';
  }
  if(!_prefillCalled) _showPenyForm();
  // Sembunyikan butang manual selepas borang berjaya dibuka
  var manWrap=document.getElementById('kod-manual-wrap');
  if(manWrap) manWrap.style.display='none';
  }catch(err){
    console.error('onKodIn error:',err);
    // Fallback — cuba buka borang walaupun ada error
    try{
      var wrap=document.getElementById('peny-form-wrap');
      if(wrap) wrap.style.display='block';
      toast('Borang dibuka (ralat: '+err.message+')','er');
    }catch(e2){}
  }
}

function _showPenyForm(){
  var wrap=document.getElementById('peny-form-wrap');
  wrap.style.display='block';
  _buildKatLegend();
  if(!_penyData.guruList.length) addMainGuru();
  if(!_penyData.pesList.length) addMainPes();
  // Tunjuk mesej status
  var el=document.getElementById('kod-stat');
  if(el&&!el.innerHTML.trim()){
    el.innerHTML='<div class="iok">✅ Borang dibuka — isi maklumat guru dan peserta.</div>';
  }
}

function _prefillFromExisting(rows){
  _penyData={guruList:[],pesList:[]};_pGCnt=0;_pPCnt=0;
  // Gunakan objek BERASINGAN untuk guru dan peserta
  // JANGAN simpan _id terus pada r kerana uG[gk] dan uP[pk] mungkin rujuk objek r yang sama
  var uG={}, uP={}, uGid={}, uPid={}, uPkat={}, _pIdx=0;
  rows.forEach(function(r){
    var gk=r['No KP Guru']||r['Nama Guru'];
    if(gk&&!uG[gk]){uG[gk]=r;_pGCnt++;uGid[gk]='mg-'+_pGCnt;}
    var pk=String(r['No KP Peserta']||'').trim()||String(r['Nama Peserta']||'').trim();
    if(!pk){pk='_row_'+(++_pIdx);}
    if(!uP[pk]){uP[pk]=r;_pPCnt++;uPid[pk]='mp-'+_pPCnt;uPkat[pk]=[];}
    if(uP[pk]){var k=r['Kategori Penyertaan']||'';if(k&&uPkat[pk].indexOf(k)<0)uPkat[pk].push(k);}
  });
  // Bina guruList — guna uGid[gk] bukan r._id
  Object.keys(uG).forEach(function(gk){
    var r=uG[gk];
    _penyData.guruList.push({id:uGid[gk],nama:r['Nama Guru']||'',kp:r['No KP Guru']||'',bangsa:r['Bangsa Guru']||'',jantina:r['Jantina Guru']||'',tel:r['No Tel Guru']||''});
  });
  // Bina pesList — guna uPid[pk] dan uPkat[pk] bukan r._id/_kat
  Object.keys(uP).forEach(function(pk){
    var r=uP[pk];
    // Paksa eksklusif: jika program TERBUKA (Individu atau Berkumpulan), peserta hanya boleh kategori TERBUKA
    var _progIsTerbuka=_selKatList.every(function(k){return k==='TERBUKA INDIVIDU'||k==='TERBUKA BERKUMPULAN'||k==='TERBUKA';});
    var _progKatSet=_selKatList.filter(function(k){return k!=='KESELURUHAN';});
    var kat=uPkat[pk].filter(function(k){
      if(!k||k==='GURU') return false;
      // Jika program ada kategori, tapis kepada kategori program sahaja
      if(_progKatSet.length) return _progKatSet.indexOf(k)>=0;
      return true;
    });
    if(!kat.length&&!String(r['Nama Peserta']||'').trim())return; // skip rekod guru tambahan
    _penyData.pesList.push({id:uPid[pk],nama:r['Nama Peserta']||'',kp:r['No KP Peserta']||'',jantina:r['Jantina Peserta']||'',bangsa:r['Bangsa Peserta']||'',kategori:kat});
  });
  _showPenyForm();
  setTimeout(function(){renderMainGuruList();renderMainPesList();},100);
}

