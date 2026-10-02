import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  pekanMulai,
  pekanSelesai,
  formatPekanDisplay,
  addDaysToDate,
  getDaysInWeek,
  formatDateRiyadh,
  formatDateShortRiyadh,
  isHariAktif,
} from '@/lib/dateUtils'
import {
  cetakDenganNama,
  nomorPekanBulan,
  namaFileLaporanPekanan,
} from '@/lib/printUtils'
import logoIDN from '@/assets/logo-idn-mekkah-madinah.png'
import {
  fetchStudents,
  fetchWeeklyAttendance,
  fetchWeeklyQuran,
  fetchWeeklyQuiz,
  fetchWeeklyMutabaah,
  fetchWeeklyActivities,
  fetchAttendanceLogsRange,
  fetchSubmissionsRange,
  fetchMutabaahDailyScoresRange,
} from '@/lib/supabase'
import type {
  Student,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyQuiz,
  WeeklyMutabaah,
  Activity,
  AttendanceLog,
  Submission,
  MutabaahDailyScore,
} from '@/types/database'
import { ALL_SURAHS } from '@/data/staticData'

export const WeeklyReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const defaultPekan = pekanMulai(todayRiyadh())
  const rawPekanParam = searchParams.get('pekan') || defaultPekan
  const pekanParam = pekanMulai(rawPekanParam) // Always anchor to Sunday
  const santriParam = searchParams.get('santri') || 'all'

  const [students, setStudents] = useState<Student[]>([])
  const [weeklyAttendance, setWeeklyAttendance] = useState<WeeklyAttendance[]>([])
  const [weeklyQuran, setWeeklyQuran] = useState<WeeklyQuran[]>([])
  const [weeklyQuiz, setWeeklyQuiz] = useState<WeeklyQuiz[]>([])
  const [weeklyMutabaah, setWeeklyMutabaah] = useState<WeeklyMutabaah[]>([])
  const [weeklyActivities, setWeeklyActivities] = useState<Activity[]>([])

  const [rangeLogs, setRangeLogs] = useState<AttendanceLog[]>([])
  const [rangeSubs, setRangeSubs] = useState<Submission[]>([])
  const [rangeScores, setRangeScores] = useState<MutabaahDailyScore[]>([])

  const [loading, setLoading] = useState(true)

  // 1. Fetch Master Students
  useEffect(() => {
    async function loadMaster() {
      const st = await fetchStudents()
      setStudents(st)
    }
    loadMaster()
  }, [])

  // 2. Fetch Weekly Stats and Range Records
  const loadData = useCallback(async (pMulai: string) => {
    setLoading(true)
    const pAkhir = pekanSelesai(pMulai)
    try {
      const [wAtt, wQur, wQuiz, wMut, wAct, rLogs, rSubs, rScores] = await Promise.all([
        fetchWeeklyAttendance(pMulai),
        fetchWeeklyQuran(pMulai),
        fetchWeeklyQuiz(pMulai),
        fetchWeeklyMutabaah(pMulai),
        fetchWeeklyActivities(pMulai),
        fetchAttendanceLogsRange(pMulai, pAkhir),
        fetchSubmissionsRange(pMulai, pAkhir),
        fetchMutabaahDailyScoresRange(pMulai, pAkhir),
      ])
      setWeeklyAttendance(wAtt)
      setWeeklyQuran(wQur)
      setWeeklyQuiz(wQuiz)
      setWeeklyMutabaah(wMut)
      setWeeklyActivities(wAct)
      setRangeLogs(rLogs)
      setRangeSubs(rSubs)
      setRangeScores(rScores)
    } catch (e) {
      console.warn('Error loading weekly report data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(pekanParam)
  }, [pekanParam, loadData])

  // Filter students based on role & query param
  const userRole = profile?.role || 'walsan'
  const isStaff = userRole === 'admin' || userRole === 'atasan'

  const visibleStudents = useMemo(() => {
    if (!isStaff) {
      return students // RLS automatically filters
    }
    if (santriParam !== 'all') {
      const sId = Number(santriParam)
      return students.filter((s) => s.id === sId)
    }
    return students
  }, [students, isStaff, santriParam])

  const hasAnyData =
    rangeLogs.length > 0 ||
    rangeSubs.length > 0 ||
    weeklyActivities.length > 0 ||
    weeklyAttendance.length > 0

  const daysInWeek = useMemo(() => getDaysInWeek(pekanParam), [pekanParam])
  const pekanInfo = useMemo(() => nomorPekanBulan(pekanParam), [pekanParam])

  // Overall KPIs
  const overallAvgAttendance = useMemo(() => {
    const relevant = weeklyAttendance.filter((a) =>
      visibleStudents.some((s) => s.id === a.student_id)
    )
    if (relevant.length === 0) return 0
    const sum = relevant.reduce((acc, curr) => acc + Number(curr.persen_kehadiran || 0), 0)
    return Math.round(sum / relevant.length)
  }, [weeklyAttendance, visibleStudents])

  const overallTotalAyat = useMemo(() => {
    return weeklyQuran
      .filter((q) => visibleStudents.some((s) => s.id === q.student_id))
      .reduce((acc, curr) => acc + Number(curr.total_quran_ayat || 0), 0)
  }, [weeklyQuran, visibleStudents])

  const overallAvgMutabaah = useMemo(() => {
    const relevant = weeklyMutabaah.filter((m) =>
      visibleStudents.some((s) => s.id === m.student_id)
    )
    if (relevant.length === 0) return 0
    const sum = relevant.reduce((acc, curr) => acc + Number(curr.rata_skor_mutabaah || 0), 0)
    return Math.round(sum / relevant.length)
  }, [weeklyMutabaah, visibleStudents])

  const handleWeekChange = (newPekan: string) => {
    setSearchParams((prev) => {
      prev.set('pekan', newPekan)
      return prev
    })
  }

  const handleStudentChange = (sId: string) => {
    setSearchParams((prev) => {
      if (sId === 'all') {
        prev.delete('santri')
      } else {
        prev.set('santri', sId)
      }
      return prev
    })
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
    <div className="min-h-screen bg-neutral-100/50 print:bg-white text-neutral-900 font-sans pb-16 print:pb-0">
      {/* 1. SCREEN CONTROL BAR (print:hidden) */}
      <div className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs font-semibold gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Dashboard
            </Button>
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

            {/* Student Filter */}
            {isStaff && (
              <select
                value={santriParam}
                onChange={(e) => handleStudentChange(e.target.value)}
                className="h-8 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-800 focus:outline-none"
              >
                <option value="all">Semua Santri</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            )}

            {/* Print Button */}
            {hasAnyData && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const santriNama =
                    santriParam !== 'all' && visibleStudents.length === 1
                      ? visibleStudents[0].nama
                      : null
                  const fileName = namaFileLaporanPekanan(santriNama, pekanParam)
                  cetakDenganNama(fileName)
                }}
                className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold text-xs gap-1.5 shadow-2xs"
              >
                <Printer className="h-4 w-4" />
                Cetak / Simpan PDF
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. DOCUMENT BODY */}
      <div className="max-w-[210mm] mx-auto bg-white p-6 sm:p-10 my-4 sm:my-6 rounded-2xl shadow-sm border border-neutral-200 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {loading ? (
          <div className="py-20 text-center text-xs text-neutral-500">
            Memuat data rekap pekanan...
          </div>
        ) : !hasAnyData ? (
          /* EMPTY STATE */
          <div className="py-24 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-neutral-800">
              Belum ada data tercatat untuk periode ini.
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Tidak ada aktivitas, kehadiran, atau setoran hafalan yang tercatat pada pekan{' '}
              {pekanInfo.labelPekan} ({formatPekanDisplay(pekanParam)}).
            </p>
            <div className="pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="text-xs"
              >
                Kembali ke Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* D1. KOP LAPORAN PEKANAN */}
            <div className="border-b border-neutral-900 pb-3 flex items-start justify-between gap-4">
              <div>
                <img
                  src={logoIDN}
                  alt="IDN Boarding School"
                  className="h-10 sm:h-12 w-auto object-contain print:h-[14mm] print:w-auto print:opacity-100"
                />
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-2">
                  Laporan Pekanan Santri — {pekanInfo.labelPekan}
                </h1>
                <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                  Periode: {formatPekanDisplay(pekanParam)} (Ahad — Kamis aktif)
                </p>
              </div>

              <div className="text-right text-[11px] text-neutral-400">
                <span>Waktu Saudi (Asia/Riyadh, UTC+3)</span>
                {santriParam !== 'all' && (
                  <div className="mt-1 font-bold text-neutral-800 text-xs">
                    Santri: {visibleStudents[0]?.nama}
                  </div>
                )}
              </div>
            </div>

            {/* D2. RINGKASAN PEKAN (4 Angka) */}
            <div className="grid grid-cols-4 gap-2 border border-neutral-200 rounded-lg p-3 text-center print-avoid-break">
              <div>
                <div className="text-lg font-bold text-neutral-900">
                  {overallAvgAttendance}%
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Rata Kehadiran
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {overallTotalAyat}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Total Ayat Disetor
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {overallAvgMutabaah}%
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Rata-rata Mutabaah
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {weeklyActivities.length}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Kegiatan Terlaksana
                </div>
              </div>
            </div>

            {/* D3. REKAPITULASI PER SANTRI */}
            <div className="space-y-1.5 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  I. Rekapitulasi Capaian Santri Sepekan
                </h3>
                <span className="text-[10px] text-neutral-500 font-medium">
                  Hari aktif program: Ahad – Kamis (Jumat & Sabtu libur)
                </span>
              </div>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                      <th className="py-2 px-3 border-r border-neutral-300">Nama Santri</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-16">Kelas</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">% Kehadiran</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Hadir (hari)</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Total Ayat</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Rata Mutabaah</th>
                      <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Mutabaah (hari)</th>
                      <th className="py-2 px-2.5 text-center w-20">Puasa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-900">
                    {visibleStudents.map((st) => {
                      const att = weeklyAttendance.find((a) => a.student_id === st.id)
                      const quran = weeklyQuran.find((q) => q.student_id === st.id)
                      const mut = weeklyMutabaah.find((m) => m.student_id === st.id)

                      const hadirPct = att ? Math.round(Number(att.persen_kehadiran || 0)) : null
                      let hariHadir: number | undefined = att?.hari_aktif_terisi !== undefined && att?.hari_aktif_terisi !== null ? att.hari_aktif_terisi : undefined
                      if (hariHadir === undefined && rangeLogs.length > 0) {
                        const dSet = new Set(
                          rangeLogs
                            .filter((l) => l.student_id === st.id && l.status === 'hadir' && isHariAktif(l.tanggal))
                            .map((l) => l.tanggal)
                        )
                        hariHadir = dSet.size
                      }

                      const totalAyat = quran ? Number(quran.total_quran_ayat || 0) : 0
                      const mutScore = mut ? Math.round(Number(mut.rata_skor_mutabaah || 0)) : 0
                      const hariMut = mut?.hari_terisi !== undefined && mut?.hari_terisi !== null ? mut.hari_terisi : undefined
                      const bonusPuasa = mut ? Number(mut.jumlah_bonus || 0) : 0

                      return (
                        <tr key={st.id}>
                          <td className="py-2 px-3 border-r border-neutral-200 font-bold">
                            {st.nama}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 text-neutral-600">
                            Kelas {st.kelas}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold">
                            {hadirPct !== null ? `${hadirPct}%` : '—'}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-medium font-mono">
                            {hariHadir !== undefined ? `${hariHadir}/5 hari` : '—'}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold text-neutral-900">
                            {totalAyat} ayat
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold">
                            {mutScore}%
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-medium font-mono">
                            {hariMut !== undefined ? `${hariMut}/7 hari` : '—'}
                          </td>
                          <td className="py-2 px-2.5 text-center font-semibold text-purple-950">
                            {bonusPuasa > 0 ? `${bonusPuasa}×` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-neutral-500 italic mt-1">
                * Keterangan: Hari aktif program adalah Ahad – Kamis (5 hari). Jumat & Sabtu libur KBM. Amalan mutabaah yaumiyah tetap tercatat 7 hari penuh.
              </p>

              {/* Rekap Kuis Kitab (Nahwu & Mapel Kuis) - BAGIAN D2 & D3 */}
              {weeklyQuiz.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-2 print-avoid-break text-xs">
                  <div className="font-bold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Rekap Kuis Kitab Sepekan (Nahwu & Mapel Kuis)</span>
                    <span className="text-[10px] text-neutral-500 lowercase font-normal">
                      Penilaian per bab materi
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-neutral-800">
                    {visibleStudents.map((st) => {
                      const stQuizzes = weeklyQuiz.filter((q) => q.student_id === st.id)
                      if (stQuizzes.length === 0) return null
                      return (
                        <div
                          key={st.id}
                          className="p-2.5 bg-white rounded-lg border border-neutral-200/80 shadow-2xs space-y-1"
                        >
                          <div className="font-bold text-neutral-900 text-xs">{st.nama}</div>
                          {stQuizzes.map((q, qIdx) => (
                            <div key={qIdx} className="text-[11px] text-neutral-700">
                              <span className="font-semibold text-neutral-900">{q.mapel}:</span>{' '}
                              <span className="font-bold">{q.jumlah_kuis} kuis</span> •{' '}
                              <span className="font-bold">{q.total_benar}/{q.total_soal} soal</span> (
                              {Math.round((q.total_benar / Math.max(1, q.total_soal)) * 100)}%) • Rata-rata:{' '}
                              <b className="text-neutral-900">{q.rata_nilai}</b>
                              {q.bab_terakhir && (
                                <div className="text-[10px] text-neutral-500 italic mt-0.5">
                                  Terakhir: {q.bab_terakhir}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* D4. RINCIAN HARIAN PER SANTRI (Page break per student on print) */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 print-avoid-break">
                II. Rincian Capaian Harian Santri (Ahad — Sabtu)
              </h3>

              {visibleStudents.map((st) => {
                const studentSubs = rangeSubs.filter((s) => s.student_id === st.id)

                return (
                  <div
                    key={st.id}
                    className="space-y-3 p-3 border border-neutral-200 rounded-lg print:border-neutral-300 print-avoid-break print-page-break"
                  >
                    <div className="flex items-baseline justify-between border-b border-neutral-200 pb-1.5">
                      <div>
                        <span className="font-bold text-neutral-900 text-sm">{st.nama}</span>
                        <span className="text-neutral-500 text-xs ml-2">Kelas {st.kelas}</span>
                      </div>
                      <span className="text-[11px] text-neutral-400">Rincian 7 Hari</span>
                    </div>

                    {/* 7-Days Matrix Table */}
                    <table className="w-full text-left text-xs border border-neutral-200 border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-[10px] font-bold text-neutral-700">
                          <th className="py-1.5 px-2 border-r border-neutral-200">Hari & Tanggal</th>
                          <th className="py-1.5 px-2 text-center border-r border-neutral-200">Kehadiran (Sesi)</th>
                          <th className="py-1.5 px-2 text-center border-r border-neutral-200">Setoran Qur'an</th>
                          <th className="py-1.5 px-2 text-center">Skor Mutabaah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {daysInWeek.map((day) => {
                          const isWeekendDay = day.dayName === 'Jumat' || day.dayName === 'Sabtu'
                          const dayLogs = rangeLogs.filter(
                            (l) => l.student_id === st.id && l.tanggal === day.date
                          )
                          const hadirCount = dayLogs.filter((l) => l.status === 'hadir').length
                          const hasLogs = dayLogs.length > 0

                          const daySubs = studentSubs.filter((s) => s.tanggal === day.date)
                          const dayQuranSubs = daySubs.filter(
                            (s) =>
                              s.satuan === 'ayat' ||
                              s.jenis === 'ziyadah' ||
                              s.jenis === 'murajaah' ||
                              Boolean(s.quran_details?.length)
                          )
                          const totalAyatDay = dayQuranSubs.reduce(
                            (acc, curr) => acc + (Number(curr.capaian) || 0),
                            0
                          )

                          const dayScore = rangeScores.find(
                            (sc) => sc.student_id === st.id && sc.tanggal === day.date
                          )

                          return (
                            <tr key={day.date} className="text-neutral-800">
                              <td className="py-1.5 px-2 border-r border-neutral-200 font-medium">
                                <span className="font-semibold">{day.dayName}</span>, {day.shortDate}
                                {isWeekendDay && (
                                  <span className="ml-1.5 text-[10px] font-normal text-neutral-400">
                                    (Libur)
                                  </span>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-center border-r border-neutral-200">
                                {hasLogs ? (
                                  `${hadirCount}/4 Sesi`
                                ) : isWeekendDay ? (
                                  <span className="text-neutral-400 font-normal italic">Libur KBM</span>
                                ) : (
                                  <span className="text-neutral-300 font-mono">—</span>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-center border-r border-neutral-200 font-semibold">
                                {dayQuranSubs.length > 0 ? (
                                  `${totalAyatDay} ayat (${dayQuranSubs.length} setoran)`
                                ) : isWeekendDay ? (
                                  <span className="text-neutral-400 font-normal italic">Libur KBM</span>
                                ) : (
                                  <span className="text-neutral-300 font-mono">—</span>
                                )}
                              </td>
                              <td className="py-1.5 px-2 text-center font-bold">
                                {dayScore ? (
                                  `${dayScore.skor_persen}%`
                                ) : (
                                  <span className="text-neutral-300 font-mono">—</span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>

                    {/* Student Weekly Submissions Feed */}
                    <div className="space-y-2 pt-1.5">
                      <div className="text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
                        Catatan Setoran & Kuis Santri Pekan Ini:
                      </div>
                      {studentSubs.length === 0 ? (
                        <div className="text-[11px] italic text-neutral-400 p-2.5 rounded border border-neutral-200 bg-neutral-50/50">
                          Belum ada setoran hafalan atau kuis dicatat pekan ini.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {Array.from(new Set(studentSubs.map((s) => s.tanggal)))
                            .sort()
                            .map((tgl) => {
                              const daySubs = studentSubs.filter((s) => s.tanggal === tgl)
                              return (
                                <div
                                  key={tgl}
                                  className="border border-neutral-300 rounded overflow-hidden text-xs"
                                >
                                  {/* Day Header Banner */}
                                  <div className="bg-neutral-100/90 px-3 py-1 border-b border-neutral-200 flex items-center justify-between text-[11px] font-bold text-neutral-800">
                                    <span>{formatDateRiyadh(tgl)}</span>
                                    <span className="text-[10px] font-medium text-neutral-500">
                                      {daySubs.length} Catatan
                                    </span>
                                  </div>

                                  {/* Submissions Table for this Day */}
                                  <table className="w-full text-left text-[11px] border-collapse">
                                    <thead>
                                      <tr className="bg-neutral-50/70 border-b border-neutral-200 text-[10px] font-bold text-neutral-600">
                                        <th className="py-1 px-2.5 border-r border-neutral-200 w-28">
                                          Mata Pelajaran
                                        </th>
                                        <th className="py-1 px-2.5 border-r border-neutral-200">
                                          Materi & Rincian Setoran
                                        </th>
                                        <th className="py-1 px-2 text-center border-r border-neutral-200 w-16">
                                          Nilai
                                        </th>
                                        <th className="py-1 px-2 text-center w-24">Status</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200 text-neutral-800">
                                      {daySubs.map((sub, sIdx) => {
                                        const qDetail = sub.quran_details?.[0]
                                        const quizDetail = sub.quiz_details?.[0]
                                        const isKuis =
                                          sub.subject?.mode_input === 'kuis' || Boolean(quizDetail)

                                        let detailText = `${sub.capaian} ${sub.satuan}`
                                        let statusLabel = sub.status.replace('_', ' ')
                                        let statusBadgeClass =
                                          'bg-neutral-100 text-neutral-700 border-neutral-200'

                                        if (qDetail) {
                                          const sAwal =
                                            ALL_SURAHS.find((s) => s.nomor === qDetail.surah_awal)
                                              ?.nama_latin || ''
                                          const sAkhir =
                                            ALL_SURAHS.find((s) => s.nomor === qDetail.surah_akhir)
                                              ?.nama_latin || ''
                                          detailText = `${sAwal} ${qDetail.ayat_awal}–${sAkhir} ${qDetail.ayat_akhir} (${sub.capaian} ayat)`
                                          if (sub.status === 'lancar') {
                                            statusLabel = 'Lancar'
                                            statusBadgeClass =
                                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          } else if (sub.status === 'kurang_lancar') {
                                            statusLabel = 'Kurang Lancar'
                                            statusBadgeClass =
                                              'bg-amber-50 text-amber-800 border-amber-200'
                                          } else {
                                            statusLabel = 'Mengulang'
                                            statusBadgeClass =
                                              'bg-rose-50 text-rose-800 border-rose-200'
                                          }
                                        } else if (isKuis && quizDetail) {
                                          const b = quizDetail.kitab_bab
                                          const babName = b
                                            ? `${b.kitab} — Bab ${b.nomor_bab}: ${b.judul_bab}`
                                            : quizDetail.kitab_manual || 'Kuis Harian'
                                          detailText = `${babName} (${quizDetail.soal_benar}/${quizDetail.soal_total} soal benar)`
                                          if (sub.status === 'lancar') {
                                            statusLabel = 'Tuntas'
                                            statusBadgeClass =
                                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          } else if (sub.status === 'kurang_lancar') {
                                            statusLabel = 'Perlu Perbaikan'
                                            statusBadgeClass =
                                              'bg-amber-50 text-amber-800 border-amber-200'
                                          } else {
                                            statusLabel = 'Remedial'
                                            statusBadgeClass =
                                              'bg-rose-50 text-rose-800 border-rose-200'
                                          }
                                        } else {
                                          if (sub.status === 'lancar') {
                                            statusLabel = 'Lancar'
                                            statusBadgeClass =
                                              'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          } else if (sub.status === 'kurang_lancar') {
                                            statusLabel = 'Kurang Lancar'
                                            statusBadgeClass =
                                              'bg-amber-50 text-amber-800 border-amber-200'
                                          } else {
                                            statusLabel = 'Mengulang'
                                            statusBadgeClass =
                                              'bg-rose-50 text-rose-800 border-rose-200'
                                          }
                                        }

                                        return (
                                          <tr key={sub.id || sIdx}>
                                            <td className="py-1.5 px-2.5 border-r border-neutral-200 font-semibold text-neutral-900 align-top">
                                              {sub.subject?.nama || sub.jenis}
                                            </td>
                                            <td className="py-1.5 px-2.5 border-r border-neutral-200 align-top">
                                              <div className="font-medium text-neutral-900">
                                                {detailText}
                                              </div>
                                              {sub.catatan && (
                                                <div className="text-[10px] text-neutral-600 italic mt-0.5">
                                                  Catatan: “{sub.catatan}”
                                                </div>
                                              )}
                                            </td>
                                            <td className="py-1.5 px-2 text-center border-r border-neutral-200 font-bold font-mono align-top">
                                              {sub.nilai !== null && sub.nilai !== undefined
                                                ? sub.nilai
                                                : '—'}
                                            </td>
                                            <td className="py-1.5 px-2 text-center align-top">
                                              <span
                                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${statusBadgeClass}`}
                                              >
                                                {statusLabel}
                                              </span>
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              )
                            })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* D6. KEGIATAN SEPEKAN */}
            <div className="space-y-1.5 print-avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                III. Agenda Kegiatan Sepekan
              </h3>
              {weeklyActivities.length === 0 ? (
                <div className="p-3 rounded border border-neutral-200 text-xs italic text-neutral-400 text-center">
                  Tidak ada agenda kegiatan tercatat pada pekan ini
                </div>
              ) : (
                <div className="border border-neutral-300 rounded divide-y divide-neutral-200">
                  {weeklyActivities.map((act) => (
                    <div key={act.id} className="p-2.5 text-xs space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-neutral-900 text-sm">
                          [{formatDateShortRiyadh(act.tanggal)}] {act.judul || act.activity_type?.nama}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {act.jumlah_hadir}/{act.jumlah_total || 4} Santri • Ustadz: {act.penanggung_jawab || '—'}
                        </span>
                      </div>
                      {act.keterangan && (
                        <p className="text-neutral-700 leading-relaxed">
                          {act.keterangan}
                        </p>
                      )}
                      {act.link_google_photo && (
                        <div className="text-[10px] text-neutral-500 font-mono break-all pt-0.5">
                          Album Foto: {act.link_google_photo}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* D7. KAKI LAPORAN & TANDA TANGAN */}
            <div className="pt-4 border-t border-neutral-300 space-y-4 print-avoid-break">
              <div className="text-right text-[10px] text-neutral-500 italic">
                Dicetak pada {nowPrintTime} waktu Saudi
              </div>

              <div className="flex justify-end pt-2">
                <div className="text-center min-w-[220px]">
                  <p className="text-xs font-semibold text-neutral-800">
                    Musyrif / Pembimbing IDN
                  </p>
                  <div className="h-16" />
                  <div className="w-48 mx-auto border-b border-neutral-900" />
                  <p className="text-[11px] text-neutral-500 mt-1">Nama & Tanda Tangan</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
