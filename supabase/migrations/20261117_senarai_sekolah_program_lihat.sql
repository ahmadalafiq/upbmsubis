-- Projek 16: RPC baca-sahaja untuk butang DATA. SEMUA pengguna log masuk (admin/PKK/guru) boleh LIHAT senarai sekolah ditick.
-- Edit penyertaan kekal dikawal oleh hantar_penyertaan_sekolah (sekolah sendiri; PKK pengelola = semua sekolah; admin = semua).
-- (Dilaksanakan di Supabase production 17 Nov 2026. Menggantikan versi awal yang menapis ikut sekolah sendiri.)
CREATE OR REPLACE FUNCTION public.senarai_sekolah_program_lihat(p_no_kp text, p_token text, p_program_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
declare v_role text;
begin
  v_role := _sahkan_token(p_no_kp, p_token);
  if v_role is null then raise exception 'Sesi tidak sah, sila log masuk semula.'; end if;
  if not exists (select 1 from programs where id = p_program_id) then raise exception 'Program tidak ditemui.'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object('kod_sekolah', ps.kod_sekolah, 'nama_sekolah', s.nama,
             'ada_penyertaan', exists (select 1 from penyertaan p where p.program_id = ps.program_id and p.kod_sekolah = ps.kod_sekolah))
           order by s.nama)
    from program_sekolah ps left join sekolah s on s.kod = ps.kod_sekolah
    where ps.program_id = p_program_id), '[]'::jsonb);
end; $function$;
REVOKE ALL ON FUNCTION public.senarai_sekolah_program_lihat(text,text,text) FROM public;
GRANT EXECUTE ON FUNCTION public.senarai_sekolah_program_lihat(text,text,text) TO anon, authenticated;
