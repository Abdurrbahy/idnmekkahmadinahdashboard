-- ============================================================================
-- MIGRATION V3.6: RUBRIK PENILAIAN UJIAN AL-QUR'AN (RUBRIC-BASED SCORING)
-- Non-destructive migration to support multi-aspect rubric evaluation
-- ============================================================================

-- 1. Tambah kolom rubrik_penilaian (JSONB) pada tabel submissions
-- Menyimpan rincian skor 5 aspek, bobot, nilai akhir, predikat, status otomatis,
-- status override, alasan override, dan versi rubrik.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'submissions'
      AND column_name = 'rubrik_penilaian'
  ) THEN
    ALTER TABLE public.submissions
      ADD COLUMN rubrik_penilaian JSONB NULL;

    COMMENT ON COLUMN public.submissions.rubrik_penilaian IS
      'Detail penilaian rubrik Al-Qur''an: skor 5 aspek (hafalan, tajwid, makhraj, kelancaran, waqaf_ibtida), bobot, predikat, status otomatis, dan riwayat override.';
  END IF;
END $$;

-- 2. Index GIN untuk pencarian dan audit data rubrik jika diperlukan
CREATE INDEX IF NOT EXISTS idx_submissions_rubrik_penilaian
  ON public.submissions USING gin (rubrik_penilaian)
  WHERE rubrik_penilaian IS NOT NULL;
