import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  Printer,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Edit,
  AlertCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import {
  todayRiyadh,
  pekanMulai,
  formatPekanDisplay,
  addDaysToDate,
  formatDateShortRiyadh,
  isHariAktif,
} from '@/lib/dateUtils'
import {
  cetakDenganNama,
  namaFileSlideAtasan,
  nomorPekanBulan,
} from '@/lib/printUtils'
import logoIDN from '@/assets/logo-idn-mekkah-madinah.png'
import {
  fetchWeeklyReport,
  fetchReportProgressItems,
  fetchReportStudentIssues,
  fetchTeacherJournalActivities,
  fetchTeacherJournalRecords,
  fetchWeeklyActivities,
  fetchReportSocialMedia,
  fetchKasTransaksi,
} from '@/lib/supabase'
import type {
  WeeklyReport,
  ReportProgressItem,
  ReportStudentIssue,
  TeacherJournalActivity,
  TeacherJournalRecord,
  Activity,
  ReportSocialMedia,
  VKasTransaksi,
} from '@/types/database'

export const WeeklyProgressSlidesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { profile } = useAuth()

  // Guard: Admin and Atasan only (is_staff)
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

  // Report Data
  const [report, setReport] = useState<WeeklyReport | null>(null)
  const [progressItems, setProgressItems] = useState<ReportProgressItem[]>([])
  const [studentIssues, setStudentIssues] = useState<ReportStudentIssue[]>([])
  const [journalActs, setJournalActs] = useState<TeacherJournalActivity[]>([])
  const [journalRecords, setJournalRecords] = useState<TeacherJournalRecord[]>([])
  const [harianActs, setHarianActs] = useState<Activity[]>([])
  const [pekananActs, setPekananActs] = useState<Activity[]>([])
  const [sosmedItems, setSosmedItems] = useState<ReportSocialMedia[]>([])
  const [kasList, setKasList] = useState<VKasTransaksi[]>([])

  const loadData = useCallback(async (pMulai: string) => {
    setLoading(true)
    try {
      const [rep, acts, allActs, kas] = await Promise.all([
        fetchWeeklyReport(pMulai),
        fetchTeacherJournalActivities(),
        fetchWeeklyActivities(pMulai),
        fetchKasTransaksi(),
      ])

      setReport(rep)
      setJournalActs(acts)
      setKasList(kas)

      // Split harian vs pekanan activities (Harian only on active days Ahad-Kamis)
      const harian = allActs.filter((a) => a.activity_type?.jenis === 'harian' && isHariAktif(a.tanggal))
      const pekanan = allActs.filter((a) => a.activity_type?.jenis === 'pekanan')
      setHarianActs(harian)
      setPekananActs(pekanan)

      if (rep && rep.id) {
        const [pItems, sIssues, jRecs, sMedia] = await Promise.all([
          fetchReportProgressItems(rep.id),
          fetchReportStudentIssues(rep.id),
          fetchTeacherJournalRecords(rep.id),
          fetchReportSocialMedia(rep.id),
        ])
        setProgressItems(pItems)
        setStudentIssues(sIssues)
        setJournalRecords(jRecs)
        setSosmedItems(sMedia)
      } else {
        setProgressItems([])
        setStudentIssues([])
        setJournalRecords([])
        setSosmedItems([])
      }
    } catch (e) {
      console.warn('Error loading weekly progress slides data:', e)
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

  const formatRupiah = (val: number) => {
    const isNeg = val < 0
    const absVal = Math.abs(val)
    const formatted = new Intl.NumberFormat('id-ID', {
      maximumFractionDigits: 0,
    }).format(absVal)
    return isNeg ? `-Rp${formatted}` : `Rp${formatted}`
  }

  const nowPrintTime = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Riyadh',
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date())
    } catch {
      return currentPekan
    }
  }, [currentPekan])

  // Kas partitioned
  const kasSantri = useMemo(() => kasList.filter((k) => k.kelompok === 'santri'), [kasList])
  const kasKoord = useMemo(() => kasList.filter((k) => k.kelompok === 'koordinator'), [kasList])

  const totalSaldoSantri = useMemo(
    () => (kasSantri.length > 0 ? kasSantri[kasSantri.length - 1].sisa_saldo : 0),
    [kasSantri]
  )
  const totalSaldoKoord = useMemo(
    () => (kasKoord.length > 0 ? kasKoord[kasKoord.length - 1].sisa_saldo : 0),
    [kasKoord]
  )

  // Chunk helpers for pagination (max 7-8 rows per slide)
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const res: T[][] = []
    for (let i = 0; i < arr.length; i += size) {
      res.push(arr.slice(i, i + size))
    }
    return res.length > 0 ? res : [[]]
  }

  const progressChunks = useMemo(() => chunkArray(progressItems, 6), [progressItems])
  const issuesChunks = useMemo(() => chunkArray(studentIssues, 4), [studentIssues])
  const harianChunks = useMemo(() => chunkArray(harianActs, 6), [harianActs])
  const pekananChunks = useMemo(() => chunkArray(pekananActs, 6), [pekananActs])
  const sosmedChunks = useMemo(() => chunkArray(sosmedItems, 6), [sosmedItems])
  const kasSantriChunks = useMemo(() => chunkArray(kasSantri, 6), [kasSantri])
  const kasKoordChunks = useMemo(() => chunkArray(kasKoord, 6), [kasKoord])

  const hasAnyReport = Boolean(report)

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-900 font-sans pb-16 print:pb-0 print:bg-white">
      {/* 1. SCREEN CONTROLS BAR (print:hidden) */}
      <div className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 px-4 py-3 shadow-xl print:hidden">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/')}
              className="text-xs font-semibold gap-1.5 border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-neutral-200">
                Weekly Progress Report
              </span>
              {report && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    report.status === 'final'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {report.status}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Week Navigator */}
            <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleWeekChange(addDaysToDate(currentPekan, -7))}
                className="h-7 w-7 text-neutral-400 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="px-2 font-semibold text-neutral-300">
                {nomorPekanBulan(currentPekan).labelPekan}
              </span>
              <Button
                variant="ghost"
                size="xsIcon"
                onClick={() => handleWeekChange(addDaysToDate(currentPekan, 7))}
                className="h-7 w-7 text-neutral-400 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Edit Button for Admin */}
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/weekly-report?pekan=${currentPekan}`)}
                className="border-neutral-700 bg-neutral-900 text-neutral-200 hover:bg-neutral-800 text-xs font-semibold gap-1.5"
              >
                <Edit className="h-3.5 w-3.5" />
                <span>Edit Laporan</span>
              </Button>
            )}

            {/* Print Button */}
            {hasAnyReport && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  const fileName = namaFileSlideAtasan(currentPekan)
                  cetakDenganNama(fileName)
                }}
                className="bg-white text-neutral-900 hover:bg-neutral-200 font-bold text-xs gap-1.5 shadow-2xs"
              >
                <Printer className="h-4 w-4" />
                <span>Cetak / Simpan PDF</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. SLIDES CONTAINER */}
      <div className="max-w-[338mm] mx-auto py-6 sm:py-10 px-4 sm:px-8 space-y-10 print:p-0 print:m-0 print:space-y-0 print:max-w-none">
        {loading ? (
          <div className="py-32 text-center text-neutral-400 text-xs">
            Memuat slide presentasi...
          </div>
        ) : !report ? (
          /* EMPTY STATE */
          <div className="bg-neutral-950 p-12 rounded-3xl border border-neutral-800 text-center space-y-4 max-w-xl mx-auto text-white">
            <AlertCircle className="h-10 w-10 text-neutral-500 mx-auto stroke-1" />
            <h3 className="text-base font-bold text-neutral-200">
              Laporan Pekan Ini Belum Dibuat
            </h3>
            <p className="text-xs text-neutral-400">
              Belum ada data weekly progress report yang dibuat untuk periode{' '}
              {formatPekanDisplay(currentPekan)}.
            </p>
            {isAdmin ? (
              <Button
                onClick={() => navigate(`/weekly-report?pekan=${currentPekan}`)}
                className="bg-white text-neutral-900 hover:bg-neutral-200 text-xs font-bold gap-1.5 mt-2"
              >
                <FileText className="h-4 w-4" />
                <span>Buat Laporan Sekarang</span>
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
        ) : (
          <>
            {/* SLIDE 1: JUDUL / COVER */}
            <section className="slide aspect-video bg-white rounded-2xl p-10 sm:p-14 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none">
              <div>
                <img
                  src={logoIDN}
                  alt="IDN Boarding School"
                  className="h-12 sm:h-14 w-auto object-contain print:h-[16mm] print:w-auto print:opacity-100"
                />
              </div>

              <div className="space-y-4 my-auto py-8">
                <div className="inline-block px-3 py-1 rounded-md bg-neutral-100 text-neutral-800 text-xs font-bold tracking-wider uppercase">
                  Internal Management Report
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 leading-tight">
                  WEEKLY PROGRESS REPORT
                </h1>
                <div className="flex items-center gap-3 text-sm font-semibold text-neutral-600">
                  <span>Periode: {formatPekanDisplay(currentPekan)}</span>
                  <span>•</span>
                  <span>Waktu Saudi (Asia/Riyadh, UTC+3)</span>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                <div>
                  <span className="font-semibold text-neutral-800">Musyrif / PIC:</span>{' '}
                  <span>Abdurrahman Asyam A, S.Kom.</span>
                </div>
                <div className="italic">Dicetak pada {nowPrintTime}</div>
              </div>
            </section>

            {/* SLIDE 2: KEMAJUAN PEKANAN */}
            {progressChunks.map((chunk, cIdx) => (
              <section
                key={`progress-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  {/* Slide Header */}
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 02 {progressChunks.length > 1 ? `(Bagian ${cIdx + 1}/${progressChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Laporan Kemajuan Pekanan {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatPekanDisplay(currentPekan)}
                    </span>
                  </div>

                  {/* Content Table */}
                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '20%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-2 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Kegiatan / Program</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Hasil Kegiatan</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Status</th>
                        <th className="py-2 px-2.5">RPTL (Tindak Lanjut)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                            Belum ada item kemajuan tercatat pada pekan ini.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((item, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          const statusBg =
                            item.status === 'selesai'
                              ? 'bg-emerald-50 text-emerald-950 font-bold border-emerald-200'
                              : item.status === 'proses'
                              ? 'bg-amber-50 text-amber-950 font-bold border-amber-200'
                              : item.status === 'tertunda'
                              ? 'bg-rose-50 text-rose-950 font-bold border-rose-200'
                              : 'bg-neutral-100 text-neutral-800 font-bold border-neutral-200'

                          return (
                            <tr key={item.id || idx}>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-bold text-neutral-900">
                                {item.kegiatan}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 text-neutral-600">
                                {item.tanggal ? formatDateShortRiyadh(item.tanggal) : '—'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 text-neutral-700 leading-relaxed">
                                {item.hasil || '—'}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${statusBg}`}
                                >
                                  {item.status}
                                </span>
                              </td>
                              <td className="py-2 px-2.5 text-neutral-700 leading-relaxed">
                                {item.rptl || '—'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Program Mekkah & Madinah</span>
                  <span>Halaman Slide 02</span>
                </div>
              </section>
            ))}

            {/* SLIDE 3: SISWA BERMASALAH */}
            {issuesChunks.map((chunk, cIdx) => (
              <section
                key={`issues-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 03 {issuesChunks.length > 1 ? `(Bagian ${cIdx + 1}/${issuesChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Laporan Siswa Bermasalah & Evaluasi Khusus {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatPekanDisplay(currentPekan)}
                    </span>
                  </div>

                  {studentIssues.length === 0 ? (
                    <div className="py-16 text-center border border-neutral-200 rounded-xl bg-neutral-50/50 space-y-2">
                      <div className="text-emerald-700 font-bold text-sm">
                        Alhamdulillah, Tidak Ada Kasus Tercatat Pekan Ini
                      </div>
                      <p className="text-xs text-neutral-500 max-w-md mx-auto">
                        Seluruh santri dan tim pengajar berkegiatan dengan tertib, aman, dan lancar tanpa kendala kedisiplinan maupun kesehatan berat.
                      </p>
                    </div>
                  ) : (
                    <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                      <colgroup>
                        <col style={{ width: '5%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '25%' }} />
                      </colgroup>
                      <thead>
                        <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                          <th className="py-2 px-2 text-center border-r border-neutral-300">No</th>
                          <th className="py-2 px-2 text-center border-r border-neutral-300">Tanggal</th>
                          <th className="py-2 px-2.5 border-r border-neutral-300">Nama Siswa / Guru</th>
                          <th className="py-2 px-2 border-r border-neutral-300">Konteks</th>
                          <th className="py-2 px-2.5 border-r border-neutral-300">Masalah</th>
                          <th className="py-2 px-2.5">Penanganan & Hasil</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {chunk.map((iss, idx) => {
                          const globalIdx = cIdx * 4 + idx + 1
                          const studentName = iss.student?.nama || iss.nama_lain || '—'

                          return (
                            <tr key={iss.id || idx}>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 text-neutral-600">
                                {iss.tanggal ? formatDateShortRiyadh(iss.tanggal) : '—'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-bold text-neutral-900">
                                <div>{studentName}</div>
                                {iss.student && (
                                  <div className="text-[10px] font-normal text-neutral-500">
                                    Kelas {iss.student.kelas}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 border-r border-neutral-200 text-neutral-700">
                                {iss.konteks || '—'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 text-neutral-800 leading-relaxed font-medium">
                                {iss.masalah}
                              </td>
                              <td className="py-2 px-2.5 text-neutral-700 leading-relaxed">
                                <div>
                                  <b>Tindakan:</b> {iss.penanganan || '—'}
                                </div>
                                {iss.hasil && (
                                  <div className="mt-1 text-emerald-800 font-semibold">
                                    <b>Hasil:</b> {iss.hasil}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Internal Evaluation</span>
                  <span>Halaman Slide 03</span>
                </div>
              </section>
            ))}

            {/* SLIDE 4: JURNAL GURU (15 KEGIATAN) */}
            <section className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none">
              <div>
                <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                      Slide 04
                    </span>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Jurnal Guru & Pembimbing
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">
                    {formatPekanDisplay(currentPekan)}
                  </span>
                </div>

                {/* Grid 2 Kolom untuk 15 Kegiatan agar muat sempurna di 1 slide */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs border border-neutral-300 rounded-lg p-2.5 bg-neutral-50/40">
                  {journalActs.map((act, idx) => {
                    const rec = journalRecords.find((r) => r.activity_id === act.id)
                    const status = rec?.status || 'completed'
                    const statusLabel =
                      status === 'completed'
                        ? 'Completed ✓'
                        : status === 'partial'
                        ? 'Partial'
                        : 'Not Done'
                    const statusColor =
                      status === 'completed'
                        ? 'text-emerald-700 font-bold bg-emerald-50'
                        : status === 'partial'
                        ? 'text-amber-700 font-bold bg-amber-50'
                        : 'text-rose-700 font-bold bg-rose-50'

                    return (
                      <div
                        key={act.id}
                        className="flex items-center justify-between py-1 px-2 border-b border-neutral-200/70"
                      >
                        <div className="truncate pr-2">
                          <span className="font-mono text-[10px] text-neutral-400 mr-1.5">
                            {idx + 1}.
                          </span>
                          <span className="font-semibold text-neutral-800 text-[11px]">
                            {act.nama}
                          </span>
                          {rec?.catatan && (
                            <span className="text-[10px] text-neutral-500 italic ml-1.5 truncate">
                              ({rec.catatan})
                            </span>
                          )}
                        </div>
                        <span
                          className={`shrink-0 px-2 py-0.5 rounded text-[10px] border border-neutral-200 ${statusColor}`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                <span>IDN Boarding School • Program Mekkah & Madinah</span>
                <span>Halaman Slide 04</span>
              </div>
            </section>

            {/* SLIDE 5: KBM & KEASRAMAAN HARIAN (OTOMATIS) */}
            {harianChunks.map((chunk, cIdx) => (
              <section
                key={`harian-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 05 {harianChunks.length > 1 ? `(Bagian ${cIdx + 1}/${harianChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        KBM & Keasramaan Harian (Ahad – Kamis) {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatPekanDisplay(currentPekan)} (5 Hari Aktif)
                    </span>
                  </div>

                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '33%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '18%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-2 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Jenis Kegiatan</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Judul / Agenda</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Kehadiran</th>
                        <th className="py-2 px-2.5">Dokumentasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                            Tidak ada catatan kegiatan harian pada pekan ini.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((act, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          return (
                            <tr key={act.id || idx}>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 text-neutral-600">
                                {formatDateShortRiyadh(act.tanggal)}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold text-neutral-800">
                                {act.activity_type?.nama || 'Harian'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 text-neutral-900 leading-relaxed font-medium">
                                <div>{act.judul || '—'}</div>
                                {act.keterangan && (
                                  <div className="text-[10px] text-neutral-500 font-normal truncate">
                                    {act.keterangan}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold text-neutral-900">
                                {act.jumlah_hadir}/{act.jumlah_total || 4} Santri
                              </td>
                              <td className="py-2 px-2.5 text-[10px] text-neutral-600 font-mono break-all">
                                {act.link_google_photo ? (
                                  <a
                                    href={act.link_google_photo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-neutral-800 underline hover:text-neutral-950"
                                  >
                                    Google Photos Album
                                  </a>
                                ) : (
                                  'Tercatat di Musyrif'
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Program Mekkah & Madinah</span>
                  <span>Halaman Slide 05</span>
                </div>
              </section>
            ))}

            {/* SLIDE 6: KBM & KEASRAMAAN MINGGUAN (OTOMATIS) */}
            {pekananChunks.map((chunk, cIdx) => (
              <section
                key={`pekanan-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 06 {pekananChunks.length > 1 ? `(Bagian ${cIdx + 1}/${pekananChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        KBM & Keasramaan Mingguan {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatPekanDisplay(currentPekan)}
                    </span>
                  </div>

                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '20%' }} />
                      <col style={{ width: '33%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '18%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-2 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Jenis Kegiatan</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Judul / Agenda</th>
                        <th className="py-2 px-2 text-center border-r border-neutral-300">Kehadiran</th>
                        <th className="py-2 px-2.5">Dokumentasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-neutral-400 italic">
                            Tidak ada catatan agenda mingguan pada pekan ini.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((act, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          return (
                            <tr key={act.id || idx}>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 text-neutral-600">
                                {formatDateShortRiyadh(act.tanggal)}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-semibold text-neutral-800">
                                {act.activity_type?.nama || 'Pekanan'}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 text-neutral-900 leading-relaxed font-medium">
                                <div>{act.judul || '—'}</div>
                                {act.keterangan && (
                                  <div className="text-[10px] text-neutral-500 font-normal truncate">
                                    {act.keterangan}
                                  </div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-center border-r border-neutral-200 font-bold text-neutral-900">
                                {act.jumlah_hadir}/{act.jumlah_total || 4} Santri
                              </td>
                              <td className="py-2 px-2.5 text-[10px] text-neutral-600 font-mono break-all">
                                {act.link_google_photo ? (
                                  <a
                                    href={act.link_google_photo}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-neutral-800 underline hover:text-neutral-950"
                                  >
                                    Google Photos Album
                                  </a>
                                ) : (
                                  'Tercatat di Musyrif'
                                )}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Program Mekkah & Madinah</span>
                  <span>Halaman Slide 06</span>
                </div>
              </section>
            ))}

            {/* SLIDE 7: POSTINGAN SOSIAL MEDIA */}
            {sosmedChunks.map((chunk, cIdx) => (
              <section
                key={`sosmed-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 07 {sosmedChunks.length > 1 ? `(Bagian ${cIdx + 1}/${sosmedChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Laporan Publikasi & Postingan Sosmed {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-neutral-500">
                      {formatPekanDisplay(currentPekan)}
                    </span>
                  </div>

                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '5%' }} />
                      <col style={{ width: '35%' }} />
                      <col style={{ width: '25%' }} />
                      <col style={{ width: '35%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-2 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Kegiatan / Judul Konten</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Progress Publikasi</th>
                        <th className="py-2 px-2.5">Keterangan / Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-neutral-400 italic">
                            Tidak ada catatan publikasi sosmed pada pekan ini.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((item, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          return (
                            <tr key={item.id || idx}>
                              <td className="py-2.5 px-2 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2.5 px-2.5 border-r border-neutral-200 font-bold text-neutral-900">
                                {item.kegiatan}
                              </td>
                              <td className="py-2.5 px-2.5 border-r border-neutral-200 font-medium text-emerald-800">
                                {item.progress || 'Sudah tayang'}
                              </td>
                              <td className="py-2.5 px-2.5 text-neutral-700 leading-relaxed font-mono text-[11px] break-all">
                                {item.keterangan || '—'}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Program Mekkah & Madinah</span>
                  <span>Halaman Slide 07</span>
                </div>
              </section>
            ))}

            {/* SLIDE 8A: KEUANGAN SANTRI (BUKU KAS UMUM) */}
            {kasSantriChunks.map((chunk, cIdx) => (
              <section
                key={`kas-santri-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 08A {kasSantriChunks.length > 1 ? `(Bagian ${cIdx + 1}/${kasSantriChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Laporan Keuangan — Kelompok Santri {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-neutral-500 block">
                        Saldo Akhir: <b className="text-neutral-900">{formatRupiah(totalSaldoSantri)}</b>
                      </span>
                    </div>
                  </div>

                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-1 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2 border-r border-neutral-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Kebutuhan / Uraian</th>
                        <th className="py-2 px-1.5 text-center border-r border-neutral-300">Volume</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300">Harga</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300 text-emerald-800">Kredit (Masuk)</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300 text-rose-800">Debit (Keluar)</th>
                        <th className="py-2 px-2.5 text-right">Sisa Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-neutral-400 italic">
                            Belum ada transaksi kas santri.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((item, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          return (
                            <tr key={item.id || idx}>
                              <td className="py-2 px-1 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2 border-r border-neutral-200 text-neutral-600 whitespace-nowrap">
                                {item.tanggal}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-bold text-neutral-900 truncate">
                                {item.kebutuhan}
                              </td>
                              <td className="py-2 px-1.5 text-center border-r border-neutral-200 text-neutral-700">
                                {item.volume} {item.satuan}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-neutral-800">
                                {formatRupiah(item.harga)}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-emerald-800 font-semibold">
                                {item.kredit > 0 ? formatRupiah(item.kredit) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-rose-800 font-semibold">
                                {item.debit > 0 ? formatRupiah(item.debit) : '—'}
                              </td>
                              <td
                                className={`py-2 px-2.5 text-right font-mono font-bold ${
                                  item.sisa_saldo < 0 ? 'text-rose-600' : 'text-neutral-900'
                                }`}
                              >
                                {formatRupiah(item.sisa_saldo)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Buku Kas Santri</span>
                  <span>Halaman Slide 08A</span>
                </div>
              </section>
            ))}

            {/* SLIDE 8B: KEUANGAN KOORDINATOR (BUKU KAS UMUM) */}
            {kasKoordChunks.map((chunk, cIdx) => (
              <section
                key={`kas-koord-${cIdx}`}
                className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none"
              >
                <div>
                  <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                        Slide 08B {kasKoordChunks.length > 1 ? `(Bagian ${cIdx + 1}/${kasKoordChunks.length})` : ''}
                      </span>
                      <h2 className="text-xl font-bold text-neutral-900">
                        Laporan Keuangan — Kelompok Koordinator {cIdx > 0 ? '(Lanjutan)' : ''}
                      </h2>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-semibold text-neutral-500 block">
                        Saldo Akhir:{' '}
                        <b
                          className={
                            totalSaldoKoord < 0 ? 'text-rose-600 font-bold' : 'text-neutral-900 font-bold'
                          }
                        >
                          {formatRupiah(totalSaldoKoord)}
                        </b>
                      </span>
                    </div>
                  </div>

                  <table className="w-full table-fixed text-left text-xs border border-neutral-300 border-collapse">
                    <colgroup>
                      <col style={{ width: '4%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '26%' }} />
                      <col style={{ width: '10%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '14%' }} />
                    </colgroup>
                    <thead>
                      <tr className="bg-neutral-100 border-b border-neutral-300 font-bold text-neutral-800 text-[11px]">
                        <th className="py-2 px-1 text-center border-r border-neutral-300">No</th>
                        <th className="py-2 px-2 border-r border-neutral-300">Tanggal</th>
                        <th className="py-2 px-2.5 border-r border-neutral-300">Kebutuhan / Uraian</th>
                        <th className="py-2 px-1.5 text-center border-r border-neutral-300">Volume</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300">Harga</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300 text-emerald-800">Kredit (Masuk)</th>
                        <th className="py-2 px-2 text-right border-r border-neutral-300 text-rose-800">Debit (Keluar)</th>
                        <th className="py-2 px-2.5 text-right">Sisa Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {chunk.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-neutral-400 italic">
                            Belum ada transaksi kas koordinator.
                          </td>
                        </tr>
                      ) : (
                        chunk.map((item, idx) => {
                          const globalIdx = cIdx * 6 + idx + 1
                          return (
                            <tr key={item.id || idx}>
                              <td className="py-2 px-1 text-center border-r border-neutral-200 font-mono text-neutral-500">
                                {globalIdx}
                              </td>
                              <td className="py-2 px-2 border-r border-neutral-200 text-neutral-600 whitespace-nowrap">
                                {item.tanggal}
                              </td>
                              <td className="py-2 px-2.5 border-r border-neutral-200 font-bold text-neutral-900 truncate">
                                {item.kebutuhan}
                              </td>
                              <td className="py-2 px-1.5 text-center border-r border-neutral-200 text-neutral-700">
                                {item.volume} {item.satuan}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-neutral-800">
                                {formatRupiah(item.harga)}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-emerald-800 font-semibold">
                                {item.kredit > 0 ? formatRupiah(item.kredit) : '—'}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-neutral-200 font-mono text-rose-800 font-semibold">
                                {item.debit > 0 ? formatRupiah(item.debit) : '—'}
                              </td>
                              <td
                                className={`py-2 px-2.5 text-right font-mono font-bold ${
                                  item.sisa_saldo < 0 ? 'text-rose-600' : 'text-neutral-900'
                                }`}
                              >
                                {formatRupiah(item.sisa_saldo)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-3 border-t border-neutral-200 flex justify-between text-[10px] text-neutral-400">
                  <span>IDN Boarding School • Buku Kas Koordinator</span>
                  <span>Halaman Slide 08B</span>
                </div>
              </section>
            ))}

            {/* SLIDE 9: PENUTUP & TANDA TANGAN */}
            <section className="slide aspect-video bg-white rounded-2xl p-8 sm:p-12 shadow-2xl flex flex-col justify-between border border-neutral-200 print:rounded-none print:shadow-none print:border-none">
              <div>
                <div className="flex items-baseline justify-between border-b border-neutral-900 pb-2.5 mb-4">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-neutral-400">
                      Slide 09
                    </span>
                    <h2 className="text-xl font-bold text-neutral-900">
                      Evaluasi & Penutup Laporan
                    </h2>
                  </div>
                  <span className="text-xs font-semibold text-neutral-500">
                    {formatPekanDisplay(currentPekan)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-xs">
                  {/* Kendala */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5 flex flex-col">
                    <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500" />
                      Kendala Pekan Ini
                    </span>
                    <p className="text-neutral-700 leading-relaxed flex-1">
                      {report.kendala || 'Tidak ada kendala berarti yang dihadapi selama pekan ini.'}
                    </p>
                  </div>

                  {/* Rencana Pekan Depan */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5 flex flex-col">
                    <span className="font-bold text-sky-900 text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-sky-500" />
                      Rencana Pekan Depan
                    </span>
                    <p className="text-neutral-700 leading-relaxed flex-1">
                      {report.rencana_pekan_depan || 'Melanjutkan target kurikulum, tahfidz mutun, dan setoran quran.'}
                    </p>
                  </div>

                  {/* Catatan Umum */}
                  <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/60 space-y-1.5 flex flex-col">
                    <span className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Catatan Umum
                    </span>
                    <p className="text-neutral-700 leading-relaxed flex-1">
                      {report.catatan_umum || 'Program berjalan kondusif sesuai jadwal kurikulum IDN.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Tanda Tangan Musyrif */}
              <div className="pt-4 border-t border-neutral-200 flex items-end justify-between text-xs">
                <div className="text-[10px] text-neutral-400 italic">
                  Dicetak pada {nowPrintTime} waktu Saudi
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
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default WeeklyProgressSlidesPage
