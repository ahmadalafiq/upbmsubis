-- Dilaksanakan di Supabase production 21 Nov 2026 (2 langkah: anugerah_markah_rasmi_saguhati + anugerah_pengecualian_saguhati).
-- Keputusan pengguna: (2) masukkan markah Bahagian/Negeri secara rasmi; (3) cipta saguhati untuk yang tidak layak.
-- Penemuan: JADUAL 6 markah rasmi sudah wujud dalam js/02-core.js (MARKAH). Pengganda anggaran dalam rubrik awal TIDAK digunakan lagi.
-- Fungsi _anugerah_sekolah/_anugerah_guru/anugerah_keputusan/anugerah_config_simpan di bawah ditampal (patch) ke atas versi 20261120/20261121.

-- ===== LANGKAH 1 =====
create or replace function public.markah_rasmi(p_peringkat text, p_tempat text) returns numeric
language plpgsql immutable set search_path to 'public' as $f$
declare per text := upper(trim(coalesce(p_peringkat,''))); t text := upper(coalesce(p_tempat,'')); k text;
begin
  per := case when per like '%ANTARABANGSA%' or per like '%DUNIA%' then 'ANTARABANGSA'
              when per like '%KEBANGSAAN%' or per like 'MALAYSIA%' then 'KEBANGSAAN'
              when per like '%NEGERI%' then 'NEGERI'
              when per like '%BAHAGIAN%' then 'BAHAGIAN'
              when per like '%SEKOLAH%' then 'SEKOLAH'
              else 'DAERAH' end;
  k := case when t like '%PERTAMA%' then 'PERTAMA' when t like '%KEDUA%' then 'KEDUA' when t like '%KETIGA%' then 'KETIGA'
            when t like '%KEEMPAT%' then 'KEEMPAT' when t like '%BERSAMA%' then 'BERSAMA' when t like '%KELIMA%' then 'KELIMA'
            when t like '%PELIBATAN III%' then 'PELIBATAN3' when t like '%PELIBATAN II%' then 'PELIBATAN2' else 'PELIBATAN1' end;
  return ('{
   "SEKOLAH":     {"PERTAMA":8,"KEDUA":7,"KETIGA":6,"KEEMPAT":5,"BERSAMA":6,"KELIMA":4,"PELIBATAN1":0,"PELIBATAN2":0,"PELIBATAN3":0},
   "DAERAH":      {"PERTAMA":11,"KEDUA":10,"KETIGA":9,"KEEMPAT":8,"BERSAMA":9,"KELIMA":7,"PELIBATAN1":11,"PELIBATAN2":8,"PELIBATAN3":4},
   "BAHAGIAN":    {"PERTAMA":14,"KEDUA":13,"KETIGA":12,"KEEMPAT":11,"BERSAMA":12,"KELIMA":10,"PELIBATAN1":12,"PELIBATAN2":9,"PELIBATAN3":5},
   "NEGERI":      {"PERTAMA":14,"KEDUA":13,"KETIGA":12,"KEEMPAT":11,"BERSAMA":12,"KELIMA":10,"PELIBATAN1":14,"PELIBATAN2":10,"PELIBATAN3":6},
   "KEBANGSAAN":  {"PERTAMA":17,"KEDUA":16,"KETIGA":15,"KEEMPAT":14,"BERSAMA":15,"KELIMA":13,"PELIBATAN1":17,"PELIBATAN2":12,"PELIBATAN3":8},
   "ANTARABANGSA":{"PERTAMA":20,"KEDUA":19,"KETIGA":18,"KEEMPAT":17,"BERSAMA":18,"KELIMA":16,"PELIBATAN1":20,"PELIBATAN2":15,"PELIBATAN3":10}
  }'::jsonb #>> array[per,k])::numeric;
end $f$;
revoke all on function public.markah_rasmi(text,text) from public, anon, authenticated;

-- Arkib 18 rekod markah kosong (selain KESELURUHAN) sebelum dilengkapkan: BAHAGIAN 12, DAERAH Terbuka Berkumpulan 4, NEGERI 2
create table if not exists public.arkib_pencapaian_markah_20261122 as
  select id, markah, peringkat, tempat, kategori, now() as diarkib from public.pencapaian where markah is null and coalesce(kategori,'') <> 'KESELURUHAN';
alter table public.arkib_pencapaian_markah_20261122 enable row level security;
revoke all on public.arkib_pencapaian_markah_20261122 from anon, authenticated;
update public.pencapaian set markah = public.markah_rasmi(peringkat, tempat) where markah is null and coalesce(kategori,'') <> 'KESELURUHAN';

create or replace function public._pencapaian_markah_auto() returns trigger
language plpgsql security definer set search_path to 'public' as $f$
begin
  if new.markah is null and coalesce(new.kategori,'') <> 'KESELURUHAN' then new.markah := public.markah_rasmi(new.peringkat, new.tempat); end if;
  return new;
end $f$;
revoke all on function public._pencapaian_markah_auto() from public, anon, authenticated;
drop trigger if exists trg_pencapaian_markah_auto on public.pencapaian;
create trigger trg_pencapaian_markah_auto before insert or update of markah, peringkat, tempat on public.pencapaian
  for each row execute function public._pencapaian_markah_auto();

-- Konfigurasi lalai (versi 2): tanpa pengganda anggaran; saguhati; kod dikecualikan
create or replace function public._anugerah_cfg_lalai() returns jsonb language sql immutable as $f$
select '{
 "versi": 2,
 "normalisasi_peratusan": 0.9,
 "kecuali_kod": ["Y044"],
 "kategori": {
   "berat": {"mata":30,"placements":10,"program":20,"peserta":15,"bidang":10,"kemenjadian":5,"kualiti":10},
   "mod": "MUTLAK",
   "ambang": {"emas":75,"perak":55,"gangsa":35},
   "peratus": {"emas":15,"perak":25,"gangsa":30},
   "syarat": {"emas":{"placements":3,"program":8},"perak":{"placements":1,"program":5},"gangsa":{"placements":0,"program":3}},
   "saguhati": {"program":1}
 },
 "top": {"berat": {"mata":55,"placements":20,"program":10,"peserta":5,"bidang":5,"kemenjadian":5,"kualiti":0}, "bilangan": 5, "skor_minimum": 20},
 "guru": {"berat": {"mata":50,"placements":15,"program":15,"peserta":10,"bidang":5,"kualiti":5}, "bilangan": 5, "skor_minimum": 20}
}'::jsonb $f$;

-- ===== PATCH FUNGSI (ringkasan perubahan) =====
-- _anugerah_sekolah & _anugerah_guru : mata = coalesce(u.markah, markah_rasmi(u.peringkat, u.tempat), 0)   [ganti pengganda ×1.2/×1.5]
--                                      sekolah: where not jsonb_exists(coalesce(c->'kecuali_kod','[]'), sk.kod); guru: kod yang sama dikecualikan
-- _anugerah_cfg                      : kunci gabungan 'kecuali_kod' menggantikan 'mata_ganti'
-- anugerah_keputusan                 : peringkat 'SAGUHATI' = bukan Emas/Perak/Gangsa dan (prog >= kategori.saguhati.program atau ada pencapaian);
--                                      'turun' hanya jika asal EMAS/PERAK/GANGSA; ringkasan.saguhati
-- anugerah_config_simpan             : sahkan saguhati.program (0-999) dan kecuali_kod (tatasusunan teks)
-- (Patch dilaksanakan dengan pg_get_functiondef + replace; lihat sejarah migrasi Supabase "anugerah_markah_rasmi_saguhati_20261122" & "..._20261122b".)
