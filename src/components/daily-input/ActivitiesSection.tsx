import React, { useState } from 'react'
import {
  CalendarDays,
  Plus,
  ExternalLink,
  Users,
  User,
  Image as ImageIcon,
  Lock,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import type { ActivityType, Activity } from '@/types/database'
import { saveActivity, updateActivity, deleteActivity } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatUpdatedTime } from '@/lib/dateUtils'

interface ActivitiesSectionProps {
  selectedDate: string
  activityTypes: ActivityType[]
  activities: Activity[]
  onActivitiesUpdated: () => void
}

export const ActivitiesSection: React.FC<ActivitiesSectionProps> = ({
  selectedDate,
  activityTypes,
  activities,
  onActivitiesUpdated,
}) => {
  const { canEdit, profile } = useAuth()

  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form Fields
  const [activityTypeId, setActivityTypeId] = useState<number>(activityTypes[0]?.id || 1)
  const [judul, setJudul] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [jumlahHadir, setJumlahHadir] = useState('4')
  const [penanggungJawab, setPenanggungJawab] = useState('')
  const [googlePhotoLink, setGooglePhotoLink] = useState('')

  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleStartEdit = (act: Activity) => {
    setEditingId(act.id || null)
    setActivityTypeId(act.activity_type_id)
    setJudul(act.judul || '')
    setKeterangan(act.keterangan || '')
    setJumlahHadir(act.jumlah_hadir !== null && act.jumlah_hadir !== undefined ? String(act.jumlah_hadir) : '4')
    setPenanggungJawab(act.penanggung_jawab || '')
    setGooglePhotoLink(act.link_google_photo || '')
    setErrorMessage(null)
    window.scrollTo({ top: 500, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setJudul('')
    setKeterangan('')
    setPenanggungJawab('')
    setGooglePhotoLink('')
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSaving(true)
    setErrorMessage(null)

    const payload = {
      activity_type_id: activityTypeId,
      tanggal: selectedDate,
      judul: judul.trim() || null,
      keterangan: keterangan.trim() || null,
      jumlah_hadir: jumlahHadir ? Number(jumlahHadir) : 4,
      jumlah_total: 4,
      penanggung_jawab: penanggungJawab.trim() || null,
      link_google_photo: googlePhotoLink.trim() || null,
    }

    try {
      if (editingId) {
        // UPDATE MODE
        const res = await updateActivity(editingId, payload)
        if (res.success) {
          handleCancelEdit()
          onActivitiesUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal mengubah kegiatan.')
        }
      } else {
        // INSERT MODE
        const res = await saveActivity(payload)
        if (res.success) {
          setJudul('')
          setKeterangan('')
          setPenanggungJawab('')
          setGooglePhotoLink('')
          onActivitiesUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal menyimpan kegiatan.')
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (act: Activity) => {
    if (!canEdit || !act.id) return
    const actName = act.judul || act.activity_type?.nama || 'kegiatan ini'
    if (window.confirm(`Hapus dokumentasi "${actName}"?\nData tidak dapat dipulihkan setelah dihapus.`)) {
      const res = await deleteActivity(act.id)
      if (res.success) {
        if (editingId === act.id) handleCancelEdit()
        onActivitiesUpdated()
      } else {
        setErrorMessage(res.error || 'Gagal menghapus kegiatan.')
      }
    }
  }

  return (
    <div className={`grid grid-cols-1 gap-5 ${canEdit ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
      {/* Form Input Activity (Only for Admin) */}
      {canEdit && (
        <div className="lg:col-span-5">
          <Card className="border-neutral-200 bg-white shadow-xs">
            <CardHeader className="border-b border-neutral-100 pb-3.5 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-amber-600" />
                  <CardTitle className="text-sm font-bold">
                    {editingId ? 'Ubah Agenda / Kegiatan' : 'Catat Agenda / Kegiatan'}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {editingId ? 'Perbarui informasi kegiatan santri' : 'Dokumentasikan aktivitas harian & pekanan santri di Mekkah/Madinah'}
                </CardDescription>
              </div>

              {editingId && (
                <Button
                  variant="ghost"
                  size="xsIcon"
                  onClick={handleCancelEdit}
                  className="text-neutral-500 hover:text-neutral-900"
                  title="Batalkan Edit"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>

            <CardContent className="p-4 pt-4">
              {errorMessage && (
                <div className="mb-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <p>{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Jenis Aktivitas</label>
                  <select
                    value={activityTypeId}
                    onChange={(e) => setActivityTypeId(Number(e.target.value))}
                    className="w-full h-9 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                  >
                    <optgroup label="Kegiatan Harian">
                      {activityTypes
                        .filter((t) => t.jenis === 'harian')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nama}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="Kegiatan Pekanan / Khusus">
                      {activityTypes
                        .filter((t) => t.jenis === 'pekanan')
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nama}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Judul / Topik Kegiatan</label>
                  <Input
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    placeholder="Contoh: Halaqah Tahsin Ba'da Ashar di Masjid Nabawi"
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Kehadiran Santri</label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={4}
                        value={jumlahHadir}
                        onChange={(e) => setJumlahHadir(e.target.value)}
                        className="h-8 text-xs font-bold text-center"
                      />
                      <span className="text-neutral-500 font-medium">/ 4 Santri</span>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-neutral-700 block mb-1">Pembimbing / Ustadz</label>
                    <Input
                      value={penanggungJawab}
                      onChange={(e) => setPenanggungJawab(e.target.value)}
                      placeholder="Contoh: Ustadz Ahmad"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Deskripsi / Hasil Kegiatan</label>
                  <Textarea
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Ringkasan materi, kegiatan santri, atau catatan pembimbing..."
                    rows={2}
                    className="text-xs min-h-[60px]"
                  />
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1 flex items-center justify-between">
                    <span>Link Album Foto (Google Photos / Drive)</span>
                    <ImageIcon className="h-3 w-3 text-neutral-400" />
                  </label>
                  <Input
                    type="url"
                    value={googlePhotoLink}
                    onChange={(e) => setGooglePhotoLink(e.target.value)}
                    placeholder="https://photos.app.goo.gl/..."
                    className="h-8 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {editingId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelEdit}
                      className="flex-1 h-9 text-xs font-semibold"
                    >
                      Batal
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={saving}
                    className={`h-9 bg-neutral-900 text-white hover:bg-neutral-800 font-semibold gap-1.5 ${
                      editingId ? 'flex-1' : 'w-full'
                    }`}
                  >
                    {editingId ? (
                      <>
                        <Check className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {saving ? 'Menyimpan...' : 'Simpan Kegiatan'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Timeline Section */}
      <div className={canEdit ? 'lg:col-span-7 space-y-3' : 'w-full space-y-3'}>
        <Card className="border-neutral-200 bg-white shadow-xs">
          <CardHeader className="border-b border-neutral-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">Daftar Kegiatan Tercatat Hari Ini</CardTitle>
                {!canEdit && (
                  <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 bg-neutral-100 text-neutral-600">
                    <Lock className="h-3 w-3" />
                    Hanya Lihat ({profile?.role ? profile.role.toUpperCase() : 'Read-Only'})
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {activities.length} aktivitas terdokumentasi pada tanggal terpilih
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                <CalendarDays className="h-10 w-10 stroke-1 mb-2 text-neutral-300" />
                <p className="text-xs font-medium text-neutral-600">Belum ada kegiatan terdokumentasi hari ini</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {canEdit ? 'Gunakan formulir untuk mencatat kegiatan & album foto.' : 'Dokumentasi kegiatan akan tampil di sini saat diisi oleh ustadz.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => {
                  const updatedText = formatUpdatedTime(act.created_at, act.updated_at)
                  return (
                    <div
                      key={act.id}
                      className={`group rounded-xl border p-3.5 text-xs transition-colors space-y-2 ${
                        editingId === act.id
                          ? 'border-neutral-900 bg-neutral-100/70 shadow-2xs'
                          : 'border-neutral-200/80 bg-neutral-50/40 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-white">
                              {act.activity_type?.nama || 'Aktivitas'}
                            </Badge>
                            {act.activity_type?.jenis === 'pekanan' && (
                              <Badge variant="purple" className="text-[9px] font-bold py-0">
                                Program Khusus
                              </Badge>
                            )}
                            {updatedText && (
                              <span className="text-[10px] text-neutral-400 italic flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {updatedText}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-neutral-900 text-sm mt-1">
                            {act.judul || act.activity_type?.nama}
                          </h4>
                        </div>

                        {canEdit && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(act)}
                              className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800 transition-all"
                              title="Edit Kegiatan"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(act)}
                              className="rounded p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                              title="Hapus Kegiatan"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {act.keterangan && (
                        <p className="text-neutral-600 leading-relaxed">{act.keterangan}</p>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-neutral-200/60 text-neutral-500 text-[11px]">
                        {act.jumlah_hadir !== null && act.jumlah_hadir !== undefined && (
                          <div className="flex items-center gap-1 text-neutral-700 font-medium">
                            <Users className="h-3 w-3 text-neutral-400" />
                            <span>{act.jumlah_hadir}/{act.jumlah_total || 4} Santri Hadir</span>
                          </div>
                        )}

                        {act.penanggung_jawab && (
                          <div className="flex items-center gap-1 text-neutral-700">
                            <User className="h-3 w-3 text-neutral-400" />
                            <span>Ustadz: {act.penanggung_jawab}</span>
                          </div>
                        )}

                        {act.link_google_photo && (
                          <a
                            href={act.link_google_photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 font-semibold text-sky-700 hover:text-sky-900 ml-auto hover:underline"
                          >
                            <ImageIcon className="h-3 w-3" />
                            <span>Lihat Album Foto</span>
                            <ExternalLink className="h-2.5 w-2.5 ml-0.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
