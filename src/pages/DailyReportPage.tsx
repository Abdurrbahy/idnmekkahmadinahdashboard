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
  formatDateRiyadh,
  addDaysToDate,
  isHariAktif,
} from '@/lib/dateUtils'
import {
  cetakDenganNama,
  namaFileLaporanHarian,
} from '@/lib/printUtils'
import logoIDN from '@/assets/logo-idn-mekkah-madinah.png'
import {
  fetchStudents,
  fetchAttendanceSessions,
  fetchAttendanceLogs,
  fetchSubmissions,
  fetchMutabaahActivities,
  fetchMutabaahRecords,
  fetchActivities,
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
import { ALL_SURAHS } from '@/data/staticData'

export const DailyReportPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  const tanggalParam = searchParams.get('tanggal') || todayRiyadh()
  const santriParam = searchParams.get('santri') || 'all'

  const [students, setStudents] = useState<Student[]>([])
  const [sessions, setSessions] = useState<AttendanceSession[]>([])
  const [mutabaahActs, setMutabaahActs] = useState<MutabaahActivity[]>([])

  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [mutabaahRecords, setMutabaahRecords] = useState<MutabaahRecord[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  const [loading, setLoading] = useState(true)

  // 1. Fetch Master Data
  useEffect(() => {
    async function loadMaster() {
      const [st, ses, acts] = await Promise.all([
        fetchStudents(),
        fetchAttendanceSessions(),
        fetchMutabaahActivities(),
      ])
      setStudents(st)
      setSessions(ses)
      setMutabaahActs(acts)
    }
    loadMaster()
  }, [])

  // 2. Fetch Daily Data
  const loadData = useCallback(async (tgl: string) => {
    setLoading(true)
    try {
      const [att, sub, mut, act] = await Promise.all([
        fetchAttendanceLogs(tgl),
        fetchSubmissions(tgl),
        fetchMutabaahRecords(tgl),
        fetchActivities(tgl),
      ])
      setAttendanceLogs(att)
      setSubmissions(sub)
      setMutabaahRecords(mut)
      setActivities(act)
    } catch (e) {
      console.warn('Error loading daily report data:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(tanggalParam)
  }, [tanggalParam, loadData])

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
    attendanceLogs.length > 0 ||
    submissions.length > 0 ||
    mutabaahRecords.length > 0 ||
    activities.length > 0

  // 3. Score Calculations
  const coreMutabaahActs = useMemo(
    () => mutabaahActs.filter((a) => a.aktif && a.target_harian !== null),
    [mutabaahActs]
  )

  const studentScores = useMemo(() => {
    const map: Record<
      number,
      { scorePct: number; tuntas: number; total: number; bonusPuasa: boolean }
    > = {}

    const totalBobot = coreMutabaahActs.reduce(
      (acc, curr) => acc + Number(curr.bobot || 1),
      0
    )

    for (const st of visibleStudents) {
      let earned = 0
      let tuntas = 0
      for (const act of coreMutabaahActs) {
        const rec = mutabaahRecords.find(
          (r) => r.student_id === st.id && r.activity_id === act.id
        )
        const b = Number(act.bobot || 1)
        if (rec) {
          if (act.tipe === 'boolean') {
            if (rec.status === 'done') {
              earned += b
              tuntas++
            }
          } else {
            const jml = Number(rec.jumlah || 0)
            const target = Number(act.target_harian || 1)
            const capaian = Math.min(jml / target, 1)
            earned += capaian * b
            if (jml >= target) tuntas++
          }
        }
      }

      const scorePct =
        totalBobot > 0 ? Math.round((earned / totalBobot) * 100) : 0
      const bonusPuasa = mutabaahActs.some(
        (a) =>
          a.target_harian === null &&
          mutabaahRecords.find(
            (r) =>
              r.student_id === st.id &&
              r.activity_id === a.id &&
              r.status === 'done'
          )
      )

      map[st.id] = {
        scorePct,
        tuntas,
        total: coreMutabaahActs.length,
        bonusPuasa,
      }
    }
    return map
  }, [visibleStudents, coreMutabaahActs, mutabaahActs, mutabaahRecords])

  // Overall KPIs
  const overallAttendancePct = useMemo(() => {
    const totalPossible = visibleStudents.length * sessions.length
    if (totalPossible === 0) return 0
    const hadirCount = attendanceLogs.filter(
      (l) =>
        visibleStudents.some((s) => s.id === l.student_id) &&
        l.status === 'hadir'
    ).length
    return Math.round((hadirCount / totalPossible) * 100)
  }, [visibleStudents, sessions, attendanceLogs])

  const overallTotalAyat = useMemo(() => {
    return submissions
      .filter(
        (s) =>
          visibleStudents.some((st) => st.id === s.student_id) &&
          (s.satuan === 'ayat' || s.jenis === 'ziyadah' || s.jenis === 'murajaah')
      )
      .reduce((acc, curr) => acc + (Number(curr.capaian) || 0), 0)
  }, [submissions, visibleStudents])

  const overallMutabaahPct = useMemo(() => {
    const scores = visibleStudents.map((s) => studentScores[s.id]?.scorePct || 0)
    if (scores.length === 0) return 0
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }, [visibleStudents, studentScores])

  const handleDateChange = (newDate: string) => {
    setSearchParams((prev) => {
      prev.set('tanggal', newDate)
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
      return tanggalParam
    }
  }, [tanggalParam])

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
            {/* Date Navigator */}
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleDateChange(addDaysToDate(tanggalParam, -1))}
                className="h-7 w-7 text-neutral-600"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-semibold text-neutral-800">
                {formatDateRiyadh(tanggalParam)}
              </span>
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleDateChange(addDaysToDate(tanggalParam, 1))}
                className="h-7 w-7 text-neutral-600"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Student Filter (Only for admin/atasan) */}
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
                  const fileName = namaFileLaporanHarian(santriNama, tanggalParam)
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
            Memuat data laporan...
          </div>
        ) : !hasAnyData ? (
          /* EMPTY STATE */
          <div className="py-24 text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-neutral-300 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-neutral-800">
              Belum ada data tercatat untuk periode ini.
            </h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Tidak ada presensi, setoran hafalan, mutabaah, ataupun kegiatan yang diisi untuk tanggal{' '}
              {formatDateRiyadh(tanggalParam)}.
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
            {/* C1. KOP LAPORAN */}
            <div className="border-b border-neutral-900 pb-3 flex items-start justify-between gap-4">
              <div>
                <img
                  src={logoIDN}
                  alt="IDN Boarding School"
                  className="h-10 sm:h-12 w-auto object-contain print:h-[14mm] print:w-auto print:opacity-100"
                />
                <h1 className="text-xl font-bold tracking-tight text-neutral-900 mt-2">
                  Laporan Harian Santri
                </h1>
                <p className="text-xs font-semibold text-neutral-700 mt-0.5">
                  {formatDateRiyadh(tanggalParam)}
                  {!isHariAktif(tanggalParam) && (
                    <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">
                      (Hari Libur)
                    </span>
                  )}
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

            {/* C2. RINGKASAN HARI (4 Angka dalam 1 Baris) */}
            <div className="grid grid-cols-4 gap-2 border border-neutral-200 rounded-lg p-3 text-center print-avoid-break">
              <div>
                <div className="text-lg font-bold text-neutral-900">
                  {!isHariAktif(tanggalParam) && attendanceLogs.length === 0 ? '—' : `${overallAttendancePct}%`}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Kehadiran Sesi
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {overallTotalAyat}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Ayat Disetor
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {overallMutabaahPct}%
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Rata-rata Mutabaah
                </div>
              </div>
              <div className="border-l border-neutral-200">
                <div className="text-lg font-bold text-neutral-900">
                  {activities.length}
                </div>
                <div className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                  Kegiatan Dicatat
                </div>
              </div>
            </div>

            {/* C3. TABEL PRESENSI (Matriks Santri x 4 Sesi) */}
            <div className="space-y-1.5 print-avoid-break">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  I. Presensi Harian (4 Sesi)
                </h3>
                {!isHariAktif(tanggalParam) && (
                  <span className="text-[10px] text-neutral-500 italic">
                    Jadwal Libur Akhir Pekan
                  </span>
                )}
              </div>

              {!isHariAktif(tanggalParam) && attendanceLogs.length === 0 ? (
                <div className="p-3 text-center border border-neutral-200 rounded-md bg-neutral-50/50 text-xs text-neutral-500 italic">
                  Tidak ada sesi KBM — hari libur (Jumat / Sabtu)
                </div>
              ) : (
                <>
                  <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                    <th className="py-2 px-2.5 border-r border-neutral-300">Nama Santri</th>
                    {sessions.map((ses) => (
                      <th
                        key={ses.id}
                        className="py-2 px-2 text-center border-r border-neutral-300 min-w-[80px]"
                      >
                        {ses.nama}
                      </th>
                    ))}
                    <th className="py-2 px-2 text-center w-24">Rekap Sesi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 text-neutral-900">
                  {visibleStudents.map((st) => {
                    const stLogs = sessions.map((ses) =>
                      attendanceLogs.find(
                        (l) => l.student_id === st.id && l.session_id === ses.id
                      )
                    )
                    const hadirCount = stLogs.filter(
                      (l) => l?.status === 'hadir'
                    ).length
                    const notes = stLogs
                      .filter((l) => Boolean(l?.catatan))
                      .map((l) => {
                        const sesName = sessions.find(
                          (s) => s.id === l?.session_id
                        )?.nama
                        return `${sesName}: ${l?.catatan}`
                      })

                    return (
                      <React.Fragment key={st.id}>
                        <tr>
                          <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold">
                            <div>{st.nama}</div>
                            <div className="text-[10px] text-neutral-500">
                              Kelas {st.kelas}
                            </div>
                          </td>
                          {sessions.map((ses) => {
                            const log = attendanceLogs.find(
                              (l) =>
                                l.student_id === st.id && l.session_id === ses.id
                            )
                            const status = log?.status || 'hadir'
                            const label =
                              status === 'hadir'
                                ? 'H'
                                : status === 'izin'
                                ? 'I'
                                : status === 'sakit'
                                ? 'S'
                                : 'A'

                            const bg =
                              status === 'hadir'
                                ? 'bg-emerald-50 text-emerald-950 font-bold'
                                : status === 'izin'
                                ? 'bg-amber-50 text-amber-950 font-bold'
                                : status === 'sakit'
                                ? 'bg-sky-50 text-sky-950 font-bold'
                                : 'bg-rose-50 text-rose-950 font-bold'

                            return (
                              <td
                                key={ses.id}
                                className={`py-2 px-2 text-center border-r border-neutral-200 text-xs ${bg}`}
                              >
                                {label}
                              </td>
                            )
                          })}
                          <td className="py-2 px-2 text-center font-bold text-neutral-800">
                            {hadirCount}/{sessions.length} Sesi
                          </td>
                        </tr>
                        {notes.length > 0 && (
                          <tr className="bg-neutral-50/50">
                            <td
                              colSpan={sessions.length + 2}
                              className="py-1 px-3 text-[10px] text-neutral-600 italic border-t border-neutral-200"
                            >
                              Catatan: {notes.join(' • ')}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
              <div className="text-[10px] text-neutral-500 flex gap-4 pt-0.5">
                <span><b>H</b> = Hadir</span>
                <span><b>I</b> = Izin</span>
                <span><b>S</b> = Sakit</span>
                <span><b>A</b> = Alpa</span>
              </div>
              </>
              )}
            </div>

            {/* C4. SETORAN AL-QUR'AN & PEMBELAJARAN */}
            <div className="space-y-1.5 print-avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                II. Setoran Al-Qur'an, Hafalan & Kuis
              </h3>
              <table className="w-full text-left text-xs border border-neutral-300 border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                    <th className="py-2 px-2.5 border-r border-neutral-300">Nama Santri</th>
                    <th className="py-2 px-2 border-r border-neutral-300">Mata Pelajaran</th>
                    <th className="py-2 px-2 border-r border-neutral-300">Materi / Bab / Ayat</th>
                    <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Capaian</th>
                    <th className="py-2 px-2 text-center border-r border-neutral-300 w-24">Status</th>
                    <th className="py-2 px-2 text-center border-r border-neutral-300 w-16">Nilai</th>
                    <th className="py-2 px-2.5">Catatan Ustadz</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {visibleStudents.map((st) => {
                    const stSubs = submissions.filter(
                      (s) => s.student_id === st.id
                    )

                    if (stSubs.length === 0) {
                      return (
                        <tr key={st.id} className="text-neutral-500">
                          <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold text-neutral-800">
                            {st.nama}
                          </td>
                          <td
                            colSpan={6}
                            className="py-2 px-2.5 italic text-neutral-400 text-center"
                          >
                            Tidak ada setoran atau kuis tercatat hari ini
                          </td>
                        </tr>
                      )
                    }

                    return stSubs.map((sub, idx) => {
                      const qDetail = sub.quran_details?.[0]
                      const quizDetail = sub.quiz_details?.[0]
                      const isKuis = sub.subject?.mode_input === 'kuis' || Boolean(quizDetail)

                      let materiText = `${sub.capaian} ${sub.satuan}`
                      let capaianText = `${sub.capaian} ${sub.satuan}`
                      let statusText = sub.status.replace('_', ' ')

                      if (qDetail) {
                        const sAwal =
                          ALL_SURAHS.find((s) => s.nomor === qDetail.surah_awal)?.nama_latin || ''
                        const sAkhir =
                          ALL_SURAHS.find((s) => s.nomor === qDetail.surah_akhir)?.nama_latin || ''
                        materiText = `${sAwal} (${qDetail.ayat_awal}) s/d ${sAkhir} (${qDetail.ayat_akhir})`
                        capaianText = `${sub.capaian} ayat`
                        statusText =
                          sub.status === 'lancar'
                            ? 'Lancar'
                            : sub.status === 'kurang_lancar'
                            ? 'Kurang Lancar'
                            : 'Mengulang'
                      } else if (isKuis && quizDetail) {
                        const b = quizDetail.kitab_bab
                        materiText = b
                          ? `${b.kitab} ${b.jilid ? 'jilid ' + b.jilid + ' ' : ''}— Bab ${b.nomor_bab}: ${b.judul_bab}`
                          : quizDetail.kitab_manual || 'Kuis Harian'
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
                        <tr key={`${st.id}-${sub.id || idx}`}>
                          <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold text-neutral-900">
                            {idx === 0 ? st.nama : ''}
                          </td>
                          <td className="py-2 px-2 border-r border-neutral-200 capitalize font-medium">
                            {sub.subject?.nama || sub.jenis}
                          </td>
                          <td className="py-2 px-2 border-r border-neutral-200 font-normal">
                            {materiText}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold">
                            {capaianText}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 capitalize font-semibold">
                            {statusText}
                          </td>
                          <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold">
                            {sub.nilai !== null && sub.nilai !== undefined
                              ? sub.nilai
                              : '—'}
                          </td>
                          <td className="py-2 px-2.5 text-[11px] text-neutral-600">
                            {sub.catatan || '—'}
                          </td>
                        </tr>
                      )
                    })
                  })}
                </tbody>
              </table>
            </div>

            {/* C5. MUTABAAH YAUMIYAH (Amalan sebagai Baris, Santri sebagai Kolom) */}
            <div className="space-y-1.5 print-avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                III. Mutabaah Yaumiyah
              </h3>
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                  <colgroup>
                    <col style={{ width: '40%' }} />
                    {visibleStudents.map((st) => (
                      <col
                        key={st.id}
                        style={{
                          width: `${60 / Math.max(1, visibleStudents.length)}%`,
                        }}
                      />
                    ))}
                  </colgroup>
                  <thead>
                    <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                      <th className="py-2 px-3 border-r border-neutral-300">
                        Amalan Yaumiyah
                      </th>
                      {visibleStudents.map((st) => {
                        const shortName = st.nama.split(' ').slice(0, 2).join(' ')
                        return (
                          <th
                            key={st.id}
                            className="py-2 px-2 text-center border-r border-neutral-300 font-bold"
                          >
                            <div>{shortName}</div>
                            <div className="text-[9px] font-normal text-neutral-500">
                              Kelas {st.kelas}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {/* 1. Core Activities Rows */}
                    {coreMutabaahActs.map((act) => (
                      <tr key={act.id} className="text-neutral-800">
                        <td className="py-1.5 px-3 border-r border-neutral-200 font-medium">
                          <span>{act.nama}</span>
                          {act.tipe === 'angka' && (
                            <span className="text-[10px] text-neutral-400 ml-1.5">
                              (Target: {act.target_harian} {act.satuan || 'waktu'})
                            </span>
                          )}
                        </td>
                        {visibleStudents.map((st) => {
                          const rec = mutabaahRecords.find(
                            (r) => r.student_id === st.id && r.activity_id === act.id
                          )

                          if (!rec) {
                            return (
                              <td
                                key={st.id}
                                className="py-1.5 px-2 text-center border-r border-neutral-200 text-neutral-300 font-mono"
                              >
                                —
                              </td>
                            )
                          }

                          if (act.tipe === 'boolean') {
                            const isDone = rec.status === 'done'
                            return (
                              <td
                                key={st.id}
                                className="py-1.5 px-2 text-center border-r border-neutral-200"
                              >
                                {isDone ? (
                                  <span className="font-bold text-emerald-700 text-sm">✓</span>
                                ) : (
                                  <span className="text-neutral-400 font-bold text-xs">○</span>
                                )}
                              </td>
                            )
                          }

                          const val = Number(rec.jumlah || 0)
                          const target = Number(act.target_harian || 1)
                          const isTargetReached = val >= target

                          return (
                            <td
                              key={st.id}
                              className={`py-1.5 px-2 text-center border-r border-neutral-200 text-xs ${
                                isTargetReached
                                  ? 'font-bold text-neutral-900'
                                  : 'font-medium text-neutral-700'
                              }`}
                            >
                              {val}/{target}
                            </td>
                          )
                        })}
                      </tr>
                    ))}

                    {/* 2. Skor Mutabaah Row */}
                    <tr className="bg-neutral-100/90 border-t-2 border-b-2 border-neutral-300 font-bold text-neutral-900">
                      <td className="py-2 px-3 border-r border-neutral-300 font-bold text-xs">
                        Skor Mutabaah
                      </td>
                      {visibleStudents.map((st) => (
                        <td
                          key={st.id}
                          className="py-2 px-2 text-center border-r border-neutral-300 font-bold text-sm text-neutral-900"
                        >
                          {studentScores[st.id]?.scorePct}%
                        </td>
                      ))}
                    </tr>

                    {/* 3. Bonus Activities Rows (e.g. Puasa Sunnah) */}
                    {mutabaahActs
                      .filter((a) => a.aktif && a.target_harian === null)
                      .map((act) => (
                        <tr key={act.id} className="text-neutral-800 bg-purple-50/20">
                          <td className="py-1.5 px-3 border-r border-neutral-200 font-medium">
                            <span>{act.nama}</span>
                            <span className="text-[10px] text-purple-700 italic ml-1.5 font-semibold">
                              (bonus)
                            </span>
                          </td>
                          {visibleStudents.map((st) => {
                            const rec = mutabaahRecords.find(
                              (r) => r.student_id === st.id && r.activity_id === act.id
                            )

                            if (!rec) {
                              return (
                                <td
                                  key={st.id}
                                  className="py-1.5 px-2 text-center border-r border-neutral-200 text-neutral-300 font-mono"
                                >
                                  —
                                </td>
                              )
                            }

                            const isDone = rec.status === 'done'
                            return (
                              <td
                                key={st.id}
                                className="py-1.5 px-2 text-center border-r border-neutral-200"
                              >
                                {isDone ? (
                                  <span className="font-bold text-emerald-700 text-sm">✓</span>
                                ) : (
                                  <span className="text-neutral-400 font-bold text-xs">○</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="text-[10px] text-neutral-500 flex flex-wrap gap-4 pt-1">
                <span>
                  <b className="text-emerald-700">✓</b> = Tuntas / Dikerjakan
                </span>
                <span>
                  <b className="text-neutral-400">○</b> = Tidak Dikerjakan
                </span>
                <span>
                  <b>X/Y</b> = Capaian Angka (Tebal = Memenuhi Target)
                </span>
                <span>
                  <b className="text-neutral-300 font-mono">—</b> = Belum Ada Catatan
                </span>
              </div>
            </div>

            {/* C6. KEGIATAN & AGENDA */}
            <div className="space-y-1.5 print-avoid-break">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
                IV. Agenda & Dokumentasi Kegiatan
              </h3>
              {activities.length === 0 ? (
                <div className="p-3 rounded border border-neutral-200 text-xs italic text-neutral-400 text-center">
                  Tidak ada agenda kegiatan tercatat hari ini
                </div>
              ) : (
                <div className="border border-neutral-300 rounded divide-y divide-neutral-200">
                  {activities.map((act) => (
                    <div key={act.id} className="p-2.5 text-xs space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-neutral-900 text-sm">
                          {act.judul || act.activity_type?.nama}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          {act.jumlah_hadir}/{act.jumlah_total || 4} Santri Hadir • Pembimbing: {act.penanggung_jawab || '—'}
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

            {/* C7. KAKI LAPORAN */}
            <div className="pt-4 border-t border-neutral-300 flex items-center justify-between text-[10px] text-neutral-500 italic print-avoid-break">
              <span>Arsip Harian Internal • IDN Boarding School Mekkah & Madinah</span>
              <span>Dicetak pada {nowPrintTime} waktu Saudi</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
