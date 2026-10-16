import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  BookOpen,
  Sparkles,
  UserCheck,
  TrendingUp,
  BarChart2,
  RefreshCw,
} from 'lucide-react'
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
import type { ExecutiveHighlight } from '@/types/weeklyReportTemplate'
import type { Student, WeeklyQuran } from '@/types/database'

interface SectionExecutiveSummaryProps {
  attendanceAvg: number | null
  totalAyat: number
  totalZiyadah: number
  totalMurajaah: number
  mutabaahAvg: number | null
  activeStudentsCount: number
  students: Student[]
  quranList: WeeklyQuran[]
  highlights: ExecutiveHighlight[]
  onHighlightsChange: (highlights: ExecutiveHighlight[]) => void
  onAutoSuggestHighlights: () => void
  readOnly?: boolean
}

export const SectionExecutiveSummary: React.FC<SectionExecutiveSummaryProps> = ({
  attendanceAvg,
  totalAyat,
  totalZiyadah,
  totalMurajaah,
  mutabaahAvg,
  activeStudentsCount,
  students,
  quranList,
  highlights,
  onHighlightsChange,
  onAutoSuggestHighlights,
  readOnly = false,
}) => {
  // Prepare chart data per student
  const chartData = React.useMemo(() => {
    return students
      .filter((s) => s.status === 'aktif')
      .map((student) => {
        const qRecord = quranList.find((q) => q.student_id === student.id)
        const ziyadah = qRecord?.total_ziyadah_ayat || 0
        const murajaah = qRecord?.total_murajaah_ayat || 0
        return {
          nama: student.nama.split(' ')[0] || student.nama,
          namaLengkap: student.nama,
          ziyadah,
          murajaah,
          total: ziyadah + murajaah,
        }
      })
      .sort((a, b) => b.total - a.total)
  }, [students, quranList])

  const handleHighlightChange = (index: number, field: keyof ExecutiveHighlight, value: string) => {
    if (readOnly) return
    const updated = [...highlights]
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      onHighlightsChange(updated)
    }
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-neutral-800" />
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Bagian 2 — Executive Summary
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Ringkasan metrik operasional otomatis dari database dan 3 poin sorotan pekanan.
              </CardDescription>
            </div>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onAutoSuggestHighlights}
              className="text-xs font-semibold gap-1.5 h-8 border-neutral-300 hover:bg-neutral-50"
            >
              <RefreshCw className="h-3 w-3 text-neutral-600" />
              Perbarui Saran Highlight
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 space-y-5 sm:space-y-6">
        {/* 1. KPI Cards (Automated from Operational DB) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {/* Kehadiran */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Rata-rata Kehadiran</span>
              <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {attendanceAvg !== null ? `${attendanceAvg}%` : '—'}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              {attendanceAvg !== null ? 'Sesi KBM Ahad–Kamis' : 'Belum ada data cukup'}
            </p>
          </div>

          {/* Total Ayat */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Total Ayat Setoran</span>
              <BookOpen className="h-4 w-4 text-blue-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {totalAyat} <span className="text-xs font-medium text-neutral-500">ayat</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-1 font-mono truncate">
              {totalZiyadah} ziyadah · {totalMurajaah} muraja'ah
            </p>
          </div>

          {/* Mutabaah */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Rata-rata Mutabaah</span>
              <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {mutabaahAvg !== null ? `${mutabaahAvg}%` : '—'}
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              {mutabaahAvg !== null ? 'Kepatuhan amalan yaumiyyah' : 'Belum ada data cukup'}
            </p>
          </div>

          {/* Santri Aktif */}
          <div className="p-3 sm:p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80">
            <div className="flex items-center justify-between text-neutral-500 mb-1">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">Santri Aktif</span>
              <Users className="h-4 w-4 text-purple-600 shrink-0" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-neutral-900">
              {activeStudentsCount} <span className="text-xs font-medium text-neutral-500">santri</span>
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Status santri aktif terdaftar</p>
          </div>
        </div>

        {/* 2. Horizontal Stacked Bar Chart (Recharts) */}
        <div className="p-3 sm:p-4 rounded-xl border border-neutral-200/80 bg-neutral-50/40">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-1">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-neutral-700 shrink-0" />
              <h3 className="text-xs font-bold text-neutral-800">
                Grafik Capaian Ayat per Santri (Ziyadah &amp; Muraja'ah)
              </h3>
            </div>
            <span className="text-[10px] text-neutral-400">Pekan Terpilih</span>
          </div>

          {chartData.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              Belum ada data setoran santri pada pekan ini.
            </div>
          ) : (
            <div className="h-72 sm:h-80 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E5E5" />
                  <XAxis type="number" textAnchor="end" tick={{ fontSize: 10 }} />
                  <YAxis
                    dataKey="nama"
                    type="category"
                    tick={{ fontSize: 10, fontWeight: 600 }}
                    width={65}
                  />
                  <Tooltip
                    formatter={(value: any, name: any) => [
                      `${value} ayat`,
                      name === 'ziyadah' ? 'Ziyadah' : 'Muraja\'ah',
                    ]}
                    labelFormatter={(label) => {
                      const item = chartData.find((d) => d.nama === label)
                      return item?.namaLengkap || label
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                    formatter={(val) => (val === 'ziyadah' ? 'Ziyadah (Baru)' : 'Muraja\'ah')}
                  />
                  <Bar dataKey="ziyadah" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="murajaah" stackId="a" fill="#0284C7" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* 3. Three Highlights Form */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Tiga Highlight Utama Pekan Ini
            </h3>
            <span className="text-[11px] text-neutral-400">
              Dapat diedit oleh koordinator
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {highlights.slice(0, 3).map((hl, idx) => (
              <div
                key={hl.id || idx}
                className="p-3.5 rounded-xl border border-neutral-200 bg-white space-y-2 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-bold bg-neutral-50">
                    Poin 0{idx + 1}
                  </Badge>
                  {hl.sumber_metrik && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {hl.sumber_metrik}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-0.5">
                    Judul Highlight
                  </label>
                  <Input
                    type="text"
                    value={hl.judul}
                    onChange={(e) => handleHighlightChange(idx, 'judul', e.target.value)}
                    disabled={readOnly}
                    className="text-xs font-bold h-8"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-neutral-600 block mb-0.5">
                    Ringkasan Poin
                  </label>
                  <Textarea
                    value={hl.ringkasan}
                    onChange={(e) => handleHighlightChange(idx, 'ringkasan', e.target.value)}
                    disabled={readOnly}
                    rows={3}
                    className="text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
