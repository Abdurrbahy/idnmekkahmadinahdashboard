import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate, Link, useOutletContext } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  Plus,
  Trash2,
  Copy,
  Presentation,
  CheckCircle2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  DollarSign,
  FileText,
  Activity,
  Users,
  Share2,
  BookOpen,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  pekanMulai,
  formatPekanDisplay,
  addDaysToDate,
} from '@/lib/dateUtils'
import {
  fetchStudents,
  fetchWeeklyReport,
  saveWeeklyReport,
  fetchReportProgressItems,
  saveReportProgressItems,
  copyProgressFromPreviousWeek,
  fetchReportStudentIssues,
  saveReportStudentIssues,
  fetchTeacherJournalActivities,
  fetchTeacherJournalRecords,
  saveTeacherJournalRecords,
  fetchReportSocialMedia,
  saveReportSocialMedia,
  fetchKasTransaksi,
  saveKasTransaksi,
  deleteKasTransaksi,
} from '@/lib/supabase'
import type {
  Student,
  WeeklyReport,
  ReportProgressItem,
  ReportStudentIssue,
  TeacherJournalActivity,
  ReportSocialMedia,
  VKasTransaksi,
  KasTransaksi,
} from '@/types/database'

type FormTab = 'info' | 'progress' | 'issues' | 'journal' | 'sosmed' | 'finance'
const VALID_TABS: FormTab[] = ['info', 'progress', 'issues', 'journal', 'sosmed', 'finance']

interface OutletContextType {
  onToggleSidebar?: () => void
  collapsed?: boolean
  setCollapsed?: (val: boolean) => void
}

export const WeeklyReportFormPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const outletCtx = useOutletContext<OutletContextType | null>()

  // Verify Admin Role
  const userRole = profile?.role || 'walsan'
  useEffect(() => {
    if (profile && userRole !== 'admin') {
      navigate('/', { replace: true })
    }
  }, [profile, userRole, navigate])

  const defaultPekan = pekanMulai(todayRiyadh())
  const rawPekan = searchParams.get('pekan') || defaultPekan
  const currentPekan = pekanMulai(rawPekan)

  const tabParam = searchParams.get('tab') as FormTab | null
  const initialTab: FormTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'info'
  const [activeTab, setActiveTab] = useState<FormTab>(initialTab)

  // Keep activeTab in sync with query parameter
  useEffect(() => {
    const currentTabParam = searchParams.get('tab') as FormTab | null
    if (currentTabParam && VALID_TABS.includes(currentTabParam) && currentTabParam !== activeTab) {
      setActiveTab(currentTabParam)
    }
  }, [searchParams, activeTab])

  const [loading, setLoading] = useState(true)
  const [savingTab, setSavingTab] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Master Data
  const [students, setStudents] = useState<Student[]>([])
  const [journalActs, setJournalActs] = useState<TeacherJournalActivity[]>([])

  // Main Report Info
  const [report, setReport] = useState<WeeklyReport>({
    pekan_mulai: currentPekan,
    status: 'draft',
    catatan_umum: '',
    rencana_pekan_depan: '',
    kendala: '',
  })

  // Child Data
  const [progressItems, setProgressItems] = useState<ReportProgressItem[]>([])
  const [studentIssues, setStudentIssues] = useState<ReportStudentIssue[]>([])
  const [journalRecords, setJournalRecords] = useState<Record<number, { status: 'completed' | 'partial' | 'not_done'; catatan: string }>>({})
  const [sosmedItems, setSosmedItems] = useState<ReportSocialMedia[]>([])

  // Finance
  const [kasList, setKasList] = useState<VKasTransaksi[]>([])
  const [financeGroup, setFinanceGroup] = useState<'santri' | 'koordinator'>('santri')
  const [newKas, setNewKas] = useState<Partial<KasTransaksi>>({
    kelompok: 'santri',
    tanggal: todayRiyadh(),
    kebutuhan: '',
    kategori: 'operasional',
    volume: 1,
    satuan: 'pax',
    harga: 0,
    arah: 'keluar',
    keterangan: '',
  })

  // 1. Load Master Data
  useEffect(() => {
    async function loadMaster() {
      const [st, jActs] = await Promise.all([
        fetchStudents(),
        fetchTeacherJournalActivities(),
      ])
      setStudents(st)
      setJournalActs(jActs)
    }
    loadMaster()
  }, [])

  // 2. Load Report Data for selected week
  const loadWeekData = useCallback(async (pMulai: string) => {
    setLoading(true)
    setFeedback(null)
    try {
      let rep = await fetchWeeklyReport(pMulai)
      if (!rep) {
        // Auto-create draft if not exist
        const created = await saveWeeklyReport({
          pekan_mulai: pMulai,
          status: 'draft',
        })
        if (created.data) rep = created.data
      }

      if (rep) {
        setReport(rep)
        if (rep.id) {
          const [pItems, sIssues, jRecs, sMedia, kas] = await Promise.all([
            fetchReportProgressItems(rep.id),
            fetchReportStudentIssues(rep.id),
            fetchTeacherJournalRecords(rep.id),
            fetchReportSocialMedia(rep.id),
            fetchKasTransaksi(),
          ])
          setProgressItems(pItems)
          setStudentIssues(sIssues)
          setSosmedItems(sMedia)
          setKasList(kas)

          // Map journal records
          const map: Record<number, { status: 'completed' | 'partial' | 'not_done'; catatan: string }> = {}
          jRecs.forEach((r) => {
            map[r.activity_id] = {
              status: r.status,
              catatan: r.catatan || '',
            }
          })
          setJournalRecords(map)
        }
      }
    } catch (e) {
      console.warn('Error loading weekly report form data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWeekData(currentPekan)
  }, [currentPekan, loadWeekData])

  const handleWeekChange = (newPekan: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('pekan', newPekan)
    setSearchParams(newParams)
  }

  const handleTabChange = (newTab: FormTab) => {
    setActiveTab(newTab)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', newTab)
    setSearchParams(newParams, { replace: true })
  }

  // --- SAVE HANDLERS ---

  const handleSaveInfo = async () => {
    setSavingTab('info')
    setFeedback(null)
    const res = await saveWeeklyReport(report)
    setSavingTab(null)
    if (res.success && res.data) {
      setReport(res.data)
      setFeedback({ type: 'success', message: 'Status & Catatan berhasil disimpan!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan info laporan.' })
    }
  }

  const handleSaveProgress = async () => {
    if (!report.id) return
    setSavingTab('progress')
    setFeedback(null)
    const res = await saveReportProgressItems(report.id, progressItems)
    setSavingTab(null)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Kemajuan Pekanan berhasil disimpan!' })
      const updated = await fetchReportProgressItems(report.id)
      setProgressItems(updated)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan kemajuan pekanan.' })
    }
  }

  const handleCopyPrevWeekProgress = async () => {
    if (!report.id) return
    const prevWeek = addDaysToDate(currentPekan, -7)
    setSavingTab('progress')
    setFeedback(null)
    const res = await copyProgressFromPreviousWeek(report.id, prevWeek)
    setSavingTab(null)
    if (res.success) {
      setFeedback({ type: 'success', message: `Berhasil menyalin ${res.count || 0} item dari pekan sebelumnya!` })
      const updated = await fetchReportProgressItems(report.id)
      setProgressItems(updated)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyalin kemajuan pekan lalu.' })
    }
  }

  const handleSaveIssues = async () => {
    if (!report.id) return
    setSavingTab('issues')
    setFeedback(null)
    const res = await saveReportStudentIssues(report.id, studentIssues)
    setSavingTab(null)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Catatan Siswa Bermasalah berhasil disimpan!' })
      const updated = await fetchReportStudentIssues(report.id)
      setStudentIssues(updated)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan evaluasi siswa.' })
    }
  }

  const handleSaveJournal = async () => {
    if (!report.id) return
    setSavingTab('journal')
    setFeedback(null)
    const payload = journalActs.map((act) => {
      const rec = journalRecords[act.id]
      return {
        activity_id: act.id,
        status: rec?.status || 'completed',
        catatan: rec?.catatan || null,
      }
    })
    const res = await saveTeacherJournalRecords(report.id, payload)
    setSavingTab(null)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Jurnal Guru berhasil disimpan!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan jurnal guru.' })
    }
  }

  const handleSaveSosmed = async () => {
    if (!report.id) return
    setSavingTab('sosmed')
    setFeedback(null)
    const res = await saveReportSocialMedia(report.id, sosmedItems)
    setSavingTab(null)
    if (res.success) {
      setFeedback({ type: 'success', message: 'Laporan Sosmed berhasil disimpan!' })
      const updated = await fetchReportSocialMedia(report.id)
      setSosmedItems(updated)
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menyimpan sosmed.' })
    }
  }

  const handleAddKas = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKas.kebutuhan || !newKas.harga) {
      alert('Mohon isi kebutuhan dan harga transaksi!')
      return
    }
    setSavingTab('finance')
    setFeedback(null)
    const res = await saveKasTransaksi({
      ...newKas,
      kelompok: financeGroup,
    })
    setSavingTab(null)
    if (res.success) {
      setNewKas({
        kelompok: financeGroup,
        tanggal: todayRiyadh(),
        kebutuhan: '',
        kategori: 'operasional',
        volume: 1,
        satuan: 'pax',
        harga: 0,
        arah: 'keluar',
        keterangan: '',
      })
      const updated = await fetchKasTransaksi()
      setKasList(updated)
      setFeedback({ type: 'success', message: 'Transaksi kas berhasil ditambahkan!' })
    } else {
      setFeedback({ type: 'error', message: res.error || 'Gagal menambahkan transaksi kas.' })
    }
  }

  const handleDeleteKas = async (id?: number) => {
    if (!id) return
    if (!confirm('Apakah Anda yakin ingin menghapus transaksi kas ini?')) return
    const res = await deleteKasTransaksi(id)
    if (res.success) {
      const updated = await fetchKasTransaksi()
      setKasList(updated)
    } else {
      alert(res.error || 'Gagal menghapus transaksi.')
    }
  }

  const formatRupiah = (val: number) => {
    const isNeg = val < 0
    const absVal = Math.abs(val)
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(absVal)
    return isNeg ? `-Rp${formatted}` : `Rp${formatted}`
  }

  // Filtered Kas for active group
  const filteredKas = useMemo(() => {
    return kasList.filter((k) => k.kelompok === financeGroup)
  }, [kasList, financeGroup])

  const totalSaldoGroup = useMemo(() => {
    if (filteredKas.length === 0) return 0
    return filteredKas[filteredKas.length - 1].sisa_saldo
  }, [filteredKas])

  return (
    <div className="min-h-screen bg-neutral-100/50 pb-20 text-neutral-900 font-sans">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3">
            {outletCtx?.onToggleSidebar && (
              <button
                type="button"
                onClick={outletCtx.onToggleSidebar}
                className="lg:hidden p-2 -ml-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none"
                aria-label="Buka Menu"
                title="Buka Menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs font-semibold gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-neutral-900 leading-tight">
                  Pengisian Weekly Progress Report
                </h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    report.status === 'final'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  {report.status}
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Laporan Internal Manajemen & Atasan • Waktu Saudi (Asia/Riyadh)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Week Navigator */}
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleWeekChange(addDaysToDate(currentPekan, -7))}
                className="h-7 w-7 text-neutral-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-semibold text-neutral-800">
                {formatPekanDisplay(currentPekan)}
              </span>
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleWeekChange(addDaysToDate(currentPekan, 7))}
                className="h-7 w-7 text-neutral-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Preview Slides Button */}
            <Link
              to={`/report/weekly-progress?pekan=${currentPekan}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold shadow-xs transition-colors"
            >
              <Presentation className="h-4 w-4" />
              <span>Lihat Presentasi</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Main Body & Tab Navigation */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-xl flex items-center justify-between text-xs font-semibold border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : 'bg-rose-50 text-rose-900 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-neutral-400 hover:text-neutral-600 text-sm"
            >
              ×
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-200 pb-2 scrollbar-none">
          {[
            { id: 'info', label: '1. Status & Catatan', icon: FileText },
            { id: 'progress', label: '2. Kemajuan Pekanan', icon: Activity, count: progressItems.length },
            { id: 'issues', label: '3. Evaluasi Siswa', icon: Users, count: studentIssues.length },
            { id: 'journal', label: '4. Jurnal Guru', icon: BookOpen },
            { id: 'sosmed', label: '5. Postingan Sosmed', icon: Share2, count: sosmedItems.length },
            { id: 'finance', label: '6. Buku Kas Umum', icon: DollarSign, count: kasList.length },
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id as FormTab)}
                className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200 font-bold'
                    : 'text-neutral-500 hover:bg-white/60 hover:text-neutral-800'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-neutral-900' : 'text-neutral-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                      isActive ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500">
            Memuat formulir laporan pekanan...
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-xs space-y-6">
            {/* TAB 1: STATUS & CATATAN UMUM */}
            {activeTab === 'info' && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Status Laporan & Catatan Penutup
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Mengatur status publikasi internal dan teks evaluasi penutup (Slide 1 & Slide 9).
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveInfo}
                    disabled={savingTab === 'info'}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingTab === 'info' ? 'Menyimpan...' : 'Simpan Info'}</span>
                  </Button>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">Status Laporan</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="reportStatus"
                          value="draft"
                          checked={report.status === 'draft'}
                          onChange={() => setReport({ ...report, status: 'draft' })}
                          className="text-neutral-900"
                        />
                        <span>Draft (Masih dalam proses pengisian)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-medium">
                        <input
                          type="radio"
                          name="reportStatus"
                          value="final"
                          checked={report.status === 'final'}
                          onChange={() => setReport({ ...report, status: 'final' })}
                          className="text-neutral-900"
                        />
                        <span className="font-bold text-emerald-700">Final (Siap Ditinjau Atasan)</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Kendala Pekan Ini (Slide 9)
                    </label>
                    <textarea
                      rows={3}
                      value={report.kendala || ''}
                      onChange={(e) => setReport({ ...report, kendala: e.target.value })}
                      placeholder="Tuliskan kendala teknis, operasional, atau keasramaan yang dihadapi..."
                      className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Rencana Pekan Depan (Slide 9)
                    </label>
                    <textarea
                      rows={3}
                      value={report.rencana_pekan_depan || ''}
                      onChange={(e) => setReport({ ...report, rencana_pekan_depan: e.target.value })}
                      placeholder="Tuliskan target prioritas dan rencana kegiatan pekan berikutnya..."
                      className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-neutral-700 block mb-1">
                      Catatan Umum / Kesimpulan (Slide 9)
                    </label>
                    <textarea
                      rows={3}
                      value={report.catatan_umum || ''}
                      onChange={(e) => setReport({ ...report, catatan_umum: e.target.value })}
                      placeholder="Tuliskan kesimpulan menyeluruh tentang progres santri dan tim pengajar..."
                      className="w-full rounded-lg border border-neutral-200 p-2.5 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KEMAJUAN PEKANAN */}
            {activeTab === 'progress' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Slide 2 — Laporan Kemajuan Pekanan
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Mencatat daftar program/kegiatan, status pencapaian, dan Rencana Perbaikan Tindak Lanjut (RPTL).
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyPrevWeekProgress}
                      disabled={savingTab === 'progress'}
                      className="text-xs font-semibold gap-1.5"
                      title="Salin item proses dari pekan lalu"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin dari Pekan Lalu</span>
                    </Button>
                    <Button
                      onClick={handleSaveProgress}
                      disabled={savingTab === 'progress'}
                      className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>{savingTab === 'progress' ? 'Menyimpan...' : 'Simpan Kemajuan'}</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {progressItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-600">Item #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              const copy = [...progressItems]
                              const temp = copy[idx - 1]
                              copy[idx - 1] = copy[idx]
                              copy[idx] = temp
                              setProgressItems(copy)
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                            title="Pindah ke Atas"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === progressItems.length - 1}
                            onClick={() => {
                              const copy = [...progressItems]
                              const temp = copy[idx + 1]
                              copy[idx + 1] = copy[idx]
                              copy[idx] = temp
                              setProgressItems(copy)
                            }}
                            className="p-1 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                            title="Pindah ke Bawah"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = progressItems.filter((_, i) => i !== idx)
                              setProgressItems(copy)
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 ml-1"
                            title="Hapus Item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-2">
                          <label className="font-semibold text-neutral-700 block mb-1">Kegiatan / Program</label>
                          <input
                            type="text"
                            value={item.kegiatan}
                            onChange={(e) => {
                              const copy = [...progressItems]
                              copy[idx].kegiatan = e.target.value
                              setProgressItems(copy)
                            }}
                            placeholder="Misal: Pendaftaran visa santri / Halaqah tahfidz..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Status Pencapaian</label>
                          <select
                            value={item.status}
                            onChange={(e) => {
                              const copy = [...progressItems]
                              copy[idx].status = e.target.value as any
                              setProgressItems(copy)
                            }}
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          >
                            <option value="rencana">Rencana</option>
                            <option value="proses">Proses</option>
                            <option value="selesai">Selesai</option>
                            <option value="tertunda">Tertunda</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Hasil Kegiatan</label>
                          <input
                            type="text"
                            value={item.hasil || ''}
                            onChange={(e) => {
                              const copy = [...progressItems]
                              copy[idx].hasil = e.target.value
                              setProgressItems(copy)
                            }}
                            placeholder="Capaian yang diperoleh..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">
                            RPTL (Rencana Perbaikan Tindak Lanjut)
                          </label>
                          <input
                            type="text"
                            value={item.rptl || ''}
                            onChange={(e) => {
                              const copy = [...progressItems]
                              copy[idx].rptl = e.target.value
                              setProgressItems(copy)
                            }}
                            placeholder="Langkah perbaikan berikutnya..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setProgressItems([
                        ...progressItems,
                        {
                          report_id: report.id || 0,
                          urutan: progressItems.length + 1,
                          kegiatan: '',
                          status: 'proses',
                          hasil: '',
                          rptl: '',
                        },
                      ])
                    }}
                    className="w-full py-2.5 border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 text-xs font-semibold gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Baris Kemajuan</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 3: EVALUASI SISWA BERMASALAH */}
            {activeTab === 'issues' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Slide 3 — Laporan Evaluasi Khusus Siswa
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Catatan internal penanganan kendala kedisiplinan, akademik, atau kesehatan.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveIssues}
                    disabled={savingTab === 'issues'}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingTab === 'issues' ? 'Menyimpan...' : 'Simpan Kasus'}</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {studentIssues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-600">Kasus #{idx + 1}</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const copy = studentIssues.filter((_, i) => i !== idx)
                              setStudentIssues(copy)
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700"
                            title="Hapus Kasus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Nama Siswa / Guru</label>
                          <select
                            value={issue.student_id ? String(issue.student_id) : 'other'}
                            onChange={(e) => {
                              const copy = [...studentIssues]
                              if (e.target.value === 'other') {
                                copy[idx].student_id = null
                              } else {
                                copy[idx].student_id = Number(e.target.value)
                                copy[idx].nama_lain = null
                              }
                              setStudentIssues(copy)
                            }}
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          >
                            <option value="other">Nama Lain / Guru</option>
                            {students.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.nama}
                              </option>
                            ))}
                          </select>
                          {!issue.student_id && (
                            <input
                              type="text"
                              value={issue.nama_lain || ''}
                              onChange={(e) => {
                                const copy = [...studentIssues]
                                copy[idx].nama_lain = e.target.value
                                setStudentIssues(copy)
                              }}
                              placeholder="Tuliskan nama lengkap..."
                              className="mt-1.5 w-full rounded-md border border-neutral-200 px-2.5 py-1 text-xs text-neutral-900 bg-white"
                            />
                          )}
                        </div>

                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Konteks / Kelas</label>
                          <input
                            type="text"
                            value={issue.konteks || ''}
                            onChange={(e) => {
                              const copy = [...studentIssues]
                              copy[idx].konteks = e.target.value
                              setStudentIssues(copy)
                            }}
                            placeholder="Misal: KBM Pagi / Asrama / Tahfidz..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>

                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Permasalahan</label>
                          <input
                            type="text"
                            value={issue.masalah}
                            onChange={(e) => {
                              const copy = [...studentIssues]
                              copy[idx].masalah = e.target.value
                              setStudentIssues(copy)
                            }}
                            placeholder="Uraian singkat masalah..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Penanganan / Tindakan</label>
                          <input
                            type="text"
                            value={issue.penanganan || ''}
                            onChange={(e) => {
                              const copy = [...studentIssues]
                              copy[idx].penanganan = e.target.value
                              setStudentIssues(copy)
                            }}
                            placeholder="Tindakan yang telah dilakukan..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Hasil Penanganan</label>
                          <input
                            type="text"
                            value={issue.hasil || ''}
                            onChange={(e) => {
                              const copy = [...studentIssues]
                              copy[idx].hasil = e.target.value
                              setStudentIssues(copy)
                            }}
                            placeholder="Kondisi terkini / hasil penanganan..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStudentIssues([
                        ...studentIssues,
                        {
                          report_id: report.id || 0,
                          urutan: studentIssues.length + 1,
                          student_id: students[0]?.id || null,
                          masalah: '',
                          penanganan: '',
                          hasil: '',
                        },
                      ])
                    }}
                    className="w-full py-2.5 border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 text-xs font-semibold gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Kasus Siswa</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 4: JURNAL GURU (15 KEGIATAN) */}
            {activeTab === 'journal' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Slide 4 — Jurnal Guru (15 Aktivitas Pokok)
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Verifikasi keterlaksanaan tugas pendampingan guru selama sepekan.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const map: Record<number, { status: 'completed' | 'partial' | 'not_done'; catatan: string }> = {}
                        journalActs.forEach((a) => {
                          map[a.id] = { status: 'completed', catatan: journalRecords[a.id]?.catatan || '' }
                        })
                        setJournalRecords(map)
                      }}
                      className="text-xs font-semibold"
                    >
                      Set Semua Terlaksana
                    </Button>
                    <Button
                      onClick={handleSaveJournal}
                      disabled={savingTab === 'journal'}
                      className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                    >
                      <Save className="h-4 w-4" />
                      <span>{savingTab === 'journal' ? 'Menyimpan...' : 'Simpan Jurnal'}</span>
                    </Button>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200 font-bold text-neutral-800">
                        <th className="py-2.5 px-3 w-12 text-center">No</th>
                        <th className="py-2.5 px-3">Kegiatan Guru</th>
                        <th className="py-2.5 px-3 w-44">Status Keterlaksanaan</th>
                        <th className="py-2.5 px-3">Catatan / Keterangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {journalActs.map((act, idx) => {
                        const rec = journalRecords[act.id] || { status: 'completed', catatan: '' }

                        return (
                          <tr key={act.id} className="hover:bg-neutral-50/50">
                            <td className="py-2.5 px-3 text-center text-neutral-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-neutral-900">
                              {act.nama}
                            </td>
                            <td className="py-2 px-3">
                              <select
                                value={rec.status}
                                onChange={(e) => {
                                  setJournalRecords({
                                    ...journalRecords,
                                    [act.id]: {
                                      ...rec,
                                      status: e.target.value as any,
                                    },
                                  })
                                }}
                                className={`w-full rounded-md border px-2 py-1 text-xs font-semibold ${
                                  rec.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
                                    : rec.status === 'partial'
                                    ? 'bg-amber-50 text-amber-950 border-amber-300'
                                    : 'bg-rose-50 text-rose-950 border-rose-300'
                                }`}
                              >
                                <option value="completed">Completed (Terlaksana)</option>
                                <option value="partial">Partial (Sebagian)</option>
                                <option value="not_done">Not Done (Tidak)</option>
                              </select>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={rec.catatan || ''}
                                onChange={(e) => {
                                  setJournalRecords({
                                    ...journalRecords,
                                    [act.id]: {
                                      ...rec,
                                      catatan: e.target.value,
                                    },
                                  })
                                }}
                                placeholder="Catatan opsional..."
                                className="w-full rounded-md border border-neutral-200 px-2 py-1 text-xs text-neutral-900 bg-white"
                              />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: POSTINGAN SOSIAL MEDIA */}
            {activeTab === 'sosmed' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Slide 7 — Laporan Publikasi & Postingan Sosmed
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Dokumentasi publikasi konten di Instagram, YouTube, atau portal sekolah.
                    </p>
                  </div>
                  <Button
                    onClick={handleSaveSosmed}
                    disabled={savingTab === 'sosmed'}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                  >
                    <Save className="h-4 w-4" />
                    <span>{savingTab === 'sosmed' ? 'Menyimpan...' : 'Simpan Sosmed'}</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {sosmedItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-neutral-600">Postingan #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const copy = sosmedItems.filter((_, i) => i !== idx)
                            setSosmedItems(copy)
                          }}
                          className="p-1 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Kegiatan / Judul Konten</label>
                          <input
                            type="text"
                            value={item.kegiatan}
                            onChange={(e) => {
                              const copy = [...sosmedItems]
                              copy[idx].kegiatan = e.target.value
                              setSosmedItems(copy)
                            }}
                            placeholder="Misal: Video reel setoran di Raudhah..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Progress Publikasi</label>
                          <input
                            type="text"
                            value={item.progress || ''}
                            onChange={(e) => {
                              const copy = [...sosmedItems]
                              copy[idx].progress = e.target.value
                              setSosmedItems(copy)
                            }}
                            placeholder="Misal: Sudah tayang di IG @idn..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">Keterangan / Link</label>
                          <input
                            type="text"
                            value={item.keterangan || ''}
                            onChange={(e) => {
                              const copy = [...sosmedItems]
                              copy[idx].keterangan = e.target.value
                              setSosmedItems(copy)
                            }}
                            placeholder="URL postingan atau catatan..."
                            className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSosmedItems([
                        ...sosmedItems,
                        {
                          report_id: report.id || 0,
                          urutan: sosmedItems.length + 1,
                          kegiatan: '',
                          progress: 'Sudah tayang',
                          keterangan: '',
                        },
                      ])
                    }}
                    className="w-full py-2.5 border-dashed border-neutral-300 text-neutral-600 hover:text-neutral-900 text-xs font-semibold gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Baris Sosmed</span>
                  </Button>
                </div>
              </div>
            )}

            {/* TAB 6: BUKU KAS UMUM (SLIDE 8) */}
            {activeTab === 'finance' && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-neutral-900">
                      Slide 8 — Buku Kas Umum & Keuangan Berjalan
                    </h2>
                    <p className="text-xs text-neutral-500">
                      Buku kas mandiri sejak awal program. Saldo berjalan dihitung otomatis secara kumulatif.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex rounded-lg bg-neutral-100 p-0.5 border border-neutral-200 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setFinanceGroup('santri')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          financeGroup === 'santri'
                            ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        Kelompok Santri
                      </button>
                      <button
                        type="button"
                        onClick={() => setFinanceGroup('koordinator')}
                        className={`px-3 py-1 rounded-md transition-all ${
                          financeGroup === 'koordinator'
                            ? 'bg-white text-neutral-900 shadow-2xs font-bold'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        Kelompok Koordinator
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Input Transaksi Baru */}
                <form
                  onSubmit={handleAddKas}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3 text-xs"
                >
                  <div className="font-bold text-neutral-800 flex items-center justify-between">
                    <span>Tambah Transaksi Kas ({financeGroup.toUpperCase()})</span>
                    <span className="text-[11px] font-normal text-neutral-500">
                      Total Saldo Berjalan:{' '}
                      <b
                        className={
                          totalSaldoGroup < 0 ? 'text-rose-600 font-bold' : 'text-emerald-700 font-bold'
                        }
                      >
                        {formatRupiah(totalSaldoGroup)}
                      </b>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Tanggal</label>
                      <input
                        type="date"
                        value={newKas.tanggal}
                        onChange={(e) => setNewKas({ ...newKas, tanggal: e.target.value })}
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-semibold text-neutral-700 block mb-1">Kebutuhan / Uraian</label>
                      <input
                        type="text"
                        value={newKas.kebutuhan}
                        onChange={(e) => setNewKas({ ...newKas, kebutuhan: e.target.value })}
                        placeholder="Misal: Uang Masuk / Tiket Pesawat / Sewa Apartemen..."
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Kategori</label>
                      <select
                        value={newKas.kategori}
                        onChange={(e) => setNewKas({ ...newKas, kategori: e.target.value as any })}
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                      >
                        <option value="keberangkatan">Keberangkatan</option>
                        <option value="akomodasi">Akomodasi</option>
                        <option value="operasional">Operasional</option>
                        <option value="pendidikan">Pendidikan</option>
                        <option value="lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Volume & Satuan</label>
                      <div className="flex gap-1.5">
                        <input
                          type="number"
                          step="any"
                          value={newKas.volume}
                          onChange={(e) => setNewKas({ ...newKas, volume: Number(e.target.value) })}
                          className="w-20 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          required
                        />
                        <input
                          type="text"
                          value={newKas.satuan}
                          onChange={(e) => setNewKas({ ...newKas, satuan: e.target.value })}
                          placeholder="pax / bln"
                          className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Harga Satuan (Rp)</label>
                      <input
                        type="number"
                        value={newKas.harga}
                        onChange={(e) => setNewKas({ ...newKas, harga: Number(e.target.value) })}
                        placeholder="Contoh: 15000000"
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Arah Arus Kas</label>
                      <select
                        value={newKas.arah}
                        onChange={(e) => setNewKas({ ...newKas, arah: e.target.value as any })}
                        className="w-full rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-neutral-900 bg-white font-bold"
                      >
                        <option value="masuk" className="text-emerald-700 font-bold">
                          Masuk (Kredit)
                        </option>
                        <option value="keluar" className="text-rose-700 font-bold">
                          Keluar (Debit)
                        </option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <Button
                        type="submit"
                        disabled={savingTab === 'finance'}
                        className="w-full bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Transaksi</span>
                      </Button>
                    </div>
                  </div>
                </form>

                {/* Tabel Kas Berjalan */}
                <div className="border border-neutral-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-200 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2.5 px-3 w-10 text-center">No</th>
                        <th className="py-2.5 px-2.5">Tanggal</th>
                        <th className="py-2.5 px-3">Kebutuhan / Uraian</th>
                        <th className="py-2.5 px-2.5 text-center">Volume</th>
                        <th className="py-2.5 px-3 text-right">Harga</th>
                        <th className="py-2.5 px-3 text-right text-emerald-800">Kredit (Masuk)</th>
                        <th className="py-2.5 px-3 text-right text-rose-800">Debit (Keluar)</th>
                        <th className="py-2.5 px-3 text-right">Sisa Saldo</th>
                        <th className="py-2.5 px-2 text-center w-12">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {filteredKas.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-neutral-400 italic">
                            Belum ada transaksi kas untuk kelompok {financeGroup}.
                          </td>
                        </tr>
                      ) : (
                        filteredKas.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-neutral-50/50">
                            <td className="py-2 px-3 text-center text-neutral-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-2.5 font-medium text-neutral-700 whitespace-nowrap">
                              {item.tanggal}
                            </td>
                            <td className="py-2 px-3 font-semibold text-neutral-900">
                              <div>{item.kebutuhan}</div>
                              <div className="text-[10px] font-normal text-neutral-400 capitalize">
                                Kategori: {item.kategori}
                              </div>
                            </td>
                            <td className="py-2 px-2.5 text-center text-neutral-700">
                              {item.volume} {item.satuan}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-neutral-800">
                              {formatRupiah(item.harga)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-700">
                              {item.kredit > 0 ? formatRupiah(item.kredit) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                              {item.debit > 0 ? formatRupiah(item.debit) : '—'}
                            </td>
                            <td
                              className={`py-2 px-3 text-right font-mono font-bold ${
                                item.sisa_saldo < 0 ? 'text-rose-600' : 'text-neutral-900'
                              }`}
                            >
                              {formatRupiah(item.sisa_saldo)}
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteKas(item.id)}
                                className="p-1 text-neutral-400 hover:text-rose-600 transition-colors"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    {filteredKas.length > 0 && (
                      <tfoot>
                        <tr className="bg-neutral-100/80 font-bold border-t-2 border-neutral-300 text-neutral-900">
                          <td colSpan={7} className="py-2.5 px-3 text-right uppercase tracking-wider text-[10px]">
                            Saldo Akhir {financeGroup}:
                          </td>
                          <td
                            className={`py-2.5 px-3 text-right font-mono text-sm ${
                              totalSaldoGroup < 0 ? 'text-rose-600' : 'text-neutral-900'
                            }`}
                          >
                            {formatRupiah(totalSaldoGroup)}
                          </td>
                          <td />
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default WeeklyReportFormPage
