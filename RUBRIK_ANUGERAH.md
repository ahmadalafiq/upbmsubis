# RUBRIK ANUGERAH UPBM SUBIS (cadangan — boleh dilaras oleh admin)

Halaman **🏆 ANUGERAH** (admin sahaja; pelayan menolak peranan lain). Semua pengiraan di Supabase (`anugerah_keputusan`); rubrik disimpan dalam `anugerah_config` dan boleh diubah serta dipratonton tanpa deploy.

## 1. Unit yang dikira (asas keadilan)
| Perkara | Peraturan |
|---|---|
| Unit pencapaian | Satu **keputusan** = (program, kategori, tempat, sekolah[, peserta bagi kategori individu]). Keputusan berkumpulan dikira **sekali**, bukan setiap peserta (data: 140 baris *Terbuka Berkumpulan* = 34 keputusan sebenar). |
| Mata | Markah rasmi sistem. Jika kosong (Bahagian/Negeri belum bermarkah): dianggar = mata tempat (1=11, 2=10, 3=9, 4=8, 5=7) × pengganda peringkat (Bahagian ×1.2, Negeri ×1.5, Kebangsaan ×2). Dinyatakan dalam Nota Data. |
| Kategori KESELURUHAN | Dikecualikan (agregat daripada kategori lain; markah tiada). |
| Sekolah | Semua sekolah dalam jadual `sekolah` (50). SR dan SM dinilai dalam **kohort masing-masing** (kod sekolah huruf ke-2 = `E` → SM). |
| Guru | Dikenal pasti melalui No. KP (digit sahaja, 12 angka); jika tiada → nama. Pencapaian dengan beberapa guru (` | `) dipecah dan setiap guru dikreditkan penuh. |

## 2. Rubrik A — Emas · Perak · Gangsa (semua sekolah)
Skor 0–100. Setiap ukuran dibandingkan dengan **persentil ke-90 kohort** (dihadkan 100%) supaya sekolah luar biasa tidak menjejaskan yang lain.

| Ukuran | Berat | Maksud |
|---|---:|---|
| Mata pencapaian | 30 | Jumlah mata keputusan unik |
| Bil. tempat 1–5 | 10 | Bilangan keputusan menang tempat |
| Bil. program disertai | 20 | Keluasan penyertaan |
| Bil. peserta | 15 | Penglibatan murid (unik) |
| Kepelbagaian bidang | 10 | Bidang berbeza (Sukan, Seni, STEM, Bahasa, PBB, Lain-lain) |
| Kadar kemenjadian | 5 | Program menang ÷ program disertai |
| Kelengkapan data | 10 | % rekod peserta lengkap (No. KP 12 digit, jantina, bangsa) |

**Kategori (lalai kaedah MUTLAK):** Emas ≥ 75 · Perak ≥ 55 · Gangsa ≥ 35 · di bawah = tiada pingat.
**Syarat minimum (turun satu tahap jika gagal):** Emas ≥ 3 tempat & ≥ 8 program · Perak ≥ 1 tempat & ≥ 5 program · Gangsa ≥ 3 program. (Elak pingat untuk kehadiran semata-mata.)
**Kaedah alternatif PERCENTILE:** 15% teratas Emas, 25% berikutnya Perak, 30% berikutnya Gangsa (hanya sekolah yang ada penyertaan).

## 3. Rubrik B — Tempat 1–5 Sekolah (SR dan SM berasingan)
Menekankan kecemerlangan. Setiap ukuran dibandingkan dengan **pemimpin kohort** (tiada had atas supaya 5 teratas dapat dibezakan).

| Mata 55 | Tempat 1–5 20 | Program 10 | Peserta 5 | Bidang 5 | Kemenjadian 5 | Kualiti data 0 |
|---|---|---|---|---|---|---|

**Skor minimum layak: 20** (tempat tidak diberi jika skor lebih rendah). **Pemecah seri:** (1) bil. tempat pertama, (2) mata, (3) bil. program; jika masih sama → dipaparkan **SERI**.

## 4. Rubrik C — Tempat 1–5 Guru (SR dan SM berasingan)
| Mata dibimbing 50 | Tempat 1–5 15 | Program 15 | Peserta 10 | Bidang 5 | Kelengkapan data guru 5 |
|---|---|---|---|---|---|
Skor minimum 20; pemecah seri sama seperti Rubrik B. Kelengkapan data guru = No. KP 12 digit, jantina, bangsa, telefon.

## 5. Keputusan yang perlu disahkan jawatankuasa
1. Berat dan ambang di atas ialah **cadangan** (diuji pada data 2026; ≈ 9 Emas, 8 Perak, 15 Gangsa daripada 50). Ubah dalam panel rubrik, tekan PRATONTON, kemudian SIMPAN.
2. Adakah markah Bahagian/Negeri akan dimasukkan secara rasmi? Sehingga itu mata dianggar (ditanda `*`).
3. Sekolah tanpa penyertaan tidak layak pingat (kategori "—").
4. Guru dengan nama tanpa No. KP dikenal pasti melalui nama sahaja (ditanda ⚠).
5. Kualiti data: rekod penyertaan tanpa peserta (guru sahaja) tidak dikira sebagai peserta.

## 6. Had yang diketahui
- Jumlah murid sebenar setiap sekolah tidak ada dalam sistem, jadi skor tidak dinormalkan mengikut saiz sekolah; "kadar kemenjadian" dan "kepelbagaian" mengimbangi sebahagiannya.
- Data tahun lalu tiada (hanya 2026) — ambang belum boleh diuji dengan sejarah.
- Keputusan ialah **cadangan berasaskan data**; semak Nota Data sebelum pengumuman.
