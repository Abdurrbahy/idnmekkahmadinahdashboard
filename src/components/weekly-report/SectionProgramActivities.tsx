import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  CalendarDays,
  Plus,
  Trash2,
  Clock,
} from 'lucide-react'
import type {
  ProgramActivitiesData,
  ProgramActivityItem,
} from '@/types/weeklyReportTemplate'
import type { Activity } from '@/types/database'
import {
  getDaysInWeek,
  todayRiyadh,
} from '@/lib/dateUtils'

interface SectionProgramActivitiesProps {
  data: ProgramActivitiesData
  onChange: (newData: ProgramActivitiesData) => void
  operationalActivities: Activity[]
  currentPekan: string
  readOnly?: boolean
}

export const SectionProgramActivities: React.FC<SectionProgramActivitiesProps> = ({
  data,
  onChange,
  operationalActivities,
  currentPekan,
  readOnly = false,
}) => {
  const days = getDaysInWeek(currentPekan)
  const today = todayRiyadh()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newAct, setNewAct] = useState<Partial<ProgramActivityItem>>({
    tanggal: currentPekan,
    nama_kegiatan: '',
    kategori: 'Tahfidz',
    deskripsi: '',
    status: 'Terlaksana',
  })

  const handleAddManualActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAct.nama_kegiatan || !newAct.tanggal) return

    const item: ProgramActivityItem = {
      id: `act-${Date.now()}`,
      tanggal: newAct.tanggal,
      nama_kegiatan: newAct.nama_kegiatan,
      kategori: newAct.kategori || 'Kegiatan Khusus',
      deskripsi: newAct.deskripsi || '',
      status: (newAct.status as any) || 'Terlaksana',
      catatan: newAct.catatan,
    }

    onChange({
      ...data,
      manual_activities: [...data.manual_activities, item],
    })

    setNewAct({
      tanggal: currentPekan,
      nama_kegiatan: '',
      kategori: 'Tahfidz',
      deskripsi: '',
      status: 'Terlaksana',
    })
    setShowAddModal(false)
  }

  const handleDeleteManual = (id: string) => {
    if (readOnly) return
    onChange({
      ...data,
      manual_activities: data.manual_activities.filter((a) => a.id !== id),
    })
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-neutral-800" />
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Bagian 7 — Aktivitas Program Pekan Ini (Timeline 7 Hari)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Jadwal harian Ahad s/d Sabtu memadukan agenda operasional database dan agenda khusus laporan.
              </CardDescription>
            </div>
          </div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="text-xs font-semibold gap-1.5 h-8 border-neutral-300 hover:bg-neutral-50"
            >
              <Plus className="h-3 w-3" />
              Tambah Aktivitas Khusus
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* Modal / Form Tambah Aktivitas */}
        {showAddModal && (
          <form
            onSubmit={handleAddManualActivity}
            className="p-4 rounded-xl border border-neutral-300 bg-neutral-50/90 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900">
                Tambah Aktivitas Khusus Laporan
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Tanggal
                </label>
                <select
                  value={newAct.tanggal}
                  onChange={(e) => setNewAct({ ...newAct, tanggal: e.target.value })}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium"
                >
                  {days.map((d) => (
                    <option key={d.date} value={d.date}>
                      {d.dayName}, {d.shortDate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Kategori
                </label>
                <select
                  value={newAct.kategori}
                  onChange={(e) => setNewAct({ ...newAct, kategori: e.target.value as any })}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-medium"
                >
                  <option value="Tahfidz">Tahfidz</option>
                  <option value="Arabic Speaking">Arabic Speaking</option>
                  <option value="KBM">KBM</option>
                  <option value="Mufradat">Mufradat</option>
                  <option value="Halaqah">Halaqah</option>
                  <option value="Ujian">Ujian / Evaluasi</option>
                  <option value="Khusus">Kegiatan Khusus / Rihlah</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Status
                </label>
                <select
                  value={newAct.status}
                  onChange={(e) => setNewAct({ ...newAct, status: e.target.value as any })}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="Terlaksana">Terlaksana</option>
                  <option value="Terjadwal">Terjadwal</option>
                  <option value="Ditunda">Ditunda</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Nama Kegiatan
                </label>
                <Input
                  type="text"
                  value={newAct.nama_kegiatan}
                  onChange={(e) => setNewAct({ ...newAct, nama_kegiatan: e.target.value })}
                  placeholder="Contoh: Majelis Sama' Hadits di Masjid Nabawi"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Deskripsi / Keterangan Singkat
                </label>
                <Input
                  type="text"
                  value={newAct.deskripsi}
                  onChange={(e) => setNewAct({ ...newAct, deskripsi: e.target.value })}
                  placeholder="Diikuti seluruh santri..."
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" size="sm" className="bg-neutral-900 text-white text-xs h-7">
                Tambahkan Aktivitas
              </Button>
            </div>
          </form>
        )}

        {/* 7 Days Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {days.map((day) => {
            const isFuture = day.date > today
            const isCurrentDay = day.date === today
            const isFriday = day.dayName === 'Jumat'
            const isSaturday = day.dayName === 'Sabtu'

            // Activities for this date
            const opActs = operationalActivities.filter((a) => a.tanggal === day.date)
            const manualActs = data.manual_activities.filter((a) => a.tanggal === day.date)

            return (
              <div
                key={day.date}
                className={`rounded-xl border p-3 flex flex-col justify-between min-h-[170px] transition-all ${
                  isCurrentDay
                    ? 'border-neutral-900 bg-white ring-2 ring-neutral-900/10 shadow-2xs'
                    : isFuture
                    ? 'border-neutral-200/60 bg-neutral-50/40 text-neutral-400'
                    : 'border-neutral-200 bg-neutral-50/70'
                }`}
              >
                <div>
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-1.5 mb-2">
                    <span
                      className={`text-xs font-bold ${
                        isCurrentDay ? 'text-neutral-900' : 'text-neutral-700'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {day.shortDate}
                    </span>
                  </div>

                  {/* Day Status / Items */}
                  {isFuture ? (
                    <div className="text-[11px] text-neutral-400 italic flex items-center gap-1 mt-2">
                      <Clock className="h-3 w-3" />
                      Belum berlangsung
                    </div>
                  ) : opActs.length === 0 && manualActs.length === 0 ? (
                    isFriday ? (
                      <div className="text-[11px] text-neutral-600 bg-neutral-100 rounded px-2 py-1 mt-1 font-semibold">
                        Libur KBM
                      </div>
                    ) : isSaturday ? (
                      <div className="text-[11px] text-purple-700 bg-purple-50 rounded px-2 py-1 mt-1 font-semibold border border-purple-200/60">
                        Majelis Sama' Nabawi
                      </div>
                    ) : (
                      <div className="text-[11px] text-neutral-400 italic mt-2">
                        Belum ada data
                      </div>
                    )
                  ) : (
                    <div className="space-y-1.5 mt-1">
                      {/* Operational DB activities */}
                      {opActs.map((act) => (
                        <div
                          key={act.id}
                          className="p-1.5 rounded bg-white border border-neutral-200 text-[10px] shadow-2xs"
                        >
                          <div className="font-bold text-neutral-800 line-clamp-1">
                            {act.judul || act.activity_type?.nama || 'Aktivitas KBM'}
                          </div>
                          {act.keterangan && (
                            <div className="text-neutral-500 line-clamp-1">
                              {act.keterangan}
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Manual report activities */}
                      {manualActs.map((m) => (
                        <div
                          key={m.id}
                          className="p-1.5 rounded bg-sky-50/80 border border-sky-200 text-[10px] relative group"
                        >
                          <div className="font-bold text-sky-950 line-clamp-1">
                            {m.nama_kegiatan}
                          </div>
                          {m.deskripsi && (
                            <div className="text-sky-800 line-clamp-1">{m.deskripsi}</div>
                          )}
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => handleDeleteManual(m.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-rose-600 transition-opacity"
                              title="Hapus"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Day Footer Tag */}
                <div className="pt-2 text-[9px] text-neutral-400 text-right">
                  {isFriday || isSaturday ? 'Weekend' : 'KBM Aktif'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Catatan Umum Aktivitas Pekan Ini */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-neutral-800 block">
            Catatan Umum Aktivitas Program Pekan Ini
          </label>
          <Textarea
            value={data.catatan_umum || ''}
            onChange={(e) => onChange({ ...data, catatan_umum: e.target.value })}
            disabled={readOnly}
            placeholder="Contoh: Seluruh KBM berjalan sesuai jadwal tanpa hambatan cuaca atau perizinan. Majelis Sama' di Nabawi dihadiri lengkap..."
            rows={2}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
