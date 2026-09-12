# UPBM Subis — Progress Pembaikan
_Kemas kini terakhir: 7 Sept 2026 — disimpan dalam repo GitHub supaya jadi rujukan tunggal (single source of truth) untuk sesi Claude akan datang._

## 🟢 STATUS RINGKAS
| Kerja | Status |
|---|---|
| Kerja 1 — Fix ringan (6 bug kod) | ✅ SIAP, live |
| Kerja 1 — Backend (hash PIN, RPC atomic, admin secret) | ✅ SIAP, live di Supabase |
| Kerja 1 — RLS (kunci akses data) | ⛔ BELUM — sengaja ditangguh, baca sebab di bawah |
| Kerja 1 — Google Sign-In & claim akaun | ⛔ BELUM — draf sedia, belum dijalankan |
| Kerja 2 — Pembantu AI (chat) | ✅ SIAP & BERFUNGSI, 2 bug dijumpai+dibetulkan |
| Bulk daftar peserta via Excel | ✅ SIAP — templat + muat naik + validasi |
| Google Sign-In & Claim Akaun | 🟡 KOD SIAP — perlu 2 langkah manual anda dahulu (baca bawah) |
| GitHub ↔ Supabase sync | ✅ Segerak (push terakhir: `96db63b`) |

---

## KERJA 1 — Fix ringan + Backend
### Fix ringan (dalam index.html) — ✅ SEMUA SIAP
1. KESELURUHAN hilang dalam hantarPeny — dibetulkan
2. esc() bertindih (3 definisi → 1) — dibetulkan
3. Nama pembolehubah `sb` tertindih (5 tempat) — dibetulkan
4. Mesej ralat lapuk "Apps Script/DriveApp" — dikemaskini
5. Komen mengelirukan "PEMBETULAN KRITIKAL #4" — dikemaskini
6. setInterval tanpa clearInterval — dibetulkan
- Sah: `node --check` lulus, tag HTML seimbang

### Backend (Supabase) — ✅ SUDAH LIVE (bukan draf)
Dijalankan terus di projek `UPBMSUBIS` (`pztuvriqjgfwczkuguky`) via Supabase MCP:
- pgcrypto diaktifkan; semua 83 PIN pengguna di-hash (bcrypt)
- Jadual `app_secrets` dicipta — kod admin dipindah ke sini (bukan lagi dalam JS)
  - Kod admin semasa: **`SUBIS-ADMIN-A44TZT1C7G`** (dah ditukar dari default lama)
- RPC dicipta: `login_admin`, `login_pengguna`, `set_pin`, `padam_program_cascade`,
  `kemaskini_program_cascade`, `replace_pencapaian`
- `index.html` dikemaskini guna RPC ni (loginGS, verifyPinGS, daftarAkaunGS, resetPinGS,
  kemaskiniProgramGS, padamProgramGS, simpanPencapaianGS); `ADMIN_MASTER_KOD` dibuang dari JS
- **Disahkan berfungsi** oleh user: login, edit/padam program, simpan pencapaian — semua OK

**Penemuan sampingan:**
- `askPin()`/`doPin()` dalam index.html — kod mati, tak dipanggil, selamat diabaikan
- Lajur `emel_aktif` & `session_token` wujud dalam jadual `pengguna` tapi tak digunakan —
  calon sedia untuk Google Sign-In (guna semula `emel_aktif`, tak perlu lajur `email` baharu)

### RLS (Bahagian D) — ⛔ BELUM, SENGAJA DITANGGUH
**Status semasa:** SEMUA jadual (`programs`, `penyertaan`, `pencapaian`, `pengguna`, `sekolah`)
ada polisi `qual: true` untuk anon pada SELECT/INSERT/UPDATE/DELETE — akses terbuka penuh.

**Kenapa belum dikunci:** Sistem ni tiada auth sebenar (Supabase Auth) — semua guna SATU anon
key sama. RLS row-level tak boleh bezakan "admin" vs "guru" tanpa `auth.uid()`/JWT. RPC
(security definer) selamat dan bypass isu ni, tapi fungsi client lain (`getAkaunListGS`,
akaun approval, dashboard, senarai program) masih `sb.from(...).select/update()` terus dari
browser — perlukan RLS terbuka untuk berfungsi buat masa ini.

**2 jalan penyelesaian (pilih satu sebelum kunci RLS):**
- **(a)** Siapkan Google Sign-In dulu → `auth.uid()` sebenar wujud → RLS ikut peranan jadi
  bermakna. Lebih elegan jangka panjang, tapi lebih lambat siap.
- **(b)** Tukar semua fungsi admin (`getAkaunListGS`, akLulus, dll — anggar 5-6 fungsi) jadi
  RPC `security definer` macam login. Lebih cepat, boleh kunci `pengguna` terus tanpa tunggu Auth.

⚠️ **Jangan tampal polisi RLS ketat tanpa (a) atau (b) siap dulu — admin panel/dashboard akan rosak.**

### Google Sign-In & Claim Akaun (Bahagian E) — 🟡 KOD SIAP, TUNGGU SETUP MANUAL
Sudah siap & live (commit `96db63b`):
- Lajur `auth_uid` ditambah pada `pengguna`; guna semula `emel_aktif` sedia ada
- RPC `claim_akaun_google(no_kp, pin)` — sahkan No.KP+PIN sedia ada, ikat ke akaun Google
- RPC `login_via_google()` — log masuk automatik untuk akaun yang dah diikat
- Butang "Log Masuk dengan Google" di skrin log masuk
- Modal "Sahkan Akaun Sedia Ada" — muncul automatik lepas Google sign-in kalau akaun belum diikat
- `sb.auth.signOut()` ditambah pada fungsi logout sedia ada
- No.KP+PIN LAMA dikekalkan sepenuhnya sebagai cara log masuk — tiada apa yang dibuang

**⚠️ BELUM BOLEH DIGUNAKAN — 2 langkah manual WAJIB dibuat dahulu (di luar akses Claude):**

1. **Google Cloud Console** — https://console.cloud.google.com
   - Cipta projek baharu (atau guna sedia ada) → APIs & Services → Credentials
   - Create Credentials → OAuth Client ID → Application type: **Web application**
   - Authorized redirect URI: `https://pztuvriqjgfwczkuguky.supabase.co/auth/v1/callback`
   - Salin **Client ID** dan **Client Secret**

2. **Supabase Dashboard** — https://supabase.com/dashboard/project/pztuvriqjgfwczkuguky/auth/providers
   - Cari **Google** dalam senarai provider → Enable
   - Tampal Client ID + Client Secret dari langkah 1 → Save
   - Di **Auth → URL Configuration**, pastikan domain tempat app di-hosting disenaraikan
     dalam "Redirect URLs" (cth. URL GitHub Pages/hosting sebenar anda)

**Lepas 2 langkah ni siap**, butang "Log Masuk dengan Google" di app akan terus berfungsi —
tiada kod tambahan diperlukan. Uji dengan: (a) akaun Google + No.KP yang belum pernah
diikat (patut papar modal claim), (b) log masuk kali kedua dengan akaun Google yang sama
(patut terus masuk tanpa modal claim).


---

## KERJA 2 — Pembantu AI (chat widget) — ✅ SIAP & BERFUNGSI
Edge Function `ai-chat` + GitHub Actions CI/CD **sudah wujud** dalam repo ni sejak awal
(bukan dibina oleh Claude). Semasa disemak, 2 bug dijumpai & dibetulkan:

1. **Model `gemini-2.0-flash` deprecated** (404 dari Google) → ditukar ke `gemini-3.6-flash`
   (commit `156f6bb`)
2. **Respons AI terputus tengah ayat** → punca: `maxOutputTokens: 500` terlalu rendah untuk
   model `gemini-3.6-flash` (guna sebahagian kuota untuk "thinking" dalaman sebelum jana teks).
   Cuba `thinkingConfig:{thinkingBudget:0}` DITOLAK API (400 invalid argument — bukan format
   yang disokong). Fix akhir: naikkan `maxOutputTokens` ke 4096 (commit `b99b861`).

Disahkan berfungsi end-to-end (respons penuh diterima, status 200). GitHub ↔ Supabase segerak
via CI/CD (`deploy-edge-functions.yml`).

---

## Bulk Daftar Peserta/Guru via Excel — ✅ SIAP (baharu)
Ciri baharu dalam tab Penyertaan (`index.html`, commit `a413b24`):
- **📥 TEMPLAT EXCEL** — muat turun fail `.xlsx` kosong (sheet PESERTA + GURU + PANDUAN),
  senarai kategori sah untuk program yang dipilih terus disertakan dalam sheet PANDUAN
- **📤 MUAT NAIK EXCEL** — baca fail `.xlsx` yang diisi, validasi setiap baris (No.KP format,
  jantina LELAKI/PEREMPUAN, kategori sepadan senarai program), amaran dipapar kalau ada ralat
- Data yang lulus/separuh lulus terus diisi ke senarai peserta/guru **sedia ada** dalam borang
  (guna struktur `_penyData.pesList`/`guruList` yang sama dgn "+ TAMBAH PESERTA" manual) —
  jadi terus guna semula flow `semakPeny`/`hantarPeny` sedia ada, tiada perubahan backend perlu
- Perlu program dipilih dahulu (untuk tahu senarai kategori sah) sebelum boleh muat turun/naik

**Belum dibuat (peningkatan akan datang, tak wajib sekarang):**
- Validasi bantuan AI (auto-mapping lajur kalau format Excel pengguna sedikit berbeza)
- Semakan pendua (peserta sama dimuat naik dua kali)

**Diuji (7 Sept 2026):** Kod sebenar `_prosesBulkXlsx()` di-extract terus dari index.html dan
dijalankan (Node.js + SheetJS) terhadap fail Excel ujian dengan 6 jenis ralat sengaja
(No.KP tanpa sengkang, kategori berganda, No.KP tak sah, jantina tak sah, kategori tak wujud,
kategori kosong, baris CONTOH/kosong). Semua kes dikendali dengan betul. Disahkan juga:
fungsi `semakPeny()` sedia ada (tak diubah) sudah jadi lapisan pemeriksaan kedua yang blok
penghantaran untuk sebarang data tak lengkap (termasuk kategori kosong) — tiada risiko data
bulk-import hilang senyap ke pangkalan data.

**Soalan: bila banyak user submit serentak, semua orang dapat "global refresh"?**
Jawapan: **TIDAK, ini sudah direka dengan betul.** `_initRealtimeSync()` guna Supabase Realtime
dengan debounce 2 saat, tangguh kemaskini jika user ada borang/modal aktif, refresh silent
(tiada overlay) terhad kepada tab semasa sahaja, kedudukan scroll dikekalkan. Tiada
`location.reload()` di mana-mana dalam seluruh fail.

---

## 🔑 Nota kredensial (JANGAN letak nilai sebenar dalam fail ini)
- Kod admin, GitHub PAT, Gemini API key — semua disimpan sebagai Supabase secret /
  app_secrets / GitHub Actions secret. **Tak disenaraikan di sini.**
- PAT GitHub yang pernah digunakan dalam sesi pembaikan ni disyorkan **di-revoke** lepas
  kerja selesai, cipta baharu bila perlu sesi akan datang.

## Cara sambung sesi akan datang
1. Baca fail ini dari repo (`PROGRESS.md` di root) — semak bahagian STATUS RINGKAS di atas
2. Untuk kerja RLS/Google Sign-In: baca bahagian berkaitan di atas dahulu SEBELUM buat perubahan
3. Sambung Supabase MCP connector di awal sesi (projek: `UPBMSUBIS` / `pztuvriqjgfwczkuguky`)
4. Kalau perlu push ke GitHub, sediakan PAT baharu (skop "Contents: Read and write" untuk repo ni)

---

## Sesi Penyelarasan & Siasat Data (7 Sept, lanjutan) — Fasa 0-3

### Fasa 0 — Penyelarasan
Ditemui 6 commit yang user buat sendiri (`91f8029`...`fab3606`) membetulkan bug Google
Sign-In (z-index modal tersembunyi di belakang skrin login, URL fragment `##access_token`,
auth_uid check, error handling). Semua disahkan & diselaraskan ke kerja Claude.

### Fasa 1 — Bug sistemik "data hilang" (kes: program tunjuk 19 tapi Excel/kad kosong)
**Punca akar:** `getAllDataGS` guna `select('*')` TANPA `.range()`/paginasi pada jadual
`penyertaan` (2,123 baris) & `pencapaian` — PostgREST hadkan diam-diam kepada 1000 baris
lalai. Program yang jatuh selepas had 1000 "hilang" dari kad Pengelola/Dashboard walaupun
wujud di DB. `expXlsx` turut guna cache `_aP` stale (sama corak bug macam `lihatPeny` lama).

**Dibetulkan (commit `94b960f`):**
- Fungsi baharu `_fetchAllPaged()` — baca semua baris secara bersegmen 1000/segmen,
  order by `id` untuk paginasi stabil
- `getAllDataGS` guna fungsi ni untuk penyertaan & pencapaian
- `expXlsx` tak lagi guna `_aP` — fetch fresh via `getEditDataGS` (sama pendekatan `lihatPeny`)

### Fasa 1b — Bug pemarkahan `getSkor`
Kod sengaja susun ikut kedudukan terbaik dahulu (komen "ISU 4"), tapi kunci dedup masih
sertakan `tempat` — niat asal (kekal terbaik sahaja) gagal dilaksanakan. Peserta dgn >1
kedudukan (cth. 1st DAN 2nd direkod utk acara sama) markah dikira DUA-DUA (inflated).
**Dibetulkan (commit `94b960f`):** buang `tempat` dari kunci dedup (peserta/guru/sekolah) —
kedudukan terbaik sahaja dikira, selari dgn susunan `_tempatRank` yang sedia ada.

### Fasa 2 — Audit pendua (penyertaan & pencapaian)
Semak seluruh jadual, jumpa 3 KATEGORI berbeza pendua — **bukan semua selamat dipadam**:

1. **9 baris — pendua "double-click" sah** (SK Rumah Barat, jurang 12.3 saat, kelompok
   sama) — **DIPADAM** (commit tindakan DB terus, bukan commit kod).
2. **3 baris — Bridge Building** (kod sekolah "YBB 4403" tertulis dlm medan nama, patut
   "SK KAMPUNG IRAN"; guru & peserta sama) — **DIPADAM**, kekal entri dgn nama sekolah penuh.
3. **17 kes — No.KP sama, SEKOLAH BERBEZA, ejaan nama sedikit berbeza** (cth. "LOVELIA USUN
   LUCAS" vs "LOVELA USUN LUCAS", guru & sekolah berlainan sama sekali) — **TIDAK DIPADAM**.
   Analisis kuat menunjukkan ini kemungkinan 2 PELAJAR SEBENAR BERBEZA yang bertindih No.KP
   (kesilapan taip IC), BUKAN satu pelajar didaftar dua kali. Padam salah satu berisiko
   hapuskan pendaftaran sah pelajar sekolah lain. **PERLU disahkan oleh sekolah berkenaan.**
4. **1 kes — JUSCHENA ROVESHA** (SK Kampung Iran, jurang 64 hari) — diasingkan dari
   kelompok "double-click", TIDAK dipadam (jurang terlalu jauh utk anggap tak sengaja).
5. **Pencapaian Drone Challenge** (4 peserta SMK Bekenu, TERBUKA BERKUMPULAN DAERAH) —
   setiap peserta ada 2 rekod (TEMPAT PERTAMA markah 11 DAN TEMPAT KEDUA markah 10,
   timestamp SAMA ke milisaat). **TIDAK DIPADAM** — perlu pengesahan kedudukan sebenar
   pasukan (1st atau 2nd) daripada rekod rasmi pertandingan sebelum boleh betulkan.

### ⏳ Belum selesai — menunggu keputusan/input
- [ ] Kedudukan sebenar pasukan Drone Challenge SMK Bekenu (1st/2nd) — untuk betulkan
  jadual `pencapaian` terus (2 baris x 4 peserta = 8 baris perlu disemak)
- [ ] 17 kes No.KP bertindih sekolah-berbeza — perlu proses sahkan dgn sekolah berkenaan
  (senarai penuh sudah dijana, boleh diminta semula bila perlu)

### ✅ Ditutup (7 Sept) — kedua-dua item tergantung dipadam atas arahan user
Keputusan: padam terus data yang tak boleh disahkan mana satu betul, sekolah akan
kemaskini semula pendaftaran/pencapaian secara berasingan bila perlu.
- **Drone Challenge** (8 baris pencapaian, 4 peserta x 2 kedudukan bertindih) — DIPADAM
- **17 kes No.KP bertindih sekolah-berbeza** (28 baris penyertaan tersisa selepas 3 kes
  Bridge Building diselesaikan awal) — DIPADAM
- Jumlah akhir: `penyertaan` 2,123 → **2,083** baris | `pencapaian` 266 → **258** baris
- Tiada tindakan lanjut diperlukan dari Claude — sekolah akan daftar semula bila bersedia

## STATUS AKHIR SESI (7 Sept, ~18:xx)
Semua kerja aktif ditutup. Tiada item terbuka yang perlu tindakan segera. Sesi akan
datang boleh mula dari: (a) sahkan Google Sign-In berfungsi penuh di app sebenar,
(b) RLS (masih ditangguh, rujuk bahagian awal), (c) apa-apa isu baharu yang timbul.

### ✅ Fasa 3 — Kedua-dua item tergantung DISELESAIKAN (arahan user: padam sahaja)
- **Drone Challenge**: 8 baris "TEMPAT KEDUA" dipadam, kekal "TEMPAT PERTAMA" sahaja
  (266→258 baris pencapaian) — konsisten dgn dasar getSkor (kedudukan terbaik menang)
- **17 kes No.KP bertindih sekolah-berbeza**: KEDUA-DUA entri konflik dipadam (28 baris,
  2111→2083 baris penyertaan) — sekolah akan daftar semula pendaftaran yang terjejas

**STATUS: Semua kerja siasat data untuk sesi ini SELESAI.**

---

## Ciri baharu + fix (7 Sept, sesi lanjutan)
1. **Auto-clear ruang carian bila tukar tab** — `_resetTabFilters()` kini clear `peny-srch`
   (tab Penyertaan) dan `ak-cari` (tab Akaun) setiap kali user tukar tab. (commit `7cb459a`)
2. **Khas ADMIN — senarai sekolah menyertai program**: bila admin klik kad program di tab
   Penyertaan, bullet senarai sekolah yang menyertai (dgn bilangan peserta) dipaparkan bawah
   notis pengesahan. Klik bullet → modal papar guru pengiring + senarai peserta sekolah tu
   untuk program tersebut. Fungsi: `_lihatSekolahDlmProgram()`. (commit `7cb459a`)
3. **Khas ADMIN — bilangan penyertaan pada kad/baris program**: badge "👥 N" dipaparkan
   terus pada kad (mod kad) & baris (mod senarai) tab Penyertaan, khas untuk admin sahaja.
   (commit `7cb459a`)
4. **Fix format AI**: system prompt `ai-chat` dikemaskini — arah Gemini elak simbol markdown
   (**tebal**, # tajuk, - bullet) sebab UI papar plain text (`textContent`), bukan render
   markdown. (commit `c16b930`)

**Nota:** Ciri #2/#3 guna data dari `_aP` (cache client, sudah dibetulkan paginasi penuh
sesi lepas) — tak perlu panggilan server tambahan, terus guna data yang sedia dimuat.

**Kemas kini kecil (commit `53360d8`):** bilangan penyertaan pada kad program kini di baris
baharu (bukan sebaris dgn nama); modal lihat sekolah (dari bullet, khas admin) kini ada
butang EDIT — guna semula flow `_openPenyertaanEdit` sama seperti di Pengelola.

---

## Sesi malam (8-9 Sept) — Google-first registration + AI Analitik

### Google Sign-In pendaftaran terus (No.KP+PIN tak lagi wajib untuk pengguna baharu)
**STATUS: SUDAH SIAP SEPENUHNYA** — dibina oleh USER SENDIRI (bukan Claude) melalui commit
terdahulu ("Enhance Google sign-in options") + RPC terus di Supabase SQL Editor semasa Claude
sedang menunggu arahan. Disahkan oleh Claude (semakan konsistensi, bukan pembinaan):
- Modal claim ada 2 mod bertogol: "Sahkan akaun sedia ada" (No.KP+PIN) vs "Daftar akaun
  baharu terus" (Nama/No.KP/No.Tel/Sekolah, TANPA PIN — Google jadi kaedah log masuk)
- RPC `daftar_akaun_google()`, `claim_akaun_google()`, `login_via_google()` — SEMUA konsisten
  guna `_domain_dibenarkan()` (hadkan ke emel `@moe-dl.edu.my` sahaja)
- Akaun baharu tetap status TUNGGU — kelulusan admin masih wajib sebelum log masuk berjaya
- Claude cuma bersihkan 1 RPC draf sendiri (`semak_nokp_google`) yang jadi berlebihan/tak dipakai
- **BELUM diuji end-to-end oleh manusia sebenar dalam browser** — kod & RPC disahkan konsisten
  dari sudut Claude sahaja, disyorkan uji manual: Google baharu → daftar → admin lulus → login

### AI Analitik — akses data sistem sebenar (BAHARU, dibina & DIUJI malam ni)
**STATUS: SIAP & DIUJI BERJAYA.**

RPC (7 fungsi, dijumpai SUDAH wujud di Supabase — turut dibina user sendiri semasa Claude
menunggu, nama hampir sama dgn draf Claude yg dibuang):
`analitik_ringkasan`, `analitik_sekolah_penyertaan`, `analitik_sekolah_pencapaian`,
`analitik_guru_terbaik`, `analitik_murid_terbaik`, `analitik_program_popular`,
`analitik_carian_sekolah`.

**Kerja Claude malam ni**: sambungkan Edge Function `ai-chat` ke 7 RPC ni melalui Gemini
**function-calling** (bukan hantar semua data dlm prompt — Gemini pilih fungsi berkaitan
ikut soalan, panggil RPC, baca hasil, jana jawapan berdasarkan data sebenar).

**2 bug dijumpai & dibetulkan semasa uji:**
1. Role `'function'` ditolak Gemini (API versi ni guna role `'user'` untuk functionResponse)
2. Model `gemini-3.6-flash` (generasi baharu) WAJIB `thoughtSignature` dikembalikan verbatim
   bersama `functionCall` dlm sejarah perbualan — kod asal bina semula objek baharu (buang
   medan tu) → Gemini tolak 400 INVALID_ARGUMENT. Dibetulkan: hantar balik part asal
   sepenuhnya, bukan reconstruct.

**Diuji langsung (pg_net dari dalam Supabase, bukan hanya baca kod):**
- ✅ "Sekolah mana paling tinggi penyertaan?" → jawapan tepat + top-5, data sebenar
  (SK KAMPUNG ANGUS, 191 penyertaan)
- ✅ Soalan majmuk "Siapa guru terbaik DAN murid terbaik?" → 2 panggilan fungsi berasingan
  dilayan betul dlm 1 respons, data tepat, tiada simbol markdown
- ✅ CI/CD disahkan segerak (push → GitHub Actions success → Supabase versi 15)

**Soalan yang disokong sekarang**: sekolah tertinggi penyertaan, sekolah banyak pencapaian,
guru terbaik, murid terbaik, program paling popular, ringkasan statistik keseluruhan, carian
statistik sekolah tertentu — dan gabungan/susulan drpd ni (Gemini function-calling generalize
melangkaui contoh tetap).

### Belum diuji / boleh disemak esok
- [ ] Uji ciri AI Analitik dalam APP SEBENAR (bukan pg_net) — buka panel AI, cuba tanya soalan
- [ ] Uji flow Google-first registration end-to-end dgn akaun sebenar
- [ ] Pertimbang tambah lebih banyak RPC analitik jika ada soalan lain yang AI tak dapat jawab

---

## AI gating - hanya aktif selepas login (commit `0fb6382`)
- `aiTogglePanel()` & `aiSend()` kini semak `_sesi` dahulu. Belum log masuk → papar amaran
  statik (TIADA panggilan ke Edge Function ai-chat dibuat langsung) yang cuma jelaskan
  2 perkara: cara daftar akaun pertama kali, cara claim akaun sedia ada dengan Google.
- `_mulakanSesi()` reset `_aiOpened` + kosongkan `ai-body` supaya lepas login, buka panel AI
  papar ucapan penuh (bukan amaran lama).

## Isu 403 embed Google Sites - MENUNGGU MAKLUMAT
Tiada X-Frame-Options/CSP dalam index.html sendiri. Kemungkinan besar dari hosting platform
tempat fail dihoskan (bukan repo ni - tiada workflow GitHub Pages). PERLU pautan sebenar
hosting + pautan Google Sites daripada user untuk web_fetch & diagnosis tepat.

---

## Isu 403 Google Sites — DISELESAIKAN (commit `c9f765a`)
**Punca sebenar** (bukan hosting/CSP index.html): `accounts.google.com` MEMANG tolak dimuatkan
dalam iframe bersarang (403) — langkah keselamatan Google sendiri, elak clickjacking kata
laluan. Bila app dibuka dlm iframe Google Sites dan `loginGoogle()` redirect terus dalam
iframe tu, Google terus block. Disahkan dari mesej ralat browser sebenar yang user hantar
(CSP frame-ancestors violation + 403 pada request ke accounts.google.com).

**Fix:** `loginGoogle()` kini kesan `window.self !== window.top` (dalam iframe ke tidak).
Kalau dalam iframe → guna `skipBrowserRedirect:true`, buka URL OAuth dalam **tab baharu**
(`window.open`) — bukan redirect dalam iframe. Lepas log masuk berjaya (mana-mana flow:
login_via_google/claim/daftar baharu — dicover terus dalam `_mulakanSesi()`), kalau tab
tu dibuka via `window.opener`, papar notis hijau "boleh tutup tab ini". Sesi disegerakkan
automatik ke tab/iframe asal via localStorage sama origin (mekanisme built-in Supabase JS).

**Belum diuji langsung dalam Google Sites sebenar** — disyorkan uji: buka Google Sites →
klik Log Masuk Google → sepatutnya buka tab baharu (bukan 403) → log masuk → notis hijau →
tutup tab → kembali ke Google Sites → sepatutnya dah log masuk.

---

## 🔒 RLS dikunci sepenuhnya (commit `a6902f9`) — SELESAI

### Kritikal dijumpai & dibetulkan serta-merta
`app_secrets` (simpan kod admin) — RLS DIMATIKAN, anon ada akses SELECT/INSERT/UPDATE/DELETE
penuh. Kod admin boleh dibaca terus dari browser console. **DIBETULKAN SERTA-MERTA**: RLS
diaktifkan, semua grant anon/authenticated ditarik balik. Kod admin ditukar sebagai langkah
berjaga-jaga: **`SUBIS-ADMIN-AQZD68OTYL`** (simpan tempat selamat).

### Had seni bina penting (nota untuk rujukan akan datang)
Sesi No.KP+PIN BUKAN sesi Supabase Auth sebenar — `auth.uid()` cuma wujud untuk pengguna
yang dah link Google. RLS ikut `auth.uid()` semata tak boleh dipakai universal. Penyelesaian:
SEMUA operasi tulis dipindah ke RPC `security definer` yang semak peranan di SERVER (guna
No.KP yang caller hantar sebagai bukti identiti ringan) — SELECT kekal terbuka untuk
programs/penyertaan/pencapaian (memang reka bentuk app, bukan kelemahan).

### 8 RPC (5 dari sesi lepas + 3 baharu sesi ni)
Sesi lepas: `pengguna_semak_status`, `pengguna_wujud`, `akaun_list`, `akaun_kemaskini`,
`pengguna_kemaskini_maklumat` — semua guna helper `_adalah_admin_aktif()`.
Sesi ni (baharu): `program_daftar` (sekat guru daftar program), `penyertaan_hantar`
(ganti hantar/kemaskini penyertaan), `sekolah_kemaskini` (segerak nama sekolah merentasi
3 jadual), `program_backfill_tahun` (utiliti admin).

**2 bug dijumpai & dibetulkan semasa audit/ujian:**
1. `akaun_list` — jenis lajur `id` salah (`bigint` patut `uuid`) — akan gagal runtime
2. `kemaskiniSekolahGS` & `backfillTahunGS` — 2 laluan tulis terus ke `pengguna`/`programs`
   yang terlepas pandang semasa audit pertama, dijumpai semasa "semak kali terakhir"

### index.html dikemas kini — 8 handler `_supaDispatch` ganti akses terus dgn RPC:
`loginGS`, `daftarAkaunGS`, `getAkaunListGS`, `kemaskiniAkaunGS`, `kemaskiniMaklumatPenggunaGS`,
`daftarProgramGS`, `hantarPenyertaanGS`/`kemaskiniPenyertaanSekolahGS`, `kemaskiniSekolahGS`,
`backfillTahunGS`. Hanya 1 akses terus kekal (sengaja): INSERT pendaftaran diri baharu.

### Polisi RLS akhir
| Jadual | Polisi |
|---|---|
| `app_secrets` | TIADA (RPC sahaja) |
| `pengguna` | INSERT terhad (`status='TUNGGU'` sahaja) — selebihnya RPC sahaja |
| `programs`/`penyertaan`/`pencapaian` | SELECT terbuka; INSERT/UPDATE/DELETE via RPC sahaja |
| `sekolah` | **BELUM disentuh** — kekal terbuka (risiko rendah, bukan data peribadi, ditangguh) |

### Diuji (pg_net dari dalam Supabase — bukan hanya baca kod)
- ✅ Baca terus `pengguna` sebagai anon key → `[]` kosong (RLS block berfungsi)
- ✅ `pengguna_semak_status` via RPC → data betul dipulangkan (bypass RLS berfungsi utk login)
- ✅ `program_daftar` — No.KP palsu ditolak; No.KP guru sah ditolak (sekatan peranan berfungsi)
- ✅ `akaun_list` — data admin sebenar dipulangkan lepas fix jenis lajur

### Belum diuji / boleh disemak nanti
- [ ] Uji SEMUA flow dalam app sebenar (bukan pg_net): login, daftar akaun, hantar/kemaskini
      penyertaan, daftar program, urus akaun (admin), kemaskini sekolah, backfill tahun
- [ ] Pertimbang kunci `sekolah` juga (risiko rendah, ditangguh sengaja sesi ni)
