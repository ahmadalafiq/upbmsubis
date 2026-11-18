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

## Dikesan, BELUM diubah (perlu keputusan)
1. **TINGGI — data peribadi boleh dibaca tanpa log masuk.** `analitik_murid_terbaik` & `analitik_guru_terbaik` (SECURITY DEFINER) dipanggil melalui kunci `anon` awam dan memulangkan **nama murid/guru + sekolah + markah**, `p_limit` tanpa had. Hanya edge function `ai-chat` yang memakainya, tetapi ia memakai kunci `anon`, jadi `REVOKE` terus akan merosakkan Pembantu AI. Cadangan: tukar `ai-chat` guna `SUPABASE_SERVICE_ROLE_KEY` (secret edge function), kemudian `REVOKE EXECUTE ... FROM anon, authenticated` pada semua `analitik_*`; sementara itu had `p_limit` ≤ 20.
2. **SEDERHANA — `cek_status_akaun(p_no_kp)`** boleh dipanggil tanpa token → boleh menyemak sama ada sesuatu No. KP berdaftar (enumerasi). Pertimbangkan had kadar / mesej seragam.
3. Fungsi SECURITY DEFINER lain boleh dipanggil `anon` mengikut reka bentuk (pengesahan dalaman melalui `_sahkan_token`) — dimaklumkan advisor (33), bukan kerosakan. Jadual `pengguna`, `program_sekolah`, `app_secrets` RLS aktif tanpa polisi = tolak semua; akses hanya melalui RPC (betul).
4. Prestasi: ~600 KB JS/CSS tidak diminify, 27 skrip serentak. Cadangan: langkah bina (esbuild) + header cache/CSP di `vercel.json`.
5. `PROGRESS.md` menyatakan idea had panggilan alat AI (senarai putih, had saiz) — belum dilaksanakan.

## Ujian
jsdom: Akaun 1, projek-16 23, wizard/draf/timeout/UX 34, modal penyertaan 26 — semua lulus, tiada ralat konsol. Sintaks 24 fail JS lulus. Tiada ID pendua.
