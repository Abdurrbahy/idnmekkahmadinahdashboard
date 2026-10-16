import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Layers,
  CheckCircle2,
  Clock,
  Printer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  pekanMulai,
  pekanSelesai,
  formatPekanDisplay,
  addDaysToDate,
  formatDateRiyadh,
} from '@/lib/dateUtils'
import { nomorPekanBulan } from '@/lib/printUtils'
import {
  fetchStudents,
  fetchWeeklyReport,
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
import { type WeeklyReportTemplateData, DEFAULT_FOKUS_PEKAN_DEPAN } from '@/types/weeklyReportTemplate'
import {
  calculateAttendanceAverage,
  calculateQuranAggregates,
  calculateMutabaahAverage,
  generateSuggestedHighlights,
} from '@/lib/weeklyReportCalculator'
import {
  exportSlidesToPdf,
  buildWeeklyReportPdfFilename,
} from '@/lib/weeklyReportPdfExporter'

// Slide Components
import { Slide01Cover } from '@/components/weekly-report-slides/Slide01Cover'
import { Slide02ExecutiveSummary } from '@/components/weekly-report-slides/Slide02ExecutiveSummary'
import { Slide03Mutabaah } from '@/components/weekly-report-slides/Slide03Mutabaah'
import { Slide04Quran } from '@/components/weekly-report-slides/Slide04Quran'
import { Slide05TahfidzKualitas } from '@/components/weekly-report-slides/Slide05TahfidzKualitas'
import { Slide06ArabicSpeaking } from '@/components/weekly-report-slides/Slide06ArabicSpeaking'
import { Slide07AktivitasProgram } from '@/components/weekly-report-slides/Slide07AktivitasProgram'
import { Slide08Dokumentasi } from '@/components/weekly-report-slides/Slide08Dokumentasi'
import { Slide09Kendala } from '@/components/weekly-report-slides/Slide09Kendala'
import { Slide10FokusBerikutnya } from '@/components/weekly-report-slides/Slide10FokusBerikutnya'

export const WeeklyProgressSlidesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Guard: Admin & Atasan
  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'
  const isAdmin = userRole === 'admin'

  useEffect(() => {
    if (profile && !isStaff) {
      navigate('/', { replace: true })
    }
  }, [profile, isStaff, navigate])

  const defaultPekan = pekanMulai(todayRiyadh())
  const rawPekan = searchParams.get('pekan') || defaultPekan
  const currentPekan = pekanMulai(rawPekan)

  const [loading, setLoading] = useState(true)

  // Operational Data States
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance[]>([])
  const [weeklyQuran, setWeeklyQuran] = useState<WeeklyQuran[]>([])
  const [weeklyMutabaah, setWeeklyMutabaah] = useState<WeeklyMutabaah[]>([])
  const [weeklySubmissions, setWeeklySubmissions] = useState<Submission[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([])

  // Active Slide Navigation
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single')

  // PDF Export States
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<string>('')
  const [exportFeedback, setExportFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Hidden print container ref
  const pdfContainerRef = useRef<HTMLDivElement>(null)

  // Load all operational & report data
  const loadData = useCallback(async (pMulai: string) => {
    setLoading(true)
    setExportFeedback(null)
    try {
      const [st, rep, att, qrn, mtb, subs, acts] = await Promise.all([
        fetchStudents(),
        fetchWeeklyReport(pMulai),
        fetchWeeklyAttendance(pMulai),
        fetchWeeklyQuran(pMulai),
        fetchWeeklyMutabaah(pMulai),
        fetchWeeklySubmissions(pMulai),
        fetchWeeklyActivities(pMulai),
      ])

      setStudents(st)
      setReport(rep)
      setWeeklyAttendance(att)
      setWeeklyQuran(qrn)
      setWeeklyMutabaah(mtb)
      setWeeklySubmissions(subs)
      setWeeklyActivities(acts)
    } catch (e) {
      console.warn('Error loading weekly slides data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(currentPekan)
  }, [currentPekan, loadData])

  const handleWeekChange = (newPekan: string) => {
    setSearchParams({ pekan: newPekan })
  }

  // Pure calculated metrics
  const attendanceAvg = useMemo(() => calculateAttendanceAverage(weeklyAttendance), [weeklyAttendance])
  const quranAggs = useMemo(() => calculateQuranAggregates(weeklyQuran), [weeklyQuran])
  const mutabaahAvg = useMemo(() => calculateMutabaahAverage(weeklyMutabaah), [weeklyMutabaah])
  const activeStudentsCount = useMemo(
    () => students.filter((s) => s.status === 'aktif').length,
    [students]
  )

  const weekInfo = useMemo(() => nomorPekanBulan(currentPekan), [currentPekan])
  const pSelesai = useMemo(() => pekanSelesai(currentPekan), [currentPekan])

  // Hydrated template data
  const templateData: WeeklyReportTemplateData = useMemo(() => {
    if (report?.report_data) {
      return report.report_data
    }

    // Baseline fallback if report_data hasn't been initialized yet
    const autoHighlights = generateSuggestedHighlights({
      attendanceAvg,
      totalAyat: quranAggs.totalAyat,
      totalZiyadah: quranAggs.totalZiyadah,
      totalMurajaah: quranAggs.totalMurajaah,
      mutabaahAvg,
      quranList: weeklyQuran,
      students,
    })

    return {
      metadata: {
        nama_laporan: 'Laporan Pekanan Program IDN Mekkah Madinah',
        cabang: 'Mekkah & Madinah',
        koordinator: report?.created_by || 'Koordinator Program IDN',
        pekan_ke: weekInfo.nomor,
        bulan: weekInfo.namaBulan,
        tahun: weekInfo.tahun,
        tanggal_awal: currentPekan,
        tanggal_akhir: pSelesai,
        tanggal_disiapkan: todayRiyadh(),
        status: report?.status || 'draft',
      },
      executive_summary: {
        highlights: autoHighlights,
      },
      mutabaah: {
        catatan_evaluasi: report?.catatan_umum || '',
      },
      quran: {
        catatan_evaluasi: report?.catatan_umum || '',
      },
      tahfidz_kualitas: {
        catatan_perkembangan: {},
        attention_point: '',
      },
      arabic_speaking: {
        vlog_schedule: [],
        podcast_wat: {
          nama_kegiatan: 'Podcast Weekend Arabic Talk (WAT)',
          status: 'Terjadwal',
          hari_tanggal: 'Sabtu Malam Ba\'da Isya',
          peserta: 'Santri Halaqah Bahasa',
          host: 'Koordinator Program',
          topik: 'Pengalaman Ibadah dan Menuntut Ilmu di Kota Nabi',
        },
        catatan_evaluasi: '',
      },
      program_activities: {
        manual_activities: [],
        catatan_umum: '',
      },
      documentation: {
        photos: [{ slot: 1 }, { slot: 2 }, { slot: 3 }, { slot: 4 }],
      },
      kendala: {
        tidak_ada_kendala: !report?.kendala,
        items: report?.kendala
          ? [
              {
                id: 'k-1',
                judul: 'Catatan Kendala Mingguan',
                deskripsi: report.kendala,
                dampak: 'Perlu monitoring dan pendampingan lanjutan',
                prioritas: 'Sedang',
                tindak_lanjut: report.kendala,
                penanggung_jawab: 'Koordinator Program',
                target_penyelesaian: 'Pekan berikutnya',
                status: 'Sedang berjalan',
              },
            ]
          : [],
      },
      fokus_pekan_depan: {
        items: DEFAULT_FOKUS_PEKAN_DEPAN.map((f, i) => ({
          ...f,
          id: `f-${i + 1}`,
          ...(i === 0 && report?.rencana_pekan_depan ? { deskripsi_target: report.rencana_pekan_depan } : {}),
        })),
      },
    }
  }, [
    report,
    currentPekan,
    weekInfo,
    pSelesai,
    attendanceAvg,
    quranAggs,
    mutabaahAvg,
    activeStudentsCount,
  ])

  // Keyboard Navigation for Slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode !== 'single') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault()
        setActiveSlideIndex((prev) => Math.min(prev + 1, 9))
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        setActiveSlideIndex((prev) => Math.max(prev - 1, 0))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [viewMode])

  // PDF Export Handler
  const handleDownloadPdf = async () => {
    if (isExporting) return
    setIsExporting(true)
    setExportFeedback(null)
    setExportProgress('Mempersiapkan data...')

    try {
      if (!pdfContainerRef.current) {
        throw new Error('Kontainer slide tidak ditemukan.')
      }

      // Collect all 10 slide DOM elements
      const slideElements = Array.from(
        pdfContainerRef.current.querySelectorAll<HTMLElement>('.slide-export-target')
      )

      if (slideElements.length === 0) {
        throw new Error('Gagal menemukan elemen slide 16:9 untuk diekspor.')
      }

      const fileName = buildWeeklyReportPdfFilename(
        templateData.metadata.cabang,
        templateData.metadata.pekan_ke,
        templateData.metadata.bulan,
        templateData.metadata.tahun
      )

      const result = await exportSlidesToPdf(slideElements, {
        fileName,
        onProgress: (_curr, _tot, msg) => {
          setExportProgress(msg)
        },
      })

      if (result.success) {
        setExportFeedback({
          type: 'success',
          message: `PDF berhasil diunduh: ${fileName}`,
        })
      } else {
        setExportFeedback({
          type: 'error',
          message: result.error || 'Gagal mengekspor file PDF.',
        })
      }
    } catch (err: any) {
      console.error('Export error:', err)
      setExportFeedback({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat memproses ekspor PDF.',
      })
    } finally {
      setIsExporting(false)
      setExportProgress('')
    }
  }

  // Slide Components List Definition
  const renderSlide = (index: number) => {
    const props = {
      currentPekan,
      periodeFormatted: weekInfo.labelPekan,
    }

    switch (index) {
      case 0:
        return (
          <Slide01Cover
            metadata={templateData.metadata}
            currentPekan={currentPekan}
            periodeFormatted={weekInfo.labelPekan}
            preparedDateFormatted={formatDateRiyadh(templateData.metadata.tanggal_disiapkan)}
          />
        )
      case 1:
        return (
          <Slide02ExecutiveSummary
            {...props}
            attendanceAvg={attendanceAvg}
            totalAyat={quranAggs.totalAyat}
            totalZiyadah={quranAggs.totalZiyadah}
            totalMurajaah={quranAggs.totalMurajaah}
            mutabaahAvg={mutabaahAvg}
            activeStudentsCount={activeStudentsCount}
            students={students}
            quranList={weeklyQuran}
            highlights={templateData.executive_summary.highlights}
          />
        )
      case 2:
        return (
          <Slide03Mutabaah
            {...props}
            students={students}
            mutabaahList={weeklyMutabaah}
            mutabaahAvg={mutabaahAvg}
            catatanEvaluasi={templateData.mutabaah.catatan_evaluasi}
          />
        )
      case 3:
        return (
          <Slide04Quran
            {...props}
            students={students}
            quranList={weeklyQuran}
            totalZiyadah={quranAggs.totalZiyadah}
            totalMurajaah={quranAggs.totalMurajaah}
            totalAyat={quranAggs.totalAyat}
            catatanEvaluasi={templateData.quran.catatan_evaluasi}
          />
        )
      case 4:
        return (
          <Slide05TahfidzKualitas
            {...props}
            students={students}
            submissions={weeklySubmissions}
            catatanPerkembangan={templateData.tahfidz_kualitas.catatan_perkembangan}
            catatanPerhatian={templateData.tahfidz_kualitas.attention_point}
          />
        )
      case 5:
        return (
          <Slide06ArabicSpeaking
            {...props}
            data={templateData.arabic_speaking}
          />
        )
      case 6:
        return (
          <Slide07AktivitasProgram
            {...props}
            operationalActivities={weeklyActivities}
            data={templateData.program_activities}
          />
        )
      case 7:
        return (
          <Slide08Dokumentasi
            {...props}
            data={templateData.documentation}
          />
        )
      case 8:
        return (
          <Slide09Kendala
            {...props}
            data={templateData.kendala}
          />
        )
      case 9:
        return (
          <Slide10FokusBerikutnya
            {...props}
            data={templateData.fokus_pekan_depan}
          />
        )
      default:
        return null
    }
  }

  const slideTitles = [
    '01. Sampul / Cover',
    '02. Executive Summary',
    '03. Mutabaah Santri',
    '04. Capaian Al-Qur\'an',
    '05. Kualitas Tahfidz',
    '06. Arabic Speaking',
    '07. Aktivitas Program',
    '08. Dokumentasi Kegiatan',
    '09. Kendala & Solusi',
    '10. Fokus Pekan Depan',
  ]

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-900 font-sans pb-16 print:pb-0 print:bg-white select-none">
      {/* 1. TOP INTERACTIVE SCREEN CONTROLS BAR (print:hidden) */}
      <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-3 sm:px-6 py-3 shadow-xl print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3 text-white">
          {/* Left: Navigation & Info */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs font-semibold gap-1.5 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 h-8"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>

            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/weekly-report?pekan=${currentPekan}`)}
                className="text-xs font-semibold gap-1.5 border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 h-8"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Form</span>
              </Button>
            )}

            <div className="flex items-center gap-2 border-l border-neutral-800 pl-2 sm:pl-3">
              <span className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                Weekly Report 16:9
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                  report?.status === 'final'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {report?.status === 'final' ? 'Final' : report?.status || 'Draft'}
              </span>
            </div>
          </div>

          {/* Center: Week Selector */}
          <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 text-xs self-center">
            <button
              type="button"
              onClick={() => handleWeekChange(addDaysToDate(currentPekan, -7))}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Pekan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2.5 font-bold text-neutral-200 whitespace-nowrap text-xs">
              {formatPekanDisplay(currentPekan)}
            </span>
            <button
              type="button"
              onClick={() => handleWeekChange(addDaysToDate(currentPekan, 7))}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              title="Pekan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Right: View Mode & Download PDF */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('single')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'single'
                    ? 'bg-white text-neutral-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Tampilkan slide per slide"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Per Slide</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewMode === 'all'
                    ? 'bg-white text-neutral-900'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Tampilkan seluruh 10 slide berurutan"
              >
                <Layers className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Semua Slide</span>
              </button>
            </div>

            {/* Print Fallback */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold h-8 px-2.5 gap-1.5 hidden lg:flex"
              title="Cetak via browser"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </Button>

            {/* Download PDF Button */}
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadPdf}
              disabled={isExporting || loading || !report}
              className="bg-white text-neutral-900 hover:bg-neutral-200 font-black text-xs gap-1.5 h-8.5 px-3.5 shadow-md"
            >
              {isExporting ? (
                <>
                  <Clock className="h-3.5 w-3.5 animate-spin text-neutral-700" />
                  <span>{exportProgress || 'Menyiapkan PDF...'}</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-neutral-900" />
                  <span>Download PDF</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Feedback Alert */}
        {exportFeedback && (
          <div className="max-w-7xl mx-auto mt-2">
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center justify-between gap-2 ${
                exportFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                  : 'bg-rose-950/80 border border-rose-800 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {exportFeedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                )}
                <span>{exportFeedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setExportFeedback(null)}
                className="opacity-70 hover:opacity-100 text-xs font-bold px-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. MAIN SLIDE CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {loading ? (
          <div className="py-32 text-center text-neutral-400 text-xs space-y-2">
            <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat data slide presentasi pekan {formatPekanDisplay(currentPekan)}...</p>
          </div>
        ) : !report ? (
          /* Empty State */
          <div className="bg-neutral-950 p-8 sm:p-12 rounded-2xl border border-neutral-800 text-center space-y-4 max-w-lg mx-auto text-white shadow-2xl">
            <AlertCircle className="h-10 w-10 text-neutral-500 mx-auto stroke-1" />
            <div>
              <h3 className="text-base font-bold text-neutral-200">
                Laporan Pekan Ini Belum Dibuat
              </h3>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                Belum ada data weekly report yang tersimpan untuk periode{' '}
                <strong>{formatPekanDisplay(currentPekan)}</strong>.
              </p>
            </div>

            {isAdmin ? (
              <Button
                onClick={() => navigate(`/weekly-report?pekan=${currentPekan}`)}
                className="bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-bold gap-1.5 mt-2"
              >
                <FileText className="h-4 w-4" />
                <span>Buat Form Laporan Sekarang</span>
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs border-neutral-700 text-neutral-300"
              >
                Kembali ke Dashboard
              </Button>
            )}
          </div>
        ) : viewMode === 'single' ? (
          /* SINGLE SLIDE INTERACTIVE VIEWER */
          <div className="space-y-4">
            {/* Active Slide Canvas */}
            <div className="flex justify-center">
              <div className="w-full max-w-[1280px]">
                {renderSlide(activeSlideIndex)}
              </div>
            </div>

            {/* Bottom Slide Navigation Bar */}
            <div className="bg-neutral-950/80 p-2.5 rounded-xl border border-neutral-800 flex items-center justify-between gap-3 text-white max-w-[1280px] mx-auto print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSlideIndex((prev) => Math.max(prev - 1, 0))}
                disabled={activeSlideIndex === 0}
                className="border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold gap-1.5 h-8"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Sebelumnya</span>
              </Button>

              {/* Slide Jump Dots / Badges */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-1">
                {slideTitles.map((title, idx) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`h-7 px-2 sm:px-2.5 rounded-md text-[11px] font-bold transition-all shrink-0 ${
                      activeSlideIndex === idx
                        ? 'bg-white text-neutral-900 shadow'
                        : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800 hover:text-white'
                    }`}
                    title={title}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveSlideIndex((prev) => Math.min(prev + 1, 9))}
                disabled={activeSlideIndex === 9}
                className="border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800 text-xs font-semibold gap-1.5 h-8"
              >
                <span className="hidden sm:inline">Berikutnya</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          /* ALL 10 SLIDES STACKED VIEW */
          <div className="space-y-8 flex flex-col items-center">
            {slideTitles.map((_, idx) => (
              <div key={idx} className="w-full max-w-[1280px]">
                {renderSlide(idx)}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 3. DEDICATED OFF-SCREEN EXPORT CONTAINER FOR PDF GENERATION */}
      {/* Contains all 10 pristine 16:9 slides rendered at 1280px width */}
      <div
        ref={pdfContainerRef}
        id="pdf-export-container"
        className="fixed top-0 left-[-9999px] w-[1280px] pointer-events-none opacity-100 z-[-1] space-y-0"
        aria-hidden="true"
      >
        {report && (
          <>
            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide01Cover
                metadata={templateData.metadata}
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                preparedDateFormatted={formatDateRiyadh(templateData.metadata.tanggal_disiapkan)}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide02ExecutiveSummary
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                attendanceAvg={attendanceAvg}
                totalAyat={quranAggs.totalAyat}
                totalZiyadah={quranAggs.totalZiyadah}
                totalMurajaah={quranAggs.totalMurajaah}
                mutabaahAvg={mutabaahAvg}
                activeStudentsCount={activeStudentsCount}
                students={students}
                quranList={weeklyQuran}
                highlights={templateData.executive_summary.highlights}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide03Mutabaah
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                students={students}
                mutabaahList={weeklyMutabaah}
                mutabaahAvg={mutabaahAvg}
                catatanEvaluasi={templateData.mutabaah.catatan_evaluasi}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide04Quran
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                students={students}
                quranList={weeklyQuran}
                totalZiyadah={quranAggs.totalZiyadah}
                totalMurajaah={quranAggs.totalMurajaah}
                totalAyat={quranAggs.totalAyat}
                catatanEvaluasi={templateData.quran.catatan_evaluasi}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide05TahfidzKualitas
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                students={students}
                submissions={weeklySubmissions}
                catatanPerkembangan={templateData.tahfidz_kualitas.catatan_perkembangan}
                catatanPerhatian={templateData.tahfidz_kualitas.attention_point}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide06ArabicSpeaking
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                data={templateData.arabic_speaking}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide07AktivitasProgram
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                operationalActivities={weeklyActivities}
                data={templateData.program_activities}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide08Dokumentasi
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                data={templateData.documentation}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide09Kendala
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                data={templateData.kendala}
              />
            </div>

            <div className="slide-export-target w-[1280px] aspect-[16/9] bg-white">
              <Slide10FokusBerikutnya
                currentPekan={currentPekan}
                periodeFormatted={weekInfo.labelPekan}
                data={templateData.fokus_pekan_depan}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default WeeklyProgressSlidesPage
