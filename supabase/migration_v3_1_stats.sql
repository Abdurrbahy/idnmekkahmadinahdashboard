-- ============================================================================
-- IDN DASHBOARD (MEKKAH & MADINAH) — MIGRATION V3.1: STATS & VIEWS
-- ============================================================================
-- File: migration_v3_1_stats.sql
-- Keterangan: Idempoten, aman dijalankan ulang pada Supabase SQL Editor.
-- ============================================================================

-- 1. Helper Fungsi Awal Pekan (Hari AHAD / Sunday = 0)
CREATE OR REPLACE FUNCTION public.pekan_mulai(p_tanggal date)
RETURNS date LANGUAGE sql IMMUTABLE AS $$
  SELECT p_tanggal - EXTRACT(DOW FROM p_tanggal)::int;
$$;

-- 2. View Skor Mutabaah Harian (Puasa Sunnah dikeluarkan dari pembagi, amalan di-cap 100%)
CREATE OR REPLACE VIEW public.v_mutabaah_daily_score AS
SELECT
  r.student_id,
  r.tanggal,
  ROUND(
    SUM(
      CASE
        WHEN a.tipe = 'boolean' THEN (r.status = 'done')::int
        ELSE LEAST(COALESCE(r.jumlah, 0) / NULLIF(a.target_harian, 0), 1)
      END * a.bobot
    ) / NULLIF(SUM(a.bobot), 0) * 100
  , 1) AS skor_persen,
  COUNT(*) FILTER (
    WHERE (a.tipe = 'boolean' AND r.status = 'done')
       OR (a.tipe = 'angka' AND COALESCE(r.jumlah, 0) >= a.target_harian)
  ) AS amalan_tuntas,
  COUNT(*) AS amalan_dinilai
FROM public.mutabaah_records r
JOIN public.mutabaah_activities a ON a.id = r.activity_id
WHERE a.aktif = true AND a.target_harian IS NOT NULL
GROUP BY r.student_id, r.tanggal;

-- 3. View Amalan Bonus (Amalan tanpa target harian, misal Puasa Sunnah)
CREATE OR REPLACE VIEW public.v_mutabaah_bonus AS
SELECT r.student_id, r.tanggal, a.kode, a.nama, r.status
FROM public.mutabaah_records r
JOIN public.mutabaah_activities a ON a.id = r.activity_id
WHERE a.aktif = true AND a.target_harian IS NULL AND r.status = 'done';

-- 4. View Rekap Pekanan Kehadiran (Ahad s/d Sabtu)
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
  ROUND(COUNT(*) FILTER (WHERE l.status = 'hadir')::numeric / NULLIF(COUNT(*), 0) * 100, 1) AS persen_kehadiran
FROM public.attendance_logs l
GROUP BY public.pekan_mulai(l.tanggal), (public.pekan_mulai(l.tanggal) + 6)::date, l.student_id;

-- 5. View Rekap Pekanan Setoran Al-Qur'an (Ahad s/d Sabtu)
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
GROUP BY public.pekan_mulai(s.tanggal), (public.pekan_mulai(s.tanggal) + 6)::date, s.student_id;

-- 6. View Rekap Pekanan Mutabaah (Ahad s/d Sabtu) - FIX Correlated Group By
CREATE OR REPLACE VIEW public.v_weekly_mutabaah AS
WITH daily_agg AS (
  SELECT
    public.pekan_mulai(d.tanggal) AS pekan_mulai,
    (public.pekan_mulai(d.tanggal) + 6)::date AS pekan_selesai,
    d.student_id,
    ROUND(AVG(d.skor_persen), 1) AS rata_skor_mutabaah,
    COUNT(DISTINCT d.tanggal) AS hari_terisi
  FROM public.v_mutabaah_daily_score d
  GROUP BY public.pekan_mulai(d.tanggal), (public.pekan_mulai(d.tanggal) + 6)::date, d.student_id
),
bonus_agg AS (
  SELECT
    public.pekan_mulai(b.tanggal) AS pekan_mulai,
    b.student_id,
    COUNT(*) AS jumlah_bonus
  FROM public.v_mutabaah_bonus b
  GROUP BY public.pekan_mulai(b.tanggal), b.student_id
)
SELECT
  d.pekan_mulai,
  d.pekan_selesai,
  d.student_id,
  d.rata_skor_mutabaah,
  d.hari_terisi,
  COALESCE(b.jumlah_bonus, 0) AS jumlah_bonus
FROM daily_agg d
LEFT JOIN bonus_agg b ON b.pekan_mulai = d.pekan_mulai AND b.student_id = d.student_id;

-- 7. View Kelengkapan Data Harian
CREATE OR REPLACE VIEW public.v_daily_completeness AS
SELECT
  d.tanggal,
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

-- 8. Terapkan Security Invoker pada Semua View & Berikan Hak Akses
ALTER VIEW public.v_mutabaah_daily_score SET (security_invoker = true);
ALTER VIEW public.v_mutabaah_bonus SET (security_invoker = true);
ALTER VIEW public.v_weekly_attendance SET (security_invoker = true);
ALTER VIEW public.v_weekly_quran SET (security_invoker = true);
ALTER VIEW public.v_weekly_mutabaah SET (security_invoker = true);
ALTER VIEW public.v_daily_completeness SET (security_invoker = true);

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.surahs TO anon;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
