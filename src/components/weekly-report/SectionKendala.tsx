import React, { useState } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  Plus,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import type { KendalaData, KendalaItem } from '@/types/weeklyReportTemplate'

interface SectionKendalaProps {
  data: KendalaData
  onChange: (newData: KendalaData) => void
  readOnly?: boolean
}

export const SectionKendala: React.FC<SectionKendalaProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState<Partial<KendalaItem>>({
    judul: '',
    deskripsi: '',
    dampak: '',
    prioritas: 'Sedang',
    tindak_lanjut: '',
    penanggung_jawab: '',
    target_penyelesaian: '',
    status: 'Sedang berjalan',
  })

  const handleToggleNoIssues = (checked: boolean) => {
    if (readOnly) return
    onChange({
      ...data,
      tidak_ada_kendala: checked,
    })
  }

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItem.judul || !newItem.tindak_lanjut) return

    const item: KendalaItem = {
      id: `issue-${Date.now()}`,
      judul: newItem.judul,
      deskripsi: newItem.deskripsi || '',
      dampak: newItem.dampak || '',
      prioritas: (newItem.prioritas as any) || 'Sedang',
      tindak_lanjut: newItem.tindak_lanjut,
      penanggung_jawab: newItem.penanggung_jawab || 'Koordinator',
      target_penyelesaian: newItem.target_penyelesaian || 'Pekan Depan',
      status: (newItem.status as any) || 'Sedang berjalan',
      catatan: newItem.catatan,
    }

    onChange({
      tidak_ada_kendala: false,
      items: [...data.items, item],
    })

    setNewItem({
      judul: '',
      deskripsi: '',
      dampak: '',
      prioritas: 'Sedang',
      tindak_lanjut: '',
      penanggung_jawab: '',
      target_penyelesaian: '',
      status: 'Sedang berjalan',
    })
    setShowAddForm(false)
  }

  const handleUpdateItem = (index: number, field: keyof KendalaItem, value: any) => {
    if (readOnly) return
    const updated = [...data.items]
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      onChange({
        ...data,
        items: updated,
      })
    }
  }

  const handleDeleteItem = (index: number) => {
    if (readOnly) return
    if (window.confirm('Hapus kendala dan rencana tindak lanjut ini?')) {
      const updated = data.items.filter((_, i) => i !== index)
      onChange({
        ...data,
        items: updated,
      })
    }
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-neutral-800" />
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Bagian 9 — Kendala & Tindak Lanjut
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Pencatatan masalah operasional, dampak, prioritas, dan rencana tindakan solusi penanganan.
              </CardDescription>
            </div>
          </div>

          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={data.tidak_ada_kendala}
              className="text-xs font-semibold gap-1.5 h-8 border-neutral-300 hover:bg-neutral-50"
            >
              <Plus className="h-3 w-3" />
              Tambah Kendala
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5">
        {/* Explicit "Tidak Ada Kendala" Toggle */}
        <div className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/70 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-neutral-900 block">
              Keputusan Eksplisit Koordinator
            </span>
            <span className="text-[11px] text-neutral-500 block">
              Tandai jika tidak ada hambatan atau kendala yang perlu dilaporkan ke Yayasan pada pekan ini.
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={data.tidak_ada_kendala}
              onChange={(e) => handleToggleNoIssues(e.target.checked)}
              disabled={readOnly}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
            />
            <span className="text-xs font-bold text-neutral-800">
              Tidak ada kendala
            </span>
          </label>
        </div>

        {/* Form Tambah Kendala Baru */}
        {showAddForm && !data.tidak_ada_kendala && (
          <form
            onSubmit={handleAddItem}
            className="p-4 rounded-xl border border-neutral-300 bg-neutral-50/90 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-neutral-900">
                Tambah Kendala & Tindak Lanjut Baru
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-neutral-500 hover:text-neutral-800"
              >
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Judul Kendala *
                </label>
                <Input
                  type="text"
                  value={newItem.judul}
                  onChange={(e) => setNewItem({ ...newItem, judul: e.target.value })}
                  placeholder="Contoh: Beberapa santri mengalami flu ringan karena pergantian cuaca"
                  className="text-xs h-8 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Prioritas
                </label>
                <select
                  value={newItem.prioritas}
                  onChange={(e) => setNewItem({ ...newItem, prioritas: e.target.value as any })}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                  <option value="Mendesak">Mendesak</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Dampak Terhadap KBM
                </label>
                <Input
                  type="text"
                  value={newItem.dampak}
                  onChange={(e) => setNewItem({ ...newItem, dampak: e.target.value })}
                  placeholder="Konsentrasi halaqah pagi menurun"
                  className="text-xs h-8"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Rencana Tindak Lanjut Solutif *
                </label>
                <Input
                  type="text"
                  value={newItem.tindak_lanjut}
                  onChange={(e) => setNewItem({ ...newItem, tindak_lanjut: e.target.value })}
                  placeholder="Pemberian vitamin, istirahat cukup, dan pemantauan dokter klinik"
                  className="text-xs h-8"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Penanggung Jawab
                </label>
                <Input
                  type="text"
                  value={newItem.penanggung_jawab}
                  onChange={(e) => setNewItem({ ...newItem, penanggung_jawab: e.target.value })}
                  placeholder="Ustadz Pembina Asrama"
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Target Waktu Penyelesaian
                </label>
                <Input
                  type="text"
                  value={newItem.target_penyelesaian}
                  onChange={(e) => setNewItem({ ...newItem, target_penyelesaian: e.target.value })}
                  placeholder="1–2 Hari ke depan"
                  className="text-xs h-8"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-neutral-700 block mb-1">
                  Status Penanganan
                </label>
                <select
                  value={newItem.status}
                  onChange={(e) => setNewItem({ ...newItem, status: e.target.value as any })}
                  className="w-full h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-xs font-semibold"
                >
                  <option value="Sedang berjalan">Sedang berjalan</option>
                  <option value="Belum dimulai">Belum dimulai</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditunda">Ditunda</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button type="submit" size="sm" className="bg-neutral-900 text-white text-xs h-7">
                Tambahkan Item Kendala
              </Button>
            </div>
          </form>
        )}

        {/* Daftar Kendala Yang Terdaftar */}
        {data.tidak_ada_kendala ? (
          <div className="py-8 text-center text-xs text-emerald-800 bg-emerald-50/60 rounded-xl border border-emerald-200 flex flex-col items-center gap-1.5">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <span className="font-bold">
              Tidak ada kendala yang dilaporkan pada pekan ini.
            </span>
            <span className="text-[11px] text-emerald-700">
              Operasional KBM dan kesehatan santri berjalan lancar sesuai target.
            </span>
          </div>
        ) : data.items.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Belum ada kendala yang diisi. Klik "Tambah Kendala" jika ada masalah yang perlu ditindaklanjuti, atau centang opsi "Tidak ada kendala".
          </div>
        ) : (
          <div className="space-y-3">
            {data.items.map((it, idx) => (
              <div
                key={it.id || idx}
                className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`text-[10px] font-bold ${
                        it.prioritas === 'Mendesak'
                          ? 'bg-rose-600 text-white'
                          : it.prioritas === 'Tinggi'
                          ? 'bg-orange-500 text-white'
                          : it.prioritas === 'Sedang'
                          ? 'bg-amber-500 text-white'
                          : 'bg-neutral-200 text-neutral-700'
                      }`}
                    >
                      {it.prioritas}
                    </Badge>
                    <span className="font-bold text-neutral-900 text-xs">
                      {it.judul}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={it.status}
                      onChange={(e) => handleUpdateItem(idx, 'status', e.target.value)}
                      disabled={readOnly}
                      className="h-6 rounded border border-neutral-200 bg-neutral-50 px-2 text-[10px] font-bold"
                    >
                      <option value="Sedang berjalan">Sedang berjalan</option>
                      <option value="Belum dimulai">Belum dimulai</option>
                      <option value="Selesai">Selesai</option>
                      <option value="Ditunda">Ditunda</option>
                    </select>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Kendala"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      Dampak & Masalah
                    </label>
                    <Input
                      type="text"
                      value={it.dampak || ''}
                      onChange={(e) => handleUpdateItem(idx, 'dampak', e.target.value)}
                      disabled={readOnly}
                      placeholder="Dampak..."
                      className="text-xs h-7"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      Rencana Tindak Lanjut *
                    </label>
                    <Input
                      type="text"
                      value={it.tindak_lanjut}
                      onChange={(e) => handleUpdateItem(idx, 'tindak_lanjut', e.target.value)}
                      disabled={readOnly}
                      placeholder="Tindak lanjut..."
                      className="text-xs h-7 font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      Penanggung Jawab
                    </label>
                    <Input
                      type="text"
                      value={it.penanggung_jawab || ''}
                      onChange={(e) => handleUpdateItem(idx, 'penanggung_jawab', e.target.value)}
                      disabled={readOnly}
                      placeholder="Penanggung jawab..."
                      className="text-xs h-7"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase">
                      Target Penyelesaian
                    </label>
                    <Input
                      type="text"
                      value={it.target_penyelesaian || ''}
                      onChange={(e) => handleUpdateItem(idx, 'target_penyelesaian', e.target.value)}
                      disabled={readOnly}
                      placeholder="Target waktu..."
                      className="text-xs h-7"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
