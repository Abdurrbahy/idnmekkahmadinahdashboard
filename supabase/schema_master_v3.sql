-- ============================================================================
-- IDN DASHBOARD (MEKKAH & MADINAH) — MASTER SCHEMA V3 (STRICT RBAC & TIMEZONE)
-- ============================================================================
-- File: schema_master_v3.sql
-- Keterangan: Dijalankan di Supabase SQL Editor pada project baru / pembaruan.
-- Idempoten & aman dijalankan ulang.
-- ============================================================================

-- Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Helper Fungsi Tanggal Hari Ini (Waktu Mekkah & Madinah: Asia/Riyadh, UTC+3)
CREATE OR REPLACE FUNCTION public.app_today()
RETURNS date LANGUAGE sql STABLE AS $$
  SELECT (now() AT TIME ZONE 'Asia/Riyadh')::date;
$$;

-- ============================================================================
-- 1. PROFILES & USER RBAC
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       text NOT NULL,
  nama        text NOT NULL,
  role        text NOT NULL DEFAULT 'walsan' CHECK (role IN ('admin', 'atasan', 'walsan')),
  is_active   boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Helper Fungsi Otorisasi (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid() AND is_active = true), false);
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE((SELECT role IN ('admin', 'atasan') FROM public.profiles WHERE id = auth.uid() AND is_active = true), false);
$$;

-- Trigger: Otomatis Buat Profil saat User Mendaftar di Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nama, role, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'walsan',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 2. MASTER SANTRI & PARENT ASSIGNMENT
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.students (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama          text NOT NULL UNIQUE,
  nis           text,
  kelas         text NOT NULL DEFAULT '12',
  status        text NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif', 'alumni')),
  foto_url      text,
  catatan       text,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Seed 4 Santri Resmi
INSERT INTO public.students (nama, kelas, status) VALUES
  ('Ahmad Faaiz Al Ghufron',  '12', 'aktif'),
  ('Sultan Islamy Al Hakim',  '12', 'aktif'),
  ('Ezra Pa Prajna El Azmy',  '11', 'aktif'),
  ('Faiz Aslam',              '11', 'aktif')
ON CONFLICT (nama) DO NOTHING;

-- Tabel Relasi Wali Santri -> Santri
CREATE TABLE IF NOT EXISTS public.parent_students (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  student_id  bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  hubungan    text NOT NULL DEFAULT 'wali' CHECK (hubungan IN ('ayah', 'ibu', 'wali')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT parent_student_unique UNIQUE (profile_id, student_id)
);

-- Helper Fungsi Akses Santri
CREATE OR REPLACE FUNCTION public.can_view_student(p_student_id bigint)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT (
    public.is_staff()
    OR EXISTS (
      SELECT 1 FROM public.parent_students ps
      JOIN public.profiles p ON p.id = ps.profile_id
      WHERE ps.student_id = p_student_id
        AND ps.profile_id = auth.uid()
        AND p.is_active = true
    )
  );
$$;

-- ============================================================================
-- 3. MASTER AL-QUR'AN (114 SURAH LENGKAP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.surahs (
  nomor          int PRIMARY KEY,
  nama_latin     text NOT NULL,
  nama_arab      text,
  jumlah_ayat    int NOT NULL,
  tempat_turun   text CHECK (tempat_turun IN ('Mekkah', 'Madinah')),
  offset_ayat    int NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.surahs (nomor, nama_latin, nama_arab, jumlah_ayat, tempat_turun, offset_ayat) VALUES
  (1, 'Al-Fatihah', 'الفاتحة', 7, 'Mekkah', 0),
  (2, 'Al-Baqarah', 'البقرة', 286, 'Madinah', 7),
  (3, 'Ali ''Imran', 'آل عمران', 200, 'Madinah', 293),
  (4, 'An-Nisa''', 'النساء', 176, 'Madinah', 493),
  (5, 'Al-Ma''idah', 'المائدة', 120, 'Madinah', 669),
  (6, 'Al-An''am', 'الأنعام', 165, 'Mekkah', 789),
  (7, 'Al-A''raf', 'الأعراف', 206, 'Mekkah', 954),
  (8, 'Al-Anfal', 'الأنفal', 75, 'Madinah', 1160),
  (9, 'At-Taubah', 'التوبة', 129, 'Madinah', 1235),
  (10, 'Yunus', 'يونس', 109, 'Mekkah', 1364),
  (11, 'Hud', 'هود', 123, 'Mekkah', 1473),
  (12, 'Yusuf', 'يوسف', 111, 'Mekkah', 1596),
  (13, 'Ar-Ra''d', 'الرعد', 43, 'Madinah', 1707),
  (14, 'Ibrahim', 'إبراهيم', 52, 'Mekkah', 1750),
  (15, 'Al-Hijr', 'الحجر', 99, 'Mekkah', 1802),
  (16, 'An-Nahl', 'النحل', 128, 'Mekkah', 1901),
  (17, 'Al-Isra''', 'الإسراء', 111, 'Mekkah', 2029),
  (18, 'Al-Kahf', 'الكهف', 110, 'Mekkah', 2140),
  (19, 'Maryam', 'مريم', 98, 'Mekkah', 2250),
  (20, 'Taha', 'طه', 135, 'Mekkah', 2348),
  (21, 'Al-Anbiya''', 'الأنبياء', 112, 'Mekkah', 2483),
  (22, 'Al-Hajj', 'الحج', 78, 'Madinah', 2595),
  (23, 'Al-Mu''minun', 'المؤمنون', 118, 'Mekkah', 2673),
  (24, 'An-Nur', 'النور', 64, 'Madinah', 2791),
  (25, 'Al-Furqan', 'الفرقان', 77, 'Mekkah', 2855),
  (26, 'Asy-Syu''ara''', 'الشعراء', 227, 'Mekkah', 2932),
  (27, 'An-Naml', 'النمل', 93, 'Mekkah', 3159),
  (28, 'Al-Qasas', 'القصص', 88, 'Mekkah', 3252),
  (29, 'Al-''Ankabut', 'العنكبوت', 69, 'Mekkah', 3340),
  (30, 'Ar-Rum', 'الروم', 60, 'Mekkah', 3409),
  (31, 'Luqman', 'لقمان', 34, 'Mekkah', 3469),
  (32, 'As-Sajdah', 'السجدة', 30, 'Mekkah', 3503),
  (33, 'Al-Ahzab', 'الأحزاب', 73, 'Madinah', 3533),
  (34, 'Saba''', 'سبإ', 54, 'Mekkah', 3606),
  (35, 'Fatir', 'فاطر', 45, 'Mekkah', 3660),
  (36, 'Ya-Sin', 'يس', 83, 'Mekkah', 3705),
  (37, 'As-Saffat', 'الصافات', 182, 'Mekkah', 3788),
  (38, 'Sad', 'ص', 88, 'Mekkah', 3970),
  (39, 'Az-Zumar', 'الزمر', 75, 'Mekkah', 4058),
  (40, 'Ghafir', 'غافر', 85, 'Mekkah', 4133),
  (41, 'Fussilat', 'فصلت', 54, 'Mekkah', 4218),
  (42, 'Asy-Syura', 'الشورى', 53, 'Mekkah', 4272),
  (43, 'Az-Zukhruf', 'الزخرف', 89, 'Mekkah', 4325),
  (44, 'Ad-Dukhan', 'الدخان', 59, 'Mekkah', 4414),
  (45, 'Al-Jatsiyah', 'الجاثية', 37, 'Mekkah', 4473),
  (46, 'Al-Ahqaf', 'الأحقاف', 35, 'Mekkah', 4510),
  (47, 'Muhammad', 'محمد', 38, 'Madinah', 4545),
  (48, 'Al-Fath', 'الفتح', 29, 'Madinah', 4583),
  (49, 'Al-Hujurat', 'الحجرات', 18, 'Madinah', 4612),
  (50, 'Qaf', 'ق', 45, 'Mekkah', 4630),
  (51, 'Az-Zariyat', 'الذاريات', 60, 'Mekkah', 4675),
  (52, 'At-Tur', 'الطور', 49, 'Mekkah', 4735),
  (53, 'An-Najm', 'النجم', 62, 'Mekkah', 4784),
  (54, 'Al-Qamar', 'القمر', 55, 'Mekkah', 4846),
  (55, 'Ar-Rahman', 'الرحمن', 78, 'Madinah', 4901),
  (56, 'Al-Waqi''ah', 'الواقعة', 96, 'Mekkah', 4979),
  (57, 'Al-Hadid', 'الحديد', 29, 'Madinah', 5075),
  (58, 'Al-Mujadilah', 'المجادلة', 22, 'Madinah', 5104),
  (59, 'Al-Hasyr', 'الحشر', 24, 'Madinah', 5126),
  (60, 'Al-Mumtahanah', 'الممتحنة', 13, 'Madinah', 5150),
  (61, 'As-Saff', 'الصف', 14, 'Madinah', 5163),
  (62, 'Al-Jumu''ah', 'الجمعة', 11, 'Madinah', 5177),
  (63, 'Al-Munafiqun', 'المنافقون', 11, 'Madinah', 5188),
  (64, 'At-Taghabun', 'التغابن', 18, 'Madinah', 5199),
  (65, 'At-Talaq', 'الطلاق', 12, 'Madinah', 5217),
  (66, 'At-Tahrim', 'التحريم', 12, 'Madinah', 5229),
  (67, 'Al-Mulk', 'الملك', 30, 'Mekkah', 5241),
  (68, 'Al-Qalam', 'القلم', 52, 'Mekkah', 5271),
  (69, 'Al-Haqqah', 'الحاقة', 52, 'Mekkah', 5323),
  (70, 'Al-Ma''arij', 'المعارج', 44, 'Mekkah', 5375),
  (71, 'Nuh', 'نوح', 28, 'Mekkah', 5419),
  (72, 'Al-Jinn', 'الجن', 28, 'Mekkah', 5447),
  (73, 'Al-Muzzammil', 'المزمل', 20, 'Mekkah', 5475),
  (74, 'Al-Muddassir', 'المدثر', 56, 'Mekkah', 5495),
  (75, 'Al-Qiyamah', 'القيامة', 40, 'Mekkah', 5551),
  (76, 'Al-Insan', 'الإنسان', 31, 'Madinah', 5591),
  (77, 'Al-Mursalat', 'المرسلات', 50, 'Mekkah', 5622),
  (78, 'An-Naba''', 'النبإ', 40, 'Mekkah', 5672),
  (79, 'An-Nazi''at', 'النازعات', 46, 'Mekkah', 5712),
  (80, '''Abasa', 'عبس', 42, 'Mekkah', 5758),
  (81, 'At-Takwir', 'التكوير', 29, 'Mekkah', 5800),
  (82, 'Al-Infitar', 'الانفطار', 19, 'Mekkah', 5829),
  (83, 'Al-Muthaffifin', 'المطففين', 36, 'Mekkah', 5848),
  (84, 'Al-Insyiqaq', 'الانشقاق', 25, 'Mekkah', 5884),
  (85, 'Al-Buruj', 'البروج', 22, 'Mekkah', 5909),
  (86, 'At-Tariq', 'الطارق', 17, 'Mekkah', 5931),
  (87, 'Al-A''la', 'الأعلى', 19, 'Mekkah', 5948),
  (88, 'Al-Ghasyiyah', 'الغاشية', 26, 'Mekkah', 5967),
  (89, 'Al-Fajr', 'الفجر', 30, 'Mekkah', 5993),
  (90, 'Al-Balad', 'البلد', 20, 'Mekkah', 6023),
  (91, 'Asy-Syams', 'الشمس', 15, 'Mekkah', 6043),
  (92, 'Al-Lail', 'الليل', 21, 'Mekkah', 6058),
  (93, 'Ad-Duha', 'الضحى', 11, 'Mekkah', 6079),
  (94, 'Asy-Syarh', 'الشرح', 8, 'Mekkah', 6090),
  (95, 'At-Tin', 'التين', 8, 'Mekkah', 6098),
  (96, 'Al-''Alaq', 'العلق', 19, 'Mekkah', 6106),
  (97, 'Al-Qadr', 'القدر', 5, 'Mekkah', 6125),
  (98, 'Al-Bayyinah', 'البينة', 8, 'Madinah', 6130),
  (99, 'Az-Zalzalah', 'الزلزلة', 8, 'Madinah', 6138),
  (100, 'Al-''Adiyat', 'العاديات', 11, 'Mekkah', 6146),
  (101, 'Al-Qari''ah', 'القارعة', 11, 'Mekkah', 6157),
  (102, 'At-Takatsur', 'التكاثر', 8, 'Mekkah', 6168),
  (103, 'Al-''Asr', 'العصر', 3, 'Mekkah', 6176),
  (104, 'Al-Humazah', 'الهمزة', 9, 'Mekkah', 6179),
  (105, 'Al-Fil', 'الفيل', 5, 'Mekkah', 6188),
  (106, 'Quraisy', 'قريش', 4, 'Mekkah', 6193),
  (107, 'Al-Ma''un', 'الماعون', 7, 'Mekkah', 6197),
  (108, 'Al-Kautsar', 'الكوثر', 3, 'Mekkah', 6204),
  (109, 'Al-Kafirun', 'الكافرون', 6, 'Mekkah', 6207),
  (110, 'An-Nasr', 'النصر', 3, 'Madinah', 6213),
  (111, 'Al-Lahab', 'المسد', 5, 'Mekkah', 6216),
  (112, 'Al-Ikhlas', 'الإخلاص', 4, 'Mekkah', 6221),
  (113, 'Al-Falaq', 'الفلق', 5, 'Mekkah', 6225),
  (114, 'An-Nas', 'الناس', 6, 'Mekkah', 6230)
ON CONFLICT (nomor) DO UPDATE SET
  nama_latin = EXCLUDED.nama_latin,
  jumlah_ayat = EXCLUDED.jumlah_ayat,
  offset_ayat = EXCLUDED.offset_ayat;

-- ============================================================================
-- 4. MASTER MATA PELAJARAN (DENGAN JENIS SETORAN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode           text NOT NULL UNIQUE,
  nama           text NOT NULL,
  kategori       text NOT NULL DEFAULT 'quran' CHECK (kategori IN ('quran', 'bahasa_arab', 'mutun', 'akademik')),
  jenis_setoran  text NOT NULL DEFAULT 'ziyadah' CHECK (jenis_setoran IN ('ziyadah', 'murajaah', 'mutun', 'mufradat', 'bahasa_arab')),
  urutan         smallint NOT NULL DEFAULT 0,
  aktif          boolean NOT NULL DEFAULT true,
  created_at     timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.subjects (kode, nama, kategori, jenis_setoran, urutan) VALUES
  ('TAHFIDZ',     'Tahfidz Al-Qur''an',     'quran',        'ziyadah',     1),
  ('ZIYADAH',     'Ziyadah (Hafalan Baru)', 'quran',        'ziyadah',     2),
  ('MURAJAAH',    'Murajaah (Ulangan)',     'quran',        'murajaah',    3),
  ('MUTUN',       'Hafalan Matan Kitab',    'mutun',        'mutun',       4),
  ('MUFRADAT',    'Setoran Mufradat',       'bahasa_arab',  'mufradat',    5),
  ('NAHWU',       'Nahwu',                  'bahasa_arab',  'bahasa_arab', 10),
  ('SHARAF',      'Sharaf',                 'bahasa_arab',  'bahasa_arab', 11),
  ('HIWAR',       'Hiwar (Percakapan)',     'bahasa_arab',  'bahasa_arab', 12),
  ('INSYA',       'Insya'' (Mengarang)',    'bahasa_arab',  'bahasa_arab', 13),
  ('BALAGHAH',    'Balaghah',               'bahasa_arab',  'bahasa_arab', 14),
  ('IMLAK',       'Imlak (Dikte)',          'bahasa_arab',  'bahasa_arab', 15),
  ('MUHADATSAH',  'Muhadatsah',             'bahasa_arab',  'bahasa_arab', 16)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  kategori = EXCLUDED.kategori,
  jenis_setoran = EXCLUDED.jenis_setoran;

-- ============================================================================
-- 5. PRESENSI / KEHADIRAN (4 SESI RESMI)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nama        text NOT NULL UNIQUE,
  urutan      smallint NOT NULL DEFAULT 0,
  aktif       boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.attendance_sessions (nama, urutan, aktif) VALUES
  ('Persiapan Tahfidz', 1, true),
  ('Setoran Mufrodat',  2, true),
  ('KBM Pagi',          3, true),
  ('Halaqah di Nabawi', 4, true)
ON CONFLICT (nama) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id  bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  session_id  bigint NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  tanggal     date NOT NULL DEFAULT public.app_today(),
  status      text NOT NULL DEFAULT 'hadir' CHECK (status IN ('hadir', 'izin', 'sakit', 'alpa')),
  catatan     text,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT attendance_unique_entry UNIQUE (student_id, session_id, tanggal)
);

-- ============================================================================
-- 6. SETORAN TAHFIDZ & HAFALAN (SUBMISSIONS + DETAILS + TRIGGERS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id  bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id  bigint NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
  tanggal     date NOT NULL DEFAULT public.app_today(),
  jenis       text NOT NULL DEFAULT 'ziyadah' CHECK (jenis IN ('ziyadah', 'murajaah', 'mutun', 'mufradat', 'bahasa_arab')),
  capaian     int NOT NULL DEFAULT 0,
  satuan      text NOT NULL DEFAULT 'ayat',
  status      text NOT NULL DEFAULT 'lancar' CHECK (status IN ('lancar', 'kurang_lancar', 'mengulang')),
  nilai       numeric CHECK (nilai IS NULL OR (nilai >= 0 AND nilai <= 100)),
  catatan     text,
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger: Otomatis Isi Submissions.jenis dari Subject
CREATE OR REPLACE FUNCTION public.sync_submission_jenis()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  SELECT jenis_setoran INTO NEW.jenis FROM public.subjects WHERE id = NEW.subject_id;
  IF NEW.jenis IS NULL THEN NEW.jenis := 'ziyadah'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_submission_jenis ON public.submissions;
CREATE TRIGGER trg_sync_submission_jenis
  BEFORE INSERT OR UPDATE OF subject_id ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_submission_jenis();

CREATE TABLE IF NOT EXISTS public.quran_submission_details (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  submission_id  bigint NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  surah_awal     int NOT NULL REFERENCES public.surahs(nomor),
  ayat_awal      int NOT NULL DEFAULT 1,
  surah_akhir    int NOT NULL REFERENCES public.surahs(nomor),
  ayat_akhir     int NOT NULL DEFAULT 1,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Trigger: Validasi Rentang Ayat (BEFORE INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.validate_quran_range()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_max_awal  int;
  v_max_akhir int;
  v_off_awal  int;
  v_off_akhir int;
BEGIN
  SELECT jumlah_ayat, offset_ayat INTO v_max_awal, v_off_awal FROM public.surahs WHERE nomor = NEW.surah_awal;
  SELECT jumlah_ayat, offset_ayat INTO v_max_akhir, v_off_akhir FROM public.surahs WHERE nomor = NEW.surah_akhir;

  IF NEW.ayat_awal < 1 OR NEW.ayat_awal > v_max_awal THEN
    RAISE EXCEPTION 'Ayat awal (%) tidak valid untuk Surah nomor % (maksimal % ayat)', NEW.ayat_awal, NEW.surah_awal, v_max_awal;
  END IF;

  IF NEW.ayat_akhir < 1 OR NEW.ayat_akhir > v_max_akhir THEN
    RAISE EXCEPTION 'Ayat akhir (%) tidak valid untuk Surah nomor % (maksimal % ayat)', NEW.ayat_akhir, NEW.surah_akhir, v_max_akhir;
  END IF;

  IF (v_off_akhir + NEW.ayat_akhir) < (v_off_awal + NEW.ayat_awal) THEN
    RAISE EXCEPTION 'Rentang ayat terbalik: Surah % ayat % mendahului Surah % ayat %', NEW.surah_akhir, NEW.ayat_akhir, NEW.surah_awal, NEW.ayat_awal;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_quran_range ON public.quran_submission_details;
CREATE TRIGGER trg_validate_quran_range
  BEFORE INSERT OR UPDATE ON public.quran_submission_details
  FOR EACH ROW EXECUTE FUNCTION public.validate_quran_range();

-- Trigger: Hitung Capaian Ayat Mutlak Lintas Surah (AFTER INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.sync_quran_submission_capaian()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  v_offset_awal  int := 0;
  v_offset_akhir int := 0;
  v_total_ayat   int;
BEGIN
  SELECT offset_ayat INTO v_offset_awal  FROM public.surahs WHERE nomor = NEW.surah_awal;
  SELECT offset_ayat INTO v_offset_akhir FROM public.surahs WHERE nomor = NEW.surah_akhir;

  v_total_ayat := (COALESCE(v_offset_akhir, 0) + NEW.ayat_akhir)
                - (COALESCE(v_offset_awal, 0) + NEW.ayat_awal) + 1;

  IF v_total_ayat < 1 THEN v_total_ayat := 1; END IF;

  UPDATE public.submissions
  SET capaian = v_total_ayat,
      satuan = 'ayat'
  WHERE id = NEW.submission_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_quran_capaian ON public.quran_submission_details;
CREATE TRIGGER trg_sync_quran_capaian
  AFTER INSERT OR UPDATE ON public.quran_submission_details
  FOR EACH ROW EXECUTE FUNCTION public.sync_quran_submission_capaian();

-- ============================================================================
-- 7. MUTABAAH YAUMIYAH (10 AMALAN DENGAN BOBOT)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.mutabaah_activities (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode          text NOT NULL UNIQUE,
  nama          text NOT NULL,
  tipe          text NOT NULL DEFAULT 'boolean' CHECK (tipe IN ('boolean', 'angka')),
  satuan        text,
  target_harian numeric,
  bobot         numeric NOT NULL DEFAULT 1,
  urutan        smallint NOT NULL DEFAULT 0,
  aktif         boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.mutabaah_activities (kode, nama, tipe, satuan, target_harian, bobot, urutan) VALUES
  ('shalat_5_waktu',  'Shalat 5 Waktu di Masjid', 'angka',   'waktu',    5,    1, 1),
  ('tahajjud',        'Tahajjud',                 'boolean', NULL,       1,    1, 2),
  ('qabliyah_subuh',  'Qabliyah Subuh',           'boolean', NULL,       1,    1, 3),
  ('dzikir_pagi',     'Dzikir Pagi',              'boolean', NULL,       1,    1, 4),
  ('dhuha',           'Dhuha',                    'boolean', NULL,       1,    1, 5),
  ('tilawah',         'Tilawah',                  'angka',   'halaman',  1,    1, 6),
  ('puasa_sunnah',    'Puasa Sunnah',             'boolean', NULL,       NULL, 1, 7),
  ('dzikir_petang',   'Dzikir Petang',            'boolean', NULL,       1,    1, 8),
  ('mufrodat',        'Setoran Mufradat',         'angka',   'kata',     5,    1, 9),
  ('baca_buku',       'Baca Buku/Kitab',          'angka',   'halaman',  5,    1, 10)
ON CONFLICT (kode) DO UPDATE SET
  nama = EXCLUDED.nama,
  target_harian = EXCLUDED.target_harian,
  bobot = EXCLUDED.bobot;

CREATE TABLE IF NOT EXISTS public.mutabaah_records (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id   bigint NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  activity_id  bigint NOT NULL REFERENCES public.mutabaah_activities(id) ON DELETE CASCADE,
  tanggal      date NOT NULL DEFAULT public.app_today(),
  status       text NOT NULL DEFAULT 'done' CHECK (status IN ('done', 'not_done')),
  jumlah       numeric,
  catatan      text,
  created_by   uuid REFERENCES auth.users(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT mutabaah_unique_entry UNIQUE (student_id, activity_id, tanggal)
);

-- ============================================================================
-- 8. KEGIATAN & DOKUMENTASI FOTO
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.activity_types (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kode       text NOT NULL UNIQUE,
  nama       text NOT NULL,
  jenis      text NOT NULL DEFAULT 'harian' CHECK (jenis IN ('harian', 'pekanan')),
  urutan     smallint NOT NULL DEFAULT 0,
  aktif      boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.activity_types (kode, nama, jenis, urutan) VALUES
  ('tahajjud',         'Tahajjud',                       'harian',  1),
  ('shalat_fardhu',    'Shalat Fardhu',                  'harian',  2),
  ('halaqah_quran',    'Halaqah Quran',                  'harian',  3),
  ('setoran_mufrodat', 'Setoran Mufrodat',               'harian',  4),
  ('makan_masak',      'Makan/Masak',                    'harian',  5),
  ('kbm_pagi',         'KBM Pagi',                       'harian',  6),
  ('kegiatan_lainnya', 'Kegiatan Lainnya',               'harian',  7),
  ('idn_hebat',        'IDN Hebat',                      'pekanan', 1),
  ('public_speaking',  'Public Speaking',                'pekanan', 2),
  ('olahraga',         'Olahraga',                       'pekanan', 3),
  ('ekskul',           'Ekskul',                         'pekanan', 4),
  ('stadium_general',  'Stadium General',                'pekanan', 5),
  ('kegiatan_kalender','Kegiatan Kalender Akademik',     'pekanan', 6)
ON CONFLICT (kode) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.activities (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_type_id  bigint NOT NULL REFERENCES public.activity_types(id) ON DELETE RESTRICT,
  tanggal           date NOT NULL DEFAULT public.app_today(),
  judul             text,
  keterangan        text,
  jumlah_hadir      smallint,
  jumlah_total      smallint DEFAULT 4,
  penanggung_jawab  text,
  link_google_photo text,
  created_by        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activity_media (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  activity_id  bigint NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  url          text NOT NULL,
  jenis        text NOT NULL DEFAULT 'foto' CHECK (jenis IN ('foto', 'video')),
  keterangan   text,
  urutan       smallint NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================================
-- 9. AUDIT TRIGGERS (UPDATED_AT & CREATED_BY)
-- ============================================================================
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

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_touch_profiles ON public.profiles;
CREATE TRIGGER trg_touch_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_touch_students ON public.students;
CREATE TRIGGER trg_touch_students BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_touch_attendance_logs ON public.attendance_logs;
CREATE TRIGGER trg_touch_attendance_logs BEFORE UPDATE ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_touch_submissions ON public.submissions;
CREATE TRIGGER trg_touch_submissions BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_touch_mutabaah_records ON public.mutabaah_records;
CREATE TRIGGER trg_touch_mutabaah_records BEFORE UPDATE ON public.mutabaah_records FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_touch_activities ON public.activities;
CREATE TRIGGER trg_touch_activities BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger created_by
DROP TRIGGER IF EXISTS trg_creator_students ON public.students;
CREATE TRIGGER trg_creator_students BEFORE INSERT ON public.students FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS trg_creator_attendance_logs ON public.attendance_logs;
CREATE TRIGGER trg_creator_attendance_logs BEFORE INSERT ON public.attendance_logs FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS trg_creator_submissions ON public.submissions;
CREATE TRIGGER trg_creator_submissions BEFORE INSERT ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS trg_creator_mutabaah_records ON public.mutabaah_records;
CREATE TRIGGER trg_creator_mutabaah_records BEFORE INSERT ON public.mutabaah_records FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

DROP TRIGGER IF EXISTS trg_creator_activities ON public.activities;
CREATE TRIGGER trg_creator_activities BEFORE INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.handle_created_by();

-- ============================================================================
-- 10. STORAGE BUCKET
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('dokumentasi', 'dokumentasi', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Dokumentasi" ON storage.objects;
CREATE POLICY "Public Read Dokumentasi" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'dokumentasi' AND public.auth_role() IS NOT NULL);

DROP POLICY IF EXISTS "Admin Upload Dokumentasi" ON storage.objects;
CREATE POLICY "Admin Upload Dokumentasi" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dokumentasi' AND public.is_admin());

DROP POLICY IF EXISTS "Admin Delete Dokumentasi" ON storage.objects;
CREATE POLICY "Admin Delete Dokumentasi" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'dokumentasi' AND public.is_admin());

-- ============================================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES — STRICT V3
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surahs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quran_submission_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutabaah_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mutabaah_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_media ENABLE ROW LEVEL SECURITY;

-- 1. SURAHS: Terbuka untuk semua (termasuk anon sebelum login)
DROP POLICY IF EXISTS "surahs_public_read" ON public.surahs;
CREATE POLICY "surahs_public_read" ON public.surahs FOR SELECT USING (true);

-- 2. PROFILES
DROP POLICY IF EXISTS "profiles_read" ON public.profiles;
CREATE POLICY "profiles_read" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_staff() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
    AND is_active = (SELECT is_active FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 3. STUDENTS & PARENT_STUDENTS
DROP POLICY IF EXISTS "students_read" ON public.students;
CREATE POLICY "students_read" ON public.students FOR SELECT TO authenticated
  USING (public.can_view_student(id));

DROP POLICY IF EXISTS "students_admin_write" ON public.students;
CREATE POLICY "students_admin_write" ON public.students FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "parent_students_read" ON public.parent_students;
CREATE POLICY "parent_students_read" ON public.parent_students FOR SELECT TO authenticated
  USING (public.is_staff() OR profile_id = auth.uid());

DROP POLICY IF EXISTS "parent_students_admin_write" ON public.parent_students;
CREATE POLICY "parent_students_admin_write" ON public.parent_students FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. MASTER DATA (SUBJECTS, ATTENDANCE_SESSIONS, MUTABAAH_ACTIVITIES, ACTIVITY_TYPES)
DROP POLICY IF EXISTS "master_read_subjects" ON public.subjects;
CREATE POLICY "master_read_subjects" ON public.subjects FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);
DROP POLICY IF EXISTS "master_admin_subjects" ON public.subjects;
CREATE POLICY "master_admin_subjects" ON public.subjects FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "master_read_sessions" ON public.attendance_sessions;
CREATE POLICY "master_read_sessions" ON public.attendance_sessions FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);
DROP POLICY IF EXISTS "master_admin_sessions" ON public.attendance_sessions;
CREATE POLICY "master_admin_sessions" ON public.attendance_sessions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "master_read_mutabaah" ON public.mutabaah_activities;
CREATE POLICY "master_read_mutabaah" ON public.mutabaah_activities FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);
DROP POLICY IF EXISTS "master_admin_mutabaah" ON public.mutabaah_activities;
CREATE POLICY "master_admin_mutabaah" ON public.mutabaah_activities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "master_read_act_types" ON public.activity_types;
CREATE POLICY "master_read_act_types" ON public.activity_types FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);
DROP POLICY IF EXISTS "master_admin_act_types" ON public.activity_types;
CREATE POLICY "master_admin_act_types" ON public.activity_types FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. ATTENDANCE_LOGS
DROP POLICY IF EXISTS "attendance_read" ON public.attendance_logs;
CREATE POLICY "attendance_read" ON public.attendance_logs FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));

DROP POLICY IF EXISTS "attendance_admin_write" ON public.attendance_logs;
CREATE POLICY "attendance_admin_write" ON public.attendance_logs FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. SUBMISSIONS & DETAILS
DROP POLICY IF EXISTS "submissions_read" ON public.submissions;
CREATE POLICY "submissions_read" ON public.submissions FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));

DROP POLICY IF EXISTS "submissions_admin_write" ON public.submissions;
CREATE POLICY "submissions_admin_write" ON public.submissions FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "quran_details_read" ON public.quran_submission_details;
CREATE POLICY "quran_details_read" ON public.quran_submission_details FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.submissions s
    WHERE s.id = quran_submission_details.submission_id
      AND public.can_view_student(s.student_id)
  ));

DROP POLICY IF EXISTS "quran_details_admin_write" ON public.quran_submission_details;
CREATE POLICY "quran_details_admin_write" ON public.quran_submission_details FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. MUTABAAH_RECORDS
DROP POLICY IF EXISTS "mutabaah_read" ON public.mutabaah_records;
CREATE POLICY "mutabaah_read" ON public.mutabaah_records FOR SELECT TO authenticated
  USING (public.can_view_student(student_id));

DROP POLICY IF EXISTS "mutabaah_admin_write" ON public.mutabaah_records;
CREATE POLICY "mutabaah_admin_write" ON public.mutabaah_records FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. ACTIVITIES & MEDIA
DROP POLICY IF EXISTS "activities_read" ON public.activities;
CREATE POLICY "activities_read" ON public.activities FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);

DROP POLICY IF EXISTS "activities_admin_write" ON public.activities;
CREATE POLICY "activities_admin_write" ON public.activities FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "activity_media_read" ON public.activity_media;
CREATE POLICY "activity_media_read" ON public.activity_media FOR SELECT TO authenticated
  USING (public.auth_role() IS NOT NULL);

DROP POLICY IF EXISTS "activity_media_admin_write" ON public.activity_media;
CREATE POLICY "activity_media_admin_write" ON public.activity_media FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Hak akses database
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.surahs TO anon;

-- Segarkan Schema Cache
NOTIFY pgrst, 'reload schema';
