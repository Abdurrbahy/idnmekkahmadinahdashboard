import React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Target, Sparkles, Plus, Trash2 } from 'lucide-react'
import type {
  FokusPekanDepanData,
  FokusPekanDepanItem,
} from '@/types/weeklyReportTemplate'
import { DEFAULT_FOKUS_PEKAN_DEPAN } from '@/types/weeklyReportTemplate'

interface SectionFokusBerikutnyaProps {
  data: FokusPekanDepanData
  onChange: (newData: FokusPekanDepanData) => void
  readOnly?: boolean
}

export const SectionFokusBerikutnya: React.FC<SectionFokusBerikutnyaProps> = ({
  data,
  onChange,
  readOnly = false,
}) => {
  const handleApplyTemplate = () => {
    if (readOnly) return
    const templateItems: FokusPekanDepanItem[] = DEFAULT_FOKUS_PEKAN_DEPAN.map((item, idx) => ({
      ...item,
      id: `fokus-${idx + 1}-${Date.now()}`,
    }))
    onChange({
      items: templateItems,
    })
  }

  const handleUpdateItem = (index: number, field: keyof FokusPekanDepanItem, value: any) => {
    if (readOnly) return
    const updated = [...data.items]
    if (updated[index]) {
      updated[index] = {
        ...updated[index],
        [field]: value,
      }
      onChange({
        items: updated,
      })
    }
  }

  const handleAddItem = () => {
    if (readOnly) return
    const newItem: FokusPekanDepanItem = {
      id: `fokus-${Date.now()}`,
      kategori: 'Program Umum',
      judul: '',
      deskripsi_target: '',
      rencana_tindakan: '',
      indikator_keberhasilan: '',
      status: 'rencana',
    }
    onChange({
      items: [...data.items, newItem],
    })
  }

  const handleDeleteItem = (index: number) => {
    if (readOnly) return
    const updated = data.items.filter((_, i) => i !== index)
    onChange({
      items: updated,
    })
  }

  return (
    <Card className="border-neutral-200/90 shadow-2xs bg-white">
      <CardHeader className="border-b border-neutral-100 pb-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-neutral-800" />
            <div>
              <CardTitle className="text-base font-bold text-neutral-900">
                Bagian 10 — Fokus Pekan Berikutnya (5 Program Utama)
              </CardTitle>
              <CardDescription className="text-xs text-neutral-500">
                Perencanaan target program pekan depan mencakup Qur'an, Mutabaah, Arabic Speaking, Kedisiplinan, dan Dokumentasi.
              </CardDescription>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyTemplate}
                className="text-xs font-semibold gap-1.5 h-8 border-neutral-300 hover:bg-neutral-50"
              >
                <Sparkles className="h-3 w-3 text-amber-500" />
                Gunakan Template Fokus
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="text-xs font-semibold gap-1.5 h-8 border-neutral-300 hover:bg-neutral-50"
              >
                <Plus className="h-3 w-3" />
                Tambah Fokus
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {data.items.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-400 flex flex-col items-center gap-2">
            <Target className="h-8 w-8 text-neutral-300 stroke-1" />
            <span>Belum ada target fokus pekan berikutnya yang diisi.</span>
            {!readOnly && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyTemplate}
                className="text-xs font-semibold mt-1"
              >
                Klik untuk gunakan 5 template fokus standar PDF
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {data.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-4 rounded-xl border border-neutral-200/90 bg-neutral-50/40 space-y-3 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-neutral-900 text-white text-[10px] font-bold">
                      {idx + 1}
                    </Badge>
                    <span className="text-xs font-extrabold text-neutral-800">
                      {item.kategori}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={item.status}
                      onChange={(e) => handleUpdateItem(idx, 'status', e.target.value)}
                      disabled={readOnly}
                      className="h-6 rounded border border-neutral-200 bg-white px-2 text-[10px] font-bold"
                    >
                      <option value="rencana">Rencana</option>
                      <option value="proses">Proses</option>
                      <option value="selesai">Selesai</option>
                    </select>

                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(idx)}
                        className="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Hapus Fokus"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-0.5">
                      Judul Fokus Target
                    </label>
                    <Input
                      type="text"
                      value={item.judul}
                      onChange={(e) => handleUpdateItem(idx, 'judul', e.target.value)}
                      disabled={readOnly}
                      placeholder="Judul fokus..."
                      className="text-xs h-7 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-0.5">
                      Deskripsi Target Pencapaian
                    </label>
                    <Input
                      type="text"
                      value={item.deskripsi_target}
                      onChange={(e) => handleUpdateItem(idx, 'deskripsi_target', e.target.value)}
                      disabled={readOnly}
                      placeholder="Deskripsi target..."
                      className="text-xs h-7"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-0.5">
                      Rencana Tindakan Operasional
                    </label>
                    <Input
                      type="text"
                      value={item.rencana_tindakan}
                      onChange={(e) => handleUpdateItem(idx, 'rencana_tindakan', e.target.value)}
                      disabled={readOnly}
                      placeholder="Langkah tindakan..."
                      className="text-xs h-7"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-600 block mb-0.5">
                      Indikator Keberhasilan
                    </label>
                    <Input
                      type="text"
                      value={item.indikator_keberhasilan}
                      onChange={(e) => handleUpdateItem(idx, 'indikator_keberhasilan', e.target.value)}
                      disabled={readOnly}
                      placeholder="Indikator target tercapai..."
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
