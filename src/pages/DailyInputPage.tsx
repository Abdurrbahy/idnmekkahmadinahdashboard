import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import {
  UserCheck,
  BookOpen,
  Sparkles,
  CalendarDays,
  LayoutGrid,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { Header } from '../components/Header'
import type { ViewMode } from '../components/Header'
import { DailySummaryCard } from '../components/daily-input/DailySummaryCard'
import { AttendanceSection } from '../components/daily-input/AttendanceSection'
import { QuranSubmissionSection } from '../components/daily-input/QuranSubmissionSection'
import { MutabaahSection } from '../components/daily-input/MutabaahSection'
import { ActivitiesSection } from '../components/daily-input/ActivitiesSection'
import { WeeklyOverviewSection } from '../components/weekly/WeeklyOverviewSection'
import { SupabaseConfigModal } from '../components/SupabaseConfigModal'
import type { AppLayoutOutletContext } from '@/layouts/AppLayout'
import {
  todayRiyadh,
  pekanMulai,
} from '@/lib/dateUtils'
import {
  getSupabaseCredentials,
  fetchStudents,
  fetchAttendanceSessions,
  fetchAttendanceLogs,
  fetchSubjects,
  fetchSubmissions,
  fetchMutabaahActivities,
  fetchMutabaahRecords,
  fetchActivityTypes,
  fetchActivities,
  fetchWeeklyAttendance,
  fetchWeeklyQuran,
  fetchWeeklyQuiz,
  fetchWeeklyMutabaah,
  fetchWeeklyActivities,
  fetchWeeklyAttendanceLogs,
  fetchWeeklySubmissions,
} from '@/lib/supabase'
import type {
  Student,
  AttendanceSession,
  AttendanceLog,
  Subject,
  Submission,
  MutabaahActivity,
  MutabaahRecord,
  ActivityType,
  Activity,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyQuiz,
  WeeklyMutabaah,
} from '@/types/database'

type TabType = 'all' | 'attendance' | 'quran' | 'mutabaah' | 'activities'

type OutletContextType = Partial<AppLayoutOutletContext>

export const DailyInputPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { onToggleSidebar, setHasUnsavedChanges: reportUnsavedToLayout } =
    useOutletContext<OutletContextType>() || {}

  const modeParam = searchParams.get('mode') === 'weekly' ? 'weekly' : 'daily'
  const [selectedDate, setSelectedDate] = useState<string>(todayRiyadh())
  const [viewMode, setViewMode] = useState<ViewMode>(modeParam)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [hasAttendanceUnsaved, setHasAttendanceUnsaved] = useState(false)
  const [hasMutabaahUnsaved, setHasMutabaahUnsaved] = useState(false)

  // Sync viewMode with URL searchParams
  useEffect(() => {
    const urlMode = searchParams.get('mode') === 'weekly' ? 'weekly' : 'daily'
    if (urlMode !== viewMode) {
      setViewMode(urlMode)
    }
  }, [searchParams])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    setSearchParams((prev) => {
      if (mode === 'weekly') {
        prev.set('mode', 'weekly')
      } else {
        prev.delete('mode')
      }
      return prev
    })
  }

  // Master Data
  const [students, setStudents] = useState<Student[]>([])
  const [attendanceSessions, setAttendanceSessions] = useState<AttendanceSession[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [mutabaahActivities, setMutabaahActivities] = useState<MutabaahActivity[]>([])
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([])

  // Daily Records
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [mutabaahRecords, setMutabaahRecords] = useState<MutabaahRecord[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  // Weekly Stats & Raw 7-day Logs
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance[]>([])
  const [weeklyQuran, setWeeklyQuran] = useState<WeeklyQuran[]>([])
  const [weeklyQuiz, setWeeklyQuiz] = useState<WeeklyQuiz[]>([])
  const [weeklyMutabaah, setWeeklyMutabaah] = useState<WeeklyMutabaah[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([])
  const [weeklyRawAttendance, setWeeklyRawAttendance] = useState<AttendanceLog[]>([])
  const [weeklyRawSubmissions, setWeeklyRawSubmissions] = useState<Submission[]>([])

  const { isConfigured } = getSupabaseCredentials()

  // Which date the daily records currently in state belong to. The input
  // sections are only rendered when this matches selectedDate, so records
  // from a previous date can never be edited or saved under a new date.
  const [loadedDate, setLoadedDate] = useState<string | null>(null)
  const [dailyError, setDailyError] = useState<string | null>(null)
  const [refreshWarning, setRefreshWarning] = useState<string | null>(null)
  const dailyRequestId = useRef(0)
  const loadedDateRef = useRef<string | null>(null)

  // Unsaved flags only count while the daily form is actually on screen. The
  // sections unmount in weekly mode / while loading and cannot report back.
  const isDailyFormVisible = viewMode === 'daily' && loadedDate === selectedDate && !dailyError
  const hasAnyUnsavedChanges = isDailyFormVisible && (hasAttendanceUnsaved || hasMutabaahUnsaved)

  // The Header already confirmed discarding edits before the date changes;
  // the input sections remount for the new date, so clear the flags here.
  const handleDateChange = (date: string) => {
    setHasAttendanceUnsaved(false)
    setHasMutabaahUnsaved(false)
    setSelectedDate(date)
  }

  // Let the sidebar confirm before navigating away from unsaved edits.
  useEffect(() => {
    reportUnsavedToLayout?.(hasAnyUnsavedChanges)
  }, [hasAnyUnsavedChanges, reportUnsavedToLayout])
  useEffect(() => () => reportUnsavedToLayout?.(false), [reportUnsavedToLayout])

  // 1. Browser BeforeUnload Warning for Unsaved Changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasAnyUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasAnyUnsavedChanges])

  // 2. Load Master Data once
  const loadMasterData = useCallback(async () => {
    try {
      const [st, ses, sub, mut, act] = await Promise.all([
        fetchStudents(),
        fetchAttendanceSessions(),
        fetchSubjects(),
        fetchMutabaahActivities(),
        fetchActivityTypes(),
      ])
      setStudents(st)
      setAttendanceSessions(ses)
      setSubjects(sub)
      setMutabaahActivities(mut)
      setActivityTypes(act)
    } catch (e) {
      console.warn('Error loading master data:', e)
    }
  }, [])

  useEffect(() => {
    loadMasterData()
  }, [loadMasterData])

  // 3. Load Daily Data
  const loadDailyData = useCallback(async (date: string) => {
    const requestId = ++dailyRequestId.current
    setDailyError(null)
    setRefreshWarning(null)
    try {
      const [att, sub, mut, act] = await Promise.all([
        fetchAttendanceLogs(date),
        fetchSubmissions(date),
        fetchMutabaahRecords(date),
        fetchActivities(date),
      ])
      // Ignore responses for a date the user has already navigated away from.
      if (requestId !== dailyRequestId.current) return
      setAttendanceLogs(att)
      setSubmissions(sub)
      setMutabaahRecords(mut)
      setActivities(act)
      loadedDateRef.current = date
      setLoadedDate(date)
    } catch (e) {
      if (requestId !== dailyRequestId.current) return
      const message = e instanceof Error ? e.message : 'Gagal memuat data harian.'
      if (loadedDateRef.current === date) {
        // Background refresh of a date that already loaded fine (e.g. after a
        // save): keep the form and any unsaved edits, just warn.
        setRefreshWarning(message)
      } else {
        loadedDateRef.current = null
        setLoadedDate(null)
        setDailyError(message)
      }
    }
  }, [])

  // 4. Load Weekly Data (including 7-day raw logs for charts)
  const loadWeeklyData = useCallback(async (date: string) => {
    const pMulai = pekanMulai(date)
    try {
      const [wAtt, wQur, wQuiz, wMut, wAct, wRawAtt, wRawSubs] = await Promise.all([
        fetchWeeklyAttendance(pMulai),
        fetchWeeklyQuran(pMulai),
        fetchWeeklyQuiz(pMulai),
        fetchWeeklyMutabaah(pMulai),
        fetchWeeklyActivities(pMulai),
        fetchWeeklyAttendanceLogs(pMulai),
        fetchWeeklySubmissions(pMulai),
      ])
      setWeeklyAttendance(wAtt)
      setWeeklyQuran(wQur)
      setWeeklyQuiz(wQuiz)
      setWeeklyMutabaah(wMut)
      setWeeklyActivities(wAct)
      setWeeklyRawAttendance(wRawAtt)
      setWeeklyRawSubmissions(wRawSubs)
    } catch (e) {
      console.warn('Error loading weekly data:', e)
    }
  }, [])

  // 5. Combined Refresh
  const refreshCurrentData = useCallback(async () => {
    if (viewMode === 'daily') {
      await loadDailyData(selectedDate)
    } else {
      await loadWeeklyData(selectedDate)
    }
  }, [selectedDate, viewMode, loadDailyData, loadWeeklyData])

  useEffect(() => {
    refreshCurrentData()
  }, [refreshCurrentData])

  // 6. Auto-refetch on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      // Skip while the user has unsaved edits: a refetch must never replace
      // (or, on failure, hide) what they are in the middle of typing.
      if (document.visibilityState === 'visible' && !hasAnyUnsavedChanges) {
        refreshCurrentData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshCurrentData, hasAnyUnsavedChanges])

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'all', label: 'Semua Bagian', icon: LayoutGrid },
    { id: 'attendance', label: 'Presensi 4 Sesi', icon: UserCheck },
    { id: 'quran', label: "Setoran Qur'an", icon: BookOpen, count: submissions.length },
    { id: 'mutabaah', label: 'Mutabaah Yaumiyah', icon: Sparkles },
    { id: 'activities', label: 'Kegiatan & Foto', icon: CalendarDays, count: activities.length },
  ]

  const currentPekanMulai = pekanMulai(selectedDate)
  const isDailyReady = loadedDate === selectedDate && !dailyError

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20 text-neutral-900 font-sans">
      {/* Header */}
      <Header
        pageTitle={viewMode === 'daily' ? 'Input Harian' : 'Rekap Pekanan'}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        onToggleSidebar={onToggleSidebar}
        isConfigured={isConfigured}
        onOpenConfig={() => setIsConfigOpen(true)}
        hasUnsavedChanges={hasAnyUnsavedChanges}
        students={students}
      />

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* VIEW MODE 1: HARIAN */}
        {viewMode === 'daily' ? (
          dailyError ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-5 sm:p-6 text-rose-900"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" aria-hidden="true" />
                <div className="space-y-3 min-w-0">
                  <div>
                    <h2 className="text-sm font-bold">Data tanggal ini belum bisa dimuat</h2>
                    <p className="mt-1 text-sm text-rose-800 break-words">{dailyError}</p>
                    <p className="mt-1 text-xs text-rose-700">
                      Form input disembunyikan agar data yang sudah tersimpan tidak tertimpa.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadDailyData(selectedDate)}
                    className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 min-h-[44px]"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Coba lagi
                  </button>
                </div>
              </div>
            </div>
          ) : !isDailyReady ? (
            <div className="space-y-4" aria-busy="true" aria-live="polite">
              <span className="sr-only">Memuat data harian…</span>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-white border border-neutral-200 animate-pulse" />
                ))}
              </div>
              <div className="h-10 w-2/3 rounded-lg bg-white border border-neutral-200 animate-pulse" />
              <div className="h-72 rounded-xl bg-white border border-neutral-200 animate-pulse" />
            </div>
          ) : (
          <>
            {refreshWarning && (
              <div
                role="status"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <span className="min-w-0 break-words">
                  Data terbaru belum termuat ulang. {refreshWarning}
                </span>
                <button
                  type="button"
                  onClick={() => loadDailyData(selectedDate)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-100 min-h-[36px]"
                >
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                  Muat ulang
                </button>
              </div>
            )}
            {/* Top Metric Cards */}
            <DailySummaryCard
              selectedDate={selectedDate}
              students={students}
              attendanceLogs={attendanceLogs}
              attendanceSessions={attendanceSessions}
              submissions={submissions}
              mutabaahRecords={mutabaahRecords}
              mutabaahActivities={mutabaahActivities}
              activities={activities}
            />

            {/* Horizontal Scrollable Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto border-b border-neutral-200/80 pb-2 scrollbar-none">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/80'
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

            {/* Tab Contents */}
            <div className="space-y-6">
              {(activeTab === 'all' || activeTab === 'attendance') && (
                <AttendanceSection
                  selectedDate={selectedDate}
                  students={students}
                  sessions={attendanceSessions}
                  initialLogs={attendanceLogs}
                  onLogsUpdated={refreshCurrentData}
                  onUnsavedChangeState={setHasAttendanceUnsaved}
                />
              )}

              {(activeTab === 'all' || activeTab === 'quran') && (
                <QuranSubmissionSection
                  selectedDate={selectedDate}
                  students={students}
                  subjects={subjects}
                  submissions={submissions}
                  onSubmissionsUpdated={refreshCurrentData}
                />
              )}

              {(activeTab === 'all' || activeTab === 'mutabaah') && (
                <MutabaahSection
                  selectedDate={selectedDate}
                  students={students}
                  activities={mutabaahActivities}
                  initialRecords={mutabaahRecords}
                  onRecordsUpdated={refreshCurrentData}
                  onUnsavedChangeState={setHasMutabaahUnsaved}
                />
              )}

              {(activeTab === 'all' || activeTab === 'activities') && (
                <ActivitiesSection
                  selectedDate={selectedDate}
                  activityTypes={activityTypes}
                  activities={activities}
                  onActivitiesUpdated={refreshCurrentData}
                />
              )}
            </div>
          </>
          )
        ) : (
          /* VIEW MODE 2: PEKANAN */
          <WeeklyOverviewSection
            pekanMulaiStr={currentPekanMulai}
            students={students}
            weeklyAttendance={weeklyAttendance}
            weeklyQuran={weeklyQuran}
            weeklyQuiz={weeklyQuiz}
            weeklyMutabaah={weeklyMutabaah}
            weeklyActivities={weeklyActivities}
            rawAttendanceLogs={weeklyRawAttendance}
            rawSubmissions={weeklyRawSubmissions}
          />
        )}
      </main>

      {/* Sticky Bottom Bar for Mobile when there are unsaved changes */}
      {hasAnyUnsavedChanges && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-neutral-900 text-white px-4 py-3 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom sm:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 animate-pulse" />
            <span>Ada perubahan belum disimpan</span>
          </div>
          <span className="text-[11px] text-neutral-300">Gunakan tombol simpan pada kartu</span>
        </div>
      )}

      {/* Supabase Config Modal */}
      <SupabaseConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onConnectionSuccess={refreshCurrentData}
      />
    </div>
  )
}
