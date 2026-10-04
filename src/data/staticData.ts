import type { Student, Surah, Subject, KitabBab, AttendanceSession, MutabaahActivity, ActivityType } from '@/types/database'

export const DEFAULT_STUDENTS: Student[] = [
  { id: 1, nama: 'Ahmad Faaiz Al Ghufron', kelas: '12', status: 'aktif', catatan: 'Kelas 12 - Program Mekkah & Madinah' },
  { id: 2, nama: 'Sultan Islamy Al Hakim', kelas: '12', status: 'aktif', catatan: 'Kelas 12 - Program Mekkah & Madinah' },
  { id: 3, nama: 'Ezra Pa Prajna El Azmy', kelas: '11', status: 'aktif', catatan: 'Kelas 11 - Program Mekkah & Madinah' },
  { id: 4, nama: 'Faiz Aslam', kelas: '11', status: 'aktif', catatan: 'Kelas 11 - Program Mekkah & Madinah' },
]

export const DEFAULT_ATTENDANCE_SESSIONS: AttendanceSession[] = [
  { id: 1, nama: 'Persiapan Tahfidz', urutan: 1, aktif: true },
  { id: 2, nama: 'Setoran Mufrodat', urutan: 2, aktif: true },
  { id: 3, nama: 'KBM Pagi', urutan: 3, aktif: true },
  { id: 4, nama: 'Halaqah di Nabawi', urutan: 4, aktif: true },
]

export const DEFAULT_SUBJECTS: Subject[] = [
  { id: 1, kode: 'TAHFIDZ', nama: "Tahfidz Al-Qur'an", kategori: 'quran', jenis_setoran: 'ziyadah', mode_input: 'quran', urutan: 1, aktif: true },
  { id: 2, kode: 'ZIYADAH', nama: 'Ziyadah (Hafalan Baru)', kategori: 'quran', jenis_setoran: 'ziyadah', mode_input: 'quran', urutan: 2, aktif: true },
  { id: 3, kode: 'MURAJAAH', nama: 'Murajaah (Ulangan)', kategori: 'quran', jenis_setoran: 'murajaah', mode_input: 'quran', urutan: 3, aktif: true },
  { id: 4, kode: 'MUTUN', nama: 'Hafalan Matan Kitab', kategori: 'mutun', jenis_setoran: 'mutun', mode_input: 'jumlah', urutan: 4, aktif: true },
  { id: 5, kode: 'MUFRADAT', nama: 'Setoran Mufradat', kategori: 'bahasa_arab', jenis_setoran: 'mufradat', mode_input: 'jumlah', urutan: 5, aktif: true },
  { id: 6, kode: 'NAHWU', nama: 'Nahwu', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'kuis', urutan: 10, aktif: true },
  { id: 7, kode: 'SHARAF', nama: 'Sharaf', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 11, aktif: true },
  { id: 8, kode: 'HIWAR', nama: 'Hiwar (Percakapan)', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 12, aktif: true },
  { id: 9, kode: 'INSYA', nama: "Insya' (Mengarang)", kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 13, aktif: true },
  { id: 10, kode: 'BALAGHAH', nama: 'Balaghah', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 14, aktif: true },
  { id: 11, kode: 'IMLAK', nama: 'Imlak (Dikte)', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 15, aktif: true },
  { id: 12, kode: 'MUHADATSAH', nama: 'Muhadatsah', kategori: 'bahasa_arab', jenis_setoran: 'bahasa_arab', mode_input: 'jumlah', urutan: 16, aktif: true },
]

export const DEFAULT_KITAB_BAB: KitabBab[] = [
  { id: 1, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 1, judul_bab: 'Pembagian Fi\'il: Shahih Akhir & Mu\'tal Akhir (تقسيم الفعل إلى صحيح الآخر ومعتل الآخر)', halaman: 90, urutan: 1, aktif: true },
  { id: 2, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 2, judul_bab: 'Mabni dan Mu\'rab (المبني والمعرب)', halaman: 94, urutan: 2, aktif: true },
  { id: 3, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 3, judul_bab: 'Macam-macam Bina\' (أنواع البناء)', halaman: 97, urutan: 3, aktif: true },
  { id: 4, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 4, judul_bab: 'Macam-macam I\'rab (أنواع الإعراب)', halaman: 100, urutan: 4, aktif: true },
  { id: 5, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 5, judul_bab: 'Keadaan Mabni Fi\'il Madhi (أحوال بناء الفعل الماضي)', halaman: 105, urutan: 5, aktif: true },
  { id: 6, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 6, judul_bab: 'Keadaan Mabni Fi\'il Amr (أحوال بناء الأمر)', halaman: 109, urutan: 6, aktif: true },
  { id: 7, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 7, judul_bab: 'Keadaan Mabni Fi\'il Mudhari\' (أحوال بناء المضارع)', halaman: 114, urutan: 7, aktif: true },
  { id: 8, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 8, judul_bab: 'I\'rab Mahalli (الإعراب المحلي)', halaman: 120, urutan: 8, aktif: true },
  { id: 9, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 9, judul_bab: 'Fi\'il Mudhari\' Mu\'tal Akhir & I\'rabnya (الفعل المضارع المعتل الآخر)', halaman: 123, urutan: 9, aktif: true },
  { id: 10, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 10, judul_bab: 'Isim Mu\'tal Akhir: Maqshur & Manqush (الاسم المعتل الآخر: المقصور والمنقوص)', halaman: 128, urutan: 10, aktif: true },
  { id: 11, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 11, judul_bab: 'Nashb Mudhari\' setelah An Mudhmarah (نصب المضارع بعد أن المضمرة)', halaman: 135, urutan: 11, aktif: true },
  { id: 12, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 12, judul_bab: 'Jawazim Fi\'il Mudhari\' (جوازم الفعل المضارع)', halaman: 146, urutan: 12, aktif: true },
  { id: 13, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 13, judul_bab: 'Al-Af\'al Al-Khamsah & I\'rabnya (الأفعال الخمسة)', halaman: 154, urutan: 13, aktif: true },
  { id: 14, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 14, judul_bab: 'Pembagian Isim: Mufrad, Mutsanna, Jama\' (تقسيم الاسم إلى مفرد ومثنى وجمع)', halaman: 159, urutan: 14, aktif: true },
  { id: 15, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 15, judul_bab: 'Pembagian Jama\' (تقسيم الجمع)', halaman: 162, urutan: 15, aktif: true },
  { id: 16, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 16, judul_bab: 'I\'rab Mutsanna (إعراب المثنى)', halaman: 165, urutan: 16, aktif: true },
  { id: 17, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 17, judul_bab: 'I\'rab Jama\' Mudzakkar Salim (إعراب جمع المذكر السالم)', halaman: 169, urutan: 17, aktif: true },
  { id: 18, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 18, judul_bab: 'I\'rab Jama\' Muannats Salim (إعراب جمع المؤنث السالم)', halaman: 173, urutan: 18, aktif: true },
  { id: 19, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 19, judul_bab: 'Mudhaf dan Mudhaf Ilaih (المضاف والمضاف إليه)', halaman: 177, urutan: 19, aktif: true },
  { id: 20, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 20, judul_bab: 'Al-Asma\' Al-Khamsah & I\'rabnya (الأسماء الخمسة)', halaman: 182, urutan: 20, aktif: true },
  { id: 21, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 21, judul_bab: 'Tanda Ta\'nits pada Fi\'il (علامات التأنيث في الأفعال)', halaman: 186, urutan: 21, aktif: true },
  { id: 22, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 22, judul_bab: 'Tanda Ta\'nits pada Isim (علامات التأنيث في الأسماء)', halaman: 189, urutan: 22, aktif: true },
  { id: 23, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 23, judul_bab: 'Nakirah dan Ma\'rifah (النكرة والمعرفة)', halaman: 192, urutan: 23, aktif: true },
  { id: 24, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 24, judul_bab: 'Isim \'Alam (العلم)', halaman: 194, urutan: 24, aktif: true },
  { id: 25, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 25, judul_bab: 'Ma\'rifah dengan Alif Lam (المعرف بالألف واللام)', halaman: 197, urutan: 25, aktif: true },
  { id: 26, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 26, judul_bab: 'Dhamir: Munfashil, Muttashil, Mustatir (الضمير)', halaman: 200, urutan: 26, aktif: true },
  { id: 27, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 27, judul_bab: 'Isim Maushul (الاسم الموصول)', halaman: 215, urutan: 27, aktif: true },
  { id: 28, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 28, judul_bab: 'Isim Isyarah (اسم الإشارة)', halaman: 220, urutan: 28, aktif: true },
  { id: 29, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 29, judul_bab: 'Naib Fa\'il (نائب الفاعل)', halaman: 224, urutan: 29, aktif: true },
  { id: 30, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 30, judul_bab: 'Af\'al Al-Istimrar An-Nasikhah & Ma Dama (أفعال الاستمرار الناسخة وما دام)', halaman: 228, urutan: 30, aktif: true },
  { id: 31, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 31, judul_bab: 'Maf\'ul Muthlaq (المفعول المطلق)', halaman: 233, urutan: 31, aktif: true },
  { id: 32, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 32, judul_bab: 'Maf\'ul Li Ajlih (المفعول لأجله)', halaman: 238, urutan: 32, aktif: true },
  { id: 33, subject_id: 6, kitab: 'Nahwu Wadhih', jilid: '2', nomor_bab: 33, judul_bab: 'Zharf Zaman dan Zharf Makan (ظرف الزمان وظرف المكان)', halaman: 243, urutan: 33, aktif: true },
]

export const DEFAULT_MUTABAAH_ACTIVITIES: MutabaahActivity[] = [
  { id: 1, kode: 'shalat_5_waktu', nama: 'Shalat 5 Waktu di Masjid', tipe: 'angka', satuan: 'waktu', target_harian: 5, bobot: 1, urutan: 1, aktif: true },
  { id: 2, kode: 'tahajjud', nama: 'Tahajjud', tipe: 'boolean', satuan: null, target_harian: 1, bobot: 1, urutan: 2, aktif: true },
  { id: 3, kode: 'qabliyah_subuh', nama: 'Qabliyah Subuh', tipe: 'boolean', satuan: null, target_harian: 1, bobot: 1, urutan: 3, aktif: true },
  { id: 4, kode: 'dzikir_pagi', nama: 'Dzikir Pagi', tipe: 'boolean', satuan: null, target_harian: 1, bobot: 1, urutan: 4, aktif: true },
  { id: 5, kode: 'dhuha', nama: 'Dhuha', tipe: 'boolean', satuan: null, target_harian: 1, bobot: 1, urutan: 5, aktif: true },
  { id: 6, kode: 'tilawah', nama: 'Tilawah', tipe: 'angka', satuan: 'halaman', target_harian: 1, bobot: 1, urutan: 6, aktif: true },
  { id: 7, kode: 'puasa_sunnah', nama: 'Puasa Sunnah', tipe: 'boolean', satuan: null, target_harian: null, bobot: 1, urutan: 7, aktif: true },
  { id: 8, kode: 'dzikir_petang', nama: 'Dzikir Petang', tipe: 'boolean', satuan: null, target_harian: 1, bobot: 1, urutan: 8, aktif: true },
  { id: 9, kode: 'mufrodat', nama: 'Setoran Mufradat', tipe: 'angka', satuan: 'kata', target_harian: 5, bobot: 1, urutan: 9, aktif: true },
  { id: 10, kode: 'baca_buku', nama: 'Baca Buku/Kitab', tipe: 'angka', satuan: 'halaman', target_harian: 5, bobot: 1, urutan: 10, aktif: true },
]

export const DEFAULT_ACTIVITY_TYPES: ActivityType[] = [
  { id: 1, kode: 'tahajjud', nama: 'Tahajjud Berjamaah / Mandiri', jenis: 'harian', urutan: 1, aktif: true },
  { id: 2, kode: 'shalat_fardhu', nama: 'Shalat Fardhu di Masjid', jenis: 'harian', urutan: 2, aktif: true },
  { id: 3, kode: 'halaqah_quran', nama: "Halaqah Al-Qur'an (Nabawi/Masjidil Haram)", jenis: 'harian', urutan: 3, aktif: true },
  { id: 4, kode: 'setoran_mufrodat', nama: 'Setoran Mufrodat Harian', jenis: 'harian', urutan: 4, aktif: true },
  { id: 5, kode: 'makan_masak', nama: 'Makan / Masak Bersama', jenis: 'harian', urutan: 5, aktif: true },
  { id: 6, kode: 'kbm_pagi', nama: 'KBM Pagi (Bahasa & Diniyah)', jenis: 'harian', urutan: 6, aktif: true },
  { id: 7, kode: 'kegiatan_lainnya', nama: 'Kegiatan Lainnya', jenis: 'harian', urutan: 7, aktif: true },
  { id: 8, kode: 'idn_hebat', nama: 'Program IDN Hebat', jenis: 'pekanan', urutan: 1, aktif: true },
  { id: 9, kode: 'public_speaking', nama: 'Public Speaking (Khitobah)', jenis: 'pekanan', urutan: 2, aktif: true },
  { id: 10, kode: 'olahraga', nama: 'Olahraga / Rihlah', jenis: 'pekanan', urutan: 3, aktif: true },
  { id: 11, kode: 'ekskul', nama: 'Ekskul & Minat Bakat', jenis: 'pekanan', urutan: 4, aktif: true },
  { id: 12, kode: 'stadium_general', nama: 'Stadium General / Kajian Masyayikh', jenis: 'pekanan', urutan: 5, aktif: true },
  { id: 13, kode: 'kegiatan_kalender', nama: 'Kegiatan Kalender Akademik', jenis: 'pekanan', urutan: 6, aktif: true },
]

export const ALL_SURAHS: Surah[] = [
  { nomor: 1, nama_latin: 'Al-Fatihah', nama_arab: 'الفاتحة', jumlah_ayat: 7, tempat_turun: 'Mekkah', offset_ayat: 0 },
  { nomor: 2, nama_latin: 'Al-Baqarah', nama_arab: 'البقرة', jumlah_ayat: 286, tempat_turun: 'Madinah', offset_ayat: 7 },
  { nomor: 3, nama_latin: "Ali 'Imran", nama_arab: 'آل عمران', jumlah_ayat: 200, tempat_turun: 'Madinah', offset_ayat: 293 },
  { nomor: 4, nama_latin: "An-Nisa'", nama_arab: 'النساء', jumlah_ayat: 176, tempat_turun: 'Madinah', offset_ayat: 493 },
  { nomor: 5, nama_latin: "Al-Ma'idah", nama_arab: 'المائدة', jumlah_ayat: 120, tempat_turun: 'Madinah', offset_ayat: 669 },
  { nomor: 6, nama_latin: "Al-An'am", nama_arab: 'الأنعام', jumlah_ayat: 165, tempat_turun: 'Mekkah', offset_ayat: 789 },
  { nomor: 7, nama_latin: "Al-A'raf", nama_arab: 'الأعراف', jumlah_ayat: 206, tempat_turun: 'Mekkah', offset_ayat: 954 },
  { nomor: 8, nama_latin: 'Al-Anfal', nama_arab: 'الأنفال', jumlah_ayat: 75, tempat_turun: 'Madinah', offset_ayat: 1160 },
  { nomor: 9, nama_latin: 'At-Taubah', nama_arab: 'التوبة', jumlah_ayat: 129, tempat_turun: 'Madinah', offset_ayat: 1235 },
  { nomor: 10, nama_latin: 'Yunus', nama_arab: 'يونس', jumlah_ayat: 109, tempat_turun: 'Mekkah', offset_ayat: 1364 },
  { nomor: 11, nama_latin: 'Hud', nama_arab: 'هود', jumlah_ayat: 123, tempat_turun: 'Mekkah', offset_ayat: 1473 },
  { nomor: 12, nama_latin: 'Yusuf', nama_arab: 'يوسف', jumlah_ayat: 111, tempat_turun: 'Mekkah', offset_ayat: 1596 },
  { nomor: 13, nama_latin: "Ar-Ra'd", nama_arab: 'الرعد', jumlah_ayat: 43, tempat_turun: 'Madinah', offset_ayat: 1707 },
  { nomor: 14, nama_latin: 'Ibrahim', nama_arab: 'إبراهيم', jumlah_ayat: 52, tempat_turun: 'Mekkah', offset_ayat: 1750 },
  { nomor: 15, nama_latin: 'Al-Hijr', nama_arab: 'الحجر', jumlah_ayat: 99, tempat_turun: 'Mekkah', offset_ayat: 1802 },
  { nomor: 16, nama_latin: 'An-Nahl', nama_arab: 'النحل', jumlah_ayat: 128, tempat_turun: 'Mekkah', offset_ayat: 1901 },
  { nomor: 17, nama_latin: "Al-Isra'", nama_arab: 'الإسراء', jumlah_ayat: 111, tempat_turun: 'Mekkah', offset_ayat: 2029 },
  { nomor: 18, nama_latin: 'Al-Kahf', nama_arab: 'الكهف', jumlah_ayat: 110, tempat_turun: 'Mekkah', offset_ayat: 2140 },
  { nomor: 19, nama_latin: 'Maryam', nama_arab: 'مريم', jumlah_ayat: 98, tempat_turun: 'Mekkah', offset_ayat: 2250 },
  { nomor: 20, nama_latin: 'Taha', nama_arab: 'طه', jumlah_ayat: 135, tempat_turun: 'Mekkah', offset_ayat: 2348 },
  { nomor: 21, nama_latin: 'Al-Anbiya', nama_arab: 'الأنبياء', jumlah_ayat: 112, tempat_turun: 'Mekkah', offset_ayat: 2483 },
  { nomor: 22, nama_latin: 'Al-Hajj', nama_arab: 'الحج', jumlah_ayat: 78, tempat_turun: 'Madinah', offset_ayat: 2595 },
  { nomor: 23, nama_latin: "Al-Mu'minun", nama_arab: 'المؤمنون', jumlah_ayat: 118, tempat_turun: 'Mekkah', offset_ayat: 2673 },
  { nomor: 24, nama_latin: 'An-Nur', nama_arab: 'النور', jumlah_ayat: 64, tempat_turun: 'Madinah', offset_ayat: 2791 },
  { nomor: 25, nama_latin: 'Al-Furqan', nama_arab: 'الفرقان', jumlah_ayat: 77, tempat_turun: 'Mekkah', offset_ayat: 2855 },
  { nomor: 26, nama_latin: "Asy-Syu'ara'", nama_arab: 'الشعراء', jumlah_ayat: 227, tempat_turun: 'Mekkah', offset_ayat: 2932 },
  { nomor: 27, nama_latin: 'An-Naml', nama_arab: 'النمل', jumlah_ayat: 93, tempat_turun: 'Mekkah', offset_ayat: 3159 },
  { nomor: 28, nama_latin: 'Al-Qasas', nama_arab: 'القصص', jumlah_ayat: 88, tempat_turun: 'Mekkah', offset_ayat: 3252 },
  { nomor: 29, nama_latin: "Al-'Ankabut", nama_arab: 'العنكبوت', jumlah_ayat: 69, tempat_turun: 'Mekkah', offset_ayat: 3340 },
  { nomor: 30, nama_latin: 'Ar-Rum', nama_arab: 'الروم', jumlah_ayat: 60, tempat_turun: 'Mekkah', offset_ayat: 3409 },
  { nomor: 31, nama_latin: 'Luqman', nama_arab: 'لقمان', jumlah_ayat: 34, tempat_turun: 'Mekkah', offset_ayat: 3469 },
  { nomor: 32, nama_latin: 'As-Sajdah', nama_arab: 'السجدة', jumlah_ayat: 30, tempat_turun: 'Mekkah', offset_ayat: 3503 },
  { nomor: 33, nama_latin: 'Al-Ahzab', nama_arab: 'الأحزاب', jumlah_ayat: 73, tempat_turun: 'Madinah', offset_ayat: 3533 },
  { nomor: 34, nama_latin: "Saba'", nama_arab: 'سبإ', jumlah_ayat: 54, tempat_turun: 'Mekkah', offset_ayat: 3606 },
  { nomor: 35, nama_latin: 'Fatir', nama_arab: 'فاطر', jumlah_ayat: 45, tempat_turun: 'Mekkah', offset_ayat: 3660 },
  { nomor: 36, nama_latin: 'Ya-Sin', nama_arab: 'يس', jumlah_ayat: 83, tempat_turun: 'Mekkah', offset_ayat: 3705 },
  { nomor: 37, nama_latin: 'As-Saffat', nama_arab: 'الصافات', jumlah_ayat: 182, tempat_turun: 'Mekkah', offset_ayat: 3788 },
  { nomor: 38, nama_latin: 'Sad', nama_arab: 'ص', jumlah_ayat: 88, tempat_turun: 'Mekkah', offset_ayat: 3970 },
  { nomor: 39, nama_latin: 'Az-Zumar', nama_arab: 'الزمر', jumlah_ayat: 75, tempat_turun: 'Mekkah', offset_ayat: 4058 },
  { nomor: 40, nama_latin: 'Ghafir', nama_arab: 'غافر', jumlah_ayat: 85, tempat_turun: 'Mekkah', offset_ayat: 4133 },
  { nomor: 41, nama_latin: 'Fussilat', nama_arab: 'فصلت', jumlah_ayat: 54, tempat_turun: 'Mekkah', offset_ayat: 4218 },
  { nomor: 42, nama_latin: 'Asy-Syura', nama_arab: 'الشورى', jumlah_ayat: 53, tempat_turun: 'Mekkah', offset_ayat: 4272 },
  { nomor: 43, nama_latin: 'Az-Zukhruf', nama_arab: 'الزخرف', jumlah_ayat: 89, tempat_turun: 'Mekkah', offset_ayat: 4325 },
  { nomor: 44, nama_latin: 'Ad-Dukhan', nama_arab: 'الدخان', jumlah_ayat: 59, tempat_turun: 'Mekkah', offset_ayat: 4414 },
  { nomor: 45, nama_latin: 'Al-Jatsiyah', nama_arab: 'الجاثية', jumlah_ayat: 37, tempat_turun: 'Mekkah', offset_ayat: 4473 },
  { nomor: 46, nama_latin: 'Al-Ahqaf', nama_arab: 'الأحقاف', jumlah_ayat: 35, tempat_turun: 'Mekkah', offset_ayat: 4510 },
  { nomor: 47, nama_latin: 'Muhammad', nama_arab: 'محمد', jumlah_ayat: 38, tempat_turun: 'Madinah', offset_ayat: 4545 },
  { nomor: 48, nama_latin: 'Al-Fath', nama_arab: 'الفتح', jumlah_ayat: 29, tempat_turun: 'Madinah', offset_ayat: 4583 },
  { nomor: 49, nama_latin: 'Al-Hujurat', nama_arab: 'الحجرات', jumlah_ayat: 18, tempat_turun: 'Madinah', offset_ayat: 4612 },
  { nomor: 50, nama_latin: 'Qaf', nama_arab: 'ق', jumlah_ayat: 45, tempat_turun: 'Mekkah', offset_ayat: 4630 },
  { nomor: 51, nama_latin: 'Az-Zariyat', nama_arab: 'الذاريات', jumlah_ayat: 60, tempat_turun: 'Mekkah', offset_ayat: 4675 },
  { nomor: 52, nama_latin: 'At-Tur', nama_arab: 'الطور', jumlah_ayat: 49, tempat_turun: 'Mekkah', offset_ayat: 4735 },
  { nomor: 53, nama_latin: 'An-Najm', nama_arab: 'النجم', jumlah_ayat: 62, tempat_turun: 'Mekkah', offset_ayat: 4784 },
  { nomor: 54, nama_latin: 'Al-Qamar', nama_arab: 'القمر', jumlah_ayat: 55, tempat_turun: 'Mekkah', offset_ayat: 4846 },
  { nomor: 55, nama_latin: 'Ar-Rahman', nama_arab: 'الرحمن', jumlah_ayat: 78, tempat_turun: 'Madinah', offset_ayat: 4901 },
  { nomor: 56, nama_latin: "Al-Waqi'ah", nama_arab: 'الواقعة', jumlah_ayat: 96, tempat_turun: 'Mekkah', offset_ayat: 4979 },
  { nomor: 57, nama_latin: 'Al-Hadid', nama_arab: 'الحديد', jumlah_ayat: 29, tempat_turun: 'Madinah', offset_ayat: 5075 },
  { nomor: 58, nama_latin: 'Al-Mujadilah', nama_arab: 'المجادلة', jumlah_ayat: 22, tempat_turun: 'Madinah', offset_ayat: 5104 },
  { nomor: 59, nama_latin: 'Al-Hasyr', nama_arab: 'الحشر', jumlah_ayat: 24, tempat_turun: 'Madinah', offset_ayat: 5126 },
  { nomor: 60, nama_latin: 'Al-Mumtahanah', nama_arab: 'الممتحنة', jumlah_ayat: 13, tempat_turun: 'Madinah', offset_ayat: 5150 },
  { nomor: 61, nama_latin: 'As-Saff', nama_arab: 'الصف', jumlah_ayat: 14, tempat_turun: 'Madinah', offset_ayat: 5163 },
  { nomor: 62, nama_latin: "Al-Jumu'ah", nama_arab: 'الجمعة', jumlah_ayat: 11, tempat_turun: 'Madinah', offset_ayat: 5177 },
  { nomor: 63, nama_latin: 'Al-Munafiqun', nama_arab: 'المنافقون', jumlah_ayat: 11, tempat_turun: 'Madinah', offset_ayat: 5188 },
  { nomor: 64, nama_latin: 'At-Taghabun', nama_arab: 'التغابن', jumlah_ayat: 18, tempat_turun: 'Madinah', offset_ayat: 5199 },
  { nomor: 65, nama_latin: 'At-Talaq', nama_arab: 'الطلاق', jumlah_ayat: 12, tempat_turun: 'Madinah', offset_ayat: 5217 },
  { nomor: 66, nama_latin: 'At-Tahrim', nama_arab: 'التحريم', jumlah_ayat: 12, tempat_turun: 'Madinah', offset_ayat: 5229 },
  { nomor: 67, nama_latin: 'Al-Mulk', nama_arab: 'الملك', jumlah_ayat: 30, tempat_turun: 'Mekkah', offset_ayat: 5241 },
  { nomor: 68, nama_latin: 'Al-Qalam', nama_arab: 'القلم', jumlah_ayat: 52, tempat_turun: 'Mekkah', offset_ayat: 5271 },
  { nomor: 69, nama_latin: 'Al-Haqqah', nama_arab: 'الحاقة', jumlah_ayat: 52, tempat_turun: 'Mekkah', offset_ayat: 5323 },
  { nomor: 70, nama_latin: "Al-Ma'arij", nama_arab: 'المعارج', jumlah_ayat: 44, tempat_turun: 'Mekkah', offset_ayat: 5375 },
  { nomor: 71, nama_latin: 'Nuh', nama_arab: 'نوح', jumlah_ayat: 28, tempat_turun: 'Mekkah', offset_ayat: 5419 },
  { nomor: 72, nama_latin: 'Al-Jinn', nama_arab: 'الجن', jumlah_ayat: 28, tempat_turun: 'Mekkah', offset_ayat: 5447 },
  { nomor: 73, nama_latin: 'Al-Muzzammil', nama_arab: 'المزمل', jumlah_ayat: 20, tempat_turun: 'Mekkah', offset_ayat: 5475 },
  { nomor: 74, nama_latin: 'Al-Muddassir', nama_arab: 'المدثر', jumlah_ayat: 56, tempat_turun: 'Mekkah', offset_ayat: 5495 },
  { nomor: 75, nama_latin: 'Al-Qiyamah', nama_arab: 'القيامة', jumlah_ayat: 40, tempat_turun: 'Mekkah', offset_ayat: 5551 },
  { nomor: 76, nama_latin: 'Al-Insan', nama_arab: 'الإنسان', jumlah_ayat: 31, tempat_turun: 'Madinah', offset_ayat: 5591 },
  { nomor: 77, nama_latin: 'Al-Mursalat', nama_arab: 'المرسلات', jumlah_ayat: 50, tempat_turun: 'Mekkah', offset_ayat: 5622 },
  { nomor: 78, nama_latin: "An-Naba'", nama_arab: 'النبإ', jumlah_ayat: 40, tempat_turun: 'Mekkah', offset_ayat: 5672 },
  { nomor: 79, nama_latin: "An-Nazi'at", nama_arab: 'النازعات', jumlah_ayat: 46, tempat_turun: 'Mekkah', offset_ayat: 5712 },
  { nomor: 80, nama_latin: "'Abasa", nama_arab: 'عبس', jumlah_ayat: 42, tempat_turun: 'Mekkah', offset_ayat: 5758 },
  { nomor: 81, nama_latin: 'At-Takwir', nama_arab: 'التكوير', jumlah_ayat: 29, tempat_turun: 'Mekkah', offset_ayat: 5800 },
  { nomor: 82, nama_latin: 'Al-Infitar', nama_arab: 'الانفطار', jumlah_ayat: 19, tempat_turun: 'Mekkah', offset_ayat: 5829 },
  { nomor: 83, nama_latin: 'Al-Muthaffifin', nama_arab: 'المطففين', jumlah_ayat: 36, tempat_turun: 'Mekkah', offset_ayat: 5848 },
  { nomor: 84, nama_latin: 'Al-Insyiqaq', nama_arab: 'الانشقاق', jumlah_ayat: 25, tempat_turun: 'Mekkah', offset_ayat: 5884 },
  { nomor: 85, nama_latin: 'Al-Buruj', nama_arab: 'البروج', jumlah_ayat: 22, tempat_turun: 'Mekkah', offset_ayat: 5909 },
  { nomor: 86, nama_latin: 'At-Tariq', nama_arab: 'الطارق', jumlah_ayat: 17, tempat_turun: 'Mekkah', offset_ayat: 5931 },
  { nomor: 87, nama_latin: "Al-A'la", nama_arab: 'الأعلى', jumlah_ayat: 19, tempat_turun: 'Mekkah', offset_ayat: 5948 },
  { nomor: 88, nama_latin: 'Al-Ghasyiyah', nama_arab: 'الغاشية', jumlah_ayat: 26, tempat_turun: 'Mekkah', offset_ayat: 5967 },
  { nomor: 89, nama_latin: 'Al-Fajr', nama_arab: 'الفجر', jumlah_ayat: 30, tempat_turun: 'Mekkah', offset_ayat: 5993 },
  { nomor: 90, nama_latin: 'Al-Balad', nama_arab: 'البلد', jumlah_ayat: 20, tempat_turun: 'Mekkah', offset_ayat: 6023 },
  { nomor: 91, nama_latin: 'Asy-Syams', nama_arab: 'الشمس', jumlah_ayat: 15, tempat_turun: 'Mekkah', offset_ayat: 6043 },
  { nomor: 92, nama_latin: 'Al-Lail', nama_arab: 'الليل', jumlah_ayat: 21, tempat_turun: 'Mekkah', offset_ayat: 6058 },
  { nomor: 93, nama_latin: 'Ad-Duha', nama_arab: 'الضحى', jumlah_ayat: 11, tempat_turun: 'Mekkah', offset_ayat: 6079 },
  { nomor: 94, nama_latin: 'Asy-Syarh', nama_arab: 'الشرح', jumlah_ayat: 8, tempat_turun: 'Mekkah', offset_ayat: 6090 },
  { nomor: 95, nama_latin: 'At-Tin', nama_arab: 'التين', jumlah_ayat: 8, tempat_turun: 'Mekkah', offset_ayat: 6098 },
  { nomor: 96, nama_latin: "Al-'Alaq", nama_arab: 'العلق', jumlah_ayat: 19, tempat_turun: 'Mekkah', offset_ayat: 6106 },
  { nomor: 97, nama_latin: 'Al-Qadr', nama_arab: 'القدر', jumlah_ayat: 5, tempat_turun: 'Mekkah', offset_ayat: 6125 },
  { nomor: 98, nama_latin: 'Al-Bayyinah', nama_arab: 'البينة', jumlah_ayat: 8, tempat_turun: 'Madinah', offset_ayat: 6130 },
  { nomor: 99, nama_latin: 'Az-Zalzalah', nama_arab: 'الزلزلة', jumlah_ayat: 8, tempat_turun: 'Madinah', offset_ayat: 6138 },
  { nomor: 100, nama_latin: "Al-'Adiyat", nama_arab: 'العاديات', jumlah_ayat: 11, tempat_turun: 'Mekkah', offset_ayat: 6146 },
  { nomor: 101, nama_latin: "Al-Qari'ah", nama_arab: 'القارعة', jumlah_ayat: 11, tempat_turun: 'Mekkah', offset_ayat: 6157 },
  { nomor: 102, nama_latin: 'At-Takatsur', nama_arab: 'التكاثر', jumlah_ayat: 8, tempat_turun: 'Mekkah', offset_ayat: 6168 },
  { nomor: 103, nama_latin: "Al-'Asr", nama_arab: 'العصر', jumlah_ayat: 3, tempat_turun: 'Mekkah', offset_ayat: 6176 },
  { nomor: 104, nama_latin: 'Al-Humazah', nama_arab: 'الهمزة', jumlah_ayat: 9, tempat_turun: 'Mekkah', offset_ayat: 6179 },
  { nomor: 105, nama_latin: 'Al-Fil', nama_arab: 'الفيل', jumlah_ayat: 5, tempat_turun: 'Mekkah', offset_ayat: 6188 },
  { nomor: 106, nama_latin: 'Quraisy', nama_arab: 'قريش', jumlah_ayat: 4, tempat_turun: 'Mekkah', offset_ayat: 6193 },
  { nomor: 107, nama_latin: "Al-Ma'un", nama_arab: 'الماعون', jumlah_ayat: 7, tempat_turun: 'Mekkah', offset_ayat: 6197 },
  { nomor: 108, nama_latin: 'Al-Kautsar', nama_arab: 'الكوثر', jumlah_ayat: 3, tempat_turun: 'Mekkah', offset_ayat: 6204 },
  { nomor: 109, nama_latin: 'Al-Kafirun', nama_arab: 'الكافرون', jumlah_ayat: 6, tempat_turun: 'Mekkah', offset_ayat: 6207 },
  { nomor: 110, nama_latin: 'An-Nasr', nama_arab: 'النصر', jumlah_ayat: 3, tempat_turun: 'Madinah', offset_ayat: 6213 },
  { nomor: 111, nama_latin: 'Al-Lahab', nama_arab: 'المسد', jumlah_ayat: 5, tempat_turun: 'Mekkah', offset_ayat: 6216 },
  { nomor: 112, nama_latin: 'Al-Ikhlas', nama_arab: 'الإخلاص', jumlah_ayat: 4, tempat_turun: 'Mekkah', offset_ayat: 6221 },
  { nomor: 113, nama_latin: 'Al-Falaq', nama_arab: 'الفلق', jumlah_ayat: 5, tempat_turun: 'Mekkah', offset_ayat: 6225 },
  { nomor: 114, nama_latin: 'An-Nas', nama_arab: 'الناس', jumlah_ayat: 6, tempat_turun: 'Mekkah', offset_ayat: 6230 },
]

export const calculateQuranAyatCount = (
  surahAwal: number,
  ayatAwal: number,
  surahAkhir: number,
  ayatAkhir: number
): number => {
  const sAwal = ALL_SURAHS.find(s => s.nomor === surahAwal)
  const sAkhir = ALL_SURAHS.find(s => s.nomor === surahAkhir)
  if (!sAwal || !sAkhir) return 0

  const offsetAwal = sAwal.offset_ayat + ayatAwal
  const offsetAkhir = sAkhir.offset_ayat + ayatAkhir

  const diff = offsetAkhir - offsetAwal + 1
  return diff > 0 ? diff : 0
}

export const JUZ_START_POSITIONS: { juz: number; surah: number; ayat: number }[] = [
  { juz: 1, surah: 1, ayat: 1 },
  { juz: 2, surah: 2, ayat: 142 },
  { juz: 3, surah: 2, ayat: 253 },
  { juz: 4, surah: 3, ayat: 93 },
  { juz: 5, surah: 4, ayat: 24 },
  { juz: 6, surah: 4, ayat: 148 },
  { juz: 7, surah: 5, ayat: 82 },
  { juz: 8, surah: 6, ayat: 111 },
  { juz: 9, surah: 7, ayat: 88 },
  { juz: 10, surah: 8, ayat: 41 },
  { juz: 11, surah: 9, ayat: 93 },
  { juz: 12, surah: 11, ayat: 6 },
  { juz: 13, surah: 12, ayat: 53 },
  { juz: 14, surah: 15, ayat: 1 },
  { juz: 15, surah: 17, ayat: 1 },
  { juz: 16, surah: 18, ayat: 75 },
  { juz: 17, surah: 21, ayat: 1 },
  { juz: 18, surah: 23, ayat: 1 },
  { juz: 19, surah: 25, ayat: 21 },
  { juz: 20, surah: 27, ayat: 56 },
  { juz: 21, surah: 29, ayat: 46 },
  { juz: 22, surah: 33, ayat: 31 },
  { juz: 23, surah: 36, ayat: 28 },
  { juz: 24, surah: 39, ayat: 32 },
  { juz: 25, surah: 41, ayat: 47 },
  { juz: 26, surah: 46, ayat: 1 },
  { juz: 27, surah: 51, ayat: 31 },
  { juz: 28, surah: 58, ayat: 1 },
  { juz: 29, surah: 67, ayat: 1 },
  { juz: 30, surah: 78, ayat: 1 },
]

export const getJuzFromSurahAyat = (surahNum: number, ayatNum: number = 1): number => {
  let matchedJuz = 1
  for (const item of JUZ_START_POSITIONS) {
    if (surahNum > item.surah || (surahNum === item.surah && ayatNum >= item.ayat)) {
      matchedJuz = item.juz
    } else {
      break
    }
  }
  return matchedJuz
}

export const formatQuranDetail = (
  surahAwal: number,
  ayatAwal: number,
  surahAkhir: number,
  ayatAkhir: number
): {
  juzLabel: string
  surahRangeText: string
  fullMateriText: string
} => {
  const sAwal = ALL_SURAHS.find((s) => s.nomor === surahAwal)
  const sAkhir = ALL_SURAHS.find((s) => s.nomor === surahAkhir)

  const sAwalName = sAwal?.nama_latin || `Surah ${surahAwal}`
  const sAkhirName = sAkhir?.nama_latin || `Surah ${surahAkhir}`

  const juzAwal = getJuzFromSurahAyat(surahAwal, ayatAwal)
  const juzAkhir = getJuzFromSurahAyat(surahAkhir, ayatAkhir)

  const juzLabel = juzAwal === juzAkhir ? `Juz ${juzAwal}` : `Juz ${juzAwal}–${juzAkhir}`

  let surahRangeText = ''
  if (surahAwal === surahAkhir) {
    if (ayatAwal === 1 && sAwal && ayatAkhir >= sAwal.jumlah_ayat) {
      surahRangeText = `${sAwalName} (1–${sAwal.jumlah_ayat})`
    } else {
      surahRangeText = `${sAwalName} (${ayatAwal}–${ayatAkhir})`
    }
  } else {
    surahRangeText = `${sAwalName} (${ayatAwal}) s/d ${sAkhirName} (${ayatAkhir})`
  }

  const fullMateriText = `${juzLabel} • ${surahRangeText}`

  return {
    juzLabel,
    surahRangeText,
    fullMateriText,
  }
}

