import { addDaysToDate } from './dateUtils'

/**
 * Normalizes string to file-friendly slug (e.g., "Ahmad Faaiz Al-Ghufron" -> "Ahmad-Faaiz-Al-Ghufron")
 */
export const slugNama = (nama: string): string => {
  return nama
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]/g, '')
}

/**
 * Prints the page while temporarily setting document.title to control PDF download filename.
 */
export const cetakDenganNama = (namaFile: string) => {
  const judulLama = document.title
  document.title = namaFile
  window.print()
  // Revert document title after print dialog closes
  setTimeout(() => {
    document.title = judulLama
  }, 1000)
}

/**
 * Calculates which week of the month a week belongs to.
 * Rule: Both month and week number are determined strictly from Tuesday (midpoint of active week).
 * Week number is the ordinal of Tuesday in that month: Math.floor((d - 1) / 7) + 1.
 * Example: 2026-08-30 (Tuesday is 2026-09-01) -> Pekan-1 September 2026.
 *          2026-09-06 (Tuesday is 2026-09-08) -> Pekan-2 September 2026.
 */
export const nomorPekanBulan = (
  pekanMulaiStr: string
): {
  nomor: number
  namaBulan: string
  tahun: number
  labelPekan: string
} => {
  const selasa = addDaysToDate(pekanMulaiStr, 2)
  const [y, m, d] = selasa.split('-').map(Number)

  // Urutan Selasa ke berapa dalam bulan ini (1, 2, 3, 4, atau 5)
  const nomor = Math.floor((d - 1) / 7) + 1

  const namaBulan = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long' })
  const labelPekan = `Pekan-${nomor} ${namaBulan} ${y}`

  return {
    nomor,
    namaBulan,
    tahun: y,
    labelPekan,
  }
}

/**
 * Builds filename for daily report (single student or all students)
 */
export const namaFileLaporanHarian = (namaSantri: string | null, tanggalIso: string): string => {
  const santriPart = namaSantri ? slugNama(namaSantri) : 'Semua-Santri'
  return `Laporan-Harian_${santriPart}_${tanggalIso}`
}

/**
 * Builds filename for weekly report (single student or all students)
 */
export const namaFileLaporanPekanan = (
  namaSantri: string | null,
  pekanMulaiStr: string
): string => {
  const santriPart = namaSantri ? slugNama(namaSantri) : 'Semua-Santri'
  const { nomor, namaBulan, tahun } = nomorPekanBulan(pekanMulaiStr)
  return `Laporan-Pekanan_${santriPart}_Pekan-${nomor}-${namaBulan}-${tahun}`
}

/**
 * Builds filename for weekly management progress slides (Slide 1-9)
 */
export const namaFileSlideAtasan = (pekanMulaiStr: string): string => {
  const { nomor, namaBulan, tahun } = nomorPekanBulan(pekanMulaiStr)
  return `Weekly-Progress-Report_Pekan-${nomor}-${namaBulan}-${tahun}`
}

/**
 * Builds filename for 5-day batch daily report for one student
 */
export const namaFileDailyBatch = (namaSantri: string, pekanMulaiStr: string): string => {
  const santriPart = slugNama(namaSantri)
  const { nomor, namaBulan, tahun } = nomorPekanBulan(pekanMulaiStr)
  return `Laporan-Harian_${santriPart}_Pekan-${nomor}-${namaBulan}-${tahun}`
}
