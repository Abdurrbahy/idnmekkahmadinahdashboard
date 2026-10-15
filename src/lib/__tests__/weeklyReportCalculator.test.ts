import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateAttendanceAverage,
  calculateQuranAggregates,
  calculateMutabaahAverage,
  calculateMajorityStatus,
  calculateScoreRange,
  getLatestZiyadah,
  generateSuggestedHighlights,
  validateWeeklyReportCompleteness,
} from '../weeklyReportCalculator'
import type {
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyMutabaah,
  Submission,
  Student,
} from '../../types/database'
import type { WeeklyReportTemplateData } from '../../types/weeklyReportTemplate'

describe('Weekly Report Calculator & Aggregation Tests', () => {
  it('1. Menghitung rata-rata kehadiran dengan benar dan mengabaikan pembagian nol', () => {
    assert.equal(calculateAttendanceAverage([]), null)

    const data: WeeklyAttendance[] = [
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 1, n_hadir: 20, n_izin: 0, n_sakit: 0, n_alpa: 0, total_sesi: 20, persen_kehadiran: 100 },
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 2, n_hadir: 18, n_izin: 2, n_sakit: 0, n_alpa: 0, total_sesi: 20, persen_kehadiran: 90 },
    ]
    assert.equal(calculateAttendanceAverage(data), 95)
  })

  it('2. Agregasi Qur\'an menjamin Total = Ziyadah + Muraja\'ah', () => {
    const qData: WeeklyQuran[] = [
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 1, total_ziyadah_ayat: 50, total_murajaah_ayat: 120, total_mutun_bait: 0, total_mufradat_kata: 0, total_quran_ayat: 170, jumlah_setoran: 5, rata_nilai: 85 },
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 2, total_ziyadah_ayat: 30, total_murajaah_ayat: 80, total_mutun_bait: 0, total_mufradat_kata: 0, total_quran_ayat: 110, jumlah_setoran: 4, rata_nilai: 90 },
    ]
    const agg = calculateQuranAggregates(qData)
    assert.equal(agg.totalZiyadah, 80)
    assert.equal(agg.totalMurajaah, 200)
    assert.equal(agg.totalAyat, 280)
    assert.equal(agg.totalAyat, agg.totalZiyadah + agg.totalMurajaah)
  })

  it('3. Rata-rata mutabaah hanya menghitung santri yang memiliki catatan terisi', () => {
    const mData: WeeklyMutabaah[] = [
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 1, rata_skor_mutabaah: 80, hari_terisi: 5, jumlah_bonus: 0 },
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 2, rata_skor_mutabaah: 90, hari_terisi: 5, jumlah_bonus: 0 },
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 3, rata_skor_mutabaah: 0, hari_terisi: 0, jumlah_bonus: 0 },
    ]
    assert.equal(calculateMutabaahAverage(mData), 85)
  })

  it('4. Penentuan status kelancaran mayoritas mendeteksi seri dan tidak mengasumsikan Lancar', () => {
    assert.equal(calculateMajorityStatus([]), 'Belum ada data')

    const subLancar: Submission[] = [
      { student_id: 1, subject_id: 1, tanggal: '2026-10-04', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah' },
      { student_id: 1, subject_id: 1, tanggal: '2026-10-05', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah' },
      { student_id: 1, subject_id: 1, tanggal: '2026-10-06', capaian: 10, satuan: 'ayat', status: 'kurang_lancar', jenis: 'ziyadah' },
    ]
    assert.equal(calculateMajorityStatus(subLancar), 'Lancar')

    const subSeri: Submission[] = [
      { student_id: 1, subject_id: 1, tanggal: '2026-10-04', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah' },
      { student_id: 1, subject_id: 1, tanggal: '2026-10-05', capaian: 10, satuan: 'ayat', status: 'kurang_lancar', jenis: 'ziyadah' },
    ]
    assert.equal(calculateMajorityStatus(subSeri), 'Seri: Lancar & Kurang')
  })

  it('5. Rentang nilai min-max akurat dan membedakan single value serta tanpa nilai', () => {
    assert.equal(calculateScoreRange([]), 'Belum ada nilai')

    const singleSub: Submission[] = [
      { student_id: 1, subject_id: 1, tanggal: '2026-10-04', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah', nilai: 88 },
    ]
    assert.equal(calculateScoreRange(singleSub), '88')

    const multiSub: Submission[] = [
      { student_id: 1, subject_id: 1, tanggal: '2026-10-04', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah', nilai: 82 },
      { student_id: 1, subject_id: 1, tanggal: '2026-10-05', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah', nilai: 95 },
      { student_id: 1, subject_id: 1, tanggal: '2026-10-06', capaian: 10, satuan: 'ayat', status: 'lancar', jenis: 'ziyadah', nilai: 88 },
    ]
    assert.equal(calculateScoreRange(multiSub), '82–95')
  })

  it('6. Ziyadah terbaru membaca detail surah dan ayat', () => {
    const subs: Submission[] = [
      {
        student_id: 1,
        subject_id: 1,
        tanggal: '2026-10-06',
        capaian: 20,
        satuan: 'ayat',
        status: 'lancar',
        jenis: 'ziyadah',
        quran_details: [{ surah_awal: 78, ayat_awal: 1, surah_akhir: 78, ayat_akhir: 20 }],
      },
    ]
    assert.equal(getLatestZiyadah(subs), "An-Naba': 1–20")
  })

  it('7. Highlight otomatis dihasilkan berbasis data aktual', () => {
    const students: Student[] = [{ id: 1, nama: 'Abdullah', kelas: '10', status: 'aktif' }]
    const quranList: WeeklyQuran[] = [
      { pekan_mulai: '2026-10-04', pekan_selesai: '2026-10-10', student_id: 1, total_ziyadah_ayat: 50, total_murajaah_ayat: 100, total_mutun_bait: 0, total_mufradat_kata: 0, total_quran_ayat: 150, jumlah_setoran: 5, rata_nilai: 85 },
    ]
    const hl = generateSuggestedHighlights({
      attendanceAvg: 96.5,
      totalAyat: 150,
      totalZiyadah: 50,
      totalMurajaah: 100,
      mutabaahAvg: 88.2,
      quranList,
      students,
    })

    assert.equal(hl.length, 3)
    assert.ok(hl[0].ringkasan.includes('96.5%'))
    assert.ok(hl[1].ringkasan.includes('150 ayat'))
    assert.ok(hl[2].ringkasan.includes('Abdullah'))
  })

  it('8. Validasi kelengkapan laporan mendeteksi kekurangan data secara adil', () => {
    const mockReport: WeeklyReportTemplateData = {
      metadata: {
        nama_laporan: 'Laporan Pekanan',
        cabang: 'Mekkah',
        pekan_ke: 1,
        bulan: 'Oktober',
        tahun: 2026,
        tanggal_awal: '2026-10-04',
        tanggal_akhir: '2026-10-10',
        tanggal_disiapkan: '2026-10-08',
        koordinator: 'Ustadz Fulan',
        status: 'draft',
      },
      executive_summary: {
        highlights: [
          { id: '1', kategori: 'A', judul: 'A', ringkasan: 'A' },
          { id: '2', kategori: 'B', judul: 'B', ringkasan: 'B' },
          { id: '3', kategori: 'C', judul: 'C', ringkasan: 'C' },
        ],
      },
      mutabaah: { catatan_evaluasi: 'Mutabaah baik.' },
      quran: { catatan_evaluasi: 'Setoran konsisten.' },
      tahfidz_kualitas: { attention_point: 'Perlu bimbingan makhraj.', catatan_perkembangan: {} },
      arabic_speaking: {
        vlog_schedule: [{ id: 'v1', hari: 'Senin', tanggal: '2026-10-05', nama_peserta: 'Ali', judul_topik: 'Al-Haram', status: 'Selesai' }],
        podcast_wat: { nama_kegiatan: 'Weekend Arabic Talk', status: 'Terjadwal', hari_tanggal: 'Sabtu', peserta: 'Semua', host: 'Ustadz', topik: 'Rihlah' },
        catatan_evaluasi: 'Lancarkan kosakata.',
      },
      program_activities: { manual_activities: [], catatan_umum: 'Kegiatan lancar.' },
      documentation: {
        photos: [
          { slot: 1, public_url: 'https://example.com/1.jpg' },
          { slot: 2, public_url: 'https://example.com/2.jpg' },
          { slot: 3, public_url: 'https://example.com/3.jpg' },
          { slot: 4, public_url: 'https://example.com/4.jpg' },
        ],
      },
      kendala: { tidak_ada_kendala: true, items: [] },
      fokus_pekan_depan: {
        items: [
          { id: 'f1', kategori: 'Qur\'an', judul: 'Tahfidz', deskripsi_target: 'Target', rencana_tindakan: 'Aksi', indikator_keberhasilan: 'Sukses', status: 'rencana' },
          { id: 'f2', kategori: 'Mutabaah', judul: 'Amalan', deskripsi_target: 'Target', rencana_tindakan: 'Aksi', indikator_keberhasilan: 'Sukses', status: 'rencana' },
          { id: 'f3', kategori: 'Arabic', judul: 'Bahasa', deskripsi_target: 'Target', rencana_tindakan: 'Aksi', indikator_keberhasilan: 'Sukses', status: 'rencana' },
        ],
      },
    }

    const val = validateWeeklyReportCompleteness(mockReport, true)
    assert.equal(val.isValid, true)
    assert.equal(val.status, 'ready')
    assert.equal(val.completedSectionsCount, 10)
  })
})
