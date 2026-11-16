#!/usr/bin/env python3
"""Jana INDEKS.md — peta fungsi/pemboleh ubah aras atas bagi setiap fail dalam js/ dan laporan-sekolah.js.
Guna: python3 tools/jana_indeks.py   (jalankan dari akar repo, tiada kebergantungan luar)
Tujuan: cari fungsi tanpa membuka fail besar. Jalankan semula selepas menambah/mengubah nama fungsi.
Andaian: kod aras atas bermula di lajur 0 (gaya sedia ada app ini)."""
import glob, os, re
FN = re.compile(r'^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)')
VR = re.compile(r'^(?:var|let|const)\s+([A-Za-z_$][\w$]*)')
out = ["# INDEKS FUNGSI (dijana automatik — jangan edit tangan)\n",
       "Jana semula: `python3 tools/jana_indeks.py`. Rujuk `STRUKTUR.md` untuk gambaran keseluruhan.\n"]
total_fn = total_var = 0
for path in sorted(glob.glob('js/*.js')) + ['laporan-sekolah.js']:
    if not os.path.exists(path): continue
    fns, vrs, n = [], [], 0
    with open(path, encoding='utf-8') as f:
        for n, line in enumerate(f, 1):
            m = FN.match(line)
            if m: fns.append(f'{m.group(1)}:{n}'); continue
            m = VR.match(line)
            if m: vrs.append(f'{m.group(1)}:{n}')
    total_fn += len(fns); total_var += len(vrs)
    kb = os.path.getsize(path) / 1024
    out.append(f'\n## {path} — {n} baris, {kb:.0f} KB\n')
    if fns: out.append('**Fungsi:** ' + ', '.join(fns) + '\n')
    if vrs: out.append('**Pemboleh ubah:** ' + ', '.join(vrs) + '\n')
out.append(f'\n_Jumlah: {total_fn} fungsi, {total_var} pemboleh ubah aras atas._\n')
open('INDEKS.md', 'w', encoding='utf-8', newline='\n').write(''.join(out))
print(f'INDEKS.md dijana: {total_fn} fungsi, {total_var} pemboleh ubah')
