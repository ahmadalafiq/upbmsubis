# STRUKTUR FAIL — UPBM Subis

**Baca fail ini dahulu, kemudian buka HANYA fail yang berkaitan.** `index.html` kini cangkerang sahaja (~1,100 baris); logik ada dalam `js/`, gaya dalam `css/`. Senarai penuh fungsi: `INDEKS.md` (dijana automatik).

Dipecahkan daripada satu fail 600 KB (16 Nov 2026, tag git `pra-pecah` = versi asal). Pemecahan **mekanikal**: kandungan bait demi bait sama, hanya dipotong mengikut turutan asal.

## Hos & kekangan
- Hos statik di **Vercel**, dibenamkan dalam **Google Sites** (iframe). Tiada langkah build, tiada bundler.
- Semua skrip ialah **skrip klasik** (`<script src>`, tanpa `defer`/`type=module`). Sebab: ±284 pengendali `onclick="..."` memanggil fungsi global. Jangan tukar ke ES module tanpa menukar semua pengendali itu.
- **Turutan `<script>` dalam `index.html` penting** (sama seperti turutan dalam fail asal). Fungsi global tidak boleh dipanggil semasa muat jika ia ditakrif dalam fail yang dimuat kemudian.
- `?v=YYYYMMDD` pada setiap `<link>`/`<script>` memecahkan cache. Naikkan setiap deploy:
  `sed -i 's/?v=[0-9]*/?v=20261201/g' index.html`

## CSS (turutan cascade = turutan fail)
| Fail | Isi |
|---|---|
| `css/01-base.css` | pembolehubah warna, tema, layout asas, responsive |
| `css/02-components.css` | carian, tapisan, status tab, podium, multi-select, modal carian |
| `css/03-pages.css` | login, auth state, up-arrow, status draft, counter, toggle kad/senarai |
| `css/04-fullscreen-nav-widgets.css` | fullscreen, bottom-nav (mobile), analitik dashboard, AI chat, FAB |

## JavaScript (turutan muat)
| Fail | Isi | Buka bila... |
|---|---|---|
| `01-config-dispatcher` | konfigurasi & klien Supabase, pemetaan baris↔objek, `_supaDispatch` (semua panggilan data/RPC), `_fetchAllPaged` | ubah query/RPC, medan jadual |
| `02-core` | huruf besar paksa, realtime sync, `esc`, `mPts`, cache `_C`, pilih tahun, `run()`, overlay, `showPage`/nav, confirm tersuai | masalah navigasi, cache, tahun |
| `03-program-senarai` | tab Pengelola: daftar program, senarai/kad program, tapisan, buka edit | senarai program |
| `04-program-edit-pencapaian` | `saveEdit`, borang pencapaian (`renderPcForm`) | simpan edit program |
| `05-pencapaian-rumusan` | dropdown multi-pilih `_chkd*`, `savePenc`, `padamProg`, rumusan | simpan pencapaian, padam program |
| `06-print-export` | portal cetak, eksport CSV/Excel (satu sheet per sekolah) | cetak, eksport |
| `07-penyertaan-draf` | auto-simpan draf penyertaan, format No. Tel/KP | draf, borang penyertaan |
| `08-penyertaan-bulk` | daftar peserta/guru melalui Excel (template, muat naik) | bulk Excel |
| `09-penyertaan-pdf` | PDF salinan penyertaan (`janaPdfSalinanPenyertaan`), cetak salinan | PDF salinan |
| `10-dashboard` | `loadDash`, `getSkor`, polisi Aktiviti Luar (`LUAR_POLISI`), ranking, cetak ringkasan | markah, ranking, kiraan |
| `11-modal-carian` | `openMo`/`closeMo`, carian, unified print builder, modal carian ranking/pencapaian | modal, carian |
| `12-sekolah` | senarai sekolah statik/kanonik, jenis SR/SM, autocomplete kod & nama sekolah | data sekolah |
| `13-dashboard-filter` | `rebuildDash`, penapis bidang, widget "sekolah belum ada rekod" | penapis dashboard |
| `14-auth-login` | login (No.KP+PIN), `_mulakanSesi`, profil saya, log keluar, daftar akaun | login/logout |
| `15-akaun-admin` | panel akaun (admin): senarai, tapisan peranan/sekolah, carian, kumpulan ikut sekolah | urus akaun |
| `16-akses-sesi-idle-google` | semakan akses, `_initSesiDariStorage`, **idle timer**, Google Sign-In & claim akaun, `_initApp` | sesi, timeout, Google login |
| `17-dashboard-analitik-fullscreen` | bottom-nav, `animateCounter`, toggle kad/senarai, fullscreen, penapis lanjutan, carta (bidang/donut/trend/jantina), jadual program | carta, kad statistik |
| `18-ai-fab` | widget AI chat, butang "+ TAMBAH" terapung | AI chat |
| `19-sekolah-menyertai` | projek 16: widget "Sekolah yang menyertai" (Daftar/Edit Program), modal amaran selepas login (`semakTugasanSelepasLogin`), `_pcTicked` untuk Pencapaian | tick sekolah, modal tugasan |
| `20-agensi-luar` | tick "Dianjurkan oleh agensi luar" (Daftar & Edit Program): kod auto Y044 (PPD SUBIS) | agensi luar |
| `21-wizard-program` | W1: wizard 6 langkah Daftar Program dalam MODAL (`mo-daftar-prog`); draf auto-simpan, ID stabil, mesej timeout | wizard program, draf |
| `22-modal-penyertaan` | modal DAFTAR / EDIT PENYERTAAN (`mo-peny`): borang dialih ke modal, tanpa tukar halaman; pembalut `pilihProg`/`resetPeny` | modal penyertaan |
| `23-ux-aksesibiliti` | ARIA modal, ESC, focus-trap, label/medan, jalur luar talian | aksesibiliti |
| `24-anugerah` | halaman ANUGERAH (admin sahaja): rubrik, pratonton, Emas/Perak/Gangsa, tempat 1-5 sekolah & guru, eksport Excel | anugerah, rubrik |
| `laporan-sekolah.js` | Laporan Sekolah + perbandingan sesi (dimuat terakhir; kekal di akar) | laporan |

**Dashboard merentas 3 fail:** `10` (data/skor), `13` (rebuild/penapis), `17` (kad statistik, carta, penapis lanjutan).

## Aliran kerja
1. Cari fungsi: `grep -n "nama" INDEKS.md` → buka fail itu sahaja.
2. Selepas menambah/menamakan semula fungsi: `python3 tools/jana_indeks.py`.
3. Fail JS baharu: tambah `<script src="js/NN-nama.js?v=...">` dalam `index.html` pada kedudukan yang betul.
4. Semakan sebelum deploy: `node --check js/*.js`. Untuk ubah suai besar, banding dengan versi lama:
   `node tools/bandingkan-jsdom.js <folder-lama> <folder-baharu>` (perlu `npm i jsdom@22.1.0`) — mesti sama bilangan fungsi global & 0 ralat.
5. Uji dalam pelayar sebenar **dan** dalam Google Sites sebelum merge ke `main`.

## Binaan & penempatan
- Sumber: `js/`, `css/`, `index.html`. `npm run build` (esbuild) -> `dist/` (minify + cap versi hash). Vercel membina menurut `vercel.json`.
- Fail pangkalan data: `supabase/migrations/` (pelaksanaan manual melalui Supabase). `20261119_revoke_analitik_anon.sql` = langkah SELEPAS deploy edge function.
- Edge function `ai-chat`: auto-deploy oleh GitHub Action semasa push ke `main`. Ujian logik: Deno + fetch tiruan (lihat AUDIT.md).
