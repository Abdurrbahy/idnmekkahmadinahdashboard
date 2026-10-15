-- ============================================================================
-- IDN DASHBOARD (MEKKAH & MADINAH) — MIGRATION V3.7: WEEKLY REPORT TEMPLATE
-- ============================================================================
-- File: migration_v3_7_weekly_report_template.sql
-- Keterangan: Self-contained & Idempoten, aman dijalankan di Supabase SQL Editor.
-- ============================================================================

-- 1. Tambah kolom report_data (JSONB) pada tabel weekly_reports
ALTER TABLE public.weekly_reports
ADD COLUMN IF NOT EXISTS report_data JSONB NULL;

COMMENT ON COLUMN public.weekly_reports.report_data IS
'Payload snapshot terstruktur untuk 10 Bagian Form Weekly Report Koordinator: metadata, highlights, evaluasi mutabaah & quran, kualitas tahfidz, arabic speaking (vlog & podcast), timeline aktivitas, dokumentasi 4 foto, kendala & tindak lanjut, dan fokus pekan berikutnya.';

-- 2. GIN Index untuk pencarian dan query cepat berbasis JSONB
CREATE INDEX IF NOT EXISTS idx_weekly_reports_report_data
ON public.weekly_reports USING GIN (report_data);

-- 3. Pastikan bucket storage 'dokumentasi' tersedia untuk upload 4 foto
INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumentasi', 'dokumentasi', true)
ON CONFLICT (id) DO NOTHING;

-- Policies untuk storage jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Read Dokumentasi'
  ) THEN
    CREATE POLICY "Public Read Dokumentasi" ON storage.objects
      FOR SELECT TO authenticated USING (bucket_id = 'dokumentasi');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin Upload Dokumentasi'
  ) THEN
    CREATE POLICY "Admin Upload Dokumentasi" ON storage.objects
      FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dokumentasi' AND public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Admin Delete Dokumentasi'
  ) THEN
    CREATE POLICY "Admin Delete Dokumentasi" ON storage.objects
      FOR DELETE TO authenticated USING (bucket_id = 'dokumentasi' AND public.is_admin());
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
