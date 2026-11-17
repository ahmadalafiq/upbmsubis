-- Projek 16: RPC baca-sahaja untuk butang DATA. Admin & PKK pengelola = semua sekolah ditick; lain-lain = sekolah sendiri sahaja.
-- (Sudah dilaksanakan di Supabase production pada 17 Nov 2026; disimpan di sini sebagai rekod.)
CREATE OR REPLACE FUNCTION public.senarai_sekolah_program_lihat(p_no_kp text, p_token text, p_program_id text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public', 'extensions'
AS $function$
declare v_role text; v_kod_caller text; v_kod_pengelola text; v_semua boolean;
begin
  v_role := _sahkan_token(p_no_kp, p_token);
  if v_role is null then raise exception 'Sesi tidak sah, sila log masuk semula.'; end if;
  select kod_pengelola into v_kod_pengelola from programs where id = p_program_id;
  if not found then raise exception 'Program tidak ditemui.'; end if;
  select kod_sekolah into v_kod_caller from pengguna where no_kp = p_no_kp;
  v_semua := (v_role = 'admin') or (v_role = 'pkk' and v_kod_caller is not distinct from v_kod_pengelola);
  return coalesce((
    select jsonb_agg(jsonb_build_object('kod_sekolah', ps.kod_sekolah, 'nama_sekolah', s.nama,
             'ada_penyertaan', exists (select 1 from penyertaan p where p.program_id = ps.program_id and p.kod_sekolah = ps.kod_sekolah))
           order by s.nama)
    from program_sekolah ps left join sekolah s on s.kod = ps.kod_sekolah
    where ps.program_id = p_program_id
      and (v_semua or (v_kod_caller is not null and ps.kod_sekolah = v_kod_caller))), '[]'::jsonb);
end; $function$;
