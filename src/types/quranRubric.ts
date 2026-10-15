/**
 * Types for Al-Qur'an Rubric-Based Assessment
 * IDN Boarding School — Mekkah & Madinah
 */

export type QuranRubricAspectKey =
  | 'hafalan'
  | 'tajwid'
  | 'makhraj'
  | 'kelancaran'
  | 'waqaf_ibtida'

export type QuranRubricScore = 0 | 1 | 2 | 3 | 4

export type PredicateGrade = 'A' | 'B' | 'C' | 'D'

export type KelancaranStatus = 'lancar' | 'kurang_lancar' | 'mengulang'

export interface AspectDescriptor {
  score: QuranRubricScore
  label: string // e.g. 'Sangat Baik', 'Baik', etc.
  description: string // Specific observable indicator for this aspect
}

export interface AspectDefinition {
  key: QuranRubricAspectKey
  name: string
  shortLabel: string
  weight: number // Percentage, e.g. 45
  description: string
  descriptors: Record<QuranRubricScore, AspectDescriptor>
}

export interface PredicateThreshold {
  grade: PredicateGrade
  minScore: number // Inclusive
  maxScore: number // Inclusive or upper bound
  label: string
}

export interface StatusRulesConfig {
  lancar: {
    minNilaiAkhir: number // 85
    minSkorHafalan: QuranRubricScore // 3
  }
  kurang: {
    minNilaiAkhir: number // 70
    maxNilaiAkhir: number // 85
  }
  ulang: {
    maxNilaiAkhir: number // 70
    mandatoryFailConditions?: {
      aspect: QuranRubricAspectKey
      failScore: QuranRubricScore // e.g. hafalan === 0
    }[]
  }
}

export interface QuranRubricConfig {
  version: string
  aspects: Record<QuranRubricAspectKey, AspectDefinition>
  aspectOrder: QuranRubricAspectKey[]
  predicates: PredicateThreshold[]
  statusRules: StatusRulesConfig
}

export type AspectScoreMap = Partial<Record<QuranRubricAspectKey, QuranRubricScore>>

export interface AspectContribution {
  aspectKey: QuranRubricAspectKey
  name: string
  score: QuranRubricScore
  weight: number
  contribution: number // (score / 4) * weight
  maxContribution: number
}

export interface RubricCalculationResult {
  isComplete: boolean
  missingAspects: QuranRubricAspectKey[]
  contributions: Record<QuranRubricAspectKey, AspectContribution | null>
  nilaiAkhir: number | null // Formatted / rounded to max 2 decimals when complete
  nilaiAkhirRaw: number | null
  predikat: PredicateGrade | null
  statusOtomatis: KelancaranStatus | null
  statusOtomatisReason: string | null
  lowestAspects: {
    aspectKey: QuranRubricAspectKey
    name: string
    score: QuranRubricScore
    weight: number
  }[]
}

/**
 * Persisted rubric assessment structure in database (JSONB)
 */
export interface QuranRubricAssessment {
  versi_rubrik: string
  skor: Record<QuranRubricAspectKey, QuranRubricScore>
  bobot: Record<QuranRubricAspectKey, number>
  kontribusi: Record<QuranRubricAspectKey, number>
  nilai_akhir: number
  predikat: PredicateGrade
  status_otomatis: KelancaranStatus
  status_final: KelancaranStatus
  is_override: boolean
  override_alasan?: string | null
  override_by?: string | null
  override_at?: string | null
  lowest_aspects?: QuranRubricAspectKey[]
  evaluated_at?: string
}
