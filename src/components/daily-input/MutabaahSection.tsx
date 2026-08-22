import React, { useState, useEffect } from 'react'
import { Sparkles, Check, Save, Wand2, Minus, Plus, Lock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { Student, MutabaahActivity, MutabaahRecord } from '@/types/database'
import { saveMutabaahRecords } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'

interface MutabaahSectionProps {
  selectedDate: string
  students: Student[]
  activities: MutabaahActivity[]
  initialRecords: MutabaahRecord[]
  onRecordsUpdated: () => void
  onUnsavedChangeState?: (hasUnsaved: boolean) => void
}

export const MutabaahSection: React.FC<MutabaahSectionProps> = ({
  selectedDate,
  students,
  activities,
  initialRecords,
  onRecordsUpdated,
  onUnsavedChangeState,
}) => {
  const { canEdit, profile } = useAuth()
  const [recordMap, setRecordMap] = useState<
    Record<number, Record<number, { status: 'done' | 'not_done'; jumlah?: number; catatan?: string }>>
  >({})
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeMobileStudentId, setActiveMobileStudentId] = useState<number>(students[0]?.id || 1)

  useEffect(() => {
    const map: Record<number, Record<number, { status: 'done' | 'not_done'; jumlah?: number; catatan?: string }>> = {}
    for (const student of students) {
      map[student.id] = {}
      for (const act of activities) {
        const found = initialRecords.find((r) => r.student_id === student.id && r.activity_id === act.id)
        if (found) {
          let jml = found.jumlah !== null ? Number(found.jumlah) : (act.tipe === 'angka' ? act.target_harian || 0 : undefined)
          if (act.kode === 'shalat_5_waktu' && jml !== undefined && jml > 5) {
            jml = 5
          }
          map[student.id][act.id] = {
            status: found.status,
            jumlah: jml,
            catatan: found.catatan || undefined,
          }
        } else {
          map[student.id][act.id] = {
            status: 'not_done',
            jumlah: act.tipe === 'angka' ? 0 : undefined,
          }
        }
      }
    }
    setRecordMap(map)
    setHasUnsavedChanges(false)
    if (onUnsavedChangeState) onUnsavedChangeState(false)
    setErrorMessage(null)
  }, [students, activities, initialRecords, selectedDate, onUnsavedChangeState])

  const toggleBoolean = (studentId: number, actId: number) => {
    if (!canEdit) return
    setRecordMap((prev) => {
      const currentStatus = prev[studentId]?.[actId]?.status || 'not_done'
      const newStatus = currentStatus === 'done' ? 'not_done' : 'done'
      return {
        ...prev,
        [studentId]: {
          ...prev[studentId],
          [actId]: {
            ...prev[studentId]?.[actId],
            status: newStatus,
          },
        },
      }
    })
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const setNumericAmount = (studentId: number, actId: number, amount: number, actKode?: string) => {
    if (!canEdit) return
    let validAmount = Math.max(0, amount)
    if (actKode === 'shalat_5_waktu') {
      validAmount = Math.min(5, validAmount)
    }

    setRecordMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [actId]: {
          ...prev[studentId]?.[actId],
          status: validAmount > 0 ? 'done' : 'not_done',
          jumlah: validAmount,
        },
      },
    }))
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const fillStandardRoutine = () => {
    if (!canEdit) return
    const updated: Record<number, Record<number, { status: 'done' | 'not_done'; jumlah?: number; catatan?: string }>> = {}
    for (const student of students) {
      updated[student.id] = {}
      for (const act of activities) {
        if (act.tipe === 'boolean') {
          const isStandard = ['tahajjud', 'qabliyah_subuh', 'dzikir_pagi', 'dhuha', 'dzikir_petang'].includes(act.kode)
          updated[student.id][act.id] = {
            status: isStandard ? 'done' : 'not_done',
          }
        } else {
          updated[student.id][act.id] = {
            status: 'done',
            jumlah: act.kode === 'shalat_5_waktu' ? 5 : (act.target_harian || 1),
          }
        }
      }
    }
    setRecordMap(updated)
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    setErrorMessage(null)
    const recordsToSave: MutabaahRecord[] = []
    for (const student of students) {
      for (const act of activities) {
        const entry = recordMap[student.id]?.[act.id]
        if (entry) {
          let finalJml = act.tipe === 'angka' ? entry.jumlah || 0 : null
          if (act.kode === 'shalat_5_waktu' && finalJml !== null && finalJml > 5) {
            finalJml = 5
          }
          recordsToSave.push({
            student_id: student.id,
            activity_id: act.id,
            tanggal: selectedDate,
            status: entry.status,
            jumlah: finalJml,
            catatan: entry.catatan || null,
          })
        }
      }
    }

    try {
      const res = await saveMutabaahRecords(recordsToSave)
      if (res.success) {
        setHasUnsavedChanges(false)
        if (onUnsavedChangeState) onUnsavedChangeState(false)
        onRecordsUpdated()
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan mutabaah.')
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSaving(false)
    }
  }

  const getStudentScore = (studentId: number) => {
    const coreActs = activities.filter((a) => a.aktif && a.target_harian !== null && a.target_harian !== undefined)
    const totalBobot = coreActs.reduce((acc, curr) => acc + Number(curr.bobot || 1), 0)
    
    let earnedWeight = 0
    let tuntasCount = 0

    for (const act of coreActs) {
      const entry = recordMap[studentId]?.[act.id]
      const b = Number(act.bobot || 1)
      if (entry) {
        if (act.tipe === 'boolean') {
          if (entry.status === 'done') {
            earnedWeight += b
            tuntasCount++
          }
        } else {
          const jml = Number(entry.jumlah || 0)
          const target = Number(act.target_harian || (act.kode === 'shalat_5_waktu' ? 5 : 1))
          const capaian = Math.min(jml / target, 1)
          earnedWeight += capaian * b
          if (jml >= target) tuntasCount++
        }
      }
    }

    const percent = totalBobot > 0 ? Math.round((earnedWeight / totalBobot) * 100) : 0

    const bonusDone = activities.some(
      (a) => a.target_harian === null && recordMap[studentId]?.[a.id]?.status === 'done'
    )

    return { completed: tuntasCount, total: coreActs.length, percent, bonusDone }
  }

  return (
    <Card className="border-neutral-200 bg-white shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle>Mutabaah Yaumiyah ({activities.length} Amalan Harian)</CardTitle>
            {!canEdit && (
              <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 bg-neutral-100 text-neutral-600">
                <Lock className="h-3 w-3" />
                Hanya Lihat ({profile?.role ? profile.role.toUpperCase() : 'Read-Only'})
              </Badge>
            )}
            {canEdit && hasUnsavedChanges && (
              <Badge variant="warning" className="text-[10px] py-0 px-2 animate-pulse">
                Belum Tersimpan
              </Badge>
            )}
          </div>
          <CardDescription>
            Monitoring ibadah harian santri: shalat fardhu di masjid, shalat sunnah, dzikir, tilawah, mufradat & membaca kitab
          </CardDescription>
        </div>

        {canEdit && (
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fillStandardRoutine}
              className="text-xs font-semibold gap-1.5 text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            >
              <Wand2 className="h-3.5 w-3.5 text-purple-600" />
              Isi Rutinitas Standar (1-Klik)
            </Button>

            <Button
              variant={hasUnsavedChanges ? 'default' : 'secondary'}
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className={`text-xs font-semibold gap-1.5 ${
                hasUnsavedChanges
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <Save className={`h-3.5 w-3.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Menyimpan...' : 'Simpan Mutabaah'}
            </Button>
          </div>
        )}
      </CardHeader>

      {errorMessage && (
        <div className="m-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* 1. DESKTOP VIEW: 4 Columns Grid (md: and above) */}
      <CardContent className="p-4 hidden md:block">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {students.map((student) => {
            const { completed, total, percent, bonusDone } = getStudentScore(student.id)

            return (
              <div
                key={student.id}
                className="flex flex-col rounded-xl border border-neutral-200/90 bg-neutral-50/40 p-4 shadow-2xs hover:border-neutral-300 transition-all"
              >
                <div className="flex items-start justify-between pb-3 border-b border-neutral-200/60">
                  <div>
                    <div className="font-bold text-neutral-900 text-sm leading-tight">{student.nama}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Kelas {student.kelas}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant={percent >= 80 ? 'success' : percent >= 50 ? 'warning' : 'outline'}
                      className="text-xs font-bold"
                    >
                      {percent}%
                    </Badge>
                    {bonusDone && (
                      <Badge variant="purple" className="text-[9px] py-0 px-1 font-bold">
                        Puasa Sunnah ✓
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                  <span>Pencapaian Amalan</span>
                  <span className="font-semibold text-neutral-800">{completed}/{total} Selesai</span>
                </div>
                <div className="mt-1 h-1.5 w-full rounded-full bg-neutral-200/80 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="mt-3.5 space-y-2 flex-1">
                  {activities.map((act) => {
                    const entry = recordMap[student.id]?.[act.id]
                    const isDone = entry?.status === 'done'
                    const isBonus = act.target_harian === null

                    if (act.tipe === 'boolean') {
                      return (
                        <button
                          key={act.id}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => toggleBoolean(student.id, act.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs font-medium transition-all ${
                            isDone
                              ? isBonus
                                ? 'border-purple-300 bg-purple-100/90 text-purple-950 shadow-2xs font-bold'
                                : 'border-purple-200 bg-purple-50/80 text-purple-950 shadow-2xs'
                              : 'border-neutral-200/60 bg-white text-neutral-600 hover:bg-neutral-100/70'
                          } ${!canEdit ? 'cursor-default' : ''}`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{act.nama}</span>
                            {isBonus && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200/80 text-purple-800 font-semibold">
                                Bonus
                              </span>
                            )}
                          </div>
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
                              isDone
                                ? 'border-purple-600 bg-purple-600 text-white'
                                : 'border-neutral-300 bg-white text-transparent'
                            }`}
                          >
                            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                          </div>
                        </button>
                      )
                    }

                    const val = entry?.jumlah || 0
                    const target = act.target_harian || (act.kode === 'shalat_5_waktu' ? 5 : 1)
                    const isMaxReached = act.kode === 'shalat_5_waktu' && val >= 5
                    const isMinReached = val <= 0

                    return (
                      <div
                        key={act.id}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                          val > 0
                            ? 'border-purple-200 bg-purple-50/60 text-purple-950 shadow-2xs'
                            : 'border-neutral-200/60 bg-white text-neutral-600'
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-neutral-800">{act.nama}</span>
                          <span className="text-[10px] text-neutral-400">
                            Target: {target} {act.satuan || 'waktu'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              disabled={isMinReached}
                              onClick={() => setNumericAmount(student.id, act.id, val - 1, act.kode)}
                              className="h-6 w-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-100 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                          )}

                          <span className="min-w-[28px] text-center font-bold text-xs text-neutral-900">
                            {val}
                          </span>

                          {canEdit && (
                            <button
                              type="button"
                              disabled={isMaxReached}
                              onClick={() => setNumericAmount(student.id, act.id, val + 1, act.kode)}
                              className="h-6 w-6 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-40 disabled:hover:bg-neutral-100 disabled:cursor-not-allowed flex items-center justify-center font-bold transition-all"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* 2. MOBILE VIEW: 1 Student Per Screen (< md) */}
      <div className="p-3 space-y-4 md:hidden">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {students.map((s) => {
            const { percent, bonusDone } = getStudentScore(s.id)
            const isCurrent = activeMobileStudentId === s.id
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveMobileStudentId(s.id)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  isCurrent
                    ? 'border-purple-600 bg-purple-600 text-white shadow-2xs'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <span>{s.nama.split(' ')[0]}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isCurrent ? 'bg-purple-800 text-purple-100' : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {percent}%
                </span>
                {bonusDone && <span className="text-[10px]">✨</span>}
              </button>
            )
          })}
        </div>

        {(() => {
          const student = students.find((s) => s.id === activeMobileStudentId) || students[0]
          if (!student) return null
          const { completed, total, percent, bonusDone } = getStudentScore(student.id)

          return (
            <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <div>
                  <h4 className="font-bold text-neutral-900 text-sm leading-tight">{student.nama}</h4>
                  <p className="text-[11px] text-neutral-500">Kelas {student.kelas} • Program Mekkah & Madinah</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={percent >= 80 ? 'success' : 'warning'} className="text-xs font-bold">
                    {percent}%
                  </Badge>
                  {bonusDone && (
                    <Badge variant="purple" className="text-[9px] py-0 px-1 font-bold">
                      Puasa Sunnah ✓
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
                <span>Pencapaian: {completed}/{total} Amalan</span>
                <span className="font-bold text-purple-700">{percent}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-full bg-purple-600" style={{ width: `${percent}%` }} />
              </div>

              <div className="space-y-2.5 pt-1">
                {activities.map((act) => {
                  const entry = recordMap[student.id]?.[act.id]
                  const isDone = entry?.status === 'done'
                  const isBonus = act.target_harian === null

                  if (act.tipe === 'boolean') {
                    return (
                      <button
                        key={act.id}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => toggleBoolean(student.id, act.id)}
                        className={`w-full min-h-[44px] flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          isDone
                            ? isBonus
                              ? 'border-purple-300 bg-purple-100 text-purple-950 shadow-2xs font-bold'
                              : 'border-purple-200 bg-purple-50 text-purple-950 shadow-2xs'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                        } ${!canEdit ? 'opacity-90' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{act.nama}</span>
                          {isBonus && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-200 text-purple-800 font-bold">
                              Bonus
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-lg border transition-all ${
                            isDone
                              ? 'border-purple-600 bg-purple-600 text-white'
                              : 'border-neutral-300 bg-white text-transparent'
                          }`}
                        >
                          <Check className="h-4 w-4 stroke-[3]" />
                        </div>
                      </button>
                    )
                  }

                  const val = entry?.jumlah || 0
                  const target = act.target_harian || (act.kode === 'shalat_5_waktu' ? 5 : 1)
                  const isMaxReached = act.kode === 'shalat_5_waktu' && val >= 5
                  const isMinReached = val <= 0

                  return (
                    <div
                      key={act.id}
                      className={`min-h-[48px] flex items-center justify-between px-3.5 py-2 rounded-xl border text-xs transition-all ${
                        val > 0
                          ? 'border-purple-200 bg-purple-50/70 text-purple-950 shadow-2xs'
                          : 'border-neutral-200 bg-white text-neutral-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-semibold text-neutral-900">{act.nama}</span>
                        <span className="text-[10px] text-neutral-400">
                          Target: {target} {act.satuan || 'waktu'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <button
                            type="button"
                            disabled={isMinReached}
                            onClick={() => setNumericAmount(student.id, act.id, val - 1, act.kode)}
                            className="h-10 w-10 rounded-xl bg-white border border-neutral-300 text-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base shadow-2xs active:bg-neutral-100"
                          >
                            <Minus className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        )}

                        <span className="min-w-[32px] text-center font-bold text-sm text-neutral-900">
                          {val}
                        </span>

                        {canEdit && (
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={() => setNumericAmount(student.id, act.id, val + 1, act.kode)}
                            className="h-10 w-10 rounded-xl bg-white border border-neutral-300 text-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base shadow-2xs active:bg-neutral-100"
                          >
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {canEdit && (
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={fillStandardRoutine}
              className="w-full h-11 text-xs font-semibold gap-2 border-neutral-300 text-neutral-700"
            >
              <Wand2 className="h-4 w-4 text-purple-600" />
              Isi Rutinitas Standar (1-Klik)
            </Button>
            <Button
              variant={hasUnsavedChanges ? 'default' : 'secondary'}
              onClick={handleSave}
              disabled={saving}
              className={`w-full h-11 text-xs font-bold gap-2 ${
                hasUnsavedChanges ? 'bg-neutral-900 text-white' : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Menyimpan...' : 'Simpan Mutabaah'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
