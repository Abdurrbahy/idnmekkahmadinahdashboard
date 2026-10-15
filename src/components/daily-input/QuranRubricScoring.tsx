import React, { useMemo, useState } from 'react'
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import type {
  AspectScoreMap,
  QuranRubricAspectKey,
  QuranRubricScore,
  KelancaranStatus,
  RubricCalculationResult,
} from '@/types/quranRubric'
import { DEFAULT_QURAN_RUBRIC_CONFIG } from '@/config/quranRubricConfig'
import { calculateQuranRubric } from '@/lib/quranRubricCalculator'

interface QuranRubricScoringProps {
  scores: AspectScoreMap
  onScoresChange: (scores: AspectScoreMap) => void
  overrideStatus?: KelancaranStatus | null
  onOverrideStatusChange?: (status: KelancaranStatus | null) => void
  overrideReason?: string
  onOverrideReasonChange?: (reason: string) => void
  onAppendNote?: (noteText: string) => void
  readOnly?: boolean
}

export const QuranRubricScoring: React.FC<QuranRubricScoringProps> = ({
  scores,
  onScoresChange,
  overrideStatus = null,
  onOverrideStatusChange,
  overrideReason = '',
  onOverrideReasonChange,
  onAppendNote,
  readOnly = false,
}) => {
  const config = DEFAULT_QURAN_RUBRIC_CONFIG
  const [showOverrideSection, setShowOverrideSection] = useState(Boolean(overrideStatus))
  const [activeDescriptorTab, setActiveDescriptorTab] = useState<Record<QuranRubricAspectKey, QuranRubricScore | null>>({
    hafalan: null,
    tajwid: null,
    makhraj: null,
    kelancaran: null,
    waqaf_ibtida: null,
  })

  // Real-time calculation
  const calcResult: RubricCalculationResult = useMemo(() => {
    return calculateQuranRubric(scores, config)
  }, [scores, config])

  const scoredCount = useMemo(() => {
    return config.aspectOrder.filter((k) => scores[k] !== undefined && scores[k] !== null).length
  }, [scores, config.aspectOrder])

  const handleScoreSelect = (aspectKey: QuranRubricAspectKey, score: QuranRubricScore) => {
    if (readOnly) return
    onScoresChange({
      ...scores,
      [aspectKey]: score,
    })
  }

  const handleResetScores = () => {
    if (readOnly) return
    if (window.confirm('Reset seluruh skor rubrik penilaian Al-Qur\'an?')) {
      onScoresChange({})
      if (onOverrideStatusChange) onOverrideStatusChange(null)
      if (onOverrideReasonChange) onOverrideReasonChange('')
      setShowOverrideSection(false)
    }
  }

  const handleInsertLowestNote = (aspectName: string, aspectScore: number) => {
    if (!onAppendNote) return
    const text = `Perlu perbaikan pada ${aspectName} (skor ${aspectScore}/4). `
    onAppendNote(text)
  }

  return (
    <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-3 sm:p-4 space-y-4">
      {/* 1. Header Rubrik */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-900 text-white shadow-2xs">
            <Award className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-neutral-900">
                Rubrik Penilaian Ujian Al-Qur'an
              </h3>
              <Badge variant="outline" className="text-[10px] font-bold bg-white text-neutral-700 border-neutral-300">
                v{config.version} • 5 Aspek (100%)
              </Badge>
            </div>
            <p className="text-[11px] text-neutral-500">
              Penilaian objektif berbasis standar kompetensi tahfidz IDN
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-neutral-500">
            {scoredCount}/5 aspek dinilai
          </span>
          {scoredCount > 0 && !readOnly && (
            <button
              type="button"
              onClick={handleResetScores}
              className="text-[11px] font-semibold text-neutral-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-1.5 py-0.5 rounded hover:bg-neutral-200/60"
              title="Reset pilihan rubrik"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Daftar 5 Aspek Penilaian */}
      <div className="space-y-3">
        {config.aspectOrder.map((key, idx) => {
          const aspectDef = config.aspects[key]
          const currentScore = scores[key]
          const isSelected = currentScore !== undefined && currentScore !== null
          const activeDescScore: QuranRubricScore =
            activeDescriptorTab[key] !== null && activeDescriptorTab[key] !== undefined
              ? (activeDescriptorTab[key] as QuranRubricScore)
              : isSelected
              ? (currentScore as QuranRubricScore)
              : 3 // Default indicator guide to show

          return (
            <div
              key={key}
              className={`rounded-xl border p-3 transition-all ${
                isSelected
                  ? 'border-neutral-300 bg-white shadow-2xs'
                  : 'border-amber-200/80 bg-amber-50/20'
              }`}
            >
              {/* Aspek Header */}
              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-900">
                    {idx + 1}. {aspectDef.name}
                  </span>
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-bold">
                    Bobot {aspectDef.weight}%
                  </Badge>
                </div>

                <div>
                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Skor {currentScore} • {aspectDef.descriptors[currentScore].label}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 animate-pulse">
                      <AlertTriangle className="h-3 w-3" />
                      Belum dinilai
                    </span>
                  )}
                </div>
              </div>

              {/* Deskripsi Aspek */}
              <p className="text-[11px] text-neutral-500 mb-2 leading-relaxed">
                {aspectDef.description}
              </p>

              {/* Tombol Pilihan Skor (0-4 Segmented Control) */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                {([0, 1, 2, 3, 4] as QuranRubricScore[]).map((sc) => {
                  const isCurrent = currentScore === sc
                  const desc = aspectDef.descriptors[sc]

                  return (
                    <button
                      key={sc}
                      type="button"
                      disabled={readOnly}
                      onClick={() => handleScoreSelect(key, sc)}
                      onMouseEnter={() =>
                        setActiveDescriptorTab((prev) => ({ ...prev, [key]: sc }))
                      }
                      onMouseLeave={() =>
                        setActiveDescriptorTab((prev) => ({ ...prev, [key]: null }))
                      }
                      className={`relative flex flex-col items-center justify-center rounded-lg p-2 min-h-[46px] border text-center transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900 ${
                        isCurrent
                          ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs font-bold scale-[1.02]'
                          : 'border-neutral-200/90 bg-white text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50'
                      }`}
                      aria-label={`${aspectDef.name} skor ${sc} (${desc.label})`}
                    >
                      <span className={`text-xs font-extrabold ${isCurrent ? 'text-white' : 'text-neutral-900'}`}>
                        {sc}
                      </span>
                      <span className={`text-[9px] truncate max-w-full ${isCurrent ? 'text-neutral-200 font-semibold' : 'text-neutral-500'}`}>
                        {desc.label.split(' ')[0]}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Observable Indicator Callout */}
              <div className="mt-2 rounded-lg bg-neutral-100/70 border border-neutral-200/60 p-2 text-[11px] text-neutral-600 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-neutral-800">
                    Indikator Skor {activeDescScore} ({aspectDef.descriptors[activeDescScore].label}):{' '}
                  </span>
                  <span>{aspectDef.descriptors[activeDescScore].description}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 3. Panel Ringkasan Hasil Otomatis (Real-time Panel) */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
          <span className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            Panel Hasil Penilaian Otomatis
          </span>
          {calcResult.isComplete && (
            <Badge variant="outline" className="text-[10px] font-bold bg-neutral-50 text-neutral-700">
              Kalkulasi Real-time
            </Badge>
          )}
        </div>

        {!calcResult.isComplete ? (
          /* State: Belum Lengkap */
          <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0" />
              <span>Lengkapi penilaian seluruh aspek untuk menghitung nilai akhir</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Masih ada {calcResult.missingAspects.length} aspek yang belum dinilai (
              {calcResult.missingAspects.map((k) => config.aspects[k].name).join(', ')}).
              Sistem tidak mengasumsikan nilai 0 secara otomatis sebelum ustadz memilih skor secara sadar.
            </p>
          </div>
        ) : (
          /* State: Lengkap -> Tampilkan Nilai, Predikat, Status, Kontribusi, dan Aspek Terendah */
          <div className="space-y-3">
            {/* Top Stat Row: Nilai Akhir, Predikat, Status Kelancaran */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Nilai Akhir */}
              <div className="p-3 rounded-xl bg-neutral-900 text-white flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold">
                  Nilai Akhir
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {calcResult.nilaiAkhir !== null ? calcResult.nilaiAkhir.toFixed(2).replace(/\.00$/, '') : '—'}
                  </span>
                  <span className="text-xs text-neutral-400 font-semibold">/ 100</span>
                </div>
                <span className="text-[10px] text-neutral-400 mt-0.5">
                  Akumulasi bobot 5 aspek
                </span>
              </div>

              {/* Predikat Nilai */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                  Predikat Akademik
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-black text-neutral-900">
                    {calcResult.predikat}
                  </span>
                  <span className="text-xs font-semibold text-neutral-600">
                    {config.predicates.find((p) => p.grade === calcResult.predikat)?.label.split(' ')[0]}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400">
                  {config.predicates.find((p) => p.grade === calcResult.predikat)?.label}
                </span>
              </div>

              {/* Status Kelancaran */}
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col justify-between">
                <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
                  Hasil Kelancaran
                </span>
                <div className="mt-1">
                  {calcResult.statusOtomatis === 'lancar' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white font-bold text-xs shadow-2xs">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Lancar
                    </span>
                  ) : calcResult.statusOtomatis === 'kurang_lancar' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500 text-white font-bold text-xs shadow-2xs">
                      <AlertTriangle className="h-3.5 w-3.5" /> Kurang
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-600 text-white font-bold text-xs shadow-2xs">
                      <RotateCcw className="h-3.5 w-3.5" /> Ulang
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-neutral-500 mt-1 line-clamp-1" title={calcResult.statusOtomatisReason || ''}>
                  {calcResult.statusOtomatisReason}
                </span>
              </div>
            </div>

            {/* Kontribusi Poin per Aspek */}
            <div className="rounded-lg bg-neutral-50/70 border border-neutral-200/80 p-2.5 space-y-1.5">
              <span className="text-[11px] font-bold text-neutral-700 block">
                Rincian Kontribusi Skor per Aspek:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {config.aspectOrder.map((k) => {
                  const contrib = calcResult.contributions[k]
                  if (!contrib) return null
                  const percentOfMax = Math.round((contrib.score / 4) * 100)

                  return (
                    <div key={k} className="p-2 rounded-lg bg-white border border-neutral-200 text-neutral-800">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-neutral-600">{contrib.name.split(' ')[0]}</span>
                        <span className="font-bold text-neutral-900">{contrib.contribution.toFixed(2)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            contrib.score >= 3
                              ? 'bg-emerald-600'
                              : contrib.score === 2
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${percentOfMax}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-neutral-400 mt-0.5 block">
                        Skor {contrib.score}/4 • Maks {contrib.maxContribution}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Aspek Terendah & Rekomendasi Perbaikan */}
            {calcResult.lowestAspects.length > 0 && (
              <div className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Area Perbaikan Utama Santri:
                  </span>
                  {onAppendNote && !readOnly && (
                    <button
                      type="button"
                      onClick={() =>
                        handleInsertLowestNote(
                          calcResult.lowestAspects[0].name,
                          calcResult.lowestAspects[0].score
                        )
                      }
                      className="text-[10px] font-bold text-rose-700 hover:text-rose-900 underline"
                    >
                      + Sisipkan ke Catatan Ustadz
                    </button>
                  )}
                </div>
                <div className="space-y-1 text-[11px] text-rose-800">
                  {calcResult.lowestAspects.map((low) => (
                    <div key={low.aspectKey} className="flex items-baseline gap-1">
                      <span className="font-semibold">• {low.name}:</span>
                      <span>
                        Skor {low.score}/4 ({config.aspects[low.aspectKey].descriptors[low.score].label}) —{' '}
                        {config.aspects[low.aspectKey].descriptors[low.score].description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Mekanisme Manual Override Status (Opsional) */}
            {!readOnly && onOverrideStatusChange && onOverrideReasonChange && (
              <div className="pt-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowOverrideSection(!showOverrideSection)}
                  className="flex items-center justify-between w-full text-xs font-semibold text-neutral-600 hover:text-neutral-900 py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-neutral-500" />
                    {overrideStatus
                      ? `Status Di-override ke "${overrideStatus.toUpperCase()}"`
                      : 'Pengecualian Status (Override Manual)'}
                  </span>
                  {showOverrideSection ? (
                    <ChevronUp className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  )}
                </button>

                {showOverrideSection && (
                  <div className="mt-2.5 p-3 rounded-lg bg-neutral-100/80 border border-neutral-200 text-xs space-y-2.5 animate-in fade-in duration-200">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        Pilih Status Pengganti (Override):
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOverrideStatusChange('lancar')}
                          className={`h-8 rounded-md text-xs font-bold transition-all ${
                            overrideStatus === 'lancar'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          Lancar
                        </button>
                        <button
                          type="button"
                          onClick={() => onOverrideStatusChange('kurang_lancar')}
                          className={`h-8 rounded-md text-xs font-bold transition-all ${
                            overrideStatus === 'kurang_lancar'
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          Kurang
                        </button>
                        <button
                          type="button"
                          onClick={() => onOverrideStatusChange('mengulang')}
                          className={`h-8 rounded-md text-xs font-bold transition-all ${
                            overrideStatus === 'mengulang'
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50'
                          }`}
                        >
                          Ulang
                        </button>
                      </div>
                    </div>

                    {overrideStatus && (
                      <div className="space-y-1">
                        <label className="font-semibold text-neutral-800 block text-[11px]">
                          Alasan Pengecualian / Override (Wajib Diisi):
                        </label>
                        <Textarea
                          rows={2}
                          value={overrideReason}
                          onChange={(e) => onOverrideReasonChange(e.target.value)}
                          placeholder="Jelaskan pertimbangan khusus mengapa status diubah dari rekomendasi rubrik..."
                          className="text-xs bg-white"
                          required
                        />
                        <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-0.5">
                          <span>Nilai numerik rubrik ({calcResult.nilaiAkhir}) tetap dipertahankan.</span>
                          <button
                            type="button"
                            onClick={() => {
                              onOverrideStatusChange(null)
                              onOverrideReasonChange('')
                              setShowOverrideSection(false)
                            }}
                            className="text-rose-600 hover:underline font-semibold"
                          >
                            Batalkan Override
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default QuranRubricScoring
