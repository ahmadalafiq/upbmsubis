# AUDIT PRA-MERGE — UPBM SUBIS (18 Nov 2026)
Skop: kod frontend (index.html, css/, js/), Supabase (advisors), UX/kebolehcapaian. Kaedah: semakan statik + simulasi jsdom (backend palsu). **Belum diuji dalam pelayar sebenar.**

## Dibetulkan dalam branch ini
| # | Isu | Tindakan |
|---|-----|----------|
| 1 | `toast()` memasukkan mesej (termasuk nama peserta yang ditaip pengguna) ke `innerHTML` → XSS | Guna teks sahaja; ralat = `role=alert`, kekal lebih lama |
| 2 | 2 paparan ralat memasukkan `e.message` tanpa `esc()` (Akaun, Edit Program) | `esc()` |
| 3 | Kontras teks petunjuk `--g5` 2.07:1 (gagal WCAG AA, 119 tempat) | Guna `--g6` (4.69:1); amber gelap `#8a5a00` (6.3:1) |
| 4 | Fon sekecil ~9–10 px (100 peraturan CSS + inline) | Lantai .68rem (CSS); inline ≥.72rem pada sentuh/telefon; medan borang 16px (elak zum iOS) |
| 5 | Modal tiada `role=dialog`/`aria-modal`, tiada ESC, tiada perangkap fokus | Modul `23-ux-aksesibiliti.js` (ESC hanya untuk modal selamat; modal Edit TIDAK ditutup ESC) |
| 6 | 26 `<label>` tanpa `for` | Dikaitkan automatik (juga kandungan dinamik) |
| 7 | Elemen klik `div/span[onclick]` tidak boleh dicapai papan kekunci | `role=button`, `tabindex=0`, Enter/Space |
| 8 | Tiada penunjuk fokus, tiada `prefers-reduced-motion`, modal terpotong bar alamat mudah alih | `css/05-ux.css` (focus-visible, reduced-motion, `dvh`) |
| 9 | Tiada petunjuk luar talian | Jalur "Tiada sambungan internet" |
| 10 | Wizard: ralat hanya toast | Medan wajib ditanda merah + fokus, Enter = seterusnya, bar langkah boleh diklik kembali |
| 11 | Head: tiada `theme-color`/preconnect | Ditambah |
| 12 | Pintasan "Langkau ke kandungan", toast `aria-live` | Ditambah |

## Dikesan & DIBETULKAN (susulan audit)
| # | Isu | Tindakan |
|---|-----|----------|
| A | **KRITIKAL — PIN 6 digit boleh diteka tanpa had.** `login_pengguna`, `login_admin` (kod induk) dan `claim_akaun_google` tiada had percubaan; sesiapa dengan kunci `anon` awam boleh menjalankan brute-force | Migrasi `20261118_keselamatan_log_masuk.sql` (**telah dilaksanakan di production**): kunci 15 minit selepas 5 percubaan gagal per No. KP (admin: 5 per KP + 20 global); berjaya = reset. Diuji dalam transaksi yang di-rollback |
| B | **TINGGI — `cek_status_akaun` memulangkan NAMA PENUH + sekolah** bagi sebarang No. KP tanpa log masuk (penerangan awal "hanya enumerasi" tidak tepat) | Nama bertopeng (`AHMAD A*** B***`), sekolah dibuang, had 30 permintaan/minit/IP. Skrin log masuk kekal berfungsi (data penuh datang selepas PIN sah) |
| C | **TINGGI — `analitik_murid_terbaik` / `analitik_guru_terbaik` boleh dibaca tanpa log masuk** (nama murid/guru + markah, `p_limit` tanpa had) | `p_limit` dihadkan 20 (dilaksanakan). `ai-chat` ditulis semula: sesi wajib disahkan, kunci SERVICE ROLE, alat nama individu = admin/PKK sahaja, senarai putih nama alat + kawalan argumen, had input & kadar, cuba semula Gemini 503. **Langkah akhir `REVOKE` anon (`20261119_revoke_analitik_anon.sql`) dijalankan SELEPAS merge + deploy** supaya Pembantu AI lama tidak terputus |
| D | `ai-chat` menerima nama RPC daripada Gemini tanpa semakan (injeksi path jika kunci service dipakai) | Senarai putih ketat (diuji: `../admin_senarai_akaun` ditolak) |
| E | Mesej ralat AI salah ("belum dideploy") walaupun puncanya Gemini 503 | Kod ralat `AI_SESI/AI_SIBUK/AI_HAD/AI_MINTA/AI_KONFIG` + mesej betul |
| F | JS/CSS tanpa minify (gzip 156 KB) | `npm run build` (esbuild) -> `dist/`: gzip ≈ 108 KB (−28%), versi cache = hash kandungan, sandaran salin-asal jika minify gagal. `vercel.json`: cache 10 min + SWR, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |

## Belum diubah (keputusan / reka bentuk)
1. Fungsi SECURITY DEFINER lain boleh dipanggil `anon` mengikut reka bentuk (pengesahan dalaman `_sahkan_token`). Jadual `pengguna`, `program_sekolah`, `app_secrets` RLS aktif tanpa polisi = tolak semua (betul).
2. CSP ketat tidak ditambah (borang guna `onclick` inline, dan tapak mungkin dibenamkan dalam Google Sites). `X-Frame-Options` sengaja tiada.
3. Kod induk admin kekal rahsia kongsi dalam `app_secrets` (kini ada kunci, tetapi pertimbangkan tukar berkala).
4. Kunci percubaan boleh dipakai untuk mengunci akaun mangsa (DoS 15 minit). Admin boleh kosongkan dengan `delete from login_cuba where kunci = 'kp:<No.KP>'`.

## Ujian
jsdom (sumber DAN dist minify, keputusan sama): Akaun, projek-16 23, wizard/draf/timeout/UX 34, modal penyertaan 26, AI frontend 7. Deno: `ai-chat` 19 semakan (sesi, peranan, senarai putih, had, cuba semula, kadar). SQL (rollback): kunci, reset, topeng, had kadar, kunci admin. Tiada ID pendua.
