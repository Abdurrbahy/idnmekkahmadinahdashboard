import React, { useState, useEffect } from 'react'
import { Check, CheckCircle2, UserCheck, Save, MessageSquare, Lock, AlertCircle } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import type { Student, AttendanceSession, AttendanceLog } from '@/types/database'
import { saveAttendanceLogs } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { isHariAktif } from '@/lib/dateUtils'

interface AttendanceSectionProps {
  selectedDate: string
  students: Student[]
  sessions: AttendanceSession[]
  initialLogs: AttendanceLog[]
  onLogsUpdated: () => void
  onUnsavedChangeState?: (hasUnsaved: boolean) => void
}

type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpa'

export const AttendanceSection: React.FC<AttendanceSectionProps> = ({
  selectedDate,
  students,
  sessions,
  initialLogs,
  onLogsUpdated,
  onUnsavedChangeState,
}) => {
  const { canEdit, profile } = useAuth()
  const isWeekend = !isHariAktif(selectedDate)
  const [isCollapsed, setIsCollapsed] = useState(isWeekend && initialLogs.length === 0)
  const [logsMap, setLogsMap] = useState<Record<number, Record<number, { status: AttendanceStatus; catatan?: string }>>>({})
  const [saving, setSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeNoteModal, setActiveNoteModal] = useState<{ studentId: number; sessionId: number; name: string; sessionName: string } | null>(null)
  const [noteText, setNoteText] = useState('')

  useEffect(() => {
    const map: Record<number, Record<number, { status: AttendanceStatus; catatan?: string }>> = {}
    for (const student of students) {
      map[student.id] = {}
      for (const session of sessions) {
        const found = initialLogs.find((l) => l.student_id === student.id && l.session_id === session.id)
        map[student.id][session.id] = {
          status: found ? found.status : 'hadir',
          catatan: found?.catatan || undefined,
        }
      }
    }
    setLogsMap(map)
    setHasUnsavedChanges(false)
    if (onUnsavedChangeState) onUnsavedChangeState(false)
    setErrorMessage(null)
    setIsCollapsed(!isHariAktif(selectedDate) && initialLogs.length === 0)
  }, [students, sessions, initialLogs, selectedDate])

  const setStatus = (studentId: number, sessionId: number, status: AttendanceStatus) => {
    if (!canEdit) return
    setLogsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [sessionId]: {
          ...prev[studentId]?.[sessionId],
          status,
        },
      },
    }))
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const markAllHadir = () => {
    if (!canEdit) return
    const updated: Record<number, Record<number, { status: AttendanceStatus; catatan?: string }>> = {}
    for (const student of students) {
      updated[student.id] = {}
      for (const session of sessions) {
        updated[student.id][session.id] = {
          status: 'hadir',
          catatan: logsMap[student.id]?.[session.id]?.catatan,
        }
      }
    }
    setLogsMap(updated)
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const markSessionHadir = (sessionId: number) => {
    if (!canEdit) return
    setLogsMap((prev) => {
      const updated = { ...prev }
      for (const student of students) {
        if (!updated[student.id]) updated[student.id] = {}
        updated[student.id] = {
          ...updated[student.id],
          [sessionId]: {
            ...updated[student.id][sessionId],
            status: 'hadir',
          },
        }
      }
      return updated
    })
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setErrorMessage(null)
  }

  const handleSave = async () => {
    if (!canEdit) return
    setSaving(true)
    setErrorMessage(null)
    const logsToSave: AttendanceLog[] = []
    for (const student of students) {
      for (const session of sessions) {
        const entry = logsMap[student.id]?.[session.id]
        if (entry) {
          logsToSave.push({
            student_id: student.id,
            session_id: session.id,
            tanggal: selectedDate,
            status: entry.status,
            catatan: entry.catatan || null,
          })
        }
      }
    }

    try {
      const res = await saveAttendanceLogs(logsToSave)
      if (res.success) {
        setHasUnsavedChanges(false)
        if (onUnsavedChangeState) onUnsavedChangeState(false)
        onLogsUpdated()
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan presensi.')
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Terjadi kesalahan sistem saat menyimpan.')
    } finally {
      setSaving(false)
    }
  }

  const openNoteModal = (studentId: number, sessionId: number) => {
    const s = students.find((item) => item.id === studentId)
    const ses = sessions.find((item) => item.id === sessionId)
    setActiveNoteModal({
      studentId,
      sessionId,
      name: s?.nama || 'Santri',
      sessionName: ses?.nama || 'Sesi',
    })
    setNoteText(logsMap[studentId]?.[sessionId]?.catatan || '')
  }

  const saveNoteModal = () => {
    if (!activeNoteModal || !canEdit) {
      setActiveNoteModal(null)
      return
    }
    const { studentId, sessionId } = activeNoteModal
    setLogsMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [sessionId]: {
          ...prev[studentId]?.[sessionId],
          catatan: noteText.trim() || undefined,
        },
      },
    }))
    setHasUnsavedChanges(true)
    if (onUnsavedChangeState) onUnsavedChangeState(true)
    setActiveNoteModal(null)
  }

  const statusColors: Record<AttendanceStatus, { active: string; inactive: string; label: string }> = {
    hadir: {
      active: 'bg-emerald-600 text-white font-bold shadow-xs',
      inactive: 'bg-neutral-100 text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700',
      label: 'Hadir',
    },
    izin: {
      active: 'bg-amber-500 text-white font-bold shadow-xs',
      inactive: 'bg-neutral-100 text-neutral-600 hover:bg-amber-50 hover:text-amber-700',
      label: 'Izin',
    },
    sakit: {
      active: 'bg-sky-500 text-white font-bold shadow-xs',
      inactive: 'bg-neutral-100 text-neutral-600 hover:bg-sky-50 hover:text-sky-700',
      label: 'Sakit',
    },
    alpa: {
      active: 'bg-rose-600 text-white font-bold shadow-xs',
      inactive: 'bg-neutral-100 text-neutral-600 hover:bg-rose-50 hover:text-rose-700',
      label: 'Alpa',
    },
  }

  return (
    <Card className="border-neutral-200 bg-white shadow-xs">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-100 pb-3.5">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-neutral-700" />
            <CardTitle>Presensi Harian 4 Sesi</CardTitle>
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
            Rekap kehadiran 4 Santri IDN Mekkah & Madinah per sesi kegiatan
          </CardDescription>
        </div>

        {canEdit && (
          <div className="hidden sm:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllHadir}
              className="text-xs font-semibold gap-1.5 text-neutral-700 border-neutral-200 hover:bg-neutral-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Tandai Semua Hadir
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
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </Button>
          </div>
        )}
      </CardHeader>

      {isWeekend && (
        <div className="mx-4 sm:mx-6 mt-4 p-3 rounded-xl bg-neutral-100/90 border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-neutral-400 shrink-0" />
            <span className="font-medium">
              Tidak ada sesi KBM pada hari libur (Jumat & Sabtu).
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-xs font-semibold text-neutral-800 border-neutral-300 bg-white hover:bg-neutral-50"
          >
            {isCollapsed ? 'Buka Form Presensi' : 'Lipat Form'}
          </Button>
        </div>
      )}

      {errorMessage && (
        <div className="m-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* 1. DESKTOP VIEW: Matrix Table (md: and above) */}
          <CardContent className="p-0 overflow-x-auto hidden md:block">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200/80 bg-neutral-50/70 text-xs font-semibold text-neutral-600">
              <th className="py-3 px-4 w-64">Nama Santri</th>
              {sessions.map((session) => (
                <th key={session.id} className="py-3 px-3 text-center min-w-[140px]">
                  <div className="flex flex-col items-center">
                    <span className="text-neutral-900 font-semibold">{session.nama}</span>
                    {canEdit && (
                      <button
                        onClick={() => markSessionHadir(session.id)}
                        className="text-[10px] text-neutral-400 hover:text-neutral-700 font-normal underline mt-0.5"
                      >
                        Set Hadir Semua
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="py-3 px-4 text-center w-28">Status Harian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {students.map((student) => {
              const studentLogEntries = sessions.map((s) => logsMap[student.id]?.[s.id]?.status)
              const hadirCount = studentLogEntries.filter((st) => st === 'hadir').length
              const allHadir = hadirCount === sessions.length

              return (
                <tr key={student.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3.5 px-4 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-neutral-100 font-bold text-neutral-800 text-xs border border-neutral-200">
                        {student.nama
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <div className="font-semibold text-neutral-900 text-sm leading-tight">
                          {student.nama}
                        </div>
                        <div className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1.5">
                          <span className="font-medium">Kelas {student.kelas}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-medium capitalize">{student.status}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {sessions.map((session) => {
                    const current = logsMap[student.id]?.[session.id] || { status: 'hadir' }
                    const hasNote = Boolean(current.catatan)

                    return (
                      <td key={session.id} className="py-3 px-2 align-middle text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(['hadir', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((st) => {
                            const isSelected = current.status === st
                            const shortLabel = st[0].toUpperCase()
                            return (
                              <button
                                key={st}
                                type="button"
                                disabled={!canEdit}
                                onClick={() => setStatus(student.id, session.id, st)}
                                className={`h-7 w-7 rounded-md text-xs font-bold transition-all ${
                                  isSelected
                                    ? statusColors[st].active
                                    : statusColors[st].inactive
                                } ${!canEdit ? 'cursor-default opacity-85' : ''}`}
                                title={`${statusColors[st].label} - ${student.nama} (${session.nama})`}
                              >
                                {shortLabel}
                              </button>
                            )
                          })}

                          <button
                            type="button"
                            onClick={() => openNoteModal(student.id, session.id)}
                            className={`h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                              hasNote
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : 'text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                            }`}
                            title={hasNote ? `Catatan: ${current.catatan}` : 'Lihat / Tambah Catatan'}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    )
                  })}

                  <td className="py-3.5 px-4 align-middle text-center">
                    {allHadir ? (
                      <Badge variant="success" className="gap-1 font-semibold text-[11px]">
                        <Check className="h-3 w-3" />
                        Lengkap
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="font-semibold text-[11px] text-neutral-700">
                        {hadirCount}/{sessions.length} Sesi
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </CardContent>

      {/* 2. MOBILE VIEW: Card Per Student with Touch Targets >= 44px (under md) */}
      <div className="p-3 space-y-4 md:hidden">
        {students.map((student) => {
          const studentLogEntries = sessions.map((s) => logsMap[student.id]?.[s.id]?.status)
          const hadirCount = studentLogEntries.filter((st) => st === 'hadir').length

          return (
            <div
              key={student.id}
              className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-3.5"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-white font-bold text-xs">
                    {student.nama
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900 text-xs leading-tight">{student.nama}</h4>
                    <span className="text-[10px] text-neutral-500">Kelas {student.kelas}</span>
                  </div>
                </div>
                <Badge variant={hadirCount === sessions.length ? 'success' : 'secondary'} className="text-[10px] font-bold">
                  {hadirCount}/{sessions.length} Sesi
                </Badge>
              </div>

              <div className="space-y-3">
                {sessions.map((session) => {
                  const current = logsMap[student.id]?.[session.id] || { status: 'hadir' }
                  const hasNote = Boolean(current.catatan)

                  return (
                    <div key={session.id} className="space-y-1.5 bg-neutral-50/60 p-2.5 rounded-xl border border-neutral-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-neutral-800">{session.nama}</span>
                        <button
                          type="button"
                          onClick={() => openNoteModal(student.id, session.id)}
                          className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md ${
                            hasNote ? 'bg-amber-100 text-amber-900 font-bold' : 'text-neutral-500 hover:text-neutral-800'
                          }`}
                        >
                          <MessageSquare className="h-3 w-3" />
                          <span>{hasNote ? 'Catatan ✓' : '+ Catatan'}</span>
                        </button>
                      </div>

                      {/* 4 Touch Targets >= 44px */}
                      <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                        {(['hadir', 'izin', 'sakit', 'alpa'] as AttendanceStatus[]).map((st) => {
                          const isSelected = current.status === st
                          return (
                            <button
                              key={st}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => setStatus(student.id, session.id, st)}
                              className={`h-11 rounded-lg text-xs font-bold transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? statusColors[st].active
                                  : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-100'
                              } ${!canEdit ? 'opacity-85' : ''}`}
                            >
                              <span>{st[0].toUpperCase()}</span>
                              <span className="text-[9px] font-normal opacity-90 capitalize">{st}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Mobile Action Buttons */}
        {canEdit && (
          <div className="pt-2 flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={markAllHadir}
              className="w-full h-11 text-xs font-semibold gap-2 border-neutral-300"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              Tandai Semua Hadir (1-Klik)
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
              {saving ? 'Menyimpan...' : 'Simpan Presensi'}
            </Button>
          </div>
        )}
      </div>
      </>
      )}

      {activeNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg border border-neutral-200">
            <h3 className="font-bold text-neutral-900 text-sm">Catatan Presensi</h3>
            <p className="text-xs text-neutral-500 mt-0.5">
              {activeNoteModal.name} — {activeNoteModal.sessionName}
            </p>

            <textarea
              disabled={!canEdit}
              className="mt-3 w-full rounded-xl border border-neutral-200 p-3 text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 placeholder:text-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-600"
              rows={3}
              placeholder={canEdit ? "Contoh: Izin ke RS Al-Ansar, Sakit demam, dsb." : "Tidak ada catatan."}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveNoteModal(null)}
                className="text-xs text-neutral-600"
              >
                {canEdit ? 'Batal' : 'Tutup'}
              </Button>
              {canEdit && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={saveNoteModal}
                  className="text-xs bg-neutral-900 text-white"
                >
                  Simpan Catatan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
