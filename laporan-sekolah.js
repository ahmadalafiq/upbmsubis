/* ============================================================================
   laporan-sekolah.js — LAPORAN SEKOLAH (penyertaan & pencapaian) + PERBANDINGAN SESI
   ----------------------------------------------------------------------------
   Dipanggil dari butang "LAPORAN SEKOLAH" di halaman Dashboard: openLaporanSekolah()

   TIADA enjin PDF baharu. Semua guna semula yang sedia ada dalam index.html:
     - data      : _supaDispatch('getAllDataGS',{tahun})   (sumber sama dgn Dashboard)
     - markah    : getSkor() / mPts()                      (kaedah sama dgn ranking Dashboard)
     - PDF       : pdf-lib (PDFLib) + Blob/<a download>    (cara sama dgn janaPdfSalinanPenyertaan,
                   berfungsi walaupun app di-embed dalam Google Sites)
     - cetak     : portal #sdet-print-portal + window.print() (cara sama dgn printSdet)
     - modal     : kelas .mo/.md/.mh + openMo()/closeMo()

   Satu "spesifikasi dokumen" (senarai blok) dijana untuk setiap laporan, kemudian dipaparkan
   sebagai HTML (pratonton + cetak) DAN PDF — jadi isi pratonton & PDF sentiasa sama.
   Tiada No.KP dalam laporan (hanya nama, kategori, jantina).
   ============================================================================ */
(function (G) {
  'use strict';

  var SEMUA = '__SEMUA__';
  var LS = { cache: {}, mode: 'tunggal', models: [], kod: '', nama: '', spec: null, fileName: '', years: [], sekList: [], batch: null };

  /* ───────────── utiliti kecil ───────────── */
  function U(s) { return String(s == null ? '' : s).toUpperCase().trim(); }
  function E(s) {
    return typeof G.esc === 'function' ? G.esc(s)
      : String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function uniqBy(rows, keyFn) {
    var seen = {}, out = [];
    rows.forEach(function (r) { var k = keyFn(r); if (!k || seen[k]) return; seen[k] = 1; out.push(r); });
    return out;
  }
  function cnt(arr, keyFn) {
    var c = {};
    arr.forEach(function (r) { var k = keyFn(r) || '—'; c[k] = (c[k] || 0) + 1; });
    return c;
  }
  function tempatKelas(t) {
    var s = U(t);
    if (s.indexOf('PERTAMA') > -1) return 'PERTAMA';
    if (s.indexOf('KEDUA') > -1) return 'KEDUA';
    if (s.indexOf('KETIGA') > -1) return 'KETIGA';
    return 'LAIN-LAIN';
  }
  function tempatRank(t) { return { PERTAMA: 1, KEDUA: 2, KETIGA: 3 }[tempatKelas(t)] || 4; }
  function fmtTarikh(d) {
    if (!d) return '—';
    if (typeof G.fd === 'function') return G.fd(d);
    return String(d);
  }
  function hariIni() {
    var d = new Date();
    return d.toLocaleDateString('ms-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function normNamaProgram(s) {   // buang tahun supaya program sama dipadan antara sesi
    return U(s).replace(/\bTAHUN\s*(19|20)\d{2}\b/g, '').replace(/\b(19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim();
  }
  function pecah(n, base) {
    if (base == null || base === 0) return '—';
    var p = Math.round((n - base) / base * 100);
    return (p > 0 ? '+' : '') + p + '%';
  }
  function beza(n, base) {
    var d = n - base;
    return (d > 0 ? '+' : '') + d;
  }

  /* ───────────── MODEL: data → ringkasan satu sekolah, satu sesi ───────────── */
  function buildModel(kod, nama, tahun, data) {
    var K = U(kod);
    var progs = data.programs || [], py = data.penyertaan || [], pc = data.pencapaian || [];
    var progById = {};
    progs.forEach(function (p) { progById[p['ID']] = p; });

    var notDraft = function (r) {
      var p = progById[r['Program ID']];
      return !(p && U(p['Status']) === 'DRAFT');
    };
    var pyS = py.filter(function (r) { return U(r['Kod Sekolah']) === K && notDraft(r); });
    var names = {}; names[U(nama)] = 1;
    pyS.forEach(function (r) { var n = U(r['Nama Sekolah']); if (n) names[n] = 1; });
    // Pencapaian: padan ikut Kod Sekolah; jika kosong (rekod lama) guna nama sekolah
    var pcS = pc.filter(function (r) {
      var k = U(r['Kod Sekolah']);
      return (k ? k === K : !!names[U(r['Nama Sekolah'])]) && notDraft(r);
    });
    // Seragamkan nama sekolah supaya getSkor tak pecahkan 1 sekolah kepada 2 kunci
    var canon = function (r) { var o = {}; for (var k in r) o[k] = r[k]; o['Nama Sekolah'] = nama; return o; };
    var pyC = pyS.map(canon), pcC = pcS.map(canon);

    var sc = G.getSkor(pcC, 'Nama Sekolah', pyC, progs);
    var tot = 0, totPenc = 0, totPel = 0, perProg = {};
    Object.keys(sc).forEach(function (k) {
      var e = sc[k];
      tot += e.total; totPenc += e.totalPenc; totPel += e.totalPel;
      (e.detail || []).forEach(function (d) { perProg[d.progId] = (perProg[d.progId] || 0) + d.pts; });
    });
    // Senarai pencapaian: SEMUA kedudukan yang direkod (getSkor hanya kira kedudukan terbaik
    // bagi setiap sekolah/program/kategori untuk MARKAH — tak sesuai untuk senarai penuh)
    var pencList = pcC.filter(function (r) { return r['Tempat']; }).map(function (r) {
      var pg = progById[r['Program ID']] || {};
      return {
        progId: r['Program ID'], prog: pg['Nama Program'] || r['Nama Program'] || r['Program ID'],
        tempat: r['Tempat'], kat: r['Kategori'] || '', per: r['Peringkat'] || pg['Peringkat'] || '',
        pes: r['Nama Peserta'] || '', guru: r['Nama Guru'] || ''
      };
    });
    pencList.sort(function (a, b) {
      var c = String(a.prog || '').localeCompare(String(b.prog || ''));
      return c !== 0 ? c : tempatRank(a.tempat) - tempatRank(b.tempat);
    });

    var ids = {};
    pyC.forEach(function (r) { if (r['Program ID']) ids[r['Program ID']] = 1; });
    pcC.forEach(function (r) { if (r['Program ID']) ids[r['Program ID']] = 1; });

    var programs = Object.keys(ids).map(function (id) {
      var p = progById[id] || {};
      var rows = pyC.filter(function (r) { return r['Program ID'] === id; });
      var pes = uniqBy(rows.filter(function (r) { return r['Nama Peserta']; }),
        function (r) { return r['No KP Peserta'] || r['Nama Peserta']; });
      var gu = uniqBy(rows.filter(function (r) { return r['Nama Guru']; }),
        function (r) { return r['No KP Guru'] || r['Nama Guru']; });
      var pn = pencList.filter(function (d) { return d.progId === id; });
      var pcRow = pcC.filter(function (r) { return r['Program ID'] === id; })[0] || {};
      var kat = uniqBy(rows.filter(function (r) { return r['Kategori Penyertaan']; }),
        function (r) { return U(r['Kategori Penyertaan']); }).map(function (r) { return r['Kategori Penyertaan']; });
      return {
        id: id,
        nama: p['Nama Program'] || (rows[0] && rows[0]['Nama Program']) || pcRow['Nama Program'] || id,
        bidang: p['Bidang'] || '—',
        peringkat: p['Peringkat'] || pcRow['Peringkat'] || '—',
        tarikh: p['Tarikh'] || '',
        tempat: p['Tempat'] || '',
        status: p['Status'] || '',
        kategori: kat,
        peserta: pes.map(function (r) { return { nama: r['Nama Peserta'], jantina: r['Jantina Peserta'] || '', kategori: r['Kategori Penyertaan'] || '' }; }),
        guru: gu.map(function (r) { return { nama: r['Nama Guru'], jantina: r['Jantina Guru'] || '' }; }),
        pencapaian: pn,
        markah: perProg[id] || 0
      };
    });
    programs.sort(function (a, b) {
      var c = String(a.tarikh || '').localeCompare(String(b.tarikh || ''));
      return c !== 0 ? c : String(a.nama).localeCompare(String(b.nama));
    });

    var allPes = uniqBy(pyC.filter(function (r) { return r['Nama Peserta']; }),
      function (r) { return r['No KP Peserta'] || r['Nama Peserta']; });
    var allGu = uniqBy(pyC.filter(function (r) { return r['Nama Guru']; }),
      function (r) { return r['No KP Guru'] || r['Nama Guru']; });

    var byTempat = { 'PERTAMA': 0, 'KEDUA': 0, 'KETIGA': 0, 'LAIN-LAIN': 0 };
    pencList.forEach(function (d) { byTempat[tempatKelas(d.tempat)]++; });

    var grp = function (keyFn) {
      var o = {};
      programs.forEach(function (p) {
        var k = U(keyFn(p)) || '—';
        if (!o[k]) o[k] = { program: 0, pencapaian: 0 };
        o[k].program++; o[k].pencapaian += p.pencapaian.length;
      });
      return o;
    };

    return {
      kod: K, nama: nama, tahun: tahun, programs: programs, pencList: pencList,
      ringkas: {
        nProgram: programs.length, nPeserta: allPes.length, nGuru: allGu.length,
        nPenc: pencList.length, byTempat: byTempat,
        skor: tot, skorPenc: totPenc, skorPel: totPel,
        byBidang: grp(function (p) { return p.bidang; }),
        byPeringkat: grp(function (p) { return p.peringkat; }),
        jantinaPeserta: cnt(allPes, function (r) { return U(r['Jantina Peserta']); }),
        jantinaGuru: cnt(allGu, function (r) { return U(r['Jantina Guru']); })
      }
    };
  }

  /* ───────────── SPESIFIKASI DOKUMEN (dikongsi HTML & PDF) ─────────────
     blok: {t:'title',title,sub[]} {t:'sec',text} {t:'table',cols:[{h,w,a}],rows[][]}
           {t:'para',label,text} {t:'note',text}                                  */
  function specTunggal(m) {
    var S = [], r = m.ringkas;
    S.push({ t: 'title', title: 'LAPORAN PENYERTAAN & PENCAPAIAN', sub: [m.nama, 'Kod: ' + m.kod + '   |   Tahun: ' + m.tahun] });

    S.push({ t: 'sec', text: '1. Ringkasan' });
    S.push({
      t: 'table',
      cols: [{ h: 'Petunjuk', w: 4 }, { h: 'Nilai', w: 1.3, a: 'c' }, { h: 'Petunjuk', w: 4 }, { h: 'Nilai', w: 1.3, a: 'c' }],
      rows: [
        ['Program disertai', r.nProgram, 'Pencapaian (tempat)', r.nPenc],
        ['Peserta unik', r.nPeserta, '- Pertama', r.byTempat['PERTAMA']],
        ['Guru pengiring unik', r.nGuru, '- Kedua', r.byTempat['KEDUA']],
        ['Markah pencapaian', r.skorPenc, '- Ketiga', r.byTempat['KETIGA']],
        ['Markah pelibatan', r.skorPel, '- Lain-lain', r.byTempat['LAIN-LAIN']],
        ['JUMLAH MARKAH', r.skor, '', '']
      ]
    });

    var grpRows = function (o) {
      return Object.keys(o).sort().map(function (k) { return [k, o[k].program, o[k].pencapaian]; });
    };
    S.push({ t: 'sec', text: '2. Pecahan Mengikut Bidang & Peringkat' });
    if (r.nProgram) {
      S.push({ t: 'table', cols: [{ h: 'Bidang', w: 5, a: 'c' }, { h: 'Program', w: 1.5, a: 'c' }, { h: 'Pencapaian', w: 1.6, a: 'c' }], rows: grpRows(r.byBidang) });
      S.push({ t: 'table', cols: [{ h: 'Peringkat', w: 5, a: 'c' }, { h: 'Program', w: 1.5, a: 'c' }, { h: 'Pencapaian', w: 1.6, a: 'c' }], rows: grpRows(r.byPeringkat) });
    } else {
      S.push({ t: 'note', text: 'Tiada penyertaan direkodkan bagi sekolah ini pada tahun ' + m.tahun + '.' });
    }

    S.push({ t: 'sec', text: '3. Senarai Program Disertai' });
    if (m.programs.length) {
      S.push({
        t: 'table',
        cols: [{ h: 'Bil', w: .7, a: 'c' }, { h: 'Program', w: 6 }, { h: 'Bidang', w: 1.6, a: 'c' }, { h: 'Peringkat', w: 1.5, a: 'c' },
          { h: 'Tarikh', w: 1.6, a: 'c' }, { h: 'Peserta', w: 1.1, a: 'c' }, { h: 'Guru', w: .9, a: 'c' }, { h: 'Markah', w: 1.1, a: 'c' }],
        rows: m.programs.map(function (p, i) {
          return [i + 1, p.nama, p.bidang, p.peringkat, fmtTarikh(p.tarikh), p.peserta.length, p.guru.length, p.markah];
        })
      });
    } else {
      S.push({ t: 'note', text: 'Tiada program.' });
    }

    S.push({ t: 'sec', text: '4. Pencapaian' });
    if (m.pencList.length) {
      S.push({
        t: 'table',
        cols: [{ h: 'Program', w: 4.6 }, { h: 'Kategori', w: 2, a: 'c' }, { h: 'Peringkat', w: 1.7, a: 'c' }, { h: 'Tempat', w: 1.8, a: 'c' }, { h: 'Peserta', w: 3.1 }, { h: 'Guru', w: 2.8 }],
        rows: m.pencList.map(function (d) { return [d.prog, d.kat || '—', d.per || '—', d.tempat, d.pes || '—', d.guru || '—']; })
      });
      S.push({ t: 'note', text: 'Senarai di atas memuatkan semua kedudukan yang direkod. Markah sekolah dikira mengikut kedudukan terbaik bagi setiap program dan kategori (kaedah ranking Dashboard).' });
    } else {
      S.push({ t: 'note', text: 'Tiada pencapaian (kedudukan) direkodkan bagi tahun ini.' });
    }

    S.push({ t: 'sec', text: '5. Senarai Nama Mengikut Program (Guru, kemudian Peserta)' });
    if (m.programs.length) {
      var byNama = function (x, y) { return String(x.nama).localeCompare(String(y.nama)); };
      m.programs.forEach(function (p, i) {
        S.push({ t: 'sub', text: (i + 1) + '. ' + p.nama + '   (Guru: ' + p.guru.length + '  |  Peserta: ' + p.peserta.length + ')' });
        var rows = [], n = 0;
        p.guru.slice().sort(byNama).forEach(function (g) { rows.push([++n, g.nama, 'GURU', '—', g.jantina || '—']); });
        p.peserta.slice().sort(byNama).forEach(function (x) { rows.push([++n, x.nama, 'PESERTA', x.kategori || '—', x.jantina || '—']); });
        if (!rows.length) rows.push(['—', 'Tiada nama direkodkan', '—', '—', '—']);
        S.push({
          t: 'table',
          cols: [{ h: 'Bil', w: .8, a: 'c' }, { h: 'Nama', w: 6 }, { h: 'Peranan', w: 1.8, a: 'c' }, { h: 'Kategori', w: 1.8, a: 'c' }, { h: 'Jantina', w: 1.8, a: 'c' }],
          rows: rows
        });
      });
    } else {
      S.push({ t: 'note', text: 'Tiada.' });
    }

    S.push({ t: 'sec', text: '6. Demografi' });
    var jk = Object.keys(Object.assign({}, r.jantinaPeserta, r.jantinaGuru)).sort();
    S.push({
      t: 'table', cols: [{ h: 'Jantina', w: 4, a: 'c' }, { h: 'Peserta', w: 2, a: 'c' }, { h: 'Guru', w: 2, a: 'c' }],
      rows: jk.length ? jk.map(function (k) { return [k, r.jantinaPeserta[k] || 0, r.jantinaGuru[k] || 0]; }) : [['—', 0, 0]]
    });

    S.push({ t: 'note', text: 'Dijana pada ' + hariIni() + ' daripada data yang dilaporkan dalam Sistem UPBM Subis. Markah dikira dengan kaedah yang sama seperti ranking Dashboard (pencapaian + pelibatan). Laporan ini untuk simpanan sekolah.' });
    return S;
  }

  function specBanding(models) {   // models: susun tahun terkini dahulu
    var S = [], a = models[0], b = models[1];
    var ths = models.map(function (m) { return String(m.tahun); });
    S.push({ t: 'title', title: 'LAPORAN PERBANDINGAN SESI', sub: [a.nama, 'Kod: ' + a.kod + '   |   Sesi: ' + ths.join(' vs ')] });

    var met = [
      ['Program disertai', function (r) { return r.nProgram; }],
      ['Peserta unik', function (r) { return r.nPeserta; }],
      ['Guru pengiring unik', function (r) { return r.nGuru; }],
      ['Pencapaian (tempat)', function (r) { return r.nPenc; }],
      ['- Pertama', function (r) { return r.byTempat['PERTAMA']; }],
      ['- Kedua', function (r) { return r.byTempat['KEDUA']; }],
      ['- Ketiga', function (r) { return r.byTempat['KETIGA']; }],
      ['- Lain-lain', function (r) { return r.byTempat['LAIN-LAIN']; }],
      ['Markah pencapaian', function (r) { return r.skorPenc; }],
      ['Markah pelibatan', function (r) { return r.skorPel; }],
      ['JUMLAH MARKAH', function (r) { return r.skor; }]
    ];
    S.push({ t: 'sec', text: '1. Perbandingan Ringkasan' });
    var cols = [{ h: 'Petunjuk', w: 4.5 }].concat(models.map(function (m) { return { h: String(m.tahun), w: 1.4, a: 'c' }; }));
    cols.push({ h: 'Perubahan ' + a.tahun + ' vs ' + b.tahun, w: 2.4, a: 'c' });
    S.push({
      t: 'table', cols: cols,
      rows: met.map(function (x) {
        var vals = models.map(function (m) { return x[1](m.ringkas); });
        return [x[0]].concat(vals, [beza(vals[0], vals[1]) + ' (' + pecah(vals[0], vals[1]) + ')']);
      })
    });

    var union = function (key) {
      var o = {};
      models.forEach(function (m) { Object.keys(m.ringkas[key]).forEach(function (k) { o[k] = 1; }); });
      return Object.keys(o).sort();
    };
    var cell = function (r, key, k) { var x = r[key][k]; return x ? x.program + ' (' + x.pencapaian + ')' : '—'; };
    S.push({ t: 'sec', text: '2. Mengikut Bidang  (program / pencapaian)' });
    S.push({ t: 'table', cols: [{ h: 'Bidang', w: 4.5, a: 'c' }].concat(models.map(function (m) { return { h: String(m.tahun), w: 1.8, a: 'c' }; })),
      rows: union('byBidang').map(function (k) { return [k].concat(models.map(function (m) { return cell(m.ringkas, 'byBidang', k); })); }) });
    S.push({ t: 'sec', text: '3. Mengikut Peringkat  (program / pencapaian)' });
    S.push({ t: 'table', cols: [{ h: 'Peringkat', w: 4.5, a: 'c' }].concat(models.map(function (m) { return { h: String(m.tahun), w: 1.8, a: 'c' }; })),
      rows: union('byPeringkat').map(function (k) { return [k].concat(models.map(function (m) { return cell(m.ringkas, 'byPeringkat', k); })); }) });

    S.push({ t: 'sec', text: '4. Program: ' + a.tahun + ' berbanding ' + b.tahun });
    var mapA = {}, mapB = {};
    a.programs.forEach(function (p) { mapA[normNamaProgram(p.nama)] = p.nama; });
    b.programs.forEach(function (p) { mapB[normNamaProgram(p.nama)] = p.nama; });
    var both = [], onlyA = [], onlyB = [];
    Object.keys(mapA).forEach(function (k) { (mapB[k] ? both : onlyA).push(mapA[k]); });
    Object.keys(mapB).forEach(function (k) { if (!mapA[k]) onlyB.push(mapB[k]); });
    var lst = function (x) { return x.length ? x.sort().join('; ') : '—'; };
    S.push({ t: 'para', label: 'Disertai kedua-dua sesi (' + both.length + ')', text: lst(both) });
    S.push({ t: 'para', label: 'Disertai ' + a.tahun + ' sahaja (' + onlyA.length + ')', text: lst(onlyA) });
    S.push({ t: 'para', label: 'Disertai ' + b.tahun + ' sahaja (' + onlyB.length + ')', text: lst(onlyB) });
    if (models.length > 2) S.push({ t: 'note', text: 'Perbandingan program dan lajur "Perubahan" hanya antara dua sesi terkini (' + a.tahun + ' dan ' + b.tahun + ').' });
    S.push({ t: 'note', text: 'Dijana pada ' + hariIni() + '. Program dipadan mengikut nama (tahun dibuang). Markah dikira dengan kaedah yang sama seperti ranking Dashboard.' });
    return S;
  }

  /* ───────────── PAPARAN HTML (pratonton + cetak) ───────────── */
  function renderHtml(spec) {
    var R = '#c0392b', out = '<div style="font-family:Arial,Helvetica,sans-serif;color:#222;">';
    spec.forEach(function (b) {
      if (b.t === 'title') {
        out += '<div style="text-align:center;padding-bottom:8pt;margin-bottom:10pt;border-bottom:2pt solid ' + R + ';">'
          + '<div style="margin-bottom:5pt;"><img src="' + (G.LOGO_FULL || '') + '" alt="" style="max-height:52px;max-width:170px;object-fit:contain;" onerror="this.style.display=\'none\'"></div>'
          + '<div style="font-size:13pt;font-weight:900;color:' + R + ';">' + E(b.title) + '</div>'
          + b.sub.map(function (s, i) { return '<div style="font-size:' + (i === 0 ? '11pt;font-weight:700' : '8.5pt;color:#666') + ';margin-top:2pt;">' + E(s) + '</div>'; }).join('')
          + '</div>';
      } else if (b.t === 'sec') {
        out += '<div style="font-size:9pt;font-weight:900;color:' + R + ';border-left:3pt solid ' + R + ';padding-left:5pt;margin:12pt 0 5pt;">' + E(b.text) + '</div>';
      } else if (b.t === 'sub') {
        out += '<div style="font-size:8.5pt;font-weight:800;color:#333;margin:9pt 0 3pt;page-break-after:avoid;">' + E(b.text) + '</div>';
      } else if (b.t === 'table') {
        out += '<table style="width:100%;border-collapse:collapse;margin-bottom:6pt;font-size:8pt;"><thead><tr>'
          + b.cols.map(function (c) { return '<th style="background:' + R + ';color:#fff;padding:3pt 5pt;text-align:center;vertical-align:middle;font-size:7.5pt;">' + E(c.h) + '</th>'; }).join('')
          + '</tr></thead><tbody>'
          + b.rows.map(function (row, i) {
            return '<tr style="background:' + (i % 2 ? '#fdf2f2' : '#fff') + ';page-break-inside:avoid;">'
              + row.map(function (v, j) { var c = b.cols[j]; return '<td style="padding:2.5pt 5pt;border:0.3pt solid #e5e5e5;vertical-align:middle;text-align:' + (c.a === 'r' ? 'right' : c.a === 'c' ? 'center' : 'left') + ';">' + E(v) + '</td>'; }).join('')
              + '</tr>';
          }).join('')
          + '</tbody></table>';
      } else if (b.t === 'para') {
        out += '<div style="margin:4pt 0 6pt;font-size:8pt;page-break-inside:avoid;"><div style="font-weight:800;color:' + R + ';">' + E(b.label) + '</div>'
          + '<div style="color:#444;line-height:1.35;">' + E(b.text).replace(/\n/g, '<br>') + '</div></div>';
      } else if (b.t === 'note') {
        out += '<div style="font-size:7.5pt;color:#777;margin:6pt 0;">' + E(b.text) + '</div>';
      }
    });
    return out + '</div>';
  }

  /* ───────────── PDF (pdf-lib — pendekatan sama dgn janaPdfSalinanPenyertaan) ───────────── */
  // Helvetica (WinAnsi) tak boleh kod aksara di luar Latin-1 — tukar kepada '?' supaya drawText tak gagal
  function safe(t) {
    return String(t == null ? '' : t)
      .replace(/[\r\t]+/g, ' ')
      .replace(/[^\n\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026]/g, '?');
  }

  async function renderPdf(spec) {
    var P = G.PDFLib, PDFDocument = P.PDFDocument, rgb = P.rgb, SF = P.StandardFonts;
    var doc = await PDFDocument.create();
    var fB = await doc.embedFont(SF.HelveticaBold), fR = await doc.embedFont(SF.Helvetica);
    var cRed = rgb(0.75, 0.22, 0.17), cRedLt = rgb(0.99, 0.95, 0.95), cDark = rgb(0.13, 0.13, 0.13),
      cGry = rgb(0.42, 0.42, 0.42), cLine = rgb(0.88, 0.88, 0.88), cWht = rgb(1, 1, 1);
    var PW = 595, PH = 842, LM = 36, RM = 36, TM = 40, BM = 46, AW = PW - LM - RM;
    var page, Y;
    function newPage() { page = doc.addPage([PW, PH]); Y = PH - TM; }
    newPage();
    function ensure(h) { if (Y - h < BM) { newPage(); return true; } return false; }
    function txt(t, x, y, size, font, col) { page.drawText(safe(t), { x: x, y: y, size: size, font: font || fR, color: col || cDark }); }
    function wrap(text, maxW, size, font) {
      var lines = [];
      String(safe(text)).split('\n').forEach(function (para) {
        var words = para.split(' '), cur = '';
        words.forEach(function (w) {
          var tryS = cur ? cur + ' ' + w : w;
          if (font.widthOfTextAtSize(tryS, size) <= maxW) { cur = tryS; return; }
          if (cur) { lines.push(cur); cur = ''; }
          while (font.widthOfTextAtSize(w, size) > maxW) {   // perkataan terlalu panjang: potong
            var i = w.length;
            while (i > 1 && font.widthOfTextAtSize(w.slice(0, i), size) > maxW) i--;
            lines.push(w.slice(0, i)); w = w.slice(i);
          }
          cur = w;
        });
        lines.push(cur);
      });
      return lines;
    }

    spec.forEach(function (b) {
      if (b.t === 'title') {
        ensure(70);
        txt(b.title, LM, Y - 14, 14, fB, cRed);
        var yy = Y - 14;
        b.sub.forEach(function (s, i) { yy -= 15; txt(s, LM, yy, i === 0 ? 11 : 8.5, i === 0 ? fB : fR, i === 0 ? cDark : cGry); });
        yy -= 8;
        page.drawLine({ start: { x: LM, y: yy }, end: { x: PW - RM, y: yy }, thickness: 1.6, color: cRed });
        Y = yy - 10;
      } else if (b.t === 'sec') {
        ensure(90);
        Y -= 8;
        page.drawRectangle({ x: LM, y: Y - 11, width: 3, height: 12, color: cRed });
        txt(b.text, LM + 8, Y - 9, 10, fB, cRed);
        Y -= 20;
      } else if (b.t === 'sub') {
        var sl = wrap(b.text, AW, 8.5, fB);
        ensure(sl.length * 11 + 14 + 40);   // tajuk kecil + tajuk jadual + sekurang-kurangnya sebaris kandungan
        Y -= 6;
        sl.forEach(function (ln) { txt(ln, LM, Y - 9, 8.5, fB, rgb(0.2, 0.2, 0.2)); Y -= 11; });
        Y -= 3;
      } else if (b.t === 'table') {
        var tw = b.cols.reduce(function (s, c) { return s + c.w; }, 0);
        var cw = b.cols.map(function (c) { return c.w / tw * AW; });
        var cx = []; cw.reduce(function (x, w, i) { cx[i] = x; return x + w; }, LM);
        var FS = 8, LH = 10, PAD = 3;
        var drawHead = function () {
          ensure(18);
          page.drawRectangle({ x: LM, y: Y - 14, width: AW, height: 14, color: cRed });
          b.cols.forEach(function (c, i) {
            var t = safe(c.h), w = fB.widthOfTextAtSize(t, 7.5), x = cx[i] + (cw[i] - w) / 2;   // tajuk sentiasa tengah
            txt(t, x, Y - 10, 7.5, fB, cWht);
          });
          Y -= 14;
        };
        drawHead();
        b.rows.forEach(function (row, ri) {
          var cells = row.map(function (v, i) {
            var L = wrap(v, cw[i] - PAD * 2, FS, fR);
            if (L.length > 6) { L = L.slice(0, 6); L[5] = L[5].slice(0, Math.max(0, L[5].length - 3)) + '...'; }
            return L;
          });
          var rh = Math.max.apply(null, cells.map(function (L) { return L.length; })) * LH + PAD * 2 - 1;
          if (Y - rh < BM) { newPage(); drawHead(); }
          if (ri % 2) page.drawRectangle({ x: LM, y: Y - rh, width: AW, height: rh, color: cRedLt });
          var maxL = Math.max.apply(null, cells.map(function (L) { return L.length; }));
          cells.forEach(function (L, i) {
            var c = b.cols[i], vo = (maxL - L.length) * LH / 2;   // tengah menegak
            L.forEach(function (ln, li) {
              var w = fR.widthOfTextAtSize(ln, FS), x = cx[i] + PAD;
              if (c.a === 'r') x = cx[i] + cw[i] - PAD - w; else if (c.a === 'c') x = cx[i] + (cw[i] - w) / 2;
              txt(ln, x, Y - PAD - FS - li * LH + 2 - vo, FS, fR, cDark);
            });
          });
          page.drawLine({ start: { x: LM, y: Y - rh }, end: { x: PW - RM, y: Y - rh }, thickness: 0.4, color: cLine });
          Y -= rh;
        });
        Y -= 8;
      } else if (b.t === 'para') {
        var ll = wrap(b.label, AW, 8.5, fB), tl = wrap(b.text, AW - 8, 8, fR);
        ensure(Math.min(ll.length * 11 + 12 + tl.length * 10, 120));
        ll.forEach(function (ln) { if (Y - 11 < BM) newPage(); txt(ln, LM, Y - 9, 8.5, fB, cRed); Y -= 11; });
        tl.forEach(function (ln) { if (Y - 10 < BM) newPage(); txt(ln, LM + 8, Y - 8, 8, fR, rgb(0.27, 0.27, 0.27)); Y -= 10; });
        Y -= 6;
      } else if (b.t === 'note') {
        var nl = wrap(b.text, AW, 7.5, fR);
        ensure(nl.length * 9 + 8);
        Y -= 4;
        nl.forEach(function (ln) { txt(ln, LM, Y - 7, 7.5, fR, cGry); Y -= 9; });
        Y -= 4;
      }
    });

    var pages = doc.getPages();
    pages.forEach(function (pg, i) {
      pg.drawLine({ start: { x: LM, y: BM - 14 }, end: { x: PW - RM, y: BM - 14 }, thickness: 0.4, color: cLine });
      pg.drawText('Sistem UPBM Subis - PPD Subis', { x: LM, y: BM - 26, size: 7, font: fR, color: cGry });
      var pn = 'Halaman ' + (i + 1) + ' / ' + pages.length;
      pg.drawText(pn, { x: PW - RM - fR.widthOfTextAtSize(pn, 7), y: BM - 26, size: 7, font: fR, color: cGry });
    });
    return await doc.save();
  }

  function muatTurunBytes(bytes, name, mime) {   // Blob + <a download> — sama dgn janaPdfSalinanPenyertaan
    var blob = new Blob([bytes], { type: mime || 'application/pdf' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }

  /* ───────────── KELOMPOK: semua sekolah, SATU fail PDF setiap sekolah (jangan gabung) ───────────── */
  function buildBatch(datas, years, mode, sekList) {   // datas sejajar dgn years (tahun terkini dahulu)
    var nm = {};
    (sekList || []).forEach(function (x) { nm[U(x.kod)] = x.nama; });
    var kodSet = {};
    datas.forEach(function (d) {
      ['penyertaan', 'pencapaian'].forEach(function (t) {
        (d[t] || []).forEach(function (r) { var k = U(r['Kod Sekolah']); if (k) kodSet[k] = 1; });
      });
    });
    var items = [];
    Object.keys(kodSet).forEach(function (k) {
      var nama = nm[k];
      for (var i = 0; i < datas.length && !nama; i++) {
        var r = (datas[i].penyertaan || []).filter(function (x) { return U(x['Kod Sekolah']) === k; })[0];
        if (r) nama = r['Nama Sekolah'];
      }
      nama = nama || k;
      var models = years.map(function (y, i) { return buildModel(k, nama, y, datas[i]); });
      if (!models.some(function (m) { return m.ringkas.nProgram > 0; })) return;   // tiada penyertaan langsung: langkau
      var slug = U(nama).replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40);
      items.push({
        kod: k, nama: nama, models: models,
        spec: mode === 'tunggal' ? specTunggal(models[0]) : specBanding(models),
        fileName: mode === 'tunggal'
          ? k + '_' + slug + '_LAPORAN_' + years[0] + '.pdf'
          : k + '_' + slug + '_PERBANDINGAN_' + years[years.length - 1] + '-' + years[0] + '.pdf'
      });
    });
    items.sort(function (a, b) { return String(a.nama).localeCompare(String(b.nama)); });
    return items;
  }

  function specSenaraiBatch(items, years, mode) {
    var S = [{ t: 'title', title: mode === 'tunggal' ? 'LAPORAN SEMUA SEKOLAH' : 'PERBANDINGAN SEMUA SEKOLAH',
      sub: [items.length + ' sekolah  —  satu fail PDF bagi setiap sekolah (dalam satu ZIP)', (mode === 'tunggal' ? 'Tahun: ' : 'Sesi: ') + years.join(' vs ')] }];
    S.push({
      t: 'table',
      cols: [{ h: 'Bil', w: .7, a: 'c' }, { h: 'Kod', w: 1.3, a: 'c' }, { h: 'Sekolah', w: 6 }, { h: 'Program', w: 1.2, a: 'c' },
        { h: 'Peserta', w: 1.2, a: 'c' }, { h: 'Pencapaian', w: 1.4, a: 'c' }, { h: 'Markah', w: 1.2, a: 'c' }],
      rows: items.map(function (it, i) { var r = it.models[0].ringkas; return [i + 1, it.kod, it.nama, r.nProgram, r.nPeserta, r.nPenc, r.skor]; })
    });
    S.push({ t: 'note', text: 'Lajur Program/Peserta/Pencapaian/Markah ialah untuk ' + years[0] + '. Tekan MUAT TURUN SEMUA (ZIP) untuk menjana fail PDF setiap sekolah.' });
    return S;
  }

  async function zipItems(items, Z, onProgress) {
    var zip = new Z(), gagal = [];
    for (var i = 0; i < items.length; i++) {
      if (onProgress) onProgress(i + 1, items.length);
      try { zip.file(items[i].fileName, await renderPdf(items[i].spec)); }
      catch (e) { gagal.push(items[i].nama + ': ' + (e && e.message ? e.message : e)); }
      await new Promise(function (r) { setTimeout(r, 0); });   // beri ruang UI bernafas
    }
    var bytes = await zip.generateAsync({ type: 'uint8array', compression: 'DEFLATE' });
    return { bytes: bytes, gagal: gagal };
  }

  /* ───────────── ANTARAMUKA (modal) ───────────── */
  function $(id) { return document.getElementById(id); }
  function msg(t, ty) { if (typeof G.toast === 'function') G.toast(t, ty || 'in'); }

  function ensureModal() {
    if ($('mo-lapsek')) return;
    var el = document.createElement('div');
    el.className = 'mo'; el.id = 'mo-lapsek';
    el.innerHTML =
      '<div class="md" style="max-width:900px;">'
      + '<div class="mh">📄 LAPORAN SEKOLAH</div>'
      + '<div id="ls-ctrl" style="display:flex;flex-wrap:wrap;gap:.6rem;align-items:flex-end;margin-bottom:.7rem;">'
      + '<div id="ls-sek-wrap" style="flex:1;min-width:220px;"></div>'
      + '<div><div style="font-size:.6rem;font-weight:800;color:var(--g5);margin-bottom:2px;">JENIS LAPORAN</div>'
      + '<select id="ls-jenis" class="dash-filter-sel" onchange="lsOnJenis()">'
      + '<option value="tunggal">Laporan Tahun (penyertaan &amp; pencapaian)</option>'
      + '<option value="banding">Perbandingan Sesi</option></select></div>'
      + '<div id="ls-thn-wrap"></div>'
      + '<button class="btn bp" id="ls-btn-jana" onclick="lsJana()">JANA LAPORAN</button>'
      + '</div>'
      + '<div id="ls-body" style="max-height:52vh;overflow-y:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--g2);border-radius:8px;padding:.9rem;background:#fff;">'
      + '<div style="font-size:.75rem;color:var(--g5);">Pilih jenis laporan dan tahun, kemudian tekan <b>JANA LAPORAN</b>.</div></div>'
      + '<div class="mt2 fx gu" style="flex-wrap:wrap;">'
      + '<button class="btn bp" id="ls-btn-pdf" onclick="lsPdf()" disabled>⬇ MUAT TURUN PDF</button>'
      + '<button class="btn bg" id="ls-btn-cetak" onclick="lsCetak()" disabled>🖨 CETAK</button>'
      + '<button class="btn bs" onclick="closeMo(\'mo-lapsek\')">TUTUP</button>'
      + '</div></div>';
    document.body.appendChild(el);
  }

  async function ladSenaraiTahun() {
    var list = [];
    try { var r = await G._supaDispatch('getTahunListGS', {}); list = (r && r.list) || []; } catch (e) { /* abaikan */ }
    var cur = new Date().getFullYear();
    if (list.indexOf(cur) < 0) list.unshift(cur);
    list = list.map(Number).filter(function (y) { return y > 0; }).sort(function (a, b) { return b - a; });
    LS.years = list;
  }

  function lsOnJenis() {
    var j = $('ls-jenis').value, w = $('ls-thn-wrap');
    LS.mode = j;
    if (j === 'tunggal') {
      var sel = Number(G._selTahun) || new Date().getFullYear();
      w.innerHTML = '<div style="font-size:.6rem;font-weight:800;color:var(--g5);margin-bottom:2px;">TAHUN</div>'
        + '<select id="ls-thn" class="dash-filter-sel">' + LS.years.map(function (y) { return '<option value="' + y + '"' + (y === sel ? ' selected' : '') + '>' + y + '</option>'; }).join('') + '</select>';
    } else {
      w.innerHTML = '<div style="font-size:.6rem;font-weight:800;color:var(--g5);margin-bottom:2px;">SESI (pilih 2 atau lebih)</div>'
        + '<div style="display:flex;gap:.7rem;flex-wrap:wrap;font-size:.75rem;">'
        + LS.years.map(function (y, i) { return '<label style="display:flex;gap:.25rem;align-items:center;"><input type="checkbox" class="ls-chk" value="' + y + '"' + (i < 2 ? ' checked' : '') + '>' + y + '</label>'; }).join('')
        + '</div>';
    }
  }

  async function openLaporanSekolah() {
    ensureModal();
    var s = G._sesi || {};
    var admin = s.role === 'admin';   // admin boleh pilih mana-mana sekolah (walaupun akaunnya dikaitkan dgn satu sekolah)
    var wrap = $('ls-sek-wrap');
    if (admin) {
      wrap.innerHTML = '<div style="font-size:.6rem;font-weight:800;color:var(--g5);margin-bottom:2px;">SEKOLAH</div><select id="ls-sek" class="dash-filter-sel" style="width:100%;"><option value="">Memuatkan...</option></select>';
      try {
        var r = await G._supaDispatch('getSekolahListGS', {});
        LS.sekList = (r && r.data) || [];
        $('ls-sek').innerHTML = '<option value="">— PILIH SEKOLAH —</option>'
          + '<option value="' + SEMUA + '">★ SEMUA SEKOLAH (satu fail setiap sekolah, ZIP)</option>'
          + LS.sekList.map(function (x) { return '<option value="' + E(x.kod) + '">' + E(x.nama) + ' (' + E(x.kod) + ')</option>'; }).join('');
      } catch (e) { $('ls-sek').innerHTML = '<option value="">Gagal memuatkan senarai sekolah</option>'; }
    } else {
      wrap.innerHTML = '<div style="font-size:.6rem;font-weight:800;color:var(--g5);margin-bottom:2px;">SEKOLAH</div><div style="font-weight:800;font-size:.8rem;">' + E(s.namaSekolah || '—') + ' <span style="color:var(--g5);font-weight:600;">(' + E(s.kodSekolah || '') + ')</span></div>';
    }
    await ladSenaraiTahun();
    $('ls-jenis').value = 'tunggal';
    lsOnJenis();
    LS.batch = null; LS.spec = null;
    $('ls-btn-pdf').disabled = true; $('ls-btn-cetak').disabled = true;
    $('ls-btn-pdf').textContent = '⬇ MUAT TURUN PDF';
    $('ls-body').innerHTML = '<div style="font-size:.75rem;color:var(--g5);">Pilih jenis laporan dan tahun, kemudian tekan <b>JANA LAPORAN</b>.</div>';
    G.openMo('mo-lapsek');
  }

  async function ambilData(y) {
    if (LS.cache[y]) return LS.cache[y];
    var d = await G._supaDispatch('getAllDataGS', { tahun: y });
    LS.cache[y] = d;
    return d;
  }

  async function lsJana() {
    var s = G._sesi || {}, kod, nama, semua = false;
    if (s.role === 'admin') {
      kod = ($('ls-sek') || {}).value || '';
      if (!kod) { msg('Sila pilih sekolah, atau "SEMUA SEKOLAH".', 'er'); return; }
      if (kod === SEMUA) { semua = true; nama = 'SEMUA SEKOLAH'; }
      else {
        var f = LS.sekList.filter(function (x) { return x.kod === kod; })[0];
        nama = f ? f.nama : kod;
      }
    } else { kod = s.kodSekolah; nama = s.namaSekolah || kod; }
    if (!kod) { msg('Kod sekolah tidak ditemui untuk akaun ini.', 'er'); return; }

    var years;
    if (LS.mode === 'tunggal') years = [Number($('ls-thn').value)];
    else {
      years = Array.prototype.slice.call(document.querySelectorAll('.ls-chk:checked')).map(function (c) { return Number(c.value); });
      if (years.length < 2) { msg('Pilih sekurang-kurangnya 2 sesi untuk perbandingan.', 'er'); return; }
    }
    years.sort(function (a, b) { return b - a; });

    var body = $('ls-body');
    body.innerHTML = '<div class="ld"><div class="sp"></div>Menjana laporan...</div>';
    $('ls-btn-pdf').disabled = true; $('ls-btn-cetak').disabled = true;
    try {
      if (semua) {
        var datas = [];
        for (var j = 0; j < years.length; j++) datas.push(await ambilData(years[j]));
        var items = buildBatch(datas, years, LS.mode, LS.sekList);
        if (!items.length) { body.innerHTML = '<div style="font-size:.78rem;color:var(--g5);">Tiada sekolah yang mempunyai penyertaan bagi tahun/sesi dipilih.</div>'; return; }
        LS.batch = { items: items, years: years };
        LS.spec = null;
        body.innerHTML = renderHtml(specSenaraiBatch(items, years, LS.mode));
        $('ls-btn-pdf').textContent = '⬇ MUAT TURUN SEMUA (ZIP)';
        $('ls-btn-pdf').disabled = false; $('ls-btn-cetak').disabled = true;
        return;
      }
      LS.batch = null;
      $('ls-btn-pdf').textContent = '⬇ MUAT TURUN PDF';
      var models = [];
      for (var i = 0; i < years.length; i++) {
        var d = await ambilData(years[i]);
        models.push(buildModel(kod, nama, years[i], d));
      }
      LS.models = models; LS.kod = kod; LS.nama = nama;
      if (LS.mode === 'tunggal') {
        LS.spec = specTunggal(models[0]);
        LS.fileName = 'LAPORAN_' + kod + '_' + years[0] + '.pdf';
      } else {
        LS.spec = specBanding(models);
        LS.fileName = 'PERBANDINGAN_' + kod + '_' + years[years.length - 1] + '-' + years[0] + '.pdf';
      }
      body.innerHTML = renderHtml(LS.spec);
      $('ls-btn-pdf').disabled = false; $('ls-btn-cetak').disabled = false;
    } catch (e) {
      console.warn('lsJana gagal:', e);
      body.innerHTML = '<div style="color:var(--red);font-size:.78rem;">Gagal menjana laporan: ' + E(e && e.message ? e.message : e) + '</div>';
    }
  }

  async function lsPdf() {
    if (LS.batch) {
      if (typeof G.JSZip === 'undefined') { msg('Pustaka ZIP tidak dimuatkan. Sila muat semula halaman.', 'er'); return; }
      var btn = $('ls-btn-pdf'), asal = btn.textContent;
      btn.disabled = true;
      try {
        var r = await zipItems(LS.batch.items, G.JSZip, function (i, n) { btn.textContent = 'Menjana ' + i + ' / ' + n + '...'; });
        var ys = LS.batch.years;
        muatTurunBytes(r.bytes, (LS.mode === 'tunggal' ? 'LAPORAN_SEMUA_SEKOLAH_' + ys[0] : 'PERBANDINGAN_SEMUA_SEKOLAH_' + ys[ys.length - 1] + '-' + ys[0]) + '.zip', 'application/zip');
        if (r.gagal.length) { console.warn('Sekolah gagal dijana:', r.gagal); msg((LS.batch.items.length - r.gagal.length) + ' fail dimuat turun; ' + r.gagal.length + ' sekolah gagal (lihat console).', 'er'); }
        else msg(LS.batch.items.length + ' fail PDF (satu setiap sekolah) dimuat turun dalam ZIP.', 'ok');
      } catch (e) {
        console.warn('ZIP gagal:', e);
        msg('Gagal menjana ZIP: ' + (e && e.message ? e.message : e), 'er');
      }
      btn.textContent = asal; btn.disabled = false;
      return;
    }
    if (!LS.spec) { msg('Sila jana laporan dahulu.', 'er'); return; }
    try {
      var bytes = await renderPdf(LS.spec);
      muatTurunBytes(bytes, LS.fileName);
      msg('PDF dimuat turun.', 'ok');
    } catch (e) {
      console.warn('lsPdf gagal:', e);
      msg('Gagal menjana PDF: ' + (e && e.message ? e.message : e), 'er');
    }
  }

  function lsCetak() {
    if (LS.batch) { msg('Cetak hanya untuk satu sekolah. Untuk semua sekolah, guna MUAT TURUN SEMUA (ZIP).', 'er'); return; }
    if (!LS.spec) { msg('Sila jana laporan dahulu.', 'er'); return; }
    var p = $('sdet-print-portal');
    if (!p) { msg('Cetak tidak tersedia. Sila guna MUAT TURUN PDF.', 'er'); return; }
    p.innerHTML = renderHtml(LS.spec);
    p.style.display = 'block';
    try { G.print(); }
    catch (e) { msg('Cetak tidak disokong dalam paparan ini (cth: Google Sites). Sila guna MUAT TURUN PDF.', 'er'); }
    p.style.display = 'none';
  }

  /* ───────────── eksport ───────────── */
  G.openLaporanSekolah = openLaporanSekolah;
  G.lsJana = lsJana; G.lsPdf = lsPdf; G.lsCetak = lsCetak; G.lsOnJenis = lsOnJenis;
  G.__LS = { buildBatch: buildBatch, specSenaraiBatch: specSenaraiBatch, zipItems: zipItems, buildModel: buildModel, specTunggal: specTunggal, specBanding: specBanding, renderHtml: renderHtml, renderPdf: renderPdf, safe: safe };
})(typeof window !== 'undefined' ? window : globalThis);
