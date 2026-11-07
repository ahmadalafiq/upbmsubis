# UPBM Subis — Progress Pembaikan
_Kemas kini terakhir: 16 Okt 2026 — projek 6 (Laporan Sekolah) ditambah. Hanya kerja AKTIF/BELUM SIAP di sini; kerja siap ada dalam `ARKIB.md`._

---

## Ringkasan Projek
| No | Projek | Status | Seterusnya |
|---|---|---|---|
| 2 | Edit penyertaan dalam modal | Dirancang | M1 kerangka modal → M2 → M3 → M4 |
| 3 | Wizard pendaftaran (Program & Penyertaan) | Dirancang, 4 keputusan dibuat | W1 Program dahulu, kemudian W2–W4 |
| 4 | SPBM (HEM + PBM) | Rancangan sahaja | Fasa 0 jadual `murid`; tunggu arahan mula |
| 5 | Semakan sistem & ujian tertunggak | Terbuka | Ujian dalam app sebenar; putar semula kod admin |
| 6 | Laporan Sekolah (penyertaan & pencapaian + perbandingan sesi) | Dibina & dipush (`88333f6` + pembetulan admin/semua sekolah), **belum diuji dalam pelayar** | Uji dalam app sebenar selepas deploy |
| 7 | Aktiviti Luar (penanda program + Dashboard + penilaian) | Fasa 1–3 siap & dipush (dasar: pencapaian sahaja); **belum diuji dalam pelayar** | Uji dalam app sebenar; Fasa 4 pilihan |
| 8 | Log masuk e-mel dengan kod (OTP) | CADANGAN; menunggu keputusan & tetapan SMTP | Putuskan kaedah ikatan akaun (A/B) + sediakan SMTP |
| 9 | Laporan Analitik PPD (menggantikan Cetak Ringkasan; admin sahaja) | CADANGAN (26 Okt) — menunggu persetujuan | Putuskan 4 perkara dlm projek 9, kemudian bina P1 |
| 10 | **Privasi data peserta** (No.KP murid/guru & telefon boleh dibaca awam) | **PENEMUAN KRITIKAL** — belum dibetulkan | Keutamaan tertinggi; projek reka bentuk (perlu ujian pelayar) |
| 11 | Pengerasan edge function `ai-chat` | Dikaji (dijeda separuh); belum dilaksanakan | Senarai putih alat, had input, pengesahan sesi, had kadar |

**Urutan kerja cadangan:** uji projek 6 & 7 dahulu → 2 → 3 (W1→W4) → 4; projek 8 menunggu keputusan. (Projek 1 siap — lihat ARKIB.) Projek 5 boleh dibuat selari. Kerja yang sudah siap: lihat `ARKIB.md`.

---

## 2. Edit Penyertaan dalam Modal
**Status:** dirancang, belum dilaksanakan. Dibuat selepas projek 1, sebelum wizard Penyertaan.

**Hajat:** klik EDIT penyertaan → borang keluar sebagai modal (bukan lompat ke tab Penyertaan). Selesai
atau batal → modal tutup, user kekal di kedudukan asal (tempat dia tekan EDIT).

**Keadaan sekarang (disemak):** `_openPenyertaanEdit()` (baris ~3660) panggil `_doShowPage('peserta')` → lompat
tab; borang hidup dlm `#pg-peserta` (`#sel-edit-info` + `#peny-form-wrap`). Dua pintu masuk: `reqEditSek()`
(butang EDIT dlm modal `mo-lihat`, Pengelola) dan `_editSekolahDariBullet()` (modal `mo-srch`, admin tab
Penyertaan) — kedua-duanya `closeMo` modal asal dulu.

**Reka bentuk:**
1. Modal baharu `mo-edit-peny`. Bila edit bermula, PINDAH (appendChild) `#sel-edit-info` + `#peny-form-wrap`
   ke dalam modal; bila tutup, pulangkan ke `#pg-peserta` (ingat parent + nextSibling). ID elemen TAK berubah →
   `hantarPeny`, `semakPeny`, `_prefillPenyertaanEdit`, `renderMain*List`, `_penyAutoSave`, import Excel kekal jalan.
2. `_openPenyertaanEdit`: buang `_doShowPage('peserta')`; simpan `_editOrigin` = {halaman aktif, scrollY, id modal asal};
   masih panggil `loadProgsForPeny(false, cb)` utk isi `_aP`.
3. Modal asal (`mo-lihat`/`mo-srch`) KEKAL terbuka di bawah — jangan `closeMo` dlm kedua-dua pintu masuk.
   Modal bertindan sudah disokong (`openMo` guna `++_zTop`); `mo-pengesahan` pun bertindan di atas.
4. Tutup (batal/berjaya): pulangkan node → `closeMo('mo-edit-peny')` → pulih scrollY → muat semula kandungan
   modal asal secara senyap (param sama) supaya data terkini. Butang "BATAL KEMASKINI" (baru) jadi tutup modal.
**Titik risiko:** (a) realtime flush (baris ~2803-2805) cuma kenal `mo-edit` Pengelola — mesti tambah
`mo-edit-peny` sbg "borang aktif" supaya tak refresh semasa user mengisi; (b) fungsi ~3017 yg semak `#pg-peserta`
aktif; (c) autosave draf tak boleh tawar pulih draf pendaftaran baharu semasa mod edit (kunci ikut `isEdit`);
(d) selepas hantar berjaya: tutup modal + `mo-salinan`/toast + segar semula `_aP`; (e) scroll-lock body & mobile.
**Fasa:** M1 kerangka modal + pindah DOM → M2 pulih kedudukan + segar modal asal → M3 realtime/draf →
M4 uji 3 peranan (admin, PKK pengelola, guru sekolah sendiri) dari 2 pintu masuk. Tiada perubahan backend.

---

## 3. Wizard Pendaftaran (Program & Penyertaan)
**Status: RANCANGAN SAHAJA. Tiada perubahan dibuat pada index.html / Supabase. 4 keputusan sudah dibuat (lihat "Keputusan" di bawah).**

### Keadaan borang sekarang (hasil semakan kod, baca sahaja)
- **Daftar Program** (`#card-daftar-prog`): 1 kad panjang, 11 medan (p-nama, p-pengelola, p-kod, p-bidang,
  kategori checkbox `p-kat-wrap`, p-per, p-tarikh, p-tempat, p-status). Fungsi: `daftarProgram()`, `clearPF()`.
- **Penyertaan** (`#pg-peserta`): sudah separa-langkah — `peny-pilih` (pilih program) -> `sbox-sekolah`
  (pilih sekolah) -> `peny-form-wrap` (guru `main-guru-list` + peserta `main-pes-list`) -> modal
  `mo-pengesahan` -> `hantarPeny()`. Kotak muncul progresif tapi bersepah.

### Reka bentuk dicadang
**Wizard Program (5 langkah):** 1 Asas (Nama/Bidang/Peringkat) -> 2 Penganjur (Unit/Kod Sekolah; auto-isi utk PKK,
admin pilih) -> 3 Kategori -> 4 Jadual (Tarikh/Tempat/Status) -> 5 Semak & Hantar (ringkasan).

**Wizard Penyertaan (5 langkah):** 1 Pilih Program -> 2 Sahkan Sekolah (auto utk guru/PKK) -> 3 Guru Pengiring
-> 4 Peserta & Kategori (import Excel di sini) -> 5 Semak & Hantar (modal pengesahan jadi langkah akhir inline).

### Prinsip keselamatan
1. Wizard = LAPISAN PAPARAN sahaja: kekalkan SEMUA ID elemen & fungsi sedia ada (`daftarProgram`, `hantarPeny`,
   `semakPeny`, `pilihProg`, `onSekSelect`, `_prefillFromExisting`, semua RPC). Cuma sorok/tunjuk kumpulan medan
   + semakan per langkah.
2. TIADA perubahan backend (Supabase tak disentuh).
3. Pautan "Guna borang biasa" sebagai jalan balik/sandaran.

### Perkara mesti dijaga (titik risiko)
- Autosave draf 30s (`_penyAutoSave`/`_restorePenyDraft`) mesti simpan & pulih LANGKAH terakhir
- Mod kemaskini (admin klik EDIT via `reqEditSek`/`_openPenyertaanEdit`) perlu terus ke langkah betul dgn data pra-isi
- Realtime sync (`_flushRealtimeQueueSilently`) tak boleh refresh borang aktif — semak masih berfungsi
- `semakPeny()` perlu dipecah per langkah (semak Guru di langkah 3, Peserta di langkah 4, dll) tanpa ubah logik asal
- Import Excel (`_prosesBulkXlsx`) tolak ke state sama (`_penyData.pesList/guruList`) — mesti kekal berfungsi
- Peraturan sedia ada dikekalkan: guru tak boleh daftar program; PKK edit program sekolah sendiri sahaja

### Fasa
| Fasa | Kerja | Risiko |
|---|---|---|
| W1 | Wizard Program | Rendah |
| W2 | Kerangka wizard Penyertaan + semakan per langkah | Sederhana |
| W3 | Mod kemaskini, draf, realtime, integrasi admin | Tinggi |
| W4 | Kemasan mobile + uji semua peranan | Rendah |

### Soalan asal (4 keputusan) — SUDAH DIJAWAB, lihat "Keputusan" di bawah
1. Mula dgn Program dahulu (cadangan) atau kedua-dua serentak?
2. Kekalkan pautan "borang biasa" sbg sandaran?
3. Mod kemaskini juga wizard, atau kekal borang ringkas 1 halaman?
4. Langkah Guru Pengiring wajib atau boleh langkau?

### Nota sampingan (diselesaikan dalam projek 1)
Halaman Akaun masih ada butang "MIGRATE (Kemaskini header sheet PIN)" — nampak sisa zaman Google Sheets,
kemungkinan kod mati. Perlu disemak sebelum dibuang.

### Keputusan: Wizard pendaftaran — 4 keputusan dibuat (ikut objektif: guru sekolah pelbagai kemahiran digital, data tepat)
1. **Mula dgn Program (W1), kemudian Penyertaan (W2)** — Program: 1 pengguna (PKK/admin), medan sedikit, risiko rendah,
   jadi corak wizard diuji dulu sebelum ke borang Penyertaan yang jauh lebih rumit.
2. **Pautan "Guna borang biasa" KEKAL semasa pelancaran** sahaja; buang selepas stabil (~2-4 minggu). Sebab: wizard
   cuma lapisan paparan, jadi sandaran murah & elak guru terkandas.
3. **Wizard untuk pendaftaran BAHARU sahaja; mod KEMASKINI kekal 1 halaman (dlm modal, bahagian A)** — orang yang edit
   tahu apa nak ubah & perlu nampak semua sekali; wizard memanjangkan kerja mereka.
4. **Langkah Guru Pengiring WAJIB (min. 1 guru)** — sudah dikuatkuasakan `semakPeny()` ("Langkah 3: sekurang-kurangnya
   1 guru") & `hantarPeny()` melampirkan guru pada setiap baris peserta. Langkah wizard = penomboran sedia ada:
   1 Program → 2 Sekolah → 3 Guru → 4 Peserta & Kategori (import Excel di sini) → 5 Semak & Hantar.
**Urutan kerja keseluruhan (cadangan):** B (buang MIGRATE, kecil) → A (modal edit) → W1 (wizard Program) → W2 → W3 → W4.
Sebab A sebelum W2: borang edit & borang baharu berkongsi elemen sama; stabilkan edit-dalam-modal dahulu supaya wizard
Penyertaan dibina atas asas yg tak akan berubah lagi.

---

## 4. Projek SPBM (Sistem Pengurusan Maklumat — HEM + PBM)
**Status: RANCANGAN SAHAJA. Tiada perubahan dibuat pada Supabase/GitHub. Rujuk bila sedia.**

### Skop
Dokumen sumber: struktur SPBM penuh (HEM + PBM) — jauh lebih besar drpd UPBM Subis sekarang.
UPBM Subis sekarang cuma isi 1 sub-cabang (2.1.2/2.2.2 - kokurikulum acara daerah).
SPBM penuh: 2 unit (HEM: enrolmen/disiplin/kehadiran/kesihatan/asrama/kantin/RMT/staf;
PBM: sukan+kokurikulum/PAJSK/SEGAK/kelab-badan beruniform).

### Reka bentuk dipersetujui — "1 Kad, Pilih Perkhidmatan" (konsep ATM)
1. **1 sistem log masuk dikongsi** (No.KP+PIN/Google/token sedia ada) — tiada perubahan RPC login
2. Lepas login berjaya → skrin **"Pilih Sistem"** (tambahan kecil dlm index.html):
   🏆 KK+Sukan (app sedia ada) vs 🎓 HEM (baharu)
3. `hem.html` — **fail app BAHARU berasingan sepenuhnya**, bukan tab dalam index.html sedia ada
4. Sesi dikongsi via `sessionStorage` (sama origin) — pilih HEM navigasi ke hem.html dlm tab sama,
   auto-login (tak perlu PIN/Google 2 kali)
5. Jadual `pengguna` + `sekolah` **dikongsi terus** (satu sumber kebenaran)
6. Jadual `programs`/`penyertaan`/`pencapaian` sedia ada **LANGSUNG TAK DISENTUH**
7. HEM guna jadual & RPC BAHARU sepenuhnya (nama jelas berlainan, cth. `hem_kehadiran`,
   `hem_disiplin`, `pbm_enrolmen_sukan`, `pbm_pajsk`) — zero overlap dgn backend sedia ada

### Jurang kritikal dikenal pasti
Tiada jadual induk **murid** (rekod pelajar berkekalan: No.KP, tingkatan/tahun, kelas, jantina,
kaum, kewarganegaraan, agama) dlm sistem sekarang — UPBM Subis cuma simpan nama peserta ad-hoc
bila daftar acara. Hampir SEMUA ciri SPBM (enrolmen, disiplin, kehadiran, PAJSK) bergantung pada
jadual murid ni — jadi ini WAJIB jadi Fasa 0 sebelum modul lain boleh dibina.

### Cadangan susunan fasa
| Fasa | Skop |
|---|---|
| 0 | Jadual induk `murid` (rekod pelajar berkekalan) |
| 1 | 2.1/2.2 penuh (Sukan+Kokurikulum menyeluruh, bukan cuma acara daerah) — paling dekat dgn kerja sedia ada |
| 2 | 2.3/2.4 (PAJSK, SEGAK, Kelab/Badan Beruniform) |
| 3 | 1.1/1.2 (Enrolmen, Kehadiran, Disiplin) — HEM |
| 4+ | 1.3/1.4 (Asrama, Kantin, RMT, Staf HEM) — paling khusus |

### Soalan belum dijawab user (perlu klarifikasi bila nak mula)
- Fasa mana paling mendesak dahulu (dicadang: skrin "Pilih Sistem" dahulu — kerja kecil,
  risiko rendah, boleh uji sebelum mula HEM yang jauh lebih besar)
- Adakah data murid sedia ada di sistem KPM lain (APDM) boleh diimport, atau bina dari kosong?

**Status semasa:** rancangan disimpan, tunggu arahan mula. Fokus kekal pada UPBM Subis sedia ada buat masa ini.

---

## 5. Semakan Sistem & Ujian Tertunggak
_Item di bawah bertanda belum selesai/belum diuji dalam bahagian yang diarkibkan. Sejarah penuh: `ARKIB.md`._

**Belum diuji dalam app sebenar (hanya diuji via kod/pg_net):**
- [ ] AI Analitik — buka panel AI dalam app sebenar, cuba soalan
- [ ] Pendaftaran Google-first end-to-end: Google baharu → daftar → admin lulus → log masuk semula
- [ ] Log masuk Google dalam Google Sites sebenar (patut buka tab baharu, bukan 403)
- [ ] Semua flow selepas RLS/token dikunci, diuji dalam app sebenar (login, daftar akaun, penyertaan, program, urus akaun, sekolah)

**Semakan sistem — fasa tiada rekod siap:**
- [ ] Fasa A — audit akses Supabase terus dalam index.html (mungkin sudah diliputi audit F1–F9 — sahkan)
- [ ] Fasa B — jadual `sekolah` (RLS masih terbuka; risiko rendah; putuskan tindakan)
- [ ] Fasa D — semak Edge Function `ai-chat` (kekukuhan, kos, had kadar)
- [ ] Fasa E — kesihatan kod frontend (kod mati: `askPin`/`doPin`/`verifyPinGS`, `lgDaftar()`)
- [ ] Fasa F — susun cadangan penambahbaikan

**Peningkatan pilihan (tak wajib):**
- [ ] Bulk Excel: validasi bantuan AI (auto-mapping lajur) & semakan pendua muat naik
- [ ] Tambah RPC analitik jika ada soalan yang AI tak dapat jawab
- [ ] UI untuk `kemaskini_profil_sendiri` (RPC sedia, tiada UI)

**Fungsi pangkalan data yang masih tiada token (dikenal pasti 19 Okt; fungsi berbahaya sudah ditutup — lihat ARKIB):**
- [ ] `cek_status_akaun(p_no_kp)` boleh dipanggil tanpa log masuk (oracle status akaun mengikut No.KP) — diperlukan sebelum log masuk; pertimbangkan had kadar.

**Had reka bentuk sesi (dikenal pasti 19 Okt):**
- [ ] Hanya SATU token sah bagi setiap pengguna (`pengguna.session_token`). Log masuk di tab/peranti lain (atau tab Google yang dibuka melalui Google Sites) memutar token dan membatalkan sesi sebelumnya → "Akses ditolak - sesi tidak sah". Pilihan: auto-pulih (sekali: panggil `login_via_google` dan cuba semula) atau token berbilang. Belum diputuskan.

**Keselamatan (ditambah semasa pengarkiban):**
- [ ] GitHub PAT pernah dikongsi dalam sembang (kini ada kebenaran tulis ke repo) — REVOKE di GitHub → Settings → Developer settings → Personal access tokens; guna token baharu berskop kecil jika perlu.
- [ ] Kod admin pernah tertulis terang dalam repo awam (termasuk sejarah git). Putar semula kod admin dalam `app_secrets` dan jangan tulis nilainya dalam mana-mana fail. Nilai lama telah dipadam daripada `ARKIB.md`.

---

## 6. Laporan Sekolah (Penyertaan & Pencapaian + Perbandingan Sesi)
**Status:** dibina dan dipush ke `main` (commit `88333f6`, 16 Okt 2026). **Belum diuji dalam pelayar sebenar** — hanya diuji di Node (fungsi `getSkor` sebenar + data rekaan + PDF dirender untuk semakan visual).

**Tujuan:** sekolah dapat laporan komprehensif penyertaan & pencapaian bagi tahun semasa; pada tahun berikutnya, laporan perbandingan mengikut sesi (tahun). Eksport PDF untuk simpanan sekolah. Mesti guna cara PDF sedia ada — tiada enjin PDF baharu.

### Yang dibina
- Butang **📄 LAPORAN SEKOLAH** di tajuk halaman Dashboard → modal `mo-lapsek` (dibina oleh JS). Guru/PKK terkunci pada sekolah sendiri (`_sesi.kodSekolah`). **Admin** (`role==='admin'`, walaupun akaunnya dikaitkan dengan satu sekolah) boleh pilih mana-mana sekolah ATAU **★ SEMUA SEKOLAH**. Jenis: Laporan Tahun, atau Perbandingan Sesi (pilih 2 sesi atau lebih).
- **Semua sekolah:** satu fail PDF SETIAP sekolah (tidak digabung), dibungkus dalam satu ZIP (JSZip yang sedia ada dalam app) — nama fail `KOD_NAMA_LAPORAN_TAHUN.pdf` / `KOD_NAMA_PERBANDINGAN_A-B.pdf`; sekolah tanpa penyertaan dilangkau; jika satu sekolah gagal, yang lain tetap dimasukkan. CETAK hanya untuk satu sekolah.
- **Pembetulan (16 Okt):** versi pertama hanya membenarkan admin memilih sekolah jika `kodSekolah` kosong, sedangkan kedua-dua akaun admin ada `kod_sekolah` → admin sentiasa terkunci pada sekolahnya. Kini admin ditentukan oleh `role` sahaja.
- Fail: `laporan-sekolah.js` (logik, fail baharu di root repo, ~35 KB) + `index.html` (+3 baris: butang, tag skrip, lajur `Kod Sekolah` dalam `_mapPencapaianOut`).
- PDF: pdf-lib (cara sama `janaPdfSalinanPenyertaan`, Blob + `<a download>`, berfungsi dalam Google Sites). CETAK guna portal `#sdet-print-portal` seperti `printSdet`. Pratonton, cetak dan PDF dijana daripada satu "spesifikasi dokumen" supaya isi sentiasa sama.
- **Laporan Tahun:** 1 Ringkasan, 2 Pecahan bidang & peringkat, 3 Senarai program, 4 Pencapaian (SEMUA kedudukan), 5 Senarai nama mengikut program (1 baris 1 nama; GURU dahulu kemudian PESERTA; A–Z; Bil berturutan), 6 Demografi. **Tiada No.KP.**
- **Perbandingan Sesi:** jadual ringkasan sebelah-menyebelah + perubahan (sesi terkini vs sebelumnya), bidang, peringkat, program kedua-dua sesi / satu sesi sahaja (dipadan ikut nama program tanpa tahun).
- Markah = `getSkor` (kaedah ranking Dashboard: pencapaian + pelibatan, kedudukan terbaik bagi setiap sekolah/program/kategori). Senarai pencapaian pula memuatkan semua kedudukan. Program DRAFT dikecualikan; AKTIF & TUTUP dimasukkan.
- Penjajaran jadual: tajuk di tengah; nilai ringkas di tengah (juga menegak); nama program & nama orang di kiri.
- Nota: cabang `'sek'`/`'pes'`/`'guru'` dalam `buildSdetPrint` ialah kod yatim (tiada pemanggil; sisa bar carian header yang dibuang) — tidak dipakai, cuma rujukan susun atur.

### Perubahan pangkalan data (UPBMSUBIS, 16 Okt 2026)
- Migrasi `pencapaian_tambah_kod_sekolah`: lajur `pencapaian.kod_sekolah` + indeks `(kod_sekolah, tahun)`; 257/257 baris diisi daripada `penyertaan` (program + nama sekolah sama), semua sepadan jadual `sekolah`.
- `replace_pencapaian` dikemas kini: tanda tangan SAMA; `kod_sekolah` diisi di server (daripada `penyertaan`) jika client tak hantar.
- Nama sekolah varian TIDAK diubah (sengaja): SJKC CHUNG HUA SUNGAI LUMUT → YCC4404, SJKC CHIN NAM → YCC4403, SK KPG BULAU → YBB4418. Varian sama wujud dalam `penyertaan` (48 baris beza daripada jadual `sekolah`) dan `getSkor` kira ikut nama — ubah satu jadual sahaja akan pecahkan markah sekolah.

### Belum selesai
- [ ] Uji ZIP "SEMUA SEKOLAH" dalam pelayar sebenar (~47 sekolah; sahih masa jana & saiz ZIP; juga dalam Google Sites). Ujian aliran UI dalam jsdom (admin ada kod sekolah, satu sekolah, semua sekolah, perbandingan, guru) telah lulus.
- [ ] Uji dalam pelayar sebenar selepas deploy: buka Dashboard → LAPORAN SEKOLAH → jana laporan tahun & perbandingan → MUAT TURUN PDF & CETAK (juga dalam Google Sites). Bandingkan "Jumlah Markah" satu sekolah dengan ranking Dashboard.
- [ ] Uji simpan pencapaian dari UI (`replace_pencapaian` tak dapat diuji hujung-ke-hujung dengan token sebenar; hanya pernyataan insert diuji dalam transaksi dibatalkan). Selepas simpan, semak `select count(*) from pencapaian where kod_sekolah is null` = 0.
- [ ] Keputusan: seragamkan nama sekolah varian pada KEDUA-DUA jadual serentak (58 baris: 48 penyertaan + 10 pencapaian) — pilihan, tak wajib sebab laporan padan ikut kod.
- [ ] Had PDF: nama beraksara bukan-Latin (4 baris penyertaan) jadi `?` dalam PDF (Helvetica); cetak paparkan dengan betul. Jika perlu: benam fon CJK.
- [ ] Perbandingan sesi hanya bermakna bila ada ≥2 tahun data (kini hanya 2026).

---

## 7. Aktiviti Luar (penanda program + Dashboard + penilaian komprehensif)
**Status:** Fasa 1–3 SIAP dan dipush (20–22 Okt 2026). **Belum diuji dalam pelayar sebenar** (ujian Node/jsdom lulus). Fasa 4 = pilihan.

### Fasa 1 — penanda (siap)
- DB: `programs.aktiviti_luar boolean not null default false`. `daftar_program` (+`p_aktiviti_luar` lalai false) dan `kemaskini_program_cascade` (+`p_aktiviti_luar` lalai **null = jangan ubah**, supaya halaman lama dalam cache tak menimpa penanda).
- Klien: checkbox "🌐 Aktiviti Luar" pada borang cipta (`p-luar`) dan modal ✏ EDIT (`e-luar`); `_mapProgramOut` → `'Aktiviti Luar'`. Program sedia ada ditanda melalui EDIT (admin / PKK pengelola).

### Fasa 2 — Dashboard (siap)
- Pilihan **JENIS** dalam bar tapisan (`#df-jenis`): *Teras sahaja* (LALAI = ranking rasmi, tidak berubah) | *🌐 Aktiviti Luar sahaja* | *Teras + Luar (komprehensif)*. Mengikut sistem tapisan sedia ada (`_dfFilterProgs/Pny/Pnc`) jadi semua widget, carta dan ranking mengikutinya; SET SEMULA turut menetapkan semula. `_dfFilterPnc` kini padan ikut **ID program** (nama sama antara teras & luar tak bocor).
- Panel **🌐 AKTIVITI LUAR & SKOR KOMPREHENSIF** (`#dash-luar`, `buildPanelLuar`): KPI (program luar, sekolah menyertai x/N, pencapaian luar, markah luar), jadual semua sekolah: Aktiviti Luar | Pencapaian Luar | Markah Teras | Markah Luar | Skor Komprehensif. Sekolah yang tak menyertai = "—" (bukan 0), tiada penalti dalam Skor Teras. Mengikut tapisan lain; keadaan kosong jelas (tiada program luar / tak sepadan tapisan).
- Lencana **🌐 LUAR** pada kad program, baris TUTUP dan jadual program Dashboard.

### Fasa 3 — dasar markah (siap)
- Satu pemalar dalam `index.html`: `LUAR_POLISI = {pelibatan:'TIADA'|'SETENGAH'|'PENUH', had:null|N}`. **Dasar semasa: `TIADA`, tiada had** = aktiviti luar dikira pada **pencapaian ikut Jadual Markah sahaja**, pelibatan 0.
- Sebab: Pelibatan I = markah johan di kebanyakan peringkat (11 daerah, 14 negeri, 17 kebangsaan, 20 antarabangsa; bahagian 12 vs johan 14; sekolah 0) — hadir sahaja di aktiviti luar kebangsaan = 17 mata, sama dgn johan; sekolah yang menyertai lebih banyak menang kerana kuantiti.
- `getSkor`: program luar dikenal melalui `pg['Aktiviti Luar']`; entri pelibatan tetap dicipta (0 mata) supaya penyertaan kelihatan; `had` memotong lebihan mata luar bagi setiap entiti (pencapaian dahulu, kemudian pelibatan; `total=penc+pel` kekal). Entri `detail` ada bendera `luar`.
- **Bukti tiada regresi:** `getSkor` baharu IDENTIK dgn lama pada 700 penyertaan + 160 pencapaian rawak (sekolah/peserta/guru) bila tiada program luar.
- Untuk menukar dasar: ubah `LUAR_POLISI` sahaja (panel Dashboard & Laporan Sekolah memaparkan dasar semasa secara dinamik).

### Laporan Sekolah (siap)
- Bila sekolah ada aktiviti luar: ringkasan tambah *Program teras / aktiviti luar* dan *Markah teras / aktiviti luar*, jumlah ditanda "(KOMPREHENSIF)"; senarai program dipisah **Aktiviti Teras** dan **Aktiviti Luar**; baris pencapaian & senarai nama ditanda `[AKTIVITI LUAR]`; nota dasar. Perbandingan sesi: baris tambahan (program luar, markah teras, markah luar). **Tanpa aktiviti luar, dokumen laporan IDENTIK dgn sebelum** (disahkan).

### Belum selesai
- [ ] Uji dalam pelayar sebenar: tandakan satu program luar → Dashboard (togol JENIS, panel, lencana) → Laporan Sekolah.
- [ ] **AI Analitik** (`analitik_*` RPC) belum membezakan aktiviti luar (ia guna `sum(markah)` lajur sendiri + kiraan, bukan Jadual Markah). Pertimbangkan tapis aktiviti luar atau tambah RPC khas; perlu kemas kini edge function `ai-chat`.
- [ ] Fasa 4 (pilihan): jadual "sekolah dijemput" bagi setiap aktiviti luar untuk kadar penyertaan yang adil ("tak menyertai" ≠ "tak dijemput").
- [ ] Semak dasar dengan pihak berkuasa: jika aktiviti luar patut diberi pelibatan separa, tukar `LUAR_POLISI.pelibatan` kepada `SETENGAH`.

---

## 8. Log masuk E-mel dengan Kod (OTP)
**Status:** CADANGAN (26 Okt 2026), belum dibina. Menunggu keputusan pengguna dan tetapan SMTP dalam dashboard Supabase.

**Fakta sistem:** `login_via_google()` bergantung pada `auth.uid()` SAHAJA (bukan penyedia) → sesi e-mel OTP daripada Supabase Auth boleh guna RPC yang sama tanpa ubah DB. Hanya domain `@moe-dl.edu.my` dibenarkan (`_domain_dibenarkan`). `pengguna.auth_uid`/`emel_aktif` sudah wujud (diisi semasa claim). Hanya 1 daripada 83 akaun sudah diikat ke Google — majoriti masih log masuk PIN 6 digit (tiada had percubaan).

**Aliran dicadang (Supabase Email OTP, kod 6 digit, luput ~10 min):** (1) skrin log masuk: "Log masuk dengan e-mel" → taip e-mel → `signInWithOtp` → (2) taip kod → `verifyOtp` → sesi → `_semakSesiGoogle` sedia ada (single-flight) → `login_via_google` → token app. Kali pertama (akaun belum terikat): **A** = skrin claim sedia ada (No.KP + PIN) sekali; **B (disyorkan)** = e-mel pra-daftar: admin/PKK isi e-mel pada akaun (`emel_aktif`, unik) → selepas OTP mengesahkan e-mel, sistem ikat `auth_uid` automatik (tiada PIN, tiada risiko brute-force).
**Tidak disyorkan:** magic link (dalam iframe Google Sites / tab baharu, pautan hilang konteks); OTP buatan sendiri (lebih kod & risiko, Supabase sudah ada).
**Konfigurasi (dilakukan pengguna dalam dashboard Supabase — alat saya tiada akses tetapan Auth):** (1) **SMTP tersuai WAJIB** — e-mel lalai Supabase terhad & hanya kepada ahli pasukan projek (Resend/Brevo/SendGrid/Gmail Workspace; sahkan domain SPF/DKIM supaya tak masuk spam, `moe-dl.edu.my` ialah Google Workspace); (2) templat e-mel guna `{{ .Token }}` dalam BM; (3) Auth → Email: OTP expiry 600s, panjang 6; (4) semak had kadar e-mel & interval hantar semula.
**Perubahan kod:** skrin log masuk 2 langkah + `sb.auth.signInWithOtp/verifyOtp`; DB (kaedah B): fungsi ikat e-mel (padan `lower(emel_aktif)` dgn e-mel Auth yang disahkan, `auth_uid is null`, status AKTIF) + ruang e-mel pada urus akaun. Kekalkan Google & PIN sebagai sandaran semasa peralihan.
**Kaitan keselamatan:** selepas peralihan, log masuk PIN boleh dihentikan untuk bukan-admin (menghapuskan risiko brute-force PIN). Sebelum itu had percubaan PIN & putar kod admin TETAP perlu dibuat.
**Fasa:** (1) pengguna sediakan SMTP → (2) bina OTP + claim sedia ada → (3) e-mel pra-daftar → (4) peralihan.
**Keputusan diperlukan:** adakah setiap guru/PKK ada e-mel `@moe-dl.edu.my` peribadi (satu e-mel = satu akaun), atau ada e-mel dikongsi?

---

## 9. Laporan Analitik PPD (menggantikan "Cetak Ringkasan"; khas admin / pegawai PPD)
**Status:** CADANGAN (26 Okt 2026), belum dibina. Menunggu persetujuan pengguna.

**Masalah semasa:** butang 🖨 CETAK RINGKASAN (`printDashRingkasan`) hanya menyalin 4 kad statistik + jadual program dari skrin ke tetingkap popup (disekat popup-blocker dan Google Sites), tanpa penapis, analitik atau perbandingan, dan boleh dilihat semua peranan.

**Nama butang dicadang:** **📊 LAPORAN ANALITIK PPD** (papar hanya jika `_sesi.role==='admin'`; pegawai PPD = akaun admin). Alternatif: "LAPORAN PEGAWAI".

**Antara muka:** modal `mo-lapppd` (corak sama dengan Laporan Sekolah) dengan tapisan: **Sesi/Tahun** (satu; atau 2+ untuk perbandingan), **Bidang** (SENI, BAHASA, STEM, PBB, SUKAN, LAIN-LAIN: satu/beberapa/semua), **Peringkat** (lalai SEMUA: sekolah → daerah → bahagian → negeri → kebangsaan → antarabangsa), **Jenis aktiviti** (Teras lalai / Luar / Semua; dasar projek 7), **Jenis sekolah** (SK / SJK(C) / SMK / semua; daripada kod YBA·YBB, YCC, YE*). Pratonton ringkas dalam modal, kemudian **MUAT TURUN PDF / EXCEL (selamat nombor) / CETAK**. Guna semula enjin spesifikasi-dokumen Laporan Sekolah (`__LS.renderHtml/renderPdf`) dalam modul baharu `laporan-ppd.js`: **tiada enjin PDF baharu**, `index.html` tak membesar.

**Struktur laporan:** 1 Muka depan + tapisan digunakan (ketelusan) · 2 **Ringkasan Eksekutif** (1 halaman: KPI utama, 3–5 penemuan automatik, sekolah perlu perhatian) · 3 Penglibatan Sekolah · 4 Penglibatan Murid · 5 Mengikut Peringkat (corong) · 6 Pencapaian · 7 Program dalam bidang · 8 Sekolah tidak menyertai · 9 Perbandingan sesi · 10 Kualiti data & nota kaedah.

**Analitik dicadang untuk dilaporkan kepada Ketua Jabatan** (semua boleh dikira daripada data sedia ada; angka dalam kurungan = keadaan semasa 2026):
1. **Kadar penglibatan sekolah** = sekolah ada ≥1 penyertaan ÷ jumlah sekolah (47/49 = 96%); per bidang×peringkat (cth BAHASA/Daerah 35 sekolah, SENI/Daerah 26, STEM/Daerah 30, SUKAN/Bahagian 40, PBB/Daerah 17).
2. **Kedalaman penglibatan**: purata program per sekolah; taburan (1 / 2–3 / 4+ program); sekolah penyertaan rendah (bawah persentil 25).
3. **Murid unik** (ikut No.KP, dikira dalaman sahaja; kini 1,027) per bidang/peringkat; murid dalam >1 bidang (pelbagai bakat).
4. **Demografi** jantina (L 1,098 / P 1,139) dan bangsa. **Nota jujur:** ~157 rekod tanpa jantina dan ~158 tanpa bangsa → papar "Tidak dinyatakan" + cadangan kemas kini, bukan diabaikan.
5. **Corong peringkat**: murid & sekolah di setiap peringkat dan **kadar naik peringkat** (cth SUKAN: 489 murid unik di Bahagian → 15 di Negeri = 3%).
6. **Pencapaian**: kedudukan 1/2/3 mengikut peringkat; **kadar kejayaan** = pencapaian ÷ penyertaan unik; 10 sekolah teratas (markah teras); sekolah tanpa pencapaian.
7. **Jurang akses**: sekolah tidak menyertai bidang X (senarai sekolah: "ruang pembangunan", bukan penalti); jenis sekolah (SK/SJK(C)/SMK) berbanding penyertaan.
8. **Beban guru**: guru pengiring unik, purata murid per guru, guru dengan beban tinggi.
9. **Program**: bil. program, program tanpa penyertaan, tanpa pencapaian, paling ramai peserta; **aktiviti luar vs teras dipisahkan**.
10. **Tren bulanan** penyertaan (ikut bulan program) untuk perancangan kalendar.
11. **Kualiti data**: rekod tanpa jantina/bangsa/kategori, program tanpa tarikh, nama sekolah tak sepadan.
12. **Penemuan automatik** (templat ayat): cth "Bidang SENI tiada program peringkat Bahagian", "N sekolah tidak menyertai STEM", "Penyertaan murid perempuan 51%".
**Data yang BELUM ada tetapi menambah nilai besar:** **enrolmen murid per sekolah** (untuk kadar penyertaan % murid; kini hanya angka mutlak), **sasaran KPI PPD** (sebenar vs sasaran), kategori lokasi sekolah (bandar/luar bandar/pedalaman).

**Perbandingan antara sesi (untuk masa depan, dibina sejak awal):** pilih sesi A vs B (atau semua tahun). Metrik: program, sekolah menyertai, murid unik, penyertaan, pencapaian (1/2/3), markah teras, mengikut bidang & peringkat; **perubahan mutlak dan %**; **sekolah baharu menyertai / tidak lagi menyertai**; **murid berulang vs baharu** (dikira dalaman daripada No.KP, laporan hanya agregat); sekolah naik/turun ranking ≥5 tempat; program berulang (dipadan nama tanpa tahun, sama seperti Laporan Sekolah). Dengan 1 sesi (kini): papar "Perbandingan tersedia mulai sesi 2027" dengan baik. Tiada perubahan pangkalan data: data dimuat per tahun melalui `getAllDataGS`.

**Privasi:** laporan agregat sahaja; **tiada No.KP / nama murid secara lalai**. Senarai nama hanya lampiran pilihan untuk admin (lalai MATI). Selaras projek 10.

**Fasa:** **P1** modal + tapisan + ringkasan eksekutif + sekolah & murid (PDF) → **P2** peringkat/corong + pencapaian + sekolah tidak menyertai + Excel → **P3** perbandingan sesi → **P4** penemuan automatik, tren bulanan, enrolmen/KPI (bila data tersedia).
**Keputusan diperlukan:** (1) satu laporan tetap atau pengguna pilih bahagian? (2) ada data enrolmen murid per sekolah / sasaran KPI? (3) senarai nama murid dalam lampiran, atau agregat sahaja (disyorkan)? (4) nama butang (cadangan: LAPORAN ANALITIK PPD).

---

## 10. Privasi Data Peserta — No.KP murid/guru & telefon boleh dibaca awam (KRITIKAL)
**Penemuan (26 Okt 2026, disahkan sebagai `anon`):** kunci awam (`anon`, tertanam dalam `index.html`/repo) boleh membaca terus **`no_kp_peserta` 2,186 baris, `no_kp_guru` 2,295, `no_tel_guru` 2,293** dalam `penyertaan`, dan `no_kp_*` 257/226 dalam `pencapaian` (RLS: `SELECT` terbuka). Rekod audit lama (ARKIB: "`programs`/`penyertaan`/`pencapaian` SELECT terbuka") menerima ini sebagai keputusan reka bentuk demi Dashboard, **tanpa menimbang bahawa jadual itu mengandungi PII**. Kesan: sesiapa boleh memuat turun No.KP ±1,000 murid (bawah umur 18) dan guru serta telefon (PDPA 2010).
**Kenapa tak boleh "tutup SELECT" serta-merta:** klien membaca `select *` dan memakai No.KP sebagai kunci (dedup/markah `getSkor`, borang edit, eksport). Menarik balik terus akan memecahkan Dashboard, laporan dan borang.
**Reka bentuk pembetulan (projek berasingan, perlu ujian pelayar penuh):**
1. ID anonim `id_peserta`/`id_guru` (hash bergaram di pelayan) menggantikan No.KP sebagai kunci dalam `getSkor`/Dashboard/laporan.
2. Tarik balik `SELECT` lajur PII daripada `anon`/`authenticated` (hak lajur); klien baca lajur eksplisit atau paparan `penyertaan_awam` tanpa PII.
3. RPC bertoken `penyertaan_sekolah_saya(...)` memulangkan No.KP/telefon hanya bagi sekolah pemanggil (atau PKK pengelola) untuk borang edit.
4. Uji Dashboard, Laporan Sekolah, Laporan Analitik PPD, Excel/CSV, muat naik.
**Mitigasi tanpa memecahkan klien:** tiada yang selamat; sebab itu keutamaan tertinggi bersama putar kod admin dan had percubaan log masuk.

---

## 11. Pengerasan Edge Function `ai-chat` (semakan dijeda separuh jalan, 26 Okt)
**Temuan (daripada `supabase/functions/ai-chat/index.ts` + `deploy-edge-functions.yml`):**
- Deploy tanpa `--no-verify-jwt` → JWT `anon` (awam) mencukupi: dalam praktik fungsi **terbuka kepada sesiapa** yang ada kunci anon; **tiada pengesahan sesi pengguna** (klien hanya aktifkan AI selepas log masuk, pelayan tidak menyemak) dan **tiada had kadar** → risiko kos Gemini (sehingga 4 panggilan × 4096 token bagi satu permintaan) dan penyalahgunaan sebagai proksi LLM percuma.
- Nama RPC daripada output model dipakai terus dalam URL `rpc/${nama}` **tanpa senarai putih**; argumen tak ditapis (cth `p_limit` tanpa had) → penipuan arahan (prompt injection) boleh memanggil RPC awam lain.
- `message`/`history`/`context` tanpa had panjang; hasil RPC dihantar penuh kepada model (token).
- Kunci Gemini dalam URL (`?key=`) → boleh bocor ke log; guna pengepala `x-goog-api-key`. Tiada timeout.
**Cadangan pembetulan:** senarai putih alat + klem argumen; had saiz input (mesej ≤1000 aksara, sejarah ≤10 giliran, konteks kecil) dan hasil RPC (≤25 baris); kunci dalam pengepala; timeout; **pengesahan sesi di pelayan** (klien hantar `no_kp` + token; pelayan sahkan melalui `_sahkan_token` dengan `service_role` — disahkan `service_role` boleh memanggilnya); had kadar per pengguna (+IP). Nota: deploy automatik setiap push ke `main` (GitHub Actions).
**Status:** BELUM dilaksanakan. Permintaan menyenaraikan fungsi melalui alat MCP tidak diluluskan (tidak diulang).

---

## ⭐ Cadangan Projek Mudah (untuk SESI SETERUSNYA)
_Disimpan 26 Okt 2026 atas arahan pengguna ("simpan dulu"). Mulakan sesi seterusnya dengan memilih daripada senarai ini. ⭐ = kurang sejam, ⭐⭐ = kira-kira satu sesi._

**Keselamatan (disyorkan dahulu):**
0. ⭐⭐⭐ **BARU — PRIVASI (projek 10)**: No.KP murid/guru & telefon boleh dibaca awam. Keutamaan tertinggi; projek reka bentuk, bukan kerja kecil.
1. ⭐ **Putar kod admin** dalam `app_secrets` (kod lama ada dalam sejarah repo awam). Kod baharu diberi dalam sembang sahaja, tidak ditulis dalam fail.
2. ⭐⭐ **Had percubaan log masuk**: kunci akaun/No.KP sementara selepas beberapa kegagalan pada `login_pengguna`, `login_admin`, `claim_akaun_google` (PIN 6 digit = 1 juta kombinasi, kini tiada had). Jadual log percubaan + ujian dalam transaksi dibatalkan.
3. ⭐ **Revoke PAT GitHub** yang pernah dikongsi (tindakan pengguna di GitHub).

**Pembersihan / baiki kecil:**
5. ⭐ **Buang kod mati frontend** — SIAP & diuji asap dalam cabang **`jeda/kod-mati-frontend`** (23 fungsi ~551 baris termasuk rantaian PIN lama `askPin`/`doPin`/`mo-pin`/`verifyPinGS`; 0 ralat pemuatan, tepat 23 fungsi global kurang). **Belum digabung ke `main`** (dijeda atas arahan). Gabung bila bersedia (cherry-pick).
6. ⭐⭐ **Pengerasan edge function `ai-chat`** — kajian siap, temuan dalam **projek 11**; pelaksanaan menunggu.
7. ⭐⭐ **AI Analitik tapis aktiviti luar**: RPC `analitik_*` mengira aktiviti luar dengan peraturan lama; tapis/asingkan dan kemas kini `ai-chat` (gabungkan dengan projek 11).

**Ciri kecil yang berguna:**
9. ⭐⭐ **PDF nama beraksara Cina** (4 baris sekarang jadi `?`): benam fon CJK dalam pdf-lib.
10. ⭐⭐ **Semakan pendua muat naik Excel** (Bulk): disahkan tiada semakan pendua dalam `_prosesBulkXlsx` hari ini (No.KP sama dua kali dalam helaian, atau sudah ada dalam borang/DB, akan ditambah semula). Tambah amaran sebelum simpan.
11. ⭐ **`cek_status_akaun`**: boleh dipanggil tanpa log masuk dan memulangkan nama, peranan, status, sekolah dan 'sudah ikat Google' bagi mana-mana No.KP (kebocoran data peribadi + membantu pemilihan sasaran). Kurangkan medan dipulangkan (skrin log masuk perlukan status sahaja sebelum PIN) dan tambah had kadar.
13. ⭐ **Seragamkan format No.Tel `pengguna`**: 62 daripada 83 bukan `+60…` (digit sahaja / `60…` / `+600…`). Guna `_norm_tel`; satu migrasi + sandaran. Juga betulkan paparan Excel guru yang bergantung pada format.
14. ⭐ **Padam jadual sandaran** `arkib_nama_sekolah_20261026` dan `arkib_penyelarasan_sekolah_20261026b` selepas anda yakin penyeragaman nama & kod betul (ia membolehkan pemulihan nilai lama; RLS dikunci).

**Lebih besar (bila sedia):** projek 8 (log masuk e-mel OTP; perlu SMTP + keputusan A/B), projek 2 (modal edit penyertaan), projek 3 (wizard), projek 4 (SPBM).

**Ujian pelayar tertunggak (oleh pengguna, tiada kod):** Laporan Sekolah (satu sekolah, perbandingan, ZIP semua sekolah), Aktiviti Luar (tanda program → Dashboard JENIS/panel/lencana → laporan), simpan pencapaian dari UI (semak `kod_sekolah` terisi), claim akaun Google, log masuk/keluar berulang.

---

## Nota Kerja (rujukan tetap)

### 🔑 Nota kredensial (JANGAN letak nilai sebenar dalam fail ini)
- Kod admin, GitHub PAT, Gemini API key — semua disimpan sebagai Supabase secret /
  app_secrets / GitHub Actions secret. **Tak disenaraikan di sini.**
- PAT GitHub yang pernah digunakan dalam sesi pembaikan ni disyorkan **di-revoke** lepas
  kerja selesai, cipta baharu bila perlu sesi akan datang.

### Cara sambung sesi akan datang
1. Baca fail ini dari repo (`PROGRESS.md` di root) — semak bahagian STATUS RINGKAS di atas
2. Untuk kerja RLS/Google Sign-In: baca bahagian berkaitan di atas dahulu SEBELUM buat perubahan
3. Sambung Supabase MCP connector di awal sesi (projek: `UPBMSUBIS` / `pztuvriqjgfwczkuguky`)
4. Kalau perlu push ke GitHub, sediakan PAT baharu (skop "Contents: Read and write" untuk repo ni)

### Peraturan hemat token — Kenapa token cepat habis selepas "Continue" (analisis jujur; angka sebenar token tak dapat diukur dari sini)
1. **Sejarah perbualan terlalu panjang** (ratusan panggilan alat). Setiap langkah/alat memproses semula keseluruhan
   sejarah — kos naik bersama panjang sembang × bilangan panggilan, bukan saiz kerja semasa.
2. **"Continue" memaksa saya orientasi semula**: keputusan alat lama dah "dikosongkan untuk jimat konteks", jadi saya
   baca semula benda sama (grep/sed/view) sebelum boleh sambung. Kontena juga kerap reset (repo hilang → klon semula
   + set identiti git + sync fail) = beberapa panggilan membazir setiap kali.
3. **Cara kerja saya boros**: papar petikan fail besar (index.html 585 KB; PROGRESS.md 46 KB ≈ puluhan ribu token jika
   dibaca penuh); hantar semula kandungan penuh Edge Function (~11 KB) berkali-kali semasa deploy; ulang semakan sintaks +
   baki tag + salin + commit selepas setiap suntingan kecil; terlalu banyak panggilan kecil dan bukan satu skrip.
4. **Giliran saya sering berhenti separuh jalan** → anda tekan "Continue" berulang; setiap tekanan = satu lagi laluan
   penuh atas sejarah panjang.
**Peraturan kerja hemat token (WAJIB untuk sesi akan datang):**
- Mula sesi: baca HANYA bahagian "Checkpoint semasa" (`tail -40 PROGRESS.md`), jangan baca keseluruhan fail.
- Output alat: sentiasa `grep -n ... | cut -c1-150 | head`; `sed` maksimum ~25 baris; jangan `cat` fail besar.
- Satu skrip = suntingan + semakan sintaks + commit + push (bukan 4 panggilan).
- Jangan semak semula perkara yg tak berubah; satu penghantaran per giliran, lapor ringkas, berhenti.
- Jangan hantar semula kandungan penuh Edge Function melainkan fail itu berubah.
- Sembang baharu untuk setiap milestone besar (A, W1, W2...) bermula dgn: "Baca bahagian Checkpoint dlm PROGRESS.md
  repo ahmadalafiq/upbmsubis, sambung dari <fasa>". (PAT GitHub diberi semula oleh user; JANGAN simpan PAT dlm fail.)
**Cadangan pengurusan fail:** (i) ringkaskan `PROGRESS.md` → fail pendek (status + langkah seterusnya, ≤5 KB) dan
pindahkan sejarah ke `docs/SEJARAH.md` (arkib, tak dibaca rutin); (ii) kod BARU (wizard, modal edit, SPBM/HEM) dalam
fail JS/HTML berasingan, bukan menambah index.html yg sudah 585 KB — setiap tugasan akan perlu baca bahagian kecil sahaja.

---

## Checkpoint semasa (26 Okt 2026): **TUGAS SEMENTARA SIAP: nama fail laporan (kod+nama sekolah+tahun), perkataan kategori tak terputus, carian sekolah AI longgar. Kerja lain DIJEDA: kod mati (cabang `jeda/kod-mati-frontend`), pengerasan edge function (projek 11). CADANGAN baharu: projek 9 (Laporan Analitik PPD). PENEMUAN KRITIKAL: projek 10 (No.KP/telefon boleh dibaca awam). Terbuka utama: putar kod admin, had percubaan log masuk, revoke PAT GitHub.**
