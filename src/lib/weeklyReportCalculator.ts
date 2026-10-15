/**
 * Pure Calculation & Aggregation Functions for Weekly Report Koordinator
 * Ensures data integrity, prevents hallucinations, and enforces business rules.
 */

import type {
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyMutabaah,
  Submission,
  Student,
} from '../types/database'
import type {
  ExecutiveHighlight,
  WeeklyReportTemplateData,
} from '../types/weeklyReportTemplate'
import { ALL_SURAHS } from '../data/staticData'

/**
 * Calculates overall average attendance percentage.
 * Returns null if no active data available.
 */
export function calculateAttendanceAverage(attendanceList: WeeklyAttendance[]): number | null {
  if (!attendanceList || attendanceList.length === 0) return null
  const valid = attendanceList.filter((a) => a.total_sesi > 0)
  if (valid.length === 0) return null
  const sum = valid.reduce((acc, curr) => acc + (curr.persen_kehadiran || 0), 0)
  return Math.round((sum / valid.length) * 10) / 10
}

/**
 * Calculates Quran aggregates (Ziyadah, Muraja'ah, Total).
 * Ensures consistency: Total = Ziyadah + Muraja'ah.
 */
export function calculateQuranAggregates(quranList: WeeklyQuran[]): {
  totalZiyadah: number
  totalMurajaah: number
  totalAyat: number
} {
  if (!quranList || quranList.length === 0) {
    return { totalZiyadah: 0, totalMurajaah: 0, totalAyat: 0 }
  }
  let totalZiyadah = 0
  let totalMurajaah = 0

  for (const q of quranList) {
    totalZiyadah += q.total_ziyadah_ayat || 0
    totalMurajaah += q.total_murajaah_ayat || 0
  }

  return {
    totalZiyadah,
    totalMurajaah,
    totalAyat: totalZiyadah + totalMurajaah,
  }
}

/**
 * Calculates overall average mutabaah percentage across students with recorded days.
 */
export function calculateMutabaahAverage(mutabaahList: WeeklyMutabaah[]): number | null {
  if (!mutabaahList || mutabaahList.length === 0) return null
  const withRecords = mutabaahList.filter((m) => m.hari_terisi > 0)
  if (withRecords.length === 0) return null
  const sum = withRecords.reduce((acc, curr) => acc + (curr.rata_skor_mutabaah || 0), 0)
  return Math.round((sum / withRecords.length) * 10) / 10
}

/**
 * Determines majority kelancaran status with explicit tie-handling.
 * Does not guess or default to Lancar if data is missing.
 */
export function calculateMajorityStatus(studentSubmissions: Submission[]): string {
  if (!studentSubmissions || studentSubmissions.length === 0) {
    return 'Belum ada data'
  }

  const counts: Record<'lancar' | 'kurang_lancar' | 'mengulang', number> = {
    lancar: 0,
    kurang_lancar: 0,
    mengulang: 0,
  }

  for (const sub of studentSubmissions) {
    if (sub.status && counts[sub.status] !== undefined) {
      counts[sub.status]++
    }
  }

  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  const maxCount = entries[0][1]

  if (maxCount === 0) {
    return 'Belum ada data'
  }

  const topStatuses = entries.filter((e) => e[1] === maxCount)

  const formatLabel = (st: string) => {
    if (st === 'lancar') return 'Lancar'
    if (st === 'kurang_lancar') return 'Kurang'
    return 'Ulang'
  }

  if (topStatuses.length === 1) {
    return formatLabel(topStatuses[0][0])
  } else if (topStatuses.length === 2) {
    return `Seri: ${formatLabel(topStatuses[0][0])} & ${formatLabel(topStatuses[1][0])}`
  } else {
    return 'Seri Tiga Status'
  }
}

/**
 * Calculates the score range (min–max) or single score.
 */
export function calculateScoreRange(studentSubmissions: Submission[]): string {
  if (!studentSubmissions || studentSubmissions.length === 0) {
    return 'Belum ada nilai'
  }

  const scores = studentSubmissions
    .map((s) => s.nilai)
    .filter((n): n is number => n !== null && n !== undefined && !isNaN(n))

  if (scores.length === 0) {
    return 'Belum ada nilai'
  }

  const min = Math.min(...scores)
  const max = Math.max(...scores)

  if (min === max) {
    return String(min)
  }
  return `${min}–${max}`
}

/**
 * Retrieves the latest Ziyadah submission detail (surah and ayat).
 */
export function getLatestZiyadah(studentSubmissions: Submission[]): string {
  if (!studentSubmissions || studentSubmissions.length === 0) return '—'

  // Filter ziyadah or Quran details sorted by date/id descending
  const ziyadahSubs = studentSubmissions
    .filter((s) => s.jenis === 'ziyadah' || s.quran_details?.length)
    .sort((a, b) => (b.tanggal || '').localeCompare(a.tanggal || '') || (b.id || 0) - (a.id || 0))

  if (ziyadahSubs.length === 0) return '—'

  const latest = ziyadahSubs[0]
  const qDetail = latest.quran_details?.[0]
  if (qDetail) {
    const sAwal = ALL_SURAHS.find((s) => s.nomor === qDetail.surah_awal)?.nama_latin || `QS ${qDetail.surah_awal}`
    const sAkhir = ALL_SURAHS.find((s) => s.nomor === qDetail.surah_akhir)?.nama_latin || `QS ${qDetail.surah_akhir}`
    if (qDetail.surah_awal === qDetail.surah_akhir) {
      return `${sAwal}: ${qDetail.ayat_awal}–${qDetail.ayat_akhir}`
    }
    return `${sAwal}: ${qDetail.ayat_awal} s/d ${sAkhir}: ${qDetail.ayat_akhir}`
  }

  return `${latest.capaian} ${latest.satuan}`
}

/**
 * Generates intelligent highlight suggestions based strictly on real metrics.
 */
export function generateSuggestedHighlights(params: {
  attendanceAvg: number | null
  totalAyat: number
  totalZiyadah: number
  totalMurajaah: number
  mutabaahAvg: number | null
  quranList: WeeklyQuran[]
  students: Student[]
}): ExecutiveHighlight[] {
  const highlights: ExecutiveHighlight[] = []

  // 1. Kehadiran
  if (params.attendanceAvg !== null) {
    highlights.push({
      id: 'hl-kehadiran',
      kategori: 'Kehadiran KBM',
      judul: 'Tingkat Kehadiran Santri',
      ringkasan: `Rata-rata kehadiran santri pada KBM dan halaqah pekan ini mencapai ${params.attendanceAvg}%.`,
      sumber_metrik: `${params.attendanceAvg}% Kehadiran`,
    })
  } else {
    highlights.push({
      id: 'hl-kehadiran',
      kategori: 'Kehadiran KBM',
      judul: 'Tingkat Kehadiran Santri',
      ringkasan: 'Data presensi pekan ini masih dalam proses pencatatan.',
      sumber_metrik: 'Data belum lengkap',
    })
  }

  // 2. Capaian Tahfidz
  if (params.totalAyat > 0) {
    highlights.push({
      id: 'hl-tahfidz',
      kategori: 'Capaian Tahfidz',
      judul: 'Akumulasi Setoran Al-Qur\'an',
      ringkasan: `Akumulasi setoran Al-Qur'an pekan ini sebesar ${params.totalAyat} ayat (${params.totalZiyadah} ayat ziyadah hafalan baru & ${params.totalMurajaah} ayat muraja'ah).`,
      sumber_metrik: `${params.totalAyat} Ayat`,
    })
  } else {
    highlights.push({
      id: 'hl-tahfidz',
      kategori: 'Capaian Tahfidz',
      judul: 'Akumulasi Setoran Al-Qur\'an',
      ringkasan: 'Belum ada setoran Al-Qur\'an yang tercatat pada pekan terpilih.',
      sumber_metrik: '0 Ayat',
    })
  }

  // 3. Top Performer Santri
  if (params.quranList && params.quranList.length > 0) {
    const sorted = [...params.quranList].sort((a, b) => (b.total_quran_ayat || 0) - (a.total_quran_ayat || 0))
    const top = sorted[0]
    if (top && (top.total_quran_ayat || 0) > 0) {
      const studentName = params.students.find((s) => s.id === top.student_id)?.nama || 'Santri'
      highlights.push({
        id: 'hl-top',
        kategori: 'Capaian Tertinggi',
        judul: 'Santri dengan Setoran Terbanyak',
        ringkasan: `${studentName} meraih capaian setoran tertinggi dengan total ${top.total_quran_ayat} ayat (${top.total_ziyadah_ayat || 0} ziyadah & ${top.total_murajaah_ayat || 0} muraja'ah).`,
        sumber_metrik: `${top.total_quran_ayat} Ayat (${studentName})`,
      })
    }
  }

  // Fallback third highlight if no top performer
  if (highlights.length < 3) {
    highlights.push({
      id: 'hl-mutabaah',
      kategori: 'Ibadah Yaumiyyah',
      judul: 'Konsistensi Mutabaah',
      ringkasan: params.mutabaahAvg !== null
        ? `Rata-rata kedisiplinan amalan harian santri berada pada angka ${params.mutabaahAvg}%.`
        : 'Pencatatan mutabaah ibadah yaumiyyah santri berjalan aktif.',
      sumber_metrik: params.mutabaahAvg !== null ? `${params.mutabaahAvg}%` : undefined,
    })
  }

  return highlights
}

/**
 * Evaluates the completeness of the 10 sections of the report.
 * Does not force unpopulated items to be considered failures if marked 'tidak ada kendala' or 'belum berlangsung'.
 */
export function validateWeeklyReportCompleteness(
  data: WeeklyReportTemplateData,
  hasOperationalData: boolean
): {
  isValid: boolean
  status: 'draft' | 'needs_review' | 'ready' | 'incomplete'
  issues: string[]
  completedSectionsCount: number
} {
  const issues: string[] = []
  let completedSectionsCount = 0

  // 1. Metadata
  if (data.metadata.nama_laporan && data.metadata.koordinator && data.metadata.cabang) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 1 (Metadata): Nama laporan, cabang, atau koordinator belum lengkap.')
  }

  // 2. Executive Summary
  if (data.executive_summary.highlights && data.executive_summary.highlights.length >= 3) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 2 (Executive Summary): Lengkapi 3 highlight utama pekan ini.')
  }

  // 3. Mutabaah
  if (data.mutabaah.catatan_evaluasi && data.mutabaah.catatan_evaluasi.trim().length > 0) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 3 (Mutabaah): Catatan evaluasi kedisiplinan santri belum diisi.')
  }

  // 4. Capaian Quran
  if (data.quran.catatan_evaluasi && data.quran.catatan_evaluasi.trim().length > 0) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 4 (Capaian Qur\'an): Catatan evaluasi setoran Al-Qur\'an belum diisi.')
  }

  // 5. Kualitas Tahfidz
  if (data.tahfidz_kualitas.attention_point && data.tahfidz_kualitas.attention_point.trim().length > 0) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 5 (Kualitas Tahfidz): Attention point / aspek perhatian khusus belum diisi.')
  }

  // 6. Arabic Speaking
  const hasVlog = data.arabic_speaking.vlog_schedule && data.arabic_speaking.vlog_schedule.length > 0
  const hasPodcast = Boolean(data.arabic_speaking.podcast_wat.nama_kegiatan)
  if (hasVlog || hasPodcast) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 6 (Arabic Speaking): Jadwal Arabic Vlog atau Weekend Arabic Talk belum ditinjau.')
  }

  // 7. Program Activities
  if (hasOperationalData || (data.program_activities.manual_activities && data.program_activities.manual_activities.length > 0)) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 7 (Aktivitas Program): Belum ada aktivitas terdata atau ditambahkan.')
  }

  // 8. Documentation (4 Photos)
  const uploadedPhotos = (data.documentation.photos || []).filter((p) => p.public_url || p.storage_path)
  if (uploadedPhotos.length === 4) {
    completedSectionsCount++
  } else {
    issues.push(`Bagian 8 (Dokumentasi): Baru ${uploadedPhotos.length} dari 4 foto yang diunggah.`)
  }

  // 9. Kendala & Tindak Lanjut
  const hasKendala = data.kendala.tidak_ada_kendala || (data.kendala.items && data.kendala.items.length > 0)
  if (hasKendala) {
    // If there are items, check if any lack tindak_lanjut
    const incompleteItems = (data.kendala.items || []).filter((it) => !it.tindak_lanjut || !it.tindak_lanjut.trim())
    if (incompleteItems.length > 0) {
      issues.push(`Bagian 9 (Kendala): Terdapat ${incompleteItems.length} kendala yang belum memiliki rencana tindak lanjut.`)
    } else {
      completedSectionsCount++
    }
  } else {
    issues.push('Bagian 9 (Kendala): Belum ada kendala atau belum ditandai "Tidak ada kendala".')
  }

  // 10. Fokus Pekan Depan
  if (data.fokus_pekan_depan.items && data.fokus_pekan_depan.items.length >= 3) {
    completedSectionsCount++
  } else {
    issues.push('Bagian 10 (Fokus Pekan Berikutnya): Minimal 3 target fokus program pekan depan harus diisi.')
  }

  const isValid = issues.length === 0
  let status: 'draft' | 'needs_review' | 'ready' | 'incomplete' = 'draft'

  if (isValid) {
    status = 'ready'
  } else if (completedSectionsCount >= 7) {
    status = 'needs_review'
  } else {
    status = 'incomplete'
  }

  return {
    isValid,
    status,
    issues,
    completedSectionsCount,
  }
}
