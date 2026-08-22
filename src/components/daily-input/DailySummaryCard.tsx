import React from 'react'
import {
  UserCheck,
  BookOpen,
  Sparkles,
  Activity as ActivityIcon,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import type {
  Student,
  AttendanceLog,
  AttendanceSession,
  Submission,
  MutabaahRecord,
  MutabaahActivity,
  Activity,
} from '@/types/database'

interface DailySummaryCardProps {
  students: Student[]
  attendanceLogs: AttendanceLog[]
  attendanceSessions: AttendanceSession[]
  submissions: Submission[]
  mutabaahRecords: MutabaahRecord[]
  mutabaahActivities: MutabaahActivity[]
  activities: Activity[]
}

export const DailySummaryCard: React.FC<DailySummaryCardProps> = ({
  students,
  attendanceLogs,
  attendanceSessions,
  submissions,
  mutabaahRecords,
  mutabaahActivities,
  activities,
}) => {
  // 1. Attendance Summary
  const totalSessionsPossible = Math.max(1, students.length * attendanceSessions.length)
  const hadirLogs = attendanceLogs.filter((l) => l.status === 'hadir')
  const attendanceRate = Math.round((hadirLogs.length / totalSessionsPossible) * 100)

  // 2. Quran Submission Summary & Students who haven't submitted yet
  const totalAyat = submissions.reduce((acc, curr) => acc + (Number(curr.capaian) || 0), 0)
  const uniqueStudentsSubmitted = new Set(submissions.map((s) => s.student_id))
  const notSubmittedStudents = students.filter((s) => !uniqueStudentsSubmitted.has(s.id))

  // 3. Mutabaah Score (excluding bonus with target_harian === null, capping each at 100%)
  const coreActivities = mutabaahActivities.filter((a) => a.aktif && a.target_harian !== null && a.target_harian !== undefined)
  const totalBobot = coreActivities.reduce((acc, curr) => acc + Number(curr.bobot || 1), 0) * Math.max(1, students.length)

  let achievedWeight = 0
  for (const student of students) {
    for (const act of coreActivities) {
      const rec = mutabaahRecords.find((r) => r.student_id === student.id && r.activity_id === act.id)
      const b = Number(act.bobot || 1)
      if (rec) {
        if (act.tipe === 'boolean') {
          if (rec.status === 'done') achievedWeight += b
        } else {
          const jml = Number(rec.jumlah || 0)
          const target = Number(act.target_harian || 1)
          const capaian = Math.min(jml / target, 1) // capped 100%
          achievedWeight += capaian * b
        }
      }
    }
  }

  const mutabaahPercent = totalBobot > 0 ? Math.round((achievedWeight / totalBobot) * 100) : 0
  const bonusCount = mutabaahRecords.filter((r) => {
    const act = mutabaahActivities.find((a) => a.id === r.activity_id)
    return act?.target_harian === null && r.status === 'done'
  }).length

  // 4. Activities Count
  const totalActivities = activities.length

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {/* 1. Presensi */}
      <Card className="border-neutral-200 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Kehadiran 4 Sesi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              {attendanceRate}%
            </span>
            <span className="text-xs text-neutral-500 font-medium">
              ({hadirLogs.length}/{totalSessionsPossible} Sesi)
            </span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {attendanceRate === 100 ? 'Semua santri hadir lengkap' : `${totalSessionsPossible - hadirLogs.length} sesi belum hadir`}
          </p>
        </CardContent>
      </Card>

      {/* 2. Setoran Qur'an */}
      <Card className="border-neutral-200 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Setoran Al-Qur'an</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              {totalAyat}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Ayat Hari Ini</span>
          </div>
          <div className="mt-1 text-[11px]">
            {notSubmittedStudents.length === 0 ? (
              <span className="text-emerald-700 font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> 4/4 Santri sudah menyetor
              </span>
            ) : (
              <span className="text-amber-800 font-medium line-clamp-1" title={notSubmittedStudents.map((s) => s.nama).join(', ')}>
                Belum: {notSubmittedStudents.map((s) => s.nama.split(' ')[0]).join(', ')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Mutabaah Yaumiyah */}
      <Card className="border-neutral-200 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Mutabaah Yaumiyah</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              {mutabaahPercent}%
            </span>
            {bonusCount > 0 && (
              <Badge variant="purple" className="text-[10px] py-0 px-1 font-bold">
                +{bonusCount} Puasa
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            Rata-rata 4 santri hari ini
          </p>
        </CardContent>
      </Card>

      {/* 4. Kegiatan & Agenda */}
      <Card className="border-neutral-200 bg-white shadow-2xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-500">Agenda & Kegiatan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
              <ActivityIcon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-neutral-900">
              {totalActivities}
            </span>
            <span className="text-xs text-neutral-500 font-medium">Kegiatan</span>
          </div>
          <p className="mt-1 text-[11px] text-neutral-400">
            {totalActivities > 0 ? 'Terdokumentasi hari ini' : 'Belum ada agenda dicatat'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
