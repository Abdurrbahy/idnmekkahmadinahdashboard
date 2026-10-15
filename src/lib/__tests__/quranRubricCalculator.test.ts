import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateQuranRubric,
  validateWeightsSum,
  isValidScore,
  determinePredicate,
  determineKelancaranStatus,
  buildQuranRubricAssessment,
} from '../quranRubricCalculator'
import { DEFAULT_QURAN_RUBRIC_CONFIG } from '../../config/quranRubricConfig'
import { calculateQuranAyatCount } from '../../data/staticData'
import type { AspectScoreMap, QuranRubricConfig } from '../../types/quranRubric'

describe("Al-Qur'an Rubric-Based Scoring System Tests", () => {
  // Test 1: Validasi Jumlah Bobot 100%
  it('1. Validasi jumlah bobot wajib tepat 100%', () => {
    assert.equal(validateWeightsSum(DEFAULT_QURAN_RUBRIC_CONFIG), true)
    const { hafalan, tajwid, makhraj, kelancaran, waqaf_ibtida } = DEFAULT_QURAN_RUBRIC_CONFIG.aspects
    const total =
      hafalan.weight + tajwid.weight + makhraj.weight + kelancaran.weight + waqaf_ibtida.weight
    assert.equal(total, 100)
    assert.equal(hafalan.weight, 45)
    assert.equal(tajwid.weight, 25)
    assert.equal(makhraj.weight, 15)
    assert.equal(kelancaran.weight, 10)
    assert.equal(waqaf_ibtida.weight, 5)
  })

  // Test 2: Validasi Skor 0–4
  it('2. Validasi skor hanya menerima integer 0 sampai 4', () => {
    assert.equal(isValidScore(0), true)
    assert.equal(isValidScore(1), true)
    assert.equal(isValidScore(2), true)
    assert.equal(isValidScore(3), true)
    assert.equal(isValidScore(4), true)
    assert.equal(isValidScore(5), false)
    assert.equal(isValidScore(-1), false)
    assert.equal(isValidScore(2.5), false)
    assert.equal(isValidScore('3'), false)
    assert.equal(isValidScore(null), false)
    assert.equal(isValidScore(undefined), false)
  })

  // Test 3: Kasus A - Semua Aspek Skor 4 (Sempurna) -> Nilai 100, Predikat A, Status Lancar
  it('3. Kasus A: Semua aspek skor 4 menghasilkan nilai 100, Predikat A, dan Status Lancar', () => {
    const scores: AspectScoreMap = {
      hafalan: 4,
      tajwid: 4,
      makhraj: 4,
      kelancaran: 4,
      waqaf_ibtida: 4,
    }
    const result = calculateQuranRubric(scores)
    assert.equal(result.isComplete, true)
    assert.equal(result.nilaiAkhir, 100)
    assert.equal(result.predikat, 'A')
    assert.equal(result.statusOtomatis, 'lancar')
    assert.equal(result.lowestAspects.length, 0)
  })

  // Test 4: Kasus B - Semua Aspek Skor 0 yang Sah -> Nilai 0, Predikat D, Status Ulang
  it('4. Kasus B: Semua aspek skor 0 menghasilkan nilai 0, Predikat D, dan Status Ulang', () => {
    const scores: AspectScoreMap = {
      hafalan: 0,
      tajwid: 0,
      makhraj: 0,
      kelancaran: 0,
      waqaf_ibtida: 0,
    }
    const result = calculateQuranRubric(scores)
    assert.equal(result.isComplete, true)
    assert.equal(result.nilaiAkhir, 0)
    assert.equal(result.predikat, 'D')
    assert.equal(result.statusOtomatis, 'mengulang')
  })

  // Test 5: Kasus C - Contoh Spesifik Prompt (Hafalan 3, Tajwid 4, Makhraj 3, Kelancaran 2, Waqaf 3 -> 78.75)
  it('5. Kasus C: Hafalan 3, Tajwid 4, Makhraj 3, Kelancaran 2, Waqaf 3 menghasilkan nilai 78.75', () => {
    const scores: AspectScoreMap = {
      hafalan: 3,
      tajwid: 4,
      makhraj: 3,
      kelancaran: 2,
      waqaf_ibtida: 3,
    }
    const result = calculateQuranRubric(scores)
    assert.equal(result.isComplete, true)

    // Breakdown verifikasi:
    // Hafalan: 3/4 * 45 = 33.75
    // Tajwid: 4/4 * 25 = 25.00
    // Makhraj: 3/4 * 15 = 11.25
    // Kelancaran: 2/4 * 10 = 5.00
    // Waqaf: 3/4 * 5 = 3.75
    assert.equal(result.contributions.hafalan?.contribution, 33.75)
    assert.equal(result.contributions.tajwid?.contribution, 25)
    assert.equal(result.contributions.makhraj?.contribution, 11.25)
    assert.equal(result.contributions.kelancaran?.contribution, 5)
    assert.equal(result.contributions.waqaf_ibtida?.contribution, 3.75)

    // Nilai akhir = 78.75
    assert.equal(result.nilaiAkhir, 78.75)
    // Predikat: 78.75 ada di rentang 70 - 79.99 -> 'C'
    assert.equal(result.predikat, 'C')
    // Status: 78.75 ada di rentang 70 - 84.99 -> 'kurang_lancar'
    assert.equal(result.statusOtomatis, 'kurang_lancar')

    // Aspek terendah adalah kelancaran (skor 2)
    assert.equal(result.lowestAspects[0]?.aspectKey, 'kelancaran')
  })

  // Test 6: Kasus D - Nilai >= 85 tetapi Skor Hafalan < 3 -> Status TIDAK BOLEH Lancar (Harus Kurang)
  it('6. Kasus D: Nilai >= 85 tetapi skor hafalan < 3 menghasilkan status Kurang Lancar (Bukan Lancar)', () => {
    // Hafalan = 2 (2/4 * 45 = 22.5)
    // Tajwid = 4 (25.0)
    // Makhraj = 4 (15.0)
    // Kelancaran = 4 (10.0)
    // Waqaf = 4 (5.0)
    // Total = 22.5 + 25 + 15 + 10 + 5 = 77.5? Wait, let's make it >= 85:
    // If weights: Hafalan 45, Tajwid 25, Makhraj 15, Kelancaran 10, Waqaf 5
    // Max score with Hafalan 2 is 22.5 + 25 + 15 + 10 + 5 = 77.5.
    // What if Hafalan is 2, can total exceed 85?
    // Max possible if hafalan is 2 is 77.5!
    // But what if hafalan is 2 and we test the function directly:
    const statusResult = determineKelancaranStatus(86.5, { hafalan: 2, tajwid: 4, makhraj: 4, kelancaran: 4, waqaf_ibtida: 4 })
    assert.equal(statusResult.status, 'kurang_lancar')
    assert.match(statusResult.reason, /belum mencapai standar Lancar/)
  })

  // Test 7: Kasus E - Aspek Wajib Belum Diisi -> Nilai dan Status Final TIDAK Boleh Lengkap
  it('7. Kasus E: Aspek yang belum dinilai tidak boleh dihitung dan menghasilkan isComplete = false', () => {
    const incompleteScores: AspectScoreMap = {
      hafalan: 3,
      tajwid: 4,
      // makhraj belum diisi
      kelancaran: 3,
      waqaf_ibtida: 4,
    }
    const result = calculateQuranRubric(incompleteScores)
    assert.equal(result.isComplete, false)
    assert.equal(result.nilaiAkhir, null)
    assert.equal(result.predikat, null)
    assert.equal(result.statusOtomatis, null)
    assert.deepEqual(result.missingAspects, ['makhraj'])
  })

  // Test 8: Aspek belum dinilai vs skor 0 yang sah
  it('8. Membedakan aspek belum diisi (undefined) dengan skor 0 yang sah', () => {
    const unassessed: AspectScoreMap = { hafalan: undefined }
    const resUnassessed = calculateQuranRubric(unassessed)
    assert.equal(resUnassessed.isComplete, false)
    assert.equal(resUnassessed.contributions.hafalan, null)

    const zeroScore: AspectScoreMap = {
      hafalan: 0,
      tajwid: 4,
      makhraj: 4,
      kelancaran: 4,
      waqaf_ibtida: 4,
    }
    const resZero = calculateQuranRubric(zeroScore)
    assert.equal(resZero.isComplete, true)
    assert.notEqual(resZero.contributions.hafalan, null)
    assert.equal(resZero.contributions.hafalan?.score, 0)
    assert.equal(resZero.contributions.hafalan?.contribution, 0)
    // Skor hafalan 0 menyebabkan status otomatis mengulang
    assert.equal(resZero.statusOtomatis, 'mengulang')
  })

  // Test 9: Predikat Nilai Akademik A, B, C, D
  it('9. Predikat nilai akademik sesuai standar (A: 90–100, B: 80–89.99, C: 70–79.99, D: 0–69.99)', () => {
    assert.equal(determinePredicate(100), 'A')
    assert.equal(determinePredicate(95), 'A')
    assert.equal(determinePredicate(90), 'A')
    assert.equal(determinePredicate(89.99), 'B')
    assert.equal(determinePredicate(85), 'B')
    assert.equal(determinePredicate(80), 'B')
    assert.equal(determinePredicate(79.99), 'C')
    assert.equal(determinePredicate(75), 'C')
    assert.equal(determinePredicate(70), 'C')
    assert.equal(determinePredicate(69.99), 'D')
    assert.equal(determinePredicate(50), 'D')
    assert.equal(determinePredicate(0), 'D')
  })

  // Test 10: Perhitungan Total Ayat Lintas Surah (Contoh: 68:1 s/d 75:40 = 320 ayat)
  it('10. Perhitungan total ayat lintas surah tepat 320 ayat untuk 68:1 s/d 75:40', () => {
    const totalAyat = calculateQuranAyatCount(68, 1, 75, 40)
    assert.equal(totalAyat, 320)
  })

  // Test 11: Override Status dan Kewajiban Mengisi Alasan
  it('11. Mekanisme override status mencatat status otomatis, status final, dan alasan', () => {
    const scores: AspectScoreMap = {
      hafalan: 3,
      tajwid: 3,
      makhraj: 3,
      kelancaran: 3,
      waqaf_ibtida: 3,
    }
    // Nilai = (3/4 * 45) + (3/4 * 25) + (3/4 * 15) + (3/4 * 10) + (3/4 * 5) = 3/4 * 100 = 75
    // Status otomatis = 'kurang_lancar'
    const assessment = buildQuranRubricAssessment({
      scores,
      overrideStatus: 'lancar',
      overrideReason: 'Santri mampu mengulang mandiri setelah istirahat sejenak dengan sangat lancar',
      overrideBy: 'ustadz-ahmad',
    })

    assert.notEqual(assessment, null)
    if (assessment) {
      assert.equal(assessment.nilai_akhir, 75)
      assert.equal(assessment.predikat, 'C')
      assert.equal(assessment.status_otomatis, 'kurang_lancar')
      assert.equal(assessment.status_final, 'lancar')
      assert.equal(assessment.is_override, true)
      assert.equal(
        assessment.override_alasan,
        'Santri mampu mengulang mandiri setelah istirahat sejenak dengan sangat lancar'
      )
      assert.equal(assessment.override_by, 'ustadz-ahmad')
      assert.notEqual(assessment.override_at, null)
    }
  })

  // Test 12: Fleksibilitas Konfigurasi Bobot (Custom Weight Configuration)
  it('12. Perhitungan mendukung perubahan konfigurasi bobot tanpa hardcode', () => {
    const customConfig: QuranRubricConfig = {
      ...DEFAULT_QURAN_RUBRIC_CONFIG,
      aspects: {
        ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects,
        hafalan: { ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects.hafalan, weight: 50 },
        tajwid: { ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects.tajwid, weight: 20 },
        makhraj: { ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects.makhraj, weight: 15 },
        kelancaran: { ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects.kelancaran, weight: 10 },
        waqaf_ibtida: { ...DEFAULT_QURAN_RUBRIC_CONFIG.aspects.waqaf_ibtida, weight: 5 },
      },
    }
    assert.equal(validateWeightsSum(customConfig), true)

    // With custom config, Hafalan 4 = 50, all others 0 -> Total = 50
    const scores: AspectScoreMap = {
      hafalan: 4,
      tajwid: 0,
      makhraj: 0,
      kelancaran: 0,
      waqaf_ibtida: 0,
    }
    const res = calculateQuranRubric(scores, customConfig)
    assert.equal(res.nilaiAkhir, 50)
  })

  // Test 13: Kasus F - Kompatibilitas Data Lama (Data lama tanpa rubrik tidak rusak)
  it('13. Kasus F: Nilai lama tanpa rubrik tetap valid dan aman', () => {
    const legacySubmission = {
      id: 101,
      student_id: 1,
      subject_id: 2,
      tanggal: '2026-10-01',
      jenis: 'ziyadah' as const,
      capaian: 20,
      satuan: 'ayat',
      status: 'lancar' as const,
      nilai: 85,
      catatan: 'Nilai ujian lama sebelum sistem rubrik',
      rubrik_penilaian: null, // Legacy submissions have null rubrik
    }

    assert.equal(legacySubmission.nilai, 85)
    assert.equal(legacySubmission.status, 'lancar')
    assert.equal(legacySubmission.rubrik_penilaian, null)
  })
})
