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
