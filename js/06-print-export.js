// == PRINT PORTAL =============================================
// Builds a hidden, flat DOM outside the modal that print CSS reveals
function buildPrintPortal(prog,pny,pnc,isTutup,nSek,nG,nPs,per,printDate){
  // Semua rekod program dimasukkan (tiada filter kategori)
  var P={
    page    :'font-family:Open Sans,sans-serif;font-size:10pt;color:#111;',
    red     :'color:#c0392b;',
    secTitle:'font-family:Montserrat,sans-serif;font-size:10pt;font-weight:900;color:#c0392b;border-left:3pt solid #c0392b;padding:1pt 0 1pt 7pt;margin:11pt 0 5pt;text-transform:uppercase;display:block;',
    row     :'display:flex;border-bottom:0.4pt solid #eee;padding:3pt 0;font-size:9pt;',
    key     :'color:#777;min-width:105pt;font-weight:600;flex-shrink:0;',
    val     :'color:#111;font-weight:700;',
    dBox    :'border:0.5pt solid #ddd;border-radius:3pt;padding:6pt;background:#fff;break-inside:avoid;',
    dBoxFull:'border:0.5pt solid #ddd;border-radius:3pt;padding:6pt;background:#fff;break-inside:avoid;',
    dh4     :'font-family:Montserrat,sans-serif;font-size:7.5pt;font-weight:800;text-transform:uppercase;color:#555;margin:0 0 4pt;display:block;',
    di      :'display:flex;justify-content:space-between;font-size:8.5pt;padding:1.5pt 0;border-bottom:0.3pt solid #f0f0f0;',
    diV     :'font-weight:700;color:#c0392b;',
    sekBlock:'border:0.5pt solid #ddd;border-radius:3pt;padding:7pt;margin-bottom:7pt;break-inside:avoid;',
    sekName :'font-family:Montserrat,sans-serif;font-size:8.5pt;font-weight:800;color:#343a40;margin-bottom:5pt;padding-bottom:3pt;border-bottom:0.5pt solid #eee;display:block;'
  };
  function rowHtml(k,v){return '<div style="'+P.row+'"><span style="'+P.key+'">'+k+'</span><span style="'+P.val+'">'+v+'</span></div>';}
  function secT(t){return '<div style="'+P.secTitle+'">'+t+'</div>';}
  function dBoxHtml(tit,counts,full){
    var en=Object.entries(counts).filter(function(e){return e[0]&&e[0]!=='—';});
    if(!en.length)return '<div style="'+(full?P.dBoxFull:P.dBox)+'"><span style="'+P.dh4+'">'+tit+'</span><span style="font-size:7.5pt;color:#aaa;">—</span></div>';
    return '<div style="'+(full?P.dBoxFull:P.dBox)+'"><span style="'+P.dh4+'">'+tit+'</span>'+en.map(function(e){return '<div style="'+P.di+'"><span>'+e[0]+'</span><span style="'+P.diV+'">'+e[1]+'</span></div>';}).join('')+'</div>';
  }
  function bjTable(tit,rows2,bKey,jKey){
    var bt={};
    rows2.forEach(function(r){var b=r[bKey]||'LAIN-LAIN',j=r[jKey]||'—';if(!bt[b])bt[b]={};bt[b][j]=(bt[b][j]||0)+1;});
    var keys=Object.keys(bt);
    if(!keys.length)return '<div style="'+P.dBoxFull+'"><span style="'+P.dh4+'">'+tit+'</span><span style="font-size:7.5pt;color:#aaa;">—</span></div>';
    var jList=['LELAKI','PEREMPUAN'];
    Object.values(bt).forEach(function(o){Object.keys(o).forEach(function(j){if(jList.indexOf(j)<0)jList.push(j);});});
    var tot={grand:0};jList.forEach(function(j){tot[j]=0;});
    var thSt='background:#c0392b;color:#fff;padding:3pt 5pt;font-size:7pt;font-weight:700;text-transform:uppercase;border:0.3pt solid #a93226;';
    var tdSt='padding:2.5pt 5pt;font-size:8pt;border:0.3pt solid #eee;text-align:center;';
    var tdLSt='padding:2.5pt 5pt;font-size:8pt;border:0.3pt solid #eee;font-weight:700;';
    var tfSt='padding:2.5pt 5pt;font-size:8pt;border:0.3pt solid #ddd;font-weight:800;background:#fdf2f2;text-align:center;';
    var thead='<thead><tr><th style="'+thSt+'text-align:left;">Bangsa</th>'+jList.map(function(j){return '<th style="'+thSt+'">'+j+'</th>';}).join('')+'<th style="'+thSt+'">JML</th></tr></thead>';
    var tbody='<tbody>'+keys.sort().map(function(b){var rt=0;var cells=jList.map(function(j){var v=bt[b][j]||0;rt+=v;tot[j]+=v;tot.grand+=v;return '<td style="'+tdSt+'">'+(v||'—')+'</td>';}).join('');return '<tr><td style="'+tdLSt+'">'+b+'</td>'+cells+'<td style="'+tdSt+'font-weight:800;color:#c0392b;">'+rt+'</td></tr>';}).join('')+'</tbody>';
    var tfoot='<tfoot><tr><td style="'+tfSt+'text-align:left;">JUMLAH</td>'+jList.map(function(j){return '<td style="'+tfSt+'">'+(tot[j]||'—')+'</td>';}).join('')+'<td style="'+tfSt+'color:#c0392b;font-size:9pt;">'+tot.grand+'</td></tr></tfoot>';
    return '<div style="'+P.dBoxFull+'"><span style="'+P.dh4+'">'+tit+'</span><div style="overflow:visible;"><table style="width:100%;border-collapse:collapse;font-size:8pt;">'+thead+tbody+tfoot+'</table></div></div>';
  }

  var out='';

  // == HEADER ==
  out+='<div style="text-align:center;padding-bottom:10pt;margin-bottom:12pt;border-bottom:2pt solid #c0392b;">'
    +'<div style="margin-bottom:6pt;"><img src="'+LOGO_FULL+'" alt="Logo" style="max-height:64px;max-width:200px;object-fit:contain;"></div>'
    +'<div style="font-family:Montserrat,sans-serif;font-size:15pt;font-weight:900;color:#c0392b;margin:0 0 3pt;">'+prog['Nama Program']+'</div>'
    +'<div style="font-size:9pt;color:#444;margin:2pt 0;">'+prog['Pengelola']+' &nbsp;|&nbsp; '+prog['Bidang']+' &nbsp;|&nbsp; '+(prog['Kategori']||'INDIVIDU')+'</div>'
    +'<div style="font-size:9pt;color:#444;margin:2pt 0;">Peringkat: <strong>'+prog['Peringkat']+'</strong> &nbsp;|&nbsp; Status: <strong>'+prog['Status']+'</strong></div>'
    +'<div style="font-size:8pt;color:#999;margin-top:5pt;">Dicetak pada: '+printDate+'</div>'
    +'</div>';

  // == 1. MAKLUMAT ==
  out+=secT('1. Maklumat Program');
  [['Nama Program',prog['Nama Program']],['Pengelola',prog['Pengelola']],['Bidang',prog['Bidang']],['Kategori',prog['Kategori']||'INDIVIDU'],['Peringkat',prog['Peringkat']],['Tarikh',fd(prog['Tarikh'])],['Tempat',prog['Tempat']],['Status',prog['Status']]]
  .forEach(function(r){out+=rowHtml(r[0],r[1]);});

  // == 2. STATISTIK ==
  out+=secT('2. Statistik Penyertaan');
  // Kira peserta per kategori (unik) — lebih bermakna dari jumlah rekod mentah
  var katStats={};
  pny.forEach(function(r){
    var k=r['Kategori Penyertaan']||'';
    if(k==='GURU'||!k)return; // skip rekod guru-sahaja
    if(!katStats[k])katStats[k]=new Set();
    if(r['Nama Peserta'])katStats[k].add(r['No KP Peserta']||r['Nama Peserta']);
  });
  var nKat=Object.keys(katStats).filter(function(k){return k!=='KESELURUHAN';}).length;
  // Jumlah rekod peserta sahaja (tanpa rekod guru-sahaja)
  var nRekodPes = pny.filter(function(r){var k=r['Kategori Penyertaan']||'';return k&&k!=='GURU';}).length;
  out+='<div style="display:table;width:100%;border-collapse:separate;border-spacing:5pt;margin-bottom:4pt;">'
    +'<div style="display:table-row;">'
    +[['Sekolah',nSek],['Guru (unik)',nG],['Peserta (unik)',nPs],['Kategori',nKat]].map(function(x){
      return '<div style="display:table-cell;border:0.5pt solid #e0e0e0;border-radius:3pt;padding:6pt 8pt;text-align:center;width:25%;">'
        +'<div style="font-family:Montserrat,sans-serif;font-size:16pt;font-weight:900;color:#c0392b;line-height:1;">'+x[1]+'</div>'
        +'<div style="font-size:7.5pt;color:#888;text-transform:uppercase;margin-top:2pt;">'+x[0]+'</div>'
        +'</div>';
    }).join('')+'</div></div>';

    // === PAGE BREAK — DEMOGRAFI ===
  out+='<div style="page-break-before:always;"></div>';
  var demoSecN=pnc.length?'3':'3';
  out+=secT(demoSecN+'. Analisis Demografi Keseluruhan');
  out+='<table style="width:100%;border-collapse:separate;border-spacing:5pt;margin-bottom:6pt;">'
    +'<tr>'
    +'<td style="width:50%;vertical-align:top;">'+dBoxHtml('Jantina Guru',cntBy(uniqGuru(pny),'Jantina Guru'),false)+'</td>'
    +'<td style="width:50%;vertical-align:top;">'+dBoxHtml('Jantina Peserta',cntBy(uniqPes(pny),'Jantina Peserta'),false)+'</td>'
    +'</tr></table>';
  out+=bjTable('Bangsa & Jantina — Guru',uniqGuru(pny),'Bangsa Guru','Jantina Guru');
  out+='<div style="margin-top:5pt;"></div>';
  out+=bjTable('Bangsa & Jantina — Peserta',uniqPes(pny),'Bangsa Peserta','Jantina Peserta');

  var uSekKeys=Object.keys(cntBy(pny,'Nama Sekolah')).filter(function(k){return k&&k!=='—';});
  if(uSekKeys.length){
    var dSekN=pnc.length?'4':'4';
    out+=secT(dSekN+'. Demografi Mengikut Sekolah');
    uSekKeys.forEach(function(sk){
      var sp=pny.filter(function(p){return p['Nama Sekolah']===sk;});
      out+='<div style="'+P.sekBlock+'">'
        +'<span style="'+P.sekName+'">'+sk+'</span>'
        +'<table style="width:100%;border-collapse:separate;border-spacing:5pt;margin-bottom:4pt;">'
        +'<tr>'
        +'<td style="width:50%;vertical-align:top;">'+dBoxHtml('Jantina Guru',cntBy(uniqGuru(sp),'Jantina Guru'),false)+'</td>'
        +'<td style="width:50%;vertical-align:top;">'+dBoxHtml('Jantina Peserta',cntBy(uniqPes(sp),'Jantina Peserta'),false)+'</td>'
        +'</tr></table>'
        +bjTable('Bangsa & Jantina — Guru',uniqGuru(sp),'Bangsa Guru','Jantina Guru')
        +'<div style="margin-top:5pt;"></div>'
        +bjTable('Bangsa & Jantina — Peserta',uniqPes(sp),'Bangsa Peserta','Jantina Peserta')
        +'</div>';
    });
  }

  // === PAGE BREAK → PENCAPAIAN VISUAL ===
  if(pnc.length){
    out+='<div style="page-break-before:always;"></div>';
    var lastN=(uSekKeys.length?'5':'4');
    out+=secT(lastN+'. Pencapaian Program — Papan Podium');

    // Group pnc by peringkat
    // Group by peringkat+kategori untuk podium
    var pncByPerKat={};
    pnc.forEach(function(e){
      var p2=(e['Peringkat']||'SEKOLAH').toUpperCase();
      var k2=(e['Kategori']||'UMUM').toUpperCase();
      var key=p2+'||'+k2;
      if(!pncByPerKat[key])pncByPerKat[key]=[];pncByPerKat[key].push(e);
    });
    var _katOrd=['INDIVIDU LELAKI','INDIVIDU PEREMPUAN','BERKUMPULAN LELAKI','BERKUMPULAN PEREMPUAN','KESELURUHAN'];
    var _perListP=[];
    Object.keys(pncByPerKat).forEach(function(k){var p2=k.split('||')[0];if(_perListP.indexOf(p2)<0)_perListP.push(p2);});
    _perListP.sort(function(a,b){return (PER_ORDER.indexOf(a)+1||99)-(PER_ORDER.indexOf(b)+1||99);});
    var orderedPers=_perListP;

    orderedPers.forEach(function(p2){
      // Get all kategori for this peringkat
      var katsP=_katOrd.concat(Object.keys(pncByPerKat).map(function(k){return k.split('||')[1];}).filter(function(k){return _katOrd.indexOf(k)<0;})).filter(function(k,i,a){return a.indexOf(k)===i;});
      katsP.forEach(function(k2){
        var key=p2+'||'+k2;
        if(!pncByPerKat[key]||!pncByPerKat[key].length)return;
        var entries=pncByPerKat[key];
        // Header: peringkat + kategori
        out+='<div style="font-size:8pt;font-weight:800;text-transform:uppercase;color:#c0392b;'+
             'background:linear-gradient(90deg,#fdf2f2,#fff);padding:4pt 10pt;'+
             'border-left:3pt solid #c0392b;border-radius:0 3pt 3pt 0;margin-bottom:4pt;">'+p2+' — '+k2+'</div>';
      // Build byTempat map
      var byT={};
      entries.forEach(function(e){
        var tk=(e['Tempat']||'').toUpperCase();
        if(!byT[tk])byT[tk]=[];
        if(!byT[tk].some(function(x){return x['Nama Sekolah']===e['Nama Sekolah'];}))byT[tk].push(e);
      });

      // Peringkat pill
      out+='<div style="font-size:8pt;font-weight:800;text-transform:uppercase;color:#c0392b;'+
           'background:linear-gradient(90deg,#fdf2f2,#fff);padding:4pt 10pt;'+
           'border-left:3pt solid #c0392b;border-radius:0 3pt 3pt 0;margin-bottom:8pt;">'+p2+'</div>';

      // == PODIUM VISUAL (table-based for print) ==
      var SLOTS=[
        {tk:'TEMPAT KEDUA',  medal:'🥈', bg:'#6c757d', ht:'55pt'},
        {tk:'TEMPAT PERTAMA',medal:'🥇', bg:'#c0392b', ht:'80pt'},
        {tk:'TEMPAT KETIGA', medal:'🥉', bg:'#b7860b', ht:'40pt'}
      ];
      var hasPodium=SLOTS.some(function(s){return byT[s.tk]&&byT[s.tk].length;});

      if(hasPodium){
        out+='<table style="width:100%;border-collapse:separate;border-spacing:4pt;margin-bottom:10pt;">'
          +'<tr style="vertical-align:bottom;">';
        SLOTS.forEach(function(slot){
          var e2=(byT[slot.tk]||[])[0];
          var pts=mPts(p2,slot.tk);
          out+='<td style="width:33%;text-align:center;vertical-align:bottom;">'
            // Medal column block
            +'<div style="background:'+slot.bg+';height:'+slot.ht+';border-radius:6pt 6pt 0 0;'+
               'display:flex;align-items:center;justify-content:center;'+
               'font-size:18pt;color:#fff;font-weight:900;">'+slot.medal+'</div>'
            // Info base
            +'<div style="background:#fdf2f2;border:0.5pt solid #e8b4b4;border-top:none;'+
               'border-radius:0 0 6pt 6pt;padding:5pt 4pt;">'
            +'<div style="font-size:7.5pt;font-weight:800;text-transform:uppercase;color:'+slot.bg+';margin-bottom:2pt;">'+
               slot.tk.replace('TEMPAT ','')+'</div>';
          if(e2){
            out+='<div style="font-family:Montserrat,sans-serif;font-size:8pt;font-weight:900;color:#1a1a2e;line-height:1.2;word-break:break-word;">'+(e2['Nama Sekolah']||'—')+'</div>';
            if(e2['Nama Peserta'])out+='<div style="font-size:7pt;color:#555;margin-top:1pt;">'+e2['Nama Peserta']+'</div>';
            if(e2['Nama Guru'])out+='<div style="font-size:7pt;color:#888;margin-top:1pt;">'+e2['Nama Guru']+'</div>';
            out+='<div style="font-family:Montserrat,sans-serif;font-size:9pt;font-weight:900;color:#c0392b;margin-top:3pt;">+'+pts+' mata</div>';
          }else{
            out+='<div style="font-size:8pt;color:#ccc;">—</div>';
          }
          out+='</div></td>';
        });
        out+='</tr></table>';
      }

      // == OTHER PLACES (KEEMPAT, KELIMA) ==
      var otherSlots=['TEMPAT KEEMPAT','TEMPAT KELIMA'];
      var hasOther=otherSlots.some(function(tk){return byT[tk]&&byT[tk].length;});
      if(!hasPodium){
        Object.keys(byT).forEach(function(tk){if(otherSlots.indexOf(tk)<0)otherSlots.push(tk);});
        hasOther=Object.keys(byT).some(function(tk){return byT[tk]&&byT[tk].length;});
      }
      if(hasOther){
        out+='<table style="width:100%;border-collapse:collapse;margin-bottom:10pt;font-size:8.5pt;">'
          +'<thead><tr>'
          +'<th style="background:#495057;color:#fff;padding:3pt 6pt;text-align:left;font-size:7.5pt;font-weight:700;">Tempat</th>'
          +'<th style="background:#495057;color:#fff;padding:3pt 6pt;text-align:left;font-size:7.5pt;font-weight:700;">Sekolah</th>'
          +'<th style="background:#495057;color:#fff;padding:3pt 6pt;text-align:left;font-size:7.5pt;font-weight:700;">Peserta / Guru</th>'
          +'<th style="background:#495057;color:#fff;padding:3pt 6pt;text-align:center;font-size:7.5pt;font-weight:700;">Mata</th>'
          +'</tr></thead><tbody>';
        var ri2=0;
        otherSlots.forEach(function(tk){
          (byT[tk]||[]).forEach(function(e2){
            out+='<tr style="background:'+(ri2%2===0?'#fff':'#f8f9fa')+'">'
              +'<td style="padding:2.5pt 6pt;border:0.3pt solid #eee;font-weight:700;color:#495057;">'+tk+'</td>'
              +'<td style="padding:2.5pt 6pt;border:0.3pt solid #eee;font-weight:700;">'+(e2['Nama Sekolah']||'—')+'</td>'
              +'<td style="padding:2.5pt 6pt;border:0.3pt solid #eee;color:#555;">'+(e2['Nama Peserta']||'')+(e2['Nama Guru']?' &bull; '+e2['Nama Guru']:'')+'</td>'
              +'<td style="padding:2.5pt 6pt;border:0.3pt solid #eee;text-align:center;font-weight:900;color:#c0392b;">'+mPts(p2,tk)+'</td>'
              +'</tr>';
            ri2++;
          });
        });
        out+='</tbody></table>';
      }
      }); // end katsP
    }); // end orderedPers

    // == JADUAL RINGKAS PENCAPAIAN (Tempat, Sekolah, Mata) — di bawah podium ==
    out += '<div style="margin-top:12pt;">';
    out += secT('Senarai Lengkap Pencapaian');
    var thSp='background:#c0392b;color:#fff;padding:3.5pt 7pt;font-size:7.5pt;font-weight:700;border:0.3pt solid #a93226;text-align:left;';
    var tdSp='padding:3pt 7pt;font-size:8.5pt;border:0.3pt solid #eee;vertical-align:middle;';
    // Group by peringkat → kategori
    var _pncByPer2={};
    pnc.forEach(function(e){
      var p2=(e['Peringkat']||'SEKOLAH').toUpperCase();
      var kat2=(e['Kategori']||'UMUM').toUpperCase();
      var key=p2+'||'+kat2;
      if(!_pncByPer2[key])_pncByPer2[key]=[];
      _pncByPer2[key].push(e);
    });
    // Build ordered key list: peringkat order, then kategori order
    var _katOrder=['INDIVIDU LELAKI','INDIVIDU PEREMPUAN','BERKUMPULAN LELAKI','BERKUMPULAN PEREMPUAN','KESELURUHAN'];
    var _perList=[];
    Object.keys(_pncByPer2).forEach(function(k){var p2=k.split('||')[0];if(_perList.indexOf(p2)<0)_perList.push(p2);});
    _perList.sort(function(a,b){return (PER_ORDER.indexOf(a)+1||99)-(PER_ORDER.indexOf(b)+1||99);});
    _perList.forEach(function(p2){
      out+='<div style="font-size:7.5pt;font-weight:800;text-transform:uppercase;color:#c0392b;'
         + 'background:#fdf2f2;padding:3pt 7pt;border-left:3pt solid #c0392b;margin-bottom:3pt;">'+p2+'</div>';
      var katsForPer=_katOrder.concat(Object.keys(_pncByPer2).map(function(k){return k.split('||')[1];}).filter(function(k){return _katOrder.indexOf(k)<0;}));
      katsForPer=katsForPer.filter(function(k,i,a){return a.indexOf(k)===i;});
      katsForPer.forEach(function(kat2){
        var key=p2+'||'+kat2;
        if(!_pncByPer2[key]||!_pncByPer2[key].length)return;
        out+='<div style="font-size:7pt;font-weight:800;color:#666;background:#f0f0f0;padding:2pt 7pt;margin-bottom:2pt;border-radius:3pt;">'+kat2+'</div>';
        out+='<table style="width:100%;border-collapse:collapse;margin-bottom:6pt;">'
           + '<thead><tr>'
           + '<th style="'+thSp+'width:38%;">Tempat</th>'
           + '<th style="'+thSp+'">Sekolah</th>'
           + '<th style="'+thSp+'width:12%;text-align:center;">Mata</th>'
           + '</tr></thead><tbody>';
        var ri3=0;
        TPT_STANDARD.forEach(function(t){
          var seen3={};
          _pncByPer2[key].filter(function(e){
            if((e['Tempat']||'').toUpperCase()!==t.l)return false;
            var ky=(e['Nama Sekolah']||'')+'|'+t.l;
            if(seen3[ky])return false;seen3[ky]=1;return true;
          }).forEach(function(e){
            out+='<tr style="background:'+(ri3%2===0?'#fff':'#fdf2f2')+';">'
               + '<td style="'+tdSp+'font-weight:800;color:#c0392b;">'+t.l+'</td>'
               + '<td style="'+tdSp+'font-weight:700;">'+(e['Nama Sekolah']||'—')+'</td>'
               + '<td style="'+tdSp+'text-align:center;font-weight:900;color:#c0392b;font-size:9pt;">'+mPts(p2,t.l)+'</td>'
               + '</tr>';
            ri3++;
          });
        });
        out+='</tbody></table>';
      });
    });
    out += '</div>';

    // == PENYERTAAN SEKOLAH PERAIH TEMPAT ==
    out+='<div style="page-break-before:always;page-break-after:avoid;"></div>';
    out+=secT((Number(lastN)+1)+'. Salinan Penyertaan Sekolah Peraih Tempat');

    var sekPlace={};
    pnc.forEach(function(e){
      var sk=e['Nama Sekolah']||''; if(!sk)return;
      if(!sekPlace[sk])sekPlace[sk]={pnc:[],pny:[]};
      sekPlace[sk].pnc.push(e);
    });
    Object.keys(sekPlace).forEach(function(sk){
      sekPlace[sk].pny=pny.filter(function(p){return p['Nama Sekolah']===sk;});
    });

    Object.keys(sekPlace).forEach(function(sk){
      var info=sekPlace[sk];
      var uG2={},uP2={};
      info.pny.forEach(function(p){
        var gk=p['No KP Guru']||p['Nama Guru'];if(gk&&p['Nama Guru'])uG2[gk]=p;
        var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&p['Nama Peserta'])uP2[pk]=p;
      });
      var gList=Object.values(uG2), pList=Object.values(uP2);

      // Susun penyertaan sekolah ini per kategori
      var _sekPnyByKat={};
      info.pny.forEach(function(row){
        var k2=(row['Kategori Penyertaan']||'UMUM').toUpperCase();
        if(!_sekPnyByKat[k2])_sekPnyByKat[k2]=[];
        _sekPnyByKat[k2].push(row);
      });
      // Guna kategori dari program (prog['Kategori']) bukan hardcode
      var _progKats=(prog['Kategori']||'').split(',').map(function(k){return k.trim().toUpperCase();}).filter(Boolean);
      if(!_progKats.length) _progKats=['INDIVIDU LELAKI','INDIVIDU PEREMPUAN','BERKUMPULAN LELAKI','BERKUMPULAN PEREMPUAN','KESELURUHAN'];
      var _katsInSek=_progKats.concat(Object.keys(_sekPnyByKat).filter(function(k2){return _progKats.indexOf(k2)<0;}));
      _katsInSek=_katsInSek.filter(function(k2){return _sekPnyByKat[k2]&&_sekPnyByKat[k2].length;});

      out+='<div style="border:0.8pt solid #c0392b;border-radius:4pt;padding:9pt 10pt;margin-bottom:10pt;page-break-inside:avoid;">'
        +'<div style="font-family:Montserrat,sans-serif;font-size:10.5pt;font-weight:900;color:#c0392b;'
        +     'padding-bottom:5pt;border-bottom:0.5pt solid #fde8e8;margin-bottom:7pt;">🏫 '+sk+'</div>';

      // Pencapaian pill list
      out+='<div style="display:flex;flex-wrap:wrap;gap:4pt;margin-bottom:8pt;">';
      info.pnc.forEach(function(e){
        var tColor=((e['Tempat']||'').indexOf('PERTAMA')>-1)?'#c0392b':((e['Tempat']||'').indexOf('KEDUA')>-1)?'#6c757d':'#b7860b';
        out+='<div style="background:'+tColor+';color:#fff;border-radius:20pt;padding:2pt 8pt;font-size:7.5pt;font-weight:800;">'
          +(e['Tempat']||'')+' &bull; '+mPts((e['Peringkat']||per).toUpperCase(),e['Tempat']||'')+' mata'
          +'</div>';
      });
      out+='</div>';

      // Susun seperti borang pendaftaran: per kategori → setiap guru → peserta
      _katsInSek.forEach(function(k2kat){
        var katRows=_sekPnyByKat[k2kat]||[];
        if(!katRows.length)return;
        out+='<div style="font-family:Montserrat,sans-serif;font-size:8.5pt;font-weight:900;color:#fff;background:#c0392b;'+
             'padding:3pt 8pt;border-radius:3pt;margin-bottom:5pt;margin-top:8pt;">'+k2kat+'</div>';
        var guruMap = {}, guruOrder = [];
        katRows.forEach(function(row){
          var gk = row['No KP Guru'] || row['Nama Guru']; if(!gk) return;
          if(!guruMap[gk]){ guruMap[gk] = {info: row, peserta: {}}; guruOrder.push(gk); }
          var pk = row['No KP Peserta'] || row['Nama Peserta']; if(!pk) return;
          guruMap[gk].peserta[pk] = row;
        });

      var thSt3 = 'background:#c0392b;color:#fff;padding:3pt 6pt;font-size:7pt;font-weight:700;border:0.3pt solid #a93226;text-align:left;';
      var tdSt3 = 'padding:2.5pt 6pt;font-size:8pt;border:0.3pt solid #eee;vertical-align:top;';
      var tdNum = 'padding:2.5pt 6pt;font-size:8pt;border:0.3pt solid #eee;text-align:center;color:#888;';

      guruOrder.forEach(function(gk, gi){
        var g   = guruMap[gk];
        var gr  = g.info;
        var pList2 = Object.values(g.peserta);

        // Guru header bar
        out += '<div style="background:#c0392b;color:#fff;padding:3pt 7pt;font-size:8pt;font-weight:800;'
             + 'border-radius:3pt 3pt 0 0;margin-top:'+(gi>0?'8pt':'2pt')+';">'
             + '👨‍🏫 GURU #'+(gi+1)+': '+(gr['Nama Guru']||'—')
             + '</div>';

        // Guru info row
        out += '<table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:8pt;">'
             + '<tbody>';
        out += '<tr style="background:#fdf2f2;">'
             + '<td style="'+tdSt3+'width:25%;color:#777;font-weight:600;">No. KP</td>'
             + '<td style="'+tdSt3+'width:25%;">'+(gr['No KP Guru']||'—')+'</td>'
             + '<td style="'+tdSt3+'width:25%;color:#777;font-weight:600;">Jantina</td>'
             + '<td style="'+tdSt3+'width:25%;">'+(gr['Jantina Guru']||'—')+'</td>'
             + '</tr>';
        out += '<tr>'
             + '<td style="'+tdSt3+'color:#777;font-weight:600;">Bangsa</td>'
             + '<td style="'+tdSt3+'">'+(gr['Bangsa Guru']||'—')+'</td>'
             + '<td style="'+tdSt3+'color:#777;font-weight:600;">No. Tel</td>'
             + '<td style="'+tdSt3+'">'+_fmtTel60(gr['No Tel Guru'])+'</td>'
             + '</tr>';
        out += '</tbody></table>';

        // Peserta sub-table
        if(pList2.length){
          out += '<table style="width:100%;border-collapse:collapse;margin-bottom:0;font-size:8pt;">'
               + '<thead><tr>'
               + '<th style="'+thSt3+'width:6%;">#</th>'
               + '<th style="'+thSt3+'">Nama Peserta</th>'
               + '<th style="'+thSt3+'width:20%;">No. KP</th>'
               + '<th style="'+thSt3+'width:14%;">Jantina</th>'
               + '<th style="'+thSt3+'width:16%;">Bangsa</th>'
               + '</tr></thead><tbody>';
          pList2.forEach(function(ps, pi){
            out += '<tr style="background:'+(pi%2===0?'#fff':'#f8f9fa')+'">'
                 + '<td style="'+tdNum+'">'+(pi+1)+'</td>'
                 + '<td style="'+tdSt3+'font-weight:700;">'+(ps['Nama Peserta']||'—')+'</td>'
                 + '<td style="'+tdNum+'">'+(ps['No KP Peserta']||'—')+'</td>'
                 + '<td style="'+tdNum+'">'+(ps['Jantina Peserta']||'—')+'</td>'
                 + '<td style="'+tdNum+'">'+(ps['Bangsa Peserta']||'—')+'</td>'
                 + '</tr>';
          });
          out += '</tbody></table>';
        } else {
          out += '<div style="font-size:7.5pt;color:#aaa;padding:3pt 7pt;border:0.3pt solid #eee;border-top:none;">Tiada peserta</div>';
        }
        // Bottom border
        out += '<div style="border-bottom:0.5pt solid #ddd;margin-bottom:2pt;"></div>';
      }); // end guruOrder
      }); // end katsInSek
      out += '</div>';
    });
  }

  document.getElementById('print-portal').innerHTML = out;
}

// Print-specific dBox (uses rp- classes)
function rpDBox(tit,counts,full){
  var rows=Object.entries(counts).filter(function(e){return e[0]&&e[0]!=='—';})
    .map(function(e){return '<div class="rp-di"><span>'+e[0]+'</span><span>'+e[1]+'</span></div>';}).join('');
  return '<div class="rp-dbox'+(full?' full':'')+'"><h4>'+tit+'</h4>'+(rows||'<span style="font-size:7.5pt;color:#aaa;">—</span>')+'</div>';
}
// Print-specific bangsa×jantina table
function rpBJ(label,rows,bKey,jKey){
  var bt={};
  rows.forEach(function(r){
    var b=r[bKey]||'LAIN-LAIN',j=r[jKey]||'—';
    if(!bt[b])bt[b]={};bt[b][j]=(bt[b][j]||0)+1;
  });
  if(!Object.keys(bt).length) return '<div class="rp-dbox full"><h4>'+label+'</h4><span style="font-size:7.5pt;color:#aaa;">—</span></div>';
  var jList=['LELAKI','PEREMPUAN'];
  Object.values(bt).forEach(function(o){Object.keys(o).forEach(function(j){if(jList.indexOf(j)<0)jList.push(j);});});
  var tot={grand:0};jList.forEach(function(j){tot[j]=0;});
  var th='<thead><tr><th style="text-align:left;">Bangsa</th>'
    +jList.map(function(j){return '<th>'+j+'</th>';}).join('')+'<th>JML</th></tr></thead>';
  var tb='<tbody>'+Object.keys(bt).sort().map(function(b){
    var rt=0;
    var cells=jList.map(function(j){var v=bt[b][j]||0;rt+=v;tot[j]=(tot[j]||0)+v;tot.grand+=v;return '<td>'+(v||'—')+'</td>';}).join('');
    return '<tr><td>'+b+'</td>'+cells+'<td>'+rt+'</td></tr>';
  }).join('')+'</tbody>';
  var tf='<tfoot><tr><td>JUMLAH</td>'
    +jList.map(function(j){return '<td>'+(tot[j]||'—')+'</td>';}).join('')
    +'<td>'+tot.grand+'</td></tr></tfoot>';
  return '<div class="rp-dbox full"><h4>'+label+'</h4><table class="rp-bjt">'+th+tb+tf+'</table></div>';
}
function dBox(tit,counts){
  var rows=Object.entries(counts).filter(function(e){return e[0]&&e[0]!=='—';}).map(function(e){return '<div class="ditem"><span>'+e[0]+'</span><span>'+e[1]+'</span></div>';}).join('');
  return '<div class="dbox"><h4>'+tit+'</h4>'+(rows||'<div style="font-size:.66rem;color:var(--g5);">—</div>')+'</div>';
}
// Cross-tab bangsa × jantina for a given group (guru/peserta)
function dBoxBangsaJantina(label,rows,bangsaKey,jantinaKey){
  var bt={};
  rows.forEach(function(r){
    var b=r[bangsaKey]||'LAIN-LAIN', j=r[jantinaKey]||'—';
    if(!bt[b])bt[b]={};
    bt[b][j]=(bt[b][j]||0)+1;
  });
  var jantinaList=['LELAKI','PEREMPUAN'];
  // Collect all unique jantina values
  Object.values(bt).forEach(function(jObj){Object.keys(jObj).forEach(function(j){if(jantinaList.indexOf(j)<0)jantinaList.push(j);});});
  var thead='<tr><th style="text-align:left;font-size:.58rem;font-weight:800;color:var(--g6);padding:.15rem .3rem;text-transform:uppercase;">Bangsa</th>'
    +jantinaList.map(function(j){return '<th style="font-size:.58rem;font-weight:800;color:var(--g6);padding:.15rem .3rem;text-align:center;">'+j+'</th>';}).join('')
    +'<th style="font-size:.58rem;font-weight:800;color:var(--red);padding:.15rem .3rem;text-align:center;">JML</th></tr>';
  var total={};
  var tbody=Object.keys(bt).sort().map(function(b){
    var rowTotal=0;
    var cells=jantinaList.map(function(j){var v=bt[b][j]||0;rowTotal+=v;total[j]=(total[j]||0)+v;return '<td style="text-align:center;font-size:.68rem;color:var(--g7);padding:.14rem .3rem;">'+(v||'—')+'</td>';}).join('');
    return '<tr><td style="font-size:.68rem;font-weight:700;color:var(--g8);padding:.14rem .3rem;">'+b+'</td>'+cells+'<td style="text-align:center;font-size:.68rem;font-weight:800;color:var(--red);padding:.14rem .3rem;">'+rowTotal+'</td></tr>';
  }).join('');
  var grandTotal=jantinaList.reduce(function(s,j){return s+(total[j]||0);},0);
  var tfoot='<tr style="border-top:1.5px solid var(--g3);"><td style="font-size:.62rem;font-weight:800;color:var(--g7);padding:.14rem .3rem;">JUMLAH</td>'
    +jantinaList.map(function(j){return '<td style="text-align:center;font-size:.66rem;font-weight:800;color:var(--g7);padding:.14rem .3rem;">'+(total[j]||'—')+'</td>';}).join('')
    +'<td style="text-align:center;font-size:.68rem;font-weight:900;color:var(--red);padding:.14rem .3rem;">'+grandTotal+'</td></tr>';
  return '<div class="dbox" style="grid-column:1/-1;"><h4>'+label+'</h4>'
    +'<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;border:1px solid var(--g2);border-radius:6px;overflow:hidden;">'
    +'<thead style="background:var(--g1);">'+thead+'</thead><tbody>'+tbody+'</tbody>'
    +'<tfoot>'+tfoot+'</tfoot></table></div></div>';
}
// Cross-tab bangsa × jantina table
function dBoxBJ(label,rows,bKey,jKey){
  var bt={};
  rows.forEach(function(r){
    var b=r[bKey]||'LAIN-LAIN',j=r[jKey]||'—';
    if(!bt[b])bt[b]={};
    bt[b][j]=(bt[b][j]||0)+1;
  });
  if(!Object.keys(bt).length) return '<div class="dbox" style="grid-column:1/-1;"><h4>'+label+'</h4><div style="font-size:.66rem;color:var(--g5);">—</div></div>';
  var jList=['LELAKI','PEREMPUAN'];
  Object.values(bt).forEach(function(o){Object.keys(o).forEach(function(j){if(jList.indexOf(j)<0)jList.push(j);});});
  var th='<tr><th style="text-align:left;padding:.18rem .35rem;font-size:.6rem;font-weight:800;color:var(--g6);text-transform:uppercase;background:var(--g1);">Bangsa</th>'
    +jList.map(function(j){return '<th style="padding:.18rem .35rem;font-size:.6rem;font-weight:800;color:var(--g6);text-align:center;background:var(--g1);">'+j+'</th>';}).join('')
    +'<th style="padding:.18rem .35rem;font-size:.6rem;font-weight:800;color:var(--red);text-align:center;background:var(--g1);">JML</th></tr>';
  var tot={grand:0};jList.forEach(function(j){tot[j]=0;});
  var tb=Object.keys(bt).sort().map(function(b){
    var rt=0;
    var cells=jList.map(function(j){var v=bt[b][j]||0;rt+=v;tot[j]=(tot[j]||0)+v;tot.grand+=v;return '<td style="text-align:center;font-size:.69rem;color:var(--g7);padding:.14rem .35rem;">'+(v||'—')+'</td>';}).join('');
    return '<tr><td style="font-size:.69rem;font-weight:700;color:var(--g8);padding:.14rem .35rem;">'+b+'</td>'+cells+'<td style="text-align:center;font-size:.69rem;font-weight:800;color:var(--red);padding:.14rem .35rem;">'+rt+'</td></tr>';
  }).join('');
  var tf='<tr style="border-top:1.5px solid var(--g3);background:var(--rp);"><td style="font-size:.62rem;font-weight:800;color:var(--g7);padding:.14rem .35rem;">JUMLAH</td>'
    +jList.map(function(j){return '<td style="text-align:center;font-size:.66rem;font-weight:800;color:var(--g7);padding:.14rem .35rem;">'+(tot[j]||'—')+'</td>';}).join('')
    +'<td style="text-align:center;font-size:.7rem;font-weight:900;color:var(--red);padding:.14rem .35rem;">'+tot.grand+'</td></tr>';
  return '<div class="dbox" style="grid-column:1/-1;"><h4>'+label+'</h4>'
    +'<div style="overflow-x:auto;margin-top:.25rem;"><table style="width:100%;border-collapse:collapse;border:1px solid var(--g2);border-radius:6px;overflow:hidden;">'
    +'<thead>'+th+'</thead><tbody>'+tb+'</tbody><tfoot>'+tf+'</tfoot></table></div></div>';
}
function printRum(){
  // Show portal, print, hide again
  var p=document.getElementById('print-portal');
  p.style.display='block';
  window.print();
  p.style.display='none';
}
// == EKSPORT SELAMAT NOMBOR (CSV & Excel) =======================
// Nilai berangka yang BUKAN kuantiti (No.KP, No.Tel, kod...) mesti kekal TEKS. Excel menukar "010101130001"
// kepada 10101130001 (0 hilang) dan nombor panjang kepada 1.23E+14 apabila CSV dibuka / sel disunting.
function _numTeks(v){
  if(v===null||v===undefined) return false;
  var s=String(v).trim(); if(!s) return false;
  if(/^\d{4}-\d{2}-\d{2}([T ].*)?$/.test(s)) return false;   // tarikh ISO: biar Excel urus
  if(!/^\+?\d[\d\s\-().]*$/.test(s)) return false;            // bukan sekadar digit/pemisah
  return s.replace(/\D/g,'').length>=7 || /^0\d/.test(s) || s.charAt(0)==='+';  // panjang / 0 pendahulu / '+'
}
// Sel CSV: nombor-sebagai-teks ditulis ="..." (Excel kekalkan teks); selain itu dipetik biasa.
// Juga halang formula berniat jahat (CSV injection) — nilai bermula = @ (atau +/- bukan nombor) diawali '
function _csvCell(v){
  var s=(v===null||v===undefined)?'':String(v);
  if(_numTeks(s)) return '="'+s.replace(/"/g,'""')+'"';
  if(/^[=@]/.test(s) || /^[+\-]/.test(s)) s="'"+s;
  return '"'+s.replace(/"/g,'""')+'"';
}
// Excel: tandakan sel teks berangka dgn format '@' supaya kekal teks walaupun disunting
function _xlTeksSheets(wb){
  Object.keys(wb.Sheets).forEach(function(n){
    var ws=wb.Sheets[n];
    Object.keys(ws).forEach(function(k){
      if(k.charAt(0)==='!') return;
      var c=ws[k]; if(c && c.t==='s' && _numTeks(c.v)) c.z='@';
    });
  });
}
// Templat: prasetkan lajur (baris r1..r2) sebagai teks supaya apa yang pengguna taip tak ditukar jadi nombor
function _xlTeksLajur(ws,col,r1,r2){
  for(var r=r1;r<=r2;r++){
    var k=col+r;
    if(!ws[k]) ws[k]={t:'s',v:'',z:'@'}; else if(ws[k].t==='s') ws[k].z='@';
  }
  var rg=XLSX.utils.decode_range(ws['!ref']||'A1:A1');
  rg.e.r=Math.max(rg.e.r,r2-1); rg.e.c=Math.max(rg.e.c,XLSX.utils.decode_col(col));
  ws['!ref']=XLSX.utils.encode_range(rg);
}
// Sel import: nombor tulen (Excel buang 0 pendahulu) -> pulihkan No.KP 12 digit; selain itu teks biasa
function _kpSel(v){
  if(typeof v==='number' && isFinite(v) && Math.floor(v)===v && v>0 && String(v).length<12) return String(v).padStart(12,'0');
  return String(v==null?'':v).trim();
}
function expCSV(){
  var pny=window._rumPny||[];if(!pny.length){toast('Tiada data','er');return;}
  var nm=(window._rumProg&&window._rumProg['Nama Program']||'data').replace(/[\/*?:\[\]]/g,'_');

  // — CSV 1: PENYERTAAN —
  var hdr=['ID','Program ID','Nama Program','Kod Sekolah','Nama Sekolah','Kategori Penyertaan','Nama Guru','No KP Guru','Bangsa Guru','Jantina Guru','No Tel Guru','Nama Peserta','No KP Peserta','Jantina Peserta','Bangsa Peserta','Tarikh Daftar'];
  var csv=['\uFEFF'+hdr.join(',')].concat(pny.map(function(p){return hdr.map(function(h){
    var v=p[h]||'';
    if(h==='No Tel Guru') v=_fmtTel60(v)==='—'?'':
_fmtTel60(v);
    return _csvCell(v);
  }).join(',');})).join('\n');
  var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));
  a.download='penyertaan_'+nm+'.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);
  URL.revokeObjectURL(a.href);

  // — CSV 2: PENCAPAIAN —
  var pnc=window._rumPnc||[];
  if(pnc.length){
    var hdrPnc=['ID','Program ID','Nama Program','Peringkat','Kategori','Tempat','Nama Sekolah','Nama Peserta','No KP Peserta','Nama Guru'];
    var csvPnc=['\uFEFF'+hdrPnc.join(',')].concat(pnc.map(function(p){return hdrPnc.map(function(h){
      return _csvCell(p[h]);
    }).join(',');})).join('\n');
    var b2=document.createElement('a');b2.href=URL.createObjectURL(new Blob([csvPnc],{type:'text/csv;charset=utf-8;'}));
    b2.download='pencapaian_'+nm+'.csv';
    document.body.appendChild(b2);b2.click();document.body.removeChild(b2);
    URL.revokeObjectURL(b2.href);
    toast('CSV dieksport — '+pny.length+' rekod penyertaan, '+pnc.length+' rekod pencapaian ✓','ok');
  } else {
    toast('CSV Penyertaan dieksport ('+pny.length+' rekod) ✓','ok');
  }
}

// == EXPORT EXCEL — SATU SHEET PER SEKOLAH ======================

// EXCEL — Admin atau PKK sahaja
function reqXlsx(prog){
  if(!_sesi){toast('Sila log masuk dahulu','er');return;}
  if(_sesi.role!=='admin' && _sesi.role!=='pkk'){toast('Akses ditolak. Hanya Admin atau PKK boleh eksport Excel.','er');return;}
  expXlsx(prog);
}
async function expXlsx(prog){
  if(typeof XLSX==='undefined'){toast('Sila tunggu, memuatkan...','in');return;}
  showOv('MENYEDIAKAN EXCEL...');
  try{
    // P: Fetch fresh terus dari server (bukan cache _aP yang boleh stale/terpotong
    // had 1000 baris) — sama pendekatan seperti lihatPeny(). Guna getEditDataGS supaya
    // penyertaan & pencapaian program ni diambil sekali gus, tepat & terkini.
    var r = await run('getEditDataGS', prog['ID']);
    var pny = (r && r.penyertaan) ? r.penyertaan : [];
    if(!pny.length){hideOv();toast('Tiada data penyertaan','er');return;}

    var pnc2 = (r && r.pencapaian) ? r.pencapaian : [];
    var wb=_buildXlsxWorkbook(prog, pny, pnc2);

    // == Download ==
    var nm=(prog['Nama Program']||'Program').replace(/[\/*?:\[\]\/]/g,'_').slice(0,40);
    XLSX.writeFile(wb, 'Penyertaan_'+nm+'.xlsx');
    var sekNms=Object.keys(wb.Sheets).filter(function(s){return s!=='RINGKASAN'&&s!=='PENCAPAIAN';});
    toast('Excel dieksport ('+sekNms.length+' sekolah'+(pnc2.length?', '+pnc2.length+' pencapaian':'')+') ✓','ok');
  }catch(e){toast('Gagal: '+e.message,'er');}
  finally{hideOv();}
}

// _buildXlsxWorkbook — guna semula logic expXlsx untuk jana workbook tanpa download
function _buildXlsxWorkbook(prog, pny, pnc){
  // Filter pny kepada kategori program sahaja
  // Susun mengikut sekolah
  var sekMap={}, sekOrder=[];
  pny.forEach(function(r){var sk=r['Nama Sekolah']||'—';if(!sekMap[sk]){sekMap[sk]=[];sekOrder.push(sk);}sekMap[sk].push(r);});
  // Temporarily redirect to expXlsx logic by generating inline
  var wb=XLSX.utils.book_new();
  var printDate=new Date().toLocaleDateString('ms-MY',{day:'2-digit',month:'long',year:'numeric'});
  var RED='C0392B',DARKRED='922B21',WHITE='FFFFFF',LIGHTRED='FADBD8',DARKGREY='717D7E',MIDGREY='BFC9CA';
  var bdr=function(bg,bold,fc,sz){return{font:{bold:!!bold,color:{rgb:fc||'000000'},sz:sz||10,name:'Arial'},fill:{fgColor:{rgb:bg||'FFFFFF'}},alignment:{vertical:'center',wrapText:true},border:{top:{style:'thin',color:{rgb:MIDGREY}},bottom:{style:'thin',color:{rgb:MIDGREY}},left:{style:'thin',color:{rgb:MIDGREY}},right:{style:'thin',color:{rgb:MIDGREY}}}};};
  var ctr=function(s){return Object.assign({},s,{alignment:Object.assign({},s.alignment,{horizontal:'center'})});};
  sekOrder.forEach(function(sekNm,si){
    var rows=sekMap[sekNm]; var ws={}; var merges=[]; var r=0;
    var orgTitle='UNIT PEMBANGUNAN BAKAT MURID (UPBM) SUBIS';
    ws['A'+(r+1)]={v:orgTitle,t:'s',s:{font:{bold:true,sz:13,name:'Arial',color:{rgb:RED}},alignment:{horizontal:'center',vertical:'center'},fill:{fgColor:{rgb:WHITE}}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    ws['A'+(r+1)]={v:'SENARAI PENYERTAAN PROGRAM',t:'s',s:{font:{bold:true,sz:11,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center',vertical:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    ws['A'+(r+1)]={v:'Dicetak: '+printDate,t:'s',s:{font:{sz:9,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center',vertical:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;r++;
    ws['A'+(r+1)]={v:'MAKLUMAT PROGRAM',t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:RED}},alignment:{horizontal:'left',vertical:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    [['Nama Program',prog['Nama Program']||'—'],['Pengelola',prog['Pengelola']||'—'],['Bidang',prog['Bidang']||'—'],['Kategori',prog['Kategori']||'INDIVIDU'],['Peringkat',prog['Peringkat']||'—'],['Tarikh',fd(prog['Tarikh'])],['Tempat',prog['Tempat']||'—'],['Status',prog['Status']||'—']].forEach(function(kv){
      ws['A'+(r+1)]={v:kv[0],t:'s',s:{font:{bold:true,sz:9,name:'Arial',color:{rgb:DARKRED}},fill:{fgColor:{rgb:LIGHTRED}},alignment:{horizontal:'left',vertical:'center'},border:{top:{style:'thin',color:{rgb:MIDGREY}},bottom:{style:'thin',color:{rgb:MIDGREY}},left:{style:'thin',color:{rgb:MIDGREY}},right:{style:'thin',color:{rgb:MIDGREY}}}}};
      ws['B'+(r+1)]={v:kv[1],t:'s',s:{font:{sz:9,name:'Arial'},fill:{fgColor:{rgb:WHITE}},alignment:{horizontal:'left',vertical:'center'},border:{top:{style:'thin',color:{rgb:MIDGREY}},bottom:{style:'thin',color:{rgb:MIDGREY}},left:{style:'thin',color:{rgb:MIDGREY}},right:{style:'thin',color:{rgb:MIDGREY}}}}};
      merges.push({s:{r:r,c:1},e:{r:r,c:8}});r++;
    });
    r++;
    ws['A'+(r+1)]={v:'MAKLUMAT SEKOLAH',t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:DARKRED}},alignment:{horizontal:'left',vertical:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    var kod=(rows[0]&&rows[0]['Kod Sekolah'])||'—';
    [['Nama Sekolah',sekNm],['Kod Sekolah',kod]].forEach(function(kv){
      ws['A'+(r+1)]={v:kv[0],t:'s',s:{font:{bold:true,sz:9,name:'Arial',color:{rgb:DARKRED}},fill:{fgColor:{rgb:LIGHTRED}},alignment:{horizontal:'left',vertical:'center'},border:{top:{style:'thin',color:{rgb:MIDGREY}},bottom:{style:'thin',color:{rgb:MIDGREY}},left:{style:'thin',color:{rgb:MIDGREY}},right:{style:'thin',color:{rgb:MIDGREY}}}}};
      ws['B'+(r+1)]={v:kv[1],t:'s',s:{font:{sz:9,name:'Arial'},fill:{fgColor:{rgb:WHITE}},alignment:{horizontal:'left',vertical:'center'},border:{top:{style:'thin',color:{rgb:MIDGREY}},bottom:{style:'thin',color:{rgb:MIDGREY}},left:{style:'thin',color:{rgb:MIDGREY}},right:{style:'thin',color:{rgb:MIDGREY}}}}};
      merges.push({s:{r:r,c:1},e:{r:r,c:8}});r++;
    });
    r++;
    var uGuru={};rows.forEach(function(p){var k=p['No KP Guru']||p['Nama Guru'];if(k&&p['Nama Guru']&&!uGuru[k])uGuru[k]=p;});
    var guruList=Object.values(uGuru);
    ws['A'+(r+1)]={v:'SENARAI GURU PENGIRING ('+guruList.length+')',t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:'1A5276'}},alignment:{horizontal:'left',vertical:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    ['BIL','NAMA GURU','NO KP','JANTINA','BANGSA','NO TEL'].forEach(function(h,ci){var col=String.fromCharCode(65+ci);ws[col+(r+1)]={v:h,t:'s',s:{font:{bold:true,sz:9,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:'1F618D'}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium',color:{rgb:'154360'}},bottom:{style:'medium',color:{rgb:'154360'}},left:{style:'thin',color:{rgb:'AED6F1'}},right:{style:'thin',color:{rgb:'AED6F1'}}}}};});
    merges.push({s:{r:r,c:5},e:{r:r,c:8}});r++;
    guruList.forEach(function(g,i){var bg=i%2===0?'EBF5FB':'D6EAF8';var telVal=_fmtTel60(g['No Tel Guru']);/* pemformat sama dgn CSV: 0191234567 -> +60191234567 (dulu +600191234567) */[i+1,g['Nama Guru']||'—',g['No KP Guru']||'—',g['Jantina Guru']||'—',g['Bangsa Guru']||'—',telVal].forEach(function(v,ci){var col=String.fromCharCode(65+ci);var st=bdr(bg,false,'000000',9);if(ci===0)st=ctr(st);var cellType=(ci===5||ci===1||ci===2)?'s':(typeof v==='number'?'n':'s');ws[col+(r+1)]={v:v,t:cellType,s:st};});merges.push({s:{r:r,c:5},e:{r:r,c:8}});r++;});
    if(!guruList.length){ws['A'+(r+1)]={v:'— Tiada guru —',t:'s',s:{font:{italic:true,sz:9,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center'}}};merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;}
    r++;
    var katMap={},katOrder=[];
    rows.forEach(function(p){var kat=(p['Kategori Penyertaan']||'UMUM').toUpperCase();if(kat==='GURU')return; // rekod guru bukan peserta
    if(!katMap[kat]){katMap[kat]=[];katOrder.push(kat);}var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&!katMap[kat].find(function(x){return(x['No KP Peserta']||x['Nama Peserta'])===pk;}))katMap[kat].push(p);});
    var katColors={'INDIVIDU LELAKI':'2471A3','INDIVIDU PEREMPUAN':'76448A','BERKUMPULAN LELAKI':'1E8449','BERKUMPULAN PEREMPUAN':'784212','KESELURUHAN':'922B21','TERBUKA':'B7770D','TERBUKA INDIVIDU':'B7770D','TERBUKA BERKUMPULAN':'A04000','UMUM':'2E4057'};
    var katBg={'INDIVIDU LELAKI':'D6EAF8','INDIVIDU PEREMPUAN':'E8DAEF','BERKUMPULAN LELAKI':'D5F5E3','BERKUMPULAN PEREMPUAN':'FAE5D3','KESELURUHAN':'FADBD8','TERBUKA':'FDEBD0','TERBUKA INDIVIDU':'FDEBD0','TERBUKA BERKUMPULAN':'FAD7A0','UMUM':'EAECEE'};
    katOrder.forEach(function(kat){
      var pesList=katMap[kat];var kc=katColors[kat]||'2E4057';var kb=katBg[kat]||'EAECEE';
      ws['A'+(r+1)]={v:'PESERTA — '+kat+' ('+pesList.length+')',t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:kc}},alignment:{horizontal:'left',vertical:'center'}}};
      merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
      ['BIL','NAMA PESERTA','NO KP','JANTINA','BANGSA','TARIKH DAFTAR'].forEach(function(h,ci){var col=String.fromCharCode(65+ci);ws[col+(r+1)]={v:h,t:'s',s:{font:{bold:true,sz:9,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:kc}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium',color:{rgb:'000000'}},bottom:{style:'medium',color:{rgb:'000000'}},left:{style:'thin',color:{rgb:WHITE}},right:{style:'thin',color:{rgb:WHITE}}}}};});
      merges.push({s:{r:r,c:5},e:{r:r,c:8}});r++;
      pesList.forEach(function(p,i){var bg=i%2===0?'FFFFFF':kb;[i+1,p['Nama Peserta']||'—',p['No KP Peserta']||'—',p['Jantina Peserta']||'—',p['Bangsa Peserta']||'—',p['Tarikh Daftar']?fd(p['Tarikh Daftar']):'—'].forEach(function(v,ci){var col=String.fromCharCode(65+ci);var st=bdr(bg,false,'000000',9);if(ci===0)st=ctr(st);ws[col+(r+1)]={v:v,t:(typeof v==='number'?'n':'s'),s:st};});merges.push({s:{r:r,c:5},e:{r:r,c:8}});r++;});
      if(!pesList.length){ws['A'+(r+1)]={v:'— Tiada peserta —',t:'s',s:{font:{italic:true,sz:9,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center'}}};merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;}
      r++;
    });
    ws['A'+(r+1)]={v:'Dokumen ini dijana secara automatik oleh sistem UPBM SUBIS — '+printDate,t:'s',s:{font:{italic:true,sz:8,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center'}}};
    merges.push({s:{r:r,c:0},e:{r:r,c:8}});r++;
    ws['!cols']=[{wch:5},{wch:32},{wch:16},{wch:12},{wch:14},{wch:16},{wch:4},{wch:4},{wch:4}];
    var rh=[];for(var i=0;i<r;i++)rh.push({hpt:i<4?22:15});rh[0]={hpt:28};ws['!rows']=rh;
    ws['!merges']=merges;ws['!ref']='A1:I'+(r+1);
    var sheetNm=sekNm.replace(/[\\/*?:\[\]]/g,'').trim().slice(0,31)||('Sek '+(si+1));
    XLSX.utils.book_append_sheet(wb,ws,sheetNm||('Sek '+(si+1)));
  });
  // Ringkasan sheet
  var wsRmk={};var rmkMerges=[];var rr=0;
  wsRmk['A'+(rr+1)]={v:'RINGKASAN PENYERTAAN — '+prog['Nama Program'],t:'s',s:{font:{bold:true,sz:12,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:RED}},alignment:{horizontal:'center',vertical:'center'}}};
  rmkMerges.push({s:{r:rr,c:0},e:{r:rr,c:5}});rr++;
  wsRmk['A'+(rr+1)]={v:'Dicetak: '+printDate,t:'s',s:{font:{sz:9,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center'}}};
  rmkMerges.push({s:{r:rr,c:0},e:{r:rr,c:5}});rr++;rr++;
  ['BIL','NAMA SEKOLAH','KOD','GURU','PESERTA','REKOD'].forEach(function(h,ci){var col=String.fromCharCode(65+ci);wsRmk[col+(rr+1)]={v:h,t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:RED}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium',color:{rgb:DARKRED}},bottom:{style:'medium',color:{rgb:DARKRED}},left:{style:'thin',color:{rgb:LIGHTRED}},right:{style:'thin',color:{rgb:LIGHTRED}}}}};});rr++;
  var tR=0,tP=0,tG=0;
  sekOrder.forEach(function(sekNm,i){
    var rows=sekMap[sekNm];var kod2=(rows[0]&&rows[0]['Kod Sekolah'])||'—';
    var uG2={},uP2={};rows.forEach(function(p){var gk=p['No KP Guru']||p['Nama Guru'];if(gk&&p['Nama Guru']&&!uG2[gk])uG2[gk]=1;var pk=p['No KP Peserta']||p['Nama Peserta'];if(pk&&p['Nama Peserta']&&!uP2[pk])uP2[pk]=1;});
    var nG=Object.keys(uG2).length,nP=Object.keys(uP2).length;var nRekod=rows.filter(function(r){return (r['Kategori Penyertaan']||'').toUpperCase()!=='GURU';}).length;tG+=nG;tP+=nP;tR+=nRekod;
    [i+1,sekNm,kod2,nG,nP,nRekod].forEach(function(v,ci){var col=String.fromCharCode(65+ci);var st=bdr(i%2===0?'FFFFFF':'FDFEFE',false,'000000',9);if(ci===0||ci>=3)st=ctr(st);wsRmk[col+(rr+1)]={v:v,t:(typeof v==='number'?'n':'s'),s:st};});rr++;
  });
  ['','JUMLAH','',tG,tP,tR].forEach(function(v,ci){var col=String.fromCharCode(65+ci);wsRmk[col+(rr+1)]={v:v,t:(typeof v==='number'?'n':'s'),s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:DARKRED}},alignment:{horizontal:ci>=3?'center':'left',vertical:'center'},border:{top:{style:'medium',color:{rgb:RED}},bottom:{style:'medium',color:{rgb:RED}},left:{style:'thin',color:{rgb:LIGHTRED}},right:{style:'thin',color:{rgb:LIGHTRED}}}}};});rr++;
  wsRmk['!cols']=[{wch:5},{wch:35},{wch:12},{wch:8},{wch:8},{wch:8}];
  wsRmk['!rows']=[];for(var i=0;i<rr;i++)wsRmk['!rows'].push({hpt:i===0?24:16});
  wsRmk['!merges']=rmkMerges;wsRmk['!ref']='A1:F'+(rr+1);
  // ======= SHEET PENCAPAIAN =======
  var pncData = pnc||[];
  if(pncData.length){
    var wsPnc={}; var pncMerges=[]; var pr=0;
    var pncKatColors={'INDIVIDU LELAKI':'2471A3','INDIVIDU PEREMPUAN':'76448A','BERKUMPULAN LELAKI':'1E8449','BERKUMPULAN PEREMPUAN':'784212','KESELURUHAN':'922B21','TERBUKA':'B7770D','TERBUKA INDIVIDU':'B7770D','TERBUKA BERKUMPULAN':'A04000'};
    var pncKatBg={'INDIVIDU LELAKI':'D6EAF8','INDIVIDU PEREMPUAN':'E8DAEF','BERKUMPULAN LELAKI':'D5F5E3','BERKUMPULAN PEREMPUAN':'FAE5D3','KESELURUHAN':'FADBD8','TERBUKA':'FDEBD0','TERBUKA INDIVIDU':'FDEBD0','TERBUKA BERKUMPULAN':'FAD7A0'};
    // Header
    wsPnc['A'+(pr+1)]={v:'PENCAPAIAN — '+prog['Nama Program'],t:'s',s:{font:{bold:true,sz:13,name:'Arial',color:{rgb:RED}},alignment:{horizontal:'center',vertical:'center'},fill:{fgColor:{rgb:WHITE}}}};
    pncMerges.push({s:{r:pr,c:0},e:{r:pr,c:5}});pr++;
    wsPnc['A'+(pr+1)]={v:'Dicetak: '+printDate,t:'s',s:{font:{sz:9,name:'Arial',color:{rgb:DARKGREY}},alignment:{horizontal:'center'}}};
    pncMerges.push({s:{r:pr,c:0},e:{r:pr,c:5}});pr++;pr++;
    // Kumpul mengikut kategori
    var pncKatMap={},pncKatOrder=[],pncKatOrderRef=['INDIVIDU LELAKI','INDIVIDU PEREMPUAN','BERKUMPULAN LELAKI','BERKUMPULAN PEREMPUAN','KESELURUHAN','TERBUKA INDIVIDU','TERBUKA BERKUMPULAN','TERBUKA'];
    pncData.forEach(function(e){var k=(e['Kategori']||'UMUM').toUpperCase();if(!pncKatMap[k]){pncKatMap[k]=[];pncKatOrder.push(k);}pncKatMap[k].push(e);});
    var pncKatSorted=pncKatOrderRef.concat(pncKatOrder.filter(function(k){return pncKatOrderRef.indexOf(k)<0;})).filter(function(k){return pncKatMap[k]&&pncKatMap[k].length;});
    pncKatSorted.forEach(function(kat){
      var items=pncKatMap[kat];
      var kc=pncKatColors[kat]||'2E4057';
      var kb=pncKatBg[kat]||'EAECEE';
      // Kat header
      wsPnc['A'+(pr+1)]={v:kat+' ('+items.length+')',t:'s',s:{font:{bold:true,sz:10,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:kc}},alignment:{horizontal:'left',vertical:'center'}}};
      pncMerges.push({s:{r:pr,c:0},e:{r:pr,c:5}});pr++;
      // Col headers
      ['BIL','TEMPAT','NAMA SEKOLAH','NAMA PESERTA','NO KP PESERTA','NAMA GURU'].forEach(function(h,ci){
        var col=String.fromCharCode(65+ci);
        wsPnc[col+(pr+1)]={v:h,t:'s',s:{font:{bold:true,sz:9,name:'Arial',color:{rgb:WHITE}},fill:{fgColor:{rgb:kc}},alignment:{horizontal:'center',vertical:'center'},border:{top:{style:'medium',color:{rgb:'000000'}},bottom:{style:'medium',color:{rgb:'000000'}},left:{style:'thin',color:{rgb:WHITE}},right:{style:'thin',color:{rgb:WHITE}}}}};
      });pr++;
      items.forEach(function(e,i){
        var bg=i%2===0?'FFFFFF':kb;
        [i+1,(e['Tempat']||'—').toUpperCase(),(e['Nama Sekolah']||'—'),(e['Nama Peserta']||'—'),(e['No KP Peserta']||''),  (e['Nama Guru']||'—')].forEach(function(v,ci){
          var col=String.fromCharCode(65+ci);
          var st=bdr(bg,false,'000000',9);if(ci===0)st=ctr(st);
          wsPnc[col+(pr+1)]={v:v,t:(typeof v==='number'?'n':'s'),s:st};
        });pr++;
      });
      pr++;
    });
    wsPnc['!cols']=[{wch:5},{wch:14},{wch:32},{wch:28},{wch:16},{wch:26}];
    var pncRh=[];for(var i=0;i<pr;i++)pncRh.push({hpt:i<2?22:15});wsPnc['!rows']=pncRh;
    wsPnc['!merges']=pncMerges;wsPnc['!ref']='A1:F'+(pr+1);
    XLSX.utils.book_append_sheet(wb,wsPnc,'PENCAPAIAN');
  }
  XLSX.utils.book_append_sheet(wb,wsRmk,'RINGKASAN');
  _xlTeksSheets(wb);   // No.KP / No.Tel kekal teks (format '@')
  return wb;
}

