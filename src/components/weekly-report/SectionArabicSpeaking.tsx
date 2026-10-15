import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  MessageSquare,
  Video,
  Mic,
  Plus,
  Trash2,
} from 'lucide-react'
import type {
  ArabicSpeakingData,
  ArabicVlogItem,
  PodcastWatData,
} from '@/types/weeklyReportTemplate'
import type { Student } from '@/types/database'

interface SectionArabicSpeakingProps {
  data: ArabicSpeakingData
  onChange: (newData: ArabicSpeakingData) => void
  students: Student[]
  currentPekan: string
  readOnly?: boolean
}

export const SectionArabicSpeaking: React.FC<SectionArabicSpeakingProps> = ({
  data,
  onChange,
  students,
  currentPekan,
  readOnly = false,
}) => {
  const activeStudents = students.filter((s) => s.status === 'aktif')

  // --- VLOG HANDLERS ---
  const handleAddVlogItem = () => {
    if (readOnly) return
    const newItem: ArabicVlogItem = {
      id: `vlog-${Date.now()}`,
      hari: 'Senin',
      tanggal: currentPekan,
      nama_peserta: activeStudents[0]?.nama || '',
      judul_topik: '',
      status: 'Terjadwal',
    }
    onChange({
      ...data,
      vlog_schedule: [...data.vlog_schedule, newItem],
    })
  }

  const handleUpdateVlogItem = (index: number, field: keyof ArabicVlogItem, value: any) => {
    if (readOnly) return
    const updated = [...data.vlog_schedule]
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      onChange({
        ...data,
        vlog_schedule: updated,
      })
    }
  }

  const handleDeleteVlogItem = (index: number) => {
    if (readOnly) return
    const updated = data.vlog_schedule.filter((_, i) => i !== index)
    onChange({
      ...data,
      vlog_schedule: updated,
    })
  }

  // --- PODCAST HANDLERS ---
  const handleUpdatePodcast = (field: keyof PodcastWatData, value: any) => {
    if (readOnly) return
    onChange({
      ...data,
      podcast_wat: {
        ...data.podcast_wat,
        [field]: value,
      },
    })
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-neutral-800" />
          <div>
            <CardTitle className="text-base font-bold text-neutral-900">
              Bagian 6 — Progress Arabic Speaking (Vlog & Podcast)
            </CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Jadwal dan capaian program pengembangan bahasa Arab lisan (Arabic Vlog & Weekend Arabic Talk).
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-6">
        {/* SUBBAGIAN 1: ARABIC VLOG */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                1. Jadwal & Pelaksanaan Arabic Vlog
              </h3>
            </div>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddVlogItem}
                className="text-xs h-7 gap-1 font-semibold border-neutral-300 hover:bg-neutral-50"
              >
                <Plus className="h-3 w-3" />
                Tambah Jadwal Vlog
              </Button>
            )}
          </div>

          <div className="rounded-xl border border-neutral-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-100/80 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="py-2.5 px-3 w-28">Hari & Tanggal</th>
                    <th className="py-2.5 px-3 w-44">Peserta / Santri</th>
                    <th className="py-2.5 px-3">Judul / Topik Vlog</th>
                    <th className="py-2.5 px-3 w-32 text-center">Status</th>
                    <th className="py-2.5 px-3 w-32">Link Video</th>
                    {!readOnly && <th className="py-2.5 px-2 w-10 text-center">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200/70">
                  {data.vlog_schedule.length === 0 ? (
                    <tr>
                      <td colSpan={readOnly ? 5 : 6} className="py-6 text-center text-neutral-400">
                        Belum ada jadwal Arabic Vlog pekan ini. Klik "Tambah Jadwal Vlog" untuk menambahkan entri.
                      </td>
                    </tr>
                  ) : (
                    data.vlog_schedule.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-neutral-50/60">
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            value={item.hari}
                            onChange={(e) => handleUpdateVlogItem(idx, 'hari', e.target.value)}
                            disabled={readOnly}
                            placeholder="Senin"
                            className="text-xs h-7 font-semibold"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={item.nama_peserta}
                            onChange={(e) => handleUpdateVlogItem(idx, 'nama_peserta', e.target.value)}
                            disabled={readOnly}
                            className="w-full h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-800"
                          >
                            <option value="">-- Pilih Santri --</option>
                            {activeStudents.map((s) => (
                              <option key={s.id} value={s.nama}>
                                {s.nama}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            value={item.judul_topik}
                            onChange={(e) => handleUpdateVlogItem(idx, 'judul_topik', e.target.value)}
                            disabled={readOnly}
                            placeholder="Contoh: Rihlah ke Jabal Uhud"
                            className="text-xs h-7"
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateVlogItem(idx, 'status', e.target.value)}
                            disabled={readOnly}
                            className="w-full h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs font-semibold text-neutral-800"
                          >
                            <option value="Terjadwal">Terjadwal</option>
                            <option value="Selesai">Selesai</option>
                            <option value="Belum terlaksana">Belum terlaksana</option>
                            <option value="Dijadwalkan ulang">Dijadwalkan ulang</option>
                          </select>
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            type="text"
                            value={item.link_video || ''}
                            onChange={(e) => handleUpdateVlogItem(idx, 'link_video', e.target.value)}
                            disabled={readOnly}
                            placeholder="https://..."
                            className="text-xs h-7 font-mono"
                          />
                        </td>
                        {!readOnly && (
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteVlogItem(idx)}
                              className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                              title="Hapus Entri"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* SUBBAGIAN 2: PODCAST WAT (Weekend Arabic Talk) */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-sky-600" />
            <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              2. Podcast Weekend Arabic Talk (WAT)
            </h3>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/50 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Status Pelaksanaan
                </label>
                <select
                  value={data.podcast_wat.status}
                  onChange={(e) => handleUpdatePodcast('status', e.target.value)}
                  disabled={readOnly}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="Direncanakan">Direncanakan</option>
                  <option value="Terjadwal">Terjadwal</option>
                  <option value="Sudah berjalan">Sudah berjalan</option>
                  <option value="Ditunda">Ditunda</option>
                  <option value="Belum terlaksana">Belum terlaksana</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Hari & Waktu Pelaksanaan
                </label>
                <Input
                  type="text"
                  value={data.podcast_wat.hari_tanggal}
                  onChange={(e) => handleUpdatePodcast('hari_tanggal', e.target.value)}
                  disabled={readOnly}
                  placeholder="Sabtu Malam / Ba'da Isya"
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Host / Moderator
                </label>
                <Input
                  type="text"
                  value={data.podcast_wat.host}
                  onChange={(e) => handleUpdatePodcast('host', e.target.value)}
                  disabled={readOnly}
                  placeholder="Nama Host / Ustadz"
                  className="text-xs h-8"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Topik Pembahasan
                </label>
                <Input
                  type="text"
                  value={data.podcast_wat.topik}
                  onChange={(e) => handleUpdatePodcast('topik', e.target.value)}
                  disabled={readOnly}
                  placeholder="Topik: Pengalaman Menuntut Ilmu di Kota Nabi"
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Peserta / Narasumber
                </label>
                <Input
                  type="text"
                  value={data.podcast_wat.peserta}
                  onChange={(e) => handleUpdatePodcast('peserta', e.target.value)}
                  disabled={readOnly}
                  placeholder="Santri Kelas 10 & 11"
                  className="text-xs h-8"
                />
              </div>

              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-neutral-700 block mb-1">
                  Link Rekaman / Dokumentasi
                </label>
                <Input
                  type="text"
                  value={data.podcast_wat.link_rekaman || ''}
                  onChange={(e) => handleUpdatePodcast('link_rekaman', e.target.value)}
                  disabled={readOnly}
                  placeholder="https://drive.google.com/... atau link YouTube"
                  className="text-xs h-8 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* CATATAN UMUM ARABIC SPEAKING */}
        <div className="space-y-2 pt-2">
          <label className="text-xs font-bold text-neutral-800 block">
            Catatan Evaluasi Program Arabic Speaking Pekan Ini
          </label>
          <Textarea
            value={data.catatan_evaluasi || ''}
            onChange={(e) => onChange({ ...data, catatan_evaluasi: e.target.value })}
            disabled={readOnly}
            placeholder="Contoh: Santri semakin percaya diri menyusun kalimat dalam bahasa Arab. Penggunaan mufradat harian di asrama mulai membias..."
            rows={2}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  )
}
