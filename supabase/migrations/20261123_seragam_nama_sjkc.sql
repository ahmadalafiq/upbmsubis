-- Dilaksanakan di Supabase production 22 Nov 2026 atas permintaan pengguna: "SJKC" / "SJK(C)" / "SJK C" -> "SJK (C)".
-- 492 nilai dikemas kini; nilai lama diarkibkan dalam arkib_nama_sjkc_20261123 (tbl, kolum, id, nilai_lama, nilai_baru).
-- Lajur: sekolah.nama 4 | pengguna.nama_sekolah 5 | penyertaan.nama_sekolah 291, nama_program 73 | pencapaian.nama_sekolah 53, nama_program 46
--        programs.nama_program 8, pengelola 8, tempat 4
create table if not exists public.arkib_nama_sjkc_20261123 (tbl text, kolum text, id text, nilai_lama text, nilai_baru text, diarkib timestamptz default now());
alter table public.arkib_nama_sjkc_20261123 enable row level security;
revoke all on public.arkib_nama_sjkc_20261123 from anon, authenticated;
create or replace function public._seragam_sjkc(t text) returns text language sql immutable as $f$
  select regexp_replace(t, 'SJK\s*\(\s*C\s*\)|SJK\s+C\y|SJKC\y', 'SJK (C)', 'gi') $f$;
revoke all on function public._seragam_sjkc(text) from public, anon, authenticated;
-- (blok DO yang mengarkib & mengemas kini setiap pasangan jadual/lajur di atas dilaksanakan melalui migrasi "seragam_nama_sjkc_20261123")
-- Pulihkan jika perlu: update <jadual> set <lajur> = a.nilai_lama from arkib_nama_sjkc_20261123 a where a.tbl='<jadual>' and a.kolum='<lajur>' and a.id = <jadual>.<pk>::text;
