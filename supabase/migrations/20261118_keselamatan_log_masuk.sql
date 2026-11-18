-- AUDIT 18 Nov 2026 — pengerasan log masuk & dedahan data tanpa log masuk
-- 1) login_pengguna / login_admin / claim_akaun_google: TIADA had percubaan -> PIN 6 digit boleh diteka beramai-ramai. Tambah kunci sementara.
-- 2) cek_status_akaun: memulangkan nama PENUH + sekolah bagi sebarang No. KP tanpa log masuk. Topeng nama, buang sekolah, had kadar per IP.

-- ---- Jadual & fungsi dalaman (tidak boleh dipanggil melalui API) ----
create table if not exists public.login_cuba (
  kunci text primary key, gagal int not null default 0, mula timestamptz not null default now(), kunci_hingga timestamptz);
alter table public.login_cuba enable row level security;
revoke all on public.login_cuba from anon, authenticated;

create table if not exists public.had_kadar (
  kunci text primary key, n int not null default 0, mula timestamptz not null default now());
alter table public.had_kadar enable row level security;
revoke all on public.had_kadar from anon, authenticated;

create or replace function public._semak_kunci(p_kunci text) returns void
language plpgsql security definer set search_path to 'public' as $f$
declare v timestamptz;
begin
  select kunci_hingga into v from login_cuba where kunci = p_kunci;
  if v is not null and v > now() then
    raise exception 'Terlalu banyak percubaan gagal. Cuba lagi dalam % minit.', greatest(1, ceil(extract(epoch from (v - now()))/60)::int);
  end if;
end $f$;

create or replace function public._rekod_gagal(p_kunci text, p_had int, p_minit int) returns void
language plpgsql security definer set search_path to 'public' as $f$
declare r login_cuba%rowtype;
begin
  select * into r from login_cuba where kunci = p_kunci for update;
  if not found then
    insert into login_cuba(kunci,gagal,mula) values (p_kunci,1,now());
    return;
  end if;
  -- tetingkap 15 minit / kunci tamat -> mula semula
  if r.mula < now() - interval '15 minutes' or (r.kunci_hingga is not null and r.kunci_hingga <= now()) then
    update login_cuba set gagal=1, mula=now(), kunci_hingga=null where kunci=p_kunci;
  else
    update login_cuba set gagal = r.gagal + 1,
      kunci_hingga = case when r.gagal + 1 >= p_had then now() + make_interval(mins => p_minit) else null end
    where kunci = p_kunci;
  end if;
end $f$;

create or replace function public._reset_cuba(p_kunci text) returns void
language sql security definer set search_path to 'public' as $f$ delete from login_cuba where kunci = p_kunci; $f$;

-- Had kadar ringkas (tetingkap 1 minit) per kunci; lebih had -> ralat
create or replace function public._had_kadar(p_kunci text, p_had int) returns void
language plpgsql security definer set search_path to 'public' as $f$
declare r had_kadar%rowtype;
begin
  insert into had_kadar(kunci,n,mula) values (p_kunci,1,now())
  on conflict (kunci) do update set
    n = case when had_kadar.mula < now() - interval '1 minute' then 1 else had_kadar.n + 1 end,
    mula = case when had_kadar.mula < now() - interval '1 minute' then now() else had_kadar.mula end
  returning * into r;
  if r.n > p_had then raise exception 'Terlalu banyak permintaan. Sila cuba sebentar lagi.'; end if;
  -- pembersihan ringan
  if random() < 0.02 then delete from had_kadar where mula < now() - interval '1 hour'; delete from login_cuba where mula < now() - interval '1 day' and (kunci_hingga is null or kunci_hingga < now()); end if;
end $f$;

create or replace function public._ip_klien() returns text
language plpgsql stable set search_path to 'public' as $f$
begin
  return coalesce(nullif(trim(split_part(coalesce((current_setting('request.headers', true))::json->>'x-forwarded-for',''), ',', 1)),''),'?');
exception when others then return '?';
end $f$;

revoke all on function public._semak_kunci(text), public._rekod_gagal(text,int,int), public._reset_cuba(text), public._had_kadar(text,int), public._ip_klien() from public, anon, authenticated;

create or replace function public._topeng_nama(p_nama text) returns text
language sql immutable as $f$
  select coalesce(string_agg(case when t.ord = 1 then t.w else left(t.w,1) || '***' end, ' ' order by t.ord), '')
  from unnest(string_to_array(trim(coalesce(p_nama,'')), ' ')) with ordinality as t(w, ord) where t.w <> '';
$f$;
revoke all on function public._topeng_nama(text) from public, anon, authenticated;

-- ---- login_pengguna: kunci 5 gagal / 15 minit ----
create or replace function public.login_pengguna(p_no_kp text, p_pin text)
returns table(role text, nama text, kod_sekolah text, nama_sekolah text, status text, session_token text)
language plpgsql security definer set search_path to 'public', 'extensions' as $f$
declare v_tok text;
begin
  perform _semak_kunci('kp:'||coalesce(p_no_kp,''));
  if exists(select 1 from pengguna u where u.no_kp=p_no_kp and u.status='AKTIF' and u.kod=crypt(p_pin,u.kod)) then
    v_tok := _set_session_token(p_no_kp);
    perform _reset_cuba('kp:'||p_no_kp);
  elsif exists(select 1 from pengguna u where u.no_kp=p_no_kp) then
    perform _rekod_gagal('kp:'||p_no_kp, 5, 15);
  end if;
  return query select u.role, u.nama, u.kod_sekolah, u.nama_sekolah, u.status, v_tok from pengguna u
    where u.no_kp = p_no_kp and u.status='AKTIF' and u.kod = crypt(p_pin, u.kod);
end $f$;

-- ---- login_admin: kunci per No. KP (5) dan global (20) ----
create or replace function public.login_admin(p_no_kp text, p_admin_kod text)
returns table(role text, nama text, kod_sekolah text, nama_sekolah text, session_token text)
language plpgsql security definer set search_path to 'public', 'extensions' as $f$
declare v_secret text; v_tok text;
begin
  perform _semak_kunci('adm:'||coalesce(p_no_kp,''));
  perform _semak_kunci('adm:*');
  select value into v_secret from app_secrets where key='admin_master_kod';
  if v_secret is null or p_admin_kod is null or p_admin_kod <> v_secret then
    perform _rekod_gagal('adm:'||coalesce(p_no_kp,''), 5, 15);
    perform _rekod_gagal('adm:*', 20, 15);
    return;
  end if;
  if exists(select 1 from pengguna u where u.no_kp=p_no_kp and u.role='admin' and u.status='AKTIF') then
    v_tok := _set_session_token(p_no_kp);
    perform _reset_cuba('adm:'||p_no_kp);
  end if;
  return query select u.role, u.nama, u.kod_sekolah, u.nama_sekolah, v_tok from pengguna u
    where u.no_kp = p_no_kp and u.role='admin' and u.status='AKTIF';
end $f$;

-- ---- claim_akaun_google: gagal -> rekod & pulang kosong (bukan ralat, supaya rekod kekal) ----
create or replace function public.claim_akaun_google(p_no_kp text, p_pin text)
returns table(role text, nama text, kod_sekolah text, nama_sekolah text, no_kp text, session_token text)
language plpgsql security definer set search_path to 'public', 'extensions' as $f$
declare v_uid uuid := auth.uid(); v_tok text;
begin
  if v_uid is null then raise exception 'Tiada sesi Google yang sah.'; end if;
  perform _semak_kunci('kp:'||coalesce(p_no_kp,''));
  update pengguna pgn set auth_uid = v_uid, emel_aktif = (select au.email from auth.users au where au.id = v_uid)
   where pgn.no_kp = p_no_kp and pgn.kod = crypt(p_pin, pgn.kod) and pgn.status = 'AKTIF' and pgn.auth_uid is null;
  if not found then
    if exists(select 1 from pengguna u where u.no_kp=p_no_kp) then perform _rekod_gagal('kp:'||p_no_kp, 5, 15); end if;
    return;   -- frontend memaparkan "No.KP atau PIN tidak sepadan"
  end if;
  perform _reset_cuba('kp:'||p_no_kp);
  select _set_session_token(p_no_kp) into v_tok;
  return query select u.role, u.nama, u.kod_sekolah, u.nama_sekolah, u.no_kp, v_tok from pengguna u where u.no_kp = p_no_kp;
end $f$;

-- ---- cek_status_akaun: topeng nama, buang sekolah, had 30 permintaan/minit/IP ----
create or replace function public.cek_status_akaun(p_no_kp text)
returns table(nama text, role text, status text, kod_sekolah text, nama_sekolah text, sudah_ikat_google boolean)
language plpgsql security definer set search_path to 'public', 'extensions' as $f$
begin
  perform _had_kadar('cek:'||_ip_klien(), 30);
  return query select _topeng_nama(u.nama), u.role, u.status, null::text, null::text, (u.auth_uid is not null)
    from pengguna u where u.no_kp = p_no_kp;
end $f$;

-- ---- analitik_*: had p_limit (maks 20) ----
create or replace function public.analitik_murid_terbaik(p_limit integer default 10)
returns table(nama_peserta text, nama_sekolah text, jumlah_pencapaian bigint, jumlah_markah numeric)
language sql stable security definer set search_path to 'public' as $f$
  select nama_peserta, nama_sekolah, count(*) as jumlah_pencapaian, coalesce(sum(markah),0) as jumlah_markah
  from pencapaian where nama_peserta is not null and nama_peserta <> ''
  group by nama_peserta, nama_sekolah order by jumlah_markah desc, jumlah_pencapaian desc limit least(greatest(coalesce(p_limit,10),1),20);
$f$;
create or replace function public.analitik_guru_terbaik(p_limit integer default 10)
returns table(nama_guru text, nama_sekolah text, jumlah_pencapaian bigint, jumlah_markah numeric)
language sql stable security definer set search_path to 'public' as $f$
  select nama_guru, nama_sekolah, count(*) as jumlah_pencapaian, coalesce(sum(markah),0) as jumlah_markah
  from pencapaian where nama_guru is not null and nama_guru <> ''
  group by nama_guru, nama_sekolah order by jumlah_markah desc, jumlah_pencapaian desc limit least(greatest(coalesce(p_limit,10),1),20);
$f$;
