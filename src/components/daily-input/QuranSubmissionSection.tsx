import React, { useState, useEffect, useMemo } from 'react'
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Lock,
  AlertCircle,
  X,
  Check,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import type { Student, Subject, Submission, KitabBab } from '@/types/database'
import { ALL_SURAHS, calculateQuranAyatCount } from '@/data/staticData'
import {
  insertSubmission,
  updateSubmission,
  deleteSubmission,
  fetchKitabBab,
} from '@/lib/supabase'
import { useAuth } from '@/context/AuthContext'
import { formatUpdatedTime, isHariAktif } from '@/lib/dateUtils'
import { KitabBabModal } from './KitabBabModal'

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
  const isWeekend = !isHariAktif(selectedDate)
  const [isCollapsed, setIsCollapsed] = useState(isWeekend && submissions.length === 0)

  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDetailId, setEditingDetailId] = useState<number | undefined>(undefined)
  const [editingQuizDetailId, setEditingQuizDetailId] = useState<number | undefined>(undefined)

  // Master Kitab Bab Data & Modal State
  const [kitabBabList, setKitabBabList] = useState<KitabBab[]>([])
  const [isBabModalOpen, setIsBabModalOpen] = useState(false)

  // Form Fields
  const [studentId, setStudentId] = useState<number>(students[0]?.id || 1)
  const [subjectId, setSubjectId] = useState<number>(
    subjects.find((s) => s.kode === 'ZIYADAH')?.id || subjects[0]?.id || 1
  )

  // Quran Mode Fields
  const [surahAwal, setSurahAwal] = useState<number>(78)
  const [ayatAwal, setAyatAwal] = useState<string>('1')
  const [surahAkhir, setSurahAkhir] = useState<number>(78)
  const [ayatAkhir, setAyatAkhir] = useState<string>('40')

  // Kuis Mode Fields
  const [selectedBabId, setSelectedBabId] = useState<number | 'manual' | ''>('')
  const [kitabManual, setKitabManual] = useState<string>('')
  const [soalBenar, setSoalBenar] = useState<string>('8')
  const [soalTotal, setSoalTotal] = useState<string>('10')

  // Jumlah Mode Fields
  const [customCapaian, setCustomCapaian] = useState<string>('5')
  const [satuan, setSatuan] = useState<string>('ayat')

  // Common Fields
  const [status, setStatus] = useState<'lancar' | 'kurang_lancar' | 'mengulang'>('lancar')
  const [nilai, setNilai] = useState<string>('95')
  const [catatan, setCatatan] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [filterStudentId, setFilterStudentId] = useState<number | 'all'>('all')

  // Sync studentId when students list loads
  useEffect(() => {
    if (students.length > 0 && !students.some((s) => s.id === studentId)) {
      setStudentId(students[0].id)
    }
  }, [students, studentId])

  // Sync subjectId when subjects list loads
  useEffect(() => {
    if (subjects.length > 0 && !subjects.some((s) => s.id === subjectId)) {
      const def = subjects.find((s) => s.kode === 'ZIYADAH') || subjects[0]
      setSubjectId(def.id)
    }
  }, [subjects, subjectId])

  useEffect(() => {
    setIsCollapsed(!isHariAktif(selectedDate) && submissions.length === 0)
  }, [selectedDate, submissions.length])

  // Determine active mode from selectedSubject.mode_input (default to 'jumlah')
  const selectedSubject = useMemo(() => subjects.find((s) => s.id === subjectId), [subjects, subjectId])
  const activeMode: 'quran' | 'kuis' | 'jumlah' = useMemo(() => {
    if (selectedSubject?.mode_input) return selectedSubject.mode_input
    if (
      selectedSubject?.kategori === 'quran' ||
      selectedSubject?.jenis_setoran === 'ziyadah' ||
      selectedSubject?.jenis_setoran === 'murajaah'
    ) {
      return 'quran'
    }
    if (selectedSubject?.kode === 'NAHWU') return 'kuis'
    return 'jumlah'
  }, [selectedSubject])

  // Load Kitab Bab for the selected subject when in kuis mode
  const loadBabForSubject = async (sId: number) => {
    try {
      const babs = await fetchKitabBab(sId)
      setKitabBabList(babs)
      if (babs.length > 0 && selectedBabId === '') {
        setSelectedBabId(babs[0].id)
      }
    } catch (e) {
      console.warn('Error fetching kitab bab for subject:', e)
    }
  }

  useEffect(() => {
    if (activeMode === 'kuis' && subjectId) {
      loadBabForSubject(subjectId)
    }
  }, [activeMode, subjectId])

  const calculatedAyat = calculateQuranAyatCount(
    surahAwal,
    Number(ayatAwal) || 1,
    surahAkhir,
    Number(ayatAkhir) || 1
  )
  const surahAwalObj = ALL_SURAHS.find((s) => s.nomor === surahAwal)
  const surahAkhirObj = ALL_SURAHS.find((s) => s.nomor === surahAkhir)

  // Calculated read-only quiz score
  const calculatedQuizNilai = useMemo(() => {
    const b = Number(soalBenar) || 0
    const t = Math.max(1, Number(soalTotal) || 1)
    return Math.round((b / t) * 100 * 10) / 10
  }, [soalBenar, soalTotal])

  const handleSubjectChange = (id: number) => {
    setSubjectId(id)
    const sub = subjects.find((s) => s.id === id)
    if (sub?.jenis_setoran === 'mutun') {
      setSatuan('bait')
    } else if (sub?.jenis_setoran === 'mufradat') {
      setSatuan('kata')
    } else if (sub?.jenis_setoran === 'bahasa_arab') {
      setSatuan('soal')
    } else {
      setSatuan('ayat')
    }

    if (sub?.mode_input === 'kuis' || sub?.kode === 'NAHWU') {
      loadBabForSubject(id)
    }
  }

  const handleStartEdit = (sub: Submission) => {
    setEditingId(sub.id || null)
    setStudentId(sub.student_id)
    setSubjectId(sub.subject_id)
    setStatus(sub.status)
    setNilai(sub.nilai !== null && sub.nilai !== undefined ? String(sub.nilai) : '')
    setCatatan(sub.catatan || '')
    setCustomCapaian(String(sub.capaian))
    setSatuan(sub.satuan)

    const qDetail = sub.quran_details?.[0]
    if (qDetail) {
      setEditingDetailId(qDetail.id)
      setSurahAwal(qDetail.surah_awal)
      setAyatAwal(String(qDetail.ayat_awal))
      setSurahAkhir(qDetail.surah_akhir)
      setAyatAkhir(String(qDetail.ayat_akhir))
    } else {
      setEditingDetailId(undefined)
    }

    const quizDetail = sub.quiz_details?.[0]
    if (quizDetail) {
      setEditingQuizDetailId(quizDetail.id)
      if (quizDetail.kitab_bab_id) {
        setSelectedBabId(quizDetail.kitab_bab_id)
        setKitabManual('')
      } else if (quizDetail.kitab_manual) {
        setSelectedBabId('manual')
        setKitabManual(quizDetail.kitab_manual)
      }
      setSoalBenar(String(quizDetail.soal_benar))
      setSoalTotal(String(quizDetail.soal_total))
    } else {
      setEditingQuizDetailId(undefined)
    }

    setErrorMessage(null)
    window.scrollTo({ top: 300, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingDetailId(undefined)
    setEditingQuizDetailId(undefined)
    setCatatan('')
    setErrorMessage(null)
  }

  const handleBabCreated = (newBab: KitabBab) => {
    setKitabBabList((prev) => [...prev, newBab])
    setSelectedBabId(newBab.id)
    setIsBabModalOpen(false)
  }

  // Numeric Input Zero Cleaner (Fix B4: avoids leading zeros like 010)
  const handleNumericFocus = (
    val: string,
    setter: (val: string) => void
  ) => {
    if (val === '0') {
      setter('')
    }
  }

  const handleNumericBlur = (
    val: string,
    setter: (val: string) => void,
    defaultVal: string = '0'
  ) => {
    if (val.trim() === '' || isNaN(Number(val))) {
      setter(defaultVal)
    } else {
      setter(String(Number(val)))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canEdit) return
    setSubmitting(true)
    setErrorMessage(null)

    let finalCapaian = Number(customCapaian) || 1
    let finalSatuan = satuan
    let finalNilai: number | null = nilai ? Number(nilai) : null

    if (activeMode === 'quran') {
      finalCapaian = calculatedAyat
      finalSatuan = 'ayat'
    } else if (activeMode === 'kuis') {
      finalCapaian = Number(soalBenar) || 0
      finalSatuan = 'soal'
      finalNilai = calculatedQuizNilai
    }

    const submissionPayload = {
      student_id: studentId,
      subject_id: subjectId,
      tanggal: selectedDate,
      capaian: finalCapaian,
      satuan: finalSatuan,
      status,
      nilai: finalNilai,
      catatan: catatan.trim() || null,
    }

    const quranDetail =
      activeMode === 'quran'
        ? {
            id: editingDetailId,
            surah_awal: surahAwal,
            ayat_awal: Number(ayatAwal) || 1,
            surah_akhir: surahAkhir,
            ayat_akhir: Number(ayatAkhir) || 1,
          }
        : undefined

    const quizDetail =
      activeMode === 'kuis'
        ? {
            id: editingQuizDetailId,
            kitab_bab_id: selectedBabId === 'manual' || selectedBabId === '' ? null : Number(selectedBabId),
            kitab_manual: selectedBabId === 'manual' ? kitabManual.trim() : null,
            soal_benar: Number(soalBenar) || 0,
            soal_total: Math.max(1, Number(soalTotal) || 1),
          }
        : undefined

    try {
      if (editingId) {
        // UPDATE MODE
        const res = await updateSubmission(editingId, submissionPayload, quranDetail, quizDetail)
        if (res.success) {
          handleCancelEdit()
          onSubmissionsUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal memperbarui setoran.')
        }
      } else {
        // INSERT MODE
        const res = await insertSubmission(submissionPayload, quranDetail, quizDetail)
        if (res.success) {
          setCatatan('')
          onSubmissionsUpdated()
        } else {
          setErrorMessage(res.error || 'Gagal mencatat setoran baru.')
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (sub: Submission) => {
    if (!canEdit || !sub.id) return
    const student = sub.student || students.find((s) => s.id === sub.student_id)
    const qDetail = sub.quran_details?.[0]
    const quizDetail = sub.quiz_details?.[0]

    let detailText = `${sub.capaian} ${sub.satuan}`
    if (qDetail) {
      const sAwal = ALL_SURAHS.find((s) => s.nomor === qDetail.surah_awal)?.nama_latin || ''
      const sAkhir = ALL_SURAHS.find((s) => s.nomor === qDetail.surah_akhir)?.nama_latin || ''
      detailText = `${sAwal} ${qDetail.ayat_awal} s/d ${sAkhir} ${qDetail.ayat_akhir} (${sub.capaian} ayat)`
    } else if (quizDetail) {
      const bab = quizDetail.kitab_bab
      const babName = bab ? `${bab.kitab} — Bab ${bab.nomor_bab}: ${bab.judul_bab}` : quizDetail.kitab_manual || 'Kuis'
      detailText = `${babName} (${quizDetail.soal_benar}/${quizDetail.soal_total} benar)`
    }

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

  // Dynamic status labels based on activeMode (BAGIAN B2)
  const statusOptions = useMemo(() => {
    if (activeMode === 'kuis') {
      return [
        { id: 'lancar', label: 'Tuntas', color: 'bg-emerald-600' },
        { id: 'kurang_lancar', label: 'Perlu Perbaikan', color: 'bg-amber-500' },
        { id: 'mengulang', label: 'Remedial', color: 'bg-rose-600' },
      ] as const
    }
    return [
      { id: 'lancar', label: 'Lancar', color: 'bg-emerald-600' },
      { id: 'kurang_lancar', label: 'Kurang', color: 'bg-amber-500' },
      { id: 'mengulang', label: 'Ulang', color: 'bg-rose-600' },
    ] as const
  }, [activeMode])

  return (
    <div className="space-y-4">
      {/* Weekend Notice */}
      {isWeekend && (
        <div className="p-3 rounded-xl bg-neutral-100/90 border border-neutral-200 flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
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
            {isCollapsed ? 'Buka Form Setoran' : 'Lipat Form'}
          </Button>
        </div>
      )}

      {!isCollapsed && (
        <div className={`grid grid-cols-1 gap-5 ${canEdit ? 'lg:grid-cols-12' : 'lg:grid-cols-1'}`}>
          {/* 1. Form Input Section (Admin Only) */}
          {canEdit && (
            <div className="lg:col-span-5">
              <Card className="border-neutral-200 bg-white shadow-xs">
                <CardHeader className="border-b border-neutral-100 pb-3.5 flex flex-row items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-neutral-800" />
                      <CardTitle className="text-sm font-bold">
                        {editingId ? 'Ubah Rekaman Setoran' : 'Input Setoran & Kuis Baru'}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      {editingId
                        ? 'Perbarui rekaman setoran yang dipilih'
                        : 'Catat setoran Al-Qur’an, Kuis Bab (Nahwu), Mutun, & Mufradat'}
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
                    {/* A. Pilih Santri */}
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
                            <div className="truncate font-semibold">
                              {s.nama.split(' ')[0]} {s.nama.split(' ')[1] || ''}
                            </div>
                            <div
                              className={`text-[10px] ${
                                studentId === s.id ? 'text-neutral-300' : 'text-neutral-500'
                              }`}
                            >
                              Kelas {s.kelas}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* B. Pilih Mata Pelajaran */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-neutral-700">Mata Pelajaran</label>
                        <span className="text-[10px] text-neutral-400">
                          Mode: <b className="uppercase text-neutral-600">{activeMode}</b>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {subjects.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSubjectChange(sub.id)}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                              subjectId === sub.id
                                ? 'bg-neutral-900 text-white border-neutral-900 font-bold shadow-2xs'
                                : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                            }`}
                          >
                            {sub.nama}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* C. ADAPTIVE MODE FORM */}

                    {/* MODE 1: QURAN (Rentang Surah & Ayat) */}
                    {activeMode === 'quran' && (
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
                              onFocus={() => handleNumericFocus(ayatAwal, setAyatAwal)}
                              onBlur={() => handleNumericBlur(ayatAwal, setAyatAwal, '1')}
                              onChange={(e) => setAyatAwal(e.target.value)}
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
                              onFocus={() => handleNumericFocus(ayatAkhir, setAyatAkhir)}
                              onBlur={() => handleNumericBlur(ayatAkhir, setAyatAkhir, '1')}
                              onChange={(e) => setAyatAkhir(e.target.value)}
                              className="h-8 text-xs font-semibold"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: KUIS (Kitab, Bab, Benar / Total Soal, Nilai Otomatis) */}
                    {activeMode === 'kuis' && (
                      <div className="rounded-xl border border-neutral-200/90 bg-neutral-50/70 p-3.5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-neutral-800 flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4 text-neutral-700" />
                            Materi Kuis Per Bab
                          </span>
                          <button
                            type="button"
                            onClick={() => setIsBabModalOpen(true)}
                            className="text-[11px] font-bold text-neutral-900 hover:text-neutral-700 underline"
                          >
                            + Tambah Bab Baru
                          </button>
                        </div>

                        {/* Dropdown Bab Kitab */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-neutral-600 block">
                            Pilih Kitab & Bab
                          </label>
                          <select
                            value={selectedBabId}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val === 'manual') setSelectedBabId('manual')
                              else setSelectedBabId(val ? Number(val) : '')
                            }}
                            className="w-full h-8 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs font-medium text-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          >
                            <option value="">— Pilih Bab Kitab —</option>
                            {kitabBabList.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.kitab} {b.jilid ? `jilid ${b.jilid}` : ''} — Bab {b.nomor_bab}: {b.judul_bab} {b.halaman ? `(hal. ${b.halaman})` : ''}
                              </option>
                            ))}
                            <option value="manual">— Ketik Manual Bab Lain —</option>
                          </select>
                        </div>

                        {/* Fallback input jika manual dipilih */}
                        {selectedBabId === 'manual' && (
                          <div className="space-y-1">
                            <label className="text-[11px] font-semibold text-neutral-600 block">
                              Ketik Judul Kitab & Bab Manual
                            </label>
                            <Input
                              type="text"
                              value={kitabManual}
                              onChange={(e) => setKitabManual(e.target.value)}
                              placeholder="Contoh: Nahwu Wadhih 2 Bab 7..."
                              className="h-8 text-xs bg-white"
                              required
                            />
                          </div>
                        )}

                        {/* Input Soal Benar & Total Soal + Nilai Otomatis */}
                        <div className="grid grid-cols-12 gap-2.5 items-end pt-1">
                          <div className="col-span-4">
                            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                              Jawaban Benar
                            </label>
                            <Input
                              type="number"
                              min={0}
                              max={Number(soalTotal) || 100}
                              value={soalBenar}
                              onFocus={() => handleNumericFocus(soalBenar, setSoalBenar)}
                              onBlur={() => handleNumericBlur(soalBenar, setSoalBenar, '0')}
                              onChange={(e) => setSoalBenar(e.target.value)}
                              className="h-8 text-xs font-bold text-center bg-white"
                              required
                            />
                          </div>

                          <div className="col-span-1 text-center font-bold text-neutral-400 pb-2">/</div>

                          <div className="col-span-3">
                            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                              Total Soal
                            </label>
                            <Input
                              type="number"
                              min={1}
                              value={soalTotal}
                              onFocus={() => handleNumericFocus(soalTotal, setSoalTotal)}
                              onBlur={() => handleNumericBlur(soalTotal, setSoalTotal, '1')}
                              onChange={(e) => setSoalTotal(e.target.value)}
                              className="h-8 text-xs font-bold text-center bg-white"
                              required
                            />
                          </div>

                          <div className="col-span-4">
                            <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                              Nilai Kuis
                            </label>
                            <div className="h-8 rounded-lg bg-neutral-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                              {calculatedQuizNilai}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: JUMLAH (Capaian + Satuan Manual) */}
                    {activeMode === 'jumlah' && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-neutral-700 block mb-1">
                            Jumlah Capaian
                          </label>
                          <Input
                            type="number"
                            min={1}
                            value={customCapaian}
                            onFocus={() => handleNumericFocus(customCapaian, setCustomCapaian)}
                            onBlur={() => handleNumericBlur(customCapaian, setCustomCapaian, '1')}
                            onChange={(e) => setCustomCapaian(e.target.value)}
                            className="h-8 text-xs font-bold"
                            required
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
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* D. Status / Kelancaran & Nilai Manual (Hanya untuk quran & jumlah) */}
                    <div className="grid grid-cols-12 gap-2 items-end">
                      <div className={activeMode === 'kuis' ? 'col-span-12' : 'col-span-8'}>
                        <label className="font-semibold text-neutral-700 block mb-1">
                          {activeMode === 'kuis' ? 'Status Kuis' : 'Kelancaran'}
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {statusOptions.map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setStatus(st.id)}
                              className={`h-8 rounded-md text-xs font-semibold transition-all ${
                                status === st.id
                                  ? `${st.color} text-white shadow-2xs font-bold`
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {activeMode !== 'kuis' && (
                        <div className="col-span-4">
                          <label className="font-semibold text-neutral-700 block mb-1">
                            Nilai (0-100)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={nilai}
                            onFocus={() => handleNumericFocus(nilai, setNilai)}
                            onBlur={() => handleNumericBlur(nilai, setNilai, '0')}
                            onChange={(e) => setNilai(e.target.value)}
                            placeholder="90"
                            className="h-8 text-xs font-bold"
                          />
                        </div>
                      )}
                    </div>

                    {/* E. Catatan Musyrif / Ustadz */}
                    <div>
                      <label className="font-semibold text-neutral-700 block mb-1">
                        Catatan / Evaluasi Ustadz
                      </label>
                      <Textarea
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        placeholder="Contoh: Menguasai bab fiil amr dengan baik, perlu latihan i'rob..."
                        rows={2}
                        className="text-xs min-h-[56px]"
                      />
                    </div>

                    {/* F. Submit Buttons */}
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
                            {submitting ? 'Menyimpan...' : 'Simpan Setoran / Kuis'}
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 2. Submission Feed Section */}
          <div className={canEdit ? 'lg:col-span-7 space-y-3' : 'w-full space-y-3'}>
            <Card className="border-neutral-200 bg-white shadow-xs">
              <CardHeader className="border-b border-neutral-100 pb-3 flex flex-row items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-bold">Riwayat Setoran Hari Ini</CardTitle>
                    {!canEdit && (
                      <Badge
                        variant="secondary"
                        className="gap-1 text-[10px] py-0 px-2 bg-neutral-100 text-neutral-600"
                      >
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
                    onChange={(e) =>
                      setFilterStudentId(
                        e.target.value === 'all' ? 'all' : Number(e.target.value)
                      )
                    }
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
                    <p className="text-xs font-medium text-neutral-600">
                      Belum ada setoran dicatat untuk tanggal ini
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      {canEdit
                        ? 'Gunakan formulir di samping untuk menambahkan setoran baru.'
                        : 'Data setoran akan muncul di sini saat ustadz melakukan input.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredSubmissions.map((sub) => {
                      const student = sub.student || students.find((s) => s.id === sub.student_id)
                      const subject = sub.subject || subjects.find((s) => s.id === sub.subject_id)
                      const quranDetail = sub.quran_details?.[0]
                      const quizDetail = sub.quiz_details?.[0]
                      const updatedText = formatUpdatedTime(sub.created_at, sub.updated_at)

                      const isKuis = subject?.mode_input === 'kuis' || Boolean(quizDetail)

                      // Status label based on mode (BAGIAN B2)
                      const statusLabel =
                        isKuis
                          ? sub.status === 'lancar'
                            ? 'Tuntas'
                            : sub.status === 'kurang_lancar'
                            ? 'Perlu Perbaikan'
                            : 'Remedial'
                          : sub.status === 'lancar'
                          ? 'Lancar'
                          : sub.status === 'kurang_lancar'
                          ? 'Kurang Lancar'
                          : 'Mengulang'

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
                              <span className="font-bold text-neutral-900 text-sm">
                                {student?.nama}
                              </span>
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
                                {statusLabel}
                              </Badge>
                              {updatedText && (
                                <span className="text-[10px] text-neutral-400 italic flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {updatedText}
                                </span>
                              )}
                            </div>

                            {/* KUIS MODE DISPLAY (BAGIAN B3) */}
                            {isKuis && quizDetail ? (
                              <div className="space-y-0.5">
                                <div className="text-neutral-900 font-semibold">
                                  {quizDetail.kitab_bab ? (
                                    <span>
                                      {quizDetail.kitab_bab.kitab}{' '}
                                      {quizDetail.kitab_bab.jilid
                                        ? `jilid ${quizDetail.kitab_bab.jilid} `
                                        : ''}
                                      — Bab {quizDetail.kitab_bab.nomor_bab}:{' '}
                                      {quizDetail.kitab_bab.judul_bab}
                                    </span>
                                  ) : (
                                    <span>{quizDetail.kitab_manual || 'Kuis Harian'}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-600 font-medium">
                                  <span className="font-bold text-neutral-900">
                                    {quizDetail.soal_benar}/{quizDetail.soal_total} soal benar
                                  </span>
                                  <span className="mx-1.5 text-neutral-300">·</span>
                                  <span className="font-bold text-neutral-900">
                                    Nilai: {sub.nilai !== null ? sub.nilai : '—'}
                                  </span>
                                </div>
                              </div>
                            ) : quranDetail ? (
                              /* QURAN MODE DISPLAY */
                              <div className="text-neutral-700 font-medium flex items-center gap-1.5">
                                <span className="bg-neutral-200/70 text-neutral-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                  {ALL_SURAHS.find((s) => s.nomor === quranDetail.surah_awal)?.nama_latin} :{' '}
                                  {quranDetail.ayat_awal}
                                </span>
                                <span className="text-neutral-400">s/d</span>
                                <span className="bg-neutral-200/70 text-neutral-800 px-1.5 py-0.5 rounded font-mono text-[11px]">
                                  {ALL_SURAHS.find((s) => s.nomor === quranDetail.surah_akhir)?.nama_latin} :{' '}
                                  {quranDetail.ayat_akhir}
                                </span>
                                <span className="font-bold text-neutral-900 ml-1">
                                  ({sub.capaian} Ayat)
                                </span>
                                {sub.nilai !== null && sub.nilai !== undefined && (
                                  <>
                                    <span className="text-neutral-300">·</span>
                                    <span className="font-semibold text-neutral-800">
                                      Nilai: {sub.nilai}
                                    </span>
                                  </>
                                )}
                              </div>
                            ) : (
                              /* JUMLAH MODE DISPLAY */
                              <div className="text-neutral-700 font-semibold flex items-center gap-2">
                                <span>
                                  {sub.capaian} {sub.satuan}
                                </span>
                                {sub.nilai !== null && sub.nilai !== undefined && (
                                  <>
                                    <span className="text-neutral-300">·</span>
                                    <span className="font-semibold text-neutral-800">
                                      Nilai: {sub.nilai}
                                    </span>
                                  </>
                                )}
                              </div>
                            )}

                            {sub.catatan && (
                              <div className="text-[11px] text-neutral-700 bg-neutral-100/90 px-2.5 py-1 rounded-md mt-1 border border-neutral-200/80">
                                <span className="font-semibold text-neutral-800">Catatan:</span> "{sub.catatan}"
                              </div>
                            )}
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
      )}

      {/* Kitab Bab Modal */}
      <KitabBabModal
        isOpen={isBabModalOpen}
        onClose={() => setIsBabModalOpen(false)}
        subjects={subjects}
        selectedSubjectId={subjectId}
        onBabCreated={handleBabCreated}
      />
    </div>
  )
}

export const SubmissionSection = QuranSubmissionSection
