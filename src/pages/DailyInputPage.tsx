import React, { useState, useEffect, useCallback } from 'react'
import {
  UserCheck,
  BookOpen,
  Sparkles,
  CalendarDays,
  LayoutGrid,
  AlertTriangle,
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
  WeeklyMutabaah,
} from '@/types/database'

type TabType = 'all' | 'attendance' | 'quran' | 'mutabaah' | 'activities'

export const DailyInputPage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(todayRiyadh())
  const [viewMode, setViewMode] = useState<ViewMode>('daily')
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [hasAttendanceUnsaved, setHasAttendanceUnsaved] = useState(false)
  const [hasMutabaahUnsaved, setHasMutabaahUnsaved] = useState(false)

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
  const [weeklyMutabaah, setWeeklyMutabaah] = useState<WeeklyMutabaah[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([])
  const [weeklyRawAttendance, setWeeklyRawAttendance] = useState<AttendanceLog[]>([])
  const [weeklyRawSubmissions, setWeeklyRawSubmissions] = useState<Submission[]>([])

  const { isConfigured } = getSupabaseCredentials()

  const hasAnyUnsavedChanges = hasAttendanceUnsaved || hasMutabaahUnsaved

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
    try {
      const [att, sub, mut, act] = await Promise.all([
        fetchAttendanceLogs(date),
        fetchSubmissions(date),
        fetchMutabaahRecords(date),
        fetchActivities(date),
      ])
      setAttendanceLogs(att)
      setSubmissions(sub)
      setMutabaahRecords(mut)
      setActivities(act)
    } catch (e) {
      console.warn('Error loading daily data:', e)
    }
  }, [])

  // 4. Load Weekly Data (including 7-day raw logs for charts)
  const loadWeeklyData = useCallback(async (date: string) => {
    const pMulai = pekanMulai(date)
    try {
      const [wAtt, wQur, wMut, wAct, wRawAtt, wRawSubs] = await Promise.all([
        fetchWeeklyAttendance(pMulai),
        fetchWeeklyQuran(pMulai),
        fetchWeeklyMutabaah(pMulai),
        fetchWeeklyActivities(pMulai),
        fetchWeeklyAttendanceLogs(pMulai),
        fetchWeeklySubmissions(pMulai),
      ])
      setWeeklyAttendance(wAtt)
      setWeeklyQuran(wQur)
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
      if (document.visibilityState === 'visible') {
        refreshCurrentData()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [refreshCurrentData])

  const tabs: { id: TabType; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'all', label: 'Semua Bagian', icon: LayoutGrid },
    { id: 'attendance', label: 'Presensi 4 Sesi', icon: UserCheck },
    { id: 'quran', label: "Setoran Qur'an", icon: BookOpen, count: submissions.length },
    { id: 'mutabaah', label: 'Mutabaah Yaumiyah', icon: Sparkles },
    { id: 'activities', label: 'Kegiatan & Foto', icon: CalendarDays, count: activities.length },
  ]

  const currentPekanMulai = pekanMulai(selectedDate)

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20 text-neutral-900 font-sans">
      {/* Header */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        isConfigured={isConfigured}
        onOpenConfig={() => setIsConfigOpen(true)}
        hasUnsavedChanges={hasAnyUnsavedChanges}
      />

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-6 space-y-6">
        {/* VIEW MODE 1: HARIAN */}
        {viewMode === 'daily' ? (
          <>
            {/* Top Metric Cards */}
            <DailySummaryCard
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
        ) : (
          /* VIEW MODE 2: PEKANAN */
          <WeeklyOverviewSection
            pekanMulaiStr={currentPekanMulai}
            students={students}
            weeklyAttendance={weeklyAttendance}
            weeklyQuran={weeklyQuran}
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
