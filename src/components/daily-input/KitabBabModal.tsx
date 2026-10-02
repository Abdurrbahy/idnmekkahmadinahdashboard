import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Edit2, BookOpen, Check, AlertCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import type { Subject, KitabBab } from '@/types/database'
import { fetchKitabBab, saveKitabBab, deleteKitabBab } from '@/lib/supabase'

interface KitabBabModalProps {
  isOpen: boolean
  onClose: () => void
  subjects: Subject[]
  selectedSubjectId?: number
  onBabCreated?: (newBab: KitabBab) => void
}

export const KitabBabModal: React.FC<KitabBabModalProps> = ({
  isOpen,
  onClose,
  subjects,
  selectedSubjectId,
  onBabCreated,
}) => {
  const quizSubjects = subjects.filter((s) => s.mode_input === 'kuis' || s.kode === 'NAHWU')
  const [currentSubjectId, setCurrentSubjectId] = useState<number>(
    selectedSubjectId || quizSubjects[0]?.id || subjects[0]?.id || 1
  )

  const [babList, setBabList] = useState<KitabBab[]>([])
  const [loading, setLoading] = useState(false)
  const [editingBabId, setEditingBabId] = useState<number | null>(null)

  // Form states
  const [kitab, setKitab] = useState('Nahwu Wadhih')
  const [jilid, setJilid] = useState('2')
  const [nomorBab, setNomorBab] = useState<string>('1')
  const [judulBab, setJudulBab] = useState('')
  const [halaman, setHalaman] = useState<string>('')
  const [urutan, setUrutan] = useState<string>('1')
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (selectedSubjectId) {
      setCurrentSubjectId(selectedSubjectId)
    }
  }, [selectedSubjectId])

  const loadBab = async (subjId: number) => {
    setLoading(true)
    setErrorMsg(null)
    try {
      const data = await fetchKitabBab(subjId)
      setBabList(data)
    } catch (e) {
      console.warn('Error loading kitab bab:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && currentSubjectId) {
      loadBab(currentSubjectId)
    }
  }, [isOpen, currentSubjectId])

  if (!isOpen) return null

  const handleStartEdit = (b: KitabBab) => {
    setEditingBabId(b.id)
    setKitab(b.kitab)
    setJilid(b.jilid || '')
    setNomorBab(String(b.nomor_bab))
    setJudulBab(b.judul_bab)
    setHalaman(b.halaman ? String(b.halaman) : '')
    setUrutan(String(b.urutan))
    setErrorMsg(null)
    setSuccessMsg(null)
  }

  const handleCancelEdit = () => {
    setEditingBabId(null)
    setJudulBab('')
    setHalaman('')
    setErrorMsg(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!judulBab.trim()) {
      setErrorMsg('Judul bab wajib diisi.')
      return
    }
    const nBab = Number(nomorBab) || 1
    const nUrutan = Number(urutan) || nBab

    setSaving(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const payload: Partial<KitabBab> = {
        id: editingBabId || undefined,
        subject_id: currentSubjectId,
        kitab: kitab.trim() || 'Kitab',
        jilid: jilid.trim() || null,
        nomor_bab: nBab,
        judul_bab: judulBab.trim(),
        halaman: halaman.trim() ? Number(halaman) : null,
        urutan: nUrutan,
        aktif: true,
      }

      const res = await saveKitabBab(payload)
      if (res.success && res.data) {
        setSuccessMsg(editingBabId ? 'Bab berhasil diperbarui!' : 'Bab baru berhasil ditambahkan!')
        await loadBab(currentSubjectId)
        if (!editingBabId && onBabCreated) {
          onBabCreated(res.data)
        }
        handleCancelEdit()
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan bab kitab.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b: KitabBab) => {
    if (!window.confirm(`Hapus Bab ${b.nomor_bab}: ${b.judul_bab}?`)) return
    try {
      const res = await deleteKitabBab(b.id)
      if (res.success) {
        if (editingBabId === b.id) handleCancelEdit()
        await loadBab(currentSubjectId)
      } else {
        setErrorMsg(res.error || 'Gagal menghapus bab.')
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan sistem.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-900 text-white flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 leading-tight">
                Kelola Master Kitab & Bab
              </h3>
              <p className="text-xs text-neutral-500">
                Daftar bab materi pembelajaran kuis harian per mata pelajaran
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Subject Filter Bar */}
        <div className="px-6 py-3 border-b border-neutral-100 bg-white flex items-center gap-3 shrink-0">
          <label className="text-xs font-bold text-neutral-700 shrink-0">Mata Pelajaran:</label>
          <select
            value={currentSubjectId}
            onChange={(e) => {
              const sid = Number(e.target.value)
              setCurrentSubjectId(sid)
              handleCancelEdit()
            }}
            className="text-xs font-semibold rounded-lg border border-neutral-200 px-3 py-1.5 bg-neutral-50 text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nama} ({s.mode_input || 'jumlah'})
              </option>
            ))}
          </select>
        </div>

        {/* Modal Body: Form + List */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          {/* Alerts */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Tambah/Ubah Bab */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-800">
                {editingBabId ? 'Edit Bab Kitab' : '+ Tambah Bab Baru'}
              </span>
              {editingBabId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Nama Kitab</label>
                <Input
                  type="text"
                  value={kitab}
                  onChange={(e) => setKitab(e.target.value)}
                  placeholder="Contoh: Nahwu Wadhih"
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Jilid / Bagian</label>
                <Input
                  type="text"
                  value={jilid}
                  onChange={(e) => setJilid(e.target.value)}
                  placeholder="Contoh: 2"
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Nomor Bab</label>
                <Input
                  type="number"
                  min="1"
                  value={nomorBab}
                  onFocus={(e) => {
                    if (e.target.value === '0') setNomorBab('')
                  }}
                  onBlur={(e) => {
                    if (!e.target.value) setNomorBab('1')
                  }}
                  onChange={(e) => setNomorBab(e.target.value)}
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Judul / Materi Bab</label>
                <Input
                  type="text"
                  value={judulBab}
                  onChange={(e) => setJudulBab(e.target.value)}
                  placeholder="Contoh: Keadaan Mabni Fiil Amr"
                  className="h-8 text-xs bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Halaman Kitab</label>
                <Input
                  type="number"
                  min="1"
                  value={halaman}
                  onChange={(e) => setHalaman(e.target.value)}
                  placeholder="Contoh: 90"
                  className="h-8 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-600 mb-1">Urutan</label>
                <Input
                  type="number"
                  min="1"
                  value={urutan}
                  onChange={(e) => setUrutan(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-neutral-900 text-white hover:bg-neutral-800 text-xs font-bold gap-1.5"
              >
                {editingBabId ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{saving ? 'Menyimpan...' : editingBabId ? 'Simpan Perubahan' : 'Simpan Bab'}</span>
              </Button>
            </div>
          </form>

          {/* Daftar Bab Terdaftar */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Daftar Bab Terdaftar ({babList.length})
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-neutral-400">Memuat daftar bab...</div>
            ) : babList.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400 border border-dashed border-neutral-200 rounded-xl">
                Belum ada bab terdaftar untuk mata pelajaran ini.
              </div>
            ) : (
              <div className="border border-neutral-200 rounded-xl overflow-hidden divide-y divide-neutral-100 bg-white">
                {babList.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 flex items-center justify-between hover:bg-neutral-50/80 transition-colors text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-neutral-900">
                        {b.kitab} {b.jilid ? `jilid ${b.jilid}` : ''} — Bab {b.nomor_bab}: {b.judul_bab}
                      </div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                        <span>Urutan: #{b.urutan}</span>
                        {b.halaman && <span>• Hal. {b.halaman}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(b)}
                        className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                        title="Edit Bab"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(b)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Bab"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-200 bg-neutral-50 flex justify-end shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs font-semibold">
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}
