-- ============================================================================
-- MIGRATION V3.5 — Mode Input Kuis untuk Nahwu & Mapel Sejenis
-- ============================================================================

-- A1. Kolom mode_input pada tabel subjects
ALTER TABLE public.subjects
  ADD COLUMN IF NOT EXISTS mode_input text NOT NULL DEFAULT 'jumlah'
  CHECK (mode_input IN ('quran', 'kuis', 'jumlah'));

-- Tetapkan nilai awal mode_input
UPDATE public.subjects SET mode_input = CASE
  WHEN kode IN ('TAHFIDZ', 'ZIYADAH', 'MURAJAAH') THEN 'quran'
  WHEN kode IN ('NAHWU') THEN 'kuis'
  ELSE 'jumlah'
END;

-- A2. Master kitab & bab
CREATE TABLE IF NOT EXISTS public.kitab_bab (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  subject_id  bigint NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  kitab       text NOT NULL,
  jilid       text,
  nomor_bab   int NOT NULL,
  judul_bab   text NOT NULL,
  halaman     int,
  urutan      int NOT NULL DEFAULT 0,
  aktif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kitab_bab_unique UNIQUE (subject_id, kitab, jilid, nomor_bab)
);

ALTER TABLE public.kitab_bab ADD COLUMN IF NOT EXISTS halaman int;
CREATE INDEX IF NOT EXISTS idx_kitab_bab_subject ON public.kitab_bab (subject_id, urutan);

-- Seed: Bab Nahwu Wadhih Jilid 2 (Ibtidaiyyah) — 33 bab
-- Sumber fihris: shamela.ws/book/10018/3
INSERT INTO public.kitab_bab (subject_id, kitab, jilid, nomor_bab, judul_bab, halaman, urutan)
SELECT s.id, 'Nahwu Wadhih', '2', v.nomor, v.judul, v.hal, v.nomor
FROM public.subjects s
CROSS JOIN (VALUES
  (1,  'Pembagian Fi''il: Shahih Akhir & Mu''tal Akhir (تقسيم الفعل إلى صحيح الآخر ومعتل الآخر)', 90),
  (2,  'Mabni dan Mu''rab (المبني والمعرب)', 94),
  (3,  'Macam-macam Bina'' (أنواع البناء)', 97),
  (4,  'Macam-macam I''rab (أنواع الإعراب)', 100),
  (5,  'Keadaan Mabni Fi''il Madhi (أحوال بناء الفعل الماضي)', 105),
  (6,  'Keadaan Mabni Fi''il Amr (أحوال بناء الأمر)', 109),
  (7,  'Keadaan Mabni Fi''il Mudhari'' (أحوال بناء المضارع)', 114),
  (8,  'I''rab Mahalli (الإعراب المحلي)', 120),
  (9,  'Fi''il Mudhari'' Mu''tal Akhir & I''rabnya (الفعل المضارع المعتل الآخر)', 123),
  (10, 'Isim Mu''tal Akhir: Maqshur & Manqush (الاسم المعتل الآخر: المقصور والمنقوص)', 128),
  (11, 'Nashb Mudhari'' setelah An Mudhmarah (نصب المضارع بعد أن المضمرة)', 135),
  (12, 'Jawazim Fi''il Mudhari'' (جوازم الفعل المضارع)', 146),
  (13, 'Al-Af''al Al-Khamsah & I''rabnya (الأفعال الخمسة)', 154),
  (14, 'Pembagian Isim: Mufrad, Mutsanna, Jama'' (تقسيم الاسم إلى مفرد ومثنى وجمع)', 159),
  (15, 'Pembagian Jama'' (تقسيم الجمع)', 162),
  (16, 'I''rab Mutsanna (إعراب المثنى)', 165),
  (17, 'I''rab Jama'' Mudzakkar Salim (إعراب جمع المذكر السالم)', 169),
  (18, 'I''rab Jama'' Muannats Salim (إعراب جمع المؤنث السالم)', 173),
  (19, 'Mudhaf dan Mudhaf Ilaih (المضاف والمضاف إليه)', 177),
  (20, 'Al-Asma'' Al-Khamsah & I''rabnya (الأسماء الخمسة)', 182),
  (21, 'Tanda Ta''nits pada Fi''il (علامات التأنيث في الأفعال)', 186),
  (22, 'Tanda Ta''nits pada Isim (علامات التأنيث في الأسماء)', 189),
  (23, 'Nakirah dan Ma''rifah (النكرة والمعرفة)', 192),
  (24, 'Isim ''Alam (العلم)', 194),
  (25, 'Ma''rifah dengan Alif Lam (المعرف بالألف واللام)', 197),
  (26, 'Dhamir: Munfashil, Muttashil, Mustatir (الضمير)', 200),
  (27, 'Isim Maushul (الاسم الموصول)', 215),
  (28, 'Isim Isyarah (اسم الإشارة)', 220),
  (29, 'Naib Fa''il (نائب الفاعل)', 224),
  (30, 'Af''al Al-Istimrar An-Nasikhah & Ma Dama (أفعال الاستمرار الناسخة وما دام)', 228),
  (31, 'Maf''ul Muthlaq (المفعول المطلق)', 233),
  (32, 'Maf''ul Li Ajlih (المفعول لأجله)', 238),
  (33, 'Zharf Zaman dan Zharf Makan (ظرف الزمان وظرف المكان)', 243)
) AS v(nomor, judul, hal)
WHERE s.kode = 'NAHWU'
ON CONFLICT (subject_id, kitab, jilid, nomor_bab) DO UPDATE SET
  judul_bab = EXCLUDED.judul_bab,
  halaman   = EXCLUDED.halaman,
  urutan    = EXCLUDED.urutan;

-- A3. Detail kuis
CREATE TABLE IF NOT EXISTS public.quiz_submission_details (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id  bigint NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  kitab_bab_id   bigint REFERENCES public.kitab_bab(id) ON DELETE SET NULL,
  kitab_manual   text,        -- bila bab belum terdaftar di master
  soal_benar     int NOT NULL DEFAULT 0,
  soal_total     int NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT quiz_soal_valid CHECK (soal_total > 0 AND soal_benar >= 0 AND soal_benar <= soal_total)
);

CREATE INDEX IF NOT EXISTS idx_quiz_detail_submission ON public.quiz_submission_details (submission_id);

-- A4. Trigger hitung capaian & nilai
CREATE OR REPLACE FUNCTION public.sync_quiz_submission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE public.submissions
  SET capaian = NEW.soal_benar,
      satuan  = 'soal',
      nilai   = ROUND(NEW.soal_benar::numeric / NEW.soal_total * 100, 1)
  WHERE id = NEW.submission_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quiz ON public.quiz_submission_details;
CREATE TRIGGER trg_sync_quiz
  AFTER INSERT OR UPDATE ON public.quiz_submission_details
  FOR EACH ROW EXECUTE FUNCTION public.sync_quiz_submission();

-- A5. Row Level Security (RLS)
ALTER TABLE public.kitab_bab ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_submission_details ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "kitab_bab_read" ON public.kitab_bab;
CREATE POLICY "kitab_bab_read" ON public.kitab_bab FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "kitab_bab_admin_write" ON public.kitab_bab;
CREATE POLICY "kitab_bab_admin_write" ON public.kitab_bab FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "quiz_details_read" ON public.quiz_submission_details;
CREATE POLICY "quiz_details_read" ON public.quiz_submission_details FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = quiz_submission_details.submission_id
      AND public.can_view_student(s.student_id)
  ));

DROP POLICY IF EXISTS "quiz_details_admin_write" ON public.quiz_submission_details;
CREATE POLICY "quiz_details_admin_write" ON public.quiz_submission_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- D2. View Rekap Pekanan Kuis (v_weekly_kuis)
CREATE OR REPLACE VIEW public.v_weekly_kuis AS
SELECT
  public.pekan_mulai(s.tanggal) AS pekan_mulai,
  (public.pekan_mulai(s.tanggal) + 6)::date AS pekan_selesai,
  s.student_id,
  sub.nama AS mapel,
  COUNT(*) AS jumlah_kuis,
  SUM(q.soal_benar) AS total_benar,
  SUM(q.soal_total) AS total_soal,
  ROUND(AVG(s.nilai), 1) AS rata_nilai,
  MAX(COALESCE(kb.judul_bab, q.kitab_manual, '')) AS bab_terakhir
FROM public.submissions s
JOIN public.quiz_submission_details q ON q.submission_id = s.id
JOIN public.subjects sub ON sub.id = s.subject_id
LEFT JOIN public.kitab_bab kb ON kb.id = q.kitab_bab_id
GROUP BY public.pekan_mulai(s.tanggal), (public.pekan_mulai(s.tanggal) + 6)::date, s.student_id, sub.nama;

ALTER VIEW public.v_weekly_kuis SET (security_invoker = true);
GRANT SELECT ON public.v_weekly_kuis TO authenticated;
