-- ============================================================================
-- IDN DASHBOARD (MEKKAH & MADINAH) — MIGRATION V3.3: HARI AKTIF (AHAD–KAMIS)
-- ============================================================================
-- File: migration_v3_3_hari_aktif.sql
-- Keterangan: Idempoten, aman dijalankan ulang pada Supabase SQL Editor.
-- ============================================================================

-- 1. Helper Fungsi Hari Aktif (Ahad/0 sampai Kamis/4 = true; Jumat/5 & Sabtu/6 = false)
CREATE OR REPLACE FUNCTION public.is_hari_aktif(p_tanggal date)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT EXTRACT(DOW FROM p_tanggal)::int BETWEEN 0 AND 4;
$$;

GRANT EXECUTE ON FUNCTION public.is_hari_aktif(date) TO authenticated, anon;

-- 2. View Rekap Pekanan Kehadiran (Filter Hari Aktif: Ahad s/d Kamis)
CREATE OR REPLACE VIEW public.v_weekly_attendance AS
SELECT
  public.pekan_mulai(l.tanggal) AS pekan_mulai,
  (public.pekan_mulai(l.tanggal) + 6)::date AS pekan_selesai,
  l.student_id,
  COUNT(*) FILTER (WHERE l.status = 'hadir') AS n_hadir,
  COUNT(*) FILTER (WHERE l.status = 'izin') AS n_izin,
  COUNT(*) FILTER (WHERE l.status = 'sakit') AS n_sakit,
  COUNT(*) FILTER (WHERE l.status = 'alpa') AS n_alpa,
  COUNT(*) AS total_sesi,
  COUNT(DISTINCT l.tanggal) AS hari_aktif_terisi,
  ROUND(COUNT(*) FILTER (WHERE l.status = 'hadir')::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS persen_kehadiran
FROM public.attendance_logs l
WHERE public.is_hari_aktif(l.tanggal)
GROUP BY public.pekan_mulai(l.tanggal), (public.pekan_mulai(l.tanggal) + 6)::date, l.student_id;

-- 3. View Rekap Pekanan Setoran Al-Qur'an (Filter Hari Aktif: Ahad s/d Kamis)
CREATE OR REPLACE VIEW public.v_weekly_quran AS
SELECT
  public.pekan_mulai(s.tanggal) AS pekan_mulai,
  (public.pekan_mulai(s.tanggal) + 6)::date AS pekan_selesai,
  s.student_id,
  COALESCE(SUM(s.capaian) FILTER (WHERE s.jenis = 'ziyadah'), 0) AS total_ziyadah_ayat,
  COALESCE(SUM(s.capaian) FILTER (WHERE s.jenis = 'murajaah'), 0) AS total_murajaah_ayat,
  COALESCE(SUM(s.capaian) FILTER (WHERE s.jenis = 'mutun'), 0) AS total_mutun_bait,
  COALESCE(SUM(s.capaian) FILTER (WHERE s.jenis = 'mufradat'), 0) AS total_mufradat_kata,
  COALESCE(SUM(s.capaian) FILTER (WHERE s.jenis IN ('ziyadah', 'murajaah')), 0) AS total_quran_ayat,
  COUNT(*) AS jumlah_setoran,
  ROUND(AVG(s.nilai) FILTER (WHERE s.nilai IS NOT NULL), 1) AS rata_nilai
FROM public.submissions s
WHERE public.is_hari_aktif(s.tanggal)
GROUP BY public.pekan_mulai(s.tanggal), (public.pekan_mulai(s.tanggal) + 6)::date, s.student_id;

-- 4. View Kelengkapan Data Harian (Dilengkapi kolom penanda hari_aktif)
CREATE OR REPLACE VIEW public.v_daily_completeness AS
SELECT
  d.tanggal,
  public.is_hari_aktif(d.tanggal) AS hari_aktif,
  (SELECT COUNT(*) FROM public.attendance_logs WHERE tanggal = d.tanggal) AS n_presensi,
  (SELECT COUNT(*) FROM public.submissions WHERE tanggal = d.tanggal) AS n_setoran,
  (SELECT COUNT(*) FROM public.mutabaah_records WHERE tanggal = d.tanggal) AS n_mutabaah,
  (SELECT COUNT(*) FROM public.activities WHERE tanggal = d.tanggal) AS n_kegiatan
FROM (
  SELECT DISTINCT tanggal FROM public.attendance_logs
  UNION SELECT DISTINCT tanggal FROM public.mutabaah_records
  UNION SELECT DISTINCT tanggal FROM public.submissions
  UNION SELECT DISTINCT tanggal FROM public.activities
) d;

-- 5. Set Security Invoker & Izin Akses
ALTER VIEW public.v_weekly_attendance SET (security_invoker = true);
ALTER VIEW public.v_weekly_quran SET (security_invoker = true);
ALTER VIEW public.v_daily_completeness SET (security_invoker = true);

GRANT SELECT ON public.v_weekly_attendance TO authenticated;
GRANT SELECT ON public.v_weekly_quran TO authenticated;
GRANT SELECT ON public.v_daily_completeness TO authenticated;

-- Refresh cache
NOTIFY pgrst, 'reload schema';
