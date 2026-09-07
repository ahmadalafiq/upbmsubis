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
| GitHub ↔ Supabase sync | ✅ Segerak (push terakhir: `a413b24`) |

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

### Google Sign-In & Claim Akaun (Bahagian E) — ⛔ BELUM
Draf reka bentuk (Pilihan A — sahkan No.KP+PIN sedia ada sekali sebelum ikat ke akaun Google)
sudah dibincang tapi belum dijalankan. Guna semula lajur `emel_aktif` sedia ada + tambah
lajur `auth_uid`. No.KP+PIN dikekalkan sebagai fallback untuk yang tiada Google.

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
