// ================= GEMINI AI CHAT WIDGET (FASA 1) =================
// NOTA PELAKSANAAN:
// Widget ini TIDAK memanggil Gemini API terus dari browser (kunci API tidak
// boleh didedahkan pada sisi client). Ia memanggil Supabase Edge Function
// 'ai-chat' yang bertindak sebagai proksi selamat ke Gemini API.
// Edge Function tersebut perlu dideploy berasingan (lihat nota di bawah chat).
var _aiHist = [];      // {role:'user'|'model', text}
var _aiOpened = false;
var _aiBusy = false;

var AI_SARANAN_AWAL = [
  'Macam mana nak daftar program baharu?',
  'Kenapa saya tak boleh hantar penyertaan?',
  'Apa maksud status DRAFT vs AKTIF?'
];

// Mesej khas bila cuba guna AI sebelum log masuk — statik sahaja, TIDAK panggil API AI.
var AI_MESEJ_BELUM_LOGIN = 'Pembantu AI penuh hanya boleh digunakan selepas log masuk. Sebelum log masuk, saya cuma boleh bantu berkenaan 2 perkara: 1. Cara buat akaun pertama kali - klik butang Log Masuk dengan Google di skrin log masuk, pilih akaun Google sekolah anda (@moe-dl.edu.my). Sebab akaun belum wujud, satu tetingkap akan terbuka - klik pautan Belum ada akaun? Daftar akaun baharu terus, isi Peranan/Nama/No.KP/No.Tel/Sekolah, hantar permohonan (tiada PIN diperlukan). Akaun berstatus Tunggu sehingga admin lulus (biasanya 1-2 hari bekerja). 2. Cara claim akaun sedia ada dengan Google - klik Log Masuk dengan Google, pilih akaun Google sekolah anda, lepas itu masukkan No.KP dan PIN akaun sedia ada untuk mengikatnya. Sila log masuk dahulu untuk soalan lain.';

function aiTogglePanel(force){
  var panel = document.getElementById('ai-panel');
  var show = (typeof force === 'boolean') ? force : !panel.classList.contains('on');
  panel.classList.toggle('on', show);
  if(show && !_aiOpened){
    _aiOpened = true;
    if(!_sesi){
      aiAppendMsg('err', '⚠ ' + AI_MESEJ_BELUM_LOGIN);
      document.getElementById('ai-fab-dot').style.display='none';
    } else {
      aiAppendMsg('bot', 'Hai! 👋 Saya pembantu AI UPBM Subis. Saya boleh bantu jawab soalan tentang penggunaan sistem ini. Apa yang boleh saya bantu?');
      aiRenderSugg(AI_SARANAN_AWAL);
      document.getElementById('ai-fab-dot').style.display='none';
    }
  }
  if(show) setTimeout(function(){ var i=document.getElementById('ai-input'); if(i) i.focus(); }, 150);
}

function aiRenderSugg(list){
  var wrap = document.getElementById('ai-sugg');
  wrap.innerHTML = '';
  (list||[]).forEach(function(s){
    var b = document.createElement('button');
    b.textContent = s;
    b.onclick = function(){ document.getElementById('ai-input').value = s; aiSend(); };
    wrap.appendChild(b);
  });
}

function aiOnKeydown(e){
  if(e.key === 'Enter' && !e.shiftKey){
    e.preventDefault();
    aiSend();
  }
}

function aiAppendMsg(kind, text){
  var body = document.getElementById('ai-body');
  var d = document.createElement('div');
  d.className = 'ai-msg ' + kind;
  d.textContent = text;
  body.appendChild(d);
  body.scrollTop = body.scrollHeight;
}

function aiShowTyping(show){
  var body = document.getElementById('ai-body');
  var existing = document.getElementById('ai-typing-ind');
  if(show){
    if(existing) return;
    var d = document.createElement('div');
    d.className = 'ai-typing'; d.id = 'ai-typing-ind';
    d.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(d);
    body.scrollTop = body.scrollHeight;
  } else if(existing){
    existing.remove();
  }
}

// Konteks ringkas halaman semasa — dihantar bersama supaya jawapan lebih relevan.
// Fasa akan datang akan tambah konteks lanjut (program dipilih, data dimuatkan, dll).
function aiBuildContext(){
  return {
    halamanSemasa: (document.querySelector('.pg.on')||{}).id || '',
    peranan: (_sesi && _sesi.role) || 'tetamu',
    kodSekolah: (_sesi && _sesi.kodSekolah) || ''
  };
}

async function aiSend(){
  if(_aiBusy) return;
  var input = document.getElementById('ai-input');
  var msg = (input.value || '').trim();
  if(!msg) return;
  input.value = '';
  document.getElementById('ai-sugg').innerHTML = '';
  aiAppendMsg('usr', msg);

  if(!_sesi){
    // AI penuh TIDAK aktif sebelum log masuk — tiada panggilan API AI dibuat langsung.
    aiAppendMsg('err', '⚠ ' + AI_MESEJ_BELUM_LOGIN);
    return;
  }

  _aiHist.push({role:'user', text: msg});
  _aiBusy = true;
  document.getElementById('ai-send-btn').disabled = true;
  aiShowTyping(true);
  try{
    // Panggil Supabase Edge Function 'ai-chat' (proksi Gemini API selamat).
    // Sesi (noKP + token) dihantar supaya pelayan mengesahkan pengguna & peranan sebelum menjawab / membaca data.
    var res = await sb.functions.invoke('ai-chat', {
      body: { message: msg, history: _aiHist.slice(-10), context: aiBuildContext(), noKP: _sesi.noKP, token: _sesi.token }
    });
    aiShowTyping(false);
    if(res.error){
      var kod=''; try{ var jr = await res.error.context.json(); kod = (jr && jr.code) || ''; }catch(_e){}
      var er = new Error(res.error.message || 'Ralat sambungan AI'); er.kod = kod; throw er;
    }
    var jwp = (res.data && res.data.reply) ? res.data.reply : 'Maaf, saya tidak pasti jawapannya buat masa ini.';
    aiAppendMsg('bot', jwp);
    _aiHist.push({role:'model', text: jwp});
  }catch(e){
    aiShowTyping(false);
    var AI_RALAT = {
      AI_SESI:  'Sesi anda telah tamat. Sila log masuk semula untuk menggunakan Pembantu AI.',
      AI_SIBUK: 'Pembantu AI sedang sibuk kerana permintaan tinggi pada penyedia AI. Sila cuba lagi sebentar lagi.',
      AI_HAD:   'Terlalu banyak soalan dalam masa singkat. Tunggu seminit sebelum bertanya semula.',
      AI_MINTA: 'Mesej tidak sah atau terlalu panjang (maksimum 1000 aksara).',
      AI_KONFIG:'Pembantu AI belum dikonfigurasi sepenuhnya di pelayan. Sila hubungi admin.'
    };
    aiAppendMsg('err', '⚠ ' + (AI_RALAT[e && e.kod] || 'Tidak dapat menghubungi Pembantu AI. Semak sambungan internet dan cuba lagi.'));
    console.warn('AI chat error:', e.kod || '', e.message);
  }finally{
    _aiBusy = false;
    document.getElementById('ai-send-btn').disabled = false;
  }
}

// ============ FLOATING "+ TAMBAH" (borang Penyertaan) ============
// Tunjuk butang terapung bila user dah scroll melepasi butang asal
// "+ TAMBAH GURU" / "+ TAMBAH PESERTA" supaya tak perlu scroll balik ke atas.
function _fabPenyCheck(){
  // Elak kerja sia-sia setiap 500ms bila tak log masuk / bukan di tab Penyertaan
  if(!document.body.classList.contains('loggedin')) return;
  var fab = document.getElementById('fab-peny-btn');
  if(!fab) return;
  var pgEl = document.getElementById('pg-peserta');
  var formWrap = document.getElementById('peny-form-wrap');
  var isActivePg = pgEl && pgEl.classList.contains('on');
  var isFormShown = formWrap && formWrap.style.display !== 'none' && formWrap.offsetParent !== null;
  if(!isActivePg || !isFormShown){
    fab.classList.remove('show');
    _fabPenyCloseMenu();
    return;
  }
  var anchor = document.getElementById('btn-add-main-pes');
  var rect = anchor ? anchor.getBoundingClientRect() : null;
  // Tunjuk hanya bila butang asal dah keluar dari viewport (scroll ke bawah)
  var shouldShow = rect && rect.bottom < 40;
  fab.classList.toggle('show', !!shouldShow);
  if(!shouldShow) _fabPenyCloseMenu();
}
window.addEventListener('scroll', _fabPenyCheck, {passive:true});
setInterval(_fabPenyCheck, 500); // fallback — tangkap perubahan bila tukar tab/buka borang tanpa scroll event

function fabPenyToggleMenu(){
  var menu = document.getElementById('fab-peny-menu');
  menu.classList.toggle('on');
}
function _fabPenyCloseMenu(){
  var menu = document.getElementById('fab-peny-menu');
  if(menu) menu.classList.remove('on');
}
function _fabScrollToLast(containerId){
  setTimeout(function(){
    var list = document.getElementById(containerId);
    if(list && list.lastElementChild){
      list.lastElementChild.scrollIntoView({behavior:'smooth', block:'center'});
    }
  }, 80);
}
function fabDoAddPes(){
  _fabPenyCloseMenu();
  addMainPes();
  _fabScrollToLast('main-pes-list');
}
function fabDoAddGuru(){
  _fabPenyCloseMenu();
  addMainGuru();
  _fabScrollToLast('main-guru-list');
}
// Tutup menu bila klik di luar
document.addEventListener('click', function(e){
  var menu = document.getElementById('fab-peny-menu');
  var btn = document.getElementById('fab-peny-btn');
  if(!menu || !menu.classList.contains('on')) return;
  if(e.target === btn || btn.contains(e.target)) return;
  if(!menu.contains(e.target)) _fabPenyCloseMenu();
});



