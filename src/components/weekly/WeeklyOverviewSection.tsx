import React, { useMemo } from 'react'
import {
  UserCheck,
  BookOpen,
  Sparkles,
  Activity as ActivityIcon,
  BarChart3,
  Award,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import type {
  Student,
  WeeklyAttendance,
  WeeklyQuran,
  WeeklyMutabaah,
  Activity,
  AttendanceLog,
  Submission,
} from '@/types/database'
import { getDaysInWeek, formatPekanDisplay } from '@/lib/dateUtils'
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

interface WeeklyOverviewSectionProps {
  pekanMulaiStr: string
  students: Student[]
  weeklyAttendance: WeeklyAttendance[]
  weeklyQuran: WeeklyQuran[]
  weeklyMutabaah: WeeklyMutabaah[]
  weeklyActivities: Activity[]
  rawAttendanceLogs?: AttendanceLog[]
  rawSubmissions?: Submission[]
}

export const WeeklyOverviewSection: React.FC<WeeklyOverviewSectionProps> = ({
  pekanMulaiStr,
  students,
  weeklyAttendance,
  weeklyQuran,
  weeklyMutabaah,
  weeklyActivities,
  rawAttendanceLogs = [],
  rawSubmissions = [],
}) => {
  const daysInWeek = useMemo(() => getDaysInWeek(pekanMulaiStr), [pekanMulaiStr])

  // 1. Calculate KPI totals
  const totalPresensiPercent = useMemo(() => {
    if (weeklyAttendance.length === 0) return 0
    const sum = weeklyAttendance.reduce((acc, curr) => acc + Number(curr.persen_kehadiran || 0), 0)
    return Math.round(sum / weeklyAttendance.length)
  }, [weeklyAttendance])

  const totalQuranAyat = useMemo(() => {
    return weeklyQuran.reduce((acc, curr) => acc + Number(curr.total_quran_ayat || 0), 0)
  }, [weeklyQuran])

  const avgMutabaahScore = useMemo(() => {
    if (weeklyMutabaah.length === 0) return 0
    const sum = weeklyMutabaah.reduce((acc, curr) => acc + Number(curr.rata_skor_mutabaah || 0), 0)
    return Math.round(sum / weeklyMutabaah.length)
  }, [weeklyMutabaah])

  const totalActivitiesCount = weeklyActivities.length

  // 2. Prepare 7-day chart data (Ahad -> Sabtu)
  const chartData = useMemo(() => {
    return daysInWeek.map((day) => {
      const dayLogs = rawAttendanceLogs.filter((l) => l.tanggal === day.date && l.status === 'hadir')
      const kehadiranPersen = Math.round((dayLogs.length / 16) * 100)

      const daySubs = rawSubmissions.filter((s) => s.tanggal === day.date)
      const ziyadahAyat = daySubs
        .filter((s) => s.jenis === 'ziyadah')
        .reduce((acc, curr) => acc + Number(curr.capaian || 0), 0)
      const murajaahAyat = daySubs
        .filter((s) => s.jenis === 'murajaah')
        .reduce((acc, curr) => acc + Number(curr.capaian || 0), 0)

      return {
        name: day.dayName,
        shortDate: day.shortDate,
        fullDate: day.date,
        kehadiran: kehadiranPersen,
        hadirSesi: dayLogs.length,
        ziyadah: ziyadahAyat,
        murajaah: murajaahAyat,
        totalAyat: ziyadahAyat + murajaahAyat,
      }
    })
  }, [daysInWeek, rawAttendanceLogs, rawSubmissions])

  return (
    <div className="space-y-6">
      {/* 4 Top Weekly KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Kehadiran */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Rata-rata Kehadiran</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <UserCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {totalPresensiPercent}%
              </span>
              <Badge variant="success" className="text-[10px] py-0 px-1.5 font-bold">
                Pekanan
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Target 100% (4 Sesi / Hari)
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Setoran Qur'an */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Total Hafalan Qur'an</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {totalQuranAyat}
              </span>
              <span className="text-xs font-medium text-neutral-500">Ayat</span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Ziyadah & Murajaah 4 Santri
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Mutabaah */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Rata-rata Mutabaah</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {avgMutabaahScore}%
              </span>
              <Badge variant={avgMutabaahScore >= 80 ? 'success' : 'warning'} className="text-[10px] py-0 px-1.5 font-bold">
                {avgMutabaahScore >= 80 ? 'Tinggi' : 'Cukup'}
              </Badge>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Evaluasi amalan terbobot
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Kegiatan */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-500">Kegiatan Terlaksana</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                <ActivityIcon className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-neutral-900">
                {totalActivitiesCount}
              </span>
              <span className="text-xs font-medium text-neutral-500">Agenda</span>
            </div>
            <p className="mt-1 text-[11px] text-neutral-400">
              Halaqah & Kegiatan Khusus
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 7-Day Chart Section (Ahad -> Sabtu) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Setoran Hafalan */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardHeader className="border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-neutral-700" />
              <CardTitle className="text-sm font-bold">Tren Setoran Ayat Harian (Ahad — Sabtu)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Distribusi pencapaian Ziyadah vs Murajaah per hari
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(value: any, name: any) => [`${value} Ayat`, name === 'ziyadah' ? 'Ziyadah' : 'Murajaah']}
                    labelFormatter={(label) => `Hari ${label}`}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="ziyadah" name="Ziyadah" fill="#171717" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="murajaah" name="Murajaah" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Chart 2: Kehadiran Sesi */}
        <Card className="border-neutral-200 bg-white shadow-2xs">
          <CardHeader className="border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-700" />
              <CardTitle className="text-sm font-bold">Tingkat Kehadiran Harian (%)</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Persentase 4 santri hadir di seluruh sesi (Persiapan, Mufrodat, KBM, Halaqah)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#737373' }} axisLine={{ stroke: '#e5e5e5' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e5e5', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                    formatter={(value: any) => [`${value}%`, 'Kehadiran']}
                    labelFormatter={(label) => `Hari ${label}`}
                  />
                  <Bar dataKey="kehadiran" name="Kehadiran (%)" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ringkasan Tabel Per Santri */}
      <Card className="border-neutral-200 bg-white shadow-2xs">
        <CardHeader className="border-b border-neutral-100 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-neutral-800" />
              <CardTitle className="text-sm font-bold">Rekapitulasi Santri Pekan Ini</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Periode: {formatPekanDisplay(pekanMulaiStr)} (Waktu Saudi)
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[11px] font-semibold self-start sm:self-auto bg-neutral-50 text-neutral-600">
            Mode Pantau (Read-Only)
          </Badge>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-neutral-600 font-semibold">
                <th className="py-3 px-4">Nama Santri</th>
                <th className="py-3 px-3 text-center">Kelas</th>
                <th className="py-3 px-3 text-center">% Kehadiran</th>
                <th className="py-3 px-3 text-center">Ziyadah</th>
                <th className="py-3 px-3 text-center">Murajaah</th>
                <th className="py-3 px-3 text-center">Total Ayat</th>
                <th className="py-3 px-3 text-center">Rata-rata Mutabaah</th>
                <th className="py-3 px-4 text-center">Puasa Sunnah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {students.map((student) => {
                const att = weeklyAttendance.find((a) => a.student_id === student.id)
                const quran = weeklyQuran.find((q) => q.student_id === student.id)
                const mut = weeklyMutabaah.find((m) => m.student_id === student.id)

                const hadirPct = att ? Math.round(Number(att.persen_kehadiran || 0)) : 0
                const ziyadahAyat = quran ? Number(quran.total_ziyadah_ayat || 0) : 0
                const murajaahAyat = quran ? Number(quran.total_murajaah_ayat || 0) : 0
                const totalAyat = quran ? Number(quran.total_quran_ayat || 0) : 0
                const mutScore = mut ? Math.round(Number(mut.rata_skor_mutabaah || 0)) : 0
                const bonusPuasa = mut ? Number(mut.jumlah_bonus || 0) : 0

                return (
                  <tr key={student.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-neutral-900">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-700 text-[10px] border border-neutral-200">
                          {student.nama
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')}
                        </div>
                        <span>{student.nama}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center text-neutral-600">
                      Kelas {student.kelas}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge
                        variant={hadirPct >= 90 ? 'success' : hadirPct >= 75 ? 'warning' : 'danger'}
                        className="font-bold text-[10px]"
                      >
                        {hadirPct}%
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-neutral-800">
                      {ziyadahAyat} ayat
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-neutral-600">
                      {murajaahAyat} ayat
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-neutral-900">
                      {totalAyat} ayat
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className="font-bold text-neutral-900">{mutScore}%</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {bonusPuasa > 0 ? (
                        <Badge variant="purple" className="text-[10px] font-bold">
                          Puasa: {bonusPuasa}×
                        </Badge>
                      ) : (
                        <span className="text-neutral-400 font-mono">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
