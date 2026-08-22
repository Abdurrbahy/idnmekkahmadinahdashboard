export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'admin' | 'atasan' | 'walsan'

export interface Profile {
  id: string
  email: string
  nama: string
  role: UserRole
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ParentStudent {
  id: number
  profile_id: string
  student_id: number
  hubungan: 'ayah' | 'ibu' | 'wali'
  created_at?: string
  student?: Student
}

export interface Student {
  id: number
  nama: string
  nis?: string | null
  kelas: string
  status: 'aktif' | 'nonaktif' | 'alumni'
  foto_url?: string | null
  catatan?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface Surah {
  nomor: number
  nama_latin: string
  nama_arab?: string | null
  jumlah_ayat: number
  tempat_turun?: 'Mekkah' | 'Madinah' | null
  offset_ayat: number
  created_at?: string
}

export interface Subject {
  id: number
  kode: string
  nama: string
  kategori: 'quran' | 'bahasa_arab' | 'mutun' | 'akademik'
  jenis_setoran: 'ziyadah' | 'murajaah' | 'mutun' | 'mufradat' | 'bahasa_arab'
  urutan: number
  aktif: boolean
  created_at?: string
}

export interface AttendanceSession {
  id: number
  nama: string
  urutan: number
  aktif: boolean
  created_at?: string
}

export interface AttendanceLog {
  id?: number
  student_id: number
  session_id: number
  tanggal: string
  status: 'hadir' | 'izin' | 'sakit' | 'alpa'
  catatan?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  student?: Student
  session?: AttendanceSession
}

export interface Submission {
  id?: number
  student_id: number
  subject_id: number
  tanggal: string
  jenis: 'ziyadah' | 'murajaah' | 'mutun' | 'mufradat' | 'bahasa_arab'
  capaian: number
  satuan: string
  status: 'lancar' | 'kurang_lancar' | 'mengulang'
  nilai?: number | null
  catatan?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  student?: Student
  subject?: Subject
  quran_details?: QuranSubmissionDetail[]
}

export interface QuranSubmissionDetail {
  id?: number
  submission_id?: number
  surah_awal: number
  ayat_awal: number
  surah_akhir: number
  ayat_akhir: number
  created_at?: string
  surah_awal_info?: Surah
  surah_akhir_info?: Surah
}

export interface MutabaahActivity {
  id: number
  kode: string
  nama: string
  tipe: 'boolean' | 'angka'
  satuan?: string | null
  target_harian?: number | null
  bobot?: number
  urutan: number
  aktif: boolean
  created_at?: string
}

export interface MutabaahRecord {
  id?: number
  student_id: number
  activity_id: number
  tanggal: string
  status: 'done' | 'not_done'
  jumlah?: number | null
  catatan?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  student?: Student
  activity?: MutabaahActivity
}

export interface ActivityType {
  id: number
  kode: string
  nama: string
  jenis: 'harian' | 'pekanan'
  urutan: number
  aktif: boolean
  created_at?: string
}

export interface Activity {
  id?: number
  activity_type_id: number
  tanggal: string
  judul?: string | null
  keterangan?: string | null
  jumlah_hadir?: number | null
  jumlah_total?: number | null
  penanggung_jawab?: string | null
  link_google_photo?: string | null
  created_by?: string | null
  created_at?: string
  updated_at?: string
  activity_type?: ActivityType
  media?: ActivityMedia[]
}

export interface ActivityMedia {
  id?: number
  activity_id: number
  url: string
  jenis: 'foto' | 'video'
  keterangan?: string | null
  urutan: number
  created_at?: string
}

// --- VIEWS & STATS ---

export interface MutabaahDailyScore {
  student_id: number
  tanggal: string
  skor_persen: number
  amalan_tuntas: number
  amalan_dinilai: number
}

export interface MutabaahBonus {
  student_id: number
  tanggal: string
  kode: string
  nama: string
  status: string
}

export interface WeeklyAttendance {
  pekan_mulai: string
  pekan_selesai: string
  student_id: number
  n_hadir: number
  n_izin: number
  n_sakit: number
  n_alpa: number
  total_sesi: number
  persen_kehadiran: number
}

export interface WeeklyQuran {
  pekan_mulai: string
  pekan_selesai: string
  student_id: number
  total_ziyadah_ayat: number
  total_murajaah_ayat: number
  total_mutun_bait: number
  total_mufradat_kata: number
  total_quran_ayat: number
  jumlah_setoran: number
  rata_nilai: number | null
}

export interface WeeklyMutabaah {
  pekan_mulai: string
  pekan_selesai: string
  student_id: number
  rata_skor_mutabaah: number
  hari_terisi: number
  jumlah_bonus: number
}

export interface DailyCompleteness {
  tanggal: string
  n_presensi: number
  n_setoran: number
  n_mutabaah: number
  n_kegiatan: number
}
