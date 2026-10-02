-- ============================================================================
-- IDN DASHBOARD (MEKKAH & MADINAH) — MIGRATION V3.2: WEEKLY PROGRESS REPORT
-- ============================================================================
-- File: migration_v3_2_weekly_report.sql
-- Keterangan: Self-contained & Idempoten, aman dijalankan di Supabase SQL Editor.
-- ============================================================================

-- 0. Helper Functions (Audit & RBAC)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_created_by()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid() AND is_active = true), false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role IN ('admin', 'atasan') FROM public.profiles WHERE id = auth.uid() AND is_active = true), false);
$$;

-- A1. Induk Laporan Pekanan
CREATE TABLE IF NOT EXISTS public.weekly_reports (
  id                  bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pekan_mulai         date NOT NULL,          -- selalu hari Ahad (Sunday)
  status              text NOT NULL DEFAULT 'draft'
                      CHECK (status IN ('draft', 'final')),
  catatan_umum        text,
  rencana_pekan_depan text,
  kendala             text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  created_by          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT weekly_reports_unique_pekan UNIQUE (pekan_mulai),
  CONSTRAINT weekly_reports_must_be_sunday CHECK (EXTRACT(DOW FROM pekan_mulai) = 0)
);

CREATE INDEX IF NOT EXISTS idx_weekly_reports_pekan ON public.weekly_reports (pekan_mulai DESC);

-- A2. Slide 2 — Kemajuan Pekanan
CREATE TABLE IF NOT EXISTS public.report_progress_items (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id   bigint NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  urutan      smallint NOT NULL DEFAULT 0,
  kegiatan    text NOT NULL,
  tanggal     date,
  hasil       text,
  status      text NOT NULL DEFAULT 'proses'
              CHECK (status IN ('rencana', 'proses', 'selesai', 'tertunda')),
  rptl        text,   -- Rencana Perbaikan Tindak Lanjut
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_progress_report_id ON public.report_progress_items (report_id, urutan);

-- A3. Slide 3 — Siswa Bermasalah (Internal Evaluation)
CREATE TABLE IF NOT EXISTS public.report_student_issues (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id   bigint NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  urutan      smallint NOT NULL DEFAULT 0,
  tanggal     date,
  student_id  bigint REFERENCES public.students(id) ON DELETE SET NULL,
  nama_lain   text,        -- bila yang dilaporkan bukan santri (mis. guru / staf)
  konteks     text,        -- kelas / mapel / situasi
  masalah     text NOT NULL,
  penanganan  text,
  hasil       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_student_issues_report_id ON public.report_student_issues (report_id, urutan);

-- A4. Slide 4 — Master Kegiatan Jurnal Guru & Rekaman Pekanan
CREATE TABLE IF NOT EXISTS public.teacher_journal_activities (
  id      bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode    text NOT NULL UNIQUE,
  nama    text NOT NULL,
  urutan  smallint NOT NULL DEFAULT 0,
  aktif   boolean NOT NULL DEFAULT true
);

-- Seed 15 Kegiatan Jurnal Guru Standar
INSERT INTO public.teacher_journal_activities (kode, nama, urutan, aktif)
VALUES
  ('tahajjud', 'Shalat tahajjud', 1, true),
  ('qabliyah_subuh', 'Shalat qabliyah subuh', 2, true),
  ('subuh_berjamaah', 'Shalat subuh berjamaah', 3, true),
  ('halaqah_pagi', 'Halaqah pagi', 4, true),
  ('persiapan_pembelajaran', 'Persiapan pembelajaran', 5, true),
  ('menyimak_mufrodat', 'Menyimak setoran mufrodat', 6, true),
  ('dampingi_kbm_1', 'Mendampingi KBM 1', 7, true),
  ('dampingi_kbm_2', 'Mendampingi KBM 2', 8, true),
  ('dampingi_kbm_3', 'Mendampingi KBM 3', 9, true),
  ('zuhur_berjamaah', 'Shalat zuhur berjamaah', 10, true),
  ('asar_berjamaah', 'Shalat asar berjamaah', 11, true),
  ('halaqah_nabawi', 'Halaqah quran bersama syaikh di Nabawi', 12, true),
  ('maghrib_isya', 'Shalat maghrib dan isya berjamaah', 13, true),
  ('laporan_ortu', 'Laporan ke orang tua', 14, true),
  ('evaluasi_harian', 'Evaluasi harian', 15, true)
ON CONFLICT (kode) DO UPDATE
SET nama = EXCLUDED.nama, urutan = EXCLUDED.urutan, aktif = EXCLUDED.aktif;

CREATE TABLE IF NOT EXISTS public.teacher_journal_records (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id    bigint NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  activity_id  bigint NOT NULL REFERENCES public.teacher_journal_activities(id),
  status       text NOT NULL DEFAULT 'completed'
               CHECK (status IN ('completed', 'partial', 'not_done')),
  catatan      text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT teacher_journal_unique UNIQUE (report_id, activity_id)
);

CREATE INDEX IF NOT EXISTS idx_journal_report_id ON public.teacher_journal_records (report_id);

-- A5. Slide 7 — Postingan Sosmed
CREATE TABLE IF NOT EXISTS public.report_social_media (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  report_id   bigint NOT NULL REFERENCES public.weekly_reports(id) ON DELETE CASCADE,
  urutan      smallint NOT NULL DEFAULT 0,
  kegiatan    text NOT NULL,
  progress    text,
  keterangan  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_social_media_report_id ON public.report_social_media (report_id, urutan);

-- A6. Slide 8 — Keuangan (BUKU KAS BERDIRI SENDIRI — Perubahan A6)
CREATE TABLE IF NOT EXISTS public.kas_transaksi (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kelompok          text NOT NULL DEFAULT 'santri'
                    CHECK (kelompok IN ('santri', 'koordinator')),
  tanggal           date NOT NULL DEFAULT CURRENT_DATE,
  kebutuhan         text NOT NULL,
  kategori          text NOT NULL DEFAULT 'operasional'
                    CHECK (kategori IN ('akomodasi', 'keberangkatan',
                                        'operasional', 'pendidikan', 'lainnya')),
  volume            numeric NOT NULL DEFAULT 1,
  satuan            text NOT NULL DEFAULT 'pax',
  harga             numeric NOT NULL DEFAULT 0,
  arah              text NOT NULL CHECK (arah IN ('masuk', 'keluar')),
  keterangan        text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  created_by        uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_kas_tanggal   ON public.kas_transaksi (tanggal);
CREATE INDEX IF NOT EXISTS idx_kas_kelompok  ON public.kas_transaksi (kelompok, tanggal);

-- View dengan saldo berjalan sejak awal program
CREATE OR REPLACE VIEW public.v_kas_transaksi AS
SELECT
  t.*,
  CASE WHEN t.arah = 'masuk'  THEN t.volume * t.harga ELSE 0 END AS kredit,
  CASE WHEN t.arah = 'keluar' THEN t.volume * t.harga ELSE 0 END AS debit,
  SUM(CASE WHEN t.arah = 'masuk' THEN t.volume * t.harga
           ELSE -(t.volume * t.harga) END)
    OVER (PARTITION BY t.kelompok ORDER BY t.tanggal, t.id
          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS sisa_saldo
FROM public.kas_transaksi t;

ALTER VIEW public.v_kas_transaksi SET (security_invoker = true);

-- A7. Triggers Audit (updated_at & created_by)
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'weekly_reports',
    'report_progress_items',
    'report_student_issues',
    'teacher_journal_records',
    'report_social_media',
    'kas_transaksi'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_touch_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();', t, t);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_creator_%I ON public.%I;', t, t);
    EXECUTE format('CREATE TRIGGER trg_creator_%I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();', t, t);
  END LOOP;
END $$;

-- A8. Row Level Security (RLS) & Policies
ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_progress_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_student_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_journal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_journal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kas_transaksi ENABLE ROW LEVEL SECURITY;

-- Helper policies generator
DO $$
DECLARE
  t text;
  tbls text[] := ARRAY[
    'weekly_reports',
    'report_progress_items',
    'report_student_issues',
    'teacher_journal_records',
    'report_social_media',
    'kas_transaksi'
  ];
BEGIN
  FOREACH t IN ARRAY tbls LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_read ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY %I_read ON public.%I FOR SELECT TO authenticated USING (public.is_staff());', t, t);

    EXECUTE format('DROP POLICY IF EXISTS %I_write ON public.%I;', t, t);
    EXECUTE format('CREATE POLICY %I_write ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());', t, t);
  END LOOP;
END $$;

-- Teacher Journal Activities Master Read
DROP POLICY IF EXISTS teacher_journal_activities_read ON public.teacher_journal_activities;
CREATE POLICY teacher_journal_activities_read ON public.teacher_journal_activities
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS teacher_journal_activities_write ON public.teacher_journal_activities;
CREATE POLICY teacher_journal_activities_write ON public.teacher_journal_activities
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
