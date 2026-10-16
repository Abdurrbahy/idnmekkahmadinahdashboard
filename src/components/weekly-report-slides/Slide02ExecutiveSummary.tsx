import React from 'react'
import { SlideFrame } from './SlideFrame'
import { SLIDE_THEME } from './slideTheme'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { Student, WeeklyQuran } from '@/types/database'
import type { ExecutiveHighlight } from '@/types/weeklyReportTemplate'

interface Slide02ExecutiveSummaryProps {
  currentPekan: string
  periodeFormatted: string
  attendanceAvg: number | null
  totalAyat: number
  totalZiyadah: number
  totalMurajaah: number
  mutabaahAvg: number | null
  activeStudentsCount: number
  students: Student[]
  quranList: WeeklyQuran[]
  highlights: ExecutiveHighlight[]
}

export const Slide02ExecutiveSummary: React.FC<Slide02ExecutiveSummaryProps> = ({
  currentPekan,
  periodeFormatted,
  attendanceAvg,
  totalAyat,
  totalZiyadah,
  totalMurajaah,
  mutabaahAvg,
  activeStudentsCount,
  students,
  quranList,
  highlights,
}) => {
  // Chart data per student (sorted by total descending)
  const chartData = React.useMemo(() => {
    return students
      .filter((s) => s.status === 'aktif')
      .map((student) => {
        const q = quranList.find((item) => item.student_id === student.id)
        const z = q?.total_ziyadah_ayat || 0
        const m = q?.total_murajaah_ayat || 0
        return {
          nama: student.nama.split(' ')[0] || student.nama,
          namaLengkap: student.nama,
          ziyadah: z,
          murajaah: m,
          total: z + m,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [students, quranList])

  return (
    <SlideFrame
      slideNumber={2}
      sectionCategory="EXECUTIVE SUMMARY"
      title="Ringkasan Kinerja & Indikator Utama Pekanan"
      subtitle={`Evaluasi pencapaian 4 pilar metrik operasional dan sorotan strategis ${currentPekan}.`}
      periodeFormatted={periodeFormatted}
    >
      <div className="flex-1 flex flex-col justify-between gap-3 min-h-0">
        {/* 1. Four KPI Metric Cards */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {/* Card 1: Kehadiran */}
          <div
            className="p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
              Rata-rata Kehadiran
            </span>
            <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: SLIDE_THEME.primaryNavy }}>
              {attendanceAvg !== null ? `${attendanceAvg}%` : 'Data belum tersedia'}
            </div>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">
              Sesi KBM Ahad–Kamis
            </span>
          </div>

          {/* Card 2: Total Ayat */}
          <div
            className="p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
              Total Ayat Setoran
            </span>
            <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: SLIDE_THEME.primaryNavy }}>
              {totalAyat > 0 ? (
                <>
                  {totalAyat.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-semibold text-neutral-500">ayat</span>
                </>
              ) : (
                'Data belum tersedia'
              )}
            </div>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5 truncate font-mono">
              {totalZiyadah} ziyadah · {totalMurajaah} muraja'ah
            </span>
          </div>

          {/* Card 3: Mutabaah */}
          <div
            className="p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
              Rata-rata Mutabaah
            </span>
            <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: SLIDE_THEME.primaryNavy }}>
              {mutabaahAvg !== null ? `${mutabaahAvg}%` : 'Data belum tersedia'}
            </div>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">
              Amalan yaumiyyah santri
            </span>
          </div>

          {/* Card 4: Santri Aktif */}
          <div
            className="p-2.5 sm:p-3 rounded-lg border flex flex-col justify-between"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: SLIDE_THEME.textSecondary }}>
              Jumlah Santri Aktif
            </span>
            <div className="text-xl sm:text-2xl font-black mt-1" style={{ color: SLIDE_THEME.primaryNavy }}>
              {activeStudentsCount > 0 ? `${activeStudentsCount} Santri` : 'Data belum tersedia'}
            </div>
            <span className="text-[9px] sm:text-[10px] text-neutral-400 mt-0.5">
              100% Mengikuti program
            </span>
          </div>
        </div>

        {/* 2. Middle Row: Chart (Left) + Highlights (Right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 min-h-0">
          {/* Left: Recharts Horizontal Stacked Bar (7 cols) */}
          <div
            className="md:col-span-7 rounded-lg border p-2.5 sm:p-3 flex flex-col justify-between min-h-0"
            style={{
              backgroundColor: SLIDE_THEME.white,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div className="flex items-center justify-between pb-1.5 border-b mb-1" style={{ borderColor: SLIDE_THEME.borderGrey }}>
              <span className="text-[11px] font-bold" style={{ color: SLIDE_THEME.primaryNavy }}>
                Distribusi Capaian Ayat per Santri (Ziyadah &amp; Muraja'ah)
              </span>
              <span className="text-[10px] text-neutral-400 font-mono">Satuan: Ayat</span>
            </div>

            {chartData.length === 0 ? (
              <div className="my-auto py-8 text-center text-xs text-neutral-400 italic">
                Data capaian ayat pekan ini belum tersedia.
              </div>
            ) : (
              <div className="flex-1 w-full min-h-[160px] max-h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 2, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ECEFF2" />
                    <XAxis type="number" tick={{ fontSize: 9 }} stroke="#98A1AC" />
                    <YAxis
                      dataKey="nama"
                      type="category"
                      tick={{ fontSize: 9.5, fontWeight: 600, fill: '#171A1F' }}
                      width={60}
                      stroke="#98A1AC"
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        `${val} ayat`,
                        name === 'ziyadah' ? 'Ziyadah' : 'Muraja\'ah',
                      ]}
                      labelFormatter={(label) => {
                        const item = chartData.find((d) => d.nama === label)
                        return item?.namaLengkap || label
                      }}
                      contentStyle={{ fontSize: '11px', borderRadius: '6px', border: '1px solid #D9DEE5' }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 9.5, paddingTop: 4 }}
                      formatter={(val) => (val === 'ziyadah' ? 'Ziyadah (Baru)' : 'Muraja\'ah')}
                    />
                    <Bar
                      dataKey="ziyadah"
                      stackId="a"
                      fill={SLIDE_THEME.primaryNavy}
                      isAnimationActive={false}
                    />
                    <Bar
                      dataKey="murajaah"
                      stackId="a"
                      fill={SLIDE_THEME.secondaryBlue}
                      radius={[0, 3, 3, 0]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Right: 3 Highlights Card (5 cols) */}
          <div
            className="md:col-span-5 rounded-lg border p-2.5 sm:p-3 flex flex-col justify-between min-h-0"
            style={{
              backgroundColor: SLIDE_THEME.lightGrey,
              borderColor: SLIDE_THEME.borderGrey,
            }}
          >
            <div className="pb-1.5 border-b mb-2" style={{ borderColor: SLIDE_THEME.borderGrey }}>
              <span className="text-[11px] font-bold" style={{ color: SLIDE_THEME.primaryNavy }}>
                Highlight &amp; Evaluasi Utama Pekan Ini
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto">
              {highlights.length === 0 ? (
                <div className="my-auto text-center text-xs text-neutral-400 italic py-4">
                  Belum ada catatan highlight pekanan.
                </div>
              ) : (
                highlights.slice(0, 3).map((hl, idx) => (
                  <div
                    key={hl.id || idx}
                    className="p-2 sm:p-2.5 rounded border bg-white flex flex-col justify-between shadow-2xs"
                    style={{ borderColor: SLIDE_THEME.borderGrey }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded"
                        style={{
                          backgroundColor: SLIDE_THEME.lightBlue,
                          color: SLIDE_THEME.primaryNavy,
                        }}
                      >
                        Poin 0{idx + 1}
                      </span>
                      {hl.sumber_metrik && (
                        <span className="text-[9px] text-neutral-400 font-mono truncate">
                          {hl.sumber_metrik}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold mt-1 text-neutral-900 truncate">
                      {hl.judul || 'Tanpa Judul'}
                    </div>
                    <p className="text-[10px] text-neutral-600 line-clamp-2 mt-0.5 leading-snug">
                      {hl.ringkasan || 'Tidak ada uraian.'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}
