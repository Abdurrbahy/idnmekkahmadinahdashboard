import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  User,
  Calendar,
  Info,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import logoIDN from '@/assets/logo-idn-mekkah-madinah.png'
import {
  todayRiyadh,
  pekanMulai,
  pekanSelesai,
  formatPekanDisplay,
  addDaysToDate,
  getActiveDaysInWeek,
  formatDateRiyadh,
  formatDateShortRiyadh,
  isHariAktif,
} from '@/lib/dateUtils'
import {
  cetakDenganNama,
  nomorPekanBulan,
  namaFileDailyBatch,
} from '@/lib/printUtils'
import {
  fetchStudents,
  fetchAttendanceSessions,
  fetchAttendanceLogsRange,
  fetchSubmissionsRange,
  fetchMutabaahActivities,
  fetchMutabaahRecordsRange,
  fetchWeeklyActivities,
} from '@/lib/supabase'
import type {
  Student,
  AttendanceSession,
  AttendanceLog,
  Submission,
  MutabaahActivity,
  MutabaahRecord,
  Activity,
} from '@/types/database'
import { formatQuranDetail } from '@/data/staticData'

export const DailyBatchReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const defaultPekan = pekanMulai(todayRiyadh())
  const rawPekanParam = searchParams.get('pekan') || defaultPekan
  const pekanParam = pekanMulai(rawPekanParam)
  const rawSantriParam = searchParams.get('santri')

  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [mutabaahActs, setMutabaahActs] = useState<MutabaahActivity[]>([])

  const [rangeLogs, setRangeLogs] = useState<AttendanceLog[]>([])
  const [rangeSubs, setRangeSubs] = useState<Submission[]>([])
  const [rangeMutabaah, setRangeMutabaah] = useState<MutabaahRecord[]>([])
  const [rangeActs, setRangeActs] = useState<Activity[]>([])

  const [loading, setLoading] = useState(true)

  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'

  // 1. Fetch Master Data
  useEffect(() => {
    async function loadMaster() {
      const [st, ses, mActs] = await Promise.all([
        fetchStudents(),
        fetchAttendanceSessions(),
        fetchMutabaahActivities(),
      ])
      setStudents(st)
      setSessions(ses)
      setMutabaahActs(mActs)
    }
    loadMaster()
  }, [])

  // 2. Fetch Range Data (5 Active Days)
  const loadData = useCallback(async (pMulai: string) => {
    setLoading(true)
    const pAkhir = pekanSelesai(pMulai)
    try {
      const [logs, subs, muts, acts] = await Promise.all([
        fetchAttendanceLogsRange(pMulai, pAkhir),
        fetchSubmissionsRange(pMulai, pAkhir),
        fetchMutabaahRecordsRange(pMulai, pAkhir),
        fetchWeeklyActivities(pMulai),
      ])
      setRangeLogs(logs)
      setRangeSubs(subs)
      setRangeMutabaah(muts)
      setRangeActs(acts)
    } catch (e) {
      console.warn('Error loading daily batch report data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(pekanParam)
  }, [pekanParam, loadData])

  // Determine Selected Student
  const selectedStudent = useMemo(() => {
    if (students.length === 0) return null
    if (!isStaff) {
      return students[0] // Locked for walsan
    }
    if (rawSantriParam) {
      const sId = Number(rawSantriParam)
      return students.find((s) => s.id === sId) || null
    }
    return null
  }, [students, isStaff, rawSantriParam])

  // 5 Active Days: Ahad - Kamis
  const activeDays = useMemo(() => getActiveDaysInWeek(pekanParam), [pekanParam])
  const pekanInfo = useMemo(() => nomorPekanBulan(pekanParam), [pekanParam])

  const handleWeekChange = (newPekan: string) => {
    setSearchParams((prev) => {
      prev.set('pekan', newPekan)
      return prev
    })
  }

  const handleSelectStudent = (sId: number) => {
    setSearchParams((prev) => {
      prev.set('santri', String(sId))
      return prev
    })
  }

  // Robust student weekly statistics calculated directly from range data
  const studentStats = useMemo(() => {
    if (!selectedStudent) return null
    const sId = selectedStudent.id

    // Attendance stats
    const studentActiveLogs = rangeLogs.filter(
      (l) => l.student_id === sId && isHariAktif(l.tanggal)
    )
    const hadirLogs = studentActiveLogs.filter((l) => l.status === 'hadir')
    const nonHadirLogs = studentActiveLogs.filter((l) => l.status !== 'hadir')
    const distinctActiveDaysWithLogs = new Set(studentActiveLogs.map((l) => l.tanggal)).size
    const distinctHadirDays = new Set(hadirLogs.map((l) => l.tanggal)).size

    const totalPossibleSessions = Math.max(20, studentActiveLogs.length || 20)
    const kehadiranPct = Math.round((hadirLogs.length / totalPossibleSessions) * 100)

    // Submissions stats
    const studentSubs = rangeSubs.filter((s) => s.student_id === sId)
    const ziyadahAyat = studentSubs
      .filter((s) => s.jenis === 'ziyadah')
      .reduce((acc, curr) => acc + Number(curr.capaian || 0), 0)
    const murajaahAyat = studentSubs
      .filter((s) => s.jenis === 'murajaah')
      .reduce((acc, curr) => acc + Number(curr.capaian || 0), 0)
    const totalAyat = ziyadahAyat + murajaahAyat

    // Mutabaah stats
    const studentMuts = rangeMutabaah.filter((m) => m.student_id === sId)
    const distinctMutDays = new Set(studentMuts.map((m) => m.tanggal)).size

    const coreActs = mutabaahActs.filter((a) => a.aktif && a.target_harian !== null)
    const totalBobotDaily = coreActs.reduce((acc, curr) => acc + Number(curr.bobot || 1), 0)

    // Calculate score & completed amalan per day
    let totalScoreSum = 0
    let daysWithScoreCount = 0
    const dailyCompletedAmalanCounts: number[] = []

    // Check completion counts per activity across 5 active days
    const activityCompletionMap: Record<number, number> = {}
    coreActs.forEach((act) => {
      activityCompletionMap[act.id] = 0
    })

    activeDays.forEach((day) => {
      const dayMuts = studentMuts.filter((m) => m.tanggal === day.date)
      if (dayMuts.length > 0 && totalBobotDaily > 0) {
        let dayEarned = 0
        let dayCompletedCount = 0
        coreActs.forEach((act) => {
          const rec = dayMuts.find((r) => r.activity_id === act.id)
          const b = Number(act.bobot || 1)
          if (rec) {
            const isDone =
              act.tipe === 'boolean'
                ? rec.status === 'done'
                : Number(rec.jumlah || 0) >= Number(act.target_harian || 1)

            if (isDone) {
              dayEarned += b
              dayCompletedCount++
              activityCompletionMap[act.id] = (activityCompletionMap[act.id] || 0) + 1
            } else if (act.tipe !== 'boolean') {
              const cap = Math.min(Number(rec.jumlah || 0) / Number(act.target_harian || 1), 1)
              dayEarned += cap * b
            }
          }
        })
        const dayPct = Math.round((dayEarned / totalBobotDaily) * 100)
        totalScoreSum += dayPct
        daysWithScoreCount++
        dailyCompletedAmalanCounts.push(dayCompletedCount)
      }
    })

    const avgMutScore =
      daysWithScoreCount > 0 ? Math.round(totalScoreSum / daysWithScoreCount) : 0
    const avgCompletedAmalan =
      dailyCompletedAmalanCounts.length > 0
        ? Math.round(
            (dailyCompletedAmalanCounts.reduce((a, b) => a + b, 0) /
              dailyCompletedAmalanCounts.length) *
              10
          ) / 10
        : 0

    // List activities never recorded/completed across the week (0 completions)
    const neverCompletedActs = coreActs.filter(
      (act) => (activityCompletionMap[act.id] || 0) === 0
    )

    // Bonus fasting count
    const bonusPuasaCount = studentMuts.filter((m) => {
      const act = mutabaahActs.find((a) => a.id === m.activity_id)
      return act?.target_harian === null && m.status === 'done'
    }).length

    return {
      totalPossibleSessions,
      hadirLogsCount: hadirLogs.length,
      nonHadirLogs,
      kehadiranPct,
      distinctActiveDaysWithLogs,
      distinctHadirDays,
      studentSubs,
      submissionCount: studentSubs.length,
      ziyadahAyat,
      murajaahAyat,
      totalAyat,
      distinctMutDays,
      avgMutScore,
      coreActsCount: coreActs.length,
      avgCompletedAmalan,
      neverCompletedActs,
      bonusPuasaCount,
    }
  }, [selectedStudent, rangeLogs, rangeSubs, rangeMutabaah, mutabaahActs, activeDays])

  // Check if there is any data across 5 active days for this student
  const hasAnyDataForStudent = useMemo(() => {
    if (!selectedStudent) return false
    const sId = selectedStudent.id
    const hasLogs = rangeLogs.some((l) => l.student_id === sId)
    const hasSubs = rangeSubs.some((s) => s.student_id === sId)
    const hasMuts = rangeMutabaah.some((m) => m.student_id === sId)
    return hasLogs || hasSubs || hasMuts
  }, [selectedStudent, rangeLogs, rangeSubs, rangeMutabaah])

  const handlePrint = () => {
    if (!selectedStudent) return
    const fileName = namaFileDailyBatch(selectedStudent.nama, pekanParam)
    cetakDenganNama(fileName)
  }

  const nowPrintTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Riyadh',
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date())
    } catch {
      return pekanParam
    }
  }, [pekanParam])

  return (
    <div className="min-h-screen bg-neutral-100/60 pb-20 text-neutral-900 font-sans print:bg-white print:p-0 print:pb-0">
      {/* 1. SCREEN CONTROLS BAR (print:hidden) */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 px-4 py-3 shadow-2xs print:hidden">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs font-semibold gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              <span className="text-xs font-bold text-neutral-800">
                Laporan Harian Sepekan (5 Hari Aktif)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Week Navigator */}
              <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
                <Button
                  variant="ghost"
                  size="xsIcon"
                  onClick={() => handleWeekChange(addDaysToDate(pekanParam, -7))}
                  className="h-7 w-7 text-neutral-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 font-semibold text-neutral-800">
                  {pekanInfo.labelPekan}
                </span>
                <Button
                  variant="ghost"
                  size="xsIcon"
                  onClick={() => handleWeekChange(addDaysToDate(pekanParam, 7))}
                  className="h-7 w-7 text-neutral-600"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Student Picker (Admin/Atasan) */}
              {isStaff && (
                <select
                  value={selectedStudent?.id || ''}
                  onChange={(e) => handleSelectStudent(Number(e.target.value))}
                  className="h-8 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-800 focus:outline-none"
                >
                  <option value="" disabled>
                    Pilih Santri...
                  </option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              )}

              {/* Print Button */}
              {selectedStudent && hasAnyDataForStudent && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs gap-1.5 shadow-2xs"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak / Simpan PDF</span>
                </Button>
              )}
            </div>
          </div>

          {/* Print Tip Notice */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sky-50 border border-sky-200/80 text-[11px] text-sky-900">
            <Info className="h-3.5 w-3.5 text-sky-700 shrink-0" />
            <span>
              <b>Tips Cetak:</b> Pada dialog cetak browser, matikan opsi <b>"Headers and footers"</b> agar URL dan tanggal peramban tidak ikut tercetak di atas/bawah halaman.
            </span>
          </div>
        </div>
      </div>

      {/* 2. DOCUMENT BODY */}
      <div className="max-w-[210mm] mx-auto my-4 sm:my-6 print:m-0 print:max-w-none">
        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-sm text-center text-xs text-neutral-500">
            Memuat rekap harian 5 hari aktif...
          </div>
        ) : !selectedStudent ? (
          /* NO STUDENT SELECTED (Admin prompt) */
          <div className="bg-white p-10 rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4 max-w-md mx-auto">
            <User className="h-10 w-10 text-neutral-400 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-neutral-800">
              Pilih Santri Terlebih Dahulu
            </h3>
            <p className="text-xs text-neutral-500">
              Ekspor gabungan harian disusun khusus per santri (5 halaman hari aktif + sampul & penutup).
            </p>
            <div className="grid grid-cols-1 gap-2 pt-2 text-left">
              {students.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSelectStudent(s.id)}
                  className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-xs font-bold text-neutral-800 transition-colors"
                >
                  <span>{s.nama}</span>
                  <span className="text-neutral-500 font-normal">Kelas {s.kelas}</span>
                </button>
              ))}
            </div>
          </div>
        ) : !hasAnyDataForStudent ? (
          /* EMPTY STATE (All 5 days empty) */
          <div className="bg-white p-12 rounded-2xl border border-neutral-200 shadow-sm text-center space-y-4 max-w-md mx-auto">
            <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-neutral-800">
              Belum Ada Data Tercatat
            </h3>
            <p className="text-xs text-neutral-500">
              Tidak ada catatan presensi, setoran, maupun mutabaah untuk {selectedStudent.nama} pada{' '}
              {pekanInfo.labelPekan}.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs"
            >
              Kembali ke Dashboard
            </Button>
          </div>
        ) : (
          /* COMPLETE DOCUMENT: COVER (Page 1) + 5 DAILY PAGES (Pages 2-6) + CLOSING (Page 7) */
          <div className="space-y-8 print:space-y-0 text-neutral-900">
            {/* ========================================================================= */}
            {/* 1. COVER PAGE (PAGE 1) */}
            {/* ========================================================================= */}
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:rounded-none print:h-auto print:min-h-0 print:break-inside-avoid print:break-before-auto">
              <div>
                {/* IDN Kop with Logo Image */}
                <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={logoIDN}
                      alt="IDN Boarding School"
                      className="h-10 sm:h-12 w-auto object-contain print:h-[14mm] print:w-auto print:opacity-100"
                    />
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    Waktu Saudi (Asia/Riyadh, UTC+3)
                  </span>
                </div>

                {/* Title & Santri Badge */}
                <div className="mt-8 space-y-2.5">
                  <div className="inline-block px-3 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-bold uppercase tracking-wider">
                    Arsip Laporan Harian (5 Hari Aktif)
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900">
                    {pekanInfo.labelPekan}
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600">
                    Periode: {formatPekanDisplay(pekanParam)} (Ahad — Kamis)
                  </p>
                </div>

                {/* Profile Santri Box */}
                <div className="mt-6 p-5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Nama Santri:</span>
                      <span className="text-base font-bold text-neutral-900">
                        {selectedStudent.nama}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Kelas:</span>
                      <span className="text-base font-bold text-neutral-800">
                        Kelas {selectedStudent.kelas}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Musyrif Pendamping:</span>
                      <span className="font-semibold text-neutral-800">
                        Abdurrahman Asyam A, S.Kom.
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-neutral-400 block">Status Hari:</span>
                      <span className="font-semibold text-neutral-800">
                        5 Hari Aktif (Jumat & Sabtu Libur)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Weekly Summary KPIs (Accurate calculation) */}
                {studentStats && (
                  <div className="mt-6 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                      Ringkasan Capaian Sepekan
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center border border-neutral-200 rounded-xl p-4 bg-white">
                      <div>
                        <div className="text-2xl font-bold text-neutral-900">
                          {studentStats.kehadiranPct}%
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">
                          Kehadiran Sesi
                        </div>
                        <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                          {studentStats.distinctActiveDaysWithLogs}/5 hari aktif
                        </div>
                      </div>
                      <div className="border-l border-neutral-200">
                        <div className="text-2xl font-bold text-neutral-900">
                          {studentStats.totalAyat}
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">
                          Total Ayat Disetor
                        </div>
                        <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                          {studentStats.submissionCount} kali setoran
                        </div>
                      </div>
                      <div className="border-l border-neutral-200">
                        <div className="text-2xl font-bold text-neutral-900">
                          {studentStats.avgMutScore}%
                        </div>
                        <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider mt-0.5">
                          Rata Mutabaah
                        </div>
                        <div className="text-[10px] text-neutral-500 font-medium mt-0.5">
                          {studentStats.distinctMutDays}/7 hari
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cover Footer */}
              <div className="border-t border-neutral-200 pt-4 mt-8 flex items-center justify-between text-xs text-neutral-400">
                <span>Dokumen Resmi IDN Boarding School</span>
                <span>Dicetak pada {nowPrintTime}</span>
              </div>
            </div>

            {/* ========================================================================= */}
            {/* 2–6. 5 DAILY REPORT SECTIONS (AHAD TO KAMIS: PAGES 2-6) */}
            {/* ========================================================================= */}
            {activeDays.map((day, dIdx) => {
              const dateStr = day.date
              const dayLogs = rangeLogs.filter(
                (l) => l.student_id === selectedStudent.id && l.tanggal === dateStr
              )
              const daySubs = rangeSubs.filter(
                (s) => s.student_id === selectedStudent.id && s.tanggal === dateStr
              )
              const dayMuts = rangeMutabaah.filter(
                (m) => m.student_id === selectedStudent.id && m.tanggal === dateStr
              )
              const dayActs = rangeActs.filter((a) => a.tanggal === dateStr)

              const isDayEmpty =
                dayLogs.length === 0 && daySubs.length === 0 && dayMuts.length === 0

              const hadirSesiCount = dayLogs.filter((l) => l.status === 'hadir').length

              return (
                <div
                  key={dateStr}
                  className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:rounded-none print:h-auto print:min-h-0 print:break-inside-avoid print:break-before-page"
                >
                  <div className="space-y-4">
                    {/* Header Hari */}
                    <div className="border-b border-neutral-900 pb-2 flex items-baseline justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                          Hari Ke-{dIdx + 1} dari 5 Hari Aktif
                        </span>
                        <h2 className="text-base font-bold text-neutral-900">
                          {formatDateRiyadh(dateStr)}
                        </h2>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-neutral-900">
                          {selectedStudent.nama}
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          Kelas {selectedStudent.kelas}
                        </span>
                      </div>
                    </div>

                    {isDayEmpty ? (
                      /* EMPTY DAY NOTICE */
                      <div className="py-14 text-center border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                        <Calendar className="h-7 w-7 text-neutral-300 mx-auto" />
                        <div className="text-xs font-bold text-neutral-600">
                          Belum ada data tercatat untuk hari ini.
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Tidak ada catatan presensi, setoran, maupun amalan mutabaah yang diisi.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3.5 text-xs">
                        {/* 1. Presensi 4 Sesi */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-800">
                            I. Presensi Harian (4 Sesi)
                          </h4>
                          <table className="w-full text-left border border-neutral-300 border-collapse">
                            <thead>
                              <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[10px]">
                                {sessions.map((ses) => (
                                  <th key={ses.id} className="py-1 px-2 text-center border-r border-neutral-300">
                                    {ses.nama}
                                  </th>
                                ))}
                                <th className="py-1 px-2 text-center w-24">Rekap Hadir</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {sessions.map((ses) => {
                                  const log = dayLogs.find((l) => l.session_id === ses.id)
                                  const status = log?.status || 'hadir'
                                  const bg =
                                    status === 'hadir'
                                      ? 'bg-emerald-50 text-emerald-950 font-bold'
                                      : status === 'izin'
                                      ? 'bg-amber-50 text-amber-950 font-bold'
                                      : status === 'sakit'
                                      ? 'bg-sky-50 text-sky-950 font-bold'
                                      : 'bg-rose-50 text-rose-950 font-bold'

                                  return (
                                    <td key={ses.id} className={`py-1.5 px-2 text-center border-r border-neutral-200 ${bg}`}>
                                      <div className="capitalize">{status}</div>
                                      {log?.catatan && (
                                        <div className="text-[9px] font-normal italic text-neutral-600 mt-0.5">
                                          "{log.catatan}"
                                        </div>
                                      )}
                                    </td>
                                  )
                                })}
                                <td className="py-1.5 px-2 text-center font-bold text-neutral-900">
                                  {hadirSesiCount}/{sessions.length} Sesi
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* 2. Setoran Qur'an & Pembelajaran */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-800">
                            II. Setoran Al-Qur'an, Hafalan & Kuis
                          </h4>
                          {daySubs.length === 0 ? (
                            <p className="text-[11px] italic text-neutral-400 p-2 border border-neutral-200 rounded">
                              Tidak ada setoran hafalan atau kuis pada tanggal ini.
                            </p>
                          ) : (
                            <table className="w-full text-left border border-neutral-300 border-collapse text-xs">
                              <thead>
                                <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[10px]">
                                  <th className="py-1 px-2 border-r border-neutral-300">Mata Pelajaran</th>
                                  <th className="py-1 px-2 border-r border-neutral-300">Materi / Bab / Ayat</th>
                                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-20">Capaian</th>
                                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-24">Status</th>
                                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-14">Nilai</th>
                                  <th className="py-1 px-2">Catatan Musyrif</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {daySubs.map((sub, idx) => {
                                  const qDetail = sub.quran_details?.[0]
                                  const quizDetail = sub.quiz_details?.[0]
                                  const isKuis = sub.subject?.mode_input === 'kuis' || Boolean(quizDetail)

                                  let materiElement: React.ReactNode = `${sub.capaian} ${sub.satuan}`
                                  let capaianText = `${sub.capaian} ${sub.satuan}`
                                  let statusText = sub.status.replace('_', ' ')

                                  if (qDetail) {
                                    const qInfo = formatQuranDetail(
                                      qDetail.surah_awal,
                                      qDetail.ayat_awal,
                                      qDetail.surah_akhir,
                                      qDetail.ayat_akhir
                                    )
                                    materiElement = (
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold bg-purple-50 text-purple-900 border border-purple-200 print:bg-neutral-100 print:text-neutral-900 print:border-neutral-300">
                                          {qInfo.juzLabel}
                                        </span>
                                        <span className="font-medium text-neutral-900">{qInfo.surahRangeText}</span>
                                      </div>
                                    )
                                    capaianText = `${sub.capaian} ayat`
                                    statusText =
                                      sub.status === 'lancar'
                                        ? 'Lancar'
                                        : sub.status === 'kurang_lancar'
                                        ? 'Kurang Lancar'
                                        : 'Mengulang'
                                  } else if (isKuis && quizDetail) {
                                    const b = quizDetail.kitab_bab
                                    const mText = b
                                      ? `${b.kitab} ${b.jilid ? 'jilid ' + b.jilid + ' ' : ''}— Bab ${b.nomor_bab}: ${b.judul_bab}`
                                      : quizDetail.kitab_manual || 'Kuis Harian'
                                    materiElement = <span>{mText}</span>
                                    capaianText = `${quizDetail.soal_benar}/${quizDetail.soal_total} soal`
                                    statusText =
                                      sub.status === 'lancar'
                                        ? 'Tuntas'
                                        : sub.status === 'kurang_lancar'
                                        ? 'Perlu Perbaikan'
                                        : 'Remedial'
                                  } else {
                                    statusText =
                                      sub.status === 'lancar'
                                        ? 'Lancar'
                                        : sub.status === 'kurang_lancar'
                                        ? 'Kurang Lancar'
                                        : 'Mengulang'
                                  }

                                  return (
                                    <tr key={sub.id || idx}>
                                      <td className="py-1 px-2 border-r border-neutral-200 font-semibold">
                                        {sub.subject?.nama || sub.jenis}
                                      </td>
                                      <td className="py-1 px-2 border-r border-neutral-200 font-normal">
                                        {materiElement}
                                      </td>
                                      <td className="py-1 px-2 text-center border-r border-neutral-200 font-bold">
                                        {capaianText}
                                      </td>
                                      <td className="py-1 px-2 text-center border-r border-neutral-200 font-semibold capitalize">
                                        {statusText}
                                      </td>
                                      <td className="py-1 px-2 text-center border-r border-neutral-200 font-bold font-mono">
                                        {sub.nilai !== null ? sub.nilai : '—'}
                                      </td>
                                      <td className="py-1 px-2 italic text-neutral-600 text-[11px]">
                                        {sub.catatan || '—'}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          )}
                        </div>

                        {/* 3. Mutabaah Yaumiyah Checklist */}
                        <div className="space-y-1">
                          <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-800">
                            III. Mutabaah Yaumiyah (Amalan Harian)
                          </h4>
                          <div className="border border-neutral-300 rounded overflow-hidden">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[10px]">
                                  <th className="py-1 px-2 border-r border-neutral-300 w-8 text-center">No</th>
                                  <th className="py-1 px-2 border-r border-neutral-300">Amalan Yaumiyah</th>
                                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-24">Target</th>
                                  <th className="py-1 px-2 text-center border-r border-neutral-300 w-24">Capaian</th>
                                  <th className="py-1 px-2 text-center w-24">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-neutral-200">
                                {mutabaahActs
                                  .filter((a) => a.aktif)
                                  .map((act, aIdx) => {
                                    const rec = dayMuts.find((m) => m.activity_id === act.id)
                                    const isDone =
                                      act.tipe === 'boolean'
                                        ? rec?.status === 'done'
                                        : Number(rec?.jumlah || 0) >= Number(act.target_harian || 1)

                                    const valDisplay =
                                      act.tipe === 'boolean'
                                        ? rec?.status === 'done'
                                          ? '✓ Terlaksana'
                                          : '○ Belum'
                                        : `${rec?.jumlah || 0} / ${act.target_harian} ${act.satuan || ''}`

                                    return (
                                      <tr key={act.id}>
                                        <td className="py-1 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500 text-[10px]">
                                          {aIdx + 1}
                                        </td>
                                        <td className="py-1 px-2 border-r border-neutral-200 font-medium">
                                          {act.nama}
                                        </td>
                                        <td className="py-1 px-2 text-center border-r border-neutral-200 text-neutral-600">
                                          {act.target_harian ? `${act.target_harian} ${act.satuan || ''}` : 'Bonus'}
                                        </td>
                                        <td className="py-1 px-2 text-center border-r border-neutral-200 font-semibold font-mono">
                                          {valDisplay}
                                        </td>
                                        <td className="py-1 px-2 text-center font-bold">
                                          {isDone ? (
                                            <span className="text-emerald-700">Tuntas ✓</span>
                                          ) : (
                                            <span className="text-neutral-400 font-normal">—</span>
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  })}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* 4. Kegiatan Bersama */}
                        {dayActs.length > 0 && (
                          <div className="space-y-1">
                            <h4 className="font-bold text-[11px] uppercase tracking-wider text-neutral-800">
                              IV. Agenda & Kegiatan Khusus
                            </h4>
                            <div className="p-2 border border-neutral-200 rounded bg-neutral-50/50 space-y-1">
                              {dayActs.map((act, actIdx) => (
                                <div key={act.id || actIdx} className="text-[11px] text-neutral-700">
                                  <span className="font-bold text-neutral-900 mr-1.5">•</span>
                                  <span className="font-semibold text-neutral-900">
                                    [{act.activity_type?.nama || 'Kegiatan'}]
                                  </span>{' '}
                                  <span>{act.judul}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Day Footer */}
                  <div className="border-t border-neutral-200 pt-3 mt-4 flex items-center justify-between text-[10px] text-neutral-400">
                    <span>
                      {selectedStudent.nama} • {formatDateShortRiyadh(dateStr)}
                    </span>
                    <span>Halaman Hari Ke-{dIdx + 1}</span>
                  </div>
                </div>
              )
            })}

            {/* ========================================================================= */}
            {/* 7. CLOSING & SIGNATURE PAGE (PAGE 7) */}
            {/* ========================================================================= */}
            <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-neutral-200 flex flex-col justify-between print:border-none print:shadow-none print:p-8 print:rounded-none print:h-auto print:min-h-0 print:break-inside-avoid print:break-before-page">
              <div>
                <div className="border-b border-neutral-900 pb-3 flex items-baseline justify-between">
                  <h2 className="text-lg font-bold text-neutral-900">
                    Penutup & Evaluasi Faktual Sepekan
                  </h2>
                  <span className="text-xs font-semibold text-neutral-500">
                    {pekanInfo.labelPekan}
                  </span>
                </div>

                {studentStats && (
                  <div className="mt-5 space-y-4 text-xs">
                    {/* 1. Ringkasan Faktual Data */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-2.5">
                      <span className="font-bold text-neutral-900 block text-xs uppercase tracking-wider">
                        I. Rangkuman Data Capaian Sepekan ({selectedStudent.nama})
                      </span>
                      <ul className="space-y-1.5 text-neutral-700 leading-relaxed list-disc list-inside">
                        <li>
                          <b>Kehadiran Sesi:</b> {studentStats.hadirLogsCount} dari {studentStats.totalPossibleSessions} sesi tercatat hadir ({studentStats.kehadiranPct}%).
                          {studentStats.nonHadirLogs.length > 0 ? (
                            <span className="text-neutral-600 italic">
                              {' '}(Catatan: {studentStats.nonHadirLogs.map((l) => `${l.status} pada ${formatDateShortRiyadh(l.tanggal)}`).join(', ')})
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium"> (Hadir lengkap seluruh sesi)</span>
                          )}
                        </li>
                        <li>
                          <b>Setoran Hafalan:</b> {studentStats.submissionCount} kali setoran, total {studentStats.totalAyat} ayat ({studentStats.ziyadahAyat} ayat ziyadah, {studentStats.murajaahAyat} ayat murajaah).
                        </li>
                        <li>
                          <b>Amalan Yaumiyah:</b> Tuntas rata-rata {studentStats.avgCompletedAmalan} dari {studentStats.coreActsCount} amalan harian (Rata skor: {studentStats.avgMutScore}%).
                          {studentStats.bonusPuasaCount > 0 && (
                            <span className="text-purple-900 font-semibold"> +{studentStats.bonusPuasaCount}× puasa sunnah.</span>
                          )}
                        </li>
                        <li>
                          <b>Belum tercatat sepekan ini:</b>{' '}
                          {studentStats.neverCompletedActs.length > 0 ? (
                            <span className="text-amber-800 font-semibold">
                              {studentStats.neverCompletedActs.map((a) => a.nama).join(', ')}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-medium">
                              Semua amalan harian telah tercatat tuntas setidaknya satu kali sepekan ini.
                            </span>
                          )}
                        </li>
                      </ul>
                    </div>

                    {/* 2. Kolom Catatan Musyrif (Manual / Tulis Tangan) */}
                    <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-2">
                      <span className="font-bold text-neutral-800 block text-xs">
                        II. Catatan Khusus Musyrif / Pembimbing:
                      </span>
                      <div className="space-y-4 pt-1">
                        <div className="border-b border-dashed border-neutral-300 pb-3" />
                        <div className="border-b border-dashed border-neutral-300 pb-3" />
                        <div className="border-b border-dashed border-neutral-300 pb-3" />
                      </div>
                    </div>

                    {/* 3. Doa Penutup */}
                    <p className="text-[11px] text-neutral-500 italic leading-relaxed pt-1">
                      "Semoga Allah Subhanahu wa Ta'ala senantiasa memberkahi hafalan, menjaga keistiqamahan ibadah, dan menganugerahkan taufik dalam menuntut ilmu syar'i di Tanah Suci."
                    </p>
                  </div>
                )}
              </div>

              {/* Signature */}
              <div className="border-t border-neutral-200 pt-6 mt-8 flex items-end justify-between text-xs">
                <div className="text-[10px] text-neutral-400">
                  IDN Boarding School • Program Mekkah & Madinah
                </div>

                <div className="text-center min-w-[220px]">
                  <p className="text-xs font-semibold text-neutral-800">
                    Musyrif / Pembimbing IDN
                  </p>
                  <div className="h-16" />
                  <div className="w-48 mx-auto border-b border-neutral-900" />
                  <p className="text-xs font-bold text-neutral-900 mt-1">
                    Abdurrahman Asyam A, S.Kom.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DailyBatchReportPage
