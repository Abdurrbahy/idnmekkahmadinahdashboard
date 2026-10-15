import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  FileText,
  TrendingUp,
  Sparkles,
  BookOpen,
  Award,
  MessageSquare,
  CalendarDays,
  Image,
  AlertTriangle,
  Target,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  pekanMulai,
  pekanSelesai,
  formatDateRiyadh,
  addDaysToDate,
} from '@/lib/dateUtils'
import { nomorPekanBulan } from '@/lib/printUtils'
import {
  fetchStudents,
  fetchWeeklyReport,
  saveWeeklyReport,
  fetchWeeklyAttendance,
  fetchWeeklyQuran,
  fetchWeeklyMutabaah,
  fetchWeeklySubmissions,
  fetchWeeklyActivities,
} from '@/lib/supabase'
import type {
  Student,
  WeeklyReport,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyMutabaah,
  Submission,
  Activity,
} from '@/types/database'
import type {
  ReportTab,
  WeeklyReportTemplateData,
} from '@/types/weeklyReportTemplate'
import {
  REPORT_SECTION_ORDER,
  DEFAULT_FOKUS_PEKAN_DEPAN,
} from '@/types/weeklyReportTemplate'
import {
  calculateAttendanceAverage,
  calculateQuranAggregates,
  calculateMutabaahAverage,
  generateSuggestedHighlights,
  validateWeeklyReportCompleteness,
} from '@/lib/weeklyReportCalculator'

import { WeeklyReportHeader } from '@/components/weekly-report/WeeklyReportHeader'
import { SectionMetadata } from '@/components/weekly-report/SectionMetadata'
import { SectionExecutiveSummary } from '@/components/weekly-report/SectionExecutiveSummary'
import { SectionMutabaah } from '@/components/weekly-report/SectionMutabaah'
import { SectionQuran } from '@/components/weekly-report/SectionQuran'
import { SectionTahfidzKualitas } from '@/components/weekly-report/SectionTahfidzKualitas'
import { SectionArabicSpeaking } from '@/components/weekly-report/SectionArabicSpeaking'
import { SectionProgramActivities } from '@/components/weekly-report/SectionProgramActivities'
import { SectionDocumentation } from '@/components/weekly-report/SectionDocumentation'
import { SectionKendala } from '@/components/weekly-report/SectionKendala'
import { SectionFokusBerikutnya } from '@/components/weekly-report/SectionFokusBerikutnya'
import { ValidationModal } from '@/components/weekly-report/ValidationModal'

export const WeeklyReportFormPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Guard: Admin can edit, Atasan is read-only, Walsan is blocked
  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'
  const canEdit = userRole === 'admin'
  const readOnly = !canEdit

  useEffect(() => {
    if (profile && !isStaff) {
      navigate('/', { replace: true })
    }
  }, [profile, isStaff, navigate])

  // Current Week Parameter (Always Ahad / Sunday in Asia/Riyadh)
  const defaultPekan = pekanMulai(todayRiyadh())
  const rawPekan = searchParams.get('pekan') || defaultPekan
  const currentPekan = pekanMulai(rawPekan)

  // Section Tab Navigation
  const tabParam = searchParams.get('tab') as ReportTab | null
  const initialTab: ReportTab =
    tabParam && REPORT_SECTION_ORDER.some((s) => s.key === tabParam)
      ? tabParam
      : 'metadata'
  const [activeTab, setActiveTab] = useState<ReportTab>(initialTab)

  // Loading & Save States
  const [loading, setLoading] = useState(true)
  const [saveState, setSaveState] = useState<'idle' | 'unsaved' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isValidationOpen, setIsValidationOpen] = useState(false)

  // Save race-condition protection ref
  const isSavingRef = useRef(false)

  // Master & Operational Data States
  const [students, setStudents] = useState<Student[]>([])
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance[]>([])
  const [weeklyQuran, setWeeklyQuran] = useState<WeeklyQuran[]>([])
  const [weeklyMutabaah, setWeeklyMutabaah] = useState<WeeklyMutabaah[]>([])
  const [weeklySubmissions, setWeeklySubmissions] = useState<Submission[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([])

  // Main Report DB Entity
  const [currentReportId, setCurrentReportId] = useState<number | undefined>(undefined)

  // 10 Sections Template State
  const weekInfo = useMemo(() => nomorPekanBulan(currentPekan), [currentPekan])
  const pSelesai = useMemo(() => pekanSelesai(currentPekan), [currentPekan])

  const initialTemplateState: WeeklyReportTemplateData = useMemo(() => {
    return {
      metadata: {
        nama_laporan: 'Laporan Pekanan Program IDN Mekkah Madinah',
        cabang: 'Mekkah & Madinah',
        pekan_ke: weekInfo.nomor,
        bulan: weekInfo.namaBulan,
        tahun: weekInfo.tahun,
        tanggal_awal: currentPekan,
        tanggal_akhir: pSelesai,
        tanggal_disiapkan: todayRiyadh(),
        koordinator: profile?.nama || profile?.email?.split('@')[0] || 'Ustadz Koordinator',
        status: 'draft',
      },
      executive_summary: {
        highlights: [],
      },
      mutabaah: {
        catatan_evaluasi: '',
      },
      quran: {
        catatan_evaluasi: '',
      },
      tahfidz_kualitas: {
        attention_point: '',
        catatan_perkembangan: {},
      },
      arabic_speaking: {
        vlog_schedule: [
          {
            id: 'vlog-1',
            hari: 'Senin',
            tanggal: addDaysToDate(currentPekan, 1),
            nama_peserta: '',
            judul_topik: 'Percakapan Bahasa Arab Sehari-hari',
            status: 'Terjadwal',
          },
          {
            id: 'vlog-2',
            hari: 'Rabu',
            tanggal: addDaysToDate(currentPekan, 3),
            nama_peserta: '',
            judul_topik: 'Mendeskripsikan Suasana Masjid Nabawi',
            status: 'Terjadwal',
          },
        ],
        podcast_wat: {
          nama_kegiatan: 'Weekend Arabic Talk (WAT)',
          status: 'Terjadwal',
          hari_tanggal: 'Sabtu Malam Ba\'da Isya',
          peserta: 'Santri Halaqah',
          host: profile?.nama || 'Koordinator',
          topik: 'Pengalaman Ibadah dan Menuntut Ilmu di Kota Nabi',
        },
        catatan_evaluasi: '',
      },
      program_activities: {
        manual_activities: [],
        catatan_umum: '',
      },
      documentation: {
        photos: [
          { slot: 1 },
          { slot: 2 },
          { slot: 3 },
          { slot: 4 },
        ],
      },
      kendala: {
        tidak_ada_kendala: false,
        items: [],
      },
      fokus_pekan_depan: {
        items: DEFAULT_FOKUS_PEKAN_DEPAN.map((it, idx) => ({
          ...it,
          id: `fokus-${idx + 1}`,
        })),
      },
    }
  }, [currentPekan, weekInfo, pSelesai, profile])

  const [formData, setFormData] = useState<WeeklyReportTemplateData>(initialTemplateState)

  // 1. Load Students (Master Data)
  useEffect(() => {
    async function loadMaster() {
      const st = await fetchStudents()
      setStudents(st)
    }
    loadMaster()
  }, [])

  // 2. Load Operational Data & Report Data for selected week
  const loadWeekData = useCallback(async (pMulai: string) => {
    setLoading(true)
    setFeedback(null)
    setSaveState('idle')

    try {
      const [att, qrn, mtb, subs, acts, rep] = await Promise.all([
        fetchWeeklyAttendance(pMulai),
        fetchWeeklyQuran(pMulai),
        fetchWeeklyMutabaah(pMulai),
        fetchWeeklySubmissions(pMulai),
        fetchWeeklyActivities(pMulai),
        fetchWeeklyReport(pMulai),
      ])

      setWeeklyAttendance(att)
      setWeeklyQuran(qrn)
      setWeeklyMutabaah(mtb)
      setWeeklySubmissions(subs)
      setWeeklyActivities(acts)

      const wInfo = nomorPekanBulan(pMulai)
      const pEnd = pekanSelesai(pMulai)

      if (rep) {
        setCurrentReportId(rep.id)
        if (rep.report_data) {
          setFormData(rep.report_data)
        } else {
          // If existing report doesn't have report_data JSONB yet, build base from legacy columns
          const base: WeeklyReportTemplateData = {
            ...initialTemplateState,
            metadata: {
              ...initialTemplateState.metadata,
              tanggal_awal: pMulai,
              tanggal_akhir: pEnd,
              pekan_ke: wInfo.nomor,
              bulan: wInfo.namaBulan,
              tahun: wInfo.tahun,
              status: rep.status || 'draft',
            },
            mutabaah: {
              catatan_evaluasi: rep.catatan_umum || '',
            },
            quran: {
              catatan_evaluasi: rep.catatan_umum || '',
            },
            program_activities: {
              manual_activities: [],
              catatan_umum: rep.catatan_umum || '',
            },
            kendala: {
              tidak_ada_kendala: !rep.kendala,
              items: rep.kendala
                ? [
                    {
                      id: 'legacy-kendala',
                      judul: 'Catatan Kendala Pekan Ini',
                      deskripsi: rep.kendala,
                      dampak: 'Perlu penanganan',
                      prioritas: 'Sedang',
                      tindak_lanjut: 'Tindak lanjut oleh koordinator',
                      penanggung_jawab: 'Koordinator',
                      target_penyelesaian: 'Pekan depan',
                      status: 'Sedang berjalan',
                    },
                  ]
                : [],
            },
            fokus_pekan_depan: {
              items: DEFAULT_FOKUS_PEKAN_DEPAN.map((it, idx) => ({
                ...it,
                id: `fokus-${idx + 1}`,
              })),
            },
          }
          setFormData(base)
        }
      } else {
        // No report in DB yet, initialize new template
        setCurrentReportId(undefined)
        const newTemplate: WeeklyReportTemplateData = {
          ...initialTemplateState,
          metadata: {
            ...initialTemplateState.metadata,
            tanggal_awal: pMulai,
            tanggal_akhir: pEnd,
            pekan_ke: wInfo.nomor,
            bulan: wInfo.namaBulan,
            tahun: wInfo.tahun,
          },
        }
        setFormData(newTemplate)
      }
    } catch (err: any) {
      console.warn('Error loading week operational data:', err)
      setFeedback({ type: 'error', message: 'Gagal memuat data operasional pekan terpilih.' })
    } finally {
      setLoading(false)
    }
  }, [initialTemplateState])

  useEffect(() => {
    loadWeekData(currentPekan)
  }, [currentPekan, loadWeekData])

  // Aggregated Operational Metrics
  const attendanceAvg = useMemo(() => calculateAttendanceAverage(weeklyAttendance), [weeklyAttendance])
  const quranAggs = useMemo(() => calculateQuranAggregates(weeklyQuran), [weeklyQuran])
  const mutabaahAvg = useMemo(() => calculateMutabaahAverage(weeklyMutabaah), [weeklyMutabaah])
  const activeStudentsCount = useMemo(() => students.filter((s) => s.status === 'aktif').length, [students])

  // Completeness Validation
  const validationResult = useMemo(
    () => validateWeeklyReportCompleteness(formData, weeklyActivities.length > 0),
    [formData, weeklyActivities.length]
  )

  // Handle auto-suggest highlights
  const handleAutoSuggestHighlights = useCallback(() => {
    const suggested = generateSuggestedHighlights({
      attendanceAvg,
      totalAyat: quranAggs.totalAyat,
      totalZiyadah: quranAggs.totalZiyadah,
      totalMurajaah: quranAggs.totalMurajaah,
      mutabaahAvg,
      quranList: weeklyQuran,
      students,
    })
    setFormData((prev) => ({
      ...prev,
      executive_summary: {
        highlights: suggested,
      },
    }))
    setSaveState('unsaved')
  }, [attendanceAvg, quranAggs, mutabaahAvg, weeklyQuran, students])

  // If highlights are empty, auto-populate them once operational data loads
  useEffect(() => {
    if (!loading && formData.executive_summary.highlights.length === 0) {
      handleAutoSuggestHighlights()
    }
  }, [loading, formData.executive_summary.highlights.length, handleAutoSuggestHighlights])

  // Week change handler with unsaved confirmation
  const handleWeekChange = (newPekan: string) => {
    if (saveState === 'unsaved') {
      const confirmLeave = window.confirm(
        'Ada perubahan yang belum disimpan pada pekan ini. Pindah pekan dan abaikan perubahan?'
      )
      if (!confirmLeave) return
    }
    const newParams = new URLSearchParams(searchParams)
    newParams.set('pekan', newPekan)
    setSearchParams(newParams)
  }

  // Section Tab Change Handler
  const handleTabChange = (newTab: ReportTab) => {
    setActiveTab(newTab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    setSearchParams(newParams, { replace: true })
  }

  // --- SAVE LOGIC ---
  const handleSaveReport = async () => {
    if (!canEdit || isSavingRef.current) return
    isSavingRef.current = true
    setSaveState('saving')
    setFeedback(null)

    try {
      // Build top-level summary for backwards compatibility with legacy columns
      const legacyCatatan = [
        formData.mutabaah.catatan_evaluasi ? `[Mutabaah] ${formData.mutabaah.catatan_evaluasi}` : null,
        formData.quran.catatan_evaluasi ? `[Tahfidz] ${formData.quran.catatan_evaluasi}` : null,
      ]
        .filter(Boolean)
        .join('\n\n')

      const legacyKendala = formData.kendala.tidak_ada_kendala
        ? null
        : formData.kendala.items.map((it) => `${it.judul}: ${it.tindak_lanjut}`).join('\n')

      const legacyRencana = formData.fokus_pekan_depan.items
        .map((f) => `${f.kategori} - ${f.judul}: ${f.deskripsi_target}`)
        .join('\n')

      const payload: Partial<WeeklyReport> & { pekan_mulai: string } = {
        pekan_mulai: currentPekan,
        status: formData.metadata.status || 'draft',
        catatan_umum: legacyCatatan || null,
        kendala: legacyKendala || null,
        rencana_pekan_depan: legacyRencana || null,
        report_data: formData,
      }

      const res = await saveWeeklyReport(payload)

      if (res.success && res.data) {
        setCurrentReportId(res.data.id)
        setSaveState('saved')
        setLastSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }))
        setFeedback({ type: 'success', message: 'Laporan mingguan berhasil disimpan!' })
      } else {
        setSaveState('error')
        setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan laporan mingguan.' })
      }
    } catch (err: any) {
      setSaveState('error')
      setFeedback({ type: 'error', message: err.message || 'Terjadi kesalahan sistem saat menyimpan.' })
    } finally {
      isSavingRef.current = false
    }
  }

  // Update Section Helpers
  const updateSection = <K extends keyof WeeklyReportTemplateData>(
    section: K,
    updater: (prev: WeeklyReportTemplateData[K]) => WeeklyReportTemplateData[K]
  ) => {
    if (readOnly) return
    setFormData((prev) => ({
      ...prev,
      [section]: updater(prev[section]),
    }))
    setSaveState('unsaved')
  }

  // Section Icon mapping
  const getSectionIcon = (key: ReportTab) => {
    switch (key) {
      case 'metadata':
        return FileText
      case 'executive_summary':
        return TrendingUp
      case 'mutabaah':
        return Sparkles
      case 'quran':
        return BookOpen
      case 'tahfidz_kualitas':
        return Award
      case 'arabic_speaking':
        return MessageSquare
      case 'program_activities':
        return CalendarDays
      case 'documentation':
        return Image
      case 'kendala':
        return AlertTriangle
      case 'fokus_pekan_depan':
        return Target
    }
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Bar */}
      <WeeklyReportHeader
        currentPekan={currentPekan}
        onWeekChange={handleWeekChange}
        status={validationResult.status}
        saveState={saveState}
        lastSavedAt={lastSavedAt}
        canEdit={canEdit}
        onSave={handleSaveReport}
        onValidate={() => setIsValidationOpen(true)}
        onViewSlides={() => navigate(`/report/weekly-progress?pekan=${currentPekan}`)}
      />

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 shadow-2xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* 2. Section Navigation Tabs (10 Sections) */}
      <div className="bg-white p-2 rounded-2xl border border-neutral-200/90 shadow-2xs overflow-x-auto scrollbar-thin">
        <div className="flex items-center gap-1.5 min-w-max">
          {REPORT_SECTION_ORDER.map((sec) => {
            const Icon = getSectionIcon(sec.key)
            const isActive = activeTab === sec.key

            return (
              <button
                key={sec.key}
                type="button"
                onClick={() => handleTabChange(sec.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                <span>
                  {sec.number}. {sec.title.split('(')[0].trim()}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 3. Section Content Renderer */}
      {loading ? (
        <div className="py-24 text-center text-xs text-neutral-400 bg-white rounded-2xl border border-neutral-200 shadow-2xs">
          Memuat data operasional pekan {formatDateRiyadh(currentPekan)}...
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'metadata' && (
            <SectionMetadata
              metadata={formData.metadata}
              onChange={(meta) => updateSection('metadata', () => meta)}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'executive_summary' && (
            <SectionExecutiveSummary
              attendanceAvg={attendanceAvg}
              totalAyat={quranAggs.totalAyat}
              totalZiyadah={quranAggs.totalZiyadah}
              totalMurajaah={quranAggs.totalMurajaah}
              mutabaahAvg={mutabaahAvg}
              activeStudentsCount={activeStudentsCount}
              students={students}
              quranList={weeklyQuran}
              highlights={formData.executive_summary.highlights}
              onHighlightsChange={(hl) =>
                updateSection('executive_summary', (prev) => ({ ...prev, highlights: hl }))
              }
              onAutoSuggestHighlights={handleAutoSuggestHighlights}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'mutabaah' && (
            <SectionMutabaah
              students={students}
              mutabaahList={weeklyMutabaah}
              mutabaahAvg={mutabaahAvg}
              catatanEvaluasi={formData.mutabaah.catatan_evaluasi}
              onCatatanChange={(catatan) =>
                updateSection('mutabaah', () => ({ catatan_evaluasi: catatan }))
              }
              readOnly={readOnly}
            />
          )}

          {activeTab === 'quran' && (
            <SectionQuran
              students={students}
              quranList={weeklyQuran}
              totalZiyadah={quranAggs.totalZiyadah}
              totalMurajaah={quranAggs.totalMurajaah}
              totalAyat={quranAggs.totalAyat}
              catatanEvaluasi={formData.quran.catatan_evaluasi}
              onCatatanChange={(catatan) =>
                updateSection('quran', (prev) => ({ ...prev, catatan_evaluasi: catatan }))
              }
              readOnly={readOnly}
            />
          )}

          {activeTab === 'tahfidz_kualitas' && (
            <SectionTahfidzKualitas
              students={students}
              submissions={weeklySubmissions}
              attentionPoint={formData.tahfidz_kualitas.attention_point}
              onAttentionPointChange={(pt) =>
                updateSection('tahfidz_kualitas', (prev) => ({ ...prev, attention_point: pt }))
              }
              catatanPerkembangan={formData.tahfidz_kualitas.catatan_perkembangan}
              onCatatanPerkembanganChange={(sId, note) =>
                updateSection('tahfidz_kualitas', (prev) => ({
                  ...prev,
                  catatan_perkembangan: { ...prev.catatan_perkembangan, [sId]: note },
                }))
              }
              readOnly={readOnly}
            />
          )}

          {activeTab === 'arabic_speaking' && (
            <SectionArabicSpeaking
              data={formData.arabic_speaking}
              onChange={(data) => updateSection('arabic_speaking', () => data)}
              students={students}
              currentPekan={currentPekan}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'program_activities' && (
            <SectionProgramActivities
              data={formData.program_activities}
              onChange={(data) => updateSection('program_activities', () => data)}
              operationalActivities={weeklyActivities}
              currentPekan={currentPekan}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'documentation' && (
            <SectionDocumentation
              reportId={currentReportId}
              data={formData.documentation}
              onChange={(data) => updateSection('documentation', () => data)}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'kendala' && (
            <SectionKendala
              data={formData.kendala}
              onChange={(data) => updateSection('kendala', () => data)}
              readOnly={readOnly}
            />
          )}

          {activeTab === 'fokus_pekan_depan' && (
            <SectionFokusBerikutnya
              data={formData.fokus_pekan_depan}
              onChange={(data) => updateSection('fokus_pekan_depan', () => data)}
              readOnly={readOnly}
            />
          )}
        </div>
      )}

      {/* 4. Completeness Validation Modal */}
      <ValidationModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        isValid={validationResult.isValid}
        status={validationResult.status}
        issues={validationResult.issues}
        completedCount={validationResult.completedSectionsCount}
        onViewSlides={() => navigate(`/report/weekly-progress?pekan=${currentPekan}`)}
      />
    </div>
  )
}
