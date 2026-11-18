-- JALANKAN SELEPAS: (1) branch di-merge ke main, (2) GitHub Action "Deploy Supabase Edge Functions" berjaya,
-- (3) Pembantu AI diuji sekali (guna kunci service role). Jika dijalankan sebelum itu, Pembantu AI versi lama akan gagal.
-- Selepas ini, kunci anon awam TIDAK lagi boleh membaca nama murid/guru atau statistik.
revoke execute on function public.analitik_carian_sekolah(text)        from public, anon, authenticated;
revoke execute on function public.analitik_guru_terbaik(integer)       from public, anon, authenticated;
revoke execute on function public.analitik_murid_terbaik(integer)      from public, anon, authenticated;
revoke execute on function public.analitik_program_popular(integer)    from public, anon, authenticated;
revoke execute on function public.analitik_ringkasan()                 from public, anon, authenticated;
revoke execute on function public.analitik_sekolah_pencapaian(integer) from public, anon, authenticated;
revoke execute on function public.analitik_sekolah_penyertaan(integer) from public, anon, authenticated;
grant  execute on function public.analitik_carian_sekolah(text), public.analitik_guru_terbaik(integer), public.analitik_murid_terbaik(integer),
  public.analitik_program_popular(integer), public.analitik_ringkasan(), public.analitik_sekolah_pencapaian(integer), public.analitik_sekolah_penyertaan(integer) to service_role;
