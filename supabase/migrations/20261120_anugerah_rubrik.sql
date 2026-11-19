-- ANUGERAH: rubrik Emas/Perak/Gangsa (semua sekolah) + tempat 1-5 (sekolah SR/SM, guru SR/SM). HANYA ADMIN.
-- Pengiraan sepenuhnya di pelayan (SQL); konfigurasi rubrik boleh diubah admin tanpa deploy.

create table if not exists public.anugerah_config (
  kunci text primary key, nilai jsonb not null, dikemaskini timestamptz not null default now(), oleh text);
alter table public.anugerah_config enable row level security;
revoke all on public.anugerah_config from anon, authenticated;

create or replace function public._anugerah_cfg_lalai() returns jsonb language sql immutable as $f$
select '{
 "versi": 1,
 "normalisasi_peratusan": 0.9,
 "mata_ganti": {
   "tempat": {"1":11,"2":10,"3":9,"4":8,"5":7},
   "peringkat": {"SEKOLAH":1,"DAERAH":1,"BAHAGIAN":1.2,"NEGERI":1.5,"KEBANGSAAN":2}
 },
 "kategori": {
   "berat": {"mata":30,"placements":10,"program":20,"peserta":15,"bidang":10,"kemenjadian":5,"kualiti":10},
   "mod": "MUTLAK",
   "ambang": {"emas":75,"perak":55,"gangsa":35},
   "peratus": {"emas":15,"perak":25,"gangsa":30},
   "syarat": {"emas":{"placements":3,"program":8},"perak":{"placements":1,"program":5},"gangsa":{"placements":0,"program":3}}
 },
 "top": {
   "berat": {"mata":55,"placements":20,"program":10,"peserta":5,"bidang":5,"kemenjadian":5,"kualiti":0},
   "bilangan": 5, "skor_minimum": 20
 },
 "guru": {
   "berat": {"mata":50,"placements":15,"program":15,"peserta":10,"bidang":5,"kualiti":5},
   "bilangan": 5, "skor_minimum": 20
 }
}'::jsonb $f$;

-- Konfigurasi berkesan = lalai || tersimpan || override (peringkat bahagian teratas digabung)
create or replace function public._anugerah_cfg(p_override jsonb) returns jsonb language plpgsql stable security definer set search_path to 'public' as $f$
declare c jsonb := _anugerah_cfg_lalai(); s jsonb; k text;
begin
  select nilai into s from anugerah_config where kunci='rubrik';
  foreach k in array array['normalisasi_peratusan','mata_ganti','kategori','top','guru'] loop
    if s is not null and s ? k then c := jsonb_set(c, array[k], case when jsonb_typeof(c->k)='object' then (c->k) || (s->k) else s->k end); end if;
    if p_override is not null and p_override ? k then c := jsonb_set(c, array[k], case when jsonb_typeof(c->k)='object' then (c->k) || (p_override->k) else p_override->k end); end if;
  end loop;
  return c;
end $f$;

create or replace function public._anugerah_w(c jsonb, bahagian text, m text) returns numeric language sql immutable as $f$
  select coalesce((c #>> array[bahagian,'berat',m])::numeric, 0) $f$;

-- ================= SEKOLAH =================
create or replace function public._anugerah_sekolah(p_tahun int, c jsonb)
returns table(kod text, nama text, jenis text, mata numeric, placements int, t1 int, prog int, peserta int, bidang int,
              kemenjadian numeric, kualiti numeric, skor_kat numeric, skor_top numeric, mata_dianggar int)
language sql stable security definer set search_path to 'public' as $f$
with
unit as (   -- unit pencapaian unik: kumpulan dikira SEKALI; KESELURUHAN (agregat) dikecualikan
  select pc.kod_sekolah, pc.program_id, pc.kategori, pc.tempat, pc.peringkat, max(pc.markah) markah
  from pencapaian pc
  where pc.tahun = p_tahun and pc.kategori <> 'KESELURUHAN'
  group by pc.kod_sekolah, pc.program_id, pc.kategori, pc.tempat, pc.peringkat,
    case when pc.kategori in ('INDIVIDU LELAKI','INDIVIDU PEREMPUAN','TERBUKA INDIVIDU') then coalesce(nullif(pc.no_kp_peserta,''), pc.nama_peserta) else '-' end
),
ue as (
  select u.*, (u.markah is null) dianggar,
    coalesce(u.markah,
      coalesce((c #>> array['mata_ganti','tempat', case u.tempat when 'TEMPAT PERTAMA' then '1' when 'TEMPAT KEDUA' then '2' when 'TEMPAT KETIGA' then '3' when 'TEMPAT KEEMPAT' then '4' when 'TEMPAT KELIMA' then '5' else 'x' end])::numeric, 0)
      * coalesce((c #>> array['mata_ganti','peringkat', u.peringkat])::numeric, 1)) mata
  from unit u
),
pnc as (select kod_sekolah, sum(mata) mata, count(*)::int placements, (count(*) filter (where tempat='TEMPAT PERTAMA'))::int t1,
               count(distinct program_id)::int prog_pnc, (count(*) filter (where dianggar))::int dianggar from ue group by 1),
peny as (
  select p.kod_sekolah, count(distinct p.program_id)::int prog,
    (count(distinct coalesce(nullif(p.id_peserta,''), nullif(p.no_kp_peserta,''))) filter (where coalesce(p.nama_peserta,'')<>''))::int peserta,
    count(distinct g.bidang)::int bidang,
    (count(*) filter (where coalesce(p.nama_peserta,'')<>'' and length(regexp_replace(coalesce(p.no_kp_peserta,''),'\D','','g'))=12 and coalesce(p.jantina_peserta,'')<>'' and coalesce(p.bangsa_peserta,'')<>'')::numeric
      / nullif(count(*) filter (where coalesce(p.nama_peserta,'')<>''),0)) kualiti
  from penyertaan p left join programs g on g.id = p.program_id
  where p.tahun = p_tahun group by 1
),
s as (
  select sk.kod, sk.nama, case when substr(sk.kod,2,1)='E' then 'SM' else 'SR' end jenis,
    coalesce(pnc.mata,0)::numeric mata, coalesce(pnc.placements,0) placements, coalesce(pnc.t1,0) t1,
    coalesce(peny.prog,0) prog, coalesce(peny.peserta,0) peserta, coalesce(peny.bidang,0) bidang,
    least(1, coalesce(pnc.prog_pnc,0)::numeric / nullif(coalesce(peny.prog,0),0)) kemenjadian,
    coalesce(peny.kualiti,0)::numeric kualiti, coalesce(pnc.dianggar,0) dianggar
  from sekolah sk left join pnc on pnc.kod_sekolah = sk.kod left join peny on peny.kod_sekolah = sk.kod
),
q as (select coalesce((c->>'normalisasi_peratusan')::numeric, 0.9) v),
p90 as (
  select s.jenis,
    percentile_cont((select v from q)) within group (order by s.mata)::numeric mata,
    percentile_cont((select v from q)) within group (order by s.placements)::numeric placements,
    percentile_cont((select v from q)) within group (order by s.prog)::numeric prog,
    percentile_cont((select v from q)) within group (order by s.peserta)::numeric peserta,
    percentile_cont((select v from q)) within group (order by s.bidang)::numeric bidang
  from s group by s.jenis
),
mx as (select s.jenis, max(s.mata) mata, max(s.placements)::numeric placements, max(s.prog)::numeric prog, max(s.peserta)::numeric peserta, max(s.bidang)::numeric bidang from s group by s.jenis)
select s.kod, s.nama, s.jenis, s.mata, s.placements, s.t1, s.prog, s.peserta, s.bidang, coalesce(s.kemenjadian,0), s.kualiti,
  round(
    _anugerah_w(c,'kategori','mata')        * least(1, s.mata/nullif(p.mata,0))
  + _anugerah_w(c,'kategori','placements')  * least(1, s.placements/nullif(p.placements,0))
  + _anugerah_w(c,'kategori','program')     * least(1, s.prog/nullif(p.prog,0))
  + _anugerah_w(c,'kategori','peserta')     * least(1, s.peserta/nullif(p.peserta,0))
  + _anugerah_w(c,'kategori','bidang')      * least(1, s.bidang/nullif(p.bidang,0))
  + _anugerah_w(c,'kategori','kemenjadian') * coalesce(s.kemenjadian,0)
  + _anugerah_w(c,'kategori','kualiti')     * s.kualiti, 2) skor_kat,
  round(
    _anugerah_w(c,'top','mata')        * (s.mata/nullif(mx.mata,0))
  + _anugerah_w(c,'top','placements')  * (s.placements/nullif(mx.placements,0))
  + _anugerah_w(c,'top','program')     * (s.prog/nullif(mx.prog,0))
  + _anugerah_w(c,'top','peserta')     * (s.peserta/nullif(mx.peserta,0))
  + _anugerah_w(c,'top','bidang')      * (s.bidang/nullif(mx.bidang,0))
  + _anugerah_w(c,'top','kemenjadian') * coalesce(s.kemenjadian,0)
  + _anugerah_w(c,'top','kualiti')     * s.kualiti, 2) skor_top,
  s.dianggar
from s join p90 p on p.jenis = s.jenis join mx on mx.jenis = s.jenis;
$f$;

-- ================= GURU =================
create or replace function public._anugerah_guru(p_tahun int, c jsonb)
returns table(gid text, nama text, kod text, nama_sekolah text, jenis text, mata numeric, placements int, t1 int, prog int,
              peserta int, bidang int, kualiti numeric, skor numeric, tanpa_kp boolean)
language sql stable security definer set search_path to 'public' as $f$
with
peny_g as (   -- guru daripada penyertaan (KP dinormalkan kepada digit; kunci = KP 12 digit, jika tiada = nama)
  select p.kod_sekolah, p.program_id, upper(trim(p.nama_guru)) nm,
         regexp_replace(coalesce(p.no_kp_guru,''),'\D','','g') kp,
         case when length(regexp_replace(coalesce(p.no_kp_guru,''),'\D','','g'))=12 then regexp_replace(p.no_kp_guru,'\D','','g') else upper(trim(p.nama_guru)) end gid,
         coalesce(nullif(p.id_peserta,''), nullif(p.no_kp_peserta,'')) pes, coalesce(p.nama_peserta,'') nama_pes,
         (length(regexp_replace(coalesce(p.no_kp_guru,''),'\D','','g'))=12 and coalesce(p.jantina_guru,'')<>'' and coalesce(p.bangsa_guru,'')<>'' and coalesce(p.no_tel_guru,'')<>'') lengkap,
         g.bidang
  from penyertaan p left join programs g on g.id = p.program_id
  where p.tahun = p_tahun and coalesce(trim(p.nama_guru),'') <> ''
),
dir as (select nm, kod_sekolah, max(kp) filter (where length(kp)=12) kp from peny_g group by 1,2),
pnc_g as (    -- guru daripada pencapaian: pecah ' | ' (nama & KP selari); setiap guru pengiring dikreditkan penuh
  select pc.kod_sekolah, pc.program_id, pc.kategori, pc.tempat, pc.peringkat, pc.markah,
         coalesce(nullif(pc.no_kp_peserta,''), pc.nama_peserta) pes, g.nm, g.kp
  from pencapaian pc
  cross join lateral (
    select upper(trim(a.n)) nm, regexp_replace(coalesce(b.k,''),'\D','','g') kp
    from unnest(string_to_array(coalesce(pc.nama_guru,''),'|')) with ordinality a(n,o)
    left join unnest(string_to_array(coalesce(pc.no_kp_guru,''),'|')) with ordinality b(k,o2) on b.o2 = a.o
    where trim(a.n) <> '') g
  where pc.tahun = p_tahun and pc.kategori <> 'KESELURUHAN'
),
pnc_k as (
  select pg.*, case when length(pg.kp)=12 then pg.kp else coalesce(d.kp, pg.nm) end gid, (length(pg.kp)<>12 and d.kp is null) tanpa_kp
  from pnc_g pg left join dir d on d.nm = pg.nm and d.kod_sekolah = pg.kod_sekolah
),
unit as (
  select gid, kod_sekolah, program_id, kategori, tempat, peringkat, max(markah) markah, bool_or(tanpa_kp) tanpa_kp, max(nm) nm
  from pnc_k
  group by gid, kod_sekolah, program_id, kategori, tempat, peringkat,
    case when kategori in ('INDIVIDU LELAKI','INDIVIDU PEREMPUAN','TERBUKA INDIVIDU') then pes else '-' end
),
ue as (
  select u.*, coalesce(u.markah,
      coalesce((c #>> array['mata_ganti','tempat', case u.tempat when 'TEMPAT PERTAMA' then '1' when 'TEMPAT KEDUA' then '2' when 'TEMPAT KETIGA' then '3' when 'TEMPAT KEEMPAT' then '4' when 'TEMPAT KELIMA' then '5' else 'x' end])::numeric, 0)
      * coalesce((c #>> array['mata_ganti','peringkat', u.peringkat])::numeric, 1)) mata
  from unit u
),
pg_a as (select gid, sum(mata) mata, count(*)::int placements, (count(*) filter (where tempat='TEMPAT PERTAMA'))::int t1,
                mode() within group (order by kod_sekolah) kod_p, max(nm) nm, bool_or(tanpa_kp) tanpa_kp from ue group by gid),
pp_a as (select gid, max(nm) nm, mode() within group (order by kod_sekolah) kod, count(distinct program_id)::int prog,
                count(distinct pes) filter (where nama_pes<>'')::int peserta, count(distinct bidang)::int bidang,
                (count(*) filter (where lengkap))::numeric / nullif(count(*),0) kualiti from peny_g group by gid),
g as (
  select coalesce(pp.gid, pg.gid) gid, coalesce(pp.nm, pg.nm) nm, coalesce(pp.kod, pg.kod_p) kod,
    coalesce(pg.mata,0)::numeric mata, coalesce(pg.placements,0) placements, coalesce(pg.t1,0) t1,
    coalesce(pp.prog,0) prog, coalesce(pp.peserta,0) peserta, coalesce(pp.bidang,0) bidang, coalesce(pp.kualiti,0)::numeric kualiti,
    coalesce(pg.tanpa_kp,false) tanpa_kp
  from pp_a pp full join pg_a pg on pg.gid = pp.gid
),
gj as (select g.*, case when substr(g.kod,2,1)='E' then 'SM' else 'SR' end jenis from g where g.kod is not null),
q as (select coalesce((c->>'normalisasi_peratusan')::numeric, 0.9) v),
p90 as (
  select gj.jenis,
    percentile_cont((select v from q)) within group (order by gj.mata)::numeric mata,
    percentile_cont((select v from q)) within group (order by gj.placements)::numeric placements,
    percentile_cont((select v from q)) within group (order by gj.prog)::numeric prog,
    percentile_cont((select v from q)) within group (order by gj.peserta)::numeric peserta,
    percentile_cont((select v from q)) within group (order by gj.bidang)::numeric bidang
  from gj group by gj.jenis
),
mx as (select gj.jenis, max(gj.mata) mata, max(gj.placements)::numeric placements, max(gj.prog)::numeric prog, max(gj.peserta)::numeric peserta, max(gj.bidang)::numeric bidang from gj group by gj.jenis)
select gj.gid, gj.nm, gj.kod, sk.nama, gj.jenis, gj.mata, gj.placements, gj.t1, gj.prog, gj.peserta, gj.bidang, gj.kualiti,
  round(
    _anugerah_w(c,'guru','mata')       * (gj.mata/nullif(mx.mata,0))
  + _anugerah_w(c,'guru','placements') * (gj.placements/nullif(mx.placements,0))
  + _anugerah_w(c,'guru','program')    * (gj.prog/nullif(mx.prog,0))
  + _anugerah_w(c,'guru','peserta')    * (gj.peserta/nullif(mx.peserta,0))
  + _anugerah_w(c,'guru','bidang')     * (gj.bidang/nullif(mx.bidang,0))
  + _anugerah_w(c,'guru','kualiti')    * gj.kualiti, 2) skor,
  gj.tanpa_kp
from gj join mx on mx.jenis = gj.jenis left join sekolah sk on sk.kod = gj.kod;
$f$;

revoke all on function public._anugerah_cfg_lalai(), public._anugerah_cfg(jsonb), public._anugerah_w(jsonb,text,text),
  public._anugerah_sekolah(int,jsonb), public._anugerah_guru(int,jsonb) from public, anon, authenticated;

-- ================= RPC UTAMA (ADMIN SAHAJA) =================
create or replace function public.anugerah_keputusan(p_no_kp text, p_token text, p_tahun int default null, p_config jsonb default null)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $f$
declare
  v_role text; c jsonb; th int; res jsonb;
  mod_k text; e numeric; p numeric; gg numeric; n_top int; n_guru int;
begin
  v_role := _sahkan_token(p_no_kp, p_token);
  if v_role is distinct from 'admin' then raise exception 'Akses ditolak - hanya admin.'; end if;
  c := _anugerah_cfg(p_config);
  th := coalesce(p_tahun, (select max(tahun) from programs), extract(year from now())::int);
  mod_k := coalesce(c #>> '{kategori,mod}', 'MUTLAK');
  e := coalesce((c #>> '{kategori,ambang,emas}')::numeric, 75);   p := coalesce((c #>> '{kategori,ambang,perak}')::numeric, 55);   gg := coalesce((c #>> '{kategori,ambang,gangsa}')::numeric, 35);
  n_top := least(10, greatest(1, coalesce((c #>> '{top,bilangan}')::int, 5)));
  n_guru := least(10, greatest(1, coalesce((c #>> '{guru,bilangan}')::int, 5)));

  with sk as (select * from _anugerah_sekolah(th, c)),
  kls as (
    select sk.*,
      case when sk.prog = 0 and sk.placements = 0 then 'TIADA' 
           when mod_k = 'PERCENTILE' then
             case when cume_dist() over (order by sk.skor_kat desc) <= coalesce((c #>> '{kategori,peratus,emas}')::numeric,15)/100 then 'EMAS'
                  when cume_dist() over (order by sk.skor_kat desc) <= (coalesce((c #>> '{kategori,peratus,emas}')::numeric,15)+coalesce((c #>> '{kategori,peratus,perak}')::numeric,25))/100 then 'PERAK'
                  when cume_dist() over (order by sk.skor_kat desc) <= (coalesce((c #>> '{kategori,peratus,emas}')::numeric,15)+coalesce((c #>> '{kategori,peratus,perak}')::numeric,25)+coalesce((c #>> '{kategori,peratus,gangsa}')::numeric,30))/100 then 'GANGSA'
                  else 'TIADA' end
           else case when sk.skor_kat >= e then 'EMAS' when sk.skor_kat >= p then 'PERAK' when sk.skor_kat >= gg then 'GANGSA' else 'TIADA' end
      end asal
    from sk
  ),
  gate as (
    select kls.*,
      case
        when asal = 'EMAS'   and placements >= coalesce((c #>> '{kategori,syarat,emas,placements}')::int,0)   and prog >= coalesce((c #>> '{kategori,syarat,emas,program}')::int,0)   then 'EMAS'
        when asal in ('EMAS','PERAK')  and placements >= coalesce((c #>> '{kategori,syarat,perak,placements}')::int,0)  and prog >= coalesce((c #>> '{kategori,syarat,perak,program}')::int,0)  then 'PERAK'
        when asal in ('EMAS','PERAK','GANGSA') and placements >= coalesce((c #>> '{kategori,syarat,gangsa,placements}')::int,0) and prog >= coalesce((c #>> '{kategori,syarat,gangsa,program}')::int,0) then 'GANGSA'
        else 'TIADA' end kategori
    from kls
  ),
  rk as (
    select gate.*, rank() over (partition by jenis order by skor_top desc, t1 desc, mata desc, prog desc) kedudukan_top,
           rank() over (order by skor_kat desc) kedudukan_kat
    from gate
  ),
  gr as (
    select g.*, rank() over (partition by jenis order by skor desc, t1 desc, mata desc, prog desc) kedudukan from _anugerah_guru(th, c) g
  )
  select jsonb_build_object(
    'tahun', th, 'config', c,
    'sekolah', coalesce((select jsonb_agg(jsonb_build_object('kod',kod,'nama',nama,'jenis',jenis,'mata',mata,'placements',placements,'t1',t1,'prog',prog,'peserta',peserta,'bidang',bidang,
        'kemenjadian',round(kemenjadian,3),'kualiti',round(kualiti,3),'skor_kat',skor_kat,'skor_top',skor_top,'kategori',kategori,'kategori_asal',asal,
        'turun', (kategori <> asal), 'tidak_konsisten', (prog = 0 and placements > 0), 'kedudukan_top',kedudukan_top,'kedudukan_kat',kedudukan_kat,'mata_dianggar',mata_dianggar) order by skor_kat desc, nama) from rk), '[]'::jsonb),
    'top_sekolah', jsonb_build_object(
      'SR', coalesce((select jsonb_agg(jsonb_build_object('kedudukan',kedudukan_top,'kod',kod,'nama',nama,'skor',skor_top,'mata',mata,'t1',t1,'placements',placements,'prog',prog,'peserta',peserta) order by kedudukan_top, nama) from rk where jenis='SR' and kedudukan_top <= n_top and (prog > 0 or placements > 0) and skor_top >= coalesce((c #>> '{top,skor_minimum}')::numeric,0)), '[]'::jsonb),
      'SM', coalesce((select jsonb_agg(jsonb_build_object('kedudukan',kedudukan_top,'kod',kod,'nama',nama,'skor',skor_top,'mata',mata,'t1',t1,'placements',placements,'prog',prog,'peserta',peserta) order by kedudukan_top, nama) from rk where jenis='SM' and kedudukan_top <= n_top and (prog > 0 or placements > 0) and skor_top >= coalesce((c #>> '{top,skor_minimum}')::numeric,0)), '[]'::jsonb)),
    'top_guru', jsonb_build_object(
      'SR', coalesce((select jsonb_agg(jsonb_build_object('kedudukan',kedudukan,'gid',gid,'nama',nama,'sekolah',nama_sekolah,'skor',skor,'mata',mata,'t1',t1,'placements',placements,'prog',prog,'peserta',peserta,'tanpa_kp',tanpa_kp) order by kedudukan, nama) from gr where jenis='SR' and kedudukan <= n_guru and (placements > 0 or prog > 0) and skor >= coalesce((c #>> '{guru,skor_minimum}')::numeric,0)), '[]'::jsonb),
      'SM', coalesce((select jsonb_agg(jsonb_build_object('kedudukan',kedudukan,'gid',gid,'nama',nama,'sekolah',nama_sekolah,'skor',skor,'mata',mata,'t1',t1,'placements',placements,'prog',prog,'peserta',peserta,'tanpa_kp',tanpa_kp) order by kedudukan, nama) from gr where jenis='SM' and kedudukan <= n_guru and (placements > 0 or prog > 0) and skor >= coalesce((c #>> '{guru,skor_minimum}')::numeric,0)), '[]'::jsonb)),
    'ringkasan', jsonb_build_object(
      'emas',(select count(*) from rk where kategori='EMAS'),'perak',(select count(*) from rk where kategori='PERAK'),
      'gangsa',(select count(*) from rk where kategori='GANGSA'),'tiada',(select count(*) from rk where kategori='TIADA'),
      'jumlah_sekolah',(select count(*) from rk),'tiada_penyertaan',(select count(*) from rk where prog=0 and placements=0),'tidak_konsisten',(select count(*) from rk where prog=0 and placements>0),
      'jumlah_guru',(select count(*) from gr)),
    'amaran', jsonb_build_object(
      'unit_markah_dianggar',(select coalesce(sum(mata_dianggar),0) from rk),
      'baris_pencapaian',(select count(*) from pencapaian where tahun=th),
      'baris_keseluruhan_dikecualikan',(select count(*) from pencapaian where tahun=th and kategori='KESELURUHAN'),
      'baris_penyertaan_tanpa_peserta',(select count(*) from penyertaan where tahun=th and coalesce(nama_peserta,'')=''),
      'pencapaian_guru_berganda',(select count(*) from pencapaian where tahun=th and nama_guru like '%|%'),
      'guru_tanpa_kp',(select count(*) from gr where tanpa_kp),
      'pencapaian_tanpa_guru',(select count(*) from pencapaian where tahun=th and coalesce(trim(nama_guru),'')='')
    )
  ) into res;
  return res;
end $f$;

-- ================= SIMPAN KONFIGURASI (ADMIN SAHAJA) =================
create or replace function public.anugerah_config_simpan(p_no_kp text, p_token text, p_config jsonb)
returns jsonb language plpgsql security definer set search_path to 'public', 'extensions' as $f$
declare v_role text; b text; jml numeric; k text; v numeric; amb jsonb;
begin
  v_role := _sahkan_token(p_no_kp, p_token);
  if v_role is distinct from 'admin' then raise exception 'Akses ditolak - hanya admin.'; end if;
  if p_config is null or jsonb_typeof(p_config) <> 'object' then raise exception 'Konfigurasi tidak sah.'; end if;
  -- berat setiap profil mesti berjumlah 100 dan tidak negatif
  foreach b in array array['kategori','top','guru'] loop
    if p_config ? b and (p_config->b) ? 'berat' then
      jml := 0;
      for k, v in select key, (value)::numeric from jsonb_each_text(p_config->b->'berat') loop
        if v < 0 or v > 100 then raise exception 'Berat "%" mesti antara 0 dan 100.', k; end if;
        jml := jml + v;
      end loop;
      if jml <> 100 then raise exception 'Jumlah berat bagi % mesti 100 (kini %).', b, jml; end if;
    end if;
  end loop;
  if p_config #>> '{kategori,mod}' is not null and (p_config #>> '{kategori,mod}') not in ('MUTLAK','PERCENTILE') then raise exception 'Mod mesti MUTLAK atau PERCENTILE.'; end if;
  amb := p_config #> '{kategori,ambang}';
  if amb is not null then
    if not ((amb->>'emas')::numeric > (amb->>'perak')::numeric and (amb->>'perak')::numeric > (amb->>'gangsa')::numeric and (amb->>'gangsa')::numeric >= 0 and (amb->>'emas')::numeric <= 100) then
      raise exception 'Ambang mesti: Emas > Perak > Gangsa >= 0 dan Emas <= 100.'; end if;
  end if;
  if p_config ? 'normalisasi_peratusan' and not ((p_config->>'normalisasi_peratusan')::numeric between 0.5 and 1) then raise exception 'Peratusan normalisasi mesti antara 0.5 dan 1.'; end if;
  insert into anugerah_config(kunci, nilai, dikemaskini, oleh) values ('rubrik', p_config, now(), p_no_kp)
  on conflict (kunci) do update set nilai = (select _anugerah_cfg_gabung(anugerah_config.nilai, excluded.nilai)), dikemaskini = now(), oleh = p_no_kp;
  return jsonb_build_object('ok', true);
end $f$;

-- gabung dua konfigurasi separa (bahagian utama ditimpa mengikut kunci)
create or replace function public._anugerah_cfg_gabung(a jsonb, b jsonb) returns jsonb language plpgsql immutable as $f$
declare r jsonb := coalesce(a,'{}'::jsonb); k text;
begin
  for k in select jsonb_object_keys(coalesce(b,'{}'::jsonb)) loop
    r := jsonb_set(r, array[k], case when jsonb_typeof(r->k)='object' and jsonb_typeof(b->k)='object' then (r->k) || (b->k) else b->k end, true);
  end loop;
  return r;
end $f$;

revoke all on function public._anugerah_cfg_gabung(jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.anugerah_keputusan(text,text,int,jsonb) to anon, authenticated;
grant execute on function public.anugerah_config_simpan(text,text,jsonb) to anon, authenticated;
