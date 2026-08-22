import React, { useState } from 'react'
import { BookOpen, Plus, Trash2, Edit2, Sparkles, Lock, AlertCircle, X, Check, Clock } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import type { Student, Subject, Submission } from '@/types/database'
import { ALL_SURAHS, calculateQuranAyatCount } from '@/data/staticData'
import { insertSubmission, updateSubmission, deleteSubmission } from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatUpdatedTime } from '@/lib/dateUtils'

interface QuranSubmissionSectionProps {
  selectedDate: string
  students: Student[]
  subjects: Subject[]
  submissions: Submission[]
  onSubmissionsUpdated: () => void
}

export const QuranSubmissionSection: React.FC<QuranSubmissionSectionProps> = ({
  selectedDate,
  students,
  subjects,
  submissions,
  onSubmissionsUpdated,
}) => {
  const { canEdit, profile } = useAuth()
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDetailId, setEditingDetailId] = useState<number | undefined>(undefined)

  // Form Fields
  const [studentId, setStudentId] = useState<number>(students[0]?.id || 1)
  const [subjectId, setSubjectId] = useState<number>(subjects.find((s) => s.kode === 'ZIYADAH')?.id || subjects[0]?.id || 1)
  
  const [surahAwal, setSurahAwal] = useState<number>(78)
  const [ayatAwal, setAyatAwal] = useState<number>(1)
  const [surahAkhir, setSurahAkhir] = useState<number>(78)
  const [ayatAkhir, setAyatAkhir] = useState<number>(40)
  
  const [customCapaian, setCustomCapaian] = useState<number>(5)
  const [satuan, setSatuan] = useState<string>('ayat')

  const [status, setStatus] = useState<'lancar' | 'kurang_lancar' | 'mengulang'>('lancar')
  const [nilai, setNilai] = useState<string>('95')
  const [catatan, setCatatan] = useState<string>('')
  
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filterStudentId, setFilterStudentId] = useState<number | 'all'>('all')

  const selectedSubject = subjects.find((s) => s.id === subjectId)
  const isQuranType = selectedSubject?.kategori === 'quran' || selectedSubject?.jenis_setoran === 'ziyadah' || selectedSubject?.jenis_setoran === 'murajaah'

  const calculatedAyat = calculateQuranAyatCount(surahAwal, ayatAwal, surahAkhir, ayatAkhir)
  const surahAwalObj = ALL_SURAHS.find((s) => s.nomor === surahAwal)
  const surahAkhirObj = ALL_SURAHS.find((s) => s.nomor === surahAkhir)

  const handleSubjectChange = (id: number) => {
    setSubjectId(id)
    const sub = subjects.find((s) => s.id === id)
    if (sub?.jenis_setoran === 'mutun') {
      setSatuan('bait')
    } else if (sub?.jenis_setoran === 'mufradat') {
      setSatuan('kata')
    } else if (sub?.jenis_setoran === 'bahasa_arab') {
      setSatuan('halaman')
    } else {
      setSatuan('ayat')
    }
  }

  const handleStartEdit = (sub: Submission) => {
    setEditingId(sub.id || null)
    setStudentId(sub.student_id)
    setSubjectId(sub.subject_id)
    setStatus(sub.status)
    setNilai(sub.nilai !== null && sub.nilai !== undefined ? String(sub.nilai) : '')
    setCatatan(sub.catatan || '')
    setCustomCapaian(sub.capaian)
    setSatuan(sub.satuan)

    const qDetail = sub.quran_details?.[0]
    if (qDetail) {
      setEditingDetailId(qDetail.id)
      setSurahAwal(qDetail.surah_awal)
      setAyatAwal(qDetail.ayat_awal)
      setSurahAkhir(qDetail.surah_akhir)
      setAyatAkhir(qDetail.ayat_akhir)
    } else {
      setEditingDetailId(undefined)
    }
    setErrorMessage(null)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDetailId(undefined)
    setCatatan('')
    setErrorMessage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSubmitting(true)
    setErrorMessage(null)

    const finalCapaian = isQuranType ? calculatedAyat : Number(customCapaian) || 1
    const finalSatuan = isQuranType ? 'ayat' : satuan

    const submissionPayload = {
      student_id: studentId,
      subject_id: subjectId,
      tanggal: selectedDate,
      capaian: finalCapaian,
      satuan: finalSatuan,
      status,
      nilai: nilai ? Number(nilai) : null,
      catatan: catatan.trim() || null,
    }

    const quranDetail = isQuranType
      ? {
          id: editingDetailId,
          surah_awal: surahAwal,
          ayat_awal: Number(ayatAwal) || 1,
          surah_akhir: surahAkhir,
          ayat_akhir: Number(ayatAkhir) || 1,
        }
      : undefined

    try {
      if (editingId) {
        // UPDATE MODE
        const res = await updateSubmission(editingId, submissionPayload, quranDetail)
        if (res.success) {
          handleCancelEdit()
          onSubmissionsUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal mengubah setoran.')
        }
      } else {
        // INSERT MODE
        const res = await insertSubmission(submissionPayload, quranDetail)
        if (res.success) {
          setCatatan('')
          onSubmissionsUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal menyimpan setoran.')
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sub: Submission) => {
    if (!canEdit || !sub.id) return
    const student = sub.student || students.find((s) => s.id === sub.student_id)
    const qDetail = sub.quran_details?.[0]
    const sAwal = qDetail ? ALL_SURAHS.find((s) => s.nomor === qDetail.surah_awal)?.nama_latin : ''
    const sAkhir = qDetail ? ALL_SURAHS.find((s) => s.nomor === qDetail.surah_akhir)?.nama_latin : ''

    const detailText = qDetail
      ? `${sAwal} ${qDetail.ayat_awal} s/d ${sAkhir} ${qDetail.ayat_akhir} (${sub.capaian} ayat)`
      : `${sub.capaian} ${sub.satuan}`

    const confirmMsg = `Hapus setoran ${student?.nama || 'santri'}?\n${detailText}\n\nPerhatian: Data yang dihapus tidak dapat dipulihkan.`
    if (window.confirm(confirmMsg)) {
      const res = await deleteSubmission(sub.id)
      if (res.success) {
        if (editingId === sub.id) handleCancelEdit()
        onSubmissionsUpdated()
      } else {
        setErrorMessage(res.error || 'Gagal menghapus setoran.')
      }
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (filterStudentId === 'all') return true
    return s.student_id === filterStudentId
  })

  return (
    <div className={`grid grid-cols-1 gap-5 ${canEdit ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
      {/* Form Input Section (Only for Admin) */}
      {canEdit && (
        <div className="lg:col-span-5">
          <Card className="border-neutral-200 bg-white shadow-xs">
            <CardHeader className="border-b border-neutral-100 pb-3.5 flex flex-row items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-neutral-800" />
                  <CardTitle className="text-sm font-bold">
                    {editingId ? 'Ubah Setoran Santri' : 'Input Setoran Baru'}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs">
                  {editingId ? 'Perbarui rekaman hafalan yang dipilih' : 'Catat setoran Ziyadah, Murajaah, Mutun & Bahasa Arab'}
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
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Pilih Santri</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {students.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStudentId(s.id)}
                        className={`p-2 rounded-lg border text-left text-xs transition-all ${
                          studentId === s.id
                            ? 'border-neutral-900 bg-neutral-900 text-white font-semibold shadow-xs'
                            : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <div className="truncate font-semibold">{s.nama.split(' ')[0]} {s.nama.split(' ')[1] || ''}</div>
                        <div className={`text-[10px] ${studentId === s.id ? 'text-neutral-300' : 'text-neutral-500'}`}>
                          Kelas {s.kelas}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Jenis Program / Materi</label>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.slice(0, 6).map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => handleSubjectChange(sub.id)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                          subjectId === sub.id
                            ? 'bg-neutral-800 text-white border-neutral-800'
                            : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {sub.nama}
                      </button>
                    ))}
                  </div>
                </div>

                {isQuranType ? (
                  <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/60 p-3 space-y-3">
                    <div className="flex items-center justify-between text-neutral-700">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                        Rentang Surah & Ayat
                      </span>
                      <Badge variant="info" className="text-[11px] font-bold">
                        {calculatedAyat} Ayat
                      </Badge>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <label className="text-[11px] text-neutral-500 block mb-0.5">Surah Mulai</label>
                        <select
                          value={surahAwal}
                          onChange={(e) => {
                            const n = Number(e.target.value)
                            setSurahAwal(n)
                            if (surahAkhir < n) setSurahAkhir(n)
                          }}
                          className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        >
                          {ALL_SURAHS.map((s) => (
                            <option key={s.nomor} value={s.nomor}>
                              {s.nomor}. {s.nama_latin} ({s.jumlah_ayat} ayat)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <label className="text-[11px] text-neutral-500 block mb-0.5">Ayat Mulai</label>
                        <Input
                          type="number"
                          min={1}
                          max={surahAwalObj?.jumlah_ayat || 286}
                          value={ayatAwal}
                          onChange={(e) => setAyatAwal(Number(e.target.value))}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <label className="text-[11px] text-neutral-500 block mb-0.5">Surah Selesai</label>
                        <select
                          value={surahAkhir}
                          onChange={(e) => setSurahAkhir(Number(e.target.value))}
                          className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400"
                        >
                          {ALL_SURAHS.filter((s) => s.nomor >= surahAwal).map((s) => (
                            <option key={s.nomor} value={s.nomor}>
                              {s.nomor}. {s.nama_latin} ({s.jumlah_ayat} ayat)
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-5">
                        <label className="text-[11px] text-neutral-500 block mb-0.5">Ayat Selesai</label>
                        <Input
                          type="number"
                          min={1}
                          max={surahAkhirObj?.jumlah_ayat || 286}
                          value={ayatAkhir}
                          onChange={(e) => setAyatAkhir(Number(e.target.value))}
                          className="h-8 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Jumlah Capaian</label>
                      <Input
                        type="number"
                        min={1}
                        value={customCapaian}
                        onChange={(e) => setCustomCapaian(Number(e.target.value))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">Satuan</label>
                      <Input
                        type="text"
                        value={satuan}
                        onChange={(e) => setSatuan(e.target.value)}
                        placeholder="bait / kata / halaman"
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-8">
                    <label className="font-semibold text-neutral-700 block mb-1">Kelancaran</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          { id: 'lancar', label: 'Lancar', color: 'bg-emerald-600' },
                          { id: 'kurang_lancar', label: 'Kurang', color: 'bg-amber-500' },
                          { id: 'mengulang', label: 'Ulang', color: 'bg-rose-600' },
                        ] as const
                      ).map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStatus(st.id)}
                          className={`h-7 rounded-md text-xs font-semibold transition-all ${
                            status === st.id
                              ? `${st.color} text-white shadow-2xs`
                              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-4">
                    <label className="font-semibold text-neutral-700 block mb-1">Nilai (0-100)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={nilai}
                      onChange={(e) => setNilai(e.target.value)}
                      placeholder="90"
                      className="h-7 text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-neutral-700 block mb-1">Catatan / Evaluasi Ustadz</label>
                  <Textarea
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Tajwid fasih, makharijul huruf shad & dhad perlu diperjelas..."
                    rows={2}
                    className="text-xs min-h-[60px]"
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
                    disabled={submitting}
                    className={`h-9 bg-neutral-900 text-white hover:bg-neutral-800 font-semibold gap-1.5 ${
                      editingId ? 'flex-1' : 'w-full'
                    }`}
                  >
                    {editingId ? (
                      <>
                        <Check className="h-4 w-4" />
                        {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        {submitting ? 'Menyimpan...' : 'Simpan Setoran Santri'}
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Submission Feed Section */}
      <div className={canEdit ? 'lg:col-span-7 space-y-3' : 'w-full space-y-3'}>
        <Card className="border-neutral-200 bg-white shadow-xs">
          <CardHeader className="border-b border-neutral-100 pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-bold">Riwayat Setoran Hari Ini</CardTitle>
                {!canEdit && (
                  <Badge variant="secondary" className="gap-1 text-[10px] py-0 px-2 bg-neutral-100 text-neutral-600">
                    <Lock className="h-3 w-3" />
                    Hanya Lihat ({profile?.role ? profile.role.toUpperCase() : 'Read-Only'})
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Total {submissions.length} rekaman setoran pada tanggal terpilih
              </CardDescription>
            </div>

            <div className="flex items-center gap-1.5">
              <select
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="h-7 rounded-md border border-neutral-200 bg-neutral-50 px-2 text-xs font-medium text-neutral-700 focus:outline-none"
              >
                <option value="all">Semua Santri</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-4">
            {filteredSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-neutral-400">
                <BookOpen className="h-10 w-10 stroke-1 mb-2 text-neutral-300" />
                <p className="text-xs font-medium text-neutral-600">Belum ada setoran dicatat untuk tanggal ini</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  {canEdit ? 'Gunakan formulir di samping untuk menambahkan setoran baru.' : 'Data setoran akan muncul di sini saat ustadz melakukan input.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredSubmissions.map((sub) => {
                  const student = sub.student || students.find((s) => s.id === sub.student_id)
                  const subject = sub.subject || subjects.find((s) => s.id === sub.subject_id)
                  const quranDetail = sub.quran_details?.[0]
                  const surahAwalData = quranDetail ? ALL_SURAHS.find((s) => s.nomor === quranDetail.surah_awal) : null
                  const surahAkhirData = quranDetail ? ALL_SURAHS.find((s) => s.nomor === quranDetail.surah_akhir) : null
                  const updatedText = formatUpdatedTime(sub.created_at, sub.updated_at)

                  return (
                    <div
                      key={sub.id}
                      className={`group flex items-start justify-between rounded-xl border p-3 text-xs transition-colors ${
                        editingId === sub.id
                          ? 'border-neutral-900 bg-neutral-100/70 shadow-2xs'
                          : 'border-neutral-200/80 bg-neutral-50/40 hover:bg-neutral-50'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900 text-sm">{student?.nama}</span>
                          <Badge variant="outline" className="text-[10px] font-medium bg-white">
                            {subject?.nama || sub.jenis}
                          </Badge>
                          <Badge
                            variant={
                              sub.status === 'lancar'
                                ? 'success'
                                : sub.status === 'kurang_lancar'
                                ? 'warning'
                                : 'danger'
                            }
                            className="capitalize text-[10px] font-semibold"
                          >
                            {sub.status.replace('_', ' ')}
                          </Badge>
                          {updatedText && (
                            <span className="text-[10px] text-neutral-400 italic flex items-center gap-0.5">
                              <Clock className="h-2.5 w-2.5" />
                              {updatedText}
                            </span>
                          )}
                        </div>

                        {quranDetail && surahAwalData && surahAkhirData ? (
                          <div className="text-neutral-700 font-medium flex items-center gap-1.5">
                            <span className="bg-neutral-200/70 text-neutral-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                              {surahAwalData.nama_latin} : {quranDetail.ayat_awal}
                            </span>
                            <span className="text-neutral-400">s/d</span>
                            <span className="bg-neutral-200/70 text-neutral-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                              {surahAkhirData.nama_latin} : {quranDetail.ayat_akhir}
                            </span>
                            <span className="font-bold text-neutral-900 ml-1">({sub.capaian} Ayat)</span>
                          </div>
                        ) : (
                          <div className="text-neutral-700 font-semibold">
                            {sub.capaian} {sub.satuan}
                          </div>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-neutral-500 pt-0.5">
                          {sub.nilai !== null && sub.nilai !== undefined && (
                            <span className="font-semibold text-neutral-700">Nilai: {sub.nilai}</span>
                          )}
                          {sub.catatan && <span className="italic">"{sub.catatan}"</span>}
                        </div>
                      </div>

                      {canEdit && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(sub)}
                            className="rounded p-1 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-800 transition-all"
                            title="Edit Setoran"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(sub)}
                            className="rounded p-1 text-neutral-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                            title="Hapus Setoran"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
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
