# UPBM Subis — Progress Pembaikan

_Kemas kini terakhir: 16 Okt 2026 — hanya kerja AKTIF/BELUM SIAP di sini. Kerja siap diarkibkan dalam `ARKIB.md`._

---

## 🔑 Nota kredensial (JANGAN letak nilai sebenar dalam fail ini)
- Kod admin, GitHub PAT, Gemini API key — semua disimpan sebagai Supabase secret /
  app_secrets / GitHub Actions secret. **Tak disenaraikan di sini.**
- PAT GitHub yang pernah digunakan dalam sesi pembaikan ni disyorkan **di-revoke** lepas
  kerja selesai, cipta baharu bila perlu sesi akan datang.

---

## Cara sambung sesi akan datang
1. Baca fail ini dari repo (`PROGRESS.md` di root) — semak bahagian STATUS RINGKAS di atas
2. Untuk kerja RLS/Google Sign-In: baca bahagian berkaitan di atas dahulu SEBELUM buat perubahan
3. Sambung Supabase MCP connector di awal sesi (projek: `UPBMSUBIS` / `pztuvriqjgfwczkuguky`)
4. Kalau perlu push ke GitHub, sediakan PAT baharu (skop "Contents: Read and write" untuk repo ni)

---

## 📋 PERANCANGAN — Projek SPBM (Sistem Pengurusan Maklumat) — BELUM DILAKSANAKAN

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

---

## Checkpoint semasa: **SPBM — rancangan disimpan, tunggu arahan mula. Fokus balik ke UPBM Subis sedia ada buat masa ini.**

---

## 📋 PERANCANGAN — Pendaftaran Bentuk WIZARD (Program & Penyertaan) — BELUM DILAKSANAKAN

**Status: RANCANGAN SAHAJA. Tiada perubahan dibuat pada index.html / Supabase. Tunggu 4 keputusan user.**

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

### 4 keputusan BELUM dijawab user
1. Mula dgn Program dahulu (cadangan) atau kedua-dua serentak?
2. Kekalkan pautan "borang biasa" sbg sandaran?
3. Mod kemaskini juga wizard, atau kekal borang ringkas 1 halaman?
4. Langkah Guru Pengiring wajib atau boleh langkau?

### Nota sampingan (belum disemak)
Halaman Akaun masih ada butang "MIGRATE (Kemaskini header sheet PIN)" — nampak sisa zaman Google Sheets,
kemungkinan kod mati. Perlu disemak sebelum dibuang.

---

## Checkpoint semasa: **Wizard — rancangan disimpan, tunggu 4 keputusan user. SPBM juga masih tergantung (rujuk bahagian atas).**

---

## 📋 PELAN BARU (8 Okt 2026) — SEMUA BELUM DILAKSANAKAN (index.html & Supabase TIDAK disentuh)

### A. Edit penyertaan dalam MODAL (arahan user)
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

### B. Buang butang MIGRATE (+ BACKFILL TAHUN) — selamat dibuang
**Bukti:** handler `migrateSheetGS` (baris ~2740) cuma pulang "Tiada migrasi diperlukan (Supabase)" — sisa zaman
Google Sheets. `BACKFILL TAHUN`: Supabase semak → 0 daripada 114 program ber-`tahun` NULL, dan `daftar_program`
sentiasa set tahun → utiliti ini pun tak berguna lagi.
**Lokasi buang (index.html):** butang MIGRATE (baris ~1661) + butang BACKFILL TAHUN sebelahnya; handler
`migrateSheetGS` & `backfillTahunGS` dlm `_supaDispatch`; entri `migrateSheetGS:1, backfillTahunGS:1` dlm `_WRITE_FNS`
(~2950); fungsi `akMigrateSheet()` (~9922) & `akBackfillTahun()`. **DB (kemudian, perlu kelulusan berasingan):**
drop RPC `program_backfill_tahun`. Risiko rendah, 1 commit. Kekalkan butang "SENARAI SEKOLAH" (panel urus sekolah).

### C. Wizard pendaftaran — 4 keputusan dibuat (ikut objektif: guru sekolah pelbagai kemahiran digital, data tepat)
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

### D. Kenapa token cepat habis selepas "Continue" (analisis jujur; angka sebenar token tak dapat diukur dari sini)
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

## 📌 Item terbuka dibawa dari arkib (16 Okt 2026)
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

**Keselamatan (ditambah semasa pengarkiban):**
- [ ] Kod admin pernah tertulis terang dalam repo awam (termasuk sejarah git). Putar semula kod admin dalam `app_secrets` dan jangan tulis nilainya dalam mana-mana fail. Nilai lama telah dipadam daripada `ARKIB.md`.

---

## Checkpoint semasa (8 Okt 2026): **PELAN A (modal edit), B (buang MIGRATE), C (wizard) & D (hemat token) SIAP DIRANCANG. Tunggu arahan mula. Cadangan pertama: B, kemudian A. Pelan SPBM juga masih tergantung.**
