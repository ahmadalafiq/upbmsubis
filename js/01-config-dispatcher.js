// ================================================================
// == SUPABASE CONFIG & CLIENT ===================================
// ================================================================
var SUPABASE_URL = 'https://pztuvriqjgfwczkuguky.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB6dHV2cmlxamdmd2N6a3VndWt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxNDY4NjksImV4cCI6MjA5OTcyMjg2OX0.k6Y84-6C4pD7xXSD7gaVGBiVimhKi6eNjQ3H-DrVQqY';
var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Kod induk untuk log masuk admin tanpa PIN (mod "adminKod" pada skrin log masuk).
// TUKAR nilai ini kepada kod rahsia anda sendiri sebelum deploy ke production.
// ADMIN_MASTER_KOD dah dipindah ke jadual app_secrets di Supabase — disemak via RPC login_admin()

// Nama jadual Supabase — kekalkan seperti skema SQL anda. Tukar di sini sahaja
// jika nama jadual sebenar anda berbeza.
var TBL_PROGRAM    = 'programs';
var TBL_PENYERTAAN = 'penyertaan';
var TBL_PENCAPAIAN = 'pencapaian';
var TBL_PENGGUNA   = 'pengguna';
var TBL_SEKOLAH     = 'sekolah'; // jadual rujukan utama nama & kod sekolah (elak duplikat ejaan)

// == PEMETAAN BARIS PANGKALAN DATA <-> OBJEK UI (kekalkan nama medan Melayu sedia ada) ==
function _mapProgramOut(r){
  if(!r) return null;
  var nm = r.nama_program || r.nama || r['Nama Program'] || '';
  if(nm === 'undefined' || nm === 'null') nm = 'PROGRAM TANPA NAMA';
  return {
    'ID': r.id || r['ID'] || '',
    'Nama Program': nm || 'PROGRAM TANPA NAMA',
    'Pengelola': r.pengelola || r['Pengelola'] || '',
    'Kod Pengelola': r.kod_pengelola || r['Kod Pengelola'] || '',
    'Bidang': r.bidang || r['Bidang'] || '',
    'Kategori': r.kategori || r['Kategori'] || '',
    'Peringkat': r.peringkat || r['Peringkat'] || '',
    'Tarikh': r.tarikh || r['Tarikh'] || '',
    'Tempat': r.tempat || r['Tempat'] || '',
    'Status': r.status || r['Status'] || '',
    'Tahun': r.tahun || r['Tahun'] || '',
    'Aktiviti Luar': (r.aktiviti_luar === true || r.aktiviti_luar === 'true' || r['Aktiviti Luar'] === true)
  };
}
function _mapPenyertaanOut(r){
  if(!r) return null;
  var nm = r.nama_program || r.nama || r['Nama Program'] || '';
  if(nm === 'undefined' || nm === 'null') nm = 'PROGRAM TANPA NAMA';
  return {
    'ID': r.id || r['ID'] || '',
    'Program ID': r.program_id || r['Program ID'] || '',
    'Nama Program': nm || 'PROGRAM TANPA NAMA',
    'Kod Sekolah': r.kod_sekolah || r['Kod Sekolah'] || '',
    'Nama Sekolah': r.nama_sekolah || r['Nama Sekolah'] || '',
    'Kategori Penyertaan': r.kategori_penyertaan || r['Kategori Penyertaan'] || '',
    'Nama Guru': r.nama_guru || r['Nama Guru'] || '',
    'No KP Guru': r.no_kp_guru || r['No KP Guru'] || '',
    'Bangsa Guru': r.bangsa_guru || r['Bangsa Guru'] || '',
    'Jantina Guru': r.jantina_guru || r['Jantina Guru'] || '',
    'No Tel Guru': r.no_tel_guru || r['No Tel Guru'] || '',
    'Nama Peserta': r.nama_peserta || r['Nama Peserta'] || '',
    'No KP Peserta': r.no_kp_peserta || r['No KP Peserta'] || '',
    'Jantina Peserta': r.jantina_peserta || r['Jantina Peserta'] || '',
    'Bangsa Peserta': r.bangsa_peserta || r['Bangsa Peserta'] || '',
    'Tarikh Daftar': r.tarikh_daftar || r['Tarikh Daftar'] || '',
    'Tahun': r.tahun || r['Tahun'] || ''
  };
}
function _mapPencapaianOut(r){
  if(!r) return null;
  var nm = r.nama_program || r.nama || r['Nama Program'] || '';
  if(nm === 'undefined' || nm === 'null') nm = 'PROGRAM TANPA NAMA';
  return {
    'ID': r.id || r['ID'] || '',
    'Program ID': r.program_id || r['Program ID'] || '',
    'Nama Program': nm || 'PROGRAM TANPA NAMA',
    'Kategori': r.kategori || r['Kategori'] || '',
    'Nama Sekolah': r.nama_sekolah || r['Nama Sekolah'] || '',
    'Kod Sekolah': r.kod_sekolah || r['Kod Sekolah'] || '',
    'Nama Peserta': r.nama_peserta || r['Nama Peserta'] || '',
    'No KP Peserta': r.no_kp_peserta || r['No KP Peserta'] || '',
    'Nama Guru': r.nama_guru || r['Nama Guru'] || '',
    'No KP Guru': r.no_kp_guru || r['No KP Guru'] || '',
    'Tempat': r.tempat || r['Tempat'] || '',
    'Markah': r.markah || r['Markah'] || 0,
    'Peringkat': r.peringkat || r['Peringkat'] || '',
    'Tahun': r.tahun || r['Tahun'] || ''
  };
}
function _mapSekolahOut(r){
  if(!r) return null;
  return { kod: r.kod || r['Kod'] || '', nama: r.nama || r['Nama'] || '' };
}
function _mapAkaunOut(r){
  if(!r) return null;
  return {
    noKP: r.no_kp || r['No KP'],
    nama: r.nama || r['Nama'],
    role: r.role || r['Role'],
    kodSekolah: r.kod_sekolah || r['Kod Sekolah'],
    namaSekolah: r.nama_sekolah || r['Nama Sekolah'],
    noTel: r.no_tel || r['No Tel'],
    status: r.status || r['Status'],
    tarikh: r.tarikh_daftar ? String(r.tarikh_daftar).slice(0,10) : ''
  };
}
// Baris mentah [progId,progNama,kodSekolah,namaSekolah,kategori,namaGuru,noKPGuru,bangsaGuru,jantinaGuru,noTelGuru,namaPeserta,noKPPeserta,jantinaPeserta,bangsaPeserta]
// -> objek utk insert ke jadual penyertaan
function _rowArrToPenyertaanIn(row, tahun){
  return {
    program_id: row[0],
    nama_program: row[1],
    kod_sekolah: row[2],
    nama_sekolah: row[3],
    kategori_penyertaan: row[4],
    nama_guru: row[5],
    no_kp_guru: row[6],
    bangsa_guru: row[7],
    jantina_guru: row[8],
    no_tel_guru: row[9],
    nama_peserta: row[10],
    no_kp_peserta: row[11],
    jantina_peserta: row[12],
    bangsa_peserta: row[13],
    tarikh_daftar: new Date().toISOString(),
    tahun: tahun
  };
}
function _throwIfErr(err){ if(err) throw new Error(err.message||String(err)); }

// ================================================================
// == SUPABASE DISPATCHER — gantikan google.script.run =============
// Setiap "fn" di bawah sepadan dengan nama fungsi *GS asal.
// ================================================================
// P: Baca SEMUA baris jadual secara bersegmen (elak had lalai 1000 baris PostgREST).
// Order by 'id' wajib supaya paginasi stabil/konsisten (tanpa order, susunan antara
// segmen tidak terjamin, boleh sebabkan baris tertinggal/pendua semasa baca berperingkat).
async function _fetchAllPaged(tableName, tahun, tahunCol){
  var PAGE=1000, from=0, all=[];
  while(true){
    var q = sb.from(tableName).select('*').order('id');
    if(tahun && tahun !== 'SEMUA') q = q.eq(tahunCol||'tahun', tahun);
    var r = await q.range(from, from+PAGE-1);
    _throwIfErr(r.error);
    var rows = r.data||[];
    all = all.concat(rows);
    if(rows.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function _supaDispatch(fn, payload){
  payload = payload || {};

  // -------- PROGRAM (sheet 'Program') --------
  if(fn === 'getAllDataGS'){
    var tahun = payload.tahun;
    // P: select('*') tanpa .range() dihadkan diam-diam oleh PostgREST (lalai 1000 baris).
    // Dengan >2000 rekod penyertaan, sebahagian data "hilang" secara senyap dari kad/dashboard/
    // Excel walaupun wujud di DB. Baca SEMUA baris secara bersegmen (1000/segmen) sehingga habis.
    var qP = sb.from(TBL_PROGRAM).select('*').order('tarikh',{ascending:false}).order('id');
    if(tahun && tahun !== 'SEMUA') qP = qP.eq('tahun', tahun);
    var rp = await qP; _throwIfErr(rp.error);

    var allPy = await _fetchAllPaged(TBL_PENYERTAAN, tahun);
    var allPc = await _fetchAllPaged(TBL_PENCAPAIAN, tahun);

    return {
      ok:true,
      programs: (rp.data||[]).map(_mapProgramOut),
      penyertaan: allPy.map(_mapPenyertaanOut),
      pencapaian: allPc.map(_mapPencapaianOut)
    };
  }

  if(fn === 'getTahunListGS'){
    var rt = await sb.from(TBL_PROGRAM).select('tahun');
    _throwIfErr(rt.error);
    var list = _uniq((rt.data||[]).map(function(x){return x.tahun;}).filter(Boolean)).sort(function(a,b){return b-a;});
    return {ok:true, list:list};
  }

  if(fn === 'getEditDataGS'){
    var pid1 = payload; // dihantar sebagai string mentah, bukan objek
    var rPy1 = await sb.from(TBL_PENYERTAAN).select('*').eq('program_id', pid1);
    _throwIfErr(rPy1.error);
    var rPc1 = await sb.from(TBL_PENCAPAIAN).select('*').eq('program_id', pid1);
    _throwIfErr(rPc1.error);
    return {ok:true, penyertaan:(rPy1.data||[]).map(_mapPenyertaanOut), pencapaian:(rPc1.data||[]).map(_mapPencapaianOut)};
  }

  if(fn === 'getPenyertaanByProgramGS'){
    var pid2 = payload;
    var rPy2 = await sb.from(TBL_PENYERTAAN).select('*').eq('program_id', pid2);
    _throwIfErr(rPy2.error);
    return {ok:true, data:(rPy2.data||[]).map(_mapPenyertaanOut)};
  }

  if(fn === 'getRumusanGS'){
    var pid3 = payload;
    var rPy3 = await sb.from(TBL_PENYERTAAN).select('*').eq('program_id', pid3);
    _throwIfErr(rPy3.error);
    var rPc3 = await sb.from(TBL_PENCAPAIAN).select('*').eq('program_id', pid3);
    _throwIfErr(rPc3.error);
    return {ok:true, penyertaan:(rPy3.data||[]).map(_mapPenyertaanOut), pencapaian:(rPc3.data||[]).map(_mapPencapaianOut)};
  }

  if(fn === 'daftarProgramGS'){
    var tar1 = payload.tarikh;
    var thn1 = tar1 ? new Date(tar1).getFullYear() : new Date().getFullYear();
    var newProgId = (typeof crypto!=='undefined' && crypto.randomUUID) ? crypto.randomUUID() : (Date.now()+'-'+Math.random().toString(36).slice(2));
    var rInsP = await sb.rpc('daftar_program', {
      p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'', p_id: newProgId,
      p_nama: payload.nama, p_pengelola: payload.pengelola,
      p_kod_pengelola: payload.kodPengelola, p_bidang: payload.bidang,
      p_kategori: (payload.kategori||[]).join(','), p_peringkat: payload.peringkat,
      p_tarikh: tar1, p_tempat: payload.tempat, p_status: payload.status||'AKTIF', p_tahun: thn1,
      p_aktiviti_luar: !!payload.aktivitiLuar
    });
    _throwIfErr(rInsP.error);
    return {ok:true, msg:'Program berjaya didaftarkan', id:newProgId};
  }

  if(fn === 'getSekolahProgramGS'){
    var rSp = await sb.rpc('senarai_sekolah_program', {p_no_kp:(_sesi&&_sesi.noKP)||'', p_token:(_sesi&&_sesi.token)||'', p_program_id:String(payload)});
    _throwIfErr(rSp.error);
    return {ok:true, data:rSp.data||[]};
  }

  if(fn === 'getSekolahProgramLihatGS'){   // baca sahaja: admin/PKK pengelola = semua; lain-lain = sekolah sendiri
    var rSl2 = await sb.rpc('senarai_sekolah_program_lihat', {p_no_kp:(_sesi&&_sesi.noKP)||'', p_token:(_sesi&&_sesi.token)||'', p_program_id:String(payload)});
    _throwIfErr(rSl2.error);
    return {ok:true, data:rSl2.data||[]};
  }

  if(fn === 'tetapkanSekolahProgramGS'){
    var rTs = await sb.rpc('tetapkan_sekolah_program', {p_no_kp:(_sesi&&_sesi.noKP)||'', p_token:(_sesi&&_sesi.token)||'', p_program_id:payload.programId, p_kod_sekolah:payload.kodSekolah||[]});
    _throwIfErr(rTs.error);
    return {ok:true, data:rTs.data};
  }

  if(fn === 'semakanSelepasLoginGS'){
    var rSl = await sb.rpc('semakan_selepas_login', {p_no_kp:(_sesi&&_sesi.noKP)||'', p_token:(_sesi&&_sesi.token)||''});
    _throwIfErr(rSl.error);
    return {ok:true, data:rSl.data||null};
  }

  if(fn === 'kemaskiniProgramGS'){
    var tar2 = payload.tarikh;
    var thn2 = tar2 ? new Date(tar2).getFullYear() : new Date().getFullYear();
    var rKp = await sb.rpc('kemaskini_program_cascade', {
      p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'', p_id: payload.id, p_nama: payload.nama, p_pengelola: payload.pengelola,
      p_kod_pengelola: payload.kodPengelola, p_bidang: payload.bidang,
      p_kategori: (payload.kategori||[]).join(','), p_peringkat: payload.peringkat,
      p_tarikh: tar2, p_tempat: payload.tempat, p_status: payload.status||'AKTIF', p_tahun: thn2,
      p_aktiviti_luar: (typeof payload.aktivitiLuar === 'boolean') ? payload.aktivitiLuar : null   // null = jangan ubah
    });
    _throwIfErr(rKp.error);
    return {ok:true, msg:'Program berjaya dikemaskini'};
  }

  if(fn === 'padamProgramGS'){
    var rPd = await sb.rpc('padam_program_cascade', {p_id: payload.id, p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||''});
    _throwIfErr(rPd.error);
    return {ok:true, msg:'Program dipadam'};
  }

  // -------- PENYERTAAN (sheet 'Penyertaan') --------
  if(fn === 'hantarPenyertaanGS' || fn === 'kemaskiniPenyertaanSekolahGS'){
    var thnPy = new Date().getFullYear();
    // hantar_penyertaan_sekolah perlukan row bentuk OBJEK (bukan array posisi)
    var rowsObj = (payload.rows||[]).map(function(row){
      var o = _rowArrToPenyertaanIn(row, thnPy);
      return {tahun:o.tahun, nama_program:o.nama_program, nama_sekolah:o.nama_sekolah,
        kategori_penyertaan:o.kategori_penyertaan, nama_guru:o.nama_guru, no_kp_guru:o.no_kp_guru,
        bangsa_guru:o.bangsa_guru, jantina_guru:o.jantina_guru, no_tel_guru:o.no_tel_guru,
        nama_peserta:o.nama_peserta, no_kp_peserta:o.no_kp_peserta, jantina_peserta:o.jantina_peserta,
        bangsa_peserta:o.bangsa_peserta};
    });
    var rPh = await sb.rpc('hantar_penyertaan_sekolah', {
      p_program_id: payload.programId,
      p_kod_sekolah: payload.kodSekolah,
      p_rows: rowsObj,
      p_no_kp: (_sesi&&_sesi.noKP)||'',
      p_token: (_sesi&&_sesi.token)||''
    });
    _throwIfErr(rPh.error);
    return {ok:true, msg: fn==='kemaskiniPenyertaanSekolahGS' ? 'Penyertaan berjaya dikemaskini' : 'Penyertaan berjaya dihantar'};
  }

  // -------- PENCAPAIAN (sheet 'Pencapaian') --------
  if(fn === 'simpanPencapaianGS'){
    var thnPc = new Date().getFullYear();
    var entriesIn = (payload.entries||[]).map(function(e){
      return {
        nama_program: payload.programNama,
        kategori: e.kategori,
        nama_sekolah: e.sekolah,
        nama_peserta: e.peserta,
        no_kp_peserta: e.kpPeserta||'',
        nama_guru: e.guru,
        no_kp_guru: e.kpGuru||'',
        tempat: e.tempat,
        markah: e.markah,
        peringkat: payload.peringkat,
        tahun: thnPc
      };
    });
    var rPc = await sb.rpc('replace_pencapaian', {p_program_id: payload.programId, p_entries: entriesIn, p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||''});
    _throwIfErr(rPc.error);
    return {ok:true, msg:'Pencapaian disimpan'};
  }

  // -------- PENGGUNA / PIN (sheet 'PIN') --------
  if(fn === 'loginGS'){
    // Mod admin — kod induk (kini disemak server-side via RPC, bukan ADMIN_MASTER_KOD dlm JS)
    if(payload.adminKod){
      var rA = await sb.rpc('login_admin', {p_no_kp: payload.noKP, p_admin_kod: payload.adminKod});
      _throwIfErr(rA.error);
      var uA = (rA.data||[])[0];
      if(!uA) return {ok:false, msg:'Kod admin tidak sah.'};
      return {ok:true, skipPin:true, role:uA.role, nama:uA.nama, kodSekolah:uA.kod_sekolah, namaSekolah:uA.nama_sekolah, token:uA.session_token};
    }

    // Semakan status akaun — RPC (jadual pengguna dikunci sepenuhnya, tiada select terus)
    var rU = await sb.rpc('cek_status_akaun', {p_no_kp: payload.noKP});
    _throwIfErr(rU.error);
    var u = (rU.data||[])[0];
    if(!u) return {ok:false, status:'TIADA', msg:'Akaun tidak dijumpai. Sila daftar akaun baharu.'};
    if(u.status === 'TUNGGU') return {ok:false, status:'TUNGGU', msg:'Akaun anda sedang menunggu kelulusan admin.'};
    if(u.status === 'TOLAK') return {ok:false, status:'TOLAK', msg:'Akaun anda tidak aktif. Sila hubungi admin.'};
    if(u.sudah_ikat_google) return {ok:false, status:'GOOGLE_SAHAJA', msg:'Akaun ini telah diikat ke akaun Google. Sila log masuk dengan butang "Log Masuk dengan Google".'};

    if(payload.checkOnly){
      return {ok:true, skipPin:false, role:u.role, nama:u.nama, kodSekolah:u.kod_sekolah, namaSekolah:u.nama_sekolah};
    }

    var rL = await sb.rpc('login_pengguna', {p_no_kp: payload.noKP, p_pin: payload.pin});
    _throwIfErr(rL.error);
    var uL = (rL.data||[])[0];
    if(!uL) return {ok:false, msg:'PIN salah. Sila cuba semula.'};
    return {ok:true, role:uL.role, nama:uL.nama, kodSekolah:uL.kod_sekolah, namaSekolah:uL.nama_sekolah, token:uL.session_token};
  }

  if(fn === 'verifyPinGS'){
    if(!_sesi || !_sesi.noKP) return {ok:false, msg:'Sesi tidak sah. Sila log masuk semula.'};
    var rV = await sb.rpc('login_pengguna', {p_no_kp: _sesi.noKP, p_pin: payload.pin});
    _throwIfErr(rV.error);
    var uv = (rV.data||[])[0];
    if(!uv) return {ok:false, msg:'PIN tidak sah.'};
    return {ok:true, role:uv.role};
  }

  if(fn === 'daftarAkaunGS'){
    var rDaf = await sb.rpc('daftar_akaun_baru', {
      p_no_kp: payload.noKP, p_nama: payload.nama, p_role: payload.role,
      p_kod_sekolah: payload.kodSekolah, p_nama_sekolah: payload.namaSekolah,
      p_no_tel: payload.noTel, p_pin: payload.pin
    });
    if(rDaf.error) return {ok:false, msg: rDaf.error.message.replace(/^.*: /,'') || 'Gagal mendaftar.'};
    return {ok:true, msg:'Permohonan akaun berjaya dihantar.'};
  }

  if(fn === 'getAkaunListGS'){
    var rA = await sb.rpc('admin_senarai_akaun', {p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||''});
    _throwIfErr(rA.error);
    return {ok:true, data:(rA.data||[]).map(_mapAkaunOut)};
  }

  if(fn === 'kemaskiniAkaunGS'){
    var rUu = await sb.rpc('admin_kemaskini_akaun', {
      p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'',
      p_target_no_kp: payload.noKP, p_status: payload.status||null, p_role: payload.role||null,
      p_nama: null, p_kod_sekolah: null, p_nama_sekolah: null, p_no_tel: null
    });
    _throwIfErr(rUu.error);
    return {ok:true, msg:'Akaun dikemaskini'};
  }

  if(fn === 'resetPinGS'){
    var pinBaharu = payload.pin && String(payload.pin).length===6 ? String(payload.pin) : String(Math.floor(100000+Math.random()*900000));
    var rRp = await sb.rpc('set_pin', {
      p_no_kp_target: payload.noKP, p_pin_baharu: pinBaharu,
      p_no_kp_caller: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||''
    });
    _throwIfErr(rRp.error);
    return {ok:true, pinBaharu:pinBaharu, msg:'PIN berjaya ditetapkan'};
  }

  // -------- SEKOLAH (rujukan utama nama & kod sekolah) --------
  if(fn === 'getSekolahListGS'){
    var rS = await sb.from(TBL_SEKOLAH).select('*').order('nama',{ascending:true});
    _throwIfErr(rS.error);
    return {ok:true, data:(rS.data||[]).map(_mapSekolahOut)};
  }

  if(fn === 'tambahSekolahGS'){
    var kodBaru = String(payload.kod||'').toUpperCase().trim();
    var namaBaru = String(payload.nama||'').toUpperCase().trim();
    if(!kodBaru||!namaBaru) return {ok:false, msg:'Kod dan nama sekolah wajib diisi.'};
    // Elak duplikat nama walaupun kod berlainan (punca biasa: variasi ejaan) — semak dulu client-side
    var rChkN = await sb.from(TBL_SEKOLAH).select('kod,nama').ilike('nama', namaBaru).maybeSingle();
    _throwIfErr(rChkN.error);
    if(rChkN.data) return {ok:false, msg:'Nama sekolah yang serupa sudah wujud: '+rChkN.data.nama+' ('+rChkN.data.kod+')'};
    var rTs = await sb.rpc('admin_tambah_sekolah', {p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'', p_kod: kodBaru, p_nama: namaBaru});
    _throwIfErr(rTs.error);
    return {ok:true, msg:'Sekolah berjaya ditambah.'};
  }

  if(fn === 'kemaskiniSekolahGS'){
    var kodEdit = String(payload.kod||'').toUpperCase().trim();
    var namaEdit = String(payload.nama||'').toUpperCase().trim();
    if(!kodEdit||!namaEdit) return {ok:false, msg:'Kod dan nama sekolah wajib diisi.'};
    var rSk = await sb.rpc('admin_kemaskini_sekolah', {p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'', p_kod: kodEdit, p_nama_baharu: namaEdit});
    _throwIfErr(rSk.error);
    return {ok:true, msg:'Sekolah berjaya dikemaskini.'};
  }

  if(fn === 'seedSekolahGS'){
    // Isi jadual sekolah kali pertama daripada senarai statik terbina-dalam (guna hanya jika jadual kosong)
    var seedRows = (payload.senarai||[]).map(function(s){return {kod:s.kod, nama:s.nama};});
    if(!seedRows.length) return {ok:false, msg:'Tiada data untuk di-seed.'};
    var rSd = await sb.rpc('sekolah_seed', {p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'', p_senarai: seedRows});
    _throwIfErr(rSd.error);
    return {ok:true, msg:(rSd.data||0)+' sekolah berjaya di-seed.'};
  }

  // -------- KEMASKINI MAKLUMAT PENGGUNA (admin) --------
  if(fn === 'kemaskiniMaklumatPenggunaGS'){
    if(payload.nama==null && payload.kodSekolah==null && payload.namaSekolah==null && payload.noTel==null){
      return {ok:false, msg:'Tiada maklumat untuk dikemaskini.'};
    }
    var rUpM = await sb.rpc('admin_kemaskini_akaun', {
      p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'',
      p_target_no_kp: payload.noKP, p_status: null, p_role: null,
      p_nama: payload.nama!=null?String(payload.nama).toUpperCase().trim():null,
      p_kod_sekolah: payload.kodSekolah!=null?String(payload.kodSekolah).toUpperCase().trim():null,
      p_nama_sekolah: payload.namaSekolah!=null?String(payload.namaSekolah).toUpperCase().trim():null,
      p_no_tel: payload.noTel!=null?payload.noTel:null
    });
    _throwIfErr(rUpM.error);
    return {ok:true, msg:'Maklumat pengguna dikemaskini.'};
  }

  // -------- PROFIL SAYA (nama & No.Tel sendiri sahaja; pelayan mengesahkan token & tiada parameter sekolah) --------
  if(fn === 'profilSayaGS'){
    var rPf = await sb.rpc('profil_saya', {p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||''});
    _throwIfErr(rPf.error);
    var pf = (rPf.data||[])[0];
    if(!pf) return {ok:false, msg:'Profil tidak dijumpai.'};
    return {ok:true, data:{nama:pf.nama, noKP:pf.no_kp, role:pf.role, tel:pf.no_tel||'', kodSekolah:pf.kod_sekolah, namaSekolah:pf.nama_sekolah}};
  }
  if(fn === 'kemaskiniProfilGS'){
    var rKp2 = await sb.rpc('kemaskini_profil_sendiri', {
      p_no_kp: (_sesi&&_sesi.noKP)||'', p_token: (_sesi&&_sesi.token)||'',
      p_nama:   payload.nama  !=null ? String(payload.nama)  : null,
      p_no_tel: payload.noTel !=null ? String(payload.noTel) : null
    });
    _throwIfErr(rKp2.error);
    var upd = (rKp2.data||[])[0] || {};
    return {ok:true, nama:upd.nama_baru, tel:upd.no_tel_baru, msg:'Profil dikemas kini.'};
  }

  throw new Error('Fungsi tidak dikenali: '+fn);
}

// Helper — deduplicate array (replaces [...new Set(arr)] for GAS compat)
function _uniq(arr){var s={},r=[];(arr||[]).forEach(function(v){if(!s[v]){s[v]=1;r.push(v);}});return r;}

