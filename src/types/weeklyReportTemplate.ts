/**
 * Types & Data Models for Weekly Report Koordinator Template (10 Sections)
 * Reference: Weekly report - W1-OKT-26(1).pdf
 */

export type ReportTab =
  | 'metadata'
  | 'executive_summary'
  | 'mutabaah'
  | 'quran'
  | 'tahfidz_kualitas'
  | 'arabic_speaking'
  | 'program_activities'
  | 'documentation'
  | 'kendala'
  | 'fokus_pekan_depan'

export const REPORT_SECTION_ORDER: { key: ReportTab; title: string; number: number }[] = [
  { key: 'metadata', title: 'Metadata & Sampul', number: 1 },
  { key: 'executive_summary', title: 'Executive Summary', number: 2 },
  { key: 'mutabaah', title: 'Mutabaah & Kedisiplinan', number: 3 },
  { key: 'quran', title: 'Capaian Setoran Al-Qur\'an', number: 4 },
  { key: 'tahfidz_kualitas', title: 'Kualitas & Perkembangan Tahfidz', number: 5 },
  { key: 'arabic_speaking', title: 'Progress Arabic Speaking', number: 6 },
  { key: 'program_activities', title: 'Aktivitas Program Pekan Ini', number: 7 },
  { key: 'documentation', title: 'Dokumentasi Kegiatan (4 Foto)', number: 8 },
  { key: 'kendala', title: 'Kendala & Tindak Lanjut', number: 9 },
  { key: 'fokus_pekan_depan', title: 'Fokus Pekan Berikutnya', number: 10 },
]

// 1. Metadata
export interface WeeklyReportMetadata {
  nama_laporan: string
  cabang: 'Mekkah' | 'Madinah' | string
  pekan_ke: number
  bulan: string
  tahun: number
  tanggal_awal: string
  tanggal_akhir: string
  tanggal_disiapkan: string
  koordinator: string
  status: 'draft' | 'final'
}

// 2. Executive Summary Highlights
export interface ExecutiveHighlight {
  id: string
  kategori: string
  judul: string
  ringkasan: string
  sumber_metrik?: string
}

// 6. Arabic Speaking
export interface ArabicVlogItem {
  id: string
  hari: string
  tanggal: string
  student_id?: number | null
  nama_peserta: string
  judul_topik: string
  status: 'Terjadwal' | 'Selesai' | 'Belum terlaksana' | 'Dijadwalkan ulang'
  link_video?: string
  catatan?: string
}

export interface PodcastWatData {
  nama_kegiatan: string
  status: 'Direncanakan' | 'Terjadwal' | 'Sudah berjalan' | 'Ditunda' | 'Belum terlaksana'
  hari_tanggal: string
  peserta: string
  host: string
  topik: string
  link_rekaman?: string
  catatan?: string
}

export interface ArabicSpeakingData {
  vlog_schedule: ArabicVlogItem[]
  podcast_wat: PodcastWatData
  catatan_evaluasi?: string
}

// 7. Program Activities
export interface ProgramActivityItem {
  id: string
  tanggal: string
  nama_kegiatan: string
  kategori: 'Tahfidz' | 'Arabic Speaking' | 'KBM' | 'Mufradat' | 'Halaqah' | 'Ujian' | 'Khusus' | string
  deskripsi: string
  status: 'Terjadwal' | 'Terlaksana' | 'Ditunda' | 'Dibatalkan' | 'Belum ada konfirmasi'
  catatan?: string
  is_operational?: boolean
}

export interface ProgramActivitiesData {
  manual_activities: ProgramActivityItem[]
  catatan_umum?: string
}

// 8. Documentation (Exactly 4 Photo Slots)
export interface DocumentationPhotoSlot {
  slot: 1 | 2 | 3 | 4
  storage_path?: string
  public_url?: string
  caption?: string
  uploaded_at?: string
  uploaded_by?: string
  file_name?: string
}

export interface DocumentationData {
  photos: DocumentationPhotoSlot[]
}

// 9. Kendala & Tindak Lanjut
export interface KendalaItem {
  id: string
  judul: string
  deskripsi: string
  dampak: string
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi' | 'Mendesak'
  tindak_lanjut: string
  penanggung_jawab: string
  target_penyelesaian: string
  status: 'Belum dimulai' | 'Sedang berjalan' | 'Selesai' | 'Ditunda'
  catatan?: string
}

export interface KendalaData {
  tidak_ada_kendala: boolean
  items: KendalaItem[]
}

// 10. Fokus Pekan Berikutnya (5 Core Focuses)
export interface FokusPekanDepanItem {
  id: string
  kategori: 'Qur\'an' | 'Mutabaah' | 'Arabic Speaking' | 'Kedisiplinan' | 'Dokumentasi' | string
  judul: string
  deskripsi_target: string
  rencana_tindakan: string
  indikator_keberhasilan: string
  penanggung_jawab?: string
  target_waktu?: string
  status: 'rencana' | 'proses' | 'selesai'
}

export interface FokusPekanDepanData {
  items: FokusPekanDepanItem[]
}

// Root Template Payload (Stored in weekly_reports.report_data JSONB)
export interface WeeklyReportTemplateData {
  metadata: WeeklyReportMetadata
  executive_summary: {
    highlights: ExecutiveHighlight[]
  }
  mutabaah: {
    catatan_evaluasi: string
  }
  quran: {
    catatan_evaluasi: string
    mufradat_manual?: Record<number, number>
  }
  tahfidz_kualitas: {
    attention_point: string
    catatan_perkembangan: Record<number, string>
  }
  arabic_speaking: ArabicSpeakingData
  program_activities: ProgramActivitiesData
  documentation: DocumentationData
  kendala: KendalaData
  fokus_pekan_depan: FokusPekanDepanData
}

// Default Focus Program Templates
export const DEFAULT_FOKUS_PEKAN_DEPAN: Omit<FokusPekanDepanItem, 'id'>[] = [
  {
    kategori: 'Qur\'an',
    judul: 'Konsistensi Ziyadah & Muraja\'ah',
    deskripsi_target: 'Menjaga dan meningkatkan konsistensi setoran ziyadah harian dan muraja\'ah rutin.',
    rencana_tindakan: 'Pengawasan berkala pada halaqah ba\'da subuh dan ba\'da ashar.',
    indikator_keberhasilan: 'Seluruh santri memenuhi target minimal ayat dan predikat Lancar >= 85%.',
    status: 'rencana',
  },
  {
    kategori: 'Mutabaah',
    judul: 'Konsistensi Amalan Ibadah Yaumiyyah',
    deskripsi_target: 'Meningkatkan kepatuhan amalan shalat berjamaah awal waktu, tahajjud, dan tilawah.',
    rencana_tindakan: 'Pengecekan buku mutabaah dan pendampingan musyrif di asrama.',
    indikator_keberhasilan: 'Rata-rata mutabaah santri mencapai minimal 85%.',
    status: 'rencana',
  },
  {
    kategori: 'Arabic Speaking',
    judul: 'Rotasi Arabic Vlog & Podcast WAT',
    deskripsi_target: 'Memastikan seluruh santri tampil aktif dalam Arabic Vlog dan Weekend Arabic Talk.',
    rencana_tindakan: 'Penyusunan jadwal giliran dan bimbingan teks percakapan.',
    indikator_keberhasilan: '100% video vlog terunggah dan podcast berjalan tepat waktu.',
    status: 'rencana',
  },
  {
    kategori: 'Kedisiplinan',
    judul: 'Penguatan Tata Tertib & Evaluasi Malam',
    deskripsi_target: 'Membangun kedisiplinan mandiri santri dalam manajemen waktu istirahat dan belajar.',
    rencana_tindakan: 'Evaluasi harian pukul 21.30 dan pemberian reward kedisiplinan.',
    indikator_keberhasilan: 'Nol keterlambatan sesi halaqah dan shalat berjamaah.',
    status: 'rencana',
  },
  {
    kategori: 'Dokumentasi',
    judul: 'Pengarsipan & Publikasi Dokumentasi',
    deskripsi_target: 'Merapikan dokumentasi foto/video kegiatan belajar dan rihlah santri.',
    rencana_tindakan: 'Kurasi 4 foto terbaik pekanan dan pengunggahan ke Google Drive / Storage.',
    indikator_keberhasilan: 'Slot dokumentasi 4 foto terisi lengkap dengan caption yang informatif.',
    status: 'rencana',
  },
]
