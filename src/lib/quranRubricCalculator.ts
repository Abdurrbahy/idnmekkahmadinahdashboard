/**
 * Pure calculation and validation logic for Quran Rubric Assessment.
 * Framework-agnostic, safe for both client and server runtime.
 */

import type {
  QuranRubricConfig,
  QuranRubricAspectKey,
  QuranRubricScore,
  AspectScoreMap,
  RubricCalculationResult,
  AspectContribution,
  PredicateGrade,
  KelancaranStatus,
  QuranRubricAssessment,
} from '../types/quranRubric'
import { DEFAULT_QURAN_RUBRIC_CONFIG } from '../config/quranRubricConfig'

/**
 * Validates that total weights in the configuration sum to exactly 100%
 */
export function validateWeightsSum(config: QuranRubricConfig = DEFAULT_QURAN_RUBRIC_CONFIG): boolean {
  const sum = config.aspectOrder.reduce((acc, key) => acc + (config.aspects[key]?.weight || 0), 0)
  return Math.abs(sum - 100) < 0.001
}

/**
 * Checks if a value is a valid score (0, 1, 2, 3, or 4)
 */
export function isValidScore(score: unknown): score is QuranRubricScore {
  return typeof score === 'number' && Number.isInteger(score) && score >= 0 && score <= 4
}

/**
 * Formats a number to at most 2 decimal places without trailing zeros (e.g. 78.75, 85, 92.5)
 */
export function roundToTwoDecimals(val: number): number {
  return Math.round(val * 100) / 100
}

/**
 * Determines academic predicate from calculated final score
 */
export function determinePredicate(
  score: number,
  config: QuranRubricConfig = DEFAULT_QURAN_RUBRIC_CONFIG
): PredicateGrade {
  for (const p of config.predicates) {
    if (score >= p.minScore && score <= p.maxScore) {
      return p.grade
    }
  }
  // Boundary fallback
  if (score >= 90) return 'A'
  if (score >= 80) return 'B'
  if (score >= 70) return 'C'
  return 'D'
}

/**
 * Determines automatic kelancaran status based on rules:
 * - LANCAR: Nilai akhir >= 85 AND skor ketepatan hafalan >= 3
 * - KURANG: Nilai akhir >= 70 dan < 85, ATAU nilai akhir >= 85 tapi hafalan < 3
 * - ULANG: Nilai akhir < 70, ATAU kegagalan fatal pada aspek wajib (hafalan === 0)
 */
export function determineKelancaranStatus(
  nilaiAkhir: number,
  scores: AspectScoreMap,
  config: QuranRubricConfig = DEFAULT_QURAN_RUBRIC_CONFIG
): { status: KelancaranStatus; reason: string } {
  const skorHafalan = scores.hafalan

  // Check mandatory fail condition first (e.g. hafalan === 0)
  if (skorHafalan === 0) {
    return {
      status: 'mengulang',
      reason: 'Aspek ketepatan hafalan belum menguasai (skor 0), mewajibkan ujian ulang.',
    }
  }

  // Check if score is below passing threshold (< 70)
  if (nilaiAkhir < config.statusRules.ulang.maxNilaiAkhir) {
    return {
      status: 'mengulang',
      reason: `Nilai akhir (${nilaiAkhir.toFixed(2)}) di bawah batas minimum kelulusan (${config.statusRules.ulang.maxNilaiAkhir}).`,
    }
  }

  // Check Lancar conditions
  const meetsLancarScore = nilaiAkhir >= config.statusRules.lancar.minNilaiAkhir
  const meetsHafalanCondition =
    skorHafalan !== undefined && skorHafalan >= config.statusRules.lancar.minSkorHafalan

  if (meetsLancarScore && meetsHafalanCondition) {
    return {
      status: 'lancar',
      reason: `Nilai akhir (${nilaiAkhir.toFixed(2)}) >= ${config.statusRules.lancar.minNilaiAkhir} dan ketepatan hafalan memenuhi standar minimal (skor ${skorHafalan}/4).`,
    }
  }

  // Kurang lancar: either score in [70, 85) OR score >= 85 but hafalan < 3
  if (meetsLancarScore && !meetsHafalanCondition) {
    return {
      status: 'kurang_lancar',
      reason: `Nilai akhir memadai (${nilaiAkhir.toFixed(2)}), namun skor ketepatan hafalan (${skorHafalan}/4) belum mencapai standar Lancar (minimal 3).`,
    }
  }

  return {
    status: 'kurang_lancar',
    reason: `Nilai akhir (${nilaiAkhir.toFixed(2)}) berada di rentang 70–84.99 (perlu perbaikan kelancaran).`,
  }
}

/**
 * Calculates complete rubric assessment from user-selected aspect scores.
 * Unselected aspects are preserved as undefined (not treated as 0).
 */
export function calculateQuranRubric(
  scores: AspectScoreMap,
  config: QuranRubricConfig = DEFAULT_QURAN_RUBRIC_CONFIG
): RubricCalculationResult {
  const missingAspects: QuranRubricAspectKey[] = []
  const contributions: Record<QuranRubricAspectKey, AspectContribution | null> = {
    hafalan: null,
    tajwid: null,
    makhraj: null,
    kelancaran: null,
    waqaf_ibtida: null,
  }

  let totalRawScore = 0

  for (const key of config.aspectOrder) {
    const scoreVal = scores[key]
    const aspectDef = config.aspects[key]

    if (scoreVal === undefined || scoreVal === null || !isValidScore(scoreVal)) {
      missingAspects.push(key)
      contributions[key] = null
    } else {
      const contribution = (scoreVal / 4) * aspectDef.weight
      totalRawScore += contribution
      contributions[key] = {
        aspectKey: key,
        name: aspectDef.name,
        score: scoreVal,
        weight: aspectDef.weight,
        contribution: roundToTwoDecimals(contribution),
        maxContribution: aspectDef.weight,
      }
    }
  }

  const isComplete = missingAspects.length === 0

  if (!isComplete) {
    return {
      isComplete: false,
      missingAspects,
      contributions,
      nilaiAkhir: null,
      nilaiAkhirRaw: null,
      predikat: null,
      statusOtomatis: null,
      statusOtomatisReason: null,
      lowestAspects: [],
    }
  }

  const nilaiAkhir = roundToTwoDecimals(totalRawScore)
  const predikat = determinePredicate(nilaiAkhir, config)
  const { status, reason } = determineKelancaranStatus(nilaiAkhir, scores, config)

  // Identify lowest scoring aspects (sorted by score ascending)
  const evaluatedAspects = config.aspectOrder
    .map((k) => ({
      aspectKey: k,
      name: config.aspects[k].name,
      score: scores[k] as QuranRubricScore,
      weight: config.aspects[k].weight,
    }))
    .sort((a, b) => a.score - b.score)

  // Only consider as "lowest" if score < 4, up to 2 aspects
  const lowestAspects = evaluatedAspects.filter((a) => a.score <= 2).slice(0, 2)

  return {
    isComplete: true,
    missingAspects: [],
    contributions,
    nilaiAkhir,
    nilaiAkhirRaw: totalRawScore,
    predikat,
    statusOtomatis: status,
    statusOtomatisReason: reason,
    lowestAspects,
  }
}

/**
 * Builds the final JSONB payload ready to persist in the database
 */
export function buildQuranRubricAssessment(params: {
  scores: AspectScoreMap
  overrideStatus?: KelancaranStatus | null
  overrideReason?: string | null
  overrideBy?: string | null
  config?: QuranRubricConfig
}): QuranRubricAssessment | null {
  const { scores, overrideStatus, overrideReason, overrideBy, config = DEFAULT_QURAN_RUBRIC_CONFIG } = params

  const calc = calculateQuranRubric(scores, config)
  if (!calc.isComplete || calc.nilaiAkhir === null || !calc.predikat || !calc.statusOtomatis) {
    return null
  }

  const skorRecord = {} as Record<QuranRubricAspectKey, QuranRubricScore>
  const bobotRecord = {} as Record<QuranRubricAspectKey, number>
  const kontribusiRecord = {} as Record<QuranRubricAspectKey, number>

  for (const k of config.aspectOrder) {
    skorRecord[k] = scores[k] as QuranRubricScore
    bobotRecord[k] = config.aspects[k].weight
    kontribusiRecord[k] = calc.contributions[k]?.contribution || 0
  }

  const isOverride = Boolean(overrideStatus && overrideStatus !== calc.statusOtomatis)

  return {
    versi_rubrik: config.version,
    skor: skorRecord,
    bobot: bobotRecord,
    kontribusi: kontribusiRecord,
    nilai_akhir: calc.nilaiAkhir,
    predikat: calc.predikat,
    status_otomatis: calc.statusOtomatis,
    status_final: isOverride && overrideStatus ? overrideStatus : calc.statusOtomatis,
    is_override: isOverride,
    override_alasan: isOverride ? overrideReason?.trim() || null : null,
    override_by: isOverride ? overrideBy || null : null,
    override_at: isOverride ? new Date().toISOString() : null,
    lowest_aspects: calc.lowestAspects.map((a) => a.aspectKey),
    evaluated_at: new Date().toISOString(),
  }
}
