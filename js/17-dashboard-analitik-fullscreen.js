// == BOTTOM NAV SYNC =============================================
function bnavSet(pg) {
  document.querySelectorAll('.bnav-item').forEach(function(b) {
    b.classList.remove('on');
  });
  var el = document.getElementById('bnav-' + pg);
  if (el) el.classList.add('on');
}

// == TUNJUK/SEMBUNYI butang Akaun dalam bottom nav ===============
function patchBnavAkaun() {
  var akunBtn = document.getElementById('bnav-akaun');
  if (!akunBtn) return;
  var isAdmin = window._sesi && window._sesi.role === 'admin';
  akunBtn.style.display = isAdmin ? 'flex' : 'none';
}
setTimeout(patchBnavAkaun, 900);

// == COUNTER ANIMASI untuk stat kad ==============================
function animateCounter(el, target, duration) {
  if (!el) return;
  duration = duration || 600;
  target = parseInt(target) || 0;
  // Token: setiap panggilan baharu membatalkan animasi lama pada elemen yang sama,
  // supaya animasi lama tidak menimpa nilai akhir yang lebih baharu.
  var token = (el._acTok = (el._acTok || 0) + 1);
  var start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target; return; }
  var startTime = null;
  function step(timestamp) {
    if (el._acTok !== token) return;
    if (!startTime) startTime = timestamp;
    var progress = Math.min((timestamp - startTime) / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + (target - start) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  }
  el.classList.add('animating');
  setTimeout(function() { el.classList.remove('animating'); }, 450);
  requestAnimationFrame(step);
}

// == TOGGLE KAD / SENARAI PADAT ==================================
function setView(mode) {
  if (mode === 'senarai') {
    document.body.classList.add('view-list');
    var vs = document.getElementById('vtog-senarai');
    var vk = document.getElementById('vtog-kad');
    if (vs) vs.classList.add('on');
    if (vk) vk.classList.remove('on');
    try { localStorage.setItem('upbm_view', 'senarai'); } catch(e) {}
  } else {
    document.body.classList.remove('view-list');
    var vs2 = document.getElementById('vtog-senarai');
    var vk2 = document.getElementById('vtog-kad');
    if (vk2) vk2.classList.add('on');
    if (vs2) vs2.classList.remove('on');
    try { localStorage.setItem('upbm_view', 'kad'); } catch(e) {}
  }
}

// Pulihkan pilihan view dari localStorage
(function() {
  try {
    var saved = localStorage.getItem('upbm_view');
    if (saved === 'senarai') {
      setTimeout(function() { setView('senarai'); }, 150);
    }
  } catch(e) {}
})();

// == FULLSCREEN WIDGET ===========================================
var _fsActive = false;
var _fsPrevFocus = null;

function openFullscreen(title, badge, contentEl) {
  var overlay = document.getElementById('fs-overlay');
  var fsTitle = document.getElementById('fs-title-text');
  var fsBadge = document.getElementById('fs-badge-text');
  var fsWrap  = document.getElementById('fs-content-wrap');
  if (!overlay || !fsWrap) return;

  // Clone content into fullscreen body
  fsWrap.innerHTML = '';
  if (typeof contentEl === 'string') {
    fsWrap.innerHTML = contentEl;
  } else if (contentEl && contentEl.cloneNode) {
    fsWrap.appendChild(contentEl.cloneNode(true));
  }

  if (fsTitle) fsTitle.textContent = title || 'PAPARAN PENUH';
  if (fsBadge) fsBadge.textContent = badge || 'UPBM';

  _fsPrevFocus = document.activeElement;
  overlay.classList.add('on');
  _moOpenCount++;
  document.body.classList.add('modal-open');
  _fsActive = true;

  // Focus trap: close on Escape
  document._fsKeyHandler = function(e) {
    if (e.key === 'Escape') closeFullscreen();
  };
  document.addEventListener('keydown', document._fsKeyHandler);
}

function closeFullscreen() {
  var overlay = document.getElementById('fs-overlay');
  if (!overlay) return;
  overlay.classList.remove('on');
  _fsActive = false;
  document.removeEventListener('keydown', document._fsKeyHandler);
  if (_fsPrevFocus && _fsPrevFocus.focus) _fsPrevFocus.focus();
  // Pulihkan scroll: guna _moOpenCount supaya tidak ganggu modal lain
  _moOpenCount = Math.max(0, _moOpenCount - 1);
  if (_moOpenCount === 0) {
    document.body.classList.remove('modal-open');
    // Paksa pulihkan overflow pada body & html sekiranya masih terkunci
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  }
  // Clear content after transition
  setTimeout(function() {
    var fsWrap = document.getElementById('fs-content-wrap');
    if (fsWrap && !_fsActive) fsWrap.innerHTML = '';
  }, 250);
}

// Helper: buka stat kad tertentu dalam fullscreen
function fsStatKad(statId, title) {
  var labelMap = {
    'st-pg':  { title: 'JUMLAH PROGRAM', badge: 'PROGRAM' },
    'st-ak':  { title: 'PROGRAM AKTIF', badge: 'AKTIF' },
    'st-py':  { title: 'PENYERTAAN UNIK (SEKOLAH × PROGRAM)', badge: 'PENYERTAAN' },
    'st-ps':  { title: 'JUMLAH PESERTA', badge: 'PESERTA' }
  };
  var info = labelMap[statId] || { title: title || 'STATISTIK', badge: 'STAT' };

  // Build fullscreen stat display
  var el = document.getElementById(statId);
  var val = el ? el.textContent : '—';
  var html = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;gap:1.2rem;">'
    + '<div style="font-family:Montserrat,sans-serif;font-size:8rem;font-weight:900;color:var(--g9);line-height:1;" id="fs-num-'+statId+'">'+val+'</div>'
    + '<div style="font-family:Montserrat,sans-serif;font-size:1.1rem;font-weight:700;color:var(--g5);text-transform:uppercase;letter-spacing:2px;">'+info.title+'</div>'
    + '</div>';
  openFullscreen(info.title, info.badge, html);
}

// Helper: buka paparan senarai program fullscreen
function fsProgSenarai() {
  var grid = document.getElementById('prog-list');
  if (!grid) { openFullscreen('SENARAI PROGRAM', 'PROGRAM', '<div class="empty"><div class="ei">📋</div><h3>Tiada data program.</h3></div>'); return; }
  openFullscreen('SENARAI PROGRAM', 'PROGRAM', grid.outerHTML);
}

// Helper: buka dashboard charts fullscreen
function fsDashboard() {
  var dash = document.getElementById('pg-dashboard');
  if (!dash) return;
  // Clone the inner content (without page wrapper)
  var inner = dash.cloneNode(true);
  inner.style.display = 'block';
  inner.removeAttribute('id');
  inner.classList.remove('pg','on');
  openFullscreen('DASHBOARD', 'DASH', inner.outerHTML);
}

// Tambah butang fullscreen pada stat kad selepas loadDash
function _addFsButtonsToStatKad() {
  var kadMap = {
    'st-pg': 'fsStatKad("st-pg")',
    'st-ak': 'fsStatKad("st-ak")',
    'st-py': 'fsStatKad("st-py")',
    'st-ps': 'fsStatKad("st-ps")'
  };
  Object.keys(kadMap).forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var sc = el.closest('.sc');
    if (!sc) return;
    if (sc.querySelector('.btn-fs')) return; // dah ada
    var btn = document.createElement('button');
    btn.className = 'btn-fs';
    btn.title = 'Paparan penuh';
    btn.innerHTML = '⛶';
    btn.setAttribute('onclick', kadMap[id]);
    sc.appendChild(btn);
  });
}

// Patch selepas loadDash selesai — tunggu DOM sedia
var _origLoadDash = window.loadDash;
if (typeof _origLoadDash === 'function') {
  window.loadDash = async function(bust) {
    var result = await _origLoadDash(bust);
    setTimeout(_addFsButtonsToStatKad, 500);
    return result;
  };
}
// Cuba terus jika dashboard sudah dimuatkan
setTimeout(_addFsButtonsToStatKad, 1200);

// Sync bnavAkaun selepas login
var _origMulakanSesi = window._mulakanSesi;
if (typeof _origMulakanSesi === 'function') {
  window._mulakanSesi = function(sesi) {
    _origMulakanSesi(sesi);
    setTimeout(patchBnavAkaun, 200);
  };
}


// ================================================================
// DASHBOARD ANALYTICS — FUNGSI BAHARU
// ================================================================

// ── State tapisan lanjutan ────────────────────────────────────
var _dashStatus   = 'all';   // 'all' | 'aktif' | 'draft' | 'tutup'
var _dashPeringkat = '';      // '' = semua
var _dashBulan     = '';      // '' = semua, '01'..'12'
var _dashSekolah   = '';      // '' = semua

// ── Populate sekolah dropdown dari data penyertaan ────────────
function _updateSekolahFilter(py) {
  var sel = document.getElementById('df-sekolah');
  if (!sel) return;
  var cur = sel.value;
  var seks = {};
  (py || []).forEach(function(p) { var s = p['Nama Sekolah']||''; if(s) seks[s]=1; });
  var sorted = Object.keys(seks).sort();
  sel.innerHTML = '<option value="">— SEMUA SEKOLAH —</option>';
  sorted.forEach(function(s) {
    var o = document.createElement('option');
    o.value = s; o.textContent = s.slice(0,32);
    if (s === cur) o.selected = true;
    sel.appendChild(o);
  });
}

// ── Status pill toggle ────────────────────────────────────────
function setStatusPill(val) {
  _dashStatus = val;
  ['all','aktif','draft','tutup'].forEach(function(k) {
    var el = document.getElementById('spill-'+k);
    if (el) el.classList.toggle('on', k === val);
  });
  rebuildDash();
}

// ── Apply all advanced filters & call rebuildDash ─────────────
function applyDashFilters() {
  _dashPeringkat = (document.getElementById('df-peringkat')||{}).value || '';
  _dashBulan     = (document.getElementById('df-bulan')||{}).value     || '';
  _dashSekolah   = (document.getElementById('df-sekolah')||{}).value   || '';
  _dashJenis     = (document.getElementById('df-jenis')||{}).value     || '';

  // Highlight active selects
  ['df-bidang','df-peringkat','df-bulan','df-sekolah','df-jenis'].forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('active-filter', !!el.value);
  });

  // Sync _dashBidang with select value (used by old filterByBidang helpers)
  var bidangSel = document.getElementById('df-bidang');
  if (bidangSel) {
    var bVal = bidangSel.value.toUpperCase();
    if (!bVal) {
      _dashBidang = 'semua';
    } else if (bVal === 'SUKAN') {
      _dashBidang = 'sukan';
    } else if (bVal === 'KOKURIKULUM') {
      _dashBidang = 'koku';
    } else {
      // SENI, BAHASA, STEM, PBB, LAIN-LAIN — treated as specific bidang
      _dashBidang = 'specific';
    }
  }
  rebuildDash();
}

// ── Reset semua tapisan ───────────────────────────────────────
function resetDashFilters(silent) {
  _dashBidang    = 'semua';
  _dashStatus    = 'all';
  _dashPeringkat = '';
  _dashBulan     = '';
  _dashSekolah   = '';
  _dashJenis     = '';

  // Reset selects
  ['df-bidang','df-peringkat','df-bulan','df-sekolah','df-jenis'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('active-filter'); }
  });

  // Reset status pills
  ['all','aktif','draft','tutup'].forEach(function(k) {
    var el = document.getElementById('spill-'+k);
    if (el) el.classList.toggle('on', k==='all');
  });

  // Reset old bidang buttons (keep them in sync)
  ['semua','sukan','koku'].forEach(function(m) {
    var btn = document.getElementById('dbf-'+m);
    if (!btn) return;
    btn.className = (m==='semua') ? 'btn bs bsm' : 'btn bw bsm';
    btn.style.fontWeight = (m==='semua') ? '800' : '';
  });

  // Reset toggle ranking SEMUA/SR/SM
  _rkJenisFilter = {sek:'SEMUA', pes:'SEMUA', guru:'SEMUA', pesAda:'SEMUA', pesTiada:'SEMUA', sekPenc:'SEMUA', sekPel:'SEMUA', guruAda:'SEMUA', guruTiada:'SEMUA'};
  document.querySelectorAll('.rk-seg').forEach(function(grp){
    Array.prototype.forEach.call(grp.children, function(b, i){ b.classList.toggle('on', i===0); });
  });

  if (!silent) rebuildDash();
}

// ── Master filter: programs ───────────────────────────────────
var BIDANG_KOKU_LIST = ['SENI','BAHASA','STEM','PBB'];

function _dfFilterProgs(arr) {
  var bidangSel = document.getElementById('df-bidang');
  var bVal = bidangSel ? bidangSel.value.toUpperCase() : '';

  return (arr||[]).filter(function(p) {
    // Jenis aktiviti (Projek 7): lalai = Teras sahaja; 'LUAR' = aktiviti luar sahaja; 'SEMUA' = kedua-duanya
    var _luarP = p['Aktiviti Luar'] === true;
    if (_dashJenis === 'LUAR' ? !_luarP : (_dashJenis !== 'SEMUA' && _luarP)) return false;
    // Bidang filter
    if (bVal) {
      var pBidang = (p['Bidang']||'').toUpperCase();
      if (bVal === 'KOKURIKULUM') {
        // Kokurikulum = STEM + SENI + BAHASA + PBB
        if (BIDANG_KOKU_LIST.indexOf(pBidang) < 0) return false;
      } else {
        if (pBidang !== bVal) return false;
      }
    }
    // Peringkat
    if (_dashPeringkat && (p['Peringkat']||'').toUpperCase() !== _dashPeringkat) return false;
    // Status pill
    if (_dashStatus !== 'all' && (p['Status']||'').toUpperCase() !== _dashStatus.toUpperCase()) return false;
    // Bulan (check tarikh program)
    if (_dashBulan && p['Tarikh']) {
      var d = new Date(p['Tarikh']);
      if (!isNaN(d.getTime())) {
        var mm = String(d.getMonth()+1).padStart(2,'0');
        if (mm !== _dashBulan) return false;
      }
    }
    return true;
  });
}

// ── Master filter: penyertaan (by linked program IDs) ─────────
function _dfFilterPny(pny, allPg) {
  var filteredPg = _dfFilterProgs(allPg);
  var okIds = {};
  filteredPg.forEach(function(p) { okIds[p['ID']] = 1; });
  return (pny||[]).filter(function(r) {
    if (!okIds[r['Program ID']]) return false;
    // Sekolah
    if (_dashSekolah && (r['Nama Sekolah']||'') !== _dashSekolah) return false;
    // Bulan daftar
    if (_dashBulan && r['Tarikh Daftar']) {
      var d = new Date(r['Tarikh Daftar']);
      if (!isNaN(d.getTime())) {
        var mm = String(d.getMonth()+1).padStart(2,'0');
        if (mm !== _dashBulan) return false;
      }
    }
    return true;
  });
}

// ── Master filter: pencapaian ─────────────────────────────────
function _dfFilterPnc(pnc, allPg) {
  var filteredPg = _dfFilterProgs(allPg);
  var okNms = {}, okIds = {};
  filteredPg.forEach(function(p) { okNms[p['Nama Program']]=1; okIds[p['ID']]=1; });
  // Padan ikut ID program (nama boleh sama antara program teras & luar); nama hanya jika ID tiada
  return (pnc||[]).filter(function(r) { return r['Program ID'] ? !!okIds[r['Program ID']] : !!okNms[r['Nama Program']]; });
}

// ── PANEL: AKTIVITI LUAR & SKOR KOMPREHENSIF (Projek 7) ───────
// Dikira berasingan daripada pilihan "Jenis aktiviti": panel sentiasa membandingkan Teras / Luar / Komprehensif
// (mengikut tapisan lain: bidang, peringkat, bulan, status, sekolah). Sekolah yang tidak menyertai aktiviti luar
// dipaparkan "—" (bukan 0) dan TIDAK dihukum dalam Skor Teras.
function _withJenis(j, fn) { var o = _dashJenis; _dashJenis = j; try { return fn(); } finally { _dashJenis = o; } }
function buildPanelLuar() {
  var el = document.getElementById('dash-luar'); if (!el) return;
  var head = '<div class="ch"><div class="dot"></div>🌐 AKTIVITI LUAR &amp; SKOR KOMPREHENSIF</div>';
  var note = function(t) { el.innerHTML = '<div class="card mb2">' + head + '<div class="cbody" style="padding:.7rem 1rem;font-size:.74rem;color:var(--g5);line-height:1.5;">' + t + '</div></div>'; };
  if (!(_aPg || []).some(function(p) { return p['Aktiviti Luar'] === true; })) {
    note('Tiada program ditanda sebagai <b>Aktiviti Luar</b>. Tandakan melalui ✏ EDIT program → <b>🌐 Aktiviti Luar</b>. Ranking di bawah ialah markah <b>Teras</b>.');
    return;
  }
  function sel(j) { return _withJenis(j, function() { return { pg: _dfFilterProgs(_aPg), py: _dfFilterPny(_aP, _aPg), pc: _dfFilterPnc(_aPnc, _aPg) }; }); }
  var L = sel('LUAR'), A = sel('SEMUA'), T = sel('');
  if (!L.pg.length) { note('Tiada aktiviti luar yang sepadan dengan tapisan semasa.'); return; }
  var skL = getSkor(L.pc, 'Nama Sekolah', L.py, L.pg),
      skA = getSkor(A.pc, 'Nama Sekolah', A.py, A.pg),
      skT = getSkor(T.pc, 'Nama Sekolah', T.py, T.pg);
  var sekSemua = {}; A.py.forEach(function(r) { if (r['Nama Sekolah']) sekSemua[r['Nama Sekolah']] = 1; });
  var nPenc = L.pc.filter(function(r) { return r['Tempat']; }).length, markahLuar = 0;
  var rows = Object.keys(skA).map(function(k) {
    var t = skT[k] ? skT[k].total : 0, kom = skA[k].total, l = skL[k], pr = {};
    if (l) l.detail.forEach(function(d) { pr[d.progId] = 1; });
    markahLuar += (kom - t);
    return { nm: k, t: t, kom: kom, lu: kom - t, ada: !!l, nProg: Object.keys(pr).length,
             penc: L.pc.filter(function(r) { return r['Nama Sekolah'] === k && r['Tempat']; }).length };
  }).sort(function(a, b) { return b.kom - a.kom || a.nm.localeCompare(b.nm); });
  var kpi = function(ico, cls, num, lbl) { return '<div class="sc"><div class="sico ' + cls + '">' + ico + '</div><div><div class="snum">' + num + '</div><div class="slbl">' + lbl + '</div></div></div>'; };
  var dasar = 'Dasar markah aktiviti luar: <b>pencapaian ikut Jadual Markah</b> + pelibatan <b>'
    + ({ TIADA: 'tiada (0)', SETENGAH: '50%', PENUH: 'penuh' }[LUAR_POLISI.pelibatan] || LUAR_POLISI.pelibatan)
    + '</b>; had: <b>' + (LUAR_POLISI.had == null ? 'tiada' : LUAR_POLISI.had + ' mata') + '</b>. '
    + 'Sekolah yang tidak menyertai ditunjuk “—” dan tidak dikenakan penalti dalam Skor Teras.';
  var td = 'padding:.22rem .4rem;border-bottom:1px solid var(--g2);';
  var body = rows.map(function(r, i) {
    return '<tr style="' + (r.ada ? '' : 'color:var(--g5);') + '">'
      + '<td style="' + td + 'text-align:center;">' + (i + 1) + '</td>'
      + '<td style="' + td + 'font-weight:' + (r.ada ? '800' : '500') + ';">' + esc(r.nm) + '</td>'
      + '<td style="' + td + 'text-align:center;">' + (r.ada ? r.nProg : '—') + '</td>'
      + '<td style="' + td + 'text-align:center;">' + (r.ada ? r.penc : '—') + '</td>'
      + '<td style="' + td + 'text-align:center;">' + r.t + '</td>'
      + '<td style="' + td + 'text-align:center;">' + (r.ada ? r.lu : '—') + '</td>'
      + '<td style="' + td + 'text-align:center;font-weight:900;color:var(--red);">' + r.kom + '</td></tr>';
  }).join('');
  var th = 'padding:.3rem .4rem;background:var(--red);color:#fff;font-size:.6rem;text-align:center;position:sticky;top:0;';
  el.innerHTML = '<div class="card mb2">' + head + '<div class="cbody" style="padding:.7rem 1rem;">'
    + '<div class="sgrid" style="margin-bottom:.7rem;">'
    + kpi('🌐', 'ir', L.pg.length, 'Program Luar')
    + kpi('🏫', 'ig', Object.keys(skL).length + ' / ' + Object.keys(sekSemua).length, 'Sekolah Menyertai')
    + kpi('🏅', 'ib', nPenc, 'Pencapaian Luar')
    + kpi('⭐', 'io', markahLuar, 'Markah Luar')
    + '</div>'
    + '<div style="font-size:.64rem;color:var(--g5);margin-bottom:.45rem;line-height:1.5;">' + dasar + '</div>'
    + '<div style="max-height:360px;overflow:auto;border:1px solid var(--g2);border-radius:8px;">'
    + '<table style="width:100%;border-collapse:collapse;font-size:.7rem;"><thead><tr>'
    + ['#', 'Sekolah', 'Aktiviti Luar', 'Pencapaian Luar', 'Markah Teras', 'Markah Luar', 'Skor Komprehensif'].map(function(h) { return '<th style="' + th + '">' + h + '</th>'; }).join('')
    + '</tr></thead><tbody>' + body + '</tbody></table></div></div></div>';
}

// ── CARTA: BIDANG (bar) ───────────────────────────────────────
function buildChartBidang(py, pg) {
  var el = document.getElementById('ch-bidang');
  if (!el) return;
  // Count peserta by bidang
  var progBidang = {};
  (pg||[]).forEach(function(p) { progBidang[p['ID']] = (p['Bidang']||'LAIN-LAIN').toUpperCase(); });
  var counts = {};
  (py||[]).forEach(function(r) {
    var b = progBidang[r['Program ID']] || 'LAIN-LAIN';
    counts[b] = (counts[b]||0) + 1;
  });
  if (!Object.keys(counts).length) {
    el.innerHTML = '<div class="empty"><div class="ei">📊</div><h3>Tiada data</h3></div>'; return;
  }
  var colors = {'SUKAN':'#c0392b','SENI':'#8e44ad','BAHASA':'#2980b9','STEM':'#27ae60','PBB':'#e67e22','LAIN-LAIN':'#7f8c8d'};
  var sorted = Object.entries(counts).sort(function(a,b){return b[1]-a[1];});
  var mx = sorted[0][1] || 1;
  var html = '<div class="bcc">' + sorted.map(function(e) {
    var col = colors[e[0]] || '#c0392b';
    return '<div class="br">'
      + '<div class="bl" title="'+e[0]+'">'+e[0].slice(0,14)+(e[0].length>14?'…':'')+'</div>'
      + '<div class="bt"><div class="bf" style="width:'+(e[1]/mx*100).toFixed(1)+'%;background:'+col+';"></div></div>'
      + '<div class="bv">'+e[1]+'</div></div>';
  }).join('') + '</div>';
  el.innerHTML = html;
}

// ── CARTA: DONUT STATUS ───────────────────────────────────────
function buildChartDonut(pg) {
  var el = document.getElementById('ch-donut');
  if (!el) return;
  var counts = { AKTIF:0, DRAFT:0, TUTUP:0 };
  (pg||[]).forEach(function(p) {
    var s = (p['Status']||'AKTIF').toUpperCase();
    if (counts[s] !== undefined) counts[s]++;
    else counts['AKTIF']++;
  });
  var total = counts.AKTIF + counts.DRAFT + counts.TUTUP;
  if (!total) { el.innerHTML = '<div class="empty"><div class="ei">🍩</div><h3>Tiada data</h3></div>'; return; }

  var colors = { AKTIF:'#27ae60', DRAFT:'#f39c12', TUTUP:'#c0392b' };
  var labels = { AKTIF:'Aktif', DRAFT:'Draft', TUTUP:'Tutup' };
  var r = 52, cx = 70, cy = 70, stroke = 22;
  var circ = 2 * Math.PI * r;
  var offset = 0;
  var segs = '';
  ['AKTIF','DRAFT','TUTUP'].forEach(function(k) {
    if (!counts[k]) return;
    var pct = counts[k] / total;
    var dash = (pct * circ).toFixed(2);
    var gap  = (circ - pct * circ).toFixed(2);
    segs += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="'+colors[k]+'" stroke-width="'+stroke+'" stroke-dasharray="'+dash+' '+gap+'" stroke-dashoffset="'+(-offset).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cy+')" stroke-linecap="butt"/>';
    offset += pct * circ;
  });
  var svgH = '<svg viewBox="0 0 140 140" width="130" height="130" style="flex-shrink:0;">'
    + segs
    + '<text x="'+cx+'" y="'+(cy+5)+'" text-anchor="middle" font-family="Montserrat,sans-serif" font-size="18" font-weight="900" fill="#343a40">'+total+'</text>'
    + '<text x="'+cx+'" y="'+(cy+17)+'" text-anchor="middle" font-family="Open Sans,sans-serif" font-size="8" fill="#adb5bd">PROGRAM</text>'
    + '</svg>';
  var legend = '<div class="donut-legend">'
    + ['AKTIF','DRAFT','TUTUP'].map(function(k) {
        var pct = total ? (counts[k]/total*100).toFixed(0)+'%' : '0%';
        return '<div class="donut-legend-item"><div class="donut-dot" style="background:'+colors[k]+';"></div>'
          + '<span>'+labels[k]+' ('+counts[k]+')</span>'
          + '<span class="donut-pct">'+pct+'</span></div>';
      }).join('')
    + '</div>';
  el.innerHTML = '<div class="donut-wrap">' + svgH + legend + '</div>';
}

// ── CARTA: TREND BULANAN (garisan SVG) ────────────────────────
function buildChartTrend(py, pg) {
  var el = document.getElementById('ch-trend');
  if (!el) return;

  // Build progId → tarikh map
  var progTar = {};
  (pg||[]).forEach(function(p) { if(p['Tarikh']) progTar[p['ID']] = p['Tarikh']; });

  var monthly = {};
  (py||[]).forEach(function(r) {
    var tar = progTar[r['Program ID']] || r['Tarikh Daftar'] || '';
    if (!tar) return;
    var d = new Date(tar);
    if (isNaN(d.getTime())) return;
    var key = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    monthly[key] = (monthly[key]||0) + 1;
  });

  var keys = Object.keys(monthly).sort();
  if (keys.length < 1) { el.innerHTML = '<div class="empty"><div class="ei">📈</div><h3>Tiada data trend</h3></div>'; return; }

  // Pad to show at least 6 points
  if (keys.length === 1) { keys.unshift(keys[0]); keys.push(keys[keys.length-1]); }
  var vals = keys.map(function(k){ return monthly[k]||0; });
  var mx = Math.max.apply(null, vals) || 1;

  // SVG line chart
  var W=340, H=110, padL=28, padR=12, padT=14, padB=28;
  var cW = W - padL - padR, cH = H - padT - padB;
  var n = keys.length;

  function px(i){ return padL + (i/(n-1||1)) * cW; }
  function py2(v){ return padT + cH - (v/mx) * cH; }

  // Path
  var pts = keys.map(function(k,i){ return px(i)+','+py2(monthly[k]||0).toFixed(1); }).join(' ');
  var fillPts = 'M'+padL+','+(padT+cH)+' L'+keys.map(function(k,i){return px(i)+','+py2(monthly[k]||0).toFixed(1);}).join(' L')+' L'+(padL+cW)+','+(padT+cH)+' Z';

  // Y-axis labels
  var yLabels = [0, Math.round(mx/2), mx].map(function(v,i){
    var yy = py2(v).toFixed(1);
    return '<text x="'+(padL-4)+'" y="'+yy+'" text-anchor="end" font-size="7" fill="#adb5bd" dominant-baseline="middle">'+v+'</text>';
  }).join('');

  // X-axis labels (max 6 shown)
  var step = Math.ceil(n/6);
  var xLabels = keys.filter(function(_,i){ return i%step===0||i===n-1; }).map(function(k,_,arr){
    var i = keys.indexOf(k);
    var lbl = k.slice(5); // MM
    var mnms = ['','Jan','Feb','Mac','Apr','Mei','Jun','Jul','Ogs','Sep','Okt','Nov','Dis'];
    lbl = mnms[parseInt(lbl,10)]||lbl;
    return '<text x="'+px(i).toFixed(1)+'" y="'+(H-8)+'" text-anchor="middle" font-size="7" fill="#adb5bd">'+lbl+'</text>';
  }).join('');

  // Dots
  var dots = keys.map(function(k,i){
    var v = monthly[k]||0;
    return '<circle cx="'+px(i).toFixed(1)+'" cy="'+py2(v).toFixed(1)+'" r="3.5" fill="#c0392b" stroke="#fff" stroke-width="1.5">'
      + '<title>'+k+': '+v+'</title></circle>';
  }).join('');

  var svg = '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;height:auto;" xmlns="http://www.w3.org/2000/svg">'
    + '<defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#c0392b" stop-opacity=".18"/><stop offset="100%" stop-color="#c0392b" stop-opacity="0"/></linearGradient></defs>'
    + '<path d="'+fillPts+'" fill="url(#tg)"/>'
    + '<polyline points="'+pts+'" fill="none" stroke="#c0392b" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    + yLabels + xLabels + dots
    + '</svg>';

  el.innerHTML = '<div class="svg-wrap">'+svg+'</div>';
}

// ── CARTA: JANTINA MENGIKUT PERINGKAT (grouped bar) ───────────
function buildChartJantina(py, pg) {
  var el = document.getElementById('ch-jantina');
  if (!el) return;

  // Map progId → peringkat
  var progPer = {};
  (pg||[]).forEach(function(p) { progPer[p['ID']] = (p['Peringkat']||'SEKOLAH').toUpperCase(); });

  var perOrder = ['SEKOLAH','DAERAH','BAHAGIAN','NEGERI','KEBANGSAAN','ANTARABANGSA'];
  var data = {}; // per → {L:0, P:0}
  perOrder.forEach(function(k){ data[k] = {L:0,P:0}; });

  (py||[]).forEach(function(r) {
    var per = progPer[r['Program ID']] || 'SEKOLAH';
    if (!data[per]) data[per] = {L:0,P:0};
    var j = (r['Jantina Peserta']||'').toUpperCase();
    if (j==='LELAKI'||j==='L') data[per].L++;
    else if (j==='PEREMPUAN'||j==='P') data[per].P++;
  });

  // Filter to only peringkat with data
  var active = perOrder.filter(function(k){ return data[k].L||data[k].P; });
  if (!active.length) { el.innerHTML = '<div class="empty"><div class="ei">⚤</div><h3>Tiada data jantina</h3></div>'; return; }

  var mx = 0;
  active.forEach(function(k){ mx = Math.max(mx, data[k].L, data[k].P); });
  mx = mx || 1;

  // Simple horizontal grouped bar
  var html = '<div style="padding:.2rem 0;">';
  html += '<div style="display:flex;gap:.6rem;margin-bottom:.55rem;font-size:.6rem;font-weight:700;">'
    + '<span style="display:flex;align-items:center;gap:.25rem;"><span style="width:9px;height:9px;border-radius:2px;background:#2980b9;display:inline-block;"></span>LELAKI</span>'
    + '<span style="display:flex;align-items:center;gap:.25rem;"><span style="width:9px;height:9px;border-radius:2px;background:#e84393;display:inline-block;"></span>PEREMPUAN</span>'
    + '</div>';

  active.forEach(function(per) {
    var d = data[per];
    // ISU 2 FIX: Jangan potong label — papar nama peringkat penuh
    var lblMap = {
      'SEKOLAH':'SEKOLAH', 'DAERAH':'DAERAH', 'BAHAGIAN':'BAHAGIAN',
      'NEGERI':'NEGERI', 'KEBANGSAAN':'KEBANGSAAN', 'ANTARABANGSA':'ANTBANGSA'
    };
    var lbl = lblMap[per] || per;
    html += '<div style="margin-bottom:.45rem;">'
      + '<div style="font-size:.62rem;font-weight:700;color:var(--g6);margin-bottom:.2rem;">'+lbl+'</div>'
      + '<div style="display:flex;flex-direction:column;gap:.16rem;">'
      // Lelaki bar
      + '<div style="display:flex;align-items:center;gap:.38rem;">'
      + '<div style="width:12px;font-size:.58rem;color:#2980b9;font-weight:700;text-align:right;">L</div>'
      + '<div style="flex:1;background:var(--g1);border-radius:3px;height:7px;overflow:hidden;">'
      + '<div style="width:'+(d.L/mx*100).toFixed(1)+'%;height:100%;background:#2980b9;border-radius:3px;"></div></div>'
      + '<div style="font-size:.6rem;color:var(--g6);font-weight:700;min-width:20px;">'+d.L+'</div></div>'
      // Perempuan bar
      + '<div style="display:flex;align-items:center;gap:.38rem;">'
      + '<div style="width:12px;font-size:.58rem;color:#e84393;font-weight:700;text-align:right;">P</div>'
      + '<div style="flex:1;background:var(--g1);border-radius:3px;height:7px;overflow:hidden;">'
      + '<div style="width:'+(d.P/mx*100).toFixed(1)+'%;height:100%;background:#e84393;border-radius:3px;"></div></div>'
      + '<div style="font-size:.6rem;color:var(--g6);font-weight:700;min-width:20px;">'+d.P+'</div></div>'
      + '</div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// ── JADUAL PROGRAM DENGAN BADGE STATUS ───────────────────────
function buildProgTable(pg, py) {
  var tbody = document.getElementById('prog-tbl-body');
  if (!tbody) return;

  // Count sekolah & peserta per program
  var sekCount = {}, pesCount = {};
  (py||[]).forEach(function(r) {
    var pid = r['Program ID'];
    if (!pid) return;
    var sekKey = pid+'|'+(r['Nama Sekolah']||'');
    sekCount[pid] = sekCount[pid] || {};
    sekCount[pid][sekKey] = 1;
    if (r['Nama Peserta']) pesCount[pid] = (pesCount[pid]||0)+1;
  });

  var statusCls = { 'AKTIF':'s-aktif', 'DRAFT':'s-draft', 'TUTUP':'s-tutup' };
  var frag = document.createDocumentFragment();

  if (!pg || !pg.length) {
    var empty = document.createElement('tr');
    empty.innerHTML = '<td colspan="7"><div class="empty"><div class="ei">📋</div><h3>Tiada program</h3></div></td>';
    frag.appendChild(empty);
    tbody.innerHTML = ''; tbody.appendChild(frag); return;
  }

  pg.forEach(function(p) {
    var st = (p['Status']||'AKTIF').toUpperCase();
    var cls = statusCls[st] || 's-aktif';
    var sek = sekCount[p['ID']] ? Object.keys(sekCount[p['ID']]).length : 0;
    var pes = pesCount[p['ID']] || 0;
    var tr = document.createElement('tr');
    tr.innerHTML = '<td><div class="ptbl-nama" title="'+esc(p['Nama Program']||'')+'">'+esc(p['Nama Program']||'—')+(p['Aktiviti Luar']===true?' <span class="luar-tag">🌐 LUAR</span>':'')
      + '<div class="ptbl-sub">'+esc(p['Pengelola']||'')+'</div></div></td>'
      + '<td>'+esc(p['Bidang']||'—')+'</td>'
      + '<td>'+esc(p['Peringkat']||'—')+'</td>'
      + '<td style="white-space:nowrap;">'+fd(p['Tarikh'])+'</td>'
      + '<td><span class="ptbl-status '+cls+'">'+st+'</span></td>'
      + '<td style="text-align:center;font-weight:700;color:var(--g8);">'+sek+'</td>'
      + '<td style="text-align:center;font-weight:700;color:var(--red);">'+pes+'</td>';
    frag.appendChild(tr);
  });
  tbody.innerHTML = '';
  tbody.appendChild(frag);
}

// ── FULLSCREEN untuk carta spesifik ──────────────────────────
function fsChart(elId, title) {
  var el = document.getElementById(elId);
  if (!el) return;
  var cloned = el.cloneNode(true);
  cloned.id = elId + '-fs';
  cloned.style.cssText = 'padding:1rem 0;';
  var wrap = document.createElement('div');
  wrap.className = 'card';
  wrap.style.cssText = 'margin:0;border-radius:0;border:none;box-shadow:none;';
  wrap.appendChild(cloned);
  openFullscreen(title, 'CARTA', wrap.outerHTML);
}

// ── FULLSCREEN jadual program ─────────────────────────────────
function fsProgTable() {
  var wrap = document.getElementById('prog-tbl-wrap');
  if (!wrap) return;
  openFullscreen('SENARAI PROGRAM', 'PROGRAM', wrap.outerHTML);
}

// ══ NATIVE BROWSER FULLSCREEN API ═══════════════════════════════════════════
// toggleNativeFullscreen(elId) — minta/keluar skrin penuh sebenar pada elemen
// Jika elId tidak diberikan, gunakan seluruh dokumen (document.documentElement)

var _nativeFsElId = null; // simpan ID elemen yang sedang dalam fullscreen

function toggleNativeFullscreen(elId) {
  // Semak sama ada fullscreen sedang aktif
  var fsEl = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement;

  if (fsEl) {
    // Keluar dari fullscreen
    var exitFn = document.exitFullscreen
      || document.webkitExitFullscreen
      || document.mozCancelFullScreen
      || document.msExitFullscreen;
    if (exitFn) {
      try { exitFn.call(document); } catch(e) { console.warn('exitFullscreen gagal:', e); }
    }
    return;
  }

  // BUG FIX #1: fs-overlay adalah position:fixed — fullscreen pada documentElement
  // supaya kandungan overlay kelihatan betul dalam native fullscreen.
  // Jika elId adalah 'fs-overlay', gunakan documentElement sebagai gantinya.
  var targetId = (elId === 'fs-overlay') ? null : elId;
  var target = targetId ? document.getElementById(targetId) : document.documentElement;
  if (!target) target = document.documentElement;

  var reqFn = target.requestFullscreen
    || target.webkitRequestFullscreen
    || target.mozRequestFullScreen
    || target.msRequestFullscreen;

  if (!reqFn) {
    toast('Skrin penuh tidak disokong pada pelayar ini.', 'er');
    return;
  }

  _nativeFsElId = elId || null;

  // BUG FIX #2: mozRequestFullScreen & msRequestFullscreen pulangkan void, bukan Promise.
  // Guna try/catch + Promise.resolve() untuk tangani kedua-dua kes dengan selamat.
  try {
    var result = reqFn.call(target);
    if (result && typeof result.catch === 'function') {
      result.catch(function(err) {
        console.warn('Fullscreen ditolak:', err);
        toast('Skrin penuh tidak dapat diaktifkan.', 'er');
      });
    }
  } catch(e) {
    console.warn('Fullscreen exception:', e);
    toast('Skrin penuh tidak disokong pada pelayar ini.', 'er');
  }
}

// Pantau perubahan state fullscreen — kemaskini semua butang
function _onFsChange() {
  var fsEl = document.fullscreenElement
    || document.webkitFullscreenElement
    || document.mozFullScreenElement
    || document.msFullscreenElement;
  var isFs = !!fsEl;

  // Butang dalam overlay
  var btnOverlay = document.getElementById('btn-fs-native-overlay');
  if (btnOverlay) {
    btnOverlay.textContent = isFs ? '⊡ KELUAR PENUH' : '⛶ SKRIN PENUH';
    btnOverlay.classList.toggle('active', isFs);
  }

  // Butang dalam halaman dashboard
  var btnDash = document.getElementById('btn-dash-native-fs');
  if (btnDash) {
    btnDash.textContent = isFs ? '⊡ KELUAR PENUH' : '⛶ SKRIN PENUH';
    btnDash.classList.toggle('active', isFs);
  }

  // Pulihkan scroll apabila keluar native fullscreen
  if (!isFs) {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    // Jika tiada modal/overlay lain aktif, buang modal-open
    if (_moOpenCount === 0) {
      document.body.classList.remove('modal-open');
    }
  }
}

// Daftar listener untuk semua vendor prefix
['fullscreenchange','webkitfullscreenchange','mozfullscreenchange','MSFullscreenChange'].forEach(function(evt) {
  document.addEventListener(evt, _onFsChange);
});

// == UP ARROW — tunjuk selepas scroll 200px ======================
(function(){
  var btn=null;
  function _checkScroll(){
    if(!btn) return;
    // Semak scroll pada window DAN pada pg-dashboard (untuk native fullscreen)
    var scrolled = window.scrollY > 200;
    var dashEl = document.getElementById('pg-dashboard');
    if(dashEl) scrolled = scrolled || dashEl.scrollTop > 200;
    if(scrolled) btn.classList.add('visible');
    else btn.classList.remove('visible');
  }
  function _scrollToTop(){
    // Scroll window dan pg-dashboard sekaligus
    window.scrollTo({top:0, behavior:'smooth'});
    var dashEl = document.getElementById('pg-dashboard');
    if(dashEl && dashEl.scrollTop > 0) dashEl.scrollTo({top:0, behavior:'smooth'});
  }
  function _init(){
    btn=document.getElementById('up-arrow-btn');
    if(!btn)return;
    window.addEventListener('scroll',_checkScroll,{passive:true});
    // Pantau scroll pada pg-dashboard juga (untuk native fullscreen)
    var dashEl=document.getElementById('pg-dashboard');
    if(dashEl) dashEl.addEventListener('scroll',_checkScroll,{passive:true});
    // Override onclick jika ada
    btn.addEventListener('click',_scrollToTop);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',_init);
  else _init();
})();

// P3: F11 dashboard fullscreen dibuang.

